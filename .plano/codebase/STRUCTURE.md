# Estrutura do Codebase

**Data da Analise:** 2026-03-08

## Layout de Diretorios

```
up-dev-code/                          # Raiz do monorepo (pacote GSD npm)
├── package.json                      # GSD: get-shit-done-cc v1.22.4
├── package-lock.json                 # Lockfile npm
├── CLAUDE.md                         # Instrucoes do projeto para Claude Code
├── README.md                         # Documentacao do GSD
├── CHANGELOG.md                      # Historico de versoes do GSD
├── LICENSE                           # MIT
├── SECURITY.md                       # Politica de seguranca
├── .gitignore                        # Ignora node_modules, .claude/, hooks/dist/, coverage/
│
├── up/                               # === SISTEMA UP (pacote npm separado: up-cc) ===
│   ├── package.json                  # up-cc v0.1.2
│   ├── bin/                          # CLI executavel
│   │   ├── install.js                # Installer multi-runtime (825 linhas)
│   │   ├── up-tools.cjs              # CLI de ferramentas (1361 linhas)
│   │   └── lib/
│   │       └── core.cjs              # Utilitarios compartilhados (270 linhas)
│   ├── agents/                       # 8 agentes subagente (fonte canonica)
│   │   ├── up-executor.md
│   │   ├── up-planejador.md
│   │   ├── up-roteirista.md
│   │   ├── up-verificador.md
│   │   ├── up-pesquisador-projeto.md
│   │   ├── up-sintetizador.md
│   │   ├── up-depurador.md
│   │   └── up-mapeador-codigo.md
│   ├── commands/                     # 13 slash commands (fonte canonica)
│   │   ├── novo-projeto.md
│   │   ├── mapear-codigo.md
│   │   ├── discutir-fase.md
│   │   ├── planejar-fase.md
│   │   ├── executar-fase.md
│   │   ├── verificar-trabalho.md
│   │   ├── rapido.md
│   │   ├── progresso.md
│   │   ├── retomar.md
│   │   ├── pausar.md
│   │   ├── adicionar-fase.md
│   │   ├── remover-fase.md
│   │   └── ajuda.md
│   ├── workflows/                    # 10 workflows de orquestracao
│   │   ├── novo-projeto.md
│   │   ├── mapear-codigo.md
│   │   ├── discutir-fase.md
│   │   ├── planejar-fase.md
│   │   ├── executar-fase.md
│   │   ├── executar-plano.md
│   │   ├── verificar-trabalho.md
│   │   ├── rapido.md
│   │   ├── retomar.md
│   │   ├── pausar.md
│   │   └── progresso.md
│   ├── templates/                    # 6 templates markdown
│   │   ├── project.md
│   │   ├── requirements.md
│   │   ├── roadmap.md
│   │   ├── state.md
│   │   ├── summary.md
│   │   └── continue-here.md
│   ├── references/                   # 4 documentos de referencia
│   │   ├── checkpoints.md
│   │   ├── git-integration.md
│   │   ├── questioning.md
│   │   └── ui-brand.md
│   └── hooks/                        # 2 hooks Claude Code
│       ├── up-statusline.js
│       └── up-context-monitor.js
│
├── commands/                         # === COMMANDS INSTALADOS NA RAIZ ===
│   ├── gsd/                          # 32 commands GSD
│   │   ├── new-project.md
│   │   ├── plan-phase.md
│   │   ├── execute-phase.md
│   │   ├── quick.md
│   │   └── ... (28 outros)
│   └── up/                           # 12 commands UP (duplicatas de up/commands/)
│       ├── novo-projeto.md
│       ├── planejar-fase.md
│       └── ... (10 outros)
│
├── agents/                           # === AGENTS INSTALADOS NA RAIZ ===
│   ├── gsd-*.md                      # 12 agents GSD
│   │   ├── gsd-executor.md
│   │   ├── gsd-planner.md
│   │   └── ... (10 outros)
│   └── up-*.md                       # 7 agents UP (duplicatas de up/agents/)
│       ├── up-executor.md
│       ├── up-planejador.md
│       └── ... (5 outros)
│
├── get-shit-done/                    # === SISTEMA GSD ===
│   ├── bin/
│   │   ├── gsd-tools.cjs             # CLI GSD (592 linhas, dispatcher)
│   │   └── lib/                      # 12 modulos (~6000 linhas total)
│   │       ├── core.cjs              # Utilitarios base
│   │       ├── init.cjs              # Inicializacao de workflows
│   │       ├── state.cjs             # Gerenciamento de estado
│   │       ├── roadmap.cjs           # Operacoes de roadmap
│   │       ├── phase.cjs             # Operacoes de fase
│   │       ├── commands.cjs          # Comandos CLI
│   │       ├── config.cjs            # Configuracao
│   │       ├── frontmatter.cjs       # Parsing de frontmatter
│   │       ├── milestone.cjs         # Milestones (removido no UP)
│   │       ├── verify.cjs            # Verificacao
│   │       └── template.cjs          # Geracao de templates
│   ├── workflows/                    # 36 workflows GSD
│   ├── templates/                    # 22 templates GSD
│   │   ├── codebase/                 # Templates de mapeamento
│   │   └── research-project/         # Templates de pesquisa
│   └── references/                   # 14 referencias GSD
│
├── hooks/                            # Hooks GSD (3 arquivos JS fonte)
│   ├── gsd-statusline.js
│   ├── gsd-context-monitor.js
│   └── gsd-check-update.js
│
├── bin/                              # Installer GSD
│   └── install.js                    # Installer monolitico (~88KB)
│
├── scripts/                          # Scripts de build/test GSD
│   ├── build-hooks.js                # Compila hooks com esbuild
│   └── run-tests.cjs                 # Test runner customizado
│
├── tests/                            # Testes do GSD (16 arquivos)
│   ├── helpers.cjs                   # Helpers de teste
│   ├── core.test.cjs
│   ├── init.test.cjs
│   ├── state.test.cjs
│   ├── phase.test.cjs
│   ├── roadmap.test.cjs
│   ├── commands.test.cjs
│   ├── config.test.cjs
│   ├── frontmatter.test.cjs
│   ├── frontmatter-cli.test.cjs
│   ├── agent-frontmatter.test.cjs
│   ├── milestone.test.cjs
│   ├── verify.test.cjs
│   ├── verify-health.test.cjs
│   ├── dispatcher.test.cjs
│   └── codex-config.test.cjs
│
├── docs/                             # Documentacao complementar
├── assets/                           # Assets visuais (banner, etc.)
│
├── .github/
│   ├── ISSUE_TEMPLATE/               # Templates de issue
│   └── workflows/                    # GitHub Actions CI
│
└── .plano/                           # Diretorio de planejamento deste projeto
    └── codebase/                     # Documentos de mapeamento do codebase
```

## Propositos dos Diretorios

**`up/` (Sistema UP - Self-contained)**
- Proposito: Pacote npm `up-cc` completo e autocontido
- Contem: Tudo necessario para o sistema UP funcionar -- CLI, agentes, comandos, workflows, templates, referencias, hooks
- Arquivos chave: `up/package.json`, `up/bin/install.js`, `up/bin/up-tools.cjs`
- **Este e o diretorio raiz do pacote npm `up-cc`**. Quando usuario instala via `npx up-cc`, e este diretorio que e publicado.

**`up/bin/` (CLI Executavel)**
- Proposito: Codigo Node.js que gerencia estado, roadmap, fases, commits, progresso
- Contem: `install.js` (installer multi-runtime), `up-tools.cjs` (CLI principal), `lib/core.cjs` (utilitarios)
- Arquivos chave: `up/bin/up-tools.cjs` (1361 linhas -- toda logica de estado)

**`up/agents/` (Agentes Subagente)**
- Proposito: Definicoes de agentes especializados spawned por workflows
- Contem: 8 arquivos markdown com frontmatter YAML e instrucoes detalhadas
- Arquivos chave: `up-executor.md` (execucao de planos), `up-planejador.md` (criacao de planos)
- **Nota:** Estes sao a fonte canonica. `agents/up-*.md` na raiz sao copias para instalacao direta.

**`up/commands/` (Slash Commands)**
- Proposito: Entry points que usuarios digitam no CLI tool
- Contem: 13 arquivos markdown com frontmatter e estrutura XML
- Arquivos chave: `novo-projeto.md`, `executar-fase.md`, `planejar-fase.md`, `rapido.md`
- **Nota:** Estes sao a fonte canonica. `commands/up/*.md` na raiz sao copias.

**`up/workflows/` (Orquestracao)**
- Proposito: Logica detalhada de processos multi-step
- Contem: 10 workflows (alguns comandos nao tem workflow proprio, como ajuda)
- Arquivos chave: `novo-projeto.md` (~560 linhas), `executar-fase.md` (~270 linhas), `planejar-fase.md` (~210 linhas)
- **Nota:** `executar-plano.md` e carregado por agentes executores, nao diretamente por commands

**`up/templates/` (Templates Markdown)**
- Proposito: Formatos de referencia para artefatos que o sistema cria
- Contem: Templates para PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, SUMMARY.md, continue-here.md
- Usado por: Agentes roteirista, planejador, executor quando criam artefatos

**`up/references/` (Documentos de Referencia)**
- Proposito: Diretrizes compartilhadas carregadas por workflows/agentes em runtime
- Contem: `checkpoints.md` (protocolo de checkpoints), `git-integration.md` (padroes git), `questioning.md` (tecnicas de questionamento), `ui-brand.md` (formatacao visual)
- Carregados via `@~/.claude/up/references/*.md` nos execution_context de commands

**`up/hooks/` (Hooks Claude Code)**
- Proposito: Statusline e monitoramento de contexto no Claude Code
- Contem: `up-statusline.js` (barra de progresso de contexto), `up-context-monitor.js` (alertas de contexto baixo)
- Instalados em `~/.claude/hooks/` pelo installer

**`get-shit-done/` (Sistema GSD)**
- Proposito: Sistema original em ingles, publicado como `get-shit-done-cc`
- Contem: CLI modularizada, 36 workflows, 22 templates, 14 referencias
- Relacao com UP: UP e derivado do GSD, simplificado e traduzido para portugues

**`commands/` e `agents/` (Raiz)**
- Proposito: Copias de commands/agents para instalacao direta quando repo e clonado localmente
- Contem: Duplicatas de `up/commands/` e `up/agents/` + originais do GSD
- **Cuidado:** Ao modificar commands/agents UP, edite em `up/commands/` e `up/agents/` (fontes canonicas), nao nas copias da raiz

**`tests/` (Testes GSD)**
- Proposito: Testes unitarios do sistema GSD (sem testes UP ainda)
- Contem: 16 arquivos `.test.cjs` usando runner customizado (`scripts/run-tests.cjs`)
- Arquivos chave: `helpers.cjs` (setup compartilhado)

**`scripts/` (Build/Test GSD)**
- Proposito: Scripts de build e execucao de testes do GSD
- Contem: `build-hooks.js` (compila hooks com esbuild para hooks/dist/), `run-tests.cjs` (test runner)

## Localizacoes Chave

**Entry Points:**
- `up/bin/install.js`: Installer principal do UP (invocado por `npx up-cc`)
- `up/bin/up-tools.cjs`: CLI de ferramentas (invocado por workflows/agentes)
- `up/commands/*.md`: Slash commands registrados no CLI tool
- `bin/install.js`: Installer do GSD (invocado por `npx get-shit-done-cc`)

**Configuracao:**
- `package.json`: Config npm do GSD (raiz)
- `up/package.json`: Config npm do UP
- `.gitignore`: Arquivos ignorados pelo git
- `CLAUDE.md`: Instrucoes do projeto para Claude Code

**Logica Core UP:**
- `up/bin/up-tools.cjs`: Toda logica de estado (init, state, roadmap, phase, commit, progress)
- `up/bin/lib/core.cjs`: Utilitarios compartilhados (output, error, loadConfig, git, phase utils)
- `up/bin/install.js`: Conversao entre runtimes, path replacement, frontmatter conversion

**Logica Core GSD:**
- `get-shit-done/bin/gsd-tools.cjs`: Dispatcher CLI (delega para lib/)
- `get-shit-done/bin/lib/init.cjs`: Inicializacao de workflows (~710 linhas)
- `get-shit-done/bin/lib/state.cjs`: Gerenciamento de STATE.md (~721 linhas)
- `get-shit-done/bin/lib/phase.cjs`: Operacoes de fase (~901 linhas)

**Workflows Criticos UP:**
- `up/workflows/novo-projeto.md`: Inicializacao completa (~560 linhas)
- `up/workflows/executar-fase.md`: Execucao paralela por waves (~270 linhas)
- `up/workflows/executar-plano.md`: Execucao de plano individual (~190 linhas)
- `up/workflows/planejar-fase.md`: Planejamento com self-check (~210 linhas)

**Agentes Criticos UP:**
- `up/agents/up-executor.md`: Execucao de PLAN.md com commits atomicos (~410 linhas)
- `up/agents/up-planejador.md`: Criacao de planos com research inline (~390 linhas)
- `up/agents/up-roteirista.md`: Criacao de ROADMAP.md (~400 linhas)
- `up/agents/up-verificador.md`: Verificacao goal-backward (~360 linhas)

## Onde Adicionar Novo Codigo

**Novo Comando UP:**
1. Criar command em `up/commands/nome-comando.md` (frontmatter YAML + corpo XML)
2. Criar workflow em `up/workflows/nome-comando.md` (se necessario)
3. Copiar command para `commands/up/nome-comando.md` (para instalacao local)
4. Adicionar a lista na ajuda: `up/commands/ajuda.md`
5. Atualizar contagem no CLAUDE.md se relevante

**Novo Agente UP:**
1. Criar agent em `up/agents/up-nome.md` (frontmatter YAML + instrucoes)
2. Copiar para `agents/up-nome.md` (para instalacao local)
3. Referenciar no workflow que o spawn via `subagent_type="up-nome"`

**Novo Subcomando CLI UP:**
1. Adicionar case no switch de `main()` em `up/bin/up-tools.cjs`
2. Implementar funcao `cmdNomeComando(cwd, args, raw)` no mesmo arquivo
3. Se logica compartilhada necessaria, adicionar em `up/bin/lib/core.cjs`

**Novo Template UP:**
1. Criar template em `up/templates/nome.md`
2. Referenciar no agente/workflow que o utiliza

**Novo Reference UP:**
1. Criar reference em `up/references/nome.md`
2. Referenciar via `@~/.claude/up/references/nome.md` no execution_context do command

**Novo Hook UP:**
1. Criar hook em `up/hooks/up-nome.js` (Node.js puro, le JSON de stdin, escreve stdout)
2. Atualizar installer `up/bin/install.js` para:
   - Copiar hook para `~/.claude/hooks/`
   - Configurar em `settings.json` se necessario

**Novo Teste GSD:**
1. Criar `tests/nome.test.cjs` usando runner customizado
2. Importar helpers de `tests/helpers.cjs`
3. Executar: `node tests/nome.test.cjs`

**Nova Feature que Afeta Ambos Sistemas (GSD + UP):**
- GSD: Implementar no modulo `get-shit-done/bin/lib/` apropriado
- UP: Implementar equivalente simplificado em `up/bin/up-tools.cjs`
- Manter paridade conceitual, mas UP pode simplificar/omitir features

## Convencoes de Nomeacao

**Arquivos:**
- Commands: `nome-do-comando.md` (kebab-case, portugues para UP, ingles para GSD)
- Agents: `up-nome.md` (prefixo `up-` para UP, `gsd-` para GSD)
- Workflows: `nome-do-workflow.md` (mesmo nome do command correspondente)
- Hooks: `up-nome.js` (prefixo `up-`)
- CLI: `.cjs` extensao (CommonJS obrigatorio)

**Slash Commands:**
- UP: `/up:nome-comando` (dois pontos como separador, ex: `/up:executar-fase`)
- GSD: `/gsd:nome-command` (ex: `/gsd:execute-phase`)
- OpenCode: `/up-nome-comando` (hifen como separador, achatado)

**Diretorio de Planejamento (no projeto do usuario):**
- UP: `.plano/` (portugues)
- GSD: `.planning/` (ingles)

**Artefatos de Fase:**
- Diretorio: `.plano/fases/XX-slug/` (XX = numero com padding, slug = nome kebab-case)
- Plans: `XX-YY-PLAN.md` (XX = fase, YY = plano)
- Summaries: `XX-YY-SUMMARY.md`
- Context: `XX-CONTEXT.md`
- Verification: `XX-VERIFICATION.md`
- UAT: `XX-UAT.md`

**Commits:**
- `feat(XX-YY): descricao` -- nova funcionalidade
- `fix(XX-YY): descricao` -- correcao de bug
- `docs(XX-YY): descricao` -- documentacao/artefatos
- `test(XX-YY): descricao` -- testes
- `chore(XX-YY): descricao` -- config/deps

## Duplicacoes Conhecidas

O repositorio tem duplicacoes intencionais entre locais:

| Fonte Canonica | Copia | Razao |
|---------------|-------|-------|
| `up/commands/*.md` | `commands/up/*.md` | Instalacao local quando repo clonado |
| `up/agents/up-*.md` | `agents/up-*.md` | Instalacao local quando repo clonado |

**Regra:** Sempre edite a fonte canonica (dentro de `up/`). As copias na raiz devem ser sincronizadas manualmente.

**Excecao:** `up/agents/up-mapeador-codigo.md` e `up/commands/mapear-codigo.md` existem apenas em `up/` (adicionados em v0.1.2, copias raiz nao foram atualizadas). Verificar se `agents/up-mapeador-codigo.md` existe na raiz -- se nao, sincronizar.
