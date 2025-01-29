import { Hono } from "@hono/hono";

import { getBoards } from "../core/kv.ts";

const router = new Hono();

router.get("/", async (ctx) => {
  const boards = await getBoards();
  //console.log(boards);
  return ctx.json(boards);
});

export default router;
