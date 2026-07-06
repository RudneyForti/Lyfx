/**
 * km-utils.ts — Calculation utilities for km reimbursement. [CS-25]
 *
 * addBusinessDays: async version that accounts for national holidays via
 * BrasilAPI. Moved from app/actions/km-reimbursement.ts (was sync, ignored holidays).
 */

import { getHolidays } from "./holidays";

/**
 * Advances `days` business days from `startDate`, skipping:
 * - Saturdays (getDay() === 6)
 * - Sundays (getDay() === 0)
 * - national holidays via BrasilAPI
 *
 * Safe fallback: if BrasilAPI is unavailable, only weekends are skipped.
 */
export async function addBusinessDays(startDate: Date, days: number): Promise<Date> {
  // Guard against invalid input
  const safeDays = Number.isFinite(days) && days >= 0 ? Math.round(days) : 0;

  const d = new Date(startDate);
  let added = 0;

  // Per-year holiday cache (avoids repeated calls for the same year)
  const loadedYears = new Set<number>();
  const holidays = new Set<string>();

  const ensureYear = async (year: number) => {
    if (!loadedYears.has(year)) {
      loadedYears.add(year);
      const h = await getHolidays(year);
      h.forEach((date) => holidays.add(date));
    }
  };

  // Preload holidays for the starting year
  await ensureYear(d.getFullYear());

  while (added < safeDays) {
    d.setDate(d.getDate() + 1);
    // Load holidays when crossing into a new year
    await ensureYear(d.getFullYear());

    const dow = d.getDay();
    const iso = d.toISOString().slice(0, 10);

    if (dow !== 0 && dow !== 6 && !holidays.has(iso)) {
      added++;
    }
  }

  return d;
}
