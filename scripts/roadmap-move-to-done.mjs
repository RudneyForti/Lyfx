#!/usr/bin/env node
/**
 * Roadmap sync — promotes a merged CS card to "Concluídas" (done).
 *
 * Invoked by .github/workflows/roadmap-sync.yml when a PR is merged into main,
 * so the Studio roadmap tracks git completion automatically instead of relying
 * on a manual post-merge step.
 *
 * Usage: node scripts/roadmap-move-to-done.mjs "<branch>" "<pr title>" "<merge sha>" "<pr number>"
 *
 * Resolves the CS number from the PR title ("... (CS-72)") first, then the
 * branch name ("feature/72-..."). No match → no-op.
 *
 * CS-76: if the card is NOT on the git board, it is CREATED — this is the
 * promotion of a locally-planned card (Postgres layer) into git ownership.
 * The local row survives as an annotation satellite; the Studio splices its
 * checklist/comments back onto this locked card. The `version` field is left
 * empty on purpose — versions are stamped only at release, when a matching
 * git tag exists (git-tag authority rule). `prNumber` links the card to the
 * pull request that carried it.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , branch = "", title = "", sha = "", prNumberArg = ""] = process.argv;
const BOARD = "docs/cs-board.json";

function resolveCs() {
  // Suffix is lowercase on the board ("CS-37b") — keep it that way.
  const fromTitle = title.match(/CS-(\d+[a-z]?)/i);
  if (fromTitle) return `CS-${fromTitle[1].toLowerCase()}`;
  const fromBranch = branch.match(/^[a-z]+\/(\d+[a-z]?)[-_]/i);
  if (fromBranch) return `CS-${fromBranch[1].toLowerCase()}`;
  return null;
}

const cs = resolveCs();
if (!cs) {
  console.log(`roadmap-sync: no CS number in title/branch (title="${title}", branch="${branch}") — skipping.`);
  process.exit(0);
}

const prNumber = /^\d+$/.test(prNumberArg) ? Number(prNumberArg) : null;
const board = JSON.parse(readFileSync(BOARD, "utf8"));
// Board CS numbers historically mix suffix case — match case-insensitively.
let card = board.cards.find((c) => c.csNumber.toLowerCase() === cs.toLowerCase());

if (card && card.columnId === "done") {
  console.log(`roadmap-sync: ${card.csNumber} is already in Concluídas — skipping.`);
  process.exit(0);
}

if (!card) {
  // Promotion: the card was planned in the local (Postgres) layer and never
  // existed in git. Merge is the moment git takes ownership — create it.
  card = {
    id: cs.toLowerCase(),
    columnId: "done",
    csNumber: cs,
    title: title.replace(/^\w+(\([^)]*\))?!?:\s*/, ""), // strip conventional-commit prefix
    description: "",
    labels: [],
    version: "",
    commitHash: "",
    completedAt: null,
    order: 9999,
    startedAt: null,
    dueAt: null,
    checklist: [],
    comments: [],
    prNumber: null,
  };
  board.cards.push(card);
  console.log(`roadmap-sync: ${cs} promoted from the local layer (new git card).`);
}

card.columnId = "done";
card.commitHash = sha ? sha.slice(0, 7) : card.commitHash;
card.completedAt = new Date().toISOString();
if (prNumber !== null) card.prNumber = prNumber;
// version intentionally left as-is (stamped only at release).
board.lastUpdated = new Date().toISOString();

writeFileSync(BOARD, JSON.stringify(board, null, 2) + "\n", "utf8");
console.log(`roadmap-sync: moved ${card.csNumber} to Concluídas (commit ${card.commitHash || "—"}, PR #${prNumber ?? "?"}).`);
