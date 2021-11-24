import { Algorithm, Core } from "../../deps.ts";
import { nowUnixTime, randomUUID } from "../util.ts";

import { setGame } from "./firestore_opration.ts";

import { accounts } from "../user.ts";

import { Game as GameType } from "../types.ts";

class Player extends Core.Player<ExpGame> {
  getJSON() {
    return {
      ...super.getJSON(),
      gameId: this.game?.uuid,
    };
  }
}

class ExpGame extends Core.Game {
  public uuid: string;
  public name?: string;
  public startedAtUnixTime: number | null;
  public changeFuncs: (((id: string) => void) | (() => void))[];
  public reservedUsers: string[];
  private type: "normal" | "self" | "personal";
  public personalUserId: string | null;
  public ai: Algorithm | undefined;

  constructor(board: Core.Board, name?: string) {
    super(board);
    this.uuid = randomUUID();
    this.name = name;
    this.startedAtUnixTime = null;
    this.changeFuncs = [];
    this.reservedUsers = [];
    this.type = "normal";
    this.personalUserId = null;
  }

  static restore(data: ExpGame) {
    const board = Core.Board.restore(data.board);
    const game = new ExpGame(board, data.name);
    game.uuid = data.uuid;
    game.players = data.players.map((p) => Player.restore(p));
    game.gaming = data.gaming;
    game.ending = data.ending;
    game.field.field = data.field.field.map(({ type, player }) => {
      return { type, player: player || null };
    });
    game.log = data.log;
    game.turn = data.turn;
    game.startedAtUnixTime = data.startedAtUnixTime;
    game.reservedUsers = data.reservedUsers;
    game.type = data.type || "normal";
    game.personalUserId = data.personalUserId;
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
    accounts.addGame(player.id, this.uuid);
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

  updateStatus() {
    try {
      if (this.isGaming()) { // ゲーム進行中
        const nextTurnUnixTime = this.getNextTurnUnixTime();
        if (!nextTurnUnixTime) throw Error("nextTurnUnixTime is null");
        this.onTurn();
        const diff = (nextTurnUnixTime * 1000) - new Date().getTime();
        setTimeout(() => {
          this.nextTurn();
          this.updateStatus();
        }, diff);
      } else if (this.ending) { // ゲーム終了後
        setGame(this);

        //console.log("turn", this.turn);
      } // ゲーム開始前
      else if (this.isReady()) {
        this.startedAtUnixTime = nowUnixTime() + 5;
        this.onInit();
        const diff = (this.startedAtUnixTime * 1000) - new Date().getTime();
        setTimeout(() => {
          this.start();
          this.updateStatus();
        }, diff);
      }
      this.wsSend();
    } catch (e) {
      console.error(e);
    }
  }

  getNextTurnUnixTime() {
    if (this.startedAtUnixTime === null || this.ending) {
      return null;
    } else {
      return this.startedAtUnixTime + this.nsec * this.turn;
    }
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

  toJSON(): GameType {
    const ret = super.toJSON();
    return {
      ...ret,
      gameId: this.uuid,
      gameName: this.name,
      startedAtUnixTime: this.startedAtUnixTime,
      nextTurnUnixTime: this.getNextTurnUnixTime(),
      reservedUsers: this.reservedUsers,
      type: this.type,
    };
  }

  toLogJSON() {
    const data = { ...this, ...super.toLogJSON() };
    data.changeFuncs = [];
    return data;
  }

  wsSend() {
    //console.log("expKakomimasu", this.uuid);
    this.changeFuncs.forEach((func) => func(this.uuid));
  }
}

class ExpKakomimasu extends Core.Kakomimasu<ExpGame> {
  getFreeGames() {
    const games = super.getFreeGames();
    return games.filter((game) => game.getType() === "normal");
  }
}

export { ExpGame, ExpKakomimasu, Player };
