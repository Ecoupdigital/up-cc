<purpose>
Workflow `/up:auditar` — Auditoria priorizada de produto num passe unico.

Funde melhorias.md + ideias.md. Spawna `up-auditor` (1x, passe unico de UX + performance + modernidade)
e `up-sintetizador` (consolida, dedup, prioriza). Com `--features`, tambem spawna `up-pesquisador`
modo mercado pra sugerir features novas (analise de gaps + concorrentes/tendencias).

Standalone: nao requer projeto UP inicializado.
</purpose>

<core_principle>
Antes eram 3 auditores (ux/perf/modernidade) + 1 sintetizador-melhorias para `/up:melhorias`, e
analista-codigo + pesquisador-mercado + consolidador-ideias para `/up:ideias`. Agora:
- `up-auditor` faz o passe unico das 3 dimensoes (carrega as refs audit-ux/audit-performance/audit-modernidade
  sob demanda) e, com `--features`, tambem analisa gaps funcionais.
- `up-pesquisador` (modo mercado) so entra com `--features` pra trazer evidencia de mercado.
- `up-sintetizador` consolida tudo: dedup cross-dimensao, matriz esforco x impacto (melhorias),
  ICE scoring + anti-features (features), sumario opinativo.

Relatorio e informativo. NAO commitar automaticamente. NAO mexer em STATE.md (auditoria e standalone).
</core_principle>

<process>

## Passo 1: Inicializar e carregar contexto

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init auditar)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON: `planning_exists`, `has_claude_md`, `has_package_json`, `date`, `timestamp`,
`commit_docs`, `stack_hints`.

**Detectar flag `--features`** no $ARGUMENTS (ativa o modo de ideacao de features).

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > AUDITORIA DE PRODUTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Passo 2: Setup standalone

```bash
mkdir -p .plano/auditar
```

Se `.plano/auditar/RELATORIO.md` ja existe: perguntar via AskUserQuestion se sobrescreve ou cancela.
Se cancelar: sair mantendo o relatorio anterior.

Reportar a stack detectada (de `stack_hints`): framework frontend, meta-framework, CSS, ORM, TypeScript.
Se `has_package_json` = false: avisar que o auditor vai detectar a stack por outros sinais.

## Passo 3: Spawn do auditor (passe unico)

Spawnar `up-auditor` 1x. Ele cobre UX + performance + modernidade num passe (e gaps funcionais se `--features`).

```
Task(
  subagent_type="up-auditor",
  description="Auditoria de produto (passe unico)",
  prompt="
<objective>
Auditar o produto num passe unico nas dimensoes UX, performance e modernidade. Mapa de cobertura
obrigatorio. Salvar resultado por dimensao.
{Se --features: tambem mapear gaps funcionais e oportunidades de features novas no codebase.}
</objective>

<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>

<constraints>
- Carregar sob demanda: $HOME/.claude/up/references/audit-ux.md,
  $HOME/.claude/up/references/audit-performance.md, $HOME/.claude/up/references/audit-modernidade.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Detectar a stack (primeiro passo)
- Produzir sugestoes UX-NNN, PERF-NNN, MOD-NNN no formato do template, com mapa de cobertura
- {Se --features: produzir IDEA-NNN para gaps funcionais com Dimensao=Ideias}
- Salvar em:
  - .plano/auditar/ux-sugestoes.md
  - .plano/auditar/performance-sugestoes.md
  - .plano/auditar/modernidade-sugestoes.md
  {Se --features: .plano/auditar/gaps-sugestoes.md}
- Retornar resumo no formato: ## AUDITORIA COMPLETA (com contagem por dimensao e cobertura)
</constraints>
"
)
```

## Passo 3b: Pesquisa de mercado (SO com --features)

Se `--features` estiver presente, spawnar `up-pesquisador` modo mercado EM PARALELO com nada
(ja que o auditor ja rodou; pode rodar logo apos, ou junto se preferir 1 mensagem com os dois Task).

```
Task(
  subagent_type="up-pesquisador",
  description="Pesquisa de mercado para features",
  prompt="
<modo>mercado</modo>
<objective>
Pesquisar concorrentes e tendencias de mercado pra sugerir features novas para este projeto.
Salvar em .plano/auditar/mercado-sugestoes.md
</objective>

<files_to_read>
- ./CLAUDE.md, ./README.md, ./package.json (se existirem -- dominio e dependencias)
</files_to_read>

<constraints>
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Entender o dominio, pesquisar concorrentes e tendencias via WebSearch
- Cada sugestao IDEA-NNN com evidencia de mercado (concorrente ou tendencia)
- Sinalizar LOW confidence quando baseado so em dados de treinamento
- Limitar a 10-15 sugestoes
- Retornar resumo no formato: ## PESQUISA DE MERCADO COMPLETA
</constraints>
"
)
```

## Passo 4: Verificar resultados

Confirmar que os arquivos de sugestoes foram criados (ux/performance/modernidade sempre;
gaps + mercado so com `--features`). Se algum faltar, reportar qual passo falhou e seguir com os
disponiveis (o sintetizador aceita subconjunto).

```
## Resultados

| Dimensao | Sugestoes | Cobertura | Status |
|----------|-----------|-----------|--------|
| UX | N | X/Y (Z%) | Completo |
| Performance | N | X/Y (Z%) | Completo |
| Modernidade | N | X/Y (Z%) | Completo |
[se --features] | Gaps/Features | N | - | Completo |
```

## Passo 5: Spawn do sintetizador (consolida)

Spawnar `up-sintetizador` SEQUENCIALMENTE (apos confirmar os arquivos).

```
Task(
  subagent_type="up-sintetizador",
  description="Consolidar auditoria",
  prompt="
<modo>auditoria</modo>
<objective>
Consolidar as sugestoes em relatorio unico. Deduplicar cross-dimensao, detectar conflitos,
classificar melhorias na matriz esforco x impacto (4 quadrantes).
{Se --features: aplicar ICE scoring as features e gerar anti-features (ceil(positivas/3)).}
Salvar em .plano/auditar/RELATORIO.md
</objective>

<files_to_read>
- .plano/auditar/ux-sugestoes.md
- .plano/auditar/performance-sugestoes.md
- .plano/auditar/modernidade-sugestoes.md
{Se --features:}
- .plano/auditar/gaps-sugestoes.md
- .plano/auditar/mercado-sugestoes.md
- ./CLAUDE.md (se existir)
</files_to_read>

<constraints>
- Carregar templates: $HOME/.claude/up/templates/report.md e $HOME/.claude/up/templates/suggestion.md
- Dedup cross-dimensao (mesmo arquivo, linhas sobrepostas, problema similar)
- Melhorias: renumerar para MELH-NNN, classificar nos 4 quadrantes
- {Features: ICE scoring por feature, anti-features, ranking por ICE decrescente, IDs IDEA-NNN}
- Sumario executivo OPINATIVO (por onde comecar; top features se --features)
- Salvar em .plano/auditar/RELATORIO.md
- Retornar resumo no formato: ## SINTESE COMPLETA
</constraints>
"
)
```

Confirmar que `.plano/auditar/RELATORIO.md` existe. Se nao, erro: "Sintetizador falhou ao criar RELATORIO.md".

## Passo 6: Apresentar relatorio

Ler `.plano/auditar/RELATORIO.md` e exibir:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > AUDITORIA COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Sumario Executivo -- 2-3 paragrafos opinativos]

## Visao Geral
[Tabela de visao geral do relatorio]

## Distribuicao (melhorias)
| Quadrante | Total |
|-----------|-------|
| Quick Wins | N |
| Projetos Estrategicos | N |
| Preenchimentos | N |
| Evitar | N |

[Se --features:]
## Top Features por ICE Score
| # | Feature | ICE | Categoria |
|---|---------|-----|-----------|
| 1 | IDEA-NNN: [titulo] | NNN | must-have/performance/delighter |

## Anti-Features
[Total] features que NAO devem ser implementadas

## Proximos Passos
[Secao do relatorio]

───────────────────────────────────────────────────────────────
Relatorio: .plano/auditar/RELATORIO.md
───────────────────────────────────────────────────────────────
```

**NAO commitar automaticamente. NAO atualizar STATE.md.**

## Passo 7: Integracao com roadmap (opcional)

Perguntar via AskUserQuestion se quer converter sugestoes/features aprovadas em fases no ROADMAP.md.

Se sim:
1. Extrair os IDs do RELATORIO.md (`### (MELH-\d+):` para melhorias; `### (IDEA-\d+):` para features,
   excluindo a secao "## Anti-Features").
2. Apresentar para selecao multipla (Quick Wins / maior ICE primeiro; nunca incluir quadrante "Evitar"
   nem anti-features).
3. Se nao houver `.plano/ROADMAP.md`, perguntar se cria um minimo.
4. Gerar fases:

```bash
echo '{"source":"auditar","report_path":".plano/auditar/RELATORIO.md","approved_ids":["MELH-001","IDEA-003"],"grouping":"auto"}' | node "$HOME/.claude/up/bin/up-tools.cjs" phase generate-from-report
```

Substituir `approved_ids` pela selecao real. Apresentar resumo das fases criadas e os proximos passos
(`/up:plan {N}` para planejar, `/up:build` para executar).

</process>

<success_criteria>
- [ ] Init auditar retornou JSON valido; flag --features detectada
- [ ] Diretorio .plano/auditar/ criado (standalone)
- [ ] up-auditor rodou o passe unico (UX + performance + modernidade; + gaps se --features)
- [ ] Com --features: up-pesquisador modo mercado rodou
- [ ] Pelo menos 1 arquivo de sugestoes gerado
- [ ] up-sintetizador gerou RELATORIO.md (matriz; + ICE/anti-features se --features)
- [ ] Relatorio apresentado; NAO commitado; STATE.md intocado
- [ ] Integracao com roadmap oferecida (opcional)
</success_criteria>
</output>
