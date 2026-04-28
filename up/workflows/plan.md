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

**Model routing configuravel (v0.9.0+):**
Antes de spawnar qualquer agente, resolver o modelo:
```bash
MODEL=$(node "$HOME/.claude/up/bin/up-tools.cjs" config resolve-model {agent-name} --raw)
```
Se `default`: nao passar `model=`. Se `opus/sonnet/haiku`: passar `model="{MODEL}"` no spawn.
Isso permite que o usuario configure via `/up:configurar` quais agentes usam qual modelo.
Sem configuracao, todos usam o modelo do runtime (comportamento v0.6.0).

**Sonnet-ready obrigatorio** — todos planos em nivel maximo de detalhe.

**REGRA ANTI-COLAPSO — SEPARACAO RIGIDA DE AGENTES:**

O LLM tende a otimizar colapsando passos — dar ao mesmo agente tarefas de analisar + projetar,
ou pular supervisores por parecer "overhead". Isso e PROIBIDO.

**Cada passo abaixo DEVE ser um Agent() SEPARADO.**
**NUNCA combinar dois passos em um unico spawn.**
**NUNCA instruir um agente a fazer o trabalho de outro.**

Exemplo do que NAO fazer:
```
# ERRADO — combina product-analyst + system-designer
Agent(subagent_type="up-product-analyst", prompt="Analisar produto E projetar sistema...")

# ERRADO — pula supervisor
Agent(subagent_type="up-arquiteto", prompt="Estruturar e validar...")
```

**Mecanismo de enforcement: GATES verificaveis.**
Cada supervisor DEVE escrever no `.plano/governance/approvals.log`.
Cada GATE verifica que o log tem a entry esperada.
Se o gate falha, NAO avance — spawne o agente faltante.
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

### 2.3 Pipeline de Arquitetura (com GATES verificaveis)

**Inicializar governance:**
```bash
mkdir -p .plano/governance
touch .plano/governance/approvals.log
echo "# Governance initialized at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .plano/governance/approvals.log
```

Spawnar em sequencia — CADA UM e um Agent() SEPARADO:

```python
# PASSO 1: Product Analyst
Agent(subagent_type="up-product-analyst", prompt="...")
```

```bash
# GATE: PRODUCT-ANALYSIS.md existe?
[ -f .plano/PRODUCT-ANALYSIS.md ] && echo "OK" || { echo "FALHOU: re-spawnar product-analyst"; exit 1; }
```

```python
# PASSO 2: Product-supervisor revisa
Agent(subagent_type="up-product-supervisor", prompt="""
  ...
  **OUTPUT OBRIGATORIO (fazer ANTES de retornar):**
  ```bash
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | architecture | product-supervisor | {DECISAO} | {motivo}" >> .plano/governance/approvals.log
  ```
""")
```

```bash
# GATE: product-supervisor logou?
grep -q "product-supervisor" .plano/governance/approvals.log || { echo "FALHOU: spawnar product-supervisor"; exit 1; }
```

```python
# PASSO 3: System Designer
Agent(subagent_type="up-system-designer", prompt="...")
```

```bash
# GATE: SYSTEM-DESIGN.md existe?
[ -f .plano/SYSTEM-DESIGN.md ] && echo "OK" || { echo "FALHOU: re-spawnar system-designer"; exit 1; }
```

```python
# PASSO 4: Architecture-supervisor revisa system design
Agent(subagent_type="up-architecture-supervisor", prompt="""
  ...
  **OUTPUT OBRIGATORIO (fazer ANTES de retornar):**
  ```bash
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | architecture | architecture-supervisor | {DECISAO} | system-design" >> .plano/governance/approvals.log
  ```
""")
```

```bash
# GATE: architecture-supervisor logou para system-design?
grep -q "architecture-supervisor.*system-design" .plano/governance/approvals.log || { echo "FALHOU: spawnar architecture-supervisor"; exit 1; }
```

```python
# PASSO 5: Arquiteto
Agent(subagent_type="up-arquiteto", prompt="...")
```

```bash
# GATE: PROJECT.md + ROADMAP.md + REQUIREMENTS.md existem?
[ -f .plano/PROJECT.md ] && [ -f .plano/ROADMAP.md ] && [ -f .plano/REQUIREMENTS.md ] && echo "OK" || { echo "FALHOU: re-spawnar arquiteto"; exit 1; }
```

```python
# PASSO 6: Architecture-supervisor revisa artefatos do arquiteto
Agent(subagent_type="up-architecture-supervisor", prompt="""
  ...
  **OUTPUT OBRIGATORIO (fazer ANTES de retornar):**
  ```bash
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | architecture | architecture-supervisor | {DECISAO} | architect-artifacts" >> .plano/governance/approvals.log
  ```
""")
```

```bash
# GATE: architecture-supervisor logou para architect-artifacts?
grep -q "architecture-supervisor.*architect-artifacts" .plano/governance/approvals.log || { echo "FALHOU: spawnar architecture-supervisor"; exit 1; }
```

```python
# PASSO 7: Requirements validator
Agent(subagent_type="up-requirements-validator", prompt="...")

# PASSO 8: Chief-architect aprova arquitetura global
Agent(subagent_type="up-chief-architect", prompt="""
  ...
  **OUTPUT OBRIGATORIO (fazer ANTES de retornar):**
  ```bash
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | architecture | chief-architect | {DECISAO} | global-architecture" >> .plano/governance/approvals.log
  ```
""")
```

```bash
# GATE FINAL DE ARQUITETURA: chief-architect logou?
grep -q "chief-architect.*global-architecture" .plano/governance/approvals.log || { echo "FALHOU: spawnar chief-architect"; exit 1; }
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

Para cada fase — **planejador e supervisor sao SEMPRE agentes SEPARADOS:**

```python
# PASSO A: Planejador (Sonnet-ready obrigatorio)
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
```

```bash
# GATE: Planos da fase existem?
PLAN_COUNT=$(ls .plano/fases/${PHASE_DIR}/*-PLAN.md 2>/dev/null | wc -l)
[ "$PLAN_COUNT" -eq 0 ] && echo "GATE FALHOU: Nenhum PLAN.md para fase ${phase_number}. Re-spawnar planejador." && exit 1
echo "OK: ${PLAN_COUNT} planos gerados para fase ${phase_number}"
```

```python
# PASSO B: Planning-supervisor revisa (SEPARADO do planejador)
Agent(
  subagent_type="up-planning-supervisor",
  prompt=f"""
    Revisar planos da Fase {phase_number}.
    
    Decisao: APPROVE | REQUEST_CHANGES | ESCALATE
    Max 3 ciclos de rework.
    
    **OUTPUT OBRIGATORIO (fazer ANTES de retornar):**
    ```bash
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-{phase_number} | planning-supervisor | {{DECISAO}} | {{motivo}}" >> .plano/governance/approvals.log
    ```
  """
)
```

```bash
# GATE: planning-supervisor logou para esta fase?
grep -q "phase-${PHASE_NUMBER}.*planning-supervisor" .plano/governance/approvals.log || { echo "GATE FALHOU: planning-supervisor NAO rodou para fase ${PHASE_NUMBER}. Spawnar agora."; exit 1; }
```

Se REQUEST_CHANGES: re-spawn planejador com feedback (max 3 ciclos).
Se ESCALATE: chief-engineer entra.
Se APPROVE: prosseguir pra proxima fase.

**Repetir para cada fase do ROADMAP.**

Apos TODAS fases planejadas:

```python
# PASSO FINAL: Chief-engineer aprova consistencia cross-fase
Agent(
  subagent_type="up-chief-engineer",
  prompt="""
    Revisar TODOS os planos gerados.
    Validar coerencia cross-fase, dependencies, waves.
    Decisao: APPROVE | REQUEST_CHANGES
    
    **OUTPUT OBRIGATORIO (fazer ANTES de retornar):**
    ```bash
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | planning | chief-engineer | {DECISAO} | cross-phase-review" >> .plano/governance/approvals.log
    ```
  """
)
```

```bash
# GATE FINAL DE PLANEJAMENTO: chief-engineer logou cross-phase review?
grep -q "chief-engineer.*cross-phase-review" .plano/governance/approvals.log || { echo "GATE FALHOU: chief-engineer NAO aprovou cross-fase. Spawnar agora."; exit 1; }
```

## Estagio P: PLANNING AUDIT

### GATE PRE-AUDIT: Verificar que TODA governanca do planejamento rodou

```bash
echo "=== GATE PRE-AUDIT: Verificando governanca completa ==="

# Contar entries esperadas
PHASES=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap list-phases 2>/dev/null | grep -c "phase" || echo "0")
PLAN_SUP_COUNT=$(grep -c "planning-supervisor" .plano/governance/approvals.log 2>/dev/null)
CHIEF_ENG=$(grep -c "chief-engineer.*cross-phase" .plano/governance/approvals.log 2>/dev/null)
CHIEF_ARCH=$(grep -c "chief-architect" .plano/governance/approvals.log 2>/dev/null)
PROD_SUP=$(grep -c "product-supervisor" .plano/governance/approvals.log 2>/dev/null)
ARCH_SUP=$(grep -c "architecture-supervisor" .plano/governance/approvals.log 2>/dev/null)

echo "Planning-supervisor entries: ${PLAN_SUP_COUNT} (esperado: >= ${PHASES})"
echo "Chief-engineer cross-phase: ${CHIEF_ENG} (esperado: >= 1)"
echo "Chief-architect: ${CHIEF_ARCH} (esperado: >= 1)"
echo "Product-supervisor: ${PROD_SUP} (esperado: >= 1)"
echo "Architecture-supervisor: ${ARCH_SUP} (esperado: >= 1)"

FAIL=false
[ "$CHIEF_ENG" -eq 0 ] && echo "FALHA: chief-engineer NAO aprovou cross-fase" && FAIL=true
[ "$CHIEF_ARCH" -eq 0 ] && echo "FALHA: chief-architect NAO aprovou arquitetura" && FAIL=true
[ "$PROD_SUP" -eq 0 ] && echo "FALHA: product-supervisor NAO revisou" && FAIL=true
[ "$ARCH_SUP" -eq 0 ] && echo "FALHA: architecture-supervisor NAO revisou" && FAIL=true

if [ "$FAIL" = true ]; then
  echo ""
  echo "GATE PRE-AUDIT FALHOU: Voltar e spawnar os agentes faltantes."
  exit 1
else
  echo "GATE PRE-AUDIT OK: Toda governanca logada."
fi
```

### Rodar Auditor

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
    - .plano/governance/approvals.log (VERIFICAR que supervisores e chiefs logaram)
    - $HOME/.claude/up/templates/audit-plan.md
    </files_to_read>
    
    Calcular Planning Confidence Score (0-100).
    Validar artefatos, planos, cobertura REQs, Sonnet-readiness, aprovacoes.
    
    **VERIFICAR no approvals.log:**
    - product-supervisor logou? Se nao: penalizar score
    - architecture-supervisor logou 2x (system-design + architect-artifacts)? Se nao: penalizar
    - planning-supervisor logou para CADA fase? Se nao: penalizar
    - chief-architect logou? Se nao: penalizar
    - chief-engineer logou cross-phase? Se nao: penalizar
    
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
- [ ] Architecture supervisor aprovou cada artefato (LOGOU em approvals.log)
- [ ] Chief-architect aprovou arquitetura global (LOGOU em approvals.log)
- [ ] Chief-product aprovou fit
- [ ] TODAS fases do ROADMAP foram planejadas (PLAN.md por fase)
- [ ] Planning-supervisor aprovou cada plano (LOGOU em approvals.log POR FASE)
- [ ] Chief-engineer aprovou cross-fase (LOGOU em approvals.log)
- [ ] GATE PRE-AUDIT passou (todos 5+ governance entries verificados)
- [ ] Planning-auditor rodou e gerou AUDIT-PLAN.md
- [ ] Planning Confidence Score calculado
- [ ] PLAN-READY.md gerado
- [ ] CEO apresentou resumo ao dono
- [ ] Commit final feito
- [ ] .plano/governance/approvals.log tem entries de TODOS supervisores e chiefs
</success_criteria>
