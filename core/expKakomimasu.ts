import { Core } from "../deps.ts";

import { setGame } from "./kv.ts";
import { ClientBase, nowUnixTime, randomUUID } from "./util.ts";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function diffTime(s: number) {
  return (s * 1000) - new Date().getTime();
}

const sendGameFn: ((game: ExpGame) => void)[] = [];

export const addSendGameFn = (fn: typeof sendGameFn[number]) => [
  sendGameFn.push(fn),
];

export interface Board extends Core.Board {
  name: string;
  transitionSec?: number;
  operationSec?: number;
}

interface GameLogJson extends Core.GameJson {
  id: string;
  name?: string;
  startedAtUnixTime: number | null;
  reservedUsers: string[];
  type: "normal" | "self" | "personal";
  personalUserId: string | null;
  players: PlayerJson[];
  transitionSec: number;
  operationSec: number;
}
type GameJson =
  & Omit<
    GameLogJson,
    "players" | "personalUserId" | "field" | "options"
  >
  & {
    nPlayer: number;
    nAgent: number;
    field: {
      width: number;
      height: number;
      points: number[];
      tiles: Core.FieldTile[];
    } | null;
    status: ReturnType<Core.Game["getStatus"]>;
    players:
      (Omit<PlayerJson, "actions" | "pic" | "index"> & { point: Core.Point })[];
  };

interface PlayerJson extends Core.PlayerJson {
  pic: string;
  type: "account" | "guest";
}

class Player extends Core.Player<ExpGame> {
  public pic: string;
  public type: "account" | "guest";
  constructor(id: string, spec?: string, type: Player["type"] = "account") {
    super(id, spec);
    this.pic = Player.generatePic();
    this.type = type;
  }

  static fromJSON(data: PlayerJson, game?: ExpGame): Player { // Kakomimasu.tsから実装をコピー＋pic,typeを追加
    const player = new Player(data.id, data.spec);
    player.index = data.index;
    player.pic = data.pic;
    player.type = data.type;
    if (game) {
      player.game = game;
      player.agents = data.agents.map((a) => {
        return Core.Agent.fromJSON(a, data.index, game.field);
      });
    }

    return player;
  }
  toJSON(): PlayerJson {
    return {
      ...super.toJSON(),
      pic: this.pic,
      type: this.type,
    };
  }

  getJSON() {
    return {
      userId: this.id,
      spec: this.spec,
      gameId: this.game?.id,
      index: this.index,
      pic: this.pic,
    };
  }

  private static generatePic() {
    const rnd = Math.random();
    const str = ("000000" + Math.floor(rnd * 1000000)).slice(-6);
    return str;
  }
}

export type GameInit = Omit<Board, "name">;

class ExpGame extends Core.Game {
  public override players: Player[];
  public id: string;
  public name?: string;
  public startedAtUnixTime: number | null;
  public reservedUsers: string[];
  public type: "normal" | "self" | "personal";
  public personalUserId: string | null;
  public ai: ClientBase | undefined;
  public operationSec: number;
  public transitionSec: number;

  constructor(init: GameInit, name?: string) {
    const { transitionSec = 1, operationSec = 1, ...gameInit } = init;
    super(gameInit);
    this.id = randomUUID();
    this.name = name;
    this.startedAtUnixTime = null;
    this.reservedUsers = [];
    this.type = "normal";
    this.personalUserId = null;
    this.players = [];
    this.operationSec = operationSec;
    this.transitionSec = transitionSec;
  }

  static fromJSON(data: GameLogJson) {
    const board: GameInit = {
      width: data.field.width,
      height: data.field.height,
      points: data.field.points,
      nPlayer: data.field.nPlayer,
      nAgent: data.field.nAgent,
      totalTurn: data.totalTurn,
      transitionSec: data.transitionSec,
      operationSec: data.operationSec,
    };
    const game = new ExpGame(board, data.name);
    game.id = data.id;
    game.players = data.players.map((p) => Player.fromJSON(p, game));
    // firebaseではnullがundefinedに変換されるので、再度nullを代入する
    game.field.tiles = data.field.tiles.map(({ type, player }) => {
      return { type, player: player ?? null };
    });
    // firebaseでは空配列がundefinedに変換されるので、再度空配列を代入する
    game.log = data.log.map((turn) => {
      return {
        players: turn.players.map(({ point, actions }) => {
          return { point, actions: actions ?? [] };
        }),
      };
    });
    game.turn = data.turn;
    game.startedAtUnixTime = data.startedAtUnixTime ?? null;
    game.reservedUsers = data.reservedUsers ?? [];
    game.type = data.type;
    game.personalUserId = data.personalUserId ?? null;
    return game;
  }

  setType(type: "normal" | "self"): void;
  setType(type: "personal", userId: string): void;
  setType(type: typeof ExpGame.prototype.type, userId?: string) {
    this.type = type;
    this.personalUserId = userId || null;
  }

  attachPlayer(player: Player) {
    if (this.reservedUsers.length > 0) {
      const isReservedUser = player.type === "account" &&
        this.reservedUsers.some((e) => e === player.id);
      if (!isReservedUser) throw Error("Not allowed user");
    }

    if (super.attachPlayer(player) === false) return false;
    this.updateStatus();
    return true;
  }

  addReservedUser(userId: string) {
    if (this.reservedUsers.some((e) => e === userId)) {
      return false;
    } else {
      this.reservedUsers.push(userId);
      return true;
    }
  }

  private async updateStatus() {
    this.wsSend();
    if (!this.isReady()) return;
    // 試合開始時間を設定
    this.startedAtUnixTime = nowUnixTime() + 5;
    this.onInit();
    await sleep(diffTime(this.startedAtUnixTime));

    // 試合開始
    this.start();
    this.wsSend();

    while (this.isGaming()) {
      this.onTurn();
      // 次の遷移ステップ時間まで待つ
      const nextTransitionUnixTime = this.startedAtUnixTime +
        this.operationSec * (this.turn) +
        this.transitionSec * (this.turn - 1);
      await sleep(diffTime(nextTransitionUnixTime));

      this.nextTurn();

      // 次の行動ステップ時間まで待つ
      const nextOperationUnixTime = nextTransitionUnixTime +
        this.transitionSec;
      await sleep(diffTime(nextOperationUnixTime));

      this.wsSend();
    }
    setGame(this);
  }

  isTransitionStep() {
    if (this.isGaming() === false) return false;
    if (this.startedAtUnixTime === null) return false;
    const elapsetTimeFromStart = nowUnixTime() - this.startedAtUnixTime;
    const elapsetTimeFromTurn = elapsetTimeFromStart %
      (this.transitionSec + this.operationSec);
    if (elapsetTimeFromTurn - this.operationSec < 0) return false;
    else return true;
  }

  onInit() {
    //console.log("onInit");
    if (this.ai) {
      this.ai.oninit(this);
    }
  }

  async onTurn() {
    // awaitが含まれないasync関数は同期関数になってしまうためawaitを無理やり含めている。
    // (たとえonTuenに処理がかかったとしてもサーバの動作に影響が出ないようにするため)
    await new Promise((resolve) => resolve(""));
    //console.log("onTurn");
    if (this.ai) {
      const actions = this.ai.onturn(this);
      this.players[1].setActions(actions);
    }
  }

  toJSON(): GameJson {
    const {
      players: players_,
      field: field_,
      personalUserId: _p,
      ...ret
    } = this;
    const players = players_.map((p, i) => { // kakomimasu.tsから実装をコピー&typeを追加
      return {
        id: p.id,
        spec: p.spec,
        agents: p.agents,
        point: this.field.getPoints()[i],
        type: p.type,
      };
    });
    const { nPlayer, nAgent, ...field } = field_;
    const data: GameJson = {
      ...ret,
      nPlayer,
      nAgent,
      field: this.isFree() ? null : field,
      players,
      status: this.getStatus(),
    };
    return data;
  }

  toLogJSON() {
    const { ai: _, ...data } = this;
    return data;
  }

  wsSend() {
    sendGameFn.forEach((fn) => fn(this));
  }
}

export { ExpGame, Player };
