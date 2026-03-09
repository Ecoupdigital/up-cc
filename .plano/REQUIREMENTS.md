# Requisitos v1: Agentes de Auditoria e Ideias

## Requisitos v1

### Infraestrutura (INFRA)

- [ ] INFRA-01: Template de sugestao estruturado com formato obrigatorio (arquivo, linha, problema, sugestao concreta, esforco, impacto)
- [ ] INFRA-02: Matriz esforco x impacto com 4 quadrantes (quick wins, projetos estrategicos, preenchimentos, evitar)
- [ ] INFRA-03: Mapa de cobertura obrigatorio (lista todo arquivo analisado + % de cobertura)
- [ ] INFRA-04: Standalone -- cria .plano/ se nao existir, detecta stack automaticamente sem /up:novo-projeto
- [ ] INFRA-05: Deteccao de framework/stack antes da analise (React/Vue/Next/Tailwind/etc.) para ajustar heuristicas

### Melhorias (MELH)

- [ ] MELH-01: Comando /up:melhorias com workflow e command standalone
- [ ] MELH-02: Agente de auditoria UX/navegabilidade (CSS, componentes, fluxos, formularios, hierarquia visual)
- [ ] MELH-03: Agente de auditoria de performance (bundle, re-renders, queries, deps, lazy loading, caching)
- [ ] MELH-04: Agente de auditoria de modernidade (libs desatualizadas, padroes obsoletos, alternativas modernas)
- [ ] MELH-05: Sintetizador cross-dimensao (cruza insights, deduplica, valida conflitos entre dimensoes)
- [ ] MELH-06: Relatorio consolidado em .plano/melhorias/ com todas as sugestoes priorizadas

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
| INFRA-01 | TBD | Pendente |
| INFRA-02 | TBD | Pendente |
| INFRA-03 | TBD | Pendente |
| INFRA-04 | TBD | Pendente |
| INFRA-05 | TBD | Pendente |
| MELH-01 | TBD | Pendente |
| MELH-02 | TBD | Pendente |
| MELH-03 | TBD | Pendente |
| MELH-04 | TBD | Pendente |
| MELH-05 | TBD | Pendente |
| MELH-06 | TBD | Pendente |
| IDEIA-01 | TBD | Pendente |
| IDEIA-02 | TBD | Pendente |
| IDEIA-03 | TBD | Pendente |
| IDEIA-04 | TBD | Pendente |
| IDEIA-05 | TBD | Pendente |
| IDEIA-06 | TBD | Pendente |
| INTEG-01 | TBD | Pendente |
| INTEG-02 | TBD | Pendente |
