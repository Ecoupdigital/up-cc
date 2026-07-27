---
phase: 17-planejamento-por-grafo
plan: "001"
completed: "2026-07-27"
---

# Fase 17 Plano 001: Leitura de plano e de resumo nas duas convenções - Summary

Inventário de fase unificado em `plans.cjs`, com as três convenções de nome de plano/resumo
reconhecidas e pareamento por identificador canônico. O despachante e os fluxos deixam de filtrar
por sufixo literal.

## O que foi feito (por tarefa)

1. **Teste vermelho** (`plans.test.cjs`, 10 casos): harness no formato de `github.test.cjs`.
   Executado antes da implementação. Saída em `evidencia/001-red.txt`.
2. **`plans.cjs`**: `classifyPlanFile`, `inventoryPhase` (com `id_conflicts`), exportação por objeto.
3. **`pairSummaries`**: pareamento por id canônico e `orphan_summaries`. Verde em `evidencia/001-green.txt`.
4. **`cmdPhasePlanIndex`**: consome a biblioteca; campos aditivos `file`, `summary_file`,
   `id_conflicts`, `orphan_summaries`. Plano sem frontmatter: wave 1, autonomous true.
5. **Demais inventários em `up-tools.cjs`**: init executar-fase, progresso, phase find, status,
   progress table, guarda de remoção. Zero `endsWith('-PLAN.md')` / `endsWith('-SUMMARY.md')` no
   despachante.
6. **Fluxos**: `build.md` e `plan.md` usam o campo `file` e `has_summary` do índice. Estágio V.4
   resolve planos via `phase-plan-index` e falha com "nenhum plano resolvido" se a lista sair vazia.
7. **Fases reais**: evidência em `evidencia/001-fases-reais.txt`. Fase 3 e 9 e 10 e 17 conferidas no
   disco desta worktree. Fase 11 (convenção `PLAN-001.md`) não está versionada neste repositório;
   conferida com cópia temporária a partir do working tree de `/home/projects/up-cc` e removida
   depois (não commitada).

## Arquivos tocados

| Arquivo | Papel |
|---------|-------|
| `up/bin/lib/plans.cjs` | Canonicalização, inventário, pareamento |
| `up/bin/lib/plans.test.cjs` | 10 casos red-green |
| `up/bin/up-tools.cjs` | Índice e inventários ligados à lib; travessões pré-existentes zerados |
| `up/workflows/build.md` | file/has_summary do índice; V.4 sem padrão cego |
| `up/workflows/plan.md` | contagem via phase-plan-index |
| `evidencia/001-red.txt` | saída vermelha |
| `evidencia/001-green.txt` | saída verde |
| `evidencia/001-fases-reais.txt` | índice nas fases 3, 9, 10, 11, 17 |

## Prova

### Vermelho (antes da implementação)

```
$ node up/bin/lib/plans.test.cjs
  FAIL - require plans.cjs
      Cannot find module './plans.cjs'
...
0 passed, 1 failed
```

Arquivo: `evidencia/001-red.txt`.

### Verde (depois)

```
$ node up/bin/lib/plans.test.cjs
  ok  - 1. rotulo antes do id (fase 11): plano e resumo pareiam
  ...
  ok  - 10. segmento numerico inicial diferente da fase nao e removido

10 passed, 0 failed
```

Arquivo: `evidencia/001-green.txt`.

### Índice em fases reais (trechos)

- Fase 3: `has_summary: true`, `summary_file: "03-001-SUMMARY.md"` (antes: false).
- Fase 9: dois planos, ambos com resumo (001-SUMMARY e 09-002-SUMMARY).
- Fase 10: dois planos com resumo (campos legados preservados + `file`/`summary_file`).
- Fase 11 (cópia temp): `file: "PLAN-001.md"`, `has_summary: true`, `summary_file: "SUMMARY-001.md"`.
- Fase 17: cinco planos, todos `has_summary: false` (exatamente 5 no arquivo de evidência).

### Emenda RV-013 (validação de planos listados)

O padrão `fases/[0-9]+-[a-z-]+/[0-9]+-[0-9]+-PLAN.md` foi removido de `build.md`. A mensagem
"nenhum plano resolvido" está no estágio V.4.

## Desvios do plano

1. **Fase 11 ausente do git nesta worktree.** Os arquivos existem no working tree de
   `/home/projects/up-cc` mas não estão rastreados (`git ls-files` vazio). A prova de convenção
   `PLAN-*` roda nos testes unitários e numa cópia temporária não commitada.
2. **`core.cjs` ainda filtra por sufixo** em `searchPhaseInDir`. Fora de `files_modified`. O
   `init executar-fase` foi re-inventariado em `up-tools.cjs` com a lib, contornando o core. Outros
   consumidores diretos de `findPhaseInternal` ainda podem ver o filtro antigo. Registrado em
   deferred se necessário.
3. **Preservação de wave 0** na leitura do frontmatter (sem `|| 1` que colapsava zero). Correção
   adiantada do defeito que o plano 002 também cobre; não muda os campos que a fase 10 já expunha
   além de wave quando o frontmatter tem 0.

## Achados fora de escopo

Ver `deferred-items.md` se houver. Dívidas conhecidas da fase 15/16 (`init up` / `state *`) não
foram tocadas.

## DECISÕES ESCALADAS

Nenhuma decisão de produto ambígua. Opções tomadas dentro do plano.

## LINHA PARA O LOG

```
(data) | fase=17 plano=001 | executor | APPROVED | evidence=logic:test_pass | seams=plans.cjs:classifyPlanFile+inventoryPhase+pairSummaries
```

## Self-check

- Travessão nos arquivos tocados: 0 (também zerados em-dashes pré-existentes em up-tools/build/plan).
- Testes: 10/10.
- Contagem `has_summary: false` na evidência de fases reais: 5 (só a fase 17).
