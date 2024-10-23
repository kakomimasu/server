import { Router } from "@oak/oak";

import { authRouter } from "./_oauth.ts";
import { tournamentRouter } from "./_tournaments.ts";
import { userRouter } from "./_users.ts";
import { router as matchesRouter } from "./_matches.ts";
import { router as boardsRouter } from "./_boards.ts";
import { streamRoutes } from "./gameStream.ts";

import { openapi } from "./parts/openapi.ts";

export const router = new Router();

router.use("/oauth", authRouter());
router.use("/matches", streamRoutes());
router.use("/matches", matchesRouter.routes());
router.use("/users", userRouter());
router.use("/tournaments", tournamentRouter());
router.use("/boards", boardsRouter.routes());
router.get("/openapi.json", (ctx) => {
  ctx.response.body = openapi;
});
