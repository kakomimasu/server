import { decompression } from "../../../core/util.ts";

const USERS_KEY = "users";
const TOURNAMENT_KEY = "tournaments";
const GAMES_KEY = "games";
const BOARDS_KEY = "boards";

if (!Deno.env.get("DENO_KV_ACCESS_TOKEN")) {
  throw new Error(
    "DENO_KV_ACCESS_TOKEN is required to export the existing KV data.",
  );
}

const kv = await Deno.openKv(
  "https://api.deno.com/databases/24cc05be-e9c0-4695-9dcb-29ef4166e35c/connect",
);

const users = [];
for await (const entry of kv.list({ prefix: [USERS_KEY] })) {
  users.push(entry.value);
}

const tournaments = [];
for await (const entry of kv.list({ prefix: [TOURNAMENT_KEY] })) {
  tournaments.push(entry.value);
}

const games = [];
for await (const entry of kv.list<ArrayBuffer>({ prefix: [GAMES_KEY] })) {
  games.push({
    id: String(entry.key[1]),
    snapshot: await decompression(entry.value),
  });
}

const boards = [];
for await (const entry of kv.list({ prefix: [BOARDS_KEY] })) {
  boards.push(entry.value);
}

const baseUrl = new URL(import.meta.url);
const outputPath = new URL("./kv-export.json", baseUrl).pathname;

await Deno.writeTextFile(
  outputPath,
  JSON.stringify({ users, tournaments, games, boards }, null, 2),
);

console.log(
  `[db:export-kv] Wrote ${users.length} users, ${tournaments.length} tournaments, ${games.length} games, ${boards.length} boards to ${outputPath}`,
);
