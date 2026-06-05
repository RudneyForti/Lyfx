import { getAlerts } from "@/app/actions/alerts";
import { getNotifications } from "@/app/actions/notifications";
import { AlertsView } from "@/components/alerts/AlertsView";

export default async function AlertsPage() {
  const [alerts, notifications] = await Promise.all([
    getAlerts(),
    getNotifications(),
  ]);
  return <AlertsView alerts={alerts} notifications={notifications} />;
}
