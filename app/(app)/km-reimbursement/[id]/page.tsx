import { notFound } from "next/navigation";
import { getKmPeriod, getKmConfig, getKmPlaces } from "@/app/actions/km-reimbursement";
import { PeriodDetail } from "@/components/km-reimbursement/PeriodDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KmPeriodDetailPage({ params }: Props) {
  const { id } = await params;
  const [period, config, places] = await Promise.all([
    getKmPeriod(id),
    getKmConfig(),
    getKmPlaces(),
  ]);
  if (!period) notFound();
  return <PeriodDetail period={period} config={config} places={places} />;
}
