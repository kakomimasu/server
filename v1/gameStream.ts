import { helpers, Router } from "../deps.ts";

import type { WsGameRes } from "./types.ts";
import { auth } from "./middleware.ts";
import { kkmm } from "../core/datas.ts";
import { addSendGameFn, ExpGame } from "../core/expKakomimasu.ts";

type SearchOptions = { op: string; value: string }[];
type MapValue = {
  searchOptions: SearchOptions;
  gameIds: string[];
  authedUserId?: string;
  allowNewGame: boolean;
  keepAliveTimerId: number;
};
const clients = new Map<ReadableStreamDefaultController, MapValue>();

const analyzeStringSearchOption = (q: string) => {
  console.log("query", q);
  const qs: SearchOptions = q.split(" ").map((s) => {
    const sp = s.split(":");
    if (sp.length === 1) {
      return { op: "match", value: sp[0] };
    } else return { op: sp[0], value: sp[1] };
  });
  //console.log(qs);

  return qs;
};

const setKeepAliveTimeout = (controller: ReadableStreamDefaultController) => {
  const timerId = setInterval(() => {
    try {
      controller.enqueue("\r\n");
    } catch (e) {
      if (e instanceof TypeError) {
        clearInterval(timerId);
      }
    }
  }, 10 * 1000);

  return timerId;
};

const sortCompareFn = (
  a: ExpGame,
  b: ExpGame,
  searchOptions: MapValue["searchOptions"],
) => {
  const sort = searchOptions.find((query) => query.op === "sort");
  if (!sort) return 0;
  const v = sort.value;
  if (v === "startAtUnixTime-desc") {
    return (b.startedAtUnixTime ?? 10000000000) -
      (a.startedAtUnixTime ?? 10000000000);
  } else if (v === "startAtUnixTime-asc") {
    return (a.startedAtUnixTime ?? 10000000000) -
      (b.startedAtUnixTime ?? 10000000000);
  }
  return 0;
};

const staticFilter = (
  game: ExpGame,
  { searchOptions, authedUserId }: MapValue,
) => {
  for (const so of searchOptions) {
    if (so.op === "type") {
      if (so.value === "self" && game.getType() !== "self") return false;
      if (so.value === "normal" && game.getType() !== "normal") return false;
      if (so.value === "personal" && game.personalUserId !== authedUserId) {
        return false;
      }
    } else if (so.op === "id" && so.value !== game.uuid) return false;
  }
  return true;
};

const dynamicFilter = (game: ExpGame, { searchOptions }: MapValue) => {
  for (const so of searchOptions) {
    if (so.op === "is") {
      if (so.value === "waiting" && !game.isFree()) return false;
      else if (so.value === "gaming" && !game.gaming) return false;
      else if (so.value === "finished" && !game.ending) return false;
    }
  }
  return true;
};

export function sendGame(game: ExpGame) {
  clients.forEach((value, controller) => {
    let data: WsGameRes;

    if (value.gameIds.some((id) => id === game.uuid)) {
      if (dynamicFilter(game, value)) {
        data = {
          type: "update",
          game: game.toJSON(),
        };
      } else {
        const removeIndex = value.gameIds.findIndex((id) => id === game.uuid);
        value.gameIds.splice(removeIndex, 1);
        data = {
          type: "remove",
          gameId: game.uuid,
        };
      }
    } else {
      if (!value.allowNewGame) return;
      if (staticFilter(game, value) && dynamicFilter(game, value)) {
        value.gameIds.push(game.uuid);
        data = {
          type: "add",
          game: game.toJSON(),
        };
      } else return;
    }
    controller.enqueue(JSON.stringify(data) + "\n");

    clearTimeout(value.keepAliveTimerId);
    value.keepAliveTimerId = setKeepAliveTimeout(controller);
  });
}

addSendGameFn(sendGame);

export const streamRoutes = () => {
  const router = new Router();
  router.get(
    "/stream",
    auth({ bearer: true, required: false }),
    (ctx) => {
      const params = helpers.getQuery(ctx);

      const q = params.q;
      const sIdx = params.startIndex ? parseInt(params.startIndex) : undefined;
      const eIdx = params.endIndex ? parseInt(params.endIndex) : undefined;
      const allowNewGame = params.allowNewGame === "true";
      // console.log(q, sIdx, eIdx, allowNewGame);

      let con: ReadableStreamDefaultController;
      const rs = new ReadableStream({
        start(controller) {
          con = controller;
          const searchOptions = analyzeStringSearchOption(q);

          const client: MapValue = {
            searchOptions,
            gameIds: [],
            authedUserId: ctx.state.authed_userId,
            allowNewGame: allowNewGame ?? false,
            keepAliveTimerId: setKeepAliveTimeout(controller),
          };

          const games = kkmm.getGames().filter((game) => {
            return staticFilter(game, client) && dynamicFilter(game, client);
          }).sort((a, b) => sortCompareFn(a, b, searchOptions));

          const gamesNum = games.length;
          const slicedGames = games.slice(sIdx, eIdx);
          const gameIds = slicedGames.map((g) => g.uuid);

          client.gameIds = gameIds;

          const initialData: WsGameRes = {
            type: "initial",
            q,
            startIndex: sIdx,
            endIndex: eIdx,
            games: slicedGames.map((g) => g.toJSON()),
            gamesNum,
          };

          clients.set(controller, client);

          controller.enqueue(JSON.stringify(initialData));
        },
        cancel: () => {
          // console.log("cancel", con);
          if (con) {
            // con.close();
            const value = clients.get(con);
            clearTimeout(value?.keepAliveTimerId);
            // console.log(value);
            clients.delete(con);
            con.close();
          }
        },
      });
      ctx.response.body = rs;
    },
  );

  return router.routes();
};
