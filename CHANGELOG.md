# 変更履歴

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- CORSヘッダを追加(#46)

### Remove

- ビューア機能の提供を終了（[kakomimasu/viewer - Github](https://github.com/kakomimasu/viewer)に移行）

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
- 言葉の定義の変更：ルーム => ゲーム(コードによっては直っていない部分もあります。)
