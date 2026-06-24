import { Hono } from "@hono/hono";
import {
  getSessionId,
  handleCallback,
  signIn,
  signOut,
} from "./parts/oauth_helpers.ts";
import { Octokit as OctokitRest } from "@octokit/rest";

import { errors, ServerError } from "../core/error.ts";
import { accounts, User } from "../core/datas.ts";

export async function getAuthenticatedUser(
  accessToken: string,
) {
  const octokitRest = new OctokitRest({ auth: accessToken });
  try {
    const res = await octokitRest.request("GET /user");
    return res.data;
  } catch (_e: unknown) {
    throw new ServerError(errors.UNAUTHORIZED);
  }
}

const router = new Hono();

// ユーザ登録
router
  .get("/signin", async (context) => {
    return await signIn(context);
  })
  .get("/callback", async (context) => {
    const { response, accessToken, sessionId } = await handleCallback(context);

    const ghUser = await getAuthenticatedUser(accessToken);
    const ghUserId = ghUser.id.toString();
    const ghUserName = ghUser.name ?? "";

    const user = accounts.findById(ghUserId);
    if (user === undefined) {
      // ユーザ登録
      const user = User.create({
        name: ghUser.login,
        screenName: ghUserName,
        id: ghUserId,
        avaterUrl: ghUser.avatar_url,
        sessions: [sessionId],
      });

      accounts.getUsers().push(user);
    } else {
      // ユーザデータの更新とセッション情報を追加
      user.name = ghUser.login;
      user.screenName = ghUserName;
      user.avaterUrl = ghUser.avatar_url;
      user.sessions.push(sessionId);
    }
    accounts.save();

    return response;
  })
  .get("/signout", async (context) => {
    const sessionId = await getSessionId(context);
    if (!sessionId) {
      throw new ServerError(errors.UNAUTHORIZED);
    }
    // ユーザデータからセッションを削除
    accounts.getUsers().forEach((user) => {
      if (user.sessions.includes(sessionId)) {
        user.sessions.splice(user.sessions.indexOf(sessionId), 1);
      }
    });
    await accounts.save();
    return await signOut(context);
  });
export default router;
