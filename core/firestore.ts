import {
  connectAuthEmulator,
  connectDatabaseEmulator,
  Core,
  FirebaseOptions,
  get,
  getAuth,
  getDatabase,
  initializeApp,
  ref,
  set,
  signInWithEmailAndPassword,
} from "../deps.ts";

import { reqEnv } from "./env.ts";
import type { ExpGame } from "./expKakomimasu.ts";
import type { Tournament, User } from "./datas.ts";

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

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBOas3O1fmIrl51n7I_hC09YCG0EEe7tlc",
  authDomain: "kakomimasu.firebaseapp.com",
  databaseURL: "https://kakomimasu-default-rtdb.firebaseio.com",
  projectId: "kakomimasu",
  storageBucket: "kakomimasu.appspot.com",
  messagingSenderId: "883142143351",
  appId: "1:883142143351:web:dc6ddc1158aa54ada74572",
  measurementId: "G-L43FT511YW",
};

initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

if (reqEnv.FIREBASE_TEST) {
  connectAuthEmulator(auth, `http://${reqEnv.FIREBASE_EMULATOR_HOST}:9099`);
  connectDatabaseEmulator(db, reqEnv.FIREBASE_EMULATOR_HOST, 9000);
}

/** 管理ユーザでログイン */
await signInWithEmailAndPassword(
  auth,
  reqEnv.FIREBASE_USERNAME,
  reqEnv.FIREBASE_PASSWORD,
);

/** 全ユーザ保存 */
export async function setAllUsers(users: User[]): Promise<void> {
  if (users.length == 0) {
    return;
  }
  const usersRef = ref(db, "users");
  const users2: FUser[] = users.map((a) => {
    return {
      screenName: a.screenName,
      name: a.name,
      id: a.id,
      bearerToken: a.bearerToken,
    };
  });
  await set(usersRef, users2);
}

/** 全ユーザ取得 */
export async function getAllUsers(): Promise<FUser[]> {
  const users: FUser[] = [];
  const usersRef = ref(db, "users");
  const snap = await get(usersRef);
  snap.forEach((doc) => {
    users.push(doc.val());
  });
  return users;
}

/** 全大会保存 */
export async function setAllTournaments(
  tournaments: Tournament[],
): Promise<void> {
  const tournamentsRef = ref(db, "tournaments");
  await set(tournamentsRef, tournaments);
}

/** 全大会取得 */
export async function getAllTournaments(): Promise<FTournament[]> {
  const tournaments: FTournament[] = [];
  const usersRef = ref(db, "tournaments");
  const snap = await get(usersRef);
  snap.forEach((doc) => {
    tournaments.push(doc.val());
  });
  return tournaments;
}

/** 全ゲーム保存 */
export async function setGame(
  game: ExpGame,
): Promise<void> {
  const gameRef = ref(db, "games/" + game.uuid);
  const gameJson = game.toLogJSON();
  const gameJson2 = JSON.parse(JSON.stringify(gameJson));
  await set(gameRef, gameJson2);
}

/** 全ゲーム取得 */
export async function getAllGameSnapShot() {
  const gamesRef = ref(db, "games");
  const snap = await get(gamesRef);
  return snap;
}

/** ボードを1つ取得 */
export async function getBoard(id: string): Promise<Core.Board | undefined> {
  const boardsRef = ref(db, "boards/" + id);
  const snap = await get(boardsRef);
  const rawBoard = snap.val();
  if (rawBoard) {
    const board = createBoard(snap.val());
    return board;
  } else return undefined;
}

/** ボードをすべて取得 */
export async function getAllBoards(): Promise<Core.Board[]> {
  const boardsRef = ref(db, "boards");
  const snap = await get(boardsRef);
  const boards: Core.Board[] = [];
  // deno-lint-ignore no-explicit-any
  snap.forEach((doc: any) => {
    boards.push(createBoard(doc.val()));
  });
  return boards;
}

/** ボード保存(JSONから) */
// deno-lint-ignore no-explicit-any
export async function setBoard(board: any): Promise<void> {
  const boardsRef = ref(db, "boards/" + board.name);
  await set(boardsRef, board);
}

// deno-lint-ignore no-explicit-any
function createBoard(data: any) {
  const {
    width: w,
    height: h,
    points: points,
    nagent,
    nturn,
    nsec,
    nplayer,
    name,
  } = data;
  const board = new Core.Board({
    w,
    h,
    points,
    nagent,
    nturn,
    nsec,
    nplayer,
    name,
  });
  return board;
}
