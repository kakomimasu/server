import { Colors, loadEnv } from "../deps.ts";

import { config } from "../env.config.ts";

type Env<T = typeof config> =
  | {
    [key in keyof T]: T[key] extends
      { readonly require: false; readonly default: string } ? string
      : T[key] extends { readonly require: true } ? string
      : string | undefined;
  }
  | never;

// console.log(Colors.yellow("[env]\tCheck environment"));

// Read dotenv file
loadEnv({ export: true });

// Check env
export const env = {} as Env;
Object.entries(config).forEach(([key, data]) => {
  const value = Deno.env.get(key);
  if (data.require && value === undefined) {
    throw Error(
      `The following variables are not defined in the environment or '.env' : ${key}`,
    );
  }

  // @ts-ignore configがas constのため
  env[key] = value ?? data.default;
  if (value === undefined && "default" in data) {
    Deno.env.set(key, value ?? data.default);
  }
});

// console.log(env);
console.log(Colors.green("[env]\tChecked environment"));
