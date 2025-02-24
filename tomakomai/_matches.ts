import { type Handler } from "@hono/hono";
import * as Core from "kkmm-core";

import { games } from "../core/datas.ts";
import type { ExpGame } from "../core/expKakomimasu.ts";
import { nowUnixTime, StateData } from "../core/util.ts";

import { getMatches, StatePic, StateToken } from "./_util.ts";
import {
  Match,
  MatchesRes,
  PriorMatchesRes,
  UpdateActionReq,
  UpdateActionRes,
} from "./types.ts";

export const priorMatches: Handler<{ Variables: StateToken }> = (ctx) => {
  const authedUser = ctx.get("user");

  const body: PriorMatchesRes = {
    matches: getMatches(authedUser.id),
  };
  return ctx.json(body, 200);
};

export const matches: Handler<
  { Variables: StatePic },
  "/matches/:id"
> = (
  ctx,
) => {
  const id = ctx.req.param("id");
  const pic = ctx.get("pic");

  const game = games.find((game) => game.id === id);
  if (game?.players.find((player) => player.pic === pic) === undefined) { // 参加していない試合に対するリクエスト、また存在しない試合IDの場合
    return new Response(null, { status: 404 });
  }
  if (game.isGaming() === false && game.isEnded() === false) { // 試合開始前のリクエストの場合
    const retryTime = game.startedAtUnixTime === null
      ? 0
      : game.startedAtUnixTime - nowUnixTime();
    ctx.res.headers.append("Retry-After", retryTime.toString());
    return new Response(null, { status: 425 });
  }

  const startedAtUnixTime = game.startedAtUnixTime as number;

  const playerPoints = game.field.getPoints();
  const teams = game.players.map((player, playerIdx) => {
    const agents = player.agents.map((agent, agentIdx) => {
      return {
        x: agent.x + 1,
        y: agent.y + 1,
        agentID: getAgentID(playerIdx, agentIdx, game.field.nAgent),
      };
    });
    const { areaPoint, wallPoint } = playerPoints[playerIdx];
    return {
      teamID: pic === player.pic ? parseInt(player.pic) : 0,
      agent: game.field.nAgent,
      agents,
      areaPoint,
      wallPoint,
    };
  });

  const walls: number[][] = new Array(game.field.height);
  const areas: number[][] = new Array(game.field.height);
  const points: number[][] = new Array(game.field.height);
  for (let y = 0; y < game.field.height; y++) {
    walls[y] = new Array(game.field.width);
    areas[y] = new Array(game.field.width);
    points[y] = new Array(game.field.width);
    for (let x = 0; x < game.field.width; x++) {
      const idx = y * game.field.height + x;
      points[y][x] = game.field.points[idx];
      const tile = game.field.tiles[idx];
      if (tile.type === Core.Field.WALL && tile.player !== null) {
        walls[y][x] = tile.player + 1;
      } else {
        walls[y][x] = 0;
      }
      if (tile.type === Core.Field.AREA && tile.player !== null) {
        areas[y][x] = tile.player + 1;
      } else {
        areas[y][x] = 0;
      }
    }
  }
  const actions = getActions(game);

  const body: MatchesRes = {
    turn: game.turn,
    startedAtUnixTime,
    width: game.field.width,
    height: game.field.height,
    teams,
    walls,
    areas,
    points,
    actions,
  };
  return ctx.json(body);
};

export const updateAction: Handler<
  { Variables: StateData<UpdateActionReq> & StatePic },
  "/matches/:id/action"
> = (
  ctx,
) => {
  const id = ctx.req.param("id");
  const pic = ctx.get("pic");

  const game = games.find((game) => game.id === id);
  const playerIdx = game?.players.findIndex((player) => player.pic === pic) ??
    -1;
  const player = playerIdx >= 0 ? game?.players[playerIdx] : undefined;
  if (game === undefined || player === undefined) { // 参加していない試合に対するリクエスト、また存在しない試合IDの場合
    return new Response(null, { status: 404 });
  }
  if (game.isGaming() === false && game.isEnded() === false) { // 試合開始前のリクエストの場合
    const retryTime = game.startedAtUnixTime === null
      ? 0
      : game.startedAtUnixTime - nowUnixTime();
    ctx.res.headers.append("Retry-After", retryTime.toString());
    return new Response(null, { status: 425 });
  }
  if (game.isEnded() || game.isTransitionStep()) { // ターンとターンの間の時間や試合終了後にアクセスした場合
    return new Response(null, { status: 400 });
  }

  const actions = ctx.get("data");
  const newActions = player.actions;

  const body: UpdateActionRes = { actions: [] };
  const nowTurn = game.turn;
  try {
    actions.map((action) => {
      const coreAgentId = getCoreAgentId(
        action.agentID,
        game.field.nAgent,
        playerIdx,
      );
      if (coreAgentId === undefined) {
        throw Error("invalid agentID");
      }
      const type = getTypeFromString(action.type);

      const newAction = new Core.Action(
        coreAgentId,
        type,
        action.x,
        action.y,
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

      body.actions.push({
        ...action,
        turn: nowTurn,
      });
    });
  } catch (_) { // リクエストの中に自分のエージェント以外を指定したアクションが含まれる場合
    return new Response(null, { status: 400 });
  }

  return ctx.json(body, 202);
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
        return {
          x: action.x,
          y: action.y,
          type,
          turn: turnIdx + 1,
          agentID: agentId,
          apply,
        };
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

function getCoreAgentId(agentID: number, agentNum: number, playerIdx: number) {
  const agentId = agentID - playerIdx * agentNum;
  if (agentId < 0 || agentId >= agentNum) return undefined;
  return agentId;
}
