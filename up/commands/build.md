---
name: up:build
description: Use quando o usuario quer EXECUTAR um projeto ja planejado (existe .plano/PLAN-READY.md). Default --solo (commit atomico na branch atual). Flags --pr/--board/--auto sao opt-in de cerimonia.
argument-hint: "[--solo|--pr] [--board] [--auto]"
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
2. Execucao (planejador local se precisar replan -> executor/specialists -> verificador)
3. **GATE deterministico** via `approvals.log` (sem supervisor LLM)
4. Review consolidado via `up-revisor` (two-stage: spec-compliance cetico + code-quality)
5. Menu de 4 opcoes no fim de cada fase

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

**Flags (interface alvo GitHub-nativa / Multica):**
- `--solo` (DEFAULT) — commit atomico na branch ATUAL. Zero worktree, zero issue, zero PR, zero board. E o caminho quente.
- `--pr` — modo GitHub-nativo: worktree por fase -> issue -> commits -> PR -> merge. **TODO Fase 4 (GitHub-native).** Por ora documenta a interface; orquestracao real e stub.
- `--board` — espelha o progresso no Multica (board opt-in, batched). **TODO Fase 5 (Multica).** Stub.
- `--auto` — em `--pr`, faz merge automatico se CI verde + verificador passou. **TODO Fase 4 (GitHub-native).** Stub.

Sem flag = `--solo`. O comando le o resto de `.plano/PLAN-READY.md`.
</context>

<process>
**GATE 1 — Owner Profile LOCAL:**
Verificar se `~/.claude/up/owner-profile.md` existe NESTE runtime.
Se nao: rodar o subverbo config do `/up` primeiro (workflow onboarding.md).

**GATE 2 — PLAN-READY.md:**
```bash
if [ ! -f .plano/PLAN-READY.md ]; then
  echo "ERRO: Este projeto nao foi planejado."
  echo "Use /up:plan primeiro pra planejar."
  echo "Ou /up \"<descricao>\" pra brainstorm + plan + build de uma vez."
  exit 1
fi
```

**GATE 3 — Validacao Light:**
Spot-check estrutura:
- Artefatos arquiteturais existem (PROJECT, ROADMAP, REQUIREMENTS, SYSTEM-DESIGN)?
- Todos planos listados em PLAN-READY.md existem no disco?
- Frontmatter dos planos e valido?

**Confiar no PLAN-READY.md.** NAO re-rodar planning em tudo.
Se algo falta: alertar e oferecer planejamento local OU abortar.

**Sem model routing:** O runtime decide o modelo.

**Parsear flags primeiro:** extrair `--solo`/`--pr`/`--board`/`--auto`. Sem flag = `--solo`.

**Modo de orquestracao GitHub/Multica:**
- `--solo` (default): executa local, commits atomicos na branch atual. ESTE e o caminho implementado hoje.
- `--pr` / `--board` / `--auto`: a interface esta documentada, mas a maquinaria git worktree / gh / multica e **stub nesta fase**.
  - **TODO Fase 4 (GitHub-native):** EnterWorktree (fallback `git worktree add`) -> `gh issue create` por fase -> commits no worktree -> `gh pr create --base main` -> merge squash + cleanup.
  - **TODO Fase 5 (Multica):** `multica project create` + issue por fase + `multica issue status` batched no fim da onda.

**Execute the build workflow from @~/.claude/up/workflows/build.md end-to-end.**

Pipeline por fase (apos as trocas de spawn da reescrita de workflow):
1. Validacao light
2. Execucao (up-executor / specialists; up-planejador local se replan)
3. up-verificador emite VERIFICATION.md (evidencia fresca)
4. **GATE deterministico** `approvals.log` (workflow governance.md, gate-only — sem hierarquia CEO/chief/supervisor)
5. up-revisor (two-stage) consolida review e alimenta o gate
6. **Menu de 4 opcoes** no fim da fase: 1) merge local  2) abrir PR  3) deixa a branch  4) descarta. Default sugerido = 1 (merge local). Em `--solo`, default = merge local sem cerimonia.

**Re-plan local permitido (max 1 round por fase):**
Se ficar inviavel, o up-planejador LOCAL refaz a fase. Registrar em `.plano/governance/replans.log`.

**A partir do inicio do build, ZERO interacao com usuario** (exceto alertas criticos e o menu de fim de fase).
</process>

<success_criteria>
- [ ] PLAN-READY.md validado
- [ ] Flags parseadas (default --solo)
- [ ] Build rodou todas as fases (executor -> verificador -> gate -> revisor)
- [ ] GATE approvals.log respeitado (deterministico, sem supervisor LLM)
- [ ] Menu de 4 opcoes oferecido no fim de cada fase
- [ ] --pr/--board/--auto documentados como stub (TODO Fase 4/5)
</success_criteria>
