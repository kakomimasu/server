// Standard Library
export { fromFileUrl } from "https://deno.land/std@0.113.0/path/mod.ts";
export {
  assert,
  assertEquals,
} from "https://deno.land/std@0.113.0/testing/asserts.ts";
export { v4 } from "https://deno.land/std@0.113.0/uuid/mod.ts";
export * from "https://deno.land/std@0.113.0/ws/mod.ts";

// Third Party Modules
export * from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
export * from "https://deno.land/x/servest@v1.3.4/mod.ts";
export * from "https://deno.land/x/servest@v1.3.4/middleware/cors.ts";
export * from "https://deno.land/x/djwt@v2.3/mod.ts";

export * as Core from "https://raw.githubusercontent.com/codeforkosen/Kakomimasu/master/mod.ts";

export { default as ApiClient } from "https://raw.githubusercontent.com/kakomimasu/client-js/main/mod.ts";

export { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";

export {
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.0.2/firebase-auth.js";

export {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js";
