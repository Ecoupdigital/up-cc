---
name: up:executar-fase
description: Executar todos os planos de uma fase com paralelizacao por ondas
argument-hint: "<fase> [--gaps-only]"
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
Execute all plans in a phase using wave-based parallel execution.

Orchestrator stays lean: discover plans, analyze dependencies, group into waves, spawn subagents, collect results. Each subagent loads the full execute-plan context and handles its own plan.

Context budget: ~15% orchestrator, 100% fresh per subagent.
</objective>

<execution_context>
@~/.claude/up/workflows/executar-fase.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS

**Flags:**
- `--gaps-only` -- Execute only gap closure plans (plans with `gap_closure: true` in frontmatter). Use after verificar-trabalho creates fix plans.

Context files are resolved inside the workflow and per-subagent `<files_to_read>` blocks.
</context>

<process>
Execute the executar-fase workflow from @~/.claude/up/workflows/executar-fase.md end-to-end.
Preserve all workflow gates (wave execution, checkpoint handling, verification, state updates, routing).
</process>
