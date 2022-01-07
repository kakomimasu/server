import { Core, Router } from "../deps.ts";

import { contentTypeFilter, jsonParse } from "./util.ts";

import { accounts } from "./user.ts";
import { sendGame } from "./ws.ts";
import { errors, ServerError } from "./error.ts";
import { kkmm } from "../server.ts";
import { aiList } from "./parts/ai-list.ts";
import { nonReqEnv } from "./parts/env.ts";
import {
  ActionPost as IActionPost,
  ActionReq,
  ActionRes,
  MatchReq,
  MatchRes,
} from "./types.ts";
import { auth } from "./middleware.ts";
import { ExpGame, Player } from "./parts/expKakomimasu.ts";

const boardname = nonReqEnv.boardname; // || "E-1"; // "F-1" "A-1"
import { getAllBoards, getBoard } from "./parts/firestore_opration.ts";

const getRandomBoard = async () => {
  const list = await getAllBoards(); //Deno.readDir(resolve("./board"));
  return list[Math.floor(Math.random() * list.length)];
};

class ActionPost implements IActionPost {
  constructor(
    public agentId: number,
    public type: string,
    public x: number,
    public y: number,
  ) {}

  static isEnable(a: ActionPost) {
    if (
      a.agentId === undefined || a.type === undefined || a.x === undefined ||
      a.y === undefined
    ) {
      return false;
    } else return true;
  }
}

export const matchRouter = () => {
  const router = new Router();

  router.post(
    "/",
    contentTypeFilter("application/json"),
    auth({ bearer: true }),
    jsonParse(),
    async (ctx) => {
      const reqData = ctx.state.data as Partial<MatchReq>;
      //console.log(reqData);
      const authedUserId = ctx.state.authed_userId as string;

      const user = accounts.getUsers().find((user) => user.id === authedUserId);
      let player;
      if (!user) {
        if (reqData.guest) {
          const { name } = reqData.guest;
          player = new Player(name, reqData.spec);
        } else {
          throw new ServerError(errors.NOT_USER);
        }
      } else {
        player = new Player(user.id, reqData.spec);
      }

      if (reqData.gameId) {
        const game = kkmm.getGames().find((
          game,
        ) => game.uuid === reqData.gameId);
        if (!game) throw new ServerError(errors.NOT_GAME);
        if (!reqData.option?.dryRun) {
          if (game.attachPlayer(player) === false) {
            throw new ServerError(errors.NOT_FREE_GAME);
            //throw Error("Game is not free");
          }
        }
        //accounts.addGame(user.userId, game.uuid);
      } else if (reqData.useAi) {
        const ai = aiList.find((e) => e.name === reqData.aiOption?.aiName);
        if (!ai) throw new ServerError(errors.NOT_AI);
        const bname = reqData.aiOption?.boardName || boardname;
        const brd = bname ? await getBoard(bname) : await getRandomBoard(); //readBoard(bname);
        if (!brd) throw new ServerError(errors.INVALID_BOARD_NAME);
        if (!reqData.option?.dryRun) {
          const game = new ExpGame(brd);
          kkmm.addGame(game);
          if (user) {
            game.name =
              `対AI戦：${user.screenName}(@${user.name}) vs AI(${ai.name})`;
          } else {
            game.name = `対AI戦：${player.id} vs AI(${ai.name})`;
          }
          game.changeFuncs.push(sendGame(game));
          game.attachPlayer(player);
          //accounts.addGame(user.userId, game.uuid);

          const aiClient = new ai.client();
          console.log("server new client");
          const aiPlayer = new Player(ai.name, "");
          game.ai = aiClient;
          game.attachPlayer(aiPlayer);
        }
      } else {
        const freeGame = kkmm.getFreeGames();
        if (!reqData.option?.dryRun) {
          if (freeGame.length === 0) {
            const bname = boardname;
            const brd = bname ? await getBoard(bname) : await getRandomBoard(); //readBoard(bname);
            if (!brd) throw new ServerError(errors.INVALID_BOARD_NAME);
            const game = new ExpGame(brd);
            //const game = kkmm.createGame(brd);
            game.changeFuncs.push(sendGame(game));
            freeGame.push(game);
            kkmm.addGame(game);
          }
          freeGame[0].attachPlayer(player);
          //console.log(player);
        }
      }
      const { gameId, ...rawRes } = player.getJSON();
      if (gameId === undefined) {
        throw new Error("gameId is not found"); // TODO: gameIdがundefinedになることはないはずだが、Playerクラス上はあり得る。どこかで型をチェックするべき
      }
      const res: MatchRes = { ...rawRes, gameId }; // 型チェックのために代入
      ctx.response.body = res;
    },
  );
  router.get("/:id", (ctx) => {
    const id = ctx.params.id;
    const game = kkmm.getGames().find((item) => item.uuid === id);
    if (!game) throw new ServerError(errors.NOT_GAME);
    ctx.response.body = game;
  });
  router.post(
    "/:gameId/action",
    contentTypeFilter("application/json"),
    auth({ bearer: true }),
    jsonParse(),
    (ctx) => {
      //console.log(req, "SetAction");

      // Actionを受け取った時刻を取得
      const reqTime = new Date().getTime() / 1000;

      const gameId = ctx.params.gameId;

      const game = kkmm.getGames().find((item) => item.uuid === gameId);
      if (!game) throw new ServerError(errors.NOT_GAME);

      const actionData = ctx.state.data as ActionReq;

      const pic = ctx.request.headers.get("Authorization");
      const player = game.players.find((player) => player.pic === pic);
      if (!player) throw new ServerError(errors.INVALID_USER_AUTHORIZATION);

      if (actionData.actions.some((a) => !ActionPost.isEnable(a))) {
        throw new ServerError(errors.INVALID_ACTION);
      }

      const getType = (type: string) => {
        if (type === "PUT") return Core.Action.PUT;
        else if (type === "NONE") return Core.Action.NONE;
        else if (type === "MOVE") return Core.Action.MOVE;
        else if (type === "REMOVE") return Core.Action.REMOVE;
        return Core.Action.NONE;
      };

      const actionsAry: [number, ReturnType<typeof getType>, number, number][] =
        actionData.actions.map((a) => [a.agentId, getType(a.type), a.x, a.y]);
      let nowTurn;
      if (!actionData.option?.dryRun) {
        nowTurn = player.setActions(Core.Action.fromJSON(actionsAry));
      } else {
        nowTurn = game.turn;
      }

      const resData: ActionRes = {
        receptionUnixTime: Math.floor(reqTime),
        turn: nowTurn,
      };

      ctx.response.body = resData;
    },
  );

  return router.routes();
};
