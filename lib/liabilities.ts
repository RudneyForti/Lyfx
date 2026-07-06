/** Months to pay off at `payment` per month (monthly rate r, balance B). */
export function monthsToPayoff(
  balance: number,
  monthlyRate: number,
  payment: number
): number | null {
  if (balance <= 0) return 0;
  if (payment <= 0) return null;
  // If the payment does not even cover the first month interest, it never pays off
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
