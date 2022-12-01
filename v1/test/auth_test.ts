import { assert } from "../../deps-test.ts";

const bearerAuthRequiredUrlList = [
  `DELETE users/${crypto.randomUUID()}`,
];
const jwtAuthRequiredUrlList = [
  `POST users`,
];

// fetch all urls by no Authorization header
bearerAuthRequiredUrlList.forEach((url) => {
  const [method, path] = url.split(" ");
  Deno.test(`${url} nothing Authorization header`, async () => {
    const res = await fetch("http://localhost:8880/v1/" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    console.log(res);
    // console.log(res.headers);
    const wwwAuthentiate = res.headers.get("WWW-Authenticate");
    assert(wwwAuthentiate !== null);
    assert(wwwAuthentiate.includes(`Bearer realm="token_required`));
    await res.text();
  });
});

jwtAuthRequiredUrlList.forEach((url) => {
  const [method, path] = url.split(" ");
  Deno.test(`${url} nothing Authorization header`, async () => {
    const res = await fetch("http://localhost:8880/v1/" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    // console.log(res.headers);
    const wwwAuthentiate = res.headers.get("WWW-Authenticate");
    assert(wwwAuthentiate !== null);
    assert(wwwAuthentiate.includes(`JWT realm="token_required`));
    await res.text();
  });
});
