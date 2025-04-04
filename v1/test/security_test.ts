import { assertEquals } from "@std/assert";

import { app } from "../../server.ts";

// 存在しないファイルにアクセスした場合には404を返す
Deno.test("request illegal failed", async () => {
  const path = "/img/.../img/kakomimasu-logo.png";
  const res = await app.request(path);
  //console.log("res", res);
  await res.text();

  assertEquals(res.status, 400);
});

const methods = {
  "GET": true,
  "HEAD": false,
  "POST": true,
  "PUT": false,
  "DELETE": true,
  "CONNECT": false,
  "OPTIONS": false,
  "TRACE": false,
  "PATCH": true,
};

for (const [key, _value] of Object.entries(methods)) {
  Deno.test(`cors header check(method:${key})`, async () => {
    const path = "/v1/tournament/get";
    const res = await app.request(path, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://localhost:8880",
        "Access-Control-Request-Method": key,
      },
    });
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(
      res.headers.get("Access-Control-Allow-Methods"),
      "GET,POST,DELETE,PATCH",
    );
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), null);
  });
}

Deno.test(`cors header check(header:authorization)`, async () => {
  const path = "/v1/tournament/get";
  const res = await app.request(path, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://localhost:8880",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "authorization",
    },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(
    res.headers.get("Access-Control-Allow-Methods"),
    "GET,POST,DELETE,PATCH",
  );
  assertEquals(
    res.headers.get("Access-Control-Allow-Headers"),
    "authorization",
  );
});

Deno.test(`cors header check(header:content-type)`, async () => {
  const path = "/v1/tournament/get";
  const res = await app.request(path, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://localhost:8880",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(
    res.headers.get("Access-Control-Allow-Methods"),
    "GET,POST,DELETE,PATCH",
  );
  assertEquals(
    res.headers.get("Access-Control-Allow-Headers"),
    "content-type",
  );
});
