---
phase: 16-honestidade-da-prova
plan: "001"
tags: [gate, leitor-unico, prova, red-green, PROVA-04]
completed: "2026-07-27"
---

# Fase 16 Plano 001: Leitor unico do log de aprovacoes

## O que foi feito

**Tarefa 1.** Corredor de testes do UP: `scripts/run-up-tests.cjs` varre recursivamente `up/` por `*.test.cjs`, ordena por caminho e executa em subprocesso. Em `package.json`, script `test:up` (sem alterar `test`, que de qualquer forma nao existia neste package).

**Tarefa 2.** Helper compartilhado `up/bin/lib/test-helpers.cjs`: `runUpTools`, `runUpToolsJson`, `mkTempProject`, `cleanup`, `runner`. Fronteira = CLI como subprocesso.

**Tarefa 3.** Teste vermelho `up/bin/lib/gate.test.cjs` com 12 casos sobre os tres pontos de quebra. Executado ANTES da implementacao: 0 passed, 12 failed (Unknown command: gate). Saida em `evidencia/001-red.txt`.

**Tarefa 4.** Modulo `up/bin/lib/gate.cjs`: `parseApprovalLine`, `readApprovals`, `verdictForPhase`, `evaluateGate`. Localiza campo por conteudo; normaliza gramaticas de evidencia; fail-open.

**Tarefa 5.** Subcomando `gate` em `up/bin/up-tools.cjs` (`verdict` e `entries`, flags `--phase`, `--scope`, `--expect-evidence`, `--require-seams`, `--field`). Verde: 12 passed, 0 failed. Saida em `evidencia/001-green.txt`.

## Arquivos tocados

| Arquivo | Papel |
|---------|-------|
| `scripts/run-up-tests.cjs` | Corredor de testes do UP (novo) |
| `package.json` | Script `test:up` |
| `up/bin/lib/test-helpers.cjs` | Helpers de teste (novo) |
| `up/bin/lib/gate.cjs` | Leitor unico (novo) |
| `up/bin/lib/gate.test.cjs` | 12 casos red-green (novo) |
| `up/bin/up-tools.cjs` | Subcomando `gate` |
| `evidencia/001-red.txt` | Saida bruta vermelha |
| `evidencia/001-green.txt` | Saida bruta verde |

## Prova

### Vermelho (antes da implementacao)

```
comando: node up/bin/lib/gate.test.cjs
exit=1
0 passed, 12 failed
(todos: Unknown command: gate)
```

Arquivo completo: `evidencia/001-red.txt`.

### Verde (depois)

```
comando: node up/bin/lib/gate.test.cjs
exit=0
12 passed, 0 failed
```

Arquivo completo: `evidencia/001-green.txt`.

### Corredor

```
comando: node scripts/run-up-tests.cjs
up tests: 11 arquivos, 0 falharam
```

### Unitario do modulo

```
gate.cjs ok
(parse APPROVED -> APPROVE, phase=11, smoke:pass -> glue, fragmento null)
```

## Desvios do plano

1. **`npm test` nao existe neste package.json.** O plano pede `npm test` intacto. O script `"test"` ja nao existia no package (GSD legacy removido ou nunca publicado neste package). Saida: `npm error Missing script: "test"`. Registrado em `deferred-items.md`. Nao inventei script `test`.

2. **Caso 6 (fragmento):** a frase do plano "nenhuma entrada cujo raw comece com `{`" foi interpretada como nenhuma entrada ACEITA (`entries`), nao `ignored`. O fragmento `{` corretamente cai em `ignored`. Decisao conservadora documentada.

## Achados fora de escopo

Ver `deferred-items.md`: `npm test` ausente; bugs de `init` e `state *` herdados (ja conhecidos).

## DECISÕES ESCALADAS

**1. Interpretacao do caso "fragmento sem veredito".** O plano diz `ignored.length >= 2` e "nenhuma entrada cujo raw comece com `{`". Interpretei "entrada" como item de `entries` (aceitas), porque o proprio fragmento que comeca com `{` deve estar em `ignored`. Alternativa: exigir que ignored nao tenha `{` (sem sentido). Mudaria de ideia se o revisor mostrasse que o contrato era outro.

**2. `npm test`.** Nao adicionei script `test` fantasma. O plano proibe alterar `"test"`. A suíte GSD nao esta no package atual. Mudaria se o dono reintroduzir o corredor GSD.

## Self-Check

- [x] 12 casos passam pela CLI real
- [x] Par vermelho/verde gravado
- [x] `npm run test:up` passa (11 arquivos)
- [x] Travessao: zero no diff novo (pre-existente em comentarios antigos de `up-tools.cjs` nao tocados)
- [x] Commits atomicos deste plano
