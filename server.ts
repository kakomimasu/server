import { Application, Context, oakCors, Router } from "./deps.ts";

import { VersionRes } from "./types.ts";

import { errorCodeResponse, errors, ServerError } from "./core/error.ts";
import { tournamentRouter } from "./v1/tournament.ts";
import { userRouter } from "./v1/user.ts";
import { gameRouter } from "./v1/game.ts";
import { matchRouter } from "./v1/match.ts";
import { wsRoutes } from "./v1/ws.ts";
import { nonReqEnv, reqEnv } from "./core/env.ts";

import { router as miyakonojoRouter } from "./miyakonojo/router.ts";

const port = parseInt(reqEnv.PORT);

if (import.meta.main) {
  const apiRoutes = () => {
    const router = new Router();
    router.use("/ws", wsRoutes());
    router.use("/match", matchRouter());
    router.use("/game", gameRouter());
    router.use("/users", userRouter());
    router.use("/tournament", tournamentRouter());
    return router.routes();
  };

  // Port Listen
  const app = new Application();
  app.use(oakCors({
    origin: "*",
    methods: ["GET", "POST"],
  }));

  app.addEventListener("listen", ({ hostname, port, secure }) => {
    console.log(
      `Listening on: ${secure ? "https://" : "http://"}${
        hostname ??
          "localhost"
      }:${port}`,
    );
  });

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

  const router = new Router();

  router.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      if (!(err instanceof ServerError)) {
        if (nonReqEnv.DISCORD_WEBHOOK_URL) {
          const content = `kakomimasu/serverで予期しないエラーを検出しました。
Date: ${new Date().toLocaleString("ja-JP")}
URL: ${ctx.request.url}
\`\`\`console\n${err.stack}\n\`\`\``;
          fetch(nonReqEnv.DISCORD_WEBHOOK_URL, {
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

  router.use("/v1", apiRoutes());
  router.use("/miyakonojo", miyakonojoRouter.routes());
  app.use(router.routes());
  app.use(router.allowedMethods());

  router.get("/version", (ctx) => {
    const data: VersionRes = {
      version: reqEnv.HEROKU_RELEASE_VERSION,
    };
    ctx.response.body = data;
  });

  router.get("/(.*)", (_ctx: Context) => {
    throw new ServerError(errors.NOT_FOUND);
  });

  app.listen({ port });
}
