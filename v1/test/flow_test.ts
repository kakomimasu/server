import { assert, assertEquals } from "@std/assert";
import { v4 } from "@std/uuid";
import { FakeTime } from "@std/testing/time";

import { useUser } from "../../util/test/useUser.ts";

import { errors } from "../../core/error.ts";

import ApiClient from "../../client/client.ts";
import { diffTime } from "./client_util.ts";

import { validator } from "../parts/openapi.ts";

import createGameSample from "./sample/createGame_sample.json" with {
  type: "json",
};
import matchSample from "./sample/match_sample.json" with { type: "json" };
import matchGameInfoSample from "./sample/matchGameInfo_sample.json" with {
  type: "json",
};
import afterActionSample from "./sample/afterAction_sample.json" with {
  type: "json",
};
import afterActionSample2 from "./sample/afterAction_sample2.json" with {
  type: "json",
};

const update = false;

const ac = new ApiClient();

const testSpec = "test";

Deno.test({
  name: "flow test",
  fn: async (t) => {
    using time = new FakeTime();

    await useUser(async (user) => {
      const bearerToken = user.bearerToken;
      const userId = user.id;

      let gameId = "";
      let pic1: string;
      let pic2: string;

      await t.step("create game", async () => {
        const res = await ac.createMatch({ name: "test", boardName: "A-1" });
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          "/matches",
          "post",
          "200",
          "application/json",
        ));
        if (update) {
          Deno.writeTextFileSync(
            "./v1/test/sample/createGame_sample.json",
            JSON.stringify(res.data, null, 2),
          );
        }
        const sample = createGameSample as typeof res.data;

        assert(v4.validate(res.data.id));
        gameId = res.data.id;
        res.data.id = sample.id = "";
        assertEquals(sample, res.data);
      });

      await t.step("match", async () => {
        const res = await ac.joinGameIdMatch(
          gameId,
          { spec: testSpec },
          `Bearer ${bearerToken}`,
        );
        if (res.success === false) {
          throw Error(
            "Response Error. ErrorCode:" + res.data.errorCode + " " +
              res.data.message,
          );
        }
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}/players",
          "post",
          "200",
          "application/json",
        ));
        pic1 = res.data.pic;

        const res2 = await ac.joinGameIdMatch(
          gameId,
          { spec: testSpec },
          `Bearer ${bearerToken}`,
        );
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}/players",
          "post",
          "200",
          "application/json",
        ));
        pic2 = res2.success ? res2.data.pic : "";
        if (update) {
          Deno.writeTextFileSync(
            "./v1/test/sample/match_sample.json",
            JSON.stringify(res.data, null, 2),
          );
        }

        const sample = matchSample;
        assert(v4.validate(res.data.gameId));
        sample.gameId = res.data.gameId = "";
        sample.userId = userId;
        sample.pic = res.data.pic;
        assertEquals(sample, res.data);
      });

      await t.step("get gameinfo", async () => {
        const res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}",
          "get",
          "200",
          "application/json",
        ));
        //console.log(JSON.stringify(res));
        if (update) {
          Deno.writeTextFileSync(
            "./v1/test/sample/matchGameInfo_sample.json",
            JSON.stringify(res.data, null, 2),
          );
        }

        const sample = matchGameInfoSample as typeof res.data;
        assert(v4.validate(res.data.id));
        sample.id = res.data.id = "";
        sample.players[0].id = res.data.players[0].id = "";
        sample.players[1].id = res.data.players[1].id = "";
        sample.startedAtUnixTime = res.data.startedAtUnixTime = 0;

        assertEquals(sample, res.data);
      });

      let nextTurnUnixTime: number;
      let operationSec: number;
      let transitionSec: number;

      await t.step("send action(Turn 1) Operation Step", async () => {
        let res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}",
          "get",
          "200",
          "application/json",
        ));

        let gameInfo = res.data;
        if (!gameInfo.startedAtUnixTime) {
          throw Error("startedAtUnixTime is null.");
        }
        nextTurnUnixTime = gameInfo.startedAtUnixTime;
        operationSec = gameInfo.operationSec;
        transitionSec = gameInfo.transitionSec;
        time.tick(diffTime(nextTurnUnixTime) + 100);
        // issue131:同ターンで複数アクションを送信時に送信したagentIDのみが反映されるかのテストを含む
        // 2回アクションを送信しているが、どちらもagentIDが違うため両方反映される。
        let actionRes = await ac.setAction(gameId, {
          actions: [{ agentId: 0, type: "PUT", x: 1, y: 1 }],
        }, pic1);
        assert(validator.validateResponse(
          actionRes.data,
          "/matches/{gameId}/actions",
          "patch",
          "200",
          "application/json",
        ));
        actionRes = await ac.setAction(gameId, {
          actions: [{ agentId: 1, type: "NONE" }],
        }, pic1);
        assert(validator.validateResponse(
          actionRes.data,
          "/matches/{gameId}/actions",
          "patch",
          "200",
          "application/json",
        ));
        //console.log(reqJson);

        res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}",
          "get",
          "200",
          "application/json",
        ));
        gameInfo = res.data;

        nextTurnUnixTime += operationSec;
        time.tick(diffTime(nextTurnUnixTime) + 100);
      });

      await t.step("invalid match(Turn 1) Transition Step", async () => {
        const res = await ac.getMatch(gameId);
        assert(res.success === false);
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}",
          "get",
          "400",
          "application/json",
        ));
        assertEquals(res.data, errors.DURING_TRANSITION_STEP);
      });
      await t.step("invalid action(Turn 1) Transition Step", async () => {
        const res = await ac.setAction(gameId, {
          actions: [{ agentId: 0, type: "PUT", x: 1, y: 1 }],
        }, pic1);
        assert(res.success === false);
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}/actions",
          "patch",
          "400",
          "application/json",
        ));
        assertEquals(res.data, errors.DURING_TRANSITION_STEP);

        nextTurnUnixTime += transitionSec;
        time.tick(diffTime(nextTurnUnixTime) + 100);
      });

      await t.step("check match(Turn 2) Operation Step", async () => {
        const res = await ac.getMatch(gameId);
        assert(res.success === true);
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}",
          "get",
          "200",
          "application/json",
        ));

        if (update) {
          Deno.writeTextFileSync(
            "./v1/test/sample/afterAction_sample.json",
            JSON.stringify(res.data, null, 2),
          );
        }

        //console.log(res);
        const sample = afterActionSample as typeof res.data;

        assert(v4.validate(res.data.id));
        sample.id = res.data.id = "";
        sample.players[0].id = res.data.players[0].id = "";
        sample.players[1].id = res.data.players[1].id = "";
        sample.startedAtUnixTime = res.data.startedAtUnixTime;

        assertEquals(sample, res.data);
      });

      await t.step("send action(Turn 2) Operation Step", async () => {
        const res = await ac.setAction(gameId, {
          actions: [{ agentId: 0, type: "PUT", x: 1, y: 2 }],
        }, pic2);
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}/actions",
          "patch",
          "200",
          "application/json",
        ));
        //console.log(reqJson);

        nextTurnUnixTime += operationSec;
        time.tick(diffTime(nextTurnUnixTime) + 100);
      });

      await t.step("invalid match(Turn 2) Transition Step", async () => {
        const res = await ac.getMatch(gameId);
        assert(res.success === false);
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}",
          "get",
          "400",
          "application/json",
        ));
        assertEquals(res.data, errors.DURING_TRANSITION_STEP);
      });
      await t.step("invalid action(Turn 2) Transition Step", async () => {
        const res = await ac.setAction(gameId, {
          actions: [{ agentId: 0, type: "PUT", x: 1, y: 1 }],
        }, pic1);
        assert(res.success === false);
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}/actions",
          "patch",
          "400",
          "application/json",
        ));
        assertEquals(res.data, errors.DURING_TRANSITION_STEP);

        nextTurnUnixTime += transitionSec;
        time.tick(diffTime(nextTurnUnixTime) + 100);
      });

      await t.step("check match(Turn 3) Operation Step", async () => {
        const res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          "/matches/{gameId}",
          "get",
          "200",
          "application/json",
        ));
        if (update) {
          Deno.writeTextFileSync(
            "./v1/test/sample/afterAction_sample2.json",
            JSON.stringify(res.data, null, 2),
          );
        }

        //console.log(res);
        const sample = afterActionSample2 as typeof res.data;

        assert(v4.validate(res.data.id));
        sample.id = res.data.id = "";
        sample.players[0].id = res.data.players[0].id = "";
        sample.players[1].id = res.data.players[1].id = "";
        sample.startedAtUnixTime = res.data.startedAtUnixTime;

        assertEquals(sample, res.data);
      });
    });
  },
});
