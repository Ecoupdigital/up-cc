<purpose>
Inicializar um novo projeto: questionamento, pesquisa (opcional), requisitos, roteiro. Este e o momento mais importante do projeto -- questionamento profundo aqui significa planos melhores, execucao melhor, resultados melhores.
</purpose>

<process>

## 1. Setup

**PRIMEIRO PASSO OBRIGATORIO -- Execute antes de qualquer interacao:**

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init novo-projeto)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `commit_docs`, `project_exists`, `planning_exists`, `has_existing_code`, `has_git`, `project_path`.

**Se `project_exists` = true:** Erro -- projeto ja inicializado. Use `/up:progresso`.

**Se `has_git` = false:** Inicializar git:
```bash
git init
```

## 2. Questionamento Profundo

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > QUESTIONAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Abrir a conversa:**

Pergunte inline (freeform, NAO AskUserQuestion):

"O que voce quer construir?"

Espere a resposta. Isso da o contexto para perguntas inteligentes.

**Seguir os fios:**

Com base na resposta, faca perguntas de acompanhamento que aprofundem. Use AskUserQuestion com opcoes que investiguem o que mencionaram -- interpretacoes, esclarecimentos, exemplos concretos.

Continue seguindo fios. Cada resposta abre novos fios para explorar. Pergunte sobre:
- O que os empolgou
- Qual problema gerou isso
- O que significam termos vagos
- Como seria na pratica
- O que ja esta decidido

Consulte `questioning.md` para tecnicas:
- Desafie vaguidao
- Torne o abstrato concreto
- Exponha suposicoes
- Encontre bordas
- Revele motivacao

**Portao de decisao:**

Quando puder escrever um PROJECT.md claro, use AskUserQuestion:

- header: "Pronto?"
- question: "Acho que entendi o que voce quer. Pronto para criar o PROJECT.md?"
- options:
  - "Criar PROJECT.md" -- Vamos em frente
  - "Continuar explorando" -- Quero compartilhar mais / me pergunte mais

Se "Continuar explorando" -- pergunte o que querem adicionar, ou identifique lacunas e investigue naturalmente.

Loop ate "Criar PROJECT.md" selecionado.

## 3. Escrever PROJECT.md

Sintetize todo o contexto em `.plano/PROJECT.md` usando o template de `templates/project.md`.

Inicialize requisitos como hipoteses:

```markdown
## Requisitos

### Validados

(Nenhum ainda -- lance para validar)

### Ativos

- [ ] [Requisito 1]
- [ ] [Requisito 2]
- [ ] [Requisito 3]

### Fora do Escopo

- [Exclusao 1] -- [por que]
- [Exclusao 2] -- [por que]
```

**Decisoes-Chave:**

Inicialize com decisoes tomadas durante questionamento:

```markdown
## Decisoes-Chave

| Decisao | Justificativa | Resultado |
|---------|---------------|-----------|
| [Escolha do questionamento] | [Por que] | -- Pendente |
```

**Rodape de ultima atualizacao:**

```markdown
---
*Ultima atualizacao: [data] apos inicializacao*
```

Nao comprima. Capture tudo que foi reunido.

**Commit PROJECT.md:**

```bash
mkdir -p .plano
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: inicializar projeto" --files .plano/PROJECT.md
```

## 4. Preferencias de Workflow

**Round 1 -- Configuracoes principais (3 perguntas):**

```
questions: [
  {
    header: "Modo",
    question: "Como voce quer trabalhar?",
    multiSelect: false,
    options: [
      { label: "YOLO (Recomendado)", description: "Auto-aprovar, apenas executar" },
      { label: "Interativo", description: "Confirmar a cada passo" }
    ]
  },
  {
    header: "Granularidade",
    question: "Quao finamente o escopo deve ser dividido em fases?",
    multiSelect: false,
    options: [
      { label: "Grosso", description: "Menos fases, mais amplas (3-5 fases, 1-3 planos cada)" },
      { label: "Padrao", description: "Tamanho de fase equilibrado (5-8 fases, 3-5 planos cada)" },
      { label: "Fino", description: "Muitas fases focadas (8-12 fases, 5-10 planos cada)" }
    ]
  },
  {
    header: "Execucao",
    question: "Executar planos em paralelo?",
    multiSelect: false,
    options: [
      { label: "Paralelo (Recomendado)", description: "Planos independentes rodam simultaneamente" },
      { label: "Sequencial", description: "Um plano por vez" }
    ]
  }
]
```

Criar `.plano/config.json`:

```json
{
  "mode": "yolo|interactive",
  "granularity": "coarse|standard|fine",
  "parallelization": true|false,
  "commit_docs": true
}
```

**Commit config.json:**

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "chore: adicionar config do projeto" --files .plano/config.json
```

## 5. Decisao de Pesquisa

Use AskUserQuestion:
- header: "Pesquisa"
- question: "Pesquisar o ecossistema do dominio antes de definir requisitos?"
- options:
  - "Pesquisar primeiro (Recomendado)" -- Descobrir stacks padrao, features esperadas, padroes de arquitetura
  - "Pular pesquisa" -- Conheco bem esse dominio, ir direto para requisitos

**Se "Pesquisar primeiro":**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > PESQUISANDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pesquisando ecossistema de [dominio]...
```

Criar diretorio de pesquisa:
```bash
mkdir -p .plano/pesquisa
```

Exibir indicador de spawn:
```
Spawning 4 pesquisadores em paralelo...
  -> Pesquisa de Stack
  -> Pesquisa de Features
  -> Pesquisa de Arquitetura
  -> Pesquisa de Armadilhas
```

Spawn 4 agentes up-pesquisador-projeto em paralelo:

```
Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Stack para [dominio].
</research_type>

<question>
Qual e a stack padrao de 2025 para [dominio]?
</question>

<files_to_read>
- {project_path} (Contexto e objetivos do projeto)
</files_to_read>

<output>
Write to: .plano/pesquisa/STACK.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa de Stack")

Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Features para [dominio].
</research_type>

<question>
Quais features produtos de [dominio] tem? O que e obrigatorio vs diferenciador?
</question>

<files_to_read>
- {project_path} (Contexto do projeto)
</files_to_read>

<output>
Write to: .plano/pesquisa/FEATURES.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa de Features")

Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Arquitetura para [dominio].
</research_type>

<question>
Como sistemas de [dominio] sao tipicamente estruturados? Quais os componentes principais?
</question>

<files_to_read>
- {project_path} (Contexto do projeto)
</files_to_read>

<output>
Write to: .plano/pesquisa/ARCHITECTURE.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa de Arquitetura")

Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Armadilhas para [dominio].
</research_type>

<question>
O que projetos de [dominio] comumente erram? Erros criticos?
</question>

<files_to_read>
- {project_path} (Contexto do projeto)
</files_to_read>

<output>
Write to: .plano/pesquisa/PITFALLS.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa de Armadilhas")
```

Apos os 4 agentes completarem, spawn sintetizador para criar SUMMARY.md:

```
Task(prompt="
<task>
Sintetizar outputs de pesquisa em SUMMARY.md.
</task>

<files_to_read>
- .plano/pesquisa/STACK.md
- .plano/pesquisa/FEATURES.md
- .plano/pesquisa/ARCHITECTURE.md
- .plano/pesquisa/PITFALLS.md
</files_to_read>

<output>
Write to: .plano/pesquisa/SUMMARY.md
Commit apos escrever.
</output>
", subagent_type="up-sintetizador", description="Sintetizar pesquisa")
```

Exibir banner de pesquisa completa e achados-chave:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > PESQUISA COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Achados-Chave

**Stack:** [de SUMMARY.md]
**Obrigatorio:** [de SUMMARY.md]
**Cuidado com:** [de SUMMARY.md]

Arquivos: `.plano/pesquisa/`
```

**Se "Pular pesquisa":** Continue para Passo 6.

## 6. Definir Requisitos

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > DEFININDO REQUISITOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Carregar contexto:**

Ler PROJECT.md e extrair:
- Valor central (a UNICA coisa que deve funcionar)
- Restricoes declaradas (orcamento, timeline, limitacoes tecnicas)
- Quaisquer fronteiras de escopo explicitas

**Se pesquisa existe:** Ler pesquisa/FEATURES.md e extrair categorias de features.

**Apresentar features por categoria:**

```
Aqui estao as features para [dominio]:

## Autenticacao
**Obrigatorio:**
- Cadastro com email/senha
- Verificacao de email
- Reset de senha

**Diferenciadores:**
- Login com magic link
- OAuth (Google, GitHub)

---

## [Proxima Categoria]
...
```

**Se nao ha pesquisa:** Reunir requisitos por conversa.

Pergunte: "Quais sao as principais coisas que usuarios precisam fazer?"

**Escopar cada categoria:**

Para cada categoria, use AskUserQuestion:

- header: "[Categoria]" (max 12 chars)
- question: "Quais features de [categoria] estao no v1?"
- multiSelect: true
- options:
  - "[Feature 1]" -- [descricao breve]
  - "[Feature 2]" -- [descricao breve]
  - "Nenhuma para v1" -- Adiar categoria inteira

**Gerar REQUIREMENTS.md:**

Criar `.plano/REQUIREMENTS.md` com:
- Requisitos v1 agrupados por categoria (checkboxes, REQ-IDs)
- Requisitos v2 (adiados)
- Fora do Escopo (exclusoes explicitas com raciocinio)

**Formato REQ-ID:** `[CATEGORIA]-[NUMERO]` (AUTH-01, CONTENT-02)

**Apresentar lista completa de requisitos:**

Mostrar cada requisito para confirmacao do usuario.

Se "ajustar": Retornar ao escopo.

**Commit requisitos:**

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: definir requisitos v1" --files .plano/REQUIREMENTS.md
```

## 7. Criar Roteiro

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > CRIANDO ROTEIRO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Spawning roteirista...
```

Spawn agente up-roteirista:

```
Task(prompt="
<planning_context>

<files_to_read>
- .plano/PROJECT.md (Contexto do projeto)
- .plano/REQUIREMENTS.md (Requisitos v1)
- .plano/pesquisa/SUMMARY.md (Achados de pesquisa - se existir)
- .plano/config.json (Configuracoes de granularidade e modo)
</files_to_read>

</planning_context>

<instructions>
Criar roteiro:
1. Derivar fases dos requisitos (nao impor estrutura)
2. Mapear cada requisito v1 a exatamente uma fase
3. Derivar 2-5 criterios de sucesso por fase (comportamentos observaveis do usuario)
4. Validar 100% de cobertura
5. Escrever arquivos imediatamente (ROADMAP.md, STATE.md, atualizar REQUIREMENTS.md rastreabilidade)
6. Retornar ROADMAP CREATED com resumo

Escreva arquivos primeiro, depois retorne.
</instructions>
", subagent_type="up-roteirista", description="Criar roteiro")
```

**Tratar retorno do roteirista:**

**Se `## ROADMAP BLOCKED`:**
- Apresentar informacao do bloqueio
- Trabalhar com usuario para resolver
- Re-spawn quando resolvido

**Se `## ROADMAP CREATED`:**

Ler ROADMAP.md criado e apresentar inline:

```
---

## Roteiro Proposto

**[N] fases** | **[X] requisitos mapeados** | Todos requisitos v1 cobertos

| # | Fase | Objetivo | Requisitos | Criterios |
|---|------|----------|------------|-----------|
| 1 | [Nome] | [Objetivo] | [REQ-IDs] | [contagem] |
| 2 | [Nome] | [Objetivo] | [REQ-IDs] | [contagem] |
```

**Pedir aprovacao antes de commitar:**

Use AskUserQuestion:
- header: "Roteiro"
- question: "Essa estrutura de roteiro funciona para voce?"
- options:
  - "Aprovar" -- Commitar e continuar
  - "Ajustar fases" -- Me diga o que mudar
  - "Revisar arquivo completo" -- Mostrar ROADMAP.md bruto

**Se "Aprovar":** Continuar para commit.

**Se "Ajustar fases":**
- Pegar notas de ajuste do usuario
- Re-spawn roteirista com contexto de revisao
- Loop ate usuario aprovar

**Commit roteiro (apos aprovacao):**

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: criar roteiro ([N] fases)" --files .plano/ROADMAP.md .plano/STATE.md .plano/REQUIREMENTS.md
```

## 8. Finalizado

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > PROJETO INICIALIZADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Nome do Projeto]**

| Artefato       | Localizacao               |
|----------------|---------------------------|
| Projeto        | `.plano/PROJECT.md`       |
| Config         | `.plano/config.json`      |
| Pesquisa       | `.plano/pesquisa/`        |
| Requisitos     | `.plano/REQUIREMENTS.md`  |
| Roteiro        | `.plano/ROADMAP.md`       |

**[N] fases** | **[X] requisitos** | Pronto para construir

───────────────────────────────────────────────────────────────

## Proximo

**Fase 1: [Nome da Fase]** -- [Objetivo do ROADMAP.md]

/up:discutir-fase 1 -- reunir contexto e esclarecer abordagem

<sub>/clear primeiro -> janela de contexto limpa</sub>

---

**Tambem disponivel:**
- /up:planejar-fase 1 -- pular discussao, planejar diretamente

───────────────────────────────────────────────────────────────
```

</process>

<output>

- `.plano/PROJECT.md`
- `.plano/config.json`
- `.plano/pesquisa/` (se pesquisa selecionada)
  - `STACK.md`
  - `FEATURES.md`
  - `ARCHITECTURE.md`
  - `PITFALLS.md`
  - `SUMMARY.md`
- `.plano/REQUIREMENTS.md`
- `.plano/ROADMAP.md`
- `.plano/STATE.md`

</output>

<success_criteria>

- [ ] .plano/ diretorio criado
- [ ] Git repo inicializado
- [ ] Questionamento profundo completo (fios seguidos, nao apressado)
- [ ] PROJECT.md captura contexto completo -> **committed**
- [ ] config.json tem modo, granularidade, paralelizacao -> **committed**
- [ ] Pesquisa completa (se selecionada) -- 4 agentes paralelos spawned -> **committed**
- [ ] Requisitos reunidos (de pesquisa ou conversa)
- [ ] Usuario escopo cada categoria (v1/v2/fora do escopo)
- [ ] REQUIREMENTS.md criado com REQ-IDs -> **committed**
- [ ] up-roteirista spawned com contexto
- [ ] Arquivos do roteiro escritos imediatamente
- [ ] Feedback do usuario incorporado (se houver)
- [ ] ROADMAP.md criado com fases, mapeamentos de requisitos, criterios de sucesso
- [ ] STATE.md inicializado
- [ ] REQUIREMENTS.md rastreabilidade atualizada
- [ ] Usuario sabe que proximo passo e `/up:discutir-fase 1`

**Commits atomicos:** Cada etapa commita seus artefatos imediatamente.

</success_criteria>
