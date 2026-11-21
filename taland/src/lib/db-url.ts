import path from "path";

/** Относительный file:./… Prisma CLI и Next резолвят по-разному. Приводим к абсолютному. */
export function ensureDatabaseUrl() {
  const raw = process.env.DATABASE_URL || "file:./data/taland.db";
  if (raw.startsWith("file:./") || raw.startsWith("file:../")) {
    const rel = raw.slice("file:".length);
    process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), rel)}`;
  }
}
