import { Context, Middleware } from "../deps.ts";

import { accounts, type User } from "../core/datas.ts";

export const getToken = (ctx: Context) => {
  return ctx.request.headers.get("Authorization");
};

export type StateToken = { user: User };

export const checkToken: Middleware<StateToken> = async (ctx, next) => {
  const token = getToken(ctx) ?? "";
  const authedUser = accounts.getWithAuth(token);
  if (authedUser) {
    ctx.state.user = authedUser;
    await next();
  } else {
    ctx.response.status = 401;
    ctx.response.body = {
      status: "InvalidToken",
    };
  }
};
