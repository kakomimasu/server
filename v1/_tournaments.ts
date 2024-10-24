import { Router } from "@oak/oak";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { Tournament, tournaments } from "../core/datas.ts";
import { errors, ServerError } from "../core/error.ts";
import { ResponseType } from "../util/openapi-type.ts";
import { openapi, validator } from "./parts/openapi.ts";

// type TournamentRes = ResponseType<"/tournaments","post",""

export const tournamentRouter = () => {
  const router = new Router();

  // 大会登録
  router.post(
    "/",
    contentTypeFilter("application/json"),
    jsonParse(),
    (ctx) => {
      const data = ctx.state.data;
      const isValid = validator.validateRequestBody(
        data,
        "/tournaments",
        "post" as const,
        "application/json",
      );
      if (!isValid) throw new ServerError(errors.INVALID_REQUEST);
      const tournament = Tournament.create(data);
      if (data.participants) {
        data.participants.forEach((e) => tournament.addUser(e));
      }
      if (data.dryRun !== true) {
        tournaments.add(tournament);
      }
      const body: ResponseType<
        "/tournaments",
        "post",
        "200",
        "application/json",
        typeof openapi
      > = tournament;
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

      const data = ctx.state.data;
      const isValid = validator.validateRequestBody(
        data,
        "/tournaments/{tournamentId}",
        "delete" as const,
        "application/json",
      );
      if (!isValid) throw new ServerError(errors.INVALID_REQUEST);
      if (data.dryRun !== true) {
        tournaments.delete(tournament);
      }

      const body: ResponseType<
        "/tournaments/{tournamentId}",
        "delete",
        "200",
        "application/json",
        typeof openapi
      > = tournament;
      ctx.response.body = body;
    },
  );

  // 大会取得
  router.get("/", (ctx) => {
    const body: ResponseType<
      "/tournaments",
      "get",
      "200",
      "application/json",
      typeof openapi
    > = tournaments.getAll();
    ctx.response.body = body;
  });
  router.get("/:id", (ctx) => {
    const id = ctx.params.id;
    const resData = tournaments.get(id);
    if (!resData) throw new ServerError(errors.NOTHING_TOURNAMENT_ID);

    const body: ResponseType<
      "/tournaments/{tournamentId}",
      "get",
      "200",
      "application/json",
      typeof openapi
    > = resData;
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

      const body = ctx.state.data;
      const isValid = validator.validateRequestBody(
        body,
        "/tournaments/{tournamentId}/users",
        "post" as const,
        "application/json",
      );
      if (!isValid) throw new ServerError(errors.INVALID_REQUEST);
      const identifier = body.user;

      if (body.dryRun !== true) {
        tournament = tournaments.addUser(tournamentId, identifier);
      } else {
        tournament = new Tournament(tournament);
        tournament.addUser(identifier);
      }

      const resBody: ResponseType<
        "/tournaments/{tournamentId}/users",
        "post",
        "200",
        "application/json",
        typeof openapi
      > = tournament;
      ctx.response.body = resBody;
    },
  );

  return router.routes();
};
