import type { Board, ExpGame } from "./expKakomimasu.ts";
import type { Tournament, User } from "./datas.ts";
import { app } from "./firebase.ts";

export interface FUser {
  screenName: string;
  name: string;
  id: string;
  bearerToken: string;
}

export interface FTournament {
  id: string;
  name: string;
  type: "round-robin" | "knockout";
  organizer: string;
  remarks: string;
  users: string[] | null;
  gameIds: string[] | null;
}

const db = app.database();

/** 全ユーザ保存 */
export async function setAllUsers(users: User[]): Promise<void> {
  if (users.length == 0) {
    return;
  }
  const usersRef = db.ref("users");
  const users2: FUser[] = users.map((a) => {
    return {
      screenName: a.screenName,
      name: a.name,
      id: a.id,
      bearerToken: a.bearerToken,
    };
  });
  await usersRef.set(users2);
}

/** 全ユーザ取得 */
export async function getAllUsers(): Promise<FUser[]> {
  const users: FUser[] = [];
  const usersRef = db.ref("users");
  const snap = await usersRef.get();
  snap.forEach((doc) => {
    users.push(doc.val());
  });
  return users;
}

/** 全大会保存 */
export async function setAllTournaments(
  tournaments: Tournament[],
): Promise<void> {
  const tournamentsRef = db.ref("tournaments");
  await tournamentsRef.set(tournaments);
}

/** 全大会取得 */
export async function getAllTournaments(): Promise<FTournament[]> {
  const tournaments: FTournament[] = [];
  const usersRef = db.ref("tournaments");
  const snap = await usersRef.get();
  snap.forEach((doc) => {
    tournaments.push(doc.val());
  });
  return tournaments;
}

/** 全ゲーム保存 */
export async function setGame(
  game: ExpGame,
): Promise<void> {
  const gameRef = db.ref("games/" + game.id);
  const gameJson = game.toLogJSON();
  const gameJson2 = JSON.parse(JSON.stringify(gameJson));
  await gameRef.set(gameJson2);
}

/** 全ゲーム取得 */
export async function getAllGameSnapShot() {
  const gamesRef = db.ref("games");
  const snap = await gamesRef.get();
  return snap;
}

/** ボードを1つ取得 */
export async function getBoard(id: string): Promise<Board | undefined> {
  const boardsRef = db.ref("boards/" + id);
  const snap = await boardsRef.get();
  const rawBoard = snap.val();
  if (rawBoard) {
    const board = (snap.val()) as Board;
    return board;
  } else return undefined;
}

/** ボードをすべて取得 */
export async function getAllBoards(): Promise<Board[]> {
  const boardsRef = db.ref("boards");
  const snap = await boardsRef.get();
  const boards: Board[] = [];
  // deno-lint-ignore no-explicit-any
  snap.forEach((doc: any) => {
    boards.push(doc.val() as Board);
  });
  return boards;
}

/** ボード保存(JSONから) */
// deno-lint-ignore no-explicit-any
export async function setBoard(board: any): Promise<void> {
  const boardsRef = db.ref("boards/" + board.name);
  await boardsRef.set(board);
}
