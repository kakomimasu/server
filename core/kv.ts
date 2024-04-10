import { env } from "./env.ts";
import type { Board, ExpGame } from "./expKakomimasu.ts";
import type { Tournament, User } from "./datas.ts";

export const kv = await Deno.openKv(
  env.DENO_KV_ACCESS_TOKEN
    ? "https://api.deno.com/databases/24cc05be-e9c0-4695-9dcb-29ef4166e35c/connect"
    : undefined,
);

const BOARD_KEY = "boards";
const TOURNAMENT_KEY = "tournaments";
const USERS_KEY = "users";
const GAMES_KEY = "games";

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

/** 全ユーザ保存 */
export async function setAllUsers(users: User[]): Promise<void> {
  const users2: KvUser[] = users.map((a) => {
    return {
      screenName: a.screenName,
      name: a.name,
      id: a.id,
      avaterUrl: a.avaterUrl,
      sessions: a.sessions,
      bearerToken: a.bearerToken,
    };
  });
  const promises = users2.map((u) => {
    kv.set([USERS_KEY, u.id], u);
  });
  await Promise.all(promises);
}

/** 全ユーザ取得 */
export async function getAllUsers(): Promise<KvUser[]> {
  const data = kv.list<KvUser>({ prefix: [USERS_KEY] });

  const users = (await Array.fromAsync(data)).map((d) => d.value);
  return users;
}

/** ユーザ削除 */
export async function deleteUser(userId: string) {
  const data = await kv.get<KvUser>([USERS_KEY, userId]);
  if (data.value) {
    const at = kv.atomic();
    at.delete([USERS_KEY, userId]);
    data.value.sessions.forEach((sessionId) =>
      at.delete(["site_sessions", sessionId])
    );
    at.commit();
  }
}

/** 全大会保存 */
export async function setAllTournaments(
  tournaments: Tournament[],
): Promise<void> {
  const promises = tournaments.map((t) => {
    kv.set([TOURNAMENT_KEY, t.id], t);
  });
  await Promise.all(promises);
}

/** 全大会取得 */
export async function getAllTournaments(): Promise<KvTournament[]> {
  const data = kv.list<KvTournament>({ prefix: [TOURNAMENT_KEY] });

  const tournaments = (await Array.fromAsync(data)).map((d) => d.value);
  // tournaments[0].addUser("test");
  // console.log(tournaments[0]);
  return tournaments;
}

/** 全ゲーム保存 */
export async function setGame(
  game: ExpGame,
): Promise<void> {
  await kv.set([GAMES_KEY, game.id], game.toLogJSON());
  // const gameRef = ref(db, "games/" + game.id);
  // const gameJson = game.toLogJSON();
  // const gameJson2 = JSON.parse(JSON.stringify(gameJson));
  // await set(gameRef, gameJson2);
}

/** 全ゲーム取得 */
export async function getAllGameSnapShot() {
  const data = kv.list({ prefix: [GAMES_KEY] });

  const games = (await Array.fromAsync(data)).map((d) => d.value);
  // tournaments[0].addUser("test");
  // console.log(users[0]);
  return games;

  // const gamesRef = ref(db, "games");
  // const snap = await get(gamesRef);
  // return snap;
}

/** ボードを1つ取得 */
export async function getBoard(boardName: string): Promise<Board | undefined> {
  const data = await kv.get<Board>([BOARD_KEY, boardName]);
  if (data.value) {
    return data.value;
  } else return undefined;
}

/** ボードをすべて取得 */
export async function getBoards(): Promise<Board[]> {
  const data = kv.list<Board>({ prefix: [BOARD_KEY] });

  const boards = (await Array.fromAsync(data)).map((d) => d.value);
  return boards;
}

/** ボード保存(JSONから) */
export async function setBoard(board: Board): Promise<void> {
  await kv.set([BOARD_KEY, board.name], board);
}
