import { Algorithm, Core } from "../deps.ts";

import { setGame } from "./firestore.ts";
import { nowUnixTime, randomUUID } from "./util.ts";

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

class Player extends Core.Player<ExpGame> {
  public pic: string;
  public type: "account" | "guest";
  constructor(id: string, spec?: string, type: Player["type"] = "account") {
    super(id, spec);
    this.pic = Player.generatePic();
    this.type = type;
  }

  static restore(data: Player, game?: ExpGame): Player { // Kakomimasu.tsから実装をコピー＋picを追加
    const player = new Player(data.id, data.spec);
    player.index = data.index;
    player.pic = data.pic;
    player.type = data.type ?? "account";
    if (game) {
      player.game = game;
      player.agents = data.agents.map((a) => {
        return Core.Agent.restore(a, game.board, game.field);
      });
    }

    return player;
  }

  getJSON() {
    return {
      ...super.getJSON(),
      gameId: this.game?.uuid,
      pic: this.pic,
    };
  }

  private static generatePic() {
    const rnd = Math.random();
    const str = ("000000" + Math.floor(rnd * 1000000)).slice(-6);
    return str;
  }
}

type GameOptions = {
  transitionSec?: number;
  operationSec?: number;
};

class ExpGame extends Core.Game {
  public override players: Player[];
  public uuid: string;
  public name?: string;
  public startedAtUnixTime: number | null;
  public reservedUsers: string[];
  private type: "normal" | "self" | "personal";
  public personalUserId: string | null;
  public ai: Algorithm | undefined;
  private options: GameOptions;

  constructor(board: Core.Board, name?: string, options?: GameOptions) {
    super(board);
    this.uuid = randomUUID();
    this.name = name;
    this.startedAtUnixTime = null;
    this.reservedUsers = [];
    this.type = "normal";
    this.personalUserId = null;
    this.players = [];
    this.options = options ?? {};
  }

  static restore(data: ExpGame) {
    const board = Core.Board.restore(data.board);
    const game = new ExpGame(board, data.name, data.options);
    game.uuid = data.uuid;
    game.players = data.players.map((p) => Player.restore(p, game));
    game.gaming = data.gaming;
    game.ending = data.ending;
    game.field.field = data.field.field.map(({ type, player }) => {
      return { type, player: player ?? null };
    });
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
    game.type = data.type || "normal";
    game.personalUserId = data.personalUserId ?? null;
    return game;
  }

  setType(type: "normal" | "self"): void;
  setType(type: "personal", userId: string): void;
  setType(type: typeof ExpGame.prototype.type, userId?: string) {
    this.type = type;
    this.personalUserId = userId || null;
  }
  getType() {
    return this.type;
  }

  attachPlayer(player: Player) {
    if (this.reservedUsers.length > 0) {
      const isReservedUser = this.reservedUsers.some((e) => e === player.id);
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

    while (this.gaming) {
      this.onTurn();
      // 次の遷移ステップ時間まで待つ
      const nextTransitionUnixTime = this.startedAtUnixTime +
        this.nsec * (this.turn) + this.transitionSec() * (this.turn - 1);
      await sleep(diffTime(nextTransitionUnixTime));

      this.nextTurn();

      // 次の行動ステップ時間まで待つ
      const nextOperationUnixTime = nextTransitionUnixTime +
        this.transitionSec();
      await sleep(diffTime(nextOperationUnixTime));

      this.wsSend();
    }
    setGame(this);
  }

  transitionSec() {
    return this.options.transitionSec ?? 1;
  }
  operationSec() {
    return this.options.operationSec ?? this.board.nsec;
  }

  isTransitionStep() {
    if (this.gaming === false) return false;
    if (this.startedAtUnixTime === null) return false;
    const elapsetTimeFromStart = nowUnixTime() - this.startedAtUnixTime;
    const elapsetTimeFromTurn = elapsetTimeFromStart %
      (this.transitionSec() + this.operationSec());
    if (elapsetTimeFromTurn - this.operationSec() < 0) return false;
    else return true;
  }

  onInit() {
    //console.log("onInit");
    if (this.ai) {
      const board: Readonly<typeof this.board> = this.board;
      const points: number[][] = [];
      for (let i = 0; i < board.points.length; i += board.w) {
        points.push(board.points.slice(i, i + board.w));
      }
      const agentCount = this.board.nagent;
      const totalTurn = this.board.nturn;

      this.ai.onInit(points, agentCount, totalTurn);
    }
  }

  async onTurn() {
    // awaitが含まれないasync関数は同期関数になってしまうためawaitを無理やり含めている。
    // (たとえonTuenに処理がかかったとしてもサーバの動作に影響が出ないようにするため)
    await new Promise((resolve) => resolve(""));
    //console.log("onTurn");
    if (this.ai) {
      const w = this.board.w;
      const h = this.board.h;
      const p = this.board.points;
      const field = [];
      const tiled = this.field.field;
      const agentXYs: Record<string, number> = {};
      for (let i = 0; i < this.players.length; i++) {
        const player = this.players[i];
        for (const agent of player.agents) {
          if (agent.x != -1) {
            agentXYs[agent.x + "," + agent.y] = i;
          }
        }
      }
      for (let i = 0; i < h; i++) {
        const row = [];
        for (let j = 0; j < w; j++) {
          const idx = i * w + j;
          const point = p[idx];
          const type = tiled[idx].type;
          const pid = tiled[idx].player;
          const agentPid = agentXYs[j + "," + i];
          row.push({ type, pid, point, x: j, y: i, agentPid });
        }
        field.push(row);
      }

      const playerNumber = 1;

      const agents = this.players[playerNumber].agents.map((a) => {
        const agent = {
          x: a.x,
          y: a.y,
        };
        return agent;
      });
      const turn = this.turn;
      const actions = this.ai.onTurn(field, playerNumber, agents, turn) as [
        number,
        string,
        number,
        number,
      ][];

      const getType = (type: string) => {
        if (type === "PUT") return Core.Action.PUT;
        else if (type === "NONE") return Core.Action.NONE;
        else if (type === "MOVE") return Core.Action.MOVE;
        else if (type === "REMOVE") return Core.Action.REMOVE;
        return Core.Action.NONE;
      };

      const actionsAry: [number, ReturnType<typeof getType>, number, number][] =
        actions.map((a) => [a[0], getType(a[1]), a[2], a[3]]);
      this.players[playerNumber].setActions(Core.Action.fromJSON(actionsAry));
    }
  }

  toJSON() {
    const { players: _, ...ret } = super.toJSON();
    const players = this.players.map((p, i) => { // kakomimasu.tsから実装をコピー&typeを追加
      const id = p.id;
      let agents: { x: number; y: number }[] = [];
      if (this.isReady()) {
        agents = [];
        p.agents.forEach((a) => {
          const agent = {
            x: a.x,
            y: a.y,
          };
          agents.push(agent);
        });
      }
      return {
        id: id,
        agents: agents,
        point: this.field.getPoints()[i],
        type: p.type,
      };
    });
    return {
      ...ret,
      players,
      id: this.uuid,
      name: this.name,
      startedAtUnixTime: this.startedAtUnixTime,
      reservedUsers: this.reservedUsers,
      type: this.type,
      transitionSec: this.transitionSec(),
      operationSec: this.operationSec(),
    };
  }

  toLogJSON() {
    const data = { ...this, ...super.toLogJSON(), ...{ ai: undefined } };
    return data;
  }

  wsSend() {
    sendGameFn.forEach((fn) => fn(this));
  }
}

class ExpKakomimasu extends Core.Kakomimasu<ExpGame> {
  getFreeGames() {
    const games = super.getFreeGames();
    return games.filter((game) => game.getType() === "normal");
  }
}

export { ExpGame, ExpKakomimasu, Player };
