import { type Context } from "@hono/hono";
import { createMiddleware } from "hono/factory";

import { accounts, type User } from "../core/datas.ts";

import type { FailureInvalidToken } from "./types.ts";

const invalidTokenBody: FailureInvalidToken = { status: "InvalidToken" };

const getAuth = (ctx: Context) => {
  return ctx.req.header("Authorization");
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
      return ctx.json(invalidTokenBody, 401);
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
      return ctx.json(invalidTokenBody, 401);
    }
  },
);
