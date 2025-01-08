import { createMiddleware } from "hono/factory";
import { errors, ServerError } from "../core/error.ts";

export type UnknownRequest<T> = Record<keyof T, unknown>;

export const contentTypeFilter = (
  ...types: (string | RegExp)[]
) =>
  createMiddleware(async (ctx, next) => {
    if (types.some((v) => ctx.req.header("content-type")?.match(v))) {
      await next();
      return;
    }
    throw new ServerError(errors.INVALID_CONTENT_TYPE);
  });

export const jsonParse = () =>
  // TODO: coreのutilに移行
  // deno-lint-ignore no-explicit-any
  createMiddleware<{ Variables: { data: any } }>(async (ctx, next) => {
    try {
      const reqJson = await ctx.req.json();
      ctx.set("data", reqJson ?? {});
    } catch (_e) {
      throw new ServerError(errors.INVALID_SYNTAX);
    }
    await next();
  });
