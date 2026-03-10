# Requisitos v1: Agentes de Auditoria e Ideias

## Requisitos v1

### Infraestrutura (INFRA)

- [x] INFRA-01: Template de sugestao estruturado com formato obrigatorio (arquivo, linha, problema, sugestao concreta, esforco, impacto)
- [x] INFRA-02: Matriz esforco x impacto com 4 quadrantes (quick wins, projetos estrategicos, preenchimentos, evitar)
- [x] INFRA-03: Mapa de cobertura obrigatorio (lista todo arquivo analisado + % de cobertura)
- [ ] INFRA-04: Standalone -- cria .plano/ se nao existir, detecta stack automaticamente sem /up:novo-projeto
- [x] INFRA-05: Deteccao de framework/stack antes da analise (React/Vue/Next/Tailwind/etc.) para ajustar heuristicas

### Melhorias (MELH)

- [ ] MELH-01: Comando /up:melhorias com workflow e command standalone
- [x] MELH-02: Agente de auditoria UX/navegabilidade (CSS, componentes, fluxos, formularios, hierarquia visual)
- [x] MELH-03: Agente de auditoria de performance (bundle, re-renders, queries, deps, lazy loading, caching)
- [x] MELH-04: Agente de auditoria de modernidade (libs desatualizadas, padroes obsoletos, alternativas modernas)
- [x] MELH-05: Sintetizador cross-dimensao (cruza insights, deduplica, valida conflitos entre dimensoes)
- [x] MELH-06: Relatorio consolidado em .plano/melhorias/ com todas as sugestoes priorizadas

### Ideias (IDEIA)

- [ ] IDEIA-01: Comando /up:ideias com workflow e command standalone
- [ ] IDEIA-02: Agente analista de codigo (mapear features existentes para identificar gaps)
- [ ] IDEIA-03: Agente pesquisador de mercado (concorrentes, tendencias via web search)
- [ ] IDEIA-04: Sugestoes com priorizacao ICE (Impact x Confidence x Ease, escala 1-10)
- [ ] IDEIA-05: Anti-features obrigatorias (1 anti-feature para cada 3 sugestoes positivas)
- [ ] IDEIA-06: Relatorio consolidado em .plano/ideias/

### Integracao (INTEG)

- [ ] INTEG-01: Geracao automatica de fases no ROADMAP.md a partir de sugestoes/ideias aprovadas
- [ ] INTEG-02: Apresentacao interativa de sugestoes com aprovacao/rejeicao por item

## Requisitos v2 (Adiados)

- Acessibilidade (ARIA, screen readers, keyboard nav) -- dimensao extra para /up:melhorias
- Navegacao via browser com Playwright -- complementa analise estatica com UX real
- Score de modernidade quantificavel (0-100) -- requer calibracao com projetos reais
- Monorepo support (multiplos package.json) -- complexidade alta, baixa demanda v1
- Integracao com CI/CD (relatorio automatico em PRs)

## Fora do Escopo

- Execucao automatica das melhorias -- gera roadmap, execucao e via /up:executar-fase
- Testes automatizados das sugestoes -- agente sugere, humano decide
- Analytics de uso real (Mixpanel, PostHog) -- requer telemetria, fora do escopo de analise estatica
- Benchmarking de performance (Lighthouse, profiling) -- requer app rodando

## Rastreabilidade

| Requisito | Fase | Status |
|-----------|------|--------|
| INFRA-01 | Fase 3 | Completo |
| INFRA-02 | Fase 3 | Completo |
| INFRA-03 | Fase 5 | Completo |
| INFRA-04 | Fase 7, 9 | Pendente |
| INFRA-05 | Fase 4 | Completo |
| MELH-01 | Fase 7 | Pendente |
| MELH-02 | Fase 5 | Completo |
| MELH-03 | Fase 5 | Completo |
| MELH-04 | Fase 5 | Completo |
| MELH-05 | Fase 6 | Completo |
| MELH-06 | Fase 6 | Completo |
| IDEIA-01 | Fase 9 | Pendente |
| IDEIA-02 | Fase 8 | Pendente |
| IDEIA-03 | Fase 8 | Pendente |
| IDEIA-04 | Fase 8 | Pendente |
| IDEIA-05 | Fase 8 | Pendente |
| IDEIA-06 | Fase 9 | Pendente |
| INTEG-01 | Fase 10 | Pendente |
| INTEG-02 | Fase 10 | Pendente |
