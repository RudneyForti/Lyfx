import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const userId = jar.get("lyfx_session")?.value;

  if (!userId) {
    // CS-13: preservar rota original como ?redirect= para restaurar após login
    const hdrs = await headers();
    const pathname = hdrs.get("x-pathname") ?? "/dashboard";
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/api/clear-session");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
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
