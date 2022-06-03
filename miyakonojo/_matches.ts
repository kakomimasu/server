import { Core, Middleware, RouterMiddleware } from "../deps.ts";

import { kkmm } from "../core/datas.ts";
import type { ExpGame } from "../core/expKakomimasu.ts";
import { StateData } from "../core/util.ts";

import { StateToken } from "./_util.ts";
import {
  Match,
  PriorMatch,
  UpdateActionReq,
  UpdateActionRes,
} from "./types.ts";

export const priorMatches: Middleware<StateToken> = (ctx) => {
  const authedUser = ctx.state.user;

  const matches: PriorMatch[] = kkmm.getGames().filter((game) => {
    if (game.ending) return false;
    if (!game.isReady()) return false;
    const user = game.players.filter((player) => {
      player.id === authedUser.id;
    });
    if (user.length !== 1) return false;
  }).map((game) => {
    const oppoUser = game.players.filter((player) => {
      player.id !== authedUser.id;
    }).map((player) => player.id);

    return {
      id: game.uuid,
      intervalMillis: 0,
      matchTo: oppoUser.join(","),
      teamID: authedUser.id,
      turnMillis: game.board.nsec,
      turns: game.board.nturn,
    };
  });

  ctx.response.status = 200;
  ctx.response.body = matches;
};

export const matches: RouterMiddleware<
  "/matches/:id",
  { id: string },
  StateToken
> = (
  ctx,
) => {
  const id = ctx.params.id;
  const authedUser = ctx.state.user;
  const game = kkmm.getGames().find((game) => game.uuid === id);
  if (
    game?.players.find((player) => player.id === authedUser.id) === undefined
  ) {
    ctx.response.status = 400;
    ctx.response.body = { status: "InvalidMatches" };
  } else {
    if (game.gaming === false && game.ending === false) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "TooEarly",
        startAtUnixTime: game.startedAtUnixTime,
      };
    } else {
      const actions = getActions(game);

      const points: number[][] = new Array(game.board.h);
      const tiled: number[][] = new Array(game.board.h);
      for (let y = 0; y < game.board.h; y++) {
        points[y] = new Array(game.board.w);
        tiled[y] = new Array(game.board.w);
        for (let x = 0; x < game.board.w; x++) {
          const idx = y * game.board.h + x;
          points[y][x] = game.board.points[idx];
          const tile = game.field.field[idx];
          if (tile.player !== null && tile.type === Core.Field.WALL) {
            tiled[y][x] = tile.player + 1;
          } else {
            tiled[y][x] = 0;
          }
        }
      }

      const playerPoints = game.field.getPoints();

      const startedAtUnixTime = game.startedAtUnixTime as number;

      const teams = game.players.map((player, playerIdx) => {
        const agents = player.agents.map((agent, agentIdx) => {
          return {
            agentID: getAgentID(playerIdx, agentIdx, game.board.nagent),
            x: agent.x,
            y: agent.y,
          };
        });
        const { basepoint: areaPoint, wallpoint: tilePoint } =
          playerPoints[playerIdx];
        return {
          agents,
          areaPoint,
          teamID: player.id,
          tilePoint,
        };
      });

      const body: Match = {
        actions,
        height: game.board.h,
        points,
        startedAtUnixTime,
        teams,
        tiled,
        turn: game.turn,
        width: game.board.w,
      };
      ctx.response.body = body;
    }
  }
};

export const updateAction: RouterMiddleware<
  "/matches/:id/action",
  { id: string },
  StateToken & StateData<UpdateActionReq>
> = (
  ctx,
) => {
  const id = ctx.params.id;
  const authedUser = ctx.state.user;
  const game = kkmm.getGames().find((game) => game.uuid === id);
  const playerIdx =
    game?.players.findIndex((player) => player.id === authedUser.id) ?? -1;
  const player = playerIdx >= 0 ? game?.players[playerIdx] : undefined;
  if (game === undefined || player === undefined) {
    ctx.response.status = 400;
    ctx.response.body = { status: "InvalidMatches" };
  } else {
    if (game.gaming === false && game.ending === false) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "TooEarly",
        startAtUnixTime: game.startedAtUnixTime,
      };
    } else if (game.gaming) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "UnacceptableTime",
        startAtUnixTime: game.startedAtUnixTime,
      };
    } else {
      const actions = ctx.state.data;
      const newActions = player.actions;

      const body: UpdateActionRes = [];
      const nowTurn = game.turn;

      actions.map((action) => {
        const coreAgentId = getCoreAgentId(action.agentID, game.board.nagent);
        const type = getTypeFromString(action.type);
        const agent = player.agents[coreAgentId];

        let x = 0, y = 0;
        if (type === Core.Action.PUT) {
          x = action.dx;
          y = action.dy;
        } else {
          if (agent) {
            x = agent.x + action.dx;
            y = agent.y + action.dy;
          }
        }
        const newAction = new Core.Action(
          coreAgentId,
          getTypeFromString(action.type),
          x,
          y,
        );
        const actionIdx = newActions.findIndex((a) =>
          // TODO: AddActionとして関数に出したらどうだろう
          a.agentid === coreAgentId
        );
        if (actionIdx === -1) {
          newActions.push(newAction);
        } else {
          newActions[actionIdx] = newAction;
        }

        body.push({
          ...action,
          turn: nowTurn,
        });
      });

      ctx.response.body = body;
    }
  }
};

function getActions(game: ExpGame) {
  if (!game.isReady()) return []; // ゲーム開始前はアクションは必ず空配列
  const playerNum = game.board.nplayer;
  const agentNum = game.board.nagent;
  const prevAxisList: ({ x: number; y: number } | null)[] = new Array(
    playerNum * agentNum,
  );
  prevAxisList.fill(null);

  const actions = game.log.flatMap((turnLog, turn) => {
    const turnActions = turnLog.players.flatMap((player, playerIdx) => {
      const actions: Match["actions"] = player.actions.map((action) => {
        const agentId = getAgentID(playerIdx, action.agentId, agentNum);
        const type = getTypeString(action.type);
        const apply = getApplyNum(action.res);
        let dx: number, dy: number;
        if (type === "put") {
          dx = action.x;
          dy = action.y;
        } else {
          const prevAxis: Readonly<typeof prevAxisList[number]> =
            prevAxisList[agentId];
          if (prevAxis === null) {
            dx = dy = 0;
          } else {
            dx = action.x - prevAxis.x;
            dy = action.y - prevAxis.y;
          }
        }
        if (apply === 1) {
          prevAxisList[agentId] = { x: dx, y: dy };
        }
        return { agentID: agentId, dx, dy, type, apply, turn };
      });
      return [...actions];
    });
    return [...turnActions];
  });
  return actions;
}

function getTypeString(type: Core.ActionType) {
  switch (type) {
    case Core.Action.PUT:
      return "put";
    case Core.Action.NONE:
      return "stay";
    case Core.Action.MOVE:
      return "move";
    case Core.Action.REMOVE:
      return "remove";
    default: {
      const _: never = type;
      return _;
    }
  }
}

function getTypeFromString(type: string) {
  if (type === "put") return Core.Action.PUT;
  else if (type === "stay") return Core.Action.NONE;
  else if (type === "move") return Core.Action.MOVE;
  else if (type === "remove") return Core.Action.REMOVE;
  return Core.Action.NONE;
}

function getApplyNum(type: 0 | 1 | 2 | 3 | 4 | 5): -1 | 0 | 1 {
  switch (type) {
    case Core.Action.SUCCESS:
      return 1;
    case Core.Action.REVERT:
    case Core.Action.ERR_ONLY_ONE_TURN:
    case Core.Action.ERR_ILLEGAL_AGENT:
    case Core.Action.ERR_ILLEGAL_ACTION:
      return -1;
    case Core.Action.CONFLICT:
      return 0;
    default: {
      const _: never = type;
      return _;
    }
  }
}

function getAgentID(playerIdx: number, agentIdx: number, agentNum: number) {
  return playerIdx * agentNum + agentIdx;
}

function getCoreAgentId(agentID: number, agentNum: number) {
  return agentID % agentNum;
}
