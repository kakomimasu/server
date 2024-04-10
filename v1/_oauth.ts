import { Router } from "../deps.ts";
import {
  createGitHubOAuthConfig,
  getSessionId,
  handleCallback,
  signIn,
  signOut,
} from "kv_oauth";
import { Octokit as OctokitRest } from "npm:@octokit/rest@20.0.1";

import { wrapOakRequest } from "./util.ts";
import { errors, ServerError } from "../core/error.ts";
import { accounts, User } from "../core/datas.ts";

const oauth2Client = createGitHubOAuthConfig();

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

export const authRouter = () => {
  const router = new Router();

  // ユーザ登録
  router
    .get("/signin", async (context) => {
      await wrapOakRequest(context, async (request) => {
        return await signIn(request, oauth2Client);
      });
    })
    .get("/callback", async (context) => {
      await wrapOakRequest(context, async (request) => {
        const { response, tokens, sessionId } = await handleCallback(
          request,
          oauth2Client,
        );

        const ghUser = await getAuthenticatedUser(tokens.accessToken);
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
      });
    })
    .get("/signout", async (context) => {
      return await wrapOakRequest(context, async (request) => {
        const sessionId = await getSessionId(request);
        if (!sessionId) {
          throw new ServerError(errors.UNAUTHORIZED);
        }
        // ユーザデータからセッションを削除
        accounts.getUsers().forEach((user) => {
          if (user.sessions.includes(sessionId)) {
            user.sessions.splice(user.sessions.indexOf(sessionId), 1);
          }
        });
        accounts.save();
        return await signOut(request);
      });
    });
  return router.routes();
};
