export type PriorMatch = {
  id: string;
  intervalMillis: 0;
  matchTo: string;
  teamID: string;
  turnMillis: number;
  turns: number;
};

export type Match = {
  actions: Array<{
    agentID: number;
    dx: number;
    dy: number;
    type: "move" | "remove" | "stay" | "put";
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
    teamID: string;
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
  type: "move" | "remove" | "stay" | "put"; // TODO:Action Typeとしてまとめる
};

export type UpdateActionReq = Action[];

export type UpdateActionRes = (Action & { turn: number })[];
