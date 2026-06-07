/**
 * km-utils.ts — Utilitários de cálculo para reembolso por km. [CS-25]
 *
 * addBusinessDays: versão async que considera feriados nacionais via BrasilAPI.
 * Movido de app/actions/km-reimbursement.ts (era síncrono, ignorava feriados).
 */

import { getHolidays } from "./holidays";

/**
 * Avança `days` dias úteis a partir de `startDate`, pulando:
 * - sábados (getDay() === 6)
 * - domingos (getDay() === 0)
 * - feriados nacionais via BrasilAPI
 *
 * Fallback seguro: se BrasilAPI estiver indisponível, considera apenas sáb/dom.
 */
export async function addBusinessDays(startDate: Date, days: number): Promise<Date> {
  // Guard contra input inválido
  const safeDays = Number.isFinite(days) && days >= 0 ? Math.round(days) : 0;

  const d = new Date(startDate);
  let added = 0;

  // Cache de feriados por ano (evita múltiplas chamadas ao mesmo ano)
  const loadedYears = new Set<number>();
  const holidays = new Set<string>();

  const ensureYear = async (year: number) => {
    if (!loadedYears.has(year)) {
      loadedYears.add(year);
      const h = await getHolidays(year);
      h.forEach((date) => holidays.add(date));
    }
  };

  // Pré-carregar feriados do ano inicial
  await ensureYear(d.getFullYear());

  while (added < safeDays) {
    d.setDate(d.getDate() + 1);
    // Carregar feriados se virar o ano
    await ensureYear(d.getFullYear());

    const dow = d.getDay();
    const iso = d.toISOString().slice(0, 10);

    if (dow !== 0 && dow !== 6 && !holidays.has(iso)) {
      added++;
    }
  }

  return d;
}
