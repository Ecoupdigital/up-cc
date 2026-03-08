# Integracoes Externas

**Data da Analise:** 2026-03-08

## APIs e Servicos Externos

**Brave Search API (GSD apenas):**
- Servico: Brave Web Search - Busca web opcional para pesquisa de fase/projeto
  - SDK/Cliente: `fetch()` nativo do Node.js (sem pacote externo)
  - Endpoint: `https://api.search.brave.com/res/v1/web/search`
  - Auth: `BRAVE_API_KEY` (variavel de ambiente)
  - Implementacao: `get-shit-done/bin/lib/commands.cjs` funcao `cmdWebsearch()` (linha 320)
  - Dispatcher: `get-shit-done/bin/gsd-tools.cjs` case `websearch` (linha 576)
  - Comportamento: Se `BRAVE_API_KEY` nao esta definida, retorna silenciosamente `{ available: false }` e o agente usa WebSearch built-in da CLI de AI
  - Nao presente no UP (UP nao possui funcionalidade de websearch)

**npm Registry (GSD apenas):**
- Servico: npm - Verificacao de atualizacoes do pacote
  - Cliente: Processo filho `npm view get-shit-done-cc version`
  - Implementacao: `hooks/gsd-check-update.js` (SessionStart hook)
  - Comportamento: Roda em background (spawn detached), grava resultado em `~/.claude/cache/gsd-update-check.json`
  - Timeout: 10 segundos para o `npm view`
  - Nao presente no UP (UP nao possui verificacao de atualizacao)

## Armazenamento de Dados

**Bancos de Dados:**
- Nenhum. O sistema e inteiramente baseado em arquivos

**Sistema de Arquivos (armazenamento primario):**
- **Documentos de planejamento:** Arquivos Markdown em `.plano/` (UP) ou `.planning/` (GSD) no projeto-alvo
  - `STATE.md` - Estado atual do projeto
  - `ROADMAP.md` - Fases e progresso
  - `PROJECT.md` - Descricao do projeto
  - `REQUIREMENTS.md` - Requisitos
  - `config.json` - Configuracao do projeto
  - `fases/NN-slug/` (UP) ou `phases/NN-slug/` (GSD) - Planos e sumarios por fase

- **Configuracao instalada:** Arquivos em `~/.claude/` (ou equivalente por runtime)
  - `up/` ou `get-shit-done/` - Codigo do sistema
  - `agents/up-*.md` ou `agents/gsd-*.md` - Definicoes de agentes
  - `commands/up/` ou `commands/gsd/` - Slash commands
  - `hooks/up-*.js` ou `hooks/gsd-*.js` - Hooks
  - `settings.json` - Configuracao de hooks e statusline

- **Arquivos temporarios:**
  - `/tmp/claude-ctx-{session_id}.json` - Bridge file entre statusline e context-monitor hooks
  - `/tmp/claude-ctx-{session_id}-warned.json` - Estado de debounce do context-monitor
  - `/tmp/up-{timestamp}.json` ou `/tmp/gsd-{timestamp}.json` - Output overflow quando JSON > 50KB (protocolo `@file:`)

**Cache:**
- `~/.claude/cache/gsd-update-check.json` - Cache de verificacao de atualizacao (GSD apenas)

## Autenticacao e Identidade

**Provedor de Auth:**
- Nao aplicavel. O sistema roda localmente como extensao de CLIs de AI existentes
- Nenhuma autenticacao propria
- Depende da autenticacao da CLI hospedeira (Claude Code, Gemini, OpenCode)

## Monitoramento e Observabilidade

**Rastreamento de Erros:**
- Nenhum servico externo. Erros sao tratados localmente:
  - `process.stderr.write()` para erros em CLI tools
  - `process.exit(0)` silencioso em hooks (nunca bloqueia a CLI hospedeira)
  - Try/catch em todos os hooks com saida silenciosa em caso de falha

**Logs:**
- Sem sistema de logging estruturado
- Output direto via `process.stdout.write()` para resultados JSON
- `console.log()` com ANSI colors no installer para feedback visual
- Hooks escrevem para stdout no formato esperado pela CLI hospedeira

**Context Monitoring (runtime):**
- `up/hooks/up-statusline.js` / `hooks/gsd-statusline.js` - Exibe modelo, tarefa atual, diretorio, e uso de contexto na statusline
- `up/hooks/up-context-monitor.js` / `hooks/gsd-context-monitor.js` - Injeta warnings quando contexto esta baixo (PostToolUse hook)
- Thresholds: WARNING em <= 35% remaining, CRITICAL em <= 25% remaining
- Debounce: 5 tool uses entre warnings para evitar spam

## CI/CD e Deploy

**Hospedagem do Codigo:**
- GitHub: `https://github.com/Ecoupdigital/up-cc` (UP)
- GitHub: `https://github.com/glittercowboy/get-shit-done` (GSD)
- Codeowner: `@glittercowboy`
- Financiamento: GitHub Sponsors (`@glittercowboy`)

**Pipeline CI:**
- GitHub Actions: `.github/workflows/test.yml`
  - Trigger: push/PR para `main`, manual dispatch
  - Matrix: 3 OS (ubuntu, macos, windows) x 3 Node (18, 20, 22) = 9 jobs
  - Steps: checkout, setup-node (com cache npm), `npm ci`, coverage (`npm run test:coverage`) em Node 20+, basic test (`npm test`) em Node 18
  - Concurrency: cancela runs anteriores para mesmo PR
  - Timeout: 10 minutos por job

- GitHub Actions: `.github/workflows/auto-label-issues.yml`
  - Trigger: novas issues
  - Acao: adiciona label `needs-triage` automaticamente

**Distribuicao npm:**
- GSD: `npm publish` a partir do root (usa `prepublishOnly` para `npm run build:hooks`)
- UP: `npm publish` a partir de `up/` (sem build step)
- Ambos publicados no npm registry publico

## Integracoes com CLIs de AI

O sistema se integra profundamente com tres CLIs de AI como extensao/plugin:

**Claude Code (`~/.claude/`):**
- Slash commands: `commands/up/*.md` (YAML frontmatter + Markdown)
- Agentes: `agents/up-*.md` (YAML frontmatter com name, tools, model, color)
- Hooks: StatusLine (command hook), PostToolUse (context monitor)
- Configuracao: `settings.json` (statusLine, hooks.PostToolUse)
- Tools disponveis: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, TodoWrite, AskUserQuestion, Task (subagent)

**Gemini CLI (`~/.gemini/`):**
- Comandos convertidos para TOML: `.toml` files
- Agentes com tools convertidos para nomes Gemini (Read -> read_file, Write -> write_file, etc.)
- Color removido do frontmatter (nao suportado)
- `${VAR}` escapado para `$VAR` (conflito com template engine)
- Mapeamento de tools: `get-shit-done/bin/lib/commands.cjs` ou `up/bin/install.js` (objetos `claudeToGeminiTools`)

**OpenCode (`~/.config/opencode/`):**
- Comandos flattened: `commands/up/foo.md` -> `command/up-foo.md`
- Agentes com tools como objeto (`tool: true`), color como hex, name removido
- `/up:` convertido para `/up-` nos comandos
- Mapeamento de tools: `claudeToOpencodeTools` em `up/bin/install.js`

**Codex CLI (GSD apenas):**
- Config.toml gerado com sandbox levels por agente
- Mapeamento em `bin/install.js` (`CODEX_AGENT_SANDBOX` objeto)

## Webhooks e Callbacks

**Entrada:**
- Nenhum. O sistema nao recebe webhooks

**Saida:**
- Nenhum. O sistema nao envia webhooks

## Comunicacao Inter-Processo

**Protocolo Statusline <-> Context Monitor:**
- O hook statusline escreve metricas de contexto em `/tmp/claude-ctx-{session_id}.json`
- O hook context-monitor le este arquivo bridge para decidir quando injetar warnings
- Dados: `session_id`, `remaining_percentage`, `used_pct`, `timestamp`
- Staleness: metricas com mais de 60 segundos sao ignoradas

**Protocolo @file: para Large Output:**
- Quando output JSON excede 50KB, o CLI escreve para arquivo temporario
- Retorna `@file:/tmp/up-{timestamp}.json` como output
- Implementado em `up/bin/lib/core.cjs` funcao `output()` (linha 23) e `get-shit-done/bin/lib/core.cjs` funcao `output()` (linha 35)

**Comunicacao CLI <-> Git:**
- `up/bin/lib/core.cjs` funcao `execGit()` - Wrapper para `execSync('git ...')`
- Usado para: commits automatizados de docs de planejamento, verificacao de gitignore, status de repo
