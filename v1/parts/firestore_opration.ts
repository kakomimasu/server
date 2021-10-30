import { config, Core } from "../../deps.ts";
import type { IUser } from "../user.ts";
import { Tournament as ITournament } from "../types.ts";
import { ExpGame } from "./expKakomimasu.ts";
import { pathResolver } from "../util.ts";
import {
  get,
  getAuth,
  getDatabase,
  initializeApp,
  ref,
  set,
  signInWithEmailAndPassword,
} from "../../deps.ts";

// 初期化
const conf = {
  apiKey: "AIzaSyBOas3O1fmIrl51n7I_hC09YCG0EEe7tlc",
  authDomain: "kakomimasu.firebaseapp.com",
  projectId: "kakomimasu",
  storageBucket: "kakomimasu.appspot.com",
  messagingSenderId: "883142143351",
  appId: "1:883142143351:web:dc6ddc1158aa54ada74572",
  measurementId: "G-L43FT511YW",
};

const app = initializeApp(conf);
const auth = getAuth();
const db = getDatabase(app, "https://kakomimasu-default-rtdb.firebaseio.com/");

/** 管理ユーザでログイン */
async function login() {
  if (auth.currentUser) {
    return;
  }
  const resolve = pathResolver(import.meta);
  const env = config({
    path: resolve("../../.env"),
    defaults: resolve("../../.env.default"),
  });

  let firebaseUsername: string | undefined = env.FIREBASE_USERNAME;
  if (firebaseUsername === undefined) {
    firebaseUsername = Deno.env.get("FIREBASE_USERNAME");
  }
  let firebasePassword: string | undefined = env.FIREBASE_PASSWORD;
  if (firebasePassword === undefined) {
    firebasePassword = Deno.env.get("FIREBASE_PASSWORD");
  }

  await signInWithEmailAndPassword(
    auth,
    firebaseUsername,
    firebasePassword,
  );
}

/** 全ユーザ保存 */
export async function setAllUsers(users: IUser[]): Promise<void> {
  const usersRef = ref(db, "users");
  const users2 = users.map((a) => ({
    screenName: a.screenName,
    name: a.name,
    id: a.id,
    password: a.password,
    gamesId: a.gamesId,
    bearerToken: a.bearerToken,
  }));
  await set(usersRef, users2);
}

/** 全ユーザ取得 */
export async function getAllUsers(): Promise<IUser[]> {
  const users: IUser[] = [];
  const usersRef = ref(db, "users");
  const snap = await get(usersRef);
  snap.forEach((doc: any) => {
    users.push(doc.val());
  });
  return users;
}

/** 全大会保存 */
export async function setAllTournaments(
  tournaments: ITournament[],
): Promise<void> {
  const tournamentsRef = ref(db, "tournaments");
  await set(tournamentsRef, tournaments);
}

/** 全大会取得 */
export async function getAllTournaments(): Promise<ITournament[]> {
  const tournaments: ITournament[] = [];
  const usersRef = ref(db, "tournaments");
  const snap = await get(usersRef);
  snap.forEach((doc: any) => {
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
  await set(gameRef, gameJson);
}

/** 全ゲーム取得 */
export async function getAllGames(): Promise<ExpGame[]> {
  const games: ExpGame[] = [];
  const gamesRef = ref(db, "games");
  const snap = await get(gamesRef);
  snap.forEach((doc: any) => {
    const game = ExpGame.restore(doc.val());
    games.push(game);
  });
  return games;
}

/** ボードを1つ取得 */
export async function getBoard(id: string): Promise<Core.Board> {
  const boardsRef = ref(db, "boards/" + id);
  const snap = await get(boardsRef);
  const board = createBoard(snap.val());
  return board;
}

/** ボードをすべて取得 */
export async function getAllBoards(): Promise<Core.Board[]> {
  await login();
  const boardsRef = ref(db, "boards");
  const snap = await get(boardsRef);
  const boards: Core.Board[] = [];
  snap.forEach((doc: any) => {
    boards.push(createBoard(doc.val()));
  });
  return boards;
}

/** ボード保存(JSONから) */
export async function setBoard(board: any): Promise<void> {
  const boardsRef = ref(db, "boards/" + board.name);
  await set(boardsRef, board);
}

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
