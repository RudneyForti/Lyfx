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

---

## Release checklist (E7)

Before tagging `main`, run in this order:

1. Determine version (SemVer) from `VERSIONING.md`
2. Update version in `package.json`
3. Update version badge and footer in `README.md`
4. Add entry to the history table in `VERSIONING.md`
5. Update affected sections in `DOCUMENTATION.md`
6. Update affected sections in `docs/FEATURES.md`
7. If the batch includes a new feature → update `docs/QA-TEST-PLAN.md`
8. Update `docs/DOC-INDEX.md`
9. Merge the bump PR → tag `main` → push tags
10. Deploy: pull `main` in `lyfx-production/` (+ `prisma db push` if schema changed)

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
