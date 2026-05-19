# Lyfx — Documentação Técnica
> Life Fixed · v0.9.0 · Maio 2026

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
│ type            │ String       │ "credit" | "debit"             │
│ category        │ String       │ Ver modelo de categorias       │
│ subcategory     │ String?      │ Subdivisão livre               │
│ notes           │ String?      │ Observações                    │
│ recurrence      │ String       │ "once"|"monthly"|"yearly"      │
│ recurrenceEndsAt│ DateTime?    │ Fim de recorrência             │
│ installmentGroupId│ String?    │ UUID compartilhado do grupo    │
│ installmentNumber │ Int?       │ Número desta parcela (1-N)     │
│ installmentTotal  │ Int?       │ Total de parcelas do grupo     │
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

┌─────────────────────────────────────────────────────────────────┐
│                         SETTINGS                                │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ expectedMonthlyIncome│ Float   │ Receita mensal esperada        │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Nota: tabela singleton — sempre um único registro, criado lazily no primeiro acesso via getOrCreate().

┌─────────────────────────────────────────────────────────────────┐
│                        LIABILITY                                │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ name            │ String       │ Nome da dívida                 │
│ type            │ String       │ Ver tipos abaixo               │
│ currentBalance  │ Float        │ Saldo devedor atual            │
│ interestRate    │ Float        │ Taxa de juros % ao mês         │
│ minimumPayment  │ Float        │ Parcela mínima mensal          │
│ creditor        │ String?      │ Nome do credor                 │
│ notes           │ String?      │ Observações livres             │
│ status          │ String       │ "active" | "paid_off"          │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Tipos de liability: "cheque_especial" | "rotativo" | "emprestimo" | "financiamento" | "outro"
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
 ├── GOAL ──────────< GOAL_PAYMENT
 │        │
 │        └── monthlyAmount = targetAmount / meses_até_deadline
 │
 └── LIABILITY  (sem FK — entidade independente)
          └── status: active | paid_off
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

### Receitas (type: "credit")

| Valor | Label | Exemplos |
|---|---|---|
| `credit_fixed` | Fixo | Salário, pró-labore |
| `credit_variable` | Variável | Freelas, reembolsos, vendas pontuais |

### Despesas (type: "debit")

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

Centro de comando financeiro do período atual. Redesenhado na v0.5 para expor diagnóstico, não apenas registro.

#### KPI Cards
Quatro métricas no topo da página:
- **Saldo**: resultado líquido do mês (receita − todas as despesas). Verde se positivo, vermelho se negativo
- **Receita**: soma de todos os créditos do mês
- **Gastos**: soma de todas as despesas do mês
- **Poupado**: valor alocado em `debit_longterm` — o que foi direcionado para longo prazo

#### DRE em cascata com margens intermediárias
A principal evolução analítica da plataforma. Em vez de exibir apenas totais por categoria, o DRE agora mostra **três margens progressivas** após cada camada de dedução:

| Nível | Cálculo | Significado |
|---|---|---|
| **Sobra após fixos** | Receita − Despesas fixas | Quanto sobra após pagar as obrigações certas |
| **Margem operacional** | Sobra após fixos − Despesas variáveis | Quanto sobra após o custo de vida recorrente |
| **Resultado operacional** | Margem operacional − Comprometido | Quanto sobra após honrar todas as dívidas ativas |

Cada margem é exibida com badge colorido (verde/vermelho) inline na linha de dedução correspondente. Isso transforma uma lista de gastos em um **diagnóstico financeiro em cascata**.

#### `DRESummary` — tipo atualizado
O tipo `DRESummary` em `lib/types.ts` ganhou dois campos:
- `margins: { afterFixed, afterVariable, afterCommitted, net }` — as quatro margens calculadas
- `saved: number` — atalho para `debits.longterm`, usado nos KPI cards

#### Lyfx Insight
Banner contextual gerado com base nas regras de prioridade:
1. Resultado negativo → alerta com valor do rombo
2. Comprometido > 35% da receita → alerta de dívida alta
3. Meta ativa + saldo livre → sugestão de redirecionamento
4. Taxa de poupança < 10% → sugestão de aumento
5. Mês saudável → confirmação positiva com taxa de poupança

#### Goals Mini Widget
Widget lateral com barra de progresso para cada meta ativa (até 4). Acesso direto para `/goals`.

#### Gráfico de tendência mensal
Barras dos últimos 6 meses de gastos. Mês atual destacado em cyan. Tooltip com receita, despesa e resultado ao passar o mouse.

#### Transações recentes
Últimos 8 lançamentos do mês, com acesso direto para `/transactions`.

#### Fonte de dados (`app/actions/dashboard.ts`)
Action dedicada que busca em paralelo: DRE summary, transações recentes, metas ativas, trend mensal (6 meses) e todas as tags — tudo em um único `Promise.all` para minimizar waterfalls.

### 6.4 Transações (`/transactions`)

Listagem e criação de lançamentos financeiros.

- **Formulário de criação**: tipo (crédito/débito), data, descrição, valor, categoria, notas, recorrência, tags
- **Recorrência**: `once` (único), `monthly` (mensal), `yearly` (anual)
- **Parcelamento**: modo dedicado no formulário — define valor total + número de parcelas. Cria N registros com `installmentGroupId` UUID compartilhado, `installmentNumber` e `installmentTotal`. Descrição recebe sufixo `(N/M)` automaticamente
- **TagPicker**: seletor inline de tags com criação rápida (nome + cor + ícone)
- **Interação de lista**: clicar em uma transação expande uma `ActionBar` animada (slide-down) com fundo vermelho no topo do card
- **ActionBar**: botões "Editar" (âmbar), "Só esta"/"Excluir" (vermelho), "Excluir Nx" (vermelho, apenas para parcelamentos), "×" fechar
- **Edição — 3 modos automáticos**:
  - `single`: transação pontual (`recurrence = "once"` sem `installmentGroupId`) — edita apenas o registro
  - `installment`: transação parcelada (`installmentGroupId` definido) — chama `updateFutureInstallments()`, altera apenas parcelas a partir de hoje; não expõe campo de data
  - `recurring`: recorrência (`recurrence !== "once"`) — edita o registro único; banner âmbar avisa que só afeta projeções futuras
- **Exclusão**: "Só esta" deleta o registro individual; "Excluir Nx" chama `deleteInstallmentGroup()` e remove todas as parcelas do grupo

### 6.5 Orçamento (`/budget`)

Plano financeiro mensal: receita esperada, alocações por categoria e balanço planejado vs real.

- **Receita esperada**: valor único global editável inline. Salvo em `Settings.expectedMonthlyIncome`. Comparado com receita real do mês selecionado via barra de progresso verde
- **Alocações por categoria**: substitui o conceito de "teto de gasto" por "alocação intencional" — para onde você planeja direcionar o dinheiro. Exibe `X% da receita esperada` abaixo do valor quando a receita está configurada
- **Upsert de alocação**: `setBudget(category, amount)` usa `upsert` (category é unique)
- **Progress bars por categoria**: verde (< 75%), amarelo (75–99%), vermelho (≥ 100%) — gasto vs alocado
- **Navegação de mês**: o gasto real filtra transações do mês selecionado client-side; alocações são globais (mesmo plano para todos os meses)
- **Balanço**: card com duas colunas — Planejado (receita esperada − total alocado) e Real (receita real − total gasto do mês)
- **Settings singleton**: `getSettings()` usa padrão get-or-create; registro criado automaticamente na primeira visita

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

Simulação dos próximos 12 meses com base em recorrências e parcelamentos.

- **Fonte de dados**: transações com `recurrence = "monthly"` ou `"yearly"` + transações com `installmentGroupId` (parcelas futuras individuais)
- **Respeito ao `recurrenceEndsAt`**: recorrências com data de término não aparecem após o mês de fim
- **Parcelamentos**: cada registro individual de parcela tem uma `date` própria — a projeção simplesmente distribui cada parcela no mês correto (sem extrapolação)
- **Conversão de tipo**: `tx.type` no banco é `"credit"/"debit"`; a projeção converte para `"income"/"expense"` internamente para o cálculo de saldo livre
- **Cards de resumo**: livre acumulado (soma dos meses positivos), média mensal livre, meses no vermelho
- **Gráfico de barras macro**: 12 colunas clicáveis — receita comprometida (cyan), despesa comprometida (vermelho), saldo livre (verde)
- **Detalhe mensal**: ao clicar em um mês, o painel inferior mostra o breakdown completo — cada entrada e saída com badge "Anual" nos lançamentos anuais
- **Distinção importante**: projeções mostram apenas o que está **comprometido** (recorrente + parcelas), não simula entradas/saídas variáveis

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

### 6.11 Saúde Financeira (`/health`)

Score diagnóstico com 4 dimensões e perfil evolutivo.

#### Score (0–100 pts)

| Dimensão | Peso | Critério máximo |
|---|---|---|
| Comprometimento | 30 pts | Comprometido ≤ 30% da receita |
| Poupança | 25 pts | Poupança ≥ 20% da receita |
| Resultado | 25 pts | Resultado líquido positivo |
| Reserva | 20 pts | ≥ 6 meses de reserva |

#### Perfis

| Score | Perfil | Cor |
|---|---|---|
| 0–39 | Em Recuperação | Vermelho `#F87171` |
| 40–59 | Estabilizado | Âmbar `#FBBF24` |
| 60–79 | Em Construção | Cyan `#22D3EE` |
| 80–100 | Livre | Verde `#4ADE80` |

- **Gauge SVG**: semicírculo animado mostrando o score atual
- **4 `DimensionCard`s**: pontuação por dimensão com barra de progresso e descrição contextual
- **Badge de perfil**: nome + faixa de pontos + "Faltam X pts para Y"
- **Tip banner**: dica priorizada baseada na dimensão de menor pontuação
- **Widget no dashboard**: `HealthScoreCard` no topo da coluna direita com score, perfil e link para `/health`

#### Fonte de dados (`app/actions/health.ts`)

- `getDRESummary(month, year)` — DRE do mês atual
- `db.transaction.aggregate` — acumulado all-time de `debit_longterm` como proxy de reserva
- Média de despesas dos últimos 3 meses completos → `reserveMonths = totalLongterm / avgMonthlyExpenses`
- Cálculo puro em `lib/health.ts` (`computeHealthScore`) — sem acesso ao banco

### 6.12 Passivos (`/liabilities`)

Gerenciamento de dívidas com plano de quitação em método avalanche.

- **Cadastro**: nome, tipo, saldo devedor, taxa de juros (% a.m.), pagamento mínimo, credor (opcional), notas (opcional)
- **Tipos suportados**: Cheque especial, Crédito rotativo, Empréstimo, Financiamento, Outro
- **Cards de resumo**: total em dívidas ativas, juros queimados/mês, pagamento mínimo total
- **LiabilityCard**: por passivo — saldo, taxa, mínimo, previsão de quitação
  - ≤ 12 meses → verde | ≤ 36 meses → âmbar | > 36 meses → vermelho
  - Alerta vermelho quando o mínimo não cobre os juros (dívida nunca quitada)
- **Edição inline**: modal com re-cálculo em tempo real da previsão de quitação
- **Marcar como quitada**: muda `status` para `paid_off`; permanece visível na seção "Quitadas"
- **Modo Recuperação** (seção recolhível):
  - Ordenação automática por maior taxa de juros (método avalanche)
  - Calculadora de pagamento extra: digita um valor, o sistema mostra quantos meses são economizados em cada dívida
  - Extra aplicado à dívida de maior juro primeiro; demais recebem apenas o mínimo
  - Badge de prioridade (1, 2, 3...) por dívida
  - Tip explicando o método avalanche
- **`lib/liabilities.ts`**: função pura `monthsToPayoff(balance, monthlyRate, payment)` — separada do arquivo `"use server"` (limitação do Turbopack)
- **Alerta contextual em `/goals`**: se existirem passivos com taxa ≥ 5% a.m., o GoalsView exibe um banner vermelho listando as dívidas e sugerindo priorização; se todas as dívidas forem de baixo juro, exibe confirmação verde

### 6.13 Studio (`/studio`)

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
  ├── compara com → TRANSACTION (join lógico por category string)
  └── receita esperada lida de → SETTINGS (expectedMonthlyIncome)

SETTINGS
  └── alimenta → BUDGET (receita esperada para cálculo de % e balanço)

GOAL
  ├── gera → GOAL_PAYMENT (N cobranças ao criar)
  └── atualiza → currentAmount (soma de GoalPayments paid=true)

GOAL_PAYMENT
  └── controla → GOAL.status (active → completed quando currentAmount >= targetAmount)

LIABILITY
  ├── exibido → /liabilities (LiabilitiesView — CRUD + Modo Recuperação)
  └── alerta → /goals (GoalsView — banner contextual se taxa >= 5% a.m.)

HEALTH
  ├── lê → TRANSACTION (via getDRESummary + aggregate debit_longterm)
  └── exibido → DASHBOARD (HealthScoreCard widget) + /health (HealthView completa)

USER
  ├── autentica → toda a aplicação (via cookie lyfx_session)
  └── exibido → SIDEBAR (nome + avatar via AppLayout)

STUDIO
  ├── lê → USER (lista, reset de senha)
  ├── lê → TRANSACTION (contagem + recentes)
  ├── lê → TAG (contagem)
  └── lê → BUDGET (contagem)
```

### Fluxo de dados — criação de transação recorrente

```
Usuário preenche formulário (recurrence = "monthly")
  └── createTransaction() → salva 1 registro no banco
        └── getProjections() lê a transação
              └── para cada mês projetado → replica o item
                    └── se recurrenceEndsAt definido → para quando ultrapassa a data
```

### Fluxo de dados — criação de parcelamento

```
Usuário preenche modo parcelado (ex: R$ 600 em 3x a partir de Mai/26)
  └── createInstallments()
        ├── gera groupId = randomUUID()
        ├── calcula perInstallment = ceil(totalAmount / count * 100) / 100
        └── cria N registros Transaction:
              ├── date = firstDate + i meses
              ├── description = "Base (1/3)", "Base (2/3)", "Base (3/3)"
              ├── installmentGroupId = groupId (compartilhado)
              ├── installmentNumber = i + 1
              └── installmentTotal = N

getProjections() lê cada parcela individualmente
  └── distribui cada registro no mês que corresponde à sua date
```

### Fluxo de dados — edição de parcelamento

```
Usuário clica em parcela → ActionBar → Editar
  └── EditTransactionModal detecta mode = "installment" (installmentGroupId definido)
        └── ao salvar → updateFutureInstallments(groupId, dados)
              └── busca todas as parcelas com date >= hoje
                    └── atualiza cada uma (description, amount, type, category, notes, tags)
                          └── re-aplica sufixo (N/M) em cada descrição
```

### Fluxo de dados — orçamento mensal

```
Usuário define receita esperada
  └── updateExpectedIncome(amount) → Settings.expectedMonthlyIncome

Usuário define alocação por categoria
  └── setBudget(category, amount) → Budget upsert

BudgetView ao carregar o mês:
  ├── filtra transactions pelo mês/ano selecionado client-side
  ├── calcula realIncome = soma de credits do mês
  ├── calcula totalSpent = soma de debits do mês
  ├── calcula totalAllocated = soma de Budget.amount
  ├── por categoria: pct = spentByCategory / allocation
  └── balanço:
        plannedBalance = expectedMonthlyIncome - totalAllocated
        realBalance    = realIncome - totalSpent
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
│   │   ├── health/page.tsx
│   │   ├── liabilities/page.tsx
│   │   ├── profile/page.tsx
│   │   └── education/page.tsx    # (pendente)
│   ├── actions/                  # Server Actions — mutações e queries
│   │   ├── dashboard.ts          # getDashboardData() — busca tudo em paralelo
│   │   ├── transactions.ts       # getDRESummary() retorna margins + saved
│   │   ├── tags.ts
│   │   ├── budgets.ts
│   │   ├── goals.ts
│   │   ├── projections.ts
│   │   ├── reports.ts
│   │   ├── health.ts             # getHealthData() — DRE + reserva + score
│   │   ├── liabilities.ts        # CRUD de passivos
│   │   ├── settings.ts           # getSettings / updateExpectedIncome
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
│   ├── dashboard/
│   │   ├── DRE.tsx               # DRE em cascata com margens intermediárias
│   │   ├── KPICards.tsx          # 4 cards: Saldo, Receita, Gastos, Poupado
│   │   ├── InsightBanner.tsx     # Lyfx Insight — dica contextual gerada por regras
│   │   ├── GoalsMiniWidget.tsx   # Barras de progresso das metas ativas
│   │   └── MonthlyTrendChart.tsx # Gráfico de gastos dos últimos 6 meses
│   ├── budget/BudgetView.tsx
│   ├── education/EducationView.tsx
│   ├── fixed-expenses/FixedExpensesView.tsx
│   ├── goals/GoalsView.tsx       # + alerta contextual de passivos
│   ├── health/HealthView.tsx     # gauge SVG + 4 dimensões + perfil
│   ├── liabilities/
│   │   └── LiabilitiesView.tsx  # CRUD + Modo Recuperação (avalanche)
│   ├── projections/ProjectionsView.tsx
│   ├── reports/ReportsView.tsx
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
│   ├── health.ts                 # computeHealthScore() — cálculo puro, sem DB
│   ├── liabilities.ts            # monthsToPayoff() — utilitário puro de amortização
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

### Plano de evolução — análise do consultor financeiro (v0.5+)

Baseado em análise técnica e bibliográfica do produto, as evoluções foram priorizadas em fases:

| Fase | Entregue | Descrição |
|---|---|---|
| **Fase 1** | ✅ v0.5.0 | DRE com margens intermediárias + Dashboard redesenhado (KPI cards, Insight, Goals mini, trend chart) |
| **Fase 2** | ✅ v0.6.0 | Integridade de parcelamento: `installmentGroupId`, `installmentNumber`, `installmentTotal` em Transaction. Loop de projeções para parcelas. `TransactionForm` com modo parcelado. `TransactionList` com ActionBar animada. `EditTransactionModal` em 3 modos (single/installment/recurring). Padding padronizado (`p-8`) em todas as páginas. |
| **Fase 3** | ✅ v0.7.0 | Budget completo: modelo `Settings` com `expectedMonthlyIncome`, action `getSettings`/`updateExpectedIncome`, BudgetView redesenhado em 4 seções (receita esperada, nav mensal, alocações por categoria com % da receita, balanço planejado vs real). |
| **Fase 4** | ✅ v0.8.0 | Score de saúde financeira: 4 dimensões (comprometimento, poupança, resultado, reserva), 4 perfis com cores, gauge SVG, widget no dashboard, página `/health` com detalhamento completo. |
| **Fase 5** | ✅ v0.9.0 | Passivos (`Liability`): CRUD completo, modo recuperação avalanche com calculadora de pagamento extra, alerta contextual nas Metas para dívidas com taxa ≥ 5% a.m. |
| **Fase 6** | 🔲 Roadmap | Reembolso com tracking, provisão sazonal automática, importação OFX/CSV |

### Isolamento de dados — plano técnico

Quando implementado, o plano é:

1. Adicionar `userId String` em `Transaction`, `Tag`, `Budget`, `Goal`
2. Alterar constraints únicas: `Tag.name` → `@@unique([userId, name])`, `Budget.category` → `@@unique([userId, category])`
3. Atualizar todas as queries nas 4 actions para incluir `where: { userId }`
4. Migration manual: buscar o único User existente e setar seu id em todos os registros antes de aplicar o `NOT NULL`
5. Estimativa: ~1h de desenvolvimento

---

*Última atualização: 19/05/2026. Versão atual: 0.9.0.*
