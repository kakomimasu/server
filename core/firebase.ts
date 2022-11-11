import {
  connectAuthEmulator,
  connectDatabaseEmulator,
  FirebaseOptions,
  getAuth,
  getDatabase,
  initializeApp,
} from "../deps.ts";

import { reqEnv } from "./env.ts";

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

type InitOption = {
  auth?: boolean;
  database?: boolean;
};

import { sleep } from "../v1/test/client_util.ts";
export async function firebaseInit(
  option: InitOption = { auth: true, database: true },
) {
  initializeApp(firebaseConfig);

  if (reqEnv.FIREBASE_TEST) {
    if (option.auth) {
      const auth = getAuth();
      connectAuthEmulator(auth, `http://${reqEnv.FIREBASE_EMULATOR_HOST}:9099`);
      // connectAuthEmulatorの接続待ち(テスト時にleaking opsが発生するため)
      await sleep(1000);
    }
    if (option.database) {
      const db = getDatabase();
      connectDatabaseEmulator(db, reqEnv.FIREBASE_EMULATOR_HOST, 9000);
    }
  }
}
