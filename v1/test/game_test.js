import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { randomUUID } from "../../core/util.ts";

import { useUser } from "../../util/test/useUser.ts";
import { openapi, validator } from "../parts/openapi.ts";

import ApiClient from "../../client/client.ts";

const ac = new ApiClient();

import { errors } from "../../core/error.ts";

const assertGameCreateRes = (res, responseCode) => {
  const isValid = validator.validate(
    res,
    openapi.paths["/game/create"].post.responses[String(responseCode)]
      .content["application/json"].schema,
  );
  assert(isValid);
};

const assertGame = (game, sample = {}) => {
  assert(v4.validate(game.id));
  assertEquals(game.gaming, false);
  assertEquals(game.ending, false);
  assertEquals(game.board, null);
  assertEquals(game.turn, 0);
  assertEquals(game.tiled, null);
  assertEquals(game.name, sample.name || "");
  assertEquals(game.startedAtUnixTime, null);

  if (sample.reservedUsers) assert(game.reservedUsers, sample.reservedUsers);
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
  assertGameCreateRes(res.data, 200);
  assertGame(res.data, data);
});
Deno.test("v1/game/create:normal with playerIdentifiers", async () => {
  await useUser(async (user) => {
    const res = await ac.gameCreate({
      ...data,
      playerIdentifiers: [user.id],
      option: { dryRun: true },
    });
    assertGameCreateRes(res.data, 200);
    assertGame(res.data, { ...data, reservedUsers: [user.id] });
  });
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
  await useUser(async (user) => {
    const res = await ac.gameCreate({
      ...data,
      playerIdentifiers: [user.id, user.id],
      option: { dryRun: true },
    });
    assertEquals(res.data, errors.ALREADY_REGISTERED_USER);
  });
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
  await useUser(async (user) => {
    const res = await ac.gameCreate({
      ...data,
      isMySelf: true,
      option: { dryRun: true },
    }, `Bearer ${user.bearerToken}`);
    assertGameCreateRes(res.data, 200);
    assertGame(res.data, data);
  });
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
  const isValid = validator.validate(
    res.data,
    openapi.paths["/game/boards"].get.responses["200"]
      .content["application/json"].schema,
  );
  assert(isValid);
});
