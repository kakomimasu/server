import { config, Core, cors, createApp, createRouter } from "./deps.ts";

import * as util from "./api/util.ts";
const resolve = util.pathResolver(import.meta);

import { ExpKakomimasu } from "./api/parts/expKakomimasu.ts";
import { errorCodeResponse } from "./api/error.ts";

const env = config({
  path: resolve("./.env"),
  defaults: resolve("./.env.default"),
});
const port = parseInt(env.port);

import { LogFileOp } from "./api/parts/file_opration.ts";

import { tournamentRouter, tournaments } from "./api/tournament.ts";
import { accounts, userRouter } from "./api/user.ts";
import { gameRouter } from "./api/game.ts";
import { matchRouter } from "./api/match.ts";
import { viewerRoutes } from "./api/viewer.ts";
import { wsRoutes } from "./api/ws.ts";

export const kkmm = new ExpKakomimasu();
kkmm.games.push(...LogFileOp.read());

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
    await req.respond(errorCodeResponse(err));
  });
  return router;
};

// Port Listen
const app = createApp();
app.route("/api/", apiRoutes());
app.route("/", viewerRoutes());

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
