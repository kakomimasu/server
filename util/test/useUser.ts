import { assert, firebaseJsAuth } from "../../deps-test.ts";
import { initFirebaseClient } from "../../test/firebase-js-sdk.ts";

import { app } from "../../core/firebase.ts";

import ApiClient, { User } from "../../client/client.ts";

const auth = app.auth();

const ac = new ApiClient();

const { auth: clientAuth } = initFirebaseClient();

export async function createFirebaseUser() {
  const userRecord = await auth.createUser({
    email: `${crypto.randomUUID()}@example.com`,
    password: "test-client",
  });
  const userCredential = await firebaseJsAuth.signInWithCustomToken(
    clientAuth,
    await auth.createCustomToken(userRecord.uid),
  );
  return userCredential;
}

export async function useUser(
  runFn: (
    user: Required<User>,
    firebaseUser: firebaseJsAuth.UserCredential,
  ) => Promise<void>,
) {
  // 新規Firebaseユーザ作成
  const u = await createFirebaseUser();

  // 新規囲みマス ユーザ作成
  const user = await ac.createUser({
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
    await ac.deleteUser(user.data.id, {}, await u.user.getIdToken());
  }
}
