import { Context } from "oak";
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
    const reqJson = await ctx.request.body.json();
    ctx.state.data = reqJson ?? {};
  } catch (_e) {
    throw new ServerError(errors.INVALID_SYNTAX);
  }
  await next();
};

/**
 * This is required for Oak to convert between web-standard
 * and Oak `Request` and `Response` interfaces.
 *
 * @see {@link https://github.com/oakserver/oak/issues/533}
 */
export async function wrapOakRequest(
  ctx: Context,
  fn: (request: Request) => Promise<Response>,
) {
  const req = await OakRequest2NoBodyRequest(ctx);
  const response = await fn(req);
  ApplyResponse(ctx, response);
}

/**
 * @see {@link https://github.com/oakserver/oak/issues/533}
 */
export async function OakRequest2NoBodyRequest(ctx: Context): Promise<Request> {
  const req = new Request(ctx.request.url.toString(), {
    body: ["get", "head"].includes(ctx.request.method.toLowerCase())
      ? undefined
      : "dummy",
    headers: ctx.request.headers,
    method: ctx.request.method,
  });
  await req.text(); // bodyはないということを明示するために使用済みにしておく
  return req;
}

/**
 * @see {@link https://github.com/oakserver/oak/issues/533}
 */
export function ApplyResponse(ctx: Context, res: Response) {
  ctx.response.status = res.status;
  ctx.response.headers = res.headers;
  ctx.response.body = res;
}
