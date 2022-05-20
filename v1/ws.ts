import { Router } from "../deps.ts";

import type { WsGameReq, WsGameRes } from "./types.ts";
import { UnknownRequest } from "./util.ts";
import { accounts, kkmm } from "../core/datas.ts";
import { addSendGameFn, ExpGame } from "../core/expKakomimasu.ts";

type SearchOptions = { op: string; value: string }[];
type MapValue = {
  searchOption: SearchOptions;
  gameIds: string[];
  authedUserId?: string;
  allowNewGame: boolean;
  keepAliveTimerId: number;
};
const clients = new Map<WebSocket, MapValue>();

const analyzeStringSearchOption = (q: string) => {
  const qs: SearchOptions = q.split(" ").map((s) => {
    const sp = s.split(":");
    if (sp.length === 1) {
      return { op: "match", value: sp[0] };
    } else return { op: sp[0], value: sp[1] };
  });
  //console.log(qs);

  return qs;
};

const setKeepAliveTimeout = (ws: WebSocket) => {
  const timerId = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("");
    } else {
      clearInterval(timerId);
    }
  }, 30 * 1000);

  return timerId;
};

const sortCompareFn = (
  a: ExpGame,
  b: ExpGame,
  searchOptions: MapValue["searchOption"],
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
  { searchOption, authedUserId }: MapValue,
) => {
  for (const so of searchOption) {
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

const dynamicFilter = (game: ExpGame, { searchOption }: MapValue) => {
  for (const so of searchOption) {
    if (so.op === "is") {
      if (so.value === "waiting" && !game.isFree()) return false;
      else if (so.value === "gaming" && !game.gaming) return false;
      else if (so.value === "finished" && !game.ending) return false;
    }
  }
  return true;
};

export function sendGame(game: ExpGame) {
  clients.forEach((value, ws) => {
    if (ws.readyState === WebSocket.CLOSED) {
      clients.delete(ws);
      return;
    }
    //console.log(game, value);

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
    ws.send(JSON.stringify(data));
    clearTimeout(value.keepAliveTimerId);
    value.keepAliveTimerId = setKeepAliveTimeout(ws);
  });
}

addSendGameFn(sendGame);

export const wsRoutes = () => {
  const router = new Router();
  router.get(
    "/game",
    async (ctx) => {
      const bearerToken = ctx.request.headers.get("sec-websocket-protocol");
      const upgradeOptions: Parameters<typeof ctx.upgrade>[0] = {};
      let user: ReturnType<typeof accounts.getUsers>[0] | undefined;
      if (bearerToken) {
        user = accounts.getUsers().find((user) =>
          user.bearerToken === bearerToken
        );
        if (user) upgradeOptions.protocol = bearerToken;
        // console.log("ws", user);
      }
      const sock = await ctx.upgrade(upgradeOptions);

      sock.onmessage = (ev) => {
        try {
          if (typeof ev.data !== "string") return;

          const { q, startIndex: sIdx, endIndex: eIdx, allowNewGame } = JSON
            .parse(ev.data) as UnknownRequest<WsGameReq>;

          // check json type
          if (typeof q !== "string") return;
          if (typeof sIdx !== "number" && typeof sIdx !== "undefined") return;
          if (typeof eIdx !== "number" && typeof eIdx !== "undefined") return;
          if (
            typeof allowNewGame !== "boolean" &&
            typeof allowNewGame !== "undefined"
          ) {
            return;
          }

          const client: MapValue = {
            searchOption: [],
            gameIds: [],
            authedUserId: user?.id,
            allowNewGame: allowNewGame ?? false,
            keepAliveTimerId: setKeepAliveTimeout(sock),
          };
          clients.set(sock, client);

          const searchOptions = analyzeStringSearchOption(q);
          client.searchOption = searchOptions;

          const games = kkmm.getGames().filter((game) => {
            return staticFilter(game, client) && dynamicFilter(game, client);
          }).sort((a, b) => sortCompareFn(a, b, searchOptions));

          const gamesNum = games.length;
          const slicedGames = games.slice(sIdx, eIdx);
          client.gameIds = slicedGames.map((g) => g.uuid);
          const body: WsGameRes = {
            type: "initial",
            q,
            startIndex: sIdx,
            endIndex: eIdx,
            games: slicedGames.map((g) => g.toJSON()),
            gamesNum,
          };

          sock.send(JSON.stringify(body));
          clearTimeout(client.keepAliveTimerId);
          client.keepAliveTimerId = setKeepAliveTimeout(sock);
          //console.log(ev);
        } catch (e) {
          if (e instanceof Deno.errors.ConnectionAborted) {
            clients.delete(sock);
          } else {
            console.error(e);
          }
        }
      };

      sock.onclose = () => {
        clients.delete(sock);
      };
    },
  );

  return router.routes();
};
