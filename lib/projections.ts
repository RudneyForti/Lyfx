import { Transaction, ProjectedTransaction } from "./types";

/**
 * Gera projeções de transações recorrentes para um mês/ano alvo.
 * Regras:
 * - Só projeta para meses FUTUROS ao mês de origem (histórico é intocável)
 * - monthly: projeta no mesmo dia de todo mês seguinte ao de origem
 * - yearly:  projeta no mesmo dia/mês de anos seguintes ao de origem
 * - Se já existe transação real naquele mês com mesmo description+category,
 *   não duplica a projeção
 */
export function getProjectedTransactions(
  allTransactions: Transaction[],
  targetMonth: number, // 0-indexed (0 = janeiro)
  targetYear: number
): ProjectedTransaction[] {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Só projeta para meses futuros (após o mês atual)
  const targetIsStrictlyFuture =
    targetYear > currentYear ||
    (targetYear === currentYear && targetMonth > currentMonth);

  if (!targetIsStrictlyFuture) return [];

  const recurring = allTransactions.filter((tx) => tx.recurrence !== "once");
  const projected: ProjectedTransaction[] = [];

  for (const tx of recurring) {
    const origin = new Date(tx.date);
    const originMonth = origin.getMonth();
    const originYear = origin.getFullYear();
    const originDay = origin.getDate();

    let shouldProject = false;

    if (tx.recurrence === "monthly") {
      // Projeta se target é depois do mês de origem
      shouldProject =
        targetYear > originYear ||
        (targetYear === originYear && targetMonth > originMonth);
    }

    if (tx.recurrence === "yearly") {
      // Projeta se mesmo mês mas ano posterior
      shouldProject = targetMonth === originMonth && targetYear > originYear;
    }

    if (!shouldProject) continue;

    // Verifica se já existe transação real neste mês com mesmo description+category
    const alreadyRecorded = allTransactions.some((t) => {
      const d = new Date(t.date);
      return (
        !t.isProjected &&
        d.getMonth() === targetMonth &&
        d.getFullYear() === targetYear &&
        t.description.toLowerCase() === tx.description.toLowerCase() &&
        t.category === tx.category
      );
    });

    if (alreadyRecorded) continue;

    // Garante que o dia é válido no mês alvo (ex: dia 31 em fevereiro)
    const lastDayOfTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
    const projectedDay = Math.min(originDay, lastDayOfTarget);

    projected.push({
      ...tx,
      id: `proj_${tx.id}_${targetYear}_${targetMonth}`,
      sourceId: tx.id,
      date: new Date(targetYear, targetMonth, projectedDay),
      isProjected: true,
    });
  }

  return projected;
}

// Estende Transaction com flag opcional para uso unificado no calendário
declare module "./types" {
  interface Transaction {
    isProjected?: boolean;
  }
}
