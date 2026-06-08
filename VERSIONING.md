# Lyfx — Política de Versionamento

> Regra consolidada. Seguida por todos os contribuidores — humanos e agentes.

---

## Formato: `MAJOR.MINOR.PATCH`

### MAJOR — mudança de era do produto

Incrementa quando o produto atravessa uma fronteira irreversível:

| Gatilho | Exemplo |
|---|---|
| Deploy em produção (PostgreSQL + domínio próprio) | `1.x.x` → `2.0.0` |
| Mudança estrutural no banco que exige migração de dados dos usuários | `2.x.x` → `3.0.0` |
| Redesenho completo de arquitetura (ex: troca de framework) | qualquer `x.x.x` → `N.0.0` |

Regra prática: se o usuário precisar fazer algo além de atualizar a aplicação, é MAJOR.

---

### MINOR — nova capacidade

Incrementa quando a aplicação passa a fazer algo que antes não fazia:

| Gatilho | Exemplo |
|---|---|
| Nova página ou módulo | `/education`, `/reports` |
| Nova funcionalidade significativa em módulo existente | editor de reserva, alerta de passivo |
| Nova integração com sistema externo | importação OFX, autenticação OAuth |
| Novo campo com impacto direto em cálculo ou lógica de negócio | `reserveBalance` em Settings |

Regra prática: se o usuário ganhou algo que antes não existia, é MINOR.

---

### PATCH — manutenção

Incrementa quando o comportamento observado pelo usuário não muda, mas o código melhora:

| Gatilho | Exemplo |
|---|---|
| Correção de bug (lógica, TypeScript, UI) | `reimbursedAt` na interface, tipo literal em `useState` |
| Ajuste de segurança sem nova funcionalidade | IDOR, validação de ownership |
| Melhoria de performance sem alteração de API | otimização de query |
| Atualização de dependência sem impacto no comportamento | bump de pacote |
| Correção de documentação | atualizar descrição errada |

Regra prática: se o usuário não perceberia a diferença, é PATCH.

---

## Regra de independência de nomenclatura externa

Documentos externos — relatórios de consultores, feedbacks de analistas, arquivos de revisão pedagógica — chegam com seus próprios nomes ("Fase F", "Revisão 2", "v3 do conteúdo"). Esses nomes **não determinam** a versão do software.

A versão é definida pelo que foi **efetivamente construído**, seguindo os critérios acima.

Exemplo:
- Um documento chamado "Fase F" entregou: um campo novo com impacto em cálculo (MINOR) + correções de bug (PATCH). Resultado: MINOR vence → `1.3.1` → `1.4.0`.
- Um documento chamado "Revisão Pedagógica" que só corrige texto de documentação: PATCH → `1.4.0` → `1.4.1`.

---

## Histórico resumido

| Versão | Tipo | O que foi construído |
|---|---|---|
| `0.5.0` | MINOR | DRE com margens + Dashboard (KPI cards, Insight, trend chart) |
| `0.6.0` | MINOR | Parcelamentos: `installmentGroupId`, modal de edição em 3 modos |
| `0.7.0` | MINOR | Budget: `Settings.expectedMonthlyIncome`, alocações por categoria |
| `0.8.0` | MINOR | Score de saúde financeira: 4 dimensões, 4 perfis, gauge SVG |
| `0.9.0` | MINOR | Passivos: CRUD, método avalanche, calculadora de pagamento extra |
| `1.0.0` | MAJOR | Marco de uso próprio em produção local. Reembolsos com tracking. |
| `1.1.0` | MINOR | Isolamento multi-usuário completo. Studio aprimorado. |
| `1.2.0` | MINOR | Instituições + Alertas (4 tipos) + Perfil de endereço com ViaCEP |
| `1.3.0` | MINOR | Bens e Imóveis: imóveis, veículos, despesas associadas |
| `1.3.1` | PATCH | Auditoria de segurança e bugs (IDOR, tipos, ownership) |
| `1.4.0` | MINOR | `reserveBalance` em Settings + alerta de passivo crítico + 3 correções TS |
| `1.5.0` | MINOR | Módulo de Educação Financeira — 85 pílulas pedagógicas por perfil, quiz de fixação e streak semanal |
| `1.6.0` | MINOR | Segurança: HMAC-SHA256 na sessão, timing defense, validação de e-mail. Novas capacidades: edição inline de tags, navegação de transações por URL, "lembrar de mim" + preservação de rota. Qualidade: 9 correções de bug e UX (parcelas, validações, alertas, relatórios, sidebar, Studio) |
| `1.6.1` | PATCH | Fix: proxy.ts valida HMAC via Web Crypto API no Edge Runtime — elimina loop infinito de redirects quando cookie tem assinatura inválida |
| `1.6.2` | PATCH | Fix: lib/db.ts lê DATABASE_URL do ambiente em vez de caminho hardcoded — permite worktree de produção apontar para dev.db compartilhado |
| `1.6.3` | PATCH | Isolamento completo de bancos por ambiente: prod.db exclusivo para master, dev.db para develop. Merges preservam apontamento via .env gitignored. Documentação atualizada. |
| `1.6.4` | PATCH | Landing page: glassmorphism da navbar restaurado, seção de Pricing, textura de pontos com vignette de borda, FAQ sem layout shift, hover ciano nos links da navbar, marquee do footer atualizado, StepCards com hover animado. |
| `1.6.5` | PATCH | Landing page: seção "Sobre" com narrativa de educação financeira e easter egg f(x); "Sobre" no navbar; alinhamento 2×2 do grid com adorno ciano; travessões substituídos por vírgulas; fix do loop do marquee do footer (width:max-content). |
| `1.6.6` | PATCH | Landing page: internacionalização PT/EN/ES — seletor de idioma com bandeiras monocromáticas na navbar, terminologia financeira regionalizada (DRE / P&L / Estado de Resultados), moedas por locale (R$/$/€), detecção automática via navigator.language com persistência em localStorage. |
| `1.6.7` | PATCH | Landing page: responsividade completa (mobile/tablet/desktop/TV) — hamburger menu pill-ciano, hero padding adaptativo, Sobre em 1 coluna, features e StepCards responsivos, seta dos steps aponta para baixo no mobile, footer reorganizado. |
| `1.7.0` | MINOR | Migração de banco de dados: SQLite → PostgreSQL 18 local. schema.prisma provider atualizado, lib/db.ts sem adapter externo (singleton HMR-safe), bancos lyfx_dev e lyfx_prod criados localmente. |
| `1.7.1` | PATCH | Fix: Prisma v7 com provider=prisma-client exige adapter explícito — instala @prisma/adapter-pg + pg, lib/db.ts usa PrismaPg. |
| `1.7.2` | PATCH | Landing page: versão do footer lida dinamicamente do package.json via prop — zero manutenção manual a cada release. |
| `1.8.0` | MINOR | Studio Grupo 2: Painel dashboard (6 cards de métricas + toggles de configuração), Módulos com toggle de beta por módulo (AppConfig), Notas com toolbar Markdown + slash commands Notion-like, ERD colapsável por tabela, descrições nas tabelas do schema, seeds Full/Insider derivados de `isBeta`, banner de manutenção global, `lib/config.ts` + modelo `AppConfig` |
| `1.8.1` | PATCH | CS-15 Consistência visual: login com viewport lock (100vh), identidade rounded unificada (botões CTA → full, inputs → 12px, modais → 24px), sidebar flutuante com glassmorphism + scroll interno, modo colapsado com espaçamento uniforme, padding-top 48px no main para pílula UserMenu não sobrepor conteúdo |
| `1.9.1` | PATCH | Fix crítico: `lib/db-pills.ts` reescrito com Prisma — workaround better-sqlite3 do v1.5.0 (SQLite) causava `no such table: PillProgress` em produção após migração para PostgreSQL |
| `1.9.0` | MINOR | CS-18/CS-19 Central de notificações: model Notification, sino com badge no UserMenu, segregação alertas automáticos × notificações do sistema (fingerprint), Studio de envio por plano/usuário com histórico, AlertsView com seções distintas + Limpar tudo, banner de manutenção em pill, notificação de boas-vindas automática, Studio Painel redesenhado (2 colunas, gauges SVG RAM/Heap/CPU, métricas lastSeenAt, versionamento de branch git), correções TypeScript em GoalsView e TagPicker |
| `1.10.0` | MINOR | CS-17 Reembolso Especial: módulo corporativo completo de KM (trajetos com Google Maps arrastável, notas de combustível, despesas extras, resumo SAP, D+5 dias úteis, Transaction automática). CS-17b PDF exportável server-side com mapas embutidos, redesign visual (fundo cinza, padrão de bolinhas, header escuro, logotipo tipográfico, mini-header nas páginas 2+, resumo sem quebra de página), polyline de rota via KmPlace como fonte da verdade. bodySizeLimit 5mb para Server Actions. |
| `1.11.0` | MINOR | Lote de qualidade e segurança. CS-25: D+5 agora considera feriados nacionais via BrasilAPI (lib/holidays.ts + lib/km-utils.ts — async com fallback gracioso). CS-26: timingSafeEqual no login do Studio, cookie lyfx_admin com secure em produção, requireAdmin() em mutations de planos, getUnreadCount com session interna. CS-27: motor centralizado de alertas (lib/alert-engine.ts) — elimina duplicação entre getAlerts e syncDangerAlerts. CS-28: Promise.all em health/dashboard, timeout ViaCEP 5s, try/catch em mutations de transação. CS-29: tipagem mapTx sem any, PT_MONTHS centralizado em lib/i18n.ts, requireAuth() padronizado. CS-30: db-pills.ts removido, FK explícita KmPeriod→Transaction, SQLite movido para devDependencies. |
| `1.12.0` | MINOR | CS-32: Rate limiting + CAPTCHA Cloudflare Turnstile. Proteção de login por IP com janela deslizante configurável via Studio (threshold CAPTCHA, threshold bloqueio, janela de tempo). Integração com Cloudflare Turnstile (widget dark, bypass em dev). Modelo `LoginAttempt` no banco. CS-33: Política de senha forte com indicador visual. 5 regras obrigatórias (8+ chars, maiúscula, minúscula, número, especial). Barra de 4 segmentos com cor progressiva (vermelho → âmbar → cyan). Indicador de match em tempo real no campo de confirmação. Aplicado no cadastro e na troca de senha do perfil. |
| `1.11.3` | PATCH | CS-31: Fundação de segurança. Proxy middleware com validação HMAC completa protegendo todas as rotas da app. 6 headers HTTP de segurança (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS, X-XSS-Protection). Página 404 customizada com identidade Lyfx (f(404) = ∄). Error boundary global sem vazar stack traces. 7 novos casos de teste no QA plan (SEC-19→SEC-25). |
| `1.11.2` | PATCH | CS-23: Docker completo com PostgreSQL containerizado. Dois grupos isolados: Dev (db-dev PG18 + lyfx-dev) e Prod (db-prod PG18 + migrate + lyfx). Stage migrator no Dockerfile (prisma db push). Volumes nomeados lyfx_dev_data / lyfx_prod_data. Fix PG18: volume em /var/lib/postgresql. Fix Docker v5: interpolação ${} com --env-file em vez de env_file para vars sem aspas. depends_on service_healthy + service_completed_successfully. |
| `1.11.1` | PATCH | CS-23: containerização Docker completa. Dockerfile multi-stage (deps → builder → runner standalone). `output: "standalone"` + `force-dynamic` em login/studio/(app)/layout para build sem banco. Fix Prisma v7: client copiado de `lib/generated/prisma` no runner. docker-compose.yml (prod, 4000) + docker-compose.dev.yml (dev, 3000) ambos com healthcheck Node.js HTTP. Scripts npm docker:*. .env.docker.example. Ambientes dev e prod migrados para Docker-first. |

---

## Próximos marcos esperados

| Versão | Tipo | Conteúdo previsto |
|---|---|---|
| `2.0.0` | MAJOR | Deploy em produção: PostgreSQL, domínio próprio, HTTPS |

---

*Este documento é a fonte de verdade para decisões de versão. Em caso de dúvida, consulte-o antes de incrementar.*
