# Lyfx — Índice de Documentação
> Registro central de todos os documentos do projeto · v1.15.4 · Julho 2026
> **Regra:** atualizar este arquivo em todo merge para `main` (E7 — passo obrigatório).

---

## Documentos Ativos

### Raiz do projeto

| Arquivo | Caminho | Versão | Audiência | Descrição |
|---|---|---|---|---|
| `README.md` | `/README.md` | v1.14.1 | Público / GitHub | Visão geral do projeto, badges de stack, lista de módulos e instruções de setup. Porta de entrada para qualquer pessoa que abre o repositório pela primeira vez. |
| `DOCUMENTATION.md` | `/DOCUMENTATION.md` | v1.14.1 | Desenvolvedores / Agentes | Planta baixa técnica completa da aplicação. Contém: rotas, Server Actions, schema Prisma anotado, fórmulas de cálculo com exemplos numéricos, fluxo de dados ponta a ponta, integrações externas (Google Maps, ViaCEP, Static Maps, OAuth Google/Microsoft), decisões arquiteturais e gotchas técnicos conhecidos. Fonte de verdade técnica. Espelho em inglês: `DOCUMENTATION.en.md`. |
| `AGENTS.md` | `/AGENTS.md` | — | Agentes (NEO / Smith) | Regras operacionais de git e pipeline carregadas automaticamente pelo Claude. Define branches, pipeline E1→E7, nomenclatura e regras obrigatórias em formato compacto. Referenciado por `CLAUDE.md`. |
| `CLAUDE.md` | `/CLAUDE.md` | — | Claude Code | Ponto de entrada do contexto Claude. Referencia `AGENTS.md` e `docs/GIT-WORKFLOW.md` via `@import`. Não contém regras — apenas carrega os arquivos certos. |
| `VERSIONING.md` | `/VERSIONING.md` | — | Desenvolvedores / Agentes | Política de versionamento SemVer do projeto (MAJOR/MINOR/PATCH) e histórico completo de releases com descrição do que entrou em cada versão. |

---

### Pasta `docs/`

| Arquivo | Caminho | Versão | Audiência | Descrição |
|---|---|---|---|---|
| `FEATURES.md` | `/docs/FEATURES.md` | v1.14.1 | Analistas / Gestores / Capacitação | Guia completo de funcionalidades em linguagem não-técnica. Responde: o que faz, como usar, onde vai a informação, valor ao usuário e referencial de negócio. Não contém rotas, Prisma ou código. Cobre todos os módulos do sistema (seções 1–4.21). Espelho em inglês: `FEATURES.en.md`. |
| `GIT-WORKFLOW.md` | `/docs/GIT-WORKFLOW.md` | v1.14.1 | Desenvolvedores / Agentes | Fluxo Git detalhado: GitHub Flow com branch única `main`, pipeline de sessão (1–8), checklist E7 de release completo, convenção de portas (3000 dev / 4000 prod), worktree de produção e regras invioláveis. |
| `QA-TEST-PLAN.md` | `/docs/QA-TEST-PLAN.md` | v1.15.0 | Agent Smith / QA | Plano de testes executável com 400+ casos. Cobre autenticação, todos os módulos, Studio G2, Reembolso Especial (CS-17/CS-25), Central de Notificações (CS-18/CS-19), segurança, isolamento multi-usuário e fluxos E2E. Atualizado em v1.13.0 com sessões com estado (CS-34), Audit Log (CS-35) e OAuth (CS-36); em v1.15.0 com Kanban v2 (KB-01→KB-07, CS-59). |
| `QA-RESULTS-2026-06-09.md` | `/docs/QA-RESULTS-2026-06-09.md` | v1.14.0 | Agent Smith / QA | Resultado do ciclo de QA completo executado em 09/06/2026 para a v1.14.0. 324 casos, 297 PASS, 5 FAIL, 4 bugs ativos (chips). Cobre todos os 24 módulos + segurança + isolamento + fluxos E2E. |
| `PEDAGOGY_V2.md` | `/docs/PEDAGOGY_V2.md` | v2.0 | Conteudistas / Desenvolvedores | Metodologia pedagógica do módulo `/education`. Define estrutura das pílulas (concept/why/how/quiz), taxonomia de tópicos, critérios editoriais e modelo de progressão por trilhas. |
| `CONDUCT-MODEL.md` | `/docs/CONDUCT-MODEL.md` | v1.14.1 | Desenvolvedores / Agentes | Log da padronização do sistema de agentes vs. dev-requirements da Limiar Core: 18 mudanças detalhadas, tabela de cobertura 17/17 requisitos e backlog de pendências de aplicação por projeto. |
| `WORKFLOW-TEMPLATES.md` | `/docs/WORKFLOW-TEMPLATES.md` | v1.14.1 | Desenvolvedores / Agentes | Biblioteca de 12 templates do pipeline E1→E7: Change Spec, Classification, Plan, Handoff, QA Report, Approval, Commit Block, Release, PR, Test Plan e Feature Doc. |
| **`DOC-INDEX.md`** | `/docs/DOC-INDEX.md` | v1.14.1 | Todos | **Este arquivo.** Índice central de toda a documentação do projeto. |

---

### Páginas de sistema — adicionadas em v1.11.3

> Criadas no CS-31 (Fundação de Segurança).

| Arquivo | Caminho | Versão | Descrição |
|---|---|---|---|
| `not-found.tsx` | `/app/not-found.tsx` | v1.14.0 | Página 404 customizada com identidade Lyfx. Exibe `f(404) = ∄` em display font com gradiente cyan, subtítulo `dom(f) ∩ {/rota} = ∅`. Logo corrigido (font-display italic). Botões para Dashboard e Início. |
| `error.tsx` | `/app/error.tsx` | v1.14.0 | Error boundary global (`"use client"`). Exibe `lim f(t) = ∅` com `t→0` subscrito sob `lim` em display font com gradiente vermelho. `error.digest` como ref. Botões "Tentar novamente" e Dashboard. |

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

### Libs e componentes criados no lote v1.13.0

> Arquivos de código com papel de documentação implícita — citados aqui para rastreabilidade.

| Arquivo | Caminho | Versão | Descrição |
|---|---|---|---|
| `session.ts` | `/lib/session.ts` | v1.13.0 | Sessões com estado no banco (CS-34). `createSession()`, `getSession()`, `invalidateSession()`, `invalidateOtherSessions()`, `touchSession()`. Cookie HMAC 3-part: base64(sessionId).base64(userId).HMAC. |
| `audit.ts` | `/lib/audit.ts` | v1.13.0 | Audit Log de segurança (CS-35). `logEvent()` / `logEventBg()` (fire-and-forget). Catálogo `AUDIT_META` com 6 tipos de eventos. Cast de Json via `JSON.parse(JSON.stringify())` (Prisma v7 sem namespace). |
| `oauth.ts` | `/lib/oauth.ts` | v1.13.0 | Providers OAuth via Arctic (CS-36). `getGoogleProvider()`, `getMicrosoftProvider()`, `isOAuthEnabled()`. Todos os redirect URIs derivados de `APP_URL`. |
| `oauth-flash.ts` | `/lib/oauth-flash.ts` | v1.13.0 | Sistema de flash cookie para erros OAuth (CS-36). `redirectWithOAuthError()` seta cookie `oauth_error` (httpOnly:false, maxAge:30s). `getOAuthErrorMessage()` retorna mensagem localizada. URL permanece limpa. |
| `SessionsSection.tsx` | `/components/profile/SessionsSection.tsx` | v1.13.0 | View de sessões ativas no perfil (CS-34). Lista com IP, user-agent, lastSeenAt relativo. Badge "Esta sessão". Revogar individual e em lote. |
| `AuditSection.tsx` | `/components/profile/AuditSection.tsx` | v1.13.0 | Histórico de segurança no perfil (CS-35). Últimos 50 eventos do usuário. Ícones por variant. Botão "Atualizar". |

### Libs e componentes criados no lote v1.14.0

| Arquivo | Caminho | Versão | Descrição |
|---|---|---|---|
| `totp.ts` | `/lib/totp.ts` | v1.14.0 | Utilitários TOTP (CS-37a). `generateTotpSecret()`, `verifyTotpCode()` via otplib v2 (`verifySync().valid`), `generateQrCodeUrl()` (qrcode data URL), `generateBackupCodes()` (8×XXXX-XXXX-XXXX), `hashBackupCodes()` (bcrypt), `verifyAndConsumeBackupCode()`, `setPendingTwoFactor/getPendingTwoFactor/clearPendingTwoFactor` (cookie HMAC 3-part, maxAge:300s). |
| `TwoFactorSection.tsx` | `/components/profile/TwoFactorSection.tsx` | v1.14.0 | UI de 2FA no perfil (CS-37a). SetupModal (QR→verify→backup codes), DisableModal, RegenModal, status badge com contagem de backups restantes. |
| `KanbanBoard.tsx` | `/components/studio/KanbanBoard.tsx` | v1.15.0 | Quadro Kanban de CSs no Studio (CS-20 · v2 em CS-59). Drag-and-drop HTML5, 4 colunas, CardModal com checklist/datas/comentários, agrupamento por release e filtro por label, auto-save com debounce 800ms. |
| `cs-board.json` | `/docs/cs-board.json` | v1.15.0 | Dados persistentes do Kanban de CSs (schema v2). Sobrevive a resets do banco. Versões espelham o git (reconciliadas em v1.15.0). |
| `kanban.ts` | `/lib/kanban.ts` | v1.15.0 | Módulo puro do Kanban (CS-59): tipos do schema v2, migração v1→v2 idempotente, agrupamento por release e cálculo de prazo. Testável isoladamente. |
| `erd-router.ts` | `/lib/erd-router.ts` | v1.15.0 | Roteamento ortogonal A* das linhas do ERD no Studio (CS-59). Desvia das caixas e respeita os limites do canvas (comportamento Power BI). |

### Libs criadas no lote v1.12.0

> Arquivos de código com papel de documentação implícita — citados aqui para rastreabilidade.

| Arquivo | Caminho | Versão | Descrição |
|---|---|---|---|
| `password-strength.ts` | `/lib/password-strength.ts` | v1.12.0 | Utilitário puro de política de senha (CS-33). `checkPasswordRules()` verifica 5 regras. `getPasswordStrength()` retorna 4 níveis. `validatePasswordStrict()` retorna erro da primeira regra que falha. Sem imports server-only — usável em client e server. |
| `login-attempts.ts` | `/lib/login-attempts.ts` | v1.12.0 | Rate limiting por IP (CS-32). `checkLoginGate()` com janela deslizante — retorna `ok`, `captcha` ou `blocked`. `recordAttempt()` com limpeza lazy de registros >24h. `verifyCaptcha()` via Cloudflare Turnstile API. `getClientIp()` lê `x-forwarded-for`. |

### Componentes criados no lote v1.12.0

| Arquivo | Caminho | Versão | Descrição |
|---|---|---|---|
| `PasswordStrengthBar.tsx` | `/components/auth/PasswordStrengthBar.tsx` | v1.12.0 | Barra visual de força de senha (CS-33). 4 segmentos com cor progressiva: vermelho/âmbar/cyan-dim/cyan. Lista de requisitos faltando em tempo real. Badge verde quando todos os requisitos são atendidos. |
| `TurnstileWidget.tsx` | `/components/login/TurnstileWidget.tsx` | v1.12.0 | Widget Cloudflare Turnstile (CS-32). Carrega script dinamicamente (sem duplicação). Tema dark. Fallback para sitekey de teste. Props: `onToken`, `onExpire`. |

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

*Índice gerado em 08/06/2026 · Versão da plataforma: v1.15.4*
