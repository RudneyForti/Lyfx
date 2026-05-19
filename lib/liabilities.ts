/** Meses para quitar ao pagar `payment` por mês (taxa mensal r, saldo B). */
export function monthsToPayoff(
  balance: number,
  monthlyRate: number,
  payment: number
): number | null {
  if (balance <= 0) return 0;
  if (payment <= 0) return null;
  // Se o pagamento não cobre nem os juros do primeiro mês, nunca quita
  if (monthlyRate > 0 && payment <= balance * (monthlyRate / 100)) return null;
  let b = balance;
  const r = monthlyRate / 100;
  let months = 0;
  while (b > 0.005 && months < 600) {
    b = b * (1 + r) - payment;
    months++;
  }
  return months;
}
