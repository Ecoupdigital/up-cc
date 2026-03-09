<purpose>
Inicializar projeto: questionamento, pesquisa (opcional), requisitos, roteiro. Detecta automaticamente se e greenfield (sem codigo) ou brownfield (codigo existente) e adapta o fluxo.

Este e o momento mais importante do projeto -- questionamento profundo aqui significa planos melhores, execucao melhor, resultados melhores.
</purpose>

<process>

## 1. Setup

**PRIMEIRO PASSO OBRIGATORIO -- Execute antes de qualquer interacao:**

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init novo-projeto)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `commit_docs`, `project_exists`, `planning_exists`, `has_existing_code`, `has_codebase_map`, `codebase_files`, `has_git`, `project_path`.

**Se `project_exists` = true:**

Use AskUserQuestion:
- header: "Projeto existente"
- question: "Ja existe um PROJECT.md. O que voce quer fazer?"
- options:
  - "Revisar e atualizar" -- Atualizar projeto existente com novos objetivos
  - "Recomecar do zero" -- Apagar e reinicializar (PROJECT.md sera recriado)
  - "Cancelar" -- Manter como esta

Se "Revisar e atualizar": Ler PROJECT.md existente, pular para passo 2 com contexto carregado.
Se "Recomecar do zero": Continuar normalmente (sobrescreve).
Se "Cancelar": Sair. Sugerir `/up:progresso`.

**Se `has_git` = false:** Inicializar git:
```bash
git init
```

**Determinar modo:**
- `has_existing_code` = true OU `has_codebase_map` = true → **MODO BROWNFIELD**
- Caso contrario → **MODO GREENFIELD**

## 2. Questionamento Profundo

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > QUESTIONAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### MODO GREENFIELD

**Abrir a conversa:**

Pergunte inline (freeform, NAO AskUserQuestion):

"O que voce quer construir?"

Espere a resposta. Isso da o contexto para perguntas inteligentes.

### MODO BROWNFIELD

**Carregar contexto do codebase:**

Se `has_codebase_map` = true:
```bash
# Ler documentos do mapeamento
cat .plano/codebase/STACK.md 2>/dev/null
cat .plano/codebase/ARCHITECTURE.md 2>/dev/null
cat .plano/codebase/CONCERNS.md 2>/dev/null
```

Se `has_codebase_map` = false (tem codigo mas nao mapeou):
```bash
# Mini-scan: detectar stack e estrutura
ls package.json go.mod Cargo.toml requirements.txt pyproject.toml pom.xml build.gradle composer.json Gemfile 2>/dev/null
ls -d src/ app/ lib/ cmd/ internal/ pages/ components/ 2>/dev/null | head -10
```

**Apresentar o que ja sabemos:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > PROJETO EXISTENTE DETECTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Se mapeamento existe:]
Stack: [de STACK.md]
Arquitetura: [resumo de ARCHITECTURE.md]
Preocupacoes: [de CONCERNS.md]

[Se sem mapeamento:]
Detectado: [stack inferido dos arquivos de config]
Estrutura: [diretorios encontrados]

Dica: /up:mapear-codigo produz analise mais detalhada
```

**Abrir a conversa (brownfield):**

Pergunte inline (freeform, NAO AskUserQuestion):

"Voce ja tem codigo rodando. O que voce quer fazer com ele? (novas features, refatoracao, correcoes, migracoes...)"

Espere a resposta.

### AMBOS OS MODOS — Seguir os fios

Com base na resposta, faca perguntas de acompanhamento que aprofundem. Use AskUserQuestion com opcoes que investiguem o que mencionaram -- interpretacoes, esclarecimentos, exemplos concretos.

Continue seguindo fios. Cada resposta abre novos fios para explorar. Pergunte sobre:
- O que os empolgou
- Qual problema gerou isso
- O que significam termos vagos
- Como seria na pratica
- O que ja esta decidido

**Brownfield extra — pergunte tambem:**
- O que funciona bem e NAO deve mudar
- O que causa mais dor
- Se ha divida tecnica urgente
- Se ha restricoes de retrocompatibilidade

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

### MODO GREENFIELD

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

### MODO BROWNFIELD

Inferir requisitos validados do codebase existente, separar objetivos novos:

```markdown
## Requisitos

### Validados

<!-- Inferidos do codebase existente -- ja funcionam em producao -->

- [x] [Feature existente 1 inferida do codigo]
- [x] [Feature existente 2 inferida do codigo]
- [x] [Padrao estabelecido inferido do codigo]

### Ativos

<!-- Novos objetivos do usuario para este trabalho -->

- [ ] [Novo objetivo 1]
- [ ] [Novo objetivo 2]
- [ ] [Novo objetivo 3]

### Fora do Escopo

- [Exclusao 1] -- [por que]
- [Exclusao 2] -- [por que]
```

Se `has_codebase_map` = true, popular secao Contexto com dados do mapeamento:

```markdown
## Contexto

**Codebase existente mapeado em:** .plano/codebase/

- **Stack:** [de STACK.md]
- **Arquitetura:** [de ARCHITECTURE.md]
- **Convencoes:** Ver .plano/codebase/CONVENTIONS.md
- **Divida tecnica:** [resumo de CONCERNS.md]
- **Testes:** [resumo de TESTING.md]
```

### AMBOS OS MODOS

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

### MODO BROWNFIELD

**Se `has_codebase_map` = true:**

A pesquisa de stack/arquitetura ja foi feita pelo mapeamento. Oferecer pesquisa focada:

Use AskUserQuestion:
- header: "Pesquisa"
- question: "O mapeamento do codebase ja cobriu stack e arquitetura. Quer pesquisar algo especifico?"
- options:
  - "Pesquisar novas tecnologias" -- Pesquisar apenas tecnologias/padroes NOVOS que voce quer adotar
  - "Pular pesquisa" -- Conheco o que preciso, ir para requisitos

**Se "Pesquisar novas tecnologias":** Pesquisa focada apenas no que e NOVO (nao re-pesquisar stack existente).

**Se `has_codebase_map` = false:**

Use AskUserQuestion:
- header: "Pesquisa"
- question: "Quer que eu analise o codebase antes de definir requisitos?"
- options:
  - "Mapear codebase (Recomendado)" -- Analise profunda com /up:mapear-codigo
  - "Pesquisa leve" -- Pesquisa de ecossistema sem mapeamento completo
  - "Pular" -- Conheco bem o projeto

Se "Mapear codebase": Sugerir `/up:mapear-codigo` e depois retomar `/up:novo-projeto`. Sair.

### MODO GREENFIELD

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

### MODO BROWNFIELD

**Carregar requisitos existentes do codebase:**

Se `has_codebase_map` = true:
- Ler `.plano/codebase/ARCHITECTURE.md` para features existentes
- Ler `.plano/codebase/CONCERNS.md` para divida tecnica

Apresentar o que ja existe como requisitos validados:

```
## O que ja existe (inferido do codebase)

### Funcionalidades existentes
- [Feature 1 detectada]
- [Feature 2 detectada]
- ...

### Divida tecnica identificada
- [Concern 1 de CONCERNS.md]
- [Concern 2 de CONCERNS.md]
```

Pergunte: "Quais sao seus objetivos? (novas features, correcoes, refatoracao, migracoes)"

Para cada objetivo, usar AskUserQuestion para escopar e priorizar.

### MODO GREENFIELD

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

### AMBOS OS MODOS

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
- .plano/codebase/CONCERNS.md (Divida tecnica - se existir, BROWNFIELD)
- .plano/codebase/CONVENTIONS.md (Convencoes a seguir - se existir, BROWNFIELD)
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

**Se projeto brownfield:**
- Ler .plano/codebase/ARCHITECTURE.md e .plano/codebase/STACK.md para entender o que ja existe
- Agrupar funcionalidades existentes em fases macro concluidas (max 3-6 fases, por dominio)
- Fases existentes usam checkbox marcado [x], status "Existente", sem criterios de sucesso, sem planos
- Numerar fases NOVAS apos as existentes (ex: se 3 fases existentes, nova fase comeca em 4)
- Considerar divida tecnica de CONCERNS.md ao priorizar fases novas
- Respeitar convencoes existentes de CONVENTIONS.md
- Fases de refatoracao/correcao devem vir antes de features que dependem delas

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
[Se brownfield:]
| Codebase       | `.plano/codebase/`        |

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
- [ ] Modo detectado (greenfield vs brownfield)
- [ ] Se brownfield: codebase map carregado (ou mini-scan feito)
- [ ] Se brownfield: requisitos validados inferidos do codebase
- [ ] Questionamento profundo completo (fios seguidos, nao apressado)
- [ ] PROJECT.md captura contexto completo -> **committed**
- [ ] config.json tem modo, granularidade, paralelizacao -> **committed**
- [ ] Pesquisa completa (se selecionada) -- adaptada ao modo -> **committed**
- [ ] Requisitos reunidos (de pesquisa, codebase ou conversa)
- [ ] Usuario escopo cada categoria (v1/v2/fora do escopo)
- [ ] REQUIREMENTS.md criado com REQ-IDs -> **committed**
- [ ] up-roteirista spawned com contexto (inclui codebase docs se brownfield)
- [ ] Arquivos do roteiro escritos imediatamente
- [ ] Feedback do usuario incorporado (se houver)
- [ ] ROADMAP.md criado com fases, mapeamentos de requisitos, criterios de sucesso
- [ ] STATE.md inicializado
- [ ] REQUIREMENTS.md rastreabilidade atualizada
- [ ] Usuario sabe que proximo passo e `/up:discutir-fase 1`

**Commits atomicos:** Cada etapa commita seus artefatos imediatamente.

</success_criteria>
