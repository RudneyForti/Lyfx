<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-workflow-rules -->
# Git Workflow — Regras para Agentes

## Estrutura de branches

```
master   ← produção (estável, nunca recebe commit direto)
develop  ← desenvolvimento (branch base para todo trabalho)
```

## Pipeline NEO — etapas Git

| Etapa | O que fazer |
|-------|-------------|
| **E3 — Implementar** | Criar branch de trabalho **a partir de `develop`**: `git checkout develop && git checkout -b fix/nome` ou `feature/nome` |
| **E6 — Commit** | Merge da branch de trabalho em `develop`: `git checkout develop && git merge fix/nome --no-ff` → push → **deletar branch imediatamente** |
| **E7 — Release** | Somente quando o usuário aprovar o lote completo: `git checkout master && git merge develop --no-ff` → push |

## Regras obrigatórias

- **Nunca** criar branch a partir de `master`
- **Nunca** fazer commit direto em `master` ou `develop`
- **Sempre** deletar a branch de trabalho após o merge em `develop` (local e remoto)
- **Sempre** usar `--no-ff` nos merges para preservar histórico
- `master` só avança via merge de `develop`, nunca por commit direto
- Branch de trabalho existe apenas durante a implementação — nasce e morre no mesmo lote de CSs

## Nomenclatura de branches

| Prefixo | Quando usar |
|---------|-------------|
| `fix/` | Correção de bug ou segurança |
| `feature/` | Nova funcionalidade |
| `refactor/` | Refatoração sem mudança de comportamento |
| `release/` | Apenas para branches de release com versão (ex: `release/v2.0.0`) |

## Referência completa

Ver `docs/GIT-WORKFLOW.md` para o fluxo detalhado com exemplos de comandos.
<!-- END:git-workflow-rules -->
