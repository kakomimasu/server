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
  GOOGLE_APPLICATION_CREDENTIALS: { // Firebase Admin SDKの認証情報
    require: true,
  },
  FIREBASE_DATABASE_EMULATOR_HOST: { // Firebase Database emulatorのEmulator先を指定
    require: false,
  },
  FIREBASE_AUTH_EMULATOR_HOST: { // Firebase Auth emulatorのEmulator先を指定
    require: false,
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
