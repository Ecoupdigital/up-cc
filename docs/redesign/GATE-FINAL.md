# GATE FINAL — UP v2 (Fases 5+6)

Aceite final com provas REAIS. Repo: `/home/projects/up-cc`. Branch: `redesign/up-v2-github-native`.
Data: 2026-05-30. Ambiente: Linux (VPS Dev), node v22.22.2.

Regra de seguranca respeitada: **nenhum** project/issue criado no Multica de producao
(so `--help`/`--dry-run` e teste de fail-open com `multica` ausente do PATH em dir isolado `/tmp`).
**Nenhuma** issue/PR no GitHub real.

## Veredito

| # | Check | Resultado |
|---|---|---|
| 1 | Sintaxe `node -c` (5 arquivos) | **PASS** |
| 2 | Onda 2 grep zero (6 agentes deletados) | **FAIL** (2 sobras documentais, nao-funcionais) |
| 3 | Contagem agentes == 12 + up-tester + executor routing | **PASS** |
| 4 | Contagens estaveis (commands 7, workflows 12) | **PASS** |
| 5 | Multica dry-run + fail-open + uname/dryRun em todas funcoes | **PASS** |
| 6 | Install smoke (HOME temp): 12 agents, 7 commands, sem agente morto | **PASS** |
| 7 | Versao 2.0.0 (up + root) + CHANGELOG 2.0.0 com tabela migracao | **PASS** |
| 8 | Isolamento (1 worktree, zero issues de teste) | **PASS** |
| 9 | Regressao (timestamp + github status) | **PASS** |

**Resultado global: 8/9 PASS.** O unico FAIL (check 2) e cosmetico/documental,
nao bloqueia funcionalidade. Detalhe e fix sugerido abaixo.

---

## Detalhe por check

### 1. Sintaxe — PASS
`node -c` PASS em todos:
- `up/bin/lib/multica.cjs`
- `up/bin/lib/github.cjs`
- `up/bin/up-tools.cjs`
- `up/bin/lib/core.cjs`
- `up/bin/install.js`

### 2. Onda 2 grep zero — FAIL (2 sobras documentais)
Esperado 0 referencias aos 6 deletados em `up/commands up/workflows up/references up/templates up/bin`.
Encontradas **2 sobras**, ambas em texto de cabecalho (comentario humano), NAO em logica/spawn:

- `/home/projects/up-cc/up/references/engineering-principles.md:4`
  > `Carregado por todos os agentes executores (up-executor, up-frontend-specialist, up-backend-specialist, up-database-specialist).`
  Cita 3 deletados (`up-frontend-specialist`, `up-backend-specialist`, `up-database-specialist`).

- `/home/projects/up-cc/up/templates/design-tokens.md:4`
  > `Usado pelo up-visual-critic como baseline para avaliar consistencia visual.`
  Cita 1 deletado (`up-visual-critic`).

Zero sobras para `up-exhaustive-tester` e `up-api-tester`.
Nada disso e invocacao de agente (sao descricoes em prosa). Impacto: documentacao
desatualizada. **Fix sugerido:** trocar a lista por `up-executor` (que absorveu os
specialists) na linha 4 de engineering-principles.md, e por `up-tester` na linha 4
de design-tokens.md.

### 3. Agentes == 12 — PASS
`ls up/agents | wc -l` = **12**. Os 12:
`up-arquiteto`, `up-auditor`, `up-depurador`, `up-executor`, `up-mapeador-codigo`,
`up-pesquisador`, `up-planejador`, `up-revisor`, `up-roteirista`, `up-sintetizador`,
`up-tester`, `up-verificador`.

- `up-tester` existe com frontmatter valido (`name`, `description`, `tools` incl.
  `mcp__plugin_playwright_playwright__*`, `model: sonnet`, `color: red`). Description
  declara substituir up-visual-critic + up-exhaustive-tester + up-api-tester (3 passes).
- `up-executor` faz routing por CONTEXTO: bloco `<domain_routing>` com tabela
  frontend (`.tsx/.jsx/.vue` -> Frontend Specialist) / backend (`route.ts`, FastAPI/
  Express -> Backend Specialist) / database (`migrations/`, `.prisma` -> Database
  Specialist), carregando ref de dominio sob demanda. Declara explicitamente que
  absorve os 3 specialists.

### 4. Contagens estaveis — PASS
- `up/commands` = **7**: auditar, build, depurar, plan, rapido, testar, up.
- `up/workflows` = **12**: auditar, build, dcrv, governance, mapear-codigo,
  onboarding, pausar, plan, rapido, remover-fase, resetar, up.

### 5. Multica dry-run + fail-open — PASS
- **Dry-run** (`multica sync --phase 1 --status in_progress --dry-run`): exit **0**,
  imprimiu o comando que rodaria sem executar:
  `command: "multica issue status '<issue-id>' in_progress --output json"`
  + `lookup_command: "multica issue list --metadata up_project=up-cc --metadata up_phase=1 --output json"`. Nada mutado.
- **Fail-open** (`PATH=/usr/bin:/bin` SEM `multica`, em dir isolado `/tmp/up-failopen-test`,
  modo NAO dry-run): exit **0**, retornou
  `{ ok:false, warning:"multica issue list falhou: spawnSync multica ENOENT (board ignorado, build segue)" }`.
  Avisou e seguiu, nao crashou. Board de producao nao foi tocado (multica ausente do PATH).
- **multica.cjs** tem deteccao `uname` (`unameSync`/`isMac`, linhas 39-50: Darwin ->
  prefixo `ssh server-ecoup`, Linux -> direto) e parametro `dryRun` em **todas** as
  funcoes mutadoras: `ensureProject`, `ensurePhaseIssue`, `syncStatus`. `boardUrl` nao
  muta nada (so monta URL). Fail-open via `runMultica` try/catch em todas as chamadas.

### 6. Install smoke (HOME temp) — PASS
`HOME=/tmp/up-final-$$ node up/bin/install.js --claude --global`: exit **0**.
Saida confirma `UP v2.0.0`, `Installed 7 commands`, `Installed 12 agents`,
`Installed 3 hooks`, `Wrote VERSION (2.0.0)`. Scan de nomes mortos nos agentes
instalados: **0** (nenhum frontend/backend/database-specialist, visual-critic,
exhaustive-tester, api-tester). Contagem real de `up-*` instalados = 12. Temp limpo.

### 7. Versao 2.0.0 — PASS
- `up/package.json`: `"version": "2.0.0"`.
- root `package.json`: `"name": "up-cc"`, `"version": "2.0.0"` (e o pacote up-cc, logo
  conta como root).
- CHANGELOG: existe em `/home/projects/up-cc/up/CHANGELOG.md` (nao na raiz). Tem secao
  `## 2.0.0` declarada major/breaking, com **tabela de migracao** (comando antigo ->
  novo) e secao "Migracao do `.plano/` legado". (Nota: nao ha CHANGELOG.md na raiz do
  repo; o changelog do pacote vive em `up/CHANGELOG.md`.)

### 8. Isolamento — PASS
`git worktree list` mostra **so** o principal:
`/home/projects/up-cc 9eb118b [redesign/up-v2-github-native]`. Nenhum worktree de teste.
Nenhuma issue/PR criada em Multica ou GitHub (dry-run + fail-open apenas).
Temp dirs de teste removidos (`/tmp/up-final-*`, `/tmp/up-failopen-*` ausentes).

### 9. Regressao rapida — PASS
- `node up/bin/up-tools.cjs timestamp` -> `{ "timestamp": "2026-05-30T15:36:47.328Z" }`.
- `github status` (rodado em `/tmp`) -> JSON valido
  `{ github_native:true, merge_strategy:"squash", gh_available:true, has_remote:false, ... }`.
  Nada da Fase 4 quebrou.

---

## FAILs (com erro exato + caminho)

1. **Check 2 — 2 referencias documentais a agentes deletados:**
   - `/home/projects/up-cc/up/references/engineering-principles.md:4` cita
     `up-frontend-specialist`, `up-backend-specialist`, `up-database-specialist`.
   - `/home/projects/up-cc/up/templates/design-tokens.md:4` cita `up-visual-critic`.

   Severidade: BAIXA (texto de cabecalho, nao logica). Nao bloqueia release, mas
   recomenda-se corrigir para coerencia com o corte de agentes da Onda 2.
