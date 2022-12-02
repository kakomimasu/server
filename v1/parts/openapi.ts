// import { OpenAPIObject } from "../deps.ts";
import { OpenAPIValidator } from "../../util/openapi-validator.ts";

export const openapi = {
  // export const openapi: OpenAPIObject = {
  openapi: "3.1.1",
  info: {
    title: "Kakomimasu API",
    version: "0.1.0",
  },
  paths: {
    "/matches/{gameId}/players": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { "$ref": "#/components/schemas/MatchesRequestBase" },
                  { "$ref": "#/components/schemas/DryRunRequest" },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            "$ref": "#/components/responses/MatchesJoin",
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/matches/free/players": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { "$ref": "#/components/schemas/MatchesRequestBase" },
                  { "$ref": "#/components/schemas/DryRunRequest" },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            "$ref": "#/components/responses/MatchesJoin",
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/matches/ai/players": {
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                allOf: [
                  {
                    allOf: [{
                      "$ref": "#/components/schemas/MatchesRequestBase",
                    }, {
                      type: "object",
                      properties: {
                        aiName: {
                          type: "string",
                        },
                        boardName: {
                          type: "string",
                        },
                      },
                    }],
                  },
                  { "$ref": "#/components/schemas/DryRunRequest" },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            "$ref": "#/components/responses/MatchesJoin",
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/matches": {
      post: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/Game",
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/matches/{gameId}": {
      get: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/Game",
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/matches/{gameId}/actions": {
      post: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "receptionUnixTime",
                    "turn",
                  ],
                  properties: {
                    receptionUnixTime: {
                      type: "integer",
                    },
                    turn: {
                      type: "integer",
                    },
                  },
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/boards": {
      get: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    "$ref": "#/components/schemas/Board",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/tournaments": {
      get: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    "$ref": "#/components/schemas/Tournament",
                  },
                },
              },
            },
          },
        },
      },
      post: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/Tournament",
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/tournaments/{tournamentId}": {
      get: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/Tournament",
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
      delete: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/Tournament",
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/tournaments/{tournamentId}/users": {
      post: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/Tournament",
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/users/{userIdOrName}": {
      get: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/User",
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
      delete: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/User",
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
          "401": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/users": {
      get: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    "$ref": "#/components/schemas/User",
                  },
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
      post: {
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/User",
                },
              },
            },
          },
          "400": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Game: {
        type: "object",
        readOnly: true,
        required: [
          "board",
          "ending",
          "id",
          "gaming",
          "log",
          "operationSec",
          "players",
          "reservedUsers",
          "startedAtUnixTime",
          "tiled",
          "totalTurn",
          "transitionSec",
          "turn",
          "type",
        ],
        properties: {
          board: {
            oneOf: [
              {
                "$ref": "#/components/schemas/Board",
              },
              {
                type: "null",
              },
            ],
          },
          ending: {
            type: "boolean",
          },
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          gaming: {
            type: "boolean",
          },
          log: {
            type: "array",
            items: {
              type: "object",
              required: [
                "players",
              ],
              properties: {
                players: {
                  type: "array",
                  items: {
                    type: "object",
                    required: [
                      "point",
                      "actions",
                    ],
                    properties: {
                      point: {
                        "$ref": "#/components/schemas/Point",
                      },
                      actions: {
                        type: "array",
                        items: {
                          type: "object",
                          required: [
                            "type",
                            "agentId",
                            "x",
                            "y",
                            "res",
                          ],
                          properties: {
                            type: {
                              type: "integer",
                            },
                            agentId: {
                              type: "integer",
                            },
                            x: {
                              type: "integer",
                            },
                            y: {
                              type: "integer",
                            },
                            res: {
                              type: "integer",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          operationSec: {
            type: "integer",
          },
          players: {
            type: "array",
            items: {
              type: "object",
              required: [
                "id",
                "agents",
                "point",
                "type",
              ],
              properties: {
                id: {
                  type: "string",
                },
                agents: {
                  type: "array",
                  items: {
                    type: "object",
                    required: [
                      "x",
                      "y",
                    ],
                    properties: {
                      x: {
                        type: "integer",
                      },
                      y: {
                        type: "integer",
                      },
                    },
                  },
                },
                point: {
                  "$ref": "#/components/schemas/Point",
                },
                type: {
                  type: "string",
                  enum: [
                    "account",
                    "guest",
                  ],
                },
              },
            },
          },
          reservedUsers: {
            type: "array",
            items: {
              type: "string",
            },
          },
          startedAtUnixTime: {
            type: "integer",
            nullable: true,
          },
          tiled: {
            oneOf: [
              {
                type: "array",
                items: {
                  type: "object",
                  required: [
                    "type",
                    "player",
                  ],
                  properties: {
                    type: {
                      type: "integer",
                    },
                    player: {
                      type: "integer",
                      nullable: true,
                    },
                  },
                },
              },
              {
                type: "null",
              },
            ],
          },
          totalTurn: {
            type: "integer",
          },
          transitionSec: {
            type: "integer",
          },
          turn: {
            type: "integer",
          },
          type: {
            type: "string",
            enum: [
              "normal",
              "self",
              "personal",
            ],
          },
        },
      },
      Board: {
        type: "object",
        required: [
          "height",
          "nAgent",
          "name",
          "nPlayer",
          "nSec",
          "nTurn",
          "points",
          "width",
        ],
        properties: {
          height: {
            type: "integer",
          },
          nAgent: {
            type: "integer",
          },
          name: {
            type: "string",
          },
          nPlayer: {
            type: "integer",
          },
          nSec: {
            type: "integer",
          },
          nTurn: {
            type: "integer",
          },
          points: {
            type: "array",
            items: {
              type: "integer",
            },
          },
          width: {
            type: "integer",
          },
        },
      },
      Point: {
        type: "object",
        required: [
          "areaPoint",
          "wallPoint",
        ],
        properties: {
          areaPoint: {
            type: "integer",
          },
          wallPoint: {
            type: "integer",
          },
        },
      },
      User: {
        type: "object",
        required: [
          "screenName",
          "name",
          "id",
          "gameIds",
        ],
        properties: {
          screenName: {
            type: "string",
          },
          name: {
            type: "string",
          },
          id: {
            type: "string",
          },
          gameIds: {
            type: "array",
            items: {
              type: "string",
            },
          },
          bearerToken: {
            type: "string",
          },
        },
      },
      Tournament: {
        type: "object",
        required: [
          "id",
          "name",
          "organizer",
          "type",
          "remarks",
          "users",
          "gameIds",
        ],
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          organizer: {
            type: "string",
          },
          type: {
            type: "string",
            enum: [
              "round-robin",
              "knockout",
            ],
          },
          remarks: {
            type: "string",
          },
          users: {
            type: "array",
            items: {
              type: "string",
            },
          },
          gameIds: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
      MatchesRequestBase: {
        type: "object",
        properties: {
          spec: {
            type: "string",
          },
          guestName: {
            type: "string",
          },
        },
      },
      DryRunRequest: {
        type: "object",
        properties: {
          dryRun: {
            type: "boolean",
          },
        },
      },
    },
    responses: {
      "400": {
        description: "Failed",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "errorCode",
                "message",
              ],
              properties: {
                errorCode: {
                  type: "integer",
                },
                message: {
                  type: "string",
                },
              },
            },
          },
        },
      },
      MatchesJoin: {
        description: "Success",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "userId",
                "spec",
                "gameId",
                "index",
                "pic",
              ],
              properties: {
                userId: {
                  type: "string",
                },
                spec: {
                  type: "string",
                },
                gameId: {
                  type: "string",
                },
                index: {
                  type: "integer",
                },
                pic: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const validator = new OpenAPIValidator(openapi);
