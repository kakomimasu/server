# 囲みマス Server

## 概要

[Kakomimasu Core](https://github.com/codeforkosen/Kakomimasu)を使用した、囲みマスをオンラインで対戦するためのサーバです。実行には[Deno](https://deno.land/)がインストールされている必要があります。

## サーバ起動方法

```
deno run -A apiserver.ts
```

## 機能

- [APIサーバ](#apiサーバ)
- [ビューア](#ビューア)

### APIサーバ

ユーザ・試合などに関するAPIを提供しています。 仕様についてはAPIドキュメントをご覧ください

[API Document](./api/docs/index.md)

### ビューア

サーバで行われている試合などをリアルタイムに閲覧できるビューアを提供しています。

`http://localhost:{port}/`<br>
※`{port}`にはポート番号を入れてください。デフォルトは`8880`です。ポートの変更方法については[ポート番号の変更方法](#ポート番号の変更方法)をご覧ください。

詳細については[こちら](https://hackmd.io/@kakomimasu/official/%2FByIqvZx6_)をご覧ください。

## ポート番号の変更方法

デフォルトでは`8880`番でサーバが起動します。変更するには`server.ts`と同じ場所に`.env`ファイルを作成し、以下のように内容を記述してください。

```sh
port=8881 # 任意のポート番号を指定
```
