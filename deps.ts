// Standard Library
export * as Colors from "https://deno.land/std@0.180.0/fmt/colors.ts";
export { loadSync as loadEnv } from "https://deno.land/std@0.180.0/dotenv/mod.ts";

// Third Party Modules
export {
  Application,
  Context,
  helpers,
  type Middleware,
  Router,
  type RouterContext,
  type RouterMiddleware,
  ServerSentEvent,
  type ServerSentEventTarget,
} from "https://deno.land/x/oak@v12.1.0/mod.ts";
export { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
export * from "https://deno.land/x/djwt@v2.3/mod.ts";

export * as Core from "https://cdn.jsdelivr.net/gh/codeforkosen/Kakomimasu@v2.0.1/mod.ts";

// @deno-types="https://cdn.esm.sh/v61/firebase@9.18.0/app/dist/app/index.d.ts"
export {
  type FirebaseOptions,
  initializeApp,
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";

// @deno-types="https://cdn.esm.sh/v61/firebase@9.18.0/app/dist/auth/index.d.ts"
export {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  type UserCredential,
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-auth.js";

// @deno-types="https://cdn.esm.sh/v61/firebase@9.18.0/app/dist/database/index.d.ts"
export {
  connectDatabaseEmulator,
  get,
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/9.18.0/firebase-database.js";

export {
  type OpenAPIObject,
  type ReferenceObject,
  type RequestBodyObject,
  type ResponseObject,
  type SchemaObject,
} from "https://esm.sh/openapi3-ts@3.2.0/";
