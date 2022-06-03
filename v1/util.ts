import { Context } from "../deps.ts";
import { errors, ServerError } from "../core/error.ts";

export type UnknownRequest<T> = Record<keyof T, unknown>;

export const contentTypeFilter = (
  ...types: (string | RegExp)[]
) =>
  async (ctx: Context, next: () => Promise<unknown>) => {
    if (types.some((v) => ctx.request.headers.get("content-type")?.match(v))) {
      await next();
      return;
    }
    throw new ServerError(errors.INVALID_CONTENT_TYPE);
    //throw new RoutingError(400, "Invalid content-type");
  };

export const jsonParse = () =>
  // TODO: coreのutilに移行
  async (ctx: Context, next: () => Promise<unknown>) => {
    try {
      const reqJson = await ctx.request.body({ type: "json" }).value;
      ctx.state.data = reqJson;
    } catch (_e) {
      throw new ServerError(errors.INVALID_SYNTAX);
    }
    await next();
  };
