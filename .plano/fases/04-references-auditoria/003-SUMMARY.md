---
phase: 04-references-auditoria
plan: 04-003
subsystem: references
tags: [ux, heuristics, audit, static-analysis, nielsen]
dependency_graph:
  requires: []
  provides: [audit-ux-reference]
  affects: [up-auditor-ux-agent, melhorias-workflow]
tech_stack:
  added: []
  patterns: [xml-semantic-tags, heuristic-catalog, stack-detection]
key_files:
  created:
    - up/references/audit-ux.md
  modified: []
decisions:
  - Heuristicas puramente visuais excluidas (indetectaveis via analise estatica)
  - 39 heuristicas em vez das 30 minimas, priorizando cobertura completa
  - Arquivo com 1544 linhas vs guideline de 400-600 (formato com codigo exige mais espaco)
metrics:
  duration: 342s
  completed: 2026-03-09
  tasks: 1
  files_created: 1
  files_modified: 0
---

# Fase 4 Plano 3: Reference de UX Summary

Catalogo de 39 heuristicas UX traduzidas para sinais detectaveis via analise estatica de codigo, organizadas em 7 categorias baseadas nas heuristicas de Nielsen, com secao de deteccao de stack (CSS/component/UI/form frameworks).

## Tarefas Executadas

| # | Tarefa | Commit | Arquivos |
|---|--------|--------|----------|
| 1 | Criar audit-ux.md com heuristicas UX para analise estatica | b08caed | up/references/audit-ux.md |

## O que foi Construido

### Reference audit-ux.md

Arquivo de referencia para o agente auditor de UX (Fase 5) contendo:

**Estrutura:**
- `<overview>` -- Proposito, abordagem, limitacoes da analise estatica de UX
- `<stack_detection>` -- Deteccao de CSS framework (Tailwind/Bootstrap/CSS Modules/Styled Components/CSS puro), component framework (React/Vue/Svelte/Next.js), UI library (shadcn/Radix/MUI/Ant/Chakra), form library (RHF/Formik/Zod/VeeValidate)
- 7 categorias com total de 39 heuristicas

**Categorias e contagem:**
| Categoria | Heuristicas | Nielsen # |
|-----------|-------------|-----------|
| feedback-status | 6 | #1 Visibilidade do status |
| consistencia | 5 | #4 Consistencia e padroes |
| formularios | 6 | #5 Prevencao de erros |
| navegacao | 5 | #6 Reconhecimento |
| responsividade | 5 | #7 Flexibilidade |
| hierarquia-visual | 4 | #8 Estetica |
| erros-recuperacao | 4 | #9 Recuperacao de erros |

**Formato de cada heuristica:**
- Heuristica de Nielsen correspondente
- Frameworks aplicaveis
- Impacto tipico (P/M/G)
- Sinal de deteccao (grep patterns e heuristicas de analise)
- Exemplo de problema em codigo
- Solucao em codigo
- Limitacao (cenarios de false positive/negative)

## Desvios do Plano

### Desvio Menor: Arquivo excedeu guideline de linhas

**Guideline:** 400-600 linhas
**Resultado:** 1544 linhas
**Justificativa:** O formato especificado (sinal de deteccao com grep, exemplo de problema com codigo, solucao com codigo, limitacao) para 39 heuristicas inerentemente requer mais espaco. Cada heuristica ocupa ~30-40 linhas com blocos de codigo. Reduzir para 400-600 linhas exigiria cortar heuristicas abaixo do minimo ou remover exemplos de codigo, prejudicando a utilidade do reference para o agente auditor.

## Verificacao

```
PASS: file exists
PASS: overview
PASS: stack_detection
PASS: feedback-status
PASS: consistencia
PASS: formularios
PASS: navegacao
PASS: responsividade
PASS: hierarquia-visual
PASS: erros-recuperacao
PASS: Heuristica de Nielsen
PASS: Sinal de deteccao
PASS: Limitacao
PASS: >= 25 heuristics (39 encontradas)
```

## Self-Check: PASSOU

- [x] Arquivo `up/references/audit-ux.md` existe (ENCONTRADO)
- [x] Commit `b08caed` existe (ENCONTRADO)
- [x] 7 categorias obrigatorias presentes
- [x] 39 heuristicas (>= 30 minimo)
- [x] Cada heuristica com formato completo (Nielsen, frameworks, impacto, sinal, problema, solucao, limitacao)
- [x] Secao stack_detection com CSS/component/UI/form frameworks
- [x] Formato XML tags semanticas alinhado com references UP
