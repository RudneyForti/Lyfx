# Lyfx — Índice de Documentação
> Registro central de todos os documentos do projeto · v1.11.2 · Junho 2026
> **Regra:** atualizar este arquivo em todo merge para `master` (E7 — passo obrigatório).

---

## Documentos Ativos

### Raiz do projeto

| Arquivo | Caminho | Versão | Audiência | Descrição |
|---|---|---|---|---|
| `README.md` | `/README.md` | v1.10.0 | Público / GitHub | Visão geral do projeto, badges de stack, lista de módulos e instruções de setup. Porta de entrada para qualquer pessoa que abre o repositório pela primeira vez. |
| `DOCUMENTATION.md` | `/DOCUMENTATION.md` | v1.10.0 | Desenvolvedores / Agentes | Planta baixa técnica completa da aplicação. Contém: rotas, Server Actions, schema Prisma anotado, fórmulas de cálculo com exemplos numéricos, fluxo de dados ponta a ponta, integrações externas (Google Maps, ViaCEP, Static Maps), decisões arquiteturais e gotchas técnicos conhecidos. Fonte de verdade técnica. |
| `AGENTS.md` | `/AGENTS.md` | — | Agentes (NEO / Smith) | Regras operacionais de git e pipeline carregadas automaticamente pelo Claude. Define branches, pipeline E1→E7, nomenclatura e regras obrigatórias em formato compacto. Referenciado por `CLAUDE.md`. |
| `CLAUDE.md` | `/CLAUDE.md` | — | Claude Code | Ponto de entrada do contexto Claude. Referencia `AGENTS.md` e `docs/GIT-WORKFLOW.md` via `@import`. Não contém regras — apenas carrega os arquivos certos. |
| `VERSIONING.md` | `/VERSIONING.md` | — | Desenvolvedores / Agentes | Política de versionamento SemVer do projeto (MAJOR/MINOR/PATCH) e histórico completo de releases com descrição do que entrou em cada versão. |

---

### Pasta `docs/`

| Arquivo | Caminho | Versão | Audiência | Descrição |
|---|---|---|---|---|
| `FEATURES.md` | `/docs/FEATURES.md` | v1.10.0 | Analistas / Gestores / Capacitação | Guia completo de funcionalidades em linguagem não-técnica. Responde: o que faz, como usar, onde vai a informação, valor ao usuário e referencial de negócio. Não contém rotas, Prisma ou código. Cobre todos os módulos do sistema (seções 1–4.21). |
| `GIT-WORKFLOW.md` | `/docs/GIT-WORKFLOW.md` | v1.10.0 | Desenvolvedores / Agentes | Fluxo Git detalhado: branches `master`/`develop`, pipeline de sessão (1–8), checklist E7 de release completo, convenção de portas (3000 dev / 4000 prod), worktree de produção e regras invioláveis. |
| `QA-TEST-PLAN.md` | `/docs/QA-TEST-PLAN.md` | v1.11.0 | Agent Smith / QA | Plano de testes executável com 321 casos. Cobre autenticação, todos os módulos, Studio G2, Reembolso Especial (CS-17/CS-25), Central de Notificações (CS-18/CS-19), segurança, isolamento multi-usuário e fluxos E2E. Atualizado em v1.11.0 com casos de feriados nacionais (KM-11b/c/d). |
| `PEDAGOGY_V2.md` | `/docs/PEDAGOGY_V2.md` | v2.0 | Conteudistas / Desenvolvedores | Metodologia pedagógica do módulo `/education`. Define estrutura das pílulas (concept/why/how/quiz), taxonomia de tópicos, critérios editoriais e modelo de progressão por trilhas. |
| **`DOC-INDEX.md`** | `/docs/DOC-INDEX.md` | v1.10.0 | Todos | **Este arquivo.** Índice central de toda a documentação do projeto. |

---

### Infraestrutura Docker — adicionada em v1.11.1

> Arquivos de infraestrutura e templates criados em CS-23.

| Arquivo | Caminho | Versão | Descrição |
|---|---|---|---|
| `Dockerfile` | `/Dockerfile` | v1.11.1 | Build multi-stage: deps (npm ci) → builder (prisma generate + next build) → runner (standalone mínimo, usuário não-root nextjs:1001). Fix explícito do Prisma client no runner. |
| `docker-compose.yml` | `/docker-compose.yml` | v1.11.1 | Produção: porta 4000, `env_file: .env`, `extra_hosts: host.docker.internal:host-gateway` (resolve host no Linux). |
| `docker-compose.dev.yml` | `/docker-compose.dev.yml` | v1.11.1 | Desenvolvimento: porta 3000, bind mount para live reload, volumes anônimos para node_modules e .next. |
| `.dockerignore` | `/.dockerignore` | v1.11.1 | Exclui `.env*`, `node_modules`, `.next`, `*.db`, docs do contexto de build. |
| `.env.docker.example` | `/.env.docker.example` | v1.11.1 | Template de `.env` para uso com Docker — documenta troca de `localhost` → `host.docker.internal` no DATABASE_URL. |

---

### Libs criadas no lote v1.11.0

> Arquivos de código com papel de documentação implícita — citados aqui para rastreabilidade.

| Arquivo | Caminho | Versão | Descrição |
|---|---|---|---|
| `holidays.ts` | `/lib/holidays.ts` | v1.11.0 | Cache de feriados nacionais via BrasilAPI. `getHolidays(year)` retorna `Set<"YYYY-MM-DD">` com fallback gracioso se API offline. Criado em CS-25. |
| `km-utils.ts` | `/lib/km-utils.ts` | v1.11.0 | `addBusinessDays(date, days): Promise<Date>` — async, considera feriados. Movido de `app/actions/km-reimbursement.ts`. Criado em CS-25. |
| `alert-engine.ts` | `/lib/alert-engine.ts` | v1.11.0 | Motor centralizado de detecção de condições danger. `computeDangerConditions(userId)` consumido por `getAlerts()` e `syncDangerAlerts()`. Criado em CS-27. |
| `i18n.ts` | `/lib/i18n.ts` | v1.11.0 | Constantes de internacionalização pt-BR. `PT_MONTHS` — fonte única de verdade para nomes de meses. Criado em CS-29. |

---

### Pasta `.claude/` (uso interno dos agentes)

| Arquivo | Caminho | Versão | Audiência | Descrição |
|---|---|---|---|---|
| `AGENTES.md` | `/.claude/AGENTES.md` | — | Desenvolvedores / Agentes | Guia completo do sistema de agentes: personas NEO e Smith, pipeline E1→E7 detalhado, protocolos de handoff, modos de operação, referências bibliográficas. Documento de referência expandido (complementa `AGENTS.md` da raiz). |
| `agent-neo.md` | `/.claude/agents/agent-neo.md` | — | Claude Code (agente) | System prompt do Agent NEO — orquestrador do ciclo de desenvolvimento. Define persona, pipeline, autoridades técnicas (Martin, Evans, Fowler, Beck, Kleppmann, Humble/Farley, Nygard, Meszaros, Hunt/Thomas) e protocolos de operação E1→E7. |
| `agent-smith.md` | `/.claude/agents/agent-smith.md` | v11.0 | Claude Code (agente) | System prompt do Agent Smith — especialista QA. Define persona Matrix, modos E4 e Sistêmico, 18 bases de conhecimento (Myers, Kaner, Beck, Fowler, Feathers, Meszaros, WAHH, Hendrickson e outros), gatilhos de ativação e formatos de relatório. |

---

## Arquivo Histórico (`docs/archive/`)

> Documentos congelados — não são mais atualizados. Preservados para referência histórica.

| Arquivo | Caminho | Data | Descrição |
|---|---|---|---|
| `CHANGE-SPECS.md` | `/docs/archive/CHANGE-SPECS.md` | Mai 2026 | Histórico completo de todas as Change Specs implementadas (CS-01 a CS-19). Arquivado após v1.10.0 com todas as CSs concluídas. |
| `ANALYST_FEEDBACK.md` | `/docs/archive/ANALYST_FEEDBACK.md` | v1.3.1 | Feedback original de consultor externo sobre a v1.3.1. Base para diversas melhorias implementadas nos lotes seguintes. |
| `QA-RESULTS-2026-05-22.md` | `/docs/archive/QA-RESULTS-2026-05-22.md` | 22/05/2026 | Resultado histórico do ciclo de QA realizado em 22/05/2026 para a v1.5.0. Substituído pelo plano vivo em `QA-TEST-PLAN.md`. |

---

## Regras de Manutenção

Este índice é **obrigatório** no checklist E7 de release. Atualizar quando:

| Evento | O que atualizar neste arquivo |
|---|---|
| Novo documento criado | Adicionar linha na tabela correspondente com nome, caminho, versão e descrição |
| Documento movido ou renomeado | Atualizar caminho e nome na tabela |
| Documento arquivado | Mover linha da tabela ativa para a seção de arquivo |
| Nova versão de um documento | Atualizar coluna **Versão** |
| Documento excluído | Remover linha (ou mover para arquivo se tiver valor histórico) |

---

*Índice gerado em 07/06/2026 · Versão da plataforma: v1.11.2*
