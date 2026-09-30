import { assert, assertEquals } from "@std/assert";
import { FakeTime } from "@std/testing/time";

import ApiClient from "../../client/client.ts";
import { errors } from "../../core/error.ts";
import { validator } from "../parts/openapi.ts";

const ac = new ApiClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.test({
  name: "action_after_game_end_test",
  fn: async (t) => {
    using time = new FakeTime();

    let gameId: string;
    let pic1: string;
    let pic2: string;

    await t.step("create game", async () => {
      const res = await ac.createMatch({ 
        name: "test-game-end", 
        boardName: "A-1",
        totalTurn: 2  // Very short game for quick testing
      });
      if (res.success === false) {
        throw Error("Response Error. ErrorCode:" + res.data.errorCode);
      }
      
      gameId = res.data.id;
      assert(gameId);
    });

    await t.step("join players", async () => {
      const player1Res = await ac.addPlayer(gameId, { });
      const player2Res = await ac.addPlayer(gameId, { });
      
      if (player1Res.success === false) {
        throw Error("Response Error. ErrorCode:" + player1Res.data.errorCode);
      }
      if (player2Res.success === false) {
        throw Error("Response Error. ErrorCode:" + player2Res.data.errorCode);
      }
      
      pic1 = player1Res.data.pic;
      pic2 = player2Res.data.pic;
      assert(pic1);
      assert(pic2);
    });

    await t.step("start game", async () => {
      const res = await ac.startMatch(gameId);
      if (res.success === false) {
        throw Error("Response Error. ErrorCode:" + res.data.errorCode);
      }
    });

    await t.step("play turns until game ends", async () => {
      // Get game info to understand timing
      let gameInfo = await ac.getMatch(gameId);
      if (gameInfo.success === false) {
        throw Error("Response Error. ErrorCode:" + gameInfo.data.errorCode);
      }

      const operationSec = gameInfo.data.operationSec || 3;
      const transitionSec = gameInfo.data.transitionSec || 1;
      const totalTurn = gameInfo.data.totalTurn || 2;
      
      // Play for all turns until game ends
      for (let turn = 1; turn <= totalTurn; turn++) {
        // Fast forward to the start of the turn
        const turnStartTime = gameInfo.data.startedAtUnixTime! + 
          (turn - 1) * (operationSec + transitionSec);
        time.tick(turnStartTime * 1000 - Date.now());
        
        // Send actions during the turn
        await ac.setAction(gameId, {
          actions: [{ agentId: 0, type: "PUT", x: 0, y: turn - 1 }],
        }, pic1);
        
        // Wait for turn to complete
        const turnEndTime = turnStartTime + operationSec;
        time.tick(turnEndTime * 1000 - Date.now() + 100);
        
        // Wait for transition to complete
        const transitionEndTime = turnEndTime + transitionSec;
        time.tick(transitionEndTime * 1000 - Date.now() + 100);
      }
      
      // Ensure game has ended
      gameInfo = await ac.getMatch(gameId);
      if (gameInfo.success === false) {
        throw Error("Response Error. ErrorCode:" + gameInfo.data.errorCode);
      }
      
      assertEquals(gameInfo.data.gaming, false);
      assertEquals(gameInfo.data.ending, true);
    });

    await t.step("send action after game end should fail", async () => {
      const actionRes = await ac.setAction(gameId, {
        actions: [{ agentId: 0, type: "PUT", x: 1, y: 1 }],
      }, pic1);
      
      // This should fail with GAME_ENDED error
      assertEquals(actionRes.success, false);
      if (actionRes.success === false) {
        assertEquals(actionRes.data.errorCode, errors.GAME_ENDED.errorCode);
        assertEquals(actionRes.data.message, errors.GAME_ENDED.message);
      }
      
      // Validate response format
      assert(validator.validateResponse(
        actionRes.data,
        "/matches/{gameId}/actions",
        "patch",
        "400",
        "application/json",
      ));
    });
  },
});