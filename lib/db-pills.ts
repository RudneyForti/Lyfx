/**
 * PillProgress data access via Prisma (PostgreSQL).
 *
 * Replaced better-sqlite3 workaround from v1.5.0 (SQLite era).
 * The original workaround was needed because Turbopack cached a stale
 * Prisma client that didn't include PillProgress. After migrating to
 * PostgreSQL in v1.7.0, the adapter changed (@prisma/adapter-pg) and
 * the issue no longer exists — db.pillProgress works normally.
 */

import { db } from "@/lib/db";

export async function selectPillProgress(userId: string) {
  return db.pillProgress.findMany({
    where: { userId },
    orderBy: { completedAt: "asc" },
  });
}

export async function selectPillExists(userId: string, pillId: string): Promise<boolean> {
  const row = await db.pillProgress.findUnique({
    where: { userId_pillId: { userId, pillId } },
  });
  return !!row;
}

export async function insertPillProgress(data: {
  id: string;
  userId: string;
  pillId: string;
  profile: string;
  completedAt: string;
  timeSpentSeconds: number;
  quizCorrect: boolean;
}): Promise<void> {
  await db.pillProgress.create({
    data: {
      id: data.id,
      userId: data.userId,
      pillId: data.pillId,
      profile: data.profile,
      completedAt: new Date(data.completedAt),
      timeSpentSeconds: data.timeSpentSeconds,
      quizCorrect: data.quizCorrect,
    },
  });
}

export async function selectCompletedDates(userId: string): Promise<string[]> {
  const rows = await db.pillProgress.findMany({
    where: { userId },
    select: { completedAt: true },
  });
  return rows.map((r) => r.completedAt.toISOString());
}
