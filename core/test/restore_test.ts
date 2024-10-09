import { assertEquals, delay } from "../../deps-test.ts";
import { Core } from "../../deps.ts";
import { ExpGame, Player } from "../expKakomimasu.ts";
import { compression, decompression } from "../util.ts";

const testKv = await Deno.openKv(":memory:");

// deno-lint-ignore no-explicit-any
function firebaseSave(obj: any) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === null) delete obj[key];
    else if (Array.isArray(obj[key]) && obj[key].length === 0) delete obj[key];
    else if (typeof obj[key] === "object") firebaseSave(obj[key]);
  });
  return obj;
}

Deno.test({
  name: "restore ExpGame class",
  fn() {
    const game = new ExpGame({
      width: 2,
      height: 2,
      points: [1, 2, 3, 4],
      nAgent: 1,
      totalTurn: 10,
      operationSec: 1,
      nPlayer: 2,
    });
    const restoredGame = ExpGame.fromJSON(game.toLogJSON());
    assertEquals(game, restoredGame);
  },
  sanitizeOps: false,
});

Deno.test({
  name: "restore ExpGame class",
  async fn() {
    const game = new ExpGame({
      width: 2,
      height: 2,
      points: [1, 2, 3, 4],
      nAgent: 1,
      totalTurn: 10,
      operationSec: 1,
      nPlayer: 2,
    });
    const p1 = new Player("p1");
    const p2 = new Player("p2");
    game.attachPlayer(p1);
    game.attachPlayer(p2);
    p1.setActions([new Core.Action(0, 1, 0, 1)]);

    while (game.turn < 2) {
      await delay(1000);
    }

    const restoredGame = ExpGame.fromJSON(
      firebaseSave(JSON.parse(JSON.stringify(game.toLogJSON()))),
    );
    assertEquals(
      JSON.parse(JSON.stringify(game.toLogJSON())),
      JSON.parse(JSON.stringify(restoredGame.toLogJSON())),
    );
    assertEquals(game, restoredGame);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});

Deno.test({
  name: "KV restore ExpGame class",
  async fn() {
    const game = new ExpGame({
      width: 2,
      height: 2,
      points: [1, 2, 3, 4],
      nAgent: 1,
      totalTurn: 10,
      operationSec: 1,
      nPlayer: 2,
    });
    testKv.set(["test1"], await compression(game.toLogJSON()));

    // deno-lint-ignore no-explicit-any
    const kvData = await testKv.get<any>(["test1"]);
    const restoredGame = ExpGame.fromJSON(await decompression(kvData.value));

    assertEquals(game, restoredGame);
  },
  sanitizeOps: false,
});

Deno.test({
  name: "KV restore ExpGame class",
  async fn() {
    const game = new ExpGame({
      width: 2,
      height: 2,
      points: [1, 2, 3, 4],
      nAgent: 1,
      totalTurn: 10,
      operationSec: 1,
      nPlayer: 2,
    });
    const p1 = new Player("p1");
    const p2 = new Player("p2");
    game.attachPlayer(p1);
    game.attachPlayer(p2);
    p1.setActions([new Core.Action(0, 1, 0, 1)]);

    while (game.turn < 2) {
      await delay(1000);
    }

    testKv.set(["test1"], await compression(game.toLogJSON()));

    // deno-lint-ignore no-explicit-any
    const kvData = await testKv.get<any>(["test1"]);
    const restoredGame = ExpGame.fromJSON(await decompression(kvData.value));

    assertEquals(game, restoredGame);
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
