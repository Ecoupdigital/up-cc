---
name: up:testar
description: Testar projeto completo — descobre todas paginas e APIs, clica em tudo, testa tudo, corrige o que puder
argument-hint: "[url ou porta] [--no-fix] [--report-only]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - mcp__plugin_playwright_playwright__*
---
<objective>
Testar um projeto existente de forma exaustiva. Descobre TODAS as paginas e APIs pelo codigo fonte, roda os 3 detectores DCRV (Visual Critic, Exhaustive Tester, API Tester), corrige issues encontradas, e gera relatorio completo.

NAO planeja, NAO cria features, NAO faz auditoria de codigo. Apenas TESTA e CORRIGE.

**Standalone:** Funciona em qualquer projeto, qualquer momento. NAO requer .plano/ ou /up:novo-projeto.
**Diferencial:** Teste objetivo — clica em tudo, testa todo endpoint, verifica visual. Nao opina sobre UX.

**Output:** `.plano/teste/` com DCRV-REPORT.md, issues resolvidas, screenshots.
</objective>

<execution_context>
@~/.claude/up/workflows/dcrv.md
@~/.claude/up/references/engineering-principles.md
</execution_context>

<context>
$ARGUMENTS

**Argumentos opcionais:**
- URL ou porta: `http://localhost:3000` ou `3000` (default: detecta automaticamente)
- `--no-fix`: Apenas gerar relatorio, NAO corrigir issues
- `--report-only`: Alias para --no-fix

**Se sem argumentos:** Detecta stack, sobe dev server automaticamente, usa porta padrao.
**Se .plano/ existe:** Usa PROJECT.md para entender o projeto.
**Se .plano/ NAO existe:** Descobre tudo pelo codigo fonte.
</context>

<process>

## Passo 1: Setup

### 1.1 Detectar Stack e Dev Server

```bash
# Detectar stack
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
# Verificar se ja esta rodando
curl -s http://localhost:${PORT:-3000} > /dev/null 2>&1
if [ $? -ne 0 ]; then
  # Detectar comando de dev
  if [ -f package.json ]; then
    npm run dev > /tmp/up-testar-server.log 2>&1 &
    TESTAR_DEV_PID=$!
  elif [ -f manage.py ]; then
    python manage.py runserver > /tmp/up-testar-server.log 2>&1 &
    TESTAR_DEV_PID=$!
  fi
  
  # Esperar ficar pronto (max 30s)
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

# React Router (Vite/CRA) — extrair paths
grep -rn "path:" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | grep -v node_modules | head -30

# Python (Django)
grep -rn "path(" */urls.py 2>/dev/null | head -20

# Python (FastAPI) com templates
grep -rn "templates.TemplateResponse\|return.*html" . --include="*.py" 2>/dev/null | head -20
```

Converter caminhos de arquivo para URLs:
- `app/page.tsx` → `/`
- `app/dashboard/page.tsx` → `/dashboard`
- `app/settings/[tab]/page.tsx` → `/settings/general` (usar primeiro valor provavel)
- `pages/about.tsx` → `/about`

Montar lista `$ROUTES_UI`.

### 1.4 Descobrir TODAS as APIs

```bash
echo "=== Descobrindo APIs ==="

# Next.js App Router API routes
find app -path "*/api/*" -name "route.ts" -o -name "route.js" 2>/dev/null | grep -v node_modules | sort

# Para cada route.ts, extrair metodos exportados
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

### 1.5 Classificar Projeto e Reportar

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > TESTAR — DESCOBERTA COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Projeto: [nome do package.json ou diretorio]
Stack: [Next.js / Vite / FastAPI / etc.]
Dev server: http://localhost:{PORT}

Paginas encontradas: {N}
  [lista de URLs]

APIs encontradas: {N}
  [lista de METHOD /path]

Detectores a rodar:
  [x] Visual Critic ({N} paginas × 3 viewports)
  [x] Exhaustive Tester ({N} paginas, todos elementos)
  [x] API Tester ({N} endpoints, bateria completa)

Iniciando testes...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 1.6 Criar Diretorio de Resultados

```bash
mkdir -p .plano/teste
```

## Passo 2: Rodar DCRV Global

**Referencia:** `@~/.claude/up/workflows/dcrv.md`

Determinar AUTO_FIX baseado nas flags:
- Se `--no-fix` ou `--report-only`: AUTO_FIX=false
- Senao: AUTO_FIX=true

Executar workflow DCRV com parametros:
```
SCOPE=global
PORT={porta do dev server}
MAX_CYCLES=3
MAX_ISSUES_PER_CYCLE=20
AUTO_FIX={true ou false baseado nas flags}
ROUTES_UI={lista de paginas descobertas}
ROUTES_API={lista de APIs descobertas}
DCRV_DIR=.plano/teste
```

O DCRV cuida de:
1. Rodar Visual Critic em todas paginas (3 viewports, CSS extraction, screenshots)
2. Rodar API Tester em todas rotas (happy path, payloads invalidos, auth, edge cases)
3. Rodar Exhaustive Tester em todas paginas (clicar em CADA elemento)
4. Consolidar issues
5. Se AUTO_FIX: dispatcher roteia para especialistas corrigirem
6. Re-verificar correcoes
7. Loop ate resolver ou max ciclos

## Passo 3: Carregar Design Tokens (se existir)

```bash
# Checar se projeto tem design tokens definidos
cat .plano/DESIGN-TOKENS.md 2>/dev/null
# Ou inferir do Tailwind config
cat tailwind.config.ts tailwind.config.js 2>/dev/null | head -50
# Ou de globals.css
cat app/globals.css src/globals.css styles/globals.css 2>/dev/null | head -50
```

Passar como referencia para o Visual Critic.

## Passo 4: Cleanup

```bash
# Matar dev server se nos que subimos
if [ -n "$TESTAR_DEV_PID" ]; then
  kill $TESTAR_DEV_PID 2>/dev/null
fi
```

Fechar browser se aberto.

## Passo 5: Apresentar Resultado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > TESTE COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Scores

| Detector | Score | Detalhes |
|----------|-------|----------|
| Visual | {N}/10 | {issues} issues em {paginas} paginas |
| Interacao | {N}% pass | {passed}/{total} elementos funcionam |
| API | {N}% pass | {passed}/{total} testes passaram |

## Issues

| Severidade | Encontradas | Corrigidas | Pendentes |
|-----------|-------------|-----------|-----------|
| Critical | {N} | {N} | {N} |
| High | {N} | {N} | {N} |
| Medium | {N} | {N} | {N} |
| Low | {N} | — | {N} |

## Top Issues Pendentes (se houver)

[Lista das issues nao corrigidas com descricao]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Relatorio completo: .plano/teste/DCRV-REPORT.md
Screenshots: .plano/teste/

Proximos passos:
- /up:ux-tester — avaliar experiencia do usuario
- /up:melhorias — auditoria de codigo
- /up:modo-builder "nova feature" — adicionar funcionalidade

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<success_criteria>
- [ ] Stack detectada e dev server rodando
- [ ] TODAS paginas descobertas pelo codigo fonte
- [ ] TODAS APIs descobertas pelo codigo fonte
- [ ] Visual Critic rodou em todas paginas (3 viewports)
- [ ] Exhaustive Tester clicou em todos elementos de todas paginas
- [ ] API Tester testou todos endpoints com bateria completa
- [ ] Issues consolidadas com severidade
- [ ] Issues corrigidas (se nao --no-fix)
- [ ] DCRV-REPORT.md gerado em .plano/teste/
- [ ] Resumo apresentado com scores
</success_criteria>
