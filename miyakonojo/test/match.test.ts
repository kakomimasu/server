import { assert, assertEquals } from "@std/assert";

import { useUser } from "../../util/test/useUser.ts";

import ApiClient, { JoinFreeMatchRes } from "../../client/client.ts";

import { validator } from "../parts/openapi.ts";

import { app } from "../../server.ts";

const baseUrl = "/miyakonojo";
const ac = new ApiClient();
const tempAction = { agentID: 0, dx: 0, dy: 0, type: "put" };

Deno.test({
  name: "miyakonojo API",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async (t) => {
    await useUser(async (user) => {
      const token = user.bearerToken;

      let matchRes: JoinFreeMatchRes;
      while (true) {
        const res = await ac.joinFreeMatch(
          { spec: "" },
          `Bearer ${token}`,
        );
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
          const res = await app.request(baseUrl + "/matches", {
            headers: { "Authorization": token },
          });
          const json = await res.json();
          assertEquals(res.status, 200);
          assert(
            validator.validateResponse(
              json,
              "/matches",
              "get",
              "200",
              "application/json",
            ),
          );
          // console.log(json);

          const match1 = json[0];
          assert(match1.intervalMillis % 1000 === 0);
          assert(match1.turnMillis % 1000 === 0);

          matchesRes = json.find((match) => match.teamID == parseInt(pic)) ??
            undefined;
        });
        await t.step("401 Failure", async () => {
          const res = await app.request(baseUrl + "/matches", {
            headers: { "Authorization": "" },
          });
          const json = await res.json();
          // console.log(json);
          assertEquals(res.status, 401);
          assert(validator.validateResponse(
            json,
            "/matches",
            "get",
            "401",
            "application/json",
          ));
        });
      });
      if (!matchesRes) throw Error("matchesRes is undefined");

      await t.step("400 Failure (Invalid Matches)", async (t) => {
        await t.step("/matches/:id", async () => {
          const res = await app.request(baseUrl + "/matches/foo", {
            headers: { "Authorization": `${pic}` },
          });
          const json = await res.json();
          assertEquals(res.status, 400);
          assert(validator.validateResponse(
            json,
            "/matches/{id}",
            "get",
            "400",
            "application/json",
          ));
          assertEquals(json, {
            status: "InvalidMatches",
          });
        });
      });

      await t.step("401 Failure", async (t) => {
        await t.step("/matches/:id", async () => {
          const res = await app.request(
            baseUrl + `/matches/${matchRes.gameId}`,
            {
              headers: { "Authorization": "" },
            },
          );
          const json = await res.json();
          assertEquals(res.status, 401);
          assert(validator.validateResponse(
            json,
            "/matches/{id}",
            "get",
            "401",
            "application/json",
          ));
          assertEquals(json, { status: "InvalidToken" });
        });
        await t.step("/matches/:id/action", async () => {
          const res = await app.request(
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
          assert(validator.validateResponse(
            json,
            "/matches/{id}/action",
            "post",
            "401",
            "application/json",
          ));
        });
      });

      await t.step(
        "400 Failure (Too Early) with no startAtUnixTime",
        async (t) => {
          await t.step(
            "/matches/:id/",
            async () => {
              const res = await app.request(
                baseUrl + `/matches/${matchRes.gameId}`,
                {
                  headers: { "Authorization": `${pic}` },
                },
              );
              const json = await res.json();
              // console.log(json);
              assertEquals(res.status, 400);
              assert(validator.validateResponse(
                json,
                "/matches/{id}/action",
                "post",
                "400",
                "application/json",
              ));
              assertEquals(json.status, "TooEarly");
              assert(json.startAtUnixTime === undefined);
            },
          );
          await t.step(
            "/matches/:id/action",
            async () => {
              const res = await app.request(
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
              assert(validator.validateResponse(
                json,
                "/matches/{id}/action",
                "post",
                "400",
                "application/json",
              ));
              assertEquals(json.status, "TooEarly");
              assert(json.startAtUnixTime === undefined);
            },
          );
        },
      );

      await ac.joinFreeMatch({ spec: "" }, `Bearer ${token}`);

      let nextUnixTime = 0;
      await t.step("400 Failure (Too Early)", async (t) => {
        await t.step("/matches/:id", async () => {
          const res = await app.request(
            baseUrl + `/matches/${matchRes.gameId}`,
            {
              headers: { "Authorization": `${pic}` },
            },
          );
          const json = await res.json();
          // console.log(json);
          assertEquals(res.status, 400);
          assert(validator.validateResponse(
            json,
            "/matches/{id}",
            "get",
            "400",
            "application/json",
          ));
          assertEquals(json.status, "TooEarly");
          assert(typeof json.startAtUnixTime === "number");

          nextUnixTime = json.startAtUnixTime;
        });
        await t.step("/matches/:id/action", async () => {
          const res = await app.request(
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
          assert(validator.validateResponse(
            json,
            "/matches/{id}/action",
            "post",
            "400",
            "application/json",
          ));
          assertEquals(json.status, "TooEarly");
          assertEquals(typeof json.startAtUnixTime, "number");
        });
      });

      await sleep(diffTime(nextUnixTime) + 500);

      await t.step("/matches/:id/action 201 Success", async () => {
        const res = await app.request(
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
        assert(validator.validateResponse(
          json,
          "/matches/{id}/action",
          "post",
          "201",
          "application/json",
        ));
        // console.log(json);

        assertEquals(json.actions[0], { ...tempAction, turn: 1 });
      });

      nextUnixTime += matchesRes.turnMillis / 1000;
      await sleep(diffTime(nextUnixTime) + 500);

      await t.step("/matches/:id/action 400 UnacceptableTime", async () => {
        const res = await app.request(
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
        assert(validator.validateResponse(
          json,
          "/matches/{id}/action",
          "post",
          "400",
          "application/json",
        ));
        assertEquals(json.status, "UnacceptableTime");
        assertEquals(typeof json.startAtUnixTime, "number");
      });

      nextUnixTime += matchesRes.intervalMillis / 1000;
      await sleep(diffTime(nextUnixTime) + 500);

      await t.step("201 Success", async () => {
        const res = await app.request(
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
        assert(validator.validateResponse(
          json,
          "/matches/{id}/action",
          "post",
          "201",
          "application/json",
        ));
        assertEquals(json.actions[0], { ...tempAction, turn: 2 });
      });

      await t.step("/matches/:id", async (t) => {
        await t.step("200 Success", async () => {
          const res = await app.request(
            baseUrl + `/matches/${matchRes.gameId}`,
            {
              headers: { "Authorization": `${pic}` },
            },
          );
          const json = await res.json();
          // console.log(json);
          assertEquals(res.status, 200);
          assert(validator.validateResponse(
            json,
            "/matches/{id}",
            "get",
            "200",
            "application/json",
          ));
          assertEquals(json.actions[0], { ...tempAction, turn: 1, apply: 1 });
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
