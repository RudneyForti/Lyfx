# Lyfx — Git Workflow
> Branch structure and deployment process
> Updated: 2026-07-03

---

## Overview

Lyfx uses **two permanent branches** — nothing else appears on GitHub outside of an active working session.

```
master   ← production (stable — what is live)
develop  ← development (where all work happens)
```

---

> **Note — team projects (e.g. Limiar Core):** use **GitHub Flow** (1 permanent branch). Feature branches born from `main`, PR goes directly to `main`, branch deleted after merge. No `develop` intermediary. See [Reviewer rules](#reviewer-rules) in AGENTS.md.

---

## CI/CD Pipeline

**Rule:** optional during internal/pre-client development. **Mandatory from the first active client onward** — no exceptions.

When active, the pipeline must:
- Run the full test suite on every push and PR (integration, feature, unit)
- Block PR merge if any test fails
- Block PR merge if coverage thresholds are not met (Integration 100% · Feature 100% · Unit 80%)
- Run on GitHub Actions (or equivalent)

The deploy flow must be documented and automated, including test execution as a required gate.

---

## Docker

Every project must have a `Dockerfile` and `docker-compose.yml` configured for the full stack (server, database, and any other services the project depends on).

**Key rule: same container configuration for development and production** — no environment-specific Dockerfiles.

**Hot reload required:** development containers must be configured with volume mounts so source code changes reflect immediately without rebuilding the image. Example for a Node/Next.js service:

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

Agent NEO creates `Dockerfile` and `docker-compose.yml` at project setup. If they are missing from an existing project, opening a CS to add them is mandatory before the first client goes live.

---

## Branch lifecycle — team projects (GitHub Flow)

Feature and fix branches are **temporary by definition** — they exist only for the duration of a change.

### After merge: always delete

```bash
# Local
git branch -d feature/branch-name

# Remote
git push origin --delete feature/branch-name
```

**GitHub setting (recommended):** enable **"Automatically delete head branches"** in repository Settings → General. GitHub deletes the remote branch immediately after merge — no manual step needed.

The market standard is zero leftover branches. A repository with dozens of stale branches is a navigation and cognitive overhead problem — branches that survive a merge have no purpose.

### Rule
- Branch born from `main` → developed → PR opened → approved → merged → **deleted immediately**
- No branch survives its own merge, local or remote

---

## Why two branches?

| Scenario | master | develop |
|----------|--------|---------|
| Code currently in use | ✅ | ✅ |
| Work in progress | ❌ | ✅ |
| Where agents implement | ❌ | ✅ (via working branch) |
| Direct commit allowed | ❌ | ❌ |
| Advances via merge from | `develop` | working branch |

---

## Full session flow

### 1. Session start — agent branches from `develop`

```bash
git checkout develop
git pull origin develop
git checkout -b feature/feature-name   # or fix/bug-name
```

### 2. Implementation — commits on the working branch

Agent 1 prepares the commit block. **The user executes the commands.**

```bash
# Agent prepares and delivers this block — user runs it
git add <files>
git commit -m "feat(scope): short description

- detail line
- detail line"
```

See [Conventional Commits](#conventional-commits) for message format.

### 3. QA — Agent Smith validates in the browser

Server runs on the working branch. Agent Smith confirms behavior and reports back.

### 3.5. Code review — before commit block

After QA, Agent NEO runs the `/code-review` skill on all recent changes. Checks for N+1 queries, missing tests, security issues, and convention violations. No commit block is prepared until the review completes without CRITICAL findings.

### 4. Approval — user confirms in chat

Without explicit approval, no commit block is prepared. No exceptions.

### 5. Merge into `develop` — working branch is deleted

**Agent NEO prepares this block — user executes it:**

```bash
git checkout develop
git merge feature/feature-name --no-ff -m "chore(merge): feature/feature-name → develop"
git push origin develop

# Delete immediately — local and remote
git branch -d feature/feature-name
git push origin --delete feature/feature-name
```

**Result on GitHub:** only `master` and `develop` are visible. Nothing else.

### 6. Pull Request

Agent 1 opens a PR using `gh pr create` with the standard template.
The user reviews and merges when ready.

```bash
gh pr create \
  --title "feat(scope): short description" \
  --body "$(cat .github/pull_request_template.md)"
```

### 7. Release — user decides when to go to production

When the batch is tested and approved:

```bash
git checkout master
git merge develop --no-ff -m "release: vX.X.Y — summary"
git tag vX.X.Y
git push origin master --tags
git checkout develop
git merge master --no-ff -m "chore: sync develop after release vX.X.Y"
git push origin develop
```

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
| `chore` | Tooling, dependencies, build, merges |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvement |
| `revert` | Reverts a previous commit |

**Breaking change:** append `!` after type → `feat!: redesign auth API`

**Scope examples:** `auth`, `studio`, `transactions`, `km`, `goals`, `dashboard`, `schema`

**Subject rules:**
- Lowercase, no period at the end
- Imperative mood: `add`, `fix`, `remove` — not `added`, `fixes`, `removed`
- Max 72 characters

**Full example:**
```
feat(studio): add field descriptions to all schema models

- Map FIELD_DESCRIPTIONS for all 28 tables
- Fix installmentGroupId key in Transaction
- Remove non-existent completedAt from Goal
```

---

## Commit block format

Every time a commit is ready, Agent NEO delivers this block. The user runs the commands.

```
### ✅ Ready to commit

**Files to stage:**
git add path/to/file

**Commit message:**
type(scope): subject

- detail
- detail

**Run these commands in order:**
git add <files>
git commit -m "type(scope): subject

- detail
- detail"
git push origin branch-name
```

---

## Production worktree

The production environment runs in a separate worktree at `../lyfx-production` (branch `master`, port 4000).

**Initial setup — run once:**

```bash
cd C:/Users/rudne/projetos/lyfx-production
npm install
npx prisma generate
npx prisma db push
```

**Sync rule:** whenever `npm install` or `npm uninstall` runs in `lyfx/`, replicate in `lyfx-production/`:

```bash
cd C:/Users/rudne/projetos/lyfx && npm install <package>
cd C:/Users/rudne/projetos/lyfx-production && npm install <package>
```

---

## Database isolation

Each environment has its own `.env` (gitignored — never tracked) pointing to its exclusive database:

| Environment | `.env` file | `DATABASE_URL` | Database |
|-------------|-------------|----------------|----------|
| Development | `lyfx/.env` | `file:./dev.db` | `lyfx/dev.db` — test data, freely resettable |
| Production | `lyfx-production/.env` | `file:./prod.db` | `lyfx-production/prod.db` — real user data |

**Critical rule:** never change `DATABASE_URL` in `lyfx-production/.env` to point to `dev.db`.

---

## Port conventions

| Environment | Branch | Port range | Command |
|-------------|--------|------------|---------|
| Development | `develop` + working branches | 3000–3009 | `npm run dev -- --port 3000` |
| Production | `master` | 4000–4009 | `npm run dev -- --port 4000` |

---

## Timeline diagram

```
develop  ──●──────────────────●──────────────── (batch merge) ──►
            │                 │                       │
            └─ fix/cs-01 ─────┘ (deleted)             │
               feature/cs-06 ──────────────────────────┘ (deleted)

master   ──────────────────────────────────────────────●─────────►
                                                  (approved release)
```

---

## Inviolable rules

1. **Never commit directly to `master`** — no exceptions
2. **Never commit directly to `develop`** — always via working branch + merge
3. **Delete branches after merge** — immediately, local and remote
4. **Always use `--no-ff`** on merges — preserves history
5. **`master` advances only via `develop`** — never from a working branch directly
6. **Release only with explicit approval** — agent never merges `develop → master` autonomously
7. **Every master merge requires updated documentation** — `DOCUMENTATION.md` and `docs/FEATURES.md` before merge
8. **Every new feature requires a test plan** — update `docs/QA-TEST-PLAN.md` before master merge
9. **`docs/DOC-INDEX.md` is mandatory on every merge** — reflect any new file, rename, or archive

---

## E7 — Release checklist (develop → master)

Run in this order. No step is optional.

### 1. Determine the new version

Check `VERSIONING.md` to decide PATCH, MINOR, or MAJOR based on what is in the batch.

### 2. Update `package.json`

```json
"version": "X.X.X"
```

### 3. Update `README.md`

**Version badge:**
```markdown
![Version](https://img.shields.io/badge/version-X.X.X-22D3EE?style=flat-square)
```

**Footer:**
```markdown
*vX.X.X · Month Year · Personal project in active development.*
```

**Module table** — add a row if the batch included a new module.

### 4. Update `VERSIONING.md`

Add a row to the history table:
```markdown
| `X.X.X` | PATCH/MINOR/MAJOR | What was built in this batch |
```

### 5. Update `DOCUMENTATION.md`

Update only the sections touched by the batch:
- New module → routes, Server Actions, Prisma schema, calculation formulas, data flow
- Auth change → update "Authentication and Session"
- New schema field → update "Database Schema" with the full annotated model
- New external integration → document endpoint, parameters, expected response, gotchas
- New architectural decision → add to "Architectural Decisions" with technical rationale

### 6. Update `docs/FEATURES.md`

Audience: analysts, managers, users in onboarding — non-technical language.

Update only the sections touched by the batch:
- New feature → new chapter: what it does, how to use it, where data goes, module interactions, user value
- Modified feature → update description, flow, and impacts
- Do not mention routes, Prisma, code, or variable names in this document

### 7. Update `docs/QA-TEST-PLAN.md` *(required if batch includes a new feature)*

For each new feature, add a section with:
- Test scenarios (happy path + edge cases)
- Measurable acceptance criteria
- Reproduction steps for Agent Smith

### 8. Update `docs/DOC-INDEX.md` *(required on every merge)*

- New document created → add row to the corresponding table
- Document moved or renamed → update path
- Document archived → move row to the archive section
- Document version changed → update the Version column

### 9. Merge, tag, and sync

**Agent NEO prepares this block — user executes it:**

```bash
git checkout master
git merge develop --no-ff -m "release: vX.X.X — batch summary"
git tag vX.X.X
git push origin master --tags
git checkout develop
git merge master --no-ff -m "chore: sync develop after release vX.X.X"
git push origin develop
```

---

## Current state (2026-07-03)

| Branch | Version | Contents |
|--------|---------|----------|
| `master` | v1.11.0 | CS-01 through CS-30 implemented and QA approved |
| `develop` | v1.11.2 | CS-23 Docker complete — pending release to master |

Next planned releases: `v1.12.0` — Studio Roadmap/Backlog (CS-20) · `v1.13.0` — OFX/CSV import (CS-21).
