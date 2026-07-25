---
phase: 18-contexto-e-revisao
plan: 003
type: logic
autonomous: true
wave: 2
depends_on: ["001"]
requirements: [CTX-11, CTX-12]
objective: "Documento de estado carregando fio vivo, ponteiros e proximo comando sugerido"
prova: logica (vermelho e verde) mais smoke no proprio repositorio
files_modified:
  - up/templates/state.md
  - up/bin/up-tools.cjs
  - up/bin/lib/estado.test.cjs
  - up/references/state-persistence.md
must_haves:
  truths:
    - "O documento de estado carrega o fio vivo e ponteiros, e o detalhe fechado continua morando no artefato da fase"
    - "O documento de estado tem secao de proximo comando sugerido, sempre preenchida"
    - "Conteudo copiado de artefato do projeto para dentro do estado e sinalizado com o apontamento de onde ele ja mora"
  artifacts:
    - path: "up/templates/state.md"
      provides: "Molde do documento de estado com fio vivo, ponteiros e proximo comando sugerido"
    - path: "up/bin/up-tools.cjs"
      provides: "Escrita, derivacao e verificacao do proximo comando sugerido e da regra de referencia"
  key_links:
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/contexto.cjs"
      via: "reuso do indice de artefatos e da deteccao de duplicacao entregues no plano 001"
---

# Fase 18 Plano 003: Fio vivo do documento de estado

**Onda**: 2 (depende do plano 001, que entrega a biblioteca de higiene de contexto)

## Objetivo

Aplicar ao documento de estado a mesma regra dura que o handoff passou a seguir: referência, nunca cópia.
O documento de estado carrega o fio vivo (onde estamos, o que está em voo, o que trava) e ponteiros por
caminho relativo; o detalhe fechado mora no artefato da fase e não é reproduzido.

E acrescentar a seção obrigatória de próximo comando sugerido, para o roteamento morar no documento e não
na memória do dono. A seção nunca fica vazia: quando não há valor informado, ela é derivada do roadmap.

A regra de referência é a mesma do plano 001 e usa a mesma implementação. Duas cópias da mesma regra
seriam exatamente o erro que o dono apontou no leitor do log de aprovações.

## Contexto

Ler antes de começar: `.plano/fases/18-contexto-e-revisao/CONTEXT.md` (decisão P1),
`up/templates/state.md` (molde atual), `.plano/STATE.md` deste repositório (exemplo real, já com uma
linha de comando sugerido no fim), `up/references/state-persistence.md`, e a seção do documento de estado
em `up/bin/up-tools.cjs` (funções de carregar, atualizar, avançar plano, atualizar progresso, registrar
sessão e salvar sessão).

O plano 001 entrega a biblioteca de higiene de contexto. Este plano consome duas funções dela: o índice
de linhas dos artefatos do projeto, com exclusão configurável, e a detecção de duplicação. Se o plano 001
ainda não estiver concluído no momento da execução, parar e escalar; não reimplementar.

Regra dura de edição do despachante: nunca reescrever `up/bin/up-tools.cjs` inteiro. Somente edição por
âncora, relendo o arquivo imediatamente antes.

## Tarefas

### 1. Escrever os testes primeiro e vê-los falhar

Criar `up/bin/lib/estado.test.cjs`, no formato sem framework do repositório, sobre um projeto temporário
com diretório de planejamento povoado.

Casos obrigatórios: documento de estado sem a seção de próximo comando sugerido é reprovado pela
verificação, com o nome da seção faltante na saída. Documento com a seção presente mas vazia também é
reprovado, porque seção obrigatória vazia é pior que ausente, já que parece cumprida. Documento com a
seção preenchida passa. Documento que contém uma linha longa copiada de um resumo de fase é sinalizado,
com a linha e o caminho relativo do artefato onde ela já mora. O mesmo documento, com a cópia trocada por
um ponteiro, passa. O próprio documento de estado não pode acusar a si mesmo: uma linha longa que aparece
duas vezes dentro dele não conta como duplicação de artefato. A escrita do próximo comando substitui o
valor anterior em vez de acrescentar uma segunda seção. A derivação, num projeto cujo roadmap tem a fase
seguinte pendente e sem planos, produz o comando de planejar aquela fase; com planos gravados, produz o
comando de construir; com o roadmap inteiro concluído, produz o comando de auditoria. A verificação roda
sem lançar num projeto sem documento de estado.

Rodar e registrar a saída vermelha.

### 2. Reescrever o molde do documento de estado

Reescrever `up/templates/state.md` mantendo os nomes de seção que o gancho de início de sessão e os
workflows já esperam encontrar, porque mudar nome de seção aqui é regressão contra projeto antigo. As
seções que existem hoje continuam: referência do projeto, posição atual, contexto acumulado com decisões
e bloqueios, e continuidade de sessão.

O que muda dentro delas. Cada seção ganha a regra escrita no próprio molde: o que entra aqui é fio vivo e
ponteiro, e o detalhe fechado mora no artefato da fase, entrando por caminho relativo. O molde traz um
exemplo bom e um exemplo ruim lado a lado para a mesma informação: o ruim reproduz três linhas do resumo
da fase dentro do estado; o bom diz o que mudou em uma linha e aponta para o resumo por caminho relativo.
Cada linha do exemplo ruim vem anotada com o motivo de ser ruim.

Nasce a seção de próximo comando sugerido, no segundo nível de título, logo depois da posição atual, e
não enterrada no fim. Ela contém um comando por linha, em código em linha, começando pelo recomendado,
com um motivo curto em cada linha. O molde declara que a seção é obrigatória e nunca fica vazia.

O teto de tamanho declarado no molde continua valendo e passa a ser justificado pela regra de referência,
e não por um número solto: o documento é curto porque aponta, não porque foi podado.

O molde inteiro passa a ser escrito em português acentuado, alinhado à convenção do produto. Os nomes das
seções já estão em português hoje e não mudam de grafia.

### 3. Escrever, derivar e ler o próximo comando sugerido pela CLI

Acrescentar em `up/bin/up-tools.cjs`, dentro da seção do documento de estado, o subcomando de próximo
comando, com três modos.

Escrita: recebe o comando e um motivo opcional, grava a linha na seção, criando a seção na posição
correta quando ela não existe, e substituindo o conteúdo anterior quando existe. Aceita repetição do par
comando e motivo para gravar mais de uma linha, sempre com a primeira como recomendada.

Derivação: sem comando informado, deriva do roadmap. A regra de derivação é fechada e determinística. Se
existe fase pendente e ela não tem plano gravado, o comando é planejar aquela fase. Se ela tem plano
gravado, o comando é construir aquela fase. Se não há fase pendente, o comando é a auditoria. Em qualquer
caso a segunda linha oferecida é a porta única sem argumento, que continua de onde parou.

Leitura: sem sinalizador de escrita nem de derivação, devolve o conteúdo atual da seção.

Ligar ao fluxo que já existe: o subcomando de salvar sessão passa a gravar a seção na mesma passada,
usando o valor informado quando houver e a derivação quando não houver. Sem informação nenhuma, o
comportamento anterior de salvar sessão não muda em mais nada.

### 4. Verificação da regra de referência e da seção obrigatória

Acrescentar o subcomando de verificação do estado, que devolve um veredito estruturado com: presença e
preenchimento da seção de próximo comando sugerido; lista de linhas do documento de estado que duplicam
conteúdo de artefato do projeto, cada uma com o caminho relativo de onde ela já mora; e o tamanho em
linhas contra o teto declarado no molde.

A detecção usa o índice de artefatos e a detecção de duplicação da biblioteca do plano 001, com uma única
diferença de configuração: o próprio documento de estado sai do índice, senão ele acusa a si mesmo.

O veredito sinaliza e não bloqueia. Com saída crua, escrever apenas uma palavra, entre ok e revisar.
Nenhum comando existente passa a falhar por causa deste veredito: ele existe para o workflow poder
avisar, e a mesma justificativa da heurística de tautologia vale aqui, isto é, falso positivo bloqueante
é pior que o problema que ele pega.

### 5. Enunciar a regra na referência de persistência

Em `up/references/state-persistence.md`, acrescentar duas linhas: a de que o salvamento de sessão grava
também o próximo comando sugerido, e a de que o documento de estado aponta em vez de copiar. Enunciar
apontando para o molde, sem reproduzir o texto do molde, o que seria a própria regra sendo violada no ato
de escrevê-la.

### 6. Ver os testes passarem e rodar o smoke no próprio repositório

Rodar o arquivo de teste e registrar a saída verde.

Smoke: rodar a verificação contra o documento de estado deste repositório, que é um documento real
escrito antes desta regra existir. Registrar o resultado. Se ele apontar duplicação, corrigir apenas as
linhas apontadas, trocando cópia por ponteiro, e rodar de novo até ficar ok. Rodar a escrita do próximo
comando e conferir que a seção aparece na posição certa e que rodar de novo substitui em vez de duplicar.
Rodar a derivação sem valor informado e conferir que ela devolve o comando coerente com o roadmap deste
repositório.

Conferir ao fim que o gancho de início de sessão continua conseguindo ler o trecho do topo do documento:
o trecho injetado é um recorte do início do arquivo, então a seção nova, por estar logo depois da posição
atual, tem de caber dentro do recorte. Provar rodando o gancho com um payload de teste e lendo a saída.

## Arquivos tocados com contrato

| Arquivo | Contrato |
|---------|----------|
| `up/templates/state.md` | Reescrito. Mesmos nomes de seção de hoje, mais a seção obrigatória de próximo comando sugerido, mais a regra de referência com exemplo bom e exemplo ruim anotado. Português acentuado |
| `up/bin/up-tools.cjs` | Editado por âncora, nunca reescrito. Subcomandos de próximo comando e de verificação do estado, mais a gravação da seção dentro do salvamento de sessão. Nenhum comportamento existente muda quando nada novo é informado |
| `up/bin/lib/estado.test.cjs` | Novo. Testes sem framework das nove regras |
| `up/references/state-persistence.md` | Editado. Duas linhas apontando para o molde, sem reproduzi-lo |

## Critério de aceite

O molde tem seção de próximo comando sugerido no segundo nível de título, logo após a posição atual,
declarada como obrigatória e nunca vazia, e traz o par de exemplos bom e ruim da regra de referência, com
motivo anotado em cada linha ruim.

A verificação reprova documento sem a seção e documento com a seção vazia, e aprova com ela preenchida.
A verificação aponta linha duplicada com o caminho relativo do artefato onde ela já mora, e o próprio
documento de estado não entra no índice. A gravação substitui em vez de duplicar. A derivação devolve o
comando certo nos três estados de roadmap.

O documento de estado deste repositório termina a fase com veredito ok. O gancho de início de sessão
continua injetando o trecho do topo, agora com a seção nova visível dentro do recorte.

Os testes rodam verdes e foram vistos vermelhos antes.

## Tipo de prova

Lógica, vermelho e verde, para a verificação, a escrita e a derivação. Smoke no próprio repositório para
o documento de estado real e para o gancho de início de sessão.

## FORA DE ESCOPO

A biblioteca de higiene de contexto. Vem pronta do plano 001 e aqui é apenas consumida.

O documento de handoff. É outro artefato, com outro ciclo de vida: um é efêmero e fora do repositório, o
outro é versionado. Só a regra de referência é compartilhada.

Qualquer edição no workflow de construção. A gravação do próximo comando acontece dentro do salvamento de
sessão, que o build já chama, exatamente para não precisar tocar naquele arquivo, que nesta onda pertence
a outro plano.

Reescrever o conteúdo atual do documento de estado deste repositório além das linhas que a verificação
apontar. Poda de texto é passe separado.

Mudança no gancho de início de sessão. Ele é exercido como prova, não editado. O incremento de janela
dentro dele é do plano 002.

Mudança no teto de caracteres do trecho injetado pelo gancho. Se a seção nova não couber no recorte,
reposicionar a seção, e não aumentar o teto.
