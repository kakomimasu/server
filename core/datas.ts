import { errors, ServerError } from "./error.ts";
import { ExpGame, ExpKakomimasu } from "./expKakomimasu.ts";
import {
  type FTournament,
  type FUser,
  getAllGameSnapShot,
  getAllTournaments,
  getAllUsers,
  setAllTournaments,
  setAllUsers,
} from "./firestore.ts";
import { PartiallyPartial, randomUUID } from "./util.ts";

class User implements FUser {
  public screenName: string;
  public name: string;
  public readonly id: string;
  public readonly bearerToken: string;

  constructor(data: FUser) {
    this.screenName = data.screenName;
    this.name = data.name;
    this.id = data.id;
    this.bearerToken = data.bearerToken;
  }

  static create(data: Pick<FUser, "screenName" | "name" | "id">) {
    return new User({
      screenName: data.screenName,
      name: data.name,
      id: data.id,
      bearerToken: randomUUID(),
    });
  }

  private getGameIds() {
    const gameIds = kkmm.getGames().filter((game) => {
      return game.players.some((p) => p.id === this.id);
    }).sort((a, b) => {
      return (a.startedAtUnixTime ?? Infinity) -
        (b.startedAtUnixTime ?? Infinity);
    }).map((game) => game.uuid);
    return gameIds;
  }

  // シリアライズする際にBearerTokenを返さないように
  // パスワードを返したい場合にはnoSafe()を用いる
  toJSON() {
    const { bearerToken: _b, ...data } = this.noSafe();
    return data;
  }

  // BearerTokenも含めたオブジェクトにする
  noSafe = () => ({ ...this, gameIds: this.getGameIds() });
}

class Users {
  private users: Array<User> = [];

  read = async () => {
    const usersData = await getAllUsers();
    this.users = usersData.map((e) => new User(e));
  };
  save = () => setAllUsers(this.users);

  getUsers = () => this.users;

  deleteUser(index: number) {
    this.users.splice(index, 1);
    this.save();
  }

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
    FTournament,
    | "name"
    | "organizer"
    | "type"
    | "remarks"
  >,
  "organizer" | "remarks"
>;

export class Tournament implements FTournament {
  public id: string;
  public name: string;
  public organizer: string;
  public type: FTournament["type"];
  public remarks: string;
  public users: string[];
  public gameIds: string[];

  constructor(data: FTournament) {
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
      if (games.some((game) => game.uuid === gameId)) return true;
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

  dataCheck(games: ExpGame[]) {
    this.tournaments.forEach((tournament) => {
      tournament.dataCheck(games);
    });
    this.save();
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

const kkmm = new ExpKakomimasu();
(await getAllGameSnapShot()).forEach((doc) => {
  kkmm.games.push(ExpGame.restore(doc.val()));
});

const tournaments = new Tournaments();
await tournaments.read();
tournaments.dataCheck(kkmm.getGames());

const accounts = new Users();
await accounts.read();

export { accounts, kkmm, tournaments, User };
