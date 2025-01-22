import { Hono } from "@hono/hono";
import { SSEStreamingApi, streamSSE } from "hono/streaming";

import { ResponseType } from "../util/openapi-type.ts";

import { auth } from "./middleware.ts";
import { openapi } from "./parts/openapi.ts";
import { games } from "../core/datas.ts";
import { addSendGameFn, ExpGame } from "../core/expKakomimasu.ts";

type StreamRes = ResponseType<
  "/matches/stream",
  "get",
  "200",
  "text/event-stream",
  typeof openapi
>;

type SearchOptions = { op: string; value: string }[];
type MapValue = {
  searchOptions: SearchOptions;
  gameIds: string[];
  authedUserId?: string;
  allowNewGame: boolean;
};
const clients = new Map<SSEStreamingApi, MapValue>();

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
      if (so.value === "self" && game.type !== "self") return false;
      if (so.value === "normal" && game.type !== "normal") return false;
      if (so.value === "personal" && game.personalUserId !== authedUserId) {
        return false;
      }
    } else if (so.op === "id" && so.value !== game.id) return false;
  }
  return true;
};

const dynamicFilter = (game: ExpGame, { searchOptions }: MapValue) => {
  for (const so of searchOptions) {
    if (so.op === "is") {
      if (so.value === "waiting" && !game.isFree()) return false;
      else if (so.value === "gaming" && !game.isGaming()) return false;
      else if (so.value === "finished" && !game.isEnded()) return false;
    }
  }
  return true;
};

export function sendGame(game: ExpGame) {
  clients.forEach((value, controller) => {
    let data: StreamRes;

    if (value.gameIds.some((id) => id === game.id)) {
      if (dynamicFilter(game, value)) {
        data = {
          type: "update",
          game: game.toJSON(),
        };
      } else {
        const removeIndex = value.gameIds.findIndex((id) => id === game.id);
        value.gameIds.splice(removeIndex, 1);
        data = {
          type: "remove",
          gameId: game.id,
        };
      }
    } else {
      if (!value.allowNewGame) return;
      if (staticFilter(game, value) && dynamicFilter(game, value)) {
        value.gameIds.push(game.id);
        data = {
          type: "add",
          game: game.toJSON(),
        };
      } else return;
    }
    controller.writeSSE({ event: "message", data: JSON.stringify(data) });
  });
}

addSendGameFn(sendGame);

const router = new Hono();
router.get(
  "/stream",
  auth({ bearer: true, required: false }),
  (ctx) => {
    const params = new URL(ctx.req.url).searchParams;

    const q = params.get("q") ?? "";
    const sIdxStr = params.get("startIndex");
    const sIdx = sIdxStr ? parseInt(sIdxStr) : undefined;
    const eIdxStr = params.get("endIndex");
    const eIdx = eIdxStr ? parseInt(eIdxStr) : undefined;
    const allowNewGame = params.get("allowNewGame") === "true";

    const searchOptions = analyzeStringSearchOption(q);

    const client: MapValue = {
      searchOptions,
      gameIds: [],
      authedUserId: ctx.get("authed_userId"),
      allowNewGame: allowNewGame ?? false,
    };

    const filteredGames = games.filter((game) => {
      return staticFilter(game, client) && dynamicFilter(game, client);
    }).sort((a, b) => sortCompareFn(a, b, searchOptions));

    const gamesNum = filteredGames.length;
    const slicedGames = filteredGames.slice(sIdx, eIdx);
    const gameIds = slicedGames.map((g) => g.id);

    client.gameIds = gameIds;

    const initialData: StreamRes = {
      type: "initial",
      q,
      startIndex: sIdx,
      endIndex: eIdx,
      games: slicedGames.map((g) => g.toJSON()),
      gamesNum,
    };

    return streamSSE(ctx, async (target) => {
      clients.set(target, client);

      const initialEvent = {
        event: "message",
        data: JSON.stringify(initialData),
      };
      await target.writeSSE(initialEvent);

      target.onAbort(() => {
        // console.log(value);
        clients.delete(target);
      });

      while (true) {
        // keep-alive を 10 秒ごとに送信
        await target.sleep(10 * 1000);
        target.writeln(": keep-alive");
      }
    });
  },
);

export default router;
