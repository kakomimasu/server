import { getAuth, signInWithEmailAndPassword } from "../../deps.ts";
import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { randomUUID } from "../../core/util.ts";

import ApiClient from "../../client/client.ts";

import "../../core/firestore.ts";

const auth = getAuth();
// const u = await createUserWithEmailAndPassword(
//   auth,
//   "client@example.com",
//   "test-client",
// );
const u = await signInWithEmailAndPassword(
  auth,
  "client@example.com",
  "test-client",
);

const ac = new ApiClient();

import { errors } from "../../core/error.ts";

const uuid = randomUUID();
const data = { screenName: uuid, name: uuid };

let bearerToken = undefined;

const assertUser = (
  user,
  sample,
  noSafe = false,
) => {
  const user_ = { ...user };
  const sample_ = { ...sample };
  //console.log("assert user", user_, sample_);
  sample_.gamesId = [];
  if (noSafe) {
    assert(v4.validate(user_.bearerToken));
  }
  user_.id = sample_.id = undefined;
  user_.bearerToken = sample_.bearerToken = undefined;
  assert(Array.isArray(user.gamesId));
  user_.gamesId = sample_.gamesId;
  assertEquals(user_, sample_);
};

// /v1/users/regist Test
// テスト項目
// 正常・表示名無し・名前無し・登録済みのユーザ
Deno.test("users regist:normal", async () => {
  const res = await ac.usersRegist({
    ...data,
    option: { dryRun: true },
  }, await u.user.getIdToken());
  assertUser(res.data, data, true);
});
Deno.test("users regist:invalid screenName", async () => {
  const token = await u.user.getIdToken();
  const data_ = {
    ...data,
    screenName: undefined,
    option: { dryRun: true },
  };
  {
    const res = await ac.usersRegist(data_, token);
    assertEquals(res.data, errors.INVALID_SCREEN_NAME);
  }
  {
    data_.screenName = null;
    const res = await ac.usersRegist(data_, token);
    assertEquals(res.data, errors.INVALID_SCREEN_NAME);
  }
  {
    data_.screenName = "";
    const res = await ac.usersRegist(data_, token);
    assertEquals(res.data, errors.INVALID_SCREEN_NAME);
  }
});
Deno.test("users regist:invalid name", async () => {
  const token = await u.user.getIdToken();
  const data_ = {
    ...data,
    name: undefined,
    option: { dryRun: true },
  };
  {
    const res = await ac.usersRegist(data_, token);
    assertEquals(res.data, errors.INVALID_USER_NAME);
  }
  {
    data_.name = null;
    const res = await ac.usersRegist(data_, token);
    assertEquals(res.data, errors.INVALID_USER_NAME);
  }
  {
    data_.name = "";
    const res = await ac.usersRegist(data_, token);
    assertEquals(res.data, errors.INVALID_USER_NAME);
  }
});
Deno.test("users regist:already registered name", async () => {
  const token = await u.user.getIdToken();
  let res = await ac.usersRegist(data, token);
  assertUser(res.data, data, true);
  data.id = res.data.id;
  bearerToken = res.data.bearerToken;

  res = await ac.usersRegist(data, token);
  assertEquals(res.data, errors.ALREADY_REGISTERED_NAME);
});

// /v1/users/show Test
// テスト項目
// 正常(名前・ID)・ユーザ無し・認証済み(名前・ID)
Deno.test("users show:normal by name", async () => {
  const res = await ac.usersShow(data.name);
  assertUser(res.data, data);
});
Deno.test("users show:normal by id", async () => {
  const res = await ac.usersShow(data.id);
  assertUser(res.data, data);
});
Deno.test("users show:not user", async () => {
  const res = await ac.usersShow(randomUUID());
  assertEquals(res.data, errors.NOT_USER);
});
Deno.test("users show:normal with auth(jwt)", async () => {
  const res = await ac.usersShow(data.name, await u.user.getIdToken());
  assertUser(res.data, data, true);
});

// /v1/users/search Test
// テスト項目
// 正常(名前・ID)・クエリ無し
Deno.test("users search:normal by name", async () => {
  const res = await ac.usersSearch(data.name);
  assertUser(res.data[0], data);
});
Deno.test("users search:normal by id", async () => {
  const res = await ac.usersSearch(data.id);
  assertUser(res.data[0], data);
});
Deno.test("users search:no query", async () => {
  {
    const res = await ac.usersSearch("");
    assertEquals(res.data, errors.NOTHING_SEARCH_QUERY);
  }
  {
    const res = await ac._fetch(`/v1/users/search`);
    const json = await res.json();
    assertEquals(json, errors.NOTHING_SEARCH_QUERY);
  }
});

// /v1/users/delete Test
// テスト項目
// 正常(名前で削除・IDで削除)・パスワード無し・ユーザ無し
Deno.test("users delete:normal by bearerToken", async () => {
  const res = await ac.usersDelete({
    option: { dryRun: true },
  }, `Bearer ${bearerToken}`);
  assertUser(res.data, data);
});
Deno.test("users delete:invalid bearerToken", async () => {
  const res = await ac.usersDelete({ option: { dryRun: true } }, "");
  assertEquals(res.res.status, 401);
  assertEquals(res.data, errors.UNAUTHORIZED);
});

Deno.test("users delete:not user", async () => {
  const res = await ac.usersDelete(
    { option: { dryRun: true } },
    `Bearer ${randomUUID()}`,
  );
  assertEquals(res.res.status, 401);
  assertEquals(res.data, errors.UNAUTHORIZED);
});
Deno.test("users delete:normal no dryrun", async () => {
  const res = await ac.usersDelete({ ...data }, `Bearer ${bearerToken}`);
  assertUser(res.data, data);
});
