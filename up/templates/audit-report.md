# AUDIT-REPORT.md Template

Template para `.plano/AUDIT-REPORT.md` — relatorio do Delivery Auditor.
Gerado no Estagio 4.5, antes do Delivery.

<template>

```markdown
---
audited_at: ""
auditor: up-delivery-auditor
confidence_score: 0
quality_score: 0
recommendation: PENDING | READY_FOR_DELIVERY | NEEDS_REWORK | BLOCKED
rework_cycle: 0
max_cycles: 3
---

# Audit Report

**Scores:**
- **Confidence Score:** {N}/100 — completude do processo
- **Quality Score:** {N}/10 — qualidade do codigo (do Quality Gate)

**Recomendacao:** {status}

---

## Completude por Estagio

| Estagio | Items | Completed | Missing | Score |
|---------|-------|-----------|---------|-------|
| Intake | {N} | {N} | {N} | {%} |
| Arquitetura | {N} | {N} | {N} | {%} |
| Build | {N} | {N} | {N} | {%} |
| Quality Gate | {N} | {N} | {N} | {%} |
| Audit | {N} | {N} | {N} | {%} |
| Delivery | {N} | {N} | {N} | {%} |
| **TOTAL** | **{N}** | **{N}** | **{N}** | **{%}** |

---

## Items Pendentes

### Criticos (blockers)
- [item-id] [descricao] — [por que bloqueia]

### Importantes
- [item-id] [descricao]

### Menores
- [item-id] [descricao]

---

## Inconsistencias Detectadas

Cruzamento entre relatorios revelou:

### INC-001: [Titulo]
- **Tipo:** [inconsistencia-entre-agentes | score-divergente | claim-sem-evidencia]
- **Agentes envolvidos:** [lista]
- **Descricao:** [o que foi encontrado]
- **Evidencia:** [paths dos relatorios conflitantes]
- **Resolucao sugerida:** [como resolver]

---

## Aprovacoes Faltantes

Items que nao receberam aprovacao de supervisor/chief:

| Item | Esperado | Atual |
|------|----------|-------|
| [item-id] | chief-engineer APPROVE | pending |

---

## Rework Plan (se NEEDS_REWORK)

Acoes ordenadas por prioridade:

1. **[acao 1]** — [por que] → [agente responsavel]
2. **[acao 2]** — [por que] → [agente responsavel]
3. **[acao 3]** — [por que] → [agente responsavel]

Apos rework, re-rodar auditor. Max ciclos: {max_cycles}. Ciclo atual: {rework_cycle}.

---

## Delivery Readiness

### Checklist Final

- [ ] Confidence Score >= 95%
- [ ] Zero inconsistencias nao-resolvidas
- [ ] Todas aprovacoes obtidas
- [ ] Pending assets documentados
- [ ] DELIVERY.md pronto pra ser gerado

### Veredito

**{READY_FOR_DELIVERY | NEEDS_REWORK | BLOCKED}**

[Justificativa em 1-2 paragrafos]

---

## Historico de Ciclos

| Ciclo | Confidence | Issues | Resolvidas | Status |
|-------|-----------|--------|-----------|--------|
| 1 | {N}% | {N} | {N} | [status] |
| 2 | {N}% | {N} | {N} | [status] |
| 3 | {N}% | {N} | {N} | [status] |
```

</template>
