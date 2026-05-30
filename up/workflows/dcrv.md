<purpose>
Workflow DCRV (Detectar → Classificar → Resolver → Verificar) — loop de qualidade unico do UP.

Roda os detectores (Visual Critic, Exhaustive Tester, API Tester), consolida issues, despacha para
especialistas corrigirem, e re-verifica. Loop ate resolver ou atingir max ciclos.

Este e o workflow UNICO de `/up:testar` no redesign v2. Absorveu builder-e2e.md (E2E + smoke + console
errors), ux-tester.md (avaliacao em 6 dimensoes), mobile-first.md (responsividade por breakpoint) e
verificar-trabalho.md (gate UAT). Tudo vira FLAG/MODO sobre o mesmo loop. Default = roda tudo.

**Scopes de uso:**
- **Por fase (build):** Testa apenas paginas/rotas da fase recem-executada. Inclui E2E da fase.
- **Global (quality gate):** Testa TODAS as paginas/rotas do projeto. Inclui smoke + E2E + responsividade.
- **Light (1 ciclo):** Roda detectores + reporta, sem loop de correcao.

**Flags de `/up:testar` (default = todas ligadas):**
- `--ux`: alem dos detectores, avalia as 6 dimensoes de UX (clareza, eficiencia, feedback, consistencia,
  a11y basica, performance percebida) e gera UX-REPORT.md.
- `--mobile`: testa responsividade por breakpoint (375px, 768px, 1024px), touch 44x44, hamburger;
  detecta e corrige problemas sem quebrar desktop.
- `--e2e`: smoke test de rotas + fluxos E2E principais + erros de console (absorve builder-e2e). No
  build, roda por fase automaticamente.
- gate UAT (absorve verificar-trabalho): cria/retoma `.plano/fases/XX/{N}-UAT.md` (sobrevive a /clear)
  com testes de aceitacao; alimenta lacunas de volta pra `/up:plan`.

**Parametros esperados no prompt:**
- `$SCOPE`: "phase" | "global" | "light"
- `$PHASE_DIR`, `$PHASE_NUMBER`: se scope=phase
- `$ROUTES`: rotas a testar (vazio = descobre automaticamente)
- `$PORT`: porta do dev server (default: 3000)
- `$MAX_CYCLES`: default 3 (phase), 5 (global), 1 (light)
- `$MAX_ISSUES_PER_CYCLE`: default 15 (phase), 20 (global)
- `$AUTO_FIX`: true | false
- `$MODES`: subconjunto de {ux, mobile, e2e, uat} (vazio = roda tudo aplicavel ao projeto)

Spawns (todos sobreviventes): up-visual-critic, up-api-tester, up-exhaustive-tester (detectores);
up-frontend/backend/database-specialist (correcao). Sem agente deletado.

**Evidencia para o GATE de fase (Fase 3 - TDD por tipo).** Quando rodado por fase no build, este loop
PRODUZ a evidencia que o GATE exige no approvals.log (`evidence=<tipo>:<resultado>`):
- **ui:visual** - a captura visual antes/depois do `up-visual-critic` (screenshots em `{$DCRV_DIR}`) e a
  evidencia de fases de UI/CSS. O VISUAL-REPORT.md + as imagens sao o artefato que o up-revisor confirma.
- **glue:smoke** - o smoke-test do modo E2E (navegar rotas / exercitar a integracao, capturar erros de
  console / status) e a evidencia de fases de integracao (Asaas/uazapi/etc).
- **logic:test_pass** - fases de logica (parser/calculo/API-propria/bugfix) provam via teste red-green no
  verificador (fora deste loop); o DCRV nao e a fonte para `logic`.
O up-revisor (build 3.7) le esses artefatos e carimba o campo `evidence` no approvals.log. Nenhum CLI novo:
a evidencia sao os relatorios/screenshots ja gerados aqui.
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

    Capturar screenshot de CADA pagina testada em {$DCRV_DIR}/captures/ (antes/depois quando houver
    correcao). Estas capturas sao a EVIDENCIA ui:visual do GATE de fase (Fase 3 - TDD por tipo).

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

<absorbed_modes>
## Modos absorvidos (flags de /up:testar)

Estes modos rodam JUNTO do loop DCRV (mesmos detectores, mesmo dispatcher de correcao). Default: todos
os aplicaveis ao projeto. As flags `--ux/--mobile/--e2e` restringem a um subconjunto.

### Modo E2E (absorve builder-e2e.md)

Ativado por `--e2e`, e SEMPRE no build (scope=phase) e no quality gate (scope=global).

1. **Subir/garantir dev server** (Passo 0.1 ja faz). Manter rodando entre fases (nao matar a cada fase).
2. **Smoke test de rotas:** navegar cada rota descoberta, capturar erros de console
   (`browser_console_messages level=error`) e screenshot. Rota que da tela branca/erro -> issue critical.
3. **Fluxos E2E principais (scope=global):** identificar 2-4 fluxos do dominio (ex: signup -> login ->
   acao core) e executa-los ponta a ponta via Playwright. Falha de fluxo -> issue high/critical.
4. **Por fase (scope=phase):** extrair os testes/criterios da fase do SUMMARY e exercitar so o que a
   fase tocou. Erros de console globais entram no issue board.
5. As issues E2E entram no ISSUE-BOARD junto das dos detectores e seguem o mesmo loop de correcao.
6. **Evidencia glue:smoke (Fase 3 - TDD):** o smoke de rotas + a verificacao da integracao (status/console
   limpos apos exercitar o fluxo) sao a evidencia que o GATE de fase exige para fases de integracao
   (Asaas/uazapi/etc). Registrar o resultado do smoke no relatorio para o up-revisor confirmar (glue:smoke).

### Modo UX (absorve ux-tester.md)

Ativado por `--ux`. Apos os detectores, navegar o sistema como usuario real e avaliar 6 dimensoes,
gerando `{$DCRV_DIR}/UX-REPORT.md` com score por dimensao:

1. **Clareza** — proposito de cada tela e obvio? CTAs claros?
2. **Eficiencia** — numero de cliques pra completar tarefas core; atalhos.
3. **Feedback** — toda acao tem resposta (loading/sucesso/erro)? (cruza com issues INT-* do exhaustive).
4. **Consistencia** — padroes visuais/interacao uniformes (cruza com issues VIS-* do visual critic).
5. **Acessibilidade basica** — foco visivel, labels, contraste, navegacao por teclado.
6. **Performance percebida** — skeletons, otimismo de UI, ausencia de travas.

Problemas viram issues no board (severidade conforme impacto) e seguem o loop de correcao se `$AUTO_FIX`.

### Modo Mobile (absorve mobile-first.md)

Ativado por `--mobile`. Testar responsividade SEM quebrar desktop:

1. Para cada rota com UI, redimensionar (`browser_resize`) para 375px, 768px, 1024px e capturar.
2. Detectar: overflow horizontal, texto cortado, alvos de toque < 44x44, menu sem hamburger no mobile,
   tabelas nao responsivas, modais que estouram a viewport.
3. Issues entram no board com tipo `responsive`. Correcao via up-frontend-specialist, com instrucao
   explicita de preservar o layout desktop (mobile-first aditivo, nunca regressivo).
4. Re-verificar nos 3 breakpoints apos a correcao.

### Gate UAT (absorve verificar-trabalho.md)

Ativado quando `/up:testar` roda como gate de aceitacao (ou no checkpoint de fim de fase do build):

1. Procurar UAT ativo: `find .plano/fases -name "*-UAT.md"`. Se existe e tem testes `result: [pendente]`,
   RETOMAR (sobrevive a /clear).
2. Senao, criar `.plano/fases/XX-nome/{fase_num}-UAT.md` com os testes de aceitacao derivados dos
   criterios de sucesso da fase / REQUIREMENTS.
3. Conduzir UAT conversacional com o dono (AskUserQuestion), marcando cada teste como pass/fail e
   gravando no UAT.md.
4. Lacunas (testes que falharam) alimentam de volta o planejamento: registrar como pendencias pra
   `/up:plan` tratar numa proxima fase. NAO ha supervisor aqui (UAT humano ja e autoritativo).
</absorbed_modes>

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
