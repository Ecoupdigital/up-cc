---
phase: 17-planejamento-por-grafo
plan: 17-004
type: feature
autonomous: true
plan_format: 2
wave: 1
depends_on: [003]
requirements: [PLANO-09, PLANO-10, PLANO-11, PLANO-12]
must_haves:
  truths:
    - "Plano fica proibido de conter caminho de arquivo e bloco de código, e a proibição é verificada"
    - "Trecho vindo de protótipo continua permitido quando marcado como tal, e apenas nas partes ricas em decisão"
    - "Todo plano tem campo de fora de escopo preenchido, e campo vazio não conta como preenchido"
    - "Os templates de plano trazem exemplo ruim anotado ao lado do exemplo bom, com o motivo de cada linha ruim"
    - "Plano anterior a este ciclo recebe aviso e não é reprovado"
  artifacts:
    - surface: "Doutrina do agente planejador e templates de plano e de plano pronto"
      provides: "Regra de durabilidade, marcador de origem protótipo, campo de fora de escopo e par de exemplos anotados"
    - surface: "Módulo de checagem de texto de plano"
      provides: "Regra de durabilidade e regra de campo obrigatório, sobre o harness criado no plano 003"
  key_links:
    - from: "Regra de durabilidade"
      to: "Marcador de origem protótipo"
      via: "Exceção única reconhecida pela checagem, que só vale no bloco imediatamente marcado"
    - from: "Operação de validação de plano"
      to: "Regra de durabilidade e regra de campo obrigatório"
      via: "Aplicação das regras no mesmo veredito que já avalia tamanho e número de tarefas"
---

# Fase 17 Plano 004: Durabilidade do plano, fora de escopo e exemplo ruim

**Objetivo:** fazer o plano sobreviver ao tempo entre ser escrito e ser executado. Caminho de arquivo e trecho de código envelhecem rápido, e o plano pronto deste sistema é feito para ser escrito num runtime e executado noutro, com o código já mexido. No lugar deles entram interface, tipo e contrato de comportamento.

**Onda:** 1 (visão de leitura). **Arestas de bloqueio:** plano 003 desta fase. Motivo real: as duas regras deste plano rodam sobre o harness de checagem que o plano 003 cria, com a mesma política de severidade e o mesmo formato de ocorrência. Escrever as duas regras antes do harness duplicaria o harness.

**Estimativa de janela:** plano 3 mil tokens, contexto pré-inlinado 12 mil, leitura dirigida de código 8 mil, escrita e saída 9 mil. Total estimado 32 mil tokens, contra orçamento de 100 mil por plano.

**Requisitos cobertos:** PLANO-09, PLANO-10, PLANO-11, PLANO-12.

## Superfícies tocadas (contrato, sem caminho)

1. **Doutrina do agente planejador**: regra de durabilidade, exceção de protótipo, campo obrigatório de fora de escopo, e o par de exemplos anotados no formato de plano que ela publica.
2. **Template do plano pronto**: campo de fora de escopo e par de exemplos anotados. Alteração aditiva.
3. **Módulo de checagem de texto de plano**, criado no plano 003: duas regras novas.
4. **Operação de validação de plano**: aplica as duas regras novas no mesmo veredito.
5. **Arquivo de teste do módulo de checagem**: ganha os casos deste plano.

## Contexto necessário

Resumo do plano 003 desta fase, doutrina do agente planejador, template do plano pronto, requisitos do projeto (categoria de planejamento por grafo), desenho do sistema (seção de contratos de dado, área de metadados do plano pronto).

## Tarefas

### 1. Regra de durabilidade na doutrina

**O que muda:** a doutrina do agente planejador ganha a regra, com o motivo declarado junto, porque regra sem motivo é negociada.

Texto obrigatório, em contrato:

1. Plano não contém caminho de arquivo e não contém bloco de código.
2. No lugar, o plano descreve interface, tipo e contrato de comportamento: o que a superfície recebe, o que devolve, o que passa a ser verdade depois dela.
3. Nome de contrato público continua permitido, e é o substituto correto do caminho: módulo exportado, interface, comando, rota, subcomando, campo de resposta.
4. O motivo declarado: o plano é escrito num momento e executado noutro, possivelmente noutro runtime, com o código já mexido. Caminho e trecho envelhecem entre os dois momentos, e o executor confia neles.

**Aceite:** a doutrina traz a regra, o substituto e o motivo.

**Prova:** conferência por leitura mais a checagem da tarefa 5 rodando sobre a própria doutrina.

### 2. Exceção de protótipo

**O que muda:** a doutrina declara a exceção única e fechada, e o marcador que a identifica.

Contrato:

1. A exceção vale para trecho vindo de protótipo que codifica uma decisão com mais precisão que a prosa. Os quatro casos citados são máquina de estados, redutor, esquema de dados e formato de tipo.
2. O trecho aparece apenas nas partes ricas em decisão, e não como ilustração de implementação.
3. O trecho traz, na linha imediatamente anterior, o marcador de origem protótipo. Sem o marcador na linha imediatamente anterior, o trecho é violação.
4. A exceção não se estende a caminho de arquivo. Caminho continua proibido dentro do trecho marcado.

**Aceite:** a doutrina declara os quatro casos, a posição do marcador e o limite da exceção.

**Prova:** lógica, na tarefa 6, com o caso do bloco marcado e o caso do bloco sem marcador.

### 3. Campo obrigatório de fora de escopo

**O que muda:** todo plano e o plano pronto passam a ter seção obrigatória de fora de escopo.

Contrato:

1. A seção tem título fixo e aparece uma vez por plano.
2. A seção tem pelo menos um item, e cada item traz uma linha de motivo.
3. Quando não há nada fora de escopo, o item é a frase padrão declarada na doutrina, dizendo que nada foi declarado fora de escopo neste plano. Seção vazia não conta como preenchida, porque campo vazio passa na conferência e mata a função do campo.
4. A função declarada do campo é travar acréscimo não pedido durante a execução.

**Aceite:** plano sem a seção é reprovado quando declara o formato deste ciclo. Plano com a seção vazia também é reprovado. Plano anterior ao ciclo recebe aviso.

**Prova:** lógica, na tarefa 6.

### 4. Templates de plano com exemplo ruim anotado

**O que muda:** o formato de plano publicado pela doutrina e o template do plano pronto passam a trazer, lado a lado, o exemplo bom e o exemplo ruim do mesmo trecho, com uma anotação por linha ruim explicando por que ela é ruim.

Contrato:

1. Os dois exemplos descrevem o mesmo cenário, para que a comparação seja honesta.
2. O exemplo ruim vem marcado com o marcador de exemplo ruim, o mesmo que a regra de adjetivo do plano 003 desta fase já reconhece, para que a checagem não acuse o próprio exemplo.
3. Cada linha ruim traz o motivo na própria linha, e não num parágrafo depois.
4. Os pares cobrem no mínimo: tarefa descrita por caminho de arquivo contra tarefa descrita por contrato público, critério de aceite por adjetivo contra critério em número, e fora de escopo vazio contra fora de escopo com motivo.
5. O campo de artefato do formato de plano deixa de ser nomeado por caminho e passa a ser nomeado por superfície, que é o contrato público tocado. É a mesma troca que a regra de durabilidade exige do corpo do plano, aplicada aos metadados.

**Aceite:** os três pares existem nos dois lugares, com anotação por linha ruim, e o campo de artefato passa a pedir superfície.

**Prova:** conferência por leitura, mais a checagem rodando sobre os próprios templates sem acusar os exemplos marcados.

### 5. Regra de durabilidade no harness

**O que muda:** segunda regra do harness criado no plano 003.

Contrato de detecção:

1. **Caminho de arquivo:** sequência sem espaço que contenha ao menos uma barra e um segmento com extensão de arquivo, ou que comece por ponto e barra, ou por til e barra, ou por barra. Endereço de rede com esquema de protocolo não é caminho de arquivo e não é ocorrência, porque referência externa não envelhece com o código.
2. **Bloco de código:** bloco cercado por três crases. Trecho entre crases simples não é ocorrência, porque nome de contrato público entre crases é nome, e não código.
3. **Exceção:** bloco cercado imediatamente precedido pelo marcador de origem protótipo não é ocorrência. Caminho de arquivo dentro do bloco marcado continua sendo ocorrência.
4. **Exemplo ruim:** trecho dentro de exemplo marcado como exemplo ruim não é ocorrência.
5. A ocorrência traz número da linha, trecho recortado e identificador da regra, no mesmo formato das ocorrências do plano 003.
6. A política de severidade é a mesma do plano 003: reprovação para alvo que declara o formato deste ciclo, aviso para alvo que não declara.

**Aceite:** as quatro situações de detecção e as duas de exceção se comportam como descrito.

**Prova:** lógica, vermelho e verde, na tarefa 6.

### 6. Teste vermelho e verde

**O que muda:** o arquivo de teste do módulo de checagem ganha os casos deste plano, escritos antes da implementação e vistos falhar.

Casos obrigatórios:

1. Plano com caminho de arquivo no corpo: ocorrência.
2. Plano com endereço de rede: sem ocorrência.
3. Plano com bloco cercado: ocorrência.
4. Plano com bloco cercado precedido pelo marcador de origem protótipo: sem ocorrência.
5. Plano com bloco marcado como protótipo contendo caminho de arquivo: ocorrência, apontando o caminho e não o bloco.
6. Plano com nome de contrato entre crases simples: sem ocorrência.
7. Plano sem seção de fora de escopo: ocorrência.
8. Plano com seção de fora de escopo vazia: ocorrência.
9. Plano com seção de fora de escopo preenchida com a frase padrão: sem ocorrência.
10. Plano limpo, sem caminho, sem bloco, com fora de escopo: veredito de aprovação.
11. Plano sem declaração de formato deste ciclo, violando tudo: aviso em todas as ocorrências, veredito sem reprovação.
12. Marcador de exemplo ruim em volta de um trecho que violaria as duas regras: sem ocorrência.

**Aceite:** o arquivo roda por invocação direta do interpretador, todos os casos passam depois da implementação, e pelo menos os casos 1, 3, 4, 7 e 11 foram vistos falhar antes dela. A saída do vermelho fica registrada no resumo do plano.

**Prova:** lógica, vermelho e verde.

### 7. Ligação com a validação de plano

**O que muda:** a operação de validação de plano passa a aplicar as duas regras novas no mesmo veredito em que já avalia tamanho, número de tarefas e presença de critério de verificação.

Contrato:

1. As ocorrências entram na lista de problemas já devolvida hoje, com identificador de regra próprio, sem alterar a forma da resposta.
2. Ocorrência de severidade aviso não derruba o veredito, e aparece numa coleção separada de avisos.
3. A sugestão de correção de cada regra é uma frase, e diz o que colocar no lugar, e não apenas o que remover.

**Aceite:** rodar a operação sobre um plano com caminho de arquivo reprova, e sobre um plano anterior ao ciclo com o mesmo defeito apenas avisa.

**Prova:** lógica, na tarefa 6, mais execução da operação sobre os planos desta fase, registrada no resumo do plano.

### 8. Autoaplicação

**O que muda:** nada de código. É a conferência de que a regra vale para quem a escreveu.

Contrato: a operação de validação de plano roda sobre os cinco planos desta fase. Todos passam sem ocorrência de caminho, sem ocorrência de bloco e com seção de fora de escopo preenchida.

**Aceite:** os cinco planos desta fase passam. Se algum não passar, ele é corrigido antes do fechamento do plano, e a correção aparece no resumo.

**Prova:** execução registrada no resumo do plano.

## Critério de aceite do plano

1. A doutrina declara a proibição de caminho e de bloco, o substituto e o motivo.
2. A exceção de protótipo existe, vale só no bloco imediatamente marcado, e não cobre caminho de arquivo.
3. Todo plano gerado a partir deste ciclo traz seção de fora de escopo preenchida, e seção vazia reprova.
4. Os templates de plano e do plano pronto trazem os três pares de exemplo bom e ruim, com motivo por linha ruim.
5. O campo de artefato do formato de plano pede superfície, e não caminho.
6. Os doze casos de teste passam, e o vermelho de cinco deles está registrado.
7. Plano anterior a este ciclo recebe aviso e não reprovação.
8. Os cinco planos desta fase passam na própria regra.
9. Os sete comandos continuam funcionando e projeto anterior a este ciclo continua funcionando sem migração.

## Tipo de prova

Lógica, vermelho e verde.

## Fora de escopo

1. Remover o sedimento de papéis removidos na versão anterior que ainda aparece no template do plano pronto. Esta fase toca o template só para acrescentar o campo de fora de escopo e o par de exemplos. O sedimento tem passe próprio, com briefing próprio, e misturar os dois esconderia a mudança real dentro de um diff grande.
2. Reescrever plano já gravado para tirar caminho e bloco. Plano antigo recebe aviso, e reescrever histórico de planejamento apagaria o registro do que foi realmente pedido na época.
3. Aplicar a regra ao briefing, ao desenho do sistema e ao mapa do codebase. Esses documentos citam caminho de propósito, porque são fotografia do estado do repositório, e a regra é sobre plano.
4. Regra anti tautologia e campo de fronteiras confirmadas. São da fase irmã de honestidade da prova.
5. Detecção de caminho por consulta ao sistema de arquivos, conferindo se o caminho existe. A regra é sintática, e consultar disco tornaria o resultado dependente da máquina que roda a checagem.

## Colisões conhecidas

1. O plano 003 desta fase cria o harness e a primeira regra, e fecha antes deste por aresta declarada. Não há escrita concorrente no módulo de checagem.
2. A fase irmã de honestidade da prova acrescenta o campo de fronteiras confirmadas ao template do plano pronto e aplica a mesma política de aviso para plano anterior ao ciclo. As duas alterações no template são aditivas e em seções diferentes. A política de severidade é a mesma por decisão, e não por coincidência, e a implementação daqui não substitui a de lá.

## Decisões registradas

**Decisão 1. Nome de contrato entre crases simples continua permitido.** Alternativa rejeitada: proibir qualquer marcação de código, inclusive crase simples. Rejeitada porque o substituto do caminho é justamente o nome do contrato público, e proibir de nomeá-lo deixaria o plano sem como apontar para nada.

**Decisão 2. Endereço de rede não é caminho de arquivo.** Alternativa rejeitada: tratar qualquer sequência com barra como caminho. Rejeitada porque referência externa não envelhece junto com o código do projeto, e a regra existe contra o envelhecimento.

**Decisão 3. A checagem é sintática e não consulta o disco.** Alternativa rejeitada: confirmar se o caminho citado existe antes de acusar. Rejeitada porque o plano pode ser validado noutra máquina e noutro momento, e uma checagem que depende do estado do disco é exatamente o tipo de coisa que a regra de durabilidade combate.
