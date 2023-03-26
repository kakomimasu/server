import {
  connectAuthEmulator,
  connectDatabaseEmulator,
  FirebaseOptions,
  getAuth,
  getDatabase,
  initializeApp,
} from "../deps.ts";

import { env } from "./env.ts";

import { sleep } from "../v1/test/client_util.ts";

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

export const isTest = env.FIREBASE_TEST.toLowerCase() === "true";

let app: ReturnType<typeof initializeApp>;
export async function firebaseInit() {
  if (app !== undefined) return;
  app = initializeApp(firebaseConfig);

  if (isTest) {
    const auth = getAuth();
    connectAuthEmulator(auth, `http://${env.FIREBASE_EMULATOR_HOST}:9099`);

    const db = getDatabase();
    connectDatabaseEmulator(db, env.FIREBASE_EMULATOR_HOST, 9000);

    // connectAuthEmulatorの接続待ち(テスト時にleaking opsが発生するため)
    await sleep(1000);
  }
}
