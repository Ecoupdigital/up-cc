---
name: up:build
description: Use quando o usuario quer EXECUTAR um projeto ja planejado (existe .plano/PLAN-READY.md). Default GitHub-nativo por fase (worktree, issue, PR, merge) via gh OU MCP. Cerimonia em up-tools build open/close; o modelo so executa os planos, e build_model no config deixa rodar num modelo menor. Flag --review devolve verificador+revisor; --testar roda DCRV; --solo = autonomo total mantendo GitHub; --auto pula so o menu; --local pula o GitHub; --board espelha no Multica.
argument-hint: "[--solo] [--auto] [--local] [--board] [--review] [--testar]"
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
Executar o que `/up:plan` deixou pronto em `.plano/PLAN-READY.md`, fase por fase: `build open`, ondas,
teste visual se houver UI, `build close` (prova estatica trava o merge).
</objective>

<execution_context>
@$HOME/.claude/up/workflows/build.md
</execution_context>

<context>
$ARGUMENTS

**Flags** (GitHub e interacao humana sao eixos separados):
- (sem flag): GitHub-nativo por fase (worktree, branch `up/fase-NN-slug`, issue, PR), teste visual em fase de UI e menu no fim.
- `--solo`: autonomo total. Mantem GitHub e auto-mergeia, sem menu e sem teste visual.
- `--auto`: pula so o menu (merge automatico). O teste visual ainda roda se `require_visual_test=true`.
- `--local`: escape hatch sem GitHub. Commit na branch atual.
- `--board`: espelha no Multica (fail-open).
- `--review`: opt-in, `up-verificador` + `up-revisor` depois das ondas.
- `--testar`: opt-in, laco DCRV depois das ondas.

**Modelo:** `build_model` em `.plano/config.json` (`inherit` default, ou `sonnet`/`haiku`/`opus`). Diferente
do modelo da sessao: o executor roda nesse modelo e a sessao so abre, confere e fecha.
</context>

<process>
Siga @$HOME/.claude/up/workflows/build.md do inicio ao fim.
</process>
