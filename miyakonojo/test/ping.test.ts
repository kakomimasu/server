import { getAuth, signInWithEmailAndPassword } from "../../deps.ts";
import { assertEquals } from "../../deps-test.ts";

import "../../core/firestore.ts";

import ApiClient from "../../client/client.ts";

const baseUrl = "http://localhost:8880/miyakonojo";

const ac = new ApiClient();
const auth = getAuth();
const u = await signInWithEmailAndPassword(
  auth,
  "client@example.com",
  "test-client",
);

Deno.test({
  name: "miyakonojo API",
  fn: async (t) => {
    let token: string;
    const registedUser = await ac.usersRegist({
      screenName: "test",
      name: "test",
    }, await u.user.getIdToken());
    if (registedUser.success) token = registedUser.data.bearerToken;
    else {
      const registedUser = await ac.usersShow(
        "test",
        await u.user.getIdToken(),
      );
      if (!registedUser.success) throw Error("user get failed");
      token = registedUser.data.bearerToken ?? "";
    }

    await t.step("/ping", async (t) => {
      await t.step("200 Success", async () => {
        const res = await fetch(baseUrl + "/ping", {
          headers: { "Authorization": token },
        });
        const json = await res.json();
        assertEquals(res.status, 200);
        assertEquals(json, {
          status: "OK",
        });
      });
      await t.step("401 Failure", async () => {
        const res = await fetch(baseUrl + "/ping", {
          headers: { "Authorization": "" },
        });
        const json = await res.json();
        assertEquals(res.status, 401);
        assertEquals(json, {
          status: "InvalidToken",
        });
      });
    });

    await ac.usersDelete({}, `Bearer ${token}`);
  },
});
