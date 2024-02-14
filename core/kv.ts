import { env } from "./env.ts";
import { Board } from "./expKakomimasu.ts";

export const kv = await Deno.openKv(
  env.DENO_KV_ACCESS_TOKEN
    ? "https://api.deno.com/databases/24cc05be-e9c0-4695-9dcb-29ef4166e35c/connect"
    : undefined,
);

const BOARD_KEY = "boards";
// const USERS_KEY = "users";

/** ボードを1つ取得 */
export async function getBoard(boardName: string): Promise<Board | undefined> {
  const data = await kv.get<Board>([BOARD_KEY, boardName]);
  if (data.value) {
    return data.value;
  } else return undefined;
}

/** ボードをすべて取得 */
export async function getBoards(): Promise<Board[]> {
  const data = kv.list<Board>({ prefix: [BOARD_KEY] });

  const boards = (await Array.fromAsync(data)).map((d) => d.value);
  return boards;
}

/** ボード保存(JSONから) */
export async function setBoard(board: Board): Promise<void> {
  await kv.set([BOARD_KEY, board.name], board);
}
