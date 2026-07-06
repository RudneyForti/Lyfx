# Lyfx — Complete Features Guide
> [Ler em português](./FEATURES.md)
> Reference document for financial analysts, product managers, and training material
> Version 1.14.0 · June 2026

---

## Table of Contents

1. [Product Vision and Philosophy](#1-product-vision-and-philosophy)
2. [Fundamental Financial Concepts](#2-fundamental-financial-concepts)
3. [General Platform Structure](#3-general-platform-structure)
4. [Modules — In-Depth Description](#4-modules--in-depth-description)
   - 4.1 [Landing Page](#41-landing-page)
   - 4.2 [Authentication](#42-authentication)
   - 4.3 [Dashboard](#43-dashboard)
   - 4.4 [Transactions](#44-transactions)
   - 4.5 [Budget](#45-budget)
   - 4.6 [Fixed Expenses and Seasonal Provisioning](#46-fixed-expenses-and-seasonal-provisioning)
   - 4.7 [Goals](#47-goals)
   - 4.8 [Projections](#48-projections)
   - 4.9 [Liabilities](#49-liabilities)
   - 4.10 [Alerts](#410-alerts)
   - 4.11 [Financial Health](#411-financial-health)
   - 4.12 [Reports](#412-reports)
   - 4.13 [Reimbursements](#413-reimbursements)
   - 4.14 [Tags](#414-tags)
   - 4.15 [Institutions](#415-institutions)
   - 4.16 [Assets & Property](#416-assets--property)
   - 4.17 [Monthly Plan](#417-monthly-plan)
   - 4.18 [Education](#418-education)
   - 4.19 [Profile](#419-profile)
   - 4.20 [Studio (Administration)](#420-studio-administration)
   - 4.21 [Special Reimbursement](#421-special-reimbursement)
5. [Cross-Cutting Flows](#5-cross-cutting-flows)

---

## 1. Product Vision and Philosophy

**Lyfx** (pronounced "life effects") is a personal finance platform built on a principle uncommon in the consumer finance app market: **recording isn't enough — you need to diagnose**.

Most tools available to consumers work like a digital bank statement — they list money in and out and, at best, group it by category. Lyfx goes further by applying to personal finance the same analytical rigor companies use in their **P&L — Profit and Loss statement**. This accounting instrument doesn't just sum revenue and expenses; it organizes them into layers of analysis that reveal the *quality* and *structural health* of the result.

### The central premise

Every dollar that enters or leaves a person's life carries a different nature. A salary and a one-off sale are both income, but their predictability is completely different. Rent and an emergency medical visit are both expenses, but one is structural and the other unpredictable. A mortgage and a revolving credit card balance are both debt, but one is strategic and the other destructive.

Lyfx starts from the principle that **understanding the nature of each entry is more valuable than just summing them up**. That's why every transaction is classified not just as income or expense, but by its profile: fixed, variable, committed, seasonal, intentional, or unpredictable. This profile feeds the platform's entire analytical layer.

### Who it's for

The platform was designed for the individual who wants to move from reactive management ("how much did I spend this month?") to proactive management ("where am I committing my future? What am I building?"). It assumes no accounting knowledge, but offers users who want to go deeper a genuinely technical view of their financial result.

### User model

Lyfx supports multiple users with complete data isolation. Each user sees exclusively their own records. User creation and management is done by the administrator via the Studio panel, which requires a separate password.

---

## 2. Fundamental Financial Concepts

To understand what Lyfx offers, you need to understand the concepts that structure its internal logic. These concepts are explicit in the interface and guide the entire user experience.

### 2.1 The Category Taxonomy

The analytical heart of Lyfx is its categorization system. Unlike systems that use free-form or generic categories ("Food", "Leisure"), Lyfx uses a closed taxonomy with precise financial semantics.

#### Income

| Category | Meaning | Examples |
|---|---|---|
| **Fixed** | Predictable income, stable amount and frequency | Monthly salary, owner's draw, rent received |
| **Variable** | Real income but with no guarantee of repetition | Freelance work, commissions, reimbursements received, one-off sales |

The distinction between fixed and variable income matters because it affects planning: the budget should be built on fixed income, not variable.

#### Expenses

| Category | Meaning | Examples | Why it matters |
|---|---|---|---|
| **Fixed** | Predictable amount and frequency | Rent, condo fees, subscriptions, monthly dues | Certain obligations — they go out no matter what |
| **Variable** | Predictable frequency, amount fluctuates | Food, fuel, leisure, pharmacy | Recurring cost of living with some control |
| **Committed** | Debt already taken on, certain outflows | Credit card installments, open personal credit | Active debt that commits future margin |
| **Long-term** | Multi-year horizon, generally strategic | Mortgage, payroll-deducted loan | Long-term commitment — can be productive or harmful |
| **Seasonal** | Predictable but not monthly | Vehicle/property tax, car insurance, Christmas gifts, school supplies | Doesn't show up every month, but is certain — requires provisioning |
| **Unpredictable** | Genuine emergencies and surprises | Urgent repair, emergency medical treatment | Not plannable — reveals the need for an emergency fund |
| **Intentional Allocation** | Conscious decision about where money goes | Emergency fund, early debt payoff, investment | Distinguishes spending from wealth-building |

### 2.2 The Cascading P&L

The P&L applied to personal finance in Lyfx works as a cascade of progressive deductions, where each layer reveals a different margin:

```
Total Income
  − Fixed Expenses
  = SURPLUS AFTER FIXED       ← "How much is left after paying what's certain?"

  − Variable Expenses
  = OPERATING MARGIN          ← "How much is left after this month's cost of living?"

  − Committed Expenses
  = OPERATING RESULT          ← "How much is left after honoring all debts?"

  − Other Expenses (seasonal, unpredictable, intentional)
  = NET RESULT                ← "What was the real final balance of the month?"
```

Each intermediate margin enables a specific diagnosis. A positive net result with a negative operating margin, for example, indicates that the positive result came from intentional allocations (being counted as expenses), not from cost-of-living efficiency.

### 2.3 Recurrence and Projection

Lyfx distinguishes three frequency types for transactions:

- **One-off** ("once"): happens a single time on the given date
- **Monthly** ("monthly"): repeats every month; may have an end date
- **Yearly** ("yearly"): repeats once a year; typical for seasonal expenses

Recurring transactions automatically feed the Projections module, which simulates the next 12 months of commitments already assumed.

### 2.4 Installments

An installment transaction in Lyfx is not a single entry with an "installments" field — it is created as N individual records, each with its own date. This lets each installment appear correctly in the month it will be paid, both in transaction history and in future projections.

### 2.5 Avalanche Method

For debt management, Lyfx implements the **avalanche method** — the academically most efficient strategy for paying off multiple debts. The principle: pay the minimum on every debt and direct any extra payment first to the debt with the **highest interest rate**. This minimizes the total interest paid over time.

### 2.6 Financial Health Score

Lyfx computes a numeric score from 0 to 100 that synthesizes the user's financial health across four dimensions, each with a specific weight:

- **Debt commitment** (30 points): how much of income is committed to debt payments
- **Savings rate** (25 points): how much of income is directed toward building the future
- **Period result** (25 points): whether the month closed positive or negative
- **Emergency fund** (20 points): how long the user could sustain themselves without income using what has already been accumulated

---

## 3. General Platform Structure

Lyfx is organized into three major areas:

### Public Area
- **Landing Page** (`/`): product presentation page
- **Login** (`/login`): unified authentication and signup form

### User Area (requires login)
The entire user area has a consistent layout:
- **Sidebar** (left): navigation between modules, organized into thematic groups (Main, Planning, Analysis, Learn). Can be collapsed by clicking the logo, showing only icons with hover tooltips.
- **User menu** (top-right corner, floating): pill with avatar and user name. Opens a dropdown with "Edit profile" and "Sign out". Persists on every page without interfering with content.

### Administrative Area
- **Studio** (`/studio`): admin panel with its own password, independent of the user session.

---

## 4. Modules — In-Depth Description

---

### 4.1 Landing Page

**Route**: `/`
**Access**: public (no login required)

The landing page serves as the product showcase. If the user already has an active session, they are redirected directly to the Dashboard without needing to see the presentation page.

The page presents the product in progressive sections:

**Navbar** fixed at the top with anchors to the main sections and a login access button.

**Hero**: central presentation with the product name, tagline, and a visual mockup of the dashboard. The goal is to give the visitor an immediate view of what the platform is before any textual explanation.

**Marquee**: continuous animated strip with key product terms (P&L, Health Score, Goals, Projections, etc.), building vocabulary before the explanation.

**Feature Cards**: six cards with interactive mini-mockups illustrating the main capabilities: Personal P&L, Financial Health Score, Financial Education, Proactive Alerts, Liabilities & Debt, Assets & Property.

**How It Works**: a four-step section explaining the full flow: record transactions → see health score → grow with educational pills.

**FAQ**: seven frequently asked questions in accordion format, covering the health score, education, whether it's free, privacy, the avalanche method, importing, and the P&L concept.

**Final CTA**: call to action with an access button.

**Footer**: footer with the current version and general product information.

---

### 4.2 Authentication

**Route**: `/login`
**Access**: public

The authentication system works in two distinct modes:

**Setup Mode** (first access, no user registered in the database):
Shows an account creation form with fields: name, email, password, and confirm password. This mode is shown automatically when the system detects that no user exists yet.

**Login Mode** (existing user):
Shows email and password fields, with a "Remember me" option and a "Forgot my password" link. Also offers social login buttons (Google and Microsoft) when the integrations are active.

**Switching between modes**: the user can toggle between login and setup modes manually, regardless of the database state.

**Validations**:
- All fields are required
- **Strong password policy** (CS-33): minimum 8 characters with at least one uppercase letter, one lowercase, one number, and one special character. Visual strength bar with 4 levels (Weak / Fair / Good / Strong) and a real-time list of requirements not yet met.
- In setup mode, the confirmation must match the password exactly — a real-time indicator shows "Passwords match" (green) or "Passwords don't match" (red)
- The submit button "shakes" (shake animation) when there are validation errors

**Protection against excessive attempts** (CS-32):
- After 10 login failures from the same IP within 30 minutes: shows a CAPTCHA challenge (Cloudflare Turnstile) before allowing another attempt
- After 15 failures: IP temporarily blocked with a "Access temporarily blocked" message and a countdown in minutes
- Automatic unblock via a sliding window — no manual intervention needed
- All thresholds and the time window are configurable by the administrator in the Studio

**Social login with Google and Microsoft (CS-36)**:
- "Sign in with Google" and "Sign in with Microsoft" buttons on the login screen
- On click, the user is redirected to the chosen provider's authorization screen
- After authorization, the system links the social account to the existing user (same email) or automatically creates a new user
- If a provider's credentials are not configured, the corresponding button appears visually disabled
- Authentication errors are shown on the login screen (without cluttering the URL)

**"Forgot my password" modal**: clicking the link opens a modal explaining that Lyfx does not send recovery emails. The guidance is to go to the profile to reset the password, or contact the administrator who can reset it via the Studio.

**Success visual feedback**: after a successful login, the button turns green with a confirmation icon before redirecting.

**Studio access**: a discreet link at the bottom of the login screen ("Access Studio"), so the administrator can reach the panel without using their normal account.

**Home button**: navigates back to the landing page.

**Left decorative panel**: visual area with an animated dot grid, product watermark, static decorative KPIs, and the current month displayed.

---

### 4.3 Dashboard

**Route**: `/dashboard`
**Access**: requires login

The Dashboard is the financial command center for the current period. It was designed not as a passive monitoring panel, but as an active diagnostic instrument.

#### KPI Cards

Four immediate metrics at the top of the page:

- **Balance**: the month's net result — total income minus all expenses. Shown in green when positive, red when negative. It's the most synthetic metric: was the month good or bad?

- **Income**: sum of all credits for the month, regardless of type (fixed or variable). Shows the total that came in.

- **Expenses**: sum of all expenses for the month. Shows the total that went out.

- **Saved**: sum of entries classified as "Long-term Allocation" (debit_longterm). Represents what was consciously directed toward building the future — reserve, investment, early payoff. This is the metric that answers "what am I building?".

#### Cascading P&L

The centerpiece of the dashboard. The P&L shows the month's transactions grouped by taxonomy categories, with three intermediate margins calculated progressively:

1. **Surplus after fixed**: result after deducting fixed expenses from income. Shows what's left after paying what's certain — the month's financial floor.

2. **Operating margin**: result after also deducting variable expenses. Shows what's left after the full cost of living.

3. **Operating result**: result after also deducting commitments (open debts). Shows how much is really available after honoring all obligations.

Each margin is shown with a colored badge (green/red) inline on the corresponding separator row. This turns the spending list into a structured diagnosis: you can see exactly at which layer the money is "disappearing".

#### Lyfx Insight

Contextual banner automatically generated based on priority rules over the month's financial state:

1. If the result is negative → alert with the deficit amount ("You spent $X more than you received this month")
2. If debt commitment exceeds 35% of income → excessive commitment alert
3. If there is an active goal and there's free balance → suggestion to redirect the surplus to the goal
4. If the savings rate is below 10% → suggestion to increase the allocation
5. If the month is healthy → positive confirmation with the savings rate achieved

The Insight answers the question the user has but doesn't always know how to ask: "What is my financial result this month telling me?".

#### Goals Widget

Side panel with active financial goals (up to 4 shown). Each goal shows:
- Name and colored icon
- Visual progress bar (accumulated amount vs. target amount)
- Percentage completed

Direct link to the full Goals page.

#### Monthly Trend Chart

Bar chart of the last 6 months. Each month shows income, expense, and result. The current month is highlighted in cyan. Hovering over a month shows a tooltip with the exact values.

Goal: let the user perceive trends over time, not just the current month's snapshot.

#### Recent Transactions

List of the last 8 transactions of the month with date, description, category, and amount. Direct link to the full Transactions page.

#### Assets & Property Widget

Compact panel that appears **only when there are registered assets**. Shows the total number of registered assets, the current estimated value of physical wealth, and the total annual cost of taxes/expenses. If there are overdue and unpaid expenses, shows a red alert badge. Links to `/assets`.

#### Financial Health Widget

Card at the top of the right column with the current score (0–100), the financial profile name (Recovering / Stabilized / Building / Free), and a link to the full Financial Health page.

---

### 4.4 Transactions

**Route**: `/transactions`
**Access**: requires login

Central module for recording financial entries. Every financial movement — what came in and what went out — is recorded here.

#### New Transaction Form

**Type**: credit (income) or debit (expense). Defines which categories are available.

**Date**: day the entry occurred or will occur.

**Description**: free-form name for the entry (e.g. "July salary", "Client lunch").

**Amount**: amount in currency. Accepts local number format with a decimal comma (e.g. 1.234,56).

**Category**: mandatory selection from the 9-category taxonomy. Automatically filters by type (credit shows only income categories, debit shows only expense categories).

**Notes**: optional free-form field for additional context.

**Context**: optional classification between "Personal" and "Professional". Allows filtering or analyzing spending by life context.

**Recurrence** (One-off mode):
- "Does not repeat": one-time entry
- "Every month": repeats monthly until an end date (optional)
- "Every year": repeats yearly (typical for seasonal expenses like vehicle tax, insurance)

**Tags**: inline selector to attach one or more tags to the entry. Tags are custom labels with a color and icon that allow groupings across categories (e.g. "Car" can span multiple categories — variable fuel, seasonal vehicle tax, long-term financing).

**Account** (visible when accounts are registered): lets you associate the transaction with a specific account at a registered financial institution (e.g. Checking Account, Savings).

**Reimbursable toggle** (debits only): when enabled, marks the transaction as an expense that will be reimbursed by a third party (e.g. corporate travel expense paid by the employee and reimbursed by the company). The transaction goes to tracking in `/reimbursements`.

#### Installments Mode

Alternate tab in the form. Instead of creating a single entry, it creates N monthly records with:
- Total amount divided equally across N installments
- Each installment dated on the same day of subsequent months
- Automatic suffix in the description: "Purchase name (1/N)", "Purchase name (2/N)", etc.
- All installments share a group identifier for batch actions

#### Transaction List

Shows the month's transactions in chronological order. Each item shows date, description, category with icon and color, amount (green for credit, red for debit), and associated tags.

**Click interaction**: clicking a transaction slides down an animated action panel (ActionBar) with a colored background:
- **Edit** (amber): opens the edit modal
- **Delete single** (red): deletes only this record
- **Delete installments** (red, only for installments): deletes every installment in the group
- **Close** (×): closes the panel with no action

#### Edit Modal

Opens automatically in the correct mode based on the transaction type:

**Single Mode** (one-off transaction, no installments): edits only the clicked record. All fields available.

**Installments Mode**: edits every future installment in the same group from today onward. The date field is not shown (since each installment has its own date). A notice informs which installments will be affected.

**Recurring Mode**: edits only the clicked record (one occurrence). An amber banner warns that the edit affects only this record, and that future projections will be based on the new data.

---

### 4.5 Budget

**Route**: `/budget`
**Access**: requires login

The Budget module implements the concept of **intentional financial planning**: before spending, define where each dollar should go. The comparison between planned and actual reveals plan adherence.

#### Expected Income

Inline editable field at the top of the page. Defines the user's expected monthly income — usually equivalent to fixed income (salary, owner's draw).

This value serves as a planning reference: allocations are expressed not just in currency, but as a percentage of expected income, which makes proportional reasoning easier ("I want to allocate 30% to housing, 15% to food...").

A green progress bar visually shows the relationship between the actual income for the selected month and the expected income.

#### Category Allocations

For each category in the taxonomy, the user can set a monthly allocation amount — how much they plan to spend/direct to that category. Not all categories need to be filled in; only the ones that make sense for the user's profile.

Below each allocation amount, the system automatically shows the percentage that allocation represents of expected income.

Each category shows a progress bar with three color states:
- **Green** (less than 75% of the allocation used): within plan
- **Amber** (between 75% and 99%): attention, approaching the limit
- **Red** (100% or more): limit reached or exceeded

#### Month Navigation

The user can navigate between months to see how each period's actual spending compares to the planned allocations. Allocations are unique (the same plan serves every month), but actual spending is filtered by month.

#### Balance

Summary card at the bottom with two columns:
- **Planned**: expected income minus the total of defined allocations. Shows whether the plan as a whole makes mathematical sense.
- **Actual**: the month's real income minus the amount actually spent. The concrete financial result.

The comparison between Planned and Actual reveals whether the user is sticking to the plan or if there are systematic deviations.

---

### 4.6 Fixed Expenses and Seasonal Provisioning

**Route**: `/fixed-expenses`
**Access**: requires login

A dedicated view of everything recurring — the certain obligations that exist regardless of what happens in the month.

#### Summary Cards

Three metrics at the top:
- **Total monthly recurring**: sum of everything that goes out every month (monthly recurrence)
- **Total yearly one-off**: sum of everything that goes out once a year (yearly recurrence)
- **12-month projection**: total committed over the next 12 months, combining monthly and yearly

#### Monthly Fixed List

All transactions with monthly recurrence, sorted by descending amount. Shows description, category, amount, and associated tags.

#### Yearly Fixed List

All transactions with yearly recurrence. Each item shows a badge with the month the entry falls in, making it easy to identify when each yearly expense will arrive.

#### Breakdown by Tags

Chips showing how much each tag represents in the total monthly fixed expenses. Lets you quickly identify how much of the fixed expenses is associated with tags like "Car", "Home", or "Work".

#### 12-Month Projection Chart

Horizontal bar chart with each of the next 12 months. Each month's bar represents the total committed for that period:
- **Red bars**: monthly base (everything that goes out every month)
- **Yellow peaks**: months with additional yearly expenses

The chart visually reveals the "heavy" months of the year — those where seasonal expenses stack on top of the fixed base, like the month of vehicle tax or school supplies.

#### Seasonal Provisioning

Section added at the end of the page when there are registered yearly expenses. Implements the concept of **provisioning** — setting aside a monthly amount to cover a predictable future expense, instead of being surprised by it when it arrives.

For each yearly expense, the system calculates:
- How many months remain until the next due date
- How much needs to be set aside **per month** to reach the due date with the full amount (the divisor is the actual remaining time, not a fixed 12)
- A visual progress bar for the deadline urgency

Urgency code:
- **Red "Urgent"**: 2 months or less until due
- **Amber**: between 2 and 4 months
- **Green**: more than 4 months

At the top of the section, a banner consolidates the total to provision per month considering all yearly expenses.

---

### 4.7 Goals

**Route**: `/goals`
**Access**: requires login

Financial goal system with automatic monthly payment planning.

#### Creating a Goal

Fields for creation:
- **Name**: what the user wants to call the goal (e.g. "Trip to Europe", "Emergency Fund")
- **Description**: free-form context about the goal
- **Target amount**: how much needs to be accumulated in total
- **Deadline**: month and year by which the goal should be reached
- **Color**: visual identification for the goal

**Real-time calculation during creation**: as the user fills in the amount and deadline, the system instantly shows:
- The amount that will be charged per month (total amount ÷ number of months until the deadline)
- The feasibility classification based on the average surplus of the last 3 months

**Feasibility classifications**:
- "Comfortably fits" — the monthly charge consumes up to 30% of the average surplus
- "Feasible" — consumes between 31% and 60% of the average surplus
- "Tight — consider extending the deadline" — consumes between 61% and 100%
- "Not feasible — you'd need $X/month more" — exceeds the available average surplus

This diagnosis doesn't prevent creating the goal, but informs the user about the reality of the commitment before taking it on.

#### Automatic Monthly Payments

When a goal is created, the system automatically generates a payment for each month between creation and the deadline. The payment amounts are distributed equally, with the last installment absorbing any rounding residual (guaranteeing that the exact sum of the installments always equals the target amount).

Each payment is listed on the goal card with:
- Reference month
- Payment amount
- Status (paid / pending / overdue)
- Button to mark as paid or unmark

**Overdue payments**: unpaid payments with a due date in the past are highlighted with a red "Overdue" badge. The user can mark them as paid at any time.

**Automatic progress**: marking a payment as paid automatically recalculates the goal's accumulated amount. When the target amount is reached, the goal automatically changes to "Completed" status.

#### Top Summary

Three consolidated metrics:
- Total in active goals (sum of the target amounts of all active goals)
- Total already saved (sum of the amounts paid across all goals)
- Monthly commitment as a percentage of the average surplus

#### Contextual Liability Alert

If the user has registered liabilities (debts) with a high interest rate (≥ 5% per month), the Goals page shows a red **alert banner**. The reasoning: paying off expensive debt is mathematically superior to accumulating toward goals, because the interest charged by the debt exceeds any return the goal could generate.

The banner lists the high-cost debts and suggests prioritizing payoff. If all debts have low rates, the banner turns green, confirming that focusing on goals is appropriate.

---

### 4.8 Projections

**Route**: `/projections`
**Access**: requires login

Simulation of the next 12 months based exclusively on commitments the user has already taken on — recurrences and installments.

**Important**: projections show only what is **committed**, they make no assumptions about future variable income or expenses. It's a view of what is already "contracted" with the future.

#### Summary Cards

- **Accumulated free balance**: sum of positive balances in months where committed income exceeds committed expenses
- **Average monthly free balance**: average of the free balance month by month
- **Months in the red**: how many of the next 12 months have a negative committed balance (more committed outflows than inflows)

#### 12-Month Chart

12 clickable columns, each representing a month. Each column is split into:
- **Cyan bar**: committed income (recurring and receivable installments)
- **Red bar**: committed expenses (recurring and payable installments)
- **Green bar**: free balance (difference between inflows and outflows)

#### Monthly Detail

Clicking any column in the chart shows the full breakdown for that month in the panel below:
- Each committed inflow with amount and category
- Each committed outflow with amount and category
- "Yearly" badge for yearly entries falling in that specific month
- Calculated free balance

---

### 4.9 Liabilities

**Route**: `/liabilities`
**Access**: requires login

Complete debt management with analysis tools and a payoff strategy.

#### Registering a Liability

Fields for registration:
- **Name**: debt identification (e.g. "Nubank Card", "Car Financing")
- **Type**: Overdraft, Revolving credit, Personal loan, Financing, Other
- **Outstanding balance**: current amount still owed
- **Interest rate**: percentage per month
- **Minimum payment**: minimum monthly installment amount
- **Creditor**: institution or person name (optional)
- **Notes**: free-form remarks
- **Institution**: optional link to an institution registered in the Institutions module

#### Summary Cards

- **Total in active debt**: sum of all outstanding balances
- **Interest burned per month**: sum of (balance × rate) across all debts — the monthly cost of carrying this debt
- **Total minimum payment**: sum of the minimums across all debts

#### Individual Liability Card

Each debt shows:
- Balance, interest rate, minimum payment
- **Payoff forecast**: how many months to pay off paying only the minimum, with a color code:
  - Green: up to 12 months
  - Amber: 13 to 36 months
  - Red: more than 36 months
- **Critical alert**: if the minimum payment doesn't even cover the month's interest, the system shows a red alert "Minimum doesn't cover interest — this debt will never be paid off this way". This is the most severe possible situation in debt management.
- Buttons to edit and mark as paid off

#### Paid-Off Debts

Liabilities marked "Paid off" remain visible in a separate section, preserving history. Can be re-edited if needed.

#### Recovery Mode

Collapsible section dedicated to the accelerated payoff strategy via the avalanche method. When expanded:

**Automatic sorting**: debts are listed from highest to lowest interest rate, with priority badges (1st, 2nd, 3rd...). This is the order in which extra money should be applied.

**Extra payment calculator**: the user types an additional amount they can pay per month. The system automatically recalculates:
- For the priority debt (highest interest): how much time is saved by applying the extra amount
- For the rest: keeps only the minimum
- The result shows the time savings in months for each debt

**Method tip**: educational explanation of the avalanche method — why attacking the highest rate first maximizes financial efficiency.

---

### 4.10 Alerts and Notifications

**Route**: `/alerts`
**Access**: requires login

The Lyfx alerts and notifications system operates on two distinct layers, with different purposes and behaviors.

#### Layer 1 — Automatic Financial Alerts

Computed in real time on every access, based on the user's current data state. **Not persisted to the database** — they appear while the condition exists and disappear when resolved. The user cannot dismiss them manually; they vanish on their own when the problem is fixed.

| Type | Severity | When it appears |
|---|---|---|
| Budget — Warning | ⚠ Yellow | Category reached 80–99% of its allocation |
| Budget — Critical | 🔴 Red | Category exceeded 100% of its allocation (blown) |
| Goal — Warning | ⚠ Yellow | Current month's payment not yet paid |
| Goal — Critical | 🔴 Red | Overdue payment (past date) not paid |
| Projection — Warning | ⚠ Yellow | Any of the next 12 months has a negative projected balance |
| Seasonal — Warning | ⚠ Yellow | Yearly expense due in ≤ 2 months |
| Critical Liability — Danger | 🔴 Red | Active overdraft or revolving credit (balance > 0) |

The Critical Liability alert is especially important: besides showing the monthly rate, it automatically computes the annual equivalent via the compound interest formula, making the real devastation of predatory rates visible. Debt at 12% per month equals 286% per year — a number that alone motivates action.

Each alert has a direct link to the responsible module, letting the user go straight to the point and resolve the problem without navigating around the platform.

#### Layer 2 — System Notifications

Messages sent by the administrator or automatically generated by system events. **Persisted to the database** and remain available until read or dismissed by the user.

**Bell in the user menu**: icon in the top-right corner of the screen with a red badge indicating unread notifications. Clicking it opens a dropdown with two sections:
- **Financial alerts**: summary of active critical alerts (count and type)
- **Notifications**: individual system messages, each with a delete button

**Notification types:**
- **Welcome**: sent automatically when a new user is created via the Studio
- **Announcements**: sent by the administrator via the Studio, targetable at a specific user or at every user on a plan

**Crucial difference between alerts and notifications**: alerts have no delete button — they exist as long as the problem exists. Notifications can be dismissed individually or in bulk ("Clear all"), since they are announcements the user can dismiss after reading.

#### The `/alerts` Page Interface

The page consolidates both layers into an organized view:
- Financial alerts grouped by severity (critical before warning)
- Separate system notifications section
- Chips at the top with counts per type
- **"All Clear" state**: green bell icon when there are no pending alerts or notifications

**Why this matters for the business**: most people lose money not from a lack of data, but from a lack of timely visibility into problems. A critical liability alert that appears on screen before a financial commitment can prevent a decision that would cost hundreds of dollars in interest. The alert system is the platform's central mechanism for proactive intervention.

---

### 4.11 Financial Health

**Route**: `/health`
**Access**: requires login

Consolidated diagnosis of the user's financial health, expressed as a score of 0 to 100 points distributed across four dimensions.

#### Score and Profiles

| Range | Profile | Color | Meaning |
|---|---|---|---|
| 0–39 | Recovering | Red | Critical financial situation, requires immediate action |
| 40–59 | Stabilized | Amber | Fragile balance, improvements needed |
| 60–79 | Building | Cyan | Solid foundations, building the future |
| 80–100 | Free | Green | Excellent financial health |

#### Animated SVG Gauge

Semicircle with a needle that goes from 0 to 100. The needle's animation up to the current score makes the result more visually impactful.

#### The Four Dimensions

**Commitment (max 30 points)**
Measures what percentage of income is committed to debt payments. Maximum score when commitment is 30% or less of income. The logic: excessive debt is the main obstacle to financial freedom.

**Savings (max 25 points)**
Measures the savings rate: how much of income is directed toward building the future (debit_longterm entries). Maximum score when savings reach 20% or more of income.

**Result (max 25 points)**
Assesses whether the period closed positive. Score proportional to the net result — the more positive, the more points. A negative result implies zero points in this dimension.

**Reserve (max 20 points)**
Estimates the accumulated emergency fund. The user can declare the real balance of the reserve fund via an inline editor on the Financial Health page (`reserveBalance` in Settings). If not filled in, the system uses the historical sum of "Long-term Allocation" entries as a proxy. The value is compared with the average expenses of the last 3 months to calculate how many months of autonomy the user has. Maximum score when the reserve covers 6 months or more.

#### Dimension Cards

Each dimension is shown in an individual card with:
- Current score and maximum possible
- Proportional progress bar
- Contextual description of what the current score means

#### Profile Badge

Shows the current profile (name + point range) and indicates how many points are needed to advance to the next profile — creating a tangible goal.

#### Prioritized Tip

Banner with the most relevant tip based on the lowest-scoring dimension. If the user has a low score in Reserve, the tip addresses how to build the reserve. If the weakest dimension is Commitment, it addresses payoff strategies.

#### Reserve Fund Declaration

Inline editor field on the Reserve dimension card. The user can directly enter the current balance of their emergency fund (e.g. $12,400 in savings). This value replaces the proxy calculation and makes the Reserve dimension diagnosis more accurate.

---

### 4.12 Reports

**Route**: `/reports`
**Access**: requires login

Detailed P&L per period, with absolute values and percentages of income.

The user selects a period (month and year) and gets a structured view of every category with:
- Total amount of each category in the period
- Percentage that category represents of the period's total income
- Subtotals by group (income, fixed expenses, variable, etc.)
- Final net result

The Reports module is the most analytical on the platform — it lets the user study a specific period in detail to understand exactly where resources came from and where they went.

---

### 4.13 Reimbursements

**Route**: `/reimbursements`
**Access**: requires login

Tracking of reimbursable expenses — expenses the user paid but that will be reimbursed by a third party (company, partner, family member).

#### How It Works

When registering any expense in the Transactions module, a "Reimbursable expense" toggle is available. Enabling it marks the transaction for tracking.

**Important**: the expense continues to appear in the P&L and in all other calculations normally. The Reimbursements module is an additional tracking panel, not a separate category.

#### Summary Cards

- **To receive**: sum of all reimbursable expenses still pending receipt
- **Already reimbursed**: sum of everything that has been received
- **Total recorded**: combination of the two previous ones

#### Lists

**Awaiting reimbursement**: list of pending expenses with an amber badge. Each item has a button to mark as received — clicking it automatically records the receipt date.

**Reimbursed**: list of already-received expenses with a green badge and receipt date. Each item has an undo button (in case the receipt was marked by mistake).

---

### 4.14 Tags

**Route**: `/tags`
**Access**: requires login

Custom label system that lets the user create groupings that cut across categories.

Categories answer "what is the financial nature of this expense?". Tags answer "what subject, project, or area of life does this expense belong to?".

Example: a person with a car might have a "Car" tag spanning: fuel (variable), vehicle tax (seasonal), insurance (seasonal), maintenance (unpredictable), and financing installments (committed). None of these transactions are in the same category, but they all share the same tag — letting you see the car's total cost at a glance.

#### Creating a Tag

- **Name**: unique per user
- **Color**: selection from a palette of 8 predefined colors
- **Icon**: selection from 12 icon options (tag, briefcase, house, car, heart, star, bolt, cart, school, plane, computer, coffee)

**Real-time preview**: as color and icon are chosen, a preview chip shows how the tag will look before saving.

#### Editing

Name, color, and icon are editable inline directly in the listing.

#### Deletion

Deleting a tag automatically removes all links to transactions. Transactions remain intact — they just lose the link to the deleted tag.

---

### 4.15 Institutions

**Route**: `/institutions`
**Access**: requires login

Registry of banks, fintechs, brokerages, and other financial institutions with their linked accounts.

#### Registering an Institution

- **Name**: e.g. "Nubank", "Chase", "Fidelity"
- **Type**: Bank, Fintech, Brokerage, Other
- **Color**: visual identification (hex)
- **Icon**: custom icon
- **Notes**: free-form remarks

#### Accounts per Institution

Each institution can have N associated accounts. Account types:
- Checking
- Savings
- Credit Card
- Investments
- Wallet (physical cash)
- Other

Each account records:
- **Balance**: current available amount
- **Limit**: for cards and overdraft (optional)
- **Notes**: free-form remarks

#### Links

**With Liabilities**: when creating or editing a liability (debt), it can be linked to the bank or fintech where the debt lives. The institution's card shows linked liabilities.

**With Transactions**: when creating a transaction, you can indicate which account it came from or went to, when accounts are registered.

#### Cascade Deletion

When deleting an institution:
- Its accounts are removed
- Liabilities linked to it have the link removed (but the liability is not deleted)
- Transactions linked to its accounts have the link removed (but the transactions are not deleted)

#### Summary Cards

- Consolidated total of balances across all accounts
- Total liabilities linked to institutions

---

### 4.16 Assets & Property

**Route**: `/assets`
**Access**: requires login

Registry of physical wealth with tracking of associated taxes and expenses.

#### Asset Types

**Real estate**: specific fields include the property address.
**Vehicle**: specific fields include make, model, year, plate.
**Other asset**: generic registration for assets that don't fit the previous types.

#### Fields Common to All Types

- **Name/nickname**: how the user wants to identify the asset (e.g. "São Paulo Apartment", "2019 Civic")
- **Purchase value**: how much it cost at acquisition
- **Current estimated value**: current market value (updated manually by the user)
- **Acquisition date**: when the asset was acquired
- **Notes**: free-form remarks

#### Value Variation

Each asset's expanded card shows the difference between the purchase value and the current estimated value, color-coded:
- Green: the asset appreciated
- Red: the asset depreciated

This lets the user monitor whether their physical assets are acting as assets (appreciating) or liabilities (depreciating) within the wealth context.

#### Expenses per Asset

Each asset can have N associated expenses. Expense types with suggestions per asset type:

| Expense Type | Suggested for |
|---|---|
| Property Tax | Real estate |
| Vehicle Tax | Vehicle |
| Rural Land Tax | Real estate (rural) |
| Mandatory Vehicle Insurance | Vehicle |
| Insurance | Real estate and Vehicle |
| Registration/Licensing | Vehicle |
| Maintenance | All |
| Other | All |

Each expense records:
- Name (e.g. "2025 Property Tax", "Annual Car Insurance")
- Type
- Amount
- Due date (optional)
- Status: paid or pending

**Payment toggle**: marking an expense as paid automatically records the payment date. The toggle can be reversed.

**Due date alert**: expenses with a past due date and pending status are highlighted with a red alert background.

**Totals per asset**: at the bottom of the expanded card, totals for paid, pending, and grand total for that asset.

#### Global Summary Cards

- Total number of registered assets
- Sum of the current estimated value of all assets (total physical wealth)
- Sum of all expenses/taxes for the year (annual cost of maintaining the wealth)
- Count and total of overdue and pending expenses

---

### 4.17 Monthly Plan

**Route**: `/planning`
**Access**: requires login

Visual calendar of the current month's entries. Shows every transaction distributed across the days of the month, giving a temporal view of when each financial commitment occurs or occurred.

---

### 4.18 Education

**Route**: `/education`, `/education/[pillId]`
**Access**: requires login

Gamified financial education module with content adapted to the user's financial health profile. Combines structured reading, a review quiz, and weekly consistency tracking.

#### Content Profiles

Content is organized into 5 profiles that mirror the financial health score profiles:

| Profile | Score Range | Focus |
|---|---|---|
| **critical** | 0–19 | Financial survival, urgent debt, overdraft |
| **serious** | 20–39 | Stabilization, expense cuts, minimum fund |
| **unstable** | 40–59 | Budgeting, emergency fund, first investments |
| **stable** | 60–79 | Optimization, goals, diversification |
| **healthy** | 80–100 | Wealth growth, advanced strategy, protection |

On entering `/education`, the system identifies the user's current profile and automatically highlights the recommended track.

#### Education Hub (`/education`)

Main screen with an overview of all tracks:

- **Progress bar per profile**: percentage of pills completed in each track
- **Pill grid**: each pill shown as a card with title, status (completed / pending), and icon
- **Profile filter**: lets you navigate between the 5 tracks
- **Streak counter**: shown at the top with a flame and the number of consecutive weeks
- **Recommended profile highlighted**: the track matching the current score is highlighted

#### Reading a Pill (`/education/[pillId]`)

Clicking a pill takes the user to the reading page:

**Silent timer**: recorded with `useRef` at the moment of the first render. The elapsed time is calculated when the quiz is submitted, with no display to the user — only stored in the database alongside the progress.

**Typed content sections**: each pill has up to 3 sections with distinct visual types:
- `concept`: neutral background, concept description
- `why`: soft amber background, why it matters
- `how`: soft green background, how to apply it in practice

**Review quiz**: at the end of the reading, a multiple-choice question with 4 options. The user clicks an option and:
- The correct option turns green with a confirmation icon
- Incorrect options turn red with an error icon
- The options lock after the first choice

**Completion**: after answering the quiz, the "Complete pill" button sends the progress (pillId, profile, time spent, quiz correct) via the `completePill()` Server Action. The progress is saved to `PillProgress`.

**Already-completed pill**: if the user has already completed the pill in a previous session, an informational banner appears at the top showing the completion date. The content remains accessible for re-reading, but the quiz is locked and progress is not rewritten.

**Next pill**: after completing, a card automatically suggests the next incomplete pill in the same track.

#### Weekly Streak

The streak system measures **weekly** — not daily — consistency, to be more achievable:

- A week with at least 1 completed pill counts as an active week
- The history shows the last **12 weeks** as colored blocks (active/inactive)
- The current week without activity **does not break** the streak (waits for action until the end of the week)
- The streak grows by counting consecutive active weeks from the most recent week

---

### 4.19 Profile

**Route**: `/profile`
**Access**: requires login (accessible via the user menu in the top-right corner)

Editing the user's personal data and credentials.

#### Avatar

Photo upload field. When selecting an image:
1. The image is resized in the browser itself (no upload to the server) to 200×200 pixels via the Canvas API
2. Converted to JPEG format with compression
3. Sent as a base64 string for storage in the database

The avatar appears in every instance of the user menu (top-right corner).

#### Personal Data

- **Name**: shown in the user menu and in the Studio
- **Email**: for reference (not used for password recovery)
- **Age**: optional numeric field
- **Gender**: optional text field

#### Structured Address

Five separate fields: ZIP code, Street, Number/Complement, City, State, and Country.

**Auto-fill via ViaCEP**: typing the ZIP code and clicking the magnifying glass icon (or pressing Enter in the ZIP field) queries the public ViaCEP API and automatically fills in Street, City, and State. Works only for Brazilian ZIP codes.

**Country**: typeable combobox with approximately 195 countries in Portuguese. Portuguese-speaking countries appear at the top of the list. The field filters in real time as the user types and also accepts free text (for unlisted countries or alternative names).

#### Password Change

Separate form:
- **Current password**: verified against the stored hash before any change
- **New password**: must meet the strong password policy (8+ characters, uppercase, lowercase, number, special) with a real-time visual strength bar
- Protection against changing without knowing the current password
- After a successful change, every other active session is automatically ended — only the current session remains

#### Active Sessions (CS-34)

Section dedicated to managing every device where the user is logged in:

- Each session shows: originating IP, browser/device info, and time of last activity (relative: "2 hours ago")
- The current session is highlighted with a "This session" badge
- **Revoke individual session**: ends access for a specific device without affecting others
- **Sign out of all other devices**: revokes every session except the current one in a single operation — useful when detecting unauthorized access or leaving a public computer

#### Security History (CS-35)

Log of the last 50 security events for the account:

- Each event shows: colored icon by type, readable description, originating IP, and relative time
- Event types recorded: successful login, failed login attempt, logout, password changed, session revoked, all sessions revoked, 2FA enabled/disabled, backup code used
- "Refresh" button to reload the history without reloading the whole page

#### Two-Factor Authentication — 2FA (CS-37a)

Additional protection against unauthorized access even if the password is compromised. Uses the TOTP (Time-based One-Time Password) standard, compatible with Google Authenticator, Authy, and any TOTP authenticator app.

**Enabling 2FA:**
1. In the profile's Security section, click "Enable 2FA"
2. Scan the QR Code with the authenticator app (or enter the code manually)
3. Type the 6-digit code shown in the app to confirm the setup
4. **Save the 8 backup codes** somewhere safe — each can be used once to log in if you lose access to the authenticator

**Logging in with 2FA active:**
- After correctly typing email and password, the system asks for the authenticator code
- The code is valid for 30 seconds and refreshes automatically in the app
- If you don't have access to the authenticator, click "Use backup code" and enter one of the saved codes

**Management:**
- **Regenerate codes**: generates 8 new codes and invalidates the previous ones (requires a TOTP code)
- **Disable 2FA**: removes the additional protection (requires a TOTP code to confirm)

---

### 4.20 Studio (Administration)

**Route**: `/studio`
**Access**: separate password (`ADMIN_SECRET`) — independent of the user session

Platform administration panel. Accessible via a discreet link on the login screen. Organized into 10 tabs: **Panel · Users · Plans · Modules · Security · Roadmap · Notes · Data · Schema · Documentation**.

#### Studio Authentication

Separate password form. The Studio password is set by the administrator and has no relation to application user passwords. The Studio session expires in 2 hours — enough time for typical administrative operations, with short expiration for security.

The "← Login" button returns to the application login screen without ending the session.

**Studio logout**: clicking Sign Out ends the Studio session **and** the user session simultaneously. The reason: the administrator usually accesses the Studio from an already-open user session. Ending both in a single operation prevents the account from staying open in the browser after administrative work.

#### Panel Tab

Software management dashboard. Answers the question "how healthy is the platform operationally?".

**System metrics** (6 cards):
- Registered users
- Total database records (all tables)
- Disk space used by the database
- Number of active plans
- Development version (dev environment)
- Production version (prod environment) — lets you compare both versions at once

**Operational gauges**: visual indicators for RAM, heap memory, and server CPU usage. A user with no technical knowledge can intuitively check whether "the server is overloaded".

**Global settings**:
- **Maintenance mode**: when enabled, shows a yellow banner at the top of every screen on the platform, notifying all users simultaneously. Useful during updates or technical work.
- **Banner message**: configurable text shown in the maintenance banner — lets you inform users about what's happening and when it will return to normal.

#### Users Tab

Full management of platform users.

- **List**: avatar, name, email, signup date, and an indicator of when the user was last online
- **Password reset**: the administrator can reset any user's password without knowing the current one — needed when the user forgets it and there's no email recovery
- **Create user**: inline form to create new accounts. On creation, a welcome notification is automatically sent to the new user
- **Delete user**: complete and irreversible deletion with all associated data. Inline confirmation before executing

#### Plans Tab

Plan-based access control. Defines which modules each group of users can see on the platform.

Two default plans:
- **Full**: access to all stable modules (no beta modules)
- **Insider**: access to all modules including those in development/beta

The Studio creates the plans automatically with a button click. The Full/Insider distinction lets you release new features to trusted users before making them available to everyone.

#### Modules Tab

Lists every system module with visibility control.

**Beta toggle per module**: the administrator can mark any module as "in beta" at any time, with no server restart needed. Modules marked as beta show a yellow "Beta" chip in the sidebar for all users — communicating that the feature is available but still in development.

This enables gradual rollout of new modules: released to Insider users first (the Insider plan includes betas), feedback collected, then the beta badge is removed once the module is mature.

#### Security Tab (CS-35)

Consolidated security event history for **every user** on the platform.

- Lists every login, logout, password change, session revocation, and failed access attempt
- **Filter by user**: lets you view a specific user's history, easing incident investigation
- **Filter by event type**: lets you filter only events of a category (e.g. only login failures)
- Each event shows: type with colored icon, description, user name, email, originating IP, and event time

#### Roadmap Tab (CS-20)

Kanban board for managing the project's Change Specs (CSs). Works as a Trello-style board within the Studio itself, letting you track each feature's lifecycle.

**4 fixed columns:**
- **Backlog** — planned features, not yet started
- **In progress** — work in progress in the current session
- **Blocked** — waiting on an external dependency (domain, API keys, document, etc.)
- **Done** — complete history of everything delivered

**Board features:**
- **Drag-and-drop**: drag a card between columns to update its status
- **Detail modal**: click any card to open the full editor with title, description/CS vision, labels, version delivered, commit hash, and completion date
- **Per-column sorting**: each column has a toggle to sort by newest or oldest — the Done column sorts by `completedAt`
- **Add card**: inline form at the top of each column

**Persistence**: the data lives in `docs/cs-board.json` inside the repository — survives database resets and follows Git versioning naturally.

#### Notes Tab

Persistent Markdown editor for administrative notes. The administrator can document decisions, pending items, observations about users, or any information relevant to operations.

Works like a rich notepad: supports headings, lists, checklists, quotes, and code blocks. Notion-style slash commands (`/h1`, `/bold`, `/todo`, etc.) speed up formatting. Keyboard shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+S`) for those who prefer the keyboard.

#### Notifications Tab

Sending announcements to platform users.

- **By plan**: sends a notification to every user on a plan (e.g. notify all Full users about a new feature)
- **By user**: sends to a specific user
- **Broadcast history**: list of announcements already sent, with date and recipient

Notifications appear in the user's bell on the main platform.

#### Data Tab

View of production data.

- **Filter by user**: combobox to select any user and see their metrics (record counts by type, recent transactions)
- **Global view**: the 10 most recent transactions across the whole system when no user is selected

#### Schema Tab

Interactive ERD (Entity-Relationship Diagram) of the database. Each table can be individually expanded/collapsed for easier reading. Relationship lines show connections between tables. Ideal for audits and for understanding the platform's data structure.

#### Documentation Tab

Full rendering of the technical documentation (`DOCUMENTATION.md`) directly in the panel, with a clickable side index. Lets the administrator consult the technical documentation without needing to open the repository.

---

### 4.21 Special Reimbursement

**Route**: `/km-reimbursement`
**Access**: requires login · plan with the module enabled

Full corporate module for mileage reimbursement and travel expense control. Built for professionals who need to account to their employer and need traceable documentation, automatic calculation, and formal report generation.

#### The problem it solves

Anyone who works with corporate mobility knows the cycle: jotting down each trip in a notebook, manually calculating the mileage, tracking down every fuel receipt, adding up every toll and parking fee, building a report in Excel or Google Sheets, and copying it all into SAP at month-end close. Any error in this process results in a wrong reimbursement or rework.

Special Reimbursement automates this entire chain: it calculates the rate per km based on the actual fuel price the user paid, validates whether there is enough documentation (minimum 15% of the km amount, per accounting requirement), assembles the statement formatted for direct copy into SAP, and generates a professional presentation PDF as proof.

#### How it works — the complete flow

**1. Open a request**: the user creates a period by entering a name, dates (start and end — can be 1 day or the whole month), fuel type, and vehicle data.

**2. Record routes**: for each trip, enters origin, destination, and mileage. The system integrates with Google Maps: as the addresses are typed, the map calculates the distance automatically. The user can drag the route points on the map to adjust alternative routes. Mileage is auto-filled but editable.

**3. Record fuel receipts**: for each fill-up, enters date, fuel type, liters, and total amount. The system automatically computes the **weighted average price per liter** — if the user filled up at different prices over the period, the average accounts for the quantity of each fill-up. The formula: average price = sum of total amounts ÷ sum of liters.

**4. Record extra expenses**: tolls, parking, lodging, food, taxi, and other expenses related to the corporate trip.

**5. Review the summary**: the platform shows the full statement:
- Fuel: type, average price per liter, computed rate (e.g. 25% of the gasoline price)
- Kilometers driven and value per km
- Total km + total extra expenses + **GRAND TOTAL**
- Validation: total amount of the fuel receipts submitted vs. the required minimum (15% of the km amount)

**6. Copy to SAP**: a button copies the formatted summary in the exact structure the corporate system expects, eliminating manual typing and transcription errors.

**7. Mark as submitted**: on confirming submission, the platform:
- Records the submission date
- Computes the **expected payment date (D+5 business days)** — automatically skipping weekends and **national holidays** (integration with the official calendar via BrasilAPI)
- Creates a **credit Transaction** for the total amount with the D+5 date, which appears in the Dashboard and P&L as future variable income
- The transaction has the description "Special Reimbursement — [period name]" for traceability

**8. Reconcile on receipt**: when the payment lands in the account, the user confirms and the transaction is already recorded in the correct month.

#### Where the information goes and how it interacts with other modules

| Data collected | Where it appears | How it affects |
|---|---|---|
| Period with dates | `/km-reimbursement` (history) | Tracking of open/submitted requests |
| Routes with km | Summary + PDF | Composes the km amount to reimburse |
| Fuel receipts | Summary + 15% validation | Defines the average price and validates documentation |
| Extra expenses | Summary + PDF | Adds to the request's total amount |
| Grand total on submission | `/transactions` as credit_variable | Appears in P&L → Financial Health → Projections |
| D+5 business days | Date of the created transaction | Appears in the correct month in Dashboard/Reports |

#### Saved Places

Sub-module at `/km-reimbursement/places` for registering frequent routes — the home→office route, for example, repeated dozens of times a month.

When saving a place, the user configures:
- Place name (e.g. "Home → HQ")
- Origin and destination address
- Preferred route (visually configured on the map)
- Associated vehicles

When recording routes within a period, one click on the saved place automatically fills in origin, destination, and mileage, avoiding retyping on every entry.

#### Settings

At `/km-reimbursement/settings`, the user can adjust:
- **Gasoline rate**: percentage of the price per liter that makes up the reimbursement (default: 25%)
- **Ethanol rate**: equivalent percentage for ethanol (default: 36% — ethanol requires more liters per km)
- **Minimum receipts**: minimum percentage of the km amount that must be covered by fuel receipts for accounting approval (default: 15%)
- **Payment term**: business days until expected payment (default: D+5)

#### The PDF — Route Statement

The generated PDF is a professional presentation document, not just a data report. It is generated by the server (not the browser), guaranteeing visual consistency regardless of the user's device.

PDF contents:
- **Header**: Lyfx logo, "Route Statement" title, period name, dates, vehicle, total amount, and total mileage
- **Routes page**: each route in a separate card with origin, destination, km, and notes. Each route has the route map embedded as an image (via the Google Static Maps API)
- **Consolidated summary**: all calculations, fuel validation, and submission/expected payment dates

The PDF serves as formal proof of the request, suitable for filing and audit.

#### Why 25% of gasoline as the rate?

The reimbursement rate per km tries to capture the real cost of running a vehicle. Fleet operating cost studies (e.g. transportation authority methodology and fleet management literature) indicate that fuel represents approximately 25-30% of the total cost per km for passenger vehicles (the rest includes depreciation, tires, maintenance, insurance). Lyfx uses 25% as a conservative default, but lets the user adjust it according to company policy.

The ethanol rate is higher (36%) because flex-fuel vehicles consume on average 30-40% more liters per km driven on ethanol vs. gasoline, which justifies a higher percentage rate over the liter price to arrive at the same value per km.

---

## 5. Cross-Cutting Flows

This section describes how modules connect — the flows that cross more than one module and are especially relevant for consistency validation.

### Flow A — A transaction and its effects

Recording an entry in `/transactions` automatically impacts:
- **Dashboard**: updates P&L, KPIs, and recent transactions
- **Budget**: updates the category's actual spend for the month
- **Fixed Expenses**: appears in the lists if recurring
- **Projections**: appears in future months if recurring or installment
- **Reimbursements**: appears in `/reimbursements` if marked reimbursable
- **Financial Health**: affects the score via the P&L
- **Alerts**: can trigger budget alerts
- **Reports**: appears in the period's P&L

### Flow B — Creating an installment plan

Creating an installment plan (e.g. $1,200 in 3x):
1. 3 individual transaction records are created with dates across 3 consecutive months
2. Each record shares the same `installmentGroupId`, identifying the group
3. The 3 installments appear in their respective months in `/transactions`
4. The 3 installments appear in the projections of their respective future months
5. Editing any installment updates every future installment in the group
6. Deleting via "Delete group" removes all 3 records

### Flow C — A goal and its monthly payment

Creating a $1,200 goal over 12 months:
1. The goal is created with `monthlyAmount = $100/month`
2. 12 payments (`GoalPayment`) are generated, one per month
3. The Dashboard widget shows the goal's progress bar
4. The Alerts tab triggers an alert if a payment isn't paid in its corresponding month
5. Marking payments as paid recalculates `currentAmount`
6. When `currentAmount >= targetAmount`, the goal changes to "Completed"

### Flow D — A liability and its alerts

Registering a liability with a rate ≥ 5% per month:
1. Appears in `/liabilities` with a payoff forecast
2. Triggers an alert banner on the Goals page (suggesting prioritizing payoff)
3. If the minimum doesn't cover interest, shows a critical alert on the card
4. In Recovery Mode, appears listed by avalanche-method priority

### Flow E — Financial Health and its sources

The health score is computed with data from multiple modules:
- Commitment dimension: computed from the P&L (sum of `debit_committed` / total income)
- Savings dimension: computed from the P&L (sum of `debit_longterm` / total income)
- Result dimension: computed from the P&L's net balance
- Reserve dimension: computed from the historical aggregate of `debit_longterm` divided by the average expenses of the last 3 months

### Flow F — Seasonal alert

A yearly expense (e.g. vehicle tax in April):
1. Appears in `/fixed-expenses` in the yearly list with a month badge
2. Appears in the 12-month projection chart as a peak in the due month
3. Appears in Seasonal Provisioning with a calculation of how much to provision per month
4. Generates a seasonal alert in `/alerts` when 2 months or less remain

### Flow G — Institution → Liability → Transaction linking

A debt (liability) can be linked to an institution, making the financial ecosystem more cohesive:
- The institution shows the linked liability on its expanded card
- The liability payment transaction can be linked to the same institution's account
- Deleting the institution removes the link but the liability remains intact

### Flow H — Education and health profile

On accessing `/education`:
1. The system fetches the current month's health score via `getHealthData()`
2. The score profile (`critical` / `serious` / `unstable` / `stable` / `healthy`) is mapped to the pill profile
3. The corresponding track is highlighted in the hub as "Recommended"
4. On completing a pill at `/education/[pillId]`, the progress is saved to `PillProgress` via `completePill()`
5. The weekly streak is recalculated on the hub's next render
6. The next incomplete pill in the same track is suggested automatically

### Flow I — Special Reimbursement and its lifecycle

A Special Reimbursement period follows this path:

1. **Creation**: user creates a period at `/km-reimbursement/new` with name, dates, fuel, vehicle → KmPeriod created with `open` status
2. **Entries**: user records routes (KmRoute), fuel receipts (KmReceipt), and extra expenses (KmExpense) — with each new entry, the period's totals are recalculated automatically
3. **Summary**: "Summary" tab shows the formatted statement for copying into SAP; fuel validation shows green/red
4. **Submission**: clicking "Mark as submitted":
   - KmPeriod.status → `submitted`
   - Submission date recorded
   - D+5 business days computed (skipping Saturdays and Sundays)
   - **Transaction created**: type `credit`, category `credit_variable`, amount = grandTotal, date = D+5, description = "Special Reimbursement — {name}"
   - transactionId saved on the KmPeriod for traceability
5. **Dashboard impact**: the created Transaction appears in the D+5 month's P&L, affecting the income KPI and health score
6. **Reopen (if needed)**: reopening a period deletes the Transaction and the KmPeriod returns to `open`
7. **PDF**: available at any time once there are routes; generated by the server with embedded route maps

---

*Version 1.11.0 · June 2026*
*For the detailed test plan, see `docs/QA-TEST-PLAN.md`. For technical reference (schema, architecture, decisions), see `DOCUMENTATION.md`.*
