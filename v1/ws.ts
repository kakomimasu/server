import { Router } from "../deps.ts";
import type { WsGameRes } from "./types.ts";
import { ExpGame } from "./parts/expKakomimasu.ts";

import { kkmm } from "../server.ts";
import { accounts } from "./user.ts";

type SearchOptions = { op: string; value: string }[];
type MapValue = {
  searchOption: SearchOptions;
  gameIds: string[];
  authedUserId?: string;
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

const filterGame = (
  game: ExpGame,
  { searchOption, authedUserId }: MapValue,
) => {
  let isMatched = true;
  searchOption.forEach((so) => {
    if (so.op === "is") {
      if (so.value === "self" && game.getType() !== "self") {
        isMatched = false;
      }
      if (so.value === "normal" && game.getType() !== "normal") {
        isMatched = false;
      }
      //console.log("filterGame", so.value, game.personalUserId, authedUserId);
      if (so.value === "personal" && game.personalUserId !== authedUserId) {
        isMatched = false;
      }
    }
    if (so.op === "id" && so.value !== game.uuid) isMatched = false;
  });
  //console.log(game.type, isMatched);
  return isMatched;
};

export function sendGame(game: ExpGame) {
  return () => {
    clients.forEach((value, ws) => {
      if (ws.readyState === WebSocket.CLOSED) {
        clients.delete(ws);
        return;
      }
      //console.log(game, value);
      if (!value.gameIds.some((id) => id === game.uuid)) {
        if (
          value.searchOption.some((so) =>
            so.op === "is" && so.value === "newGame"
          )
        ) {
          value.gameIds.push(game.uuid);
        } else return;
      }

      if (!filterGame(game, value)) return;
      const data: WsGameRes = {
        type: "update",
        game: game.toJSON(),
      };
      ws.send(JSON.stringify(data));
    });
  };
}

export const wsRoutes = () => {
  const router = new Router();
  router.get(
    "/game",
    async (ctx) => {
      const sock = await ctx.upgrade();

      //console.log("ws connected.");
      const bearerToken = ctx.request.headers.get("sec-websocket-protocol");
      const user = accounts.getUsers().find((user) =>
        user.bearerToken === bearerToken
      );
      //console.log("ws", user);

      const client: MapValue = {
        searchOption: [],
        gameIds: [],
        authedUserId: user?.id,
      };
      clients.set(sock, client);
      //console.log("ws client", clients);

      sock.onmessage = (ev) => {
        try {
          if (typeof ev.data !== "string") return;

          const { q, startIndex: sIdx, endIndex: eIdx } = JSON.parse(ev.data);

          // check json type
          if (typeof q !== "string") return;
          if (typeof sIdx !== "number" && typeof sIdx !== "undefined") return;
          if (typeof eIdx !== "number" && typeof eIdx !== "undefined") return;

          const searchOptions = analyzeStringSearchOption(q);
          client.searchOption = searchOptions;

          const games = kkmm.getGames().sort((a, b) => {
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
          }).filter((game) => filterGame(game, client));

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
          //console.log(ev);
        } catch (e) {
          if (e instanceof Deno.errors.ConnectionAborted) {
            clients.delete(sock);
          } else {
            console.log(e);
          }
        }
      };

      sock.onclose = () => {
        clients.delete(sock);
      };
      ctx.response.status = 200;
    },
  );

  return router.routes();
};
