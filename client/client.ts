import * as T from "./types.ts";

export * from "./types.ts";

export type ApiRes<T> = { success: true; data: T; res: Response } | {
  success: false;
  data: T.ErrorRes;
  res: Response;
};

export default class ApiClient {
  public baseUrl: URL;

  constructor(host: string | URL = new URL("http://localhost:8880")) {
    this.baseUrl = new URL("", host);
  }

  async #fetch<T>(
    path: string,
    init: {
      auth?: string;
      method?: "POST" | "PATCH" | "DELETE";
      // deno-lint-ignore ban-types
      data?: object;
    } | { auth?: string; method?: "GET" } = {},
  ): Promise<ApiRes<T>> {
    const headers = new Headers();
    if (init.auth) headers.append("Authorization", init.auth);
    if (init.method !== "GET") {
      headers.append("Content-Type", "application/json");
    }
    try {
      const res = await fetch(
        new URL(path, this.baseUrl).href,
        {
          method: init.method,
          headers,
          body: "data" in init ? JSON.stringify(init.data) : undefined,
        },
      );
      return {
        success: res.status === 200,
        // deno-lint-ignore no-explicit-any
        data: await res.json() as any,
        res,
      };
    } catch (e) {
      const data: T.ErrorRes = { errorCode: -1, message: e.message };
      const res = new Response(JSON.stringify(data), { status: 404 });
      return { success: false, data, res };
    }
  }

  async getVersion() {
    return await this.#fetch<T.VersionRes>("/version");
  }

  /** @deprecated Move to `createUser`*/
  async usersRegist(data: T.CreateUserReq, auth?: string) {
    return await this.#fetch<T.CreateUserRes>(
      "/v1/users",
      { method: "POST", data, auth },
    );
  }
  async createUser(data: T.CreateUserReq, auth?: string) {
    return await this.#fetch<T.CreateUserRes>(
      "/v1/users",
      { method: "POST", data, auth },
    );
  }

  /** @deprecated Move to `deleteUser`*/
  async usersDelete(identifier: string, data: T.DeleteUserReq, auth: string) {
    return await this.#fetch<T.DeleteUserRes>(
      `/v1/users/${identifier}`,
      { data, auth, method: "DELETE" },
    );
  }
  async deleteUser(idOrName: string, data: T.DeleteUserReq, auth: string) {
    return await this.#fetch<T.DeleteUserRes>(
      `/v1/users/${idOrName}`,
      { data, auth, method: "DELETE" },
    );
  }

  /** @deprecated Move to `getUser`*/
  async usersShow(identifier: string, idToken?: string) {
    return await this.#fetch<T.GetUserRes>(
      `/v1/users/${identifier}`,
      { auth: idToken },
    );
  }
  async getUser(idOrName: string, auth?: string) {
    return await this.#fetch<T.GetUserRes>(
      `/v1/users/${idOrName}`,
      { auth: auth },
    );
  }

  /** @deprecated Move to `getUsers` */
  async usersSearch(searchText: string) {
    return await this.#fetch<T.GetUsersRes>(`/v1/users?q=${searchText}`);
  }
  async getUsers(query: string) {
    return await this.#fetch<T.GetUsersRes>(`/v1/users?q=${query}`);
  }

  /** @deprecated Move to `createTournament`*/
  async tournamentsCreate(data: T.CreateTournamentReq) {
    return await this.#fetch<T.CreateTournamentRes>(
      "/v1/tournaments",
      { data, method: "POST" },
    );
  }
  async createTournament(data: T.CreateTournamentReq) {
    return await this.#fetch<T.CreateTournamentRes>(
      "/v1/tournaments",
      { data, method: "POST" },
    );
  }

  /** @deprecated Move to `getTournaments`*/
  async tournamentsGetAll() {
    return await this.#fetch<T.GetTournamentsRes>(`/v1/tournaments`);
  }
  async getTournaments() {
    return await this.#fetch<T.GetTournamentsRes>(`/v1/tournaments`);
  }

  /** @deprecated Move to `getTournament`*/
  async tournamentsGet(id: string) {
    return await this.#fetch<T.GetTournamentRes>(`/v1/tournaments/${id}`);
  }
  async getTournament(id: string) {
    return await this.#fetch<T.GetTournamentRes>(`/v1/tournaments/${id}`);
  }

  /** @deprecated Move to `deleteTournament`*/
  async tournamentsDelete(tournamentId: string, data: T.DeleteTournamentReq) {
    return await this.#fetch<T.DeleteTournamentRes>(
      `/v1/tournaments/${tournamentId}`,
      { data, method: "DELETE" },
    );
  }
  async deleteTournament(tournamentId: string, data?: T.DeleteTournamentReq) {
    return await this.#fetch<T.DeleteTournamentRes>(
      `/v1/tournaments/${tournamentId}`,
      { data, method: "DELETE" },
    );
  }

  /** @deprecated Move to `addTournamentUser`*/
  async tournamentsAddUser(tournamentId: string, data: T.AddTournamentUserReq) {
    return await this.#fetch<T.AddTournamentUserRes>(
      `/v1/tournaments/${tournamentId}/users`,
      { data, method: "POST" },
    );
  }
  async addTournamentUser(id: string, data: T.AddTournamentUserReq) {
    return await this.#fetch<T.AddTournamentUserRes>(
      `/v1/tournaments/${id}/users`,
      { data, method: "POST" },
    );
  }

  /** @deprecated Move to `createMatch`*/
  async gameCreate(data: T.CreateMatchReq, auth?: string) {
    return await this.#fetch<T.CreateMatchRes>(
      "/v1/matches",
      { data, auth, method: "POST" },
    );
  }
  async createMatch(data: T.CreateMatchReq, auth?: string) {
    return await this.#fetch<T.CreateMatchRes>(
      "/v1/matches",
      { data, auth, method: "POST" },
    );
  }

  async getBoards() {
    return await this.#fetch<T.GetBoardsRes>("/v1/boards");
  }

  /** @deprecated Move to `joinGameIdMatch`*/
  async matchesGameIdPlayers(
    gameId: string,
    data: T.JoinGameIdMatchReq,
    auth?: string,
  ) {
    return await this.#fetch<T.JoinGameIdMatchRes>(
      `/v1/matches/${gameId}/players`,
      { data, auth, method: "POST" },
    );
  }
  async joinGameIdMatch(
    id: string,
    data: T.JoinGameIdMatchReq,
    auth?: string,
  ) {
    return await this.#fetch<T.JoinGameIdMatchRes>(
      `/v1/matches/${id}/players`,
      { data, auth, method: "POST" },
    );
  }

  /** @deprecated Move to `JoinFreeMatch`*/
  async matchesFreePlayers(data: T.JoinFreeMatchReq, auth?: string) {
    return await this.#fetch<T.JoinFreeMatchRes>(
      `/v1/matches/free/players`,
      { data, auth, method: "POST" },
    );
  }
  async joinFreeMatch(data: T.JoinFreeMatchReq, auth?: string) {
    return await this.#fetch<T.JoinFreeMatchRes>(
      `/v1/matches/free/players`,
      { data, auth, method: "POST" },
    );
  }

  /** @deprecated Move to `joinAiMatch`*/
  async matchesAiPlayers(data: T.JoinAiMatchReq, auth?: string) {
    return await this.#fetch<T.JoinAiMatchRes>(
      `/v1/matches/ai/players`,
      { data, auth, method: "POST" },
    );
  }
  async joinAiMatch(data: T.JoinAiMatchReq, auth?: string) {
    return await this.#fetch<T.JoinAiMatchRes>(
      `/v1/matches/ai/players`,
      { data, auth, method: "POST" },
    );
  }

  async getMatch(id: string) {
    return await this.#fetch<T.GetMatchRes>(`/v1/matches/${id}`);
  }

  async setAction(id: string, data: T.ActionMatchReq, auth: string) {
    return await this.#fetch<T.ActionMatchRes>(
      `/v1/matches/${id}/actions`,
      { data, auth, method: "PATCH" },
    );
  }
}
