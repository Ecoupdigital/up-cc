---
phase: 18-contexto-e-revisao
plan: 004
type: glue
autonomous: true
wave: 1
depends_on: []
requirements: [REV-01, REV-04, REV-05, REV-07, REV-08]
objective: "Dois agentes de revisao isolados, um por eixo, com cegueira ao codigo vinda do conjunto de ferramentas"
prova: smoke
files_modified:
  - up/agents/up-revisor-conformidade.md
  - up/agents/up-revisor-qualidade.md
  - up/agents/up-revisor.md
  - up/bin/lib/core.cjs
  - up/bin/install.js
  - up/commands/plan.md
  - up/commands/build.md
  - up/skills/up-tdd/SKILL.md
  - up/skills/up-verificar-antes-de-concluir/SKILL.md
  - up/workflows/plan.md
  - up/README.md
  - CLAUDE.md
must_haves:
  truths:
    - "Existem dois agentes de revisao isolados, um por eixo, com conjuntos de ferramentas diferentes"
    - "O eixo de conformidade nao tem nenhuma ferramenta capaz de ler codigo-fonte"
    - "Cada eixo declara teto de saida em quatrocentas palavras e avisa quando trunca"
    - "Achado sem ancora nao entra no relatorio de nenhum dos dois eixos"
    - "Sem spec disponivel, o eixo de conformidade reporta a ausencia em vez de inventar requisito"
  artifacts:
    - path: "up/agents/up-revisor-conformidade.md"
      provides: "Eixo de conformidade, cego ao codigo pelo conjunto de ferramentas concedido"
    - path: "up/agents/up-revisor-qualidade.md"
      provides: "Eixo de qualidade e seguranca, ancorado no trecho alterado"
  key_links:
    - from: "up/bin/lib/core.cjs"
      to: "os dois agentes novos"
      via: "mapa de papel por agente, usado pelo roteamento de modelo"
    - from: "up/bin/install.js"
      to: "os dois agentes novos"
      via: "lista de agentes com permissao de escrita no runtime de sandbox"
---

# Fase 18 Plano 004: Os dois eixos como subagentes isolados

**Onda**: 1 (sem dependência; roda em paralelo com o plano 001)

## Objetivo

Hoje o revisor único roda conformidade e qualidade em sequência travada: o segundo estágio só começa se o
primeiro passar, com a regra escrita de que a ordem é inviolável. A consequência é que, quando a
conformidade reprova, os problemas de segurança nunca são descobertos naquela rodada. O sistema esconde
problema de qualidade atrás de falha de conformidade.

Este plano quebra o revisor único em dois agentes de eixo, isolados, para que possam rodar em paralelo.
Não é uma reorganização cosmética: a separação é o que permite que os dois vereditos existam ao mesmo
tempo, e é pré-requisito do gate conjuntivo do plano 007.

Preserva o que era força do sistema: o eixo de conformidade continua cego ao código, testando como
usuário final. E torna a cegueira estrutural, e não retórica: ela passa a vir do conjunto de ferramentas
concedido ao subagente, e não de um parágrafo pedindo para não olhar.

## Contexto

Ler antes de começar: `.plano/fases/18-contexto-e-revisao/CONTEXT.md` (decisões P2 e P3),
`up/agents/up-revisor.md` (o agente que será aposentado, e de onde sai o conteúdo dos dois novos),
`.plano/codebase/CONVENTIONS.md` (formato de frontmatter de agente) e `.plano/SYSTEM-DESIGN.md` seção 6
(matriz de escrita por artefato, que este plano não pode violar).

Este plano cria contratos. Quem os orquestra é o plano 006, e quem muda o gate é o plano 007. Nada aqui
dispara subagente nem toca no log de aprovações.

## Tarefas

### 1. Criar o agente do eixo de conformidade

Criar `up/agents/up-revisor-conformidade.md`, com o frontmatter no padrão de agente do repositório.

A decisão central está no campo de ferramentas: o agente recebe apenas a ferramenta de escrita e o
conjunto do servidor de navegação. Sem leitura de arquivo, sem busca por conteúdo, sem busca por nome e
sem execução de comando. Com esse conjunto, ele não consegue ler código-fonte, ler resumo do executor,
ler plano nem ler relatório de verificação, ainda que queira. É isso que REV-04 exige: a cegueira vem do
que foi concedido.

Consequência que o corpo do agente precisa absorver: os requisitos chegam inlinados no prompt, porque ele
não pode lê-los do disco. O corpo declara que a única fonte de verdade sobre o que deveria existir é o
bloco de requisitos recebido, e que ele não navega para endereços de arquivo local, apenas para o
endereço de aplicação informado.

O corpo herda do agente antigo o primeiro estágio inteiro: a premissa cética de que o implementador
terminou rápido demais; a busca por requisito faltante, trabalho além do combinado e mal-entendido; a
tabela de testabilidade por tipo de requisito; o roteiro de teste por navegação e por chamada de rota; e
o cálculo de confiança. Some ao herdado a regra de âncora e a regra de ausência de spec, das tarefas 3
e 4.

O agente não sobe aplicação: sem execução de comando, ele não consegue. O endereço base chega pronto no
prompt, e a subida é responsabilidade do orquestrador, no plano 006. Se o endereço não responder, o
agente reporta isso como impedimento, e não como reprovação de requisito, porque aplicação fora do ar não
é prova de que o requisito falhou.

Saída: um relatório próprio no diretório da fase, com nome que identifica o eixo, e nada mais. O agente
não escreve no relatório do outro eixo e não escreve no log de aprovações, conforme a matriz de escrita.

### 2. Criar o agente do eixo de qualidade e segurança

Criar `up/agents/up-revisor-qualidade.md`, com o frontmatter no padrão do repositório.

Ferramentas: leitura de arquivo, busca por conteúdo, busca por nome, execução de comando e escrita. Sem o
conjunto de navegação. A assimetria é deliberada e vale nos dois sentidos: o eixo que lê código não dirige
o navegador, e o eixo que dirige o navegador não lê código. Sem isso, o eixo de qualidade poderia produzir
prova de nível de usuário e a separação viraria decoração.

O corpo herda do agente antigo o segundo estágio inteiro: os critérios de qualidade de código, a lista de
requisitos de produção, as seis categorias de segurança com a varredura automatizada que as inicia, e a
escala de severidade. Some a regra de âncora da tarefa 3 e o teto de saída da tarefa 5.

Mantém intacta a proibição de ler ou citar conteúdo de arquivo de credencial, que já existe no agente
antigo. Saída commitada com segredo dentro é incidente, e agora são dois relatórios em vez de um.

Este agente também assume os escopos que o revisor único atendia fora do gate de fase: a revisão de
planejamento e a revisão de entrega consolidada. Os dois são revisões que leem artefato, que é exatamente
o conjunto de ferramentas dele. O corpo declara os três escopos e o que muda em cada um.

### 3. Regra de âncora, escrita nos dois agentes

Achado sem âncora não entra no relatório. A regra é a mesma nos dois eixos, e a âncora é diferente em
cada um, porque a fonte de verdade de cada um é diferente.

No eixo de conformidade, a âncora é o identificador do requisito mais a linha dele dentro do bloco de
requisitos recebido. Sem identificador de requisito, o achado não é conformidade: é opinião.

No eixo de qualidade, a âncora é o trecho alterado, citado por arquivo e linha, e a linha tem de cair
dentro do que o diff daquela fase mudou. Achado sobre código que a fase não tocou não entra, porque
revisão de fase não é auditoria de repositório, e essa distinção é o que impede o relatório de virar
lista genérica.

Os dois agentes declaram, além da regra, o que fazer com o achado descartado: contar. O relatório informa
quantos achados foram descartados por falta de âncora, para que o descarte seja visível e não vire
censura silenciosa.

O formato do achado e o da âncora são fixos nos dois eixos, porque o plano 006 valida a âncora de forma
determinística e formato livre não é validável. Cada achado é um título de terceiro nível com
identificador e resumo em uma linha; a linha imediatamente seguinte começa pelo rótulo de âncora e traz,
no eixo de conformidade, o identificador do requisito e o número da linha dele dentro do bloco recebido,
e, no eixo de qualidade, o caminho e o número da linha dentro do trecho alterado. Depois vêm severidade,
problema e correção sugerida. O rótulo de âncora é o mesmo nos dois eixos; o que muda é o que vem depois
dele.

O bloco de frontmatter do relatório de cada eixo é dado estruturado consumido pelo orquestrador e traz,
com estes nomes: o eixo, o veredito do eixo, a contagem de achados publicados, a contagem de descartados
por falta de âncora, a contagem de palavras do corpo e o identificador do pior achado do eixo. Sem esses
campos o plano 006 não consegue montar o relatório lado a lado nem o resumo por eixo.

### 4. Regra de ausência de spec, no eixo de conformidade

Quando o bloco de requisitos recebido está vazio ou não contém nenhum identificador de requisito, o
agente não avalia nada. Ele escreve o relatório com veredito de eixo pulado e a razão explícita, e não
produz achado nenhum.

O corpo do agente declara por que: inventar requisito a partir do que o produto parece fazer é fabricar a
régua depois de medir. E declara a consequência no gate, para quem lê o relatório entender: eixo pulado
não aprova nem reprova, conforme a decisão P3 do contexto da fase.

### 5. Teto de saída, escrito nos dois agentes

Cada eixo tem teto de quatrocentas palavras no relatório que escreve. O teto força priorização: com
espaço infinito, o modelo lista tudo e não decide nada.

Os dois agentes declaram o teto em número escrito, contam as palavras do próprio relatório antes de
devolver, e, ao ultrapassar, cortam pelo fim e acrescentam a linha de aviso dizendo que a saída foi
truncada no teto e quantas palavras ficaram de fora. A ordem de corte é declarada: o pior problema do
eixo vem primeiro, então o que cai é sempre o menos grave.

O teto vale para o corpo do relatório e não para o bloco de frontmatter dele, que é dado estruturado
consumido pelo orquestrador.

### 6. Aposentar o revisor único e atualizar os registros

Remover `up/agents/up-revisor.md`. Todo o conteúdo dele foi para os dois agentes novos; deixá-lo no lugar
criaria duas doutrinas de revisão convivendo, que é a forma mais cara de dívida neste sistema.

Em `up/bin/lib/core.cjs`, no mapa de papel por agente, remover a entrada do revisor único e acrescentar
as duas novas, ambas no papel de revisão. Sem isso, o roteamento de modelo perde a referência e cai no
padrão sem avisar.

Em `up/bin/install.js`, na lista de agentes que recebem permissão de escrita no runtime de sandbox,
remover a entrada antiga e acrescentar as duas novas. Os dois escrevem relatório, então os dois precisam
de escrita. Atualizar também o comentário que declara a contagem de agentes.

O manifesto de referências por agente, que vive no despachante da CLI, ainda cita o revisor único. Ele
não é tocado neste plano, porque naquele arquivo trabalha outro plano desta mesma onda. A entrada órfã é
inofensiva enquanto ninguém spawna o agente removido, e a limpeza dela é tarefa declarada do plano 006.

### 7. Atualizar as superfícies que nomeiam o revisor

Trocar o nome do agente nas superfícies que apenas o citam, sem mudar o que elas dizem: os dois arquivos
de comando que descrevem o fluxo, as duas skills que mencionam quem carimba a evidência no log, e o
estágio de revisão de planejamento no workflow de planejamento, que passa a nomear o eixo de qualidade.

Nas duas skills, a frase que hoje diz que o gate só passa com a linha do revisor carregando o campo de
evidência passa a dizer que o gate só passa com as linhas dos eixos. O detalhe do gate conjuntivo não
entra aqui: ele é do plano 007, e a frase apenas deixa de mentir sobre o número de linhas.

Atualizar a contagem e a lista de agentes em `up/README.md` e em `CLAUDE.md`, de doze para treze, com a
frase que explica a troca: o revisor único foi substituído por dois agentes de eixo isolados, porque a
sequência travada escondia problema de segurança atrás de falha de conformidade.

Não tocar no workflow de construção nem no de governança. Os dois pertencem a planos de ondas seguintes.

### 8. Smoke dos contratos

Conferir, lendo o frontmatter dos dois agentes, que o eixo de conformidade não recebe nenhuma ferramenta
capaz de ler arquivo, buscar conteúdo, buscar nome ou executar comando, e que o eixo de qualidade não
recebe o conjunto de navegação. Registrar as duas listas de ferramentas no resumo do plano: elas são a
prova de REV-04.

Rodar o roteamento de modelo para os dois nomes novos e conferir que devolve o modelo do papel de revisão,
e não o padrão de fallback. Rodar a resolução do modo de sandbox do instalador para os dois nomes e
conferir que devolve permissão de escrita.

Buscar no pacote inteiro pelo nome do agente removido e conferir que só restam as ocorrências declaradas
como fora de escopo deste plano, isto é, o manifesto de referências e os dois workflows dos planos
seguintes. Registrar a lista no resumo, para o plano 006 e o plano 007 saberem exatamente o que herdaram.

## Arquivos tocados com contrato

| Arquivo | Contrato |
|---------|----------|
| `up/agents/up-revisor-conformidade.md` | Novo. Eixo de conformidade. Ferramentas: escrita e navegação, nada mais. Recebe requisitos inlinados, testa como usuário final, ancora no identificador de requisito, pula quando não há spec, escreve só o relatório do próprio eixo |
| `up/agents/up-revisor-qualidade.md` | Novo. Eixo de qualidade e segurança. Ferramentas: leitura, busca, execução e escrita, sem navegação. Ancora no trecho alterado dentro do diff da fase. Atende também os escopos de planejamento e de entrega |
| `up/agents/up-revisor.md` | Removido. Conteúdo migrado integralmente para os dois agentes de eixo |
| `up/bin/lib/core.cjs` | Editado. Mapa de papel por agente: remove um, acrescenta dois, ambos no papel de revisão |
| `up/bin/install.js` | Editado. Lista de agentes com permissão de escrita no sandbox e comentário de contagem |
| `up/commands/plan.md`, `up/commands/build.md` | Editados. Trocam o nome do agente citado, sem mudar o fluxo descrito |
| `up/skills/up-tdd/SKILL.md`, `up/skills/up-verificar-antes-de-concluir/SKILL.md` | Editados. A frase sobre quem carimba a evidência passa a falar em linhas dos eixos |
| `up/workflows/plan.md` | Editado apenas no estágio de revisão de planejamento, que passa a nomear o eixo de qualidade. Nenhum outro estágio |
| `up/README.md`, `CLAUDE.md` | Editados. Contagem de agentes de doze para treze, com o motivo da troca |

## Critério de aceite

Existem dois arquivos de agente, um por eixo. O conjunto de ferramentas do eixo de conformidade não
contém nenhuma ferramenta capaz de ler código-fonte, e o do eixo de qualidade não contém navegação. Os
dois declaram, em número escrito, o teto de quatrocentas palavras e o aviso de truncamento. Os dois
declaram a regra de âncora do próprio eixo e a contagem de achados descartados por falta de âncora. O
eixo de conformidade declara o comportamento de pulo por ausência de spec, com a razão.

O arquivo do revisor único não existe mais, e os dois registros de código que o citavam apontam para os
dois novos. O roteamento de modelo e a resolução de sandbox respondem para os dois nomes novos. A
contagem de agentes nas duas superfícies de documentação diz treze.

Nenhuma linha do workflow de construção e do workflow de governança foi tocada.

## Tipo de prova

Smoke, conforme a tarefa 8. A prova de REV-04 é a lista de ferramentas concedidas, lida do frontmatter e
registrada no resumo. A prova dos registros é a saída dos dois comandos de resolução.

## FORA DE ESCOPO

Disparar os dois eixos, montar o relatório lado a lado, aplicar o teto de forma determinística e falhar
rápido antes do fan-out. Tudo isso é o plano 006.

Mudar o gate, o formato da linha do log de aprovações e a semântica de aprovação da fase. É o plano 007.

Limpar a entrada órfã do manifesto de referências por agente. É do plano 006, que trabalha naquele
arquivo na onda seguinte.

Revisão em dois eixos para o escopo de entrega global e para o escopo de planejamento. Continuam com um
eixo, agora nomeado como eixo de qualidade.

Corte de sedimento nos textos herdados do agente antigo. O conteúdo migra como está, mais as regras
novas. Poda é passe separado.

Qualquer mudança no servidor de navegação ou na forma como a aplicação sobe. A subida passa a ser
responsabilidade do orquestrador, e isso é implementado no plano 006.
