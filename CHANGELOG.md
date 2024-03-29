# 変更履歴

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v1.0.0-beta.7

### Added

- feat: サーバのバージョンを返すAPIを作る by @ninja03 in
  https://github.com/kakomimasu/server/pull/140
- feat: 存在しないパスにアクセスしたときのレスポンスを付ける by @ninja03 in
  https://github.com/kakomimasu/server/pull/139

### Changed

- fix(v1/ws): WebSocket APIの仕様・アルゴリズム変更 by @kamekyame in
  https://github.com/kakomimasu/server/pull/156
- Oakにしました by @ninja03 in https://github.com/kakomimasu/server/pull/123

### Fixed

- fix(v1): 起動時にfirebaseにログインするように変更 by @kamekyame in
  https://github.com/kakomimasu/server/pull/122
- Fix(v1): firebaseの型定義を追加しました by @kamekyame in
  https://github.com/kakomimasu/server/pull/124
- エラー処理修正 by @ninja03 in https://github.com/kakomimasu/server/pull/126
- fix(match):
  Action時にagentIDにかかわらず前回送信したアクションが削除される問題を修正 by
  @kamekyame in https://github.com/kakomimasu/server/pull/132
- fix(client):
  接続先が見つからない場合に例外ではなく適切な戻り値を返すように修正 by
  @kamekyame in https://github.com/kakomimasu/server/pull/133
- fix(v1): プレイヤーのエージェント情報が正しくrestoreされなかった問題を修正 by
  @kamekyame in https://github.com/kakomimasu/server/pull/135
- fix: versionが返されないバグを修正 by @kamekyame in
  https://github.com/kakomimasu/server/pull/142
- fix(user): サーバ開始時に既存のユーザを取得していないバグを修正 by @kamekyame
  in https://github.com/kakomimasu/server/pull/147
- fix: プレイヤー0のタイル情報が消えているバグを修正 by @kamekyame in
  https://github.com/kakomimasu/server/pull/150
- fix(v1/ws): Websocket接続でherokuにH15エラーで切断されるバグを修正 by
  @kamekyame in https://github.com/kakomimasu/server/pull/151

## v1.0.0-beta.6

### Added

- feat(match): ゲスト参加できるように改良 by @kamekyame in
  https://github.com/kakomimasu/server/pull/117
- fix(env): firebase emulatorのホスト名を環境変数で設定するように変更 by
  @kamekyame in https://github.com/kakomimasu/server/pull/111

### Fixed

- fix(docs): ドキュメントを更新 by @kamekyame in
  https://github.com/kakomimasu/server/pull/110

## v1.0.0-beta.5

### Added

- fix(v1): 500エラー時にDiscordにメッセージを送れるように by @kamekyame in
  https://github.com/kakomimasu/server/pull/107

### Fixed

- Deno 1.16.0に対応 by @kamekyame in
  https://github.com/kakomimasu/server/pull/87
- fix(docs): READMEのテストに関する記述を変更 by @kamekyame in
  https://github.com/kakomimasu/server/pull/100
- fix(parts): Realtime Databaseでnullが保存できないことに起因するバグを修正 by
  @kamekyame in https://github.com/kakomimasu/server/pull/102
- fix(v1): DBに存在しないボード名を取得したときの処理を追加 by @kamekyame in
  https://github.com/kakomimasu/server/pull/106
- fix(env): 環境変数の取扱いを整理 by @kamekyame in
  https://github.com/kakomimasu/server/pull/105

### Changed

- Format & Lint チェックのgh-actionsをkakomimasu.github.ioのものに変更 by
  @kamekyame in https://github.com/kakomimasu/server/pull/92
- GIthub actionsのテストでFirebaseのエミュレータを使用するように変更 by
  @kamekyame in https://github.com/kakomimasu/server/pull/95
- fix(match): ai戦に使用するaiをサブプロセスで動かさない方法に変更 by @kamekyame
  in https://github.com/kakomimasu/server/pull/104

## v1.0.0-beta.4

### Added

- `game/create`APIにマイゲーム作成オプションを追加

### Changed

- データの管理をRealtime Databaseに移行

## v1.0.0-beta.3

### Fixed

- `v1/types.ts`：`UserRegistReq`の`password`が必須になっていたバグを修正(#64)

## v1.0.0-beta.2

### Fixed

- (#52)にて変更した`/api/`パスの変更が正しく反映されていなかったバグを修正(#57)

## v1.0.0-beta.1

### Changed

- CORSヘッダを追加(#46)
- bump: std@0.108.0 -> std@110.0(#48)
- `/api/`パスを`/v1/`に変更(#52)

### Remove

- ビューア機能の提供を終了（[kakomimasu/viewer - Github](https://github.com/kakomimasu/viewer)に移行）(#47)

## ~release

#### 2020.3.3

- create Game API
  - リクエストデータ形式の変更
    - gameName => name

#### 2020.9.9

- apiにアクセスするURLの変更
  - /users/regist => /api/users/regist
  - /users/show/:userId => /api/users/show/:userId
  - /users/delete => /api/users/delete
  - /match => /api/match
  - /match/:roomId => /api/match/:roomId
  - /match/:roomId/action => /api/match/:roomId/action

#### 2020.8.13

- action API
  - リクエストデータ形式の変更
    - timeが無くなった
    - agentid => agentId
  - レスポンスデータ形式の変更
    - actionのオウム返しを無しに。
    - 代わりに`receptionUnixTime`と`turn`を返すように。
    - 詳しくはHackMDを見てね

#### 2020.8.4

- 事前にユーザ登録しないといけなくなった。
- それに伴い、match APIではユーザ名(またはユーザID)とパスワードが必要になった。
- match API
  - レスポンスJson Key変更：uuid => accessToken
  - レスポンスJson Key変更：name => userId
  - レスポンスJson Key変更：roomId => gameId
- match/:gameId API
  - レスポンスJson Key変更：roomID => gameId
  - レスポンスJson Key変更：players[i].playerID => players[i].id
- 言葉の定義の変更：ルーム =>
  ゲーム(コードによっては直っていない部分もあります。)
