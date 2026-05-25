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

## Regras invioláveis

1. **Nunca commitar direto em `master`** — sem exceção
2. **Nunca commitar direto em `develop`** — sempre via branch de trabalho + merge
3. **Deletar branches após merge** — imediatamente, local e remoto
4. **Sempre usar `--no-ff`** nos merges — preserva histórico de quem fez o quê
5. **`master` só avança via `develop`** — nunca via branch de trabalho diretamente
6. **Release só com aprovação explícita** — o agente nunca faz `develop → master` por conta própria

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

### 5. Atualizar `DOCUMENTATION.md`

**Cabeçalho** (linha 2):
```markdown
> Lyfx — Documentação Técnica · vX.X.X · Mês Ano
```

**Seções afetadas** — atualizar apenas as seções que o lote tocou:
- Novo módulo → adicionar entrada em "Funcionalidades"
- Mudança de autenticação → atualizar "Autenticação e Sessão"
- Novo campo no schema → atualizar "Schema do Banco de Dados"
- Nova decisão arquitetural → adicionar em "Decisões Arquiteturais"

### 6. Fazer o merge e a tag

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

## Estado atual (25/05/2026)

| Branch | Versão | Conteúdo |
|--------|--------|----------|
| `master` | v1.5.0 | 14 CSs implementados e QA aprovado (CS-01 a CS-14) |
| `develop` | v1.5.0 | Idêntico ao master — base para próximos trabalhos |

Próximo release previsto: `v1.6.0` — Módulo de Educação Financeira (`/education`).
