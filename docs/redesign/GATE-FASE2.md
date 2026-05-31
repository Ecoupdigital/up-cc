# GATE FASE 2 — Aceite do corte destrutivo UP v2 (onda 1)

> Gate de aceite rodado com provas REAIS no working tree de `/home/projects/up-cc`.
> Data: 2026-05-30. Estado do repo: corte aplicado no working tree (uncommitted); HEAD ainda tem os 52 agentes antigos.
> Lista dos 38 deletados montada da secao A.1 do MANIFEST-FASE2.md e cruzada com `git ls-tree HEAD` (38/38 existiam no HEAD, 0 sobraram como arquivo no working tree).

## Tabela PASS/FAIL

| # | Check | Resultado | Evidencia |
|---|-------|-----------|-----------|
| 1 | **GREP ZERO** (nenhum dos 38 nomes deletados referenciado em arquivos sobreviventes) | **PASS** | `grep -rnE "<38 nomes>" up/commands up/workflows up/references up/templates up/bin` -> exit 1 (0 matches). Variante word-boundary (`-rnwE`) tambem 0. Regex validado sem overlap de substring com survivors. |
| 2 | **CONTAGENS** (agents=17, commands=7, workflows=12) | **PASS** | `ls up/agents \| wc -l` = 17; `ls up/commands` = 7; `ls up/workflows` = 12 (nao inlinaram pausar). |
| 3 | **Agentes novos validos** (pesquisador/revisor/auditor com frontmatter; 14 mantidos existem) | **PASS** | Os 3 tem name+description+tools+model+color. 14 mantidos: todos OK. |
| 4 | **Comandos finais** = up, plan, build, testar, depurar, auditar, rapido | **PASS** | Set exato, 7 arquivos. |
| 5 | **@-references resolvem** (cada comando -> workflow/ref existente; nenhum aponta pra workflow deletado) | **PASS** | 12 @-refs unicos, todos resolvem pra arquivo real. 0 refs a workflows deletados (builder, ceo-intake, novo-projeto, etc). |
| 6 | **SINTAXE** (`node -c` nos 3 .js; `timestamp` e `slug` rodam) | **PASS** | install.js / up-tools.cjs / core.cjs: OK. `timestamp` -> JSON valido. `slug "x"` -> `{"slug":"x"}`. |
| 7 | **INSTALL SMOKE** (sem dry-run -> HOME temp) | **PASS** | exit 0; "Installed 7 commands", "Installed 17 agents", 0 nome de agente morto na saida; temp limpo. |
| 8 | **CAPACIDADE PERDIDA** (builder.md vs build.md+up.md+plan.md) | **PASS (com 1 gap real menor)** | Intake, pesquisa inline de stack e execucao por ondas todos cobertos. 1 capacidade de usuario nao migrada: **reassessment de roadmap pos-fase**. Dashboard auto-start tambem caiu (orfao, server.js sobrevive). Detalhe abaixo. |

**Veredito geral: GATE APROVADO.** Todos os 8 checks passam. Check 8 tem 1 gap funcional real (nao bloqueante) documentado abaixo para decisao consciente.

---

## Evidencia por check

### Check 1 — GREP ZERO (o mais importante)
- 38 nomes em `/tmp/deleted-agents.txt`, regex de 783 chars.
- `grep -rnE "$REGEX" up/commands up/workflows up/references up/templates up/bin` -> **exit 1, zero linhas**.
- Variante word-boundary `grep -rnwE` -> **exit 1**.
- Seguranca do regex confirmada: nenhum nome DELETADO e substring de um SURVIVOR (a sobreposicao so existe no sentido inverso — survivor `up-auditor`/`up-pesquisador`/`up-sintetizador` sao substrings dos deletados, o que NAO gera falso positivo ao grepar pelos nomes deletados completos).
- Plumbing tambem limpo (parte da secao E do manifesto):
  - `up/bin/install.js:401` writeAgents = `'up-pesquisador', 'up-revisor', 'up-auditor'`; 0 nome morto.
  - `up/bin/lib/core.cjs` AGENT_ROLE_MAP: `up-pesquisador:planning`, `up-revisor:review`, `up-auditor:review`; 0 nome morto.

### Check 2 — Contagens
- **agents (17):** up-api-tester, up-arquiteto, up-auditor, up-backend-specialist, up-database-specialist, up-depurador, up-executor, up-exhaustive-tester, up-frontend-specialist, up-mapeador-codigo, up-pesquisador, up-planejador, up-revisor, up-roteirista, up-sintetizador, up-verificador, up-visual-critic.
- **commands (7):** auditar, build, depurar, plan, rapido, testar, up.
- **workflows (12):** auditar, build, dcrv, governance, mapear-codigo, onboarding, pausar, plan, rapido, remover-fase, resetar, up.

### Check 3 — Agentes novos + 14 mantidos
- up-pesquisador.md: name/description/tools(`Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*`)/model(sonnet)/color(blue). OK.
- up-revisor.md: tools(`...mcp__plugin_playwright_playwright__*`)/model(opus)/color(red). OK.
- up-auditor.md: tools(`Read, Write, Bash, Grep, Glob`)/model(sonnet)/color(magenta). OK.
- 14 mantidos: todos presentes (arquiteto, sintetizador, mapeador-codigo, verificador, executor, planejador, depurador, roteirista, frontend/backend/database-specialist, visual-critic, exhaustive-tester, api-tester).

### Check 4 — Comandos finais
- Exatamente {up, plan, build, testar, depurar, auditar, rapido}. Bate com o alvo do manifesto.

### Check 5 — @-references
| Comando | @-refs | Resolve |
|---------|--------|---------|
| up | workflows/up.md | OK |
| plan | workflows/plan.md, workflows/onboarding.md, templates/plan-ready.md, templates/audit-plan.md | OK |
| build | workflows/build.md, workflows/dcrv.md, workflows/governance.md | OK |
| testar | workflows/dcrv.md, references/engineering-principles.md | OK |
| depurar | (inline, sem @-ref de workflow) | OK (esperado) |
| auditar | workflows/auditar.md, references/ui-brand.md | OK |
| rapido | workflows/rapido.md, references/ui-brand.md | OK |

- Grep dirigido por nomes de workflows deletados (builder, builder-e2e, ceo-intake, ceo-updates, novo-projeto, clone-builder, melhorias, ideias, executar-fase, executar-plano, discutir-fase, planejar-fase, ux-tester, mobile-first, verificar-trabalho, iniciar, progresso, retomar) em commands+workflows: **0 matches**.

### Check 6 — Sintaxe + runtime
- `node -c` em install.js, up-tools.cjs, core.cjs: todos OK.
- `up-tools.cjs timestamp` -> `{"timestamp":"2026-05-30T15:05:49.869Z"}`.
- `up-tools.cjs slug "x"` -> `{"slug":"x"}`.

### Check 7 — Install smoke (sem flag dry-run; HOME temporario)
- install.js NAO tem flag `--dry-run`. Rodado `HOME=/tmp/up-smoke-$$ node bin/install.js --claude --global`.
- exit 0. Saida: "Installed up/ (97 files)", "Installed 7 commands", "Installed 17 agents", "Installed 3 hooks", "Installed 4 skills".
- Agentes instalados: 17 (lista identica a origem). Comandos pousam em `~/.claude/commands/up/*.md` (slash) + mirror em `~/.claude/up/commands/`.
- Grep dos 38 nomes mortos na saida do install: **0 matches**.
- Temp removido.

---

## Check 8 — CAPACIDADES DO builder.md (3416 linhas, deletado) vs estado atual

Comparacao funcional `git show HEAD:up/workflows/builder.md` x `build.md`(486L) + `up.md`(443L) + `plan.md`. O proprio build.md tem um bloco `<migrado_de_builder>` declarando o que foi migrado e o que foi "morto de proposito".

### Capacidades centrais — TODAS cobertas (sem gap)
- **Intake de projeto (5 blocos: briefing/design/credenciais/referencias/restricoes):** COBERTO em `up.md` Passo 2.3 (inline, sem CEO, escalado por classify-task; complex = full, simples = pula). Era o "Estagio 1: INTAKE" do builder via CEO.
- **Pesquisa inline de stack (greenfield 4x pesquisadores paralelos + sintese):** COBERTO em `up.md` Passo 2.4 (spawna 4x `up-pesquisador` modo dominio -> STACK/FEATURES/ARCHITECTURE/PITFALLS -> `up-sintetizador` -> SUMMARY.md). Tambem em `plan.md:92` (greenfield, se ainda nao rodou). Era a "Pesquisa de Ecossistema" do builder Estagio 2.
- **Brownfield mini-scan / pesquisa focada so de tecnologias novas:** COBERTO em `up.md` Passo 2.2/2.4 (mini-scan inline; pesquisa so do NOVO).
- **Execucao por ondas (waves paralelas) + specialist routing:** COBERTO em `build.md` Estagio 3.2/3.3 (frontend/backend/database/executor; pre-inline de contexto via `up-tools.cjs context`; loop por fase).
- **Crash recovery via LOCK.md:** COBERTO em `build.md` Estagio 0.3.
- **E2E + DCRV por fase + smoke regression (fase 3+):** COBERTO. E2E/DCRV delegado a `dcrv.md` (absorveu builder-e2e). Smoke regression existe em `dcrv.md:411` `<smoke_regression>` (ativado por `REGRESSION=true`).
- **Modo light (pipeline enxuto pra feature pequena):** COBERTO conceitualmente — a decisao "menos cerimonia" subiu pro classify-task em up.md; build.md tem "Estagio V: VALIDACAO LIGHT". O flag `--light` literal sumiu, mas o comportamento e decidido upstream.
- **Injecao de persistencia no CLAUDE.md do projeto:** o executor commita docs; a injecao explicita do bloco "UP: Persistencia de Estado" no CLAUDE.md do projeto (builder §2.9) nao tem step dedicado em build.md/up.md — minor, coberto parcialmente pelo CLAUDE.md global do usuario.

### GAPS REAIS (feature de usuario que NAO aparece em lugar nenhum agora)

1. **Reassessment de roadmap pos-fase (builder.md §3.1.7) — GAP REAL.**
   No builder, apos CADA fase completa, antes de planejar a proxima, o orquestrador re-avaliava o ROADMAP: detectava fases futuras que viraram redundantes (marcava "Removida (coberta pela Fase X)"), ajustava objetivos/criterios de fases futuras, e podia adicionar fases novas — commitando `docs: reassessment apos fase {X}`.
   - **build.md NAO tem isso.** O unico mecanismo de re-planejamento em build.md e o **re-plan LOCAL da fase atual** quando um plano se revela inviavel (Estagio 3.4, max 2, via self-check do up-planejador). Isso e um mecanismo DIFERENTE: corrige a fase corrente, nao re-pontua/poda o roadmap futuro a luz do que ja foi construido.
   - **Impacto de usuario:** em projeto multi-fase longo, o roadmap nao se auto-ajusta entre fases. Fases futuras redundantes nao sao podadas automaticamente; o usuario carrega fases obsoletas ate executa-las. Nao quebra build, mas perde a "inteligencia adaptativa" do builder.
   - **Nota:** o bloco `<migrado_de_builder>` de build.md lista como "morto de proposito" apenas "re-plans com 2 niveis de aprovacao LLM" — que e outra coisa. O reassessment de roadmap NAO esta declarado como removido de proposito; parece ter caido por omissao. **Recomendacao: decisao consciente** — ou re-inserir um step leve de reassessment no loop de fases de build.md, ou declarar explicitamente que foi cortado.

2. **Dashboard visual auto-iniciado em localhost:4040 (builder.md §2 e comando `/up:dashboard`) — GAP/ORFAO.**
   O builder subia automaticamente o dashboard (`node $HOME/.claude/up/dashboard/server.js 4040 ...`) e anunciava a URL pro acompanhamento em tempo real. O comando `dashboard.md` foi deletado (estava na lista B.1) e nenhum workflow sobrevivente reinicia o server.
   - O arquivo `up/dashboard/server.js` (10KB) **continua no repo** mas virou codigo morto/orfao: nada o invoca.
   - **Impacto de usuario:** perde o monitoramento visual em tempo real do build. A flag `--board` (espelho Multica) e citada como substituta de monitoramento, mas e outra coisa (e ainda esta como stub "Fase 4/5" em build.md). Para a Fase 2 isso e aceitavel (o manifesto previu `--board`), mas vale registrar que o dashboard local saiu sem substituto ativo nesta onda.

### Capacidades intencionalmente removidas (NAO sao gaps — alinhadas ao manifesto)
- CEO / chiefs / supervisores / governanca hierarquica / auditores gold: removidos por design (substituidos por `up-revisor` + gate deterministico `approvals.log`). Confirmado: `approvals.log` preservado e e o enforcement em build.md (GATE de fase) e governance.md.
- Updates periodicos ao dono (ceo-updates): removidos por design.

---

## Resumo executivo

- **7/8 checks: PASS limpo.**
- **Check 8: PASS com ressalva** — capacidades centrais do builder (intake, pesquisa inline de stack, execucao por ondas, crash recovery, E2E/DCRV, smoke regression) estao todas cobertas em up.md/build.md/plan.md/dcrv.md.
- **2 gaps de feature de usuario** para decisao consciente (nenhum bloqueia o corte):
  1. **Reassessment de roadmap pos-fase** — caiu por omissao, nao declarado como corte intencional. Recomendado re-inserir step leve OU declarar corte.
  2. **Dashboard local (localhost:4040)** — orfao; `server.js` sobrevive sem invocador. Substituto `--board` ainda e stub.
- Plumbing (install.js/core.cjs) ja atualizado com os 3 novos agentes e zero nome morto.

**Relatorio salvo em:** `/home/projects/up-cc/redesign/GATE-FASE2.md`
