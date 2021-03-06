import { Core, Router } from "../deps.ts";

import { nowUnixTime } from "../core/util.ts";
import { contentTypeFilter, jsonParse } from "./util.ts";
import { accounts, kkmm } from "../core/datas.ts";
import { errors, ServerError } from "../core/error.ts";
import {
  ActionPost as IActionPost,
  ActionReq,
  ActionRes,
  Game as IGame,
  MatchReq,
  MatchRes,
} from "./types.ts";
import { auth } from "./middleware.ts";
import { aiList } from "./parts/ai-list.ts";
import { nonReqEnv } from "../core/env.ts";
import { ExpGame, Player } from "../core/expKakomimasu.ts";
import { getAllBoards, getBoard } from "../core/firestore.ts";

const boardname = nonReqEnv.boardname; // || "E-1"; // "F-1" "A-1"

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
    auth({ bearer: true, required: false }),
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
              `???AI??????${user.screenName}(@${user.name}) vs AI(${ai.name})`;
          } else {
            game.name = `???AI??????${player.id} vs AI(${ai.name})`;
          }
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
            freeGame.push(game);
            kkmm.addGame(game);
          }
          freeGame[0].attachPlayer(player);
          //console.log(player);
        }
      }
      const { gameId, ...rawRes } = player.getJSON();
      if (gameId === undefined) {
        throw new Error("gameId is not found"); // TODO: gameId???undefined???????????????????????????????????????Player????????????????????????????????????????????????????????????????????????
      }
      const res: MatchRes = { ...rawRes, gameId }; // ?????????????????????????????????
      ctx.response.body = res;
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
  router.post(
    "/:gameId/action",
    contentTypeFilter("application/json"),
    jsonParse(),
    (ctx) => {
      //console.log(req, "SetAction");

      // Action?????????????????????????????????
      const reqTime = nowUnixTime();

      const gameId = ctx.params.gameId;

      const game = kkmm.getGames().find((item) => item.uuid === gameId);
      if (!game) throw new ServerError(errors.NOT_GAME);

      if (game.isTransitionStep()) {
        throw new ServerError(errors.DURING_TRANSITION_STEP);
      }

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

      const newActions = player.actions;
      actionData.actions.map((action) => {
        const newAction = new Core.Action(
          action.agentId,
          getType(action.type),
          action.x,
          action.y,
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
      if (!actionData.option?.dryRun) {
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

  return router.routes();
};
