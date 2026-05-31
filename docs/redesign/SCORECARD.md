# BOARD SCORE — UP hoje vs superpowers vs UP v2 proposto

> Scorecard de redesign do UP. Três colunas, 12 dimensões, nota 0-10 por célula com justificativa.
> Fontes: os 5 dossiês em `redesign/pesquisa/`. Premissa do dono: muito mais poderoso QUE HOJE e muito mais rápido/simples, sem perder a essência (`.plano/` + persistência são inegociáveis).

---

## Tabela do scorecard

| # | Dimensão | UP hoje | superpowers | UP v2 proposto | Justificativa por coluna (UP hoje / superpowers / UP v2) |
|---|----------|:------:|:-----------:|:--------------:|----------|
| 1 | **Velocidade / latência** | 3 | 9 | 8 | UP hoje: 48-84 spawns sequenciais num build de 6 fases (4 níveis de governança, até 6 ciclos de rework) = lento e caro. / superpowers: markdown + 1 hook, zero orquestrador, subagente fresco só quando precisa = enxuto. / UP v2: corta governança 4→2 níveis, ~3x menos spawns; perde 1 ponto porque ainda carrega `.plano/` I/O e sync com Multica. |
| 2 | **Simplicidade de uso (qtd comandos, curva)** | 3 | 9 | 8 | UP hoje: 32 comandos com sobreposição flagrante (5 entradas de projeto, 4 de teste), curva alta. / superpowers: zero comandos a decorar — tudo ativa por contexto via 14 skills. / UP v2: 32→14 comandos + porta única brainstorm-first; perde 1 ponto porque mantém comandos explícitos (útil pro fluxo `.plano/`) em vez de 100% implícito. |
| 3 | **Persistência de estado / sobrevive a /clear** | 9 | 4 | 10 | UP hoje: `.plano/` completo (STATE/ROADMAP/snapshot/LOCK), `state-snapshot` + `save-session`, crash-recovery — ouro real. / superpowers: spec/plan em `docs/` git e re-injeta bootstrap no clear/compact, mas não tem memória estruturada de "onde estou" entre sessões. / UP v2: mantém `.plano/` intacto e SOMA git-map.json (fase→issue/PR) + bootstrap injetado no clear. |
| 4 | **Disciplina de engenharia (brainstorm-first)** | 4 | 10 | 9 | UP hoje: tem `discutir-fase`/`onboard` mas brainstorm é opcional e enterrado num comando; não há HARD-GATE antes de codar. / superpowers: HARD-GATE explícito — nenhuma ação de implementação antes de design apresentado e aprovado, em TODO projeto. / UP v2: rouba o brainstorming como porta de entrada com gate, perde 1 ponto só por ser fork novo (regras ainda não endurecidas sob pressão como as Iron Laws maduras). |
| 5 | **Qualidade de código / TDD** | 5 | 10 | 9 | UP hoje: tem detectores DCRV e `adicionar-testes`, mas TDD não é lei — testes vêm depois, sem red-green obrigatório. / superpowers: Iron Law "NO PRODUCTION CODE WITHOUT A FAILING TEST", verify-RED mandatório, rationalization tables — TDD de verdade. / UP v2: importa o Iron Law + verify-RED e two-stage review; perde 1 ponto até as tabelas de racionalização estarem batidas em teste. |
| 6 | **Integração GitHub-nativa (worktree/issue/PR/merge)** | 1 | 9 | 9 | UP hoje: zero — sem branch, sem worktree, sem push, sem `gh`, sem PR; commita trunk-based na main local. / superpowers: worktree→baseline limpa→menu fechado de 4 opções→`gh pr create`→cleanup provenance-based, tudo CLI. / UP v2: adota o fluxo worktree→issue→PR→merge por fase com fail-open local; empata por desenho equivalente + Closes #N auto-fecha issue. |
| 7 | **Visualização / feedback visual (board, ver agentes)** | 2 | 3 | 10 | UP hoje: só `up:dashboard` local (4040) pouco usado, sem board de issues. / superpowers: tem visual companion (browser pra mockups/wireframes) mas nenhum board de execução nem "ver agente trabalhando". / UP v2: integra Multica — `task:message`/`task:progress` ao vivo no board, agent status working/blocked, cada tool_use visível; supera os dois. |
| 8 | **Brownfield / código legado** | 8 | 6 | 9 | UP hoje: `mapear-codigo` com mapeadores paralelos + `.plano/codebase/` (ARCHITECTURE/STACK/CONVENTIONS) — forte. / superpowers: brainstorming explora contexto e systematic-debugging traça root cause, mas sem mapeamento estruturado persistido do legado. / UP v2: mantém o mapeamento brownfield e ganha systematic-debugging por root-cause acoplado. |
| 9 | **Auditoria & evolução de produto (melhorias/ideias)** | 8 | 4 | 9 | UP hoje: `melhorias` (UX/perf/modernidade priorizado) + `ideias` (features com pesquisa de mercado) — diferencial claro. / superpowers: não tem trilha de evolução de produto; foco é executar a feature pedida, não auditar o produto. / UP v2: funde em `/up:auditar --features`, mantém pesquisa de mercado e ganha YAGNI ruthless do superpowers. |
| 10 | **Governança / verificação (sem over-engineering)** | 5 | 9 | 9 | UP hoje: governança pesada de 16 agentes-fantasma (31% do total) que só revisam revisões — teatro de processo, over-engineering puro. / superpowers: verification-before-completion (evidência antes de afirmar) + spec-then-quality review cético, sem camadas inúteis. / UP v2: mantém gates determinísticos `approvals.log` (baratos) + 1 revisor crítico + verify-before-completion; corta o teatro. |
| 11 | **Composabilidade (skills ativam por contexto vs comando)** | 2 | 10 | 8 | UP hoje: tudo é comando explícito `/up:*`; nada ativa por contexto, agente não "puxa" disciplina sozinho. / superpowers: hook SessionStart + regra "1% de chance→invoca skill" + descriptions-como-gatilho (CSO) = ativação automática, pipeline por cross-reference sem orquestrador. / UP v2: adota hook + skill-bootstrap + CSO; perde 2 pontos por manter comandos `.plano/` explícitos coexistindo com ativação automática (híbrido, não 100% pull). |
| 12 | **Distribuição / adoção** | 6 | 9 | 8 | UP hoje: `up-cc` no npm, instala em Claude/Gemini/OpenCode — ok, mas em PT-BR (nicho) e config pesada. / superpowers: marketplace multi-harness (Claude/Codex/Gemini/OpenCode/Cursor/Copilot/Factory), MIT, instalação trivial. / UP v2: mantém npm multi-harness + integração Multica como diferencial; perde 1 ponto por escopo PT-BR/EcoUp e dependência opcional de Multica. |
| | **TOTAL** | **56** | **92** | **106** | |

---

## Veredito (~10 linhas)

UP v2 **soma 106 contra 92 do superpowers e 56 do UP hoje** — e a leitura honesta por trás do número importa mais que o número. UP v2 **supera** superpowers em quatro frentes onde o superpowers simplesmente não joga: persistência de estado estruturada que sobrevive a `/clear` (10 vs 4 — `.plano/` + git-map.json + snapshot são memória de verdade, não só specs em git), visualização ao vivo via Multica (10 vs 3 — ver cada tool_use do agente no board é algo que superpowers não tem), auditoria/evolução de produto (9 vs 4 — `melhorias`/`ideias` com pesquisa de mercado), e brownfield (9 vs 6 — mapeamento de legado persistido). Fica **em par** em GitHub-nativo (9=9, mesmo desenho worktree→issue→PR→merge), governança/verificação (9=9), e qualidade/TDD muito perto (9 vs 10). Os **dois únicos lugares onde superpowers ainda ganha, com honestidade**: (1) **composabilidade pura** (10 vs 8) — a ativação 100% por contexto, sem nenhum comando a decorar, é mais elegante que o híbrido comando+skill que o UP v2 mantém por causa do `.plano/`; e (2) **disciplina/TDD batida em teste** (10 vs 9 cada) — as Iron Laws e rationalization tables do superpowers foram endurecidas com baselines de subagente sob pressão, e o UP v2 só alcança esse rigor depois de rodar os mesmos testes adversariais. O resto da liderança do UP v2 vem de manter a essência (estado + board + produto) que o superpowers nunca teve.

---

## O que UP v2 ROUBA de superpowers

1. **Hook SessionStart que injeta uma skill-bootstrap inteira** (`<EXTREMELY_IMPORTANT>`), disparando em startup/clear/compact — é o coração da auto-ativação, não depende de comando `/`.
2. **`description` = SÓ gatilhos ("Use when..."), nunca o workflow** (CSO). Empiricamente, resumir o workflow faz o agente pular o corpo da skill.
3. **Brainstorming como porta de entrada com HARD-GATE** — nenhuma implementação antes de design apresentado e aprovado, em TODO projeto; uma pergunta por vez, 2-3 abordagens com trade-offs, spec commitado.
4. **TDD de verdade** — Iron Law "NO PRODUCTION CODE WITHOUT A FAILING TEST", verify-RED mandatório (ver o teste falhar), GREEN mínimo, rationalization tables + red flags que matam atalhos.
5. **systematic-debugging** — root cause antes de fix, instrumentação nas fronteiras, uma hipótese por vez, "3+ fixes falharam → questione a arquitetura".
6. **verification-before-completion** — nenhuma afirmação de sucesso sem rodar o comando NESTA mensagem; checar VCS diff até de relatório de subagente.
7. **subagent-driven com two-stage review** — spec-compliance ANTES de code-quality, reviewer cético ("finished suspiciously quickly"), controller passa texto completo (subagente não lê arquivos), roteamento de modelo por complexidade.
8. **Fluxo git nativo** — worktree → baseline limpa → menu fechado de 4 opções → `gh pr create` → cleanup provenance-based, convivendo com o harness sem brigar.
9. **Planos bite-sized (2-5 min), file paths exatos, código completo, zero placeholders, red-green-commit por task.**
10. **Token discipline** — <150-200 palavras pro que carrega sempre; detalhe em arquivos sob demanda; cross-reference por nome, nunca `@arquivo`.
11. **Cultura anti-bajulação** (receiving-code-review) — proibido "You're absolutely right!"/"Thanks"; ações > palavras; "letter = spirit" pra fechar racionalizações.

## O que UP v2 MANTÉM que superpowers NÃO tem

1. **Persistência de estado `.plano/`** — STATE.md, ROADMAP.md, snapshots, crash-recovery via LOCK.md; `state-snapshot` + `save-session` reconstroem contexto após `/clear`. superpowers re-injeta bootstrap, mas não tem memória estruturada de "onde estou".
2. **Integração visual com Multica** — board ao vivo (`task:message`/`task:progress`), agent status, cada tool_use visível, issue→PR auto-link por KEY, skill `/tarefa` como despachante. superpowers tem visual companion pra mockups, mas nenhum board de execução.
3. **Auditoria & evolução de produto** — `melhorias` (UX/perf/modernidade priorizado) + `ideias` (features novas com pesquisa de mercado). superpowers executa a feature pedida, não audita o produto.
4. **Mapeamento brownfield persistido** — `mapear-codigo` + `.plano/codebase/` (ARCHITECTURE/STACK/STRUCTURE/CONVENTIONS) para código legado.
5. **Separação plan/build entre runtimes** — planejar em Claude Code (capaz/caro), executar em OpenCode/Gemini (barato) via `PLAN-READY.md`.
6. **Gates determinísticos via `approvals.log`** — bash check de arquivo que bloqueia avanço, anti-colapso, custo ~0; sobrevive ao corte da governança.
7. **`up-tools.cjs` como motor determinístico** — roadmap parsing, slug, progress, requirements, commits atômicos; tira trabalho do LLM de forma confiável.
8. **Idioma PT-BR + perfil do dono (`owner-profile.md`)** — comunicação adaptada ao Jonathan/EcoUp, persona CEO no canal único.

---

Arquivo: `/home/projects/up-cc/redesign/SCORECARD.md`
