import { getKmPeriods } from "@/app/actions/km-reimbursement";
import { PeriodList } from "@/components/km-reimbursement/PeriodList";

export default async function KmReimbursementPage() {
  const periods = await getKmPeriods();
  return <PeriodList periods={periods} />;
}
