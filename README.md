# 囲みマス Server

## 概要

[Kakomimasu Core](https://github.com/codeforkosen/Kakomimasu)を使用した、囲みマスをオンラインで対戦するためのサーバです。実行には[Deno](https://deno.land/)(v1.20以降)がインストールされている必要があります。

## サーバ起動方法

```console
deno task start
```

## 環境変数

環境変数はサーバ起動時にシステム変数と`.env`ファイルの両方から読み込みます。
使用可能な環境変数については[envconfig.yml](envconfig.yml)をご覧ください。

## 機能

- [APIサーバ](#apiサーバ)

### APIサーバ

ユーザ・試合などに関するAPIを提供しています。 仕様についてはAPIドキュメントをご覧ください

[API Document](https://kakomimasu.com/docs/api/v1)

### ビューア

ビューア機能の提供はv1.0.0-beta.1にて終了し、[kakomimasu/viewer - Github](https://github.com/kakomimasu/viewer)に移行しました。

## 使用フィールド

[#procon30の公開フィールド](http://www.procon.gr.jp/?p=76585)他、独自フィールドが搭載されています。

## ポート番号の変更方法

デフォルトでは`8880`番でサーバが起動します。変更するには`server.ts`と同じ場所に`.env`ファイルを作成し、以下のように内容を記述してください。

```sh
PORT=8881 # 任意のポート番号を指定
```

## テスト

テスト時にはFirebase Emulatorとserverが立ち上がっている必要があります。以下の2種類の方法で行うことができます。

### ローカルでサーバを立てる方法(actを使わない方法)

#### 1. Firebase emulatorをDockerで起動する

```console
$ docker pull ghcr.io/kakomimasu/firebase-emulator:latest
$ docker run -p 4000:4000 -p 8080:8080 -p 9000:9000 -p 9099:9099 -d --name firebase-emu firebase-emu:latest
```

#### 2. server起動

```console
$ deno task start
```

#### 3. テスト

```console
$ deno task test
```

### [act](https://github.com/nektos/act)を用いた方法

事前に[act](https://github.com/nektos/act)をインストールしておく必要があります。

#### 1. Firebase emulatorをDockerで起動する

```console
$ docker pull ghcr.io/kakomimasu/firebase-emulator:latest
$ docker run -p 4000:4000 -p 8080:8080 -p 9000:9000 -p 9099:9099 -d --name firebase-emu firebase-emu:latest
```

#### 2. act実行

```console
$ act
```

# メモ

ここからは開発者用のメモです。

## リリース時

- CHANGELOG.mdの変更
- CHANGELOG.mdに追記した文をReleaseにも追加
