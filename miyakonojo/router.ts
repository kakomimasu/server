// API仕様
// https://procon30resources.s3-ap-northeast-1.amazonaws.com/index.html

import { Router } from "../deps.ts";

import { jsonParse, StateData } from "../core/util.ts";

import { checkAuthPic, checkAuthToken, StatePic } from "./_util.ts";
import { ping } from "./_ping.ts";
import { matches, priorMatches, updateAction } from "./_matches.ts";
import { UpdateActionReq } from "./types.ts";
import { openapi } from "./parts/openapi.ts";

export const router = new Router();

router.get("/ping", checkAuthToken, ping);
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
router.get("/openapi.json", (ctx) => {
  ctx.response.body = openapi;
});
