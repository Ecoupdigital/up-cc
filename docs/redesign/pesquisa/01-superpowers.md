# Pesquisa: Superpowers (obra/superpowers)

Autor: Jesse Vincent (Prime Radiant). Licenca MIT. Versao analisada: **5.1.0** (commit `6fd4507`).
Tagline do proprio README: "a complete software development methodology for your coding agents, built on top of a set of composable skills and some initial instructions that make sure your agent uses them."

Este documento foi escrito lendo o CODIGO de verdade (14 SKILL.md completos, o hook de session-start verbatim, plugin.json, marketplace.json, hooks.json, README). Nao e resumo de README.

---

## 1. Visao geral / quao enxuto e

- **14 skills no total**, cada uma em `skills/<nome>/SKILL.md` (namespace flat, uma pasta por skill).
- Skills tem arquivos de apoio **so quando precisam** (ex: `subagent-driven-development` tem 3 prompt templates `.md`; `systematic-debugging` tem `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`; `test-driven-development` tem `testing-anti-patterns.md`; `brainstorming` tem `visual-companion.md`; `writing-skills` tem `anthropic-best-practices.md`, `persuasion-principles.md`, `testing-skills-with-subagents.md`).
- **Filosofia de tamanho explicita** (de writing-skills): getting-started/skills carregadas sempre = <150-200 palavras; demais skills <500 palavras. "Every token counts." Detalhes pesados vao para arquivos separados que so carregam quando referenciados.
- Sem build pesado: tudo e markdown + um shell script de hook. O plugin instala em multiplos harnesses (Claude Code, Codex, Gemini CLI, OpenCode, Cursor, Copilot CLI, Factory Droid) via marketplace.
- Estrutura raiz: `.claude-plugin/` (plugin.json + marketplace.json), `.codex-plugin/`, `.cursor-plugin/`, `.opencode/`, `hooks/`, `skills/`, `tests/`, `docs/`, `scripts/`, mais arquivos de instrucao por-harness na raiz (`CLAUDE.md`, `GEMINI.md`, `AGENTS.md`).

As 14 skills:
1. using-superpowers (meta / bootstrap)
2. brainstorming
3. writing-plans
4. executing-plans
5. subagent-driven-development
6. test-driven-development
7. systematic-debugging
8. verification-before-completion
9. requesting-code-review
10. receiving-code-review
11. dispatching-parallel-agents
12. using-git-worktrees
13. finishing-a-development-branch
14. writing-skills (meta)

---

## 2. Formato exato do SKILL.md (frontmatter + progressive disclosure)

Frontmatter YAML com **so dois campos obrigatorios**: `name` e `description` (max 1024 chars total). Exemplos verbatim:

```yaml
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---
```
```yaml
---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---
```
```yaml
---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---
```

### A regra de ouro do `description` (o segredo da ativacao por contexto)
A skill `writing-skills` documenta isso explicitamente como **CSO (Claude Search Optimization)**:

> **CRITICAL: Description = When to Use, NOT What the Skill Does.** The description should ONLY describe triggering conditions. Do NOT summarize the skill's process or workflow.

Por que (citado verbatim no codigo): testes revelaram que quando a description resume o workflow, o Claude **segue a description em vez de ler o conteudo da skill**. Exemplo real citado: uma description que dizia "code review between tasks" fez o Claude fazer UMA review, embora o flowchart da skill mostrasse DUAS reviews. Trocar para so "Use when executing implementation plans with independent tasks" fez ele ler o corpo e seguir as duas reviews.

Regras do description:
- Comecar com "Use when..." (terceira pessoa, e injetado no system prompt).
- Sintomas concretos, gatilhos, contextos. Tecnologia-agnostico salvo se a skill for especifica.
- Descrever o *problema* (race conditions, inconsistencia) e nao sintomas de linguagem (setTimeout/sleep).
- **Nunca** resumir o processo/workflow.
- Keyword coverage: mensagens de erro, sintomas ("flaky", "hanging", "race condition"), sinonimos, nomes de ferramentas.

### Estrutura recomendada do corpo (de writing-skills)
`# Title` -> `## Overview` (core principle em 1-2 frases) -> `## When to Use` (flowchart pequeno SO se decisao nao-obvia + bullets de sintomas + quando NAO usar) -> `## Core Pattern` (before/after) -> `## Quick Reference` (tabela) -> `## Implementation` -> `## Common Mistakes` -> `## Real-World Impact` (opcional).

### Progressive disclosure (3 niveis)
1. **Sempre carregado:** so o `description` (no system prompt, via metadata das skills) + a skill `using-superpowers` inteira (injetada pelo hook de session-start).
2. **Sob demanda:** o `SKILL.md` inteiro, carregado quando o Claude chama a `Skill` tool.
3. **Heavy reference / tools:** arquivos `.md`/`.ts`/scripts dentro da pasta da skill, carregados so quando o SKILL.md aponta para eles. Regra de cross-reference: usar **nome da skill** com marcadores explicitos (`**REQUIRED SUB-SKILL:** Use superpowers:test-driven-development`), e **proibido** usar `@arquivo` ("`@` syntax force-loads files immediately, consuming 200k+ context before you need them").

---

## 3. ATIVACAO AUTOMATICA (o ponto-chave) — como funciona sem comando explicito

Tres camadas trabalham juntas:

### Camada A — Hook de SessionStart injeta a skill-bootstrap
`hooks/hooks.json`:
```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "startup|clear|compact",
        "hooks": [ { "type": "command",
          "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
          "async": false } ] }
    ]
  }
}
```
Dispara em **startup, clear e compact** (ou seja, re-injeta apos limpar contexto ou compactar). O script `hooks/session-start` (bash) le o arquivo `skills/using-superpowers/SKILL.md` inteiro, escapa pra JSON e injeta como `additionalContext`, embrulhado assim (verbatim do script):

```
<EXTREMELY_IMPORTANT>
You have superpowers.

**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**

${using_superpowers_escaped}
</EXTREMELY_IMPORTANT>
```

O script detecta plataforma e emite o campo certo sem duplicar: Cursor=`additional_context`; Claude Code=`hookSpecificOutput.additionalContext`; Copilot CLI/outros=`additionalContext` (top-level). Usa `printf` em vez de heredoc por bug do bash 5.3+. Ou seja: **toda sessao comeca com a skill `using-superpowers` ja na cabeca do agente.** Nenhum comando do usuario e necessario.

### Camada B — using-superpowers obriga a checar skills ANTES de qualquer resposta
O conteudo injetado e disciplina pura. Trechos verbatim:

```
<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.
IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>
```

Regra operacional: **"Invoke relevant or requested skills BEFORE any response or action."** A skill check vem ANTES ate de fazer perguntas de esclarecimento. Tem um flowchart `dot` que diz: mensagem recebida -> "Might any skill apply?" -> "yes, even 1%" -> invoca Skill tool -> anuncia "Using [skill] to [purpose]" -> se tem checklist, cria um TodoWrite por item -> segue a skill exatamente.

Tem ainda um gate especial: **"About to EnterPlanMode? -> Already brainstormed? -> no -> Invoke brainstorming skill"** (forca o brainstorming antes de planejar).

Tabela de **Red Flags** (racionalizacoes proibidas), ex: "This is just a simple question" -> "Questions are tasks. Check for skills."; "I need more context first" -> "Skill check comes BEFORE clarifying questions."

Prioridade de instrucao (importante pro design): 1) instrucoes explicitas do usuario (CLAUDE.md/GEMINI.md/AGENTS.md) > 2) skills do superpowers > 3) system prompt default. "The user is in control."

Prioridade entre skills: **process skills primeiro** (brainstorming, debugging — definem COMO abordar), **implementation skills depois**.

### Camada C — descriptions otimizadas (CSO, ver secao 2)
Como o agente ja foi instruido a checar skills no "1% de chance", e cada `description` lista gatilhos concretos ("Use when implementing any feature or bugfix, before writing implementation code"), o match contexto->skill acontece sozinho. **A combinacao hook + using-superpowers + descriptions-como-gatilho e o mecanismo de auto-ativacao.** Nao ha keyword matching/regex no harness — e o proprio modelo decidindo, mas empurrado por um prompt de altissima prioridade injetado em toda sessao.

### Guard de subagente
O topo de using-superpowers tem `<SUBAGENT-STOP>If you were dispatched as a subagent to execute a specific task, skip this skill.</SUBAGENT-STOP>` — subagentes nao re-disparam o overhead do bootstrap.

---

## 4. BRAINSTORMING (passo a passo exato)

`description` (verbatim): "You MUST use this before any creative work...". Tem um `<HARD-GATE>`:

> Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.

Anti-pattern combatido explicitamente: **"This Is Too Simple To Need A Design"** — todo projeto passa pelo processo, ate um todo list ou mudanca de config. O design pode ser curto (poucas frases), mas TEM que ser apresentado e aprovado.

### Checklist (9 itens, vira TodoWrite, em ordem):
1. **Explore project context** — checar arquivos, docs, commits recentes.
2. **Offer Visual Companion** (se o topico tiver questoes visuais) — **mensagem propria, sozinha, sem nenhum outro conteudo**.
3. **Ask clarifying questions** — UMA por vez, entender purpose/constraints/success criteria.
4. **Propose 2-3 approaches** — com trade-offs e a recomendacao dele.
5. **Present design** — em secoes escaladas a complexidade, aprovacao do usuario apos CADA secao.
6. **Write design doc** — salvar em `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` e commitar.
7. **Spec self-review** — checagem inline de placeholders, contradicoes, ambiguidade, escopo.
8. **User reviews written spec** — pedir ao usuario revisar o arquivo antes de prosseguir.
9. **Transition to implementation** — invocar a skill writing-plans.

### Logica das perguntas (transcrita):
- Antes de perguntar detalhes, **avaliar escopo**: se descreve multiplos subsistemas independentes ("plataforma com chat, storage, billing, analytics"), sinalizar JA e ajudar a **decompor em sub-projetos** (cada sub-projeto tem seu proprio ciclo spec -> plan -> implementation). Nao gastar perguntas refinando algo que precisa ser quebrado.
- Para projetos bem escopados: perguntas **uma de cada vez**. Preferir multipla escolha. "Only one question per message."
- Foco: purpose, constraints, success criteria.

### Apresentar o design (transcrito):
- Apresentar quando achar que entendeu. **Escalar cada secao a complexidade**: poucas frases se simples, ate 200-300 palavras se nuancado.
- Perguntar apos cada secao se esta certo.
- Cobrir: architecture, components, data flow, error handling, testing.
- Principio de design-for-isolation: quebrar em unidades pequenas, cada uma com proposito unico, interface bem definida, testavel/entendivel isoladamente. Teste mental: "alguem entende o que a unidade faz sem ler as internas? Da pra mudar as internas sem quebrar consumidores?"

### Artefato gerado:
O **spec/design doc** em `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`, commitado ao git. (Preferencia do usuario sobrescreve o path.)

### Validacao com humano (dois gates):
1. Aprovacao por secao durante a apresentacao.
2. **User Review Gate** apos escrever o spec — mensagem literal sugerida:
   > "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."
   Espera resposta. Se pedir mudancas, refaz e re-roda o spec review loop. So prossegue com aprovacao.

### Spec Self-Review (4 checagens, fix inline, sem re-review):
1. Placeholder scan (TBD/TODO/secoes incompletas).
2. Internal consistency (secoes nao se contradizem; arquitetura bate com features).
3. Scope check (focado pra um plano so, ou precisa decompor?).
4. Ambiguity check (algum requisito interpretavel de 2 jeitos? escolher um e tornar explicito).

### Estado terminal:
"**The terminal state is invoking writing-plans.** Do NOT invoke frontend-design, mcp-builder, or any other implementation skill." Brainstorming -> writing-plans, e so.

### Key Principles (verbatim): One question at a time; Multiple choice preferred; **YAGNI ruthlessly**; Explore alternatives (sempre 2-3); Incremental validation; Be flexible.

### Visual Companion: e uma *ferramenta, nao um modo*. Oferecida UMA vez, em mensagem isolada (consentimento). Mesmo aceita, decide POR PERGUNTA: browser so pra conteudo que E visual (mockups, wireframes, diagramas, comparacao lado-a-lado); terminal pra conceito/requisito/tradeoff/opcoes A/B/C. Teste: "o usuario entenderia melhor vendo do que lendo?".

---

## 5. WRITING-PLANS (tarefas de 2-5 min, formato, paths, verification)

`description`: "Use when you have a spec or requirements for a multi-step task, before touching code". Anuncia no inicio: "I'm using the writing-plans skill to create the implementation plan."

Premissa central (verbatim): escrever planos assumindo que o engenheiro tem **zero contexto e gosto questionavel** — "an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing". Mantra: **DRY. YAGNI. TDD. Frequent commits.**

Salva em `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`.

### File Structure primeiro:
Antes de definir tarefas, **mapear quais arquivos serao criados/modificados e a responsabilidade de cada um** — "where decomposition decisions get locked in". Unidades com fronteiras claras, cada arquivo com uma responsabilidade. "Files that change together should live together. Split by responsibility, not by technical layer."

### Granularidade bite-sized (verbatim): cada step = uma acao de 2-5 min:
```
"Write the failing test" - step
"Run it to make sure it fails" - step
"Implement the minimal code to make the test pass" - step
"Run the tests and make sure they pass" - step
"Commit" - step
```

### Header obrigatorio de todo plano (verbatim):
```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies/libraries]
```

### Estrutura de Task (formato exato):
```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**   (com bloco de codigo do teste real)
- [ ] **Step 2: Run test to verify it fails**   (Run: comando exato; Expected: FAIL com mensagem)
- [ ] **Step 3: Write minimal implementation**   (codigo real)
- [ ] **Step 4: Run test to verify it passes**   (Run: comando; Expected: PASS)
- [ ] **Step 5: Commit**   (git add + git commit exatos)
```
Note: **file paths exatos sempre**, **codigo completo em cada step** (se o step muda codigo, mostra o codigo), **comandos exatos com output esperado**. Cada task = TDD red-green-commit completo.

### No Placeholders (sao "plan failures", nunca escrever):
"TBD"/"TODO"/"implement later"; "add appropriate error handling"/"add validation"/"handle edge cases"; "Write tests for the above" sem o codigo; "Similar to Task N" (repetir o codigo — o engenheiro pode ler fora de ordem); steps que dizem o que fazer sem mostrar como; referencias a tipos/funcoes nao definidos em nenhuma task.

### Self-Review (checklist que voce mesmo roda, NAO subagente):
1. **Spec coverage** — cada requisito do spec tem uma task? Listar gaps, adicionar tasks faltantes.
2. **Placeholder scan** — caca os red flags acima, corrige.
3. **Type consistency** — assinaturas/nomes batem entre tasks (`clearLayers()` na Task 3 vs `clearFullLayers()` na Task 7 = bug). Fix inline, sem re-review.

### Execution Handoff (oferece escolha):
1. **Subagent-Driven (recommended)** — subagente fresco por task, review entre tasks, iteracao rapida. -> usa subagent-driven-development.
2. **Inline Execution** — executa na sessao atual em batches com checkpoints. -> usa executing-plans.

---

## 6. SUBAGENT-DRIVEN-DEVELOPMENT (subagente fresco por task + two-stage review)

`description` (cuidadosamente SEM resumo de workflow, ver licao de CSO): "Use when executing implementation plans with independent tasks in the current session".

Definicao (verbatim): "Execute plan by dispatching fresh subagent per task, with two-stage review after each: **spec compliance review first, then code quality review**."

Por que subagentes (verbatim): "You delegate tasks to specialized agents with isolated context... They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work."

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration.

**Continuous execution (regra forte):** "Do not pause to check in with your human partner between tasks. Execute all tasks from the plan without stopping." Os unicos motivos de parar: BLOCKED irresoluvel, ambiguidade que impede progresso, ou tudo completo. "'Should I continue?' prompts and progress summaries waste their time."

### O fluxo por task (do flowchart):
1. Controller le o plano **UMA vez**, extrai TODAS as tasks com texto completo + contexto, cria TodoWrite. (O subagente NUNCA le o arquivo de plano — o controller passa o texto completo.)
2. Dispatch **implementer subagent** (`./implementer-prompt.md`).
3. Implementer pode **fazer perguntas antes de comecar** -> controller responde -> re-dispatch.
4. Implementer: implementa, escreve testes, **testa, commita, self-review**. Reporta status (4 possiveis, ver abaixo).
5. Dispatch **spec reviewer** (`./spec-reviewer-prompt.md`) — confirma que o codigo bate com o spec. Se nao: implementer (MESMO subagente conceitual) corrige -> re-review. Loop ate ✅.
6. So entao dispatch **code quality reviewer** (`./code-quality-reviewer-prompt.md`). Se nao aprova: implementer corrige -> re-review. Loop ate ✅. (Red flag explicito: "Start code quality review before spec compliance is ✅ (wrong order)".)
7. Marca task completa no TodoWrite. Proxima task.
8. Apos TODAS as tasks: dispatch **final code reviewer** pra implementacao inteira.
9. -> usa **finishing-a-development-branch**.

### O que passa de contexto pro subagente (implementer-prompt.md):
Tres secoes — **Task Description** (texto completo da task colado), **Context** (onde a task se encaixa na arquitetura/scene-setting), **Before You Begin** (encoraja perguntas: "it's always OK to pause and clarify. Don't guess or make assumptions"). Processo de 5 passos: implementa por spec, escreve testes, verifica, commita, self-review. Subagente usa a skill **test-driven-development** naturalmente.

### Os 4 status do implementer (e como o controller trata):
- **DONE:** vai pra spec review.
- **DONE_WITH_CONCERNS:** ler as duvidas antes. Se sobre correcao/escopo, resolver antes da review; se observacao ("arquivo crescendo"), anotar e seguir.
- **NEEDS_CONTEXT:** prover o que faltou, re-dispatch.
- **BLOCKED:** avaliar — se contexto, prover e re-dispatch (mesmo modelo); se precisa mais raciocinio, re-dispatch com modelo mais capaz; se task grande demais, quebrar; se o plano esta errado, escalar pro humano. **"Never ignore an escalation or force the same model to retry without changes."**

### Spec reviewer (spec-reviewer-prompt.md) — ceticismo embutido:
"The implementer finished suspiciously quickly. Their report may be incomplete, inaccurate, or optimistic." O reviewer **inspeciona o codigo real**, nao confia no relatorio. Checa: **missing requirements**, **extra work** (alem do spec — over-building), **misunderstandings**. Comparacao linha-a-linha spec vs implementacao. Output: confirmacao de compliance OU lista de discrepancias com referencias de arquivo.

### Code quality reviewer (code-quality-reviewer-prompt.md):
So roda **apos** spec compliance passar. Objetivo: "Verify implementation is well-built (clean, tested, maintainable)". Inputs: task summary, requisitos do plano, BASE_SHA, HEAD_SHA. Avalia se "each file has one clear responsibility with a well-defined interface", se as unidades sao decomponiveis/testaveis isoladamente, se segue a file structure planejada, se arquivos cresceram demais. Output: **Strengths**, **Issues categorizados (Critical/Important/Minor)**, **overall assessment**.

### Model selection (rotear por complexidade/custo):
- Task mecanica (1-2 arquivos, spec completo) -> modelo barato/rapido.
- Integracao/judgment (multi-arquivo, debugging) -> modelo padrao.
- Arquitetura/design/review -> modelo mais capaz.

### Red Flags (verbatim, parcial): nunca comecar na main/master sem consentimento; nunca pular reviews; nunca prosseguir com issues abertas; **nunca dispachar multiplos implementers em paralelo** (conflitos); nunca fazer o subagente ler o arquivo de plano (passar texto completo); nunca pular scene-setting; nunca aceitar "close enough" no spec compliance.

---

## 7. TEST-DRIVEN-DEVELOPMENT (como FORCA red-green-refactor)

`description`: "Use when implementing any feature or bugfix, before writing implementation code".

**The Iron Law (verbatim):**
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```
"Write code before the test? Delete it. Start over."
"**No exceptions:** Don't keep it as 'reference'. Don't 'adapt' it while writing tests. Don't look at it. Delete means delete. Implement fresh from tests. Period."

Frase-chave repetida em varias skills: **"Violating the letter of the rules is violating the spirit of the rules."** — corta a classe inteira de "estou seguindo o espirito".

Core principle: "If you didn't watch the test fail, you don't know if it tests the right thing."

### Ciclo RED-GREEN-REFACTOR (o que bloqueia / forca):
- **RED:** escrever UM teste minimal de um comportamento. Nome claro. Codigo real (sem mocks salvo inevitavel).
- **Verify RED — "MANDATORY. Never skip."** Rodar o teste. Confirmar que **falha (nao da erro)**, que a mensagem de falha e a esperada, que falha porque a feature falta (nao por typo). "Test passes? You're testing existing behavior. Fix test." "Test errors? Fix error, re-run until it fails correctly." -> **Isto e o que impede codigo antes de teste: voce e obrigado a VER o teste falhar primeiro.**
- **GREEN:** codigo minimo pra passar. Bad example mostrado = funcao com `options?` (maxRetries/backoff/onRetry) = "YAGNI". "Don't add features, refactor other code, or 'improve' beyond the test."
- **Verify GREEN — MANDATORY:** roda, confirma passa, outros testes ainda passam, output pristino (zero warnings).
- **REFACTOR:** so depois do verde — remove duplicacao, melhora nomes, extrai helpers, **mantem verde, nao adiciona comportamento.**

### Mecanismos de coercao (o que realmente bloqueia atalhos):
1. **Tabela de Common Rationalizations** (12 linhas excuse->reality). Ex: "I'll test after" -> "Tests passing immediately prove nothing."; "Deleting X hours is wasteful" -> "Sunk cost fallacy. Keeping unverified code is technical debt."; "TDD is dogmatic, I'm being pragmatic" -> "TDD IS pragmatic."
2. **Red Flags - STOP and Start Over** (lista de pensamentos-gatilho; todos significam "Delete code. Start over with TDD.").
3. **Verification Checklist** com `- [ ]` antes de marcar completo ("Can't check all boxes? You skipped TDD. Start over.").
4. **Final Rule:** "Production code -> test exists and failed first. Otherwise -> not TDD."

Excecoes (so com permissao do human partner): throwaway prototypes, generated code, config files. "Thinking 'skip TDD just this once'? Stop. That's rationalization."

Integracao com debugging: "Bug found? Write failing test reproducing it... Never fix bugs without a test." Arquivo de apoio: `testing-anti-patterns.md` (nao testar mock em vez de codigo real; nao adicionar metodos test-only em producao; nao mockar sem entender dependencias).

---

## 8. SYSTEMATIC-DEBUGGING (4 fases, root cause antes de fix)

`description`: "Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes".

**Iron Law:** `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST`. "If you haven't completed Phase 1, you cannot propose fixes."

### As 4 fases (obrigatorias em ordem):
1. **Root Cause Investigation** — ler mensagens de erro por inteiro (stack traces, line numbers); reproduzir consistentemente; checar mudancas recentes (git diff); em sistemas multi-componente, **adicionar instrumentacao diagnostica em cada fronteira** (logar o que entra/sai de cada componente) e rodar UMA vez pra ver ONDE quebra antes de propor fix; trace data flow backward ate a origem do valor ruim (arquivo `root-cause-tracing.md`).
2. **Pattern Analysis** — achar exemplos que funcionam no mesmo codebase; comparar com referencia COMPLETAMENTE ("read every line", nao skim); listar TODAS as diferencas; entender dependencias/config/assumptions.
3. **Hypothesis and Testing** — formar UMA hipotese ("I think X is the root cause because Y"); testar MINIMAMENTE (a menor mudanca, uma variavel por vez); verificar antes de continuar; se nao funcionou, NOVA hipotese (nao empilhar fixes); "When you don't know: say 'I don't understand X'".
4. **Implementation** — criar test case que falha (usar TDD); UM fix do root cause ("no 'while I'm here' improvements"); verificar; **se 3+ fixes falharam, PARAR e questionar a arquitetura** (Phase 4.5: "this is NOT a failed hypothesis — this is a wrong architecture").

Inclui tabela "**your human partner's Signals You're Doing It Wrong**" (ex: "Stop guessing", "Ultrathink this", "We're stuck?") -> "When you see these: STOP. Return to Phase 1." Impacto citado: sistematico 15-30 min vs random 2-3 h; first-time fix 95% vs 40%. Tecnicas de apoio: `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`.

---

## 9. VERIFICATION-BEFORE-COMPLETION (evidencia antes de afirmar)

`description`: "Use when about to claim work is complete, fixed, or passing... requires running verification commands and confirming output before making any success claims; evidence before assertions always".

**Iron Law:** `NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE`. "If you haven't run the verification command in this message, you cannot claim it passes." Abertura: "Claiming work is complete without verification is dishonesty, not efficiency."

**The Gate Function (verbatim):**
```
BEFORE claiming any status or expressing satisfaction:
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
5. ONLY THEN: Make the claim
Skip any step = lying, not verifying
```

Tabela Claim->Requires->Not Sufficient (ex: "Tests pass" requer "Test command output: 0 failures", nao "previous run/should pass"; "Agent completed" requer "VCS diff shows changes", nao "agent reports success"). Red Flags inclui ate "Expressing satisfaction before verification ('Great!', 'Perfect!', 'Done!')". Padrao especial pra regression test (TDD red-green): Write -> Run(pass) -> Revert fix -> Run(MUST FAIL) -> Restore -> Run(pass). Motivado por "24 failure memories" e a regra "Honesty is a core value. If you lie, you'll be replaced."

---

## 10. REQUESTING + RECEIVING CODE REVIEW

### requesting-code-review
"Dispatch a code reviewer subagent... gets precisely crafted context for evaluation — never your session's history." Mandatory: apos cada task no subagent-driven, apos feature grande, antes de merge. Como: pegar `BASE_SHA`/`HEAD_SHA`, dispachar reviewer via Task tool (`general-purpose`) preenchendo o template `code-reviewer.md` com placeholders `{DESCRIPTION}`, `{PLAN_OR_REQUIREMENTS}`, `{BASE_SHA}`, `{HEAD_SHA}`. Agir: Critical imediato, Important antes de prosseguir, Minor depois, **push back se o reviewer estiver errado (com raciocinio)**.

### receiving-code-review (cultura anti-bajulacao)
"Code review requires technical evaluation, not emotional performance." Response pattern: READ -> UNDERSTAND (restate) -> VERIFY (contra o codebase) -> EVALUATE -> RESPOND -> IMPLEMENT (um item por vez, testar cada).

**Forbidden responses (verbatim):** "You're absolutely right!" (chamado de "explicit CLAUDE.md violation"), "Great point!", "Let me implement that now" (antes de verificar). **Proibido qualquer agradecimento** ("If you catch yourself about to write 'Thanks': DELETE IT. State the fix instead." / "Actions speak. Just fix it.").

Feedback externo = ceticismo: checar se e tecnicamente correto PRA ESTE codebase, se quebra algo, se ha razao pra implementacao atual, se funciona em todas plataformas, se o reviewer entende o contexto. **YAGNI check:** se o reviewer sugere "implementar direito", grepar o codebase — se nao usado, "Remove it (YAGNI)?". Se feedback nao claro: PARAR, pedir esclarecimento de TUDO antes de implementar qualquer coisa ("Partial understanding = wrong implementation"). Sinais de quando dar push back, como dar (raciocinio tecnico, nao defensividade), e como corrigir graciosamente quando voce estava errado (sem desculpas longas). Replies de thread no GitHub: responder no thread do comentario inline, nao top-level.

---

## 11. USING-GIT-WORKTREES + FINISHING-A-DEVELOPMENT-BRANCH (fluxo git completo)

### using-git-worktrees
`description`: "Use when starting feature work that needs isolation... ensures an isolated workspace exists via native tools or git worktree fallback". Core principle: **"Detect existing isolation first. Then use native tools. Then fall back to git. Never fight the harness."**

- **Step 0 — Detect Existing Isolation:** compara `git rev-parse --git-dir` vs `--git-common-dir`. Se diferentes (e nao submodule, ha um guard `git rev-parse --show-superproject-working-tree`), JA esta em worktree -> pula pra setup, NAO cria outro. Se iguais, e repo normal -> pede consentimento ("Would you like me to set up an isolated worktree?").
- **Step 1a — Native tools preferidos:** se existe `EnterWorktree`/`WorktreeCreate`/`/worktree`/`--worktree`, usar e pular. "Using `git worktree add` when you have a native tool creates phantom state your harness can't see." (#1 mistake)
- **Step 1b — Git fallback:** prioridade de diretorio: preferencia declarada > `.worktrees/` (preferido, hidden) > `worktrees/` > path global legado `~/.config/superpowers/worktrees/$project` > default `.worktrees/`. **Safety:** verificar `git check-ignore` antes de criar project-local; se nao ignorado, adicionar ao .gitignore e commitar. `git worktree add "$path" -b "$BRANCH_NAME"; cd "$path"`. Sandbox fallback: se permissao negar, trabalhar in-place.
- **Step 3 — Project Setup:** auto-detecta (`package.json`->npm install; `Cargo.toml`->cargo build; `requirements.txt`/`pyproject.toml`->pip/poetry; `go.mod`->go mod download).
- **Step 4 — Verify Clean Baseline:** roda os testes. **Se falham, reporta e pergunta se prossegue** (pra distinguir bugs novos de pre-existentes). Se passam: "Worktree ready... Tests passing... Ready to implement".

### finishing-a-development-branch
Core principle: "Verify tests -> Detect environment -> Present options -> Execute choice -> Clean up."

- **Step 1 — Verify Tests:** se falham, PARA ("Cannot proceed with merge/PR until tests pass").
- **Step 2 — Detect Environment** (git-dir vs git-common-dir): repo normal -> 4 opcoes, sem worktree pra limpar; worktree com branch nomeada -> 4 opcoes, cleanup provenance-based; **detached HEAD** -> so 3 opcoes (sem merge), sem cleanup (externally managed).
- **Step 3 — Determine Base Branch** (`git merge-base HEAD main || master`, ou pergunta).
- **Step 4 — Present exactly 4 options** (verbatim): "1. Merge back to <base> locally / 2. Push and create a Pull Request / 3. Keep the branch as-is / 4. Discard this work". (3 opcoes pra detached HEAD.) "Don't add explanation."
- **Step 5 — Execute:**
  - **Opt 1 Merge local:** cd pro MAIN_ROOT, checkout base, pull, merge feature, **rodar testes no resultado mergeado**, so entao cleanup worktree + `git branch -d`.
  - **Opt 2 PR:** `git push -u origin <branch>` + `gh pr create` com template (Summary bullets + Test Plan checkboxes). **NAO limpa o worktree** (usuario itera no feedback do PR).
  - **Opt 3 Keep:** preserva tudo.
  - **Opt 4 Discard:** confirma com **"Type 'discard' to confirm"** exato, depois cd MAIN_ROOT, cleanup, `git branch -D`.
- **Step 6 — Cleanup (so Opts 1 e 4):** **provenance check** — so remove worktrees sob `.worktrees/`, `worktrees/` ou `~/.config/superpowers/worktrees/` ("Superpowers created this — we own cleanup"). Worktrees do harness: NAO remover. Sempre `cd` pro main root antes de `git worktree remove`, depois `git worktree prune` (self-healing).

**Por que isto importa pro redesign GitHub-nativo:** o fluxo git E inteiramente CLI/git + `gh` (PR via `gh pr create`, replies de review via `gh api .../pulls/.../comments/.../replies`). Worktrees dao isolamento paralelo. As decisoes de merge/PR/keep/discard sao um menu fechado e deterministico, e a limpeza so toca o que o sistema criou (provenance) — desenhado pra conviver com harnesses que ja gerenciam workspace.

---

## 12. DISPATCHING-PARALLEL-AGENTS

`description`: "Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies". Padrao: 1) identificar dominios independentes (agrupar falhas por subsistema); 2) criar tasks focadas (scope especifico, contexto self-contained, output especifico); 3) dispachar em paralelo (`Task("Fix X.test.ts"); Task("Fix Y.test.ts")` concorrentes); 4) review e integrar (ler summaries, checar conflitos, rodar suite inteira). Quando NAO usar: falhas relacionadas, precisa contexto completo, debugging exploratorio, estado compartilhado. Diferenca pra subagent-driven: este e pra problemas independentes paralelos (debugging de N falhas), nao pra executar um plano sequencial.

---

## 13. WRITING-SKILLS (meta — como as skills sao construidas)

`description`: "Use when creating new skills, editing existing skills, or verifying skills work before deployment". Tese central: **"Writing skills IS Test-Driven Development applied to process documentation."** Iron Law: `NO SKILL WITHOUT A FAILING TEST FIRST` (vale tambem pra EDITS). REQUIRED BACKGROUND: entender test-driven-development antes.

Mapeamento TDD->skill: test case = cenario de pressao com subagente; production code = SKILL.md; RED = agente viola a regra SEM a skill (baseline); GREEN = agente cumpre COM a skill; REFACTOR = fechar loopholes. "If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing."

Pontos de design relevantes pra copiar:
- **Bulletproofing contra racionalizacao:** fechar cada loophole explicitamente ("Don't keep it as 'reference'..."); adicionar "Violating the letter is violating the spirit"; construir **Rationalization Table** (excuse->reality) a partir dos baselines; criar **Red Flags list**; atualizar o `description` com sintomas de quando voce esta PRESTES a violar.
- **CSO** (secao 2): description = quando usar, nunca o workflow.
- **Token efficiency** (secao 1): mover detalhe pro `--help`/arquivos; usar cross-references por nome (nao `@`).
- **Flowcharts** so pra decisao nao-obvia/loop onde voce pararia cedo demais; nunca pra reference (tabela), codigo (markdown) ou instrucao linear (lista numerada).
- **Um exemplo excelente** numa linguagem, nao multi-linguagem diluido. Sem narrativa ("In session 2025-10-03 we found...").
- Arquivos de apoio: `anthropic-best-practices.md`, `persuasion-principles.md` (Cialdini/Meincke — autoridade, compromisso, escassez, prova social, unidade aplicados pra fazer a skill resistir a racionalizacao), `testing-skills-with-subagents.md`. Tem "STOP: Before Moving to Next Skill" — testar e deployar CADA skill antes da proxima.

---

## 14. Como as skills COMPOEM (o pipeline)

O encadeamento e codificado nas proprias skills (cross-references "REQUIRED SUB-SKILL"), nao num orquestrador central:

```
using-superpowers (injetada toda sessao pelo hook)
        |
        v
brainstorming  --(HARD-GATE: design aprovado + spec commitado)-->  writing-plans
        |                                                                |
        |  (gate: antes de EnterPlanMode, brainstorm primeiro)          v
        |                                          using-git-worktrees (isolamento + baseline limpa)
        |                                                                |
        v                                                                v
   spec doc                         subagent-driven-development  (ou executing-plans)
                                                 |
                                     loop por task:
                                       implementer subagent --(usa)--> test-driven-development
                                            |  (bug?) --> systematic-debugging
                                            v
                                       spec-reviewer  -> code-quality-reviewer  (requesting/receiving-code-review)
                                            |
                                       (verification-before-completion em cada claim)
                                                 |
                                                 v
                                   final code review -> finishing-a-development-branch (merge/PR/keep/discard + cleanup)
```

- **dispatching-parallel-agents** e um ramo lateral (N falhas independentes), nao o caminho principal.
- **writing-skills** e meta (evolui o proprio sistema).
- A composicao e "puxada": cada skill termina apontando explicitamente a proxima ("The terminal state is invoking writing-plans"; "REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch").

---

## 15. Filosofia operacional (resumida)

Do README + das skills:
- **TDD na raiz** — "Write tests first, always." Red/green de verdade (ver o teste falhar). Iron Laws em maiusculo, com tabela de racionalizacao e "letter = spirit".
- **Systematic over ad-hoc** — processo > chute. Root cause antes de fix.
- **YAGNI** — remover features desnecessarias de todo design/plano/codigo; reviewer reporta "extra work".
- **DRY** + **frequent commits** (cada task = commit).
- **Complexity reduction** — unidades pequenas, uma responsabilidade, interfaces claras, "files that change together live together".
- **Evidence over claims** — nunca afirmar sucesso sem rodar o comando nesta mensagem. Verificacao independente ate de relatorios de subagente (checar VCS diff).
- **Honestidade como valor** — proibido bajular ("You're absolutely right"/"Thanks"); acoes > palavras.
- **Contexto isolado e curado** — subagentes nunca herdam historia da sessao; o controller constroi exatamente o que precisam, preservando o proprio contexto pra coordenacao.
- **Nunca brigar com o harness** — detectar isolamento existente, preferir tools nativas, provenance-based cleanup, usuario sempre no controle (instrucoes do usuario > skills).

---

## 16. Implicacoes pro redesign do UP (o que vale copiar)

1. **Hook de SessionStart que injeta uma skill-bootstrap inteira** (verbatim, embrulhada em `<EXTREMELY_IMPORTANT>`), disparando em startup/clear/compact. Esse e o coracao da auto-ativacao — nao depende de comando `/`.
2. **`description` = SO gatilhos ("Use when..."), nunca o workflow.** Empiricamente: resumir o workflow no description faz o agente pular o corpo da skill.
3. **Regra "1% de chance -> invoca a skill"** + tabela de red flags que mata racionalizacoes.
4. **Composicao por cross-reference "REQUIRED SUB-SKILL"** (nome da skill, nunca `@arquivo`), com estado terminal explicito em cada skill — pipeline sem orquestrador central.
5. **Iron Laws + Rationalization Tables + Red Flags lists** pra disciplinas (TDD, debugging, verification) — e o que faz as regras "pegarem" sob pressao.
6. **Planos bite-sized (2-5 min), file paths exatos, codigo completo, zero placeholders, red-green-commit por task.**
7. **Subagent-driven com two-stage review** (spec compliance ANTES de code quality), controller passa texto completo (subagente nao le arquivos), reviewer cetico ("finished suspiciously quickly"), roteamento de modelo por complexidade.
8. **Fluxo git nativo:** worktree -> baseline limpa -> menu fechado de 4 opcoes -> `gh pr create` -> cleanup provenance-based. Tudo git/`gh` CLI, conviente com harness.
9. **Token discipline:** <150-200 palavras pro que carrega sempre, detalhe em arquivos sob demanda.

---

Arquivo: `/home/projects/up-cc/redesign/pesquisa/01-superpowers.md`
