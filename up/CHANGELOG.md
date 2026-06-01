# Changelog

Todas as mudancas relevantes do `up-cc` ficam documentadas aqui. O formato segue
o espirito de [Keep a Changelog](https://keepachangelog.com/) e o versionamento
e [SemVer](https://semver.org/). v2.0.0 e um **major** (breaking change).

## 2.1.0

> GitHub e a interacao humana viram **eixos separados**. Antes, `--solo` desligava o
> GitHub (zero worktree/issue/PR) E pulava a cerimonia. Num run autonomo/loop isso fazia
> o projeto inteiro ir pro `main` sem nenhum artefato GitHub, mesmo com remote conectado.
> Agora `--solo` NAO desliga o GitHub: e so autonomia. Pra pular o GitHub use `--local`.

### Mudado (atencao: semantica de `--solo`)

- **`--solo` agora MANTEM o GitHub-nativo.** Solo virou "autonomo total": cria
  worktree + branch + issue + PR e auto-mergeia, SEM menu e SEM gate visual (pra
  loop/headless onde ninguem aprova). Nao desliga mais o GitHub.
- **`--local` e o novo escape hatch sem GitHub** (o comportamento que `--solo` tinha
  ate a 2.0.x): commit atomico na branch atual, zero worktree/issue/PR/rede. `/up:rapido`
  segue como o atalho nomeado pro mesmo modo.
- **`--auto`** continua igual: pula so o menu de fim de fase, mantem GitHub, e o gate
  visual ainda roda se `require_visual_test=true`.

### Adicionado

- **Deteccao de GitHub por `gh` CLI OU MCP do GitHub.** O eixo GitHub liga sempre que
  ha remote + (`gh` autenticado OU MCP do GitHub conectado). Transporte de issue/PR:
  `gh` (CLI cria direto), `mcp` (o workflow cria via `mcp__...github__*` e grava de
  volta), `none` (sem remote -> git local). Worktree/branch/push sao git local e
  acontecem sempre, offline-ok.
- **Subcomandos `github record-issue` / `github record-pr`** no `up-tools.cjs` pra
  gravar no `git-map.json` artefatos criados fora do `.cjs` (ex: via MCP). `record-pr
  --merged` fecha a fase e limpa worktree+branch.
- **Flag `--local`** no `/up:build` e `start-phase`/`finish-phase` (`--mode local`).
- **Config builder grava `github_native: true` explicito** (up-arquiteto, workflows/up),
  deixando a intencao visivel em run autonomo (antes dependia do default implicito).
- **Testes red-green** do `github.cjs` em `up/bin/lib/github.test.cjs` (10 casos; repo
  git temp + remote bare local + seam `UP_FORCE_NO_GH`).

### Corrigido

- **Bug de doc em `workflows/up.md`** que dizia `--solo (default, commit na branch atual)`
  e descrevia `--pr` como o fluxo GitHub (vocabulario v1). Era a unica fonte que podia
  induzir um agente autonomo a escolher `--solo` e pular o GitHub. Reescrito pro v2.
- **`--local` numa fase nao polui mais o `github_native` global** do `git-map.json`
  (poderia degradar fases nao-local seguintes). `finish-phase auto` passou a consultar
  o config, nao o flag global do mapa.

### Migracao

- Quem usava `--solo` pra **commit local sem GitHub** deve trocar para `--local`.
- Quem quer **autonomo mantendo GitHub** (loop/headless): use `--solo` (sem gate visual)
  ou `--auto` (com gate visual se `require_visual_test=true`).

## 2.0.0

> Redesign completo do UP. **Breaking change.** Os comandos antigos somem (nao ha
> shim fisico). Use os 7 comandos novos. Veja a tabela de migracao abaixo.

### Resumo

O UP v1 acertou a persistencia (`.plano/` que sobrevive a `/clear`) mas inchou:
52 agentes, 31 comandos, pipeline com 5 gates de LLM. Boa parte disso era
governanca de "modelo burro de 2024" (supervisor de IA pre-carregado). O v2 corta
a cerimonia interna e adota o padrao que vence em 2026: **a skill certa por
contexto + gates deterministicos + detectores que rodam o app de verdade**.

O default do dia a dia agora e o **modo rapido sem cerimonia** (commit atomico na
branch atual, zero worktree/issue/PR). O ritual (GitHub-native, board, brainstorm
full) e **opt-in**.

### Adicionado

- **Brainstorm-first com profundidade escalada por tamanho.** Antes de planejar, o
  UP discute. A profundidade e funcao do `classify-task` (deterministico, sem LLM
  pra decidir): trivial = 0 perguntas (anuncia e executa), pequena = 1 pergunta-chave
  via AskUserQuestion, media/grande = brainstorm full com aprovacao por secao.
- **Camada de skills + hook de ativacao.** Hook `SessionStart` injeta a skill
  `usando-up` no inicio da sessao (e apos `/clear`/`/compact`), ligando a
  auto-ativacao das skills certas por contexto em vez de carregar agentes
  especialistas pre-definidos. Aditivo e fail-open: se o hook falhar, a sessao segue.
- **GitHub-native por padrao (opt-in via `--pr`).** Fluxo worktree -> issue -> PR ->
  merge com `--pr`. Preferencia pela tool nativa `EnterWorktree` do harness, com
  fallback para `git worktree add`. `--auto` faz merge automatico quando CI verde e
  o verificador UP passa. No fim da fase, **menu de 4 opcoes** (merge local / abrir
  PR / deixa a branch / descarta), nunca PR-automatico. Modulo `github.cjs` sobre
  `execGit`, fail-open. Mapa de identidade em `.plano/git-map.json` (issue/pr por fase).
- **`--solo` como DEFAULT.** Commit atomico na branch atual, zero worktree, zero
  issue, zero PR, zero rede. Cobre ~70% do trabalho (fix, config, glue). GitHub e
  Multica so entram com flag explicita.
- **TDD por tipo de codigo.** A Iron Law e "evidencia fresca antes de afirmar
  pronto", nao "TDD unit universal". O gate exige a prova certa por tipo: logica/
  parser/calculo/API-propria/bugfix -> TDD red-green; UI/CSS -> prova visual
  antes/depois (via `up-tester`); glue/integracao -> smoke-test. O `classify-task`
  decide qual prova o gate cobra.
- **Multica `--board` (espelho de board opt-in).** Modulo `multica.cjs` (wrapper do
  CLI `multica`, deteccao de ambiente via `uname -s`: Mac prefixa `ssh server-ecoup`,
  VPS roda direto). Subcomando `up-tools.cjs multica` com 3 subverbos: `init`
  (cria project + issue-pai), `sync` (status batched + metadata por fase, com
  `--dry-run` de preview), `board` (imprime/abre a URL). Status batched no FIM da
  onda/fase (nao por microtransicao), **fail-open** (se o Multica estiver indisponivel,
  avisa e segue, nunca derruba o build). Identidade idempotente via metadata
  (`up_project`, `up_phase`, `gh_issue`, `branch`, `pr`) e campo `multica_issue` no
  `git-map.json`. So roda quando `--board` esta ligado. **Nao** ha stream ao vivo no
  fluxo local (so status no board: todo/in_progress/in_review/done/blocked). Loop
  reverso via webhook fica fora do v2.0 (bloqueado por feature do Multica).
- **Gate deterministico via `approvals.log`.** A aprovacao de fase/plano e registrada
  em arquivo (deterministico, auditavel), nao confiada a um agente supervisor.

### Mudado

- **Corte de agentes: 52 -> 12.** Specialists (frontend/backend/database) fundem no
  `up-executor`, que roteia dominio por **contexto** (carrega skill/ref sob demanda)
  em vez de 3 agentes pre-especializados. Os 3 detectores DCRV (`up-visual-critic` +
  `up-exhaustive-tester` + `up-api-tester`) fundem no novo `up-tester` multi-pass
  (visual + exhaustive + api via Playwright num spawn so). Governanca (CEO, chiefs,
  supervisores, auditores gold, code/security reviewer, blind-validator) colapsa em
  `up-revisor` two-stage + gate `approvals.log`. Clone deixa de ter agentes proprios
  (vira modo do mapeador + verificador). Os 12 finais: `up-arquiteto`, `up-planejador`,
  `up-executor`, `up-verificador`, `up-mapeador-codigo`, `up-depurador`,
  `up-pesquisador`, `up-revisor`, `up-auditor`, `up-sintetizador`, `up-roteirista`,
  `up-tester`. Build de 1 fase cai de ~8-12 spawns para ~3-4 (~3x menos).
- **Corte de comandos: 31 -> 7.** Regra dura: nenhum comando com mais de 3 subverbos.
  Acabou o comando de estado com 9 subverbos disfarcando complexidade.
- **`up-pesquisador`** funde pesquisa de projeto + pesquisa de mercado.
- **`up-sintetizador`** funde sintese de research + melhorias + ideias + requisitos
  (e a mesma operacao).
- **`up-auditor`** funde auditoria de UX + performance + modernidade num passe.

### Removido / Breaking

- **Os comandos antigos somem.** Nao ha shim fisico de compatibilidade. Use os 7
  novos. Tabela de migracao:

  | Comando(s) antigo(s) | Novo comando |
  |---|---|
  | `/up:novo-projeto`, `/up:iniciar`, `/up:modo-builder`, `/up:onboard`, `/up:progresso`, `/up:retomar`, `/up:pausar`, `/up:saude`, `/up:resetar`, `/up:mapear-codigo`, `/up:custos`, `/up:dashboard`, `/up:configurar`, `/up:ajuda`, `/up:atualizar`, `/up:remover-fase` | **`/up`** (porta unica; subverbos `estado`, `config`) |
  | `/up:discutir-fase`, `/up:planejar-fase` | **`/up:plan`** |
  | `/up:executar-fase`, `/up:executar-plano` | **`/up:build`** |
  | `/up:ux-tester`, `/up:mobile-first`, `/up:adicionar-testes`, `/up:verificar-trabalho` | **`/up:testar`** |
  | `/up:melhorias`, `/up:ideias` | **`/up:auditar`** |

  `/up:depurar` e `/up:rapido` permanecem (papel reforcado). Operacoes estruturais
  raras (remover/renumerar fase) viram `/up estado` interativo. O dashboard morreu:
  para ver o board e `--board`, que abre a URL do Multica.
- Removida a maquinaria de routing das antigas Waves 5-6 do `up-tools.cjs`
  (`analyze-routing`, `resolve-model-for-plan`, `routing-log`, `skill-manifest`).
  `classify-task` foi **mantido** (reaproveitado para escalar o brainstorm e escolher
  o tipo de prova de TDD). Default fixo: Opus planeja, Sonnet executa.
- Cap de rework reduzido de ate 6 rounds para 1 round (ganho de velocidade).

### Migracao do `.plano/` legado

Projetos com `.plano/` da v1 continuam validos. As chaves de routing das Waves 5-6
sao ignoradas (e podem ser removidas via `/up estado`). A estrutura de `STATE.md`,
`ROADMAP.md`, `PROJECT.md` e fases permanece compativel.
</content>
</invoke>
