# API ドキュメント

## Data Dictionary

データ形式については以下のリンクをご覧ください。

[data dictionary](./data.md)

## Error Response

エラーレスポンスについては以下のリンクをご覧ください。

[Error Response](./error.md)

## Authorizationヘッダ

囲みマスAPIは、ゲームへの参加時、行動情報送信時、重要なユーザ情報を取得する際、ユーザを削除する際などに、ユーザ認証を必要とします。
ユーザ認証には、HTTPリクエストのAuthorizationヘッダを使用します。ユーザの種類、APIの種類によって必要な認証方法が異なります。

### Bearer認証

各ユーザには、BearerTokenと呼ばれる固有のトークンが割り当てられます。

認証が必要な大半のAPIはこのBearerTokenを使用します。

ビューア（kakomimasu.com）でログインした状態で[自身のユーザ詳細](https://kakomimasu.com/user/detail)を見ることでBearerTokenを得ることが出来ます。

Bearer認証を行うには以下のようなAuthorizationヘッダを含めます。

```
Authorization: Bearer ${BEARER_TOKEN}
```

`${BEARER_TOKEN}`には自身のBearerTokenを置き換えてください。

Bearer認証が必要なAPIは以下の通りです。

- [`users/delete`](./users_api.md#ユーザ削除) API

  ユーザ削除時の本人確認のため必須となります。
- [`match`](./match_api.md#ゲーム参加) API

  ゲーム参加時の本人確認のため必須となります。

- [`match/(gameId)/action`](./match_api.md#行動送信) API

  行動情報送信時の本人確認のため必須となります。

## API詳細

APIは以下のようにいくつかに分かれています。それぞれの詳細は各ページをご覧ください。

- [match API](./docs/match_api.md)

  試合関連のAPI（参加、情報取得、行動送信）

- [users API](./docs/users_api.md)

  ユーザ関連のAPI（ユーザ情報取得、削除など）

- [tournaments API](./docs/tournaments_api.md)

  大会関連のAPI（大会登録、大会削除など）

- [game API](./docs/game_api.md)

  ゲーム関連のAPI（ゲーム作成、ボード情報取得など）
