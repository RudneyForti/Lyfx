import { PrismaClient } from "./generated/prisma/client";

// PostgreSQL — Prisma nativo, sem adapter externo.
// Node's module cache garante uma única instância por processo.
// Em dev, prevenimos múltiplas instâncias em HMR guardando no globalThis.
const globalForPrisma = globalThis as unknown as { db: PrismaClient };

export const db =
  globalForPrisma.db ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.db = db;
