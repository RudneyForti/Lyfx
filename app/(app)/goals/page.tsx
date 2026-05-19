import { getGoals, getMonthlyBalance } from "@/app/actions/goals";
import { GoalsView } from "@/components/goals/GoalsView";

export default async function GoalsPage() {
  const [goals, avgBalance] = await Promise.all([getGoals(), getMonthlyBalance()]);
  return <GoalsView goals={goals} avgMonthlyBalance={avgBalance} />;
}
