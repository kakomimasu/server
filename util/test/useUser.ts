import { assert } from "@std/assert";

import { randomUUID } from "../../core/util.ts";
import { env } from "../../core/env.ts";

import { AuthedUser } from "../../client/client.ts";

export async function useUser(
  runFn: (user: AuthedUser, sessionId: string) => Promise<void>,
) {
  assert(env.TEST.toLowerCase() === "true", "API is not TEST mode.");

  // 新規囲みマス ユーザ作成
  const sessionId = randomUUID();
  const forDeleteSessionId = `forDelete-${randomUUID()}`;
  const user = {
    screenName: "John Doe",
    name: randomUUID(),
    id: randomUUID(),
    avaterUrl: "https://example.com",
    gameIds: [],
    sessions: [sessionId, forDeleteSessionId],
  };
  const res = await fetch("http://localhost:8880/v1/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  assert(res.ok);
  const resUser = await res.json();

  try {
    await runFn(resUser, sessionId);
  } catch (e) {
    throw e;
  } finally {
    // テスト成功時も失敗時もユーザ削除
    // clientを使わないのはCookieで削除したいため
    const res = await fetch("http://localhost:8880/v1/users/me", {
      method: "DELETE",
      headers: {
        Cookie: `site-session=${forDeleteSessionId}`,
        "Content-Type": "application/json",
      },
    });
    await res.text();
  }
}
