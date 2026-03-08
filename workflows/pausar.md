<purpose>
Criar arquivo `.continue-aqui.md` para preservar estado completo do trabalho entre sessoes. Permite retomada seamless com restauracao completa de contexto.
</purpose>

<process>

<step name="detect">
Encontrar diretorio da fase atual dos arquivos mais recentemente modificados:

```bash
ls -lt .plano/fases/*/PLAN.md 2>/dev/null | head -1 | grep -oP 'fases/\K[^/]+'
```

Se nenhuma fase ativa detectada, perguntar ao usuario em qual fase esta pausando trabalho.
</step>

<step name="gather">
**Coletar estado completo para handoff:**

1. **Posicao atual**: Qual fase, qual plano, qual tarefa
2. **Trabalho completo**: O que foi feito nesta sessao
3. **Trabalho restante**: O que falta no plano/fase atual
4. **Decisoes tomadas**: Decisoes-chave e justificativa
5. **Bloqueios/problemas**: Qualquer coisa travada
6. **Contexto mental**: A abordagem, proximos passos, "vibe"
7. **Arquivos modificados**: O que mudou mas nao foi committed

Perguntar ao usuario por esclarecimentos se necessario via perguntas conversacionais.
</step>

<step name="write">
**Escrever handoff em `.plano/fases/XX-nome/.continue-aqui.md`:**

```markdown
---
phase: XX-nome
task: 3
total_tasks: 7
status: in_progress
last_updated: [timestamp]
---

<current_state>
[Onde exatamente estamos? Contexto imediato]
</current_state>

<completed_work>

- Tarefa 1: [nome] - Feita
- Tarefa 2: [nome] - Feita
- Tarefa 3: [nome] - Em progresso, [o que esta feito]
</completed_work>

<remaining_work>

- Tarefa 3: [o que falta]
- Tarefa 4: Nao iniciada
- Tarefa 5: Nao iniciada
</remaining_work>

<decisions_made>

- Decidiu usar [X] porque [motivo]
- Escolheu [abordagem] em vez de [alternativa] porque [motivo]
</decisions_made>

<blockers>
- [Bloqueio 1]: [status/contorno]
</blockers>

<context>
[Estado mental, o que estava pensando, o plano]
</context>

<next_action>
Comecar com: [acao especifica ao retomar]
</next_action>
```

Seja especifico o suficiente para um Claude limpo entender imediatamente.
</step>

<step name="commit">
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "wip: [nome-fase] pausado na tarefa [X]/[Y]" --files .plano/fases/*/.continue-aqui.md
```
</step>

<step name="confirm">
```
Handoff criado: .plano/fases/[XX-nome]/.continue-aqui.md

Estado atual:

- Fase: [XX-nome]
- Tarefa: [X] de [Y]
- Status: [em_progresso/bloqueado]
- Committed como WIP

Para retomar: /up:retomar
```
</step>

</process>

<success_criteria>
- [ ] .continue-aqui.md criado no diretorio correto da fase
- [ ] Todas secoes preenchidas com conteudo especifico
- [ ] Committed como WIP
- [ ] Usuario sabe localizacao e como retomar
</success_criteria>