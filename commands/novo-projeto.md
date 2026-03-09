---
name: up:novo-projeto
description: Inicializar projeto (detecta greenfield/brownfield automaticamente)
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
Inicializar projeto com coleta de contexto estruturada. Detecta automaticamente se e greenfield (sem codigo) ou brownfield (codigo existente) e adapta questionamento, pesquisa e requisitos.

**Greenfield:** Questioning → Research → Requirements → Roadmap → PROJECT.md
**Brownfield:** Codebase map → Questioning adaptado → Requisitos inferidos + novos → Roadmap → PROJECT.md

**Orchestrator role:** Detectar modo, carregar mapeamento do codebase (se brownfield), guiar questionamento adaptado, sintetizar requisitos, gerar roadmap com contexto completo.
</objective>

<execution_context>
@~/.claude/up/workflows/novo-projeto.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

Inicializacao coleta contexto por questionamento interativo. Se codigo existente for detectado, adapta o fluxo para brownfield: carrega mapeamento do codebase, infere requisitos validados, e pergunta sobre novos objetivos.
</context>

<process>
Execute the novo-projeto workflow from @~/.claude/up/workflows/novo-projeto.md end-to-end.
Preserve all workflow gates (mode detection, codebase loading, questioning, research, requirements, roadmap generation, PROJECT.md creation).
</process>
