# Padroes de Teste

**Data da Analise:** 2026-03-08

## Framework de Teste

**Runner:** Node.js built-in test runner (`node:test`) via `node --test`
**Config:** Sem arquivo de configuracao dedicado. O runner e invocado pelo script `scripts/run-tests.cjs`.

**Comandos:**
```bash
# Rodar todos os testes
npm test

# Rodar um unico arquivo de teste
node tests/<file>.test.cjs

# Rodar com cobertura (requer c8)
npm run test:coverage
```

**Importante:** Testes existem apenas para o sistema GSD (`get-shit-done/`). O sistema UP (`up/`) nao possui testes automatizados.

## Organizacao dos Arquivos de Teste

**Localizacao:** Separados do codigo fonte, em diretorio dedicado `tests/`
**Nomeacao:** `{modulo-ou-feature}.test.cjs`

**Arquivos existentes (15 arquivos, 10.658 linhas total):**

| Arquivo | Linhas | O que testa |
|---------|--------|-------------|
| `tests/core.test.cjs` | 804 | Funcoes puras de `get-shit-done/bin/lib/core.cjs` (loadConfig, escapeRegex, phase utils, milestone utils) |
| `tests/frontmatter.test.cjs` | 353 | Parser YAML custom: extractFrontmatter, reconstructFrontmatter, spliceFrontmatter, parseMustHavesBlock |
| `tests/frontmatter-cli.test.cjs` | 271 | Integracao CLI dos 4 subcomandos frontmatter (get, set, merge, validate) |
| `tests/state.test.cjs` | 1.378 | Comandos de estado: state-snapshot, state load/update/patch/advance-plan |
| `tests/config.test.cjs` | 355 | Comandos config: config-ensure-section, config-set, config-get |
| `tests/dispatcher.test.cjs` | 277 | Roteamento do CLI: comandos desconhecidos, parsing de --cwd, rotas especificas |
| `tests/init.test.cjs` | 849 | Comandos init: execute-phase, plan-phase, progress, resume, verify-work |
| `tests/phase.test.cjs` | 1.566 | Operacoes de fase: phases list, phase add/insert/remove/complete |
| `tests/roadmap.test.cjs` | 670 | Operacoes de roadmap: get-phase, analyze, update-plan-progress |
| `tests/milestone.test.cjs` | 611 | Milestone complete: archive, MILESTONES.md, phase archiving |
| `tests/verify.test.cjs` | 1.013 | Validacao: plan-structure, phase-completeness, references, consistency, artifacts, key-links |
| `tests/verify-health.test.cjs` | 652 | Validate health: todos os 8 checks + repair path |
| `tests/commands.test.cjs` | 1.188 | Comandos gerais: history-digest, summary-extract, websearch, scaffold, todo |
| `tests/agent-frontmatter.test.cjs` | 181 | Validacao estatica de agentes: anti-heredoc, skills, hooks comments |
| `tests/codex-config.test.cjs` | 490 | Adaptador Codex: conversao de agentes, config TOML, uninstall |

**Helpers:** `tests/helpers.cjs` (75 linhas) - Funcoes compartilhadas entre todos os testes.

## Estrutura dos Testes

**Padrao geral — describe/test com setup/teardown:**
```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('feature or command name', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('descriptive name of behavior', () => {
    // Arrange: setup filesystem state
    fs.writeFileSync(
      path.join(tmpDir, '.planning', 'ROADMAP.md'),
      '# Roadmap\n\n### Phase 1: Foundation\n'
    );

    // Act: run command
    const result = runGsdTools('roadmap get-phase 1', tmpDir);

    // Assert: verify output
    assert.ok(result.success, `Command failed: ${result.error}`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.found, true);
    assert.strictEqual(output.phase_name, 'Foundation');
  });
});
```

**Convencao de nomes de teste:**
- Descreva o comportamento, nao a implementacao: `'returns defaults when config.json is missing'`
- Para testes negativos: `'errors when no key path provided'`
- Para regressoes: `'returns model_overrides when present (REG-01)'`

**Docstring de arquivo — JSDoc com Requirements:**
```javascript
/**
 * GSD Tools Tests - frontmatter.cjs
 *
 * Tests for the hand-rolled YAML parser's pure function exports.
 * Includes REG-04 regression: quoted comma inline array edge case.
 */
```
Cada arquivo de teste tem um comentario JSDoc no topo descrevendo escopo e, opcionalmente, requirement IDs.

## Helpers de Teste

**Arquivo:** `tests/helpers.cjs`

**Funcoes exportadas:**

```javascript
// Executa gsd-tools.cjs como subprocesso
function runGsdTools(args, cwd = process.cwd()) {
  // args pode ser string (shell-interpreted) ou array (safe para JSON/dollar signs)
  // Retorna: { success: boolean, output: string, error?: string }
}

// Cria diretorio temporario com .planning/phases/
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

// Cria diretorio temporario com git repo inicializado
function createTempGitProject() {
  // ... cria tmpDir, git init, commit inicial
  return tmpDir;
}

// Limpa diretorio temporario
function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
```

**Padrao de uso:** Cada `describe` block cria seu proprio `tmpDir` em `beforeEach` e limpa em `afterEach`. Nunca reutilize tmpDir entre describe blocks.

## Dois Estilos de Teste

### 1. Testes de Funcao Pura (Unit Tests)

Testam funcoes exportadas diretamente, sem subprocesso:

```javascript
const { escapeRegex, normalizePhaseName } = require('../get-shit-done/bin/lib/core.cjs');

describe('escapeRegex', () => {
  test('escapes dots', () => {
    assert.strictEqual(escapeRegex('file.txt'), 'file\\.txt');
  });
});
```

**Usado em:** `tests/core.test.cjs`, `tests/frontmatter.test.cjs`

**Caracteristicas:**
- Importa funcoes diretamente do modulo
- Sem filesystem setup (ou setup minimo com tmpDir)
- Assertions com `assert.strictEqual` e `assert.deepStrictEqual`
- Rapidos e deterministicos

### 2. Testes de Integracao CLI

Testam comandos executando `gsd-tools.cjs` como subprocesso:

```javascript
const { runGsdTools, createTempProject, cleanup } = require('./helpers.cjs');

describe('config-set command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Setup initial state
    runGsdTools('config-ensure-section', tmpDir);
  });

  test('sets a top-level string value', () => {
    const result = runGsdTools('config-set model_profile quality', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.strictEqual(output.updated, true);

    // Verify side effects on filesystem
    const config = JSON.parse(fs.readFileSync(
      path.join(tmpDir, '.planning', 'config.json'), 'utf-8'
    ));
    assert.strictEqual(config.model_profile, 'quality');
  });
});
```

**Usado em:** Todos os outros arquivos de teste.

**Caracteristicas:**
- Usa `runGsdTools()` para executar como subprocesso
- Verifica stdout (JSON parsed) e exit code
- Verifica side effects no filesystem (arquivos criados/modificados)
- Setup via `createTempProject()` com estado de filesystem configurado por teste

## Mocking

**Framework:** Nenhum framework de mocking. Testes usam filesystem real com diretorios temporarios.

**Padrao de "mocking" via filesystem:**
```javascript
beforeEach(() => {
  tmpDir = createTempProject(); // cria /tmp/gsd-test-XXXXX/.planning/phases/
});

// "Mock" de estado: escrever arquivos diretamente
fs.writeFileSync(
  path.join(tmpDir, '.planning', 'STATE.md'),
  '# Project State\n\n**Current Phase:** 03\n...'
);

// "Mock" de config
fs.writeFileSync(
  path.join(tmpDir, '.planning', 'config.json'),
  JSON.stringify({ model_profile: 'quality' }, null, 2)
);
```

**Para testes que tocam filesystem real (home dir):**
```javascript
test('detects Brave Search from file-based key', () => {
  const braveKeyFile = path.join(os.homedir(), '.gsd', 'brave_api_key');

  // Skip se arquivo ja existe (nao mexer com config real do usuario)
  if (fs.existsSync(braveKeyFile)) return;

  try {
    fs.writeFileSync(braveKeyFile, 'test-key', 'utf-8');
    // ... executar teste ...
  } finally {
    // SEMPRE limpar em finally
    try { fs.unlinkSync(braveKeyFile); } catch {}
  }
});
```

**Para testes com exports condicionais (Codex):**
```javascript
// No topo do arquivo de teste
process.env.GSD_TEST_MODE = '1';

// No modulo testado (install.js)
if (process.env.GSD_TEST_MODE === '1') {
  module.exports = { getCodexSkillAdapterHeader, ... };
}
```

## Assertions

**Modulo:** `node:assert` (built-in). Sem Chai, sem Jest matchers.

**Assertions mais usadas:**
```javascript
// Igualdade estrita (mais comum)
assert.strictEqual(result.phase_name, 'Foundation');

// Igualdade profunda para objetos/arrays
assert.deepStrictEqual(output.directories, ['01-foundation', '02-api']);

// Boolean check com mensagem
assert.ok(result.success, `Command failed: ${result.error}`);

// Verificar existencia de substring
assert.ok(result.error.includes('Unknown command'), `Expected message in: ${result.error}`);

// Verificar tipo
assert.strictEqual(typeof config.commit_docs, 'boolean');
```

**Convencao de mensagens de erro em assertions:**
- Sempre fornecer mensagem em `assert.ok()`: `` `Command failed: ${result.error}` ``
- Para `assert.strictEqual`: mensagem opcional mas usada em contextos ambiguos: `'current phase extracted'`
- Pattern de debug: incluir valor real no fallback: `` `Expected "Usage:" in stderr, got: ${result.error}` ``

## Testes de Regressao

**Convencao de nomeacao:** Prefixo `REG-NN` no nome do teste e comentario:

```javascript
// Bug: loadConfig previously omitted model_overrides from return value
test('returns model_overrides when present (REG-01)', () => {
  writeConfig({ model_overrides: { 'gsd-executor': 'opus' } });
  const config = loadConfig(tmpDir);
  assert.deepStrictEqual(config.model_overrides, { 'gsd-executor': 'opus' });
});
```

**Regressoes documentadas:**
- `REG-01`: `loadConfig` omitia `model_overrides` do retorno (`tests/core.test.cjs`)
- `REG-02`: `getRoadmapPhaseInternal` faltava no `module.exports` (`tests/core.test.cjs`)
- `REG-04`: Parser YAML faz split em virgulas dentro de aspas (`tests/frontmatter.test.cjs`)

## Testes de Validacao Estatica

**Arquivo:** `tests/agent-frontmatter.test.cjs`

Testes que validam conteudo de arquivos markdown (nao codigo):

```javascript
const ALL_AGENTS = fs.readdirSync(AGENTS_DIR)
  .filter(f => f.startsWith('gsd-') && f.endsWith('.md'))
  .map(f => f.replace('.md', ''));

describe('anti-heredoc instruction', () => {
  for (const agent of FILE_WRITING_AGENTS) {
    test(`${agent} has anti-heredoc instruction`, () => {
      const content = fs.readFileSync(path.join(AGENTS_DIR, agent + '.md'), 'utf-8');
      assert.ok(
        content.includes("never use `Bash(cat << 'EOF')` or heredoc"),
        `${agent} missing anti-heredoc instruction`
      );
    });
  }
});
```

**Pattern:** Gera testes dinamicamente iterando sobre arquivos do projeto. Garante consistencia de convencoes entre agentes.

## Cobertura

**Requisitos:** Minimo 70% de cobertura de linhas (enforced via `c8 --check-coverage --lines 70`).

**Ferramenta:** `c8` (Istanbul/V8-based)

**Comando:**
```bash
npm run test:coverage
# Equivale a:
c8 --check-coverage --lines 70 --reporter text --include 'get-shit-done/bin/lib/*.cjs' --exclude 'tests/**' --all node scripts/run-tests.cjs
```

**Escopo de cobertura:** Apenas `get-shit-done/bin/lib/*.cjs` (core.cjs e frontmatter.cjs). Nao inclui o dispatcher (`gsd-tools.cjs`), hooks, ou instalador.

## Tipos de Teste

**Unitarios:**
- Escopo: Funcoes puras exportadas de `core.cjs` e `frontmatter.cjs`
- Abordagem: Import direto, input/output, sem side effects
- Arquivos: `tests/core.test.cjs`, `tests/frontmatter.test.cjs`

**Integracao CLI:**
- Escopo: Comandos completos via `gsd-tools.cjs` como subprocesso
- Abordagem: Setup filesystem -> executar comando -> verificar stdout JSON + side effects no filesystem
- Arquivos: Todos os demais arquivos `.test.cjs`

**Validacao Estatica:**
- Escopo: Consistencia de conteudo entre arquivos markdown de agentes
- Abordagem: Leitura de arquivos, verificacao de patterns obrigatorios
- Arquivos: `tests/agent-frontmatter.test.cjs`

**E2E:** Nao usado. Sem testes que exercitam o fluxo completo de instalacao ou workflow de usuario.

## Onde Adicionar Novos Testes

**Para novo comando GSD em `gsd-tools.cjs`:**
- Adicione testes em um arquivo existente relevante ou crie `tests/{feature}.test.cjs`
- Use `runGsdTools('novo-comando args', tmpDir)` pattern
- Inclua casos de sucesso, falha, e edge cases

**Para nova funcao em `core.cjs`:**
- Adicione testes em `tests/core.test.cjs`
- Use import direto, sem subprocesso
- Inclua teste de regressao se corrigindo bug (prefixo REG-NN)

**Para novo agente markdown:**
- Atualize `tests/agent-frontmatter.test.cjs` se novas convencoes forem adicionadas
- O teste dinamico ja cobre novos agentes automaticamente (filtra por prefixo `gsd-`)

**Para o sistema UP:**
- Testes precisam ser criados do zero
- Seguir mesmos padroes do GSD: `node:test` + `node:assert`
- Criar `up/tests/` com helpers analogos a `tests/helpers.cjs`
- O `up-tools.cjs` tem a mesma arquitetura de `gsd-tools.cjs`, entao o mesmo padrao de testes de integracao CLI se aplica

## Test Runner Customizado

**Arquivo:** `scripts/run-tests.cjs`

```javascript
const files = readdirSync(testDir)
  .filter(f => f.endsWith('.test.cjs'))
  .sort()
  .map(f => join('tests', f));

execFileSync(process.execPath, ['--test', ...files], {
  stdio: 'inherit',
  env: { ...process.env },
});
```

**Por que customizado:** Resolve globs via Node ao inves de depender do shell (compatibilidade Windows PowerShell/cmd). Propaga `NODE_V8_COVERAGE` para `c8` coletar cobertura do subprocesso.

## Resultados de Teste Atuais

- **535 testes** passando em **96 suites**
- **0 falhas**, **0 skipped**
- **Duracao:** ~4 segundos
- **Cobertura:** Acima de 70% nas libs core
