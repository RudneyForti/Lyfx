import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { ALL_MODULE_KEYS } from "@/lib/modules";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getSessionUserId();

  if (!userId) {
    // CS-13: preservar rota original como ?redirect= para restaurar após login
    const hdrs = await headers();
    const pathname = hdrs.get("x-pathname") ?? "/dashboard";
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { plan: { include: { modules: true } } },
  });
  if (!user) redirect("/api/clear-session");

  // Resolve allowed modules: plan modules if assigned, all modules otherwise
  const allowedModules: string[] = user.plan
    ? user.plan.modules.map((m) => m.module)
    : ALL_MODULE_KEYS;

  return (
    <div className="flex min-h-screen">
      <Sidebar allowedModules={allowedModules} />
      <UserMenu name={user.name} avatar={user.avatar ?? null} />
      <main
        className="flex-1 min-h-screen transition-all duration-200"
        style={{ marginLeft: "var(--sidebar-width)" }}
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}
