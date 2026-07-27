---
phase: 16-honestidade-da-prova
plan: "002"
tags: [gate, workflows, leitor-unico, REG-01, REG-02, REG-03]
completed: "2026-07-27"
---

# Fase 16 Plano 002: Religar os gates ao leitor unico

## O que foi feito

**Tarefa 1.** `up/workflows/build.md`: GATE de fase troca `REVISOR_ENTRY`/`grep`/`awk` por tres chamadas a `gate verdict`. Nota em prosa sobre leitura por conteudo e escritor intacto. Success criteria atualizado.

**Tarefa 2.** `up/workflows/governance.md`: mesma substituicao no passo 3; subsecao "Leitura do historico" no passo 2 com proibicao de segunda implementacao; success criteria atualizado.

**Tarefa 3.** `up/workflows/plan.md`: GATE de planejamento usa `gate verdict --scope planning --field decision`. Success criteria atualizado.

**Tarefa 4.** `up/references/tdd-evidence-types.md`: subsecao "Leitura do historico (leitor unico)" com aliases, regra de descarte e invocacao.

**Tarefa 5.** Regressao gravada em `evidencia/002-regressao.txt`.

## Arquivos tocados

| Arquivo | Papel |
|---------|-------|
| `up/workflows/build.md` | GATE de fase via leitor unico |
| `up/workflows/governance.md` | GATE + contrato de leitura unica |
| `up/workflows/plan.md` | GATE planning via `--scope` |
| `up/references/tdd-evidence-types.md` | Contrato de leitura documentado |
| `evidencia/002-regressao.txt` | Prova de regressao |

## Prova

### Inspeção deterministica (segunda implementacao)

```
grep -rn "up-revisor" up/workflows/ | grep -E "grep |awk "  -> (vazio)
grep -rn "awk -F" up/workflows/                                -> (vazio)
grep -rc "gate verdict" .../build.md .../governance.md .../plan.md
  build.md:5  governance.md:4  plan.md:2
```

### Testes UP

```
node scripts/run-up-tests.cjs
up tests: 11 arquivos, 0 falharam
```

### REG-03 (log real deste repositorio)

```
node up/bin/up-tools.cjs gate verdict --phase 11 --field decision  -> APPROVE
node up/bin/up-tools.cjs gate verdict --phase 12 --field decision  -> APPROVE
```

### REG-02 (instalacao 4 runtimes)

```
HOME=<tmp> node up/bin/install.js --all --global
install exit=0
comandos no alvo Claude: auditar, build, depurar, plan, rapido, testar, up (7)
```

### npm test

```
npm error Missing script: "test"   (pre-existente; ver deferred-items.md)
```

## Desvios

Nenhum desvio de comportamento. `npm test` continua ausente (pre-existente).

## Achados fora de escopo

Ponteiro: `deferred-items.md` item 1 (`npm test` ausente).

## Self-Check

- [x] Tres gates chamam `gate verdict`
- [x] Zero `REVISOR_ENTRY` / `awk -F` nos workflows
- [x] Reference documenta leitura
- [x] Fases 11 e 12 devolvem APPROVE no log real
- [x] Travessao zero no diff novo
- [x] Commit atomico deste plano
