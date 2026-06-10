### KV から Prisma Postgres への移行スクリプト

ゲーム、ユーザー、大会データだけをKVからエクスポートし、JSON経由でPrisma
Postgresに投入します。

このディレクトリで下記コマンドを実行することでできます

```console
deno run -A --env-file=.env ./import_kv_snapshot.ts
deno run -A --env-file=.env ./export_kv_snapshot.ts
```
