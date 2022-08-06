export type ActionType = "move" | "remove" | "stay" | "put";

export type PriorMatch = {
  matchID: string;
  teams: Array<{
    teamID: number;
    name: string;
  }>;
  turns: number;
  operationMillis: number;
  transitionMillis: number;
};

export type Match = {
  turn: number;
  startedAtUnixTime: number;
  width: number;
  height: number;
  teams: Array<{
    teamID: number;
    agent: number;
    agents: Array<{
      x: number;
      y: number;
      agentID: number;
    }>;
    areaPoint: number;
    wallPoint: number;
  }>;
  walls: number[][];
  areas: number[][];
  points: number[][];
  actions: Array<{
    x: number;
    y: number;
    type: ActionType;
    turn: number;
    agentID: number;
    apply: -1 | 0 | 1;
  }>;
};

export type Action = {
  x: number;
  y: number;
  type: ActionType;
  agentID: number;
};

export type Team = {
  teamID: number;
  name: string;
};

export type PriorMatchesRes = PriorMatch[];

export type MatchesRes = Match;

export type UpdateActionReq = Action[];
export type UpdateActionRes = (Action & { turn: number })[];

export type TeamsMeRes = Team;
export type TeamsMatchesRes = PriorMatch[];
