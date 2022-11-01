export interface ApiOption {
  option?: {
    dryRun?: boolean;
  };
}

export interface User {
  screenName: string;
  name: string;
  id: string;
  gameIds: string[];
  bearerToken?: string;
}

export interface UserRegistReq extends ApiOption {
  screenName: string;
  name: string;
}

export type UserDeleteReq = ApiOption;

export type TournamentRes = Required<Tournament>;

export interface TournamentAddUserReq extends ApiOption {
  user: string;
}

export interface TournamentCreateReq extends TournamentBasic, ApiOption {
  participants?: string[];
}

export interface TournamentDeleteReq extends ApiOption {
  id: string;
}

export interface GameCreateReq extends ApiOption {
  name?: string;
  boardName?: string; // 必須
  nPlayer?: number;
  playerIdentifiers?: string[];
  tournamentId?: string;
  isMySelf?: boolean;
}

export interface MatchReq extends ApiOption {
  spec?: string;
  gameId?: string;
  useAi?: boolean;
  aiOption?: {
    aiName: string;
    boardName?: string;
  };
  guest?: {
    name: string;
  };
}

export interface MatchRes {
  userId: string;
  spec: string;
  gameId: string;
  index: number;
  pic: string;
}

export interface ActionPost {
  agentId: number;
  type: "PUT" | "NONE" | "MOVE" | "REMOVE";
  x: number;
  y: number;
}

export interface ActionReq extends ApiOption {
  actions: ActionPost[];
}

export interface ActionRes {
  receptionUnixTime: number;
  turn: number;
}

export interface Game {
  id: string;
  gaming: boolean;
  ending: boolean;
  board: Board | null;
  turn: number;
  totalTurn: number;
  tiled: { type: 0 | 1; player: number | null }[] | null;
  players: Player[];
  log: {
    players: {
      point: Point;
      actions: {
        agentId: number;
        type: 1 | 2 | 3 | 4;
        x: number;
        y: number;
        res: 0 | 1 | 2 | 3 | 4 | 5;
      }[];
    }[];
  }[];
  name: string | undefined;
  startedAtUnixTime: number | null;
  reservedUsers: string[];
  type: string;
  operationSec: number;
  transitionSec: number;
}

export interface Board {
  name: string;
  width: number;
  height: number;
  nAgent: number;
  nPlayer: number;
  nTurn: number;
  nSec: number;
  points: number[];
}

export interface Point {
  areaPoint: number;
  wallPoint: number;
}

export interface Player {
  id: string;
  agents: { x: number; y: number }[];
  point: Point;
}

export type TournamentType = "round-robin" | "knockout";

interface TournamentBasic {
  name: string;
  organizer?: string;
  type: TournamentType;
  remarks?: string;
}

export interface Tournament extends TournamentBasic {
  users?: string[];
  id?: string;
  gameIds?: string[];
}

export interface WsGameReq {
  q: string;
  startIndex?: number;
  endIndex?: number;
  allowNewGame?: boolean;
}

interface WsGameResInitial {
  type: "initial";
  q: string;
  startIndex?: number;
  endIndex?: number;
  games: Game[];
  gamesNum: number;
}

interface WsGameResUpdate {
  type: "update";
  game: Game;
}

interface WsGameResRemove {
  type: "remove";
  gameId: string;
}

interface WsGameResAdd {
  type: "add";
  game: Game;
}

export type WsGameRes =
  | WsGameResInitial
  | WsGameResUpdate
  | WsGameResRemove
  | WsGameResAdd;

export type GameStreamReq = WsGameReq;
export type GameStreamResInitial = WsGameResInitial;
export type GameStreamResUpdate = WsGameResUpdate;
export type GameStreamResRemove = WsGameResRemove;
export type GameStreamResAdd = WsGameResAdd;
export type GameStreamRes = WsGameRes;
