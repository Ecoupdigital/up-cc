# CHECKLIST.md Template

Template para `.plano/CHECKLIST.md` — rastreamento global do processo UP em tempo real.
Atualizado por CADA agente conforme completa seu trabalho.
Lido pelo Delivery Auditor para calcular Confidence Score.

<template>

```yaml
---
started_at: ""
updated_at: ""
total_items: 0
completed: 0
in_progress: 0
pending: 0
failed: 0
confidence_score: 0
---

# Checklist Global

Fonte unica da verdade sobre o que foi feito vs o que deveria ter sido feito.
Cada item tem: status, evidencia (path), validador, timestamp.

## Estagio 1: Intake

- [ ] E1.1 Briefing coletado
  - status: pending | in_progress | completed | failed
  - validator: [agente que validou]
  - evidence: .plano/BRIEFING.md
  - timestamp: [ISO]
  
- [ ] E1.2 Design system coletado ou marcado como pending
  - status: 
  - validator: 
  - evidence: .plano/DESIGN-TOKENS.md ou .plano/PENDING.md
  - timestamp: 

- [ ] E1.3 Credenciais coletadas ou marcadas como pending
  - status: 
  - evidence: .env.local ou .plano/PENDING.md
  
- [ ] E1.4 Referencias coletadas
  - status: 
  - evidence: .plano/OWNER.md
  
- [ ] E1.5 Restricoes anotadas
  - status: 
  - evidence: .plano/OWNER.md

## Estagio 2: Arquitetura

- [ ] E2.1 PRODUCT-ANALYSIS.md gerado
  - validator: product-supervisor
  - approved_by: chief-product
  
- [ ] E2.2 SYSTEM-DESIGN.md gerado
  - validator: architecture-supervisor
  - approved_by: chief-architect
  
- [ ] E2.3 PROJECT.md gerado
  - validator: architecture-supervisor
  
- [ ] E2.4 ROADMAP.md gerado
  - validator: architecture-supervisor
  
- [ ] E2.5 REQUIREMENTS.md gerado e validado
  - validator: architecture-supervisor
  
- [ ] E2.6 DESIGN-TOKENS.md gerado (se projeto tem UI)
  - validator: architecture-supervisor
  
- [ ] E2.7 Chief-architect aprovou arquitetura global
  - validator: chief-architect

## Estagio 3: Build (por fase)

### Fase {N}: {nome}

- [ ] E3.N.1 Plano criado
  - validator: planning-supervisor
  - rework_cycles: 0
  
- [ ] E3.N.2 Execucao concluida
  - validator: execution-supervisor
  - rework_cycles: 0
  
- [ ] E3.N.3 Verificador passou
  - validator: verification-supervisor
  
- [ ] E3.N.4 E2E rodou (se tem UI)
  - validator: quality-supervisor
  
- [ ] E3.N.5 DCRV rodou (3 detectores)
  - validator: quality-supervisor
  
- [ ] E3.N.6 Chief-engineer aprovou fase
  - validator: chief-engineer

## Estagio 4: Quality Gate Global

- [ ] E4.1 DCRV global rodou
  - validator: quality-supervisor
  
- [ ] E4.2 Blind validator rodou
  - validator: verification-supervisor
  
- [ ] E4.3 UX tester rodou
  - validator: audit-supervisor
  
- [ ] E4.4 Mobile first rodou
  - validator: audit-supervisor
  
- [ ] E4.5 Security review passou
  - validator: audit-supervisor
  
- [ ] E4.6 Melhorias aplicadas
  - validator: audit-supervisor
  
- [ ] E4.7 QA tests rodaram
  - validator: quality-supervisor
  
- [ ] E4.8 DevOps artifacts gerados
  - validator: operations-supervisor
  
- [ ] E4.9 Documentacao gerada
  - validator: operations-supervisor
  
- [ ] E4.10 Chief-quality aprovou qualidade global
  - validator: chief-quality

## Estagio 4.5: Audit (NOVO)

- [ ] E4.5.1 Delivery-auditor rodou
  - validator: delivery-auditor
  
- [ ] E4.5.2 Confidence Score calculado
  - threshold: 95%
  
- [ ] E4.5.3 Inconsistencias resolvidas
  
- [ ] E4.5.4 Rework loop executado (se necessario)
  - max_cycles: 3

## Estagio 5: Delivery

- [ ] E5.1 E2E final rodou
  - validator: quality-supervisor
  
- [ ] E5.2 DELIVERY.md gerado
  - validator: operations-supervisor
  
- [ ] E5.3 PENDING.md consolidado
  
- [ ] E5.4 CEO aprovou delivery
  - validator: project-ceo
  
- [ ] E5.5 Resumo apresentado ao dono
  - validator: project-ceo
```

</template>

<guidelines>

## Como atualizar

**Cada agente atualiza seus items ao completar:**

```bash
# Exemplo: execution-supervisor aprovou fase 3
node "$HOME/.claude/up/bin/up-tools.cjs" checklist update \
  --item "E3.3.2" \
  --status "completed" \
  --validator "execution-supervisor" \
  --evidence ".plano/fases/03-dashboard/03-01-SUMMARY.md" \
  --rework-cycles 1
```

## Como o Delivery Auditor usa

1. Le CHECKLIST.md
2. Conta: completed / total = Confidence Score (%)
3. Identifica items pending/failed
4. Cruza com outros relatorios pra detectar inconsistencias
5. Gera AUDIT-REPORT.md com recomendacao

## Thresholds

- **Confidence >= 95%:** delivery liberado
- **Confidence 85-94%:** delivery com ressalvas (CEO confirma com dono)
- **Confidence < 85%:** delivery bloqueado, loop de rework obrigatorio

</guidelines>
