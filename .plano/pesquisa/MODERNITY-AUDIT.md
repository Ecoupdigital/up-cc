# Pesquisa: Auditoria de Modernidade por Analise Estatica de Codigo

**Dominio:** Deteccao automatica de "divida de modernidade" em projetos JavaScript/TypeScript
**Pesquisado:** 2026-03-09
**Confianca geral:** HIGH (multiplas ferramentas verificadas com docs oficiais e fontes cruzadas)

---

## 1. Sumario Executivo

A auditoria de modernidade e o processo de detectar automaticamente bibliotecas desatualizadas, padroes obsoletos de codigo, configuracoes de compatibilidade excessivas e oportunidades de modernizacao. O ecossistema de ferramentas para isso e maduro e bem segmentado: existem ferramentas especializadas para cada dimensao (dependencias, padroes de codigo, compatibilidade, codigo morto) mas nenhuma que unifique tudo em um relatorio coerente -- exatamente a lacuna que o agente de modernidade do UP pretende preencher.

A abordagem mais eficaz combina tres camadas: (1) analise de `package.json` e lock files para dependencias desatualizadas/deprecadas/abandonadas, (2) analise de AST/padroes de codigo via regras ESLint e deteccao por LLM para identificar padroes obsoletos, e (3) analise de configuracoes de compatibilidade (browserslist, polyfills, engines) para identificar suporte excessivo a ambientes ultrapassados.

O diferencial que LLMs trazem sobre ferramentas tradicionais e a capacidade de entender *intencao* e *contexto*: um LLM pode reconhecer que `moment.js` esta sendo usado apenas para formatacao simples de datas (substituivel por `Intl.DateTimeFormat` nativo) enquanto ferramentas tradicionais apenas reportariam "pacote desatualizado". Essa analise contextual e o que transforma uma lista de warnings em sugestoes acionaveis com estimativa de esforco.

## 2. Ferramentas para Deteccao de Dependencias Desatualizadas

### 2.1 npm-check-updates (ncu)
**Confianca:** HIGH (docs oficiais, 19.6.x publicado 2026)

Ferramenta padrao para encontrar versoes mais recentes de dependencias. Escaneia `package.json` e identifica pacotes com versoes novas disponiveis.

| Aspecto | Detalhe |
|---------|---------|
| **Comando** | `npx npm-check-updates` |
| **Output** | Lista de pacotes com versao atual vs ultima |
| **Classificacao** | Major (breaking), minor, patch |
| **Integracao** | CLI, pode atualizar package.json automaticamente |
| **Limitacao** | Nao sabe se a atualizacao vai quebrar algo; nao detecta deprecacao |

**Uso para o agente UP:** Rodar `npx npm-check-updates --jsonUpgraded` para obter JSON estruturado com todas as dependencias desatualizadas. Classificar por tipo de update (major = risco alto, minor = risco medio, patch = risco baixo).

### 2.2 depcheck
**Confianca:** HIGH (docs oficiais npm)

Analisa quais dependencias sao realmente usadas no codigo e quais sao "fantasmas" (listadas no package.json mas nunca importadas).

| Aspecto | Detalhe |
|---------|---------|
| **Comando** | `npx depcheck` |
| **Output** | Dependencias nao usadas, dependencias faltando |
| **Valor** | Identifica bloat de dependencias |
| **Limitacao** | Falsos positivos com configs (plugins de webpack, preset de babel, etc.) |

### 2.3 Knip
**Confianca:** HIGH (docs oficiais, amplamente adotado -- usado pela Vercel para deletar ~300k linhas)

Ferramenta moderna que vai alem do depcheck: encontra dependencias nao usadas, exports nao usados, arquivos mortos, e tipos nao usados.

| Aspecto | Detalhe |
|---------|---------|
| **Comando** | `npx knip` |
| **Output** | Dependencias, exports, arquivos e tipos nao usados |
| **Diferencial** | Cria grafo de uso do codigo; detecta exports nao consumidos |
| **Fix automatico** | `npx knip --fix` remove dependencias nao usadas do package.json |
| **Limitacao** | Requer config para projetos com plugins/configs incomuns |

**Recomendacao:** Use Knip como ferramenta primaria para codigo morto e dependencias fantasma. Superou depcheck em cobertura e precisao.

### 2.4 npm-deprecated-check
**Confianca:** MEDIUM (fonte unica, mas funcionalidade verificavel)

Verifica se pacotes do projeto estao marcados como deprecated no registro npm.

| Aspecto | Detalhe |
|---------|---------|
| **Comando** | `npx npm-deprecated-check` |
| **Alternativa manual** | `npm view <pacote>@<versao> deprecated` |
| **Dado do lockfile** | `package-lock.json` (lockfileVersion >= 2) contem campo `deprecated` |

### 2.5 npm outdated (built-in)
**Confianca:** HIGH (ferramenta oficial do npm)

Comando nativo do npm que mostra dependencias com versoes mais recentes.

| Aspecto | Detalhe |
|---------|---------|
| **Comando** | `npm outdated` ou `npm outdated --json` |
| **Output** | Tabela com current, wanted, latest para cada pacote |
| **Diferencial** | Ja instalado, zero config |

### 2.6 Deteccao de Pacotes Abandonados
**Confianca:** MEDIUM (criterios variam por ferramenta)

Nao ha um padrao unico para "abandonado". Criterios praticos que o agente UP pode usar:

| Criterio | Indicador de Risco | Como Detectar |
|----------|-------------------|---------------|
| Ultimo publish > 3 anos | Alto | `npm view <pkg> time.modified` |
| Repositorio arquivado | Alto | GitHub API / `npm view <pkg> repository` |
| Autor inexistente no npm | Critico | Socket.dev flageia automaticamente |
| Zero commits ultimo ano | Medio | GitHub API |
| Issues abertas sem resposta > 1 ano | Medio | GitHub API |
| Pacote explicitamente deprecated | Critico | `npm view <pkg> deprecated` |

## 3. Ferramentas para Deteccao de Padroes Obsoletos de Codigo

### 3.1 ESLint -- Regras para Modernidade
**Confianca:** HIGH (docs oficiais, v10.0.0 lancado fev/2026)

ESLint e a base para deteccao de padroes obsoletos via regras configuradas. Regras relevantes para modernidade:

**Regras built-in:**
| Regra | Detecta | Alternativa Moderna |
|-------|---------|-------------------|
| `no-var` | `var` declarations | `const`/`let` |
| `prefer-const` | `let` nao reatribuido | `const` |
| `prefer-arrow-callback` | `function()` em callbacks | Arrow functions |
| `prefer-template` | Concatenacao de string | Template literals |
| `prefer-destructuring` | Acesso por indice/propriedade | Destructuring |
| `prefer-rest-params` | `arguments` object | Rest parameters |
| `prefer-spread` | `.apply()` | Spread operator |
| `prefer-object-spread` | `Object.assign()` | Object spread |
| `no-restricted-imports` | Imports de libs obsoletas | Configuravel |
| `no-restricted-modules` | `require()` de libs obsoletas | Configuravel |

**Plugins relevantes:**

| Plugin | Proposito | Confianca |
|--------|-----------|-----------|
| `eslint-plugin-import` (regra `no-commonjs`) | Detecta `require()` e `module.exports` | HIGH |
| `@typescript-eslint/no-require-imports` | Detecta `require()` em TS | HIGH |
| `eslint-plugin-es-x` | Detecta features ES por versao | HIGH |
| `eslint-plugin-you-dont-need-lodash-underscore` | Detecta Lodash usado onde nativo resolve | MEDIUM |
| `eslint-plugin-you-dont-need-momentjs` | Detecta Moment.js substituivel | MEDIUM |

### 3.2 Biome (alternativa moderna ao ESLint)
**Confianca:** MEDIUM (v2.0 jun/2025, ecossistema mais jovem)

Biome e 10-25x mais rapido que ESLint + Prettier, escrito em Rust. Unifica linting e formatacao. Porem, para analise de modernidade, ESLint tem cobertura superior de plugins e regras customizaveis. Biome e relevante como *sugestao de modernizacao* do tooling, nao como ferramenta de auditoria.

### 3.3 Padroes Obsoletos Conhecidos (Catalogo para o LLM)

O agente UP deve ter um catalogo de padroes obsoletos para guiar a analise por LLM:

| Padrao Obsoleto | Alternativa Moderna | Desde Quando | Esforco Migracao |
|----------------|--------------------|--------------|--------------------|
| `var` | `const`/`let` | ES2015 | Baixo (automatizavel) |
| Callbacks aninhados | `async`/`await` | ES2017 | Medio |
| `require()`/`module.exports` | `import`/`export` (ESM) | ES2015 (estavel Node 16+) | Alto (requer mudanca de config) |
| `jQuery` | APIs nativas (querySelector, fetch) | ~2018 | Alto |
| `moment.js` | `date-fns`, `dayjs`, `Temporal API` | 2020 (deprecated oficialmente) | Medio |
| `lodash` (utilitarios simples) | ES6+ nativos (`map`, `filter`, spread) | ES2015+ | Baixo a medio |
| `lodash` (utilitarios complexos) | `es-toolkit` | 2024 | Medio |
| `request` (HTTP) | `fetch` nativo, `undici` | 2020 (deprecated) | Medio |
| `axios` (casos simples) | `fetch` nativo | Node 18+ / browsers modernos | Baixo |
| `.then().catch()` | `async`/`await` | ES2017 | Baixo a medio |
| `Object.assign()` | Spread operator `{...obj}` | ES2018 | Baixo (automatizavel) |
| `arguments` | Rest parameters `...args` | ES2015 | Baixo (automatizavel) |
| `.apply()` | Spread `fn(...args)` | ES2015 | Baixo (automatizavel) |
| `new Promise(resolve => setTimeout(resolve, ms))` | `await scheduler.wait(ms)` ou util nativa | Node 16+ / browsers | Baixo |
| CSS Vendor prefixes manuais | Autoprefixer / PostCSS | ~2016 | Baixo |
| `@import` em CSS | CSS Modules / CSS-in-JS / bundler imports | ~2018 | Medio |
| Webpack 4 | Vite / Webpack 5 / Turbopack | 2020+ | Alto |
| Create React App (CRA) | Vite, Next.js, Remix | 2023 (CRA deprecated) | Alto |
| `componentWillMount` (React) | `useEffect` / modern lifecycle | React 16.3+ (2018) | Medio |
| Class components (React) | Function components + Hooks | React 16.8 (2019) | Medio a alto |
| `tslint` | ESLint + `@typescript-eslint` | 2019 (TSLint deprecated) | Medio |
| Node.js < 18 | Node.js 22 LTS ou 24 LTS | Continuamente | Variavel |

### 3.4 "You Don't Need" Databases
**Confianca:** HIGH (repos ativos e mantidos)

Repos de referencia que servem como banco de dados de substituicoes:

| Repositorio | Conteudo | URL |
|------------|----------|-----|
| You-Dont-Need-jQuery | APIs nativas que substituem jQuery | github.com/camsong/You-Dont-Need-jQuery |
| You-Dont-Need-Lodash-Underscore | Metodos nativos ES6+ que substituem Lodash | github.com/you-dont-need/You-Dont-Need-Lodash-Underscore |
| You-Dont-Need-Momentjs | Alternativas a Moment.js | github.com/you-dont-need/You-Dont-Need-Momentjs |

**Uso para o agente:** Esses repos servem como referencia para o LLM saber QUAIS funcoes especificas de cada lib tem equivalente nativo. O LLM pode cruzar as funcoes realmente usadas no codigo com a tabela de substituicoes.

## 4. Analise de Compatibilidade

### 4.1 Browserslist
**Confianca:** HIGH (docs oficiais)

Configuracao compartilhada de browsers-alvo entre ferramentas (Autoprefixer, Babel, PostCSS, etc.).

**Arquivo de config:** `.browserslistrc`, campo `browserslist` em `package.json`, ou `browserslist` em config de bundler.

**O que o agente deve verificar:**
| Verificacao | Problema | Sugestao |
|------------|----------|----------|
| Browserslist inclui IE 11 | Gera polyfills desnecessarios | Remover IE da lista (< 0.1% de uso global) |
| Browserslist nao atualizado | `caniuse-lite` desatualizado | Rodar `npx update-browserslist-db@latest` |
| Targets muito amplos (ex: `> 0.1%`) | Inclui browsers obscuros | Usar `defaults` ou `last 2 versions` |
| Ausencia de browserslist | Ferramentas usam defaults que podem ser amplos | Definir explicitamente |
| Inconsistencia browserslist vs engines | Babel polyfilla para IE mas Node exige 18+ | Alinhar alvos |

### 4.2 Polyfills Desnecessarios
**Confianca:** MEDIUM (abordagem inferida de multiplas fontes)

**Como detectar:**
1. Verificar `.babelrc`/`babel.config.js` para `@babel/preset-env` com targets muito amplos
2. Verificar presenca de polyfills manuais (core-js imports, polyfill.io references)
3. Verificar se `Promise`, `Array.from`, `Object.assign` polyfills ainda sao necessarios para os targets atuais
4. Verificar vendor prefixes CSS que nao sao mais necessarios

**Ferramentas auxiliares:**
- `browserslist` CLI: `npx browserslist` mostra browsers incluidos nos targets atuais
- `eslint-plugin-compat`: Valida que APIs usadas sao suportadas pelos browsers-alvo
- `@mdn/browser-compat-data`: Base de dados de compatibilidade por API

### 4.3 Node.js Engine Compatibility
**Confianca:** HIGH (nodejs.org/en/about/eol)

| Versao Node.js | Status (Marco 2026) | Acao Recomendada |
|---------------|---------------------|------------------|
| < 18 | EOL | Migrar urgentemente |
| 18.x | EOL (desde abr/2025) | Migrar para 22 ou 24 |
| 20.x | EOL em abr/2026 (iminente) | Planejar migracao |
| 22.x | Maintenance LTS (ate abr/2027) | Seguro por agora |
| 24.x | Active LTS | Recomendado |

**O que o agente deve verificar:**
- Campo `engines` em `package.json`
- Arquivo `.nvmrc` ou `.node-version`
- `FROM node:XX` em Dockerfiles
- CI/CD configs (GitHub Actions `node-version`, etc.)

## 5. Como LLMs Podem Detectar Padroes Obsoletos

### 5.1 Vantagens do LLM sobre Ferramentas Tradicionais
**Confianca:** MEDIUM (baseado em pratica emergente 2025-2026)

| Capacidade | Ferramenta Tradicional | LLM |
|-----------|----------------------|-----|
| Detectar `var` | ESLint `no-var` | Tambem, mas desnecessario |
| Entender que `moment()` e usado so para `.format('DD/MM')` | Nao (so ve import) | Sim, analisa contexto de uso |
| Sugerir `Intl.DateTimeFormat` ao inves de `date-fns` | Nao | Sim, baseado no uso real |
| Estimar esforco de migracao | Nao | Sim (por analise de spread/complexidade) |
| Detectar padrao de "wrapper desnecessario" | Nao | Sim (funcao que so faz proxy para outra) |
| Identificar abstraccoes que existem por causa de limitacoes antigas | Nao | Sim (ex: utility class que wrapeia ES5 shims) |

### 5.2 Abordagem Recomendada para o Agente UP

O agente de modernidade deve usar **analise em duas camadas:**

**Camada 1 - Ferramentas CLI (automatizada, rapida):**
```
1. npm outdated --json          -> dependencias desatualizadas
2. npm view <pkg> deprecated    -> pacotes deprecated
3. npx knip --reporter json     -> codigo morto e deps nao usadas
4. Leitura de package.json      -> versoes, engines, browserslist
5. Leitura de configs           -> .babelrc, .browserslistrc, tsconfig
```

**Camada 2 - Analise por LLM (contextual, profunda):**
```
Para cada arquivo relevante:
1. Identificar imports de libs conhecidamente obsoletas
2. Analisar COMO a lib e usada (nao apenas QUE e usada)
3. Verificar se uso real tem equivalente nativo
4. Estimar complexidade de migracao baseado no spread de uso
5. Detectar padroes de codigo obsoletos (callbacks, var, etc.)
6. Identificar abstraccoes que existem por limitacoes historicas
```

### 5.3 Prompt Engineering para Deteccao de Modernidade

O agente deve receber como contexto:
1. **Catalogo de padroes obsoletos** (secao 3.3 acima)
2. **Dados da Camada 1** (output das ferramentas CLI)
3. **Codigo fonte** dos arquivos a analisar
4. **Configuracoes** do projeto (tsconfig, babel, browserslist)

E deve produzir para cada encontro:
- Arquivo e linhas afetadas
- Padrao obsoleto encontrado
- Alternativa moderna recomendada
- Esforco estimado (P/M/G)
- Impacto da migracao (breaking change? melhoria de bundle? DX?)

## 6. Formato Estruturado para Relatorio de Modernidade

### 6.1 Estrutura do Relatorio

```markdown
# Relatorio de Modernidade

**Projeto:** [nome]
**Data:** [data]
**Score de Modernidade:** [0-100]

## Resumo
| Dimensao | Score | Issues | Criticas |
|----------|-------|--------|----------|
| Dependencias | XX/100 | N | N |
| Padroes de Codigo | XX/100 | N | N |
| Compatibilidade | XX/100 | N | N |
| Tooling | XX/100 | N | N |

## Dependencias Desatualizadas
| Pacote | Versao Atual | Ultima | Tipo Update | Status | Alternativa | Esforco |
|--------|-------------|--------|-------------|--------|-------------|---------|
| moment | 2.29.4 | 2.30.1 | minor | deprecated | date-fns 4.x | Medio |

## Padroes Obsoletos Detectados
| Arquivo | Linha(s) | Padrao | Alternativa | Esforco | Impacto |
|---------|----------|--------|-------------|---------|---------|
| src/utils.js | 12-45 | callbacks aninhados | async/await | Medio | DX |

## Compatibilidade
| Config | Valor Atual | Recomendado | Impacto |
|--------|------------|-------------|---------|
| browserslist | > 0.5% | defaults | Remove polyfills IE |

## Codigo Morto
| Tipo | Quantidade | Acao |
|------|-----------|------|
| Deps nao usadas | N | Remover do package.json |
| Exports nao usados | N | Remover ou marcar como API publica |
| Arquivos mortos | N | Remover |
```

### 6.2 Score de Modernidade

**Formula proposta (opinativa):**

```
Score = (peso_deps * score_deps) + (peso_padroes * score_padroes) +
        (peso_compat * score_compat) + (peso_tooling * score_tooling)

Pesos: deps=30%, padroes=30%, compat=20%, tooling=20%

score_deps = 100 - (5 * deprecated) - (3 * major_outdated) - (1 * minor_outdated)
score_padroes = 100 - (pontos por padrao obsoleto encontrado)
score_compat = 100 - (penalidade por targets ultrapassados)
score_tooling = 100 - (penalidade por tooling desatualizado)
```

**Classificacao:**
| Score | Classificacao | Interpretacao |
|-------|--------------|---------------|
| 90-100 | Excelente | Stack moderna, minima divida |
| 70-89 | Bom | Algumas atualizacoes pendentes |
| 50-69 | Atencao | Divida de modernidade significativa |
| 30-49 | Critico | Migracao necessaria em breve |
| 0-29 | Legacy | Reescrita parcial pode ser mais eficiente |

### 6.3 Formato por Sugestao Individual

Cada sugestao do agente deve seguir este formato estruturado:

```markdown
### [MOD-NNN] [Titulo curto]

**Tipo:** Dependencia | Padrao de Codigo | Compatibilidade | Tooling
**Severidade:** Critica | Alta | Media | Baixa
**Esforco:** P (< 1h) | M (1h-1d) | G (> 1d)
**Impacto:** Bundle size | Performance | DX | Seguranca | Manutencao
**Automatizavel:** Sim (codemod) | Parcial | Nao

**Problema:**
[Descricao do que esta obsoleto e por que importa]

**Arquivos afetados:**
- `caminho/arquivo.js` (linhas X-Y)
- `caminho/outro.js` (linhas A-B)

**Sugestao:**
[O que fazer, com exemplo de codigo se aplicavel]

**Riscos da migracao:**
[Breaking changes, dependencias transitivas afetadas]
```

## 7. Ferramentas de Transformacao Automatica

### 7.1 jscodeshift (Codemods)
**Confianca:** HIGH (Facebook/Meta, docs oficiais)

Toolkit para construir e rodar codemods que transformam codigo programaticamente via AST.

| Aspecto | Detalhe |
|---------|---------|
| **Criador** | Facebook (Meta) |
| **Base** | Wrapper sobre `recast` (preserva estilo do codigo) |
| **Uso** | `npx jscodeshift -t transform.js src/` |
| **Relevancia** | Execucao das migracoes, nao deteccao |

**Codemods existentes relevantes:**
- `js-codemod/no-vars` -- converte `var` para `const`/`let`
- `js-codemod/arrow-function` -- converte funcoes anonimas para arrow
- `js-codemod/template-literals` -- converte concatenacao para template literals
- Codemods de frameworks (React, Next.js, etc.)

### 7.2 OpenRewrite (JavaScript/TypeScript)
**Confianca:** MEDIUM (suporte JS/TS anunciado out/2025, ainda em maturacao)

Plataforma de refatoracao automatica com suporte a JavaScript/TypeScript via Lossless Semantic Tree. Mais relevante para projetos enterprise com transformacoes em escala.

**Relevancia para UP:** Baixa no curto prazo. O agente UP detecta e sugere; a execucao e via `/up:executar-fase`. Codemods via jscodeshift sao mais acessiveis.

## 8. Stack Recomendada para o Agente de Modernidade UP

### 8.1 Ferramentas que o Agente Deve Invocar (Camada CLI)

| Ferramenta | Proposito | Comando | Output Format |
|-----------|-----------|---------|---------------|
| `npm outdated` | Deps desatualizadas | `npm outdated --json` | JSON |
| `npm view` | Checar deprecacao | `npm view <pkg> deprecated` | String |
| `npx knip` | Codigo morto, deps fantasma | `npx knip --reporter json` | JSON |
| Leitura package.json | Versoes, engines, scripts | `Read` tool | JSON |
| Leitura configs | babel, browserslist, tsconfig | `Read` tool | Variado |

**NOTA:** O agente roda dentro do Claude Code, portanto nao instala nada globalmente. Usa `npx` para ferramentas pontuais e `Read`/`Grep`/`Glob` para analise estatica direta.

### 8.2 O Que o LLM Analisa Diretamente (Camada Analise)

| Dimensao | O que Analisa | Fontes |
|----------|--------------|--------|
| Imports obsoletos | Quais libs deprecated sao importadas e como | Grep por imports + Read dos arquivos |
| Padroes de codigo | var, callbacks, .then, Object.assign, etc. | Grep + Read |
| Uso contextual de libs | COMO cada lib deprecated e usada (qual funcao, quantas vezes) | Read dos arquivos |
| Configuracoes de compat | browserslist, babel targets, engines, .nvmrc | Read dos configs |
| Tooling desatualizado | Webpack 4, CRA, TSLint, etc. | package.json + configs |

### 8.3 Restricoes do Ambiente UP

O sistema UP roda como meta-prompting dentro de Claude Code, Gemini CLI ou OpenCode. Isso implica:

1. **Sem instalacao de dependencias globais** -- usar `npx` ou analise por Read/Grep
2. **Sem execucao de build** -- analise puramente estatica
3. **Output em Markdown** -- relatorio escrito em `.plano/melhorias/`
4. **Sem acesso a browser** -- nao pode testar runtime compatibility
5. **Ferramentas CLI podem nao estar disponiveis** -- fallback para analise por Read/Grep se `npm`/`npx` nao estiver no path

**Fallback sem CLI:** Se `npm` nao estiver disponivel, o agente pode:
- Ler `package.json` diretamente e comparar versoes com conhecimento do LLM
- Ler `package-lock.json` e checar campos `deprecated`
- Usar `Grep` para encontrar padroes obsoletos no codigo
- Usar `WebSearch` para verificar status de pacotes especificos

## 9. Implicacoes para o Roadmap do Projeto UP

### 9.1 Fases Recomendadas para Implementacao do Agente de Modernidade

1. **Catalogo de Padroes** -- Criar o banco de dados de padroes obsoletos e substituicoes (secao 3.3) como arquivo de referencia em `up/references/`. Isso alimenta o LLM com contexto estruturado.

2. **Comandos CLI de Coleta** -- Implementar a Camada 1 (secao 5.2) como parte do workflow: rodar ferramentas CLI e coletar dados estruturados antes de spawnar o agente.

3. **Agente de Modernidade** -- Criar `up-auditor-modernidade.md` seguindo o padrao de `up-mapeador-codigo.md`. Recebe output da Camada 1 + arquivos a analisar. Escreve relatorio estruturado.

4. **Formato de Relatorio** -- Implementar o formato da secao 6 como template em `up/templates/`.

5. **Integracao com Sintetizador** -- O sintetizador cruza findings de modernidade com findings de performance e UX (ex: jQuery causa bundle grande E e padrao obsoleto).

### 9.2 Ordem de Prioridade das Dimensoes

1. **Dependencias** (maior ROI) -- package.json e a fonte mais rica e objetiva de dados. Deteccao automatica via CLI e confiavel.
2. **Padroes de Codigo** (maior valor diferencial) -- aqui o LLM brilha sobre ferramentas tradicionais. Analise contextual e insubstituivel.
3. **Compatibilidade** (rapido de checar) -- configs sao poucos arquivos, analise e direta.
4. **Tooling** (menor urgencia) -- webpack vs vite, eslint vs biome -- importante mas menos frequente.

## 10. Fontes

### Ferramentas de Dependencias
- [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) -- Deteccao de versoes desatualizadas
- [depcheck](https://www.npmjs.com/package/depcheck) -- Deteccao de dependencias nao usadas
- [Knip](https://knip.dev/) -- Deteccao de codigo morto, deps e exports nao usados
- [npm-deprecated-check](https://www.npmjs.com/package/npm-deprecated-check) -- Verificacao de pacotes deprecated
- [npm outdated docs](https://docs.npmjs.com/cli/v11/commands/npm-outdated/) -- Comando built-in do npm

### Analise de Padroes
- [ESLint](https://eslint.org/) -- Linter padrao (v10.0.0 fev/2026)
- [eslint-plugin-import](https://github.com/import-js/eslint-plugin-import) -- Regra `no-commonjs`
- [eslint-plugin-es-x](https://github.com/eslint-community/eslint-plugin-es-x) -- Deteccao por versao ES
- [You-Dont-Need-Lodash-Underscore](https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore) -- Alternativas nativas a Lodash
- [You-Dont-Need-jQuery](https://github.com/camsong/You-Dont-Need-jQuery) -- APIs nativas que substituem jQuery
- [You-Dont-Need-Momentjs](https://github.com/you-dont-need/You-Dont-Need-Momentjs) -- Alternativas a Moment.js

### Compatibilidade
- [Browserslist](https://github.com/browserslist/browserslist) -- Configuracao de browsers-alvo
- [Node.js EOL](https://nodejs.org/en/about/eol) -- Ciclo de vida de versoes Node.js
- [Node.js endoflife.date](https://endoflife.date/nodejs) -- Datas de EOL consolidadas

### Modernizacao por AI/LLM
- [AI-Powered Legacy Code Modernization - EffectiveSoft](https://www.effectivesoft.com/blog/ai-legacy-code-modernization-migration.html)
- [Best Legacy Code Modernization Tools 2025 - Swimm](https://swimm.io/learn/legacy-code/best-legacy-code-modernization-tools-top-5-options-in-2025)
- [My LLM coding workflow going into 2026 - Addy Osmani](https://addyosmani.com/blog/ai-coding-workflow/)

### Transformacao Automatica
- [jscodeshift](https://github.com/facebook/jscodeshift) -- Toolkit de codemods
- [OpenRewrite JavaScript](https://github.com/openrewrite/rewrite-javascript) -- Refatoracao automatica em escala
- [Biome](https://biomejs.dev/) -- Linter + formatter moderno (alternativa ao ESLint)

### Metricas de Divida Tecnica
- [McKinsey Tech Debt Score](https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/demystifying-digital-dark-matter-a-new-standard-to-tame-technical-debt)
- [Top Technical Debt Measurement Tools 2026](https://www.codeant.ai/blogs/tools-measure-technical-debt)
- [5 JavaScript Libraries to Say Goodbye in 2025](https://thenewstack.io/5-javascript-libraries-you-should-say-goodbye-to-in-2025/)

### Seguranca de Supply Chain
- [Socket.dev](https://socket.dev/) -- Analise de seguranca de pacotes npm
- [npm Security Best Practices](https://github.com/bodadotsh/npm-security-best-practices)
