---
name: up:clone-builder
description: Clonar app existente via Playwright — analisa, extrai PRD completo e recria com sua stack usando modo-builder
argument-hint: "[url] [--exact|--improve|--inspiration]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - mcp__context7__*
  - mcp__plugin_playwright_playwright__*
---
<objective>
Clone Builder: acessar um app real via Playwright, analisar TUDO (paginas, features, design, APIs, fluxos, data model) e recriar com sua stack usando o modo-builder.

Pipeline: Crawl → Extract Design → Map Features → Write PRD → Modo Builder (completo)

**5 agentes especializados** analisam o original:
1. **Clone Crawler** — navega tudo, screenshots, intercepta APIs, extrai forms
2. **Design Extractor** — extrai cores, fontes, espacamento, componentes, layout
3. **Feature Mapper** — mapeia modulos, features, roles, data model, fluxos
4. **PRD Writer** — sintetiza em PRD completo e detalhado
5. **Clone Verifier** — verifica fidelidade (funcional + visual) no quality gate

O resultado alimenta o modo-builder que SABE que e um clone e:
- Usa screenshots como referencia visual
- Segue design system extraido
- Replica fluxos exatos
- Verifica fidelidade contra o original

**3 modos:**
- `--exact` (padrao): reproduzir o mais fiel possivel
- `--improve`: reproduzir + aplicar blueprints + melhorias UX
- `--inspiration`: usar como referencia, builder tem liberdade
</objective>

<execution_context>
@~/.claude/up/workflows/clone-builder.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

**Argumentos:**
- URL do app (obrigatorio): https://app.exemplo.com
- `--exact` | `--improve` | `--inspiration` (default: --exact)

**Perguntas que o comando faz (interativo):**
1. URL do app ✓ (do argumento)
2. Credenciais de login (se o app requer auth para ver features)
3. Stack desejada (ou usa builder-defaults.md)
4. Credenciais do banco (Supabase URL/key, etc.)
5. O que quer diferente do original (se --improve ou --inspiration)
</context>

<process>
Execute the clone-builder workflow from @~/.claude/up/workflows/clone-builder.md end-to-end.

**CRITICO:** Apos coletar URL e credenciais, ZERO interacao. Tudo autonomo.
</process>
