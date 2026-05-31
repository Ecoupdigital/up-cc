---
name: up:testar
description: Use quando o usuario quer testar o produto. Loop DCRV unico (detectar-corrigir-reverificar) num passe. Default roda tudo (visual, interacao, API, UX, mobile, E2E). Flags --ux/--mobile/--e2e focam.
argument-hint: "[url ou porta] [--ux] [--mobile] [--e2e] [--no-fix]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
  - mcp__plugin_playwright_playwright__*
---
<objective>
Testar um projeto existente de forma exaustiva, num loop DCRV unico (Detectar -> Corrigir -> Re-verificar). Descobre TODAS as paginas e APIs pelo codigo fonte, roda os detectores, corrige issues e gera relatorio.

Funde `/up:testar` (DCRV objetivo) + `/up:ux-tester` (experiencia em 6 dimensoes) + `/up:mobile-first` (responsividade multi-viewport) + `/up:adicionar-testes` (gerar testes unitarios/E2E) + `/up:verificar-trabalho` (gate UAT conversacional).

**Default (sem flag): roda TUDO** — visual, interacao, API, UX, mobile e E2E, num passe consolidado.

**Flags focam o escopo:**
- `--ux` — avalia experiencia em 6 dimensoes (clareza, eficiencia, feedback, consistencia, acessibilidade, performance percebida) e melhora.
- `--mobile` — responsividade em mobile/tablet sem quebrar desktop (desktop e a referencia sagrada; reverte se desktop mudar).
- `--e2e` — foca em gerar/rodar testes E2E + unitarios (ex-adicionar-testes: classifica TDD/E2E/Pular, gera com RED-GREEN).

**Standalone:** funciona em qualquer projeto, qualquer momento. NAO requer `.plano/` nem `/up`.

**Output:** `.plano/teste/` com DCRV-REPORT.md, issues resolvidas, screenshots antes/depois.
</objective>

<execution_context>
@~/.claude/up/workflows/dcrv.md
@~/.claude/up/references/engineering-principles.md
</execution_context>

<context>
$ARGUMENTS

**Argumentos opcionais:**
- URL ou porta: `http://localhost:3000` ou `3000` (default: detecta automaticamente).
- `--ux` — foca em UX (6 dimensoes).
- `--mobile` — foca em responsividade. Aceita `--page /rota` pra uma pagina so.
- `--e2e` — foca em gerar/rodar testes (TDD unitario + E2E browser).
- `--no-fix` (alias `--report-only`) — apenas relatorio, NAO corrige.

**Se nenhuma flag de foco:** roda o DCRV completo (todos os detectores).
**Se sem argumentos:** detecta stack, sobe dev server, usa porta padrao.
**Se .plano/ existe:** usa PROJECT.md/REQUIREMENTS.md pra entender fluxos. Senao, descobre tudo pelo codigo.
</context>

<process>

## Passo 1: Setup

### 1.1 Detectar Stack e Dev Server

```bash
if [ -f package.json ]; then
  node -e "const p=require('./package.json'); console.log(JSON.stringify({name: p.name, scripts: p.scripts, deps: Object.keys(p.dependencies||{}).slice(0,20)}))"
fi
if [ -f requirements.txt ] || [ -f pyproject.toml ]; then
  echo "Python project detected"
fi
```

Definir $PORT a partir dos argumentos ou detectar automaticamente.

### 1.2 Subir Dev Server

```bash
curl -s http://localhost:${PORT:-3000} > /dev/null 2>&1
if [ $? -ne 0 ]; then
  if [ -f package.json ]; then
    npm run dev > /tmp/up-testar-server.log 2>&1 &
    TESTAR_DEV_PID=$!
  elif [ -f manage.py ]; then
    python manage.py runserver > /tmp/up-testar-server.log 2>&1 &
    TESTAR_DEV_PID=$!
  fi
  for i in $(seq 1 30); do
    curl -s http://localhost:${PORT:-3000} > /dev/null 2>&1 && break
    sleep 1
  done
fi
```

Se nao subir: ERRO — informar usuario.

### 1.3 Descobrir TODAS as Paginas

```bash
echo "=== Descobrindo paginas ==="
# Next.js App Router
find app -name "page.tsx" -o -name "page.ts" 2>/dev/null | grep -v node_modules | sort
# Next.js Pages Router
find pages -name "*.tsx" -o -name "*.ts" 2>/dev/null | grep -v node_modules | grep -v "_app\|_document\|api/" | sort
# React Router (Vite/CRA)
grep -rn "path:" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | grep -v node_modules | head -30
# Python (Django)
grep -rn "path(" */urls.py 2>/dev/null | head -20
# Python (FastAPI) com templates
grep -rn "templates.TemplateResponse\|return.*html" . --include="*.py" 2>/dev/null | head -20
```

Converter caminhos de arquivo para URLs e montar lista `$ROUTES_UI`.

### 1.4 Descobrir TODAS as APIs

```bash
echo "=== Descobrindo APIs ==="
# Next.js App Router API routes
find app -path "*/api/*" -name "route.ts" -o -name "route.js" 2>/dev/null | grep -v node_modules | sort
for route in $(find app -path "*/api/*" -name "route.ts" 2>/dev/null); do
  methods=$(grep -oE "export.*(async )?(function )?(GET|POST|PUT|PATCH|DELETE)" "$route" | grep -oE "GET|POST|PUT|PATCH|DELETE")
  echo "$route: $methods"
done
# Next.js Pages Router API
find pages/api -name "*.ts" -o -name "*.js" 2>/dev/null | sort
# Express/Fastify
grep -rn "app\.\(get\|post\|put\|patch\|delete\)\|router\.\(get\|post\|put\|patch\|delete\)" src/ --include="*.ts" --include="*.js" 2>/dev/null | head -30
# FastAPI (Python)
grep -rn "@app\.\(get\|post\|put\|patch\|delete\)\|@router\.\(get\|post\|put\|patch\|delete\)" . --include="*.py" 2>/dev/null | head -30
# tRPC
grep -rn "\.query\|\.mutation" src/ --include="*.ts" 2>/dev/null | grep -i "router\|procedure" | head -20
# Supabase Edge Functions
ls supabase/functions/*/index.ts 2>/dev/null
```

Montar lista `$ROUTES_API` com metodo + path.

### 1.5 Parsear Flags e Definir Escopo

- `--ux` -> SCOPE inclui auditoria de experiencia (6 dimensoes).
- `--mobile` -> SCOPE inclui responsividade multi-viewport (aceita `--page /rota`).
- `--e2e` -> SCOPE inclui geracao/execucao de testes (TDD unitario + E2E browser).
- **Nenhuma flag de foco** -> SCOPE = TUDO (visual + interacao + API + UX + mobile + E2E).
- `--no-fix`/`--report-only` -> AUTO_FIX=false.

### 1.6 Reportar Descoberta e Criar Diretorio

```bash
mkdir -p .plano/teste
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > TESTAR — DESCOBERTA COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Projeto: [nome]   Stack: [...]   Dev server: http://localhost:{PORT}
Paginas: {N}   APIs: {N}   Escopo: [tudo | ux | mobile | e2e]
Iniciando testes...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Passo 2: Rodar DCRV

**Referencia:** `@~/.claude/up/workflows/dcrv.md`

Executar o workflow DCRV com:
```
SCOPE=global
PORT={porta}
MAX_CYCLES=3
MAX_ISSUES_PER_CYCLE=20
AUTO_FIX={true ou false}
ROUTES_UI={paginas}
ROUTES_API={APIs}
DCRV_DIR=.plano/teste
PASSES={derivado das flags: visual, interacao, api sempre; ux se --ux ou default; mobile se --mobile ou default; e2e se --e2e ou default}
```

O DCRV (workflow unico, ja absorveu ux-tester / mobile-first / builder-e2e) cuida de:
1. Visual em todas paginas (3 viewports, CSS extraction, screenshots)
2. API Tester (happy path, payloads invalidos, auth, edge cases)
3. Exhaustive Tester (clicar em CADA elemento)
4. UX (6 dimensoes) — quando no escopo
5. Mobile (responsividade, desktop sagrado) — quando no escopo
6. E2E + geracao de testes (TDD/E2E classificados, RED-GREEN) — quando no escopo
7. Consolidar issues -> se AUTO_FIX: dispatcher roteia pra correcao -> re-verificar -> loop ate resolver ou max ciclos

## Passo 3: Carregar Design Tokens (se existir)

```bash
cat .plano/DESIGN-TOKENS.md 2>/dev/null
cat tailwind.config.ts tailwind.config.js 2>/dev/null | head -50
cat app/globals.css src/globals.css styles/globals.css 2>/dev/null | head -50
```

Passar como referencia para os detectores visuais.

## Passo 4: Gate UAT (ex-verificar-trabalho)

Se `.plano/` tem fase ativa com plano, rodar gate UAT conversacional:
- Testar cada feature planejada contra REQUIREMENTS.
- Coletar feedback do usuario via AskUserQuestion.
- Gerar/atualizar `VERIFICATION.md` na pasta da fase.
- Se gaps: oferecer `/up:plan <fase> --gaps` pra planejar correcoes.
- Se aprovado: marcar a fase como verificada.

## Passo 5: Cleanup

```bash
if [ -n "$TESTAR_DEV_PID" ]; then kill $TESTAR_DEV_PID 2>/dev/null; fi
```
Fechar browser se aberto.

## Passo 6: Apresentar Resultado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > TESTE COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Detector | Score | Detalhes |
|----------|-------|----------|
| Visual    | {N}/10 | {issues} em {paginas} paginas |
| Interacao | {N}% pass | {passed}/{total} elementos |
| API       | {N}% pass | {passed}/{total} testes |
| UX        | {N}/10 | (se no escopo) |
| Mobile    | {N}/10 | (se no escopo) |
| E2E       | {M} testes | {pass}/{total} (se no escopo) |

| Severidade | Encontradas | Corrigidas | Pendentes |
|-----------|-------------|-----------|-----------|
| Critical | {N} | {N} | {N} |
| High | {N} | {N} | {N} |
| Medium | {N} | {N} | {N} |
| Low | {N} | — | {N} |

Relatorio: .plano/teste/DCRV-REPORT.md   Screenshots: .plano/teste/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<success_criteria>
- [ ] Stack detectada e dev server rodando
- [ ] TODAS paginas e APIs descobertas pelo codigo fonte
- [ ] Flags parseadas (default = roda tudo)
- [ ] DCRV rodou os passes do escopo (visual/interacao/api + ux/mobile/e2e conforme flags)
- [ ] Issues consolidadas com severidade e corrigidas (se nao --no-fix)
- [ ] Gate UAT rodado quando ha fase ativa (VERIFICATION.md)
- [ ] DCRV-REPORT.md gerado e resumo apresentado
</success_criteria>
