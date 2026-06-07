import { db } from "@/lib/db";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const userCount = await db.user.count();
  const now = new Date();
  return <LoginForm hasUser={userCount > 0} monthIndex={now.getMonth()} year={now.getFullYear()} />;
}
