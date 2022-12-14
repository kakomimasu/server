// Standard Library
export { parse as yamlParse } from "https://deno.land/std@0.166.0/encoding/yaml.ts";
export * as Colors from "https://deno.land/std@0.166.0/fmt/colors.ts";

// Third Party Modules
export * from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
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
} from "https://deno.land/x/oak@v11.1.0/mod.ts";
export { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
export * from "https://deno.land/x/djwt@v2.3/mod.ts";

export * as Core from "https://cdn.jsdelivr.net/gh/codeforkosen/Kakomimasu@457c2eaeff487207993c6eed47edbf3759447f2d/mod.ts";

export * from "https://raw.githubusercontent.com/kakomimasu/client-deno/v1.0.0-beta.1/algorithm.js";
export * from "https://raw.githubusercontent.com/kakomimasu/client-deno/v1.0.0-beta.1/client_a1.js";
export * from "https://raw.githubusercontent.com/kakomimasu/client-deno/v1.0.0-beta.1/client_a2.js";
export * from "https://raw.githubusercontent.com/kakomimasu/client-deno/v1.0.0-beta.1/client_a3.js";
export * from "https://raw.githubusercontent.com/kakomimasu/client-deno/v1.0.0-beta.1/client_a4.js";
export * from "https://raw.githubusercontent.com/kakomimasu/client-deno/v1.0.0-beta.1/client_a5.js";
export * from "https://raw.githubusercontent.com/kakomimasu/client-deno/v1.0.0-beta.1/client_none.js";

// @deno-types="https://cdn.esm.sh/v61/firebase@9.6.0/app/dist/app/index.d.ts"
export {
  type FirebaseOptions,
  initializeApp,
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";

// @deno-types="https://cdn.esm.sh/v61/firebase@9.6.0/app/dist/auth/index.d.ts"
export {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  type UserCredential,
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

// @deno-types="https://cdn.esm.sh/v61/firebase@9.6.0/app/dist/database/index.d.ts"
export {
  connectDatabaseEmulator,
  get,
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";

export {
  type OpenAPIObject,
  type ReferenceObject,
  type RequestBodyObject,
  type ResponseObject,
  type SchemaObject,
} from "https://esm.sh/openapi3-ts@3.1.2/";
