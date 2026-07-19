# Agent Workflow Rules

## Language

All code, commit messages, PR descriptions, branch names, comments, and documentation must be written in **English**.
Verbal and chat communication with the project owner may remain in Portuguese.

---

## Agents

### Agent NEO — Implementation
The primary agent. Responsible for coding, file changes, branch management, preparing commits and PRs.
Owns Pipeline NEO from E3 to E7.
**Never executes `git commit`, `git push`, or any destructive git command. No exceptions.**

### Agent Smith — QA
The quality assurance agent. Spawned by Agent NEO at E4.
Responsible for browser validation, behavior verification, and regression detection.
Operates exclusively via browser tools — never touches the codebase.
Reports findings back to Agent NEO in a structured format before any commit block is prepared.

**Agent Smith spawn template** — Agent NEO always spawns Smith with this structure:

```
You are Agent Smith, QA agent for the Lyfx project.

## Context
[What was implemented — feature name, CS reference]

## Files changed
[List of modified files]

## What to validate
[Numbered checklist of behaviors to verify]

## How to access
- URL: http://localhost:3000/[route]
- Credentials if needed: [details]

## Reporting format
Reply with:
- ✅ PASS or ❌ FAIL for each checklist item
- Screenshot or DOM evidence for any failure
- One-line overall verdict: APPROVED or BLOCKED
```

---

## Git Workflow

### Branch structure (GitHub Flow — LC standard)

```
main              ← the only permanent branch. Always deployable.
feature/<slug>    ← born from main, dies at merge (via Pull Request)
```

### Pipeline NEO — stages

| Stage | Owner | Action |
|-------|-------|--------|
| **E3 — Implement** | Agent NEO | Create working branch from `origin/main`: `git fetch origin && git checkout -b feature/name origin/main` (the dev workspace never checks out `main` — it is pinned to the production worktree) |
| **E4 — QA** | Agent Smith | Validates in the browser. Reports APPROVED or BLOCKED before any PR. |
| **E4.5 — Code Review** | Agent NEO | Runs `/code-review` skill on all changes before opening the PR. Checks N+1 queries, missing tests, security issues, and convention violations. No PR is opened if CRITICAL findings remain open. |
| **E5 — Approval** | Human | User explicitly approves in chat. No approval = no PR opened. |
| **E6 — Pull Request** | Agent NEO | Pushes the branch and opens the PR via `gh pr create` with the template checklist. CI must pass. **Human reviews and merges in the GitHub UI.** |
| **E7 — Release** | Agent NEO | Asks first: *"The batch is merged in `main`. Ready to tag and deploy?"* — runs the E7 checklist, tags `main`, and production worktree pulls. Only with explicit confirmation. |

Each stage also moves the work's card on the Studio roadmap — see Roadmap board discipline.

---

## Roadmap board discipline (source of demands)

**Why this section exists:** the Studio Kanban (`docs/cs-board.json`) is the owner's single view of what's planned, in flight, and done. It drifted — real executions shipped with no card, and finished cards (CS-59, CS-49) were never moved out of Backlog — so the board stopped reflecting reality. This binds the board to the pipeline so it stays live.

### Every unit of work is a card

- **No work without a card.** Before starting anything — a planned CS, a bug found in passing, a feature asked for mid-chat — there must be a card for it. If none exists, NEO creates one in **Backlog** first (execution-grade spec: objetivo / escopo / refs / aceite).
- Ad-hoc work is not exempt. "Small" fixes and UI tweaks get a card too.

### The card's column tracks the pipeline stage — updated in the same session

| Pipeline stage | Board move | Who / how |
|----------------|-----------|-----------|
| E3 — branch created | Backlog → **Em andamento** (`startedAt`) | NEO, inside the work's PR |
| E6 — PR merged | Em andamento → **Concluídas** (`commitHash` = merge SHA) | **Automatic** — `.github/workflows/roadmap-sync.yml` |
| E7 — release tagged | (already Done) | NEO stamps `version` = the tag |

- **The E6 move is automated.** On PR merge, `roadmap-sync.yml` resolves the CS number from the PR title (`CS-NN`) or the branch (`feature/NN-…`), moves that card to Concluídas, stamps the merge SHA, and commits the board to `main`. So the roadmap tracks git completion with no manual step. For the automation to fire, **the PR title or branch must carry the CS number.**
- The `Em andamento` move (E3) rides **inside the work's PR** (same diff), so merged `main` reflects reality and the owner sees live what's being executed. The card lands in the PR as `Em andamento`; the merge promotes it to Concluídas automatically.
- **`version` is stamped only at release** — never before a matching git tag exists (see Versioning authority). A merged-but-unreleased card sits in Concluídas with an empty version until E7.

### Reconciliation

- At E7, and whenever the board looks stale, reconcile `docs/cs-board.json` against git reality: every merged PR has a Done card; no Done card carries a version without a tag.
- The board is edited in two places (NEO via git, the owner via the Studio UI). NEO always works from the latest `main` and treats the owner's Studio changes as authoritative demand input — when they conflict, ask.

---

## Commits and pushes — MANUAL EXECUTION ONLY

**Agent NEO never runs `git commit`, `git push`, or any destructive git command. No exceptions.**

After user approval (E5), Agent NEO delivers a commit block in this exact format:

---
### ✅ Ready to commit

**Files to stage:**
```bash
git add path/to/file1 path/to/file2
```

**Commit message:**
```
type(scope): short description

- detail line
- detail line
```

**Run these commands in order:**
```bash
git add <files>
git commit -m "type(scope): short description

- detail line
- detail line"
git push origin branch-name
```
---

The user copies and runs these commands. Agent NEO waits for confirmation before proceeding.

---

## Conventional Commits

Format: `type(scope): subject`

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructure — no behavior change |
| `test` | Adding or updating tests |
| `chore` | Tooling, dependencies, build process |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvement |
| `revert` | Reverts a previous commit |

**Breaking change:** append `!` after the type → `feat!: redesign auth API`

**Scope:** the module or area affected (e.g. `auth`, `studio`, `transactions`, `km`, `goals`, `dashboard`)

**Subject rules:**
- Lowercase, no period at the end
- Imperative mood: `add`, `fix`, `remove` — not `added`, `fixes`, `removed`
- Max 72 characters

---

## Pull Requests

### Solo contributor flow (current)

```
implement → QA → /code-review → approval → push → open PR → CI passes → self-review → merge → branch deleted
```

Agent NEO opens PRs using `gh pr create` with the standard template. The user reviews and merges in the GitHub UI. GitHub auto-deletes the remote branch on merge.

### PR template

```markdown
## Summary
<!-- What changed and why -->

## Changes
- Change 1
- Change 2

## Checklist
- [ ] Link to feature/issue: <!-- CS-XX or issue URL -->
- [ ] Description of changes included above
- [ ] List of additions documented
- [ ] All existing tests are passing
- [ ] New tests were added for this change
- [ ] Agent Smith validated behavior
- [ ] No regressions observed

## References
<!-- CS number, issue, or feature link -->
```

### Reviewer rules

All merges must happen via Pull Request — no direct pushes to any permanent branch.

**Solo projects (e.g. Lyfx):** self-review + merge allowed after Agent Smith QA approval.

**Team projects (e.g. Limiar Core — GitHub Flow):**
- PR flows from `feature/` or `fix/` branch directly to `main` (production)
- Minimum 2 approvals required before merge — reviewers defined in `.github/CODEOWNERS`

---

## Test Coverage Policy

| Test type | Target | Tool |
|-----------|--------|------|
| Integration tests | 100% | framework default |
| Feature tests | 100% | framework default |
| Unit tests (services, etc.) | min. 80% | framework default |
| Frontend | 100% of critical flows | Playwright |

**Backend mock for frontend tests:** when running Playwright or any frontend test suite, the full backend must be mocked — no live API calls during test execution. Agent NEO configures the mock layer; Agent Smith verifies no real requests occur during test runs.

No commit block is prepared when coverage targets are unmet. Smith reports missing coverage as 🟠 HIGH minimum.

---

## Branch naming

| Prefix | When to use |
|--------|-------------|
| `feature/` | New functionality |
| `fix/` | Bug fix or security patch |
| `refactor/` | Restructure without behavior change |
| `chore/` | Tooling, CI, dependencies |
| `hotfix/` | Urgent production fix |
| `release/` | Release branches (e.g. `release/v2.0.0`) |

Branch names: lowercase, hyphen-separated, concise.

**Standard:** `feature/short-description`, `fix/bug-name`
**With card ID (optional):** if a task manager card is referenced in the chat, include its numeric ID — `feature/42-short-description`
Examples: `feature/km-saved-locations`, `fix/auth-session-expiry`, `feature/42-patient-registration`

---

## Code Quality

- Follow the conventions and standards of the framework and language in use.
- Before writing code, read the relevant framework docs — do not rely on training data for framework-specific behavior.
- Run `/code-review` (E4.5) before preparing any commit block. No exceptions.
- Every new behavior requires a test. Every bug fix requires a regression test.

---

## Mandatory rules

- All working branches are born from `main` — always after `git pull`
- Never commit directly to `main` — every change enters via Pull Request
- Never merge a PR with red CI
- Always delete working branches after merge — remote is automatic, local is manual
- `main` is always deployable — a merge that breaks it is priority zero
- Every release (tag) requires updated `DOCUMENTATION.md` and `docs/FEATURES.md`
- Every new feature requires an updated `docs/QA-TEST-PLAN.md`
- `docs/DOC-INDEX.md` must be updated on every release
- **Git tags are the only source of truth for released versions.** The Kanban `version` field is a target, not a fact, until a matching tag exists (see Versioning authority).
- **Releases are never left to accumulate silently.** After every merge, NEO reports release drift and proposes a release when the batch delivers user-facing capability (see Versioning authority).
- **No work without a roadmap card, and the card's column tracks the pipeline stage** — created in Backlog, moved to Em andamento at branch start, to Concluídas at merge, synchronously (see Roadmap board discipline).

---

## Versioning authority (source of truth)

**Why this section exists:** across a run of PRs the `main` branch drifted 21 commits past the last tag with no bump, while the Studio Kanban displayed a `v1.15.0` release group that git never tagged. Two independent failures combined — E7 had no trigger, and the board's free-text `version` field was mistaken for released state. This section closes both.

### The authority chain

1. **`git tag` is the single source of truth** for what has shipped. `git describe --tags main` is the authoritative "where are we" check.
2. **`VERSIONING.md`** is the human-readable ledger — it must have exactly one row per real tag, and no row for a version that isn't tagged.
3. **`package.json` version** must equal the latest tag on the branch it lives on (dev and production worktrees alike).
4. **The Kanban `version` field is a planning target only.** A card may carry an intended version while in Backlog/In Progress. It becomes a *claim of release* the moment the card sits in Done — and that claim is valid **only if a git tag of that version already exists**. Never stamp a Done card with a version that has no tag; if the work shipped, use the tag that actually contains it (`git tag --contains <commit>`).

### Release trigger (fixes "E7 never fired")

E7 is human-approved, but proposing it is NEO's duty, not the human's memory:

- **After every merge into `main`**, NEO runs `git describe --tags main` and states the drift: how many commits ahead of the last tag, and whether any of them deliver user-facing capability (MINOR) or an irreversible boundary (MAJOR).
- **When the batch delivers a new capability, or drift reaches ~5 commits, NEO proposes a release** — proposed version (by SemVer triggers), plus the draft `VERSIONING.md` row — and asks for approval. It does not wait to be asked.
- Letting user-facing work reach `main` and stay untagged with no release proposal on the table is a process failure, reported like a failed gate.

### Reconciliation (fixes "the board lied")

- At E7, and whenever cards are moved to Done, validate every board `version` stamp against `git tag`. A stamp with no matching tag is corrected to the tag that actually contains the work — the board mirrors git, never the reverse.
- The board is a view of reality, not a second versioning system. When board and git disagree, git wins and the board is fixed.

---

## Release checklist (E7)

Before tagging `main`, run in this order:

0. `git describe --tags main` — confirm the drift and the exact commit range this release covers; reconcile board `version` stamps against `git tag` (see Versioning authority)
1. Determine version (SemVer) from `VERSIONING.md` — the new tag must be strictly greater than the latest existing tag
2. Update version in `package.json`
3. Update version badge and footer in `README.md`
4. Add entry to the history table in `VERSIONING.md`
5. Update affected sections in `DOCUMENTATION.md`
6. Update affected sections in `docs/FEATURES.md`
7. If the batch includes a new feature → update `docs/QA-TEST-PLAN.md`
8. Update `docs/DOC-INDEX.md`
9. Merge the bump PR → tag `main` → push the tag (`git push origin --tags`)
10. Deploy is **automatic on tag push**: `.github/workflows/deploy-prod.yml` runs on the self-hosted runner (`lyfx-prod`), checks the tag out in `lyfx-production/`, rebuilds the image, and recreates the containers — the `migrate` service applies any schema change. No manual pull; production tracks the latest release tag. Pushing the tag is the human gate that deploys.

---

## Port conventions (Lyfx-specific)

| Environment | Branch | Port range |
|-------------|--------|------------|
| Development (`lyfx/`) | current working branch | 3000–3009 |
| Production (`lyfx-production/`) | `main` (pinned) | 4000–4009 |

Never run the production worktree on 3000–3099 or the dev workspace on 4000–4099.

---

## Next.js note (Lyfx-specific)

This version has breaking changes — APIs, conventions, and file structure may differ from training data.
Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
