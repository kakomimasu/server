import { errors, ServerError } from "./error.ts";
import { ExpGame } from "./expKakomimasu.ts";
import {
  getAllGameSnapShot,
  getAllTournaments,
  getAllUsers,
  type KvTournament,
  type KvUser,
  setAllTournaments,
  setAllUsers,
} from "./kv.ts";
import { PartiallyPartial, randomUUID } from "./util.ts";

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
  private users: Array<User> = [];

  read = async () => {
    const usersData = await getAllUsers();
    this.users = usersData.map((e) => new User(e));
  };
  save = () => setAllUsers(this.users);

  getUsers = () => this.users;

  showUser(idOrName: string) {
    const user = this.users.find((
      e,
    ) => (e.id === idOrName || e.name === idOrName));
    if (user === undefined) throw new ServerError(errors.NOT_USER);
    return user;
  }

  findById(id: string) {
    return this.users.find((e) => e.id === id);
  }

  find(identifier: string) {
    return this.users.find((e) =>
      (e.id === identifier) || (e.name === identifier)
    );
  }

  getWithAuth(auth: string) {
    return this.users.find((e) => e.bearerToken === auth);
  }
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

  addUser(identifier: string) {
    const user = accounts.find(identifier);
    if (!user) throw new ServerError(errors.NOT_USER);

    const some = this.users.some((e) => e === user.id);
    if (some) throw new ServerError(errors.ALREADY_REGISTERED_USER);
    else this.users.push(user.id);
  }
}

class Tournaments {
  private tournaments: Tournament[] = [];

  static init = async () => {
    const t = new Tournaments();
    await t.read();
    return t;
  };

  read = async () => {
    this.tournaments.length = 0;
    const data = await getAllTournaments();
    data.forEach((e) => {
      this.tournaments.push(new Tournament(e));
    });
  };
  save = () => setAllTournaments(this.tournaments);

  async dataCheck(games: ExpGame[]) {
    this.tournaments.forEach((tournament) => {
      tournament.dataCheck(games);
    });
    await this.save();
  }

  get = (id: string) => {
    return this.tournaments.find((e) => e.id === id);
  };

  getAll = () => {
    return this.tournaments;
  };

  add(tournament: Tournament) {
    this.tournaments.push(tournament);
    this.save();
  }
  delete(tournament: Tournament) {
    this.tournaments = this.tournaments.filter((e) => e.id !== tournament.id);
    this.save();
  }

  addUser(tournamentId: string, identifier: string) {
    const tournament = this.get(tournamentId);
    if (!tournament) throw new ServerError(errors.INVALID_TOURNAMENT_ID);

    //console.log(tournament);
    tournament.addUser(identifier);
    this.save();

    return tournament;
  }

  addGame(tournamentId: string, gameId: string) {
    const tournament = this.get(tournamentId);
    if (!tournament) throw new ServerError(errors.INVALID_TOURNAMENT_ID);

    tournament.gameIds.push(gameId);
    this.save();
  }
}

const games: ExpGame[] = [];
// deno-lint-ignore no-explicit-any
(await getAllGameSnapShot()).forEach((doc: any) => {
  games.push(ExpGame.fromJSON(doc));
});

const tournaments = new Tournaments();
await tournaments.read();
await tournaments.dataCheck(games);

const accounts = new Users();
await accounts.read();

export { accounts, games, tournaments, User };
