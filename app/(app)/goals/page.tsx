import { getGoals, getMonthlyBalance } from "@/app/actions/goals";
import { getActiveLiabilities } from "@/app/actions/liabilities";
import { GoalsView } from "@/components/goals/GoalsView";

export default async function GoalsPage() {
  const [goals, avgBalance, activeLiabilities] = await Promise.all([
    getGoals(),
    getMonthlyBalance(),
    getActiveLiabilities(),
  ]);
  return (
    <GoalsView
      goals={goals}
      avgMonthlyBalance={avgBalance}
      activeLiabilities={activeLiabilities}
    />
  );
}
