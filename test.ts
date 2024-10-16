import { assert } from "@std/assert";
import { env } from "./core/env.ts";

// KV Databaseの初期化
import "./db/init.ts";

// Disable server logs
console.log = (_) => {};
console.error = (_) => {};

// Run server
import "./server.ts";

// Wait for server to start
const port = env.PORT;
await fetch(`http://localhost:${port}/version`);

Deno.test({
  name: "Test",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const cmd = new Deno.Command(Deno.execPath(), {
      args: [
        "test",
        "--allow-read",
        "--allow-env",
        "--allow-net",
        "--ignore=test.ts",
        "--unstable-kv",
        ...Deno.args,
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const child = cmd.spawn();
    child.stdout.pipeTo(Deno.stdout.writable);
    child.stderr.pipeTo(Deno.stderr.writable);

    const status = await child.status;
    assert(status.success);

    setTimeout(() => Deno.exit(0), 100);
  },
});
