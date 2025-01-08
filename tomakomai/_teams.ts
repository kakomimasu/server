import { type Handler } from "hono";
import { getMatches, StateToken } from "./_util.ts";
import { TeamsMatchesRes, TeamsMeRes } from "./types.ts";

export const myTeam: Handler<{ Variables: StateToken }> = (ctx) => {
  const authedUser = ctx.get("user");

  const body: TeamsMeRes = {
    teamID: 0,
    name: authedUser.id,
  };

  return ctx.json(body, 200);
};

export const teamMatches: Handler<
  { Variables: StateToken },
  "/teams/:id/matches"
> = (ctx) => {
  const id = ctx.req.param("id");
  const authedUser = ctx.get("user");

  if (id !== authedUser.id) { // APIトークンと異なるチームのリソースにアクセスした場合
    return new Response(null, { status: 403 });
  }

  const body: TeamsMatchesRes = { matches: getMatches(authedUser.id) };

  return ctx.json(body, 200);
};
