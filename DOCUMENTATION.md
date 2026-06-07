# Lyfx — Documentação Técnica
> Life Fixed · v1.11.2 · Junho 2026 · [Política de versionamento → VERSIONING.md](./VERSIONING.md)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Técnica](#2-stack-técnica)
3. [Schema do Banco de Dados](#3-schema-do-banco-de-dados)
4. [Tabela de Relacionamentos](#4-tabela-de-relacionamentos)
5. [Modelo de Categorias](#5-modelo-de-categorias)
6. [Referência Técnica por Módulo](#6-referência-técnica-por-módulo)
7. [Interações entre Módulos](#7-interações-entre-módulos)
8. [Autenticação e Sessão](#8-autenticação-e-sessão)
9. [Arquitetura de Arquivos](#9-arquitetura-de-arquivos)
10. [Decisões Arquiteturais](#10-decisões-arquiteturais)
10.1 [Fórmulas e Cálculos Técnicos](#101-fórmulas-e-cálculos-técnicos)
10.2 [Gotchas Técnicos Conhecidos](#102-gotchas-técnicos-conhecidos)
11. [Próximos Passos](#11-próximos-passos)

---

## 1. Visão Geral

O **Lyfx** é uma aplicação de finanças pessoais estruturada como uma **DRE (Demonstração do Resultado do Exercício) individual**. A premissa central é trazer para o contexto pessoal a mesma clareza analítica que empresas usam para entender suas receitas e despesas.

### Problema que resolve

A maioria dos apps de finanças pessoais registra lançamentos, mas não oferece **diagnóstico**. O Lyfx organiza cada real dentro de uma taxonomia de categorias que permite ao usuário entender não apenas *quanto* gastou, mas *qual tipo de gasto* foi — fixo, variável, comprometido, sazonal, imprevisível ou intencional.

### Público-alvo

Pessoa física que deseja controle financeiro com visão analítica, sem depender de planilhas ou ferramentas genéricas.

### Modelo de distribuição

Arquitetura multi-usuário com isolamento completo por `userId`. Cada usuário vê exclusivamente seus próprios dados. Suporte a múltiplos usuários gerenciados via painel Studio.

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
| **SQLite** | — | Banco embarcado, zero configuração de servidor, arquivo único por ambiente. Ideal para uso local/single-user e para futura portabilidade. Migração para PostgreSQL é trivial com Prisma. |
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
| **bcryptjs** | Hash de senhas com salt automático (fator 10). Escolhido sobre `bcrypt` nativo por ser pure JavaScript — sem dependências de compilação nativa (node-gyp). Executa mesmo quando o usuário não existe (timing defense contra username enumeration). |
| **HMAC-SHA256** | Cookie `lyfx_session` assinado com `createHmac('sha256', SESSION_SECRET)` em `lib/session.ts`. Formato: `<userId>.<hmacHex>`. Verificação em tempo constante via `timingSafeEqual`. `SESSION_SECRET` obrigatória no `.env`. |
| **Cookie httpOnly** | Sessão armazenada como cookie `lyfx_session` com `httpOnly: true`, `sameSite: lax`. `maxAge: 30 dias` por padrão; omitido quando `remember=false` (session cookie). |

### Ícones

| Tecnologia | Justificativa |
|---|---|
| **@tabler/icons-react** | Biblioteca com mais de 5.000 ícones SVG consistentes. Cada ícone é um componente React com props `size` e `className`. Zero dependência de font-loading. |

### Roteamento e proteção

| Arquivo | Função |
|---|---|
| `proxy.ts` | Substituto do `middleware.ts` (convenção depreciada no Next.js 16). Roda no Edge Runtime. Verifica o cookie `lyfx_session`, redireciona rotas protegidas para `/login?redirect=<rota>` preservando o destino original, e injeta header `x-pathname`. Não acessa o banco (limitação do Edge). |

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
│ city            │ String?      │ Cidade                         │
│ state           │ String?      │ Estado / UF                    │
│ zipCode         │ String?      │ CEP ou Zip code                │
│ street          │ String?      │ Logradouro (auto-fill ViaCEP)  │
│ streetNumber    │ String?      │ Número / complemento           │
│ country         │ String?      │ País                           │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        TRANSACTION                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
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
│ reimbursedAt    │ DateTime?    │ Preenchido ao marcar recebida  │
│ accountId       │ String?      │ FK opcional → Account.id       │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ tags            │ Relation     │ → TransactionTag[]             │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           TAG                                   │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ name            │ String       │ Único por usuário              │
│ color           │ String       │ Hex, ex: #22D3EE               │
│ icon            │ String       │ Chave do TAG_ICONS             │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ transactions    │ Relation     │ → TransactionTag[]             │
│                 │ Unique       │ @@unique([userId, name])        │
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
│ userId          │ String       │ FK lógica → User.id            │
│ category        │ String       │ Único por usuário              │
│ amount          │ Float        │ Limite mensal em reais         │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│                 │ Unique       │ @@unique([userId, category])    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           GOAL                                  │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
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
│ userId          │ String       │ FK lógica → User.id (único)    │
│ expectedMonthlyIncome│ Float   │ Receita mensal esperada        │
│ reserveBalance  │ Float        │ Saldo declarado do fundo de    │
│                 │              │ reserva (0 = usar proxy)       │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Nota: um registro por usuário — criado lazily no primeiro acesso via getOrCreate(). userId é unique.

┌─────────────────────────────────────────────────────────────────┐
│                        LIABILITY                                │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ name            │ String       │ Nome da dívida                 │
│ type            │ String       │ Ver tipos abaixo               │
│ currentBalance  │ Float        │ Saldo devedor atual            │
│ interestRate    │ Float        │ Taxa de juros % ao mês         │
│ minimumPayment  │ Float        │ Parcela mínima mensal          │
│ creditor        │ String?      │ Nome do credor                 │
│ notes           │ String?      │ Observações livres             │
│ status          │ String       │ "active" | "paid_off"          │
│ institutionId   │ String?      │ FK opcional → Institution.id   │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Tipos de liability: "cheque_especial" | "rotativo" | "emprestimo" | "financiamento" | "outro"

┌─────────────────────────────────────────────────────────────────┐
│                        INSTITUTION                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ name            │ String       │ Nome do banco / fintech        │
│ type            │ String       │ "bank"|"fintech"|"broker"|"other"│
│ color           │ String       │ Hex para identificação visual  │
│ icon            │ String       │ Chave de ícone                 │
│ notes           │ String?      │ Observações livres             │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ accounts        │ Relation     │ → Account[]                    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          ACCOUNT                                │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ institutionId   │ String (FK)  │ → Institution.id (cascade)     │
│ name            │ String       │ Nome da conta                  │
│ type            │ String       │ Ver tipos abaixo               │
│ balance         │ Float        │ Saldo atual                    │
│ limit           │ Float?       │ Limite (cartões / cheque esp.) │
│ notes           │ String?      │ Observações livres             │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Tipos de account: "checking" | "savings" | "credit_card" | "investment" | "wallet" | "other"

┌─────────────────────────────────────────────────────────────────┐
│                           ASSET                                 │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ name            │ String       │ Apelido do bem                 │
│ type            │ String       │ "real_estate"|"vehicle"|"other"│
│ propertyAddress │ String?      │ Endereço (imóveis)             │
│ make            │ String?      │ Marca (veículos)               │
│ model           │ String?      │ Modelo (veículos)              │
│ year            │ Int?         │ Ano (veículos)                 │
│ plate           │ String?      │ Placa (veículos)               │
│ purchaseValue   │ Float?       │ Valor de aquisição             │
│ currentValue    │ Float?       │ Valor atual estimado           │
│ purchaseDate    │ DateTime?    │ Data de compra                 │
│ notes           │ String?      │ Observações livres             │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ expenses        │ Relation     │ → AssetExpense[]               │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        ASSET_EXPENSE                            │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ assetId         │ String (FK)  │ → Asset.id (cascade)           │
│ name            │ String       │ Ex: "IPTU 2025"                │
│ type            │ String       │ Ver tipos abaixo               │
│ amount          │ Float        │ Valor em reais                 │
│ dueDate         │ DateTime?    │ Data de vencimento             │
│ paid            │ Boolean      │ false por padrão               │
│ paidAt          │ DateTime?    │ Preenchido ao marcar pago      │
│ notes           │ String?      │ Observações livres             │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Tipos de AssetExpense: "iptu" | "ipva" | "itr" | "dpvat" | "seguro" | "licenciamento" | "manutencao" | "other"

┌─────────────────────────────────────────────────────────────────┐
│                       PILL_PROGRESS                             │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ pillId          │ String       │ ID estático da pílula          │
│ profile         │ String       │ Perfil financeiro da pílula    │
│ completedAt     │ DateTime     │ Auto: now()                    │
│ timeSpentSeconds│ Int          │ Tempo de leitura em segundos   │
│ quizCorrect     │ Boolean      │ Acertou o quiz?                │
│ createdAt       │ DateTime     │ Auto: now()                    │
│                 │ Unique       │ @@unique([userId, pillId])      │
└─────────────────┴──────────────┴────────────────────────────────┘
Nota: pílulas são conteúdo estático (lib/pills-data.json). Apenas o progresso é persistido.

┌─────────────────────────────────────────────────────────────────┐
│                           PLAN                                  │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ name            │ String       │ Ex: "Full", "Insider"          │
│ description     │ String?      │ Descrição do plano             │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
│ modules         │ Relation     │ → PlanModule[]                 │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        PLAN_MODULE (pivot)                      │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ planId          │ String (FK)  │ → Plan.id (cascade)            │
│ moduleKey       │ String       │ Chave do módulo (lib/modules)  │
│                 │ Unique       │ @@unique([planId, moduleKey])   │
└─────────────────┴──────────────┴────────────────────────────────┘
Nota: módulos são entidades estáticas definidas em lib/modules.ts — apenas os vínculos com planos são persistidos.

┌─────────────────────────────────────────────────────────────────┐
│                         APP_CONFIG                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ key             │ String (PK)  │ Chave de configuração global   │
│ value           │ String       │ Valor (string, JSON ou bool)   │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Chaves conhecidas: "maintenanceMode" ("true"/"false"), "maintenanceBanner" (mensagem), "betaModules" (JSON array de chaves), "adminNotes" (Markdown livre). Lido via lib/config.ts sem autenticação de admin.

┌─────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION                             │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ title           │ String       │ Título da notificação          │
│ message         │ String?      │ Corpo da mensagem              │
│ read            │ Boolean      │ false por padrão               │
│ readAt          │ DateTime?    │ Preenchido ao marcar como lida │
│ fingerprint     │ String?      │ Hash único (alertas auto)      │
│                 │              │ null = notificação do sistema  │
│ broadcastId     │ String?      │ Agrupa notificações em lote    │
│ expiresAt       │ DateTime?    │ TTL — alertas expiram em 7d    │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘
Nota: fingerprint null = notificação do sistema (descartável pelo usuário).
fingerprint preenchido = alerta automático convertido (não descartável pelo usuário — guard em deleteNotification).
deleteNotification filtra WHERE { id, userId, fingerprint: null } — impede exclusão de alertas auto.

┌─────────────────────────────────────────────────────────────────┐
│                         KM_CONFIG                               │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ @unique — um por usuário       │
│ gasolineRate    │ Float        │ @default(0.25) — 25%           │
│ ethanolRate     │ Float        │ @default(0.36) — 36%           │
│ minFuelPct      │ Float        │ @default(0.15) — 15% mínimo    │
│ paymentDays     │ Int          │ @default(5) — D+5 dias úteis   │
│ vehiclePlate    │ String?      │ Placa do veículo               │
│ vehicleMake     │ String?      │ Marca (ex: Toyota)             │
│ vehicleModel    │ String?      │ Modelo (ex: Corolla)           │
│ vehicleYear     │ Int?         │ Ano do veículo                 │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Nota: criado via upsert na primeira visita às configurações. userId é unique.

┌─────────────────────────────────────────────────────────────────┐
│                         KM_PERIOD                               │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ name            │ String       │ Nome do período                │
│ startDate       │ DateTime     │ Início do período              │
│ endDate         │ DateTime     │ Fim do período                 │
│ fuelType        │ String       │ "gasoline" | "ethanol"         │
│ status          │ String       │ "open" | "submitted"           │
│ submittedAt     │ DateTime?    │ Data de envio                  │
│ expectedPayAt   │ DateTime?    │ submittedAt + paymentDays úteis│
│ totalKm         │ Float        │ Σ(route.km)                    │
│ fuelPriceAvg    │ Float        │ Σ(receipt.total)/Σ(receipt.lit)│
│ ratePerKm       │ Float        │ fuelPriceAvg × fuelRate        │
│ kmAmount        │ Float        │ totalKm × ratePerKm            │
│ extraAmount     │ Float        │ Σ(expense.amount)              │
│ grandTotal      │ Float        │ kmAmount + extraAmount         │
│ notes           │ String?      │ Observações gerais             │
│ transactionId   │ String?      │ FK lógica → Transaction.id     │
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
│ userId          │ String       │ FK lógica → User.id            │
│ periodId        │ String (FK)  │ → KmPeriod.id (cascade)        │
│ date            │ DateTime     │ Data do deslocamento           │
│ origin          │ String       │ Endereço de origem             │
│ destination     │ String       │ Endereço de destino            │
│ km              │ Float        │ Quilometragem do trajeto        │
│ notes           │ String?      │ Observações                    │
│ polyline        │ String?      │ Encoded polyline do trajeto     │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         KM_RECEIPT                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ periodId        │ String (FK)  │ → KmPeriod.id (cascade)        │
│ date            │ DateTime     │ Data do abastecimento          │
│ fuelType        │ String       │ "gasoline" | "ethanol"         │
│ liters          │ Float        │ Litros abastecidos             │
│ totalAmount     │ Float        │ Valor total da nota            │
│ notes           │ String?      │ Observações                    │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         KM_EXPENSE                              │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ periodId        │ String (FK)  │ → KmPeriod.id (cascade)        │
│ type            │ String       │ "toll"|"parking"|              │
│                 │              │ "accommodation"|"food"|        │
│                 │              │ "taxi"|"other"                 │
│ date            │ DateTime     │ Data da despesa                │
│ amount          │ Float        │ Valor em reais                 │
│ notes           │ String?      │ Observações                    │
│ createdAt       │ DateTime     │ Auto: now()                    │
└─────────────────┴──────────────┴────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          KM_PLACE                               │
├─────────────────┬──────────────┬────────────────────────────────┤
│ id              │ String (PK)  │ cuid()                         │
│ userId          │ String       │ FK lógica → User.id            │
│ name            │ String       │ Nome do lugar salvo            │
│ address         │ String       │ Endereço completo              │
│ routeGoing      │ String?      │ JSON: [{lat,lng}] (ida)        │
│ routeReturn     │ String?      │ JSON: [{lat,lng}] (volta)      │
│ distanceGoing   │ Float?       │ Km da rota de ida              │
│ distanceReturn  │ Float?       │ Km da rota de volta            │
│ createdAt       │ DateTime     │ Auto: now()                    │
│ updatedAt       │ DateTime     │ Auto: updatedAt                │
└─────────────────┴──────────────┴────────────────────────────────┘
Nota: routeGoing/routeReturn armazenam polylines como JSON stringify de array de waypoints.
A polyline é usada na geração do PDF (Google Static Maps path parameter).
```

### Diagrama de relações

```
USER
 │ (userId como FK lógica em todas as tabelas de dados)
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
 ├── LIABILITY  (userId presente — entidade isolada por usuário)
 │        └── status: active | paid_off
 │
 ├── SETTINGS  (um registro por usuário — userId unique)
 │
 └── PILL_PROGRESS  (progresso educacional por pílula — userId+pillId unique)
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

### Isolamento de dados por usuário

Todas as tabelas de dados possuem `userId` (Transaction, Tag, Budget, Goal, Liability, Settings). Cada query em todos os Server Actions inclui `where: { userId }` obtido via `requireAuth()`. Usuários não têm acesso aos dados uns dos outros.

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

## 6. Referência Técnica por Módulo

> **Descrições de produto e valor de negócio**: consultar `docs/FEATURES.md`.  
> Esta seção documenta rotas, Server Actions, schema relevante e comportamentos técnicos específicos de cada módulo.

### 6.1 Landing Page (`/`)

Página pública de apresentação do produto. Atualizada em v1.5.0 para refletir a visão atual do sistema. Internacionalizada em PT / EN / ES a partir de v1.6.5.

- **Acesso**: qualquer visitante sem sessão
- **Comportamento com sessão ativa**: redireciona para `/dashboard`
- **Seções**: Navbar sticky, Hero com mockup do dashboard (inclui widget de saúde financeira), Marquee com termos do produto, 6 cards de features com mini-mockups interativos, seção "Como funciona" em 4 passos, FAQ accordion (7 perguntas), CTA final, Footer
- **Features destacadas**: DRE Pessoal / Personal P&L / Estado de Resultados, Score de Saúde, Educação Financeira, Alertas Proativos, Passivos & Dívidas, Bens & Imóveis
- **Marquee**: animação CSS contínua com termos do Lyfx (13 itens)
- **Navegação**: âncoras para `#funcionalidades`, `#como-funciona`, `#faq`
- **Internacionalização (i18n)**:
  - Idiomas suportados: Português (`pt`), English (`en`), Español (`es`)
  - Terminologia regionalizada: "DRE Pessoal" (PT) / "Personal P&L" (EN) / "Estado de Resultados" (ES); moedas R$ / $ / €
  - Seletor de idioma na navbar: dropdown com ícones de bandeira monocromáticos (SVG inline)
  - Detecção automática na carga: lê `localStorage("lyfx-lang")` → `navigator.language` → fallback `"pt"`
  - Troca manual persiste em `localStorage` — reload mantém o idioma escolhido
  - Arquitetura: `components/landing/translations.ts` com interface `Translations` e objeto `T: Record<Lang, Translations>`

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
- **Botão voltar**: `← Início` (posicionado no topo esquerdo do painel direito) navega para a landing page `/`
- **Link "Acessar Studio"**: exibido discretamente abaixo dos botões de login social (10px, cor `--color-f4`); rota direta para `/studio` sem passar pelo perfil
- **Server Actions**: `setup()` para criação, `login()` para autenticação; `logout()` redireciona para `/`

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
- **Modos do formulário**: "Avulsa" (lançamento único ou recorrente) e "Parcelamento" (N parcelas mensais)
- **Recorrência** (modo Avulsa): `once` = "Não repete", `monthly` = "Todo mês", `yearly` = "Todo ano"
- **Parcelamento**: modo dedicado — define valor total + número de parcelas. Cria N registros com `installmentGroupId` UUID compartilhado, `installmentNumber` e `installmentTotal`. Descrição recebe sufixo `(N/M)` automaticamente
- **Toggle reembolsável**: aparece apenas em débitos — ativa `reimbursable = true` e direciona o lançamento para rastreamento em `/reimbursements`
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
- **Campos editáveis**: nome, e-mail, idade, gênero
- **Endereço estruturado**: CEP, logradouro, número, cidade, estado e país — em campos separados
  - **Auto-fill ViaCEP**: ao clicar na lupa (ou pressionar Enter) no campo CEP, consulta `viacep.com.br` e preenche automaticamente logradouro, cidade e estado
  - **País**: combobox digitável (`CountrySelect`) com todos os países do mundo em português; filtra por digitação, aceita texto livre
- **Alteração de senha**: exige senha atual (verificada com bcrypt.compare), nova senha (mínimo 6 chars)
- **Acesso via UserMenu**: o link "Editar perfil" fica no menu flutuante do canto superior direito, não na sidebar

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
- `getSettings()` — lê `reserveBalance` declarado pelo usuário
- **Lógica de reserva**: se `settings.reserveBalance > 0`, usa o valor declarado diretamente; caso contrário, usa proxy (acumulado all-time de `debit_longterm`) para retrocompatibilidade
- Média de despesas dos últimos 3 meses completos → `reserveMonths = reserveAmount / avgMonthlyExpenses`
- Cálculo puro em `lib/health.ts` (`computeHealthScore`) — sem acesso ao banco
- **Editor inline de reserva**: campo editável no `DimensionCard` de "Fundo de reserva" — salva via `updateReserveBalance()` e revalida `/health` sem reload de página

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

### 6.13 Instituições (`/institutions`)

Cadastro de bancos, fintechs e corretoras com suas contas vinculadas.

- **Tipos de instituição**: Banco, Fintech, Corretora, Outro — com cor e ícone personalizáveis
- **Contas por instituição**: cada instituição pode ter N contas (corrente, poupança, cartão de crédito, investimentos, carteira, outro) com saldo e limite opcionais
- **Cards de resumo**: total em contas, total de passivos vinculados, número de instituições ativas
- **InstitutionCard**: expandível — lista as contas com tipo, saldo e limite; lista os passivos vinculados à instituição
- **Vinculação de passivos**: ao criar/editar um passivo em `/liabilities`, é possível associá-lo a uma instituição
- **Vinculação de transações**: ao criar uma transação, é possível associá-la a uma conta específica (visível quando há contas cadastradas)
- **Exclusão em cascade**: ao excluir uma instituição, suas contas são removidas, `institutionId` dos passivos vinculados é limpo e `accountId` das transações vinculadas é limpo
- **`lib/institutions.ts`**: tipos e constantes (`InstitutionType`, `AccountType`, labels, interfaces) — separados do arquivo `"use server"` por limitação do Turbopack

### 6.17 Alertas e Notificações (`/alerts`)

Central unificada com dois tipos distintos de mensagem ao usuário.

#### Alertas financeiros (automáticos)

Calculados on-the-fly em `app/actions/alerts.ts` — não persistidos no banco, nunca descartáveis pelo usuário:

| Tipo | Severidade | Critério |
|---|---|---|
| Orçamento | ⚠ warning | Categoria ≥ 80% do limite definido |
| Orçamento | 🔴 danger | Categoria ≥ 100% do limite (estouro) |
| Meta | ⚠ warning | GoalPayment não pago com vencimento até o fim do mês |
| Meta | 🔴 danger | GoalPayment não pago com vencimento já vencido |
| Projeção | ⚠ warning | Algum dos próximos 12 meses com saldo livre negativo |
| Sazonal | ⚠ warning | Despesa anual com vencimento nos próximos 2 meses |
| Passivo | 🔴 danger | Passivo ativo do tipo `cheque_especial` ou `rotativo` |

#### Notificações do sistema (CS-18/CS-19)

Persistidas no model `Notification` com `fingerprint: null`. Enviadas pelo Studio ou automaticamente:

- **Sino no UserMenu**: badge com contagem de não lidas (vermelho), abre dropdown com duas seções
- **Dropdown**: "Alertas financeiros" (danger primeiro, contagem de outros) + "Notificações" com unread dot / botão de delete
- **Dedup automático**: alertas convertidos em notificação usam `fingerprint` (nunca `null`) — a query `getNotifications()` filtra `fingerprint: null` para mostrar só notificações do sistema
- **TTL 7d**: alertas convertidos em notificação expiram via `expiresAt`
- **Boas-vindas automática**: `adminCreateUser` cria notificação de boas-vindas com `fingerprint: null`
- **deleteNotification**: guard `fingerprint: null` impede exclusão de alertas automáticos
- **Seção Notificações na AlertsView**: "Marcar todas como lidas" + "Limpar tudo"

### 6.14 Reembolsos (`/reimbursements`)

Rastreamento de despesas reembolsáveis e seu status de recebimento.

- **Como funciona**: ao registrar uma transação de débito, o usuário pode ativar o toggle "Despesa reembolsável" — o campo `reimbursable` é salvo como `true`
- **Campo novo**: `reimbursedAt DateTime?` em `Transaction` — preenchido ao marcar como recebida; `null` = pendente
- **Cards de resumo**: A receber (total pendente), Já reembolsado (total recebido), Total registrado
- **Lista "Aguardando reembolso"**: badge âmbar, botão circular para marcar como recebida
- **Lista "Reembolsadas"**: badge verde, exibe data do recebimento; botão para desfazer
- **Actions**: `getReimbursables()`, `markReimbursed(id)`, `unmarkReimbursed(id)` em `transactions.ts`
- **Link na Sidebar**: sob Análise, ícone `IconReceipt2`

### 6.15 Provisão Sazonal (em `/fixed-expenses`)

Seção adicionada ao final da página de Contas Fixas, visível quando há despesas anuais cadastradas.

- **Lógica**: para cada despesa anual (`recurrence = "yearly"`), calcula `valor ÷ meses até o próximo vencimento` — não divide por 12 fixo, mas pelo tempo real restante
- **Urgência**: ≤ 2 meses = vermelho "Urgente" | ≤ 4 meses = âmbar | restante = verde
- **Ordenação**: da mais urgente para a mais distante
- **Por item**: barra de progresso visual do consumo do prazo, data do próximo vencimento, valor total e valor mensal a provisionar
- **Resumo**: total consolidado a provisionar por mês exibido no tip banner
- **Componente**: `ProvisaoSazonal` — sub-componente dentro de `FixedExpensesView.tsx`

### 6.18 Bens e Imóveis (`/assets`)

Cadastro e acompanhamento de bens físicos com seus impostos e despesas associadas.

- **Tipos de bem**: Imóvel (endereço), Veículo (marca/modelo/ano/placa), Outro bem
- **Campos comuns**: valor de compra, valor atual estimado, data de aquisição, observações
- **Variação**: diferença entre valor de compra e atual exibida em verde/vermelho no card expandido
- **Despesas por bem**: IPTU, IPVA, ITR, DPVAT/SPVAT, Seguro, Licenciamento, Manutenção, Outro
  - Toggle de pago/pendente com data de pagamento registrada
  - Alerta visual (fundo vermelho) para despesas vencidas
  - Sugestões de tipo de despesa adaptadas ao tipo do bem (ex: IPVA não aparece para imóvel)
- **Totais por bem**: pago × pendente × total no rodapé expandido
- **Cards de resumo globais**: bens cadastrados, valor total estimado, custo anual total, despesas vencidas
- **Widget no dashboard** (`AssetsMiniWidget`): exibe bens, valor total e custo anual; badge de pendentes se houver; oculto automaticamente se não há bens cadastrados
- **`lib/assets.ts`**: tipos e constantes (`AssetType`, `AssetExpenseType`, labels, `EXPENSE_SUGGESTIONS`) — separados do arquivo `"use server"` por limitação do Turbopack

### 6.19 Educação (`/education`)

Módulo gamificado de educação financeira baseado em pílulas de conhecimento.

**Hub da trilha (`/education`)**
- 85 pílulas distribuídas em 4 perfis financeiros: Em Recuperação, Estabilizado, Em Construção e Livre
- O perfil ativo é derivado automaticamente do score de saúde financeira do usuário
- Abas de navegação permitem explorar as 4 trilhas livremente
- Barra de progresso por trilha: X/Total pílulas concluídas
- CTA de "Próxima Pílula" — destaca sempre a próxima não concluída
- Lista ordenada da trilha: concluídas (check verde), próxima (ciano), pendentes (muted)
- Streak semanal: badge clicável abre calendário de 12 semanas mostrando consistência

**Leitura da pílula (`/education/[pillId]`)**
- Hook destacado em citação lateral
- Seções tipadas com identidade visual própria: `explanation` (neutro), `insight` (âmbar), `practical` (verde), `reframe` (roxo), `reflection` (ciano)
- Timer silencioso: mede tempo de leitura sem exibir ao usuário
- Re-leitura: banner de conclusão anterior (data, tempo, resultado do quiz) mas conteúdo sempre acessível
- Quiz ao final: 3 opções, trava ao selecionar, mostra feedback por opção (verde=correto, vermelho=errado)
- Botão "Concluir Pílula" aparece após responder o quiz
- Pós-conclusão: banner de sucesso + card da próxima pílula (ou link para trilha se for a última)

**Base de Conhecimento (`/education/platform`)**
- Guias de uso de cada módulo da plataforma (EducationView existente)

**Dados e persistência**
- Pílulas: conteúdo estático em `lib/pills-data.json` (85 pílulas, sem banco)
- Progresso: tabela `PillProgress` — uma linha por usuário/pílula; re-leituras não sobrescrevem o primeiro registro
- Streak: calculado on-the-fly a partir das datas de conclusão (semanas com ≥ 1 pílula)

**Nota técnica v1.9.1+**: workaround `lib/db-pills.ts` (better-sqlite3 direto) removido em v1.11.0 (CS-30). `PillProgress` usa `db.pillProgress` via Prisma normalmente após migração para PostgreSQL.

---

### 6.20 Reembolso Especial (`/km-reimbursement`)

Módulo corporativo completo de controle de quilometragem. Adicionado em v1.10.0 (CS-17).

#### Rotas

| Rota | Componente | O que faz |
|---|---|---|
| `/km-reimbursement` | `PeriodList.tsx` | Histórico de períodos (abertos e enviados) + KPIs |
| `/km-reimbursement/new` | `NewPeriodForm.tsx` | Formulário de nova solicitação |
| `/km-reimbursement/[id]` | `PeriodDetail.tsx` | 4 abas: Trajetos, Combustível, Despesas, Resumo |
| `/km-reimbursement/places` | `PlacesPage.tsx` | CRUD de lugares salvos com mapa |
| `/km-reimbursement/settings` | `KmSettings.tsx` | Taxas de cálculo + dados do veículo |

#### Server Actions (`app/actions/km-reimbursement.ts`)

**Config:**
- `getKmConfig()` → upsert default se não existir (userId é unique)
- `saveKmConfig(data)` → atualiza taxas e dados do veículo

**Períodos:**
- `getKmPeriods()` → KmPeriod[] com `_count` de routes/receipts/expenses
- `getKmPeriod(id)` → KmPeriod com routes, receipts, expenses incluídos
- `createKmPeriod(data)` → cria e retorna o novo período
- `deleteKmPeriod(id)` → cascade automático (Prisma cascade nas relações)
- `recalcPeriod(id)` → recalcula todos os campos derivados e persiste (chamado após qualquer mutação nos filhos)

**Trajetos:**
- `createKmRoute(data)` → cria KmRoute → chama `recalcPeriod`
- `updateKmRoute(id, data)` → atualiza → chama `recalcPeriod`
- `deleteKmRoute(id)` → remove → chama `recalcPeriod`

**Combustível:**
- `createKmReceipt(data)` → cria KmReceipt → chama `recalcPeriod`
- `deleteKmReceipt(id)` → remove → chama `recalcPeriod`

**Despesas:**
- `createKmExpense(data)` → cria KmExpense → chama `recalcPeriod`
- `deleteKmExpense(id)` → remove → chama `recalcPeriod`

**Fluxo de envio:**
- `submitPeriod(id)` → muda status para "submitted", calcula D+5 dias úteis, cria Transaction, salva transactionId
- `reopenPeriod(id)` → volta para "open", deleta Transaction, limpa submittedAt/expectedPayAt/transactionId

**Lugares:**
- `getKmPlaces()` → KmPlace[] do usuário
- `createKmPlace(data)` → cria lugar salvo
- `updateKmPlace(id, data)` → atualiza (incluindo routeGoing/routeReturn como JSON)
- `deleteKmPlace(id)` → remove

#### Fórmulas de cálculo

```typescript
// Preço médio ponderado de combustível
fuelPriceAvg = Σ(receipt.totalAmount) / Σ(receipt.liters)
// Exemplo: R$100 (15L) + R$80 (12L) = R$180 / 27L = R$6,67/L

// Taxa por km
ratePerKm = fuelPriceAvg × config.gasolineRate  // ou ethanolRate
// Exemplo: R$6,67 × 0.25 = R$1,67/km

// Valor da quilometragem
kmAmount = totalKm × ratePerKm

// Extra
extraAmount = Σ(expense.amount)

// Total geral
grandTotal = kmAmount + extraAmount

// Validação combustível (mínimo de notas)
fuelTotal = Σ(receipt.totalAmount)
minRequired = kmAmount × config.minFuelPct  // ex: kmAmount × 0.15
isValid = fuelTotal >= minRequired
```

#### D+5 dias úteis com feriados nacionais

Desde **v1.11.0 (CS-25)**, `addBusinessDays` é `async` e considera feriados nacionais via BrasilAPI.
Localização: `lib/km-utils.ts` (movido de `app/actions/km-reimbursement.ts`).

```typescript
// lib/holidays.ts — cache em memória por ano
export async function getHolidays(year: number): Promise<Set<string>>
// Fonte: GET https://brasilapi.com.br/api/feriados/v1/{ano}
// Fallback: Set vazio se API offline (D+5 calcula apenas sáb/dom)
// Cache: next: { revalidate: 86400 } + Map<number, Set<string>> in-memory

// lib/km-utils.ts — função principal
export async function addBusinessDays(startDate: Date, days: number): Promise<Date>
// Pula: sábado (6), domingo (0) e feriados nacionais
// Guard: days inválido (NaN, negativo) → safeDays = 0
// Virada de ano: carrega feriados do próximo ano automaticamente
```

Uso em `submitPeriod`:
```typescript
const expectedPayAt = await addBusinessDays(submittedAt, config.paymentDays)
```

#### Integração Google Maps

**DirectionsService** (no browser, componente `RouteMap.tsx`):
- `@react-google-maps/api` com `DirectionsService` + `DirectionsRenderer draggable={true}`
- Ao selecionar origem/destino → DirectionsService busca rota → `route.legs[0].distance.value` em metros → dividido por 1000 → km
- O usuário pode arrastar waypoints → km recalculado pelo evento `onDirectionsChanged`

**Polyline para PDF** (`fetchDefaultPolyline` em `km-reimbursement.ts`):
- Server-side: `fetch` para `https://maps.googleapis.com/maps/api/directions/json`
- Parâmetros: `origin`, `destination`, `key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Resposta: usa `data.routes[0].overview_polyline.points` (encoded polyline string)
- **Gotcha crítico**: a API retorna `overview_polyline` (objeto com `.points`) e NÃO `overview_path` (array de LatLng). A key correta é `data.routes[0].overview_polyline.points`.
- Se a API falha ou `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` não está configurada → retorna `null` → PDF gerado sem imagem de mapa
- `NEXT_PUBLIC_*` vars requerem restart do servidor para ter efeito (embedded em build time)

**KmPlace como fonte da verdade do polyline**:
- Ao salvar um lugar via `updateKmPlace`, o polyline configurado no mapa é salvo em `routeGoing`/`routeReturn` como JSON stringify
- Na geração do PDF, `PeriodPdf.tsx` usa o polyline do `KmRoute.polyline` se disponível; caso contrário chama `fetchDefaultPolyline(origin, destination)` como fallback
- Isso significa que rotas configuradas via KmPlaces têm mapas mais fiéis no PDF do que rotas digitadas manualmente

#### Geração do PDF (`components/km-reimbursement/PeriodPdf.tsx`)

O PDF é gerado **server-side** via `@react-pdf/renderer` v4.5.1. Não usa o browser do usuário para renderizar — o React tree é renderizado em Node.js pelo servidor.

**Arquitetura:**
- `PeriodPdf.tsx` → componente React que retorna `<Document><Page>...</Page></Document>`
- A rota de API (ou Server Action) chama `renderToBuffer(createElement(PeriodPdf, { period, routes, config }))` → retorna `Buffer` → enviado como `application/pdf`
- `bodySizeLimit: "5mb"` configurado nas Server Actions para suportar PDFs com múltiplas imagens de mapa

**Imagens de mapa no PDF:**
- Para cada KmRoute, busca `fetchStaticMapImage(polyline)` → URL do Google Static Maps API com `path=enc:{polyline}`
- Static Maps API retorna JPEG → `fetch` → `arrayBuffer` → converte para base64 → embeddado em `<Image src="data:image/jpeg;base64,..." />`
- Base64 dentro do PDF funciona em react-pdf v4 (Image aceita data URI)

**Tipografia (sem carregar fontes externas):**
- Logo "Ly" + "fx": usa `Times-BoldItalic` (fonte built-in do PDF spec) — aproximação de Georgia Bold Italic sem dependency de arquivo de fonte
- Corpo: fonte padrão (Helvetica)

**Padrão de bolinhas no fundo:**
- `DOT_POSITIONS` gerado uma única vez no nível do módulo (fora do componente) — `for` loop duplo para cada célula de 30pt × 30pt na página A4 (595 × 842pt)
- Renderizado como `<Svg><Circle />...</Svg>` com `position: absolute, top: 0, left: 0` fixed → aparece em todas as páginas
- Geração fora do componente evita recalcular a cada render do PDF

**Mini-header nas páginas 2+:**
- `<View fixed render={({ pageNumber }) => pageNumber > 1 ? <content /> : null} />`
- O `render` prop é necessário pois `fixed` renderiza em todas as páginas — o condicional impede que apareça na página 1 (que tem o header completo)
- `paddingTop: 56` na `<Page>` acomoda o mini-header sem sobrepor o conteúdo

**`wrap={false}` no bloco de resumo:**
- Evita que o bloco "Resumo" seja cortado entre páginas
- Se não cabe na página atual, react-pdf quebra para a próxima página antes de começar o bloco

---

### 6.16 Studio (`/studio`)

Painel administrativo protegido por senha separada da sessão do usuário.

#### Autenticação e sessão

- **Senha**: configurada em `.env` → `ADMIN_SECRET`. Comparação direta (sem hash) — segredo de operação
- **Cookie**: `lyfx_admin` com `httpOnly: true`, `sameSite: lax`, expiração 2 horas, `path: "/studio"` (não vaza para outras rotas)
- **Acesso**: `/studio` — independente da sessão do app principal; acessível via link discreto na página `/login`
- **Logout**: limpa `lyfx_admin` (com `path: "/studio"`) **e** `lyfx_session` (com `path: "/"`) simultaneamente → redireciona para `/` via `redirect()` no server action (sem flash de tela)
- **Login form**: botão `← Login` no topo esquerdo navega para `/login`

#### Abas (ordem)

`Painel → Usuários → Planos → Módulos → Notas → Dados → Schema → Documentação`

#### Aba Painel

Dashboard de gestão do software com duas seções:

**Cards de métricas** (6 cards):
- Usuários cadastrados (contagem total)
- Registros no banco (soma de todas as tabelas de dados)
- Espaço em disco (tamanho do arquivo de banco via `fs/promises stat()`, formatado em B/KB/MB/GB)
- Planos ativos (contagem de planos cadastrados)
- Versão dev (lida de `lyfx/package.json`)
- Versão prod (lida de `lyfx-production/package.json`; exibe `—` se o worktree não existir)

**Configurações globais**:
- **Modo manutenção**: toggle que ativa/desativa o banner amarelo de manutenção exibido no topo de todas as rotas do app (`AppLayout` lê via `getConfigBool("maintenanceMode")`)
- **Banner de manutenção**: campo de texto editável com a mensagem exibida no banner (salvo em `AppConfig` como `maintenanceBanner`)

#### Aba Usuários

- **Lista**: avatar, nome, e-mail, data de cadastro de todos os usuários
- **Reset de senha**: inline com confirmação — campo de nova senha (mínimo 6 chars) + botão de confirmação
- **Criar usuário**: formulário inline — nome, e-mail, senha. `revalidatePath("/studio")` + `router.refresh()` para atualização imediata sem reload
- **Deletar usuário**: botão vermelho com painel de confirmação inline. Cascade manual na ordem: transactions → tags → budgets → goals → liabilities → settings → user (sem FK do User para os modelos de dados)

#### Aba Planos

- **Lista de planos**: exibe planos cadastrados com nome, descrição e contagem de módulos vinculados
- **Criar plano Full**: seed automático de todos os módulos com `isBeta: false` (módulos estáveis)
- **Criar plano Insider**: seed automático de **todos** os módulos incluindo betas — derivado de `ALL_MODULE_KEYS` em `lib/modules.ts`
- **Botões de seed** aparecem apenas quando o respectivo plano ainda não existe

#### Aba Módulos

- Lista todos os 17 módulos do sistema com chave, rótulo e status beta
- **Toggle Beta**: botão por módulo para marcar/desmarcar como beta em tempo real. Estado salvo no `AppConfig` como `betaModules` (JSON array de chaves). A sidebar do app lê esse valor via `getConfigValue` no `AppLayout` — sem reiniciar o servidor
- Módulos marcados como beta exibem o chip amarelo "Beta" na sidebar para todos os usuários

#### Aba Notas

Editor Markdown com persistência em `AppConfig` (chave `adminNotes`). Funcionalidades:

**Toolbar** (5 grupos):
1. Cabeçalhos: H1, H2, H3
2. Ênfase: Negrito (`**`), Itálico (`_`)
3. Listas: Lista (` - `), Lista numerada (`1. `), Checklist (` - [ ] `)
4. Blocos: Citação (`> `), Código (inline \`\` ou bloco fenced)
5. Ação: Salvar

**Slash commands** (Notion-like): digitar `/` no início de uma linha abre menu flutuante com 10 comandos (`/h1`, `/h2`, `/h3`, `/bold`, `/italic`, `/list`, `/ordered`, `/todo`, `/quote`, `/code`). Teclas ↑/↓ navegam; Enter/Tab confirma; Esc fecha.

**Auto-continuação de listas**: ao pressionar Enter em uma linha com ` - `, `1. ` ou ` - [ ] `, a próxima linha começa com o mesmo padrão (listas ordenadas incrementam o número).

**Atalhos de teclado**: `Ctrl+B` (negrito), `Ctrl+I` (itálico), `Ctrl+S` (salvar).

#### Aba Dados

- **Seção Usuários**: combobox digitável para filtrar usuários por nome ou e-mail (dropdown com busca, destaque cyan no item selecionado, fecha ao clicar fora via `useRef + useEffect`)
- **Dados por usuário**: ao selecionar, exibe contadores (transações, tags, orçamentos, metas) e tabela das 10 transações mais recentes do usuário
- **Dados globais** (sem filtro): exibe as 10 transações mais recentes do sistema

#### Aba Schema

Duas visualizações do schema:

**ERD visual**: diagrama UML com todas as tabelas e suas colunas. Tabelas iniciam **colapsadas** — clique no cabeçalho expande/colapsa individualmente. Linhas de relação entre tabelas (via campos de FK). Container com `width: 90vw`.

**Tabela descritiva**: lista todas as tabelas com nome, número de campos e descrição textual do que cada tabela armazena. Clicar em uma linha do ERD visual expande a tabela correspondente.

#### Aba Documentação

Renderização em Markdown do arquivo `DOCUMENTATION.md`. TOC lateral clicável com h2, h3 e h4 (h3 indentado 20px, h4 indentado 32px, tamanhos decrescentes). Clique em qualquer item do TOC faz scroll suave até o heading correspondente (slugify do texto).

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

TRANSACTION.reimbursable
  └── exibido → /reimbursements (filtra reimbursable=true, agrupa por status)

TRANSACTION.recurrence = "yearly"
  └── alimenta → /fixed-expenses (seção ProvisaoSazonal — valor/meses até vencimento)

HEALTH
  ├── lê → TRANSACTION (via getDRESummary + aggregate debit_longterm)
  └── exibido → DASHBOARD (HealthScoreCard widget) + /health (HealthView completa)

USER
  ├── autentica → toda a aplicação (via cookie lyfx_session)
  └── exibido → SIDEBAR (nome + avatar via AppLayout)

STUDIO
  ├── lê → USER (lista, reset de senha, criação, exclusão cascade)
  ├── lê → TRANSACTION (contagem + recentes por usuário)
  ├── lê → TAG, BUDGET, GOAL (contagens globais e por usuário)
  ├── lê/escreve → APP_CONFIG (toggles de manutenção, betaModules, notas admin)
  └── lê/escreve → PLAN + PLAN_MODULE (seed Full/Insider, listagem)

APP_CONFIG
  ├── lido por → SIDEBAR (betaModules via AppLayout → getConfigValue)
  └── lido por → APP_LAYOUT (maintenanceMode → banner global)
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
        ├── calcula baseAmount = floor(targetAmount / meses)
        │     lastAmount = targetAmount - baseAmount × (meses - 1)  ← absorve resíduo de arredondamento
        ├── avalia viabilidade vs avgMonthlyBalance (média 3 meses)
        ├── cria registro Goal
        └── cria N registros GoalPayment (1 por mês até o prazo)
              └── usuário marca GoalPayments como pagos
                    └── markPayment() verifica ownership via { id, goal: { userId } }
                          └── recalcula currentAmount
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
   └── Usuário encontrado → renderiza Sidebar + UserMenu (flutuante) + children

4. Login bem-sucedido:
   └── setSession(user.id) → cookie httpOnly, 30 dias

5. Logout:
   └── clearSession() → deleta cookie → redirect /
```

### Segurança

- Senhas nunca armazenadas em texto plano — sempre hash bcrypt (salt factor 10)
- Cookie `httpOnly: true` — inacessível via JavaScript no browser
- Cookie `secure: true` em produção — apenas HTTPS
- `sameSite: lax` — proteção contra CSRF
- Proxy não acessa o banco (Edge Runtime) — verifica apenas a existência do cookie, não sua validade
- Validação completa de existência do usuário no `AppLayout` (Node.js runtime, com acesso ao banco)

### Studio

- Cookie separado: `lyfx_admin` com `path: "/studio"` (não vaza para outras rotas)
- Expiração curta: 2 horas
- Senha via variável de ambiente `ADMIN_SECRET` — nunca no código
- Comparação por igualdade direta (sem hash) — senha é um segredo de operação, não de usuário
- Logout do Studio também invalida a sessão do usuário app (`lyfx_session`) em uma única operação
- Deleção de cookie sempre especifica `path` correspondente ao de criação — sem isso o cookie persiste
- **Todas as Server Actions sensíveis** (`adminDeleteUser`, `adminResetPassword`, `adminCreateUser`, `getStudioData`, `getStudioDataForUser`) chamam `requireAdmin()` internamente — proteção dupla além da guarda no componente de página

---

## 9. Arquitetura de Arquivos

```
lyfx/
├── app/
│   ├── (app)/                    # Rotas protegidas (requerem sessão)
│   │   ├── layout.tsx            # AppLayout: verifica sessão + injeta Sidebar e UserMenu
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
│   │   ├── reimbursements/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── institutions/page.tsx # Cadastro de bancos/fintechs e contas
│   │   ├── alerts/page.tsx       # Central de alertas proativos
│   │   ├── assets/page.tsx       # Bens, imóveis, veículos e despesas associadas
│   │   ├── education/page.tsx           # Hub da trilha (Server Component)
│   │   ├── education/[pillId]/page.tsx  # Leitura da pílula (Server Component)
│   │   └── education/platform/page.tsx # Base de conhecimento (wrapper)
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
│   │   ├── institutions.ts       # CRUD de instituições e contas
│   │   ├── alerts.ts             # getAlerts() —  5 tipos de alertas on-the-fly
│   │   ├── assets.ts             # CRUD de bens e despesas (AssetExpense)
│   │   ├── education.ts          # getPillProgress / completePill / getStreakData
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
│   ├── layout/UserMenu.tsx
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
│   ├── institutions/
│   │   └── InstitutionsView.tsx # CRUD de instituições e contas vinculadas
│   ├── alerts/
│   │   └── AlertsView.tsx       # Central de alertas agrupados por severidade
│   ├── assets/
│   │   └── AssetsView.tsx       # CRUD de bens com despesas/impostos expansíveis
│   ├── reimbursements/
│   │   └── ReimbursementsView.tsx  # tracking de despesas reembolsáveis
│   ├── projections/ProjectionsView.tsx
│   ├── reports/ReportsView.tsx
│   ├── tags/
│   │   ├── TagPicker.tsx
│   │   └── TagsManager.tsx
│   ├── profile/ProfileForm.tsx
│   └── ui/
│       ├── MonthPicker.tsx       # Seletor de mês custom (substitui input[type=month])
│       └── CountrySelect.tsx     # Combobox digitável com ~195 países em português
│
│   (dashboard extras)
│       └── AssetsMiniWidget.tsx  # Widget de bens para o dashboard
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
│   ├── institutions.ts           # Tipos e constantes de instituições (fora do "use server")
│   └── generated/prisma/         # Client gerado pelo Prisma (não editar)
│
├── prisma/
│   ├── schema.prisma             # Fonte da verdade do banco
│   └── prisma.config.ts          # Configuração do Prisma v7
│
├── proxy.ts                      # Proteção de rotas (Edge Runtime)
├── .env                          # DATABASE_URL + ADMIN_SECRET
├── dev.db                        # Banco SQLite (não versionar)
└── .claude/
    ├── CLAUDE.md                 # Instruções globais para o Claude Code
    ├── AGENTS.md                 # Diretrizes de agentes (@AGENTS.md referenciado por CLAUDE.md)
    └── agents/
        └── agent-smith.md        # Agente QA especialista (Agent Smith v8.0)
```

### 9.1 Descrição dos arquivos

#### `app/`

| Arquivo | O que faz |
|---|---|
| `page.tsx` | Rota pública `/`. Redireciona para `/dashboard` se houver sessão ativa; caso contrário renderiza `LandingPage`. |
| `layout.tsx` | Root layout. Carrega as fontes Playfair Display e Inter via `next/font/google`, injeta variáveis CSS e importa `globals.css`. |
| `globals.css` | Design system completo: tokens de cor (`--color-cyan`, `--color-bg2`, etc.), tipografia, keyframes de animação (marquee, pulse, shake) e utilitários Tailwind v4 via `@theme inline {}`. |
| `proxy.ts` | Proteção de rotas no Edge Runtime (substituto do `middleware.ts` depreciado no Next.js 16). Verifica o cookie `lyfx_session` e redireciona rotas protegidas para `/login`; redireciona `/` e `/login` para `/dashboard` quando há sessão. |

#### `app/(app)/`

| Arquivo | O que faz |
|---|---|
| `layout.tsx` | `AppLayout` — Server Component que valida a sessão em cada request: lê o cookie, busca o usuário no banco, redireciona para `/api/clear-session` se o usuário não existir mais. Injeta a `Sidebar` (navegação) e o `UserMenu` (perfil/logout flutuante). |
| `dashboard/page.tsx` | Busca dados do dashboard via `getDashboardData()` e renderiza `DashboardView`. |
| `transactions/page.tsx` | Busca transações e tags do mês e renderiza `TransactionList` + `TransactionForm`. |
| `budget/page.tsx` | Busca orçamentos, configurações e transações do mês; renderiza `BudgetView`. |
| `fixed-expenses/page.tsx` | Busca transações recorrentes e renderiza `FixedExpensesView`. |
| `goals/page.tsx` | Busca metas, pagamentos e passivos ativos; renderiza `GoalsView`. |
| `projections/page.tsx` | Busca projeções de recorrências e parcelas; renderiza `ProjectionsView`. |
| `reports/page.tsx` | Renderiza `ReportsView` (seleção de período + DRE exportável). |
| `tags/page.tsx` | Busca todas as tags do usuário e renderiza `TagsManager`. |
| `health/page.tsx` | Busca dados de saúde financeira e renderiza `HealthView`. |
| `liabilities/page.tsx` | Busca passivos e instituições; renderiza `LiabilitiesView` com dropdown de vínculo de instituição. |
| `reimbursements/page.tsx` | Busca despesas reembolsáveis e renderiza `ReimbursementsView`. |
| `profile/page.tsx` | Busca perfil do usuário e renderiza `ProfileForm`. |
| `institutions/page.tsx` | Busca instituições e passivos em paralelo; renderiza `InstitutionsView`. |
| `alerts/page.tsx` | Busca alertas calculados e renderiza `AlertsView`. |
| `assets/page.tsx` | Busca todos os bens do usuário (com despesas incluídas) e renderiza `AssetsView`. |

#### `app/actions/`

| Arquivo | O que faz |
|---|---|
| `dashboard.ts` | `getDashboardData()` — único `Promise.all` que busca DRE, transações recentes, metas ativas, trend de 6 meses e tags. Inclui `getDRESummary()` que agrupa transações por categoria e calcula as 4 margens (afterFixed, afterVariable, afterCommitted, net). |
| `transactions.ts` | CRUD completo de transações: `getTransactions`, `createTransaction`, `createInstallments`, `updateTransaction`, `updateFutureInstallments`, `deleteTransaction`, `deleteInstallmentGroup`, `markReimbursed`, `unmarkReimbursed`, `getReimbursables`. |
| `tags.ts` | `getTags`, `createTag`, `updateTag`, `deleteTag` — upsert com chave composta `[userId, name]`. |
| `budgets.ts` | `getBudgets`, `setBudget` (upsert por `[userId, category]`), `deleteBudget`. |
| `goals.ts` | `getGoals`, `createGoal` (gera GoalPayments automáticos), `deleteGoal`, `markPayment`, `getMonthlyBalance` (média de sobra dos últimos 3 meses para cálculo de viabilidade). |
| `projections.ts` | `getProjections()` — lê recorrências mensais/anuais e parcelas futuras; distribui cada item no mês correto para os próximos 12 meses. |
| `reports.ts` | `getReportsData(month, year)` — busca transações do período e monta estrutura de DRE para exportação/exibição. |
| `health.ts` | `getHealthData(month, year)` — combina `getDRESummary` com aggregate de `debit_longterm` (proxy de reserva) e média de despesas dos últimos 3 meses; retorna dados para `computeHealthScore`. |
| `liabilities.ts` | `getLiabilities`, `createLiability`, `updateLiability`, `deleteLiability`, `markPaidOff`. Passivo pode ser vinculado a uma instituição via `institutionId`. |
| `settings.ts` | `getSettings()` com padrão get-or-create por `userId`; `updateExpectedIncome(amount)`. |
| `user.ts` | `getProfile()`, `updateProfile()` (nome, email, idade, gênero, 5 campos de endereço, avatar base64), `changePassword()` (verifica senha atual com bcrypt antes de atualizar). |
| `institutions.ts` | `getInstitutions`, `getAccountsForSelect`, `createInstitution`, `updateInstitution`, `deleteInstitution` (cascade manual + limpeza de FKs), `createAccount`, `updateAccount`, `deleteAccount`. |
| `alerts.ts` | `getAlerts()` — calcula on-the-fly 4 tipos de alerta: estouro de orçamento, pagamentos de metas vencidos/pendentes, projeção negativa nos próximos 12 meses e despesas sazonais iminentes. |
| `assets.ts` | `getAssets`, `getAssetsSummary` (para widget do dashboard), `createAsset`, `updateAsset`, `deleteAsset`. Para despesas: `createAssetExpense` (verifica ownership do asset), `updateAssetExpense`, `toggleExpensePaid`, `deleteAssetExpense`. Parsing `parseBR()` normaliza valores no formato brasileiro (`"1.234,56"` → `1234.56`). |

#### `app/login/`

| Arquivo | O que faz |
|---|---|
| `page.tsx` | Server Component: verifica se já existe usuário no banco (`hasUser`) para decidir o modo inicial do formulário; injeta o mês atual em português. |
| `LoginForm.tsx` | Client Component com toda a UI de autenticação: modo login/setup, toggle entre modos, animação shake, toast para social login, modal "Esqueci a senha", botão `← Início` e link discreto "Acessar Studio". |
| `actions.ts` | `setup()` (cria o primeiro usuário + inicia sessão), `login()` (valida credenciais + inicia sessão), `logout()` (limpa cookie + redireciona para `/`). |

#### `app/studio/`

| Arquivo | O que faz |
|---|---|
| `page.tsx` | Server Component: verifica cookie `lyfx_admin`; renderiza `StudioLoginForm` ou o painel completo `StudioClient` passando os dados buscados. |
| `StudioClient.tsx` | Client Component com toda a UI do Studio: 8 abas (Painel, Usuários, Planos, Módulos, Notas, Dados, Schema, Documentação), formulário de login, gerenciamento de usuários com confirmação inline, toggle de beta por módulo, editor Markdown com toolbar + slash commands, dashboard de métricas, ERD colapsável com descrições de tabelas. |
| `actions.ts` | `adminLogin`, `adminLogout` (limpa ambos os cookies + redireciona), `getStudioData` (inclui versões dev/prod), `getStudioDataForUser`, `adminResetPassword`, `adminCreateUser`, `adminDeleteUser` (cascade manual), `getDocumentation`, `getLiveSchema`, `getAppConfig`, `setAppConfig`, `saveAdminNotes`, `ensureInsiderPlan`. |

#### `app/api/`

| Arquivo | O que faz |
|---|---|
| `clear-session/route.ts` | Route Handler GET — deleta o cookie `lyfx_session` e redireciona para `/login`. Usado como escape hatch quando o `userId` do cookie não existe mais no banco, evitando loop infinito no `AppLayout`. |

#### `components/landing/`

| Arquivo | O que faz |
|---|---|
| `LandingPage.tsx` | Página pública de marketing: navbar sticky com âncoras + seletor de idioma, hero com `DashboardMockup`, marquee, 6 cards de features com mini-mockups, seção "Como funciona" em 4 passos, FAQ accordion com 7 itens, CTA final e footer. Internacionalizada em PT/EN/ES com detecção automática via `navigator.language` e persistência em `localStorage`. |
| `translations.ts` | Todas as strings da landing page organizadas por idioma (`pt`, `en`, `es`). Interface `Translations` com tipagem explícita; objeto `T: Record<Lang, Translations>`. Inclui terminologia financeira regionalizada e valores de mockup formatados por locale. |

#### `components/layout/`

| Arquivo | O que faz |
|---|---|
| `Sidebar.tsx` | Barra lateral de navegação: links para todas as rotas protegidas com ícones Tabler, highlight da rota ativa via `usePathname`. Colapsa/expande via estado (clique no logo). Sem perfil ou logout — essas funções foram movidas para o `UserMenu`. |
| `UserMenu.tsx` | Menu flutuante fixo no canto superior direito: pill com avatar + primeiro nome + chevron. Dropdown com nome completo, link "Editar perfil" e botão "Sair" (logout com `useTransition`). Fecha ao clicar fora via `useRef`. |

#### `components/dashboard/`

| Arquivo | O que faz |
|---|---|
| `DRE.tsx` | DRE em cascata: agrupa transações por categoria, calcula e exibe as 3 margens intermediárias (após fixos, operacional, após comprometidos) com badges coloridos inline. |
| `KPICards.tsx` | 4 cards no topo do dashboard: Saldo (verde/vermelho), Receita, Gastos, Poupado (`debit_longterm`). |
| `InsightBanner.tsx` | Gera e exibe a dica contextual do "Lyfx Insight" com base em 5 regras de prioridade sobre o estado financeiro do mês. |
| `GoalsMiniWidget.tsx` | Widget lateral com barra de progresso para cada meta ativa (até 4), mostrando `currentAmount / targetAmount`. |
| `MonthlyTrendChart.tsx` | Gráfico de barras dos últimos 6 meses: receita, despesa e resultado. Mês atual destacado em cyan. Tooltip interativo. |

#### `components/ui/`

| Arquivo | O que faz |
|---|---|
| `MonthPicker.tsx` | Seletor de mês customizado (substitui `<input type="month">`): botão-trigger com display "Janeiro de 2026", dropdown com navegação de ano e grade 4×3 de meses abreviados, mês selecionado em cyan, X para limpar. Props: `value` ("YYYY-MM"), `onChange`, `placeholder`, `height`, `fontSize`. |
| `CountrySelect.tsx` | Combobox digitável de países: campo de texto com filtragem em tempo real sobre lista de ~195 países em português (lusófonos no topo), chevron para abrir/fechar, X para limpar, aceita texto livre. |

#### `components/transactions/`

| Arquivo | O que faz |
|---|---|
| `TransactionForm.tsx` | Formulário de criação de transações com dois modos: "Avulsa" (único ou recorrente) e "Parcelamento" (N parcelas mensais). Inclui `TagPicker` inline, toggle de reembolsável, seleção de contexto (pessoal/profissional) e seletor de conta (visível quando há contas cadastradas). |
| `TransactionList.tsx` | Lista de transações com `ActionBar` animada ao clicar (slide-down): botões editar, excluir individual e excluir grupo de parcelas. |
| `EditTransactionModal.tsx` | Modal de edição com 3 modos automáticos: `single` (edita só o registro), `installment` (edita parcelas futuras do grupo), `recurring` (edita o registro com aviso de impacto em projeções). |

#### `components/tags/`

| Arquivo | O que faz |
|---|---|
| `TagPicker.tsx` | Seletor inline de tags com criação rápida (nome + cor + ícone). Usado dentro do `TransactionForm`. |
| `TagsManager.tsx` | Página completa de gerenciamento: lista de tags com edição inline de nome, cor e ícone; exclusão com cascade automático. |

#### `components/` (demais views)

| Arquivo | O que faz |
|---|---|
| `budget/BudgetView.tsx` | Receita esperada editável, navegação de mês, alocações por categoria com barra de progresso e % da receita, balanço planejado vs real. |
| `fixed-expenses/FixedExpensesView.tsx` | Cards de resumo (mensal/anual/12 meses), listas de fixos mensais e anuais, gráfico de barras horizontais de projeção e seção `ProvisaoSazonal`. |
| `goals/GoalsView.tsx` | CRUD de metas, cobranças mensais com marcação de pagamento, cálculo de viabilidade em tempo real, banner de alerta de passivos com juros altos. |
| `health/HealthView.tsx` | Gauge SVG animado, 4 `DimensionCard`s com score e barra de progresso, badge de perfil (Em Recuperação → Livre), tip banner da pior dimensão. |
| `liabilities/LiabilitiesView.tsx` | CRUD de passivos, previsão de quitação por dívida, modo recuperação avalanche com calculadora de pagamento extra. |
| `projections/ProjectionsView.tsx` | Cards de resumo (livre acumulado, média, meses no vermelho), gráfico de 12 barras clicáveis, painel de detalhe mensal. |
| `reports/ReportsView.tsx` | Seleção de período (mês/ano), DRE detalhado por categoria com valores e percentuais sobre a receita. |
| `reimbursements/ReimbursementsView.tsx` | Cards de resumo (a receber / recebido), listas de despesas pendentes e quitadas com marcação/desmarcação. |
| `profile/ProfileForm.tsx` | Upload de avatar com resize client-side via Canvas, campos de perfil (nome, email, idade, gênero), endereço estruturado em 5 campos com auto-fill ViaCEP (lupa + Enter) e `CountrySelect`, formulário de troca de senha com verificação da senha atual. |
| `institutions/InstitutionsView.tsx` | CRUD completo de instituições e contas: `InstitutionModal` (criar/editar), `AccountForm` (formulário inline), `InstitutionCard` (expandível com lista de contas e passivos vinculados), `AccountRow` (linha com editar/excluir), cards de resumo e estado vazio. |
| `alerts/AlertsView.tsx` | Exibe alertas agrupados por severidade (danger → warning → info): `AlertCard` com ícone, badge de tipo, título, descrição e link; chips de contagem por tipo; estado vazio "Tudo em ordem!". |
| `assets/AssetsView.tsx` | CRUD de bens: `AssetModal` (criar/editar com campos por tipo), `ExpenseForm` (inline por bem), `ExpenseRow` (toggle pago/pendente, alerta de vencido), `AssetCard` (expansível com despesas, variação de valor, totais), cards de resumo globais. |
| `dashboard/AssetsMiniWidget.tsx` | Widget para o dashboard: mostra bens, valor total estimado e custo anual; badge vermelho se há despesas pendentes; link para `/assets`; oculto se não há bens. |

#### `lib/`

| Arquivo | O que faz |
|---|---|
| `db.ts` | Singleton do `PrismaClient` com `PrismaBetterSqlite3` como adapter. Lê `DATABASE_URL` do ambiente (fallback: `file:./dev.db`). Cada ambiente aponta para seu próprio banco via `.env` (gitignored). |
| `session.ts` | `getSessionUserId()` lê o cookie `lyfx_session`; `setSession(userId)` grava o cookie httpOnly; `clearSession()` apaga o cookie; `requireAuth()` retorna o `userId` ou lança erro se não autenticado. |
| `types.ts` | Interfaces TypeScript do domínio: `Transaction`, `Tag`, `Goal`, `GoalPayment`, `Liability`, `DRESummary` (com `margins` e `saved`), tipos de categoria, recorrência e contexto. |
| `categories.ts` | Array `CATEGORIES` com as 9 categorias (2 de crédito + 7 de débito), cada uma com `value`, `label`, `group`, `groupLabel` e `examples`. Fonte de verdade para dropdowns e agrupamentos. |
| `tag-icons.ts` | Objeto `TAG_ICONS` mapeando 12 chaves para componentes Tabler Icons; array `TAG_COLORS` com 8 cores predefinidas em hex. |
| `utils.ts` | Função `cn(...inputs)` — combina `clsx` e `tailwind-merge` para merge seguro de classes Tailwind. |
| `health.ts` | Função pura `computeHealthScore(data)` — calcula o score 0–100 e o perfil financeiro a partir de DRE, reserva e médias. Sem acesso ao banco. |
| `liabilities.ts` | Função pura `monthsToPayoff(balance, monthlyRate, payment)` — calcula meses até quitação de uma dívida pela fórmula de amortização. Separada do arquivo `"use server"` por limitação do Turbopack. |
| `institutions.ts` | Tipos e constantes de instituições (`InstitutionType`, `AccountType`, `INSTITUTION_TYPE_LABELS`, `ACCOUNT_TYPE_LABELS`, interfaces `Institution`, `Account`, `AccountForSelect`) — separados do arquivo `"use server"` por limitação do Turbopack. |
| `assets.ts` | Tipos e constantes de bens (`AssetType`, `AssetExpenseType`, `ASSET_TYPE_LABELS`, `ASSET_EXPENSE_TYPE_LABELS`, `EXPENSE_SUGGESTIONS`, interfaces `Asset`, `AssetExpense`) — separados do arquivo `"use server"` por limitação do Turbopack. |
| `modules.ts` | Array `ALL_MODULES` com os 17 módulos do sistema — cada entrada tem `key`, `label`, `summary` (descrição curta) e `isBeta?: boolean`. `ALL_MODULE_KEYS` é o array só de chaves. Fonte de verdade para seeds de planos e para a Sidebar exibir o chip "Beta". |
| `config.ts` | Helpers `getConfigValue(key, fallback)` e `getConfigBool(key, fallback)` — leem `AppConfig` via Prisma sem exigir autenticação de admin. Usados em Server Components (`AppLayout`, `layout.tsx`) para ler `maintenanceMode` e `betaModules` em cada request. |

#### `prisma/`

| Arquivo | O que faz |
|---|---|
| `schema.prisma` | Fonte de verdade do banco: define todos os modelos (User, Transaction, Tag, TransactionTag, Budget, Goal, GoalPayment, Settings, Liability, Institution, Account, Asset, AssetExpense, Plan, PlanModule, AppConfig) com campos, tipos, defaults, constraints únicas compostas e relações. |

#### `.claude/`

Diretório de configuração do **Claude Code** (CLI de IA). Versionado no repositório para que o contexto do assistente seja compartilhado entre sessões e colaboradores.

| Arquivo | O que faz |
|---|---|
| `CLAUDE.md` | Ponto de entrada do Claude Code. Referencia `@AGENTS.md` com `@`. |
| `AGENTS.md` | Diretivas globais do projeto para o Claude Code: stack, convenções, avisos de breaking changes do Next.js. |
| `agents/agent-smith.md` | **Agent Smith v8.0** — agente QA especialista. Persona cirúrgica baseada em 19 obras técnicas (Myers, Beck, Feathers, Fowler, Nygard, WAHH e outros). Invocado com `@agent-smith` ou linguagem natural. Ferramentas: `Read`, `Grep`, `Glob`, `Bash` (somente leitura/análise — sem edição de arquivos). Modelo: `sonnet`. |

**Como invocar o Agent Smith:**
```
@agent-smith revisa o componente PillReader antes de commitar
```
ou
```
Usa o Agent Smith para auditar a action completePill
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

### Isolamento completo de dados por `userId`

**Decisão**: todas as tabelas de dados (Transaction, Tag, Budget, Goal, Liability, Settings) possuem campo `userId`. Todas as queries em todos os Server Actions filtram por `userId` obtido via `requireAuth()`.

**Implementação**:
- `requireAuth()` em `lib/session.ts` — lê o cookie de sessão, lança erro se ausente, retorna `userId`
- Todos os `app/actions/*.ts` chamam `requireAuth()` como primeira operação
- Constraints únicas compostas: `@@unique([userId, name])` em Tag, `@@unique([userId, category])` em Budget
- Backfill: ao adicionar `userId @default("")`, todos os registros existentes receberam o id do único usuário via script
- GoalPayment não possui `userId` direto — `markPayment()` verifica ownership via `{ id, goal: { userId } }` antes de qualquer modificação
- Todas as operações de deleção usam `deleteMany({ where: { id, userId } })` — o `delete()` singular do Prisma ignora campos não-PK no `where`, tornando o `userId` ineficaz como guarda

**Resultado**: múltiplos usuários podem usar o mesmo banco com isolamento completo. Criação e gestão de usuários via Studio.

### Proxy em vez de Middleware

**Decisão**: arquivo `proxy.ts` com export `proxy()` em vez de `middleware.ts`.

**Motivo**: convenção `middleware.ts` foi depreciada no Next.js 16. A convenção correta é `proxy.ts` com export nomeado `proxy`.

### Prisma v7 com adapter explícito

**Decisão**: `PrismaBetterSqlite3` instanciado em `lib/db.ts` e passado via `{ adapter }` ao `PrismaClient`.

**Motivo**: Prisma v7 removeu o suporte nativo ao SQLite inline na datasource. O novo modelo requer um adapter explícito. Isso também habilita futura troca para PostgreSQL sem mudança no código de queries — apenas a instanciação do adapter muda.

### Isolamento de bancos por ambiente

**Decisão**: cada ambiente mantém seu próprio arquivo `.env` (gitignored) com `DATABASE_URL` apontando para um banco SQLite exclusivo:

| Ambiente | Banco |
|---|---|
| `develop` (porta 3000) | `lyfx/dev.db` — dados de teste, resetável livremente |
| `master` (porta 4000) | `lyfx-production/prod.db` — dados reais do usuário |

**Motivo**: banco compartilhado entre dev e produção criava risco de corrupção de dados (migrações de schema em `develop` afetariam produção imediatamente). O isolamento via `.env` gitignored é automático — merges nunca tocam o arquivo de configuração de nenhum ambiente, preservando o apontamento de banco de cada um indefinidamente.

---

## 10.1 Fórmulas e Cálculos Técnicos

Referência de todas as fórmulas calculadas em memória (sem persistência de resultado, ou com resultado persistido após o cálculo). Importante para auditar e corrigir bugs de cálculo sem varrer o código.

### Score de Saúde Financeira (`lib/health.ts` → `computeHealthScore`)

```typescript
// Dados de entrada:
//   dre: DRESummary (mês atual)
//   avgExpenses3m: média de despesas dos últimos 3 meses
//   reserveAmount: settings.reserveBalance > 0 ? settings.reserveBalance : acumulado_debit_longterm

// Dimensão Comprometimento (0–30 pts)
committedRatio = dre.debits.committed / dre.credits.total  // ex: 0.40 = 40%
committedScore = committedRatio <= 0.30 ? 30 : Math.max(0, 30 - (committedRatio - 0.30) * 100)

// Dimensão Poupança (0–25 pts)
savingsRatio = dre.saved / dre.credits.total  // saved = debit_longterm
savingsScore = savingsRatio >= 0.20 ? 25 : (savingsRatio / 0.20) * 25

// Dimensão Resultado (0–25 pts)
netBalance = dre.margins.net  // receita - todas as despesas
resultScore = netBalance <= 0 ? 0 : Math.min(25, (netBalance / dre.credits.total) * 100)

// Dimensão Reserva (0–20 pts)
reserveMonths = avgExpenses3m > 0 ? reserveAmount / avgExpenses3m : 0
reserveScore = reserveMonths >= 6 ? 20 : (reserveMonths / 6) * 20

// Score final
totalScore = committedScore + savingsScore + resultScore + reserveScore  // 0–100

// Perfis
// 0–39  → "Em Recuperação"   (vermelho)
// 40–59 → "Estabilizado"     (âmbar)
// 60–79 → "Em Construção"    (cyan)
// 80–100→ "Livre"            (verde)
```

### DRE em Cascata (`app/actions/transactions.ts` → `getDRESummary`)

```typescript
// Agrupamento por tipo de categoria:
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
debits.total       = soma de todos os débitos

// Margens
margins.afterFixed     = credits.total - debits.fixed
margins.afterVariable  = margins.afterFixed - debits.variable
margins.afterCommitted = margins.afterVariable - debits.committed
margins.net            = credits.total - debits.total

// Campo derivado
saved = debits.longterm  // atalho para KPI "Poupado" no dashboard
```

### Projeções (`app/actions/projections.ts` → `getProjections`)

```typescript
// Para cada mês M dos próximos 12:
//   1. Filtrar transações recorrentes mensais onde:
//      - recurrence = "monthly"
//      - date.getDate() qualquer (o dia não muda)
//      - recurrenceEndsAt is null OR recurrenceEndsAt >= início do mês M
//   2. Filtrar transações recorrentes anuais onde:
//      - recurrence = "yearly"
//      - date.getMonth() === M.getMonth()  // mesmo mês do ano
//   3. Filtrar parcelas onde:
//      - installmentGroupId não-nulo
//      - date está dentro do mês M
//      - date >= hoje (parcelas passadas ignoradas)

// Saldo projetado para M:
projectedBalance[M] = Σ(income para M) - Σ(expenses para M)
// income = type="credit", expense = type="debit"
```

### Metas — distribuição de cobranças (`app/actions/goals.ts` → `createGoal`)

```typescript
// Garante que a soma exata seja targetAmount:
months = meses entre hoje e deadline (inclusivo)
baseAmount = Math.floor((targetAmount / months) * 100) / 100  // centavos para baixo
lastAmount = targetAmount - baseAmount * (months - 1)          // absorve resíduo

// GoalPayment gerado para cada mês:
for (let i = 0; i < months; i++) {
  dueDate = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)
  amount = i === months - 1 ? lastAmount : baseAmount
  // cria GoalPayment com goalId, dueDate, amount, paid=false
}
```

### Amortização de passivos (`lib/liabilities.ts` → `monthsToPayoff`)

```typescript
function monthsToPayoff(balance: number, monthlyRate: number, payment: number): number {
  if (payment <= balance * monthlyRate) return Infinity  // pagamento não cobre juros
  // Fórmula de amortização:
  return Math.ceil(
    -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
  )
}
// monthlyRate: taxa como decimal — ex: 5% a.m. → 0.05
// Alerta "nunca quitado": payment <= balance * monthlyRate

// Taxa anual equivalente (para exibição no alerta de passivo crítico):
annualRate = Math.pow(1 + monthlyRate, 12) - 1
// ex: 12% a.m. → (1.12)^12 - 1 ≈ 2.86 = 286% a.a.
```

### Provisão Sazonal (`components/fixed-expenses/FixedExpensesView.tsx` → `ProvisaoSazonal`)

```typescript
// Para cada despesa anual:
today = new Date()
nextOccurrence = new Date(expense.date.getFullYear(), expense.date.getMonth(), expense.date.getDate())
if (nextOccurrence <= today) nextOccurrence.setFullYear(today.getFullYear() + 1)

monthsRemaining = differenceInMonths(nextOccurrence, today) || 1  // mínimo 1 mês
monthlyProvision = expense.amount / monthsRemaining

// Urgência:
urgency = monthsRemaining <= 2 ? "danger" : monthsRemaining <= 4 ? "warning" : "ok"
```

---

## 10.2 Gotchas Técnicos Conhecidos

Esta seção documenta problemas reais encontrados em desenvolvimento, com causa-raiz e solução definitiva. Consultar aqui antes de investigar problemas similares.

### Prisma v7 — adapter obrigatório para SQLite

**Sintoma**: `db.qualquerModelo.findMany()` falha com `Cannot read properties of undefined`.

**Causa**: Prisma v7 removeu suporte nativo ao SQLite na datasource. O client precisa ser instanciado com `{ adapter: new PrismaBetterSqlite3(new BetterSqlite3(dbUrl)) }`.

**Onde está**: `lib/db.ts`. Instanciação singleton via `const globalForPrisma = global as any; globalForPrisma.prisma ??= new PrismaClient({ adapter })`.

**Após `db push`**: sempre rodar `npx prisma generate` — o client não reconhece modelos novos até ser regerado. O worktree de produção tem client separado e precisa de `generate` independente.

### Turbopack — cache de módulos com `"use server"`

**Sintoma**: novo modelo adicionado ao schema é reconhecido pelo Prisma em queries, mas componente cliente não o vê / `db.novoModelo` é undefined no servidor.

**Causa**: Turbopack mantém cache compilado do bundle do client. `"use server"` modules são compilados separadamente e podem ter o client gerado antes do `prisma generate`.

**Solução**: parar o servidor, rodar `npx prisma generate`, reiniciar. Se persistir, deletar `.next/` e reiniciar.

**Caso especial `PillProgress`**: modelo adicionado em v1.5.0 exibiu esse problema. Workaround `lib/db-pills.ts` removido em v1.11.0 — PostgreSQL não apresenta o problema de cache do Turbopack.

### `NEXT_PUBLIC_*` vars não recarregadas em runtime

**Sintoma**: variável existe no `.env` mas continua `undefined` no código mesmo após adicionar.

**Causa**: `NEXT_PUBLIC_*` são embedded em tempo de build/start — não são lidas em runtime. Adicionar ao `.env` não tem efeito sem reiniciar o servidor (`npm run dev`).

**Afeta**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — adicionada ao `.env` de produção mas requerendo restart para ter efeito.

### Google Maps — `overview_polyline.points` vs `overview_path`

**Sintoma**: PDF gerado sem mapa de rota, mesmo com API key configurada.

**Causa**: confusão entre os dois campos da response da Directions API:
- `routes[0].overview_polyline` → objeto com `.points` (encoded polyline string) ✅ correto
- `routes[0].overview_path` → array de `LatLng` ❌ não existe na REST API; existe no JS SDK client-side

**Onde está o fix**: `fetchDefaultPolyline` em `app/actions/km-reimbursement.ts` usa `data.routes[0].overview_polyline.points`.

### `deleteMany` vs `delete` para deleção com userId

**Sintoma**: deleção via `db.model.delete({ where: { id, userId } })` não está protegendo corretamente contra IDOR.

**Causa**: `delete()` do Prisma só aceita campos que fazem parte da PK no `where`. Para modelos com PK = `id`, o `userId` no `where` é **silenciosamente ignorado**. Qualquer usuário que souber o `id` pode deletar o registro de outro usuário.

**Solução**: usar `deleteMany({ where: { id, userId } })` — o `deleteMany` aceita qualquer campo no `where` e retorna `{ count: 0 }` se o registro não pertence ao usuário (sem erro, mas sem deleção).

**Auditoria v1.3.1**: todos os Server Actions foram revisados para usar `deleteMany` com `userId`.

### bodySizeLimit nas Server Actions

**Sintoma**: upload de PDF ou avatar grande retorna `413 Payload Too Large`.

**Causa**: Next.js tem limite padrão de 1MB em Server Actions (body do POST).

**Solução**: em `next.config.ts`:
```typescript
experimental: {
  serverActions: {
    bodySizeLimit: "5mb"
  }
}
```
Necessário para PDFs com múltiplas imagens de mapa embutidas em base64.

### Cookie path no logout do Studio

**Sintoma**: logout do Studio não remove o cookie `lyfx_admin`; cookie persiste após logout.

**Causa**: ao criar o cookie com `path: "/studio"`, a deleção também deve especificar `path: "/studio"`. Se deletar sem `path`, o browser procura o cookie no `path: "/"` (que não existe) e não encontra nada para deletar.

**Onde está**: `app/studio/actions.ts` → `adminLogout()` especifica `path: "/studio"` na deleção de `lyfx_admin` e `path: "/"` na deleção de `lyfx_session`.

### Docker + `output: "standalone"` — Prisma client não incluso automaticamente

**Sintoma**: container inicia mas todas as queries falham com `Cannot find module '.prisma/client'`.

**Causa**: o tracing automático do Next.js standalone (`outputFileTracingIncludes`) não inclui os arquivos gerados pelo `npx prisma generate` em `node_modules/.prisma/client`. O standalone captura apenas importações estáticas — o Prisma client é carregado dinamicamente em runtime.

**Solução**: no `Dockerfile`, após copiar `.next/standalone`, copiar o diretório gerado explicitamente. **Atenção ao caminho:** no Prisma v7, o client é gerado em `lib/generated/prisma` (não em `node_modules/.prisma` como nas versões anteriores):
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated/prisma ./lib/generated/prisma
```

**Onde está**: `Dockerfile` (stage runner, linhas após `COPY .next/static`).

### PostgreSQL 18 Docker — volume deve ser montado em `/var/lib/postgresql`

**Sintoma**: container `postgres:18-alpine` inicia mas fica em loop com erro: *"there appears to be PostgreSQL data in /var/lib/postgresql/data (unused mount/volume)"*.

**Causa**: a partir do PostgreSQL 18, a imagem Docker oficial mudou o diretório esperado para o mount. Versões anteriores usavam `/var/lib/postgresql/data`; a partir da 18, o mount deve ser no diretório pai `/var/lib/postgresql` — o banco cria automaticamente um subdiretório versionado.

**Solução**: nos compose files, usar:
```yaml
volumes:
  - lyfx_dev_data:/var/lib/postgresql   # correto para PG18+
  # NÃO usar: lyfx_dev_data:/var/lib/postgresql/data
```

**Onde está**: `docker-compose.yml` e `docker-compose.dev.yml`.

### Docker Compose v5 — `env_file` não remove aspas dos valores

**Sintoma**: variáveis do `.env` chegam ao container com aspas literais: `DATABASE_URL` vira `"postgresql://..."` (com aspas), quebrando a conexão Prisma. `POSTGRES_PASSWORD` chega como `"senha"` e o PostgreSQL rejeita.

**Causa**: Docker Compose v5 (e `docker run --env-file`) não faz strip de aspas duplas nos valores do `.env`. Se o arquivo tem `VAR="valor"`, o container recebe `VAR` com valor `"valor"` — incluindo as aspas como parte do string.

**Solução**: usar `--env-file` no comando `docker compose` para interpolação `${VAR}` (o parser do Compose faz strip de aspas), em vez de `env_file:` na service definition para variáveis críticas:
```yaml
# compose file: usa interpolação ${} — aspas removidas pelo Compose
environment:
  DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db-dev:5432/lyfx_dev
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

# comando: passa o .env para o Compose resolver as variáveis
# npm run docker:dev → docker compose --env-file .env -f docker-compose.dev.yml up
```

**Onde está**: todos os scripts `docker:*` em `package.json` usam `--env-file .env`.

### Docker — `localhost` não resolve o PostgreSQL do host

**Sintoma**: container sobe mas falha na conexão com o banco: `ECONNREFUSED 127.0.0.1:5432`.

**Causa**: dentro do container, `localhost` é o loopback do próprio container — não o host. O PostgreSQL roda no host, não no container.

**Solução**: substituir `localhost` por `host.docker.internal` no `DATABASE_URL` ao usar Docker:
```
DATABASE_URL="postgresql://postgres:senha@host.docker.internal:5432/lyfx_prod"
```

No Linux, o Docker não tem `host.docker.internal` automaticamente — o `docker-compose.yml` adiciona `extra_hosts: host.docker.internal:host-gateway` para resolver isso.

**Template**: `.env.docker.example` na raiz do projeto.

### BrasilAPI — cache in-memory não persiste entre workers

**Sintoma** (futuro, em ambiente serverless/multi-processo): feriados buscados novamente a cada cold start.

**Causa**: `lib/holidays.ts` usa `Map` em módulo Node.js. Em ambientes com múltiplos workers (Vercel, PM2 cluster), cada instância tem sua própria memória — o cache não é compartilhado entre processos.

**Comportamento atual**: aceitável para uso pessoal (single-process). Para multi-processo futuro: mover cache para Redis, banco ou `AppConfig`.

**Fallback**: se BrasilAPI estiver offline, `getHolidays` retorna `Set` vazio silenciosamente — D+5 calcula apenas por sáb/dom sem lançar erro.

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
| **Fase 6** | ✅ v1.0.0 | Reembolso com tracking (`reimbursedAt`, página `/reimbursements`, toggle no formulário), provisão sazonal automática em `/fixed-expenses`, modo "Avulsa" renomeado no formulário. Importação OFX/CSV adiada para fase futura. |
| **Fase 7** | ✅ v1.1.0 | Isolamento multi-usuário completo: `userId` em todas as tabelas de dados, `requireAuth()` em todos os Server Actions, constraints únicas compostas em Tag e Budget. Studio aprimorado: criar usuário, deletar com cascade, filtro por usuário com combobox digitável, cards de sistema (usuários/registros/tamanho DB). Navegação: acesso ao Studio via `/login`, logout sempre redireciona para `/`, back buttons em ambas as telas de login. |
| **Fase C** | ✅ v1.2.0 | Instituições (`/institutions`): cadastro de bancos/fintechs/corretoras com contas vinculadas, saldo e limite por conta, vínculo de passivos e transações por conta. |
| **Fase D** | ✅ v1.2.0 | Alertas (`/alerts`): central proativa com 4 tipos de alerta (orçamento, metas, projeção negativa, sazonal), agrupados por severidade. Correções de UI: seta de select via CSS, MonthPicker custom, correção de foco em ProfileForm, remoção de spinners em number input. Perfil de endereço estruturado em 5 campos com auto-fill ViaCEP e CountrySelect com ~195 países. |
| **Fase E** | ✅ v1.3.0 | Bens e Imóveis (`/assets`): cadastro de imóveis, veículos e outros bens com despesas associadas (IPTU, IPVA, ITR, seguro, licenciamento, manutenção), toggle de pago/pendente, alerta de vencidos, widget no dashboard. |
| **Auditoria** | ✅ v1.3.1 | Revisão completa de segurança e bugs: IDOR em `markPayment` corrigido, tipos `"income"/"expense"` → `"credit"/"debit"` em `getMonthlyBalance`, `requireAdmin()` interno em todas as actions do Studio, `delete()` → `deleteMany()` em goals/liabilities/institutions/transactions, parsing `parseBR()` para valores em formato brasileiro, `useEffect` substituindo `useState` como efeito colateral, verificação de ownership em `createAssetExpense`. |
| **Fase F** | ✅ v1.4.0 | Correções críticas (análise de consultor financeiro): (1) `reserveBalance` adicionado ao modelo `Settings` — usuário declara o saldo real do fundo de reserva via editor inline no card de Saúde Financeira; fallback automático para proxy (`debit_longterm`) se o campo não foi preenchido; (2) Alerta proativo de passivo crítico — `cheque_especial` e `rotativo` ativos geram alerta `danger` com taxa a.m. + equivalente a.a. calculado; novo tipo `"liability"` em `AlertsView`. Correções TypeScript pré-existentes: `reimbursedAt` adicionado à interface `Transaction`, `AnyTransaction` corrigido em `MonthlyCalendar`, `useState<string>` em `TagPicker` e `TagsManager`. |
| **Fase G** | ✅ v1.5.0 | Educação financeira (`/education`): 85 pílulas pedagógicas organizadas em 5 perfis de saúde financeira (`critical`, `serious`, `unstable`, `stable`, `healthy`), leitura com timer silencioso, quiz de fixação com feedback visual, streak semanal de 12 semanas, progresso persistido em `PillProgress` via `better-sqlite3` direto (contorno para cache persistente do Turbopack). |
| **Studio G2** | ✅ v1.8.0 | Studio Grupo 2: Aba Painel com dashboard de métricas (6 cards: usuários, registros, espaço em disco, planos, versões dev/prod) + toggles de configuração global (modo manutenção + texto do banner). Aba Módulos com toggle de beta por módulo em tempo real via `AppConfig`. Aba Notas com editor Markdown, toolbar completa e slash commands Notion-like. ERD colapsável por tabela com descrições. Seeds Full/Insider derivados automaticamente de `isBeta` em `lib/modules.ts`. Modelo `AppConfig` no banco. `lib/config.ts` para leitura sem auth. |
| **CS-18/CS-19** | ✅ v1.9.0 | Central de notificações: model `Notification` com `fingerprint`/`broadcastId`/`expiresAt`, segregação alertas automáticos × notificações do sistema. Sino no UserMenu com badge, dropdown com duas seções (Alertas financeiros + Notificações). Studio: aba Notificações para envio por plano/usuário com histórico de broadcasts. AlertsView: seções separadas, Limpar tudo, Marcar todas como lidas. Banner de manutenção em pill. Notificação de boas-vindas automática. Studio Painel redesenhado: layout 2 colunas (Sistema/Servidor), gauges SVG para RAM/Heap/CPU, métricas `lastSeenAt` (online agora / ativos hoje), versionamento de branch git. `User.lastSeenAt` atualizado a cada navegação. Fix type guards em GoalsView e TagPicker. |
| **CS-17** | ✅ v1.10.0 | Reembolso Especial (`/km-reimbursement`): módulo corporativo completo com 5 modelos (`KmConfig`, `KmPeriod`, `KmRoute`, `KmReceipt`, `KmExpense`), campos de veículo em `KmConfig`. Fluxo: nova solicitação → trajetos com Google Maps arrastável → notas de combustível → despesas extras → resumo SAP → envio com Transaction D+5 dias úteis. Lugares Salvos (`/km-reimbursement/places`) com rotas configuráveis armazenadas como JSON (`routeGoing`/`routeReturn`). PDF server-side (`@react-pdf/renderer`) com mapas embutidos via Google Static Maps API, polyline de rota usando `KmPlace` como fonte da verdade. PDF redesign v2: fundo cinza `#F5F6F9`, padrão de bolinhas SVG, header escuro com logotipo tipográfico `Ly`+`fx`, mini-header nas páginas 2+, cards brancos por trajeto, resumo com `wrap={false}`, footer "Demonstrativo de Rotas". `bodySizeLimit: "5mb"` nas Server Actions. |

### CS-23 — Containerização Docker ✅ v1.11.1

Infraestrutura Docker implementada para deploy autônomo:

- **`Dockerfile`** — multi-stage: `deps` (npm ci) → `builder` (prisma generate + next build) → `runner` (standalone mínimo, usuário não-root)
- **`next.config.ts`** — `output: "standalone"` — gera `.next/standalone/server.js` com dependências mínimas
- **`docker-compose.yml`** — produção, porta 4000, `env_file: .env`, `extra_hosts: host.docker.internal:host-gateway`
- **`docker-compose.dev.yml`** — desenvolvimento, porta 3000, bind mount com volumes para `node_modules` e `.next`
- **`.env.docker.example`** — template documentando a troca `localhost → host.docker.internal`
- **Scripts npm**: `docker:build`, `docker:up`, `docker:down`, `docker:logs`, `docker:dev`

**Dois grupos de containers (v1.11.2):**

| Grupo | Compose | Containers | Porta |
|---|---|---|---|
| Dev | `docker-compose.dev.yml` | `lyfx-db-dev` (PG18) + `lyfx-dev` (Next.js) | 3000 |
| Prod | `docker-compose.yml` | `lyfx-db-prod` (PG18) + `lyfx-migrate` + `lyfx-prod` (Next.js) | 4000 |

**Para usar:**
```bash
# Dev (lyfx/)
npm run docker:dev

# Prod (lyfx-production/)
npm run docker:up
```

**Migração de dados prod (primeira vez):**
1. `npm run docker:up` — sobe db-prod vazio + aplica schema via migrate
2. Dump do banco nativo: `pg_dump -U postgres -h localhost lyfx_prod > backup.sql`
3. Restaurar: `docker exec -i lyfx-db-prod psql -U postgres -d lyfx_prod < backup.sql`

### Próximas evoluções sugeridas

- **CS-20** — Studio: aba Roadmap/Backlog
- **CS-21** — Importação OFX/CSV: leitura de extratos bancários para lançamento semi-automático
- **CS-22** — Sistema de logo padronizado em SVG paths para todos os contextos
- **Deploy em produção**: PostgreSQL + domínio próprio → v2.0.0

---

*Última atualização: 07/06/2026. Versão atual: 1.11.2.*
