<purpose>
Executar ideacao de features com 2 agentes paralelos (analise de codigo + pesquisa de mercado) e consolidar resultados em relatorio com ICE scoring e anti-features. Funciona standalone -- nao requer /up:novo-projeto.
</purpose>

<process>

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

Se `ideias_exists` = true: perguntar ao usuario se quer sobrescrever a ideacao anterior ou cancelar.

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

**Passo 8: Aprovacao interativa e integracao com roadmap (opcional)**

Este passo permite converter ideias aprovadas em fases executaveis no ROADMAP.md.

1. Perguntar ao usuario se quer integrar ideias ao roadmap:

```
AskUserQuestion(
  header: "Integrar ao Roadmap",
  question: "Deseja converter ideias aprovadas em fases no ROADMAP.md?",
  multiSelect: false,
  options: [
    { label: "Sim, selecionar ideias", description: "Escolher quais ideias viram fases executaveis" },
    { label: "Nao, apenas o relatorio", description: "Manter apenas o relatorio como referencia" }
  ]
)
```

Se usuario escolher "Nao": sair com mensagem "Relatorio salvo em .plano/ideias/RELATORIO.md. Use /up:ideias novamente para integrar ao roadmap quando quiser."

2. Se sim, ler `.plano/ideias/RELATORIO.md` e extrair todas as ideias (ID + titulo + ICE score + categoria).

Para extrair ideias do RELATORIO.md: usar regex `### (IDEA-\d+): (.+)` para capturar ID e titulo. Extrair ICE score da tabela de campos ou da secao de ranking. Extrair categoria (must-have, performance, delighter) da mesma tabela. Detectar Anti-Features pela secao "## Anti-Features" no RELATORIO e excluir da lista.

3. Apresentar ideias ordenadas por ICE score decrescente para selecao:

```
AskUserQuestion(
  header: "Selecionar Ideias",
  question: "Quais ideias devem virar fases no roadmap? (Maior ICE score = maior retorno)",
  multiSelect: true,
  options: [
    // Ordenadas por ICE decrescente
    { label: "IDEA-001: [titulo]", description: "ICE: 648 | must-have | I:9 C:9 E:8" },
    { label: "IDEA-003: [titulo]", description: "ICE: 480 | performance | I:8 C:8 E:7.5" },
    { label: "IDEA-007: [titulo]", description: "ICE: 280 | delighter | I:7 C:5 E:8" },
  ]
)
```

**IMPORTANTE:** NAO incluir ideias da secao "Anti-Features" na lista de opcoes. Se o usuario perguntar, explicar que anti-features sao features que NAO devem ser implementadas.

Labels no multiSelect devem ser curtos: "IDEA-001: Titulo curto" (max ~60 chars). Description complementa: "ICE: 648 | must-have | I:9 C:9 E:8".

4. Verificar se existe `.plano/ROADMAP.md`:
   - Se existe: usar diretamente
   - Se NAO existe: perguntar ao usuario:
     ```
     AskUserQuestion(
       header: "Criar Roadmap",
       question: "Nao existe ROADMAP.md. Deseja criar um para adicionar as fases?",
       multiSelect: false,
       options: [
         { label: "Sim, criar roadmap", description: "Cria .plano/ROADMAP.md com as fases selecionadas" },
         { label: "Nao, cancelar", description: "Manter apenas o relatorio" }
       ]
     )
     ```
     Se sim, criar ROADMAP.md minimo:
     ```bash
     mkdir -p .plano
     ```
     Escrever `.plano/ROADMAP.md` com:
     ```markdown
     # Roadmap: [nome do projeto de package.json ou diretorio]

     ## Fases

     ## Detalhes das Fases

     ## Tabela de Progresso

     | Fase | Planos Completos | Status | Completado |
     |------|-----------------|--------|------------|
     ```

5. Chamar CLI para gerar fases:

```bash
echo '{"source":"ideias","report_path":".plano/ideias/RELATORIO.md","approved_ids":["IDEA-001","IDEA-003","IDEA-007"],"grouping":"auto"}' | node "$HOME/.claude/up/bin/up-tools.cjs" phase generate-from-report
```

Substituir approved_ids pela lista real selecionada pelo usuario.

6. Parsear resultado JSON e apresentar resumo:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > FASES GERADAS NO ROADMAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Para cada fase criada:]
Fase [N]: [Nome]
  Sugestoes: [IDs listados]
  Diretorio: [caminho]

Total: [N] fases criadas com [M] sugestoes

───────────────────────────────────────────────────────────────

## Proximos Passos

Para cada fase gerada:
1. `/up:discutir-fase [N]` -- Refinar escopo e decisoes
2. `/up:planejar-fase [N]` -- Criar planos de execucao
3. `/up:executar-fase [N]` -- Implementar

<sub>/clear primeiro -- janela de contexto limpa</sub>

───────────────────────────────────────────────────────────────
```

</process>

<success_criteria>
- [ ] Init ideias retornou JSON valido
- [ ] Diretorio .plano/ideias/ criado (standalone)
- [ ] Stack detectada e reportada ao usuario
- [ ] 2 agentes idealizadores spawnados em paralelo
- [ ] Pelo menos 1 arquivo de sugestoes gerado
- [ ] Consolidador gerou RELATORIO.md com ICE scoring e anti-features
- [ ] Relatorio apresentado ao usuario com sumario, top features e anti-features
</success_criteria>
