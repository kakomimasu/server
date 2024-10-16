import { assertEquals } from "@std/assert";
import ApiClient from "../client/client.ts";

const ac = new ApiClient();
Deno.test({
  name: "version API",
  fn: async () => {
    const res = await ac.getVersion();

    assertEquals(res.success, true);
    if (res.success) {
      assertEquals(res.data.version, "local");
    }
  },
});
