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

**Default:** `up-auditor` faz um passe unico cobrindo UX + performance + modernidade e escreve o RELATORIO.md consolidado. Sem sintetizador. Sem pesquisador.

**Com `--features`:** o mesmo auditor pesquisa mercado (WebSearch) e inclui ICE + anti-features no relatorio.

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
- `--features` — o auditor pesquisa mercado e sugere features novas, alem da auditoria de produto.

**Sem flag:** apenas auditoria UX/performance/modernidade priorizada.

**Se `.plano/auditoria/` ja existe:** pergunta se sobrescreve a auditoria anterior ou cancela.

**Integracao com roadmap:** apos a auditoria, o usuario pode selecionar sugestoes pra converter em fases. Usa o subcomando `phase generate-from-report` do up-tools.cjs.
</context>

<process>
Execute the auditar workflow from @~/.claude/up/workflows/auditar.md end-to-end.

Pipeline:
1. Init + deteccao de stack/dominio. Cria `.plano/auditoria/`.
2. Spawn `up-auditor` (1x, passe unico: UX + performance + modernidade com mapa de cobertura).
3. Se `--features`: o mesmo auditor pesquisa mercado no mesmo passe.
4. O auditor escreve RELATORIO.md (matriz; + ICE/anti-features se `--features`). Sem sintetizador.
5. Apresentar relatorio. Oferecer conversao de sugestoes em fases do roadmap.

Preserve all workflow gates (init, stack detection, agent spawn, synthesis, report presentation).
</process>

<success_criteria>
- [ ] Flag --features parseada
- [ ] up-auditor rodou num passe unico (UX + perf + modernidade)
- [ ] Com --features: o auditor incluiu mercado + ICE + anti-features no RELATORIO.md
- [ ] RELATORIO.md consolidado pelo auditor (sem sintetizador)
- [ ] Relatorio apresentado e conversao em fases oferecida
</success_criteria>
