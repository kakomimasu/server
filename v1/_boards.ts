import { Router } from "../deps.ts";

import { getAllBoards } from "../core/firestore.ts";

export const router = new Router();

router.get("/", async (ctx) => {
  const boards = await getAllBoards();
  //console.log(boards);
  ctx.response.body = boards;
});
