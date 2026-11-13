---
name: up:plan
description: Use quando o usuario quer PLANEJAR antes de executar: gera .plano/PLAN-READY.md sem tocar em codigo, pronto pra /up:build rodar (mesmo runtime ou outro). Plano concreto (onde mexer e comando de prova por entrega). Detecta automaticamente projeto vs fase.
argument-hint: "[descricao | numero da fase] [--profundo] [--review] [--board] [--gaps] [--execution-runtime=runtime]"
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
Planejar o projeto OU uma fase e parar. A sessão lê o código e escreve um PLAN.md concreto por fase
(`Onde:` e comando de `Prova:` em cada entrega); `up-tools plan close` gera e commita o
`.plano/PLAN-READY.md` que o `/up:build` (ou `/up:auto`) consome, neste runtime ou em outro.
</objective>

<execution_context>
@~/.claude/up/workflows/plan.md
</execution_context>

<context>
$ARGUMENTS

Flags (só com elas o workflow lê `~/.claude/up/workflows/plan-profundo.md`):
- `--profundo`: `up-planejador` planeja todas as fases (ou a pedida) com pesquisa e loop de `validate-plan`.
- `--review`: `up-revisor` revisa o planejamento antes do `plan close`.
- `--board`: espelha as fases no Multica (opt-in, fail-open).
- `--gaps`: plano de fechamento de gaps a partir do VERIFICATION.md.
- `--execution-runtime=<same|claude-code|opencode|gemini-cli|any>`: marcado no PLAN-READY.
</context>

<process>
Execute o workflow de `@~/.claude/up/workflows/plan.md` de ponta a ponta. Não execute código.
</process>
