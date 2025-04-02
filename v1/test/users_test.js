import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { v4 } from "@std/uuid";

import { useUser } from "../../util/test/useUser.ts";

import { errors } from "../../core/error.ts";

import ApiClient from "../../client/client.ts";

import { validator } from "../parts/openapi.ts";

import { app } from "../../server.ts";

const ac = new ApiClient();

const assertUserShowRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/users/{userIdOrName}",
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
    "/users/me",
    "delete",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertUserShowMeRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/users/me",
    "get",
    responseCode,
    "application/json",
  );
  assert(isValid);
};
const assertUserRegenerateTokenRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/users/me/token",
    "get",
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

// GET /v1/users/{idOrName} Test
// テスト項目
// 正常(名前・ID)・ユーザ無し
Deno.test("GET /v1/users/{idOrName}:normal", async (t) => {
  await useUser(async (user) => {
    await t.step({
      name: "by name",
      fn: async () => {
        const res = await ac.getUser(user.name);
        assertUserShowRes(res.data, 200);
        assertUser(res.data, user);
      },
    });
    await t.step({
      name: "by id",
      fn: async () => {
        const res = await ac.getUser(user.id);
        assertUserShowRes(res.data, 200);
        assertUser(res.data, user);
      },
    });
  });
});
Deno.test("GET /v1/users/{idOrName}:not user", async () => {
  const res = await ac.getUser(crypto.randomUUID());
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
        const res = await ac.getUsers(user.name);
        assertUserSearchRes(res.data, 200);
        assertUser(res.data[0], user);
      },
    });
    await t.step({
      name: "by id",
      fn: async () => {
        const res = await ac.getUsers(user.id);
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
      const res = await ac.getUsers("");
      assertUserSearchRes(res.data, 400);
      assertEquals(res.data, errors.NOTHING_SEARCH_QUERY);
    },
  });
  await t.step({
    name: "no query",
    fn: async () => {
      const res = await app.request(`/v1/users`);
      const json = await res.json();
      assertUserSearchRes(json, 400);
      assertEquals(json, errors.NOTHING_SEARCH_QUERY);
    },
  });
});

// DELETE /v1/users/me Test
// テスト項目
// 正常(BearerToken・Cookie)・トークン無し
Deno.test("DELETE /v1/users/me:normal by BearerToken", async () => {
  await useUser(async (user) => {
    const res = await ac.deleteUserMe(
      { dryRun: true },
      `Bearer ${user.bearerToken}`,
    );
    assertUserDeleteRes(res.data, 200);
    assertUser(res.data, user);
  });
});
Deno.test("DELETE /v1/users/me:normal by cookie", async () => {
  await useUser(async (user, sessionId) => {
    const res = await app.request("/v1/users/me", {
      method: "DELETE",
      headers: {
        Cookie: `site-session=${sessionId}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dryRun: true }),
    });
    assert(res.ok);
    const data = await res.json();
    assertUserDeleteRes(data, 200);
    assertUser(data, user);
  });
});
Deno.test("DELETE /v1/users/me:invalid bearerToken", async () => {
  const res = await ac.deleteUserMe({}, "");
  assertEquals(res.res.status, 401);
  assertUserDeleteRes(res.data, 401);
  assertEquals(res.data, errors.UNAUTHORIZED);
});
Deno.test("DELETE /v1/users/me:not user", async () => {
  const res = await ac.deleteUserMe(
    {},
    `Bearer ${crypto.randomUUID()}`,
  );
  assertEquals(res.res.status, 401);
  assertUserDeleteRes(res.data, 401);
  assertEquals(res.data, errors.UNAUTHORIZED);
});
Deno.test("DELETE /v1/users/me:invalid body", async () => {
  await useUser(async (user) => {
    const res = await ac.deleteUserMe(
      { dryRun: "dummy" },
      `Bearer ${user.bearerToken}`,
    );
    assertUserDeleteRes(res.data, 401);
    assertEquals(res.data, errors.INVALID_REQUEST);
  });
});

// GET /v1/users/me Test
// テスト項目
// 正常（BearerToken・Cookie）・トークンなし
Deno.test("GET /v1/users/me:normal by BearerToken", async () => {
  await useUser(async (user) => {
    const res = await ac.getUserMe(`Bearer ${user.bearerToken}`);
    assert(res.success);
    assertUserShowMeRes(res.data, 200);
    assertUser(res.data, user);
  });
});
Deno.test("GET /v1/users/me:normal by Cookie", async () => {
  await useUser(async (user, sessionId) => {
    const res = await app.request("/v1/users/me", {
      headers: { Cookie: `site-session=${sessionId}` },
    });
    assert(res.ok);
    const data = await res.json();
    assertUserShowMeRes(data, 200);
    assertUser(data, user);
  });
});
Deno.test("GET /v1/users/me:invalid", async () => {
  await useUser(async (_user) => {
    const res = await ac.getUserMe("");
    assertEquals(res.res.status, 401);
    assertUserRegenerateTokenRes(res.data, 401);
    assertEquals(res.data, errors.UNAUTHORIZED);
  });
});

// GET /v1/users/me/token Test
// テスト項目
// 正常（BearerToken・Cookie）・トークンなし
Deno.test({
  name: "GET /v1/users/me/token:normal by BearerToken",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await useUser(async (user) => {
      const res = await ac.regenerateUserMeToken(
        `Bearer ${user.bearerToken}`,
      );
      assert(res.success);
      assertUserRegenerateTokenRes(res.data, 200);
      assertNotEquals(res.data.bearerToken, user.bearerToken);
      assertUser(res.data, user);
    });
  },
});
Deno.test({
  name: "GET /v1/users/me/token:normal by cookie",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await useUser(async (user, sessionId) => {
      const res = await app.request("/v1/users/me/token", {
        headers: { Cookie: `site-session=${sessionId}` },
      });
      assert(res.ok);
      const data = await res.json();
      assertUserRegenerateTokenRes(data, 200);
      assertNotEquals(data.bearerToken, user.bearerToken);
      assertUser(data, user);
    });
  },
});
Deno.test({
  name: "GET /v1/users/me/token:invalid",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await useUser(async (_user) => {
      const res = await ac.regenerateUserMeToken("");
      assert(res.res.status === 401);
      assertUserRegenerateTokenRes(res.data, 401);
      assertEquals(res.data, errors.UNAUTHORIZED);
    });
  },
});
