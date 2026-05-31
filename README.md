<p align="center">
  <pre align="center">
  ██╗   ██╗██████╗
  ██║   ██║██╔══██╗
  ██║   ██║██████╔╝
  ██║   ██║██╔═══╝
  ╚██████╔╝██║
   ╚═════╝ ╚═╝</pre>
</p>

<h3 align="center">Brainstorm-first, GitHub-nativo. Da ideia ao merge, com estado que sobrevive a /clear.</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/up-cc"><img src="https://img.shields.io/npm/v/up-cc.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/up-cc"><img src="https://img.shields.io/npm/dm/up-cc.svg" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/up-cc.svg" alt="license"></a>
</p>

---

**UP** e um sistema de meta-prompting que transforma seu assistente de IA num desenvolvedor estruturado. Voce descreve a ideia, o UP explora o problema com voce (brainstorm), planeja em fases, executa cada fase numa branch isolada com issue e PR, testa na tela antes de mergear, e mantem todo o estado em disco. Funciona em **Claude Code**, **Codex CLI**, **OpenCode** e **Gemini CLI**.

> **UP v2.0.0** e uma reescrita completa (breaking change). Se voce usava a v1, leia a secao [O que mudou no v2](#o-que-mudou-no-v2) antes de atualizar. Nenhum comando da v1 existe mais.

## O que mudou no v2

A v2 e um corte agressivo de superficie. Menos comandos, menos agentes, mais doutrina por contexto. O que antes era um pipeline de muitos passos manuais virou um fluxo curto onde cada comando faz uma coisa bem.

| Area | v1 | v2 |
|------|-----|-----|
| Comandos | 31 | **7** |
| Agentes | 52 | **12** |
| Diretorio de estado | `.plano/` | `.plano/` (mantido) |
| Ponto de entrada | varios comandos de init | **`/up` (porta unica)** |

Mudancas centrais:

- **Brainstorm-first.** Antes de qualquer codigo, o UP explora intencao, requisitos e design. Implementacao so depois do entendimento. Aplica a todo projeto, por mais simples que pareca.
- **GitHub-nativo por padrao.** Cada fase abre worktree + branch + issue, executa isolada e fecha com um menu (merge local, abrir PR, deixar branch ou descartar). O `--solo` e o escape hatch, nao o default.
- **TDD por tipo.** A prova exigida depende do tipo de codigo: teste red-green para logica, prova visual (antes/depois) para UI, smoke-test para glue/integracao. Gate deterministico via `approvals.log`.
- **Teste visual antes do merge.** Se a fase tem UI, o build sobe o dev server dentro da worktree e pergunta se voce quer ver na tela antes de mergear. Projeto em producao nao mergeia sem o dono aprovar visualmente.
- **Waves paralelas.** Fase grande quebra em varios planos por dominio. Planos da mesma wave rodam em paralelo (varios executores de uma vez); waves em sequencia respeitam dependencias.
- **Multica (opt-in).** Flag `--board` espelha as issues das fases no board do Multica.
- **4 runtimes.** Claude Code (completo, com hook + skills), Gemini, OpenCode e Codex (via bootstrap injetado nas instrucoes).

Detalhes completos no [CHANGELOG](up/CHANGELOG.md) e no [Guia de Uso](docs/GUIA-DE-USO.md).

## Instalacao

```bash
node up/bin/install.js --claude --global   # Claude Code (recomendado)
node up/bin/install.js --all --global      # Todos os 4 runtimes
```

Ou via npm:

```bash
npx up-cc@latest --claude --global    # Claude Code
npx up-cc@latest --all --global       # Claude + Codex + OpenCode + Gemini
```

Flags de runtime: `--claude`, `--codex`, `--opencode`, `--gemini`, `--all`. Escopo: `--global` (default, no config do CLI) ou `--local` (no projeto atual).

Apos instalar no Claude Code, reinicie o CLI e digite `/up` para comecar. Os 4 runtimes carregam a mesma doutrina; muda so a forma de invocar (veja [Os 4 runtimes](#os-4-runtimes)).

## Conceitos centrais

**Brainstorm-first.** Nada de codigo as cegas. Ao receber uma ideia, o UP dispara um brainstorm escalado pelo tamanho da tarefa: pequena resolve com poucas perguntas, media/grande passa por brainstorm completo com aprovacao por secao. Isso ancora os requisitos e o design antes de planejar.

**Persistencia em `.plano/`.** Todo o estado vive em disco e sobrevive a `/clear`, troca de contexto e reinicios do CLI:

```
.plano/
├── STATE.md                # Posicao atual, decisoes, bloqueios
├── ROADMAP.md              # Todas as fases com status
├── PROJECT.md              # O que e o projeto
├── REQUIREMENTS.md         # Requisitos rastreaveis
├── config.json             # Config do workflow (github_native, require_visual_test, ...)
├── PLAN-READY.md           # Plano portavel pronto pro /up:build
├── fases/                  # CONTEXT, PLAN-NNN, SUMMARY por fase
├── governance/
│   └── approvals.log       # Gate deterministico (evidence=<tipo>:<resultado>)
└── git-map.json            # Mapa de branches/issues/PRs por fase
```

O hook **up-context-monitor** avisa quando o contexto enche e sugere `/clear` (o estado em disco garante a retomada).

**GitHub-nativo.** O `/up:build` roda cada fase isolada: worktree + branch `up/fase-NN-slug` + issue. No fim da fase, um menu decide o destino (merge local, PR, deixa branch, descarta). A engine `github.cjs` opera fail-open: se algo do GitHub falhar, o build continua sem travar.

**Waves paralelas.** O `/up:plan` quebra fase grande em varios planos por dominio agrupados em waves. O `/up:build` roda os planos da mesma wave em paralelo (varios `up-executor`) e as waves em sequencia (dependencia). Fase pequena = 1 plano = 1 agente.

**Governanca enxuta.** Um unico `up-revisor` two-stage (spec-compliance cetico, depois code-quality/OWASP) mais o gate deterministico do `approvals.log`. Acabou a piramide de CEO, chiefs e supervisores da v1.

**Separacao plan/build.** Planeje no modelo forte (Claude), execute em runtime barato. O `PLAN-READY.md` e portavel: gera num lugar, roda em outro.

## Os 7 comandos

| Comando | O que faz |
|---------|-----------|
| **`/up`** | Porta unica. Sem argumento: continua de onde parou (le STATE.md e roteia). Com descricao: dispara brainstorm e roteia greenfield, brownfield ou clone. Subverbos: `estado`, `config`. |
| **`/up:plan`** | Planeja projeto OU fase (detecta automaticamente). Gera `.plano/PLAN-READY.md`. Nao executa nada. |
| **`/up:build`** | Executa o que foi planejado. GitHub-nativo por fase (worktree, issue, teste visual, PR, merge). Flags `--solo`, `--board`, `--auto`. |
| **`/up:testar`** | Loop DCRV unico (Detectar, Corrigir, Re-verificar): visual, interacao, API, UX, mobile e E2E num passe. Flags `--ux`, `--mobile`, `--e2e`, `--no-fix`. |
| **`/up:auditar`** | Auditoria UX, performance e modernidade num passe, priorizada por ICE. Flag `--features` ativa pesquisa de mercado pra sugerir features novas. |
| **`/up:depurar`** | Debug sistematico com metodo cientifico. Estado persistente entre `/clear`. |
| **`/up:rapido`** | Tarefa pontual sem roadmap nem cerimonia GitHub: commit atomico na branch atual. O escape hatch nomeado. |

## Fluxo end-to-end

Exemplo: construir uma feature do zero ao merge.

```
/up "app de controle de gastos com Supabase, auth e dashboard"
```

1. O UP roda o **brainstorm**: explora intencao, requisitos e design, com aprovacao por secao. Detecta que e greenfield e monta `.plano/` (PROJECT, REQUIREMENTS, ROADMAP, STATE).

```
/up:plan
```

2. Planeja o projeto inteiro. Quebra fases grandes em varios planos por dominio organizados em waves. Gera `.plano/PLAN-READY.md`. Nao toca em codigo.

```
/up:build
```

3. Executa fase a fase, GitHub-nativo:
   - Abre **worktree + branch** `up/fase-01-slug` + **issue**.
   - Roda os planos da fase: planos da mesma wave em **paralelo**, waves em sequencia.
   - Aplica **TDD por tipo** (logica: red-green; UI: prova visual; glue: smoke) com gate no `approvals.log`.
   - Passa pelo **up-revisor** two-stage (spec-compliance, depois code-quality/OWASP).
   - Se a fase tem UI: sobe o **dev server dentro da worktree** e pergunta "testar primeiro ou pode mergear?". Se testar, mantem o server no ar e depois "aprovado ou ajustar?" (ajustar = `up-executor` corrige e re-gate, em loop).
   - No fim da fase, **menu**: merge local, abrir PR, deixar branch ou descartar.

```
/up:testar          # valida o produto inteiro (DCRV: visual, interacao, API, UX, mobile, E2E)
/up:auditar         # auditoria priorizada UX/perf/modernidade quando ja esta pronto
```

Variacoes uteis: `/up:build --solo` pula toda a cerimonia GitHub (commit atomico na branch atual). `/up:build --auto` pula o menu de fim de fase. `/up:build --board` espelha as issues no Multica. Para um fix de 2 minutos sem roadmap, `/up:rapido "corrigir validacao do formulario"`.

## Os 4 runtimes

Mesma doutrina em todos. O que muda: o Claude Code tem suporte nativo (hook + skills); os outros recebem a doutrina via bootstrap injetado no arquivo de instrucoes.

| Runtime | Invocacao | Como carrega o UP |
|---------|-----------|-------------------|
| **Claude Code** | `/up:X` | Completo. Hook SessionStart injeta o bootstrap `usando-up`; 4 skills ativam por contexto; statusLine + context-monitor. |
| **Gemini CLI** | `/up:X` | Comandos convertidos pra TOML + 12 agentes convertidos. Brainstorm-first via bootstrap no `GEMINI.md`. |
| **OpenCode** | `/up-X` | Comandos achatados (`command/up-X.md`) + agentes convertidos. Bootstrap no `AGENTS.md`. |
| **Codex CLI** | `$up-X` | Comandos viram skills + `config.toml [agents] max_depth`. Bootstrap no `AGENTS.md`. |

As **4 skills** (camada de ativacao por contexto, nativas no Claude Code): `usando-up` (bootstrap), `up-brainstorm`, `up-tdd`, `up-verificar-antes-de-concluir`.

Os **12 agentes**: `up-arquiteto`, `up-planejador`, `up-executor`, `up-verificador`, `up-mapeador-codigo`, `up-depurador`, `up-pesquisador`, `up-revisor`, `up-auditor`, `up-sintetizador`, `up-roteirista`, `up-tester`.

## Documentacao

- **[Guia de Uso completo](docs/GUIA-DE-USO.md)**: passo a passo de cada comando, flags, exemplos e fluxos.
- **[CHANGELOG](up/CHANGELOG.md)**: historico de versoes e detalhes do breaking change v2.

## Licenca

MIT
