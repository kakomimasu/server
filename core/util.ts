import { Middleware } from "../deps.ts";

import { errors, ServerError } from "./error.ts";

export type PartiallyPartial<T, K extends keyof T> =
  & Omit<T, K>
  & Partial<Pick<T, K>>;

export const nowUnixTime = () => {
  return Math.floor(new Date().getTime() / 1000);
};

export const randomUUID = () => crypto.randomUUID();

export type StateData<T> = { data: T };

export const jsonParse = <T>(): Middleware<StateData<T>> =>
  async (ctx, next) => {
    const contentType = ctx.request.headers.get("content-type");
    if (contentType === null || contentType !== "application/json") {
      throw new ServerError(errors.INVALID_CONTENT_TYPE);
    }
    try {
      const reqJson = await ctx.request.body({ type: "json" }).value;
      ctx.state.data = reqJson;
    } catch (_e) {
      throw new ServerError(errors.INVALID_SYNTAX);
    }
    await next();
  };
