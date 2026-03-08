# Convencoes de Codigo

**Data da Analise:** 2026-03-08

## Padroes de Nomeacao

**Arquivos JavaScript:**
- Use `kebab-case` para nomes de arquivo: `up-tools.cjs`, `up-statusline.js`, `run-tests.cjs`
- Extensao `.cjs` para modulos CommonJS (todo o codigo fonte e testes)
- Extensao `.js` para hooks e scripts de instalacao
- Arquivos de lib ficam em subdiretorios `lib/`: `up/bin/lib/core.cjs`
- Helpers de teste: `tests/helpers.cjs` (sem sufixo `.test`)

**Arquivos Markdown (Agentes/Comandos/Workflows):**
- Agentes: `up-{nome}.md` com prefixo do sistema (ex: `up-executor.md`, `up-planejador.md`)
- Comandos: `{verbo-acao}.md` em portugues para UP (ex: `executar-fase.md`, `planejar-fase.md`)
- Comandos GSD em ingles: `{verb-noun}.md` (ex: `execute-phase.md`)
- Workflows: `{verbo-acao}.md` espelhando o comando correspondente

**Funcoes:**
- Use `camelCase` para todas as funcoes: `loadConfig`, `findPhaseInternal`, `stateExtractField`
- Prefixo `cmd` para funcoes de comando CLI: `cmdStateLoad`, `cmdInitPlanejarFase`, `cmdPhaseFind`
- Sufixo `Internal` para funcoes exportadas de `core.cjs` que sao wrappers de logica interna: `findPhaseInternal`, `getRoadmapPhaseInternal`, `generateSlugInternal`, `pathExistsInternal`
- Funcoes de helpers locais sem prefixo: `writeConfig`, `readConfig`, `validPlanContent`

**Variaveis:**
- Use `camelCase` para variaveis locais: `tmpDir`, `phaseDir`, `rawIndex`
- Use `UPPER_SNAKE_CASE` para constantes de modulo: `MODEL_PROFILES`, `TOOLS_PATH`, `WARNING_THRESHOLD`, `CRITICAL_THRESHOLD`
- Use `snake_case` para chaves de objetos JSON retornados pela CLI: `phase_number`, `phase_name`, `commit_docs`, `has_research`

**Tipos (Markdown Frontmatter):**
- Agentes usam chaves: `name`, `description`, `tools`, `color`, `model`
- Comandos usam chaves: `name`, `description`, `argument-hint`, `allowed-tools`
- Planos usam chaves: `phase`, `plan`, `type`, `wave`, `depends_on`, `files_modified`, `autonomous`, `must_haves`

## Estilo de Codigo

**Formatacao:**
- Sem ferramentas de formatacao automatica (sem Prettier, sem ESLint configurado)
- Indentacao: 2 espacos consistentemente em todos os arquivos `.cjs` e `.js`
- Ponto-e-virgula: obrigatorio ao final de statements
- Strings: aspas simples para strings JavaScript (`'use strict'`, `'utf-8'`)
- Template literals para interpolacao: `` `Error: ${message}` ``
- Sem trailing commas em listas de argumentos ou arrays

**Linting:**
- Sem ESLint, Biome ou qualquer linter configurado
- Qualidade de codigo mantida por convencao e testes

## Organizacao de Imports

**Ordem (CommonJS `require`):**

1. Modulos nativos do Node.js: `require('fs')`, `require('path')`, `require('child_process')`, `require('os')`
2. Modulos nativos de teste: `require('node:test')`, `require('node:assert')`
3. Modulos locais/internos: `require('./lib/core.cjs')`, `require('./helpers.cjs')`
4. Modulos relativos ao projeto: `require('../get-shit-done/bin/lib/core.cjs')`

**Padrao de destructuring nos imports:**
```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { output, error, loadConfig, findPhaseInternal } = require('./lib/core.cjs');
```

**Regra:** Use destructuring para `node:test` e para modulos internos (`core.cjs`). Use o modulo inteiro para `fs`, `path`, `os`, `assert`.

## Modulo System

**CommonJS exclusivamente:**
- Todo o codigo usa `require()`/`module.exports` (nao ES modules)
- Extensao `.cjs` garante compatibilidade
- Use `'use strict'` no topo de scripts executaveis (ex: `scripts/run-tests.cjs`)
- Shebang `#!/usr/bin/env node` em arquivos entry-point (CLIs e hooks)

**Padrao de exports em `core.cjs`:**
```javascript
module.exports = {
  output,
  error,
  safeReadFile,
  loadConfig,
  // ... todas as funcoes exportadas listadas explicitamente
};
```
Use export nomeado via objeto literal no final do arquivo. Nunca use `module.exports.fn = ...` inline.

## Tratamento de Erros

**Padrao CLI — Saida com stderr + exit code:**
```javascript
function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}
```
Use a funcao `error()` de `core.cjs` para falhas fatais em comandos CLI. Nunca lance excecoes para erros de usuario.

**Padrao try/catch silencioso para operacoes de arquivo:**
```javascript
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}
```
Retorne `null` quando um arquivo pode nao existir. Nunca propague erros de `ENOENT`.

**Padrao try/catch com fallback para configuracao:**
```javascript
try {
  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return { /* valores do parsed com fallbacks */ };
} catch {
  return defaults;
}
```
Retorne valores default quando config nao existe ou e invalido.

**Padrao para git — retorno estruturado:**
```javascript
function execGit(cwd, args) {
  try {
    const stdout = execSync('git ' + escaped.join(' '), { cwd, stdio: 'pipe', encoding: 'utf-8' });
    return { exitCode: 0, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return { exitCode: err.status ?? 1, stdout: (err.stdout ?? '').toString().trim(), stderr: (err.stderr ?? '').toString().trim() };
  }
}
```
Nunca lance excecoes em operacoes git. Retorne objeto com `exitCode`, `stdout`, `stderr`.

**Padrao para hooks — timeout guard:**
```javascript
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try { /* logica principal */ } catch (e) { process.exit(0); }
});
```
Hooks devem sair silenciosamente (exit 0) em caso de timeout ou erro. Nunca falhar visivelmente.

## Design de Funcoes

**Tamanho:** Funcoes tendem a 10-40 linhas. Funcoes de comando (`cmd*`) podem chegar a 60-80 linhas mas sao sequenciais (load -> process -> output).

**Parametros:**
- Primeiro parametro e tipicamente `cwd` (diretorio de trabalho)
- Ultimo parametro e tipicamente `raw` (flag boolean para output mode)
- Flags via objeto quando ha multiplas opcoes: `{ force: true }`, `{ summary: '...', phase: '...' }`

**Valores de Retorno:**
- Funcoes CLI terminam com `output(result, raw)` — nunca retornam
- Funcoes internas retornam `null` para "nao encontrado" ou objetos estruturados com `found: true`
- Nunca use `undefined` como retorno explicito

**Padrao de saida da CLI:**
```javascript
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    if (json.length > 50000) {
      // @file: protocol para payloads grandes
      const tmpPath = path.join(require('os').tmpdir(), `up-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}
```

## Separadores de Secao

Use comentarios com linhas horizontais para separar secoes logicas em arquivos fonte:

**GSD usa box-drawing characters:**
```javascript
// ─── Section Name ────────────────────────────────────────────────────────────
```

**UP usa tracos simples:**
```javascript
// --- Section Name ---
```

**Comandos da CLI usam banners de iguais:**
```javascript
// ==================== INIT ====================
// ==================== STATE ====================
```

## Markdown Frontmatter (Agentes e Comandos)

**Agentes UP:**
```yaml
---
name: up-executor
description: Executa PLAN.md com commits atomicos e SUMMARY.md
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---
```
- `tools`: lista separada por virgulas (string, nao array YAML)
- `color`: nome simples (yellow, green, blue, red)
- `model`: omitido quando herda do chamador

**Comandos UP:**
```yaml
---
name: up:executar-fase
description: Executar todos os planos de uma fase com paralelizacao por ondas
argument-hint: "<fase> [--gaps-only]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
```
- `allowed-tools`: array YAML (diferente de agentes que usam string)
- `name`: prefixo `up:` com kebab-case
- `argument-hint`: entre aspas com angle brackets para parametros

## XML Tags Estruturais em Markdown

Workflows e agentes usam tags XML como estrutura semantica:

```markdown
<role> ... </role>
<objective> ... </objective>
<execution_context> ... </execution_context>
<step name="step_name"> ... </step>
<process> ... </process>
<critical_rules> ... </critical_rules>
<forbidden_files> ... </forbidden_files>
```

Nunca use tags HTML (`<div>`, `<span>`). Use tags semanticas XML customizadas.

## Idioma

**GSD:** Todo texto de interface e comentarios de codigo em ingles.

**UP:** Todo texto de interface em portugues brasileiro. Comentarios de codigo podem ser em ingles ou portugues. Nomes de funcoes e variaveis em ingles (camelCase). Nomes de comandos e workflows em portugues (kebab-case).

**Chaves de configuracao UP em portugues:** `modo`, `paralelizacao`, `commit_docs`, `auto_advance`. Compare com GSD que usa ingles: `model_profile`, `parallelization`.
