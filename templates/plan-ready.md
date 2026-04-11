# PLAN-READY.md Template

Template para `.plano/PLAN-READY.md` — arquivo-flag que indica que o projeto foi
completamente planejado e esta pronto para execucao.

Gerado por `/up:plan` ao final do planejamento.
Lido por `/up:build` como gate de entrada.

<template>

```yaml
---
version: "0.6.0"
planned_at: ""
planned_by:
  runtime: ""           # claude-code | opencode | gemini-cli
  ceo_name: ""
  user_preferred_name: ""
intended_execution:
  runtime: ""           # same | claude-code | opencode | gemini-cli | any
project_name: ""
mode: ""                # greenfield | brownfield
total_phases: 0
total_plans: 0
total_requirements: 0
estimated_tasks: 0
status: ready_for_execution
planning_confidence: 0  # 0-100, do AUDIT-PLAN.md
---

# Projeto Pronto Para Execucao

Este projeto foi completamente planejado. Todos os artefatos arquiteturais
foram gerados, todas as fases foram planejadas em detalhe maximo (Sonnet-ready),
e todas as aprovacoes de supervisores/chiefs foram obtidas.

## Como executar

```
/up:build
```

Pode ser executado neste mesmo runtime ou em outro. O estado esta completamente
salvo em `.plano/`.

## Resumo do Projeto

**Briefing:** [resumo em 1-2 frases do BRIEFING.md]

**Stack:** [stack escolhida]

**Mode:** [greenfield | brownfield]

## Fases Planejadas

| # | Fase | Planos | Tarefas | Wave | Status |
|---|------|--------|---------|------|--------|
| 1 | [nome] | [N] | [M] | 0 | planejada |
| 2 | [nome] | [N] | [M] | 1 | planejada |
| 3 | [nome] | [N] | [M] | 1 | planejada |

## Aprovacoes Obtidas

Todas estas aprovacoes foram registradas em governance/approvals.log:

- [x] CEO: Briefing aprovado, intake completo
- [x] Chief-architect: Arquitetura aprovada
- [x] Chief-product: Fit com briefing confirmado
- [x] Architecture-supervisor: PROJECT, ROADMAP, SYSTEM-DESIGN, REQUIREMENTS aprovados
- [x] Planning-supervisor: Todos planos aprovados
- [x] Chief-engineer: Planejamento consistente cross-fase
- [x] Planning-auditor: Confidence score [N]/100

## Artefatos Disponiveis

```
.plano/
├── BRIEFING.md
├── OWNER.md
├── PENDING.md
├── DESIGN-TOKENS.md
├── PRODUCT-ANALYSIS.md
├── SYSTEM-DESIGN.md
├── PROJECT.md
├── ROADMAP.md
├── REQUIREMENTS.md
├── AUDIT-PLAN.md           ← relatorio do planning auditor
├── CHECKLIST.md
├── PLAN-READY.md           ← este arquivo
└── fases/
    ├── 01-[nome]/
    │   ├── 01-01-PLAN.md
    │   ├── 01-01-PLAN-REVIEW.md
    │   └── 01-02-PLAN.md
    ├── 02-[nome]/
    └── ...
```

## Credenciais

- [x] [credencial 1]
- [ ] [credencial pendente] (mock ativo)
- [ ] [credencial pendente] (mock ativo)

Ver `.plano/PENDING.md` para detalhes.

## Listagem Completa de Planos

[lista de todos os PLANs com seus paths, para o /up:build validar que existem]

| ID | Path | Wave | Tasks |
|----|------|------|-------|
| 01-01 | fases/01-auth/01-01-PLAN.md | 0 | 8 |
| 01-02 | fases/01-auth/01-02-PLAN.md | 1 | 7 |
...
```

</template>

<guidelines>

## Como o /up:build usa este arquivo

1. Gate de entrada: arquivo deve existir
2. Parse YAML frontmatter
3. Para cada plano listado, verificar se arquivo existe no disco
4. Se algum plano falta: alertar e oferecer planejamento local
5. Se tudo OK: prosseguir com execucao

## Quando este arquivo e atualizado

- Criado: ao final de `/up:plan`
- Lido: no inicio de `/up:build`
- Atualizado: nunca (e snapshot do planejamento)
- Deletado: ao final do `/up:build` (vira PROJECT-COMPLETE.md)

</guidelines>
