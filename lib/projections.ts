import { Transaction, ProjectedTransaction } from "./types";

/**
 * Generates recurring-transaction projections for a target month/year.
 * Regras:
 * - Only projects into months AFTER the origin month (history is untouchable)
 * - monthly: projects on the same day of every month after the origin
 * - yearly:  projects on the same day/month of subsequent years
 * - If a real transaction already exists that month with the same
 *   description+category, the projection is not duplicated
 */
export function getProjectedTransactions(
  allTransactions: Transaction[],
  targetMonth: number, // 0-indexed (0 = janeiro)
  targetYear: number
): ProjectedTransaction[] {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Only project into future months (after the current one)
  const targetIsStrictlyFuture =
    targetYear > currentYear ||
    (targetYear === currentYear && targetMonth > currentMonth);

  if (!targetIsStrictlyFuture) return [];

  const recurring = allTransactions.filter((tx) => tx.recurrence !== "once");
  const projected: ProjectedTransaction[] = [];

  for (const tx of recurring) {
    const origin = new Date(tx.date);
    const originMonth = origin.getMonth();
    const originYear = origin.getFullYear();
    const originDay = origin.getDate();

    let shouldProject = false;

    if (tx.recurrence === "monthly") {
      // Project when the target is after the origin month
      shouldProject =
        targetYear > originYear ||
        (targetYear === originYear && targetMonth > originMonth);
    }

    if (tx.recurrence === "yearly") {
      // Project when same month but a later year
      shouldProject = targetMonth === originMonth && targetYear > originYear;
    }

    if (!shouldProject) continue;

    // Check whether a real transaction already exists this month with the same description+category
    const alreadyRecorded = allTransactions.some((t) => {
      const d = new Date(t.date);
      return (
        !t.isProjected &&
        d.getMonth() === targetMonth &&
        d.getFullYear() === targetYear &&
        t.description.toLowerCase() === tx.description.toLowerCase() &&
        t.category === tx.category
      );
    });

    if (alreadyRecorded) continue;

    // Ensure the day is valid in the target month (e.g. the 31st in February)
    const lastDayOfTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
    const projectedDay = Math.min(originDay, lastDayOfTarget);

    projected.push({
      ...tx,
      id: `proj_${tx.id}_${targetYear}_${targetMonth}`,
      sourceId: tx.id,
      date: new Date(targetYear, targetMonth, projectedDay),
      isProjected: true,
    });
  }

  return projected;
}

// Extends Transaction with an optional flag for unified calendar usage
declare module "./types" {
  interface Transaction {
    isProjected?: boolean;
  }
}
