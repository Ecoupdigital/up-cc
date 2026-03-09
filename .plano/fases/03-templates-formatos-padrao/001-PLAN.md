---
phase: 03-templates-formatos-padrao
plan: 03-001
type: feature
autonomous: true
wave: 0
depends_on: []
requirements: [INFRA-01, INFRA-02]
must_haves:
  truths:
    - "Template de sugestao define formato obrigatorio com 6 campos: arquivo, linha, problema, sugestao, esforco (P/M/G), impacto (P/M/G)"
    - "Template de relatorio consolida sugestoes em matriz 2x2 de esforco x impacto com 4 quadrantes nomeados"
    - "Templates sao arquivos markdown em up/templates/ seguindo convencoes existentes (XML tags, code blocks, guidelines)"
    - "Agentes futuros (auditores, sintetizador) podem carregar e preencher os templates via @reference"
  artifacts:
    - path: "up/templates/suggestion.md"
      provides: "Formato padrao de sugestao individual para agentes auditores e idealizadores"
    - path: "up/templates/report.md"
      provides: "Formato padrao de relatorio consolidado com matriz esforco x impacto"
  key_links:
    - from: "suggestion.md"
      to: "report.md"
      via: "Sugestoes individuais alimentam secoes do relatorio consolidado"
    - from: "suggestion.md"
      to: "up/agents/up-*.md (futuros auditores Fase 5)"
      via: "Agentes carregam template via @~/.claude/up/templates/suggestion.md"
    - from: "report.md"
      to: "up/agents/up-sintetizador.md (adaptado Fase 6)"
      via: "Sintetizador carrega template via @~/.claude/up/templates/report.md"
---

# Fase 3 Plano 001: Templates de sugestao e relatorio

**Objetivo:** Criar os dois templates markdown que definem o formato padrao compartilhado entre todos os agentes de auditoria e ideacao -- um para sugestoes individuais (INFRA-01) e outro para o relatorio consolidado com matriz de priorizacao (INFRA-02). Estes templates sao a infraestrutura que garante output uniforme e agregavel entre agentes.

## Pesquisa Inline

**Convencoes de templates existentes (descobertas pela analise de `up/templates/`):**
- Templates usam XML tags semanticas: `<template>`, `<guidelines>`, `<evolution>`, `<purpose>`, etc.
- O template em si fica dentro de code blocks (```markdown ... ```)
- Secoes de orientacao ficam fora dos code blocks em tags XML
- Templates sao carregados por agentes via `@~/.claude/up/templates/*.md`
- Nomes de arquivo: kebab-case, sem prefixo `up-` (ex: `summary.md`, `state.md`, `project.md`)
- Texto de interface em portugues brasileiro
- Campos de frontmatter YAML quando aplicavel

**Formato de sugestao (derivado de INFRA-01):**
- 6 campos obrigatorios: arquivo, linha, problema, sugestao concreta, esforco (P/M/G), impacto (P/M/G)
- P/M/G e mais simples que escalas numericas e suficiente para matriz 2x2
- Campos adicionais uteis: dimensao (UX/performance/modernidade), severidade, referencia

**Matriz esforco x impacto (derivado de INFRA-02):**
- 4 quadrantes classicos: quick wins (baixo esforco + alto impacto), projetos estrategicos (alto esforco + alto impacto), preenchimentos (baixo esforco + baixo impacto), evitar (alto esforco + baixo impacto)
- A classificacao P/M/G mapeia para a matriz: P = quadrante baixo, M/G = quadrante alto
- Relatorio deve ter sumario executivo, totais por dimensao, e lista por quadrante

## Contexto

@up/templates/summary.md -- Exemplo de template existente (padrao de XML tags, code blocks, guidelines)
@up/templates/state.md -- Exemplo de template existente (padrao de purpose, sections, size_constraint)
@up/templates/project.md -- Exemplo de template existente (padrao de template, guidelines, evolution)
@.plano/REQUIREMENTS.md -- Requisitos INFRA-01 e INFRA-02
@.plano/ROADMAP.md -- Fase 3 objetivo e criterios de sucesso
@.plano/codebase/CONVENTIONS.md -- Convencoes de nomeacao e XML tags

## Tarefas

<task id="1" type="auto">
<files>up/templates/suggestion.md</files>
<action>
Criar o template de sugestao individual em `up/templates/suggestion.md`.

O template DEVE seguir as convencoes existentes dos outros templates em `up/templates/`:
- Titulo H1 descritivo
- Bloco `<template>` com o markdown template dentro de code fences (```markdown ... ```)
- Bloco `<guidelines>` com orientacoes de preenchimento
- Bloco `<field_definitions>` com definicao precisa de cada campo

**Estrutura do template de sugestao:**

O template deve definir o formato de UMA sugestao individual. Cada sugestao e um bloco markdown que segue este esqueleto:

```
### [ID]: [titulo curto do problema]

| Campo | Valor |
|-------|-------|
| Arquivo | `caminho/do/arquivo.ext` |
| Linha | 42 (ou range 42-58, ou N/A para problemas estruturais) |
| Dimensao | UX / Performance / Modernidade / Codigo / Ideias |
| Esforco | P / M / G |
| Impacto | P / M / G |

**Problema:** Descricao concreta do problema encontrado, com evidencia do codigo.

**Sugestao:** Acao especifica para resolver, com exemplo de codigo se aplicavel.

**Referencia:** Link ou nome do padrao/best practice que fundamenta a sugestao (opcional mas recomendado).
```

**Definicoes dos campos (incluir no template):**
- **Arquivo:** Caminho relativo a raiz do projeto. NUNCA generico ("varios arquivos"). Se afetar multiplos, criar uma sugestao por arquivo ou agrupar com lista explicita.
- **Linha:** Numero de linha ou range. Use `N/A` apenas para problemas estruturais (ex: "falta de testes", "ausencia de arquivo de config").
- **Dimensao:** Categoria da analise que originou o finding. Valores fixos: `UX`, `Performance`, `Modernidade`, `Codigo`, `Ideias`. Um finding pode ter tag secundaria entre parenteses: `Performance (UX)` se impacta ambas.
- **Esforco:** Estimativa de trabalho para implementar. `P` = <30min (rename, config, import). `M` = 30min-2h (refatorar funcao, adicionar componente). `G` = >2h (reescrever modulo, migrar dependencia).
- **Impacto:** Beneficio esperado se implementado. `P` = melhoria marginal, nice-to-have. `M` = melhoria notavel para usuario ou dev. `G` = melhoria critica, resolve dor real.
- **ID:** Formato `[DIM]-[NNN]` onde DIM e abreviatura da dimensao (UX, PERF, MOD, COD, IDEA) e NNN e sequencial por dimensao. Ex: `PERF-003`, `UX-012`.
- **Problema:** DEVE conter evidencia concreta (trecho de codigo, metrica, sintoma observavel). NAO aceitar descricoes vagas como "codigo poderia melhorar".
- **Sugestao:** DEVE ser acao implementavel. Incluir exemplo de codigo quando possivel. NAO aceitar "considerar melhorar X" -- deve ser "trocar X por Y porque Z".
- **Referencia:** Padrao, documentacao ou best practice que fundamenta. Exemplos: "React docs: useMemo", "Web Vitals: CLS", "OWASP Top 10: A03".

**Guidelines a incluir (em tag XML `<guidelines>`):**
- Cada agente auditor produz uma lista de sugestoes neste formato
- IDs sao sequenciais dentro de cada dimensao, resetados por relatorio
- Sugestoes devem ser autocontidas -- quem le uma sugestao individual entende o problema e a solucao sem contexto externo
- Se uma sugestao depende de outra, referenciar o ID: "Prerequisito: PERF-001"
- Maximo 1 sugestao por bloco. Nunca agrupar problemas distintos.
- Se o mesmo padrao aparece em N arquivos, criar 1 sugestao para o arquivo mais representativo e notar "Afeta tambem: arquivo2.ext, arquivo3.ext" na descricao do problema

**Anti-padroes a incluir (em tag XML `<anti_patterns>`):**
- Sugestao sem arquivo concreto: "O projeto deveria usar TypeScript" -- INVALIDA
- Problema vago: "O codigo pode melhorar" -- INVALIDA
- Sugestao vaga: "Considerar refatorar" -- INVALIDA
- Esforco/impacto sem justificativa: Se esforco=G, explicar por que no campo Sugestao
- Sugestao duplicada entre dimensoes: Se performance e modernidade encontram o mesmo problema, uma dimensao cria a sugestao e a outra referencia via ID

Texto do template em portugues brasileiro. Nomes dos campos em portugues. Valores de Dimensao podem ser em portugues (UX, Performance, Modernidade, Codigo, Ideias -- ja sao cognatos).
</action>
<verify>
<automated>
# Verificar que o template existe e contem os elementos obrigatorios
test -f /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q '<template>' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q '<guidelines>' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q 'Arquivo' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q 'Linha' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q 'Dimensao' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q 'Esforco' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q 'Impacto' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q 'Problema' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q 'Sugestao' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q '<anti_patterns>' /home/projects/up-dev-code/up/templates/suggestion.md && \
grep -q '<field_definitions>' /home/projects/up-dev-code/up/templates/suggestion.md && \
echo "PASSED: Template de sugestao valido" || echo "FAILED: Template de sugestao incompleto"
</automated>
</verify>
<done>
- Template `up/templates/suggestion.md` existe com formato completo
- Contem os 6 campos obrigatorios de INFRA-01: arquivo, linha, problema, sugestao, esforco, impacto
- Contem campo de dimensao para classificacao e ID para rastreabilidade
- Segue convencoes de templates existentes (XML tags, code blocks, guidelines)
- Inclui definicoes precisas de cada campo com exemplos e anti-padroes
- Texto em portugues brasileiro
</done>
</task>

<task id="2" type="auto">
<files>up/templates/report.md</files>
<action>
Criar o template de relatorio consolidado em `up/templates/report.md`.

O template DEVE seguir as convencoes existentes dos outros templates em `up/templates/`:
- Titulo H1 descritivo
- Bloco `<template>` com o markdown template dentro de code fences (```markdown ... ```)
- Bloco `<guidelines>` com orientacoes de preenchimento
- Bloco `<quadrant_definitions>` com definicao precisa de cada quadrante

**Estrutura do template de relatorio:**

O template define o formato do relatorio CONSOLIDADO que o sintetizador produz apos receber sugestoes de todos os agentes auditores. O relatorio e salvo em `.plano/melhorias/RELATORIO.md` (para /up:melhorias) ou `.plano/ideias/RELATORIO.md` (para /up:ideias).

Esqueleto do relatorio:

```markdown
---
projeto: [nome do projeto]
data: [YYYY-MM-DD]
stack: [stack detectada]
agentes: [lista de agentes que contribuiram]
total_sugestoes: [N]
cobertura: [X arquivos analisados de Y total]
---

# Relatorio de [Melhorias|Ideias]: [Nome do Projeto]

## Sumario Executivo

[2-3 paragrafos resumindo: estado geral do codebase, areas de maior preocupacao, distribuicao de sugestoes por dimensao, recomendacao de por onde comecar]

## Visao Geral

| Dimensao | Sugestoes | Quick Wins | Estrategicos | Preenchimentos | Evitar |
|----------|-----------|------------|--------------|----------------|--------|
| UX | N | N | N | N | N |
| Performance | N | N | N | N | N |
| Modernidade | N | N | N | N | N |
| Codigo | N | N | N | N | N |
| Total | N | N | N | N | N |

## Matriz Esforco x Impacto

### Quick Wins (Baixo Esforco + Alto Impacto)
> Implementar primeiro. Maior retorno por tempo investido.

[Lista de sugestoes no formato padrao de suggestion.md, ordenadas por impacto decrescente]

### Projetos Estrategicos (Alto Esforco + Alto Impacto)
> Planejar com cuidado. Alto valor mas requer investimento significativo.

[Lista de sugestoes no formato padrao]

### Preenchimentos (Baixo Esforco + Baixo Impacto)
> Fazer quando houver tempo. Melhorias incrementais.

[Lista de sugestoes no formato padrao]

### Evitar (Alto Esforco + Baixo Impacto)
> Nao priorizar. Custo-beneficio desfavoravel.

[Lista de sugestoes no formato padrao]

## Cobertura

### Arquivos Analisados
[Lista de TODOS os arquivos que foram analisados, agrupados por diretorio]

### Arquivos Nao Analisados
[Arquivos excluidos com razao: binario, gerado, vendor, etc.]

### Porcentagem de Cobertura
[X de Y arquivos = Z%]

## Conflitos entre Dimensoes
[Sugestoes que conflitam entre dimensoes, com recomendacao de qual priorizar e por que]
(Ex: "PERF-005 sugere remover animacoes, UX-012 sugere manter -- Recomendacao: manter com prefers-reduced-motion")

## Proximos Passos
[3-5 acoes concretas recomendadas para comecar, baseadas nos quick wins de maior impacto]
```

**Regras de classificacao nos quadrantes (incluir em `<quadrant_definitions>`):**

A classificacao usa os campos Esforco e Impacto de cada sugestao:

| | Impacto M/G (Alto) | Impacto P (Baixo) |
|---|---|---|
| **Esforco P (Baixo)** | Quick Wins | Preenchimentos |
| **Esforco M/G (Alto)** | Projetos Estrategicos | Evitar |

- `P` (pequeno) = baixo
- `M` (medio) e `G` (grande) = alto (agrupados no mesmo lado da matriz)
- Se Esforco=M e Impacto=M, vai para "Projetos Estrategicos" (conservative -- assume alto custo quando ambiguo)
- Dentro de cada quadrante, ordenar por Impacto decrescente (G antes de M), depois por Esforco crescente (P antes de M)

**Guidelines a incluir (em tag XML `<guidelines>`):**
- O sintetizador (Fase 6) e responsavel por preencher este template
- Para /up:melhorias, o arquivo e salvo em `.plano/melhorias/RELATORIO.md`
- Para /up:ideias, o arquivo e salvo em `.plano/ideias/RELATORIO.md`
- Sugestoes duplicadas entre dimensoes DEVEM ser mescladas antes de classificar: manter a sugestao mais completa, listar dimensoes originais entre parenteses
- O sumario executivo DEVE ser opinativo -- recomendar por onde comecar, nao apenas listar
- A secao de conflitos so aparece se houver conflitos reais (nao forcar)
- Frontmatter YAML e obrigatorio -- permite parsing programatico futuro
- Total na tabela de visao geral deve bater com soma dos quadrantes
- Cobertura e obrigatoria (INFRA-03 sera implementado na Fase 5, mas o template ja preve o campo)

**Secao de evolucao (incluir em `<evolution>`):**
- Na Fase 5, agentes auditores preenchem sugestoes individuais usando suggestion.md
- Na Fase 6, sintetizador consolida sugestoes e preenche este template de relatorio
- Na Fase 7/9, o workflow final apresenta o relatorio ao usuario
- Na Fase 10, sugestoes aprovadas viram fases no ROADMAP.md

Texto do template em portugues brasileiro. Nomes dos quadrantes em portugues ("Quick Wins" fica em ingles por ser termo consagrado, o resto em portugues).
</action>
<verify>
<automated>
# Verificar que o template existe e contem os elementos obrigatorios
test -f /home/projects/up-dev-code/up/templates/report.md && \
grep -q '<template>' /home/projects/up-dev-code/up/templates/report.md && \
grep -q '<guidelines>' /home/projects/up-dev-code/up/templates/report.md && \
grep -q '<quadrant_definitions>' /home/projects/up-dev-code/up/templates/report.md && \
grep -q 'Quick Wins' /home/projects/up-dev-code/up/templates/report.md && \
grep -q 'Projetos Estrategicos' /home/projects/up-dev-code/up/templates/report.md && \
grep -q 'Preenchimentos' /home/projects/up-dev-code/up/templates/report.md && \
grep -q 'Evitar' /home/projects/up-dev-code/up/templates/report.md && \
grep -q 'Sumario Executivo' /home/projects/up-dev-code/up/templates/report.md && \
grep -q 'Cobertura' /home/projects/up-dev-code/up/templates/report.md && \
grep -q 'Conflitos' /home/projects/up-dev-code/up/templates/report.md && \
grep -q '<evolution>' /home/projects/up-dev-code/up/templates/report.md && \
echo "PASSED: Template de relatorio valido" || echo "FAILED: Template de relatorio incompleto"
</automated>
</verify>
<done>
- Template `up/templates/report.md` existe com formato completo
- Contem matriz 2x2 de esforco x impacto com 4 quadrantes nomeados (INFRA-02)
- Quadrantes: Quick Wins, Projetos Estrategicos, Preenchimentos, Evitar
- Regras de classificacao P/M/G -> quadrante documentadas
- Tabela de visao geral com totais por dimensao e por quadrante
- Secoes de cobertura (prepara INFRA-03), conflitos entre dimensoes, proximos passos
- Frontmatter YAML para parsing programatico
- Segue convencoes de templates existentes (XML tags, code blocks, guidelines)
- Texto em portugues brasileiro
</done>
</task>

## Criterios de Sucesso

- [ ] Template `up/templates/suggestion.md` existe e define os 6 campos obrigatorios de INFRA-01
- [ ] Template `up/templates/report.md` existe e define a matriz 2x2 com 4 quadrantes de INFRA-02
- [ ] Ambos os templates seguem convencoes de nomeacao e estrutura dos templates existentes em `up/templates/`
- [ ] Campos de sugestao (arquivo, linha, problema, sugestao, esforco, impacto) tem definicoes precisas e nao-ambiguas
- [ ] Quadrantes da matriz tem regras claras de classificacao baseadas em P/M/G
- [ ] Templates incluem anti-padroes e guidelines para preenchimento correto
