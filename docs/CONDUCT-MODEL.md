# Conduct Model — Agent System & Workflow
> Standardization log: all changes applied to the agent system and workflow documentation
> Reference document: `dev-requirements.md` (Limiar Core — 17 requirements across 6 categories)
> Updated: 2026-07-04

---

## Context

This document records the full standardization cycle applied to the agent system (NEO + Smith) and workflow files (AGENTS.md, GIT-WORKFLOW.md) based on the Limiar Core development requirements document. The goal was to align agent behavior and team workflow conventions with market practices and the project's specific quality standards.

All changes were applied to the Lyfx agent workspace and are effective for both Lyfx and Limiar Core projects. Project-specific rules are explicitly scoped in the relevant sections.

---

## Source document — dev-requirements.md

17 requirements across 6 categories:

| # | Category | Requirement |
|---|----------|-------------|
| 1 | Language | All code, docs, and descriptions in English |
| 2 | Testing | Integration tests 100% coverage |
| 3 | Testing | Feature tests 100% coverage |
| 4 | Testing | Unit tests minimum 80% coverage |
| 5 | Testing | Frontend tests using Playwright |
| 6 | Testing | Full backend mock for frontend tests |
| 7 | Git | No automatic commits by Claude Code |
| 8 | Git | Review all code before each commit |
| 9 | Git | Always push manually |
| 10 | Git | All code via specific branches + Pull Request |
| 11 | Code Quality | Follow framework and language conventions |
| 12 | Code Quality | Run Claude skill (/code-review) before each push |
| 13 | Pull Requests | Standardized PR description with checklist |
| 14 | Pull Requests | Minimum 2 approvals — reviewers defined in CODEOWNERS |
| 15 | CI/CD | CI/CD pipeline mandatory (GitHub Actions or equivalent) |
| 16 | CI/CD | Deploy flow documented and automated |
| 17 | CI/CD | Docker configured for all projects — dev = prod |

---

## Changes applied

### AGENTS.md

#### 1. New pipeline step — E4.5 Code Review

**Before:** E4 QA → E5 Approval → E6 Commit
**After:** E4 QA → E4.5 `/code-review` → E5 Approval → E6 Commit

Agent NEO now runs the `/code-review` skill on all recent changes before preparing any commit block. The skill checks for N+1 queries, missing tests, security issues, and convention violations. CRITICAL findings block the commit block from being prepared.

*Covers requirements: #8, #12*

---

#### 2. PR template — checklist expanded

**Before:** Summary / Changes / Testing (tested locally, Smith validated, no regressions) / References

**After:** added three explicit checklist items aligned with the requirements document:
- Link to feature/issue (CS-XX or URL)
- List of additions documented
- All existing tests are passing
- New tests were added for this change
- Agent Smith validated behavior
- No regressions observed

*Covers requirement: #13*

---

#### 3. New section — Test Coverage Policy

Previously absent. Agents now have formal coverage targets:

| Test type | Target | Tool |
|-----------|--------|------|
| Integration tests | 100% | framework default |
| Feature tests | 100% | framework default |
| Unit tests (services) | min. 80% | framework default |
| Frontend | 100% of critical flows | Playwright |

Backend mock rule: any Playwright or frontend test suite must run with fully mocked backend. No live API calls during test execution. Agent NEO configures the mock layer; Agent Smith verifies at E4.

*Covers requirements: #2, #3, #4, #5, #6*

---

#### 4. Reviewer rules — section reformulated

**Before:** conditional ("when contributors are added, configure CODEOWNERS")

**After:** permanent rule, split by project type:
- **Solo projects (Lyfx):** self-review after Smith QA approval
- **Team projects (Limiar Core — GitHub Flow):** PR flows from `feature/` or `fix/` directly to `main`. Minimum 2 approvals required. Reviewers defined in `.github/CODEOWNERS`

*Covers requirements: #10, #14*

---

#### 5. New section — Code Quality

Previously absent. Three rules added:
- Follow the conventions and standards of the framework in use
- Read framework docs before writing code — do not rely on training data
- `/code-review` (E4.5) before any commit block. No exceptions

*Covers requirements: #11, #12*

---

#### 6. Branch naming — card ID convention added

**Before:** `feature/description`, `fix/bug-name` only

**After:**
- Standard: `feature/description`, `fix/bug-name`
- With task manager card: `feature/42-description` (numeric ID only — tool-agnostic)

*Covers requirement: #10*

---

### GIT-WORKFLOW.md

#### 7. New step 3.5 — Code review before commit

Added between step 3 (QA) and step 4 (Approval) in the session flow. Documents that Agent NEO runs `/code-review` after QA validation and before preparing the commit block.

*Covers requirements: #8, #12*

---

#### 8. New section — Branch lifecycle (team projects)

Previously absent. Documents the complete lifecycle of a feature branch:
- Born from `main`
- Developed and pushed
- PR opened
- Approved and merged
- **Deleted immediately** — local and remote

GitHub setting documented: **"Automatically delete head branches"** (Settings → General) automates the remote deletion on PR merge. Market standard: zero leftover branches after merge.

*Covers requirement: #10*

---

#### 9. GitHub Flow note

Added note at the top of the file making explicit that team projects (Limiar Core) use GitHub Flow: 1 permanent branch (`main`), no `develop` intermediary, PRs go directly to `main`.

---

#### 10. New section — CI/CD Pipeline

Rule: optional during internal/pre-client development. **Mandatory from the first active client onward.**

When active, the pipeline must:
- Run full test suite on every push and PR
- Block PR merge on test failure
- Block PR merge if coverage thresholds are not met
- Run automated deploy on merge to `main`

*Covers requirements: #15, #16*

---

#### 11. New section — Docker

Every project must have `Dockerfile` + `docker-compose.yml` for the full stack.

Key rules:
- Same container configuration for development and production
- Hot reload via volume mounts — no image rebuild required for source code changes
- Agent NEO creates Docker files at project setup
- Missing Docker in existing project = 🟠 HIGH before first client go-live

*Covers requirement: #17*

---

### agent-neo.md

#### 12. Behavioral Invariants — two new rules

Added invariants 10b and 10c:
- **10b:** Never declare a feature complete without coverage thresholds met. Smith verifies at E4 — missing coverage = 🟠 HIGH minimum
- **10c:** Never prepare a commit block without running `/code-review` at E4.5. Zero exceptions

*Covers requirements: #2, #3, #4, #8, #12*

---

#### 13. New activation trigger — frontend test without backend mock

When Playwright or frontend test suite is present without a mock layer, NEO must configure MSW or equivalent before advancing to E4. Absence reported to Smith as 🟠 HIGH if found at E4.

*Covers requirement: #6*

---

#### 14. New activation trigger — project without Docker configuration

When a project has no `Dockerfile` + `docker-compose.yml`, NEO flags as 🟠 HIGH and opens a CS to add them before first client goes live. Hot reload via volume mounts required.

*Covers requirement: #17*

---

### agent-smith.md

#### 15. New activation trigger — Playwright without backend mock

When frontend tests run with live API calls, Smith classifies:
- Live API calls detected during test execution: 🔴 CRITICAL
- Mock layer absent: 🟠 HIGH

Cites Meszaros: a test calling a real external dependency is an integration test in disguise.

*Covers requirement: #6*

---

#### 16. New activation trigger — coverage thresholds not met

When implementation ends without meeting coverage targets (Integration 100% / Feature 100% / Unit 80%), Smith reports 🟠 HIGH minimum. Cites Beck (Clean Check-in) and Humble/Farley (coverage as Commit Stage gate).

*Covers requirements: #2, #3, #4*

---

#### 17. New E4 frontend checklist

When a CS includes frontend changes, Smith adds a 4-item table to the QA Report:
- Backend mock layer configured
- Zero live API calls during test execution
- Critical user flows covered by Playwright
- Coverage thresholds met

Any failure = 🟠 HIGH minimum. Live API calls = 🔴 CRITICAL.

*Covers requirements: #5, #6*

---

### New documents created

#### 18. docs/WORKFLOW-TEMPLATES.md

Complete template library for all inter-agent communication and project documentation:
- Change Spec (CS-XX) — 10 fields
- E1 Classification
- E2 Implementation Plan
- E3 Implementation Summary
- Handoff Package (E3 → E4)
- E4 QA Report (Agent Smith) + Frontend checklist
- E5 Approval Summary
- E6 Commit Block
- E7 Release Block
- Pull Request template
- Test Plan entry (per feature)
- Feature Documentation entry (non-technical)
- Severity reference table

---

## Requirements coverage

| # | Requirement | Status | File(s) |
|---|-------------|--------|---------|
| 1 | English for everything | ✅ Documented | AGENTS.md |
| 2 | Integration tests 100% | ✅ Documented | AGENTS.md, agent-neo.md, agent-smith.md |
| 3 | Feature tests 100% | ✅ Documented | AGENTS.md, agent-neo.md, agent-smith.md |
| 4 | Unit tests min. 80% | ✅ Documented | AGENTS.md, agent-neo.md, agent-smith.md |
| 5 | Playwright for frontend | ✅ Documented | AGENTS.md, agent-smith.md |
| 6 | Full backend mock | ✅ Documented | AGENTS.md, agent-neo.md, agent-smith.md |
| 7 | No auto commits | ✅ Documented | AGENTS.md |
| 8 | Review code before commit | ✅ Documented | AGENTS.md, GIT-WORKFLOW.md, agent-neo.md |
| 9 | Manual push always | ✅ Documented | AGENTS.md |
| 10 | Branches + PR mandatory | ✅ Documented | AGENTS.md, GIT-WORKFLOW.md |
| 11 | Framework conventions | ✅ Documented | AGENTS.md, agent-neo.md |
| 12 | /code-review before push | ✅ Documented | AGENTS.md, GIT-WORKFLOW.md, agent-neo.md |
| 13 | Standardized PR checklist | ✅ Documented | AGENTS.md, WORKFLOW-TEMPLATES.md |
| 14 | Min. 2 approvals via CODEOWNERS | ✅ Documented | AGENTS.md |
| 15 | CI/CD pipeline | ✅ Documented | GIT-WORKFLOW.md |
| 16 | Deploy documented and automated | ✅ Documented | GIT-WORKFLOW.md |
| 17 | Docker — dev = prod + hot reload | ✅ Documented | GIT-WORKFLOW.md, agent-neo.md |

---

## Pending application

These items are documented in the agent system and workflow files but have not yet been applied to any active project. They represent the implementation backlog — to be executed as Change Specs per project.

| # | Item | Project | Trigger | Priority |
|---|------|---------|---------|----------|
| A | Configure `.github/CODEOWNERS` with reviewer assignments | Limiar Core | Immediately | 🔴 High |
| B | Enable "Automatically delete head branches" in GitHub Settings | Limiar Core | Immediately | 🔴 High |
| C | Create `Dockerfile` + `docker-compose.yml` with hot reload | Limiar Core | Before first client | 🟠 Medium |
| D | Configure CI/CD pipeline (GitHub Actions) with test gates | Limiar Core | Before first client | 🟠 Medium |
| E | Create `.github/pull_request_template.md` from WORKFLOW-TEMPLATES.md | Limiar Core | Before first PR | 🟠 Medium |
| F | Set up test coverage reporting in CI | Limiar Core | With CI/CD setup | 🟡 Low |
| G | Configure Playwright + backend mock layer in test suite | Limiar Core | With first frontend feature | 🟡 Low |
| H | Create `Dockerfile` + `docker-compose.yml` with hot reload | Lyfx | Already has Docker (CS-23) — verify hot reload config | 🟡 Low |

---

## Files modified in this cycle

| File | Type | Summary |
|------|------|---------|
| `AGENTS.md` | Modified | +E4.5, +Test Coverage Policy, +Code Quality, +Reviewer rules, updated PR template and branch naming |
| `AGENTS.md.old` | Created | Backup of pre-change state |
| `docs/GIT-WORKFLOW.md` | Modified | +Step 3.5, +Branch lifecycle, +GitHub Flow note, +CI/CD section, +Docker section |
| `docs/GIT-WORKFLOW.md.old` | Created | Backup of pre-change state |
| `.claude/agents/agent-neo.md` | Modified | +Invariants 10b/10c, +backend mock trigger, +Docker trigger |
| `.claude/agents/agent-smith.md` | Modified | +Playwright/mock trigger, +coverage trigger, +E4 frontend checklist |
| `.claude/agents/Agent_Smith/agent-smith-v12.md` | Created | Full backup of agent-smith.md (1783 lines) |
| `.claude/agents/Agent_Neo/agent-neo-v1.4.md` | Created | Full backup of agent-neo.md (781 lines) |
| `docs/WORKFLOW-TEMPLATES.md` | Created | 12 inter-agent communication templates |
| `docs/CONDUCT-MODEL.md` | Created | This document |
