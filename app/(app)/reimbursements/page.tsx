import { getReimbursables } from "@/app/actions/transactions";
import { ReimbursementsView } from "@/components/reimbursements/ReimbursementsView";

export default async function ReimbursementsPage() {
  const transactions = await getReimbursables();
  return <ReimbursementsView transactions={transactions} />;
}
