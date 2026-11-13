---
name: up:auto
description: Use quando o usuario quer tudo no automatico, de ponta a ponta: ideia -> brainstorm curto -> plan -> build --solo (GitHub-nativo, auto-merge) fase a fase, parando so em verify-static falhando, decisao que muda escopo ou credencial. /up:plan e /up:build continuam separados para quem quer conduzir.
argument-hint: "[\"ideia\" | numero da fase] [--uma] [--local] [--board]"
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
Plan e build numa porta só. Brainstorm no tier mínimo (pergunta só o que bloqueia), depois o
`/up:plan` da próxima fase e o `/up:build --solo` dela, repetindo até acabar as fases pendentes
(ou só uma com `--uma`). Para em `verify-static` falhando, decisão escalada que muda escopo ou
credencial que só o dono resolve.
</objective>

<execution_context>
@~/.claude/up/workflows/auto.md
</execution_context>

<context>
$ARGUMENTS

- `"ideia"`: brainstorm mínimo e roteamento (projeto novo ou fase nova no projeto atual).
- número: começa por essa fase. Vazio: retoma (PLAN-READY pendente vai direto ao build).
- `--uma`: para depois de uma fase.
- `--local`: sem GitHub (commit na branch atual), repassado ao build.
- `--board`: espelha no Multica, repassado ao plan e ao build.
</context>

<process>
Execute o workflow de `@~/.claude/up/workflows/auto.md` de ponta a ponta.
</process>
