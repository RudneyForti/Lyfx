import { getAlerts } from "@/app/actions/alerts";
import { AlertsView } from "@/components/alerts/AlertsView";

export default async function AlertsPage() {
  const alerts = await getAlerts();
  return <AlertsView alerts={alerts} />;
}
