---
phase: 08-agente-idealizador
plan: 08-001
subsystem: agents
tags: [idealizador, analista-codigo, pesquisador-mercado, features, mercado]
dependency_graph:
  requires:
    - "up/templates/suggestion.md (formato padrao de sugestao)"
    - "up/agents/up-auditor-ux.md (referencia de estrutura de agente)"
    - "up/agents/up-pesquisador-projeto.md (referencia de filosofia de pesquisa)"
  provides:
    - "up/agents/up-analista-codigo.md (agente de analise de gaps no codigo)"
    - "up/agents/up-pesquisador-mercado.md (agente de pesquisa de mercado)"
  affects:
    - "agents/ (copias locais para instalacao)"
    - ".plano/ideias/ (diretorio de output dos agentes)"
tech_stack:
  added: []
  patterns:
    - "Agente com 5 steps e XML semantico (role, context_loading, process, output_format, critical_rules, success_criteria)"
    - "Formato IDEA-NNN para sugestoes de features com Dimensao=Ideias"
    - "WebSearch/WebFetch para pesquisa de mercado com fallback a dados de treinamento"
key_files:
  created:
    - "up/agents/up-analista-codigo.md"
    - "agents/up-analista-codigo.md"
    - "up/agents/up-pesquisador-mercado.md"
    - "agents/up-pesquisador-mercado.md"
  modified: []
decisions:
  - "2 agentes + 1 consolidador (plano 002): ICE scoring e anti-features requerem cruzar dados de ambos agentes, melhor feito no consolidador"
  - "Color cyan para analista-codigo (distingue de auditores e pesquisador-mercado blue)"
  - "Color blue para pesquisador-mercado (alinhado com up-pesquisador-projeto, mesmo tipo de trabalho)"
metrics:
  duration: 257s
  completed: 2026-03-10
  tasks: 2
  files_created: 4
---

# Fase 8 Plano 1: Agentes Analista de Codigo e Pesquisador de Mercado Summary

Dois agentes independentes que alimentam o comando /up:ideias -- analista de codigo identifica gaps funcionais no codebase, pesquisador de mercado busca concorrentes e tendencias via WebSearch para sugerir features baseadas em evidencia competitiva.

## Tarefas Executadas

### Tarefa 1: Agente up-analista-codigo

**Commit:** d773dc3

Criado agente `up-analista-codigo.md` com frontmatter (name, description, tools: Read/Write/Bash/Grep/Glob, color: cyan) e 5 steps no processo:

1. **stack_detection** -- Detecta linguagem, framework, DB, auth, API style e classifica tipo de projeto
2. **feature_mapping** -- Mapeia features existentes via rotas, modelos, integracoes e estrutura de diretorios
3. **gap_analysis** -- Analisa 4 categorias de gaps: funcionalidade incompleta, feature adjacente ausente, integracao ausente, feature de DX ausente
4. **coverage_map** -- Mapa de cobertura obrigatorio (INFRA-03) com porcentagem de arquivos analisados
5. **write_output** -- Salva resultado em `.plano/ideias/codigo-sugestoes.md` com frontmatter YAML

Agente produz sugestoes IDEA-NNN no formato do template suggestion.md com Dimensao=Ideias. Critical rules adaptadas para foco em oportunidades (nao bugs). Copia identica em `agents/up-analista-codigo.md`.

### Tarefa 2: Agente up-pesquisador-mercado

**Commit:** c7f040c

Criado agente `up-pesquisador-mercado.md` com frontmatter (name, description, tools: Read/Write/Bash/Grep/Glob/WebSearch/WebFetch, color: blue) e 5 steps no processo:

1. **project_understanding** -- Entende dominio e proposito do projeto, classifica dominio de mercado, deriva keywords de busca
2. **competitor_research** -- Pesquisa 5-8 concorrentes via WebSearch com tabela comparativa (nome, URL, features, diferenciais)
3. **trend_analysis** -- Pesquisa 3-5 tendencias de mercado relevantes para o projeto via WebSearch
4. **generate_suggestions** -- Gera sugestoes IDEA-NNN com evidencia de mercado obrigatoria (concorrente ou tendencia)
5. **write_output** -- Salva resultado em `.plano/ideias/mercado-sugestoes.md` com frontmatter YAML

Agente inclui `<philosophy>` adaptada do up-pesquisador-projeto (dados de treinamento = hipotese, prefira fontes atuais). Sinaliza LOW confidence quando usa apenas dados de treinamento como fallback. Cada sugestao requer pelo menos 1 fonte verificavel.

## Desvios do Plano

Nenhum -- plano executado exatamente como escrito.

## Self-Check: PASSOU

- up/agents/up-analista-codigo.md: ENCONTRADO
- agents/up-analista-codigo.md: ENCONTRADO
- up/agents/up-pesquisador-mercado.md: ENCONTRADO
- agents/up-pesquisador-mercado.md: ENCONTRADO
- .plano/fases/08-agente-idealizador/08-001-SUMMARY.md: ENCONTRADO
- Commit d773dc3: ENCONTRADO
- Commit c7f040c: ENCONTRADO
