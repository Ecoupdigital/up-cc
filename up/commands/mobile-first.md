---
name: up:mobile-first
description: Tornar sistema responsivo para mobile/tablet sem quebrar desktop — detecta problemas via Playwright e corrige automaticamente
argument-hint: "[--no-fix] [--page /rota] [porta]"
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
Mobile First: abrir o sistema no browser em multiplos viewports, detectar o que quebra no mobile/tablet e corrigir automaticamente SEM mexer na experiencia desktop.

Desktop e a referencia sagrada. Cada correcao e verificada: se desktop mudou, reverte.

**Standalone:** Funciona em qualquer projeto, qualquer momento. NAO requer /up:novo-projeto ou .plano/.
**Builder:** Tambem integrado no modo builder (Estagio 4 — Polish).

**Detecta problemas:** overflow horizontal, texto ilegivel, alvos de toque pequenos, grid/flex quebrado, imagens distorcidas, navegacao que nao cabe, modais que estourem, sidebar fixa, sobreposicao de elementos.

**Corrige com:** classes Tailwind responsivas (sm:/md:/lg:), media queries CSS, componentes novos (hamburger menu, drawer, tabela responsiva), ajustes de layout.

**Output:** `.plano/mobile-review/MOBILE-REPORT.md` com score de responsividade, problemas por pagina, screenshots antes/depois em todos viewports.
</objective>

<execution_context>
@~/.claude/up/workflows/mobile-first.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

**Flags:**
- `--no-fix` — Apenas escanear e gerar relatorio, NAO corrigir
- `--page /rota` — Testar apenas uma pagina especifica (ex: `--page /dashboard`)

**Argumentos opcionais:**
- Porta: `3000` ou `http://localhost:3000` (default: detecta automaticamente)

**Exemplos:**
```
/up:mobile-first                          # Escanear tudo e corrigir
/up:mobile-first --no-fix                 # Apenas relatorio
/up:mobile-first --page /dashboard        # Apenas uma pagina
/up:mobile-first 5173                     # Especificar porta
/up:mobile-first --page /settings 3000    # Combinar flags
```

**Cria .plano/mobile-review/ automaticamente** (standalone, sem pre-requisitos).
</context>

<process>
Execute the mobile-first workflow from @~/.claude/up/workflows/mobile-first.md end-to-end.

Preserve all workflow gates:
1. Setup (detectar CSS stack, subir server, descobrir paginas)
2. Scan (capturar todas paginas em mobile/tablet/desktop, detectar problemas)
3. Analyze (mapear problema → arquivo → estrategia de fix)
4. Fix (corrigir cada problema, verificar desktop intacto apos cada um)
5. Report (MOBILE-REPORT.md com screenshots comparativos)
6. Cleanup (matar server, fechar browser)

**Flag --no-fix:** Se presente, pular passo 4 (Fix). Apenas escanear e reportar.
**Flag --page:** Se presente, filtrar para apenas a pagina especificada.
</process>
