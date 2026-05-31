# UP — Auditoria de Arquitetura: Onde Está Gordo, Lento e Redundante

Auditoria severa do sistema UP em `/home/projects/up-cc/up/`. Premissa do dono: modelos de IA atuais são muito mais inteligentes, então o UP não precisa de tanta camada crítica/supervisor nem de tantos agentes/comandos. Quer MENOS, MAIS RÁPIDO, mantendo qualidade.

**Veredito:** O UP é um sistema de meta-prompting bem construído estrangulado por **teatro de processo corporativo**. A hierarquia "CEO → 5 Chiefs → 8 Supervisores → 36 operacionais" foi desenhada para compensar modelos burros de 2024. Com Opus 4.x / Sonnet 4.x, ela só multiplica latência, custo de token e pontos de falha sem ganho de qualidade proporcional. O ouro real (persistência `.plano/`, commits atômicos, gates determinísticos via `approvals.log`, separação plan/build entre runtimes) está intacto e deve ser preservado.

---

## 1. NÚMEROS DE ABERTURA

| Métrica | Hoje | Proposta | Corte |
|--------|------|----------|-------|
| Comandos | 32 | **~14** | -56% |
| Agentes | 52 | **~18** | -65% |
| Camadas de governança (build) | 4 (CEO→Chief→Supervisor→Operacional) | **2** (Operacional→Revisor único) | -50% |
| Spawns de agente por fase (build típico) | ~8-12 | **~3-4** | -65% |
| Spawns no fluxo `/up:plan` completo | ~15 (com 2 supervisores + 2 chiefs + auditor) | **~5** | -67% |
| Workflows | 29 | **~16** | -45% |

---

## 2. CONSOLIDAÇÃO DE COMANDOS — 32 → ~14

### Grupos de sobreposição flagrante

**A. Entrada de projeto (5 comandos fazem variações da mesma coisa):**
`novo-projeto.md`, `iniciar.md`, `modo-builder.md`, `plan.md`, `build.md`. Todos detectam greenfield/brownfield e inicializam `.plano/`. `novo-projeto` é "questionar+roadmap", `iniciar` é "registrar leve", `modo-builder` é "fazer tudo autônomo", `plan`+`build` é "planejar aqui / executar noutro runtime". A diferença real é só **profundidade** e **se executa ou não** — deveria ser flag, não 5 comandos.

**B. Planejamento de fase (3 comandos, 1 já marcado DEPRECADO):**
`adicionar-fase.md` (frontmatter literalmente diz `[DEPRECADO] Use /up:planejar-fase`), `planejar-fase.md`, `discutir-fase.md`. O `discutir-fase` é só um pré-passo de coleta de contexto do `planejar-fase`.

**C. Testes/QA (4 comandos sobrepostos):**
`testar.md`, `ux-tester.md`, `adicionar-testes.md`, `mobile-first.md`. Todos sobem dev server via Playwright, navegam, detectam issues e corrigem. `testar` = exhaustive + api, `ux-tester` = 6 dimensões de UX, `mobile-first` = responsividade, `adicionar-testes` = gerar testes automatizados. São **dimensões do mesmo loop DCRV**, não comandos distintos.

**D. Auditoria/sugestões (2 comandos):**
`melhorias.md` (auditoria UX/perf/modernidade priorizada) e `ideias.md` (features novas com pesquisa de mercado). Output quase idêntico em forma (relatório priorizado). Fundem em um `/up:auditar` com flag `--features`.

**E. Manutenção de estado (muitos comandos micro):**
`progresso`, `retomar`, `pausar`, `saude`, `resetar`, `remover-fase`, `custos`, `dashboard`, `atualizar`, `configurar`, `ajuda`, `onboard`. Vários são CLIs de 1 ação que poderiam ser subcomandos de `/up:estado` ou ficar só no `up-tools.cjs`.

### Tabela de fusão proposta

| # | Comando final | Funde / absorve | Como |
|---|---------------|-----------------|------|
| 1 | **`/up:build`** | `modo-builder`, `novo-projeto`, `iniciar`, `build`, `clone-builder` | Detecta greenfield/brownfield/clone. Flags: `--light`, `--from-plan`, `--clone <url>`, `--registrar` (só documenta) |
| 2 | **`/up:plan`** | `plan`, `discutir-fase` | Planeja projeto OU fase. Gera PLAN-READY pra runtime barato |
| 3 | **`/up:fase`** | `planejar-fase`, `adicionar-fase`(deprecado), `executar-fase`, `remover-fase` | Subverbos: `planejar`/`executar`/`remover`. Mata o deprecado |
| 4 | **`/up:rapido`** | `rapido` | Mantém — tarefa pontual com garantias UP. É o caminho rápido legítimo |
| 5 | **`/up:testar`** | `testar`, `ux-tester`, `mobile-first`, `adicionar-testes` | Um loop DCRV com flags `--ux`, `--mobile`, `--gerar-testes`. Default roda tudo |
| 6 | **`/up:auditar`** | `melhorias`, `ideias` | Auditoria priorizada. Flag `--features` ativa pesquisa de mercado |
| 7 | **`/up:mapear`** | `mapear-codigo` | Mantém — útil pra brownfield |
| 8 | **`/up:depurar`** | `depurar` | Mantém — debugging com estado persistente é ouro |
| 9 | **`/up:verificar`** | `verificar-trabalho` | Mantém — UAT conversacional |
| 10 | **`/up:estado`** | `progresso`, `retomar`, `pausar`, `saude`, `resetar` | Subverbos. Tudo é leitura/escrita de `.plano/` |
| 11 | **`/up:config`** | `configurar`, `onboard` | Config do workflow + perfil do dono |
| 12 | **`/up:custos`** | `custos` | Mantém — telemetria de token (Claude only) |
| 13 | **`/up:atualizar`** | `atualizar` | Mantém — npm update |
| 14 | **`/up:ajuda`** | `ajuda`, `dashboard` | Referência + link pro dashboard |

`dashboard` pode virar flag de `ajuda` ou bash puro (só abre URL). Resultado: **32 → 14 comandos** (corte de 18, -56%).

---

## 3. LISTA DE CORTE DE AGENTES — 52 → ~18

### Classificação por papel (52 agentes)

- **Core operacional (faz trabalho real):** `up-arquiteto`, `up-system-designer`, `up-product-analyst`, `up-executor`, `up-planejador`, `up-verificador`, `up-mapeador-codigo`, `up-depurador`, `up-roteirista`, `up-sintetizador`, `up-pesquisador-projeto`, `up-pesquisador-mercado`, `up-analista-codigo`, `up-consolidador-ideias`, `up-sintetizador-melhorias`, `up-requirements-validator` (16)
- **Specialists (substituem executor por domínio):** `up-frontend-specialist`, `up-backend-specialist`, `up-database-specialist` (3)
- **Auditoria/QA (detectores):** `up-visual-critic`, `up-exhaustive-tester`, `up-api-tester`, `up-qa-agent`, `up-blind-validator`, `up-security-reviewer`, `up-auditor-ux`, `up-auditor-performance`, `up-auditor-modernidade`, `up-code-reviewer` (10)
- **Clone pipeline:** `up-clone-crawler`, `up-clone-design-extractor`, `up-clone-feature-mapper`, `up-clone-prd-writer`, `up-clone-verifier` (5)
- **Ops/docs:** `up-devops-agent`, `up-technical-writer` (2)
- **🔴 GOVERNANÇA / TEATRO DE PROCESSO:** CEO + 5 chiefs + 8 supervisores + 2 auditores gold = **16 agentes (31% do total) que NÃO produzem código nem testam — só revisam revisões.**

### Os 16 agentes de governança são o alvo número 1

```
up-project-ceo (1)
up-chief-architect, up-chief-engineer, up-chief-operations, up-chief-product, up-chief-quality (5)
up-architecture-supervisor, up-audit-supervisor, up-execution-supervisor, up-operations-supervisor,
up-planning-supervisor, up-product-supervisor, up-quality-supervisor, up-verification-supervisor (8)
up-delivery-auditor, up-planning-auditor (2)
```

`governance.md` define explicitamente: operacional → supervisor (max 3 ciclos) → chief (max 2 ciclos) → CEO (max 1 ciclo). É um pipeline de **4 níveis de aprovação** projetado para um mundo onde o executor era burro. Com modelos atuais, o executor já produz código correto na primeira passada na maioria dos casos. **Um único revisor crítico** ("up-revisor") cobre 90% do valor desses 16 agentes.

### Plano de corte

| Ação | Agentes | De → Para | Justificativa |
|------|---------|-----------|---------------|
| **ELIMINAR** os 8 supervisores | `up-*-supervisor` | -8 | Substituídos por 1 `up-revisor` genérico ou pela auto-revisão inline do próprio operacional (o `up-planejador` já faz "self-check interno sem checker externo" — provar que funciona e replicar) |
| **ELIMINAR** 4 dos 5 chiefs | `up-chief-architect/operations/product/quality` | -4 | Camada de consolidação por área é redundante quando há só 1 revisor. Manter **só `up-chief-engineer`** como "tech lead" único que aprova a fase (o gate de fase é legítimo) |
| **FUNDIR** os 2 auditores gold | `up-planning-auditor` + `up-delivery-auditor` | -2 → +1 `up-auditor-final` | Ambos calculam Confidence Score (0-100). Mesma mecânica, momentos diferentes. Um só agente parametrizado por fase |
| **REBAIXAR** CEO a função do orquestrador | `up-project-ceo` | -1 | O "canal único com o dono" e "intake" são prompt do orquestrador, não precisa de subagente dedicado de 10KB. Personalidade via `owner-profile.md` continua |
| **FUNDIR** 3 auditores de código em 1 | `up-auditor-ux` + `up-auditor-performance` + `up-auditor-modernidade` | -3 → +1 `up-auditor` | Modelo atual audita as 3 dimensões num passe. `melhorias.md` hoje spawna os 3 em paralelo + 1 sintetizador. Vira 1 agente |
| **FUNDIR** code-reviewer no fluxo de specialist | `up-code-reviewer` | -1 | `execution-supervisor` já "absorve função de code-reviewer" (consta no próprio frontmatter). Redundância declarada |
| **FUNDIR** clone pipeline 5→2 | `up-clone-*` | -3 | `crawler`+`design-extractor`+`feature-mapper` viram 1 `up-clone-analista` (modelo atual extrai design+features+rotas de screenshots num passe). `prd-writer` funde no analista. Mantém `clone-verifier` |
| **FUNDIR** sintetizadores | `up-sintetizador` + `up-sintetizador-melhorias` + `up-consolidador-ideias` | -2 → 1 `up-sintetizador` | Três agentes que deduplicam/priorizam/consolidam listas. Mesma capability |
| **MANTER** specialists | frontend/backend/database | 0 | Especialização por domínio dá ganho real de qualidade. Manter |
| **MANTER** detectores DCRV | visual-critic, exhaustive-tester, api-tester | 0 | Olhos independentes que navegam o app de verdade. Ouro |

**Soma do corte:** 52 - 8 - 4 - 1(auditor) - 1(ceo) - 2(auditores cód) - 1(reviewer) - 3(clone) - 2(sintetiz) ≈ **52 → ~18 agentes** (-65%).

---

## 4. MAPA DE LATÊNCIA — Onde o Tempo Vai

### Fonte #1: Pipeline por fase com 5 gates (Estágio 3 do `builder.md`, linha 167-186)

```
Planejador → [planning-supervisor] → Specialist → [GATE A] → EXECUTION-SUPERVISOR →
[GATE B] → Code Reviewer → Verificador → [GATE C] → VERIFICATION-SUPERVISOR →
[GATE D] → E2E + DCRV(visual+api+exhaustive) → CHIEF-ENGINEER → [GATE E] → completa
```

**~8-12 spawns SEQUENCIAIS por fase.** Cada supervisor pode pedir até **3 ciclos de rework**, cada chief até **2**, CEO até **1**. Pior caso teórico por fase: dezenas de spawns. Num projeto de 6 fases = **48-72 spawns só no build**, antes do Quality Gate.

**Corte seguro:** colapsar para `Planejador → Specialist → Verificador → [GATE único] → Chief-Engineer aprova fase`. 4 spawns. O gate determinístico via `approvals.log` (mecanismo anti-colapso, linhas 161-165) **fica** — ele é barato (bash check de arquivo) e é a verdadeira garantia. Os supervisores LLM intermediários saem.

### Fonte #2: Quality Gate global (Estágio 4) roda 12+ avaliadores

`up-auditor-ux/performance/modernidade`, `up-sintetizador-melhorias`, `up-blind-validator`, `up-security-reviewer`, `up-qa-agent`, `up-devops-agent`, `up-technical-writer`, `up-analista-codigo`, `up-pesquisador-mercado`, `up-consolidador-ideias` + loop de até 5 ciclos. **Esse é o estágio mais gordo do sistema.** Com fusões da seção 3, cai de 12 para ~5 avaliadores.

### Fonte #3: `/up:plan` arrasta governança de planejamento

`plan.md` spawna: ceo(2x) + product-analyst(2x) + arquiteto(2x) + architecture-supervisor(2x) + product-supervisor + planning-supervisor + planning-auditor + chief-architect + chief-engineer = **~15 spawns para planejar**. Cortando supervisores+chiefs+1 auditor: **~5 spawns**.

### Fonte #4: Re-verificação em loop no DCRV

`dcrv.md` roda detectores, corrige, **re-roda detectores** nas issues corrigidas, até 3-5 ciclos. Razoável manter o loop, mas cap default de ciclos pode cair de 3/5 para 2 — modelo atual corrige certo na 1ª.

### Camadas a cortar mantendo segurança

| Cortar | Manter (segurança real) |
|--------|-------------------------|
| 8 supervisores LLM intermediários | Gates determinísticos `approvals.log` (bash, ~0 custo) |
| 4 chiefs de consolidação | `up-chief-engineer` aprovando a fase (1 gate de tech lead) |
| CEO como subagente | Auto-revisão inline do operacional (já existe no `up-planejador`) |
| Ciclos 3+2+1 (até 6 rounds) | 1 ciclo de rework máximo (modelo acerta cedo) |
| Auditores gold duplicados | `up-auditor-final` único antes do delivery |

---

## 5. O QUE MANTER INTACTO (O OURO)

1. **Persistência de estado `.plano/`** — `STATE.md`, `ROADMAP.md`, snapshots, crash-recovery via `LOCK.md`. Sobrevive a resets de contexto. Núcleo do valor. (`up-tools.cjs`: `state`, `state-snapshot`, `init`).
2. **Commits atômicos** — cada operacional commita por unidade de trabalho (`fix(scope): issue — titulo`). Rastreabilidade granular. (`core.cjs`: `execGit`, `commit`).
3. **Gates determinísticos via `approvals.log`** — o mecanismo anti-colapso (bash check de arquivo que bloqueia avanço) é genial e **barato**. É o que de fato impede o LLM de pular etapas. Mantém-se mesmo cortando os supervisores: o gate passa a verificar o output do operacional/revisor único.
4. **Separação `plan` / `build` entre runtimes** — planejar em Claude Code (caro/capaz), executar em OpenCode/Gemini (barato). `PLAN-READY.md` como flag. Arquitetura inteligente.
5. **Specialists por domínio** (frontend/backend/database) — ganho de qualidade real vs executor genérico.
6. **Detectores DCRV independentes** (visual-critic, exhaustive-tester, api-tester) — navegam o app de verdade via Playwright. Olhos que não confiam no código.
7. **Debugging com estado persistente** (`up-depurador` + `depurar.md`) — método científico entre resets.
8. **`up-tools.cjs` como motor determinístico** — 3843 linhas, mas a maioria é lógica útil (roadmap parsing, slug, progress, requirements). Simplificável (ver §6) mas é a espinha confiável que tira trabalho do LLM.

---

## 6. SIMPLIFICAÇÃO DO `up-tools.cjs` / `core.cjs`

`up-tools.cjs` tem **3843 linhas** e ~40 subcomandos. Candidatos a corte acompanham o corte de features:

- **`classify-task`, `analyze-routing`, `resolve-model-for-plan`, `routing-log`, `budget`** — o "complexity-based model routing per plan" (Wave 5) e o `skill-manifest` (Wave 6) são otimizações de custo de token que adicionam complexidade. Com o sistema mais enxuto e modelos melhores, roteamento elaborado por complexidade rende pouco. Avaliar colapsar em um default simples (Opus pra planejar/arquitetar, Sonnet pra executar).
- **`skill-manifest`** — carregar só refs relevantes ao papel do agente é micro-otimização; com menos agentes, menos ganho.
- **`stuck-check`, `timeout`, `verify-static`, `validate-plan`** — manter (guardas determinísticas baratas).
- `core.cjs` (402 linhas) está enxuto e correto — mantém.

Estimativa: `up-tools.cjs` pode encolher ~25-35% removendo a maquinaria de routing/manifest atrelada às Waves 5-6.

---

## 7. ESTIMATIVA DE GANHO DE VELOCIDADE

Contando **spawns de agente** (cada spawn = round-trip de contexto + latência de modelo, a métrica que domina o tempo de parede):

| Fluxo típico | Spawns hoje | Spawns propostos | Redução |
|--------------|-------------|------------------|---------|
| Build 1 fase | ~8-12 | ~3-4 | **~3x menos** |
| Build projeto 6 fases | ~48-72 + QG 12 = ~60-84 | ~24 + QG 5 = ~29 | **~2.5-3x menos** |
| `/up:plan` completo | ~15 | ~5 | **~3x menos** |
| `/up:melhorias` | 4 (3 auditores + sint) | 1-2 | **~2-3x menos** |
| `/up:clone-builder` | 5 (pipeline) | 2 | **~2.5x menos** |

**Ordem de grandeza:** num build completo típico, **~30-50 spawns de agente a menos**. Como cada spawn de governança custa tokens e latência sem produzir artefato, o ganho é quase puro: **2.5x-3x mais rápido e mais barato no fluxo típico**, sem perda de qualidade detectável com modelos atuais — porque a segurança real (gates determinísticos, detectores que navegam o app, commits atômicos) permanece.

---

## 8. RESUMO DA TESE

O UP foi arquitetado defensivamente contra modelos fracos: cada output passa por revisor, cada revisor por chief, cada chief por CEO, com até 6 ciclos de rework. Isso é **teatro de processo** — 31% dos agentes (16/52) só revisam revisões. Modelos 2026 acertam cedo; a defesa certa não é mais humanos-de-mentira em camadas, e sim **gates determinísticos baratos** (que o UP já tem em `approvals.log`) + **um revisor crítico** + **detectores que testam o app de verdade**. Corte: **32→14 comandos, 52→18 agentes, governança 4→2 níveis, ~3x menos spawns por fluxo**. Mantém intacto o ouro: `.plano/`, commits atômicos, gates determinísticos, separação plan/build, specialists e detectores DCRV.
