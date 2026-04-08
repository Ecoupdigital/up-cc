<purpose>
Mobile First: abrir o sistema no browser, testar em multiplos viewports, identificar o que quebra no mobile/tablet e corrigir automaticamente SEM mexer na experiencia desktop.

Desktop e a referencia sagrada. Cada fix mobile e verificado contra desktop: se desktop mudou, reverte.

Dois modos:
- **Standalone:** `/up:mobile-first` — roda em qualquer projeto, qualquer momento
- **Builder:** roda no Estagio 4 (Polish) automaticamente
</purpose>

<golden_rule>
## Regra de Ouro: Desktop e Sagrado

TODA correcao mobile segue este protocolo:

```
1. Screenshot desktop ANTES (referencia)
2. Snapshot desktop ANTES (estrutura de referencia)
3. Aplicar fix
4. Screenshot + snapshot mobile → melhorou?
   NAO → reverter, tentar outra abordagem
5. Screenshot + snapshot desktop → IGUAL a referencia?
   SIM → commit
   NAO → git checkout -- [arquivos] → tentar abordagem diferente (max 3 tentativas)
```

Se apos 3 tentativas nao conseguir corrigir mobile sem afetar desktop: registrar como "necessita refatoracao manual" e seguir.
</golden_rule>

<tools_required>
Ferramentas Playwright MCP:
- `browser_navigate` — navegar para URL
- `browser_snapshot` — capturar acessibilidade (verificar estrutura)
- `browser_take_screenshot` — capturar visual (comparar antes/depois)
- `browser_click` — clicar
- `browser_type` — digitar
- `browser_fill_form` — preencher formularios
- `browser_hover` — hover
- `browser_resize` — CRITICO: mudar viewport
- `browser_evaluate` — detectar overflow, elementos fora da tela
- `browser_console_messages` — erros JS
- `browser_close` — fechar

Ferramentas de codigo:
- Read, Write, Edit, Glob, Grep, Bash — para implementar correcoes
</tools_required>

<viewports>
## Viewports de Teste

| Nome | Width | Height | Representa |
|------|-------|--------|------------|
| mobile-se | 375 | 667 | iPhone SE |
| mobile | 390 | 844 | iPhone 14 |
| mobile-android | 412 | 915 | Android medio |
| tablet | 768 | 1024 | iPad |
| tablet-landscape | 1024 | 768 | iPad landscape |
| desktop | 1280 | 800 | Laptop |
| desktop-wide | 1920 | 1080 | Monitor full HD |

**Viewport principal de teste:** mobile (390x844) — se funciona aqui, funciona nos outros.
**Viewport de verificacao desktop:** desktop-wide (1920x1080) — referencia sagrada.
**Extras testados no scan:** todos os acima para relatorio completo.
</viewports>

<process>

## Passo 1: Setup

### 1.1 Detectar Stack CSS

```bash
# Detectar framework CSS
if [ -f tailwind.config.js ] || [ -f tailwind.config.ts ]; then
  echo "TAILWIND"
elif grep -q "styled-components\|@emotion" package.json 2>/dev/null; then
  echo "CSS_IN_JS"
elif ls src/**/*.module.css 2>/dev/null | head -1; then
  echo "CSS_MODULES"
else
  echo "CSS_PLAIN"
fi
```

Definir `$CSS_STACK` = tailwind | css_in_js | css_modules | css_plain

**Ler config do Tailwind (se existir):**
```bash
cat tailwind.config.* 2>/dev/null | head -30
```
Extrair breakpoints customizados (screens: { sm, md, lg, xl }).

### 1.2 Subir Dev Server

```bash
# Detectar e subir (mesmo processo dos outros workflows)
if [ -f package.json ]; then
  node -e "const p=require('./package.json'); console.log(JSON.stringify(p.scripts||{}))"
fi
```

Subir em background, esperar ate 30s.

### 1.3 Descobrir Paginas

```bash
# Next.js App Router
find app -name "page.tsx" -o -name "page.ts" 2>/dev/null | grep -v node_modules | head -30

# Next.js Pages Router
find pages -name "*.tsx" -o -name "*.ts" 2>/dev/null | grep -v node_modules | grep -v "_app\|_document" | head -30

# Vite/React (routes)
grep -r "path:" src/ --include="*.tsx" --include="*.ts" 2>/dev/null | head -20
```

Se `--page` foi especificado: testar apenas essa pagina.

### 1.4 Criar Diretorios

```bash
mkdir -p .plano/mobile-review/screenshots/desktop .plano/mobile-review/screenshots/mobile .plano/mobile-review/screenshots/tablet .plano/mobile-review/screenshots/fixes
```

## Passo 2: SCAN — Mapear Estado Atual

### 2.1 Capturar Referencia Desktop

Para cada pagina:

```
browser_resize(width: 1920, height: 1080)
browser_navigate(url: "$BASE_URL/[rota]")
```

Esperar 2s para carregamento completo.

```
browser_take_screenshot(
  type: "png",
  filename: ".plano/mobile-review/screenshots/desktop/[rota-slug].png"
)
browser_snapshot(
  filename: ".plano/mobile-review/screenshots/desktop/[rota-slug]-snapshot.md"
)
```

**Salvar snapshot desktop como REFERENCIA** — sera comparado depois de cada fix.

### 2.2 Capturar Mobile

```
browser_resize(width: 390, height: 844)
browser_navigate(url: "$BASE_URL/[rota]")
```

```
browser_take_screenshot(
  type: "png",
  filename: ".plano/mobile-review/screenshots/mobile/[rota-slug].png"
)
browser_snapshot(
  filename: ".plano/mobile-review/screenshots/mobile/[rota-slug]-snapshot.md"
)
```

### 2.3 Capturar Tablet

```
browser_resize(width: 768, height: 1024)
browser_navigate(url: "$BASE_URL/[rota]")
```

```
browser_take_screenshot(
  type: "png",
  filename: ".plano/mobile-review/screenshots/tablet/[rota-slug].png"
)
```

### 2.4 Detectar Problemas por Pagina

Para cada pagina no viewport mobile (390x844):

**A. Overflow horizontal:**
```javascript
browser_evaluate(function: "() => {
  const hasOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
  const overflowPx = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return JSON.stringify({ hasOverflow, overflowPx });
}")
```

**B. Elementos fora da viewport:**
```javascript
browser_evaluate(function: "() => {
  const vw = window.innerWidth;
  const issues = [];
  document.querySelectorAll('*').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (rect.right > vw + 5) {
        issues.push({
          tag: el.tagName.toLowerCase(),
          class: (el.className || '').toString().slice(0, 80),
          id: el.id || '',
          width: Math.round(rect.width),
          overflow: Math.round(rect.right - vw)
        });
      }
    }
  });
  return JSON.stringify(issues.slice(0, 30));
}")
```

**C. Texto ilegivel (muito pequeno):**
```javascript
browser_evaluate(function: "() => {
  const issues = [];
  document.querySelectorAll('p, span, a, li, td, th, label, input, button, h1, h2, h3, h4, h5, h6').forEach(el => {
    const style = getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    if (fontSize > 0 && fontSize < 12 && el.textContent.trim().length > 0) {
      issues.push({
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().slice(0, 40),
        fontSize: fontSize,
        class: (el.className || '').toString().slice(0, 60)
      });
    }
  });
  return JSON.stringify(issues.slice(0, 20));
}")
```

**D. Alvos de toque muito pequenos:**
```javascript
browser_evaluate(function: "() => {
  const issues = [];
  document.querySelectorAll('a, button, input, select, textarea, [role=button], [onclick]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (rect.width < 44 || rect.height < 44) {
        issues.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || el.value || '').trim().slice(0, 30),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          class: (el.className || '').toString().slice(0, 60)
        });
      }
    }
  });
  return JSON.stringify(issues.slice(0, 20));
}")
```

**E. Overlapping/sobreposicao:**
```javascript
browser_evaluate(function: "() => {
  const issues = [];
  const interactive = document.querySelectorAll('a, button, input, [role=button]');
  const rects = Array.from(interactive).map(el => ({
    el: el.tagName + '.' + (el.className || '').toString().slice(0, 30),
    rect: el.getBoundingClientRect()
  })).filter(r => r.rect.width > 0);
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].rect, b = rects[j].rect;
      if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
        issues.push({ el1: rects[i].el, el2: rects[j].el });
      }
    }
  }
  return JSON.stringify(issues.slice(0, 10));
}")
```

**F. Checar console por erros:**
```
browser_console_messages(level: "error")
```

### 2.5 Compilar Lista de Problemas

Para cada pagina, classificar problemas encontrados:

| Severidade | Criterio |
|-----------|---------|
| **Critico** | Pagina inutilizavel (overflow total, conteudo invisivel, form inacessivel) |
| **Grave** | Funcionalidade comprometida (botao inatingivel, texto cortado, navegacao quebrada) |
| **Moderado** | Experiencia ruim (espacamento errado, fonte pequena, alvo de toque pequeno) |
| **Menor** | Cosmetico (alinhamento, margem, visual) |

## Passo 3: ANALYZE — Entender o Codigo

### 3.1 Mapear Problema → Arquivo

Para cada problema detectado:

1. Identificar o componente/elemento pelo snapshot (tag, class, id)
2. Buscar no codigo:
```bash
# Buscar por className ou componente
grep -r "[classe-do-elemento]" src/ --include="*.tsx" --include="*.ts" --include="*.css" | head -10
```
3. Ler o arquivo fonte
4. Analisar estilos atuais (tem responsive? media queries? classes Tailwind responsive?)

### 3.2 Determinar Estrategia de Fix

**Tailwind:**
- Priorizar classes responsivas existentes: `sm:`, `md:`, `lg:`
- Mobile-first approach: estilo base = mobile, breakpoints = desktop
- Classes comuns: `w-full md:w-1/2`, `flex-col md:flex-row`, `text-sm md:text-base`
- `hidden md:block` / `md:hidden` para show/hide por viewport

**CSS Modules / CSS puro:**
- Adicionar media queries: `@media (max-width: 768px) { ... }`
- Priorizar min-width (mobile-first): `@media (min-width: 768px) { ... }` para desktop

**CSS-in-JS:**
- Adicionar media queries inline ou via theme breakpoints

### 3.3 Plano de Correcoes

Criar lista ordenada por severidade:

```
MOB-001 [critico] /dashboard — overflow horizontal (tabela de 1200px sem scroll)
  → Arquivo: src/components/DataTable.tsx
  → Fix: adicionar overflow-x-auto no container, max-w-full

MOB-002 [grave] /settings — form com inputs lado a lado (nao cabem)
  → Arquivo: src/app/settings/page.tsx
  → Fix: flex-col sm:flex-row nos form groups

MOB-003 [moderado] /home — hero image distorcida
  → Arquivo: src/components/Hero.tsx
  → Fix: object-cover + h-auto + max-w-full
```

## Passo 4: FIX — Corrigir Mobile (Sem Quebrar Desktop)

**NAO corrigir se flag `--no-fix` estiver presente. Pular para Passo 5.**

Para cada problema (ordenado: critico → grave → moderado → menor):

### 4.1 Capturar Referencia Desktop (Pre-Fix)

```
browser_resize(width: 1920, height: 1080)
browser_navigate(url: "$BASE_URL/[rota-do-problema]")
browser_take_screenshot(
  type: "png",
  filename: ".plano/mobile-review/screenshots/fixes/MOB-[NNN]-desktop-antes.png"
)
browser_snapshot()
```

Salvar snapshot como `$DESKTOP_REFERENCE`.

### 4.2 Implementar Fix

Ler arquivo alvo → aplicar correcao.

**Estrategias por tipo de problema:**

**Overflow horizontal:**
```
# Tailwind
<div className="overflow-x-auto">   ← container com scroll
  <table className="min-w-full">    ← tabela full width
```

```
# CSS
.table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
```

**Grid/Flex nao responsivo:**
```
# Tailwind (antes)
<div className="grid grid-cols-3 gap-4">

# Tailwind (depois)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Sidebar fixa:**
```
# Adicionar drawer/overlay no mobile
<aside className="hidden md:block md:w-64">      ← desktop: sidebar visivel
<Sheet>...</Sheet>                                 ← mobile: drawer
```

**Navegacao:**
```
# Desktop: nav horizontal
<nav className="hidden md:flex gap-4">...</nav>

# Mobile: hamburger menu
<Sheet>
  <SheetTrigger className="md:hidden">
    <Menu />
  </SheetTrigger>
  <SheetContent>...</SheetContent>
</Sheet>
```

**Texto/fonte:**
```
# Tailwind
<h1 className="text-2xl md:text-4xl">
<p className="text-sm md:text-base">
```

**Espacamento:**
```
# Tailwind
<div className="p-4 md:p-8">
<section className="my-4 md:my-8">
```

**Imagens:**
```
<img className="w-full h-auto max-w-full object-cover" />
```

**Modais:**
```
# Fullscreen no mobile, dialog no desktop
<Dialog>
  <DialogContent className="w-full h-full sm:w-auto sm:h-auto sm:max-w-lg">
```

### 4.3 Verificar Mobile

```
browser_resize(width: 390, height: 844)
browser_navigate(url: "$BASE_URL/[rota]")
browser_take_screenshot(
  type: "png",
  filename: ".plano/mobile-review/screenshots/fixes/MOB-[NNN]-mobile-depois.png"
)
```

Re-rodar deteccao especifica do problema:
- Se era overflow: checar `scrollWidth > clientWidth`
- Se era texto pequeno: checar fontSize
- Se era alvo pequeno: checar dimensoes

**Se mobile NAO melhorou:** Reverter e tentar abordagem diferente.

### 4.4 Verificar Desktop (CRITICO)

```
browser_resize(width: 1920, height: 1080)
browser_navigate(url: "$BASE_URL/[rota]")
browser_take_screenshot(
  type: "png",
  filename: ".plano/mobile-review/screenshots/fixes/MOB-[NNN]-desktop-depois.png"
)
browser_snapshot()
```

**Comparar snapshot com `$DESKTOP_REFERENCE`:**
- Estrutura de elementos: mesmos elementos presentes?
- Layout: mesmo numero de colunas/linhas?
- Navegacao: mesmos items visiveis?

**Se desktop MUDOU de forma indesejada:**
```bash
git checkout -- [arquivos modificados]
```
Tentar abordagem diferente (max 3 tentativas por problema).

### 4.5 Commit

Se mobile melhorou E desktop intacto:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "responsive(MOB-[NNN]): [descricao curta]" --files [arquivos]
```

### 4.6 Proximo Problema

Repetir 4.1-4.5 para o proximo problema.

## Passo 5: REPORT — Relatorio

Criar `.plano/mobile-review/MOBILE-REPORT.md`:

```markdown
---
tested: [timestamp]
server: [dev command] @ [port]
css_stack: [tailwind/css_modules/css_plain/css_in_js]
pages_tested: [N]
problems_found: [N]
problems_fixed: [N]
problems_failed: [N]
---

# Relatorio Mobile First

## Resumo

**Score de Responsividade:** [1-10]
(1=totalmente quebrado, 10=experiencia mobile impecavel)

| Viewport | Paginas OK | Paginas com Problemas |
|----------|-----------|----------------------|
| Mobile (390px) | [N] | [N] |
| Tablet (768px) | [N] | [N] |
| Desktop (1920px) | [N] (referencia) | -- |

## Problemas por Pagina

### /[rota]

| ID | Severidade | Problema | Status | Screenshot |
|----|-----------|---------|--------|------------|
| MOB-001 | Critico | Overflow horizontal | Corrigido | fixes/MOB-001-*.png |
| MOB-002 | Grave | Form nao cabe | Corrigido | fixes/MOB-002-*.png |
| MOB-003 | Moderado | Fonte pequena | Nao corrigido (quebraria desktop) | -- |

## Correcoes Implementadas

| ID | Problema | Arquivo(s) | O que foi feito | Commit |
|----|---------|-----------|----------------|--------|
| MOB-001 | Overflow tabela | DataTable.tsx | overflow-x-auto + max-w-full | [hash] |
| MOB-002 | Form horizontal | settings/page.tsx | flex-col sm:flex-row | [hash] |

## Antes vs Depois

### MOB-001: Overflow da Tabela
| Desktop Antes | Desktop Depois | Mobile Antes | Mobile Depois |
|--------------|---------------|-------------|--------------|
| fixes/MOB-001-desktop-antes.png | fixes/MOB-001-desktop-depois.png | mobile/dashboard.png | fixes/MOB-001-mobile-depois.png |

## Nao Corrigidos

| ID | Problema | Motivo |
|----|---------|--------|
| MOB-003 | [desc] | Todas tentativas quebraram desktop |

## Screenshots Comparativos (Todas Paginas)

| Pagina | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| / | desktop/index.png | tablet/index.png | mobile/index.png |
| /dashboard | desktop/dashboard.png | tablet/dashboard.png | mobile/dashboard.png |
```

## Passo 6: Cleanup

```bash
kill $DEV_PID 2>/dev/null
```

`browser_close()`

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > MOBILE FIRST — COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Score de Responsividade:** [N]/10

| Viewport | Status |
|----------|--------|
| Desktop (1920px) | Intacto (referencia) |
| Tablet (768px) | [N] problemas → [M] corrigidos |
| Mobile (390px) | [N] problemas → [M] corrigidos |

**Problemas:** [N] encontrados | [M] corrigidos | [K] nao corrigiveis sem refatoracao
**Desktop:** Verificado intacto apos cada correcao

Relatorio: .plano/mobile-review/MOBILE-REPORT.md
Screenshots: .plano/mobile-review/screenshots/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<css_patterns>
## Padroes de Correcao por Stack

### Tailwind CSS (Preferido)

**Principio:** Mobile-first. Estilo base = mobile. Breakpoints adicionam desktop.

```
# Layout responsivo
flex-col md:flex-row
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3

# Visibilidade
hidden md:block          ← aparece so no desktop
md:hidden                ← aparece so no mobile

# Espacamento
p-4 md:p-6 lg:p-8
gap-2 md:gap-4

# Tipografia
text-sm md:text-base lg:text-lg
text-2xl md:text-4xl

# Larguras
w-full md:w-1/2 lg:w-1/3
max-w-full

# Overflow
overflow-x-auto          ← tabelas, conteudo largo

# Imagens
w-full h-auto object-cover
```

### CSS Puro / Modules

```css
/* Mobile first */
.container { padding: 1rem; }
.grid { display: flex; flex-direction: column; gap: 0.5rem; }

/* Tablet */
@media (min-width: 768px) {
  .container { padding: 1.5rem; }
  .grid { flex-direction: row; gap: 1rem; }
}

/* Desktop */
@media (min-width: 1024px) {
  .container { padding: 2rem; }
}
```

### Componentes Novos (se necessario)

**Hamburger Menu (quando nav nao cabe):**
- Usar Sheet/Drawer do shadcn se disponivel
- Ou criar componente com estado open/close
- Desktop: nav normal. Mobile: botao hamburguer + drawer

**Tabela Responsiva (quando tabela estoura):**
- Desktop: tabela normal
- Mobile: card layout ou scroll horizontal com indicador

**Modal Responsivo:**
- Desktop: dialog centralizado com max-width
- Mobile: fullscreen com close button no topo
</css_patterns>

<failure_handling>
## Tratamento de Falhas

**Dev server nao sobe:** Sair com erro.

**Fix quebra desktop:**
- Reverter: `git checkout -- [arquivos]`
- Tentar abordagem diferente (max 3 tentativas)
- Se todas falham: registrar como "necessita refatoracao manual"

**Componente complexo (ex: chart, mapa, canvas):**
- Priorizar container responsivo ao inves de mudar o componente
- `overflow-x-auto` + `min-width` como fallback seguro

**CSS-in-JS sem acesso direto:**
- Wrapper div com classes responsivas
- Media queries no styled-component

**Principio:** Nunca quebrar desktop. Se nao da pra corrigir mobile sem afetar desktop, registrar e seguir.
</failure_handling>

<success_criteria>
- [ ] Dev server subiu
- [ ] Todas paginas escaneadas em 3 viewports (mobile, tablet, desktop)
- [ ] Screenshots de referencia desktop capturados
- [ ] Problemas detectados e classificados por severidade
- [ ] Stack CSS identificada (tailwind/css/etc.)
- [ ] Cada fix verificado: mobile melhorou E desktop intacto
- [ ] Fixes revertidos quando desktop afetado
- [ ] Commits atomicos por correcao
- [ ] MOBILE-REPORT.md gerado com antes/depois
- [ ] Dev server fechado
- [ ] Browser fechado
</success_criteria>
