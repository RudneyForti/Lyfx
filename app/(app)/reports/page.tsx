import { getReports } from "@/app/actions/reports";
import { ReportsView } from "@/components/reports/ReportsView";

interface Props {
  searchParams: Promise<{ months?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const months = Number(params.months) || 6;
  const validMonths = [3, 6, 12].includes(months) ? months : 6;
  const data = await getReports(validMonths);
  return <ReportsView data={data} initialPeriod={validMonths} />;
}
