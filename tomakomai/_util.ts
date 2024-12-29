import { type Context } from "hono";
import { createMiddleware } from "hono/factory";

import { accounts, games, type User } from "../core/datas.ts";

import { PriorMatch } from "./types.ts";

const getAuth = (ctx: Context) => {
  return ctx.req.header("x-api-token");
};

export type StateToken = { user: User };
export type StatePic = { pic: string };

export const checkAuthToken = createMiddleware<{ Variables: StateToken }>(
  async (ctx, next) => {
    const token = getAuth(ctx) ?? "";
    const authedUser = accounts.getWithAuth(token);
    if (authedUser) {
      ctx.set("user", authedUser);
      await next();
    } else {
      return new Response(null, { status: 401 });
    }
  },
);

export const checkAuthPic = createMiddleware<{ Variables: StatePic }>(
  async (ctx, next) => {
    const pic = getAuth(ctx);
    if (pic) {
      ctx.set("pic", pic);
      await next();
    } else {
      return new Response(null, { status: 401 });
    }
  },
);

export const getMatches = (userId: string) => {
  const matches = games.filter((game) => {
    if (game.isEnded()) return false;
    const user = game.players.find((player) => {
      return player.type === "account" && player.id === userId;
    });
    if (user === undefined) return false;
    return true;
  }).flatMap((game) => {
    const myIdx = game.players.flatMap((player, i) => {
      if (player.id === userId) return [i];
      else return [];
    });
    const matches: PriorMatch[] = myIdx.map((idx) => {
      const teams = game.players.map((player) => {
        return { teamID: parseInt(player.pic), name: player.id };
      });
      // 自チーム（プレイヤー）を先頭に移動
      const myTeam = teams.splice(idx, 1);
      teams.splice(0, 0, myTeam[0]);
      for (let i = 1; i < teams.length; i++) {
        teams[i].teamID = 0;
      }

      return {
        matchID: game.id,
        teams,
        turns: game.turn,
        operationMillis: game.operationSec * 1000,
        transitionMillis: game.transitionSec * 1000,
      };
    });
    return [...matches];
  });
  return matches;
};
