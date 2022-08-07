import { Context, Middleware } from "../deps.ts";

import { accounts, kkmm, type User } from "../core/datas.ts";

import { PriorMatch } from "./types.ts";

const getAuth = (ctx: Context) => {
  return ctx.request.headers.get("x-api-token");
};

export type StateToken = { user: User };
export type StatePic = { pic: string };

export const checkAuthToken: Middleware<StateToken> = async (ctx, next) => {
  const token = getAuth(ctx) ?? "";
  const authedUser = accounts.getWithAuth(token);
  if (authedUser) {
    ctx.state.user = authedUser;
    await next();
  } else {
    ctx.response.status = 401;
  }
};

export const checkAuthPic: Middleware<StatePic> = async (ctx, next) => {
  const pic = getAuth(ctx);
  if (pic) {
    ctx.state.pic = pic;
    await next();
  } else {
    ctx.response.status = 401;
  }
};

export const getMatches = (userId: string) => {
  const matches = kkmm.getGames().filter((game) => {
    if (game.ending) return false;
    const user = game.players.find((player) => {
      return player.id === userId;
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
        matchID: game.uuid,
        teams,
        turns: game.turn,
        operationMillis: game.operationSec() * 1000,
        transitionMillis: game.transitionSec() * 1000,
      };
    });
    return [...matches];
  });
  return matches;
};
