import { assert, assertEquals, v4 } from "../../deps-test.ts";

import { useUser } from "../../util/test/useUser.ts";

import { randomUUID } from "../../core/util.ts";
import { errors } from "../../core/error.ts";

import ApiClient from "../../client/client.ts";

import { validator } from "../parts/openapi.ts";

const ac = new ApiClient();

const assertTournamentCreateRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    {
      path: "/tournament/create",
      method: "post",
      statusCode: responseCode,
      contentType: "application/json",
    },
  );
  assert(isValid);
};

const assertTournamentGetsRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    {
      path: "/tournament/get",
      method: "get",
      statusCode: responseCode,
      contentType: "application/json",
    },
  );
  assert(isValid);
};
const assertTournamentGetRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    {
      path: "/tournament/get?id=:tournamentId",
      method: "get",
      statusCode: responseCode,
      contentType: "application/json",
    },
  );
  assert(isValid);
};

const assertTournamentAddRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    {
      path: "/tournament/add",
      method: "post",
      statusCode: responseCode,
      contentType: "application/json",
    },
  );
  assert(isValid);
};

const assertTournamentDeleteRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    {
      path: "/tournament/delete",
      method: "post",
      statusCode: responseCode,
      contentType: "application/json",
    },
  );
  assert(isValid);
};

const assertTournament = (tournament, sample = {}) => {
  const tournament_ = Object.assign({}, tournament);
  const sample_ = Object.assign({}, sample);
  assert(v4.validate(tournament_.id));

  if (!sample_.id) tournament_.id = sample_.id = undefined;
  if (!sample_.type) tournament_.type = sample_.type = undefined;
  if (!sample_.name) tournament_.name = sample_.name = undefined;
  if (!sample_.organizer) tournament_.organizer = sample_.organizer = undefined;
  if (!sample_.remarks) tournament_.remarks = sample_.remarks = undefined;
  if (!sample_.users) tournament_.users = sample_.users = undefined;
  if (!sample_.gameIds) tournament_.gameIds = sample_.gameIds = undefined;

  assertEquals(tournament_, sample_);
};

const uuid = randomUUID();

const data = {
  name: uuid,
  type: "round-robin",
};

// /v1/tournament/create Test
// テスト項目
// 正常(round-robin・knockout)・大会名無し・大会種別無し
Deno.test("v1/tournament/create:normal", async () => {
  let res = await ac.tournamentsCreate({
    ...data,
    option: { dryRun: true },
  });
  assertTournamentCreateRes(res.data, 200);
  assertTournament(res.data, data);

  res = await ac.tournamentsCreate({
    ...data,
    type: "knockout",
    option: { dryRun: true },
  });
  assertTournamentCreateRes(res.data, 200);
  assertTournament(res.data, { ...data, type: "knockout" });
});
Deno.test("v1/tournament/create:invalid tournament name", async () => {
  {
    const res = await ac.tournamentsCreate({
      ...data,
      name: "",
      option: { dryRun: true },
    });
    assertTournamentCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_NAME);
  }
  {
    const res = await ac.tournamentsCreate({
      ...data,
      name: undefined,
      option: { dryRun: true },
    });
    assertTournamentCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_NAME);
  }
  {
    const res = await ac.tournamentsCreate({
      ...data,
      name: null,
      option: { dryRun: true },
    });
    assertTournamentCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_NAME);
  }
});
Deno.test("v1/tournament/create:invalid tournament type", async () => {
  {
    const res = await ac.tournamentsCreate({
      ...data,
      type: "",
      option: { dryRun: true },
    });
    assertTournamentCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TYPE);
  }
  {
    const res = await ac.tournamentsCreate({
      ...data,
      type: undefined,
      option: { dryRun: true },
    });
    assertTournamentCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TYPE);
  }
  {
    const res = await ac.tournamentsCreate({
      ...data,
      type: null,
      option: { dryRun: true },
    });
    assertTournamentCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TYPE);
  }
  {
    const res = await ac.tournamentsCreate({
      ...data,
      type: "round-robins",
      option: { dryRun: true },
    });
    assertTournamentCreateRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TYPE);
  }
});
Deno.test("v1/tournament/create:normal by no dryRun", async () => {
  const res = await ac.tournamentsCreate(data);
  assertTournamentCreateRes(res.data, 200);
  assertTournament(res.data, data);

  data.id = res.data.id;
});

// /v1/tournament/get Test
// テスト項目
// 正常（1大会・全大会）・ID無し
Deno.test("v1/tournament/get:normal by single", async () => {
  const res = await ac.tournamentsGet(data.id);
  assertTournamentGetRes(res.data, 200);
  assertTournament(res.data, data);
});
Deno.test("v1/tournament/get:normal by all", async () => {
  const res = await ac.tournamentsGet(); // as Array<any>;
  if (res.success === false) assert(false);
  assertTournamentGetsRes(res.data, 200);
  res.data.forEach((e) => assertTournament(e));
});
Deno.test("v1/tournament/get:nothing tournament id", async () => {
  const res = await ac.tournamentsGet(randomUUID());
  assertTournamentGetRes(res.data, 400);
  assertEquals(res.data, errors.NOTHING_TOURNAMENT_ID);
});

// /v1/tournament/add Test
// テスト項目
// 正常、ID無し、user無し、存在しない大会ID、存在しないユーザ、登録済みのユーザ
Deno.test("v1/tournament/add:normal", async () => {
  await useUser(async (user) => {
    const res = await ac.tournamentsAddUser(data.id, {
      user: user.id,
      option: { dryRun: true },
    });

    assertTournamentAddRes(res.data, 200);
    assertTournament(res.data, { ...data, users: [user.id] });
  });
});
Deno.test("v1/tournament/add:tournament that do not exist", async () => {
  {
    const res = await ac.tournamentsAddUser(randomUUID(), {
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
  }
});
Deno.test("v1/tournament/add:invalid tournament id", async () => {
  {
    const res = await ac.tournamentsAddUser("", {
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
  }
  {
    const res = await ac.tournamentsAddUser(undefined, {
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
  }
  {
    const res = await ac.tournamentsAddUser(null, {
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
  }
});
Deno.test("v1/tournament/add:nothing user", async () => {
  {
    const res = await ac.tournamentsAddUser(data.id, {
      user: "",
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_USER_IDENTIFIER);
  }
  {
    const res = await ac.tournamentsAddUser(data.id, {
      user: undefined,
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_USER_IDENTIFIER);
  }
  {
    const res = await ac.tournamentsAddUser(data.id, {
      user: null,
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_USER_IDENTIFIER);
  }
});
Deno.test("v1/tournament/add:user that do not exist", async () => {
  {
    const res = await ac.tournamentsAddUser(data.id, {
      user: randomUUID(),
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.NOT_USER);
  }
});
Deno.test("v1/tournament/add:already registed user", async () => {
  await useUser(async (user) => {
    await ac.tournamentsAddUser(data.id, { user: user.id });
    const res = await ac.tournamentsAddUser(data.id, { user: user.id });

    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.ALREADY_REGISTERED_USER);
  });
});

// /v1/tournament/delete Test
// テスト項目
// 正常・ID無し
Deno.test("v1/tournament/delete:normal", async () => {
  const res = await ac.tournamentsDelete({
    id: data.id,
    option: { dryRun: true },
  });
  assertTournamentDeleteRes(res.data, 200);
  assertTournament(res.data, data);
});
Deno.test("v1/tournament/delete:invalid tournament id", async () => {
  {
    const res = await ac.tournamentsDelete({
      id: "",
      option: { dryRun: true },
    });
    assertTournamentDeleteRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
  }
  {
    const res = await ac.tournamentsDelete({
      id: undefined,
      option: { dryRun: true },
    });
    assertTournamentDeleteRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
  }
  {
    const res = await ac.tournamentsDelete({
      id: null,
      option: { dryRun: true },
    });
    assertTournamentDeleteRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
  }
});
Deno.test("v1/tournament/delete:nothing tournament id", async () => {
  const res = await ac.tournamentsDelete({
    id: randomUUID(),
    option: { dryRun: true },
  });
  assertTournamentDeleteRes(res.data, 400);
  assertEquals(res.data, errors.NOTHING_TOURNAMENT_ID);
});
Deno.test("v1/tournament/delete:normal by no dryRun", async () => {
  const res = await ac.tournamentsDelete({ id: data.id });
  assertTournamentDeleteRes(res.data, 200);
  assertTournament(res.data, data);
});
