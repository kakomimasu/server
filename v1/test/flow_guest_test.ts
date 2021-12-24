import { assert, assertEquals, v4 } from "../../deps-test.ts";
import ApiClient from "../../client/client.ts";

import { pathResolver } from "../util.ts";
import { diffTime, sleep } from "./client_util.ts";

const ac = new ApiClient();

const resolve = pathResolver(import.meta);
const sampleDir = "./sample_guest/";

let gameId: string;
let pic1: string;
let pic2: string;

Deno.test("create game", async () => {
  const sampleFilePath = resolve(sampleDir + "createGame_sample.json");
  const res = await ac.gameCreate({ name: "test", boardName: "A-1" });
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  // Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data, null, 2));
  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));

  assert(v4.validate(res.data.gameId));
  gameId = res.data.gameId;
  res.data.gameId = sample.gameId = "";
  assertEquals(sample, res.data);
});

Deno.test("match", async () => {
  const sampleFilePath = resolve(sampleDir + "match_sample.json");

  const res = await ac.match({ gameId, guest: { name: "test1" } });
  if (res.success === false) {
    throw Error(
      "Response Error. ErrorCode:" + res.data.errorCode + " " +
        res.data.message,
    );
  }
  pic1 = res.data.pic;
  const res2 = await ac.match({ gameId: gameId, guest: { name: "test2" } });
  pic2 = res2.success ? res2.data.pic : "";
  //Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data, null, 2));

  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));
  assert(v4.validate(res.data.gameId));
  sample.gameId = res.data.gameId = "";
  sample.pic = res.data.pic;
  assertEquals(sample, res.data);
});

Deno.test("get gameinfo", async () => {
  const sampleFilePath = resolve(sampleDir + "matchGameInfo_sample.json");

  const res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  //console.log(JSON.stringify(res));
  //Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data, null, 2));

  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));
  assert(v4.validate(res.data.gameId));
  assertEquals(res.data.players[0].id, "test1");
  assertEquals(res.data.players[1].id, "test2");
  sample.gameId = res.data.gameId = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime = 0;
  sample.nextTurnUnixTime = res.data.nextTurnUnixTime = 0;

  assertEquals(sample, res.data);
});

Deno.test("send action(Turn 1)", async () => {
  const sampleFilePath = resolve(sampleDir + "afterAction_sample.json");

  let res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  let gameInfo = res.data;
  if (!gameInfo.startedAtUnixTime) throw Error("startedAtUnixTime is null.");
  await sleep(diffTime(gameInfo.startedAtUnixTime) + 100);
  await ac.setAction(gameId, {
    actions: [{ agentId: 0, type: "PUT", x: 1, y: 1 }],
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
  //Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data, null, 2));

  //console.log(res);
  //console.log(JSON.stringify(reqJson, null, 2));
  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));

  assert(v4.validate(res.data.gameId));
  assertEquals(res.data.players[0].id, "test1");
  assertEquals(res.data.players[1].id, "test2");
  sample.gameId = res.data.gameId = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime;
  sample.nextTurnUnixTime = res.data.nextTurnUnixTime;

  assertEquals(sample, res.data);
});
Deno.test("send action(Turn 2)", async () => {
  const sampleFilePath = resolve(sampleDir + "afterAction_sample2.json");

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
  //Deno.writeTextFileSync(sampleFilePath, JSON.stringify(res.data));

  //console.log(res);
  //console.log(JSON.stringify(reqJson, null, 2));
  const sample = JSON.parse(Deno.readTextFileSync(sampleFilePath));

  assert(v4.validate(res.data.gameId));
  assertEquals(res.data.players[0].id, "test1");
  assertEquals(res.data.players[1].id, "test2");
  sample.gameId = res.data.gameId = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime;
  sample.nextTurnUnixTime = res.data.nextTurnUnixTime;

  assertEquals(sample, res.data);
});
