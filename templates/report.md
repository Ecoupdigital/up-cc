# Template de Relatorio Consolidado

Template para o relatorio consolidado produzido pelo sintetizador apos receber sugestoes de todos os agentes auditores. Organiza sugestoes em matriz 2x2 de esforco x impacto.

<template>

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
| Ideias | N | N | N | N | N |
| **Total** | **N** | **N** | **N** | **N** | **N** |

## Matriz Esforco x Impacto

### Quick Wins (Baixo Esforco + Alto Impacto)
> Implementar primeiro. Maior retorno por tempo investido.

[Lista de sugestoes no formato padrao de suggestion.md, ordenadas por impacto decrescente]

### Projetos Estrategicos (Alto Esforco + Alto Impacto)
> Planejar com cuidado. Alto valor mas requer investimento significativo.

[Lista de sugestoes no formato padrao de suggestion.md, ordenadas por impacto decrescente]

### Preenchimentos (Baixo Esforco + Baixo Impacto)
> Fazer quando houver tempo. Melhorias incrementais.

[Lista de sugestoes no formato padrao de suggestion.md, ordenadas por impacto decrescente]

### Evitar (Alto Esforco + Baixo Impacto)
> Nao priorizar. Custo-beneficio desfavoravel.

[Lista de sugestoes no formato padrao de suggestion.md, ordenadas por impacto decrescente]

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

Se nao houver conflitos, omitir esta secao.

## Proximos Passos
[3-5 acoes concretas recomendadas para comecar, baseadas nos quick wins de maior impacto]
```

</template>

<quadrant_definitions>

### Regras de Classificacao nos Quadrantes

A classificacao usa os campos Esforco e Impacto de cada sugestao (template suggestion.md):

|  | Impacto M/G (Alto) | Impacto P (Baixo) |
|---|---|---|
| **Esforco P (Baixo)** | Quick Wins | Preenchimentos |
| **Esforco M/G (Alto)** | Projetos Estrategicos | Evitar |

**Mapeamento P/M/G para a matriz:**
- `P` (Pequeno) = Baixo
- `M` (Medio) = Alto
- `G` (Grande) = Alto

M e G sao agrupados no mesmo lado da matriz (alto).

**Regra de empate (ambos M):**
Se Esforco=M e Impacto=M, classificar como **Projetos Estrategicos** (abordagem conservadora -- assume alto custo quando ambiguo).

**Ordenacao dentro de cada quadrante:**
1. Impacto decrescente (G antes de M)
2. Em caso de empate de impacto, Esforco crescente (P antes de M)

### Tabela Completa de Classificacao

| Esforco | Impacto | Quadrante |
|---------|---------|-----------|
| P | G | Quick Wins |
| P | M | Quick Wins |
| P | P | Preenchimentos |
| M | G | Projetos Estrategicos |
| M | M | Projetos Estrategicos |
| M | P | Evitar |
| G | G | Projetos Estrategicos |
| G | M | Projetos Estrategicos |
| G | P | Evitar |

</quadrant_definitions>

<guidelines>

### Orientacoes de Preenchimento

**Responsabilidade:**
- O sintetizador (Fase 6) e responsavel por preencher este template
- Para /up:melhorias, o arquivo e salvo em `.plano/melhorias/RELATORIO.md`
- Para /up:ideias, o arquivo e salvo em `.plano/ideias/RELATORIO.md`

**Deduplicacao:**
- Sugestoes duplicadas entre dimensoes DEVEM ser mescladas antes de classificar
- Manter a sugestao mais completa
- Listar dimensoes originais entre parenteses: `Performance (UX)` ou `Modernidade (Performance)`
- O ID da sugestao mantida prevalece; a outra vira referencia: "Ver PERF-005"

**Sumario Executivo:**
- DEVE ser opinativo -- recomendar por onde comecar, nao apenas listar
- Mencionar as 2-3 areas de maior preocupacao
- Indicar se o codebase esta em bom estado geral ou precisa de atencao urgente
- Terminar com recomendacao clara de proximos passos

**Tabela de Visao Geral:**
- Total na ultima linha deve bater com soma das linhas anteriores
- Total de cada coluna de quadrante deve bater com o total de sugestoes daquele quadrante
- Se uma dimensao nao tem sugestoes, manter a linha com zeros

**Secao de Conflitos:**
- So aparece se houver conflitos reais entre dimensoes
- Nao forcar conflitos onde nao existem
- Cada conflito deve ter recomendacao de resolucao

**Frontmatter YAML:**
- Obrigatorio -- permite parsing programatico futuro
- O campo `cobertura` prepara INFRA-03 (implementado na Fase 5)
- O campo `agentes` lista os nomes dos agentes que contribuiram sugestoes

**Consistencia:**
- Sugestoes dentro dos quadrantes usam o formato exato de suggestion.md
- Nenhuma sugestao pode aparecer em mais de um quadrante
- Toda sugestao recebida dos agentes deve aparecer em exatamente um quadrante

</guidelines>

<evolution>

### Ciclo de Vida do Template

**Fase 3 (atual):** Template criado como infraestrutura. Define formato e regras.

**Fase 5:** Agentes auditores (UX, Performance, Modernidade) preenchem sugestoes individuais usando suggestion.md. Cada agente produz sua lista de sugestoes.

**Fase 6:** Sintetizador recebe sugestoes de todos os agentes, deduplica, resolve conflitos, classifica nos quadrantes e preenche este template de relatorio.

**Fase 7/9:** Workflow de /up:melhorias e /up:ideias orquestra agentes e apresenta o relatorio final ao usuario.

**Fase 10:** Sugestoes aprovadas pelo usuario sao convertidas em fases no ROADMAP.md. O campo ID de cada sugestao permite rastreabilidade de sugestao -> fase.

</evolution>
