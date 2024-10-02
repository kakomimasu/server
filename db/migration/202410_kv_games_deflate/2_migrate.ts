import * as fs from "jsr:@std/fs";

import { kv } from "../../../core/kv.ts";

const baseUrl = new URL(import.meta.url);

const GAMES_KEY = "games";

const newKvPath = new URL("./new.kv", baseUrl);
if (!await fs.exists(newKvPath)) {
  console.error("new.kv が見つかりません");
  Deno.exit(1);
}
const newKv = await Deno.openKv(newKvPath.pathname);

// 移行
const data = newKv.list<any>({ prefix: [GAMES_KEY] });
for await (const d of data) {
  kv.set(d.key, d.value);
}
console.log("kv に保存しました");
