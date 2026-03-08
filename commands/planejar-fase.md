---
name: up:planejar-fase
description: Planejar fase com research inline e self-check
argument-hint: "[fase] [--pesquisar] [--sem-pesquisa] [--auto] [--gaps]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - mcp__context7__*
---
<objective>
Create executable phase plans (PLAN.md files) for a roadmap phase with integrated research and self-check verification.

**Default flow:** Research (if needed) -> Plan -> Verify -> Done

**Orchestrator role:** Parse arguments, validate phase, research domain (unless skipped), generate plans, verify with self-check, iterate until pass or max iterations, present results.
</objective>

<execution_context>
@~/.claude/up/workflows/planejar-fase.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
Phase number: $ARGUMENTS (optional -- auto-detects next unplanned phase if omitted)

**Flags:**
- `--pesquisar` -- Force re-research even if RESEARCH.md exists
- `--sem-pesquisa` -- Skip research, go straight to planning
- `--auto` -- Auto-detect and plan next unplanned phase
- `--gaps` -- Gap closure mode (reads VERIFICATION.md, skips research)

Normalize phase input before any directory lookups.
</context>

<process>
Execute the planejar-fase workflow from @~/.claude/up/workflows/planejar-fase.md end-to-end.
Preserve all workflow gates (validation, research, planning, verification loop, routing).
</process>
