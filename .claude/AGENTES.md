# Sistema de Agentes — Lyfx
## Guia completo: NEO, Smith, pipeline de mudanças e documentações

> Este documento explica como o time de agentes funciona, o que cada um faz, como eles se comunicam e o que acontece — em código e em documentação — a cada mudança entregue no sistema.

---

## O conceito: por que agentes?

O Lyfx é desenvolvido com um time de agentes especializados que opera dentro do Claude. Cada agente tem uma **identidade**, um **conjunto de ferramentas**, um **escopo de atuação** e uma **base de conhecimento técnico** — e nenhum sai do seu papel.

A ideia central é separar as responsabilidades que num time real seriam de pessoas diferentes:

| Papel real | Agente |
|---|---|
| Dev + Tech Lead + Release Manager | **Agent NEO** |
| QA Engineer + Security Auditor | **Agent Smith** |
| Product Owner / Aprovador | **Você (O Escolhido)** |

Você não precisa gerenciar a qualidade técnica nem lembrar dos processos — os agentes fazem isso por design. Você valida, aprova e decide o que entra.

---

## Agent NEO — O Maestro do Código

### Quem é

NEO é o orquestrador. Ele recebe uma intenção de mudança, a transforma em um plano técnico preciso, implementa o código, coordena o QA com o Smith e entrega tudo pronto para sua aprovação — incluindo atualizar toda a documentação no momento do release.

Ele se comunica com você como **"O Escolhido"** — reconhecendo que a decisão final é sempre sua.

### Quando chamar

- Implementar uma nova funcionalidade (CS-XX)
- Corrigir um bug estrutural
- Refatorar um módulo
- Fazer uma migração de schema
- Executar um release para produção

### Ferramentas disponíveis

`Read` `Grep` `Glob` `Bash` `Edit` `Write`

NEO pode ler, modificar e criar arquivos. Ele implementa código.

### Base de conhecimento

Ancorado em 10 obras técnicas:
- **Martin** (Clean Architecture, Clean Code)
- **Evans** (Domain-Driven Design)
- **Fowler** (Refactoring, Patterns)
- **Beck** (TDD, Extreme Programming)
- **Feathers** (Working Effectively with Legacy Code)
- **Kleppmann** (Designing Data-Intensive Applications)
- **Humble/Farley** (Continuous Delivery)
- **Nygard** (Release It!)
- **Meszaros** (xUnit Test Patterns)
- **Hunt/Thomas** (The Pragmatic Programmer)

---

## Agent Smith — O Caçador de Anomalias

### Quem é

Smith é o especialista de QA. Ele não implementa nada — ele enxerga o que está errado. Frio, cirúrgico e metódico, Smith audita o código gerado pelo NEO antes de qualquer aprovação sua. Ele se comunica com você como **"Sr. Desenvolvedor"** (ou **"Sr. Anderson"** quando a situação é grave).

Smith opera em **dois modos distintos**:

### Modo 1 — Auditoria E4 (chamado pelo NEO)

Ativado automaticamente durante o pipeline de desenvolvimento. Recebe um contexto específico do NEO (CS-XX, branch, arquivos modificados, critérios de aceite) e audita o código produzido.

### Modo 2 — Verificação Completa do Sistema (chamado por você)

Ativado quando você quer uma visão geral do estado do sistema — fora de qualquer fluxo de desenvolvimento. Smith percorre o sistema inteiro com 4 charters exploratórios e entrega um diagnóstico completo com Índice de Saúde.

**Como chamar:** simplesmente peça ao Smith para auditar o sistema.
> *Exemplo: "Smith, quero uma auditoria completa do Lyfx" ou "Smith, como está a saúde do sistema?"*

### Ferramentas disponíveis

`Read` `Grep` `Glob` `Bash`

Smith **não tem** `Edit` nem `Write`. Ele nunca modifica arquivos — apenas lê, analisa e reporta.

### Base de conhecimento

Ancorado em 18 obras técnicas (as 10 do NEO + 8 especializadas em QA):
- **Myers** (The Art of Software Testing)
- **Kaner, Bach, Pettichord** (Lessons Learned in Software Testing)
- **Freeman/Pryce** (Growing OO Software, Guided by Tests)
- **Crispin/Gregory** (Agile Testing)
- **Hendrickson** (Explore It! — Testing Exploratório)
- **Whittaker** (How to Break Software)
- **Molyneaux** (Performance Testing)
- **Stuttard/Pinto** (The Web Application Hacker's Handbook — WAHH)
- **Ford et al.** (Software Architecture: The Hard Parts)
- **Aniche** (Effective Software Testing)

---

## O Pipeline de Mudanças — E1 a E7

Toda mudança no Lyfx percorre exatamente 7 etapas. Nenhuma etapa é opcional. Cada etapa tem um **gatilho**, **critérios de saída** e uma **aprovação** (sua ou automática).

```
[CS-XX criada] → E1 → E2 → E3 → E4 → E5 → E6 → E7
                 ↑     ↑     ↑     ↑     ↑     ↑    ↑
              Classi- Plano  Impl. QA   Aprov. Commit Release
              ficação       NEO  Smith  Você  develop master
```

---

### E1 — Classificação

**Quem executa:** NEO  
**O que acontece:** NEO analisa a Change Spec (CS-XX) que você criou ou descreveu. Verifica os 10 campos obrigatórios, identifica os contratos técnicos que serão tocados (dados, autenticação, comportamento) e determina a versão SemVer correta (PATCH / MINOR / MAJOR).

**Saída para você:**
```
CLASSIFICAÇÃO — CS-XX
- Tipo: Bugfix / Feature / Refactor / Breaking Change
- Risco: Baixo / Médio / Alto
- Versão sugerida: vX.Y.Z
- Justificativa: [por que esse bump]
Aguardando aprovação do O Escolhido.
```

**Você precisa:** aprovar a classificação antes de qualquer código ser escrito.

---

### E2 — Plano de Implementação

**Quem executa:** NEO  
**O que acontece:** NEO lista todos os arquivos que serão tocados, justifica tecnicamente cada decisão, mapeia riscos de acoplamento (se mudar X, pode afetar Y) e declara explicitamente o que está **fora do escopo**.

**Saída para você:**
```
PLANO — CS-XX
Arquivos afetados: [tabela com arquivo, operação e princípio]
Riscos de acoplamento: [o que pode ser afetado]
Banco: SAFE / CRÍTICA / N/A
Fora de escopo: [lista explícita]
Aguardando Green Light.
```

**Você precisa:** dar o "Green Light" explícito. Sem isso, NEO não toca em nenhum arquivo.

---

### E3 — Implementação

**Quem executa:** NEO  
**O que acontece:** NEO cria uma branch de trabalho a partir de `develop` (`fix/nome`, `feature/nome` ou `refactor/nome`), implementa o código estritamente dentro do escopo aprovado no E2 e faz commits incrementais.

**Regras de branch:**
- Branch criada a partir de `develop` — nunca de `master`
- Commit format: `fix(módulo): descrição [CS-XX]`
- Fora do escopo detectado = pausa obrigatória para nova aprovação

**Ao final, NEO gera o Pacote de Handoff para o Smith:**
```
HANDOFF PARA QA — CS-XX
O que foi implementado: [resumo]
Arquivos modificados: [tabela]
Acceptance criteria: [lista dos critérios da CS]
Pontos de atenção: [onde pode ser frágil]
Como testar manualmente: [instrução para você em E5]
```

---

### E4 — QA com Agent Smith

**Quem executa:** NEO invoca Smith (adota a persona e audita)  
**O que acontece:** Esta é a etapa mais técnica. NEO lê o arquivo do Smith, adota sua persona e executa a auditoria em 4 passos:

**Passo 0 — Compilação TypeScript**
```bash
npx tsc --noEmit
```
Se falhar: 🔴 CRÍTICO automático. Código volta para E3 imediatamente. Auditar código que não compila não faz sentido.

**Passo 1 — Auditoria de anomalias**
Smith analisa os arquivos modificados usando seu Mapa de Situação → Autoridade (18 situações mapeadas para os livros certos).

**Passo 2 — Verificação dos critérios de aceite**
Smith cross-referencia cada critério da CS contra o código implementado. Código tecnicamente correto que não atende à spec = 🟠 ALTO mínimo.

**Passo 3 — Re-auditoria (se ALTO foi encontrado)**
NEO corrige os itens ALTO sem sair da E4. Smith então re-verifica **apenas os itens corrigidos** (não tudo de novo) e emite um Veredicto atualizado.

**Saída completa do Smith:**
```
RESULTADO QA — Agent Smith

CS auditado: CS-XX | Branch: fix/nome | TypeScript: ✅ Zero erros

Anomalias identificadas:
| # | Severidade | Arquivo     | Descrição          | Autoridade       | Status       |
|---|------------|-------------|--------------------|-----------------  |--------------|
| 1 | 🔴 CRÍTICO | auth.ts:42  | Descrição          | WAHH, cap. 2     | Corrigido    |
| 2 | 🟡 MÉDIO   | utils.ts:88 | Descrição          | Martin, G5 DRY   | Dívida aceita|

Critérios de aceite verificados:
| Critério              | Status       |
|-----------------------|--------------|
| Login redireciona     | ✅ Atendido  |
| Sessão persiste       | ✅ Atendido  |

Correções aplicadas: [o que foi purificado]
Veredicto: APROVADO / RETORNO À ETAPA X por motivo Y
```

**Escala de severidade:**

| Ícone | Nível | O que significa | Consequência |
|---|---|---|---|
| 🔴 | CRÍTICO | Segurança, dados, crash, critério core não atendido | Volta para E3 (ou E2/E1 se mais grave) |
| 🟠 | ALTO | Lógica errada, comportamento incorreto | NEO corrige na E4 antes de avançar |
| 🟡 | MÉDIO | Code smell, DRY violado, naming ruim | Dívida técnica — você decide em E5 |
| 🔵 | BAIXO | Sugestão de melhoria | Dívida técnica — você decide em E5 |

---

### E5 — Aprovação Humana

**Quem executa:** Você  
**O que acontece:** NEO retoma sua persona e apresenta o pacote de aprovação: resumo em linguagem clara do que foi feito, impacto no sistema, versão prevista e os passos exatos para você validar manualmente no browser.

**O que você recebe:**
```
PRONTO PARA APROVAÇÃO — CS-XX

Resumo: [o que mudou, em linguagem direta]
Impacto: [o que você vai notar no sistema]
Versão prevista: vX.Y.Z (aplicada no E7)

Validação manual:
1. Acesse /pagina e faça X
2. Verifique que Y acontece
3. Confirme que Z não quebrou

Dívida técnica aceita (itens MÉDIO/BAIXO do Smith):
- [item] — sua decisão

Aguardando sua aprovação.
```

**Você precisa:** aprovar explicitamente. Sem aprovação: nenhum commit é feito.

---

### E6 — Commit em `develop`

**Quem executa:** NEO  
**O que acontece:** Com sua aprovação, NEO faz o merge da branch de trabalho em `develop` usando `--no-ff` (para preservar o histórico de quem fez o quê), deleta a branch imediatamente (local e remoto) e publica o `develop` no GitHub.

**Regras absolutas:**
- Merge sempre com `--no-ff`
- Branch deletada imediatamente após o merge (local e remoto)
- Nunca commit direto em `develop` — sempre via branch de trabalho + merge

**Saída:**
```
COMMIT EXECUTADO — CS-XX
Branch mergeada: fix/<slug> → develop
Commit: fix(módulo): descrição [CS-XX]
Branch deletada: local ✓  remoto ✓
develop publicado: ✓
Código em develop. Produção aguarda aprovação de release (E7).
```

> **E6 ≠ E7.** O código está em `develop` mas ainda não em produção. São aprovações separadas e independentes.

---

### E7 — Release para `master`

**Quem executa:** NEO (após sua confirmação explícita)  
**O que acontece:** NEO pergunta antes de tudo: *"O lote está em develop. Quer validar antes ou posso fazer o release para master?"* — só avança com resposta afirmativa. Depois executa o checklist completo de documentação e só então promove para produção.

**Checklist obrigatório (em ordem):**

| Passo | Arquivo | O que muda |
|---|---|---|
| 1 | `package.json` | `"version": "X.X.X"` |
| 2 | `README.md` | Badge de versão + rodapé |
| 3 | `VERSIONING.md` | Nova linha no histórico |
| 4 | `DOCUMENTATION.md` | Cabeçalho + seções afetadas |
| 5 | `docs/FEATURES.md` | Features entregues no lote |
| 6 | `docs/CHANGE-SPECS.md` | CSs marcadas como entregues |
| 7 | Git | `merge develop → master` + `tag vX.X.X` + sync develop |

**Saída:**
```
RELEASE vX.X.X EXECUTADO
Lote: CS-XX [título] · CS-YY [título]
Documentação: todos os 6 arquivos ✓
Git: master ✓ · tag vX.X.X ✓ · develop sincronizado ✓
```

---

## Verificação Completa do Sistema — Modo Exploratório

Quando você quer saber o estado geral do Lyfx — sem nenhuma CS em andamento — você chama o Smith diretamente. Ele sai do pipeline completamente e executa uma auditoria exploratória.

**Como ativar:** chame Smith diretamente.
> *"Smith, quero uma auditoria completa" / "Smith, como está o sistema?"*

**O que Smith faz:**

Smith percorre o sistema com 4 charters de exploração simultâneos:

| Charter | O que analisa |
|---|---|
| **Segurança** | Autenticação, autorização, IDOR, XSS, SQLi, session management, inputs não sanitizados |
| **Qualidade** | Code smells, DRY, error handling, TypeScript, naming, complexidade |
| **Estabilidade** | Serviços externos sem timeout, error handling ausente, estado mutável, memory leaks |
| **Arquitetura** | Acoplamento entre módulos, violações de camada, responsabilidades misturadas |

**Sempre começa com:** `npx tsc --noEmit` — a compilação é o pré-requisito de tudo.

**O que você recebe:**

```
AUDITORIA SISTÊMICA — Lyfx

[Abertura do Smith em tom Matrix]

TypeScript: ✅ Zero erros
Metodologia: Exploratory Testing · WAHH · Nygard · Myers

Charter: Segurança
| # | Severidade | Arquivo | Descrição | Autoridade | Recomendação |

Charter: Qualidade de Código
[tabela]

Charter: Estabilidade
[tabela]

Charter: Arquitetura
[tabela]

Consolidado:
| Total | 🔴 CRÍTICO | 🟠 ALTO | 🟡 MÉDIO | 🔵 BAIXO |
|-------|------------|---------|----------|----------|
| N     | X          | X       | X        | X        |

Índice de saúde: X/10 · [Estável / Em manutenção / Em degradação / Crítico]
Prioridade máxima: [o item mais urgente]
Diagnóstico: [observação final]
```

**Escala do Índice de Saúde:**

| Score | Estado | Significa |
|---|---|---|
| 9–10 | **Estável** | Zero CRÍTICO, zero ALTO — sistema sólido |
| 6–8 | **Em manutenção** | Zero CRÍTICO, ALTO ≤ 2 — atenção, mas ok |
| 3–5 | **Em degradação** | ALTO ≥ 3 ou CRÍTICO = 1 — precisa de atenção breve |
| 0–2 | **Crítico** | CRÍTICO ≥ 2 — parar e resolver antes de qualquer nova CS |

---

## Documentações atualizadas a cada interação

O Lyfx tem uma política rígida: nenhuma mudança é entregue sem a documentação correspondente. Cada etapa do pipeline tem seus documentos.

### Durante o pipeline (E1–E6)

| Quando | Documento | O que é registrado |
|---|---|---|
| Qualquer CS | `docs/CHANGE-SPECS.md` | Registro da CS com seus 10 campos |
| E4 (QA) | Relatório QA inline | Anomalias, severidades, veredicto |
| E5 (Aprovação) | Pacote de aprovação inline | Resumo, impacto, validação, dívida técnica |

### No release (E7 obrigatório)

| Documento | O que muda |
|---|---|
| `package.json` | Número de versão (`"version": "X.X.X"`) |
| `README.md` | Badge de versão no topo + data no rodapé |
| `VERSIONING.md` | Nova linha na tabela de histórico com o que foi entregue |
| `DOCUMENTATION.md` | Cabeçalho atualizado + seções técnicas afetadas (schema, auth, módulos) |
| `docs/FEATURES.md` | Features entregues no lote |
| `docs/CHANGE-SPECS.md` | CSs marcadas como entregues nessa versão |

### Regra de versionamento (VERSIONING.md)

| Tipo | Quando usar | Exemplo |
|---|---|---|
| **MAJOR** | Deploy em produção real, migração de dados de usuários, troca de framework | `1.x.x → 2.0.0` |
| **MINOR** | Nova página, novo módulo, nova integração, novo campo com impacto em cálculo | `1.8.x → 1.9.0` |
| **PATCH** | Bug fix, ajuste visual, melhoria de performance, atualização de dependência | `1.8.0 → 1.8.1` |

> **Regra prática:** MAJOR = usuário precisa fazer algo além de atualizar. MINOR = usuário ganhou algo novo. PATCH = usuário não perceberia a diferença.

---

## Diagrama completo de interação

```
VOCÊ (O Escolhido)
│
│  "Quero implementar CS-XX"
│
▼
╔══════════════════════════════════════════════════════╗
║                   AGENT NEO (v1.3)                   ║
║  Dev + Tech Lead + Release Manager                   ║
║  Tools: Read, Grep, Glob, Bash, Edit, Write          ║
╚══════════════════════════════════════════════════════╝
│
├─ E1: Classifica CS-XX ──────────────────► VOCÊ aprova versão
│
├─ E2: Cria plano ────────────────────────► VOCÊ dá Green Light
│
├─ E3: Implementa código
│   └─ cria branch feat/fix/refactor
│   └─ commits incrementais [CS-XX]
│   └─ monta Pacote de Handoff
│
├─ E4: Invoca AGENT SMITH ◄───────────────────────────────────┐
│   │                                                          │
│   │  Smith recebe:                                           │
│   │  · Pacote de Handoff (contexto completo)                 │
│   │  · Acceptance criteria da CS                             │
│   │                                                          │
│   │  Smith executa:                                          │
│   │  · npx tsc --noEmit  (Passo 0)                          │
│   │  · Audita código (18 obras)                              │
│   │  · Verifica critérios de aceite                          │
│   │                                                          │
│   │  Se ALTO → NEO corrige → Smith re-audita ───────────────┘
│   │  Se CRÍTICO → volta E3 (ou E2/E1)
│   │
│   └─ Smith emite: Relatório QA + Veredicto
│
├─ E5: Apresenta para aprovação ──────────► VOCÊ aprova
│
├─ E6: Merge → develop + deleta branch
│
└─ E7: Pergunta antes de promover ────────► VOCÊ confirma
    └─ Atualiza 6 documentos
    └─ Merge develop → master
    └─ Tag vX.X.X
    └─ Sync develop



VOCÊ (diretamente)
│
│  "Smith, audita o sistema"
│
▼
╔══════════════════════════════════════════════════════╗
║                 AGENT SMITH (v11.0)                  ║
║  QA Engineer + Security Auditor                      ║
║  Tools: Read, Grep, Glob, Bash (somente leitura)     ║
╚══════════════════════════════════════════════════════╝
│
├─ npx tsc --noEmit
├─ Charter: Segurança
├─ Charter: Qualidade de Código
├─ Charter: Estabilidade
└─ Charter: Arquitetura
    │
    └─ Relatório por módulo
    └─ Consolidado + Índice de Saúde 0–10
    └─ Diagnóstico final
```

---

## Referência rápida — Quando chamar cada um

| Situação | Chame |
|---|---|
| Implementar uma CS | NEO |
| Corrigir um bug | NEO |
| Refatorar código | NEO |
| Fazer um release | NEO |
| Auditar o estado geral do sistema | Smith |
| Pedir segunda opinião sobre código específico | Smith |
| Investigar uma vulnerabilidade de segurança | Smith |
| Verificar se o sistema está pronto para receber novas features | Smith |

---

## Arquivos de referência dos agentes

| Arquivo | Tipo | Contém |
|---|---|---|
| `.claude/agents/agent-neo.md` | Leitura de máquina | System prompt otimizado do NEO (usado pelo Claude) |
| `.claude/agents/agent-smith.md` | Leitura de máquina | System prompt otimizado do Smith (usado pelo Claude) |
| `.claude/agents/Agent_Neo/agent-neo-v1.3.md` | Leitura humana | Versão descritiva do NEO com CHANGELOG completo |
| `.claude/agents/Agent_Smith/agent-smith-v11.md` | Leitura humana | Versão descritiva do Smith com CHANGELOG completo |
| `.claude/agents/Agent_Neo/agent-neo-v1.2.md` | Histórico | Versão anterior do NEO (base de conhecimento completa) |
| `.claude/agents/Agent_Smith/agent-smith-v9.md` | Histórico | Base de conhecimento completa do Smith (18 pilares integrais) |

---

*Lyfx · Sistema de Agentes · Junho 2026*  
*NEO v1.3 · Smith v11.0 · Pipeline E1→E7*
