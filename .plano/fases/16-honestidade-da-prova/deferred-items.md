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
