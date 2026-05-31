# BLUEPRINT — UP v2

> Documento de arquitetura acionavel para o redesign do UP (up-cc).
> Premissa do dono: UP v2 = MUITO mais poderoso que hoje e MUITO mais rapido/simples, sem perder a essencia.
> Fontes: os 5 dossies em `/home/projects/up-cc/redesign/pesquisa/`.

---

## 1. Principio reitor

UP v2 mantem o ouro do UP (persistencia `.plano/` que sobrevive a `/clear`, commits atomicos, gates deterministicos via `approvals.log`) e injeta a disciplina composavel do superpowers (brainstorm obrigatorio, TDD red-green real, subagent com review cetico, fluxo git nativo via worktree/PR). Cada trabalho comeca por um brainstorm visual que ATIVA a engenharia, vira issue no GitHub espelhada no board do Multica, executa em worktree isolada com commits atomicos, e fecha por PR -> merge -> cleanup. A defesa nao e mais uma piramide de supervisores LLM (CEO -> Chiefs -> Supervisores): e gate deterministico barato + um revisor critico + detectores que rodam o app de verdade. Menos agentes (52 -> 18), menos comandos (32 -> 9), menos camadas (4 -> 2), ~3x menos spawns por fluxo. A regra que faz tudo "pegar" sob pressao vem do superpowers: hook de SessionStart re-injeta a disciplina toda sessao, `description` das skills = SO gatilho ("Use when..."), Iron Laws + tabelas de racionalizacao.

---

## 2. Comandos consolidados — de 32 para 9

O dossie 04 propos 32 -> 14. Aqui aperto mais (meta de simplicidade): absorvo o que era subverbo/flag e elimino redundancia que sobrou. **Antes: 32. Depois: 9.**

| # | Comando | O que faz | O que absorveu |
|---|---------|-----------|----------------|
| 1 | **`/up`** | Porta de entrada unica. Dispara o **brainstorm-first** (passo zero, secao 3), detecta greenfield/brownfield/clone, e roteia pro fluxo certo. Sem argumento = continua de onde parou (le STATE.md). Com descricao = comeca trabalho novo. Flags: `--clone <url>`, `--light` (so registra projeto existente), `--rapido` (tarefa pontual, pula roadmap). | `novo-projeto`, `iniciar`, `modo-builder`, `clone-builder`, `rapido`, `onboard` (primeira run pergunta perfil do dono) |
| 2 | **`/up:plan`** | Planeja projeto OU fase. Roda research inline + self-check, gera `PLAN-READY.md` executavel em runtime barato. Subverbo implicito: planeja fase nova se ja existe `.plano/`. | `plan`, `discutir-fase`, `planejar-fase`, `adicionar-fase` (deprecado) |
| 3 | **`/up:build`** | Executa o que foi planejado: worktree -> issue -> agentes por onda -> commits atomicos -> PR -> merge (secao 5). Sem `.plano/` planejado, manda rodar `/up:plan` antes. Flag `--auto` (merge automatico se verde, modo builder autonomo). | `build`, `executar-fase`, `executar-plano` |
| 4 | **`/up:fase`** | Gestao de fase no roadmap: `remover`, `renumerar`. Operacoes estruturais raras. | `remover-fase`, `adicionar-fase` (parte estrutural) |
| 5 | **`/up:testar`** | Loop DCRV unico (detectar-corrigir-reverificar). Default roda tudo. Flags `--ux`, `--mobile`, `--gerar-testes`, `--e2e`. | `testar`, `ux-tester`, `mobile-first`, `adicionar-testes` |
| 6 | **`/up:depurar`** | Debugging sistematico (4 fases superpowers: root cause -> pattern -> hipotese -> fix com TDD) com estado persistente entre `/clear`. | `depurar` |
| 7 | **`/up:auditar`** | Auditoria priorizada do codebase (UX/perf/modernidade num passe). Flag `--features` ativa pesquisa de mercado e sugestoes novas. | `melhorias`, `ideias` |
| 8 | **`/up:estado`** | Tudo de `.plano/`: `progresso` (default, status + proxima acao), `retomar`, `pausar`, `saude` (inclui reconciliar worktrees/issues orfas), `resetar`, `mapear` (brownfield), `custos`, `sync` (forca espelhamento Multica). | `progresso`, `retomar`, `pausar`, `saude`, `resetar`, `mapear-codigo`, `custos`, `dashboard` |
| 9 | **`/up:config`** | Config do workflow + perfil do dono + `atualizar` (npm) + `ajuda`. | `configurar`, `ajuda`, `atualizar` |

Mortos por absorcao: `verificar-trabalho` vira gate do `/up:build` (UAT conversacional no checkpoint humano antes do merge); `dashboard` vira subverbo de `estado` (ou bash que abre URL do board Multica). **Resultado: 32 -> 9 (-72%).**

---

## 3. Fluxo brainstorm-first (passo ZERO)

Copia o mecanismo do superpowers, mas mantem o output canonico do UP (`.plano/`). Tres camadas de ativacao + um artefato.

### 3.1 Ativacao automatica (sem comando explicito)

- **Hook de SessionStart** (novo, espelha o `hooks/session-start` do superpowers, disparando em `startup|clear|compact`) injeta como `additionalContext`, embrulhado em `<EXTREMELY_IMPORTANT>`, a skill-bootstrap `up-disciplina`. Ela contem: a regra "1% de chance de uma skill aplicar -> voce DEVE invoca-la"; o **HARD-GATE de brainstorm** ("nao escreva codigo, nao crie issue, nao crie worktree antes de apresentar um design e o humano aprovar"); e a tabela de red flags que mata racionalizacao ("isso e simples demais pra precisar de design" -> errado, todo trabalho passa).
- **`description` das skills = SO gatilho** ("Use when iniciando qualquer trabalho novo, feature, bugfix ou mudanca de comportamento, antes de tocar codigo"). Nunca resumir o workflow (licao CSO do dossie 01: resumir faz o agente pular o corpo da skill).
- Resultado: ao iniciar QUALQUER trabalho (via `/up` ou ate conversa normal), o brainstorm dispara sozinho.

### 3.2 O jogo de perguntas (visual, frequente — estilo Jonathan)

Roda como checklist em TodoWrite, na ordem:

1. **Explorar contexto** — ler `.plano/STATE.md`, commits recentes, arquivos-chave. Silencioso.
2. **Avaliar escopo PRIMEIRO** — se descreve multiplos subsistemas independentes, sinalizar JA e decompor em sub-projetos (cada um com seu ciclo). Nao gastar perguntas refinando algo que precisa ser quebrado.
3. **Oferecer Companion Visual** (mensagem isolada, uma vez) — para topicos visuais (mockup, layout, comparacao A/B/C), abrir browser/render. Como Jonathan e visual, isto e o default pra qualquer coisa de UI.
4. **Perguntar via AskUserQuestion** — UMA pergunta por vez (ou um bloco AskUserQuestion com 2-4 opcoes claras). Multipla escolha preferida. Foco: purpose, constraints, success criteria. AskUserQuestion da o "jogo de perguntas visual" nativo (cards clicaveis) que o Jonathan refina ao vivo.
5. **Propor 2-3 abordagens** com trade-offs e a recomendacao. Apresentadas como secoes para validar.
6. **Apresentar o design em secoes** — cada secao escalada a complexidade (poucas frases se simples, ate 300 palavras se nuancado), **aprovacao apos CADA secao** via AskUserQuestion (Aprovar / Ajustar / Discutir). Cobre: arquitetura, componentes, fluxo de dados, erros, testes.
7. **Gerar artefato + commitar.**
8. **Self-review do spec** (4 checagens inline, sem re-review): placeholders, consistencia interna, escopo (cabe num plano so?), ambiguidade.
9. **Gate de revisao humana** — "Briefing escrito em `<path>`. Revisa e me fala se quer mudar antes de planejar." Espera resposta.

### 3.3 Artefato gerado (o gatilho que liga o resto)

`.plano/BRIEFING.md` (no projeto novo, antes do roadmap; numa fase, vira `CONTEXT.md` da fase). Conteudo: What / Core Value / abordagem escolhida / Success Criteria / decisoes / o que esta fora de escopo (YAGNI). Commitado (`docs(brief): <topico>`).

**Estado terminal do brainstorm = invocar `/up:plan`** (e so isso, nunca pular direto pra codigo). O BRIEFING.md aprovado e a entrada de `/up:plan`, que vira ROADMAP.md (fases) + PLAN-READY.md. Assim o brainstorm e a unica porta: sem briefing aprovado, nada executa.

### 3.4 Como casa com o estilo visual do Jonathan

AskUserQuestion (cards) + Companion Visual oferecido por default em UI + aprovacao secao-a-secao = refinamento ao vivo, visual, frequente. Ele ve o design crescer em pedacos e clica pra aprovar/ajustar, em vez de receber um documento gigante no fim.

---

## 4. TDD integrado (sem virar pipeline novo)

TDD entra DENTRO do executor como disciplina (skill), nao como etapa extra de orquestracao. Leve.

- **Skill `up-tdd`** com a Iron Law verbatim do superpowers: `NENHUM CODIGO DE PRODUCAO SEM UM TESTE FALHANDO PRIMEIRO`. `description` = "Use when implementando qualquer feature ou bugfix, antes de escrever codigo de implementacao". Injetada naturalmente quando o executor vai codar.
- **Ciclo no executor:** RED (escrever 1 teste minimo) -> **verificar RED (obrigatorio: ver o teste falhar, e por falta da feature, nao por typo)** -> GREEN (codigo minimo, YAGNI) -> verificar GREEN -> commit atomico (`test(...)` + `feat(...)` ou squashado por tarefa) -> REFACTOR mantendo verde. Cada tarefa do PLAN ja e "write failing test / run-fail / implement / run-pass / commit" (granularidade 2-5 min do dossie 01).
- **Onde fica o gate:** o `up-verificador` (que ja existe) passa a EXIGIR evidencia teste-primeiro. Ele aplica a skill `up-verificacao` (Iron Law: `NENHUMA AFIRMACAO DE CONCLUSAO SEM EVIDENCIA FRESCA`). Para regressao/bugfix: roda o padrao red-green do superpowers (escreve teste -> passa -> reverte fix -> DEVE falhar -> restaura -> passa). Sem esse ciclo provado, o verificador reprova a tarefa.
- **O que bloqueia:** o gate deterministico `approvals.log` so registra aprovacao se o verificador anexou (a) saida do comando de teste com 0 falhas e (b) prova de que houve um teste que falhou antes. Codigo sem teste-primeiro = tarefa nao avanca. Isso e bash check de arquivo, custo ~0 — nao adiciona spawn.
- **Excecoes** (so com permissao explicita): prototipos throwaway, codigo gerado, arquivos de config. "Pular TDD so dessa vez" = racionalizacao proibida.

Resultado: TDD e uma skill + uma exigencia no verificador que ja existe. Zero pipeline novo, zero agente novo.

---

## 5. GitHub-nativo por padrao

Greenfield total no UP (dossie 05: hoje so commita na branch atual, sem branch/worktree/push/PR/`gh`). Novo modulo `up/bin/lib/github.cjs` sobre o `execGit` existente. **Fail-open:** sem `gh`/sem remote/`gh` nao-autenticado -> degrada pro fluxo de commit local atual, com aviso. UP nunca trava por falta de GitHub.

### 5.1 Granularidade — por FASE (default)

1 fase = 1 issue = 1 worktree = 1 branch = 1 PR. Planos/tarefas da fase = commits atomicos DENTRO da branch (nunca PR proprio — vira inferno de merge interdependente). `/up:build --rapido` usa worktree curta por tarefa.

### 5.2 Naming (deterministico)

- Branch: `up/fase-NN-<slug>` (ex.: `up/fase-03-dashboard`). Decimais suportados: `up/fase-02.1-<slug>`. Rapido: `up/rapido-NNN-<slug>`. `<slug>` e `NN` reusam `generateSlugInternal`/`normalizePhaseName` que ja existem em `core.cjs`.
- Issue title: `[Projeto] Fase NN — <goal curto>`. Body: `goal` + Success Criteria do ROADMAP.
- PR title: igual ao da issue. Body: resumo dos SUMMARYs da fase + `Closes #<n>` (auto-fecha issue no merge).
- Branch leva a KEY do Multica tambem (secao 6): `up/fase-03-dashboard` ja casa o regex do Multica se a KEY estiver no body; alternativamente prefixar com a key Multica (`mul-1510/...`) para auto-link nativo.
- Worktree: `../.up-worktrees/<repo>/fase-NN-<slug>/` (irma do repo, fora da arvore; `.gitignore` cobre `*.up-worktrees*`).

### 5.3 Fluxo completo (comandos concretos)

```bash
# 0. brainstorm aprovou -> BRIEFING.md -> /up:plan gerou ROADMAP + PLAN-READY

# 1. criar issue (GitHub) + espelhar no Multica
ISSUE_JSON=$(gh issue create --title "[proj] Fase 03 — Dashboard" \
  --body "$(cat .plano/fases/03-dashboard/issue-body.md)" --label "up,fase" --json number,url)
GH_NUM=$(echo "$ISSUE_JSON" | jq -r .number)
MUL=$(multica issue create --title "[proj] Fase 03 — Dashboard" \
  --description-file .plano/fases/03-dashboard/issue-body.md \
  --project <project-id> --status todo --priority high --output json)
MUL_KEY=$(echo "$MUL" | jq -r .identifier)   # ex MUL-1510
multica issue metadata set "$(echo "$MUL" | jq -r .id)" --key up_phase --value 3
multica issue metadata set "$(echo "$MUL" | jq -r .id)" --key gh_issue --value "$GH_NUM"

# 2. worktree + branch a partir da main atualizada
git fetch origin
git worktree add -b "up/fase-03-dashboard" "../.up-worktrees/$(basename $PWD)/fase-03-dashboard" origin/main
cd "../.up-worktrees/$(basename $PWD)/fase-03-dashboard"

# 3. executar agentes por onda (cwd = worktree), commits atomicos por tarefa (TDD)
#    cada tarefa: test-fail -> impl -> test-pass -> git add <arquivos> + git commit -m "feat(fase-03): ..."
#    (NUNCA git add -A; staging seletivo via cmdCommit --cwd <worktree>)

# 4. abrir PR
git push -u origin "up/fase-03-dashboard"
gh pr create --base main --head "up/fase-03-dashboard" \
  --title "[proj] Fase 03 — Dashboard" \
  --body "$(cat .plano/fases/03-dashboard/pr-body.md)
Closes #$GH_NUM"   # pr-body inclui 'Closes <MUL_KEY>' pro Multica auto-done

# 5. review (checkpoint humano OU --auto)
#    interativo: PARA aqui, /up:verificar roda UAT, dono aprova
#    --auto: se CI verde + verificador UP passou -> segue
gh pr merge <pr#> --squash --delete-branch

# 6. cleanup + consolidar estado na main
cd <repo-principal>
git worktree remove "../.up-worktrees/$(basename $PWD)/fase-03-dashboard"
git worktree prune
git fetch origin && git pull --ff-only
node up-tools.cjs phase complete 03   # avanca STATE/ROADMAP na main
```

### 5.4 Como `.plano` viaja (regra critica do dossie 05)

Modelo "estado na worktree, consolida no merge": durante a fase, codigo + docs `.plano/fases/NN/*` + STATE.md commitam na branch da fase. No merge (squash), `.plano/` da fase volta pra main junto. **`git-map.json` e canonico e vive SO na main** (mapping `fase -> branch/worktree/gh_issue/pr/mul_key/status/merged_sha`), atualizado pos-merge. Hooks (`save-session`, statusline, context-monitor) detectam o `.plano/` certo via `git rev-parse --show-toplevel`. Merge default `--squash` (1 fase = 1 commit limpo, alinhado a "commit outcomes"). Configuravel: `worktree_granularity`, `merge_strategy`, `auto_merge`, `github_native` (master-switch aditivo; `false` = comportamento atual identico, zero regressao).

---

## 6. Integracao visual Multica (ver os agentes trabalhando)

Tudo via CLI `multica` (ja instalado e autenticado na VPS Dev; o daemon roda Claude Code com `HOME=/root`, herdando `~/.claude` -> o mesmo UP). Zero infra nova. A ponte de identidade e `metadata` KV (dossie 02/03).

### 6.1 Contrato de integracao (quando criar issue, quando mover status)

| Evento no UP | Acao no Multica |
|---|---|
| **Brainstorm aprovado** (BRIEFING.md commitado) | `multica project create` (se projeto novo) + 1 issue-pai `[proj] <topico>` `--status backlog`. Grava `metadata up_project=<repo>`, `up_briefing=<sha>` |
| **`/up:plan` gera ROADMAP** | 1 issue-filha por fase (`--parent <issue-pai>` `--status backlog`). `metadata up_phase=N` |
| **Onda paralela na fase** | N issues-neto (`--parent <fase>` `--status todo`) — uma por tarefa da onda, atribuidas ao agente certo (Maestro Dev p/ dev, QA p/ teste) |
| **Fase entra em execucao** (`/up:build`) | `multica issue status <id> in_progress`. `metadata gh_issue=<n>`, `branch=up/fase-NN-slug` |
| **Agentes rodando** | O daemon ja faz POST de cada `task:message` (text/tool_use/tool_result) + `task:progress` -> board mostra cada Bash/Edit/Read AO VIVO no scope `task:{id}` |
| **PR aberto** | `metadata pr_number=<n>`, `pr_url=<url>`. Branch/PR com a KEY -> auto-link nativo (`issue_pull_request`, evento `pull_request:linked`) |
| **PR merged** | `Closes <KEY>` no body -> Multica avanca a issue pra `done` automaticamente no merge. UP tambem chama `multica issue status <id> done` (idempotente) |
| **Bloqueio** | `multica issue status <id> blocked` + `multica issue comment add <id> --content "<motivo>"` |

### 6.2 Como anexa a worktree/PR

Dois caminhos de auto-link, ambos nativos (dossie 02 secao 6 Fluxo B):
1. **Branch com KEY:** nomear a branch da worktree `<mul-key-lower>/<slug>` (ex.: `mul-1510/fase-03-dashboard`) — o handler `github.go` extrai a KEY (regex `identifierRe`) e linka.
2. **Body com KEY:** escrever `Closes MUL-1510` no body do PR -> link + auto-done no merge.

Recomendacao: usar `up/fase-NN-slug` como branch (legivel pro git/UP) e por a KEY Multica no body do PR (`Closes MUL-1510`) + a issue# do GitHub (`Closes #42`). Os dois sistemas fecham sozinhos.

### 6.3 Espelhamento de status ao vivo

Ponto unico: `up-tools.cjs` ja e o unico lugar onde o UP muda estado (`state`, `roadmap`, `phase`). Adicionar subcomando `up-tools.cjs multica sync` que, a cada transicao, roda o `multica issue status`/`metadata set` correspondente (mapa quase 1:1 entre os status). Reconciliacao idempotente via `multica issue list --metadata up_project=<repo> --metadata up_phase=N` (nao duplica). IDs fixos no `multica-admin/CLAUDE.md` (workspace Ecoup, agents Maestro Dev/QA, project do up-cc). Sincronizacao reversa (opcional): `multica autopilot trigger-add --kind webhook` chama `up-tools.cjs` quando o agente do Multica termina, fechando o loop.

---

## 7. Arquitetura de agentes enxuta — de 52 para 18

Tese (dossie 04): a piramide CEO -> 5 Chiefs -> 8 Supervisores -> 2 Auditores (16 agentes, 31% do total) compensava modelos burros de 2024. Modelos 2026 acertam cedo. A defesa real e gate deterministico + 1 revisor critico + detectores que rodam o app. Menos supervisao = menos spawns sequenciais = mais rapido, sem perder seguranca (a seguranca nunca foi os supervisores LLM; era o `approvals.log` e os detectores).

### 7.1 Os 18 que sobram

**Core operacional (faz trabalho real) — 9**
`up-arquiteto`, `up-system-designer`, `up-product-analyst`, `up-planejador`, `up-executor`, `up-verificador` (passa a exigir TDD, secao 4), `up-mapeador-codigo`, `up-depurador`, `up-pesquisador` (funde `pesquisador-projeto` + `pesquisador-mercado`).

**Specialists por dominio (ganho real de qualidade) — 3**
`up-frontend-specialist`, `up-backend-specialist`, `up-database-specialist`.

**Revisao — 1**
`up-revisor` (UNICO). Faz two-stage review do superpowers DENTRO de si: spec-compliance primeiro (cetico: "terminou rapido demais, inspeciona o codigo real, nao confia no relatorio"), depois code-quality. Substitui os 8 supervisores + os 2 auditores gold + `up-code-reviewer`.

**Auditoria (detectores que rodam o app — ouro) — 3**
`up-visual-critic`, `up-exhaustive-tester`, `up-api-tester`. Navegam o app de verdade via Playwright. `up-auditor` unico (funde ux+performance+modernidade num passe) entra aqui tambem -> na pratica 4, mas conto auditor como parte do `/up:auditar`.

**Clone + ops — 2**
`up-clone-analista` (funde crawler+design-extractor+feature-mapper+prd-writer; modelo atual extrai design+features+rotas de screenshots num passe) + `up-clone-verifier`.

> Contagem: 9 core + 3 specialists + 1 revisor + 3 detectores DCRV + 1 auditor + 2 clone = **19**, arredondando os sintetizadores fundidos em `up-sintetizador` unico dentro do core. Alvo ~18.

### 7.2 Eliminados (e por que e seguro)

- **CEO** -> vira prompt do orquestrador (o "canal com o dono" e intake; personalidade via `owner-profile.md`). Sem subagente de 10KB.
- **5 Chiefs** -> 1 unico gate de "tech lead" que aprova a fase ja e coberto pelo gate deterministico + `up-revisor`. Camada de consolidacao por area e redundante com 1 revisor.
- **8 Supervisores** -> `up-revisor` + auto-revisao inline do operacional (o `up-planejador` ja faz self-check sem checker externo — provar e replicar).
- **2 Auditores gold** -> dobrados no `up-revisor`/`up-auditor`.
- **Governanca 4 niveis -> 2** (Operacional -> Revisor unico), com o gate `approvals.log` no meio. Ciclos de rework: de 3+2+1 (ate 6 rounds) para 1 round (modelo acerta cedo).

Ganho: build de 1 fase de ~8-12 spawns para ~3-4 (~3x). Projeto 6 fases de ~60-84 para ~29. `/up:plan` de ~15 para ~5. Sem perda de qualidade detectavel: a seguranca (gates deterministicos, detectores reais, commits atomicos) permanece.

---

## 8. O que MANTEM intacto (o ouro — inegociavel)

1. **`.plano/`** completo: `STATE.md`, `ROADMAP.md`, `PROJECT.md`, `REQUIREMENTS.md`, `config.json`, `fases/NN/*`, `governance/*.log`, `LOCK`. Sobrevive a `/clear`.
2. **`state save-session` + `state-snapshot`** — o coracao da persistencia. STATE.md continua a fonte humana de "onde estou". GitHub-nativo SOMA (`git-map.json` = indice maquina de "onde esta cada fase no GitHub"), nunca substitui.
3. **Commits atomicos** por tarefa (`{tipo}(fase-NN): desc`), staging seletivo (nunca `git add -A`). Log bisectavel/changelog.
4. **Gates deterministicos via `approvals.log`** — bash check de arquivo, custo ~0, o que realmente impede o LLM de pular etapas. Permanece e ganha a exigencia de TDD.
5. **Separacao plan/build entre runtimes** — planejar em Claude Code (capaz), executar em OpenCode/Gemini (barato). `PLAN-READY.md` como flag.
6. **`up-tools.cjs`/`core.cjs`** como motor deterministico (roadmap parsing, slug, progress, commit). Encolhe ~25-35% removendo a maquinaria de routing/manifest das Waves 5-6, mas a espinha fica.
7. **Crash-recovery** via `LOCK.md` + `.continue-aqui.md` + `/up:estado retomar`.

---

## 9. Camada de compatibilidade (migrar sem quebrar usuarios atuais do up-cc)

- **Aliases de comandos antigos:** o installer continua gerando os 32 nomes antigos como shims finos que (a) imprimem aviso de deprecacao e (b) redirecionam pro comando v2 equivalente. Ex.: `/up:modo-builder` -> shim que chama `/up`; `/up:executar-fase` -> `/up:build`; `/up:planejar-fase` -> `/up:plan`; `/up:progresso` -> `/up:estado`. Tabela de mapeamento no `up/references/migracao-v1-v2.md`.
- **Deprecacao gradual (3 fases):**
  1. **v2.0** — comandos v2 entram, shims v1 funcionam com aviso suave ("`/up:modo-builder` virou `/up`. Rodando mesmo assim."). Agentes velhos ainda instalados.
  2. **v2.x** — shims viram aviso forte + telemetria de uso (saber o que ainda usam). Agentes de governanca parados de instalar por default (flag `--legacy-agents` reinstala).
  3. **v3.0** — remove shims e agentes velhos. `up:atualizar` faz a migracao final.
- **`.plano/` e retrocompativel:** v2 le `.plano/` de v1 sem mudanca; `github_native` e `git-map.json` sao aditivos (`github_native=false` por default em projetos existentes -> comportamento identico ao atual). Brainstorm-first e opt-out via `config.brainstorm=false` pra quem so quer o motor.
- **Hook de SessionStart e idempotente:** se ja existe config de hook do usuario, o installer faz merge (nao sobrescreve `settings.json`).
- **npm:** `up-cc` continua o pacote; v2 e major bump. `CHANGELOG` lista o de->para de comandos. `/up:config ajuda` mostra a tabela de migracao na primeira run pos-update.

---

Arquivo: `/home/projects/up-cc/redesign/BLUEPRINT.md`
