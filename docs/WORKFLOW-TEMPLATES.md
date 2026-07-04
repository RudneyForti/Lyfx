# Workflow Templates
> Inter-agent communication forms and project documentation templates
> All content in English. Used across the E1→E7 pipeline.

---

## 1. Change Spec (CS-XX)

Every implementation cycle starts here. Agent NEO does not begin E1 without all 10 fields filled.

```markdown
# CS-XX — [Title: verb + target + expected result]

**1. Title:** [verb + target + expected result]

**2. Motivation:** [Problem being solved — cite file, line, and observed behavior if applicable]

**3. Scope:** [Explicit list of what enters this cycle]

**4. Out of scope:** [Explicit list of what does NOT enter this cycle]

**5. Acceptance criteria:**
- Given [context] → when [action] → then [verifiable result]
- Given [context] → when [action] → then [verifiable result]

**6. Technical impact:**
- UI: [affected screens/components or N/A]
- Server/API: [affected actions/endpoints or N/A]
- DB Schema: [affected models/fields or N/A]
- Auth/Session: [affected or N/A]
- Calculations: [affected logic or N/A]

**7. Risk:** low / medium / high — [justification]

**8. Tests:**
- Unit: [what to test]
- Integration: [what to test]
- E2E/Playwright: [what to test or N/A]

**9. Version:** [NEO defines via SemVer — PATCH / MINOR / MAJOR]

**10. Manual validation:**
1. [Deterministic step]
2. [Deterministic step]
3. [Deterministic step]
```

---

## 2. E1 — Classification

```markdown
## CLASSIFICATION — CS-XX

- **Type:** Bugfix / Feature / Refactor / Breaking Change / Hotfix / Schema Migration
- **Touched contracts:** Data / Auth / Behavior / None
- **Risk:** Low / Medium / High
- **Flow:** Standard / Hotfix / Breaking Change / DB / Pre-release
- **Suggested version:** vX.Y.Z
- **Justification:** [SemVer Tree reasoning + authority cited]

*Awaiting The One's approval.*
```

---

## 3. E2 — Implementation Plan

```markdown
## PLAN — CS-XX

**Files affected:**
| File | Operation | Principle |
|------|-----------|-----------|
| path/to/file.ts | Create / Modify / Delete | [Author — principle] |

**Steps:**
1. [Step with technical reason]
2. [Step with technical reason]

**Coupling risks:** If [A] changes, may affect [B] because [C].

**Database:** SAFE / CRITICAL / N/A
[If CRITICAL: describe biphasic plan]

**Out of scope:**
- [Item explicitly excluded]

*Awaiting Green Light.*
```

---

## 4. E3 — Implementation Summary

```markdown
## IMPLEMENTED — CS-XX

**Branch:** feature/slug or fix/slug

**Modified files:**
| File | Operation | Principle |
|------|-----------|-----------|
| path/to/file.ts | Created | [Author — principle] |

**Out of scope:** [Items that were not touched]

*Invoking QA — handing off to Agent Smith.*
```

---

## 5. Handoff Package (E3 → E4)

NEO prepares this before adopting the Smith persona at E4.

```markdown
## HANDOFF FOR QA — CS-XX

**What was implemented:** [2–3 line summary of the change]
**Branch:** feature/slug or fix/slug

**Modified files:**
| File | Type of change |
|------|----------------|
| app/actions/x.ts | Modified |
| components/y.tsx | Created |

**CS acceptance criteria:**
- [ ] [Criterion 1 from CS field 5]
- [ ] [Criterion 2 from CS field 5]

**Points of attention:** [Where NEO thinks the implementation may be fragile]

**How to test manually:** [Smoke test instruction for The One at E5]
```

---

## 6. E4 — QA Report (Agent Smith)

```markdown
## QA RESULT — Agent Smith

[Opening in Smith tone — 1–2 lines]

**CS audited:** CS-XX
**Branch:** fix/branch-name
**TypeScript compilation:** ✅ Zero errors / ❌ X errors (see detail)

**Anomalies identified:**
| # | Severity | File | Description | Authority | Status |
|---|----------|------|-------------|-----------|--------|
| 1 | 🔴 CRITICAL | file.ts:42 | [Objective description] | [Author, principle] | Fixed / Accepted debt |
| 2 | 🟠 HIGH | file.tsx:17 | [Objective description] | [Author, principle] | Fixed / Accepted debt |
| 3 | 🟡 MEDIUM | file.ts:88 | [Objective description] | [Author, principle] | Accepted debt |
| 4 | 🔵 LOW | file.tsx:5 | [Objective description] | [Author, principle] | Accepted debt |

**Acceptance criteria verified:**
| Criterion (from CS) | Status |
|---------------------|--------|
| [Criterion 1] | ✅ Met / ❌ Not met |
| [Criterion 2] | ✅ Met / ❌ Not met |

**Frontend test audit:** *(include when CS has frontend changes)*
| Check | Status |
|-------|--------|
| Backend mock layer configured | ✅ / ❌ |
| Zero live API calls during test execution | ✅ / ❌ |
| Critical user flows covered by Playwright | ✅ / ❌ |
| Coverage thresholds met (Integration 100% · Feature 100% · Unit 80%) | ✅ / ❌ |

**Corrections applied:** [Description of fixes applied, or "None — items are accepted debt"]

**Verdict:** APPROVED / APPROVED WITH RESERVATIONS / RETURN TO STAGE X because Y
```

---

## 7. E5 — Approval Summary

```markdown
## READY FOR APPROVAL — CS-XX

**Summary:** [What was implemented in plain language]
**Impact:** [What changes for whom]
**Planned version:** vX.Y.Z *(applied at E7)*

**Manual validation steps:**
1. [Deterministic step from CS field 10]
2. [Deterministic step]
3. [Deterministic step]

**Accepted debt (MEDIUM/LOW from Smith):**
- [Item] — The One's decision

*Awaiting your approval to consolidate this change.*
```

---

## 8. E6 — Commit Block

```markdown
## COMMIT BLOCK — CS-XX

### ✅ Ready to commit

**Run these commands in order:**
```bash
git checkout develop   # or main for GitHub Flow projects
git merge feature/slug --no-ff -m "chore(merge): feature/slug → develop [CS-XX]"
git push origin develop

# Delete branch — local and remote
git branch -d feature/slug
git push origin --delete feature/slug
```

*Code in `develop`. Production awaiting release approval (E7).*
```

---

## 9. E7 — Release Block

```markdown
## RELEASE vX.X.X EXECUTED

**Batch:** CS-XX [title] · CS-YY [title]

**Documentation updated:**
- [ ] `package.json` → vX.X.X
- [ ] `README.md` → version badge + footer
- [ ] `VERSIONING.md` → history table entry
- [ ] `DOCUMENTATION.md` → affected sections
- [ ] `docs/FEATURES.md` → batch features
- [ ] `docs/CHANGE-SPECS.md` → CSs marked as delivered

**Git:**
- [ ] `master` merged and tagged vX.X.X
- [ ] `develop` synchronized after release

*Synchronization Achieved. The system is in equilibrium. Until the next iteration.*
```

---

## 10. Pull Request Template

Used by NEO when running `gh pr create`.

```markdown
## Summary
<!-- What changed and why -->

## Changes
- Change 1
- Change 2

## Checklist
- [ ] Link to feature/issue: <!-- CS-XX or card URL -->
- [ ] Description of changes included above
- [ ] List of additions documented
- [ ] All existing tests are passing
- [ ] New tests were added for this change
- [ ] Agent Smith validated behavior (E4 QA Report: APPROVED)
- [ ] No regressions observed

## References
<!-- CS number, issue link, or card ID -->
```

---

## 11. Test Plan Entry (docs/QA-TEST-PLAN.md)

For each new feature added to the test plan.

```markdown
## CS-XX — [Feature name]

**Version delivered:** vX.Y.Z
**Module:** [module name]

### Test scenarios

| # | Scenario | Type | Steps | Expected result |
|---|----------|------|-------|-----------------|
| 1 | Happy path | Manual / Playwright | 1. ... 2. ... | [Result] |
| 2 | Edge case | Manual / Playwright | 1. ... 2. ... | [Result] |
| 3 | Error handling | Manual | 1. ... 2. ... | [Result] |

### Acceptance criteria
- [ ] [Criterion from CS field 5 — verifiable]
- [ ] [Criterion from CS field 5 — verifiable]

### Playwright coverage
- [ ] Flow: [description] — `tests/e2e/feature-name.spec.ts`
- [ ] Flow: [description] — `tests/e2e/feature-name.spec.ts`

### Regression risk
[What existing flows could be affected by this change — what to retest]
```

---

## 12. Feature Documentation Entry (docs/FEATURES.md)

Non-technical audience: analysts, managers, users.

```markdown
## [Feature name]
> Delivered in vX.Y.Z · CS-XX

### What it does
[Plain language description — no routes, no variable names, no Prisma]

### How to use it
1. [Step in user language]
2. [Step in user language]

### Where data goes
[Simple description of what is saved and where]

### Module interactions
[Which other modules this feature connects to]

### User value
[Why this matters to the user]
```

---

## Severity reference (quick lookup)

| Severity | Meaning | NEO action |
|----------|---------|------------|
| 🔴 CRITICAL | Security, data corruption, crash, loss of functionality | Return to E3 (or E2 / E1) |
| 🟠 HIGH | Incorrect logic, wrong behavior, broken component | Fix at E4 before advancing |
| 🟡 MEDIUM | Code smell, DRY violated, naming, insufficient coverage | Accepted debt — The One decides |
| 🔵 LOW | Improvement suggestion, style, missing comment | Accepted debt — The One decides |
