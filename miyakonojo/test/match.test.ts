import { assert, assertEquals } from "../../deps-test.ts";

import { useUser } from "../../util/test/useUser.ts";

import ApiClient, { MatchRes } from "../../client/client.ts";

const baseUrl = "http://localhost:8880/miyakonojo";
const ac = new ApiClient();
const tempAction = { agentID: 0, dx: 0, dy: 0, type: "put" };

Deno.test({
  name: "miyakonojo API",
  fn: async (t) => {
    await useUser(async (user) => {
      const token = user.bearerToken;

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
        | { turnMillis: number; intervalMillis: number }
        | undefined;
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
          assert(match1.intervalMillis % 1000 === 0);
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
      if (!matchesRes) throw Error("matchesRes is undefined");

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
              headers: {
                "Authorization": "",
                "content-type": "application/json",
              },
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
                  headers: {
                    "Authorization": `${pic}`,
                    "content-type": "application/json",
                  },
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

      let nextUnixTime = 0;
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

          nextUnixTime = json.startAtUnixTime;
        });
        await t.step("/matches/:id/action", async () => {
          const res = await fetch(
            baseUrl + `/matches/${matchRes.gameId}/action`,
            {
              method: "POST",
              headers: {
                "Authorization": `${pic}`,
                "content-type": "application/json",
              },
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

      await sleep(diffTime(nextUnixTime) + 500);

      await t.step("/matches/:id/action 201 Success", async () => {
        const res = await fetch(
          baseUrl + `/matches/${matchRes.gameId}/action`,
          {
            method: "POST",
            headers: {
              "Authorization": `${pic}`,
              "content-type": "application/json",
            },
            body: JSON.stringify([tempAction]),
          },
        );
        const json = await res.json();
        assertEquals(res.status, 201);
        // console.log(json);

        assert(Array.isArray(json));
        assertEquals(json[0], { ...tempAction, turn: 1 });
      });

      nextUnixTime += matchesRes.turnMillis / 1000;
      await sleep(diffTime(nextUnixTime) + 500);

      await t.step("/matches/:id/action 400 UnacceptableTime", async () => {
        const res = await fetch(
          baseUrl + `/matches/${matchRes.gameId}/action`,
          {
            method: "POST",
            headers: {
              "Authorization": `${pic}`,
              "content-type": "application/json",
            },
            body: JSON.stringify([]),
          },
        );
        const json = await res.json();
        assertEquals(res.status, 400);
        assertEquals(json.status, "UnacceptableTime");
        assertEquals(typeof json.startAtUnixTime, "number");
      });

      nextUnixTime += matchesRes.intervalMillis / 1000;
      await sleep(diffTime(nextUnixTime) + 500);

      await t.step("201 Success", async () => {
        const res = await fetch(
          baseUrl + `/matches/${matchRes.gameId}/action`,
          {
            method: "POST",
            headers: {
              "Authorization": `${pic}`,
              "content-type": "application/json",
            },
            body: JSON.stringify([tempAction]),
          },
        );
        const json = await res.json();
        assertEquals(res.status, 201);

        assert(Array.isArray(json));
        assertEquals(json[0], { ...tempAction, turn: 2 });
      });

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
          assertEquals(typeof team.teamID, "number");
          assertEquals(typeof team.tilePoint, "number");

          assert(Array.isArray(json.tiled));
          assert(Array.isArray(json.tiled[0]));
          assertEquals(typeof json.tiled[0][0], "number");
          assertEquals(typeof json.turn, "number");
          assertEquals(typeof json.width, "number");
        });
      });
    });
  },
});

function sleep(msec: number) {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), msec));
}

function diffTime(unixTime: number) {
  const dt = unixTime * 1000 - new Date().getTime();
  return dt;
}
