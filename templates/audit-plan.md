# AUDIT-PLAN.md Template

Template para `.plano/AUDIT-PLAN.md` — relatorio do up-planning-auditor.
Gerado ao final do planejamento, antes do PLAN-READY.md.

Diferente do AUDIT-REPORT.md (do delivery-auditor) que audita execucao,
este audita SOMENTE o planejamento.

<template>

```markdown
---
audited_at: ""
auditor: up-planning-auditor
planning_confidence: 0  # 0-100
recommendation: PENDING | READY_FOR_BUILD | NEEDS_REWORK | BLOCKED
---

# Planning Audit Report

**Planning Confidence Score:** {N}/100

**Recomendacao:** {status}

---

## Completude por Estagio

| Estagio | Items | Completed | Missing | Score |
|---------|-------|-----------|---------|-------|
| Intake (E1) | 5 | {N} | {N} | {%} |
| Arquitetura (E2) | 7 | {N} | {N} | {%} |
| Planejamento (E2.5) | {6 × phases} | {N} | {N} | {%} |
| **TOTAL** | **{N}** | **{N}** | **{N}** | **{%}** |

---

## Validacao de Completude

### Artefatos Arquiteturais

- [ ] BRIEFING.md existe
- [ ] OWNER.md existe
- [ ] PROJECT.md existe e completo
- [ ] ROADMAP.md existe e tem fases
- [ ] REQUIREMENTS.md existe
- [ ] SYSTEM-DESIGN.md existe e completo
- [ ] DESIGN-TOKENS.md existe (se projeto com UI)
- [ ] PENDING.md existe (mesmo se vazio)

### Planos por Fase

Para cada fase em ROADMAP.md:
- [ ] Existe pasta `.plano/fases/XX-nome/`
- [ ] Existe pelo menos 1 PLAN.md
- [ ] Cada PLAN.md tem frontmatter valido
- [ ] Cada PLAN.md tem 5-8 tarefas
- [ ] Cada PLAN.md tem must_haves
- [ ] Cada PLAN.md passou no planning-supervisor (PLAN-REVIEW.md existe)

### Cobertura de Requisitos

| REQ-ID | Mapeado a fase? | Coberto por plano? | Status |
|--------|----------------|-------------------|--------|
| AUTH-01 | Sim (Fase 1) | Sim (01-01-PLAN) | OK |
| ... | | | |

**Cobertura:** {covered}/{total} ({%})

### Sonnet-readiness

Para cada PLAN.md, checar nivel de detalhe:

| Plan | Imports | Tipos | Endpoints | SQL | Score |
|------|---------|-------|-----------|-----|-------|
| 01-01-PLAN.md | ✓ | ✓ | ✓ | N/A | 100% |
| 01-02-PLAN.md | ✓ | ✓ | ✓ | ✓ | 100% |

**Score medio Sonnet-ready:** {%}

### Dependency Graph

- [ ] Todas dependencias entre planos resolvidas
- [ ] Sem ciclos detectados
- [ ] Waves atribuidas (0, 1, 2, 3)
- [ ] Paralelismo maximizado onde possivel

---

## Aprovacoes Faltantes

| Item | Esperado | Atual |
|------|----------|-------|
| [item] | [supervisor] APPROVE | pending/missing |

---

## Inconsistencias Detectadas

### INC-001: [Titulo]
**Tipo:** [conflito | gap | duplicacao]
**Descricao:** [...]
**Acao sugerida:** [...]

---

## Pendencias Conhecidas

Da PENDING.md:
- {N} blockers
- {N} non-blockers

Estas pendencias NAO bloqueiam o planejamento, mas serao revistas no delivery.

---

## Veredito

**{READY_FOR_BUILD | NEEDS_REWORK | BLOCKED}**

[Justificativa em 1-2 paragrafos]

### Rework Plan (se NEEDS_REWORK)

1. [acao 1]
2. [acao 2]
3. [acao 3]

Apos rework, re-rodar auditor.

### Pronto pra Build (se READY_FOR_BUILD)

Proximos passos:
1. Gerar PLAN-READY.md
2. Apresentar ao dono via CEO
3. Aguardar `/up:build` (mesmo runtime ou outro)
```

</template>
