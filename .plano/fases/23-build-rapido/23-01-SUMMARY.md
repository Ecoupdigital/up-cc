---
phase: 23-build-rapido
plan: 23-01
completed: 2026-11-13
---

# Fase 23 Plano 01: Build rápido com modelo menor

**`/up:build` passa a abrir e fechar a fase com `up-tools build open/close`, carrega ~9,8 KB de instrução (eram ~34 KB só de comando + workflow, ~82 KB com executor e padrão) e roda o executor no modelo de `build_model`.**

## Prova

| Entrega | Tipo | Comando ou ação | Resultado |
|---------|------|-----------------|-----------|
| 1. `build open` | lógica | `node up/bin/lib/build.test.cjs` | 12 ok, 0 falhas (open local, github sem remote, build_model, retomada) |
| 2. `build close` | lógica | `node up/bin/lib/build.test.cjs` | mesmos 12: sem SUMMARY/sem Prova recusa, verify falhando não mergeia, local e merge marcam STATE/ROADMAP, discard |
| 3. `build.md` enxuto | invariante | `node up/tests/build-rapido.test.cjs` | 8/8; contra os arquivos da v3.1 o mesmo teste falha 8 de 8 |
| 4. Executor e SUMMARY curtos | invariante | `node up/tests/build-rapido.test.cjs` | executor 55 linhas, SUMMARY template 1,1 KB com `## Prova` |
| 5. `build_model` | lógica + invariante | `build.test.cjs` (config sonnet volta em `build open`) + `build-rapido.test.cjs` | ok |
| Suíte | teste | `npm run test:up` | 16 arquivos, 0 falharam |
| Instalação | smoke | `env -i HOME=<tmp> PATH=$PATH node up/bin/install.js --all --global` | exit 0, `build.cjs` e `build-optins.md` nos 4 runtimes; `VERSION` real com mtime inalterado |
| Fase de brinquedo | smoke | `up-tools build open --phase 1 --local` e `build close --land local` (instalado no HOME temporário) | close sem SUMMARY: `ok:false, stage: summary`; com SUMMARY: `ok:true, verify: pass`, ROADMAP `[x]` + tabela `1/1 Completa`, STATE atualizado, commit `docs(fase-01): fase completa` |

## Commits

- `cb886a3` feat(23-01): build open/close no up-tools e build_model no config
- `fe6cb22` feat(23-01): build.md enxuto sobre build open/close
- `0e28c0f` feat(23-01): executor de uma pagina e SUMMARY curto
- `db00817` test(23-01): invariantes do build rapido e inventario de perguntas atualizado

## Desvios

- `npm audit` sem lockfile falhava sempre (ENOLOCK). Como o `verify-static` agora trava o merge, isso bloquearia todo projeto sem lockfile: passou a pular.
- `perguntas.test.cjs` protege o inventário de perguntas: saíram `build.runtime-divergente`, `build.plano-incompleto` e `build.replan-esgotado` (cerimônia virou código), piso de 20 para 17, `build-optins.md` entrou como superfície.
- `up-executor.md` trocou `model: sonnet` por `model: inherit`: quem escolhe o modelo agora é `build_model`.
- Versão 3.2.0 (recomendação do briefing; 4.0.0 fica para quando a fase 24 fechar).
