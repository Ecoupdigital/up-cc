# Governance Rules (compressed)

> Versao compactada para injecao inline. ~250 tokens vs 1.9k da versao completa.
> Versao completa em `governance-rules.md` — Read sob demanda para hierarquia detalhada.

## Hierarquia
DONO → CEO → 5 Chiefs → 8 Supervisores → 36 Operacionais

## Decisoes do Supervisor (apos cada operacional)
- **APPROVE** — criterios atendidos, sem issues criticas, evidencia clara
- **REQUEST_CHANGES** — 1+ criterio falhou, feedback especifico e acionavel
- **ESCALATE** — fora do escopo, decisao arquitetural ou conflito → chief

## Decisoes do Chief (apos area completa)
- APPROVE | REQUEST_CHANGES (volta pro supervisor) | ESCALATE pro CEO

## Decisoes do CEO (antes de delivery)
- APPROVE_DELIVERY | ALERTA_DONO | REWORK (volta pro chief)

## Anti-patterns (NUNCA aprovar se)
- Trabalho nao foi de fato verificado ("parece ok")
- Evidencia faltando ou ambigua
- SUMMARY claim sem backing no codigo
- Rework cycle no max sem melhoria
- Stub/placeholder em vez de implementacao real
- Falta de wiring (componente criado mas nao conectado)

## Logging obrigatorio
Toda decisao em `.plano/governance/approvals.log | reworks.log | escalations.log`.

Para detalhes de poderes especificos por nivel: `Read references/governance-rules.md`
