---
name: up:iniciar
description: Registrar projeto existente no UP (leve, sem questionario)
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
Registrar projeto no UP de forma leve. Detecta o que existe, cria PROJECT.md automaticamente sem questionario, e para. Ideal para quem quer adotar UP num projeto existente sem definir roadmap/requisitos de cara.

Diferente de /up:novo-projeto que faz questionamento profundo + requisitos + roadmap, este comando apenas documenta o estado atual e configura o minimo necessario.
</objective>

<execution_context>
@~/.claude/up/workflows/iniciar.md
</execution_context>

<context>
$ARGUMENTS

Modo leve: registra projeto, documenta o que existe, e para. O usuario vai planejando fases incrementalmente depois.
</context>

<process>
Execute the iniciar workflow from @~/.claude/up/workflows/iniciar.md end-to-end.
</process>
