import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client.ts";
import type { Prisma } from "../../../generated/prisma/client.ts";

if (!Deno.env.get("DATABASE_URL")) {
  throw new Error(
    "DATABASE_URL is required to import data into Prisma Postgres.",
  );
}

const baseUrl = new URL(import.meta.url);
const inputPath = new URL(Deno.args[0] ?? "./kv-export.json", baseUrl).pathname;
const batchSize = 100;

type ImportedBoard = {
  name: string;
  [key: string]: unknown;
};

const input = JSON.parse(await Deno.readTextFile(inputPath)) as {
  users: Array<{
    screenName: string;
    name: string;
    id: string;
    avaterUrl: string;
    sessions: string[];
    bearerToken: string;
  }>;
  tournaments: Array<{
    id: string;
    name: string;
    type: "round-robin" | "knockout";
    organizer: string;
    remarks: string;
    users: string[];
    gameIds: string[];
  }>;
  games: Array<{
    id: string;
    snapshot: unknown;
  }>;
  boards?: ImportedBoard[];
};

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeBoard(board: ImportedBoard): {
  name: string;
  snapshot: Prisma.InputJsonValue;
} {
  return {
    name: board.name,
    snapshot: toPrismaJson(board),
  };
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: Deno.env.get("DATABASE_URL")! }),
});

async function createManyInBatches<T>(
  label: string,
  data: T[],
  createMany: (batch: T[]) => Prisma.PrismaPromise<unknown>,
) {
  if (data.length === 0) {
    return;
  }

  for (let index = 0; index < data.length; index += batchSize) {
    const batch = data.slice(index, index + batchSize);
    await createMany(batch);

    console.log(
      `[db:import-kv] Imported ${
        Math.min(index + batch.length, data.length)
      }/${data.length} ${label}`,
    );
  }
}

await prisma.$transaction([
  prisma.board.deleteMany(),
  prisma.game.deleteMany(),
  prisma.tournament.deleteMany(),
  prisma.user.deleteMany(),
  prisma.oAuthSession.deleteMany(),
  prisma.siteSession.deleteMany(),
]);

await createManyInBatches(
  "users",
  input.users,
  (batch) => prisma.user.createMany({ data: batch }),
);
await createManyInBatches(
  "tournaments",
  input.tournaments,
  (batch) => prisma.tournament.createMany({ data: batch }),
);
await createManyInBatches(
  "games",
  input.games,
  (batch) =>
    prisma.game.createMany({
      data: batch.map((game) => ({
        id: game.id,
        snapshot: toPrismaJson(game.snapshot),
      })),
    }),
);
await createManyInBatches(
  "boards",
  input.boards ?? [],
  (batch) =>
    prisma.board.createMany({
      data: batch.map(normalizeBoard),
    }),
);

console.log(
  `[db:import-kv] Imported ${input.users.length} users, ${input.tournaments.length} tournaments, ${input.games.length} games, ${
    input.boards?.length ?? 0
  } boards from ${inputPath} with batch size ${batchSize}`,
);
