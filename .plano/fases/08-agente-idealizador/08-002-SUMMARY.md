---
phase: 08-agente-idealizador
plan: 08-002
subsystem: agentes
tags: [consolidador, ice-scoring, anti-features, ideias]
dependency_graph:
  requires: [08-001]
  provides: [up-consolidador-ideias]
  affects: [fase-09-comando-ideias]
tech_stack:
  added: []
  patterns: [ICE scoring, anti-feature generation, cross-source dedup]
key_files:
  created:
    - up/agents/up-consolidador-ideias.md
    - agents/up-consolidador-ideias.md
  modified: []
decisions:
  - "ICE scoring com bases derivadas dos campos P/M/G do template suggestion.md, ajuste contextual -1 a +1"
  - "Anti-features obrigatorias com ceil(positivas/3), minimo 1"
  - "IDs mantidos como IDEA-NNN (namespace proprio, nao renumerados)"
  - "Confidence base varia por fonte: codigo puro=5, concorrente confirmado=8, tendencia=4, ambas fontes=9"
metrics:
  duration: 188s
  completed: 2026-03-10T14:02:51Z
  tasks: 1
  files: 2
---

# Fase 8 Plano 2: Agente Consolidador de Ideias Summary

Agente up-consolidador-ideias que consolida sugestoes de analise de codigo e pesquisa de mercado, aplica ICE scoring transparente com justificativa por dimensao, gera anti-features proporcionais e produz relatorio final em .plano/ideias/RELATORIO.md.

## Tarefas Executadas

### Tarefa 1: Criar agente up-consolidador-ideias

**Commit:** a4b65e9
**Arquivos:** up/agents/up-consolidador-ideias.md, agents/up-consolidador-ideias.md

Criado o agente consolidador de ideias seguindo a estrutura do up-sintetizador-melhorias.md como referencia, com as seguintes adaptacoes:

1. **Input:** 2 fontes (codigo-sugestoes.md + mercado-sugestoes.md) em vez de 3 dimensoes
2. **Deduplicacao:** Cross-fonte com 2 criterios (mesma feature + sobreposicao de escopo) em vez de 3 criterios (arquivo + linha + similaridade)
3. **Priorizacao:** ICE scoring (Impact x Confidence x Ease, 1-10, max 1000) em vez de matriz esforco x impacto 2x2
4. **Extra:** Anti-features obrigatorias na proporcao ceil(positivas/3) -- recomendacoes negativas com justificativa
5. **IDs:** Mantidos como IDEA-NNN (namespace de ideias preservado, sem renumerar para MELH-NNN)
6. **Output:** .plano/ideias/RELATORIO.md com ranking ICE decrescente + secao anti-features

O agente tem 6 steps no processo:
- parse_suggestions: parseia sugestoes de ambas fontes
- dedup_cross_source: deduplica cross-fonte por feature + escopo
- ice_scoring: calcula ICE com bases derivadas de P/M/G e ajuste contextual
- anti_features: gera anti-features com categorias (scope creep, complexidade, fragmentacao, reinvencao, armadilha)
- build_report: monta relatorio adaptado do template report.md
- write_output: salva em .plano/ideias/ e retorna resumo estruturado

## Desvios do Plano

Nenhum - plano executado exatamente como escrito.

## Self-Check: PASSOU

- [x] up/agents/up-consolidador-ideias.md existe (ENCONTRADO)
- [x] agents/up-consolidador-ideias.md existe (ENCONTRADO)
- [x] Commit a4b65e9 existe (ENCONTRADO)
- [x] Todas as 20 verificacoes automatizadas passaram
- [x] Arquivos sao identicos (diff confirma)
