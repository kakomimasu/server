import * as fs from "jsr:@std/fs";

import { ExpGame } from "../../../core/expKakomimasu.ts";
import { kv } from "../../../core/kv.ts";

const baseUrl = new URL(import.meta.url);

const GAMES_KEY = "games";

const dumpKvPath = new URL("./dump.kv", baseUrl);
const newKvPath = new URL("./new.kv", baseUrl);
if (await fs.exists(dumpKvPath) || await fs.exists(newKvPath)) {
  console.error("dump.kv または new.kv がすでに存在しています");
  Deno.exit(1);
}
const dumpKv = await Deno.openKv(dumpKvPath.pathname);
const newKv = await Deno.openKv(newKvPath.pathname);

// 移行前のゲームデータをすべて取得
// deno-lint-ignore no-explicit-any
const data = kv.list<any>({ prefix: [GAMES_KEY] });
for await (const d of data) {
  // dump.kv に再度保存
  dumpKv.set(d.key, d.value);
}
console.log("dump.kv に保存しました");

// 移行後のデータに変換して保存
// deno-lint-ignore no-explicit-any
const dumpData = dumpKv.list<any>({ prefix: [GAMES_KEY] });
for await (const d of dumpData) {
  const game = ExpGame.fromJSON(d.value);
  const ab = await compression(game.toLogJSON());
  // new-dump.kv に変換したデータを保存
  newKv.set(d.key, ab);
}
console.log("new.kv に保存しました");

/** deflate-raw 形式に圧縮する関数 */
async function compression(obj: Parameters<JSON["stringify"]>[0]) {
  const str = JSON.stringify(obj);
  const complessedStream = new Blob([str]).stream().pipeThrough(
    new CompressionStream("deflate-raw"),
  );
  const complessedArrayBuffer = await new Response(complessedStream)
    .arrayBuffer();

  return complessedArrayBuffer;
}
