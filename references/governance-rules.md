# Governance Rules

Regras de governanca aplicadas a TODOS os comandos UP.
Carregado por supervisores, chiefs e CEO.

---

## Hierarquia

```
DONO (humano)
  ↓
CEO (up-project-ceo)
  ↓
CHIEFS (5 — architecture, product, engineer, quality, operations)
  ↓
SUPERVISORES (8 — area especifica)
  ↓
OPERACIONAIS (36 — agentes existentes)
```

## Fluxo de Aprovacao

### Nivel 1: Supervisor revisa operacional

Apos cada agente operacional completar trabalho:

1. Supervisor da area le o output
2. Supervisor avalia contra criterios objetivos
3. Decisao:
   - **APPROVE** — trabalho bom, segue
   - **REQUEST_CHANGES** — volta pro operacional com lista especifica
   - **ESCALATE** — problema serio, chama chief

**Max rework cycles:** 3 (operacional → supervisor)

### Nivel 2: Chief revisa consolidado

Apos TODOS os agentes de uma area completarem:

1. Chief le outputs consolidados da area
2. Valida coerencia entre agentes
3. Detecta drift de visao
4. Decisao:
   - **APPROVE** — area consistente, segue
   - **REQUEST_CHANGES** — volta pro supervisor com feedback
   - **ESCALATE** — problema de visao, chama CEO

**Max rework cycles:** 2 (chief → supervisor → operacional)

### Nivel 3: CEO revisa antes do delivery

Antes do Estagio 5 (Delivery):

1. CEO le briefing original + delivery report
2. Valida que projeto atende ao pedido do dono
3. Decisao:
   - **APPROVE_DELIVERY** — pronto pra entregar
   - **ALERTA_DONO** — algo critico, pergunta ao dono
   - **REWORK** — volta pro chief responsavel

**Max rework cycles:** 1 (CEO → chief)

---

## Criterios de Decisao

### APPROVE
- Todos criterios objetivos atendidos
- Sem issues criticas
- Sem inconsistencias
- Evidencia clara

### REQUEST_CHANGES
- 1+ criterio nao atendido
- Issues menores/medias que podem ser corrigidas
- Feedback especifico e acionavel

### ESCALATE
- Problema fora do escopo do supervisor
- Decisao arquitetural necessaria
- Conflito entre outros agentes

---

## Poderes do Supervisor

- ✅ Aprovar ou rejeitar trabalho do operacional
- ✅ Pedir rework com feedback especifico
- ✅ Mudar decisoes taticas (ex: "use zod ao inves de yup")
- ✅ Escalar pra chief se necessario
- ❌ NAO pode mudar decisoes arquiteturais fundamentais (isso e do chief)
- ❌ NAO pode rejeitar o briefing (isso e do CEO)

## Poderes do Chief

- ✅ Tudo que supervisor pode
- ✅ Mudar decisoes arquiteturais da area
- ✅ Coordenar entre multiplos supervisores
- ✅ Detectar drift de visao
- ✅ Escalar pra CEO em casos extremos
- ❌ NAO pode rejeitar o briefing original
- ❌ NAO pode decidir entregar com score baixo (isso e do CEO + dono)

## Poderes do CEO

- ✅ Tudo que chief pode
- ✅ Rejeitar briefing inviavel
- ✅ Interromper dono quando necessario (3 niveis de severidade)
- ✅ Aprovar delivery final
- ✅ Negociar com dono sobre trade-offs
- ✅ Veto final em qualquer decisao

---

## Accountability

Cada aprovacao fica registrada em `.plano/governance/approvals.log`:

```
2026-04-10T16:30:00Z | E3.3.2 | execution-supervisor | APPROVE | SUMMARY verified
2026-04-10T16:45:00Z | E3.3.6 | chief-engineer | APPROVE | Phase 3 integrated
2026-04-10T17:00:00Z | E4.10 | chief-quality | REQUEST_CHANGES | Security issues pending
2026-04-10T17:15:00Z | E5.4 | project-ceo | APPROVE_DELIVERY | Confidence 96%
```

Cada rework fica em `.plano/governance/reworks.log`:

```
2026-04-10T16:20:00Z | E3.3.1 | planning-supervisor | REQUEST_CHANGES | cycle 1/3
  → reason: Plan lacks imports and type definitions (Sonnet-ready)
  → action: Re-spawned up-planejador with enrichment instructions
```

Cada escalacao fica em `.plano/governance/escalations.log`:

```
2026-04-10T17:30:00Z | E4.5 | audit-supervisor → chief-quality
  → reason: Security review found 3 critical vulnerabilities
  → decision: chief-quality approved rework with priority
```

---

## Anti-Patterns

**NAO APROVAR SE:**
- Trabalho nao foi de fato verificado (so "parece que ta ok")
- Evidencia esta faltando ou ambigua
- Ha claim sem backing (SUMMARY diz X mas codigo nao tem)
- Rework cycle ja atingiu max sem melhoria

**REJEITAR SEMPRE SE:**
- Violacao de engineering-principles.md
- Stub/placeholder onde deveria ter implementacao real
- Inconsistencia com fases anteriores
- Falta de wiring (componente criado mas nao conectado)
