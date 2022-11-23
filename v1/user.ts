import { Router } from "../deps.ts";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { errorCodeResponse, errors, ServerError } from "../core/error.ts";
import { User as IUser, UserDeleteReq, UserRegistReq } from "./types.ts";
import { auth } from "./middleware.ts";
import { accounts, User } from "../core/datas.ts";
import { getPayload } from "./parts/jwt.ts";

export const userRouter = () => {
  const router = new Router();

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

      const user = User.create({
        name: reqData.name,
        screenName: reqData.screenName,
        id,
      });

      if (reqData.option?.dryRun !== true) {
        accounts.getUsers().push(user);
        accounts.save();
      }

      const body: Required<IUser> = user.noSafe();
      ctx.response.body = body;
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

      const body: IUser = bodyUser;
      ctx.response.body = body;
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
      const body: IUser = user.toJSON();
      ctx.response.body = body;
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

    const body: IUser[] = users.map((u) => u.toJSON());
    ctx.response.body = body;
  });

  return router.routes();
};
