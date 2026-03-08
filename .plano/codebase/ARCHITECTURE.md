# Arquitetura

**Data da Analise:** 2026-03-08

## Visao Geral do Padrao

**Geral:** Meta-prompting system com arquitetura command-workflow-agent orquestrada por CLI tools

O repositorio contem dois sistemas paralelos publicados como pacotes npm separados:
- **GSD (Get Shit Done)** -- `get-shit-done-cc` v1.22.x, sistema original em ingles
- **UP** -- `up-cc` v0.1.x, fork simplificado em portugues

Ambos seguem o mesmo padrao arquitetural: **slash commands** definem entry points, **workflows** orquestram processos multi-step, **agents** executam trabalho especializado como subagentes, e uma **CLI de ferramentas** (Node.js) gerencia estado, roadmap e git.

**Caracteristicas Chave:**
- Nenhum servidor ou runtime persistente -- tudo executa como meta-prompts dentro de LLM CLI tools (Claude Code, Gemini CLI, OpenCode)
- Comando -> Workflow -> Agent(s) -> CLI Tools como cadeia de execucao
- Estado gerenciado por arquivos markdown (STATE.md, ROADMAP.md) manipulados pela CLI
- Paralelismo via spawn de subagentes (Task tool) com contexto fresco
- Installer converte formatos entre runtimes (Claude -> Gemini TOML, OpenCode flat)

## Camadas

**Camada 1: Commands (Entry Points)**
- Proposito: Definir slash commands que usuarios invocam diretamente nas ferramentas CLI
- Localizacao GSD: `commands/gsd/*.md`
- Localizacao UP: `up/commands/*.md` (fonte canonica), `commands/up/*.md` (duplicatas para install raiz)
- Contem: Arquivos markdown com frontmatter YAML (name, description, allowed-tools) e corpo estruturado em XML (`<objective>`, `<execution_context>`, `<context>`, `<process>`)
- Depende de: Workflows (referenciados via `@~/.claude/up/workflows/...`)
- Usado por: LLM CLI tools (Claude Code, Gemini, OpenCode) que registram como slash commands

**Camada 2: Workflows (Orquestracao)**
- Proposito: Definir processos multi-step que os commands executam
- Localizacao GSD: `get-shit-done/workflows/*.md`
- Localizacao UP: `up/workflows/*.md`
- Contem: Markdown estruturado com `<step>` tags, bash snippets para CLI tools, logica de spawn de agentes
- Depende de: CLI Tools (up-tools.cjs), Agents (spawned via Task), References
- Usado por: Commands (carregados via `@file` references no execution_context)

**Camada 3: Agents (Subagentes Especializados)**
- Proposito: Executar trabalho especializado com contexto fresco (200k tokens limpo)
- Localizacao GSD: `agents/gsd-*.md`
- Localizacao UP: `up/agents/up-*.md` (fonte canonica), `agents/up-*.md` (duplicatas)
- Contem: Markdown com frontmatter YAML (name, description, tools, model, color) e instrucoes detalhadas
- Depende de: CLI Tools, References, Codebase real do projeto usuario
- Usado por: Workflows (spawned como subagentes via `Task(subagent_type="up-*")`)

**Camada 4: CLI Tools (Gerenciamento de Estado)**
- Proposito: Operacoes atomicas de estado -- init, roadmap, phase, state, commit, progress
- Localizacao GSD: `get-shit-done/bin/gsd-tools.cjs` + `get-shit-done/bin/lib/*.cjs` (12 modulos, ~6000 linhas)
- Localizacao UP: `up/bin/up-tools.cjs` (~1361 linhas) + `up/bin/lib/core.cjs` (~270 linhas)
- Contem: Node.js CommonJS, recebe JSON via stdin ou args, retorna JSON via stdout
- Depende de: Sistema de arquivos (.plano/), git
- Usado por: Workflows e Agents (invocado via `node "$HOME/.claude/up/bin/up-tools.cjs" <command>`)

**Camada 5: Hooks (Monitoramento Runtime)**
- Proposito: Statusline e context monitoring dentro do Claude Code
- Localizacao GSD: `hooks/gsd-*.js`
- Localizacao UP: `up/hooks/up-*.js`
- Contem: Node.js puro, le JSON do stdin (dados da sessao Claude Code), escreve para stdout
- Depende de: Claude Code hook protocol (stdin JSON com session_id, context_window, model)
- Usado por: Claude Code settings.json (statusLine e PostToolUse hooks)

**Camada 6: Installer (Distribuicao)**
- Proposito: Copiar e converter arquivos para diretorios de config dos CLI tools
- Localizacao GSD: `bin/install.js` (~88k, 1 arquivo monolitico)
- Localizacao UP: `up/bin/install.js` (~825 linhas)
- Contem: Node.js com conversao de frontmatter, path replacement, runtime-specific transforms
- Depende de: Pacote npm completo
- Usado por: `npx up-cc` ou `node bin/install.js`

**Camada 7: References e Templates**
- Proposito: Documentos compartilhados carregados por workflows e agents em runtime
- Localizacao GSD: `get-shit-done/references/*.md`, `get-shit-done/templates/*.md`
- Localizacao UP: `up/references/*.md`, `up/templates/*.md`
- Contem: Markdown com diretrizes, padroes, formatos de template
- Depende de: Nada (documentos estaticos)
- Usado por: Workflows (via `@file` references), Agents (lidos sob demanda)

## Fluxo de Dados

**Fluxo Principal: Ciclo de Vida do Projeto**

1. **Inicializacao** (`/up:novo-projeto`):
   - Workflow conduz questionamento interativo com usuario
   - Spawn 4x `up-pesquisador-projeto` em paralelo para pesquisa de dominio
   - Spawn `up-sintetizador` para consolidar pesquisa
   - Spawn `up-roteirista` para criar ROADMAP.md e STATE.md
   - CLI tools commitam cada artefato atomicamente

2. **Planejamento** (`/up:planejar-fase X`):
   - Workflow carrega contexto via `up-tools.cjs init plan-phase`
   - Spawn `up-planejador` com contexto completo (ROADMAP, STATE, REQUIREMENTS, CONTEXT)
   - Planejador faz research inline se necessario, cria PLAN.md files
   - Planejador roda self-check interno antes de retornar

3. **Execucao** (`/up:executar-fase X`):
   - Workflow descobre planos e agrupa em waves (dependencias)
   - Por wave: spawn N `up-executor` em paralelo
   - Cada executor le seu PLAN.md, executa tarefas, commit por tarefa, cria SUMMARY.md
   - Apos todas waves: spawn `up-verificador` para validacao goal-backward
   - CLI tools atualizam ROADMAP.md e STATE.md

4. **Verificacao** (`/up:verificar-trabalho X`):
   - Workflow apresenta testes um por vez ao usuario
   - Usuario responde "passou" ou descreve problema
   - Cria UAT.md com resultados
   - Se gaps: encaminha para `/up:planejar-fase X --gaps`

**Fluxo de Spawn de Agentes:**

```
Command -> Workflow -> Task(subagent_type="up-*") -> Agent
                                                       |
                                     Agent le PLAN.md, executa, retorna resultado
                                                       |
                        Workflow <- resultado estruturado (## PLANNING COMPLETE, etc.)
```

**Gerenciamento de Estado:**
- `.plano/STATE.md` -- posicao atual, progresso, decisoes, bloqueios (lido primeiro em todo workflow)
- `.plano/ROADMAP.md` -- fases, criterios de sucesso, progresso por plano
- `.plano/REQUIREMENTS.md` -- requisitos com REQ-IDs e rastreabilidade
- `.plano/PROJECT.md` -- contexto completo do projeto
- `.plano/config.json` -- configuracoes (modo, granularidade, paralelizacao)
- `.plano/fases/XX-nome/` -- artefatos por fase (CONTEXT, PLAN, SUMMARY, VERIFICATION)

**Protocolo @file: para outputs grandes:**
- Quando output JSON > 50KB, CLI tools escrevem para arquivo temp e retornam `@file:/tmp/up-*.json`
- Workflows detectam com `if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi`

## Abstracoes Chave

**Command (Slash Command):**
- Proposito: Entry point invocavel pelo usuario
- Exemplos: `up/commands/novo-projeto.md`, `up/commands/executar-fase.md`, `up/commands/rapido.md`
- Padrao: Frontmatter YAML define metadata + corpo XML define objetivo/contexto/processo
- Formato de nome: `up:nome-do-comando` (Claude/Gemini) ou `up-nome-do-comando` (OpenCode)

**Workflow (Processo Multi-Step):**
- Proposito: Orquestracao detalhada com steps, gates e spawn de agentes
- Exemplos: `up/workflows/novo-projeto.md`, `up/workflows/executar-fase.md`
- Padrao: `<process>` com `<step>` tags, cada step com logica bash + UI output
- Cada command referencia exatamente um workflow via `@~/.claude/up/workflows/*.md`

**Agent (Subagente Especializado):**
- Proposito: Unidade de trabalho com contexto fresco e ferramentas especificas
- Exemplos: `up/agents/up-executor.md`, `up/agents/up-planejador.md`
- Padrao: Frontmatter (name, tools, model, color) + instrucoes detalhadas com `<role>`, `<execution_flow>`, `<success_criteria>`
- 8 agentes UP: executor, planejador, roteirista, verificador, pesquisador-projeto, sintetizador, depurador, mapeador-codigo

**PLAN.md (Prompt Executavel):**
- Proposito: Prompt que um executor Claude segue literalmente
- Padrao: Frontmatter YAML (phase, plan, wave, depends_on, requirements, must_haves) + tarefas `<task>` com files/action/verify/done
- Localizacao: `.plano/fases/XX-nome/XX-YY-PLAN.md`

**SUMMARY.md (Resultado de Execucao):**
- Proposito: Documentar o que foi realmente feito (para verificacao e contexto futuro)
- Padrao: Frontmatter com dependency graph + tech stack + key files + decisions + metrics
- Localizacao: `.plano/fases/XX-nome/XX-YY-SUMMARY.md`

**Init JSON (Contexto de Inicializacao):**
- Proposito: Carregar todo contexto necessario em uma unica chamada CLI
- Padrao: `up-tools.cjs init <workflow> [args]` retorna JSON com paths, flags, estado
- Cada workflow tem seu proprio `init` que retorna campos especificos

## Pontos de Entrada

**Ponto de Entrada do Usuario: Slash Commands**
- Localizacao: `up/commands/*.md` (13 comandos)
- Gatilhos: Usuario digita `/up:nome-comando` no Claude Code, Gemini ou OpenCode
- Responsabilidades: Parsear argumentos, referenciar workflow, definir allowed-tools

**Ponto de Entrada CLI: up-tools.cjs**
- Localizacao: `up/bin/up-tools.cjs`
- Gatilhos: Invocado por workflows e agents via `node "$HOME/.claude/up/bin/up-tools.cjs" <command> [args]`
- Responsabilidades: Gerenciar estado (.plano/), manipular ROADMAP/STATE/REQUIREMENTS, git commits, progress tracking
- Comandos: `init`, `state`, `roadmap`, `phase`, `config`, `requirements`, `commit`, `progress`, `timestamp`, `slug`, `summary-extract`, `state-snapshot`

**Ponto de Entrada de Instalacao: install.js**
- Localizacao: `up/bin/install.js`
- Gatilhos: `npx up-cc`, `node install.js --claude --global`
- Responsabilidades: Copiar arquivos, converter frontmatter entre runtimes, configurar hooks

**Ponto de Entrada de Hooks: StatusLine e Context Monitor**
- Localizacao: `up/hooks/up-statusline.js`, `up/hooks/up-context-monitor.js`
- Gatilhos: Claude Code invoca automaticamente (statusLine a cada render, PostToolUse apos cada tool call)
- Responsabilidades: Exibir barra de progresso de contexto, alertar quando contexto baixo

## Tratamento de Erros

**Estrategia:** Fail-fast com mensagens prescritivas

- CLI Tools (`up-tools.cjs`): `error()` escreve para stderr e `process.exit(1)`. Validacao de entrada rigorosa.
- Workflows: Verificam retorno do init JSON (ex: `phase_found=false` -> erro com orientacao)
- Agents: Regras de desvio (Regras 1-4) tratam erros durante execucao:
  - Regras 1-3: Auto-corrigir bugs, funcionalidade critica faltante, bloqueantes
  - Regra 4: PARAR e perguntar ao usuario para decisoes arquiteturais
- Hooks: `try/catch` silencioso com `process.exit(0)` -- nunca devem crashar o Claude Code
- Checkpoints: Mecanismo formal para pausar execucao quando input humano necessario

## Preocupacoes Transversais

**Logging:**
- Nao ha sistema de logging centralizado
- CLI Tools: stderr para erros, stdout para resultados JSON
- Hooks: Falham silenciosamente (catch vazio)
- Agentes: Documentam desvios no SUMMARY.md

**Validacao:**
- Workflows validam via init JSON (existencia de .plano/, ROADMAP.md, STATE.md, fase encontrada)
- Agentes planejadores rodam self-check interno antes de retornar
- Verificador (up-verificador) faz validacao goal-backward em 3 niveis: existencia, substancia, conectividade

**Commits Atomicos:**
- Toda escrita significativa e commitada via `up-tools.cjs commit`
- Nunca `git add .` ou `git add -A` -- sempre arquivos individuais listados
- Formato: `{tipo}({fase}-{plano}): {descricao}` (ex: `feat(03-02): criar endpoint de auth`)
- Commits de tarefa (codigo) separados de commits de metadados (SUMMARY, STATE, ROADMAP)

**Gerenciamento de Contexto:**
- Context window tracking via hooks (statusline mostra %, context-monitor alerta quando baixo)
- Agentes spawnados com contexto fresco (200k tokens cada)
- Regra de 50%: planos devem completar dentro de ~50% do contexto disponivel
- `@file:` protocol para outputs > 50KB
- `/up:pausar` cria `.continue-aqui.md` para restauracao de contexto entre sessoes

**Multi-Runtime:**
- Installer converte entre formatos:
  - Claude Code: formato nativo (markdown com YAML frontmatter)
  - Gemini CLI: tools como YAML array, sem color, `${VAR}` escapado, commands em TOML
  - OpenCode: tools como objeto, color em hex, sem name, commands achatados (`commands/up/foo.md` -> `command/up-foo.md`)
- Path replacement: `$HOME/.claude/` -> path correto do runtime alvo

## Relacao GSD vs UP

**GSD (Get Shit Done)** e o sistema original, mais complexo:
- 32 commands (GSD) vs 13 commands (UP)
- 12 agents (GSD) vs 8 agents (UP) -- removidos: integration-checker, nyquist-auditor, phase-researcher, plan-checker
- CLI modularizada em 12 arquivos lib (~6000 linhas) vs CLI consolidada em 2 arquivos (~1630 linhas)
- Conceito de "milestones" (GSD) removido no UP
- Mais workflows (36 GSD vs 10 UP)
- GSD tem testes (`tests/*.test.cjs`) -- UP nao tem testes ainda
- GSD tem build step (hooks compilados com esbuild) -- UP publica direto

**UP simplifica** ao:
- Mesclar plan-checker e phase-researcher no planejador (self-check interno)
- Remover milestones (apenas fases)
- Consolidar CLI em menos arquivos
- Texto em portugues brasileiro
- Planning dir `.plano/` em vez de `.planning/`
