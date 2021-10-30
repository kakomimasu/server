import { config, Core, cors, createApp, createRouter } from "./deps.ts";

import * as util from "./v1/util.ts";
const resolve = util.pathResolver(import.meta);

import { ExpKakomimasu } from "./v1/parts/expKakomimasu.ts";
import { errorCodeResponse } from "./v1/error.ts";

const env = config({
  path: resolve("./.env"),
  defaults: resolve("./.env.default"),
});
const port = parseInt(env.port);

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
    await req.respond(errorCodeResponse(err));
  });
  return router;
};

// Port Listen
const app = createApp();
app.route("/v1/", apiRoutes());

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
