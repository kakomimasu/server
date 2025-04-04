import * as T from "./types.ts";

export * from "./types.ts";

import { app } from "../server.ts";

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
      data?: object;
    } | { auth?: string; method?: "GET" } = {},
  ): Promise<ApiRes<T>> {
    const headers = new Headers();
    if (init.auth) headers.append("Authorization", init.auth);
    const method = init.method ?? "GET";
    if (method !== "GET") {
      headers.append("Content-Type", "application/json");
    }
    const body = ("data" in init && init.data) ? init.data : {};
    try {
      const res = await app.request(
        path,
        {
          method: method,
          headers,
          body: method !== "GET" ? JSON.stringify(body) : undefined,
        },
      );
      return {
        success: res.status === 200,
        // deno-lint-ignore no-explicit-any
        data: await res.json() as any,
        res,
      };
      // deno-lint-ignore no-explicit-any
    } catch (e: any) {
      const data: T.ErrorRes = { errorCode: -1, message: e.message };
      const res = new Response(JSON.stringify(data), { status: 404 });
      return { success: false, data, res };
    }
  }

  async getVersion() {
    return await this.#fetch<T.VersionRes>("/version");
  }

  async regenerateUserMeToken(auth: string) {
    return await this.#fetch<T.RegenerateUserTokenRes>(
      `/v1/users/me/token`,
      { auth },
    );
  }

  async getUserMe(auth: string) {
    return await this.#fetch<T.GetUserMeRes>(`/v1/users/me`, { auth });
  }

  async deleteUserMe(data: T.DeleteUserMeReq, auth: string) {
    return await this.#fetch<T.DeleteUserMeRes>(
      `/v1/users/me`,
      { data, auth, method: "DELETE" },
    );
  }

  async getUser(idOrName: string, auth?: string) {
    return await this.#fetch<T.GetUserRes>(
      `/v1/users/${idOrName}`,
      { auth: auth },
    );
  }

  async getUsers(query: string) {
    return await this.#fetch<T.GetUsersRes>(`/v1/users?q=${query}`);
  }

  async createTournament(data: T.CreateTournamentReq) {
    return await this.#fetch<T.CreateTournamentRes>(
      "/v1/tournaments",
      { data, method: "POST" },
    );
  }

  async getTournaments() {
    return await this.#fetch<T.GetTournamentsRes>(`/v1/tournaments`);
  }

  async getTournament(id: string) {
    return await this.#fetch<T.GetTournamentRes>(`/v1/tournaments/${id}`);
  }

  async deleteTournament(tournamentId: string, data?: T.DeleteTournamentReq) {
    return await this.#fetch<T.DeleteTournamentRes>(
      `/v1/tournaments/${tournamentId}`,
      { data, method: "DELETE" },
    );
  }

  async addTournamentUser(id: string, data: T.AddTournamentUserReq) {
    return await this.#fetch<T.AddTournamentUserRes>(
      `/v1/tournaments/${id}/users`,
      { data, method: "POST" },
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

  async joinFreeMatch(data: T.JoinFreeMatchReq, auth?: string) {
    return await this.#fetch<T.JoinFreeMatchRes>(
      `/v1/matches/free/players`,
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
