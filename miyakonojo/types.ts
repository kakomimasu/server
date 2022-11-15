type Failure400<T extends string> = {
  startAtUnixTime?: number;
  status: T;
};

export type FailureInvalidMatches = Failure400<"InvalidMatches">;
export type FailureTooEarly = Failure400<"TooEarly">;
export type FailureUnAcceptableTime = Failure400<"UnAcceptableTime">;

export type FailureInvalidToken = { status: "InvalidToken" };

export type ActionType = "move" | "remove" | "stay" | "put";

export type PriorMatch = {
  id: string;
  intervalMillis: number;
  matchTo: string;
  teamID: number;
  turnMillis: number;
  turns: number;
  index: number;
};

export type Match = {
  actions: Array<{
    agentID: number;
    dx: number;
    dy: number;
    type: ActionType;
    apply: -1 | 0 | 1;
    turn: number;
  }>;
  height: number;
  points: number[][];
  startedAtUnixTime: number;
  teams: Array<{
    agents: Array<{
      agentID: number;
      x: number;
      y: number;
    }>;
    areaPoint: number;
    teamID: number;
    tilePoint: number;
  }>;
  tiled: number[][];
  turn: number;
  width: number;
};

export type Action = {
  agentID: number;
  dx: number;
  dy: number;
  type: ActionType;
};

export type PriorMatchesRes = PriorMatch[];

export type MatchesRes = Match;

export type UpdateActionReq = Action[];
export type UpdateActionRes = { actions: (Action & { turn: number })[] };

export type PingRes = { status: "OK" };
