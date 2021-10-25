import { config, Core } from "../../deps.ts";
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
