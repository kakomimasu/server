import { prisma, setBoard } from "../core/kv.ts";

import boards from "./boards.json" with { type: "json" };

// 全データ削除
await prisma.$transaction([
  prisma.board.deleteMany(),
  prisma.game.deleteMany(),
  prisma.tournament.deleteMany(),
  prisma.user.deleteMany(),
  prisma.oAuthSession.deleteMany(),
  prisma.siteSession.deleteMany(),
]);

// ボード情報だけ追加
for (const board of Object.values(boards)) {
  await setBoard(board);
}
