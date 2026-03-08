---
name: up:progresso
description: Status do projeto e roteamento para proxima acao
argument-hint: ""
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---
<objective>
Display current project status and route to the next recommended action.

**Default flow:** Read STATE.md -> Analyze progress -> Show status dashboard -> Recommend next action

**Orchestrator role:** Read project state, calculate completion percentages, identify current phase and blockers, present formatted status, suggest next UP command to run.
</objective>

<execution_context>
@~/.claude/up/workflows/progresso.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

Reads project state to provide a clear picture of where things stand and what to do next.
</context>

<process>
Execute the progresso workflow from @~/.claude/up/workflows/progresso.md end-to-end.
Preserve all workflow gates (state reading, progress calculation, status display, action routing).
</process>