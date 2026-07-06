"use server";

import { readFile } from "fs/promises";
import path from "path";
import os from "os";
import { db } from "@/lib/db";
import { requireAdmin } from "./auth";
import { getVersionInfo, getGitInfo } from "./system-info";

export async function getStudioData() {
  await requireAdmin();
  const [users, plans, txCount, tagCount, budgetCount, goalCount, liabilityCount, goalPaymentCount, recentTx] = await Promise.all([
    db.user.findMany({
      select: {
        id: true, name: true, email: true, createdAt: true, avatar: true,
        planId: true,
        plan: { select: { id: true, name: true, color: true } },
      },
    }),
    db.plan.findMany({
      include: {
        modules: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.transaction.count(),
    db.tag.count(),
    db.budget.count(),
    db.goal.count(),
    db.liability.count(),
    db.goalPayment.count(),
    db.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, description: true, amount: true, type: true, category: true, date: true },
    }),
  ]);

  const totalRecords =
    users.length + txCount + tagCount + budgetCount +
    goalCount + liabilityCount + goalPaymentCount;

  // DB file size (PostgreSQL: approximate via pg_database_size)
  let dbSizeBytes = 0;
  try {
    const result = await db.$queryRaw<[{ size: bigint }]>`
      SELECT pg_database_size(current_database()) AS size
    `;
    dbSizeBytes = Number(result[0].size);
  } catch { /* ignore */ }

  const planList = plans.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    isDefault: p.isDefault,
    modules: p.modules.map(m => m.module),
    userCount: p._count.users,
  }));

  // Versions and git — environment dependencies isolated in system-info.ts
  const { appVersion, prodVersion } = await getVersionInfo();
  const { devBranch, devCommit, prodBranch, prodCommit } = getGitInfo();

  return {
    users, plans: planList,
    txCount, tagCount, budgetCount, goalCount, recentTx,
    userCount: users.length, totalRecords, dbSizeBytes,
    appVersion, prodVersion,
    devBranch, devCommit, prodBranch, prodCommit,
  };
}

// ── Live schema from PostgreSQL information_schema ────────────────────────────

export interface SchemaColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  is_pk: boolean;
  is_fk: boolean;
  fk_ref?: string; // referenced table name
}

export interface SchemaForeignKey {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  constraint_name: string;
}

export interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

export interface LiveSchema {
  tables: SchemaTable[];
  foreignKeys: SchemaForeignKey[];
}

export async function getLiveSchema(): Promise<LiveSchema> {
  await requireAdmin();

  type ColRow = Omit<SchemaColumn, "is_pk" | "is_fk" | "fk_ref"> & { table_name: string };
  type PkRow  = { table_name: string; column_name: string };

  const [columns, fks, pks] = await Promise.all([
    db.$queryRaw<ColRow[]>`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name NOT IN ('_prisma_migrations')
      ORDER BY table_name, ordinal_position
    `,
    db.$queryRaw<SchemaForeignKey[]>`
      SELECT
        kcu.table_name, kcu.column_name,
        ccu.table_name  AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ORDER BY kcu.table_name, kcu.column_name
    `,
    db.$queryRaw<PkRow[]>`
      SELECT kcu.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    `,
  ]);

  // Build lookup sets
  const pkSet  = new Set(pks.map(pk => `${pk.table_name}.${pk.column_name}`));
  const fkMap  = new Map(fks.map(fk => [`${fk.table_name}.${fk.column_name}`, fk.foreign_table_name]));

  // Group columns by table — annotated with PK/FK
  const tableMap = new Map<string, SchemaColumn[]>();
  for (const row of columns) {
    if (!tableMap.has(row.table_name)) tableMap.set(row.table_name, []);
    const key = `${row.table_name}.${row.column_name}`;
    tableMap.get(row.table_name)!.push({
      column_name:    row.column_name,
      data_type:      row.data_type,
      is_nullable:    row.is_nullable,
      column_default: row.column_default,
      is_pk:  pkSet.has(key),
      is_fk:  fkMap.has(key),
      fk_ref: fkMap.get(key),
    });
  }

  const tables: SchemaTable[] = Array.from(tableMap.entries()).map(([name, cols]) => ({
    name,
    columns: cols,
  }));

  return { tables, foreignKeys: fks };
}

export async function getDocumentation(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "DOCUMENTATION.md");
    return await readFile(filePath, "utf-8");
  } catch {
    return "_Arquivo DOCUMENTATION.md não encontrado._";
  }
}

// ── Server metrics ────────────────────────────────────────────────────────────

export interface ServerMetrics {
  // System memory
  memUsedBytes:  number;
  memTotalBytes: number;
  // Heap do processo Node.js
  heapUsedBytes:  number;
  heapTotalBytes: number;
  // CPU
  loadAvg1m:  number;
  loadAvg5m:  number;
  cpuCount:   number;
  // Processo
  uptimeSeconds: number;
  // Users online (lastSeenAt in the last 5 minutes)
  onlineNow:   number;
  // Users active today
  activeToday: number;
}

export async function getServerMetrics(): Promise<ServerMetrics> {
  await requireAdmin();

  const mem  = process.memoryUsage();
  const load = os.loadavg();
  const now  = new Date();
  const fiveMinAgo  = new Date(now.getTime() -      5 * 60 * 1000);
  const startOfDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [onlineNow, activeToday] = await Promise.all([
    db.user.count({ where: { lastSeenAt: { gte: fiveMinAgo } } }),
    db.user.count({ where: { lastSeenAt: { gte: startOfDay } } }),
  ]);

  return {
    memUsedBytes:   os.totalmem() - os.freemem(),
    memTotalBytes:  os.totalmem(),
    heapUsedBytes:  mem.heapUsed,
    heapTotalBytes: mem.heapTotal,
    loadAvg1m:  load[0],
    loadAvg5m:  load[1],
    cpuCount:   os.cpus().length,
    uptimeSeconds: process.uptime(),
    onlineNow,
    activeToday,
  };
}
