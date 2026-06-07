# Lyfx — Git Workflow
> Estrutura de branches e processo de subida para o GitHub  
> Válido a partir de 25/05/2026

---

## Visão geral

O Lyfx usa **dois branches permanentes** — nada mais aparece no GitHub fora de uma sessão de trabalho ativa.

```
master   ← produção (o que está estável e "no ar")
develop  ← desenvolvimento (onde todo trabalho acontece)
```

---

## Por que dois branches?

| Cenário | master | develop |
|---------|--------|---------|
| Código que você usa hoje | ✅ | ✅ |
| Trabalho em andamento | ❌ | ✅ |
| Onde o agente implementa | ❌ | ✅ (via branch temporária) |
| Commit direto permitido | ❌ | ❌ |
| Avança via merge de | `develop` | branch de trabalho |

---

## Fluxo completo de uma sessão de CSs

### 1. Início da sessão — agente parte de `develop`

```bash
git checkout develop
git pull origin develop          # garantir que está atualizado
git checkout -b fix/nome-do-cs   # branch temporária de trabalho
```

### 2. Implementação — commits na branch de trabalho

```bash
# trabalho normal, commits descritivos
git add <arquivos>
git commit -m "fix(módulo): descrição [CS-XX]"
```

### 3. QA — Agent Smith valida no browser

O servidor roda na branch de trabalho. Testes de browser confirma o comportamento.

### 4. Aprovação — você confirma na conversa

Sem aprovação explícita, o agente não avança para o merge.

### 5. Merge em `develop` — branch de trabalho some

```bash
git checkout develop
git merge fix/nome-do-cs --no-ff -m "merge: fix/nome-do-cs → develop [CS-XX]"
git push origin develop

# deletar imediatamente — local e remoto
git branch -d fix/nome-do-cs
git push origin --delete fix/nome-do-cs
```

**Resultado no GitHub:** apenas `master` e `develop` visíveis. Nada mais.

### 6. Release — você decide quando ir para produção

Quando o lote de CSs estiver testado e aprovado por você:

```bash
git checkout master
git merge develop --no-ff -m "release: v1.X.Y — [resumo do que entrou]"
git push origin master
```

---

## Worktree de produção

O ambiente de produção roda em um worktree separado em `../lyfx-production` (branch `master`, porta 4000).

**Setup inicial do worktree** — rodar uma vez ao criar `lyfx-production/`:

```bash
cd C:/Users/rudne/projetos/lyfx-production
npm install
npx prisma generate
npx prisma db push   # cria prod.db com o schema completo
```

**Regra:** sempre que um `npm install` ou `npm uninstall` for executado em `lyfx/`, rodar o mesmo comando em `lyfx-production/` na sequência:

```bash
# Exemplo — instalar novo pacote
cd C:/Users/rudne/projetos/lyfx && npm install <pacote>
cd C:/Users/rudne/projetos/lyfx-production && npm install <pacote>
```

Isso garante que os dois ambientes permanecem com `node_modules` idênticos.

---

## Isolamento de bancos de dados por ambiente

Cada ambiente tem seu próprio arquivo `.env` (gitignored — nunca rastreado pelo git) com `DATABASE_URL` apontando para seu banco exclusivo:

| Ambiente | Arquivo `.env` | `DATABASE_URL` | Banco |
|----------|---------------|----------------|-------|
| Desenvolvimento | `lyfx/.env` | `file:./dev.db` | `lyfx/dev.db` — dados de teste, pode ser resetado livremente |
| Produção local | `lyfx-production/.env` | `file:./prod.db` | `lyfx-production/prod.db` — dados reais do usuário |

**Por que merges não afetam o banco:**
Como `.env*` está no `.gitignore`, o arquivo de configuração de cada ambiente nunca entra no git. Ao fazer `develop → master`, o `lyfx-production/.env` permanece intocado — o banco de produção é sempre preservado automaticamente.

**Regra crítica:** nunca alterar `DATABASE_URL` em `lyfx-production/.env` para apontar para `dev.db`. Cada ambiente aponta exclusivamente para seu próprio arquivo de banco.

---

## Convenção de portas

| Ambiente | Branch | Porta | Comando |
|----------|--------|-------|---------|
| Desenvolvimento | `develop` | **3000** | `npm run dev -- --port 3000` |
| Produção local | `master` | **4000** | `npm run dev -- --port 4000` |

- Portas 3001–3009 reservadas para branches temporárias de trabalho em `develop`
- Portas 4001–4009 reservadas para testes pontuais em `master`
- Nunca subir `master` em porta 3000–3009 nem `develop` em porta 4000–4009

---

## Diagrama temporal

```
develop  ──●──────────────────●────────────────── (merge de lote)──►
            │                 │                         │
            └─ fix/cs-01 ─────┘ (deletado)              │
               feature/cs-06 ────────────────────────────┘ (deletado)

master   ──────────────────────────────────────────────●────────────►
                                                    (release aprovado)
```

---

## Nomenclatura de branches temporárias

| Prefixo | Exemplo | Quando usar |
|---------|---------|-------------|
| `fix/` | `fix/security-login` | Correção de bug, segurança, validação |
| `feature/` | `feature/tags-edit` | Nova funcionalidade |
| `refactor/` | `refactor/session-module` | Refatoração sem mudança de comportamento |

> Branches de trabalho são descartáveis. Nascem e morrem dentro do mesmo lote de CSs.

---

## Pergunta obrigatória antes do E7

Antes de qualquer merge `develop → master`, o agente **deve perguntar ao usuário**:

> *"O lote está em `develop`. Quer validar antes ou posso fazer o release para `master` agora?"*

Nunca assumir que aprovação de implementação = aprovação de release para produção.

---

## Regras invioláveis

1. **Nunca commitar direto em `master`** — sem exceção
2. **Nunca commitar direto em `develop`** — sempre via branch de trabalho + merge
3. **Deletar branches após merge** — imediatamente, local e remoto
4. **Sempre usar `--no-ff`** nos merges — preserva histórico de quem fez o quê
5. **`master` só avança via `develop`** — nunca via branch de trabalho diretamente
6. **Release só com aprovação explícita** — o agente nunca faz `develop → master` por conta própria
7. **Todo merge para `master` exige documentação atualizada** — `DOCUMENTATION.md` (seções técnicas afetadas) e `docs/FEATURES.md` (seções de produto afetadas) devem estar atualizados antes do merge. Sem documentação, sem merge.
8. **Toda nova feature exige plano de testes** — qualquer lote que inclua nova funcionalidade deve atualizar `docs/QA-TEST-PLAN.md` com cenários de teste automatizados para a feature antes do merge para `master`.

---

## E7 — Checklist de release (develop → master)

Execute nesta ordem. Nenhum passo é opcional.

### 1. Determinar a nova versão

Consultar `VERSIONING.md` para decidir se é PATCH, MINOR ou MAJOR com base no que entrou no lote.

### 2. Atualizar `package.json`

```json
"version": "X.X.X"
```

### 3. Atualizar `README.md`

Dois pontos obrigatórios:

**Badge de versão** (linha ~10):
```markdown
![Version](https://img.shields.io/badge/version-X.X.X-22D3EE?style=flat-square)
```

**Rodapé** (última linha):
```markdown
*vX.X.X · Mês Ano · Projeto pessoal em desenvolvimento ativo.*
```

**Tabela de módulos** — adicionar linha se o lote incluiu novo módulo:
```markdown
| **NomeDoMódulo** | Descrição do que faz |
```

### 4. Atualizar `VERSIONING.md`

Adicionar linha na tabela de histórico:
```markdown
| `X.X.X` | PATCH/MINOR/MAJOR | O que foi construído neste lote |
```

Remover a entrada de "Próximos marcos" correspondente se ela existir.

### 5. Atualizar `DOCUMENTATION.md` — planta técnica

**Cabeçalho** (linha 2):
```markdown
> Lyfx — Documentação Técnica · vX.X.X · Mês Ano
```

**Seções afetadas** — atualizar apenas as seções que o lote tocou:
- Novo módulo → rotas, Server Actions, schema Prisma, fórmulas de cálculo, fluxo de dados
- Mudança de autenticação → atualizar "Autenticação e Sessão"
- Novo campo no schema → atualizar "Schema do Banco de Dados" com modelo completo anotado
- Nova integração externa → documentar endpoint, parâmetros, resposta esperada, gotchas
- Nova decisão arquitetural → adicionar em "Decisões Arquiteturais" com justificativa técnica

### 6. Atualizar `docs/FEATURES.md` — narrativa de produto

Audiência: analista, gestor, usuário em capacitação — linguagem não-técnica.

**Seções afetadas** — atualizar apenas as seções que o lote tocou:
- Nova feature → novo capítulo com: o que faz, como usar, onde vai a informação, interação com outros módulos, valor ao usuário, referencial de negócio
- Feature modificada → atualizar descrição, fluxo e impactos
- Não mencionar rotas, Prisma, código ou nomes de variáveis neste documento

### 7. Atualizar `docs/QA-TEST-PLAN.md` *(obrigatório se o lote incluiu nova feature)*

Para cada nova funcionalidade, adicionar seção com:
- Cenários de teste (happy path + edge cases)
- Critérios de aceite mensuráveis
- Passos de reprodução para Agent Smith

Se apenas bugfixes no lote → verificar se algum teste existente ficou desatualizado e corrigir.

### 8. Fazer o merge e a tag

```bash
git checkout master
git merge develop --no-ff -m "release: vX.X.X — [resumo do lote]"
git tag vX.X.X
git push origin master --tags
git checkout develop
git merge master --no-ff -m "chore: sync develop após release vX.X.X"
git push origin develop
```

> O último merge (master → develop) garante que develop não fique atrás de master após o release.

---

## Estado atual (07/06/2026)

| Branch | Versão | Conteúdo |
|--------|--------|----------|
| `master` | v1.10.0 | CS-01 a CS-17 implementados e QA aprovado — inclui Reembolso Especial completo |
| `develop` | v1.10.0 | Idêntico ao master — base para próximos trabalhos |

Próximos releases previstos: `v1.11.0` — Studio Roadmap/Backlog (CS-20) · `v1.12.0` — Importação OFX/CSV (CS-21).
