import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { SqlDriverAdapterFactory } from "@prisma/client/runtime/client";

// PostgreSQL via @prisma/adapter-pg (Prisma v7 driver adapter pattern).
// Singleton guardado no globalThis para evitar múltiplas instâncias em HMR.
const globalForPrisma = globalThis as unknown as { db: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

// [CS-29] Substituído `as never` — cast explícito para o subconjunto com adapter obrigatório
export const db =
  globalForPrisma.db ??
  new PrismaClient({ adapter: adapter as SqlDriverAdapterFactory });

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;
