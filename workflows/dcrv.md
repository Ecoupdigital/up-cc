<purpose>
Workflow DCRV (Detectar → Classificar → Resolver → Verificar) — loop de qualidade reutilizavel.

Roda 3 detectores (Visual Critic, Exhaustive Tester, API Tester), consolida issues, despacha para especialistas corrigirem, e re-verifica. Loop ate resolver ou atingir max ciclos.

**Modos de uso:**
- **Por fase (builder):** Testa apenas paginas/rotas da fase recem-executada
- **Global (quality gate):** Testa TODAS as paginas/rotas do projeto
- **Standalone:** Chamado por /up:executar-fase, /up:rapido, /up:ux-tester, /up:verificar-trabalho
- **Light (1 ciclo):** Roda detectores + reporta, sem loop de correcao

**Parametros esperados no prompt:**
- `$SCOPE`: "phase" | "global" | "light"
- `$PHASE_DIR`: diretorio da fase (se scope=phase)
- `$PHASE_NUMBER`: numero da fase (se scope=phase)
- `$ROUTES`: lista de rotas a testar (se vazio, descobre automaticamente)
- `$PORT`: porta do dev server (default: 3000)
- `$MAX_CYCLES`: max ciclos de correcao (default: 3 para phase, 5 para global, 1 para light)
- `$MAX_ISSUES_PER_CYCLE`: max issues para corrigir por ciclo (default: 15 para phase, 20 para global)
- `$AUTO_FIX`: true | false (se false, apenas reporta sem corrigir)
</purpose>

<process>

## Passo 0: Setup

### 0.1 Detectar o que testar

```bash
# Dev server rodando?
curl -s http://localhost:${PORT:-3000} > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "DEV_SERVER_DOWN"
fi
```

Se dev server nao esta rodando: subir automaticamente.
```bash
if [ -f package.json ]; then
  npm run dev > /tmp/up-dcrv-server.log 2>&1 &
  DCRV_DEV_PID=$!
  for i in $(seq 1 30); do
    curl -s http://localhost:${PORT:-3000} > /dev/null 2>&1 && break
    sleep 1
  done
fi
```

### 0.2 Descobrir rotas (se $ROUTES vazio)

**Se scope=phase:** Ler SUMMARY da fase para extrair rotas criadas/modificadas.
```bash
cat "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null
```

**Se scope=global ou standalone:** Descobrir todas as rotas.
```bash
find app -name "page.tsx" -o -name "page.ts" 2>/dev/null | head -30
find pages -name "*.tsx" -o -name "*.ts" 2>/dev/null | grep -v "_app\|_document\|api/" | head -30
```

**Descobrir rotas API:**
```bash
find app -path "*/api/*" -name "route.ts" 2>/dev/null
find pages/api -name "*.ts" -o -name "*.js" 2>/dev/null
grep -rn "app\.\(get\|post\|put\|patch\|delete\)" src/ --include="*.ts" --include="*.js" 2>/dev/null | head -20
```

### 0.3 Classificar projeto

```
HAS_UI = rotas de pagina encontradas?
HAS_API = rotas de API encontradas?
```

| Projeto | Detectores |
|---------|-----------|
| UI + API | Visual Critic → API Tester → Exhaustive Tester (todos) |
| UI only | Visual Critic → Exhaustive Tester (pular API) |
| API only | API Tester com profundidade extra (pular visual + exhaustive) |
| Infra/schema | Pular DCRV (nada para testar via browser/curl) |

### 0.4 Carregar referencia visual

```bash
cat .plano/DESIGN-TOKENS.md 2>/dev/null
```

Se nao existe: visual critic vai inferir do codebase (e registrar ausencia como issue leve).

### 0.5 Definir output dir

```bash
if [ "$SCOPE" = "phase" ]; then
  DCRV_DIR="$PHASE_DIR/dcrv"
elif [ "$SCOPE" = "global" ]; then
  DCRV_DIR=".plano/dcrv"
else
  DCRV_DIR=".plano/dcrv"
fi
mkdir -p "$DCRV_DIR"
```

## Passo 1: Detectar (Rodar Detectores)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DCRV > DETECTANDO — CICLO {CYCLE}/{MAX_CYCLES}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Ordem obrigatoria: Visual → API → Exhaustive**
(Visual so observa, API usa curl, Exhaustive clica em tudo — minimiza interferencia)

### 1.1 Visual Critic (se HAS_UI)

```python
Agent(
  subagent_type="up-visual-critic",
  prompt="""
    Avaliar qualidade visual.
    
    <files_to_read>
    - .plano/DESIGN-TOKENS.md (referencia visual, se existe)
    </files_to_read>
    
    Paginas a testar: {$ROUTES_UI}
    Dev server: http://localhost:{$PORT}
    
    Salvar relatorio em: {$DCRV_DIR}/VISUAL-REPORT.md
    Salvar issues em: {$DCRV_DIR}/VISUAL-ISSUES.json
  """
)
```

### 1.2 API Tester (se HAS_API)

```python
Agent(
  subagent_type="up-api-tester",
  prompt="""
    Testar robustez das rotas API.
    
    Rotas a testar: {$ROUTES_API}
    Dev server: http://localhost:{$PORT}
    
    Salvar relatorio em: {$DCRV_DIR}/API-REPORT.md
    Salvar issues em: {$DCRV_DIR}/API-ISSUES.json
  """
)
```

### 1.3 Exhaustive Tester (se HAS_UI)

```python
Agent(
  subagent_type="up-exhaustive-tester",
  prompt="""
    Testar CADA elemento interativo.
    
    Paginas a testar: {$ROUTES_UI}
    Dev server: http://localhost:{$PORT}
    Sem limite de elementos — testar TODOS.
    
    Salvar relatorio em: {$DCRV_DIR}/EXHAUSTIVE-REPORT.md
    Salvar issues em: {$DCRV_DIR}/EXHAUSTIVE-ISSUES.json
  """
)
```

## Passo 2: Classificar (Consolidar Issue Board)

Ler os JSONs de issues dos detectores que rodaram.

### 2.1 Deduplicar

Se visual e exhaustive reportaram o mesmo elemento/pagina: manter a issue mais detalhada.
Criterio: mesmo `page` + mesmo `element` (por texto ou ref) = duplicata.

### 2.2 Classificar por severidade

| Severidade | Criterio |
|-----------|----------|
| critical | Tela branca, crash, auth bypass, perda de dados, app inacessivel |
| high | Funcionalidade principal quebrada, 500 em input basico, botao principal sem efeito |
| medium | Inconsistencia visual, validacao faltando, feedback ausente |
| low | Cosmetico, melhoria de polish, mensagem generica |

### 2.3 Priorizar para correcao

Cap por ciclo: $MAX_ISSUES_PER_CYCLE (default: 15 phase, 20 global)
Prioridade: critical (todas) > high (ate cap) > medium (se sobrar) > low (NUNCA no loop)

### 2.4 Gerar ISSUE-BOARD.md

```markdown
---
cycle: {CYCLE}
timestamp: {now}
total: {N}
critical: {N}
high: {N}
medium: {N}
low: {N}
to_fix: {N}
deferred: {N}
---

# DCRV Issue Board — Ciclo {CYCLE}

## Issues para Correcao (max {MAX_ISSUES_PER_CYCLE})

| ID | Sev | Tipo | Pagina/Rota | Titulo | Detector |
|----|-----|------|-------------|--------|----------|
| VIS-001 | high | visual | /dashboard | Cards com padding inconsistente | visual-critic |
| INT-003 | high | interaction | /dashboard | Botao Exportar sem efeito | exhaustive |
| API-007 | critical | api | POST /api/users | Aceita amount negativo | api-tester |

## Issues Deferidas (low)

| ID | Sev | Tipo | Pagina/Rota | Titulo |
|----|-----|------|-------------|--------|
| VIS-012 | low | visual | /settings | Poderia ter mais breathing room |
```

Escrever em `{$DCRV_DIR}/ISSUE-BOARD.md`.

**Se $AUTO_FIX = false:** Parar aqui. Retornar relatorio sem corrigir.

**Se zero issues para correcao:** Pular para Passo 5 (score perfeito).

## Passo 3: Resolver (Dispatcher + Especialistas)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 DCRV > CORRIGINDO — {N} issues — CICLO {CYCLE}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.1 Diagnosticar e Rotear

Para cada issue a corrigir, o orquestrador FAZ diagnostico rapido:

**Issues visuais (VIS-*):**
```bash
# Encontrar componente da pagina
grep -rn "[rota_ou_componente]" src/ --include="*.tsx" --include="*.ts" | head -5
```
→ Rotear para `up-frontend-specialist`

**Issues de interacao (INT-*):**
```bash
# Verificar se handler existe
grep -rn "onClick\|onSubmit\|onChange" [arquivo_do_componente] | head -10
```
- Handler existe e chama API? → Verificar se API funciona
  - API falha: `up-backend-specialist`
  - API OK, handler bugado: `up-frontend-specialist`
- Handler nao existe: `up-frontend-specialist`
- Handler vazio (`() => {}`): `up-frontend-specialist`

**Issues de API (API-*):**
- Validacao faltando: `up-backend-specialist`
- Schema/dados errados: `up-database-specialist`
- Auth bypass: `up-backend-specialist`
- 500 crash: `up-backend-specialist`

### 3.2 Spawnar Especialistas

Agrupar issues por especialista para eficiencia (1 spawn com multiplas issues em vez de 1 spawn por issue):

```python
Agent(
  subagent_type="up-frontend-specialist",
  prompt="""
    Corrigir as seguintes issues de qualidade:
    
    1. {VIS-001}: {titulo} — {descricao} — Fix: {suggested_fix}
       Arquivo: {path} | Screenshot: {evidence}
    
    2. {INT-003}: {titulo} — {descricao} — Fix: {suggested_fix}
       Arquivo: {path}
    
    Para cada issue:
    - Corrigir o problema
    - Commitar: fix({scope}): {issue_id} — {titulo}
    
    NAO criar SUMMARY.md. Apenas corrigir e commitar.
  """
)
```

### 3.3 Reportar progresso

```
DCRV Ciclo {CYCLE}: {resolved}/{to_fix} issues resolvidas
  ✓ VIS-001: Cards com padding → unificado para 16px
  ✓ INT-003: Botao Exportar → handler conectado a API
  ✗ API-007: Amount negativo → 2 tentativas, nao corrigido
```

## Passo 4: Verificar (Re-rodar Detectores)

Re-rodar APENAS os detectores relevantes, APENAS nas issues que foram corrigidas:

- Issues VIS-* corrigidas → re-rodar visual critic na pagina afetada
- Issues INT-* corrigidas → re-rodar exhaustive tester na pagina afetada
- Issues API-* corrigidas → re-rodar api tester na rota afetada

**Criterio de saida:**
- Todas issues critical/high corrigidas → FIM (sucesso)
- $MAX_CYCLES atingido → FIM (log pendentes)
- Issues nao diminuiram entre ciclos → FIM (stagnation)

**Se mais ciclos:** Voltar para Passo 1 com issues pendentes.

**Se FIM:** Continuar para Passo 5.

## Passo 5: Gerar Relatorio Final

Escrever `{$DCRV_DIR}/DCRV-REPORT.md`:

```markdown
---
scope: {phase | global | light}
completed: {timestamp}
cycles: {N}
total_issues: {N}
resolved: {N}
pending: {N}
deferred_low: {N}
visual_score: {N}/10
exhaustive_pass_rate: {N}%
api_pass_rate: {N}%
---

# DCRV Report

**Scope:** {scope}
**Ciclos:** {cycles_run}/{max_cycles}
**Issues:** {resolved} resolvidas | {pending} pendentes | {deferred} deferidas

## Resumo por Detector

| Detector | Issues | Resolvidas | Pendentes | Score |
|----------|--------|-----------|-----------|-------|
| Visual Critic | {N} | {N} | {N} | {N}/10 |
| Exhaustive Tester | {N} | {N} | {N} | {N}% pass |
| API Tester | {N} | {N} | {N} | {N}% pass |

## Issues Resolvidas

| ID | Titulo | Especialista | Commit |
|----|--------|-------------|--------|
| VIS-001 | Cards padding | frontend | abc123 |

## Issues Pendentes

| ID | Sev | Titulo | Motivo |
|----|-----|--------|--------|
| API-007 | critical | Amount negativo | 2 tentativas, nao corrigido |

## Issues Deferidas (Low)

[Lista para referencia futura]
```

## Passo 6: Retornar

```markdown
## DCRV COMPLETE

**Scope:** {scope}
**Ciclos:** {cycles}/{max}
**Issues:** {resolved}/{total} resolvidas | {pending} pendentes
**Scores:**
- Visual: {N}/10
- Interacao: {N}% pass rate
- API: {N}% pass rate

Relatorio: {$DCRV_DIR}/DCRV-REPORT.md
Issues pendentes: {$DCRV_DIR}/ISSUE-BOARD.md
```

Se scope=phase e tem issues pendentes:
```bash
# Salvar para carryover ao Quality Gate
mkdir -p .plano/issues-carryover
cp "$DCRV_DIR/ISSUE-BOARD.md" ".plano/issues-carryover/phase-${PHASE_NUMBER}.md"
```

</process>

<smoke_regression>
## Smoke Test de Regressao (Opcional — ativado por $REGRESSION=true)

Rodar ANTES dos detectores. Navega paginas de fases anteriores para detectar regressoes.

```
Para cada fase anterior com UI (< fase atual):
  Para cada rota da fase:
    browser_navigate(url)
    browser_console_messages(level: "error")
    browser_take_screenshot(filename: "{$DCRV_DIR}/regression/fase-{N}-{rota}.png")
    Se erro novo: registrar como regressao (severidade HIGH)
```

Regressoes entram no issue board com prioridade maxima (corrigir antes de issues novas).
</smoke_regression>

<success_criteria>
- [ ] Projeto classificado (UI, API, ambos, nenhum)
- [ ] Detectores relevantes executados na ordem correta
- [ ] Issues deduplicadas e classificadas por severidade
- [ ] ISSUE-BOARD.md gerado
- [ ] Dispatcher diagnosticou e roteou corretamente (se auto_fix)
- [ ] Especialistas corrigiram issues com commits atomicos (se auto_fix)
- [ ] Re-verificacao executada nas issues corrigidas (se auto_fix)
- [ ] DCRV-REPORT.md gerado com metricas
- [ ] Issues pendentes salvas para carryover (se scope=phase)
</success_criteria>
