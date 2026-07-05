import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import { getSessionUserId } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { ALL_MODULE_KEYS, ALWAYS_ACCESSIBLE, type ModuleKey } from "@/lib/modules";
import { getConfigBool, getConfigValue } from "@/lib/config";
import { syncDangerAlerts } from "@/app/actions/notifications";
import { shouldRun } from "@/lib/throttle-gate";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();

  // Resolve current pathname once — used for login redirect and module guard
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "/dashboard";

  if (!userId) {
    // CS-13: preservar rota original como ?redirect= para restaurar após login
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const now = new Date();
  const [user, maintenanceMode, maintenanceBanner, betaModulesRaw, unreadCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { plan: { include: { modules: true } } },
    }),
    getConfigBool("maintenanceMode"),
    getConfigValue("maintenanceBanner", "O sistema está temporariamente indisponível para manutenção."),
    getConfigValue("betaModules", ""),
    // Badge de não lidas — inline com o userId já validado acima, evitando a
    // segunda consulta de sessão que getUnreadCount() faria via requireAuth()
    db.notification.count({
      where: {
        userId,
        fingerprint: null,
        readAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
  ]);

  // CS-18: converter alertas danger em notificações (fingerprint dedup, TTL 7d).
  // Throttled (1×/5min por usuário) e fire-and-forget — alertas de orçamento não
  // mudam a cada clique; recalculá-los por navegação custava ~7 queries por página.
  if (shouldRun(`danger-alerts:${userId}`, 5 * 60_000)) {
    syncDangerAlerts(userId).catch(() => {});
  }

  // Presença para métricas do Studio — throttled a 1 write/min por usuário
  if (shouldRun(`last-seen:${userId}`, 60_000)) {
    db.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }

  let betaModules: string[] | undefined;
  if (betaModulesRaw) {
    try { betaModules = JSON.parse(betaModulesRaw); } catch { /* ignore */ }
  }
  if (!user) redirect("/api/clear-session");

  // Resolve allowed modules: plan modules if assigned, all modules otherwise
  const allowedModules: string[] = user.plan
    ? user.plan.modules.map((m) => m.module)
    : ALL_MODULE_KEYS;

  // CS-40 — Module route guard: block direct URL access for modules not in plan
  // Only enforced when user has an explicit plan assigned (no plan = admin / unrestricted access)
  if (user.plan) {
    const segment = pathname.split("/").filter(Boolean)[0]; // e.g. "km-reimbursement"
    if (segment && !ALWAYS_ACCESSIBLE.includes(segment as ModuleKey) && !allowedModules.includes(segment)) {
      redirect("/dashboard");
    }
  }

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.07) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Sidebar allowedModules={allowedModules} betaModules={betaModules} />
      <UserMenu name={user.name} avatar={user.avatar ?? null} unreadCount={unreadCount} />
      <main
        className="flex-1 min-h-screen transition-all duration-200"
        style={{ marginLeft: "var(--sidebar-width)", paddingTop: "48px" }}
        id="main-content"
      >
        {maintenanceMode && (
          <div style={{
            padding: "10px 20px",
            display: "flex",
            justifyContent: "center",
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: 999,
              padding: "6px 16px",
              fontSize: 12,
              color: "#FBBF24",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {maintenanceBanner}
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
