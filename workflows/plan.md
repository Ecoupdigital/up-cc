<purpose>
Workflow `/up:plan` — Planejamento completo de projeto.

Conduz Estagios 1 (Intake) + 2 (Arquitetura) + 2.5 (Planejamento exaustivo de TODAS fases) + Planning Audit + PLAN-READY.

NAO executa nada. Para apos gerar PLAN-READY.md.

Resultado: projeto completamente planejado, pronto para `/up:build` no mesmo runtime ou outro.
</purpose>

<core_principle>
Este workflow REUTILIZA os agentes existentes do UP. Apenas orquestra Intake → Arquitetura → Planejamento → Audit.

Diferenca do builder:
- Builder planeja UMA fase, executa, planeja proxima, executa, etc. (incremental)
- Plan planeja TODAS as fases de uma vez antes de qualquer execucao (batch)

Por que? Para permitir que o build rode em outro runtime (ex: planeja em Claude Code, executa em OpenCode).

**Sem model routing** — runtime decide o modelo.
**Sonnet-ready obrigatorio** — todos planos em nivel maximo de detalhe.
</core_principle>

<process>

## Estagio 0: GATES OBRIGATORIOS

### 0.1 Owner Profile

```bash
if [ ! -f ~/.claude/up/owner-profile.md ]; then
  echo "Owner profile nao existe. Rodando /up:onboard primeiro..."
  # Delegar pro workflow onboarding.md
fi
```

### 0.2 Crash Recovery

```bash
ls .plano/LOCK.md 2>/dev/null
```

Se LOCK.md existe e `stage: planning`: retomar de onde parou.

## Estagio 1: INTAKE (CEO conduz)

**Referencia:** `@~/.claude/up/workflows/ceo-intake.md`

Spawnar CEO:

```python
Agent(
  subagent_type="up-project-ceo",
  prompt="""
    Conduzir intake para novo projeto UP via /up:plan.
    
    Briefing: {ARGUMENTS}
    Modo: detectar (greenfield | brownfield)
    
    Executar workflow ceo-intake.md ate completar:
    - Briefing coletado
    - Design system (passar pendente se nao tem)
    - Credenciais (passar pendente se nao tem)
    - Referencias
    - Restricoes
    
    Gerar BRIEFING.md, OWNER.md, PENDING.md, DESIGN-TOKENS.md.
  """
)
```

## Estagio 2: ARQUITETURA

### 2.0 Gate: Inicializar .plano/

```bash
mkdir -p .plano .plano/captures .plano/fases .plano/issues-carryover .plano/governance
git init 2>/dev/null
```

### 2.1 Detectar Modo

```bash
# Brownfield se ha codigo existente
if ls package.json src/ app/ pages/ components/ 2>/dev/null; then
  MODE=brownfield
else
  MODE=greenfield
fi
```

### 2.2 Pesquisa OU Mapeamento (paralelo)

**Greenfield:** spawnar 4 pesquisadores em paralelo (ver builder.md secao similar).

**Brownfield:** spawnar 4 mapeadores em paralelo (ver builder.md secao similar).

### 2.3 Pipeline de Arquitetura

Spawnar em sequencia:

```python
# Product Analyst
Agent(subagent_type="up-product-analyst", prompt="...")

# Product-supervisor revisa
Agent(subagent_type="up-product-supervisor", prompt="...")

# System Designer
Agent(subagent_type="up-system-designer", prompt="...")

# Architecture-supervisor revisa
Agent(subagent_type="up-architecture-supervisor", prompt="...")

# Arquiteto
Agent(subagent_type="up-arquiteto", prompt="...")

# Architecture-supervisor revisa
Agent(subagent_type="up-architecture-supervisor", prompt="...")

# Requirements validator
Agent(subagent_type="up-requirements-validator", prompt="...")

# Chief-architect aprova arquitetura global
Agent(subagent_type="up-chief-architect", prompt="...")
```

### 2.4 Gate Pos-Arquitetura

```bash
[ -f .plano/PROJECT.md ] || { echo "FALTANDO: PROJECT.md"; exit 1; }
[ -f .plano/ROADMAP.md ] || { echo "FALTANDO: ROADMAP.md"; exit 1; }
[ -f .plano/REQUIREMENTS.md ] || { echo "FALTANDO: REQUIREMENTS.md"; exit 1; }
[ -f .plano/SYSTEM-DESIGN.md ] || { echo "FALTANDO: SYSTEM-DESIGN.md"; exit 1; }
```

## Estagio 2.5: PLANEJAMENTO EXAUSTIVO

**Para CADA fase do ROADMAP, planejar AGORA (nao incrementalmente).**

```bash
PHASES=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap list-phases)
```

Para cada fase:

```python
# Planejador (Sonnet-ready obrigatorio)
Agent(
  subagent_type="up-planejador",
  prompt=f"""
    Planejar Fase {phase_number}: {phase_name}.
    
    Modo: builder (autonomo, sem AskUserQuestion)
    Sonnet-ready: SEMPRE (default v0.6.0+)
    
    <files_to_read>
    TIER 1 — Sempre:
    - .plano/STATE.md
    - .plano/fases/{phase_number}/PHASE.md (slice do ROADMAP — v0.7.0+)
    - .plano/fases/{phase_number}/REQUIREMENTS-SLICE.md (REQs APENAS desta fase — v0.7.0+)
    
    TIER 2 — Se brownfield apenas:
    - .plano/codebase/CONVENTIONS.md
    - .plano/codebase/CONCERNS.md
    - .plano/codebase/ARCHITECTURE.md
    
    TIER 3 — Sob demanda apenas:
    - .plano/SYSTEM-DESIGN.md (so se decisao arquitetural especifica)
    - .plano/PROJECT.md (so se precisar visao geral)
    - .plano/ROADMAP.md (so se precisar entender fases adjacentes)
    - .plano/REQUIREMENTS.md (so se a slice nao tiver info suficiente)
    
    FALLBACK: Se as slices nao existem (projeto pre-v0.7.0), carregar
    .plano/ROADMAP.md e .plano/REQUIREMENTS.md completos.
    </files_to_read>
    
    REQs da fase: {phase_req_ids}
    
    Gerar 5-8 planos com nivel maximo de detalhe.
  """
)

# Planning-supervisor revisa
Agent(
  subagent_type="up-planning-supervisor",
  prompt=f"""
    Revisar planos da Fase {phase_number}.
    
    Decisao: APPROVE | REQUEST_CHANGES | ESCALATE
    Max 3 ciclos de rework.
  """
)

# Se REQUEST_CHANGES: re-spawn planejador com feedback
# Se ESCALATE: chief-engineer entra
# Se APPROVE: prosseguir pra proxima fase
```

Apos todas fases planejadas:

```python
# Chief-engineer aprova consistencia cross-fase
Agent(
  subagent_type="up-chief-engineer",
  prompt="""
    Revisar TODOS os planos gerados.
    Validar coerencia cross-fase, dependencies, waves.
    Decisao: APPROVE | REQUEST_CHANGES
  """
)
```

## Estagio P: PLANNING AUDIT

```python
Agent(
  subagent_type="up-planning-auditor",
  prompt="""
    Auditar planejamento completo.
    
    <files_to_read>
    - .plano/CHECKLIST.md
    - .plano/BRIEFING.md
    - .plano/PROJECT.md
    - .plano/ROADMAP.md
    - .plano/REQUIREMENTS.md
    - .plano/SYSTEM-DESIGN.md
    - .plano/PENDING.md
    - .plano/fases/*/*.md
    - .plano/governance/approvals.log
    - $HOME/.claude/up/templates/audit-plan.md
    </files_to_read>
    
    Calcular Planning Confidence Score (0-100).
    Validar artefatos, planos, cobertura REQs, Sonnet-readiness, aprovacoes.
    
    Gerar .plano/AUDIT-PLAN.md.
    
    Decisao: READY_FOR_BUILD | READY_WITH_WARNINGS | NEEDS_REWORK | BLOCKED
  """
)
```

### Processar Decisao

**Se READY_FOR_BUILD:** prosseguir pro Estagio PR.

**Se READY_WITH_WARNINGS:** CEO confirma com dono se quer prosseguir mesmo assim.

**Se NEEDS_REWORK:** executar rework plan, re-rodar auditor (max 3 ciclos).

**Se BLOCKED:** escalar pro CEO, que alerta dono.

## Estagio PR: PLAN READY

### PR.1 Gerar PLAN-READY.md

Usar template `$HOME/.claude/up/templates/plan-ready.md`.

Preencher com:
- planned_at: timestamp atual
- planned_by.runtime: detectar (claude-code | opencode | gemini-cli)
- planned_by.ceo_name: do owner-profile
- intended_execution.runtime: do flag --execution-runtime ou "same"
- project_name: do PROJECT.md
- mode: greenfield | brownfield
- total_phases, total_plans, total_requirements
- planning_confidence: do AUDIT-PLAN.md
- Lista completa de planos

```bash
# Detectar runtime atual
if [ -d ~/.claude ]; then RUNTIME="claude-code"
elif [ -d ~/.config/opencode ]; then RUNTIME="opencode"
elif [ -d ~/.gemini ]; then RUNTIME="gemini-cli"
fi
```

### PR.2 Commit Final

```bash
git add .plano/
node "$HOME/.claude/up/bin/up-tools.cjs" commit "plan: project ready for execution" --files .plano/PLAN-READY.md .plano/AUDIT-PLAN.md
```

### PR.3 CEO Apresenta

Spawnar CEO:

```python
Agent(
  subagent_type="up-project-ceo",
  prompt="""
    Apresentar resumo do planejamento ao dono.
    
    <files_to_read>
    - ~/.claude/up/owner-profile.md
    - .plano/PLAN-READY.md
    - .plano/AUDIT-PLAN.md
    - .plano/PENDING.md
    </files_to_read>
    
    Apresentar:
    - Briefing entendido
    - Stack escolhida
    - N fases planejadas
    - M planos gerados
    - Planning confidence score
    - Pendencias (agrupadas)
    
    Informar:
    "Planejamento completo. Para executar, use /up:build neste runtime
    ou em outro (ex: OpenCode mais barato pra rodar)."
  """
)
```

## Sair

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > /up:plan COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Projeto planejado com sucesso.

Confidence: {N}/100
Fases: {N}
Planos: {M}

Proximo passo:
  /up:build              ← executar neste runtime
  
Ou em outro runtime:
  cd <projeto> && /up-build  (OpenCode)
  cd <projeto> && /up:build  (Gemini CLI)

Estado completo em .plano/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<flags>

## Flags Suportadas

### --execution-runtime=<runtime>

Informa ao planejador qual runtime sera usado pra executar.

Valores: `same` | `claude-code` | `opencode` | `gemini-cli` | `any`

Default: `same`

Efeito:
- Marca em PLAN-READY.md
- Se diferente do runtime atual, planejador adapta documentacao
- Build vai validar se PLAN-READY.md.intended_execution e compativel

```bash
/up:plan "CRM" --execution-runtime=opencode
```

### --no-audit

Pula o Planning Audit (estagio P). Util pra desenvolvimento rapido.
NAO RECOMENDADO em producao.

</flags>

<success_criteria>
- [ ] Owner profile validado
- [ ] CEO conduziu intake
- [ ] BRIEFING, OWNER, PENDING, DESIGN-TOKENS gerados
- [ ] Pipeline de arquitetura completo (product-analyst → system-designer → arquiteto)
- [ ] Architecture supervisor aprovou cada artefato
- [ ] Chief-architect aprovou arquitetura global
- [ ] Chief-product aprovou fit
- [ ] TODAS fases do ROADMAP foram planejadas
- [ ] Planning-supervisor aprovou cada plano
- [ ] Chief-engineer aprovou cross-fase
- [ ] Planning-auditor rodou e gerou AUDIT-PLAN.md
- [ ] Planning Confidence Score calculado
- [ ] PLAN-READY.md gerado
- [ ] CEO apresentou resumo ao dono
- [ ] Commit final feito
</success_criteria>
