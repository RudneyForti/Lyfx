# Ly*fx* — Life Fixed

> [Leia em português](./README.md)

> Personal finance platform built for those who want to understand their money, change behaviors, and make decisions with clarity.

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-v7-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-containerized-2496ED?style=flat-square&logo=docker&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Version](https://img.shields.io/badge/version-1.15.4-22D3EE?style=flat-square)

---

## What it is

Lyfx applies the **P&L (Profit and Loss) statement** concept — used by companies — to personal finance. Every transaction is classified by type and category, producing a clear view of income, expenses, and monthly result.

## Modules

| Module | Description |
|---|---|
| **Dashboard** | Real-time personal P&L, KPIs, 6-month trend, goals, and health score |
| **Transactions** | CRUD with categories, tags, recurrence, and installments |
| **Budget** | Spending caps per category with monthly tracking |
| **Goals** | Objectives with automatic installments and feasibility analysis |
| **Projections** | 12 months of recurring commitments ahead |
| **Fixed Expenses** | View of monthly fixed expenses and seasonal provisioning |
| **Monthly Plan** | Calendar of the month's entries |
| **Liabilities** | Debts with an avalanche-method payoff plan |
| **Institutions** | Banks and fintechs with linked accounts and balances |
| **Assets & Property** | Real estate, vehicles, and other assets with associated taxes and expenses |
| **Alerts & Notifications** | Automatic financial alerts + system notifications with bell, badge, and read center |
| **Financial Health** | 0–100 score across 4 dimensions with an evolving profile |
| **Reports** | Detailed P&L per period with percentages over income |
| **Reimbursements** | Tracking of reimbursable expenses and their receipt |
| **Tags** | Custom labels per transaction |
| **Profile** | Personal data, address with ZIP-code auto-fill, and password change |
| **Education** | 85 educational pills by financial health profile, review quiz, and weekly streak |
| **Studio** | Admin panel protected by a separate password |
| **Special Reimbursement** | Corporate mileage, fuel, tolls, and travel expense tracking with exportable PDF |

## Stack

- **Next.js 16.2.6** — App Router, Server Components, Server Actions, Turbopack
- **Prisma v7** — ORM with native PostgreSQL adapter
- **PostgreSQL 18** — containerized database via Docker (named volumes, persistent data)
- **Docker** — two isolated environments: Dev (port 3000) and Prod (port 4000)
- **Tailwind CSS v4** — design system via `@theme` in `globals.css`
- **React 19** — with `useTransition` for async actions
- **bcryptjs** — password hashing with no native dependencies

## How to run

The project runs entirely via Docker — database and application in isolated containers.

```bash
# 1. Copy the variables template and fill in your credentials
cp .env.docker.example .env

# 2. Start the development environment (database + app with live reload)
npm run docker:dev
```

Visit `http://localhost:3000`.

### Production environment

```bash
# Build + database + migrate (automatic) + app
npm run docker:up
```

Visit `http://localhost:4000`.

### Useful commands

```bash
npm run docker:logs    # follow logs in real time
npm run docker:down    # stop all containers
```

## Technical documentation

For full details on architecture, database schema, relationships, categories, and technical decisions, see [`DOCUMENTATION.en.md`](./DOCUMENTATION.en.md).

---

*v1.15.4 · July 2026 · Personal project in active development.*
