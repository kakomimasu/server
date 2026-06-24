# 囲みマス Server

## 概要

[Kakomimasu Core](https://github.com/codeforkosen/Kakomimasu)を使用した、囲みマスをオンラインで対戦するためのサーバです。

https://api.kakomimasu.com

## 環境変数

| 変数                 | 説明                                                                              | デフォルト |
| -------------------- | --------------------------------------------------------------------------------- | ---------- |
| PORT                 | リクエストを受信するポート                                                        | `"8880"`   |
| BOARDNAME            | フリーマッチで使われるボード<br>指定なしでランダムに選ばれる                      |            |
| DISCORD_WEBHOOK_URL  | 予期しないエラー発生時のDiscordチャンネルWebHook URL                              |            |
| VERSION              | 現在のバージョン名<br> `/version`アクセス時に使用される                           | `"local"`  |
| DATABASE_URL         | Prisma Postgres の接続文字列                                                      |            |
| GITHUB_CLIENT_ID     | GitHub OAuthログイン用<br>詳細は[こちら](https://deno.land/x/deno_kv_oauth)を参照 |            |
| GITHUB_CLIENT_SECRET | GitHub OAuthログイン用<br>詳細は[こちら](https://deno.land/x/deno_kv_oauth)を参照 |            |
| TEST                 | テスト時のフラグ                                                                  | `true`     |

※
`.env`ファイルが使用できます。([dotenv](https://deno.land/std/dotenv/mod.ts))<br>
※
`GITHUB_CLIENT_*`が未指定の場合、アカウントに関連する機能（BearerTokenを用いたAPI）は利用できません。ゲストモードによるゲーム参加は可能です。

## 開発者向け

### サーバ起動

```console
deno task prisma:generate
deno task prisma:push
deno task start
```

Prisma Client は [generated/prisma](generated/prisma) に生成されます。

### API定義

OpenAPIにて定義されています。

| API Version  | OpenAPI file                                | Document                                   |
| ------------ | ------------------------------------------- | ------------------------------------------ |
| `miyakonojo` | [openapi.ts](./miyakonojo/parts/openapi.ts) | https://kakomimasu.com/docs/api/miyakonojo |
| `tomakomai`  | [openapi.ts](./tomakomai/parts/openapi.ts)  | https://kakomimasu.com/docs/api/tomakomai  |
| `v1`         | [openapi.ts](./v1/parts/openapi.ts)         | https://kakomimasu.com/docs/api/v1         |

## 使用フィールド

[#procon30の公開フィールド](http://www.procon.gr.jp/?p=76585)他、独自フィールドが搭載されています。

## テスト

```
deno task test
```
