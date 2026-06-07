# CHANGE SPECS — Lyfx
> Gerado pelo Agent Smith v9.0 · Baseado em QA-RESULTS-2026-05-22.md  
> Data de geração: 24/05/2026  
> Change Specs produzidos para o Agent NEO implementar

---

## Sumário de Change Specs

| # | ID Smith | Severidade | Módulo | Título |
|---|----------|-----------|--------|--------|
| CS-01 | SEC-11 | 🔴 CRÍTICO | Autenticação / Sessão | Assinar cookie de sessão com HMAC para eliminar forgery |
| CS-02 | A-04 | 🔴 CRÍTICO | Autenticação | Unificar mensagens de erro de login para eliminar username enumeration |
| CS-03 | T-10 | 🟠 ALTO | Transações / Parcelamento | Corrigir algoritmo de cálculo de parcelas para garantir soma exata do total |
| CS-04 | T-11 | 🟠 ALTO | Transações / Parcelamento | Alinhar validação de mínimo de parcelas entre frontend e action |
| CS-05 | M-02 | 🟠 ALTO | Metas | Rejeitar prazo no passado na action de criação de meta |
| CS-06 | T-17-B · T-12 | 🟠 ALTO | Transações | Corrigir navegação de meses e feedback de erro no módulo de Transações |
| CS-07 | TG-02-B · TG-03-B · SEC-02-B | 🟠 ALTO | Tags | Tratar erro de tag duplicada, implementar edição e corrigir inconsistência IDOR |
| CS-08 | AL-04 | 🟡 MÉDIO | Alertas | Filtrar alertas de passivo crítico apenas quando saldo > 0 |
| CS-09 | A-09 | 🟡 MÉDIO | Autenticação | Adicionar validação de formato de e-mail na action de setup |
| CS-10 | R-05 | 🟡 MÉDIO | Relatórios | Adicionar guard de divisão por zero em percentuais com receita zero |
| CS-11 | N-01 | 🟡 MÉDIO | Navegação / Layout | Definir valor inicial de --sidebar-width no CSS global |
| CS-12 | ST-07 | 🔵 BAIXO | Studio | Incluir PillProgress na exclusão em cascata de usuário via adminDeleteUser |
| CS-13 | A-17 · A-18 | 🔵 BAIXO | Autenticação | Implementar "Lembrar de mim" funcional e preservar rota original no redirect |
| CS-14 | T-11-B · T-19-B · T-22/T-23-B · CT-01 | 🔵 BAIXO | Transações / UI | Correções de UX: pluralização, confirmação de exclusão, fechar ActionBar, mês atual no MonthPicker |

---

# CHANGE SPEC CS-01

**1. Título:** Assinar cookie de sessão com HMAC para eliminar vetor de forgery

**2. Motivação:**  
`lib/session.ts` L12 armazena o `userId` bruto (CUID string) no cookie `lyfx_session` sem nenhuma assinatura, MAC ou criptografia. Um atacante que descobre um `userId` válido (via log, DevTools, erro de aplicação, etc.) pode forjar o cookie manualmente e assumir qualquer sessão. A validação em `requireAuth()` / `app/(app)/layout.tsx` L13–14 consulta o banco pelo userId recebido do cookie — se o valor for forjado com um ID real, o acesso é concedido integralmente. Violação direta de WAHH cap. 6 (Session Management) e do princípio Hunt/Thomas DBC (o contrato do cookie pressupõe integridade que não existe).

**3. Escopo:**
- Substituir o armazenamento de `userId` bruto no cookie por um valor assinado com HMAC (ou encriptado via iron-session)
- A leitura do cookie deve verificar a assinatura antes de extrair o userId
- Manter a mesma interface de `setSession(userId)` e `getSession()` para não alterar callers

**4. Fora de escopo:**
- Migração para NextAuth ou outro provider de autenticação
- Alteração de campos do usuário, schema ou fluxo de login/logout
- Multi-factor authentication

**5. Critérios de aceite:**
- Dado um cookie com userId válido mas sem assinatura correta → quando `requireAuth()` é invocado → então a sessão é rejeitada e o usuário é redirecionado para `/login`
- Dado um cookie forjado com userId de outro usuário → quando qualquer server action protegida é chamada → então retorna erro de autenticação
- Dado login legítimo → quando o usuário navega entre páginas protegidas → então a sessão persiste normalmente durante 30 dias
- Dado que a secret não existe no env → quando a aplicação tenta assinar → então falha com erro claro de configuração

**6. Impacto técnico:**
- UI: não — interface de login/logout inalterada
- Server/API: sim — `lib/session.ts` (setSession, getSession), `app/login/actions.ts` (setSession caller), `app/(app)/layout.tsx` (getSession caller)
- Banco/Schema: não
- Auth/Sessão: sim — formato do cookie muda; sessions existentes serão invalidadas no deploy
- Cálculos/Comportamento central: não

**7. Risco:** alto — Breaking change na sessão: todos os usuários logados serão deslogados no deploy. Planejar comunicação ou deploy em horário de baixo uso.

**8. Testes:**
- Unitários: testar `setSession` e `getSession` com assinaturas válidas e inválidas; testar cookie com payload adulterado
- Integração: testar rota protegida com cookie forjado (deve redirecionar para `/login`)
- E2E: login → fechar browser → reabrir → verificar persistência normal

**9. Versão:** `v0.X.Y+1` — PATCH se a interface pública da sessão for mantida; MINOR se adicionar nova dependência de biblioteca ao package.json (nova capacidade). Classificação final: **MINOR** — nova dependência (iron-session ou crypto HMAC) + breaking change de sessão (todas as sessões ativas expiram no deploy).
> Árvore de decisão: toca contrato de Auth/Sessão? Sim. É destrutivo (invalida sessões ativas)? Sim → **MAJOR**. Ativar Fluxo de Breaking Change (B1–B9).

**10. Validação manual:**
1. Logar com credenciais válidas; inspecionar cookie `lyfx_session` — valor não deve ser CUID puro, deve ser valor opaco assinado
2. Copiar o cookie, substituir 2 caracteres aleatórios no meio do valor assinado, reeditar o cookie no DevTools e navegar para `/dashboard` — deve redirecionar para `/login`
3. Logar normalmente e navegar por 5 páginas diferentes — sessão deve persistir sem interrupções
4. Verificar no DevTools que o cookie tem flags `HttpOnly`, `Secure` (em prod) e `SameSite=Lax`

---

# CHANGE SPEC CS-02

**1. Título:** Unificar mensagens de erro de login para eliminar username enumeration

**2. Motivação:**  
`app/login/actions.ts` L27 retorna `{ error: "E-mail não encontrado." }` quando o email não existe e L30 retorna `{ error: "Senha incorreta." }` quando a senha falha. As duas mensagens distintas permitem que um atacante enumere endereços de e-mail válidos no sistema comparando as respostas — confirmado em browser (A-04). Violação direta de WAHH cap. 6 (Authentication): "The application should not reveal whether the username or the password was incorrect." Severidade CRÍTICO automático por WAHH.

**3. Escopo:**
- Alterar `app/login/actions.ts` para retornar mensagem única `"Credenciais inválidas."` em ambos os cenários (email não encontrado e senha incorreta)
- Manter a lógica de verificação interna inalterada (ainda verifica bcrypt) — apenas a mensagem exposta ao client muda

**4. Fora de escopo:**
- Rate limiting ou lockout de conta
- Implementação de CAPTCHA
- Logging de tentativas de login

**5. Critérios de aceite:**
- Dado e-mail inexistente → quando login é submetido → então a mensagem exibida é exatamente "Credenciais inválidas." (sem mencionar o e-mail)
- Dado e-mail válido com senha incorreta → quando login é submetido → então a mensagem exibida é exatamente "Credenciais inválidas." (idêntica ao caso anterior)
- Dado credenciais válidas → quando login é submetido → então redireciona para `/dashboard` sem mensagem de erro

**6. Impacto técnico:**
- UI: sim — mensagem de erro exibida no formulário de login muda
- Server/API: sim — `app/login/actions.ts` L27 e L30
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** baixo — mudança de 1 linha por mensagem; zero impacto em fluxo de dados.

**8. Testes:**
- Unitários: testar `login()` com email inexistente → retorna `{ error: "Credenciais inválidas." }`; testar com email válido e senha errada → mesmo retorno
- Integração: testar que as duas chamadas retornam string identicamente igual (não apenas semanticamente similar)

**9. Versão:** **PATCH** — bugfix de segurança, sem alteração de comportamento funcional para o usuário legítimo, sem breaking change de contrato.

**10. Validação manual:**
1. Tentar login com e-mail `naoexiste@teste.com` → verificar que a mensagem é "Credenciais inválidas."
2. Tentar login com e-mail válido e senha errada → verificar que a mensagem é **identicamente** "Credenciais inválidas." (copiar e comparar char a char)
3. Fazer login com credenciais corretas → verificar redirecionamento normal para `/dashboard`

---

# CHANGE SPEC CS-03

**1. Título:** Corrigir algoritmo de distribuição de parcelas para garantir soma exata do total

**2. Motivação:**  
`app/actions/transactions.ts` L188 usa `Math.ceil((totalAmount / count) * 100) / 100` para calcular o valor de cada parcela. Para R$ 100,00 em 3 parcelas: `Math.ceil(33,333... * 100) / 100 = 33,34`. Todas as 3 parcelas ficam R$ 33,34, totalizando R$ 100,02 — R$ 0,02 a mais que o total original. Confirmado em browser (T-10). A função `createGoal()` em `goals.ts` L36–37 já possui a lógica correta de "última parcela absorve o resíduo" — violação de DRY (Hunt/Thomas, Topic 9). Severidade ALTO: afeta integridade financeira de todos os parcelamentos com valor não divisível.

**3. Escopo:**
- Alterar `app/actions/transactions.ts` na função `createInstallments()` para usar `Math.floor` nas n-1 parcelas e atribuir `totalAmount - (base * (count - 1))` à última parcela
- Replicar o padrão já existente em `goals.ts` L36–37

**4. Fora de escopo:**
- Recálculo retroativo de parcelamentos já criados no banco
- Alteração da lógica de `createGoal()` (já correta)
- Migração de dados históricos

**5. Critérios de aceite:**
- Dado R$ 100,00 em 3 parcelas → quando `createInstallments()` é chamada → então parcelas são R$ 33,33 + R$ 33,33 + R$ 33,34 = R$ 100,00 exatos
- Dado R$ 100,00 em 3 parcelas → quando somadas todas as parcelas → então `soma === totalAmount` (sem divergência de centavos)
- Dado valor divisível (R$ 90,00 em 3 parcelas) → então todas as parcelas são R$ 30,00 e a soma é exata
- Dado 1 parcela de R$ 100,00 → então a parcela única é R$ 100,00

**6. Impacto técnico:**
- UI: não — valores exibidos serão corretos (antes eram incorretos)
- Server/API: sim — `app/actions/transactions.ts`, função `createInstallments()`, L188
- Banco/Schema: não — estrutura não muda, apenas os valores inseridos
- Auth/Sessão: não
- Cálculos/Comportamento central: sim — valor das parcelas muda para qualquer total não divisível

**7. Risco:** médio — mudança de comportamento central de cálculo financeiro; parcelamentos novos gerarão valores diferentes dos atuais (corretos). Parcelamentos existentes no banco permanecem com os valores incorretos (sem migração retroativa).

**8. Testes:**
- Unitários: testar `createInstallments()` com R$ 100,00 / 3 parcelas → verificar array de valores; testar com R$ 10,00 / 3 parcelas; testar divisor exato; testar 1 parcela
- Integração: criar parcelamento via action e verificar soma no banco = totalAmount

**9. Versão:** **PATCH** — bugfix de cálculo; contrato da action não muda, dados de entrada não mudam, apenas o resultado (correto) é diferente.

**10. Validação manual:**
1. Criar parcelamento de R$ 100,00 em 3x → verificar que as parcelas exibidas são R$ 33,33 + R$ 33,33 + R$ 33,34
2. Criar parcelamento de R$ 100,00 em 3x → somar manualmente os 3 valores exibidos → deve ser exatamente R$ 100,00
3. Criar parcelamento de R$ 90,00 em 3x → verificar que todas as 3 parcelas são R$ 30,00

---

# CHANGE SPEC CS-04

**1. Título:** Alinhar validação de mínimo de parcelas entre frontend e action e corrigir UX de bloqueio silencioso

**2. Motivação:**  
Dois problemas relacionados ao mínimo de parcelas no parcelamento:  
(a) `TransactionForm.tsx` L75 usa `count < 2` para bloquear, mas o plano de testes T-11 esperava que 1 parcela fosse aceita. Há uma inconsistência de produto que precisa ser resolvida explicitamente: ou o mínimo é 1 (alterar validação) ou é 2 (confirmar e atualizar o plano).  
(b) O input `min="2"` em L204 bloqueia silenciosamente a submissão sem exibir nenhuma mensagem de erro ao usuário — comportamento confirmado em browser (T-11-B). Violação de Myers Princípio 6 (o programa não deve fazer o que não deveria sem avisar) e de UX básica de formulário.

**3. Escopo:**
- Definir explicitamente o mínimo de parcelas como **1** (aceitar parcelamento em 1 parcela é o comportamento correto para o produto)
- Alterar `TransactionForm.tsx` L75 de `count < 2` para `count < 1`
- Alterar `TransactionForm.tsx` L204 de `min="2"` para `min="1"`
- Garantir que validação inválida exibe mensagem de erro visível (não silencia)

**4. Fora de escopo:**
- Alteração da action `createInstallments()` — já funciona corretamente com count=1 conforme análise estática
- Pluralização dos rótulos (coberta por CS-14)

**5. Critérios de aceite:**
- Dado count = 1 → quando formulário é submetido → então a transação é criada com rótulo "(1/1)" sem erro
- Dado count = 0 → quando formulário é submetido → então exibe mensagem de erro visível "Número de parcelas deve ser entre 1 e 120."
- Dado count = 121 → quando formulário é submetido → então exibe mensagem de erro visível "Número de parcelas deve ser entre 1 e 120."

**6. Impacto técnico:**
- UI: sim — `components/transactions/TransactionForm.tsx` L75 e L204
- Server/API: não — action já suporta count=1
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** baixo — mudança de validação frontend; sem alteração de lógica de banco ou server action.

**8. Testes:**
- Unitários: testar componente `TransactionForm` com count=1 → nenhum erro; count=0 → erro visível; count=121 → erro visível
- Integração: submeter formulário com count=1 → verificar criação no banco

**9. Versão:** **PATCH** — correção de validação e feedback de UX.

**10. Validação manual:**
1. Abrir formulário de parcelamento, digitar "1" no campo de parcelas → clicar em criar → transação deve ser criada com "(1/1)"
2. Digitar "0" no campo de parcelas → verificar que mensagem de erro é exibida inline no formulário (não silêncio)
3. Digitar "121" → verificar mensagem de erro visível

---

# CHANGE SPEC CS-05

**1. Título:** Rejeitar prazo no passado na action de criação de meta com validação server-side

**2. Motivação:**  
`app/actions/goals.ts` L25–33 aceita silenciosamente uma `deadline` no passado. O `Math.max(1, months_negative)` converte meses negativos em 1, criando uma meta com uma única cobrança imediata sem aviso ao usuário. Confirmado em browser (M-02): meta com prazo jan/2025 foi criada sem erro, exibindo "Prazo: dez. de 2024". Violação de Myers Princípio 5 (testes devem cobrir condições inválidas) e do princípio de Fail Fast (Hunt/Thomas, Topic 24). A validação no frontend é apenas `!deadline` (campo vazio) — ausência de validação de data futura no servidor.

**3. Escopo:**
- Adicionar validação em `app/actions/goals.ts` na função `createGoal()`: se `deadline < startOfCurrentMonth()` → retornar `{ error: "O prazo deve ser uma data futura." }`
- A verificação deve comparar com o início do mês atual (não com `now` exato), pois meta com prazo no mês atual é válida (gera 1 cobrança)

**4. Fora de escopo:**
- Alteração do comportamento para prazo no mês atual (já correto — gera 1 cobrança)
- Validação de frontend além da já existente
- Edição retroativa de metas existentes com prazo passado

**5. Critérios de aceite:**
- Dado deadline = data no passado (ex: jan/2025) → quando `createGoal()` é chamada → então retorna `{ error: "O prazo deve ser uma data futura." }` sem criar registro no banco
- Dado deadline = mês atual (ex: mai/2026) → quando `createGoal()` é chamada → então meta é criada normalmente com 1 cobrança
- Dado deadline = data futura → quando `createGoal()` é chamada → então meta é criada normalmente
- Dado bypass via chamada direta à action (sem frontend) → a validação server-side ainda rejeita

**6. Impacto técnico:**
- UI: sim — formulário de metas exibirá mensagem de erro para prazo no passado
- Server/API: sim — `app/actions/goals.ts`, função `createGoal()`, após L25
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: sim — cálculo de `months` afetado; a validação bloqueia antes do cálculo

**7. Risco:** baixo — adição de validação server-side; zero impacto em metas existentes.

**8. Testes:**
- Unitários: testar `createGoal()` com deadline ontem → retorna erro; com deadline início do mês atual → sucesso; com deadline próximo mês → sucesso
- Integração: POST direto à action com deadline passada → banco não deve conter a meta

**9. Versão:** **PATCH** — bugfix de validação de entrada; sem alteração de schema ou contrato público.

**10. Validação manual:**
1. Abrir modal "Nova meta", definir prazo para qualquer data de 2024 → clicar em criar → mensagem de erro deve aparecer sem criar a meta
2. Definir prazo para o mês atual → meta deve ser criada normalmente com 1 cobrança
3. Definir prazo para 6 meses no futuro → meta criada com 6 cobranças

---

# CHANGE SPEC CS-06

**1. Título:** Corrigir navegação de meses em Transações e exibir feedback de erro para valor zero

**2. Motivação:**  
Dois bugs no módulo de Transações confirmados em browser:  
(a) T-17-B: `app/(app)/transactions/page.tsx` L8–10 usa `const now = new Date()` hardcoded, ignorando completamente o parâmetro `?month=YYYY-MM` da URL. Impossível visualizar transações de meses anteriores via URL. O módulo Budget usa estado React (client-side) com navegação funcional; Transações não tem nenhuma navegação de período — usuário fica preso no mês corrente.  
(b) T-12-B: Rejeição de valor=0 pelo servidor ocorre silenciosamente sem exibir mensagem ao usuário. Formulário permanece preenchido sem feedback (confirmado em browser). Violação de Myers Princípio 1 (resultado esperado definido) — o usuário não sabe se houve erro.

**3. Escopo:**
- Modificar `app/(app)/transactions/page.tsx` para aceitar `searchParams: { month?: string }` e passar o parâmetro `month`/`year` para `getTransactions()`
- Adicionar UI de navegação ← → similar à do Budget para navegar entre meses (MonthPicker ou setas)
- Atualizar `getTransactions()` em `app/actions/transactions.ts` para aceitar e usar `month`/`year` opcionais
- Exibir mensagem de erro visível inline quando servidor rejeita valor=0 ou negativo no formulário de transação

**4. Fora de escopo:**
- Deep-link de meses em outros módulos (Budget, Contas Fixas)
- Filtros por categoria, tag ou tipo no módulo de Transações
- Paginação infinita ou virtual scrolling

**5. Critérios de aceite:**
- Dado URL `/transactions?month=2026-04` → quando a página carrega → então exibe as transações de abril/2026
- Dado clique na seta "←" → quando o mês atual é mai/2026 → então navega para abr/2026 e exibe as transações correspondentes
- Dado valor = 0 no formulário → quando submit é clicado → então mensagem "Valor deve ser maior que zero." aparece inline no formulário sem resetar os outros campos
- Dado valor = -1 → idem ao caso anterior

**6. Impacto técnico:**
- UI: sim — `app/(app)/transactions/page.tsx`, `TransactionList.tsx` ou novo componente de navegação de período
- Server/API: sim — `app/actions/transactions.ts` (`getTransactions()`) para aceitar parâmetro de período
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** médio — alteração em Server Component de página e em data-fetching action central. Risco de regressão em exibição de transações.

**8. Testes:**
- Unitários: testar `getTransactions({ month: 4, year: 2026 })` → retorna apenas transações de abril/2026
- Integração: carregar `/transactions?month=2026-04` → verificar que apenas transações de abril são exibidas
- E2E: navegar via setas ← → e verificar que cada mês exibe dados corretos

**9. Versão:** **MINOR** — nova capacidade (navegação de períodos em Transações); feature não existia antes.

**10. Validação manual:**
1. Navegar para `/transactions?month=2026-03` → verificar que transações de março/2026 são exibidas
2. Clicar na seta "←" a partir de maio/2026 → verificar navegação para abril/2026 com dados corretos
3. Preencher formulário com valor 0 → submeter → verificar mensagem de erro inline sem resetar descrição e categoria

---

# CHANGE SPEC CS-07

**1. Título:** Corrigir tratamento de tag duplicada, implementar edição de tags e padronizar delete para deleteMany

**2. Motivação:**  
Três anomalias relacionadas ao módulo de Tags descobertas em browser (sessão 24/05):  
(a) TG-02-B: `app/actions/tags.ts` `createTag()` não captura `PrismaClientKnownRequestError P2002` (unique constraint `userId, name`) — erro Prisma vaza para o usuário como tela de crash Next.js. Severidade ALTO por impacto de UX crítico e vazamento de erro interno.  
(b) TG-03-B: `components/tags/TagsManager.tsx` não implementa nenhum fluxo de edição (apenas criar e deletar). Grep confirmou ausência de qualquer referência a `edit`, `Edit`, `Editar`. Feature especificada (action `updateTag` existe no servidor) mas não implementada no frontend.  
(c) SEC-02-B: `app/actions/tags.ts` `deleteTag()` usa `delete()` em vez de `deleteMany()`, lançando `P2025 HTTP 500` em tentativas IDOR (comportamento inconsistente com todas as demais actions que usam `deleteMany` silencioso).

**3. Escopo:**
- `createTag()`: envolver chamada Prisma em try/catch, verificar `error.code === 'P2002'` e retornar `{ error: "Já existe uma tag com esse nome." }`
- `deleteTag()`: substituir `prisma.tag.delete({ where: { id, userId } })` por `prisma.tag.deleteMany({ where: { id, userId } })`
- `TagsManager.tsx`: implementar modal/inline edit com action `updateTag(id, { name, color, icon })` — pattern similar ao de criação existente

**4. Fora de escopo:**
- Merge ou bulk-rename de tags
- Histórico de alterações de tags
- Validação de comprimento mínimo/máximo do nome de tag (além da obrigatoriedade já existente)

**5. Critérios de aceite:**
- Dado tag "Carro" já existente → quando usuário tenta criar nova tag "Carro" → então mensagem "Já existe uma tag com esse nome." exibida inline (sem tela de crash)
- Dado tag existente → quando usuário clica em editar → então modal/inline edit abre pré-populado com nome, cor e ícone atuais
- Dado edição com novo nome único → quando salvo → então tag atualizada sem erro
- Dado User B tentando deletar tag de User A via action → quando `deleteTag` é chamada → então retorna sucesso silencioso (0 rows affected) sem HTTP 500

**6. Impacto técnico:**
- UI: sim — `components/tags/TagsManager.tsx` (novo fluxo de edição)
- Server/API: sim — `app/actions/tags.ts` (`createTag` e `deleteTag`)
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** médio — implementação de nova UI de edição; risco de regressão em criação/exclusão de tags.

**8. Testes:**
- Unitários: testar `createTag()` com nome duplicado → retorna `{ error: "..." }` sem throw; testar `deleteTag()` com ID de outro usuário → retorna sem erro (deleteMany)
- Integração: criar tag com nome duplicado via action direta → verificar que banco não cria duplicata e retorno é error amigável
- E2E: clicar em editar tag existente → alterar nome e cor → salvar → verificar atualização na lista

**9. Versão:** **MINOR** — nova feature (UI de edição de tags) + dois bugfixes.

**10. Validação manual:**
1. Ir para `/tags`, criar tag "Viagem" → tentar criar nova tag "Viagem" → verificar mensagem "Já existe uma tag com esse nome." sem crash
2. Clicar no ícone de edição da tag "Viagem" → alterar cor para azul → salvar → verificar que cor atualizou na lista
3. Usar DevTools para chamar `deleteTag` com ID de tag de outro usuário → verificar resposta 200 (não 500)

---

# CHANGE SPEC CS-08

**1. Título:** Filtrar alertas de passivo crítico apenas quando currentBalance > 0

**2. Motivação:**  
`app/actions/alerts.ts` L180–186 filtra passivos do tipo `cheque_especial` e `rotativo` pelo `status: "active"` mas sem verificar `currentBalance > 0`. Um passivo do tipo cheque especial "ativo" mas não utilizado (saldo zero) gera falso positivo de alerta crítico. O plano AL-05 especifica que passivo quitado não gera alerta — mas não cobre o caso de passivo ativo com saldo zero (não utilizado). Violação de Myers Princípio 6 (sistema não deve fazer o que não deveria — neste caso, alarmar desnecessariamente).

**3. Escopo:**
- Adicionar `currentBalance: { gt: 0 }` na query de `criticalLiabilities` em `app/actions/alerts.ts` L183

**4. Fora de escopo:**
- Alteração do critério de "status: active" para passivos
- Novos tipos de alerta de passivo
- Cálculo de juros projetados no alerta

**5. Critérios de aceite:**
- Dado passivo `cheque_especial` com `status: "active"` e `currentBalance = 0` → quando alertas são calculados → então este passivo NÃO gera alerta de passivo crítico
- Dado passivo `rotativo` com `status: "active"` e `currentBalance > 0` → quando alertas são calculados → então este passivo GERA alerta crítico normalmente
- Dado passivo `cheque_especial` com `status: "paid_off"` → permanece sem alerta (já coberto por AL-05)

**6. Impacto técnico:**
- UI: não — a exibição de alertas é dinâmica; menos alertas serão mostrados quando saldo é zero
- Server/API: sim — `app/actions/alerts.ts`, query de `criticalLiabilities`
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** baixo — adição de uma condição na query existente; não afeta outros tipos de alerta.

**8. Testes:**
- Unitários: testar `getAlerts()` com passivo rotativo ativo saldo=0 → ausente nos alertas; com saldo>0 → presente
- Integração: criar passivo ativo com saldo zero → verificar que `/alerts` não exibe alerta crítico para ele

**9. Versão:** **PATCH** — bugfix de lógica de filtragem.

**10. Validação manual:**
1. Criar passivo `cheque_especial` com `status: "active"` e `currentBalance = 0` → navegar para `/alerts` → verificar que não aparece como alerta crítico
2. Atualizar o mesmo passivo para `currentBalance = 100` → verificar que alerta crítico aparece

---

# CHANGE SPEC CS-09

**1. Título:** Adicionar validação de formato de e-mail na action de setup

**2. Motivação:**  
`app/login/actions.ts` `setup()` L13 verifica apenas `!data.email.trim()` — qualquer string não vazia é aceita como e-mail. Uma string como `"nao_e_email"` passaria pela validação e criaria uma conta com e-mail inválido, tornando impossível qualquer comunicação futura e potencialmente causando erros em integrações externas. Violação de WAHH Boundary Validation e do princípio Myers EP (condição "e-mail deve ter formato válido" requer classe válida + classe inválida testadas). Classificado como MÉDIO pois o sistema é single-user e o dano é limitado, mas a correção é trivial.

**3. Escopo:**
- Adicionar validação de formato de e-mail em `app/login/actions.ts` `setup()` usando regex simples ou `zod.string().email()`
- A validação deve rodar server-side independente de qualquer validação client-side

**4. Fora de escopo:**
- Verificação de domínio existente (DNS MX lookup)
- Validação de e-mail na action de login (email já deve existir no banco)
- Alteração do frontend de login

**5. Critérios de aceite:**
- Dado e-mail `"nao_e_email"` → quando `setup()` é chamada → então retorna `{ error: "E-mail inválido." }`
- Dado e-mail `"teste@"` → quando `setup()` é chamada → então retorna `{ error: "E-mail inválido." }`
- Dado e-mail `"teste@dominio.com"` → quando `setup()` é chamada → então prossegue normalmente
- Dado e-mail com domínio incomum `"teste@dominio.co.uk"` → então aceita normalmente

**6. Impacto técnico:**
- UI: sim — mensagem de erro "E-mail inválido." pode aparecer no formulário de setup
- Server/API: sim — `app/login/actions.ts`, `setup()`, após L13
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** baixo — adição de validação; sem impacto em fluxo existente para e-mails válidos.

**8. Testes:**
- Unitários: testar `setup()` com `"nao_e_email"` → erro; com `"a@b"` → erro; com `"teste@dominio.com"` → prossegue

**9. Versão:** **PATCH** — bugfix de validação de entrada.

**10. Validação manual:**
1. Chamar setup com e-mail `"semformato"` → verificar mensagem "E-mail inválido."
2. Chamar setup com e-mail `"usuario@dominio.com"` → setup prossegue normalmente

---

# CHANGE SPEC CS-10

**1. Título:** Adicionar guard de divisão por zero em percentuais de Relatórios com receita zero

**2. Motivação:**  
`app/actions/reports.ts` `getReports()` retorna `income`, `expense`, `result` e `categories` sem calcular percentuais — esses são calculados no componente `ReportsView.tsx`. A análise estática (R-05) identificou que se o componente calcula `(category / income) * 100` sem guard quando `income === 0`, o resultado seria `Infinity` ou `NaN` exibido na UI. O componente não foi lido integralmente — este Change Spec cobre tanto a verificação quanto a correção. Classificado como MÉDIO pois é condição de edge case (mês sem receita com despesas) mas exibir `Infinity%` é comportamento inaceitável.

**3. Escopo:**
- Ler `components/reports/ReportsView.tsx` e identificar todos os pontos de cálculo de percentual que dividem por `income`
- Adicionar guard: `income > 0 ? (category / income) * 100 : null` em cada divisor
- Exibir `—` ou `N/A` quando `income === 0` em vez de `Infinity` ou `NaN`

**4. Fora de escopo:**
- Redesign do layout de Relatórios
- Adição de novos tipos de percentual
- Cálculo de percentuais no servidor

**5. Critérios de aceite:**
- Dado mês com `income = 0` e `expense > 0` → quando página de Relatórios é carregada → então percentuais exibem `—` (ou equivalente) em vez de `Infinity` ou `NaN`
- Dado mês com `income > 0` → quando percentuais são exibidos → então valores são corretos (sem regressão)
- Dado mês sem nenhuma transação → quando página carrega → então exibe estado vazio sem erros de runtime

**6. Impacto técnico:**
- UI: sim — `components/reports/ReportsView.tsx`
- Server/API: não
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** baixo — guard defensivo; sem alteração de cálculo para o caminho normal.

**8. Testes:**
- Unitários: testar renderização do componente com dados `income=0, expense=500` → sem `Infinity`/`NaN` no output; com `income=1000` → percentuais corretos

**9. Versão:** **PATCH** — bugfix de edge case de cálculo na UI.

**10. Validação manual:**
1. Navegar para `/reports`, selecionar período sem receitas mas com despesas → verificar que percentuais exibem `—` em vez de `Infinity`
2. Selecionar período com receitas e despesas → verificar que percentuais continuam corretos

---

# CHANGE SPEC CS-11

**1. Título:** Definir valor inicial de --sidebar-width no CSS global para eliminar flash de layout

**2. Motivação:**  
`components/layout/Sidebar.tsx` L73–78 define a variável CSS `--sidebar-width` apenas dentro de `useEffect` após o mount do componente. No SSR e no primeiro render client-side (antes do hydration), a variável não tem valor definido no `:root`. O `main` em L85 usa `marginLeft: "var(--sidebar-width)"` — sem valor inicial, a margem é 0 no primeiro frame, causando um flash visual de layout quando `--sidebar-width` é setada no useEffect. Nota: em testes browser o flash não foi visível nesse ambiente específico (N-01 passou em browser), mas a anomalia estrutural permanece e pode se manifestar em conexões lentas ou SSR. Classificado como MÉDIO pelo potencial de regressão em produção.

**3. Escopo:**
- Adicionar `--sidebar-width: 220px` no CSS global (`:root` em `globals.css` ou equivalente) como valor padrão

**4. Fora de escopo:**
- Refatoração do mecanismo de colapso de sidebar
- Persistência do estado collapsed/expanded entre sessões (cookie/localStorage)
- Animações de transição da sidebar

**5. Critérios de aceite:**
- Dado SSR da página → quando HTML inicial chega ao browser → então `--sidebar-width` já tem valor `220px` definido no `:root`
- Dado sidebar no estado padrão (expandida) → quando página é carregada → então `main` tem `marginLeft: 220px` desde o primeiro frame (sem flash)
- Dado sidebar colapsada (pelo useEffect) → quando `--sidebar-width` é atualizada para `60px` → então transição é suave sem flash reverso

**6. Impacto técnico:**
- UI: sim — CSS global; `globals.css` ou equivalente
- Server/API: não
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** baixo — adição de valor padrão CSS; sem quebra de comportamento existente.

**8. Testes:**
- Unitários: verificar presença de `--sidebar-width` no `:root` do CSS gerado

**9. Versão:** **PATCH** — bugfix de CSS/layout.

**10. Validação manual:**
1. Abrir app em conexão simulada lenta (DevTools → Network throttling 3G) → verificar que sidebar não pisca/salta ao carregar
2. Verificar via DevTools → Computed Styles que `--sidebar-width` tem valor antes do JS executar (em View Page Source, antes de JS)

---

# CHANGE SPEC CS-12

**1. Título:** Incluir exclusão de PillProgress no cascade delete de usuário via adminDeleteUser

**2. Motivação:**  
`app/studio/actions.ts` `adminDeleteUser()` L53–65 deleta `Transaction`, `Tag`, `Budget`, `Goal`, `Liability`, `Institution`, `Asset`, `Settings` e `User`, mas **omite** `PillProgress`. O plano ST-07 explicitamente lista `PillProgress` como tabela que deve ser limpa. Após `adminDeleteUser`, registros órfãos de `PillProgress` permanecem no banco apontando para um `userId` inexistente. Embora o schema não tenha FK com cascade para esta tabela (ou o cascade não foi configurado), o dado fica orphaned e poderia interferir se o userId fosse reutilizado. Classificado como BAIXO pois o sistema é single-user e `adminDeleteUser` é operação administrativa infrequente.

**3. Escopo:**
- Adicionar `await db.pillProgress.deleteMany({ where: { userId } });` em `adminDeleteUser()` antes da chamada `db.user.delete()`

**4. Fora de escopo:**
- Verificação de outras tabelas órfãs além de PillProgress
- Alteração do schema para adicionar FK cascade em PillProgress
- Soft-delete de usuários

**5. Critérios de aceite:**
- Dado usuário com PillProgress registrado → quando `adminDeleteUser()` é chamada → então todos os registros de `PillProgress` do userId são removidos do banco
- Dado usuário sem PillProgress → quando `adminDeleteUser()` é chamada → então operação completa sem erro (deleteMany com 0 rows é safe)

**6. Impacto técnico:**
- UI: não
- Server/API: sim — `app/studio/actions.ts`, `adminDeleteUser()`
- Banco/Schema: não — apenas uma instrução DELETE adicional
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** baixo — adição de uma instrução DELETE; sem impacto em fluxo de dados do usuário final.

**8. Testes:**
- Unitários: testar `adminDeleteUser()` com usuário que tem PillProgress → verificar que registros são removidos do banco após a chamada

**9. Versão:** **PATCH** — bugfix de integridade referencial no Studio.

**10. Validação manual:**
1. No Studio, criar usuário de teste e concluir 1 pílula educacional com ele
2. Deletar o usuário via Studio
3. Verificar no banco que nenhum registro de `PillProgress` com o userId deletado permanece

---

# CHANGE SPEC CS-13

**1. Título:** Implementar "Lembrar de mim" funcional e preservar rota original no redirect pós-login

**2. Motivação:**  
Dois itens de UX de autenticação classificados como BAIXO mas relacionados:  
(a) A-17: `lib/session.ts` L11 `maxAge: MAX_AGE` (30 dias) é sempre aplicado independente do checkbox "Lembrar de mim". O checkbox existe na UI mas não tem efeito diferenciado — violação de expectativa do usuário (WAHH: não enganar o usuário sobre o comportamento do sistema).  
(b) A-18: `app/(app)/layout.tsx` L11 redireciona para `/login` sem preservar a rota original. Após login, `app/login/actions.ts` sempre redireciona para `/dashboard`. Usuário que tentava acessar `/health` é enviado para `/dashboard` — fluxo interrompido sem necessidade.

**3. Escopo:**
- `lib/session.ts` `setSession()`: aceitar parâmetro `remember: boolean`; se `false`, omitir `maxAge` (session cookie — expira ao fechar browser); se `true`, manter `maxAge: MAX_AGE`
- `app/login/actions.ts`: passar `remember` para `setSession()` baseado no campo do formulário
- `app/(app)/layout.tsx`: ao redirecionar para `/login`, preservar a rota original como query param `?redirect=<path>`
- `app/login/actions.ts`: após autenticação bem-sucedida, ler `?redirect` e redirecionar para a rota original em vez de `/dashboard`

**4. Fora de escopo:**
- Implementação de refresh tokens
- Logout automático por inatividade
- Configuração de maxAge por administrador

**5. Critérios de aceite:**
- Dado checkbox "Lembrar de mim" desmarcado → quando login é feito → então o cookie `lyfx_session` não tem `Max-Age` (session cookie)
- Dado checkbox "Lembrar de mim" marcado → quando login é feito → então o cookie tem `Max-Age: 2592000` (30 dias)
- Dado usuário tentando acessar `/health` sem sessão → quando redirecionado para login → então URL é `/login?redirect=/health`
- Dado login bem-sucedido com `?redirect=/health` → então usuário é redirecionado para `/health`
- Dado login sem `?redirect` → então usuário vai para `/dashboard` (comportamento atual mantido)

**6. Impacto técnico:**
- UI: sim — formulário de login precisa enviar campo `remember`; `app/(app)/layout.tsx`
- Server/API: sim — `lib/session.ts`, `app/login/actions.ts`
- Banco/Schema: não
- Auth/Sessão: sim — comportamento do cookie muda condicionalmente
- Cálculos/Comportamento central: não

**7. Risco:** baixo — mudanças de UX na autenticação; zero impacto em dados do usuário.

**8. Testes:**
- Unitários: testar `setSession(userId, false)` → cookie sem maxAge; `setSession(userId, true)` → cookie com maxAge
- Integração: login sem lembrar → fechar e reabrir browser → deve pedir login novamente; login com lembrar → persiste

**9. Versão:** **MINOR** — novo comportamento funcional (redirect preservation) + melhoria do "Lembrar de mim".

**10. Validação manual:**
1. Fazer login com "Lembrar de mim" desmarcado → inspecionar cookie no DevTools → sem `Max-Age`
2. Fazer login com "Lembrar de mim" marcado → inspecionar cookie → `Max-Age: 2592000`
3. Sem sessão, acessar `/health` → deve redirecionar para `/login?redirect=%2Fhealth` → fazer login → deve cair em `/health`

---

# CHANGE SPEC CS-14

**1. Título:** Correções de UX: pluralização de parcelas, confirmação de exclusão, fechamento de ActionBar e destaque do mês atual no MonthPicker

**2. Motivação:**  
Quatro itens de UX de baixa severidade descobertos em browser, agrupados por compartilharem o mesmo nível de risco e impacto:  
(a) T-11-B: Botão de parcelamento exibe "Criar 1 parcelas" (plural errado) e hint "Serão criadas 1 transações mensais" — texto gramaticalmente incorreto prejudica percepção de qualidade do produto.  
(b) T-22/T-23-B: Exclusão de transações (avulsas e em grupo) ocorre imediatamente sem diálogo de confirmação — exclusão irreversível sem aviso. Risco de exclusão acidental confirmado em browser (M-10 acidentalmente deletado durante M-13).  
(c) T-19-B: ActionBar de transação não fecha ao clicar fora — requer clique explícito no ×. Comportamento inconsistente com padrão de dropdowns/popovers do app (UserMenu fecha ao clicar fora, CT-05 confirmado).  
(d) CT-01: MonthPicker não destaca o mês atual — todos os meses têm o mesmo estilo visual. Feature ausente confirmada em browser 24/05/2026.

**3. Escopo:**
- `TransactionForm.tsx`: pluralizar dinamicamente "parcela"/"parcelas" e "transação"/"transações" baseado no valor de `count`
- `TransactionList.tsx` (ou onde vive o ActionBar): adicionar diálogo de confirmação antes de `deleteTransaction()` e `deleteInstallmentGroup()` — texto: "Deletar esta transação? Esta ação não pode ser desfeita." e "Excluir todas as {N} parcelas? Esta ação não pode ser desfeita."
- `TransactionList.tsx`: adicionar listener de clique fora para fechar o ActionBar ativo (padrão `useEffect` + `document.addEventListener('click', handler)`)
- `components/transactions/MonthPicker.tsx` (ou equivalente): adicionar destaque visual (ex: borda ou background cyan) para o mês correspondente a `new Date().getMonth()` e `new Date().getFullYear()`

**4. Fora de escopo:**
- Undo/redo após exclusão
- Animações de transição do ActionBar
- Seleção múltipla de transações para exclusão em lote

**5. Critérios de aceite:**
- Dado count = 1 → quando rótulo do botão é exibido → então lê "Criar 1 parcela" (singular)
- Dado count = 3 → quando rótulo é exibido → então lê "Criar 3 parcelas" (plural)
- Dado clique em excluir transação → quando diálogo aparece → então deve conter botão "Cancelar" e "Confirmar exclusão"; apenas após "Confirmar" a exclusão ocorre
- Dado ActionBar aberto → quando clique fora do container ActionBar ocorre → então ActionBar fecha automaticamente
- Dado MonthPicker aberto no mês mai/2026 → quando meses são exibidos → então "Maio" tem destaque visual diferenciado dos demais

**6. Impacto técnico:**
- UI: sim — `TransactionForm.tsx`, `TransactionList.tsx`, `MonthPicker.tsx`
- Server/API: não
- Banco/Schema: não
- Auth/Sessão: não
- Cálculos/Comportamento central: não

**7. Risco:** baixo — mudanças de UI; sem impacto em lógica de dados. Diálogo de confirmação altera o fluxo de exclusão mas não o resultado final.

**8. Testes:**
- Unitários: testar pluralização com count=1 → "parcela"; count=2 → "parcelas"
- E2E: clicar em excluir transação → confirmar que modal aparece; clicar "Cancelar" → transação permanece; clicar "Confirmar" → transação removida
- E2E: abrir ActionBar → clicar fora → verificar que fecha sem navegar
- E2E: abrir MonthPicker → verificar que mês atual tem estilo diferenciado

**9. Versão:** **PATCH** — correções de UX e texto; sem breaking change.

**10. Validação manual:**
1. Abrir formulário de parcelamento e digitar "1" → verificar "Criar 1 parcela" (singular) e "Será criada 1 transação mensal"
2. Clicar em excluir qualquer transação → verificar que diálogo de confirmação aparece antes da exclusão
3. Abrir ActionBar de qualquer transação → clicar em área fora do ActionBar → verificar que fecha automaticamente
4. Abrir MonthPicker → verificar que o mês atual (maio/2026) está visualmente destacado em relação aos demais

---

*Change Specs gerados pelo Agent Smith v9.0 · 14 specs · 24/05/2026*  
*Cobrindo: Autenticação (CS-01, CS-02, CS-09, CS-13) · Transações (CS-03, CS-04, CS-06, CS-14) · Metas (CS-05) · Tags (CS-07) · Alertas (CS-08) · Relatórios (CS-10) · Layout (CS-11) · Studio (CS-12)*
