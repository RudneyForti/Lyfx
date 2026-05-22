import { getHealthData } from "@/app/actions/health";
import { HealthView } from "@/components/health/HealthView";

export default async function HealthPage() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const { healthScore, reserveBalance } = await getHealthData(month, year);

  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="p-8 max-w-[760px]">
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Análise
      </div>
      <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
        Saúde <span className="text-[var(--color-cyan)]">Financeira</span>
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-10">
        Score composto de 4 dimensões: comprometimento, poupança, resultado e reserva.
      </p>

      <HealthView healthScore={healthScore} monthLabel={monthLabel} reserveBalance={reserveBalance} />
    </div>
  );
}
