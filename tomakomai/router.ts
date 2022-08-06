// API仕様
// https://procon31resources.s3-ap-northeast-1.amazonaws.com/index.html

import { Router } from "../deps.ts";

import { jsonParse, StateData } from "../core/util.ts";
import { errors, ServerError } from "../core/error.ts";

import { checkAuthPic, checkAuthToken, StatePic } from "./_util.ts";
import { matches, priorMatches, updateAction } from "./_matches.ts";
import { myTeam, teamMatches } from "./_teams.ts";
import { UpdateActionReq } from "./types.ts";

export const router = new Router();

router.use(async (ctx, next) => {
  await next();
  console.log("status", ctx.response.status);
  switch (ctx.response.status) {
    case 200:
    case 202:
    case 403:
    case 404:
    case 422:
    case 425:
      ctx.response.headers.append("x-request-id", crypto.randomUUID());
  }
});
router.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (
      err instanceof ServerError &&
      err.errorCode === errors.INVALID_SYNTAX.errorCode
    ) { // リクエストがフォーマットに則ってない場合
      ctx.response.status = 422;
    } else { // それ以外のエラー
      throw err;
    }
  }
});

router.get("/matches", checkAuthToken, priorMatches);
router.get("/matches/:id", checkAuthPic, matches);
router.post<
  "/matches/:id/action",
  { id: string },
  StatePic & StateData<UpdateActionReq>
>(
  "/matches/:id/action",
  checkAuthPic,
  jsonParse(),
  updateAction,
);
router.get("/teams/me", checkAuthToken, myTeam);
router.get("/teams/:id/matches", checkAuthToken, teamMatches);
