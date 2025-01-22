import { type Context, Hono } from "@hono/hono";
import { cors } from "hono/cors";

import { VersionRes } from "./types.ts";

import { errorCodeResponse, errors, ServerError } from "./core/error.ts";
import { env } from "./core/env.ts";

import { router as miyakonojoRouter } from "./miyakonojo/router.ts";
import { router as tomakomaiRouter } from "./tomakomai/router.ts";
import { router as v1Router } from "./v1/router.ts";

const port = parseInt(env.PORT);

const app = new Hono();

app.use(cors(
  {
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "PATCH"],
    exposeHeaders: ["Date"],
  },
));

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.res.headers.get("X-Response-Time");
  const now = new Date().toISOString();
  console.log(
    `[${now}] ${ctx.res.status} ${ctx.req.method} ${ctx.req.url} - ${rt}`,
  );
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.res.headers.set("X-Response-Time", `${ms}ms`);
});

// Error handling
app.onError((err, ctx) => {
  if (!(err instanceof ServerError)) {
    if (env.DISCORD_WEBHOOK_URL) {
      const content = `kakomimasu/serverで予期しないエラーを検出しました。
Date: ${new Date().toLocaleString("ja-JP")}
URL: ${ctx.req.url}
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
  return ctx.json(body, status);
});

// API router
app.route("/v1", v1Router);
app.route("/miyakonojo", miyakonojoRouter);
app.route("/tomakomai", tomakomaiRouter);
app.get("/version", (ctx) => {
  const data: VersionRes = { version: env.VERSION };
  return ctx.json(data);
});
app.get("*", (_ctx: Context) => {
  throw new ServerError(errors.NOT_FOUND);
});
Deno.serve({ port }, app.fetch);

// Error handling
globalThis.addEventListener("unhandledrejection", (e) => {
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
