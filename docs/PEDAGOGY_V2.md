# Lyfx — Metodologia Educacional
## Documento de referência para o módulo `/education`

> **Versão 2.0 · Maio 2026**
> Atualizado após revisão, adensamento e expansão da base de pílulas
> 85 pílulas conceituais · 14 obras de referência · 4 perfis de jornada
> **Módulo de treinamento da plataforma (manual de uso) documentado em seção própria — em desenvolvimento**

---

## Índice

1. [Contexto e problema a resolver](#1-contexto-e-problema-a-resolver)
2. [Arquitetura do módulo educacional](#2-arquitetura-do-módulo-educacional)
3. [Princípios pedagógicos](#3-princípios-pedagógicos)
4. [Módulo 1 — Capacitação conceitual](#4-módulo-1--capacitação-conceitual)
   - 4.1 [Arquitetura da jornada — os 4 perfis](#41-arquitetura-da-jornada--os-4-perfis)
   - 4.2 [Estrutura de cada pílula](#42-estrutura-de-cada-pílula)
   - 4.3 [Schema JSON](#43-schema-json)
   - 4.4 [Catálogo completo de pílulas](#44-catálogo-completo-de-pílulas)
5. [Módulo 2 — Treinamento da plataforma](#5-módulo-2--treinamento-da-plataforma)
6. [Fundamentos teóricos — os 17 princípios comportamentais](#6-fundamentos-teóricos--os-17-princípios-comportamentais)
7. [Mapeamento bibliográfico por perfil](#7-mapeamento-bibliográfico-por-perfil)
8. [Referências bibliográficas](#8-referências-bibliográficas)

---

## 1. Contexto e problema a resolver

O Lyfx é uma plataforma de controle financeiro pessoal construída para um público específico: pessoas entre 2 e 5 salários mínimos no Brasil que enfrentam o problema do **ralo maior que a torneira** — gastar mais do que se ganha, ou ganhar mais sem que isso mude a situação financeira, porque os gastos crescem na mesma proporção.

A maioria dos aplicativos financeiros resolve apenas o problema do registro. O Lyfx vai além ao aplicar o DRE (Demonstração do Resultado do Exercício) empresarial às finanças pessoais, organizando cada lançamento por natureza — fixo, variável, comprometido, sazonal, intencional, imprevisível — e calculando margens intermediárias que revelam **em qual camada o dinheiro desaparece**.

O módulo de educação (`/education`) existe para resolver dois problemas que o registro sozinho não resolve:

**Problema 1 — A lacuna entre saber e fazer.** Pesquisas em psicologia comportamental são unânimes: informação por si só raramente muda comportamento. As pessoas sabem que dívida de cartão é cara. Sabem que guardar dinheiro é importante. Continuam não fazendo. O Módulo 1 (capacitação conceitual) existe para fechar essa lacuna com compreensão do porquê dos comportamentos, acompanhada de sistemas e reflexões que facilitam a mudança.

**Problema 2 — A subutilização da ferramenta.** Uma plataforma com a profundidade analítica do Lyfx exige que o usuário entenda o que está olhando. DRE com margens intermediárias, score de saúde em quatro dimensões, provisão sazonal automática, passivos em modo recuperação — esses conceitos precisam ser ensinados para que o usuário extraia valor real deles. O Módulo 2 (treinamento da plataforma) existe para transformar o usuário em operador consciente da ferramenta, não apenas em cadastrador de lançamentos.

> *"Pessoas que entendem por que um comportamento é prejudicial mudam mais facilmente do que as que simplesmente são instruídas a mudar."*
> — Dan Ariely, Previsivelmente Irracional

---

## 2. Arquitetura do módulo educacional

O módulo `/education` é composto por dois submódulos com objetivos, formatos e cadências distintos:

```
/education
├── /concepts     → Módulo 1: Capacitação conceitual
│   └── 85 pílulas organizadas por perfil de score (0–100)
│       Formato: pílula de até 10 min + quiz de fixação
│       Cadência: entrega contextual conforme score do usuário
│
└── /platform     → Módulo 2: Treinamento da plataforma
    └── Manual de uso de cada módulo do Lyfx
        Formato: guia interativo + walkthrough contextual
        Cadência: onboarding inicial + acesso sob demanda
        Status: EM DESENVOLVIMENTO
```

Os dois módulos são complementares mas independentes. O usuário pode consumir pílulas conceituais sobre reserva de emergência (Módulo 1) e simultaneamente aprender como cadastrar a reserva declarada no Lyfx (Módulo 2). Um reforça o porquê; o outro ensina o como.

---

## 3. Princípios pedagógicos

Os princípios abaixo se aplicam a ambos os módulos, com adaptações de formato onde indicado.

### 3.1 Hábitos atômicos como metodologia de cadência

O conteúdo educacional é projetado segundo a lógica de hábitos atômicos: pequenas ações consistentes, repetidas ao longo do tempo, geram impacto maior do que grandes esforços episódicos. Isso se traduz em três regras operacionais:

- Pílulas de até 10 minutos: cada unidade de conteúdo deve ser consumível em uma sessão curta, sem comprometer o restante do dia
- Cadência constante: o valor está na recorrência, não no volume por sessão
- Acumulação progressiva: cada pílula constrói sobre as anteriores, criando uma base crescente de conhecimento e consciência

### 3.2 Conteúdo condicionado ao contexto do usuário

Nenhum conteúdo é genérico. No Módulo 1, cada pílula pertence a um perfil de saúde financeira calculado pela plataforma (score de 0 a 100) — um usuário em recuperação não recebe conteúdo sobre diversificação de portfólio. No Módulo 2, o guia de uso de cada módulo é apresentado no momento em que o usuário vai utilizá-lo pela primeira vez. O conteúdo sempre chega quando é relevante, não antes.

### 3.3 Tom empático, nunca punitivo

O comportamento financeiro inadequado não é fraqueza de caráter — é o resultado previsível de mecanismos psicológicos documentados, crenças formadas na infância e um ambiente projetado para maximizar consumo. O conteúdo explica o porquê dos comportamentos antes de propor qualquer mudança. Nunca culpa. Nunca envergonha.

> *"O comportamento financeiro não muda com vergonha — muda com sistemas."*
> — Morgan Housel, A Psicologia Financeira

### 3.4 Literatura como âncora, linguagem como interface

Os 14 livros da base bibliográfica são destilados em linguagem acessível. O usuário absorve os conceitos sem precisar saber que existe um Nobel por trás (Kahneman, Thaler), um best-seller americano (Sethi, Ramsey, Kiyosaki) ou uma pesquisa de décadas (Stanley & Danko). O rigor acadêmico e empírico está presente na estrutura; a linguagem é do cotidiano brasileiro.

### 3.5 Reflexão como mecanismo de transferência

Cada pílula conceitual termina com uma pergunta de reflexão que convida o usuário a conectar o conceito à sua própria realidade. Isso ativa o que Kahneman chama de Sistema 2 — o pensamento deliberado e racional — em relação à vida financeira real do usuário, não a exemplos genéricos.

### 3.6 Quiz como diagnóstico, não punição

O quiz de fixação ao final de cada pílula não avalia aprovação ou reprovação. Avalia absorção. Cada alternativa — inclusive as incorretas — tem feedback explicativo que amplia o entendimento. Errar o quiz é uma oportunidade de aprender, não de ser julgado.

---

## 4. Módulo 1 — Capacitação conceitual

### 4.1 Arquitetura da jornada — os 4 perfis

O score de saúde financeira do Lyfx é calculado em quatro dimensões:

| Dimensão | Peso | Critério para pontuação máxima |
|---|---|---|
| Comprometimento com dívidas | 30 pontos | ≤ 30% da receita comprometida com passivos |
| Taxa de poupança | 25 pontos | ≥ 20% da receita direcionada ao futuro |
| Resultado do período | 25 pontos | Mês fechado no positivo |
| Reserva de emergência | 20 pontos | ≥ 6 meses de despesas cobertas |

A soma (máximo 100 pontos) determina o perfil atual do usuário e o conteúdo que ele recebe:

---

#### Perfil 1 — Em Recuperação (score 0–39)

**Situação financeira:** comprometimento elevado com dívidas, ausência de reserva, resultado mensal frequentemente negativo. Situação crítica que exige ação imediata.

**Foco pedagógico:** interromper o ciclo de endividamento. Compreender os mecanismos psicológicos que levam ao comportamento atual, mapear as dívidas com clareza, conhecer estratégias de quitação e construir os hábitos mínimos de controle.

**Progressão temática:**
- Diagnóstico emocional: por que evitamos olhar os números (evitação de dor)
- Diagnóstico financeiro: mapeamento completo das dívidas com dados reais
- Entendendo o inimigo: rotativo, cheque especial e a matemática dos juros
- Estratégias de quitação: método avalanche e método bola de neve
- Orçamento base zero: dar um endereço a cada real
- Comportamento de consumo: parcelamento, contabilidade mental, impulso
- Psicologia do gasto: Sistema 1 vs. Sistema 2
- Hábitos construtivos: pagar a si mesmo primeiro
- Mindset: roteiros invisíveis, dinheirofobia, crenças limitantes
- Motivação: a primeira dívida quitada e o poder das pequenas vitórias
- Crédito e alternativas: score, cartão como ferramenta, opções ao rotativo

**Pílulas:** 21

---

#### Perfil 2 — Estabilizado (score 40–59)

**Situação financeira:** equilíbrio frágil. Dívidas críticas sob controle, mas sem amortecedores reais. Um imprevisto desfaz meses de progresso.

**Foco pedagógico:** construir estrutura de proteção e consolidar comportamentos. Tornar o progresso sustentável — a reserva de emergência é o instrumento central.

**Progressão temática:**
- Proteção: reserva de emergência — o que é, quanto precisa, onde guardar
- Planejamento: gastos sazonais, provisão mensal e metas com data
- Saída definitiva do cheque especial
- Sistemas: automação como substituto da força de vontade, nudge
- Perspectiva: custo de vida em horas de trabalho
- Orçamento: dados reais vs. otimismo ilusório (ilusão do planejamento)
- Conceitos: ativo vs. passivo, rentabilidade real, DRE pessoal
- Diagnóstico: PAR vs. SAR, quatro fases financeiras
- Crédito: score como ativo, cartão consciente, renegociação de taxas
- Comportamento: fungibilidade, 13° salário estratégico
- Primeiros investimentos: CDB, LCI, LCA — saindo da poupança
- Brasil: FGTS como ativo compulsório

**Pílulas:** 21

---

#### Perfil 3 — Em Construção (score 60–79)

**Situação financeira:** fundamentos sólidos. Dívidas caras eliminadas, reserva em formação, fluxo mensal positivo consistente.

**Foco pedagógico:** construção ativa de patrimônio. A pergunta deixa de ser "como não afundar" e passa a ser "como crescer".

**Progressão temática:**
- Mercado de capitais: o que são ações de verdade
- Gestão ativa vs. passiva: a batalha das taxas
- Estratégias: diversificação, rebalanceamento, aportes regulares
- Produtos: ETFs, Tesouro Direto (Selic/IPCA+/Prefixado), previdência privada, FIIs
- Comportamento do investidor: buy and hold, giro de carteira, aversão míope à perda
- Conceitos: juros compostos, IR nos investimentos, especulação vs. investimento
- Mentalidade de construção: consumo vs. acumulação, como milionários alocam tempo
- Modelos: três pistas financeiras, produtores vs. consumidores, renda ativa vs. passiva
- Objetivo: o número da independência financeira — quanto você precisa?
- Perspectiva: o cafezinho não é o problema, ilusão do fim da história
- Reflexão: criptomoedas pelo ângulo comportamental

**Pílulas:** 24

---

#### Perfil 4 — Livre (score 80–100)

**Situação financeira:** saúde financeira excelente. Patrimônio em construção ou consolidado, reserva robusta, renda passiva presente ou em formação.

**Foco pedagógico:** inteligência financeira avançada, perspectiva de longo prazo, proteção do que foi construído e criação de valor além do consumo.

**Progressão temática:**
- Estratégia avançada: diversificação por classes, geografias e correlações
- Carteira madura: alocação de ativos, rebalanceamento psicológico, margem de segurança
- Renda passiva: FIIs, alocação para independência, o ponto de cruzamento
- Mentalidade de preservação: suficiente, sorte e risco, riqueza visível vs. real
- Pessoas e relacionamentos: dinheiro no relacionamento, herança e legado
- Longo prazo: planejamento flexível, ilusão do fim da história em patrimônio
- Qualidade de vida: dinheiro e felicidade, tempo de vida como unidade de medida
- Impacto e escala: lei da efetividade, produção de valor, marca pessoal
- Aposentadoria: quando parar, a psicologia da transição do acúmulo para o usufruto
- Proteção patrimonial: blindagem básica, holding, estrutura jurídica
- Responsabilidade total: humildade, vigilância e o que mantém a riqueza

**Pílulas:** 19

---

### 4.2 Estrutura de cada pílula

Cada pílula segue uma estrutura pedagógica consistente de cinco partes. A consistência é intencional: o usuário aprende como "ler" o formato, o que reduz a fricção cognitiva a cada novo consumo.

**Parte 1 — Gancho**
Uma frase ou dado que quebra um padrão, provoca surpresa ou levanta uma questão. Nunca começa com definição — começa com algo que o usuário não esperava. Função: criar curiosidade suficiente para a leitura continuar.

Estruturas típicas de gancho:
- Dado surpreendente: *"Menos de 25% das pessoas endividadas sabem o valor exato do que devem."*
- Pergunta provocadora: *"Se você parar de trabalhar amanhã, por quantos meses consegue sobreviver?"*
- Paradoxo concreto: *"R$ 500 na poupança por 30 anos = R$ 379 mil. O mesmo valor investido = R$ 1,7 milhão. A diferença não é sorte."*

**Parte 2 — Conceito**
Explicação do fenômeno em 3 a 5 blocos curtos com tipos diferenciados:

| Tipo | Função |
|---|---|
| `explanation` | O que é o fenômeno — explicação do mecanismo |
| `insight` | Por que importa — conexão com a vida financeira real |
| `practical` | Como aplicar — ação concreta e mensurável |
| `reframe` | Nova perspectiva — ressignificação do conceito |
| `reflection` | Pergunta pessoal — convite à conexão com a realidade do usuário |

Linguagem acessível, sem jargão técnico desnecessário. Usa analogias do cotidiano brasileiro. Referencia a literatura de forma transparente mas sem exigir familiaridade com os autores.

**Parte 3 — Aplicação prática**
Uma ação concreta e mensurável que o usuário pode executar ainda nesta semana. Específica — não "gaste menos", mas "liste suas três maiores despesas e verifique se alguma pode ser reduzida 10% com uma ligação". Não exige condição financeira específica para ser executada.

**Parte 4 — Reflexão pessoal**
Uma única pergunta que convida o usuário a conectar o conceito aprendido à sua própria realidade. Não tem resposta certa. Objetivo: ativar o pensamento deliberado (Sistema 2 de Kahneman) em relação à vida financeira real.

**Parte 5 — Quiz de fixação**
Uma pergunta objetiva com 3 alternativas, sendo 1 correta. Cada alternativa — incluindo as incorretas — tem um feedback explicativo que vai além de "correto" ou "incorreto". O quiz não pune: reforça. Responder errado é uma oportunidade de aprender.

---

### 4.3 Schema JSON

```json
{
  "id": "rec_01",
  "profile": "em_recuperacao",
  "order": 1,
  "title": "Por que você evita olhar para o seu extrato",
  "subtitle": "A biologia por trás do medo financeiro — e como superá-la",
  "category": "mentalidade",
  "estimatedMinutes": 7,
  "sourceRef": "Ariely & Kreisler — A Psicologia do Dinheiro; Kahneman — Rápido e Devagar",
  "content": {
    "hook": "...",
    "sections": [
      { "type": "explanation", "text": "..." },
      { "type": "insight", "text": "..." },
      { "type": "practical", "text": "..." },
      { "type": "reframe", "text": "..." },
      { "type": "reflection", "text": "..." }
    ]
  },
  "quiz": {
    "question": "...",
    "options": [
      { "id": "a", "text": "...", "correct": false, "feedback": "..." },
      { "id": "b", "text": "...", "correct": true,  "feedback": "..." },
      { "id": "c", "text": "...", "correct": false, "feedback": "..." }
    ]
  }
}
```

**Campos e restrições:**

| Campo | Tipo | Restrição |
|---|---|---|
| `id` | string | Prefixo do perfil + número sequencial (`rec_01`, `est_03`, `con_07`, `liv_02`, `dlc_*`) |
| `profile` | enum | `em_recuperacao` · `estabilizado` · `em_construcao` · `livre` |
| `order` | integer | Sequencial por perfil, sem gaps, define a ordem de entrega ao usuário |
| `estimatedMinutes` | integer | Nunca acima de 10 |
| `sections` | array | Mínimo 3 seções; tipos válidos: `explanation`, `insight`, `practical`, `reframe`, `reflection` |
| `quiz.options` | array | Exatamente 3 alternativas; exatamente 1 com `correct: true` |
| `quiz.options[].feedback` | string | Obrigatório em todas as alternativas, inclusive nas incorretas |
| `sourceRef` | string | Autores e obras de referência para aquela pílula específica |

**Categorias em uso:** mentalidade · diagnóstico · dívidas · estratégia · orçamento · comportamento · hábitos · motivação · crédito · conceito · reserva · planejamento · sistema · perspectiva · análise · investimentos · produto · prática · estratégia

---

### 4.4 Catálogo completo de pílulas

**Base atual: 85 pílulas** · arquivos: `lyfx-pills-complete.json`

---

#### Perfil Em Recuperação — 21 pílulas

| # | ID | Título | Categoria | Fonte principal |
|---|---|---|---|---|
| 1 | rec_01 | Por que você evita olhar para o seu extrato | mentalidade | Ariely; Kahneman |
| 2 | rec_02 | O número que você precisa saber antes de tudo | diagnóstico | Sethi |
| 3 | rec_03 | Rotativo e cheque especial: os ralos mais caros do Brasil | dívidas | Sethi; Housel |
| 4 | rec_04 | Método avalanche: atacar a dívida mais cara primeiro | estratégia | Sethi; Ramsey |
| 5 | rec_05 | Método bola de neve: quando a psicologia importa mais | estratégia | Ramsey |
| 6 | rec_06 | Orçamento base zero: todo real com um endereço | orçamento | Sethi; Ramsey |
| 7 | rec_07 | A anestesia do parcelamento | comportamento | Ariely |
| 8 | rec_08 | Contabilidade mental: por que tratamos dinheiros diferentes de forma diferente | comportamento | Thaler; Ariely |
| 9 | rec_09 | Pague a si mesmo primeiro | hábitos | Clason; Sethi |
| 10 | rec_10 | Sistema 1 e Sistema 2: por que você compra por impulso | comportamento | Kahneman |
| 11 | rec_11 | Roteiros invisíveis: as crenças que sabotam você | mentalidade | Sethi; Arcuri |
| 12 | rec_12 | A primeira dívida quitada: celebrando vitórias pequenas | motivação | Ramsey; Housel |
| 13 | rec_13 | Score de crédito: o número que afeta tudo | crédito | Sethi |
| 14 | rec_14 | A ilusão do planejamento: por que você gasta mais do que previu | comportamento | Kahneman |
| 15 | rec_15 | Dinheirofobia: o tabu de falar sobre dinheiro | mentalidade | Arcuri |
| 16 | rec_16 | Faxina financeira: o diagnóstico em três camadas | diagnóstico | Arcuri |
| 17 | rec_17 | Efeito posse e aversão à perda: por que é difícil largar | comportamento | Thaler; Kahneman |
| 18 | rec_18 | Poupança não é investimento: a diferença de R$ 1 milhão | conceito | Nigro; Arcuri |
| 19 | rec_new01 | A matemática que os bancos esperam que você nunca faça | dívidas | Sethi; Nigro |
| 20 | dlc_rec_01 | Cartão de crédito: vilão ou ferramenta? | crédito | Sethi; Ariely |
| 21 | dlc_rec_02 | Quando pedir emprestado faz sentido — e de onde | crédito | Sethi; Arcuri |

---

#### Perfil Estabilizado — 21 pílulas

| # | ID | Título | Categoria | Fonte principal |
|---|---|---|---|---|
| 1 | est_01 | Reserva de emergência: o que é e quanto você precisa | reserva | Sethi; Housel; Robin; Nigro |
| 2 | est_02 | Gastos sazonais: o IPTU que sempre surpreende | planejamento | Kahneman |
| 3 | est_03 | Adeus ao cheque especial: como sair do ciclo definitivamente | dívidas | Sethi |
| 4 | est_04 | Automação: seu sistema no piloto automático | sistema | Sethi; Ariely; Thaler |
| 5 | est_05 | O custo real do seu tempo | perspectiva | Robin & Dominguez |
| 6 | est_06 | Orçamento baseado em dados, não em desejos | comportamento | Kahneman |
| 7 | est_07 | Ativo vs. Passivo: o critério do fluxo de caixa | conceito | Kiyosaki |
| 8 | est_08 | Score de crédito: como o mercado vê você | crédito | Sethi |
| 9 | est_09 | Meta financeira: a diferença entre desejo e objetivo | planejamento | Sethi; Arcuri |
| 10 | est_10 | O poder de uma ligação de 5 minutos | prática | Sethi |
| 11 | est_11 | Fungibilidade: dinheiro é tudo igual | comportamento | Thaler; Ariely |
| 12 | est_12 | Nudge: pequenos empurrões para o sucesso | sistema | Thaler; Ariely |
| 13 | est_13 | PAR ou SAR? Descubra seu nível de acumulação | diagnóstico | Stanley & Danko |
| 14 | est_14 | Frugalidade estratégica | mentalidade | Stanley & Danko |
| 15 | est_15 | As quatro fases financeiras: em qual você está agora? | diagnóstico | Nigro |
| 16 | est_16 | Rentabilidade real: o que sobra de verdade | conceito | Nigro |
| 17 | est_new01 | O DRE pessoal: onde o seu dinheiro realmente desaparece | análise | Lyfx; Sethi |
| 18 | dlc_est_01 | CDB, LCI e LCA: seus primeiros investimentos reais | investimentos | Nigro; Arcuri; Sethi |
| 19 | dlc_est_02 | FGTS: o investimento compulsório que você ignora | planejamento | Arcuri |
| 20 | dlc_est_03 | 13° salário: como não desperdiçar o maior extra do ano | planejamento | Thaler; Ariely; Arcuri |
| 21 | dlc_est_04 | Cartão de crédito consciente: cashback, milhas e o ciclo que trabalha para você | crédito | Sethi |

---

#### Perfil Em Construção — 24 pílulas

| # | ID | Título | Categoria | Fonte principal |
|---|---|---|---|---|
| 1 | con_01 | O que é o mercado de ações de verdade | investimentos | Kiyosaki; Nigro; Sethi |
| 2 | con_02 | Gestão ativa vs. passiva: a batalha das taxas | análise | Sethi; Housel; Thaler |
| 3 | con_03 | Diversificação: o único almoço grátis | estratégia | Housel; Nigro |
| 4 | con_04 | ETFs: o mundo inteiro com um clique | produto | Sethi; Nigro |
| 5 | con_05 | Rebalanceamento: vendendo na alta e comprando na baixa | estratégia | Sethi; Housel |
| 6 | con_06 | Buy and Hold: o tempo é seu maior aliado | mentalidade | Housel; Sethi; Nigro |
| 7 | con_07 | O erro de girar o patrimônio | comportamento | Sethi; Thaler; Nigro |
| 8 | con_08 | Imposto de Renda nos investimentos | investimentos | Sethi; Nigro; Arcuri |
| 9 | con_09 | Juros compostos: a oitava maravilha | conceito | Clason; Housel; Nigro |
| 10 | con_10 | Aversão míope à perda: por que checar a bolsa todo dia prejudica você | comportamento | Thaler; Kahneman; Housel |
| 11 | con_11 | Ilusão do fim da história | mentalidade | Housel; Kahneman |
| 12 | con_12 | Fundos de índice e ETFs: a simplicidade que vence a complexidade | investimentos | Sethi; Thaler |
| 13 | con_13 | A relação inversa entre consumo e acumulação | mentalidade | Stanley & Danko |
| 14 | con_14 | Como os milionários alocam o tempo livre | comportamento | Stanley & Danko |
| 15 | con_15 | As três pistas financeiras | mentalidade | DeMarco |
| 16 | con_16 | Produtores vs. consumidores | mentalidade | DeMarco |
| 17 | con_17 | Renda ativa vs. renda passiva | estratégia | Kiyosaki; DeMarco |
| 18 | con_18 | Especulação vs. investimento: como não confundir os dois | conceito | Nigro |
| 19 | con_19 | O cafezinho não é o problema | perspectiva | Nigro; Sethi |
| 20 | con_new01 | Previdência privada: quando vale — e quando é armadilha | produto | Sethi; Nigro |
| 21 | dlc_con_01 | O número da independência financeira: quanto você precisa? | planejamento | Robin & Dominguez; Housel |
| 22 | dlc_con_02 | FIIs: sua introdução à renda passiva mensal | produto | Nigro; Kiyosaki |
| 23 | dlc_con_03 | Tesouro Direto: Selic, IPCA+ e Prefixado — qual escolher e quando | produto | Nigro; Arcuri |
| 24 | dlc_con_04 | Criptomoedas: o que são, o que não são — e como pensar sobre elas | conceito | Kahneman; Ariely; DeMarco |

> **Nota sobre dlc_con_04:** nenhum dos 14 livros da base bibliográfica trata especificamente de criptomoedas. A pílula aborda o tema pela lente da psicologia comportamental (FOMO, efeito manada, aversão à perda, ancoragem) sem recomendar nem desencorajar investimento. Essa posição é declarada explicitamente no início do conteúdo.

---

#### Perfil Livre — 19 pílulas

| # | ID | Título | Categoria | Fonte principal |
|---|---|---|---|---|
| 1 | liv_01 | Diversificação: o único almoço grátis | estratégia | Housel; Nigro |
| 2 | liv_02 | Alocação de ativos: o equilíbrio entre risco e retorno | investimentos | Sethi; Nigro |
| 3 | liv_03 | FIIs e renda passiva: vivendo de aluguel sem imóveis | investimentos | Nigro; Kiyosaki |
| 4 | liv_04 | O conceito do suficiente | mentalidade | Housel |
| 5 | liv_05 | Sorte e risco: as duas faces da mesma moeda | mentalidade | Housel; Kahneman |
| 6 | liv_06 | Planejamento sucessório: o legado além dos números | planejamento | Stanley & Danko; Sethi |
| 7 | liv_07 | Riqueza visível vs. riqueza real | mentalidade | Housel; Stanley & Danko |
| 8 | liv_08 | Dinheiro e felicidade: o que a pesquisa realmente diz | perspectiva | Ariely; Housel |
| 9 | liv_09 | Rebalanceamento: a disciplina da frieza | investimentos | Sethi; Nigro |
| 10 | liv_10 | A lei da efetividade: impacto em escala como caminho para a riqueza | mentalidade | DeMarco |
| 11 | liv_11 | A armadilha do consumo de status | mentalidade | Stanley & Danko; Sethi |
| 12 | liv_12 | Marca pessoal como ativo financeiro | investimentos | Nigro |
| 13 | liv_13 | Aversão à perda em grandes patrimônios | comportamento | Thaler; Kahneman |
| 14 | liv_14 | A psicologia do tempo de vida | perspectiva | Robin & Dominguez; Nigro |
| 15 | liv_15 | A responsabilidade total: quem continua rico é quem nunca para de aprender | mentalidade | Arcuri; Housel |
| 16 | liv_new01 | Margem de segurança: o princípio que protege o patrimônio do imprevisto | estratégia | Housel |
| 17 | dlc_liv_01 | Dinheiro no relacionamento: o tabu que destrói casamentos e finanças | planejamento | Housel; Thaler |
| 18 | dlc_liv_02 | Aposentadoria: quando parar — e o que acontece depois | planejamento | Robin & Dominguez; Housel |
| 19 | dlc_liv_03 | Proteção patrimonial: quando o tamanho do patrimônio cria riscos novos | planejamento | Housel |

---

## 5. Módulo 2 — Treinamento da plataforma

> **Status: em desenvolvimento.** A estrutura e o escopo estão definidos; o conteúdo será produzido em etapa subsequente.

### 5.1 Objetivo

Enquanto o Módulo 1 ensina princípios financeiros universais, o Módulo 2 ensina o usuário a operar o Lyfx com profundidade. O objetivo é que o usuário entenda não apenas o que cada número significa, mas como registrar, interpretar e agir sobre as informações que a plataforma apresenta.

Sem esse módulo, existe o risco de um usuário tecnicamente capacitado financeiramente (após consumir as pílulas conceituais) mas incapaz de extrair o diagnóstico correto da ferramenta por não saber usá-la.

### 5.2 Estrutura prevista

O Módulo 2 está organizado em trilhas correspondentes aos principais módulos da plataforma:

**Trilha 1 — Entendendo o DRE pessoal**
Como registrar transações, diferença entre naturezas (fixo, variável, comprometido, sazonal, intencional, imprevisível), o que cada margem intermediária revela, como interpretar o resultado operacional e o que fazer quando ele é negativo.

**Trilha 2 — O Score de Saúde Financeira**
Como o score é calculado, o que cada uma das quatro dimensões representa, por que o score mudou (ou não), como melhorar cada dimensão e qual é a relação entre as ações na plataforma e a evolução do score.

**Trilha 3 — Passivos e o modo Recuperação**
Como cadastrar uma dívida, o que é o modo Recuperação, como interpretar o alerta de passivo crítico (quando o mínimo não cobre os juros), como usar a plataforma para acompanhar o progresso da quitação pelo método avalanche.

**Trilha 4 — Reserva de emergência**
Como declarar a reserva, como o sistema calcula o progresso em meses de cobertura, qual a diferença entre reserva declarada e saldo em conta, e como a reserva impacta o score.

**Trilha 5 — Metas financeiras**
Como criar uma meta, definir valor e prazo, acompanhar o progresso, vincular aportes e entender a projeção de conclusão.

**Trilha 6 — Orçamento e planejamento**
Como usar o módulo de orçamento, o que é a receita esperada, como funciona a provisão sazonal automática, e como o orçamento se conecta ao DRE.

**Trilha 7 — Bens e patrimônio**
Como cadastrar bens, registrar despesas por bem, interpretar variação de valor (ativo vs. passivo pelo critério de fluxo) e calcular o custo real de manutenção do patrimônio físico.

**Trilha 8 — Alertas e ações proativas**
O que cada tipo de alerta significa, qual a urgência de cada um, como agir a partir de um alerta e como configurar preferências de notificação.

**Trilha 9 — Relatórios e benchmarking**
Como ler o DRE histórico, o que os percentuais de cada categoria significam em relação às faixas de referência, e como usar os relatórios para decisões mensais.

### 5.3 Formato previsto

Diferente das pílulas conceituais, o conteúdo de treinamento de plataforma será entregue em formato de guia contextual com elementos visuais:

- Capturas de tela anotadas com destaques nos elementos relevantes
- Fluxos passo a passo para as operações mais comuns
- Glossário de termos específicos do produto (DRE, margem operacional, score, provisão sazonal)
- FAQ por módulo com as dúvidas mais comuns
- Dicas de uso avançado (atalhos, filtros, integrações entre módulos)

### 5.4 Integração com o Módulo 1

Os dois módulos se reforçam mutuamente quando integrados. Exemplos de pontos de conexão:

| Pílula conceitual (Módulo 1) | Guia de plataforma correspondente (Módulo 2) |
|---|---|
| rec_02 — O número que você precisa saber | Como cadastrar passivos e ver o total consolidado |
| est_01 — Reserva de emergência | Como declarar a reserva e acompanhar o progresso |
| est_09 — Meta financeira | Como criar e acompanhar metas no módulo `/goals` |
| est_new01 — O DRE pessoal | Como interpretar as margens no módulo `/reports` |
| rec_04 — Método avalanche | Como usar o modo Recuperação em `/liabilities` |
| est_02 — Gastos sazonais | Como a provisão sazonal automática funciona no orçamento |

Quando o usuário lê uma pílula conceitual que tem correspondência direta com uma funcionalidade da plataforma, a interface pode exibir um link para o guia de uso correspondente — e vice-versa.

---

## 6. Fundamentos teóricos — os 17 princípios comportamentais

Esta seção documenta os princípios que fundamentam o conteúdo educacional, com origem bibliográfica rastreável e implicação direta nas pílulas.

---

**6.1 Evitação de dor financeira**
*Fonte: Ariely & Kreisler; Kahneman*
O cérebro processa perda financeira percebida nas mesmas regiões que processam dor física. A antecipação de um número negativo ativa um reflexo de evitação — boletos não abertos, extratos não consultados, dívidas cujo total não se sabe calcular. Menos de 25% das pessoas endividadas sabem o valor exato do que devem.
*Pílulas relacionadas: rec_01, rec_02*

---

**6.2 Anestesia do crédito**
*Fonte: Ariely — Previsivelmente Irracional*
Quando o benefício (a compra) chega imediatamente e o custo (o pagamento) é fragmentado e adiado, o cérebro não processa o custo real da operação. Preços terminados em 99, parcelamentos que ocultam o total e o cartão salvo com um clique existem para que a decisão seja tomada antes que o pensamento racional acorde.
*Pílulas relacionadas: rec_07, dlc_rec_01*

---

**6.3 Contabilidade mental e fungibilidade**
*Fonte: Thaler — Misbehaving; Ariely*
O cérebro cria "contas" psicológicas separadas para o dinheiro baseadas em origem ou destino percebido. Dinheiro de bônus é "extra"; dinheiro de salário é "sério". Financeiramente, R$ 1.000 é R$ 1.000 independente de onde veio. A contabilidade mental mais destrutiva é guardar na poupança (0,6%/mês) enquanto se paga rotativo (12%/mês).
*Pílulas relacionadas: rec_08, est_11, dlc_est_03*

---

**6.4 Sistema 1 e Sistema 2**
*Fonte: Kahneman — Rápido e Devagar*
O Sistema 1 é rápido, automático e emocional. O Sistema 2 é lento, deliberado e racional. A maioria das decisões financeiras ruins é tomada pelo Sistema 1 — compra por impulso, "promoção imperdível", parcelamento que não foi calculado. A solução não é mais disciplina; é criar atritos que deem tempo ao Sistema 2 de acordar.
*Pílulas relacionadas: rec_10, rec_07, est_12*

---

**6.5 Ilusão do planejamento**
*Fonte: Kahneman*
Pessoas sistematicamente subestimam custos e riscos futuros, enquanto superestimam benefícios. Todo orçamento baseado em intenção em vez de histórico real falha por esse motivo. O antídoto: usar a média dos últimos 3 meses como base, não estimativas otimistas.
*Pílulas relacionadas: rec_14, est_06*

---

**6.6 Roteiros invisíveis do dinheiro**
*Fonte: Sethi (citando Brad Klontz); Arcuri*
Crenças sobre dinheiro formadas na infância operam como programações invisíveis que governam o comportamento financeiro adulto. No contexto brasileiro, a dinheirofobia — o tabu cultural de falar sobre dinheiro — é um fenômeno específico documentado por Arcuri que impede busca de ajuda, negociação de dívidas e aprendizado básico.
*Pílulas relacionadas: rec_11, rec_15*

---

**6.7 Efeito posse e aversão à perda**
*Fonte: Thaler; Kahneman*
Valorizamos o que possuímos mais do que o que não possuímos. Perdas doem cerca de 2 vezes mais do que ganhos equivalentes trazem prazer. Isso nos mantém presos a passivos (assinaturas, bens caros) por não querer admitir a perda da escolha original, e nos faz vender investimentos na baixa por não aguentar a dor da queda nominal.
*Pílulas relacionadas: rec_17, con_10, liv_13*

---

**6.8 Nudge — arquitetura de escolha**
*Fonte: Thaler — Misbehaving*
Pequenas alterações no ambiente de escolha — tornando o comportamento correto o caminho de menor resistência — mudam comportamento sem coerção. Automação financeira é o nudge mais poderoso disponível: o que é retirado antes que o usuário "veja" não entra no circuito de decisão.
*Pílulas relacionadas: est_04, est_12*

---

**6.9 Juros compostos — nos dois sentidos**
*Fonte: Housel; Clason; Nigro*
Juros compostos são a maior força das finanças pessoais e operam com a mesma implacabilidade a favor (investimentos) e contra (dívidas). A diferença entre poupança e investimento ao longo de 30 anos pode superar R$ 1,3 milhão para o mesmo aporte mensal. Tempo é a variável mais importante — mais do que taxa de retorno ou valor do aporte.
*Pílulas relacionadas: rec_18, con_09, rec_new01*

---

**6.10 PAR vs. SAR — acumulação prodigiosa vs. sub-acumulação**
*Fonte: Stanley & Danko*
A pesquisa empírica com milionários americanos mostrou correlação negativa entre consumo visível de status e patrimônio líquido real. Acumuladores prodigiosos (PAR) vivem deliberadamente abaixo de suas posses; sub-acumuladores (SAR) consomem para sinalizar status. A fórmula do patrimônio esperado: (idade × renda anual bruta) ÷ 10.
*Pílulas relacionadas: est_13, est_14, con_13*

---

**6.11 Distinção ativo vs. passivo pelo fluxo de caixa**
*Fonte: Kiyosaki*
Ativo é o que coloca dinheiro no bolso. Passivo é o que tira. Um carro próprio é passivo. Uma casa onde se mora pode ser passivo. Um apartamento alugado é ativo. Confundir valor de mercado com geração de caixa é um dos equívocos mais comuns da formação de patrimônio.
*Pílulas relacionadas: est_07, con_17*

---

**6.12 Aversão míope à perda**
*Fonte: Thaler; Kahneman; Housel*
A combinação de aversão à perda com alta frequência de avaliação produz percepção de dor constante mesmo em carteiras que crescem no acumulado. Investidores que avaliam a carteira mensalmente obtêm retornos maiores do que os que avaliam diariamente — não porque os ativos sejam diferentes, mas porque tomam menos decisões emocionais.
*Pílulas relacionadas: con_10*

---

**6.13 Ilusão do fim da história**
*Fonte: Kahneman; Housel*
Pessoas acreditam que sua personalidade e objetivos não vão mudar muito daqui para frente — mesmo sabendo que mudaram muito no passado. Isso leva a comprometimentos financeiros rígidos de longo prazo baseados em preferências que podem não persistir. Planos financeiros robustos têm revisões periódicas incorporadas.
*Pílulas relacionadas: con_11, dlc_liv_02*

---

**6.14 As três pistas financeiras**
*Fonte: DeMarco*
A Calçada (consumo imediato, sem reserva), a Pista Lenta (troca linear de tempo por dinheiro) e a Pista Rápida (criação de sistemas escaláveis) descrevem três modelos financeiros distintos com equações de riqueza diferentes. A riqueza exponencial exige desacoplar renda do tempo pessoal.
*Pílulas relacionadas: con_15, con_16, con_17, liv_10*

---

**6.15 O suficiente como âncora**
*Fonte: Housel*
Sem um senso de suficiente, a acumulação se torna uma corrida sem linha de chegada que leva a correr riscos desnecessários com o que já se conquistou. Os casos mais documentados de destruição de grandes patrimônios aconteceram por excesso de ambição — não por falta de conhecimento técnico.
*Pílulas relacionadas: liv_04*

---

**6.16 Tempo de vida como unidade de medida**
*Fonte: Robin & Dominguez*
Dinheiro é energia de vida — horas do tempo finito transformadas em valor monetário. A pergunta certa sobre qualquer compra não é "posso pagar?" mas "vale o tempo de vida que trabalhei para ganhar esse dinheiro?" Para quem atingiu independência financeira, o foco migra de acumulação para a recuperação da autonomia sobre o tempo.
*Pílulas relacionadas: est_05, liv_14, dlc_liv_02*

---

**6.17 Margem de segurança**
*Fonte: Housel*
O objetivo da margem de segurança é tornar previsões desnecessárias. Quem constrói patrimônio sem margem — alavancagem excessiva, concentração sem limite, liquidez insuficiente — pode ser destruído por eventos que "nunca deveriam acontecer". Os maiores colapsos patrimoniais da história não foram por má análise, mas por ausência de espaço para o erro.
*Pílulas relacionadas: liv_new01*

---

## 7. Mapeamento bibliográfico por perfil

### Em Recuperação

| Obra | Conceitos aplicados nas pílulas |
|---|---|
| Ariely & Kreisler — A Psicologia do Dinheiro | Evitação de dor, dor do pagamento, anestesia do crédito |
| Ariely — Previsivelmente Irracional | Anestesia do crédito, contabilidade mental, impulso de compra |
| Kahneman — Rápido e Devagar | Sistema 1 e 2, ilusão do planejamento, efeito manada |
| Sethi — Como Ficar Rico | Método avalanche, roteiros invisíveis, score de crédito, cartão como ferramenta |
| Ramsey — The Total Money Makeover | Método bola de neve, quitação de dívidas passo a passo |
| Clason — O Homem Mais Rico da Babilônia | Pague a si mesmo primeiro |
| Arcuri — Me Poupe! | Dinheirofobia, faxina financeira, contexto brasileiro |
| Thaler — Misbehaving | Efeito posse, aversão à perda, contabilidade mental |
| Nigro — Do Mil ao Milhão | Poupança ≠ investimento, matemática dos juros |

### Estabilizado

| Obra | Conceitos aplicados nas pílulas |
|---|---|
| Sethi — Como Ficar Rico | Reserva de emergência, automação, grandes ganhos, metas, cartão consciente |
| Housel — A Psicologia Financeira | Comportamento financeiro, suficiente |
| Kahneman — Rápido e Devagar | Ilusão do planejamento, orçamento baseado em dados |
| Robin & Dominguez — Your Money or Your Life | Custo de vida em horas de trabalho |
| Kiyosaki — Pai Rico Pai Pobre | Ativo vs. passivo |
| Thaler — Misbehaving | Fungibilidade, nudge, Save More Tomorrow |
| Stanley & Danko — O Milionário Mora ao Lado | PAR vs. SAR, frugalidade |
| Nigro — Do Mil ao Milhão | Quatro fases financeiras, rentabilidade real |
| Arcuri — Me Poupe! | CDB, LCI, LCA, 13° salário, FGTS |

### Em Construção

| Obra | Conceitos aplicados nas pílulas |
|---|---|
| Housel — A Psicologia Financeira | Juros compostos, paciência, Buy and Hold, ilusão do fim da história |
| Sethi — Como Ficar Rico | Gestão passiva, ETFs, aportes regulares, previdência |
| Kiyosaki — Pai Rico Pai Pobre | Inteligência financeira, renda ativa vs. passiva |
| Clason — O Homem Mais Rico da Babilônia | Composição, acumulação |
| Thaler — Misbehaving | Aversão míope à perda, giro de carteira |
| Stanley & Danko — O Milionário Mora ao Lado | Consumo vs. acumulação, alocação de tempo |
| DeMarco — The Millionaire Fastlane | Três pistas, produtores vs. consumidores, lei da efetividade |
| Nigro — Do Mil ao Milhão | Especulação vs. investimento, o cafezinho, Tesouro Direto |
| Arcuri — Me Poupe! | Tesouro Direto, IR nos investimentos |
| Robin & Dominguez — Your Money or Your Life | O número da independência financeira |

### Livre

| Obra | Conceitos aplicados nas pílulas |
|---|---|
| Housel — A Psicologia Financeira | Suficiente, sorte e risco, riqueza real, margem de segurança, aposentadoria |
| Robin & Dominguez — Your Money or Your Life | Propósito do dinheiro, tempo de vida, aposentadoria |
| Sethi — Como Ficar Rico | Diversificação, alocação de ativos |
| Kahneman — Rápido e Devagar | Ilusão do fim da história |
| Stanley & Danko — O Milionário Mora ao Lado | Armadilha do status, legado, proteção patrimonial |
| DeMarco — The Millionaire Fastlane | Lei da efetividade, escala e magnitude |
| Nigro — Do Mil ao Milhão | Marca pessoal como ativo, renda passiva |
| Thaler — Misbehaving | Aversão à perda em grandes patrimônios, dinheiro no relacionamento |

---

## 8. Referências bibliográficas

A base bibliográfica compreende 14 obras. Os conceitos extraídos de cada uma estão distribuídos pelos quatro perfis conforme o mapeamento da seção anterior.

---

**01. A Psicologia do Dinheiro**
Dan Ariely & Jeff Kreisler · Sextante, 2018
*Conceitos-chave:* evitação de dor financeira, dor do pagamento, anestesia do crédito, automação como sistema de comportamento, decisões em piloto automático.

---

**02. A Psicologia Financeira**
Morgan Housel · Intrínseca, 2020
*Conceitos-chave:* comportamento financeiro vs. conhecimento técnico, papel da sorte e do risco, suficiente, juros compostos e paciência, liberdade como maior dividendo da riqueza, ilusão do fim da história, margem de segurança.

---

**03. Como Ficar Rico**
Ramit Sethi · Sextante, 2010
*Conceitos-chave:* roteiros invisíveis do dinheiro, método avalanche, reserva de emergência, automação financeira, grandes ganhos vs. micro-economias, score de crédito, alocação de ativos, fundos de índice, renegociação de taxas.

---

**04. Me Poupe! — 10 passos para nunca mais faltar dinheiro no seu bolso**
Nathalia Arcuri · Sextante, 2018
*Conceitos-chave:* dinheirofobia, tabu cultural sobre dinheiro no Brasil, faxina financeira em três camadas, Tesouro Direto como primeiro investimento, CDB/LCI/LCA, FGTS, 13° salário, autoconhecimento financeiro.

---

**05. Misbehaving — A construção da economia comportamental**
Richard H. Thaler · Intrínseca, 2016
*Conceitos-chave:* efeito posse, aversão à perda (perdas doem 2x mais que ganhos), contabilidade mental e fungibilidade, nudge como arquitetura de escolha, Save More Tomorrow, custos afundados.

---

**06. O Homem Mais Rico da Babilônia**
George Samuel Clason · Edipro, 1926 (original)
*Conceitos-chave:* pague a si mesmo primeiro, fazer o dinheiro trabalhar por você, proteção do capital, princípios atemporais de acumulação e composição.

---

**07. O Milionário Mora ao Lado**
Thomas J. Stanley & William D. Danko · Manole, 1999
*Conceitos-chave:* PAR vs. SAR, frugalidade como estratégia de acumulação, relação inversa entre consumo de status e patrimônio real, fórmula do patrimônio esperado, como milionários reais alocam tempo e dinheiro.

---

**08. Pai Rico Pai Pobre**
Robert Kiyosaki · Alta Books, 1997
*Conceitos-chave:* distinção entre ativo e passivo pelo fluxo de caixa, corrida dos ratos, inteligência financeira como habilidade desenvolvível, diferença entre trabalhar por dinheiro e fazer o dinheiro trabalhar.

---

**09. Previsivelmente Irracional**
Dan Ariely · Sextante, 2008
*Conceitos-chave:* forças invisíveis que guiam decisões, anestesia do crédito, contabilidade mental, relatividade e comparação social, custo zero como distortor de decisão.

---

**10. Rápido e Devagar — Duas formas de pensar**
Daniel Kahneman · Objetiva, 2011
*Conceitos-chave:* Sistema 1 (rápido, intuitivo, emocional) e Sistema 2 (lento, deliberativo, racional), ilusão do planejamento, vieses cognitivos nas decisões financeiras, ilusão do fim da história.

---

**11. The Millionaire Fastlane**
MJ DeMarco · Viperion Publishing, 2011
*Conceitos-chave:* as três pistas financeiras (calçada/pista lenta/pista rápida), lei da efetividade, escala vs. magnitude, produtores vs. consumidores, desacoplar renda do tempo.

---

**12. The Total Money Makeover**
Dave Ramsey · Thomas Nelson, 2003
*Conceitos-chave:* sete passos para transformação financeira, método bola de neve para quitação de dívidas, fundo de emergência como primeiro passo, baby steps progressivos.

---

**13. Your Money or Your Life**
Vicki Robin & Joe Dominguez · Penguin Books, 1992
*Conceitos-chave:* dinheiro como energia de vida, ponto de cruzamento (quando renda passiva supera despesas), propósito do dinheiro além da acumulação, suficiente como conceito de equilíbrio, regra dos 4%.

---

**14. Do Mil ao Milhão — Sem Cortar o Cafezinho**
Thiago Nigro · HarperCollins Brasil, 2018
*Conceitos-chave:* três pilares (gastar bem, investir melhor, ganhar mais), poupança vs. investimento (diferença de R$ 1,3 milhão em 30 anos), rentabilidade real descontada de inflação, quatro fases financeiras, especulação vs. investimento, Tesouro Direto no contexto brasileiro, marca pessoal como ativo de renda.

---

*Documento de referência do módulo `/education` — Lyfx.*
*Versão 2.0 · Maio 2026*
*Módulo 1 (capacitação conceitual): 85 pílulas disponíveis em `lyfx-pills-complete.json`*
*Módulo 2 (treinamento da plataforma): estrutura definida neste documento · conteúdo em desenvolvimento*
