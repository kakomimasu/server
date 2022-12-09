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
} as const;

export type VersionRes = { version: string };

export type DryRunOption = {
  dryRun?: boolean;
};

export type ErrorRes = {
  errorCode: number;
  message: string;
};

type JoinMatchReq = {
  spec?: string;
  guestName?: string;
};
type JoinMatchRes = {
  userId: string;
  spec: string;
  gameId: string;
  index: number;
  pic: string;
};

export type JoinGameIdMatchReq = JoinMatchReq & DryRunOption;
export type JoinGameIdMatchRes = JoinMatchRes;

export type JoinFreeMatchReq = JoinMatchReq & DryRunOption;
export type JoinFreeMatchRes = JoinMatchRes;

export type JoinAiMatchReq = JoinMatchReq & {
  aiName: "none" | "a1" | "a2" | "a3" | "a4" | "a5";
  boardName?: string;
} & DryRunOption;
export type JoinAiMatchRes = JoinMatchRes;

export type GetMatchRes = Game;

export type ActionMatchReq = {
  actions: ({
    agentId: number;
    type: "PUT" | "MOVE" | "REMOVE";
    x: number;
    y: number;
  } | { agentId: number; type: "NONE" })[];
} & DryRunOption;
export type ActionMatchRes = {
  receptionUnixTime: number;
  turn: number;
};

export type CreateMatchReq = {
  name?: string;
  boardName: string;
  nPlayer?: number;
  playerIdentifiers?: string[];
  tournamentId?: string;
  isPersonal?: boolean;
} & DryRunOption;
export type CreateMatchRes = Game;

export type StreamMatchesInitialRes = {
  type: "initial";
  q: string;
  startIndex?: number;
  endIndex?: number;
  games: Game[];
  gamesNum: number;
};
export type StreamMatchesUpdateRes = { type: "update"; game: Game };
export type StreamMatchesAddRes = { type: "add"; game: Game };
export type StreamMatchesRemoveRes = { type: "remove"; gameId: string };
export type StreamMatchesRes =
  | StreamMatchesInitialRes
  | StreamMatchesUpdateRes
  | StreamMatchesAddRes
  | StreamMatchesRemoveRes;

export type GetBoardsRes = Board[];

export type GetTournamentsRes = Tournament[];

export type CreateTournamentReq = {
  name: string;
  type: "round-robin" | "knockout";
  organizer?: string;
  remarks?: string;
  participants?: string[];
} & DryRunOption;
export type CreateTournamentRes = Tournament;

export type GetTournamentRes = Tournament;

export type DeleteTournamentReq = DryRunOption;
export type DeleteTournamentRes = Tournament;

export type AddTournamentUserReq = { user: string } & DryRunOption;
export type AddTournamentUserRes = Tournament;

export type GetUserRes = User;

export type DeleteUserReq = DryRunOption;
export type DeleteUserRes = AuthedUser;

export type GetUsersRes = User[];

export type CreateUserReq = {
  screenName: string;
  name: string;
} & DryRunOption;
export type CreateUserRes = AuthedUser;

export type Game = {
  id: string;
  gaming: boolean;
  ending: boolean;
  board: Board | null;
  turn: number;
  totalTurn: number;
  tiled: {
    type: typeof TileType[keyof typeof TileType];
    player: number | null;
  }[] | null;
  players: Player[];
  log: {
    players: {
      point: Point;
      actions: {
        agentId: number;
        type: typeof ActionType[keyof typeof ActionType];
        x: number;
        y: number;
        res: typeof ActionResult[keyof typeof ActionResult];
      }[];
    }[];
  }[];
  name?: string;
  startedAtUnixTime: number | null;
  reservedUsers: string[];
  type: "normal" | "self" | "personal";
  operationSec: number;
  transitionSec: number;
};

export type Board = {
  name: string;
  width: number;
  height: number;
  nAgent: number;
  nPlayer: number;
  nTurn: number;
  nSec: number;
  points: number[];
};

export type Point = {
  areaPoint: number;
  wallPoint: number;
};

export type Player = {
  id: string;
  agents: { x: number; y: number }[];
  point: Point;
  type: "account" | "guest";
};

export type Tournament = {
  name: string;
  organizer: string;
  type: "round-robin" | "knockout";
  remarks: string;
  users: string[];
  id: string;
  gameIds: string[];
};

type UserBase = {
  screenName: string;
  name: string;
  id: string;
  gameIds: string[];
};

export type User = UserBase & { bearerToken?: string };
export type AuthedUser = UserBase & { bearerToken: string };
