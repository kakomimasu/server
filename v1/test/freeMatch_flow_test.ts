import { getAuth, signInWithEmailAndPassword } from "../../deps.ts";
import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { randomUUID } from "../../core/util.ts";

import ApiClient from "../../client/client.ts";
import { diffTime, sleep } from "./client_util.ts";

import userRegistSample from "./sample/userRegist_sample.json" assert {
  type: "json",
};
import matchSample from "./sample/match_sample.json" assert { type: "json" };
import matchGameInfoSample from "./sample/matchGameInfo_sample.json" assert {
  type: "json",
};
import afterActionSample from "./sample/afterAction_sample.json" assert {
  type: "json",
};
import afterActionSample2 from "./sample/afterAction_sample2.json" assert {
  type: "json",
};

const ac = new ApiClient();

import "../../core/firestore.ts";

const auth = getAuth();
const u = await signInWithEmailAndPassword(
  auth,
  "client@example.com",
  "test-client",
);

const testScreenName = "高専太郎";
const testName = randomUUID();
const testSpec = "test";

let bearerToken = "";
let userId = "";
let gameId = "";

let pic1: string;
let pic2: string;

Deno.test("regist user", async () => {
  const res = await ac.usersRegist({
    screenName: testScreenName,
    name: testName,
  }, await u.user.getIdToken());
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  // Deno.writeTextFileSync(
  //   "./v1/test/sample/userRegist_sample.json",
  //   JSON.stringify(res.data),
  // );

  userId = res.data.id;
  bearerToken = res.data.bearerToken;

  const sample = userRegistSample;
  sample.name = testName;
  assert(v4.validate(res.data.bearerToken));
  assert(Array.isArray(res.data.gameIds));
  res.data.id = sample.id = "";
  res.data.bearerToken = sample.bearerToken = "";
  res.data.gameIds = sample.gameIds = [];
  assertEquals(sample, res.data);
});

Deno.test("match", async () => {
  let res1;
  while (true) {
    res1 = await ac.match({ spec: testSpec }, `Bearer ${bearerToken}`);
    if (res1.success === false) {
      throw Error(
        "Response Error. ErrorCode:" + res1.data.errorCode + " " +
          res1.data.message,
      );
    }
    pic1 = res1.data.pic;
    if (res1.data.index === 0) break;
  }

  const res2 = await ac.match({ spec: testSpec }, `Bearer ${bearerToken}`);
  // Deno.writeTextFileSync(
  //   "./v1/test/sample/match_sample.json",
  //   JSON.stringify(res1.data, null, 2),
  // );
  pic2 = res2.success ? res2.data.pic : "";

  const sample = matchSample;
  assert(v4.validate(res1.data.gameId));
  gameId = res1.data.gameId;
  sample.gameId = res1.data.gameId = "";
  sample.userId = userId;
  sample.pic = res1.data.pic;
  assertEquals(sample, res1.data);
});

Deno.test("get gameinfo", async () => {
  // console.log(gameId);
  const res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  //console.log(JSON.stringify(res));
  // Deno.writeTextFileSync(
  //   "./v1/test/sample/matchGameInfo_sample.json",
  //   JSON.stringify(res.data, null, 2),
  // );

  const sample = matchGameInfoSample as typeof res.data;
  assert(v4.validate(res.data.gameId));
  sample.gameId = res.data.gameId = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime = 0;
  assertEquals(res.data.type, "normal");
  sample.type = res.data.type;
  assertEquals(res.data.gameName, undefined);
  delete sample.gameName;

  assertEquals(sample, res.data);
});

let nextTurnUnixTime: number;

Deno.test("send action(Turn 1)", async () => {
  let res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  let gameInfo = res.data;
  if (!gameInfo.startedAtUnixTime) throw Error("startedAtUnixTime is null.");
  nextTurnUnixTime = gameInfo.startedAtUnixTime;
  await sleep(diffTime(nextTurnUnixTime) + 100);
  // issue131:同ターンで複数アクションを送信時に送信したagentIDのみが反映されるかのテストを含む
  // 2回アクションを送信しているが、どちらもagentIDが違うため両方反映される。
  await ac.setAction(gameId, {
    actions: [{ agentId: 0, type: "PUT", x: 1, y: 1 }],
  }, pic1);
  await ac.setAction(gameId, {
    actions: [{ agentId: 1, type: "NONE", x: 1, y: 2 }],
  }, pic1);
  //console.log(reqJson);

  res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  gameInfo = res.data;

  nextTurnUnixTime += gameInfo.operationSec + gameInfo.transitionSec;
  await sleep(diffTime(nextTurnUnixTime) + 100);
  res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  // Deno.writeTextFileSync(
  //   "./v1/test/sample/afterAction_sample.json",
  //   JSON.stringify(res.data, null, 2),
  // );

  //console.log(res);
  //console.log(JSON.stringify(reqJson, null, 2));
  const sample = afterActionSample as typeof res.data;

  assert(v4.validate(res.data.gameId));
  sample.gameId = res.data.gameId = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime;
  assertEquals(res.data.type, "normal");
  sample.type = res.data.type;
  assertEquals(res.data.gameName, undefined);
  delete sample.gameName;

  assertEquals(sample, res.data);
});
Deno.test("send action(Turn 2)", async () => {
  let res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  const gameInfo = res.data;

  await ac.setAction(gameId, {
    actions: [{ agentId: 0, type: "PUT", x: 1, y: 2 }],
  }, pic2);
  //console.log(reqJson);

  nextTurnUnixTime += gameInfo.operationSec + gameInfo.transitionSec;
  await sleep(diffTime(nextTurnUnixTime) + 100);
  res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  // Deno.writeTextFileSync(
  //   "./v1/test/sample/afterAction_sample2.json",
  //   JSON.stringify(res.data),
  // );

  //console.log(res);
  //console.log(JSON.stringify(reqJson, null, 2));
  const sample = afterActionSample2 as typeof res.data;

  assert(v4.validate(res.data.gameId));
  sample.gameId = res.data.gameId = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime;
  assertEquals(res.data.type, "normal");
  sample.type = res.data.type;
  assertEquals(res.data.gameName, undefined);
  delete sample.gameName;

  assertEquals(sample, res.data);
});

Deno.test("delete user", async () => {
  const res = await ac.usersDelete({}, `Bearer ${bearerToken}`);
  //console.log(res);
  assert(res.success);
});
