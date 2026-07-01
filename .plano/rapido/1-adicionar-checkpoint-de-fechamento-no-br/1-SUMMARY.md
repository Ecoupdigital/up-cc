---
phase: rapido-1-adicionar-checkpoint-de-fechamento-no-br
plan: "1"
subsystem: up-brainstorm-skill
tags: [brainstorm, skill, checkpoint, askuserquestion]
dependency-graph:
  requires: []
  provides:
    - "Secao 'Checkpoint de fechamento' em up/skills/up-brainstorm/SKILL.md"
    - "Copia sincronizada em $HOME/.claude/skills/up-brainstorm/SKILL.md"
  affects:
    - "Fluxo do tier Pequena (tabela de profundidade escalada)"
    - "Fluxo do Modo exploracao (passos 4-5)"
    - "Fluxo do Brainstorm full (passo 3)"
tech-stack:
  added: []
  patterns:
    - "AskUserQuestion de controle com 2 opcoes fixas ('Fechar e seguir' / 'Mais perguntas') em loop"
key-files:
  created: []
  modified:
    - "up/skills/up-brainstorm/SKILL.md"
    - "$HOME/.claude/skills/up-brainstorm/SKILL.md (via installer, fora do repo)"
decisions: []
metrics:
  duration: "~5min"
  completed: "2026-07-01"
---

# Rapido 1: Checkpoint de fechamento no up-brainstorm Summary

AskUserQuestion de controle ("Fechar e seguir" / "Mais perguntas") adicionado como regra transversal aos tiers Pequena, full e exploracao do up-brainstorm, com Tier Trivial explicitamente fora.

## O que foi feito

Adicionada a secao `## Checkpoint de fechamento (toda rodada de perguntas)` em `up/skills/up-brainstorm/SKILL.md`, entre "Override de profundidade" e "Modo exploracao". A secao define que toda rodada de perguntas dos tiers Pequena, full e exploracao termina com um AskUserQuestion de controle com exatamente 2 opcoes:

- **"Fechar e seguir"**: avanca pro proximo passo do tier (design em 3 frases, propor abordagens, ou destilar a ideia).
- **"Mais perguntas"**: abre nova rodada mais especifica, que tambem fecha com o mesmo checkpoint (loop ate o usuario liberar).

Tier Trivial permanece fora do checkpoint (0 perguntas, so anuncia).

3 pontos de fluxo existentes foram atualizados para referenciar o checkpoint:
1. Linha do tier **Pequena** na tabela de profundidade escalada (agora cita "checkpoint de fechamento" entre a pergunta-chave e o design em 3 frases).
2. Passo 3 do **Brainstorm full** (fecha a rodada com o checkpoint antes de avancar pro passo 4, propor abordagens).
3. Passos 4-5 do **Modo exploracao** (passo 4 fecha com o checkpoint; passo 5, a destilacao, so roda apos o "Fechar e seguir").

A copia instalada em `$HOME/.claude/skills/up-brainstorm/SKILL.md` foi sincronizada rodando `node up/bin/install.js --claude --global`, que recopiou o diretorio inteiro da skill (99 arquivos UP no total, incluindo comandos, agentes e hooks, conforme esperado do installer).

## Desvios do Plano

Nenhum. Plano executado exatamente como escrito (design ja aprovado no brainstorm anterior). Os 4 edits (A, B, C, D) casaram com os `old_string` na primeira tentativa, sem necessidade de ajuste.

## Commits

| Tarefa | Commit | Descricao |
|--------|--------|-----------|
| 1-2 | `8ee4fba` | feat(up-brainstorm): checkpoint de fechamento em toda rodada de perguntas (up/skills/up-brainstorm/SKILL.md, +15/-4 linhas) |
| 3 | (sem commit no repo; escreve fora do repo em `$HOME/.claude/`) | Sincronizacao via installer |

## Verificacao

- `grep -ci 'checkpoint de fechamento' up/skills/up-brainstorm/SKILL.md` = 4 ocorrencias (>= 4 exigido)
- Secao `## Checkpoint de fechamento (toda rodada de perguntas)` presente entre "Override de profundidade" e "Modo exploracao"
- Zero acentos, zero em-dash, zero en-dash no arquivo (grep de verificacao retornou PASS)
- `git log -1 --pretty=%s` contem "checkpoint de fechamento"; `git status --porcelain up/skills/` vazio (working tree limpo)
- `$HOME/.claude/skills/up-brainstorm/SKILL.md` contem >= 4 ocorrencias de "checkpoint de fechamento" apos o installer

## Self-Check: PASSOU

- ENCONTRADO: up/skills/up-brainstorm/SKILL.md (secao + 4 referencias confirmadas por leitura completa do arquivo)
- ENCONTRADO: $HOME/.claude/skills/up-brainstorm/SKILL.md (sincronizado, grep >= 4)
- ENCONTRADO: commit 8ee4fba em `git log --oneline --all`
