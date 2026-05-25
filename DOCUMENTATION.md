# Lyfx — Documentação Técnica
> Life Fixed · v1.6.2 · Maio 2026 · [Política de versionamento → VERSIONING.md](./VERSIONING.md)

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

## 6. Funcionalidades

### 6.1 Landing Page (`/`)

Página pública de apresentação do produto. Atualizada em v1.5.0 para refletir a visão atual do sistema.

- **Acesso**: qualquer visitante sem sessão
- **Comportamento com sessão ativa**: redireciona para `/dashboard`
- **Seções**: Navbar sticky, Hero com mockup do dashboard (inclui widget de saúde financeira), Marquee com termos do produto, 6 cards de features com mini-mockups interativos, seção "Como funciona" em 4 passos, FAQ accordion (7 perguntas), CTA final, Footer
- **Features destacadas**: DRE Pessoal, Score de Saúde, Educação Financeira, Alertas Proativos, Passivos & Dívidas, Bens & Imóveis
- **Marquee**: animação CSS contínua com termos do Lyfx (13 itens)
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

### 6.17 Alertas (`/alerts`)

Central de alertas proativos gerados automaticamente com base nos dados do usuário.

Cinco tipos de alerta calculados on-the-fly em `app/actions/alerts.ts`:

| Tipo | Severidade | Critério |
|---|---|---|
| Orçamento | ⚠ warning | Categoria ≥ 80% do limite definido |
| Orçamento | 🔴 danger | Categoria ≥ 100% do limite (estouro) |
| Meta | ⚠ warning | GoalPayment não pago com vencimento até o fim do mês |
| Meta | 🔴 danger | GoalPayment não pago com vencimento já vencido |
| Projeção | ⚠ warning | Algum dos próximos 12 meses com saldo livre negativo |
| Sazonal | ⚠ warning | Despesa anual com vencimento nos próximos 2 meses |
| Passivo | 🔴 danger | Passivo ativo do tipo `cheque_especial` ou `rotativo` — exibe taxa a.m. e equivalente anual |

- **Agrupamento por severidade**: danger → warning → info
- **AlertCard**: ícone de severidade, badge de tipo, título, descrição e botão de link para a seção relevante
- **Chips de resumo**: contagem de alertas por tipo no topo (inclui "Passivos")
- **Estado vazio**: ícone de sino verde e mensagem "Tudo em ordem!" quando não há alertas

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

**Nota técnica**: as queries de `PillProgress` usam `better-sqlite3` diretamente (`lib/db-pills.ts`) porque o Turbopack mantém cache compilado do client Prisma sem o modelo recém-adicionado. As operações CRUD de todos os outros modelos continuam via Prisma normalmente.

---

### 6.16 Studio (`/studio`)

Painel administrativo protegido por senha separada da sessão do usuário.

#### Autenticação e sessão

- **Senha**: configurada em `.env` → `ADMIN_SECRET`. Comparação direta (sem hash) — segredo de operação
- **Cookie**: `lyfx_admin` com `httpOnly: true`, `sameSite: lax`, expiração 2 horas, `path: "/studio"` (não vaza para outras rotas)
- **Acesso**: `/studio` — independente da sessão do app principal; acessível via link discreto na página `/login`
- **Logout**: limpa `lyfx_admin` (com `path: "/studio"`) **e** `lyfx_session` (com `path: "/"`) simultaneamente → redireciona para `/` via `redirect()` no server action (sem flash de tela)
- **Login form**: botão `← Login` no topo esquerdo navega para `/login`

#### Aba Schema

Visualização de todas as tabelas do banco com campos, tipos e descrições. Expansível por tabela. Mostra relações entre modelos.

#### Aba Docs

Renderização em Markdown do arquivo `DOCUMENTATION.md`. TOC lateral clicável com h2, h3 e h4 (h3 indentado 20px, h4 indentado 32px, tamanhos decrescentes). Clique em qualquer item do TOC faz scroll suave até o heading correspondente (slugify do texto).

#### Aba Usuários

- **Lista**: avatar, nome, e-mail, data de cadastro de todos os usuários
- **Reset de senha**: inline com confirmação — campo de nova senha (mínimo 6 chars) + botão de confirmação
- **Criar usuário**: formulário inline — nome, e-mail, senha. `revalidatePath("/studio")` + `router.refresh()` para atualização imediata sem reload
- **Deletar usuário**: botão vermelho com painel de confirmação inline. Cascade manual na ordem: transactions → tags → budgets → goals → liabilities → settings → user (sem FK do User para os modelos de dados)

#### Aba Dados

- **Seção Sistema** (topo): 3 cards — Usuários (contagem), Registros totais (soma de todas as tabelas), Tamanho do banco (leitura de `dev.db` via `fs/promises stat()`, formatado em B/KB/MB/GB)
- **Seção Usuários**: combobox digitável para filtrar usuários por nome ou e-mail (dropdown com busca, destaque cyan no item selecionado, fecha ao clicar fora via `useRef + useEffect`)
- **Dados por usuário**: ao selecionar, exibe contadores (transações, tags, orçamentos, metas) e tabela das 10 transações mais recentes do usuário
- **Dados globais** (sem filtro): exibe as 10 transações mais recentes do sistema

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
| `StudioClient.tsx` | Client Component com toda a UI do Studio: abas Schema/Docs/Usuários/Dados, formulário de login, criação/exclusão de usuários com confirmação inline, combobox digitável de filtro por usuário, cards de sistema, renderização Markdown da documentação com TOC clicável (h2/h3/h4). |
| `actions.ts` | `adminLogin`, `adminLogout` (limpa ambos os cookies + redireciona), `getStudioData`, `getStudioDataForUser`, `adminResetPassword`, `adminCreateUser`, `adminDeleteUser` (cascade manual), `getDocumentation`. |

#### `app/api/`

| Arquivo | O que faz |
|---|---|
| `clear-session/route.ts` | Route Handler GET — deleta o cookie `lyfx_session` e redireciona para `/login`. Usado como escape hatch quando o `userId` do cookie não existe mais no banco, evitando loop infinito no `AppLayout`. |

#### `components/landing/`

| Arquivo | O que faz |
|---|---|
| `LandingPage.tsx` | Página pública de marketing: navbar sticky com âncoras, hero com `DashboardMockup` (inclui widget de saúde financeira), marquee de termos, 6 cards de features com mini-mockups (DRE, Score de Saúde, Educação, Alertas, Passivos, Bens), seção "Como funciona" em 4 passos, FAQ accordion com 7 itens, CTA final e footer. |

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

#### `prisma/`

| Arquivo | O que faz |
|---|---|
| `schema.prisma` | Fonte de verdade do banco: define todos os modelos (User, Transaction, Tag, TransactionTag, Budget, Goal, GoalPayment, Settings, Liability, Institution, Account, Asset, AssetExpense) com campos, tipos, defaults, constraints únicas compostas e relações. |

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

### Próximas evoluções sugeridas

- **Importação OFX/CSV**: leitura de extratos bancários para lançamento semi-automático
- **Relatórios avançados**: comparativo mês a mês, evolução de categorias ao longo do tempo
- **Deploy em produção**: migração de SQLite para PostgreSQL (apenas troca do adapter Prisma + datasource URL)

---

*Última atualização: 22/05/2026. Versão atual: 1.5.0.*
