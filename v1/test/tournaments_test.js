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
    "/tournaments",
    "post",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertTournamentGetAllRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/tournaments",
    "get",
    responseCode,
    "application/json",
  );
  assert(isValid);
};
const assertTournamentGetRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/tournaments/{tournamentId}",
    "get",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertTournamentAddRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/tournaments/{tournamentId}/users",
    "post",
    responseCode,
    "application/json",
  );
  assert(isValid);
};

const assertTournamentDeleteRes = (res, responseCode) => {
  const isValid = validator.validateResponse(
    res,
    "/tournaments/{tournamentId}",
    "delete",
    responseCode,
    "application/json",
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

// POST /v1/tournaments Test
// テスト項目
// 正常(round-robin・knockout)・大会名無し・大会種別無し
Deno.test("POST v1/tournaments:normal", async () => {
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
Deno.test("POST v1/tournaments:invalid tournament name", async () => {
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
Deno.test("POST v1/tournaments:invalid tournament type", async () => {
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
Deno.test("POST v1/tournaments:normal by no dryRun", async () => {
  const res = await ac.tournamentsCreate(data);
  assertTournamentCreateRes(res.data, 200);
  assertTournament(res.data, data);

  data.id = res.data.id;
});

// GET /v1/tournaments Test
// テスト項目
// 正常（1大会・全大会）・ID無し
Deno.test("GET v1/tournaments:normal by all", async () => {
  const res = await ac.tournamentsGetAll();
  if (res.success === false) assert(false);
  assertTournamentGetAllRes(res.data, 200);
  res.data.forEach((e) => assertTournament(e));
});

// GET /v1/tournaments/{id} Test
// テスト項目
// 正常（1大会・全大会）・ID無し
Deno.test("GET v1/tournaments/{id}:normal by single", async () => {
  const res = await ac.tournamentsGet(data.id);
  assertTournamentGetRes(res.data, 200);
  assertTournament(res.data, data);
});
Deno.test("GET v1/tournaments/{id}:nothing tournament id", async () => {
  const res = await ac.tournamentsGet(randomUUID());
  assertTournamentGetRes(res.data, 400);
  assertEquals(res.data, errors.NOTHING_TOURNAMENT_ID);
});

// POST /v1/tournaments/{id}/users Test
// テスト項目
// 正常、user無し、存在しない大会ID、存在しないユーザ、登録済みのユーザ
Deno.test("POST v1/tournaments/{id}/users:normal", async () => {
  await useUser(async (user) => {
    const res = await ac.tournamentsAddUser(data.id, {
      user: user.id,
      option: { dryRun: true },
    });

    assertTournamentAddRes(res.data, 200);
    assertTournament(res.data, { ...data, users: [user.id] });
  });
});
Deno.test("POST v1/tournaments/{id}/users:tournament that do not exist", async () => {
  {
    const res = await ac.tournamentsAddUser(randomUUID(), {
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.INVALID_TOURNAMENT_ID);
  }
});
Deno.test("POST v1/tournaments/{id}/users:nothing user", async () => {
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
Deno.test("POST v1/tournaments/{id}/users:user that do not exist", async () => {
  {
    const res = await ac.tournamentsAddUser(data.id, {
      user: randomUUID(),
      option: { dryRun: true },
    });
    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.NOT_USER);
  }
});
Deno.test("POST v1/tournaments/{id}/users:already registed user", async () => {
  await useUser(async (user) => {
    await ac.tournamentsAddUser(data.id, { user: user.id });
    const res = await ac.tournamentsAddUser(data.id, { user: user.id });

    assertTournamentAddRes(res.data, 400);
    assertEquals(res.data, errors.ALREADY_REGISTERED_USER);
  });
});

// DELETE /v1/tournaments/{id} Test
// テスト項目
// 正常・ID無し
Deno.test("DELETE v1/tournaments/{id}:normal", async () => {
  const res = await ac.tournamentsDelete(data.id, { option: { dryRun: true } });
  assertTournamentDeleteRes(res.data, 200);
  assertTournament(res.data, data);
});
Deno.test("DELETE v1/tournaments/{id}:nothing tournament id", async () => {
  const res = await ac.tournamentsDelete(randomUUID(), {
    option: { dryRun: true },
  });
  assertTournamentDeleteRes(res.data, 400);
  assertEquals(res.data, errors.NOTHING_TOURNAMENT_ID);
});
Deno.test("DELETE v1/tournaments/{id}:normal by no dryRun", async () => {
  const res = await ac.tournamentsDelete(data.id);
  assertTournamentDeleteRes(res.data, 200);
  assertTournament(res.data, data);
});
