---
name: up:depurar
description: Depuracao sistematica com estado persistente entre resets de contexto
argument-hint: [descricao do problema]
allowed-tools:
  - Read
  - Bash
  - Task
  - AskUserQuestion
---

<objective>
Depurar problemas usando metodo cientifico com isolamento em subagente.

**Papel do orquestrador:** Coletar sintomas, spawnar agente up-depurador, lidar com checkpoints, spawnar continuacoes.

**Por que subagente:** Investigacao consome contexto rapidamente (lendo arquivos, formando hipoteses, testando). Contexto fresco de 200k por investigacao. Contexto principal permanece enxuto para interacao com usuario.
</objective>

<context>
Problema do usuario: $ARGUMENTS

Verificar sessoes ativas:
```bash
ls .plano/debug/*.md 2>/dev/null | grep -v resolved | head -5
```
</context>

<process>

## 0. Inicializar Contexto

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" state load)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Extrair `commit_docs` do JSON de init.

## 1. Verificar Sessoes Ativas

Se sessoes ativas existem E sem $ARGUMENTS:
- Listar sessoes com status, hipotese, proxima acao
- Usuario escolhe numero para retomar OU descreve novo problema

Se $ARGUMENTS fornecido OU usuario descreve novo problema:
- Continuar para coleta de sintomas

## 2. Coletar Sintomas (se novo problema)

Usar AskUserQuestion para cada:

1. **Comportamento esperado** - O que deveria acontecer?
2. **Comportamento real** - O que acontece de fato?
3. **Mensagens de erro** - Algum erro? (colar ou descrever)
4. **Timeline** - Quando comecou? Ja funcionou antes?
5. **Reproducao** - Como reproduzir?

Apos coletar tudo, confirmar pronto para investigar.

## 3. Spawnar Agente up-depurador

Preencher prompt e spawnar:

```markdown
<objective>
Investigar problema: {slug}

**Resumo:** {trigger}
</objective>

<symptoms>
expected: {expected}
actual: {actual}
errors: {errors}
reproduction: {reproduction}
timeline: {timeline}
</symptoms>

<mode>
symptoms_prefilled: true
goal: find_and_fix
</mode>

<debug_file>
Criar: .plano/debug/{slug}.md
</debug_file>
```

```
Agent(
  prompt=filled_prompt,
  subagent_type="up-depurador",
  description="Depurar {slug}"
)
```

## 4. Lidar com Retorno do Agente

**Se `## ROOT CAUSE FOUND`:**
- Exibir causa raiz e resumo de evidencias
- Oferecer opcoes:
  - "Corrigir agora" - spawnar subagente de correcao
  - "Planejar correcao" - sugerir /up:planejar-fase
  - "Correcao manual" - encerrar

**Se `## CHECKPOINT REACHED`:**
- Apresentar detalhes do checkpoint ao usuario
- Obter resposta do usuario
- Se tipo `human-verify`:
  - Se usuario confirma corrigido: continuar para agente finalizar/resolver/arquivar
  - Se usuario reporta problemas: continuar para agente retomar investigacao/correcao
- Spawnar agente de continuacao (ver passo 5)

**Se `## INVESTIGATION INCONCLUSIVE`:**
- Mostrar o que foi verificado e eliminado
- Oferecer opcoes:
  - "Continuar investigando" - spawnar novo agente com contexto adicional
  - "Investigacao manual" - encerrar
  - "Adicionar mais contexto" - coletar mais sintomas, spawnar novamente

## 5. Spawnar Agente de Continuacao (Apos Checkpoint)

Quando usuario responde ao checkpoint, spawnar agente fresco:

```markdown
<objective>
Continuar depuracao {slug}. Evidencias estao no arquivo de debug.
</objective>

<prior_state>
<files_to_read>
- .plano/debug/{slug}.md (Estado da sessao de debug)
</files_to_read>
</prior_state>

<checkpoint_response>
**Type:** {checkpoint_type}
**Response:** {user_response}
</checkpoint_response>

<mode>
goal: find_and_fix
</mode>
```

```
Agent(
  prompt=continuation_prompt,
  subagent_type="up-depurador",
  description="Continuar depuracao {slug}"
)
```

</process>

<success_criteria>
- [ ] Sessoes ativas verificadas
- [ ] Sintomas coletados (se novo)
- [ ] up-depurador spawnado com contexto
- [ ] Checkpoints tratados corretamente
- [ ] Causa raiz confirmada antes de corrigir
</success_criteria>
