---
phase: 05-agentes-auditores-dimensao
plan: 05-001
subsystem: agents
tags: [ux, auditor, agent, heuristics, coverage-map]
dependency_graph:
  requires:
    - up/references/audit-ux.md (reference de heuristicas UX)
    - up/templates/suggestion.md (formato padrao de sugestao)
    - up/templates/report.md (formato de relatorio com cobertura)
  provides:
    - up/agents/up-auditor-ux.md (agente auditor de UX)
    - agents/up-auditor-ux.md (copia local para instalacao)
  affects:
    - .plano/melhorias/ux-sugestoes.md (output produzido em runtime)
tech_stack:
  added: []
  patterns:
    - "Agente com XML tags semanticas (role, process, step, critical_rules, output_format, context_loading)"
    - "Stack detection em 4 camadas (CSS, component, UI, form)"
    - "Mapa de cobertura obrigatorio INFRA-03"
key_files:
  created:
    - up/agents/up-auditor-ux.md
    - agents/up-auditor-ux.md
  modified: []
decisions: []
metrics:
  duration: 155s
  completed: 2026-03-10
  tasks: 1
  files_created: 2
---

# Fase 5 Plano 1: Agente Auditor de UX Summary

Agente `up-auditor-ux` com 396 linhas que analisa codebases para problemas de usabilidade via analise estatica, produzindo sugestoes UX-NNN no formato do template padrao com mapa de cobertura INFRA-03 obrigatorio.

## O que foi feito

### Tarefa 1: Criar agente up-auditor-ux.md

**Commit:** `183d418`
**Arquivos:** `up/agents/up-auditor-ux.md`, `agents/up-auditor-ux.md`

Criado o agente auditor de UX com a seguinte estrutura:

1. **Frontmatter** -- name, description, tools (Read, Write, Bash, Grep, Glob), color (magenta)
2. **`<role>`** -- Identidade de auditor UX via analise estatica, sem acesso visual
3. **`<context_loading>`** -- Step inicial obrigatorio para carregar audit-ux.md, suggestion.md e CLAUDE.md
4. **`<process>`** com 5 steps:
   - **stack_detection** -- Detecta CSS framework (Tailwind/Bootstrap/Modules/Styled/puro), component framework (React/Vue/Svelte/Next/vanilla), UI library (shadcn/Radix/MUI/Ant/Chakra), form library (RHF/Formik/Zod/VeeValidate)
   - **file_discovery** -- Lista todos os arquivos do projeto excluindo node_modules/.git/dist/build, filtra relevantes para UX (CSS/SCSS/TSX/JSX/Vue/Svelte/HTML)
   - **systematic_analysis** -- Itera pelas 7 categorias do reference (feedback-status, consistencia, formularios, navegacao, responsividade, hierarquia-visual, erros-recuperacao), aplica heuristicas ajustadas pela stack, confirma findings lendo contexto, produz sugestoes UX-NNN
   - **coverage_map** -- Mapa INFRA-03 com arquivos agrupados por diretorio, excluidos com razao, porcentagem de cobertura
   - **write_output** -- Salva em `.plano/melhorias/ux-sugestoes.md` com frontmatter, stack, sugestoes ordenadas por impacto, mapa de cobertura
5. **`<output_format>`** -- Formato de retorno ao workflow chamador com totais por quadrante
6. **`<critical_rules>`** -- 13 regras inviolaveis cobrindo qualidade de sugestoes, cobertura, ordenacao, falsos positivos, idioma e seguranca

## Desvios do Plano

Nenhum -- plano executado exatamente como escrito.

Nota: O plano mencionava 8 categorias (incluindo "acessibilidade-basica"), mas o reference audit-ux.md contém apenas 7 categorias. O agente foi alinhado com as 7 categorias reais do reference: feedback-status, consistencia, formularios, navegacao, responsividade, hierarquia-visual, erros-recuperacao. Isto nao e um desvio, e sim uma correcao para alinhar com o artefato real.

## Verificacao

Todos os criterios de done atendidos:
- [x] Arquivo `up/agents/up-auditor-ux.md` existe com frontmatter valido
- [x] Copia identica em `agents/up-auditor-ux.md`
- [x] Agente carrega reference audit-ux.md e template suggestion.md via Read
- [x] Step de deteccao de stack (4 camadas)
- [x] Analise sistematica por 7 categorias de heuristica UX
- [x] Mapa de cobertura INFRA-03 com contagem e porcentagem
- [x] Sugestoes no formato UX-NNN do template
- [x] Output em `.plano/melhorias/ux-sugestoes.md`
- [x] 396 linhas (alvo: 350-450)
- [x] Texto em PT-BR, tags XML em ingles

## Self-Check: PASSOU

- ENCONTRADO: `up/agents/up-auditor-ux.md`
- ENCONTRADO: `agents/up-auditor-ux.md`
- ENCONTRADO: `.plano/fases/05-agentes-auditores-dimensao/05-001-SUMMARY.md`
- ENCONTRADO: commit `183d418`
