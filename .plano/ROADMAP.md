# Roadmap: Agentes de Auditoria e Ideias

## Fases

- [x] **Fase 1: Sistema UP base** - Existente
- [x] **Fase 2: Agentes paralelos e mapeamento** - Existente
- [x] **Fase 3: Templates e formatos padrao** - Formatos estruturados compartilhados entre comandos
- [x] **Fase 4: References de auditoria** - Documentos de referencia para cada dimensao de analise
- [x] **Fase 5: Agentes auditores de dimensao** - Agentes especializados em UX, performance e modernidade
- [x] **Fase 6: Sintetizador de melhorias** - Cruzamento cross-dimensao e relatorio consolidado
- [ ] **Fase 7: Comando /up:melhorias** - Command e workflow standalone para auditoria completa (1/2 planos)
- [x] **Fase 8: Agente idealizador** - Agente que sugere features novas por analise de codigo e mercado
- [ ] **Fase 9: Comando /up:ideias** - Command e workflow standalone para sugestao de features
- [ ] **Fase 10: Integracao com roadmap** - Geracao de fases e apresentacao interativa de resultados

## Detalhes das Fases

### Fase 1: Sistema UP base
**Status**: Existente
**Funcionalidades**: 19 comandos slash, CLI tools (up-tools.cjs + core.cjs), installer multi-runtime, hooks (statusline + context monitor), suporte brownfield com deteccao automatica
**Planos**: N/A (pre-existente)

### Fase 2: Agentes paralelos e mapeamento
**Status**: Existente
**Funcionalidades**: 8 agentes especializados (executor, planejador, roteirista, verificador, pesquisador-projeto, sintetizador, depurador, mapeador-codigo), padrao de spawn paralelo via Task, padrao command-workflow-agent estabelecido
**Planos**: N/A (pre-existente)

### Fase 3: Templates e formatos padrao
**Objetivo**: Usuario e agentes produzem sugestoes em formato identico e acionavel, permitindo agregacao e priorizacao consistente
**Depende de**: Fase 2 (agentes existentes como referencia de padrao)
**Requisitos**: INFRA-01, INFRA-02
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Toda sugestao gerada por qualquer agente contem obrigatoriamente: arquivo, linha, problema, sugestao concreta, esforco (P/M/G) e impacto (P/M/G)
  2. O relatorio final apresenta sugestoes organizadas em matriz 2x2 de esforco x impacto com quadrantes nomeados (quick wins, projetos estrategicos, preenchimentos, evitar)
  3. Templates sao arquivos markdown em up/templates/ que agentes carregam e preenchem
**Planos**: 1/1 completo
**Completado**: 2026-03-09

### Fase 4: References de auditoria
**Objetivo**: Agentes auditores tem catalogos de padroes documentados para cada dimensao, garantindo analise sistematica e nao ad-hoc
**Depende de**: Fase 2 (convencoes de references existentes)
**Requisitos**: INFRA-05
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Reference de performance contem catalogo de anti-padroes organizados por categoria (re-renders, bundle, queries, assets, CSS, rede, configs, deps) com exemplos de codigo e solucoes
  2. Reference de modernidade contem catalogo de padroes obsoletos com alternativas modernas e nivel de urgencia
  3. Reference de UX contem heuristicas de avaliacao traduzidas para sinais detectaveis em codigo (CSS, componentes, fluxos)
  4. Cada reference inclui instrucoes de deteccao de framework/stack para ajustar heuristicas (React vs Vue vs vanilla, Tailwind vs CSS puro)
**Planos**: 3/3 completo
**Completado**: 2026-03-09

### Fase 5: Agentes auditores de dimensao
**Objetivo**: Cada dimensao de analise (UX, performance, modernidade) tem um agente especializado que analisa o codebase completo e produz sugestoes estruturadas
**Depende de**: Fase 3 (templates de sugestao), Fase 4 (references de padroes)
**Requisitos**: MELH-02, MELH-03, MELH-04, INFRA-03
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Agente de UX analisa CSS/SCSS, componentes e fluxos de navegacao, produzindo sugestoes com sinais de problemas de usabilidade (inconsistencia visual, ausencia de feedback, fluxos confusos)
  2. Agente de performance identifica anti-padroes de performance no codigo (re-renders, deps pesadas, ausencia de lazy loading, queries ineficientes) com estimativa de impacto
  3. Agente de modernidade detecta dependencias desatualizadas, padroes obsoletos e sugere alternativas modernas com nivel de urgencia
  4. Cada agente produz mapa de cobertura listando todo arquivo analisado, e o total de cobertura e visivel no relatorio
  5. Cada agente usa o template de sugestao padrao (arquivo, linha, problema, sugestao, esforco, impacto)
**Planos**: 3/3 completo
**Completado**: 2026-03-10

### Fase 6: Sintetizador de melhorias
**Objetivo**: Insights de todas as dimensoes sao cruzados, deduplicados e consolidados em um relatorio unico com priorizacao clara
**Depende de**: Fase 5 (agentes de dimensao produzem sugestoes)
**Requisitos**: MELH-05, MELH-06
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Sugestoes duplicadas entre dimensoes sao detectadas e mescladas (ex: jQuery reportado como problema de modernidade E performance aparece uma vez com ambas as dimensoes citadas)
  2. Conflitos entre dimensoes sao sinalizados (ex: "remover animacao" por performance vs "manter animacao" por UX)
  3. Relatorio consolidado em .plano/melhorias/ contem todas as sugestoes priorizadas na matriz esforco x impacto com totais por dimensao
**Planos**: 1/1 completo
**Completado**: 2026-03-10

### Fase 7: Comando /up:melhorias
**Objetivo**: Usuario pode invocar /up:melhorias em qualquer projeto e receber auditoria completa do codebase sem pre-requisitos
**Depende de**: Fase 5 (agentes), Fase 6 (sintetizador), Fase 3 (templates)
**Requisitos**: MELH-01, INFRA-04
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Usuario invoca /up:melhorias em projeto sem .plano/ e o comando cria a estrutura necessaria automaticamente (standalone)
  2. O comando detecta a stack do projeto (React/Vue/Next/Tailwind/etc.) e ajusta a analise
  3. Tres agentes rodam em paralelo (UX, performance, modernidade), seguidos pelo sintetizador
  4. Usuario recebe relatorio final com sugestoes priorizadas por quadrante de esforco x impacto
**Planos**: 1/2 completo

### Fase 8: Agente idealizador
**Objetivo**: Projeto recebe sugestoes de features novas baseadas em analise de codigo existente, pesquisa de mercado e perspectiva do usuario final
**Depende de**: Fase 3 (formatos de sugestao), Fase 2 (padrao de agentes paralelos)
**Requisitos**: IDEIA-02, IDEIA-03, IDEIA-04, IDEIA-05
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Agente analista de codigo mapeia features existentes e identifica gaps funcionais (o que o projeto faz vs o que poderia fazer)
  2. Agente pesquisador de mercado busca concorrentes e tendencias relevantes via web search e apresenta comparativo
  3. Cada sugestao de feature tem score ICE (Impact x Confidence x Ease, escala 1-10) para priorizacao objetiva
  4. Para cada 3 sugestoes positivas, pelo menos 1 anti-feature e apresentada (feature que NAO deve ser implementada, com justificativa)
**Planos**: 2/2 completo
**Completado**: 2026-03-10

### Fase 9: Comando /up:ideias
**Objetivo**: Usuario pode invocar /up:ideias em qualquer projeto e receber sugestoes de features novas com pesquisa de mercado
**Depende de**: Fase 8 (agente idealizador), Fase 3 (templates)
**Requisitos**: IDEIA-01, IDEIA-06, INFRA-04
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Usuario invoca /up:ideias em projeto sem .plano/ e o comando cria a estrutura necessaria automaticamente (standalone)
  2. Agentes paralelos analisam codigo e pesquisam mercado/concorrentes, seguidos por consolidacao
  3. Relatorio em .plano/ideias/ contem sugestoes limitadas (max 15-20) com score ICE e categorizacao (must-have, performance, delighter)
  4. Secao de anti-features esta presente e e proporcional as sugestoes positivas
**Planos**: TBD

### Fase 10: Integracao com roadmap
**Objetivo**: Sugestoes aprovadas pelo usuario sao convertidas automaticamente em fases executaveis no ROADMAP.md
**Depende de**: Fase 7 (melhorias funciona), Fase 9 (ideias funciona)
**Requisitos**: INTEG-01, INTEG-02
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Apos auditoria ou ideacao, usuario pode aprovar/rejeitar sugestoes individualmente via interacao no terminal
  2. Sugestoes aprovadas sao agrupadas em fases coerentes e adicionadas ao ROADMAP.md automaticamente
  3. Fases geradas sao executaveis via /up:executar-fase existente sem adaptacoes
**Planos**: TBD

## Tabela de Progresso

| Fase | Planos Completos | Status | Completado |
|------|-----------------|--------|------------|
| 1. Sistema UP base | N/A | Existente | Pre-existente |
| 2. Agentes paralelos e mapeamento | N/A | Existente | Pre-existente |
| 3. Templates e formatos padrao | 1/1 | Completa | 2026-03-09 |
| 4. References de auditoria | 3/3 | Completa | 2026-03-09 |
| 5. Agentes auditores de dimensao | 3/3 | Completa | 2026-03-10 |
| 6. Sintetizador de melhorias | 1/1 | Completa | 2026-03-10 |
| 7. Comando /up:melhorias | 1/2 | Em progresso | - |
| 8. Agente idealizador | 2/2 | Completa | 2026-03-10 |
| 9. Comando /up:ideias | 0/? | Nao iniciado | - |
| 10. Integracao com roadmap | 0/? | Nao iniciado | - |
