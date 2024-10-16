import { Middleware, RouterMiddleware } from "oak";
import * as Core from "kkmm-core";

import { games } from "../core/datas.ts";
import type { ExpGame } from "../core/expKakomimasu.ts";
import { StateData } from "../core/util.ts";

import { StatePic, StateToken } from "./_util.ts";
import {
  Match,
  MatchesRes,
  PriorMatch,
  PriorMatchesRes,
  UpdateActionReq,
  UpdateActionRes,
} from "./types.ts";

export const priorMatches: Middleware<StateToken> = (ctx) => {
  const authedUser = ctx.state.user;

  const matches = games.filter((game) => {
    if (game.isEnded()) return false;
    const user = game.players.find((player) => {
      return player.id === authedUser.id;
    });
    if (user === undefined) return false;
    return true;
  }).flatMap((game) => {
    const myIdx = game.players.flatMap((player, i) => {
      if (player.id === authedUser.id) return [i];
      else return [];
    });
    const matches: PriorMatch[] = myIdx.map((idx) => {
      const oppoUser = game.players.filter((_, i) => i !== idx).map((player) =>
        player.id
      );

      return {
        id: game.id,
        intervalMillis: game.transitionSec * 1000,
        matchTo: oppoUser.join(","),
        teamID: parseInt(game.players[idx].pic),
        turnMillis: game.operationSec * 1000,
        turns: game.totalTurn,
        index: idx,
      };
    });
    return [...matches];
  });

  const body: PriorMatchesRes = matches;

  ctx.response.status = 200;
  ctx.response.body = body;
};

export const matches: RouterMiddleware<
  "/matches/:id",
  { id: string },
  StatePic
> = (
  ctx,
) => {
  const id = ctx.params.id;
  const pic = ctx.state.pic;

  const game = games.find((game) => game.id === id);
  if (game?.players.find((player) => player.pic === pic) === undefined) {
    ctx.response.status = 400;
    ctx.response.body = { status: "InvalidMatches" };
    return;
  }
  if (game.isGaming() === false && game.isEnded() === false) {
    ctx.response.status = 400;
    ctx.response.body = {
      status: "TooEarly",
      startAtUnixTime: game.startedAtUnixTime ?? undefined,
    };
    return;
  }

  const actions = getActions(game);

  const points: number[][] = new Array(game.field.height);
  const tiled: number[][] = new Array(game.field.height);
  for (let y = 0; y < game.field.height; y++) {
    points[y] = new Array(game.field.width);
    tiled[y] = new Array(game.field.width);
    for (let x = 0; x < game.field.width; x++) {
      const idx = y * game.field.height + x;
      points[y][x] = game.field.points[idx];
      const tile = game.field.tiles[idx];
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
        agentID: getAgentID(playerIdx, agentIdx, game.field.nAgent),
        x: agent.x,
        y: agent.y,
      };
    });
    const { areaPoint, wallPoint: tilePoint } = playerPoints[playerIdx];
    const teamID = player.pic === pic ? parseInt(player.pic) : 0;
    return {
      agents,
      areaPoint,
      teamID,
      tilePoint,
    };
  });

  const body: MatchesRes = {
    actions,
    height: game.field.height,
    points,
    startedAtUnixTime,
    teams,
    tiled,
    turn: game.turn,
    width: game.field.width,
  };
  ctx.response.body = body;
};

export const updateAction: RouterMiddleware<
  "/matches/:id/action",
  { id: string },
  StateData<UpdateActionReq> & StatePic
> = (
  ctx,
) => {
  const id = ctx.params.id;
  const pic = ctx.state.pic;

  const game = games.find((game) => game.id === id);
  const playerIdx = game?.players.findIndex((player) => player.pic === pic) ??
    -1;
  const player = playerIdx >= 0 ? game?.players[playerIdx] : undefined;
  if (game === undefined || player === undefined) {
    ctx.response.status = 400;
    ctx.response.body = { status: "InvalidMatches" };
    return;
  }
  if (game.isGaming() === false && game.isEnded() === false) {
    ctx.response.status = 400;
    ctx.response.body = {
      status: "TooEarly",
      startAtUnixTime: game.startedAtUnixTime ?? undefined,
    };
    return;
  }
  if (game.isEnded() || game.isTransitionStep()) {
    ctx.response.status = 400;
    ctx.response.body = {
      status: "UnacceptableTime",
      startAtUnixTime: game.startedAtUnixTime,
    };
    return;
  }

  const actions = ctx.state.data;
  const newActions = player.actions;

  const resActions: UpdateActionRes["actions"] = [];
  const nowTurn = game.turn;

  actions.map((action) => {
    const coreAgentId = getCoreAgentId(action.agentID, game.field.nAgent);
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
      a.agentId === coreAgentId
    );
    if (actionIdx === -1) {
      newActions.push(newAction);
    } else {
      newActions[actionIdx] = newAction;
    }

    resActions.push({
      ...action,
      turn: nowTurn,
    });
  });

  ctx.response.status = 201;
  ctx.response.body = { actions: resActions };
};

function getActions(game: ExpGame) {
  if (game.isFree()) return []; // ゲーム開始前はアクションは必ず空配列
  const playerNum = game.field.nPlayer;
  const agentNum = game.field.nAgent;
  const prevAxisList: ({ x: number; y: number } | null)[] = new Array(
    playerNum * agentNum,
  );
  prevAxisList.fill(null);

  const actions = game.log.flatMap((turnLog, turnIdx) => {
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
        return { agentID: agentId, dx, dy, type, apply, turn: turnIdx + 1 };
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
