# Resumo de Pesquisa: Comandos /up:melhorias e /up:ideias

**Dominio:** Auditoria de codigo (UX, Performance, Modernidade) + Sugestao de features por analise estatica e pesquisa de mercado
**Pesquisado:** 2026-03-09
**Confianca geral:** MEDIUM-HIGH

## Sumario Executivo

O projeto propoe dois comandos para o sistema UP: `/up:melhorias` (auditoria do existente) e `/up:ideias` (sugestao do novo). A pesquisa confirma que ambos sao viaveis usando analise estatica de codigo combinada com LLMs, sem necessidade de executar a aplicacao. O ecossistema de ferramentas e maduro para performance e modernidade (Knip, Stylelint, npm-check-updates, ESLint), emergente mas promissor para UX (css-analyzer, eslint-plugin-jsx-a11y), e ainda sem precedente direto para sugestao automatizada de features via codigo+mercado -- o que faz do `/up:ideias` um diferencial real.

A abordagem recomendada para ambos os comandos e a **arquitetura de duas camadas**: Camada 1 extrai metricas objetivas (CSS metrics, dependencias desatualizadas, padroes detectaveis por AST/regex), Camada 2 usa o LLM para interpretacao semantica e contexto cross-file que ferramentas tradicionais nao alcancam. Isso replica a estrategia que a Baymard Institute usou para atingir 95% de acuracia (vs 20% de ChatGPT puro) em auditorias de UX: deteccao por IA, validacao por regras deterministicas. Os tres agentes de dimensao do `/up:melhorias` (UX, performance, modernidade) devem produzir sugestoes em formato identico para que o sintetizador possa agregar, deduplicar e cruzar insights sem atrito.

Os riscos principais sao: (1) falsos positivos em contextos que analise estatica nao resolve (CSS variables, frameworks com responsividade built-in, bibliotecas de componentes), (2) LLMs classificam severidade de problemas de UX com apenas 56% de concordancia -- a severidade deve ser determinada por regras programaticas, (3) para `/up:ideias`, o LLM tende a sugerir demais -- o limite de 15-20 sugestoes com secao obrigatoria de anti-features e critico.

## Descobertas Chave

**UX/Navegabilidade (UX-AUDIT.md):** Analise estatica detecta *sinais* de problemas (inconsistencia de design tokens, ausencia de loading states, headings fora de ordem), mas interpretacao de impacto requer LLM. Use `@projectwallace/css-analyzer` para metricas CSS (150+ metricas) e `eslint-plugin-jsx-a11y` para componentes. As 10 heuristicas de Nielsen traduzidas para analise de codigo sao o framework de avaliacao.

**Performance (PERFORMANCE-AUDIT.md):** 36 padroes de anti-performance mapeados em 8 categorias (re-renders, bundle size, queries/DB, assets, CSS, rede/cache, configs, deps). O LLM agrega valor real em 3 dimensoes que ferramentas nao alcancam: analise semantica cross-file, analise arquitetural, e analise de configuracao. React Compiler 1.0 muda a estrategia de auditoria -- verificar adocao antes de emitir findings de memoizacao.

**Modernidade (MODERNITY-AUDIT.md):** Catalogo de 20+ padroes obsoletos com alternativas modernas documentadas (var->const, moment->dayjs, require->import, CRA->Vite). Knip e a ferramenta primaria para codigo morto e deps fantasma. Score de modernidade proposto (0-100) em 4 dimensoes: deps (30%), padroes de codigo (30%), compatibilidade (20%), tooling (20%).

**Sugestao de Features (FEATURE-SUGGESTIONS.md):** Operar como "product manager sintetico": mapear features existentes via codigo, pesquisar concorrentes via web, inferir features esperadas por dominio. Usar ICE (nao RICE) para scoring (sem dados de Reach) e Kano simplificado para categorizacao (Must-have, Performance, Delighter). Limite de 15-20 sugestoes com anti-features obrigatorias.

## Implicacoes para o Roadmap

Baseado na pesquisa, estrutura de fases sugerida:

### Fase 1: Infraestrutura Compartilhada
**Racional:** Ambos os comandos compartilham formato de sugestao (MELH-05), matriz esforco x impacto (MELH-06), mapa de cobertura (MELH-04), e integracao com roadmap (MELH-07/IDEIA-04). Construir isso primeiro evita duplicacao.
- **Entrega:** Template de sugestao padronizado, template de relatorio com matriz, logica de geracao de fases no roadmap, diretorio `.plano/melhorias/` e `.plano/ideias/`
- **Features:** MELH-04, MELH-05, MELH-06, MELH-07 (parcial)
- **Evita:** Formatos divergentes entre agentes que o sintetizador nao consegue agregar

### Fase 2: Comando /up:melhorias -- Agentes de Dimensao
**Racional:** Os agentes de dimensao sao independentes entre si e podem ser desenvolvidos separadamente. Performance tem o ecossistema mais maduro (HIGH confidence), portanto deve ser o primeiro para validar o padrao. UX e o mais inovador mas depende de ferramentas menos maduras. Modernidade e o mais direto (ferramentas CLI prontas).
- **Entrega:** Comando `melhorias.md`, workflow `melhorias.md`, agentes `up-auditor-ux.md`, `up-auditor-performance.md`, `up-auditor-modernidade.md`
- **Features:** MELH-01, MELH-02
- **Evita:** Superestimar capacidade de deteccao estatica de UX (comunicar como sinais, nao diagnosticos); CSS frameworks ocultando responsividade; falsos positivos de contraste em CSS variables

### Fase 3: Comando /up:melhorias -- Sintetizador
**Racional:** O sintetizador depende dos agentes de dimensao. Sua responsabilidade critica e deduplicar findings que aparecem em multiplas dimensoes (ex: jQuery e problema de modernidade E performance E bundle size) e resolver interseccoes (loading state faltante e UX ou performance?).
- **Entrega:** Agente `up-sintetizador-melhorias.md`, logica de cruzamento entre dimensoes, relatorio final consolidado
- **Features:** MELH-03
- **Evita:** Duplicacao de findings entre dimensoes; classificacao de severidade inconsistente entre agentes

### Fase 4: Comando /up:ideias -- Analise e Pesquisa
**Racional:** Depende da infraestrutura da Fase 1 (formato, matriz). Tres agentes paralelos: analista-codigo (mapeia features existentes), pesquisador-mercado (competitive analysis via web), idealizador (inferencia de dominio). E o comando com mais risco de feature creep.
- **Entrega:** Comando `ideias.md`, workflow `ideias.md`, agentes `up-analista-codigo.md`, `up-pesquisador-mercado.md`, `up-idealizador.md`, `up-sintetizador-ideias.md`
- **Features:** IDEIA-01, IDEIA-02, IDEIA-03, IDEIA-04
- **Evita:** Sugerir 50+ features sem filtro (limite 15-20); desconexao codigo-sugestao (sugerir features que a stack nao suporta); bias do LLM para "mais e melhor" (secao anti-features obrigatoria)

### Fase 5: Integracao e Polish
**Racional:** Apos ambos os comandos funcionando, integrar com o fluxo existente do UP: `/up:melhorias` e `/up:ideias` geram fases no roadmap, que sao executaveis via `/up:executar-fase`.
- **Entrega:** Integracao com roadmap, UX de apresentacao de resultados, documentacao
- **Features:** MELH-07 (completo), IDEIA-04 (completo)
- **Evita:** Gerar fases sem aprovacao do usuario

**Racional de ordenacao de fases:**
- Fase 1 antes de tudo porque o formato padronizado e pre-requisito para todos os agentes produzirem output compativel
- Fase 2 antes de 3 porque o sintetizador consome output dos agentes de dimensao
- `/up:melhorias` (Fases 2-3) antes de `/up:ideias` (Fase 4) porque: ecossistema de ferramentas mais maduro, padroes mais claros, menor risco, e os templates/agentes servem de referencia para o segundo comando
- Fase 5 por ultimo porque e polish e depende de tudo funcionar

**Flags de pesquisa para fases:**
- **Fase 2 (Agentes de Dimensao):** Precisa de pesquisa mais profunda durante planejamento. A divisao exata de responsabilidades entre agentes (quem reporta "jQuery pesado" -- performance ou modernidade?) precisa ser definida com regras claras. Tambem: como lidar com CSS frameworks (Tailwind, Bootstrap) que ocultam responsividade.
- **Fase 3 (Sintetizador):** Precisa de pesquisa mais profunda. A logica de deduplicacao entre dimensoes e nao-trivial -- ex: "dep deprecated" (modernidade) que e tambem "dep pesada" (performance). Definir regra de "dimensao primaria".
- **Fase 4 (Ideias):** Precisa de pesquisa mais profunda. A qualidade das sugestoes de dominio do LLM nao tem benchmark. O custo de contexto de 3 agentes paralelos + sintetizador pode ser alto -- avaliar se 2 agentes sao suficientes (mesclar idealizador + pesquisador-mercado).
- **Fase 1 (Infraestrutura):** Padroes padrao, improvavel precisar de pesquisa. Templates e formatos sao claros.
- **Fase 5 (Integracao):** Padroes padrao. Reutiliza `up-tools.cjs roadmap add-phase` existente.

## Avaliacao de Confianca

| Area | Confianca | Notas |
|------|-----------|-------|
| UX/Navegabilidade | MEDIUM | Ferramentas de CSS sao solidas (css-analyzer, Stylelint), mas deteccao de UX por LLM tem 56% concordancia em severidade (pesquisa academica). Abordagem hibrida mitiga. |
| Performance | HIGH | Ecossistema maduro (ESLint, Knip, Stylelint, bundle analyzers). 36 padroes bem documentados. React Compiler muda estrategia mas e verificavel. |
| Modernidade | HIGH | Ferramentas CLI prontas (npm outdated, Knip, depcheck). Catalogo de padroes obsoletos bem documentado com multiplas fontes cruzadas. |
| Sugestao de Features | MEDIUM | Frameworks de priorizacao (ICE, Kano) sao solidos, mas a abordagem de "product manager sintetico" e nova e sem benchmark. Competitive analysis por LLM e validado (GapsFinder, Competely). |

## Lacunas a Abordar

- **Divisao de responsabilidades entre agentes de dimensao:** Quando um finding pertence a duas dimensoes (ex: dep deprecated + pesada), qual agente reporta? Precisa de regra clara antes de implementar.
- **Fallback sem ferramentas CLI:** Em ambientes sem `npm`/`npx` no PATH, o agente precisa de fallback via Read/Grep. Nao esta claro o quao eficaz isso sera na pratica.
- **Qualidade de sugestoes de dominio do LLM:** Nao existe benchmark de acuracia para inferencia de features por tipo de produto. Precisara validacao com projetos reais.
- **Custo de contexto com agentes paralelos:** `/up:melhorias` usa 3 agentes + 1 sintetizador; `/up:ideias` usa 3 + 1. Total de 8 agentes novos. Avaliar se pode reaproveitar agentes entre comandos.
- **CSS frameworks e component libraries:** Tailwind, Bootstrap, MUI ocultam responsividade e padroes de UX. Deteccao de framework e necessaria antes de auditar, mas a heuristica nao esta definida.
- **Internacionalizacao da pesquisa web:** `/up:ideias` pesquisa concorrentes via web (resultados em ingles) mas apresenta em portugues. Traducao e adaptacao de contexto nao foi pesquisada.

## Fontes

### UX/Navegabilidade
- Catching UX Flaws in Code (arXiv:2512.04262) -- LLM para avaliacao heuristica
- Baymard UX-Ray -- 95% acuracia com abordagem hibrida
- Project Wallace CSS Analyzer -- 150+ metricas CSS
- eslint-plugin-jsx-a11y -- acessibilidade em JSX
- Nielsen's 10 Usability Heuristics (nngroup.com)

### Performance
- React Compiler 1.0 (react.dev/blog) -- memoizacao automatica
- Knip (knip.dev) -- deps + exports + arquivos nao usados
- Stylelint (stylelint.io) -- lint CSS
- webpack-bundle-analyzer / vite-bundle-analyzer
- Bundlephobia -- tamanho de pacotes npm

### Modernidade
- npm-check-updates -- versoes desatualizadas
- ESLint v10 -- regras de modernidade (no-var, prefer-const, etc.)
- You-Dont-Need-Lodash/jQuery/Momentjs -- bancos de substituicoes
- jscodeshift -- codemods para migracao automatica
- Node.js EOL (nodejs.org) -- ciclo de vida de versoes

### Sugestao de Features
- GapsFinder / Competely -- competitive analysis automatizada
- PostHog / Mixpanel -- padroes de product analytics
- RICE/ICE/Kano frameworks (ProductPlan, Plane.so, Atlassian)
- LLMs for Source Code Analysis (arXiv:2503.17502v1)
