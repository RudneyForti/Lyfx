# Lyfx — Documentação Técnica
> Life Fixed · v0.1 · Maio 2026

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Técnica](#2-stack-técnica)
3. [Schema do Banco de Dados](#3-schema-do-banco-de-dados)
4. [Tabela de Relacionamentos](#4-tabela-de-relacionamentos)
5. [Modelo de Categorias](#5-modelo-de-categorias)
6. [Funcionalidades](#6-funcionalidades)
7. [Interações entre Módulos](#7-interações-entre-módulos)
8. [Autenticação e Sessão](#8-autenticação-e-sessão)
9. [Arquitetura de Arquivos](#9-arquitetura-de-arquivos)
10. [Decisões Arquiteturais](#10-decisões-arquiteturais)
11. [Próximos Passos](#11-próximos-passos)

---

## 1. Visão Geral

O **Lyfx** é uma aplicação de finanças pessoais estruturada como uma **DRE (Demonstração do Resultado do Exercício) individual**. A premissa central é trazer para o contexto pessoal a mesma clareza analítica que empresas usam para entender suas receitas e despesas.

### Problema que resolve

A maioria dos apps de finanças pessoais registra lançamentos, mas não oferece **diagnóstico**. O Lyfx organiza cada real dentro de uma taxonomia de categorias que permite ao usuário entender não apenas *quanto* gastou, mas *qual tipo de gasto* foi — fixo, variável, comprometido, sazonal, imprevisível ou intencional.

### Público-alvo

Pessoa física que deseja controle financeiro com visão analítica, sem depender de planilhas ou ferramentas genéricas.

### Modelo de distribuição

Atualmente configurado como aplicação single-user local. Arquitetura prevista para evolução para SaaS multi-tenant (ver seção de decisões arquiteturais).

---

## 2. Stack Técnica

### Framework principal

| Tecnologia | Versão | Justificativa |
|---|---|---|
| **Next.js** | 16.2.6 | App Router com Server Components permite buscar dados diretamente no servidor sem APIs REST intermediárias. Server Actions eliminam a necessidade de endpoints para mutações. Turbopack garante HMR instantâneo em desenvolvimento. |
| **React** | 19 | `useTransition` permite atualizar estado assíncrono sem bloquear a UI. `useOptimistic` (disponível) para feedback imediato em futuras interações. |
| **TypeScript** | 5.x | Tipagem estática no schema de dados, categorias e tipos de transação evita classes inteiras de bugs em runtime. |

### Banco de dados e ORM

| Tecnologia | Versão | Justificativa |
|---|---|---|
| **SQLite** | — | Banco embarcado, zero configuração de servidor, arquivo único (`dev.db`). Ideal para uso local/single-user e para futura portabilidade. Migração para PostgreSQL é trivial com Prisma. |
| **Prisma** | 7.8.0 | ORM type-safe que gera um client TypeScript a partir do schema. Queries com autocomplete e validação em tempo de compilação. |
| **@prisma/adapter-better-sqlite3** | — | Adaptador necessário na v7 do Prisma para SQLite — a datasource não recebe mais `url` diretamente; o adapter é instanciado em `lib/db.ts` e injetado no client. |
| **better-sqlite3** | — | Driver SQLite síncrono de alta performance para Node.js. |

### Estilização

| Tecnologia | Versão | Justificativa |
|---|---|---|
| **Tailwind CSS** | v4 | Configurado via `@theme inline {}` no `globals.css` — sem `tailwind.config.ts`. Tokens de design (cores, tipografia, espaçamentos) definidos como variáveis CSS nativas, consumíveis tanto por Tailwind quanto por `style={{}}` inline. |
| **CSS Variables** | — | Design system definido em `globals.css` com tokens como `--color-cyan`, `--color-bg2`, `--font-display`. Garante consistência entre componentes Tailwind e estilos inline. |

### Tipografia

| Fonte | Uso | Justificativa |
|---|---|---|
| **Playfair Display** | Títulos, números destacados, logotipo | Serifada italiana com peso e personalidade. Cria contraste visual com a interface técnica. Usada em itálico para headings e valores financeiros. |
| **Inter** | Corpo, labels, interface | Sans-serif neutro e altamente legível em tamanhos pequenos. Padrão da indústria para interfaces de dados. |

### Autenticação

| Tecnologia | Justificativa |
|---|---|
| **bcryptjs** | Hash de senhas com salt automático (fator 10). Escolhido sobre `bcrypt` nativo por ser pure JavaScript — sem dependências de compilação nativa (node-gyp). |
| **Cookie httpOnly** | Sessão armazenada como cookie `lyfx_session` com `httpOnly: true`, `sameSite: lax`, `maxAge: 30 dias`. Simples, seguro e compatível com SSR sem JWT. |

### Ícones

| Tecnologia | Justificativa |
|---|---|
| **@tabler/icons-react** | Biblioteca com mais de 5.000 ícones SVG consistentes. Cada ícone é um componente React com props `size` e `className`. Zero dependência de font-loading. |

### Roteamento e proteção

| Arquivo | Função |
|---|---|
| `proxy.ts` | Substituto do `middleware.ts` (convenção depreciada no Next.js 16). Roda no Edge Runtime. Verifica o cookie `lyfx_session` e redireciona rotas protegidas para `/login`. Não acessa o banco (limitação do Edge). |

---

## 3. Schema do Banco de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                           USER                                  │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ name            │ String       │ Nome de exibição               │
│ email           │ String?      │ Único, opcional                │
│ password        │ String       │ Hash bcrypt                    │
│ avatar          │ String?      │ Base64 JPEG 200×200px          │
│ age             │ Int?         │ Idade                          │
│ gender          │ String?      │ Gênero                         │
│ address         │ String?      │ Endereço                       │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        TRANSACTION                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ date            │ DateTime     │ Data do lançamento             │
│ description     │ String       │ Título                         │
│ amount          │ Float        │ Valor em reais (positivo)      │
│ type            │ String       │ "income" | "expense"           │
│ category        │ String       │ Ver modelo de categorias       │
│ subcategory     │ String?      │ Subdivisão livre               │
│ notes           │ String?      │ Observações                    │
│ recurrence      │ String       │ "once"|"monthly"|"annual"      │
│ recurrenceEndsAt│ DateTime?    │ Fim de parcelamentos           │
│ context         │ String?      │ "personal"|"professional"      │
│ reimbursable    │ Boolean      │ Despesa reembolsável           │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ tags            │ Relation     │ → TransactionTag[]             │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           TAG                                   │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ name            │ String       │ Único globalmente              │
│ color           │ String       │ Hex, ex: #22D3EE               │
│ icon            │ String       │ Chave do TAG_ICONS             │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ transactions    │ Relation     │ → TransactionTag[]             │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TRANSACTION_TAG (pivot)                    │
├─────────────────┬──────────────┬────────────────────────────────┤
│ transactionId   │ String (FK)  │ → Transaction.id (cascade)     │
│ tagId           │ String (FK)  │ → Tag.id (cascade)             │
│                 │ PK composta  │ [transactionId, tagId]         │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          BUDGET                                 │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ category        │ String       │ Único — mesma key de category  │
│ amount          │ Float        │ Limite mensal em reais         │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           GOAL                                  │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ name            │ String       │ Nome do objetivo               │
│ description     │ String?      │ Contexto livre                 │
│ targetAmount    │ Float        │ Valor total a atingir          │
│ currentAmount   │ Float        │ Acumulado via pagamentos       │
│ deadline        │ DateTime     │ Prazo final                    │
│ color           │ String       │ Hex para identificação visual  │
│ icon            │ String       │ Chave de ícone                 │
│ status          │ String       │ "active"|"completed"|"paused"  │
│ monthlyAmount   │ Float        │ Cobrança mensal calculada      │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ payments        │ Relation     │ → GoalPayment[]                │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        GOAL_PAYMENT                             │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ goalId          │ String (FK)  │ → Goal.id (cascade)            │
│ dueDate         │ DateTime     │ Mês de vencimento              │
│ amount          │ Float        │ Valor da cobrança              │
│ paid            │ Boolean      │ false por padrão               │
│ paidAt          │ DateTime?    │ Preenchido ao marcar pago      │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘
```

### Diagrama de relações

```
USER
 │ (sem FK nos dados — arquitetura atual single-user)
 │
 ├── TRANSACTION ──────────< TRANSACTION_TAG >────── TAG
 │        │
 │        └── recurrence + recurrenceEndsAt
 │               └── alimenta → PROJECTIONS (lógica, sem FK)
 │
 ├── BUDGET
 │      └── category (mesma key de Transaction.category — lógica, sem FK)
 │
 └── GOAL ──────────< GOAL_PAYMENT
          │
          └── monthlyAmount = targetAmount / meses_até_deadline
```

---

## 4. Tabela de Relacionamentos

| Tabela A | Tabela B | Tipo | Chave | Comportamento |
|---|---|---|---|---|
| Transaction | Tag | N:N | via TransactionTag | Uma transação pode ter muitas tags; uma tag pode estar em muitas transações |
| TransactionTag | Transaction | N:1 | transactionId → Transaction.id | onDelete: Cascade — deletar transação remove os vínculos |
| TransactionTag | Tag | N:1 | tagId → Tag.id | onDelete: Cascade — deletar tag remove os vínculos |
| Goal | GoalPayment | 1:N | goalId → Goal.id | onDelete: Cascade — deletar meta remove todas as cobranças |
| Budget | Transaction | Lógica | category (string) | Budget.category = Transaction.category — sem FK no banco; join feito em aplicação |
| Transaction | Projections | Lógica | recurrence + recurrenceEndsAt | Transações recorrentes são extrapoladas para 12 meses em memória |

### Observação sobre isolamento

Atualmente **não existe** `userId` nas tabelas de dados (Transaction, Tag, Budget, Goal). Todos os dados são globais dentro do banco. A arquitetura está documentada e planejada para receber isolamento por usuário em versão futura (ver seção de próximos passos).

---

## 5. Modelo de Categorias

O coração analítico do Lyfx é sua taxonomia de categorias, que distingue não apenas receita de despesa, mas o **perfil de cada lançamento**.

### Receitas (type: "income")

| Valor | Label | Exemplos |
|---|---|---|
| `credit_fixed` | Fixo | Salário, pró-labore |
| `credit_variable` | Variável | Freelas, reembolsos, vendas pontuais |

### Despesas (type: "expense")

| Valor | Label | Exemplos | Característica |
|---|---|---|---|
| `debit_fixed` | Fixo | Aluguel, condomínio, assinaturas | Valor e frequência previsíveis |
| `debit_variable` | Variável | Alimentação, combustível, lazer | Frequência previsível, valor variável |
| `debit_committed` | Comprometido | Parcelas de cartão, cheque especial | Dívida já assumida |
| `debit_longterm` | Longo Prazo | Consignado, financiamentos | Horizonte de anos |
| `debit_seasonal` | Sazonal | IPVA, seguro, natal | Previsível mas não mensal |
| `debit_unexpected` | Imprevisível | Emergências | Não planejável |
| `debit_intentional` | Alocação Intencional | Reserva, quitação, investimento | Escolha ativa de destino |

Esta distinção permite que a DRE mostre não apenas o saldo, mas a **qualidade financeira** do período.

---

## 6. Funcionalidades

### 6.1 Landing Page (`/`)

Página pública de apresentação do produto.

- **Acesso**: qualquer visitante sem sessão
- **Comportamento com sessão ativa**: redireciona para `/dashboard`
- **Seções**: Navbar sticky, Hero com mockup do dashboard, Marquee com termos do produto, 4 cards de features com mini-mockups interativos, seção "Como funciona" em 3 passos, FAQ com accordion (6 perguntas), CTA final, Footer
- **Marquee**: animação CSS contínua com termos do Lyfx
- **Navegação**: âncoras para `#funcionalidades`, `#como-funciona`, `#faq`

### 6.2 Autenticação (`/login`)

Formulário unificado de login e criação de conta.

- **Modo setup** (sem usuário no banco): exibe campos nome + email + senha + confirmar senha
- **Modo login** (usuário existente): exibe campos email + senha + lembrar de mim + esqueci a senha
- **Toggle de modo**: o usuário pode alternar entre login e setup via link, independente do estado do banco
- **Validações client-side**: campos obrigatórios, senha mínima 6 caracteres, confirmação de senha
- **Animação shake**: botão treme ao tentar submeter com erro
- **Toast**: notificações para ações secundárias (social login em breve, esqueci a senha)
- **Modal "Esqueci a senha"**: explica que o Lyfx não envia e-mail e orienta redefinição via perfil
- **Estado de sucesso**: botão muda para verde com checkmark após login bem-sucedido
- **Painel esquerdo**: dot grid animado, watermark f(x), KPIs estáticos, pill de insight, mês atual
- **Server Actions**: `setup()` para criação, `login()` para autenticação

### 6.3 Dashboard (`/dashboard`)

Visão macro do período selecionado.

- **Navegação de mês**: avançar/recuar meses com atualização dos dados
- **KPIs principais**: receita total, despesa total, resultado (receita − despesa)
- **DRE resumida**: breakdown por categoria (crédito fixo, crédito variável, cada tipo de débito)
- **Gráfico de barras**: histórico mensal comparativo
- **Transações recentes**: últimos lançamentos do período selecionado

### 6.4 Transações (`/transactions`)

Listagem e criação de lançamentos financeiros.

- **Formulário de criação**: tipo (receita/despesa), data, descrição, valor, categoria, subcategoria, notas, recorrência, contexto, reembolsável, tags
- **Recorrência**: `once` (único), `monthly` (mensal com opcional data de término), `annual` (anual)
- **Campo `recurrenceEndsAt`**: aparece quando recorrência = mensal; permite definir fim de parcelamentos
- **TagPicker**: seletor inline de tags com criação rápida (nome + cor + ícone)
- **Edição**: modal de edição com todos os mesmos campos
- **Exclusão**: com confirmação
- **Filtro por mês**: herda o mês selecionado no contexto da navegação

### 6.5 Orçamento (`/budget`)

Limites mensais por categoria de despesa.

- **Criação/edição**: define um teto de gasto por categoria
- **Upsert**: criar ou atualizar usa a mesma operação (category é unique)
- **Progress bars**: verde (< 70%), amarelo (70–99%), vermelho (≥ 100%)
- **Totalizadores**: soma dos limites, soma do gasto atual, percentual global
- **Navegação de mês**: compara gasto real do mês vs limite definido
- **Interação com Transaction**: o gasto real é calculado somando transações do tipo `expense` daquele mês na categoria correspondente

### 6.6 Contas Fixas (`/fixed-expenses`)

Visão dedicada a todos os lançamentos com `recurrence !== "once"`.

- **3 cards de resumo**: total mensal recorrente, total anual eventual, projeção 12 meses
- **Breakdown por tags**: chips mostrando quanto cada tag representa nos fixos
- **Lista mensal**: transações mensais ordenadas por valor
- **Lista anual**: transações anuais com badge do mês em que ocorrem
- **Projeção 12 meses**: gráfico de barras horizontais mostrando o compromisso de cada mês. Barras vermelhas = base mensal. Picos amarelos = meses com lançamentos anuais

### 6.7 Metas (`/goals`)

Sistema de objetivos financeiros com cobrança automática.

- **Criação de meta**: nome, descrição, valor alvo, prazo (input type="month"), cor
- **Cálculo automático**: ao definir valor e prazo, o sistema exibe em tempo real a cobrança mensal necessária e a viabilidade com base na sobra média dos últimos 3 meses
- **Classificação de viabilidade**:
  - ≤ 30% da sobra → "Cabe folgado"
  - 31–60% → "Factível"
  - 61–100% → "Apertado — considere estender o prazo"
  - > 100% → "Inviável — você precisaria de R$ X/mês a mais"
- **Geração automática de cobranças**: ao criar a meta, o sistema gera um `GoalPayment` para cada mês entre agora e o prazo
- **Marcação de pagamento**: o usuário clica em cada cobrança para marcar como paga ou não paga. `currentAmount` da meta é recalculado automaticamente
- **Cobranças em atraso**: cobranças não pagas com `dueDate` no passado aparecem destacadas em vermelho com badge "Em atraso"
- **Status da meta**: `active` → `completed` automaticamente quando `currentAmount >= targetAmount`
- **Resumo no topo**: total em metas ativas, total já guardado, comprometimento mensal como % da sobra

### 6.8 Projeções (`/projections`)

Simulação dos próximos 12 meses com base em recorrências.

- **Fonte de dados**: todas as transações com `recurrence = "monthly"` ou `"annual"`
- **Respeito ao `recurrenceEndsAt`**: parcelamentos com data de término não aparecem após o mês de fim
- **Cards de resumo**: livre acumulado no ano, média mensal livre, meses no vermelho
- **Gráfico de barras macro**: 12 colunas clicáveis. Cada coluna tem 3 barras — receita comprometida (cyan), despesa comprometida (vermelho), saldo livre (verde)
- **Detalhe mensal**: ao clicar em um mês, o painel inferior mostra o breakdown completo — cada entrada e saída comprometida com badge "Anual" nos lançamentos anuais
- **Distinção importante**: projeções mostram apenas o que está **comprometido** (recorrente), não simula entradas/saídas variáveis

### 6.9 Tags (`/tags`)

Gerenciamento de etiquetas.

- **Criação**: nome único, cor (paleta de 8 cores), ícone (12 opções do Tabler Icons)
- **Preview em tempo real**: chip de preview atualiza conforme o usuário escolhe cor e ícone
- **Edição inline**: nome, cor e ícone editáveis
- **Exclusão**: com cascade automático nos vínculos (TransactionTag)
- **TAG_ICONS disponíveis**: tag, briefcase, home, car, heart, star, bolt, cart, school, plane, laptop, coffee

### 6.10 Perfil (`/profile`)

Edição dos dados pessoais e credenciais.

- **Upload de avatar**: seleção de imagem → redimensionamento client-side via Canvas API para 200×200px → conversão para JPEG base64 → armazenamento no banco
- **Campos editáveis**: nome, e-mail, idade, gênero, endereço
- **Alteração de senha**: exige senha atual (verificada com bcrypt.compare), nova senha (mínimo 6 chars)
- **Acesso ao Studio**: botão na seção "Avançado" que leva para `/studio`
- **Sidebar**: usa o nome e avatar do perfil via prop injetada pelo `AppLayout`

### 6.11 Studio (`/studio`)

Painel administrativo protegido por senha.

- **Autenticação**: senha configurada em `.env` → `ADMIN_SECRET`. Cookie `lyfx_admin` com expiração de 2 horas e `path: "/studio"`
- **Acesso**: `/studio` (independente da sessão do app principal), também acessível via botão no Perfil
- **Aba Schema**: visualização de todas as 7 tabelas com campos, tipos e descrições. Expansível por tabela. Mostra relações entre modelos
- **Aba Usuários**: lista de usuários com avatar, nome, e-mail, data de cadastro. Função de reset de senha (inline, com confirmação)
- **Aba Dados**: contadores de transações, tags e orçamentos. Tabela das 5 transações mais recentes com tipo, categoria e valor

---

## 7. Interações entre Módulos

```
TRANSACTION
  ├── alimenta → DASHBOARD (getDRESummary agrupa por categoria/tipo)
  ├── alimenta → BUDGET (gasto real vs limite por categoria)
  ├── alimenta → FIXED-EXPENSES (filtra recurrence !== "once")
  ├── alimenta → PROJECTIONS (filtra recurrence "monthly"/"annual" + recurrenceEndsAt)
  ├── alimenta → GOALS (sobra média 3 meses para cálculo de viabilidade)
  └── vincula → TAG (via TransactionTag, N:N)

TAG
  ├── vincula → TRANSACTION (via TransactionTag)
  └── aparece → FIXED-EXPENSES (breakdown de tags nos fixos)

BUDGET
  └── compara com → TRANSACTION (join lógico por category string)

GOAL
  ├── gera → GOAL_PAYMENT (N cobranças ao criar)
  └── atualiza → currentAmount (soma de GoalPayments paid=true)

GOAL_PAYMENT
  └── controla → GOAL.status (active → completed quando currentAmount >= targetAmount)

USER
  ├── autentica → toda a aplicação (via cookie lyfx_session)
  └── exibido → SIDEBAR (nome + avatar via AppLayout)

STUDIO
  ├── lê → USER (lista, reset de senha)
  ├── lê → TRANSACTION (contagem + recentes)
  ├── lê → TAG (contagem)
  └── lê → BUDGET (contagem)
```

### Fluxo de dados — criação de transação recorrente com parcelamento

```
Usuário preenche formulário
  └── recurrence = "monthly" + recurrenceEndsAt = "2026-12"
        └── createTransaction() → salva no banco
              └── getProjections() lê a transação
                    └── para cada mês até recurrenceEndsAt → aparece na projeção
                          └── após recurrenceEndsAt → não aparece mais
```

### Fluxo de dados — criação de meta

```
Usuário define nome + valor + prazo
  └── createGoal()
        ├── calcula monthlyAmount = targetAmount / meses
        ├── avalia viabilidade vs avgMonthlyBalance (média 3 meses)
        ├── cria registro Goal
        └── cria N registros GoalPayment (1 por mês até o prazo)
              └── usuário marca GoalPayments como pagos
                    └── markPayment() recalcula currentAmount
                          └── se currentAmount >= targetAmount → status = "completed"
```

---

## 8. Autenticação e Sessão

### Fluxo completo

```
1. Usuário acessa qualquer rota protegida
2. proxy.ts (Edge Runtime) verifica cookie "lyfx_session"
   ├── Sem cookie + rota não pública → redirect /login
   └── Com cookie + rota /login ou / → redirect /dashboard

3. AppLayout (Server Component) verifica novamente:
   ├── Sem userId no cookie → redirect /login
   ├── userId não encontrado no banco → redirect /api/clear-session
   │     └── Route Handler deleta cookie + redirect /login (evita loop)
   └── Usuário encontrado → renderiza Sidebar + children

4. Login bem-sucedido:
   └── setSession(user.id) → cookie httpOnly, 30 dias

5. Logout:
   └── clearSession() → deleta cookie → redirect /login
```

### Segurança

- Senhas nunca armazenadas em texto plano — sempre hash bcrypt (salt factor 10)
- Cookie `httpOnly: true` — inacessível via JavaScript no browser
- Cookie `secure: true` em produção — apenas HTTPS
- `sameSite: lax` — proteção contra CSRF
- Proxy não acessa o banco (Edge Runtime) — verifica apenas a existência do cookie, não sua validade
- Validação completa de existência do usuário no `AppLayout` (Node.js runtime, com acesso ao banco)

### Studio (modo dev)

- Cookie separado: `lyfx_admin` com `path: "/studio"` (não vaza para outras rotas)
- Expiração curta: 2 horas
- Senha via variável de ambiente `ADMIN_SECRET` — nunca no código
- Comparação por igualdade direta (sem hash) — senha é um segredo de operação, não de usuário

---

## 9. Arquitetura de Arquivos

```
lyfx/
├── app/
│   ├── (app)/                    # Rotas protegidas (requerem sessão)
│   │   ├── layout.tsx            # AppLayout: verifica sessão + injeta Sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── budget/page.tsx
│   │   ├── fixed-expenses/page.tsx
│   │   ├── goals/page.tsx
│   │   ├── projections/page.tsx
│   │   ├── planning/page.tsx
│   │   ├── reports/page.tsx      # (pendente)
│   │   ├── tags/page.tsx
│   │   ├── profile/page.tsx
│   │   └── education/page.tsx    # (pendente)
│   ├── actions/                  # Server Actions — mutações e queries
│   │   ├── transactions.ts
│   │   ├── tags.ts
│   │   ├── budgets.ts
│   │   ├── goals.ts
│   │   ├── projections.ts
│   │   └── user.ts
│   ├── api/
│   │   └── clear-session/route.ts  # Route Handler — limpa cookie órfão
│   ├── login/
│   │   ├── page.tsx              # Server Component — injeta hasUser + monthLabel
│   │   ├── LoginForm.tsx         # Client Component — formulário de auth
│   │   └── actions.ts            # setup(), login(), logout()
│   ├── studio/
│   │   ├── page.tsx              # Verifica cookie admin, renderiza login ou painel
│   │   ├── StudioClient.tsx      # UI completa do Studio
│   │   └── actions.ts            # adminLogin, getStudioData, adminResetPassword
│   ├── page.tsx                  # Landing page (rota pública /)
│   ├── layout.tsx                # Root layout — fontes, globals
│   └── globals.css               # Design system, tokens, keyframes
│
├── components/
│   ├── landing/LandingPage.tsx
│   ├── layout/Sidebar.tsx
│   ├── transactions/
│   │   ├── TransactionForm.tsx
│   │   ├── EditTransactionModal.tsx
│   │   └── TransactionList.tsx
│   ├── budget/BudgetView.tsx
│   ├── fixed-expenses/FixedExpensesView.tsx
│   ├── goals/GoalsView.tsx
│   ├── projections/ProjectionsView.tsx
│   ├── tags/
│   │   ├── TagPicker.tsx
│   │   └── TagsManager.tsx
│   └── profile/ProfileForm.tsx
│
├── lib/
│   ├── db.ts                     # Singleton Prisma com adapter SQLite
│   ├── session.ts                # getSessionUserId, setSession, clearSession
│   ├── types.ts                  # Interfaces TypeScript do domínio
│   ├── categories.ts             # Definição das 9 categorias com labels e exemplos
│   ├── tag-icons.ts              # Mapa TAG_ICONS + paleta TAG_COLORS
│   ├── utils.ts                  # cn() para merge de classNames
│   └── generated/prisma/         # Client gerado pelo Prisma (não editar)
│
├── prisma/
│   ├── schema.prisma             # Fonte da verdade do banco
│   └── prisma.config.ts          # Configuração do Prisma v7
│
├── proxy.ts                      # Proteção de rotas (Edge Runtime)
├── .env                          # DATABASE_URL + ADMIN_SECRET
└── dev.db                        # Banco SQLite (não versionar)
```

---

## 10. Decisões Arquiteturais

### Server Actions em vez de API Routes

**Decisão**: todas as mutações (criar transação, criar meta, etc.) usam Server Actions (`"use server"`) chamadas diretamente dos Client Components.

**Motivo**: elimina a camada de API REST, reduz boilerplate, mantém type safety end-to-end. O Next.js serializa os argumentos automaticamente. Para o Lyfx, que não tem clientes externos consumindo uma API, não há vantagem em expor endpoints REST.

### Cookie simples em vez de JWT ou iron-session

**Decisão**: sessão armazenada como `userId` diretamente no cookie, sem criptografia adicional.

**Motivo**: app pessoal local, sem requisito de sessão stateless distribuída. O cookie é httpOnly (não acessível por XSS) e o AppLayout valida o userId contra o banco em cada request. Iron-session ou JWT adicionariam complexidade sem benefício real neste contexto.

### Avatar em Base64 no banco

**Decisão**: avatar armazenado como string base64 no campo `User.avatar`.

**Motivo**: eliminação de dependência de bucket de storage (S3, Cloudinary). Aceitável para imagens 200×200px (~30KB após compressão JPEG 85%). O resize é feito client-side via Canvas API antes do upload.

### Sem isolamento de dados por usuário (ainda)

**Decisão**: Transaction, Tag, Budget e Goal não possuem `userId`.

**Motivo**: app de uso pessoal single-user. Adicionar userId agora não entregaria valor. A decisão é reversível com uma migration bem planejada (plano documentado em `memory/project_lyfx_isolation.md`).

**Impacto**: se criado um segundo usuário, ambos veriam os mesmos dados.

### Proxy em vez de Middleware

**Decisão**: arquivo `proxy.ts` com export `proxy()` em vez de `middleware.ts`.

**Motivo**: convenção `middleware.ts` foi depreciada no Next.js 16. A convenção correta é `proxy.ts` com export nomeado `proxy`.

### Prisma v7 com adapter explícito

**Decisão**: `PrismaBetterSqlite3` instanciado em `lib/db.ts` e passado via `{ adapter }` ao `PrismaClient`.

**Motivo**: Prisma v7 removeu o suporte nativo ao SQLite inline na datasource. O novo modelo requer um adapter explícito. Isso também habilita futura troca para PostgreSQL sem mudança no código de queries — apenas a instanciação do adapter muda.

---

## 11. Próximos Passos

### Imediatos (próximas sessões)

| # | Tarefa | Complexidade | Dependências |
|---|---|---|---|
| 1 | **Página de Educação** (`/education`) | Média | Nenhuma |
| 2 | **Página de Relatórios** (`/reports`) | Alta | Transactions, Tags, Budget |
| 3 | **Isolamento de dados por userId** | Alta | Migration + todas as actions |

### Roadmap de produto

| Funcionalidade | Descrição |
|---|---|
| Importação de extratos | CSV/OFX de bancos brasileiros |
| App mobile nativo | iOS + Android |
| Modo SaaS | Multi-tenant com isolamento por usuário |
| Notificações | Metas em atraso, orçamento próximo do limite |
| Relatório de patrimônio | Evolução do saldo ao longo do tempo |

### Isolamento de dados — plano técnico

Quando implementado, o plano é:

1. Adicionar `userId String` em `Transaction`, `Tag`, `Budget`, `Goal`
2. Alterar constraints únicas: `Tag.name` → `@@unique([userId, name])`, `Budget.category` → `@@unique([userId, category])`
3. Atualizar todas as queries nas 4 actions para incluir `where: { userId }`
4. Migration manual: buscar o único User existente e setar seu id em todos os registros antes de aplicar o `NOT NULL`
5. Estimativa: ~1h de desenvolvimento

---

*Documentação gerada em 19/05/2026. Reflete o estado do sistema na versão 0.1.*
