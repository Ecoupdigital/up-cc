---
phase: 14-memoria-do-projeto
plan: 003
type: feature
autonomous: true
wave: 2
depends_on: ["002"]
requirements: [MEM-03, MEM-09, MEM-10, MEM-11, MEM-12]
files_modified:
  - up/bin/lib/memoria-rejeicoes.cjs
  - up/bin/lib/memoria-rejeicoes.test.cjs
must_haves:
  truths:
    - "Propor de novo um conceito já recusado devolve a rejeição anterior, com o motivo original e a pergunta pronta para o dono"
    - "Compartilhar uma única palavra com um conceito recusado não é semelhança: o casamento é por conceito de domínio"
    - "Item já implementado e motivo temporário são recusados na entrada e não entram na base"
    - "Nenhum diretório de rejeições é criado antes da primeira rejeição estrutural aceita"
  artifacts:
    - path: "up/bin/lib/memoria-rejeicoes.cjs"
      provides: "Registro, consulta por conceito de domínio e as duas guardas de admissão da base de rejeições"
    - path: "up/bin/lib/memoria-rejeicoes.test.cjs"
      provides: "Prova vermelho e verde das guardas, da criação preguiçosa e do casamento por conceito"
  key_links:
    - from: "up/bin/lib/memoria.cjs"
      to: "up/bin/lib/memoria-rejeicoes.cjs"
      via: "entrada fora-de-escopo do mapa de submódulos, já declarada pelo plano 002"
---

# Fase 14 Plano 003: Base de rejeições por conceito de domínio

<objective>
Dar ao projeto memória do que já foi recusado, indexada por conceito de domínio e não por palavra-chave, consultável antes de explorar a intenção de um pedido novo. Fechar as duas portas que envenenariam essa base: item já implementado e adiamento por falta de tempo.
</objective>

**Onda:** 2. Depende do plano 002, que abre o roteador de memória e declara a entrada `fora-de-escopo`.

**Bloqueia:** plano 005 (a doutrina de brainstorm chama estes comandos) e plano 006 (a prova ponta a ponta do critério 4 do briefing).

## Contexto

Depois de uma limpeza de contexto, o agente repropõe o que o dono já vetou, porque nada guarda a recusa. A base de rejeições resolve isso, mas só se o casamento for por conceito: dedup por palavra-chave produz falso positivo em série (todo pedido que fala em painel casaria com qualquer painel recusado) e o dono aprende a ignorar o aviso.

Este plano não toca o roteador nem nenhum arquivo do plano 002 ou do plano 004. Cria dois arquivos próprios e ocupa a entrada que o plano 002 já deixou declarada.

@up/bin/lib/memoria.cjs - roteador e helpers compartilhados, entregues pelo plano 002
@up/bin/lib/memoria-decisao.cjs - referência de estilo do submódulo irmão
@up/bin/lib/github.test.cjs - padrão de teste do lado UP

## Contrato do arquivo de rejeição

Um arquivo por conceito, em `.plano/fora-de-escopo/<conceito>.md`, onde o conceito é slug em minúsculas.

```
---
conceito: painel-de-metricas-em-tempo-real
titulo: Painel de metricas em tempo real
aliases:
  - dashboard ao vivo
  - metricas em tempo real
registrado_em: 2026-07-25
tipo_motivo: estrutural
---

# <titulo>

## Motivo da recusa
<motivo, uma a tres frases>

## O que faria isso voltar a mesa
<gatilho declarado pelo dono, ou a frase de que nenhum gatilho foi declarado>
```

Os cabeçalhos do corpo são gravados com acentuação correta; a amostra acima está sem acento apenas para não ambiguar o contrato dentro deste plano. O campo de tipo de motivo aceita um único valor, `estrutural`, porque os outros dois tipos não entram na base.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/memoria-rejeicoes.cjs (novo)</files>
<contrato>Submódulo do espaço `memoria`, exportando `run(cwd, args)` e as funções internas usadas pelo teste. Usa os helpers de caminho, leitura de flag e criação de diretório entregues pelo plano 002. Ação de leitura nunca cria diretório.</contrato>
<action>
Criar o módulo com a base de leitura.

Função `listarRejeicoes(cwd)`: lê o diretório de rejeições; ausente devolve lista vazia. Considera apenas arquivo de markdown. Para cada um, extrai do frontmatter o conceito, o título, a lista de apelidos, a data de registro e o tipo de motivo, e extrai do corpo o texto da seção de motivo da recusa. Devolve lista ordenada por conceito.

Função `normalizar(texto)`: minúsculas, remoção de acento por decomposição, troca de tudo que não é letra ou dígito por espaço, colapso de espaços. É a função usada por toda comparação do módulo, e o teste depende de ela ser determinística.

Constante `PALAVRAS_VAZIAS`: lista fechada de palavras ignoradas na comparação, com pelo menos estas: de, da, do, das, dos, e, ou, um, uma, o, a, os, as, em, no, na, nos, nas, para, pra, por, com, sem, que, se, ao, aos, ser, ter, mais, menos, muito, novo, nova.

Função `tokensSignificativos(texto)`: normaliza, quebra por espaço, descarta palavra vazia e descarta token com menos de quatro caracteres. Devolve lista sem repetição.

Ação `listar`: devolve a lista de conceitos com título, data e tipo de motivo, mais um booleano dizendo se a base existe.
</action>
<aceite>Com a base ausente, `listar` devolve lista vazia, o booleano em falso e nenhum diretório é criado. Com dois arquivos gravados à mão, devolve os dois com conceito, título, apelidos e motivo lidos corretamente.</aceite>
<prova>lógica: teste da tarefa 6, casos de base ausente e de base com dois conceitos.</prova>
</task>

<task id="2" type="auto">
<files>up/bin/lib/memoria-rejeicoes.cjs</files>
<contrato>Ação `registrar`. As duas guardas de admissão rodam antes de qualquer escrita, e a base só nasce quando uma rejeição estrutural passa.</contrato>
<action>
Implementar a ação `registrar`, com as flags `--conceito`, `--titulo`, `--motivo`, `--alias` (repetível) e `--reabre-se` (opcional).

Guarda de item já implementado: se o motivo normalizado contém qualquer marca da lista fechada de implementação, lança exceção. A lista tem pelo menos: `ja implementado`, `ja existe`, `ja foi feito`, `ja esta pronto`, `ja temos`, `ja tem`, `duplicata do que existe`. A mensagem diz que item já implementado não entra na base porque envenena a consulta com falsa rejeição, e aponta o documento de estado como lugar certo desse registro.

Guarda de motivo temporário: se o motivo normalizado contém qualquer marca da lista fechada de adiamento, lança exceção. A lista tem pelo menos: `por enquanto`, `por ora`, `agora nao`, `falta de tempo`, `falta tempo`, `sem tempo`, `nao da tempo`, `mais tarde`, `no futuro`, `quando sobrar`, `fica para depois`, `fica pra depois`, `deixar para depois`, `adiado`, `adiar`, `proxima versao`, `versao 2`. A mensagem diz que adiamento não é rejeição e aponta a seção de pendências do documento de estado.

A palavra solta `depois` não entra em nenhuma das listas, porque aparece em prosa legítima e produziria recusa falsa. As duas listas são fechadas, ficam declaradas no topo do módulo e são as mesmas citadas pela doutrina do plano 005.

Regras de conteúdo: conceito, título e motivo são obrigatórios. O conceito é normalizado para slug. Conceito já existente lança exceção citando o arquivo existente e apontando a ação de apelido como caminho para ampliar o registro.

Escrita: cria o diretório apenas aqui, e apenas depois das duas guardas e das regras de conteúdo passarem. Grava o arquivo no formato do contrato acima, com tipo de motivo estrutural, data corrente, e a seção de retorno preenchida com o texto da flag de reabertura ou com a frase de que nenhum gatilho foi declarado.

Retorno: conceito, caminho relativo do arquivo, quantidade de apelidos e a informação de que a base foi criada agora, quando for o caso.
</action>
<aceite>Motivo com marca de implementação e motivo com marca de adiamento falham com código de saída 1, com mensagem distinta em cada caso, e a base continua inexistente. Motivo estrutural cria a base e o arquivo. Registrar o mesmo conceito duas vezes falha na segunda.</aceite>
<prova>lógica: teste da tarefa 6, um caso por guarda, um caso de sucesso e um caso de conceito repetido.</prova>
</task>

<task id="3" type="auto">
<files>up/bin/lib/memoria-rejeicoes.cjs</files>
<contrato>Ação `alias`, que amplia o vocabulário de um conceito já registrado sem reescrever o motivo.</contrato>
<action>
Implementar a ação `alias`, com as flags `--conceito` e `--alias` (repetível, ao menos uma).

Conceito inexistente lança exceção citando o conceito procurado. Apelido repetido é ignorado em silêncio, sem erro. A escrita altera apenas a lista de apelidos no frontmatter, preservando o corpo do arquivo byte a byte.

Retorno: conceito, lista final de apelidos e quantidade de apelidos acrescentados nesta chamada.
</action>
<aceite>Acrescentar dois apelidos a um conceito existente grava os dois e mantém o corpo idêntico. Acrescentar um apelido que já existe devolve zero acrescentados, sem erro. Conceito inexistente falha com código de saída 1.</aceite>
<prova>lógica: teste da tarefa 6, com comparação do corpo antes e depois.</prova>
</task>

<task id="4" type="auto">
<files>up/bin/lib/memoria-rejeicoes.cjs</files>
<contrato>Ação `buscar`. É a consulta que o brainstorm faz antes de explorar a intenção. O casamento é por conceito de domínio, e uma palavra compartilhada não é semelhança.</contrato>
<action>
Implementar a ação `buscar`, com as flags `--pedido` (obrigatória) e `--limite` (opcional, padrão 3).

Chaves de um conceito: o slug do conceito, o título e cada apelido. Cada chave vira uma lista de tokens significativos e também uma forma normalizada contígua.

Regra de casamento, aplicada por chave. A chave casa quando todos os tokens significativos dela aparecem no pedido normalizado e a chave tem dois ou mais tokens significativos. A chave também casa quando a forma normalizada contígua dela aparece inteira dentro do pedido normalizado. Chave com menos de dois tokens significativos só pode casar pela segunda condição, e é isso que separa casamento por conceito de casamento por palavra-chave.

Pontuação: quantidade de tokens significativos casados na melhor chave. O resultado sai ordenado por pontuação decrescente e, no empate, por conceito em ordem alfabética, cortado no limite.

Retorno por achado: conceito, título, motivo original, data de registro, caminho relativo, chave que casou, pontuação e a pergunta sugerida da tarefa 5. Base ausente devolve lista vazia, o booleano de base inexistente e código de saída zero, sem criar nada.
</action>
<aceite>Com o conceito de painel de métricas em tempo real na base, o pedido que fala em painel de controle do usuário não casa, e o pedido que fala em painel de métricas em tempo real casa. Um apelido de duas palavras casa quando as duas aparecem no pedido, em qualquer ordem. Base ausente devolve lista vazia sem erro.</aceite>
<prova>lógica: teste da tarefa 6, com o par de pedidos que compartilham uma única palavra e o par que compartilha o conceito.</prova>
</task>

<task id="5" type="auto">
<files>up/bin/lib/memoria-rejeicoes.cjs</files>
<contrato>Montagem da pergunta que traz a rejeição à tona. A pergunta chega ao dono com resposta recomendada e motivo da recomendação, no formato de pergunta deste ciclo, e nunca crua.</contrato>
<action>
Implementar a função que monta a pergunta sugerida de um achado, devolvida dentro de cada resultado da busca.

Estrutura da pergunta, em três partes emendadas em um texto só. Primeira parte: o que o pedido novo parece, citando o título do conceito e a data da recusa. Segunda parte: o motivo original, em uma frase, tirado da seção de motivo da recusa. Terceira parte: a recomendação com o porquê dela, seguida da pergunta ao dono sobre manter ou revisar a recusa.

A recomendação padrão é manter a recusa, e o porquê declarado é que o motivo original é estrutural e o pedido novo não trouxe fato que o contradiga. Quando o arquivo de rejeição declara um gatilho de reabertura, a recomendação padrão continua sendo manter, mas o texto acrescenta o gatilho declarado, para o dono conferir se ele já aconteceu.

O módulo devolve a pergunta pronta como texto; quem decide o momento de fazê-la é a doutrina do plano 005.
</action>
<aceite>Todo achado da busca traz uma pergunta com as três partes: semelhança citada, motivo original e recomendação com porquê seguida da pergunta ao dono. Achado cujo arquivo declara gatilho de reabertura traz o gatilho no texto.</aceite>
<prova>lógica: teste da tarefa 6, conferindo as três partes no texto devolvido, com e sem gatilho declarado.</prova>
</task>

<task id="6" type="auto">
<files>up/bin/lib/memoria-rejeicoes.test.cjs (novo)</files>
<contrato>Teste no mesmo padrão do plano 002: script executável por Node, sem framework, contador de aprovados e reprovados, código de saída diferente de zero na falha, projeto temporário por caso.</contrato>
<action>
Escrever os casos, vistos falhar antes da implementação e passar depois.

Casos de admissão: um caso por marca de implementação e um por marca de adiamento, ambos falhando e deixando a base inexistente; um caso com a palavra solta que não é marca, provando que ela não produz recusa falsa; um caso estrutural criando a base.

Casos de criação preguiçosa: base ausente em `listar` e em `buscar` devolve vazio sem criar diretório, conferido por checagem de existência depois da chamada.

Casos de casamento por conceito: pedido que compartilha uma única palavra com o conceito não casa; pedido que contém todos os tokens significativos do título casa; pedido que contém um apelido de duas palavras em ordem trocada casa; pedido que contém a forma contígua de um apelido de uma palavra casa.

Casos de apelido: acrescentar apelido novo, apelido repetido e conceito inexistente.

Caso de pergunta sugerida: as três partes presentes, com e sem gatilho de reabertura declarado.

Caso de linha de comando: uma execução real do binário de ferramentas, conferindo código de saída 1 no caso recusado e 0 no caso aceito.
</action>
<aceite>`node up/bin/lib/memoria-rejeicoes.test.cjs` imprime a contagem final e sai com código zero. Antes das tarefas 2 a 5, o mesmo comando sai com código diferente de zero, e essa falha é registrada no resumo do plano.</aceite>
<prova>lógica, vermelho e verde: saída do teste falhando antes e passando depois, colada no resumo.</prova>
</task>

## Critérios de Sucesso

- [ ] A base é indexada por conceito de domínio, com apelidos declarados, e não por palavra-chave
- [ ] Propor de novo um conceito recusado devolve o motivo original e uma pergunta pronta com recomendação e porquê
- [ ] Item já implementado é recusado na entrada, com mensagem que aponta o lugar certo do registro
- [ ] Motivo temporário é recusado na entrada, com mensagem que separa adiamento de rejeição
- [ ] A palavra solta de tempo, em prosa legítima, não produz recusa falsa
- [ ] Nenhum diretório é criado antes da primeira rejeição estrutural aceita
- [ ] O teste foi visto falhar antes de passar

## FORA DE ESCOPO

Este plano não faz, e o executor não deve fazer:

- Editar o roteador de memória, o módulo de decisão ou o arquivo de comandos de ferramentas. Esses arquivos são do plano 002.
- Implementar qualquer coisa do glossário. Isso é dos planos 001 e 004.
- Escrever a doutrina de quando consultar a base e em que ponto do brainstorm. Isso é o plano 005.
- Popular a base de rejeições deste repositório com conteúdo real. A fase entrega o mecanismo.
- Casar por similaridade estatística, distância de edição ou embedding. A regra é determinística e explicável, porque falso positivo silencioso destrói a confiança na consulta.
- Ampliar as duas listas fechadas de marca durante a execução por conta própria. Marca nova entra por decisão registrada, não por palpite do executor.
