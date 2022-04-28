import { getAuth, signInWithEmailAndPassword } from "../../deps.ts";
import { assertEquals } from "../../deps-test.ts";

import ApiClient from "../../client/client.ts";
import { errors } from "../error.ts";
import { randomUUID } from "../util.ts";

const ac = new ApiClient();

import "../parts/firestore_opration.ts";

const auth = getAuth();
const u = await signInWithEmailAndPassword(
  auth,
  "client@example.com",
  "test-client",
);

const urls = [
  `game/create`,
  `match`,
  `match/${randomUUID()}/action`,
  `tournament/create`,
  `tournament/delete`,
  `tournament/add`,
  `users/regist`,
  `users/delete`,
];

// fetch all urls by no Content-Type header
urls.forEach((url) => {
  Deno.test(`${url} without Content-Type header`, async () => {
    const res = await fetch("http://localhost:8880/v1/" + url, {
      method: "POST",
      body: "a",
    });
    const body = await res.json();
    assertEquals(body, errors.INVALID_CONTENT_TYPE);
  });
});

// fetch all urls by invalid json
for await (const url of urls) {
  Deno.test(`${url} with invalid json`, async () => {
    const uuid = randomUUID();
    const data = { screenName: uuid, name: uuid };
    const userRes = await ac.usersRegist(data, await u.user.getIdToken());
    if (!userRes.success) throw Error("Could not create user");

    const res = await fetch("http://localhost:8880/v1/" + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + userRes.data.bearerToken,
      },
      body: "{",
    });
    const body = await res.json();
    assertEquals(body, errors.INVALID_SYNTAX);

    await ac.usersDelete({}, "Bearer " + userRes.data.bearerToken);
  });
}
