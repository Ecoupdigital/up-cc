---
name: up:retomar
description: Restaurar contexto da sessao anterior
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
<objective>
Restore context from the previous session and resume work where it left off.

**Default flow:** Find .continue-aqui.md -> Load context -> Validate state -> Present summary -> Resume

**Orchestrator role:** Locate and read .continue-aqui.md handoff file, validate that project state matches expectations, present summary of where things stand, and route to the appropriate next action.
</objective>

<execution_context>
@~/.claude/up/workflows/retomar.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

Reads .continue-aqui.md from the project root to restore previous session context.
</context>

<process>
Execute the retomar workflow from @~/.claude/up/workflows/retomar.md end-to-end.
Preserve all workflow gates (handoff detection, context loading, state validation, summary, routing).
</process>