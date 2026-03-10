---
phase: 07-comando-melhorias
plan: 07-002
subsystem: workflow-melhorias
tags: [workflow, orchestration, audit-pipeline, standalone]
dependency_graph:
  requires: [07-001]
  provides: [melhorias-workflow]
  affects: [up/commands/melhorias.md]
tech_stack:
  added: []
  patterns: [parallel-agent-spawn, standalone-workflow, sequential-synthesis]
key_files:
  created:
    - up/workflows/melhorias.md
  modified: []
decisions: []
metrics:
  duration: 113s
  completed: 2026-03-10
  tasks: 1
  files_created: 1
  files_modified: 0
---

# Fase 7 Plano 2: Workflow de orquestracao do /up:melhorias Summary

Pipeline de auditoria com 7 passos: init standalone, deteccao de stack, spawn paralelo de 3 auditores (UX, performance, modernidade), coleta de resultados, sintese via sintetizador, apresentacao de relatorio consolidado com quadrantes esforco x impacto.

## Tarefas Executadas

| # | Tarefa | Commit | Arquivos |
|---|--------|--------|----------|
| 1 | Criar workflow completo de orquestracao | 31ec6c4 | up/workflows/melhorias.md |

## O que foi Construido

O workflow `up/workflows/melhorias.md` orquestra o pipeline completo do comando `/up:melhorias`:

**Passo 1 - Init:** Carrega contexto via `up-tools.cjs init melhorias`, exibe banner.

**Passo 2 - Setup standalone (INFRA-04):** Cria `.plano/melhorias/` automaticamente via `mkdir -p`. Se auditoria anterior existe, pergunta ao usuario antes de sobrescrever via `AskUserQuestion`. Funciona sem `/up:novo-projeto`.

**Passo 3 - Stack detection:** Reporta ao usuario a stack detectada via `stack_hints` do init JSON (React, Next, Vue, Nuxt, Svelte, Tailwind, Prisma, TypeScript). Deteccao granular fica nos agentes.

**Passo 4 - Spawn paralelo:** 3 Task spawnados na MESMA mensagem para execucao paralela:
- `up-auditor-ux` -> `.plano/melhorias/ux-sugestoes.md`
- `up-auditor-performance` -> `.plano/melhorias/performance-sugestoes.md`
- `up-auditor-modernidade` -> `.plano/melhorias/modernidade-sugestoes.md`

**Passo 5 - Coleta:** Verifica existencia dos 3 arquivos de sugestoes, reporta tabela com contagem e cobertura. Tolera falha parcial (continua com auditores disponiveis).

**Passo 6 - Sintese:** Spawn sequencial do `up-sintetizador-melhorias` que deduplica, detecta conflitos, classifica em 4 quadrantes e produz `.plano/melhorias/RELATORIO.md`.

**Passo 7 - Apresentacao:** Exibe sumario executivo, tabela de visao geral, distribuicao por quadrante e proximos passos. NAO commita automaticamente (informativo, usuario decide).

## Criterios de Sucesso

- [x] up/workflows/melhorias.md existe e contem orquestracao completa (7 passos)
- [x] Workflow faz init via `up-tools.cjs init melhorias` (depende de plano 001)
- [x] Workflow cria .plano/melhorias/ automaticamente (INFRA-04 standalone)
- [x] 3 auditores spawnados em paralelo (mesma mensagem com 3 Task)
- [x] Sintetizador spawnado apos auditores (sequencial)
- [x] Workflow apresenta relatorio final com sumario e quadrantes ao usuario
- [x] Se auditoria anterior existe, pergunta ao usuario antes de sobrescrever

## Desvios do Plano

Nenhum - plano executado exatamente como escrito.

## Self-Check: PASSOU

- [x] ENCONTRADO: up/workflows/melhorias.md
- [x] ENCONTRADO: commit 31ec6c4
