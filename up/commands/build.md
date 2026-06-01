---
name: up:build
description: Use quando o usuario quer EXECUTAR um projeto ja planejado (existe .plano/PLAN-READY.md). Default GitHub-nativo por fase (worktree, issue, PR, merge) via gh OU MCP. Flag --solo = autonomo total mantendo GitHub (sem menu, sem gate visual); --auto pula so o menu; --local pula o GitHub (commit atomico na branch atual); --board espelha no Multica.
argument-hint: "[--solo] [--auto] [--local] [--board]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
  - mcp__plugin_playwright_playwright__*
---
<objective>
Executar projeto que foi previamente planejado. Requer `.plano/PLAN-READY.md` no diretorio atual.

Absorve `/up:executar-fase`, `/up:executar-plano` e a parte de EXECUCAO do antigo `/up:modo-builder`. O `/up:build` e o motor unico de execucao: roda o PROJETO INTEIRO (todas as fases), nao so uma fase.

Conduz, por fase:
1. Validacao light do plano (artefatos existem, planos OK)
2. Execucao em WAVES PARALELAS (varios `up-executor` por wave; planejador local se precisar replan -> verificador)
3. **GATE deterministico** via `approvals.log` (sem supervisor LLM; exige evidencia TDD por tipo)
4. Review consolidado via `up-revisor` (two-stage: spec-compliance cetico + code-quality)
5. Teste visual antes do merge (fase de UI) + menu de fim de fase

**Caso de uso principal:** executar projeto planejado, possivelmente em runtime diferente do que planejou.
Exemplo: planejou em Claude Code (`/up:plan "X"`), agora roda em OpenCode (`/up-build`).

**Re-plan local permitido (max 1 round):** se durante a execucao ficar claro que o plano esta inviavel, o `up-planejador` LOCAL refaz a fase (self-check). Nao volta pro runtime que planejou originalmente. Registrar em `.plano/governance/replans.log`.
</objective>

<execution_context>
@~/.claude/up/workflows/build.md
@~/.claude/up/workflows/dcrv.md
@~/.claude/up/workflows/governance.md
</execution_context>

<context>
$ARGUMENTS

**Flags** (GitHub e a interacao humana sao eixos SEPARADOS; as flags so mexem na interacao):
- (sem flag) = **GitHub-nativo, o DEFAULT** (`config.github_native=true`): cada fase abre worktree + branch `up/fase-NN-slug` + issue (via `gh` OU MCP do GitHub), executa, sobe o dev server pra teste visual (se houver UI) e oferece o menu de fim de fase.
- `--solo` - **autonomo total**. NAO desliga o GitHub: cria worktree/branch/issue/PR e auto-mergeia, SEM menu e SEM gate visual. Pra loop/headless.
- `--auto` - pula so o menu de fim de fase (merge automatico). Mantem GitHub. O teste visual ainda roda se `require_visual_test=true`.
- `--local` - **ESCAPE HATCH sem GitHub**. Commit atomico na branch ATUAL, zero worktree/issue/PR/board. (Mesmo que `/up:rapido`.) Unico jeito de pular o GitHub.
- `--board` - espelha o progresso das fases no Multica (board opt-in, batched, fail-open).

O comando le o resto de `.plano/PLAN-READY.md`.
</context>

<process>
**GATE 1 - Owner Profile LOCAL:**
Verificar se `~/.claude/up/owner-profile.md` existe NESTE runtime.
Se nao: rodar o subverbo config do `/up` primeiro (workflow onboarding.md).

**GATE 2 - PLAN-READY.md:**
```bash
if [ ! -f .plano/PLAN-READY.md ]; then
  echo "ERRO: Este projeto nao foi planejado."
  echo "Use /up:plan primeiro pra planejar."
  echo "Ou /up \"<descricao>\" pra brainstorm + plan + build de uma vez."
  exit 1
fi
```

**GATE 3 - Validacao Light:**
Spot-check estrutura:
- Artefatos arquiteturais existem (PROJECT, ROADMAP, REQUIREMENTS, SYSTEM-DESIGN)?
- Todos planos listados em PLAN-READY.md existem no disco?
- Frontmatter dos planos e valido?

**Confiar no PLAN-READY.md.** NAO re-rodar planning em tudo.
Se algo falta: alertar e oferecer planejamento local OU abortar.

**Sem model routing:** O runtime decide o modelo.

**Parsear flags primeiro:** extrair `--solo`/`--auto`/`--local`/`--board`. Sem flag = GitHub-nativo (default).

**Modo de orquestracao (resolver antes de comecar):**
- DEFAULT (sem `--local`): GitHub-nativo. Por fase: `up-tools.cjs github start-phase` (worktree + branch + issue via gh OU MCP, fail-open) -> executa as waves -> gate -> teste visual pre-merge (se UI) -> `github finish-phase` (PR -> merge squash -> cleanup) conforme o menu. `--auto` pula o menu (mantem GitHub). `--solo` pula menu E gate visual (autonomo total, mantem GitHub). `--board` adiciona `multica init/sync` (batched).
- `--local`: executa local, commits atomicos na branch atual. Sem worktree/issue/PR/board.

**Execute the build workflow from @~/.claude/up/workflows/build.md end-to-end.**

Pipeline por fase:
1. Validacao light
2. `github start-phase` (worktree + issue via gh OU MCP; pulado so em `--local`)
3. Execucao em WAVES PARALELAS: os planos da mesma wave rodam ao mesmo tempo (varios `up-executor`); waves em sequencia. Re-plan local se algum plano ficar inviavel.
4. up-verificador emite VERIFICATION.md com evidencia fresca por tipo (TDD-por-tipo: red-green / visual / smoke)
5. **GATE deterministico** `approvals.log` (governance.md, gate-only; exige `evidence=`)
6. up-revisor (two-stage: spec-compliance cetico + code-quality) alimenta o gate
7. **Teste visual pre-merge** (fase de UI e `require_visual_test=true`): sobe o dev server na worktree, "testar primeiro ou pode mergear?", loop de ajuste ate aprovar
8. **Menu de fim de fase** (GitHub-nativo, fora `--auto`/`--solo`): merge local / abrir PR / deixa a branch / descarta. Autonomo (`--solo`/`--auto`) auto-mergeia sem menu. Em `--local`, ja committou na branch atual
9. Reassessment do roadmap antes da proxima fase

**Re-plan local permitido (max 1 round por fase):**
Se ficar inviavel, o up-planejador LOCAL refaz a fase. Registrar em `.plano/governance/replans.log`.

**A partir do inicio do build, ZERO interacao com usuario** (exceto alertas criticos e o menu de fim de fase).
</process>

<success_criteria>
- [ ] PLAN-READY.md validado
- [ ] Flags parseadas (default = GitHub-nativo; --solo/--auto = autonomia mantendo GitHub; --local = escape sem GitHub)
- [ ] Build rodou todas as fases; planos da mesma wave em paralelo
- [ ] GATE approvals.log respeitado (deterministico, com evidence= por tipo)
- [ ] Teste visual pre-merge em fase de UI (require_visual_test; pulado em --solo)
- [ ] Fechamento por fase: menu (GitHub-nativo), auto-merge (--solo/--auto) ou commit na branch (--local)
</success_criteria>
