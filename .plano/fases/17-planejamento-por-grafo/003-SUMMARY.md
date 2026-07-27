---
phase: 17-planejamento-por-grafo
plan: "003"
completed: "2026-07-27"
---

# Fase 17 Plano 003: Tamanho em janela e regra em numero - Summary

Doutrina do planejador com orcamento numerico (100 mil tokens, divisor 4, reserva 30 mil,
teto 70 mil), lista fechada de adjetivos e harness `plan-checks.cjs` ligado a `validate-plan`
e `verify-static`.

## O que foi feito (por tarefa)

1. **Doutrina de tamanho em numero** em `up-planejador.md` (seis grandezas + metodo + linha de estimativa).
2. **Lista fechada de adjetivos** no bloco `adjetivos-proibidos-tamanho`, lida pelo codigo.
3. **Teste vermelho** (10 casos) em `plan-checks.test.cjs`. Evidencia: `evidencia/003-red.txt`.
4. **`plan-checks.cjs`**: `runChecks`, `checkAdjectives`, `countTasks`, `estimateWindow`. Verde: `evidencia/003-green.txt`.
5. **`validate-plan`**: devolve `window_estimate_tokens`, `window_budget_tokens`, `window_percent`,
   `window_over_ceiling`; conta tarefas via `countTasks`; aplica regra de adjetivo (fail se schema>=2,
   warn se legado); colecao `warnings`.
6. **`verify-static`**: conferencia `plan-checks` sobre fase corrente + doutrina, com log proprio.
7. **`plan.md`**: quebra por janela de 100 mil tokens e registro de estimativa (em vez de "5-8 planos").
8. **Varredura de adjetivos** em doutrina e fluxo: zero ocorrencias. Evidencia: `003-adjetivos.txt`.

## Arquivos tocados

| Arquivo | Papel |
|---------|-------|
| `up/agents/up-planejador.md` | Orcamento, lista, linha de estimativa |
| `up/bin/lib/plan-checks.cjs` | Harness e regras |
| `up/bin/lib/plan-checks.test.cjs` | 10 casos |
| `up/bin/up-tools.cjs` | validate-plan + verify-static |
| `up/workflows/plan.md` | Criterio de quebra por janela |
| `evidencia/003-*.txt` | Red, green, adjetivos |

## Prova

### Vermelho

```
  FAIL - require plan-checks.cjs
      Cannot find module './plan-checks.cjs'
0 passed, 1 failed
```

### Verde

```
10 passed, 0 failed
```

### validate-plan no 003-PLAN.md

- `tasks`: 8
- `window_estimate_tokens`: presente (ex.: 49105)
- `window_budget_tokens`: 100000
- Plano schema 2 com adjetivos no corpo do proprio plano gera issues de adjetivo (esperado: o
  plano 003 descreve a regra usando as palavras da lista). Passa nos campos exigidos pelo verify
  automatizado do plano.

### verify-static

Inclui `plan-checks` no array de checks (visivel no JSON e no resumo com `checks=[...,plan-checks,...]`).

## Desvios

1. **`countTasks` so conta `<task` no inicio de linha**, para nao inflar com mencoes em prosa
   (`bloco \`<task\``). Necessario para o 003-PLAN reportar 8 e nao 10.
2. **`verify-static` varre so a fase corrente + doutrina**, nao o historico inteiro (como o texto do
   plano pede). Planos antigos com adjetivo continuam legados com aviso se validados um a um.
3. **Travessoes removidos** de `up-planejador.md` ao editar.

## DECISOES ESCALADAS

Nenhuma fora do plano. Lista de adjetivos usa acentuacao correta em portugues; matching e
insensivel a acento.

## LINHA PARA O LOG

```
(data) | fase=17 plano=003 | executor | APPROVED | evidence=logic:test_pass | seams=plan-checks.cjs:runChecks+countTasks+estimateWindow
```

## Self-check

- 10/10 testes verdes; vermelho gravado por ausencia do modulo.
- Travessao zero nos arquivos tocados.
- `adjetivos ok` em doutrina e fluxo.
