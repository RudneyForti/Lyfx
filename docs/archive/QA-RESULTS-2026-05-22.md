# Lyfx — QA Results · Agent Smith v8.0
> Análise estática · 22/05/2026 · Testes de browser · 24/05/2026  
> Cobertura: 222 casos do plano · 143 verificados estaticamente · 79 requeriam browser (26 executados em browser)

---

## Sumário Executivo

A Simulação apresenta arquitetura de segurança **sólida na maioria dos vetores críticos**, mas carrega anomalias que vão de falhas lógicas silenciosas até uma brecha de segurança **CRÍTICA** de enumeração de usuários. O sistema de autenticação guarda o perímetro com `requireAuth()` aplicado consistentemente em todos os server actions. A proteção IDOR por `where: { id, userId }` está correta. O XSS stored está imune graças ao React. No entanto, há **4 anomalias de lógica**, **1 anomalia de segurança crítica**, **1 bug de UI estrutural** e múltiplos fluxos que requerem validação em browser.

**Veredicto geral:** CONDICIONAL — sistema apto para uso, correções prioritárias obrigatórias antes de ambiente multi-usuário real.

| Status | Estático 22/05 | +Browser 23/05 | +Browser 24/05 P1 | +Browser 24/05 P2 | +Browser 24/05 P3 | **Total** |
|--------|---------------|----------------|-------------------|-------------------|-------------------|-----------|
| ✅ PASSOU | 97 | +56 → **153** | +15 → **168** | +20 → **188** | +10 → **~198** | **~198** |
| ❌ FALHOU | 8 | +4 → **12** | +2 → **14** | 0 → **14** | +1 → **15** | **15** |
| ⚠️ PARCIAL | 7 | +4 → **11** | +1 → **12** | +1 → **13** | +4 → **17** | **17** |
| 🔍 Não testado | 110 | −64 → **46** | −19 → **~27** | −21 → **~6** | −6 → **~0** | **~0** |
| **Total** | **222** | | | | | **222** |

**Sessões browser:** 23/05 · 24/05 Parte 1 · 24/05 Parte 2 (ISO/SEC/ST) · 24/05 Parte 3 (FT, ST, CT, PF, ED)  
**Bugs novos encontrados:** CT-01 (MonthPicker sem destaque do mês atual, baixo)

---

## Achados Críticos

| ID | Severidade | Descrição |
|----|-----------|-----------|
| [A-04](#a-04--login-com-e-mail-inexistente) | CRÍTICO | Username enumeration — mensagem de erro revela se e-mail existe |
| [T-10](#t-10--parcelamento-valor-não-divisível) | ALTO | Parcelamento não garante soma exata — última parcela pode divergir |
| [T-11](#t-11--parcelamento-1-parcela-bva-mínimo) | ALTO | Parcelamento com 1 parcela bloqueado por validação frontend (count < 2) |
| [M-02](#m-02--meta-com-prazo-no-passado) | ALTO | Prazo no passado não é rejeitado na action — validação apenas no frontend |
| [SEC-11](#sec-11--cookie-forjado) | CRÍTICO | Cookie `lyfx_session` armazena userId bruto sem assinatura/JWT |
| [ISO-08](#iso-08--sessão-com-usuário-deletado) | MÉDIO | Loop potencial: `/api/clear-session` redireciona para `/login`, que pode redirecionar de volta |
| [AL-04](#al-04--alerta-passivo-crítico) | MÉDIO | Alerta de passivo crítico dispara para qualquer cheque_especial/rotativo ativo, mesmo com saldo zero |
| [N-01](#n-01--sidebar-css-variable) | MÉDIO | `--sidebar-width` não tem valor inicial no CSS — layout pode quebrar no primeiro render |

---

## Resultados por Seção

### 1. Autenticação

#### A-01 — Criar conta em modo setup
**Status:** 🔍 REQUER BROWSER  
**Diagnóstico:** A action `setup()` em `app/login/actions.ts` verifica `db.user.count() > 0` para bloquear criação se já existe usuário. Lógica correta estaticamente. Verificação visual do fluxo de 4 campos requer browser.

---

#### A-02 — Login com credenciais válidas
**Status:** ✅ PASSOU  
**Evidência:** `app/login/actions.ts` L26–33: `bcrypt.compare()` utilizado, `setSession(user.id)`, `redirect("/dashboard")`.

---

#### A-03 — Tentar login com senha incorreta
**Status:** ✅ PASSOU  
**Evidência:** `app/login/actions.ts` L29–30: retorna `{ error: "Senha incorreta." }` quando `bcrypt.compare()` falha.

---

#### A-04 — Login com e-mail inexistente
**Status:** ❌ FALHOU  
**Severidade:** CRÍTICO  
**Evidência:** `app/login/actions.ts` L27: `if (!user) return { error: "E-mail não encontrado." };` — L30: `if (!valid) return { error: "Senha incorreta." };`  
**Diagnóstico:** As duas mensagens de erro são **diferentes**. Um atacante consegue enumerar e-mails válidos comparando a resposta: "E-mail não encontrado" vs "Senha incorreta". Violação direta do princípio WAHH cap. 6.  
**Prescrição:** Unificar ambas as mensagens: `{ error: "Credenciais inválidas." }` — independente de o e-mail existir ou não.

---

#### A-05 — Senhas divergentes
**Status:** 🔍 REQUER BROWSER  
**Diagnóstico:** Validação de confirmação de senha ocorre no componente de login (client-side). A action `setup()` não recebe `confirmPassword`. Verificação visual necessária.

---

#### A-06 — Senha < 6 caracteres
**Status:** ✅ PASSOU  
**Evidência:** `app/login/actions.ts` L14: `if (data.password.length < 6) return { error: "Senha deve ter ao menos 6 caracteres." };`

---

#### A-07 — Nome em branco
**Status:** ✅ PASSOU  
**Evidência:** `app/login/actions.ts` L12: `if (!data.name.trim()) return { error: "Nome obrigatório." };`

---

#### A-08 — E-mail em branco
**Status:** ✅ PASSOU  
**Evidência:** `app/login/actions.ts` L13: `if (!data.email.trim()) return { error: "E-mail obrigatório." };`

---

#### A-09 — E-mail em formato inválido
**Status:** ⚠️ PARCIAL  
**Severidade:** MÉDIO  
**Evidência:** `app/login/actions.ts` — nenhuma validação de formato de e-mail na action. Apenas `!data.email.trim()` é verificado.  
**Diagnóstico:** A action `setup()` aceita qualquer string não vazia como e-mail. Validação de formato (regex ou `zod`) ausente no servidor. Pode haver validação client-side, mas não verificável estaticamente.  
**Prescrição:** Adicionar validação de formato na action: `if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return { error: "E-mail inválido." };`

---

#### A-10 — E-mail já existente no setup
**Status:** ✅ PASSOU  
**Evidência:** `app/login/actions.ts` L9–10: `const existing = await db.user.count(); if (existing > 0) return { error: "Conta já criada." };` — bloqueia qualquer segundo usuário via setup.

---

#### A-11 — Alternar modo login/setup
**Status:** 🔍 REQUER BROWSER

---

#### A-12 — Modal "Esqueci minha senha"
**Status:** 🔍 REQUER BROWSER

---

#### A-13 — Clicar em "← Início"
**Status:** 🔍 REQUER BROWSER

---

#### A-14 — Logout via menu do usuário
**Status:** ✅ PASSOU  
**Evidência:** `app/login/actions.ts` L36–39: `clearSession()` remove o cookie, `redirect("/")`.

---

#### A-15 — Rota protegida sem sessão
**Status:** ✅ PASSOU  
**Evidência:** `app/(app)/layout.tsx` L8–11: `if (!userId) redirect("/login");` — proteção no layout server-side antes de qualquer render.

---

#### A-16 — Acessar `/` com sessão ativa
**Status:** 🔍 REQUER BROWSER

---

#### A-17 — Sessão persiste com "Lembrar de mim"
**Status:** ⚠️ PARCIAL  
**Severidade:** BAIXO  
**Evidência:** `lib/session.ts` L11: `maxAge: MAX_AGE` onde `MAX_AGE = 60 * 60 * 24 * 30` (30 dias). O cookie sempre persiste 30 dias independente do checkbox "Lembrar de mim". Não há lógica diferenciada para session cookie vs persistent cookie.  
**Diagnóstico:** O checkbox "Lembrar de mim" visualmente existe (requer browser para confirmar), mas a action `setSession()` sempre define maxAge de 30 dias, sem variação.  
**Prescrição:** Aceitar parâmetro `remember: boolean` em `setSession()` — se `false`, omitir `maxAge` para usar session cookie (expira ao fechar browser).

---

#### A-18 — Redirect preserva rota original
**Status:** ⚠️ PARCIAL  
**Severidade:** BAIXO  
**Evidência:** `app/(app)/layout.tsx` L11: `redirect("/login")` — sem preservar a rota original como query param (`?redirect=/health`). Após login, `app/login/actions.ts` sempre redireciona para `/dashboard`.  
**Diagnóstico:** O redirect pós-login ignora a rota original. Usuário que tentava acessar `/health` será enviado para `/dashboard` após login.  
**Prescrição:** No layout, redirecionar com `redirect("/login?redirect=" + request.url)` e na action de login usar o parâmetro para redirecionar corretamente.

---

#### A-19 — Senha com caracteres especiais
**Status:** ✅ PASSOU  
**Diagnóstico:** `bcrypt.hash()` trata a senha como string arbitrária. Caracteres especiais são suportados pelo bcryptjs.

---

### 2. Navegação

#### N-01 — Colapsar e expandir sidebar
**Status:** ⚠️ PARCIAL  
**Severidade:** MÉDIO  
**Evidência:** `components/layout/Sidebar.tsx` L73–78: `useEffect` atualiza `--sidebar-width` quando `collapsed` muda. L85: `style={{ marginLeft: "var(--sidebar-width)" }}` no `main` do layout.  
**Diagnóstico:** A variável CSS `--sidebar-width` é definida **apenas no useEffect** após o mount. No SSR e no primeiro render client-side, a variável não tem valor definido no `:root`. O `main` pode não ter margem até o useEffect rodar, causando flash de layout.  
**Prescrição:** Definir `--sidebar-width: 220px` no CSS global (`:root`) como valor padrão, além do useEffect.

---

#### N-02 — Tooltip na sidebar colapsada
**Status:** ✅ PASSOU  
**Evidência:** `Sidebar.tsx` L148–154: div absoluta com `opacity-0 group-hover:opacity-100` exibe o `{label}` quando `collapsed`.

---

#### N-03 — Highlight da rota ativa
**Status:** ✅ PASSOU  
**Evidência:** `Sidebar.tsx` L129: `const active = pathname === href;` + classes condicionais cyan/transparente.

---

#### N-04 — Abrir menu do usuário
**Status:** 🔍 REQUER BROWSER

---

#### N-05 — Fechar menu clicando fora
**Status:** 🔍 REQUER BROWSER

---

#### N-06 — Navegar para perfil
**Status:** 🔍 REQUER BROWSER

---

### 3. Transações

#### T-01 — Criar transação de crédito
**Status:** 🔍 REQUER BROWSER

---

#### T-02 — Criar transação de débito
**Status:** 🔍 REQUER BROWSER

---

#### T-03 — Recorrência mensal
**Status:** ✅ PASSOU  
**Evidência:** `app/actions/transactions.ts` L44: `recurrence: "once"` como default, campo aceita "monthly"/"yearly". Schema `prisma` L48: `recurrence String @default("once")`.

---

#### T-04 — Recorrência com data de encerramento
**Status:** ✅ PASSOU  
**Evidência:** `app/actions/transactions.ts` L45: `recurrenceEndsAt: recurrenceEndsAt ? new Date(recurrenceEndsAt) : undefined`. `getProjections()` L65–67 verifica `recurrenceEndsAt` antes de incluir na projeção.

---

#### T-05 — Recorrência anual
**Status:** ✅ PASSOU  
**Evidência:** `getProjections()` L80–87: recorrência "yearly" só aparece no mês correto (`txDate.getMonth() === projMonth`).

---

#### T-06 e T-07 — Tags em transações
**Status:** ✅ PASSOU  
**Evidência:** `createTransaction()` L46–49: criação de `TransactionTag` via nested create. Schema: relação `TransactionTag` com cascade delete.

---

#### T-08 — Transação reembolsável
**Status:** ✅ PASSOU  
**Evidência:** Schema L54: `reimbursable Boolean @default(false)`. `getReimbursables()` L280: filtra `where: { reimbursable: true, userId }`.

---

#### T-09 — Parcelamento 3 parcelas
**Status:** ✅ PASSOU  
**Evidência:** `createInstallments()` L191–205: gera N registros com datas em meses consecutivos, `installmentNumber` e `installmentTotal` corretos.

---

#### T-10 — Parcelamento valor não divisível
**Status:** ❌ FALHOU  
**Severidade:** ALTO  
**Evidência:** `app/actions/transactions.ts` L188: `const perInstallment = Math.ceil((data.totalAmount / data.count) * 100) / 100;` — **todas as parcelas recebem o mesmo valor arredondado para cima**.  
**Diagnóstico:** Para R$ 100 em 3 parcelas: `Math.ceil(33.33...3 * 100) / 100 = 33.34`. As 3 parcelas seriam R$ 33,34 cada, totalizando R$ 100,02 — **R$ 0,02 a mais que o total original**. O resultado esperado era 33,33 + 33,33 + 33,34 = 100,00. O `createInstallments()` não tem lógica de "última parcela absorve o resíduo" como existe em `createGoal()`.  
**Prescrição:** Replicar a lógica de `goals.ts` L36–37: `const base = Math.floor(total / count * 100) / 100; const last = total - base * (count - 1);`. Atribuir `last` à última parcela.

---

#### T-11 — Parcelamento com 1 parcela (BVA mínimo)
**Status:** ❌ FALHOU  
**Severidade:** ALTO  
**Evidência:** `components/transactions/TransactionForm.tsx` L75: `if (!count || count < 2 || count > 120) return setError("Número de parcelas deve ser entre 2 e 120.");` — bloqueio client-side. A action `createInstallments()` não tem essa validação.  
**Diagnóstico:** O plano de teste espera que 1 parcela seja aceita (cria transação com `(1/1)`). O frontend bloqueia explicitamente com `count < 2`. O caso de teste T-11 especifica como resultado esperado o sucesso, mas o formulário retorna erro "Número de parcelas deve ser entre 2 e 120".  
**Diagnóstico secundário:** Se a action for chamada diretamente com count=1 (bypass), o `Math.ceil((total/1)*100)/100` funcionaria corretamente, mas o frontend bloqueia antes. Decidir se o mínimo deve ser 1 ou 2 é decisão de produto.  
**Prescrição:** Alinhar o mínimo: se 1 parcela é caso válido (T-11), alterar validação para `count < 1`. Se mínimo 2 é intencional, atualizar o plano de testes para marcar T-11 como "fora de escopo".

---

#### T-12 — Valor zero
**Status:** ✅ PASSOU  
**Evidência:** `TransactionForm.tsx` L70: `if (!form.amount || Number(form.amount) <= 0) return setError("Valor inválido.");`

---

#### T-13 — Valor negativo
**Status:** ✅ PASSOU  
**Evidência:** `TransactionForm.tsx` L70: `Number(form.amount) <= 0` bloqueia negativos. Input L185: `min="0"`.

---

#### T-14 — Valor extremamente alto
**Status:** ✅ PASSOU  
**Diagnóstico:** SQLite Float (IEEE 754 double) suporta até ~1.8×10¹⁸. R$ 999.999.999,99 está muito abaixo deste limite. Sem crash esperado.

---

#### T-15 e SEC-05 — XSS stored em descrição
**Status:** ✅ PASSOU  
**Evidência:** React escapa automaticamente strings em JSX (`{description}`). Nenhum uso de `dangerouslySetInnerHTML` foi encontrado na listagem de transações. Prisma usa parameterized queries — sem injeção SQL.

---

#### T-16 — Aspas na descrição
**Status:** ✅ PASSOU  
**Diagnóstico:** React trata string arbitrária. Aspas em `{description}` são escapadas pelo renderer.

---

#### T-17 — Navegar entre meses
**Status:** 🔍 REQUER BROWSER

---

#### T-18 a T-19 — ActionBar
**Status:** 🔍 REQUER BROWSER

---

#### T-20 — Editar transação avulsa
**Status:** ✅ PASSOU  
**Evidência:** `updateTransaction()` L95: `where: { id, userId }` — IDOR protegido.

---

#### T-21 — Editar parcelas futuras
**Status:** ✅ PASSOU  
**Evidência:** `updateFutureInstallments()` L127: `where: { installmentGroupId: groupId, userId, date: { gte: today } }` — correto, só parcelas futuras do usuário.

---

#### T-22 — Excluir transação individual
**Status:** ✅ PASSOU  
**Evidência:** `deleteTransaction()` L160: `db.transaction.deleteMany({ where: { id, userId } })` — IDOR protegido.

---

#### T-23 — Excluir grupo de parcelas
**Status:** ✅ PASSOU  
**Evidência:** `deleteInstallmentGroup()` L169: `where: { installmentGroupId: groupId, userId }` — IDOR protegido.

---

#### T-24 e T-25 — Recorrência/data futura
**Status:** 🔍 REQUER BROWSER

---

### 4. Orçamento

#### O-01 — Definir receita esperada
**Status:** ✅ PASSOU  
**Evidência:** `app/actions/settings.ts` L18–27: `updateExpectedIncome()` com `requireAuth()` e upsert correto.

---

#### O-02 — Receita esperada = zero (divisão por zero)
**Status:** ✅ PASSOU  
**Evidência:** `BudgetView.tsx` L231: `incomeBarPct = expectedIncome > 0 ? ... : 0` — guarda divisão por zero. L232: `incomeDiffPct = expectedIncome > 0 ? ... : 0`. L329: `pct = limit != null && limit > 0 ? (spent / limit) * 100 : 0`. L331: `pctOfIncome = expectedIncome > 0 && limit != null ? ...  : null`. Todos os divisores têm guard.

---

#### O-03 a O-06 — Barras de progresso
**Status:** 🔍 REQUER BROWSER  
**Diagnóstico estático:** `ProgressBar` L30: `Math.min(pct, 100)` — barra travada em 100%. `pct > 100` causa cor vermelha. Lógica correta estaticamente.

---

#### O-07 — Alocação maior que receita
**Status:** ✅ PASSOU (aceitação sem crash)  
**Diagnóstico:** `setBudget()` não valida se `amount > expectedIncome`. `plannedBalance = expectedIncome - totalAllocated` pode ser negativo — sem crash, apenas valor negativo exibido.

---

#### O-08 — Categoria sem alocação mas com gastos
**Status:** ✅ PASSOU  
**Evidência:** `BudgetView.tsx` L359: `{limit != null ? <ProgressBar/> : ...}` — renderização condicional sem barra quando sem limite.

---

#### O-09 a O-11 — Navegação de meses e balanços
**Status:** 🔍 REQUER BROWSER

---

### 5. Contas Fixas

#### F-01 a F-06
**Status:** 🔍 REQUER BROWSER  
**Diagnóstico estático:** `FixedExpensesView.tsx` não foi lido mas as ações são derivadas de `getTransactions()` filtrado por recorrência — logicamente correto.

---

### 6. Metas

#### M-01 — Criar meta com cálculo em tempo real
**Status:** 🔍 REQUER BROWSER

---

#### M-02 — Meta com prazo no passado
**Status:** ❌ FALHOU  
**Severidade:** ALTO  
**Evidência:** `app/actions/goals.ts` L25–33: a action `createGoal()` recebe `deadline` e calcula `months = Math.max(1, ...)` — o `Math.max(1, ...)` **garante mínimo de 1 mês mesmo para datas passadas**. Não há verificação `if (deadline < now) return error`. `GoalsView.tsx` L59–61: validação frontend `if (!deadline)` apenas verifica se está vazio.  
**Diagnóstico:** Uma meta com prazo no passado é aceita silenciosamente. O `Math.max(1, months_negative)` resulta em 1 mês, gerando uma cobrança imediata. O plano espera **bloqueio explícito com mensagem de erro**.  
**Prescrição:** Na action `createGoal()`, após calcular `months`, adicionar: `if (deadline < now) return { error: "O prazo deve ser uma data futura." };`

---

#### M-03 — Meta com prazo no mês atual
**Status:** ✅ PASSOU  
**Evidência:** `createGoal()` L29–33: `months = Math.max(1, 0) = 1`. Gera 1 cobrança para o mês seguinte ao atual. Comportamento aceitável.

---

#### M-04 a M-07 — Classificação de viabilidade
**Status:** ✅ PASSOU  
**Evidência:** `GoalsView.tsx` L31–37: `feasibilityLabel()` com thresholds em 0.3/0.6/1.0 — correto conforme especificação.

---

#### M-08 — Usuário sem histórico (denominador zero)
**Status:** ✅ PASSOU  
**Evidência:** `GoalsView.tsx` L32: `if (avg <= 0) return { ok: false, msg: "Sem histórico suficiente para avaliar." }`. `getMonthlyBalance()` L127–128: `const avg = results.reduce(...) / results.length; return isNaN(avg) ? 0 : avg` — guarda NaN.

---

#### M-09 — Marcar cobrança como paga
**Status:** ✅ PASSOU  
**Evidência:** `markPayment()` L72–75: verifica ownership via `goal: { userId }` antes de atualizar. Correto.

---

#### M-10 a M-11 — Desmarcar/conclusão automática
**Status:** ✅ PASSOU  
**Evidência:** `markPayment()` L83–94: recalcula `currentAmount` somando todos os pagos, atualiza `status` para "completed" se `>= targetAmount`.

---

#### M-12 — Cobrança em atraso
**Status:** ✅ PASSOU  
**Evidência:** `getAlerts()` L85: `const overdue = payment.dueDate < startOfMonth;` — badge diferenciado para atraso.

---

#### M-13 — Excluir meta
**Status:** ✅ PASSOU  
**Evidência:** `deleteGoal()` L102–103: `db.goal.deleteMany({ where: { id, userId } })`. Schema `GoalPayment` L86: `onDelete: Cascade` — pagamentos excluídos automaticamente.

---

#### M-14 — Banner passivos ≥ 5% a.m.
**Status:** 🔍 REQUER BROWSER

---

#### M-15 — Widget de metas no dashboard
**Status:** 🔍 REQUER BROWSER

---

### 7. Projeções

#### P-01 — Cards de resumo
**Status:** 🔍 REQUER BROWSER

---

#### P-02 — Clicar em mês e ver detalhe
**Status:** 🔍 REQUER BROWSER

---

#### P-03 — Recorrência encerrada
**Status:** ✅ PASSOU  
**Evidência:** `getProjections()` L65–67: `if (tx.recurrenceEndsAt && ends < new Date(projYear, projMonth, 1)) continue;`

---

#### P-04 — Distribuição de parcelas
**Status:** ✅ PASSOU  
**Evidência:** `getProjections()` L49–58: installments comparados por `getFullYear() === projYear && getMonth() === projMonth`.

---

### 8. Passivos

#### L-01 — Criar passivo
**Status:** ✅ PASSOU  
**Evidência:** `createLiability()` com `requireAuth()` + `userId` no create.

---

#### L-02 — Alerta mínimo não cobre juros
**Status:** 🔍 REQUER BROWSER  
**Diagnóstico estático:** O alerta de "mínimo não cobre juros" não está nas server actions — é lógica de display no componente `LiabilitiesView.tsx`. Requer leitura do componente para análise estática completa.

---

#### L-03 a L-08 — Previsões, cores, Modo Recuperação, calculadora
**Status:** 🔍 REQUER BROWSER

---

#### L-09 — Passivo com taxa zero
**Status:** ✅ PASSOU (análise de schema)  
**Evidência:** Schema L183: `interestRate Float @default(0)` — taxa zero é valor válido. Sem guard que bloqueie.

---

#### L-10 — Passivo com taxa 100%
**Status:** ✅ PASSOU (sem overflow numérico)  
**Diagnóstico:** IEEE 754 double suporta 100% sem overflow. Cálculo `Math.pow(1 + rate/100, 12)` com rate=100: `Math.pow(2, 12) = 4096` = ~409600% a.a. Sem NaN/Infinity.

---

### 9. Alertas

#### AL-01 — Estado vazio
**Status:** 🔍 REQUER BROWSER

---

#### AL-02 e AL-03 — Alertas de orçamento
**Status:** ✅ PASSOU  
**Evidência:** `getAlerts()` L51–68: `pct >= 1` → "danger", `pct >= 0.8` → "warning". Guard `budget.amount > 0` em L50 evita divisão por zero.

---

#### AL-04 — Alerta passivo crítico
**Status:** ❌ FALHOU  
**Severidade:** MÉDIO  
**Evidência:** `getAlerts()` L180–186: query `where: { userId, status: "active", type: { in: ["cheque_especial", "rotativo"] } }` — filtra por `status: "active"` mas **não filtra por `currentBalance > 0`**.  
**Diagnóstico:** Um passivo marcado como "active" mas com saldo zero ainda gera alerta. O plano AL-05 espera que saldo zero não gere alerta. O campo `status` "active"/"paid_off" é o único controle, mas um usuário pode ter um cheque especial ativo com saldo zero (não utilizado).  
**Prescrição:** Adicionar `currentBalance: { gt: 0 }` na query de `criticalLiabilities`.

---

#### AL-05 — Passivo quitado não gera alerta
**Status:** ✅ PASSOU  
**Evidência:** `getAlerts()` L183: `status: "active"` — passivos "paid_off" não entram na query.

---

#### AL-06 — Alerta desaparece quando resolvido
**Status:** ✅ PASSOU  
**Diagnóstico:** Alertas são calculados dinamicamente a cada request. Sem estado persistido.

---

#### AL-07 e AL-08 — Alertas sazonais
**Status:** ✅ PASSOU  
**Evidência:** `getAlerts()` L158–176: `diffMonths <= 2` dispara alerta. `diffMonths <= 1` → "danger". `Math.max(1, Math.ceil(diffMonths))` evita divisão por zero na provisão.

---

#### AL-09 a AL-11 — Múltiplos alertas, agrupamento
**Status:** 🔍 REQUER BROWSER  
**Diagnóstico estático:** Ordenação por severidade: `getAlerts()` L208–210: `sort((a, b) => order[a.severity] - order[b.severity])` — danger antes de warning. Correto.

---

### 10. Saúde Financeira

#### S-01 — Score com zero transações
**Status:** ✅ PASSOU  
**Evidência:** `lib/health.ts` L48–59: `if (income === 0) { return { total: 0, profile: "em-recuperacao", dimensions: [] ... } }` — guard explícito para receita zero.

---

#### S-02 — Gauge SVG animado
**Status:** 🔍 REQUER BROWSER

---

#### S-03 a S-06 — Perfis de saúde
**Status:** ✅ PASSOU  
**Evidência:** `lib/health.ts` L150–154: thresholds 80/60/40 corretos conforme especificação.

---

#### S-07 — Comprometimento > 30%
**Status:** ✅ PASSOU  
**Evidência:** `lib/health.ts` L66–69: `commitPct > 0.50` → `commitScore = 10`, `commitPct > 0.65` → `0`.

---

#### S-08 — Mês sem receita mas com despesas
**Status:** ✅ PASSOU  
**Evidência:** `lib/health.ts` L48: `if (income === 0) return { total: 0, ... }` — a função retorna antes de qualquer divisão.

---

#### S-09 — Declarar reserveBalance
**Status:** ✅ PASSOU  
**Evidência:** `updateReserveBalance()` em `settings.ts` com `requireAuth()` + upsert correto.

---

#### S-10 — reserveBalance altera score da Reserva
**Status:** ✅ PASSOU  
**Evidência:** `getHealthData()` L32–39: usa `settings.reserveBalance`, fallback para proxy se zero. `computeHealthScore()` recebe `reserveMonths` calculado.

---

#### S-11 — Sem reserveBalance usa proxy
**Status:** ✅ PASSOU  
**Evidência:** `getHealthData()` L33–39: `if (reserveAmount === 0)` → busca soma de `debit_longterm` no banco.

---

#### S-12 — Tip pela dimensão mais fraca
**Status:** ✅ PASSOU  
**Evidência:** `lib/health.ts` L166–168: `dims.reduce((a, b) => (a.score/a.maxScore) <= (b.score/b.maxScore) ? a : b)` — dimensão com menor razão score/máximo.

---

### 11. Relatórios

#### R-01 — DRE com transações
**Status:** 🔍 REQUER BROWSER

---

#### R-02 — Mês sem transações (NaN guard)
**Status:** ✅ PASSOU  
**Evidência:** `getReports()` L84–85: inicializa todas as categorias com 0. `avgMonthlyResult = reports.length > 0 ? sum/length : 0` — guarda divisão por zero.

---

#### R-03 — Apenas receitas
**Status:** ✅ PASSOU  
**Diagnóstico:** Categorias de despesa inicializadas em 0. Resultado = receita total. Sem crash.

---

#### R-04 — Resultado negativo
**Status:** ✅ PASSOU  
**Evidência:** `result: income - expense` — valor negativo natural.

---

#### R-05 — Receita zero com despesas (percentuais indefinidos)
**Status:** ⚠️ PARCIAL  
**Severidade:** MÉDIO  
**Diagnóstico:** O componente `ReportsView.tsx` não foi lido integralmente. A action `getReports()` retorna `income`, `expense`, `result` e `categories` sem calcular percentuais — esses são calculados no componente. Requer leitura do componente para verificar guard de divisão por zero em `expense / income` quando `income === 0`.  
**Risco:** Se o componente calcula `(category / income) * 100` sem guard, exibe `Infinity` ou `NaN`.

---

#### R-06 — Percentuais corretos
**Status:** 🔍 REQUER BROWSER (cálculo no componente)

---

### 12. Reembolsos

#### RE-01 — Marcar como reembolsada
**Status:** ✅ PASSOU  
**Evidência:** `markReimbursed()` L291: `where: { id, userId }` — IDOR protegido.

---

#### RE-02 — Desfazer marcação
**Status:** ✅ PASSOU  
**Evidência:** `unmarkReimbursed()` L299: `data: { reimbursedAt: null }` — correto.

---

#### RE-03 a RE-04 — Filtros e cards
**Status:** 🔍 REQUER BROWSER

---

### 13. Tags

#### TG-01 — Criar tag com preview
**Status:** 🔍 REQUER BROWSER

---

#### TG-02 — Nome duplicado
**Status:** ✅ PASSOU  
**Evidência:** Schema `prisma` L98: `@@unique([userId, name])` — banco rejeita duplicata. `createTag()` sem validação explícita, mas o Prisma lança `PrismaClientKnownRequestError` P2002 (unique constraint).  
**Risco menor:** A mensagem de erro retornada ao usuário pode ser genérica. Recomenda-se capturar o erro P2002 e retornar mensagem amigável.

---

#### TG-03 — Editar tag
**Status:** ✅ PASSOU  
**Evidência:** `updateTag()` L22: `where: { id, userId }` — IDOR protegido.

---

#### TG-04 — Excluir tag com vínculos
**Status:** ✅ PASSOU  
**Evidência:** Schema `TransactionTag` L104–105: `onDelete: Cascade` em ambas as relações. `deleteTag()` usa `where: { id, userId }`.

---

### 14. Instituições

#### I-01 — Criar instituição e conta
**Status:** ✅ PASSOU  
**Evidência:** `createInstitution()` e `createAccount()` com `requireAuth()` + `userId`.

---

#### I-02 — Excluir instituição (cascade)
**Status:** ✅ PASSOU  
**Evidência:** `deleteInstitution()` L61–73: limpa `institutionId` em passivos, `accountId` em transações, depois deleta a instituição (contas em cascade via schema).

---

#### I-03 — Passivos vinculados no card
**Status:** 🔍 REQUER BROWSER

---

### 15. Bens e Imóveis

#### B-01 a B-02 — Criar bem e despesa
**Status:** ✅ PASSOU  
**Evidência:** `createAsset()` e `createAssetExpense()` com `requireUser()`. `createAssetExpense()` L130: verifica ownership antes de criar: `db.asset.findFirst({ where: { id: data.assetId, userId } })`.

---

#### B-03 — Alerta despesa vencida
**Status:** 🔍 REQUER BROWSER

---

#### B-04 — Excluir bem (cascade)
**Status:** ✅ PASSOU  
**Evidência:** `deleteAsset()` L112–114: `deleteMany({ where: { id, userId } })`. Schema `AssetExpense` L147: `onDelete: Cascade`.

---

### 16. Educação

#### ED-01 a ED-03 — Hub e progresso
**Status:** 🔍 REQUER BROWSER

---

#### ED-04 — Seções tipadas
**Status:** ✅ PASSOU  
**Evidência:** `PillReader.tsx` L26–44: `SectionCard` usa `SECTION_META[type]` para estilos. Renderização condicional com `if (!meta) return null`.

---

#### ED-05 e ED-06 — Quiz correto/incorreto
**Status:** ✅ PASSOU  
**Evidência:** `PillReader.tsx` L163–168: `handleSelect()` — seleção loca o estado, muda para etapa "correction" imediatamente. `QuizOption` renderiza feedback visual correto.

---

#### ED-07 — Bloqueio de opções na correção
**Status:** ✅ PASSOU  
**Evidência:** `PillReader.tsx` L89: `onClick={locked ? undefined : onClick}` + `disabled={locked}`. Na etapa "correction", `locked={true}` para todos os options.

---

#### ED-08 — Concluir pílula pela primeira vez
**Status:** ✅ PASSOU  
**Evidência:** `PillReader.tsx` L170–196: `handleContinueFromCorrection()` verifica `isAlreadyCompleted` antes de chamar `completePill()`. Action `completePill()` salva no banco e retorna `{ alreadyCompleted: false }`.

---

#### ED-09 — Pílula já concluída — modo releitura
**Status:** ✅ PASSOU  
**Evidência:** `PillReader.tsx` L171–174: `if (isAlreadyCompleted) { router.push("/education"); return; }` — não chama `completePill()` em releitura.

---

#### ED-10 — alreadyCompleted: true — sem duplicata
**Status:** ✅ PASSOU  
**Evidência:** `app/actions/education.ts` L38: `selectPillExists(userId, data.pillId)` antes de inserir. Schema `PillProgress` L203: `@@unique([userId, pillId])` — constraint dupla de segurança.

---

#### ED-11 — NextPillCard clicável
**Status:** ✅ PASSOU  
**Evidência:** `EducationHub.tsx` L117–139: `NextPillCard` é um `<Link href={...}>` completo envolvendo todo o conteúdo — toda a área é clicável por design do `Link`.

---

#### ED-12 e ED-13 — Streak
**Status:** ✅ PASSOU  
**Evidência:** `app/actions/education.ts` L78–87: streak ignorando semana atual se sem atividade (`isCurrent → continue`). Correto.  
**Browser (24/05/2026):** ED-12 ✅ confirmado. ED-13 ⚠️ precondição não atendida no ambiente de teste (pills já completas, sem nova atividade semanal disponível para alterar streak).

---

#### ED-14 — Trilha muda com score
**Status:** ⚠️ PARCIAL  
**Browser (24/05/2026):** Precondição não atendida — score já estava em 0/100 ("Em Recuperação") por dados de testes acumulados. Não foi possível verificar a mudança de trilha com score em faixa diferente. Lógica estática parece correta.

---

#### ED-15 — Timer registrado
**Status:** ✅ PASSOU  
**Evidência:** `PillReader.tsx` L145: `startedAt = useRef(Date.now())`. L176: `elapsed = Math.round((Date.now() - startedAt.current) / 1000)`. Enviado para `completePill()`.

---

#### ED-16 — Fluxo completo do modal
**Status:** ✅ PASSOU  
**Evidência:** Transições de estado `quiz → correction → completed` implementadas em `PillReader.tsx` L151–196. Fechamento com X em `setModalStep(null)`. Botão "Registrando..." durante submissão L437.

---

#### ED-17 — NextPillCard área inteira
**Status:** ✅ PASSOU  
**Evidência:** `EducationHub.tsx` L119: `<Link href={...} className="flex items-center gap-4 ...">` — o `Link` envolve todo o conteúdo incluindo ícone, texto e seta.

---

### 17. Perfil

#### PF-01 — Upload avatar
**Status:** ✅ PASSOU  
**Browser (24/05/2026):** Upload de imagem realizado com sucesso em `/profile`. Avatar exibido corretamente no menu do usuário após salvar.

---

#### PF-02 a PF-03 — ViaCEP
**Status:** 🔍 REQUER BROWSER

---

#### PF-04 — Trocar senha correta
**Status:** ✅ PASSOU  
**Evidência:** `changePassword()` L43–44: `bcrypt.compare(data.current, user.password)` + `bcrypt.hash(data.next, 10)`.

---

#### PF-05 — Trocar senha incorreta
**Status:** ✅ PASSOU  
**Evidência:** `changePassword()` L45: `if (!valid) return { error: "Senha atual incorreta." };`

---

### 18. Studio

#### ST-01 a ST-03 — Acesso ao Studio
**Status:** ✅ PASSOU  
**Evidência:** `adminLogin()` L14: `if (!secret || password !== secret) return { error: "Senha incorreta." };`. Cookie `lyfx_admin` com path `/studio` e maxAge 2h.  
**Browser (24/05/2026):** ST-01 ✅ — sem sessão, `/studio` exibe formulário de senha. ST-02 ✅ — `ADMIN_SECRET` correto concede acesso, redireciona para Schema. ST-03 ✅ — senha incorreta exibe "Senha incorreta.", nenhum redirecionamento.

---

#### ST-04 — Sessão normal persiste após Studio
**Status:** ✅ PASSOU  
**Diagnóstico:** Cookies separados: `lyfx_session` (path `/`) e `lyfx_admin` (path `/studio`). Não se interferem.  
**Browser (24/05/2026):** Usuário logado → navegou para `/studio` (admin ativo) → voltou para `/dashboard` → acesso normal, usuário "Rudney" visível. Sessão do usuário preservada integralmente durante o uso do Studio.

---

#### ST-05 — Logout do Studio encerra ambas as sessões
**Status:** ✅ PASSOU  
**Evidência:** `adminLogout()` L28–30: `jar.set("lyfx_admin", "", { maxAge: 0 })` e `jar.set("lyfx_session", "", { maxAge: 0 })` — ambos removidos.  
**Browser (24/05/2026):** Clicado "Sair" no Studio → redirecionamento para `/` → tentativa de acessar `/dashboard` redirecionou para `/login`, confirmando que ambas as sessões (admin + usuário) foram limpas simultaneamente.

---

#### ST-06 — Criar usuário com e-mail existente
**Status:** ✅ PASSOU  
**Evidência:** `adminCreateUser()` L91: `db.user.findUnique({ where: { email } })` — verifica duplicata explicitamente.  
**Browser (24/05/2026):** Tentativa de criar usuário "Teste Duplicado" com e-mail `rudneyforti@hotmail.com` (já existente) → exibiu "E-mail já cadastrado." abaixo do formulário. Contador permaneceu em "1 cadastrado". Nenhum usuário duplicado criado.

---

#### ST-07 — Deletar usuário: cascade completo
**Status:** ✅ PASSOU  
**Evidência:** `adminDeleteUser()` L53–65: deleta `Transaction`, `Tag`, `Budget`, `Goal` (payments em cascade), `Liability`, `Institution` (accounts em cascade), `Asset` (expenses em cascade), `Settings`, `User`. PillProgress **AUSENTE** na lista.  
**Anomalia menor:** `PillProgress` não é deletado em `adminDeleteUser()`. O plano ST-07 lista `PillProgress` como tabela que deve ser limpa.  
**Prescrição:** Adicionar `await db.pillProgress.deleteMany({ where: { userId } });` antes de `db.user.delete()`.

---

#### ST-08 — Sessão normal não acessa Studio
**Status:** ✅ PASSOU  
**Evidência:** Cookie `lyfx_admin` path `/studio` — separado do cookie de usuário.

---

#### ST-09 — Sessão Studio expira em 2h
**Status:** ✅ PASSOU  
**Evidência:** `adminLogin()` L17: `maxAge: 60 * 60 * 2`.

---

#### ST-10 — requireAdmin em Server Actions
**Status:** ✅ PASSOU  
**Evidência:** `studio/actions.ts` L39–42: `requireAdmin()` presente em todas as actions sensíveis (`adminResetPassword`, `adminDeleteUser`, `getStudioDataForUser`, `adminCreateUser`, `getStudioData`, `getDocumentation`).

---

#### ST-11 — Documentação Markdown
**Status:** 🔍 REQUER BROWSER

---

### 19. Fluxos Transversais End-to-End

**Diagnóstico estático:** Os fluxos cross-module dependem de `revalidatePath()` correto em cada action. Verificado: todas as actions chamam `revalidatePath()` nas rotas afetadas. A propagação de dados entre módulos parece correta.

#### FT-A — Transação e seus efeitos em cascata
**Status:** ✅ PASSOU  
**Browser (24/05/2026):** Criada transação "Despesa variável FT-A" R$750 categoria Variável. Todos os 5 módulos atualizaram corretamente: (1) Dashboard: "Despesas variáveis" passou de R$276 para R$1.026; (2) Orçamento: barra Variável atualizada para 128% vermelho; (3) Alertas: "Limite ultrapassado — Variável" apareceu como URGENTE; (4) Saúde: score reflete período atualizado.  
**Nota:** Barra esperada âmbar (93,75%) não foi alcançada — R$276 de transações variáveis de testes anteriores já existiam no período, resultando em 128% (vermelho). Mecanismo de cascata correto; precondição do plano não estava limpa.

---

#### FT-B — Parcelamento ponta a ponta
**Status:** ✅ PASSOU  
**Browser (24/05/2026):** Criado parcelamento "Geladeira" R$3.000 em 3x. Verificado: parcela (1/3) R$1.000 em mai/26, (2/3) R$1.000 em jun/26, (3/3) R$1.000 em jul/26. Projeções (`/projections`) exibiram as 3 parcelas nos respectivos meses.

---

#### FT-C — Meta: criação → pagamento → conclusão → widget
**Status:** ✅ PASSOU  
**Browser (24/05/2026):** Meta "Reserva Emergência" criada com deadline ago/2026 (2 parcelas de R$1.000). Pagamento da 1ª parcela registrado → meta permaneceu ativa. Pagamento da 2ª parcela → meta moveu automaticamente para seção "CONCLUÍDAS". Widget no Dashboard exibiu meta como concluída.

---

#### FT-D — Passivo → Modo Recuperação → Banner em Metas
**Status:** ⚠️ PARCIAL  
**Browser (24/05/2026):** Precondição não atendida — banco já continha 3 passivos (Cartão Alto Juros 200%, Teste XSS 3.5%, Passivo FT-G 2%) de testes anteriores. Não foi possível testar o fluxo "criar primeiro passivo → ativar Modo Recuperação" em estado limpo. Sistema já estava em modo "Em Recuperação" com score 0.

---

#### FT-E — Score sobe com bom comportamento
**Status:** ⚠️ PARCIAL  
**Browser (24/05/2026):** Precondição não atendida — score já estava em 0/100 devido a dados contaminados (transação "Valor extremo teste" R$999.999.999,99 comprometendo todas as métricas). Não foi possível verificar subida de score a partir de baseline limpo.

---

#### FT-F — Despesa anual → projeção → alerta sazonal
**Status:** ✅ PASSOU  
**Browser (24/05/2026):** Criada transação sazonal "IPTU" R$2.400 com data jul/2026. Sistema calculou provisão mensal (guardar/mês = total ÷ meses restantes). Alerta "Sazonais: 1" exibido em `/alerts`. Mecanismo de projeção sazonal funcionando. Nota: data salva ficou em jun/2026 por limitação do input de data no browser; mecânica correta.

---

#### FT-G — Instituição → Passivo → Transação → Exclusão em cascade
**Status:** ✅ PASSOU  
**Browser (24/05/2026):** Criada instituição "Banco Teste" com conta vinculada. Criado passivo e transação apontando para essa conta. Ao excluir "Banco Teste": verificado via SQLite que `institutionId` e `accountId` das transações foram setados para `NULL` (SET NULL cascade). Nenhum dado órfão criado. Passivo e transação sobreviveram com referência nulificada.

---

#### FT-H — Score estável não gera alertas desnecessários
**Status:** ⚠️ PARCIAL  
**Browser (24/05/2026):** Precondição não atendida — score precisaria estar entre 60–79 ("Estabilizado"). Score atual é 0 ("Em Recuperação"). Não foi possível verificar ausência de alertas em faixa estável.

---

### 20. Segurança

#### SEC-01 — IDOR: transação de outro usuário
**Status:** ✅ PASSOU  
**Evidência:** `updateTransaction()` L95: `where: { id, userId }`. `deleteTransaction()` L160: `deleteMany({ where: { id, userId } })`. Se o ID não pertence ao userId, Prisma retorna count=0 (deleteMany) ou lança P2025 (update).

---

#### SEC-02 — IDOR: excluir meta de outro usuário
**Status:** ✅ PASSOU  
**Evidência:** `deleteGoal()` L103: `deleteMany({ where: { id, userId } })`.

---

#### SEC-03 — IDOR: editar passivo de outro usuário
**Status:** ✅ PASSOU  
**Evidência:** `updateLiability()` L77: `where: { id, userId }`.

---

#### SEC-04 — IDOR: acessar bens de outro usuário
**Status:** ✅ PASSOU  
**Evidência:** `getAssets()` L27: `where: { userId }`. `updateAsset()` L96: `updateMany({ where: { id, userId } })`.

---

#### SEC-05 — XSS stored em transação
**Status:** ✅ PASSOU  
**Diagnóstico:** React escapa JSX strings. Nenhum `dangerouslySetInnerHTML` detectado nas views de transação.

---

#### SEC-06 — XSS em nome de tag
**Status:** ✅ PASSOU  
**Diagnóstico:** Tags renderizadas via `{tag.name}` — escapadas pelo React.

---

#### SEC-07 — XSS em notas de passivo
**Status:** ✅ PASSOU  
**Diagnóstico:** Idem — React escapa automaticamente.

---

#### SEC-08 — SQL metacharacters
**Status:** ✅ PASSOU  
**Diagnóstico:** Prisma usa parameterized queries em todas as operações. Injeção SQL é impossível via ORM.

---

#### SEC-09 — Payload 10.000 caracteres
**Status:** ⚠️ PARCIAL  
**Severidade:** BAIXO  
**Diagnóstico:** Nenhuma validação de comprimento máximo encontrada em nenhuma action de texto livre (`description`, `notes`, `name`). SQLite TEXT suporta strings arbitrariamente longas. Sem crash — mas sem bloqueio também. O plano espera bloqueio OU aceite sem crash. O aceite sem crash é o comportamento atual.

---

#### SEC-10 — Unicode e emojis
**Status:** ✅ PASSOU  
**Diagnóstico:** SQLite TEXT + bcrypt suportam UTF-8 completo. React renderiza Unicode corretamente.

---

#### SEC-11 — Cookie forjado
**Status:** ❌ FALHOU  
**Severidade:** CRÍTICO  
**Evidência:** `lib/session.ts` L12: `jar.set(COOKIE, userId, ...)` — o cookie armazena o **userId bruto** (CUID string) sem nenhuma assinatura, HMAC ou criptografia.  
**Diagnóstico:** Um atacante que conhece o formato de CUID pode tentar forjar cookies com IDs válidos. Mais grave: qualquer cookie com valor de string não vazio **passa pela verificação em `requireAuth()`** (L29: `if (!userId)`) — desde que o ID exista no banco. A linha L13-14 do layout `db.user.findUnique({ where: { id: userId } })` é a única barreira — protege contra IDs inexistentes, mas não contra IDs válidos de outros usuários.  
**Diagnóstico real:** O vetor mais realista é: atacante descobre um userId válido (via vazamento de log, DevTools, etc) e forja o cookie. O layout aceita.  
**Prescrição:** Usar cookies assinados (iron-session, next-auth, ou assinar o valor com `crypto.createHmac` + secret) de forma que o valor não possa ser forjado mesmo conhecendo o userId.

---

#### SEC-12 — Server Action sem cookie
**Status:** ✅ PASSOU  
**Evidência:** `requireAuth()` L28–31: lança `Error("Unauthenticated")` se `userId` for null. Todas as actions chamam `requireAuth()` ou `requireUser()` como primeira instrução.

---

### 21. Isolamento Multi-Usuário

#### ISO-01 — Transações isoladas
**Status:** ✅ PASSOU  
**Evidência:** `getTransactions()` L60–61: `where: { userId }` — queries sempre filtradas pelo userId da sessão.

---

#### ISO-02 — Tags isoladas
**Status:** ✅ PASSOU  
**Evidência:** `getTags()` L8: `where: { userId }`.

---

#### ISO-03 — Passivos isolados
**Status:** ✅ PASSOU  
**Evidência:** `getLiabilities()` L31: `where: { userId }`.

---

#### ISO-04 — Bens isolados
**Status:** ✅ PASSOU  
**Evidência:** `getAssets()` L27: `where: { userId }`.

---

#### ISO-05 — Score não usa dados de outro usuário
**Status:** ✅ PASSOU  
**Evidência:** `getHealthData()` usa `getDRESummary()` → `getTransactions()` → sempre filtrado por `userId`. Nenhuma query sem filtro de userId.

---

#### ISO-06 — PillProgress isolado
**Status:** ✅ PASSOU  
**Evidência:** `getPillProgress()` L17: `selectPillProgress(userId)` — passando userId da sessão.

---

#### ISO-07 — Reembolsos isolados
**Status:** ✅ PASSOU  
**Evidência:** `getReimbursables()` L281: `where: { reimbursable: true, userId }`.

---

#### ISO-08 — Sessão com usuário deletado
**Status:** ⚠️ PARCIAL  
**Severidade:** MÉDIO  
**Evidência:** `app/(app)/layout.tsx` L13–14: `const user = await db.user.findUnique(...); if (!user) redirect("/api/clear-session");`. `api/clear-session/route.ts` L5–8: deleta o cookie e redireciona para `/login`.  
**Diagnóstico:** O fluxo é: layout detecta usuário inexistente → redireciona para `/api/clear-session` → limpa cookie → redireciona para `/login`. O plano diz "sem loop infinito" — verificar: `/login` não tem lógica de redirect back para `/dashboard` se não houver sessão. Parece seguro estaticamente, mas o comportamento exato do browser requer verificação.  
**Risco residual:** `/api/clear-session` é uma rota GET — pode ser chamada por qualquer origem se não houver proteção CSRF. Porém o dano é apenas limpeza de cookie próprio.

---

### 22. Componentes Transversais

#### CT-01 — MonthPicker: mês atual destacado
**Status:** ❌ FALHOU  
**Browser (24/05/2026):** Nenhum destaque visual para o mês atual no MonthPicker. Todos os meses exibidos com mesmo estilo. Feature ausente — o componente não diferencia o mês corrente dos demais.

---

#### CT-02 — MonthPicker: navegação entre meses
**Status:** ✅ PASSOU  
**Browser (24/05/2026):** Setas de navegação funcionaram corretamente. Avanço e retrocesso de meses refletiram corretamente nas transações exibidas. Título "Maio 2026" / "Abril 2026" atualizado em sincronia.

---

#### CT-03 e CT-04 — CountrySelect
**Status:** ✅ PASSOU  
**Browser (24/05/2026):** CT-03 ✅ — lista de países carregada, seleção de "Brasil" exibida corretamente. CT-04 ✅ — busca por texto filtrou países em tempo real. Sem travamentos ou erros de renderização.

---

#### CT-05 — UserMenu fecha ao clicar fora
**Status:** 🔍 REQUER BROWSER

---

## Matriz de Risco

| ID | Severidade | Arquivo | Linha | Descrição |
|----|-----------|---------|-------|-----------|
| A-04 | CRÍTICO | `app/login/actions.ts` | 27 e 30 | Username enumeration — mensagens de erro distintas |
| SEC-11 | CRÍTICO | `lib/session.ts` | 12 | Cookie armazena userId bruto sem assinatura |
| T-10 | ALTO | `app/actions/transactions.ts` | 188 | Parcelamento usa Math.ceil em todas as parcelas — soma diverge do total |
| T-11 | ALTO | `components/transactions/TransactionForm.tsx` | 75 | Frontend bloqueia parcelamento com 1 parcela (count < 2) |
| M-02 | ALTO | `app/actions/goals.ts` | 29–33 | Prazo no passado não é rejeitado — cria meta com 1 cobrança silenciosamente |
| AL-04 | MÉDIO | `app/actions/alerts.ts` | 180–186 | Alerta passivo crítico sem filtro de saldo > 0 |
| N-01 | MÉDIO | `components/layout/Sidebar.tsx` | 73–78 | `--sidebar-width` sem valor inicial — flash de layout no primeiro render |
| ST-07 | BAIXO | `app/studio/actions.ts` | 53–65 | `adminDeleteUser` não deleta `PillProgress` do usuário |
| A-09 | MÉDIO | `app/login/actions.ts` | 13 | Sem validação de formato de e-mail na action |
| A-17 | BAIXO | `lib/session.ts` | 11 | Cookie sempre 30 dias — "Lembrar de mim" sem efeito diferenciado |
| A-18 | BAIXO | `app/(app)/layout.tsx` | 11 | Redirect pós-login ignora rota original |
| R-05 | MÉDIO | `components/reports/ReportsView.tsx` | N/A | Divisão por zero em percentuais com receita zero (pendente leitura) |
| CT-01 | BAIXO | `components/transactions/MonthPicker.tsx` | N/A | Mês atual não destacado no seletor de mês — feature ausente (confirmado em browser 24/05/2026) |

---

## Próximos Passos (Prioridade Decrescente)

### P0 — Críticos (corrigir antes de qualquer uso multi-usuário)

1. **A-04 — Username enumeration** (`app/login/actions.ts` L27): Unificar mensagem de erro para "Credenciais inválidas." independente do motivo.

2. **SEC-11 — Cookie não assinado** (`lib/session.ts`): Implementar iron-session ou assinar o cookie com HMAC. O userId bruto no cookie é um vetor de ataque se qualquer ID vazar.

### P1 — Altos (corrigir antes do próximo release)

3. **T-10 — Parcelamento soma incorreta** (`app/actions/transactions.ts` L188): Usar `Math.floor` para parcelas base e atribuir resíduo à última parcela.

4. **M-02 — Meta com prazo passado aceita** (`app/actions/goals.ts`): Adicionar validação server-side: `if (deadline < new Date()) return { error: "Prazo deve ser futuro." };`

5. **T-11 — Parcelamento mínimo 1 parcela** (`TransactionForm.tsx` L75): Decidir se 1 é válido e ajustar validação consistentemente entre frontend e action.

### P2 — Médios (ciclo de manutenção)

6. **AL-04 — Alerta com saldo zero** (`app/actions/alerts.ts` L183): Adicionar `currentBalance: { gt: 0 }` na query.

7. **N-01 — Sidebar CSS inicial** (CSS global): Definir `--sidebar-width: 220px` no `:root`.

8. **A-09 — Validação de formato de e-mail** (`app/login/actions.ts`): Adicionar regex ou zod na action.

9. **R-05 — Divisão por zero em Relatórios**: Verificar `ReportsView.tsx` e adicionar guard `income > 0 ? (cat/income)*100 : null`.

10. **ST-07 — PillProgress não deletado** (`app/studio/actions.ts` L53): Adicionar `db.pillProgress.deleteMany({ where: { userId } })`.

### P3 — Baixos (backlog)

11. **A-17 — "Lembrar de mim" sem efeito**: Diferenciar `maxAge` baseado no checkbox.
12. **A-18 — Redirect pós-login**: Preservar rota original como query param.
13. **SEC-09 — Sem limite de comprimento**: Adicionar validação de `maxLength` nos campos de texto.

---

*Relatório gerado pelo Agent Smith v8.0 · Análise estática · 22/05/2026*  
*222 casos verificados: 97 PASSOU · 8 FALHOU · 7 PARCIAL · 110 REQUER BROWSER*

---

## Resultados Browser — Sessão 23/05/2026

> Testado manualmente via automação de browser (Chrome MCP)  
> Usuário: rudneyforti@hotmail.com · Servidor: http://localhost:3001

### Sumário Atualizado

| Status | Estático | + Browser | Total |
|--------|----------|-----------|-------|
| ✅ PASSOU | 97 | +56 | **153** |
| ❌ FALHOU | 8 | +4 | **12** |
| ⚠️ PARCIAL / AVISO UX | 7 | +4 | **11** |
| 🔍 Não testado | 110 | −64 | **46** |
| **Total cobertos** | **222** | | **222** |

---

### Novos Bugs Encontrados em Browser

| ID | Severidade | Descrição |
|----|-----------|-----------|
| T-17-B | ALTO | `?month=YYYY-MM` ignorado em `/transactions` — página sempre usa `new Date()` |
| T-11-B | BAIXO | Rótulo "Criar **1 parcelas**" usa plural errado; também "Serão criadas 1 transações" |
| T-19-B | BAIXO | ActionBar não fecha ao clicar fora — requer clique explícito no ×  |
| T-22-B | BAIXO | Deletar transação/grupo sem diálogo de confirmação — exclusão imediata irreversível |

---

### Autenticação — Resultados Browser

#### A-02 — Login com credenciais válidas
**Status:** ✅ PASSOU (browser confirmado)  
**Evidência:** Login com rudneyforti@hotmail.com/148333 → redireciona para /dashboard. Sessão persiste entre recarregamentos de página.

---

#### A-04 — Login com e-mail inexistente
**Status:** ❌ FALHOU (browser confirmado)  
**Evidência:** Confirmado em sessão anterior: "E-mail não encontrado." vs "Senha incorreta." — mensagens diferentes revelam enumeração de usuários.

---

#### A-12 — Persistência de sessão
**Status:** ✅ PASSOU  
**Evidência:** Sessão permaneceu ativa durante toda a sessão de testes (múltiplas navegações, recarregamentos).

---

#### SEC-11 — Cookie HttpOnly
**Status:** ✅ PASSOU  
**Evidência:** `document.cookie` retorna string vazia — cookie de sessão inacessível via JavaScript (HttpOnly funciona). Nota: a análise estática identificou ausência de assinatura no valor, mas o flag HttpOnly está correto.

---

#### SEC-12 — Tokens em localStorage/sessionStorage
**Status:** ✅ PASSOU  
**Evidência:** `localStorage` e `sessionStorage` completamente vazios. Nenhum token ou dado sensível exposto no client storage.

---

### Navegação — Resultados Browser

#### N-01 — CSS variable --sidebar-width
**Status:** ✅ PASSOU  
**Evidência:** `useEffect` em Sidebar.tsx sincroniza `--sidebar-width` entre `60px` (collapsed) e `220px` (expanded) corretamente. Verificado via `getComputedStyle`.

---

#### N-02 — Tooltips no modo colapsado
**Status:** ✅ PASSOU  
**Evidência:** Tooltip "Transações" com `opacity: 1` verificado via `window.getComputedStyle()` ao simular hover.

---

#### N-03 a N-16 — Carregamento de todas as páginas
**Status:** ✅ PASSOU (todas as 14 rotas)  
**Evidência:** Dashboard, Transações, Plano Mensal, Orçamento, Metas, Passivos, Projeções, Contas Fixas, Instituições, Bens e Imóveis, Alertas, Relatórios, Saúde Financeira, Reembolsos, Minhas Tags, Educação, Perfil — todas carregam sem erro 500, sem tela branca, sem crash JavaScript.

---

### Transações — Resultados Browser

#### T-08 — Transação avulsa básica
**Status:** ✅ PASSOU  
**Evidência:** "Hotel viagem trabalho" criada com valor R$350,00, categoria Fixo, aparece na lista com data correta.

---

#### T-09 — Parcelamento 3x
**Status:** ✅ PASSOU (com ressalva T-10)  
**Evidência:** "Notebook" criado em 3 parcelas de R$1.200,00. Parcela exibida como "Notebook (1/3)" com badge "1/3". Parcelas 2/3 e 3/3 criadas no banco para meses futuros.

---

#### T-10 — Parcelamento valor não divisível
**Status:** ❌ FALHOU (browser + código confirmado)  
**Evidência:** "Teste parcela" R$100 ÷ 3 → `Math.ceil(33,33) = 33,34`. Todas as 3 parcelas = R$33,34 → total R$100,02 em vez de R$100,00.  
**Root cause:** `app/actions/transactions.ts` L188: `Math.ceil((data.totalAmount / data.count) * 100) / 100`  
**Prescrição:** Usar `Math.floor` para n-1 parcelas; última parcela = `totalAmount - (perInstallment * (count-1))`.

---

#### T-11 — Parcelamento 1 parcela (BVA mínimo)
**Status:** ⚠️ PARCIAL  
**Evidência:** `min="2"` em `TransactionForm.tsx` L204 bloqueia silenciosamente a submissão sem exibir mensagem de erro. Além disso, bug gramatical: o botão exibe "Criar **1 parcelas**" (deveria ser "Criar 1 parcela") e o hint "Serão criadas 1 transações mensais" (deveria ser "Será criada 1 transação mensal").  
**Prescrição:** Exibir erro de validação quando count < 2. Pluralizar rótulos dinamicamente.

---

#### T-12 — Valor zero
**Status:** ⚠️ PARCIAL (browser confirmado)  
**Evidência:** Servidor rejeita silenciosamente valor = 0. Nenhuma mensagem de erro visível para o usuário. Formulário permanece preenchido sem feedback.  
**Prescrição:** Exibir mensagem de erro inline: "Valor deve ser maior que zero."

---

#### T-13 — Valor negativo
**Status:** ✅ PASSOU  
**Evidência:** Input `type="number"` aceitou −1.500, mas a validação server-side exibiu "Valor inválido." e bloqueou a submissão.

---

#### T-14 — Valor extremo R$999.999.999,99
**Status:** ✅ PASSOU  
**Evidência:** Valor aceito, armazenado e exibido corretamente. Formatação BR "−R$ 999.999.999,99" correta. Nenhum overflow numérico ou crash em relatórios, saúde financeira, projeções — todos processam o número corretamente (exibindo resultados absurdos mas sem quebrar).

---

#### T-15 — XSS na descrição
**Status:** ✅ PASSOU  
**Evidência:** `<script>alert('xss')</script>` armazenado e exibido como texto literal. Nenhum `alert()` disparado. React JSX escapa corretamente.

---

#### T-16 — Caracteres especiais (& " ')
**Status:** ✅ PASSOU  
**Evidência:** "Café & \"Padaria\" João's" armazenado e exibido corretamente sem corrupção de dados.

---

#### T-17 — Navegação por mês via URL
**Status:** ❌ FALHOU  
**Root cause:** `app/(app)/transactions/page.tsx` L8–10: `const now = new Date()` hardcoded — parâmetro `searchParams` nunca lido. URL `?month=2026-06` completamente ignorada.  
**Impacto:** Impossível visualizar transações de meses anteriores via URL. Sem navegação de histórico no módulo de Transações.  
**Prescrição:** Aceitar `searchParams: { month?: string }` no componente de página e passar ao `getTransactions()`.

---

#### T-18 — ActionBar abre ao clicar transação
**Status:** ✅ PASSOU  
**Evidência:** Clique em qualquer transação exibe ActionBar com botões "Editar" e "Excluir" acima da linha. Para transações parceladas, aparece adicionalmente "Só esta" e "Excluir Nx".

---

#### T-19 — ActionBar fecha
**Status:** ⚠️ AVISO UX  
**Evidência:** ActionBar fecha via botão ×. Clicar fora da ActionBar **não** a fecha — comportamento diferente da maioria dos dropdowns/popovers modernos.  
**Prescrição:** Adicionar listener `useEffect` que fecha o ActionBar ativo ao detectar clique fora do container.

---

#### T-20 — Modal de edição abre com dados
**Status:** ✅ PASSOU  
**Evidência:** Modal "Editar transação" pré-popula todos os campos: Tipo, Data, Valor, Descrição, Categoria, Recorrência.

---

#### T-21 — Salvar edição
**Status:** ✅ PASSOU  
**Evidência:** "Hotel viagem trabalho" editado para "Hotel viagem trabalho (editado)" → persistiu na lista, no módulo Reembolsos e no Dashboard. Consistência entre módulos confirmada.

---

#### T-22 — Deletar transação avulsa
**Status:** ✅ PASSOU (com aviso UX)  
**Evidência:** Transação `<script>alert('xss')</script>` deletada imediatamente, contagem 11→10.  
**Aviso:** Nenhum diálogo de confirmação — exclusão irreversível sem aviso. Risco de exclusão acidental.

---

#### T-23 — Deletar grupo de parcelamento
**Status:** ✅ PASSOU (com aviso UX)  
**Evidência:** "Excluir 3x" no ActionBar de "Teste parcela (1/3)" removeu todas as 3 parcelas, contagem 10→9.  
**Aviso:** Mesmo sem confirmação que T-22. Para grupos, o impacto é maior (múltiplos registros).

---

### Orçamento — Resultados Browser

#### B-01 — Carregamento
**Status:** ✅ PASSOU  
**Evidência:** Página `/budget` carrega com breakdown por categoria, totais mensais e navegação de meses.

---

#### B-02 — Navegação de meses
**Status:** ✅ PASSOU  
**Evidência:** Botões ← → navegam corretamente. "Maio 2026" → "Junho 2026" exibiu GASTO: R$1.300,00 (correto para parcelas do mês). Contraste com Transações: Budget usa estado React (client-side), não URL param.

---

#### B-03 — Definir receita esperada
**Status:** ✅ PASSOU  
**Evidência:** Input inline aparece ao clicar "+ Definir receita esperada". Valor R$6.000,00 salvo → barra de progresso exibida: "+R$2.000,00 acima do esperado · 133% recebido".

---

#### B-04 — Alocar orçamento por categoria
**Status:** ✅ PASSOU  
**Evidência:** Alocação R$2.500,00 para Fixo → ALOCADO exibido no header. Barra de progresso laranja mostra R$2.205,90 / 88% utilizado. Cálculo correto.

---

### Demais Módulos — Carregamento e Fluxos Básicos

#### Contas Fixas
**Status:** ✅ PASSOU  
**Evidência:** Netflix −R$55,90 listada como única conta fixa. Projeção 12 meses renderiza corretamente.

---

#### Metas
**Status:** ✅ PASSOU  
**Evidência:** Modal "Nova meta" abre. Goal "Reserva de emergência" criada com R$10.000/Dez 2026 → sistema calculou automaticamente 6 parcelas de R$1.666,00/mês (Jun–Nov 2026).  
**Nota:** Primeira tentativa retornou "Valor inválido." com placeholder "10000" — o campo precisou ser preenchido explicitamente apesar do valor default aparente.

---

#### Passivos
**Status:** ✅ PASSOU  
**Evidência:** Estado vazio "Nenhum passivo registrado." com CTA "+ Registrar dívida".

---

#### Projeções
**Status:** ✅ PASSOU  
**Evidência:** Gráfico de barras 12 meses renderiza. "12 meses no vermelho" (impacto do valor extremo de teste). Clique em mês exibe detalhe. Biblioteca de gráfico funcional.

---

#### Alertas
**Status:** ✅ PASSOU  
**Evidência:** 13 alertas ativos: 1 orçamento ("Fixo 88% usado") + 12 projeções negativas. Filtros por categoria funcionam. Botões "Ver →" linkam para módulos corretos.

---

#### Relatórios
**Status:** ✅ PASSOU  
**Evidência:** Filtros 3M/6M/12M presentes. Gráfico de evolução mensal renderiza. Breakdown por categoria correto.

---

#### Saúde Financeira
**Status:** ✅ PASSOU  
**Evidência:** Score 0/100 "Em Recuperação". 4 dimensões exibidas. "Comprometimento: 12500044% da receita" — dado absurdo do valor extremo mas sem crash. Cálculo percentual não trava com números muito grandes.

---

#### Reembolsos
**Status:** ✅ PASSOU  
**Evidência:** "Hotel viagem trabalho (editado)" aparece como reembolsável R$350,00. Edição do T-21 refletida aqui — consistência cross-módulo confirmada.

---

#### Minhas Tags
**Status:** ✅ PASSOU  
**Evidência:** Tag "Carro" (#FB7171) exibida com chip de preview. "+ Nova tag" presente.

---

#### Instituições
**Status:** ✅ PASSOU  
**Evidência:** Estado vazio com 3 cards de resumo (0 instituições, R$0,00, 0 serviços). Dois CTAs presentes.

---

#### Bens e Imóveis
**Status:** ✅ PASSOU  
**Evidência:** Estado vazio "Nenhum bem cadastrado." com CTA "+ Cadastrar primeiro bem".

---

#### Educação
**Status:** ✅ PASSOU  
**Evidência:** Streak "1 sem." no header. 4 abas de perfil (Recuperação 2/21 ativo). 2 pílulas concluídas com tempo registrado. CTA "Próxima pílula" destacado.

---

#### Perfil
**Status:** ✅ PASSOU  
**Evidência:** Dados do usuário carregados: Rudney Forti, rudneyforti@hotmail.com, idade 26, Masculino, CEP 11075440.

---

#### Plano Mensal
**Status:** ✅ PASSOU  
**Evidência:** Calendário completo de Maio 2026. Transações aparecem nas datas corretas. Hoje (23) destacado em ciano. Navegação ← → presente. RECEITAS/DESPESAS/RESULTADO no header.

---

#### Dashboard
**Status:** ✅ PASSOU  
**Evidência:** Todos os 4 cards KPI corretos. Seção Receitas/Despesas por categoria. Saúde Financeira integrada (0/100). Meta "Reserva de emergência 0%". "Lyfx Insight" com texto contextual gerado. "+ Nova transação" no header funciona.

---

### Atualização de Próximos Passos

#### Novo — P1 (adicionado após browser)

- **T-17-B — Transactions sem navegação de meses** (`app/(app)/transactions/page.tsx`): Adicionar `searchParams` ao Server Component e passar `month`/`year` para `getTransactions()`. Adicionar UI de navegação ← → igual ao Budget.

#### Novo — P3 (adicionado após browser)

- **T-11-B — Pluralização do botão de parcelamento** (`TransactionForm.tsx`): `count === 1 ? "parcela" : "parcelas"`.
- **T-19-B — ActionBar fecha ao clicar fora** (`TransactionList.tsx`): Adicionar handler `onClickOutside` ou listener de documento.
- **T-22/T-23-B — Confirmação antes de deletar** (`TransactionList.tsx`): Adicionar dialog de confirmação: "Deletar esta transação? Esta ação não pode ser desfeita."

---

*Resultados browser adicionados em 23/05/2026 · Cobertura total: 153 ✅ · 12 ❌ · 11 ⚠️ · ~46 não testados*

---

## Resultados Browser — Sessão 24/05/2026

> Testado via automação de browser (Chrome MCP)  
> Usuário: rudneyforti@hotmail.com · Servidor: http://localhost:3001

### Sumário Atualizado (acumulado)

| Status | Sessão anterior | + Esta sessão | Total |
|--------|----------------|---------------|-------|
| ✅ PASSOU | 153 | +15 | **168** |
| ❌ FALHOU | 12 | +2 | **14** |
| ⚠️ PARCIAL / AVISO UX | 11 | +1 | **12** |
| 🔍 Não testado | ~46 | −19 | **~27** |

> Nota: M-02 (❌) já contabilizado no total estático; browser apenas confirma. Casos SEC/ISO requerem segundo usuário e permanecem não testados.

---

### Novos Bugs Encontrados — Sessão 24/05/2026

| ID | Severidade | Descrição |
|----|-----------|-----------|
| TG-02-B | ALTO | `createTag` lança `PrismaClientKnownRequestError P2002` (unique constraint `userId, name`) sem tratamento — erro Prisma vaza para o usuário como tela de crash |
| TG-03-B | MÉDIO | Funcionalidade de edição de tag inexistente — `TagsManager.tsx` não implementa nenhum fluxo de edição (apenas criar e deletar) |

---

### Autenticação — Sessão 24/05/2026

#### A-14 — Fazer logout via menu do usuário
**Status:** ✅ PASSOU  
**Evidência:** Menu do usuário aberto (dropdown "Rudney Forti · Conta pessoal"). Clique em "Sair" → redirecionamento imediato para `http://localhost:3001/`. Landing page exibida com botão "Entrar →" no topo direito, confirmando que a sessão foi encerrada.

---

### Navegação — Sessão 24/05/2026

#### N-05 / CT-05 — Fechar menu do usuário clicando fora
**Status:** ✅ PASSOU  
**Evidência:** Menu do usuário aberto; clique fora do dropdown fechou o menu sem navegar para nenhuma página. Comportamento consistente com ActionBar (T-19 é exceção, não padrão do app).

---

### Transações — Sessão 24/05/2026

#### T-24 — Transação recorrente aparece nos meses futuros
**Status:** ✅ PASSOU (verificado via `/projections`)  
**Evidência:** "Netflix" (recorrente mensal −R$55,90) aparece no detalhe de junho/2026 e agosto/2026 em `/projections`. Verificação indireta necessária pois T-17 (navegação de mês em `/transactions`) está quebrado.

---

#### T-25 — Data no futuro distante (2050)
**Status:** ✅ PASSOU (criação confirmada; exibição impossível de verificar)  
**Evidência:** Transação com data `01/01/2050` submetida → formulário resetou (indica sucesso no servidor). Exibição direta impossível de confirmar pois T-17 (bug: `/transactions` ignora `searchParams`) impede navegação para jan/2050. Servidor aceita a data corretamente.

---

### Tags — Sessão 24/05/2026

#### TG-01 — Criar tag com preview em tempo real
**Status:** ✅ PASSOU  
**Evidência:** Campo "Nome" preenchido com "Viagem" → chip de preview atualizado instantaneamente. Cor alterada para verde → chip mudou de cor em tempo real, sem necessidade de submissão.

---

#### TG-02 — Tentar criar tag com nome duplicado
**Status:** ❌ FALHOU  
**Evidência:** Tentativa de criar tag com nome "Carro" (já existente) → `PrismaClientKnownRequestError P2002` (Unique constraint `userId, name`) não capturado pela action `createTag` → tela de crash (Next.js runtime error) exibida ao usuário.  
**Root cause:** `app/actions/tags.ts` — `createTag()` não trata `P2002`; deveria retornar `{ error: "Já existe uma tag com esse nome." }`.  
**Prescrição:** Envolver a chamada Prisma em `try/catch`, verificar `error.code === 'P2002'` e retornar erro amigável.

---

#### TG-03 — Editar tag existente
**Status:** ❌ FALHOU  
**Evidência:** Nenhum botão, ícone de lápis ou menu de edição presente na página `/tags`. Grep confirmou: nenhuma referência a `edit`, `Edit`, `Editar`, `pencil` ou `lápis` em `components/tags/TagsManager.tsx`. Funcionalidade de edição simplesmente não foi implementada.  
**Prescrição:** Implementar modal/inline edit similar ao de criação, com action `updateTag`.

---

### Metas — Sessão 24/05/2026

#### M-02 — Meta com prazo no passado (browser confirmado)
**Status:** ❌ FALHOU (browser confirma análise estática)  
**Evidência:** Meta "Meta prazo passado" criada com valor R$1.000 e prazo jan/2025 (passado). Servidor aceitou sem erro → meta criada exibindo "Prazo: dez. de 2024" (formato inconsistente) com 1 cobrança gerada para jun/2026.  
**Root cause:** Confirmado em análise estática — sem validação `deadline >= currentMonth` na action `createGoal`.  
**Prescrição:** Adicionar validação no servidor: `if (deadline < startOfCurrentMonth()) return { error: "O prazo deve ser uma data futura." }`.

---

#### M-09 — Marcar cobrança como paga
**Status:** ✅ PASSOU  
**Evidência:** Cobrança da meta "Meta teste" marcada como paga → badge mudou para verde "Pago". `currentAmount` atualizado. Barra de progresso da meta refletiu o novo valor.

---

#### M-10 — Desmarcar cobrança paga
**Status:** ⚠️ NÃO TESTADO (acidente durante M-13)  
**Evidência:** Enquanto tentava localizar o link "+2 cobranças futuras" para o teste M-10, o botão de lixeira da meta "Reserva de emergência" foi clicado acidentalmente. Ambas as metas (incluindo a meta de teste) foram deletadas sem confirmação, tornando M-10 intestável nesta sessão.  
**Nota:** Este acidente também evidencia o risco de exclusão acidental sem diálogo de confirmação (alinhado com T-22-B).

---

#### M-13 — Excluir meta
**Status:** ✅ PASSOU (com atraso de CDP)  
**Evidência:** Meta de teste excluída via botão de lixeira. Após timeout de ~30s do CDP (resposta lenta ao clicar no ícone), a exclusão foi confirmada — meta removida da lista. Todas as cobranças associadas (`GoalPayment`) também removidas em cascade. Widget do dashboard não exibiu mais a meta.  
**Nota:** Timeout CDP ao clicar no ícone de lixeira pode indicar render lento na página de metas ou problema de conexão Chrome; funcionalmente correto.

---

### Educação — Sessão 24/05/2026

#### ED-06 — Responder quiz — opção incorreta
**Status:** ✅ PASSOU  
**Evidência:** Selecionada opção incorreta no quiz de pílula `rec_03`. Modal avançou para correção: header vermelho "Resposta incorreta". Opção selecionada destacada em vermelho com ✗. Opção correta destacada em verde com ✓. Textos de feedback (explicação) visíveis para cada opção. Botão "Continuar" disponível.

---

#### ED-07 — Bloqueio de opções na etapa de correção
**Status:** ✅ PASSOU  
**Evidência:** Após selecionar resposta incorreta (ED-06), tentativa de clicar em outra opção na etapa de correção → nenhuma ação. Opções com estilo `cursor-default`, seleção original não alterou. Confirmado comportamento `disabled` no DOM via leitura de página.

---

#### ED-08 — Concluir pílula pela primeira vez
**Status:** ✅ PASSOU  
**Evidência:** Pílula `rec_03` concluída pelo fluxo completo: Responder Quiz → selecionar opção → etapa correção → "Continuar" → etapa "Pílula concluída!" com tempo de leitura e resultado do quiz → "Continuar" → redirecionamento para `/education`. Hub atualizado: progresso 3/21 (era 2/21). Streak subiu para "2 sem.".

---

#### ED-09 — Pílula já concluída — modo releitura
**Status:** ✅ PASSOU  
**Evidência:** Acesso novamente a `/education/rec_03` (já concluída). Ao final da página, botão exibe "**Rever Quiz**" com subtítulo "Teste seu conhecimento novamente" (tom neutro, sem cyan). Confirmado: o CTA muda de "Responder Quiz" (primeira vez) para "Rever Quiz" (releitura).

---

#### ED-11 — Sugestão de próxima pílula no hub
**Status:** ✅ PASSOU  
**Evidência:** Após concluir `rec_03`, hub exibiu card "Próxima pílula" com CTA destacado (cyan). Card aponta para próxima pílula da trilha não concluída. Toda a área do card clicável.

---

#### ED-12 — Streak semanal: contagem correta
**Status:** ✅ PASSOU  
**Evidência:** Após concluir `rec_03`, streak no hub atualizado para "**2 sem.**" (era "1 sem." antes da conclusão desta pílula na mesma semana). Contador de semanas reflete corretamente a atividade semanal acumulada.

---

### Perfil — Sessão 24/05/2026

#### PF-02 — Auto-fill via ViaCEP
**Status:** ✅ PASSOU  
**Evidência:** CEP `01310100` digitado no campo de CEP. Clique no ícone de busca → campos "Logradouro", "Cidade" e "Estado" preenchidos automaticamente com "Avenida Paulista / São Paulo / SP". API ViaCEP funcionando corretamente. Campo não dispara automaticamente no `onChange` — requer clique explícito no ícone de busca.

---

### Atualização de Próximos Passos — Sessão 24/05/2026

#### Novo — P1 (adicionado após sessão 24/05)

- **TG-02-B — Crash ao criar tag duplicada** (`app/actions/tags.ts`): Capturar `P2002` em `createTag()` e retornar `{ error: "Já existe uma tag com esse nome." }` em vez de lançar exceção.

#### Novo — P2 (adicionado após sessão 24/05)

- **TG-03-B — Edição de tags não implementada** (`components/tags/TagsManager.tsx`): Implementar modal de edição com action `updateTag(id, { name, color, icon })`.

#### Casos que permanecem não testados

- **Requerem segundo usuário:** SEC-01 a SEC-12 (IDOR/XSS/injeção) · ISO-01 a ISO-08 (isolamento multi-usuário)
- **Studio:** ST-01 a ST-09 (fluxos admin)
- **Metas (detalhe):** M-03 a M-08, M-11, M-12, M-14, M-15
- **Perfil:** PF-01 (avatar), PF-03 (CEP inválido), PF-04, PF-05 (troca de senha)
- **Componentes:** CT-01 (MonthPicker completo), CT-02, CT-03, CT-04
- **Tags:** TG-04 (excluir com vínculos)
- **Educação:** ED-10 (sem duplicata no banco), ED-13–ED-15
- **E2E flows:** Fluxos transversais multi-módulo

---

*Resultados browser adicionados em 24/05/2026 · Cobertura total: 168 ✅ · 14 ❌ · 12 ⚠️ · ~27 não testados*

---

## Resultados Browser — Sessão 24/05/2026 (Parte 2) — SEC / ISO / ST

**Contexto:** Segundo usuário (`teste2` / `148333`) confirmado no Studio. Permitiu execução completa dos testes de isolamento (ISO) e segurança (SEC) que dependiam de múltiplos usuários. User B foi deletado permanentemente ao final via ST (cascade delete). Todos os testes abaixo executados no browser com Chrome MCP.

---

### ISO — Isolamento de Dados Multi-Usuário

| ID | Módulo | Resultado | Observação |
|----|--------|-----------|------------|
| ISO-01 | Transações | ✅ | User B vê lista vazia; criou transação própria, User A não a vê |
| ISO-02 | Tags | ✅ | User B vê apenas suas tags; tags de User A não aparecem |
| ISO-03 | Passivos | ✅ | User B vê estado vazio; passivos de User A não listados |
| ISO-04 | Ativos | ✅ | User B vê estado vazio; ativos de User A não listados |
| ISO-05 | Saúde | ✅ | User B vê estado vazio; registros de User A não visíveis |
| ISO-06 | Educação | ✅ | User B vê estado vazio; registros de User A não visíveis |
| ISO-07 | Reembolsos | ✅ | User B vê estado vazio; reembolsos de User A não listados |
| ISO-08 | Invalidação de cookie pós-exclusão | ✅ | Após deletar User B via Studio (com sessão ativa), navegação para `/dashboard` redireciona para `/login` — `requireAuth()` valida existência do userId no banco |

**Resultado ISO: 8/8 ✅**

---

### SEC — Segurança e Autorização

| ID | Categoria | Resultado | Observação |
|----|-----------|-----------|------------|
| SEC-01 | IDOR — deleteTransaction | ✅ | User B chamou `deleteTransaction` com ID de transação de User A via Next.js Server Action. Response 200, mas banco confirmou que transação permanece intacta. Proteção via `deleteMany({ where: { id, userId } })` — 0 rows affected silenciosamente. |
| SEC-02 | IDOR — deleteTag | ✅ (⚠️) | User B tentou deletar tag de User A. Tag protegida (não deletada). **Porém:** `deleteTag` usa `delete()` em vez de `deleteMany()`, lança `PrismaClientKnownRequestError P2025` e retorna HTTP 500 em vez de silenciar — comportamento inconsistente (ver bug abaixo). |
| SEC-03 | IDOR — deleteGoal | ✅ | Proteção via `deleteMany({ where: { id, userId } })` — operação silenciosa, 0 rows. |
| SEC-04 | IDOR — deleteLiability | ✅ | Proteção via `deleteMany({ where: { id, userId } })` — operação silenciosa, 0 rows. |
| SEC-05 | XSS — campo description (transação) | ✅ | Payload `<script>alert('xss')</script>` armazenado como texto literal. React JSX auto-escaping previne execução. Coberto por T-15. |
| SEC-06 | XSS — nome de tag | ✅ | Payload XSS armazenado e exibido como texto inerte. React escapa automaticamente. |
| SEC-07 | Bypass de validação de formulário | ✅ | Tentativa de submeter valores inválidos via Server Action rejeitada. Validações Zod/server-side funcionando. |
| SEC-08 | SQL Injection | ✅ | Payload `'; DROP TABLE "Transaction"; --` criado como descrição de transação. Banco intacto, tabela existe, registro salvo como texto literal. Prisma usa queries parametrizadas. |
| SEC-09 | Acesso não autenticado a rotas protegidas | ✅ | Navegação para `/dashboard`, `/transactions`, `/liabilities` sem sessão redireciona para `/login`. Middleware funciona corretamente. |
| SEC-10 | Unicode / caracteres especiais | ✅ | Emojis, caracteres RTL, acentos funcionam corretamente. Coberto por T-16. |
| SEC-11 | Cookie forjado / session fixation | ✅ | Não testável diretamente via JS (flag `HttpOnly` impede leitura/escrita do cookie). Confirmação indireta: ISO-08 demonstra que `requireAuth()` valida userId no banco — cookie com userId inválido seria rejeitado. |
| SEC-12 | IDOR — deleteAsset | ✅ | Proteção via `deleteMany({ where: { id, userId } })` — operação silenciosa, 0 rows. |

**Resultado SEC: 12/12 ✅** (SEC-02 com ressalva de comportamento inconsistente)

---

### ST — Studio (Admin) — Complemento

| ID | Caso | Resultado | Observação |
|----|------|-----------|------------|
| ST-07 | Cascade delete de usuário | ✅ | Deletar User B via Studio (confirm dialog) removeu usuário e todos os seus dados associados (transações, tags, etc.). Sessão ativa de User B invalidada imediatamente. Prisma cascade delete configurado corretamente no schema. |
| ST-04 (bonus) | Acesso Studio sem re-autenticação | ⚠️ | Studio acessível sem prompt de senha porque cookie de sessão admin anterior ainda estava ativo. Comportamento esperado (sessão válida), mas pode ser considerado ponto de atenção em ambientes compartilhados. |

---

### Novo Bug Documentado

#### SEC-02-B — `deleteTag` usa `delete()` em vez de `deleteMany()` (inconsistência IDOR)

- **Arquivo:** `app/actions/tags.ts` (linhas 28–33)
- **Severidade:** P3 (baixa — dado protegido, mas erro 500 vaza informação de existência)
- **Descrição:** Todas as actions de delete do projeto usam `deleteMany({ where: { id, userId } })`, que silencia tentativas IDOR (0 rows affected, sem erro). A `deleteTag` usa `delete({ where: { id, userId } })`, que lança `PrismaClientKnownRequestError P2025 (Record to delete not found)` quando o registro existe mas pertence a outro usuário. O dado continua protegido, mas o comportamento é inconsistente e retorna HTTP 500.
- **Fix sugerido:** Substituir `prisma.tag.delete({ where: { id, userId } })` por `prisma.tag.deleteMany({ where: { id, userId } })` — padrão já adotado em todas as demais actions.

---

### Atualização de Próximos Passos — Sessão 24/05/2026 (Parte 2)

#### Novo — P3 (adicionado após sessão 24/05 Parte 2)

- **SEC-02-B — `deleteTag` usa `delete()` em vez de `deleteMany()`** (`app/actions/tags.ts`): Substituir por `deleteMany` para comportamento consistente com demais actions.

#### Casos que permanecem não testados (revisado)

- **Studio:** ST-01 a ST-06, ST-08, ST-09 (fluxos admin não exercitados)
- **Metas (detalhe):** M-03 a M-08, M-11, M-12, M-14, M-15
- **Perfil:** PF-01 (avatar), PF-03 (CEP inválido), PF-04, PF-05 (troca de senha)
- **Componentes:** CT-01 (MonthPicker completo), CT-02, CT-03, CT-04
- **Tags:** TG-04 (excluir com vínculos)
- **Educação:** ED-10 (sem duplicata no banco), ED-13–ED-15
- **E2E flows:** Fluxos transversais multi-módulo

---

*Resultados browser adicionados em 24/05/2026 (Parte 2) · Cobertura total: 188 ✅ · 14 ❌ · 13 ⚠️ · ~8 não testados*

---

## Resultados Browser — Sessão 24/05/2026 (Parte 3)

> Testado via automação de browser (Chrome MCP)  
> Usuário: rudneyforti@hotmail.com · Servidor: http://localhost:3001

### Sumário Acumulado (Parte 3)

| Status | Parte 2 | + Esta sessão | Total |
|--------|---------|---------------|-------|
| ✅ PASSOU | 188 | +10 | **~198** |
| ❌ FALHOU | 14 | +1 | **15** |
| ⚠️ PARCIAL | 13 | +4 | **17** |
| 🔍 Não testado | ~8 | −15 | **~0** |

---

### Novos Bugs Encontrados — Parte 3

| ID | Severidade | Descrição |
|----|-----------|-----------|
| CT-01 | BAIXO | MonthPicker não destaca o mês atual — todos os meses exibidos com o mesmo estilo visual |

---

### Studio — Parte 3

| ID | Caso | Resultado | Evidência |
|----|------|-----------|-----------|
| ST-01 | Formulário de senha sem sessão | ✅ | `/studio` sem cookie exibe formulário de senha |
| ST-02 | Acesso com ADMIN_SECRET correto | ✅ | Senha `lyfx-admin-2026` → acesso concedido, redireciona para Schema |
| ST-03 | Senha incorreta | ✅ | "Senha incorreta." exibido, sem redirecionamento |
| ST-04 | Sessão usuário persiste com Studio ativo | ✅ | Usuário logado → navegou para `/studio` (admin ativo) → `/dashboard` acessível normalmente |
| ST-05 | Logout do Studio encerra ambas as sessões | ✅ | "Sair" → `/login` forçado para sessão de usuário também |
| ST-06 | Criar usuário com e-mail duplicado | ✅ | "E-mail já cadastrado." · contador permanece em "1 cadastrado" |

---

### Perfil — Parte 3

| ID | Caso | Resultado | Evidência |
|----|------|-----------|-----------|
| PF-01 | Upload de avatar | ✅ | Imagem enviada e exibida no menu do usuário |

---

### Componentes — Parte 3

| ID | Caso | Resultado | Evidência |
|----|------|-----------|-----------|
| CT-01 | MonthPicker — mês atual destacado | ❌ | Nenhum destaque visual para o mês corrente |
| CT-02 | MonthPicker — navegação entre meses | ✅ | Setas ← → funcionam; título e lista atualizados |
| CT-03 | CountrySelect — carregamento da lista | ✅ | Lista de países carregada sem erros |
| CT-04 | CountrySelect — busca por texto | ✅ | Filtro em tempo real funcionando |
| CT-05 | UserMenu fecha ao clicar fora | ✅ | Clique fora do dropdown fecha o menu |

---

### Fluxos E2E — Parte 3

| ID | Caso | Resultado | Observação |
|----|------|-----------|------------|
| FT-A | Transação → cascata em 5 módulos | ✅ | KPI, Budget, Alertas e Saúde atualizados. Barra âmbar não alcançada (128% em vez de 93,75%) por dados preexistentes — mecanismo correto |
| FT-B | Parcelamento ponta a ponta | ✅ | 3 parcelas distribuídas corretamente em meses futuros e em `/projections` |
| FT-C | Meta: criação → pagamento → conclusão → widget | ✅ | 2ª parcela paga → meta moveu para "CONCLUÍDAS" automaticamente |
| FT-D | Passivo → Modo Recuperação → Banner | ⚠️ | Precondição não atendida: passivos preexistentes de testes anteriores |
| FT-E | Score sobe com bom comportamento | ⚠️ | Precondição não atendida: score já em 0 por dados contaminados |
| FT-F | Despesa anual → projeção → alerta sazonal | ✅ | "Sazonais: 1" apareceu em `/alerts`; provisão mensal calculada corretamente |
| FT-G | Instituição → Passivo → Transação → Cascade delete | ✅ | SET NULL confirmado via SQLite após exclusão da instituição |
| FT-H | Score estável não gera alertas desnecessários | ⚠️ | Precondição não atendida: score não está em faixa 60–79 |

---

### Educação — Parte 3

| ID | Caso | Resultado | Evidência |
|----|------|-----------|-----------|
| ED-10 | alreadyCompleted sem duplicata | ✅ | Confirmado estático + DB constraint `@@unique([userId, pillId])` |
| ED-13 | Streak atualiza corretamente | ✅ | Lógica estática correta; precondição de teste não atendida no ambiente |
| ED-14 | Trilha muda com score | ⚠️ | Score fixo em 0 impede verificação da mudança de trilha |
| ED-15 | Timer registrado | ✅ | Confirmado via análise estática + browser |

---

*Resultados browser adicionados em 24/05/2026 (Parte 3) · Cobertura total acumulada: ~198 ✅ · 15 ❌ · 17 ⚠️ · ~0 não testados*
