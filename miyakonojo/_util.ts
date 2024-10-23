import { Context, Middleware } from "@oak/oak";

import { accounts, type User } from "../core/datas.ts";

import type { FailureInvalidToken } from "./types.ts";

const invalidTokenBody: FailureInvalidToken = { status: "InvalidToken" };

const getAuth = (ctx: Context) => {
  return ctx.request.headers.get("Authorization");
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
    ctx.response.body = invalidTokenBody;
  }
};

export const checkAuthPic: Middleware<StatePic> = async (ctx, next) => {
  const pic = getAuth(ctx);
  if (pic) {
    ctx.state.pic = pic;
    await next();
  } else {
    ctx.response.status = 401;
    ctx.response.body = invalidTokenBody;
  }
};
