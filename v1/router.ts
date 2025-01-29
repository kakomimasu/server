import { Hono } from "@hono/hono";

import authRouter from "./_oauth.ts";
import tournamentRouter from "./_tournaments.ts";
import userRouter from "./_users.ts";
import matchesRouter from "./_matches.ts";
import boardsRouter from "./_boards.ts";
import streamRoutes from "./gameStream.ts";

import { openapi } from "./parts/openapi.ts";

export const router = new Hono();

router.route("/oauth", authRouter);
router.route("/matches", streamRoutes);
router.route("/matches", matchesRouter);
router.route("/users", userRouter);
router.route("/tournaments", tournamentRouter);
router.route("/boards", boardsRouter);
router.get("/openapi.json", (ctx) => {
  return ctx.json(openapi);
});
