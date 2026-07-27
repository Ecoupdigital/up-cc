# Itens fora de escopo encontrados durante a fase 16

Descobertas fora do escopo dos planos, registradas em vez de corrigidas.

## 1. `npm test` ausente no package.json (pre-existente)

**Encontrado durante**: plano 001, tarefa 5 (regressao).

**Sintoma**: `npm test` sai com `npm error Missing script: "test"`. O `package.json` da raiz nao tem secao `scripts` com `test` (so ganhou `test:up` nesta fase). A documentacao do CLAUDE.md ainda cita `npm test` como corredor do GSD legado.

**Confirmado como pre-existente**: no commit de partida desta branch (`8e85c22`, fase 15 mergeada) o `package.json` ja nao tinha `"scripts"`. A suíte GSD em `tests/` e o `scripts/run-tests.cjs` tambem nao estao presentes neste worktree.

**Por que nao foi corrigido**: o plano 001 proibe alterar `"test"` e manda so acrescentar `test:up`. Inventar um corredor GSD fantasma estouraria o escopo e mentiria sobre a existencia da suíte.

## 2. `up-tools.cjs init <workflow>` nao reconhece `up` nem `auditar` (herdado)

Ja documentado em `.plano/fases/15-modo-grill/deferred-items.md` e fase 13. Nao reabrir.

## 3. Cinco comandos da familia `state *` nao casam com o formato v2 (herdado)

`advance-plan`, `update-progress`, `add-decision`, `record-metric`, `record-session`. Ja registrado. Nao reabrir.

## 4. `verify-static --all` falha no check `audit` por falta de package-lock (pre-existente)

**Encontrado durante**: plano 005, regressao.

**Sintoma**: `npm audit` sai com `ENOLOCK` / exit 1 porque nao ha `package-lock.json`. O overall de `verify-static --all` fica `fail` por causa do audit, nao da tautologia (que fica em `warn`).

**Confirmado pre-existente**: o repositorio nunca teve lockfile no package da raiz (so `package.json` sem dependencias de producao). A fase 16 nao removeu nem criou lockfile.

**Por que nao foi corrigido**: inventar package-lock so para o audit passar e fora do escopo PROVA. A heuristica de tautologia continua com status `warn` e overall do proprio `--tautologia` e `pass`.

## 5. Nunca geramos PLAN-READY com `plan_schema: 2` real e rodamos o build de ponta a ponta

**Encontrado durante**: avaliacao critica do executor (ponto 6) e rework da revisao.

**Sintoma**: a clausula de legado e os casos de schema 2 existem so em fixtures temporarias do
`gate.test.cjs`. O `.plano/PLAN-READY.md` deste repositorio e legado. Nao ha prova de fumaça do
workflow `/up:build` recusando um plano schema 2 sem seams e aceitando um schema 2 completo.

**Por que nao foi executado no rework**: a revisao marcou como divida declarada, sem executar.
**Encaminhamento sugerido**: em passe de dogfooding, gerar (em worktree temporaria) um
PLAN-READY com `plan_schema: 2` e uma fronteira valida, validar `gate plan-ready`, e um segundo
sem seams que o build V.1 bloqueie. Nao reescrever o PLAN-READY do ciclo 2 no repo principal.

## 6. Workflows instalados no HOME temporario nao foram greppados por `gate verdict`

**Encontrado durante**: avaliacao critica do executor (ponto 7) e rework da revisao.

**Sintoma**: a instalacao nos 4 runtimes passou (exit 0) e `seams.md` chegou a destinos, mas nao
houve grep pos-install nos workflows copiados para confirmar que o texto `gate verdict` esta no
artefato instalado (so no fonte `up/workflows/`).

**Por que nao foi executado no rework**: divida declarada pela revisao, sem executar.
**Encaminhamento sugerido**: no REG-02 de uma fase futura, apos
`HOME=$(mktemp -d) node up/bin/install.js --all --global`, grepar
`$HOME/.claude/up/workflows/{build,governance,plan}.md` por `gate verdict` e falhar se faltar.
