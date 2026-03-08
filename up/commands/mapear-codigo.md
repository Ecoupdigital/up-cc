---
name: up:mapear-codigo
description: Analisar codebase existente com agentes mapeadores paralelos
argument-hint: "[opcional: area especifica, ex: 'api' ou 'auth']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
---

<objective>
Analyze existing codebase using parallel up-mapeador-codigo agents to produce structured codebase documents.

Each mapper agent explores a focus area and **writes documents directly** to `.plano/codebase/`. The orchestrator only receives confirmations, keeping context usage minimal.

Output: .plano/codebase/ folder with 7 structured documents about the codebase state.
</objective>

<execution_context>
@~/.claude/up/workflows/mapear-codigo.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
Focus area: $ARGUMENTS (optional - if provided, tells agents to focus on specific subsystem)

**Load project state if exists:**
Check for .plano/STATE.md - loads context if project already initialized

**This command can run:**
- Before /up:novo-projeto (brownfield codebases) - creates codebase map first
- After /up:novo-projeto (greenfield codebases) - updates codebase map as code evolves
- Anytime to refresh codebase understanding
</context>

<when_to_use>
**Use mapear-codigo for:**
- Projetos brownfield antes da inicializacao (entender codigo existente primeiro)
- Atualizar mapa do codebase apos mudancas significativas
- Onboarding em codebase desconhecido
- Antes de refatoracao grande (entender estado atual)

**Skip mapear-codigo for:**
- Projetos greenfield sem codigo ainda (nada para mapear)
- Codebases triviais (<5 arquivos)
</when_to_use>

<process>
1. Check if .plano/codebase/ already exists (offer to refresh or skip)
2. Create .plano/codebase/ directory structure
3. Spawn 4 parallel up-mapeador-codigo agents:
   - Agent 1: tech focus -> writes STACK.md, INTEGRATIONS.md
   - Agent 2: arch focus -> writes ARCHITECTURE.md, STRUCTURE.md
   - Agent 3: quality focus -> writes CONVENTIONS.md, TESTING.md
   - Agent 4: concerns focus -> writes CONCERNS.md
4. Wait for agents to complete, collect confirmations (NOT document contents)
5. Verify all 7 documents exist with line counts
6. Commit codebase map
7. Offer next steps (typically: /up:novo-projeto or /up:planejar-fase)
</process>
