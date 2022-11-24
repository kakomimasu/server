import { Router } from "../deps.ts";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { Tournament, tournaments } from "../core/datas.ts";
import { errors, ServerError } from "../core/error.ts";
import {
  TournamentAddUserReq,
  TournamentCreateReq,
  TournamentDeleteReq,
  TournamentRes,
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
    "/",
    contentTypeFilter("application/json"),
    jsonParse(),
    (ctx) => {
      const data = ctx.state.data as TournamentCreateReq;
      if (!data.name) throw new ServerError(errors.INVALID_TOURNAMENT_NAME);
      if (!data.type || !checkType(data.type)) {
        throw new ServerError(errors.INVALID_TYPE);
      }
      const tournament = Tournament.create(data);
      if (data.participants) {
        data.participants.forEach((e) => tournament.addUser(e));
      }
      if (data.option?.dryRun !== true) {
        tournaments.add(tournament);
      }
      const body: TournamentRes = tournament;
      ctx.response.body = body;
    },
  );

  // 大会削除
  router.delete(
    "/:id",
    contentTypeFilter("application/json"),
    jsonParse(),
    (ctx) => {
      const id = ctx.params.id;

      const tournament = tournaments.get(id);
      if (!tournament) throw new ServerError(errors.NOTHING_TOURNAMENT_ID);

      const data = ctx.state.data as TournamentDeleteReq;
      if (data.option?.dryRun !== true) {
        tournaments.delete(tournament);
      }

      const body: TournamentRes = tournament;
      ctx.response.body = body;
    },
  );

  // 大会取得
  router.get("/", (ctx) => {
    const body: TournamentRes[] = tournaments.getAll();
    ctx.response.body = body;
  });
  router.get("/:id", (ctx) => {
    const id = ctx.params.id;
    const resData = tournaments.get(id);
    if (!resData) throw new ServerError(errors.NOTHING_TOURNAMENT_ID);

    const body: TournamentRes = resData;
    ctx.response.body = body;
  });

  // 参加者追加
  router.post(
    "/:id/users",
    contentTypeFilter("application/json"),
    jsonParse(),
    (ctx) => {
      const tournamentId = ctx.params.id;
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

      const resBody: TournamentRes = tournament;
      ctx.response.body = resBody;
    },
  );

  return router.routes();
};
