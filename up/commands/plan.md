---
name: up:plan
description: Use quando o usuario quer PLANEJAR antes de executar: gera .plano/PLAN-READY.md sem tocar em codigo, pronto pra /up:build rodar (mesmo runtime ou outro). Detecta automaticamente projeto vs fase.
argument-hint: "[descricao | numero da fase] [--execution-runtime=runtime] [--no-audit] [--gaps]"
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
---
<objective>
Planejar projeto OU fase. NAO executa nada, so planeja. Gera `.plano/PLAN-READY.md` executavel por `/up:build` (mesmo runtime ou outro).

Absorve `/up:discutir-fase`, `/up:planejar-fase` e `/up:adicionar-fase`. **Deteccao automatica projeto vs fase:**
- Argumento e numero de fase (ou vazio com projeto ja inicializado) -> planeja UMA fase (research inline + self-check), absorvendo discutir-fase (coleta de contexto -> CONTEXT.md) e planejar-fase.
- Argumento e descricao de projeto novo (sem `.plano/`) -> planeja o PROJETO INTEIRO (arquitetura + todas as fases).
- Descricao de fase que nao existe no roadmap -> oferece criar a fase e ja planeja (absorve adicionar-fase).

Conduz (projeto):
1. Intake (inline no orquestrador, sem CEO) — entrada = BRIEFING.md do brainstorm de `/up`
2. Arquitetura completa (`up-pesquisador` -> `up-arquiteto` que absorveu o system-designer -> `up-sintetizador` valida requisitos)
3. Planejamento exaustivo de TODAS as fases (Sonnet-ready)
4. GATE + `up-revisor` (Confidence Score de planejamento)
5. Gera PLAN-READY.md (arquivo-flag pra `/up:build`)

**Caso de uso principal:** planejar em Claude Code (modelo capaz pra arquitetura) e executar em OpenCode/Gemini (mais barato pra rodar volume).
</objective>

<execution_context>
@~/.claude/up/workflows/plan.md
@~/.claude/up/workflows/onboarding.md
@~/.claude/up/templates/plan-ready.md
@~/.claude/up/templates/audit-plan.md
</execution_context>

<context>
$ARGUMENTS

**Flags:**
- `--execution-runtime=<runtime>` — Informa qual runtime sera usado pra executar.
  Valores: same | claude-code | opencode | gemini-cli | any. Default: same.
- `--no-audit` — Pula o review de planejamento (nao recomendado em producao).
- `--gaps` — Modo fechamento de gaps de uma fase (le VERIFICATION.md, pula research). Absorve `planejar-fase --gaps`.

O restante e o briefing/descricao em texto livre, ou um numero de fase.

**Entrada preferida:** BRIEFING.md aprovado pelo brainstorm de `/up`. Se ausente e o briefing vier vazio, o orquestrador pergunta interativamente (intake inline, sem CEO).

**Deteccao automatica de modo:**
- Argumento numerico (ou fase ja existente) -> PLANEJAR FASE.
- Descricao + codigo existente -> BROWNFIELD (projeto).
- Descricao + sem codigo -> GREENFIELD (projeto).
- Descricao de fase inexistente -> criar fase + planejar (ex-adicionar-fase).
</context>

<process>
**GATE OBRIGATORIO — Owner Profile:**
Antes de qualquer coisa, verificar se `~/.claude/up/owner-profile.md` existe.
Se NAO existir: rodar onboarding primeiro (workflow onboarding.md). Sem profile, o intake fica generico.

**Sem model routing:** O runtime decide o modelo. NAO especificar `model=` em nenhum spawn.

**Sonnet-ready obrigatorio:** Todos planos devem ser gerados em nivel maximo de detalhe.

**Passo 0 — Detectar projeto vs fase:**
- Argumento e numero/decimal/sufixo-letra de fase -> rota FASE.
- `.plano/` existe e argumento vazio -> rota FASE (proxima nao planejada).
- Argumento e descricao e nao ha `.plano/` -> rota PROJETO.
- Descricao casa com fase inexistente -> oferecer criar a fase, depois rota FASE.

**Execute the plan workflow from @~/.claude/up/workflows/plan.md end-to-end.**

Estagios (PROJETO):
1. Intake inline (orquestrador le BRIEFING.md OU pergunta) — interativo
2. Arquitetura: greenfield (up-pesquisador -> up-arquiteto -> up-sintetizador valida reqs) | brownfield (mapear -> up-arquiteto -> up-sintetizador)
3. Planejamento exaustivo (TODAS as fases, self-check do planejador)
4. GATE + up-revisor (Confidence Score de planejamento; salvo no template audit-plan.md)
5. PLAN-READY.md gerado
6. Orquestrador apresenta o resumo direto (sem CEO)

Estagios (FASE):
1. Coleta de contexto inline (ex-discutir-fase) -> CONTEXT.md
2. Research inline (a menos que `--gaps` ou `--sem-pesquisa`)
3. Planos PLAN-NNN.md + self-check (ex-planejar-fase)

**A partir do estagio 2 do projeto, ZERO interacao com usuario.** Toda decisao e tomada autonomamente pelo orquestrador.

**NAO executar nada.** Para apos gerar PLAN-READY.md (projeto) ou os PLAN-NNN.md (fase).
</process>

<success_criteria>
- [ ] Owner profile garantido
- [ ] Projeto vs fase detectado automaticamente
- [ ] Sem ceo-intake: intake inline no orquestrador
- [ ] PROJETO: pesquisa + arquiteto (absorve system-designer) + sintetizador valida reqs + revisor
- [ ] FASE: contexto (ex-discutir) + research inline + planos + self-check
- [ ] PLAN-READY.md (projeto) ou PLAN-NNN.md (fase) gerados, nada executado
</success_criteria>
