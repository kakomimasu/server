import { Context } from "../deps.ts";

import { accounts } from "./user.ts";
import { getPayload } from "./parts/jwt.ts";
import { errorCodeResponse, errors, ServerError } from "./error.ts";

export const auth = (
  { basic, bearer, jwt, required = true }: {
    basic?: boolean;
    bearer?: boolean;
    jwt?: boolean;
    required?: boolean;
  },
) =>
  async (ctx: Context, next: () => Promise<unknown>) => { // AuthorizationヘッダからユーザIDを取得
    const auth = ctx.request.headers.get("Authorization");
    if (auth) {
      if (basic && auth.startsWith("Basic ")) {
        const [identifier, pass] = auth.substr("Basic ".length).split(":");
        const account = accounts.getUsers().find((user) =>
          user.password === pass &&
          (user.id === identifier || user.name === identifier)
        );
        if (account) {
          ctx.state.authed_userId = account.id;
          ctx.state.auth_method = "basic";
          await next();
          return;
        }
      } else if (bearer && auth.startsWith("Bearer ")) {
        const bearerToken = auth.substr("Bearer ".length);
        const account = accounts.getUsers().find((u) =>
          u.bearerToken === bearerToken
        );
        if (account) {
          ctx.state.authed_userId = account.id;
          ctx.state.auth_method = "bearer";
          await next();
          return;
        }
      } else if (jwt) {
        const payload = await getPayload(auth);
        if (payload) {
          const id = payload.user_id;
          const account = accounts.getUsers().find((user) => user.id === id);
          if (account) {
            ctx.state.authed_userId = account.id;
            ctx.state.auth_method = "jwt";
            await next();
            return;
          }
        }
      }
    }
    if (required) {
      const { body } = errorCodeResponse(
        new ServerError(errors.UNAUTHORIZED),
      );

      //const headers = resTemp.headers
      if (basic) {
        ctx.response.headers.append(
          "WWW-Authenticate",
          `Basic realm="token_required"`,
        );
      }
      if (bearer) {
        ctx.response.headers.append(
          "WWW-Authenticate",
          `Bearer realm="token_required"`,
        );
      }
      if (jwt) {
        ctx.response.headers.append(
          "WWW-Authenticate",
          `JWT realm="token_required"`,
        );
      }
      ctx.response.status = 401;
      ctx.response.body = body;
    }
    await next();
  };
