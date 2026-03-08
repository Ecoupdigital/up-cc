---
name: up:novo-projeto
description: Inicializar novo projeto com coleta de contexto e PROJECT.md
argument-hint: ""
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - mcp__context7__*
---
<objective>
Initialize a new project through structured context gathering and documentation.

**Default flow:** Questioning -> Research -> Requirements -> Roadmap -> PROJECT.md

**Orchestrator role:** Guide user through project discovery questions, research domain and technologies, synthesize requirements, generate phased roadmap, create PROJECT.md with all gathered context.
</objective>

<execution_context>
@~/.claude/up/workflows/novo-projeto.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

Project initialization collects context through interactive questioning before any planning or coding begins.
</context>

<process>
Execute the novo-projeto workflow from @~/.claude/up/workflows/novo-projeto.md end-to-end.
Preserve all workflow gates (questioning, research, requirements, roadmap generation, PROJECT.md creation).
</process>