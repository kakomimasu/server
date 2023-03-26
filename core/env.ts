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

console.log(Colors.yellow("[env]\tCheck environment"));

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
});

// Deno.envを使った時にエラーを吐くようにする
const oldEnvGet = Deno.env.get;
const oldEnvSet = Deno.env.set;
const oldEnvToObject = Deno.env.toObject;
const oldEnvDelete = Deno.env.delete;
const deprecatedConsoleLog = (funcName: string) =>
  console.warn(
    Colors.red(`${funcName} is deprecated. Use 'core/env.ts' instead.`),
  );
Deno.env.get = (key) => {
  deprecatedConsoleLog("Deno.env.get");
  return oldEnvGet(key);
};
Deno.env.set = (key, value) => {
  deprecatedConsoleLog("Deno.env.set");
  return oldEnvSet(key, value);
};
Deno.env.delete = (key) => {
  deprecatedConsoleLog("Deno.env.delete");
  return oldEnvDelete(key);
};
Deno.env.toObject = () => {
  deprecatedConsoleLog("Deno.env.toObject");
  return oldEnvToObject();
};

// console.log(env);
console.log(Colors.green("[env]\tChecked environment"));
