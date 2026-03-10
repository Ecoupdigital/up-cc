---
phase: 05-agentes-auditores-dimensao
plan: 05-002
subsystem: agents
tags: [performance, auditor, agent, anti-patterns]
dependency_graph:
  requires:
    - up/references/audit-performance.md
    - up/templates/suggestion.md
    - up/templates/report.md
  provides:
    - up/agents/up-auditor-performance.md
    - agents/up-auditor-performance.md
  affects:
    - up/bin/install.js (novo agente a instalar)
tech_stack:
  added: []
  patterns: [xml-semantic-tags, agent-frontmatter, systematic-analysis-pipeline]
key_files:
  created:
    - up/agents/up-auditor-performance.md
    - agents/up-auditor-performance.md
  modified: []
decisions: []
metrics:
  duration: 202s
  completed: 2026-03-10
  tasks: 1
  files_created: 2
---

# Fase 5 Plano 2: Agente Auditor de Performance Summary

Agente up-auditor-performance com pipeline de 5 steps para deteccao sistematica de anti-padroes de performance via analise estatica de codigo em 8 categorias, produzindo sugestoes PERF-NNN com mapa de cobertura INFRA-03.

## Tarefas Executadas

| # | Tarefa | Commit | Arquivos |
|---|--------|--------|----------|
| 1 | Criar agente up-auditor-performance.md | 5cad251 | up/agents/up-auditor-performance.md, agents/up-auditor-performance.md |

## Detalhes da Implementacao

### Agente up-auditor-performance.md (426 linhas)

**Frontmatter:** name, description, tools (Read, Write, Bash, Grep, Glob), color: red.

**Estrutura XML semantica:**
- `<role>` -- Identidade de auditor de performance, escopo de analise estatica (nao benchmark/profiling/Lighthouse), diferencial vs modernidade
- `<context_loading>` -- Carregamento obrigatorio de audit-performance.md, suggestion.md e CLAUDE.md do projeto
- `<process>` com 5 `<step>`:
  1. `stack_detection` -- Detecta framework frontend (React/Vue/Svelte), meta-framework (Next/Nuxt/SvelteKit), CSS framework (Tailwind/Bootstrap), ORM (Prisma/Drizzle/Sequelize/TypeORM). Registra quais das 8 categorias sao relevantes para a stack.
  2. `file_discovery` -- Descobre arquivos analisaveis (*.ts, *.tsx, *.js, *.jsx, *.vue, *.svelte, *.css, *.scss, *.html, configs, prisma schema). Exclui node_modules, .git, dist, build, coverage, .plano.
  3. `systematic_analysis` -- Para cada categoria habilitada, executa sinais de deteccao do reference, confirma com leitura de contexto, descarta falsos positivos, cria sugestoes PERF-NNN no formato do template. Tratamento especial para deps: npm audit com timeout 30s.
  4. `coverage_map` -- Mapa INFRA-03 com lista de arquivos agrupados por diretorio, arquivos excluidos com razao, porcentagem de cobertura.
  5. `write_output` -- Salva em .plano/melhorias/performance-sugestoes.md com frontmatter YAML, sugestoes ordenadas por impacto, mapa de cobertura.
- `<output_format>` -- Formato de retorno ao workflow com resumo por categoria e classificacao em quadrantes
- `<critical_rules>` -- 14 regras inviolaveis (arquivo concreto obrigatorio, sem problema/acao vaga, justificativa para esforco G, mapa obrigatorio, distinguir performance de modernidade, nunca npm install, timeout 30s npm audit, 1 sugestao por bloco, ordenacao por impacto, pular categorias irrelevantes, descartar falsos positivos, IDs sequenciais, PT-BR interface)
- `<analysis_guards>` -- Tabela consolidada de o que buscar vs ignorar por categoria
- `<examples>` -- 1 exemplo completo demonstrando formato correto

## Desvios do Plano

Nenhum -- plano executado exatamente como escrito.

## Self-Check: PASSOU

- up/agents/up-auditor-performance.md: ENCONTRADO
- agents/up-auditor-performance.md: ENCONTRADO
- Commit 5cad251: ENCONTRADO
- Copias identicas: SIM
