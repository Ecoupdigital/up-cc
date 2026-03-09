# Pesquisa: Auditoria de Performance por Analise Estatica de Codigo

**Dominio:** Deteccao de problemas de performance sem execucao da aplicacao
**Pesquisado:** 2026-03-09
**Confianca geral:** HIGH (ferramentas e padroes bem documentados, ecossistema maduro)

---

## Sumario Executivo

Auditoria de performance por analise estatica e um dominio maduro com ferramentas especializadas por camada (frontend, backend, dependencias, assets) e uma crescente capacidade de LLMs para detectar padroes que ferramentas tradicionais ignoram. A abordagem mais eficaz combina: (1) catalogo de anti-padroes detectaveis por AST/regex em codigo fonte, (2) analise de dependencias e configuracoes de build, e (3) revisao heuristica por LLM de padroes arquiteturais que impactam performance.

O diferencial de usar LLMs (como no agente UP) em vez de ferramentas tradicionais e a capacidade de entender **contexto semantico** -- um ESLint detecta `useCallback` sem deps, mas um LLM detecta "este componente faz fetch em todo render porque o state esta no lugar errado". Isso posiciona o agente de performance do `/up:melhorias` como complementar (nao substituto) de linters, analisando o que ferramentas de regras fixas nao alcancam.

A pesquisa revelou que o ecossistema se divide em 6 categorias claras de deteccao, cada uma com padroes bem definidos que podem ser verificados por analise de codigo, CSS, configs e estrutura de arquivos -- sem precisar rodar benchmarks ou profiling.

---

## 1. Frontend: Padroes de Performance Detectaveis por Codigo

### 1.1 Re-renders Desnecessarios (React/Vue/Svelte)

**Confianca:** HIGH (documentado oficialmente pelo React, Vue, etc.)

| Padrao Detectavel | O Que Procurar no Codigo | Impacto |
|-------------------|--------------------------|---------|
| Funcao inline no render | `onClick={() => ...}` em componentes filhos memoizados | Re-render de toda arvore filha |
| Objeto/array literal como prop | `style={{...}}` ou `options={[...]}` criados inline | Nova referencia a cada render |
| Estado no componente errado | State que muda frequentemente em componente pai que nao precisa dele | Cascata de re-renders |
| Context sem split | Um unico Context com muitos valores; qualquer mudanca re-renderiza todos consumers | Todos consumers re-renderizam |
| Falta de memoizacao em computacoes caras | `.filter().map().sort()` em listas grandes sem `useMemo` | Recalculo a cada render |
| Keys instavel em listas | `key={Math.random()}` ou `key={index}` em listas dinamicas | Remonta componentes inteiros |
| useEffect sem cleanup | Subscricoes, timers, event listeners sem return de cleanup | Memory leaks progressivos |
| Prop drilling profundo | Props passadas por 4+ niveis sem Context/store | Fragilidade + re-renders cascata |

**Ferramentas tradicionais:**
- `eslint-plugin-react-hooks` (exhaustive-deps, rules-of-hooks) -- HIGH confidence
- `eslint-plugin-react-compiler` (React 19+) -- detecta onde memoizacao manual e desnecessaria -- HIGH confidence
- RenderGuard (VS Code extension) -- surface performance patterns para review -- MEDIUM confidence

**O que o LLM detecta que ferramentas nao detectam:**
- Estado no componente errado (requer entendimento de hierarquia)
- Context que deveria ser splitado (requer entendimento semantico dos valores)
- Componentes que deveriam ser lazy-loaded por uso infrequente
- Prop drilling que deveria ser Context (requer entendimento do fluxo de dados)

### 1.2 Bundle Size e Code Splitting

**Confianca:** HIGH (ecossistema maduro de ferramentas)

| Padrao Detectavel | O Que Procurar | Impacto |
|-------------------|----------------|---------|
| Import estatico de rota/pagina | `import HeavyPage from './HeavyPage'` em routes | Tudo no bundle inicial |
| Biblioteca importada inteira | `import _ from 'lodash'` vs `import get from 'lodash/get'` | KB a mais no bundle |
| Dependencia pesada sem alternativa | `moment.js` (329KB) vs `dayjs` (7KB) | Bundle inflado |
| Falta de dynamic import | Modais, drawers, tabs secundarias importadas estaticamente | Bundle inicial desnecessariamente grande |
| CSS importado globalmente | `import './styles.css'` no root que afeta tudo | Bloqueio de render |
| Polyfills desnecessarios | Babel configs com targets antigos demais | Codigo morto no bundle |

**Ferramentas tradicionais:**
- `webpack-bundle-analyzer` / `vite-bundle-analyzer` -- visualizacao de bundle -- HIGH confidence
- `bundle-stats` (relative-ci) -- comparacao entre builds para webpack/vite/rollup/rolldown -- HIGH confidence
- `rollup-plugin-visualizer` -- treemap do bundle -- HIGH confidence
- `bundlephobia.com` -- tamanho de pacotes npm antes de instalar -- HIGH confidence
- `import-cost` (extensao VS Code) -- mostra tamanho inline -- MEDIUM confidence

**O que o LLM detecta que ferramentas nao detectam:**
- Rotas/paginas que deveriam ser lazy mas nao sao (requer entendimento do router)
- Bibliotecas com alternativas mais leves (requer conhecimento do ecossistema)
- CSS que poderia ser colocated por componente em vez de global
- Imports condicionais que poderiam ser dinâmicos

### 1.3 Imagens e Assets

**Confianca:** HIGH (Next.js, Nuxt, SvelteKit todos documentam isso)

| Padrao Detectavel | O Que Procurar | Impacto |
|-------------------|----------------|---------|
| `<img>` sem width/height | Tag img sem dimensoes explicitas | Layout shift (CLS) |
| `<img>` sem lazy loading | Imagens abaixo do fold sem `loading="lazy"` | Carregamento desnecessario |
| Falta de srcset/sizes | Imagem unica para todos tamanhos de tela | Bytes desperdecados em mobile |
| Formato nao-otimizado | `.png`/`.jpg` em vez de `.webp`/`.avif` | 30-80% maior que necessario |
| Imagem servida sem CDN/otimizador | URLs apontando para `/public/` diretamente | Sem compressao/resize automatico |
| Icones como imagem | Icones PNG/JPG em vez de SVG ou icon font | Requisicoes HTTP extras, nao escala |
| Framework image component nao usado | `<img>` em vez de `<Image>` (Next.js), `<NuxtImg>` etc. | Perde otimizacoes automaticas |

**Ferramentas tradicionais:**
- `@next/eslint-plugin-next` -- detecta `<img>` vs `<Image>` -- HIGH confidence
- Lighthouse CI (configuravel como step de build) -- HIGH confidence

### 1.4 CSS e Performance de Renderizacao

**Confianca:** HIGH (Stylelint e analyze-css bem documentados)

| Padrao Detectavel | O Que Procurar | Impacto |
|-------------------|----------------|---------|
| Seletores excessivamente especificos | `.a .b .c .d .e {}` (5+ niveis) | Tempo de matching do browser |
| `*` como seletor descendente | `.container * {}` | Avalia TODOS os elementos |
| `!important` excessivo | Mais de 5-10 ocorrencias no projeto | Guerra de especificidade, CSS fragil |
| CSS nao utilizado | Seletores sem match no HTML/JSX | Bytes mortos, bloqueio de render |
| Animacoes em propriedades caras | `animate: width, height, top, left` | Triggers layout recalc (nao GPU) |
| Falta de `will-change` em animacoes | Animacoes frequentes sem hint para GPU | Jank visual |
| Media queries duplicadas | Mesma breakpoint em 10+ arquivos | CSS inflado |
| Fontes web sem preload/display | `@font-face` sem `font-display: swap` | FOIT (Flash of Invisible Text) |

**Ferramentas tradicionais:**
- Stylelint -- 150+ regras de lint CSS -- HIGH confidence
- `stylelint-no-unused-selectors` -- detecta seletores mortos -- MEDIUM confidence
- `analyze-css` (macbre/analyze-css) -- complexidade e performance de seletores -- MEDIUM confidence
- UnCSS / PurgeCSS -- remove CSS nao utilizado -- HIGH confidence
- CSS Stats / Project Wallace -- metricas de qualidade CSS -- MEDIUM confidence

---

## 2. Backend: Padroes de Performance Detectaveis por Codigo

### 2.1 Queries e Banco de Dados

**Confianca:** HIGH (N+1 e o problema de performance mais documentado)

| Padrao Detectavel | O Que Procurar no Codigo | Impacto |
|-------------------|--------------------------|---------|
| N+1 queries | Loop com query dentro (`users.forEach(u => getOrders(u.id))`) | Latencia multiplicada |
| SELECT * | `SELECT *` ou ORM sem `.select()` | Dados desnecessarios trafegados |
| Falta de paginacao | Query sem LIMIT/OFFSET ou cursor | Memoria e latencia em tabelas grandes |
| Index missing hints | WHERE/ORDER BY em colunas sem index (schema analysis) | Full table scan |
| Eager loading excessivo | `include: [{all: true}]` carregando relacoes nao usadas | Queries enormes desnecessarias |
| Query em loop de request | Query executada a cada request sem cache | DB sobrecarregado |
| Transacoes longas | Transacao com await de API externa dentro | Lock contention |
| String concatenation em SQL | Template literals em queries raw | SQL injection + sem query plan cache |

**Ferramentas tradicionais (runtime, nao estaticas):**
- Prisma: `@prisma/internals` com query logging -- requer execucao
- TypeORM: logging de queries -- requer execucao
- Sentry: detecta missing indexes em queries reais -- requer execucao

**O que o LLM detecta por analise estatica (sem rodar):**
- Loops com queries ORM dentro (padrao N+1) -- regex/AST pattern
- `.findAll()` sem `.select()` ou sem `attributes` -- regex pattern
- Queries sem `.limit()` ou `.take()` -- regex pattern
- `include` com relacoes que nao sao usadas no codigo subsequente -- analise semantica
- Schema sem indexes em colunas usadas em WHERE -- correlacao entre schema e queries

### 2.2 Caching e Rede

**Confianca:** MEDIUM (depende muito do framework/stack)

| Padrao Detectavel | O Que Procurar | Impacto |
|-------------------|----------------|---------|
| Falta de Cache-Control headers | Respostas de API sem headers de cache | Re-fetch desnecessario |
| Falta de ETag/Last-Modified | Endpoints GET sem conditional headers | Sem 304, sempre 200 |
| Fetch sem cache em SSR/SSG | `fetch()` em getServerSideProps sem `{cache: ...}` | Re-fetch a cada request |
| API sem rate limiting | Endpoints publicos sem throttle | Vulneravel a abuso |
| Chamadas sequenciais paralelizaveis | `await a(); await b();` que poderiam ser `Promise.all` | Latencia somada |
| Requisicoes duplicadas | Mesmo endpoint chamado em componentes irmaos | Rede desperdicada |
| Falta de connection pooling | `new Pool()` dentro de handler vs modulo compartilhado | Overhead de conexao (30-45ms) |

**O que o LLM detecta por analise estatica:**
- `await` sequencial que poderia ser `Promise.all` -- padrao sintatico claro
- Ausencia de headers de cache em rotas de API -- inspecao de middleware/handlers
- Pool criado dentro de funcao vs export de modulo -- padrao estrutural
- fetch sem options de cache em frameworks com SSR -- padrao sintatico

### 2.3 Node.js Especifico

**Confianca:** HIGH (padroes bem conhecidos)

| Padrao Detectavel | O Que Procurar | Impacto |
|-------------------|----------------|---------|
| `fs.readFileSync` em handler | Leitura sincrona bloqueando event loop | Throughput destruido |
| JSON.parse de payload grande | Parse sincrono de JSONs grandes sem streaming | Event loop blocked |
| Crypto sincrono | `crypto.pbkdf2Sync` em vez de async | Bloqueia por 50-100ms |
| Regex catastrofico | Patterns como `(a+)+` | ReDoS, event loop travado |
| Buffer grande sem stream | `Buffer.concat` de arquivo inteiro vs pipeline de streams | Pico de memoria |
| require() condicional | `require()` dentro de if/function (nao no top-level) | Cold start lento |
| Process.env em hot path | `process.env.X` dentro de loop tight | Lookup de string repetido |

---

## 3. Analise de Dependencias

### 3.1 Ferramentas de Analise

**Confianca:** HIGH (Knip e Depcheck amplamente adotados)

| Ferramenta | O Que Faz | Quando Usar |
|------------|-----------|-------------|
| **Knip** | Detecta deps, exports e arquivos nao utilizados. 100+ plugins (Next.js, Vite, Jest, etc.) | Projetos maduros. Substitui depcheck. |
| **depcheck** | Detecta deps nao utilizadas no package.json | Projetos pequenos/early-stage |
| **npm-check** | Deps desatualizadas + nao utilizadas | Legacy, usar Knip em vez disso |
| **unimported** | Arquivos orfaos e deps nao utilizadas | Alternativa a Knip |
| **ts-prune** | Exports TypeScript nao utilizados | Complementar a Knip |
| **bundlephobia** | Tamanho de pacotes npm (minified + gzipped) | Avaliar antes de instalar |
| **packagephobia** | Tamanho de instalacao no disco | Avaliar impacto em CI/CD |
| **import-cost** | Mostra tamanho inline no editor | Feedback em tempo de dev |

**Recomendacao:** Use **Knip** porque e o mais abrangente (deps + exports + arquivos), tem 100+ plugins para frameworks, e o mais ativamente mantido. Depcheck e um subconjunto funcional do Knip.

### 3.2 Padroes Detectaveis por LLM

| Padrao | O Que Procurar | Impacto |
|--------|----------------|---------|
| Deps pesadas com alternativa leve | moment.js -> dayjs, lodash -> lodash-es/nativas, axios -> fetch nativo | Bundle size |
| Deps duplicadas | lodash + underscore, date-fns + dayjs + moment | Codigo redundante |
| Deps sem tree-shaking | CJS-only em projeto ESM (sem sideEffects: false) | Nao faz dead code elimination |
| devDeps em dependencies | Testing libs em dependencies em vez de devDependencies | Bundle de producao inflado |
| Deps com vulnerabilidades | CVEs conhecidos (verificavel via `npm audit`) | Seguranca + updates forcados |
| Polyfills desnecessarios | core-js, babel-polyfill em projeto com targets modernos | Bytes mortos |
| Deps de tipagem misturadas | @types/ em dependencies (deveria ser devDependencies) | Bundle inflado |

### 3.3 Substituicoes Comuns (Catalogo de Referencia)

| Dep Pesada | Tamanho (min+gz) | Alternativa Leve | Tamanho (min+gz) | Reducao |
|------------|-----------------|-------------------|------------------|---------|
| moment | ~72KB | dayjs | ~3KB | 96% |
| lodash (full) | ~72KB | lodash-es (cherry-pick) | ~1-5KB (por funcao) | 93%+ |
| axios | ~14KB | fetch nativo | 0KB | 100% |
| uuid | ~3KB | crypto.randomUUID() | 0KB | 100% |
| classnames | ~1KB | clsx | ~0.5KB | 50% |
| numeral | ~17KB | Intl.NumberFormat | 0KB | 100% |
| chalk (CLI) | ~40KB | picocolors | ~3KB | 92% |
| request | ~500KB | undici / fetch | 0KB (nativo) | 100% |
| express-validator | ~36KB | zod | ~14KB | 61% |

**Confianca:** MEDIUM (tamanhos mudam entre versoes; verificar com bundlephobia no momento da auditoria)

---

## 4. Padroes Detectaveis por LLMs sem Rodar a App

### 4.1 Vantagem Unica do LLM sobre Ferramentas Tradicionais

**Confianca:** MEDIUM-HIGH (baseado em estudos de code review por LLM + pratica)

Ferramentas tradicionais (ESLint, Stylelint, Knip) operam com **regras fixas** -- pattern matching sintatico. O LLM agrega valor em 3 dimensoes que ferramentas nao alcancam:

**Dimensao 1: Analise Semantica Cross-File**
- Detectar que um componente faz fetch duplicado porque dois componentes-irmaos chamam o mesmo endpoint
- Identificar que um estado deveria estar em Context porque 4 componentes acessam o mesmo dado
- Perceber que uma rota nunca e acessada diretamente (candidata a lazy load)

**Dimensao 2: Analise Arquitetural**
- Componente de 500+ linhas que deveria ser splitado
- Handler de API que faz query + transformacao + validacao + resposta (responsabilidade unica)
- Middleware duplicado entre rotas que deveria ser extraido

**Dimensao 3: Analise de Configuracao**
- `tsconfig.json` com target antigo gerando polyfills desnecessarios
- Webpack/Vite config sem split de vendor chunks
- Next.js sem `images.remotePatterns` configurado
- Docker multi-stage sem layer caching otimizado
- `.browserslistrc` incluindo IE11 em 2026

### 4.2 Catalogo Completo de Padroes para o Agente

Organizados por o que o agente deve procurar ao analisar cada arquivo:

**Em arquivos .tsx/.jsx/.vue/.svelte (componentes):**
1. Funcoes inline em props de componentes filhos memoizados
2. Objetos/arrays literais criados no render
3. useEffect sem array de dependencias (roda a cada render)
4. useEffect com deps que mudam a cada render (objeto/funcao)
5. useState onde useRef bastaria (valor nao precisa re-render)
6. Componente que recebe props demais (candidato a composicao)
7. Listas sem key ou com key instavel
8. Import estatico de componente pesado que poderia ser lazy
9. Fetch/query sem tratamento de loading/error states
10. Event handlers que nao fazem debounce/throttle (scroll, resize, input)

**Em arquivos de rotas/paginas:**
11. Todas as rotas importadas estaticamente (sem code splitting)
12. Pagina com dados estaticos usando SSR em vez de SSG
13. getServerSideProps sem revalidate/cache
14. Layout component refetchando dados que sao estaticos

**Em arquivos de API/handlers/controllers:**
15. Queries em loop (N+1)
16. SELECT * ou findAll sem select/attributes
17. Falta de paginacao em endpoints de listagem
18. await sequencial paralelizavel
19. Falta de cache headers em respostas GET
20. try-catch generico sem logging especifico
21. Validacao de input apos query (deveria ser antes)

**Em arquivos de configuracao:**
22. Bundle targets antigos demais (`.browserslistrc`, `tsconfig.json`)
23. Source maps em producao (devtool em webpack/vite config)
24. Falta de compression middleware (gzip/brotli)
25. Falta de security headers (nao e performance, mas merece flag)

**Em package.json / deps:**
26. Deps pesadas com alternativas leves (catalogo acima)
27. Deps duplicadas em funcionalidade
28. devDependencies que deveriam estar em dependencies (ou vice-versa)
29. Scripts sem flag de producao (`NODE_ENV=production`)
30. Engine/volta nao especificados (versao de Node inconsistente)

**Em CSS/SCSS:**
31. Seletores com 4+ niveis de aninhamento
32. `!important` em mais de 5 lugares
33. Animacoes em propriedades que trigaram layout (width, height, top, left)
34. `@import` em CSS (bloqueante; deveria ser consolidado)
35. Fontes sem `font-display: swap`
36. Media queries duplicadas

---

## 5. Formato de Output para Relatorio de Performance

### 5.1 Formato Recomendado por Sugestao

Alinhado com o requisito MELH-05 do PROJECT.md (arquivo, linha, problema, sugestao, esforco, impacto):

```markdown
### [PERF-001] Funcoes inline em props memoizadas

| Campo | Valor |
|-------|-------|
| **Arquivo** | `src/components/UserList.tsx` |
| **Linha** | 45-48 |
| **Categoria** | Re-render |
| **Severidade** | MEDIA |
| **Problema** | Funcao `onClick={() => handleSelect(user.id)}` cria nova referencia a cada render, invalidando memoizacao do componente `UserCard` |
| **Sugestao** | Extrair para `useCallback` ou mover handler para dentro de `UserCard` |
| **Esforco** | Baixo (5 min) |
| **Impacto** | Medio (reduz re-renders em lista de N itens) |
```

### 5.2 Categorias de Severidade

| Severidade | Criterio | Exemplo |
|------------|----------|---------|
| **CRITICA** | Impacto mensuravel em todos os usuarios; degradacao linear ou exponencial | N+1 query em endpoint principal, readFileSync em handler |
| **ALTA** | Impacto notavel; afeta carregamento inicial ou interacoes frequentes | Bundle sem code splitting, imagens sem lazy loading |
| **MEDIA** | Impacto real mas localizado; afeta cenarios especificos | Re-renders em lista de 50+ items, CSS pesado em mobile |
| **BAIXA** | Melhoria marginal; boas praticas sem impacto perceptivel | `!important` em poucos lugares, import order subotimo |
| **INFO** | Sugestao de modernizacao; sem impacto atual | Migrar de moment para dayjs, usar fetch nativo |

### 5.3 Agrupamento por Categoria para Visao Geral

```markdown
## Sumario de Performance

| Categoria | Critica | Alta | Media | Baixa | Info | Total |
|-----------|---------|------|-------|-------|------|-------|
| Re-renders | 0 | 2 | 5 | 1 | 0 | 8 |
| Bundle Size | 1 | 3 | 0 | 0 | 2 | 6 |
| Queries/DB | 2 | 1 | 0 | 0 | 0 | 3 |
| Assets | 0 | 1 | 3 | 0 | 0 | 4 |
| CSS | 0 | 0 | 2 | 3 | 0 | 5 |
| Rede/Cache | 0 | 1 | 1 | 0 | 0 | 2 |
| Config | 0 | 0 | 1 | 2 | 1 | 4 |
| Deps | 0 | 1 | 0 | 0 | 3 | 4 |
| **Total** | **3** | **9** | **12** | **6** | **6** | **36** |
```

### 5.4 Matriz Esforco x Impacto (Alinhado com MELH-06)

```
            | Impacto Alto      | Impacto Baixo
------------|-------------------|------------------
Esforco     | QUICK WINS        | NICE TO HAVE
Baixo       | (fazer primeiro)  | (backlog)
------------|-------------------|------------------
Esforco     | PROJETOS          | EVITAR
Alto        | (planejar fase)   | (nao vale o custo)
```

Cada sugestao deve ser classificada em um dos 4 quadrantes. O relatorio lista os QUICK WINS primeiro -- sao as sugestoes que geram mais valor com menos esforco.

---

## 6. Estrategia de Implementacao para o Agente UP

### 6.1 O Que o Agente de Performance Deve Fazer

1. **Receber lista de arquivos** do mapa de cobertura (mapear-codigo)
2. **Classificar cada arquivo** por tipo (componente, pagina/rota, API handler, config, CSS, schema)
3. **Aplicar catalogo de padroes** relevantes ao tipo do arquivo
4. **Gerar sugestoes estruturadas** no formato MELH-05
5. **Classificar severidade** usando criterios da secao 5.2
6. **Posicionar na matriz esforco x impacto** usando criterios da secao 5.4
7. **Gerar sumario** com contagem por categoria

### 6.2 Divisao de Trabalho com Outros Agentes de Dimensao

| Agente | Foco | Interseccao com Performance |
|--------|------|-----------------------------|
| **Performance** (este) | Bundle, re-renders, queries, cache, deps | Foco principal |
| **UX/Navegabilidade** | Fluxos, feedback, formularios | Loading states, skeleton screens, perceived performance |
| **Modernidade** | Deps desatualizadas, padroes antigos | Deps pesadas vs leves, APIs modernas vs polyfills |

**Interseccoes a resolver no Sintetizador:**
- "Dep desatualizada" (modernidade) pode ser tambem "dep pesada" (performance) -- o sintetizador deve consolidar, nao duplicar
- "Falta de loading state" e UX, mas "falta de Suspense" e performance -- o sintetizador deve cruzar
- "CSS complexo" pode ser modernidade (usar CSS modules) e performance (seletores pesados) -- o sintetizador decide a categoria primaria

### 6.3 Heuristicas de Priorizacao para o LLM

O agente deve priorizar a analise de:
1. **Paginas/rotas** -- impacto em carregamento inicial (First Contentful Paint)
2. **Componentes em listas** -- multiplicam problemas por N
3. **API handlers** -- impactam TTFB de toda a app
4. **package.json + configs** -- impacto global, facil de auditar
5. **CSS global** -- impacto em todo render
6. **Componentes unitarios** -- menor prioridade, impacto localizado

---

## 7. React Compiler e Implicacoes para Auditoria

**Confianca:** HIGH (React Compiler 1.0 lancado em outubro 2025)

O React Compiler 1.0 automatiza memoizacao, tornando `useMemo`, `useCallback` e `React.memo` manuais potencialmente desnecessarios. Isso muda a auditoria de performance:

**Antes do React Compiler:**
- Detectar falta de `useMemo`/`useCallback` era finding de performance
- Prop drilling com objetos novos a cada render era finding critico

**Depois do React Compiler:**
- O compilador memoiza automaticamente (ate 12% ganho, 2.5x mais rapido em interacoes)
- Findings devem focar em: o projeto esta usando o compiler? Se nao, por que?
- `eslint-plugin-react-no-manual-memo` sinaliza memoizacao manual desnecessaria
- Padroes que o compiler NAO resolve: N+1 queries, lazy loading de rotas, bundle splitting, cache headers

**Recomendacao para o agente:** Verificar se o projeto usa React Compiler. Se sim, reduzir severidade de findings de re-render. Se nao, sugerir adocao como quick win de alto impacto.

---

## 8. Fontes e Confianca

### Fontes Primarias (HIGH confidence)
- [React Compiler 1.0 -- Blog Oficial](https://react.dev/blog/2025/10/07/react-compiler-1)
- [eslint-plugin-react-hooks -- React Oficial](https://react.dev/reference/eslint-plugin-react-hooks)
- [Next.js ESLint Config](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Knip -- Docs Oficiais](https://knip.dev/)
- [Stylelint -- Docs Oficiais](https://stylelint.io/)
- [Lighthouse CI -- GitHub](https://github.com/GoogleChrome/lighthouse-ci)
- [webpack-bundle-analyzer -- npm](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [Bundlephobia](https://bundlephobia.com)
- [depcheck -- GitHub](https://github.com/depcheck/depcheck)
- [analyze-css -- GitHub](https://github.com/macbre/analyze-css)
- [web.dev Performance Budgets](https://web.dev/articles/incorporate-performance-budgets-into-your-build-tools)

### Fontes Secundarias (MEDIUM confidence)
- [RenderGuard -- VS Code Extension](https://renderguard.dev/)
- [Frontend Performance Checklist 2025 -- Strapi](https://strapi.io/blog/frontend-performance-checklist)
- [React Performance Optimization 2025 -- Growin](https://www.growin.com/blog/react-performance-optimization-2025/)
- [N+1 Query Problem -- Digma](https://digma.ai/n1-query-problem-and-how-to-detect-it/)
- [SQL Static Analysis Tools](https://analysis-tools.dev/tag/sql)
- [CSS Static Analysis Tools](https://analysis-tools.dev/tag/css)
- [Bundle Size Investigation -- developerway.com](https://www.developerway.com/posts/bundle-size-investigation)
- [Addy Osmani LLM Coding Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/)
- [AI Code Review Limitations -- ProjectDiscovery](https://projectdiscovery.io/blog/ai-code-review-vs-neo)

### Verificacao Cruzada
- React Compiler v1.0: confirmado por blog oficial React + InfoQ + Expo docs (3 fontes)
- Knip como substituto de depcheck: confirmado por Smashing Magazine + docs Knip + npm-compare (3 fontes)
- N+1 detectavel por analise estatica: confirmado por multiplas fontes (padrao sintatico claro -- loop com query)
- Tamanhos de deps: verificaveis em tempo real via bundlephobia (valores neste doc sao aproximados)

---

## 9. Lacunas e Questoes Abertas

| Lacuna | Impacto | Mitigacao |
|--------|---------|-----------|
| Tamanhos de deps mudam entre versoes | Catalogo de substituicoes pode ficar desatualizado | Verificar com bundlephobia no momento da auditoria |
| Deteccao de N+1 por LLM nao e 100% | Alguns padroes ORM sao complexos demais para regex | LOW confidence em padroes ORM encadeados; sinalize como "verificar manualmente" |
| React Compiler nao disponivel para todos | Projetos sem React 19+ nao se beneficiam | Detectar versao do React no package.json antes de recomendar |
| Performance de CSS e altamente contextual | Seletores "pesados" podem ser negligiveis em DOMs pequenos | Calibrar severidade pelo tamanho estimado do DOM |
| LLM pode gerar falsos positivos | Memoizacao desnecessaria, "otimizacoes" que pioram legibilidade | Cada sugestao deve incluir trade-off de legibilidade |

---

## 10. Implicacoes para o Roadmap

1. **Catalogo de padroes e o ativo central** -- o agente de performance precisa de um catalogo estruturado de 30-36 padroes (secao 4.2) que ele consulta ao analisar cada arquivo. Este catalogo pode ser um reference doc em `up/references/`.

2. **Formato de output deve ser padronizado** -- o formato MELH-05 (secao 5.1) deve ser identico entre todos os agentes de dimensao para que o sintetizador possa agregar e deduplicar.

3. **Classificacao por tipo de arquivo simplifica o agente** -- em vez de analisar tudo de uma vez, o agente classifica arquivos e aplica subconjuntos do catalogo por tipo.

4. **React Compiler muda a estrategia** -- verificar a versao do React antes de emitir findings de memoizacao. Isso deve ser um pre-check do agente.

5. **Matriz esforco x impacto e o deliverable mais valioso** -- usuarios querem saber "o que faço primeiro?", nao "quantos problemas tenho?". QUICK WINS primeiro.

6. **Dependencias sao o finding mais acionavel** -- trocar moment por dayjs e uma mudanca clara, mensuravel, sem risco. Priorizar deps no relatorio.
