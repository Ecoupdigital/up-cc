---
name: up:plan
description: Use quando o usuario quer PLANEJAR antes de executar: gera .plano/PLAN-READY.md sem tocar em codigo, pronto pra /up:build rodar (mesmo runtime ou outro). Detecta automaticamente projeto vs fase.
argument-hint: "[descricao | numero da fase] [--profundo] [--execution-runtime=runtime] [--no-audit] [--gaps]"
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

Conduz (projeto, default sem `--profundo`):
1. Intake (inline no orquestrador, sem CEO) — entrada = BRIEFING.md do brainstorm de `/up`
2. Arquitetura completa (`up-arquiteto` faz pesquisa, roadmap com limite de ~5 entregas por fase e
   auto-checagem de requisitos num passe; slices PHASE.md/REQUIREMENTS-SLICE.md so da proxima fase)
3. A propria sessao escreve o PLAN.md de uma pagina da proxima fase (template de uma pagina, sem
   `up-planejador`)
4. `--review` spawna `up-revisor`; sem a flag, o self-check da sessao basta
5. Gera PLAN-READY.md (indice curto, arquivo-flag pra `/up:build`)

**`--profundo`:** reproduz o pipeline anterior inteiro: `up-planejador` (subagente) planeja TODAS as
fases de uma vez, com pesquisa, self-check e o loop de `validate-plan`. Use para projeto grande ou
para planejar num runtime e executar em outro.

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
- `--profundo`: Restaura o pipeline pesado: `up-planejador` planeja TODAS as fases (ou a fase pedida
  com pesquisa/self-check completo em MODO FASE), com o loop de `validate-plan`. Default: a sessao
  escreve o plano de uma pagina direto, so da proxima fase, sem spawnar planejador.
- `--execution-runtime=<runtime>` — Informa qual runtime sera usado pra executar.
  Valores: same | claude-code | opencode | gemini-cli | any. Default: same.
- `--no-audit` — Pula o review de planejamento (agora e o default; flag mantida por compatibilidade).
- `--review` — Opt-in. Roda o `up-revisor` no planejamento.
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

**Planos sao contrato:** objetivo, fora de escopo, o que cada fase entrega, a prova. Sem receita de codigo.

**Passo 0 — Detectar projeto vs fase:**
- Argumento e numero/decimal/sufixo-letra de fase -> rota FASE.
- `.plano/` existe e argumento vazio -> rota FASE (proxima nao planejada).
- Argumento e descricao e nao ha `.plano/` -> rota PROJETO.
- Descricao casa com fase inexistente -> oferecer criar a fase, depois rota FASE.

**Execute the plan workflow from @~/.claude/up/workflows/plan.md end-to-end.**

Estagios (PROJETO, default sem `--profundo`):
1. Intake inline (orquestrador le BRIEFING.md OU pergunta) — interativo
2. Arquitetura: `up-arquiteto` (pesquisa inline + roadmap com limite de fase + auto-checagem). Sem pesquisador, roteirista ou sintetizador. Slices so da proxima fase
3. A sessao escreve o PLAN.md de uma pagina da proxima fase, sem spawnar planejador
4. `--review` spawna up-revisor; default e self-check da sessao
5. PLAN-READY.md gerado (indice curto)
6. Orquestrador apresenta o resumo direto (sem CEO)

Estagios (FASE, default sem `--profundo`):
1. Coleta de contexto inline (ex-discutir-fase) -> CONTEXT.md
2. Research inline (a menos que `--gaps` ou `--sem-pesquisa`)
3. A sessao escreve o PLAN.md de uma pagina da fase pedida, sem spawnar planejador

**`--profundo` (PROJETO ou FASE):** substitui os passos 3 acima por `up-planejador` (subagente),
planejando TODAS as fases (PROJETO) com pesquisa e self-check completo, loop de `validate-plan`.

**A partir do estagio 2 do projeto, ZERO interacao com usuario.** Toda decisao e tomada autonomamente pelo orquestrador.

**NAO executar nada.** Para apos gerar PLAN-READY.md (projeto) ou os PLAN-NNN.md (fase).
</process>

<success_criteria>
- [ ] Owner profile garantido
- [ ] Projeto vs fase detectado automaticamente
- [ ] Sem ceo-intake: intake inline no orquestrador
- [ ] PROJETO: arquiteto (pesquisa + roadmap com limite de fase + auto-checagem) + sessao escreve o plano da proxima fase (planejador so com `--profundo`); revisor so com `--review`
- [ ] FASE: contexto (ex-discutir) + research inline + sessao escreve o plano da fase (planejador so com `--profundo`)
- [ ] PLAN-READY.md (projeto) ou PLAN-NNN.md (fase) gerados, nada executado
</success_criteria>
