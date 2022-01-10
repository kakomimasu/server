import { Context, fromFileUrl } from "../deps.ts";
import { errors, ServerError } from "./error.ts";

export const jsonResponse = <T>(json: T) => {
  return {
    status: 200,
    headers: new Headers({
      "content-type": "application/json",
    }),
    body: JSON.stringify(json),
  };
};

export const readJsonFileSync = (path: string | URL) => {
  return JSON.parse(Deno.readTextFileSync(path));
};

export function pathResolver(meta: ImportMeta): (p: string) => string {
  return (p) => fromFileUrl(new URL(p, meta.url));
}

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
  async (ctx: Context, next: () => Promise<unknown>) => {
    try {
      const reqJson = await ctx.request.body({ type: "json" }).value;
      ctx.state.data = reqJson;
    } catch (_e) {
      throw new ServerError(errors.INVALID_SYNTAX);
    }
    await next();
  };

export const randomUUID = () => crypto.randomUUID();

export const nowUnixTime = () => {
  return Math.floor(new Date().getTime() / 1000);
};
