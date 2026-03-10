---
phase: 07-comando-melhorias
plan: 07-001
subsystem: cli-commands
tags: [command, cli, melhorias, standalone, infrastructure]
dependency_graph:
  requires: []
  provides: [init-melhorias-cli, melhorias-command-file, ajuda-melhorias-entry]
  affects: [up-tools.cjs, ajuda.md]
tech_stack:
  added: []
  patterns: [standalone-command, stack-detection]
key_files:
  created:
    - up/commands/melhorias.md
    - commands/up/melhorias.md
  modified:
    - up/bin/up-tools.cjs
    - up/commands/ajuda.md
decisions: []
metrics:
  duration: 128s
  completed: 2026-03-10
  tasks: 3
  files_changed: 4
---

# Fase 7 Plano 1: Infraestrutura do comando /up:melhorias Summary

Subcomando CLI `init melhorias` com deteccao de stack e suporte standalone, command file /up:melhorias referenciando workflow, e entrada na referencia de ajuda.

## Tarefas Executadas

| Tarefa | Descricao | Commit | Arquivos |
|--------|-----------|--------|----------|
| 1 | Adicionar init melhorias ao CLI tools | d6e4c7e | up/bin/up-tools.cjs |
| 2 | Criar command file /up:melhorias + copia raiz | a8e6067 | up/commands/melhorias.md, commands/up/melhorias.md |
| 3 | Adicionar /up:melhorias a referencia de ajuda | 51c6e87 | up/commands/ajuda.md |

## Detalhes de Implementacao

### Tarefa 1: CLI init melhorias
- Funcao `cmdInitMelhorias` adicionada a up-tools.cjs
- Retorna JSON com: planning_exists, melhorias_dir, melhorias_exists, has_claude_md, has_package_json, date, timestamp, commit_docs, stack_hints
- stack_hints detecta: React, Next, Vue, Nuxt, Svelte, Tailwind, Prisma, TypeScript, type:module
- Funciona sem .plano/ existir (standalone, requisito INFRA-04)
- Try/catch silencioso para package.json ausente

### Tarefa 2: Command file
- Frontmatter com name, description, argument-hint, allowed-tools (incluindo Task e AskUserQuestion)
- Corpo XML com objective, execution_context (referencia workflow melhorias.md), context, process
- Copia raiz em commands/up/melhorias.md identica byte-a-byte

### Tarefa 3: Referencia de ajuda
- Secao "Auditoria" adicionada antes de "Utilitarios" na tabela de comandos
- Fluxo "Auditoria de Codebase" adicionado antes de "Correcao Rapida" nos fluxos comuns

## Desvios do Plano

Nenhum -- plano executado exatamente como escrito.

## Verificacao de Criterios de Sucesso

- [x] `up-tools.cjs init melhorias` retorna JSON valido com stack_hints, planning_exists, melhorias_dir
- [x] `up-tools.cjs init melhorias` funciona sem .plano/ existir (standalone)
- [x] up/commands/melhorias.md existe com frontmatter correto e referencia ao workflow
- [x] commands/up/melhorias.md e copia identica da fonte canonica
- [x] /up:ajuda lista o novo comando /up:melhorias

## Self-Check: PASSOU

Verificacoes realizadas:
- [x] up/commands/melhorias.md existe
- [x] commands/up/melhorias.md existe
- [x] Commits d6e4c7e, a8e6067, 51c6e87 existem no log
- [x] init melhorias retorna JSON valido
- [x] Modo standalone funciona sem .plano/
