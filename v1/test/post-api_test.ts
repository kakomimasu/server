import { assertEquals } from "../../deps-test.ts";

import { useUser } from "../../util/test/useUser.ts";

import { randomUUID } from "../../core/util.ts";
import { errors } from "../../core/error.ts";

const urls = [
  `POST game/create`,
  `POST match`,
  `POST match/${randomUUID()}/action`,
  `POST tournaments`,
  `DELETE tournaments/${randomUUID()}`,
  `POST tournaments/${randomUUID()}/users`,
  `POST users`,
  `DELETE users/${randomUUID()}`,
];

// fetch all urls by no Content-Type header
urls.forEach((url) => {
  Deno.test(`${url} without Content-Type header`, async () => {
    const [method, path] = url.split(" ");
    const res = await fetch("http://localhost:8880/v1/" + path, {
      method,
      body: "a",
    });
    const body = await res.json();
    assertEquals(body, errors.INVALID_CONTENT_TYPE);
  });
});

// fetch all urls by invalid json
for await (const url of urls) {
  Deno.test(`${url} with invalid json`, async () => {
    const [method, path] = url.split(" ");
    await useUser(async (user) => {
      const res = await fetch("http://localhost:8880/v1/" + path, {
        method,
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
