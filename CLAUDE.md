# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repo contains two parallel systems. **UP is the live product; GSD is legacy.**

- **UP** (the live product) - A Portuguese-language meta-prompting system, published as `up-cc` on npm at **v2.0.0** (breaking-change major). Lives in `up/` (self-contained: `up/bin/`, `up/agents/`, `up/commands/`, `up/hooks/`, `up/workflows/`, `up/skills/`, `up/templates/`, `up/references/`). v2 collapsed the old fleet into **7 commands, 12 agents, 4 skills**, made it **brainstorm-first** (no creative work without exploring intent first) and **GitHub-native by default** (each phase runs in its own worktree/branch/issue and asks how to land it).
- **GSD (Get Shit Done)** - LEGACY. The original spec-driven development system, published as `get-shit-done-cc` on npm (v1.22.x). Lives in `get-shit-done/`, `agents/gsd-*`, `commands/gsd/`, `hooks/`, `bin/`, `scripts/`, `tests/`. Unchanged; kept for reference. When in doubt, work on UP, not GSD.

Both install into CLI tool config directories (`~/.claude/`, `~/.gemini/`, `~/.config/opencode/`, `~/.codex/`) as slash commands, agents, hooks, skills, and workflow files.

## Build & Test

```bash
# UP: no build step - files are plain JS/MD, published directly
# UP: test install locally (one runtime, or --all)
node up/bin/install.js --claude --global
node up/bin/install.js --all --global

# GSD (legacy): run tests
npm test

# GSD (legacy): run tests with coverage (requires c8)
npm run test:coverage

# GSD (legacy): build hooks to hooks/dist/ (runs automatically on npm publish)
npm run build:hooks
```

There is no unified test runner for UP yet. GSD (legacy) tests are in `tests/*.test.cjs` using a custom runner (`scripts/run-tests.cjs`), not a framework. Run a single test file with `node tests/<file>.test.cjs`.

## Architecture

### How the system works at runtime

1. **Commands** (`up/commands/*.md`; GSD legacy: `commands/gsd/*.md`) - Slash commands with YAML frontmatter. They define the entry point, allowed tools, and `@`-reference workflow files.
2. **Workflows** (`up/workflows/*.md`; GSD legacy: `get-shit-done/workflows/*.md`) - Step-by-step orchestration logic in XML-structured markdown. The orchestrator reads these and follows the process.
3. **Agents** (`up/agents/up-*.md`; GSD legacy: `agents/gsd-*.md`) - Subagent definitions with YAML frontmatter (name, tools, model, color). Spawned by orchestrators, including running same-wave plans in parallel.
4. **Skills** (`up/skills/*/SKILL.md`, UP-only) - Context-activated behavior layer. Four skills (`usando-up`, `up-brainstorm`, `up-tdd`, `up-verificar-antes-de-concluir`) load by description-match when their situation arises. `usando-up` is the bootstrap (injected at session start); the other three enforce brainstorm-first, TDD-by-type, and evidence-before-claiming.
5. **Tools CLI** (`up/bin/up-tools.cjs` + `up/bin/lib/core.cjs`; GSD legacy: `get-shit-done/bin/lib/tools.cjs` + `core.cjs`) - Deterministic Node.js CLI for state, roadmap, config, git, classification, GitHub and Multica orchestration, etc. Called by workflows via `node "$HOME/.claude/up/bin/up-tools.cjs" <command>`. UP splits domain logic into `up/bin/lib/`: `core.cjs` (execGit, config + defaults, presets), `github.cjs` (worktree/issue/PR/merge, fail-open), `multica.cjs` (board mirror, opt-in, fail-open, `uname` detection so Mac proxies through `ssh server-ecoup`).
6. **Hooks** (`up/hooks/`, UP-only Node.js, read JSON from stdin) - `up-statusline.js` (statusLine), `up-context-monitor.js` (PostToolUse, warns when context fills), `up-session-start.js` (SessionStart, injects the `usando-up` bootstrap). GSD legacy hooks live in `hooks/`.
7. **Templates** - Markdown templates for STATE.md, ROADMAP.md, PROJECT.md, PLAN-READY.md, config.json, etc.
8. **References** - Shared reference docs loaded by workflows (engineering principles, governance rules, TDD evidence types, git integration, state persistence, blueprints, checkpoints).

### UP v2 surface (commands, agents, skills)

**7 commands** (`up/commands/`). These are the entire surface; the old verbs (novo-projeto, iniciar, modo-builder, onboard, progresso, retomar, pausar, saude, resetar, mapear-codigo, custos, dashboard, configurar, ajuda, atualizar, discutir-fase, planejar-fase, executar-fase, executar-plano, ux-tester, mobile-first, adicionar-testes, verificar-trabalho, melhorias, ideias, adicionar-fase, remover-fase) are gone:
- `/up` (invoked `/up:up "ideia"`) - single door. No arg: continues from where you stopped (reads STATE.md, routes). With a description: fires the escalated brainstorm and routes greenfield/brownfield/clone. Subverbs: `estado`, `config`.
- `/up:plan` - plans a project OR a phase (auto-detects), writes `.plano/PLAN-READY.md`, does not execute. Breaks a large phase into multiple domain plans organized in waves.
- `/up:build` - executes the planned work. GitHub-native per phase by default; runs same-wave plans in parallel, waves in sequence.
- `/up:testar` - single DCRV loop (detectar-corrigir-reverificar) over visual, interaction, API, UX, mobile, E2E. Flags `--ux`/`--mobile`/`--e2e` focus it.
- `/up:auditar` - one-pass UX/performance/modernity audit. `--features` flag turns on market research to suggest new features.
- `/up:depurar` - systematic debugging with state that survives `/clear`.
- `/up:rapido` - one-off task, no roadmap, no GitHub ceremony: atomic commit on the current branch. The named escape hatch.

**12 agents** (`up/agents/`): `up-arquiteto`, `up-planejador`, `up-executor`, `up-verificador`, `up-mapeador-codigo`, `up-depurador`, `up-pesquisador`, `up-revisor`, `up-auditor`, `up-sintetizador`, `up-roteirista`, `up-tester`. Down from ~52: the CEO/chief/supervisor pyramid, the clone fleet, and the per-domain frontend/backend/database specialists were fused into `up-executor`; the DCRV detectors into `up-tester`.

**4 skills** (`up/skills/`): `usando-up` (bootstrap), `up-brainstorm`, `up-tdd`, `up-verificar-antes-de-concluir`.

**12 workflows** (`up/workflows/`): `up`, `plan`, `build`, `dcrv`, `auditar`, `governance`, `mapear-codigo`, `onboarding`, `rapido`, `pausar`, `resetar`, `remover-fase`.

### Key UP v2 concepts

- **GitHub-native by default** (`config.github_native=true`, set in `up/bin/lib/core.cjs`). `/up:build` opens a worktree + branch `up/fase-NN-slug` + issue per phase, executes inside the worktree, then asks via a menu how to land it: merge local / open PR / leave the branch / discard. NEVER write "Default --solo" (wrong). `--solo` is the ESCAPE HATCH (forces `github_native=false` for that run: atomic commit on the current branch, zero ceremony). `--auto` skips the end-of-phase menu. `--board` mirrors to Multica.
- **Pre-merge visual test** (`config.require_visual_test=true` by default). If a phase has UI, the build brings the dev server up inside the worktree and asks "test first, or merge?"; if testing, it keeps the server live and then asks "approved or adjust?" (adjust = `up-executor` fixes and re-gates, looping). A production project does not merge UI without the owner seeing it on screen. `--auto` still runs the visual test unless `require_visual_test=false`.
- **TDD by type** (gate via `.plano/governance/approvals.log`, entries carry `evidence=<type>:<result>`). logic/parser/bugfix = red-green test; UI/CSS = before/after visual proof; glue/integration = smoke test. See `up/references/tdd-evidence-types.md`.
- **Parallel waves**. `/up:plan` splits a big phase into multiple per-domain plans grouped into waves. `/up:build` runs the plans of the same wave in parallel (several `up-executor` at once) and waves in sequence (dependency), then closes the phase. A small phase = 1 plan = 1 agent.
- **plan/build separation**. Plan on a strong model (Claude); the portable `.plano/PLAN-READY.md` lets `/up:build` execute on a cheaper runtime.
- **Lean governance**. One `up-revisor` runs two stages (skeptical spec-compliance + code-quality/OWASP) feeding the deterministic `approvals.log` gate. Replaces the old CEO -> chief -> supervisor pyramid.
- **Persistence** (`.plano/`). STATE.md, ROADMAP.md, PROJECT.md, REQUIREMENTS.md, config.json, `fases/`, `governance/approvals.log`, `git-map.json`. Survives `/clear`; `up-context-monitor` warns when context fills.

### Installer (`up/bin/install.js` for UP; `bin/install.js` for GSD legacy)

The UP installer (`up/bin/install.js --claude|--gemini|--opencode|--codex|--all [--global]`) copies files into target config directories with runtime-specific conversions across **4 runtimes**:
- **Claude Code**: full install (native format). Direct copy of commands/agents/skills. Configures `settings.json` with the **statusLine** (`up-statusline`), the **PostToolUse** hook (`up-context-monitor`), and the **SessionStart** hook (`up-session-start`, which injects the `usando-up` bootstrap). The 4 skills activate by context; no manual wiring.
- **Gemini CLI**: agent frontmatter converted (tools as YAML array, color removed, `${VAR}` escaped), commands to TOML. No native hooks/skills, so brainstorm-first is loaded by **injecting the UP bootstrap block into `GEMINI.md`** (idempotent block, re-stamped on each install).
- **OpenCode**: agent frontmatter converted (tools as object, color as hex, name removed), commands flattened (`commands/up/foo.md` -> `command/up-foo.md`). Bootstrap injected into `AGENTS.md`.
- **Codex CLI**: each command becomes a skill folder under `skills/up-X/` (`SKILL.md` + `agents/openai.yaml`); `config.toml` `[agents]` `max_depth`. Bootstrap injected into `AGENTS.md`.

Invocation differs by runtime: `/up:X` (Claude, Gemini), `/up-X` (OpenCode), `$up-X` (Codex). On Gemini/OpenCode/Codex there is no hook or native skill, but the injected bootstrap means the brainstorm-first doctrine always loads.

### Planning directory structure (created in user projects)

UP uses `.plano/`, GSD legacy uses `.planning/`. UP's `.plano/`:
- `STATE.md` - current position, decisions, blockers
- `ROADMAP.md` - all phases with status
- `PROJECT.md`, `REQUIREMENTS.md`, `config.json` - project context and per-project UP config (`github_native`, `require_visual_test`, etc.)
- `fases/fase-NN-slug/` - per-phase directory with CONTEXT.md, RESEARCH.md, PLAN-NNN.md (multiple plans per phase for waves), PLAN-READY.md, SUMMARY-NNN.md, VERIFICATION.md
- `governance/approvals.log` - deterministic gate, entries carry `evidence=<type>:<result>`
- `git-map.json` - per-phase branch/worktree/issue/PR mapping (written by `up/bin/lib/github.cjs`)

State survives `/clear` (see `up/references/state-persistence.md`).

### Tools CLI commands

The tools CLI (`up/bin/up-tools.cjs`) exposes deterministic subcommands. Core: `init`, `state`, `roadmap`, `phase`, `config`, `requirements`, `commit`, `progress`, `timestamp`, `slug`, `summary-extract`, `state-snapshot`. v2 additions worth knowing:
- `github start-phase --phase N --slug S [--solo]` / `github finish-phase --phase N --mode menu|auto|solo [--strategy squash|merge|rebase]` / `github status` - the worktree/issue/PR/merge lifecycle (delegates to `up/bin/lib/github.cjs`, fail-open).
- `multica init [--name <proj>] [--phase N --title <t>] [--dry-run]` / `multica sync --phase N --status <s> [--metadata k=v ...] [--dry-run]` / `multica board [--project <id>]` - opt-in board mirror (delegates to `up/bin/lib/multica.cjs`, fail-open).
- `classify-task` - classifies a task by type (drives TDD-by-type).
- `phase-plan-index` - lists/indexes the plans of a phase (drives wave parallelism).
- `context` - context-usage signal (used by the monitor hook).
- `verify-static` - static verification checks.

Domain utilities live under `up/bin/lib/`: `core.cjs` (execGit, config with defaults `github_native: true` / `require_visual_test: true`, presets), `github.cjs`, `multica.cjs`.

## Key Conventions

- All UP user-facing text is in Brazilian Portuguese with correct accentuation. GSD (legacy) user-facing text is in English.
- **ZERO em-dash (—) and en-dash (–) anywhere** (code, comments, docs, messages, command/agent/skill text): owner's rule. Use a period + new sentence, comma, colon, parentheses, or a normal hyphen (-).
- Commits are **atomic** (one logical change each). GitHub-native phases commit inside the worktree; `--solo` / `/up:rapido` commit atomically on the current branch.
- Commands use `@$HOME/.claude/...` references to load workflow files at runtime.
- Workflows use `<step>` XML tags for structured process definition.
- Agent frontmatter: `name`, `description`, `tools` (comma-separated), `model` (opus/sonnet/haiku/inherit), `color`.
- The `@file:` protocol is used when tool output exceeds 50KB: output is written to a temp file and the path is returned.
- Hooks must handle stdin timeout (3s guard) for Windows/Git Bash compatibility.
