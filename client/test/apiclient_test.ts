import { assertEquals } from "../../deps-test.ts";

import ApiClient from "../client.ts";

const urls = [
  { in: undefined, out: "http://localhost:8880" },
  { in: "http://localhost:8880", out: "http://localhost:8880" },
  { in: "http://localhost:8880/v1", out: "http://localhost:8880" },
  { in: "http://localhost:8880/abcde", out: "http://localhost:8880" },
  { in: "https://api.kakomimasu.com", out: "https://api.kakomimasu.com" },
  { in: "https://api.kakomimasu.com/v1", out: "https://api.kakomimasu.com" },
  {
    in: "https://api.kakomimasu.com/abcde",
    out: "https://api.kakomimasu.com",
  },
];

urls.forEach((url) => {
  Deno.test(`baseUrl with '${url.in}'`, () => {
    const acString = new ApiClient(url.in);
    if (url.in) {
      const acUrl = new ApiClient(new URL(url.in));
      assertEquals(acString.baseUrl, acUrl.baseUrl);
    }
    console.log(acString);
    assertEquals(acString.baseUrl.origin, url.out);
  });
});
