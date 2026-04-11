<purpose>
Workflow `/up:build` — Execucao de projeto previamente planejado.

Requer `.plano/PLAN-READY.md` (gerado por `/up:plan`).

Conduz Estagios 3 (Build) + 4 (Quality Gate) + 4.5 (Delivery Audit) + 5 (Delivery).

Pode executar projeto planejado em outro runtime — confia no PLAN-READY.md.
</purpose>

<core_principle>
Este workflow assume que o projeto foi completamente planejado por `/up:plan`.

Diferenca do builder:
- Builder: planeja + executa em sequencia, no mesmo runtime
- Build: SO executa, le PLAN-READY.md gerado anteriormente (mesmo runtime ou outro)

**Sem model routing** — runtime decide o modelo.

**Re-plan local permitido (max 2):**
Se durante execucao o execution-supervisor detectar que um plano esta inviavel,
ele pode pedir REQUEST_REPLAN. O planejador local refaz o plano daquela fase.
NUNCA volta pro runtime que planejou originalmente.
</core_principle>

<process>

## Estagio 0: GATES OBRIGATORIOS

### 0.1 Owner Profile (LOCAL)

```bash
if [ ! -f ~/.claude/up/owner-profile.md ]; then
  echo "Owner profile nao existe NESTE runtime. Rodando /up:onboard..."
  # Delegar pro workflow onboarding.md
fi
```

**IMPORTANTE:** O profile e do RUNTIME ATUAL, nao do runtime que planejou. Cada runtime tem seu profile.

### 0.2 PLAN-READY.md Existe?

```bash
if [ ! -f .plano/PLAN-READY.md ]; then
  echo "ERRO: Este projeto nao foi planejado."
  echo ""
  echo "Use /up:plan primeiro pra planejar o projeto."
  echo "Ou /up:modo-builder pra planejar e executar de uma vez."
  exit 1
fi
```

### 0.3 Crash Recovery

```bash
ls .plano/LOCK.md 2>/dev/null
```

Se LOCK.md existe e `stage: build`: retomar.

## Estagio V: VALIDACAO LIGHT

**Confiar no PLAN-READY.md, mas spot-check estrutura.**

### V.1 Parsear PLAN-READY.md

```bash
# Extrair frontmatter
PLANNED_RUNTIME=$(grep "runtime:" .plano/PLAN-READY.md | head -1 | awk '{print $2}')
INTENDED_RUNTIME=$(grep -A1 "intended_execution:" .plano/PLAN-READY.md | tail -1 | awk '{print $2}')
TOTAL_PHASES=$(grep "total_phases:" .plano/PLAN-READY.md | awk '{print $2}')
CONFIDENCE=$(grep "planning_confidence:" .plano/PLAN-READY.md | awk '{print $2}')
```

### V.2 Validacao de Compatibilidade

```bash
CURRENT_RUNTIME="claude-code"  # detectar
[ -d ~/.config/opencode ] && CURRENT_RUNTIME="opencode"
[ -d ~/.gemini ] && CURRENT_RUNTIME="gemini-cli"

# Se intended_execution especifica um runtime e nao e o atual, alertar
if [ "$INTENDED_RUNTIME" != "same" ] && [ "$INTENDED_RUNTIME" != "any" ] && [ "$INTENDED_RUNTIME" != "$CURRENT_RUNTIME" ]; then
  echo "AVISO: Plano gerado pra $INTENDED_RUNTIME, voce esta em $CURRENT_RUNTIME"
  echo "Pode haver incompatibilidades. Continuar mesmo assim?"
  # AskUserQuestion sim/nao
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

Pra cada plano listado em PLAN-READY.md, checar se arquivo existe:

```bash
# Extrair lista de planos do PLAN-READY.md
PLANS=$(grep -oE "fases/[0-9]+-[a-z-]+/[0-9]+-[0-9]+-PLAN.md" .plano/PLAN-READY.md)

for plan in $PLANS; do
  if [ ! -f ".plano/$plan" ]; then
    echo "FALTANDO: $plan"
    FAIL=1
  fi
done
```

### V.5 Decidir

**Se todos arquivos OK:** prosseguir.

**Se algo falta:** 
- Alertar usuario
- Oferecer: "Posso planejar localmente?" (re-roda /up:plan)
- Ou abortar

## Estagio C: CEO CONFIRMA

Spawnar CEO local:

```python
Agent(
  subagent_type="up-project-ceo",
  prompt="""
    Confirmar execucao de projeto previamente planejado.
    
    <files_to_read>
    - ~/.claude/up/owner-profile.md (perfil LOCAL deste runtime)
    - .plano/BRIEFING.md (briefing original)
    - .plano/PLAN-READY.md (resumo do planejamento)
    - .plano/AUDIT-PLAN.md (audit do planejamento)
    - .plano/PENDING.md
    </files_to_read>
    
    Apresentar ao dono:
    - "Detectei projeto planejado em {runtime} por {ceo_name_anterior}"
    - Resumo: N fases, M planos
    - Planning confidence: X/100
    - Pendencias conhecidas
    - "Iniciar execucao? (enter pra continuar)"
    
    Se dono confirmar: prosseguir.
    Se recusar: abortar.
  """
)
```

## Estagio 3: BUILD (loop por fase)

**Mesmo processo do builder.md secao Estagio 3, mas SEM model routing.**

Para cada fase em ROADMAP.md (em ordem):

### 3.1 Carregar Plano da Fase

```bash
PHASE_DIR=$(ls -d .plano/fases/{phase_number}-* 2>/dev/null)
PLAN=$(ls "$PHASE_DIR"/*-PLAN.md | head -1)
```

### 3.2 Detectar Tipo de Plano (Specialist Routing)

Ler o frontmatter do plano pra determinar qual specialist usar:
- Frontend tasks → up-frontend-specialist
- Backend tasks → up-backend-specialist
- Database tasks → up-database-specialist
- Misto → up-executor

### 3.3 Spawnar Specialist

```python
Agent(
  subagent_type="{up-specialist}",
  prompt=f"""
    Executar Plano da Fase {phase_number}.
    
    <engineering_principles_compressed>
    1. Implementacao real, nao simulacao (zero placeholder, zero stub)
    2. Correto, nao rapido (sem `any`, validacao com lib, queries parametrizadas)
    3. Conectado ponta a ponta (componente → API → DB com dados fluindo)
    4. Consistencia (grep por pattern existente antes de inventar)
    5. Dados reais desde o primeiro momento (sem hardcode)
    6. Cada decisao tem custo futuro (escolher solucao escalavel)
    
    Em duvida entre rapido e correto: sempre o correto.
    Sob demanda: Read references/engineering-principles.md para exemplos.
    </engineering_principles_compressed>
    
    <production_requirements_compressed>
    Categorias a respeitar (71 requisitos no total):
    - UIST (UI States): loading/error/empty/success em TODA operacao async
    - ERR (Error handling): boundaries, try/catch, sessao expirada, 404
    - PERF: lazy loading, code split, debounce, pagination > 20 items, cache
    - FORM: validacao inline, mensagens especificas, autofocus, mascaras
    - RESP: 375px funcional, touch 44x44, hamburger mobile
    - A11Y: alt, labels, focus visible, keyboard, contraste 4.5:1
    - SEC: rotas protegidas, CSRF, XSS, rate limit, env vars, RLS
    - POLISH: hover, transicoes 150-300ms, design tokens
    
    Sob demanda: Read references/production-requirements.md para IDs especificos.
    </production_requirements_compressed>
    
    <files_to_read>
    TIER 1 — Sempre:
    - {PLAN}
    - .plano/STATE.md
    - ./CLAUDE.md (se existir)
    
    TIER 2 — Se a slice da fase existe (v0.7.0+):
    - .plano/fases/{phase_number}/PHASE.md (objetivo da fase)
    - .plano/fases/{phase_number}/REQUIREMENTS-SLICE.md (REQs APENAS desta fase)
    - .plano/DESIGN-TOKENS.md (se for frontend e existir)
    
    TIER 3 — Sob demanda apenas:
    - .plano/PROJECT.md (so se precisar visao geral)
    - .plano/SYSTEM-DESIGN.md (so se decisao de arquitetura aparecer)
    - .plano/REQUIREMENTS.md (so se a slice nao tiver info suficiente)
    </files_to_read>
    
    Implementar todas as tarefas. Commitar atomicamente.
    Gerar SUMMARY.md.
  """
)
```

### 3.4 Execution Supervisor Revisa

```python
Agent(
  subagent_type="up-execution-supervisor",
  prompt=f"""
    Revisar execucao da Fase {phase_number}.
    
    <governance_compressed>
    DECISOES: APPROVE | REQUEST_CHANGES | REQUEST_REPLAN | ESCALATE
    REWORK: max 3 ciclos antes de forcar approval com debito
    NUNCA APROVAR: trabalho nao verificado, evidencia ambigua, claim sem backing,
                   stub/placeholder, falta de wiring
    </governance_compressed>
    
    <engineering_principles_compressed>
    1. Implementacao real (zero placeholder)
    2. Correto, nao rapido
    3. Conectado ponta a ponta
    4. Consistencia (seguir patterns existentes)
    5. Dados reais
    6. Custo futuro
    </engineering_principles_compressed>
    
    <files_to_read>
    - {PLAN}
    - {PHASE_DIR}/*-SUMMARY.md
    - git diff (use Bash)
    - .plano/fases/{phase_number}/REQUIREMENTS-SLICE.md (se existir)
    
    Sob demanda apenas:
    - $HOME/.claude/up/references/engineering-principles.md (exemplos)
    - $HOME/.claude/up/references/governance-rules.md (hierarquia)
    - $HOME/.claude/up/references/rework-limits.md (fluxos)
    - $HOME/.claude/up/references/production-requirements.md (IDs especificos)
    </files_to_read>
    
    Decisao: APPROVE | REQUEST_CHANGES | REQUEST_REPLAN | ESCALATE
    
    REQUEST_REPLAN: Se descobrir que o plano e fundamentalmente errado/inviavel.
                    Max 2 re-plans por projeto.
  """
)
```

### 3.5 Processar Decisao do Supervisor

**Se APPROVE:** prosseguir.

**Se REQUEST_CHANGES:** re-spawn specialist com feedback (max 3 ciclos).

**Se REQUEST_REPLAN:**

```bash
REPLAN_COUNT=$(cat .plano/governance/replans.log 2>/dev/null | wc -l)
if [ "$REPLAN_COUNT" -ge 2 ]; then
  echo "Max re-plans atingido. Escalando pro CEO."
  # ESCALATE
else
  # Re-planejar fase localmente
  echo "REQUEST_REPLAN aprovado. Re-planejando fase {phase_number} localmente..."
  
  # Spawnar planejador LOCAL
  Agent(
    subagent_type="up-planejador",
    prompt=f"""
      RE-PLAN da Fase {phase_number}.
      
      Plano original: {PLAN}
      Razao do re-plan: {execution_supervisor_reason}
      
      Refaca o plano corrigindo o problema descoberto.
    """
  )
  
  # Salvar como -PLAN-v2.md
  mv "$PLAN" "${PLAN%-PLAN.md}-PLAN-v1.md"
  # novo plano vira PLAN principal
  
  # Registrar
  echo "$(date -u) | phase-{phase_number} | execution-supervisor | REPLAN | reason: {reason}" >> .plano/governance/replans.log
  
  # Planning-supervisor revisa novo plano
  Agent(subagent_type="up-planning-supervisor", ...)
  
  # Voltar pro 3.3 (re-spawn specialist)
fi
```

**Se ESCALATE:** chief-engineer entra.

### 3.6 Verificacao

```python
Agent(subagent_type="up-verificador", ...)
Agent(subagent_type="up-verification-supervisor", ...)
```

### 3.7 E2E + DCRV

Ver builder.md secao 3.1.5 (E2E) e 3.1.5.1 (DCRV).

### 3.8 Chief-engineer Aprova Fase

```python
Agent(
  subagent_type="up-chief-engineer",
  prompt="Revisar Fase {phase_number} consolidada."
)
```

### 3.9 Marcar Completa e Avancar

## Estagio 4: QUALITY GATE GLOBAL

Mesmo processo do builder.md secao Estagio 4. Sem model routing.

## Estagio 4.5: DELIVERY AUDIT

```python
Agent(subagent_type="up-delivery-auditor", ...)
```

## Estagio 5: DELIVERY

Mesmo processo. CEO local apresenta resultado.

### 5.X Marcar Projeto Completo

```bash
# PLAN-READY.md → PROJECT-COMPLETE.md
mv .plano/PLAN-READY.md .plano/PROJECT-COMPLETE.md
```

Adicionar ao frontmatter:
```yaml
status: complete
completed_at: [timestamp]
completed_by:
  runtime: [current]
  ceo_name: [local]
final_confidence: [from audit]
```

</process>

<replans>

## Re-plans Locais (max 2)

Quando: execution-supervisor descobre que o plano original esta inviavel.

Como funciona:

```
Execution falha
  ↓
execution-supervisor analisa
  ↓
Decide: REQUEST_REPLAN
  ↓
Verifica replans.log < 2?
  ├─ Sim: prosseguir
  └─ Nao: ESCALATE pro CEO
  ↓
Spawnar planejador LOCAL no runtime atual
  ↓
Refaz plano daquela fase
  ↓
Salva como PLAN-v2.md (preserva v1 pra historico)
  ↓
Planning-supervisor LOCAL revisa
  ↓
Se APPROVE: voltar pro executor com novo plano
Se REJECT: ESCALATE pro chief-engineer
```

Registro em `.plano/governance/replans.log`:
```
2026-04-11T15:30:00Z | phase-3 | execution-supervisor | REPLAN | cycle 1/2
  reason: Library X discontinued, need to use Y instead
  original_plan: 03-01-PLAN-v1.md
  new_plan: 03-01-PLAN.md (was v2)
```

</replans>

<success_criteria>
- [ ] Owner profile LOCAL validado
- [ ] PLAN-READY.md existe e parseado
- [ ] Validacao light passou (artefatos + planos existem)
- [ ] CEO confirmou execucao
- [ ] Todas fases executadas com supervisao
- [ ] Re-plans registrados (se houve)
- [ ] Quality Gate global passou
- [ ] Delivery audit aprovou
- [ ] CEO apresentou resultado
- [ ] PLAN-READY.md → PROJECT-COMPLETE.md
</success_criteria>
