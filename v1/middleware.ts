import { Context } from "../deps.ts";
import { getSessionId } from "kv_oauth";

import { accounts } from "../core/datas.ts";
import { errorCodeResponse, errors, ServerError } from "../core/error.ts";

import { OakRequest2Request } from "./util.ts";

export const auth = (
  { bearer, cookie, required = true }: {
    bearer?: boolean;
    cookie?: boolean;
    required?: boolean;
  },
) =>
async (ctx: Context, next: () => Promise<unknown>) => { // AuthorizationヘッダやCookieヘッダからユーザIDを取得
  if (bearer) {
    const auth = ctx.request.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const bearerToken = auth.substring("Bearer ".length);
      const account = accounts.getUsers().find((u) =>
        u.bearerToken === bearerToken
      );
      if (account) {
        ctx.state.authed_userId = account.id;
        ctx.state.auth_method = "bearer";
        await next();
        return;
      }
    }
  }
  if (cookie) {
    // Cookieを使うための設定
    ctx.response.headers.set(
      "Access-Control-Allow-Origin",
      ctx.request.headers.get("Origin") ?? "",
    );
    ctx.response.headers.set("Access-Control-Allow-Credentials", "true");

    const request = OakRequest2Request(ctx);
    const sessionId = await getSessionId(request);

    // 認証済みユーザの取得
    if (sessionId) {
      const account = (await accounts.getUsers()).find((u) =>
        u.sessions.includes(sessionId)
      );
      if (account) {
        ctx.state.authed_userId = account.id;
        ctx.state.auth_method = "cookie";
        await next();
        return;
      }
    }
  }
  if (required) {
    const { body } = errorCodeResponse(
      new ServerError(errors.UNAUTHORIZED),
    );

    if (bearer) {
      ctx.response.headers.append(
        "WWW-Authenticate",
        `Bearer realm="token_required"`,
      );
    }
    ctx.response.status = 401;
    ctx.response.body = body;
  } else {
    await next();
  }
};
