import { Router } from "../deps.ts";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { errorCodeResponse, errors, ServerError } from "../core/error.ts";
import { auth } from "./middleware.ts";
import { accounts, User } from "../core/datas.ts";
import { ResponseType } from "../util/openapi-type.ts";
import { getPayload } from "./parts/jwt.ts";
import { openapi, validator } from "./parts/openapi.ts";

export const userRouter = () => {
  const router = new Router();

  // ユーザ登録
  router.post(
    "/",
    contentTypeFilter("application/json"),
    jsonParse(),
    async (ctx) => {
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

      const reqData = ctx.state.data;
      const isValid = validator.validateRequestBody(
        reqData,
        "/users",
        "post" as const,
        "application/json",
      );
      if (!isValid) throw new ServerError(errors.INVALID_REQUEST);
      //console.log(reqData);

      if (accounts.getUsers().some((e) => e.name === reqData.name)) {
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

      if (reqData.dryRun !== true) {
        accounts.getUsers().push(user);
        accounts.save();
      }

      const body: ResponseType<
        "/users",
        "post",
        "200",
        "application/json",
        typeof openapi
      > = user.noSafe();
      ctx.response.body = body;
    },
  );

  // ユーザ情報取得
  router.get(
    "/:idOrName",
    auth({ jwt: true, required: false }),
    (ctx) => {
      const idOrName = ctx.params.idOrName;

      const user = accounts.showUser(idOrName);

      // 認証済みユーザかの確認
      const authedUserId = ctx.state.authed_userId as string;
      const bodyUser = user.id === authedUserId ? user.noSafe() : user.toJSON();

      const body: ResponseType<
        "/users/{userIdOrName}",
        "get",
        "200",
        "application/json",
        typeof openapi
      > = bodyUser;
      ctx.response.body = body;
    },
  );

  // ユーザ削除
  router.delete(
    "/:idOrName",
    contentTypeFilter("application/json"),
    auth({ bearer: true, jwt: true }),
    jsonParse(),
    (ctx) => {
      const idOrName = ctx.params.idOrName;
      const reqData = ctx.state.data;
      const isValid = validator.validateRequestBody(
        reqData,
        "/users/{userIdOrName}",
        "delete" as const,
        "application/json",
      );
      if (!isValid) throw new ServerError(errors.INVALID_REQUEST);
      const authedUserId = ctx.state.authed_userId as string;

      const index = accounts.getUsers().findIndex((u) =>
        u.id === authedUserId &&
        (u.id === idOrName || u.name === idOrName)
      );
      if (index === -1) throw new ServerError(errors.NOT_USER);

      const user = accounts.getUsers()[index];
      if (reqData.dryRun !== true) {
        accounts.deleteUser(index);
      }
      const body: ResponseType<
        "/users/{userIdOrName}",
        "delete",
        "200",
        "application/json",
        typeof openapi
      > = user.noSafe();
      ctx.response.body = body;
    },
  );

  // ユーザ検索
  router.get("/", (ctx) => {
    const query = ctx.request.url.searchParams;
    const q = query.get("q");
    if (!q) {
      throw new ServerError(errors.NOTHING_SEARCH_QUERY);
    }

    const matchName = accounts.getUsers().filter((e) => e.name.startsWith(q));
    const matchId = accounts.getUsers().filter((e) => e.id.startsWith(q));
    const users = [...new Set([...matchName, ...matchId])];

    const body: ResponseType<
      "/users",
      "get",
      "200",
      "application/json",
      typeof openapi
    > = users.map((u) => u.toJSON());
    ctx.response.body = body;
  });

  return router.routes();
};
