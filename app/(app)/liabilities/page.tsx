import { getLiabilities } from "@/app/actions/liabilities";
import { LiabilitiesView } from "@/components/liabilities/LiabilitiesView";

export default async function LiabilitiesPage() {
  const liabilities = await getLiabilities();
  return <LiabilitiesView liabilities={liabilities} />;
}
