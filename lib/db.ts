import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// SQLite is a file-based, single-process driver — no connection pool needed.
// We avoid the global-singleton pattern because it can preserve a stale
// PrismaClient instance (missing newly-added models) across HMR reloads.
// Node's own module cache ensures this runs once per process restart.

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new PrismaClient({ adapter } as any);
