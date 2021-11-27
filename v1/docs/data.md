# Data dictionary

## Game

#### 例

```JSON
{
  "board": {
    "name": "sample-board",
    "width": 3,
    "height": 3,
    "nAgent": 2,
    "nPlayer": 2,
    "nTurn": 30,
    "nSec": 3,
    "points": [1, -1, 1, -1, 3, -1, 1, -1, 1]
  },
  "ending": false,
  "gameId": "f0112f6a-6360-47bb-b431-bbc81e0926c0",
  "gameName": "sample-game",
  "gaming": false,
  "log": [
    {
      "players": [
        {
          "point": { "basepoint": 0, "wallpoint": 0 },
          "actions": [
            { "agentId": 0, "type": 1, "x": 0, "y": 0, "res": 0 },
            { "agentId": 1, "type": 1, "x": 0, "y": 1, "res": 0 }
          ]
        },
        {
          "point": { "basepoint": 0, "wallpoint": 1 },
          "actions": [
            { "agentId": 0, "type": 1, "x": 0, "y": 2, "res": 0 },
            { "agentId": 1, "type": 1, "x": 0, "y": 3, "res": 5 }
          ]
        }
      ]
    },
    {
      "players": [
        {
          "point": { "basepoint": 0, "wallpoint": -1 },
          "actions": [
            { "agentId": 0, "type": 3, "x": 1, "y": 0, "res": 0 },
            { "agentId": 1, "type": 3, "x": 0, "y": 2, "res": 2 }
          ]
        },
        {
          "point": { "basepoint": 0, "wallpoint": 1 },
          "actions": [{ "agentId": 1, "type": 3, "x": 1, "y": 4, "res": 5 }]
        }
      ]
    }
  ],
  "nextTurnUnixTime": 1638030672,
  "players": [
    {
      "id": "bc7b10ae-c19f-4a6b-a7b9-d256f41c2583",
      "agents": [{ "x": 1, "y": 0 }, { "x": 0, "y": 1 }],
      "point": { "basepoint": 0, "wallpoint": -1 }
    },
    {
      "id": "fdc9c2e0-1feb-4334-ad44-9268cde6d488",
      "agents": [{ "x": 0, "y": 2 }, { "x": -1, "y": -1 }],
      "point": { "basepoint": 0, "wallpoint": 1 }
    }
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
    { "type": 0, "player": null }
  ],
  "totalTurn": 30,
  "turn": 2,
  "type": "normal"
}
```

| Name                              | Type                        | Discription                                                                                                    |
| --------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `board`                           | [Board](#Board) &#124; null | ゲームで使用されるボード情報<br>ゲームが開始するまでは非公開(null)です。                                                                      |
| `ending`                          | boolean                     | ゲームが終了したかどうか                                                                                                   |
| `gameId`                          | string                      | ゲームID                                                                                                          |
| `gameName`                        | string                      | ゲーム名                                                                                                           |
| `gaming`                          | boolean                     | ゲーム中かどうか                                                                                                       |
| `log`                             | array                       | ゲームのログ<br>ターンごとの配列になっています                                                                                      |
| `log[].players`                   | array                       | そのターンでのプレイヤーのログ。プレイヤー順は`players`と同じ                                                                            |
| `log[].players.point`             | object                      | そのターンでのプレイヤーの点数<br> `basepoint`は陣地ポイント、`wallpoint`は壁ポイント                                                       |
| `log[].players.actions`           | array                       | そのターンでのプレイヤーの行動情報と結果                                                                                           |
| `log[].players.actions[].agentId` | number                      | エージェントID。`players[].agemts`の配列番号                                                                               |
| `log[].players.actions[].type`    | number                      | 行動タイプ<br> `1`:PUT、`2`:NONE、`3`:MOVE、`4`:REMOVE                                                                 |
| `log[].players.actions[].x`       | number                      | 行動先のx座標                                                                                                        |
| `log[].players.actions[].y`       | number                      | 行動先のy座標                                                                                                        |
| `log[].players.actions[].res`     | number                      | 行動結果。`0`以外は何らかの原因により失敗した場合になります。<br> `0`:成功、`1`:競合、`2`:無効、`3`:同じターンに複数の行動指示、`4`:存在しないエージェントへの指示、`5`:存在しない行動の指示 |
| `nextTurnUnixTime`                | number                      | 次のターンが始まるUnix時刻                                                                                                |
| `players`                         | array                       | プレイヤー情報の配列                                                                                                     |
| `players[].id`                    | string                      | ユーザID                                                                                                          |
| `players[].agents`                | array                       | エージェントの情報。<br>x,y座標を取得できる。                                                                                     |
| `players[].point`                 | string                      | ポイント情報<br> `basepoint`は陣地ポイント、`wallpoint`は壁ポイントで、この2つを合計したものがそのプレイヤーの総得点となる                                    |
| `reservedUsers`                   | string[]                    | ゲームに入室可能なユーザIDのリスト。空の場合は誰でも入室可能                                                                                |
| `startedAtUnixTime`               | number                      | ゲーム開始Unix時刻                                                                                                    |
| `tiled`                           | array                       | フィールドの状態(壁・陣地・どのプレイヤーのマスかなど)。ゲームの開始前は非公開(null)です。<br>各要素はboard.pointsと対応                                       |
| `tiled[].type`                    | number                      | マスの種類。※`player`が`null`の場合は空白マス<br> `0`:陣地、`1`:壁                                                                |
| `tiled[].player`                  | number &#124; null          | マスを所持するプレイヤー。`players`の配列番号<br>※`null`の場合は空白マス                                                                 |
| `totalTurn`                       | number                      | 非推奨(Board情報内の`nTurn`を使用してください)<br>このゲームの総ターン                                                                   |
| `turn`                            | number                      | 現在のターン                                                                                                         |

---

## Board

#### 例

```JSON
{
  "height": 3,
  "nAgent": 2,
  "name": "sample-board",
  "nPlayer": 2,
  "nSec": 3,
  "nTurn": 30,
  "points": [1, -1, 1, -1, 3, -1, 1, -1, 1],
  "width": 3
}
```

| Name      | Type     | Discription |
| --------- | -------- | ----------- |
| `height`  | number   | フィールドの高さ    |
| `nAgent`  | number   | エージェントの数    |
| `name`    | string   | ボード名        |
| `nPlayer` | number   | プレイヤーの数     |
| `nSec`    | number   | 1ターンの秒数     |
| `nTurn`   | number   | ターン数        |
| `points`  | number[] | ポイント(配列)    |
| `width`   | number   | フィールドの幅     |

---

## User

#### 例

```JSON
{
  "screenName": "A-1",
  "name": "a1",
  "id": "a92070bf-7f78-4c64-953b-189ddb44c159",
  "gamesId": [],
  "bearerToken": ""
}
```

| Name               | Type     | Discription                                      |
| ------------------ | -------- | ------------------------------------------------ |
| `screenName`<br>必須 | string   | 表示名                                              |
| `name`<br>必須       | string   | 名前<br>※他のユーザと被ることのない固有の名前ですが、ユーザにより変更される場合があります。 |
| `id`               | string   | ID<br>※ユーザ固有のIDです。他のユーザと被ることはなく、変更されることもありません。   |
| `gamesId`          | string[] | ユーザが参加したゲームIDのリスト                                |
| `password`         | string   | パスワード<br>※Basic認証またはBearer認証が必要です。               |
| `bearerToken`      | string   | BearerToken<br>※Bearer認証が必要です。                   |

---

## Tournament

#### 例

```JSON
{
  "name": "囲みマス公式大会",
  "organizer": "Code for KOSEN",
  "type": "round-robin",
  "remarks": "2021年1月1日 13:00開始",
  "id": "dc700f54-90a4-4a17-9346-c544213864e6",
  "users": ["3c78387b-eb63-4b9a-b364-a7699c78e195"],
  "gameIds": []
}
```

| Name              | Type     | Discription                                            |
| ----------------- | -------- | ------------------------------------------------------ |
| `name`<br>必須      | string   | 大会名                                                    |
| `organizer`<br>必須 | string   | 大会主催者                                                  |
| `type`<br>必須      | string   | 対戦種別<br> `round-robin`(総当たり戦)又は`knockout`(勝ち残り戦)が入ります。 |
| `remarks`<br>必須   | string   | 備考                                                     |
| `id`              | string   | 大会ID<br>※固有のIDです。他の大会と被ることはなく、変更されることもありません。           |
| `users`           | string[] | 大会参加ユーザのIDが配列になっています。                                  |
| `gameIds`         | string[] | この大会主催の元開かれたゲームのIDが配列になっています。                          |
