<purpose>
Executar auditoria completa do codebase com 3 agentes paralelos (UX, performance, modernidade) e sintetizar resultados em relatorio consolidado. Funciona standalone -- nao requer /up:novo-projeto.
</purpose>

<process>

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

Se `melhorias_exists` = true: perguntar ao usuario se quer sobrescrever a auditoria anterior ou cancelar.

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

**Passo 8: Aprovacao interativa e integracao com roadmap (opcional)**

Este passo permite converter sugestoes aprovadas em fases executaveis no ROADMAP.md.

1. Perguntar ao usuario se quer integrar sugestoes ao roadmap:

```
AskUserQuestion(
  header: "Integrar ao Roadmap",
  question: "Deseja converter sugestoes aprovadas em fases no ROADMAP.md?",
  multiSelect: false,
  options: [
    { label: "Sim, selecionar sugestoes", description: "Escolher quais sugestoes viram fases executaveis" },
    { label: "Nao, apenas o relatorio", description: "Manter apenas o relatorio como referencia" }
  ]
)
```

Se usuario escolher "Nao": sair com mensagem "Relatorio salvo em .plano/melhorias/RELATORIO.md. Use /up:melhorias novamente para integrar ao roadmap quando quiser."

2. Se sim, ler `.plano/melhorias/RELATORIO.md` e extrair todas as sugestoes (ID + titulo + quadrante).

Para extrair sugestoes do RELATORIO.md: usar regex `### (MELH-\d+): (.+)` para capturar ID e titulo. Parsear a tabela de campos logo abaixo para Esforco/Impacto/Dimensao. Determinar quadrante pelo cabecalho da secao onde a sugestao aparece (Quick Wins, Projetos Estrategicos, Preenchimentos, Evitar).

3. Apresentar sugestoes agrupadas por quadrante para selecao:

```
AskUserQuestion(
  header: "Selecionar Sugestoes",
  question: "Quais sugestoes devem virar fases no roadmap? (Quick Wins recomendados primeiro)",
  multiSelect: true,
  options: [
    // Quick Wins primeiro (recomendados)
    { label: "MELH-001: [titulo]", description: "Quick Win | Esforco P, Impacto G | [dimensao]" },
    { label: "MELH-003: [titulo]", description: "Quick Win | Esforco P, Impacto M | [dimensao]" },
    // Depois Projetos Estrategicos
    { label: "MELH-005: [titulo]", description: "Estrategico | Esforco M, Impacto G | [dimensao]" },
    // Depois Preenchimentos
    { label: "MELH-008: [titulo]", description: "Preenchimento | Esforco P, Impacto P | [dimensao]" },
    // Nunca incluir quadrante "Evitar" na lista
  ]
)
```

**IMPORTANTE:** NAO incluir sugestoes do quadrante "Evitar" na lista de opcoes. Se o usuario perguntar, explicar que sugestoes com alto esforco e baixo impacto nao sao recomendadas para o roadmap.

Labels no multiSelect devem ser curtos: "MELH-001: Titulo curto" (max ~60 chars). Description complementa: "Quick Win | Esforco P, Impacto G | Performance".

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
echo '{"source":"melhorias","report_path":".plano/melhorias/RELATORIO.md","approved_ids":["MELH-001","MELH-003","MELH-005"],"grouping":"auto"}' | node "$HOME/.claude/up/bin/up-tools.cjs" phase generate-from-report
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
- [ ] Init melhorias retornou JSON valido
- [ ] Diretorio .plano/melhorias/ criado (standalone)
- [ ] Stack detectada e reportada ao usuario
- [ ] 3 agentes auditores spawnados em paralelo
- [ ] Pelo menos 1 arquivo de sugestoes gerado
- [ ] Sintetizador gerou RELATORIO.md
- [ ] Relatorio apresentado ao usuario com sumario e quadrantes
</success_criteria>
