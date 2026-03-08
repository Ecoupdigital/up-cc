<purpose>
Validar features construidas atraves de teste conversacional com estado persistente. Cria UAT.md que rastreia progresso de teste, sobrevive /clear, e alimenta lacunas em /up:planejar-fase --gaps.

Usuario testa, Claude registra. Um teste por vez. Respostas em texto simples.
</purpose>

<philosophy>
**Mostrar esperado, perguntar se realidade corresponde.**

Claude apresenta o que DEVERIA acontecer. Usuario confirma ou descreve o que esta diferente.
- "sim" / "s" / "proximo" / vazio -> passou
- Qualquer outra coisa -> registrado como problema, severidade inferida
</philosophy>

<process>

<step name="initialize" priority="first">
Se $ARGUMENTS contem numero de fase, carregar contexto:

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init verify-work "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `has_verification`.
</step>

<step name="check_active_session">
**Verificar sessoes UAT ativas**

```bash
find .plano/fases -name "*-UAT.md" -type f 2>/dev/null | head -5
```

**Se sessoes ativas existem E sem $ARGUMENTS:**

Ler frontmatter de cada arquivo e secao Current Test.

```
## Sessoes UAT Ativas

| # | Fase | Status | Teste Atual | Progresso |
|---|------|--------|-------------|----------|
| 1 | 04-comentarios | testando | 3. Responder Comentario | 2/6 |

Responda com um numero para retomar, ou forneca numero de fase para iniciar nova.
```

**Se sem sessoes ativas E sem $ARGUMENTS:**

```
Sem sessoes UAT ativas.

Forneca numero de fase para iniciar teste (ex: /up:verificar-trabalho 4)
```
</step>

<step name="find_summaries">
**Encontrar o que testar:**

```bash
ls "$phase_dir"/*-SUMMARY.md 2>/dev/null
```

Ler cada SUMMARY.md para extrair entregaveis testaveis.
</step>

<step name="extract_tests">
**Extrair entregaveis testaveis do SUMMARY.md:**

Focar em resultados OBSERVAVEIS PELO USUARIO, nao detalhes de implementacao.

Para cada entregavel, criar teste:
- name: Nome breve do teste
- expected: O que usuario deveria ver/experimentar (especifico, observavel)
</step>

<step name="create_uat_file">
**Criar arquivo UAT com todos testes:**

Criar arquivo em `.plano/fases/XX-nome/{fase_num}-UAT.md`

```markdown
---
status: testing
phase: XX-nome
source: [lista de SUMMARY.md]
started: [timestamp ISO]
updated: [timestamp ISO]
---

## Teste Atual
<!-- SOBRESCREVER cada teste - mostra onde estamos -->

number: 1
name: [nome do primeiro teste]
expected: |
  [o que usuario deve observar]
awaiting: resposta do usuario

## Testes

### 1. [Nome do Teste]
expected: [comportamento observavel]
result: [pendente]

### 2. [Nome do Teste]
expected: [comportamento observavel]
result: [pendente]

## Resumo

total: [N]
passed: 0
issues: 0
pending: [N]
skipped: 0

## Lacunas

[nenhuma ainda]
```

Prosseguir para `present_test`.
</step>

<step name="present_test">
**Apresentar teste atual ao usuario:**

```
==============================================================
  CHECKPOINT: Verificacao Necessaria
==============================================================

**Teste {number}: {name}**

{expected}

--------------------------------------------------------------
-> Digite "passou" ou descreva o que esta errado
--------------------------------------------------------------
```

Esperar resposta do usuario (texto simples, sem AskUserQuestion).
</step>

<step name="process_response">
**Processar resposta do usuario e atualizar arquivo:**

**Se resposta indica passou:**
- Resposta vazia, "sim", "s", "ok", "passou", "proximo", "aprovado"

**Se resposta indica pular:**
- "pular", "nao posso testar", "n/a"

**Se resposta e qualquer outra coisa:**
- Tratar como descricao de problema

Inferir severidade da descricao:
- Contem: crash, erro, excecao, falha, quebrado, inutilizavel -> bloqueante
- Contem: nao funciona, errado, faltando, nao consigo -> grave
- Contem: lento, estranho, menor, pequeno -> menor
- Contem: cor, fonte, espacamento, alinhamento, visual -> cosmetico
- Padrao se incerto: grave

**Nunca pergunte "quao severo e isso?"** - apenas infira e siga em frente.

Apos qualquer resposta: Atualizar contagens do Resumo. Atualizar timestamp.

Se mais testes restam -> Atualizar Teste Atual, ir para `present_test`
Se sem mais testes -> Ir para `complete_session`
</step>

<step name="resume_from_file">
**Retomar teste do arquivo UAT:**

Ler arquivo UAT completo. Encontrar primeiro teste com `result: [pendente]`.

```
Retomando: Fase {fase} UAT
Progresso: {passed + issues + skipped}/{total}
Problemas encontrados ate agora: {contagem}

Continuando do Teste {N}...
```
</step>

<step name="complete_session">
**Completar teste e commitar:**

Atualizar frontmatter:
- status: complete
- updated: [agora]

Commitar arquivo UAT:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "test({fase_num}): completar UAT - {passed} passaram, {issues} problemas" --files ".plano/fases/XX-nome/{fase_num}-UAT.md"
```

Apresentar resumo:
```
## UAT Completo: Fase {fase}

| Resultado | Contagem |
|-----------|----------|
| Passou    | {N}      |
| Problemas | {N}      |
| Pulados   | {N}      |

[Se problemas > 0:]
### Problemas Encontrados
[Lista da secao Lacunas]
```

**Se problemas > 0:**
```
{N} problemas encontrados.

---

## Proximo

**Planejar correcoes** -- criar planos para resolver lacunas

`/up:planejar-fase {fase} --gaps`

<sub>`/clear` primeiro -> janela de contexto limpa</sub>

---
```

**Se problemas == 0:**
```
Todos testes passaram. Pronto para continuar.

- `/up:planejar-fase {proxima}` -- Planejar proxima fase
- `/up:executar-fase {proxima}` -- Executar proxima fase
```
</step>

</process>

<severity_inference>
**Inferir severidade da linguagem natural do usuario:**

| Usuario diz | Inferir |
|-------------|--------|
| "crasha", "erro", "excecao", "falha completa" | bloqueante |
| "nao funciona", "nada acontece", "comportamento errado" | grave |
| "funciona mas...", "lento", "estranho", "problema menor" | menor |
| "cor", "espacamento", "alinhamento", "parece errado" | cosmetico |
</severity_inference>

<success_criteria>
- [ ] Arquivo UAT criado com todos testes do SUMMARY.md
- [ ] Testes apresentados um por vez com comportamento esperado
- [ ] Respostas do usuario processadas como passou/problema/pulou
- [ ] Severidade inferida da descricao (nunca perguntada)
- [ ] Committed na conclusao
- [ ] Se problemas: pronto para `/up:planejar-fase --gaps`
</success_criteria>