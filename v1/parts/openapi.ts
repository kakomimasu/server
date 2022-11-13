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
    "/game/create": {
      operationId: "gameCreate",
      post: {
        responses: {
          200: {
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/OKResponse" },
                    {
                      type: "object",
                      required: ["data"],
                      properties: {
                        data: {
                          $ref: "#/components/schemas/Game",
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/game/boards": {
      operationId: "gameBoards",
      get: {
        responses: {
          200: {
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/OKResponse" },
                    {
                      type: "object",
                      required: ["data"],
                      properties: {
                        data: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/Board",
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
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
          "name",
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
              { "$ref": "#/components/schemas/Board" },
              { type: "null" },
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
              required: ["players"],
              properties: {
                players: {
                  type: "object",
                  required: ["point", "actions"],
                  properties: {
                    point: {
                      $ref: "#/components/schemas/Point",
                    },
                    actions: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["type", "agentId", "x", "y", "res"],
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
          operationSec: {
            type: "integer",
          },
          players: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "agents", "point", "type"],
              properties: {
                id: {
                  type: "string",
                },
                agents: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["x", "y"],
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
                  $ref: "#/components/schemas/Point",
                },
                type: {
                  type: "string",
                  enum: ["account", "guest"],
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
                  required: ["type", "player"],
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
              { type: "null" },
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
            enum: ["normal", "self", "personal"],
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
        required: ["areaPoint", "wallPoint"],
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
        required: ["screenName", "name", "id", "gameIds"],
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
      OKResponse: {
        type: "object",
        required: ["success"],
        properties: {
          success: {
            type: "boolean",
            enum: [true],
          },
        },
      },
    },
  },
} as const;

export const validator = new OpenAPIValidator(openapi);
