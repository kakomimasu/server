import { getAuth, signInWithEmailAndPassword } from "../../deps.ts";
import { assert, assertEquals } from "../../deps-test.ts";

import "../../core/firestore.ts";

import ApiClient, { MatchRes } from "../../client/client.ts";

const baseUrl = "http://localhost:8880/miyakonojo";

const ac = new ApiClient();
const auth = getAuth();
const u = await signInWithEmailAndPassword(
  auth,
  "client@example.com",
  "test-client",
);

const tempAction = { agentID: 0, dx: 0, dy: 0, type: "put" };

Deno.test({
  name: "miyakonojo API",
  fn: async (t) => {
    let token: string;
    const registedUser = await ac.usersRegist({
      screenName: "test",
      name: "test",
    }, await u.user.getIdToken());
    if (registedUser.success) token = registedUser.data.bearerToken;
    else {
      const registedUser = await ac.usersShow(
        "test",
        await u.user.getIdToken(),
      );
      if (!registedUser.success) throw Error("user get failed");
      token = registedUser.data.bearerToken ?? "";
    }

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

    let matchesRes: { turnMillis: number } | undefined;
    await t.step("/matches", async (t) => {
      await t.step("200 Success", async () => {
        const res = await fetch(baseUrl + "/matches", {
          headers: { "Authorization": token },
        });
        const json = await res.json();
        assertEquals(res.status, 200);
        // console.log(json);

        assert(Array.isArray(json));
        const match1 = json[0];
        assertEquals(typeof match1.id, "string");
        assertEquals(match1.intervalMillis, 0);
        assertEquals(typeof match1.matchTo, "string");
        assertEquals(typeof match1.teamID, "number");
        assertEquals(typeof match1.turnMillis, "number");
        assert(match1.turnMillis % 1000 === 0);
        assertEquals(typeof match1.turns, "number");
        assertEquals(typeof match1.index, "number");

        matchesRes = json.find((match) => match.teamID == pic) ?? undefined;
      });
      await t.step("401 Failure", async () => {
        const res = await fetch(baseUrl + "/matches", {
          headers: { "Authorization": "" },
        });
        const json = await res.json();
        // console.log(json);
        assertEquals(res.status, 401);
        assertEquals(json, {
          status: "InvalidToken",
        });
      });
    });

    await t.step("400 Failure (Invalid Matches)", async (t) => {
      await t.step("/matches/:id", async () => {
        const res = await fetch(baseUrl + "/matches/foo", {
          headers: { "Authorization": `${pic}` },
        });
        const json = await res.json();
        assertEquals(res.status, 400);
        assertEquals(json, {
          status: "InvalidMatches",
        });
      });
    });

    await t.step("401 Failure", async (t) => {
      await t.step("/matches/:id", async () => {
        const res = await fetch(baseUrl + `/matches/${matchRes.gameId}`, {
          headers: { "Authorization": "" },
        });
        const json = await res.json();
        assertEquals(res.status, 401);
        assertEquals(json, { status: "InvalidToken" });
      });
      await t.step("/matches/:id/action", async () => {
        const res = await fetch(
          baseUrl + `/matches/${matchRes.gameId}/action`,
          {
            method: "POST",
            headers: { "Authorization": "" },
            body: JSON.stringify([]),
          },
        );
        const json = await res.json();
        assertEquals(res.status, 401);
        assertEquals(json, { status: "InvalidToken" });
      });
    });

    await t.step(
      "400 Failure (Too Early) with no startAtUnixTime",
      async (t) => {
        await t.step(
          "/matches/:id/",
          async () => {
            const res = await fetch(baseUrl + `/matches/${matchRes.gameId}`, {
              headers: { "Authorization": `${pic}` },
            });
            const json = await res.json();
            // console.log(json);
            assertEquals(res.status, 400);
            assertEquals(json.status, "TooEarly");
            assert(json.startAtUnixTime === undefined);
          },
        );
        await t.step(
          "/matches/:id/action",
          async () => {
            const res = await fetch(
              baseUrl + `/matches/${matchRes.gameId}/action`,
              {
                method: "POST",
                headers: { "Authorization": `${pic}` },
                body: JSON.stringify([]),
              },
            );
            const json = await res.json();
            // console.log(json);
            assertEquals(res.status, 400);
            assertEquals(json.status, "TooEarly");
            assert(json.startAtUnixTime === undefined);
          },
        );
      },
    );

    await ac.match({ spec: "" }, `Bearer ${token}`);

    let startAtUnixTime = 0;
    await t.step("400 Failure (Too Early)", async (t) => {
      await t.step("/matches/:id", async () => {
        const res = await fetch(baseUrl + `/matches/${matchRes.gameId}`, {
          headers: { "Authorization": `${pic}` },
        });
        const json = await res.json();
        // console.log(json);
        assertEquals(res.status, 400);
        assertEquals(json.status, "TooEarly");
        assertEquals(typeof json.startAtUnixTime, "number");

        startAtUnixTime = json.startAtUnixTime;
      });
      await t.step("/matches/:id/action", async () => {
        const res = await fetch(
          baseUrl + `/matches/${matchRes.gameId}/action`,
          {
            method: "POST",
            headers: { "Authorization": `${pic}` },
            body: JSON.stringify([]),
          },
        );
        const json = await res.json();
        // console.log(json);
        assertEquals(res.status, 400);
        assertEquals(json.status, "TooEarly");
        assertEquals(typeof json.startAtUnixTime, "number");
      });
    });

    await sleep(diffTime(startAtUnixTime) + 500);

    await t.step("/matches/:id/action", async (t) => {
      await t.step("200 Success", async () => {
        const res = await fetch(
          baseUrl + `/matches/${matchRes.gameId}/action`,
          {
            method: "POST",
            headers: { "Authorization": `${pic}` },
            body: JSON.stringify([tempAction]),
          },
        );
        const json = await res.json();
        // assertEquals(res.status, 200);
        // console.log(json);

        assert(Array.isArray(json));
        assertEquals(json[0], { ...tempAction, turn: 1 });
      });
    });

    if (matchesRes) {
      await sleep(
        diffTime(startAtUnixTime + matchesRes.turnMillis / 1000) + 500,
      );
    }
    await t.step("/matches/:id", async (t) => {
      await t.step("200 Success", async () => {
        const res = await fetch(baseUrl + `/matches/${matchRes.gameId}`, {
          headers: { "Authorization": `${pic}` },
        });
        const json = await res.json();
        // console.log(json);
        assertEquals(res.status, 200);
        assert(Array.isArray(json.actions));
        assertEquals(json.actions[0], { ...tempAction, turn: 1, apply: 1 });

        assertEquals(typeof json.height, "number");
        assert(Array.isArray(json.points));
        assert(Array.isArray(json.points[0]));
        assertEquals(typeof json.points[0][0], "number");
        assertEquals(typeof json.startedAtUnixTime, "number");
        assert(Array.isArray(json.teams));
        const team = json.teams[0];
        assert(Array.isArray(team.agents));
        const agent = team.agents[0];
        assertEquals(typeof agent.agentID, "number");
        assertEquals(typeof agent.x, "number");
        assertEquals(typeof agent.y, "number");
        assertEquals(typeof team.areaPoint, "number");
        assertEquals(typeof team.teamID, "string");
        assertEquals(typeof team.tilePoint, "number");

        assert(Array.isArray(json.tiled));
        assert(Array.isArray(json.tiled[0]));
        assertEquals(typeof json.tiled[0][0], "number");
        assertEquals(typeof json.turn, "number");
        assertEquals(typeof json.width, "number");
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
