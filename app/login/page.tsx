import { db } from "@/lib/db";
import { LoginForm } from "./LoginForm";
import { isOAuthEnabled } from "@/lib/oauth"; // CS-36

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const userCount = await db.user.count();
  const now = new Date();
  return (
    <LoginForm
      hasUser={userCount > 0}
      monthIndex={now.getMonth()}
      year={now.getFullYear()}
      oauthEnabled={{ google: isOAuthEnabled("google"), microsoft: isOAuthEnabled("microsoft") }}
    />
  );
}
