# CRITIQUE — Crítica adversarial do redesign UP v2

> Voz: o próprio Jonathan, cético, pragmático, builder solitário. Quero VELOCIDADE e SIMPLICIDADE. Odeio cerimônia.
> Base: SCORECARD.md, BLUEPRINT.md, ROADMAP-IMPL.md + dossiês 01-05. Claims verificados contra o código real (`up/` tem 52 agentes, 32 comandos, 29 workflows, `up-tools.cjs` 3843 linhas; `multica` e `gh` instalados na VPS).

---

## VEREDITO EM UMA LINHA

O blueprint corta MUITO over-engineering interno (governança, agentes) — isso é real e corajoso. Mas **reinjeta cerimônia nova no caminho quente** (GitHub-native + Multica + brainstorm-gate em TODA tarefa) sem um botão de escape calibrado. Trocou over-engineering de *supervisão* por over-engineering de *infraestrutura de entrega*. O ganho líquido de velocidade só existe pra projetos grandes; pra 70% do que eu faço no dia a dia (fix pontual, ajuste de config, mexer no vault) o v2 fica MAIS pesado que o v1.

---

## 1. O blueprint deixa o UP mais rápido e simples, ou trocou um over-engineering por outro?

**Veredito: meio a meio. Corta gordura interna real, mas adiciona cerimônia de I/O externo no caminho de toda execução.**

### O que está genuinamente mais simples (mérito real)
- Governança 4→2 níveis e 52→18 agentes é o corte certo. O dossiê 04 provou: 16 agentes (31%) só revisam revisões. Isso é teatro de modelo-burro-de-2024. Matar é correto e corajoso.
- Cap de rework de 3+2+1 (até 6 rounds) → 1 round. Verifiquei no `governance.md`: hoje são literalmente "max 3 / max 2 / max 1 ciclo" encadeados. Cortar é puro ganho.
- Tirar a maquinaria de routing das Waves 5-6 do `up-tools.cjs` (`classify-task`, `analyze-routing`, `resolve-model-for-plan`, `skill-manifest`): micro-otimização que rende pouco. Bom corte.

### Complexidade NOVA injustificada (o problema)
**1a. GitHub-native como default vira imposto fixo por fase.** Cada fase paga: `gh issue create` + `multica issue create` + `metadata set` (x2) + `git fetch` + `git worktree add` + `cd worktree` + ... + `git push` + `gh pr create` + `gh pr merge --squash --delete-branch` + `git worktree remove` + `git worktree prune` + `git fetch` + `git pull --ff-only` + `phase complete`. Isso são ~15 chamadas de subprocesso e várias idas à rede (GitHub API) ANTES e DEPOIS do trabalho real. Para um build de 6 fases, são ~90 operações de cerimônia git/GitHub. O dossiê 04 mediu o ganho em *spawns de agente* (a métrica certa pro v1), mas o v2 reintroduz latência por outro vetor: **round-trips de rede e subprocesso**. O scorecard não contabiliza isso em lugar nenhum.

**1b. Multica espelhado em TODA transição de estado.** Seção 6.3: "a cada transição, roda o `multica issue status`/`metadata set` correspondente". Multica é Go + Postgres + WebSocket numa VPS. Cada `multica issue status` é um processo Go subindo, abrindo conexão, autenticando via PAT, batendo no backend. Multiplicado por (issue-pai + issue-fase + N issues-onda + transições de status) = dezenas de invocações de CLI externa por build. Para um builder autônomo de 6 fases isso é facilmente 50-100 chamadas `multica`. Cada uma é ~centenas de ms. Isso não aparece no scorecard.

**1c. Brainstorm com aprovação seção-a-seção via AskUserQuestion.** Seção 3.2 item 6: "aprovação após CADA seção". Cobre arquitetura, componentes, fluxo de dados, erros, testes = 5 paradas humanas. Para um projeto de verdade, ótimo. Para "muda o título do botão" isso é insuportável.

### Correção concreta
- **Contabilizar custo de I/O no scorecard.** A dimensão "Velocidade" só conta spawns de agente. Adicionar uma linha mental: "ops de subprocesso/rede por fluxo". Com isso a nota 8 de velocidade do v2 cai pra ~6-7 honesto, porque GitHub+Multica adicionam latência de rede que o v1 não tinha.
- **GitHub-native e Multica-sync devem ser LAZY, não EAGER.** Criar issue/PR/worktree só quando o trabalho passa um limiar (ex.: fase com ≥2 planos OU duração estimada >30min). Tarefa curta = commit local direto (comportamento v1), e SE virar PR, batch a criação de issue/PR no fim, não no começo. Espelhar no Multica de forma assíncrona/batched (um sync no fim da onda), não síncrono a cada microtransição.

---

## 2. A consolidação de comandos foi longe o suficiente? Sobra redundância?

**Veredito: o número (9) é bonito mas FALSO. Os comandos viraram dumping grounds de flags, e o blueprint contradiz o próprio roadmap.**

### Problema A — Contradição interna não resolvida
BLUEPRINT seção 2 diz **9 comandos**. ROADMAP-IMPL Fase 2 diz **~14 comandos** ("`up/commands/` tem ~14 arquivos"). Dossiê 04 diz **14**. São documentos do mesmo redesign discordando do alvo. Isso não é detalhe: 9 vs 14 é a diferença entre "agressivo de verdade" e "moderado". Alguém vai implementar e não sabe a meta. **Decidir: é 9 ou 14? Eu (Jonathan) quero 9.** Mas então o roadmap está errado e precisa ser reescrito pra 9, senão a Fase 2 entrega 14 e ninguém percebe que falhou a meta do blueprint.

### Problema B — Consolidação por flag é redundância disfarçada
`/up:estado` (item 8) absorve: progresso, retomar, pausar, saude, resetar, mapear, custos, dashboard, sync. São **9 subverbos** num comando. `/up:testar` absorve testar/ux/mobile/gerar-testes/e2e (5 flags). Isso não eliminou complexidade — moveu pra dentro. Um `/up:estado` com 9 subverbos é mais difícil de decorar que 4 comandos óbvios. "Consolidei 32→9" soa bem mas se cada comando tem 5-9 subverbos, a superfície cognitiva real é ~50 entradas. O superpowers resolveu isso de verdade: ZERO comandos, tudo por contexto. O v2 ficou no meio do caminho e chama isso de vitória.

### Problema C — Dá pra cortar MAIS
- **`/up:fase` (item 4) é dispensável.** "remover/renumerar fase" são operações estruturais raras. Isso é mexer no ROADMAP.md — pode ser subverbo de `/up:estado` (que já é o comando "tudo de `.plano/`"). Some `/up:fase`, vira `/up:estado fase remover`. **9→8.**
- **`/up:config` (item 9) pode morrer.** Config + perfil do dono + atualizar + ajuda. Config raramente muda; `atualizar` é `npm`; `ajuda` pode ser `/up` sem contexto. Isso são coisas de instalação/manutenção, não de fluxo. Mover pra subverbos de `/up`. **8→7.**
- Alvo honesto e agressivo: **6 comandos** — `/up` (entrada+continua), `/up:plan`, `/up:build`, `/up:testar`, `/up:depurar`, `/up:auditar`. Estado/config/fase/sync viram subverbos de `/up`. Esse é o número "Jonathan odeia decorar".

### Correção concreta
- Padronizar TODOS os docs em **9 comandos** no mínimo, e mirar **6** se for sério sobre simplicidade.
- Regra dura: **nenhum comando com mais de 3 subverbos**. Se passou, ou são comandos separados ou são detecção automática por contexto (o que `/up` sem argumento já faz). `/up:estado` com 9 subverbos viola isso flagrantemente.

---

## 3. O corte de agentes foi corajoso ou tímido? Quem mais devia morrer?

**Veredito: corajoso na governança (matou os 16 certos), tímido nos specialists e detectores. 18 ainda é gordo.**

### Onde foi corajoso (correto)
Matar CEO + 5 chiefs + 8 supervisores + 2 auditores gold (16 agentes). Verifiquei que `governance.md` realmente encadeia 4 níveis. Esse corte é o coração e está certo.

### Onde foi tímido — agentes que ainda deviam morrer
- **Os 3 specialists (frontend/backend/database).** O argumento "especialização por domínio dá ganho real" era verdade com Sonnet-2024. Com Opus 4.x, um `up-executor` único com a skill certa carregada por contexto faz frontend, backend E database. Manter 3 agentes separados é a MESMA falácia da governança: assume que o modelo precisa de um "especialista" pré-carregado. **Fundir em `up-executor` (com refs de domínio carregadas sob demanda) = -3.** Isso é exatamente o que o superpowers faz: um executor, skills puxadas por contexto.
- **3 detectores DCRV (visual-critic, exhaustive-tester, api-tester).** São bons (navegam o app de verdade). Mas 3 agentes separados pra "rodar o app e achar problema" é granularidade de 2024. Um `up-tester` que faz os 3 passes (visual + exhaustive + api) num spawn, via Playwright, é viável com modelo atual. **3→1 = -2.** Mantém o ouro (rodar o app), corta os spawns.
- **`up-clone-analista` + `up-clone-verifier` (2).** Clone é um caso de uso de nicho (`/up:clone-builder`). 2 agentes dedicados pra isso num sistema que quer ser enxuto é luxo. O clone pode ser um *modo* do executor + verificador genéricos, não 2 agentes próprios. **-2.**
- **`up-system-designer` vs `up-arquiteto`.** Dois agentes de arquitetura/design. Com brainstorm-first fazendo o design upfront, isso é redundância. Fundir. **-1.**

### Número honesto
18 → ~10 é o corte corajoso de verdade: `up-arquiteto`(+system-designer), `up-planejador`, `up-executor`(+3 specialists), `up-verificador`, `up-revisor`, `up-tester`(+3 DCRV), `up-mapeador`, `up-depurador`, `up-pesquisador`, `up-auditor`. Clone vira modo, não agente.

### Correção concreta
- Aplicar a MESMA tese que matou a governança aos specialists e detectores: "modelo 2026 não precisa de um agente pré-especializado, precisa da skill certa carregada por contexto". Specialists 3→0 (skills de domínio), DCRV 3→1 (um tester multi-pass), clone 2→0 (modo). **Alvo: 18→~10.**
- Se 10 assusta, fazer em 2 ondas: v2.0 entrega 18, v2.1 funde specialists/DCRV depois de medir que não perdeu qualidade. Mas declarar o alvo de 10 agora.

---

## 4. GitHub-nativo por padrão tem custo escondido? Precisa de modo "rápido sem cerimônia"?

**Veredito: SIM, custo escondido grande. E SIM, precisa de modo rápido — e o blueprint NÃO tem um de verdade. Pior: o v2 é MAIS cerimonioso que o próprio superpowers de quem copiou.**

### O custo escondido (real)
Verifiquei no dossiê 01: o superpowers NÃO cria PR por padrão. O `finishing-a-development-branch` apresenta um **menu fechado de 4 opções** ("1. Merge local / 2. Push e PR / 3. Mantém branch / 4. Descarta") e o humano ESCOLHE. PR é opção 2, não default. **O blueprint v2 tornou worktree→issue→PR→merge o DEFAULT por fase** (seção 5.1) — isso é mais cerimônia que a fonte. Copiou o mecanismo e perdeu a calibragem.

Custos concretos do default GitHub-native:
- **Latência de rede** em `gh issue create`, `gh pr create`, `gh pr merge`, `multica issue create` — cada um é round-trip à API. Numa fase rápida, a cerimônia de rede pode durar mais que o trabalho.
- **Worktree por fase** = `git worktree add` (checkout completo do tree) + setup de ambiente (npm install na worktree nova, conforme superpowers Step 3). Para um repo com node_modules pesado, criar worktree é DEZENAS de segundos só de I/O de disco + install. Por fase.
- **Poluição de histórico GitHub** com issues/PRs pra trabalho solo. Eu sou builder solitário. Um PR que eu mesmo abro e mergeio em 30 segundos sem ninguém revisar é puro teatro de processo — exatamente o que esse redesign diz que está MATANDO na governança. GitHub-native por fase reintroduz teatro, só que em git em vez de em agentes.

### Quando ATRAPALHA
- Tarefa pontual / hotfix / ajuste de config / mexer no vault Obsidian (que nem é repo de código).
- Repo sem remote (greenfield local) — o blueprint diz que degrada (fail-open), mas o DEFAULT ainda tenta, então paga o custo de detecção toda vez.
- Trabalho solo onde PR não tem revisor. PR sem segundo par de olhos é overhead puro.
- Iteração rápida em cima do mesmo arquivo (10 micro-mudanças) — worktree+PR por fase quebra o flow.

### O "modo rápido" do blueprint é fraco
`/up:build --rapido` "usa worktree curta por tarefa" (seção 5.1). Isso NÃO é sem cerimônia — ainda cria worktree + branch + (provavelmente) PR. "Rápido" no v2 ainda tem worktree. Não existe um modo "commita direto na branch atual, zero GitHub, zero Multica" como PRIMEIRA classe.

### Correção concreta
- **`github_native` default = `false`** (ou `auto` que só liga se detectar que é um repo colaborativo com PRs recentes de outros). Trabalho solo = commit local, fim. PR só quando EU pedir (`--pr`) ou quando o repo claramente é colaborativo.
- **Adotar o menu de 4 opções do superpowers no fim da fase**, em vez de PR-automático: "Fase pronta. 1) merge local 2) abrir PR 3) deixa a branch 4) descarta". Eu escolho. Isso é literalmente o que a fonte faz e é mais simples.
- **Modo `--solo` / `--zero` de primeira classe:** commit atômico na branch atual, sem worktree, sem issue, sem PR, sem Multica. Esse vira o default real do dia a dia. GitHub-native é o modo "projeto sério com colaboração".
- **Preferir tool nativa de worktree.** A ROADMAP-IMPL princípio #6 diz "preferir `EnterWorktree`" mas o BLUEPRINT seção 5.3 hardcoda `git worktree add`. O próprio dossiê 01 avisa: "using `git worktree add` when you have a native tool creates phantom state your harness can't see" (erro #1). Corrigir: detectar `EnterWorktree`/`/worktree` antes de cair no git manual.

---

## 5. O brainstorm-first vai irritar em tarefas pequenas? Como escalar profundidade?

**Veredito: VAI irritar, e muito. O blueprint reconhece o problema só como "fork aberto" (decisão pro Jonathan) e NÃO desenha a solução. Isso é um buraco no design, não uma decisão pendente.**

### O problema (concreto)
- Seção 3.2 herda o HARD-GATE do superpowers que força brainstorm em "TODO projeto, até mudança de config" (verifiquei no dossiê 01 linha 148-150: "This applies to EVERY project regardless of perceived simplicity"). E a tabela de red flags PROÍBE explicitamente racionalizar "isso é simples demais". Ou seja: por design, mudar uma cor de botão dispara brainstorm com perguntas + 5 aprovações seção-a-seção.
- Para o Jonathan que quer VELOCIDADE, isso é o oposto do que ele pediu. Ele vai desligar (`config.brainstorm=false`, que o blueprint oferece como opt-out) — e aí perde TODO o valor do brainstorm também nos casos que importam. Opt-out binário é a pior saída: ou sofre cerimônia sempre, ou não tem disciplina nunca.

### O que falta: escala de profundidade automática
O ROADMAP-IMPL item 2 dos "forks abertos" pergunta "manter rígido ou permitir `--skip-brainstorm`?" — mas isso joga a decisão pro Jonathan em vez de RESOLVER. A solução é design, não pergunta:

- **Classificar a tarefa ANTES de brainstormar** (o `up-tools.cjs` já tem `classify-task` — em vez de DELETAR como o roadmap propõe, reaproveitar pra ISSO):
  - **Trivial** (1 arquivo, mudança óbvia, sem decisão de arquitetura): **0 perguntas.** Anuncia a abordagem em 1 linha e executa. "Vou mudar X em Y. Indo."
  - **Pequena** (1 subsistema, alguma escolha): **1 pergunta** (a decisão-chave) via AskUserQuestion, sem aprovação seção-a-seção. Design em 3 frases.
  - **Média/Grande** (multi-subsistema, arquitetura nova): **brainstorm full** com perguntas iterativas + aprovação por seção. Aqui o ritual vale.
- **Critério de classificação determinístico** (barato, no `up-tools.cjs`): nº de arquivos prováveis, presença de palavra-chave de arquitetura, se toca schema/API/auth. Não precisa de LLM pra decidir — heurística simples.

### Correção concreta
- **Substituir o opt-out binário por escala automática de 3 níveis (trivial/pequena/grande).** O gate continua existindo (disciplina preservada), mas a PROFUNDIDADE escala com o escopo. Isso é exatamente o que o superpowers já permite ("o design pode ser curto, poucas frases se simples" — dossiê 01 linha 169) mas que o blueprint não operacionalizou.
- **NÃO deletar `classify-task` (roadmap Fase 2/quick-win 3).** Repropô-lo como o classificador que escala o brainstorm. É a peça que falta.
- **Tirar do "forks abertos" e botar no design.** "Quantas perguntas no máximo" não é decisão do Jonathan caso a caso — é regra fixa: trivial=0, pequena=1, grande=ilimitado-mas-uma-por-vez.

---

## 6. A integração Multica é realista ou wishful thinking? Algum endpoint/CLI inexistente?

**Veredito: majoritariamente realista (os dossiês 02/03 são sólidos e bem fundamentados no código real), MAS o blueprint glosa por cima de 3 limitações reais que o próprio dossiê 02 documentou. Há otimismo onde devia haver ressalva.**

### O que é real (verifiquei: `multica` está instalado e autenticado na VPS)
- `multica issue create/status/comment/metadata`, `--parent`, `--metadata key=value` pra filtro idempotente, KEY routável (`MUL-123`), auto-link de PR por KEY na branch/body, auto-done no merge via `Closes MUL-X`. Tudo isso existe e está no dossiê 02 com referência a migrations e handlers reais. Bom.
- O daemon roda Claude Code com `HOME=/root` herdando `~/.claude` — então o ecossistema UP está disponível dentro do agent Multica. Real.

### Wishful thinking / glosado
**6a. "ver os agentes do UP trabalhando ao vivo no board" — NÃO acontece do jeito que o blueprint vende.** O stream `task:message`/`task:progress` ao vivo (seção 6.1, "cada Bash/Edit/Read AO VIVO") só existe quando **o Multica DISPARA o agente** (o daemon faz POST de cada mensagem — dossiê 02 seção 4). Mas o fluxo principal do blueprint é o UP rodando LOCALMENTE (Claude Code na sua máquina) e só ESPELHANDO status no Multica via `multica issue status`. Nesse caminho, o board mostra só `todo→in_progress→done` — NÃO mostra os tool_use ao vivo, porque o agente não está rodando dentro do daemon Multica. Para ter o stream ao vivo, a execução teria que ser DISPARADA pelo Multica (Fluxo A do dossiê 02), o que é um modelo de execução diferente (e tira o controle local). **O scorecard dá nota 10 em "visualização" pro v2 com base nesse stream ao vivo — mas no fluxo padrão proposto o stream não existe.** Isso é a nota mais inflada do scorecard (ver ataque 8).

**6b. Sincronização reversa via webhook é assumida mas o dossiê 02 diz que NÃO funciona.** Seção 6.3 do blueprint: "`multica autopilot trigger-add --kind webhook` chama `up-tools.cjs` quando o agente do Multica termina". Mas o dossiê 02 seção 7 diz textualmente: *"Triggers: só `schedule` (cron) exposto no CLI; `webhook`/`api` existem no schema mas SEM endpoint que dispare (exceto o webhook de autopilot por token)."* Ou seja, o webhook reverso que o blueprint propõe pra "fechar o loop bidirecional" provavelmente não está disponível no CLI hoje. É feature que o dossiê marca como gap, e o blueprint trata como disponível.

**6c. Multica `local_directory` é SERIAL e roda na pasta real; `github_repo` clona fresco.** Dossiê 02 seção 7. O blueprint quer worktree isolada + branch com KEY (seção 6.2) — mas Multica NÃO cria worktree (dossiê 02 seção 7: "Sem worktree nativo gerenciado pelo Multica"). Então o auto-link de PR depende do UP criar a worktree e nomear a branch com a KEY. O blueprint até reconhece isso na seção 6.2, mas a tabela 6.1 fala como se o Multica orquestrasse a execução nas ondas ("N issues-neto atribuídas ao agente certo") — o que conflita com o modelo serial do `local_directory` e o GC de 12-24h que apaga a workdir (dossiê 02 seção 7). Paralelismo de ondas + Multica disparando = não casa com as limitações reais.

### Correção concreta
- **Rebaixar a promessa de "ver agente ao vivo" pra "status no board" no fluxo padrão (execução local).** O stream ao vivo só vale se mudar pro modelo "Multica dispara" — documentar como modo SEPARADO e opcional, não como o default. Ajustar o scorecard (nota de visualização cai de 10 pra ~6).
- **Remover a sincronização reversa via webhook do design v2.0** (ou marcar explicitamente "depende de feature Multica ainda não exposta no CLI — bloqueado por `MUL-xxxx`"). Não prometer loop bidirecional que o CLI não entrega hoje.
- **Multica = espelho de board (status + metadata + link de PR), não orquestrador de execução.** Essa é a integração realista e barata. UP executa local, empurra status. Ponto. Tirar a fantasia de "Multica roda as ondas em paralelo".
- **Tornar TODO o sync Multica opt-in (`--board`), não default.** Fail-open já está previsto, mas mesmo assim cada transição síncrona custa. Batched + opt-in.

---

## 7. TDD em TODO contexto é realista? Onde vira fardo?

**Veredito: TDD como lei universal é fardo em vários contextos reais do Jonathan. O blueprint tem exceções, mas elas são fracas e o gate é rígido demais pro tipo de trabalho que ele faz.**

### Onde TDD-obrigatório vira fardo (contextos reais do Jonathan)
- **Frontend / UI / carrosséis / HTML-CSS.** Boa parte do trabalho dele é visual (skills `carrossel-*`, `image-creator`, landing pages). "Escrever um teste que falha antes de mudar o CSS do slide" é teatro. O teste de verdade de UI é VER renderizado (Playwright/visual-critic), não red-green unit test. Forçar Iron Law de teste-unitário-primeiro em CSS/layout é o tipo de "letra vs espírito" que o próprio superpowers diz combater — mas aqui a letra atrapalha o espírito.
- **Scripts / automações / glue code** (a maior parte do que ele faz: integrações Asaas, uazapi, ManyChat, scrapers Apify). Muito disso é "chama API externa, transforma, manda pro WhatsApp". Testar isso de verdade exige mockar serviços externos que mudam — o teste vira mais frágil e caro de manter que o código. TDD aqui é fardo real.
- **Prototipagem / vibe coding.** O estilo declarado do Jonathan é "learning by building", iterar rápido. TDD-primeiro mata o ciclo de descoberta. O blueprint lista "protótipos throwaway" como exceção, mas exige "permissão explícita" — ou seja, toda vez ele tem que pedir licença pra não fazer TDD. Isso inverte o default errado pro perfil dele.
- **Vault / docs / conteúdo.** Nem é código. Mas o brainstorm-gate + a disciplina toda vão tentar se aplicar.

### O gate é rígido demais
Seção 4: o `approvals.log` "só registra aprovação se o verificador anexou prova de teste que falhou antes". Isso significa que SEM teste-primeiro, a tarefa NÃO AVANÇA. Para o trabalho de integração/UI/script do Jonathan, isso vai travar constantemente, e ele vai acabar desligando TDD global — perdendo onde ele importa (lógica de negócio, parsers, cálculo financeiro).

### Onde TDD é OURO (manter rígido)
- Lógica de negócio pura: cálculo de RFM, parsing, transformações de dados, regras financeiras (Asaas splits, cálculo de cobrança). Aqui red-green é exatamente certo.
- Bugfix de regressão: o ciclo write-test→pass→revert→must-fail→restore (dossiê 01) é genuinamente valioso. Manter.

### Correção concreta
- **TDD por TIPO de código, não universal.** Default:
  - Lógica/parser/cálculo/API-própria/bugfix → **TDD obrigatório** (red-green-refactor + verify-RED). Aqui o Iron Law vale.
  - UI/CSS/layout → **verificação visual obrigatória** (Playwright/visual-critic vê renderizado), NÃO unit-test-first. O "teste que falha" é a captura visual antes/depois.
  - Glue/integração externa/script one-shot → **smoke test obrigatório** (roda de verdade, vê funcionar — `verificar-antes-de-concluir`), não unit-test-first com mock.
- **Inverter o default das exceções.** Em vez de "TDD sempre, exceção precisa de permissão", fazer "o classificador decide o tipo de prova exigida". O Jonathan não pede licença — o sistema sabe que CSS pede prova visual.
- **Manter o gate `approvals.log`, mas o que ele exige varia por tipo:** evidência de teste-falhou (lógica) OU evidência visual antes/depois (UI) OU output de execução real (glue). Todos são "evidência fresca" — a Iron Law de `verificar-antes-de-concluir` é a universal real, TDD-unit é só UMA forma dela.

---

## 8. O scorecard é honesto ou inflado a favor do UP v2?

**Veredito: INFLADO em pontos-chave. O total de 106 é construído pra "ganhar" do superpowers, e 3-4 notas não sobrevivem a escrutínio. Scorecard honesto colocaria v2 perto ou ligeiramente abaixo de superpowers em "rápido e simples".**

### Notas suspeitas (reavaliação)

**Dim 7 — Visualização: v2 = 10. INFLADO (real ~6).** A nota 10 se baseia em "ver cada tool_use ao vivo no board". Mas (ataque 6a) isso só acontece se o Multica DISPARAR a execução — não no fluxo padrão do UP (execução local espelhando status). No fluxo proposto, o board mostra status (todo/in_progress/done), não o stream ao vivo. Honesto: **6**. Comparação: superpowers tem 3 (visual companion pra mockups). v2 com board de status real merece ~6, não 10.

**Dim 1 — Velocidade: v2 = 8. INFLADO (real ~6).** A nota conta só redução de spawns de agente (correta no eixo interno). Mas IGNORA a latência NOVA de GitHub-native + Multica-sync (ataques 1, 4): ~15 ops git/GitHub por fase + dezenas de chamadas `multica`, cada uma com round-trip de rede/subprocesso. Velocidade real percebida no dia a dia (tarefa pequena) PIORA vs v1. Honesto: **6**. superpowers mantém 9 (markdown + 1 hook, zero I/O externo obrigatório).

**Dim 2 — Simplicidade: v2 = 8. LEVEMENTE INFLADO (real ~6-7).** "32→9 comandos" mas cada comando tem 3-9 subverbos (ataque 2). Superfície cognitiva real ~50 entradas. E a contradição 9-vs-14 entre os docs mostra que nem os autores sabem a meta. Honesto: **6-7**.

**Dim 4/5 — Disciplina/TDD: v2 = 9/9.** O scorecard já é honesto aqui ("perde ponto por ser fork novo, regras não batidas sob pressão"). Mas deveria perder MAIS por TDD-universal ser fardo em UI/glue (ataque 7) — a disciplina importada não está adaptada ao trabalho real do Jonathan. Honesto: **7-8**.

**Dim 3 — Persistência: v2 = 10.** Essa é justa. `.plano/` + git-map + bootstrap é genuinamente superior. Mantenho.

### O problema estrutural do scorecard
Ele soma 12 dimensões com peso igual. Mas o Jonathan declarou que quer **RÁPIDO e SIMPLES acima de tudo**. Se você PONDERAR pelo que o dono pediu (velocidade + simplicidade com peso 2x), o v2 perde força exatamente onde herdou cerimônia. O total de 106 é um artefato de dar peso igual a "persistência" (onde v2 arrasa) e "velocidade/simplicidade" (onde v2 só empata ou perde). **Um scorecard honesto ponderado pelos valores declarados do dono colocaria v2 ≈ superpowers, não 14 pontos à frente.**

### Correção concreta
- **Reavaliar dim 1 (8→6), dim 2 (8→6), dim 7 (10→6), dim 5 (9→7).** Total honesto ~96-98, ainda forte, mas não a goleada de 106 vs 92.
- **Adicionar uma dimensão "Custo de I/O / latência externa"** onde superpowers ganha (zero deps externas) e v2 perde (GitHub + Multica). Sem ela o scorecard esconde o maior risco do redesign.
- **Ponderar por velocidade+simplicidade** (o que o dono pediu) e mostrar o total ponderado ao lado do bruto. A honestidade está na ponderação, não no número cru.

---

## SÍNTESE — O que fazer

1. **GitHub-native e Multica: default OFF, lazy, opt-in.** Modo `--solo`/`--zero` (commit local direto) é o default do dia a dia. PR/issue/worktree só em repo colaborativo ou sob `--pr`. Adotar o menu de 4 opções do superpowers no fim da fase em vez de PR-automático.
2. **Brainstorm com escala automática de profundidade** (trivial=0 perguntas / pequena=1 / grande=full). Reaproveitar `classify-task` em vez de deletá-lo. Tirar do "forks abertos".
3. **TDD por tipo de código**, não universal. Iron Law real = `verificar-antes-de-concluir` (evidência fresca); TDD-unit é uma forma dela, prova visual e smoke-test são outras.
4. **Cortar mais agentes** (18→~10): fundir specialists no executor, DCRV num tester multi-pass, clone vira modo. Mesma tese que matou a governança.
5. **Decidir 9 vs 14 comandos** (docs se contradizem) e mirar 6-9 com regra "máx 3 subverbos por comando".
6. **Corrigir o scorecard:** rebaixar dim 1/2/7/5, adicionar dimensão de custo de I/O, ponderar por velocidade+simplicidade. Total honesto ~96, não 106.

O redesign acertou o diagnóstico interno (governança era teatro) mas reimportou cerimônia externa (GitHub/Multica/brainstorm universal) sem calibrar pro perfil "builder solitário que quer velocidade". Conserta a calibragem e o v2 fica genuinamente melhor; deixa como está e o Jonathan vai desligar metade na primeira semana.

---

Arquivo: `/home/projects/up-cc/redesign/CRITIQUE.md`
