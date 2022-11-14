import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { useUser } from "../../util/test/useUser.ts";

import { randomUUID } from "../../core/util.ts";
import { errors } from "../../core/error.ts";

import ApiClient from "../../client/client.ts";

import { openapi, validator } from "../parts/openapi.ts";

const ac = new ApiClient();

const assertMatchRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    {
      path: "/match",
      method: "post",
      statusCode: responseCode,
      contentType: "application/json",
    },
  );
  assert(isValid);
};

const assertGetMatchRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    {
      path: "/match/:gameId",
      method: "get",
      statusCode: responseCode,
      contentType: "application/json",
    },
  );
  assert(isValid);
};

const assertActionRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    {
      path: "/match/:gameId/action",
      method: "post",
      statusCode: responseCode,
      contentType: "application/json",
    },
  );
  assert(isValid);
};

const assertMatch = (match, sample = {}) => {
  const match_ = Object.assign({}, match);
  const sample_ = Object.assign({}, sample);

  //assert(v4.validate(match_.userId));
  if (sample_.userId) assertEquals(match_.userId, sample_.userId);
  assertEquals(match_.spec, sample_.spec || "");
  assert(v4.validate(match_.gameId));
  if (sample_.gameId) assertEquals(match_.gameId, sample_.gameId);
  assertEquals(typeof match_.index, "number");
  if (sample_.index) assertEquals(match_.index, sample_.index);
  assertEquals(match.pic.length, 6);
};

const assertGame = (game_, sample_ = {}) => {
  const game = structuredClone(game_);
  const sample = structuredClone(sample_);
  assert(v4.validate(game.id));
  if (sample.id) assertEquals(game.id, sample.id);
  assertEquals(game.gaming, sample.gaming || false);
  assertEquals(game.ending, sample.ending || false);
  assertEquals(game.board, sample.board || null);
  assertEquals(game.turn, sample.turn || 0);
  assertEquals(game.tiled, sample.tiled || null);
  assert(Array.isArray(game.players));
  assert(Array.isArray(game.log));
  assertEquals(game.name, sample.name || "");
  assertEquals(game.startedAtUnixTime, null);
  assertEquals(typeof game.operationSec, "number");
  assertEquals(typeof game.transitionSec, "number");
  assert(Array.isArray(game.reservedUsers));
  if (sample.reservedUsers) assert(game.reservedUsers, sample.reservedUsers);

  const isValid = validator.validate(game_, openapi.components.schemas.Game);
  assert(isValid);
};

const assertAction = (actionRes) => {
  assertEquals(typeof actionRes.receptionUnixTime, "number");
  assertEquals(typeof actionRes.turn, "number");
};

// /v1/match Test
// テスト項目
// ユーザ識別子無効、パスワード無効、ユーザ無し
// gameID有：ゲーム無し
// useAi：AI無し
// ゲスト参加
Deno.test("v1/match:invalid bearerToken", async () => {
  const res = await ac.match({ option: { dryRun: true } });
  // console.log(res);
  assertMatchRes(res.data, 400);
  assertEquals(res.data, errors.NOT_USER);
});
Deno.test("v1/match:can not find game", async () => {
  await useUser(async (user) => {
    const data = {
      gameId: randomUUID(),
      option: { dryRun: true },
    };
    const res = await ac.match(data, "Bearer " + user.bearerToken);

    assertMatchRes(res.data, 400);
    assertEquals(res.data, errors.NOT_GAME);
  });
});
Deno.test("v1/match:can not find ai", async () => {
  await useUser(async (user) => {
    const data = {
      useAi: true,
      aiOption: {
        aiName: "",
      },
      option: { dryRun: true },
    };
    const res = await ac.match(data, "Bearer " + user.bearerToken);
    assertMatchRes(res.data, 400);
    assertEquals(res.data, errors.NOT_AI);
  });
});
Deno.test("v1/match:normal", async () => {
  await useUser(async (user) => {
    const res = await ac.match({}, "Bearer " + user.bearerToken);

    assertMatchRes(res.data, 200);
    assertMatch(res.data, { userId: user.id });
  });
});
Deno.test("v1/match:normal by selfGame", async () => {
  await useUser(async (user) => {
    const gameData = { name: "テスト", boardName: "A-1" };
    const gameRes = await ac.gameCreate(gameData);

    const data = {
      gameId: gameRes.data.gameId,
    };
    const res = await ac.match(data, "Bearer " + user.bearerToken);

    assertMatchRes(res.data, 200);
    assertMatch(res.data, { userId: user.id, gameId: gameRes.data.gameId });
  });
});
Deno.test("v1/match:normal by useAi", async () => {
  await useUser(async (user) => {
    const data = {
      useAi: true,
      aiOption: {
        aiName: "a1",
      },
    };
    const res = await ac.match(data, "Bearer " + user.bearerToken);

    assertMatchRes(res.data, 200);
    assertMatch(res.data, { userId: user.id });
  });
});
Deno.test("v1/match:normal by guest", async () => {
  const data = {
    useAi: true,
    aiOption: {
      aiName: "a1",
    },
    guest: {
      name: "test",
    },
  };
  const res = await ac.match(data);
  // console.log(res);
  assertMatchRes(res.data, 200);
  assertMatch(res.data, { userId: "test" });
});

// /v1/match/(gameId) Test
// テスト項目
// 正常、ゲーム無し
Deno.test("v1/match/(gameId):normal", async () => {
  const gameData = { name: "テスト", boardName: "A-1" };
  const gameRes = await ac.gameCreate(gameData);
  // console.log("gameRes", gameRes);

  const res = await ac.getMatch(gameRes.data.id);

  // console.log(res.data);
  assertGetMatchRes(res.data, 200);
  assertGame(res.data, { id: gameRes.data.id, name: gameData.name });
});
Deno.test("v1/match/(gameId):not find game", async () => {
  const res = await ac.getMatch(randomUUID());

  assertGetMatchRes(res.data, 400);
  assertEquals(res.data, errors.NOT_GAME);
});

// /v1/match/(gameId)/action Test
// テスト項目
// 正常、正常（actions:null）、アクセストークン無効
Deno.test("v1/match/(gameId)/action:normal", async () => {
  await useUser(async (user) => {
    const data = {
      useAi: true,
      aiOption: {
        aiName: "a1",
      },
    };
    const matchRes = await ac.match(data, "Bearer " + user.bearerToken);

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
    assertAction(res.data);
  });
});

Deno.test("v1/match/(gameId)/action:normal(actions is null)", async () => {
  await useUser(async (user) => {
    const data = {
      useAi: true,
      aiOption: {
        aiName: "a1",
      },
    };
    const matchRes = await ac.match(data, "Bearer " + user.bearerToken);

    const actionData = { actions: null };
    const res = await ac.setAction(
      matchRes.data.gameId,
      actionData,
      matchRes.data.pic,
    );
    // console.log(res);
    assertActionRes(res.data, 200);
    assertAction(res.data);
  });
});

Deno.test("v1/match/(gameId)/action:invalid user", async () => {
  await useUser(async (user) => {
    const data = {
      useAi: true,
      aiOption: {
        aiName: "a1",
      },
    };
    const matchRes = await ac.match(data, "Bearer " + user.bearerToken);

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
