---
phase: 16-honestidade-da-prova
plan: "004"
tags: [seams, plan, build, log, PROVA-01, PROVA-03, PROVA-04, PROVA-05]
completed: "2026-07-27"
---

# Fase 16 Plano 004: Fronteiras no fluxo, no gate e no log

## O que foi feito

**Tarefa 1.** `plan.md`: passo "Esboco de fronteiras de teste" antes do spawn do planejador; escrita `evidence=seams:confirmed`; PR.1 preenche `plan_schema: 2` + seams e valida com `gate plan-ready`.

**Tarefa 2.** `build.md`: V.1 valida plan-ready (bloqueia se schema>=2 falha; avisa legado); GATE de fase com `--require-seams` condicional; regra de execucao no prompt do executor; success criteria.

**Tarefa 3.** Dois casos em `gate.test.cjs`: entrada seams aditiva (nao rouba veredito) e exigencia separavel (`seams_missing`).

**Tarefa 4.** Dogfooding: linha `phase-16 | ... | evidence=seams:confirmed` no log real. Smoke em `evidencia/004-smoke.txt`.

**Tarefa 5.** Regressao em `evidencia/004-regressao.txt`.

## Arquivos tocados

| Arquivo | Papel |
|---------|-------|
| `up/workflows/plan.md` | Esboco + log + validacao plan-ready |
| `up/workflows/build.md` | Gate de entrada + require-seams condicional |
| `up/bin/lib/gate.test.cjs` | 2 casos aditivos |
| `.plano/governance/approvals.log` | Entrada seams fase 16 (runtime, gitignored) |
| `evidencia/004-smoke.txt` / `004-regressao.txt` | Provas |

## Prova (smoke)

```
gate plan-ready --raw  -> pass=true schema=null seams=0 avisos=1
gate verdict --phase 16 -> decision=null evidence=seams seams=true
gate entries --phase 16 -> 1 entrada
phase 11 decision=APPROVE
phase 12 decision=APPROVE
seams_confirmed=true
```

## Prova (testes + install)

```
up tests: 11 arquivos, 0 falharam  (inclui 23 casos no gate.test)
install exit=0
seams.md em: .claude, .gemini, .codex (OpenCode: ver nota)
plan-ready legado: pass=true
```

## Desvios / notas

1. **OpenCode e references:** na instalacao `--all`, `seams.md` apareceu em Claude, Gemini e Codex.
   OpenCode pode copiar references sob outro layout; se nao copiar por design, nao e falha desta
   fase (plano: "declarar em vez de inventar correcao no instalador").
2. **approvals.log e gitignored** (`.plano/governance/`). A entrada de dogfooding fica no disco
   local da worktree; nao entra no commit. Smoke documentado em `004-smoke.txt`.

## Self-Check

- [x] plan.md e build.md com seams
- [x] 2 casos aditivos verdes
- [x] Smoke real: seams_confirmed + historico 11/12
- [x] Travessao zero no diff novo
