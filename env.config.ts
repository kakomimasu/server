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
  FIREBASE_TEST: { // firebase emulatorを使うかどうか
    require: false,
    default: "false",
  },
  FIREBASE_EMULATOR_HOST: {
    require: false,
    default: "localhost",
  },
  FIREBASE_USERNAME: { // firebase の管理者ユーザ名
    require: true,
  },
  FIREBASE_PASSWORD: { // firebase の管理者パスワード
    require: true,
  },
  VERSION: {
    require: false,
    default: "local",
  },
} as const satisfies {
  [key: string]: { require: true } | {
    require: false;
    default?: string;
  };
};
