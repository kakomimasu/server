import { assert } from "https://deno.land/std@0.180.0/testing/asserts.ts";
import { reqEnv } from "./core/env.ts";

// Disable server logs
console.log = (_) => {};
console.error = (_) => {};

// Run server
import "./server.ts";

// Wait for server to start
const port = reqEnv.PORT;
await fetch(`http://localhost:${port}/version`);

Deno.test("run test", async () => {
  // Run tests
  const cmd = new Deno.Command(Deno.execPath(), {
    args: [
      "test",
      "--allow-read",
      "--allow-env",
      "--allow-net",
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
});
