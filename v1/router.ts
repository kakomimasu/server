import { Router } from "../deps.ts";

import { tournamentRouter } from "./_tournaments.ts";
import { userRouter } from "./_users.ts";
import { router as matchesRouter } from "./_matches.ts";
import { router as boardsRouter } from "./_boards.ts";
import { wsRoutes } from "./ws.ts";
import { streamRoutes } from "./gameStream.ts";

import { openapi } from "./parts/openapi.ts";

export const router = new Router();

router.use("/ws", wsRoutes());
router.use("/matches", matchesRouter.routes());
router.use("/game", streamRoutes());
router.use("/users", userRouter());
router.use("/tournaments", tournamentRouter());
router.use("/boards", boardsRouter.routes());
router.get("/openapi.json", (ctx) => {
  ctx.response.body = openapi;
});
