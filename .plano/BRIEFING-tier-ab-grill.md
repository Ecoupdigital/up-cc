# BRIEFING: Disciplinas do aihero (Tier A + B) + modo grill no UP

## Contexto

Varredura das 22 skills do Matt Pocock (`mattpocock/skills` + aihero.dev), cruzada com inventário factual do UP v2. O sistema dele e o UP resolvem o mesmo problema com filosofias opostas: ele tem ~18 skills minúsculas sem orquestrador (humano é o índice, quase tudo `disable-model-invocation: true`, artefatos no issue tracker); o UP tem porta única, roteamento por estado, `.plano/` como banco e execução automática (worktree/PR/merge).

**Tese do escopo:** o UP não deve virar o sistema dele. O que ele tem e o UP não tem são **disciplinas**, e disciplina é exatamente o que falta num pipeline autônomo. O que se importa aqui são mecanismos, não arquitetura.

### Lacunas confirmadas no inventário do UP

| Mecanismo | Estado hoje |
|-----------|-------------|
| Glossário / linguagem ubíqua | **Não existe.** Zero ocorrências em skills, commands, agents, workflows, references, templates |
| ADR com alternativas rejeitadas | **Parcial.** `STATE.md` tem tabela de Decisões e `PROJECT.md` tem Key Decisions, mas nenhum template guarda alternativa rejeitada, nem há arquivo por decisão, nem numeração/status |
| Memória de rejeição (o que já foi recusado) | **Não existe.** Depois de `/clear` o agente re-propõe o que o dono já vetou |
| Seam de teste (onde o teste encosta) | **Não existe.** `tdd-evidence-types.md` define o TIPO da prova (`logic:test_pass`, `ui:visual`, `glue:smoke`), nunca o LUGAR |
| Checagem de teste honesto | **Não existe.** O gate valida que o teste rodou, não que ele podia falhar |
| Handoff entre sessões | **Não existe.** `up-context-monitor.js` (hook PostToolUse) apenas avisa que o contexto está enchendo |
| Grafo de dependência entre planos | **Não existe.** `phase-plan-index` agrupa em ondas fixas, sem arestas |

### Fatos verificados neste repo

- `up/skills/up-brainstorm/SKILL.md` tem 110 linhas, com tabela de tiers (Trivial 0 perguntas / Pequena 1 / Média-Grande full), override do usuário e checkpoint de fechamento de 2 opções.
- `up/references/questioning.md` traz filosofia de perguntas e anti-padrões, mas **não** proíbe perguntar o que o agente poderia descobrir sozinho, nem exige resposta recomendada junto da pergunta.
- `up-tools.cjs` já expõe `classify-task`, `phase-plan-index`, `verify-static` (grava logs em `.plano/runtime/`), `context`, `state`, `github`.
- `up-revisor` roda two-stage **sequencial e travado**: Stage 2 (qualidade + OWASP) só roda depois de Stage 1 (spec-compliance) passar, com a regra "a ordem é inviolável".
- Stage 1 do `up-revisor` é deliberadamente **cego ao código** (testa como usuário final). Isso é força do UP e deve ser preservado.

## Decisões do dono (tomadas neste brainstorm)

| # | Decisão | Alternativas rejeitadas |
|---|---------|-------------------------|
| 1 | Escopo aprovado: Tier A (itens 1-5) + Tier B (itens 6-12) + modo grill | Fatiar em ondas menores ao longo de semanas |
| 2 | **Grill vira o piso automático** em Pequena, Média e Grande. Trivial fica em 0 pergunta | (a) grill só sob comando (`--grill`, "me grelha") - rejeitado porque exige lembrar de pedir e o problema declarado é justamente perguntar de menos; (b) grill só em Média/Grande - rejeitado por deixar Pequena rasa |
| 3 | Glossário e registro de decisão moram **dentro de `.plano/`** | (a) convenção do Matt (`CONTEXT.md` na raiz + `docs/adr/`) - rejeitada por espalhar artefato do UP em dois lugares e sujar a raiz do projeto do cliente; (b) híbrido - rejeitado porque regra com exceção é mais difícil do agente obedecer |
| 4 | Não copiar `disable-model-invocation` como doutrina | O sistema dele precisa disso porque não tem orquestrador; o UP aposta no oposto. Copiar quebra a premissa |
| 5 | Não copiar issue tracker como storage substituindo `.plano/` | `.plano/` sobrevive a `/clear`, funciona sem `gh` e atravessa 4 runtimes |
| 6 | Não portar o `wayfinder` inteiro. Só três pedaços dele entram (Bloco 7), aprovados como adição ao Tier A+B | Portar a skill inteira sobrepõe `up-brainstorm` + `/up:plan` e é inchaço |

## Escopo

### Bloco 1: Como o UP pergunta (itens 1, 2 e o grill)

**Item 1. Toda pergunta vem com resposta recomendada.**
Nenhuma pergunta crua em qualquer superfície interativa do UP (brainstorm, plan, menu de fechamento de fase, gate visual pré-merge). Formato obrigatório: pergunta + recomendação + porquê, para o dono confirmar ou corrigir em vez de redigir. Converte entrevista em revisão.
Superfícies: `questioning.md`, `up-brainstorm`, workflows `plan`, `build`, `up`.

**Item 2. Regra FATO x DECISÃO.**
Antes de cada pergunta, o agente tenta resolver por conta própria (Read, Grep, git, `STATE.md`, `REQUIREMENTS.md`, `.plano/codebase/`). Só sobe pro dono o que é escolha ou trade-off. Fato descobrível nunca vira pergunta; decisão arquitetural nunca é do agente.
Superfícies: `questioning.md`, `up-brainstorm`, `up-arquiteto`, `up-planejador`.

**Item 13. Modo grill no `up-brainstorm`** (padrão wrapper/core: um motor, várias portas).

- **Motor:** modo dentro do `up-brainstorm`, não skill nova. Perguntas ilimitadas, uma por vez, cada uma com resposta recomendada (item 1), aplicando FATO x DECISÃO (item 2), percorrendo a árvore de decisão por ordem de dependência (nunca perguntar B se B depende de A em aberto).
- **Entrada automática:** piso novo. Trivial = 0 perguntas (inalterado). Pequena, Média e Grande = grill.
- **Entrada manual:** `--grill` e gatilhos em linguagem natural ("me grelha", "vai fundo", "pergunta mais").
- **Saída, três portas independentes:**
  1. **Palavra de parada, a qualquer momento:** "chega", "para", "fecha", "basta", "suficiente". Encerra na hora, sem checkpoint e sem confirmação, e vai direto pra destilação.
  2. **Checkpoint a cada 3 perguntas:** o controle de 2 opções que já existe (Fechar e seguir / Mais perguntas).
  3. **Auto-convergência:** quando o agente não tem mais pergunta capaz de mudar o design, ele **declara isso explicitamente** e propõe fechar. Hoje ele nunca declara, apenas para.
- **Escrita inline:** glossário e decisão são gravados no instante em que caem, nunca em lote no fim ("don't batch these up").
- **Gate preservado:** o `HARD-GATE` do brainstorm continua valendo. Parar de responder encerra as PERGUNTAS, não a aprovação do design.

### Bloco 2: Memória do projeto (itens 3 e 4)

**Item 3. Glossário com sinônimos banidos.** Duas camadas:
- **Interna do UP:** glossário dos termos do próprio sistema (fase, onda, plano, gate, evidência, worktree, escape hatch, verificação, DCRV), cada verbete com definição de 1-2 frases e linha `Evitar:` listando os sinônimos proibidos. Vira fonte única citada pelos 12 agentes e 12 workflows, que hoje re-explicam cada conceito com redação própria. **Prioridade sobre a camada de projeto:** é problema de qualidade do produto, não de um projeto.
- **Do projeto:** `.plano/GLOSSARY.md`, criado **preguiçosamente** (só quando o primeiro termo é resolvido, nunca como scaffold vazio), atualizado inline durante o grill. Regra de admissão: só conceito específico do domínio; conceito geral de programação fica de fora. Regra de higiene declarada no próprio arquivo: é glossário e nada mais, zero detalhe de implementação.

**Item 4. Registro de decisão com gate de 3 condições.**
Decisão só vira registro em `.plano/decisoes/NNNN-slug.md` se as **três** forem verdadeiras: (a) difícil de reverter, (b) surpreendente sem contexto, (c) resultado de trade-off real com alternativas genuínas. Faltou uma, não escreve. Formato mínimo: título curto + 1-3 frases (contexto, o que foi decidido, por quê) + **alternativas rejeitadas e o motivo**. Numeração determinística (varre o diretório, pega o maior número, incrementa). Status opcional: proposta / aceita / substituída por NNNN. Criação preguiçosa.

Junto: **`.plano/fora-de-escopo/<conceito>.md`**, base de rejeições com dedup **por conceito de domínio, não por keyword**, lida pelo `up-brainstorm` ANTES de explorar intenção, trazendo à tona "isso parece com fora-de-escopo/X, recusamos porque Y, você ainda pensa assim?".
Duas regras críticas: (a) "já implementado" **não** entra na base, senão envenena o dedup com falsa rejeição; (b) motivo temporário ("agora não dá tempo") não entra, porque adiamento não é rejeição.

### Bloco 3: Honestidade da prova (itens 5 e 6)

**Item 5. Regra anti-tautologia.**
O valor esperado de um teste tem que vir de fonte independente (literal conhecido-bom, exemplo trabalhado, o requisito), nunca recomputado do mesmo jeito que o código computa. Teste que recomputa passa por construção e nunca discorda do código: é o falso-positivo número um de LLM escrevendo teste, e hoje um `evidence=logic:test_pass` pode estar registrando exatamente isso.
Entra em dois lugares: regra dura no `up-tdd` (com par bom/ruim lado a lado, mesmo cenário nos dois lados) e heurística mecânica no `verify-static` (sinaliza quando o bloco de asserção repete a mesma operação da implementação, ou quando o esperado é computado dentro do próprio teste).

**Item 6. Seams pré-acordados.**
Antes de planejar, esboçar as fronteiras públicas onde o teste vai encostar, com as regras: preferir seam existente a seam nova; usar o seam mais alto possível; **o número ideal é um**. Confirmar com o dono. Isso vira campo obrigatório do `PLAN-READY.md` e uma entrada nova no gate: `evidence=seams:confirmed`. O `/up:build` fica **proibido** de inventar seam novo em runtime.
Justificativa: o UP tem TDD por tipo, não tem TDD por lugar. Sem isso o teste morre no primeiro refactor e o gate de evidência vira teatro.

### Bloco 4: Planejamento (itens 7, 8, 9)

**Item 7. Grafo `blocked by` + frontier.**
Cada plano de fase declara suas arestas de bloqueio. A **onda deixa de ser dado primário e passa a ser derivada** do grafo: a fronteira (planos cujos bloqueadores estão todos prontos) é recalculada em runtime, o que degrada naturalmente para sequencial e permite reordenar quando um plano falha ou atrasa. Onda numerada continua existindo como visão, não como verdade.
Superfícies: `phase-plan-index`, `git-map.json`, workflows `plan` e `build`.

**Item 8. Tamanho medido em janela de contexto.**
Critério objetivo para `/up:plan` decidir quebrar uma fase em N planos: cada plano tem que caber numa janela de contexto fresca (alvo declarado: uma sessão de ~100k tokens). Substitui heurística por adjetivo. Vale também para a regra de seams ("o número ideal é um"): número, não adjetivo, porque o modelo cumpre número e negocia adjetivo.

**Item 9. Regra de durabilidade do plano.**
`PLAN-READY.md` e os planos de fase ficam **proibidos** de conter caminho de arquivo e trecho de código, porque envelhecem rápido. Descrevem interfaces, tipos e contratos de comportamento. Exceção única e fechada: snippet vindo de protótipo que codifica uma decisão com mais precisão que a prosa (máquina de estados, reducer, schema, formato de tipo), inlinado só nas partes ricas em decisão e marcado como origem-protótipo.
Peso extra no UP: o `PLAN-READY.md` é feito pra ser portável entre runtimes (planejar no Claude, executar em runtime barato), então é escrito num momento e executado noutro, com o código já mexido.
Junto: campo obrigatório **"Fora de escopo"** em todo plano, para travar gold-plating do `up-executor`. E os templates ganham **exemplo ruim anotado** ao lado do exemplo bom, com o porquê de cada linha ruim ser ruim.

### Bloco 5: Contexto e revisão (itens 10 e 11)

**Item 10. Higiene de contexto prescrita + handoff.**
Deixar de só avisar e passar a prescrever onde cortar:
- Brainstorm + plano + divisão em planos numa **janela ininterrupta**: proibido compactar ou limpar antes do `PLAN-READY.md` existir.
- `/clear` obrigatório **entre** execuções de plano.
- Limiar numérico de zona segura, com a instrução "não empurre degradado, faça handoff".
- Primitiva nova de **handoff**: comprime a conversa num documento enxuto (o fio vivo: o que está em voo, por quê, próximo passo) que uma sessão NOVA lê para continuar. Regras duras: salvar em diretório temporário do SO (nunca versionado, não é mais um artefato pra manter); seção obrigatória de **comandos sugeridos** para a próxima sessão; **referência, nunca cópia** (nada que já está em `PLAN-READY.md`, `SUMMARY`, `approvals.log`, `git-map.json` é repetido, entra por caminho relativo); redigir segredo (chave de API, senha, PII) antes de escrever, porque o resumo vira o prompt do agente novo.
- Distinção documentada em uma linha: **handoff bifurca, compact continua**.
O `up-context-monitor` deixa de emitir só aviso e passa a oferecer a ação.

Aplicação da mesma regra "referência, nunca cópia" ao `STATE.md`: ele carrega o fio vivo e ponteiros, e o detalhe fechado mora no arquivo da fase. Mais a seção obrigatória de **próximo comando sugerido** (`/up:build fase N`, `/up:testar --mobile`), para o roteamento morar no documento e não na memória do dono.

**Item 11. Revisão em dois eixos paralelos, nunca fundidos.**
Hoje o `up-revisor` roda Stage 1 (spec) e Stage 2 (qualidade + OWASP) em sequência **travada**: Stage 2 só roda se Stage 1 passar. Consequência: quando o spec falha, os problemas de qualidade e segurança nunca são descobertos naquela rodada.
Mudança: os dois eixos rodam **em paralelo, em subagentes isolados**, e são reportados lado a lado sob cabeçalhos separados, **proibido fundir ou reordenar achados entre eixos**. O resumo final dá o pior problema **dentro de cada eixo**, nunca um vencedor único, porque essa reordenação é exatamente o que a separação existe pra impedir.
Preservar: Stage 1 continua **cego ao código** (testa como usuário final). Isso é força do UP.
Somar: teto de saída por eixo (ordem de 400 palavras) para forçar priorização; fail-fast do ref e do diff **antes** do fan-out, para ref ruim ou diff vazio falhar barato em vez de falhar dentro de dois subagentes; achado sem âncora não entra (eixo spec cita a linha do requisito, eixo qualidade cita o hunk); e sem spec disponível o eixo spec **pula e reporta ausência** em vez de inventar requisito.

### Bloco 6: Auditoria (item 12)

**Item 12. Auditoria visual e escopada.**
- **Escopo antes da varredura:** subcomando novo de hotspots (arquivos mais tocados nos últimos N commits via `execGit`) alimentando `/up:auditar`. Aprofundar módulo só paga onde a mudança continua caindo. Fallback declarado quando não há hot spot: alargar a rede.
- **Saída em HTML autocontido, gravado no diretório temporário do SO** (fora do repo, não suja working tree nem diff), aberto no navegador, com o caminho absoluto informado.
- **Formato de card fixo** por achado: arquivos, problema em uma frase, solução em uma frase, ganhos em bullets curtos, e **badge ternário de força** (Forte / Vale explorar / Especulativo).
- **Seção "Recomendação principal" obrigatória:** qual atacar primeiro e por quê. Obriga o agente a se comprometer com prioridade em vez de despejar lista plana.
- **Gate duro entre diagnosticar e projetar:** o auditor apresenta os candidatos e PARA, com uma única pergunta de handoff ("qual destes você quer explorar?"). Proibido emendar diagnóstico com design.
- **Teste falsificador antes de emitir sugestão:** critério de eliminação explícito por achado (se remover isto não concentra complexidade nem move métrica, não entra no relatório). Corta a lista genérica de LLM.
- **Rejeição vira memória:** "não" com motivo estrutural gera registro em `.plano/decisoes/` (item 4) cuja função declarada é impedir que auditorias futuras re-sugiram a mesma coisa. Critério de quando NÃO gravar: motivo efêmero ou auto-evidente.

### Bloco 7: Pedaços do wayfinder

**Origem:** não estava no Tier A nem no Tier B. Apareceu na seção "o que eu não copiaria" como três pedaços que valia salvar do `wayfinder`. Proposto como adição e **aprovado pelo dono neste brainstorm**. Nenhum outro bloco depende dele, então ele pode ser a última onda do plano.

Três mecanismos, sem portar a skill:
- **Gate de auto-aborto:** se o grill não revelou pergunta aberta relevante, o `/up:plan` **se declara desnecessário** e diz "isto é `/up:rapido`", em vez de gerar fases. A ferramenta pesada se recusa a rodar quando o problema é leve.
- **Seção "Ainda não especificado"** no `ROADMAP.md`: lugar formal para o que se pressente mas ainda não dá pra especificar. Teste de graduação explícito: **"consigo enunciar a pergunta com precisão agora?"**, não "consigo respondê-la agora?". Fechar uma fase gradua a névoa em fase nova e **limpa** a área graduada. Ataca os dois males do roadmap: fase 7 inventada no dia 1 com detalhe falso, e incerteza que some porque não tinha onde ser escrita.
- **"Fora de escopo" como seção separada** de feito e de a-fazer, com uma linha de porquê, mantida fora do histórico de decisões (que registra só a rota efetivamente andada).

## Não-escopo (YAGNI)

- Nenhum `disable-model-invocation` como doutrina. A auditoria do eixo de invocação das 4 skills (context load pago em todo turno) fica para depois, como passe separado.
- Nenhuma migração de storage para issue tracker. `.plano/` permanece a fonte.
- Nenhum port do `wayfinder`, do `teach`, do `ask-matt` como skill nova, nem do `/up:prototipo`.
- Nenhum corte de sedimento (templates órfãos, poda no-op nos 12 workflows, conversão de negações em positivo). É trabalho real e necessário, mas é passe de refatoração, não feature: entra em briefing próprio.
- Nenhuma mudança em `install.js` nem nos 4 runtimes além do que os artefatos novos exigirem.

## Riscos e decisões abertas pro `/up:plan`

1. **Grill como default pode virar burocracia.** O dono é declaradamente impaciente com processo. A aposta é que "chega" é mais barato que lembrar de pedir "vai fundo". Mitigação a validar no plano: a palavra de parada precisa funcionar **na primeira tentativa e sem confirmação**, senão a aposta se inverte.
2. **Ordem de dependência entre itens.** Item 4 (registro de decisão) e item 3 (glossário) são pré-requisitos do item 13 (grill escreve inline). Item 6 (seams) é pré-requisito do item 5 valer no gate. Item 1 e 2 são pré-requisitos de todo o resto porque mudam o formato de toda pergunta. O plano tem que refletir isso como arestas, não como ordem arbitrária, e isso é o próprio item 7 sendo dogfooded.
3. **Item 7 muda contrato de dado.** Ondas passam a ser derivadas. Precisa decidir se `phase-plan-index` e `git-map.json` ganham campo novo com retrocompatibilidade ou se há migração. Projetos existentes com `.plano/` não podem quebrar.
4. **Item 11 muda o gate de fase.** Rodar os dois eixos em paralelo altera quando e como o `approvals.log` recebe entrada. Definir no plano o que acontece quando o eixo spec falha e o eixo qualidade passa: hoje isso nem é representável.
5. **Item 5 no `verify-static` é heurística, não prova.** Vai gerar falso positivo. Definir no plano se ela bloqueia o gate ou só sinaliza para o `up-revisor` confirmar. Recomendação a validar: sinaliza, não bloqueia.
6. **Tamanho do escopo.** São 13 itens em 7 blocos, tocando skills, references, agentes, workflows, templates e `bin/lib`. É múltiplas fases, não uma. O `/up:plan` deve decompor por bloco e declarar as arestas entre blocos.
7. **Este briefing cita caminhos de arquivo; o plano não pode.** As linhas "Superfícies:" e os fatos verificados nomeiam arquivos de propósito, porque são evidência do estado atual do repo. Ao transcrever para o `PLAN-READY.md`, o `/up:plan` tem que converter isso em contrato de comportamento, conforme o próprio item 9. Se o plano sair com lista de caminhos, o item 9 falhou na primeira aplicação dele mesmo.
8. **Bloco 7 não tem dependentes.** Aprovado, mas como nenhum outro bloco depende dele, é candidato natural a última onda: se o escopo apertar, ele é o corte mais barato.

## Critério de sucesso

Tarefa não-código na maior parte (doutrina, references, templates) com partes de código (`up-tools.cjs`, `verify-static`, `phase-plan-index`, hook do monitor). Prova por tipo:

1. **Grill (smoke):** brainstorm de tarefa Pequena entra em grill automaticamente; cada pergunta chega com recomendação; "chega" encerra na primeira tentativa e o agente destila sem pedir confirmação; o `HARD-GATE` continua exigindo aprovação do design.
2. **Fato x decisão (smoke):** num repo com `.plano/` populado, o brainstorm não pergunta nada que esteja em `STATE.md`, `REQUIREMENTS.md` ou `.plano/codebase/`.
3. **Glossário e decisão (smoke):** nenhum arquivo é criado antes de existir conteúdo real; uma decisão que falha qualquer uma das 3 condições não gera registro; uma que passa gera registro numerado com alternativas rejeitadas.
4. **Fora de escopo (smoke):** propor de novo algo já recusado faz o brainstorm trazer a rejeição anterior à tona antes de explorar.
5. **Anti-tautologia (logic):** teste red-green sobre a heurística do `verify-static`, com par de fixtures (teste tautológico e teste honesto), visto falhar antes de passar.
6. **Seams (smoke):** `PLAN-READY.md` sem campo de seam confirmado não passa no gate; `evidence=seams:confirmed` aparece no `approvals.log`.
7. **Grafo blocked-by (logic):** teste red-green sobre a derivação da fronteira, incluindo o caso de plano que falha e o caso de cadeia linear.
8. **Durabilidade do plano (logic):** teste que rejeita plano contendo caminho de arquivo ou bloco de código fora da exceção de protótipo.
9. **Handoff (smoke):** gera documento no diretório temporário, com seção de comandos sugeridos, sem duplicar conteúdo já em `.plano/`, com segredo redigido.
10. **Revisão em dois eixos (smoke):** rodada onde o eixo spec falha e o eixo qualidade passa produz os dois relatórios lado a lado, sem fusão; ref inválido falha antes do fan-out.
11. **Auditoria (ui):** HTML gerado no temp abre no navegador, com badge de força, recomendação principal e caminho absoluto informado; captura visual como prova.
12. **Sem regressão:** os 7 comandos e os 4 runtimes continuam funcionando; projeto com `.plano/` antigo não quebra.

## Handoff

Estado terminal do brainstorm. Próximo passo: `/up:plan` (gera `.plano/PLAN-READY.md`). Não implementar antes do plano.

Fontes: `mattpocock/skills` (grilling, grill-with-docs, domain-modeling, to-spec, to-tickets, implement, tdd, code-review, triage, wayfinder, prototype, research, handoff, teach, writing-great-skills, codebase-design, improve-codebase-architecture, diagnosing-bugs, setup-matt-pocock-skills, ask-matt) e as páginas correspondentes em aihero.dev.
