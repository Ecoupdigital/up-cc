---
phase: 03-templates-formatos-padrao
plan: 001
subsystem: infra
tags: [templates, markdown, sugestao, relatorio, matriz-esforco-impacto]

requires:
  - phase: 02-agentes-paralelos
    provides: Convencoes de templates existentes (XML tags, code blocks, guidelines)
provides:
  - Template de sugestao individual com 6 campos obrigatorios (arquivo, linha, dimensao, esforco, impacto, problema/sugestao)
  - Template de relatorio consolidado com matriz 2x2 esforco x impacto
  - Formato padrao compartilhado entre agentes auditores e sintetizador
affects: [05-agentes-auditores, 06-sintetizador-melhorias, 07-comando-melhorias, 08-agente-idealizador, 09-comando-ideias]

tech-stack:
  added: []
  patterns:
    - "Formato P/M/G para esforco e impacto (Pequeno/Medio/Grande)"
    - "ID de sugestao com prefixo de dimensao: DIM-NNN (UX-001, PERF-003)"
    - "Matriz 2x2 com quadrantes: Quick Wins, Projetos Estrategicos, Preenchimentos, Evitar"

key-files:
  created:
    - up/templates/suggestion.md
    - up/templates/report.md
  modified: []

key-decisions:
  - "P/M/G mapeado para matriz: P=baixo, M/G=alto (simplicidade sobre granularidade)"
  - "Empate M/M classifica como Projetos Estrategicos (abordagem conservadora)"
  - "Quick Wins em ingles por ser termo consagrado, demais quadrantes em portugues"

patterns-established:
  - "Template de sugestao: bloco H3 com tabela de metadados + campos Problema/Sugestao/Referencia"
  - "Template de relatorio: frontmatter YAML + sumario opinativo + quadrantes ordenados + cobertura"
  - "Anti-padroes documentados inline para validacao de qualidade de sugestoes"

requirements-completed: [INFRA-01, INFRA-02]

duration: 2min
completed: 2026-03-09
---

# Fase 3 Plano 001: Templates de sugestao e relatorio Summary

**Templates markdown padrao para sugestoes individuais (6 campos P/M/G) e relatorio consolidado com matriz 2x2 esforco x impacto**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T22:51:12Z
- **Completed:** 2026-03-09T22:53:26Z
- **Tasks:** 2/2
- **Files created:** 2

## Accomplishments

- Template de sugestao com formato autocontido: arquivo, linha, dimensao, esforco, impacto, problema, sugestao, referencia
- Template de relatorio com matriz 2x2 de priorizacao, sumario executivo, visao geral por dimensao e cobertura
- Definicoes precisas de campos, regras de classificacao e anti-padroes para garantir qualidade uniforme entre agentes

## Task Commits

Each task was committed atomically:

1. **Task 1: Template de sugestao individual** - `5335503` (feat)
2. **Task 2: Template de relatorio consolidado** - `0cca0e8` (feat)

## Files Created/Modified

- `up/templates/suggestion.md` - Template de sugestao individual com 6 campos obrigatorios, field_definitions, guidelines, anti_patterns e exemplo completo
- `up/templates/report.md` - Template de relatorio consolidado com frontmatter YAML, matriz 2x2, quadrant_definitions, guidelines e evolution

## Decisions Made

1. **Mapeamento P/M/G binario:** P=baixo, M/G=alto. Mais simples que escala 1-5 e suficiente para a matriz 2x2.
2. **Empate M/M conservador:** Quando Esforco=M e Impacto=M, vai para Projetos Estrategicos (assume custo alto quando ambiguo).
3. **Nomenclatura mista:** "Quick Wins" mantido em ingles por ser universalmente reconhecido; demais quadrantes em portugues.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Templates de sugestao e relatorio prontos para uso por agentes auditores (Fase 5) e sintetizador (Fase 6)
- Formato P/M/G e regras de classificacao nos quadrantes documentados e prontos para referencia
- Fase 4 (References de auditoria) pode prosseguir independentemente -- nao depende destes templates

---
*Phase: 03-templates-formatos-padrao*
*Completed: 2026-03-09*
