import { assert, assertEquals, v4 } from "../../deps-test.ts";
import ApiClient from "../../client/client.ts";

import { diffTime, sleep } from "./client_util.ts";

const ac = new ApiClient();

import createGameSample from "./sample_guest/createGame_sample.json" assert {
  type: "json",
};
import matchSample from "./sample_guest/match_sample.json" assert {
  type: "json",
};
import matchGameInfoSample from "./sample_guest/matchGameInfo_sample.json" assert {
  type: "json",
};
import afterActionSample from "./sample_guest/afterAction_sample.json" assert {
  type: "json",
};
import afterActionSample2 from "./sample_guest/afterAction_sample2.json" assert {
  type: "json",
};

let gameId: string;
let pic1: string;
let pic2: string;

Deno.test("create game", async () => {
  const res = await ac.gameCreate({ name: "test", boardName: "A-1" });
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  // Deno.writeTextFileSync(
  //   "v1/test/sample_guest/createGame_sample.json",
  //   JSON.stringify(res.data, null, 2),
  // );
  const sample = createGameSample;

  assert(v4.validate(res.data.id));
  gameId = res.data.id;
  res.data.id = sample.id = "";
  assertEquals(sample, res.data);
});

Deno.test("match", async () => {
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
  // Deno.writeTextFileSync(
  //   "v1/test/sample_guest/match_sample.json",
  //   JSON.stringify(res.data, null, 2),
  // );

  const sample = matchSample;
  assert(v4.validate(res.data.gameId));
  sample.gameId = res.data.gameId = "";
  sample.pic = res.data.pic;
  assertEquals(sample, res.data);
});

Deno.test("get gameinfo", async () => {
  const res = await ac.getMatch(gameId);
  if (res.success === false) {
    throw Error("Response Error. ErrorCode:" + res.data.errorCode);
  }
  //console.log(JSON.stringify(res));
  // Deno.writeTextFileSync(
  //   "v1/test/sample_guest/matchGameInfo_sample.json",
  //   JSON.stringify(res.data, null, 2),
  // );

  const sample = matchGameInfoSample;
  assert(v4.validate(res.data.id));
  assertEquals(res.data.players[0].id, "test1");
  assertEquals(res.data.players[1].id, "test2");
  sample.id = res.data.id = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime = 0;

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
  await ac.setAction(gameId, {
    actions: [{ agentId: 0, type: "PUT", x: 1, y: 1 }],
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
  //   "v1/test/sample_guest/afterAction_sample.json",
  //   JSON.stringify(res.data, null, 2),
  // );

  //console.log(res);
  //console.log(JSON.stringify(reqJson, null, 2));
  const sample = afterActionSample as typeof res.data;

  assert(v4.validate(res.data.id));
  assertEquals(res.data.players[0].id, "test1");
  assertEquals(res.data.players[1].id, "test2");
  sample.id = res.data.id = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime;

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
  //   "v1/test/sample_guest/afterAction_sample2.json",
  //   JSON.stringify(res.data),
  // );

  //console.log(res);
  //console.log(JSON.stringify(reqJson, null, 2));
  const sample = afterActionSample2 as typeof res.data;

  assert(v4.validate(res.data.id));
  assertEquals(res.data.players[0].id, "test1");
  assertEquals(res.data.players[1].id, "test2");
  sample.id = res.data.id = "";
  sample.players[0].id = res.data.players[0].id = "";
  sample.players[1].id = res.data.players[1].id = "";
  sample.startedAtUnixTime = res.data.startedAtUnixTime;

  assertEquals(sample, res.data);
});
