---
name: up
description: Porta unica do UP. Sem argumento continua de onde parou (le STATE.md). Com descricao dispara brainstorm e roteia greenfield/brownfield/clone. Subverbos estado e config.
argument-hint: "[descricao | estado | config]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - WebFetch
  - WebSearch
  - AskUserQuestion
  - mcp__context7__*
  - mcp__plugin_playwright_playwright__*
---
<objective>
Porta unica do UP. Um comando que cobre tres situacoes pelo argumento:

1. **Sem argumento** = continuar de onde parou. Le `.plano/STATE.md`, calcula progresso, e roteia pra proxima acao recomendada (planejar, executar, testar, etc.). Se nao existe `.plano/`, ofrece comecar.
2. **Com descricao** = dispara brainstorm escalado por tamanho (reusa `classify-task`) e roteia: greenfield (do zero), brownfield (feature em projeto existente), ou clone (recriar app a partir de URL).
3. **Subverbo `estado` ou `config`** = casa de estado e configuracao do projeto.

Regra dura: **maximo 3 subverbos**. So existem `continuar` (default, sem arg), `estado` e `config`. Tudo mais e detectado por contexto.
</objective>

<execution_context>
@~/.claude/up/workflows/up.md
</execution_context>

<context>
$ARGUMENTS

**Roteamento por argumento:**
- Vazio -> `continuar` (le STATE.md, roteia pra proxima acao).
- `estado` (ou `status`, `saude`, `pausar`, `resetar`, `custos`, `remover-fase`) -> subverbo estado.
- `config` (ou `configurar`, `onboard`, `atualizar`) -> subverbo config.
- Qualquer outra descricao em texto livre -> brainstorm + roteamento de projeto.

**Deteccao automatica de modo de projeto (quando ha descricao):**
- URL fornecida (https://...) -> CLONE.
- Codigo existente no diretorio (package.json, src/, .plano/) -> BROWNFIELD.
- Diretorio vazio / sem codigo -> GREENFIELD.

**Subverbo `estado`** cobre (sem comando proprio):
- status do projeto e proxima acao (ex-progresso)
- diagnostico de integridade do `.plano/` e reparo opcional (ex-saude)
- handoff `.continue-aqui.md` ao pausar (ex-pausar)
- restaurar contexto da sessao anterior (ex-retomar)
- reset do `.plano/` parcial ou total (ex-resetar)
- estimativa de custo em tokens dos agentes (ex-custos, Claude Code only)
- remover fase futura e renumerar (ex-remover-fase, operacao estrutural rara)
- abrir board (flag `--board` -> URL do Multica; **TODO Fase 5 (Multica)**)

**Subverbo `config`** cobre:
- configurar opcoes do workflow no `.plano/config.json` (ex-configurar)
- onboarding do dono / criar `~/.claude/up/owner-profile.md` (ex-onboard)
- atualizar o up-cc via npm (ex-atualizar)
</context>

<process>
Execute the up router workflow from @~/.claude/up/workflows/up.md end-to-end.

**Passo 0 — Parsear argumento e decidir rota:**

1. Sem argumento (ou so flags):
   - Se `.plano/STATE.md` existe: rota `continuar`. Le STATE.md, mostra status, roteia pra proxima acao.
   - Se `.plano/` NAO existe e NAO ha codigo: mostra como comecar (descrever o projeto pra disparar brainstorm).
   - Se ha codigo mas sem `.plano/`: oferece registrar/mapear o projeto existente.

2. Primeiro token = `estado` / `config`: rota subverbo correspondente (logica inline no workflow up.md).

3. Descricao em texto livre: rota `brainstorm`.

**Brainstorm escalado por tamanho (quando ha descricao):**
Reusa `classify-task` (NAO reimplementar):
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" classify-task "<descricao>"
```
- Trivial (1 arquivo, sem decisao de arquitetura): **0 perguntas**, anuncia em 1 linha, roteia.
- Pequena (1 subsistema, 1 escolha de design): **1 pergunta** via AskUserQuestion + design em 3 frases.
- Media/Grande (multi-subsistema, schema/API/auth): **brainstorm full** com aprovacao por secao.

Brainstorm gera BRIEFING.md (intake inline, sem CEO). Em seguida roteia:
- GREENFIELD -> pipeline de novo projeto (pesquisa + sintese), depois `/up:plan`.
- BROWNFIELD -> mapeia codebase, depois `/up:plan`.
- CLONE -> modo clone do mapeador (crawl + design + features + PRD), depois `/up:plan`.

**Interface alvo de orquestracao GitHub-nativa / Multica:**
As flags `--solo` (default, commit local), `--pr` (worktree/issue/PR), `--board` (espelho Multica), `--auto` (merge se verde) sao a interface alvo. Documentar pro usuario, mas a orquestracao real NAO roda aqui.
**TODO Fase 4 (GitHub-native):** worktree -> issue -> PR -> merge.
**TODO Fase 5 (Multica):** espelho de board batched.

**GATE — Owner Profile:**
Se a rota envolve brainstorm/plan e `~/.claude/up/owner-profile.md` NAO existe neste runtime, rodar config/onboarding primeiro (workflow onboarding.md). Sem profile, o brainstorm fica generico.
</process>

<success_criteria>
- [ ] Argumento parseado e rota escolhida (continuar / estado / config / brainstorm)
- [ ] Sem arg + .plano/ existe: STATE.md lido e proxima acao roteada
- [ ] Com descricao: classify-task rodado, brainstorm escalado, modo detectado
- [ ] Subverbos limitados a estado e config (max 3)
- [ ] Owner profile garantido antes de brainstorm/plan
</success_criteria>
