import { VersionRes } from "../types.ts";
import { Error } from "../core/types.ts";
import {
  ActionReq,
  ActionRes,
  Board,
  Game,
  GameCreateReq,
  MatchesAiPlayersReq,
  MatchesFreePlayersReq,
  MatchesGameIdPlayersReq,
  MatchRes,
  TournamentAddUserReq,
  TournamentCreateReq,
  TournamentDeleteReq,
  TournamentRes,
  User,
  UserDeleteReq,
  UserRegistReq,
} from "../v1/types.ts";

export * from "../types.ts";
export * from "../core/types.ts";
export * from "../v1/types.ts";

export type ApiRes<T> = Promise<
  { success: true; data: T; res: Response } | {
    success: false;
    data: Error;
    res: Response;
  }
>;

export const ActionType = {
  PUT: 1,
  NONE: 2,
  MOVE: 3,
  REMOVE: 4,
} as const;
export const ActionResult = {
  SUCCESS: 0,
  CONFLICT: 1,
  REVERT: 2,
  ERR_ONLY_ONE_TURN: 3,
  ERR_ILLEGAL_AGENT: 4,
  ERR_ILLEGAL_ACTION: 5,
} as const;
export const TileType = {
  AREA: 0,
  WALL: 1,
};

export default class ApiClient {
  public baseUrl: URL;

  constructor(host: string | URL = new URL("http://localhost:8880")) {
    this.baseUrl = new URL("", host);
  }

  async _fetchNotGetJson(
    path: string,
    // deno-lint-ignore ban-types
    data: object,
    auth?: string,
    method?: string,
  ) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (auth) headers.append("Authorization", auth);
    try {
      const res = await fetch(
        new URL(path, this.baseUrl).href,
        {
          method: method ?? "POST",
          headers,
          body: JSON.stringify(data),
        },
      );
      return res;
    } catch (e) {
      const error: Error = { errorCode: -1, message: e.message };
      const res = new Response(JSON.stringify(error), { status: 404 });
      return res;
    }
  }

  async _fetch(path: string, auth?: string, option?: RequestInit) {
    // console.log(new URL(path, this.baseUrl).href);
    let init: RequestInit = {};
    if (auth) init.headers = new Headers({ Authorization: auth });
    if (option) {
      init = { ...init, ...option };
    }

    try {
      const res = await fetch(new URL(path, this.baseUrl).href, init);
      return res;
    } catch (e) {
      const error: Error = { errorCode: -1, message: e.message };
      const res = new Response(JSON.stringify(error), { status: 404 });
      return res;
    }
  }

  async getVersion(): ApiRes<VersionRes> {
    const res = await this._fetch("/version");
    return { success: res.status === 200, data: await res.json(), res };
  }

  async usersVerify(idToken: string): ApiRes<undefined> {
    const res = await this._fetch("/v1/users/verify", idToken);
    const success = res.status === 200;
    const data = success ? undefined : await res.json();
    return { success, data, res };
  }
  async usersRegist(
    data: UserRegistReq,
    auth?: string,
  ): ApiRes<Required<User>> {
    const res = await this._fetchNotGetJson("/v1/users", data, auth);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async usersDelete(
    identifier: string,
    data: UserDeleteReq,
    auth: string,
  ): ApiRes<User> {
    const res = await this._fetchNotGetJson(
      `/v1/users/${identifier}`,
      data,
      auth,
      "DELETE",
    );
    return { success: res.status === 200, data: await res.json(), res };
  }

  async usersShow(identifier: string, idToken?: string): ApiRes<User> {
    const res = await this._fetch(`/v1/users/${identifier}`, idToken);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async usersSearch(searchText: string): ApiRes<User[]> {
    const res = await this._fetch(`/v1/users?q=${searchText}`);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async tournamentsCreate(data: TournamentCreateReq): ApiRes<TournamentRes> {
    const res = await this._fetchNotGetJson("/v1/tournaments", data);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async tournamentsGetAll(): ApiRes<TournamentRes[]> {
    const res = await this._fetch(`/v1/tournaments`);
    return { success: res.status === 200, data: await res.json(), res };
  }
  async tournamentsGet(id: string): ApiRes<TournamentRes> {
    const res = await this._fetch(`/v1/tournaments/${id}`);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async tournamentsDelete(
    tournamentId: string,
    data: TournamentDeleteReq = {},
  ): ApiRes<TournamentRes> {
    const res = await this._fetchNotGetJson(
      `/v1/tournaments/${tournamentId}`,
      data,
      undefined,
      "DELETE",
    );
    return { success: res.status === 200, data: await res.json(), res };
  }
  async tournamentsAddUser(
    tournamentId: string,
    data: TournamentAddUserReq,
  ): ApiRes<TournamentRes> {
    const res = await this._fetchNotGetJson(
      `/v1/tournaments/${tournamentId}/users`,
      data,
    );
    return { success: res.status === 200, data: await res.json(), res };
  }

  async gameCreate(data: GameCreateReq, auth?: string): ApiRes<Game> {
    const res = await this._fetchNotGetJson("/v1/matches", data, auth);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async getBoards(): ApiRes<Board[]> {
    const res = await this._fetch("/v1/boards");
    return { success: res.status === 200, data: await res.json(), res };
  }

  async matchesGameIdPlayers(
    gameId: string,
    data: MatchesGameIdPlayersReq,
    auth?: string,
  ): ApiRes<MatchRes> {
    const res = await this._fetchNotGetJson(
      `/v1/matches/${gameId}/players`,
      data,
      auth,
    );
    return { success: res.status === 200, data: await res.json(), res };
  }
  async matchesFreePlayers(
    data: MatchesFreePlayersReq,
    auth?: string,
  ): ApiRes<MatchRes> {
    const res = await this._fetchNotGetJson(
      `/v1/matches/free/players`,
      data,
      auth,
    );
    return { success: res.status === 200, data: await res.json(), res };
  }
  async matchesAiPlayers(
    data: MatchesAiPlayersReq,
    auth?: string,
  ): ApiRes<MatchRes> {
    const res = await this._fetchNotGetJson(
      `/v1/matches/ai/players`,
      data,
      auth,
    );
    return { success: res.status === 200, data: await res.json(), res };
  }

  async getMatch(gameId: string): ApiRes<Game> {
    const res = await this._fetch(`/v1/matches/${gameId}`);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async setAction(
    gameId: string,
    data: ActionReq,
    auth: string,
  ): ApiRes<ActionRes> {
    const res = await this._fetchNotGetJson(
      `/v1/matches/${gameId}/actions`,
      data,
      auth,
      "PATCH",
    );
    return { success: res.status === 200, data: await res.json(), res };
  }
}
