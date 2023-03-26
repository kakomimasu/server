import { Context, Core, Router } from "../deps.ts";

import { nowUnixTime } from "../core/util.ts";
import { accounts, kkmm, tournaments } from "../core/datas.ts";
import { errors, ServerError } from "../core/error.ts";
import { getAllBoards, getBoard } from "../core/firestore.ts";
import { ExpGame, Player } from "../core/expKakomimasu.ts";
import { env } from "../core/env.ts";
import { ResponseType, SchemaType } from "../util/openapi-type.ts";
import { aiList } from "./parts/ai-list.ts";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { auth } from "./middleware.ts";
import { openapi, validator } from "./parts/openapi.ts";

type ActionRes = ResponseType<
  "/matches/{gameId}/actions",
  "patch",
  "200",
  "application/json",
  typeof openapi
>;
type AiMatchRes = ResponseType<
  "/matches/ai/players",
  "post",
  "200",
  "application/json",
  typeof openapi
>;
type FreeMatchRes = ResponseType<
  "/matches/free/players",
  "post",
  "200",
  "application/json",
  typeof openapi
>;
type GameIdMatchRes = ResponseType<
  "/matches/{gameId}/players",
  "post",
  "200",
  "application/json",
  typeof openapi
>;
type IGame = SchemaType<
  typeof openapi["components"]["schemas"]["Game"],
  typeof openapi
>;

const boardname = env.BOARDNAME; // || "E-1"; // "F-1" "A-1"

const getRandomBoard = async () => {
  const list = await getAllBoards(); //Deno.readDir(resolve("./board"));
  return list[Math.floor(Math.random() * list.length)];
};

const createPlayer = (
  ctx: Context,
  reqData: { guestName?: string; spec?: string },
) => {
  const authedUserId = ctx.state.authed_userId as string;
  const user = accounts.getUsers().find((user) => user.id === authedUserId);
  if (!user) {
    if (reqData.guestName) {
      const name = reqData.guestName;
      return new Player(name, reqData.spec, "guest");
    } else {
      throw new ServerError(errors.NOT_USER);
    }
  } else {
    return new Player(user.id, reqData.spec);
  }
};

export const router = new Router();

router.get("/", (ctx) => {
  const sp = ctx.request.url.searchParams;

  let limit: number | undefined = undefined;
  if (sp.has("limit")) {
    limit = Number(sp.get("limit"));
  }

  let sortFn: (a: ExpGame, b: ExpGame) => number = (_a, _b) => 0;
  if (sp.has("sort")) {
    const name = sp.get("sort");
    if (name === "startedAtUnixTime") {
      sortFn = (a, b) =>
        (b.startedAtUnixTime ?? Number.MAX_VALUE) -
        (a.startedAtUnixTime ?? Number.MAX_VALUE);
    }
  }

  let games = [...kkmm.getGames()];
  games.sort(sortFn);
  games = games.slice(0, limit);
  ctx.response.body = games;
});

router.post(
  "/",
  contentTypeFilter("application/json"),
  auth({ bearer: true, required: false }),
  jsonParse(),
  async (ctx) => {
    const reqJson = ctx.state.data;
    const isValid = validator.validateRequestBody(
      reqJson,
      "/matches",
      "post",
      "application/json",
    );
    if (!isValid) throw new ServerError(errors.INVALID_REQUEST);

    const board = await getBoard(reqJson.boardName);
    if (!board) throw new ServerError(errors.INVALID_BOARD_NAME);
    board.nplayer = reqJson.nPlayer || 2;

    let game: ExpGame;
    if (!reqJson.dryRun) {
      game = new ExpGame(board, reqJson.name);
      kkmm.addGame(game);
      game.wsSend();
    } else game = new ExpGame(board, reqJson.name);

    if (reqJson.isPersonal) {
      const authedUserId = ctx.state.authed_userId as string;
      console.log(authedUserId);
      if (authedUserId) game.setType("personal", authedUserId);
      else {
        throw new ServerError(errors.UNAUTHORIZED);
      }
    } else game.setType("self");

    if (reqJson.playerIdentifiers) {
      const userIds = reqJson.playerIdentifiers.map((e) => {
        const id = accounts.find(e)?.id;
        if (!id) throw new ServerError(errors.NOT_USER);
        return id;
      });
      userIds.forEach((userId) => {
        if (!game.addReservedUser(userId)) {
          throw new ServerError(errors.ALREADY_REGISTERED_USER);
        }
      });
    }
    if (reqJson.tournamentId) {
      const tournament = tournaments.get(reqJson.tournamentId);
      if (!tournament) throw new ServerError(errors.INVALID_TOURNAMENT_ID);

      if (!reqJson.dryRun) {
        tournaments.addGame(reqJson.tournamentId, game.uuid);
      }
    }

    const body: IGame = game.toJSON();
    ctx.response.body = body;
    //console.log(kkmm_self);
  },
);

router.get("/:id", (ctx) => {
  const id = ctx.params.id;
  const game = kkmm.getGames().find((item) => item.uuid === id);
  if (!game) throw new ServerError(errors.NOT_GAME);
  if (game.isTransitionStep()) {
    throw new ServerError(errors.DURING_TRANSITION_STEP);
  }

  const body: IGame = game.toJSON();
  ctx.response.body = body;
});

router.patch(
  "/:gameId/actions",
  contentTypeFilter("application/json"),
  jsonParse(),
  (ctx) => {
    //console.log(req, "SetAction");

    // Actionを受け取った時刻を取得
    const reqTime = nowUnixTime();

    const gameId = ctx.params.gameId;

    const game = kkmm.getGames().find((item) => item.uuid === gameId);
    if (!game) throw new ServerError(errors.NOT_GAME);

    if (game.isTransitionStep()) {
      throw new ServerError(errors.DURING_TRANSITION_STEP);
    }

    const actionData = ctx.state.data;
    const isValid = validator.validateRequestBody(
      actionData,
      "/matches/{gameId}/actions",
      "patch",
      "application/json",
    );
    if (!isValid) throw new ServerError(errors.INVALID_REQUEST);

    const pic = ctx.request.headers.get("Authorization");
    const player = game.players.find((player) => player.pic === pic);
    if (!player) throw new ServerError(errors.INVALID_USER_AUTHORIZATION);

    const getType = (type: string) => {
      if (type === "PUT") return Core.Action.PUT;
      else if (type === "NONE") return Core.Action.NONE;
      else if (type === "MOVE") return Core.Action.MOVE;
      else if (type === "REMOVE") return Core.Action.REMOVE;
      return Core.Action.NONE;
    };

    const newActions = player.actions;
    actionData.actions.map((action) => {
      const newAction = new Core.Action(
        action.agentId,
        getType(action.type),
        ("x" in action) ? action.x : 0,
        ("y" in action) ? action.y : 0,
      );
      const actionIdx = newActions.findIndex((a) =>
        a.agentid === action.agentId
      );
      if (actionIdx === -1) {
        newActions.push(newAction);
      } else {
        newActions[actionIdx] = newAction;
      }
    });

    let nowTurn;
    if (!actionData.dryRun) {
      nowTurn = player.setActions(newActions);
    } else {
      nowTurn = game.turn;
    }

    const resData: ActionRes = {
      receptionUnixTime: reqTime,
      turn: nowTurn,
    };

    ctx.response.body = resData;
  },
);

router.post(
  "/free/players",
  contentTypeFilter("application/json"),
  auth({ bearer: true, required: false }),
  jsonParse(),
  async (ctx) => {
    const reqData = ctx.state.data;
    const isValid = validator.validateRequestBody(
      reqData,
      "/matches/free/players",
      "post",
      "application/json",
    );
    if (!isValid) {
      throw new ServerError(errors.INVALID_REQUEST);
    }
    //console.log(reqData);

    const player = createPlayer(ctx, reqData);

    const freeGame = kkmm.getFreeGames();
    if (!reqData.dryRun) {
      if (freeGame.length === 0) {
        const bname = boardname;
        const brd = bname ? await getBoard(bname) : await getRandomBoard(); //readBoard(bname);
        if (!brd) throw new ServerError(errors.INVALID_BOARD_NAME);
        const game = new ExpGame(brd);
        //const game = kkmm.createGame(brd);
        freeGame.push(game);
        kkmm.addGame(game);
      }
      freeGame[0].attachPlayer(player);
      //console.log(player);
    }

    const { gameId, ...rawRes } = player.getJSON();
    const res: FreeMatchRes = {
      ...rawRes,
      gameId: gameId ?? crypto.randomUUID(),
    }; // dry-run用にgameIdを設定
    ctx.response.body = res;
  },
);

router.post(
  "/ai/players",
  contentTypeFilter("application/json"),
  auth({ bearer: true, required: false }),
  jsonParse(),
  async (ctx) => {
    const reqData = ctx.state.data;
    const isValid = validator.validateRequestBody(
      reqData,
      "/matches/ai/players",
      "post",
      "application/json",
    );
    if (!isValid) {
      throw new ServerError(errors.INVALID_REQUEST);
    }
    //console.log(reqData);

    const player = createPlayer(ctx, reqData);

    const ai = aiList.find((e) => e.name === reqData.aiName);
    if (!ai) throw new ServerError(errors.NOT_AI);
    const bname = reqData.boardName || boardname;
    const brd = bname ? await getBoard(bname) : await getRandomBoard(); //readBoard(bname);
    if (!brd) throw new ServerError(errors.INVALID_BOARD_NAME);
    if (!reqData.dryRun) {
      const game = new ExpGame(brd);
      kkmm.addGame(game);
      if (player.type === "account") {
        const authedUserId = ctx.state.authed_userId as string;
        const user = accounts.getUsers().find((user) =>
          user.id === authedUserId
        );

        game.name =
          `対AI戦：${user?.screenName}(@${user?.name}) vs AI(${ai.name})`;
      } else {
        game.name = `対AI戦：${player.id} vs AI(${ai.name})`;
      }
      game.attachPlayer(player);
      //accounts.addGame(user.userId, game.uuid);

      const aiClient = new ai.client();
      const aiPlayer = new Player(ai.name, "");
      game.ai = aiClient;
      game.attachPlayer(aiPlayer);
    }

    const { gameId, ...rawRes } = player.getJSON();
    const res: AiMatchRes = {
      ...rawRes,
      gameId: gameId ?? crypto.randomUUID(),
    }; // dry-run用にgameIdを設定
    ctx.response.body = res;
  },
);

router.post(
  "/:id/players",
  contentTypeFilter("application/json"),
  auth({ bearer: true, required: false }),
  jsonParse(),
  (ctx) => {
    const reqData = ctx.state.data;
    const isValid = validator.validateRequestBody(
      reqData,
      "/matches/{gameId}/players",
      "post",
      "application/json",
    );
    if (!isValid) {
      throw new ServerError(errors.INVALID_REQUEST);
    }
    //console.log(reqData);
    const gameId = ctx.params.id;

    const player = createPlayer(ctx, reqData);

    const game = kkmm.getGames().find((game) => game.uuid === gameId);
    if (!game) throw new ServerError(errors.NOT_GAME);
    if (!reqData.dryRun) {
      if (game.attachPlayer(player) === false) {
        throw new ServerError(errors.NOT_FREE_GAME);
        //throw Error("Game is not free");
      }
    }
    //accounts.addGame(user.userId, game.uuid);

    const { gameId: pGameId, ...rawRes } = player.getJSON();
    const res: GameIdMatchRes = {
      ...rawRes,
      gameId: pGameId ?? crypto.randomUUID(),
    }; // dry-run用にgameIdを設定
    ctx.response.body = res;
  },
);
