import { getKmConfig, getKmPlaces } from "@/app/actions/km-reimbursement";
import { KmSettings } from "@/components/km-reimbursement/KmSettings";

export default async function KmSettingsPage() {
  const [config, places] = await Promise.all([getKmConfig(), getKmPlaces()]);
  return <KmSettings config={config} places={places} />;
}
