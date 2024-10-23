import { Router } from "@oak/oak";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { errors, ServerError } from "../core/error.ts";
import { env } from "../core/env.ts";
import { deleteUser, kv } from "../core/kv.ts";
import { auth } from "./middleware.ts";
import { accounts, User } from "../core/datas.ts";
import { ResponseType } from "../util/openapi-type.ts";
import { openapi, validator } from "./parts/openapi.ts";

export const userRouter = () => {
  const router = new Router();

  // ユーザ情報取得
  router.get(
    "/me",
    auth({ bearer: true, cookie: true }),
    (ctx) => {
      const authedUserId = ctx.state.authed_userId as string;
      const user = accounts.getUsers().find((u) => u.id === authedUserId)!;
      const body: ResponseType<
        "/users/me",
        "get",
        "200",
        "application/json",
        typeof openapi
      > = user.noSafe();
      ctx.response.body = body;
    },
  );

  // ユーザ削除
  router.delete(
    "/me",
    contentTypeFilter("application/json"),
    auth({ bearer: true, cookie: true }),
    jsonParse(),
    (ctx) => {
      const authedUserId = ctx.state.authed_userId as string;
      const user = accounts.getUsers().find((u) => u.id === authedUserId)!;

      const reqData = ctx.state.data;
      const isValid = validator.validateRequestBody(
        reqData,
        "/users/me",
        "delete" as const,
        "application/json",
      );
      if (!isValid) throw new ServerError(errors.INVALID_REQUEST);

      const index = accounts.getUsers().findIndex((u) => u === user);
      if (reqData.dryRun !== true) {
        accounts.getUsers().splice(index, 1);
        accounts.save();
        deleteUser(user.id);
      }
      const body: ResponseType<
        "/users/me",
        "delete",
        "200",
        "application/json",
        typeof openapi
      > = user.noSafe();
      ctx.response.body = body;
    },
  );
  // ユーザトークン再生成
  router.get(
    "/me/token",
    auth({ bearer: true, cookie: true }),
    (ctx) => {
      const authedUserId = ctx.state.authed_userId as string;
      const user = accounts.getUsers().find((u) => u.id === authedUserId)!;

      user.regenerateToken();
      accounts.save();

      const body: ResponseType<
        "/users/me/token",
        "get",
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
    (ctx) => {
      const idOrName = ctx.params.idOrName;

      const user = accounts.showUser(idOrName);

      const body: ResponseType<
        "/users/{userIdOrName}",
        "get",
        "200",
        "application/json",
        typeof openapi
      > = user.toJSON();
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

  if (env.TEST) {
    // テスト時のみユーザ登録APIを作成する
    router.post(
      "/",
      contentTypeFilter("application/json"),
      jsonParse(),
      async (ctx) => {
        const reqData = ctx.state.data as {
          name: string;
          screenName: string;
          id: string;
          avaterUrl: string;
          sessions: string[];
        };

        const user = User.create(reqData);

        accounts.getUsers().push(user);
        await accounts.save();

        for await (const sessionId of reqData.sessions) {
          await kv.set(["site_sessions", sessionId], true);
        }

        ctx.response.body = user.noSafe();
      },
    );
  }

  return router.routes();
};
