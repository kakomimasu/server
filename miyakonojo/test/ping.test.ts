import { assert, assertEquals } from "../../deps-test.ts";

import { useUser } from "../../util/test/useUser.ts";

import { validator } from "../parts/openapi.ts";

const baseUrl = "http://localhost:8880/miyakonojo";

Deno.test({
  name: "miyakonojo API",
  fn: async (t) => {
    await useUser(async (user) => {
      const token = user.bearerToken;

      await t.step("/ping", async (t) => {
        await t.step("200 Success", async () => {
          const res = await fetch(baseUrl + "/ping", {
            headers: { "Authorization": token },
          });
          const json = await res.json();
          assertEquals(res.status, 200);
          assert(validator.validateResponse(
            json,
            {
              path: "/ping",
              method: "get",
              statusCode: 200,
              contentType: "application/json",
            } as const,
          ));
        });
        await t.step("401 Failure", async () => {
          const res = await fetch(baseUrl + "/ping", {
            headers: { "Authorization": "" },
          });
          const json = await res.json();
          assertEquals(res.status, 401);
          assert(validator.validateResponse(
            json,
            {
              path: "/ping",
              method: "get",
              statusCode: 401,
              contentType: "application/json",
            } as const,
          ));
        });
      });
    });
  },
});
