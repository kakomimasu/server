import { assert, assertEquals } from "@std/assert";
import { delay } from "@std/async";
import { getAllUsers } from "../../core/kv.ts";
import { randomUUID } from "../../core/util.ts";
import { errors } from "../../core/error.ts";
import { useUser } from "../../util/test/useUser.ts";
import { app } from "../../server.ts";

Deno.test(`GET /v1/oauth/signout:success`, async () => {
  await useUser(async (user, sessionId) => {
    const res = await app.request("/v1/oauth/signout", {
      headers: {
        "Cookie": `site-session=${sessionId}`,
      },
      redirect: "manual",
    });
    await res.text();

    assert(res.status === 302);

    await delay(500);
    // ユーザ情報からセッション情報が削除されているかを確認
    const users = await getAllUsers();
    const signOutUser = users.find((u) => u.id === user.id);
    assert(signOutUser?.sessions.includes(sessionId) === false);
  });
});

Deno.test(`GET /v1/oauth/signout:unauthorized`, async () => {
  await useUser(async () => {
    const res = await app.request("/v1/oauth/signout", {
      headers: {
        "Cookie": `site-session=${randomUUID()}`,
      },
      redirect: "manual",
    });

    assert(res.status === 400);

    const data = await res.json();
    assertEquals(data, errors.UNAUTHORIZED);
  });
});
