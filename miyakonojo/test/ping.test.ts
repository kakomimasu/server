import { assert, assertEquals } from "@std/assert";

import { useUser } from "../../util/test/useUser.ts";

import { validator } from "../parts/openapi.ts";

import { app } from "../../server.ts";

const baseUrl = "/miyakonojo";

Deno.test({
  name: "miyakonojo API",
  fn: async (t) => {
    await useUser(async (user) => {
      const token = user.bearerToken;

      await t.step("/ping", async (t) => {
        await t.step("200 Success", async () => {
          const res = await app.request(baseUrl + "/ping", {
            headers: { "Authorization": token },
          });
          const json = await res.json();
          assertEquals(res.status, 200);
          assert(validator.validateResponse(
            json,
            "/ping",
            "get",
            "200",
            "application/json",
          ));
        });
        await t.step("401 Failure", async () => {
          const res = await app.request(baseUrl + "/ping", {
            headers: { "Authorization": "" },
          });
          const json = await res.json();
          assertEquals(res.status, 401);
          assert(validator.validateResponse(
            json,
            "/ping",
            "get",
            "401",
            "application/json",
          ));
        });
      });
    });
  },
});
