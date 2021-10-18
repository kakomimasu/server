// firestoreにボード情報をアップする
// deno run -A --location http://localhost .\v1\util\board_uploader.ts .\v1\board\A-1.json

import { setBoard } from "../parts/firestore_opration.ts";

const path = Deno.args[0];
const json = JSON.parse(Deno.readTextFileSync(path));
await setBoard(json);
Deno.exit();
