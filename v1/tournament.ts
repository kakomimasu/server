import { Router } from "../deps.ts";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { Tournament, tournaments } from "./datas.ts";
import { errors, ServerError } from "./error.ts";
import {
  TournamentAddUserReq,
  TournamentCreateReq,
  TournamentDeleteReq,
} from "./types.ts";

const checkType = (type: string): boolean => {
  if (type === "round-robin") return true;
  if (type === "knockout") return true;
  return false;
};

export const tournamentRouter = () => {
  const router = new Router();

  // 大会登録
  router.post(
    "/create",
    contentTypeFilter("application/json"),
    jsonParse(),
    (ctx) => {
      const data = ctx.state.data as TournamentCreateReq;
      if (!data.name) throw new ServerError(errors.INVALID_TOURNAMENT_NAME);
      if (!data.type || !checkType(data.type)) {
        throw new ServerError(errors.INVALID_TYPE);
      }
      const tournament = new Tournament(data);
      if (data.participants) {
        data.participants.forEach((e) => tournament.addUser(e));
      }
      if (data.option?.dryRun !== true) {
        tournaments.add(tournament);
      }

      ctx.response.body = tournament;
    },
  );

  // 大会削除
  router.post(
    "/delete",
    contentTypeFilter("application/json"),
    jsonParse(),
    (ctx) => {
      const data = ctx.state.data as TournamentDeleteReq;
      if (!data.id) throw new ServerError(errors.INVALID_TOURNAMENT_ID);

      const tournament = tournaments.get(data.id);
      if (!tournament) throw new ServerError(errors.NOTHING_TOURNAMENT_ID);

      if (data.option?.dryRun !== true) {
        tournaments.delete(tournament);
      }

      ctx.response.body = tournament;
    },
  );

  // 大会取得
  router.get("/get", (ctx) => {
    const query = ctx.request.url.searchParams;
    const id = query.get("id");
    const resData = id ? tournaments.get(id) : tournaments.getAll();
    if (!resData) throw new ServerError(errors.NOTHING_TOURNAMENT_ID);

    ctx.response.body = resData;
  });

  // 参加者追加
  router.post(
    "/add",
    contentTypeFilter("application/json"),
    jsonParse(),
    (ctx) => {
      const query = ctx.request.url.searchParams;
      const tournamentId = query.get("id");
      //console.log(tournamentId);
      if (!tournamentId) throw new ServerError(errors.INVALID_TOURNAMENT_ID);
      let tournament = tournaments.get(tournamentId);
      if (!tournament) throw new ServerError(errors.INVALID_TOURNAMENT_ID);

      const body = ctx.state.data as TournamentAddUserReq;
      const identifier = body.user;
      if (!identifier) throw new ServerError(errors.INVALID_USER_IDENTIFIER);

      if (body.option?.dryRun !== true) {
        tournament = tournaments.addUser(tournamentId, identifier);
      } else {
        tournament = new Tournament(tournament);
        tournament.addUser(identifier);
      }

      ctx.response.body = tournament;
    },
  );

  return router.routes();
};
