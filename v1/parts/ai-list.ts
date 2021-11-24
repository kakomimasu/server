import {
  Algorithm,
  ClientA1,
  ClientA2,
  ClientA3,
  ClientA4,
  ClientA5,
  ClientNone,
} from "../../deps.ts";

interface IAi {
  name: string;
  filePath: string;
}

export const aiList: { name: string; client: typeof Algorithm }[] = [
  { name: "none", client: ClientNone },
  { name: "a1", client: ClientA1 },
  { name: "a2", client: ClientA2 },
  { name: "a3", client: ClientA3 },
  { name: "a4", client: ClientA4 },
  { name: "a5", client: ClientA5 },
];
