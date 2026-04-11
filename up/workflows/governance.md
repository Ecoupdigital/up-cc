<purpose>
Workflow de governanca do UP. Define o loop de aprovacao operacional → supervisor → chief → CEO.

Usado por todos os comandos UP que executam trabalho.
</purpose>

<process>

## Loop de Governanca (Nivel Supervisor)

### Passo 1: Operacional executa trabalho

Qualquer agente operacional (planejador, executor, verificador, detector, auditor, etc.) completa sua tarefa e retorna output.

### Passo 2: Supervisor correspondente revisa

Determinar supervisor baseado no agente operacional:

| Operacional | Supervisor |
|------------|-----------|
| planejador, roteirista | planning-supervisor |
| executor, frontend/backend/database-specialist | execution-supervisor |
| verificador, blind-validator | verification-supervisor |
| visual-critic, exhaustive-tester, api-tester, qa-agent | quality-supervisor |
| auditor-ux/perf/modernidade, security-reviewer, sintetizador-melhorias | audit-supervisor |
| product-analyst, pesquisadores, mapeador-codigo | product-supervisor |
| arquiteto, system-designer, requirements-validator | architecture-supervisor |
| devops-agent, technical-writer | operations-supervisor |

Spawnar o supervisor:

```python
Agent(
  subagent_type="up-{supervisor_name}",
  prompt="""
    Revisar output de {operacional_name} para {context}.
    
    <governance_compressed>
    DECISOES:
    - APPROVE — criterios atendidos, sem issues criticas, evidencia clara
    - REQUEST_CHANGES — 1+ criterio falhou, feedback especifico e acionavel
    - ESCALATE — fora do escopo, decisao arquitetural ou conflito → chief
    
    REWORK LIMITS:
    - Operacional ← Supervisor: max 3 ciclos, depois forca approval com debito tecnico
    - Supervisor ← Chief: max 2 ciclos, depois escala pro CEO
    
    NUNCA APROVAR SE:
    - Trabalho nao foi de fato verificado ("parece ok")
    - Evidencia faltando ou ambigua
    - SUMMARY claim sem backing no codigo
    - Stub/placeholder em vez de implementacao real
    - Falta de wiring (componente criado mas nao conectado)
    
    LOG OBRIGATORIO: .plano/governance/approvals.log
    </governance_compressed>
    
    <files_to_read>
    - [arquivos do output do operacional]
    - [arquivos de contexto da fase — preferir slices em .plano/fases/{N}/]
    </files_to_read>
    
    Versoes COMPLETAS (so se decisao precisa de detalhe):
    - Read $HOME/.claude/up/references/governance-rules.md
    - Read $HOME/.claude/up/references/rework-limits.md
    - Read $HOME/.claude/up/references/engineering-principles.md
    
    Avaliar contra criterios objetivos.
    Retornar: APPROVE | REQUEST_CHANGES | ESCALATE
  """
)
```

### Passo 3: Processar decisao do supervisor

**Se APPROVE:**
- Marcar item como completed no CHECKLIST
- Logar em governance/approvals.log
- Prosseguir pro proximo passo do pipeline

**Se REQUEST_CHANGES:**
- Incrementar rework_cycle do item
- Se cycle < 3: re-spawnar operacional com review como contexto
- Se cycle = 3: FORCA aprovacao com debito tecnico, registrar e prosseguir

```python
# Re-spawn do operacional
Agent(
  subagent_type="up-{operacional_name}",
  model="{modelo correto}",
  prompt="""
    REWORK — Ciclo {N}/3
    
    Seu output anterior foi revisado e precisa de mudancas.
    
    Review: .plano/{path_do_review}
    
    Mudancas requeridas:
    {lista_de_mudancas}
    
    Refaca seu trabalho atendendo os criterios.
  """
)
```

**Se ESCALATE:**
- Supervisor nao consegue resolver, passa pro chief
- Spawnar chief correspondente

```python
Agent(
  subagent_type="up-chief-{area}",
  model="opus",
  prompt="""
    Escalation recebida do {supervisor_name}.
    
    Problema: {problema}
    Contexto: {files_to_read}
    
    Decidir: APPROVE | REQUEST_CHANGES | ESCALATE_CEO
  """
)
```

## Loop de Governanca (Nivel Chief)

### Quando chief age

Chief age em 2 situacoes:

1. **Escalacao do supervisor** — problema que supervisor nao resolveu
2. **Aprovacao consolidada** — revisao periodica do trabalho de uma area inteira

### Ciclos de Rework (Chief ← Supervisor)

Max 2 ciclos:

```
Ciclo 1: Chief pede rework → Supervisor coordena com operacional
Ciclo 2: Chief re-revisa → APPROVE ou ESCALATE_CEO
```

## Loop de Governanca (Nivel CEO)

### Quando CEO age

1. **Escalacao do chief** — problema que chief nao resolveu
2. **Pre-delivery** — auditoria final antes de entregar
3. **Decisao estrategica** — briefing ambiguo, trade-off grande

### Ciclos (CEO ← Chief)

Max 1 ciclo:

```
Ciclo 1: CEO pede rework → Chief coordena com supervisores
Apos isso: CEO decide APPROVE ou ALERTA_DONO
```

### Se CEO decide ALERTA_DONO

CEO usa severidade apropriada:
- 🔴 Critico: sempre interrompe via AskUserQuestion
- 🟡 Importante: interrompe se --interactive
- 🟢 FYI: apenas registra

## Forced Approval (Debito Tecnico)

Quando max ciclos atingido sem melhoria:

```bash
# Registrar
cat >> .plano/governance/technical-debt.log <<EOF
$(date -u +%Y-%m-%dT%H:%M:%SZ) | {item-id} | {supervisor} | FORCED_APPROVAL
  Reason: Max rework cycles ({N}) reached without improvement
  Remaining issues: [lista]
EOF

# Atualizar checklist
node "$HOME/.claude/up/bin/up-tools.cjs" checklist update \
  --item "{item-id}" \
  --status "completed_with_debt"
```

Items com `completed_with_debt` aparecem no AUDIT-REPORT.md como ressalva.

## Aplicacao em Cada Comando UP

### /up:modo-builder (Full)
- Governanca COMPLETA em todos estagios
- CEO conduz intake e delivery
- Supervisores em cada passo
- Chiefs consolidam
- CEO aprova antes do delivery

### /up:modo-builder --light
- Governanca LIGHT
- Supervisores ainda ativos (criticos)
- Chiefs pulados
- CEO so no intake e delivery
- Max rework: 1 ciclo

### /up:rapido
- Governanca MINIMAL
- Apenas supervisor do operacional
- Sem chief, sem CEO
- Max rework: 1 ciclo

### /up:planejar-fase
- planning-supervisor ativo
- Sem chief
- Sem CEO

### /up:executar-fase
- execution-supervisor ativo
- chief-engineer no final da fase
- Sem CEO

### /up:testar
- quality-supervisor ativo
- chief-quality no final
- Sem CEO

### /up:melhorias
- audit-supervisor ativo
- chief-quality no final

### /up:verificar-trabalho
- verification-supervisor ativo
- Sem chief (UAT humano ja e autoritativo)

## Flag Global: --no-supervision

Para casos emergenciais onde voce precisa bypassar governanca:

```
/up:modo-builder "feature urgente" --no-supervision
```

Efeito:
- Supervisores nao rodam
- Nenhum rework
- Trabalho direto pro proximo estagio
- **Tudo registrado como SKIPPED_SUPERVISION no delivery**

Use APENAS em emergencia. Governanca existe por um motivo.

</process>

<success_criteria>
- [ ] Supervisor correspondente identificado
- [ ] Supervisor spawnado com contexto correto
- [ ] Decisao processada
- [ ] Rework cycles respeitados
- [ ] Escalacoes corretas
- [ ] Forced approval com debito tecnico registrado
- [ ] Checklist atualizado em cada passo
- [ ] Governance logs mantidos
</success_criteria>
