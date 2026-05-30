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
- **Specialist routing por tipo de plano (frontend/backend/database/executor):** preservado (Estagio 3.2).
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
[up-planejador (replan LOCAL, so se preciso)] -> up-executor/specialists -> up-verificador
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

**Interface alvo GitHub-nativa / Multica (DOCUMENTADA, orquestracao stub nesta fase):**
- `--solo` (DEFAULT): commit atomico na branch ATUAL. Zero worktree, zero issue, zero PR, zero rede.
- `--pr`: worktree -> issue -> PR -> merge (menu de 4 opcoes no fim da fase, nunca PR-automatico).
- `--board`: espelha status no Multica (batched, fim da onda).
- `--auto`: merge automatico se CI verde + gate passou.
Nesta fase entregamos so o `--solo`. As flags `--pr/--board/--auto` ficam como stub:
  - TODO Fase 4 (GitHub-native): EnterWorktree (fallback git worktree), gh issue/PR, menu 4 opcoes.
  - TODO Fase 5 (Multica): `up-tools.cjs multica sync` batched, deteccao `uname -s`, fail-open.
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

Modo: --solo (commit na branch atual)   [--pr/--board/--auto: stub, Fase 4/5]
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

> TODO Fase 4 (GitHub-native): se `--pr`, aqui entra `EnterWorktree` (fallback `git worktree add`) +
> `gh issue create` por fase. Stub nesta fase: `--solo` opera na branch atual.
> TODO Fase 5 (Multica): se `--board`, `multica issue status in_progress` na entrada da fase (batched).

Para cada fase em ROADMAP.md (em ordem):

### 3.1 Carregar Plano da Fase

```bash
PHASE_DIR=$(ls -d .plano/fases/{phase_number}-* 2>/dev/null)
PLAN=$(ls "$PHASE_DIR"/*-PLAN.md | head -1)
```

### 3.2 Detectar Tipo de Plano (Specialist Routing)

Ler o frontmatter do plano pra determinar o agente:
- Frontend tasks -> up-frontend-specialist
- Backend tasks -> up-backend-specialist
- Database tasks -> up-database-specialist
- Misto -> up-executor

### 3.3 Spawnar Executor/Specialist (PASSO 1 — Agent SEPARADO)

**Pre-inline de contexto** (economiza ~30k tokens/spawn): montar via `up-tools.cjs context`.

```bash
SPECIALIST_AGENT="up-executor"  # ou specialist baseado no type do plano

CTX=$(node "$HOME/.claude/up/bin/up-tools.cjs" context \
  --plan "${PLAN}" \
  --state \
  --config \
  --requirements "${PHASE_NUMBER}" \
  --manifest "${SPECIALIST_AGENT}" \
  --raw)

MODEL=$(node "$HOME/.claude/up/bin/up-tools.cjs" resolve-model-for-plan \
  "${PLAN}" "${SPECIALIST_AGENT}" --raw)
CLASSIFY=$(node "$HOME/.claude/up/bin/up-tools.cjs" classify-task "${PLAN}" --raw)
COMPLEXITY=$(echo "$CLASSIFY" | grep -oE '"complexity"[^,]+' | grep -oE '"(simple|standard|complex)"' | tr -d '"')
```

```python
Agent(
  subagent_type="{up-specialist}",
  prompt=f"""
    Executar Plano da Fase {phase_number}.

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

    **OUTPUT OBRIGATORIO (ANTES de retornar):**
    ```bash
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-{phase_number} | up-revisor | {{DECISAO}} | {{motivo}}" >> .plano/governance/approvals.log
    ```
    Sem este log, o GATE de fase bloqueia o avanco.
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

### 3.8 Marcar Completa e Avancar

So apos o GATE aprovar (APPROVE ou forced approval registrado).

> TODO Fase 4 (GitHub-native): se `--pr`, fim da fase -> MENU 4 OPCOES
> ("1) merge local  2) abrir PR (gh pr create --base main, Closes #N)  3) deixa a branch  4) descarta").
> Default sugerido = 1. Cleanup provenance-based. Stub nesta fase (so `--solo`: ja committado na branch atual).
> TODO Fase 5 (Multica): se `--board`, `multica issue status` batched no fim da fase.

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
- [ ] up-revisor emitiu veredito por fase e LOGOU em approvals.log
- [ ] GATE de fase deterministico passou (APPROVE ou forced approval com debito)
- [ ] Cap de rework de 1 round respeitado
- [ ] Re-plans locais registrados (se houve, max 2)
- [ ] Quality Gate global rodou
- [ ] up-revisor fez revisao de delivery consolidada
- [ ] PLAN-READY.md -> PROJECT-COMPLETE.md
- [ ] Nenhuma referencia a CEO, chiefs, camadas de revisao intermediaria, auditores gold ou builder-e2e
</success_criteria>
</output>
