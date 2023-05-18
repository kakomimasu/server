import { admin, adminApp } from "../deps.ts";

import "./env.ts";

export const app = admin.initializeApp({
  credential: adminApp.applicationDefault(),
  databaseURL: "https://kakomimasu-default-rtdb.firebaseio.com",
});
