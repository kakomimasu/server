import { Core } from "../../deps.ts";
import type { IUser } from "../user.ts";
import { Tournament as ITournament } from "../types.ts";
import { ExpGame } from "./expKakomimasu.ts";
import {
  connectAuthEmulator,
  connectDatabaseEmulator,
  get,
  getAuth,
  getDatabase,
  initializeApp,
  ref,
  set,
  signInWithEmailAndPassword,
} from "../../deps.ts";
import { reqEnv } from "./env.ts";

const isTest = reqEnv.FIREBASE_TEST;

const setting = getSetting();
const app = initializeApp(setting.conf);
const auth = getAuth();
isTest &&
  connectAuthEmulator(
    auth,
    `http://${reqEnv.FIREBASE_EMULATOR_HOST}:9099`,
    undefined,
  );
const db = getDatabase(app, setting.dbURL);
isTest && connectDatabaseEmulator(db, reqEnv.FIREBASE_EMULATOR_HOST, 9000);

/** 管理ユーザでログイン */
async function login() {
  if (auth.currentUser) {
    return;
  }

  await signInWithEmailAndPassword(
    auth,
    setting.username,
    setting.password,
  );
}

/** 全ユーザ保存 */
export async function setAllUsers(users: IUser[]): Promise<void> {
  if (users.length == 0) {
    return;
  }
  const usersRef = ref(db, "users");
  const users2 = users.map((a) => {
    // deno-lint-ignore no-explicit-any
    const b: any = {
      screenName: a.screenName,
      name: a.name,
      id: a.id,
      gamesId: a.gamesId,
      bearerToken: a.bearerToken,
    };
    if (a.password != undefined) {
      b.password = a.password;
    }
    return b;
  });
  await set(usersRef, users2);
}

/** 全ユーザ取得 */
export async function getAllUsers(): Promise<IUser[]> {
  const users: IUser[] = [];
  const usersRef = ref(db, "users");
  const snap = await get(usersRef);
  // deno-lint-ignore no-explicit-any
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
  // deno-lint-ignore no-explicit-any
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
  const gameJson2 = JSON.parse(JSON.stringify(gameJson));
  await set(gameRef, gameJson2);
}

/** 全ゲーム取得 */
export async function getAllGames(): Promise<ExpGame[]> {
  const games: ExpGame[] = [];
  const gamesRef = ref(db, "games");
  const snap = await get(gamesRef);
  // deno-lint-ignore no-explicit-any
  snap.forEach((doc: any) => {
    const game = ExpGame.restore(doc.val());
    games.push(game);
  });
  return games;
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
  await login();
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

function getSetting() {
  // 初期化
  const username: string | undefined = reqEnv.FIREBASE_USERNAME;
  const password: string | undefined = reqEnv.FIREBASE_PASSWORD;

  //let conf;
  //let dbURL;
  /*if (firebaseTest === "true") {
    conf = {
      apiKey: "AIzaSyCIzvSrMgYAV2SVIPbRMSaHWjsdLDk781A",
      authDomain: "kakomimasu-test.firebaseapp.com",
      projectId: "kakomimasu-test",
      storageBucket: "kakomimasu-test.appspot.com",
      messagingSenderId: "35306968138",
      appId: "1:35306968138:web:513405a81673c8415e42b3",
    };
    dbURL = "https://kakomimasu-test-default-rtdb.firebaseio.com/";
  } else {
    */
  const conf = {
    apiKey: "AIzaSyBOas3O1fmIrl51n7I_hC09YCG0EEe7tlc",
    authDomain: "kakomimasu.firebaseapp.com",
    projectId: "kakomimasu",
    storageBucket: "kakomimasu.appspot.com",
    messagingSenderId: "883142143351",
    appId: "1:883142143351:web:dc6ddc1158aa54ada74572",
    measurementId: "G-L43FT511YW",
  };
  const dbURL = "https://kakomimasu-default-rtdb.firebaseio.com/";
  //}

  return { conf, dbURL, username, password };
}
