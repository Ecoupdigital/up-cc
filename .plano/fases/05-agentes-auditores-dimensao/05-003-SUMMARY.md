---
phase: 05-agentes-auditores-dimensao
plan: 05-003
subsystem: agents
tags: [auditor, modernidade, agente, padroes-obsoletos, dependencias]
dependency_graph:
  requires: [03-001 (templates suggestion/report), 04-001 (audit-modernidade reference)]
  provides: [up-auditor-modernidade agent]
  affects: [06-sintetizador (consome sugestoes MOD-NNN), 07-melhorias (orquestra agente)]
tech_stack:
  added: []
  patterns: [agente-auditor-dimensao, deteccao-stack, mapa-cobertura, sugestao-estruturada]
key_files:
  created:
    - up/agents/up-auditor-modernidade.md
    - agents/up-auditor-modernidade.md
  modified: []
decisions: []
metrics:
  duration: ~4 minutos
  completed: 2026-03-10
  tasks: 1
  files_created: 2
---

# Fase 5 Plano 3: Agente Auditor de Modernidade Summary

Agente up-auditor-modernidade com 378 linhas que analisa codebases para padroes obsoletos, dependencias desatualizadas e oportunidades de modernizacao usando reference audit-modernidade.md (~59KB, 6 categorias), produzindo sugestoes MOD-NNN com urgencia mapeada para impacto e mapa de cobertura INFRA-03.

## Tarefas Executadas

### Tarefa 1: Criar agente up-auditor-modernidade

**Commit:** `e1bd1c6`
**Arquivos:** `up/agents/up-auditor-modernidade.md`, `agents/up-auditor-modernidade.md`

Criado o agente auditor de modernidade com a seguinte estrutura:

**Frontmatter:**
- name: up-auditor-modernidade
- description: Analisa codebase para padroes obsoletos, dependencias desatualizadas e oportunidades de modernizacao
- tools: Read, Write, Bash, Grep, Glob
- color: blue

**Corpo (XML tags semanticas):**
- `<role>` -- Identidade de auditor de modernidade com foco em ATUALIDADE do codigo (nao performance)
- `<context_loading>` -- Carregamento obrigatorio de audit-modernidade.md e suggestion.md com mapeamento de urgencia
- `<process>` com 5 steps:
  - `stack_detection` -- Deteccao de Node.js, TypeScript, framework, meta-framework, modulos, build tools, CSS, ORM, runtime alternativo
  - `file_discovery` -- Listagem de arquivos analisaveis com exclusoes padrao
  - `systematic_analysis` -- 6 categorias: js-apis, node-apis, deps-obsoletas, padroes-codigo, configs-tooling, seguranca-modernidade
  - `coverage_map` -- Mapa de cobertura INFRA-03 com arquivos analisados e excluidos
  - `write_output` -- Salvamento em .plano/melhorias/modernidade-sugestoes.md
- `<output_format>` -- Formato de retorno com resumo por urgencia
- `<critical_rules>` -- 14 regras inviolaveis

**Diferenciais do agente de modernidade:**
- Foco em ATUALIDADE do codigo, nao velocidade/performance
- Urgencia do reference mapeia direto para impacto: Critico -> G, Medio -> M, Baixo -> P
- Sugestoes ordenadas por urgencia (Critico primeiro) e dentro de cada grupo por esforco crescente (quick wins primeiro)
- Quando finding impacta modernidade E performance, usa tag `Modernidade (Performance)` sem duplicar
- Timeout de 5s por pacote ao verificar datas de publish (maximo 20 pacotes)
- Nao sugere migracao de framework inteiro (foca em migracoes DENTRO do ecossistema)

## Desvios do Plano

Nenhum - plano executado exatamente como escrito.

## Verificacao

Todos os criterios de sucesso verificados:
- [x] Agente existe em `up/agents/` e `agents/` com conteudo identico (diff confirma)
- [x] Agente carrega reference `audit-modernidade.md` e template `suggestion.md` via Read tool
- [x] Agente detecta stack completa com versoes para ajustar categorias relevantes
- [x] Agente analisa padroes obsoletos com nivel de urgencia (Critico/Medio/Baixo)
- [x] Sugestoes incluem alternativa moderna concreta e exemplo de migracao
- [x] Sugestoes usam formato do template com IDs MOD-NNN e urgencia mapeada para impacto
- [x] Mapa de cobertura presente com lista de arquivos e porcentagem (INFRA-03)
- [x] Formato segue convencoes de agentes UP (frontmatter, XML tags, PT-BR)
- [x] Tamanho dentro do alvo: 378 linhas (target 350-450)

## Self-Check: PASSOU

- ENCONTRADO: up/agents/up-auditor-modernidade.md
- ENCONTRADO: agents/up-auditor-modernidade.md
- ENCONTRADO: .plano/fases/05-agentes-auditores-dimensao/05-003-SUMMARY.md
- ENCONTRADO: commit e1bd1c6
- PASS: arquivos identicos (diff confirma)
