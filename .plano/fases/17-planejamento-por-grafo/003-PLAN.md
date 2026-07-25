---
phase: 17-planejamento-por-grafo
plan: 17-003
type: feature
autonomous: true
plan_format: 2
wave: 0
depends_on: []
requirements: [PLANO-07, PLANO-08]
must_haves:
  truths:
    - "A decisão de quebrar uma fase em vários planos usa um número de janela declarado, e cada plano registra a estimativa que usou"
    - "Existe operação determinística que estima a janela de um plano e devolve o percentual do orçamento"
    - "A verificação estática recusa regra de tamanho enunciada apenas por adjetivo, contra a lista fechada declarada na doutrina"
    - "A lista fechada de adjetivos mora na doutrina e é lida de lá pela verificação, sem cópia no código"
  artifacts:
    - surface: "Doutrina do agente planejador e fluxo de planejamento"
      provides: "Orçamento de janela em número, método de estimativa, e lista fechada de adjetivos proibidos em regra de tamanho"
    - surface: "Módulo de checagem de texto de plano (módulo novo de biblioteca)"
      provides: "Harness de checagem sobre um alvo, com ocorrências localizadas e política de aviso contra reprovação"
    - surface: "Operação de validação de plano"
      provides: "Estimativa de janela em tokens, percentual do orçamento, contagem de tarefa em português, e resultado da checagem de adjetivo"
  key_links:
    - from: "Módulo de checagem de texto de plano"
      to: "Doutrina do agente planejador"
      via: "Leitura da lista fechada de adjetivos declarada na doutrina, em vez de lista duplicada no código"
    - from: "Operação de validação de plano"
      to: "Construtor de contexto pré-inlinado"
      via: "Soma de bytes do contexto que o executor recebe, convertida em tokens pelo divisor declarado"
---

# Fase 17 Plano 003: Tamanho medido em janela e regra escrita em número

**Objetivo:** trocar adjetivo por número na decisão de quebrar uma fase em vários planos, e dar à verificação estática o poder de recusar regra de tamanho enunciada só por adjetivo. O modelo cumpre número e negocia adjetivo.

**Onda:** 0 (visão de leitura). **Arestas de bloqueio:** nenhuma. Roda em paralelo com o plano 001 desta fase.

**Estimativa de janela:** plano 3 mil tokens, contexto pré-inlinado 12 mil, leitura dirigida de código 9 mil, escrita e saída 8 mil. Total estimado 32 mil tokens, contra orçamento de 100 mil por plano.

**Requisitos cobertos:** PLANO-07, PLANO-08.

## Números que esta fase fecha

Escritos aqui porque a fase não pode sair com adjetivo no lugar deles.

| Grandeza | Valor | Onde vale |
|---|---|---|
| Orçamento de janela por plano | 100 mil tokens | Decisão de quebrar uma fase em vários planos |
| Divisor de estimativa | 4 caracteres por token | Conversão de bytes em tokens |
| Reserva para leitura de código e saída do executor | 30 mil tokens | Subtraída do orçamento |
| Teto do contexto pré-inlinado de um plano | 70 mil tokens | Gatilho de quebra da fase em mais planos |
| Tamanho máximo do arquivo de plano | 25 kB | Limite já existente, preservado |
| Número máximo de tarefas por plano | 12 | Limite já existente, preservado |
| Número alvo de fronteiras de teste por plano | 1 | Regra da fase irmã de honestidade da prova, citada aqui só como exemplo de regra em número |

## Superfícies tocadas (contrato, sem caminho)

1. **Doutrina do agente planejador**: números acima, método de estimativa e lista fechada de adjetivos.
2. **Fluxo de planejamento**: a instrução de quantos planos gerar por fase deixa de ser faixa solta e passa a citar o critério de janela.
3. **Módulo de checagem de texto de plano**, módulo novo de biblioteca, irmão da biblioteca de planos. Concentra o harness de checagem e a regra de adjetivo. O plano 004 desta fase acrescenta a segunda regra a este mesmo módulo.
4. **Operação de validação de plano**: passa a devolver estimativa, a contar tarefa escrita em português e a rodar a checagem.
5. **Verificação estática**: passa a incluir a checagem de plano no conjunto de conferências.
6. **Arquivo de teste do módulo de checagem**, irmão do teste da biblioteca de planos.

## Contexto necessário

Doutrina do agente planejador, fluxo de planejamento, requisitos do projeto (categoria de planejamento por grafo), mapa de convenções do codebase, desenho do sistema (seção de contratos de dado).

## Tarefas

### 1. Orçamento e método de estimativa na doutrina

**O que muda:** a doutrina do agente planejador ganha a seção de tamanho em número, com os valores da tabela acima e o método de estimativa em quatro parcelas: tamanho do próprio plano, contexto pré-inlinado que o executor recebe, leitura dirigida de código e escrita de saída. As três primeiras parcelas são estimadas por bytes divididos pelo divisor declarado. A quarta é a reserva declarada.

Regra de quebra: quando a estimativa de um plano passa do teto do contexto pré-inlinado, a fase é quebrada em mais planos, e a decisão registra o número que foi estimado.

**Aceite:** a doutrina cita o orçamento em número, o divisor, a reserva e o teto, e não contém mais faixa de quantidade sem critério.

**Prova:** conferência por leitura mais a checagem da tarefa 6 rodando sobre a própria doutrina.

### 2. Registro da estimativa em todo plano

**O que muda:** todo plano gerado a partir deste ciclo traz uma linha de estimativa de janela com as quatro parcelas e o total, e a decisão de quebrar a fase cita o orçamento.

Contrato: a linha é obrigatória, aparece no cabeçalho do plano, e traz número em todas as parcelas. Plano gerado antes deste ciclo não tem a linha, e a ausência vira aviso, nunca reprovação.

**Aceite:** um plano gerado sem a linha de estimativa é reprovado pela checagem quando declara o formato deste ciclo, e apenas avisado quando não declara.

**Prova:** lógica, na tarefa 7.

### 3. Operação determinística de estimativa

**O que muda:** a operação de validação de plano, que hoje já mede bytes e conta tarefas, passa a devolver também a estimativa de janela e o percentual do orçamento.

Contrato:

1. A parcela do próprio plano vem dos bytes do arquivo, já medidos hoje.
2. A parcela de contexto pré-inlinado vem do construtor de contexto que já existe e que já devolve o total de bytes do bloco montado para o executor, com plano, estado, configuração, requisitos da fase e manifesto de doutrina.
3. As duas parcelas viram tokens pelo divisor declarado.
4. A parcela de leitura de código e a de saída entram pela reserva declarada.
5. A resposta traz total estimado, orçamento, percentual e um indicador de estouro do teto.
6. Nenhum limite existente muda de valor, e o veredito atual da operação continua sendo dado pelos mesmos critérios de hoje, mais os critérios novos.
7. A contagem de tarefas passa a reconhecer título de tarefa escrito em português. Fato verificado por execução no planejamento desta fase: plano com título de tarefa em português é contado como zero tarefa em uma das duas contagens que hoje existem no produto, o que torna o limite de 12 tarefas por plano inócuo justamente neste produto, cuja interface é escrita em português. A contagem passa a reconhecer título numerado com ou sem a palavra que antecede o número, nos dois idiomas.
8. A contagem de tarefas vira função exportada do módulo de checagem, e passa a ser a única do produto. O plano 002 desta fase declara aresta de bloqueio para este plano justamente para consumir essa função no subcomando de índice de planos da fase, em vez de manter a segunda contagem que existe lá hoje.

**Aceite:** rodar a operação sobre um plano existente devolve total, percentual e indicador, sem alterar os campos que ela já devolvia. Um plano com sete títulos de tarefa em português passa a contar sete tarefas.

**Prova:** lógica, na tarefa 7.

### 4. Lista fechada de adjetivos na doutrina

**O que muda:** a doutrina declara a lista fechada de adjetivos que não podem sozinhos enunciar tamanho ou quantidade, num bloco de lista com marcador estável, para que a verificação consiga ler a lista de lá.

Lista, com no mínimo estes itens: pequeno, grande, enorme, curto, longo, breve, extenso, razoável, adequado, suficiente, conciso, moderado, mínimo, máximo, alguns, poucos, vários, muitos, rápido, leve, pesado.

Regra declarada junto: enunciado de tamanho ou de quantidade que use um item da lista sem número na mesma frase é proibido. Uso do mesmo adjetivo fora de enunciado de tamanho continua permitido, porque a regra é sobre medir, e não sobre vocabulário.

**Aceite:** a lista está na doutrina, com marcador que permite leitura por programa, e a regra que a acompanha está escrita numa frase.

**Prova:** lógica, na tarefa 7, com o caso que lê a lista da doutrina e confere que um item recém acrescentado passa a valer sem alteração de código.

### 5. Harness de checagem de texto de plano

**O que muda:** módulo novo de biblioteca com o harness que serve às duas regras desta fase, a de adjetivo aqui e a de durabilidade no plano 004.

Contrato:

1. Entrada: o texto do alvo, o nome do alvo para exibição, e o conjunto de regras a aplicar.
2. Cada regra devolve ocorrências, e cada ocorrência traz número da linha, trecho recortado e identificador da regra.
3. Política de severidade: o alvo que declara o formato de plano deste ciclo tem ocorrência tratada como reprovação. O alvo que não declara tem ocorrência tratada como aviso. É a mesma política que a fase irmã de honestidade da prova aplica ao campo de fronteiras confirmadas, e ela existe para que plano anterior ao ciclo continue passando.
4. Saída: veredito, contagem por severidade e a lista de ocorrências.
5. A área de metadados do topo do alvo também é varrida. Esconder violação nos metadados não pode ser saída.
6. O módulo não lê disco por conta própria e não escreve nada. Quem chama entrega o texto.

**Aceite:** o harness aplica uma regra sobre um texto e devolve ocorrências com linha correta, e a severidade muda conforme a declaração de formato do alvo.

**Prova:** lógica, na tarefa 7.

### 6. Regra de adjetivo

**O que muda:** primeira regra do harness.

Contrato:

1. A lista de adjetivos é lida da doutrina, e não está escrita no módulo. Se a doutrina não for encontrada, a regra devolve indisponível em vez de lista vazia, porque lista vazia aprovaria tudo em silêncio.
2. Uma ocorrência é uma frase que contém um item da lista e também contém um termo de medida, entre eles: tamanho, quantidade, número, limite, máximo de, mínimo de, até, por plano, por tarefa, por fase.
3. A frase que também contém um número, escrito em algarismo ou por extenso, não é ocorrência.
4. Frase dentro de exemplo marcado como exemplo ruim não é ocorrência, porque o exemplo ruim existe para mostrar o erro. O marcador de exemplo ruim é o mesmo declarado no plano 004 desta fase.

**Aceite:** uma regra de tamanho escrita só com adjetivo vira ocorrência. A mesma regra reescrita com número deixa de ser ocorrência.

**Prova:** lógica, vermelho e verde, na tarefa 7.

### 7. Teste vermelho e verde

**O que muda:** arquivo de teste novo do módulo de checagem, escrito antes da implementação e visto falhar.

Casos obrigatórios:

1. Par de fixtures no mesmo cenário: um texto que enuncia limite de tarefas por plano só com adjetivo, e outro que enuncia o mesmo limite com número. O primeiro tem ocorrência, o segundo não.
2. Adjetivo da lista usado fora de enunciado de medida: sem ocorrência.
3. Adjetivo com número na mesma frase: sem ocorrência.
4. Adjetivo dentro de exemplo marcado como exemplo ruim: sem ocorrência.
5. Lista lida da doutrina: acrescentar um item à lista da doutrina, no texto de fixture, faz aparecer ocorrência nova sem tocar o código.
6. Doutrina ausente: a regra devolve indisponível, e o veredito não é aprovação.
7. Severidade: o mesmo texto violando, com e sem declaração de formato deste ciclo, produz reprovação no primeiro caso e aviso no segundo.
8. Ocorrência em metadados do topo também é detectada.
9. Estimativa: um plano com contexto pré-inlinado acima do teto declara estouro, e um abaixo não declara.
10. Contagem de tarefa em português: um plano com sete títulos de tarefa em português conta sete, e não zero.

**Aceite:** o arquivo roda por invocação direta do interpretador, imprime uma linha por caso e a contagem final, e sai com código diferente de zero enquanto houver falha. Pelo menos os casos 1, 5, 7 e 10 foram vistos falhar antes da implementação, e a saída do vermelho fica registrada no resumo do plano.

**Prova:** lógica, vermelho e verde.

### 8. Enunciados por adjetivo já existentes trocados por número

**O que muda:** a doutrina do agente planejador e o fluxo de planejamento são varridos pela regra da tarefa 6, e todo enunciado de tamanho que hoje vive só por adjetivo passa a citar número. A varredura também entra no conjunto de conferências da verificação estática, para que a regressão apareça sozinha na próxima vez.

**Aceite:** a checagem rodada sobre a doutrina do planejador e sobre o fluxo de planejamento sai sem ocorrência. A verificação estática passa a listar a checagem de plano entre as conferências que executa.

**Prova:** execução da verificação estática, com a saída registrada no resumo do plano.

## Critério de aceite do plano

1. O orçamento de janela por plano está escrito em número, com divisor, reserva e teto declarados.
2. Todo plano gerado a partir deste ciclo registra a estimativa usada, e a decisão de quebrar uma fase cita o orçamento.
3. A operação de validação de plano devolve estimativa e percentual, sem perder o que já devolvia, e conta tarefa escrita em português.
4. A lista fechada de adjetivos mora na doutrina e é lida de lá, e a regra recusa enunciado de tamanho só por adjetivo.
5. Doutrina ausente devolve indisponível, e nunca aprovação silenciosa.
6. Plano anterior a este ciclo recebe aviso e não reprovação.
7. Os dez casos de teste passam, e o vermelho de quatro deles está registrado.
8. Os sete comandos continuam funcionando e projeto anterior a este ciclo continua funcionando sem migração.

## Tipo de prova

Lógica, vermelho e verde.

## Fora de escopo

1. Contagem exata de tokens por modelo. A estimativa é determinística por divisor declarado, e não pretende ser medição. Medir por modelo exigiria dependência externa, e este produto não tem dependência de produção.
2. Podar redação fora dos enunciados de tamanho. A regra é sobre medir, e poda de texto é passe de refatoração com briefing próprio.
3. Regra de durabilidade do plano, campo de fora de escopo e exemplo ruim anotado. São o plano 004 desta fase, que depende deste.
4. Alterar os limites de tamanho de arquivo de plano e de número de tarefas que já existem. Eles ficam como estão, e apenas ganham companhia.
5. Sedimento de papéis removidos nos templates. Passe próprio, com briefing próprio.

## Colisões conhecidas

O plano 004 desta fase escreve no mesmo módulo de checagem, e por isso declara aresta de bloqueio para este plano. Não há escrita concorrente. A fase irmã de honestidade da prova toca a operação de validação de plano para acrescentar campo próprio, então a alteração aqui é aditiva e não reescreve a operação inteira.

## Decisões registradas

**Decisão 1. A lista de adjetivos mora na doutrina e o código lê de lá.** Alternativa rejeitada: lista embutida no código. Rejeitada porque o requisito pede a lista declarada na própria doutrina, e duas cópias divergem na primeira vez que alguém acrescenta um item.

**Decisão 2. A estimativa reusa o construtor de contexto pré-inlinado.** Alternativa rejeitada: somar o tamanho dos arquivos citados pelo plano. Rejeitada porque o plano fica proibido de citar caminho de arquivo no plano 004 desta fase, então essa soma deixaria de existir por construção.

**Decisão 3. Ocorrência de adjetivo reprova, e não apenas sinaliza.** Alternativa rejeitada: apenas sinalizar, como faz a heurística de tautologia da fase irmã. Rejeitada porque a regra de adjetivo é sintática e verificável, e não heurística sobre intenção. O que justifica sinalizar lá é a taxa de falso positivo, que aqui não existe na mesma medida, e a saída barata continua sendo escrever o número.
