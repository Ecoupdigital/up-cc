# UP v2 — Roadmap de Implementação

> Transformar o UP atual (poderoso mas pesado/lento) no UP v2: muito mais poderoso E muito mais rápido/simples, sem perder a essência.
> Essência inegociável que SOBREVIVE a tudo: persistência de estado `.plano/` (STATE.md, ROADMAP.md, snapshots, crash-recovery), commits atômicos, gates determinísticos via `approvals.log`, separação plan/build entre runtimes.
> Princípio de ordenação: ALAVANCAGEM (maior impacto / menor esforço primeiro). Cada fase é entregável e testável isolada.

Legenda esforço: **P** (1-2 dias) · **M** (3-5 dias) · **G** (1-2 semanas). Risco: baixo/médio/alto.

---

## Princípios de design herdados do superpowers (valem pra TODAS as fases)

Estes vão virar a coluna vertebral do UP v2. Não são uma fase, são lei transversal:

1. **`description` = SÓ gatilho ("Use quando..."), nunca o workflow.** Empiricamente (superpowers), resumir o processo no description faz o agente seguir o description e pular o corpo. Reescrever TODOS os `description` de comandos/agentes/skills do UP nesse formato.
2. **Auto-ativação por hook SessionStart** que injeta uma skill-bootstrap inteira em `<EXTREMELY_IMPORTANT>`, disparando em `startup|clear|compact`. É o coração de "ativa disciplina sem comando".
3. **Iron Laws + tabela de racionalização + red flags** para cada disciplina (TDD, debugging, verificação). É o que faz a regra "pegar" sob pressão de modelo.
4. **Composição por cross-reference ("PRÓXIMO PASSO OBRIGATÓRIO: use skill X")** com estado terminal explícito em cada skill — pipeline puxado, sem orquestrador central gordo.
5. **Token discipline:** o que carrega sempre fica <200 palavras; detalhe pesado vai pra arquivo de apoio carregado sob demanda. Nunca usar `@arquivo` para force-load.
6. **Nunca brigar com o harness:** detectar isolamento existente, preferir tools nativas (`EnterWorktree`), provenance-based cleanup, fail-open universal.

---

## FASE 0 — Fundação: hook de ativação + reescrita de descriptions (pré-requisito de tudo)

**Objetivo:** instalar o mecanismo de auto-ativação que faz o UP v2 "ligar disciplina" sem comando explícito, e arrumar as descriptions pra o roteamento contexto→skill funcionar. Sem isso, brainstorm-first (Fase 1) não dispara sozinho.

**Mudanças concretas:**
- Criar `up/skills/usando-up/SKILL.md` — a skill-bootstrap (equivalente ao `using-superpowers`). <200 palavras: regra "1% de chance → invoca a skill", red flags de racionalização, prioridade (instruções do usuário > skills UP > default), gate "antes de planejar/codar → brainstorm primeiro", guard `<SUBAGENTE-STOP>`.
- Criar `up/hooks/up-session-start.js` (Node puro, lê stdin, guard 3s) que lê `usando-up/SKILL.md`, escapa pra JSON e injeta como `additionalContext` em `<EXTREMELY_IMPORTANT>`. Detecta plataforma (Claude/Gemini/OpenCode) pro campo certo.
- Editar `up/bin/install.js` — registrar o hook `SessionStart` (matcher `startup|clear|compact`) no `settings.json`, junto do PostToolUse que já existe.
- Reescrever os `description` (frontmatter) de TODOS os comandos `up/commands/*.md` e agentes `up/agents/*.md` no formato "Use quando..." (gatilho puro). Tarefa mecânica mas extensa.

**Critério de pronto:** após `node up/bin/install.js --claude --global`, abrir sessão nova → `usando-up` aparece no contexto. `/clear` re-injeta. Um teste de baseline: pedir "cria um componente X" numa sessão limpa e o agente anuncia que vai checar skills antes de codar.

**Esforço:** M · **Risco:** baixo (aditivo; se o hook falhar, sessão segue normal).

---

## FASE 1 — Brainstorm-first (porta de entrada que ativa engenharia)

**Objetivo:** maior valor percebido pelo Jonathan. Toda criação passa por um brainstorm visual, com perguntas frequentes (ele é visual, refina ao vivo), terminando num spec aprovado e commitado que vira o gatilho do plano. É o "ativar" da metodologia 4As aplicado ao próprio fluxo.

**Mudanças concretas:**
- Criar `up/skills/brainstorm/SKILL.md` — porta com `<HARD-GATE>` ("não escreva código/scaffold até design apresentado e aprovado, mesmo se parecer trivial"). Checklist de 9 itens (TodoWrite): explorar contexto → oferecer companion visual (mensagem isolada) → perguntas UMA por vez (multipla escolha preferida via AskUserQuestion) → propor 2-3 abordagens com trade-offs → apresentar design por seções escaladas à complexidade (aprovação após cada uma) → escrever spec em `.plano/specs/AAAA-MM-DD-<topico>.md` + commit → self-review (placeholders/consistência/escopo/ambiguidade) → gate de revisão humana do spec → transição pra plano. Texto em PT-BR.
- Criar `up/skills/brainstorm/companion-visual.md` — quando abrir browser/render (mockup, wireframe, comparação A/B) vs ficar no terminal (conceito/trade-off). Integra com as skills visuais já instaladas (`gemini`, `image-creator`).
- Editar `up/commands/plan.md` e `up/commands/build.md` (e o `modo-builder` consolidado) — gate "já brainstormou? não → invoca skill brainstorm" ANTES de qualquer planejamento. Estado terminal do brainstorm = invocar o planejamento.
- Editar `up/skills/usando-up/SKILL.md` — adicionar o gate brainstorm-antes-de-planejar.
- Garantir que o spec aprovado vira input do `/up:plan` (o plano lê `.plano/specs/` mais recente).

**Critério de pronto:** pedir uma feature nova numa sessão limpa dispara o brainstorm automaticamente (sem digitar comando), faz perguntas visuais/multipla-escolha, gera e commita o spec em `.plano/specs/`, e só então oferece planejar. Testar com um caso simples (muda config) e um nuançado (feature multi-tela).

**Esforço:** M · **Risco:** baixo (camada nova; não toca o motor `up-tools.cjs`).

---

## FASE 2 — Consolidação de comandos + corte de agentes (velocidade imediata)

**Objetivo:** ganho de velocidade/simplicidade imediato. 32→~14 comandos, 52→~18 agentes, governança 4→2 níveis. ~2.5-3x menos spawns por fluxo. É o corte de "teatro de processo" que sobra de modelos burros de 2024.

**Mudanças concretas (comandos — fundir/deletar em `up/commands/`):**
- Fundir entrada de projeto: `modo-builder`, `novo-projeto`, `iniciar`, `build`, `clone-builder` → **`/up:build`** com flags (`--light`, `--from-plan`, `--clone <url>`, `--registrar`). Deletar os absorvidos.
- Fundir `plan` + `discutir-fase` → **`/up:plan`**.
- Fundir `planejar-fase` + `adicionar-fase`(deprecado) + `executar-fase` + `remover-fase` → **`/up:fase`** (subverbos planejar/executar/remover). Deletar `adicionar-fase`.
- Fundir `testar` + `ux-tester` + `mobile-first` + `adicionar-testes` → **`/up:testar`** (flags `--ux`, `--mobile`, `--gerar-testes`; default roda tudo).
- Fundir `melhorias` + `ideias` → **`/up:auditar`** (flag `--features`).
- Fundir `progresso` + `retomar` + `pausar` + `saude` + `resetar` → **`/up:estado`** (subverbos).
- Fundir `configurar` + `onboard` → **`/up:config`**.
- Fundir `ajuda` + `dashboard` → **`/up:ajuda`**.
- Manter: `rapido`, `mapear-codigo`→`mapear`, `depurar`, `verificar-trabalho`→`verificar`, `custos`, `atualizar`.

**Mudanças concretas (agentes — deletar em `up/agents/`):**
- ELIMINAR os 8 supervisores `up-*-supervisor` → substituídos por 1 `up-revisor` genérico + auto-revisão inline do operacional (o `up-planejador` já faz self-check; replicar o padrão).
- ELIMINAR 4 dos 5 chiefs (manter só `up-chief-engineer` como tech lead único que aprova a fase no gate legítimo).
- FUNDIR `up-planning-auditor` + `up-delivery-auditor` → `up-auditor-final` (parametrizado por momento).
- REBAIXAR `up-project-ceo` a prompt do orquestrador (personalidade fica em `owner-profile.md`).
- FUNDIR `up-auditor-ux/performance/modernidade` → `up-auditor` (1 passe, 3 dimensões).
- FUNDIR `up-code-reviewer` no fluxo do specialist/revisor (redundância já declarada).
- FUNDIR clone 5→2 (`crawler+design-extractor+feature-mapper+prd-writer` → `up-clone-analista`; mantém `up-clone-verifier`).
- FUNDIR `up-sintetizador` + `up-sintetizador-melhorias` + `up-consolidador-ideias` → `up-sintetizador`.
- MANTER: specialists frontend/backend/database, detectores DCRV (visual-critic, exhaustive-tester, api-tester), executor, planejador, verificador, mapeador, depurador, roteirista, pesquisadores, requirements-validator.

**Mudanças concretas (workflows + CLI):**
- Editar `up/workflows/builder.md` — colapsar o pipeline de 5 gates LLM (Estágio 3) para `Planejador → Specialist → Verificador → [GATE único approvals.log] → Chief-Engineer aprova`. Manter o gate determinístico, tirar supervisores intermediários. Reduzir ciclos de rework de 3+2+1 para 1.
- Editar `up/workflows/governance.md` — reescrever a hierarquia 4→2 níveis.
- Reescrever `up/workflows/` que referenciam agentes deletados (dcrv, melhorias, plan, executar-fase).
- Simplificar `up/bin/up-tools.cjs` — remover/colapsar `classify-task`, `analyze-routing`, `resolve-model-for-plan`, `routing-log`, `budget`, `skill-manifest` (Waves 5-6, micro-otimização de token que rende pouco com menos agentes). Default simples: Opus pra planejar/arquitetar, Sonnet pra executar. Manter `stuck-check`, `timeout`, `verify-static`, `validate-plan` (guardas baratas).

**Critério de pronto:** `up/commands/` tem ~14 arquivos, `up/agents/` ~18. Um build de 1 fase de teste roda com ~3-4 spawns (medir via logs). Nenhum workflow referencia agente deletado (grep limpo). `/up:ajuda` lista a nova superfície. Suíte de fumaça: `up:build`, `up:plan`, `up:fase executar`, `up:testar`, `up:estado` todos completam num projeto-fixture.

**Esforço:** G · **Risco:** médio (muita superfície tocada; mitigar com a camada de compat da Fase 6 e testar fluxo a fluxo).

---

## FASE 3 — GitHub-nativo por padrão (worktree → issue → PR → merge)

**Objetivo:** cada entrega vira worktree isolada → issue → PR → merge, GitHub-aware por padrão. Hoje o UP é git-aware (commita) mas ZERO GitHub-aware (sem branch/worktree/push/PR/issue). Greenfield. Granularidade = por FASE (default), com `/up:rapido` por tarefa.

**Mudanças concretas (primitivas — sobre `execGit` em `up/bin/lib/core.cjs`):**
- Adicionar em `core.cjs`: `gitHasRemote`, `ghAvailable`/`ghAuthed`, `createWorktree`, `removeWorktree`, `listWorktrees`, `pushBranch`, `branchName(fase,plano,slug)`.
- Criar `up/bin/lib/github.cjs` (novo módulo, via `gh` CLI): `ghIssueCreate`, `ghIssueClose`, `ghPrCreate`, `ghPrMerge`, `ghPrStatus`, `ghRepoEnsure`. Todos com `--json` e fail-open.
- Adicionar subcomando `up-tools.cjs git-map` (CRUD do estado de vínculo) + persistir `.plano/git-map.json` (canônico, vive só na main): mapping `fase → branch → issue# → PR# → worktree path → status → merged_sha`.

**Mudanças concretas (config + workflows):**
- Editar `core.cjs:loadConfig` defaults — flags `github_native`, `worktree_granularity` (default `fase`), `merge_strategy` (default `squash`), `auto_merge`, `issue_per`.
- Editar `up/workflows/builder.md` e `up/commands/build.md` — após `git init`: detectar remote + gh, decidir modo GitHub-nativo, gravar config. Oferecer `gh repo create` se não houver remote.
- Editar `up/workflows/executar-fase.md` — antes do `up-executor`: criar worktree (`../.up-worktrees/<repo>/fase-NN-<slug>/`) + issue da fase (body = goal + success criteria do ROADMAP). Após roadmap update: abrir PR (`Closes #N` + resumo dos SUMMARYs) + merge (squash + delete-branch) + remover worktree.
- Editar `up/workflows/executar-plano.md` — commits por tarefa acontecem DENTRO da worktree; migrar os `git add/commit` diretos do executor para `up-tools commit --cwd <worktree>` (evita commit na branch errada).
- Editar `up/commands/rapido.md` — worktree+issue+PR curto por tarefa (`up/rapido-NNN-<slug>`).
- Editar hooks `up-context-monitor.js` / `up-statusline.js` — usar `git rev-parse --show-toplevel` pra achar o `.plano` certo em worktree.
- Estender `/up:estado` (subverbo saude) — `git worktree prune` + reconciliar `git-map.json` com `gh issue/pr list` (limpeza de órfãos).

**Regra crítica (do dossiê 05):** modelo "estado na worktree, consolida no merge". `.plano/` da fase vive e commita na branch da fase; volta pra main no merge do PR. `git-map.json` atualizado na main pós-merge. `github_native=false` → comportamento atual idêntico (zero regressão). Sem `gh`/remote → degrada pra commit local com aviso.

**Critério de pronto:** num repo com remote+gh autenticado, `/up:fase executar` cria worktree, abre issue, commita na branch, abre PR com `Closes #N`, mergeia (squash), fecha issue, remove worktree, atualiza `git-map.json` e STATE. Num repo sem remote: roda igual ao UP atual, com aviso. `/up:estado saude` limpa uma worktree órfã simulada.

**Esforço:** G · **Risco:** médio-alto (cwd/worktree é a maior fonte de atrito; mitigar com fail-open agressivo e testar paralelismo desabilitado primeiro — fases sequenciais).

---

## FASE 4 — TDD gate de verdade no executor

**Objetivo:** TDD real (red-green-refactor com "ver o teste falhar"), não TDD de fachada. Bloqueia código de produção sem teste falhando antes. É barato de adicionar e eleva qualidade sem adicionar spawns.

**Mudanças concretas:**
- Criar `up/skills/tdd/SKILL.md` — Iron Law em maiúsculo ("SEM CÓDIGO DE PRODUÇÃO SEM TESTE FALHANDO ANTES"), ciclo RED (verify-fail MANDATÓRIO) → GREEN (mínimo, YAGNI) → REFACTOR, tabela de racionalização (excuse→reality), red flags ("escreveu código antes do teste? Delete. Recomece"), checklist de verificação, "violar a letra é violar o espírito". PT-BR. <500 palavras + `up/skills/tdd/anti-padroes.md` de apoio.
- Criar `up/skills/verificar-antes-de-concluir/SKILL.md` — "SEM ALEGAÇÃO DE PRONTO SEM EVIDÊNCIA FRESCA": gate function (identifica comando → roda completo → lê output/exit code → verifica → só então afirma). Mata "Pronto!"/"Perfeito!" sem rodar. Reforça `up-verificador` e o detector DCRV.
- Editar `up/agents/up-executor.md` (e specialists frontend/backend/database) — instrução obrigatória de invocar a skill `tdd`; planos passam a ter steps explícitos "escrever teste falhando → rodar e ver falhar → implementar mínimo → rodar e ver passar → commit".
- Editar `up/workflows/executar-plano.md` — granularidade bite-sized (2-5 min/step), file paths exatos, código completo nos planos, zero placeholders, red-green-commit por task (formato superpowers writing-plans).
- Editar `up/agents/up-depurador.md` + `up/skills/` — bug encontrado → escrever teste falhando que reproduz antes de corrigir (já alinhado com debugging sistemático).
- Adicionar guarda em `up-tools.cjs validate-plan` — flag de plano sem step de teste falhando (warning).

**Critério de pronto:** numa fase com TDD ligado, o executor escreve teste, roda, mostra a falha, implementa, mostra o verde, commita — verificável nos logs/commits. Tentar pular o teste dispara o red flag e recomeço. `up-verificador` recusa "pronto" sem output de comando fresco.

**Esforço:** M · **Risco:** baixo (skills + ajuste de prompt; o motor não muda). Risco residual: planos antigos sem step de teste — coberto pelo warning do validate-plan.

---

## FASE 5 — Integração visual Multica (ver agentes trabalhando no board) + skill /tarefa

**Objetivo:** o Jonathan vê fases/ondas/tarefas do UP no board do Multica, com status atualizando ao vivo (`task:message`, `agent:status`). Multica vira a camada de execução/board visível; UP continua dono do plano (`.plano/`). Cola fina, zero infra nova (CLI `multica` já instalado/autenticado na VPS).

**Mudanças concretas:**
- Criar `up/bin/lib/multica.cjs` (novo módulo) — wrapper do CLI `multica` (CLI-first, recomendado no dossiê 02/03): `issueCreate`, `issueStatus`, `issueComment`, `metadataSet`, `issueList --metadata`. Detecta ambiente (`uname -s`; Mac → `ssh server-ecoup`).
- Adicionar subcomando `up-tools.cjs multica sync` — (1) cria issue-pai por fase + sub-issues por onda (`--parent`, `--status backlog`, respeitando "empilha por padrão"); (2) grava metadata de identidade `up_project`/`up_phase`/`up_wave`/`up_plan_file` pra reconciliação idempotente; (3) espelha status nas duas direções (UP fase em andamento → `in_progress`; concluída → `done`; bloqueada → `blocked`).
- Editar `up/workflows/executar-fase.md` + os pontos onde `up-tools.cjs state/roadmap/phase` mudam estado — chamar `multica sync` pra refletir transições no board. Roteamento dev→Maestro Dev, QA→QA (já delegam pros agentes `up-*`).
- Vínculo GitHub↔Multica nativo (combina com Fase 3): nomear a branch da worktree com a KEY da issue (`<key-lower>/<slug>`) e/ou `Closes <KEY>` no PR → auto-link e auto-done nativos do Multica.
- Sincronização reversa (opcional): `multica autopilot trigger-add --kind webhook` → chama `up-tools.cjs` pra marcar tarefa concluída no STATE ao agente do Multica terminar.
- Editar a skill `/tarefa` global (`~/.claude/skills/tarefa/`) — alinhar com os novos subcomandos `up-tools multica` (sem duplicar lógica). Documentar a ponte no `up/references/`.

**Decisão de transporte:** CLI-first por default (menos trabalho, já autenticado). API REST direta (`POST /api/issues` + `GET /ws` scope `task`) só se o UP quiser dashboard próprio embutido — fork pro Jonathan (ver abaixo).

**Critério de pronto:** `/up:fase executar` cria issue-pai + sub-issues no board do Multica, e ao rodar o board mostra `agent:status=working` + stream `task:message` ao vivo; ao concluir, issue vira `done`. `up-tools multica sync` é idempotente (rodar 2x não duplica). Branch com KEY auto-linka o PR à issue.

**Esforço:** M · **Risco:** médio (depende do CLI `multica` v0.3.x, API jovem; mitigar com fail-open — se `multica` indisponível, UP segue sem board).

---

## FASE 6 — Camada de compat/migração + docs

**Objetivo:** garantir que usuários do UP atual migrem sem quebrar, e documentar a nova superfície enxuta. Fecha o redesign.

**Mudanças concretas:**
- Criar `up/commands/_deprecados/` ou shims — comandos antigos (`novo-projeto`, `modo-builder`, `melhorias`, etc.) viram stubs que avisam o novo comando e encaminham (ex.: `novo-projeto` → "use `/up:build`", roda o equivalente).
- Editar `up/bin/up-tools.cjs` — migração `.plano/` legado: detectar projetos com estrutura antiga e migrar config.json (remover chaves de routing das Waves 5-6, adicionar defaults github_native/worktree).
- Atualizar `up/references/` — git-integration, checkpoints, UI patterns refletindo worktree/PR e Multica.
- Reescrever `up/commands/ajuda.md` — mapa novo de 14 comandos + skills (brainstorm, tdd, verificar) + o pipeline puxado.
- Atualizar `CLAUDE.md` do repo + README do pacote `up-cc` (npm) — nova arquitetura, fluxo brainstorm→plan→worktree→PR→merge, integração Multica.
- Bump de versão (v2.0.0) + changelog.
- Editar `up/bin/install.js` — garantir que skills (`up/skills/`) e o hook session-start sejam instalados em todos os runtimes (Claude/Gemini/OpenCode) com as conversões certas.

**Critério de pronto:** instalar UP v2 num projeto que rodava UP v1 não quebra; comandos antigos avisam e encaminham; `/up:ajuda` reflete a superfície nova; `node up/bin/install.js --claude --global` instala comandos+agentes+skills+hooks sem erro. README/changelog publicáveis.

**Esforço:** M · **Risco:** baixo (consolidação/documentação; sem nova mecânica).

---

## Quick wins (1 dia cada — pegáveis em paralelo às fases)

1. **Deletar `adicionar-fase.md`** (já marcado `[DEPRECADO]`) e remover do install/ajuda. Corte limpo, zero risco.
2. **Reescrever os `description` dos comandos mais usados** (`build`, `plan`, `fase`, `rapido`) no formato "Use quando..." — melhora roteamento sozinho, antes mesmo da Fase 0 inteira.
3. **Remover a maquinaria de routing das Waves 5-6** do `up-tools.cjs` (`classify-task`, `analyze-routing`, `resolve-model-for-plan`, `routing-log`, `skill-manifest`) e fixar default Opus-planeja / Sonnet-executa. Encolhe o CLI ~25-35%.
4. **Baixar o cap de ciclos de rework** de 3+2+1 pra 1 em `governance.md`/`builder.md` — ganho de velocidade imediato sem tocar arquitetura.
5. **Skill `verificar-antes-de-concluir`** (subconjunto da Fase 4) — sozinha já mata "Pronto!"/"Perfeito!" sem evidência. Alto valor, 1 arquivo.
6. **Hook session-start** (núcleo da Fase 0) — 1 arquivo Node + 1 entrada no install. Liga a auto-ativação.

---

## Decisões que dependem do Jonathan (forks abertos)

1. **Granularidade de worktree (Fase 3):** default proposto = **por FASE** (1 fase = 1 PR review-ável). Alternativas: por PLANO (granular demais, N PRs interdependentes) ou só em `/up:rapido`. Quão agressivo? Aceita worktrees paralelas pra fases independentes (avançado, lê `Depends on`) ou começa tudo sequencial (mais seguro)?
2. **Profundidade do brainstorm (Fase 1):** o `<HARD-GATE>` do superpowers força brainstorm em TODO projeto, até mudança de config. Manter rígido (disciplina total) ou permitir um `--skip-brainstorm`/modo-express pra tarefas que ele já tem certeza? E quantas perguntas no máximo antes de apresentar design (ele gosta de refinar ao vivo, mas pode cansar)?
3. **Multica: CLI vs API (Fase 5):** default = **CLI-first** (já autenticado, menos trabalho). Vale o esforço extra de API REST + WebSocket pra um dashboard de board embutido DENTRO do UP, ou o painel `multica.ecoup.digital` já basta como camada visual?
4. **Quão agressivo cortar agentes (Fase 2):** proposta = 52→~18 (corta os 16 de governança + funde auditores/clone/sintetizadores). Mais agressivo ainda (ex.: fundir specialists num executor único, cortar mais detectores DCRV)? Ou conservar 1-2 supervisores como rede de segurança numa transição gradual antes do corte total?
5. **Estratégia de merge default (Fase 3):** proposto = **`--squash --delete-branch`** (1 fase = 1 commit limpo, log changelog-like). Prefere `merge` (preserva commits atômicos da fase no histórico da main) ou `rebase`?
6. **Auto-merge vs checkpoint humano (Fase 3):** em `builder_mode`/yolo, merge automático se CI verde + verificação UP passou; em modo interativo, abre PR e PARA pra ele revisar. Onde fica a linha — ele quer aprovar todo PR ou confia o auto-merge quando os gates passam?
