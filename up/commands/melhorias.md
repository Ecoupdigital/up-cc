---
name: up:melhorias
description: Auditoria completa do codebase com sugestoes priorizadas (UX, performance, modernidade)
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
---
<objective>
Run a full codebase audit with 3 parallel specialized agents (UX, Performance, Modernidade), synthesize findings into a single prioritized report.

Standalone: works without /up:novo-projeto. Creates .plano/melhorias/ automatically if not exists.
Detects project stack (React/Vue/Next/Tailwind/etc.) and adjusts analysis heuristics.

Output: .plano/melhorias/RELATORIO.md with suggestions organized in effort x impact matrix (4 quadrants).
</objective>

<execution_context>
@~/.claude/up/workflows/melhorias.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

**Standalone mode:** This command does NOT require /up:novo-projeto or .plano/ to exist.
It creates .plano/melhorias/ automatically and runs the full audit pipeline.

**If .plano/melhorias/ already exists:** Asks user if they want to overwrite previous audit or cancel.
</context>

<process>
Execute the melhorias workflow from @~/.claude/up/workflows/melhorias.md end-to-end.
Preserve all workflow gates (init, stack detection, agent spawn, synthesis, report presentation).
</process>
