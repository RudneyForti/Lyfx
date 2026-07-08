# Ly*fx* — Life Fixed

> [Read in English](./README.en.md)

> Plataforma de controle de finanças pessoais construída para quem quer entender seu dinheiro, mudar comportamentos e tomar decisões com clareza.

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-v7-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-containerizado-2496ED?style=flat-square&logo=docker&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?style=flat-square&logo=tailwindcss)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Version](https://img.shields.io/badge/version-1.15.3-22D3EE?style=flat-square)

---

## O que é

O Lyfx aplica o conceito do **DRE (Demonstrativo de Resultado do Exercício)** — usado por empresas — para as finanças pessoais. Cada transação é classificada por tipo e categoria, gerando uma visão clara de receitas, despesas e resultado mensal.

## Módulos

| Módulo | Descrição |
|---|---|
| **Dashboard** | DRE pessoal em tempo real, KPIs, tendência de 6 meses, metas e score de saúde |
| **Transações** | CRUD com categorias, tags, recorrência e parcelamento |
| **Orçamento** | Tetos de gasto por categoria com acompanhamento mensal |
| **Metas** | Objetivos com parcelas automáticas e análise de viabilidade |
| **Projeções** | 12 meses de compromissos recorrentes à frente |
| **Contas Fixas** | Visão das despesas fixas mensais e provisão sazonal |
| **Plano Mensal** | Calendário de lançamentos do mês |
| **Passivos** | Dívidas com plano de quitação pelo método avalanche |
| **Instituições** | Bancos e fintechs com contas e saldos vinculados |
| **Bens e Imóveis** | Imóveis, veículos e outros bens com impostos e despesas associadas |
| **Alertas e Notificações** | Alertas financeiros automáticos + notificações do sistema com sino, badge e central de leitura |
| **Saúde Financeira** | Score 0–100 em 4 dimensões com perfil evolutivo |
| **Relatórios** | DRE detalhado por período com percentuais sobre a receita |
| **Reembolsos** | Rastreamento de despesas reembolsáveis e seu recebimento |
| **Tags** | Etiquetas personalizadas por transação |
| **Perfil** | Dados pessoais, endereço com auto-fill por CEP e troca de senha |
| **Educação** | 85 pílulas pedagógicas por perfil de saúde financeira, quiz de fixação e streak semanal |
| **Studio** | Painel de administração protegido por senha separada |
| **Reembolso Especial** | Controle corporativo de KM, combustível, pedágios e despesas de viagem com PDF exportável |

## Stack

- **Next.js 16.2.6** — App Router, Server Components, Server Actions, Turbopack
- **Prisma v7** — ORM com adapter nativo para PostgreSQL
- **PostgreSQL 18** — banco containerizado via Docker (volumes nomeados, dados persistentes)
- **Docker** — dois ambientes isolados: Dev (porta 3000) e Prod (porta 4000)
- **Tailwind CSS v4** — design system via `@theme` em `globals.css`
- **React 19** — com `useTransition` para ações assíncronas
- **bcryptjs** — hash de senhas sem dependências nativas

## Como rodar

O projeto roda inteiramente via Docker — banco de dados e aplicação em containers isolados.

```bash
# 1. Copiar o template de variáveis e preencher com suas credenciais
cp .env.docker.example .env

# 2. Subir o ambiente de desenvolvimento (banco + app com live reload)
npm run docker:dev
```

Acesse `http://localhost:3000`.

### Ambiente de produção

```bash
# Build + banco + migrate (automático) + app
npm run docker:up
```

Acesse `http://localhost:4000`.

### Comandos úteis

```bash
npm run docker:logs    # acompanhar logs em tempo real
npm run docker:down    # parar todos os containers
```

## Documentação técnica

Para detalhes completos sobre arquitetura, schema do banco, relacionamentos, categorias e decisões técnicas, veja [`DOCUMENTATION.md`](./DOCUMENTATION.md).

---

*v1.15.3 · Julho 2026 · Projeto pessoal em desenvolvimento ativo.*
