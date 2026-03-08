# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repo contains two parallel systems:

- **GSD (Get Shit Done)** — The original spec-driven development system, published as `get-shit-done-cc` on npm (v1.22.x). Lives in `get-shit-done/`, `agents/gsd-*`, `commands/gsd/`, `hooks/`, `bin/`, `scripts/`, `tests/`.
- **UP** — A simplified Portuguese-language fork, published as `up-cc` on npm. Lives in `up/` (self-contained: `up/bin/`, `up/agents/`, `up/commands/`, `up/hooks/`, `up/workflows/`, `up/templates/`, `up/references/`).

Both are meta-prompting systems that install into CLI tool config directories (`~/.claude/`, `~/.gemini/`, `~/.config/opencode/`) as slash commands, agents, hooks, and workflow files.

## Build & Test

```bash
# GSD: run tests
npm test

# GSD: run tests with coverage (requires c8)
npm run test:coverage

# GSD: build hooks to hooks/dist/ (runs automatically on npm publish)
npm run build:hooks

# UP: no build step — files are plain JS/MD, published directly
# UP: test install locally
cd up && node bin/install.js --claude --global
```

There is no unified test runner for UP yet. GSD tests are in `tests/*.test.cjs` using a custom runner (`scripts/run-tests.cjs`), not a framework. Run a single test file with `node tests/<file>.test.cjs`.

## Architecture

### How the system works at runtime

1. **Commands** (`commands/gsd/*.md` or `up/commands/*.md`) — Slash commands with YAML frontmatter. They define the entry point, allowed tools, and `@`-reference workflow files.
2. **Workflows** (`get-shit-done/workflows/*.md` or `up/workflows/*.md`) — Step-by-step orchestration logic in XML-structured markdown. The orchestrator reads these and follows the process.
3. **Agents** (`agents/gsd-*.md` or `up/agents/up-*.md`) — Subagent definitions with YAML frontmatter (name, tools, model, color). Spawned by orchestrators for parallel work.
4. **Tools CLI** (`get-shit-done/bin/lib/tools.cjs` + `core.cjs` for GSD; `up/bin/up-tools.cjs` + `up/bin/lib/core.cjs` for UP) — Node.js CLI that handles state management, roadmap parsing, config, git commits, progress bars, slug generation, etc. Called by workflows via `node "$HOME/.claude/up/bin/up-tools.cjs" <command>`.
5. **Hooks** (`hooks/` for GSD, `up/hooks/` for UP) — Claude Code statusline and context monitor hooks. Pure Node.js, read JSON from stdin.
6. **Templates** — Markdown templates for STATE.md, ROADMAP.md, PROJECT.md, etc.
7. **References** — Shared reference docs loaded by workflows (UI patterns, git integration, checkpoints).

### Installer (`bin/install.js` for GSD, `up/bin/install.js` for UP)

The installer copies files into target config directories with runtime-specific conversions:
- **Claude Code**: Direct copy (native format)
- **Gemini CLI**: Agent frontmatter converted (tools as YAML array, color removed, `${VAR}` escaped), commands to TOML
- **OpenCode**: Agent frontmatter converted (tools as object, color as hex, name removed), commands flattened (`commands/up/foo.md` -> `command/up-foo.md`)

The UP installer also configures `settings.json` with statusLine and PostToolUse hooks.

### Planning directory structure (created in user projects)

GSD uses `.planning/`, UP uses `.plano/`. Both follow the same structure:
- `STATE.md` — Current position, decisions, blockers
- `ROADMAP.md` — All phases with status
- `fase-NN-slug/` — Per-phase directory with CONTEXT.md, RESEARCH.md, PLAN-NNN.md, SUMMARY-NNN.md, VERIFICATION.md

### Tools CLI commands

The tools CLI (`up-tools.cjs`) exposes: `init`, `state`, `roadmap`, `phase`, `config`, `requirements`, `commit`, `progress`, `timestamp`, `slug`, `summary-extract`, `state-snapshot`. Core utilities live in `core.cjs`.

## Key Conventions

- All UP user-facing text is in Brazilian Portuguese
- GSD user-facing text is in English
- Commands use `@$HOME/.claude/...` references to load workflow files at runtime
- Workflows use `<step>` XML tags for structured process definition
- Agent frontmatter: `name`, `description`, `tools` (comma-separated), `model` (opus/sonnet/haiku/inherit), `color`
- The `@file:` protocol is used when tool output exceeds 50KB — output is written to a temp file and the path is returned
- Hooks must handle stdin timeout (3s guard) for Windows/Git Bash compatibility
