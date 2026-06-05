"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/session";
import {
  selectPillProgress,
  selectPillExists,
  insertPillProgress,
  selectCompletedDates,
} from "@/lib/db-pills";
import type { PillProgressRecord, StreakData, WeekData } from "@/lib/pills";

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getPillProgress(): Promise<PillProgressRecord[]> {
  const userId = await requireAuth();
  const rows = await selectPillProgress(userId);
  return rows.map((r) => ({
    pillId: r.pillId,
    profile: r.profile,
    completedAt: new Date(r.completedAt),
    timeSpentSeconds: r.timeSpentSeconds,
    quizCorrect: r.quizCorrect,
  }));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function completePill(data: {
  pillId: string;
  profile: string;
  timeSpentSeconds: number;
  quizCorrect: boolean;
}): Promise<{ alreadyCompleted: boolean }> {
  const userId = await requireAuth();

  const alreadyCompleted = await selectPillExists(userId, data.pillId);

  if (!alreadyCompleted) {
    await insertPillProgress({
      id: randomUUID(),
      userId,
      pillId: data.pillId,
      profile: data.profile,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: data.timeSpentSeconds,
      quizCorrect: data.quizCorrect,
    });
    revalidatePath("/education");
  }

  return { alreadyCompleted };
}

// ── Streak ────────────────────────────────────────────────────────────────────

export async function getStreakData(): Promise<StreakData> {
  const userId = await requireAuth();
  const dates = await selectCompletedDates(userId);
  const completedDates = dates.map((d) => new Date(d));

  const now = new Date();
  const weekHistory: WeekData[] = [];

  for (let i = 11; i >= 0; i--) {
    const weekStart = getWeekStart(now, -i);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekKey = weekStart.toISOString().slice(0, 10);
    const hasActivity = completedDates.some(
      (d) => d >= weekStart && d < weekEnd
    );
    weekHistory.push({ weekKey, hasActivity });
  }

  let streak = 0;
  for (let i = weekHistory.length - 1; i >= 0; i--) {
    const isCurrent = i === weekHistory.length - 1;
    if (weekHistory[i].hasActivity) {
      streak++;
    } else if (isCurrent) {
      continue;
    } else {
      break;
    }
  }

  return { currentStreak: streak, weekHistory };
}

function getWeekStart(date: Date, weekOffset = 0): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}
