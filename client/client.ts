import { VersionRes } from "../types.ts";
import { Error } from "../core/types.ts";
import * as T from "./types.ts";

export * from "./types.ts";

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

  async #fetch(
    path: string,
    init: {
      auth?: string;
      method?: "POST" | "PATCH" | "DELETE";
      // deno-lint-ignore ban-types
      data: object;
    } | { auth?: string; method?: "GET" } = {},
  ) {
    const headers = new Headers();
    if (init.auth) headers.append("Authorization", init.auth);
    if (init.method !== "GET") {
      headers.append("Content-Type", "application/json");
    }
    try {
      const res = await fetch(
        new URL(path, this.baseUrl),
        {
          method: init.method,
          headers,
          body: "data" in init ? JSON.stringify(init.data) : undefined,
        },
      );
      return { success: res.status === 200, data: await res.json(), res };
    } catch (e) {
      const data: Error = { errorCode: -1, message: e.message };
      const res = new Response(JSON.stringify(data), { status: 404 });
      return { success: false, data, res };
    }
  }

  async getVersion(): ApiRes<VersionRes> {
    return await this.#fetch("/version");
  }

  async usersRegist(
    data: T.CreateUserReq,
    auth?: string,
  ): ApiRes<T.CreateUserRes> {
    return await this.#fetch("/v1/users", { method: "POST", data, auth });
  }

  async usersDelete(
    identifier: string,
    data: T.DeleteUserReq,
    auth: string,
  ): ApiRes<T.DeleteUserRes> {
    return await this.#fetch(
      `/v1/users/${identifier}`,
      { data, auth, method: "DELETE" },
    );
  }

  async usersShow(identifier: string, idToken?: string): ApiRes<T.GetUserRes> {
    return await this.#fetch(`/v1/users/${identifier}`, { auth: idToken });
  }

  async usersSearch(searchText: string): ApiRes<T.GetUsersRes> {
    return await this.#fetch(`/v1/users?q=${searchText}`);
  }

  async tournamentsCreate(
    data: T.CreateTournamentReq,
  ): ApiRes<T.CreateTournamentRes> {
    return await this.#fetch("/v1/tournaments", { data, method: "POST" });
  }

  async tournamentsGetAll(): ApiRes<T.GetTournamentsRes> {
    return await this.#fetch(`/v1/tournaments`);
  }
  async tournamentsGet(id: string): ApiRes<T.GetTournamentRes> {
    return await this.#fetch(`/v1/tournaments/${id}`);
  }

  async tournamentsDelete(
    tournamentId: string,
    data: T.DeleteTournamentReq = {},
  ): ApiRes<T.DeleteTournamentRes> {
    return await this.#fetch(
      `/v1/tournaments/${tournamentId}`,
      { data, method: "DELETE" },
    );
  }
  async tournamentsAddUser(
    tournamentId: string,
    data: T.AddTournamentUserReq,
  ): ApiRes<T.AddTournamentUserRes> {
    return await this.#fetch(
      `/v1/tournaments/${tournamentId}/users`,
      { data, method: "POST" },
    );
  }

  async gameCreate(
    data: T.CreateMatchReq,
    auth?: string,
  ): ApiRes<T.CreateMatchRes> {
    return await this.#fetch("/v1/matches", { data, auth, method: "POST" });
  }

  async getBoards(): ApiRes<T.GetBoardsRes> {
    return await this.#fetch("/v1/boards");
  }

  async matchesGameIdPlayers(
    gameId: string,
    data: T.JoinGameIdMatchReq,
    auth?: string,
  ): ApiRes<T.JoinGameIdMatchRes> {
    return await this.#fetch(
      `/v1/matches/${gameId}/players`,
      { data, auth, method: "POST" },
    );
  }
  async matchesFreePlayers(
    data: T.JoinFreeMatchReq,
    auth?: string,
  ): ApiRes<T.JoinFreeMatchRes> {
    return await this.#fetch(
      `/v1/matches/free/players`,
      { data, auth, method: "POST" },
    );
  }
  async matchesAiPlayers(
    data: T.JoinAiMatchReq,
    auth?: string,
  ): ApiRes<T.JoinAiMatchRes> {
    return await this.#fetch(
      `/v1/matches/ai/players`,
      { data, auth, method: "POST" },
    );
  }

  async getMatch(gameId: string): ApiRes<T.GetMatchRes> {
    return await this.#fetch(`/v1/matches/${gameId}`);
  }

  async setAction(
    gameId: string,
    data: T.ActionMatchReq,
    auth: string,
  ): ApiRes<T.ActionMatchRes> {
    return await this.#fetch(
      `/v1/matches/${gameId}/actions`,
      { data, auth, method: "PATCH" },
    );
  }
}
