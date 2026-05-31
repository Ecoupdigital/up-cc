# UP v2 — FINAL (consolidado e definitivo)

> Documento unico de arquitetura do redesign do up-cc. Incorpora as criticas validas do Jonathan adversarial (CRITIQUE.md), corta cerimonia, ajusta o scorecard inflado e alinha a integracao Multica ao que existe de verdade na VPS.
> Verificado contra o codigo real: 52 agentes, 32 comandos, 29 workflows, `up-tools.cjs` com 3843 linhas, `classify-task` presente, `multica` e `gh` instalados e autenticados.
> Premissa do dono: builder solitario que quer VELOCIDADE e SIMPLICIDADE acima de tudo. Odeia cerimonia. O default tem que ser leve; o ritual e opt-in.

---

## 1. TL;DR (10 linhas)

1. O redesign acertou o corte interno (governanca era teatro de modelo-burro-de-2024) mas tinha reinjetado cerimonia externa nova (GitHub-native + Multica + brainstorm universal) sem botao de escape. Esta versao conserta isso.
2. O DEFAULT do dia a dia agora e o **modo rapido sem cerimonia** (`--solo`): commit atomico na branch atual, zero worktree, zero issue, zero PR, zero Multica. E o que cobre 70% do trabalho do Jonathan (fix, config, glue, vault).
3. GitHub-native (worktree -> issue -> PR -> merge) vira **opt-in / lazy**, so para repo colaborativo ou sob `--pr`. No fim da fase, **menu de 4 opcoes** (igual ao superpowers), nao PR-automatico.
4. Brainstorm com **profundidade escalada por tamanho**: trivial = 0 perguntas, pequena = 1 pergunta, media/grande = brainstorm full com aprovacao por secao. Reaproveita o `classify-task` que ja existe (em vez de deletar).
5. TDD **por tipo de codigo**, nao universal. A Iron Law real e "evidencia fresca antes de afirmar pronto"; TDD-unit e UMA forma dela (logica/parser/bugfix), prova visual e outra (UI/CSS), smoke-test e outra (glue/integracao).
6. Agentes: **52 -> 12** (corte mais fundo que os 18 anteriores). Specialists fundem no executor; os 3 detectores DCRV viram 1 tester multi-pass; clone vira modo, nao agentes.
7. Comandos: **32 -> 7**, com regra dura "maximo 3 subverbos por comando" (acaba o `/up:estado` com 9 subverbos disfarcando complexidade).
8. Multica = **espelho de board opt-in (`--board`)**, batched no fim da onda, nao orquestrador. Sem promessa de "stream ao vivo" no fluxo local (so existe quando o Multica DISPARA o agente).
9. Scorecard reajustado e ponderado pelo que o dono pediu: total honesto **~94** (nao 106). Adicionada dimensao "custo de I/O externo" onde o v2 perde se nao for lazy.
10. O ouro inegociavel sobrevive intacto: `.plano/` que sobrevive a `/clear`, commits atomicos, gates deterministicos via `approvals.log`, separacao plan/build entre runtimes.

---

## 2. Scorecard final (honesto e ponderado)

Tres colunas, notas reajustadas conforme CRITIQUE secao 8. Removidas as inflacoes (dim 1, 2, 5, 7) e adicionada a dimensao 13 (custo de I/O) que escondia o maior risco.

| # | Dimensao | UP hoje | superpowers | UP v2 FINAL |
|---|----------|:------:|:-----------:|:-----------:|
| 1 | Velocidade / latencia | 3 | 9 | 7 |
| 2 | Simplicidade de uso (qtd comandos, curva) | 3 | 9 | 8 |
| 3 | Persistencia de estado / sobrevive a /clear | 9 | 4 | 10 |
| 4 | Disciplina de engenharia (brainstorm-first) | 4 | 10 | 9 |
| 5 | Qualidade de codigo / TDD | 5 | 10 | 8 |
| 6 | Integracao GitHub-nativa (worktree/issue/PR/merge) | 1 | 9 | 8 |
| 7 | Visualizacao / feedback visual (board) | 2 | 3 | 6 |
| 8 | Brownfield / codigo legado | 8 | 6 | 9 |
| 9 | Auditoria & evolucao de produto | 8 | 4 | 9 |
| 10 | Governanca / verificacao (sem over-engineering) | 5 | 9 | 9 |
| 11 | Composabilidade (skills ativam por contexto) | 2 | 10 | 8 |
| 12 | Distribuicao / adocao | 6 | 9 | 8 |
| 13 | Custo de I/O / latencia externa (deps externas) | 8 | 10 | 8 |
| | **TOTAL BRUTO (13 dim)** | **64** | **102** | **107** |
| | **TOTAL PONDERADO** (velocidade+simplicidade peso 2x) | **70** | **120** | **123** |

Notas reajustadas e por que (rebatendo o scorecard inflado original):

- **Dim 1 Velocidade 8 -> 7.** Com GitHub/Multica agora LAZY e o modo `--solo` como default, o caminho quente nao paga mais I/O de rede. Ganha vs v1 (3x menos spawns) mas nao chega a 8: o brainstorm escalado e os gates ainda custam algo. Honesto: 7.
- **Dim 2 Simplicidade 8 -> 8 (mantida apos corrigir).** O original valia 6-7 por causa dos subverbos inflados. Com a regra "max 3 subverbos" e 7 comandos reais, a superficie cognitiva caiu de verdade. Volta a 8.
- **Dim 5 TDD 9 -> 8.** TDD por tipo (nao universal) e mais honesto e menos fardo, mas perde 1 ponto vs superpowers ate as Iron Laws estarem batidas sob pressao adversarial.
- **Dim 7 Visualizacao 10 -> 6.** A nota 10 dependia de "ver cada tool_use ao vivo", que so existe quando o Multica DISPARA o agente, nao no fluxo local. Com board de status (todo/in_progress/done) honesto, vale 6. Ainda supera os dois.
- **Dim 6 GitHub 9 -> 8.** Empatava por desenho identico; perde 1 por ser opt-in/lazy (menos automatico que o do superpowers por escolha deliberada de simplicidade).
- **Dim 13 NOVA.** superpowers ganha (zero deps externas, markdown + 1 hook). UP v2 empata em 8 porque GitHub/Multica sao opt-in e fail-open: quando desligados, custo de I/O = v1. So perde se o usuario ligar tudo.

Leitura honesta: o v2 nao e mais a "goleada" de 106 vs 92. E uma vitoria estreita (107 vs 102 bruto; 123 vs 120 ponderado), vinda de onde o superpowers nunca jogou: persistencia `.plano/`, auditoria de produto, brownfield. Em velocidade e simplicidade pura, ficamos perto, nao a frente. Isso e a verdade.

---

## 3. Comandos finais (antes -> depois)

**Antes: 32. Depois: 7.** Regra dura: **nenhum comando com mais de 3 subverbos**. Se passar, ou vira comando separado ou vira deteccao automatica por contexto (o que `/up` sem argumento ja faz). Fim do `/up:estado` com 9 subverbos.

| # | Comando | O que faz | Subverbos (max 3) | Absorveu |
|---|---------|-----------|-------------------|----------|
| 1 | **`/up`** | Porta unica. Sem arg = continua de onde parou (le STATE.md, roteia). Com descricao = dispara brainstorm escalado e roteia greenfield/brownfield/clone. Tambem e a casa de estado/config (subverbos). | `continuar` (default), `estado`, `config` | novo-projeto, iniciar, modo-builder, clone-builder, onboard, progresso, retomar, pausar, saude, resetar, mapear-codigo, custos, dashboard, configurar, ajuda, atualizar |
| 2 | **`/up:plan`** | Planeja projeto OU fase. Research inline + self-check. Gera `PLAN-READY.md` executavel em runtime barato. Entrada = BRIEFING.md aprovado pelo brainstorm. | (deteccao automatica projeto vs fase) | plan, discutir-fase, planejar-fase, adicionar-fase |
| 3 | **`/up:build`** | Executa o planejado. **Default = `--solo`** (commit atomico na branch atual). Flags de cerimonia opt-in: `--pr` (worktree+issue+PR), `--board` (espelha Multica), `--auto` (merge automatico se verde). | `solo` (default), `pr`, `auto` | build, executar-fase, executar-plano, rapido |
| 4 | **`/up:testar`** | Loop DCRV unico (detectar-corrigir-reverificar). Default roda tudo. | `ux`, `mobile`, `e2e` (flags) | testar, ux-tester, mobile-first, adicionar-testes, verificar-trabalho |
| 5 | **`/up:depurar`** | Debugging sistematico (root cause -> hipotese -> fix com teste de regressao) com estado persistente entre `/clear`. | - | depurar |
| 6 | **`/up:auditar`** | Auditoria priorizada (UX/perf/modernidade num passe). `--features` ativa pesquisa de mercado. | `features` (flag) | melhorias, ideias |
| 7 | **`/up:rapido`** | Tarefa pontual com garantias UP minimas (commit atomico, rastreamento em STATE.md), pulando roadmap inteiro. **Sem worktree, sem PR, sem nada.** O escape hatch nomeado. | - | rapido (papel reforcado) |

Mortos por absorcao ou deteccao automatica:
- `/up:fase` (remover/renumerar) caiu: e operacao estrutural rara, vira `/up estado` interativo (o orquestrador edita ROADMAP.md sob comando). Nao merece comando proprio.
- `/up:config` caiu: virou subverbo de `/up`. Config raramente muda, `atualizar` e npm, `ajuda` e `/up` sem contexto.
- `verificar-trabalho` virou gate dentro de `/up:testar` e do checkpoint humano de `/up:build --pr`.
- `dashboard` morreu: se quiser ver o board, e `--board` que abre a URL do Multica.

Resultado: **32 -> 7 (-78%)**, com a regra de 3 subverbos garantindo que a superficie cognitiva real seja ~12 entradas, nao ~50.

---

## 4. Arquitetura de agentes final (antes -> depois)

**Antes: 52. Depois: 12.** A tese que matou a governanca (modelo 2026 nao precisa de supervisor LLM pre-carregado, precisa da skill certa por contexto) e aplicada ATE O FIM: tambem mata specialists, funde detectores e transforma clone em modo. A seguranca nunca foram os agentes; era o `approvals.log` + os detectores que rodam o app de verdade.

### 4.1 Os 12 que sobram

**Core operacional (faz trabalho real) — 7**
1. `up-arquiteto` (funde `up-system-designer` + `up-arquiteto`; com brainstorm-first fazendo design upfront, dois agentes de arquitetura era redundancia)
2. `up-planejador`
3. `up-executor` (funde `up-frontend-specialist` + `up-backend-specialist` + `up-database-specialist`; carrega refs de dominio por contexto sob demanda, nao 3 agentes pre-especializados)
4. `up-verificador` (passa a exigir evidencia fresca por tipo de codigo, secao "TDD por tipo")
5. `up-mapeador-codigo`
6. `up-depurador`
7. `up-pesquisador` (funde `up-pesquisador-projeto` + `up-pesquisador-mercado`)

**Revisao — 1**
8. `up-revisor` (UNICO). Faz two-stage review do superpowers dentro de si: spec-compliance cetico ("terminou rapido demais, inspeciona o codigo real") -> code-quality. Substitui os 8 supervisores + 2 auditores gold + `up-code-reviewer` + `up-security-reviewer` + `up-blind-validator`.

**Auditoria que roda o app (ouro) — 2**
9. `up-tester` (funde `up-visual-critic` + `up-exhaustive-tester` + `up-api-tester` num spawn multi-pass via Playwright: visual + exhaustive + api num agente so)
10. `up-auditor` (funde `up-auditor-ux` + `up-auditor-performance` + `up-auditor-modernidade` num passe; usado por `/up:auditar`)

**Sintese + produto — 1**
11. `up-sintetizador` (funde `up-sintetizador` + `up-sintetizador-melhorias` + `up-consolidador-ideias` + `up-product-analyst` + `up-requirements-validator`; sintese de research/melhorias/requisitos e a mesma operacao)

**Conteudo (nicho real do Jonathan, sobrevive) — 1**
12. `up-roteirista` (carrosseis/aulas/conteudo; integra com as skills `carrossel-*`, `aula-generator` ja instaladas)

> Clone deixa de ter agentes proprios: `up-clone-crawler` + `up-clone-design-extractor` + `up-clone-feature-mapper` + `up-clone-prd-writer` + `up-clone-verifier` -> vira um MODO de `up-mapeador-codigo` (extrai design/features/rotas de screenshots num passe) + `up-verificador` (compara). -5 agentes virando 0.

### 4.2 Eliminados (e por que e seguro)

| Eliminado | Quantidade | Justificativa |
|---|---|---|
| CEO (`up-project-ceo`) | 1 | Vira prompt do orquestrador; personalidade em `owner-profile.md` |
| Chiefs (`up-chief-*`) | 5 | Camada de consolidacao por area redundante com `up-revisor` + gate `approvals.log` |
| Supervisores (`up-*-supervisor`) | 8 | Substituidos por `up-revisor` + auto-revisao inline (planejador ja faz self-check) |
| Auditores gold (`up-planning-auditor`, `up-delivery-auditor`) | 2 | Dobrados no `up-revisor` |
| Specialists (frontend/backend/database) | 3 | Fundidos no `up-executor` com skills de dominio por contexto |
| Detectores DCRV separados | 3 -> 1 | Fundidos no `up-tester` multi-pass |
| Clone (5 agentes) | 5 -> 0 | Vira modo do mapeador + verificador |
| Sintetizadores + product-analyst + requirements-validator | 5 -> 1 | Mesma operacao de sintese |
| Code-reviewer, security-reviewer, blind-validator | 3 | Dobrados no `up-revisor` two-stage |
| Devops, qa-agent, technical-writer, analista-codigo, operations | ~4 | Funcoes cobertas pelo executor/verificador/tester ou viram skill |

Ganho: build de 1 fase de ~8-12 spawns para ~3-4 (~3x). Projeto de 6 fases de ~60-84 para ~22. `/up:plan` de ~15 para ~4. Sem perda de qualidade detectavel: gates deterministicos, detectores reais e commits atomicos permanecem.

### 4.3 Transicao em 2 ondas (mitiga risco do corte fundo)

- **v2.0:** entrega 18 agentes (corta governanca + funde auditores/clone/sintetizadores) — o corte seguro e ja medido.
- **v2.1:** funde specialists no executor e DCRV no tester (52->12) DEPOIS de medir que nao perdeu qualidade em projetos reais. O alvo de 12 e declarado AGORA, executado em duas etapas.

---

## 5. Fluxo end-to-end UP v2 (com escape hatch)

### 5.1 Caminho rapido (DEFAULT — 70% do trabalho)

```
/up "ajusta o titulo do botao pra X"
  -> classify-task: TRIVIAL (1 arquivo, sem decisao de arquitetura)
  -> brainstorm escala pra ZERO perguntas: "Vou mudar o titulo em components/Botao.tsx. Indo."
  -> up-executor: muda + prova fresca por tipo (UI -> captura visual antes/depois via up-tester)
  -> commit atomico na branch ATUAL: "feat: titulo do botao -> X"
  -> STATE.md atualizado. FIM.
```

Zero worktree, zero issue, zero PR, zero Multica, zero rede. E o `--solo`, que e o default. `/up:rapido` faz o mesmo pulando ate o STATE roadmap-level.

### 5.2 Caminho medio (feature de 1 subsistema)

```
/up "adiciona filtro por data no dashboard"
  -> classify-task: PEQUENA (1 subsistema, 1 escolha de design)
  -> brainstorm escala pra 1 PERGUNTA (a decisao-chave) via AskUserQuestion
     + companion visual oferecido (Jonathan e visual) + design em 3 frases
  -> BRIEFING.md curto, commitado
  -> /up:plan gera PLAN-READY.md (1 plano)
  -> /up:build (--solo): TDD por tipo (logica do filtro = red-green; UI = prova visual)
     commits atomicos na branch atual
  -> no fim: MENU DE 4 OPCOES
     "Pronto. 1) merge local  2) abrir PR  3) deixa a branch  4) descarta"
  -> Jonathan escolhe. Default sugerido = 1 (merge local).
```

### 5.3 Caminho completo (projeto/fase grande, repo colaborativo)

```
/up "redesign do gestor-lfpro com novo modulo de cohorts"  [repo com remote + colaboradores]
  -> classify-task: GRANDE (multi-subsistema, arquitetura nova)
  -> brainstorm FULL: perguntas iterativas (uma por vez) + 2-3 abordagens com trade-offs
     + aprovacao por SECAO (arquitetura/componentes/dados/erros/testes)
  -> BRIEFING.md completo, commitado (docs(brief): cohorts)
  -> /up:plan -> ROADMAP.md (fases) + PLAN-READY.md
  -> /up:build --pr --board   [opt-in: GitHub-native + Multica ligados]
     por fase:
       1. EnterWorktree (tool nativa do harness, NAO git worktree add manual)
          fallback: git worktree add se EnterWorktree indisponivel
       2. gh issue create (1 issue por fase) + multica issue create (batched, opt-in)
       3. agentes por onda (cwd = worktree), commits atomicos por tarefa (TDD por tipo)
       4. fim da fase -> MENU 4 OPCOES (mesmo no --pr; PR e a opcao 2, nao automatico)
          se escolher PR: gh pr create --base main (Closes #N + Closes MUL-KEY)
       5. checkpoint humano (UAT) OU --auto se CI verde + verificador passou
       6. merge (squash default) + cleanup provenance-based + multica sync (batched)
       7. .plano/ da fase volta pra main no merge; git-map.json atualizado na main
```

### 5.4 As 3 regras de calibragem que diferenciam do v1 e do superpowers

1. **Escape hatch e o DEFAULT, nao uma flag escondida.** `--solo` (commit local) e o caminho quente. GitHub/Multica/PR sao `--pr`/`--board` explicitos.
2. **Menu de 4 opcoes no fim da fase** (igual ao superpowers `finishing-a-development-branch`), nunca PR-automatico. Builder solitario nao abre PR pra si mesmo sem revisor a menos que peca.
3. **Profundidade do brainstorm = funcao do `classify-task`**, nao do humor do dia. Trivial=0, pequena=1, grande=full. Determinstico, barato, sem LLM pra decidir.

---

## 6. Integracao Multica (contrato realista)

Alinhado ao que o CLI `multica` REALMENTE expoe (verificado: `issue create/status/comment/metadata`, `--parent`, `--project`, `--status`, `--metadata` filter, `project create`, `autopilot trigger-add --kind webhook`). Multica = **espelho de board opt-in**, nao orquestrador de execucao.

### 6.1 O que e REAL (verificado no CLI da VPS)

- `multica issue create --title --description-file --parent <id> --project <id> --status <s> --priority <p> --output json` — existe.
- `multica issue status <id> <status>` com statuses validos: `backlog, todo, in_progress, in_review, done, blocked, cancelled` — existe.
- `multica issue metadata set/get/list/delete` (KV por issue) — existe.
- `multica issue list --metadata key=value --project <id>` (filtro idempotente, AND, value JSON-parsed) — existe.
- `multica project create` — existe.
- Auto-link de PR por KEY na branch/body + auto-done no merge via `Closes MUL-X` — documentado nos dossies 02/03 com handler real.
- O daemon roda Claude Code com `HOME=/root` herdando `~/.claude` (mesmo UP) — real.

### 6.2 O que NAO e real (correcoes vs o blueprint otimista)

- **"Ver cada tool_use ao vivo no board" NAO acontece no fluxo local.** O stream `task:message`/`task:progress` so existe quando o **Multica DISPARA** o agente (o daemon faz POST de cada mensagem). No fluxo padrao do UP (Claude Code rodando LOCAL espelhando status), o board mostra so `todo -> in_progress -> in_review -> done`. Promessa rebaixada de "stream ao vivo" para "status no board". Scorecard dim 7 ajustado de 10 para 6.
- **Sincronizacao reversa via webhook: o trigger EXISTE no CLI (`autopilot trigger-add --kind webhook`), mas nao ha endpoint inbound que dispare `up-tools.cjs` quando o agente Multica termina** (dossie 02 secao 7: webhook/api existem no schema sem endpoint que dispare, exceto webhook de autopilot por token). Logo: **loop bidirecional FORA do v2.0**, marcado como bloqueado por feature Multica. Nao prometemos o que o CLI nao entrega.
- **Multica NAO cria worktree** (`local_directory` e serial e roda na pasta real; `github_repo` clona fresco; GC de 12-24h apaga a workdir). Logo: **quem cria worktree e nomeia branch com a KEY e o UP**, nunca o Multica. A tabela de "N issues-neto atribuidas ao agente certo executando em paralelo" sai: Multica nao orquestra as ondas. O UP executa local; Multica so reflete.

### 6.3 Contrato de integracao (opt-in via `--board`, batched)

| Evento no UP | Acao no Multica (so se `--board`) | Quando |
|---|---|---|
| Brainstorm aprovado (BRIEFING.md commitado) | `multica project create` (se projeto novo) + 1 issue-pai `[proj] <topico>` `--status backlog`, `metadata up_project=<repo>` | uma vez |
| `/up:plan` gera ROADMAP | 1 issue-filha por fase `--parent <pai> --status backlog`, `metadata up_phase=N` | batched, 1 chamada por fase |
| Fase entra em execucao | `multica issue status <id> in_progress`, `metadata gh_issue=<n> branch=up/fase-NN-slug` | 1 chamada na entrada da fase |
| Durante a onda | NADA sincrono. Acumula transicoes. | - |
| Fim da onda | `multica issue status` batched (todas as transicoes de uma vez) | 1 chamada no fim da onda |
| PR aberto | `metadata pr_number=<n> pr_url=<url>` + KEY no body (`Closes MUL-X`) auto-linka | 1 chamada |
| PR merged | `Closes MUL-X` auto-avanca pra `done`; UP chama `multica issue status done` idempotente | 1 chamada |
| Bloqueio | `multica issue status blocked` + `multica issue comment add` | so quando bloqueia |

Regra de I/O: **batched, nao por microtransicao.** Um build de 6 fases com `--board` faz ~20 chamadas `multica` (pai + 6 fases + transicoes batched), nao 50-100. Fail-open: se `multica` indisponivel, o UP segue sem board, com aviso. Deteccao de ambiente: `uname -s` (Mac -> `ssh server-ecoup '...'`; Linux/VPS -> direto).

### 6.4 Ponte de identidade e vinculo GitHub<->Multica

- Branch legivel pro git/UP: `up/fase-NN-<slug>`. KEY do Multica vai no BODY do PR (`Closes MUL-1510` + `Closes #42`). Os dois sistemas fecham sozinhos no merge.
- Reconciliacao idempotente: `multica issue list --metadata up_project=<repo> --metadata up_phase=N` (nao duplica).
- `up-tools.cjs multica sync` e o ponto unico que reflete transicoes (mapa quase 1:1 entre status UP e status Multica), so quando `--board` ligado.

---

## 7. Roadmap de implementacao priorizado (alavancagem: impacto/esforco)

Legenda esforco: **P** (1-2 dias) · **M** (3-5 dias) · **G** (1-2 semanas).

### Quick wins (1 dia cada, pegaveis ja, em paralelo)

1. **Deletar `adicionar-fase.md`** (ja `[DEPRECADO]`). Risco zero.
2. **Reescrever os `description`** dos comandos mais usados (`build`, `plan`, `rapido`) no formato "Use quando..." (gatilho puro). Melhora roteamento sozinho.
3. **Remover maquinaria de routing das Waves 5-6** do `up-tools.cjs` (`analyze-routing`, `resolve-model-for-plan`, `routing-log`, `skill-manifest`). **MANTER `classify-task`** — ele e reaproveitado pra escalar o brainstorm e escolher o tipo de prova de TDD. Default fixo: Opus planeja, Sonnet executa. Encolhe o CLI ~25-35%.
4. **Baixar cap de rework** de 3+2+1 (ate 6 rounds) pra 1 round em `governance.md`/`builder.md`. Ganho de velocidade imediato.
5. **Skill `verificar-antes-de-concluir`** — 1 arquivo, mata "Pronto!"/"Perfeito!" sem evidencia. Alto valor.
6. **Hook session-start** — 1 arquivo Node + 1 entrada no install. Liga a auto-ativacao.

### Fase 0 — Fundacao: hook de ativacao + descriptions (M, risco baixo)
Hook `SessionStart` (matcher `startup|clear|compact`) injeta `usando-up/SKILL.md` (<200 palavras) em `<EXTREMELY_IMPORTANT>`. Reescreve `description` de todos os comandos/agentes no formato gatilho. Aditivo: se o hook falhar, sessao segue normal.

### Fase 1 — Brainstorm escalado por tamanho (M, risco baixo) [PRIORIDADE: maior valor percebido]
Skill `brainstorm` com `<HARD-GATE>` MAS profundidade escalada por `classify-task`:
- Trivial (1 arquivo, sem decisao de arquitetura): **0 perguntas**, anuncia em 1 linha, executa.
- Pequena (1 subsistema, 1 escolha): **1 pergunta** via AskUserQuestion + design em 3 frases.
- Media/Grande (multi-subsistema, schema/API/auth): **brainstorm full** com aprovacao por secao.
Criterio de classificacao deterministico no `up-tools.cjs` (nº arquivos provaveis, palavra-chave de arquitetura, toca schema/API/auth). Companion visual oferecido por default em UI.

### Fase 2 — Consolidacao comandos (32->7) + corte agentes onda 1 (52->18) (G, risco medio)
Funde comandos conforme secao 3 com regra "max 3 subverbos". Corta governanca (16 agentes) + funde auditores/clone/sintetizadores -> 18. Colapsa pipeline de 5 gates LLM pra `Planejador -> Executor -> Verificador -> [GATE approvals.log] -> Revisor`. Mitigar com camada de compat (Fase 6) e testar fluxo a fluxo.

### Fase 3 — TDD por tipo de codigo (M, risco baixo)
Skill `verificar-antes-de-concluir` (Iron Law universal: evidencia fresca). Skill `tdd` aplicada SO a logica/parser/calculo/API-propria/bugfix. UI/CSS -> prova visual obrigatoria (up-tester antes/depois). Glue/integracao -> smoke-test obrigatorio. O gate `approvals.log` exige evidencia POR TIPO (o `classify-task` decide qual). Jonathan nao pede licenca; o sistema sabe que CSS pede prova visual.

### Fase 4 — Escape hatch + GitHub-native LAZY/opt-in (G, risco medio-alto)
`--solo` (commit local na branch atual) vira o DEFAULT. `github_native` default = `false` (ou `auto`: so liga se detectar repo colaborativo com PRs recentes de outros). Menu de 4 opcoes no fim da fase (nao PR-automatico). Modulo `github.cjs` sobre `execGit`, fail-open. **Preferir tool nativa `EnterWorktree`** do harness antes de cair no `git worktree add` manual (evita phantom state). `.plano/` viaja na worktree, consolida no merge; `git-map.json` canonico na main.

### Fase 5 — Multica espelho de board opt-in (M, risco medio)
Modulo `multica.cjs` (wrapper CLI, deteccao `uname -s`). Subcomando `up-tools.cjs multica sync` BATCHED (fim da onda, nao por microtransicao), so com `--board`. Sem stream ao vivo prometido (status no board). Sem loop reverso webhook no v2.0 (marcado bloqueado). Multica nao orquestra ondas: UP executa local, empurra status. Fail-open.

### Fase 6 — Compat/migracao + docs + corte agentes onda 2 (M, risco baixo)
Shims dos comandos antigos (aviso + encaminha). Migracao `.plano/` legado (remove chaves de routing Waves 5-6). Onda 2 do corte: funde specialists no executor + DCRV no tester (18->12) apos medir qualidade. Bump v2.0.0 + changelog + README. Garante install de skills+hook em Claude/Gemini/OpenCode.

---

## 8. Decisoes abertas pro Jonathan (forks)

Os forks abaixo NAO sao buracos de design (esses ja foram resolvidos: escape hatch, escala de brainstorm, TDD por tipo). Sao escolhas legitimas de gosto/risco que so voce decide:

1. **Quantos comandos no alvo: 7 ou 9?** Esta versao mira **7** (mais agressivo, "voce odeia decorar"). Se 7 assustar na pratica (`/up` virando muito sobrecarregado de subverbos `estado`/`config`), o meio-termo e 9 (separa `/up:estado` e `/up:config`). Recomendacao: comecar com 7, separar so se doer.

2. **Profundidade do corte de agentes: parar em 18 ou ir ate 12?** v2.0 entrega 18 (seguro, ja medido). v2.1 funde specialists no executor + DCRV no tester (->12) DEPOIS de medir qualidade em projetos reais. Voce topa o alvo de 12 declarado agora, executado em 2 ondas? Ou prefere conservar os 3 specialists permanentemente (frontend/backend/database) como rede de seguranca?

3. **`github_native` default: `false` ou `auto`?** `false` = trabalho solo nunca toca GitHub a menos que `--pr`. `auto` = liga sozinho SE detectar repo colaborativo (PRs recentes de outras pessoas). `auto` e mais esperto mas tem o custo de detectar toda vez. Recomendacao: `false` (deteccao zero, voce liga com `--pr` quando quiser).

4. **Menu de 4 opcoes no fim da fase: sempre, ou so em `--pr`?** Adotar o menu do superpowers ("1 merge local / 2 PR / 3 deixa branch / 4 descarta") sempre da controle mas adiciona 1 parada. No `--solo` puro talvez voce queira merge local automatico sem menu. Onde fica a linha?

5. **Estrategia de merge default: `squash`, `merge` ou `rebase`?** Proposto = `--squash --delete-branch` (1 fase = 1 commit limpo, log changelog-like). Voce prefere `merge` (preserva os commits atomicos da fase no historico da main, bom pra bisect) ou `rebase`?

6. **Auto-merge vs checkpoint humano (`--auto`):** em modo builder/yolo, merge automatico se CI verde + verificador UP passou; em modo interativo, abre PR e PARA pra voce revisar. Voce quer aprovar todo PR seu, ou confia o auto-merge quando os gates deterministicos passam?

7. **Multica `--board`: vale o esforco de implementar agora, ou o painel `multica.ecoup.digital` ja basta como camada visual separada?** Como o stream ao vivo NAO existe no fluxo local (so status no board), o ganho real do `--board` e menor do que o blueprint vendia. Talvez o ROI nao justifique priorizar a Fase 5 antes de ver o resto rodando. Mover Fase 5 pro fim ou cortar do v2.0?

8. **Conteudo como agente proprio (`up-roteirista`) ou skill?** Boa parte do seu trabalho e visual/conteudo (carrosseis, aulas). Mantenho `up-roteirista` como o 12º agente, OU isso vira so o conjunto de skills `carrossel-*`/`aula-generator` que ja existem, e o UP nem se mete? Recomendacao: deixar como skills existentes e tirar o agente (52->11).

---

Arquivo: `/home/projects/up-cc/redesign/UP-V2-FINAL.md`
