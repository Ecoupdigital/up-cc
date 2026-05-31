# MANIFEST FASE 2 — Corte destrutivo UP v2 (onda 1)

> Ordem de servico cirurgica pra outro agente executar. NAO discute alvo, executa.
> Ground truth verificado no repo `/home/projects/up-cc/up/`: **52 agentes, 31 comandos, 28 workflows.**
> Alvo onda 1: **agentes 52 -> 17** (14 mantidos + 3 novos; 38 deletados), **comandos 31 -> 7**, **workflows 28 -> 12**.
> Aritmetica validada: 38 deletados + 14 mantidos = 52. 14 mantidos + 3 novos = 17 sobreviventes.
> Ocorrencias de referencia a agentes deletados encontradas no grep exaustivo: **158** (commands: 0, workflows: 77, references: 3, templates: 4, bin: 74), das quais **65** sao spawns reais (`subagent_type`/`Agent(`).

---

## A. AGENTES

### A.1 Tabela DELETAR (38)

Cada linha: arquivo a remover de `up/agents/` + para onde o papel migra.

| # | Arquivo | Para onde vai o papel |
|---|---------|------------------------|
| 1 | up-project-ceo.md | Vira prompt do orquestrador (intake/canal com dono). Personalidade em `owner-profile.md` |
| 2 | up-chief-architect.md | Absorvido por `up-revisor` (consolidacao de arquitetura) |
| 3 | up-chief-engineer.md | Absorvido por `up-revisor` + gate `approvals.log` (aprovacao de fase) |
| 4 | up-chief-operations.md | Absorvido por `up-revisor`; readiness vira checklist no `up-verificador` |
| 5 | up-chief-product.md | Absorvido por `up-revisor` (produto vs briefing) |
| 6 | up-chief-quality.md | Absorvido por `up-revisor` (consolidacao de scores) |
| 7 | up-planning-supervisor.md | Absorvido por `up-revisor` (stage spec-compliance) |
| 8 | up-execution-supervisor.md | Absorvido por `up-revisor` (stage code-quality, ja era code-reviewer) |
| 9 | up-verification-supervisor.md | Absorvido por `up-revisor` |
| 10 | up-architecture-supervisor.md | Absorvido por `up-revisor` |
| 11 | up-audit-supervisor.md | Absorvido por `up-revisor` |
| 12 | up-product-supervisor.md | Absorvido por `up-revisor` |
| 13 | up-operations-supervisor.md | Absorvido por `up-revisor` |
| 14 | up-quality-supervisor.md | Absorvido por `up-revisor` |
| 15 | up-planning-auditor.md | Absorvido por `up-revisor` (Confidence Score de planejamento) |
| 16 | up-delivery-auditor.md | Absorvido por `up-revisor` (Confidence Score de delivery) |
| 17 | up-clone-crawler.md | Vira modo do `up-mapeador-codigo` (crawl+screenshots num passe) |
| 18 | up-clone-design-extractor.md | Vira modo do `up-mapeador-codigo` (extrai design system) |
| 19 | up-clone-feature-mapper.md | Vira modo do `up-mapeador-codigo` (mapeia features/rotas) |
| 20 | up-clone-prd-writer.md | Vira modo do `up-mapeador-codigo` (escreve PRD) |
| 21 | up-clone-verifier.md | Absorvido por `up-verificador` (compara clone vs original) |
| 22 | up-system-designer.md | Fundido em `up-arquiteto` (design upfront ja e do arquiteto) |
| 23 | up-pesquisador-projeto.md | Fundido em `up-pesquisador` (modo dominio) |
| 24 | up-pesquisador-mercado.md | Fundido em `up-pesquisador` (modo mercado) |
| 25 | up-code-reviewer.md | Fundido em `up-revisor` (stage code-quality) |
| 26 | up-security-reviewer.md | Fundido em `up-revisor` (checklist OWASP no review) |
| 27 | up-blind-validator.md | Fundido em `up-revisor` (validacao spec sem ler codigo) |
| 28 | up-auditor-ux.md | Fundido em `up-auditor` (passe unico UX) |
| 29 | up-auditor-performance.md | Fundido em `up-auditor` (passe unico perf) |
| 30 | up-auditor-modernidade.md | Fundido em `up-auditor` (passe unico modernidade) |
| 31 | up-sintetizador-melhorias.md | Fundido em `up-sintetizador` (sintese de melhorias) |
| 32 | up-consolidador-ideias.md | Fundido em `up-sintetizador` (ICE scoring/anti-features) |
| 33 | up-product-analyst.md | Fundido em `up-sintetizador` (personas/features de mercado) |
| 34 | up-requirements-validator.md | Fundido em `up-sintetizador` (13 checks de requisitos) |
| 35 | up-devops-agent.md | Obsoleto. Artefatos de prod viram step do `up-executor` ou skill |
| 36 | up-qa-agent.md | Obsoleto. Geracao de testes vira papel do `up-executor`/`up-exhaustive-tester` |
| 37 | up-technical-writer.md | Obsoleto. Docs viram step do `up-executor` |
| 38 | up-analista-codigo.md | Obsoleto. Analise de gaps absorvida por `up-auditor` + `up-sintetizador` |

### A.2 Tabela CRIAR (3)

Arquivos novos em `up/agents/`. Frontmatter no padrao UP (`name`, `description` em formato gatilho "CSO", `tools`, `model`, `color`).

#### `up-pesquisador.md`
- **Funde:** up-pesquisador-projeto + up-pesquisador-mercado
- **Papel:** pesquisa de dominio (stack/features/arquitetura/armadilhas) E de mercado (concorrentes/tendencias) num agente. Modo selecionado por flag/contexto no prompt: `modo=dominio` (default no planejamento) ou `modo=mercado` (quando `/up:auditar --features`).
- **Frontmatter proposto:**
  ```yaml
  ---
  name: up-pesquisador
  description: Pesquisa de dominio (stack, features, arquitetura, armadilhas) e de mercado (concorrentes, tendencias) via web. Use no planejamento de projeto e na auditoria de features. Modo definido por contexto/flag.
  tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
  model: sonnet
  color: blue
  ---
  ```
- **Base:** copiar corpo de up-pesquisador-projeto, anexar bloco "modo mercado" vindo de up-pesquisador-mercado, gateado por `modo`.

#### `up-revisor.md`
- **Funde:** up-code-reviewer + up-security-reviewer + up-blind-validator + papel de review dos 8 supervisores + 5 chiefs + 2 auditores gold
- **Papel:** two-stage review estilo superpowers. **Stage 1 — spec-compliance cetico:** "terminou rapido demais, inspeciona o codigo real e prova que cumpre o spec" (herda up-blind-validator: valida REQUIREMENTS via comportamento, nao via codigo). **Stage 2 — code-quality:** padroes, edge cases, OWASP/security (herda up-code-reviewer + up-security-reviewer). Emite veredito unico que alimenta o gate `approvals.log`.
- **Frontmatter proposto:**
  ```yaml
  ---
  name: up-revisor
  description: Revisor unico two-stage. Use depois de executor/verificador, antes do gate de fase. Stage 1 ceticismo de spec-compliance (valida comportamento vs REQUIREMENTS sem confiar no codigo), Stage 2 qualidade de codigo + seguranca OWASP. Substitui supervisores, chiefs e auditores gold.
  tools: Read, Write, Bash, Grep, Glob, mcp__plugin_playwright_playwright__*
  model: opus
  color: red
  ---
  ```
- **Base:** novo corpo. Reaproveitar checklist OWASP de up-security-reviewer, criterios RARV de up-code-reviewer, protocolo "sem ler codigo / navega o app" de up-blind-validator, e a logica de Confidence Score (0-100) de up-planning-auditor/up-delivery-auditor como saida do Stage 1.

#### `up-auditor.md`
- **Funde:** up-auditor-ux + up-auditor-performance + up-auditor-modernidade
- **Papel:** auditoria de produto num passe unico (UX + performance + modernidade), com mapa de cobertura e priorizacao. Usado por `/up:auditar`. Carrega as 3 refs de audit (`audit-ux`, `audit-performance`, `audit-modernidade`) sob demanda.
- **Frontmatter proposto:**
  ```yaml
  ---
  name: up-auditor
  description: Auditoria de produto num passe unico (UX, performance, modernidade) com mapa de cobertura e priorizacao. Use no /up:auditar. Substitui os 3 auditores separados.
  tools: Read, Write, Bash, Grep, Glob
  model: sonnet
  color: magenta
  ---
  ```
- **Base:** concatenar os 3 corpos de auditoria em secoes (UX / Perf / Modernidade) com um sumario consolidado no fim. As 3 refs continuam existindo em `up/references/` (audit-ux.md, audit-performance.md, audit-modernidade.md) — nao deletar.

### A.3 Lista MANTER (14) + edicoes necessarias

| Agente | Edicao |
|--------|--------|
| up-arquiteto | **EDITAR.** Absorve up-system-designer: adicionar ao corpo o passo de definir modulos/roles/schema/rotas/permissoes + blueprints de producao (era o papel do system-designer). Sem mudanca de frontmatter alem de garantir tools com `mcp__context7__*` (ja tem) |
| up-sintetizador | **EDITAR (grande).** Absorve up-sintetizador-melhorias + up-consolidador-ideias + up-product-analyst + up-requirements-validator. Corpo passa a cobrir 4 modos de sintese: research de projeto (atual), cruzamento/dedup de melhorias, consolidacao+ICE de ideias, e validacao de REQUIREMENTS (13 checks). Adicionar tools `Grep, Glob, WebFetch, WebSearch` (hoje so tem `Read, Write, Bash`) porque product-analyst pesquisava mercado |
| up-mapeador-codigo | **EDITAR.** Ganha modo `clone`: recebe URL, usa Playwright pra crawl + extrai design system + mapeia features/rotas + escreve PRD num passe (papel dos 4 clone-* deletados). Adicionar `mcp__plugin_playwright_playwright__*` ao tools (hoje nao tem) |
| up-verificador | **EDITAR (leve).** Ganha modo `clone-fidelity` (comparar clone vs original lado a lado, papel de up-clone-verifier). Adicionar `mcp__plugin_playwright_playwright__*` ao tools. Tambem reforcar "evidencia fresca por tipo de codigo" (mencionado no UP-V2-FINAL, mas e Fase 3 — aqui so nao quebrar) |
| up-executor | **EDITAR (leve).** Passa a poder gerar artefatos de prod/docs/testes inline (papeis de devops/technical-writer/qa absorvidos), sem virar agente separado. Sem mudanca obrigatoria de frontmatter |
| up-planejador | MANTER sem edicao |
| up-depurador | MANTER sem edicao |
| up-roteirista | MANTER sem edicao |
| up-frontend-specialist | MANTER (onda 1 conserva os 3 specialists; fusao no executor e onda 2/v2.1) |
| up-backend-specialist | MANTER (idem) |
| up-database-specialist | MANTER (idem) |
| up-visual-critic | MANTER (detector DCRV; fusao no tester e onda 2) |
| up-exhaustive-tester | MANTER (idem) |
| up-api-tester | MANTER (idem) |

> Nota onda 1 vs onda 2: o UP-V2-FINAL declara alvo final 12 agentes em 2 ondas. **Esta Fase 2 e a onda 1 (52 -> 17).** Os 3 specialists e os 3 detectores DCRV sobrevivem agora; serao fundidos em `up-executor` e `up-tester` somente na onda 2 (v2.1), apos medir qualidade. NAO criar `up-tester` nesta fase.

---

## B. COMANDOS

### B.1 Tabela DELETAR (24)

Remover de `up/commands/`. Comando absorvedor entre parenteses.

| # | Arquivo | Absorvido por |
|---|---------|----------------|
| 1 | novo-projeto.md | `/up` (com descricao -> brainstorm -> roteia) |
| 2 | iniciar.md | `/up` |
| 3 | modo-builder.md | `/up` (greenfield/brownfield) + `/up:build` |
| 4 | clone-builder.md | `/up` (modo clone) |
| 5 | onboard.md | `/up` (subverbo `config` / primeiro uso) |
| 6 | progresso.md | `/up` (sem arg = continua) |
| 7 | retomar.md | `/up` (sem arg, le STATE.md) |
| 8 | pausar.md | `/up` (subverbo `estado`) |
| 9 | saude.md | `/up` (subverbo `estado`) |
| 10 | resetar.md | `/up` (subverbo `estado`) |
| 11 | mapear-codigo.md | `/up` (deteccao brownfield) |
| 12 | custos.md | `/up` (subverbo `estado`) |
| 13 | dashboard.md | `/up` (flag `--board` -> URL Multica) |
| 14 | configurar.md | `/up` (subverbo `config`) |
| 15 | ajuda.md | `/up` (sem contexto) |
| 16 | atualizar.md | `/up` (subverbo `config`, npm update) |
| 17 | remover-fase.md | `/up` (subverbo `estado`, edita ROADMAP) |
| 18 | discutir-fase.md | `/up:plan` (deteccao fase) |
| 19 | planejar-fase.md | `/up:plan` (deteccao fase) |
| 20 | executar-fase.md | `/up:build` |
| 21 | ux-tester.md | `/up:testar` (flag `--ux`) |
| 22 | mobile-first.md | `/up:testar` (flag `--mobile`) |
| 23 | adicionar-testes.md | `/up:testar` (flag de gerar testes) |
| 24 | verificar-trabalho.md | `/up:testar` (gate UAT) + checkpoint de `/up:build` |

### B.2 CRIAR (2)

#### `up/commands/up.md`
- **Objetivo:** porta unica. Sem arg = le `.plano/STATE.md` e roteia pra proxima acao (continua de onde parou). Com descricao = dispara brainstorm escalado (reusa `classify-task`) e roteia greenfield/brownfield/clone. Subverbos (max 3): `estado` (status/saude/resetar/pausar/custos/remover-fase), `config` (configurar/onboard/atualizar).
- **Frontmatter esboco:**
  ```yaml
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
  ```
- **@-references:** `@~/.claude/up/workflows/up.md` (NOVO workflow roteador — ver secao C). O workflow up.md chama internamente: brainstorm/intake, novo-projeto (greenfield), mapear-codigo (brownfield/clone), progresso (continuar), estado/config inline.

#### `up/commands/auditar.md`
- **Objetivo:** auditoria priorizada de produto (UX + perf + modernidade num passe via `up-auditor`). Flag `--features` ativa `up-pesquisador` modo mercado pra sugerir features novas. Saida = relatorio priorizado (ICE) via `up-sintetizador`.
- **Frontmatter esboco:**
  ```yaml
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
  ```
- **@-references:** `@~/.claude/up/workflows/auditar.md` (NOVO — funde melhorias.md + ideias.md). Spawna `up-auditor` (1x, passe unico) + `up-sintetizador` (consolida). Com `--features`: + `up-pesquisador` modo mercado.

### B.3 REESCREVER (5)

| Comando | Passa a absorver | Workflow @-referenciado (final) |
|---------|------------------|----------------------------------|
| `build.md` | executar-fase, executar-plano, modo-builder (parte de execucao) | `@~/.claude/up/workflows/build.md` + `@~/.claude/up/workflows/dcrv.md`. **REMOVER** os @-refs a `governance.md` (so se governance for reescrito como gate-only) e a `builder-e2e.md`. GitHub-nativo por padrao (worktree->issue->PR->merge); flags `--solo` (escape), `--board` (Multica), `--auto` (merge se verde) |
| `plan.md` | discutir-fase, planejar-fase, adicionar-fase | `@~/.claude/up/workflows/plan.md`. **REMOVER** @-refs a `ceo-intake.md` (CEO morre; intake vira prompt do orquestrador). Entrada = BRIEFING.md do brainstorm. Deteccao automatica projeto vs fase (absorve discutir/planejar-fase) |
| `testar.md` | ux-tester, mobile-first, adicionar-testes, verificar-trabalho | `@~/.claude/up/workflows/dcrv.md` (loop DCRV unico). Flags `--ux`, `--mobile`, `--e2e`/gerar-testes. Default roda tudo. Incorporar gate UAT (era verificar-trabalho) |
| `depurar.md` | (nada novo) | `@~/.claude/up/workflows/depurar.md` (ver C: hoje depurar.md command NAO @-referencia workflow; criar/extrair workflow depurar.md a partir do corpo do comando OU manter inline). MANTER comportamento |
| `rapido.md` | (papel reforcado) | `@~/.claude/up/workflows/rapido.md`. Escape hatch nomeado: commit atomico na branch atual, sem worktree/PR/Multica/roadmap. Sem mudanca estrutural |

> Observacao sobre `depurar`: o comando `up/commands/depurar.md` hoje NAO tem `@-reference` de workflow (nao existe `workflows/depurar.md`). O fluxo vive inline no comando + agente `up-depurador`. Manter assim (nenhum workflow a criar) OU, por consistencia, extrair pra `workflows/depurar.md`. Recomendacao: manter inline (nao inventar arquivo). Por isso o alvo de workflows nao conta um `depurar.md`.

---

## C. WORKFLOWS (28 -> 12)

Acao por workflow. Garantir que todo `@-reference` dos 7 comandos finais resolve pra um workflow existente ao fim.

| # | Workflow | Acao | Detalhe |
|---|----------|------|---------|
| 1 | builder.md | **DELETAR** | 3416 linhas, 41 refs a agentes deletados. Era o motor do `modo-builder`. `build.md` (650 linhas) ja e o motor canonico do `/up:build`. Migrar pra build.md o que faltar (pesquisa inline, intake) sem trazer governanca |
| 2 | builder-e2e.md | **FUNDIR-EM** dcrv.md | E2E e parte do loop de teste. Remover @-ref de build.md |
| 3 | build.md | **REESCREVER** | Tirar spawns de supervisores/chiefs/CEO/auditores (ver tabela D). Pipeline final: `up-planejador (local, se replan) -> up-executor/specialists -> up-verificador -> [GATE approvals.log] -> up-revisor`. GitHub-nativo + menu 4 opcoes no fim |
| 4 | plan.md | **REESCREVER** | Tirar product-analyst, system-designer, supervisores, chiefs, planning-auditor, CEO. Pipeline final: `up-pesquisador -> up-arquiteto (absorve system-designer) -> up-roteirista -> up-sintetizador (valida reqs) -> [GATE] -> up-revisor` |
| 5 | dcrv.md | **MANTER** (+ absorver) | Ja limpo (0 refs deletadas). Absorve builder-e2e (E2E), ux-tester, mobile-first. Spawns sobreviventes: up-visual-critic, up-api-tester, up-exhaustive-tester, up-frontend-specialist (correcao). Vira o workflow unico de `/up:testar` |
| 6 | ceo-intake.md | **DELETAR** | CEO morre. Intake vira prompt do orquestrador no workflow `up.md`/`plan.md`. Conteudo (gera BRIEFING/OWNER/PENDING/DESIGN-TOKENS) migra inline pro brainstorm de `up.md` |
| 7 | ceo-updates.md | **DELETAR** | Updates periodicos do CEO. Sem CEO, vira no-op. Remover |
| 8 | governance.md | **REESCREVER (gate-only)** | Tirar a hierarquia CEO->chief->supervisor. Manter SO o mecanismo deterministico `approvals.log` + cap de rework (1 round). Vira `gates.md` conceitual ou governance.md enxuto. @-referenciado por build.md |
| 9 | novo-projeto.md | **FUNDIR-EM** up.md | Greenfield. Spawna 4x up-pesquisador-projeto (vira up-pesquisador) + up-sintetizador. Logica vai pro roteador `up.md` |
| 10 | clone-builder.md | **FUNDIR-EM** up.md + mapear-codigo.md | Pipeline clone (5 spawns) -> modo clone do up-mapeador-codigo + up-verificador. Logica de roteamento vai pro `up.md` |
| 11 | mapear-codigo.md | **MANTER** (+ modo clone) | 0 refs deletadas. Ganha modo clone. @-referenciado indiretamente por up.md (brownfield) |
| 12 | melhorias.md | **FUNDIR-EM** auditar.md (NOVO) | Spawna 3 auditores + sintetizador-melhorias -> vira 1 spawn up-auditor + up-sintetizador |
| 13 | ideias.md | **FUNDIR-EM** auditar.md (NOVO) | Spawna analista-codigo + pesquisador-mercado + consolidador -> up-auditor + up-pesquisador(mercado) + up-sintetizador |
| 14 | executar-fase.md | **FUNDIR-EM** build.md | 0 refs deletadas, mas absorvido por /up:build |
| 15 | executar-plano.md | **FUNDIR-EM** build.md | idem |
| 16 | discutir-fase.md | **FUNDIR-EM** plan.md | 0 refs deletadas; vira deteccao automatica de fase no plan |
| 17 | planejar-fase.md | **FUNDIR-EM** plan.md | idem |
| 18 | ux-tester.md | **FUNDIR-EM** dcrv.md | 0 refs deletadas; vira flag --ux |
| 19 | mobile-first.md | **FUNDIR-EM** dcrv.md | 0 refs deletadas; vira flag --mobile |
| 20 | verificar-trabalho.md | **FUNDIR-EM** dcrv.md | 0 refs deletadas; vira gate UAT do testar |
| 21 | iniciar.md | **FUNDIR-EM** up.md | registro leve de projeto existente |
| 22 | progresso.md | **FUNDIR-EM** up.md | "continuar de onde parou" |
| 23 | retomar.md | **FUNDIR-EM** up.md | restaurar contexto |
| 24 | pausar.md | **FUNDIR-EM** up.md | subverbo estado |
| 25 | resetar.md | **MANTER** | 0 refs deletadas. Operacao destrutiva de `.plano/`. @-referenciado por up.md subverbo estado (ou manter como util chamavel). Recomendacao: MANTER arquivo, chamado por up.md |
| 26 | remover-fase.md | **MANTER** | 0 refs deletadas. Edita ROADMAP. @-referenciado por up.md subverbo estado |
| 27 | onboarding.md | **MANTER** | 0 refs deletadas. Perfil do dono. @-referenciado por up.md subverbo config (e por plan.md gate owner-profile) |
| 28 | (NOVO) up.md | **CRIAR** | Roteador da porta unica. Le STATE.md, classify-task, dispara brainstorm/intake inline, roteia greenfield (ex-novo-projeto), brownfield/clone (ex-mapear/clone), continuar (ex-progresso/retomar), estado, config |
| 29 | (NOVO) auditar.md | **CRIAR** | Funde melhorias.md + ideias.md. Spawna up-auditor (+up-sintetizador; +up-pesquisador se --features) |

### Conjunto final de workflows (12)

`up.md` (NOVO), `plan.md`, `build.md`, `dcrv.md`, `auditar.md` (NOVO), `rapido.md`, `mapear-codigo.md`, `onboarding.md`, `resetar.md`, `remover-fase.md`, `governance.md` (gate-only), `pausar.md`.

> `pausar.md` pode ser inlinado em up.md (subverbo estado) pra mirar 11. Mantido por seguranca de migracao. Deletados/fundidos: builder, builder-e2e, ceo-intake, ceo-updates, novo-projeto, clone-builder, melhorias, ideias, executar-fase, executar-plano, discutir-fase, planejar-fase, ux-tester, mobile-first, verificar-trabalho, iniciar, progresso, retomar (18 arquivos removidos da arvore final).

### Verificacao de resolucao de @-references dos 7 comandos finais

| Comando | @-references finais | Resolve? |
|---------|---------------------|----------|
| up.md | workflows/up.md | SIM (criar) |
| plan.md | workflows/plan.md, workflows/onboarding.md, templates/plan-ready.md, templates/audit-plan.md | SIM (audit-plan.md template precisa edicao de frontmatter — secao E) |
| build.md | workflows/build.md, workflows/dcrv.md, workflows/governance.md | SIM (governance reescrito gate-only) |
| testar.md | workflows/dcrv.md, references/engineering-principles.md | SIM (ja resolvem) |
| depurar.md | (inline, sem workflow) | SIM (nenhum a criar) |
| auditar.md | workflows/auditar.md | SIM (criar) |
| rapido.md | workflows/rapido.md, references/ui-brand.md | SIM (ja resolvem) |

---

## D. TABELA SPAWN-REPLACEMENT (a mais importante)

Grep exaustivo dos 38 agentes deletados em `up/commands/`, `up/workflows/`, `up/references/`, `up/templates/`, `up/bin/`. **158 ocorrencias totais; 65 spawns reais.** Nenhuma em `up/commands/` (todos os comandos que spawnavam agentes deletados serao deletados ou reescritos via workflow). Acao por ocorrencia em commands/workflows (bin e templates/references estao nas secoes E):

### workflows/builder.md (DELETAR o arquivo inteiro — 41 refs)
Arquivo vai ser deletado, entao as 41 ocorrencias somem juntas. Migrar o conteudo util pra build.md/plan.md/up.md JA SEM esses spawns. Linhas afetadas (pra conferencia): 144, 301, 307, 505, 522, 539, 556, 580, 674, 715, 764, 840, 1049, 1058, 1060, 1063, 1066, 1253, 1389, 1485, 1497, 1526, 1547, 1684, 1879, 2090, 2107, 2123, 2139, 2159, 2297, 2308, 2322, 2354, 2403, 2506, 2545, 2587, 2625, 2662, 2668, 2898. **Acao global: DELETAR arquivo.**

### workflows/build.md (REESCREVER — 6 refs)
| Linha | Agente deletado | Acao |
|-------|------------------|------|
| 165 | up-project-ceo | **REMOVER step.** Confirmacao do dono vira prompt do orquestrador (AskUserQuestion inline) |
| 331 | up-execution-supervisor | **TROCAR por up-revisor** (stage code-quality) |
| 424 | up-planning-supervisor | **REMOVER step.** Re-plan local valida via up-planejador self-check; gate via approvals.log |
| 486 | up-verification-supervisor | **TROCAR por up-revisor** (consolidacao do verificador) OU remover (verificador ja emite VERIFICATION.md) |
| 515 | up-chief-engineer | **REMOVER step.** Aprovacao de fase vira gate deterministico approvals.log |
| 565 | up-delivery-auditor | **TROCAR por up-revisor** (Confidence Score de delivery) |

### workflows/plan.md (REESCREVER — 13 refs)
| Linha | Agente deletado | Acao |
|-------|------------------|------|
| 43 | up-product-analyst | **TROCAR por up-sintetizador** (modo produto) ou inline no up-arquiteto |
| 84 | up-project-ceo | **REMOVER step.** Intake inline no orquestrador |
| 142 | up-product-analyst | **TROCAR por up-sintetizador** |
| 152 | up-product-supervisor | **REMOVER step** |
| 168 | up-system-designer | **TROCAR por up-arquiteto** (absorveu system-designer) |
| 178 | up-architecture-supervisor | **REMOVER step** |
| 204 | up-architecture-supervisor | **REMOVER step** |
| 220 | up-requirements-validator | **TROCAR por up-sintetizador** (modo validacao de reqs) |
| 223 | up-chief-architect | **REMOVER step** |
| 304 | up-planning-supervisor | **REMOVER step** |
| 335 | up-chief-engineer | **REMOVER step** |
| 394 | up-planning-auditor | **TROCAR por up-revisor** (Confidence Score de planejamento) |
| 476 | up-project-ceo | **REMOVER step** (apresentacao do plano = output direto do orquestrador) |

### workflows/clone-builder.md (FUNDIR-EM up.md/mapear — 5 refs)
Arquivo sera fundido/deletado. Ao migrar a logica:
| Linha | Agente deletado | Acao |
|-------|------------------|------|
| 81 | up-clone-crawler | **TROCAR por up-mapeador-codigo** modo clone (crawl) |
| 117 | up-clone-design-extractor | **INLINE no up-mapeador-codigo** modo clone (design) |
| 133 | up-clone-feature-mapper | **INLINE no up-mapeador-codigo** modo clone (features) |
| 166 | up-clone-prd-writer | **INLINE no up-mapeador-codigo** modo clone (PRD) |
| 238 | up-clone-verifier | **TROCAR por up-verificador** modo clone-fidelity |

### workflows/novo-projeto.md (FUNDIR-EM up.md — 5 refs)
| Linha | Agente deletado | Acao |
|-------|------------------|------|
| 361 | up-pesquisador-projeto | **TROCAR por up-pesquisador** (4 paralelos) |
| 379 | up-pesquisador-projeto | **TROCAR por up-pesquisador** |
| 396 | up-pesquisador-projeto | **TROCAR por up-pesquisador** |
| 413 | up-pesquisador-projeto | **TROCAR por up-pesquisador** |
| 430 | up-pesquisador-projeto | **TROCAR por up-pesquisador** |

### workflows/melhorias.md (FUNDIR-EM auditar.md — 4 refs)
| Linha | Agente deletado | Acao |
|-------|------------------|------|
| 84 | up-auditor-ux | **TROCAR por up-auditor** (passe unico — colapsar os 3 spawns em 1) |
| 113 | up-auditor-performance | **REMOVER** (colapsado no up-auditor) |
| 142 | up-auditor-modernidade | **REMOVER** (colapsado no up-auditor) |
| 202 | up-sintetizador-melhorias | **TROCAR por up-sintetizador** |

### workflows/ideias.md (FUNDIR-EM auditar.md — 3 refs)
| Linha | Agente deletado | Acao |
|-------|------------------|------|
| 84 | up-analista-codigo | **TROCAR por up-auditor** (analise de gaps) |
| 114 | up-pesquisador-mercado | **TROCAR por up-pesquisador** modo mercado |
| 176 | up-consolidador-ideias | **TROCAR por up-sintetizador** (ICE/anti-features) |

> Total spawns reescritos/removidos em workflows que sobrevivem (build.md, plan.md) ou sao migrados (clone, novo-projeto, melhorias, ideias): 6 + 13 + 5 + 5 + 4 + 3 = 36. Os 41 de builder.md somem com o arquivo. 36 + 41 = 77 ocorrencias em workflows — bate com o grep. **Nenhum agente deletado pode sobrar referenciado:** apos as trocas, fazer `grep -rnf <lista> workflows/` deve retornar 0.

---

## E. OUTRAS REFERENCIAS (bin, references, templates) — 74+7 ocorrencias

### E.1 `up/bin/lib/core.cjs` — `AGENT_ROLE_MAP` (linhas 90-142)
33 entradas mapeiam agentes deletados pra role (planning/execution/governance/review). Acao:
- **REMOVER as 33 linhas** dos agentes deletados: up-product-analyst (94), up-system-designer (95), up-pesquisador-projeto (97), up-requirements-validator (100), up-devops-agent (106), up-technical-writer (107), e os 16 de governanca (110-125), e os de review (128-141: up-blind-validator, up-code-reviewer, up-security-reviewer, up-qa-agent, up-auditor-ux, up-auditor-performance, up-auditor-modernidade, up-sintetizador-melhorias, up-analista-codigo, up-pesquisador-mercado, up-consolidador-ideias).
- **ADICIONAR** os 3 novos: `'up-pesquisador': 'planning'` (ou 'review' quando modo mercado — usar 'planning'), `'up-revisor': 'review'`, `'up-auditor': 'review'`.
- Manter os 14 sobreviventes ja mapeados.

### E.2 `up/bin/up-tools.cjs` — skill-manifest / AGENT_REFS (linhas ~2825-2877)
38 entradas mapeiam agente -> refs compressas. Acao:
- **REMOVER as 33 linhas** dos agentes deletados (2836 system-designer, 2835 product-analyst, 2838 pesquisador-projeto, 2841 requirements-validator, 2828 devops, 2829 technical-writer, 2844-2859 governanca inteira, 2863-2876 review deletados).
- **ADICIONAR**: `'up-pesquisador': []`, `'up-revisor': ['engineering-principles-compressed', 'production-requirements-compressed']`, `'up-auditor': ['audit-ux','audit-performance','audit-modernidade']`.
- **EDITAR** `up-arquiteto` (2834): pode ganhar refs de system-designer (ja tem engineering+production). `up-sintetizador` (2839): hoje `[]`, manter ou adicionar `production-requirements-compressed` (absorveu requirements-validator).
- **Nota Quick-win do UP-V2-FINAL:** o roadmap manda remover a maquinaria de routing das Waves 5-6 (`analyze-routing`, `resolve-model-for-plan`, `routing-log`, `skill-manifest`) e MANTER `classify-task`. Se essa remocao acontecer junto, o bloco AGENT_REFS inteiro pode sumir — mas isso e escopo de outra fase. Para Fase 2, basta nao deixar nome de agente deletado: **remover as 33 linhas** e suficiente.

### E.3 `up/bin/install.js` — `getCodexSandboxMode` writeAgents (linhas 398-406)
Array hardcoded de agentes com `workspace-write` pro Codex. Contem 13 deletados: up-devops-agent, up-technical-writer, up-system-designer, up-sintetizador-melhorias, up-consolidador-ideias, up-clone-crawler, up-clone-design-extractor, up-clone-feature-mapper, up-clone-prd-writer, up-clone-verifier, up-qa-agent, up-analista-codigo, up-pesquisador-projeto, up-pesquisador-mercado, up-product-analyst, up-project-ceo, up-blind-validator.
- **REMOVER** os nomes deletados do array.
- **ADICIONAR** os novos que escrevem arquivos: `up-pesquisador`, `up-auditor` (escrevem relatorios), `up-revisor` (escreve review). Todos os 3 fazem Write -> incluir em writeAgents.
- Resto da install.js descobre agentes via `readdirSync` (linha 566/606/631), entao **deletar os 38 .md basta** pra eles sumirem do install; so o array hardcoded acima precisa edicao manual.

### E.4 `up/references/` (3 ocorrencias)
| Arquivo:linha | Mencao | Acao |
|---------------|--------|------|
| references/governance-rules.md:13 | "CEO (up-project-ceo)" | **EDITAR** (texto). governance-rules sera reescrito gate-only; remover hierarquia CEO/chief/supervisor. Ou deletar o ref se governance.md virar so approvals.log |
| references/production-requirements.md:4 | "O up-system-designer e up-arquiteto usam..." | **EDITAR**: trocar "up-system-designer e up-arquiteto" por so "up-arquiteto" |
| references/severity-levels.md:4 | "Carregado pelo up-project-ceo." | **EDITAR**: trocar por "Carregado pelo orquestrador / up-revisor" |

> `references/audit-ux.md`, `audit-performance.md`, `audit-modernidade.md`: **MANTER** (sao consumidas pelo novo `up-auditor`). `governance-rules-compressed.md` e `rework-limits-compressed.md`: revisar conteudo (so referenciados pela governanca deletada) — podem ser simplificados pra gate-only ou deletados na limpeza de routing.

### E.5 `up/templates/` (4 ocorrencias)
| Arquivo:linha | Mencao | Acao |
|---------------|--------|------|
| templates/audit-plan.md:3 | "relatorio do up-planning-auditor" | **EDITAR**: trocar por "up-revisor (stage planejamento)" |
| templates/audit-plan.md:14 | `auditor: up-planning-auditor` (frontmatter) | **EDITAR**: `auditor: up-revisor` |
| templates/audit-report.md:11 | `auditor: up-delivery-auditor` (frontmatter) | **EDITAR**: `auditor: up-revisor` |
| templates/design-tokens.md:3 | "Gerado pelo up-system-designer durante Estagio 2" | **EDITAR**: "Gerado pelo up-arquiteto durante a fase de arquitetura" |

> `audit-plan.md` e `audit-report.md` continuam validos (sao saidas do up-revisor agora). NAO deletar templates.

---

## F. ORDEM DE EXECUCAO SUGERIDA + RISCOS

### F.1 Ordem (sem deixar referencia quebrada em momento nenhum)

1. **Criar os 3 agentes novos** (`up-pesquisador.md`, `up-revisor.md`, `up-auditor.md`) e **editar os 5 sobreviventes** (up-arquiteto, up-sintetizador, up-mapeador-codigo, up-verificador, up-executor). Aditivo, nao quebra nada.
2. **Criar os 2 workflows novos** (`workflows/up.md`, `workflows/auditar.md`) e **reescrever** `build.md`, `plan.md`, `dcrv.md` (absorvendo), `governance.md` (gate-only). Aplicar TODAS as trocas/remocoes de spawn da secao D nesses arquivos.
3. **Criar os 2 comandos novos** (`commands/up.md`, `commands/auditar.md`) e **reescrever** os 5 (build, plan, testar, depurar, rapido) corrigindo @-references (remover builder-e2e, ceo-intake; apontar pros workflows finais).
4. **Editar bin** (core.cjs AGENT_ROLE_MAP, up-tools.cjs AGENT_REFS, install.js writeAgents) removendo os 38 nomes e adicionando os 3 novos.
5. **Editar references/templates** (5 arquivos da secao E.4/E.5).
6. **Validar com grep** (gate de corte): `grep -rnf <38-nomes> up/commands up/workflows up/references up/templates up/bin` deve retornar **0**.
7. **So entao DELETAR** os 38 arquivos de `up/agents/`, os 24 comandos e os 18 workflows fundidos/deletados. Deletar por ultimo garante que nada referencie um arquivo que ainda nao foi religado.
8. **Smoke test do install**: `cd up && node bin/install.js --claude --global` nao pode quebrar (install descobre agentes por readdir; checar que writeAgents nao tem nome morto).

### F.2 Particionamento por dono de diretorio (execucao paralela sem conflito)

Tres frentes independentes que NAO tocam os mesmos arquivos (podem rodar em paralelo ate o passo 6):

- **Dono A — Agentes:** so `up/agents/` (criar 3, editar 5, deletar 38). Zero conflito com B/C.
- **Dono B — Workflows + Commands:** `up/workflows/` + `up/commands/` (criar 2+2, reescrever 5+5, aplicar secao D, deletar 18+24). Auto-contido; depende so dos NOMES dos agentes novos (ja definidos neste manifesto), nao dos arquivos.
- **Dono C — Plumbing:** `up/bin/` (core.cjs, up-tools.cjs, install.js) + `up/references/` + `up/templates/`. Edits pontuais por nome; independente de A/B.

Ponto de juncao serial: passo 6 (grep gate) e passo 7 (deletar agentes) so depois das 3 frentes terminarem. O delete final dos arquivos (.md de agents/commands/workflows) e a unica operacao que exige todas as frentes prontas.

### F.3 Riscos

1. **builder.md tem 3416 linhas com logica que build.md (650) talvez nao cubra** (pesquisa inline de stack, intake de projeto, updates ao dono). Risco: deletar builder.md perder feature. **Mitigacao:** antes de deletar, fazer diff funcional builder.md vs build.md+plan.md+up.md e migrar o que faltar (sem governanca). Nao deletar builder.md no passo 1; deletar no passo 7 depois de confirmar paridade.
2. **Quebra de @-reference em runtime** se um comando reescrito apontar pra workflow ainda nao criado. **Mitigacao:** ordem rigida (workflows antes de commands; criar antes de deletar).
3. **install.js writeAgents com nome morto** nao quebra install (so nao casa no `.includes`), mas nome novo FALTANDO faz o agente novo cair em `read-only` no Codex e nao conseguir escrever. **Mitigacao:** garantir up-pesquisador/up-revisor/up-auditor no array.
4. **classify-task / approvals.log / .plano sao OURO** — nenhum passo deste manifesto toca STATE.md, ROADMAP.md parsing, commits atomicos, ou approvals.log. Confirmar que governance.md reescrito MANTEM o check de approvals.log (so tira os spawns LLM).
5. **Onda 1 != onda 2:** nao fundir specialists no executor nem detectores DCRV no tester agora. Quem executar deve resistir a "ja que estou aqui" — o alvo desta fase e 17, nao 12.
6. **Gemini/OpenCode/Codex conversions:** install.js converte frontmatter por runtime. Agentes novos precisam de frontmatter valido (tools comma-separated no source; o conversor cuida do resto). Conferir que `model:` esta presente (opus/sonnet) nos 3 novos — o source UP usa `model` no frontmatter.

---

## RESUMO DE NUMEROS (gate de aceite)

- Agentes: **52 -> 17** (deletar 38, manter 14, criar 3). Aritmetica: 38+14=52; 14+3=17.
- Comandos: **31 -> 7** (deletar 24, criar 2, reescrever 5). Os 7 finais: up, plan, build, testar, depurar, auditar, rapido.
- Workflows: **28 -> 12** (deletar/fundir 18, manter 6, reescrever 2 in-place, criar 2). Conjunto final: up, plan, build, dcrv, auditar, rapido, mapear-codigo, onboarding, resetar, remover-fase, governance(gate-only), pausar.
- Spawn-replacement: **158 ocorrencias** de nomes de agentes deletados (workflows 77, bin 74, references 3, templates 4, commands 0); **65 sao spawns reais**. Pos-corte: grep tem que dar **0**.
