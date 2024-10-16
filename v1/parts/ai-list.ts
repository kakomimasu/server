import * as Core from "kkmm-core";
import { ClientBase } from "../../core/util.ts";
import { ExpGame } from "../../core/expKakomimasu.ts";

// 8方向、上から時計回り
const DIR = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

function rnd(n: number) {
  return Math.floor(Math.random() * n); // MT is better
}

const getTypeNumber = (type: string) => {
  if (type === "PUT") return Core.Action.PUT;
  else if (type === "NONE") return Core.Action.NONE;
  else if (type === "MOVE") return Core.Action.MOVE;
  else if (type === "REMOVE") return Core.Action.REMOVE;
  return Core.Action.NONE;
};
type Pnt = {
  x: number;
  y: number;
  point: number;
};

function sortByPoint(p: Pnt[]) {
  p.sort((a, b) => b.point - a.point);
}

/**
 * 配置されていないエージェントはランダムに配置
 * 配置されているエージェントは周囲8マスからランダムに動かす
 */
export class ClientA1 implements ClientBase {
  playerIndex: number;
  pntall: Pnt[] = [];

  constructor(playerIndex: number) {
    this.playerIndex = playerIndex;
  }

  oninit(game: ExpGame) {
    const w = game.field.width;
    const h = game.field.height;

    // ポイントの高い順ソート
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        this.pntall.push({ x: j, y: i, point: game.field.points[i * w + j] });
      }
    }
    sortByPoint(this.pntall);
  }

  onturn(game: ExpGame) {
    // ランダムにずらしつつ置けるだけおく
    // 置いたものはランダムに8方向動かす
    const actions: Core.Action[] = [];
    const offset = rnd(game.field.nAgent);
    for (let i = 0; i < game.field.nAgent; i++) {
      const agent = game.players[this.playerIndex].agents[i];
      if (agent.x === -1) {
        const p = this.pntall[i + offset];
        actions.push(new Core.Action(i, getTypeNumber("PUT"), p.x, p.y));
      } else {
        const [dx, dy] = DIR[rnd(8)];
        actions.push(
          new Core.Action(i, getTypeNumber("MOVE"), agent.x + dx, agent.y + dy),
        );
      }
    }
    return actions;
  }
}

/**
 * 配置されていないエージェントはランダムに配置
 * 配置されているエージェントは周囲8マスのうち、フィールド外に出るマスを除いたマスからランダムに動かす
 */
export class ClientA2 implements ClientBase {
  playerIndex: number;
  pntall: Pnt[] = [];

  constructor(playerIndex: number) {
    this.playerIndex = playerIndex;
  }

  oninit(game: ExpGame) {
    const w = game.field.width;
    const h = game.field.height;

    // ポイントの高い順ソート
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        this.pntall.push({ x: j, y: i, point: game.field.points[i * w + j] });
      }
    }
    sortByPoint(this.pntall);
  }

  onturn(game: ExpGame) {
    const w = game.field.width;
    const h = game.field.height;

    // ランダムにずらしつつ置けるだけおく
    // 置いたものはランダムに8方向動かす
    // 画面外にはでない判定を追加（a1 → a2)
    const actions: Core.Action[] = [];
    const offset = rnd(game.field.nAgent);
    for (let i = 0; i < game.field.nAgent; i++) {
      const agent = game.players[this.playerIndex].agents[i];
      if (agent.x === -1) {
        const p = this.pntall[i + offset];
        actions.push(new Core.Action(i, getTypeNumber("PUT"), p.x, p.y));
      } else {
        for (;;) {
          const [dx, dy] = DIR[rnd(8)];
          const x = agent.x + dx;
          const y = agent.y + dy;
          if (x < 0 || x >= w || y < 0 || y >= h) {
            continue;
          }
          actions.push(new Core.Action(i, getTypeNumber("MOVE"), x, y));
          break;
        }
      }
    }
    return actions;
  }
}

/**
 * 配置されていないエージェントはランダムに配置
 * 配置済みの場合、周囲8マスのポイントに以下の条件を追加して優先順位を決め、最も優先度が高いマスに移動（除去）を行う
 *    1. 敵の領地（AREA）だったら+10ポイント
 *    2. 空いている土地だったら+5ポイント
 *    3. 敵の壁（WALL）だったら0ポイント
 *    4. それ以外なら優先順位に含めない
 * ただし、優先順位が決まらない場合はランダムに移動（除去）を行う
 */
export class ClientA3 implements ClientBase {
  playerIndex: number;
  pntall: Pnt[] = [];

  constructor(playerIndex: number) {
    this.playerIndex = playerIndex;
  }

  oninit(game: ExpGame) {
    const w = game.field.width;
    const h = game.field.height;

    // ポイントの高い順ソート
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        this.pntall.push({ x: j, y: i, point: game.field.points[i * w + j] });
      }
    }
    sortByPoint(this.pntall);
  }

  onturn(game: ExpGame) {
    const w = game.field.width;
    const h = game.field.height;

    const actions: Core.Action[] = [];
    const offset = rnd(game.field.nAgent);
    const poschk: { x: number; y: number }[] = []; // 動く予定の場所
    const checkFree = (x: number, y: number) => {
      for (let i = 0; i < poschk.length; i++) {
        const p = poschk[i];
        if (p.x === x && p.y === y) {
          return false;
        }
      }
      return true;
    };
    for (let i = 0; i < game.field.nAgent; i++) {
      const agent = game.players[this.playerIndex].agents[i];
      // cl(field);
      if (agent.x === -1) { // 置く前?
        const p = this.pntall[i + offset];
        actions.push(new Core.Action(i, getTypeNumber("PUT"), p.x, p.y));
      } else {
        const dirall = [];
        for (const [dx, dy] of DIR) {
          const x = agent.x + dx;
          const y = agent.y + dy;
          if (x >= 0 && x < w && y >= 0 && y < h && checkFree(x, y)) {
            const f = game.field.tiles[y * w + x];
            const point = game.field.points[y * w + x];
            if (
              f.type === Core.Field.AREA && f.player !== -1 &&
              f.player !== this.playerIndex
            ) { // 敵土地、おいしい！
              dirall.push({
                x,
                y,
                type: f.type,
                pid: f.player,
                point: point + 10,
              });
            } else if (f.type === 0 && f.player === -1) { // 空き土地優先
              dirall.push({
                x,
                y,
                type: f.type,
                pid: f.player,
                point: point + 5,
              });
            } else if (f.type === 1 && f.player !== this.playerIndex) { // 敵壁
              dirall.push({ x, y, type: f.type, pid: f.player, point: point });
            }
          }
        }
        if (dirall.length > 0) {
          sortByPoint(dirall);
          const p = dirall[0];
          if (p.type === 0 || p.pid === -1) {
            actions.push(new Core.Action(i, getTypeNumber("MOVE"), p.x, p.y));
            poschk.push({ x: p.x, y: p.y });
            poschk.push({ x: agent.x, y: agent.y }); // 動けなかった時用
          } else {
            actions.push(new Core.Action(i, getTypeNumber("REMOVE"), p.x, p.y));
            poschk.push({ x: agent.x, y: agent.y });
          }
        } else {
          // 周りが全部埋まっていたらランダムに動く
          for (;;) {
            const [dx, dy] = DIR[rnd(8)];
            const x = agent.x + dx;
            const y = agent.y + dy;
            if (x < 0 || x >= w || y < 0 || y >= w) {
              continue;
            }
            actions.push(new Core.Action(i, getTypeNumber("MOVE"), x, y));
            poschk.push({ x, y });
            break;
          }
        }
      }
    }
    return actions;
  }
}

/**
 * 配置されていないエージェントはランダムに配置
 * 配置済みの場合、周囲8マスのポイントに以下の条件を追加して優先順位を決め、最も優先度が高いマスに移動（除去）を行う
 *    1. 0ポイント以上の敵の領地（AREA）だったら+10ポイント
 *    2. 0ポイント以上の空いている土地だったら+5ポイント
 *    3. 0ポイント以上の敵の壁（WALL）だったら0ポイント
 *    4. それ以外なら優先順位に含めない
 * ただし、優先順位が決まらない場合はフィールド全体で空いている最高得点のマスに一番近い周囲のマスに移動
 */
export class ClientA4 implements ClientBase {
  playerIndex: number;
  pntall: Pnt[] = [];

  constructor(playerIndex: number) {
    this.playerIndex = playerIndex;
  }

  oninit(game: ExpGame) {
    const w = game.field.width;
    const h = game.field.height;

    // ポイントの高い順ソート
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        this.pntall.push({ x: j, y: i, point: game.field.points[i * w + j] });
      }
    }
    sortByPoint(this.pntall);
  }

  onturn(game: ExpGame) {
    const w = game.field.width;
    const h = game.field.height;

    const actions: Core.Action[] = [];
    const offset = rnd(game.field.nAgent);
    const poschk: { x: number; y: number }[] = []; // 動く予定の場所
    const checkFree = (x: number, y: number) => {
      for (let i = 0; i < poschk.length; i++) {
        const p = poschk[i];
        if (p.x === x && p.y === y) {
          return false;
        }
      }
      return true;
    };
    for (let i = 0; i < game.field.nAgent; i++) {
      const agent = game.players[this.playerIndex].agents[i];
      if (agent.x === -1) { // 置く前?
        const p = this.pntall[i + offset];
        actions.push(new Core.Action(i, getTypeNumber("PUT"), p.x, p.y));
      } else {
        const dirall = [];
        for (const [dx, dy] of DIR) {
          const x = agent.x + dx;
          const y = agent.y + dy;
          if (x >= 0 && x < w && y >= 0 && y < h && checkFree(x, y)) {
            const f = game.field.tiles[y * w + x];
            const point = game.field.points[y * w + x];
            if (point > 0) { // プラスのときだけ
              if (
                f.type === 0 && f.player !== -1 &&
                f.player !== this.playerIndex &&
                point > 0
              ) { // 敵土地、おいしい！
                dirall.push(
                  { x, y, type: f.type, pid: f.player, point: point + 10 },
                );
              } else if (f.type === 0 && f.player === -1 && point > 0) { // 空き土地優先
                dirall.push(
                  { x, y, type: f.type, pid: f.player, point: point + 5 },
                );
              } else if (f.type === 1 && f.player !== this.playerIndex) { // 敵壁
                dirall.push({ x, y, type: f.type, pid: f.player, point });
              }
            }
          }
        }
        if (dirall.length > 0) {
          sortByPoint(dirall);
          const p = dirall[0];
          if (p.type === 0 || p.pid === -1) {
            actions.push(new Core.Action(i, getTypeNumber("MOVE"), p.x, p.y));
            poschk.push({ x: p.x, y: p.y });
          } else {
            actions.push(new Core.Action(i, getTypeNumber("REMOVE"), p.x, p.y));
          }
          poschk.push({ x: agent.x, y: agent.y });
        } else {
          // 周りが全部埋まっていたら空いている高得点で一番近いところを目指す
          let dis = w * h;
          let target = null;
          for (const p of this.pntall) {
            const f = game.field.tiles[p.y * w + p.x];
            if (f.type === 0 && f.player === -1) {
              const dx = agent.x - p.x;
              const dy = agent.y - p.y;
              const d = dx * dx + dy * dy;
              if (d < dis) {
                dis = d;
                target = p;
              }
            }
          }
          if (target) {
            const sgn = (n: number) => {
              if (n < 0) return -1;
              if (n > 0) return 1;
              return 0;
            };
            const x2 = agent.x + sgn(target.x - agent.x);
            const y2 = agent.y + sgn(target.y - agent.y);
            const p = game.field.tiles[y2 * w + x2];
            if (p.type === 0 || p.player === -1) {
              actions.push(new Core.Action(i, getTypeNumber("MOVE"), x2, y2));
              poschk.push({ x: x2, y: y2 });
            } else {
              actions.push(new Core.Action(i, getTypeNumber("REMOVE"), x2, y2));
            }
            poschk.push({ x: agent.x, y: agent.y });
          } else {
            // 空いているところなければランダム
            for (;;) {
              const [dx, dy] = DIR[rnd(8)];
              const x = agent.x + dx;
              const y = agent.y + dy;
              if (x < 0 || x >= w || y < 0 || y >= w) {
                continue;
              }
              actions.push(new Core.Action(i, getTypeNumber("MOVE"), x, y));
              poschk.push({ x, y });
              break;
            }
          }
        }
      }
    }
    return actions;
  }
}

export class ClientNone implements ClientBase {
  playerIndex: number;

  constructor(playerIndex: number) {
    this.playerIndex = playerIndex;
  }

  oninit() {}

  onturn() {
    return [];
  }
}

export const aiList = [
  { name: "none", client: ClientNone },
  { name: "a1", client: ClientA1 },
  { name: "a2", client: ClientA2 },
  { name: "a3", client: ClientA3 },
  { name: "a4", client: ClientA4 },
];
