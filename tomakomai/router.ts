// API仕様
// https://procon31resources.s3-ap-northeast-1.amazonaws.com/index.html

import { Hono } from "hono";

import { jsonParse } from "../core/util.ts";
import { errors, ServerError } from "../core/error.ts";

import { checkAuthPic, checkAuthToken } from "./_util.ts";
import { matches, priorMatches, updateAction } from "./_matches.ts";
import { myTeam, teamMatches } from "./_teams.ts";
import { openapi } from "./parts/openapi.ts";

export const router = new Hono();

router.use(async (ctx, next) => {
  await next();
  switch (ctx.res.status) {
    case 200:
    case 202:
    case 403:
    case 404:
    case 422:
    case 425:
      ctx.res.headers.append("x-request-id", crypto.randomUUID());
  }
});
router.onError((err) => {
  if (
    err instanceof ServerError &&
    err.errorCode === errors.INVALID_SYNTAX.errorCode
  ) { // リクエストがフォーマットに則ってない場合
    return new Response(null, { status: 422 });
  } else { // それ以外のエラー
    throw err;
  }
});

router.get("/matches", checkAuthToken, priorMatches);
router.get("/matches/:id", checkAuthPic, matches);
router.post(
  "/matches/:id/action",
  checkAuthPic,
  jsonParse(),
  updateAction,
);
router.get("/teams/me", checkAuthToken, myTeam);
router.get("/teams/:id/matches", checkAuthToken, teamMatches);
router.get("/openapi.json", (ctx) => {
  return ctx.json(openapi);
});
