import { getBoards, kv, setBoard } from "../core/kv.ts";

import boards from "./boards.json" with { type: "json" };

(await getBoards()).forEach(async (a) => await kv.delete(["boards", a.name]));

console.log(boards);

for (const board of Object.values(boards)) {
  await setBoard(board);
}
