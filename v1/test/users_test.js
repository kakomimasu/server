import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { createFirebaseUser, useUser } from "../../util/test/useUser.ts";

import { errors } from "../../core/error.ts";

import ApiClient from "../../client/client.ts";

import { validator } from "../parts/openapi.ts";

const ac = new ApiClient();

const assertUserRegistRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/users",
    "post",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertUserShowRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/users/{userId}",
    "get",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertUserSearchRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/users",
    "get",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertUserDeleteRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/users",
    "delete",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertUser = (
  user,
  sample,
  noSafe = false,
) => {
  const user_ = { ...user };
  const sample_ = { ...sample };
  //console.log("assert user", user_, sample_);
  sample_.gameIds = [];
  if (noSafe) {
    assert(v4.validate(user_.bearerToken));
  }
  user_.id = sample_.id = undefined;
  user_.bearerToken = sample_.bearerToken = undefined;
  user_.gameIds = sample_.gameIds;
  assertEquals(user_, sample_);
};

// POST /v1/users Test
// テスト項目
// 正常・表示名無し・名前無し・登録済みのユーザ
Deno.test("POST /v1/users:normal", async () => {
  const u = await createFirebaseUser();
  const data = {
    screenName: "john doe",
    name: crypto.randomUUID(),
  };
  const res = await ac.usersRegist({
    ...data,
    option: { dryRun: true },
  }, await u.user.getIdToken());
  assertUserRegistRes(res.data, 200);
  assertUser(res.data, data, true);
});
Deno.test("POST /v1/users:invalid screenName", async (t) => {
  const screenNames = [undefined, null, ""];
  for await (const screenName of screenNames) {
    await t.step({
      name: `screenName is "${screenName}"`,
      fn: async () => {
        const u = await createFirebaseUser();
        const res = await ac.usersRegist({
          name: "johndoe",
          screenName,
          option: { dryRun: true },
        }, await u.user.getIdToken());
        assertUserRegistRes(res.data, 400);
        assertEquals(res.data, errors.INVALID_SCREEN_NAME);
      },
    });
  }
});
Deno.test("POST /v1/users:invalid name", async (t) => {
  const names = [undefined, null, ""];
  for await (const name of names) {
    await t.step({
      name: `name is "${name}"`,
      fn: async () => {
        const u = await createFirebaseUser();
        const res = await ac.usersRegist({
          name,
          screenName: "john doe",
          option: { dryRun: true },
        }, await u.user.getIdToken());
        assertUserRegistRes(res.data, 400);
        assertEquals(res.data, errors.INVALID_USER_NAME);
      },
    });
  }
});
Deno.test("POST /v1/users:already registered name", async () => {
  await useUser(async (user) => {
    const res = await ac.usersRegist({
      name: user.name,
      screenName: user.screenName,
      option: { dryRun: true },
    }, user.bearerToken);
    assertUserRegistRes(res.data, 400);
    assertEquals(res.data, errors.ALREADY_REGISTERED_NAME);
  });
});

// GET /v1/users/{id} Test
// テスト項目
// 正常(名前・ID)・ユーザ無し・認証済み(名前・ID)
Deno.test("GET /v1/users/{id}:normal", async (t) => {
  await useUser(async (user, firebaseUser) => {
    await t.step({
      name: "by name",
      fn: async () => {
        const res = await ac.usersShow(user.name);
        assertUserShowRes(res.data, 200);
        assertUser(res.data, user);
      },
    });
    await t.step({
      name: "by id",
      fn: async () => {
        const res = await ac.usersShow(user.id);
        assertUserShowRes(res.data, 200);
        assertUser(res.data, user);
      },
    });
    await t.step({
      name: "by jwt",
      fn: async () => {
        const res = await ac.usersShow(
          user.name,
          await firebaseUser.user.getIdToken(),
        );
        assertUserShowRes(res.data, 200);
        assertUser(res.data, user, true);
      },
    });
  });
});
Deno.test("GET /v1/users/{id}:not user", async () => {
  const res = await ac.usersShow(crypto.randomUUID());
  assertUserShowRes(res.data, 400);
  assertEquals(res.data, errors.NOT_USER);
});

// GET /v1/users Test
// テスト項目
// 正常(名前・ID)・クエリ無し
Deno.test("GET /v1/users:normal", async (t) => {
  await useUser(async (user) => {
    await t.step({
      name: "by name",
      fn: async () => {
        const res = await ac.usersSearch(user.name);
        assertUserSearchRes(res.data, 200);
        assertUser(res.data[0], user);
      },
    });
    await t.step({
      name: "by id",
      fn: async () => {
        const res = await ac.usersSearch(user.id);
        assertUserSearchRes(res.data, 200);
        assertUser(res.data[0], user);
      },
    });
  });
});
Deno.test("GET /v1/users:no query", async (t) => {
  await t.step({
    name: `query is ""`,
    fn: async () => {
      const res = await ac.usersSearch("");
      assertUserSearchRes(res.data, 400);
      assertEquals(res.data, errors.NOTHING_SEARCH_QUERY);
    },
  });
  await t.step({
    name: "no query",
    fn: async () => {
      const res = await ac._fetch(`/v1/users`);
      const json = await res.json();
      assertUserSearchRes(json, 400);
      assertEquals(json, errors.NOTHING_SEARCH_QUERY);
    },
  });
});

// DELETE /v1/users/{id} Test
// テスト項目
// 正常(名前で削除・IDで削除)・パスワード無し・ユーザ無し
Deno.test("DELETE /v1/users/{id}:normal by bearerToken", async () => {
  await useUser(async (user) => {
    const res = await ac.usersDelete({
      option: { dryRun: true },
    }, `Bearer ${user.bearerToken}`);
    assertUserDeleteRes(res.data, 200);
    assertUser(res.data, user);
  });
});
Deno.test("DELETE /v1/users/{id}:invalid bearerToken", async () => {
  const res = await ac.usersDelete({ option: { dryRun: true } }, "");
  assertEquals(res.res.status, 401);
  assertUserDeleteRes(res.data, 401);
  assertEquals(res.data, errors.UNAUTHORIZED);
});

Deno.test("DELETE /v1/users/{id}:not user", async () => {
  const res = await ac.usersDelete(
    { option: { dryRun: true } },
    `Bearer ${crypto.randomUUID()}`,
  );
  assertEquals(res.res.status, 401);
  assertUserDeleteRes(res.data, 401);
  assertEquals(res.data, errors.UNAUTHORIZED);
});
