# 囲みマス Server

## 概要

[Kakomimasu Core](https://github.com/codeforkosen/Kakomimasu)を使用した、囲みマスをオンラインで対戦するためのサーバです。

https://api.kakomimasu.com

## 環境変数

| 変数                            | 説明                                                         | デフォルト |
| ------------------------------- | ------------------------------------------------------------ | ---------- |
| PORT                            | リクエストを受信するポート                                   | `"8880"`   |
| BOARDNAME                       | フリーマッチで使われるボード<br>指定なしでランダムに選ばれる |            |
| DISCORD_WEBHOOK_URL             | 予期しないエラー発生時のDiscordチャンネルWebHook URL         |            |
| FIREBASE_CONFIG                 | Firebaseサービスアカウント認証情報 ※1                        |            |
| FIREBASE_DATABASE_EMULATOR_HOST | Firebase Database emulatorの接続先を指定 ※2                  |            |
| FIREBASE_AUTH_EMULATOR_HOST     | Firebase Auth emulatorの接続先を指定 ※3                      |            |
| VERSION                         | 現在のバージョン名<br> `/version`アクセス時に使用される      | `"local"`  |

※ `.env`ファイルが使用できます。([dotenv](https://deno.land/std/dotenv/mod.ts))

※1
`FIREBASE_CONFIG`は[SDKを初期化する](https://firebase.google.com/docs/admin/setup?authuser=0&hl=ja#initialize-sdk)を参照

※2
`FIREBASE_DATABASE_EMULATOR_HOST`は[Database Emulatorへの接続方法](https://firebase.google.com/docs/emulator-suite/connect_rtdb?hl=ja)を参照

※3
`FIREBASE_AUTH_EMULATOR_HOST`は[Auth Emulatorへの接続方法](https://firebase.google.com/docs/emulator-suite/connect_auth?hl=ja)を参照

## 開発者向け

### サーバ起動

```console
deno task start
```

### Firebase Emulator起動

1. Firebase CLIをインストール（https://firebase.google.com/docs/cli）
1. エミュレータ起動

```
deno task firebase:emu
```

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

### 1. 環境変数を設定する

Firebase
Emulatorに接続するために、以下の環境変数と、`FIREBASE_CONFIG`の適切な設定が必要です。

```
FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

### 2a. `test`

```
deno task test
```

※Firebase Emulatorがすでに起動している必要あり

### 2b. `ci:test`

```
deno task ci:test
```

Firebase Emulatorの起動とテスト実行の両方を一括で行います。
