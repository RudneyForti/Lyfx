import { getInstitutions } from "@/app/actions/institutions";
import { getLiabilities } from "@/app/actions/liabilities";
import { InstitutionsView } from "@/components/institutions/InstitutionsView";

export default async function InstitutionsPage() {
  const [institutions, liabilities] = await Promise.all([
    getInstitutions(),
    getLiabilities(),
  ]);

  const liabilitiesSlim = liabilities.map((l) => ({
    id: l.id,
    name: l.name,
    type: l.type,
    currentBalance: l.currentBalance,
    institutionId: l.institutionId,
  }));

  return <InstitutionsView institutions={institutions} liabilities={liabilitiesSlim} />;
}
