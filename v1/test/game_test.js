import { getAuth, signInWithEmailAndPassword } from "../../deps.ts";
import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { randomUUID } from "../../core/util.ts";

import ApiClient from "../../client/client.ts";

const ac = new ApiClient();

import { errors } from "../../core/error.ts";

import "../../core/firestore.ts";

const auth = getAuth();
const u = await signInWithEmailAndPassword(
  auth,
  "client@example.com",
  "test-client",
);

const assertGame = (game_, sample_ = {}) => {
  const game = structuredClone(game_);
  const sample = structuredClone(sample_);
  assert(v4.validate(game.id));
  assertEquals(game.gaming, false);
  assertEquals(game.ending, false);
  assertEquals(game.board, null);
  assertEquals(game.turn, 0);
  assertEquals(game.tiled, null);
  assert(Array.isArray(game.players));
  assert(Array.isArray(game.log));
  assertEquals(game.name, sample.name || "");
  assertEquals(game.startedAtUnixTime, null);
  assertEquals(typeof game.operationSec, "number");
  assertEquals(typeof game.transitionSec, "number");
  assert(Array.isArray(game.reservedUsers));

  if (sample.reservedUsers) assert(game.reservedUsers, sample.reservedUsers);
};

const assertBoard = (board) => {
  assertEquals(typeof board.name, "string");
  assertEquals(typeof board.width, "number");
  assertEquals(typeof board.height, "number");
  assertEquals(typeof board.nTurn, "number");
  assertEquals(typeof board.nAgent, "number");
  assertEquals(typeof board.nSec, "number");
  assert(Array.isArray(board.points));
};

const data = {
  name: "テスト",
  boardName: "A-1",
};

// /v1/game/create Test
// テスト項目
// 正常、ボード名無し、存在しないボード名、ユーザ無し、既に登録済みのユーザ、playerIdentifiers無効
// 存在しないトーナメントID
// personal game通常、personal game auth invalid
Deno.test("v1/game/create:normal", async () => {
  const res = await ac.gameCreate({ ...data, option: { dryRun: true } });
  assertGame(res.data, data);
});
Deno.test("v1/game/create:normal with playerIdentifiers", async () => {
  const uuid = randomUUID();
  const userData = { screenName: uuid, name: uuid };
  const userRes = await ac.usersRegist(userData, await u.user.getIdToken());
  userData.id = userRes.data.id;

  const res = await ac.gameCreate({
    ...data,
    playerIdentifiers: [userData.id],
    option: { dryRun: true },
  });

  assertGame(res.data, { ...data, reservedUsers: [userData.id] });
  await ac.usersDelete({}, `Bearer ${userRes.data.bearerToken}`);
});
Deno.test("v1/game/create:invalid boardName", async () => {
  {
    const res = await ac.gameCreate({
      ...data,
      boardName: "",
      option: { dryRun: true },
    });
    assertEquals(res.data, errors.INVALID_BOARD_NAME);
  }
  {
    const res = await ac.gameCreate({
      ...data,
      boardName: undefined,
      option: { dryRun: true },
    });
    assertEquals(res.data, errors.INVALID_BOARD_NAME);
  }
  {
    const res = await ac.gameCreate({
      ...data,
      boardName: null,
      option: { dryRun: true },
    });
    assertEquals(res.data, errors.INVALID_BOARD_NAME);
  }
});
Deno.test("v1/game/create:not exist board", async () => {
  {
    const res = await ac.gameCreate({
      ...data,
      boardName: "existboard",
      option: { dryRun: true },
    });
    assertEquals(res.data, errors.INVALID_BOARD_NAME);
  }
});
Deno.test("v1/game/create:not user", async () => {
  const res = await ac.gameCreate({
    ...data,
    playerIdentifiers: [randomUUID()],
    option: { dryRun: true },
  });
  assertEquals(res.data, errors.NOT_USER);
});
Deno.test("v1/game/create:already registed user", async () => {
  const uuid = randomUUID();
  const userData = { screenName: uuid, name: uuid };
  const userRes = await ac.usersRegist(userData, await u.user.getIdToken());
  userData.id = userRes.data.id;

  const res = await ac.gameCreate({
    ...data,
    playerIdentifiers: [userData.id, userData.id],
    option: { dryRun: true },
  });
  assertEquals(res.data, errors.ALREADY_REGISTERED_USER);
  await ac.usersDelete({}, `Bearer ${userRes.data.bearerToken}`);
});
Deno.test("v1/game/create:invalid tournament id", async () => {
  const res = await ac.gameCreate({
    ...data,
    tournamentId: randomUUID(),
    option: { dryRun: true },
  });
  assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
});
Deno.test("v1/game/create with personal game:normal", async () => {
  const uuid = randomUUID();
  const userData = { screenName: uuid, name: uuid };
  const userRes = await ac.usersRegist(userData, await u.user.getIdToken());
  userData.id = userRes.data.id;

  const res = await ac.gameCreate({
    ...data,
    isMySelf: true,
    option: { dryRun: true },
  }, `Bearer ${userRes.data.bearerToken}`);
  assertGame(res.data, data);

  await ac.usersDelete({}, `Bearer ${userRes.data.bearerToken}`);
});
Deno.test("v1/game/create with personal game:invalid auth", async () => {
  const res = await ac.gameCreate({
    ...data,
    isMySelf: true,
    option: { dryRun: true },
  });
  assertEquals(res.data, errors.UNAUTHORIZED);
});

// /v1/game/boards Test
// テスト項目
// 正常
Deno.test("v1/game/boards:normal", async () => {
  const res = await ac.getBoards();
  res.data.forEach((e) => assertBoard(e));
});
