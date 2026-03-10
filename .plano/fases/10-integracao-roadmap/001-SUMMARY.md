---
phase: 10-integracao-roadmap
plan: 10-001
subsystem: up-tools CLI
tags: [cli, roadmap, regex, i18n, phase-generation]
dependency_graph:
  requires: [up-tools.cjs, core.cjs, ROADMAP.md format]
  provides: [phase generate-from-report subcommand, bilingual Phase/Fase regex]
  affects: [all ROADMAP parsing commands, cmdPhaseAdd, cmdPhaseRemove, cmdPhaseComplete]
tech_stack:
  added: []
  patterns: [bilingual regex (?:Phase|Fase), language auto-detection via ROADMAP content]
key_files:
  created: []
  modified: [up/bin/up-tools.cjs, up/bin/lib/core.cjs]
decisions:
  - Language detection uses simple regex test for '### Fase ' in ROADMAP content
  - Suggestion grouping merges single-P-effort groups into adjacent same-dimension groups
  - Criteria generation switches to summary mode when >5 suggestions per phase
metrics:
  duration: 5m
  completed: 2026-03-10
  tasks: 2
  files: 2
---

# Fase 10 Plano 001: CLI para geracao de fases a partir de sugestoes aprovadas Summary

Suporte bilingue Phase/Fase em todas as regex de parsing do ROADMAP, com novo subcomando `phase generate-from-report` que agrupa sugestoes aprovadas em fases executaveis.

## Tarefas Completadas

| Tarefa | Nome | Commit | Arquivos |
|--------|------|--------|----------|
| 1 | Corrigir regex Phase/Fase em core.cjs e up-tools.cjs | d8cf25d | up/bin/lib/core.cjs, up/bin/up-tools.cjs |
| 2 | Implementar subcomando phase generate-from-report | 354c8fe | up/bin/up-tools.cjs |

## Detalhes da Implementacao

### Tarefa 1: Regex bilingue Phase/Fase

Todas as regex de parsing de ROADMAP em `core.cjs` (2 ocorrencias) e `up-tools.cjs` (17 ocorrencias) foram atualizadas para usar `(?:Phase|Fase)` em vez de apenas `Phase`. Funcoes afetadas:

- `getRoadmapPhaseInternal` (core.cjs) -- phasePattern e nextHeaderMatch
- `cmdRoadmapGetPhase` -- header matching e next header detection
- `cmdRoadmapAnalyze` -- phase scanning, next header, checkbox detection
- `cmdRoadmapUpdatePlanProgress` -- plan count pattern e checkbox pattern
- `cmdPhaseAdd` -- max phase detection + language-aware entry generation
- `cmdPhaseRemove` -- section removal, checkbox removal, renumbering
- `cmdPhaseComplete` -- checkbox marking, plan count, requirements lookup
- `cmdPhasePlanIndex` (fallback) -- ROADMAP phase scanning

Adicionalmente, `**Goal:**` patterns foram atualizados para `**(?:Goal|Objetivo):**` e `**Plans:**` para `**(?:Plans|Planos):**`.

`cmdPhaseAdd` agora detecta o idioma do ROADMAP e gera entradas no formato correto (PT com Objetivo/Requisitos/Depende de/Planos ou EN com Goal/Requirements/Depends on/Plans).

### Tarefa 2: Subcomando phase generate-from-report

Novo subcomando `phase generate-from-report` com:

- **Input:** JSON via stdin ou argumentos CLI (source, report_path, approved_ids, grouping)
- **Parser:** Extrai sugestoes do RELATORIO.md por ID usando regex para formato suggestion.md
- **Agrupamento:** Por dimensao primaria, com subdivisao por diretorio se 5+ sugestoes, merge de grupos pequenos
- **Geracao:** Fases completas no ROADMAP.md com Objetivo, Criterios de Sucesso, lista de sugestoes
- **Infra:** Cria diretorio da fase com .gitkeep, adiciona checkbox e linha na tabela de progresso
- **Output:** JSON com phases_created, total_phases, total_suggestions, roadmap_updated

Helpers criados: `parseSuggestionsFromReport`, `extractTableField`, `groupSuggestionsByDimension`, `buildSubgroupName`, `buildGroupName`, `buildCriteria`, `findLastCheckboxEnd`.

## Desvios do Plano

Nenhum -- plano executado exatamente como escrito.

## Self-Check: PASSOU

Verificacoes realizadas:
- up/bin/up-tools.cjs: 17 ocorrencias de Phase|Fase (minimo: 8)
- up/bin/lib/core.cjs: 2 ocorrencias de Phase|Fase (minimo: 2)
- Funcao cmdPhaseGenerateFromReport presente e registrada no dispatcher
- Deteccao de idioma (usePt) implementada
- Arquivo loads sem erros de sintaxe
- Commits d8cf25d e 354c8fe verificados
