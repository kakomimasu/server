// import { OpenAPIObject } from "openapi3-ts/oas30";
import { OpenAPIValidator } from "../../util/openapi-validator.ts";

export const openapi = {
  // export const openapi: OpenAPIObject = {
  openapi: "3.0.0",
  info: {
    description: "",
    title: "囲みマス API",
    version: "都城",
  },
  paths: {
    "/matches": {
      get: {
        description:
          "下記の要素からなる配列を返す\n - 試合のID\n - 対戦相手の名前\n - 試合における自分のteamID(*各試合によって異なります*)\n - 試合のターン数\n - 試合の1ターンあたりの時間(ミリ秒)\n - 試合のターンとターンの間の時間(ミリ秒)\n\n 下記の場合にエラーを返します。\n - InvalidToken (401)\n   - トークンが間違っているもしくは存在しない場合",
        summary: "試合事前情報取得API",
        parameters: [
          {
            name: "Authorization",
            in: "header",
            description: "BearerToken",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    required: [
                      "id",
                      "intervalMillis",
                      "matchTo",
                      "teamID",
                      "turnMillis",
                      "turns",
                    ],
                    properties: {
                      id: {
                        description: "試合のID",
                        type: "string",
                      },
                      intervalMillis: {
                        description: "ターンとターンの間の時間(ミリ秒)",
                        type: "integer",
                      },
                      matchTo: {
                        description: "対戦相手の名前",
                        type: "string",
                      },
                      teamID: {
                        description: "pic",
                        type: "integer",
                      },
                      turnMillis: {
                        description: "1ターンあたりの時間(ミリ秒)",
                        type: "integer",
                      },
                      turns: {
                        description: "試合のターン数",
                        type: "integer",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Failure",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "status",
                  ],
                  properties: {
                    status: {
                      type: "string",
                      enum: [
                        "InvalidToken",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/matches/{id}": {
      get: {
        description:
          "試合に関する状態を取得するAPI\n 下記の場合にエラーを返します。\n - InvalidToken (401)\n   - トークンが間違っているもしくは存在しない場合\n - InvalidMatches (400)\n   - 参加していない試合へのリクエストの場合\n - TooEarly (400)\n   - 試合の開始前にアクセスした場合",
        summary: "試合状態取得API",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "Authorization",
            in: "header",
            description: "pic",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "actions",
                    "height",
                    "points",
                    "startedAtUnixTime",
                    "teams",
                    "tiled",
                    "turn",
                    "width",
                  ],
                  properties: {
                    actions: {
                      description: "試合での全エージェントの行動履歴",
                      type: "array",
                      items: {
                        allOf: [
                          {
                            type: "object",
                            required: [
                              "agentID",
                              "dx",
                              "dy",
                              "type",
                            ],
                            properties: {
                              agentID: {
                                description: "エージェントのID",
                                type: "integer",
                              },
                              dx: {
                                description: "行動をするx方向の向き",
                                type: "integer",
                              },
                              dy: {
                                description: "行動をするy方向の向き",
                                type: "integer",
                              },
                              type: {
                                "$ref": "#/components/schemas/ActionType",
                              },
                            },
                          },
                          {
                            type: "object",
                            required: [
                              "apply",
                              "turn",
                            ],
                            properties: {
                              apply: {
                                description:
                                  "-1: 不正な行動だった場合\n0: 他のエージェントと行動が競合していた場合\n1: 正常に処理された場合",
                                type: "number",
                                enum: [
                                  -1,
                                  0,
                                  1,
                                ],
                              },
                              turn: {
                                description: "行動を行ったターン",
                                type: "integer",
                              },
                            },
                          },
                        ],
                      },
                    },
                    height: {
                      description: "フィールドの縦幅",
                      type: "integer",
                    },
                    points: {
                      description: "フィールドのポイント情報",
                      type: "array",
                      items: {
                        type: "array",
                        items: {
                          type: "number",
                        },
                      },
                    },
                    startedAtUnixTime: {
                      description: "試合の始まったUnix時間",
                      type: "integer",
                    },
                    teams: {
                      description: "プレイヤー情報",
                      type: "array",
                      items: {
                        type: "object",
                        required: [
                          "agents",
                          "areaPoint",
                          "teamID",
                          "tilePoint",
                        ],
                        properties: {
                          agents: {
                            description: "エージェントの情報",
                            type: "array",
                            items: {
                              type: "object",
                              required: [
                                "agentID",
                                "x",
                                "y",
                              ],
                              properties: {
                                agentID: {
                                  description: "エージェントのID",
                                  type: "integer",
                                },
                                x: {
                                  description: "エージェントの現在のx座標",
                                  type: "integer",
                                },
                                y: {
                                  description: "エージェントの現在のy座標",
                                  type: "integer",
                                },
                              },
                            },
                          },
                          areaPoint: {
                            description: "領域ポイント",
                            type: "integer",
                          },
                          teamID: {
                            description: "pic",
                            type: "integer",
                          },
                          tilePoint: {
                            description: "タイルポイント",
                            type: "integer",
                          },
                        },
                      },
                    },
                    tiled: {
                      description:
                        "フィールドの現在の状況(空きマス: 0, プレイヤー青: 1 プレイヤー赤: 2",
                      type: "array",
                      items: {
                        type: "array",
                        items: {
                          type: "number",
                        },
                      },
                    },
                    turn: {
                      description: "状態が示しているターン",
                      type: "integer",
                    },
                    width: {
                      description: "フィールドの横幅",
                      type: "integer",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Failure",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "status",
                  ],
                  properties: {
                    startAtUnixTime: {
                      description: "試合の開始予定時間 UnixTime",
                      type: "integer",
                    },
                    status: {
                      type: "string",
                      enum: [
                        "InvalidMatches",
                        "TooEarly",
                      ],
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Failure",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "status",
                  ],
                  properties: {
                    status: {
                      type: "string",
                      enum: [
                        "InvalidToken",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/matches/{id}/action": {
      post: {
        description:
          "試合でのエージェントの行動を送信するAPI\n 下記の場合にエラーを返します。\n - InvalidToken (401)\n   - トークンが間違っているもしくは存在しない場合\n - InvalidMatches (400)\n   - 参加していない試合へのリクエストの場合\n - TooEarly (400)\n   - 試合の開始前にアクセスした場合\n - UnacceptableTime(400)\n   - インターバル中などTooEarly以外で回答の受付を行っていない時間にアクセスした場合",
        summary: "行動更新API",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
          {
            name: "Authorization",
            in: "header",
            description: "pic",
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "actions",
                ],
                properties: {
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      required: [
                        "agentID",
                        "dx",
                        "dy",
                        "type",
                      ],
                      properties: {
                        agentID: {
                          description: "エージェントのID",
                          type: "integer",
                        },
                        dx: {
                          description:
                            "行動をするx方向の向き (typeがputならばX座標)",
                          type: "integer",
                        },
                        dy: {
                          description:
                            "行動をするy方向の向き (typeがputならばY座標)",
                          type: "integer",
                        },
                        type: {
                          "$ref": "#/components/schemas/ActionType",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          required: true,
        },
        responses: {
          "201": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "actions",
                  ],
                  properties: {
                    actions: {
                      type: "array",
                      items: {
                        allOf: [
                          {
                            type: "object",
                            required: [
                              "agentID",
                              "dx",
                              "dy",
                              "type",
                            ],
                            properties: {
                              agentID: {
                                description: "エージェントのID",
                                type: "integer",
                              },
                              dx: {
                                description: "行動をするx方向の向き",
                                type: "integer",
                              },
                              dy: {
                                description: "行動をするy方向の向き",
                                type: "integer",
                              },
                              type: {
                                "$ref": "#/components/schemas/ActionType",
                              },
                            },
                          },
                          {
                            type: "object",
                            required: [
                              "turn",
                            ],
                            properties: {
                              turn: {
                                description: "受理したターン",
                                type: "integer",
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
          "400": {
            description: "Failure",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "status",
                  ],
                  properties: {
                    startAtUnixTime: {
                      description: "試合の開始予定時間 UnixTime",
                      type: "integer",
                    },
                    status: {
                      type: "string",
                      enum: [
                        "InvalidMatches",
                        "TooEarly",
                        "UnacceptableTime",
                      ],
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Failure",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "status",
                  ],
                  properties: {
                    status: {
                      type: "string",
                      enum: [
                        "InvalidToken",
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/ping": {
      get: {
        summary: "動作確認用API",
        parameters: [
          {
            name: "Authorization",
            in: "header",
            description: "BearerToken",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "status",
                  ],
                  properties: {
                    status: {
                      type: "string",
                      enum: [
                        "OK",
                      ],
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Failure",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "status",
                  ],
                  properties: {
                    status: {
                      type: "string",
                      enum: [
                        "InvalidToken",
                      ],
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
  servers: [
    {
      url: "//api.kakomimasu.com",
    },
  ],
  components: {
    schemas: {
      ActionType: {
        type: "string",
        enum: [
          "move",
          "remove",
          "stay",
          "put",
        ],
      },
    },
  },
} as const;

export const validator = new OpenAPIValidator(openapi);
