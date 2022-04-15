import { Router } from "../deps.ts";

import { contentTypeFilter, jsonParse } from "./util.ts";
import { errors, ServerError } from "./error.ts";
import { UserDeleteReq, UserRegistReq } from "./types.ts";
import { auth } from "./middleware.ts";
import { accounts, kkmm, User } from "./datas.ts";
import { getPayload } from "./parts/jwt.ts";

function getGamesId(user: User) {
  const gamesId = kkmm.getGames().filter((game) => {
    return game.players.some((p) => p.id === user.id);
  }).sort((a, b) => {
    return (a.startedAtUnixTime ?? Infinity) -
      (b.startedAtUnixTime ?? Infinity);
  }).map((game) => game.uuid);
  return gamesId;
}

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

      if (!reqData.screenName) {
        throw new ServerError(errors.INVALID_SCREEN_NAME);
      }

      if (!reqData.name) throw new ServerError(errors.INVALID_USER_NAME);
      else if (accounts.getUsers().some((e) => e.name === reqData.name)) {
        throw new ServerError(errors.ALREADY_REGISTERED_NAME);
      }

      const idToken = ctx.request.headers.get("Authorization");
      let id: string | undefined = undefined;
      if (idToken) {
        const payload = await getPayload(idToken);
        if (payload) {
          id = payload.user_id;
          if (accounts.getUsers().some((e) => e.id === id)) {
            throw new ServerError(errors.ALREADY_REGISTERED_USER);
          }
        } else throw new ServerError(errors.INVALID_USER_AUTHORIZATION);
      } else {
        if (!reqData.password) {
          throw new ServerError(errors.NOTHING_PASSWORD);
        }
      }

      const user = new User({
        name: reqData.name,
        screenName: reqData.screenName,
        password: reqData.password,
        id,
      });

      if (reqData.option?.dryRun !== true) {
        accounts.getUsers().push(user);
        accounts.save();
      }
      //return user;
      //const user = accounts.registUser({ ...reqData, id }, jwt !== null);
      ctx.response.body = { ...user.noSafe(), gamesId: [] };
    },
  );

  // ユーザ情報取得
  router.get(
    "/show/:identifier",
    auth({ basic: true, jwt: true, required: false }),
    async (ctx) => {
      const identifier = ctx.params.identifier || "";

      if (identifier !== "") {
        const user = accounts.showUser(identifier);

        // 認証済みユーザかの確認
        const authedUserId = ctx.state.authed_userId as string;
        const bodyUser = user.id === authedUserId
          ? user.noSafe()
          : user.toJSON();
        const gamesId = await getGamesId(user);

        ctx.response.body = { ...bodyUser, gamesId };
      } else {
        ctx.response.body = accounts.getUsers();
      }
    },
  );

  // ユーザ削除
  router.post(
    "/delete",
    contentTypeFilter("application/json"),
    auth({ bearer: true, jwt: true }),
    jsonParse(),
    async (ctx) => {
      const reqData = ctx.state.data as UserDeleteReq;
      const authedUserId = ctx.state.authed_userId as string;

      let user = accounts.getUsers().find((e) => e.id === authedUserId);
      if (!user) throw new ServerError(errors.NOT_USER);
      user = new User(user);
      accounts.deleteUser(user.id, reqData.option?.dryRun);
      const gamesId = await getGamesId(user);
      ctx.response.body = { ...user.toJSON(), gamesId };
    },
  );

  // ユーザ検索
  router.get("/search", async (ctx) => {
    const query = ctx.request.url.searchParams;
    const q = query.get("q");
    if (!q) {
      throw new ServerError(errors.NOTHING_SEARCH_QUERY);
    }

    const matchName = accounts.getUsers().filter((e) => e.name.startsWith(q));
    const matchId = accounts.getUsers().filter((e) => e.id.startsWith(q));
    const users = [...new Set([...matchName, ...matchId])];
    const body = await Promise.all(users.map(async (user) => {
      const gamesId = await getGamesId(user);
      return { ...user.toJSON(), gamesId };
    }));

    ctx.response.body = body;
  });

  return router.routes();
};
