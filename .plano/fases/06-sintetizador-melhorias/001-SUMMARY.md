---
phase: 06-sintetizador-melhorias
plan: 06-001
subsystem: agents
tags: [sintetizador, melhorias, cross-dimensao, deduplicacao, conflitos, priorizacao]
dependency_graph:
  requires: [05-001, 05-002, 05-003]
  provides: [up-sintetizador-melhorias.md]
  affects: [up/agents/, agents/]
tech_stack:
  added: []
  patterns: [deduplicacao cross-dimensao 3 criterios, deteccao de conflitos mutuamente exclusivos, classificacao matriz 4 quadrantes, renumeracao MELH-NNN com rastreabilidade]
key_files:
  created:
    - up/agents/up-sintetizador-melhorias.md
    - agents/up-sintetizador-melhorias.md
  modified: []
decisions:
  - "Dimensao primaria = finding com descricao mais completa (mais caracteres em Problema + Sugestao)"
  - "Esforco/Impacto em mesclagem usam o MAIOR valor (conservador para esforco, amplificado para impacto)"
  - "Secao de Conflitos omitida inteiramente quando nenhum conflito -- sem secao vazia"
metrics:
  duration: 194s
  completed: 2026-03-10
  tasks: 2
  files_created: 2
---

# Fase 6 Plano 1: Agente Sintetizador de Melhorias Summary

Agente sintetizador cross-dimensao que recebe sugestoes dos 3 auditores (UX, Performance, Modernidade), deduplica por arquivo+linha+similaridade, detecta conflitos mutuamente exclusivos entre dimensoes, classifica nos 4 quadrantes da matriz esforco x impacto e produz relatorio consolidado em `.plano/melhorias/RELATORIO.md` no formato exato do template report.md.

## Tarefas Executadas

| Tarefa | Descricao | Commit | Arquivos |
|--------|-----------|--------|----------|
| 1 | Criar agente up-sintetizador-melhorias.md | fdb411b | up/agents/up-sintetizador-melhorias.md |
| 2 | Copiar agente para diretorio local | 56579b4 | agents/up-sintetizador-melhorias.md |

## Detalhes da Implementacao

### Agente up-sintetizador-melhorias.md (407 linhas)

**Frontmatter:** name, description, tools (Read, Write, Bash, Grep, Glob), color (purple)

**Estrutura (6 steps no process):**

1. **parse_suggestions** -- Parsear os 3 arquivos de sugestoes, extrair frontmatter e sugestoes individuais, montar lista unificada com campos normalizados. Trata graciosamente dimensoes ausentes (minimo 1 necessaria).

2. **dedup_cross_dimension** -- Deduplicar sugestoes ENTRE dimensoes diferentes usando 3 criterios simultaneos: mesmo arquivo (caminho exato), mesma linha ou linhas sobrepostas (range intersection), problema semanticamente similar (mesmo componente/funcao/padrao). Regra de mesclagem: manter finding mais completo como primario, preservar MAIOR esforco e impacto, registrar IDs descartados. Renumera para MELH-NNN com rastreabilidade.

3. **detect_conflicts** -- Detectar conflitos entre dimensoes: acoes mutuamente exclusivas no mesmo arquivo/componente. Cada conflito tem recomendacao de resolucao. NAO forca conflitos onde nao existem.

4. **classify_quadrants** -- Classificar nos 4 quadrantes usando regras do template report.md (P=Baixo, M/G=Alto). Empate M/M vai para Projetos Estrategicos. Ordenacao: impacto decrescente, depois esforco crescente. Validacao de integridade (soma dos quadrantes = total).

5. **build_report** -- Montar relatorio no formato exato do template report.md: frontmatter YAML, sumario executivo opinativo, tabela de visao geral (dimensao x quadrante), 4 secoes de quadrantes, cobertura consolidada (uniao dos mapas), conflitos (se houver), proximos passos.

6. **write_output** -- Salvar em `.plano/melhorias/RELATORIO.md` via Write tool. NAO sobrescreve sugestoes individuais.

**14 regras criticas:** Cobertura completa incluindo: nunca descartar sugestao, 3 criterios para dedup, dimensao primaria, conflitos mutuamente exclusivos, somas corretas, sumario opinativo, 1 sugestao por bloco, IDs MELH-NNN, imutabilidade de esforco/impacto fora de mesclagem, graceful degradation para dimensoes ausentes, PT-BR com XML em ingles, seguranca (nunca ler .env/credentials), cobertura como uniao, secao conflitos opcional.

**Checklist de auto-verificacao:** 14 itens que o agente valida antes de retornar resultado.

### Copia Local

Arquivo `agents/up-sintetizador-melhorias.md` identico ao canonico em `up/agents/`. Verificado via diff -- zero diferencas. Nao conflita com `up-sintetizador.md` existente (nomes e propositos completamente distintos: pesquisa vs melhorias).

## Decisoes Tomadas

1. **Dimensao primaria = finding mais completo**: Quando dois findings sao mesclados cross-dimensao, o que tem mais caracteres em Problema + Sugestao define a dimensao primaria. Justificativa: o auditor que produziu descricao mais detalhada provavelmente capturou melhor a essencia do problema.

2. **Mesclagem conservadora em esforco, amplificada em impacto**: Na mesclagem, MAIOR esforco (conservador -- assume pior caso) e MAIOR impacto (problema importa em multiplas dimensoes, logo impacto e amplificado).

3. **Secao de Conflitos omitida quando vazia**: Em vez de incluir "Nenhum conflito detectado", a secao inteira e omitida. Relatorio mais limpo.

## Desvios do Plano

Nenhum -- plano executado exatamente como escrito.

## Self-Check: PASSOU

| Verificacao | Resultado |
|-------------|-----------|
| up/agents/up-sintetizador-melhorias.md existe | ENCONTRADO |
| agents/up-sintetizador-melhorias.md existe | ENCONTRADO |
| Arquivos identicos (diff) | OK |
| Commit fdb411b existe | ENCONTRADO |
| Commit 56579b4 existe | ENCONTRADO |
| Linhas >= 300 | 407 linhas |
| 6 steps no process | OK |
| 14 regras criticas | OK |
| Regra de dimensao primaria | OK |
| Quadrantes definidos | OK |
