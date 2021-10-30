import { config, Core } from "../../deps.ts";
import type { IUser } from "../user.ts";
import { Tournament as ITournament } from "../types.ts";
import { ExpGame } from "../parts/expKakomimasu.ts";
import { pathResolver } from "../util.ts";
import {
  collection,
  doc,
  getAuth,
  getDoc,
  getDocs,
  getFirestore,
  initializeApp,
  setDoc,
  signInWithEmailAndPassword,
  writeBatch,
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

initializeApp(conf);
const auth = getAuth();
const db = getFirestore();

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
  const batch = writeBatch(db);
  for (const u of users) {
    const data: any = {
      screenName: u.screenName,
      name: u.name,
      id: u.id,
      gamesId: u.gamesId,
      bearerToken: u.bearerToken,
    };
    if (u.password != null) {
      data.password = u.password;
    }
    const ref = doc(db, "users", u.id);
    batch.set(ref, data);
  }
  await batch.commit();
}

/** 全ユーザ取得 */
export async function getAllUsers(): Promise<IUser[]> {
  const users: IUser[] = [];
  const ref = collection(db, "users");
  const snap = await getDocs(ref);
  snap.forEach((doc: any) => {
    const data = doc.data();
    const user = {
      screenName: data.screenName,
      name: data.name,
      id: data.id,
      password: data.password,
      gamesId: data.gamesId,
      bearerToken: data.bearerToken,
    };
    users.push(user);
  }, null);
  return users;
}

/** 全大会保存 */
export async function setAllTournaments(
  tournaments: ITournament[],
): Promise<void> {
  const batch = writeBatch(db);
  for (const t of tournaments) {
    const data = {
      name: t.name,
      organizer: t.organizer,
      type: t.type,
      remarks: t.remarks,
    } as any;
    if (t.id != null) {
      data.id = t.id;
    }
    if (t.users != null) {
      data.users = t.users;
    }
    if (t.gameIds != null) {
      data.gameIds = t.gameIds;
    }
    const ref = doc(db, "tournaments", t.id);
    batch.set(ref, data);
  }
  await batch.commit();
}

/** 全大会取得 */
export async function getAllTournaments(): Promise<ITournament[]> {
  const tournaments: ITournament[] = [];
  const ref = collection(db, "tournaments");
  const snap = await getDocs(ref);
  snap.forEach((doc: any) => {
    const data = doc.data();
    const tournament = {
      id: data.id,
      name: data.name,
      organizer: data.organizer,
      type: data.type,
      remarks: data.remarks,
      users: data.users,
      gameIds: data.gameIds,
    };
    tournaments.push(tournament);
  }, null);
  return tournaments;
}

/** ボードを1つ取得 */
export async function getBoard(id: string): Promise<Core.Board | undefined> {
  await login();
  const ref = doc(db, "boards/", id);
  const snap = await getDoc(ref);
  const data = snap.data();
  if (data) {
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
    return new Core.Board({
      w,
      h,
      points,
      nagent,
      nturn,
      nsec,
      nplayer,
      name,
    });
  }
}

/** ボードをすべて取得 */
export async function getAllBoards(): Promise<Core.Board[]> {
  await login();
  const ref = collection(db, "boards");
  const snap = await getDocs(ref);
  const boards: Core.Board[] = [];
  snap.forEach((doc: any) => {
    const {
      width: w,
      height: h,
      points: points,
      nagent,
      nturn,
      nsec,
      nplayer,
      name,
    } = doc.data();
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
    boards.push(board);
  }, null);
  return boards;
}

/** ボード保存(JSONから) */
export async function setBoard(board: any): Promise<void> {
  const ref = doc(db, "boards", board.name);
  await setDoc(ref, board);
}
