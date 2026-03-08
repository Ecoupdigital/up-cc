---
name: up:adicionar-fase
description: Adicionar fase ao final do roadmap
argument-hint: "<descricao>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---
<objective>
Add a new phase to the end of the project roadmap.

**Flow:** Parse description -> Call `up-tools.cjs phase add` -> Update STATE.md -> Present result
</objective>

<execution_context>
@~/.claude/up/workflows/adicionar-fase.md
</execution_context>

<context>
Phase description: $ARGUMENTS

Adds a new phase to ROADMAP.md at the end of the existing phase list.
</context>

<process>
1. Parse the phase description from arguments.
2. Call `up-tools.cjs phase add` with the description.
3. Update STATE.md to reflect the new phase.
4. Present the result showing the new roadmap state.
</process>
