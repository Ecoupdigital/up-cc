---
phase: 10-integracao-roadmap
plan: 10-002
subsystem: workflows, commands
tags: [interactive-approval, roadmap-integration, multiSelect, melhorias, ideias]
dependency_graph:
  requires: [10-001]
  provides: [interactive-approval-step, roadmap-generation-from-reports]
  affects: [up/workflows/melhorias.md, up/workflows/ideias.md, up/commands/melhorias.md, up/commands/ideias.md]
tech_stack:
  added: []
  patterns: [AskUserQuestion-multiSelect, CLI-phase-generate-from-report]
key_files:
  created: []
  modified:
    - up/workflows/melhorias.md
    - up/workflows/ideias.md
    - up/commands/melhorias.md
    - up/commands/ideias.md
    - commands/up/melhorias.md
    - commands/up/ideias.md
decisions: []
metrics:
  duration: 137s
  completed: 2026-03-10T16:42:01Z
  tasks: 3
  files_modified: 6
---

# Fase 10 Plano 002: Apresentacao interativa e integracao nos workflows Summary

Passo 8 de aprovacao interativa adicionado aos workflows melhorias e ideias, permitindo selecao de sugestoes via multiSelect para conversao em fases executaveis no ROADMAP.md via CLI generate-from-report.

## Tarefas Executadas

| Tarefa | Descricao | Commit | Arquivos |
|--------|-----------|--------|----------|
| 1 | Passo 8 no workflow melhorias.md | c9c710c | up/workflows/melhorias.md |
| 2 | Passo 8 no workflow ideias.md | 9ad9f46 | up/workflows/ideias.md |
| 3 | Atualizar commands e sincronizar copias | 5e819c6 | up/commands/{melhorias,ideias}.md, commands/up/{melhorias,ideias}.md |

## O Que Foi Implementado

### Workflow melhorias.md - Passo 8
- Pergunta ao usuario se quer integrar sugestoes ao roadmap (sim/nao)
- Extrai sugestoes do RELATORIO.md via regex `### (MELH-\d+): (.+)`
- Apresenta multiSelect agrupado por quadrante (Quick Wins primeiro)
- Exclui sugestoes do quadrante "Evitar" da lista
- Verifica/cria ROADMAP.md se nao existe
- Chama `phase generate-from-report` com IDs aprovados
- Apresenta resumo das fases geradas com proximos passos

### Workflow ideias.md - Passo 8
- Mesma estrutura do melhorias, adaptado para ideias:
  - IDs `IDEA-NNN` em vez de `MELH-NNN`
  - Source `ideias` e report path `.plano/ideias/RELATORIO.md`
  - Ordenacao por ICE score decrescente (maior retorno primeiro)
  - Exclui Anti-Features da lista de selecao
  - Labels com ICE score: "ICE: 648 | must-have | I:9 C:9 E:8"

### Commands atualizados
- melhorias.md: objective e context atualizados com mencao a roadmap
- ideias.md: objective e context atualizados com mencao a roadmap
- Copias na raiz (commands/up/) sincronizadas com fontes canonicas (up/commands/)

## Desvios do Plano

Nenhum - plano executado exatamente como escrito.

## Self-Check: PASSOU
