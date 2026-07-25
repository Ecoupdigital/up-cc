# SYSTEM-DESIGN: UP (up-cc)

**Criado**: 2026-07-25 · **Escopo**: sistema UP v2 real, como está no repositório, mais o ponto exato onde cada item do ciclo novo (briefing das disciplinas do aihero, Tier A + B + modo grill) encosta.

## Por que este documento cita caminho de arquivo

Este é o mapa do sistema existente, não um plano de execução. A regra de durabilidade do plano (item 9 do briefing) proíbe caminho de arquivo e trecho de código dentro de plano, porque plano é escrito num momento e executado noutro, com o código já mexido. Aqui a função é oposta: registrar a fotografia verificada do repositório na data acima, para que o planejamento consiga converter cada superfície em contrato de comportamento. Os caminhos abaixo são evidência do estado atual, exatamente como as linhas "Superfícies:" do briefing.

---

## 1. Natureza do sistema

UP é um sistema de meta-prompting distribuído como pacote npm (`up-cc`, versão 2.3.0). Não há servidor, banco de dados, rota HTTP, sessão de usuário nem autenticação. O produto é um conjunto de arquivos Markdown e Node.js que se instalam dentro do diretório de configuração de uma CLI de IA e passam a governar como aquela CLI conduz trabalho de software.

Consequência de design: onde um SaaS teria papéis, tabelas e rotas, o UP tem **agentes**, **artefatos de estado** e **superfícies interativas**. As três seções equivalentes deste documento são a matriz de escrita por artefato (seção 6), os contratos de dado (seção 5) e o inventário de superfícies onde o sistema fala com o dono (seção 7).

### Stack e restrições herdadas

| Dimensão | Valor |
|----------|-------|
| Linguagem | JavaScript CommonJS (`.cjs` para CLI e libs, `.js` para hooks e instalador) |
| Runtime | Node.js >= 16.7.0, zero dependência de produção |
| Linguagem de definição | Markdown com frontmatter YAML e tags XML semânticas |
| Idioma de interface | Português brasileiro com acentuação correta, sem travessão |
| Distribuição | npm (`up-cc`), instalado em 4 runtimes de CLI |
| Persistência | Arquivos em `.plano/` no repositório do usuário, mais estado efêmero em diretório temporário do sistema operacional |
| Testes | `node:test` e `node:assert`, sem framework externo |

---

## 2. Camadas

Sete camadas, na ordem em que uma execução as atravessa.

**Camada 1: Comandos** (`up/commands/*.md`, 7 arquivos)

`up.md`, `plan.md`, `build.md`, `testar.md`, `auditar.md`, `depurar.md`, `rapido.md`. Cada comando declara frontmatter (`name`, `description`, `argument-hint`, `allowed-tools`) e referencia exatamente um workflow por `@$HOME/.claude/up/workflows/...`. `/up` é a porta única: sem argumento continua de onde parou, com descrição dispara o brainstorm escalado e roteia.

**Camada 2: Workflows** (`up/workflows/*.md`, 12 arquivos)

`up`, `plan`, `build`, `dcrv`, `auditar`, `governance`, `mapear-codigo`, `onboarding`, `rapido`, `pausar`, `resetar`, `remover-fase`. Markdown estruturado em `<step>`, com trechos bash que chamam a CLI de ferramentas e blocos que spawnam agentes. O maior é `build.md` (911 linhas), que contém o motor de ondas, os gates e o menu de fechamento de fase.

**Camada 3: Agentes** (`up/agents/up-*.md`, 12 hoje, 13 ao fim do ciclo)

**Hoje, 12:** `up-arquiteto`, `up-planejador`, `up-executor`, `up-verificador`, `up-revisor`, `up-tester`, `up-auditor`, `up-depurador`, `up-pesquisador`, `up-mapeador-codigo`, `up-sintetizador`, `up-roteirista`. Cada um roda como subagente com contexto fresco. `up-executor` absorveu a antiga frota de especialistas por domínio; `up-revisor` absorveu a pirâmide CEO, chief e supervisor; `up-tester` absorveu os detectores do laço detectar, corrigir e reverificar.

**Depois da fase 18, 13:** o revisor único é aposentado e dá lugar a **dois agentes de eixo**, um de conformidade com o spec e um de qualidade com segurança, que rodam em paralelo em subagentes isolados. Os demais 11 agentes seguem iguais.

Por que a divisão é forçada e não é preferência: REV-01 exige subagentes isolados, e REV-04 exige que a cegueira ao código do eixo de conformidade venha do **conjunto de ferramentas concedido ao subagente**, não de instrução em texto. Neste sistema o conjunto de ferramentas é declarado no frontmatter do arquivo de agente. Um agente único com sinalizador de modo continuaria carregando as ferramentas de leitura de código nos dois modos, e a cegueira voltaria a ser promessa. Dois arquivos de agente com ferramentas assimétricas é a única forma de a cegueira ser estrutural.

Risco de ordem, conhecido e registrado: as fases 14 e 16 editam o arquivo do revisor único que a fase 18 remove. A fase 14 troca redefinição por citação do glossário, e a fase 16 escreve nele a instrução de confirmação do achado de tautologia, que é o que fecha PROVA-08. Se a fase 18 fechar antes, essa instrução some do produto sem que gate nenhum perceba, porque a prova de PROVA-08 mora no lado da heurística. A serialização declarada no roadmap (14, depois 16, depois 17, depois 18) resolve a ordem, e o tratamento de cada edição é decisão do planejamento das fases envolvidas.

**Camada 4: Skills** (`up/skills/*/SKILL.md`, 4 pastas)

`usando-up` (bootstrap injetado no início de sessão), `up-brainstorm` (mais `visual-companion.md` na mesma pasta), `up-tdd`, `up-verificar-antes-de-concluir`. Carregam por correspondência de descrição quando a situação aparece. São a camada de doutrina: definem o que é proibido, não o que é executado.

**Camada 5: CLI de ferramentas** (`up/bin/`)

`up-tools.cjs` (3981 linhas) despacha subcomandos determinísticos; `lib/core.cjs` (377 linhas) concentra git, configuração com defaults e presets; `lib/github.cjs` (609 linhas) faz o ciclo worktree, branch, issue, PR e merge com falha aberta; `lib/multica.cjs` (424 linhas) espelha o quadro externo, opt-in e com falha aberta; `lib/github.test.cjs` (161 linhas) é o único teste do lado UP hoje. `up-instrument.cjs` instrumenta execução.

Subcomandos existentes: `init` (12 variantes), `state`, `roadmap`, `phase`, `config`, `requirements`, `github`, `multica`, `commit`, `progress`, `budget`, `status`, `context`, `timeout`, `stuck-check`, `verify-static`, `classify-task`, `resolve-model-for-plan`, `routing-log`, `analyze-routing`, `validate-plan`, `skill-manifest`, `timestamp`, `slug`, `phase-plan-index`, `state-snapshot`, `summary-extract`.

**Camada 6: Hooks** (`up/hooks/`, apenas Claude Code)

`up-statusline.js` (88 linhas, barra de contexto), `up-context-monitor.js` (112 linhas, PostToolUse, hoje só avisa), `up-session-start.js` (152 linhas, injeta o bootstrap e um trecho capado do estado atual a cada início de sessão e a cada limpeza de contexto). Todos saem em silêncio com código zero em erro ou timeout de 3 segundos.

**Camada 7: References e templates**

19 references (`up/references/`), com destaque para `questioning.md`, `tdd-evidence-types.md`, `governance-rules.md` e a versão comprimida, `engineering-principles.md` e a versão comprimida, `production-requirements.md` e a versão comprimida, `state-persistence.md`, `git-integration.md`, `severity-levels.md`, `checkpoints.md`, `ui-brand.md`, os três catálogos de auditoria (`audit-ux`, `audit-performance`, `audit-modernidade`) e a pasta `blueprints/`. 19 templates (`up/templates/`), incluindo `plan-ready.md`, `roadmap.md`, `state.md`, `project.md`, `requirements.md`, `summary.md`, `report.md`, `suggestion.md`, `checklist.md`, `owner-profile.md`.

**Distribuição** (`up/bin/install.js`, 1297 linhas)

Converte e copia para 4 runtimes: Claude Code (formato nativo, mais statusLine, PostToolUse e SessionStart no `settings.json`), Gemini CLI (frontmatter convertido, comandos em TOML, bootstrap injetado no `GEMINI.md`), OpenCode (frontmatter convertido, comandos achatados, bootstrap no `AGENTS.md`), Codex CLI (cada comando vira pasta de skill com `SKILL.md` e `agents/openai.yaml`). Desde a fase 11 o alvo Claude também emite os 7 comandos como command-skills, o que torna o UP invocável no Grok Build sem alvo de instalação novo.

---

## 3. Fluxo de execução

```
/up  ->  brainstorm (skill)  ->  BRIEFING aprovado
                                      |
                                 /up:plan  ->  up-arquiteto + up-planejador  ->  PLAN-READY + planos por fase
                                      |
                                 /up:build ->  por fase: worktree + branch + issue
                                                  |
                                            por onda: N x up-executor em paralelo
                                                  |
                                            up-verificador -> revisão -> GATE approvals.log
                                              (hoje: up-revisor, dois estágios em sequência)
                                              (após a fase 18: dois agentes de eixo em paralelo)
                                                  |
                                            teste visual pré-merge (se há UI)
                                                  |
                                            menu de fechamento: merge local, PR, deixar branch, descartar
```

Depois da fase 18, o passo do revisor no diagrama passa a ser dois eixos em paralelo (conformidade e qualidade com segurança), com veredito por eixo alimentando o mesmo gate, que é conjuntivo.

`/up:testar` roda o laço detectar, corrigir e reverificar sobre visual, interação, API, experiência, mobile e ponta a ponta. `/up:auditar` faz um passe de auditoria. `/up:depurar` mantém estado de depuração que sobrevive à limpeza de contexto. `/up:rapido` é o escape hatch declarado: tarefa avulsa, commit atômico na branch atual, sem roadmap e sem cerimônia.

---

## 4. Artefatos de estado

### Existentes

| Artefato | Papel | Sobrevive à limpeza de contexto |
|----------|-------|-------------------------------|
| `.plano/PROJECT.md` | Contexto do projeto, decisões-chave | Sim |
| `.plano/REQUIREMENTS.md` | Requisitos com identificador e rastreabilidade | Sim |
| `.plano/ROADMAP.md` | Fases, critérios de sucesso, progresso | Sim |
| `.plano/STATE.md` | Posição atual, decisões, bloqueios, continuidade | Sim, e é reinjetado pelo hook de início de sessão |
| `.plano/config.json` | Configuração do projeto | Sim |
| `.plano/PLAN-READY.md` | Bandeira de "planejado, pronto para executar", portátil entre runtimes | Sim |
| `.plano/git-map.json` | Mapa fase para branch, worktree, issue, PR, status | Sim |
| `.plano/governance/approvals.log` | Gate determinístico, uma linha por veredito, com campo de evidência | Sim |
| `.plano/fases/NN-slug/` | Contexto, planos, resumos, verificação e revisão da fase | Sim |
| `.plano/codebase/` | Mapa do código existente em modo brownfield | Sim |
| `.plano/runtime/` | Saída de verificação estática e instrumentação | Sim |

### Novos neste ciclo

| Artefato | Papel | Criação | Versionado |
|----------|-------|---------|-----------|
| Glossário interno do UP | Verbetes dos termos do próprio sistema, cada um com definição curta e lista de sinônimos proibidos. Fonte única citada por agentes e workflows | No pacote, junto das references | Sim, faz parte do produto |
| `.plano/GLOSSARY.md` | Glossário do domínio do projeto do usuário | Preguiçosa: só quando o primeiro termo é resolvido | Sim |
| `.plano/decisoes/NNNN-slug.md` | Registro de decisão com alternativas rejeitadas, numeração determinística e status opcional | Preguiçosa, e só se as três condições passarem | Sim |
| `.plano/fora-de-escopo/<conceito>.md` | Base de rejeições por conceito de domínio, lida antes de explorar intenção | Preguiçosa, e só para rejeição estrutural | Sim |
| Documento de handoff | Fio vivo comprimido para uma sessão nova continuar | Sob demanda, em diretório temporário do sistema operacional | Não, por design |
| Relatório de auditoria em HTML | Saída autocontida com cards, badge de força e recomendação principal | Por execução da auditoria, em diretório temporário | Não, por design: não suja working tree nem diff |

Regra transversal dos dois últimos: o que é efêmero mora fora do repositório. Handoff e relatório de auditoria não são artefatos para manter, e versioná-los criaria dívida de manutenção sem dono.

---

## 5. Contratos de dado

Esta é a área de maior risco do ciclo, porque três itens mexem em contrato já em uso por projetos existentes.

### 5.1 Linha do log de aprovações

Contrato documentado no workflow de governança e na reference de evidência por tipo:

```
<timestamp ISO> | <escopo> | <agente revisor> | <DECISAO> | <motivo> | evidence=<tipo>:<resultado>
```

com `<tipo>` em `{logic, ui, glue}` e `<resultado>` em `{test_pass, visual, smoke}`.

O campo do agente é `up-revisor` hoje. Depois da fase 18 ele passa a ser o agente do eixo que emitiu o veredito, e a linha ganha o campo de eixo exigido pelo gate conjuntivo. Nada disso quebra a leitura, porque o leitor único localiza campo por conteúdo e funciona com ou sem a coluna do agente.

Fato verificado: as duas entradas reais no log deste repositório usam uma variante mais curta (`fase=11 plano=001 | APPROVED | evidence=smoke:pass` e `evidence=test:red-green`), sem a coluna do agente e com vocabulário que não casa com o filtro fechado do gate em nenhum dos dois campos. Há ainda uma terceira forma: as primeiras linhas do arquivo são um fragmento de JSON truncado, que leitor nenhum prevê.

O gate de hoje quebra em três pontos contra essas linhas, e nesta ordem de execução:

1. **Seletor.** A entrada é procurada por `phase-N` junto do nome do agente. As linhas reais dizem `fase=11` e não trazem coluna de agente, então a busca volta vazia e o gate para em "veredito não encontrado" antes de qualquer outra regra rodar. Este falha primeiro, e por isso os outros dois nunca chegam a ser exercidos.
2. **Posição.** Se fossem encontradas, seriam lidas por posição fixa de coluna, assumindo seis colunas. As linhas reais têm cinco, porque falta a do agente, então a coluna lida como veredito é a da evidência.
3. **Vocabulário.** O conjunto aceito é fechado e não cobre nem o que foi gravado nem o rótulo novo de seams confirmados.

Compatibilidade aqui não se obtém por inação, e também não se obtém ignorando o que não se reconhece: ignorar apagaria o veredito histórico que a revisão em dois eixos promete continuar lendo. A solução é um leitor único que **localiza os campos por conteúdo e não por posição**: escopo pelo número da fase em qualquer das notações em uso, veredito pela palavra de veredito, evidência pelo prefixo do campo, com ou sem a coluna do agente. Só é descartada a linha que não carrega veredito nenhum, como o fragmento de topo. É o que PROVA-04 passou a exigir por escrito, e REV-09 aponta para esse mesmo leitor em vez de implicar um segundo.

Precisão para o planejamento não mirar no alvo errado: as duas linhas divergentes foram escritas à mão, fora do workflow, porque as fases 11 e 12 rodaram fora do roadmap. O escritor oficial do build emite o formato documentado de seis colunas. Não há descompasso entre escritor e leitor no caminho normal, então o que se conserta aqui é **leitura de histórico**, e não o escritor.

### 5.2 Índice de planos da fase

`phase-plan-index` devolve `phase`, `plans[]` (com `id`, `wave`, `autonomous`, `objective`, `files_modified[]`, `task_count`, `has_summary`), `waves` (mapa de número da onda para lista de identificadores), `incomplete[]` e `has_checkpoints`. Hoje a onda é dado primário lido do frontmatter do plano, e o workflow de build itera as ondas em ordem crescente confiando que planos da mesma onda são independentes.

Item 7 inverte isso: a aresta de bloqueio vira o dado primário e a onda vira visão derivada. Duas restrições verificadas que o planejamento precisa absorver:

1. O índice reconhece planos com nome terminando em `-PLAN.md` ou `PLAN.md`. A fase 11 gravou os planos como `PLAN-001.md`, que esse filtro não pega. Verificado por execução: `phase-plan-index 11` devolve lista de planos vazia com o arquivo em disco, e `phase-plan-index 3` devolve `has_summary` falso porque o resumo daquela fase está gravado como `03-001-SUMMARY.md`. São duas convenções de nome em uso no próprio repositório, para plano e para resumo, e a fronteira derivada nasceria cega para a mais recente. É o que PLANO-13 cobre.
2. Projeto planejado antes deste ciclo não tem aresta declarada. A derivação da fronteira precisa degradar para a onda numerada existente, sem migração destrutiva.

Regra que acompanha a inversão, e que vale antes mesmo de o mecanismo existir: **fronteira liberada não autoriza paralelismo entre dois trabalhos que escrevem no mesmo arquivo**. A fronteira responde quem pode começar, nunca quem pode começar junto. Dependência lógica é aresta; disputa pelo mesmo arquivo é exclusão mútua, e as duas não se misturam no mesmo campo, sob pena de o grafo passar a mentir sobre o motivo da ordem. O roadmap deste ciclo aplica as duas camadas: uma aresta nova (16 antes de 18, por consumo do leitor único) e uma serialização por posse de arquivo entre as fases 14, 16, 17 e 18.

### 5.3 Mapa git por fase

`git-map.json` guarda, por fase, `branch`, `worktree`, `issue`, `issue_url`, `pr`, `pr_url` e `status`, além de `github_native` e `merge_strategy` no topo. Item 7 pode precisar de campo novo aqui para representar o estado da fronteira. A regra de compatibilidade é a mesma: campo novo opcional, leitura tolerante à ausência.

### 5.4 Frontmatter do plano pronto

`PLAN-READY.md` carrega versão, quando e por quem foi planejado, runtime de execução pretendido, contagens e confiança de planejamento. Item 6 adiciona campo obrigatório de seams confirmados, e o gate passa a recusar plano sem ele. Item 9 adiciona campo obrigatório de fora de escopo e proíbe caminho de arquivo e bloco de código no corpo, com exceção única de trecho vindo de protótipo, marcado como tal.

Observação de coerência: o template atual ainda descreve aprovações de CEO, chiefs e supervisores, papéis que a versão 2 removeu. É sedimento conhecido e está fora do escopo deste ciclo por decisão do dono (o passe de corte de sedimento tem briefing próprio), mas quem editar o template para os campos novos vai esbarrar nele.

---

## 6. Matriz de escrita por artefato

Equivalente, neste sistema, à matriz de permissões de um SaaS: quem tem direito de escrever em cada artefato. A violação mais cara do UP é dois atores escrevendo o mesmo artefato com semânticas diferentes.

| Artefato | Escreve | Lê | Proibido escrever |
|----------|---------|----|-------------------|
| `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md` | `up-arquiteto`, `up-roteirista` | Todos | `up-executor` |
| `STATE.md` | CLI de ferramentas (subcomando `state`) | Todos, mais o hook de início de sessão | Agentes escrevendo direto |
| Planos da fase | `up-planejador` | `up-executor`, `up-revisor` | `up-executor` |
| Resumos da fase | `up-executor` | `up-verificador`, `up-revisor` | Outros agentes |
| Relatório de revisão | `up-revisor` hoje; após a fase 18, os dois agentes de eixo, cada um escrevendo apenas a seção do próprio eixo | Orquestrador | Qualquer outro, e um eixo escrever na seção do outro |
| `approvals.log` | Dois escritores legítimos: o orquestrador do build, que grava o veredito de fase a partir do relatório de revisão; e o planejamento, que grava a entrada de confirmação de fronteiras sob escopo de planejamento | Gate em bash, pelo leitor único descrito em 5.1 | O agente de revisão escrevendo direto, e o planejamento gravando veredito de fase |
| `git-map.json` | Biblioteca de integração com GitHub | Workflows | Agentes |
| Glossário do projeto e registros de decisão | Skill de brainstorm (em modo grill) e auditoria, na hora em que o termo ou a decisão cai | Brainstorm, planejamento, auditoria | Escrita em lote no fim da sessão |
| Base de rejeições | Skill de brainstorm e auditoria, quando a rejeição é estrutural | Brainstorm, antes de explorar intenção | Registro de item já implementado ou de adiamento |
| Handoff e relatório HTML | Primitiva de handoff e auditor | Sessão seguinte, navegador do dono | Nada dentro do repositório |

Condição do segundo escritor do log de aprovações: a entrada do planejamento é **aditiva**, usa **escopo de planejamento** (nunca o escopo de fase da execução) e **nunca carrega veredito de fase**. Veredito de fase continua com dono único, o orquestrador do build. A distinção precisa estar escrita aqui: sem ela, a detecção de violação acusaria falso positivo no caminho normal, justamente no artefato que este desenho trata como o mais caro de ter dois donos.

---

## 7. Superfícies interativas

Todo lugar onde o UP faz uma pergunta ao dono. O item 1 do briefing (resposta recomendada em toda pergunta) e o item 2 (fato contra decisão) são regras que valem em todas elas, sem exceção.

| Superfície | Onde vive | O que pergunta hoje |
|-----------|-----------|---------------------|
| Roteamento da porta única | Workflow `up` | Para onde ir quando o dono chega sem argumento ou com uma ideia crua |
| Brainstorm | Skill `up-brainstorm`, mais `questioning.md` | Intenção, requisitos, design, checkpoint de fechamento de rodada |
| Planejamento | Workflow `plan` | Briefing, design, credenciais críticas, o que fazer quando o revisor bloqueia |
| Fechamento de fase | Workflow `build` | Como aterrissar a fase: merge local, PR, deixar branch, descartar |
| Gate visual pré-merge | Workflow `build` | Testar antes ou seguir para o merge, e depois aprovar ou ajustar |
| Confirmação de início | Workflow `build` | Iniciar execução, e o que fazer quando falta plano |
| Auditoria | Workflow `auditar`, agente `up-auditor` | Hoje despeja lista; passa a ter gate duro com pergunta única de handoff |

---

## 8. Onde cada item do briefing encosta

| Item | Bloco | Camada tocada | Natureza | Prova exigida | Fase |
|------|-------|---------------|----------|---------------|------|
| 1. Resposta recomendada em toda pergunta | 1 | Reference de questionamento, skill de brainstorm, workflows `up`, `plan`, `build` | Doutrina | Smoke | 13 |
| 2. Fato contra decisão | 1 | Reference de questionamento, skill de brainstorm, agentes de arquitetura e planejamento | Doutrina | Smoke | 13 |
| 3. Glossário com sinônimos banidos | 2 | Reference nova (camada interna) mais artefato do projeto (camada de domínio) | Doutrina mais artefato | Smoke | 14 |
| 4. Registro de decisão e base de rejeições | 2 | Artefatos do projeto, skill de brainstorm, operação determinística de numeração na CLI | Artefato mais código | Smoke | 14 |
| 13. Modo grill | 1 | Skill de brainstorm (modo, não skill nova), classificação de tarefa | Doutrina | Smoke | 15 |
| 6. Seams pré-acordados | 3 | Template do plano pronto, gate do log de aprovações, workflow `build` | Contrato mais doutrina | Smoke | 16 |
| 5. Regra anti-tautologia | 3 | Skill de TDD, verificação estática na CLI | Doutrina mais código | Lógica, vermelho e verde | 16 |
| 7. Grafo de bloqueio e fronteira | 4 | Índice de planos da fase, mapa git, workflows `plan` e `build` | Contrato mais código | Lógica, vermelho e verde | 17 |
| 8. Tamanho medido em janela de contexto | 4 | Workflow `plan`, agente planejador | Doutrina | Smoke | 17 |
| 9. Durabilidade do plano | 4 | Templates de plano, validação de plano na CLI | Doutrina mais código | Lógica, vermelho e verde | 17 |
| 10. Higiene de contexto e handoff | 5 | Hook de monitor de contexto, template de estado, primitiva nova de handoff | Código mais doutrina | Smoke | 18 |
| 11. Revisão em dois eixos paralelos | 5 | Agente revisor (que se divide em dois agentes de eixo com ferramentas assimétricas), workflow `build`, semântica do gate | Doutrina mais contrato mais agente novo | Smoke | 18 |
| 12. Auditoria visual e escopada | 6 | Subcomando de hotspots na CLI, workflow e agente de auditoria, saída HTML | Código mais doutrina | Visual | 19 |
| Bloco 7. Pedaços do wayfinder | 7 | Workflow `plan` (auto-aborto), template de roadmap (névoa e fora de escopo) | Doutrina mais template | Smoke | 20 |

---

## 9. Integrações

| Integração | Para quê | Como |
|-----------|----------|------|
| GitHub | Worktree, branch, issue, PR e merge por fase | `gh` na linha de comando ou servidor MCP, com falha aberta: sem GitHub o build continua em modo local |
| Playwright | Prova visual e navegação real na revisão cega ao código e no laço de testes | Servidor MCP, usado por `up-tester` e pelo primeiro estágio do revisor |
| Multica | Espelho de quadro externo, opt-in | Biblioteca própria, falha aberta, com detecção de sistema operacional para proxy por SSH quando o dono está no Mac |
| npm | Distribuição do pacote `up-cc` | Publicação direta, sem etapa de build |
| Pesquisa web e documentação | Pesquisa de ecossistema pelo agente pesquisador | Busca web e documentação oficial |
| Navegador do sistema | Abrir o relatório HTML de auditoria (item 12) | Abertura por caminho absoluto, informado ao dono |
| Diretório temporário do sistema | Handoff (item 10) e relatório de auditoria (item 12) | Escrita fora do repositório, nunca versionada |

---

## 10. Linguagem visual

O UP tem uma única superfície visual hoje: a saída em terminal, padronizada na reference de marca (banners de estágio, caixas de checkpoint de 62 caracteres, barra de progresso do statusline). O ciclo novo adiciona a segunda: o relatório de auditoria em HTML autocontido, com card fixo por achado e badge ternário de força (forte, vale explorar, especulativo).

Decisão registrada: não se cria arquivo de tokens de design para isso. O relatório é autocontido, gerado em diretório temporário, com estilo embutido, e herda o vocabulário visual da reference de marca (hierarquia por peso e separadores, sem dependência externa). Um arquivo de tokens serviria a uma aplicação web com múltiplas telas, que não é o caso.

---

## 11. Riscos de contrato e decisões de compatibilidade

| Risco | Decisão tomada |
|-------|----------------|
| Item 7 muda o contrato de ondas | Campo novo de aresta é opcional. Sem aresta declarada, a fronteira degrada para a onda numerada existente. Não há migração destrutiva de projeto antigo |
| Duas convenções de nome de plano e de resumo em uso | A derivação da fronteira lê as duas, porque quebrar a leitura de um projeto existente é regressão. Requisito PLANO-13, com teste vermelho e verde sobre uma fase gravada em cada convenção |
| Item 11 muda quando o gate recebe entrada | O gate passa a representar veredito por eixo, e é conjuntivo (decisão D7 do dono): a fase só aprova com os dois eixos aprovados. O eixo já aprovado fica registrado e não é reexecutado na rodada de correção. Assim o estado "spec reprova, qualidade aprova" vira registrável sem que a fase avance |
| Item 5 é heurística, não prova | A heurística sinaliza e o revisor confirma. Não bloqueia o gate sozinha, porque falso positivo bloqueante em cima de teste honesto é pior que tautologia passando |
| Três formas no log de aprovações, e o gate quebra em três pontos contra elas (seletor, posição de coluna e vocabulário) | Leitor único que localiza campo por conteúdo: escopo pelo número da fase em qualquer notação, veredito pela palavra de veredito, evidência pelo prefixo, com ou sem coluna de agente. Entrada nova de seams confirmados soma, não substitui. Só descarta linha sem veredito nenhum. Conserta a leitura do histórico, não o escritor |
| Dezenove arquivos disputados por fases que a dependência lógica autorizaria a paralelizar | Duas camadas separadas: aresta só para dependência lógica (16 antes de 18), e serialização declarada por posse de arquivo para as fases 14, 16, 17 e 18. Rejeitada a alternativa de transformar a disputa em aresta, porque isso faria o grafo mentir sobre o motivo da ordem, e o mecanismo de fronteira que a fase 17 entrega herdaria a mentira |
| Treze arquivos ainda compartilhados entre pares que nenhuma das duas camadas ordena | Aceitos com risco baixo declarado: nesses pontos as fases fazem acréscimo aditivo e não reescrita do mesmo bloco, então o pior caso é conflito de merge previsível. Estender a serialização dura às fases 15, 19 e 20 sequenciaria o ciclo inteiro para comprar pouco. A regra de execução da fronteira continua valendo caso a caso |
| O revisor único é editado pelas fases 14 e 16 e removido pela fase 18 | A serialização (14, depois 16, depois 17, depois 18) garante a ordem. O risco caro é o da fase 16: a instrução de confirmação do achado de tautologia, que fecha PROVA-08, sumiria do produto sem gate perceber, porque a prova de PROVA-08 mora no lado da heurística |
| Janela entre a publicação do glossário (fase 14) e a derivação da fronteira (fase 17) | O verbete de onda nasce na forma final, e a fase 17 confere o verbete publicado contra o comportamento entregue. A fase 14 escreve, a fase 17 confirma, sem inverter o grafo |
| Item 6 endurece o gate do plano pronto | Vale para plano gerado a partir deste ciclo. Plano anterior ao ciclo passa no gate e registra a ausência do campo como aviso, sem bloquear, e não é reescrito retroativamente |
| Nomear a fronteira colide com a proibição de caminho de arquivo | A fronteira é nomeada como contrato público (módulo exportado, interface, comando ou rota), nunca como caminho. Sem essa regra, item 6 e item 9 se anulam dentro do mesmo plano |

---

## 12. Fora do design deste ciclo

Registrado aqui para que a fronteira fique explícita e não volte como sugestão:

- Nenhuma doutrina de desabilitar invocação por modelo. O sistema de origem precisa disso porque não tem orquestrador; o UP aposta no oposto.
- Nenhuma migração de armazenamento para issue tracker. O diretório de planejamento continua sendo a fonte, porque sobrevive à limpeza de contexto, funciona sem a linha de comando do GitHub e atravessa os 4 runtimes.
- Nenhum port de skill inteira do sistema de origem, nem comando novo de protótipo.
- Nenhum corte de sedimento (template órfão, poda de negações nos workflows). É trabalho real, mas é passe de refatoração com briefing próprio.
- Nenhuma mudança no instalador nem nos 4 runtimes além do que os artefatos novos exigirem.
