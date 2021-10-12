import { assertEquals } from "../../deps.ts";

const host = "http://localhost:8880";

// 存在しないファイルにアクセスした場合には404を返す
Deno.test("fetch illegal failed", async () => {
  const path = "/img/.../img/kakomimasu-logo.png";
  const res = await fetch(host + path);
  //console.log("res", res);
  await res.text();

  assertEquals(res.status, 404);
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
    const path = "/v1/tournament/get";
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
  const path = "/v1/tournament/get";
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

Deno.test(`cors header check(header:content-type)`, async () => {
  const path = "/v1/tournament/get";
  const res = await fetch(host + path, {
    method: "OPTIONS",
    headers: {
      "Origin": host,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(res.headers.get("Access-Control-Allow-Methods"), "POST");
  assertEquals(
    res.headers.get("Access-Control-Allow-Headers"),
    "content-type",
  );
});
