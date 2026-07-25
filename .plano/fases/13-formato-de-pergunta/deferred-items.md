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

## 4. `requirements mark-complete` não casa com o formato real de `REQUIREMENTS.md` (bug pré-existente, achado ao fechar a fase)

**Onde:** `up/bin/up-tools.cjs`, função `cmdRequirementsMarkComplete`.

**O que acontece:** o regex de checkbox exige o identificador em negrito markdown
(`` -\s*\[ \]\s*\*\*PERG-01\*\* ``), mas `.plano/REQUIREMENTS.md` escreve os itens sem negrito
(`- [ ] PERG-01: ...`). O regex da tabela de rastreabilidade procura a palavra inglesa `Pending` em
uma célula que contém só o identificador isolado entre pipes, mas as linhas reais usam `Pendente`
(português) e frequentemente agrupam vários identificadores numa faixa (`PERG-01 a PERG-06`), não um
por linha. Resultado: o comando roda sem erro, mas não marca nada.

```
$ node up/bin/up-tools.cjs requirements mark-complete PERG-01 PERG-02 PERG-03 PERG-04 PERG-05 PERG-06
{
  "marked": [],
  "count": 0
}
$ git diff --stat .plano/REQUIREMENTS.md
(vazio, nenhuma linha alterada)
```

**Por que não foi corrigido aqui:** exigiria editar `up/bin/up-tools.cjs`, fora de escopo pelo mesmo
motivo do item 1 (violaria o critério de aceite da tarefa 6 sobre diferença vazia em `up/bin`).

**Como contornei para fechar a fase:** marquei PERG-01 a PERG-06 manualmente em
`.plano/REQUIREMENTS.md` (checkbox e linha da tabela de rastreabilidade), por leitura e edição
direta, já que a ferramenta não fez o trabalho. REG-01, REG-02 e REG-03 foram deixados como estavam
(não marcados), porque são transversais às fases 13 a 20 ("verificado ao fim de cada uma das fases...
e não apenas no fechamento do ciclo"), não um item que fase 13 sozinha fecha em definitivo, e porque
o item 1 acima (`init up`) mostra que REG-01 hoje não está limpo mesmo dentro do escopo desta fase.

**Recomendação:** ajustar `cmdRequirementsMarkComplete` para casar o formato real do arquivo
(checkbox sem negrito, `Pendente`/`Completo` em português, células de tabela com faixa de
identificadores), fora deste ciclo de fase.

## 5. Comandos `state advance-plan`/`update-progress`/`add-decision`/`record-metric`/`record-session` não casam com o `STATE.md` real (bug pré-existente, achado ao fechar a fase)

**Onde:** `up/bin/up-tools.cjs`, funções `cmdStateAdvancePlan`, `cmdStateUpdateProgress`,
`cmdStateAddDecision`, `cmdStateRecordMetric`, `cmdStateRecordSession`.

**O que acontece:** essas funções procuram campos escalares no formato legado (`**Current Plan**:`,
`**Total Plans in Phase**:`, uma linha `**Progress**:` única, uma seção `### Performance Metrics`, uma
seção `### Session` com campos próprios). O `STATE.md` real deste projeto usa o template da UP v2:
`## Posicao Atual` com uma barra de progresso ASCII por fase (não um campo escalar único), `##
Metricas de Performance` como tabela livre, `### Decisoes` como tabela numerada mais uma lista solta,
sem os campos que as funções procuram. Resultado: todos os cinco comandos rodam sem erro, mas não
escrevem nada.

```
$ node up/bin/up-tools.cjs state advance-plan
{"error":"Cannot parse Current Plan or Total Plans in Phase from STATE.md"}
$ node up/bin/up-tools.cjs state update-progress
{"updated":false,"reason":"Progress field not found in STATE.md"}
$ node up/bin/up-tools.cjs state add-decision --phase 13 --summary "teste"
{"added":false,"reason":"Decisions section not found in STATE.md"}
$ node up/bin/up-tools.cjs state record-metric --phase 13 --plan 005 --duration 45 --tasks 7 --files 3
{"recorded":false,"reason":"Performance Metrics section not found in STATE.md"}
$ node up/bin/up-tools.cjs state record-session --stopped-at "teste"
{"recorded":false,"reason":"No session fields found in STATE.md"}
$ git diff --stat .plano/STATE.md
(vazio, nenhuma linha alterada por nenhum dos cinco comandos)
```

`roadmap update-plan-progress 13`, por comparação, **funciona** (casa com o formato real de
`ROADMAP.md` e atualizou a linha da fase 13 corretamente para `5/5`, `Complete`, `2026-07-25`).

**Por que não foi corrigido aqui:** mesma razão dos itens 1 e 4, fora de escopo (exigiria editar
`up/bin/up-tools.cjs`).

**Como contornei para fechar a fase:** atualizei `.plano/STATE.md` manualmente por leitura e edição
direta (posição atual, barra de progresso, métricas, decisões desta onda, continuidade de sessão),
preservando a estrutura e a convenção de texto já usada no arquivo.

**Recomendação:** portar essas cinco funções para o template real de `STATE.md` da UP v2 (o mesmo que
`roadmap update-plan-progress` já usa como referência de formato real), fora deste ciclo de fase.
