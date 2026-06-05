import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { ALL_MODULE_KEYS } from "@/lib/modules";
import { getConfigBool, getConfigValue } from "@/lib/config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();

  if (!userId) {
    // CS-13: preservar rota original como ?redirect= para restaurar após login
    const hdrs = await headers();
    const pathname = hdrs.get("x-pathname") ?? "/dashboard";
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const [user, maintenanceMode, maintenanceBanner, betaModulesRaw] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { plan: { include: { modules: true } } },
    }),
    getConfigBool("maintenanceMode"),
    getConfigValue("maintenanceBanner", "O sistema está temporariamente indisponível para manutenção."),
    getConfigValue("betaModules", ""),
  ]);

  let betaModules: string[] | undefined;
  if (betaModulesRaw) {
    try { betaModules = JSON.parse(betaModulesRaw); } catch { /* ignore */ }
  }
  if (!user) redirect("/api/clear-session");

  // Resolve allowed modules: plan modules if assigned, all modules otherwise
  const allowedModules: string[] = user.plan
    ? user.plan.modules.map((m) => m.module)
    : ALL_MODULE_KEYS;

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.07) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Sidebar allowedModules={allowedModules} betaModules={betaModules} />
      <UserMenu name={user.name} avatar={user.avatar ?? null} />
      <main
        className="flex-1 min-h-screen transition-all duration-200"
        style={{ marginLeft: "var(--sidebar-width)", paddingTop: "48px" }}
        id="main-content"
      >
        {maintenanceMode && (
          <div style={{
            background: "rgba(251,191,36,0.08)",
            borderBottom: "1px solid rgba(251,191,36,0.25)",
            padding: "10px 20px",
            fontSize: 12,
            color: "#FBBF24",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span>⚠️</span>
            {maintenanceBanner}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
