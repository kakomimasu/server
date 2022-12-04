import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { randomUUID } from "../../core/util.ts";

import { useUser } from "../../util/test/useUser.ts";
import { validator } from "../parts/openapi.ts";

import ApiClient from "../../client/client.ts";

const ac = new ApiClient();

import { errors } from "../../core/error.ts";

const assertGame = (game, sample = {}) => {
  assert(v4.validate(game.id));
  if (sample.id) assertEquals(game.id, sample.id);
  assertEquals(game.gaming, sample.gaming || false);
  assertEquals(game.ending, sample.ending || false);
  assertEquals(game.board, sample.board || null);
  assertEquals(game.turn, sample.turn || 0);
  assertEquals(game.tiled, sample.tiled || null);
  assertEquals(game.name, sample.name || "");
  assertEquals(game.startedAtUnixTime, null);
  if (sample.reservedUsers) assert(game.reservedUsers, sample.reservedUsers);
};

const assertGameCreateRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/matches",
    "post",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertGetMatchRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/matches/{gameId}",
    "get",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertActionRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/matches/{gameId}/actions",
    "patch",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertMatchesGameIdPlayersRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/matches/{gameId}/players",
    "post",
    responseCode,
    "application/json",
  );
  assert(isValid);
};
const assertMatchesFreePlayersRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/matches/free/players",
    "post",
    responseCode,
    "application/json",
  );
  assert(isValid);
};
const assertMatchesAiPlayersRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/matches/ai/players",
    "post",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertMatch = (match, sample = {}) => {
  if (sample.userId) assertEquals(match.userId, sample.userId);
  assertEquals(match.spec, sample.spec || "");
  assert(v4.validate(match.gameId));
  if (sample.gameId) assertEquals(match.gameId, sample.gameId);
  if (sample.index) assertEquals(match.index, sample.index);
  assertEquals(match.pic.length, 6);
};

const data = {
  name: "テスト",
  boardName: "A-1",
};

// /POST v1/matches Test
// テスト項目
// 正常、ボード名無し、存在しないボード名、ユーザ無し、既に登録済みのユーザ、playerIdentifiers無効
// 存在しないトーナメントID
// personal game通常、personal game auth invalid
Deno.test("POST v1/matches:normal", async () => {
  const res = await ac.gameCreate({ ...data, dryRun: true });
  assertGameCreateRes(res.data, 200);
  assertGame(res.data, data);
});
Deno.test("POST v1/matches:normal with playerIdentifiers", async () => {
  await useUser(async (user) => {
    const res = await ac.gameCreate({
      ...data,
      playerIdentifiers: [user.id],
      dryRun: true,
    });
    assertGameCreateRes(res.data, 200);
    assertGame(res.data, { ...data, reservedUsers: [user.id] });
  });
});
Deno.test("POST v1/matches:invalid boardName", async () => {
  {
    const res = await ac.gameCreate({ ...data, boardName: "" });
    assertGameCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_REQUEST);
  }
  {
    const res = await ac.gameCreate({ ...data, boardName: undefined });
    assertGameCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_REQUEST);
  }
  {
    const res = await ac.gameCreate({ ...data, boardName: null });
    assertGameCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_REQUEST);
  }
});
Deno.test("POST v1/matches:not exist board", async () => {
  {
    const res = await ac.gameCreate({ ...data, boardName: "existboard" });
    assertGameCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_BOARD_NAME);
  }
});
Deno.test("POST v1/matches:not user", async () => {
  const res = await ac.gameCreate({
    ...data,
    playerIdentifiers: [randomUUID()],
  });
  assertGameCreateRes(res.data, 400);
  assertEquals(res.data, errors.NOT_USER);
});
Deno.test("POST v1/matches:already registed user", async () => {
  await useUser(async (user) => {
    const res = await ac.gameCreate({
      ...data,
      playerIdentifiers: [user.id, user.id],
    });
    assertGameCreateRes(res.data, 400);
    assertEquals(res.data, errors.ALREADY_REGISTERED_USER);
  });
});
Deno.test("POST v1/matches:invalid tournament id", async () => {
  const res = await ac.gameCreate({ ...data, tournamentId: randomUUID() });
  assertGameCreateRes(res.data, 400);
  assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
});
Deno.test("POST v1/matches with personal game:normal", async () => {
  await useUser(async (user) => {
    const res = await ac.gameCreate(
      { ...data, isMySelf: true, dryRun: true },
      `Bearer ${user.bearerToken}`,
    );
    assertGameCreateRes(res.data, 200);
    assertGame(res.data, data);
  });
});
Deno.test("POST v1/matches with personal game:invalid auth", async () => {
  const res = await ac.gameCreate({ ...data, isPersonal: true });
  assertGameCreateRes(res.data, 400);
  assertEquals(res.data, errors.UNAUTHORIZED);
});

// GET /v1/matches/(gameId) Test
// テスト項目
// 正常、ゲーム無し
Deno.test("GET v1/matches/(gameId):normal", async () => {
  const gameData = { name: "テスト", boardName: "A-1" };
  const gameRes = await ac.gameCreate(gameData);
  // console.log("gameRes", gameRes);

  const res = await ac.getMatch(gameRes.data.id);

  // console.log(res.data);
  assertGetMatchRes(res.data, 200);
  assertGame(res.data, { id: gameRes.data.id, name: gameData.name });
});
Deno.test("GET v1/matches/(gameId):not find game", async () => {
  const res = await ac.getMatch(randomUUID());

  assertGetMatchRes(res.data, 400);
  assertEquals(res.data, errors.NOT_GAME);
});

// POST /v1/matches/(gameId)/action Test
// テスト項目
// 正常、正常、アクセストークン無効
Deno.test("POST v1/matches/(gameId)/actions:normal", async () => {
  await useUser(async (user) => {
    const data = { aiName: "a1" };
    const matchRes = await ac.matchesAiPlayers(
      data,
      "Bearer " + user.bearerToken,
    );

    const actionData = {
      actions: [
        { agentId: 0, type: "PUT", x: 0, y: 0 },
      ],
    };
    const res = await ac.setAction(
      matchRes.data.gameId,
      actionData,
      matchRes.data.pic,
    );

    assertActionRes(res.data, 200);
  });
});
Deno.test("POST v1/matches/(gameId)/action:invalid user", async () => {
  await useUser(async (user) => {
    const data = { aiName: "a1" };
    const matchRes = await ac.matchesAiPlayers(
      data,
      "Bearer " + user.bearerToken,
    );

    const actionData = {
      actions: [
        { agentId: 0, type: "PUT", x: 0, y: 0 },
      ],
    };
    const res = await ac.setAction(
      matchRes.data.gameId,
      actionData,
      "0000000",
    );

    assertActionRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_USER_AUTHORIZATION);
  });
});

// POST /v1/matches/free/players Test
// テスト項目
// BearerToken無効、成功、ゲスト参加
Deno.test("POST v1/matches/free/players:invalid bearerToken", async () => {
  const res = await ac.matchesFreePlayers({ dryRun: true });
  // console.log(res);
  assertMatchesFreePlayersRes(res.data, 400);
  assertEquals(res.data, errors.NOT_USER);
});
Deno.test("POST v1/matches/free/players:normal", async () => {
  await useUser(async (user) => {
    const res = await ac.matchesFreePlayers(
      { dryRun: true },
      "Bearer " + user.bearerToken,
    );

    assertMatchesFreePlayersRes(res.data, 200);
    assertMatch(res.data, { userId: user.id });
  });
});
Deno.test("POST v1/matches/free/players:normal by guest", async () => {
  const data = { guestName: "test", dryRun: true };
  const res = await ac.matchesFreePlayers(data);
  // console.log(res);
  assertMatchesFreePlayersRes(res.data, 200);
  assertMatch(res.data, { userId: "test" });
});

// POST /v1/matches/{gameId}/players Test
// テスト項目
// BearerToken無効、成功、ゲスト参加、名無し、存在しないゲーム
Deno.test("POST v1/matches/{gameId}/players:invalid bearerToken", async () => {
  const res = await ac.matchesGameIdPlayers(crypto.randomUUID(), {
    dryRun: true,
  });
  // console.log(res);
  assertMatchesGameIdPlayersRes(res.data, 400);
  assertEquals(res.data, errors.NOT_USER);
});
Deno.test("POST v1/matches/{gameId}/players:normal", async () => {
  await useUser(async (user) => {
    const gameData = { name: "テスト", boardName: "A-1" };
    const gameRes = await ac.gameCreate(gameData);

    const res = await ac.matchesGameIdPlayers(gameRes.data.id, {
      dryRun: true,
    }, "Bearer " + user.bearerToken);

    assertMatchesGameIdPlayersRes(res.data, 200);
    assertMatch(res.data, { userId: user.id });
  });
});
Deno.test("POST v1/matches/{gameId}/players:normal by guest", async () => {
  const gameData = { name: "テスト", boardName: "A-1" };
  const gameRes = await ac.gameCreate(gameData);
  const data = { guestName: "test", dryRun: true };
  const res = await ac.matchesGameIdPlayers(gameRes.data.id, data);
  // console.log(res);
  assertMatchesGameIdPlayersRes(res.data, 200);
  assertMatch(res.data, { userId: "test" });
});

// POST /v1/matches/ai/players Test
// テスト項目
// BearerToken無効、成功、ゲスト参加、名無し、存在しないAI
Deno.test("POST v1/matches/ai/players:invalid bearerToken", async () => {
  const res = await ac.matchesAiPlayers({ aiName: "a1", dryRun: true });
  // console.log(res);
  assertMatchesAiPlayersRes(res.data, 400);
  assertEquals(res.data, errors.NOT_USER);
});
Deno.test("POST v1/matches/ai/players:normal", async () => {
  await useUser(async (user) => {
    const res = await ac.matchesAiPlayers(
      { aiName: "a1", dryRun: true },
      "Bearer " + user.bearerToken,
    );

    assertMatchesAiPlayersRes(res.data, 200);
    assertMatch(res.data, { userId: user.id });
  });
});
Deno.test("POST v1/matches/ai/players:normal by guest", async () => {
  const data = { aiName: "a1", guestName: "test", dryRun: true };
  const res = await ac.matchesAiPlayers(data);
  // console.log(res);
  assertMatchesAiPlayersRes(res.data, 200);
  assertMatch(res.data, { userId: "test" });
});

Deno.test("POST v1/matches/ai/players:can not find ai", async () => {
  await useUser(async (user) => {
    const data = { aiName: "", dryRun: true };
    const res = await ac.matchesAiPlayers(data, "Bearer " + user.bearerToken);
    assertMatchesAiPlayersRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_REQUEST);
  });
});
