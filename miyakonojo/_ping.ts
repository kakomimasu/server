import { type Handler } from "hono";

import { PingRes } from "./types.ts";

export const ping: Handler = (ctx) => {
  const body: PingRes = { status: "OK" };

  return ctx.json(body, 200);
};
