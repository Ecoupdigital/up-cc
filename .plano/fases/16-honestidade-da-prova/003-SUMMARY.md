---
phase: 16-honestidade-da-prova
plan: "003"
tags: [seams, plan-ready, PROVA-02, PROVA-03, PROVA-05]
completed: "2026-07-27"
---

# Fase 16 Plano 003: Fronteiras pre-acordadas, doutrina e validacao

## O que foi feito

**Tarefa 1.** `up/references/seams.md`: doutrina com as sete secoes (o que e, como nomear, tres regras, formato, bom/ruim no mesmo cenario, escalada, onde verifica).

**Tarefa 2.** `up/templates/plan-ready.md`: `plan_schema: 2`, bloco `seams:`, `fora_de_escopo`, secoes "Fronteiras Confirmadas" e "Fora de Escopo", nota nas guidelines. Secao de aprovacoes de CEO/chiefs intocada.

**Tarefa 3.** Nove casos `gate plan-ready` em `gate.test.cjs`. Vermelho: 12 passed (001), 9 failed (subverbo ausente). `evidencia/003-red.txt`.

**Tarefa 4.** `checkPlanReadySeams`, `pareceCaminho`, `parseSeamsBlock` em `gate.cjs`; subverbo `plan-ready` na CLI. Verde: 21 passed, 0 failed. Contra PLAN-READY real: `pass=true schema=null seams=0 avisos=1`.

**Tarefa 5.** Blocos de seams em `up-planejador.md` e extensao da Regra 4 em `up-executor.md`.

## Arquivos tocados

| Arquivo | Papel |
|---------|-------|
| `up/references/seams.md` | Doutrina (novo) |
| `up/templates/plan-ready.md` | Campo seams + plan_schema |
| `up/bin/lib/gate.cjs` | Validacao plan-ready |
| `up/bin/up-tools.cjs` | Subverbo plan-ready |
| `up/bin/lib/gate.test.cjs` | 9 casos novos |
| `up/agents/up-planejador.md` | Bloco seams + self-check |
| `up/agents/up-executor.md` | Escalada de fronteira |
| `evidencia/003-red.txt` / `003-green.txt` | Par vermelho/verde |

## Prova

### Vermelho
```
12 passed, 9 failed  (plan-ready: Unknown command / usage)
```

### Verde
```
21 passed, 0 failed
node up/bin/up-tools.cjs gate plan-ready --raw
-> gate plan-ready: pass=true schema=null seams=0 avisos=1
```

## Desvios

Nenhum.

## Self-Check

- [x] Par red/green gravado
- [x] Legado passa com aviso; schema 2 sem seams bloqueia
- [x] Caminho recusado; rota aceita
- [x] Agentes citam seams.md
- [x] Travessao zero no diff novo
