// API仕様
// https://procon30resources.s3-ap-northeast-1.amazonaws.com/index.html

import { Hono } from "hono";

import { jsonParse } from "../core/util.ts";

import { checkAuthPic, checkAuthToken } from "./_util.ts";
import { ping } from "./_ping.ts";
import { matches, priorMatches, updateAction } from "./_matches.ts";
import { openapi } from "./parts/openapi.ts";

export const router = new Hono();

router.get("/ping", checkAuthToken, ping);
router.get("/matches", checkAuthToken, priorMatches);
router.get("/matches/:id", checkAuthPic, matches);
router.post(
  "/matches/:id/action",
  checkAuthPic,
  jsonParse(),
  updateAction,
);
router.get("/openapi.json", (ctx) => {
  return ctx.json(openapi);
});
