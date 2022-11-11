import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { createFirebaseUser, useUser } from "../../util/test/useUser.ts";

import { errors } from "../../core/error.ts";

import ApiClient from "../../client/client.ts";

const ac = new ApiClient();

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
  assert(Array.isArray(user.gameIds));
  user_.gameIds = sample_.gameIds;
  assertEquals(user_, sample_);
};

// /v1/users/regist Test
// テスト項目
// 正常・表示名無し・名前無し・登録済みのユーザ
Deno.test("users regist:normal", async () => {
  const u = await createFirebaseUser();
  const data = {
    screenName: "john doe",
    name: crypto.randomUUID(),
  };
  const res = await ac.usersRegist({
    ...data,
    option: { dryRun: true },
  }, await u.user.getIdToken());
  assertUser(res.data, data, true);
});
Deno.test("users regist:invalid screenName", async (t) => {
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
        assertEquals(res.data, errors.INVALID_SCREEN_NAME);
      },
    });
  }
});
Deno.test("users regist:invalid name", async (t) => {
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
        assertEquals(res.data, errors.INVALID_USER_NAME);
      },
    });
  }
});
Deno.test("users regist:already registered name", async () => {
  await useUser(async (user) => {
    const res = await ac.usersRegist({
      name: user.name,
      screenName: user.screenName,
      option: { dryRun: true },
    }, user.bearerToken);
    assertEquals(res.data, errors.ALREADY_REGISTERED_NAME);
  });
});

// /v1/users/show Test
// テスト項目
// 正常(名前・ID)・ユーザ無し・認証済み(名前・ID)
Deno.test("users show:normal", async (t) => {
  await useUser(async (user, firebaseUser) => {
    await t.step({
      name: "by name",
      fn: async () => {
        const res = await ac.usersShow(user.name);
        assertUser(res.data, user);
      },
    });
    await t.step({
      name: "by id",
      fn: async () => {
        const res = await ac.usersShow(user.id);
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
        assertUser(res.data, user, true);
      },
    });
  });
});
Deno.test("users show:not user", async () => {
  const res = await ac.usersShow(crypto.randomUUID());
  assertEquals(res.data, errors.NOT_USER);
});

// /v1/users/search Test
// テスト項目
// 正常(名前・ID)・クエリ無し
Deno.test("users search:normal", async (t) => {
  await useUser(async (user) => {
    await t.step({
      name: "by name",
      fn: async () => {
        const res = await ac.usersSearch(user.name);
        assertUser(res.data[0], user);
      },
    });
    await t.step({
      name: "by id",
      fn: async () => {
        const res = await ac.usersSearch(user.id);
        assertUser(res.data[0], user);
      },
    });
  });
});
Deno.test("users search:no query", async (t) => {
  await t.step({
    name: `query is ""`,
    fn: async () => {
      const res = await ac.usersSearch("");
      assertEquals(res.data, errors.NOTHING_SEARCH_QUERY);
    },
  });
  await t.step({
    name: "no query",
    fn: async () => {
      const res = await ac._fetch(`/v1/users/search`);
      const json = await res.json();
      assertEquals(json, errors.NOTHING_SEARCH_QUERY);
    },
  });
});

// /v1/users/delete Test
// テスト項目
// 正常(名前で削除・IDで削除)・パスワード無し・ユーザ無し
Deno.test("users delete:normal by bearerToken", async () => {
  await useUser(async (user) => {
    const res = await ac.usersDelete({
      option: { dryRun: true },
    }, `Bearer ${user.bearerToken}`);
    assertUser(res.data, user);
  });
});
Deno.test("users delete:invalid bearerToken", async () => {
  const res = await ac.usersDelete({ option: { dryRun: true } }, "");
  assertEquals(res.res.status, 401);
  assertEquals(res.data, errors.UNAUTHORIZED);
});

Deno.test("users delete:not user", async () => {
  const res = await ac.usersDelete(
    { option: { dryRun: true } },
    `Bearer ${crypto.randomUUID()}`,
  );
  assertEquals(res.res.status, 401);
  assertEquals(res.data, errors.UNAUTHORIZED);
});
