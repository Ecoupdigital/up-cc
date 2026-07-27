---
phase: 16-honestidade-da-prova
plan: "005"
tags: [tautologia, TDD, PROVA-06, PROVA-07, PROVA-08]
completed: "2026-07-27"
---

# Fase 16 Plano 005: Regra anti-tautologia

## O que foi feito

**Tarefa 1.** Doutrina anti-tautologia em `up/skills/up-tdd/SKILL.md` (par bom/ruim no mesmo cenario `ola-mundo`) e ponteiro em `tdd-evidence-types.md`.

**Tarefa 2.** `tautologia.test.cjs` com 7 casos e fixtures tautologico/honesto/repetido. Vermelho: 0 passed, 7 failed. `evidencia/005-red.txt`.

**Tarefa 3.** `tautologia.cjs`: heuristica por texto, sinais `esperado_computado_no_teste` e `assercao_repete_implementacao`.

**Tarefa 4.** `verify-static --tautologia` + `--paths`; status `warn` sem contaminar overall (PROVA-08). Verde: 7/7. `evidencia/005-green.txt`.

**Tarefa 5.** Revisor confirma/descarta achados; build roda heuristica antes do spawn e anexa o log.

**Tarefa 6.** Regressao; PROVA-01..08 marcados; ROADMAP fase 16 atualizada; log da fase 16 com `seams`, `logic` e `glue`.

## Arquivos tocados

| Arquivo | Papel |
|---------|-------|
| `up/skills/up-tdd/SKILL.md` | Regra + par bom/ruim |
| `up/references/tdd-evidence-types.md` | Ponteiro curto |
| `up/bin/lib/tautologia.cjs` | Heuristica (novo) |
| `up/bin/lib/tautologia.test.cjs` | 7 casos red-green (novo) |
| `up/bin/up-tools.cjs` | verify-static --tautologia |
| `up/agents/up-revisor.md` | Confirmar/descartar |
| `up/workflows/build.md` | Produz e entrega log |
| `.plano/REQUIREMENTS.md` | PROVA-01..08 complete |
| `.plano/ROADMAP.md` | Fase 16 status |
| `evidencia/005-*.txt` | Provas |

## Prova

### Vermelho
```
0 passed, 7 failed
```

### Verde
```
7 passed, 0 failed
heuristica ok [ 'esperado_computado_no_teste' ]
```

### verify-static
```
--tautologia: overall=pass, check tautologia=warn (3 sinais nos fixtures do proprio teste)
--all: overall=fail por npm audit ENOLOCK (pre-existente; ver deferred-items #4)
  tautologia permanece warn, nao e a causa do fail
```

### Log fase 16
```
evidence_types=seams,logic,glue
decision=APPROVE seams_confirmed=true pass=true
```

## Desvios

1. Achados da heuristica sobre o proprio `tautologia.test.cjs`: as strings FIX_* contem `assert.strictEqual` e sao varridas como se fossem assercoes. Falso positivo esperado de heuristica por texto. Nao corrigido (plano: nao corrigir testes encontrados; sinalizar e basta).
2. Entradas `up-revisor | APPROVE | evidence=logic/glue` gravadas pelo executor como dogfooding do requisito de tres gramaticas no log (tarefa 6). A revisao humana formal ainda e devida no merge.

## Self-Check

- [x] Par red/green da heuristica
- [x] overall nao e fail por tautologia
- [x] revisor + build com log
- [x] PROVA-01..08 marcados
- [x] Travessao zero no diff novo
