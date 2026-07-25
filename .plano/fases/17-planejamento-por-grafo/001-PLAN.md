---
phase: 17-planejamento-por-grafo
plan: 17-001
type: fix
autonomous: true
plan_format: 2
wave: 0
depends_on: []
requirements: [PLANO-13]
must_haves:
  truths:
    - "A leitura de planos de uma fase enxerga plano gravado com o rótulo antes do identificador e plano gravado com o identificador antes do rótulo"
    - "O pareamento entre resumo e plano acerta nas duas convenções de resumo, com e sem prefixo do número da fase"
    - "Um único ponto do sistema decide o que é nome de plano e o que é nome de resumo, e todos os inventários consomem esse ponto"
    - "Identificador canônico duplicado na mesma fase é reportado como conflito, e não silenciosamente fundido"
  artifacts:
    - surface: "Biblioteca de planos (módulo novo de biblioteca, irmão das bibliotecas de integração com repositório e de quadro externo)"
      provides: "Canonicalização de identificador de plano e de resumo, e inventário de uma fase a partir da lista de nomes do diretório"
    - surface: "Subcomando de índice de planos da fase"
      provides: "Lista de planos e pareamento com resumo corretos nas duas convenções, mais o nome de arquivo real por plano"
  key_links:
    - from: "Subcomando de índice de planos da fase"
      to: "Biblioteca de planos"
      via: "Chamada da função de inventário, em vez de filtro por sufixo repetido no despachante"
    - from: "Motor de execução de fase"
      to: "Subcomando de índice de planos da fase"
      via: "Uso do nome de arquivo devolvido pelo índice, em vez de reconstrução do nome a partir do identificador"
---

# Fase 17 Plano 001: Leitura de plano e de resumo nas duas convenções

**Objetivo:** fazer o inventário de uma fase enxergar todo plano e todo resumo gravado em disco, qualquer que seja a convenção de nome em uso no repositório, e concentrar essa decisão num único lugar. Sem isso, a fronteira derivada do plano 002 nasce cega justamente para a fase mais recente do repositório.

**Onda:** 0 (visão de leitura). **Arestas de bloqueio:** nenhuma. Este plano não depende de nenhum outro plano da fase.

**Estimativa de janela** (método declarado no plano 003 desta fase, divisor de 4 caracteres por token): plano 3 mil tokens, contexto pré-inlinado 12 mil, leitura dirigida de código 14 mil, escrita e saída 9 mil. Total estimado 38 mil tokens, contra orçamento de 100 mil por plano.

**Requisitos cobertos:** PLANO-13.

## Fato verificado que motiva este plano

Executado neste repositório antes de planejar, e reproduzível:

| Fase gravada | Forma do nome em disco | Resultado do índice hoje |
|---|---|---|
| Fase 11 | rótulo antes do identificador, para plano e para resumo | lista de planos vazia, com o arquivo presente em disco |
| Fase 3 | identificador antes do rótulo no plano, resumo com prefixo do número da fase | plano listado, pareamento com resumo falso negativo |
| Fase 9 | plano com identificador antes do rótulo, um resumo com prefixo do número da fase e outro sem | um plano pareia, o outro não |
| Fase 10 | identificador antes do rótulo nos dois | correto |

A causa é um filtro de nome escrito por sufixo literal, repetido em vários pontos do despachante da CLI de ferramentas. Ele reconhece o rótulo apenas no fim do nome, e o pareamento compara o texto que sobra sem descontar o prefixo do número da fase.

## Superfícies tocadas (contrato, sem caminho)

1. **Biblioteca de planos**, módulo novo. Segue o padrão das bibliotecas já existentes de integração com repositório e de espelho de quadro externo: módulo CommonJS, exportação nomeada por objeto literal no fim do arquivo, sem dependência externa.
2. **Despachante da CLI de ferramentas**: os pontos que hoje repetem o filtro de nome (seis para plano e seis para resumo, localizáveis por busca pelo sufixo do rótulo) passam a chamar a biblioteca.
3. **Subcomando de índice de planos da fase**: mesma resposta de hoje, mais o nome de arquivo real por plano e por resumo.
4. **Motor de execução de fase** e **fluxo de planejamento**: param de reconstruir nome de arquivo a partir do identificador e de contar plano por listagem com curinga de sufixo.
5. **Arquivo de teste da biblioteca de planos**, irmão do teste já existente da biblioteca de integração com repositório: executável por invocação direta do interpretador, sem framework, imprime contagem no fim e sai com código diferente de zero quando há falha.

## Contexto necessário

Documentos, por nome, já presentes no diretório de planejamento: mapa de convenções do codebase, mapa de arquitetura, desenho do sistema (seção de contratos de dado), requisitos do projeto (categoria de planejamento por grafo).

## Tarefas

### 1. Canonicalização de identificador

**O que muda:** a biblioteca de planos ganha uma função exportada que recebe um nome de arquivo e o número da fase, e devolve o rótulo reconhecido (plano, resumo, ou nenhum) e o identificador canônico.

Regras, nesta ordem:

1. Aceitar apenas nome terminado em extensão markdown. Qualquer outra extensão devolve rótulo nenhum.
2. Reconhecer o rótulo de plano e o rótulo de resumo em duas posições: no fim do nome, precedido de hífen, e no começo do nome, seguido de hífen. Reconhecer também o nome que é só o rótulo, sem identificador.
3. Rótulo diferente de plano e de resumo (contexto, verificação, revisão, pesquisa, e qualquer outro) devolve rótulo nenhum, e o arquivo fica fora do inventário.
4. Do que sobra depois de remover rótulo e extensão, remover o segmento inicial que for igual ao número da fase, com ou sem zero à esquerda, e apenas quando ele for igual ao número da fase do diretório. Segmento numérico que não seja o número da fase não é removido.
5. O restante numérico é normalizado para três dígitos com zeros à esquerda. Restante vazio canoniza para o primeiro identificador, três dígitos, um.
6. Restante não numérico é preservado como está, em minúsculas, e continua servindo de identificador.

**Aceite:** para a fase de número 3, os nomes na forma rótulo antes do identificador, identificador antes do rótulo, identificador com prefixo do número da fase, e rótulo sozinho, todos devolvem o mesmo identificador canônico quando o número é o mesmo. Nome com rótulo de verificação devolve rótulo nenhum.

**Prova:** teste de lógica, na tarefa 6.

### 2. Inventário de fase

**O que muda:** segunda função exportada da biblioteca. Recebe a lista de nomes de arquivo de um diretório de fase e o número da fase. Devolve três coleções: planos, resumos e conflitos de identificador. Cada entrada de plano e de resumo carrega o nome de arquivo real e o identificador canônico. Conflito é o caso de dois arquivos do mesmo rótulo caindo no mesmo identificador canônico, e a entrada de conflito lista os nomes envolvidos.

Ordenação: planos e resumos saem ordenados pelo identificador canônico, em ordem crescente, para que a ordem de leitura não dependa da ordem do sistema de arquivos.

**Aceite:** uma fase com dois planos e dois resumos gravados em convenções diferentes devolve dois planos, dois resumos, e nenhum conflito. Uma fase com o mesmo identificador em duas formas de nome devolve o conflito e mantém as duas entradas.

**Prova:** teste de lógica, na tarefa 6.

### 3. Pareamento entre resumo e plano

**O que muda:** terceira função exportada. Recebe o inventário e devolve, por plano, se existe resumo com o mesmo identificador canônico e qual é o nome de arquivo desse resumo. Resumo sem plano correspondente é reportado numa coleção própria, em vez de descartado.

**Aceite:** na fase gravada com resumo prefixado pelo número da fase, o plano passa a ter resumo. Na fase gravada com rótulo antes do identificador, o plano passa a existir e a ter resumo.

**Prova:** teste de lógica, na tarefa 6, mais a conferência em fase real na tarefa 7.

### 4. Índice de planos da fase consumindo a biblioteca

**O que muda:** o subcomando de índice de planos da fase deixa de filtrar nome por conta própria e passa a chamar o inventário e o pareamento da biblioteca.

Contrato da resposta:

1. Todos os campos existentes continuam existindo com o mesmo nome e o mesmo significado: identificador do plano, onda declarada, autonomia, objetivo, arquivos modificados declarados, contagem de tarefas, presença de resumo, mapa de onda para lista de identificadores, lista de incompletos, e presença de ponto de parada humano.
2. Campos acrescentados, todos aditivos: nome de arquivo do plano, nome de arquivo do resumo pareado quando existir, e lista de conflitos de identificador.
3. Plano sem área de metadados no topo continua sendo listado, com onda declarada assumindo o valor um e autonomia assumindo verdadeiro. A fase mais recente do repositório está gravada assim, e regredi-la para fora do índice seria trocar um defeito por outro.

**Aceite:** o índice da fase 11 passa a listar um plano com resumo pareado. O índice da fase 3 passa a reportar resumo presente. O índice da fase 10 continua com a mesma resposta de antes, campo a campo, nos campos que já existiam.

**Prova:** teste de lógica mais conferência em fase real.

### 5. Demais inventários do despachante

**O que muda:** todos os outros pontos do despachante que hoje contam plano e resumo por sufixo literal passam a chamar a biblioteca. São os pontos que servem: o inventário de fase usado na abertura da execução, a listagem de fase por número, o cálculo de progresso do roadmap, o agregador de status, o resumo de progresso e a guarda de remoção de fase.

**Aceite:** nenhum ponto do despachante decide por conta própria o que é nome de plano ou de resumo. A contagem de planos e de resumos de cada fase já gravada no repositório passa a bater com o que existe em disco, inclusive na fase gravada com rótulo antes do identificador.

**Prova:** teste de lógica sobre a biblioteca, mais execução dos subcomandos afetados sobre as fases reais, com o antes e o depois registrados no resumo do plano.

### 6. Teste vermelho e verde

**O que muda:** arquivo de teste novo da biblioteca de planos. Escrito antes da implementação, visto falhar, e só então a implementação entra.

Casos obrigatórios, cada um sobre um diretório de fase temporário gravado no sistema de arquivos temporário do sistema operacional:

1. Fase gravada com rótulo antes do identificador, plano e resumo: o plano aparece e pareia.
2. Fase gravada com identificador antes do rótulo, plano e resumo sem prefixo: o plano aparece e pareia.
3. Fase gravada com identificador antes do rótulo e resumo com prefixo do número da fase: o plano aparece e pareia.
4. Fase mista, com um plano em cada convenção: os dois aparecem, cada um com o seu resumo.
5. Fase com plano sem numeração, só o rótulo: o plano aparece com o primeiro identificador.
6. Fase com conflito de identificador: o conflito é reportado e as duas entradas continuam visíveis.
7. Fase com arquivo de verificação e de contexto: nenhum dos dois entra no inventário.
8. Resumo sem plano correspondente: aparece na coleção própria, e não vira plano.

**Aceite:** o arquivo de teste roda por invocação direta do interpretador, imprime uma linha por caso, imprime a contagem final, e sai com código diferente de zero enquanto houver falha. Antes da implementação das tarefas 1 a 3, pelo menos os casos 1, 3, 4 e 6 falham. Depois, todos passam.

**Prova:** lógica, vermelho e verde. O vermelho é registrado no resumo do plano com a saída do teste antes da implementação.

### 7. Consumidores em fluxo e conferência em fase real

**O que muda:** dois consumidores param de reimplementar a convenção de nome.

1. O motor de execução de fase resolve o arquivo de cada plano e de cada resumo pelo nome devolvido pelo índice, e não mais montando o nome a partir do identificador. A guarda que confere resumo por plano ao fim de cada rodada de execução passa a usar a presença de resumo reportada pelo índice.
2. O fluxo de planejamento confere a existência de plano da fase pelo índice, e não mais por listagem com curinga de sufixo.

**Aceite:** as duas fases problemáticas do repositório, a gravada com rótulo antes do identificador e a gravada com resumo prefixado, aparecem corretas no índice, e o texto dos dois fluxos não contém mais montagem de nome de arquivo de plano a partir do identificador.

**Prova:** conferência por execução do índice sobre as fases reais, com antes e depois no resumo do plano.

## Critério de aceite do plano

1. O índice da fase gravada com rótulo antes do identificador lista o plano dela, e o resumo pareia.
2. O índice da fase gravada com resumo prefixado pelo número da fase reporta resumo presente.
3. O índice de uma fase já correta continua respondendo igual nos campos que já existiam.
4. O arquivo de teste da biblioteca de planos foi visto falhar antes da correção e passa depois, com os oito casos.
5. Nenhum ponto do despachante e nenhum dos dois fluxos decide sozinho o que é nome de plano ou de resumo.
6. Os sete comandos continuam funcionando e projeto com planejamento anterior a este ciclo continua sendo lido sem migração.

## Tipo de prova

Lógica, vermelho e verde. O vermelho é obrigatório e fica registrado no resumo do plano.

## Fora de escopo

1. Padronizar as convenções de nome em disco, ou renomear arquivo de fase já gravada. A decisão desta fase é ler as duas, e não eleger uma. Renomear quebraria histórico de commit e referência cruzada em resumo antigo.
2. Corrigir a extração de objetivo do plano, que hoje devolve texto truncado em uma das fases gravadas. É defeito real, de outra superfície, e não afeta a leitura de nome.
3. Acrescentar aresta de bloqueio ou fronteira. Isso é o plano 002 desta fase, que depende deste.
4. Tocar o sedimento de papéis removidos que ainda aparece no template do plano pronto. Tem passe próprio, com briefing próprio.

## Decisões registradas

**Decisão 1. Um só lugar decide o que é nome de plano.** Alternativa rejeitada: corrigir o filtro em cada um dos pontos onde ele aparece hoje. Rejeitada porque a duplicação é a causa do defeito, e corrigir doze cópias garante que a décima terceira nasça errada.

**Decisão 2. Prefixo do número da fase só é removido quando confere com a fase do diretório.** Alternativa rejeitada: remover qualquer segmento numérico inicial. Rejeitada porque colapsaria identificadores legitimamente distintos numa fase que use identificador composto.

**Decisão 3. Conflito de identificador é reportado, não resolvido.** Alternativa rejeitada: fundir silenciosamente as entradas em conflito. Rejeitada porque fundir esconde a perda de um plano, que é exatamente o defeito que este plano existe para consertar.
