/**
 * holidays.ts — National holiday cache via BrasilAPI. [CS-25]
 *
 * In-memory cache per year — holidays are immutable within a year.
 * Graceful fallback: if the API is offline, returns an empty Set
 * (D+5 computed from weekends only, no holidays).
 */

const cache = new Map<number, Set<string>>();

export async function getHolidays(year: number): Promise<Set<string>> {
  if (cache.has(year)) return cache.get(year)!;

  try {
    const res = await fetch(
      `https://brasilapi.com.br/api/feriados/v1/${year}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) } // cache Next.js 24h
    );
    if (!res.ok) return new Set();
    const data: Array<{ date: string; name: string; type: string }> = await res.json();
    const set = new Set(data.map((h) => h.date.slice(0, 10))); // "YYYY-MM-DD"
    cache.set(year, set);
    return set;
  } catch {
    return new Set(); // API offline → weekend-only fallback
  }
}
