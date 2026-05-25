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

## Versão e tag no release

A cada merge em `master`, atualizar `package.json` e criar tag:

```bash
# Editar package.json → "version": "1.X.Y"
git add package.json
git commit -m "chore: bump version to 1.X.Y"
git tag v1.X.Y
git push origin master --tags
```

Consultar `VERSIONING.md` para decidir se é PATCH, MINOR ou MAJOR.

---

## Estado atual (25/05/2026)

| Branch | Versão | Conteúdo |
|--------|--------|----------|
| `master` | v1.5.0 | 14 CSs implementados e QA aprovado (CS-01 a CS-14) |
| `develop` | v1.5.0 | Idêntico ao master — base para próximos trabalhos |

Próximo release previsto: `v1.6.0` — Módulo de Educação Financeira (`/education`).
