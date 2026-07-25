---
phase: 17-planejamento-por-grafo
plan: 17-002
type: feature
autonomous: true
plan_format: 2
wave: 1
depends_on: [001, 003]
requirements: [PLANO-01, PLANO-02, PLANO-03, PLANO-04, PLANO-05, PLANO-06]
must_haves:
  truths:
    - "A ordem de execução dos planos de uma fase sai da dependência declarada, recalculada a cada rodada"
    - "Fase sem dependência declarada continua executando pela onda numerada, sem migração"
    - "Plano que falha sai da fronteira, mantém bloqueado quem depende dele, e não impede os demais"
    - "Cadeia totalmente sequencial degrada sozinha, sem caso especial no motor"
    - "A onda numerada continua sendo devolvida como visão de leitura, ao lado da onda derivada"
  artifacts:
    - surface: "Biblioteca de planos, função de derivação de fronteira"
      provides: "Cálculo puro da fronteira, da onda derivada, dos bloqueados, do ciclo e das arestas pendentes"
    - surface: "Subcomando de índice de planos da fase"
      provides: "Fronteira, modo de ordenação e estado por plano, em campos aditivos, aceitando a lista de planos falhos"
    - surface: "Motor de execução de fase"
      provides: "Laço de fronteira no lugar do laço de ondas fixas"
  key_links:
    - from: "Motor de execução de fase"
      to: "Subcomando de índice de planos da fase"
      via: "Pedido da fronteira a cada rodada, informando os planos já falhos"
    - from: "Derivação de fronteira"
      to: "Canonicalização de identificador"
      via: "Normalização da aresta declarada antes de resolver o bloqueador"
---

# Fase 17 Plano 002: Grafo de bloqueio e fronteira derivada

**Objetivo:** trocar a onda numerada por dependência declarada como verdade da ordem de execução. A fronteira, que é o conjunto de planos cujos bloqueadores estão todos prontos, passa a ser recalculada durante a execução. A onda continua existindo como visão de leitura.

**Onda:** 1 (visão de leitura). **Arestas de bloqueio:** planos 001 e 003 desta fase. Motivos reais, e não ordem arbitrária. O 001: a fronteira é derivada do inventário da fase, e o inventário só enxerga todos os planos depois da correção do 001, então derivar fronteira sobre inventário cego produziria fronteira cega. O 003: a contagem de tarefas que este plano corrige no índice passa a ser a mesma contagem exportada pelo módulo de checagem criado no 003, e escrever duas contagens seria repetir o defeito que o 001 acabou de eliminar.

**Estimativa de janela:** plano 3 mil tokens, contexto pré-inlinado 12 mil, leitura dirigida de código 16 mil, escrita e saída 10 mil. Total estimado 41 mil tokens, contra orçamento de 100 mil por plano.

**Requisitos cobertos:** PLANO-01, PLANO-02, PLANO-03, PLANO-04, PLANO-05, PLANO-06.

## Superfícies tocadas (contrato, sem caminho)

1. **Biblioteca de planos**, criada no plano 001, ganha a derivação de fronteira como função pura exportada.
2. **Subcomando de índice de planos da fase**: campos aditivos e um parâmetro novo de planos falhos.
3. **Motor de execução de fase**: o laço que hoje itera ondas em ordem crescente vira laço de fronteira.
4. **Doutrina do agente planejador**: a dependência declarada passa a ser descrita como a verdade, e a onda como visão derivada.
5. **Arquivo de teste da biblioteca de planos**: ganha os casos de fronteira.

## Contexto necessário

Resumos dos planos 001 e 003 desta fase, desenho do sistema (seção de contratos de dado, índice de planos da fase e mapa por fase), requisitos do projeto (categoria de planejamento por grafo), mapa de convenções do codebase.

## Tarefas

### 1. A aresta declarada

**O que muda:** o campo de dependência que já existe hoje na área de metadados do plano, e que hoje nenhum consumidor lê, passa a ser o dado primário da ordem de execução. Nenhum campo novo de aresta é criado.

Contrato:

1. O valor é uma lista de identificadores de plano da mesma fase. Lista ausente e lista vazia significam a mesma coisa: nenhuma aresta declarada.
2. Cada item é normalizado pela canonicalização do plano 001 antes de resolver. Isso faz o identificador composto com o número da fase, já gravado em plano antigo deste repositório, resolver contra o identificador simples devolvido pelo inventário.
3. Aresta que não resolve para nenhum plano da mesma fase não bloqueia, e é reportada como aresta pendente com o texto original. Bloquear por nome irresolúvel travaria projeto já gravado, que é exatamente o que a compatibilidade proíbe.
4. Aresta de um plano para ele mesmo é descartada e reportada como aresta pendente.

**Aceite:** um plano que declara dependência na forma composta resolve contra o plano correspondente da mesma fase. Um plano que declara dependência de nome inexistente não trava a fase e aparece na lista de arestas pendentes.

**Prova:** lógica, na tarefa 7.

### 2. Estado do plano

**O que muda:** a derivação passa a raciocinar sobre três estados, e não sobre presença de arquivo apenas.

1. Pronto: o plano tem resumo pareado, conforme o pareamento do plano 001.
2. Falho: o identificador do plano consta na lista de falhos informada por quem chama. Não há estado falho persistido em disco.
3. Pendente: nem pronto nem falho.

**Aceite:** a mesma fase, chamada com e sem lista de falhos, devolve fronteiras diferentes e coerentes com a lista informada.

**Prova:** lógica, na tarefa 7.

### 3. Derivação da fronteira

**O que muda:** função pura exportada pela biblioteca de planos. Recebe o inventário da fase, o pareamento, as arestas normalizadas, a onda declarada de cada plano e a lista de falhos. Devolve fronteira, bloqueados, arestas pendentes, ciclo, onda derivada por plano e modo de ordenação.

Regras, nesta ordem:

1. **Modo de ordenação.** Se nenhum plano da fase declara aresta, o modo é onda. Se todos declaram, o modo é aresta. Se uns declaram e outros não, o modo é misto.
2. **Modo aresta.** A fronteira é o conjunto de planos pendentes cujos bloqueadores resolvidos estão todos prontos.
3. **Modo onda.** A fronteira é o conjunto de planos pendentes da menor onda declarada que ainda tenha plano pendente. Isso reproduz exatamente a ordem que o sistema executa hoje, e é a degradação exigida para projeto planejado antes deste ciclo.
4. **Modo misto.** Plano que declara aresta usa a regra 2. Plano que não declara herda como bloqueadores todos os planos de onda declarada estritamente menor que a dele. Assim a leitura antiga continua valendo dentro do mesmo conjunto, sem inventar dependência entre irmãos da mesma onda.
5. **Falha.** Plano falho nunca entra na fronteira, e quem depende dele, direta ou transitivamente, entra na coleção de bloqueados com o motivo apontando o falho. Os demais pendentes cujos bloqueadores estão prontos continuam na fronteira. Nenhuma reordenação manual é necessária.
6. **Ciclo.** Se restam pendentes, nenhum falho os bloqueia e a fronteira sai vazia, existe ciclo. A resposta traz a coleção de planos envolvidos, e a fronteira permanece vazia. Nunca há laço infinito nem escolha arbitrária de desempate.
7. **Onda derivada.** Por plano, é o comprimento do caminho de bloqueio mais longo que chega até ele, contado em número de arestas, começando em zero para plano sem bloqueador. No modo onda, a onda derivada é igual à onda declarada, para que a visão não mude em projeto antigo.
8. **Fase concluída.** Sem pendente e sem falho, a fronteira é vazia e a resposta declara a fase esgotada. Fronteira vazia por conclusão e fronteira vazia por ciclo são distinguíveis por campos diferentes.

**Aceite:** cada uma das oito regras tem pelo menos um caso no teste da tarefa 7.

**Prova:** lógica, vermelho e verde.

### 4. Índice de planos da fase publicando a fronteira

**O que muda:** o subcomando de índice de planos da fase passa a devolver a fronteira, sem perder nada do que devolve hoje.

Contrato:

1. Campos existentes preservados em nome e significado, inclusive o mapa de onda para lista de identificadores e a lista de incompletos. Consumidor antigo continua funcionando sem alteração.
2. Campos acrescentados no topo da resposta: fronteira, bloqueados com motivo, arestas pendentes, ciclo, modo de ordenação e indicador de fase esgotada.
3. Campos acrescentados por plano: arestas normalizadas, onda derivada e estado.
3.1. A onda declarada passa a preservar o valor zero. Fato verificado por execução no planejamento desta fase: um plano que declara onda zero é reportado pelo índice como onda um, por conversão que trata zero como ausência de valor. O efeito é grave e silencioso, porque a onda zero é a convenção de infraestrutura do produto: hoje a onda zero e a onda um viram a mesma onda, e planos escritos para rodar em sequência rodam em paralelo. Ausência de onda declarada continua assumindo o valor um, e zero declarado vale zero.
3.2. A contagem de tarefas por plano passa a reconhecer título de tarefa escrito em português, consumindo o contador exportado pelo módulo de checagem do plano 003 desta fase. Fato verificado por execução: os cinco planos desta fase são reportados hoje com zero tarefa. Existe uma só contagem no produto, e não duas.
4. Parâmetro novo e opcional que recebe a lista de identificadores de planos falhos. Sem o parâmetro, nenhum plano é considerado falho.
5. Nomes de campo em minúsculas com sublinhado, em inglês, como os campos que já existem na resposta.

**Aceite:** a resposta do índice de uma fase já gravada, sem aresta declarada, traz modo de ordenação igual a onda e fronteira igual aos planos pendentes da menor onda com pendência. A resposta continua trazendo todos os campos antigos. Os cinco planos desta fase passam a ser reportados com a onda que declaram, inclusive a onda zero, e com a contagem de tarefas real.

**Prova:** lógica mais execução sobre as fases reais do repositório.

### 5. Laço de fronteira no motor de execução

**O que muda:** o motor de execução de fase para de iterar ondas em ordem crescente e passa a repetir a rodada seguinte enquanto houver plano pendente.

Contrato da rodada:

1. Pedir a fronteira ao índice, informando os planos já falhos nesta execução.
2. Se a fronteira vier vazia com ciclo declarado, parar a fase e escalar ao dono, sem tentar desempatar sozinho.
3. Se a fronteira vier vazia com fase esgotada, sair do laço.
4. Executar em paralelo os planos da fronteira quando a paralelização está ligada, e um por vez quando está desligada. Continua valendo a barreira: a rodada só termina quando todos os planos dela terminam.
5. Ao fim da rodada, o plano sem resumo entra na lista de falhos da execução depois da política de reexecução já existente. A lista de falhos vive na execução, e não em disco.
6. Recomeçar em 1. Como a fronteira é recalculada, um plano que ficou pronto agora libera quem dependia dele, e um plano que falhou não trava quem não dependia dele.
7. A guarda que confere resumo por plano continua existindo, agora por rodada e por plano da rodada.

**Aceite:** uma fase de três planos em cadeia executa em três rodadas de um plano cada. Uma fase de três planos sem aresta e com a mesma onda executa em uma rodada de três. Uma fase em que o primeiro plano da cadeia falha para a execução dos dependentes dele e mantém a fase viva para os independentes.

**Prova:** lógica, na tarefa 7, sobre a derivação. O texto do motor é conferido por leitura na verificação da fase.

### 6. Onda como visão na doutrina

**O que muda:** a doutrina do agente planejador passa a declarar que a dependência declarada é a verdade da ordem, e que a onda numerada é visão de leitura derivada dela. O planejador continua escrevendo a onda, porque ela é a visão publicada, e passa a escrever a dependência sempre que houver.

Contrato do texto: uma frase define onda como visão derivada da dependência declarada, e uma frase define dependência declarada como o dado primário. As duas frases não contradizem o verbete de onda do glossário interno publicado pela fase irmã, e a conferência entre os dois é feita no plano 005 desta fase.

**Aceite:** a doutrina não contém mais instrução que trate a onda como ordem primária de execução, e passa a instruir a declaração de dependência.

**Prova:** conferência por leitura no plano 005.

### 7. Teste vermelho e verde da fronteira

**O que muda:** o arquivo de teste da biblioteca de planos ganha os casos de fronteira, escritos antes da implementação e vistos falhar.

Casos obrigatórios:

1. **Cadeia linear.** Três planos, cada um bloqueado pelo anterior. A fronteira tem um plano por vez, nas três rodadas, na ordem da cadeia.
2. **Leque.** Três planos sem aresta, todos pendentes, modo aresta ligado por declaração vazia explícita em todos: fronteira com os três.
3. **Plano que falha.** Quatro planos, um bloqueia dois deles e o quarto é independente. Com o primeiro na lista de falhos, a fronteira traz o independente, os dois dependentes aparecem em bloqueados com o motivo apontando o falho, e a fase não é declarada esgotada.
4. **Retomada.** Mesma fase do caso 1, com o primeiro plano já com resumo: a fronteira começa no segundo.
5. **Sem aresta declarada.** Fase gravada como as fases antigas do repositório, só com onda: modo onda, fronteira igual aos pendentes da menor onda com pendência, e onda derivada igual à onda declarada.
6. **Modo misto.** Dois planos declaram aresta e um não declara e está em onda posterior: o que não declara só entra na fronteira depois que os de onda anterior ficam prontos.
7. **Ciclo.** Dois planos que se bloqueiam mutuamente: fronteira vazia, ciclo reportado com os dois, fase não declarada esgotada.
8. **Aresta pendente.** Plano que declara dependência de identificador inexistente: não bloqueia, entra na fronteira, e a aresta aparece na coleção de pendentes.
9. **Aresta em forma composta.** Plano que declara dependência com o número da fase junto do identificador resolve contra o plano correspondente.
10. **Fase esgotada.** Todos com resumo: fronteira vazia, esgotada verdadeira, ciclo vazio.
11. **Onda zero preservada.** Dois planos declarando onda zero e um declarando onda um, nenhum com aresta: a fronteira da primeira rodada traz os dois de onda zero, e não os três. Este caso falha antes da correção, porque hoje os três caem na mesma onda.
12. **Contagem de tarefas em português.** Um plano com sete títulos de tarefa em português é reportado com sete tarefas, e não zero.

**Aceite:** o arquivo de teste roda por invocação direta do interpretador, todos os casos passam depois da implementação, e pelo menos os casos 1, 3, 5, 7 e 11 foram vistos falhar antes dela. A saída do vermelho fica registrada no resumo do plano.

**Prova:** lógica, vermelho e verde.

### 8. Retrocompatibilidade conferida no próprio repositório

**O que muda:** nada de código. É a conferência de que nenhuma fase já gravada mudou de comportamento.

Contrato: para cada fase já gravada no diretório de planejamento deste repositório, a ordem de execução derivada pelo modo onda é igual à ordem que o motor produzia antes desta fase. A conferência registra, por fase, o modo de ordenação, a fronteira inicial e a onda derivada, e compara com o mapa de onda antigo.

**Aceite:** nenhuma fase gravada antes deste ciclo muda de ordem. Toda fase gravada antes deste ciclo aparece em modo onda.

**Prova:** execução do índice sobre as fases reais, com a tabela de antes e depois no resumo do plano.

## Critério de aceite do plano

1. A fronteira é recalculada a cada rodada a partir da dependência declarada, e o motor não itera mais onda fixa.
2. Cadeia linear degrada para sequencial sem caso especial no motor.
3. Plano falho não trava plano independente, e quem depende dele fica bloqueado com motivo.
4. Fase sem aresta declarada executa pela onda numerada, com a mesma ordem de antes.
5. A onda numerada continua na resposta, ao lado da onda derivada, e nenhum campo antigo sumiu, e a onda zero declarada deixa de ser reportada como onda um.
6. Ciclo é reportado, e a execução para e escala em vez de desempatar sozinha.
7. Os doze casos de teste passam, e o vermelho de cinco deles está registrado.
8. Os sete comandos continuam funcionando e projeto anterior a este ciclo continua executando sem migração.

## Tipo de prova

Lógica, vermelho e verde.

## Fora de escopo

1. Campo novo no mapa por fase para guardar estado de fronteira. A decisão desta fase é não persistir estado de fronteira, porque o único consumidor é o laço da própria execução e persistir criaria uma segunda fonte de verdade ao lado dos resumos em disco.
2. Aresta entre planos de fases diferentes. A dependência entre fases mora no roadmap, e misturar os dois níveis criaria duas gramáticas para a mesma palavra.
3. Reescrever plano já gravado para acrescentar aresta. A degradação existe justamente para dispensar migração.
4. Sedimento de papéis removidos no template do plano pronto. Passe próprio, com briefing próprio.
5. Espelho da fronteira no quadro externo. O quadro continua recebendo status por fase, e não por plano.

## Colisões conhecidas

Os planos 001 e 003 desta fase fecham antes deste por aresta declarada, então não há escrita concorrente. O 001 escreve na biblioteca de planos, que este plano estende. O 003 escreve no módulo de checagem, do qual este plano apenas lê o contador de tarefas. O 004 escreve no mesmo módulo de checagem que o 003, depois dele, e não toca a biblioteca de planos.

## Decisões registradas

**Decisão 1. Reusar o campo de dependência que já existe, em vez de criar campo novo de aresta.** Alternativas rejeitadas: (a) criar um campo com nome novo, rejeitada porque criaria dois nomes para um conceito só, que é exatamente o que o glossário interno da fase irmã proíbe, e obrigaria migração para os planos que já declaram dependência; (b) derivar aresta da lista de arquivos modificados de cada plano, rejeitada porque inferir dependência de sobreposição de arquivo transforma coincidência em contrato e falha em plano que só lê.

**Decisão 2. Estado falho vive na execução, e não em disco.** Alternativa rejeitada: gravar estado de plano falho no mapa por fase. Rejeitada porque criaria estado persistido sem dono claro de limpeza, que envelhece entre execuções e passa a mentir.

**Decisão 3. Aresta irresolúvel não bloqueia.** Alternativa rejeitada: tratar aresta irresolúvel como bloqueio permanente. Rejeitada porque travaria projeto já gravado por causa de um nome antigo, transformando compatibilidade em regressão.

**Decisão 4. Estender o índice existente em vez de criar subcomando novo de fronteira.** Alternativa rejeitada: subcomando próprio. Rejeitada porque a fronteira precisa exatamente dos dados que o índice já carrega, e duas portas para o mesmo inventário voltariam a divergir, que é a origem do defeito consertado no plano 001.
