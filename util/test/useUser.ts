import {
  createUserWithEmailAndPassword,
  getAuth,
  UserCredential,
} from "../../deps.ts";
import { assert } from "../../deps-test.ts";

import { firebaseInit } from "../../core/firebase.ts";

import ApiClient, { User } from "../../client/client.ts";

await firebaseInit();
const auth = getAuth();

const ac = new ApiClient();

export async function createFirebaseUser() {
  const u = await createUserWithEmailAndPassword(
    auth,
    `${crypto.randomUUID()}@example.com`,
    "test-client",
  );
  return u;
}

export async function useUser(
  runFn: (user: Required<User>, firebaseUser: UserCredential) => Promise<void>,
) {
  // 新規Firebaseユーザ作成
  const u = await createFirebaseUser();

  // 新規囲みマス ユーザ作成
  const user = await ac.usersRegist({
    screenName: `test:${u.user.uid}`,
    name: crypto.randomUUID(),
  }, await u.user.getIdToken());

  assert(user.success, "user regist failed");

  try {
    await runFn(user.data, u);
  } catch (e) {
    throw e;
  } finally {
    // テスト成功時も失敗時もユーザ削除
    await ac.usersDelete(user.data.id, {}, await u.user.getIdToken());
  }
}
