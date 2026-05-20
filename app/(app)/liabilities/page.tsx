import { getLiabilities } from "@/app/actions/liabilities";
import { getInstitutions } from "@/app/actions/institutions";
import { LiabilitiesView } from "@/components/liabilities/LiabilitiesView";

export default async function LiabilitiesPage() {
  const [liabilities, institutions] = await Promise.all([
    getLiabilities(),
    getInstitutions(),
  ]);
  return <LiabilitiesView liabilities={liabilities} institutions={institutions} />;
}
