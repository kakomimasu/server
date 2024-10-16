import { assert } from "@std/assert";
import { v4 } from "@std/uuid";
import { randomUUID } from "../../core/util.ts";

Deno.test("randamUUID", () => {
  const uuid = randomUUID();
  assert(v4.validate(uuid));
});
