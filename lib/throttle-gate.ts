/**
 * throttle-gate.ts — per-key execution gate with an in-memory cooldown.
 *
 * Used to limit repetitive work on hot paths (e.g. alert sync and presence
 * in the layout, which runs on every navigation). State lives in the Node
 * process — a server restart resets the cooldowns, which is acceptable:
 * the worst case is one extra execution.
 */

const lastRun = new Map<string, number>();

/** Returns true at most once per `intervalMs` for each `key`. */
export function shouldRun(key: string, intervalMs: number): boolean {
  const now = Date.now();
  const last = lastRun.get(key) ?? 0;
  if (now - last < intervalMs) return false;
  lastRun.set(key, now);
  return true;
}
