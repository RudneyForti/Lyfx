/**
 * Direct better-sqlite3 access for PillProgress.
 *
 * Why not db.pillProgress? Turbopack caches a stale compiled version of the
 * Prisma-generated internal/class.ts (without PillProgress in runtimeDataModel),
 * so the model delegate is undefined at runtime even though the table exists.
 *
 * Why not db.$queryRaw? The Prisma 7 WASM query-compiler initialization hangs
 * when invoked via $queryRaw with the better-sqlite3 driver adapter.
 *
 * better-sqlite3 is already a transitive dependency (via @prisma/adapter-better-sqlite3).
 * SQLite + single-threaded Node.js = no file-locking concern.
 */

import BetterSqlite3 from "better-sqlite3";
import path from "path";

function openDb() {
  return new BetterSqlite3(path.join(process.cwd(), "dev.db"), {
    readonly: false,
  });
}

export type PillRow = {
  pillId: string;
  profile: string;
  completedAt: string;
  timeSpentSeconds: number;
  quizCorrect: number; // SQLite stores boolean as 0/1
};

export function selectPillProgress(userId: string): PillRow[] {
  const db = openDb();
  try {
    return db
      .prepare(
        `SELECT pillId, profile, completedAt, timeSpentSeconds, quizCorrect
         FROM PillProgress
         WHERE userId = ?
         ORDER BY completedAt ASC`
      )
      .all(userId) as PillRow[];
  } finally {
    db.close();
  }
}

export function selectPillExists(userId: string, pillId: string): boolean {
  const db = openDb();
  try {
    const row = db
      .prepare(`SELECT 1 FROM PillProgress WHERE userId = ? AND pillId = ?`)
      .get(userId, pillId);
    return !!row;
  } finally {
    db.close();
  }
}

export function insertPillProgress(data: {
  id: string;
  userId: string;
  pillId: string;
  profile: string;
  completedAt: string;
  timeSpentSeconds: number;
  quizCorrect: number;
}): void {
  const db = openDb();
  try {
    db.prepare(
      `INSERT INTO PillProgress (id, userId, pillId, profile, completedAt, timeSpentSeconds, quizCorrect, createdAt)
       VALUES (@id, @userId, @pillId, @profile, @completedAt, @timeSpentSeconds, @quizCorrect, @completedAt)`
    ).run(data);
  } finally {
    db.close();
  }
}

export function selectCompletedDates(userId: string): string[] {
  const db = openDb();
  try {
    const rows = db
      .prepare(`SELECT completedAt FROM PillProgress WHERE userId = ?`)
      .all(userId) as Array<{ completedAt: string }>;
    return rows.map((r) => r.completedAt);
  } finally {
    db.close();
  }
}
