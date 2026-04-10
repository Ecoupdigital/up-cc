<purpose>
Workflow do CEO pra mandar updates periodicos ao dono durante execucao do projeto.

Chamado pelo builder apos cada fase concluida (se updates != silent).
</purpose>

<process>

## Quando rodar

- Apos cada fase do build completar
- Apos Quality Gate completar
- Apos Delivery Auditor rodar
- Em qualquer momento critico

## Carregar contexto

```bash
cat ~/.claude/up/owner-profile.md
cat .plano/OWNER.md
cat .plano/STATE.md
cat .plano/ROADMAP.md
```

Extrair:
- `$PREFERRED_NAME`
- `$CEO_NAME`
- `$CEO_TONE`
- `$UPDATES_LEVEL` (verbose | normal | silent)

**Se `$UPDATES_LEVEL = silent`:** Pular updates por fase. Voltar pro builder.

## Formato do Update (por fase)

### Verbose (detalhado)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 {CEO_NAME}: Update — Fase {X}/{TOTAL} concluida
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Fase {X}:** {nome da fase}

**O que foi feito:**
- [bullet 1 — resumo do que foi construido]
- [bullet 2]
- [bullet 3]

**Qualidade:**
- Testes E2E: {passed}/{total} ({%})
- DCRV Score: {score}/10
  - Visual: {N}/10
  - Interacao: {N}% pass
  - API: {N}% pass
- Code Review: {N} issues ({critical} critical, {high} high)
- Supervisores: {N} aprovacoes, {M} reworks

**Decisoes Tomadas:**
- [decisao 1]
- [decisao 2]

**Proxima Fase ({X+1}):**
- {nome}
- {N} planos estimados
- {M} tarefas

**Progresso Total:** {%} ({phases_done}/{total_phases})

Continuar? (enter pra seguir, ou digita feedback)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Normal (resumido)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 {CEO_NAME}: Fase {X}/{TOTAL} ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{nome da fase} concluida.
{testes} testes, {passed}% pass.

Proxima: {nome proxima fase}
Progresso: {%}

(enter pra continuar)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Silent (nao manda nada)

Pular.

## Formato Alerta Critico (qualquer modo)

Se ha 🔴 CRITICO, interrompe SEMPRE:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🔴 {CEO_NAME}: Preciso do seu input
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{PREFERRED_NAME}, precisei parar.

**Situacao:**
[descricao clara]

**Por que nao posso decidir sozinho:**
[explicacao]

**Opcoes:**
a) [opcao 1]
b) [opcao 2]
c) [opcao 3]

**Minha recomendacao:** {opcao} — {justificativa curta}

Qual voce prefere?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Usar `AskUserQuestion` para capturar resposta.

## Formato Alerta Importante (modo interactive)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🟡 {CEO_NAME}: Decisao a tomar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{PREFERRED_NAME}, situacao:

[descricao]

**Opcoes viaveis:**
a) [opcao] — {pros/contras}
b) [opcao] — {pros/contras}

**Minha recomendacao:** {opcao}
**Por que:** {explicacao}

Voce confirma? Ou prefere outra?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Se `$INTERACTIVE = true` ou `$UPDATES_LEVEL = verbose`: perguntar via AskUserQuestion.
Senao: tomar decisao recomendada e registrar em OWNER.md como "Decisao delegada".

## Formato FYI (nao interrompe)

Registrar em `.plano/OWNER.md` na secao "Feedback Durante Execucao":

```markdown
| {timestamp} | 🟢 Decisao automatica | {decisao} |
```

Nao falar nada pro dono.

## Registrar Interacao

Toda vez que CEO fala com dono, registrar em `.plano/OWNER.md`:

```markdown
## Interacoes com o CEO

| Timestamp | Tipo | Conteudo |
|-----------|------|----------|
| {timestamp} | update-verbose | Fase 3 concluida — dashboard |
| {timestamp} | alerta-critico | Credencial Asaas expirou |
| {timestamp} | alerta-importante | Trade-off: Redis vs in-memory |
| {timestamp} | fyi | Adicionei loading states automaticamente |
```

</process>

<success_criteria>
- [ ] Owner-profile lido
- [ ] Nivel de updates respeitado (verbose/normal/silent)
- [ ] Tom correto usado
- [ ] Severidade respeitada (critico sempre interrompe)
- [ ] Interacao registrada em OWNER.md
- [ ] Formato apropriado aplicado
</success_criteria>
