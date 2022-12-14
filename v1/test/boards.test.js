import { assert } from "../../deps-test.ts";

import { validator } from "../parts/openapi.ts";

import ApiClient from "../../client/client.ts";

const ac = new ApiClient();

// /v1/boards Test
// テスト項目
// 正常
Deno.test("GET v1/boards:normal", async () => {
  const res = await ac.getBoards();
  const isValid = validator.validateResponse(
    res.data,
    "/boards",
    "get",
    200,
    "application/json",
  );
  assert(isValid);
});
