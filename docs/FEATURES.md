# Lyfx — Guia Completo de Funcionalidades
> Documento de referência para análise financeira, QA e material instrucional
> Versão 1.3.1 · Maio 2026

---

## Índice

1. [Visão e Filosofia do Produto](#1-visão-e-filosofia-do-produto)
2. [Conceitos Financeiros Fundamentais](#2-conceitos-financeiros-fundamentais)
3. [Estrutura Geral da Plataforma](#3-estrutura-geral-da-plataforma)
4. [Módulos — Descrição Aprofundada](#4-módulos--descrição-aprofundada)
   - 4.1 [Landing Page](#41-landing-page)
   - 4.2 [Autenticação](#42-autenticação)
   - 4.3 [Dashboard](#43-dashboard)
   - 4.4 [Transações](#44-transações)
   - 4.5 [Orçamento](#45-orçamento)
   - 4.6 [Contas Fixas e Provisão Sazonal](#46-contas-fixas-e-provisão-sazonal)
   - 4.7 [Metas](#47-metas)
   - 4.8 [Projeções](#48-projeções)
   - 4.9 [Passivos](#49-passivos)
   - 4.10 [Alertas](#410-alertas)
   - 4.11 [Saúde Financeira](#411-saúde-financeira)
   - 4.12 [Relatórios](#412-relatórios)
   - 4.13 [Reembolsos](#413-reembolsos)
   - 4.14 [Tags](#414-tags)
   - 4.15 [Instituições](#415-instituições)
   - 4.16 [Bens e Imóveis](#416-bens-e-imóveis)
   - 4.17 [Plano Mensal](#417-plano-mensal)
   - 4.18 [Educação](#418-educação)
   - 4.19 [Perfil](#419-perfil)
   - 4.20 [Studio (Administração)](#420-studio-administração)
5. [Fluxos Transversais](#5-fluxos-transversais)
6. [Lista Completa de Ações — Guia de QA](#6-lista-completa-de-ações--guia-de-qa)

---

## 1. Visão e Filosofia do Produto

O **Lyfx** (pronunciado "life effects") é uma plataforma de controle financeiro pessoal construída sobre um princípio incomum no mercado de aplicativos financeiros: **não basta registrar, é preciso diagnosticar**.

A maioria das ferramentas disponíveis ao consumidor funciona como um extrato bancário digital — lista entradas e saídas e, no melhor dos casos, agrupa por categoria. O Lyfx vai além ao aplicar à vida financeira pessoal o mesmo rigor analítico que empresas utilizam no **DRE — Demonstração do Resultado do Exercício**. Esse instrumento contábil não apenas soma receitas e despesas; ele as organiza em camadas de análise que revelam a *qualidade* e a *saúde estrutural* do resultado.

### A premissa central

Cada real que entra ou sai da vida de uma pessoa carrega uma natureza diferente. Um salário e uma venda pontual são ambos receitas, mas têm previsibilidade completamente distintas. Um aluguel e uma consulta médica emergencial são ambos despesas, mas um é estrutural e o outro é imprevisível. Um financiamento de imóvel e um cartão de crédito rotativo são ambos dívidas, mas um é estratégico e o outro é destrutivo.

O Lyfx parte do princípio de que **entender a natureza de cada lançamento é mais valioso do que apenas somá-los**. Por isso, cada transação é classificada não apenas como receita ou despesa, mas pelo seu perfil: fixo, variável, comprometido, sazonal, intencional ou imprevisível. Esse perfil alimenta toda a camada analítica da plataforma.

### Para quem é

A plataforma foi concebida para a pessoa física que deseja sair da gestão reativa ("quanto gastei esse mês?") e entrar na gestão proativa ("onde estou comprometendo meu futuro? O que estou construindo?"). Não pressupõe conhecimento contábil, mas oferece ao usuário que quiser aprofundar-se uma visão genuinamente técnica do seu resultado financeiro.

### Modelo de usuários

O Lyfx suporta múltiplos usuários com isolamento completo de dados. Cada usuário vê exclusivamente seus próprios registros. A criação e gestão de usuários é realizada pelo administrador via painel Studio, que requer uma senha separada.

---

## 2. Conceitos Financeiros Fundamentais

Para entender o que o Lyfx oferece, é necessário compreender os conceitos que estruturam sua lógica interna. Esses conceitos são explícitos na interface e guiam toda a experiência do usuário.

### 2.1 A Taxonomia de Categorias

O coração analítico do Lyfx é seu sistema de categorização. Ao contrário de sistemas que usam categorias livres ou genéricas ("Alimentação", "Lazer"), o Lyfx usa uma taxonomia fechada com semântica financeira precisa.

#### Receitas

| Categoria | Significado | Exemplos |
|---|---|---|
| **Fixo** | Receita previsível, de valor e frequência estáveis | Salário mensal, pró-labore, aluguel recebido |
| **Variável** | Receita real mas sem garantia de repetição | Freelas, comissões, reembolsos recebidos, vendas pontuais |

A distinção entre receita fixa e variável é importante porque afeta o planejamento: o orçamento deve ser construído sobre a receita fixa, não sobre a variável.

#### Despesas

| Categoria | Significado | Exemplos | Por que importa |
|---|---|---|---|
| **Fixo** | Valor e frequência previsíveis | Aluguel, condomínio, assinaturas, mensalidades | Obrigações certas — saem independentemente do que aconteça |
| **Variável** | Frequência previsível, valor oscila | Alimentação, combustível, lazer, farmácia | Custo de vida recorrente com alguma governabilidade |
| **Comprometido** | Dívidas já assumidas, saídas certas | Parcelas de cartão, crédito pessoal em aberto | Dívida ativa que compromete a margem futura |
| **Longo Prazo** | Horizonte de anos, geralmente estratégico | Financiamento imobiliário, consignado | Compromisso de longo prazo — pode ser produtivo ou prejudicial |
| **Sazonal** | Previsível mas não mensal | IPVA, IPTU, seguro do carro, presente de natal, material escolar | Não aparece todo mês, mas é certo — requer provisão |
| **Imprevisível** | Emergências e imprevistos genuínos | Conserto urgente, tratamento médico emergencial | Não planejável — revela a necessidade de reserva de emergência |
| **Alocação Intencional** | Decisão consciente de destino do dinheiro | Reserva de emergência, quitação antecipada de dívida, investimento | Distingue gasto de construção de patrimônio |

### 2.2 O DRE em Cascata

O DRE aplicado às finanças pessoais no Lyfx funciona como uma cascata de deduções progressivas, onde cada camada revela uma margem diferente:

```
Receita Total
  − Despesas Fixas
  = SOBRA APÓS FIXOS          ← "Quanto sobra após pagar o que é certo?"

  − Despesas Variáveis
  = MARGEM OPERACIONAL        ← "Quanto sobra após o custo de vida do mês?"

  − Despesas Comprometidas
  = RESULTADO OPERACIONAL     ← "Quanto sobra após honrar todas as dívidas?"

  − Demais Despesas (sazonal, imprevisível, intencional)
  = RESULTADO LÍQUIDO         ← "Qual foi o saldo final real do mês?"
```

Cada margem intermediária permite um diagnóstico específico. Um resultado líquido positivo com margem operacional negativa, por exemplo, indica que o resultado positivo veio de alocações intencionais (que estão sendo contabilizadas como despesa), não de eficiência no custo de vida.

### 2.3 Recorrência e Projeção

O Lyfx distingue três tipos de frequência para transações:

- **Avulsa** ("once"): acontece uma única vez na data informada
- **Mensal** ("monthly"): repete todo mês; pode ter uma data de encerramento
- **Anual** ("yearly"): repete uma vez por ano; típico de despesas sazonais

Transações recorrentes alimentam automaticamente o módulo de Projeções, que simula os próximos 12 meses de compromissos já assumidos.

### 2.4 Parcelamento

Uma transação parcelada no Lyfx não é uma única entrada com campo "parcelas" — ela é criada como N registros individuais, cada um com sua data própria. Isso permite que cada parcela apareça corretamente no mês em que será paga, tanto no histórico de transações quanto nas projeções futuras.

### 2.5 Método Avalanche

Para a gestão de dívidas, o Lyfx implementa o **método avalanche** — a estratégia academicamente mais eficiente para quitação de múltiplas dívidas. O princípio é: pague o mínimo em todas as dívidas e direcione qualquer pagamento extra primeiro para a dívida com a **maior taxa de juros**. Isso minimiza o total de juros pagos ao longo do tempo.

### 2.6 Score de Saúde Financeira

O Lyfx calcula um score numérico de 0 a 100 que sintetiza a saúde financeira do usuário em quatro dimensões, cada uma com peso específico:

- **Comprometimento com dívidas** (30 pontos): quanto da receita está comprometida com pagamentos de dívidas
- **Taxa de poupança** (25 pontos): quanto da receita está sendo direcionado para construção de futuro
- **Resultado do período** (25 pontos): se o mês fechou positivo ou negativo
- **Reserva de emergência** (20 pontos): quanto tempo o usuário conseguiria se manter sem receita com o que já acumulou

---

## 3. Estrutura Geral da Plataforma

O Lyfx é organizado em três grandes áreas:

### Área Pública
- **Landing Page** (`/`): página de apresentação do produto
- **Login** (`/login`): formulário unificado de autenticação e cadastro

### Área do Usuário (requer login)
Toda a área do usuário tem um layout consistente:
- **Barra lateral** (esquerda): navegação entre os módulos, organizados em grupos temáticos (Principal, Planejamento, Análise, Aprender). Pode ser colapsada clicando no logo, mostrando apenas ícones com tooltips ao passar o mouse.
- **Menu do usuário** (canto superior direito, flutuante): pílula com avatar e nome do usuário. Abre dropdown com "Editar perfil" e "Sair". Persiste em todas as páginas sem interferir com o conteúdo.

### Área Administrativa
- **Studio** (`/studio`): painel de administração com senha própria, independente da sessão do usuário.

---

## 4. Módulos — Descrição Aprofundada

---

### 4.1 Landing Page

**Rota**: `/`  
**Acesso**: público (sem necessidade de login)

A landing page serve como vitrine do produto. Se o usuário já tem uma sessão ativa, é redirecionado diretamente para o Dashboard sem precisar ver a página de apresentação.

A página apresenta o produto em seções progressivas:

**Navbar** fixa no topo com âncoras para as seções principais e botão de acesso ao login.

**Hero**: apresentação central com o nome do produto, tagline e um mockup visual do dashboard. O objetivo é dar ao visitante uma visão imediata do que é a plataforma antes de qualquer explicação textual.

**Marquee**: faixa animada contínua com termos-chave do produto (DRE, Score de Saúde, Metas, Projeções, etc.), criando vocabulário antes da explicação.

**Cards de Features**: quatro cards com mini-mockups interativos ilustrando as principais capacidades (DRE, Score de Saúde, Metas, Projeções).

**Como Funciona**: seção em três passos que explica o fluxo básico: registrar transações → classificar por tipo → ler o diagnóstico.

**FAQ**: seis perguntas frequentes em formato accordion (abre/fecha ao clicar), respondendo dúvidas sobre o produto, sua gratuidade, privacidade dos dados e diferenciais.

**CTA Final**: chamada para ação com botão de acesso.

**Footer**: rodapé com informações gerais do produto.

---

### 4.2 Autenticação

**Rota**: `/login`  
**Acesso**: público

O sistema de autenticação funciona em dois modos distintos:

**Modo Setup** (primeiro acesso, sem usuário cadastrado no banco):  
Exibe um formulário de criação de conta com campos: nome, e-mail, senha e confirmação de senha. Este modo é exibido automaticamente quando o sistema detecta que ainda não existe nenhum usuário cadastrado.

**Modo Login** (usuário existente):  
Exibe campos de e-mail e senha, com opção "Lembrar de mim" e link "Esqueci minha senha".

**Alternância entre modos**: o usuário pode alternar entre os modos de login e setup manualmente, independentemente do estado do banco.

**Validações**:
- Todos os campos são obrigatórios
- Senha mínima de 6 caracteres
- No modo setup, a confirmação de senha deve ser idêntica à senha
- Botão de submit "treme" (animação shake) quando há erros de validação

**Modal "Esqueci minha senha"**: ao clicar no link, abre um modal explicando que o Lyfx não envia e-mails de recuperação. A orientação é acessar o perfil para redefinir a senha, ou contatar o administrador que pode redefinir via Studio.

**Feedback visual de sucesso**: após login bem-sucedido, o botão muda para verde com ícone de confirmação antes de redirecionar.

**Acesso ao Studio**: link discreto na parte inferior da tela de login ("Acessar Studio"), para que o administrador acesse o painel sem precisar usar a conta normal.

**Botão Início**: navega de volta para a landing page.

**Painel decorativo esquerdo**: área visual com grade de pontos animada, watermark do produto, KPIs decorativos estáticos e o mês atual exibido.

---

### 4.3 Dashboard

**Rota**: `/dashboard`  
**Acesso**: requer login

O Dashboard é o centro de comando financeiro do período atual. Foi concebido não como um painel de monitoramento passivo, mas como um instrumento de diagnóstico ativo.

#### KPI Cards

Quatro métricas imediatas no topo da página:

- **Saldo**: o resultado líquido do mês — receita total menos todas as despesas. Exibido em verde quando positivo, vermelho quando negativo. É a métrica mais sintética: o mês foi bom ou ruim?

- **Receita**: soma de todos os créditos do mês, independentemente do tipo (fixo ou variável). Mostra o total que entrou.

- **Gastos**: soma de todas as despesas do mês. Mostra o total que saiu.

- **Poupado**: soma dos lançamentos classificados como "Alocação de Longo Prazo" (debit_longterm). Representa o que foi conscientemente direcionado para construção de futuro — reserva, investimento, quitação antecipada. É a métrica que responde "o que estou construindo?".

#### DRE em Cascata

A peça central do dashboard. O DRE exibe as transações do mês agrupadas pelas categorias da taxonomia, com três margens intermediárias calculadas progressivamente:

1. **Sobra após fixos**: resultado depois de deduzir as despesas fixas da receita. Mostra o que sobra depois de pagar o que é certo — o piso financeiro do mês.

2. **Margem operacional**: resultado depois de deduzir também as despesas variáveis. Mostra o que sobra depois do custo de vida completo.

3. **Resultado operacional**: resultado depois de deduzir também os comprometimentos (dívidas em aberto). Mostra o quanto realmente está disponível depois de honrar todas as obrigações.

Cada margem é exibida com um badge colorido (verde/vermelho) inline na linha de separação correspondente. Isso transforma a lista de gastos em um diagnóstico estruturado: é possível ver exatamente em qual camada o dinheiro está "desaparecendo".

#### Lyfx Insight

Banner contextual gerado automaticamente com base em regras de prioridade sobre o estado financeiro do mês:

1. Se o resultado é negativo → alerta com o valor do deficit ("Você gastou R$ X mais do que recebeu este mês")
2. Se o comprometimento com dívidas supera 35% da receita → alerta de comprometimento excessivo
3. Se há meta ativa e existe saldo livre → sugestão de redirecionar o excedente para a meta
4. Se a taxa de poupança está abaixo de 10% → sugestão de aumentar a alocação
5. Se o mês está saudável → confirmação positiva com a taxa de poupança atingida

O Insight responde à pergunta que o usuário tem mas nem sempre sabe formular: "O que meu resultado financeiro deste mês está me dizendo?".

#### Widget de Metas

Painel lateral com as metas financeiras ativas (até 4 exibidas). Cada meta mostra:
- Nome e ícone colorido
- Barra de progresso visual (valor acumulado vs valor alvo)
- Percentual concluído

Link direto para a página completa de Metas.

#### Gráfico de Tendência Mensal

Gráfico de barras dos últimos 6 meses. Cada mês mostra receita, despesa e resultado. O mês atual é destacado em cyan. Ao passar o mouse em um mês, um tooltip exibe os valores exatos.

Objetivo: permitir que o usuário perceba tendências ao longo do tempo, não apenas o snapshot do mês atual.

#### Transações Recentes

Lista das últimas 8 transações do mês com data, descrição, categoria e valor. Link direto para a página completa de Transações.

#### Widget de Bens e Imóveis

Painel compacto que aparece **apenas quando há bens cadastrados**. Exibe o total de bens registrados, o valor atual estimado do patrimônio físico e o custo anual total de impostos/despesas. Se houver despesas vencidas e não pagas, exibe um badge de alerta em vermelho. Link para `/assets`.

#### Widget de Saúde Financeira

Card no topo da coluna direita com o score atual (0–100), o nome do perfil financeiro (Em Recuperação / Estabilizado / Em Construção / Livre) e link para a página completa de Saúde Financeira.

---

### 4.4 Transações

**Rota**: `/transactions`  
**Acesso**: requer login

Módulo central de registro de lançamentos financeiros. Toda a movimentação financeira do usuário — o que entrou e o que saiu — é registrada aqui.

#### Formulário de Nova Transação

**Tipo**: crédito (receita) ou débito (despesa). Define quais categorias ficam disponíveis.

**Data**: dia em que o lançamento ocorreu ou ocorrerá.

**Descrição**: nome livre para o lançamento (ex: "Salário julho", "Almoço com cliente").

**Valor**: valor em reais. Aceita formato brasileiro com vírgula decimal (ex: 1.234,56).

**Categoria**: seleção obrigatória da taxonomia de 9 categorias. Filtra automaticamente por tipo (crédito só mostra categorias de receita, débito só mostra categorias de despesa).

**Notas**: campo livre opcional para contexto adicional.

**Contexto**: classificação opcional entre "Pessoal" e "Profissional". Permite filtrar ou analisar gastos por contexto de vida.

**Recorrência** (modo Avulsa):
- "Não repete": lançamento pontual
- "Todo mês": repete mensalmente até uma data de encerramento (opcional)
- "Todo ano": repete anualmente (típico para despesas sazonais como IPVA, seguro)

**Tags**: seletor inline para associar uma ou mais tags ao lançamento. Tags são etiquetas personalizadas com cor e ícone que permitem agrupamentos transversais às categorias (ex: "Carro" pode estar em múltiplas categorias — combustível variável, IPVA sazonal, financiamento longo prazo).

**Conta** (visível quando há contas cadastradas): permite associar a transação a uma conta específica de uma instituição financeira cadastrada (ex: Nubank Conta Corrente, Itaú Poupança).

**Toggle Reembolsável** (apenas débitos): ao ativar, marca a transação como uma despesa que será ressarcida por terceiros (ex: despesa de viagem corporativa paga pelo colaborador e reembolsada pela empresa). A transação vai para o rastreamento em `/reimbursements`.

#### Modo Parcelamento

Aba alternativa no formulário. Em vez de criar um lançamento único, cria N registros mensais com:
- Valor total dividido igualmente em N parcelas
- Cada parcela datada no mesmo dia dos meses subsequentes
- Sufixo automático na descrição: "Nome da compra (1/N)", "Nome da compra (2/N)", etc.
- Todas as parcelas compartilham um identificador de grupo para ações em lote

#### Lista de Transações

Exibe as transações do mês em ordem cronológica. Cada item mostra data, descrição, categoria com ícone e cor, valor (verde para crédito, vermelho para débito) e tags associadas.

**Interação ao clicar**: ao clicar em uma transação, um painel de ações animado (ActionBar) desliza para baixo com fundo colorido:
- **Editar** (âmbar): abre o modal de edição
- **Excluir individual** (vermelho): exclui apenas este registro
- **Excluir parcelas** (vermelho, apenas para parcelamentos): exclui todas as parcelas do grupo
- **Fechar** (×): fecha o painel sem ação

#### Modal de Edição

Abre automaticamente no modo correto baseado no tipo da transação:

**Modo Single** (transação avulsa sem parcelamento): edita apenas o registro clicado. Todos os campos disponíveis.

**Modo Parcelamento**: edita todas as parcelas futuras do mesmo grupo a partir de hoje. O campo de data não é exibido (já que cada parcela tem sua data própria). Um aviso informa quais parcelas serão afetadas.

**Modo Recorrente**: edita apenas o registro clicado (uma ocorrência). Um banner âmbar avisa que a edição afeta apenas este registro, e que as projeções futuras serão baseadas nos novos dados.

---

### 4.5 Orçamento

**Rota**: `/budget`  
**Acesso**: requer login

O módulo de Orçamento implementa o conceito de **planejamento financeiro intencional**: antes de gastar, defina para onde cada real deve ir. A comparação entre o planejado e o realizado revela a aderência ao plano.

#### Receita Esperada

Campo editável inline no topo da página. Define qual é a expectativa de receita mensal do usuário — geralmente equivale à receita fixa (salário, pró-labore).

Este valor serve como referência para o planejamento: as alocações são expressas não apenas em reais, mas como percentual da receita esperada, o que facilita o raciocínio proporcional ("quero destinar 30% para moradia, 15% para alimentação...").

Uma barra de progresso verde mostra visualmente a relação entre a receita real do mês selecionado e a receita esperada.

#### Alocações por Categoria

Para cada categoria da taxonomia, o usuário pode definir um valor de alocação mensal — quanto planeja gastar/direcionar naquela categoria. Não é necessário preencher todas as categorias; apenas as que fazem sentido para o perfil do usuário.

Abaixo de cada valor de alocação, o sistema exibe automaticamente o percentual que aquela alocação representa sobre a receita esperada.

Cada categoria mostra uma barra de progresso com três estados de cor:
- **Verde** (menos de 75% da alocação usada): dentro do plano
- **Âmbar** (entre 75% e 99%): atenção, chegando ao limite
- **Vermelho** (100% ou mais): limite atingido ou ultrapassado

#### Navegação de Mês

O usuário pode navegar entre meses para ver como o gasto real de cada período se compara às alocações planejadas. As alocações são únicas (o mesmo plano serve para todos os meses), mas o gasto real é filtrado por mês.

#### Balanço

Card de resumo ao final com duas colunas:
- **Planejado**: receita esperada menos o total de alocações definidas. Mostra se o plano como um todo faz sentido matemático.
- **Real**: receita real do mês menos o total gasto no mês. O resultado financeiro concreto.

A comparação entre Planejado e Real revela se o usuário está aderindo ao plano ou se há desvios sistemáticos.

---

### 4.6 Contas Fixas e Provisão Sazonal

**Rota**: `/fixed-expenses`  
**Acesso**: requer login

Visão dedicada a tudo que é recorrente — as obrigações certas que existem independentemente do que aconteça no mês.

#### Cards de Resumo

Três métricas no topo:
- **Total mensal recorrente**: soma de tudo que sai todo mês (recorrência mensal)
- **Total anual eventual**: soma de tudo que sai uma vez por ano (recorrência anual)
- **Projeção 12 meses**: total comprometido nos próximos 12 meses, combinando mensais e anuais

#### Lista de Fixos Mensais

Todas as transações com recorrência mensal, ordenadas por valor decrescente. Exibe descrição, categoria, valor e tags associadas.

#### Lista de Fixos Anuais

Todas as transações com recorrência anual. Cada item exibe um badge com o mês em que o lançamento ocorre, facilitando a identificação de quando cada despesa anual chegará.

#### Breakdown por Tags

Chips mostrando quanto cada tag representa no total de fixos mensais. Permite identificar rapidamente quanto dos fixos está associado a categorias como "Carro", "Casa" ou "Trabalho".

#### Gráfico de Projeção 12 Meses

Gráfico de barras horizontais com cada um dos próximos 12 meses. A barra de cada mês representa o total comprometido naquele período:
- **Barras vermelhas**: base mensal (tudo que sai todo mês)
- **Picos amarelos**: meses com despesas anuais adicionais

O gráfico revela visualmente os meses "pesados" do ano — aqueles em que despesas sazonais se somam à base fixa, como o mês do IPVA ou do material escolar.

#### Provisão Sazonal

Seção adicionada ao final da página quando há despesas anuais cadastradas. Implementa o conceito de **provisão** — reservar mensalmente um valor para cobrir uma despesa futura previsível, em vez de ser surpreendido por ela quando chega.

Para cada despesa anual, o sistema calcula:
- Quantos meses faltam para o próximo vencimento
- Quanto é necessário reservar **por mês** para chegar ao vencimento com o valor completo (o divisor é o tempo real restante, não fixo 12)
- Uma barra de progresso visual da urgência do prazo

Código de urgência:
- **Vermelho "Urgente"**: 2 meses ou menos até o vencimento
- **Âmbar**: entre 2 e 4 meses
- **Verde**: mais de 4 meses

No topo da seção, um banner consolida o total a provisionar por mês considerando todas as despesas anuais.

---

### 4.7 Metas

**Rota**: `/goals`  
**Acesso**: requer login

Sistema de objetivos financeiros com planejamento automático de cobranças mensais.

#### Criação de Meta

Campos para criação:
- **Nome**: como o usuário quer chamar o objetivo (ex: "Viagem à Europa", "Reserva de Emergência")
- **Descrição**: contexto livre sobre o objetivo
- **Valor alvo**: quanto precisa acumular no total
- **Prazo**: mês e ano até quando quer atingir o objetivo
- **Cor**: identificação visual da meta

**Cálculo em tempo real durante a criação**: enquanto o usuário preenche o valor e o prazo, o sistema exibe instantaneamente:
- O valor que será cobrado por mês (valor total ÷ número de meses até o prazo)
- A classificação de viabilidade com base na sobra média dos últimos 3 meses

**Classificações de viabilidade**:
- "Cabe folgado" — a cobrança mensal consome até 30% da sobra média
- "Factível" — consome entre 31% e 60% da sobra média
- "Apertado — considere estender o prazo" — consome entre 61% e 100%
- "Inviável — você precisaria de R$ X/mês a mais" — supera a sobra média disponível

Esse diagnóstico não impede a criação da meta, mas informa o usuário sobre a realidade do compromisso antes de assumir.

#### Cobranças Mensais Automáticas

Ao criar uma meta, o sistema gera automaticamente uma cobrança para cada mês entre a criação e o prazo. O valor das cobranças é distribuído igualitariamente, com a última parcela absorvendo qualquer resíduo de arredondamento (garantindo que a soma exata das parcelas seja sempre o valor alvo).

Cada cobrança aparece listada no card da meta com:
- Mês de referência
- Valor da cobrança
- Status (paga / pendente / em atraso)
- Botão para marcar como paga ou desmarcar

**Cobranças em atraso**: cobranças não pagas com data de vencimento no passado são destacadas com badge vermelho "Em atraso". O usuário pode marcá-las como pagas a qualquer momento.

**Progresso automático**: ao marcar uma cobrança como paga, o sistema recalcula automaticamente o valor acumulado na meta. Ao atingir o valor alvo, a meta muda automaticamente para status "Concluída".

#### Resumo no Topo

Três métricas consolidadas:
- Total em metas ativas (soma dos valores alvo de todas as metas ativas)
- Total já guardado (soma dos valores pagos em todas as metas)
- Comprometimento mensal como percentual da sobra média

#### Alerta Contextual de Passivos

Se o usuário possui passivos (dívidas) cadastrados com taxa de juros alta (≥ 5% ao mês), a página de Metas exibe um **banner de alerta** vermelho. O raciocínio: pagar dívidas caras é matematicamente superior a acumular metas, pois os juros que as dívidas cobram superam qualquer rendimento que a meta poderia gerar.

O banner lista as dívidas de alto custo e sugere priorizar a quitação. Se todas as dívidas têm taxas baixas, o banner fica verde confirmando que o foco em metas é adequado.

---

### 4.8 Projeções

**Rota**: `/projections`  
**Acesso**: requer login

Simulação dos próximos 12 meses com base exclusivamente nos compromissos já assumidos pelo usuário — recorrências e parcelamentos.

**Importante**: projeções mostram apenas o que está **comprometido**, não fazem suposições sobre entradas ou saídas variáveis futuras. É uma visão do que já está "contratado" com o futuro.

#### Cards de Resumo

- **Livre acumulado**: soma dos saldos positivos nos meses onde as entradas comprometidas superam as saídas comprometidas
- **Média mensal livre**: média do saldo livre mês a mês
- **Meses no vermelho**: quantos dos próximos 12 meses têm saldo comprometido negativo (mais saídas do que entradas já comprometidas)

#### Gráfico de 12 Meses

12 colunas clicáveis, cada uma representando um mês. Cada coluna é dividida em:
- **Barra cyan**: receitas comprometidas (recorrentes e parcelamentos recebíveis)
- **Barra vermelha**: despesas comprometidas (recorrentes e parcelamentos a pagar)
- **Barra verde**: saldo livre (diferença entre entradas e saídas)

#### Detalhe Mensal

Ao clicar em qualquer coluna do gráfico, o painel inferior exibe o breakdown completo daquele mês:
- Cada entrada comprometida com valor e categoria
- Cada saída comprometida com valor e categoria
- Badge "Anual" para os lançamentos anuais que caem naquele mês específico
- Saldo livre calculado

---

### 4.9 Passivos

**Rota**: `/liabilities`  
**Acesso**: requer login

Gerenciamento completo de dívidas com ferramentas de análise e estratégia de quitação.

#### Cadastro de Passivo

Campos para registro:
- **Nome**: identificação da dívida (ex: "Cartão Nubank", "Financiamento Carro")
- **Tipo**: Cheque especial, Crédito rotativo, Empréstimo, Financiamento, Outro
- **Saldo devedor**: valor atual ainda devido
- **Taxa de juros**: percentual ao mês (% a.m.)
- **Pagamento mínimo**: valor da parcela mínima mensal
- **Credor**: nome da instituição ou pessoa (opcional)
- **Notas**: observações livres
- **Instituição**: vínculo opcional com uma instituição cadastrada no módulo de Instituições

#### Cards de Resumo

- **Total em dívidas ativas**: soma de todos os saldos devedores
- **Juros queimados por mês**: soma de (saldo × taxa) para todas as dívidas — o custo mensal de carregar essas dívidas
- **Pagamento mínimo total**: soma dos mínimos de todas as dívidas

#### Card de Passivo Individual

Cada dívida exibe:
- Saldo, taxa de juros, pagamento mínimo
- **Previsão de quitação**: quantos meses para quitar pagando apenas o mínimo, com código de cor:
  - Verde: até 12 meses
  - Âmbar: 13 a 36 meses
  - Vermelho: mais de 36 meses
- **Alerta crítico**: se o pagamento mínimo não cobre sequer os juros do mês, o sistema exibe alerta vermelho "Mínimo não cobre os juros — essa dívida nunca será quitada assim". Esta é a situação mais grave possível em gestão de dívidas.
- Botões para editar e marcar como quitada

#### Dívidas Quitadas

Passivos marcados como "Quitados" ficam visíveis em uma seção separada, preservando o histórico. Podem ser reeditados se necessário.

#### Modo Recuperação

Seção recolhível dedicada à estratégia de quitação acelerada via método avalanche. Ao expandir:

**Ordenação automática**: as dívidas são listadas da maior para a menor taxa de juros, com badges de prioridade (1ª, 2ª, 3ª...). Esta é a ordem em que o dinheiro extra deve ser aplicado.

**Calculadora de pagamento extra**: o usuário digita um valor adicional que pode pagar por mês. O sistema recalcula automaticamente:
- Para a dívida prioritária (maior juro): quanto tempo economiza ao aplicar o valor extra
- Para as demais: mantém apenas o mínimo
- O resultado mostra a economia de tempo em meses para cada dívida

**Tip do método**: explicação didática do método avalanche — por que atacar a maior taxa primeiro maximiza a eficiência financeira.

---

### 4.10 Alertas

**Rota**: `/alerts`  
**Acesso**: requer login

Central de alertas proativos gerados automaticamente pelo sistema com base na análise dos dados do usuário. O usuário não precisa monitorar cada módulo individualmente — o sistema faz isso e consolida os pontos de atenção em um único lugar.

#### Tipos de Alerta

**Alerta de Orçamento — Aviso** (⚠): uma categoria de despesa atingiu 80% ou mais da alocação definida no Orçamento, mas ainda não ultrapassou o limite. Alerta antecipado.

**Alerta de Orçamento — Crítico** (🔴): uma categoria ultrapassou 100% da alocação. Estouro confirmado.

**Alerta de Meta — Aviso** (⚠): existe uma cobrança de meta programada para o mês atual que ainda não foi marcada como paga.

**Alerta de Meta — Crítico** (🔴): existe uma cobrança de meta vencida (data no passado) que não foi paga.

**Alerta de Projeção — Crítico** (🔴): algum dos próximos 12 meses tem saldo livre projetado negativo — as saídas comprometidas superam as entradas comprometidas naquele mês.

**Alerta Sazonal — Aviso** (⚠): existe uma despesa anual com vencimento nos próximos 2 meses. Lembrete para garantir que os recursos estão reservados.

#### Interface

Os alertas são agrupados por severidade (crítico primeiro, aviso depois) e cada card exibe:
- Ícone de severidade (vermelho ou âmbar)
- Badge identificando o tipo de alerta
- Título descritivo
- Explicação detalhada
- Botão de link direto para o módulo relevante (ex: um alerta de orçamento leva para `/budget`)

Chips no topo mostram a contagem de alertas por tipo para uma visão rápida do panorama.

**Estado "Tudo em Ordem"**: quando não há nenhum alerta ativo, a página exibe ícone de sino verde e mensagem de confirmação.

---

### 4.11 Saúde Financeira

**Rota**: `/health`  
**Acesso**: requer login

Diagnóstico consolidado da saúde financeira do usuário, expressado como um score de 0 a 100 pontos distribuídos em quatro dimensões.

#### Score e Perfis

| Faixa | Perfil | Cor | Significado |
|---|---|---|---|
| 0–39 | Em Recuperação | Vermelho | Situação financeira crítica, requer ação imediata |
| 40–59 | Estabilizado | Âmbar | Equilíbrio frágil, melhorias necessárias |
| 60–79 | Em Construção | Cyan | Fundamentos sólidos, construindo o futuro |
| 80–100 | Livre | Verde | Saúde financeira excelente |

#### Gauge SVG Animado

Semicírculo com ponteiro que vai de 0 a 100. A animação do ponteiro até o score atual torna o resultado mais impactante visualmente.

#### As Quatro Dimensões

**Comprometimento (máximo 30 pontos)**  
Mede qual percentual da receita está comprometido com pagamentos de dívidas. Pontuação máxima quando o comprometimento é de 30% ou menos da receita. A lógica: dívidas excessivas são o principal impedimento à liberdade financeira.

**Poupança (máximo 25 pontos)**  
Mede a taxa de poupança: quanto da receita está sendo direcionado para construção de futuro (lançamentos do tipo debit_longterm). Pontuação máxima quando a poupança atinge 20% ou mais da receita.

**Resultado (máximo 25 pontos)**  
Avalia se o período fechou positivo. Pontuação proporcional ao resultado líquido — quanto mais positivo, mais pontos. Resultado negativo implica zero pontos nesta dimensão.

**Reserva (máximo 20 pontos)**  
Estima a reserva de emergência acumulada usando os lançamentos de "Alocação de Longo Prazo" como proxy do total acumulado. Compara esse total com a média de despesas dos últimos 3 meses para calcular quantos meses de autonomia o usuário tem. Pontuação máxima quando a reserva cobre 6 meses ou mais.

#### Dimension Cards

Cada dimensão é exibida em um card individual com:
- Pontuação atual e máxima possível
- Barra de progresso proporcional
- Descrição contextual do que a pontuação atual significa

#### Badge de Perfil

Exibe o perfil atual (nome + faixa de pontos) e indica quantos pontos faltam para avançar ao perfil seguinte — criando um objetivo tangível.

#### Tip Prioritizado

Banner com a dica mais relevante baseada na dimensão de menor pontuação. Se o usuário tem score baixo em Reserva, a dica aborda como construir a reserva. Se a dimensão mais fraca é Comprometimento, aborda estratégias de quitação.

---

### 4.12 Relatórios

**Rota**: `/reports`  
**Acesso**: requer login

DRE detalhado por período, com valores absolutos e percentuais sobre a receita.

O usuário seleciona um período (mês e ano) e recebe uma visão estruturada de todas as categorias com:
- Valor total de cada categoria no período
- Percentual que aquela categoria representa sobre a receita total do período
- Subtotais por grupo (receitas, despesas fixas, variáveis, etc.)
- Resultado líquido final

O módulo de Relatórios é o mais analítico da plataforma — permite ao usuário estudar um período específico em detalhe para entender exatamente de onde vieram e para onde foram seus recursos.

---

### 4.13 Reembolsos

**Rota**: `/reimbursements`  
**Acesso**: requer login

Rastreamento de despesas reembolsáveis — gastos que o usuário pagou mas que serão ressarcidos por terceiros (empresa, sócio, familiar).

#### Como Funciona

Ao registrar qualquer despesa no módulo de Transações, um toggle "Despesa reembolsável" fica disponível. Ao ativá-lo, a transação é marcada para rastreamento.

**Importante**: a despesa continua aparecendo no DRE e em todos os outros cálculos normalmente. O módulo de Reembolsos é um painel de rastreamento adicional, não uma categoria separada.

#### Cards de Resumo

- **A receber**: soma de todas as despesas reembolsáveis ainda pendentes de recebimento
- **Já reembolsado**: soma de tudo que foi recebido
- **Total registrado**: combinação dos dois anteriores

#### Listas

**Aguardando reembolso**: listagem das despesas pendentes com badge âmbar. Cada item tem um botão para marcar como recebida — ao clicar, a data do recebimento é registrada automaticamente.

**Reembolsadas**: listagem das despesas já recebidas com badge verde e data do recebimento. Cada item tem um botão para desfazer (caso o recebimento tenha sido marcado por engano).

---

### 4.14 Tags

**Rota**: `/tags`  
**Acesso**: requer login

Sistema de etiquetas personalizadas que permite ao usuário criar agrupamentos transversais às categorias.

As categorias respondem "qual é a natureza financeira deste gasto?". As tags respondem "a que assunto, projeto ou área da vida este gasto pertence?".

Exemplo: uma pessoa com carro pode ter a tag "Carro" que abrange: combustível (variável), IPVA (sazonal), seguro (sazonal), manutenção (imprevisível) e parcelas do financiamento (comprometido). Nenhuma dessas transações está na mesma categoria, mas todas compartilham a mesma tag — o que permite ver o custo total do carro de uma só vez.

#### Criação de Tag

- **Nome**: único por usuário
- **Cor**: seleção em paleta de 8 cores predefinidas
- **Ícone**: seleção em 12 opções de ícones (etiqueta, maleta, casa, carro, coração, estrela, raio, carrinho, escola, avião, computador, café)

**Preview em tempo real**: ao escolher cor e ícone, um chip de preview mostra como a tag ficará antes de salvar.

#### Edição

Nome, cor e ícone são editáveis inline diretamente na listagem.

#### Exclusão

Ao excluir uma tag, todos os vínculos com transações são removidos automaticamente. As transações permanecem intactas — apenas perdem o vínculo com a tag excluída.

---

### 4.15 Instituições

**Rota**: `/institutions`  
**Acesso**: requer login

Cadastro de bancos, fintechs, corretoras e outras instituições financeiras com suas contas vinculadas.

#### Cadastro de Instituição

- **Nome**: ex: "Nubank", "Itaú", "XP Investimentos"
- **Tipo**: Banco, Fintech, Corretora, Outro
- **Cor**: identificação visual (hex)
- **Ícone**: ícone personalizado
- **Notas**: observações livres

#### Contas por Instituição

Cada instituição pode ter N contas associadas. Tipos de conta:
- Conta Corrente
- Poupança
- Cartão de Crédito
- Investimentos
- Carteira (dinheiro físico)
- Outro

Cada conta registra:
- **Saldo**: valor atual disponível
- **Limite**: para cartões e cheque especial (opcional)
- **Notas**: observações livres

#### Vinculações

**Com Passivos**: ao criar ou editar um passivo (dívida), é possível vincular ao banco ou fintech onde a dívida está. O card da instituição mostra os passivos vinculados.

**Com Transações**: ao criar uma transação, é possível indicar de qual conta ela saiu ou entrou, quando há contas cadastradas.

#### Exclusão em Cascade

Ao excluir uma instituição:
- Suas contas são removidas
- Passivos vinculados a ela têm o vínculo removido (mas o passivo não é excluído)
- Transações vinculadas às contas têm o vínculo removido (mas as transações não são excluídas)

#### Cards de Resumo

- Total consolidado de saldos de todas as contas
- Total de passivos vinculados a instituições

---

### 4.16 Bens e Imóveis

**Rota**: `/assets`  
**Acesso**: requer login

Cadastro de patrimônio físico com rastreamento dos impostos e despesas associadas.

#### Tipos de Bem

**Imóvel**: campos específicos incluem endereço do imóvel.  
**Veículo**: campos específicos incluem marca, modelo, ano, placa.  
**Outro bem**: cadastro genérico para bens que não se enquadram nos tipos anteriores.

#### Campos Comuns a Todos os Tipos

- **Nome/apelido**: como o usuário quer identificar o bem (ex: "Apartamento São Paulo", "Civic 2019")
- **Valor de compra**: quanto custou na aquisição
- **Valor atual estimado**: valor de mercado atual (atualizado manualmente pelo usuário)
- **Data de aquisição**: quando o bem foi adquirido
- **Notas**: observações livres

#### Variação de Valor

O card expandido de cada bem exibe a diferença entre o valor de compra e o valor atual estimado, com cor:
- Verde: o bem valorizou
- Vermelho: o bem desvalorizou

Isso permite ao usuário monitorar se seus bens físicos estão sendo ativos (valorizando) ou passivos (desvalorizando) no contexto patrimonial.

#### Despesas por Bem

Cada bem pode ter N despesas associadas. Tipos de despesa com sugestões por tipo de bem:

| Tipo de Despesa | Sugerida para |
|---|---|
| IPTU | Imóvel |
| IPVA | Veículo |
| ITR | Imóvel (rural) |
| DPVAT/SPVAT | Veículo |
| Seguro | Imóvel e Veículo |
| Licenciamento | Veículo |
| Manutenção | Todos |
| Outro | Todos |

Cada despesa registra:
- Nome (ex: "IPTU 2025", "Seguro Auto Anual")
- Tipo
- Valor
- Data de vencimento (opcional)
- Status: pago ou pendente

**Toggle de Pagamento**: ao marcar uma despesa como paga, a data do pagamento é registrada automaticamente. O toggle pode ser revertido.

**Alerta de Vencimento**: despesas com data de vencimento no passado e status pendente são destacadas com fundo vermelho de alerta.

**Totais por bem**: no rodapé do card expandido, totais de pago, pendente e total geral naquele bem.

#### Cards de Resumo Globais

- Quantidade total de bens cadastrados
- Soma do valor atual estimado de todos os bens (patrimônio físico total)
- Soma de todas as despesas/impostos do ano (custo anual de manter o patrimônio)
- Contagem e total de despesas vencidas e pendentes

---

### 4.17 Plano Mensal

**Rota**: `/planning`  
**Acesso**: requer login

Calendário visual dos lançamentos do mês corrente. Exibe todas as transações distribuídas pelos dias do mês, permitindo uma visão temporal de quando cada compromisso financeiro ocorre ou ocorreu.

---

### 4.18 Educação

**Rota**: `/education`  
**Acesso**: requer login

Seção de conteúdo educacional financeiro. Estruturada em duas frentes:

**Apoio à aplicação**: material instrucional que explica como usar cada módulo do Lyfx, para que o usuário extraia o máximo da plataforma.

**Conceitos financeiros**: conteúdo sobre educação financeira pessoal — princípios de orçamento, gestão de dívidas, construção de reserva, planejamento de longo prazo — apoiado em literatura e fundamentos teóricos.

---

### 4.19 Perfil

**Rota**: `/profile`  
**Acesso**: requer login (acessível via menu do usuário no canto superior direito)

Edição dos dados pessoais e credenciais do usuário.

#### Avatar

Campo de upload de foto. Ao selecionar uma imagem:
1. A imagem é redimensionada no próprio navegador (sem envio ao servidor) para 200×200 pixels via Canvas API
2. Convertida para formato JPEG com compressão
3. Enviada como string base64 para armazenamento no banco

O avatar aparece em todas as instâncias do menu do usuário (canto superior direito).

#### Dados Pessoais

- **Nome**: exibido no menu do usuário e no Studio
- **E-mail**: para referência (não usado para recuperação de senha)
- **Idade**: campo numérico opcional
- **Gênero**: campo texto opcional

#### Endereço Estruturado

Cinco campos separados: CEP, Logradouro, Número/Complemento, Cidade, Estado e País.

**Auto-fill via ViaCEP**: ao digitar o CEP e clicar no ícone de lupa (ou pressionar Enter no campo CEP), o sistema consulta a API pública do ViaCEP e preenche automaticamente Logradouro, Cidade e Estado. Funciona apenas para CEPs brasileiros.

**País**: combobox digitável com aproximadamente 195 países em português. Países lusófonos aparecem no topo da lista. O campo filtra em tempo real conforme o usuário digita e também aceita texto livre (para países não listados ou nomes alternativos).

#### Troca de Senha

Formulário separado na parte inferior da página:
- **Senha atual**: verificada contra o hash armazenado antes de qualquer alteração
- **Nova senha**: mínimo 6 caracteres
- Proteção contra alteração sem conhecer a senha atual

---

### 4.20 Studio (Administração)

**Rota**: `/studio`  
**Acesso**: senha separada (`ADMIN_SECRET`) — independente da sessão do usuário

Painel de administração da plataforma. Acessível via link discreto na tela de login.

#### Autenticação do Studio

Formulário de senha separado. A senha do Studio é configurada via variável de ambiente e não é a mesma senha do usuário. A sessão do Studio expira em 2 horas. O botão "← Login" retorna para a tela de login do aplicativo.

**Logout do Studio**: ao sair do Studio, a sessão do Studio **e** a sessão do usuário são encerradas simultaneamente, redirecionando para a landing page.

#### Aba Schema

Visualização completa de todas as tabelas do banco de dados:
- Nome de cada tabela
- Todos os campos com tipo, obrigatoriedade e descrição
- Relações entre modelos
- Constraints únicas

Expandível por tabela para não sobrecarregar visualmente.

#### Aba Docs

Renderização completa do arquivo `DOCUMENTATION.md` (documentação técnica) diretamente no painel.

**Índice lateral clicável** (TOC): lista automática de todos os títulos h2, h3 e h4 do documento, com indentação visual progressiva. Clicar em qualquer item do índice faz scroll suave até o heading correspondente.

#### Aba Usuários

Lista de todos os usuários cadastrados com avatar, nome, e-mail e data de cadastro.

**Reset de senha**: campo inline para cada usuário. Ao digitar a nova senha (mínimo 6 caracteres) e confirmar, a senha é alterada via hash bcrypt.

**Criar usuário**: formulário inline com nome, e-mail e senha. A página atualiza automaticamente após a criação.

**Deletar usuário**: botão vermelho com confirmação inline. A exclusão remove em cascade todos os dados do usuário: transações, tags, orçamentos, metas, cobranças de metas, passivos, configurações, instituições, contas, bens e despesas de bens.

#### Aba Dados

**Seção Sistema**: três cards com métricas globais:
- Número total de usuários
- Total de registros em todas as tabelas combinadas
- Tamanho do arquivo de banco de dados em disco (formatado em B/KB/MB/GB)

**Filtro por usuário**: combobox digitável para selecionar um usuário por nome ou e-mail. Ao selecionar:
- Contadores de registros por tipo (transações, tags, orçamentos, metas)
- Tabela com as 10 transações mais recentes do usuário

**Sem filtro**: exibe as 10 transações mais recentes de todo o sistema.

---

## 5. Fluxos Transversais

Esta seção descreve como os módulos se conectam — os fluxos que cruzam mais de um módulo e que são especialmente relevantes para validação de consistência.

### Fluxo A — Uma transação e seus efeitos

Ao registrar um lançamento em `/transactions`, ele impacta automaticamente:
- **Dashboard**: atualiza DRE, KPIs e transações recentes
- **Orçamento**: atualiza o gasto real da categoria no mês
- **Contas Fixas**: aparece nas listas se for recorrente
- **Projeções**: aparece nos meses futuros se for recorrente ou parcelado
- **Reembolsos**: aparece em `/reimbursements` se marcado como reembolsável
- **Saúde Financeira**: afeta o score via DRE
- **Alertas**: pode disparar alertas de orçamento
- **Relatórios**: aparece no DRE do período

### Fluxo B — Criação de parcelamento

Ao criar um parcelamento (ex: R$1.200 em 3x):
1. São criados 3 registros de transação individuais com datas em 3 meses consecutivos
2. Cada registro tem o mesmo `installmentGroupId`, identificando o grupo
3. As 3 parcelas aparecem nos respectivos meses em `/transactions`
4. As 3 parcelas aparecem nas projeções dos respectivos meses futuros
5. Editar qualquer parcela atualiza todas as parcelas futuras do grupo
6. Excluir pelo botão "Excluir grupo" remove todos os 3 registros

### Fluxo C — Meta e sua cobrança mensal

Ao criar uma meta de R$1.200 em 12 meses:
1. A meta é criada com `monthlyAmount = R$100/mês`
2. 12 cobranças (`GoalPayment`) são geradas, uma para cada mês
3. O widget do Dashboard mostra a barra de progresso da meta
4. A aba de Alertas dispara alerta se uma cobrança não for paga no mês correspondente
5. Ao marcar cobranças como pagas, `currentAmount` é recalculado
6. Quando `currentAmount >= targetAmount`, a meta muda para "Concluída"

### Fluxo D — Passivo e seus alertas

Ao cadastrar um passivo com taxa ≥ 5% a.m.:
1. Aparece em `/liabilities` com previsão de quitação
2. Dispara banner de alerta na página de Metas (sugerindo priorizar a quitação)
3. Se o mínimo não cobre os juros, exibe alerta crítico no card
4. No Modo Recuperação, aparece listado por prioridade do método avalanche

### Fluxo E — Saúde Financeira e suas fontes

O score de saúde é calculado com dados de múltiplos módulos:
- Dimensão Comprometimento: calculada a partir do DRE (soma de `debit_committed` / receita total)
- Dimensão Poupança: calculada a partir do DRE (soma de `debit_longterm` / receita total)
- Dimensão Resultado: calculada a partir do saldo líquido do DRE
- Dimensão Reserva: calculada a partir do aggregate histórico de `debit_longterm` dividido pela média de despesas dos últimos 3 meses

### Fluxo F — Alerta sazonal

Uma despesa anual (ex: IPVA em abril):
1. Aparece em `/fixed-expenses` na lista de anuais com badge do mês
2. Aparece no gráfico de projeção 12 meses como pico no mês de vencimento
3. Aparece em Provisão Sazonal com cálculo de quanto provisionar por mês
4. Gera alerta sazonal em `/alerts` quando faltam 2 meses ou menos

### Fluxo G — Vinculação Instituição → Passivo → Transação

Uma dívida (passivo) pode ser vinculada a uma instituição, tornando o ecossistema financeiro mais coeso:
- A instituição mostra o passivo vinculado em seu card expandido
- A transação de pagamento do passivo pode ser vinculada à conta da mesma instituição
- Ao excluir a instituição, o vínculo é removido mas o passivo permanece intacto

---

## 6. Lista Completa de Ações — Guia de QA

Esta seção lista todas as ações possíveis na plataforma, organizadas por módulo. É a referência primária para elaboração de planos de teste.

---

### Autenticação

| # | Ação | Módulo | Observações |
|---|---|---|---|
| A-01 | Criar conta (modo setup) | Login | Nome, e-mail, senha, confirmação de senha |
| A-02 | Fazer login com credenciais válidas | Login | — |
| A-03 | Tentar login com senha incorreta | Login | Deve exibir erro |
| A-04 | Tentar criar conta com senhas divergentes | Login | Animação shake no botão |
| A-05 | Tentar criar conta com senha < 6 chars | Login | Deve exibir erro |
| A-06 | Alternar entre modo login e modo setup | Login | — |
| A-07 | Abrir modal "Esqueci minha senha" | Login | — |
| A-08 | Fechar modal de senha | Login | — |
| A-09 | Clicar em "← Início" | Login | Navega para landing page |
| A-10 | Fazer logout via menu do usuário | UserMenu | Redireciona para landing |
| A-11 | Tentar acessar rota protegida sem sessão | Proxy | Redireciona para /login |
| A-12 | Acessar / com sessão ativa | Proxy | Redireciona para /dashboard |

---

### Navegação

| # | Ação | Módulo | Observações |
|---|---|---|---|
| N-01 | Colapsar a sidebar | Sidebar | Exibe apenas ícones |
| N-02 | Expandir a sidebar | Sidebar | Exibe ícones + labels |
| N-03 | Verificar tooltip de item na sidebar colapsada | Sidebar | Hover sobre ícone |
| N-04 | Navegar para cada módulo pela sidebar | Sidebar | 15+ rotas verificáveis |
| N-05 | Verificar highlight da rota ativa | Sidebar | Apenas o item atual fica em cyan |
| N-06 | Abrir menu do usuário | UserMenu | Dropdown aparece |
| N-07 | Fechar menu do usuário clicando fora | UserMenu | Fecha ao clicar fora do componente |
| N-08 | Ir para perfil via menu do usuário | UserMenu | Navega para /profile |

---

### Transações

| # | Ação | Módulo | Observações |
|---|---|---|---|
| T-01 | Criar transação avulsa de crédito | Transações | — |
| T-02 | Criar transação avulsa de débito | Transações | — |
| T-03 | Criar transação com recorrência mensal | Transações | — |
| T-04 | Criar transação com recorrência mensal com data de encerramento | Transações | — |
| T-05 | Criar transação com recorrência anual | Transações | — |
| T-06 | Criar transação com tag associada | Transações | — |
| T-07 | Criar transação com múltiplas tags | Transações | — |
| T-08 | Criar transação reembolsável | Transações | Apenas débito |
| T-09 | Criar transação vinculada a uma conta | Transações | Requer instituições/contas cadastradas |
| T-10 | Criar parcelamento (ex: 3x) | Transações | Modo parcelamento |
| T-11 | Criar parcelamento com valor não divisível exatamente | Transações | Última parcela absorve diferença |
| T-12 | Criar nova tag pelo TagPicker | Transações | Inline no formulário |
| T-13 | Clicar em transação da lista | Transações | ActionBar desliza |
| T-14 | Fechar ActionBar com × | Transações | — |
| T-15 | Editar transação avulsa (modo single) | Transações | Todos os campos disponíveis |
| T-16 | Editar parcela (modo installment) | Transações | Afeta parcelas futuras, sem campo de data |
| T-17 | Editar transação recorrente (modo recurring) | Transações | Banner de aviso âmbar |
| T-18 | Excluir transação individual | Transações | "Só esta" / "Excluir" |
| T-19 | Excluir grupo de parcelas | Transações | "Excluir Nx" |
| T-20 | Verificar sufixo automático em parcelamentos | Transações | "(1/N)", "(2/N)", etc. |
| T-21 | Verificar que parcelamento anterior ao hoje não é editado | Transações | updateFutureInstallments filtra por date >= hoje |

---

### Orçamento

| # | Ação | Módulo | Observações |
|---|---|---|---|
| O-01 | Definir receita esperada | Orçamento | Salvo em Settings |
| O-02 | Atualizar receita esperada | Orçamento | — |
| O-03 | Definir alocação para uma categoria | Orçamento | Upsert |
| O-04 | Atualizar alocação existente | Orçamento | — |
| O-05 | Verificar % da receita abaixo do valor | Orçamento | Requer receita esperada definida |
| O-06 | Verificar barra de progresso verde | Orçamento | Gasto < 75% |
| O-07 | Verificar barra de progresso âmbar | Orçamento | Gasto entre 75–99% |
| O-08 | Verificar barra de progresso vermelha | Orçamento | Gasto ≥ 100% |
| O-09 | Navegar para mês anterior | Orçamento | Gasto real muda |
| O-10 | Verificar balanço planejado vs real | Orçamento | — |
| O-11 | Verificar barra de receita real vs esperada | Orçamento | — |

---

### Contas Fixas

| # | Ação | Módulo | Observações |
|---|---|---|---|
| F-01 | Verificar cards de resumo (mensal, anual, 12 meses) | Contas Fixas | — |
| F-02 | Verificar lista de fixos mensais | Contas Fixas | Todos com recorrência mensal |
| F-03 | Verificar lista de fixos anuais com badge de mês | Contas Fixas | — |
| F-04 | Verificar breakdown por tags | Contas Fixas | Chips com valor por tag |
| F-05 | Verificar gráfico de 12 meses | Contas Fixas | Picos amarelos nos meses com anuais |
| F-06 | Verificar seção de Provisão Sazonal | Contas Fixas | Visível quando há anuais |
| F-07 | Verificar urgência em Provisão Sazonal | Contas Fixas | Verde, âmbar, vermelho por prazo |
| F-08 | Verificar cálculo do valor mensal a provisionar | Contas Fixas | Valor ÷ meses reais restantes |

---

### Metas

| # | Ação | Módulo | Observações |
|---|---|---|---|
| M-01 | Criar meta com nome, valor e prazo | Metas | — |
| M-02 | Verificar cálculo de cobrança mensal em tempo real | Metas | Durante criação |
| M-03 | Verificar classificação de viabilidade "Cabe folgado" | Metas | Cobrança ≤ 30% da sobra |
| M-04 | Verificar classificação de viabilidade "Inviável" | Metas | Cobrança > sobra |
| M-05 | Verificar geração automática de cobranças | Metas | N cobranças para N meses |
| M-06 | Marcar cobrança como paga | Metas | currentAmount atualiza |
| M-07 | Desmarcar cobrança paga | Metas | currentAmount reduz |
| M-08 | Verificar cobrança em atraso | Metas | Badge vermelho para vencidas |
| M-09 | Verificar conclusão automática da meta | Metas | Status → completed quando acumulado ≥ alvo |
| M-10 | Excluir meta | Metas | Remove cobranças em cascade |
| M-11 | Verificar banner de alerta de passivos | Metas | Aparece quando há passivos ≥ 5% a.m. |
| M-12 | Verificar banner verde quando todos os passivos são de baixo custo | Metas | — |

---

### Projeções

| # | Ação | Módulo | Observações |
|---|---|---|---|
| P-01 | Verificar cards de resumo (livre, média, meses negativos) | Projeções | — |
| P-02 | Verificar gráfico de 12 colunas | Projeções | Cyan, vermelho, verde |
| P-03 | Clicar em um mês do gráfico | Projeções | Painel de detalhe abre abaixo |
| P-04 | Verificar badge "Anual" em lançamentos anuais | Projeções | — |
| P-05 | Verificar que recorrência encerrada não aparece após o fim | Projeções | recurrenceEndsAt |
| P-06 | Verificar distribuição correta de parcelas | Projeções | Cada parcela no mês certo |

---

### Passivos

| # | Ação | Módulo | Observações |
|---|---|---|---|
| L-01 | Criar passivo com todos os campos | Passivos | — |
| L-02 | Criar passivo sem credor e notas (campos opcionais) | Passivos | — |
| L-03 | Criar passivo vinculado a uma instituição | Passivos | Requer instituição cadastrada |
| L-04 | Editar passivo existente | Passivos | — |
| L-05 | Marcar passivo como quitado | Passivos | Vai para seção "Quitadas" |
| L-06 | Verificar previsão de quitação verde | Passivos | ≤ 12 meses |
| L-07 | Verificar previsão de quitação âmbar | Passivos | 13–36 meses |
| L-08 | Verificar previsão de quitação vermelha | Passivos | > 36 meses |
| L-09 | Verificar alerta quando mínimo < juros mensais | Passivos | — |
| L-10 | Excluir passivo | Passivos | — |
| L-11 | Expandir Modo Recuperação | Passivos | — |
| L-12 | Verificar ordenação por maior taxa | Passivos | Modo Recuperação |
| L-13 | Digitar valor extra na calculadora | Passivos | Mostra economia em meses |

---

### Alertas

| # | Ação | Módulo | Observações |
|---|---|---|---|
| AL-01 | Verificar estado vazio "Tudo em ordem!" | Alertas | Quando não há alertas |
| AL-02 | Verificar alerta de orçamento aviso (80%) | Alertas | — |
| AL-03 | Verificar alerta de orçamento crítico (100%) | Alertas | — |
| AL-04 | Verificar alerta de meta pendente no mês | Alertas | — |
| AL-05 | Verificar alerta de meta em atraso | Alertas | — |
| AL-06 | Verificar alerta de projeção negativa | Alertas | — |
| AL-07 | Verificar alerta sazonal (vencimento em ≤ 2 meses) | Alertas | — |
| AL-08 | Clicar no link de um alerta | Alertas | Navega para o módulo relevante |
| AL-09 | Verificar agrupamento por severidade (crítico antes de aviso) | Alertas | — |
| AL-10 | Verificar chips de contagem por tipo | Alertas | — |

---

### Saúde Financeira

| # | Ação | Módulo | Observações |
|---|---|---|---|
| S-01 | Verificar gauge SVG animado | Saúde | Animação do ponteiro |
| S-02 | Verificar score com mês positivo | Saúde | — |
| S-03 | Verificar score com mês negativo | Saúde | Dimensão resultado = 0 |
| S-04 | Verificar perfil "Em Recuperação" (0–39) | Saúde | — |
| S-05 | Verificar perfil "Livre" (80–100) | Saúde | — |
| S-06 | Verificar 4 Dimension Cards | Saúde | Comprometimento, Poupança, Resultado, Reserva |
| S-07 | Verificar badge com pontos até próximo perfil | Saúde | — |
| S-08 | Verificar tip prioritizado pela dimensão mais fraca | Saúde | — |
| S-09 | Verificar widget de saúde no dashboard | Saúde | HealthScoreCard |

---

### Relatórios

| # | Ação | Módulo | Observações |
|---|---|---|---|
| R-01 | Selecionar período (mês/ano) | Relatórios | MonthPicker |
| R-02 | Verificar DRE detalhado do período | Relatórios | Todas as categorias |
| R-03 | Verificar percentuais sobre a receita | Relatórios | % por categoria |
| R-04 | Verificar subtotais por grupo | Relatórios | Fixo, variável, etc. |

---

### Reembolsos

| # | Ação | Módulo | Observações |
|---|---|---|---|
| RE-01 | Verificar lista de despesas pendentes | Reembolsos | — |
| RE-02 | Marcar despesa como reembolsada | Reembolsos | Data registrada automaticamente |
| RE-03 | Desfazer marcação de reembolso | Reembolsos | Volta para pendente |
| RE-04 | Verificar cards de resumo (a receber, recebido, total) | Reembolsos | — |
| RE-05 | Verificar que despesa não reembolsável não aparece aqui | Reembolsos | — |

---

### Tags

| # | Ação | Módulo | Observações |
|---|---|---|---|
| TG-01 | Criar tag com nome, cor e ícone | Tags | — |
| TG-02 | Verificar preview em tempo real durante criação | Tags | — |
| TG-03 | Tentar criar tag com nome duplicado | Tags | Deve bloquear (unique por usuário) |
| TG-04 | Editar nome de tag existente | Tags | — |
| TG-05 | Editar cor de tag existente | Tags | — |
| TG-06 | Editar ícone de tag existente | Tags | — |
| TG-07 | Excluir tag | Tags | Remove vínculos com transações |
| TG-08 | Verificar que transações vinculadas permanecem após exclusão da tag | Tags | Só o vínculo é removido |

---

### Instituições

| # | Ação | Módulo | Observações |
|---|---|---|---|
| I-01 | Criar instituição com tipo, cor e ícone | Instituições | — |
| I-02 | Editar instituição existente | Instituições | — |
| I-03 | Expandir card de instituição | Instituições | Ver contas e passivos |
| I-04 | Adicionar conta a uma instituição | Instituições | — |
| I-05 | Adicionar conta de cartão com limite | Instituições | Campo limite disponível |
| I-06 | Editar conta existente | Instituições | — |
| I-07 | Excluir conta | Instituições | — |
| I-08 | Excluir instituição | Instituições | Remove contas, limpa FKs de passivos/transações |
| I-09 | Verificar que passivos vinculados aparecem no card | Instituições | — |
| I-10 | Verificar cards de resumo (total contas, total passivos) | Instituições | — |

---

### Bens e Imóveis

| # | Ação | Módulo | Observações |
|---|---|---|---|
| B-01 | Criar imóvel com endereço | Bens | — |
| B-02 | Criar veículo com marca, modelo, ano, placa | Bens | — |
| B-03 | Criar outro bem (genérico) | Bens | — |
| B-04 | Editar bem existente | Bens | — |
| B-05 | Excluir bem | Bens | Remove despesas em cascade |
| B-06 | Expandir card de bem | Bens | Ver despesas e variação de valor |
| B-07 | Verificar variação de valor (verde = valorização) | Bens | — |
| B-08 | Verificar variação de valor (vermelho = desvalorização) | Bens | — |
| B-09 | Adicionar despesa de IPTU a imóvel | Bens | — |
| B-10 | Adicionar despesa de IPVA a veículo | Bens | — |
| B-11 | Verificar sugestões de tipo por tipo de bem | Bens | IPVA não sugerido para imóvel |
| B-12 | Marcar despesa como paga | Bens | Registra data de pagamento |
| B-13 | Desmarcar despesa paga | Bens | Volta para pendente |
| B-14 | Verificar alerta de despesa vencida | Bens | Fundo vermelho |
| B-15 | Editar despesa existente | Bens | — |
| B-16 | Excluir despesa | Bens | — |
| B-17 | Verificar totais pago/pendente no rodapé do bem | Bens | — |
| B-18 | Verificar cards de resumo globais | Bens | Bens, valor total, custo anual, vencidas |
| B-19 | Verificar widget no dashboard | Bens | Oculto quando sem bens |
| B-20 | Verificar badge de pendentes no widget | Bens | Aparece quando há despesas pendentes |

---

### Perfil

| # | Ação | Módulo | Observações |
|---|---|---|---|
| PF-01 | Fazer upload de avatar | Perfil | Redimensiona para 200×200 |
| PF-02 | Verificar preview do avatar após upload | Perfil | — |
| PF-03 | Atualizar nome | Perfil | Reflete no UserMenu |
| PF-04 | Atualizar e-mail | Perfil | — |
| PF-05 | Atualizar idade e gênero | Perfil | — |
| PF-06 | Preencher CEP e acionar auto-fill com lupa | Perfil | Preenche logradouro, cidade, estado |
| PF-07 | Preencher CEP e acionar auto-fill com Enter | Perfil | Mesmo comportamento da lupa |
| PF-08 | Tentar CEP inválido | Perfil | Deve exibir erro |
| PF-09 | Selecionar país pelo combobox | Perfil | — |
| PF-10 | Filtrar país digitando no combobox | Perfil | — |
| PF-11 | Limpar país selecionado com botão × | Perfil | — |
| PF-12 | Inserir país como texto livre | Perfil | Campo aceita texto não listado |
| PF-13 | Trocar senha com senha atual correta | Perfil | — |
| PF-14 | Tentar trocar senha com senha atual incorreta | Perfil | Deve retornar erro |
| PF-15 | Tentar nova senha < 6 caracteres | Perfil | Deve bloquear |

---

### Studio

| # | Ação | Módulo | Observações |
|---|---|---|---|
| ST-01 | Acessar /studio sem senha | Studio | Exibe formulário de login |
| ST-02 | Fazer login com senha correta | Studio | Acessa o painel |
| ST-03 | Tentar login com senha incorreta | Studio | Deve rejeitar |
| ST-04 | Clicar em "← Login" no Studio | Studio | Navega para /login |
| ST-05 | Fazer logout do Studio | Studio | Encerra ambas as sessões, vai para / |
| ST-06 | Navegar pela aba Schema | Studio | — |
| ST-07 | Expandir/colapsar tabelas na aba Schema | Studio | — |
| ST-08 | Navegar pela aba Docs | Studio | Renderiza DOCUMENTATION.md |
| ST-09 | Clicar em item do TOC lateral | Studio | Scroll suave até o heading |
| ST-10 | Verificar indentação de h3 e h4 no TOC | Studio | — |
| ST-11 | Ver lista de usuários na aba Usuários | Studio | — |
| ST-12 | Fazer reset de senha de usuário | Studio | — |
| ST-13 | Tentar reset com senha < 6 chars | Studio | Deve bloquear |
| ST-14 | Criar novo usuário | Studio | — |
| ST-15 | Verificar atualização imediata após criar usuário | Studio | Sem reload manual |
| ST-16 | Deletar usuário com confirmação inline | Studio | Cascade completo |
| ST-17 | Verificar cards de sistema na aba Dados | Studio | Usuários, registros, tamanho DB |
| ST-18 | Filtrar usuário pelo combobox da aba Dados | Studio | Por nome ou e-mail |
| ST-19 | Verificar contadores e transações recentes do usuário | Studio | — |
| ST-20 | Limpar filtro de usuário (sem seleção) | Studio | Exibe dados globais |
| ST-21 | Verificar que sessão Studio expira após 2h | Studio | — |
| ST-22 | Tentar acessar action do Studio sem cookie admin | Studio | Deve rejeitar (requireAdmin interno) |

---

### Componentes Transversais

| # | Ação | Componente | Observações |
|---|---|---|---|
| CT-01 | Usar MonthPicker — abrir dropdown | MonthPicker | — |
| CT-02 | Navegar anos no MonthPicker | MonthPicker | Setas < e > |
| CT-03 | Selecionar mês no MonthPicker | MonthPicker | Grade 4×3 |
| CT-04 | Limpar seleção do MonthPicker com × | MonthPicker | — |
| CT-05 | Verificar destaque do mês atual no MonthPicker | MonthPicker | Cyan |
| CT-06 | Abrir CountrySelect | CountrySelect | — |
| CT-07 | Filtrar países digitando | CountrySelect | — |
| CT-08 | Verificar países lusófonos no topo | CountrySelect | — |
| CT-09 | Limpar seleção no CountrySelect com × | CountrySelect | — |
| CT-10 | Verificar tooltip de item na sidebar colapsada | Sidebar | Hover |
| CT-11 | Verificar que UserMenu fecha ao clicar fora | UserMenu | useRef click-outside |

---

### Multi-Usuário / Isolamento de Dados

| # | Ação | Segurança | Observações |
|---|---|---|---|
| ISO-01 | Criar usuário A e usuário B via Studio | Isolamento | — |
| ISO-02 | Login com usuário A, criar transações | Isolamento | — |
| ISO-03 | Login com usuário B, verificar que transações de A não aparecem | Isolamento | — |
| ISO-04 | Tentar acessar rota protegida com cookie de sessão inválido | Isolamento | Redireciona para /api/clear-session |
| ISO-05 | Verificar que tags, orçamentos e metas de A não aparecem para B | Isolamento | — |

---

*Documento gerado em 20/05/2026 · Versão da plataforma: 1.3.1*  
*Para referência técnica detalhada (schema, arquitetura, decisões), consultar DOCUMENTATION.md*
