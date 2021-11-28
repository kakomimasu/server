import { Core } from "../../deps.ts";
import { pathResolver } from "../util.ts";
import { ExpGame, Player } from "../parts/expKakomimasu.ts";

const resolve = pathResolver(import.meta);

const board = new Core.Board({
  w: 3,
  h: 3,
  points: [1, -1, 1, -1, 3, -1, 1, -1, 1],
  nagent: 2,
  name: "sample-board",
});
const boardObj = sortObject(board.toJSON());

const p1 = new Player("bc7b10ae-c19f-4a6b-a7b9-d256f41c2583");
const p2 = new Player("fdc9c2e0-1feb-4334-ad44-9268cde6d488");

const game = new ExpGame(board, "sample-game");
game.uuid = "f0112f6a-6360-47bb-b431-bbc81e0926c0";
game.attachPlayer(p1);
game.attachPlayer(p2);
p1.setActions(Core.Action.fromJSON([
  [0, Core.Action.PUT, 0, 0],
  [1, Core.Action.PUT, 0, 1],
]));
p2.setActions(Core.Action.fromJSON([
  [0, Core.Action.PUT, 0, 2],
  [1, Core.Action.PUT, 0, 3],
]));
game.nextTurn();

p1.setActions(Core.Action.fromJSON([
  [0, Core.Action.MOVE, 1, 0],
  [1, Core.Action.MOVE, 0, 2],
]));
p2.setActions(Core.Action.fromJSON([
  [1, Core.Action.MOVE, 1, 4],
]));
game.nextTurn();
const gameObj = sortObject(game.toJSON());

//console.log(boardObj);

save("board.json", boardObj);
save("game.json", gameObj);

Deno.exit(0);

// deno-lint-ignore no-explicit-any
function sortObject(object: Record<string, any>) {
  const sorted: typeof object = {};
  const keys = Object.keys(object).sort((a, b) => {
    a = a.toString().toLowerCase();
    b = b.toString().toLowerCase();
    return (a > b) ? 1 : (b > a) ? -1 : 0;
  });
  for (const key of keys) {
    sorted[key] = object[key];
  }
  return sorted;
}

// deno-lint-ignore no-explicit-any
function save(name: string, data: any) {
  Deno.writeTextFileSync(
    resolve("../docs/data/" + name),
    JSON.stringify(data),
  );
}
