---
name: up:auditar
description: Use quando o usuario quer auditar o produto pronto. Passe unico UX/performance/modernidade priorizado. Flag --features ativa pesquisa de mercado pra sugerir features novas.
argument-hint: "[--features]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - WebSearch
  - WebFetch
  - AskUserQuestion
---
<objective>
Auditoria priorizada de produto pronto, num passe unico. Funde o que antes eram `/up:melhorias` (auditoria UX/performance/modernidade) e `/up:ideias` (sugestao de features com pesquisa de mercado).

**Default:** `up-auditor` faz um passe unico cobrindo UX + performance + modernidade (substitui os 3 auditores separados). `up-sintetizador` consolida tudo num relatorio priorizado por ICE (Impacto x Confianca x Facilidade) com matriz esforco x impacto e secao de anti-features.

**Com `--features`:** alem da auditoria, ativa `up-pesquisador` em modo mercado (concorrentes/tendencias) pra sugerir features novas. O `up-sintetizador` cruza auditoria + mercado.

**Standalone:** funciona em qualquer projeto, sem `/up` previo nem `.plano/`. Cria `.plano/auditoria/` automaticamente. Detecta stack e dominio pra contextualizar.

**Output:** `.plano/auditoria/RELATORIO.md` com sugestoes priorizadas. Opcionalmente o usuario pode converter sugestoes selecionadas em fases do ROADMAP.md.
</objective>

<execution_context>
@~/.claude/up/workflows/auditar.md
@~/.claude/up/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS

**Flag:**
- `--features` — ativa pesquisa de mercado (`up-pesquisador` modo mercado) pra sugerir features novas, alem da auditoria de produto.

**Sem flag:** apenas auditoria UX/performance/modernidade priorizada.

**Se `.plano/auditoria/` ja existe:** pergunta se sobrescreve a auditoria anterior ou cancela.

**Integracao com roadmap:** apos a auditoria, o usuario pode selecionar sugestoes pra converter em fases. Usa o subcomando `phase generate-from-report` do up-tools.cjs.
</context>

<process>
Execute the auditar workflow from @~/.claude/up/workflows/auditar.md end-to-end.

Pipeline:
1. Init + deteccao de stack/dominio. Cria `.plano/auditoria/`.
2. Spawn `up-auditor` (1x, passe unico: UX + performance + modernidade com mapa de cobertura).
3. Se `--features`: spawn `up-pesquisador` modo mercado (concorrentes/tendencias) em paralelo.
4. Spawn `up-sintetizador` pra consolidar tudo num RELATORIO.md priorizado por ICE com anti-features.
5. Apresentar relatorio. Oferecer conversao de sugestoes em fases do roadmap.

Preserve all workflow gates (init, stack detection, agent spawn, synthesis, report presentation).
</process>

<success_criteria>
- [ ] Flag --features parseada
- [ ] up-auditor rodou num passe unico (UX + perf + modernidade)
- [ ] Com --features: up-pesquisador modo mercado rodou
- [ ] up-sintetizador consolidou em RELATORIO.md priorizado (ICE + anti-features)
- [ ] Relatorio apresentado e conversao em fases oferecida
</success_criteria>
