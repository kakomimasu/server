import { assert, v4 } from "../../deps-test.ts";
import { randomUUID } from "../../core/util.ts";

Deno.test("randamUUID", () => {
  const uuid = randomUUID();
  assert(v4.validate(uuid));
});
