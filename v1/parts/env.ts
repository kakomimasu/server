import { Colors, config, yamlParse } from "../../deps.ts";

import { pathResolver } from "../util.ts";

const resolve = pathResolver(import.meta);

type Config = Record<string, {
  require: boolean;
  default?: string;
}>;

console.log(Colors.yellow("[env]\tCheck environment"));

// Read config file
const envConfig = yamlParse(getConfigStr()) as Config;
//console.log(envConfig);
function getConfigStr() {
  try {
    return Deno.readTextFileSync(resolve("../../envconfig.yml"));
  } catch (_) {
    throw Error("There is no envconfig.yml");
  }
}

// Read dotenv file
config({
  path: resolve("../../.env"),
  export: true,
  //defaults: resolve("../../.env.default"),
});

// Check env
export const reqEnv: Record<string, string> = {};
export const nonReqEnv: Record<string, string | undefined> = {};
Object.entries(envConfig).forEach(([key, { require, default: def }]) => {
  const value = Deno.env.get(key);
  if (require) {
    if (value) reqEnv[key] = value;
    else {
      throw Error(
        `The following variables are not defined in the environment or '.env' : ${key}`,
      );
    }
  } else {
    if (def !== undefined) reqEnv[key] = value || def;
    else nonReqEnv[key] = value;
  }
});

// Deno.envを使った時にエラーを吐くようにする
const oldEnvGet = Deno.env.get;
const oldEnvSet = Deno.env.set;
const oldEnvToObject = Deno.env.toObject;
const oldEnvDelete = Deno.env.delete;
const deprecatedConsoleLog = (funcName: string) =>
  console.warn(
    Colors.red(`${funcName} is deprecated. Use 'v1/parts/env.ts' instead.`),
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

//console.log(reqEnv, nonReqEnv);
console.log(Colors.green("[env]\tChecked environment"));
