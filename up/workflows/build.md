<purpose>
Workflow `/up:build` — Execucao de projeto previamente planejado.

Requer `.plano/PLAN-READY.md` (gerado por `/up:plan`). Conduz Build (loop por fase) + Quality Gate
global + Delivery. Pode executar projeto planejado em outro runtime — confia no PLAN-READY.md.

Este e o MOTOR UNICO de execucao do redesign v2. Absorveu executar-fase.md, executar-plano.md e a
parte de execucao do modo-builder (builder.md, que foi deletado).
</purpose>

<migrado_de_builder>
O antigo builder.md (3416 linhas) foi deletado. Capacidades reais migradas para ca (ou pro up.md/plan.md),
SEM trazer governanca hierarquica/supervisores/CEO:

- **Intake autonomo de projeto + pesquisa inline de stack:** migrado para `workflows/up.md` (Passo 2,
  classify-task escala o brainstorm; greenfield spawna 4x up-pesquisador; modo light = mini-scan inline).
  `/up:build` assume que isso ja rodou e que existe PLAN-READY.md.
- **Crash recovery via LOCK.md:** preservado aqui (Estagio 0.3).
- **Routing por tipo de plano (frontend/backend/database/misto):** preservado (Estagio 3.2), AGORA via
  CONTEXTO no `up-executor` (carrega skill/ref de dominio sob demanda), sem agentes specialist separados.
- **Pre-inline de contexto via `up-tools.cjs context`:** preservado (Estagio 3.3), economiza tokens por spawn.
- **Verification ladder deterministica (verify-static antes do verificador-LLM):** preservada (Estagio 3.6).
- **E2E + DCRV por fase:** delega a `@~/.claude/up/workflows/dcrv.md` (que absorveu builder-e2e.md).
- **Modo light (pipeline enxuto):** o conceito de "feature pequena = menos cerimonia" agora e decidido
  upstream pelo classify-task (em up.md). Aqui o pipeline e o mesmo; o cap de rework e 1 round.

NAO migrado (morto de proposito): CEO/chiefs/supervisores, governanca hierarquica, re-plans com 2 niveis
de aprovacao LLM, updates periodicos ao dono.
</migrado_de_builder>

<core_principle>
Pipeline final por fase (redesign v2):

```
[up-planejador (replan LOCAL, so se preciso)] -> up-executor (roteia por contexto) -> up-verificador
  -> [GATE approvals.log] -> up-revisor -> marcar completa
```

**Model routing configuravel (v0.9.0+):**
Antes de spawnar qualquer agente, resolver o modelo:
```bash
MODEL=$(node "$HOME/.claude/up/bin/up-tools.cjs" config resolve-model {agent-name} --raw)
```
Se `default`: nao passar `model=`. Se `opus/sonnet/haiku`: passar `model="{MODEL}"` no spawn.

**Re-plan local permitido (max 2):**
Se durante a execucao ficar claro que um plano e inviavel, o orquestrador pode re-planejar a fase
LOCALMENTE via `up-planejador` (self-check). NUNCA volta pro runtime que planejou originalmente.

**SEPARACAO RIGIDA DE AGENTES:**
O LLM tende a colapsar passos (mesmo agente executa + verifica). Isso e PROIBIDO. Cada passo do Stage 3
e um `Agent()` SEPARADO. O enforcement e o GATE deterministico do `approvals.log`
(ver `@~/.claude/up/workflows/governance.md`), nao uma piramide de supervisores.

**GitHub-nativo e o DEFAULT (v2):**
- **PADRAO (sem flag):** cada fase abre uma worktree + branch `up/fase-NN-slug` e (se houver `gh` + remote)
  uma issue do GitHub; no fim da fase, se a fase tem UI, **sobe o dev server e PEDE aprovacao visual antes de
  mergear** (3.8.0), depois fecha (merge local / PR / deixa / descarta). Isto e o caminho quente.
  Controlado por `config.github_native=true` (default).
- `--solo`: ESCAPE HATCH sem cerimonia. Forca `github_native=false` SO nesta execucao. Commit atomico na
  branch ATUAL. Zero worktree, zero issue, zero PR, zero rede. (Mesmo comportamento de `/up:rapido`.)
- **Teste visual antes do merge (`require_visual_test`, default true):** fase de UI sobe dev server e exige
  o dono aprovar na tela ANTES do merge (3.8.0). Projeto em PRODUCAO: deixe ligado (nada sobe sem voce ver).
- `--auto`: pula o MENU de fechamento. Apos o GATE aprovar, `finish-phase --mode auto` (PR -> merge squash ->
  cleanup). MAS o teste visual (3.8.0) ainda roda se `require_visual_test=true` (so `false` deixa o --auto
  mergear UI sem aprovacao). So faz sentido com github_native ligado.
- `--board`: espelha status no Multica (espelho de board OPT-IN, BATCHED no fim da onda/fase). NAO ha
  stream ao vivo no fluxo local: o board mostra so o status (`todo -> in_progress -> in_review -> done /
  blocked`), nunca cada tool_use. Chamadas via `up-tools.cjs multica {init|sync|board}` (que usa
  `multica.cjs`, deteccao `uname -s` Mac->`ssh server-ecoup`, FAIL-OPEN: se `multica` indisponivel, avisa
  e segue sem board, nunca crasha). So roda quando `--board` ligado.

**FAIL-OPEN universal:** `start-phase`/`finish-phase` detectam `gh` + remote. Faltando qualquer um, degradam
para git local (worktree local + merge local; issue/PR = null) com aviso, NUNCA crasham. `git worktree` e
sempre local e funciona offline. Com `--solo` nao ha nem worktree (commit direto na branch atual).

**Onde o estado vive:** `git-map.json` e canonico no working dir PRINCIPAL (`.plano/git-map.json`). O `.plano/`
de cada fase viaja na branch da fase (worktree) e volta pra main no merge. STATE.md permanece a fonte humana
de "onde estou"; git-map.json e o indice maquina de "onde esta cada fase no GitHub".
</core_principle>

<process>

## Estagio 0: GATES OBRIGATORIOS

### 0.1 Owner Profile (LOCAL)

```bash
if [ ! -f ~/.claude/up/owner-profile.md ]; then
  echo "Owner profile nao existe NESTE runtime. Rodando onboarding..."
  # Delegar pro workflow @~/.claude/up/workflows/onboarding.md
fi
```

O profile e do RUNTIME ATUAL, nao do runtime que planejou.

### 0.2 PLAN-READY.md Existe?

```bash
if [ ! -f .plano/PLAN-READY.md ]; then
  echo "ERRO: Este projeto nao foi planejado."
  echo "Use /up:plan primeiro. Ou /up \"descricao\" -> /up:plan -> /up:build."
  exit 1
fi
```

### 0.3 Crash Recovery

```bash
ls .plano/LOCK.md 2>/dev/null
```

Se LOCK.md existe e `stage: build`: retomar do passo/fase correto (pular o que ja tem SUMMARY/VERIFICATION).
Se `status: completed`: deletar LOCK.md e iniciar normalmente.

## Estagio V: VALIDACAO LIGHT

**Confiar no PLAN-READY.md, mas spot-check estrutura.**

### V.1 Parsear PLAN-READY.md

```bash
PLANNED_RUNTIME=$(grep "runtime:" .plano/PLAN-READY.md | head -1 | awk '{print $2}')
INTENDED_RUNTIME=$(grep -A1 "intended_execution:" .plano/PLAN-READY.md | tail -1 | awk '{print $2}')
TOTAL_PHASES=$(grep "total_phases:" .plano/PLAN-READY.md | awk '{print $2}')
CONFIDENCE=$(grep "planning_confidence:" .plano/PLAN-READY.md | awk '{print $2}')
```

### V.2 Validacao de Compatibilidade

```bash
CURRENT_RUNTIME="claude-code"
[ -d ~/.config/opencode ] && CURRENT_RUNTIME="opencode"
[ -d ~/.gemini ] && CURRENT_RUNTIME="gemini-cli"

if [ "$INTENDED_RUNTIME" != "same" ] && [ "$INTENDED_RUNTIME" != "any" ] && [ "$INTENDED_RUNTIME" != "$CURRENT_RUNTIME" ]; then
  echo "AVISO: Plano gerado pra $INTENDED_RUNTIME, voce esta em $CURRENT_RUNTIME. Continuar?"
  # AskUserQuestion sim/nao (output direto, sem CEO)
fi
```

### V.3 Validar Artefatos Esperados

```bash
[ -f .plano/PROJECT.md ] || { echo "FALTANDO: PROJECT.md"; FAIL=1; }
[ -f .plano/ROADMAP.md ] || { echo "FALTANDO: ROADMAP.md"; FAIL=1; }
[ -f .plano/REQUIREMENTS.md ] || { echo "FALTANDO: REQUIREMENTS.md"; FAIL=1; }
[ -f .plano/SYSTEM-DESIGN.md ] || { echo "FALTANDO: SYSTEM-DESIGN.md"; FAIL=1; }
```

### V.4 Validar Planos Listados

```bash
PLANS=$(grep -oE "fases/[0-9]+-[a-z-]+/[0-9]+-[0-9]+-PLAN.md" .plano/PLAN-READY.md)
for plan in $PLANS; do
  [ ! -f ".plano/$plan" ] && echo "FALTANDO: $plan" && FAIL=1
done
```

### V.5 Decidir

**Tudo OK:** prosseguir. **Falta algo:** alertar o dono (AskUserQuestion), oferecer re-planejar
localmente (`/up:plan`) ou abortar.

## Estagio C: CONFIRMACAO DO DONO (orquestrador, sem CEO)

Output direto do orquestrador (le owner-profile pra tom):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Projeto planejado em {runtime}.
Resumo: {N} fases, {M} planos. Planning confidence: {X}/100.
Pendencias conhecidas: {de PENDING.md}.

Modo git: {GITHUB_MODE}   (GitHub-nativo e o default; --solo desliga; --auto pula o menu)
```

Resolver `GITHUB_MODE` antes do banner:

```bash
# --solo forca github_native=false SO nesta execucao
if [ "$SOLO" = "true" ]; then
  GITHUB_NATIVE=false
else
  GITHUB_NATIVE=$(node "$HOME/.claude/up/bin/up-tools.cjs" config get github_native --raw 2>/dev/null)
  [ -z "$GITHUB_NATIVE" ] && GITHUB_NATIVE=true   # default TRUE
fi

if [ "$GITHUB_NATIVE" = "true" ]; then
  GITHUB_MODE="GitHub-nativo (worktree + issue + PR/menu por fase)"
  [ "$AUTO" = "true" ] && GITHUB_MODE="GitHub-nativo --auto (PR + merge squash automatico)"
else
  GITHUB_MODE="--solo (commit atomico na branch atual, sem worktree/issue/PR)"
fi

# --board liga o espelho Multica (OPT-IN). So tem efeito se passado explicitamente.
BOARD=false
[ "$BOARD_FLAG" = "true" ] && BOARD=true
[ "$BOARD" = "true" ] && GITHUB_MODE="$GITHUB_MODE + Multica board (espelho de status, batched, fail-open)"
```

Confirmar via AskUserQuestion ("Iniciar execucao?"). Se recusar: abortar.

## Estagio 3: BUILD (loop por fase — com GATE deterministico)

**Inicializar governance** (ver `@~/.claude/up/workflows/governance.md`):
```bash
mkdir -p .plano/governance
touch .plano/governance/approvals.log
[ -s .plano/governance/approvals.log ] || \
  echo "# Build governance initialized at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .plano/governance/approvals.log
```

**Inicializar board no Multica (so se `--board`, UMA vez no inicio do projeto):**
`multica init` garante o `project` no Multica + a issue-pai (e as issues-filhas por fase, se `/up:plan`
ja as criou) e grava `metadata up_project=<repo>`. FAIL-OPEN: se `multica` indisponivel ou der erro,
avisa e segue sem board (nunca crasha o build). Deteccao `uname -s` fica dentro de `multica.cjs`.

```bash
if [ "$BOARD" = "true" ]; then
  # init = ensureProject + issue-pai (idempotente; reconcilia via metadata up_project).
  MULTICA_INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" multica init --raw 2>/dev/null) \
    || echo "AVISO: Multica indisponivel (init). Seguindo sem board."
fi
```

Para cada fase em ROADMAP.md (em ordem):

### 3.0 Abrir a fase (GitHub-nativo - DEFAULT)

A menos que `--solo` (ou `github_native=false`), abrir worktree + branch + issue ANTES de executar a fase.

```bash
PHASE_SLUG=$(node "$HOME/.claude/up/bin/up-tools.cjs" slug "{phase_name}" --raw)

if [ "$GITHUB_NATIVE" = "true" ]; then
  # Cria worktree + branch up/fase-NN-slug; se gh+remote, cria issue. Escreve .plano/git-map.json.
  # Fail-open: sem gh/remote -> worktree local, issue=null, aviso (nunca crasha).
  START=$(node "$HOME/.claude/up/bin/up-tools.cjs" github start-phase \
    --phase {phase_number} --slug "$PHASE_SLUG" --raw)
  if [[ "$START" == @file:* ]]; then START=$(cat "${START#@file:}"); fi
  WORKTREE=$(echo "$START" | grep -oE '"worktree"[^,}]*' | sed 's/.*: *"//;s/"//')
  BRANCH=$(echo "$START"   | grep -oE '"branch"[^,}]*'   | sed 's/.*: *"//;s/"//')
  ISSUE=$(echo "$START"    | grep -oE '"issue"[^,}]*'    | sed 's/.*: *//')
  echo "Fase {phase_number}: branch=$BRANCH worktree=$WORKTREE issue=${ISSUE:-null}"
else
  # --solo: sem worktree/issue. Trabalho acontece na branch atual.
  WORKTREE="$(pwd)"; BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"; ISSUE=""
fi
```

**Entrar na worktree (so se github_native):** o trabalho da fase (executor, commits) acontece
DENTRO de `$WORKTREE`. Preferir a tool nativa do harness **EnterWorktree** apontando para `$WORKTREE`; se
indisponivel, a worktree ja foi criada por `start-phase` (basta usar `--cwd "$WORKTREE"` nos comandos
`up-tools.cjs` e `cd "$WORKTREE"` antes de `git add/commit`). O `.plano/` da fase viaja na branch da fase;
`git-map.json` permanece canonico no working dir principal. Ao terminar a fase usar **ExitWorktree** (ou
voltar `cd` para o repo principal) antes de atualizar `git-map.json` na main.

> Em `--solo`, IGNORAR EnterWorktree/ExitWorktree: tudo na branch atual.

**Multica: marcar a fase em execucao (so se `--board`, 1 chamada na ENTRADA da fase).**
Uma transicao por fase (nao por microtransicao): status `in_progress` + metadata `gh_issue`/`branch`.
FAIL-OPEN: erro ou `multica` indisponivel -> avisa e segue.

```bash
if [ "$BOARD" = "true" ]; then
  node "$HOME/.claude/up/bin/up-tools.cjs" multica sync \
    --phase {phase_number} --status in_progress \
    --gh-issue "${ISSUE:-}" --branch "${BRANCH:-}" --raw 2>/dev/null \
    || echo "AVISO: Multica indisponivel (sync in_progress fase {phase_number}). Seguindo."
fi
```

### 3.1 Carregar Plano da Fase

```bash
# Paths relativos a $WORKTREE (em --solo, $WORKTREE = repo principal).
PHASE_DIR=$(ls -d "$WORKTREE"/.plano/fases/{phase_number}-* 2>/dev/null)
PLAN=$(ls "$PHASE_DIR"/*-PLAN.md | head -1)
```

### 3.2 Detectar Tipo de Plano (routing por CONTEXTO no executor)

Ler o frontmatter do plano pra determinar o TIPO (`frontend`/`backend`/`database`/`misto`). NAO ha mais
agentes specialist separados (Onda 2 do corte): o agente e SEMPRE `up-executor`. O tipo do plano e passado
ao executor, que ROTEIA POR CONTEXTO: carrega a skill/ref de dominio sob demanda (UI/CSS, API/server,
schema/DB) e atua conforme, sem trocar de agente.

```bash
# Tipo apenas informa o executor qual dominio carregar; o agente nao muda.
PLAN_TYPE=$(grep -oE '^type:[[:space:]]*[a-z-]+' "$PLAN" | head -1 | sed 's/type:[[:space:]]*//')
EXECUTOR_DOMAIN="$PLAN_TYPE"   # frontend|backend|database|misto (vazio = misto)
```

### 3.3 Spawnar Executor (PASSO 1 — Agent SEPARADO)

**Pre-inline de contexto** (economiza ~30k tokens/spawn): montar via `up-tools.cjs context`.

```bash
EXECUTOR_AGENT="up-executor"   # SEMPRE up-executor (Onda 2: sem specialists separados)

CTX=$(node "$HOME/.claude/up/bin/up-tools.cjs" context \
  --plan "${PLAN}" \
  --state \
  --config \
  --requirements "${PHASE_NUMBER}" \
  --manifest "${EXECUTOR_AGENT}" \
  --raw)

MODEL=$(node "$HOME/.claude/up/bin/up-tools.cjs" resolve-model-for-plan \
  "${PLAN}" "${EXECUTOR_AGENT}" --raw)
CLASSIFY=$(node "$HOME/.claude/up/bin/up-tools.cjs" classify-task "${PLAN}" --raw)
COMPLEXITY=$(echo "$CLASSIFY" | grep -oE '"complexity"[^,]+' | grep -oE '"(simple|standard|complex)"' | tr -d '"')
```

```python
Agent(
  subagent_type="up-executor",
  prompt=f"""
    Executar Plano da Fase {phase_number}.

    Tipo do plano (dominio a carregar por contexto): {EXECUTOR_DOMAIN}
    Roteie POR CONTEXTO conforme o tipo: frontend -> carregar skill/ref de UI/CSS e DESIGN-TOKENS;
    backend -> ref de API/server; database -> ref de schema/migrations; misto -> conforme cada tarefa.
    NAO existem agentes specialist separados: voce e o unico executor e adapta ao dominio.

    <prompt_context>
    {CTX}
    </prompt_context>

    <production_requirements_compressed>
    Categorias a respeitar (71 requisitos):
    - UIST: loading/error/empty/success em TODA operacao async
    - ERR: boundaries, try/catch, sessao expirada, 404
    - PERF: lazy loading, code split, debounce, pagination > 20 items, cache
    - FORM: validacao inline, mensagens especificas, autofocus, mascaras
    - RESP: 375px funcional, touch 44x44, hamburger mobile
    - A11Y: alt, labels, focus visible, keyboard, contraste 4.5:1
    - SEC: rotas protegidas, CSRF, XSS, rate limit, env vars, RLS
    - POLISH: hover, transicoes 150-300ms, design tokens
    </production_requirements_compressed>

    <files_to_read>
    O contexto principal ja esta no <prompt_context>. Ler do disco APENAS:
    - ./CLAUDE.md (se existir)
    - .plano/fases/{phase_number}/PHASE.md (se existir)
    - .plano/DESIGN-TOKENS.md (so se frontend e existir)
    - Arquivos referenciados em <files> das tarefas (codigo a editar)

    Sob demanda apenas: .plano/PROJECT.md, .plano/SYSTEM-DESIGN.md, .plano/REQUIREMENTS.md
    NAO refazer Read em PLAN/STATE/config/REQUIREMENTS-SLICE/engineering-principles — ja inline.
    </files_to_read>

    Implementar todas as tarefas. Se o plano pedir, gerar tambem artefatos de prod/docs/testes
    inline (papeis de devops/technical-writer/qa absorvidos pelo executor). Commitar atomicamente.
    Gerar SUMMARY.md.
  """
)
```

### --- GATE A: artefatos da execucao ---

```bash
echo "=== GATE A: artefatos da execucao (Fase ${PHASE_NUMBER}) ==="
SUMMARY_COUNT=$(ls ${PHASE_DIR}/*-SUMMARY.md 2>/dev/null | wc -l)
[ "$SUMMARY_COUNT" -eq 0 ] && echo "GATE A FALHOU: nenhum SUMMARY.md. Re-executar executor." && exit 1
echo "GATE A OK: ${SUMMARY_COUNT} SUMMARY(s)"
```

### 3.4 Re-plan local (so se a execucao revelar plano inviavel)

Se durante a execucao ficar evidente que o plano e fundamentalmente errado/inviavel, o orquestrador
re-planeja LOCALMENTE (max 2 por projeto). Sem supervisor: o `up-planejador` faz self-check.

```bash
REPLAN_COUNT=$(cat .plano/governance/replans.log 2>/dev/null | wc -l)
if [ "$REPLAN_COUNT" -ge 2 ]; then
  echo "Max re-plans atingido. Alertar o dono (AskUserQuestion)."
else
  echo "REQUEST_REPLAN. Re-planejando fase {phase_number} localmente..."
fi
```

```python
# Re-plan LOCAL — Agent SEPARADO (so up-planejador, sem camada de revisao intermediaria)
Agent(subagent_type="up-planejador", prompt=f"""
  RE-PLAN da Fase {phase_number}.
  Plano original: {PLAN}
  Razao: {motivo descoberto na execucao}
  Refaca o plano corrigindo o problema. Self-check: confirme viabilidade e completude antes de retornar.
""")
```

```bash
mv "$PLAN" "${PLAN%-PLAN.md}-PLAN-v1.md"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-{phase_number} | up-planejador | REPLAN | {motivo}" >> .plano/governance/replans.log
# Voltar pro 3.3 com o novo plano.
```

### 3.5 Verificacao (PASSO 2 — Agent SEPARADO)

**Verification ladder deterministica primeiro:**

```bash
STATIC=$(node "$HOME/.claude/up/bin/up-tools.cjs" verify-static --raw)
STATIC_OVERALL=$(echo "$STATIC" | grep -oE 'overall.{1,20}' | head -1 | grep -oE '"(pass|fail|skip)"' | tr -d '"')

if [ "$STATIC_OVERALL" = "pass" ]; then
  cat > "${PHASE_DIR}/VERIFICATION.md" <<EOF
---
status: passed
verifier: static-only
phase: ${PHASE_NUMBER}
checks_passed: lint+typecheck+test+audit
---
Aprovacao automatica via verificacao estatica.
EOF
  echo "Verification: PASSED via static checks (LLM skipped)"
fi
```

Se STATIC=fail ou skip: spawnar `up-verificador` com os logs estaticos como contexto:

```python
Agent(subagent_type="up-verificador", prompt=f"""
  Verificar fase {phase_number}.
  <static_check_results overall="{STATIC_OVERALL}">
  Logs em .plano/runtime/verify-static-*.log
  </static_check_results>
  FOCAR no que falhou. Exigir evidencia fresca por tipo de codigo. Gerar VERIFICATION.md.
""")
```

### --- GATE B: artefatos da verificacao ---

```bash
echo "=== GATE B: artefatos da verificacao (Fase ${PHASE_NUMBER}) ==="
VERIF_COUNT=$(ls ${PHASE_DIR}/*-VERIFICATION.md 2>/dev/null | wc -l)
[ "$VERIF_COUNT" -eq 0 ] && echo "GATE B FALHOU: sem VERIFICATION.md. Spawnar verificador." && exit 1
echo "GATE B OK: ${VERIF_COUNT} VERIFICATION(s)"
```

### 3.6 E2E + DCRV (PASSO 3)

Delegar ao loop DCRV (que absorveu builder-e2e). Ver `@~/.claude/up/workflows/dcrv.md`.

```
SCOPE=phase, PHASE_DIR={PHASE_DIR}, PHASE_NUMBER={phase_number}, AUTO_FIX=true, MAX_CYCLES=3
```

Pular se a fase nao tem UI nem API (infra/schema).

### 3.7 Revisao (PASSO 4 — Agent SEPARADO)

**Derivar o tipo de evidencia esperado (Fase 3 - TDD por tipo).** Sai do `type` do frontmatter do plano
(via classify-task / heuristica). O GATE so aprova com `evidence=<tipo>:<resultado>` do tipo certo:

```bash
PLAN_TYPE=$(grep -oE '^type:[[:space:]]*[a-z-]+' "$PLAN" | head -1 | sed 's/type:[[:space:]]*//')
case "$PLAN_TYPE" in
  frontend|ui|css)             EVIDENCE_TYPE="ui";   EVIDENCE_RESULT="visual" ;;   # UI/CSS -> captura visual antes/depois (Playwright)
  integration|glue|webhook)    EVIDENCE_TYPE="glue"; EVIDENCE_RESULT="smoke" ;;    # integracao (Asaas/uazapi/etc) -> smoke-test
  *)                           EVIDENCE_TYPE="logic"; EVIDENCE_RESULT="test_pass" ;; # parser/calculo/API-propria/bugfix -> teste red-green
esac
echo "Fase {phase_number}: evidence esperada = ${EVIDENCE_TYPE}:${EVIDENCE_RESULT}"
```

A evidencia ja foi PRODUZIDA upstream: `logic:test_pass` pelo verificador (red-green); `ui:visual` pela
captura visual antes/depois do `up-tester` no DCRV (3.6); `glue:smoke` pelo smoke do DCRV (3.6). O revisor
apenas CONFIRMA que ela existe e a carimba no approvals.log. Ver `@~/.claude/up/workflows/dcrv.md`.

Spawnar `up-revisor` (UNICO, two-stage). Substitui supervisores, chiefs e auditores gold.

```python
Agent(
  subagent_type="up-revisor",
  prompt=f"""
    Revisar a Fase {phase_number} consolidada (two-stage).

    STAGE 1 — spec-compliance cetico: assuma que "terminou rapido demais". Valide o comportamento
    contra os REQUIREMENTS desta fase navegando/inspecionando o resultado real (nao confie no codigo
    nem no SUMMARY). Emita um Confidence Score (0-100) de delivery.
    STAGE 2 — code-quality: padroes, edge cases, OWASP/security, wiring ponta a ponta.

    <files_to_read>
    - {PLAN}
    - {PHASE_DIR}/*-SUMMARY.md
    - {PHASE_DIR}/*-VERIFICATION.md
    - {PHASE_DIR}/dcrv/DCRV-REPORT.md (se existir)
    - git diff (use Bash)
    - .plano/fases/{phase_number}/REQUIREMENTS-SLICE.md (se existir)
    Sob demanda: $HOME/.claude/up/references/engineering-principles-compressed.md,
                 $HOME/.claude/up/references/production-requirements-compressed.md
    </files_to_read>

    Veredito unico: APPROVE | REQUEST_CHANGES | BLOCK.

    **EVIDENCIA OBRIGATORIA (Fase 3 - TDD por tipo):** so APPROVE se houver evidencia fresca do tipo
    `{EVIDENCE_TYPE}` desta fase:
    - logic (parser/calculo/API-propria/bugfix): teste red-green passando -> evidence=logic:test_pass
    - ui (UI/CSS): captura visual antes/depois (Playwright, do up-tester) -> evidence=ui:visual
    - glue (integracao Asaas/uazapi/etc): smoke-test passando -> evidence=glue:smoke
    Se a evidencia do tipo certo NAO existe, o veredito NAO pode ser APPROVE (use REQUEST_CHANGES para
    forcar a producao da evidencia).

    **OUTPUT OBRIGATORIO (ANTES de retornar) - formato estendido com campo evidence:**
    ```bash
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-{phase_number} | up-revisor | {{DECISAO}} | {{motivo}} | evidence={EVIDENCE_TYPE}:{EVIDENCE_RESULT}" >> .plano/governance/approvals.log
    ```
    Sem este log COM o campo evidence preenchido do tipo certo, o GATE de fase bloqueia o avanco.
  """
)
```

### --- GATE de fase: veredito do revisor (deterministico) ---

Aplicar o gate de `@~/.claude/up/workflows/governance.md`:

```bash
echo "=== GATE: Fase ${PHASE_NUMBER} ==="
SUMMARY_OK=$(ls ${PHASE_DIR}/*-SUMMARY.md 2>/dev/null | wc -l)
VERIF_OK=$(ls ${PHASE_DIR}/*-VERIFICATION.md 2>/dev/null | wc -l)
REVISOR_ENTRY=$(grep "phase-${PHASE_NUMBER}.*up-revisor" .plano/governance/approvals.log 2>/dev/null | tail -1)

PASS=true
[ "$SUMMARY_OK" -eq 0 ] && echo "FALHA: sem SUMMARY.md" && PASS=false
[ "$VERIF_OK" -eq 0 ] && echo "FALHA: sem VERIFICATION.md" && PASS=false
[ -z "$REVISOR_ENTRY" ] && echo "FALHA: up-revisor NAO logou" && PASS=false

# Fase 3 - TDD: a entry do revisor PRECISA ter o campo evidence=<tipo>:<resultado> do tipo certo.
EVIDENCE_FIELD=$(echo "$REVISOR_ENTRY" | grep -oE 'evidence=(logic|ui|glue):(test_pass|visual|smoke)')
if [ -z "$EVIDENCE_FIELD" ]; then
  echo "FALHA: up-revisor logou sem campo evidence=<tipo>:<resultado>. Re-rodar revisor com prova fresca." && PASS=false
elif [ -n "$EVIDENCE_TYPE" ] && ! echo "$EVIDENCE_FIELD" | grep -q "evidence=${EVIDENCE_TYPE}:"; then
  echo "FALHA: evidence de tipo errado ($EVIDENCE_FIELD; esperado ${EVIDENCE_TYPE}). Re-rodar com prova certa." && PASS=false
fi

DECISION=$(echo "$REVISOR_ENTRY" | awk -F'|' '{gsub(/ /,"",$4); print $4}')

if [ "$PASS" = false ]; then
  echo "GATE FALHOU: spawnar o agente faltante e re-rodar."
  exit 1
fi
```

**Processar o veredito:**
- `APPROVE`: prosseguir para 3.8.
- `REQUEST_CHANGES`: cap de rework 1 round (ver governance.md passo 4). Round 0 -> re-spawn executor
  com o review; round >= 1 -> forced approval com debito tecnico. Depois re-rodar verificador + revisor.
- `BLOCK`: interromper e alertar o dono (AskUserQuestion).

### 3.8 Fechar a fase: teste visual (pre-merge) + merge

So apos o GATE aprovar (APPROVE ou forced approval registrado).

**Caso `--solo` (github_native=false):** nada a fazer aqui. Tudo ja foi committado atomicamente na branch
atual. Seguir direto para 3.9. (Sem worktree, sem teste-visual-gate, sem merge.)

#### 3.8.0 Checkpoint de teste visual (PRE-MERGE) - so GitHub-nativo

Roda ANTES de qualquer merge. Garante que NADA sobe sem o dono ver na tela. Resolver:

```bash
REQUIRE_VISUAL=$(node "$HOME/.claude/up/bin/up-tools.cjs" config get require_visual_test --raw 2>/dev/null)
[ -z "$REQUIRE_VISUAL" ] && REQUIRE_VISUAL=true
# HAS_UI: a fase tocou em UI? (tipo do plano frontend/ui/css OU package.json com script dev/start/serve)
HAS_DEV=$(node -e "try{const s=require('./package.json').scripts||{};process.stdout.write((s.dev||s.start||s.serve)?'1':'')}catch(e){}" 2>/dev/null)
```

**Aplica o gate quando:** (HAS_UI ou HAS_DEV) E NAO (`--auto` E REQUIRE_VISUAL=false).
Ou seja: por padrao SEMPRE pede aprovacao visual antes do merge em fase de UI. Para PULAR (CI/yolo):
`--auto` + setar `require_visual_test=false` no config. Para projeto em PRODUCAO: deixe o default (true).

Se aplica:

1. **Subir o dev server DENTRO da worktree** (o codigo da fase vive na worktree - voce testa o codigo REAL
   da fase, nao a main). Ainda DENTRO da worktree, antes de sair dela:

```bash
PORT=${PORT:-3000}
if ! curl -s "http://localhost:${PORT}" >/dev/null 2>&1; then
  ( npm run dev > /tmp/up-build-dev-${phase_number}.log 2>&1 & ) \
    || ( npm start > /tmp/up-build-dev-${phase_number}.log 2>&1 & )
  for i in $(seq 1 40); do curl -s "http://localhost:${PORT}" >/dev/null 2>&1 && break; sleep 1; done
fi
echo "Dev server da Fase {phase_number} no ar: http://localhost:${PORT}"
```

2. **Perguntar (AskUserQuestion):**

```
header: "Fase {phase_number}: testar antes de mergear?"
question: "Subi o dev server em http://localhost:{PORT} com o codigo desta fase. Testar primeiro ou pode mergear?"
options:
  - "Testar primeiro (deixo o server no ar)"
  - "Pode mergear"
  - "Deixa a branch (nao mergeia agora)"
  - "Descarta a fase"
```

3. **Se "Testar primeiro":** MANTEM o dev server no ar, repete a URL, e ESPERA o dono testar. Quando ele
   voltar, perguntar de novo:

```
header: "Testou a Fase {phase_number}?"
question: "E ai, pode fechar?"
options:
  - "Aprovado, pode mergear"
  - "Achei problema, quero ajustar"
```

   - **"Achei problema, quero ajustar":** pedir a descricao do problema, re-spawnar `up-executor` pra corrigir
     NA WORKTREE (mesma branch da fase), re-rodar `up-verificador` + GATE (3.6/3.7), e VOLTAR pro 3.8.0
     (re-testa com o dev server). Loop ate o dono aprovar. (E o "quando eu disser nao, ajusta; quando eu
     disser sim, merge".)
   - **"Aprovado, pode mergear":** segue como "Pode mergear".

4. **Matar o dev server** antes de sair da worktree e mergear:

```bash
pkill -f "npm run dev" 2>/dev/null || true; pkill -f "npm start" 2>/dev/null || true
```

A escolha do checkpoint define a acao de fechamento (3.8.1): "Pode mergear"/"Aprovado" -> MERGE;
"Deixa a branch" -> nao mergeia; "Descarta" -> remove sem merge.

**Fase SEM UI** (infra/schema/backend puro) ou `--auto` com `require_visual_test=false`: pula 3.8.0.
Nesse caso, GitHub-nativo interativo ainda apresenta o mesmo AskUserQuestion de 4 opcoes (sem o passo do
dev server) pra o dono decidir merge/PR/deixa/descarta. `--auto` com fase sem UI fecha direto (sem perguntar).

#### 3.8.1 Merge e avancar

Sair da worktree (**ExitWorktree** ou `cd` de volta ao repo principal) para que `finish-phase` opere e
atualize `git-map.json` na main. Mapear a escolha de 3.8.0 para `finish-phase`
(`--mode menu|auto|solo`):

```bash
case "$ESCOLHA" in
  # Pode mergear / Aprovado: finish-phase --mode auto faz gh pr create (Closes #N) -> merge squash -> cleanup.
  # FAIL-OPEN: sem gh/remote, --mode auto degrada para merge LOCAL da branch na base + cleanup (issue/PR=null).
  mergear|aprovado) node "$HOME/.claude/up/bin/up-tools.cjs" github finish-phase --phase {phase_number} --mode auto --strategy squash ;;
  # Deixa a branch: nao mergeia; worktree+branch vivos. menu so atualiza git-map.json (status=in_review).
  deixa)            node "$HOME/.claude/up/bin/up-tools.cjs" github finish-phase --phase {phase_number} --mode menu ;;
  # Descarta: orquestrador remove worktree + branch (sem merge); reflete em git-map.json via status=cancelled.
  descarta)         echo "Descartando fase {phase_number}: remover worktree + branch (sem merge)." ;;
esac
```

`finish-phase --mode auto` faz: gh pr create (body com `Closes #<issue>` quando ha issue) -> merge (squash
default, ou `--strategy merge|rebase`) -> cleanup worktree+branch, e atualiza `git-map.json`. FAIL-OPEN: sem
gh/remote, faz merge LOCAL da branch da fase na base e remove a worktree (issue/PR = null). `--mode solo` nao
faz nada (usado quando ja esta tudo committado na branch atual); em `--solo` o fluxo nem chega aqui.

**Multica: sync BATCHED no FIM da fase/onda (so se `--board`).**
Uma unica chamada que reflete TODAS as transicoes acumuladas da fase de uma vez (nao por microtransicao):
status final + metadata `gh_issue`/`branch`/`pr`. Mapeamento de status UP -> Multica:
`done->done`, `in_review->in_review`, `blocked->blocked` (descarte/opcao 4 -> `cancelled`). Status final:
opcoes 1/2 (merge/PR) -> `done`; opcao 3 (deixa branch) -> `in_review`; opcao 4 (descarta) -> `cancelled`.
A KEY do Multica ja vai no body do PR (`Closes MUL-X`) via `finish-phase`, entao o merge auto-avanca a
issue pra `done` no proprio Multica; este `sync done` e idempotente. FAIL-OPEN: erro -> avisa e segue.

```bash
if [ "$BOARD" = "true" ]; then
  case "$ESCOLHA" in
    1|2) MB_STATUS=done ;;
    3)   MB_STATUS=in_review ;;
    4)   MB_STATUS=cancelled ;;
    *)   MB_STATUS=done ;;   # --auto sem menu = fechou = done
  esac
  # Ler pr_number do git-map.json da fase (escrito por finish-phase), se houver.
  MB_PR=$(node "$HOME/.claude/up/bin/up-tools.cjs" github status --phase {phase_number} --raw 2>/dev/null \
    | grep -oE '"pr"[^,}]*' | sed 's/.*: *//;s/"//g')
  node "$HOME/.claude/up/bin/up-tools.cjs" multica sync \
    --phase {phase_number} --status "$MB_STATUS" \
    --gh-issue "${ISSUE:-}" --branch "${BRANCH:-}" --pr "${MB_PR:-}" --raw 2>/dev/null \
    || echo "AVISO: Multica indisponivel (sync $MB_STATUS fase {phase_number}). Seguindo."
fi
```

> Em `--solo` o fluxo nem chega aqui (sem `--board`): nenhuma chamada Multica.

### 3.9 Reassessment de roadmap (pos-fase, inline, ~30s)

Apos o GATE aprovar e ANTES de planejar/executar a proxima fase, o orquestrador re-avalia o ROADMAP inline (sem agente separado). Migrado do builder.md 3.1.7 (caira por omissao no corte; recolocado).

Ler ROADMAP.md (fases futuras) + os SUMMARY da fase recem-completa e checar 3 coisas:
- **(a) Fase futura virou redundante?** A fase atual pode ter coberto algo que uma fase futura faria (ex: auth da Fase 3 ja entregou o RBAC que a Fase 6 planejava). Se sim: marcar a fase futura como `Removida (coberta pela Fase {X})` no ROADMAP.
- **(b) Fase futura precisa de ajuste?** Decisao arquitetural desta fase muda o escopo de fases futuras (ex: escolheu tRPC, fases de API mudam). Se sim: atualizar objetivo/criterios da fase futura.
- **(c) Surgiu necessidade nova critica?** Ler `.plano/captures/` (se existir). Insight que bloqueia fases futuras vira fase nova; melhoria so vai pro Polish.

Se houve mudanca no roadmap:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: reassessment apos fase {X}" --files .plano/ROADMAP.md
```

Log de 1 linha: `Reassessment: [sem mudancas | X ajustadas | Y removidas | Z adicionadas]`. Sem mudanca: seguir silenciosamente. Diferente do re-plan LOCAL do Estagio 3.4 (que so corrige a fase corrente): aqui poda/ajusta o roadmap FUTURO a luz do que ja foi construido.

## Estagio 4: QUALITY GATE GLOBAL

Rodar DCRV em escopo global apos todas as fases:

```
SCOPE=global, AUTO_FIX=true, MAX_CYCLES=5
```

Ver `@~/.claude/up/workflows/dcrv.md`. Carryover de issues por fase ja foi acumulado em
`.plano/issues-carryover/`.

## Estagio 4.5: REVISAO DE DELIVERY (consolidada)

Spawnar `up-revisor` em escopo global (Confidence Score de delivery do projeto inteiro). Substitui a
antiga auditoria de delivery dedicada.

```python
Agent(subagent_type="up-revisor", prompt="""
  Revisao final de delivery (escopo: projeto). Stage 1 valida comportamento vs REQUIREMENTS globais;
  Stage 2 confere qualidade/seguranca cross-fase. Emitir Confidence Score (0-100) e veredito.
  Logar em .plano/governance/approvals.log com escopo 'delivery'.
""")
```

## Estagio 5: DELIVERY

Apresentacao = output direto do orquestrador (sem CEO). Le owner-profile pra tom.

### 5.X Marcar Projeto Completo

```bash
mv .plano/PLAN-READY.md .plano/PROJECT-COMPLETE.md
```

**Multica: fechar o board (so se `--board`).** Sync batched final marca a issue-pai como `done` (idempotente).
FAIL-OPEN. Imprimir a URL do board pro dono ver o resultado.

```bash
if [ "$BOARD" = "true" ]; then
  node "$HOME/.claude/up/bin/up-tools.cjs" multica sync --status done --raw 2>/dev/null \
    || echo "AVISO: Multica indisponivel (sync final). Seguindo."
  node "$HOME/.claude/up/bin/up-tools.cjs" multica board --raw 2>/dev/null   # imprime a URL do board
fi
```

Adicionar ao frontmatter:
```yaml
status: complete
completed_at: [timestamp]
completed_by:
  runtime: [current]
final_confidence: [do up-revisor de delivery]
```

</process>

<success_criteria>
- [ ] Owner profile LOCAL validado
- [ ] PLAN-READY.md existe e parseado
- [ ] Validacao light passou (artefatos + planos existem)
- [ ] Dono confirmou execucao (orquestrador, sem CEO)
- [ ] Governance inicializada (.plano/governance/approvals.log)
- [ ] Todas as fases executadas com SUMMARY.md (GATE A)
- [ ] Verificador produziu VERIFICATION.md por fase (GATE B); ladder estatica usada quando possivel
- [ ] E2E + DCRV rodaram por fase (delegado a dcrv.md)
- [ ] up-revisor emitiu veredito por fase e LOGOU em approvals.log COM campo evidence=<tipo>:<resultado>
- [ ] GATE de fase deterministico passou (APPROVE + evidence do tipo certo, ou forced approval com debito)
- [ ] GitHub-nativo (default): worktree+branch+issue por fase via `github start-phase`; menu 4 opcoes /
      `github finish-phase` no fim. `--solo` degrada para commit na branch atual (sem worktree/issue/PR)
- [ ] Execucao sempre via up-executor (roteia por contexto: frontend/backend/database/misto); SEM agentes
      specialist separados (Onda 2 do corte)
- [ ] `--board`: Multica init no inicio (project+pai), sync `in_progress` na entrada da fase, sync BATCHED
      no fim da fase/onda (status+metadata gh_issue/branch/pr), sync done + board URL no delivery. Tudo
      fail-open (nunca crasha) e batched (nao por microtransicao). Sem `--board`: zero chamada Multica
- [ ] Cap de rework de 1 round respeitado
- [ ] Re-plans locais registrados (se houve, max 2)
- [ ] Quality Gate global rodou
- [ ] up-revisor fez revisao de delivery consolidada
- [ ] PLAN-READY.md -> PROJECT-COMPLETE.md
- [ ] Nenhuma referencia a CEO, chiefs, camadas de revisao intermediaria, auditores gold ou builder-e2e
- [ ] Nenhuma referencia aos 3 specialists de dominio nem aos 3 detectores DCRV antigos (6 agentes
      deletados na Onda 2; tudo via up-executor e up-tester)
</success_criteria>
</output>
