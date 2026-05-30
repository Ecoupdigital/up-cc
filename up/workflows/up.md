<purpose>
Workflow `/up` — Roteador da porta unica do UP.

Sem argumento: le `.plano/STATE.md` e continua de onde parou.
Com descricao: classifica a tarefa (classify-task), escala o brainstorm/intake inline e roteia
para greenfield, brownfield ou clone.
Subverbos: `estado` (status/saude/pausar/resetar/custos/remover-fase) e `config` (configurar/onboard/atualizar).

Este workflow ABSORVE: novo-projeto.md, clone-builder.md, iniciar.md, progresso.md, retomar.md,
pausar.md e o intake de ceo-intake.md (que vira prompt inline do orquestrador, SEM CEO).

A maquinaria GitHub-nativa (worktree/issue/PR) e Multica (--board) e referenciada como interface
alvo mas a orquestracao real e stub (ver TODOs Fase 4/Fase 5). Esta fase entrega so o roteamento.
</purpose>

<core_principle>
O orquestrador (voce) conduz tudo. NAO existe mais CEO: intake, confirmacao do dono e apresentacao
viram prompts inline (AskUserQuestion). A personalidade/perfil do dono vem de `~/.claude/up/owner-profile.md`.

Profundidade do brainstorm = funcao do `classify-task`, NAO do humor do dia:
- trivial (score 0-2): 0 perguntas, anuncia em 1 linha, executa.
- pequena (score 3-5): 1 pergunta (a decisao-chave) via AskUserQuestion + design em 3 frases.
- media/grande (score 6+): brainstorm full, perguntas iterativas (1 por vez), aprovacao por secao.

O ouro e intocavel: STATE.md/ROADMAP.md, commits atomicos (sempre via `up-tools.cjs commit`),
classify-task, approvals.log. Este workflow nao reimplementa nada disso, so chama.
</core_principle>

<process>

## Passo 0: Carregar contexto

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init up)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `project_exists`, `planning_exists`, `state_exists`, `roadmap_exists`,
`has_existing_code`, `has_codebase_map`, `has_git`, `project_path`.

**Determinar o branch de roteamento pelo $ARGUMENTS:**

| $ARGUMENTS | Branch |
|------------|--------|
| vazio | **CONTINUAR** (Passo 1) |
| comeca com `estado` | **ESTADO** (Passo 5) |
| comeca com `config` | **CONFIG** (Passo 6) |
| URL http(s) (clonar app) ou `--clone <url>` | **CLONE** (Passo 4) |
| qualquer outra descricao | **NOVO/BROWNFIELD** (Passo 2-3) |

## Passo 1: CONTINUAR (sem argumento)

Restaura contexto e roteia pra proxima acao. Absorve progresso.md + retomar.md.

**Se `planning_exists` = false:** Nao ha projeto registrado.

```
Sem estrutura de planejamento (.plano/) encontrada.

Para comecar:
  /up "descreva o que quer construir"   -> novo projeto / feature
  /up <url>                              -> clonar um app existente
```

Sair.

**Se `state_exists` = false mas `project_exists` ou `roadmap_exists` = true:**
Reconstruir STATE.md a partir dos artefatos (PROJECT.md -> "O que e Isso"; ROADMAP.md -> fases;
*-SUMMARY.md -> decisoes/preocupacoes; .continue-aqui -> continuidade), entao prosseguir.

**Carregar estado estruturado:**

```bash
ROADMAP=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap analyze)
STATE=$(node "$HOME/.claude/up/bin/up-tools.cjs" state-snapshot)
PROGRESS_BAR=$(node "$HOME/.claude/up/bin/up-tools.cjs" progress bar --raw)
```

**Detectar trabalho incompleto:**

```bash
# Checkpoint mid-plano (handoff de pausa)
ls .plano/fases/*/.continue-aqui.md 2>/dev/null

# Planos sem SUMMARY (execucao incompleta)
for plan in .plano/fases/*/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "Incompleto: $plan"
done 2>/dev/null
```

**Apresentar status (output direto do orquestrador, sem CEO):**

```
==============================================================
  STATUS DO PROJETO
==============================================================
  Construindo: [one-liner do PROJECT.md "O que e Isso"]
  Progresso:   {PROGRESS_BAR}

  Fase: [X] de [Y] - [nome da fase]
  Plano: [A] de [B] - [status]

  Ultima atividade: [data] - [o que aconteceu]
==============================================================

## Trabalho Recente
- [Fase X, Plano Y]: [1 linha de summary-extract --fields one_liner]

## Decisoes-Chave
- [de STATE.decisions[]]

## Bloqueios
- [de STATE.blockers[]]
```

**Rotear (contagens verificadas, mesma logica de progresso.md):**

```bash
PLANS=$(ls -1 .plano/fases/[dir-fase-atual]/*-PLAN.md 2>/dev/null | wc -l)
SUMS=$(ls -1 .plano/fases/[dir-fase-atual]/*-SUMMARY.md 2>/dev/null | wc -l)
```

| Condicao | Significado | Proximo |
|----------|-------------|---------|
| `.continue-aqui.md` existe | Checkpoint mid-plano | Retomar do checkpoint (ler arquivo) ou recomecar o plano |
| SUMS < PLANS | Planos pendentes | `/up:build` (executa o que falta) |
| PLANS = 0 | Fase nao planejada | `/up:plan` (planeja a fase) |
| SUMS = PLANS > 0, ha mais fases | Fase completa | `/up:plan` (proxima fase) ou `/up:testar` (UAT antes de seguir) |
| SUMS = PLANS > 0, ultima fase | Projeto completo | `/up:testar` (aceitacao) ou `/up:auditar` |

**Apresentar a proxima acao recomendada:**

```
---

## Proximo

**{fase}-{plano}: [Nome]** -- [objetivo]

`/up:build`        ← executar o que falta
ou
`/up:plan {N}`     ← planejar a proxima fase

<sub>`/clear` primeiro -> janela de contexto limpa</sub>

---
```

**Quick resume:** se o usuario disse literalmente "continuar" / "vai", pular a apresentacao de opcoes,
carregar estado em silencio e seguir direto pra acao primaria, anunciando "Continuando de [estado]...".

## Passo 2: NOVO / BROWNFIELD (descricao recebida)

Absorve novo-projeto.md + iniciar.md + o intake de ceo-intake.md (inline, sem CEO).

### 2.1 Gate de owner-profile

```bash
if [ ! -f ~/.claude/up/owner-profile.md ]; then
  echo "Primeiro uso. Rodando onboarding..."
  # Delegar pro workflow @~/.claude/up/workflows/onboarding.md, depois voltar aqui.
fi
```

Ler owner-profile pra pegar nome preferido, tom e stack preferida (defaults do intake).

### 2.2 Detectar modo

```bash
[ "$has_git" = "false" ] && git init
```

| Sinal | Modo |
|-------|------|
| `has_existing_code` = true OU `has_codebase_map` = true OU `.plano/ROADMAP.md` existe | **BROWNFIELD** |
| caso contrario | **GREENFIELD** |

**Brownfield sem mapa:** sugerir (nao obrigar) `/up:mapear-codigo` para analise profunda. Se o
usuario topar, delegar a `@~/.claude/up/workflows/mapear-codigo.md` e retomar. Senao, mini-scan inline:

```bash
ls package.json go.mod Cargo.toml requirements.txt pyproject.toml pom.xml build.gradle composer.json Gemfile 2>/dev/null
ls -d src/ app/ lib/ cmd/ internal/ pages/ components/ 2>/dev/null | head -15
```

### 2.3 Classificar a tarefa e escalar o brainstorm/intake

Escrever um plano-rascunho minimo do briefing em arquivo temporario pra classificar
(classify-task le frontmatter + padroes de conteudo):

```bash
mkdir -p .plano
cat > /tmp/up-brief-classify.md <<EOF
---
type: feature
brownfield: ${BROWNFIELD:-false}
---
${ARGUMENTS}
EOF
CLASSIFY=$(node "$HOME/.claude/up/bin/up-tools.cjs" classify-task /tmp/up-brief-classify.md --raw)
COMPLEXITY=$(echo "$CLASSIFY" | grep -oE '"complexity"\s*:\s*"[a-z]+"' | grep -oE '(simple|standard|complex)')
```

**Profundidade do intake/brainstorm conforme COMPLEXITY:**

- **simple (trivial):** ZERO perguntas. Anunciar em 1 linha o que vai construir e seguir.
  Ex: "Vou criar [X]. Indo." Pular direto pro 2.5 (estruturar) com defaults.

- **standard (pequena):** 1 pergunta (a decisao-chave) via AskUserQuestion + descrever a abordagem
  em 3 frases. Para UI, oferecer companion visual (Jonathan e visual).

- **complex (media/grande):** brainstorm/intake full. Perguntar inline (freeform pra abrir, depois
  AskUserQuestion seguindo os fios). Cobrir os 5 blocos do intake antigo, AGORA inline e opcionais:
  1. Briefing (o que construir; ja temos $ARGUMENTS, aprofundar so se vago).
  2. Design system (cores/tipografia/componentes ou link; se nao tem, gerar placeholder shadcn neutro
     em `.plano/DESIGN-TOKENS.md` e registrar pendencia em `.plano/PENDING.md`).
  3. Credenciais de API (Supabase/email/pagamentos/WhatsApp; salvar em `.env.local` SEM commitar;
     o que faltar vira pendencia blocker/non_blocker em PENDING.md).
  4. Referencias ("igual ao Linear", screenshots, brand book). Se URL + intencao de clonar -> Passo 4.
  5. Restricoes (features/tecnologias banidas). Tudo opcional, enter pula.

**Validacao de briefing:** se vago/inviavel, repergunte (max 2 vezes). Apos isso, o orquestrador
assume escopo minimo razoavel e segue. Brownfield: perguntar tambem o que NAO deve mudar e a dor maior.

### 2.4 Pesquisa inline (so greenfield, so se util)

Migrado de novo-projeto.md (4 pesquisadores) e do research-inline do builder.md.

**Brownfield com mapa de codebase:** pular (stack/arquitetura ja conhecidas). Pesquisar so o que e NOVO.

**Greenfield + dominio desconhecido (ou usuario pediu):** spawnar 4 `up-pesquisador` em PARALELO
(modo dominio). Para tarefa trivial/pequena, pular a pesquisa.

```bash
mkdir -p .plano/pesquisa
```

```
# Os 4 Task na MESMA mensagem (paralelo). modo=dominio.
Task(subagent_type="up-pesquisador", description="Pesquisa de Stack", prompt="
<modo>dominio</modo>
<dimensao>Stack</dimensao>
<question>Qual a stack padrao atual para [dominio]?</question>
<output>Write to: .plano/pesquisa/STACK.md</output>
")
Task(subagent_type="up-pesquisador", description="Pesquisa de Features", prompt="
<modo>dominio</modo>
<dimensao>Features</dimensao>
<question>Quais features produtos de [dominio] tem? Obrigatorio vs diferenciador?</question>
<output>Write to: .plano/pesquisa/FEATURES.md</output>
")
Task(subagent_type="up-pesquisador", description="Pesquisa de Arquitetura", prompt="
<modo>dominio</modo>
<dimensao>Arquitetura</dimensao>
<question>Como sistemas de [dominio] sao estruturados? Componentes principais?</question>
<output>Write to: .plano/pesquisa/ARCHITECTURE.md</output>
")
Task(subagent_type="up-pesquisador", description="Pesquisa de Armadilhas", prompt="
<modo>dominio</modo>
<dimensao>Armadilhas</dimensao>
<question>O que projetos de [dominio] comumente erram? Erros criticos?</question>
<output>Write to: .plano/pesquisa/PITFALLS.md</output>
")
```

Apos os 4 retornarem, spawnar o sintetizador (modo research) para consolidar:

```
Task(subagent_type="up-sintetizador", description="Sintetizar pesquisa", prompt="
<modo>research</modo>
<files_to_read>
- .plano/pesquisa/STACK.md
- .plano/pesquisa/FEATURES.md
- .plano/pesquisa/ARCHITECTURE.md
- .plano/pesquisa/PITFALLS.md
</files_to_read>
<output>Write to: .plano/pesquisa/SUMMARY.md. Commit apos escrever.</output>
")
```

### 2.5 Estruturar o projeto (BRIEFING + PROJECT + config)

Escrever inline (sem CEO):

**`.plano/BRIEFING.md`** — briefing consolidado + decisoes iniciais (stack, design, modo).
**`.plano/PROJECT.md`** — usar template `templates/project.md`. Greenfield: requisitos como hipoteses
(Ativos). Brownfield: inferir requisitos Validados do codebase, separar objetivos novos em Ativos.
**`.plano/config.json`** — defaults (perguntar so na complex):

```json
{ "mode": "yolo", "granularity": "standard", "parallelization": true, "commit_docs": true }
```

Commits atomicos:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: briefing e projeto" --files .plano/BRIEFING.md .plano/PROJECT.md
node "$HOME/.claude/up/bin/up-tools.cjs" commit "chore: config do projeto" --files .plano/config.json
```

### 2.6 Injetar persistencia no CLAUDE.md do projeto

Se `./CLAUDE.md` nao tem a secao "UP: Persistencia de Estado", anexar (ou criar o arquivo):

```markdown

## UP: Persistencia de Estado

Este projeto usa o sistema UP. Se `.plano/STATE.md` existir:
- Ao final de trabalho significativo, salvar estado: `node "$HOME/.claude/up/bin/up-tools.cjs" state save-session --summary "o que foi feito"`
- Se houve decisao importante, adicionar: `--decision "decisao" --phase N`
```

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: persistencia de estado no CLAUDE.md" --files CLAUDE.md
```

## Passo 3: Rotear para planejamento

Apos estruturar, o `/up` NAO planeja nem executa fases sozinho. Ele entrega o handoff:

```
---

## Projeto registrado

**[Nome]** | modo: [greenfield|brownfield]

| Artefato   | Local                  |
|------------|------------------------|
| Briefing   | `.plano/BRIEFING.md`   |
| Projeto    | `.plano/PROJECT.md`    |
| Config     | `.plano/config.json`   |
[se pesquisa] | Pesquisa | `.plano/pesquisa/` |
[se brownfield e mapeado] | Codebase | `.plano/codebase/` |

## Proximo

`/up:plan`     ← planeja todas as fases (gera PLAN-READY.md)

<sub>`/clear` primeiro -> janela de contexto limpa</sub>

---
```

> Interface alvo (Fase 4/5): `/up:build` aceitara `--solo` (default, commit na branch atual),
> `--pr` (worktree+issue+PR), `--board` (espelho Multica), `--auto` (merge se verde). Aqui so anunciamos.

## Passo 4: CLONE (URL recebida)

Absorve clone-builder.md. A maquinaria de clone agora e MODO do `up-mapeador-codigo` (crawl + design +
features + PRD num passe) + `up-verificador` modo clone-fidelity. NAO ha mais 5 agentes clone-*.

### 4.1 Intake do clone (inline)

Extrair do $ARGUMENTS: URL (obrigatorio) e modo (`--exact` default | `--improve` | `--inspiration`).
Perguntar via AskUserQuestion (so o essencial): credenciais de login do app original (se precisar),
stack desejada do clone, credenciais do banco do clone, e (se improve/inspiration) o que mudar.

```bash
mkdir -p .plano/clone
git init 2>/dev/null
```

Salvar `.plano/BRIEFING.md` com URL, credenciais (NAO commitar segredos), stack, modo.

### 4.2 Mapear o app original (modo clone, passe unico)

```
Task(subagent_type="up-mapeador-codigo", description="Clonar app original", prompt="
<modo>clone</modo>
<objective>
Num passe unico: crawl do app em {URL} (todas as rotas, screenshots desktop+mobile, intercepta APIs,
extrai forms), extrai o design system completo, mapeia modulos/features/roles/data-model/fluxos e
escreve o PRD pronto pro planejamento.
</objective>
<credentials>URL: {URL} | Email: {EMAIL ou nenhum} | Senha: {PASSWORD ou nenhum}</credentials>
<clone_mode>{exact|improve|inspiration}</clone_mode>
<output>
- .plano/clone/CRAWL-DATA.md
- .plano/clone/DESIGN-SYSTEM.md
- .plano/clone/FEATURE-MAP.md (features com IDs CLONE-*)
- .plano/clone/CLONE-PRD.md (briefing pro /up:plan)
</output>
")
```

### 4.3 Configurar e rotear pro planejamento

`config.json` marca o modo clone (cada agente que le config adapta comportamento):

```json
{ "mode": "yolo", "granularity": "standard", "parallelization": true, "commit_docs": true,
  "builder_type": "clone", "clone_source": "{URL}", "clone_mode": "{exact|improve|inspiration}",
  "clone_data": ".plano/clone/" }
```

Usar `.plano/clone/CLONE-PRD.md` como briefing. Entregar handoff pro `/up:plan` (mesmo do Passo 3).

> A verificacao de fidelidade (comparar clone vs original) roda depois, no `/up:testar`/quality gate,
> via `up-verificador` modo clone-fidelity. Nao e responsabilidade deste roteador.

## Passo 5: ESTADO (subverbo)

`/up estado [status|saude|pausar|resetar|custos|remover-fase N]`. Max 3 conceitos visiveis; o resto
e detectado por contexto. Operacoes:

| Pedido | Acao |
|--------|------|
| status (default) | Mesmo relatorio do Passo 1 (sem rotear execucao) |
| saude | Diagnostico de integridade do `.plano/` (rodar `up-tools.cjs` saude se disponivel) |
| pausar | Criar handoff `.continue-aqui.md` — delegar a `@~/.claude/up/workflows/pausar.md` |
| resetar | Limpeza destrutiva do `.plano/` — delegar a `@~/.claude/up/workflows/resetar.md` |
| custos | Estimativa de tokens dos agentes UP usados (Claude Code only) |
| remover-fase N | Remove e renumera fase futura — delegar a `@~/.claude/up/workflows/remover-fase.md` |

## Passo 6: CONFIG (subverbo)

`/up config [configurar|onboard|atualizar]`:

| Pedido | Acao |
|--------|------|
| configurar | Editar `.plano/config.json` (mode/granularity/parallelization) interativamente |
| onboard | (Re)criar perfil do dono — delegar a `@~/.claude/up/workflows/onboarding.md` |
| atualizar | `npm update -g up-cc` (ou instrucao equivalente) e reinstalar |

</process>

<success_criteria>
- [ ] Branch de roteamento escolhido corretamente pelo $ARGUMENTS
- [ ] Sem arg: STATE.md carregado (ou reconstruido), trabalho incompleto detectado, proxima acao clara
- [ ] Com descricao: modo detectado, classify-task rodou, brainstorm escalado (0/1/full)
- [ ] Intake inline cobriu briefing + (design/credenciais/refs/restricoes na complex), SEM CEO
- [ ] Greenfield: pesquisa inline com 4x up-pesquisador (modo dominio) + up-sintetizador (quando util)
- [ ] BRIEFING/PROJECT/config gerados e committados atomicamente
- [ ] Persistencia injetada no CLAUDE.md do projeto
- [ ] Clone: up-mapeador-codigo modo clone gerou CLONE-PRD; roteado pro /up:plan
- [ ] Handoff claro pro /up:plan ou /up:build
- [ ] Subverbos estado/config delegam aos workflows corretos
- [ ] Nenhuma referencia a CEO, chiefs, supervisores ou agentes clone-*
</success_criteria>
</output>
