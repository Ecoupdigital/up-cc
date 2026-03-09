<overview>
# Reference de Modernidade

Catalogo de padroes obsoletos e alternativas modernas para o agente auditor de modernidade. Este documento serve como base de conhecimento sistematica -- o agente percorre cada categoria relevante ao stack detectado e busca os sinais de deteccao no codebase.

## Niveis de Urgencia

Cada padrao tem um nivel de urgencia que mapeia diretamente para o campo Impacto no template de sugestao:

| Urgencia | Significado | Impacto (suggestion.md) |
|----------|-------------|------------------------|
| **Critico** | Risco de seguranca, EOL sem patches, incompatibilidade iminente | G (Grande) |
| **Medio** | Alternativa significativamente melhor, manutencao dificultada | M (Medio) |
| **Baixo** | Funciona mas existe forma mais moderna/idiomatica | P (Pequeno) |

## Como o Agente Usa Este Reference

1. Executar deteccao de stack (secao `<stack_detection>`) para determinar quais categorias aplicam
2. Para cada categoria relevante, buscar sinais de deteccao no codebase
3. Para cada match, gerar sugestao no formato do template `suggestion.md` com Dimensao = "Modernidade"
4. Respeitar o campo Contexto de cada padrao para evitar falsos positivos
5. Priorizar padroes criticos sobre medios e baixos na ordenacao do relatorio
</overview>

<stack_detection>
# Deteccao de Framework e Stack

Antes de auditar, o agente deve detectar o stack do projeto para ajustar quais categorias e padroes sao relevantes. Cada deteccao abaixo indica sinais de presenca e quais categorias habilitar ou pular.

## Versao do Node.js

**Sinais:**
```bash
# Verificar engines em package.json
grep -o '"node":\s*"[^"]*"' package.json
# Verificar .nvmrc ou .node-version
cat .nvmrc 2>/dev/null || cat .node-version 2>/dev/null
```

**Impacto:** Se Node >= 18, habilitar padroes de `fetch` nativo e `crypto.randomUUID()`. Se Node >= 22, habilitar padroes de `require()` em ESM experimental.

## TypeScript vs JavaScript

**Sinais:**
```bash
# Presenca de tsconfig.json indica TypeScript
test -f tsconfig.json && echo "typescript" || echo "javascript"
# Contar extensoes
find src/ -name "*.ts" -o -name "*.tsx" | head -5
find src/ -name "*.js" -o -name "*.jsx" | head -5
```

**Impacto:** Se TypeScript, pular padroes de tipagem ausente. Se JavaScript puro, considerar migracao para TS como sugestao de modernidade (urgencia baixo).

## Framework e Versao

**Sinais:**
```bash
# React e versao
grep -o '"react":\s*"[^"]*"' package.json
# Next.js e versao
grep -o '"next":\s*"[^"]*"' package.json
# Vue e versao
grep -o '"vue":\s*"[^"]*"' package.json
# Angular e versao
grep -o '"@angular/core":\s*"[^"]*"' package.json
# Svelte
grep -o '"svelte":\s*"[^"]*"' package.json
```

**Impacto nas categorias:**
- React < 16.8: pular padroes de hooks (nao suportados)
- React >= 16.8 e < 18: habilitar padroes de class components -> hooks
- React >= 18: habilitar todos os padroes React modernos (concurrent features, use)
- Next.js < 13: habilitar padroes de pages router, getInitialProps
- Next.js >= 13: habilitar padroes de App Router
- Vue < 3: habilitar padroes de Options API -> Composition API, mixins
- Vue >= 3: habilitar padroes de `<script setup>`, composables

## Sistema de Modulos

**Sinais:**
```bash
# ESM nativo
grep -o '"type":\s*"module"' package.json
# Extensoes de arquivo
find src/ -name "*.mjs" | head -3
find src/ -name "*.cjs" | head -3
# Imports ESM no codigo
grep -rn "^import " src/ --include="*.js" | head -3
# Requires CommonJS
grep -rn "require(" src/ --include="*.js" | head -3
```

**Impacto:** Se projeto usa `"type": "module"` ou extensoes `.mjs`, padroes de `require()` -> `import` sao relevantes. Se projeto e puramente CommonJS (ex: tooling Node.js), pular sugestoes de migracao para ESM na camada de aplicacao.

## Build Tools

**Sinais:**
```bash
# Detectar ferramenta de build
test -f vite.config.ts -o -f vite.config.js && echo "vite"
test -f webpack.config.js -o -f webpack.config.ts && echo "webpack"
test -f rollup.config.js -o -f rollup.config.mjs && echo "rollup"
test -f next.config.js -o -f next.config.mjs && echo "next"
test -f turbo.json && echo "turborepo"
test -f esbuild.config.js && echo "esbuild"
```

**Impacto:** Se usa webpack com config manual complexo, sugerir migracao para Vite (urgencia baixo). Se usa Vite, pular padroes de build tools. Se usa Next.js, build tool e gerenciado pelo framework.

## Runtime Alternativo

**Sinais:**
```bash
# Deno
test -f deno.json -o -f deno.jsonc && echo "deno"
# Bun
test -f bun.lockb -o -f bunfig.toml && echo "bun"
```

**Impacto:** Se Deno ou Bun, muitos padroes de Node.js nao aplicam (ex: `Buffer`, `require`). Ajustar categorias node-apis e configs-tooling para o runtime detectado.
</stack_detection>

<category name="js-apis">
# APIs JavaScript/Browser Obsoletas

Padroes de uso de APIs JavaScript e browser que foram substituidas por alternativas modernas. Estes padroes aplicam a qualquer projeto JavaScript/TypeScript independente de framework.

### USO-DE-VAR

**Urgencia:** Baixo
**Frameworks:** All
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# Buscar declaracoes var (ignorar comentarios e strings)
grep -rn "\bvar\s\+" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
```

**Obsoleto:**
```javascript
// var tem escopo de funcao, nao de bloco -- causa bugs sutis em loops e closures
var items = [];
for (var i = 0; i < 10; i++) {
  setTimeout(() => console.log(i), 100); // imprime 10 dez vezes
}
```

**Moderno:**
```javascript
// const/let tem escopo de bloco -- comportamento previsivel
const items = [];
for (let i = 0; i < 10; i++) {
  setTimeout(() => console.log(i), 100); // imprime 0-9 corretamente
}
```

**Contexto:** Ignorar `var` em codigo gerado automaticamente (ex: output de bundlers, polyfills). Reportar apenas em codigo fonte do projeto.

---

### XMLHTTPREQUEST

**Urgencia:** Medio
**Frameworks:** All (browser)
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "XMLHttpRequest\|new\s\+XMLHttpRequest" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
```

**Obsoleto:**
```javascript
// API verbosa, nao retorna Promise, tratamento de erro confuso
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data');
xhr.onload = function() {
  if (xhr.status === 200) {
    const data = JSON.parse(xhr.responseText);
  }
};
xhr.onerror = function() { /* erro */ };
xhr.send();
```

**Moderno:**
```javascript
// fetch e nativo, retorna Promise, suporta async/await
const response = await fetch('/api/data');
const data = await response.json();
```

**Contexto:** Relevante apenas em codigo de aplicacao. Ignorar em testes que mockam XMLHttpRequest ou em polyfills.

---

### ARGUMENTS-OBJECT

**Urgencia:** Baixo
**Frameworks:** All
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "\barguments\b" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
```

**Obsoleto:**
```javascript
// arguments nao e um array real, nao funciona com arrow functions
function sum() {
  return Array.prototype.slice.call(arguments).reduce((a, b) => a + b, 0);
}
```

**Moderno:**
```javascript
// rest params e um array real, funciona com arrow functions
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
```

**Contexto:** Ignorar `arguments` em contextos onde e necessario (ex: decorators que preservam argumentos originais). Reportar quando usado como substituto pobre de rest params.

---

### THEN-CHAINS

**Urgencia:** Baixo
**Frameworks:** All
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# Chains de .then() com mais de 2 niveis indicam padrao obsoleto
grep -rn "\.then(" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" | head -20
```

**Obsoleto:**
```javascript
// Chains longas de .then() reduzem legibilidade e dificultam tratamento de erro
fetchUser(id)
  .then(user => fetchPosts(user.id))
  .then(posts => fetchComments(posts[0].id))
  .then(comments => renderComments(comments))
  .catch(err => console.error(err));
```

**Moderno:**
```javascript
// async/await e linear, legivel e permite try/catch padrao
try {
  const user = await fetchUser(id);
  const posts = await fetchPosts(user.id);
  const comments = await fetchComments(posts[0].id);
  renderComments(comments);
} catch (err) {
  console.error(err);
}
```

**Contexto:** Um unico `.then()` em pipeline simples e aceitavel. Reportar quando existem 3+ `.then()` encadeados ou quando `.then()` aninha callbacks.

---

### DOCUMENT-WRITE

**Urgencia:** Critico
**Frameworks:** All (browser)
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "document\.write\s*(" src/ --include="*.js" --include="*.ts" --include="*.html" --include="*.jsx" --include="*.tsx"
```

**Obsoleto:**
```javascript
// document.write bloqueia parsing do HTML, pode sobrescrever pagina inteira se chamado apos load
document.write('<script src="analytics.js"><\/script>');
document.write('<div>' + userInput + '</div>'); // XSS se userInput nao sanitizado
```

**Moderno:**
```javascript
// Usar DOM API para inserir conteudo de forma segura
const script = document.createElement('script');
script.src = 'analytics.js';
document.head.appendChild(script);

const div = document.createElement('div');
div.textContent = userInput; // seguro contra XSS
document.body.appendChild(div);
```

**Contexto:** Reportar SEMPRE. Nao ha caso de uso moderno legitimo para `document.write()`.

---

### EVAL-E-NEW-FUNCTION

**Urgencia:** Critico
**Frameworks:** All
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "\beval\s*(" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
grep -rn "new\s\+Function\s*(" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
```

**Obsoleto:**
```javascript
// eval executa codigo arbitrario -- vetor de injecao de codigo
const result = eval('2 + ' + userInput); // se userInput = "2; rm -rf /", executa
const fn = new Function('x', 'return x + ' + userInput);
```

**Moderno:**
```javascript
// Usar parsing explicito para avaliar expressoes
const result = Number(userInput) + 2; // seguro, retorna NaN se invalido

// Para templates dinamicos, usar template literals ou libs seguras
const template = (x) => x + 2;
```

**Contexto:** Ignorar `eval` em ferramentas de build, transpilers ou REPLs onde e esperado. Reportar em codigo de aplicacao, especialmente se recebe input do usuario.

---

### SUBSTR-DEPRECATED

**Urgencia:** Baixo
**Frameworks:** All
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "\.substr\s*(" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
```

**Obsoleto:**
```javascript
// .substr() esta deprecated no spec -- segundo argumento e length, confuso
const part = str.substr(1, 3); // comecar em indice 1, pegar 3 caracteres
```

**Moderno:**
```javascript
// .slice() e .substring() sao os metodos padrao -- argumentos sao indices
const part = str.slice(1, 4); // comecar em indice 1, terminar antes do 4
```

**Contexto:** Reportar em todo codigo fonte. A migracao e direta mas requer atencao na conversao do segundo argumento (length -> end index).

---

### PROTO-ACCESSOR

**Urgencia:** Medio
**Frameworks:** All
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "__proto__" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
```

**Obsoleto:**
```javascript
// __proto__ e legado, pode causar problemas de performance e seguranca (prototype pollution)
const child = {};
child.__proto__ = parent;
const proto = obj.__proto__;
```

**Moderno:**
```javascript
// Object.create para heranca, Object.getPrototypeOf para inspecao
const child = Object.create(parent);
const proto = Object.getPrototypeOf(obj);
```

**Contexto:** Reportar em codigo de aplicacao. Ignorar em polyfills ou codigo de compatibilidade proposital.
</category>

<category name="node-apis">
# APIs Node.js Obsoletas

Padroes de uso de APIs do Node.js que foram substituidas por alternativas mais seguras ou modernas. Relevantes apenas para projetos que rodam em Node.js (nao Deno/Bun).

### FS-EXISTS-CALLBACK

**Urgencia:** Baixo
**Frameworks:** All (Node.js)
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "fs\.exists\b\|fs\.existsSync" src/ --include="*.js" --include="*.ts" --include="*.cjs" --include="*.mjs"
```

**Obsoleto:**
```javascript
// fs.exists e deprecated (race condition entre check e uso)
const fs = require('fs');
if (fs.existsSync('/path/to/file')) {
  const data = fs.readFileSync('/path/to/file');
}
```

**Moderno:**
```javascript
// try/catch com operacao direta elimina race condition
import { readFile } from 'fs/promises';
try {
  const data = await readFile('/path/to/file', 'utf-8');
} catch (err) {
  if (err.code === 'ENOENT') {
    // arquivo nao existe
  }
}
// Ou fs.access para checagem explicita
import { access, constants } from 'fs/promises';
await access('/path/to/file', constants.R_OK);
```

**Contexto:** `fs.existsSync` em scripts de build/CLI e aceitavel. Reportar em codigo de aplicacao servidor onde a race condition pode causar bugs.

---

### REQUIRE-EM-ESM

**Urgencia:** Baixo
**Frameworks:** All (Node.js)
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# Verificar se projeto usa ESM (type: module) mas tem require()
grep -q '"type":\s*"module"' package.json && grep -rn "require(" src/ --include="*.js" --include="*.mjs"
```

**Obsoleto:**
```javascript
// CommonJS em projeto que poderia usar ESM -- impede tree-shaking, sem top-level await
const express = require('express');
const { readFile } = require('fs/promises');
module.exports = { handler };
```

**Moderno:**
```javascript
// ESM permite tree-shaking, top-level await, import dinamico nativo
import express from 'express';
import { readFile } from 'fs/promises';
export { handler };
```

**Contexto:** Reportar apenas se o projeto ja usa `"type": "module"` em package.json ou tem extensoes `.mjs`. NAO reportar em projetos puramente CommonJS (ex: tooling legado, configs) onde a migracao seria custosa sem beneficio.

---

### BUFFER-CONSTRUCTOR

**Urgencia:** Critico
**Frameworks:** All (Node.js)
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "new\s\+Buffer\s*(" src/ --include="*.js" --include="*.ts" --include="*.cjs" --include="*.mjs"
grep -rn "Buffer\s*(" src/ --include="*.js" --include="*.ts" | grep -v "Buffer\.\(from\|alloc\|allocUnsafe\)"
```

**Obsoleto:**
```javascript
// Buffer() constructor sem new e deprecated e inseguro -- pode vazar memoria
const buf1 = new Buffer(10);         // memoria nao-zerada, pode conter dados sensiveis
const buf2 = new Buffer('hello');    // ambiguo -- string ou tamanho?
const buf3 = Buffer(userInput);      // se userInput e numero, aloca sem zerar
```

**Moderno:**
```javascript
// Metodos explicitos, seguros e sem ambiguidade
const buf1 = Buffer.alloc(10);           // memoria zerada
const buf2 = Buffer.from('hello');       // explicito: cria de string
const buf3 = Buffer.allocUnsafe(10);     // explicito: nao-zerado (quando performance importa)
```

**Contexto:** Reportar SEMPRE em codigo de aplicacao. Vulnerabilidade de seguranca documentada (CVE). Ignorar apenas em dependencias de terceiros (node_modules).

---

### URL-PARSE-LEGACY

**Urgencia:** Medio
**Frameworks:** All (Node.js)
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "url\.parse\s*(" src/ --include="*.js" --include="*.ts" --include="*.cjs" --include="*.mjs"
grep -rn "require('url')" src/ --include="*.js" --include="*.cjs"
```

**Obsoleto:**
```javascript
// url.parse e legacy -- comportamento inconsistente com URLs malformadas
const url = require('url');
const parsed = url.parse('https://example.com/path?q=1');
console.log(parsed.hostname); // 'example.com'
```

**Moderno:**
```javascript
// WHATWG URL API e padrao web, consistente entre Node e browser
const parsed = new URL('https://example.com/path?q=1');
console.log(parsed.hostname); // 'example.com'
console.log(parsed.searchParams.get('q')); // '1'
```

**Contexto:** Reportar em todo codigo de aplicacao. `url.parse` tem parsing inconsistente que pode levar a bypasses de validacao (SSRF).

---

### QUERYSTRING-MODULE

**Urgencia:** Baixo
**Frameworks:** All (Node.js)
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "require('querystring')\|from\s\+'querystring'" src/ --include="*.js" --include="*.ts" --include="*.cjs" --include="*.mjs"
```

**Obsoleto:**
```javascript
// querystring module e legacy -- nao suporta valores repetidos corretamente
const qs = require('querystring');
const parsed = qs.parse('a=1&b=2&b=3');
```

**Moderno:**
```javascript
// URLSearchParams e padrao web, disponivel globalmente em Node 10+
const params = new URLSearchParams('a=1&b=2&b=3');
console.log(params.get('a'));    // '1'
console.log(params.getAll('b')); // ['2', '3']
```

**Contexto:** Migracao direta e simples. Reportar em codigo de aplicacao; ignorar em scripts de tooling legado.
</category>

<category name="deps-obsoletas">
# Dependencias Obsoletas e Abandonadas

Dependencias que foram abandonadas, tem vulnerabilidades conhecidas ou possuem alternativas significativamente melhores. O agente deve verificar o `package.json` do projeto contra esta tabela.

## Tabela de Referencia Rapida

| Dependencia Obsoleta | Alternativa Moderna | Urgencia | Razao Principal |
|---------------------|--------------------|---------|--------------------|
| moment.js | date-fns, dayjs, Temporal API | Medio | 72KB, nao tree-shakeable, em manutencao |
| request / request-promise | node-fetch, got, fetch nativo | Critico | Abandonado, vulnerabilidades conhecidas |
| lodash (full) | lodash-es, funcoes nativas | Baixo | Bundle pesado, maioria substituivel por ES2020+ |
| enzyme | @testing-library/react | Medio | Nao suporta React 18+, filosofia de teste inferior |
| tslint | eslint + @typescript-eslint | Critico | Abandonado oficialmente, sem patches |
| node-sass | sass (Dart Sass) | Critico | Abandonado, nao compila em Node moderno |
| jquery (com framework) | APIs nativas ou framework | Medio | Peso desnecessario, conflita com virtual DOM |
| create-react-app | Vite, Next.js, Remix | Medio | Manutencao minima, configs desatualizadas |
| body-parser (Express 4.16+) | express.json(), express.urlencoded() | Baixo | Redundante, builtin no Express |
| babel-polyfill | core-js/stable + regenerator-runtime | Medio | Substituto oficial, mais granular |

---

### MOMENT-JS

**Urgencia:** Medio
**Frameworks:** All
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"moment":\s*"[^"]*"' package.json
grep -rn "require('moment')\|from\s\+'moment'" src/ --include="*.js" --include="*.ts"
```

**Obsoleto:**
```javascript
// moment.js: 72KB minificado, nao tree-shakeable, mutavel
import moment from 'moment';
const formatted = moment().format('YYYY-MM-DD');
const diff = moment(date1).diff(moment(date2), 'days');
```

**Moderno:**
```javascript
// date-fns: tree-shakeable, imutavel, ~2KB por funcao usada
import { format, differenceInDays } from 'date-fns';
const formatted = format(new Date(), 'yyyy-MM-dd');
const diff = differenceInDays(date1, date2);

// Ou dayjs: API similar ao moment, ~2KB total
import dayjs from 'dayjs';
const formatted = dayjs().format('YYYY-MM-DD');
```

**Contexto:** Moment.js esta oficialmente em modo de manutencao. Migracao para date-fns requer reescrever chamadas. Se projeto usa poucas funcoes de data, considerar Intl.DateTimeFormat nativo.

---

### REQUEST-HTTP

**Urgencia:** Critico
**Frameworks:** All (Node.js)
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"request":\s*"[^"]*"\|"request-promise":\s*"[^"]*"\|"request-promise-native":\s*"[^"]*"' package.json
grep -rn "require('request')\|from\s\+'request'" src/ --include="*.js" --include="*.ts"
```

**Obsoleto:**
```javascript
// request esta abandonado desde 2020, com vulnerabilidades sem patch
const request = require('request');
request('https://api.example.com/data', (err, res, body) => {
  const data = JSON.parse(body);
});
```

**Moderno:**
```javascript
// fetch nativo em Node 18+ (sem dependencia), ou got/node-fetch para Node < 18
const response = await fetch('https://api.example.com/data');
const data = await response.json();

// got para casos avancados (retry, hooks, streams)
import got from 'got';
const data = await got('https://api.example.com/data').json();
```

**Contexto:** Reportar SEMPRE. Dependencia abandonada com CVEs conhecidas. Migracao e prioridade de seguranca.

---

### LODASH-FULL

**Urgencia:** Baixo
**Frameworks:** All
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"lodash":\s*"[^"]*"' package.json
grep -rn "require('lodash')\|from\s\+'lodash'" src/ --include="*.js" --include="*.ts" | grep -v "lodash/"
```

**Obsoleto:**
```javascript
// Import do lodash inteiro: ~70KB no bundle mesmo usando 2 funcoes
import _ from 'lodash';
const unique = _.uniqBy(items, 'id');
const grouped = _.groupBy(items, 'category');
```

**Moderno:**
```javascript
// Imports individuais ou funcoes nativas ES2020+
import uniqBy from 'lodash-es/uniqBy';
import groupBy from 'lodash-es/groupBy';

// Ou nativo quando possivel (Object.groupBy em Node 21+, browsers 2024+)
const grouped = Object.groupBy(items, item => item.category);
const unique = [...new Map(items.map(i => [i.id, i])).values()];
```

**Contexto:** Se projeto usa lodash extensivamente (10+ funcoes), migracao gradual e recomendada. Se usa 1-3 funcoes, substituir por nativo e trivial.

---

### ENZYME-TESTING

**Urgencia:** Medio
**Frameworks:** React
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"enzyme":\s*"[^"]*"\|"enzyme-adapter-react"' package.json
grep -rn "from\s\+'enzyme'" src/ --include="*.test.*" --include="*.spec.*"
```

**Obsoleto:**
```javascript
// enzyme testa implementacao interna (state, lifecycle) -- quebra em refatoracoes
import { shallow, mount } from 'enzyme';
const wrapper = shallow(<MyComponent />);
expect(wrapper.state('count')).toBe(0);
expect(wrapper.find('.button').length).toBe(1);
```

**Moderno:**
```javascript
// @testing-library/react testa comportamento do usuario -- resiliente a refatoracoes
import { render, screen, fireEvent } from '@testing-library/react';
render(<MyComponent />);
expect(screen.getByText('Count: 0')).toBeInTheDocument();
fireEvent.click(screen.getByRole('button'));
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

**Contexto:** Enzyme nao suporta React 18+ oficialmente. Se projeto esta em React 17 e nao planeja migrar, urgencia cai para baixo. Em React 18+, migracao e obrigatoria.

---

### TSLINT

**Urgencia:** Critico
**Frameworks:** TypeScript
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"tslint":\s*"[^"]*"' package.json
test -f tslint.json && echo "tslint.json encontrado"
```

**Obsoleto:**
```json
// tslint.json -- projeto abandonado oficialmente em 2019
{
  "rules": {
    "no-console": true,
    "semicolon": [true, "always"]
  }
}
```

**Moderno:**
```json
// eslint.config.js com @typescript-eslint -- mantido ativamente
// ou .eslintrc.json (formato legado mas funcional)
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "parser": "@typescript-eslint/parser"
}
```

**Contexto:** Reportar SEMPRE que tslint.json existir. Migracao e direta com ferramenta oficial: `npx tslint-to-eslint-config`.

---

### NODE-SASS

**Urgencia:** Critico
**Frameworks:** All (com SCSS)
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"node-sass":\s*"[^"]*"' package.json
```

**Obsoleto:**
```json
// node-sass e binding nativo em C++ -- nao compila em Node 18+, abandonado
{
  "devDependencies": {
    "node-sass": "^7.0.0"
  }
}
```

**Moderno:**
```json
// sass (Dart Sass) e a implementacao oficial, puro JavaScript, funciona em qualquer Node
{
  "devDependencies": {
    "sass": "^1.70.0"
  }
}
```

**Contexto:** Reportar SEMPRE. Node-sass nao compila em versoes modernas do Node.js. Migracao e drop-in na maioria dos casos (mesmo CLI, mesmas opcoes).

---

### JQUERY-COM-FRAMEWORK

**Urgencia:** Medio
**Frameworks:** React, Vue, Angular, Svelte
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"jquery":\s*"[^"]*"' package.json
# Verificar se tambem tem framework moderno
grep -o '"react":\|"vue":\|"@angular/core":\|"svelte":' package.json
```

**Obsoleto:**
```javascript
// jQuery em projeto React -- manipulacao DOM direta conflita com virtual DOM
import $ from 'jquery';
$('#modal').show();
$('.list-item').addClass('active');
```

**Moderno:**
```javascript
// Em React, usar state e refs para manipulacao de DOM
const [isOpen, setIsOpen] = useState(false);
// ...
{isOpen && <Modal />}
```

**Contexto:** jQuery em projeto SEM framework moderno nao e necessariamente obsoleto (sites estaticos, WordPress). Reportar apenas quando coexiste com React/Vue/Angular/Svelte.

---

### CREATE-REACT-APP

**Urgencia:** Medio
**Frameworks:** React
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"react-scripts":\s*"[^"]*"' package.json
test -d node_modules/react-scripts && echo "CRA detectado"
```

**Obsoleto:**
```json
// CRA em modo de manutencao minima desde 2023, configs internas desatualizadas
{
  "dependencies": {
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
```

**Moderno:**
```json
// Vite: build 10-20x mais rapido, configuravel, HMR instantaneo
{
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

**Contexto:** Migracao de CRA para Vite e bem documentada mas requer ajustes em configs, env vars (REACT_APP_ -> VITE_) e imports. Esforco medio.

---

### BODY-PARSER-SEPARADO

**Urgencia:** Baixo
**Frameworks:** Express (4.16+)
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"body-parser":\s*"[^"]*"' package.json
grep -rn "require('body-parser')\|from\s\+'body-parser'" src/ --include="*.js" --include="*.ts"
```

**Obsoleto:**
```javascript
// body-parser separado e redundante desde Express 4.16
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
```

**Moderno:**
```javascript
// Express inclui os mesmos middlewares nativamente
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**Contexto:** Migracao trivial -- mesmo API, apenas trocar o import. Funciona em Express 4.16+.

---

### BABEL-POLYFILL

**Urgencia:** Medio
**Frameworks:** All
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"babel-polyfill":\s*"[^"]*"\|"@babel/polyfill":\s*"[^"]*"' package.json
grep -rn "require('babel-polyfill')\|require('@babel/polyfill')\|import\s\+'@babel/polyfill'" src/ --include="*.js" --include="*.ts"
```

**Obsoleto:**
```javascript
// @babel/polyfill deprecated desde Babel 7.4 -- importa TUDO (~90KB)
import '@babel/polyfill';
```

**Moderno:**
```javascript
// core-js granular -- importa apenas polyfills necessarios via preset-env
// Em babel.config.js:
// { presets: [['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }]] }

// Ou import explicito
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

**Contexto:** Se projeto target e Node 16+ ou browsers modernos, muitos polyfills nao sao necessarios. Verificar browserslist antes de migrar.
</category>

<category name="padroes-codigo">
# Padroes de Codigo Ultrapassados

Padroes de organizacao e estruturacao de codigo que foram substituidos por abordagens mais modernas nos respectivos ecossistemas.

### CLASS-COMPONENTS-REACT

**Urgencia:** Medio
**Frameworks:** React (>= 16.8)
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "extends\s\+React\.Component\|extends\s\+Component\|extends\s\+PureComponent" src/ --include="*.jsx" --include="*.tsx" --include="*.js" --include="*.ts"
```

**Obsoleto:**
```javascript
// Class components: verbose, logica fragmentada em lifecycle methods, nao composavel
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { user: null, loading: true };
  }
  componentDidMount() {
    fetchUser(this.props.id).then(user => this.setState({ user, loading: false }));
  }
  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.setState({ loading: true });
      fetchUser(this.props.id).then(user => this.setState({ user, loading: false }));
    }
  }
  render() {
    // ...
  }
}
```

**Moderno:**
```javascript
// Functional components + hooks: conciso, composavel, logica colocada
function UserProfile({ id }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchUser(id).then(user => {
      setUser(user);
      setLoading(false);
    });
  }, [id]);

  // ...
}
```

**Contexto:** Reportar apenas se React >= 16.8 (suporte a hooks). Class components em React < 16.8 sao o padrao correto. Em projetos grandes, migracao gradual por componente e recomendada.

---

### MIXINS-VUE2

**Urgencia:** Medio
**Frameworks:** Vue (>= 3)
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "mixins:\s*\[" src/ --include="*.vue" --include="*.js" --include="*.ts"
grep -rn "Vue\.mixin(" src/ --include="*.js" --include="*.ts"
```

**Obsoleto:**
```javascript
// Mixins: conflitos de nome implicitos, origem do codigo obscura, nao tipavel
const LogMixin = {
  created() { console.log('component created'); },
  methods: { log(msg) { console.log(msg); } }
};
export default {
  mixins: [LogMixin],
  methods: { log(msg) { /* quem ganha? */ } } // conflito silencioso
};
```

**Moderno:**
```javascript
// Composables: explicitos, tipaveis, sem conflitos de nome
import { onMounted } from 'vue';
function useLogger() {
  onMounted(() => console.log('component created'));
  const log = (msg) => console.log(msg);
  return { log };
}
// No componente
const { log } = useLogger();
```

**Contexto:** Reportar em projetos Vue 3. Em Vue 2 sem planos de migracao, mixins sao o padrao aceito.

---

### HOC-PATTERNS

**Urgencia:** Baixo
**Frameworks:** React (>= 16.8), Vue (>= 3)
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# HOCs tipicamente seguem padrao with* ou *HOC
grep -rn "function\s\+with[A-Z]\|const\s\+with[A-Z]" src/ --include="*.jsx" --include="*.tsx" --include="*.js" --include="*.ts"
grep -rn "export\s\+default\s\+with[A-Z]" src/ --include="*.jsx" --include="*.tsx"
```

**Obsoleto:**
```javascript
// HOC: wrapper hell, props magicas, dificil de tipar, debug confuso
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const user = useAuth();
    if (!user) return <Redirect to="/login" />;
    return <WrappedComponent {...props} user={user} />;
  };
}
export default withAuth(withTheme(withRouter(MyComponent)));
```

**Moderno:**
```javascript
// Hooks: composicao direta, sem wrapper, tipagem simples
function MyComponent() {
  const user = useAuth();
  const theme = useTheme();
  const router = useRouter();
  if (!user) return <Navigate to="/login" />;
  // ...
}
```

**Contexto:** HOCs ainda fazem sentido para cross-cutting concerns em bibliotecas (ex: connect() do Redux). Reportar quando HOC envolve logica que seria mais clara como hook. Nao reportar HOCs de terceiros.

---

### CALLBACK-HELL

**Urgencia:** Medio
**Frameworks:** All (Node.js)
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# Identacao profunda com callbacks e um sinal
grep -rn "function\s*(err" src/ --include="*.js" --include="*.ts" | head -10
# Contar niveis de identacao em callbacks
grep -rn "}, function\|},\s*(" src/ --include="*.js" | head -10
```

**Obsoleto:**
```javascript
// Callback hell: dificil de ler, tratar erros e manter
fs.readFile('config.json', (err, data) => {
  if (err) return handleError(err);
  const config = JSON.parse(data);
  db.connect(config.db, (err, conn) => {
    if (err) return handleError(err);
    conn.query('SELECT * FROM users', (err, users) => {
      if (err) return handleError(err);
      sendEmail(users[0].email, (err) => {
        if (err) return handleError(err);
        console.log('done');
      });
    });
  });
});
```

**Moderno:**
```javascript
// async/await: linear, tratamento de erro centralizado
try {
  const data = await readFile('config.json', 'utf-8');
  const config = JSON.parse(data);
  const conn = await db.connect(config.db);
  const users = await conn.query('SELECT * FROM users');
  await sendEmail(users[0].email);
  console.log('done');
} catch (err) {
  handleError(err);
}
```

**Contexto:** Reportar quando callbacks aninhados excedem 2 niveis. Um unico callback (ex: event listener) e padrao normal.

---

### DOM-MANIPULATION-COM-FRAMEWORK

**Urgencia:** Critico
**Frameworks:** React, Vue, Angular, Svelte
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# jQuery ou DOM direto em projeto com framework reativo
grep -rn "document\.getElementById\|document\.querySelector\|\$(" src/ --include="*.jsx" --include="*.tsx" --include="*.vue"
grep -rn "\.innerHTML\s*=\|\.style\.\|\.classList\." src/ --include="*.jsx" --include="*.tsx" --include="*.vue"
```

**Obsoleto:**
```javascript
// Manipulacao DOM direta em componente React -- conflita com reconciliation
function MyComponent() {
  useEffect(() => {
    document.getElementById('counter').textContent = count;
    document.querySelector('.list').innerHTML = items.map(i => `<li>${i}</li>`).join('');
  }, [count, items]);
  return <div id="counter"><ul className="list"></ul></div>;
}
```

**Moderno:**
```javascript
// Deixar o framework gerenciar o DOM via state
function MyComponent() {
  const [count, setCount] = useState(0);
  return (
    <div>{count}</div>
    <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
  );
}
```

**Contexto:** Uso de refs (`useRef`, `ref()`) para integracao com libs externas (ex: D3, mapas) e aceitavel e esperado. Reportar quando manipulacao DOM substitui o que o framework deveria gerenciar.

---

### CSS-IN-JS-RUNTIME

**Urgencia:** Baixo
**Frameworks:** React
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"styled-components":\s*"[^"]*"\|"@emotion/styled":\s*"[^"]*"\|"@emotion/react":\s*"[^"]*"' package.json
```

**Obsoleto:**
```javascript
// CSS-in-JS runtime: injeta estilos no runtime, penaliza performance (especialmente SSR)
import styled from 'styled-components';
const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
  padding: 8px 16px;
`;
```

**Moderno:**
```javascript
// CSS Modules: zero runtime, tree-shakeable, suportado por todos os bundlers
// Button.module.css
// .button { padding: 8px 16px; }
// .primary { background: blue; }
import styles from './Button.module.css';
const Button = ({ primary, children }) => (
  <button className={`${styles.button} ${primary ? styles.primary : ''}`}>{children}</button>
);

// Ou Tailwind CSS: utility-first, zero runtime, purge automatico
const Button = ({ primary, children }) => (
  <button className={`px-4 py-2 ${primary ? 'bg-blue-500' : 'bg-gray-500'}`}>{children}</button>
);
```

**Contexto:** CSS-in-JS runtime nao e "obsoleto" -- e uma tendencia da industria para zero-runtime. Reportar como sugestao de modernidade, nao como bug. Se projeto usa SSR pesado, urgencia sobe para medio.

---

### REDUX-CLASSICO

**Urgencia:** Baixo
**Frameworks:** React
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "switch\s*(action\.type)" src/ --include="*.js" --include="*.ts"
grep -rn "createStore\|combineReducers" src/ --include="*.js" --include="*.ts"
grep -o '"redux":\s*"[^"]*"' package.json | grep -v "@reduxjs/toolkit"
```

**Obsoleto:**
```javascript
// Redux classico: muito boilerplate (actions, action types, reducers, mapStateToProps)
const ADD_TODO = 'ADD_TODO';
const addTodo = (text) => ({ type: ADD_TODO, payload: text });
function todosReducer(state = [], action) {
  switch (action.type) {
    case ADD_TODO: return [...state, { text: action.payload }];
    default: return state;
  }
}
const store = createStore(combineReducers({ todos: todosReducer }));
```

**Moderno:**
```javascript
// Redux Toolkit: menos boilerplate, immer builtin, createAsyncThunk
import { createSlice, configureStore } from '@reduxjs/toolkit';
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: (state, action) => { state.push({ text: action.payload }); }
  }
});
const store = configureStore({ reducer: { todos: todosSlice.reducer } });

// Ou alternativa mais leve: Zustand
import { create } from 'zustand';
const useTodoStore = create((set) => ({
  todos: [],
  addTodo: (text) => set((state) => ({ todos: [...state.todos, { text }] }))
}));
```

**Contexto:** Se projeto usa Redux extensivamente, migrar para RTK e incremental e bem suportado. Para projetos novos ou com state simples, Zustand/Jotai sao alternativas mais leves.

---

### GETINITIALPROPS-NEXTJS

**Urgencia:** Medio
**Frameworks:** Next.js (>= 13)
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "getInitialProps" src/ pages/ --include="*.jsx" --include="*.tsx" --include="*.js" --include="*.ts"
```

**Obsoleto:**
```javascript
// getInitialProps roda em client E server, desabilita otimizacoes automaticas
MyPage.getInitialProps = async (ctx) => {
  const res = await fetch('/api/data');
  const data = await res.json();
  return { data };
};
```

**Moderno:**
```javascript
// Next.js 13+ App Router: Server Components por padrao, sem data fetching especial
// app/page.tsx
export default async function Page() {
  const data = await fetch('/api/data').then(r => r.json());
  return <div>{data.title}</div>;
}

// Ou Pages Router com getServerSideProps (Next.js 10+):
export async function getServerSideProps() {
  const data = await fetch('/api/data').then(r => r.json());
  return { props: { data } };
}
```

**Contexto:** Reportar apenas em Next.js 13+. Em Next.js < 13, `getServerSideProps`/`getStaticProps` sao a alternativa. Em Next.js < 10, `getInitialProps` e o padrao correto.
</category>

<category name="configs-tooling">
# Configs e Tooling Legado

Configuracoes de build, linting e tooling que foram substituidas por alternativas mais modernas e performaticas.

### WEBPACK-MANUAL-COMPLEXO

**Urgencia:** Baixo
**Frameworks:** All (projetos frontend)
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
test -f webpack.config.js && wc -l webpack.config.js | awk '{if ($1 > 50) print "webpack config complexo: "$1" linhas"}'
grep -c "module\.exports\|plugins:\|module:" webpack.config.js 2>/dev/null
```

**Obsoleto:**
```javascript
// webpack config manual com 100+ linhas: dificil de manter, lento em dev
module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      { test: /\.jsx?$/, use: 'babel-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
      { test: /\.(png|jpg)$/, use: 'file-loader' },
    ]
  },
  plugins: [new HtmlWebpackPlugin(), new MiniCssExtractPlugin()],
  // ... mais 80 linhas de config
};
```

**Moderno:**
```javascript
// Vite: config minima, HMR instantaneo via ESM nativo, build com Rollup otimizado
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()]
  // CSS, assets, PostCSS funcionam out-of-the-box
});
```

**Contexto:** Webpack ainda e necessario em projetos com configs muito customizadas (ex: Module Federation, custom loaders). Reportar como sugestao em projetos com config vanilla que Vite suportaria nativamente.

---

### BABEL-EM-TARGETS-MODERNOS

**Urgencia:** Medio
**Frameworks:** All
**Impacto (suggestion.md):** M -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"@babel/core":\s*"[^"]*"\|"babel-loader":\s*"[^"]*"' package.json
# Verificar se browserslist target e moderno
grep -o '"browserslist"' package.json
cat .browserslistrc 2>/dev/null
```

**Obsoleto:**
```json
// Babel transpilando para target que ja suporta ES2020+ nativamente
{
  "presets": [
    ["@babel/preset-env", {
      "targets": "> 0.25%, not dead"
    }]
  ]
}
// Build: 30s+ em projetos grandes
```

**Moderno:**
```javascript
// SWC: ~20x mais rapido que Babel, drop-in replacement
// .swcrc
{
  "jsc": {
    "parser": { "syntax": "typescript", "tsx": true },
    "target": "es2020"
  }
}
// Ou esbuild via Vite (automatico)
// Build: ~2s no mesmo projeto
```

**Contexto:** Se projeto precisa suportar IE11 ou browsers muito antigos, Babel ainda e necessario. Verificar browserslist -- se target e "last 2 versions" de browsers modernos, SWC/esbuild sao substitutos diretos.

---

### NPMRC-HTTP

**Urgencia:** Critico
**Frameworks:** All
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -rn "registry=http://" .npmrc 2>/dev/null
grep -rn "registry=http://" ~/.npmrc 2>/dev/null
```

**Obsoleto:**
```ini
# .npmrc com HTTP -- pacotes podem ser interceptados (MITM)
registry=http://registry.npmjs.org/
```

**Moderno:**
```ini
# HTTPS obrigatorio -- protege contra interceptacao de pacotes
registry=https://registry.npmjs.org/
```

**Contexto:** Reportar SEMPRE. Risco de seguranca direto -- atacante pode injetar pacotes maliciosos via MITM em rede nao-confiavel.

---

### PACKAGE-LOCK-V1

**Urgencia:** Baixo
**Frameworks:** All (npm)
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
grep -o '"lockfileVersion":\s*[0-9]' package-lock.json 2>/dev/null
```

**Obsoleto:**
```json
// package-lock.json v1 (npm 5-6): instalacao mais lenta, sem determinismo completo
{
  "lockfileVersion": 1,
  "dependencies": { }
}
```

**Moderno:**
```json
// package-lock.json v3 (npm 9+): instalacao mais rapida, totalmente deterministico
{
  "lockfileVersion": 3,
  "packages": { }
}
```

**Contexto:** Atualizar com `npm install` usando npm 9+. Migracao automatica, sem risco. Reportar apenas como informativo.

---

### ESLINTRC-DEPRECATED

**Urgencia:** Baixo
**Frameworks:** All
**Impacto (suggestion.md):** P -- mapeado da urgencia
**Sinal de deteccao:**
```bash
test -f .eslintrc -o -f .eslintrc.json -o -f .eslintrc.js -o -f .eslintrc.cjs -o -f .eslintrc.yml && echo "formato legado encontrado"
grep -o '"eslint":\s*"[^"]*"' package.json
```

**Obsoleto:**
```javascript
// .eslintrc.js (formato deprecated no ESLint 9+)
module.exports = {
  extends: ['eslint:recommended'],
  env: { browser: true, node: true },
  rules: { 'no-unused-vars': 'warn' }
};
```

**Moderno:**
```javascript
// eslint.config.js (flat config -- padrao no ESLint 9+)
import js from '@eslint/js';
export default [
  js.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { 'no-unused-vars': 'warn' }
  }
];
```

**Contexto:** Flat config e o padrao no ESLint 9+. Em ESLint 8, ambos formatos funcionam. Reportar como sugestao de modernizacao, nao urgente se ESLint 8 ainda e usado.
</category>

<category name="seguranca-modernidade">
# Padroes Obsoletos com Implicacao de Seguranca

Padroes que alem de obsoletos representam riscos diretos de seguranca. Todos nesta categoria tem urgencia Critico e devem ser priorizados no relatorio.

### MATH-RANDOM-PARA-TOKENS

**Urgencia:** Critico
**Frameworks:** All
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# Math.random usado para gerar IDs, tokens ou segredos
grep -rn "Math\.random" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" | grep -i "token\|id\|secret\|key\|uuid\|session\|nonce"
# Padrao comum: Math.random().toString(36)
grep -rn "Math\.random()\.toString(36)" src/ --include="*.js" --include="*.ts"
```

**Obsoleto:**
```javascript
// Math.random() NAO e criptograficamente seguro -- previsivel
const token = Math.random().toString(36).substring(2);
const sessionId = 'sess_' + Math.random().toString(36).slice(2);
```

**Moderno:**
```javascript
// crypto.randomUUID() para IDs (Node 19+, browsers modernos)
const id = crypto.randomUUID(); // 'a1b2c3d4-e5f6-...'

// crypto.getRandomValues() para tokens customizados
const array = new Uint8Array(32);
crypto.getRandomValues(array);
const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');

// Ou crypto.randomBytes em Node.js
import { randomBytes } from 'crypto';
const token = randomBytes(32).toString('hex');
```

**Contexto:** `Math.random()` para IDs visuais nao-sensiveis (ex: key de lista React) e aceitavel. Reportar quando usado para tokens de sessao, API keys, nonces ou qualquer valor que precise ser imprevisivel.

---

### HTTP-HARDCODED

**Urgencia:** Critico
**Frameworks:** All
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# URLs HTTP hardcoded no codigo (ignorar localhost e 127.0.0.1)
grep -rn "http://" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.json" --include="*.env" | grep -v "localhost\|127\.0\.0\.1\|0\.0\.0\.0"
```

**Obsoleto:**
```javascript
// HTTP sem TLS -- dados transmitidos em texto plano, vulneravel a MITM
const API_URL = 'http://api.myservice.com/v1';
fetch('http://cdn.example.com/assets/logo.png');
```

**Moderno:**
```javascript
// HTTPS obrigatorio para qualquer recurso externo
const API_URL = 'https://api.myservice.com/v1';
fetch('https://cdn.example.com/assets/logo.png');
```

**Contexto:** HTTP e aceitavel para localhost/127.0.0.1 em desenvolvimento. Reportar TODA URL HTTP para dominios externos. Verificar tambem arquivos .env e configuracoes.

---

### INNERHTML-INSEGURO

**Urgencia:** Critico
**Frameworks:** All (browser)
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# innerHTML com variavel (potencial XSS)
grep -rn "\.innerHTML\s*=" src/ --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
# dangerouslySetInnerHTML em React
grep -rn "dangerouslySetInnerHTML" src/ --include="*.jsx" --include="*.tsx"
```

**Obsoleto:**
```javascript
// innerHTML com input nao-sanitizado = XSS
element.innerHTML = '<div>' + userInput + '</div>';
element.innerHTML = `<span>${comment.body}</span>`;

// React: dangerouslySetInnerHTML sem sanitizacao
<div dangerouslySetInnerHTML={{ __html: userComment }} />
```

**Moderno:**
```javascript
// textContent para texto puro (seguro contra XSS)
element.textContent = userInput;

// DOMPurify para HTML que PRECISA ser renderizado
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// React: sanitizar antes de dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userComment) }} />
```

**Contexto:** `innerHTML` com string literal hardcoded (sem variaveis) e aceitavel. Reportar quando o conteudo vem de input do usuario, API, banco de dados ou qualquer fonte externa.

---

### DEPS-COM-VULNERABILIDADES

**Urgencia:** Critico
**Frameworks:** All
**Impacto (suggestion.md):** G -- mapeado da urgencia
**Sinal de deteccao:**
```bash
# npm audit em formato JSON para parsing
npm audit --json 2>/dev/null | head -50
# Verificar se ha vulnerabilidades criticas ou altas
npm audit --json 2>/dev/null | grep -o '"severity":"critical"\|"severity":"high"' | wc -l
```

**Obsoleto:**
```json
// Dependencias com CVEs conhecidas sem patch aplicado
{
  "dependencies": {
    "vulnerable-package": "1.0.0"
  }
}
// npm audit mostra: 3 critical, 5 high vulnerabilities
```

**Moderno:**
```bash
# Atualizar dependencias vulneraveis
npm audit fix
# Para breaking changes que requerem major update
npm audit fix --force  # CUIDADO: pode quebrar
# Ou atualizar manualmente
npm install vulnerable-package@latest
```

**Contexto:** Verificar se vulnerabilidades sao em dependencias de producao ou apenas devDependencies. Vulnerabilidades em devDependencies tem menor urgencia mas ainda devem ser reportadas. Verificar se ha patches disponiveis antes de sugerir update.
</category>
