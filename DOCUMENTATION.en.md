# Lyfx — Technical Documentation
> [Ler em português](./DOCUMENTATION.md)
> Life Fixed · v1.14.1 · July 2026 · [Versioning policy → VERSIONING.md](./VERSIONING.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technical Stack](#2-technical-stack)
3. [Database Schema](#3-database-schema)
4. [Relationship Table](#4-relationship-table)
5. [Category Model](#5-category-model)
6. [Technical Reference per Module](#6-technical-reference-per-module)
7. [Interactions Between Modules](#7-interactions-between-modules)
8. [Authentication and Session](#8-authentication-and-session)
9. [File Architecture](#9-file-architecture)
10. [Architectural Decisions](#10-architectural-decisions)
10.1 [Technical Formulas and Calculations](#101-technical-formulas-and-calculations)
10.2 [Known Technical Gotchas](#102-known-technical-gotchas)
11. [Next Steps](#11-next-steps)

---

## 1. Overview

**Lyfx** is a personal finance application structured as an **individual P&L (Profit and Loss statement)**. The central premise is to bring to the personal context the same analytical clarity companies use to understand their income and expenses.

### Problem it solves

Most personal finance apps record entries but don't offer **diagnosis**. Lyfx organizes every dollar within a category taxonomy that lets the user understand not just *how much* they spent, but *what kind* of spending it was — fixed, variable, committed, seasonal, unpredictable, or intentional.

### Target audience

Individuals who want financial control with analytical insight, without depending on spreadsheets or generic tools.

### Distribution model

Multi-user architecture with complete isolation by `userId`. Each user sees exclusively their own data. Support for multiple users managed via the Studio panel.

---

## 2. Technical Stack

### Main framework

| Technology | Version | Rationale |
|---|---|---|
| **Next.js** | 16.2.6 | App Router with Server Components lets you fetch data directly on the server with no intermediate REST APIs. Server Actions eliminate the need for endpoints for mutations. Turbopack guarantees instant HMR in development. |
| **React** | 19 | `useTransition` lets you update async state without blocking the UI. `useOptimistic` (available) for immediate feedback in future interactions. |
| **TypeScript** | 5.x | Static typing on the data schema, categories, and transaction types prevents entire classes of runtime bugs. |

### Database and ORM

| Technology | Version | Rationale |
|---|---|---|
| **PostgreSQL** | 18 | Containerized database via Docker, production-grade relational engine. Chosen over SQLite once the project moved past single-file local use into isolated dev/prod containers with real concurrency. |
| **Prisma** | 7.8.0 | Type-safe ORM that generates a TypeScript client from the schema. Queries with autocomplete and compile-time validation. |
| **@prisma/adapter-pg** | — | Driver adapter required in Prisma v7 — the datasource no longer accepts `url` directly; the adapter is instantiated in `lib/db.ts` (`new PrismaPg({ connectionString })`) and injected into the client. |
| **pg** | — | Standard Node.js PostgreSQL driver, used by the adapter. |

### Styling

| Technology | Version | Rationale |
|---|---|---|
| **Tailwind CSS** | v4 | Configured via `@theme inline {}` in `globals.css` — no `tailwind.config.ts`. Design tokens (colors, typography, spacing) defined as native CSS variables, consumable by both Tailwind and inline `style={{}}`. |
| **CSS Variables** | — | Design system defined in `globals.css` with tokens like `--color-cyan`, `--color-bg2`, `--font-display`. Guarantees consistency between Tailwind components and inline styles. |

### Typography

| Font | Use | Rationale |
|---|---|---|
| **Playfair Display** | Headings, highlighted numbers, logo | Italian serif with weight and personality. Creates visual contrast with the technical interface. Used in italic for headings and financial values. |
| **Inter** | Body, labels, interface | Neutral, highly legible sans-serif at small sizes. Industry standard for data interfaces. |

### Authentication

| Technology | Rationale |
|---|---|
| **bcryptjs** | Password hashing with automatic salt (factor 10). Chosen over native `bcrypt` for being pure JavaScript — no native compilation dependencies (node-gyp). Runs even when the user doesn't exist (timing defense against username enumeration). |
| **HMAC-SHA256** | `lyfx_session` cookie signed with `createHmac('sha256', SESSION_SECRET)` in `lib/session.ts`. Format: `<sessionId>.<userId>.<hmacHex>`. Constant-time verification via `timingSafeEqual`. `SESSION_SECRET` required in `.env`. |
| **httpOnly cookie** | Session stored as the `lyfx_session` cookie with `httpOnly: true`, `sameSite: lax`. `maxAge: 30 days` by default; omitted when `remember=false` (session cookie). |

### Icons

| Technology | Rationale |
|---|---|
| **@tabler/icons-react** | Library with more than 5,000 consistent SVG icons. Each icon is a React component with `size` and `className` props. Zero font-loading dependency. |

### Routing and protection

| File | Function |
|---|---|
| `proxy.ts` | Replacement for `middleware.ts` (deprecated convention in Next.js 16). Runs on the Edge Runtime. Verifies the `lyfx_session` cookie, redirects protected routes to `/login?redirect=<route>` preserving the original destination, and injects the `x-pathname` header. Does not access the database (Edge limitation). |

---

## 3. Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                           USER                                  │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ name            │ String       │ Display name                   │
│ email           │ String?      │ Unique, optional                │
│ password        │ String       │ bcrypt hash                    │
│ avatar          │ String?      │ Base64 JPEG 200×200px          │
│ age             │ Int?         │ Age                            │
│ gender          │ String?      │ Gender                         │
│ city            │ String?      │ City                           │
│ state           │ String?      │ State                          │
│ zipCode         │ String?      │ ZIP code                       │
│ street          │ String?      │ Street (ViaCEP auto-fill)      │
│ streetNumber    │ String?      │ Number / complement            │
│ country         │ String?      │ Country                        │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        TRANSACTION                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ date            │ DateTime     │ Entry date                     │
│ description     │ String       │ Title                          │
│ amount          │ Float        │ Amount (positive)               │
│ type            │ String       │ "credit" | "debit"             │
│ category        │ String       │ See category model             │
│ subcategory     │ String?      │ Free-form subdivision          │
│ notes           │ String?      │ Remarks                        │
│ recurrence      │ String       │ "once"|"monthly"|"yearly"      │
│ recurrenceEndsAt│ DateTime?    │ Recurrence end                 │
│ installmentGroupId│ String?    │ Shared group UUID              │
│ installmentNumber │ Int?       │ This installment's number (1-N)│
│ installmentTotal  │ Int?       │ Total installments in the group│
│ context         │ String?      │ "personal"|"professional"      │
│ reimbursable    │ Boolean      │ Reimbursable expense            │
│ reimbursedAt    │ DateTime?    │ Filled when marked received     │
│ accountId       │ String?      │ Optional FK → Account.id       │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ tags            │ Relation     │ → TransactionTag[]             │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           TAG                                   │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ name            │ String       │ Unique per user                │
│ color           │ String       │ Hex, e.g. #22D3EE              │
│ icon            │ String       │ TAG_ICONS key                  │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ transactions    │ Relation     │ → TransactionTag[]             │
│                 │ Unique       │ @@unique([userId, name])        │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TRANSACTION_TAG (pivot)                    │
├─────────────────┬──────────────┬────────────────────────────────┤
│ transactionId   │ String (FK)  │ → Transaction.id (cascade)     │
│ tagId           │ String (FK)  │ → Tag.id (cascade)             │
│                 │ Composite PK │ [transactionId, tagId]         │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          BUDGET                                 │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ category        │ String       │ Unique per user                │
│ amount          │ Float        │ Monthly limit                  │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│                 │ Unique       │ @@unique([userId, category])    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           GOAL                                  │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ name            │ String       │ Goal name                      │
│ description     │ String?      │ Free-form context              │
│ targetAmount    │ Float        │ Total amount to reach          │
│ currentAmount   │ Float        │ Accumulated via payments        │
│ deadline        │ DateTime     │ Final deadline                 │
│ color           │ String       │ Hex for visual identification  │
│ icon            │ String       │ Icon key                       │
│ status          │ String       │ "active"|"completed"|"paused"  │
│ monthlyAmount   │ Float        │ Computed monthly payment        │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ payments        │ Relation     │ → GoalPayment[]                │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        GOAL_PAYMENT                             │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ goalId          │ String (FK)  │ → Goal.id (cascade)            │
│ dueDate         │ DateTime     │ Due month                      │
│ amount          │ Float        │ Payment amount                 │
│ paid            │ Boolean      │ false by default                │
│ paidAt          │ DateTime?    │ Filled when marked paid         │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         SETTINGS                                │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id (unique)  │
│ expectedMonthlyIncome│ Float   │ Expected monthly income         │
│ reserveBalance  │ Float        │ Declared reserve fund balance   │
│                 │              │ (0 = use proxy)                 │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Note: one record per user — created lazily on first access via getOrCreate(). userId is unique.

┌─────────────────────────────────────────────────────────────────┐
│                        LIABILITY                                │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ name            │ String       │ Debt name                      │
│ type            │ String       │ See types below                │
│ currentBalance  │ Float        │ Current outstanding balance     │
│ interestRate    │ Float        │ Interest rate % per month       │
│ minimumPayment  │ Float        │ Minimum monthly installment     │
│ creditor        │ String?      │ Creditor name                  │
│ notes           │ String?      │ Free-form remarks               │
│ status          │ String       │ "active" | "paid_off"          │
│ institutionId   │ String?      │ Optional FK → Institution.id   │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Liability types: "cheque_especial" (overdraft) | "rotativo" (revolving credit) | "emprestimo" (loan) | "financiamento" (financing) | "outro" (other)

┌─────────────────────────────────────────────────────────────────┐
│                        INSTITUTION                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ name            │ String       │ Bank / fintech name            │
│ type            │ String       │ "bank"|"fintech"|"broker"|"other"│
│ color           │ String       │ Hex for visual identification  │
│ icon            │ String       │ Icon key                       │
│ notes           │ String?      │ Free-form remarks               │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ accounts        │ Relation     │ → Account[]                    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          ACCOUNT                                │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ institutionId   │ String (FK)  │ → Institution.id (cascade)     │
│ name            │ String       │ Account name                   │
│ type            │ String       │ See types below                │
│ balance         │ Float        │ Current balance                │
│ limit           │ Float?       │ Limit (cards / overdraft)       │
│ notes           │ String?      │ Free-form remarks               │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Account types: "checking" | "savings" | "credit_card" | "investment" | "wallet" | "other"

┌─────────────────────────────────────────────────────────────────┐
│                           ASSET                                 │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ name            │ String       │ Asset nickname                 │
│ type            │ String       │ "real_estate"|"vehicle"|"other"│
│ propertyAddress │ String?      │ Address (real estate)           │
│ make            │ String?      │ Make (vehicles)                 │
│ model           │ String?      │ Model (vehicles)                │
│ year            │ Int?         │ Year (vehicles)                 │
│ plate           │ String?      │ Plate (vehicles)                │
│ purchaseValue   │ Float?       │ Acquisition value               │
│ currentValue    │ Float?       │ Current estimated value         │
│ purchaseDate    │ DateTime?    │ Purchase date                  │
│ notes           │ String?      │ Free-form remarks               │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ expenses        │ Relation     │ → AssetExpense[]               │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        ASSET_EXPENSE                            │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ assetId         │ String (FK)  │ → Asset.id (cascade)           │
│ name            │ String       │ e.g. "Property Tax 2025"        │
│ type            │ String       │ See types below                │
│ amount          │ Float        │ Amount                         │
│ dueDate         │ DateTime?    │ Due date                       │
│ paid            │ Boolean      │ false by default                │
│ paidAt          │ DateTime?    │ Filled when marked paid         │
│ notes           │ String?      │ Free-form remarks               │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
AssetExpense types: "iptu" (property tax) | "ipva" (vehicle tax) | "itr" (rural land tax) | "dpvat" (mandatory vehicle insurance) | "seguro" (insurance) | "licenciamento" (registration) | "manutencao" (maintenance) | "other"

┌─────────────────────────────────────────────────────────────────┐
│                       PILL_PROGRESS                             │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ pillId          │ String       │ Static pill ID                 │
│ profile         │ String       │ Pill's financial profile        │
│ completedAt     │ DateTime     │ Auto: now()                    │
│ timeSpentSeconds│ Int          │ Reading time in seconds         │
│ quizCorrect     │ Boolean      │ Answered the quiz correctly?    │
│ createdAt       │ DateTime     │ Auto: now()                    │
│                 │ Unique       │ @@unique([userId, pillId])      │
└─────────────────┴──────────────┴────────────────────────────────┘
Note: pills are static content (lib/pills-data.json). Only progress is persisted.

┌─────────────────────────────────────────────────────────────────┐
│                           PLAN                                  │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ name            │ String       │ e.g. "Full", "Insider"          │
│ description     │ String?      │ Plan description               │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ modules         │ Relation     │ → PlanModule[]                 │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        PLAN_MODULE (pivot)                      │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ planId          │ String (FK)  │ → Plan.id (cascade)            │
│ moduleKey       │ String       │ Module key (lib/modules)        │
│                 │ Unique       │ @@unique([planId, moduleKey])   │
└─────────────────┴──────────────┴────────────────────────────────┘
Note: modules are static entities defined in lib/modules.ts — only the plan links are persisted.

┌─────────────────────────────────────────────────────────────────┐
│                         APP_CONFIG                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ key             │ String (PK)  │ Global config key               │
│ value           │ String       │ Value (string, JSON, or bool)  │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Known keys: "maintenanceMode" ("true"/"false"), "maintenanceBanner" (message), "betaModules" (JSON array of keys), "adminNotes" (free Markdown). Read via lib/config.ts with no admin authentication.

┌─────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION                             │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ title           │ String       │ Notification title             │
│ message         │ String?      │ Message body                   │
│ read            │ Boolean      │ false by default                │
│ readAt          │ DateTime?    │ Filled when marked read         │
│ fingerprint     │ String?      │ Unique hash (automatic alerts)  │
│                 │              │ null = system notification      │
│ broadcastId     │ String?      │ Groups batch-sent notifications │
│ expiresAt       │ DateTime?    │ TTL — alerts expire in 7d        │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘
Note: fingerprint null = system notification (dismissible by the user).
fingerprint filled = converted automatic alert (not dismissible by the user — guard in deleteNotification).
deleteNotification filters WHERE { id, userId, fingerprint: null } — prevents deleting automatic alerts.

┌─────────────────────────────────────────────────────────────────┐
│                         KM_CONFIG                               │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ @unique — one per user          │
│ gasolineRate    │ Float        │ @default(0.25) — 25%           │
│ ethanolRate     │ Float        │ @default(0.36) — 36%           │
│ minFuelPct      │ Float        │ @default(0.15) — 15% minimum     │
│ paymentDays     │ Int          │ @default(5) — D+5 business days│
│ vehiclePlate    │ String?      │ Vehicle plate                  │
│ vehicleMake     │ String?      │ Make (e.g. Toyota)               │
│ vehicleModel    │ String?      │ Model (e.g. Corolla)             │
│ vehicleYear     │ Int?         │ Vehicle year                   │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Note: created via upsert on the first visit to settings. userId is unique.

┌─────────────────────────────────────────────────────────────────┐
│                         KM_PERIOD                               │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ name            │ String       │ Period name                    │
│ startDate       │ DateTime     │ Period start                   │
│ endDate         │ DateTime     │ Period end                     │
│ fuelType        │ String       │ "gasoline" | "ethanol"         │
│ status          │ String       │ "open" | "submitted"           │
│ submittedAt     │ DateTime?    │ Submission date                │
│ expectedPayAt   │ DateTime?    │ submittedAt + business paymentDays│
│ totalKm         │ Float        │ Σ(route.km)                    │
│ fuelPriceAvg    │ Float        │ Σ(receipt.total)/Σ(receipt.lit)│
│ ratePerKm       │ Float        │ fuelPriceAvg × fuelRate        │
│ kmAmount        │ Float        │ totalKm × ratePerKm            │
│ extraAmount     │ Float        │ Σ(expense.amount)              │
│ grandTotal      │ Float        │ kmAmount + extraAmount         │
│ notes           │ String?      │ General remarks                │
│ transactionId   │ String?      │ Logical FK → Transaction.id     │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ routes          │ Relation     │ → KmRoute[]                    │
│ receipts        │ Relation     │ → KmReceipt[]                  │
│ expenses        │ Relation     │ → KmExpense[]                  │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          KM_ROUTE                               │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ periodId        │ String (FK)  │ → KmPeriod.id (cascade)        │
│ date            │ DateTime     │ Trip date                      │
│ origin          │ String       │ Origin address                 │
│ destination     │ String       │ Destination address             │
│ km              │ Float        │ Route mileage                  │
│ notes           │ String?      │ Remarks                        │
│ polyline        │ String?      │ Encoded route polyline           │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         KM_RECEIPT                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ periodId        │ String (FK)  │ → KmPeriod.id (cascade)        │
│ date            │ DateTime     │ Fill-up date                   │
│ fuelType        │ String       │ "gasoline" | "ethanol"         │
│ liters          │ Float        │ Liters filled                  │
│ totalAmount     │ Float        │ Receipt total amount            │
│ notes           │ String?      │ Remarks                        │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         KM_EXPENSE                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ periodId        │ String (FK)  │ → KmPeriod.id (cascade)        │
│ type            │ String       │ "toll"|"parking"|              │
│                 │              │ "accommodation"|"food"|        │
│                 │              │ "taxi"|"other"                 │
│ date            │ DateTime     │ Expense date                   │
│ amount          │ Float        │ Amount                         │
│ notes           │ String?      │ Remarks                        │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          KM_PLACE                               │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ Logical FK → User.id           │
│ name            │ String       │ Saved place name                │
│ address         │ String       │ Full address                   │
│ routeGoing      │ String?      │ JSON: [{lat,lng}] (outbound)    │
│ routeReturn     │ String?      │ JSON: [{lat,lng}] (return)      │
│ distanceGoing   │ Float?       │ Outbound route km               │
│ distanceReturn  │ Float?       │ Return route km                 │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Note: routeGoing/routeReturn store polylines as a JSON-stringified array of waypoints.
The polyline is used when generating the PDF (Google Static Maps path parameter).
```

### Relationship diagram

```
USER
 │ (userId as a logical FK in every data table)
 │
 ├── TRANSACTION ──────────< TRANSACTION_TAG >────── TAG
 │        │
 │        └── recurrence + recurrenceEndsAt
 │               └── feeds → PROJECTIONS (logical, no FK)
 │
 ├── BUDGET
 │      └── category (same key as Transaction.category — logical, no FK)
 │
 ├── GOAL ──────────< GOAL_PAYMENT
 │        │
 │        └── monthlyAmount = targetAmount / months_until_deadline
 │
 ├── LIABILITY  (userId present — entity isolated per user)
 │        └── status: active | paid_off
 │
 ├── SETTINGS  (one record per user — userId unique)
 │
 └── PILL_PROGRESS  (educational progress per pill — userId+pillId unique)
```

---

## 4. Relationship Table

| Table A | Table B | Type | Key | Behavior |
|---|---|---|---|---|
| Transaction | Tag | N:N | via TransactionTag | A transaction can have many tags; a tag can be on many transactions |
| TransactionTag | Transaction | N:1 | transactionId → Transaction.id | onDelete: Cascade — deleting a transaction removes the links |
| TransactionTag | Tag | N:1 | tagId → Tag.id | onDelete: Cascade — deleting a tag removes the links |
| Goal | GoalPayment | 1:N | goalId → Goal.id | onDelete: Cascade — deleting a goal removes every payment |
| Budget | Transaction | Logical | category (string) | Budget.category = Transaction.category — no DB FK; join done in the application |
| Transaction | Projections | Logical | recurrence + recurrenceEndsAt | Recurring transactions are extrapolated to 12 months in memory |

### Per-user data isolation

Every data table has `userId` (Transaction, Tag, Budget, Goal, Liability, Settings). Every query in every Server Action includes `where: { userId }` obtained via `requireAuth()`. Users have no access to each other's data.

---

## 5. Category Model

The analytical heart of Lyfx is its category taxonomy, which distinguishes not just income from expense, but **each entry's profile**.

### Income (type: "credit")

| Value | Label | Examples |
|---|---|---|
| `credit_fixed` | Fixed | Salary, owner's draw |
| `credit_variable` | Variable | Freelance work, reimbursements, one-off sales |

### Expenses (type: "debit")

| Value | Label | Examples | Characteristic |
|---|---|---|---|
| `debit_fixed` | Fixed | Rent, condo fees, subscriptions | Predictable amount and frequency |
| `debit_variable` | Variable | Food, fuel, leisure | Predictable frequency, variable amount |
| `debit_committed` | Committed | Card installments, overdraft | Debt already taken on |
| `debit_longterm` | Long-term | Payroll loan, financing | Multi-year horizon |
| `debit_seasonal` | Seasonal | Vehicle tax, insurance, Christmas | Predictable but not monthly |
| `debit_unexpected` | Unpredictable | Emergencies | Not plannable |
| `debit_intentional` | Intentional Allocation | Reserve, payoff, investment | Active choice of destination |

This distinction lets the P&L show not just the balance, but the **financial quality** of the period.

---

## 6. Technical Reference per Module

> **Product descriptions and business value**: see `docs/FEATURES.md`.
> This section documents routes, Server Actions, relevant schema, and technical behaviors specific to each module.

### 6.1 Landing Page (`/`)

Public product presentation page. Updated in v1.5.0 to reflect the current system vision. Internationalized in PT / EN / ES starting in v1.6.5.

- **Access**: any visitor with no session
- **Behavior with an active session**: redirects to `/dashboard`
- **Sections**: sticky Navbar, Hero with the dashboard mockup (includes the financial health widget), Marquee with product terms, 6 feature cards with interactive mini-mockups, "How it works" section in 4 steps, FAQ accordion (7 questions), final CTA, Footer
- **Highlighted features**: Personal P&L / DRE Pessoal / Estado de Resultados, Health Score, Financial Education, Proactive Alerts, Liabilities & Debt, Assets & Property
- **Marquee**: continuous CSS animation with Lyfx terms (13 items)
- **Navigation**: anchors to `#funcionalidades`, `#como-funciona`, `#faq`
- **Internationalization (i18n)**:
  - Supported languages: Portuguese (`pt`), English (`en`), Español (`es`)
  - Regionalized terminology: "DRE Pessoal" (PT) / "Personal P&L" (EN) / "Estado de Resultados" (ES); currencies R$ / $ / €
  - Language selector in the navbar: dropdown with monochrome flag icons (inline SVG)
  - Automatic detection on load: reads `localStorage("lyfx-lang")` → `navigator.language` → fallback `"pt"`
  - Manual switch persists in `localStorage` — reload keeps the chosen language
  - Architecture: `components/landing/translations.ts` with the `Translations` interface and the `T: Record<Lang, Translations>` object

### 6.2 Authentication (`/login`)

Unified login and account creation form.

- **Setup mode** (no user in the database): shows name + email + password + confirm password fields
- **Login mode** (existing user): shows email + password + remember me + forgot password fields
- **Mode toggle**: the user can switch between login and setup via a link, regardless of the database state
- **Client-side validations**: required fields, minimum 6-character password, password confirmation
- **Shake animation**: the button shakes when submitting with an error
- **Toast**: notifications for secondary actions (social login coming soon, forgot password)
- **"Forgot password" modal**: explains that Lyfx doesn't send email and guides the user to reset via the profile
- **Success state**: button turns green with a checkmark after a successful login
- **Left panel**: animated dot grid, f(x) watermark, static KPIs, insight pill, current month
- **Back button**: `← Início` (positioned at the top-left of the right panel) navigates to the landing page `/`
- **"Access Studio" link**: shown discreetly below the social login buttons (10px, color `--color-f4`); direct route to `/studio` bypassing the profile
- **Server Actions**: `setup()` for creation, `login()` for authentication; `logout()` redirects to `/`

### 6.3 Dashboard (`/dashboard`)

Financial command center for the current period. Redesigned in v0.5 to expose diagnosis, not just recording.

#### KPI Cards
Four metrics at the top of the page:
- **Balance**: the month's net result (income − all expenses). Green if positive, red if negative
- **Income**: sum of all credits for the month
- **Expenses**: sum of all expenses for the month
- **Saved**: amount allocated to `debit_longterm` — what was directed to the long term

#### Cascading P&L with intermediate margins
The platform's main analytical evolution. Instead of showing only totals by category, the P&L now shows **three progressive margins** after each deduction layer:

| Level | Calculation | Meaning |
|---|---|---|
| **Surplus after fixed** | Income − Fixed expenses | How much is left after paying certain obligations |
| **Operating margin** | Surplus after fixed − Variable expenses | How much is left after the recurring cost of living |
| **Operating result** | Operating margin − Committed | How much is left after honoring every active debt |

Each margin is shown with a colored badge (green/red) inline on the corresponding deduction row. This turns a spending list into a **cascading financial diagnosis**.

#### `DRESummary` — updated type
The `DRESummary` type in `lib/types.ts` gained two fields:
- `margins: { afterFixed, afterVariable, afterCommitted, net }` — the four computed margins
- `saved: number` — shortcut to `debits.longterm`, used in the KPI cards

#### Lyfx Insight
Contextual banner generated based on priority rules:
1. Negative result → alert with the deficit amount
2. Committed > 35% of income → high debt alert
3. Active goal + free balance → redirect suggestion
4. Savings rate < 10% → increase suggestion
5. Healthy month → positive confirmation with the savings rate

#### Goals Mini Widget
Side widget with a progress bar for each active goal (up to 4). Direct access to `/goals`.

#### Monthly trend chart
Bars for the last 6 months of spending. Current month highlighted in cyan. Tooltip with income, expense, and result on hover.

#### Recent transactions
Last 8 entries of the month, with direct access to `/transactions`.

#### Data source (`app/actions/dashboard.ts`)
Dedicated action that fetches in parallel: DRE summary, recent transactions, active goals, monthly trend (6 months), and every tag — all in a single `Promise.all` to minimize waterfalls.

### 6.4 Transactions (`/transactions`)

Listing and creation of financial entries.

- **Creation form**: type (credit/debit), date, description, amount, category, notes, recurrence, tags
- **Form modes**: "One-off" (single or recurring entry) and "Installments" (N monthly installments)
- **Recurrence** (One-off mode): `once` = "Does not repeat", `monthly` = "Every month", `yearly` = "Every year"
- **Installments**: dedicated mode — defines total amount + number of installments. Creates N records with a shared `installmentGroupId` UUID, `installmentNumber`, and `installmentTotal`. Description automatically receives an `(N/M)` suffix
- **Reimbursable toggle**: appears only on debits — sets `reimbursable = true` and directs the entry to tracking in `/reimbursements`
- **TagPicker**: inline tag selector with quick creation (name + color + icon)
- **List interaction**: clicking a transaction expands an animated `ActionBar` (slide-down) with a red background at the top of the card
- **ActionBar**: "Edit" (amber), "This one only"/"Delete" (red), "Delete Nx" (red, installments only), "×" close buttons
- **Editing — 3 automatic modes**:
  - `single`: one-off transaction (`recurrence = "once"` with no `installmentGroupId`) — edits only the record
  - `installment`: installment transaction (`installmentGroupId` set) — calls `updateFutureInstallments()`, changes only installments from today onward; does not expose the date field
  - `recurring`: recurring (`recurrence !== "once"`) — edits the single record; amber banner warns it only affects future projections
- **Deletion**: "This one only" deletes the individual record; "Delete Nx" calls `deleteInstallmentGroup()` and removes every installment in the group

### 6.5 Budget (`/budget`)

Monthly financial plan: expected income, category allocations, and planned vs. actual balance.

- **Expected income**: single global inline-editable value. Saved in `Settings.expectedMonthlyIncome`. Compared to the selected month's actual income via a green progress bar
- **Category allocations**: replaces the "spending cap" concept with "intentional allocation" — where you plan to direct the money. Shows `X% of expected income` below the value when income is configured
- **Allocation upsert**: `setBudget(category, amount)` uses `upsert` (category is unique)
- **Per-category progress bars**: green (< 75%), yellow (75–99%), red (≥ 100%) — spent vs. allocated
- **Month navigation**: actual spending filters the selected month's transactions client-side; allocations are global (same plan for every month)
- **Balance**: card with two columns — Planned (expected income − total allocated) and Actual (real income − total spent for the month)
- **Settings singleton**: `getSettings()` uses a get-or-create pattern; a record is created automatically on first visit

### 6.6 Fixed Expenses (`/fixed-expenses`)

Dedicated view of every entry with `recurrence !== "once"`.

- **3 summary cards**: total monthly recurring, total yearly one-off, 12-month projection
- **Breakdown by tags**: chips showing how much each tag represents in the fixed expenses
- **Monthly list**: monthly transactions sorted by amount
- **Yearly list**: yearly transactions with a badge for the month they occur in
- **12-month projection**: horizontal bar chart showing each month's commitment. Red bars = monthly base. Yellow peaks = months with yearly entries

### 6.7 Goals (`/goals`)

Financial goal system with automatic charging.

- **Goal creation**: name, description, target amount, deadline (input type="month"), color
- **Automatic calculation**: as amount and deadline are set, the system shows in real time the required monthly payment and the feasibility based on the average surplus of the last 3 months
- **Feasibility classification**:
  - ≤ 30% of surplus → "Comfortably fits"
  - 31–60% → "Feasible"
  - 61–100% → "Tight — consider extending the deadline"
  - > 100% → "Not feasible — you'd need $X/month more"
- **Automatic payment generation**: on creating the goal, the system generates a `GoalPayment` for each month between now and the deadline
- **Payment marking**: the user clicks each payment to mark it paid or unpaid. The goal's `currentAmount` is recalculated automatically
- **Overdue payments**: unpaid payments with a past `dueDate` appear highlighted in red with an "Overdue" badge
- **Goal status**: `active` → `completed` automatically when `currentAmount >= targetAmount`
- **Top summary**: total in active goals, total already saved, monthly commitment as % of surplus

### 6.8 Projections (`/projections`)

Simulation of the next 12 months based on recurrences and installments.

- **Data source**: transactions with `recurrence = "monthly"` or `"yearly"` + transactions with `installmentGroupId` (individual future installments)
- **Respects `recurrenceEndsAt`**: recurrences with an end date don't appear after the end month
- **Installments**: each individual installment record has its own `date` — the projection simply distributes each installment in the correct month (no extrapolation)
- **Type conversion**: `tx.type` in the database is `"credit"/"debit"`; the projection converts to `"income"/"expense"` internally for the free-balance calculation
- **Summary cards**: accumulated free balance (sum of positive months), average monthly free balance, months in the red
- **Macro bar chart**: 12 clickable columns — committed income (cyan), committed expense (red), free balance (green)
- **Monthly detail**: clicking a month shows the full breakdown in the panel below — every inflow and outflow with an "Yearly" badge on yearly entries
- **Important distinction**: projections show only what is **committed** (recurring + installments), they don't simulate variable inflows/outflows

### 6.9 Tags (`/tags`)

Label management.

- **Creation**: unique name, color (palette of 8 colors), icon (12 Tabler Icons options)
- **Real-time preview**: preview chip updates as the user picks color and icon
- **Inline editing**: name, color, and icon are editable
- **Deletion**: with automatic cascade on links (TransactionTag)
- **Available TAG_ICONS**: tag, briefcase, home, car, heart, star, bolt, cart, school, plane, laptop, coffee

### 6.10 Profile (`/profile`)

Editing personal data and credentials.

- **Avatar upload**: image selection → client-side resize via Canvas API to 200×200px → conversion to base64 JPEG → storage in the database
- **Editable fields**: name, email, age, gender
- **Structured address**: ZIP code, street, number, city, state, and country — in separate fields
  - **ViaCEP auto-fill**: clicking the magnifying glass (or pressing Enter) on the ZIP field queries `viacep.com.br` and automatically fills street, city, and state
  - **Country**: typeable combobox (`CountrySelect`) with every country in the world in Portuguese; filters as you type, accepts free text
- **Password change**: requires the current password (verified with bcrypt.compare), new password (minimum 6 chars)
- **Access via UserMenu**: the "Edit profile" link lives in the floating top-right menu, not the sidebar

### 6.11 Financial Health (`/health`)

Diagnostic score with 4 dimensions and an evolving profile.

#### Score (0–100 pts)

| Dimension | Weight | Max criterion |
|---|---|---|
| Commitment | 30 pts | Committed ≤ 30% of income |
| Savings | 25 pts | Savings ≥ 20% of income |
| Result | 25 pts | Positive net result |
| Reserve | 20 pts | ≥ 6 months of reserve |

#### Profiles

| Score | Profile | Color |
|---|---|---|
| 0–39 | Recovering | Red `#F87171` |
| 40–59 | Stabilized | Amber `#FBBF24` |
| 60–79 | Building | Cyan `#22D3EE` |
| 80–100 | Free | Green `#4ADE80` |

- **SVG Gauge**: animated semicircle showing the current score
- **4 `DimensionCard`s**: score per dimension with a progress bar and contextual description
- **Profile badge**: name + point range + "X pts to reach Y"
- **Tip banner**: prioritized tip based on the lowest-scoring dimension
- **Dashboard widget**: `HealthScoreCard` at the top of the right column with score, profile, and a link to `/health`

#### Data source (`app/actions/health.ts`)

- `getDRESummary(month, year)` — current month's P&L
- `getSettings()` — reads `reserveBalance` declared by the user
- **Reserve logic**: if `settings.reserveBalance > 0`, uses the declared value directly; otherwise uses a proxy (all-time accumulated `debit_longterm`) for backward compatibility
- Average expenses of the last 3 complete months → `reserveMonths = reserveAmount / avgMonthlyExpenses`
- Pure calculation in `lib/health.ts` (`computeHealthScore`) — no database access
- **Inline reserve editor**: editable field on the "Reserve fund" `DimensionCard` — saves via `updateReserveBalance()` and revalidates `/health` with no page reload

### 6.12 Liabilities (`/liabilities`)

Debt management with an avalanche-method payoff plan.

- **Registration**: name, type, outstanding balance, interest rate (% per month), minimum payment, creditor (optional), notes (optional)
- **Supported types**: Overdraft, Revolving credit, Loan, Financing, Other
- **Summary cards**: total in active debt, interest burned/month, total minimum payment
- **LiabilityCard**: per liability — balance, rate, minimum, payoff forecast
  - ≤ 12 months → green | ≤ 36 months → amber | > 36 months → red
  - Red alert when the minimum doesn't cover interest (debt never paid off)
- **Inline editing**: modal with real-time recalculation of the payoff forecast
- **Mark as paid off**: changes `status` to `paid_off`; remains visible in the "Paid off" section
- **Recovery Mode** (collapsible section):
  - Automatic sorting by highest interest rate (avalanche method)
  - Extra payment calculator: type an amount, the system shows how many months are saved on each debt
  - Extra applied to the highest-interest debt first; the rest gets only the minimum
  - Priority badge (1, 2, 3...) per debt
  - Tip explaining the avalanche method
- **`lib/liabilities.ts`**: pure function `monthsToPayoff(balance, monthlyRate, payment)` — separated from the `"use server"` file (Turbopack limitation)
- **Contextual alert on `/goals`**: if liabilities with a rate ≥ 5% per month exist, GoalsView shows a red banner listing the debts and suggesting prioritization; if all debts have low interest, shows a green confirmation

### 6.13 Institutions (`/institutions`)

Registry of banks, fintechs, and brokerages with their linked accounts.

- **Institution types**: Bank, Fintech, Brokerage, Other — with customizable color and icon
- **Accounts per institution**: each institution can have N accounts (checking, savings, credit card, investments, wallet, other) with optional balance and limit
- **Summary cards**: total in accounts, total liabilities linked, number of active institutions
- **InstitutionCard**: expandable — lists accounts with type, balance, and limit; lists liabilities linked to the institution
- **Liability linking**: when creating/editing a liability in `/liabilities`, it can be linked to an institution
- **Transaction linking**: when creating a transaction, it can be linked to a specific account (visible when accounts are registered)
- **Cascade deletion**: deleting an institution removes its accounts, clears `institutionId` on linked liabilities, and clears `accountId` on linked transactions
- **`lib/institutions.ts`**: types and constants (`InstitutionType`, `AccountType`, labels, interfaces) — separated from the `"use server"` file due to a Turbopack limitation

### 6.17 Alerts and Notifications (`/alerts`)

Unified center with two distinct types of message to the user.

#### Financial alerts (automatic)

Computed on-the-fly in `app/actions/alerts.ts` — not persisted to the database, never dismissible by the user:

| Type | Severity | Criterion |
|---|---|---|
| Budget | ⚠ warning | Category ≥ 80% of the defined limit |
| Budget | 🔴 danger | Category ≥ 100% of the limit (blown) |
| Goal | ⚠ warning | Unpaid GoalPayment due by the end of the month |
| Goal | 🔴 danger | Unpaid GoalPayment already overdue |
| Projection | ⚠ warning | Any of the next 12 months with a negative free balance |
| Seasonal | ⚠ warning | Yearly expense due within the next 2 months |
| Liability | 🔴 danger | Active liability of type `cheque_especial` (overdraft) or `rotativo` (revolving credit) |

#### System notifications (CS-18/CS-19)

Persisted in the `Notification` model with `fingerprint: null`. Sent by the Studio or automatically:

- **Bell in the UserMenu**: badge with the unread count (red), opens a dropdown with two sections
- **Dropdown**: "Financial alerts" (danger first, count of others) + "Notifications" with an unread dot / delete button
- **Automatic dedup**: alerts converted into a notification use `fingerprint` (never `null`) — the `getNotifications()` query filters `fingerprint: null` to show only system notifications
- **7-day TTL**: alerts converted into notifications expire via `expiresAt`
- **Automatic welcome**: `adminCreateUser` creates a welcome notification with `fingerprint: null`
- **deleteNotification**: `fingerprint: null` guard prevents deleting automatic alerts
- **Notifications section in AlertsView**: "Mark all as read" + "Clear all"

### 6.14 Reimbursements (`/reimbursements`)

Tracking of reimbursable expenses and their receipt status.

- **How it works**: when recording a debit transaction, the user can enable the "Reimbursable expense" toggle — the `reimbursable` field is saved as `true`
- **New field**: `reimbursedAt DateTime?` on `Transaction` — filled when marked as received; `null` = pending
- **Summary cards**: To receive (total pending), Already reimbursed (total received), Total recorded
- **"Awaiting reimbursement" list**: amber badge, circular button to mark as received
- **"Reimbursed" list**: green badge, shows the receipt date; undo button
- **Actions**: `getReimbursables()`, `markReimbursed(id)`, `unmarkReimbursed(id)` in `transactions.ts`
- **Sidebar link**: under Analysis, `IconReceipt2` icon

### 6.15 Seasonal Provisioning (in `/fixed-expenses`)

Section added at the end of the Fixed Expenses page, visible when there are registered yearly expenses.

- **Logic**: for each yearly expense (`recurrence = "yearly"`), computes `amount ÷ months until the next due date` — doesn't divide by a fixed 12, but by the actual remaining time
- **Urgency**: ≤ 2 months = red "Urgent" | ≤ 4 months = amber | rest = green
- **Sorting**: most urgent to farthest
- **Per item**: visual progress bar for the deadline consumption, next due date, total amount, and monthly amount to provision
- **Summary**: consolidated total to provision per month shown in the tip banner
- **Component**: `ProvisaoSazonal` — sub-component inside `FixedExpensesView.tsx`

### 6.18 Assets & Property (`/assets`)

Registration and tracking of physical assets with their associated taxes and expenses.

- **Asset types**: Real estate (address), Vehicle (make/model/year/plate), Other asset
- **Common fields**: purchase value, current estimated value, acquisition date, notes
- **Variation**: difference between purchase value and current value shown in green/red on the expanded card
- **Expenses per asset**: Property tax, Vehicle tax, Rural land tax, Mandatory insurance, Insurance, Registration, Maintenance, Other
  - Paid/pending toggle with recorded payment date
  - Visual alert (red background) for overdue expenses
  - Expense type suggestions adapted to the asset type (e.g. vehicle tax doesn't show for real estate)
- **Totals per asset**: paid × pending × total in the expanded footer
- **Global summary cards**: registered assets, total estimated value, total annual cost, overdue expenses
- **Dashboard widget** (`AssetsMiniWidget`): shows assets, total value, and annual cost; pending badge if any; automatically hidden if no assets are registered
- **`lib/assets.ts`**: types and constants (`AssetType`, `AssetExpenseType`, labels, `EXPENSE_SUGGESTIONS`) — separated from the `"use server"` file due to a Turbopack limitation

### 6.19 Education (`/education`)

Gamified financial education module based on knowledge pills.

**Track hub (`/education`)**
- 85 pills distributed across 4 financial profiles: Recovering, Stabilized, Building, and Free
- The active profile is automatically derived from the user's financial health score
- Navigation tabs let you freely explore the 4 tracks
- Progress bar per track: X/Total pills completed
- "Next Pill" CTA — always highlights the next incomplete one
- Ordered track list: completed (green check), next (cyan), pending (muted)
- Weekly streak: clickable badge opens a 12-week calendar showing consistency

**Reading a pill (`/education/[pillId]`)**
- Highlighted hook in a side quote
- Typed sections with their own visual identity: `explanation` (neutral), `insight` (amber), `practical` (green), `reframe` (purple), `reflection` (cyan)
- Silent timer: measures reading time without showing it to the user
- Re-reading: previous completion banner (date, time, quiz result) but content always accessible
- Quiz at the end: 3 options, locks on selection, shows feedback per option (green=correct, red=wrong)
- "Complete Pill" button appears after answering the quiz
- Post-completion: success banner + next pill card (or a link to the track if it's the last one)

**Knowledge Base (`/education/platform`)**
- Usage guides for each platform module (existing EducationView)

**Data and persistence**
- Pills: static content in `lib/pills-data.json` (85 pills, no database)
- Progress: `PillProgress` table — one row per user/pill; re-readings don't overwrite the first record
- Streak: computed on-the-fly from completion dates (weeks with ≥ 1 pill)

**Technical note v1.9.1+**: the `lib/db-pills.ts` workaround (direct better-sqlite3) was removed in v1.11.0 (CS-30). `PillProgress` uses `db.pillProgress` via Prisma normally after the PostgreSQL migration.

---

### 6.20 Special Reimbursement (`/km-reimbursement`)

Full corporate mileage control module. Added in v1.10.0 (CS-17).

#### Routes

| Route | Component | What it does |
|---|---|---|
| `/km-reimbursement` | `PeriodList.tsx` | Period history (open and submitted) + KPIs |
| `/km-reimbursement/new` | `NewPeriodForm.tsx` | New request form |
| `/km-reimbursement/[id]` | `PeriodDetail.tsx` | 4 tabs: Routes, Fuel, Expenses, Summary |
| `/km-reimbursement/places` | `PlacesPage.tsx` | CRUD of saved places with a map |
| `/km-reimbursement/settings` | `KmSettings.tsx` | Calculation rates + vehicle data |

#### Server Actions (`app/actions/km-reimbursement.ts`)

**Config:**
- `getKmConfig()` → upserts the default if it doesn't exist (userId is unique)
- `saveKmConfig(data)` → updates rates and vehicle data

**Periods:**
- `getKmPeriods()` → KmPeriod[] with `_count` of routes/receipts/expenses
- `getKmPeriod(id)` → KmPeriod with routes, receipts, expenses included
- `createKmPeriod(data)` → creates and returns the new period
- `deleteKmPeriod(id)` → automatic cascade (Prisma cascade on relations)
- `recalcPeriod(id)` → recalculates every derived field and persists (called after any mutation on children)

**Routes:**
- `createKmRoute(data)` → creates KmRoute → calls `recalcPeriod`
- `updateKmRoute(id, data)` → updates → calls `recalcPeriod`
- `deleteKmRoute(id)` → removes → calls `recalcPeriod`

**Fuel:**
- `createKmReceipt(data)` → creates KmReceipt → calls `recalcPeriod`
- `deleteKmReceipt(id)` → removes → calls `recalcPeriod`

**Expenses:**
- `createKmExpense(data)` → creates KmExpense → calls `recalcPeriod`
- `deleteKmExpense(id)` → removes → calls `recalcPeriod`

**Submission flow:**
- `submitPeriod(id)` → changes status to "submitted", computes D+5 business days, creates a Transaction, saves transactionId
- `reopenPeriod(id)` → returns to "open", deletes the Transaction, clears submittedAt/expectedPayAt/transactionId

**Places:**
- `getKmPlaces()` → user's KmPlace[]
- `createKmPlace(data)` → creates a saved place
- `updateKmPlace(id, data)` → updates (including routeGoing/routeReturn as JSON)
- `deleteKmPlace(id)` → removes

#### Calculation formulas

```typescript
// Weighted average fuel price
fuelPriceAvg = Σ(receipt.totalAmount) / Σ(receipt.liters)
// Example: $100 (15L) + $80 (12L) = $180 / 27L = $6.67/L

// Rate per km
ratePerKm = fuelPriceAvg × config.gasolineRate  // or ethanolRate
// Example: $6.67 × 0.25 = $1.67/km

// Mileage amount
kmAmount = totalKm × ratePerKm

// Extra
extraAmount = Σ(expense.amount)

// Grand total
grandTotal = kmAmount + extraAmount

// Fuel validation (minimum receipts)
fuelTotal = Σ(receipt.totalAmount)
minRequired = kmAmount × config.minFuelPct  // e.g. kmAmount × 0.15
isValid = fuelTotal >= minRequired
```

#### D+5 business days with national holidays

Since **v1.11.0 (CS-25)**, `addBusinessDays` is `async` and accounts for national holidays via BrasilAPI.
Location: `lib/km-utils.ts` (moved from `app/actions/km-reimbursement.ts`).

```typescript
// lib/holidays.ts — in-memory cache per year
export async function getHolidays(year: number): Promise<Set<string>>
// Source: GET https://brasilapi.com.br/api/feriados/v1/{year}
// Fallback: empty Set if the API is offline (D+5 computes only sat/sun)
// Cache: next: { revalidate: 86400 } + in-memory Map<number, Set<string>>

// lib/km-utils.ts — main function
export async function addBusinessDays(startDate: Date, days: number): Promise<Date>
// Skips: Saturday (6), Sunday (0), and national holidays
// Guard: invalid days (NaN, negative) → safeDays = 0
// Year rollover: automatically loads next year's holidays
```

Usage in `submitPeriod`:
```typescript
const expectedPayAt = await addBusinessDays(submittedAt, config.paymentDays)
```

#### Google Maps integration

**DirectionsService** (in the browser, `RouteMap.tsx` component):
- `@react-google-maps/api` with `DirectionsService` + `DirectionsRenderer draggable={true}`
- On selecting origin/destination → DirectionsService fetches the route → `route.legs[0].distance.value` in meters → divided by 1000 → km
- The user can drag waypoints → km recalculated via the `onDirectionsChanged` event

**Polyline for the PDF** (`fetchDefaultPolyline` in `km-reimbursement.ts`):
- Server-side: `fetch` to `https://maps.googleapis.com/maps/api/directions/json`
- Parameters: `origin`, `destination`, `key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Response: uses `data.routes[0].overview_polyline.points` (encoded polyline string)
- **Critical gotcha**: the API returns `overview_polyline` (an object with `.points`) and NOT `overview_path` (a LatLng array). The correct key is `data.routes[0].overview_polyline.points`.
- If the API fails or `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not configured → returns `null` → PDF generated with no map image
- `NEXT_PUBLIC_*` vars require a server restart to take effect (embedded at build time)

**KmPlace as the polyline source of truth**:
- When saving a place via `updateKmPlace`, the polyline configured on the map is saved in `routeGoing`/`routeReturn` as a JSON stringify
- When generating the PDF, `PeriodPdf.tsx` uses the polyline from `KmRoute.polyline` if available; otherwise calls `fetchDefaultPolyline(origin, destination)` as a fallback
- This means routes configured via KmPlaces have more faithful maps in the PDF than manually typed routes

#### PDF Generation (`components/km-reimbursement/PeriodPdf.tsx`)

The PDF is generated **server-side** via `@react-pdf/renderer` v4.5.1. It does not use the user's browser to render — the React tree is rendered in Node.js by the server.

**Architecture:**
- `PeriodPdf.tsx` → React component that returns `<Document><Page>...</Page></Document>`
- The API route (or Server Action) calls `renderToBuffer(createElement(PeriodPdf, { period, routes, config }))` → returns a `Buffer` → sent as `application/pdf`
- `bodySizeLimit: "5mb"` configured on Server Actions to support PDFs with multiple map images

**Map images in the PDF:**
- For each KmRoute, fetches `fetchStaticMapImage(polyline)` → Google Static Maps API URL with `path=enc:{polyline}`
- Static Maps API returns JPEG → `fetch` → `arrayBuffer` → converts to base64 → embedded in `<Image src="data:image/jpeg;base64,..." />`
- Base64 inside the PDF works in react-pdf v4 (Image accepts a data URI)

**Typography (no loading external fonts):**
- "Ly" + "fx" logo: uses `Times-BoldItalic` (built-in PDF spec font) — an approximation of Georgia Bold Italic with no font file dependency
- Body: default font (Helvetica)

**Dot pattern in the background:**
- `DOT_POSITIONS` generated once at the module level (outside the component) — nested `for` loop for each 30pt × 30pt cell on the A4 page (595 × 842pt)
- Rendered as `<Svg><Circle />...</Svg>` with `position: absolute, top: 0, left: 0` fixed → appears on every page
- Generating it outside the component avoids recalculating on every PDF render

**Mini-header on pages 2+:**
- `<View fixed render={({ pageNumber }) => pageNumber > 1 ? <content /> : null} />`
- The `render` prop is needed because `fixed` renders on every page — the conditional prevents it from appearing on page 1 (which has the full header)
- `paddingTop: 56` on the `<Page>` accommodates the mini-header without overlapping content

**`wrap={false}` on the summary block:**
- Prevents the "Summary" block from being cut across pages
- If it doesn't fit on the current page, react-pdf breaks to the next page before starting the block

---

### 6.16 Studio (`/studio`)

Admin panel protected by a password separate from the user session.

#### Authentication and session

- **Password**: configured in `.env` → `ADMIN_SECRET`. Compared with `timingSafeEqual` — an operational secret
- **Cookie**: `lyfx_admin` HMAC-signed (v1.14.1) — format `{expiresAtMs}.{HMAC-SHA256(lyfx_admin.{expiresAtMs}, SESSION_SECRET)}`. `httpOnly: true`, `sameSite: lax`, 2 hours, `path: "/studio"`. Unforgeable, expires server-side; global revocation via `SESSION_SECRET` rotation
- **Modules**: `app/studio/actions.ts` is a re-export barrel — real code lives in `auth.ts`, `users.ts`, `data.ts`, `config.ts`, `notifications.ts`, `events.ts`, `board.ts`, `system-info.ts` (v1.14.1)
- **Access**: `/studio` — independent of the main app session; accessible via a discreet link on the `/login` page
- **Logout**: clears `lyfx_admin` (with `path: "/studio"`) **and** `lyfx_session` (with `path: "/"`) simultaneously → redirects to `/` via `redirect()` in the server action (no screen flash)
- **Login form**: `← Login` button at the top-left navigates to `/login`

#### Tabs (order)

`Panel → Users → Plans → Modules → Notes → Data → Schema → Documentation`

#### Panel Tab

Software management dashboard with two sections:

**Metric cards** (6 cards):
- Registered users (total count)
- Database records (sum of every data table)
- Disk space (database file size via `fs/promises stat()`, formatted in B/KB/MB/GB)
- Active plans (count of registered plans)
- Dev version (read from `lyfx/package.json`)
- Prod version (read from `lyfx-production/package.json`; shows `—` if the worktree doesn't exist)

**Global settings**:
- **Maintenance mode**: toggle that enables/disables the yellow maintenance banner shown at the top of every app route (`AppLayout` reads via `getConfigBool("maintenanceMode")`)
- **Maintenance banner**: editable text field with the message shown in the banner (saved in `AppConfig` as `maintenanceBanner`)

#### Users Tab

- **List**: avatar, name, email, signup date for every user
- **Password reset**: inline with confirmation — new password field (minimum 6 chars) + confirm button
- **Create user**: inline form — name, email, password. `revalidatePath("/studio")` + `router.refresh()` for immediate update with no reload
- **Delete user**: red button with an inline confirmation panel. Manual cascade in order: transactions → tags → budgets → goals → liabilities → settings → user (no FK from User to the data models)

#### Plans Tab

- **Plan list**: shows registered plans with name, description, and count of linked modules
- **Create Full plan**: automatic seed of every module with `isBeta: false` (stable modules)
- **Create Insider plan**: automatic seed of **every** module including betas — derived from `ALL_MODULE_KEYS` in `lib/modules.ts`
- **Seed buttons** only appear when the respective plan doesn't exist yet

#### Modules Tab

- Lists all 17 system modules with key, label, and beta status
- **Beta toggle**: per-module button to mark/unmark as beta in real time. State saved in `AppConfig` as `betaModules` (JSON array of keys). The app sidebar reads this value via `getConfigValue` in `AppLayout` — no server restart
- Modules marked as beta show the yellow "Beta" chip in the sidebar for every user

#### Notes Tab

Markdown editor persisted in `AppConfig` (key `adminNotes`). Features:

**Toolbar** (5 groups):
1. Headings: H1, H2, H3
2. Emphasis: Bold (`**`), Italic (`_`)
3. Lists: List (` - `), Ordered list (`1. `), Checklist (` - [ ] `)
4. Blocks: Quote (`> `), Code (inline \`\` or fenced block)
5. Action: Save

**Slash commands** (Notion-like): typing `/` at the start of a line opens a floating menu with 10 commands (`/h1`, `/h2`, `/h3`, `/bold`, `/italic`, `/list`, `/ordered`, `/todo`, `/quote`, `/code`). ↑/↓ keys navigate; Enter/Tab confirms; Esc closes.

**List auto-continuation**: pressing Enter on a line with ` - `, `1. `, or ` - [ ] ` starts the next line with the same pattern (ordered lists increment the number).

**Keyboard shortcuts**: `Ctrl+B` (bold), `Ctrl+I` (italic), `Ctrl+S` (save).

#### Data Tab

- **Users section**: typeable combobox to filter users by name or email (dropdown with search, cyan highlight on the selected item, closes on outside click via `useRef + useEffect`)
- **Per-user data**: on selecting, shows counters (transactions, tags, budgets, goals) and a table of the user's 10 most recent transactions
- **Global data** (no filter): shows the system's 10 most recent transactions

#### Schema Tab

Two schema views:

**Visual ERD**: UML diagram with every table and its columns. Tables start **collapsed** — clicking the header expands/collapses individually. Relationship lines between tables (via FK fields). Container with `width: 90vw`.

**Descriptive table**: lists every table with name, field count, and a textual description of what each table stores. Clicking a row in the visual ERD expands the corresponding table.

#### Documentation Tab

Markdown rendering of the `DOCUMENTATION.md` file. Clickable side TOC with h2, h3, and h4 (h3 indented 20px, h4 indented 32px, decreasing sizes). Clicking any TOC item smooth-scrolls to the corresponding heading (text slugify).

---

## 7. Interactions Between Modules

```
TRANSACTION
  ├── feeds → DASHBOARD (getDRESummary groups by category/type)
  ├── feeds → BUDGET (actual spend vs. limit per category)
  ├── feeds → FIXED-EXPENSES (filters recurrence !== "once")
  ├── feeds → PROJECTIONS (filters recurrence "monthly"/"yearly" + recurrenceEndsAt)
  ├── feeds → GOALS (3-month average surplus for feasibility calculation)
  └── links → TAG (via TransactionTag, N:N)

TAG
  ├── links → TRANSACTION (via TransactionTag)
  └── appears → FIXED-EXPENSES (tag breakdown in fixed expenses)

BUDGET
  ├── compares with → TRANSACTION (logical join by category string)
  └── expected income read from → SETTINGS (expectedMonthlyIncome)

SETTINGS
  └── feeds → BUDGET (expected income for % and balance calculation)

GOAL
  ├── generates → GOAL_PAYMENT (N payments on creation)
  └── updates → currentAmount (sum of paid=true GoalPayments)

GOAL_PAYMENT
  └── controls → GOAL.status (active → completed when currentAmount >= targetAmount)

LIABILITY
  ├── shown → /liabilities (LiabilitiesView — CRUD + Recovery Mode)
  └── alerts → /goals (GoalsView — contextual banner if rate >= 5%/month)

TRANSACTION.reimbursable
  └── shown → /reimbursements (filters reimbursable=true, groups by status)

TRANSACTION.recurrence = "yearly"
  └── feeds → /fixed-expenses (SeasonalProvisioning section — amount/months until due)

HEALTH
  ├── reads → TRANSACTION (via getDRESummary + debit_longterm aggregate)
  └── shown → DASHBOARD (HealthScoreCard widget) + /health (full HealthView)

USER
  ├── authenticates → the entire application (via the lyfx_session cookie)
  └── shown → SIDEBAR (name + avatar via AppLayout)

STUDIO
  ├── reads → USER (list, password reset, creation, cascade deletion)
  ├── reads → TRANSACTION (count + recent per user)
  ├── reads → TAG, BUDGET, GOAL (global and per-user counts)
  ├── reads/writes → APP_CONFIG (maintenance toggles, betaModules, admin notes)
  └── reads/writes → PLAN + PLAN_MODULE (Full/Insider seed, listing)

APP_CONFIG
  ├── read by → SIDEBAR (betaModules via AppLayout → getConfigValue)
  └── read by → APP_LAYOUT (maintenanceMode → global banner)
```

### Data flow — creating a recurring transaction

```
User fills the form (recurrence = "monthly")
  └── createTransaction() → saves 1 record to the database
        └── getProjections() reads the transaction
              └── for each projected month → replicates the item
                    └── if recurrenceEndsAt is set → stops when the date is passed
```

### Data flow — creating an installment plan

```
User fills the installment mode (e.g. $600 in 3x starting May/26)
  └── createInstallments()
        ├── generates groupId = randomUUID()
        ├── computes perInstallment = ceil(totalAmount / count * 100) / 100
        └── creates N Transaction records:
              ├── date = firstDate + i months
              ├── description = "Base (1/3)", "Base (2/3)", "Base (3/3)"
              ├── installmentGroupId = groupId (shared)
              ├── installmentNumber = i + 1
              └── installmentTotal = N

getProjections() reads each installment individually
  └── distributes each record into the month matching its date
```

### Data flow — editing an installment plan

```
User clicks an installment → ActionBar → Edit
  └── EditTransactionModal detects mode = "installment" (installmentGroupId set)
        └── on save → updateFutureInstallments(groupId, data)
              └── fetches every installment with date >= today
                    └── updates each one (description, amount, type, category, notes, tags)
                          └── reapplies the (N/M) suffix to each description
```

### Data flow — monthly budget

```
User sets expected income
  └── updateExpectedIncome(amount) → Settings.expectedMonthlyIncome

User sets an allocation per category
  └── setBudget(category, amount) → Budget upsert

BudgetView on loading the month:
  ├── filters transactions by the selected month/year client-side
  ├── computes realIncome = sum of credits for the month
  ├── computes totalSpent = sum of debits for the month
  ├── computes totalAllocated = sum of Budget.amount
  ├── per category: pct = spentByCategory / allocation
  └── balance:
        plannedBalance = expectedMonthlyIncome - totalAllocated
        realBalance    = realIncome - totalSpent
```

### Data flow — creating a goal

```
User sets name + amount + deadline
  └── createGoal()
        ├── computes baseAmount = floor(targetAmount / months)
        │     lastAmount = targetAmount - baseAmount × (months - 1)  ← absorbs the rounding residual
        ├── evaluates feasibility vs. avgMonthlyBalance (3-month average)
        ├── creates the Goal record
        └── creates N GoalPayment records (1 per month until the deadline)
              └── user marks GoalPayments as paid
                    └── markPayment() verifies ownership via { id, goal: { userId } }
                          └── recalculates currentAmount
                                └── if currentAmount >= targetAmount → status = "completed"
```

---

## 8. Authentication and Session

### Full flow

```
1. User accesses any protected route
2. proxy.ts (Edge Runtime) checks the "lyfx_session" cookie
   ├── No cookie + non-public route → redirect /login
   └── Cookie present + route /login or / → redirect /dashboard

3. AppLayout (Server Component) checks again:
   ├── userId not found in the database → redirect /api/clear-session
   │     └── Route Handler deletes the cookie + redirect /login (avoids a loop)
   └── User found → renders Sidebar + UserMenu (floating) + children

4. Successful login (email/password):
   └── createSession(userId, ip, userAgent) → Session in the database + 3-part HMAC cookie
       format: base64(sessionId).base64(userId).HMAC-SHA256(sessionId|userId|SECRET)

4b. OAuth login (Google / Microsoft):
    └── findOrCreateOAuthUser() → find by providerUserId → link by email → create new
        → createSession() → same 3-part HMAC cookie

5. Every authenticated request:
   └── touchSession() — updates lastSeenAt (Node.js runtime, not Edge)

6. Logout:
   └── invalidateSession(sessionId) → marks Session.isValid=false in the database → deletes the cookie → redirect /
```

### Stateful database sessions (CS-34)

The `Session` model persists every active session in the database:

```prisma
model Session {
  id          String   @id @default(cuid())
  userId      String
  isValid     Boolean  @default(true)
  ip          String?
  userAgent   String?
  createdAt   DateTime @default(now())
  lastSeenAt  DateTime @default(now())
  @@index([userId])
}
```

**3-part HMAC cookie** (`lyfx_session`):
- Format: `base64(sessionId).base64(userId).HMAC-SHA256(sessionId|userId|SESSION_SECRET)`
- Validated in the proxy (Edge Runtime) with no database — rejects a forged cookie immediately
- `getSession()` in Server Components: decodes the cookie + looks up the Session in the database (isValid=true)

**Central functions** (`lib/session.ts`):
- `createSession(userId, ip?, userAgent?)` — creates the Session in the database + sets the cookie
- `getSession(cookieStore)` — validates the HMAC + queries the database, returns `{ userId, sessionId }` or null
- `invalidateSession(sessionId)` — `isValid=false` in the database + deletes the cookie
- `invalidateOtherSessions(userId, sessionId)` — `deleteMany` for every other session of the user
- `touchSession(sessionId)` — updates `lastSeenAt` (no await in the layout, fire-and-forget)

**Sessions view in the profile** (`components/profile/SessionsSection.tsx`):
- Lists every active session of the user (IP, user-agent, relative lastSeenAt)
- Current session highlighted with a "This session" badge
- "Revoke" button per individual session → `revokeSession(targetSessionId)`
- "Sign out of all other devices" button → `revokeAllOtherSessions()`

### OAuth — Google and Microsoft (CS-36)

Implemented via the **Arctic** library (`arctic`) with a full PKCE flow.

**Data models:**
```prisma
model OAuthAccount {
  id             String   @id @default(cuid())
  userId         String
  provider       String                        // "google" | "microsoft"
  providerUserId String
  createdAt      DateTime @default(now())
  @@unique([provider, providerUserId])
  @@index([userId])
}
```

**Providers** (`lib/oauth.ts`):
- `getGoogleProvider()` → `new Google(CLIENT_ID, CLIENT_SECRET, redirectUri)`
- `getMicrosoftProvider()` → `new MicrosoftEntraId("common", CLIENT_ID, CLIENT_SECRET, redirectUri)`
- `isOAuthEnabled(provider)` → boolean — checks whether both CLIENT_ID and CLIENT_SECRET are in the environment
- Every redirect URI is derived from `APP_URL` — changing domains = changing 1 variable

**Authorization flow (initiation):**
```
GET /api/auth/google
  → generateState() + generateCodeVerifier()
  → cookies: oauth_state (httpOnly, maxAge:600) + oauth_code_verifier (httpOnly, maxAge:600)
  → redirect to Google's authorization URL (PKCE: code_challenge_method=S256)
```

**Callback flow:**
```
GET /api/auth/google/callback?code=...&state=...
  1. Validates state against the oauth_state cookie
  2. Exchanges code + verifier for tokens via Arctic
  3. Fetches the UserInfo API (Google) / decodes the id_token JWT (Microsoft)
  4. findOrCreateOAuthUser():
     ├── OAuthAccount with providerUserId exists → login (same account)
     ├── User with the same email exists → links OAuthAccount + login
     └── None → creates User + OAuthAccount + login
  5. createSession() → HMAC cookie → redirect /dashboard
  6. On error → redirectWithOAuthError() (flash cookie, not a URL param)
```

**Protection against account takeover via linking (v1.14.1)**:
- **Google**: linking by email requires `email_verified === true` in the userinfo — without this, redirects with an `email_not_verified` error
- **Microsoft**: linking by email uses **only** the `email` claim; `preferred_username` (a UPN mutable by the tenant) serves only for display/creation, never for linking to an existing account

**Microsoft specificity**: uses `claims.oid` (Object ID) as `providerUserId` — more stable than `sub` (which changes between tenants). Requires the delegated `User.Read` permission in Azure.

**Error flash cookie** (`lib/oauth-flash.ts`):
- `oauth_error` cookie: `httpOnly: false` (JS needs to read it), `maxAge: 30s`, `sameSite: lax`
- `LoginForm` reads and deletes the cookie in a `useEffect` — the URL stays clean (`/login` with no params)
- Localized Portuguese messages for `missing_params`, `state_mismatch`, `failed`

**Required environment variables:**
```
APP_URL="https://your-domain.com"     # base for every redirect URI
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
MICROSOFT_CLIENT_ID="..."
MICROSOFT_CLIENT_SECRET="..."
```

**Adaptive buttons**: if a provider's credentials aren't in `.env`, the corresponding button renders disabled (opacity-50, cursor-not-allowed, no `href`).

**OAuth routes** added to the proxy's `publicPaths` — without this, the proxy would intercept `/api/auth/google` and redirect to `/login?redirect=/api/auth/google` (a loop).

### Security Audit Log (CS-35)

The `AuditLog` model records every security event:

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String                            // AUDIT_META catalog key
  ip        String?
  metadata  Json?
  createdAt DateTime @default(now())
  @@index([userId])
  @@index([createdAt])
}
```

**Event catalog** (`lib/audit.ts` — `AUDIT_META`):

| action | label | variant |
|---|---|---|
| `auth.login.success` | Login successful | success |
| `auth.login.failed` | Login attempt failed | danger |
| `auth.logout` | Logout performed | info |
| `auth.password.changed` | Password changed | warning |
| `session.revoked` | Session revoked | warning |
| `session.revoked_all` | All other sessions revoked | warning |

**Logging functions:**
- `logEvent(opts)` — async/await, for use in Server Actions where errors should be handled
- `logEventBg(opts)` — fire-and-forget (`void promise`), for critical flows where a log failure must not block

**Flow integration:**
- `login()` → `logEventBg({ action: "auth.login.success" })` / `auth.login.failed`
- `logout()` → `logEventBg({ action: "auth.logout" })`
- `changePassword()` → `logEventBg({ action: "auth.password.changed" })` after `invalidateOtherSessions()`
- `revokeSession()` → `logEventBg({ action: "session.revoked", metadata: { targetSessionId } })`
- `revokeAllOtherSessions()` → `logEventBg({ action: "session.revoked_all", metadata: { count } })`
- OAuth callbacks → `logEventBg({ action: "auth.login.success" })`

**Json field cast** (Prisma v7 — no `Prisma` namespace):
```ts
metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined
```

**History in the profile** (`components/profile/AuditSection.tsx`):
- Last 50 events of the current user via `getAuditLogs()` (Server Action)
- Icon per variant: `IconShieldCheck` (success), `IconShieldX` (danger), `IconShieldExclamation` (warning), `IconShieldLock` (info)
- Relative time + IP + "Refresh" button

**Admin view in the Studio** (`SecurityTab` in `StudioClient.tsx`):
- Shows events for ALL users (multi-user)
- Filters: by user (select) and by event type (select)
- Data source: `getAdminSecurityLog(filters?)` in `app/studio/actions.ts` — query with a manual join (fetches AuditLog + Users in parallel, maps in memory)

### TOTP 2FA (CS-37a)

Two-factor authentication via TOTP (RFC 6238). Depends on `otplib` (v2 — direct-function API) and `qrcode`.

**Fields added to the User model:**
```prisma
twoFactorSecret      String?   // base32 secret generated by generateSecret()
twoFactorEnabled     Boolean   @default(false)
twoFactorBackupCodes String?   // JSON: string[] of bcrypt hashes
```

**`lib/totp.ts`** — TOTP utilities:
```
generateTotpSecret()                       → string (base32)
verifyTotpCode(secret, code)               → boolean  (verifySync().valid)
generateQrCodeUrl(email, secret)           → Promise<string>  (PNG data URL)
generateBackupCodes()                      → string[]  (8 × XXXX-XXXX-XXXX)
hashBackupCodes(codes)                     → Promise<string[]>  (bcrypt hash each)
verifyAndConsumeBackupCode(code, json)     → Promise<{ valid, remainingHashes }>
setPendingTwoFactor(userId)                → void  (sets the lyfx_2fa HMAC cookie)
getPendingTwoFactor()                      → Promise<string | null>  (userId or null)
clearPendingTwoFactor()                    → void
```

**`lyfx_2fa` cookie** (pending state between login steps 1 and 2):
```
format: base64url(userId).base64url(expiry).HMAC(userId|expiry, SESSION_SECRET)
maxAge: 300s (5 min) · httpOnly · sameSite:lax · secure in production
```
Validated with `crypto.timingSafeEqual` — protects against timing attacks.

**Login flow with 2FA active:**
```
POST /login (email + password)
  → valid password + twoFactorEnabled=true
  → setPendingTwoFactor(userId)
  → return { requires2FA: true }
  → LoginForm switches to the "2fa" step

POST verifyTwoFactor({ code, isBackupCode })
  → getPendingTwoFactor() → userId (validates HMAC + expiry)
  → if backup: verifyAndConsumeBackupCode() → updates twoFactorBackupCodes
  → if TOTP: verifySync({ token, secret }).valid
  → clearPendingTwoFactor() + createSession() + redirect /dashboard
```

**Server Actions** (`app/actions/two-factor.ts`):
- `initTwoFactorSetup()` — generates the secret, persists it provisionally (enabled=false), returns `{ qrCodeUrl, secret }`
- `confirmTwoFactorSetup(code)` — verifies the first TOTP, enables 2FA, generates and stores the hashes of the 8 backup codes, returns `{ backupCodes }` in plain text (shown only once)
- `disableTwoFactor(code)` — verifies TOTP, clears secret/enabled/backupCodes
- `regenerateBackupCodes(code)` — verifies TOTP, generates 8 new codes, returns them in plain text
- `getTwoFactorStatus()` — returns `{ enabled, backupCount }`

**Audit Log events added:**
| Event | When |
|---|---|
| `auth.2fa.enabled` | Setup confirmed successfully |
| `auth.2fa.disabled` | Disabling confirmed |
| `auth.2fa.failed` | Invalid TOTP code at login |
| `auth.2fa.backup_used` | Backup code used (records `remaining`) |

**Setup UI** (`components/profile/TwoFactorSection.tsx`):
- 3-step modal: QR Code → verify code → show backup codes
- Option to view the secret as text for manual entry
- Disable modal and backup regeneration modal (both require the current TOTP code)
- Status badge in the profile: green with the count of remaining backups / gray disabled

### Security

- Passwords are never stored in plain text — always bcrypt hash (salt factor 10)
- **Strong password policy** (CS-33, `lib/password-strength.ts`): minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character. Identical validation in `setup()`, `changePassword()`, and client-side via `validatePasswordStrict()`
- `httpOnly: true` cookie — inaccessible via browser JavaScript
- `secure: true` cookie in production — HTTPS only
- `sameSite: lax` — CSRF protection
- The proxy fully validates the HMAC-SHA256 via the Web Crypto API (Edge Runtime) — a forged cookie is rejected at the edge before any rendering
- Full user-existence validation in `AppLayout` (Node.js runtime, with database access) — second line of defense
- **Per-IP rate limiting** (CS-32, `lib/login-attempts.ts`): sliding window over the `LoginAttempt` model. Three states: `ok` / `captcha` (requires Cloudflare Turnstile) / `blocked` (returns `retryAfterMinutes`). Thresholds configurable via the Studio (AppConfig: `login_captcha_threshold`, `login_block_threshold`, `login_window_minutes`). Lazy cleanup of records >24h.
- **Cloudflare Turnstile CAPTCHA** (CS-32): token validated server-side via `POST /turnstile/v0/siteverify`. In dev without `TURNSTILE_SECRET_KEY`: automatic bypass with a console warning. In production without the key: fail-closed (returns `false`). Dark widget, dynamically loaded.
- Timing side-channel defense: `bcrypt.compare` always runs even when the user doesn't exist (fixed dummy hash), avoiding detection of valid emails through latency differences
- **HTTP security headers** (CS-31, `next.config.ts`):
  - `X-Frame-Options: DENY` — blocks clickjacking via iframe
  - `X-Content-Type-Options: nosniff` — prevents MIME sniffing
  - `Referrer-Policy: strict-origin-when-cross-origin` — controls URL leakage
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)` — restricts sensitive browser APIs
  - `Strict-Transport-Security: max-age=63072000` — forces HTTPS for 2 years in production
  - `X-XSS-Protection: 1; mode=block` — legacy XSS filter

### Studio

- Separate cookie: `lyfx_admin` with `path: "/studio"` (doesn't leak to other routes)
- Short expiration: 2 hours
- Password via the `ADMIN_SECRET` environment variable — never in code
- Direct equality comparison (no hash) — the password is an operational secret, not a user secret
- Studio logout also invalidates the app user session (`lyfx_session`) in a single operation
- Cookie deletion always specifies the `path` matching creation — without this the cookie persists
- **Every sensitive Server Action** (`adminDeleteUser`, `adminResetPassword`, `adminCreateUser`, `getStudioData`, `getStudioDataForUser`) calls `requireAdmin()` internally — double protection beyond the page component guard

---

## 9. File Architecture

```
lyfx/
├── app/
│   ├── (app)/                    # Protected routes (require a session)
│   │   ├── layout.tsx            # AppLayout: verifies session + injects Sidebar and UserMenu
│   │   ├── dashboard/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── budget/page.tsx
│   │   ├── fixed-expenses/page.tsx
│   │   ├── goals/page.tsx
│   │   ├── projections/page.tsx
│   │   ├── planning/page.tsx
│   │   ├── reports/page.tsx      # (pending)
│   │   ├── tags/page.tsx
│   │   ├── health/page.tsx
│   │   ├── liabilities/page.tsx
│   │   ├── reimbursements/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── institutions/page.tsx # Bank/fintech and account registry
│   │   ├── alerts/page.tsx       # Proactive alerts center
│   │   ├── assets/page.tsx       # Assets, real estate, vehicles, and associated expenses
│   │   ├── education/page.tsx           # Track hub (Server Component)
│   │   ├── education/[pillId]/page.tsx  # Pill reading (Server Component)
│   │   └── education/platform/page.tsx # Knowledge base (wrapper)
│   ├── actions/                  # Server Actions — mutations and queries
│   │   ├── dashboard.ts          # getDashboardData() — fetches everything in parallel
│   │   ├── transactions.ts       # getDRESummary() returns margins + saved
│   │   ├── tags.ts
│   │   ├── budgets.ts
│   │   ├── goals.ts
│   │   ├── projections.ts
│   │   ├── reports.ts
│   │   ├── health.ts             # getHealthData() — P&L + reserve + score
│   │   ├── liabilities.ts        # Liability CRUD
│   │   ├── settings.ts           # getSettings / updateExpectedIncome
│   │   ├── institutions.ts       # Institution and account CRUD
│   │   ├── alerts.ts             # getAlerts() — 5 alert types, on-the-fly
│   │   ├── assets.ts             # Asset and expense CRUD (AssetExpense)
│   │   ├── education.ts          # getPillProgress / completePill / getStreakData
│   │   └── user.ts
│   ├── api/
│   │   └── clear-session/route.ts  # Route Handler — clears an orphan cookie
│   ├── login/
│   │   ├── page.tsx              # Server Component — injects hasUser + monthLabel
│   │   ├── LoginForm.tsx         # Client Component — auth form
│   │   └── actions.ts            # setup(), login(), logout()
│   ├── studio/
│   │   ├── page.tsx              # Checks the admin cookie, renders login or panel
│   │   ├── StudioClient.tsx      # Full Studio UI
│   │   └── actions.ts            # adminLogin, getStudioData, adminResetPassword
│   ├── page.tsx                  # Landing page (public route /)
│   ├── layout.tsx                # Root layout — fonts, globals
│   └── globals.css               # Design system, tokens, keyframes
│
├── components/
│   ├── landing/LandingPage.tsx
│   ├── layout/Sidebar.tsx
│   ├── layout/UserMenu.tsx
│   ├── transactions/
│   │   ├── TransactionForm.tsx
│   │   ├── EditTransactionModal.tsx
│   │   └── TransactionList.tsx
│   ├── dashboard/
│   │   ├── DRE.tsx               # Cascading P&L with intermediate margins
│   │   ├── KPICards.tsx          # 4 cards: Balance, Income, Expenses, Saved
│   │   ├── InsightBanner.tsx     # Lyfx Insight — rule-generated contextual tip
│   │   ├── GoalsMiniWidget.tsx   # Active goal progress bars
│   │   └── MonthlyTrendChart.tsx # Chart of the last 6 months' spending
│   ├── budget/BudgetView.tsx
│   ├── education/EducationView.tsx
│   ├── fixed-expenses/FixedExpensesView.tsx
│   ├── goals/GoalsView.tsx       # + contextual liability alert
│   ├── health/HealthView.tsx     # SVG gauge + 4 dimensions + profile
│   ├── liabilities/
│   │   └── LiabilitiesView.tsx  # CRUD + Recovery Mode (avalanche)
│   ├── institutions/
│   │   └── InstitutionsView.tsx # Institution and linked account CRUD
│   ├── alerts/
│   │   └── AlertsView.tsx       # Alerts center grouped by severity
│   ├── assets/
│   │   └── AssetsView.tsx       # Asset CRUD with expandable expenses/taxes
│   ├── reimbursements/
│   │   └── ReimbursementsView.tsx  # reimbursable expense tracking
│   ├── projections/ProjectionsView.tsx
│   ├── reports/ReportsView.tsx
│   ├── tags/
│   │   ├── TagPicker.tsx
│   │   └── TagsManager.tsx
│   ├── profile/ProfileForm.tsx
│   └── ui/
│       ├── MonthPicker.tsx       # Custom month selector (replaces input[type=month])
│       └── CountrySelect.tsx     # Typeable combobox with ~195 countries in Portuguese
│
│   (dashboard extras)
│       └── AssetsMiniWidget.tsx  # Assets widget for the dashboard
│
├── lib/
│   ├── db.ts                     # Prisma singleton with the SQLite adapter
│   ├── session.ts                # getSessionUserId, setSession, clearSession
│   ├── types.ts                  # Domain TypeScript interfaces
│   ├── categories.ts             # Definition of the 9 categories with labels and examples
│   ├── tag-icons.ts              # TAG_ICONS map + TAG_COLORS palette
│   ├── utils.ts                  # cn() for className merging
│   ├── health.ts                 # computeHealthScore() — pure calculation, no DB
│   ├── liabilities.ts            # monthsToPayoff() — pure amortization utility
│   ├── institutions.ts           # Institution types and constants (outside "use server")
│   └── generated/prisma/         # Prisma-generated client (do not edit)
│
├── prisma/
│   ├── schema.prisma             # Source of truth for the database
│   └── prisma.config.ts          # Prisma v7 configuration
│
├── proxy.ts                      # Route protection (Edge Runtime)
├── .env                          # DATABASE_URL + ADMIN_SECRET
├── dev.db                        # SQLite database (do not version)
└── .claude/
    ├── CLAUDE.md                 # Global instructions for Claude Code
    ├── AGENTS.md                 # Agent guidelines (@AGENTS.md referenced by CLAUDE.md)
    └── agents/
        └── agent-smith.md        # Specialist QA agent (Agent Smith v8.0)
```

> **Note (v1.14.1+):** the database layer moved from SQLite to PostgreSQL and `app/studio/actions.ts` was split into 7 responsibility modules with a compatibility barrel. This file tree snapshot reflects the codebase at the time this section was last updated; see section 2 and the changes recorded in `VERSIONING.md` for the current architecture.

### 9.1 File Descriptions

#### `app/`

| File | What it does |
|---|---|
| `page.tsx` | Public route `/`. Redirects to `/dashboard` if there's an active session; otherwise renders `LandingPage`. |
| `layout.tsx` | Root layout. Loads the Playfair Display and Inter fonts via `next/font/google`, injects CSS variables, and imports `globals.css`. |
| `globals.css` | Full design system: color tokens (`--color-cyan`, `--color-bg2`, etc.), typography, animation keyframes (marquee, pulse, shake), and Tailwind v4 utilities via `@theme inline {}`. |
| `proxy.ts` | Route protection on the Edge Runtime (replacement for `middleware.ts`, deprecated in Next.js 16). Verifies the `lyfx_session` cookie and redirects protected routes to `/login`; redirects `/` and `/login` to `/dashboard` when there's a session. |

#### `app/(app)/`

| File | What it does |
|---|---|
| `layout.tsx` | `AppLayout` — Server Component that validates the session on every request: reads the cookie, looks up the user in the database, redirects to `/api/clear-session` if the user no longer exists. Injects the `Sidebar` (navigation) and the `UserMenu` (floating profile/logout). |
| `dashboard/page.tsx` | Fetches dashboard data via `getDashboardData()` and renders `DashboardView`. |
| `transactions/page.tsx` | Fetches the month's transactions and tags and renders `TransactionList` + `TransactionForm`. |
| `budget/page.tsx` | Fetches budgets, settings, and the month's transactions; renders `BudgetView`. |
| `fixed-expenses/page.tsx` | Fetches recurring transactions and renders `FixedExpensesView`. |
| `goals/page.tsx` | Fetches goals, payments, and active liabilities; renders `GoalsView`. |
| `projections/page.tsx` | Fetches recurrence and installment projections; renders `ProjectionsView`. |
| `reports/page.tsx` | Renders `ReportsView` (period selection + exportable P&L). |
| `tags/page.tsx` | Fetches every tag of the user and renders `TagsManager`. |
| `health/page.tsx` | Fetches financial health data and renders `HealthView`. |
| `liabilities/page.tsx` | Fetches liabilities and institutions; renders `LiabilitiesView` with an institution-link dropdown. |
| `reimbursements/page.tsx` | Fetches reimbursable expenses and renders `ReimbursementsView`. |
| `profile/page.tsx` | Fetches the user's profile and renders `ProfileForm`. |
| `institutions/page.tsx` | Fetches institutions and liabilities in parallel; renders `InstitutionsView`. |
| `alerts/page.tsx` | Fetches computed alerts and renders `AlertsView`. |
| `assets/page.tsx` | Fetches every asset of the user (with expenses included) and renders `AssetsView`. |

#### `app/actions/`

| File | What it does |
|---|---|
| `dashboard.ts` | `getDashboardData()` — a single `Promise.all` fetching the P&L, recent transactions, active goals, 6-month trend, and tags. Includes `getDRESummary()`, which groups transactions by category and computes the 4 margins (afterFixed, afterVariable, afterCommitted, net). |
| `transactions.ts` | Full transaction CRUD: `getTransactions`, `createTransaction`, `createInstallments`, `updateTransaction`, `updateFutureInstallments`, `deleteTransaction`, `deleteInstallmentGroup`, `markReimbursed`, `unmarkReimbursed`, `getReimbursables`. |
| `tags.ts` | `getTags`, `createTag`, `updateTag`, `deleteTag` — upsert with the composite key `[userId, name]`. |
| `budgets.ts` | `getBudgets`, `setBudget` (upsert by `[userId, category]`), `deleteBudget`. |
| `goals.ts` | `getGoals`, `createGoal` (generates automatic GoalPayments), `deleteGoal`, `markPayment`, `getMonthlyBalance` (average surplus of the last 3 months for feasibility calculation). |
| `projections.ts` | `getProjections()` — reads monthly/yearly recurrences and future installments; distributes each item in the correct month for the next 12 months. |
| `reports.ts` | `getReportsData(month, year)` — fetches the period's transactions and builds a P&L structure for export/display. |
| `health.ts` | `getHealthData(month, year)` — combines `getDRESummary` with a `debit_longterm` aggregate (reserve proxy) and the average expenses of the last 3 months; returns data for `computeHealthScore`. |
| `liabilities.ts` | `getLiabilities`, `createLiability`, `updateLiability`, `deleteLiability`, `markPaidOff`. A liability can be linked to an institution via `institutionId`. |
| `settings.ts` | `getSettings()` with a get-or-create default by `userId`; `updateExpectedIncome(amount)`. |
| `user.ts` | `getProfile()`, `updateProfile()` (name, email, age, gender, 5 address fields, base64 avatar), `changePassword()` (verifies the current password with bcrypt before updating). |
| `institutions.ts` | `getInstitutions`, `getAccountsForSelect`, `createInstitution`, `updateInstitution`, `deleteInstitution` (manual cascade + FK cleanup), `createAccount`, `updateAccount`, `deleteAccount`. |
| `alerts.ts` | `getAlerts()` — computes 4 alert types on-the-fly: blown budget, overdue/pending goal payments, negative projection over the next 12 months, and imminent seasonal expenses. |
| `assets.ts` | `getAssets`, `getAssetsSummary` (for the dashboard widget), `createAsset`, `updateAsset`, `deleteAsset`. For expenses: `createAssetExpense` (checks asset ownership), `updateAssetExpense`, `toggleExpensePaid`, `deleteAssetExpense`. `parseBR()` parsing normalizes values in local number format (`"1.234,56"` → `1234.56`). |

#### `app/login/`

| File | What it does |
|---|---|
| `page.tsx` | Server Component: checks whether a user already exists in the database (`hasUser`) to decide the form's initial mode; injects the current month in Portuguese. |
| `LoginForm.tsx` | Client Component with the full authentication UI: login/setup mode, mode toggle, shake animation, social login toast, "Forgot password" modal, `← Início` button, and a discreet "Access Studio" link. |
| `actions.ts` | `setup()` (creates the first user + starts a session), `login()` (validates credentials + starts a session), `logout()` (clears the cookie + redirects to `/`). |

#### `app/studio/`

| File | What it does |
|---|---|
| `page.tsx` | Server Component: checks the `lyfx_admin` cookie; renders `StudioLoginForm` or the full `StudioClient` panel passing the fetched data. |
| `StudioClient.tsx` | Client Component with the full Studio UI: 8 tabs (Panel, Users, Plans, Modules, Notes, Data, Schema, Documentation), login form, user management with inline confirmation, per-module beta toggle, Markdown editor with toolbar + slash commands, metrics dashboard, collapsible ERD with table descriptions. |
| `actions.ts` | `adminLogin`, `adminLogout` (clears both cookies + redirects), `getStudioData` (includes dev/prod versions), `getStudioDataForUser`, `adminResetPassword`, `adminCreateUser`, `adminDeleteUser` (manual cascade), `getDocumentation`, `getLiveSchema`, `getAppConfig`, `setAppConfig`, `saveAdminNotes`, `ensureInsiderPlan`. |

#### `app/api/`

| File | What it does |
|---|---|
| `clear-session/route.ts` | GET Route Handler — deletes the `lyfx_session` cookie and redirects to `/login`. Used as an escape hatch when the cookie's `userId` no longer exists in the database, avoiding an infinite loop in `AppLayout`. |

#### `components/landing/`

| File | What it does |
|---|---|
| `LandingPage.tsx` | Public marketing page: sticky navbar with anchors + language selector, hero with `DashboardMockup`, marquee, 6 feature cards with mini-mockups, "How it works" section in 4 steps, FAQ accordion with 7 items, final CTA, and footer. Internationalized in PT/EN/ES with automatic detection via `navigator.language` and `localStorage` persistence. |
| `translations.ts` | Every landing page string organized by language (`pt`, `en`, `es`). `Translations` interface with explicit typing; `T: Record<Lang, Translations>` object. Includes regionalized financial terminology and locale-formatted mockup values. |

#### `components/layout/`

| File | What it does |
|---|---|
| `Sidebar.tsx` | Navigation sidebar: links to every protected route with Tabler icons, active-route highlight via `usePathname`. Collapses/expands via state (click on the logo). No profile or logout — those moved to the `UserMenu`. |
| `UserMenu.tsx` | Fixed floating menu in the top-right corner: pill with avatar + first name + chevron. Dropdown with full name, "Edit profile" link, and a "Sign out" button (logout with `useTransition`). Closes on outside click via `useRef`. |

#### `components/dashboard/`

| File | What it does |
|---|---|
| `DRE.tsx` | Cascading P&L: groups transactions by category, computes and shows the 3 intermediate margins (after fixed, operating, after committed) with inline colored badges. |
| `KPICards.tsx` | 4 cards at the top of the dashboard: Balance (green/red), Income, Expenses, Saved (`debit_longterm`). |
| `InsightBanner.tsx` | Generates and shows the "Lyfx Insight" contextual tip based on 5 priority rules over the month's financial state. |
| `GoalsMiniWidget.tsx` | Side widget with a progress bar for each active goal (up to 4), showing `currentAmount / targetAmount`. |
| `MonthlyTrendChart.tsx` | Bar chart of the last 6 months: income, expense, and result. Current month highlighted in cyan. Interactive tooltip. |

#### `components/ui/`

| File | What it does |
|---|---|
| `MonthPicker.tsx` | Custom month selector (replaces `<input type="month">`): trigger button showing "January 2026", dropdown with year navigation and a 4×3 grid of abbreviated months, selected month in cyan, X to clear. Props: `value` ("YYYY-MM"), `onChange`, `placeholder`, `height`, `fontSize`. |
| `CountrySelect.tsx` | Typeable country combobox: text field with real-time filtering over a list of ~195 countries in Portuguese (Portuguese-speaking countries at the top), chevron to open/close, X to clear, accepts free text. |

#### `components/transactions/`

| File | What it does |
|---|---|
| `TransactionForm.tsx` | Transaction creation form with two modes: "One-off" (single or recurring) and "Installments" (N monthly installments). Includes an inline `TagPicker`, reimbursable toggle, context selection (personal/professional), and account selector (visible when accounts are registered). |
| `TransactionList.tsx` | Transaction list with an animated `ActionBar` on click (slide-down): edit, delete individual, and delete installment group buttons. |
| `EditTransactionModal.tsx` | Edit modal with 3 automatic modes: `single` (edits only the record), `installment` (edits future installments in the group), `recurring` (edits the record with a projection-impact warning). |

#### `components/tags/`

| File | What it does |
|---|---|
| `TagPicker.tsx` | Inline tag selector with quick creation (name + color + icon). Used inside `TransactionForm`. |
| `TagsManager.tsx` | Full management page: tag list with inline name, color, and icon editing; deletion with automatic cascade. |

#### `components/` (other views)

| File | What it does |
|---|---|
| `budget/BudgetView.tsx` | Editable expected income, month navigation, category allocations with progress bar and % of income, planned vs. actual balance. |
| `fixed-expenses/FixedExpensesView.tsx` | Summary cards (monthly/yearly/12 months), monthly and yearly fixed lists, horizontal projection bar chart, and the `ProvisaoSazonal` section. |
| `goals/GoalsView.tsx` | Goal CRUD, monthly payments with payment marking, real-time feasibility calculation, high-interest liability alert banner. |
| `health/HealthView.tsx` | Animated SVG gauge, 4 `DimensionCard`s with score and progress bar, profile badge (Recovering → Free), tip banner for the weakest dimension. |
| `liabilities/LiabilitiesView.tsx` | Liability CRUD, per-debt payoff forecast, avalanche recovery mode with an extra payment calculator. |
| `projections/ProjectionsView.tsx` | Summary cards (accumulated free balance, average, months in the red), 12 clickable-bar chart, monthly detail panel. |
| `reports/ReportsView.tsx` | Period selection (month/year), detailed P&L per category with values and percentages of income. |
| `reimbursements/ReimbursementsView.tsx` | Summary cards (to receive / received), pending and reimbursed expense lists with marking/unmarking. |
| `profile/ProfileForm.tsx` | Avatar upload with client-side resize via Canvas, profile fields (name, email, age, gender), structured address in 5 fields with ViaCEP auto-fill (magnifying glass + Enter) and `CountrySelect`, password change form with current-password verification. |
| `institutions/InstitutionsView.tsx` | Full institution and account CRUD: `InstitutionModal` (create/edit), `AccountForm` (inline form), `InstitutionCard` (expandable with account and linked-liability lists), `AccountRow` (row with edit/delete), summary cards, and an empty state. |
| `alerts/AlertsView.tsx` | Shows alerts grouped by severity (danger → warning → info): `AlertCard` with icon, type badge, title, description, and link; count chips per type; "All clear!" empty state. |
| `assets/AssetsView.tsx` | Asset CRUD: `AssetModal` (create/edit with fields per type), `ExpenseForm` (inline per asset), `ExpenseRow` (paid/pending toggle, overdue alert), `AssetCard` (expandable with expenses, value variation, totals), global summary cards. |
| `dashboard/AssetsMiniWidget.tsx` | Dashboard widget: shows assets, total estimated value, and annual cost; red badge if there are pending expenses; link to `/assets`; hidden if there are no assets. |

#### `lib/`

| File | What it does |
|---|---|
| `db.ts` | `PrismaClient` singleton with `PrismaBetterSqlite3` as the adapter. Reads `DATABASE_URL` from the environment (fallback: `file:./dev.db`). Each environment points to its own database via `.env` (gitignored). |
| `session.ts` | `getSessionUserId()` reads the `lyfx_session` cookie; `setSession(userId)` writes the httpOnly cookie; `clearSession()` deletes the cookie; `requireAuth()` returns the `userId` or throws if unauthenticated. |
| `types.ts` | Domain TypeScript interfaces: `Transaction`, `Tag`, `Goal`, `GoalPayment`, `Liability`, `DRESummary` (with `margins` and `saved`), category, recurrence, and context types. |
| `categories.ts` | `CATEGORIES` array with the 9 categories (2 credit + 7 debit), each with `value`, `label`, `group`, `groupLabel`, and `examples`. Source of truth for dropdowns and groupings. |
| `tag-icons.ts` | `TAG_ICONS` object mapping 12 keys to Tabler Icons components; `TAG_COLORS` array with 8 predefined hex colors. |
| `utils.ts` | `cn(...inputs)` function — combines `clsx` and `tailwind-merge` for safe Tailwind class merging. |
| `health.ts` | Pure function `computeHealthScore(data)` — computes the 0–100 score and financial profile from the P&L, reserve, and averages. No database access. |
| `liabilities.ts` | Pure function `monthsToPayoff(balance, monthlyRate, payment)` — computes months to pay off a debt via the amortization formula. Separated from the `"use server"` file due to a Turbopack limitation. |
| `institutions.ts` | Institution types and constants (`InstitutionType`, `AccountType`, `INSTITUTION_TYPE_LABELS`, `ACCOUNT_TYPE_LABELS`, `Institution`, `Account`, `AccountForSelect` interfaces) — separated from the `"use server"` file due to a Turbopack limitation. |
| `assets.ts` | Asset types and constants (`AssetType`, `AssetExpenseType`, `ASSET_TYPE_LABELS`, `ASSET_EXPENSE_TYPE_LABELS`, `EXPENSE_SUGGESTIONS`, `Asset`, `AssetExpense` interfaces) — separated from the `"use server"` file due to a Turbopack limitation. |
| `modules.ts` | `ALL_MODULES` array with the system's 17 modules — each entry has `key`, `label`, `summary` (short description), and `isBeta?: boolean`. `ALL_MODULE_KEYS` is the keys-only array. Source of truth for plan seeds and for the Sidebar's "Beta" chip. |
| `config.ts` | `getConfigValue(key, fallback)` and `getConfigBool(key, fallback)` helpers — read `AppConfig` via Prisma with no admin authentication required. Used in Server Components (`AppLayout`, `layout.tsx`) to read `maintenanceMode` and `betaModules` on every request. |

#### `prisma/`

| File | What it does |
|---|---|
| `schema.prisma` | Source of truth for the database: defines every model (User, Transaction, Tag, TransactionTag, Budget, Goal, GoalPayment, Settings, Liability, Institution, Account, Asset, AssetExpense, Plan, PlanModule, AppConfig) with fields, types, defaults, composite unique constraints, and relations. |

#### `.claude/`

**Claude Code** (AI CLI) configuration directory. Versioned in the repository so the assistant's context is shared across sessions and collaborators.

| File | What it does |
|---|---|
| `CLAUDE.md` | Claude Code's entry point. References `@AGENTS.md` with `@`. |
| `AGENTS.md` | Global project directives for Claude Code: stack, conventions, Next.js breaking-change warnings. |
| `agents/agent-smith.md` | **Agent Smith v8.0** — specialist QA agent. Surgical persona grounded in 19 technical works (Myers, Beck, Feathers, Fowler, Nygard, WAHH, and others). Invoked with `@agent-smith` or natural language. Tools: `Read`, `Grep`, `Glob`, `Bash` (read/analysis only — no file editing). Model: `sonnet`. |

**How to invoke Agent Smith:**
```
@agent-smith review the PillReader component before committing
```
or
```
Use Agent Smith to audit the completePill action
```

---

## 10. Architectural Decisions

### Server Actions instead of API Routes

**Decision**: every mutation (creating a transaction, creating a goal, etc.) uses Server Actions (`"use server"`) called directly from Client Components.

**Reason**: eliminates the REST API layer, reduces boilerplate, keeps end-to-end type safety. Next.js serializes the arguments automatically. For Lyfx, which has no external clients consuming an API, there's no advantage in exposing REST endpoints.

### Simple cookie instead of JWT or iron-session

**Decision**: session stored as `userId` directly in the cookie, with no additional encryption.

**Reason**: a personal local app, with no requirement for a distributed stateless session. The cookie is httpOnly (inaccessible via XSS) and AppLayout validates the userId against the database on every request. Iron-session or JWT would add complexity with no real benefit in this context.

### Base64 avatar in the database

**Decision**: avatar stored as a base64 string in the `User.avatar` field.

**Reason**: eliminates a dependency on storage buckets (S3, Cloudinary). Acceptable for 200×200px images (~30KB after 85% JPEG compression). The resize happens client-side via the Canvas API before upload.

### Full data isolation by `userId`

**Decision**: every data table (Transaction, Tag, Budget, Goal, Liability, Settings) has a `userId` field. Every query in every Server Action filters by `userId` obtained via `requireAuth()`.

**Implementation**:
- `requireAuth()` in `lib/session.ts` — reads the session cookie, throws if absent, returns `userId`
- Every `app/actions/*.ts` calls `requireAuth()` as the first operation
- Composite unique constraints: `@@unique([userId, name])` on Tag, `@@unique([userId, category])` on Budget
- Backfill: when adding `userId @default("")`, every existing record received the sole user's id via a script
- GoalPayment has no direct `userId` — `markPayment()` verifies ownership via `{ id, goal: { userId } }` before any modification
- Every deletion operation uses `deleteMany({ where: { id, userId } })` — Prisma's singular `delete()` ignores non-PK fields in the `where`, making `userId` ineffective as a guard

**Result**: multiple users can use the same database with full isolation. User creation and management via the Studio.

### Proxy instead of Middleware

**Decision**: a `proxy.ts` file with a `proxy()` export instead of `middleware.ts`.

**Reason**: the `middleware.ts` convention was deprecated in Next.js 16. The correct convention is `proxy.ts` with a named `proxy` export.

### Prisma v7 with an explicit adapter

**Decision**: `PrismaBetterSqlite3` instantiated in `lib/db.ts` and passed via `{ adapter }` to `PrismaClient`.

**Reason**: Prisma v7 removed native inline SQLite support in the datasource. The new model requires an explicit adapter. This also enables a future switch to PostgreSQL with no change to query code — only the adapter instantiation changes.

> **Note (v1.14.1+):** this decision was later superseded — the project migrated to PostgreSQL with `@prisma/adapter-pg`, exactly along the path this section anticipated. See section 2 for the current adapter.

### Per-environment database isolation

**Decision**: each environment keeps its own `.env` file (gitignored) with `DATABASE_URL` pointing to an exclusive SQLite database:

| Environment | Database |
|---|---|
| `develop` (port 3000) | `lyfx/dev.db` — test data, freely resettable |
| `master` (port 4000) | `lyfx-production/prod.db` — real user data |

**Reason**: a database shared between dev and production created a risk of data corruption (schema migrations in `develop` would immediately affect production). Isolation via a gitignored `.env` is automatic — merges never touch either environment's configuration file, preserving each one's database pointer indefinitely.

> **Note (v1.14.1+):** the branch model itself later moved to GitHub Flow (single `main` branch); the database isolation principle carries over unchanged to the current `lyfx_dev` / `lyfx_prod` PostgreSQL databases (see section 2).

---

## 10.1 Technical Formulas and Calculations

Reference for every formula computed in memory (with no persisted result, or with the result persisted after calculation). Important for auditing and fixing calculation bugs without sweeping through the code.

### Financial Health Score (`lib/health.ts` → `computeHealthScore`)

```typescript
// Input data:
//   dre: DRESummary (current month)
//   avgExpenses3m: average expenses of the last 3 months
//   reserveAmount: settings.reserveBalance > 0 ? settings.reserveBalance : accumulated_debit_longterm

// Commitment dimension (0–30 pts)
committedRatio = dre.debits.committed / dre.credits.total  // e.g. 0.40 = 40%
committedScore = committedRatio <= 0.30 ? 30 : Math.max(0, 30 - (committedRatio - 0.30) * 100)

// Savings dimension (0–25 pts)
savingsRatio = dre.saved / dre.credits.total  // saved = debit_longterm
savingsScore = savingsRatio >= 0.20 ? 25 : (savingsRatio / 0.20) * 25

// Result dimension (0–25 pts)
netBalance = dre.margins.net  // income - all expenses
resultScore = netBalance <= 0 ? 0 : Math.min(25, (netBalance / dre.credits.total) * 100)

// Reserve dimension (0–20 pts)
reserveMonths = avgExpenses3m > 0 ? reserveAmount / avgExpenses3m : 0
reserveScore = reserveMonths >= 6 ? 20 : (reserveMonths / 6) * 20

// Final score
totalScore = committedScore + savingsScore + resultScore + reserveScore  // 0–100

// Profiles
// 0–39  → "Recovering"   (red)
// 40–59 → "Stabilized"   (amber)
// 60–79 → "Building"     (cyan)
// 80–100→ "Free"         (green)
```

### Cascading P&L (`app/actions/transactions.ts` → `getDRESummary`)

```typescript
// Grouping by category type:
credits.fixed    = Σ(tx.amount WHERE type="credit" AND category="credit_fixed")
credits.variable = Σ(tx.amount WHERE type="credit" AND category="credit_variable")
credits.total    = credits.fixed + credits.variable

debits.fixed       = Σ(tx.amount WHERE category="debit_fixed")
debits.variable    = Σ(tx.amount WHERE category="debit_variable")
debits.committed   = Σ(tx.amount WHERE category="debit_committed")
debits.longterm    = Σ(tx.amount WHERE category="debit_longterm")
debits.seasonal    = Σ(tx.amount WHERE category="debit_seasonal")
debits.unexpected  = Σ(tx.amount WHERE category="debit_unexpected")
debits.intentional = Σ(tx.amount WHERE category="debit_intentional")
debits.total       = sum of every debit

// Margins
margins.afterFixed     = credits.total - debits.fixed
margins.afterVariable  = margins.afterFixed - debits.variable
margins.afterCommitted = margins.afterVariable - debits.committed
margins.net            = credits.total - debits.total

// Derived field
saved = debits.longterm  // shortcut for the "Saved" KPI on the dashboard
```

### Projections (`app/actions/projections.ts` → `getProjections`)

```typescript
// For each month M of the next 12:
//   1. Filter monthly recurring transactions where:
//      - recurrence = "monthly"
//      - date.getDate() any (the day doesn't change)
//      - recurrenceEndsAt is null OR recurrenceEndsAt >= start of month M
//   2. Filter yearly recurring transactions where:
//      - recurrence = "yearly"
//      - date.getMonth() === M.getMonth()  // same month of the year
//   3. Filter installments where:
//      - installmentGroupId is not null
//      - date falls within month M
//      - date >= today (past installments ignored)

// Projected balance for M:
projectedBalance[M] = Σ(income for M) - Σ(expenses for M)
// income = type="credit", expense = type="debit"
```

### Goals — payment distribution (`app/actions/goals.ts` → `createGoal`)

```typescript
// Guarantees the exact sum equals targetAmount:
months = months between today and the deadline (inclusive)
baseAmount = Math.floor((targetAmount / months) * 100) / 100  // rounded down to cents
lastAmount = targetAmount - baseAmount * (months - 1)          // absorbs the residual

// GoalPayment generated for each month:
for (let i = 0; i < months; i++) {
  dueDate = new Date(today.getFullYear(), today.getMonth() + i, 1)
  amount = i === months - 1 ? lastAmount : baseAmount
  // creates a GoalPayment with goalId, dueDate, amount, paid=false
}
```

### Liability amortization (`lib/liabilities.ts` → `monthsToPayoff`)

```typescript
function monthsToPayoff(balance: number, monthlyRate: number, payment: number): number {
  if (payment <= balance * monthlyRate) return Infinity  // payment doesn't cover interest
  // Amortization formula:
  return Math.ceil(
    -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
  )
}
// monthlyRate: rate as a decimal — e.g. 5%/month → 0.05
// "Never paid off" alert: payment <= balance * monthlyRate

// Equivalent annual rate (for the critical liability alert display):
annualRate = Math.pow(1 + monthlyRate, 12) - 1
// e.g. 12%/month → (1.12)^12 - 1 ≈ 2.86 = 286%/year
```

### Seasonal Provisioning (`components/fixed-expenses/FixedExpensesView.tsx` → `ProvisaoSazonal`)

```typescript
// For each yearly expense:
today = new Date()
nextOccurrence = new Date(expense.date.getFullYear(), expense.date.getMonth(), expense.date.getDate())
if (nextOccurrence <= today) nextOccurrence.setFullYear(today.getFullYear() + 1)

monthsRemaining = differenceInMonths(nextOccurrence, today) || 1  // minimum 1 month
monthlyProvision = expense.amount / monthsRemaining

// Urgency:
urgency = monthsRemaining <= 2 ? "danger" : monthsRemaining <= 4 ? "warning" : "ok"
```

---

## 10.2 Known Technical Gotchas

This section documents real problems found during development, with root cause and the definitive fix. Consult it before investigating similar issues.

### Prisma v7 — mandatory adapter for SQLite

**Symptom**: `db.anyModel.findMany()` fails with `Cannot read properties of undefined`.

**Cause**: Prisma v7 removed native SQLite support in the datasource. The client needs to be instantiated with `{ adapter: new PrismaBetterSqlite3(new BetterSqlite3(dbUrl)) }`.

**Location**: `lib/db.ts`. Singleton instantiation via `const globalForPrisma = global as any; globalForPrisma.prisma ??= new PrismaClient({ adapter })`.

**After `db push`**: always run `npx prisma generate` — the client doesn't recognize new models until regenerated. The production worktree has a separate client and needs an independent `generate`.

> **Note (v1.14.1+):** superseded by the PostgreSQL migration with `@prisma/adapter-pg` (see section 2) — the underlying "adapter is mandatory in Prisma v7" lesson still applies, just with a different adapter class.

### Turbopack — module cache with `"use server"`

**Symptom**: a new model added to the schema is recognized by Prisma in queries, but the client component doesn't see it / `db.newModel` is undefined on the server.

**Cause**: Turbopack keeps a compiled cache of the client bundle. `"use server"` modules are compiled separately and may have the client generated before `prisma generate`.

**Solution**: stop the server, run `npx prisma generate`, restart. If it persists, delete `.next/` and restart.

**Special case `PillProgress`**: the model added in v1.5.0 showed this problem. The `lib/db-pills.ts` workaround was removed in v1.11.0 — PostgreSQL doesn't have the Turbopack cache problem.

### `NEXT_PUBLIC_*` vars not reloaded at runtime

**Symptom**: the variable exists in `.env` but remains `undefined` in code even after adding it.

**Cause**: `NEXT_PUBLIC_*` vars are embedded at build/start time — they aren't read at runtime. Adding to `.env` has no effect without restarting the server (`npm run dev`).

**Affects**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — added to the production `.env` but requiring a restart to take effect.

### Google Maps — `overview_polyline.points` vs. `overview_path`

**Symptom**: PDF generated with no route map, even with the API key configured.

**Cause**: confusion between the two Directions API response fields:
- `routes[0].overview_polyline` → object with `.points` (encoded polyline string) ✅ correct
- `routes[0].overview_path` → array of `LatLng` ❌ doesn't exist in the REST API; exists in the client-side JS SDK

**Where the fix is**: `fetchDefaultPolyline` in `app/actions/km-reimbursement.ts` uses `data.routes[0].overview_polyline.points`.

### `deleteMany` vs. `delete` for deletion with userId

**Symptom**: deletion via `db.model.delete({ where: { id, userId } })` isn't correctly protecting against IDOR.

**Cause**: Prisma's `delete()` only accepts fields that are part of the PK in the `where`. For models with PK = `id`, the `userId` in the `where` is **silently ignored**. Any user who knows the `id` can delete another user's record.

**Solution**: use `deleteMany({ where: { id, userId } })` — `deleteMany` accepts any field in the `where` and returns `{ count: 0 }` if the record doesn't belong to the user (no error, but no deletion either).

**v1.3.1 audit**: every Server Action was reviewed to use `deleteMany` with `userId`.

### bodySizeLimit in Server Actions

**Symptom**: uploading a large PDF or avatar returns `413 Payload Too Large`.

**Cause**: Next.js has a default 1MB limit on Server Actions (POST body).

**Solution**: in `next.config.ts`:
```typescript
experimental: {
  serverActions: {
    bodySizeLimit: "5mb"
  }
}
```
Needed for PDFs with multiple base64-embedded map images.

### Cookie path in the Studio logout

**Symptom**: Studio logout doesn't remove the `lyfx_admin` cookie; the cookie persists after logout.

**Cause**: when creating the cookie with `path: "/studio"`, deletion must also specify `path: "/studio"`. Deleting with no `path` makes the browser look for the cookie at `path: "/"` (which doesn't exist) and finds nothing to delete.

**Where it is**: `app/studio/actions.ts` → `adminLogout()` specifies `path: "/studio"` when deleting `lyfx_admin` and `path: "/"` when deleting `lyfx_session`.

### Docker + `output: "standalone"` — Prisma client not automatically included

**Symptom**: the container starts but every query fails with `Cannot find module '.prisma/client'`.

**Cause**: Next.js standalone's automatic tracing (`outputFileTracingIncludes`) doesn't include the files generated by `npx prisma generate` in `node_modules/.prisma/client`. Standalone only captures static imports — the Prisma client is loaded dynamically at runtime.

**Solution**: in the `Dockerfile`, after copying `.next/standalone`, explicitly copy the generated directory. **Watch the path:** in Prisma v7, the client is generated at `lib/generated/prisma` (not `node_modules/.prisma` as in previous versions):
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated/prisma ./lib/generated/prisma
```

**Where it is**: `Dockerfile` (runner stage, lines after `COPY .next/static`).

### PostgreSQL 18 Docker — the volume must be mounted at `/var/lib/postgresql`

**Symptom**: the `postgres:18-alpine` container starts but loops with the error: *"there appears to be PostgreSQL data in /var/lib/postgresql/data (unused mount/volume)"*.

**Cause**: starting with PostgreSQL 18, the official Docker image changed the expected mount directory. Earlier versions used `/var/lib/postgresql/data`; from 18 onward, the mount must be at the parent directory `/var/lib/postgresql` — the database automatically creates a versioned subdirectory.

**Solution**: in the compose files, use:
```yaml
volumes:
  - lyfx_dev_data:/var/lib/postgresql   # correct for PG18+
  # do NOT use: lyfx_dev_data:/var/lib/postgresql/data
```

**Where it is**: `docker-compose.yml` and `docker-compose.dev.yml`.

### Docker Compose v5 — `env_file` doesn't strip quotes from values

**Symptom**: variables from `.env` reach the container with literal quotes: `DATABASE_URL` becomes `"postgresql://..."` (with quotes), breaking the Prisma connection. `POSTGRES_PASSWORD` arrives as `"password"` and PostgreSQL rejects it.

**Cause**: Docker Compose v5 (and `docker run --env-file`) doesn't strip double quotes from `.env` values. If the file has `VAR="value"`, the container receives `VAR` with the value `"value"` — quotes included as part of the string.

**Solution**: use `--env-file` in the `docker compose` command for `${VAR}` interpolation (the Compose parser strips quotes), instead of `env_file:` in the service definition for critical variables:
```yaml
# compose file: uses ${} interpolation — quotes stripped by Compose
environment:
  DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db-dev:5432/lyfx_dev
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

# command: passes .env to Compose to resolve the variables
# npm run docker:dev → docker compose --env-file .env -f docker-compose.dev.yml up
```

**Where it is**: every `docker:*` script in `package.json` uses `--env-file .env`.

### Docker — `localhost` doesn't resolve the host's PostgreSQL

**Symptom**: the container starts but fails to connect to the database: `ECONNREFUSED 127.0.0.1:5432`.

**Cause**: inside the container, `localhost` is the container's own loopback — not the host. PostgreSQL runs on the host, not the container.

**Solution**: replace `localhost` with `host.docker.internal` in `DATABASE_URL` when using Docker:
```
DATABASE_URL="postgresql://postgres:password@host.docker.internal:5432/lyfx_prod"
```

On Linux, Docker doesn't have `host.docker.internal` automatically — `docker-compose.yml` adds `extra_hosts: host.docker.internal:host-gateway` to resolve this.

**Template**: `.env.docker.example` at the project root.

### BrasilAPI — in-memory cache doesn't persist across workers

**Symptom** (future, in a serverless/multi-process environment): holidays fetched again on every cold start.

**Cause**: `lib/holidays.ts` uses a `Map` at the Node.js module level. In environments with multiple workers (Vercel, PM2 cluster), each instance has its own memory — the cache isn't shared across processes.

**Current behavior**: acceptable for personal use (single-process). For a future multi-process setup: move the cache to Redis, the database, or `AppConfig`.

**Fallback**: if BrasilAPI is offline, `getHolidays` silently returns an empty `Set` — D+5 computes weekends only with no error thrown.

---

## 11. Next Steps

### Evolution plan — financial consultant analysis (v0.5+)

Based on technical and bibliographic product analysis, the evolutions were prioritized in phases:

| Phase | Delivered | Description |
|---|---|---|
| **Phase 1** | ✅ v0.5.0 | P&L with intermediate margins + redesigned Dashboard (KPI cards, Insight, Goals mini, trend chart) |
| **Phase 2** | ✅ v0.6.0 | Installment integrity: `installmentGroupId`, `installmentNumber`, `installmentTotal` on Transaction. Projections loop for installments. `TransactionForm` with installment mode. `TransactionList` with an animated ActionBar. `EditTransactionModal` in 3 modes (single/installment/recurring). Standardized padding (`p-8`) on every page. |
| **Phase 3** | ✅ v0.7.0 | Full Budget: `Settings` model with `expectedMonthlyIncome`, `getSettings`/`updateExpectedIncome` action, redesigned BudgetView with 4 sections (expected income, monthly nav, category allocations with % of income, planned vs. actual balance). |
| **Phase 4** | ✅ v0.8.0 | Financial health score: 4 dimensions (commitment, savings, result, reserve), 4 colored profiles, SVG gauge, dashboard widget, full `/health` page detail. |
| **Phase 5** | ✅ v0.9.0 | Liabilities (`Liability`): full CRUD, avalanche recovery mode with an extra payment calculator, contextual alert on Goals for debts with a rate ≥ 5%/month. |
| **Phase 6** | ✅ v1.0.0 | Reimbursement tracking (`reimbursedAt`, `/reimbursements` page, form toggle), automatic seasonal provisioning in `/fixed-expenses`, "One-off" mode renamed in the form. OFX/CSV import deferred to a future phase. |
| **Phase 7** | ✅ v1.1.0 | Full multi-user isolation: `userId` on every data table, `requireAuth()` in every Server Action, composite unique constraints on Tag and Budget. Improved Studio: create user, delete with cascade, per-user filter with a typeable combobox, system cards (users/records/DB size). Navigation: Studio access via `/login`, logout always redirects to `/`, back buttons on both login screens. |
| **Phase C** | ✅ v1.2.0 | Institutions (`/institutions`): registry of banks/fintechs/brokerages with linked accounts, per-account balance and limit, liability and transaction linking per account. |
| **Phase D** | ✅ v1.2.0 | Alerts (`/alerts`): proactive center with 4 alert types (budget, goals, negative projection, seasonal), grouped by severity. UI fixes: select arrow via CSS, custom MonthPicker, ProfileForm focus fix, removed number-input spinners. Structured address profile in 5 fields with ViaCEP auto-fill and CountrySelect with ~195 countries. |
| **Phase E** | ✅ v1.3.0 | Assets & Property (`/assets`): registry of real estate, vehicles, and other assets with associated expenses (property tax, vehicle tax, rural land tax, insurance, registration, maintenance), paid/pending toggle, overdue alert, dashboard widget. |
| **Audit** | ✅ v1.3.1 | Full security and bug review: IDOR in `markPayment` fixed, `"income"/"expense"` → `"credit"/"debit"` types in `getMonthlyBalance`, internal `requireAdmin()` in every Studio action, `delete()` → `deleteMany()` in goals/liabilities/institutions/transactions, `parseBR()` parsing for local number format values, `useEffect` replacing `useState` as a side effect, ownership check in `createAssetExpense`. |
| **Phase F** | ✅ v1.4.0 | Critical fixes (financial consultant analysis): (1) `reserveBalance` added to the `Settings` model — the user declares the real reserve fund balance via an inline editor on the Financial Health card; automatic fallback to a proxy (`debit_longterm`) if the field wasn't filled in; (2) Proactive critical liability alert — active `cheque_especial` (overdraft) and `rotativo` (revolving credit) generate a `danger` alert with the monthly rate + computed annual equivalent; new `"liability"` type in `AlertsView`. Pre-existing TypeScript fixes: `reimbursedAt` added to the `Transaction` interface, `AnyTransaction` fixed in `MonthlyCalendar`, `useState<string>` in `TagPicker` and `TagsManager`. |
| **Phase G** | ✅ v1.5.0 | Financial education (`/education`): 85 pedagogical pills organized into 5 financial health profiles (`critical`, `serious`, `unstable`, `stable`, `healthy`), reading with a silent timer, review quiz with visual feedback, 12-week weekly streak, progress persisted in `PillProgress` via direct `better-sqlite3` (workaround for Turbopack's persistent cache). |
| **Studio G2** | ✅ v1.8.0 | Studio Group 2: Panel tab with a metrics dashboard (6 cards: users, records, disk space, plans, dev/prod versions) + global config toggles (maintenance mode + banner text). Modules tab with a real-time per-module beta toggle via `AppConfig`. Notes tab with a Markdown editor, full toolbar, and Notion-like slash commands. Collapsible per-table ERD with descriptions. Full/Insider seeds automatically derived from `isBeta` in `lib/modules.ts`. `AppConfig` model in the database. `lib/config.ts` for auth-free reads. |
| **CS-18/CS-19** | ✅ v1.9.0 | Notification center: `Notification` model with `fingerprint`/`broadcastId`/`expiresAt`, segregation of automatic alerts × system notifications. Bell in the UserMenu with a badge, dropdown with two sections (Financial alerts + Notifications). Studio: Notifications tab for sending by plan/user with broadcast history. AlertsView: separate sections, Clear all, Mark all as read. Maintenance banner as a pill. Automatic welcome notification. Redesigned Studio Panel: 2-column layout (System/Server), SVG gauges for RAM/Heap/CPU, `lastSeenAt` metrics (online now / active today), git branch versioning. `User.lastSeenAt` updated on every navigation. Fixed type guards in GoalsView and TagPicker. |
| **CS-17** | ✅ v1.10.0 | Special Reimbursement (`/km-reimbursement`): full corporate module with 5 models (`KmConfig`, `KmPeriod`, `KmRoute`, `KmReceipt`, `KmExpense`), vehicle fields in `KmConfig`. Flow: new request → routes with draggable Google Maps → fuel receipts → extra expenses → SAP summary → submission with a D+5 business-day Transaction. Saved Places (`/km-reimbursement/places`) with configurable routes stored as JSON (`routeGoing`/`routeReturn`). Server-side PDF (`@react-pdf/renderer`) with embedded maps via the Google Static Maps API, route polyline using `KmPlace` as the source of truth. PDF redesign v2: gray `#F5F6F9` background, SVG dot pattern, dark header with the typographic `Ly`+`fx` logo, mini-header on pages 2+, white per-route cards, summary with `wrap={false}`, "Route Statement" footer. `bodySizeLimit: "5mb"` on Server Actions. |

### CS-23 — Docker containerization ✅ v1.11.1

Docker infrastructure implemented for autonomous deployment:

- **`Dockerfile`** — multi-stage: `deps` (npm ci) → `builder` (prisma generate + next build) → `runner` (minimal standalone, non-root user)
- **`next.config.ts`** — `output: "standalone"` — generates `.next/standalone/server.js` with minimal dependencies
- **`docker-compose.yml`** — production, port 4000, `env_file: .env`, `extra_hosts: host.docker.internal:host-gateway`
- **`docker-compose.dev.yml`** — development, port 3000, bind mount with volumes for `node_modules` and `.next`
- **`.env.docker.example`** — template documenting the `localhost → host.docker.internal` swap
- **npm scripts**: `docker:build`, `docker:up`, `docker:down`, `docker:logs`, `docker:dev`

**Two container groups (v1.11.2):**

| Group | Compose | Containers | Port |
|---|---|---|---|
| Dev | `docker-compose.dev.yml` | `lyfx-db-dev` (PG18) + `lyfx-dev` (Next.js) | 3000 |
| Prod | `docker-compose.yml` | `lyfx-db-prod` (PG18) + `lyfx-migrate` + `lyfx-prod` (Next.js) | 4000 |

**To use:**
```bash
# Dev (lyfx/)
npm run docker:dev

# Prod (lyfx-production/)
npm run docker:up
```

**Prod data migration (first time):**
1. `npm run docker:up` — brings up an empty db-prod + applies the schema via migrate
2. Dump the native database: `pg_dump -U postgres -h localhost lyfx_prod > backup.sql`
3. Restore: `docker exec -i lyfx-db-prod psql -U postgres -d lyfx_prod < backup.sql`

### Suggested next evolutions

- **CS-20** — Studio: Roadmap/Backlog tab
- **CS-21** — OFX/CSV import: reading bank statements for semi-automatic entry
- **CS-22** — Standardized SVG-path logo system for every context
- **Production deploy**: PostgreSQL + own domain → v2.0.0

---

