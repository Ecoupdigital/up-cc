---
name: up:remover-fase
description: Remover fase futura e renumerar subsequentes
argument-hint: "<numero>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - AskUserQuestion
---
<objective>
Remove a future phase from the roadmap and renumber all subsequent phases.

**Flow:** Validate future phase -> Confirm with user -> Call `up-tools.cjs phase remove` -> Present result
</objective>

<execution_context>
@~/.claude/up/workflows/remover-fase.md
</execution_context>

<context>
Phase number: $ARGUMENTS

Only future (not started) phases can be removed. Active or completed phases are protected.
</context>

<process>
1. Validate that the specified phase number exists and is a future phase (not active or completed).
2. Confirm removal with the user via AskUserQuestion.
3. Call `up-tools.cjs phase remove` with the phase number.
4. Present the updated roadmap showing renumbered phases.
</process>