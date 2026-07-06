import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { SqlDriverAdapterFactory } from "@prisma/client/runtime/client";

// PostgreSQL via @prisma/adapter-pg (Prisma v7 driver adapter pattern).
// Singleton stored on globalThis to avoid multiple instances under HMR.
const globalForPrisma = globalThis as unknown as { db: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

// [CS-29] Replaced `as never` — explicit cast to the adapter-required subset
export const db =
  globalForPrisma.db ??
  new PrismaClient({ adapter: adapter as SqlDriverAdapterFactory });

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;
