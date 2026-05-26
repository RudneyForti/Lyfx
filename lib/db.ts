import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// PostgreSQL via @prisma/adapter-pg (Prisma v7 driver adapter pattern).
// Singleton guardado no globalThis para evitar múltiplas instâncias em HMR.
const globalForPrisma = globalThis as unknown as { db: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const db =
  globalForPrisma.db ??
  new PrismaClient({ adapter } as never);

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;
