---
phase: 24-plano-concreto-e-auto
plan: 24-01
completed: 2026-11-13
---

# 24-01: plano concreto, /up:auto e corte

Plano com `Onde:` e comando de prova por entrega, `up-tools plan close`, `/up:plan` de ~27 KB (comando + workflow) para ~10 KB com template, `/up:auto`, 3 agentes e 12 verbos legados removidos. Versão 4.0.0.

## Prova

| # | Entrega | Prova | Resultado |
|---|---------|-------|-----------|
| 1 | Plano concreto | `node up/bin/lib/plan.test.cjs` | 6/6 ok (avisos de Onde e comando, plano antigo segue passando no validate-plan) |
| 2 | `plan close` | `node up/bin/lib/plan.test.cjs` | ok: só plano pendente, nome da fase, onda, commit; erro sem plano pendente |
| 3 | `/up:plan` enxuto | `node up/tests/plano-concreto.test.cjs` | comando + workflow + template = 10.219 bytes (<= 12 KB); só `up-arquiteto` no caminho padrão |
| 4 | `/up:auto` | `env -i HOME=<tmp> PATH="$PATH" node up/bin/install.js --all --global` | exit 0; `auto` instalado em Claude (commands + skill), Gemini (toml), OpenCode (`up-auto.md`) e Codex (skill) |
| 5 | Corte | `npm run test:up` e reinstalação sobre instalação antiga no mesmo HOME | 19 arquivos, 0 falhas; agentes 12 -> 9 nos 4 runtimes; `up-tools.cjs` 3678 -> 3067 linhas |

## Commits

ce01f02, 6e3ee40, 3ac27e5, 7f26dff, d45f5de, 550d886, 0bafeef, 8e6720b

## Desvios

- `build open` também avisa plano pouco concreto (risco do briefing: plano da v3.1 executa igual, com aviso). Commit 8e6720b.
- `plan.revisor-bloqueou` mudou de superfície (`plan.md` -> `plan-profundo.md`), com o inventário de perguntas ajustado.
- `skill-manifest`, `status`, `progress` e `classify-task` ficaram: têm uso ou são citados pelas skills.
- Fix do merge sem `--delete-branch` entrou antes da fase (56fabcc, na main local), herdado pela branch.
