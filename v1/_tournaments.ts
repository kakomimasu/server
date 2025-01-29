import { Hono } from "@hono/hono";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { Tournament, tournaments } from "../core/datas.ts";
import { errors, ServerError } from "../core/error.ts";
import { ResponseType } from "../util/openapi-type.ts";
import { openapi, validator } from "./parts/openapi.ts";

const router = new Hono();

// 大会登録
router.post(
  "/",
  contentTypeFilter("application/json"),
  jsonParse(),
  (ctx) => {
    const data = ctx.get("data");
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
    return ctx.json(body);
  },
);

// 大会削除
router.delete(
  "/:id",
  contentTypeFilter("application/json"),
  jsonParse(),
  (ctx) => {
    const id = ctx.req.param("id");

    const tournament = tournaments.get(id);
    if (!tournament) throw new ServerError(errors.NOTHING_TOURNAMENT_ID);

    const data = ctx.get("data");
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
    return ctx.json(body);
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
  return ctx.json(body);
});
router.get("/:id", (ctx) => {
  const id = ctx.req.param("id");
  const resData = tournaments.get(id);
  if (!resData) throw new ServerError(errors.NOTHING_TOURNAMENT_ID);

  const body: ResponseType<
    "/tournaments/{tournamentId}",
    "get",
    "200",
    "application/json",
    typeof openapi
  > = resData;
  return ctx.json(body);
});

// 参加者追加
router.post(
  "/:id/users",
  contentTypeFilter("application/json"),
  jsonParse(),
  (ctx) => {
    const tournamentId = ctx.req.param("id");
    let tournament = tournaments.get(tournamentId);
    if (!tournament) throw new ServerError(errors.INVALID_TOURNAMENT_ID);

    const body = ctx.get("data");
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
    return ctx.json(resBody);
  },
);

export default router;
