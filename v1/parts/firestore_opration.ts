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
const login = async () => {
  if (auth.currentUser) {
    return;
  }
  const resolve = pathResolver(import.meta);
  const env = config({
    path: resolve("../../.env"),
    defaults: resolve("../../.env.default"),
  });
  await signInWithEmailAndPassword(
    auth,
    env.FIREBASE_USERNAME,
    env.FIREBASE_PASSWORD,
  );
};

/** ボードを1つ取得 */
export const getBoard = async (id: string): Promise<Core.Board> => {
  await login();
  const ref = doc(db, "boards/", id);
  const snap = await getDoc(ref);
  const data = snap.data();
  return new Core.Board(data);
};

/** ボードをすべて取得 */
export const getAllBoards = async (): Promise<Core.Board[]> => {
  await login();
  const ref = collection(db, "boards");
  const snap = await getDocs(ref);
  const boards: Core.Board[] = [];
  snap.forEach((doc: any) => {
    const data = doc.data();
    const board = new Core.Board(data);
    boards.push(board);
  }, null);
  return boards;
};