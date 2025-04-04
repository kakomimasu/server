import { assertEquals } from "@std/assert";

import { useUser } from "../../util/test/useUser.ts";

import { randomUUID } from "../../core/util.ts";
import { errors } from "../../core/error.ts";

import { app } from "../../server.ts";

const urls = [
  `POST matches`,
  `POST matches/${randomUUID()}/players`,
  `POST matches/free/players`,
  `POST matches/ai/players`,
  `PATCH matches/${randomUUID()}/actions`,
  `POST tournaments`,
  `DELETE tournaments/${randomUUID()}`,
  `POST tournaments/${randomUUID()}/users`,
  `DELETE users/me`,
];

// request all urls by no Content-Type header
urls.forEach((url) => {
  Deno.test(`${url} without Content-Type header`, async () => {
    const [method, path] = url.split(" ");
    const res = await app.request("/v1/" + path, {
      method,
      body: "a",
    });
    const body = await res.json();
    assertEquals(body, errors.INVALID_CONTENT_TYPE);
  });
});

// request all urls by invalid json
for await (const url of urls) {
  Deno.test(`${url} with invalid json`, async () => {
    const [method, path] = url.split(" ");
    await useUser(async (user) => {
      const res = await app.request("/v1/" + path, {
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
