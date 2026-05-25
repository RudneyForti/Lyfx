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
| **E7 — Release** | **Perguntar primeiro:** *"O lote está em `develop`. Quer validar antes ou posso fazer o release para `master`?"* — só avançar com resposta afirmativa explícita. Executar o checklist completo em `docs/GIT-WORKFLOW.md#e7` antes do merge: (1) determinar versão via `VERSIONING.md`, (2) atualizar `package.json`, (3) atualizar badge e rodapé do `README.md`, (4) adicionar linha no histórico de `VERSIONING.md`, (5) atualizar cabeçalho e seções afetadas em `DOCUMENTATION.md`, (6) fazer merge + tag + sync develop |

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

## Sincronização do worktree de produção

Sempre que instalar ou remover um pacote npm em `lyfx/`, replicar imediatamente em `lyfx-production/`:

```bash
npm install <pacote>   # em lyfx/
npm install <pacote>   # em lyfx-production/
```

---

## Convenção de portas

| Branch | Porta | Regra |
|--------|-------|-------|
| `develop` + branches temporárias | **3000–3009** | Sempre neste range |
| `master` | **4000–4009** | Sempre neste range |

Nunca iniciar `master` em porta 3000–3099 nem `develop` em porta 4000–4099.

---

## Referência completa

Ver `docs/GIT-WORKFLOW.md` para o fluxo detalhado com exemplos de comandos.
<!-- END:git-workflow-rules -->
