---
phase: 09-comando-ideias
plan: 09-002
subsystem: workflow
tags: [ideias, workflow, orquestracao, ICE-scoring, anti-features]
dependency_graph:
  requires: [09-001]
  provides: [up/workflows/ideias.md]
  affects: [up/commands/ideias.md]
tech_stack:
  added: []
  patterns: [parallel-agent-spawn, sequential-consolidation, standalone-workflow, ICE-scoring]
key_files:
  created: [up/workflows/ideias.md]
  modified: []
decisions: []
metrics:
  duration: 126s
  completed: 2026-03-10
  tasks: 1
  files_created: 1
  files_modified: 0
---

# Fase 9 Plano 2: Workflow de orquestracao do /up:ideias Summary

Workflow completo de 7 passos que orquestra pipeline de ideacao: init standalone via up-tools.cjs, deteccao de stack, spawn paralelo de 2 agentes (analista-codigo + pesquisador-mercado), coleta e verificacao, spawn sequencial do consolidador com ICE scoring, e apresentacao do relatorio final com top features e anti-features.

## Tarefas Executadas

| Tarefa | Nome | Commit | Arquivos |
|--------|------|--------|----------|
| 1 | Criar workflow ideias.md | ef10da0 | up/workflows/ideias.md |

## Detalhes de Implementacao

### Tarefa 1: Workflow ideias.md

Criado workflow de orquestracao em `up/workflows/ideias.md` seguindo o padrao de `melhorias.md` mas adaptado para 2 agentes + consolidador com ICE scoring. O workflow contem:

- **Passo 1:** Init via `up-tools.cjs init ideias` com guard `@file:` para JSON grande
- **Passo 2:** Setup standalone que cria `.plano/ideias/` sem exigir `.plano/` previo (INFRA-04). Pergunta ao usuario via AskUserQuestion se ideacao anterior existe
- **Passo 3:** Reporta stack detectada ao usuario baseado em `stack_hints` do init JSON
- **Passo 4:** Spawn paralelo de 2 agentes (up-analista-codigo e up-pesquisador-mercado) na mesma mensagem via Task
- **Passo 5:** Coleta e verificacao dos resultados dos agentes com tabela de status
- **Passo 6:** Spawn sequencial do consolidador (up-consolidador-ideias) apos agentes completarem
- **Passo 7:** Apresentacao do relatorio final com sumario executivo, top 3 ICE, anti-features e caminhos dos arquivos

Diferencas chave vs melhorias.md:
- 2 agentes (nao 3)
- Consolidador com ICE scoring (nao sintetizador com quadrantes)
- Tabela de top features por ICE score (nao distribuicao por quadrantes)
- Anti-features no output final

## Desvios do Plano

Nenhum - plano executado exatamente como escrito.

## Self-Check: PASSOU

- [x] `up/workflows/ideias.md` existe
- [x] Commit ef10da0 existe
- [x] Workflow referencia init ideias via up-tools.cjs
- [x] Workflow cria .plano/ideias/ standalone (INFRA-04)
- [x] 2 agentes spawnados em paralelo (mesma mensagem)
- [x] Consolidador spawnado sequencialmente
- [x] 7 passos presentes
- [x] success_criteria presente
- [x] AskUserQuestion para sobrescrever ideacao anterior
- [x] Relatorio final com ICE scoring e anti-features
