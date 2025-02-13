// import { OpenAPIObject } from "openapi3-ts/oas31";
import { OpenAPIValidator } from "../../util/openapi-validator.ts";

export const openapi = {
  // export const openapi: OpenAPIObject = {
  openapi: "3.0.0",
  info: {
    title: "囲みマス API",
    version: "苫小牧",
    description: "",
  },
  servers: [
    {
      url: "https://api.kakomimasu.com",
    },
  ],
  paths: {
    "/matches": {
      get: {
        summary: "試合一覧取得API",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/GetMatchesResponseOK",
                },
              },
            },
            headers: {
              "x-request-id": {
                schema: {
                  type: "string",
                  format: "uuid",
                },
                required: true,
                description: "リクエストごとに発行される一意なID",
              },
            },
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized",
          },
        },
        operationId: "get-matches",
        description:
          "試合の一覧を取得するためのエンドポイントです\n\n以下の場合にエラーを返します (優先度順)\n* 401\n  * リクエストにAPIトークンが含まれていない, または不正な場合",
        security: [
          {
            BearerToken: [],
          },
        ],
      },
    },
    "/matches/{matchID}": {
      parameters: [
        {
          schema: {
            type: "string",
          },
          name: "matchID",
          in: "path",
          required: true,
        },
      ],
      get: {
        summary: "試合状態取得API",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/GetMatchResponseOK",
                },
              },
            },
            headers: {
              "x-request-id": {
                schema: {
                  type: "string",
                  format: "uuid",
                },
                required: true,
                description: "リクエストごとに発行される一意なID",
              },
            },
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized",
          },
          "404": {
            "$ref": "#/components/responses/NotFound",
          },
          "425": {
            "$ref": "#/components/responses/TooEarly",
          },
        },
        operationId: "get-match",
        description:
          "試合中に試合の状態を取得するためのエンドポイントです\n\n以下の場合にエラーを返します (優先度順)\n* 401\n  * リクエストにAPIトークンが含まれていない, または不正な場合\n* 404\n  * 参加していない試合に対するリクエスト, また存在しない試合IDの場合\n* 425\n  * 試合開始前のリクエストの場合",
        security: [
          {
            PIC: [],
          },
        ],
      },
    },
    "/matches/{matchID}/action": {
      parameters: [
        {
          schema: {
            type: "string",
          },
          name: "matchID",
          in: "path",
          required: true,
        },
      ],
      post: {
        summary: "行動更新API",
        operationId: "post-action",
        responses: {
          "202": {
            description: "* 正常にリクエストが受理された場合",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/PostActionResponseOK",
                },
              },
            },
            headers: {
              "x-request-id": {
                schema: {
                  type: "string",
                  format: "uuid",
                },
                required: true,
                description: "リクエストごとに発行される一意なID",
              },
            },
          },
          "400": {
            description:
              "* ターンとターンの間の時間や試合終了後にアクセスした場合\n* リクエストの中に自分のエージェント以外を指定したアクションが含まれる場合",
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized",
          },
          "404": {
            "$ref": "#/components/responses/NotFound",
          },
          "422": {
            "$ref": "#/components/responses/UnprocessableEntity",
          },
          "425": {
            "$ref": "#/components/responses/TooEarly",
          },
        },
        description:
          "試合中にエージェントの行動を更新するためのエンドポイントです\n\n同一ターン中に複数回更新した場合は正常に受理された最後のリクエストが採用されます\n\n並列で更新をリクエストした場合は順序を保証しません\n\nリクエストに含まれていないエージェントの行動は停留となります\n\n以下の場合にエラーを返します (優先度順)\n* 401\n  * リクエストにAPIトークンが含まれていない, または不正な場合\n* 422\n  * リクエストがフォーマットに則ってない場合\n* 404\n  * 参加していない試合に対するリクエスト, また存在しない試合IDの場合\n* 425\n  * 試合開始前のリクエストの場合\n* 400\n  * 遷移ステップや試合終了後にアクセスした場合\n  * リクエストの中に自分のエージェント以外を指定したアクションが含まれる場合\n  * リクエストの中にエージェントIDが重複しているアクションが含まれる場合",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                "$ref": "#/components/schemas/PostActionRequest",
              },
            },
          },
        },
        security: [
          {
            PIC: [],
          },
        ],
      },
    },
    "/teams/me": {
      get: {
        summary: "チーム情報取得API",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/TeamInfo",
                },
              },
            },
            headers: {
              "x-request-id": {
                schema: {
                  type: "string",
                  format: "uuid",
                },
                required: true,
                description: "リクエストごとに発行される一意なID",
              },
            },
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized",
          },
        },
        operationId: "get-team-me",
        description:
          "自分のチーム情報を取得するエンドポイントです\n\n以下の場合にエラーを返します (優先度順)\n* 401\n  * リクエストにAPIトークンが含まれていない, または不正な場合\n",
        security: [
          {
            BearerToken: [],
          },
        ],
      },
    },
    "/teams/{teamID}/matches": {
      parameters: [
        {
          schema: {
            type: "string",
          },
          name: "teamID",
          in: "path",
          required: true,
        },
      ],
      get: {
        summary: "試合一覧取得API",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  "$ref": "#/components/schemas/GetMatchesResponseOK",
                },
              },
            },
            headers: {
              "x-request-id": {
                schema: {
                  type: "string",
                  format: "uuid",
                },
                required: true,
                description: "リクエストごとに発行される一意なID",
              },
            },
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized",
          },
          "403": {
            "$ref": "#/components/responses/Forbidden",
          },
        },
        operationId: "get-team-matches",
        description:
          "試合開始前に自分に関連する試合の一覧を取得するためのエンドポイントです\n\n以下の場合にエラーを返します (優先度順)\n* 401\n  * リクエストにAPIトークンが含まれていない, または不正な場合\n* 403\n  * APIトークンと異なるチームのリソースにアクセスした場合",
        security: [
          {
            BearerToken: [],
          },
        ],
      },
    },
  },
  components: {
    schemas: {
      ActionPosX: {
        description:
          "行動の対象となるX座標(左から1とする), 行動種別が停留の場合のみ0が許容される",
        type: "integer",
      },
      ActionPosY: {
        description:
          "行動の対象となるY座標(上から1とする), 行動種別が停留の場合のみ0が許容される",
        type: "integer",
      },
      ActionResult: {
        description: "行動の結果(無効: -1, 競合: 0, 適用: 1)",
        type: "integer",
        enum: [
          -1,
          0,
          1,
        ],
      },
      ActionType: {
        description:
          "行動種別(配置: put, 停留: stay, 移動: move, 除去: remove)",
        type: "string",
        enum: [
          "put",
          "stay",
          "move",
          "remove",
        ],
      },
      AgentPosX: {
        description:
          "エージェントの現在のX座標(左から1とする), 未配置の場合は0",
        type: "integer",
      },
      AgentPosY: {
        description:
          "エージェントの現在のY座標(上から1とする), 未配置の場合は0",
        type: "integer",
      },
      GetMatchResponseOK: {
        type: "object",
        properties: {
          turn: {
            description: "現在のターン (初期状態は0ターン目とする)",
            type: "integer",
          },
          startedAtUnixTime: {
            description: "試合が始まったUnix時間",
            type: "integer",
          },
          width: {
            description: "競技ボードの横幅",
            type: "integer",
          },
          height: {
            description: "競技ボードの縦幅",
            type: "integer",
          },
          teams: {
            type: "array",
            description: "チームの情報",
            items: {
              "$ref": "#/components/schemas/Team",
            },
          },
          walls: {
            type: "array",
            description:
              "現在の城壁の状況(城壁以外のマス: 0, 城壁が築かれているマス: teamsの対応するチームのインデックス+1)",
            items: {
              type: "array",
              items: {
                type: "integer",
              },
            },
          },
          areas: {
            type: "array",
            description:
              "現在の陣地の状況(陣地以外のマス: 0, 陣地になっているマス: teamsの対応するチームのインデックス+1)",
            items: {
              type: "array",
              items: {
                type: "integer",
              },
            },
          },
          points: {
            type: "array",
            description: "競技ボードのポイント情報",
            items: {
              type: "array",
              items: {
                type: "integer",
              },
            },
          },
          actions: {
            description:
              "これまでのターンの全エージェントの最終行動履歴\n\n行動が指定されなかったエージェントの最終行動は停留となります (明示的に停留したときと区別できるように結果が無効, つまりapply=-1になります)\n\n(turn, agentID)で昇順にソートされて返されます",
            type: "array",
            items: {
              "$ref": "#/components/schemas/Action",
            },
          },
        },
        required: [
          "turn",
          "startedAtUnixTime",
          "width",
          "height",
          "teams",
          "walls",
          "areas",
          "points",
          "actions",
        ],
      },
      Team: {
        type: "object",
        properties: {
          teamID: {
            description:
              "チーム（ユーザ）のPIC\n\n相手チームは「0」で固定されます。",
            type: "number",
          },
          agent: {
            description: "エージェントの数",
            type: "integer",
          },
          agents: {
            description: "エージェントの位置情報",
            type: "array",
            items: {
              "$ref": "#/components/schemas/Agent",
            },
          },
          areaPoint: {
            description: "陣地ポイント",
            type: "integer",
          },
          wallPoint: {
            description: "城壁ポイント",
            type: "integer",
          },
        },
        required: [
          "teamID",
          "agent",
          "agents",
          "areaPoint",
          "wallPoint",
        ],
      },
      Agent: {
        type: "object",
        properties: {
          x: {
            "$ref": "#/components/schemas/AgentPosX",
          },
          y: {
            "$ref": "#/components/schemas/AgentPosY",
          },
          agentID: {
            description: "エージェントのID",
            type: "integer",
          },
        },
        required: [
          "x",
          "y",
          "agentID",
        ],
      },
      Action: {
        type: "object",
        properties: {
          x: {
            "$ref": "#/components/schemas/ActionPosX",
          },
          y: {
            "$ref": "#/components/schemas/ActionPosY",
          },
          type: {
            "$ref": "#/components/schemas/ActionType",
          },
          turn: {
            description: "行動を行ったターン",
            type: "integer",
          },
          agentID: {
            description: "行動を行ったエージェントのID",
            type: "integer",
          },
          apply: {
            "$ref": "#/components/schemas/ActionResult",
          },
        },
        required: [
          "x",
          "y",
          "type",
          "turn",
          "agentID",
          "apply",
        ],
      },
      GetMatchesResponseOK: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            description: "自分に関連する試合情報",
            items: {
              "$ref": "#/components/schemas/Match",
            },
          },
        },
        required: [
          "matches",
        ],
      },
      Match: {
        type: "object",
        properties: {
          matchID: {
            description: "試合のID",
            type: "string",
          },
          teams: {
            description:
              "試合に参加するチームの情報\n1番目が自チーム, 2番目以降が相手チームとなる\n",
            type: "array",
            items: {
              "$ref": "#/components/schemas/TeamInfo",
            },
          },
          turns: {
            description: "試合のターン数",
            type: "integer",
          },
          operationMillis: {
            description: "作戦ステップの時間(ミリ秒)",
            type: "integer",
          },
          transitionMillis: {
            description: "遷移ステップの時間(ミリ秒)",
            type: "integer",
          },
        },
        required: [
          "matchID",
          "teams",
          "turns",
          "operationMillis",
          "transitionMillis",
        ],
      },
      PostActionRequest: {
        type: "object",
        properties: {
          actions: {
            description: "行動",
            type: "array",
            items: {
              "$ref": "#/components/schemas/ActionRequest",
            },
          },
        },
        required: [
          "actions",
        ],
      },
      ActionRequest: {
        type: "object",
        properties: {
          x: {
            "$ref": "#/components/schemas/ActionPosX",
          },
          y: {
            "$ref": "#/components/schemas/ActionPosY",
          },
          type: {
            "$ref": "#/components/schemas/ActionType",
          },
          agentID: {
            description: "行動するエージェントのID",
            type: "integer",
          },
        },
        required: [
          "x",
          "y",
          "type",
          "agentID",
        ],
      },
      PostActionResponseOK: {
        type: "object",
        required: [
          "actions",
        ],
        properties: {
          actions: {
            description: "受理された行動",
            type: "array",
            items: {
              "$ref": "#/components/schemas/ActionResponse",
            },
          },
        },
      },
      ActionResponse: {
        type: "object",
        required: [
          "x",
          "y",
          "turn",
          "agentID",
          "type",
        ],
        properties: {
          x: {
            "$ref": "#/components/schemas/ActionPosX",
          },
          y: {
            "$ref": "#/components/schemas/ActionPosY",
          },
          type: {
            "$ref": "#/components/schemas/ActionType",
          },
          turn: {
            description: "受理されたターン",
            type: "integer",
          },
          agentID: {
            description: "行動するエージェントのID",
            type: "integer",
          },
        },
      },
      TeamInfo: {
        description: "チーム（ユーザ）の情報",
        type: "object",
        required: [
          "teamID",
          "name",
        ],
        properties: {
          teamID: {
            description:
              "チーム（ユーザ）のゲーム別PIC\n\n相手チームやチーム情報取得APIでは「0」になります。",
            type: "integer",
          },
          name: {
            description: "チーム（ユーザ）のID\n\nゲストユーザの場合はユーザ名",
            type: "string",
          },
        },
      },
    },
    securitySchemes: {
      BearerToken: {
        name: "x-api-token",
        type: "apiKey",
        in: "header",
      },
      PIC: {
        name: "x-api-token",
        type: "apiKey",
        in: "header",
        description:
          "個人識別コード（Personal Identification Code）\n\n試合状態取得APIにて各ゲームに対応するPICを取得できます。",
      },
    },
    responses: {
      NotFound: {
        description:
          "* 参加していない試合に対するリクエスト, また存在しない試合IDの場合",
        headers: {
          "x-request-id": {
            schema: {
              type: "string",
              format: "uuid",
            },
            required: true,
            description: "リクエストごとに発行される一意なID",
          },
        },
      },
      Forbidden: {
        description: "* APIトークンと異なるチームのリソースにアクセスした場合",
        headers: {
          "x-request-id": {
            schema: {
              type: "string",
              format: "uuid",
            },
            required: true,
            description: "リクエストごとに発行される一意なID",
          },
        },
      },
      Unauthorized: {
        description:
          "* リクエストにAPIトークンが含まれていない, または不正な場合",
      },
      UnprocessableEntity: {
        description: "* リクエストがフォーマットに則ってない場合",
        headers: {
          "x-request-id": {
            schema: {
              type: "string",
              format: "uuid",
            },
            required: true,
            description: "リクエストごとに発行される一意なID",
          },
        },
      },
      TooEarly: {
        description: "* 試合開始前のリクエストの場合",
        headers: {
          "retry-after": {
            schema: {
              type: "integer",
            },
            description: "試合開始までの秒数",
          },
          "x-request-id": {
            schema: {
              type: "string",
              format: "uuid",
            },
            required: true,
            description: "リクエストごとに発行される一意なID",
          },
        },
      },
    },
  },
} as const;

export const validator = new OpenAPIValidator(openapi);
