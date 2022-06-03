// API仕様
// https://procon30resources.s3-ap-northeast-1.amazonaws.com/index.html

import { Router } from "../deps.ts";

import { jsonParse, StateData } from "../core/util.ts";

import { checkToken, StateToken } from "./_util.ts";
import { ping } from "./_ping.ts";
import { matches, priorMatches, updateAction } from "./_matches.ts";
import { UpdateActionReq } from "./types.ts";

export const router = new Router();

router.get("/ping", checkToken, ping);
router.get("/matches", checkToken, priorMatches);
router.get("/matches/:id", checkToken, matches);
router.post<
  "/matches/:id/action",
  { id: string },
  StateToken & StateData<UpdateActionReq>
>(
  "/matches/:id/action",
  checkToken,
  jsonParse<UpdateActionReq>(),
  updateAction,
);
