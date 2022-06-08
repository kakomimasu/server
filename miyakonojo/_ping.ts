import { Middleware } from "../deps.ts";

import { PingRes } from "./types.ts";

export const ping: Middleware = (ctx) => {
  const body: PingRes = { status: "OK" };

  ctx.response.status = 200;
  ctx.response.body = body;
};
