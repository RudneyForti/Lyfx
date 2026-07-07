# Lyfx — Git Workflow (GitHub Flow)
> Branch structure and deployment process — LC standard
> Updated: 2026-07-05 · Replaces the master/develop model (retired at v1.14.1)

---

## Overview

Lyfx uses **GitHub Flow**: one permanent branch and short-lived feature branches.

```
main              ← the only permanent branch. Always deployable.
feature/<slug>    ← born from main, dies at merge (via Pull Request)
fix/<slug>
refactor/<slug>
chore/<slug>
```

**Every merge into `main` happens via Pull Request. No exceptions.**

---

## Why GitHub Flow?

| Principle | Practice |
|-----------|----------|
| `main` is always deployable | CI must pass before any merge |
| Work is isolated | Every change lives on its own branch |
| Review is the gate | PR + checklist + CI replace the old E5/E6 approval chain |
| History stays clean | Branches are deleted at merge — zero leftovers |
| Release = tag | Production advances by tagging `main`, not by merging branches |

---

## Full session flow

### 1. Session start — branch from `origin/main`

```bash
git fetch origin --prune
git checkout -b feature/feature-name origin/main   # or fix/ chore/ refactor/
```

> **Why not `git checkout main`?** The `main` branch is pinned to the production
> worktree (`lyfx-production/`) — git refuses to check it out twice. The dev
> workspace always branches directly from `origin/main`, never holds `main` locally.

### 2. Implementation — commits on the working branch

Conventional Commits format (see below). Commit early, commit often.

### 3. QA — Agent Smith validates

Server runs on the working branch (port 3000). Smith audits and reports APPROVED or BLOCKED.

### 3.5. Code review — before the PR

Agent NEO runs the `/code-review` skill on all changes. No PR is opened until the review completes without CRITICAL findings.

### 4. Push + open the Pull Request

```bash
git push -u origin feature/feature-name
gh pr create --title "feat(scope): short description" --fill
```

The PR template checklist must be filled. CI runs automatically on the PR.

### 5. Review and merge — in the GitHub UI

- CI green + checklist complete → **Squash and merge** (or Merge commit for multi-commit history worth preserving)
- GitHub deletes the remote branch automatically (repo setting)
- Delete the local branch: `git branch -d feature/feature-name`

### 6–7. Release + Deploy — tag to release, deploy is automatic

After the bump PR is merged (E7 checklist: versioning + docs), push a version tag. **Pushing the tag is the deploy** — it triggers `.github/workflows/deploy-prod.yml` on the self-hosted runner, which checks out the tag in `lyfx-production/`, rebuilds the image, and recreates the containers (the `migrate` service applies any schema change). No manual pull, no manual `docker compose`, no manual `prisma db push`.

```bash
# from anywhere with the merged main fetched:
git tag vX.X.X <merged-bump-commit>
git push origin --tags        # ← this deploys: the runner rebuilds + restarts prod
```

Production tracks the **latest release tag**, not `main`-HEAD — so what runs on port 4000 is exactly what was released. Merging a PR does not deploy; only a tag push does. Tagging remains a human decision (inviolable rule 5).

> **Model note:** under deploy-on-tag the production worktree checks out the tag (detached HEAD at the release commit) rather than tracking `main`. This is deliberate — it makes the deployed version deterministic and auditable.

---

## Local environments

| Environment | Directory | Branch | Port | Database |
|-------------|-----------|--------|------|----------|
| Development | `lyfx/` | current feature branch | 3000–3009 | `lyfx_dev` (container `lyfx-db-dev`, host port 5433) |
| Production | `lyfx-production/` | `main` (pinned) | 4000–4009 | `lyfx_prod` (container `lyfx-db-prod`, host port 5434) |

**Critical rule:** never point `lyfx-production/.env` at the dev database.

**npm sync rule:** whenever a package is installed/removed in `lyfx/`, replicate in `lyfx-production/`.

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
**Subject rules:** lowercase, imperative mood, no trailing period, max 72 chars.

---

## Pull Request rules

- Template: `.github/pull_request_template.md` — checklist is mandatory
- CI (`.github/workflows/ci.yml`) must be green before merge
- Solo flow: self-review allowed after Agent Smith QA approval
- Reviewers resolve via `.github/CODEOWNERS`
- **"Automatically delete head branches"** must stay enabled in repo Settings → General

---

## Branch lifecycle

Feature branches are **temporary by definition**.

```
main ──●───────────────●──────────────●──── (tag vX.X.X) ──►
        \             /│\            /
         feature/a ──● │ fix/b ─────●   ← PRs; branches deleted at merge
                       │
                  (CI on every PR)
```

- Born from `main` → developed → PR → CI green → merged → **deleted immediately**
- No branch survives its own merge, local or remote

---

## Inviolable rules

1. **Never commit directly to `main`** — every change enters via PR
2. **Never merge a PR with red CI**
3. **Delete branches after merge** — remote is automatic, local is manual
4. **`main` is always deployable** — if a merge breaks it, fixing it is priority zero
5. **Release only with explicit approval** — tagging is a human decision
6. **Every release requires updated documentation** — see E7 checklist
7. **Schema changes in a release require `prisma db push` on production**
8. **Git tags are the sole source of truth for released versions** — `VERSIONING.md`, `package.json`, and the Studio Kanban `version` field all mirror `git tag`, never the reverse. A Kanban card in Done may only show a version that has a matching tag (`git tag --contains <commit>` resolves the real one).
9. **Releases are proposed, not awaited** — after every merge, NEO checks `git describe --tags main` and proposes a release once the batch delivers user-facing capability or drift reaches ~5 commits. User-facing work left untagged on `main` with no proposal on the table is a process failure. See `AGENTS.md` → Versioning authority.

---

## E7 — Release checklist (tag on main)

Run in this order before tagging. No step is optional.

1. **Version** — decide PATCH / MINOR / MAJOR via `VERSIONING.md` + SemVer tree
2. **`package.json`** — bump version
3. **`README.md`** — version badge + footer
4. **`VERSIONING.md`** — add history row
5. **`DOCUMENTATION.md`** — header + affected sections
6. **`docs/FEATURES.md`** — affected features (non-technical language)
7. **`docs/QA-TEST-PLAN.md`** — required if the batch includes a new feature
8. **`docs/DOC-INDEX.md`** — required on every release
9. **Commit the bump via PR**, merge it, then tag the merged commit and push the tag:

```bash
git fetch origin --tags
git tag vX.X.X origin/main        # the merged bump commit
git push origin --tags            # ← deploys automatically (see step 10)
```

10. **Deploy is automatic on tag push** — `.github/workflows/deploy-prod.yml` runs on the self-hosted runner (`lyfx-prod`): checks out the tag in `lyfx-production/`, `docker compose build` + `up -d`; the `migrate` service applies any schema change. Watch the Actions run to confirm green. No manual pull / build / `prisma db push`.

---

## Migration note (2026-07-05)

The previous model (`master` + `develop`, direct `--no-ff` merges, no PRs) was retired
at v1.14.1 as part of the Limiar Core standardization. `master` was renamed to `main`;
`develop` was deleted after full synchronization. History is preserved — every release
tag up to v1.14.1 predates this migration.
