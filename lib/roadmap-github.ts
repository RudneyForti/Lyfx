/**
 * CS-76 (phase B) — GitHub as the roadmap's source of truth for what entered
 * git: the `done` archive is read from origin/main and the Revisão column is
 * projected from open PRs.
 *
 * Design constraints:
 *  - Short in-memory cache (60s) so board reloads don't burn API quota.
 *  - Every failure degrades to `null` — the caller falls back to the local
 *    git file and flags the board `stale`. The Studio must render offline.
 *  - Auth via GITHUB_TOKEN (fine-grained PAT, read-only Contents + Pull
 *    requests on this repo). Without it, requests are attempted anonymously —
 *    they fail on a private repo and the fallback kicks in.
 */

import { migrateBoard, resolveCsNumber, type KanbanBoard, type OpenPRRef } from "@/lib/kanban";

const REPO = process.env.GITHUB_REPO ?? "RudneyForti/Lyfx";
const API = "https://api.github.com";
const CACHE_TTL_MS = 60_000;
// Failures are cached too (shorter): otherwise every Studio load would pay
// the full fetch timeout while GitHub is down or rate-limited.
const FAILURE_TTL_MS = 30_000;
const FETCH_TIMEOUT_MS = 8_000;

interface CacheEntry<T> {
  value: T | null; // null = last attempt failed
  fetchedAt: number;
}

// Module-level cache — survives across requests in a warm server process.
let boardCache: CacheEntry<KanbanBoard> | null = null;
let prsCache: CacheEntry<OpenPRRef[]> | null = null;

/** true when the entry is still within its TTL (success and failure TTLs differ). */
function isFresh<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  if (!entry) return false;
  const ttl = entry.value === null ? FAILURE_TTL_MS : CACHE_TTL_MS;
  return Date.now() - entry.fetchedAt < ttl;
}

async function ghFetch(path: string, accept: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API}${path}`, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

/** The board as origin/main sees it — or null when GitHub is unreachable. */
export async function fetchGitHubBoard(): Promise<KanbanBoard | null> {
  if (isFresh(boardCache)) return boardCache.value;
  try {
    const res = await ghFetch(
      `/repos/${REPO}/contents/docs/cs-board.json?ref=main`,
      "application/vnd.github.raw+json"
    );
    const board = res.ok ? migrateBoard(JSON.parse(await res.text())) : null;
    boardCache = { value: board, fetchedAt: Date.now() };
    return board;
  } catch {
    boardCache = { value: null, fetchedAt: Date.now() };
    return null;
  }
}

/** Open PRs resolved to CS numbers — or null when GitHub is unreachable.
 *  PRs that don't resolve to a CS are skipped (nothing to project). */
export async function fetchOpenPRs(): Promise<OpenPRRef[] | null> {
  if (isFresh(prsCache)) return prsCache.value;
  try {
    const res = await ghFetch(`/repos/${REPO}/pulls?state=open&per_page=50`, "application/vnd.github+json");
    if (!res.ok) {
      prsCache = { value: null, fetchedAt: Date.now() };
      return null;
    }
    const raw = (await res.json()) as Array<{
      number: number;
      title: string;
      head: { ref: string };
    }>;
    const refs: OpenPRRef[] = [];
    for (const pr of raw) {
      const cs = resolveCsNumber(pr.title ?? "", pr.head?.ref ?? "");
      if (cs) refs.push({ csNumber: cs, prNumber: pr.number, title: pr.title });
    }
    prsCache = { value: refs, fetchedAt: Date.now() };
    return refs;
  } catch {
    prsCache = { value: null, fetchedAt: Date.now() };
    return null;
  }
}
