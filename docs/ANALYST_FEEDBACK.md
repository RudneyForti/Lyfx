# Lyfx — Análise Estratégica e Roadmap de Produto
> Documento de referência para desenvolvimento · Compilado em 20/05/2026  
> Baseado em análise da v1.3.1 + referencial bibliográfico de finanças comportamentais

---

## Índice

1. [Contexto e Filosofia](#1-contexto-e-filosofia)
2. [Estado Atual — O que está correto](#2-estado-atual--o-que-está-correto)
3. [Falhas e Inconsistências Identificadas](#3-falhas-e-inconsistências-identificadas)
4. [Roadmap de Evoluções Prioritárias](#4-roadmap-de-evoluções-prioritárias)
5. [Funcionalidades Sugeridas](#5-funcionalidades-sugeridas)
6. [Síntese Executiva](#6-síntese-executiva)
7. [Base de Conhecimento — Referencial Bibliográfico](#7-base-de-conhecimento--referencial-bibliográfico)

---

## 1. Contexto e Filosofia

O Lyfx foi concebido a partir de um problema real e recorrente na vida financeira de pessoas que ganham entre 2 e 5 salários mínimos no Brasil: **o ralo maior que a torneira**. Aumentar a renda sem controlar o consumo e a estrutura de dívidas não resolve — e a maioria dos apps de finanças pessoais não oferece o diagnóstico necessário para perceber isso.

A premissa central do produto — aplicar o DRE empresarial às finanças pessoais — é a diferenciação correta. Não basta registrar. É preciso diagnosticar.

### O problema que a plataforma resolve

A maioria das ferramentas disponíveis ao consumidor funciona como um extrato bancário digital. O Lyfx vai além ao organizar cada lançamento em uma taxonomia com semântica financeira precisa, calculando margens intermediárias que revelam **em qual camada o dinheiro desaparece**.

### Princípio comportamental central

Pessoas que enfrentam dificuldades financeiras frequentemente praticam **evitação de dor financeira** — o cérebro evita olhar para números que causam desconforto. O design da plataforma deve sistematicamente combater esse mecanismo: tornando o invisível visível, sem punir o usuário pelo que ele vê.

> *"O comportamento financeiro não muda com vergonha, muda com sistemas."*  
> — Morgan Housel, A Psicologia Financeira

---

## 2. Estado Atual — O que está correto

A análise da v1.3.1 identificou os seguintes pontos como bem implementados e alinhados ao referencial teórico:

### ✅ Taxonomia de categorias (coração do produto)

As 9 categorias — especialmente a distinção entre `debit_committed` (comprometido), `debit_longterm` (longo prazo), `debit_seasonal` (sazonal) e `debit_unexpected` (imprevisível) — é o diferencial da plataforma. Nenhum app popular do mercado brasileiro faz essa separação com essa granularidade.

**Referência:** Ramit Sethi distingue em *Como Ficar Rico* quatro cestos de destino da renda. A taxonomia do Lyfx vai além, identificando também o *perfil temporal* de cada saída.

### ✅ DRE em cascata com margens intermediárias

O DRE não exibe apenas totais por categoria — calcula margens intermediárias progressivas:

```
Receita Total
  − Despesas Fixas         → Sobra após Fixos
  − Despesas Variáveis     → Margem Operacional
  − Comprometimentos       → Resultado Operacional
  − Demais despesas        → Resultado Líquido
```

Isso transforma a lista de gastos em diagnóstico estruturado. O usuário consegue ver exatamente em qual camada o dinheiro está "desaparecendo".

### ✅ Módulo de Passivos com modo Recuperação

A entidade `Liability` com taxa de juros, saldo devedor e pagamento mínimo resolve a lacuna mais crítica da v0.1. O **alerta "mínimo não cobre os juros"** é a implementação mais precisa e importante do produto — identifica a situação financeiramente mais destrutiva que existe.

O **método avalanche** com calculadora de pagamento extra está alinhado com a literatura:

> *"Matematicamente, vale mais a pena começar pelo cartão que lhe custa mais [maior taxa]. O objetivo não é otimizar sua estratégia, mas simplesmente dar o pontapé inicial."*  
> — Ramit Sethi, Como Ficar Rico

### ✅ Score de Saúde Financeira em 4 dimensões

As 4 dimensões — Comprometimento (30pts), Poupança (25pts), Resultado (25pts) e Reserva (20pts) — e os 4 perfis evolutivos (Em Recuperação → Estabilizado → Em Construção → Livre) criam uma **régua de progresso** que o usuário consegue acompanhar ao longo do tempo.

O `lib/health.ts` como função pura separada da camada de dados é uma decisão arquitetural madura e testável.

### ✅ Sistema de Metas com viabilidade baseada em dados reais

Calcular a viabilidade da meta com base na sobra média dos últimos 3 meses — e exibir a classificação "Cabe folgado / Factível / Apertado / Inviável" — implementa o conceito de comprometimento prévio documentado por Ariely:

> *"Um estudo descobriu que um grupo que restringiu suas contas bancárias — optou por ter dinheiro automaticamente depositado em uma conta de poupança — aumentou o saldo de sua poupança em 81% no período de um ano."*  
> — Dan Ariely & Jeff Kreisler, A Psicologia do Dinheiro

### ✅ Parcelamento com integridade

`installmentGroupId`, `installmentNumber` e `installmentTotal` garantem que cada parcela apareça no mês correto tanto no histórico quanto nas projeções. Isso resolve o problema da "surpresa mensal" causada por parcelamentos invisíveis.

### ✅ Provisão sazonal automática

A sugestão automática de provisão em `/fixed-expenses` resolve o gasto sazonal que virava surpresa. IPVA, seguro, IPTU — todos previsíveis, mas tratados como imprevistos pela maioria das pessoas.

### ✅ Budget com receita esperada como âncora

O campo `expectedMonthlyIncome` em `Settings` e as 4 seções do BudgetView alinham-se ao "Plano Consciente de Gastos" do Ramit Sethi: o orçamento deve ser construído sobre a receita fixa, não sobre a variável.

### ✅ Isolamento multi-usuário auditado (v1.3.1)

`userId` em todas as tabelas, `requireAuth()` em todos os Server Actions, `deleteMany` em vez de `delete`, IDOR em `markPayment` corrigido. A plataforma está pronta para SaaS.

---

## 3. Falhas e Inconsistências Identificadas

### 🔴 CRÍTICO — Score de Reserva usa proxy inferido

**Problema:** A dimensão Reserva do score usa o acumulado all-time de lançamentos `debit_longterm` como proxy da reserva de emergência. Isso pressupõe que todo dinheiro alocado intencionalmente ainda está disponível como liquidez — o que raramente é verdade. O valor pode ter sido usado, estar em investimentos ilíquidos ou simplesmente nunca ter existido como reserva.

**Consequência:** o usuário pode ver um score de Reserva alto enquanto, na prática, não tem liquidez alguma para emergências. Isso cria uma **falsa sensação de segurança** — um dos vieses mais perigosos documentados por Kahneman.

**Solução proposta:**
- Adicionar campo `reserveBalance: Float` na tabela `Settings`
- O usuário declara explicitamente o valor atual da sua reserva líquida
- O score usa esse valor declarado em vez do proxy inferido
- Interface: campo simples na página `/health` ou `/profile` — *"Qual é o valor atual da sua reserva de emergência (em conta de fácil acesso)?"*

> *"O ideal é que [a reserva] possa cobrir entre 6 e 12 meses de gastos. Deve estar em produto com liquidez diária — CDB, fundo de investimento ou Tesouro Direto — pois você pode precisar de acesso imediato."*  
> — Ramit Sethi, Como Ficar Rico

---

### 🔴 CRÍTICO — Alerta de passivo crítico não é proativo

**Problema:** A situação mais urgente da plataforma — **passivo cujo pagamento mínimo não cobre os juros** — aparece apenas no card individual em `/liabilities`. O usuário precisa navegar até lá para ver. Não há alerta proativo no módulo de Alertas.

**Consequência:** o ralo mais caro fica invisível para quem não acessa a página de passivos regularmente — exatamente o perfil do usuário com dificuldades financeiras, que pratica evitação.

**Solução proposta:**
- Novo tipo de alerta: `liability_critical` — severidade **danger**
- Condição: qualquer `Liability` onde `minimumPayment < balance × (interestRate / 100)`
- Texto: *"[Nome da dívida]: o pagamento mínimo não cobre os juros. Esta dívida nunca será quitada no ritmo atual."*
- Prioridade: deve aparecer **antes** de todos os outros alertas no agrupamento por severidade
- Link: direciona para `/liabilities`

---

### 🟡 MÉDIO — Módulo de Educação sem conteúdo estruturado

**Problema:** A rota `/education` existe na arquitetura mas não tem conteúdo implementado além da estrutura. Para uma plataforma direcionada a pessoas que sofrem de evitação financeira, o onboarding educacional é o mecanismo de mudança comportamental — não é feature decorativa.

**Referência comportamental:**

> *"Pessoas que entendem por que um comportamento é prejudicial mudam mais facilmente do que as que simplesmente são instruídas a mudar."*  
> — Dan Ariely, Previsivelmente Irracional

**Solução proposta:** estruturar o conteúdo em torno dos perfis do score de saúde. O conteúdo segue o usuário na jornada:

| Perfil | Conteúdo prioritário |
|---|---|
| Em Recuperação (0–39) | Método avalanche, cheque especial, rotativo de cartão, orçamento base zero |
| Estabilizado (40–59) | Provisão sazonal, reserva de emergência, como parar de usar cheque especial |
| Em Construção (60–79) | Investimento inicial, composição de juros, metas de médio prazo |
| Livre (80–100) | Diversificação, planejamento de longo prazo, patrimônio |

---

### 🟡 MÉDIO — Relatórios sem benchmarking contextual

**Problema:** Os Relatórios exibem percentuais de cada categoria sobre a receita. O usuário vê "alimentação: 18% da receita" mas não sabe se isso é adequado ou excessivo — não há referência.

**Solução proposta:** exibir ao lado de cada categoria uma faixa de referência baseada na literatura:

| Categoria | Referência sugerida |
|---|---|
| Fixos totais | ≤ 50–60% da receita |
| Variáveis totais | ≤ 20–35% da receita |
| Comprometidos (dívidas) | ≤ 20% = saudável · > 40% = crítico |
| Alocação intencional | ≥ 10–20% da receita |

Exibir um badge simples: 🟢 dentro da faixa · 🟡 atenção · 🔴 acima do recomendado.

> *"Então, se tiver ganhado 100 reais: 60 para custos fixos, 10 para aposentadoria, 10 para investimentos e 20 para gastos livres."*  
> — Ramit Sethi, Como Ficar Rico

---

### 🟡 MÉDIO — Plano Mensal subutilizado

**Problema:** `/planning` é descrito apenas como *"calendário visual dos lançamentos do mês corrente"*. Para um produto com DRE sofisticado e projeções de 12 meses, o planejamento mensal está aquém do potencial.

**Referência comportamental:** Ariely documenta que a visualização temporal reduz a dor do pagamento futuro — quando o usuário vê o dia 15 com três saídas grandes, não é surpreendido no dia 15.

**Solução proposta:**
- Mostrar não apenas transações já lançadas, mas **compromissos projetados** para o mês (recorrências e parcelas)
- Destacar **dias críticos**: dias com múltiplas saídas simultâneas
- Indicar dias de fechamento e vencimento de faturas (quando instituições/contas estiverem cadastradas)
- Saldo projetado dia a dia: quanto o usuário terá disponível em cada dia do mês

---

### 🟡 BAIXO — Instituições sem reconciliação de saldo

**Problema:** O saldo das contas em `/institutions` é declarado manualmente pelo usuário. Não há conexão entre as transações vinculadas a uma conta e o saldo exibido. O saldo pode estar desatualizado sem que o usuário perceba.

**Solução de curto prazo:**
- Exibir no card da conta, em texto secundário: *"Movimentação registrada este mês: R$ X"* (soma das transações vinculadas àquela conta no período atual)
- Não substitui o saldo declarado, mas adiciona contexto

**Solução de médio prazo:** resolvida com a importação OFX/CSV — quando implementada, deve atualizar o saldo da conta automaticamente.

---

## 4. Roadmap de Evoluções Prioritárias

### Fase F — Reserva declarada e alerta de passivo crítico
**Complexidade:** Baixa  
**Impacto:** Alto

- [ ] Adicionar `reserveBalance: Float @default(0)` em `Settings`
- [ ] Criar action `updateReserveBalance(amount)` em `actions/settings.ts`
- [ ] Atualizar `computeHealthScore()` em `lib/health.ts` para usar `reserveBalance` em vez do proxy
- [ ] Adicionar campo de entrada na página `/health` — *"Reserva de emergência disponível"*
- [ ] Adicionar tipo `liability_critical` no módulo de Alertas
- [ ] Implementar lógica de detecção em `actions/alerts.ts`: `minimumPayment < balance × (interestRate / 100)`
- [ ] Exibir alerta no topo do agrupamento `danger` em `/alerts`

---

### Fase G — Educação contextual por perfil
**Complexidade:** Média  
**Impacto:** Alto (diferencial comportamental do produto)

- [ ] Estruturar conteúdo em 4 blocos por perfil de saúde financeira
- [ ] Implementar renderização condicional baseada no perfil atual do score
- [ ] Para o perfil "Em Recuperação": conteúdo sobre avalanche, cheque especial e orçamento base zero
- [ ] Para "Estabilizado": provisão sazonal, reserva de emergência
- [ ] Para "Em Construção": composição, primeiros investimentos
- [ ] Para "Livre": diversificação e patrimônio
- [ ] Adicionar link contextual da `/education` no banner Tip da `/health`

---

### Fase H — Relatórios com benchmarking
**Complexidade:** Baixa  
**Impacto:** Médio

- [ ] Definir faixas de referência por categoria em `lib/categories.ts` (campo `benchmark: { min, max, label }`)
- [ ] No componente de Relatórios, calcular percentual sobre receita por categoria
- [ ] Exibir badge de status (dentro/atenção/acima) ao lado de cada percentual
- [ ] Tooltip explicativo ao passar o mouse no badge

---

### Fase I — Plano Mensal aprimorado
**Complexidade:** Média  
**Impacto:** Médio

- [ ] Incluir transações recorrentes projetadas para o mês no calendário (além das já lançadas)
- [ ] Calcular e exibir saldo projetado dia a dia
- [ ] Destacar visualmente dias com saídas simultâneas acima da média
- [ ] Diferenciar visualmente transações realizadas vs projetadas

---

### Fase J — Onboarding guiado (novo usuário)
**Complexidade:** Média  
**Impacto:** Alto (redução de fricção na aquisição)

- [ ] Detectar primeiro login (ausência de transações + `Settings` sem `expectedMonthlyIncome`)
- [ ] Exibir wizard de 3 etapas:
  - Etapa 1: *"Qual é a sua renda mensal líquida?"* → preenche `expectedMonthlyIncome`
  - Etapa 2: *"Você tem dívidas ativas?"* → se sim, redireciona para criar o primeiro passivo
  - Etapa 3: *"Qual é o seu objetivo principal?"* (opções: Sair das dívidas / Criar reserva / Investir) → direciona para o módulo mais relevante
- [ ] Possibilidade de pular o wizard a qualquer momento

> *"A arquitetura de escolha — facilitar a decisão certa sem eliminar a autonomia — é uma das ferramentas mais poderosas da economia comportamental."*  
> — Dan Ariely, Previsivelmente Irracional

---

### Fase K — Importação OFX/CSV
**Complexidade:** Alta  
**Impacto:** Alto (maior redutor de fricção no uso contínuo)

- [ ] Parser de OFX (formato padrão dos bancos brasileiros: Nubank, Inter, Itaú, Bradesco, BB)
- [ ] Parser de CSV com mapeamento configurável de colunas
- [ ] Interface de revisão pré-importação: o usuário vê os lançamentos antes de confirmar
- [ ] Sugestão automática de categoria baseada na descrição da transação (matching por palavras-chave)
- [ ] Detecção de duplicatas (mesma data + mesmo valor + mesma descrição)
- [ ] Atualização automática do saldo da conta vinculada após importação

---

### Fase L — Relatórios comparativos temporais
**Complexidade:** Média  
**Impacto:** Médio

- [ ] Visão comparativa de 3, 6 ou 12 meses
- [ ] Evolução percentual de cada categoria mês a mês
- [ ] Evolução do score de saúde ao longo do tempo (gráfico de linha)
- [ ] Comparativo de resultado líquido mês a mês
- [ ] Destaque para a dimensão do score que mais evoluiu no período

---

## 5. Funcionalidades Sugeridas

### 5.1 Simulador de quitação antecipada

Na página de passivos, permitir que o usuário simule quanto economizaria em juros ao quitar uma dívida antecipadamente. Input: valor disponível para quitação. Output: economia total de juros, meses eliminados, data de quitação antecipada vs data atual.

**Referência:** Ramit Sethi demonstra em *Como Ficar Rico* que pagar R$ 100 a mais por mês em uma dívida pode reduzir o prazo de quitação em anos e economizar milhares em juros.

---

### 5.2 Alerta de rotativo de cartão

Quando uma fatura de cartão for registrada mas o valor não for coberto pela sobra do mês, exibir alerta proativo estimando o custo do rotativo. Tornar visível o que o cérebro prefere ignorar.

**Texto sugerido:** *"Se não pagar a fatura do [Cartão X] integralmente (R$ 2.000), o rotativo aplicará aproximadamente R$ 400 em juros no próximo mês."*

---

### 5.3 Meta de quitação como objetivo financeiro

Permitir criar uma Meta com tipo `debt_payoff` vinculada a um Passivo. O sistema calcula automaticamente o valor mensal necessário para quitar a dívida em N meses (configurável) e cria os GoalPayments correspondentes. Ao marcar o GoalPayment como pago, o saldo devedor do passivo é atualizado automaticamente.

Isso fecha o loop entre Metas e Passivos — o dois módulos mais críticos para usuários em recuperação.

---

### 5.4 Score de contexto "profissional vs pessoal"

Transações têm o campo `context: "personal" | "professional"`. Atualmente esse dado é coletado mas não aproveitado analiticamente. Sugestão: no módulo de Relatórios, oferecer breakdown do DRE separado por contexto — especialmente útil para autônomos e profissionais liberais que misturam gastos pessoais e profissionais na mesma conta.

---

## 6. Síntese Executiva

| Área | v0.1 | v1.3.1 | Próximo |
|---|---|---|---|
| DRE com margens intermediárias | 🔴 Ausente | ✅ Implementado | — |
| Passivos com modo Recuperação | 🔴 Ausente | ✅ Completo | Meta de quitação vinculada |
| Parcelamento com integridade | 🟡 Parcial | ✅ Correto | — |
| Score de Saúde Financeira | 🔴 Ausente | ✅ 4 dimensões | Reserva declarada (Fase F) |
| Budget com receita esperada | 🔴 Ausente | ✅ Implementado | Benchmarking (Fase H) |
| Provisão sazonal | 🔴 Ausente | ✅ Automática | — |
| Reembolsos com tracking | 🟡 Incompleto | ✅ Completo | — |
| Isolamento multi-usuário | 🔴 Ausente | ✅ Auditado | — |
| Instituições e Bens | 🔴 Ausente | ✅ Implementados | Reconciliação de saldo |
| Alertas proativos | 🔴 Ausente | ✅ 4 tipos | Alerta passivo crítico (Fase F) |
| Reserva de emergência | 🔴 Ausente | 🟡 Proxy inferido | **Reserva declarada — Fase F** |
| Educação contextual | 🔴 Ausente | 🟡 Estrutura sem conteúdo | **Por perfil de score — Fase G** |
| Onboarding guiado | 🔴 Ausente | 🔴 Ausente | **Wizard 3 etapas — Fase J** |
| Alerta de passivo crítico proativo | 🔴 Ausente | 🟡 Visível, não alertado | **Fase F** |
| Benchmarking nos relatórios | 🔴 Ausente | 🔴 Ausente | **Fase H** |
| Comparativo temporal | 🔴 Ausente | 🔴 Ausente | Fase L |
| Importação OFX/CSV | 🔴 Ausente | 🔴 Roadmap | Fase K |

**Prioridade de desenvolvimento sugerida:**

1. **Fase F** — Reserva declarada + alerta passivo crítico (alta prioridade, baixa complexidade)
2. **Fase G** — Educação contextual por perfil (diferencial comportamental do produto)
3. **Fase J** — Onboarding guiado (reduz fricção de aquisição)
4. **Fase H** — Benchmarking nos relatórios (baixa complexidade, alto valor)
5. **Fase K** — Importação OFX/CSV (maior esforço, maior impacto no uso contínuo)

---

## 7. Base de Conhecimento — Referencial Bibliográfico

Esta seção documenta os princípios teóricos que fundamentam as decisões de produto do Lyfx. Os conceitos abaixo devem orientar tanto as implementações futuras quanto o conteúdo da seção `/education`.

---

### 7.1 Evitação de dor financeira
**Fonte:** Dan Ariely & Jeff Kreisler — *A Psicologia do Dinheiro*; Daniel Kahneman — *Rápido e Devagar*

Quando olhar para os próprios números financeiros causa desconforto, o cérebro ativa um mecanismo de proteção e evita o contato com essa informação — da mesma forma que uma pessoa desvia o olhar de uma cena perturbadora. Esse fenômeno é documentado e previsível.

**Implicação de produto:** a interface do Lyfx nunca deve punir o usuário pelo que ele vê. Resultados negativos devem ser apresentados com contexto e com um caminho de ação claro. O objetivo é reduzir a fricção do "olhar", não aumentá-la.

---

### 7.2 Anestesia do crédito
**Fonte:** Dan Ariely — *Previsivelmente Irracional*

Quando o dinheiro chega de uma vez (empréstimo) e as parcelas parecem "administráveis", o cérebro não processa o custo real da operação. O usuário não sente o total de juros pagos ao longo dos anos — ele sente apenas a parcela mensal.

**Implicação de produto:** sempre exibir o **custo total** de uma dívida, não apenas a parcela. O módulo de Passivos deve tornar visível quanto o usuário pagará ao final — não apenas quanto paga por mês.

---

### 7.3 Dor do pagamento
**Fonte:** Dan Ariely & Jeff Kreisler — *A Psicologia do Dinheiro*

Pagar com dinheiro físico ativa muito mais "dor" do que pagar com cartão. Parcelamento, débito automático e cartão de crédito reduzem essa dor — o que facilita o consumo excessivo. A separação entre o momento do prazer (compra) e o momento do pagamento (fatura) é um mecanismo psicológico de engano.

**Implicação de produto:** o módulo de Transações deve tornar o custo real de cada parcelamento explícito no momento do lançamento — mostrando o total comprometido, não apenas a parcela registrada.

---

### 7.4 Contabilidade mental
**Fonte:** Richard Thaler — *Misbehaving*; Dan Ariely — *Previsivelmente Irracional*

Pessoas tratam dinheiro de formas diferentes dependendo da sua origem ou destino mental — dinheiro de bônus é "diferente" de salário, dinheiro para lazer é "diferente" de dinheiro para contas. Essa categorização mental é arbitrária e frequentemente prejudicial.

**Implicação de produto:** a taxonomia de categorias do Lyfx combate diretamente a contabilidade mental falha, substituindo categorias mentais subjetivas por categorias com semântica financeira precisa.

---

### 7.5 Ilusão do planejamento (Planning Fallacy)
**Fonte:** Daniel Kahneman — *Rápido e Devagar*

Pessoas sistematicamente subestimam o tempo, custo e risco de projetos futuros, enquanto superestimam os benefícios. Aplicado às finanças: subestimamos gastos variáveis, ignoramos sazonais e acreditamos que "o mês que vem será diferente".

**Implicação de produto:** o módulo de Projeções e a provisão sazonal automática são a resposta direta a esse viés — mostram o que está comprometido no futuro baseado em dados reais, não em otimismo.

---

### 7.6 Sistema 1 e Sistema 2
**Fonte:** Daniel Kahneman — *Rápido e Devagar*

O Sistema 1 é rápido, intuitivo e emocional. O Sistema 2 é lento, deliberativo e racional. A maioria das decisões financeiras ruins é feita pelo Sistema 1 — impulso, comparação social, disponibilidade imediata.

**Implicação de produto:** a ferramenta deve ativar o Sistema 2 no momento da decisão — não depois. O Lyfx Insight no Dashboard é um mecanismo de ativação do Sistema 2: força uma análise racional do estado financeiro antes que o usuário tome novas decisões.

---

### 7.7 Método Avalanche vs Bola de Neve
**Fonte:** Ramit Sethi — *Como Ficar Rico*; Dave Ramsey — *The Total Money Makeover*

**Avalanche:** pague o mínimo em todas as dívidas e aplique qualquer valor extra na dívida com **maior taxa de juros**. Matematicamente mais eficiente — minimiza o total de juros pagos.

**Bola de Neve:** pague o mínimo em todas as dívidas e aplique o extra na dívida com **menor saldo**. Psicologicamente mais motivador — gera vitórias rápidas.

O Lyfx implementa o método avalanche com a calculadora de pagamento extra. **Justificativa:** para o público-alvo (pessoas em recuperação financeira com dívidas de alto custo como cheque especial e rotativo), a eficiência matemática é prioritária — o custo de escolher a bola de neve pode ser de anos a mais de endividamento.

> *"Não passe mais do que cinco minutos decidindo. Escolha um método e o aplique. O objetivo não é otimizar sua estratégia, mas simplesmente dar o pontapé inicial."*  
> — Ramit Sethi, Como Ficar Rico

---

### 7.8 Reserva de emergência — liquidez como prioridade
**Fonte:** Ramit Sethi — *Como Ficar Rico*; Morgan Housel — *A Psicologia Financeira*; Vicki Robin & Joe Dominguez — *Your Money or Your Life*

Reserva de emergência não é poupança de longo prazo — é **liquidez imediata**. Deve estar em produto com resgate no mesmo dia (CDB com liquidez diária, conta remunerada, Tesouro Selic). O objetivo é cobrir de 3 a 6 meses de despesas essenciais.

A reserva não é construída "quando sobrar" — é a **primeira alocação** antes de qualquer investimento ou gasto discricionário. Sem ela, qualquer imprevisto destrói o progresso financeiro acumulado.

> *"Nem pense em investir enquanto estiver formando essa reserva."*  
> — Ramit Sethi, Como Ficar Rico

---

### 7.9 Automação como substituto da força de vontade
**Fonte:** Ramit Sethi — *Como Ficar Rico*; Dan Ariely — *A Psicologia do Dinheiro*

A força de vontade é um recurso finito e não confiável. Sistemas automáticos — débito programado, contribuições automáticas, pagamentos agendados — são superiores porque funcionam sem depender de decisão ativa repetida.

> *"Tornar as contribuições para poupança a opção automática e padrão [...] se apodera das armadilhas psicológicas que tornam os gastos automáticos tão preponderantes e as utiliza para nosso benefício."*  
> — Dan Ariely & Jeff Kreisler, A Psicologia do Dinheiro

**Implicação de produto:** o Lyfx deve sempre sugerir automação quando possível — pagamentos agendados, recorrências, provisões automáticas. A plataforma substitui a necessidade de disciplina por sistemas.

---

### 7.10 O tempo de vida como unidade de medida
**Fonte:** Vicki Robin & Joe Dominguez — *Your Money or Your Life*

A pergunta certa sobre qualquer gasto não é "posso pagar?" — é "vale o tempo de vida que trabalhei para ganhar esse dinheiro?". Ao traduzir o valor monetário em horas de trabalho, o custo real de cada decisão financeira se torna concreto.

**Implicação de produto:** funcionalidade futura sugerida — exibir ao lado de cada transação o equivalente em horas de trabalho baseado na renda horária do usuário. Isso ativa o Sistema 2 no momento do registro, tornando o custo real visceralmente perceptível.

---

### 7.11 Ilusão do fim da história
**Fonte:** Morgan Housel — *A Psicologia Financeira* (citando Daniel Gilbert, Harvard)

Pessoas tendem a acreditar que sua personalidade, desejos e objetivos não mudarão significativamente no futuro — mesmo sabendo que mudaram muito no passado. Isso leva a comprometimentos financeiros de longo prazo baseados em objetivos que podem não persistir.

**Implicação de produto:** o Lyfx não deve incentivar planejamentos excessivamente rígidos de longo prazo. Metas devem ser revisáveis. Comprometimentos futuros (parcelamentos longos, financiamentos de décadas) devem sempre mostrar o custo total e a data de quitação — tornando a irreversibilidade visível antes da decisão.

---

### 7.12 Composição de juros — a favor e contra o usuário
**Fonte:** Morgan Housel — *A Psicologia Financeira*; Robert Kiyosaki — *Pai Rico Pai Pobre*

Juros compostos são o mecanismo mais poderoso das finanças pessoais — e opera nos dois sentidos. A favor do usuário quando investido; contra o usuário quando em dívida. Uma dívida de R$ 60.000 que se torna R$ 214.000 ao longo de 9 anos é juros compostos trabalhando contra.

> *"A primeira regra da composição é jamais interrompê-la desnecessariamente."*  
> — Charlie Munger (citado por Morgan Housel)

**Implicação de produto:** o módulo de Passivos deve sempre exibir o custo total projetado da dívida — não apenas o saldo atual. A diferença entre o saldo devedor e o total que será pago é o argumento mais poderoso para motivar quitação antecipada.

---

### 7.13 Distinção entre ativo e passivo
**Fonte:** Robert Kiyosaki — *Pai Rico Pai Pobre*

**Ativo**: coloca dinheiro no bolso do usuário (imóvel alugado, investimento com rendimento, negócio lucrativo).  
**Passivo**: tira dinheiro do bolso do usuário (carro financiado, cartão de crédito rotativo, cheque especial).

A confusão entre os dois — tratar como ativo o que é passivo — é uma das principais causas de endividamento progressivo.

**Implicação de produto:** o módulo de Bens e Imóveis já implementa essa distinção ao exibir valorização vs desvalorização. O módulo de Passivos reforça essa lógica ao tornar o custo real das dívidas explícito. O score de saúde sintetiza: quanto mais passivos com juros altos, menor o score.

---

*Documento compilado com base em análise técnica da v1.3.1 e referencial bibliográfico de finanças comportamentais.*  
*Para referência técnica do schema, arquitetura e decisões de implementação, consultar DOCUMENTATION.md.*  
*Para descrição completa das funcionalidades atuais, consultar FEATURES.md.*
