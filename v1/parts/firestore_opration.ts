import { config, Core } from "../../deps.ts";
import { pathResolver } from "../util.ts";
import {
  collection,
  doc,
  getAuth,
  getFirestore,
  initializeApp,
  onSnapshot,
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
  databaseURL: "https://kakomimasu.firebaseio.com",
};

const boards: Map<string, Core.Board> = new Map();

initializeApp(conf);
const auth = getAuth();
const db = getFirestore();

/** 管理ユーザでログイン */
async function login() {
  console.error("login start");
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
  console.error("logined");
}

await login();
const unsub = onSnapshot(collection(db, "boards"), (snapshot: any) => {
  snapshot.docChanges().forEach((change: any) => {
    const type = change.type;
    const data = change.doc.data();
    const board = createBoard(data);
    if (type === "added" || type === "modified") {
      boards.set(board.name, board);
      //console.log("New board: ", change.doc.data());
    } else if (change.type === "removed") {
      boards.delete(board.name);
      //  console.log("Removed board: ", change.doc.data());
    }
  });
  //console.log(querySnapshot);
});

/** ボードを1つ取得 */
export function getBoard(id: string) {
  return boards.get(id);
}

/** ボードをすべて取得 */
export function getAllBoards() {
  return Array.from(boards.values());
}

/** ボード保存(JSONから) */
export async function setBoard(board: any): Promise<void> {
  const ref = doc(db, "boards", board.name);
  await setDoc(ref, board);
}

function createBoard(firestoreData: any) {
  const {
    width: w,
    height: h,
    points: points,
    nagent,
    nturn,
    nsec,
    nplayer,
    name,
  } = firestoreData;
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
