import { getPillProgress, getStreakData } from "@/app/actions/education";
import { getHealthData } from "@/app/actions/health";
import { EducationHub } from "@/components/education/EducationHub";
import { healthProfileToPillProfile } from "@/lib/pills";

export default async function EducationPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [progressRows, streak, { healthScore }] = await Promise.all([
    getPillProgress(),
    getStreakData(),
    getHealthData(month, year),
  ]);

  const userProfile = healthProfileToPillProfile(healthScore.profile);

  const completedMap = Object.fromEntries(
    progressRows.map((r) => [r.pillId, r])
  );

  return (
    <EducationHub
      completedMap={completedMap}
      userProfile={userProfile}
      streak={streak}
    />
  );
}
