import { assertEquals } from "../../deps.ts";

import * as util from "../util.ts";
const resolve = util.pathResolver(import.meta);

const host = "http://localhost:8880";

Deno.test("fetch img ok", async () => {
  const path = "/img/kakomimasu-logo.png";
  //console.log(path);
  const res = await fetch(host + path);
  await res.arrayBuffer();
  //console.log("res", res);
  assertEquals(200, res.status);
});

// 存在しないファイルにアクセスした場合にはpages/layout.htmlを返す
Deno.test("fetch illegal failed", async () => {
  const path = "/img/.../img/kakomimasu-logo.png";
  //console.log(path);
  const res = await fetch(host + path);
  //console.log("res", res);
  const body = await res.text();
  //console.log(body);

  const html = Deno.readTextFileSync(resolve("../../pages/layout.html"));
  //console.log(html);

  assertEquals(body, html);
});

const methods = {
  "GET": true,
  "HEAD": false,
  "POST": true,
  "PUT": false,
  "DELETE": false,
  "CONNECT": false,
  "OPTIONS": false,
  "TRACE": false,
  "PATCH": false,
};

for (const [key, value] of Object.entries(methods)) {
  Deno.test(`cors header check(method:${key})`, async () => {
    const path = "/api/tournament/get";
    const res = await fetch(host + path, {
      method: "OPTIONS",
      headers: { "Origin": host, "Access-Control-Request-Method": key },
    });
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(
      res.headers.get("Access-Control-Allow-Methods"),
      value ? key : "",
    );
    assertEquals(res.headers.get("Access-Control-Allow-Headers"), null);
  });
}

Deno.test(`cors header check(header:authorization)`, async () => {
  const path = "/api/tournament/get";
  const res = await fetch(host + path, {
    method: "OPTIONS",
    headers: {
      "Origin": host,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "authorization",
    },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(res.headers.get("Access-Control-Allow-Methods"), "GET");
  assertEquals(
    res.headers.get("Access-Control-Allow-Headers"),
    "authorization",
  );
});
