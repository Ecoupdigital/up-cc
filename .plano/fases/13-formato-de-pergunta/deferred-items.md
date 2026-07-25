# Itens adiados da fase 13 (formato de pergunta)

Descobertos durante a execução do plano 005 (prova e regressão zero). Nenhum item aqui foi
corrigido por este plano: são achados fora do escopo desta fase (contrato de pergunta e as sete
superfícies), registrados para tratamento em outro plano.

## 1. `init up` não existe no despachante de `up-tools.cjs` (bug pré-existente, severidade alta)

**Onde:** `up/workflows/up.md`, Passo 0 (`Carregar contexto`), linha `INIT=$(node
"$HOME/.claude/up/bin/up-tools.cjs" init up)`.

**O que acontece:** `up-tools.cjs` não tem um caso `up` no `switch (workflow)` de `init` (só
`planejar-fase, executar-fase, novo-projeto, rapido, retomar, operacao-fase, progresso,
verificar-trabalho, melhorias, ideias, iniciar`). Rodar `node up/bin/up-tools.cjs init up` falha
com:

```
Error: Unknown init workflow: up
Available: planejar-fase, executar-fase, novo-projeto, rapido, retomar, operacao-fase, progresso, verificar-trabalho, melhorias, ideias, iniciar
```

Como o Passo 0 de `up/workflows/up.md` roda esse comando incondicionalmente, **toda invocação de
`/up:up` (a porta única) provavelmente falha antes de qualquer outra lógica do roteador**, inclusive
a chamada sem argumento nenhum que deveria só continuar de onde o dono parou.

**Prova de que é pré-existente, não introduzido pela fase 13:**

```
$ git show 8d06348c625cc541e9fb9dcd608149bb5035ad43:up/workflows/up.md | grep -n 'up-tools.cjs" init'
35:INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init up)
$ git show 8d06348c625cc541e9fb9dcd608149bb5035ad43:up/bin/up-tools.cjs | grep -n "Unknown init workflow"
218:          error(`Unknown init workflow: ${workflow}\n...`)
$ git diff --name-only 8d06348c625cc541e9fb9dcd608149bb5035ad43..HEAD -- up/bin/up-tools.cjs
(vazio, up-tools.cjs não foi tocado por nenhum plano desta fase)
```

`8d06348` é o commit em que o `/up:plan` do ciclo 2 foi concluído, anterior ao primeiro commit da
fase 13 (`69c10f0`). O bug já existia ali, herdado de quando `up/workflows/up.md` absorveu
`iniciar.md`/`progresso.md`/`retomar.md` no redesenho v2 e ninguém acrescentou o caso `up` ao
despachante.

**Por que não foi corrigido aqui:** corrigir exigiria editar `up/bin/up-tools.cjs`, o que viola o
critério de aceite explícito da tarefa 6 deste plano ("a diferença em `up/bin` fora do verificador é
vazia") e o escopo declarado do plano 005 (prova do contrato de pergunta e regressão zero, não
manutenção do despachante de `init`). É também um bug de mecânica do roteador, sem nenhuma relação
com formato de pergunta, recomendação ou regra de fato.

**Recomendação:** tratar com prioridade alta fora deste ciclo de fase, antes de qualquer sessão real
usar `/up:up` sem argumento. O conserto provável é um caso `case 'up':` no despachante que devolva o
mesmo formato hoje produzido por `cmdInitIniciar` (ou um novo `cmdInitUp` dedicado), já que os campos
que o Passo 0 espera (`project_exists, planning_exists, state_exists, roadmap_exists,
has_existing_code, has_codebase_map, has_git, project_path`) parecem ser um subconjunto do que
`cmdInitIniciar` já calcula.

## 2. Índice de planos não reconhece a convenção de nome da fase 11 (já conhecido, não reproduzível nesta worktree)

Citado no próprio texto da tarefa 6 do plano 005 como observação conhecida. Tentei reproduzir
rodando `node up/bin/up-tools.cjs phase-plan-index 11` nesta worktree: devolveu `{"phase":"11",
"error":"Phase not found", ...}`, mas por um motivo diferente do que eu esperava confirmar. A pasta
`.plano/fases/11-suporte-grok-build/` não existe nem nesta worktree nem em `origin/main`
(`git ls-tree -r --name-only origin/main -- .plano/fases/` lista fases 03 a 10, nenhuma 11 em
diante): os artefatos de planejamento da fase 11 nunca foram commitados em nenhum branch, ficaram
como arquivos não rastreados no worktree principal (`?? .plano/fases/11-suporte-grok-build/` no
`git status` do repositório principal, fora desta worktree). Por isso não consigo confirmar aqui, por
leitura direta, a alegação específica de incompatibilidade de nomenclatura da fase 11; só consigo
confirmar que `phase-plan-index 11` falha nesta worktree, por ausência do diretório, no mínimo.
Mantenho o registro como observação conhecida (não corrigida, fora de escopo, coberta por
PLANO-13/fase 17), sem reivindicar prova direta da causa exata.

## 3. Pareamento de resumo falha na fase 3 (já conhecido, confirmado nesta worktree)

```
$ ls .plano/fases/03-templates-formatos-padrao/
001-PLAN.md  03-001-SUMMARY.md  03-VERIFICATION.md
$ node up/bin/up-tools.cjs phase-plan-index 3
{
  "phase": "03",
  "plans": [{ "id": "001", "wave": 1, ..., "has_summary": false }],
  ...
}
```

O resumo existe em disco (`03-001-SUMMARY.md`), mas com o prefixo `03-` que o indexador não espera
para casar com o plano `001-PLAN.md`; por isso `has_summary` sai `false` para um plano que na verdade
tem resumo. Confirmado nesta worktree. Mesma origem do item 2: convenção de nome de plano/resumo em
duas formas no repositório (`NNN-PLAN.md`/`NNN-SUMMARY.md` nesta fase, `NNN-PLAN.md`/`FF-NNN-SUMMARY.md`
em fases antigas). Coberto pelo requisito PLANO-13, fase 17. Não corrigido aqui.
