import { Router } from "../deps.ts";

import { getBoards } from "../core/kv.ts";

export const router = new Router();

router.get("/", async (ctx) => {
  const boards = await getBoards();
  //console.log(boards);
  ctx.response.body = boards;
});
