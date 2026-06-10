import { PrismaPg } from "@prisma/adapter-pg";
import { type Prisma, PrismaClient } from "../generated/prisma/client.ts";
import { env } from "./env.ts";
import type { Board, ExpGame } from "./expKakomimasu.ts";
import type { Tournament, User } from "./datas.ts";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

export interface KvUser {
  screenName: string;
  name: string;
  id: string;
  avaterUrl: string;
  sessions: string[];
  bearerToken: string;
}
export interface KvTournament {
  id: string;
  name: string;
  type: "round-robin" | "knockout";
  organizer: string;
  remarks: string;
  users: string[];
  gameIds: string[];
}
function serializeUser(user: User): KvUser {
  return {
    screenName: user.screenName,
    name: user.name,
    id: user.id,
    avaterUrl: user.avaterUrl,
    sessions: [...user.sessions],
    bearerToken: user.bearerToken,
  };
}

function serializeTournament(tournament: Tournament): KvTournament {
  return {
    id: tournament.id,
    name: tournament.name,
    type: tournament.type,
    organizer: tournament.organizer,
    remarks: tournament.remarks,
    users: [...tournament.users],
    gameIds: [...tournament.gameIds],
  };
}

function serializeBoard(board: Board): Board {
  return JSON.parse(JSON.stringify(board)) as Board;
}

function deserializeBoard(value: Prisma.JsonValue): Board {
  return value as unknown as Board;
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/** 全ユーザ保存 */
export async function setAllUsers(users: User[]): Promise<void> {
  const data = users.map(serializeUser);
  await prisma.$transaction(async (tx) => {
    await tx.user.deleteMany();
    if (data.length > 0) {
      await tx.user.createMany({ data });
    }
  });
}

/** 全ユーザ取得 */
export async function getAllUsers(): Promise<KvUser[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });
  return users.map((user) => ({
    screenName: user.screenName,
    name: user.name,
    id: user.id,
    avaterUrl: user.avaterUrl,
    sessions: user.sessions,
    bearerToken: user.bearerToken,
  }));
}

/** ユーザ削除 */
export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) {
    // ユーザに紐づくサイトセッションを削除
    await prisma.siteSession.deleteMany({
      where: { id: { in: user.sessions } },
    });
    await prisma.user.delete({ where: { id: userId } });
  }
}

/** 全大会保存 */
export async function setAllTournaments(
  tournaments: Tournament[],
): Promise<void> {
  const data = tournaments.map(serializeTournament);
  await prisma.$transaction(async (tx) => {
    await tx.tournament.deleteMany();
    if (data.length > 0) {
      await tx.tournament.createMany({ data });
    }
  });
}

/** 全大会取得 */
export async function getAllTournaments(): Promise<KvTournament[]> {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "asc" },
  });
  return tournaments.map((tournament) => ({
    id: tournament.id,
    name: tournament.name,
    type: tournament.type as KvTournament["type"],
    organizer: tournament.organizer,
    remarks: tournament.remarks,
    users: tournament.users,
    gameIds: tournament.gameIds,
  }));
}

/** 全ゲーム保存 */
export async function setGame(
  game: ExpGame,
): Promise<void> {
  const snapshot = toPrismaJson(game.toLogJSON());
  await prisma.game.upsert({
    where: { id: game.id },
    update: { snapshot },
    create: {
      id: game.id,
      snapshot,
    },
  });
}

/** 全ゲーム取得 */
export async function getAllGameSnapShot() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "asc" },
  });
  return games.map((game) => game.snapshot);
}

/** ボードを1つ取得 */
export async function getBoard(boardName: string): Promise<Board | undefined> {
  const board = await prisma.board.findUnique({
    where: { name: boardName },
  });
  return board ? deserializeBoard(board.snapshot) : undefined;
}

/** ボードをすべて取得 */
export async function getBoards(): Promise<Board[]> {
  const boards = await prisma.board.findMany({
    orderBy: { createdAt: "asc" },
  });
  return boards.map((board) => deserializeBoard(board.snapshot));
}

/** ボード保存(JSONから) */
export async function setBoard(board: Board): Promise<void> {
  const snapshot = toPrismaJson(serializeBoard(board));
  await prisma.board.upsert({
    where: { name: board.name },
    update: { snapshot },
    create: {
      name: board.name,
      snapshot,
    },
  });
}
