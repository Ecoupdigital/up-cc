# Rework Limits

Limites de ciclos de rework antes de forcar aprovacao com debito tecnico.

---

## Limites por Nivel

| Nivel | Max Ciclos | Acao apos limite |
|-------|-----------|------------------|
| Operacional ← Supervisor | **3** | Forca aprovacao, registra como debito tecnico |
| Supervisor ← Chief | **2** | Escalacao pro CEO |
| Chief ← CEO | **1** | CEO decide: aceitar como esta ou alertar dono |

---

## Ciclo Operacional ← Supervisor

### Ciclo 1: Primeira rejeicao
```
Operacional entrega trabalho
  ↓
Supervisor revisa
  ↓
REQUEST_CHANGES
  ↓
Supervisor manda feedback especifico
  ↓
Operacional refaz
```

### Ciclo 2: Segunda tentativa
```
Operacional entrega trabalho (v2)
  ↓
Supervisor revisa
  ↓
Se APPROVE: prossegue
Se REQUEST_CHANGES: ciclo 3
```

### Ciclo 3: Ultima tentativa
```
Operacional entrega trabalho (v3)
  ↓
Supervisor revisa
  ↓
Se APPROVE: prossegue
Se REQUEST_CHANGES: FORCA aprovacao com ressalva
```

### Apos Max Ciclos

```
Supervisor registra em governance/technical-debt.log:
  - Item: [item-id]
  - Ciclos esgotados: 3
  - Issues restantes: [lista]
  - Decisao: FORCED_APPROVAL
  - Razao: Max rework cycles reached
  
Item marcado no CHECKLIST como:
  status: completed_with_debt
  
Trabalho prossegue, mas aparece no AUDIT-REPORT como ressalva.
```

---

## Ciclo Supervisor ← Chief

### Ciclo 1
```
Supervisor aprovou trabalho
  ↓
Chief revisa consolidado da area
  ↓
Se APPROVE: prossegue
Se REQUEST_CHANGES: volta pro supervisor com feedback
Se ESCALATE: pula pro CEO
```

### Ciclo 2
```
Supervisor coordena rework
  ↓
Chief re-revisa
  ↓
Se APPROVE: prossegue
Se REQUEST_CHANGES: ESCALATE pro CEO automaticamente
```

---

## Ciclo Chief ← CEO

### Ciclo 1 (unico)
```
Chief aprovou
  ↓
CEO revisa (antes do delivery)
  ↓
Se APPROVE_DELIVERY: prossegue
Se REWORK: volta pro chief responsavel
Se ALERTA_DONO: CEO pergunta ao dono o que fazer
```

### Apos rework unico
```
Chief refaz
  ↓
CEO re-revisa
  ↓
Se APPROVE_DELIVERY: prossegue
Se ainda NEEDS_REWORK: CEO alerta dono obrigatoriamente
```

---

## Quando forcar aprovacao

**Criterios:**
- Max ciclos atingido
- Melhoria entre ciclos < 10% (diminishing returns)
- Issue nao pode ser resolvida sem info externa

**Acao:**
1. Registrar como debito tecnico
2. Documentar no AUDIT-REPORT
3. Adicionar ao PENDING.md se virou pendencia
4. Alertar CEO (que decide se alerta dono)

---

## Anti-Patterns

**NAO FAZER:**
- Loops infinitos esperando perfeicao
- Aprovar sem rework quando claramente ha problema
- Rejeitar sem feedback especifico e acionavel
- Escalar sem tentar resolver no proprio nivel

**FAZER:**
- Feedback especifico: "Mude X para Y porque Z"
- Ciclos com melhoria mensuravel
- Aceitar debito tecnico documentado
- Comunicar trade-offs claramente

---

## Metrica: Rework Rate

Agentes com rework rate alto (>40%) sao candidatos a ajuste:
- Prompt pode estar vago
- Criterios muito rigidos
- Supervisor mal calibrado

Agentes com rework rate muito baixo (<5%) podem estar:
- Aprovando sem criterio
- Supervisor nao esta sendo critico o suficiente

**Target saudavel:** 15-30% de rework rate
