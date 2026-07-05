/**
 * throttle-gate.ts — gate de execução por chave com cooldown em memória.
 *
 * Usado para limitar trabalho repetitivo em hot paths (ex.: sync de alertas
 * e presença no layout, que roda em toda navegação). O estado vive no
 * processo Node — reinício do servidor zera os cooldowns, o que é aceitável:
 * o pior caso é uma execução extra.
 */

const lastRun = new Map<string, number>();

/** Retorna true no máximo 1× por `intervalMs` para cada `key`. */
export function shouldRun(key: string, intervalMs: number): boolean {
  const now = Date.now();
  const last = lastRun.get(key) ?? 0;
  if (now - last < intervalMs) return false;
  lastRun.set(key, now);
  return true;
}
