import { Router } from "../deps.ts";

import { tournamentRouter } from "./tournament.ts";
import { userRouter } from "./user.ts";
import { gameRouter } from "./game.ts";
import { matchRouter } from "./match.ts";
import { wsRoutes } from "./ws.ts";
import { streamRoutes } from "./gameStream.ts";
import { openapi } from "./parts/openapi.ts";

export const router = new Router();

router.use("/ws", wsRoutes());
router.use("/match", matchRouter());
router.use("/game", gameRouter());
router.use("/game", streamRoutes());
router.use("/users", userRouter());
router.use("/tournaments", tournamentRouter());
router.get("/openapi.json", (ctx) => {
  ctx.response.body = openapi;
});