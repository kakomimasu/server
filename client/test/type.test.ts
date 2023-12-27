// client用の型定義用テスト
// Deno.testを行うのではなく型エラーでの失敗を利用

import { RequestBodyType, ResponseAllType } from "../../util/openapi-type.ts";
import { openapi } from "../../v1/parts/openapi.ts";
import * as Root from "../../types.ts";
import * as Core from "../../core/types.ts";

import * as T from "../types.ts";

// type equals logic : https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-845655557
type Equals<A, B> = _HalfEquals<A, B> extends true ? _HalfEquals<B, A> : false;

type _HalfEquals<A, B> = (
  A extends unknown ? (
      B extends unknown
        ? A extends B
          ? B extends A
            ? keyof A extends keyof B
              ? keyof B extends keyof A
                ? A extends object
                  ? _DeepHalfEquals<A, B, keyof A> extends true ? 1
                  : never
                : 1
              : never
            : never
          : never
        : never
        : unknown
    ) extends never ? 0
    : never
    : unknown
) extends never ? true
  : false;

type _DeepHalfEquals<A, B extends A, K extends keyof A> = (
  K extends unknown ? (Equals<A[K], B[K]> extends true ? never : 0) : unknown
) extends never ? true
  : false;

const _eres: Equals<T.ErrorRes, Core.Error> = true;

// GET /version
const _vres: Equals<T.VersionRes, Root.VersionRes> = true;

// POST /matches/{gameId}/players
type PostMatchesGameIdPlayersReq = RequestBodyType<
  "/matches/{gameId}/players",
  "post",
  "application/json",
  typeof openapi
>;
const _jgmreq: Equals<T.JoinGameIdMatchReq, PostMatchesGameIdPlayersReq> = true;
type PostMatchesGameIdPlayersRes = ResponseAllType<
  "/matches/{gameId}/players",
  "post",
  "application/json",
  typeof openapi
>;
const _jgmres: Equals<
  T.JoinGameIdMatchRes | T.ErrorRes,
  PostMatchesGameIdPlayersRes
> = true;

// POST /matches/free/players
type PostMatchesFreePlayersReq = RequestBodyType<
  "/matches/free/players",
  "post",
  "application/json",
  typeof openapi
>;
const _jfreq: Equals<T.JoinFreeMatchReq, PostMatchesFreePlayersReq> = true;
type PostMatchesFreePlayersRes = ResponseAllType<
  "/matches/free/players",
  "post",
  "application/json",
  typeof openapi
>;
const _jfres: Equals<
  T.JoinFreeMatchRes | T.ErrorRes,
  PostMatchesFreePlayersRes
> = true;

// POST /matches/ai/players
type PostMatchesAiPlayersReq = RequestBodyType<
  "/matches/ai/players",
  "post",
  "application/json",
  typeof openapi
>;
const _jareq: Equals<T.JoinAiMatchReq, PostMatchesAiPlayersReq> = true;
type PostMatchesAiPlayersRes = ResponseAllType<
  "/matches/ai/players",
  "post",
  "application/json",
  typeof openapi
>;
const _jares: Equals<T.JoinAiMatchRes | T.ErrorRes, PostMatchesAiPlayersRes> =
  true;

// GET /matches/{gameId}
type GetMatchesGameIdRes = ResponseAllType<
  "/matches/{gameId}",
  "get",
  "application/json",
  typeof openapi
>;
const _gmres: Equals<T.GetMatchRes | T.ErrorRes, GetMatchesGameIdRes> = true;

// PATCH /matches/{gameId}/actions
type PatchMatchesGameIdActionsReq = RequestBodyType<
  "/matches/{gameId}/actions",
  "patch",
  "application/json",
  typeof openapi
>;
const _amreq: Equals<T.ActionMatchReq, PatchMatchesGameIdActionsReq> = true;
type PatchMatchesGameIdActionsRes = ResponseAllType<
  "/matches/{gameId}/actions",
  "patch",
  "application/json",
  typeof openapi
>;
const _amres: Equals<
  T.ActionMatchRes | T.ErrorRes,
  PatchMatchesGameIdActionsRes
> = true;

// POST /matches
type PostMatchesReq = RequestBodyType<
  "/matches",
  "post",
  "application/json",
  typeof openapi
>;
const _cmreq: Equals<T.CreateMatchReq, PostMatchesReq> = true;
type PostMatchesRes = ResponseAllType<
  "/matches",
  "post",
  "application/json",
  typeof openapi
>;
const _cmres: Equals<T.CreateMatchRes | T.ErrorRes, PostMatchesRes> = true;

// GET /matches/stream
type GetMatchesStreamRes = ResponseAllType<
  "/matches/stream",
  "get",
  "text/event-stream",
  typeof openapi
>;
const _gmsres: Equals<T.StreamMatchesRes, GetMatchesStreamRes> = true;

// GET /boards
type GetBoardsRes = ResponseAllType<
  "/boards",
  "get",
  "application/json",
  typeof openapi
>;
const _gbres: Equals<T.GetBoardsRes, GetBoardsRes> = true;

// GET /tournaments
type GetTournamentsRes = ResponseAllType<
  "/tournaments",
  "get",
  "application/json",
  typeof openapi
>;
const _gtsres: Equals<T.GetTournamentsRes, GetTournamentsRes> = true;

// POST /tournaments
type PostTournamentsReq = RequestBodyType<
  "/tournaments",
  "post",
  "application/json",
  typeof openapi
>;
const _ctsreq: Equals<T.CreateTournamentReq, PostTournamentsReq> = true;
type PostTournamentsRes = ResponseAllType<
  "/tournaments",
  "post",
  "application/json",
  typeof openapi
>;
const _ctres: Equals<T.CreateTournamentRes | T.ErrorRes, PostTournamentsRes> =
  true;

// GET /tournaments/{tournamentId}
type GetTournamentsTournamentIdRes = ResponseAllType<
  "/tournaments/{tournamentId}",
  "get",
  "application/json",
  typeof openapi
>;
const _gtres: Equals<
  T.GetTournamentRes | T.ErrorRes,
  GetTournamentsTournamentIdRes
> = true;

// DELETE /tournaments/{tournamentId}
type DeleteTournamentsTournamentIdReq = RequestBodyType<
  "/tournaments/{tournamentId}",
  "delete",
  "application/json",
  typeof openapi
>;
const _dtreq: Equals<T.DeleteTournamentReq, DeleteTournamentsTournamentIdReq> =
  true;
type DeleteTournamentsTournamentIdRes = ResponseAllType<
  "/tournaments/{tournamentId}",
  "delete",
  "application/json",
  typeof openapi
>;
const _dtres: Equals<
  T.DeleteTournamentRes | T.ErrorRes,
  DeleteTournamentsTournamentIdRes
> = true;

// POST /tournements/{tournamentId}/users
type PostTournamentsTournamentIdUsersReq = RequestBodyType<
  "/tournaments/{tournamentId}/users",
  "post",
  "application/json",
  typeof openapi
>;
const _atureq: Equals<
  T.AddTournamentUserReq,
  PostTournamentsTournamentIdUsersReq
> = true;
type PostTournamentsTournamentIdUsersRes = ResponseAllType<
  "/tournaments/{tournamentId}/users",
  "post",
  "application/json",
  typeof openapi
>;
const _atures: Equals<
  T.AddTournamentUserRes | T.ErrorRes,
  PostTournamentsTournamentIdUsersRes
> = true;

// GET /users/{usersIdOrName}
type GetUsersUserIdOrNameRes = ResponseAllType<
  "/users/{userIdOrName}",
  "get",
  "application/json",
  typeof openapi
>;
const _gures: Equals<T.GetUserRes | T.ErrorRes, GetUsersUserIdOrNameRes> = true;

// DELETE /users/{usersIdOrName}
type DeleteUsersUserIdOrNameReq = RequestBodyType<
  "/users/{userIdOrName}",
  "delete",
  "application/json",
  typeof openapi
>;
const _dureq: Equals<T.DeleteUserReq, DeleteUsersUserIdOrNameReq> = true;
type DeleteUsersUserIdOrNameRes = ResponseAllType<
  "/users/{userIdOrName}",
  "delete",
  "application/json",
  typeof openapi
>;
const _dures: Equals<
  T.DeleteUserRes | T.ErrorRes,
  DeleteUsersUserIdOrNameRes
> = true;

// GET /users/{usersIdOrName}/token
type GetUsersUserIdOrNameTokenRes = ResponseAllType<
  "/users/{userIdOrName}/token",
  "get",
  "application/json",
  typeof openapi
>;
const _dutres: Equals<
  T.RegenerateUserTokenRes | T.ErrorRes,
  GetUsersUserIdOrNameTokenRes
> = true;

// GET /users
type GetUsersRes = ResponseAllType<
  "/users",
  "get",
  "application/json",
  typeof openapi
>;
const _gusres: Equals<T.GetUsersRes | T.ErrorRes, GetUsersRes> = true;

// POST /users
type PostUsersReq = RequestBodyType<
  "/users",
  "post",
  "application/json",
  typeof openapi
>;
const _cureq: Equals<T.CreateUserReq, PostUsersReq> = true;
type PostUsersRes = ResponseAllType<
  "/users",
  "post",
  "application/json",
  typeof openapi
>;
const _cures: Equals<T.CreateUserRes | T.ErrorRes, PostUsersRes> = true;
