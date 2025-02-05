// import { OpenAPIObject } from "openapi3-ts/oas30";
import { OpenAPIValidator } from "../../util/openapi-validator.ts";

export const openapi = {
  // export const openapi: OpenAPIObject = {
  openapi: "3.0.3",
  info: {
    title: "Kakomimasu API",
    version: "0.1.0",
  },
  paths: {
    "/matches/{gameId}/players": {
      post: {
        description:
          "指定したゲームIDのゲームに参加できます。<br>`guestName`を指定してゲスト参加する場合、認証情報は要りません。",
        summary: "ゲーム参加(ID指定)",
        tags: ["Matches API"],
        security: [{}, { "Bearer": [] }],
        parameters: [
          {
            in: "path",
            name: "gameId",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
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
        description:
          "空いているゲームに参加できます。（空いているゲームがない場合には新しくゲームが作られます。）<br>`guestName`を指定してゲスト参加する場合、認証情報は要りません。",
        summary: "ゲーム参加(フリー対戦)",
        tags: ["Matches API"],
        security: [{}, { "Bearer": [] }],
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
        description:
          "サーバ上のAIと対戦するゲームに参加できます。作成したプログラムの動作確認等に便利です。<br>なお、プレイヤー数は2で固定になります。<br>`guestName`を指定してゲスト参加する場合、認証情報は要りません。",
        summary: "ゲーム参加(AI対戦)",
        tags: ["Matches API"],
        security: [{}, { "Bearer": [] }],
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
                      required: ["aiName"],
                      properties: {
                        aiName: {
                          type: "string",
                          enum: ["none", "a1", "a2", "a3", "a4"],
                        },
                        boardName: {
                          type: "string",
                        },
                        nAgent: {
                          type: "integer",
                          description: "エージェント数",
                        },
                        totalTurn: {
                          type: "integer",
                          description: "ターン数",
                        },
                        operationSec: {
                          type: "integer",
                          description: "行動ステップ時間(秒)",
                        },
                        transitionSec: {
                          type: "integer",
                          description: "遷移ステップ時間(秒)",
                        },
                      },
                      example: {
                        aiName: "a1",
                        boardName: "A-1",
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
    "/matches/{gameId}": {
      get: {
        description: "ゲーム詳細を取得することができます。",
        summary: "ゲーム詳細取得",
        tags: ["Matches API"],
        parameters: [
          {
            in: "path",
            name: "gameId",
            required: true,
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
      patch: {
        description:
          "エージェントの行動を送信することができます。<br>同ターンに複数回送信した場合、そのエージェントIDの情報のみ書き変わり、その他のエージェントには影響しません。<br>そのため、一度送った行動情報を取り消したい場合には、そのエージェントに対してNONEを設定する必要があります。",
        summary: "ゲーム行動送信",
        tags: ["Matches API"],
        security: [{ PIC: [] }],
        parameters: [
          {
            in: "path",
            name: "gameId",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                allOf: [{
                  type: "object",
                  required: ["actions"],
                  properties: {
                    actions: {
                      type: "array",
                      description: "行動情報の配列",
                      items: {
                        oneOf: [{
                          type: "object",
                          required: ["agentId", "type", "x", "y"],
                          properties: {
                            agentId: {
                              type: "integer",
                              description:
                                "エージェントID<br>`players[].agents`配列のインデックス",
                            },
                            type: {
                              type: "string",
                              description: "行動種類",
                              enum: ["PUT", "MOVE", "REMOVE"],
                            },
                            x: {
                              type: "integer",
                              description: "x座標",
                            },
                            y: {
                              type: "integer",
                            },
                          },
                        }, {
                          type: "object",
                          required: ["agentId", "type"],
                          properties: {
                            agentId: {
                              type: "integer",
                              description:
                                "エージェントID<br>`players[].agents`配列のインデックス",
                            },
                            type: {
                              type: "string",
                              description: "行動種類",
                              enum: ["NONE"],
                            },
                          },
                        }],
                      },
                    },
                  },
                  example: {
                    "actions": [
                      { "agentId": 0, "type": "PUT", "x": 5, "y": 6 },
                      { "agentId": 1, "type": "NONE" },
                    ],
                  },
                }, { "$ref": "#/components/schemas/DryRunRequest" }],
              },
            },
          },
        },
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
                      description: "サーバにて受信した時刻(UNIX時間)",
                    },
                    turn: {
                      type: "integer",
                      description: "行動が適用されるターン",
                    },
                  },
                  example: {
                    "receptionUnixTime": 1616655464,
                    "turn": 0,
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
    "/matches": {
      post: {
        description: "任意の設定でゲームを作成することができます。",
        summary: "ゲーム作成",
        tags: ["Matches API"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                allOf: [{
                  type: "object",
                  required: ["boardName"],
                  properties: {
                    name: {
                      type: "string",
                      description: "ゲーム名",
                      pattern: ".+",
                    },
                    boardName: {
                      type: "string",
                      description:
                        "使用するボード名<br>使用できるボード名は[ボード情報取得API](#operation/getBoards)にて取得できます。",
                      pattern: ".+",
                    },
                    nPlayer: {
                      type: "integer",
                      description: "プレイヤー数（2~4、デフォルトは2人）。",
                    },
                    nAgent: {
                      type: "integer",
                      description: "エージェント数",
                    },
                    totalTurn: {
                      type: "integer",
                      description: "ターン数",
                    },
                    operationSec: {
                      type: "integer",
                      description: "行動ステップ時間(秒)",
                    },
                    transitionSec: {
                      type: "integer",
                      description: "遷移ステップ時間(秒)",
                    },
                    playerIdentifiers: {
                      type: "array",
                      description:
                        "ゲームに参加できるユーザを制限できます。<br>配列にはユーザネーム or ユーザIDを入れてください。",
                      items: {
                        type: "string",
                      },
                    },
                    tournamentId: {
                      type: "string",
                      description: "ゲームが所属する大会のID",
                    },
                    isPersonal: {
                      type: "boolean",
                      description:
                        "`true`に設定するとゲーム一覧には表示されずマイページからしか見れないプライベートなゲームを作成できます。",
                    },
                  },
                  example: {
                    "name": "〇〇vs△△",
                    "boardName": "A-1",
                  },
                }, { "$ref": "#/components/schemas/DryRunRequest" }],
              },
            },
          },
        },
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
    "/matches/stream": {
      get: {
        summary: "ゲーム詳細取得(SSE)",
        description:
          "試合情報をServer-Sent Eventsにてリアルタイムで取得できます。",
        tags: ["Matches API"],
        parameters: [
          {
            in: "query",
            name: "q",
            description: [
              "検索クエリ。`{key}:{value}`の形式で指定します。複数ある場合は半角スペースで区切ってください。",
              "例↓",
              "```",
              "sort:startAtUnixTime-ask is:wating type:normal",
              "```",
              "|key|value|",
              "|---|---|",
              "|`id`|ゲームIDを指定して取得できます。複数設定も可能です。|",
              "|`sort`|`startAtUnixTime-ask`, `startAtUnixTime-desc` : ゲーム開始時間によりソート|",
              "|`is`|`wating` : 開始待機中のゲームを取得。<br> `gaming` : 試合中のゲームを取得。<br>`ending` : 終了したゲームを取得|",
              "|`type`|`self` : カスタム対戦のゲームを取得。<br>`normal` : フリー対戦のゲームを取得。<br>`personal` : プライベートゲームを取得（Authorization ヘッダによる認証が必要）|",
            ].join("\n"),
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "startIndex",
            description: "検索クエリに一致するゲーム配列の取得開始インデックス",
            schema: { type: "integer" },
          },
          {
            in: "query",
            name: "endIndex",
            description: "検索クエリに一致するゲーム配列の取得終了インデックス",
            schema: { type: "integer" },
          },
          {
            in: "query",
            name: "allowNewGame",
            description:
              "検索クエリに一致する新しいゲームが作成された時に通知するか",
            schema: { type: "boolean" },
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "text/event-stream": {
                schema: {
                  type: "object",
                  oneOf: [
                    {
                      type: "object",
                      required: ["type", "games", "q", "gamesNum"],
                      properties: {
                        type: {
                          type: "string",
                          enum: ["initial"],
                          description: "API接続後、一番最初に来るレスポンス。",
                        },
                        games: {
                          type: "array",
                          description:
                            "リクエストにマッチするゲームがソート済みの配列で得られます。",
                          items: { "$ref": "#/components/schemas/Game" },
                        },
                        q: {
                          type: "string",
                          description: "検索クエリ",
                        },
                        gamesNum: {
                          type: "integer",
                          description:
                            "検索クエリにマッチするゲームの総数。（startIndex,endIndexの影響は受けません。）",
                        },
                        startIndex: {
                          type: "integer",
                          description: "開始インデックス",
                        },
                        endIndex: {
                          type: "integer",
                          description: "終了インデックス",
                        },
                      },
                    },
                    {
                      type: "object",
                      required: ["type", "game"],
                      properties: {
                        type: {
                          type: "string",
                          enum: ["update"],
                          description:
                            "条件にマッチしているゲームが更新された場合に来るレスポンス。",
                        },
                        game: {
                          "$ref": "#/components/schemas/Game",
                          description: "更新されたゲームの詳細",
                        },
                      },
                    },
                    {
                      type: "object",
                      required: ["type", "game"],
                      properties: {
                        type: {
                          type: "string",
                          enum: ["add"],
                          description:
                            "条件に新たにマッチしたゲームがある場合に来るレスポンス。",
                        },
                        game: {
                          "$ref": "#/components/schemas/Game",
                          description: "追加されるゲームの詳細",
                        },
                      },
                    },
                    {
                      type: "object",
                      required: ["type", "gameId"],
                      properties: {
                        type: {
                          type: "string",
                          enum: ["remove"],
                          description:
                            "`initial`や`add`で受信したゲームが条件を満たさなくなった場合に来るレスポンス。",
                        },
                        gameId: {
                          type: "string",
                          description: "削除されたゲームのID",
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
    "/boards": {
      get: {
        operationId: "getBoards",
        description: "使用可能なボード情報を取得できます。",
        summary: "ボード情報取得",
        tags: ["Boards API"],
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
        description: "大会情報を取得できます。",
        summary: "大会全情報取得",
        tags: ["Tournaments API"],
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
        description: "大会を作成することができます。",
        summary: "大会作成",
        tags: ["Tournaments API"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                allOf: [{
                  type: "object",
                  required: ["name", "type"],
                  properties: {
                    name: {
                      type: "string",
                      description: "大会名",
                      pattern: ".+",
                    },
                    type: {
                      type: "string",
                      description: "対戦種別",
                      enum: ["round-robin", "knockout"],
                    },
                    organizer: {
                      type: "string",
                      description: "主催者名",
                    },
                    remarks: {
                      type: "string",
                      description: "備考",
                    },
                    participants: {
                      type: "array",
                      description:
                        "参加者の配列<br>配列にはユーザネーム or ユーザIDを入れてください。",
                      items: {
                        type: "string",
                      },
                    },
                  },
                  example: {
                    "name": "囲みマス公式大会",
                    "type": "rount-robin",
                    "organizer": "Code for KOSEN",
                    "remarks": "2021年1月1日 13:00開始",
                    "participants": ["3c78387b-eb63-4b9a-b364-a7699c78e195"],
                  },
                }, { "$ref": "#/components/schemas/DryRunRequest" }],
              },
            },
          },
        },
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
        description: "大会情報を取得できます。",
        summary: "大会情報取得",
        tags: ["Tournaments API"],
        parameters: [
          {
            in: "path",
            name: "tournamentId",
            required: true,
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
        description: "大会を削除することができます。",
        summary: "大会削除",
        tags: ["Tournaments API"],
        parameters: [
          {
            in: "path",
            name: "tournamentId",
            required: true,
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
        description: "大会に参加するユーザを追加することができます。",
        summary: "大会参加ユーザ追加",
        tags: ["Tournaments API"],
        parameters: [
          {
            in: "path",
            name: "tournamentId",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                allOf: [{
                  type: "object",
                  required: ["user"],
                  properties: {
                    user: {
                      type: "string",
                      description: "追加するユーザのユーザネーム or ユーザID",
                      pattern: ".+",
                    },
                  },
                  example: {
                    "user": "3c78387b-eb63-4b9a-b364-a7699c78e195",
                  },
                }, { "$ref": "#/components/schemas/DryRunRequest" }],
              },
            },
          },
        },
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
    "/users/me": {
      get: {
        description: "自分のユーザ情報を取得できます。",
        summary: "ユーザ情報取得",
        tags: ["Users API"],
        security: [{ Bearer: [], Cookie: [] }],
        responses: {
          "200": {
            "$ref": "#/components/responses/AuthedUser",
          },
          "401": {
            "$ref": "#/components/responses/400",
          },
        },
      },
      delete: {
        description: "ユーザを削除することができます。",
        summary: "ユーザ削除",
        tags: ["Users API"],
        security: [{ Bearer: [], Cookie: [] }],
        parameters: [
          {
            in: "path",
            name: "userIdOrName",
            required: true,
            schema: {
              type: "string",
              description: "ユーザID or ユーザネーム",
            },
          },
        ],
        responses: {
          "200": {
            "$ref": "#/components/responses/AuthedUser",
          },
          "401": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/users/me/token": {
      get: {
        description:
          "ユーザのBearerTokenを再生成することができます。<br>⚠再生成が行われると、既存のBearerTokenは無効になります。",
        summary: "ユーザトークン再生成",
        tags: ["Users API"],
        security: [{ Bearer: [], Cookie: [] }],
        responses: {
          "200": {
            "$ref": "#/components/responses/AuthedUser",
          },
          "401": {
            "$ref": "#/components/responses/400",
          },
        },
      },
    },
    "/users/{userIdOrName}": {
      get: {
        description: "ユーザ情報を取得できます。",
        summary: "ユーザ情報取得",
        tags: ["Users API"],
        parameters: [
          {
            in: "path",
            name: "userIdOrName",
            required: true,
            schema: {
              type: "string",
              description: "ユーザID or ユーザネーム",
            },
          },
        ],
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
    "/users": {
      get: {
        description:
          "ユーザ一覧を取得できます。<br>現在はクエリパラメータを用いた検索機能のみ実装",
        summary: "ユーザ一覧取得",
        tags: ["Users API"],
        parameters: [
          {
            in: "query",
            name: "q",
            description:
              "検索クエリ<br>ユーザネームまたはユーザIDによる前方一致検索",
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
    },
  },
  components: {
    schemas: {
      Game: {
        type: "object",
        readOnly: true,
        required: [
          "status",
          "id",
          "log",
          "operationSec",
          "players",
          "reservedUsers",
          "startedAtUnixTime",
          "field",
          "totalTurn",
          "nPlayer",
          "nAgent",
          "transitionSec",
          "turn",
          "type",
        ],
        properties: {
          status: {
            type: "string",
            enum: ["free", "ready", "gaming", "ended"],
            description: "ゲームの状態",
          },

          id: {
            type: "string",
            description: "ゲームID",
          },
          name: {
            type: "string",
            description:
              "ゲーム名<br>フリー対戦など指定がない場合には空文字になります。",
          },
          log: {
            type: "array",
            description: "ターンごとのログ",
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
                        description: "行動履歴",
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
                              description:
                                "行動タイプ<br>各数字が以下のように対応<br>1: PUT, 2: NONE, 3: MOVE, 4: REMOVE",
                              enum: [1, 2, 3, 4],
                            },
                            agentId: {
                              type: "integer",
                              description:
                                "エージェントID<br>`players[].agents`の配列番号に対応",
                            },
                            x: {
                              type: "integer",
                              description: "行動先のx座標",
                            },
                            y: {
                              type: "integer",
                              description: "行動先のy座標",
                            },
                            res: {
                              type: "integer",
                              description:
                                "行動結果<br>各数字が以下のように対応<br>0: 成功, 1: 競合, 2: 無効, 3: 同じターンに複数の行動指示, 4: 存在しないエージェントへの指示, 5: 存在しない行動の指示",
                              enum: [0, 1, 2, 3, 4, 5],
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
            description: "行動ステップ時間(秒)",
          },
          players: {
            type: "array",
            description: "プレイヤー情報",
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
                  description: "プレイヤーID<br>ゲスト参加の場合はゲスト名",
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
                        description: "現在のエージェントx座標",
                      },
                      y: {
                        type: "integer",
                        description: "現在のエージェントy座標",
                      },
                    },
                  },
                },
                point: {
                  "$ref": "#/components/schemas/Point",
                },
                type: {
                  type: "string",
                  description: "プレイヤータイプ",
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
            description:
              "ゲーム入出可能なユーザIDのリスト<br>空の場合は誰でも入室可",
            items: {
              type: "string",
            },
          },
          startedAtUnixTime: {
            type: "integer",
            description: "ゲーム開始時刻(UNIX時間)",
            nullable: true,
          },
          field: {
            description: "フィールド情報<br>開始前は非公開(`null`)です。",
            oneOf: [{
              type: "object",
              required: [
                "width",
                "height",
                "points",
                "tiles",
              ],
              properties: {
                width: {
                  type: "integer",
                  description: "フィールドの幅",
                },
                height: {
                  type: "integer",
                  description: "フィールドの高さ",
                },
                points: {
                  type: "array",
                  items: {
                    type: "integer",
                  },
                  description: "各マスのポイント(1次元配列)",
                },
                tiles: {
                  description: "マスの状態(1次元配列)",
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
                        description:
                          "マスのタイプ。ただし`player`がnullの場合は値に関係なく空白マス。<br>各数字が以下のように対応<br>0: 陣地, 1: 壁",
                        enum: [0, 1],
                      },
                      player: {
                        type: "integer",
                        nullable: true,
                        description:
                          "マスを所持するプレイヤー番号(`players`の配列番号)。<br>`null`の場合は空白マス。",
                      },
                    },
                  },
                },
              },
            }, {
              type: "object",
            }],
          },
          totalTurn: {
            type: "integer",
            description: "ゲームの総ターン数",
          },
          nPlayer: {
            type: "integer",
            description: "参加プレイヤー数",
          },
          nAgent: {
            type: "integer",
            description: "エージェント数",
          },
          transitionSec: {
            type: "integer",
            description: "遷移ステップ時間(秒)",
          },
          turn: {
            type: "integer",
            description: "現在のターン数",
          },
          type: {
            type: "string",
            description: "ゲームタイプ",
            enum: [
              "normal",
              "self",
              "personal",
            ],
          },
        },
        example: {
          "board": {
            "name": "sample-board",
            "width": 3,
            "height": 3,
            "nAgent": 2,
            "nPlayer": 2,
            "nTurn": 30,
            "nSec": 3,
            "points": [1, -1, 1, -1, 3, -1, 1, -1, 1],
          },
          "ending": false,
          "id": "f0112f6a-6360-47bb-b431-bbc81e0926c0",
          "name": "sample-game",
          "gaming": false,
          "log": [
            {
              "players": [
                {
                  "point": { "areaPoint": 0, "wallPoint": 0 },
                  "actions": [
                    { "agentId": 0, "type": 1, "x": 0, "y": 0, "res": 0 },
                    { "agentId": 1, "type": 1, "x": 0, "y": 1, "res": 0 },
                  ],
                },
                {
                  "point": { "areaPoint": 0, "wallPoint": 1 },
                  "actions": [
                    { "agentId": 0, "type": 1, "x": 0, "y": 2, "res": 0 },
                    { "agentId": 1, "type": 1, "x": 0, "y": 3, "res": 5 },
                  ],
                },
              ],
            },
            {
              "players": [
                {
                  "point": { "areaPoint": 0, "wallPoint": -1 },
                  "actions": [
                    { "agentId": 0, "type": 3, "x": 1, "y": 0, "res": 0 },
                    { "agentId": 1, "type": 3, "x": 0, "y": 2, "res": 2 },
                  ],
                },
                {
                  "point": { "areaPoint": 0, "wallPoint": 1 },
                  "actions": [{
                    "agentId": 1,
                    "type": 3,
                    "x": 1,
                    "y": 4,
                    "res": 5,
                  }],
                },
              ],
            },
          ],
          "operationSec": 1,
          "players": [
            {
              "id": "bc7b10ae-c19f-4a6b-a7b9-d256f41c2583",
              "type": "account",
              "agents": [{ "x": 1, "y": 0 }, { "x": 0, "y": 1 }],
              "point": { "areaPoint": 0, "wallPoint": -1 },
            },
            {
              "id": "guest-user",
              "type": "guest",
              "agents": [{ "x": 0, "y": 2 }, { "x": -1, "y": -1 }],
              "point": { "areaPoint": 0, "wallPoint": 1 },
            },
          ],
          "reservedUsers": [],
          "startedAtUnixTime": 1638030666,
          "tiled": [
            { "type": 1, "player": 0 },
            { "type": 1, "player": 0 },
            { "type": 0, "player": null },
            { "type": 1, "player": 0 },
            { "type": 0, "player": null },
            { "type": 0, "player": null },
            { "type": 1, "player": 1 },
            { "type": 0, "player": null },
            { "type": 0, "player": null },
          ],
          "totalTurn": 30,
          "transitionSec": 1,
          "turn": 2,
          "type": "normal",
        },
      },
      Board: {
        type: "object",
        required: [
          "height",
          "name",
          "points",
          "width",
        ],
        properties: {
          height: {
            type: "integer",
            description: "フィールドの高さ",
          },
          nAgent: {
            type: "integer",
            description: "エージェント数",
          },
          name: {
            type: "string",
            description: "ボード名",
          },
          nPlayer: {
            type: "integer",
            description: "プレイヤー数",
          },
          transitionSec: {
            type: "integer",
            description: "遷移ステップの秒数",
          },
          operationSec: {
            type: "integer",
            description: "行動ステップの秒数",
          },
          totalTurn: {
            type: "integer",
            description: "総ターン数",
          },
          points: {
            type: "array",
            items: {
              type: "integer",
            },
            description: "各マスのポイント(1次元配列)",
          },
          width: {
            type: "integer",
            description: "フィールドの幅",
          },
        },
        example: {
          "board": {
            "name": "sample-board",
            "width": 3,
            "height": 3,
            "nAgent": 2,
            "nPlayer": 2,
            "nTurn": 30,
            "nSec": 3,
            "points": [1, -1, 1, -1, 3, -1, 1, -1, 1],
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
            description: "陣地ポイント",
          },
          wallPoint: {
            type: "integer",
            description: "壁ポイント",
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
          "avaterUrl",
        ],
        properties: {
          screenName: {
            type: "string",
            description: "表示名",
          },
          name: {
            type: "string",
            description: "ユーザ名。他の人と同じ名前にすることはできません。",
          },
          id: {
            type: "string",
            description: "ユーザID",
          },
          gameIds: {
            type: "array",
            description: "参加しているゲームのID",
            items: {
              type: "string",
            },
          },
          avaterUrl: {
            type: "string",
            description: "ユーザアイコンのURL",
          },
        },
        example: {
          "screenName": "A-1",
          "name": "a1",
          "id": "a92070bf-7f78-4c64-953b-189ddb44c159",
          "gameIds": [],
          "avaterUrl": [],
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
            description: "大会ID",
          },
          name: {
            type: "string",
            description: "大会名",
          },
          organizer: {
            type: "string",
            description: "主催者",
          },
          type: {
            type: "string",
            description: "大会種別",
            enum: [
              "round-robin",
              "knockout",
            ],
          },
          remarks: {
            type: "string",
            description: "備考",
          },
          users: {
            type: "array",
            description: "大会参加ユーザの配列",
            items: {
              type: "string",
            },
          },
          gameIds: {
            type: "array",
            description: "大会に含まれるゲーム",
            items: {
              type: "string",
            },
          },
        },
        example: {
          "name": "囲みマス公式大会",
          "organizer": "Code for KOSEN",
          "type": "round-robin",
          "remarks": "2021年1月1日 13:00開始",
          "id": "dc700f54-90a4-4a17-9346-c544213864e6",
          "users": ["3c78387b-eb63-4b9a-b364-a7699c78e195"],
          "gameIds": [],
        },
      },
      MatchesRequestBase: {
        type: "object",
        properties: {
          spec: {
            type: "string",
            description: "プレイヤーの紹介文<br>ゲームの進行には影響しません。",
          },
          guestName: {
            type: "string",
            description:
              "アカウントを作成せずに参加する際のプレイヤー名<br>認証情報がある場合、そちらが優先されます。",
          },
        },
        example: {
          spec: "機械学習で強化しました。",
          guestName: "John Doe",
        },
      },
      DryRunRequest: {
        type: "object",
        properties: {
          dryRun: {
            type: "boolean",
            description: "`true`にするとAPIのテストができます。",
          },
        },
      },
    },
    responses: {
      "400": {
        description: "パラメータやリクエストの不備",
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
                  description: "エラーコード",
                },
                message: {
                  type: "string",
                  description: "エラーメッセージ",
                },
              },
              example: {
                errorCode: 6,
                message: "invalid request",
              },
            },
          },
        },
      },
      "401": {
        description: "認証情報の不備",
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
                  description: "エラーコード",
                },
                message: {
                  type: "string",
                  description: "エラーメッセージ",
                },
              },
              example: {
                errorCode: 4,
                message: "unauthorized",
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
                  description: "参加プレイヤーのユーザID",
                },
                spec: {
                  type: "string",
                  description: "参加プレイヤーの紹介文",
                },
                gameId: {
                  type: "string",
                  description: "参加したゲームID",
                },
                index: {
                  type: "integer",
                  description:
                    "参加したゲームのインデックス<br>ゲーム詳細を取得した際の`players`配列内の自分のインデックスを表しています。",
                },
                pic: {
                  type: "string",
                  description:
                    "行動送信時に必要となるトークン(プレイヤー識別コード)",
                },
              },
              example: {
                "userId": "0cYf1k3rxI8dBoOw5qpgqtXmUnEK",
                "spec": "",
                "gameId": "833b167a-d40b-49e5-b0e2-9d3de3e8d532",
                "index": 0,
                "pic": "012345",
              },
            },
          },
        },
      },
      AuthedUser: {
        description: "Success",
        content: {
          "application/json": {
            schema: {
              allOf: [{ "$ref": "#/components/schemas/User" }, {
                type: "object",
                required: ["bearerToken"],
                properties: {
                  bearerToken: {
                    type: "string",
                    description: "BearerToken",
                  },
                },
                example: {
                  "bearerToken": "a92070bf-7f78-4c64-953b-189ddb44c159",
                },
              }],
            },
          },
        },
      },
    },
    securitySchemes: {
      Bearer: {
        type: "http",
        scheme: "bearer",
        description:
          "[マイページ](https://kakomimasu.com/user/detail)にて取得したBearerTokenを使用します。",
      },
      PIC: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description:
          "ゲーム参加時のレスポンスで得られるPIC(プレイヤー識別コード)を使用します。",
      },
    },
  },
} as const;

export const validator = new OpenAPIValidator(openapi);
