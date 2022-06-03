import { Middleware } from "../deps.ts";

export const ping: Middleware = (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = { status: "OK" };
};
