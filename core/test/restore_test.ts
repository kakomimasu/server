import { assertEquals, delay } from "../../deps-test.ts";
import { Core } from "../../deps.ts";
import { ExpGame, Player } from "../expKakomimasu.ts";
import { app } from "../firebase.ts";

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
  name: "restore test",
  async fn(t) {
    app.database().goOnline();

    await t.step({
      name: "ExpGame class",
      fn() {
        const game = new ExpGame({
          width: 2,
          height: 2,
          points: [1, 2, 3, 4],
          nAgent: 1,
          totalTurn: 1,
          operationSec: 1,
          nPlayer: 2,
        });
        const restoredGame = ExpGame.fromJSON(game.toLogJSON());
        assertEquals(game, restoredGame);
      },
    });

    await t.step({
      name: "ExpGame class",
      async fn() {
        const game = new ExpGame({
          width: 2,
          height: 2,
          points: [1, 2, 3, 4],
          nAgent: 1,
          totalTurn: 1,
          operationSec: 1,
          nPlayer: 2,
        });
        const p1 = new Player("p1");
        const p2 = new Player("p2");
        game.attachPlayer(p1);
        game.attachPlayer(p2);
        p1.setActions([new Core.Action(0, 1, 0, 1)]);

        while (game.isEnded() === false) {
          await delay(1000);
        }

        const restoredGame = ExpGame.fromJSON(
          firebaseSave(JSON.parse(JSON.stringify(game.toLogJSON()))),
        );
        assertEquals(
          JSON.parse(JSON.stringify(game.toLogJSON())),
          JSON.parse(JSON.stringify(restoredGame.toLogJSON())),
        );
      },
    });

    app.database().goOffline();
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
