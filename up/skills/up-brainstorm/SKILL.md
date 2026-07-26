---
name: up-brainstorm
description: "Use antes de QUALQUER trabalho criativo: criar feature, montar componente, adicionar funcionalidade, mudar comportamento, iniciar projeto ou tarefa. Explora intencao, requisitos e design antes de implementar. Aplica a todo projeto, por mais simples que pareca."
---

# UP Brainstorm

<HARD-GATE>
NAO invoque skill de implementacao, NAO escreva codigo, NAO faca scaffold, NAO tome acao de implementacao ate ter apresentado um design e o usuario ter aprovado. Vale para TODO projeto, independente da simplicidade percebida. O design pode ser curto, mas TEM que ser apresentado e aprovado.
</HARD-GATE>

Anti-padrao combatido: "isso e simples demais pra precisar de design". Mesmo um todo list ou mudanca de config passa pelo processo. O design escala, o gate nao.

## Antes de perguntar (contrato de pergunta)

Carregue `Read $HOME/.claude/up/references/questioning.md` antes da primeira pergunta da rodada e aplique o
bloco `<contrato_de_pergunta>`. Duas regras valem em toda pergunta desta skill, inclusive nas rodadas do
brainstorm full e do modo exploração, que não têm texto literal aqui:

1. **Nenhuma pergunta crua.** Toda pergunta sai com `Pergunta:`, `Recomendo:` e `Porque:`, uma por vez, com a
   opção recomendada em primeiro lugar quando a lista é fechada.
2. **Fato contra decisão.** Antes de perguntar, resolva sozinho pelas seis fontes do protocolo (perfil do
   dono, artefatos de planejamento, mapa do codebase, leitura e busca no código, histórico do repositório,
   configuração e manifesto). O que for descoberto vira anúncio de uma linha. Só sobe escolha com mais de uma
   resposta defensável, ou segredo que só o dono tem.

A pergunta de trilha ("isso é para virar código ou é um documento?") é fato na maioria das vezes: o pedido, a
extensão dos arquivos citados e o estado do projeto já respondem. Só pergunte se as três fontes forem mudas.

## Red flags (racionalizacoes proibidas)

Se voce se pegar pensando uma dessas, PARE. E o sinal de que esta prestes a furar o gate.

| Voce pensa | Realidade |
|------------|-----------|
| "Isso e simples demais pra brainstorm" | O gate nao e opcional. Tier Trivial ja e a saida leve (0 perguntas). Anuncie e siga, mas pelo gate. |
| "Vou so escrever o codigo, depois explico" | Implementar antes de apresentar o design fura o HARD-GATE. Apresente primeiro. |
| "Preciso de mais contexto antes de decidir o tier" | Classifique com `classify-task` AGORA. O tier sai dos sinais (nº arquivos, arquitetura, schema/API/auth), nao do seu humor. |
| "Marco como Trivial pra ir mais rapido" | Se toca schema/API/auth ou >1 subsistema, NAO e Trivial. Rebaixar o tier e furar o gate disfarcado. |
| "O usuario tem pressa, pulo a aprovacao" | Pressa muda a PROFUNDIDADE (tier), nunca remove a aprovacao. Ate Trivial anuncia antes de agir. |
| "Ja sei o que ele quer" | Suposicao nao e aprovacao. Em Pequena+, pergunte a decisao-chave. |
| "Design aprovado, agora vou codar/criar a fundacao" | NAO. Projeto/feature: o estado terminal e `/up:plan`, nunca implementacao direta. Registre BRIEFING/PROJECT, entregue o handoff e PARE. |
| "Vou so deixar o scaffold pronto enquanto isso" | Scaffold E implementacao. Sem `.plano/PLAN-READY.md`, nada de codigo/estrutura. |
| "Vou anotar tudo no fim da conversa" | O lote perde o contexto em que o termo ou a decisão caiu e, na prática, costuma simplesmente não acontecer. |
| "Essa escolha é obviamente importante, já registro" | O gate das três condições é conjuntivo por definição: existe justamente para o histórico não virar lista de tudo que foi falado. |

A unica forma legitima de ir rapido e o tier Trivial, nao furar o gate.

## Consulta à memória antes de explorar

Primeiro passo de toda rodada, inclusive no tier Trivial que não faz pergunta: consultar a base
de rejeições do projeto (espaço de comando `memoria`, submódulo `fora-de-escopo`) com o texto do
pedido do dono, antes de explorar a intenção. Base inexistente devolve vazio e o fluxo segue
normalmente, sem criar nada: a própria consulta nunca cria arquivo.

Sem achado, nada é dito ao dono. Essa é a regra de silêncio: a consulta é barata e invisível
quando não encontra nada.

Achado, apresente a pergunta pronta que a busca devolve, já com a semelhança citada, o motivo
original da recusa e a recomendação com o porquê dela, antes de montar qualquer design. A
pergunta acontece antes de explorar a intenção, não depois do design montado, porque o custo de
descobrir a recusa no fim é o design inteiro.

A resposta do dono decide o desfecho. Manter a recusa encerra o assunto ali, e a intenção
explorada passa a ser outra. Mudar de ideia segue o fluxo normal da rodada, e a mudança vira
decisão registrável quando passar no gate das três condições (ver "Memória gravada no instante",
abaixo).

## Profundidade escalada por tamanho

Classifique a tarefa com o `classify-task` do `up-tools.cjs` (tiers: `simple` / `standard` / `complex`). Heuristica equivalente quando ainda nao ha plano: nº de arquivos provaveis, palavra de arquitetura, toca schema/API/auth.

| Tier | Profundidade |
|------|--------------|
| **Trivial** (1 arquivo, sem decisao de arquitetura) | 0 perguntas. Anuncia em 1 linha o que vai fazer e onde. Executa. |
| **Pequena** (1 subsistema, 1 escolha de design) | 1 pergunta no formato do contrato (ver brainstorm.decisao-chave abaixo) + checkpoint de fechamento + design em 3 frases. Aprova e segue. |
| **Media / Grande** (multi-subsistema, toca schema/API/auth) | Brainstorm full. |

<pergunta id="brainstorm.decisao-chave">
Pergunta: {a única decisão de design que muda o resultado desta tarefa}
Recomendo: {a opção que você escolheria}
Porque: {a evidência: convenção do codebase, decisão já registrada, ou o trade-off que decide}
Opções: {recomendada} | {alternativa} | {alternativa}
</pergunta>

O `classify-task` define o PISO (minimo garantido). O usuario sempre pode SUBIR ou DESCER manualmente (override abaixo). Nunca diminua a profundidade por conta propria; so o usuario rebaixa.

## Override de profundidade (controle do usuario)

O tier automatico e so o default. O usuario manda na profundidade:

| Sinal do usuario | Efeito |
|------------------|--------|
| Palavras "a fundo", "detalhado", "explorar", "pensar junto", "completo", "caprichado" OU flag `--deep` | Sobe pra **full** (ou exploracao, se for ideia crua), ignora o score baixo. |
| Palavras "rapido", "simples", "so faz", "sem perguntas" OU flag `--quick` | Desce pra **trivial** (0 perguntas), mesmo que o score ache complexo. O HARD-GATE continua: anuncia antes de agir. |
| Nada declarado | Usa o tier do `classify-task` (piso automatico). |

Pressa nunca remove o gate; muda so quantas perguntas.

## Checkpoint de fechamento (toda rodada de perguntas)

Regra transversal aos tiers **Pequena**, **full** e **exploracao**. Tier Trivial fica FORA (0 perguntas, so anuncia e segue).

Toda rodada de perguntas termina com um AskUserQuestion de controle com exatamente 2 opcoes. "Fechar e seguir"
encerra as perguntas e avanca pro proximo passo do tier (design em 3 frases, propor abordagens ou destilar a
ideia). "Mais perguntas" abre nova rodada, mais especifica que a anterior, que termina com este mesmo
checkpoint; loop ate o usuario escolher fechar.

<pergunta id="brainstorm.checkpoint">
Pergunta: Fecho a rodada e sigo, ou faço mais perguntas?
Recomendo: {Fechar e seguir | Mais perguntas}
Porque: {quando fecha: "as decisões que mudam o design já foram respondidas, o que resta é detalhe que o plano resolve". Quando abre: nomear a pergunta em aberto que ainda pode mudar o design}
Opções: {recomendada primeiro} | {a outra}
</pergunta>

A recomendação deste checkpoint é **calculada**, nunca fixa: se ainda existe pergunta capaz de mudar o
design, a recomendação é "Mais perguntas" e a linha Porque nomeia qual é a pergunta. Se não existe,
a recomendação é "Fechar e seguir". Não adicione opção de resposta livre: a saída livre nativa já cobre.

## Memória gravada no instante

Termo de domínio que o dono fixa durante a conversa é gravado na hora, com a ação de registro de
termo (espaço de comando `memoria`, submódulo `termo`). Nunca acumular para gravar em lote no fim:
o lote perde o contexto em que o termo caiu e, na prática, costuma simplesmente não acontecer.

A regra de admissão, em uma linha: só entra conceito específico do domínio, conceito geral de
programação fica de fora. A regra de higiene, em uma linha: zero detalhe de implementação. As duas
moram dentro do próprio arquivo do glossário do projeto e podem ser lidas pela ação de regras, sem
que o agente precise inventar a redação.

Decisão que aparece durante a conversa passa pelo gate das três condições, em E lógico: difícil de
reverter, surpreendente sem contexto e resultado de um trade-off real, com alternativas genuínas
rejeitadas. Faltou uma condição, não se escreve nada. Passou nas três, grava na hora, com as
alternativas rejeitadas e o motivo de cada uma.

Recusa do dono com motivo estrutural vira registro na base de rejeições, também na hora. Duas
coisas nunca entram nessa base: item já implementado (envenena a consulta com falsa rejeição e
pertence ao documento de estado) e motivo temporário (é adiamento e pertence às pendências).

Nenhum dos três artefatos (glossário do projeto, registro de decisão, base de rejeições) nasce
vazio, em nenhuma hipótese. Sem conteúdo real, não existe arquivo.

## Modo exploracao (ideia crua, acima do full)

Quando o usuario tem so uma SEMENTE e quer DESCOBRIR o que e (nao validar um design ja pronto). Gatilhos: "tenho uma ideia", "to pensando em", "e se", "me ajuda a pensar", "queria explorar", `--deep` numa ideia vaga.

Diferenca do full: o full valida um design que o usuario ja tem na cabeca; a exploracao ABRE o espaco antes de fechar.

1. **Nao pule pra solucao.** Primeiro entenda o PORQUE: que problema/desejo move a ideia, pra quem, por que agora.
2. **Abra alternativas radicais.** Ofereca 3-5 direcoes bem diferentes (nao variacoes da mesma), incluindo uma obvia, uma ousada e uma "e se fizesse o oposto".
3. **Provoque com "e se".** Tensione premissas: "e se nao precisasse de X?", "e se o publico fosse outro?", "qual a versao 10x menor que ja entrega valor?".
4. **Uma pergunta por vez**, multipla escolha quando der. Vai estreitando do amplo pro especifico. Feche a rodada com o checkpoint de fechamento.
5. So depois do "Fechar e seguir" do checkpoint, **destile** a ideia num paragrafo claro: o que e, pra quem, por que, o diferencial. Confirme com o usuario.
6. So ENTAO transicione pro design (full) ou direto pro `BRIEFING.md`, conforme o tamanho do que emergiu.

A exploracao termina numa ideia destilada e aprovada, que vira BRIEFING. Continua valendo o estado terminal: codigo so depois de `/up:plan`.

## Trilha NAO-codigo (documento, relatorio, analise, conteudo, plano de negocio)

Nem todo trabalho e software. Se a tarefa e produzir um ARTEFATO que nao e codigo (documento, proposta, relatorio, analise, roteiro, estrategia, pesquisa), o fluxo muda:

- **Brainstorm igual** (escala por tier + override + modo exploracao valem). A diferenca e o que vem depois.
- **NAO ha `/up:plan` -> `/up:build` -> worktree/PR.** Sem fases de software, sem TDD-por-tipo, sem GitHub-nativo. Isso e cerimonia de codigo.
- **Apos o design/escopo aprovado:** produza o artefato direto (escreva o documento/analise). Para conteudo do Jonathan (carrossel, aula, post), use as skills dedicadas (`carrossel-*`, `aula-generator`, etc) quando aplicaveis.
- **Verificacao por adequacao, nao por teste:** a prova e "o artefato existe, cobre o que foi pedido, sem placeholder/TBD, e bate com o briefing". Aplica a Lei de Ferro adaptada: nao diga "pronto" sem reler o artefato e conferir contra o escopo combinado.
- **Persistencia leve:** salve o artefato no local certo (vault, pasta do projeto) e registre 1 linha no STATE.md se houver `.plano/`. Sem roadmap.

Como detectar: pedido fala em "documento, proposta, relatorio, analise, texto, roteiro, estrategia, plano, pesquisa" e NAO em codigo/app/feature/sistema. Na duvida, pergunte: "isso e pra virar codigo ou e um documento/analise?".

## Brainstorm full (media/grande)

1. **Explore o contexto** (arquivos, docs, commits recentes).
2. **Companion visual:** se o topico tem questao visual (mockup, layout, comparacao), ofereca em mensagem isolada, sozinha. Jonathan e visual: ofereca por default em UI. Metodo de quando/como oferecer e produzir: ver `visual-companion.md` (mesma pasta).
3. **Perguntas uma por vez.** Multipla escolha preferida. Foco: proposito, restricoes, criterio de sucesso. Se o escopo for multiplos subsistemas independentes, sinalize JA e ajude a decompor em sub-projetos. Feche a rodada com o checkpoint de fechamento antes de avancar pro passo 4.
4. **Proponha 2-3 abordagens** com trade-offs e sua recomendacao.
5. **Apresente o design por SECAO** (arquitetura / componentes / dados / erros / testes), cada secao escalada a complexidade, aprovacao do usuario apos CADA secao.
6. **Escreva BRIEFING.md** e commite (`docs(brief): <topico>`).
7. **Self-review do briefing** (inline, sem re-review): caca placeholders (TBD/TODO), contradicoes, escopo amplo demais, ambiguidade. Corrige.
8. **Gate de revisao humana:** peca ao usuario revisar o BRIEFING.md antes de prosseguir. Espera resposta.

Principios: uma pergunta por vez, multipla escolha, YAGNI sem piedade, sempre alternativas, validacao incremental.

## Estado terminal (regra dura)

Aprovado o design de um PROJETO ou FEATURE, o estado terminal e `/up:plan` (gera `.plano/PLAN-READY.md`). Voce NAO escreve codigo, NAO cria fundacao, NAO faz scaffold a partir daqui: registra os artefatos (BRIEFING/PROJECT), entrega o handoff e PARA. Quem implementa e o `/up:build`, e so depois que existe `PLAN-READY.md`.

Excecao unica: tarefa Trivial pontual declarada via `/up:rapido` pode ir direto, sem plan. Projeto/feature nao-trivial, nunca.
