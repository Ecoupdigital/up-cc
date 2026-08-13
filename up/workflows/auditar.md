<purpose>
Workflow `/up:auditar` — Auditoria priorizada de produto num passe unico.

Funde melhorias.md + ideias.md. Spawna `up-auditor` (1x, passe unico de UX + performance +
modernidade + consolidacao do RELATORIO.md). Com `--features`, o mesmo auditor pesquisa mercado
inline. Sem `up-sintetizador`. Sem `up-pesquisador`.

Standalone: nao requer projeto UP inicializado.
</purpose>

> Vocabulário UP: fase, plano, onda, gate, evidência, worktree, escape hatch, verificação e laço DCRV têm definição única em `$HOME/.claude/up/references/glossario-up.md`. Use o termo, não redefina.

<core_principle>
Antes eram 3 auditores (ux/perf/modernidade) + 1 sintetizador-melhorias para `/up:melhorias`, e
analista-codigo + pesquisador-mercado + consolidador-ideias para `/up:ideias`. Agora:
- `up-auditor` faz o passe unico das 3 dimensoes e escreve o RELATORIO.md consolidado.
- Com `--features`, o mesmo auditor pesquisa mercado (WebSearch) e inclui ICE + anti-features.
- Nao spawnar `up-pesquisador` nem `up-sintetizador`.

Relatorio e informativo. NAO commitar automaticamente. NAO mexer em STATE.md (auditoria e standalone).

**Contrato de pergunta (obrigatório):** carregue `Read $HOME/.claude/up/references/questioning.md` e aplique o
bloco `<contrato_de_pergunta>`. **O que este workflow resolve sozinho e nunca pergunta:** stack detectada,
existência e data do relatório anterior, quantos commits houve desde ele, quais achados estão em cada
quadrante e qual é o sumário opinativo. Tudo isso é lido ou calculado, nunca perguntado.
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

Se `.plano/auditar/RELATORIO.md` já existe, calcule primeiro há quantos commits ele ficou para trás:

```bash
COMMITS_DESDE=$(git rev-list --count --since="$(git log -1 --format=%cI -- .plano/auditar/RELATORIO.md)" HEAD 2>/dev/null || echo 0)
```

E então pergunte:

<pergunta id="auditar.relatorio-existente">
Pergunta: Já existe relatório de auditoria de {data do relatório}. Sobrescrevo?
Recomendo: {Sobrescrever quando COMMITS_DESDE for maior que zero; Manter o anterior e cancelar quando for zero}
Porque: {"o repositório teve {COMMITS_DESDE} commits desde aquela auditoria, então o relatório antigo já não descreve o código atual" ou "nenhum commit entrou desde aquela auditoria, então rodar de novo gasta e devolve o mesmo"}
Opções: {recomendada} | {a outra}
</pergunta>

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
- {Se --features: produzir IDEA-NNN para gaps funcionais com Dimensao=Ideias; pesquisar mercado via WebSearch}
- Salvar em:
  - .plano/auditar/ux-sugestoes.md
  - .plano/auditar/performance-sugestoes.md
  - .plano/auditar/modernidade-sugestoes.md
  {Se --features: .plano/auditar/gaps-sugestoes.md}
- Escrever tambem .plano/auditar/RELATORIO.md (dedup, matriz esforco x impacto; + ICE/anti-features se --features)
- Retornar resumo no formato: ## AUDITORIA COMPLETA (com contagem por dimensao e cobertura)
</constraints>
"
)
```

## Passo 3b: Pesquisa de mercado (SO com --features)

Nao spawnar `up-pesquisador`. O prompt do auditor no passo 3 ja pede WebSearch e a secao de
features no RELATORIO.md. Este passo so confirma que a secao existe; se faltar, o orquestrador
faz um passe curto de WebSearch e emenda o relatorio, sem agente extra.

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

## Passo 5: Relatorio consolidado (o auditor ja escreveu)

Nao spawnar `up-sintetizador`. O `up-auditor` escreve `.plano/auditar/RELATORIO.md` no mesmo
passe (dedup, matriz esforco x impacto, e ICE/anti-features se `--features`).

Se o RELATORIO.md nao existir, o orquestrador consolida as sugestoes inline e escreve o arquivo
(dedup, matriz esforco x impacto, ICE se `--features`). Sem agente extra.

Contrato do RELATORIO.md: template `report.md` + `suggestion.md`; IDs MELH-NNN; com `--features`,
IDs IDEA-NNN + anti-features. Confirmar que o arquivo existe antes do passo 6.

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

<pergunta id="auditar.converter-em-fases">
Pergunta: Converto os achados aprovados em fases do roadmap?
Recomendo: {Converter os N do quadrante de ganho rápido}
Porque: {o sumário opinativo do relatório aponta esses como maior impacto por menor esforço}.
Opções: Converter os {N} do ganho rápido | Escolher item a item | Não converter agora
</pergunta>

A seleção item a item, quando escolhida, continua como está. O quadrante "evitar" e as anti-features nunca
entram na recomendação.

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
- [ ] up-auditor rodou o passe unico (UX + performance + modernidade; + gaps/mercado se --features)
- [ ] Sem spawn de up-pesquisador e sem spawn de up-sintetizador
- [ ] Pelo menos 1 arquivo de sugestoes gerado
- [ ] RELATORIO.md gerado pelo auditor (ou fallback do orquestrador)
- [ ] Relatorio apresentado; NAO commitado; STATE.md intocado
- [ ] Integracao com roadmap oferecida (opcional)
</success_criteria>
</output>
