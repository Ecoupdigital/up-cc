---
name: up:verificar-trabalho
description: Validar features atraves de UAT conversacional
argument-hint: "[fase]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
<objective>
Validate implemented features through conversational UAT (User Acceptance Testing).

**Default flow:** Load phase plans -> Test each feature -> Collect feedback -> Generate VERIFICATION.md -> Route to fix or approve

**Orchestrator role:** Read completed plans, run tests and checks, engage user in conversational validation, document results in VERIFICATION.md, create gap closure plans if needed.
</objective>

<execution_context>
@~/.claude/up/workflows/verificar-trabalho.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
Phase: $ARGUMENTS (optional -- defaults to current active phase)

Verification validates that implemented features match the planned requirements.
</context>

<process>
Execute the verificar-trabalho workflow from @~/.claude/up/workflows/verificar-trabalho.md end-to-end.
Preserve all workflow gates (plan loading, testing, user validation, VERIFICATION.md creation, routing).
</process>