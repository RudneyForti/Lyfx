#!/usr/bin/env node
/**
 * Roadmap sync — moves a merged CS card to "Concluídas" (done).
 *
 * Invoked by .github/workflows/roadmap-sync.yml when a PR is merged into main,
 * so the Studio roadmap tracks git completion automatically instead of relying
 * on a manual post-merge step.
 *
 * Usage: node scripts/roadmap-move-to-done.mjs "<branch>" "<pr title>" "<merge sha>"
 *
 * Resolves the CS number from the PR title ("... (CS-72)") first, then the
 * branch name ("feature/72-..."). No match, card missing, or already done →
 * no-op (exit 0, board untouched). The `version` field is left empty on
 * purpose — versions are stamped only at release, when a matching git tag
 * exists (git-tag authority rule).
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , branch = "", title = "", sha = ""] = process.argv;
const BOARD = "docs/cs-board.json";

function resolveCs() {
  const fromTitle = title.match(/CS-(\d+[a-z]?)/i);
  if (fromTitle) return `CS-${fromTitle[1].toUpperCase()}`;
  const fromBranch = branch.match(/^[a-z]+\/(\d+[a-z]?)[-_]/i);
  if (fromBranch) return `CS-${fromBranch[1].toUpperCase()}`;
  return null;
}

const cs = resolveCs();
if (!cs) {
  console.log(`roadmap-sync: no CS number in title/branch (title="${title}", branch="${branch}") — skipping.`);
  process.exit(0);
}

const board = JSON.parse(readFileSync(BOARD, "utf8"));
const card = board.cards.find((c) => c.csNumber === cs);
if (!card) {
  console.log(`roadmap-sync: ${cs} is not on the board — skipping.`);
  process.exit(0);
}
if (card.columnId === "done") {
  console.log(`roadmap-sync: ${cs} is already in Concluídas — skipping.`);
  process.exit(0);
}

card.columnId = "done";
card.commitHash = sha ? sha.slice(0, 7) : card.commitHash;
card.completedAt = new Date().toISOString();
// version intentionally left as-is (stamped only at release).
board.lastUpdated = new Date().toISOString();

writeFileSync(BOARD, JSON.stringify(board, null, 2) + "\n", "utf8");
console.log(`roadmap-sync: moved ${cs} to Concluídas (commit ${card.commitHash || "—"}).`);
