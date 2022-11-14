import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { useUser } from "../../util/test/useUser.ts";

import ApiClient from "../../client/client.ts";
import { diffTime, sleep } from "./client_util.ts";

import { validator } from "../parts/openapi.ts";

import matchSample from "./sample/match_sample.json" assert { type: "json" };
import matchGameInfoSample from "./sample/matchGameInfo_sample.json" assert {
  type: "json",
};
import afterActionSample from "./sample/afterAction_sample.json" assert {
  type: "json",
};
import afterActionSample2 from "./sample/afterAction_sample2.json" assert {
  type: "json",
};

const ac = new ApiClient();

const testSpec = "test";

Deno.test({
  name: "freeMatch flow test",
  fn: async (t) => {
    await useUser(async (user) => {
      const bearerToken = user.bearerToken;
      const userId = user.id;

      let gameId = "";
      let pic1: string;
      let pic2: string;

      await t.step("match", async () => {
        let res1;
        while (true) {
          res1 = await ac.match({ spec: testSpec }, `Bearer ${bearerToken}`);
          if (res1.success === false) {
            throw Error(
              "Response Error. ErrorCode:" + res1.data.errorCode + " " +
                res1.data.message,
            );
          }
          pic1 = res1.data.pic;
          if (res1.data.index === 0) break;
        }

        const res2 = await ac.match(
          { spec: testSpec },
          `Bearer ${bearerToken}`,
        );
        assert(validator.validateResponse(
          res2.data,
          {
            path: "/match",
            method: "post",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        // Deno.writeTextFileSync(
        //   "./v1/test/sample/match_sample.json",
        //   JSON.stringify(res1.data, null, 2),
        // );
        pic2 = res2.success ? res2.data.pic : "";

        const sample = matchSample;
        assert(v4.validate(res1.data.gameId));
        gameId = res1.data.gameId;
        sample.gameId = res1.data.gameId = "";
        sample.userId = userId;
        sample.pic = res1.data.pic;
        assertEquals(sample, res1.data);
      });

      await t.step("get gameinfo", async () => {
        // console.log(gameId);
        const res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          {
            path: "/match/:gameId",
            method: "get",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        //console.log(JSON.stringify(res));
        // Deno.writeTextFileSync(
        //   "./v1/test/sample/matchGameInfo_sample.json",
        //   JSON.stringify(res.data, null, 2),
        // );

        const sample = matchGameInfoSample as typeof res.data;
        assert(v4.validate(res.data.id));
        sample.id = res.data.id = "";
        sample.players[0].id = res.data.players[0].id = "";
        sample.players[1].id = res.data.players[1].id = "";
        sample.startedAtUnixTime = res.data.startedAtUnixTime = 0;
        assertEquals(res.data.type, "normal");
        sample.type = res.data.type;
        assertEquals(res.data.name, undefined);
        delete sample.name;

        assertEquals(sample, res.data);
      });

      let nextTurnUnixTime: number;

      await t.step("send action(Turn 1)", async () => {
        let res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          {
            path: "/match/:gameId",
            method: "get",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        let gameInfo = res.data;
        if (!gameInfo.startedAtUnixTime) {
          throw Error("startedAtUnixTime is null.");
        }
        nextTurnUnixTime = gameInfo.startedAtUnixTime;
        await sleep(diffTime(nextTurnUnixTime) + 100);
        // issue131:同ターンで複数アクションを送信時に送信したagentIDのみが反映されるかのテストを含む
        // 2回アクションを送信しているが、どちらもagentIDが違うため両方反映される。
        let actionRes = await ac.setAction(gameId, {
          actions: [{ agentId: 0, type: "PUT", x: 1, y: 1 }],
        }, pic1);
        assert(validator.validateResponse(
          actionRes.data,
          {
            path: "/match/:gameId/action",
            method: "post",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        actionRes = await ac.setAction(gameId, {
          actions: [{ agentId: 1, type: "NONE", x: 1, y: 2 }],
        }, pic1);
        assert(validator.validateResponse(
          actionRes.data,
          {
            path: "/match/:gameId/action",
            method: "post",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        //console.log(reqJson);

        res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          {
            path: "/match/:gameId",
            method: "get",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        gameInfo = res.data;

        nextTurnUnixTime += gameInfo.operationSec + gameInfo.transitionSec;
        await sleep(diffTime(nextTurnUnixTime) + 100);
        res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          {
            path: "/match/:gameId",
            method: "get",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        // Deno.writeTextFileSync(
        //   "./v1/test/sample/afterAction_sample.json",
        //   JSON.stringify(res.data, null, 2),
        // );

        //console.log(res);
        //console.log(JSON.stringify(reqJson, null, 2));
        const sample = afterActionSample as typeof res.data;

        assert(v4.validate(res.data.id));
        sample.id = res.data.id = "";
        sample.players[0].id = res.data.players[0].id = "";
        sample.players[1].id = res.data.players[1].id = "";
        sample.startedAtUnixTime = res.data.startedAtUnixTime;
        assertEquals(res.data.type, "normal");
        sample.type = res.data.type;
        assertEquals(res.data.name, undefined);
        delete sample.name;

        assertEquals(sample, res.data);
      });
      await t.step("send action(Turn 2)", async () => {
        let res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          {
            path: "/match/:gameId",
            method: "get",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        const gameInfo = res.data;

        const actionRes = await ac.setAction(gameId, {
          actions: [{ agentId: 0, type: "PUT", x: 1, y: 2 }],
        }, pic2);
        assert(validator.validateResponse(
          actionRes.data,
          {
            path: "/match/:gameId/action",
            method: "post",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        //console.log(reqJson);

        nextTurnUnixTime += gameInfo.operationSec + gameInfo.transitionSec;
        await sleep(diffTime(nextTurnUnixTime) + 100);
        res = await ac.getMatch(gameId);
        if (res.success === false) {
          throw Error("Response Error. ErrorCode:" + res.data.errorCode);
        }
        assert(validator.validateResponse(
          res.data,
          {
            path: "/match/:gameId",
            method: "get",
            statusCode: 200,
            contentType: "application/json",
          },
        ));
        // Deno.writeTextFileSync(
        //   "./v1/test/sample/afterAction_sample2.json",
        //   JSON.stringify(res.data),
        // );

        //console.log(res);
        //console.log(JSON.stringify(reqJson, null, 2));
        const sample = afterActionSample2 as typeof res.data;

        assert(v4.validate(res.data.id));
        sample.id = res.data.id = "";
        sample.players[0].id = res.data.players[0].id = "";
        sample.players[1].id = res.data.players[1].id = "";
        sample.startedAtUnixTime = res.data.startedAtUnixTime;
        assertEquals(res.data.type, "normal");
        sample.type = res.data.type;
        assertEquals(res.data.name, undefined);
        delete sample.name;

        assertEquals(sample, res.data);
      });
    });
  },
});
