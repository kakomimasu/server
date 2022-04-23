import { randomUUID } from "./util.ts";
import { errors, ServerError } from "./error.ts";
import { Tournament as ITournament, TournamentType } from "./types.ts";
import {
  getAllGames,
  getAllTournaments,
  getAllUsers,
  setAllTournaments,
  setAllUsers,
} from "./parts/firestore_opration.ts";
import { ExpGame, ExpKakomimasu } from "./parts/expKakomimasu.ts";

export interface IUser {
  screenName: string;
  name: string;
  id?: string;
  bearerToken?: string;
}

class User implements IUser {
  public screenName: string;
  public name: string;
  public readonly id: string;
  public readonly bearerToken: string;

  constructor(data: IUser) {
    this.screenName = data.screenName;
    this.name = data.name;
    this.id = data.id || randomUUID();
    this.bearerToken = data.bearerToken || randomUUID();
  }

  private getGamesId() {
    const gamesId = kkmm.getGames().filter((game) => {
      return game.players.some((p) => p.id === this.id);
    }).sort((a, b) => {
      return (a.startedAtUnixTime ?? Infinity) -
        (b.startedAtUnixTime ?? Infinity);
    }).map((game) => game.uuid);
    return gamesId;
  }

  // シリアライズする際にBearerTokenを返さないように
  // パスワードを返したい場合にはnoSafe()を用いる
  toJSON() {
    const { bearerToken: _b, ...data } = this.noSafe();
    return data;
  }

  // BearerTokenも含めたオブジェクトにする
  noSafe = () => ({ ...this, gamesId: this.getGamesId() });
}

class Users {
  private users: Array<User> = [];

  read = async () => {
    const usersData = await getAllUsers();
    this.users = usersData.map((e) => new User(e));
  };
  save = () => setAllUsers(this.users);

  getUsers = () => this.users;

  deleteUser(userId: string, dryRun = false) {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) throw new ServerError(errors.NOT_USER);

    if (dryRun !== true) {
      this.users.splice(index, 1);
      this.save();
    }
  }

  showUser(identifier: string) {
    const user = this.users.find((
      e,
    ) => (e.id === identifier || e.name === identifier));
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
}

export class Tournament implements ITournament {
  public id: string;
  public name: string;
  public organizer: string;
  public type: TournamentType;
  public remarks: string;
  public users: string[];
  public gameIds: string[];

  constructor(a: ITournament) {
    this.name = a.name;
    this.organizer = a.organizer || "";
    this.type = a.type;
    this.remarks = a.remarks || "";
    this.id = a.id || randomUUID();
    this.users = a.users || [];
    this.gameIds = a.gameIds || [];
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

export class Tournaments {
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
kkmm.games.push(...await getAllGames());

const tournaments = new Tournaments();
await tournaments.read();
tournaments.dataCheck(kkmm.getGames());

const accounts = new Users();
await accounts.read();

export { accounts, kkmm, tournaments, User, Users };
