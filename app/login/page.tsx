import { db } from "@/lib/db";
import { LoginForm } from "./LoginForm";

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default async function LoginPage() {
  const userCount = await db.user.count();
  const now = new Date();
  const monthLabel = `${MONTHS_PT[now.getMonth()]} ${now.getFullYear()}`;
  return <LoginForm hasUser={userCount > 0} monthLabel={monthLabel} />;
}
