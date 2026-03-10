---
phase: 09-comando-ideias
plan: 09-002
type: feature
autonomous: true
wave: 1
depends_on: [09-001]
requirements: [IDEIA-01, IDEIA-06, INFRA-04]
must_haves:
  truths:
    - "Workflow ideias.md orquestra: init -> standalone setup -> stack detection -> spawn 2 agentes em paralelo (analista-codigo + pesquisador-mercado) -> spawn consolidador -> apresentar relatorio"
    - "Em projeto sem .plano/, o workflow cria .plano/ideias/ automaticamente sem erro"
    - "Dois agentes (up-analista-codigo e up-pesquisador-mercado) sao spawnados em paralelo via Task"
    - "Apos agentes, up-consolidador-ideias e spawnado sequencialmente para consolidar relatorio com ICE scoring"
    - "Usuario ve relatorio final com sugestoes rankeadas por ICE score e secao de anti-features"
    - "Relatorio consolidado salvo em .plano/ideias/RELATORIO.md (IDEIA-06)"
  artifacts:
    - path: "up/workflows/ideias.md"
      provides: "Workflow completo de orquestracao do comando /up:ideias"
  key_links:
    - from: "up/commands/ideias.md"
      to: "up/workflows/ideias.md"
      via: "@~/.claude/up/workflows/ideias.md no execution_context do command"
    - from: "up/workflows/ideias.md"
      to: "up/bin/up-tools.cjs"
      via: "node $HOME/.claude/up/bin/up-tools.cjs init ideias"
    - from: "up/workflows/ideias.md"
      to: "up/agents/up-analista-codigo.md"
      via: "Task(subagent_type=up-analista-codigo)"
    - from: "up/workflows/ideias.md"
      to: "up/agents/up-pesquisador-mercado.md"
      via: "Task(subagent_type=up-pesquisador-mercado)"
    - from: "up/workflows/ideias.md"
      to: "up/agents/up-consolidador-ideias.md"
      via: "Task(subagent_type=up-consolidador-ideias)"
---

# Fase 9 Plano 2: Workflow de orquestracao do /up:ideias

**Objetivo:** Criar o workflow que orquestra o pipeline completo de ideacao: inicializar standalone, detectar stack, spawnar 2 agentes de ideias em paralelo, coletar resultados, spawnar consolidador com ICE scoring, apresentar relatorio ao usuario. Este e o cerebro do comando /up:ideias, espelhando o padrao da Fase 7 (melhorias.md) mas adaptado para 2 agentes + consolidador com ICE.

## Pesquisa Inline -- Achados

**Padrao workflow melhorias.md (referencia direta, ja lido):**
- Estrutura: `<purpose>`, `<process>` com passos numerados, `<success_criteria>`
- Init via bash: `INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init melhorias)` com guard `@file:`
- Spawn paralelo: 3 Task na mesma mensagem para auditores
- Spawn sequencial: 1 Task separado para sintetizador apos auditores retornarem
- 7 passos: init -> standalone setup -> stack detection -> spawn auditores -> coletar -> spawn sintetizador -> apresentar
- Para ideias: mesma estrutura mas 2 agentes (nao 3) e consolidador (nao sintetizador)

**Agentes de ideias (ja criados na Fase 8):**
- up-analista-codigo: analisa codebase, identifica gaps funcionais, produz `.plano/ideias/codigo-sugestoes.md` com IDEA-NNN
- up-pesquisador-mercado: pesquisa concorrentes via WebSearch, produz `.plano/ideias/mercado-sugestoes.md` com IDEA-NNN
- up-consolidador-ideias: le 2 arquivos, deduplica cross-fonte, aplica ICE scoring, gera anti-features, produz `.plano/ideias/RELATORIO.md`

**Diferencas chave entre melhorias e ideias:**
- Melhorias: 3 auditores -> 1 sintetizador, quadrantes esforco x impacto
- Ideias: 2 agentes -> 1 consolidador, ranking ICE (Impact x Confidence x Ease), anti-features obrigatorias
- Melhorias: `.plano/melhorias/`, Ideias: `.plano/ideias/`
- Melhorias: RELATORIO com 4 quadrantes, Ideias: RELATORIO com ranking ICE + secao anti-features

**Retornos esperados dos agentes:**
- Analista: `## ANALISE DE CODIGO COMPLETA` com Stack, Features mapeadas, Sugestoes, Cobertura
- Pesquisador: `## PESQUISA DE MERCADO COMPLETA` com Dominio, Concorrentes, Tendencias, Sugestoes, Confianca
- Consolidador: `## CONSOLIDACAO DE IDEIAS COMPLETA` com Sugestoes recebidas/apos dedup, Anti-features, Top 3 ICE

## Contexto

@up/workflows/melhorias.md -- referencia direta de padrao de workflow standalone com spawn paralelo
@up/agents/up-analista-codigo.md -- agente de analise de codigo, output format e expectations
@up/agents/up-pesquisador-mercado.md -- agente de pesquisa de mercado, output format e expectations
@up/agents/up-consolidador-ideias.md -- consolidador com ICE scoring, input esperado (2 arquivos)
@up/templates/report.md -- formato do relatorio consolidado (base adaptada pelo consolidador)
@up/templates/suggestion.md -- formato de sugestao individual

## Tarefas

<task id="1" type="auto">
<files>up/workflows/ideias.md</files>
<action>
Criar workflow completo de orquestracao para /up:ideias. O workflow segue 7 passos sequenciais com spawn paralelo dos 2 agentes no passo 4 e spawn sequencial do consolidador no passo 6.

**Estrutura do arquivo:**

Iniciar com `<purpose>`:
```
Executar ideacao de features com 2 agentes paralelos (analise de codigo + pesquisa de mercado) e consolidar resultados em relatorio com ICE scoring e anti-features. Funciona standalone -- nao requer /up:novo-projeto.
```

Seguido de `<process>` contendo os 7 passos abaixo.

---

**Passo 1: Inicializar e carregar contexto**

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init ideias)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `planning_exists`, `ideias_dir`, `ideias_exists`, `has_claude_md`, `has_package_json`, `date`, `timestamp`, `commit_docs`, `stack_hints`.

Exibir banner:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > IDEACAO DE FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Passo 2: Setup standalone (INFRA-04)**

Se `ideias_exists` = true: perguntar ao usuario se quer sobrescrever a ideacao anterior ou cancelar. Usar AskUserQuestion:
```
AskUserQuestion(
  header: "Ideacao Anterior Encontrada",
  question: "Ja existe uma ideacao em .plano/ideias/. Deseja sobrescrever?",
  followUp: null
)
```
Se usuario diz nao/cancelar, sair com mensagem: "Ideacao cancelada. Relatorio anterior permanece em .plano/ideias/RELATORIO.md"

Se `ideias_exists` = false:
```bash
mkdir -p .plano/ideias
```

Se `planning_exists` = false (nao tem .plano/ de nenhum tipo):
```bash
mkdir -p .plano/ideias
```
(O mkdir -p cria ambos diretorios).

Reportar:
```
Diretorio de ideacao: .plano/ideias/
Modo: Standalone (sem pre-requisitos)
```

---

**Passo 3: Reportar deteccao de stack**

Usar `stack_hints` do init JSON para reportar ao usuario o que foi detectado:

```
## Stack Detectada

[Listar: framework frontend, meta-framework, CSS, ORM, TypeScript -- baseado nos booleans de stack_hints]

Agentes farao deteccao granular durante a analise.
```

Se `has_package_json` = false:
```
Nenhum package.json encontrado. Agentes tentarao detectar stack por outros sinais.
```

---

**Passo 4: Spawn 2 agentes de ideias em PARALELO**

Spawnar os 2 agentes na MESMA mensagem (paralelo via Task). Cada agente recebe contexto minimo -- eles leem seus proprios templates e fazem sua propria deteccao de stack internamente.

**Agente 1: Analista de Codigo**
```
Task(
  subagent_type="up-analista-codigo",
  prompt="
<objective>
Analisar o codebase deste projeto para identificar gaps funcionais e oportunidades de features novas.
Salvar resultado em .plano/ideias/codigo-sugestoes.md
</objective>

<files_to_read>
- ./CLAUDE.md (se existir -- instrucoes do projeto)
</files_to_read>

<constraints>
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Detectar stack do projeto (step 1 do agente)
- Mapear features existentes (step 2)
- Analisar gaps nas 4 categorias: funcionalidade incompleta, feature adjacente, integracao ausente, DX
- Produzir sugestoes IDEA-NNN no formato do template com Dimensao=Ideias
- Incluir mapa de cobertura obrigatorio (INFRA-03)
- Limitar a 10-15 sugestoes (qualidade sobre quantidade)
- Salvar resultado em .plano/ideias/codigo-sugestoes.md
- Retornar resumo no formato: ## ANALISE DE CODIGO COMPLETA
</constraints>
",
  description="Analise de codigo para identificar gaps e oportunidades de features"
)
```

**Agente 2: Pesquisador de Mercado**
```
Task(
  subagent_type="up-pesquisador-mercado",
  prompt="
<objective>
Pesquisar concorrentes e tendencias de mercado para sugerir features novas para este projeto.
Salvar resultado em .plano/ideias/mercado-sugestoes.md
</objective>

<files_to_read>
- ./CLAUDE.md (se existir -- instrucoes do projeto)
- ./README.md (se existir -- descricao do projeto)
- ./package.json (se existir -- dominio e dependencias)
</files_to_read>

<constraints>
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Entender dominio do projeto (step 1)
- Pesquisar concorrentes via WebSearch (step 2)
- Analisar tendencias de mercado via WebSearch (step 3)
- Produzir sugestoes IDEA-NNN no formato do template com Dimensao=Ideias
- Cada sugestao DEVE ter evidencia de mercado (concorrente ou tendencia)
- Sinalizar LOW confidence quando baseado em dados de treinamento
- Limitar a 10-15 sugestoes (qualidade sobre quantidade)
- Salvar resultado em .plano/ideias/mercado-sugestoes.md
- Retornar resumo no formato: ## PESQUISA DE MERCADO COMPLETA
</constraints>
",
  description="Pesquisa de mercado e concorrentes para sugestoes de features"
)
```

**IMPORTANTE:** Os 2 Task DEVEM ser spawnados na MESMA mensagem para execucao paralela. NAO spawnar sequencialmente.

---

**Passo 5: Coletar e verificar resultados dos agentes**

Apos os 2 agentes retornarem:

1. Verificar existencia dos 2 arquivos:
   - `.plano/ideias/codigo-sugestoes.md`
   - `.plano/ideias/mercado-sugestoes.md`

2. Reportar resultado de cada agente extraindo do retorno:
```
## Resultados dos Agentes

| Agente | Sugestoes | Cobertura/Confianca | Status |
|--------|-----------|---------------------|--------|
| Analista de Codigo | N | X/Y (Z%) | Completo |
| Pesquisador de Mercado | N | HIGH/MIXED/LOW | Completo |
```

3. Se algum arquivo faltando: reportar qual agente falhou, mas continuar com o disponivel (consolidador aceita 1-2 fontes, minimo 1 obrigatoria).

---

**Passo 6: Spawn consolidador**

Spawnar o consolidador SEQUENCIALMENTE (apos passo 5 confirmar que arquivos existem).

```
Task(
  subagent_type="up-consolidador-ideias",
  prompt="
<objective>
Consolidar sugestoes dos 2 agentes idealizadores em relatorio final.
Deduplicar cross-fonte, aplicar ICE scoring, gerar anti-features.
Salvar em .plano/ideias/RELATORIO.md
</objective>

<files_to_read>
- .plano/ideias/codigo-sugestoes.md (sugestoes do analista de codigo)
- .plano/ideias/mercado-sugestoes.md (sugestoes do pesquisador de mercado)
- ./CLAUDE.md (se existir -- contexto do projeto)
</files_to_read>

<constraints>
- Carregar template: $HOME/.claude/up/templates/report.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Deduplicar findings cross-fonte (2 criterios: mesma feature proposta, sobreposicao de escopo)
- Aplicar ICE scoring a cada sugestao (Impact x Confidence x Ease, 1-10 cada)
- Gerar anti-features na proporcao ceil(positivas/3)
- Ranking por ICE score decrescente (maior primeiro)
- Sumario executivo OPINATIVO (recomendar top 3 features e por onde comecar)
- IDs mantidos como IDEA-NNN (namespace de ideias)
- Salvar em .plano/ideias/RELATORIO.md
- Retornar resumo no formato: ## CONSOLIDACAO DE IDEIAS COMPLETA
</constraints>
",
  description="Consolidar sugestoes e criar relatorio final com ICE scoring"
)
```

Apos consolidador retornar:
1. Verificar existencia de `.plano/ideias/RELATORIO.md`
2. Se nao existe: erro -- "Consolidador falhou ao criar RELATORIO.md"

---

**Passo 7: Apresentar relatorio e concluir**

1. Ler `.plano/ideias/RELATORIO.md`
2. Extrair: sumario executivo, tabela de visao geral, top 3 ICE, contagem de anti-features, proximos passos

3. Exibir output final:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > IDEACAO COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Sumario Executivo do relatorio -- 2-3 paragrafos opinativos]

## Visao Geral

[Tabela de Visao Geral do relatorio com contagens por faixa ICE]

## Top Features por ICE Score

| # | Feature | ICE Score | Categoria |
|---|---------|-----------|-----------|
| 1 | IDEA-NNN: [titulo] | NNN | must-have/performance/delighter |
| 2 | IDEA-NNN: [titulo] | NNN | must-have/performance/delighter |
| 3 | IDEA-NNN: [titulo] | NNN | must-have/performance/delighter |

## Anti-Features

[Total] features que NAO devem ser implementadas (ver relatorio completo)

## Proximos Passos

[Secao Proximos Passos do relatorio]

───────────────────────────────────────────────────────────────

Relatorio completo: .plano/ideias/RELATORIO.md
Sugestoes (codigo): .plano/ideias/codigo-sugestoes.md
Sugestoes (mercado): .plano/ideias/mercado-sugestoes.md

───────────────────────────────────────────────────────────────
```

**NAO committar automaticamente.** O relatorio e informativo -- o usuario decide o que fazer com ele. Se o projeto tem .plano/ com STATE.md, NAO atualizar STATE.md (ideias e standalone, nao parte do ciclo de fases).

---

Terminar com `<success_criteria>` no final do arquivo:

```xml
<success_criteria>
- [ ] Init ideias retornou JSON valido
- [ ] Diretorio .plano/ideias/ criado (standalone)
- [ ] Stack detectada e reportada ao usuario
- [ ] 2 agentes idealizadores spawnados em paralelo
- [ ] Pelo menos 1 arquivo de sugestoes gerado
- [ ] Consolidador gerou RELATORIO.md com ICE scoring e anti-features
- [ ] Relatorio apresentado ao usuario com sumario, top features e anti-features
</success_criteria>
```

**Convencoes a seguir (CONVENTIONS.md):**
- Workflow em portugues brasileiro para texto de interface
- Tags XML em ingles (`<purpose>`, `<process>`, `<success_criteria>`)
- Passos numerados (nao `<step>` tags) -- seguindo padrao de melhorias.md/rapido.md que usa passos simples
- Banner com caracteres box-drawing (━) seguindo ui-brand.md
- Task spawn usa `subagent_type="up-*"` com prompt estruturado em XML
- Guard `@file:` para init JSON
- Exibicao final mostra top 3 por ICE (diferente de melhorias que mostra quadrantes)
</action>
<verify>
<automated>test -f /home/projects/up-dev-code/up/workflows/ideias.md && grep -c "up-analista-codigo\|up-pesquisador-mercado\|up-consolidador-ideias" /home/projects/up-dev-code/up/workflows/ideias.md | xargs test 3 -le && echo "PASS" || echo "FAIL"</automated>
</verify>
<done>Workflow up/workflows/ideias.md existe com: (1) init ideias via up-tools.cjs, (2) setup standalone que cria .plano/ideias/ sem exigir .plano/, (3) spawn paralelo de 2 agentes (up-analista-codigo, up-pesquisador-mercado), (4) spawn sequencial do consolidador (up-consolidador-ideias), (5) apresentacao do relatorio com sumario executivo, top ICE e anti-features. Todos os 3 agentes referenciados. Funciona standalone sem pre-requisitos. Relatorio salvo em .plano/ideias/RELATORIO.md (IDEIA-06).</done>
</task>

## Criterios de Sucesso

- [ ] up/workflows/ideias.md existe e contem orquestracao completa (7 passos)
- [ ] Workflow faz init via `up-tools.cjs init ideias` (depende de plano 001)
- [ ] Workflow cria .plano/ideias/ automaticamente (INFRA-04 standalone)
- [ ] 2 agentes idealizadores spawnados em paralelo (mesma mensagem com 2 Task)
- [ ] Consolidador spawnado apos agentes (sequencial)
- [ ] Workflow apresenta relatorio final com sumario, top ICE e anti-features ao usuario
- [ ] Se ideacao anterior existe, pergunta ao usuario antes de sobrescrever
- [ ] Relatorio final salvo em .plano/ideias/RELATORIO.md (IDEIA-06)
