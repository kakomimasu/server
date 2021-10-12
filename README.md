# 囲みマス Server

## 概要

[Kakomimasu Core](https://github.com/codeforkosen/Kakomimasu)を使用した、囲みマスをオンラインで対戦するためのサーバです。実行には[Deno](https://deno.land/)がインストールされている必要があります。

## サーバ起動方法

```console
deno run -A server.ts
```

または、[`denon`](https://github.com/denosaurs/denon)がインストールされている場合、

```console
denon start
```

## 機能

- [APIサーバ](#apiサーバ)

### APIサーバ

ユーザ・試合などに関するAPIを提供しています。 仕様についてはAPIドキュメントをご覧ください

[API Document](./v1/docs/index.md)

### ビューア

ビューア機能の提供はv1.0.0-beta.1にて終了し、[kakomimasu/viewer - Github](https://github.com/kakomimasu/viewer)に移行しました。

## 使用フィールド

[#procon30の公開フィールド](http://www.procon.gr.jp/?p=76585)他、独自フィールドが搭載されています。

## ポート番号の変更方法

デフォルトでは`8880`番でサーバが起動します。変更するには`server.ts`と同じ場所に`.env`ファイルを作成し、以下のように内容を記述してください。

```sh
port=8881 # 任意のポート番号を指定
```

## テスト

サーバを起動した状態で下記を実行

```
deno test -A
```

### [act](https://github.com/nektos/act)を用いたGithub Actionsテスト

```
act
```
