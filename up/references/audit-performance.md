<overview>

Catalogo de anti-padroes de performance para analise estatica de codigo. O agente auditor le este reference e compara contra o codebase para produzir sugestoes com Dimensao = `Performance` no formato `@up/templates/suggestion.md`.

**Como usar:** 1) Rode `<stack_detection>` para identificar a stack. 2) Filtre padroes pelo campo **Frameworks**. 3) Execute **Sinal de deteccao** via Grep. 4) Para cada match, produza sugestao.

**Impacto:** P = marginal, M = notavel em metricas, G = resolve gargalo real.

</overview>

<stack_detection>

## Deteccao de Stack

| Sinal (em package.json) | Detecta | Categorias |
|--------------------------|---------|-----------|
| `"react"` em dependencies | React | re-renders, bundle, assets, css, network, configs, deps |
| `"vue"` em dependencies | Vue | re-renders, bundle, assets, css, network, configs, deps |
| `"svelte"` em dependencies | Svelte | bundle, assets, css, network, configs, deps |
| `"next"` em dependencies | Next.js | + SSR, Image, dynamic imports |
| `"nuxt"` em dependencies | Nuxt | + SSR, NuxtImage |
| `tailwind.config.*` existe | Tailwind | Pular seletores CSS pesados |
| `"bootstrap"` em dependencies | Bootstrap | Verificar import completo vs cherry-pick |
| `"@prisma/client"` em deps | Prisma | include/select, findMany sem take |
| `"drizzle-orm"` em deps | Drizzle | query builder patterns |
| `"sequelize"` em deps | Sequelize | eager loading, N+1 |
| `"typeorm"` em deps | TypeORM | relations, query builder |

```bash
grep -E '"(react|vue|svelte|next|nuxt|@prisma/client|drizzle-orm|sequelize|typeorm|tailwindcss|bootstrap)"' package.json 2>/dev/null
ls tailwind.config.* 2>/dev/null
```

</stack_detection>

<category name="re-renders">

## Re-renders Desnecessarios

### INLINE-OBJECT-PROPS
**Frameworks:** React, Vue | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn 'style={{\|={\[' src/ --include="*.tsx" --include="*.jsx"
```
**Exemplo ruim:**
```tsx
<Card style={{ padding: 16 }}><Badge options={['new']} /></Card> // novo objeto a cada render
```
**Solucao:**
```tsx
const cardStyle = { padding: 16 }; const opts = ['new'];
<Card style={cardStyle}><Badge options={opts} /></Card>
```

### ANONYMOUS-FN-PROPS
**Frameworks:** React, Vue | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn 'onClick={() =>\|onChange={() =>' src/ --include="*.tsx" --include="*.jsx"
```
**Exemplo ruim:**
```tsx
{products.map(p => <ProductCard onClick={() => onSelect(p.id)} />)} // nova funcao a cada render
```
**Solucao:**
```tsx
const handleSelect = useCallback((id) => onSelect(id), [onSelect]);
{products.map(p => <ProductCard id={p.id} onClick={handleSelect} />)}
```

### MISSING-MEMO-LIST
**Frameworks:** React | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn '\.map(' src/ --include="*.tsx" --include="*.jsx" | grep -v 'memo'
```
**Exemplo ruim:**
```tsx
// Cada OrderRow re-renderiza quando qualquer estado do pai muda
{orders.map(o => <OrderRow key={o.id} order={o} />)}
```
**Solucao:**
```tsx
const OrderRow = React.memo(({ order }) => <tr><td>{order.id}</td></tr>);
```

### PARENT-STATE-CASCADE
**Frameworks:** React, Vue | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn 'setInterval\|addEventListener' src/ --include="*.tsx" --include="*.jsx"
```
**Exemplo ruim:**
```tsx
function Dashboard() {
  const [time, setTime] = useState(Date.now()); // atualiza todo segundo
  useEffect(() => { const id = setInterval(() => setTime(Date.now()), 1000); return () => clearInterval(id); }, []);
  return <><Clock time={time} />{products.map(p => <Card key={p.id} product={p} />)}</>;
  // todos os Cards re-renderizam a cada segundo
}
```
**Solucao:** Isolar estado volatil em componente separado (`<LiveClock />`) para nao cascatear re-renders.

### MISSING-USEMEMO-EXPENSIVE
**Frameworks:** React | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn '\.filter(\|\.sort(\|\.reduce(' src/ --include="*.tsx" --include="*.jsx" | grep -v 'useMemo'
```
**Exemplo ruim:**
```tsx
const results = items.filter(i => i.name.includes(query)).sort((a, b) => b.score - a.score); // recalcula a cada render
```
**Solucao:**
```tsx
const results = useMemo(() => items.filter(i => i.name.includes(query)).sort((a, b) => b.score - a.score), [items, query]);
```

### MISSING-KEY-STABLE
**Frameworks:** React, Vue | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn 'key={i}\|key={index}\|key={idx}' src/ --include="*.tsx" --include="*.jsx"
```
**Exemplo ruim:**
```tsx
{items.map((item, index) => <ListItem key={index} item={item} />)} // reordenacao causa reconciliacao completa
```
**Solucao:** Usar ID estavel: `key={item.id}`.

</category>

<category name="bundle">

## Bundle Size

### FULL-LIBRARY-IMPORT
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn "from 'lodash'" src/ --include="*.ts" --include="*.tsx" | grep -v 'lodash/'
```
**Exemplo ruim:**
```typescript
import _ from 'lodash'; // 70KB para usar 1 funcao
```
**Solucao:**
```typescript
import debounce from 'lodash/debounce'; // ~2KB
```

### HEAVY-DEP-WITH-ALTERNATIVE
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -E '"(moment|lodash|jquery|axios|classnames|uuid)"' package.json
```
**Tabela:** moment(67KB)->dayjs(2KB), lodash(70KB)->lodash-es, jquery(87KB)->DOM nativo, axios(13KB)->fetch, classnames(1KB)->clsx(0.5KB), uuid(3KB)->crypto.randomUUID().

### MISSING-CODE-SPLITTING
**Frameworks:** React, Vue, Svelte | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn "import .* from '.*/pages/" src/ --include="*.tsx" --include="*.ts" | grep -v 'lazy\|dynamic\|import('
```
**Exemplo ruim:**
```typescript
import Dashboard from './pages/Dashboard'; // todas as paginas no bundle inicial
```
**Solucao:**
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard')); // chunk separado por rota
```

### DEV-DEP-IN-DEPENDENCIES
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
node -e "const p=require('./package.json'),d=Object.keys(p.dependencies||{}),t=['eslint','prettier','jest','vitest','typescript','@types/','storybook','husky','nodemon'];d.filter(x=>t.some(k=>x.includes(k))).forEach(x=>console.log('DEV em deps:',x))"
```
Ferramentas de desenvolvimento devem estar em `devDependencies`, nao `dependencies`.

### UNNECESSARY-POLYFILLS
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn "core-js\|@babel/polyfill\|regenerator-runtime" src/ --include="*.ts" --include="*.js"
```
Remover polyfills se browserslist target >= ES2020. Usar `useBuiltIns: 'usage'` para incluir apenas o necessario.

### BARREL-FILE-BLOAT
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn "export \* from" src/ --include="index.ts" --include="index.tsx"
```
**Exemplo ruim:**
```typescript
export * from './Button'; export * from './DataGrid'; // barrel re-exporta tudo
import { Button } from '../components'; // bundler pode incluir DataGrid tambem
```
**Solucao:** Import direto: `import { Button } from '../components/Button'`.

</category>

<category name="queries">

## Queries e Acesso a Dados

### N-PLUS-ONE
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn 'for.*await.*find\|forEach.*await.*find\|\.map(.*await.*find' src/ --include="*.ts" --include="*.js"
```
**Exemplo ruim:**
```typescript
const orders = await prisma.order.findMany();
for (const o of orders) { o.user = await prisma.user.findUnique({ where: { id: o.userId } }); } // N queries extras
```
**Solucao:**
```typescript
const orders = await prisma.order.findMany({ include: { user: { select: { name: true } } } }); // 1 query
```

### MISSING-PAGINATION
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn 'findMany(\s*)' src/ --include="*.ts" | grep -v 'take\|skip\|cursor'
grep -rn 'SELECT.*FROM' src/ --include="*.ts" | grep -vi 'LIMIT'
```
Endpoints que retornam listas sem `take`/`limit` podem causar OOM com dados grandes. Adicionar paginacao com cursor ou offset.

### SELECT-ALL-FIELDS
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn 'findMany()' src/ --include="*.ts"
grep -rn 'SELECT \*' src/ --include="*.ts" --include="*.sql"
```
Retornar apenas campos necessarios via `select`. Evitar `SELECT *` e `findMany()` sem select.

### MISSING-INDEX-HINT
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn 'where:' src/ --include="*.ts" -A 5 | grep -v 'id:'
grep -rn '@@index\|@unique' prisma/schema.prisma 2>/dev/null
```
Campos usados em WHERE/ORDER BY devem ter indice. Verificar schema Prisma por `@@index` nos campos filtrados.

### MISSING-EAGER-LOADING
**Frameworks:** Sequelize, TypeORM | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn '\.getUser\|\.getOrders\|\.getPosts' src/ --include="*.ts" --include="*.js"
```
Getters de associacao em loop causam N+1. Usar `include` para eager loading.

</category>

<category name="assets">

## Assets e Midia

### IMG-MISSING-DIMENSIONS
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn '<img' src/ --include="*.tsx" --include="*.jsx" --include="*.html" | grep -v 'width\|height\|fill'
```
Imagens sem width/height causam CLS (Cumulative Layout Shift). Adicionar dimensoes explicitas ou `fill` (Next.js Image).

### IMG-MISSING-LAZY
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn '<img' src/ --include="*.tsx" --include="*.jsx" | grep -v 'loading=\|priority'
```
Imagens abaixo do fold devem ter `loading="lazy"`. Imagens acima do fold (hero) devem ser `eager`/`priority`.

### FONT-MISSING-DISPLAY
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn '@font-face' src/ --include="*.css" --include="*.scss" -A 5 | grep -v 'font-display'
grep -rn 'fonts.googleapis.com' src/ --include="*.html" --include="*.tsx" | grep -v 'display='
```
`@font-face` sem `font-display: swap` causa FOIT (texto invisivel). Google Fonts deve incluir `&display=swap`.

### LARGE-INLINE-SVG
**Frameworks:** React, Vue, Svelte | **Impacto:** P
**Sinal de deteccao:**
```bash
grep -rn '<svg' src/ --include="*.tsx" --include="*.jsx"
```
SVGs inline grandes (>50 linhas) devem ser importados como componentes ou usar sprite sheet.

### UNOPTIMIZED-IMG-FORMAT
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn '\.png"\|\.jpg"\|\.jpeg"' src/ --include="*.tsx" --include="*.jsx" --include="*.html" | grep -v 'favicon'
```
Usar `<picture>` com WebP/AVIF e fallback, ou Next.js `<Image>` que otimiza automaticamente.

</category>

<category name="css">

## CSS e Layout

### EXPENSIVE-SELECTORS
**Frameworks:** All (menos relevante com Tailwind) | **Impacto:** P
**Sinal de deteccao:**
```bash
grep -rn '\* {' src/ --include="*.css" --include="*.scss" | grep -v ':root\|html'
```
Seletores universais (`*`) e descendentes profundos (`.a .b .c .d .e`) sao custosos. Preferir classes diretas.

### LAYOUT-THRASHING
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn 'offsetHeight\|offsetWidth\|clientHeight\|getBoundingClientRect' src/ --include="*.ts" --include="*.tsx"
```
**Exemplo ruim:**
```typescript
cards.forEach(c => { const h = c.offsetHeight; c.style.height = h + 10 + 'px'; }); // leitura+escrita alternada
```
**Solucao:** Batch: todas as leituras primeiro, depois todas as escritas.

### NON-COMPOSITED-ANIMATIONS
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn 'transition\|animation' src/ --include="*.css" --include="*.scss" | grep -i 'width\|height\|top\|left\|margin'
```
Animar `width/height/top/left` causa layout a cada frame. Usar `transform` e `opacity` (GPU-composited, 60fps).

### UNUSED-CSS-LARGE
**Frameworks:** All (menos relevante com Tailwind purge) | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn "import 'bootstrap'" src/ --include="*.ts" --include="*.tsx" --include="*.js"
```
Import de CSS inteiro de frameworks (Bootstrap 250KB) quando so 10% e usado. Importar modulos especificos ou usar PurgeCSS.

</category>

<category name="network">

## Rede e Comunicacao

### FETCH-WATERFALL
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn 'await.*fetch\|await.*axios' src/ --include="*.ts" --include="*.tsx" -A 1 | grep -B 1 'await.*fetch\|await.*axios'
```
**Exemplo ruim:**
```typescript
const user = await fetch('/api/user').then(r => r.json());
const orders = await fetch('/api/orders').then(r => r.json()); // espera user terminar
```
**Solucao:**
```typescript
const [user, orders] = await Promise.all([fetch('/api/user').then(r=>r.json()), fetch('/api/orders').then(r=>r.json())]);
```

### MISSING-CACHE-HEADERS
**Frameworks:** All (backend) | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn 'Cache-Control\|max-age\|stale-while-revalidate' src/ --include="*.ts" --include="*.js"
```
Respostas de dados que mudam raramente devem ter `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.

### LARGE-JSON-PAYLOAD
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn 'include:' src/ --include="*.ts" -A 10 | grep -c 'include:'
```
Includes aninhados profundos geram payloads de MB. Usar `select` para limitar campos e paginar resultados.

### MISSING-COMPRESSION
**Frameworks:** All (backend) | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -E '"compression"' package.json
grep -rn "from 'compression'" src/ --include="*.ts" --include="*.js"
```
Express sem middleware `compression` envia JSON sem gzip. Compressao reduz payloads em 70-90%.

</category>

<category name="configs">

## Configuracao e Build

### SOURCEMAPS-IN-PROD
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
grep -rn 'sourcemap\|sourceMap\|devtool.*source-map' webpack.config.* vite.config.* next.config.* tsconfig.json 2>/dev/null
```
Source maps em producao expoe codigo-fonte. Usar condicional: `devtool: process.env.NODE_ENV === 'production' ? false : 'source-map'`.

### CONSOLE-LOGS-IN-PROD
**Frameworks:** All | **Impacto:** P
**Sinal de deteccao:**
```bash
grep -rn 'console\.log\|console\.debug' src/ --include="*.ts" --include="*.tsx" | grep -v '\.test\.\|\.spec\.'
```
Console.log em producao polui o console e pode vazar dados sensiveis. Usar logger estruturado que respeita nivel por ambiente.

### HARDCODED-DEV-VALUES
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -rn 'localhost\|127\.0\.0\.1' src/ --include="*.ts" --include="*.tsx" | grep -v '\.test\.\|\.spec\.'
```
URLs de localhost hardcoded quebram em producao. Usar `process.env.API_URL` com fallback para dev.

</category>

<category name="deps">

## Dependencias

### HEAVY-DEPS-TABLE
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
grep -E '"(moment|lodash|jquery|axios|classnames|uuid|underscore|request|bluebird|node-fetch)"' package.json
```

| Dependencia | Tamanho (gz) | Alternativa | Tamanho |
|-------------|-------------|-------------|---------|
| moment | 67KB | dayjs | 2KB |
| lodash | 70KB | lodash-es + cherry-pick | 2-5KB |
| jquery | 87KB | DOM nativo | 0KB |
| axios | 13KB | fetch nativo | 0KB |
| classnames | 1KB | clsx | 0.5KB |
| uuid | 3KB | crypto.randomUUID() | 0KB |
| underscore | 18KB | ES2020+ nativos | 0KB |
| request | 48KB | fetch/undici | 0KB |
| bluebird | 18KB | Promise nativo | 0KB |
| node-fetch | 8KB | fetch nativo (Node 18+) | 0KB |

### ABANDONED-DEPS
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
npm view $(node -e "Object.keys(require('./package.json').dependencies||{}).forEach(d=>process.stdout.write(d+' '))") time.modified 2>/dev/null
```
Dependencias com ultimo publish > 2 anos sao candidatas a substituicao. Verificar se README menciona "deprecated".

### DUPLICATE-PURPOSE-DEPS
**Frameworks:** All | **Impacto:** M
**Sinal de deteccao:**
```bash
node -e "const d=Object.keys({...require('./package.json').dependencies,...require('./package.json').devDependencies}),g={datas:['moment','dayjs','date-fns','luxon'],http:['axios','got','node-fetch','request','undici'],utils:['lodash','underscore','ramda'],css:['styled-components','@emotion/react','styled-jsx'],state:['redux','mobx','zustand','jotai','recoil']};Object.entries(g).forEach(([c,l])=>{const f=l.filter(x=>d.includes(x));if(f.length>1)console.log(c+': '+f.join(', '))})"
```
Multiplas libs para o mesmo proposito (ex: moment + date-fns) inflam bundle. Consolidar em uma.

### KNOWN-VULNERABILITIES
**Frameworks:** All | **Impacto:** G
**Sinal de deteccao:**
```bash
npm audit --json 2>/dev/null | node -e "try{const a=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')),v=a.metadata?.vulnerabilities||{};if(v.high||v.critical)console.log('CRITICO:',v.critical||0,'criticas,',v.high||0,'altas')}catch(e){}"
```
Dependencias com vulnerabilidades high/critical devem ser atualizadas via `npm audit fix`.

</category>
