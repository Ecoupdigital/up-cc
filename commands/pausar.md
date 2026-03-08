---
name: up:pausar
description: Criar handoff .continue-aqui.md ao pausar trabalho
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - AskUserQuestion
---
<objective>
Create a handoff document when pausing work so the next session can resume seamlessly.

**Default flow:** Capture current state -> Document in-progress work -> Write .continue-aqui.md -> Confirm

**Orchestrator role:** Gather current task state, uncommitted changes, pending decisions, and next steps into a structured .continue-aqui.md handoff file.
</objective>

<execution_context>
@~/.claude/up/workflows/pausar.md
</execution_context>

<context>
$ARGUMENTS

Creates .continue-aqui.md in the project root with all context needed to resume work.
</context>

<process>
Execute the pausar workflow from @~/.claude/up/workflows/pausar.md end-to-end.
Preserve all workflow gates (state capture, change detection, handoff creation, confirmation).
</process>