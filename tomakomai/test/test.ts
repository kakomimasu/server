import { createUserWithEmailAndPassword, getAuth } from "../../deps.ts";
import { assert, assertEquals, v4 } from "../../deps-test.ts";

import "../../core/firestore.ts";
import { nowUnixTime } from "../../core/util.ts";

import ApiClient, { MatchRes } from "../../client/client.ts";

const baseUrl = "http://localhost:8880/tomakomai";

const ac = new ApiClient();
const auth = getAuth();
const u = await createUserWithEmailAndPassword(
  auth,
  `${crypto.randomUUID()}@example.com`,
  "test-client",
);

const tempAction = { agentID: 0, x: 0, y: 0, type: "put" };

Deno.test({
  name: "tomakomai API",
  fn: async (t) => {
    const registedUser = await ac.usersRegist({
      screenName: "test",
      name: crypto.randomUUID(),
    }, await u.user.getIdToken());
    if (registedUser.success === false) throw Error("user regist failed");
    const token = registedUser.data.bearerToken;
    const userId = registedUser.data.id;

    let matchRes: MatchRes;
    while (true) {
      const res = await ac.match({ spec: "" }, `Bearer ${token}`);
      if (res.success === false) {
        throw Error(
          "Response Error. ErrorCode:" + res.data.errorCode + " " +
            res.data.message,
        );
      }
      if (res.data.index === 0) {
        matchRes = res.data;
        break;
      }
    }
    const pic = matchRes.pic;

    let matchesRes:
      | { operationMillis: number; transitionMillis: number }
      | undefined;
    await t.step("/matches", async (t) => {
      await t.step("200 Success", async () => {
        const res = await fetch(baseUrl + "/matches", {
          headers: { "x-api-token": token },
        });
        const json = await res.json();
        console.log(pic, json);
        assertEquals(res.status, 200);
        checkXRequestId(res);

        assert(Array.isArray(json));
        const match1 = json[0];
        assertEquals(typeof match1.matchID, "string");
        assertEquals(typeof match1.turns, "number");
        assert(match1.operationMillis % 1000 === 0);
        assert(match1.transitionMillis % 1000 === 0);
        assert(Array.isArray(match1.teams));
        const team = match1.teams[0];
        assertEquals(typeof team.teamID, "number");
        assert(team.teamID !== 0); // picがきちんと設定されているか
        assertEquals(typeof team.name, "string");

        matchesRes = json.find((match) => match.teams[0].teamID == pic) ??
          undefined;
      });
      await t.step("401 Failure", async () => {
        const res = await fetch(baseUrl + "/matches", {
          headers: { "x-api-token": "" },
        });
        await res.text();
        assertEquals(res.status, 401);
      });
    });
    if (!matchesRes) throw Error("matchesRes is undefined");

    await t.step("404 Failure (Invalid Matches)", async (t) => {
      await t.step("/matches/:id", async () => {
        const res = await fetch(baseUrl + "/matches/foo", {
          headers: { "x-api-token": `${pic}` },
        });
        await res.text();
        checkXRequestId(res);
        assertEquals(res.status, 404);
      });
      await t.step("/matches/:id/action", async () => {
        const res = await fetch(
          baseUrl + `/matches/foo/action`,
          {
            method: "POST",
            headers: {
              "x-api-token": `${pic}`,
              "content-type": "application/json",
            },
            body: JSON.stringify([]),
          },
        );
        await res.text();
        checkXRequestId(res);
        assertEquals(res.status, 404);
      });
    });

    await t.step("401 Failure", async (t) => {
      await t.step("/matches/:id", async () => {
        const res = await fetch(baseUrl + `/matches/${matchRes.gameId}`, {
          headers: { "x-api-token": "" },
        });
        await res.text();
        assertEquals(res.status, 401);
      });
      await t.step("/matches/:id/action", async () => {
        const res = await fetch(
          baseUrl + `/matches/${matchRes.gameId}/action`,
          {
            method: "POST",
            headers: {
              "x-api-token": "",
              "content-type": "application/json",
            },
            body: JSON.stringify([]),
          },
        );
        await res.text();
        assertEquals(res.status, 401);
      });
    });

    await t.step(
      "425 Failure (Too Early) with no startAtUnixTime",
      async (t) => {
        await t.step(
          "/matches/:id/",
          async () => {
            const res = await fetch(baseUrl + `/matches/${matchRes.gameId}`, {
              headers: { "x-api-token": `${pic}` },
            });
            await res.text();
            checkXRequestId(res);
            assertEquals(res.status, 425);
            assertEquals(res.headers.get("retry-after"), "0");
          },
        );
        await t.step(
          "/matches/:id/action",
          async () => {
            const res = await fetch(
              baseUrl + `/matches/${matchRes.gameId}/action`,
              {
                method: "POST",
                headers: {
                  "x-api-token": `${pic}`,
                  "content-type": "application/json",
                },
                body: JSON.stringify([]),
              },
            );
            await res.text();
            checkXRequestId(res);
            assertEquals(res.status, 425);
            assertEquals(res.headers.get("retry-after"), "0");
          },
        );
      },
    );

    await ac.match({ spec: "" }, `Bearer ${token}`);

    let nextUnixTime = 0;
    await t.step("425 Failure (Too Early)", async (t) => {
      await t.step("/matches/:id", async () => {
        const res = await fetch(baseUrl + `/matches/${matchRes.gameId}`, {
          headers: { "x-api-token": `${pic}` },
        });
        await res.text();
        checkXRequestId(res);
        assertEquals(res.status, 425);
        const retryAfter = res.headers.get("retry-after");
        assert(retryAfter !== null);
        assert(retryAfter !== "0");

        nextUnixTime = nowUnixTime() + parseInt(retryAfter);
      });
      await t.step("/matches/:id/action", async () => {
        const res = await fetch(
          baseUrl + `/matches/${matchRes.gameId}/action`,
          {
            method: "POST",
            headers: {
              "x-api-token": `${pic}`,
              "content-type": "application/json",
            },
            body: JSON.stringify([]),
          },
        );
        await res.text();
        checkXRequestId(res);
        assertEquals(res.status, 425);
        const retryAfter = res.headers.get("retry-after");
        assert(retryAfter !== null);
        assert(retryAfter !== "0");
      });
    });

    await sleep(diffTime(nextUnixTime) + 500);

    await t.step("/matches/:id/action 202 Success", async () => {
      const res = await fetch(
        baseUrl + `/matches/${matchRes.gameId}/action`,
        {
          method: "POST",
          headers: {
            "x-api-token": `${pic}`,
            "content-type": "application/json",
          },
          body: JSON.stringify([tempAction]),
        },
      );
      checkXRequestId(res);
      const json = await res.json();
      assertEquals(res.status, 202);
      // console.log(json);

      assert(Array.isArray(json));
      assertEquals(json[0], { ...tempAction, turn: 1 });
    });

    nextUnixTime += matchesRes.operationMillis / 1000;
    await sleep(diffTime(nextUnixTime) + 500);

    await t.step("/matches/:id/action 400 UnacceptableTime", async () => {
      const res = await fetch(
        baseUrl + `/matches/${matchRes.gameId}/action`,
        {
          method: "POST",
          headers: {
            "x-api-token": `${pic}`,
            "content-type": "application/json",
          },
          body: JSON.stringify([]),
        },
      );
      await res.text();
      assertEquals(res.status, 400);
    });

    nextUnixTime += matchesRes.transitionMillis / 1000;
    await sleep(diffTime(nextUnixTime) + 500);

    await t.step("202 Success", async () => {
      const res = await fetch(
        baseUrl + `/matches/${matchRes.gameId}/action`,
        {
          method: "POST",
          headers: {
            "x-api-token": `${pic}`,
            "content-type": "application/json",
          },
          body: JSON.stringify([tempAction]),
        },
      );
      checkXRequestId(res);
      const json = await res.json();
      assertEquals(res.status, 202);

      assert(Array.isArray(json));
      assertEquals(json[0], { ...tempAction, turn: 2 });
    });

    await t.step("/matches/:id", async (t) => {
      await t.step("200 Success", async () => {
        const res = await fetch(baseUrl + `/matches/${matchRes.gameId}`, {
          headers: { "x-api-token": `${pic}` },
        });
        checkXRequestId(res);
        const json = await res.json();
        // console.log(json);
        assertEquals(res.status, 200);

        assertEquals(typeof json.turn, "number");
        assertEquals(typeof json.startedAtUnixTime, "number");
        assertEquals(typeof json.width, "number");
        assertEquals(typeof json.height, "number");
        assert(Array.isArray(json.teams));
        const team = json.teams[0];
        assertEquals(typeof team.teamID, "number");
        assertEquals(typeof team.agent, "number");
        assert(Array.isArray(team.agents));
        const agent = team.agents[0];
        assertEquals(typeof agent.agentID, "number");
        assertEquals(typeof agent.x, "number");
        assertEquals(typeof agent.y, "number");
        assertEquals(typeof team.areaPoint, "number");
        assertEquals(typeof team.wallPoint, "number");

        assert(Array.isArray(json.walls));
        assert(Array.isArray(json.walls[0]));
        assertEquals(typeof json.walls[0][0], "number");

        assert(Array.isArray(json.areas));
        assert(Array.isArray(json.areas[0]));
        assertEquals(typeof json.areas[0][0], "number");

        assert(Array.isArray(json.points));
        assert(Array.isArray(json.points[0]));
        assertEquals(typeof json.points[0][0], "number");

        assert(Array.isArray(json.actions));
        assertEquals(json.actions[0], { ...tempAction, turn: 1, apply: 1 });
      });
    });

    await t.step("/teams/me", async (t) => {
      await t.step("200 Success", async () => {
        const res = await fetch(baseUrl + `/teams/me`, {
          headers: { "x-api-token": `${token}` },
        });
        checkXRequestId(res);
        const json = await res.json();
        assertEquals(res.status, 200);
        // console.log(json);

        assertEquals(json.teamID, 0);
        assertEquals(typeof json.name, "string");
      });
      await t.step("401 Failure", async () => {
        const res = await fetch(baseUrl + `/teams/me`, {
          headers: { "x-api-token": "" },
        });
        await res.text();
        assertEquals(res.status, 401);
      });
    });

    await t.step("/teams/:teamID/matches", async (t) => {
      await t.step("200 Success", async () => {
        const res = await fetch(baseUrl + `/teams/${userId}/matches`, {
          headers: { "x-api-token": `${token}` },
        });
        checkXRequestId(res);
        const json = await res.json();
        assertEquals(res.status, 200);
        // console.log(json);

        assert(Array.isArray(json));
        const match1 = json[0];
        assertEquals(typeof match1.matchID, "string");
        assertEquals(typeof match1.turns, "number");
        assert(match1.operationMillis % 1000 === 0);
        assert(match1.transitionMillis % 1000 === 0);
        assert(Array.isArray(match1.teams));
        const team = match1.teams[0];
        assertEquals(typeof team.teamID, "number");
        assert(team.teamID !== 0); // picがきちんと設定されているか
        assertEquals(typeof team.name, "string");
      });
      await t.step("401 Failure", async () => {
        const res = await fetch(baseUrl + `/teams/${userId}/matches`, {
          headers: { "x-api-token": "" },
        });
        await res.text();
        assertEquals(res.status, 401);
      });
      await t.step("403 Failure", async () => {
        const res = await fetch(baseUrl + `/teams/foo/matches`, {
          headers: { "x-api-token": `${token}` },
        });
        await res.text();
        assertEquals(res.status, 403);
      });
    });

    await ac.usersDelete({}, `Bearer ${token}`);
  },
});

function sleep(msec: number) {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), msec));
}

function diffTime(unixTime: number) {
  const dt = unixTime * 1000 - new Date().getTime();
  return dt;
}

function checkXRequestId(res: Response) {
  const xRequestId = res.headers.get("x-request-id");
  assert(xRequestId !== null);
  assert(v4.validate(xRequestId));
}
