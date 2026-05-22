import { notFound } from "next/navigation";
import { getPillById, getPillsByProfile, healthProfileToPillProfile, type PillProfile } from "@/lib/pills";
import { getPillProgress } from "@/app/actions/education";
import { getHealthData } from "@/app/actions/health";
import { PillReader } from "@/components/education/PillReader";

interface Props {
  params: Promise<{ pillId: string }>;
}

export default async function PillPage({ params }: Props) {
  const { pillId } = await params;

  const pill = getPillById(pillId);
  if (!pill) notFound();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [progressRows, { healthScore }] = await Promise.all([
    getPillProgress(),
    getHealthData(month, year),
  ]);

  const completedIds = new Set(progressRows.map((r) => r.pillId));
  const record = progressRows.find((r) => r.pillId === pillId);

  // Next pill in the same profile trail
  const profilePills = getPillsByProfile(pill.profile as PillProfile);
  const currentIndex = profilePills.findIndex((p) => p.id === pillId);
  const nextPill =
    profilePills.slice(currentIndex + 1).find((p) => !completedIds.has(p.id)) ?? null;

  return (
    <PillReader
      pill={pill}
      initialRecord={record}
      nextPill={nextPill}
    />
  );
}
