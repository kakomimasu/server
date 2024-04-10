import { kv, setBoard } from "../core/kv.ts";

import boards from "./boards.json" with { type: "json" };

// 全データ削除
for await (const entry of kv.list({ prefix: [] })) {
  console.log("[db-init]Deleted:", entry.key);
  await kv.delete(entry.key);
}

// ボード情報だけ追加
for (const board of Object.values(boards)) {
  await setBoard(board);
}
