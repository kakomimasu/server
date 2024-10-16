import { Middleware, RouterMiddleware } from "oak";

import { getMatches, StateToken } from "./_util.ts";
import { TeamsMatchesRes, TeamsMeRes } from "./types.ts";

export const myTeam: Middleware<StateToken> = (ctx) => {
  const authedUser = ctx.state.user;

  const body: TeamsMeRes = {
    teamID: 0,
    name: authedUser.id,
  };

  ctx.response.status = 200;
  ctx.response.body = body;
};

export const teamMatches: RouterMiddleware<
  "/teams/:id/matches",
  { id: string },
  StateToken
> = (ctx) => {
  const id = ctx.params.id;
  const authedUser = ctx.state.user;

  if (id !== authedUser.id) { // APIトークンと異なるチームのリソースにアクセスした場合
    ctx.response.status = 403;
    return;
  }

  const body: TeamsMatchesRes = { matches: getMatches(authedUser.id) };

  ctx.response.status = 200;
  ctx.response.body = body;
};
