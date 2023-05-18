import { Context } from "../deps.ts";

import { accounts } from "../core/datas.ts";
import { errorCodeResponse, errors, ServerError } from "../core/error.ts";
import { app } from "../core/firebase.ts";

export const auth = (
  { bearer, jwt, required = true }: {
    bearer?: boolean;
    jwt?: boolean;
    required?: boolean;
  },
) =>
async (ctx: Context, next: () => Promise<unknown>) => { // AuthorizationヘッダからユーザIDを取得
  const auth = ctx.request.headers.get("Authorization");
  if (auth) {
    if (bearer && auth.startsWith("Bearer ")) {
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
      let payload;
      try {
        payload = await app.auth().verifyIdToken(auth);
      } catch (_) {
        //
      }
      if (payload) {
        const id = payload.uid;
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
  } else {
    await next();
  }
};
