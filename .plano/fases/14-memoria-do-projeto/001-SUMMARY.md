---
phase: 14-memoria-do-projeto
plan: 001
subsystem: doutrina
tags: [glossario, vocabulario, bootstrap, instalador, distribuicao-multi-runtime]
dependency_graph:
  requires: []
  provides:
    - "up/references/glossario-up.md: fonte única dos nove termos do UP, em formato parseável (contrato de três linhas por verbete)"
  affects:
    - "plano 002 (bloqueado por este): cita o glossário nas superfícies e conta redefinições remanescentes"
    - "fase 17 (irmã, não bloqueada): entrega o mecanismo de derivação da onda a partir das arestas de bloqueio e confere o verbete publicado"
tech_stack:
  added: []
  patterns:
    - "Reference de doutrina sem frontmatter YAML, no padrão de up/references/questioning.md"
    - "Constante local de path com toHomePrefix (mesmo padrão da constante de skills) em buildUpBootstrapBlock"
key_files:
  created:
    - up/references/glossario-up.md
  modified:
    - up/skills/usando-up/SKILL.md
    - up/bin/install.js
decisions:
  - "Verbete de onda escrito na forma final (visão derivada da dependência declarada, não ordem primária) por decisão registrada no próprio plano, para não colidir com a fase 17"
  - "Verbete de escape hatch gravado a partir do comportamento verificado em up/bin/lib/github.cjs (--solo não desliga o GitHub; --local é a rota que desliga), não a partir da descrição desatualizada do CLAUDE.md da raiz"
metrics:
  tasks_completed: 5
  files_changed: 3
  commits: 4
  completed_date: "2026-07-26"
---

# Fase 14 Plano 001: Glossário interno do UP Summary

Criado `up/references/glossario-up.md` como fonte única de vocabulário do UP (nove termos, três linhas por verbete: Definição, Formas, Evitar), citado no bootstrap de sessão do Claude Code e no bloco de bootstrap injetado nos três runtimes sem hook nativo (Gemini, OpenCode, Codex), com distribuição confirmada por instalação real em diretório temporário nos quatro runtimes.

## Tarefas executadas

### Tarefa 1: cabeçalho do arquivo de glossário

Criado `up/references/glossario-up.md` com título, bloco `<purpose>` (duas frases: vocabulário do próprio sistema, fonte única, agentes/workflows/skills citam em vez de redefinir), seção `## Regra de definição única` com as quatro regras em prosa (usa o termo e aponta pro arquivo / descrever procedimento não é redefinir / linha Evitar lista sinônimos proibidos / este arquivo é o único lugar que define os termos), e seção `## Formas de redefinição contadas pela verificação` com as quatro formas estruturais fechadas (linha `**termo**:`, item de lista `- termo:`, primeira célula de tabela, cabeçalho markdown igual ao termo ou a `O que é <termo>`) e os três cortes numerados (oito palavras ou mais do lado direito, nunca em bloco de código, nunca linha que já aponta pro arquivo).

**Prova rodada:**
```
$ grep -c "Forma" up/references/glossario-up.md
5
$ grep -n "oito palavras" up/references/glossario-up.md
29:Três cortes valem sobre as quatro formas acima. Primeiro corte: só conta quando a prosa do lado direito tem oito palavras ou mais. [...]
```
Passou (>= 4 ocorrências de "Forma", linha com "oito palavras" existe).

**Commit:** `9856e83` feat(14-001): cria cabecalho do glossario interno do UP

### Tarefa 2: os nove verbetes

Acrescentada a seção `## Termos` com os nove verbetes obrigatórios (fase, plano, onda, gate, evidência, worktree, escape hatch, verificação, laço DCRV), cada um com as três linhas em negrito na ordem Definição/Formas/Evitar, usando o texto exato fornecido pelo plano. Antes de escrever o verbete de escape hatch, confirmei o comportamento em `up/bin/lib/github.cjs`: `startPhase` recebe `solo` mas o ignora (`void solo; // solo nao desliga GitHub`), e `finishPhase` trata `mode === 'solo'` no mesmo ramo de `auto`/`pr` (push + PR + merge), nunca no ramo `local` (que é o único que faz nada, mantendo o commit na branch atual). O texto do plano já refletia esse comportamento verificado, então nenhuma correção foi necessária no verbete.

**Prova rodada:**
```
$ grep -c "^### " up/references/glossario-up.md
9
$ grep -c "^\*\*Evitar:\*\*" up/references/glossario-up.md
9
$ grep -c "^\*\*Formas:\*\*" up/references/glossario-up.md
9
$ grep -n "derivada" up/references/glossario-up.md
44:**Definição:** Visão derivada da dependência declarada entre planos, [...]
```
Passou (nove verbetes, nove linhas Evitar, nove linhas Formas, "derivada" cai dentro do verbete de onda).

**Commit:** `5766527` feat(14-001): adiciona os nove verbetes do glossario interno do UP

### Tarefa 3: linha de vocabulário na skill de bootstrap do Claude Code

Inserida uma linha única em `up/skills/usando-up/SKILL.md`, logo após a linha `**Persistencia:**` e antes da linha em branco que já existia (reaproveitada como separador para a linha seguinte "Instrucoes do usuario..."), citando os nove termos e apontando para `$HOME/.claude/up/references/glossario-up.md` (prefixo de propósito, reescrito pelo instalador por runtime via `replacePaths`). Nenhuma linha existente foi alterada.

**Prova rodada:**
```
$ grep -c "glossario-up.md" up/skills/usando-up/SKILL.md
1
$ git diff --stat up/skills/usando-up/SKILL.md
 up/skills/usando-up/SKILL.md | 1 +
 1 file changed, 1 insertion(+)
```
Passou (uma ocorrência do nome do arquivo, um insert e zero remoções no diff).

**Commit:** `e0cf6f7` feat(14-001): cita o glossario no bootstrap de sessao do Claude Code

### Tarefa 4: bloco de bootstrap do instalador (Gemini/OpenCode/Codex)

Em `buildUpBootstrapBlock` (`up/bin/install.js`), declarada a constante `refs` (mesmo padrão de `skills`, usando `toHomePrefix(pathPrefix) + 'up/references'`) e acrescentado o item 6 na lista numerada do bloco, logo após o item 5 (estado em `.plano/`), citando o glossário. Restante do bloco intacto, inclusive a linha final de porta única.

**Prova rodada** (instalação real em diretório temporário, `--all --local`, seguida de segunda instalação para checar idempotência):
```
$ node up/bin/install.js --all --local
$ grep -c "glossario-up.md" .gemini/GEMINI.md .opencode/AGENTS.md .codex/AGENTS.md
.gemini/GEMINI.md:1
.opencode/AGENTS.md:1
.codex/AGENTS.md:1
$ node up/bin/install.js --all --local   # reinstala
$ grep -c "glossario-up.md" .gemini/GEMINI.md .opencode/AGENTS.md .codex/AGENTS.md
.gemini/GEMINI.md:1
.opencode/AGENTS.md:1
.codex/AGENTS.md:1
```
Passou (uma ocorrência em cada arquivo, antes e depois de reinstalar; idempotência preservada).

**Commit:** `194a396` feat(14-001): cita o glossario no bloco de bootstrap dos runtimes sem hook

### Tarefa 5: prova de distribuição nos quatro runtimes

Instalação real em diretório temporário (`node up/bin/install.js --all --local`), diretório removido ao final. Saída completa e conferência:

```
Installing for Claude Code to ./.claude
  ✓ Installed up/ (104 files)
  ✓ Installed 7 commands
  ✓ Installed 12 agents
  ✓ Installed 3 hooks
  ✓ Configured statusLine, context monitor and session-start hook
  ✓ Installed 4 skills
  ✓ Installed 7 command-skills (Grok Build)
  ✓ Wrote VERSION (2.2.0)
  ✓ Wrote package.json (CommonJS mode)

Installing for Gemini to ./.gemini
  ✓ Installed up/ (104 files)
  ✓ Installed 7 commands
  ✓ Installed 12 agents
  ✓ Brainstorm-first em GEMINI.md (bootstrap UP)
  ✓ Wrote VERSION (2.2.0)
  ✓ Wrote package.json (CommonJS mode)

Installing for OpenCode to ./.opencode
  ✓ Installed up/ (104 files)
  ✓ Installed 7 commands to command/
  ✓ Installed 12 agents
  ✓ Brainstorm-first em AGENTS.md (bootstrap UP)
  ✓ Wrote VERSION (2.2.0)

Installing for Codex CLI to ./.codex
  ✓ Installed up/ (104 files)
  ✓ Installed 7 skills (commands)
  ✓ Installed 12 agents
  ✓ Configured config.toml ([agents] max_depth=4, max_threads=8)
  ✓ Brainstorm-first em AGENTS.md (bootstrap UP)
  ✓ Wrote VERSION (2.2.0)
  ✓ Wrote package.json (CommonJS mode)
```

Existência do glossário nos quatro diretórios de configuração:
```
OK: .claude/up/references/glossario-up.md existe
OK: .gemini/up/references/glossario-up.md existe
OK: .opencode/up/references/glossario-up.md existe
OK: .codex/up/references/glossario-up.md existe
```

Contagem de arquivos em `up/references` (listagem não recursiva, dezenove antes de este plano, contando os dezoito `.md` existentes mais o diretório `blueprints/`):
```
.claude: 20 arquivos
.gemini: 20 arquivos
.opencode: 20 arquivos
.codex: 20 arquivos
```

Passou em todos os quatro runtimes. Diretório temporário removido ao final (nenhum arquivo alterado na tarefa, conforme contrato).

## Desvios do Plano

Nenhum. O plano foi executado exatamente como escrito, incluindo o texto literal dos nove verbetes e do item 6 do bootstrap. A única verificação prévia exigida pelo plano (comportamento de `--solo` vs `--local` em `up/bin/lib/github.cjs`, antes de escrever o verbete de escape hatch) confirmou que o texto já proposto no plano estava correto, então não houve necessidade de correção nem divergência a anotar.

## DECISOES ESCALADAS

- Nenhuma.

## Fora de escopo (conforme o plano)

Não citei o glossário nos doze agentes nem nos doze workflows (dono: plano 002). Não implementei a contagem de redefinições (dono: plano 002). Não criei nenhum artefato dentro do `.plano/` de projeto de usuário. Não reacentuei nem reescrevi linhas pré-existentes do bloco de bootstrap ou da skill de bootstrap além da linha nova inserida. Não criei alvo de instalação novo, flag nova, nem mudei a ordem dos passos do instalador. Não adicionei um décimo termo. Não implementei a derivação da ordem de execução a partir das arestas de bloqueio: o verbete de onda nasce na forma final por decisão registrada, e o mecanismo correspondente é entregue pela fase 17.

## Self-Check: PASSOU

Arquivos:
- ENCONTRADO: up/references/glossario-up.md
- ENCONTRADO: up/skills/usando-up/SKILL.md
- ENCONTRADO: up/bin/install.js

Commits:
- ENCONTRADO: 9856e83
- ENCONTRADO: 5766527
- ENCONTRADO: e0cf6f7
- ENCONTRADO: 194a396

Verificações adicionais: nove verbetes (`grep -c "^### "` = 9), nenhum TBD/TODO introduzido, nenhum travessão ou meia-risca nos arquivos tocados por este plano.
