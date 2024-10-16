import { Application, Context, Router } from "oak";
import { oakCors } from "@tajpouria/cors";

import { VersionRes } from "./types.ts";

import { errorCodeResponse, errors, ServerError } from "./core/error.ts";
import { env } from "./core/env.ts";

import { router as miyakonojoRouter } from "./miyakonojo/router.ts";
import { router as tomakomaiRouter } from "./tomakomai/router.ts";
import { router as v1Router } from "./v1/router.ts";

// deno-lint-ignore no-explicit-any
function sortObject(unsorted: any): any {
  if (unsorted === null || typeof unsorted !== "object") return unsorted;
  if (Array.isArray(unsorted)) return unsorted.map(sortObject);
  const sorted = Object.keys(unsorted).sort().reduce(
    (obj, key) => {
      obj[key] = sortObject(unsorted[key]);
      return obj;
    },
    {} as Record<string, unknown>,
  );
  return sorted;
}

const port = parseInt(env.PORT);

const app = new Application();

// CORS
app.use(oakCors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PATCH"],
  exposedHeaders: ["Date"],
}));

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  const now = new Date().toISOString();
  console.log(
    `[${now}] ${ctx.response.status} ${ctx.request.method} ${ctx.request.url} - ${rt}`,
  );
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

// Sort response body
app.use(async (ctx, next) => {
  await next();
  if (ctx.respond === false && ctx.response.body) {
    let body = JSON.parse(JSON.stringify(ctx.response.body));
    body = sortObject(body);
    ctx.response.body = body;
  }
});

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (!(err instanceof ServerError)) {
      if (env.DISCORD_WEBHOOK_URL) {
        const content = `kakomimasu/serverで予期しないエラーを検出しました。
Date: ${new Date().toLocaleString("ja-JP")}
URL: ${ctx.request.url}
\`\`\`console\n${err.stack}\n\`\`\``;
        fetch(env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: new Headers({ "content-type": "application/json" }),
          body: JSON.stringify({ content, username: "500 ERROR!" }),
        }).then(async (res) => {
          console.log(await res.text());
        });
      }
    }
    // console.log(ctx.request);
    const { status, body } = errorCodeResponse(err);
    ctx.response.status = status;
    ctx.response.body = body;
  }
});

// API router
const router = new Router();
router.use("/v1", v1Router.routes());
router.use("/miyakonojo", miyakonojoRouter.routes());
router.use("/tomakomai", tomakomaiRouter.routes());
router.get("/version", (ctx) => {
  const data: VersionRes = { version: env.VERSION };
  ctx.response.body = data;
});
router.get("/(.*)", (_ctx: Context) => {
  throw new ServerError(errors.NOT_FOUND);
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(
    `Listening on: ${secure ? "https://" : "http://"}${
      hostname ??
        "localhost"
    }:${port}`,
  );
});

app.listen({ port });

// Error handling
globalThis.window.addEventListener("unhandledrejection", (e) => {
  e.preventDefault();
  console.error(e.reason);

  const message = e.reason instanceof Error ? e.reason.stack : e.reason;
  if (env.DISCORD_WEBHOOK_URL) {
    const content = `kakomimasu/serverで予期しないエラーを検出しました。
Type: unhandledrejection
Date: ${new Date().toLocaleString("ja-JP")}
\`\`\`console\n${message}\n\`\`\``;
    fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: new Headers({ "content-type": "application/json" }),
      body: JSON.stringify({ content, username: "unhandledrejection ERROR!" }),
    }).then(async (res) => {
      console.log(await res.text());
    }).catch((e) => {
      console.error(e);
    });
  }
});
