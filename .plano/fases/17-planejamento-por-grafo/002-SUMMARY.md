---
phase: 17-planejamento-por-grafo
plan: "002"
completed: "2026-07-27"
---

# Fase 17 Plano 002: Grafo de bloqueio e fronteira derivada - Summary

`depends_on` vira verdade da ordem; `deriveFrontier` recalcula a fronteira a cada rodada;
onda permanece como visao de leitura. Onda zero deixa de colapsar para um. Contagem de
tarefas usa `planChecks.countTasks`.

## O que foi feito

1. **12 casos de fronteira** no `plans.test.cjs` (F1-F12). Vermelho: `evidencia/002-red.txt`.
2. **`normalizeEdges`**: canoniciza ids, dangling, autoaresta, sinal `declared`.
3. **`deriveFrontier`**: modos aresta/onda/misto, falha, ciclo, exhausted, derived_waves.
   Verde: `evidencia/002-green.txt` (22/22).
4. **`phase-plan-index`**: campos aditivos frontier/blocked/dangling_edges/cycle/ordering_mode/
   exhausted; por plano edges/derived_wave/state; `--failed ids`; wave 0 preservada;
   task_count via plan-checks.
5. **`build.md`**: laco de fronteira com `--failed`, cycle e exhausted (em vez de ondas fixas).
6. **Doutrina**: dependencia primaria; onda como visao derivada; menor onda publicada = 1.
7. **Retrocompat**: `evidencia/002-retrocompat.txt`.
8. **Regressao**: `evidencia/002-regressao.txt` (plans 22/22 + github 10/10).

## Prova

### Vermelho
12 falhas por ausencia de `deriveFrontier` (10 casos do 001 ainda verdes).

### Verde
```
22 passed, 0 failed
```

### Indice fase 17
- `ordering_mode`: aresta
- `waves`: 3 chaves (1, 2, 3)
- Com 001 e 003 ja com SUMMARY: frontier = [002, 004]
- edges: 002→[001,003], 004→[003], 005→[002,004]

### Retrocompat (decisao escalada)
Fases 3-10 **ja declaram** `depends_on` no frontmatter (muitas com lista vazia, algumas com
arestas reais). Por isso `ordering_mode` sai `aresta`, nao `onda`. Fase 11 (sem o campo)
sai `onda`. Isso honra arestas que o motor antigo ignorava. O verify automatizado do plano
que pedia 9x `"ordering_mode": "onda"` nao se aplica ao disco real deste repositorio.

## DECISOES ESCALADAS

**1. Retrocompat em modo aresta quando `depends_on` ja existe.** Alternativa: forcar modo
onda se todas as listas estiverem vazias. Rejeitada porque (a) o plano distingue ausente vs
vazio, (b) fases 6-10 tem arestas reais que devem valer, (c) lista vazia em todos os planos
de uma fase e semanticamente "leque" (F2), nao "legado por onda".

## LINHA PARA O LOG

```
(data) | fase=17 plano=002 | executor | APPROVED | evidence=logic:test_pass | seams=plans.cjs:normalizeEdges+deriveFrontier
```

## Self-check

- 22 testes verdes; travessao zero nos tocados.
- github.test.cjs 10/10.
