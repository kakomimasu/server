import { Router } from "../deps.ts";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { errorCodeResponse, errors, ServerError } from "./error.ts";
import { UserDeleteReq, UserRegistReq } from "./types.ts";
import { auth } from "./middleware.ts";
import { accounts, User } from "./datas.ts";
import { getPayload } from "./parts/jwt.ts";

export const userRouter = () => {
  const router = new Router();

  router.get("/verify", async (ctx) => {
    const jwt = ctx.request.headers.get("Authorization");
    if (!jwt) return;
    const payload = await getPayload(jwt);
    if (!payload) return;
    //console.log(payload);
    const isUser = accounts.getUsers().some((user) =>
      user.id === payload.user_id
    );
    if (!isUser) throw new ServerError(errors.NOT_USER);
    ctx.response.status = 200;
  });

  // ユーザ登録
  router.post(
    "/regist",
    contentTypeFilter("application/json"),
    jsonParse(),
    async (ctx) => {
      const reqData = ctx.state.data as Partial<UserRegistReq>;
      //console.log(reqData);
      const idToken = ctx.request.headers.get("Authorization");

      if (!idToken) {
        ctx.response.headers.append(
          "WWW-Authenticate",
          `JWT realm="token_required"`,
        );

        ctx.response.status = 401;
        ctx.response.body = errorCodeResponse(
          new ServerError(errors.UNAUTHORIZED),
        );
        return;
      }

      if (!reqData.screenName) {
        throw new ServerError(errors.INVALID_SCREEN_NAME);
      }

      if (!reqData.name) throw new ServerError(errors.INVALID_USER_NAME);
      else if (accounts.getUsers().some((e) => e.name === reqData.name)) {
        throw new ServerError(errors.ALREADY_REGISTERED_NAME);
      }

      const payload = await getPayload(idToken);
      if (!payload) throw new ServerError(errors.INVALID_USER_AUTHORIZATION);
      const id = payload.user_id;
      if (accounts.getUsers().some((e) => e.id === id)) {
        throw new ServerError(errors.ALREADY_REGISTERED_USER);
      }

      const user = new User({
        name: reqData.name,
        screenName: reqData.screenName,
        id,
      });

      if (reqData.option?.dryRun !== true) {
        accounts.getUsers().push(user);
        accounts.save();
      }
      ctx.response.body = user.noSafe();
    },
  );

  // ユーザ情報取得
  router.get(
    "/show/:identifier",
    auth({ jwt: true, required: false }),
    (ctx) => {
      const identifier = ctx.params.identifier;

      const user = accounts.showUser(identifier);

      // 認証済みユーザかの確認
      const authedUserId = ctx.state.authed_userId as string;
      const bodyUser = user.id === authedUserId ? user.noSafe() : user.toJSON();

      ctx.response.body = bodyUser;
    },
  );

  // ユーザ削除
  router.post(
    "/delete",
    contentTypeFilter("application/json"),
    auth({ bearer: true, jwt: true }),
    jsonParse(),
    (ctx) => {
      const reqData = ctx.state.data as UserDeleteReq;
      const authedUserId = ctx.state.authed_userId as string;

      let user = accounts.getUsers().find((e) => e.id === authedUserId);
      if (!user) throw new ServerError(errors.NOT_USER);
      user = new User(user);
      accounts.deleteUser(user.id, reqData.option?.dryRun);
      ctx.response.body = user;
    },
  );

  // ユーザ検索
  router.get("/search", (ctx) => {
    const query = ctx.request.url.searchParams;
    const q = query.get("q");
    if (!q) {
      throw new ServerError(errors.NOTHING_SEARCH_QUERY);
    }

    const matchName = accounts.getUsers().filter((e) => e.name.startsWith(q));
    const matchId = accounts.getUsers().filter((e) => e.id.startsWith(q));
    const users = [...new Set([...matchName, ...matchId])];

    ctx.response.body = users;
  });

  return router.routes();
};
