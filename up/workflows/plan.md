<purpose>
Workflow `/up:plan` — Planejamento completo de projeto OU de fase.

Conduz Arquitetura + Planejamento exaustivo de TODAS as fases + Planning Review + PLAN-READY.

NAO executa nada. Para apos gerar PLAN-READY.md. Resultado: projeto completamente planejado, pronto
para `/up:build` no mesmo runtime ou outro.

Absorveu discutir-fase.md e planejar-fase.md: detecta automaticamente se o pedido e o PROJETO inteiro
ou uma FASE especifica (`/up:plan` vs `/up:plan N`).
</purpose>

<core_principle>
Pipeline final (redesign v2):

```
up-pesquisador -> up-arquiteto (absorve system-designer) -> up-roteirista
  -> up-sintetizador (valida REQUIREMENTS) -> [GATE approvals.log] -> up-revisor
```

O intake/brainstorm NAO acontece aqui — ja rodou no `/up` (workflows/up.md, inline, sem CEO) e produziu
`.plano/BRIEFING.md`. `/up:plan` consome o BRIEFING. Se for chamado direto sem BRIEFING, faz um intake
minimo inline (sem CEO).

**Model routing configuravel (v0.9.0+):**
```bash
MODEL=$(node "$HOME/.claude/up/bin/up-tools.cjs" config resolve-model {agent-name} --raw)
```
Default fixo: Opus planeja, Sonnet executa. `default` -> nao passar model=.

**Sonnet-ready obrigatorio** — todos os planos em nivel maximo de detalhe.

**SEPARACAO RIGIDA DE AGENTES:** cada passo e um `Agent()` SEPARADO. O enforcement e o GATE
deterministico do `approvals.log` (ver `@~/.claude/up/workflows/governance.md`), nao supervisores.
</core_principle>

<process>

## Estagio 0: GATES OBRIGATORIOS

### 0.1 Owner Profile

```bash
if [ ! -f ~/.claude/up/owner-profile.md ]; then
  echo "Owner profile nao existe. Rodando onboarding..."
  # Delegar pro workflow @~/.claude/up/workflows/onboarding.md
fi
```

### 0.2 Crash Recovery

```bash
ls .plano/LOCK.md 2>/dev/null
```
Se LOCK.md existe e `stage: planning`: retomar de onde parou.

### 0.3 Deteccao projeto vs fase (absorve discutir-fase + planejar-fase)

Se `$ARGUMENTS` contem um numero de fase (ex: `/up:plan 3`), entrar em **MODO FASE** (planejar SO aquela
fase, com research/context inline e self-check). Senao, **MODO PROJETO** (planejar todas as fases).

## Estagio 1: INTAKE (inline, sem CEO)

Entrada esperada = `.plano/BRIEFING.md` (gerado pelo `/up`).

```bash
[ -f .plano/BRIEFING.md ] && cat .plano/BRIEFING.md
```

**Se BRIEFING.md NAO existe** (plan chamado direto): fazer um intake minimo inline. Ler owner-profile
pra tom; perguntar o essencial via AskUserQuestion (briefing, design, credenciais criticas); gerar
`.plano/BRIEFING.md`, `.plano/PENDING.md`, `.plano/DESIGN-TOKENS.md` (custom ou placeholder shadcn).
Sem CEO, sem 5 blocos cerimoniais — so o que falta pra planejar.

## Estagio 2: ARQUITETURA

### 2.0 Gate: Inicializar .plano/

```bash
mkdir -p .plano .plano/captures .plano/fases .plano/issues-carryover .plano/governance
git init 2>/dev/null
```

### 2.1 Detectar Modo

```bash
if ls package.json src/ app/ pages/ components/ 2>/dev/null; then MODE=brownfield; else MODE=greenfield; fi
```

### 2.2 Pesquisa OU Mapeamento (paralelo)

**Greenfield:** se a pesquisa de dominio ainda nao rodou no `/up`, spawnar 4x `up-pesquisador`
(modo dominio) em paralelo + `up-sintetizador` (modo research) — ver `workflows/up.md` Passo 2.4.
Se `.plano/pesquisa/SUMMARY.md` ja existe, reutilizar.

**Brownfield:** se `.plano/codebase/` nao existe, sugerir `/up:mapear-codigo`
(`@~/.claude/up/workflows/mapear-codigo.md`); senao reutilizar o mapa.

### 2.3 Pipeline de Arquitetura (Agents SEPARADOS + GATE)

**Inicializar governance:**
```bash
touch .plano/governance/approvals.log
[ -s .plano/governance/approvals.log ] || \
  echo "# Governance initialized at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .plano/governance/approvals.log
```

```python
# PASSO 1: Arquiteto (absorve system-designer + a analise de produto)
# Faz o design upfront: modulos, roles, schema, rotas, permissoes, blueprints de producao,
# E deriva PROJECT.md + ROADMAP.md + REQUIREMENTS.md + SYSTEM-DESIGN.md.
Agent(subagent_type="up-arquiteto", prompt="""
  Projetar a arquitetura e a estrutura do projeto a partir do BRIEFING.

  <files_to_read>
  - .plano/BRIEFING.md
  - .plano/pesquisa/SUMMARY.md (se existir)
  - .plano/codebase/ARCHITECTURE.md, STACK.md, CONVENTIONS.md (se brownfield)
  - ~/.claude/up/owner-profile.md (stack preferida)
  Sob demanda: $HOME/.claude/up/references/production-requirements.md
  </files_to_read>

  Produzir:
  - .plano/SYSTEM-DESIGN.md (modulos, roles, data model/schema, rotas, permissoes, blueprints de prod)
  - .plano/PROJECT.md (visao do produto, requisitos, decisoes-chave)
  - .plano/ROADMAP.md (fases derivadas dos requisitos, com criterios de sucesso)
  - .plano/REQUIREMENTS.md (REQ-IDs por categoria, rastreabilidade fase<->requisito)
""")
```

```bash
# GATE: artefatos de arquitetura existem?
[ -f .plano/SYSTEM-DESIGN.md ] && [ -f .plano/PROJECT.md ] && [ -f .plano/ROADMAP.md ] && [ -f .plano/REQUIREMENTS.md ] \
  && echo "OK" || { echo "FALHOU: re-spawnar up-arquiteto"; exit 1; }
```

**Multica: criar 1 issue-filha por fase (so se `--board`, BATCHED, MODO PROJETO).**
Agora que o ROADMAP existe com todas as fases, `multica init` garante o project + a issue-pai e cria 1
issue-filha por fase (`--parent <pai> --status backlog`, `metadata up_project=<repo> up_phase=N`) numa
chamada batched (uma por fase, nao por microtransicao). Idempotente: reconcilia via
`multica issue list --metadata up_project=<repo> --metadata up_phase=N` (nao duplica em re-plans).
FAIL-OPEN: se `multica` indisponivel ou erro, avisa e segue o planejamento sem board. Deteccao `uname -s`
fica dentro de `multica.cjs`. So roda no MODO PROJETO (no MODO FASE nao recria o board).

```bash
if [ "$BOARD" = "true" ] && [ "$MODE_FASE" != "true" ]; then
  node "$HOME/.claude/up/bin/up-tools.cjs" multica init --from-roadmap --raw 2>/dev/null \
    || echo "AVISO: Multica indisponivel (init/issues por fase). Seguindo o plano sem board."
fi
```

```python
# PASSO 2: Sintetizador valida os REQUIREMENTS (modo validacao — 13 checks)
# Absorve requirements-validator: completude, testabilidade, cobertura, ausencia de ambiguidade.
Agent(subagent_type="up-sintetizador", prompt="""
  <modo>validacao</modo>
  Validar .plano/REQUIREMENTS.md contra o BRIEFING e o SYSTEM-DESIGN (13 checks: cada REQ e
  especifico, testavel, mapeado a uma fase, sem contradicao, com criterio de aceite claro, etc).
  Se houver gaps, registrar em .plano/REQUIREMENTS-VALIDATION.md e sugerir correcoes ao arquiteto.
  <files_to_read>
  - .plano/REQUIREMENTS.md
  - .plano/BRIEFING.md
  - .plano/SYSTEM-DESIGN.md
  - .plano/ROADMAP.md
  </files_to_read>
""")
```

## Estagio 2.5: PLANEJAMENTO EXAUSTIVO

**Para CADA fase do ROADMAP (MODO PROJETO) ou para a fase pedida (MODO FASE), planejar AGORA.**

```bash
PHASES=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap list-phases)
```

Para cada fase — `up-planejador` faz self-check (sem camada de revisao intermediaria):

```python
Agent(
  subagent_type="up-planejador",
  prompt=f"""
    Planejar Fase {phase_number}: {phase_name}.

    Modo: builder (autonomo, sem AskUserQuestion no MODO PROJETO; no MODO FASE pode coletar contexto).
    Sonnet-ready: SEMPRE.

    <files_to_read>
    TIER 1: .plano/STATE.md, .plano/fases/{phase_number}/PHASE.md,
            .plano/fases/{phase_number}/REQUIREMENTS-SLICE.md
    TIER 2 (brownfield): .plano/codebase/CONVENTIONS.md, CONCERNS.md, ARCHITECTURE.md
    TIER 3 (sob demanda): .plano/SYSTEM-DESIGN.md, .plano/PROJECT.md, .plano/ROADMAP.md, .plano/REQUIREMENTS.md
    FALLBACK: se as slices nao existem, carregar ROADMAP.md e REQUIREMENTS.md completos.
    </files_to_read>

    REQs da fase: {phase_req_ids}
    Gerar 5-8 planos com nivel maximo de detalhe.

    SELF-CHECK obrigatorio antes de retornar: confirme que cada tarefa e implementavel, que os REQs da
    fase estao 100% cobertos, e que dependencias/waves estao corretas. Corrija o que falhar.
  """
)
```

```bash
# GATE: planos da fase existem?
PLAN_COUNT=$(ls .plano/fases/${PHASE_DIR}/*-PLAN.md 2>/dev/null | wc -l)
[ "$PLAN_COUNT" -eq 0 ] && echo "GATE FALHOU: nenhum PLAN.md para fase ${phase_number}. Re-spawnar planejador." && exit 1
echo "OK: ${PLAN_COUNT} planos para fase ${phase_number}"
```

**Repetir para cada fase (MODO PROJETO).**

## Estagio P: PLANNING REVIEW (up-revisor)

Spawnar `up-revisor` para a revisao consolidada do planejamento. Substitui planning-auditor +
chief-engineer cross-phase + chief-architect + supervisores.

```python
Agent(
  subagent_type="up-revisor",
  prompt="""
    Revisar o planejamento completo (escopo: planning). Two-stage adaptado ao planejamento:

    STAGE 1 — spec-compliance cetico: os planos cobrem 100% dos REQUIREMENTS? Ha plano "rapido demais"
    que pula um REQ? Calcular Planning Confidence Score (0-100).
    STAGE 2 — qualidade: coerencia cross-fase, dependencias/waves corretas, Sonnet-readiness (detalhe
    suficiente pra executar sem ambiguidade), sem contradicao entre SYSTEM-DESIGN e planos.

    <files_to_read>
    - .plano/PROJECT.md, .plano/ROADMAP.md, .plano/REQUIREMENTS.md, .plano/SYSTEM-DESIGN.md
    - .plano/REQUIREMENTS-VALIDATION.md (se existir)
    - .plano/fases/*/*.md
    - $HOME/.claude/up/templates/audit-plan.md
    </files_to_read>

    Gerar .plano/AUDIT-PLAN.md (usando o template) com o Planning Confidence Score.
    Decisao: APPROVE (READY_FOR_BUILD) | REQUEST_CHANGES (NEEDS_REWORK) | BLOCK.

    **OUTPUT OBRIGATORIO (ANTES de retornar):**
    ```bash
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | planning | up-revisor | {DECISAO} | confidence=NN" >> .plano/governance/approvals.log
    ```
  """
)
```

### GATE de planejamento (deterministico)

```bash
echo "=== GATE: planning ==="
[ -f .plano/AUDIT-PLAN.md ] || { echo "FALHA: sem AUDIT-PLAN.md"; exit 1; }
REVISOR_ENTRY=$(grep "planning.*up-revisor" .plano/governance/approvals.log 2>/dev/null | tail -1)
[ -z "$REVISOR_ENTRY" ] && echo "FALHA: up-revisor NAO logou planning" && exit 1
DECISION=$(echo "$REVISOR_ENTRY" | awk -F'|' '{gsub(/ /,"",$4); print $4}')
```

**Processar:**
- `APPROVE`: prosseguir pro Estagio PR.
- `REQUEST_CHANGES`: cap de rework 1 round (governance.md). Re-spawn planejador/arquiteto com o review;
  apos 1 round, forced approval com debito tecnico.
- `BLOCK`: alertar o dono (AskUserQuestion).

## Estagio PR: PLAN READY

### PR.1 Gerar PLAN-READY.md

Usar template `$HOME/.claude/up/templates/plan-ready.md`. Preencher: planned_at, planned_by.runtime
(detectar), intended_execution.runtime (flag --execution-runtime ou "same"), project_name, mode,
total_phases/plans/requirements, planning_confidence (do AUDIT-PLAN.md), lista completa de planos.

```bash
if [ -d ~/.claude ]; then RUNTIME="claude-code"
elif [ -d ~/.config/opencode ]; then RUNTIME="opencode"
elif [ -d ~/.gemini ]; then RUNTIME="gemini-cli"; fi
```

### PR.2 Commit Final

```bash
git add .plano/
node "$HOME/.claude/up/bin/up-tools.cjs" commit "plan: project ready for execution" --files .plano/PLAN-READY.md .plano/AUDIT-PLAN.md
```

### PR.3 Apresentar (orquestrador, sem CEO)

Output direto, le owner-profile pra tom:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > /up:plan COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Projeto planejado. Confidence: {N}/100. Fases: {N}. Planos: {M}.
Pendencias: {de PENDING.md}.

Proximo passo:
  /up:build              ← executar neste runtime
Ou em outro runtime:
  cd <projeto> && /up:build  (OpenCode / Gemini CLI — plano viaja no .plano/)

Estado completo em .plano/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<flags>

### --execution-runtime=<runtime>
Informa ao planejador qual runtime sera usado pra executar.
Valores: `same` | `claude-code` | `opencode` | `gemini-cli` | `any`. Default: `same`.
Marca em PLAN-READY.md; o build valida compatibilidade.

```bash
/up:plan "CRM" --execution-runtime=opencode
```

### --no-audit
Pula o Planning Review (estagio P). Util pra dev rapido. NAO recomendado em producao.

### --board
Espelha o plano no Multica (OPT-IN). Ao gerar o ROADMAP (MODO PROJETO), cria 1 issue-filha por fase
(batched, `--status backlog`, `metadata up_project up_phase`) sob a issue-pai do projeto. Idempotente
(reconcilia via metadata, nao duplica). FAIL-OPEN: `multica` indisponivel -> avisa e planeja sem board.
Sem stream ao vivo: o board reflete so status. O `/up:build --board` continua a sincronizacao na execucao.

</flags>

<success_criteria>
- [ ] Owner profile validado
- [ ] Intake consumido de BRIEFING.md (ou intake minimo inline, sem CEO)
- [ ] Deteccao projeto vs fase (absorve discutir-fase/planejar-fase)
- [ ] up-arquiteto gerou SYSTEM-DESIGN + PROJECT + ROADMAP + REQUIREMENTS (absorveu system-designer)
- [ ] up-sintetizador validou REQUIREMENTS (modo validacao, absorveu requirements-validator)
- [ ] TODAS as fases planejadas com PLAN.md (self-check do planejador)
- [ ] up-revisor fez a revisao consolidada do planejamento e LOGOU em approvals.log
- [ ] GATE de planejamento deterministico passou (APPROVE ou forced approval)
- [ ] AUDIT-PLAN.md gerado com Planning Confidence Score
- [ ] PLAN-READY.md gerado e committado
- [ ] `--board` (se passado, MODO PROJETO): 1 issue-filha Multica por fase criada batched (via `multica init --from-roadmap`), idempotente e fail-open
- [ ] Apresentacao = output do orquestrador (sem CEO)
- [ ] Nenhuma referencia a CEO, chiefs, camadas de revisao intermediaria ou aos agentes de planejamento deletados
</success_criteria>
</output>
