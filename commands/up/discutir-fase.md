---
name: up:discutir-fase
description: Coletar contexto da fase por questionamento antes do planejamento
argument-hint: "<fase>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
<objective>
Collect phase context through structured questioning before planning begins.

**Default flow:** Load phase info -> Ask targeted questions -> Capture decisions -> Write CONTEXT.md

**Orchestrator role:** Read roadmap phase description, ask clarifying questions about scope/approach/constraints, capture all decisions and assumptions in CONTEXT.md for the planner to consume.
</objective>

<execution_context>
@~/.claude/up/workflows/discutir-fase.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS

Discussion surfaces assumptions, clarifies gray areas, and captures decisions before planning.
</context>

<process>
Execute the discutir-fase workflow from @~/.claude/up/workflows/discutir-fase.md end-to-end.
Preserve all workflow gates (phase validation, questioning, decision capture, CONTEXT.md creation).
</process>
