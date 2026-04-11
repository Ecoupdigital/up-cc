---
name: up:plan
description: Planejamento completo de projeto. Gera PLAN-READY.md pronto pra ser executado por /up:build (mesmo runtime ou outro)
argument-hint: "[descricao do projeto] [--execution-runtime=runtime] [--no-audit]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - mcp__context7__*
---
<objective>
Planejar projeto completo. NAO executa nada, so planeja.

Conduz:
1. Intake (CEO entrevista o dono)
2. Arquitetura completa (Product Analyst → System Designer → Arquiteto)
3. Planejamento exaustivo de TODAS as fases (Sonnet-ready)
4. Planning Audit (calcula confidence score)
5. Gera PLAN-READY.md (arquivo-flag pra /up:build)

Resultado: projeto pronto pra execucao em qualquer runtime via `/up:build`.

**Caso de uso principal:** planejar em Claude Code (modelo capaz pra arquitetura)
e executar em OpenCode/Gemini (mais barato pra rodar volume).

Diferenca de /up:modo-builder:
- modo-builder: planeja + executa em sequencia, mesmo runtime
- plan: SO planeja, para apos PLAN-READY.md

Diferenca de /up:planejar-fase:
- planejar-fase: planeja UMA fase (em projeto ja inicializado)
- plan: planeja TODO o projeto do zero (incluindo intake e arquitetura)
</objective>

<execution_context>
@~/.claude/up/workflows/plan.md
@~/.claude/up/workflows/onboarding.md
@~/.claude/up/workflows/ceo-intake.md
@~/.claude/up/templates/plan-ready.md
@~/.claude/up/templates/audit-plan.md
</execution_context>

<context>
$ARGUMENTS

**Flags:**
- `--execution-runtime=<runtime>` — Informa qual runtime sera usado pra executar.
  Valores: same | claude-code | opencode | gemini-cli | any
  Default: same
- `--no-audit` — Pula Planning Audit (nao recomendado em producao)

O restante e o briefing em texto livre.

Se briefing vazio: CEO pergunta interativamente.

**Deteccao automatica de modo:**
- Codigo existente → BROWNFIELD
- Sem codigo → GREENFIELD
</context>

<process>
**GATE OBRIGATORIO — Owner Profile:**
Antes de qualquer coisa, verificar se `~/.claude/up/owner-profile.md` existe.
Se NAO existir: rodar `/up:onboard` primeiro (workflow onboarding.md).
Sem profile, o CEO nao pode conduzir intake.

**Sem model routing:** O runtime decide o modelo. NAO especificar `model=` em nenhum spawn.

**Sonnet-ready obrigatorio:** Todos planos devem ser gerados em nivel maximo de detalhe.

**Execute the plan workflow from @~/.claude/up/workflows/plan.md end-to-end.**

Estagios:
1. Intake (CEO entrevista o dono) — interativo
2. Arquitetura (greenfield: pesquisa + product/system/architect | brownfield: mapear + product/system/architect)
3. Planejamento exaustivo (TODAS as fases, planning-supervisor revisa cada uma)
4. Planning Audit (planning-auditor calcula confidence score)
5. PLAN-READY.md gerado
6. CEO apresenta resumo

**A partir do estagio 2, ZERO interacao com usuario.** Toda decisao e tomada autonomamente pelo CEO/chiefs/supervisores.

**NAO executar nada.** Para apos gerar PLAN-READY.md.
</process>
