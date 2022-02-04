import { assertEquals } from "../../deps-test.ts";
import { Core } from "../../deps.ts";
import { ExpGame, Player } from "../parts/expKakomimasu.ts";

// deno-lint-ignore no-explicit-any
function deleteNull(obj: any) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === null) delete obj[key];
    else if (typeof obj[key] === "object") deleteNull(obj[key]);
  });
  return obj;
}

Deno.test({
  name: "restore ExpGame class",
  fn() {
    const board = new Core.Board({
      w: 2,
      h: 2,
      points: [1, 2, 3, 4],
      nagent: 1,
      nturn: 10,
      nsec: 1,
      nplayer: 2,
    });
    const game = new ExpGame(board);
    const restoredGame = ExpGame.restore(game.toLogJSON());
    assertEquals(game, restoredGame);
  },
  sanitizeOps: false,
});

Deno.test({
  name: "restore ExpGame class",
  fn() {
    const board = new Core.Board({
      w: 2,
      h: 2,
      points: [1, 2, 3, 4],
      nagent: 1,
      nturn: 10,
      nsec: 1,
      nplayer: 2,
    });
    const game = new ExpGame(board);
    const p1 = new Player("p1");
    game.attachPlayer(p1);

    const restoredGame = ExpGame.restore(deleteNull(game.toLogJSON()));
    assertEquals(game.toLogJSON(), restoredGame.toLogJSON());
  },
  sanitizeOps: false,
});
