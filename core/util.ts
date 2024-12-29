import { createMiddleware } from "hono/factory";
import * as Core from "kkmm-core";
import type { ExpGame } from "./expKakomimasu.ts";

import { errors, ServerError } from "./error.ts";

export type PartiallyPartial<T, K extends keyof T> =
  & Omit<T, K>
  & Partial<Pick<T, K>>;

export const nowUnixTime = () => {
  return Math.floor(new Date().getTime() / 1000);
};

export const randomUUID = () => crypto.randomUUID();

export type StateData<T> = { data: T };

export const jsonParse = <T>() => {
  return createMiddleware<{ Variables: StateData<T> }>(
    async (ctx, next) => {
      const contentType = ctx.req.header("content-type");
      if (contentType === null || contentType !== "application/json") {
        throw new ServerError(errors.INVALID_CONTENT_TYPE);
      }
      try {
        const reqJson = await ctx.req.json();
        ctx.set("data", reqJson);
      } catch (_e) {
        throw new ServerError(errors.INVALID_SYNTAX);
      }
      await next();
    },
  );
};

export interface ClientBase {
  playerIndex: number;
  oninit: (game: ExpGame) => void;
  onturn: (game: ExpGame) => Core.Action[];
}

/** deflate-raw 形式に圧縮する関数 */
export async function compression(obj: Parameters<JSON["stringify"]>[0]) {
  const str = JSON.stringify(obj);
  const complessedStream = new Blob([str]).stream().pipeThrough(
    new CompressionStream("deflate-raw"),
  );
  const complessedArrayBuffer = await new Response(complessedStream)
    .arrayBuffer();

  return complessedArrayBuffer;
}

/** deflate-raw 形式のデータを解凍する関数 */
// deno-lint-ignore no-explicit-any
export async function decompression(arrayBuffer: ArrayBuffer): Promise<any> {
  const decompressedStream = new Blob([arrayBuffer]).stream().pipeThrough(
    new DecompressionStream("deflate-raw"),
  );
  const json = await new Response(decompressedStream).json();
  return json;
}
