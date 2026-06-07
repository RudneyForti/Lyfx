import { getKmPlaces } from "@/app/actions/km-reimbursement";
import { PlacesPage } from "@/components/km-reimbursement/PlacesPage";

export default async function KmPlacesPage() {
  const places = await getKmPlaces();
  return <PlacesPage places={places} />;
}
