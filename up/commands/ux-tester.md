---
name: up:ux-tester
description: Navegar o sistema como usuario real, avaliar experiencia em 6 dimensoes e implementar melhorias automaticamente
argument-hint: "[url ou porta] [--no-fix]"
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
UX Tester: abrir o sistema no browser, navegar como usuario real, avaliar a experiencia em 6 dimensoes (clareza, eficiencia, feedback, consistencia, acessibilidade, performance percebida) e implementar melhorias automaticamente.

NAO e teste funcional. E um auditor de experiencia que USA o sistema e pensa como pessoa real:
- "Esse botao ta no lugar errado"
- "Pra fazer X preciso de 5 cliques, deveria ser 2"
- "Cadê o feedback quando eu submeto?"
- "Essa tela ta confusa, nao sei o que fazer"
- "O loading ta lento aqui"

**Standalone:** Funciona em qualquer projeto, qualquer momento. NAO requer /up:novo-projeto ou .plano/.
**Builder:** Tambem integrado no modo builder (Estagio 4 — Polish).

**Output:** `.plano/ux-review/UX-REPORT.md` com issues priorizadas + melhorias implementadas com commits atomicos + screenshots antes/depois.
</objective>

<execution_context>
@~/.claude/up/workflows/ux-tester.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

**Argumentos opcionais:**
- URL ou porta: `http://localhost:3000` ou `3000` (default: detecta automaticamente)
- `--no-fix`: Apenas gerar relatorio, NAO implementar melhorias

**Se sem argumentos:** Detecta stack, sobe dev server automaticamente, usa porta padrao.

**Se .plano/ existe:** Usa PROJECT.md e REQUIREMENTS.md para entender fluxos.
**Se .plano/ NAO existe:** Descobre fluxos explorando codigo e navegando.

**Cria .plano/ux-review/ automaticamente** (standalone, sem pre-requisitos).
</context>

<process>
Execute the ux-tester workflow from @~/.claude/up/workflows/ux-tester.md end-to-end.

Preserve all workflow gates:
1. Setup (detectar stack, subir server, descobrir fluxos, definir personas)
2. Navegacao como usuario (avaliar 6 dimensoes com screenshots)
3. Gerar UX-REPORT.md com issues priorizadas
4. Implementar melhorias (a menos que --no-fix)
5. Cleanup (matar server, fechar browser)

**Flag --no-fix:** Se presente, pular Passo 4 (implementacao). Apenas gerar relatorio.
</process>
