# Stack de Tecnologia

**Data da Analise:** 2026-03-08

## Linguagens

**Principal:**
- JavaScript (CommonJS) - Toda a logica CLI, hooks, instaladores, e testes

**Secundaria:**
- Markdown - Comandos (slash commands), agentes, workflows, templates, e referencias. Markdown com frontmatter YAML e a linguagem de definicao para todos os artefatos do sistema meta-prompting
- YAML - Frontmatter em arquivos `.md` (agentes, comandos), GitHub Actions workflows
- JSON - Configuracao (`package.json`, `config.json`, `settings.json`), comunicacao entre hooks e CLI via stdin/stdout

## Runtime

**Ambiente:**
- Node.js >= 16.7.0 (definido em `engines` de ambos `package.json`)
- CI testa em Node.js 18, 20, 22
- Desenvolvimento atual roda Node.js v20.20.0

**Gerenciador de Pacotes:**
- npm v10.8.2
- Lockfile: `package-lock.json` presente (lockfileVersion 3) -- apenas para GSD root
- UP (`up/package.json`) nao possui lockfile proprio

## Frameworks

**Core:**
- Nenhum framework web/aplicacao. O projeto e um sistema de meta-prompting que gera arquivos Markdown/JS para integracao com CLIs de AI (Claude Code, Gemini CLI, OpenCode)

**Testes:**
- `node:test` (Node.js built-in test runner) - Usado via `node --test` flag
- `node:assert` (Node.js built-in assertions) - Assertions nativas
- Config: `scripts/run-tests.cjs` como test runner cross-platform

**Build/Dev:**
- esbuild ^0.24.0 (devDependency) - Listada mas o build script (`scripts/build-hooks.js`) apenas faz copia de arquivos, nao usa bundling
- c8 ^11.0.0 (devDependency) - Coverage reporter para testes, requer Node 20+

## Dependencias Chave

**Producao (runtime):**
- Zero dependencias de producao. Ambos `package.json` (GSD e UP) nao possuem `dependencies`. Todo codigo usa apenas modulos built-in do Node.js

**Dev Dependencies (GSD apenas):**
- `c8` ^11.0.0 - Cobertura de codigo V8-based, executa `node scripts/run-tests.cjs` e reporta coverage
- `esbuild` ^0.24.0 - Build tool (presente mas nao usada ativamente pelo build script atual)

**Modulos Node.js Built-in Usados:**
- `fs` - Leitura/escrita de arquivos em todos os componentes
- `path` - Manipulacao de caminhos cross-platform
- `os` - Home directory, tmpdir, plataforma
- `child_process` (`execSync`, `execFileSync`, `spawn`) - Execucao de comandos git, processos em background
- `readline` - Interacao com usuario no installer interativo
- `crypto` - Usado no installer GSD (`bin/install.js`)

## Configuracao

**Ambiente:**
- Sem arquivos `.env` no repositorio
- Variavel `BRAVE_API_KEY` (GSD apenas) - Opcional, habilita websearch via Brave API
- Variavel `CLAUDE_CONFIG_DIR` - Override para diretorio de configuracao Claude Code
- Variavel `GEMINI_CONFIG_DIR` - Override para diretorio de configuracao Gemini
- Variavel `OPENCODE_CONFIG_DIR` / `XDG_CONFIG_HOME` - Override para diretorio de configuracao OpenCode

**Build:**
- `package.json` (root) - Manifesto npm do GSD (`get-shit-done-cc`)
- `up/package.json` - Manifesto npm do UP (`up-cc`)
- `scripts/build-hooks.js` - Copia hooks para `hooks/dist/` (roda em prepublishOnly)
- `scripts/run-tests.cjs` - Test runner cross-platform que resolve arquivos test sem shell glob

**Configuracao do Projeto (gerada pelo sistema em projetos-alvo):**
- `.plano/config.json` (UP) - Configuracoes do projeto: `modo`, `paralelizacao`, `commit_docs`, `auto_advance`
- `.planning/config.json` (GSD) - Configuracoes: `model_profile`, `commit_docs`, `branching_strategy`, `brave_search`, etc.

## Requisitos de Plataforma

**Desenvolvimento:**
- Node.js >= 16.7.0 (para rodar testes e scripts)
- npm (para instalar devDependencies e publicar)
- Git (usado extensivamente para commits automatizados e verificacoes)

**CI (GitHub Actions):**
- Testa em 3 plataformas: `ubuntu-latest`, `macos-latest`, `windows-latest`
- Testa em 3 versoes Node.js: 18, 20, 22
- Pipeline em `.github/workflows/test.yml`

**Producao (instalacao pelo usuario final):**
- Node.js >= 16.7.0
- Uma CLI de AI instalada: Claude Code (`~/.claude/`), Gemini CLI (`~/.gemini/`), ou OpenCode (`~/.config/opencode/`)
- Git (requerido pelo sistema para commits automatizados e verificacoes)

**Distribuicao:**
- npm registry como pacotes `get-shit-done-cc` (v1.22.4) e `up-cc` (v0.1.2)
- Instalacao global via `npx get-shit-done-cc --claude --global` ou `npx up-cc --claude --global`

## Dois Sistemas Paralelos

**GSD (Get Shit Done):**
- Pacote: `get-shit-done-cc` v1.22.4
- Root: `package.json`, `bin/install.js`
- CLI: `get-shit-done/bin/gsd-tools.cjs` (592 linhas dispatcher) + `get-shit-done/bin/lib/*.cjs` (5421 linhas total em 11 modulos)
- Hooks: `hooks/gsd-statusline.js`, `hooks/gsd-context-monitor.js`, `hooks/gsd-check-update.js`
- Testes: `tests/*.test.cjs` (14 arquivos), `tests/helpers.cjs`
- Suporte a Codex CLI (config.toml generation) no installer

**UP:**
- Pacote: `up-cc` v0.1.2
- Root: `up/package.json`, `up/bin/install.js`
- CLI: `up/bin/up-tools.cjs` (1361 linhas, monolitico) + `up/bin/lib/core.cjs` (270 linhas)
- Hooks: `up/hooks/up-statusline.js`, `up/hooks/up-context-monitor.js`
- Sem testes proprios (sem test runner configurado para UP)
- Sem suporte a Codex (apenas Claude, Gemini, OpenCode)

## Module System

**CommonJS exclusivo:**
- Todos os arquivos `.cjs` usam `require()` / `module.exports`
- Arquivos `.js` (hooks, installers, build scripts) tambem usam CommonJS
- O installer escreve `{"type":"commonjs"}` como `package.json` no diretorio de config para evitar conflitos ESM
- Nao ha TypeScript, JSX, ou qualquer transpilacao
