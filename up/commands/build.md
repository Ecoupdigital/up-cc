---
name: up:build
description: Executar projeto previamente planejado por /up:plan. Requer PLAN-READY.md. Pode rodar em runtime diferente do que planejou.
argument-hint: ""
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
Executar projeto que foi previamente planejado.

Requer `.plano/PLAN-READY.md` no diretorio atual.

Conduz:
1. Validacao light do plano (artefatos existem, planos OK)
2. CEO local confirma execucao
3. Build de todas as fases (com supervisao completa)
4. Quality Gate global
5. Delivery Audit
6. CEO apresenta resultado

**Caso de uso principal:** executar projeto planejado em outro runtime.
Exemplo: planejou em Claude Code (`/up:plan "X"`), agora roda em OpenCode (`/up-build`).

**Re-plan local permitido (max 2):** se durante execucao o supervisor descobrir
que o plano esta inviavel, o planejador LOCAL refaz a fase. Nao volta pro runtime
que planejou originalmente.

Diferenca de /up:modo-builder:
- modo-builder: planeja + executa em sequencia
- build: SO executa, le PLAN-READY.md

Diferenca de /up:executar-fase:
- executar-fase: executa UMA fase
- build: executa o PROJETO INTEIRO ate delivery
</objective>

<execution_context>
@~/.claude/up/workflows/build.md
@~/.claude/up/workflows/governance.md
@~/.claude/up/workflows/dcrv.md
@~/.claude/up/workflows/builder-e2e.md
</execution_context>

<context>
$ARGUMENTS

Sem argumentos. O comando le tudo de `.plano/PLAN-READY.md`.
</context>

<process>
**GATE 1 — Owner Profile LOCAL:**
Verificar se `~/.claude/up/owner-profile.md` existe NESTE runtime.
Se nao: rodar `/up:onboard` primeiro.

**GATE 2 — PLAN-READY.md:**
```bash
if [ ! -f .plano/PLAN-READY.md ]; then
  echo "ERRO: Este projeto nao foi planejado."
  echo "Use /up:plan primeiro pra planejar."
  echo "Ou /up:modo-builder pra planejar e executar de uma vez."
  exit 1
fi
```

**GATE 3 — Validacao Light:**
Spot-check estrutura:
- Artefatos arquiteturais existem (PROJECT, ROADMAP, REQUIREMENTS, SYSTEM-DESIGN)?
- Todos planos listados em PLAN-READY.md existem no disco?
- Frontmatter dos planos e valido?

**Confiar no PLAN-READY.md.** NAO re-rodar planning-supervisor em tudo.

Se algo falta: alertar e oferecer planejamento local OU abortar.

**Sem model routing:** O runtime decide o modelo.

**Execute the build workflow from @~/.claude/up/workflows/build.md end-to-end.**

Estagios:
1. Validacao light + CEO confirma
2. Build (loop por fase com supervisao + DCRV + E2E + chief-engineer)
3. Quality Gate global
4. Delivery Audit
5. Delivery (CEO apresenta)

**Re-plan local permitido (max 2 por projeto):**
Se execution-supervisor pedir REQUEST_REPLAN, o planejador LOCAL refaz a fase.
Registrar em `.plano/governance/replans.log`.

**A partir do CEO confirmar, ZERO interacao com usuario** (exceto alertas criticos).
</process>
