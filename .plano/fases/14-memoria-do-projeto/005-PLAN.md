---
phase: 14-memoria-do-projeto
plan: 005
type: feature
autonomous: true
wave: 2
depends_on: ["002"]
requirements: [MEM-03, MEM-04, MEM-10]
files_modified:
  - up/templates/glossary.md
  - up/bin/lib/memoria-termo.cjs
  - up/bin/lib/memoria-termo.test.cjs
  - up/skills/up-brainstorm/SKILL.md
must_haves:
  truths:
    - "O glossário do projeto nasce apenas quando o primeiro termo é resolvido, e nasce já declarando a regra de admissão e a regra de higiene"
    - "Termo de domínio e decisão são gravados no instante em que caem, nunca acumulados para o fim da conversa"
    - "A base de rejeições é consultada antes de explorar a intenção de um pedido novo, e o achado vira pergunta com recomendação e motivo"
  artifacts:
    - path: "up/templates/glossary.md"
      provides: "Cabeçalho do glossário do projeto, fonte única do texto das duas regras"
    - path: "up/bin/lib/memoria-termo.cjs"
      provides: "Criação preguiçosa e escrita inline do glossário do projeto, com as guardas de admissão e higiene"
  key_links:
    - from: "up/skills/up-brainstorm/SKILL.md"
      to: "comandos do espaço memoria"
      via: "doutrina que manda consultar antes de explorar e gravar no instante em que o termo ou a decisão cai"
    - from: "up/bin/lib/memoria-termo.cjs"
      to: "up/templates/glossary.md"
      via: "leitura do template na criação do arquivo, para as duas regras terem um único texto"
---

# Fase 14 Plano 005: Glossário do projeto e doutrina de memória

<objective>
Entregar a camada de projeto da memória: um glossário de domínio que nasce preguiçosamente já declarando as próprias regras, e a doutrina que faz o brainstorm consultar a base de rejeições antes de explorar a intenção e gravar termo e decisão no instante em que caem.
</objective>

**Onda:** 2. Depende do plano 002, que abre o roteador de memória, declara a entrada `termo` e entrega os helpers de caminho e de criação de diretório.

**Bloqueia:** plano 006 (a prova ponta a ponta dos critérios 3 e 4 do briefing).

## Contexto

A camada interna do glossário resolve o vocabulário do produto. Esta resolve o vocabulário do projeto do dono, que é outro problema: termo de domínio some entre sessões e volta com outro nome. A regra de admissão existe para o arquivo não virar dicionário de programação, e a regra de higiene existe para ele não virar documentação de implementação. As duas moram dentro do próprio arquivo, para quem abrir o arquivo saber o que pode entrar sem ler nenhuma doutrina.

A escrita inline é o que separa memória de ata: termo anotado no fim da conversa já perdeu o contexto em que caiu, e decisão anotada no fim vira lista de tudo que foi falado.

@up/bin/lib/memoria.cjs - roteador e helpers, entregues pelo plano 002
@up/bin/lib/memoria-decisao.cjs - contrato do gate das três condições, entregue pelo plano 002
@up/bin/lib/memoria-rejeicoes.cjs - contrato da consulta e da pergunta pronta, entregue pelo plano 003
@up/skills/up-brainstorm/SKILL.md - skill de brainstorm, com tabela de sinais proibidos e tiers de profundidade

## Contrato do glossário do projeto

Arquivo único, em `.plano/GLOSSARY.md`, criado apenas quando o primeiro termo é resolvido.

```
# Glossario do projeto

Regra de admissao: so entra conceito especifico do dominio deste projeto. Conceito geral de
programacao fica de fora.

Regra de higiene: isto e glossario e nada mais. Zero detalhe de implementacao, sem caminho de
arquivo, sem nome de funcao e sem trecho de codigo.

## Termos

### <termo>
**Definicao:** uma a duas frases.
**Evitar:** sinonimos que o projeto nao usa (linha opcional).
```

Os textos são gravados com acentuação correta; a amostra acima está sem acento apenas para não ambiguar o contrato dentro deste plano. O formato de verbete é o mesmo do glossário interno, de propósito: quem sabe ler um sabe ler o outro.

## Tarefas

<task id="1" type="auto">
<files>up/templates/glossary.md (novo)</files>
<contrato>Template do cabeçalho do glossário do projeto. É a fonte única do texto das duas regras: o módulo da tarefa 2 lê este arquivo em vez de repetir o texto no código.</contrato>
<action>
Criar o template com o título, as duas regras em parágrafos próprios e a seção de termos vazia, seguindo o contrato acima. Acrescentar, abaixo da seção de termos, um verbete de exemplo comentado com marcação de comentário de markdown, mostrando o formato de três linhas, para o leitor humano ter o modelo sem que o exemplo seja lido como termo real.

A regra de admissão e a regra de higiene ficam em texto corrido, sem lista, e nomeiam o que fica de fora: conceito geral de programação na primeira, e caminho de arquivo, nome de função e trecho de código na segunda.
</action>
<aceite>O template existe, contém as duas regras nomeadas como regra de admissão e regra de higiene, tem a seção de termos e um exemplo comentado que não é lido como verbete.</aceite>
<prova>smoke: `grep -c "Regra de admiss\|Regra de higiene" up/templates/glossary.md` retorna 2.</prova>
</task>

<task id="2" type="auto">
<files>up/bin/lib/memoria-termo.cjs (novo)</files>
<contrato>Submódulo do espaço `memoria`, ocupando a entrada `termo` declarada pelo plano 002. Exporta `run(cwd, args)` e as funções internas usadas pelo teste. Cria o arquivo do glossário do projeto apenas na primeira gravação bem-sucedida.</contrato>
<action>
Implementar a ação `registrar`, com as flags `--termo`, `--definicao`, `--evitar` (opcional) e `--atualizar` (opcional, sem valor).

Guarda de higiene, aplicada à definição antes de qualquer escrita: recusa quando a definição contém caminho de arquivo (sequência com barra e extensão de arquivo) ou bloco de código cercado por crase tripla. A mensagem cita a regra de higiene do arquivo e explica que detalhe de implementação vai para o plano ou para o código, não para o glossário.

Guarda de admissão, aplicada ao termo: recusa quando o termo, normalizado, está na lista fechada de conceitos gerais de programação declarada no topo do módulo, com pelo menos estes: api, endpoint, cache, callback, componente, commit, branch, deploy, middleware, migration, promise, refactor, teste unitario, token, webhook. A recusa é reversível: a flag `--forcar` com `--justificativa` grava assim mesmo e registra a justificativa como comentário no verbete, porque um termo genérico pode ser termo de domínio em um projeto específico e recusa cega seria pior que a admissão errada.

Criação preguiçosa: o arquivo nasce aqui, e só depois das duas guardas passarem. O cabeçalho vem da leitura do template de glossário dentro do pacote; template ausente faz o módulo usar um cabeçalho embutido equivalente e avisar no retorno, para o comando nunca falhar por falta de template.

Inserção: o verbete entra na seção de termos em ordem alfabética pelo termo, e não no fim do arquivo. Termo já existente recusa, citando a definição atual, a menos que a flag de atualização venha junto, e nesse caso a definição é substituída e o restante do arquivo é preservado.

Retorno: termo, se o arquivo foi criado agora, posição de inserção e total de termos depois da operação.
</action>
<aceite>Com o glossário ausente, uma definição limpa cria o arquivo com as duas regras no cabeçalho e um verbete. Definição com caminho de arquivo falha com código de saída 1 e o arquivo continua inexistente. Termo genérico da lista fechada falha, e falha com justificativa passa. Um segundo termo entra em ordem alfabética.</aceite>
<prova>lógica: teste da tarefa 4, um caso por guarda, um de criação, um de ordem alfabética e um de atualização.</prova>
</task>

<task id="3" type="auto">
<files>up/bin/lib/memoria-termo.cjs</files>
<contrato>Ações de leitura. Nunca criam arquivo nem diretório.</contrato>
<action>
Implementar a ação `listar`: devolve os termos do glossário do projeto com definição e sinônimos evitados, mais um booleano dizendo se o arquivo existe. Arquivo ausente devolve lista vazia e o booleano em falso, com código de saída zero.

Implementar a ação `regras`: devolve o texto das duas regras lido do arquivo do projeto quando ele existe, ou do template quando ainda não existe. Serve para o agente citar a regra de admissão ao dono sem inventar redação própria.
</action>
<aceite>Com o arquivo ausente, `listar` devolve vazio sem criar nada e `regras` devolve o texto vindo do template. Com o arquivo presente, as duas ações leem do arquivo do projeto.</aceite>
<prova>lógica: teste da tarefa 4, casos de arquivo ausente e presente, com checagem de existência depois da chamada.</prova>
</task>

<task id="4" type="auto">
<files>up/bin/lib/memoria-termo.test.cjs (novo)</files>
<contrato>Teste no mesmo padrão dos planos 002, 003 e 004: script por Node, sem framework, contador de aprovados e reprovados, projeto temporário por caso.</contrato>
<action>
Escrever os casos, vistos falhar antes da implementação e passar depois.

Casos de criação preguiçosa: arquivo ausente em `listar` não cria nada; primeira gravação cria o arquivo com o cabeçalho completo; nenhuma gravação recusada cria arquivo.

Casos de guarda de higiene: definição com caminho de arquivo falha; definição com bloco de código falha; definição limpa passa.

Casos de guarda de admissão: termo da lista fechada falha; o mesmo termo com justificativa passa e grava a justificativa.

Casos de conteúdo: cabeçalho contém as duas regras; verbete tem a linha de definição; linha de sinônimos evitados aparece só quando a flag foi passada.

Casos de ordem e atualização: três termos gravados fora de ordem ficam em ordem alfabética no arquivo; termo repetido falha; termo repetido com atualização substitui a definição e preserva os demais verbetes.

Caso de template ausente: com o template renomeado, a gravação continua funcionando com o cabeçalho embutido e o retorno traz o aviso.

Caso de linha de comando: execução real do binário de ferramentas, conferindo código de saída 1 no caso recusado e 0 no caso aceito.
</action>
<aceite>`node up/bin/lib/memoria-termo.test.cjs` imprime a contagem final e sai com código zero. Antes das tarefas 2 e 3, o mesmo comando sai com código diferente de zero, e essa falha é registrada no resumo do plano.</aceite>
<prova>lógica, vermelho e verde: saída do teste falhando antes e passando depois, colada no resumo.</prova>
</task>

<task id="5" type="auto">
<files>up/skills/up-brainstorm/SKILL.md</files>
<contrato>Seção nova na skill de brainstorm, com a consulta à base de rejeições como passo anterior à exploração de intenção. A skill continua com os tiers e o checkpoint de fechamento que já tem; nenhuma seção existente é removida.</contrato>
<action>
Acrescentar uma seção chamada consulta à memória antes de explorar, posicionada antes da seção de profundidade escalada por tamanho, porque ela roda antes de qualquer pergunta.

Conteúdo da seção, em prosa curta.

Primeiro passo de toda rodada, inclusive no tier sem pergunta: consultar a base de rejeições com o pedido do dono, usando a ação de busca do espaço de memória, passando o texto do pedido. Base inexistente devolve vazio e o fluxo segue, sem criar nada.

Achado: apresentar a pergunta pronta que a busca devolve, que já vem com a semelhança citada, o motivo original da recusa e a recomendação com o porquê dela. A pergunta é feita antes de explorar a intenção, e não depois de o design estar montado, porque o custo de descobrir a recusa no fim é o design inteiro.

Resposta do dono: manter a recusa encerra o assunto e a intenção explorada é outra; mudar de ideia segue o fluxo normal, e a mudança vira decisão registrável quando passar no gate das três condições.

Regra de silêncio: sem achado, nada é dito ao dono. A consulta é barata e invisível quando não encontra nada.
</action>
<aceite>A skill contém a seção nova antes da seção de profundidade, cita a ação de busca, descreve os três desfechos (sem achado, achado com recusa mantida, achado com recusa revista) e declara que a consulta acontece antes de explorar a intenção.</aceite>
<prova>smoke: leitura da seção nova e conferência dos três desfechos, com o trecho colado no resumo do plano.</prova>
</task>

<task id="6" type="auto">
<files>up/skills/up-brainstorm/SKILL.md</files>
<contrato>Seção nova de escrita inline da memória, mais duas linhas na tabela de sinais proibidos que já existe na skill.</contrato>
<action>
Acrescentar uma seção chamada memória gravada no instante, depois da seção de checkpoint de fechamento.

Conteúdo da seção, em prosa curta.

Termo de domínio que o dono fixa durante a conversa é gravado na hora, com a ação de registro de termo. Nunca acumular para gravar em lote no fim, porque o lote perde o contexto em que o termo caiu e costuma não acontecer.

Regra de admissão citada em uma linha: só conceito específico do domínio, conceito geral de programação fica de fora. Regra de higiene citada em uma linha: zero detalhe de implementação. As duas moram no próprio arquivo do glossário do projeto e podem ser lidas pela ação de regras.

Decisão que aparece durante a conversa passa pelo gate das três condições, em E lógico: difícil de reverter, surpreendente sem contexto e resultado de trade-off real com alternativas genuínas. Faltou uma, não escreve. Passou nas três, grava na hora, com as alternativas rejeitadas e o motivo de cada uma.

Recusa do dono com motivo estrutural vira registro na base de rejeições, também na hora. Duas coisas nunca entram: item já implementado, que envenena a consulta com falsa rejeição e vai para o documento de estado, e motivo temporário, que é adiamento e vai para as pendências.

Nenhum dos três artefatos é criado vazio, em nenhuma hipótese. Sem conteúdo real, não existe arquivo.

Acrescentar à tabela de sinais proibidos duas linhas novas, no formato das existentes. Uma para a racionalização de anotar tudo no fim da conversa, com a realidade de que o lote perde o contexto e costuma não acontecer. Outra para a racionalização de que a escolha é obviamente importante e merece registro sem checar as três condições, com a realidade de que o gate é conjuntivo e existe justamente para o histórico não virar lista de tudo que foi falado.
</action>
<aceite>A skill contém a seção nova, com a escrita inline de termo, o gate das três condições em E lógico, as duas regras de não-registro na base de rejeições e a proibição de arquivo vazio. A tabela de sinais proibidos ganhou exatamente duas linhas.</aceite>
<prova>smoke: leitura da seção e da tabela, com o trecho colado no resumo do plano.</prova>
</task>

## Critérios de Sucesso

- [ ] O glossário do projeto nasce só na primeira gravação e já traz a regra de admissão e a regra de higiene dentro do arquivo
- [ ] As duas regras têm um único texto, que mora no template e é lido pelo módulo
- [ ] Definição com detalhe de implementação é recusada mecanicamente
- [ ] O brainstorm consulta a base de rejeições antes de explorar a intenção, e cala quando não há achado
- [ ] Termo e decisão são gravados no instante em que caem, e a skill proíbe o lote no fim
- [ ] O gate das três condições está escrito na skill como conjuntivo, com o faltou uma não escreve
- [ ] O teste foi visto falhar antes de passar

## FORA DE ESCOPO

Este plano não faz, e o executor não deve fazer:

- Implementar o modo de questionamento profundo, gatilho de entrada, palavra de parada ou auto-convergência. Isso é a fase 15, e nada aqui pode assumir que ela existe.
- Mudar os tiers de profundidade, o checkpoint de duas opções ou o gate de aprovação de design da skill de brainstorm.
- Editar o roteador de memória, o módulo de decisão, o de rejeições ou o de glossário interno. São dos planos 002, 003 e 004.
- Popular o glossário do projeto deste repositório com termos reais. A fase entrega o mecanismo.
- Registrar termo automaticamente por detecção de repetição de palavra na conversa. A entrada do termo é decisão do agente com o dono, não estatística.
- Tocar a reference de questionamento ou qualquer superfície de pergunta fora da skill de brainstorm. O formato de pergunta é a fase 13.
