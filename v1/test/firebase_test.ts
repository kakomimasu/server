import { assertEquals } from "../../deps-test.ts";

import { app } from "../../core/firebase.ts";
import { useUser } from "../../util/test/useUser.ts";

const auth = app.auth();

// 囲みマスユーザを削除した際にFirebase上からも削除されることを確認するテスト
Deno.test("When delete kkmm-user, confirm no change in firebase user.", async () => {
  const beforeUsers = (await auth.listUsers()).users.map((u) => u.uid);
  await useUser(async () => {});
  const afterUsers = (await auth.listUsers()).users.map((u) => u.uid);
  assertEquals(beforeUsers, afterUsers);
});
