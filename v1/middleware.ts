import { createMiddleware } from "hono/factory";
import { getSessionId } from "kv_oauth";

import { accounts } from "../core/datas.ts";
import { errorCodeResponse, errors, ServerError } from "../core/error.ts";

export const auth = (
  { bearer, cookie, required = true }: {
    bearer?: boolean;
    cookie?: boolean;
    required?: boolean;
  },
) =>
  createMiddleware<
    { Variables: { authed_userId: string; auth_method: "bearer" | "cookie" } }
  >(async (ctx, next) => { // AuthorizationヘッダやCookieヘッダからユーザIDを取得
    if (bearer) {
      const auth = ctx.req.header("Authorization");
      if (auth?.startsWith("Bearer ")) {
        const bearerToken = auth.substring("Bearer ".length);
        const account = accounts.getUsers().find((u) =>
          u.bearerToken === bearerToken
        );
        if (account) {
          ctx.set("authed_userId", account.id);
          ctx.set("auth_method", "bearer");
          await next();
          return;
        }
      }
    }
    if (cookie) {
      // Cookieを使うための設定
      ctx.res.headers.set(
        "Access-Control-Allow-Origin",
        ctx.req.header("Origin") ?? "",
      );
      ctx.res.headers.set("Access-Control-Allow-Credentials", "true");

      const sessionId = await getSessionId(ctx.req.raw);

      // 認証済みユーザの取得
      if (sessionId) {
        const account = accounts.getUsers().find((u) =>
          u.sessions.includes(sessionId)
        );
        if (account) {
          ctx.set("authed_userId", account.id);
          ctx.set("auth_method", "cookie");
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
        ctx.res.headers.append(
          "WWW-Authenticate",
          `Bearer realm="token_required"`,
        );
      }
      return ctx.json(body, 401);
    } else {
      await next();
    }
  });
