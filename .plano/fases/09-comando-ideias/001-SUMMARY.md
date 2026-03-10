---
phase: 09-comando-ideias
plan: 09-001
subsystem: cli-commands
tags: [infrastructure, command, cli-init, standalone]
dependency_graph:
  requires: []
  provides: [init-ideias-cli, ideias-command-file, ajuda-ideias-entry]
  affects: [up-tools.cjs, ajuda.md]
tech_stack:
  added: []
  patterns: [cmdInit-standalone, command-file-yaml-frontmatter]
key_files:
  created:
    - up/commands/ideias.md
    - commands/up/ideias.md
  modified:
    - up/bin/up-tools.cjs
    - up/commands/ajuda.md
decisions: []
metrics:
  duration: 143s
  completed: 2026-03-10T16:10:19Z
  tasks: 3
  files_changed: 4
---

# Fase 9 Plano 1: Infraestrutura do comando /up:ideias Summary

Subcomando `init ideias` no CLI tools e command file `/up:ideias` com frontmatter YAML, referencia ao workflow `ideias.md` e entrada na ajuda -- espelhando padrao exato de `/up:melhorias`.

## Tarefas Executadas

| # | Tarefa | Commit | Arquivos |
|---|--------|--------|----------|
| 1 | Adicionar subcomando `init ideias` no CLI tools | 59dccfe | up/bin/up-tools.cjs |
| 2 | Criar command files para /up:ideias | 16356c7 | up/commands/ideias.md, commands/up/ideias.md |
| 3 | Adicionar /up:ideias na ajuda | 99d5ef2 | up/commands/ajuda.md |

## Detalhes de Implementacao

### Task 1: init ideias CLI subcommand
- Criada funcao `cmdInitIdeias(cwd, raw)` identica a `cmdInitMelhorias` com campos renomeados (`ideias_dir`, `ideias_exists`)
- Adicionado case `'ideias'` no switch init de `main()`
- Atualizada mensagem de erro do default para incluir `ideias` na lista de workflows disponiveis
- Atualizado comentario de usage no header do arquivo

### Task 2: Command files
- Criado `up/commands/ideias.md` com frontmatter YAML incluindo WebSearch e WebFetch em allowed-tools (necessarios para agente pesquisador-mercado)
- Criado `commands/up/ideias.md` como copia identica (byte-a-byte verificada via diff)
- Referencia ao workflow `@~/.claude/up/workflows/ideias.md` no execution_context

### Task 3: Ajuda
- Adicionada entrada `/up:ideias` na tabela da secao Auditoria
- Adicionada subsecao "Ideacao de Features" nos fluxos de trabalho comuns

## Desvios do Plano

Nenhum -- plano executado exatamente como escrito.

## Criterios de Sucesso

- [x] `up-tools.cjs init ideias` retorna JSON valido com stack_hints, planning_exists, ideias_dir, ideias_exists
- [x] `up-tools.cjs init ideias` funciona sem .plano/ existir (standalone)
- [x] up/commands/ideias.md existe com frontmatter correto e referencia ao workflow ideias.md
- [x] commands/up/ideias.md e copia identica da fonte canonica
- [x] /up:ajuda lista o novo comando /up:ideias na secao Auditoria e nos fluxos comuns

## Self-Check: PASSOU

Todos os 4 arquivos (2 criados, 2 modificados) e 3 commits verificados como existentes.
