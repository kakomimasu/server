import { errors, ServerError } from "./error.ts";
import { ExpGame } from "./expKakomimasu.ts";
import {
  getAllGameSnapShot,
  type KvTournament,
  type KvUser,
  prisma,
  serializeTournament,
  serializeUser,
} from "./kv.ts";
import { PartiallyPartial, randomUUID } from "./util.ts";
import type {
  Tournament as PrismaTournament,
} from "../generated/prisma/client.ts";

class User implements KvUser {
  public screenName: string;
  public name: string;
  public readonly id: string;
  public avaterUrl: string;
  public sessions: string[];
  public bearerToken: string;

  constructor(data: KvUser) {
    this.screenName = data.screenName;
    this.name = data.name;
    this.id = data.id;
    this.avaterUrl = data.avaterUrl;
    this.sessions = data.sessions;
    this.bearerToken = data.bearerToken;
  }

  static create(data: Omit<KvUser, "bearerToken">) {
    return new User({
      screenName: data.screenName,
      name: data.name,
      id: data.id,
      avaterUrl: data.avaterUrl,
      sessions: data.sessions,
      bearerToken: randomUUID(),
    });
  }

  private getGameIds() {
    const gameIds = games.filter((game) => {
      return game.players.some((p) => p.id === this.id);
    }).sort((a, b) => {
      return (a.startedAtUnixTime ?? Infinity) -
        (b.startedAtUnixTime ?? Infinity);
    }).map((game) => game.id);
    return gameIds;
  }

  public regenerateToken() {
    this.bearerToken = randomUUID();
  }

  // シリアライズする際にBearerTokenを返さないように
  // BearerTokenを返したい場合にはnoSafe()を用いる
  toJSON() {
    const { bearerToken: _b, ...data } = this.noSafe();
    return data;
  }

  // BearerTokenやSession情報も含めたオブジェクトにする
  noSafe = () => {
    const { sessions: _s, ...data } = this;
    const gameIds = this.getGameIds();
    return { ...data, gameIds };
  };
}

class Users {
  private toUser(row: KvUser | null) {
    return row ? new User(row) : undefined;
  }

  findById = async (id: string | undefined) =>
    id === undefined
      ? undefined
      : this.toUser(await prisma.user.findUnique({ where: { id } }));

  find = async (identifier: string) =>
    this.toUser(
      await prisma.user.findFirst({
        where: { OR: [{ id: identifier }, { name: identifier }] },
      }),
    );

  showUser = async (idOrName: string) => {
    const user = await this.find(idOrName);
    if (user === undefined) throw new ServerError(errors.NOT_USER);
    return user;
  };

  getWithAuth = async (auth: string) =>
    this.toUser(await prisma.user.findFirst({ where: { bearerToken: auth } }));

  findBySession = async (sessionId: string) =>
    this.toUser(
      await prisma.user.findFirst({ where: { sessions: { has: sessionId } } }),
    );

  search = async (q: string) => {
    const rows = await prisma.user.findMany({
      where: {
        OR: [{ name: { startsWith: q } }, { id: { startsWith: q } }],
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((e) => new User(e));
  };

  create = async (user: User) => {
    await prisma.user.create({ data: serializeUser(user) });
  };

  update = async (user: User) => {
    const { id: _id, ...data } = serializeUser(user);
    await prisma.user.update({ where: { id: user.id }, data });
  };

  delete = async (id: string) => {
    await prisma.user.delete({ where: { id } });
  };

  addSession = async (id: string, sessionId: string) => {
    await prisma.user.update({
      where: { id },
      data: { sessions: { push: sessionId } },
    });
  };

  removeSession = async (sessionId: string) => {
    await prisma
      .$executeRaw`UPDATE "User" SET sessions = array_remove(sessions, ${sessionId}) WHERE ${sessionId} = ANY(sessions)`;
  };
}

type newTournamentConstructorParam = PartiallyPartial<
  Pick<
    KvTournament,
    | "name"
    | "organizer"
    | "type"
    | "remarks"
  >,
  "organizer" | "remarks"
>;

export class Tournament implements KvTournament {
  public id: string;
  public name: string;
  public organizer: string;
  public type: KvTournament["type"];
  public remarks: string;
  public users: string[];
  public gameIds: string[];

  constructor(data: KvTournament) {
    this.id = data.id;
    this.name = data.name;
    this.organizer = data.organizer;
    this.type = data.type;
    this.remarks = data.remarks;
    this.users = data.users ?? [];
    this.gameIds = data.gameIds ?? [];
  }

  static create(data: newTournamentConstructorParam) {
    return new Tournament({
      id: randomUUID(),
      name: data.name,
      organizer: data.organizer ?? "",
      type: data.type,
      remarks: data.remarks ?? "",
      users: [],
      gameIds: [],
    });
  }

  dataCheck(games: ExpGame[]) {
    this.gameIds = this.gameIds.filter((gameId) => {
      if (games.some((game) => game.id === gameId)) return true;
      else return false;
    });
  }

  async addUser(identifier: string) {
    const user = await accounts.find(identifier);
    if (!user) throw new ServerError(errors.NOT_USER);
    this.addUserId(user.id);
  }

  addUserId(userId: string) {
    const some = this.users.some((e) => e === userId);
    if (some) throw new ServerError(errors.ALREADY_REGISTERED_USER);
    else this.users.push(userId);
  }
}

class Tournaments {
  /**
   * データ整合性チェック用。起動時に存在しないゲームIDを削除して保存しなおす
   * TODO: リレーションで行うようにしたい
   */
  async dataCheck(games: ExpGame[]) {
    const tournaments = await this.getAll();
    tournaments.forEach((tournament) => {
      tournament.dataCheck(games);
    });
    await prisma.$transaction(async (tx) => {
      await Promise.all(
        tournaments.map((tournament) => {
          const serializedTournament = serializeTournament(tournament);
          return tx.tournament.upsert({
            where: { id: tournament.id },
            update: serializedTournament,
            create: serializedTournament,
          });
        }),
      );
    });
  }

  get = async (id: string) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });
    if (!tournament) return null;
    return new Tournament(tournament as KvTournament);
  };

  getAll = async () => {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: "asc" },
    });
    return tournaments.map((tournament) =>
      new Tournament(tournament as KvTournament)
    );
  };

  async add(tournament: Tournament) {
    await prisma.tournament.create({
      data: serializeTournament(tournament),
    });
  }
  async delete(tournament: Tournament) {
    await prisma.tournament.delete({
      where: { id: tournament.id },
    });
  }

  async addUser(tournamentId: string, identifier: string) {
    // トランザクション中に別接続を要求しないよう、先にユーザを解決する
    const user = await accounts.find(identifier);
    if (!user) throw new ServerError(errors.NOT_USER);
    return await prisma.$transaction(async (tx) => {
      const tournamentRaw = (await tx.$queryRaw<
        PrismaTournament[]
      >`SELECT * FROM "Tournament" WHERE id = ${tournamentId} FOR UPDATE`)[0];

      if (!tournamentRaw) throw new ServerError(errors.INVALID_TOURNAMENT_ID);
      const tournament = new Tournament(tournamentRaw as KvTournament);

      tournament.addUserId(user.id);

      await tx.tournament.update({
        where: { id: tournament.id },
        data: serializeTournament(tournament),
      });
      return tournament;
    });
  }

  async addGame(tournamentId: string, gameId: string) {
    return await prisma.$transaction(async (tx) => {
      const tournamentRaw = (await tx.$queryRaw<
        PrismaTournament[]
      >`SELECT * FROM "Tournament" WHERE id = ${tournamentId} FOR UPDATE`)[0];

      if (!tournamentRaw) throw new ServerError(errors.INVALID_TOURNAMENT_ID);
      const tournament = new Tournament(tournamentRaw as KvTournament);

      tournament.gameIds.push(gameId);

      await tx.tournament.update({
        where: { id: tournament.id },
        data: serializeTournament(tournament),
      });
    });
  }
}

const games: ExpGame[] = [];
// deno-lint-ignore no-explicit-any
(await getAllGameSnapShot()).forEach((doc: any) => {
  games.push(ExpGame.fromJSON(doc));
});

const tournaments = new Tournaments();
await tournaments.dataCheck(games);

const accounts = new Users();

export { accounts, games, tournaments, User };
