import { getAssets } from "@/app/actions/assets";
import { AssetsView } from "@/components/assets/AssetsView";

export default async function AssetsPage() {
  const assets = await getAssets();
  return <AssetsView assets={assets} />;
}
