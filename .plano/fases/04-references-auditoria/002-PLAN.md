---
phase: 04-references-auditoria
plan: 04-002
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [INFRA-05]
must_haves:
  truths:
    - "Reference contem catalogo de padroes obsoletos com alternativas modernas e nivel de urgencia"
    - "Padroes cobrem: APIs obsoletas, dependencias abandonadas, padroes de codigo ultrapassados, configs legadas"
    - "Cada padrao tem sinal detectavel em codigo para o agente auditor e nivel de urgencia (critico/medio/baixo)"
    - "Reference inclui secao de deteccao de framework/stack para ajustar heuristicas de modernidade"
  artifacts:
    - path: "up/references/audit-modernidade.md"
      provides: "Catalogo de padroes obsoletos com alternativas modernas, sinais de deteccao e nivel de urgencia"
  key_links:
    - from: "audit-modernidade.md"
      to: "up/templates/suggestion.md"
      via: "Agente auditor de modernidade (Fase 5) le o reference e produz sugestoes no formato do template"
---

# Fase 4 Plano 2: Reference de Modernidade

**Objetivo:** Criar o documento de referencia `up/references/audit-modernidade.md` que serve como catalogo de padroes obsoletos e alternativas modernas para o agente auditor de modernidade (Fase 5). O agente usara este catalogo para identificar sistematicamente codigo, dependencias e padroes desatualizados, classificando-os por urgencia.

## Contexto

@up/references/checkpoints.md -- Exemplo de reference existente (formato com XML tags semanticas)
@up/references/verification-patterns.md -- Exemplo de catalogo de padroes organizados por tipo
@up/templates/suggestion.md -- Formato de saida que o agente produzira (campo Dimensao = "Modernidade")
@up/references/ui-brand.md -- Referencia de estilo para UP references

## Pesquisa de Dominio

O reference deve cobrir padroes obsoletos detectaveis via analise estatica de codigo. Diferente de performance (que foca em eficiencia), modernidade foca em:
- **APIs do JavaScript/Node/browser que foram substituidas** (ex: `var` -> `const/let`, `XMLHttpRequest` -> `fetch`, callbacks -> async/await)
- **Dependencias abandonadas ou com alternativas muito superiores** (ex: moment.js -> date-fns, request -> node-fetch/got, enzyme -> testing-library)
- **Padroes de codigo ultrapassados** (ex: class components React -> hooks, CommonJS em frontend -> ESM, webpack configs manuais -> Vite)
- **Configs e tooling legado** (ex: Babel para targets modernos -> SWC/esbuild, tslint -> eslint)

Cada padrao tem um **nivel de urgencia**:
- **Critico**: Risco de seguranca, EOL sem patches, incompatibilidade iminente
- **Medio**: Alternativa significativamente melhor, manutencao ficando dificil
- **Baixo**: Funciona mas existe forma mais moderna/idiomatica

## Tarefas

<task id="1" type="auto">
<files>up/references/audit-modernidade.md</files>
<action>
Criar o arquivo `up/references/audit-modernidade.md` seguindo o formato de references UP existentes (XML tags semanticas como estrutura, markdown como conteudo).

**Estrutura obrigatoria do arquivo:**

1. `<overview>` -- Proposito do reference, como o agente deve usa-lo. Explicar os 3 niveis de urgencia (critico/medio/baixo) e como mapeiam para Impacto no template de sugestao (critico=G, medio=M, baixo=P).

2. `<stack_detection>` -- Secao de deteccao de framework/stack (INFRA-05). Deve conter:
   - Deteccao de versao do Node.js (engines em package.json, .nvmrc, .node-version)
   - Deteccao de TypeScript vs JavaScript puro (tsconfig.json, extensoes .ts/.tsx)
   - Deteccao de framework e versao (package.json dependencies: react versao, next versao, vue versao)
   - Deteccao de module system (type: "module" em package.json, extensoes .mjs/.cjs)
   - Deteccao de build tools (vite.config, webpack.config, rollup.config, next.config)
   - Deteccao de runtime (Deno via deno.json, Bun via bun.lockb)
   - Para cada deteccao: sinal de presenca + quais categorias de padrao obsoleto sao relevantes
   - Exemplo: "Se package.json tem `react` < 18 -> habilitar padroes de class components; se >= 18 -> pular"

3. `<category name="js-apis">` -- APIs JavaScript/browser obsoletas. Minimo 6 padroes. Incluir:
   - `var` em vez de `const/let` (urgencia: baixo)
   - `XMLHttpRequest` em vez de `fetch` (urgencia: medio)
   - `arguments` object em vez de rest params (urgencia: baixo)
   - `.then()` chains em vez de `async/await` (urgencia: baixo)
   - `document.write()` (urgencia: critico -- seguranca e performance)
   - `eval()` e `new Function()` desnecessarios (urgencia: critico -- seguranca)
   - `.substr()` em vez de `.slice()` (urgencia: baixo -- deprecated)
   - `__proto__` em vez de `Object.getPrototypeOf()` (urgencia: medio)

4. `<category name="node-apis">` -- APIs Node.js obsoletas. Minimo 4 padroes. Incluir:
   - `fs.exists()` / `fs.existsSync()` com callback em vez de `fs.access` ou try/catch (urgencia: baixo)
   - `require()` em projetos que poderiam usar ESM (urgencia: baixo -- contextual)
   - `Buffer()` constructor em vez de `Buffer.from()`/`Buffer.alloc()` (urgencia: critico -- seguranca)
   - `url.parse()` em vez de `new URL()` (urgencia: medio)
   - `querystring` module em vez de `URLSearchParams` (urgencia: baixo)

5. `<category name="deps-obsoletas">` -- Dependencias obsoletas/abandonadas. Minimo 8 padroes. Estruturar como tabela: dependencia obsoleta, alternativa moderna, urgencia, razao. Incluir:
   - moment.js -> date-fns ou dayjs (medio -- 72KB, nao tree-shakeable)
   - request / request-promise -> node-fetch, got, ou fetch nativo (critico -- abandonado, vulnerabilidades)
   - lodash (full) -> lodash-es ou funcoes nativas (baixo -- tree-shake ruim em bundle)
   - enzyme -> @testing-library/react (medio -- nao suporta React 18+)
   - tslint -> eslint com @typescript-eslint (critico -- abandonado oficialmente)
   - node-sass -> sass (Dart Sass) (critico -- abandonado, nao compila em Node moderno)
   - jquery em projetos com framework moderno (medio -- peso desnecessario)
   - create-react-app -> Vite ou Next.js (medio -- manutencao minima, configs desatualizadas)
   - body-parser separado em Express 4.16+ -> express.json() builtin (baixo)
   - babel-polyfill -> core-js/stable (medio -- substituto oficial)

6. `<category name="padroes-codigo">` -- Padroes de codigo ultrapassados. Minimo 6 padroes. Incluir:
   - Class components React em vez de functional + hooks (medio -- se React 16.8+)
   - Mixins em Vue 2 em vez de Composition API em Vue 3 (medio)
   - HOC patterns em vez de hooks/composables (baixo)
   - Callback hell em vez de Promises/async-await (medio)
   - Manual DOM manipulation com jQuery em projetos React/Vue (critico -- conflita com virtual DOM)
   - CSS-in-JS runtime (styled-components, emotion) em projetos que poderiam usar Tailwind/CSS Modules (baixo -- tendencia, nao obsolescencia)
   - Redux boilerplate classico em vez de Redux Toolkit ou alternativas (Zustand, Jotai) (baixo)
   - getInitialProps (Next.js) em vez de getServerSideProps/getStaticProps ou App Router (medio -- Next 13+)

7. `<category name="configs-tooling">` -- Configs e tooling legado. Minimo 4 padroes. Incluir:
   - Webpack config manual complexo em vez de Vite/Turbopack (baixo -- se projeto novo)
   - Babel em targets modernos (ES2020+) em vez de SWC/esbuild (medio -- performance de build)
   - .npmrc com `registry=http://` em vez de `https://` (critico -- seguranca)
   - package-lock.json v1 format em vez de v3 (baixo)
   - .eslintrc (deprecated format) em vez de eslint.config.js flat config (baixo -- ESLint 9+)

8. `<category name="seguranca-modernidade">` -- Padroes obsoletos com implicacao de seguranca. Minimo 3 padroes. Incluir:
   - `Math.random()` para tokens/IDs em vez de `crypto.randomUUID()` / `crypto.getRandomValues()` (critico)
   - HTTP em URLs hardcoded em vez de HTTPS (critico)
   - `innerHTML` com input nao-sanitizado em vez de `textContent` ou sanitizacao (critico -- XSS)
   - Dependencias com known vulnerabilities (sinal: `npm audit --json` parseavel) (critico)

**Para cada padrao dentro de cada categoria, usar este formato consistente:**

```markdown
### [NOME-DO-PADRAO]

**Urgencia:** Critico / Medio / Baixo
**Frameworks:** [Relevantes ou "All"]
**Impacto (suggestion.md):** G / M / P -- mapeado da urgencia
**Sinal de deteccao:**
\`\`\`bash
# Grep pattern ou heuristica para o agente encontrar este padrao
grep -rn "padrao" src/ --include="*.ts"
\`\`\`

**Obsoleto:**
\`\`\`javascript
// Codigo obsoleto com comentario explicando por que esta obsoleto
\`\`\`

**Moderno:**
\`\`\`javascript
// Alternativa moderna com comentario explicando a vantagem
\`\`\`

**Contexto:** [Uma linha explicando quando a migracao faz sentido e quando nao faz]
```

**Regras de escrita:**
- Texto em portugues brasileiro (nomes de secoes, descricoes) mas exemplos de codigo em ingles (nomes de variaveis, imports)
- Usar XML tags semanticas para estrutura (`<overview>`, `<stack_detection>`, `<category name="X">`)
- Cada categoria deve ter uma breve intro antes dos padroes
- Sinais de deteccao devem ser comandos grep/heuristica reais que funcionam
- O campo "Contexto" e essencial -- evita false positives (ex: `var` em codigo gerado nao deve ser reportado)
- Incluir a tabela de dependencias obsoletas na categoria deps-obsoletas como referencia rapida
- O arquivo resultante deve ter entre 400-600 linhas
</action>
<verify>
<automated>
# Verificar estrutura e conteudo minimo do reference
FILE="up/references/audit-modernidade.md"
test -f "$FILE" && \
grep -q "<overview>" "$FILE" && \
grep -q "<stack_detection>" "$FILE" && \
grep -q '<category name="js-apis">' "$FILE" && \
grep -q '<category name="node-apis">' "$FILE" && \
grep -q '<category name="deps-obsoletas">' "$FILE" && \
grep -q '<category name="padroes-codigo">' "$FILE" && \
grep -q '<category name="configs-tooling">' "$FILE" && \
grep -q '<category name="seguranca-modernidade">' "$FILE" && \
grep -q "Urgencia" "$FILE" && \
grep -q "Sinal de deteccao" "$FILE" && \
grep -q "Obsoleto" "$FILE" && \
grep -q "Moderno" "$FILE" && \
grep -c "### " "$FILE" | xargs -I{} test {} -ge 30 && \
echo "PASS: audit-modernidade.md validado" || echo "FAIL: estrutura incompleta"
</automated>
</verify>
<done>
- Arquivo `up/references/audit-modernidade.md` existe com todas as 6 categorias obrigatorias
- Cada categoria contem no minimo o numero de padroes especificado (total >= 35 padroes)
- Cada padrao tem: urgencia (critico/medio/baixo), frameworks, impacto mapeado, sinal de deteccao, exemplo obsoleto, alternativa moderna, contexto
- Secao `<stack_detection>` cobre deteccao de Node version, TS/JS, frameworks+versao, module system, build tools, runtime
- Formato segue convencao de references UP (XML tags semanticas, markdown como conteudo, texto em PT-BR)
</done>
</task>

## Criterios de Sucesso

- [ ] Reference contem catalogo de padroes obsoletos organizados por 6 categorias
- [ ] Cada padrao tem nivel de urgencia (critico/medio/baixo) mapeado para Impacto do template de sugestao
- [ ] Exemplos de codigo obsoleto e alternativa moderna presentes para cada padrao
- [ ] Secao de deteccao de framework/stack presente com deteccao de versao (INFRA-05)
- [ ] Formato alinhado com references UP existentes (XML tags semanticas)
