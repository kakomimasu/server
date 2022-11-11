import { createUserWithEmailAndPassword, getAuth } from "../../deps.ts";
import { assert } from "../../deps-test.ts";

import "../../core/firestore.ts";

import ApiClient, { User } from "../../client/client.ts";

const ac = new ApiClient();
const auth = getAuth();

export async function useUser(runFn: (user: User) => Promise<void>) {
  // 新規Firebaseユーザ作成
  const u = await createUserWithEmailAndPassword(
    auth,
    `${crypto.randomUUID()}@example.com`,
    "test-client",
  );

  // 新規囲みマス ユーザ作成
  const user = await ac.usersRegist({
    screenName: `test:${u.user.uid}`,
    name: crypto.randomUUID(),
  }, await u.user.getIdToken());

  assert(user.success, "user regist failed");

  try {
    await runFn(user.data);
  } catch (e) {
    throw e;
  } finally {
    // テスト成功時も失敗時もユーザ削除
    await ac.usersDelete({}, await u.user.getIdToken());
  }
}
