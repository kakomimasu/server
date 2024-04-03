export const config = {
  PORT: { // サーバのポート
    require: false,
    default: "8880",
  },
  BOARDNAME: { // フリーマッチで使われるボード(指定なしでランダム)
    require: false,
  },
  DISCORD_WEBHOOK_URL: { // 予期しないエラーが発生したときにDiscordのチャンネルに投稿するようのWebhook URL
    require: false,
  },
  VERSION: {
    require: false,
    default: "local",
  },
  DENO_KV_ACCESS_TOKEN: {
    require: false,
  },
  GITHUB_CLIENT_ID: {
    require: false,
    default: "",
  },
  GITHUB_CLIENT_SECRET: {
    require: false,
    default: "",
  },
  TEST: {
    require: false,
    default: "false",
  },
} as const satisfies {
  [key: string]: { require: true } | {
    require: false;
    default?: string;
  };
};
