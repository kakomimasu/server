import { assertEquals } from "../../deps-test.ts";

import { useUser } from "../../util/test/useUser.ts";

import { randomUUID } from "../../core/util.ts";
import { errors } from "../../core/error.ts";

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
    await useUser(async (user) => {
      const res = await fetch("http://localhost:8880/v1/" + url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + user.bearerToken,
        },
        body: "{",
      });
      const body = await res.json();
      assertEquals(body, errors.INVALID_SYNTAX);
    });
  });
}
