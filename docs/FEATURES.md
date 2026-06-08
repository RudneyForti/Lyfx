# Lyfx — Guia Completo de Funcionalidades
> Documento de referência para analistas financeiros, gestores de produto e material de capacitação
> Versão 1.14.0 · Junho 2026

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
   - 4.21 [Reembolso Especial](#421-reembolso-especial)
5. [Fluxos Transversais](#5-fluxos-transversais)

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

**Cards de Features**: seis cards com mini-mockups interativos ilustrando as principais capacidades: DRE Pessoal, Score de Saúde Financeira, Educação Financeira, Alertas Proativos, Passivos & Dívidas, Bens & Imóveis.

**Como Funciona**: seção em quatro passos que explica o fluxo completo: registrar transações → ver score de saúde → evoluir com pílulas educacionais.

**FAQ**: sete perguntas frequentes em formato accordion, cobrindo score de saúde financeira, educação, gratuidade, privacidade, método avalanche, importação e conceito de DRE.

**CTA Final**: chamada para ação com botão de acesso.

**Footer**: rodapé com versão atual e informações gerais do produto.

---

### 4.2 Autenticação

**Rota**: `/login`  
**Acesso**: público

O sistema de autenticação funciona em dois modos distintos:

**Modo Setup** (primeiro acesso, sem usuário cadastrado no banco):  
Exibe um formulário de criação de conta com campos: nome, e-mail, senha e confirmação de senha. Este modo é exibido automaticamente quando o sistema detecta que ainda não existe nenhum usuário cadastrado.

**Modo Login** (usuário existente):  
Exibe campos de e-mail e senha, com opção "Lembrar de mim" e link "Esqueci minha senha". Também oferece botões de login social (Google e Microsoft) quando as integrações estão ativas.

**Alternância entre modos**: o usuário pode alternar entre os modos de login e setup manualmente, independentemente do estado do banco.

**Validações**:
- Todos os campos são obrigatórios
- **Política de senha forte** (CS-33): mínimo 8 caracteres com ao menos uma letra maiúscula, uma minúscula, um número e um caractere especial. Barra visual de força com 4 níveis (Fraca / Razoável / Boa / Forte) e lista em tempo real dos requisitos ainda não atendidos.
- No modo setup, a confirmação de senha deve ser idêntica à senha — indicador em tempo real exibe "As senhas coincidem" (verde) ou "As senhas não coincidem" (vermelho)
- Botão de submit "treme" (animação shake) quando há erros de validação

**Proteção contra tentativas excessivas** (CS-32):
- Após 10 falhas de login no mesmo IP em 30 minutos: exibe desafio CAPTCHA (Cloudflare Turnstile) antes de permitir nova tentativa
- Após 15 falhas: IP bloqueado temporariamente com mensagem "Acesso temporariamente bloqueado" e contagem regressiva em minutos
- Desbloqueio automático via janela deslizante — sem necessidade de intervenção manual
- Todos os thresholds e a janela de tempo são configuráveis pelo administrador no Studio

**Login social com Google e Microsoft (CS-36)**:
- Botões "Entrar com Google" e "Entrar com Microsoft" na tela de login
- Ao clicar, o usuário é redirecionado para a tela de autorização do provedor escolhido
- Após autorização, o sistema vincula a conta social ao usuário existente (mesmo e-mail) ou cria um novo usuário automaticamente
- Se as credenciais de um provedor não estiverem configuradas, o botão correspondente aparece desabilitado visualmente
- Erros de autenticação são exibidos na tela de login com mensagem em português (sem poluir a URL)

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

### 4.10 Alertas e Notificações

**Rota**: `/alerts`  
**Acesso**: requer login

O sistema de alertas e notificações do Lyfx opera em duas camadas distintas, com propósitos e comportamentos diferentes.

#### Camada 1 — Alertas Financeiros Automáticos

Calculados em tempo real a cada acesso, com base no estado atual dos dados do usuário. **Não são persistidos no banco** — aparecem enquanto a condição existe e desaparecem quando resolvida. O usuário não pode descartá-los manualmente; eles somem sozinhos quando o problema é corrigido.

| Tipo | Severidade | Quando aparece |
|---|---|---|
| Orçamento — Aviso | ⚠ Amarelo | Categoria atingiu 80–99% da alocação definida |
| Orçamento — Crítico | 🔴 Vermelho | Categoria ultrapassou 100% da alocação (estouro) |
| Meta — Aviso | ⚠ Amarelo | Cobrança do mês atual ainda não paga |
| Meta — Crítico | 🔴 Vermelho | Cobrança vencida (data passada) não paga |
| Projeção — Aviso | ⚠ Amarelo | Algum dos próximos 12 meses com saldo projetado negativo |
| Sazonal — Aviso | ⚠ Amarelo | Despesa anual com vencimento em ≤ 2 meses |
| Passivo Crítico — Perigo | 🔴 Vermelho | Cheque especial ou crédito rotativo ativo (saldo > 0) |

O alerta de Passivo Crítico é especialmente importante: além de exibir a taxa ao mês, calcula automaticamente o equivalente ao ano pela fórmula de juros compostos, tornando visível a devastação real de taxas predatórias. Dívida com 12% ao mês equivale a 286% ao ano — um número que por si só motiva ação.

Cada alerta tem link direto para o módulo responsável, permitindo ir direto ao ponto e resolver o problema sem navegar pela plataforma.

#### Camada 2 — Notificações do Sistema

Mensagens enviadas pelo administrador ou geradas automaticamente por eventos do sistema. **São persistidas no banco** e ficam disponíveis até serem lidas ou descartadas pelo usuário.

**Sino no menu do usuário**: ícone no canto superior direito da tela com badge vermelho indicando notificações não lidas. Ao clicar, abre um dropdown com duas seções:
- **Alertas financeiros**: resumo dos alertas críticos ativos (quantidade e tipo)
- **Notificações**: mensagens individuais do sistema, cada uma com botão para excluir

**Tipos de notificação:**
- **Boas-vindas**: enviada automaticamente ao criar um novo usuário via Studio
- **Comunicados**: enviadas pelo administrador via Studio, podendo ser direcionadas a um usuário específico ou a todos os usuários de um plano

**Diferença crucial entre alertas e notificações**: alertas não têm botão de excluir — eles existem enquanto o problema existir. Notificações podem ser descartadas individualmente ou em massa ("Limpar tudo"), pois são comunicados que o usuário pode dispensar após leitura.

#### Interface da página `/alerts`

A página consolida ambas as camadas em visão organizada:
- Alertas financeiros agrupados por severidade (crítico antes de aviso)
- Seção de notificações do sistema separada
- Chips no topo com contagens por tipo
- **Estado "Tudo em Ordem"**: ícone de sino verde quando não há alertas nem notificações pendentes

**Por que isso importa para o negócio**: a maioria das pessoas perde dinheiro não por falta de dados, mas por falta de visibilidade oportuna dos problemas. Um alerta de passivo crítico que aparece na tela antes de um compromisso financeiro pode evitar uma decisão que custaria centenas de reais em juros. O sistema de alertas é o mecanismo central de intervenção proativa da plataforma.

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
Estima a reserva de emergência acumulada. O usuário pode declarar o saldo real do fundo de reserva via editor inline na página de Saúde Financeira (`reserveBalance` em Settings). Se não preenchido, o sistema usa como proxy a soma histórica dos lançamentos de "Alocação de Longo Prazo". O valor é comparado com a média de despesas dos últimos 3 meses para calcular quantos meses de autonomia o usuário tem. Pontuação máxima quando a reserva cobre 6 meses ou mais.

#### Dimension Cards

Cada dimensão é exibida em um card individual com:
- Pontuação atual e máxima possível
- Barra de progresso proporcional
- Descrição contextual do que a pontuação atual significa

#### Badge de Perfil

Exibe o perfil atual (nome + faixa de pontos) e indica quantos pontos faltam para avançar ao perfil seguinte — criando um objetivo tangível.

#### Tip Prioritizado

Banner com a dica mais relevante baseada na dimensão de menor pontuação. Se o usuário tem score baixo em Reserva, a dica aborda como construir a reserva. Se a dimensão mais fraca é Comprometimento, aborda estratégias de quitação.

#### Declaração do Fundo de Reserva

Campo editor inline no card da dimensão Reserva. O usuário pode informar diretamente o saldo atual do seu fundo de emergência (ex: R$ 12.400 guardados na poupança). Este valor substitui o cálculo proxy e torna o diagnóstico da dimensão Reserva mais preciso.

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

**Rota**: `/education`, `/education/[pillId]`  
**Acesso**: requer login

Módulo de educação financeira gamificado com conteúdo adaptado ao perfil de saúde financeira do usuário. Combina leitura estruturada, quiz de fixação e acompanhamento de consistência semanal.

#### Perfis de Conteúdo

O conteúdo é organizado em 5 perfis que espelham os perfis do score de saúde financeira:

| Perfil | Faixa Score | Foco |
|---|---|---|
| **critical** | 0–19 | Sobrevivência financeira, dívidas urgentes, cheque especial |
| **serious** | 20–39 | Estabilização, corte de gastos, fundo mínimo |
| **unstable** | 40–59 | Orçamento, reserva de emergência, primeiros investimentos |
| **stable** | 60–79 | Otimização, metas, diversificação |
| **healthy** | 80–100 | Crescimento patrimonial, estratégia avançada, proteção |

Ao entrar em `/education`, o sistema identifica o perfil atual do usuário e destaca automaticamente a trilha recomendada.

#### Hub de Educação (`/education`)

Tela principal com visão geral de todas as trilhas:

- **Barra de progresso por perfil**: percentual de pílulas concluídas em cada trilha
- **Grid de pílulas**: cada pílula exibida como card com título, status (concluída / pendente) e ícone
- **Filtro de perfil**: permite navegar entre as 5 trilhas
- **Contador de streak**: exibido no topo com chama e número de semanas consecutivas
- **Perfil recomendado em destaque**: a trilha correspondente ao score atual fica destacada

#### Leitura de Pílula (`/education/[pillId]`)

Ao clicar em uma pílula, o usuário acessa a página de leitura:

**Timer silencioso**: registrado com `useRef` no momento do primeiro render. O tempo decorrido é calculado no momento do envio do quiz, sem exibição ao usuário — apenas armazenado no banco junto com o progresso.

**Seções tipadas de conteúdo**: cada pílula tem até 3 seções com tipos visuais distintos:
- `concept`: fundo neutro, descrição do conceito
- `why`: fundo âmbar suave, por que isso importa
- `how`: fundo verde suave, como aplicar na prática

**Quiz de Fixação**: ao final da leitura, uma pergunta de múltipla escolha com 4 opções. O usuário clica em uma opção e:
- A opção correta fica verde com ícone de confirmação
- Opções incorretas ficam vermelhas com ícone de erro
- As opções ficam bloqueadas após a primeira escolha

**Conclusão**: após responder o quiz, o botão "Concluir pílula" envia o progresso (pillId, perfil, tempo gasto, acerto do quiz) via Server Action `completePill()`. O progresso é salvo em `PillProgress`.

**Pílula já concluída**: se o usuário já completou a pílula em sessão anterior, um banner informativo aparece no topo indicando a data de conclusão. O conteúdo permanece acessível para releitura, mas o quiz fica bloqueado e o progresso não é reescrito.

**Próxima pílula**: após concluir, um card sugere automaticamente a próxima pílula não concluída da mesma trilha.

#### Streak Semanal

O sistema de streak mede **consistência semanal** — não diária — para ser mais alcançável:

- Uma semana com pelo menos 1 pílula concluída conta como semana ativa
- O histórico exibe as últimas **12 semanas** como blocos coloridos (ativo/inativo)
- A semana corrente sem atividade **não quebra** o streak (aguarda ação até o fim da semana)
- O streak cresce contando semanas consecutivas com atividade a partir da semana mais recente

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

Formulário separado:
- **Senha atual**: verificada contra o hash armazenado antes de qualquer alteração
- **Nova senha**: deve atender à política de senha forte (8+ caracteres, maiúscula, minúscula, número, especial) com barra visual de força em tempo real
- Proteção contra alteração sem conhecer a senha atual
- Após troca bem-sucedida, todas as outras sessões ativas são encerradas automaticamente — somente a sessão atual permanece

#### Sessões Ativas (CS-34)

Seção dedicada ao gerenciamento de todos os dispositivos onde o usuário está logado:

- Cada sessão exibe: IP de origem, informação do navegador/dispositivo e tempo da última atividade (relativo: "há 2 horas")
- A sessão atual é destacada com badge "Esta sessão"
- **Revogar sessão individual**: encerra o acesso de um dispositivo específico sem afetar os demais
- **Sair de todos os outros dispositivos**: revoga todas as sessões exceto a atual em uma única operação — útil ao detectar acesso não autorizado ou ao deixar um computador público

#### Histórico de Segurança (CS-35)

Registro dos últimos 50 eventos de segurança da conta:

- Cada evento exibe: ícone colorido por tipo, descrição legível, IP de origem e tempo relativo
- Tipos de eventos registrados: login realizado, tentativa de login falhou, logout, senha alterada, sessão revogada, todas as sessões revogadas, 2FA ativado/desativado, código de backup utilizado
- Botão "Atualizar" para recarregar o histórico sem recarregar a página inteira

#### Autenticação em Dois Fatores — 2FA (CS-37a)

Proteção adicional contra acesso não autorizado mesmo que a senha seja comprometida. Usa o padrão TOTP (Time-based One-Time Password), compatível com Google Authenticator, Authy e qualquer aplicativo autenticador TOTP.

**Ativar o 2FA:**
1. Na seção Segurança do perfil, clique em "Ativar 2FA"
2. Escaneie o QR Code com o aplicativo autenticador (ou insira o código manualmente)
3. Digite o código de 6 dígitos exibido no app para confirmar a configuração
4. **Guarde os 8 códigos de backup** em local seguro — cada um pode ser usado uma única vez para entrar caso você perca o acesso ao autenticador

**Login com 2FA ativo:**
- Após digitar e-mail e senha corretamente, o sistema solicita o código do autenticador
- O código é válido por 30 segundos e se renova automaticamente no app
- Se não tiver acesso ao autenticador, clique em "Usar código de backup" e insira um dos códigos salvos

**Gerenciamento:**
- **Regenerar códigos**: gera 8 novos códigos e invalida os anteriores (requer código TOTP)
- **Desativar 2FA**: remove a proteção adicional (requer código TOTP para confirmar)

---

### 4.20 Studio (Administração)

**Rota**: `/studio`  
**Acesso**: senha separada (`ADMIN_SECRET`) — independente da sessão do usuário

Painel de administração da plataforma. Acessível via link discreto na tela de login. Organizado em 10 abas: **Painel · Usuários · Planos · Módulos · Segurança · Roadmap · Notas · Dados · Schema · Documentação**.

#### Autenticação do Studio

Formulário de senha separado. A senha do Studio é configurada pelo administrador e não tem relação com as senhas dos usuários do aplicativo. A sessão do Studio expira em 2 horas — tempo suficiente para as operações administrativas típicas, com expiração curta por segurança.

O botão "← Login" retorna para a tela de login do aplicativo sem encerrar a sessão.

**Logout do Studio**: ao clicar em Sair, a sessão do Studio **e** a sessão do usuário são encerradas simultaneamente. O motivo: o administrador costuma acessar o Studio a partir de uma sessão de usuário já aberta. Encerrar ambas em uma única operação evita que a conta fique aberta no navegador após o trabalho administrativo.

#### Aba Painel

Dashboard de gestão do software. Responde à pergunta "como está a saúde operacional da plataforma?".

**Métricas do sistema** (6 cards):
- Usuários cadastrados
- Total de registros no banco (todas as tabelas)
- Espaço em disco utilizado pelo banco de dados
- Número de planos ativos
- Versão em desenvolvimento (ambiente dev)
- Versão em produção (ambiente prod) — permite comparar as duas versões ao mesmo tempo

**Gauges operacionais**: indicadores visuais de RAM, memória de heap e uso de CPU do servidor. O usuário sem conhecimento técnico pode verificar se "o servidor está sobrecarregado" de forma intuitiva.

**Configurações globais**:
- **Modo manutenção**: ao ativar, exibe um banner amarelo no topo de todas as telas da plataforma, avisando todos os usuários simultaneamente. Útil durante atualizações ou durante trabalhos técnicos.
- **Mensagem do banner**: texto configurável que aparece no banner de manutenção — permite orientar os usuários sobre o que está acontecendo e quando voltará ao normal.

#### Aba Usuários

Gestão completa dos usuários da plataforma.

- **Lista**: avatar, nome, e-mail, data de cadastro e indicador de quando o usuário esteve online pela última vez
- **Reset de senha**: o administrador pode redefinir a senha de qualquer usuário sem conhecer a senha atual — necessário quando o usuário esquece e não há recuperação por e-mail
- **Criar usuário**: formulário inline para criar novas contas. Ao criar, uma notificação de boas-vindas é enviada automaticamente ao novo usuário
- **Deletar usuário**: exclusão completa e irreversível com todos os dados associados. Confirmação inline antes de executar

#### Aba Planos

Controle de acesso baseado em planos. Define quais módulos cada grupo de usuários pode ver na plataforma.

Dois planos padrão:
- **Full**: acesso a todos os módulos estáveis (sem módulos em beta)
- **Insider**: acesso a todos os módulos incluindo os que estão em desenvolvimento/beta

O Studio cria os planos automaticamente com o clique de um botão. A distinção entre Full e Insider permite liberar funcionalidades novas para usuários de confiança antes de disponibilizar para todos.

#### Aba Módulos

Lista todos os módulos do sistema com controle de visibilidade.

**Toggle Beta por módulo**: o administrador pode marcar qualquer módulo como "em beta" a qualquer momento, sem precisar reiniciar o servidor. Módulos marcados como beta exibem um chip amarelo "Beta" na barra lateral para todos os usuários — comunicando que a funcionalidade está disponível mas ainda em desenvolvimento.

Isso permite o lançamento gradual de novos módulos: libera-se para usuários Insider primeiro (plan Insider inclui betas), coleta feedback, depois remove o badge beta quando o módulo estiver maduro.

#### Aba Segurança (CS-35)

Histórico consolidado de eventos de segurança de **todos os usuários** da plataforma.

- Lista todos os eventos de login, logout, trocas de senha, revogações de sessão e tentativas falhas de acesso
- **Filtro por usuário**: permite visualizar o histórico de um usuário específico, facilitando a investigação de incidentes
- **Filtro por tipo de evento**: permite filtrar apenas eventos de uma categoria (ex: somente falhas de login)
- Cada evento exibe: tipo com ícone colorido, descrição, nome do usuário, e-mail, IP de origem e momento do evento

#### Aba Roadmap (CS-20)

Quadro Kanban de gestão das Change Specs (CSs) do projeto. Funciona como um board estilo Trello dentro do próprio Studio, permitindo acompanhar o ciclo de vida de cada funcionalidade.

**4 colunas fixas:**
- **Backlog** — funcionalidades planejadas, ainda não iniciadas
- **Em andamento** — trabalho em progresso na sessão atual
- **Bloqueado** — aguardando dependência externa (domínio, chaves de API, documento, etc.)
- **Concluídas** — histórico completo de tudo que foi entregue

**Funcionalidades do board:**
- **Drag-and-drop**: arraste um card entre colunas para atualizar o status
- **Modal de detalhes**: clique em qualquer card para abrir o editor completo com título, descrição/visão da CS, labels, versão em que foi entregue, commit hash e data de conclusão
- **Ordenação por coluna**: cada coluna tem um toggle para ordenar por mais nova ou mais antiga — a coluna Concluídas ordena por `completedAt`
- **Adicionar card**: formulário inline no topo de cada coluna

**Persistência**: os dados ficam em `docs/cs-board.json` dentro do repositório — sobrevive a resets do banco de dados e segue o versionamento Git naturalmente.

#### Aba Notas

Editor Markdown persistente para anotações administrativas. O administrador pode documentar decisões, pendências, observações sobre usuários ou qualquer informação relevante para a operação.

Funciona como um bloco de notas rico: suporte a títulos, listas, checklists, citações e blocos de código. Slash commands no estilo Notion (`/h1`, `/bold`, `/todo`, etc.) aceleram a formatação. Atalhos de teclado (`Ctrl+B`, `Ctrl+I`, `Ctrl+S`) para quem prefere o teclado.

#### Aba Notificações

Envio de comunicados para os usuários da plataforma.

- **Por plano**: envia uma notificação para todos os usuários de um plano (ex: avisar todos os usuários Full sobre uma nova funcionalidade)
- **Por usuário**: envia para um usuário específico
- **Histórico de broadcasts**: lista dos comunicados já enviados com data e destinatário

As notificações aparecem no sino do usuário na plataforma principal.

#### Aba Dados

Visão dos dados em produção.

- **Filtro por usuário**: combobox para selecionar qualquer usuário e ver suas métricas (contagem de registros por tipo, transações recentes)
- **Visão global**: as 10 transações mais recentes de todo o sistema quando nenhum usuário está selecionado

#### Aba Schema

Diagrama ERD (Entity-Relationship Diagram) interativo do banco de dados. Cada tabela pode ser expandida/colapsada individualmente para facilitar a leitura. Linhas de relação mostram as conexões entre tabelas. Ideal para auditorias e para entender a estrutura de dados da plataforma.

#### Aba Documentação

Renderização completa da documentação técnica (`DOCUMENTATION.md`) diretamente no painel, com índice lateral clicável. Permite ao administrador consultar a documentação técnica sem precisar abrir o repositório.

---

### 4.21 Reembolso Especial

**Rota**: `/km-reimbursement`  
**Acesso**: requer login · plano com módulo habilitado

Módulo corporativo completo para controle de reembolso de quilometragem e despesas de viagem. Criado para profissionais que precisam prestar contas ao empregador e precisam de documentação rastreável, cálculo automático e geração de relatório formal.

#### O problema que resolve

Quem trabalha com mobilidade corporativa conhece o ciclo: anotar cada trajeto num bloco de notas, calcular manualmente os quilômetros, encontrar todas as notas de combustível, somar cada pedágio e estacionamento, montar um relatório no Excel ou Google Sheets e copiar tudo para o SAP no fechamento do mês. Qualquer erro nesse processo resulta em reembolso errado ou em retrabalho.

O Reembolso Especial automatiza toda essa cadeia: calcula a taxa por km com base no preço real do combustível que o usuário abasteceu, valida se há documentação suficiente (mínimo de 15% do valor em km, por exigência contábil), monta o demonstrativo formatado para copiar direto no SAP, e gera um PDF de apresentação profissional como comprovante.

#### Como funciona — o fluxo completo

**1. Abrir uma solicitação**: o usuário cria um período informando nome, datas (início e fim — pode ser 1 dia ou o mês inteiro), tipo de combustível e dados do veículo.

**2. Registrar trajetos**: para cada deslocamento, informa origem, destino e quilometragem. O sistema integra com o Google Maps: ao digitar os endereços, o mapa calcula a distância automaticamente. O usuário pode arrastar os pontos do trajeto no mapa para ajustar rotas alternativas. A quilometragem é preenchida automaticamente mas é editável.

**3. Registrar notas de combustível**: para cada abastecimento, informa data, tipo de combustível, litros e valor total. O sistema calcula automaticamente o **preço médio ponderado por litro** — se o usuário abasteceu com preços diferentes ao longo do período, a média leva em conta a quantidade de cada abastecimento. A fórmula: preço médio = soma dos valores totais ÷ soma dos litros.

**4. Registrar despesas extras**: pedágios, estacionamentos, hospedagens, alimentação, taxi e outras despesas relacionadas à viagem corporativa.

**5. Verificar o resumo**: a plataforma exibe o demonstrativo completo:
- Combustível: tipo, preço médio por litro, taxa calculada (ex: 25% do preço da gasolina)
- Quilômetros rodados e valor por km
- Total km + total despesas extras + **GRAND TOTAL**
- Validação: valor total das notas de combustível apresentadas vs. mínimo exigido (15% do valor km)

**6. Copiar para o SAP**: um botão copia o resumo formatado na estrutura exata que o sistema corporativo espera, eliminando digitação manual e erros de transcrição.

**7. Marcar como enviado**: ao confirmar o envio, a plataforma:
- Registra a data de envio
- Calcula a **data prevista de pagamento (D+5 dias úteis)** — pulando automaticamente fins de semana e **feriados nacionais** (integração com calendário oficial via BrasilAPI)
- Cria uma **Transação de crédito** no valor total com a data D+5, que aparece no Dashboard e no DRE como receita variável futura
- A transação tem a descrição "Reembolso Especial — [nome do período]" para rastreabilidade

**8. Dar baixa quando receber**: quando o pagamento cair na conta, o usuário confirma e a transação já está registrada no mês correto.

#### Onde a informação vai e como interage com outros módulos

| Dado coletado | Onde aparece | Como afeta |
|---|---|---|
| Período com datas | `/km-reimbursement` (histórico) | Rastreio de solicitações abertas/enviadas |
| Trajetos com km | Resumo + PDF | Compõe o valor de km a reembolsar |
| Notas de combustível | Resumo + validação 15% | Define o preço médio e valida documentação |
| Despesas extras | Resumo + PDF | Soma ao valor total da solicitação |
| Grand total ao enviar | `/transactions` como credit_variable | Aparece no DRE → Saúde Financeira → Projeções |
| D+5 dias úteis | Data da transação criada | Aparece no mês correto no Dashboard/Relatórios |

#### Lugares Salvos

Sub-módulo em `/km-reimbursement/places` para cadastrar rotas frequentes — o trajeto casa→escritório, por exemplo, que se repete dezenas de vezes por mês.

Ao salvar um lugar, o usuário configura:
- Nome do lugar (ex: "Casa → Sede")
- Endereço de origem e destino
- Rota preferida (configurada visualmente no mapa)
- Veículos associados

Na hora de registrar trajetos no período, um clique no lugar salvo preenche automaticamente origem, destino e quilometragem, evitando re-digitação a cada lançamento.

#### Configurações

Em `/km-reimbursement/settings`, o usuário pode ajustar:
- **Taxa gasolina**: percentual do preço por litro que constitui o reembolso (padrão: 25%)
- **Taxa etanol**: percentual equivalente para etanol (padrão: 36% — etanol exige mais litros por km)
- **Mínimo de notas**: percentual mínimo do valor km que deve ser coberto por notas de combustível para aprovação contábil (padrão: 15%)
- **Prazo de pagamento**: dias úteis até o pagamento esperado (padrão: D+5)

#### O PDF — Demonstrativo de Rotas

O PDF gerado é um documento de apresentação profissional, não apenas um relatório de dados. É gerado pelo servidor (não no navegador), garantindo consistência visual independente do dispositivo do usuário.

Conteúdo do PDF:
- **Cabeçalho**: logotipo Lyfx, título "Demonstrativo de Rotas", nome do período, datas, veículo, valor total e quilometragem total
- **Página de trajetos**: cada trajeto em card separado com origem, destino, km e observações. Cada trajeto tem o mapa da rota embutido como imagem (via Google Static Maps API)
- **Resumo consolidado**: todos os cálculos, validação de combustível e datas de envio/pagamento esperado

O PDF serve como comprovante formal da solicitação, adequado para arquivamento e auditoria.

#### Por que 25% da gasolina como taxa?

A taxa de reembolso por km tenta capturar o custo real de rodar um veículo. Estudos de custos operacionais de frotas (ex: metodologia do DNIT/ANTT e literatura de fleet management) indicam que combustível representa aproximadamente 25-30% do custo total por km para veículos de passeio (o restante inclui depreciação, pneus, manutenção, seguro). O Lyfx usa 25% como padrão conservador, mas permite que o usuário ajuste conforme a política da empresa.

A taxa de etanol é maior (36%) porque veículos flex consomem em média 30-40% mais litros por km rodado com etanol vs. gasolina, o que justifica uma taxa percentual mais alta sobre o preço do litro para chegar ao mesmo valor por km.

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

### Fluxo H — Educação e perfil de saúde

Ao acessar `/education`:
1. O sistema busca o score de saúde do mês atual via `getHealthData()`
2. O perfil do score (`critical` / `serious` / `unstable` / `stable` / `healthy`) é mapeado para o perfil de pílulas
3. A trilha correspondente é destacada no hub como "Recomendada"
4. Ao concluir uma pílula em `/education/[pillId]`, o progresso é salvo em `PillProgress` via `completePill()`
5. O streak semanal é recalculado na próxima renderização do hub
6. A próxima pílula não concluída da mesma trilha é sugerida automaticamente

### Fluxo I — Reembolso Especial e seu ciclo de vida

Um período de Reembolso Especial percorre o seguinte caminho:

1. **Criação**: usuário cria período em `/km-reimbursement/new` com nome, datas, combustível, veículo → KmPeriod criado com status `open`
2. **Lançamentos**: usuário registra trajetos (KmRoute), notas de combustível (KmReceipt) e despesas extras (KmExpense) — a cada novo lançamento, os totais do período são recalculados automaticamente
3. **Resumo**: aba "Resumo" mostra demonstrativo formatado para cópia no SAP; validação de combustível mostra verde/vermelho
4. **Envio**: ao clicar "Marcar como enviado":
   - KmPeriod.status → `submitted`
   - Data de envio registrada
   - D+5 dias úteis calculado (pulando sábados e domingos)
   - **Transaction criada**: tipo `credit`, categoria `credit_variable`, amount = grandTotal, date = D+5, description = "Reembolso Especial — {nome}"
   - transactionId salvo no KmPeriod para rastreabilidade
5. **Impacto no Dashboard**: a Transaction criada aparece no DRE do mês do D+5, afetando KPI de receita e score de saúde
6. **Reabrir (se necessário)**: ao reabrir um período, a Transaction é deletada e o KmPeriod volta para `open`
7. **PDF**: disponível a qualquer momento após ter trajetos; gerado pelo servidor com mapas de rota embutidos

---

*Versão 1.11.0 · Junho 2026*  
*Para o plano de testes detalhado, consultar `docs/QA-TEST-PLAN.md`. Para referência técnica (schema, arquitetura, decisões), consultar `DOCUMENTATION.md`.*
