---
phase: 04-references-auditoria
plan: 04-001
subsystem: references
tags: [performance, anti-patterns, audit, reference]
dependency_graph:
  requires: []
  provides: [audit-performance-reference]
  affects: [up-auditor-performance-agent]
tech_stack:
  added: []
  patterns: [xml-semantic-tags, grep-detection-signals, P-M-G-impact-scale]
key_files:
  created:
    - up/references/audit-performance.md
  modified: []
decisions: []
metrics:
  duration: 373s
  completed: 2026-03-09
---

# Fase 4 Plano 1: Reference de Performance Summary

Catalogo de 37 anti-padroes de performance organizados em 8 categorias com sinais de deteccao grep, exemplos de codigo e escala de impacto P/M/G alinhada ao template de sugestao.

## Tarefas Executadas

| # | Tarefa | Status | Commit |
|---|--------|--------|--------|
| 1 | Criar audit-performance.md com 8 categorias e stack detection | Completa | e89e0dd |

## Resultado

O arquivo `up/references/audit-performance.md` (478 linhas) contem:

**Secoes estruturais:**
- `<overview>` -- Proposito, instrucoes de uso, escala de impacto
- `<stack_detection>` -- Deteccao de React/Vue/Svelte, Next/Nuxt, Tailwind/Bootstrap, ORMs (Prisma/Drizzle/Sequelize/TypeORM)
- 8 `<category>` tags com anti-padroes

**Categorias e contagem de padroes:**

| Categoria | Padroes | Exemplo |
|-----------|---------|---------|
| re-renders | 6 | INLINE-OBJECT-PROPS, MISSING-MEMO-LIST, PARENT-STATE-CASCADE |
| bundle | 6 | FULL-LIBRARY-IMPORT, HEAVY-DEP-WITH-ALTERNATIVE, MISSING-CODE-SPLITTING |
| queries | 5 | N-PLUS-ONE, MISSING-PAGINATION, SELECT-ALL-FIELDS |
| assets | 5 | IMG-MISSING-DIMENSIONS, IMG-MISSING-LAZY, FONT-MISSING-DISPLAY |
| css | 4 | LAYOUT-THRASHING, NON-COMPOSITED-ANIMATIONS, EXPENSIVE-SELECTORS |
| network | 4 | FETCH-WATERFALL, MISSING-CACHE-HEADERS, MISSING-COMPRESSION |
| configs | 3 | SOURCEMAPS-IN-PROD, CONSOLE-LOGS-IN-PROD, HARDCODED-DEV-VALUES |
| deps | 4 | HEAVY-DEPS-TABLE, ABANDONED-DEPS, DUPLICATE-PURPOSE-DEPS |
| **Total** | **37** | |

**Formato de cada padrao:**
- Nome (constante uppercase)
- Frameworks afetados
- Impacto tipico (P/M/G)
- Sinal de deteccao (comando grep executavel)
- Exemplo ruim com comentario
- Solucao com comentario

## Desvios do Plano

Nenhum -- plano executado exatamente como escrito.

## Self-Check: PASSOU

- [x] `up/references/audit-performance.md` existe (478 linhas)
- [x] Commit `e89e0dd` existe no historico
- [x] 37 anti-padroes em 8 categorias (>= 35 exigidos)
- [x] Todas as verificacoes automatizadas passaram
