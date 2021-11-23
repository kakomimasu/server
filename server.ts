import { Core, cors, createApp, createRouter } from "./deps.ts";

import * as util from "./v1/util.ts";
const resolve = util.pathResolver(import.meta);

import { ExpKakomimasu } from "./v1/parts/expKakomimasu.ts";
import { errorCodeResponse, ServerError } from "./v1/error.ts";
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
  const router = createRouter();
  router.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["authorization", "content-type"],
  }));

  router.route("ws", wsRoutes());
  router.route("match", matchRouter());
  router.route("game", gameRouter());
  router.route("users", userRouter());
  router.route("tournament", tournamentRouter());
  router.catch(async (err, req) => {
    console.log(req);
    if (!(err instanceof ServerError)) {
      if (nonReqEnv.DISCORD_WEBHOOK_URL) {
        const content = `kakomimasu/serverで予期しないエラーを検出しました。
Date: ${new Date().toLocaleString("ja-JP")}
URL: ${req.url}
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
    await req.respond(errorCodeResponse(err));
  });
  return router;
};

// Port Listen
const app = createApp();
app.route("/v1/", apiRoutes());
app.catch;

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
