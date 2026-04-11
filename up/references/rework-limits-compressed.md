# Rework Limits (compressed)

> Versao compactada para injecao inline. ~150 tokens vs 2k da versao completa.
> Versao completa em `rework-limits.md` — Read sob demanda para fluxos detalhados.

## Limites por nivel
| Nivel | Max Ciclos | Apos limite |
|---|---|---|
| Operacional ← Supervisor | **3** | Forca approval, marca como debito tecnico |
| Supervisor ← Chief | **2** | Escalacao pro CEO |
| Chief ← CEO | **1** | CEO decide: aceitar ou alertar dono |

## Quando forcar aprovacao (apos max ciclos)
- Melhoria entre ciclos < 10% (diminishing returns)
- Issue nao pode ser resolvida sem info externa
- Acao: registrar em `governance/technical-debt.log`, marcar item como `completed_with_debt`

## Rework rate saudavel: 15-30%
- < 5% = supervisor mal calibrado, aprovando sem criterio
- > 40% = prompt vago ou criterios muito rigidos

Para fluxos completos por ciclo: `Read references/rework-limits.md`
