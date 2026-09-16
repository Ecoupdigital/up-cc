---
phase: 22-plan-build-leve
plan: 22-01
subsystem: meta
tags: [plan, build, product-engineering, workflow, cli, install]

requires: []
provides:
  - "up/templates/plan.md: plano de uma pagina (formato deste proprio plano)"
  - "up/references/product-engineering.md: referencia unica de Product Engineer"
  - "up-tools.cjs validate-plan/phase-plan-index reconhecendo o formato de uma pagina"
  - "build.md executando onda de 1 plano na sessao"
affects: [up:plan, up:build, up-executor, up-arquiteto, up-planejador]

tech-stack:
  added: []
  patterns:
    - "Plano de uma pagina escrito na sessao, sem spawn de agente frio"
    - "Referencia unica carregada inteira em vez de checklist comprimido por categoria"

key-files:
  created:
    - up/templates/plan.md
    - up/references/product-engineering.md
    - up/tests/plan-build-leve.test.cjs
  modified:
    - up/workflows/plan.md
    - up/commands/plan.md
    - up/templates/plan-ready.md
    - up/bin/up-tools.cjs
    - up/agents/up-arquiteto.md
    - up/agents/up-planejador.md
    - up/workflows/build.md
    - up/commands/build.md
    - up/agents/up-executor.md
    - up/agents/up-tester.md
    - up/agents/up-revisor.md
    - up/templates/summary.md
    - up/CHANGELOG.md
    - package.json
    - up/package.json
    - README.md
    - CLAUDE.md

key-decisions:
  - "PLAN-READY.md vira indice curto em vez de arquivo pesado: mantem so o que o build de fato le (frontmatter + tabela de planos), motivo: o plano de uma pagina ja carrega objetivo/entregas/prova, duplicar isso no PLAN-READY so inflava o arquivo"
  - "Instalador nao precisou de logica nova de limpeza para production-requirements*.md: copyDirWithReplace ja limpa o destino do up/ inteiro antes de copiar, confirmado com smoke em HOME isolado nos 4 runtimes com arquivos legados plantados"

requirements-completed: []
duration: ~2h
completed: 2026-09-16
---

# Fase 22 Plano 01: Plan e build leves Summary

**`/up:plan` escreve plano de uma pagina na sessao (sem `up-planejador`), `/up:build` executa onda de 1 plano tambem na sessao, e o executor aplica o padrao de Product Engineer de `up/references/product-engineering.md` ate o fim, com `--profundo` restaurando o pipeline pesado inteiro quando precisar.**

## Entregas

- `/up:plan` sem flag nao spawna `up-planejador`: a sessao escreve o `PLAN.md` no template novo (`up/templates/plan.md`, ~3 KB), so da proxima fase. `--profundo` reproduz o fluxo antigo (subagente, todas as fases, pesquisa, self-check, loop de `validate-plan`).
- Limite de fase: ate ~5 entregas pedidas (implicitos nao contam), 1 plano por padrao. A regua "~70% do contexto de um agente" saiu de `up-arquiteto.md` e `up-planejador.md`. Projeto novo: so a proxima fase ganha `PHASE.md`/`REQUIREMENTS-SLICE.md`/`PLAN.md`.
- `/up:build`: onda com exatamente 1 plano executa na sessao, seguindo `up-executor.md` a risca, sem spawnar subagente. Onda com 2 ou mais planos continua com `up-executor` em paralelo.
- `up/references/product-engineering.md` funde o anexo do dono, os 71 requisitos de producao por categoria e as regras de dominio (frontend/backend/banco) que antes duplicavam em `up-executor.md`. `production-requirements.md` e `-compressed.md` removidos; manifesto de `up-tools.cjs` e os agentes que citavam os antigos apontam para o novo.
- Executor (sessao ou subagente) carrega o padrao inteiro, roda a analise "antes de codificar" sem perguntar, honra a linha `Implicitos:` do plano, e fecha o SUMMARY com `## Checklist de completude` (Definition of Done) ao lado de `## Prova`.

## Commits

1. **Entrega 1: plano de uma pagina na sessao** - `2daa4ab` (feat)
2. **Entrega 2: limite de fase** - `906deda` (feat)
3. **Entrega 3: build na sessao com 1 plano** - `83a7d9c` (feat)
4. **Entrega 4: referencia unica de Product Engineer** - `b7ea94d` (feat)
5. **Entrega 5: executor aplica o padrao ate o fim** - `dbd8779` (feat)
6. **Testes, versao 3.1.0 e docs** - `b9c5425` (test)

## Prova

| Entrega | Tipo | Comando ou acao | Resultado |
|---------|------|-----------------|-----------|
| Plano de uma pagina + `validate-plan`/`phase-plan-index` reconhecem o formato novo | logica | `node up/bin/up-tools.cjs validate-plan .plano/fases/22-plan-build-leve/22-01-PLAN.md` | `pass: true`, `has_verification: true`, `tasks: 5`, `issues: []` |
| `phase-plan-index` le objetivo/entregas do plano de uma pagina | logica | `node up/bin/up-tools.cjs phase-plan-index 22-plan-build-leve` | `objective` preenchido (nao nulo), `task_count: 5` para `22-01` |
| Limite de fase, `--profundo`, invariantes de arquivo | logica | `node up/tests/plan-build-leve.test.cjs` | `PASS 10/10` |
| Regressao da suite inteira (baseline e depois das 5 entregas) | logica | `npm run test:up` | baseline: 13 arquivos, 0 falhas; depois: **14 arquivos, 0 falhas** (novo teste incluido) |
| Instalacao limpa `product-engineering.md` / remove `production-requirements*` nos 4 runtimes, sem tocar o HOME real | smoke | `env -u OPENCODE_CONFIG_DIR -u XDG_CONFIG_HOME -u CLAUDE_CONFIG_DIR -u GEMINI_CONFIG_DIR -u CODEX_HOME HOME="$T" node up/bin/install.js --all --global` (HOME isolado em `mktemp -d`) | exit 0; `product-engineering.md` presente e `production-requirements*.md` ausente em `.claude/up`, `.gemini/up`, `.config/opencode/up` e `.codex/up`; VERSION gravado como `3.1.0`; HOME real conferido intacto (segue em 3.0.0) apos o teste |
| Instalador limpa instalacao existente com arquivos legados plantados | smoke | plantei `production-requirements.md`/`-compressed.md` num `.claude/up/references/` isolado e reinstalei | os dois arquivos legados desapareceram sozinhos (`copyDirWithReplace` reescreve `up/` inteiro) |

## Checklist de completude

- [x] O fluxo principal funciona? (plan escreve o formato novo; validate-plan e phase-plan-index leem; build tem o caminho inline documentado)
- [x] Nao foram introduzidas regressoes obvias? (`npm run test:up` 14/14 antes e depois)
- [x] A UI (aqui, a saida do CLI/JSON) segue o padrao do sistema? (mesmo formato de output das demais subcommands)
- [x] Validacoes existem? (`validate-plan` continua avisando por tamanho/tarefas, agora sem falso-negativo no formato novo)
- [ ] Empty state / loading / paginacao / mobile: nao aplicavel (mudanca e em workflows/CLI internos, sem UI de usuario final)

## Desvios do plano

- `[Regra 1]` Durante o `git commit --amend --no-edit` para corrigir a atribuicao ausente no primeiro commit (ver abaixo), o `git checkout HEAD~1 -- <path>` + amend acabou consolidando o hunk do `SKILL_MANIFEST` (renomeacao para `product-engineering`, entrega 4) dentro do commit `2daa4ab` (entrega 1), em vez de isolado no commit `b7ea94d` (entrega 4). Conteudo correto nos dois casos; so a fronteira exata do commit ficou levemente deslocada. Nao corrigido com novo amend para nao arriscar destruir trabalho ja em cima; registrado aqui para transparencia.
- `[Regra 3]` Bloqueio critico auto-causado e corrigido na hora: rodei `node up/bin/install.js --all --global` sem isolar `HOME` numa chamada Bash (o `mktemp -d` de uma chamada anterior nao sobreviveu para a chamada seguinte, e o ambiente tem `OPENCODE_CONFIG_DIR` fixado fora do `HOME`), sobrescrevendo `~/.claude/up`, `~/.gemini/up`, `~/.config/up-agents/opencode-hooks/shared/up` e `~/.codex/up` reais com o estado do worktree em edicao. Detectado imediatamente; reinstalei os 4 runtimes a partir de `/home/projects/up-cc` (branch `main`, limpa, commit `a9941c2`) para restaurar o estado publicado 3.0.0. Confirmado por diff (so `replacePaths`/VERSION, nenhum residuo do worktree) e por `ls` de `references/` (arquivos `production-requirements*.md` de volta, `product-engineering.md` ausente) nos 4 diretorios reais. Todo smoke de instalacao subsequente passou a isolar `HOME` **e** as 5 variaveis `*_CONFIG_DIR`/`XDG_CONFIG_HOME` na mesma chamada Bash.

## Issues adiados

- `up/README.md` (copia mais antiga, distinta do `README.md` da raiz, ja desatualizada desde a v3.0.0/UP leve) nao foi atualizado: o criterio de pronto do plano cita "README" no singular e o `README.md` da raiz e o publicado via `package.json` (`files` referencia `up/*` mas nao inclui `up/README.md`; o pacote npm e montado a partir da raiz). Fora do escopo desta fase; registrar se o dono quiser consolidar os dois READMEs numa fase futura.
- `up-arquiteto.md` referencia um subcomando hipotetico `roadmap next-unplanned-phase` em `up/workflows/plan.md` como conveniencia (com fallback textual explicito "sem esse subcomando disponivel, o ROADMAP.md diz"); o subcomando em si nao foi implementado por nao constar nas pistas do plano e nao ser estritamente necessario (o ROADMAP.md ja mostra status por fase). Se o dono achar o fallback manual insuficiente na pratica, vale um `/up:rapido` futuro.

## DECISOES ESCALADAS

Nenhuma.
