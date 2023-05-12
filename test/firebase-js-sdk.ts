import { firebaseJsApp, firebaseJsAuth } from "../deps-test.ts";
import { env } from "../core/env.ts";

export function initFirebaseClient() {
  const app = firebaseJsApp.initializeApp({
    apiKey: "AIzaSyBOas3O1fmIrl51n7I_hC09YCG0EEe7tlc",
    authDomain: "kakomimasu.firebaseapp.com",
    databaseURL: "https://kakomimasu-default-rtdb.firebaseio.com",
    projectId: "kakomimasu",
    storageBucket: "kakomimasu.appspot.com",
    messagingSenderId: "883142143351",
    appId: "1:883142143351:web:dc6ddc1158aa54ada74572",
    measurementId: "G-L43FT511YW",
  });

  const auth = firebaseJsAuth.getAuth(app);
  if (env.FIREBASE_AUTH_EMULATOR_HOST) {
    firebaseJsAuth.connectAuthEmulator(
      auth,
      `http://${env.FIREBASE_AUTH_EMULATOR_HOST}`,
    );
  }
  return { app, auth };
}
