---
phase: 07-comando-melhorias
plan: 07-002
type: feature
autonomous: true
wave: 1
depends_on: [07-001]
requirements: [MELH-01, INFRA-04]
must_haves:
  truths:
    - "Workflow melhorias.md orquestra: init -> standalone setup -> stack detection -> spawn 3 auditores em paralelo -> spawn sintetizador -> apresentar relatorio"
    - "Em projeto sem .plano/, o workflow cria .plano/melhorias/ automaticamente sem erro"
    - "Tres agentes auditores (up-auditor-ux, up-auditor-performance, up-auditor-modernidade) sao spawnados em paralelo via Task"
    - "Apos auditores, up-sintetizador-melhorias e spawnado para consolidar relatorio"
    - "Usuario ve relatorio final com sugestoes em 4 quadrantes (quick wins, estrategicos, preenchimentos, evitar)"
  artifacts:
    - path: "up/workflows/melhorias.md"
      provides: "Workflow completo de orquestracao do comando /up:melhorias"
  key_links:
    - from: "up/commands/melhorias.md"
      to: "up/workflows/melhorias.md"
      via: "@~/.claude/up/workflows/melhorias.md no execution_context do command"
    - from: "up/workflows/melhorias.md"
      to: "up/bin/up-tools.cjs"
      via: "node $HOME/.claude/up/bin/up-tools.cjs init melhorias"
    - from: "up/workflows/melhorias.md"
      to: "up/agents/up-auditor-ux.md"
      via: "Task(subagent_type=up-auditor-ux)"
    - from: "up/workflows/melhorias.md"
      to: "up/agents/up-auditor-performance.md"
      via: "Task(subagent_type=up-auditor-performance)"
    - from: "up/workflows/melhorias.md"
      to: "up/agents/up-auditor-modernidade.md"
      via: "Task(subagent_type=up-auditor-modernidade)"
    - from: "up/workflows/melhorias.md"
      to: "up/agents/up-sintetizador-melhorias.md"
      via: "Task(subagent_type=up-sintetizador-melhorias)"
---

# Fase 7 Plano 2: Workflow de orquestracao do /up:melhorias

**Objetivo:** Criar o workflow que orquestra o pipeline completo de auditoria: inicializar standalone, detectar stack, spawnar 3 auditores em paralelo, coletar resultados, spawnar sintetizador, apresentar relatorio ao usuario. Este e o cerebro do comando /up:melhorias.

## Pesquisa Inline -- Achados

**Padrao workflow (de executar-fase.md, rapido.md, mapear-codigo.md):**
- Estrutura: `<purpose>`, `<process>` com passos numerados, `<success_criteria>`
- Init via bash: `INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init ...)` com guard `@file:`
- Spawn agentes via Task com `subagent_type`, prompt inclui `<files_to_read>` e `<objective>`
- Spawn paralelo: multiplos Task na mesma mensagem (executar-fase.md step execute_waves)
- Sequencial: spawn um, esperar, spawnar proximo (rapido.md passos 4-5)

**Padrao standalone (mapear-codigo.md):**
- Verifica existencia de diretorio, cria se nao existe
- NAO exige ROADMAP.md/STATE.md
- Pode rodar antes/depois de /up:novo-projeto

**Spawn dos auditores (das definicoes dos agentes ja criados, fase 5):**
- up-auditor-ux: produz `.plano/melhorias/ux-sugestoes.md`
- up-auditor-performance: produz `.plano/melhorias/performance-sugestoes.md`
- up-auditor-modernidade: produz `.plano/melhorias/modernidade-sugestoes.md`
- Todos leem references de `$HOME/.claude/up/references/audit-*.md` e template de `$HOME/.claude/up/templates/suggestion.md`
- Retornam formato: `## AUDITORIA {DIMENSAO} COMPLETA` com resumo

**Spawn do sintetizador (fase 6):**
- up-sintetizador-melhorias: le 3 arquivos de sugestoes, deduplica, classifica em quadrantes
- Produz `.plano/melhorias/RELATORIO.md`
- Retorna formato: `## SINTESE DE MELHORIAS COMPLETA`

**Stack detection no workflow vs nos agentes:**
- Cada agente faz sua propria stack detection detalhada (step 1 de cada agente)
- O workflow faz apenas deteccao BASICA via `stack_hints` do init JSON para reportar ao usuario
- A deteccao granular fica dentro dos agentes (mais contexto fresco para analise)

## Contexto

@up/workflows/executar-fase.md -- referencia de spawn paralelo de agentes
@up/workflows/rapido.md -- referencia de workflow standalone com Task sequencial
@up/workflows/mapear-codigo.md -- referencia de padrao standalone que cria diretorios
@up/agents/up-auditor-ux.md -- agente UX, output format e files_to_read esperado
@up/agents/up-auditor-performance.md -- agente performance, output format
@up/agents/up-auditor-modernidade.md -- agente modernidade, output format
@up/agents/up-sintetizador-melhorias.md -- sintetizador, input esperado (3 arquivos)
@up/templates/report.md -- formato do relatorio consolidado

## Tarefas

<task id="1" type="auto">
<files>up/workflows/melhorias.md</files>
<action>
Criar workflow completo de orquestracao para /up:melhorias. O workflow segue 7 passos sequenciais com spawn paralelo dos auditores no passo 4.

**Estrutura do arquivo:**

Iniciar com `<purpose>`:
```
Executar auditoria completa do codebase com 3 agentes paralelos (UX, performance, modernidade) e sintetizar resultados em relatorio consolidado. Funciona standalone -- nao requer /up:novo-projeto.
```

Seguido de `<process>` contendo os 7 passos abaixo.

---

**Passo 1: Inicializar e carregar contexto**

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init melhorias)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `planning_exists`, `melhorias_dir`, `melhorias_exists`, `has_claude_md`, `has_package_json`, `date`, `timestamp`, `commit_docs`, `stack_hints`.

Exibir banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > AUDITORIA DE MELHORIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Passo 2: Setup standalone (INFRA-04)**

Se `melhorias_exists` = true: perguntar ao usuario se quer sobrescrever a auditoria anterior ou cancelar. Usar AskUserQuestion:
```
AskUserQuestion(
  header: "Auditoria Anterior Encontrada",
  question: "Ja existe uma auditoria em .plano/melhorias/. Deseja sobrescrever?",
  followUp: null
)
```
Se usuario diz nao/cancelar, sair com mensagem: "Auditoria cancelada. Relatorio anterior permanece em .plano/melhorias/RELATORIO.md"

Se `melhorias_exists` = false:
```bash
mkdir -p .plano/melhorias
```

Se `planning_exists` = false (nao tem .plano/ de nenhum tipo):
```bash
mkdir -p .plano/melhorias
```
(O mkdir -p cria ambos diretorios).

Reportar:
```
Diretorio de auditoria: .plano/melhorias/
Modo: Standalone (sem pre-requisitos)
```

---

**Passo 3: Reportar deteccao de stack**

Usar `stack_hints` do init JSON para reportar ao usuario o que foi detectado:

```
## Stack Detectada

[Listar: framework frontend, meta-framework, CSS, ORM, TypeScript -- baseado nos booleans de stack_hints]

Agentes auditores farao deteccao granular durante a analise.
```

Se `has_package_json` = false:
```
Nenhum package.json encontrado. Agentes tentarao detectar stack por outros sinais.
```

---

**Passo 4: Spawn 3 auditores em PARALELO**

Spawnar os 3 agentes na MESMA mensagem (paralelo via Task). Cada agente recebe contexto minimo -- eles leem seus proprios references e templates internamente.

**Agente 1: Auditor UX**
```
Task(
  subagent_type="up-auditor-ux",
  prompt="
<objective>
Executar auditoria completa de UX/usabilidade do codebase deste projeto.
Salvar resultado em .plano/melhorias/ux-sugestoes.md
</objective>

<files_to_read>
- ./CLAUDE.md (se existir -- instrucoes do projeto)
</files_to_read>

<constraints>
- Carregar reference: $HOME/.claude/up/references/audit-ux.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Detectar stack do projeto (step 1 do agente)
- Analisar todos arquivos relevantes para UX
- Produzir sugestoes UX-NNN no formato do template
- Incluir mapa de cobertura obrigatorio (INFRA-03)
- Salvar resultado em .plano/melhorias/ux-sugestoes.md
- Retornar resumo no formato: ## AUDITORIA UX COMPLETA
</constraints>
",
  description="Auditoria UX do codebase"
)
```

**Agente 2: Auditor Performance**
```
Task(
  subagent_type="up-auditor-performance",
  prompt="
<objective>
Executar auditoria completa de performance do codebase deste projeto.
Salvar resultado em .plano/melhorias/performance-sugestoes.md
</objective>

<files_to_read>
- ./CLAUDE.md (se existir -- instrucoes do projeto)
</files_to_read>

<constraints>
- Carregar reference: $HOME/.claude/up/references/audit-performance.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Detectar stack do projeto (step 1 do agente)
- Analisar anti-padroes de performance em 8 categorias
- Produzir sugestoes PERF-NNN no formato do template
- Incluir mapa de cobertura obrigatorio (INFRA-03)
- Salvar resultado em .plano/melhorias/performance-sugestoes.md
- Retornar resumo no formato: ## AUDITORIA PERFORMANCE COMPLETA
</constraints>
",
  description="Auditoria de performance do codebase"
)
```

**Agente 3: Auditor Modernidade**
```
Task(
  subagent_type="up-auditor-modernidade",
  prompt="
<objective>
Executar auditoria completa de modernidade do codebase deste projeto.
Salvar resultado em .plano/melhorias/modernidade-sugestoes.md
</objective>

<files_to_read>
- ./CLAUDE.md (se existir -- instrucoes do projeto)
</files_to_read>

<constraints>
- Carregar reference: $HOME/.claude/up/references/audit-modernidade.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Detectar stack e versoes do projeto (step 1 do agente)
- Analisar padroes obsoletos em 6 categorias
- Produzir sugestoes MOD-NNN no formato do template
- Incluir mapa de cobertura obrigatorio (INFRA-03)
- Salvar resultado em .plano/melhorias/modernidade-sugestoes.md
- Retornar resumo no formato: ## AUDITORIA MODERNIDADE COMPLETA
</constraints>
",
  description="Auditoria de modernidade do codebase"
)
```

**IMPORTANTE:** Os 3 Task DEVEM ser spawnados na MESMA mensagem para execucao paralela. NAO spawnar sequencialmente.

---

**Passo 5: Coletar e verificar resultados dos auditores**

Apos os 3 agentes retornarem:

1. Verificar existencia dos 3 arquivos:
   - `.plano/melhorias/ux-sugestoes.md`
   - `.plano/melhorias/performance-sugestoes.md`
   - `.plano/melhorias/modernidade-sugestoes.md`

2. Reportar resultado de cada agente extraindo do retorno:
```
## Resultados dos Auditores

| Dimensao | Sugestoes | Cobertura | Status |
|----------|-----------|-----------|--------|
| UX | N | X/Y (Z%) | Completo |
| Performance | N | X/Y (Z%) | Completo |
| Modernidade | N | X/Y (Z%) | Completo |
```

3. Se algum arquivo faltando: reportar qual agente falhou, mas continuar com os disponiveis (sintetizador aceita 1-3 dimensoes).

---

**Passo 6: Spawn sintetizador**

Spawnar o sintetizador SEQUENCIALMENTE (apos passo 5 confirmar que arquivos existem).

```
Task(
  subagent_type="up-sintetizador-melhorias",
  prompt="
<objective>
Sintetizar sugestoes dos 3 auditores em relatorio consolidado.
Deduplicar cross-dimensao, detectar conflitos, classificar em 4 quadrantes.
Salvar em .plano/melhorias/RELATORIO.md
</objective>

<files_to_read>
- .plano/melhorias/ux-sugestoes.md (sugestoes UX)
- .plano/melhorias/performance-sugestoes.md (sugestoes performance)
- .plano/melhorias/modernidade-sugestoes.md (sugestoes modernidade)
- ./CLAUDE.md (se existir -- contexto do projeto)
</files_to_read>

<constraints>
- Carregar template: $HOME/.claude/up/templates/report.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Deduplicar findings cross-dimensao (3 criterios: mesmo arquivo, linhas sobrepostas, problema similar)
- Detectar conflitos entre dimensoes (acoes mutuamente exclusivas)
- Classificar nos 4 quadrantes da matriz esforco x impacto
- Renumerar IDs para MELH-NNN (com rastreabilidade ao ID original)
- Sumario executivo OPINATIVO (recomendar por onde comecar)
- Salvar em .plano/melhorias/RELATORIO.md
- Retornar resumo no formato: ## SINTESE DE MELHORIAS COMPLETA
</constraints>
",
  description="Sintetizar sugestoes e criar relatorio consolidado"
)
```

Apos sintetizador retornar:
1. Verificar existencia de `.plano/melhorias/RELATORIO.md`
2. Se nao existe: erro -- "Sintetizador falhou ao criar RELATORIO.md"

---

**Passo 7: Apresentar relatorio e concluir**

1. Ler `.plano/melhorias/RELATORIO.md`
2. Extrair: sumario executivo, tabela de visao geral, contagem por quadrante, proximos passos

3. Exibir output final:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > AUDITORIA COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Sumario Executivo do relatorio -- 2-3 paragrafos]

## Visao Geral

[Tabela de Visao Geral do relatorio]

## Distribuicao

| Quadrante | Total |
|-----------|-------|
| Quick Wins | N |
| Projetos Estrategicos | N |
| Preenchimentos | N |
| Evitar | N |

## Proximos Passos

[Secao Proximos Passos do relatorio]

───────────────────────────────────────────────────────────────

Relatorio completo: .plano/melhorias/RELATORIO.md
Sugestoes UX: .plano/melhorias/ux-sugestoes.md
Sugestoes Performance: .plano/melhorias/performance-sugestoes.md
Sugestoes Modernidade: .plano/melhorias/modernidade-sugestoes.md

───────────────────────────────────────────────────────────────
```

**NAO committar automaticamente.** O relatorio e informativo -- o usuario decide o que fazer com ele. Se o projeto tem .plano/ com STATE.md, NAO atualizar STATE.md (melhorias e standalone, nao parte do ciclo de fases).

---

Terminar com `<success_criteria>` no final do arquivo:

```xml
<success_criteria>
- [ ] Init melhorias retornou JSON valido
- [ ] Diretorio .plano/melhorias/ criado (standalone)
- [ ] Stack detectada e reportada ao usuario
- [ ] 3 agentes auditores spawnados em paralelo
- [ ] Pelo menos 1 arquivo de sugestoes gerado
- [ ] Sintetizador gerou RELATORIO.md
- [ ] Relatorio apresentado ao usuario com sumario e quadrantes
</success_criteria>
```

**Convencoes a seguir (CONVENTIONS.md):**
- Workflow em portugues brasileiro para texto de interface
- Tags XML em ingles (`<purpose>`, `<process>`, `<success_criteria>`)
- Passos numerados (nao `<step>` tags) -- seguindo padrao de rapido.md que usa passos simples
- Banner com caracteres box-drawing (━) seguindo ui-brand.md
- Task spawn usa `subagent_type="up-*"` com prompt estruturado em XML
- Guard `@file:` para init JSON
</action>
<verify>
<automated>test -f /home/projects/up-dev-code/up/workflows/melhorias.md && grep -c "up-auditor-ux\|up-auditor-performance\|up-auditor-modernidade\|up-sintetizador-melhorias" /home/projects/up-dev-code/up/workflows/melhorias.md | xargs test 4 -le && echo "PASS" || echo "FAIL"</automated>
</verify>
<done>Workflow up/workflows/melhorias.md existe com: (1) init melhorias via up-tools.cjs, (2) setup standalone que cria .plano/melhorias/ sem exigir .plano/, (3) spawn paralelo de 3 auditores (up-auditor-ux, up-auditor-performance, up-auditor-modernidade), (4) spawn sequencial do sintetizador (up-sintetizador-melhorias), (5) apresentacao do relatorio com sumario executivo e quadrantes. Todos os 4 agentes referenciados. Funciona standalone sem pre-requisitos.</done>
</task>

## Criterios de Sucesso

- [ ] up/workflows/melhorias.md existe e contem orquestracao completa (7 passos)
- [ ] Workflow faz init via `up-tools.cjs init melhorias` (depende de plano 001)
- [ ] Workflow cria .plano/melhorias/ automaticamente (INFRA-04 standalone)
- [ ] 3 auditores spawnados em paralelo (mesma mensagem com 3 Task)
- [ ] Sintetizador spawnado apos auditores (sequencial)
- [ ] Workflow apresenta relatorio final com sumario e quadrantes ao usuario
- [ ] Se auditoria anterior existe, pergunta ao usuario antes de sobrescrever
