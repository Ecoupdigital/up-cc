---
name: up:ideias
description: Sugestoes de features novas com pesquisa de mercado e analise de codigo
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - WebSearch
  - WebFetch
  - AskUserQuestion
---
<objective>
Run feature ideation with 2 parallel specialized agents (code analysis + market research), consolidate findings with ICE scoring into a prioritized report with anti-features.

Standalone: works without /up:novo-projeto. Creates .plano/ideias/ automatically if not exists.
Detects project stack and domain to contextualize analysis.

Output: .plano/ideias/RELATORIO.md with suggestions ranked by ICE score (Impact x Confidence x Ease) and mandatory anti-features section.

Optionally, after reviewing results, user can select ideas to convert into executable phases in ROADMAP.md.
</objective>

<execution_context>
@~/.claude/up/workflows/ideias.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

**Standalone mode:** This command does NOT require /up:novo-projeto or .plano/ to exist.
It creates .plano/ideias/ automatically and runs the full ideation pipeline.

**If .plano/ideias/ already exists:** Asks user if they want to overwrite previous ideation or cancel.

**Pipeline:** 2 agents in parallel (analista-codigo + pesquisador-mercado) -> consolidador-ideias -> report

**Integration with roadmap:** After ideation completes, the user can optionally select ideas to convert into ROADMAP.md phases. Requires the `phase generate-from-report` CLI subcommand.
</context>

<process>
Execute the ideias workflow from @~/.claude/up/workflows/ideias.md end-to-end.
Preserve all workflow gates (init, stack detection, agent spawn, consolidation, report presentation).
</process>
