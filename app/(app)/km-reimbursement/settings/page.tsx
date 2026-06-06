import { getKmConfig } from "@/app/actions/km-reimbursement";
import { KmSettings } from "@/components/km-reimbursement/KmSettings";

export default async function KmSettingsPage() {
  const config = await getKmConfig();
  return <KmSettings config={config} />;
}
