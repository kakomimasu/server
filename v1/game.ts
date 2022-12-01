import { Router } from "../deps.ts";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { accounts, kkmm, tournaments } from "../core/datas.ts";
import { errors, ServerError } from "../core/error.ts";
import { Game as IGame, GameCreateReq } from "./types.ts";
import { auth } from "./middleware.ts";
import { getBoard } from "../core/firestore.ts";
import { ExpGame } from "../core/expKakomimasu.ts";

export const gameRouter = () => {
  const router = new Router();

  router.post(
    "/create",
    contentTypeFilter("application/json"),
    auth({ bearer: true, required: false }),
    jsonParse(),
    async (ctx) => {
      const reqJson = ctx.state.data as GameCreateReq;
      if (!reqJson.boardName) {
        throw new ServerError(errors.INVALID_BOARD_NAME);
      }
      const board = await getBoard(reqJson.boardName);
      if (!board) throw new ServerError(errors.INVALID_BOARD_NAME);
      board.nplayer = reqJson.nPlayer || 2;

      let game: ExpGame;
      if (!reqJson.option?.dryRun) {
        game = new ExpGame(board, reqJson.name);
        kkmm.addGame(game);
        game.wsSend();
      } else game = new ExpGame(board, reqJson.name);

      if (reqJson.isMySelf) {
        const authedUserId = ctx.state.authed_userId as string;
        console.log(authedUserId);
        if (authedUserId) game.setType("personal", authedUserId);
        else {
          throw new ServerError(errors.UNAUTHORIZED);
        }
      } else game.setType("self");

      if (reqJson.playerIdentifiers) {
        if (reqJson.playerIdentifiers.map) {
          const userIds = reqJson.playerIdentifiers.map((e) => {
            const id = accounts.find(e)?.id;
            if (!id) throw new ServerError(errors.NOT_USER);
            return id;
          });
          userIds.forEach((userId) => {
            if (!game.addReservedUser(userId)) {
              throw new ServerError(errors.ALREADY_REGISTERED_USER);
            }
          });
        } else {
          throw new ServerError(errors.INVALID_PLAYER_IDENTIFIERS);
        }
      }
      if (reqJson.tournamentId) {
        const tournament = tournaments.get(reqJson.tournamentId);
        if (!tournament) throw new ServerError(errors.INVALID_TOURNAMENT_ID);

        if (!reqJson.option?.dryRun) {
          tournaments.addGame(reqJson.tournamentId, game.uuid);
        }
      }

      const body: IGame = game.toJSON();
      ctx.response.body = body;
      //console.log(kkmm_self);
    },
  );

  return router.routes();
};
