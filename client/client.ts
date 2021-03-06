import { VersionRes } from "../types.ts";
import { Error } from "../core/types.ts";
import {
  ActionReq,
  ActionRes,
  Board,
  Game,
  GameCreateReq,
  MatchReq,
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

export default class ApiClient {
  public baseUrl: URL;

  constructor(host: string | URL = new URL("http://localhost:8880")) {
    this.baseUrl = new URL("", host);
  }

  // deno-lint-ignore ban-types
  async _fetchPostJson(path: string, data: object, auth?: string) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (auth) headers.append("Authorization", auth);
    try {
      const res = await fetch(
        new URL(path, this.baseUrl).href,
        {
          method: "POST",
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

  async _fetch(path: string, auth?: string) {
    // console.log(new URL(path, this.baseUrl).href);
    try {
      const res = await fetch(
        new URL(path, this.baseUrl).href,
        auth
          ? {
            headers: new Headers({
              Authorization: auth,
            }),
          }
          : {},
      );
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
    const res = await this._fetchPostJson("/v1/users/regist", data, auth);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async usersDelete(data: UserDeleteReq, auth: string): ApiRes<User> {
    const res = await this._fetchPostJson("/v1/users/delete", data, auth);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async usersShow(identifier: string, idToken?: string): ApiRes<User> {
    const res = await this._fetch(`/v1/users/show/${identifier}`, idToken);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async usersSearch(searchText: string): ApiRes<User[]> {
    const res = await this._fetch(`/v1/users/search?q=${searchText}`);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async tournamentsCreate(data: TournamentCreateReq): ApiRes<TournamentRes> {
    const res = await this._fetchPostJson("/v1/tournament/create", data);
    return { success: res.status === 200, data: await res.json(), res };
  }
  async tournamentsGet(id: string): ApiRes<TournamentRes>;
  async tournamentsGet(): ApiRes<TournamentRes[]>;
  async tournamentsGet(id = ""): ApiRes<TournamentRes | TournamentRes[]> {
    const res = await this._fetch(`/v1/tournament/get?id=${id}`);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async tournamentsDelete(data: TournamentDeleteReq): ApiRes<TournamentRes> {
    const res = await this._fetchPostJson("/v1/tournament/delete", data);
    return { success: res.status === 200, data: await res.json(), res };
  }
  async tournamentsAddUser(
    tournamentId: string,
    data: TournamentAddUserReq,
  ): ApiRes<TournamentRes> {
    const res = await this._fetchPostJson(
      `/v1/tournament/add?id=${tournamentId}`,
      data,
    );
    return { success: res.status === 200, data: await res.json(), res };
  }

  async gameCreate(data: GameCreateReq, auth?: string): ApiRes<Game> {
    const res = await this._fetchPostJson("/v1/game/create", data, auth);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async getBoards(): ApiRes<Board[]> {
    const res = await this._fetch("/v1/game/boards");
    return { success: res.status === 200, data: await res.json(), res };
  }

  async match(data: MatchReq, auth?: string): ApiRes<MatchRes> {
    const res = await this._fetchPostJson("/v1/match", data, auth);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async getMatch(gameId: string): ApiRes<Game> {
    const res = await this._fetch(`/v1/match/${gameId}`);
    return { success: res.status === 200, data: await res.json(), res };
  }

  async setAction(
    gameId: string,
    data: ActionReq,
    auth: string,
  ): ApiRes<ActionRes> {
    const res = await this._fetchPostJson(
      `/v1/match/${gameId}/action`,
      data,
      auth,
    );
    return { success: res.status === 200, data: await res.json(), res };
  }
}
