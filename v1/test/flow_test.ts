import { getAuth, signInWithEmailAndPassword } from "../../deps.ts";
import { assert, assertEquals, v4 } from "../../deps-test.ts";
import ApiClient from "../../client/client.ts";

import { pathResolver, randomUUID } from "../util.ts";
import { diffTime, sleep } from "./client_util.ts";

const ac = new ApiClient();

const resolve = pathResolver(import.meta);

import "../parts/firestore_opration.ts";

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
  const sampleFilePath = resolve("./sample/userRegist_sample.json");

  const res = await ac.usersRegist({
    screenName: testScreenName,
    name: testName,
  }, await u.user.getIdToken());
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  //Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data));

  userId = res.data.id;
  bearerToken = res.data.bearerToken;

  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));
  sample.name = testName;
  assert(v4.validate(res.data.bearerToken));
  assert(Array.isArray(res.data.gamesId));
  res.data.id = sample.id = "";
  res.data.bearerToken = sample.bearerToken = "";
  res.data.gamesId = sample.gamesId = [];
  assertEquals(sample, res.data);
});

Deno.test("create game", async () => {
  const sampleFilePath = resolve("./sample/createGame_sample.json");
  const res = await ac.gameCreate({ name: "test", boardName: "A-1" });
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  //Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res, null, 2));
  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));

  assert(v4.validate(res.data.gameId));
  gameId = res.data.gameId;
  res.data.gameId = sample.gameId = "";
  assertEquals(sample, res.data);
});

Deno.test("match", async () => {
  const sampleFilePath = resolve("./sample/match_sample.json");

  const res = await ac.match(
    { spec: testSpec, gameId },
    `Bearer ${bearerToken}`,
  );
  if (res.success === false) {
    throw Error(
      "Response Error. ErrorCode:" + res.data.errorCode + " " +
        res.data.message,
    );
  }
  pic1 = res.data.pic;
  const res2 = await ac.match(
    { spec: testSpec, gameId: gameId },
    `Bearer ${bearerToken}`,
  );
  pic2 = res2.success ? res2.data.pic : "";
  //Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data, null, 2));

  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));
  assert(v4.validate(res.data.gameId));
  sample.gameId = res.data.gameId = "";
  sample.userId = userId;
  sample.pic = res.data.pic;
  assertEquals(sample, res.data);
});

Deno.test("get gameinfo", async () => {
  const sampleFilePath = resolve("./sample/matchGameInfo_sample.json");

  const res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  //console.log(JSON.stringify(res));
  //Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data, null, 2));

  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));
  assert(v4.validate(res.data.gameId));
  sample.gameId = res.data.gameId = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime = 0;
  sample.nextTurnUnixTime = res.data.nextTurnUnixTime = 0;

  assertEquals(sample, res.data);
});

Deno.test("send action(Turn 1)", async () => {
  const sampleFilePath = resolve("./sample/afterAction_sample.json");

  let res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  let gameInfo = res.data;
  if (!gameInfo.startedAtUnixTime) throw Error("startedAtUnixTime is null.");
  await sleep(diffTime(gameInfo.startedAtUnixTime) + 100);
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

  if (!gameInfo.nextTurnUnixTime) throw Error("nextTurnUnixTime is null.");
  await sleep(diffTime(gameInfo.nextTurnUnixTime) + 100);
  res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  // Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data, null, 2));

  //console.log(res);
  //console.log(JSON.stringify(reqJson, null, 2));
  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));

  assert(v4.validate(res.data.gameId));
  sample.gameId = res.data.gameId = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime;
  sample.nextTurnUnixTime = res.data.nextTurnUnixTime;

  assertEquals(sample, res.data);
});
Deno.test("send action(Turn 2)", async () => {
  const sampleFilePath = resolve("./sample/afterAction_sample2.json");

  let res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  const gameInfo = res.data;

  await ac.setAction(gameId, {
    actions: [{ agentId: 0, type: "PUT", x: 1, y: 2 }],
  }, pic2);
  //console.log(reqJson);

  if (!gameInfo.nextTurnUnixTime) throw Error("nextTurnUnixTime is null.");
  await sleep(diffTime(gameInfo.nextTurnUnixTime) + 100);
  res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  // Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data));

  //console.log(res);
  //console.log(JSON.stringify(reqJson, null, 2));
  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));

  assert(v4.validate(res.data.gameId));
  sample.gameId = res.data.gameId = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime;
  sample.nextTurnUnixTime = res.data.nextTurnUnixTime;

  assertEquals(sample, res.data);
});

Deno.test("delete user", async () => {
  const res = await ac.usersDelete({}, await u.user.getIdToken());
  //console.log(res);
  assert(res.success);
});
