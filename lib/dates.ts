/**
 * dates.ts — safe parsing for date strings coming from forms.
 *
 * `new Date("2026-07-01")` parses as UTC midnight. In UTC-3 (Brazil) that is
 * 21:00 of June 30 — a transaction created on day 1 of a month silently lands
 * in the previous month for every local-boundary query. This helper parses
 * plain YYYY-MM-DD strings as LOCAL dates; anything with a time component
 * falls through to the native parser.
 */
export function parseLocalDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}
