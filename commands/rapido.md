---
name: up:rapido
description: Tarefa rapida com garantias UP (commits atomicos, rastreamento)
argument-hint: "[descricao]"
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
Execute small, ad-hoc tasks with UP guarantees (atomic commits, STATE.md tracking).

Quick mode is the same system with a shorter path:
- Plans and executes in a streamlined flow
- Quick tasks live in `.plano/rapido/` separate from planned phases
- Updates STATE.md "Tarefas Rapidas" table (NOT ROADMAP.md)

**Default:** Skips research, discussion, plan-checker, verifier. Use when you know exactly what to do.
</objective>

<execution_context>
@~/.claude/up/workflows/rapido.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

Quick tasks get UP guarantees without full phase ceremony.
</context>

<process>
Execute the rapido workflow from @~/.claude/up/workflows/rapido.md end-to-end.
Preserve all workflow gates (validation, task description, planning, execution, state updates, commits).
</process>