<purpose>
Workflow de governanca do UP — GATE-ONLY.

Reescrito no redesign v2: a hierarquia CEO -> chief -> supervisor foi removida (era teatro de
modelo-burro). O que sobra e o mecanismo deterministico que importa: o GATE de fase baseado em
`approvals.log`, com cap de rework de 1 round. Sem spawns de LLM aqui — so o contrato do gate.

@-referenciado por build.md. O check de approvals.log e OURO: este arquivo preserva sua semantica
intacta, apenas tira a camada de supervisores/chiefs/CEO que decidia em volta dele.
</purpose>

<core_principle>
A seguranca do UP nunca foram os agentes de governanca; era (1) o `approvals.log` deterministico que
um GATE em bash verifica, e (2) os detectores que rodam o app de verdade (DCRV). Este workflow define
SO o (1). O veredito que alimenta o log vem de UM agente — `up-revisor` (two-stage) — nao de uma
piramide de supervisores.

Regras duras:
- Cap de rework: **1 round**. Apos 1 ciclo sem melhoria, forca aprovacao com debito tecnico registrado.
- O GATE nao avanca sem a entry esperada no `approvals.log`. Se faltar, spawnar o agente faltante.
- Nenhum spawn de CEO/chief/supervisor. O revisor decide; o gate verifica.
</core_principle>

<process>

## 1. Inicializar governance

```bash
mkdir -p .plano/governance
touch .plano/governance/approvals.log
[ -s .plano/governance/approvals.log ] || \
  echo "# Governance initialized at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .plano/governance/approvals.log
```

## 2. Contrato do approvals.log

O `up-revisor` (e so ele) escreve no log ANTES de retornar. Formato de uma entry:

```
<timestamp ISO> | <escopo> | up-revisor | <DECISAO> | <motivo>
```

Onde:
- `<escopo>` = `phase-N` (gate de fase no build) ou `planning` / `architecture` (gate no plan).
- `<DECISAO>` = `APPROVE` | `REQUEST_CHANGES` | `BLOCK`.

Exemplo (o revisor roda isto ao final):

```bash
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-${PHASE_NUMBER} | up-revisor | APPROVE | spec ok, code-quality ok" \
  >> .plano/governance/approvals.log
```

## 3. O GATE de fase (verificacao deterministica)

Apos executor + verificador + revisor de uma fase, o orquestrador roda o gate. Ele NAO chama LLM:

```bash
echo "=== GATE: Fase ${PHASE_NUMBER} ==="

# Artefatos obrigatorios
SUMMARY_OK=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null | wc -l)
VERIF_OK=$(ls "${PHASE_DIR}"/*-VERIFICATION.md 2>/dev/null | wc -l)

# Veredito do revisor logado para esta fase?
REVISOR_ENTRY=$(grep "phase-${PHASE_NUMBER}.*up-revisor" .plano/governance/approvals.log 2>/dev/null | tail -1)

PASS=true
[ "$SUMMARY_OK" -eq 0 ] && echo "FALHA: sem SUMMARY.md" && PASS=false
[ "$VERIF_OK" -eq 0 ] && echo "FALHA: sem VERIFICATION.md" && PASS=false
[ -z "$REVISOR_ENTRY" ] && echo "FALHA: up-revisor NAO logou veredito" && PASS=false

# Se logou, qual foi a decisao?
DECISION=$(echo "$REVISOR_ENTRY" | awk -F'|' '{gsub(/ /,"",$4); print $4}')

if [ "$PASS" = false ]; then
  echo "GATE FALHOU: spawnar o agente faltante (verificador ou up-revisor) e re-rodar o gate."
  # NAO avancar. Voltar e completar o passo faltante.
elif [ "$DECISION" = "APPROVE" ]; then
  echo "GATE OK: fase ${PHASE_NUMBER} aprovada. Marcar completa e avancar."
elif [ "$DECISION" = "REQUEST_CHANGES" ]; then
  echo "GATE: rework necessario na fase ${PHASE_NUMBER}. Ver passo 4 (cap 1 round)."
elif [ "$DECISION" = "BLOCK" ]; then
  echo "GATE: fase ${PHASE_NUMBER} BLOQUEADA pelo revisor. Alertar o dono (AskUserQuestion)."
fi
```

## 4. Cap de rework (1 round)

Quando o revisor decide `REQUEST_CHANGES`:

```bash
REWORK_FILE=".plano/governance/rework-phase-${PHASE_NUMBER}.count"
ROUND=$(cat "$REWORK_FILE" 2>/dev/null || echo 0)
```

- **ROUND = 0:** re-spawnar o agente operacional (executor/specialist) com o review como contexto.
  Incrementar: `echo 1 > "$REWORK_FILE"`. Depois re-rodar verificador + up-revisor + gate.
- **ROUND >= 1:** NAO re-spawnar de novo. Forcar aprovacao com debito tecnico:

```bash
cat >> .plano/governance/technical-debt.log <<EOF
$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-${PHASE_NUMBER} | up-revisor | FORCED_APPROVAL
  Reason: cap de rework (1 round) atingido sem resolucao completa
  Remaining: [issues pendentes do review]
EOF

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-${PHASE_NUMBER} | up-revisor | APPROVE | forced (debito tecnico)" \
  >> .plano/governance/approvals.log
```

Items com debito tecnico aparecem como ressalva no relatorio de entrega.

## 5. Bloqueio (BLOCK)

Se o revisor decide `BLOCK` (ex: spec impossivel, perda de dados, ambiguidade critica), o orquestrador
interrompe e alerta o dono via AskUserQuestion (sem CEO, output direto). O dono decide: ajustar escopo,
re-planejar a fase (via `/up:plan`) ou abandonar.

</process>

<success_criteria>
- [ ] .plano/governance/approvals.log inicializado
- [ ] Gate verifica artefatos (SUMMARY + VERIFICATION) e o veredito do up-revisor
- [ ] Gate nao avanca sem entry do up-revisor para a fase
- [ ] Cap de rework de 1 round respeitado; forced approval registra debito tecnico
- [ ] BLOCK alerta o dono (sem CEO)
- [ ] Nenhum spawn de CEO/chief/supervisor neste workflow
</success_criteria>
</output>
