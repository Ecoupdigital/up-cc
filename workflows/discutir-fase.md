<purpose>
Extrair decisoes de implementacao que agentes downstream precisam. Analisar a fase para identificar areas cinzentas, deixar o usuario escolher o que discutir, entao aprofundar em cada area selecionada ate ficar satisfeito.

Voce e um parceiro de pensamento, nao um entrevistador. O usuario e o visionario -- voce e o construtor. Seu trabalho e capturar decisoes que guiarao pesquisa e planejamento.
</purpose>

<scope_guardrail>
**CRITICO: Sem inflacao de escopo.**

O limite da fase vem do ROADMAP.md e e FIXO. Discussao esclarece COMO implementar o que esta no escopo, nunca SE adicionar novas capacidades.

**Permitido (esclarecer ambiguidade):**
- "Como posts devem ser exibidos?" (layout, densidade, info mostrada)
- "O que acontece no estado vazio?" (dentro da feature)

**Nao permitido (inflacao de escopo):**
- "Devemos tambem adicionar comentarios?" (nova capacidade)
- "E sobre busca/filtragem?" (nova capacidade)

**Quando usuario sugere inflacao de escopo:**
```
"[Feature X] seria uma nova capacidade -- e uma fase propria.
Quer que eu anote para o backlog do roteiro?

Por agora, vamos focar em [dominio da fase]."
```

Capturar a ideia em secao "Ideias Adiadas". Nao perca, nao atue sobre ela.
</scope_guardrail>

<process>

<step name="initialize" priority="first">
Numero da fase do argumento (obrigatorio).

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init phase-op "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `plan_count`, `roadmap_exists`, `planning_exists`.

**Se `phase_found` = false:**
```
Fase [X] nao encontrada no roteiro.

Use /up:progresso para ver fases disponiveis.
```
Sair do workflow.

**Se `phase_found` = true:** Continuar para check_existing.
</step>

<step name="check_existing">
Verificar se CONTEXT.md ja existe usando `has_context` do init.

**Se existe:**
Use AskUserQuestion:
- header: "Contexto"
- question: "Fase [X] ja tem contexto. O que voce quer fazer?"
- options:
  - "Atualizar" -- Revisar e atualizar contexto existente
  - "Ver" -- Mostrar o que tem la
  - "Pular" -- Usar contexto existente como esta

Se "Atualizar": Carregar existente, continuar para analyze_phase
Se "Ver": Exibir CONTEXT.md, depois oferecer atualizar/pular
Se "Pular": Sair do workflow

**Se nao existe:** Continuar para load_prior_context.
</step>

<step name="load_prior_context">
Ler contexto de nivel de projeto e de fases anteriores para evitar re-perguntar questoes ja decididas.

**Passo 1: Ler arquivos do projeto**
```bash
cat .plano/PROJECT.md 2>/dev/null
cat .plano/REQUIREMENTS.md 2>/dev/null
cat .plano/STATE.md 2>/dev/null
```

Extrair:
- **PROJECT.md** -- Visao, principios, nao-negociaveis, preferencias do usuario
- **REQUIREMENTS.md** -- Criterios de aceitacao, restricoes
- **STATE.md** -- Progresso atual, flags ou notas

**Passo 2: Ler todos CONTEXT.md de fases anteriores**
```bash
find .plano/fases -name "*-CONTEXT.md" 2>/dev/null | sort
```

Para cada CONTEXT.md onde numero da fase < fase atual:
- Ler secao `<decisions>` -- sao preferencias travadas
- Ler `<specifics>` -- referencias particulares ou momentos "quero como X"
- Notar padroes

**Passo 3: Construir contexto interno `<prior_decisions>`**

**Uso nos passos seguintes:**
- `analyze_phase`: Pular areas cinzentas ja decididas
- `present_gray_areas`: Anotar opcoes com decisoes anteriores
- `discuss_areas`: Pre-preencher respostas ou sinalizar conflitos
</step>

<step name="analyze_phase">
Analisar a fase para identificar areas cinzentas que valem discussao.

**Ler descricao da fase do ROADMAP.md e determinar:**

1. **Limite do dominio** -- Qual capacidade essa fase entrega? Declarar claramente.

2. **Verificar decisoes anteriores** -- Antes de gerar areas cinzentas, verificar se ja foram decididas.

3. **Areas cinzentas por categoria** -- Para cada categoria relevante, identificar 1-2 ambiguidades especificas que mudariam implementacao.

4. **Avaliacao de pulo** -- Se nao ha areas cinzentas significativas (infraestrutura pura, implementacao clara, ou tudo ja decidido), a fase pode nao precisar de discussao.
</step>

<step name="present_gray_areas">
Apresentar limite do dominio, decisoes anteriores e areas cinzentas ao usuario.

**Primeiro, declarar limite e decisoes anteriores que se aplicam:**
```
Fase [X]: [Nome]
Dominio: [O que esta fase entrega -- da sua analise]

Vamos esclarecer COMO implementar isso.
(Novas capacidades pertencem a outras fases.)

[Se decisoes anteriores se aplicam:]
**Herdado de fases anteriores:**
- [Decisao da Fase N que se aplica aqui]
```

**Usar AskUserQuestion (multiSelect: true):**
- header: "Discutir"
- question: "Quais areas voce quer discutir para [nome da fase]?"
- options: Gerar 3-4 areas cinzentas especificas da fase

**NAO incluir opcao "pular" ou "voce decide".** Usuario executou este comando para discutir.
</step>

<step name="discuss_areas">
Para cada area selecionada, conduzir loop de discussao focada.

**Filosofia: 4 perguntas, depois verificar.**

**Para cada area:**

1. **Anunciar a area:**
   ```
   Vamos falar sobre [Area].
   ```

2. **Perguntar 4 questoes usando AskUserQuestion:**
   - header: "[Area]" (max 12 chars)
   - question: Decisao especifica para esta area
   - options: 2-3 escolhas concretas, com escolha recomendada destacada
   - Incluir "Voce decide" como opcao quando razoavel

3. **Apos 4 perguntas, verificar:**
   - header: "[Area]" (max 12 chars)
   - question: "Mais perguntas sobre [area], ou ir para proxima?"
   - options: "Mais perguntas" / "Proxima area"

4. **Apos todas areas selecionadas completarem:**
   - Resumir o que foi capturado
   - AskUserQuestion:
     - header: "Pronto"
     - question: "Discutimos [listar areas]. Quais areas cinzentas permanecem?"
     - options: "Explorar mais areas" / "Pronto para contexto"
   - Se "Explorar mais": identificar 2-4 areas adicionais, voltar ao loop
   - Se "Pronto para contexto": Prosseguir para write_context

**Tratamento de inflacao de escopo:**
Se usuario mencionar algo fora do dominio da fase:
```
"[Feature] parece uma nova capacidade -- pertence a propria fase.
Vou anotar como ideia adiada.

Voltando para [area atual]: [retornar a pergunta atual]"
```
</step>

<step name="write_context">
Criar CONTEXT.md capturando decisoes tomadas.

Usar valores do init: `phase_dir`, `phase_slug`, `padded_phase`.

Se `phase_dir` e null:
```bash
mkdir -p ".plano/fases/${padded_phase}-${phase_slug}"
```

**Local do arquivo:** `${phase_dir}/${padded_phase}-CONTEXT.md`

```markdown
# Fase [X]: [Nome] - Contexto

**Reunido:** [data]
**Status:** Pronto para planejamento

<domain>
## Limite da Fase

[Declaracao clara do que esta fase entrega -- a ancora de escopo]

</domain>

<decisions>
## Decisoes de Implementacao

### [Categoria 1 discutida]
- [Decisao ou preferencia capturada]

### [Categoria 2 discutida]
- [Decisao ou preferencia capturada]

### Criterio do Claude
[Areas onde usuario disse "voce decide"]

</decisions>

<specifics>
## Ideias Especificas

[Referencias particulares, exemplos, ou momentos "quero como X"]

[Se nenhum: "Sem requisitos especificos -- aberto a abordagens padrao"]

</specifics>

<deferred>
## Ideias Adiadas

[Ideias que surgiram mas pertencem a outras fases.]

[Se nenhuma: "Nenhuma -- discussao manteve-se no escopo da fase"]

</deferred>

---

*Fase: XX-nome*
*Contexto reunido: [data]*
```

Escrever arquivo.
</step>

<step name="confirm_creation">
Apresentar resumo e proximos passos:

```
Criado: .plano/fases/${PADDED_PHASE}-${SLUG}/${PADDED_PHASE}-CONTEXT.md

## Decisoes Capturadas

### [Categoria]
- [Decisao-chave]

[Se ideias adiadas existem:]
## Anotado para Depois
- [Ideia adiada] -- fase futura

---

## Proximo

**Fase ${PHASE}: [Nome]** -- [Objetivo do ROADMAP.md]

`/up:planejar-fase ${PHASE}`

<sub>`/clear` primeiro -> janela de contexto limpa</sub>

---

**Tambem disponivel:**
- Revisar/editar CONTEXT.md antes de continuar

---
```
</step>

<step name="git_commit">
Commit do contexto da fase:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(${padded_phase}): capturar contexto da fase" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
```
</step>

<step name="update_state">
Atualizar STATE.md com info da sessao:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" state record-session \
  --stopped-at "Fase ${PHASE} contexto reunido" \
  --resume-file "${phase_dir}/${padded_phase}-CONTEXT.md"
```

Commit STATE.md:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(state): registrar sessao de contexto fase ${PHASE}" --files .plano/STATE.md
```
</step>

</process>

<success_criteria>
- Fase validada contra roteiro
- Contexto anterior carregado (PROJECT.md, REQUIREMENTS.md, STATE.md, CONTEXT.md anteriores)
- Questoes ja decididas nao re-perguntadas
- Areas cinzentas identificadas com analise inteligente
- Usuario selecionou quais areas discutir
- Cada area explorada ate usuario ficar satisfeito
- Inflacao de escopo redirecionada para ideias adiadas
- CONTEXT.md captura decisoes reais, nao visao vaga
- Ideias adiadas preservadas para fases futuras
- STATE.md atualizado com info da sessao
- Usuario sabe proximos passos
</success_criteria>