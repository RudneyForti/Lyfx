# Lyfx — Versioning Policy

> [Ler em português](./VERSIONING.md)

> Consolidated rule. Followed by every contributor — human and agent.

---

## Format: `MAJOR.MINOR.PATCH`

### MAJOR — product era change

Increments when the product crosses an irreversible boundary:

| Trigger | Example |
|---|---|
| Production deploy (PostgreSQL + own domain) | `1.x.x` → `2.0.0` |
| Structural database change requiring user data migration | `2.x.x` → `3.0.0` |
| Complete architecture redesign (e.g. framework swap) | any `x.x.x` → `N.0.0` |

Practical rule: if the user needs to do something beyond updating the app, it's MAJOR.

---

### MINOR — new capability

Increments when the application starts doing something it didn't do before:

| Trigger | Example |
|---|---|
| New page or module | `/education`, `/reports` |
| Significant new feature in an existing module | reserve editor, liability alert |
| New integration with an external system | OFX import, OAuth authentication |
| New field with direct impact on calculation or business logic | `reserveBalance` in Settings |

Practical rule: if the user gained something that didn't exist before, it's MINOR.

---

### PATCH — maintenance

Increments when the behavior observed by the user does not change, but the code improves:

| Trigger | Example |
|---|---|
| Bug fix (logic, TypeScript, UI) | `reimbursedAt` in the interface, literal type in `useState` |
| Security adjustment with no new feature | IDOR, ownership validation |
| Performance improvement with no API change | query optimization |
| Dependency update with no behavior impact | package bump |
| Documentation fix | correcting a wrong description |

Practical rule: if the user wouldn't notice the difference, it's PATCH.

---

## External naming independence rule

External documents — consultant reports, analyst feedback, pedagogical review files — arrive with their own names ("Phase F", "Review 2", "content v3"). These names **do not determine** the software version.

The version is defined by what was **actually built**, following the criteria above.

Example:
- A document called "Phase F" delivered: a new field with calculation impact (MINOR) + bug fixes (PATCH). Result: MINOR wins → `1.3.1` → `1.4.0`.
- A document called "Pedagogical Review" that only fixes documentation text: PATCH → `1.4.0` → `1.4.1`.

---

## Summarized history

| Version | Type | What was built |
|---|---|---|
| `0.5.0` | MINOR | P&L with margins + Dashboard (KPI cards, Insight, trend chart) |
| `0.6.0` | MINOR | Installments: `installmentGroupId`, 3-mode edit modal |
| `0.7.0` | MINOR | Budget: `Settings.expectedMonthlyIncome`, allocations per category |
| `0.8.0` | MINOR | Financial health score: 4 dimensions, 4 profiles, SVG gauge |
| `0.9.0` | MINOR | Liabilities: CRUD, avalanche method, extra payment calculator |
| `1.0.0` | MAJOR | Personal-use production milestone. Reimbursements with tracking. |
| `1.1.0` | MINOR | Full multi-user isolation. Improved Studio. |
| `1.2.0` | MINOR | Institutions + Alerts (4 types) + Address profile with ViaCEP |
| `1.3.0` | MINOR | Assets & Property: real estate, vehicles, associated expenses |
| `1.3.1` | PATCH | Security and bug audit (IDOR, types, ownership) |
| `1.4.0` | MINOR | `reserveBalance` in Settings + critical liability alert + 3 TS fixes |
| `1.5.0` | MINOR | Financial Education module — 85 pedagogical pills per profile, review quiz, and weekly streak |
| `1.6.0` | MINOR | Security: HMAC-SHA256 session, timing defense, email validation. New capabilities: inline tag editing, transaction navigation by URL, "remember me" + route preservation. Quality: 9 bug and UX fixes (installments, validations, alerts, reports, sidebar, Studio) |
| `1.6.1` | PATCH | Fix: proxy.ts validates HMAC via Web Crypto API on the Edge Runtime — eliminates an infinite redirect loop when the cookie has an invalid signature |
| `1.6.2` | PATCH | Fix: lib/db.ts reads DATABASE_URL from the environment instead of a hardcoded path — lets the production worktree point to a shared dev.db |
| `1.6.3` | PATCH | Full per-environment database isolation: prod.db exclusive to master, dev.db to develop. Merges preserve the pointer via a gitignored .env. Documentation updated. |
| `1.6.4` | PATCH | Landing page: navbar glassmorphism restored, Pricing section, dot texture with edge vignette, FAQ without layout shift, cyan hover on navbar links, updated footer marquee, animated hover on StepCards. |
| `1.6.5` | PATCH | Landing page: "About" section with a financial education narrative and f(x) easter egg; "About" in the navbar; 2×2 grid alignment with cyan accent; em-dashes replaced with commas; fixed footer marquee loop (width:max-content). |
| `1.6.6` | PATCH | Landing page: PT/EN/ES internationalization — language selector with monochrome flags in the navbar, regionalized financial terminology (DRE / P&L / Income Statement), per-locale currencies (R$/$/€), automatic detection via navigator.language with localStorage persistence. |
| `1.6.7` | PATCH | Landing page: full responsiveness (mobile/tablet/desktop/TV) — cyan-pill hamburger menu, adaptive hero padding, single-column About, responsive features and StepCards, downward step arrow on mobile, reorganized footer. |
| `1.7.0` | MINOR | Database migration: SQLite → local PostgreSQL 18. schema.prisma provider updated, lib/db.ts with no external adapter (HMR-safe singleton), lyfx_dev and lyfx_prod databases created locally. |
| `1.7.1` | PATCH | Fix: Prisma v7 with provider=prisma-client requires an explicit adapter — installs @prisma/adapter-pg + pg, lib/db.ts uses PrismaPg. |
| `1.7.2` | PATCH | Landing page: footer version read dynamically from package.json via a prop — zero manual maintenance per release. |
| `1.8.0` | MINOR | Studio Group 2: Dashboard panel (6 metric cards + config toggles), Modules with a per-module beta toggle (AppConfig), Notes with a Markdown toolbar + Notion-like slash commands, collapsible per-table ERD, schema table descriptions, Full/Insider seeds derived from `isBeta`, global maintenance banner, `lib/config.ts` + `AppConfig` model |
| `1.8.1` | PATCH | CS-15 Visual consistency: login with viewport lock (100vh), unified rounded identity (CTA buttons → full, inputs → 12px, modals → 24px), floating sidebar with glassmorphism + internal scroll, collapsed mode with uniform spacing, 48px padding-top on main so the UserMenu pill doesn't overlap content |
| `1.9.1` | PATCH | Critical fix: `lib/db-pills.ts` rewritten with Prisma — the better-sqlite3 workaround from v1.5.0 (SQLite) caused `no such table: PillProgress` in production after the PostgreSQL migration |
| `1.9.0` | MINOR | CS-18/CS-19 Notification center: Notification model, bell with badge in UserMenu, segregation of automatic alerts × system notifications (fingerprint), Studio sending by plan/user with history, AlertsView with distinct sections + Clear all, maintenance banner as a pill, automatic welcome notification, redesigned Studio Panel (2 columns, RAM/Heap/CPU SVG gauges, lastSeenAt metrics, git branch versioning), TypeScript fixes in GoalsView and TagPicker |
| `1.10.0` | MINOR | CS-17 Special Reimbursement: full corporate km module (routes with draggable Google Maps, fuel receipts, extra expenses, SAP summary, D+5 business days, automatic Transaction). CS-17b server-side exportable PDF with embedded maps, visual redesign (gray background, dot pattern, dark header, typographic logo, mini-header on pages 2+, summary with no page break), route polyline via KmPlace as the source of truth. bodySizeLimit 5mb for Server Actions. |
| `1.11.0` | MINOR | Quality and security batch. CS-25: D+5 now accounts for national holidays via BrasilAPI (lib/holidays.ts + lib/km-utils.ts — async with graceful fallback). CS-26: timingSafeEqual on the Studio login, lyfx_admin cookie secure in production, requireAdmin() on plan mutations, getUnreadCount with an internal session. CS-27: centralized alert engine (lib/alert-engine.ts) — eliminates duplication between getAlerts and syncDangerAlerts. CS-28: Promise.all in health/dashboard, 5s ViaCEP timeout, try/catch in transaction mutations. CS-29: mapTx typing with no any, PT_MONTHS centralized in lib/i18n.ts, standardized requireAuth(). CS-30: db-pills.ts removed, explicit KmPeriod→Transaction FK, SQLite moved to devDependencies. |
| `1.12.0` | MINOR | CS-32: Rate limiting + Cloudflare Turnstile CAPTCHA. Per-IP login protection with a configurable sliding window via Studio (CAPTCHA threshold, block threshold, time window). Cloudflare Turnstile integration (dark widget, dev bypass). `LoginAttempt` model in the database. CS-33: Strong password policy with a visual indicator. 5 mandatory rules (8+ chars, uppercase, lowercase, number, special). 4-segment bar with progressive color (red → amber → cyan). Real-time match indicator on the confirmation field. Applied at signup and at the profile password change. |
| `1.14.1` | PATCH | Post-systemic-audit maintenance batch. Security: OAuth requires `email_verified` from Google and Microsoft linking restricted to the `email` claim (preferred_username out of the equation); `AbortSignal` timeout on all 8 external fetches (Google Maps/Directions, userinfo, BrasilAPI, Turnstile); Studio admin session with an HMAC-signed cookie and server-side expiration (was a static value). Architecture: `app/studio/actions.ts` (910 lines) split into 7 responsibility modules with a compatibility barrel; `execSync` isolated in `system-info.ts` with a 3s timeout. Performance: 3 indexes on `Transaction` (userId+date, userId+category+date, installmentGroupId); `syncDangerAlerts` throttled 1x/5min fire-and-forget (~7 fewer queries per navigation); inline badge in the layout (1 fewer session lookup); `getMonthlyTrend` via DB groupBy; `StudioLoginForm` in its own chunk; `lastSeenAt` throttled to 60s; single AppConfig seed; new `lib/throttle-gate.ts`. Cleanup: orphan SQLite deps removed (better-sqlite3, adapter, types) and `dev.db` artifacts deleted. |
| `1.14.0` | MINOR | CS-20: Change Spec Kanban board in the Studio — Trello-style board with 4 columns (Backlog, In progress, Blocked, Done), HTML5 drag-and-drop, editable detail modal (title, description, labels, version, commit hash, completedAt), newest/oldest sorting per column, persistence in `docs/cs-board.json` (survives DB reset), pre-populated with CS-01→CS-38. CS-37a: full TOTP 2FA — QR Code setup (otplib + qrcode), 6-digit verification, 8 backup codes (XXXX-XXXX-XXXX, bcrypt), lyfx_2fa HMAC cookie (5 min) between login steps, disabling and backup regeneration via the profile, 4 new Audit Log events (2fa.enabled/disabled/failed/backup_used). Redesigned error screen with `lim f(t) = ∅` in display font and a fixed-logo 404 screen. |
| `1.13.0` | MINOR | CS-34: Stateful database sessions — server-side invalidation, active sessions view in the profile, individual and bulk revocation, HMAC cookie with sessionId+userId. CS-35: Security Audit Log — login/logout/password/session event tracking, history in the user profile and a Security tab in the Studio with user and event filters. CS-36: Google + Microsoft OAuth — social login via Arctic (PKCE), OAuthAccount model, find-or-create by providerUserId/email, adaptive buttons (enabled/disabled per .env), errors via flash cookie (clean URL). |
| `1.11.3` | PATCH | CS-31: Security foundation. Proxy middleware with full HMAC validation protecting every app route. 6 security HTTP headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS, X-XSS-Protection). Custom 404 page with Lyfx identity (f(404) = ∄). Global error boundary with no stack trace leaks. 7 new test cases in the QA plan (SEC-19→SEC-25). |
| `1.11.2` | PATCH | CS-23: Full Docker setup with a containerized PostgreSQL. Two isolated groups: Dev (db-dev PG18 + lyfx-dev) and Prod (db-prod PG18 + migrate + lyfx). Migrator stage in the Dockerfile (prisma db push). Named volumes lyfx_dev_data / lyfx_prod_data. PG18 fix: volume at /var/lib/postgresql. Docker v5 fix: ${} interpolation with --env-file instead of env_file for unquoted vars. depends_on service_healthy + service_completed_successfully. |
| `1.11.1` | PATCH | CS-23: full Docker containerization. Multi-stage Dockerfile (deps → builder → standalone runner). `output: "standalone"` + `force-dynamic` in login/studio/(app)/layout for a build with no database. Prisma v7 fix: client copied from `lib/generated/prisma` in the runner. docker-compose.yml (prod, 4000) + docker-compose.dev.yml (dev, 3000) both with a Node.js HTTP healthcheck. npm docker:* scripts. .env.docker.example. Dev and prod environments migrated to Docker-first. |
| `1.15.4` | PATCH | Completes the v1.15.3 fix: the `COPY` of those files failed at build time because `.dockerignore` excluded `docs/` and `*.md`, so `docs/cs-board.json` and `DOCUMENTATION.md` never entered the build context (the v1.15.3 deploy failed in `docker build`). Added `!docs/cs-board.json` and `!DOCUMENTATION.md` exceptions. Build context verified before tagging. |
| `1.15.3` | PATCH | Production fix: `/studio` returned 500 (`ENOENT /app/docs/cs-board.json`). Next.js standalone output doesn't include files read via `fs.readFile` with a computed path, so `docs/cs-board.json` (Kanban) wasn't in the image. The Dockerfile now explicitly copies `docs/cs-board.json` and `DOCUMENTATION.md` into the runner; `getKanbanBoard` is hardened against ENOENT (returns an empty board instead of crashing). First production bug caught by the automated deploy pipeline. |
| `1.15.2` | PATCH | Deploy-on-tag fix (v1.15.1): the `deploy-prod.yml` steps used `shell: bash`, which on a Windows runner resolves to the WSL bash (`system32\bash.exe`) and fails with no WSL distro installed. Rewritten with `shell: powershell` (Windows PowerShell 5.1, always present) and a per-command `$LASTEXITCODE` check. First release to actually deploy through the automated pipeline. |
| `1.15.1` | PATCH | CI/CD: automatic production deploy (port 4000) on pushing a `v*` tag. Workflow `.github/workflows/deploy-prod.yml` on a self-hosted runner (label `lyfx-prod`) on the host machine — checks out the tag in the production worktree, rebuilds the image, and recreates the containers (the `migrate` service applies schema). Production now tracks the latest release tag, not `main`-HEAD. Keeps the human gate (tagging is a human decision) and automates rebuild + restart + migrate. E7 step 10 updated in `AGENTS.md` / `GIT-WORKFLOW.md`. |
| `1.15.0` | MINOR | First batch under GitHub Flow. **Kanban v2 (CS-59):** checklists with a progress bar, start/due dates with a due chip, comments with an automatic move-activity log, release grouping in the Done column, and a label filter; board schema v2 with an idempotent v1→v2 migration (`lib/kanban.ts`). **Studio:** orthogonal A* routing for the ERD lines (Power BI behavior — they never cross boxes or leave the canvas, and re-route on drag; `lib/erd-router.ts`). **Process/infra:** migration to GitHub Flow (single `main` branch + PRs, CODEOWNERS, PR template); test retrofit from 0 → 90+ (44 unit, 41 integration, 5 E2E) with Vitest + Playwright and external-API mocking; lint restored as a blocking gate; 3-job CI pipeline (typecheck/lint/build, tests, E2E). **Governance:** git tags as the single source of truth for versions, a proactive release trigger, and board×git reconciliation (`AGENTS.md` / `GIT-WORKFLOW.md`); board reconciled (8 phantom `1.15.0` cards → `1.14.1`). **i18n:** all code comments translated to English. **Docs:** bilingual PT/EN versions of README, VERSIONING, FEATURES, and DOCUMENTATION, with a stale-facts audit against the real code. **Fix:** form dates parsed as local time (`lib/dates.ts`) — fixes a day-1 transaction falling into the previous month under UTC-3. **Planning:** cards CS-49→CS-59 added to the board. |

---

## Expected next milestones

| Version | Type | Planned content |
|---|---|---|
| `2.0.0` | MAJOR | Production deploy: PostgreSQL, own domain, HTTPS |

---

*This document is the source of truth for version decisions. When in doubt, consult it before incrementing.*
