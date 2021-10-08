import { assertEquals, Core } from "../../deps.ts";
import { ExpGame } from "../parts/expKakomimasu.ts";

Deno.test("restore ExpGame class", () => {
  const board = new Core.Board(2, 2, [1, 2, 3, 4], 1, 10, 1, 2);
  const game = new ExpGame(board);
  const restoredGame = ExpGame.restore(game.toLogJSON());
  assertEquals(game, restoredGame);
});
