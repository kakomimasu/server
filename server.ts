import { Application, Core, oakCors, Router } from "./deps.ts";

import * as util from "./v1/util.ts";
const resolve = util.pathResolver(import.meta);

import { ExpKakomimasu } from "./v1/parts/expKakomimasu.ts";
import { errorCodeResponse } from "./v1/error.ts";
import { nonReqEnv, reqEnv } from "./v1/parts/env.ts";
const port = parseInt(reqEnv.port);

import { getAllGames } from "./v1/parts/firestore_opration.ts";

import { tournamentRouter, tournaments } from "./v1/tournament.ts";
import { accounts, userRouter } from "./v1/user.ts";
import { gameRouter } from "./v1/game.ts";
import { matchRouter } from "./v1/match.ts";
import { wsRoutes } from "./v1/ws.ts";

export const kkmm = new ExpKakomimasu();
kkmm.games.push(...await getAllGames());

accounts.dataCheck(kkmm.getGames());
tournaments.dataCheck(kkmm.getGames());

const apiRoutes = () => {
  const router = new Router();
  router.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      console.log(ctx.request);
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
      const { status, body } = errorCodeResponse(err);
      ctx.response.status = status;
      ctx.response.body = body;
    }
  });

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
  allowedHeaders: ["authorization", "content-type"],
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
router.use("/v1", apiRoutes());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({ port });

export const readBoard = (fileName: string) => {
  const path = resolve(`./board/${fileName}.json`);
  if (Deno.statSync(path).isFile) {
    const boardJson = JSON.parse(
      Deno.readTextFileSync(path),
    );
    if (boardJson.points[0] instanceof Array) {
      boardJson.points = boardJson.points.flat();
    }
    /*console.log(
      boardJson.width,
      boardJson.height,
      boardJson.points,
      boardJson.nagent,
    );*/

    return new Core.Board(boardJson);
  } else {
    throw Error("Can not find Board");
  }
};
