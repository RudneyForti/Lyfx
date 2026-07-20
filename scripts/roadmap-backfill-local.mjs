#!/usr/bin/env node
/**
 * CS-76 — one-time backfill of the local roadmap layer.
 *
 * Seeds the RoadmapCard table (Postgres) from the current docs/cs-board.json,
 * taking only the pre-PR cards (backlog / blocked / in-progress). The `done`
 * cards stay in the git board — git owns them. Idempotent: ON CONFLICT DO
 * NOTHING, so a second run never duplicates or clobbers edits made after the
 * first run.
 *
 * Run inside the environment that owns the local layer (dev / port 3000):
 *   docker exec lyfx-dev node scripts/roadmap-backfill-local.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BOARD_FILE = join(__dirname, "..", "docs", "cs-board.json");
const LOCAL_COLUMNS = new Set(["backlog", "blocked", "in-progress"]);

const board = JSON.parse(readFileSync(BOARD_FILE, "utf-8"));
const cards = (board.cards ?? []).filter(
  (c) => LOCAL_COLUMNS.has(c.columnId) && String(c.csNumber ?? "").trim() !== ""
);

if (cards.length === 0) {
  console.log("roadmap-backfill: no local cards to seed.");
  process.exit(0);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let inserted = 0;
try {
  for (const c of cards) {
    const now = new Date();
    const res = await client.query(
      `INSERT INTO "RoadmapCard"
         ("id","csNumber","title","description","columnId","labels","order",
          "startedAt","dueAt","checklist","comments","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)
       ON CONFLICT ("csNumber") DO NOTHING`,
      [
        randomUUID(),
        c.csNumber,
        c.title ?? "",
        c.description ?? "",
        c.columnId,
        Array.isArray(c.labels) ? c.labels : [],
        typeof c.order === "number" ? c.order : 0,
        c.startedAt ? new Date(c.startedAt) : null,
        c.dueAt ? new Date(c.dueAt) : null,
        JSON.stringify(Array.isArray(c.checklist) ? c.checklist : []),
        JSON.stringify(Array.isArray(c.comments) ? c.comments : []),
        now,
      ]
    );
    inserted += res.rowCount ?? 0;
  }
  console.log(
    `roadmap-backfill: ${cards.length} local cards found, ${inserted} inserted (rest already present).`
  );
} finally {
  await client.end();
}
