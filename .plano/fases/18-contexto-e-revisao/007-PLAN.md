---
phase: 18-contexto-e-revisao
plan: 007
type: logic
autonomous: true
wave: 4
depends_on: ["003", "005", "006"]
requirements: [REV-09, REG-01, REG-02, REG-03]
objective: "Gate conjuntivo por eixo sobre o leitor unico da fase 16, mais a regressao zero da fase"
prova: logica (vermelho e verde) no gate mais smoke de regressao
files_modified:
  - up/bin/lib/revisao.cjs
  - up/bin/lib/revisao.test.cjs
  - up/bin/up-tools.cjs
  - up/workflows/governance.md
  - up/workflows/build.md
must_haves:
  truths:
    - "Uma rodada em que a conformidade reprova e a qualidade aprova fica registrada por eixo e a fase nao aprova"
    - "O eixo ja aprovado nao e reexecutado na rodada de correcao: volta apenas o reprovado"
    - "Linha antiga com veredito unico continua valendo como veredito dos dois eixos, sem reescrita retroativa"
    - "A leitura de linha antiga usa o leitor unico da fase 16, e nao uma segunda implementacao"
    - "Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento antigo nao quebra"
  artifacts:
    - path: "up/bin/lib/revisao.cjs"
      provides: "Leitura de veredito por eixo e decisao conjuntiva do gate"
    - path: "up/workflows/governance.md"
      provides: "Contrato do log de aprovacoes com o campo de eixo e a regra conjuntiva"
  key_links:
    - from: "up/bin/lib/revisao.cjs"
      to: "o leitor unico do log de aprovacoes entregue na fase 16"
      via: "consumo direto, sem reimplementar leitura de linha"
---

# Fase 18 Plano 007: Gate conjuntivo por eixo e regressão zero

**Onda**: 4 (fecha a fase; depende dos planos 003, 005 e 006, e do leitor único da fase 16)

## Objetivo

Fazer o gate representar veredito por eixo. Hoje a fase tem um veredito só, então o estado em que a
conformidade reprova e a qualidade aprova nem é registrável: ou o log mente, ou a informação se perde.

A regra é a decisão travada do dono: o gate é conjuntivo. A fase só aprova com os dois eixos aprovados. O
eixo que já aprovou fica registrado e não é reexecutado na rodada de correção, que roda apenas o
reprovado. E linha antiga, com veredito único, continua valendo como veredito dos dois eixos, sem
reescrita retroativa.

Este plano também é o fechamento da fase: prova que os sete comandos e os quatro runtimes continuam
funcionando e que projeto com planejamento anterior ao ciclo não quebra.

## Contexto

Ler antes de começar: `.plano/fases/18-contexto-e-revisao/CONTEXT.md` (decisões D1, D2 e P3),
`.plano/SYSTEM-DESIGN.md` seção 5.1 (as três formas que existem no log deste repositório e os três pontos
em que o gate de hoje quebra contra elas), `up/workflows/governance.md` (contrato do log e o gate
determinístico), `up/workflows/build.md` no gate de fase e no processamento do veredito, e
`up/bin/lib/revisao.cjs` (entregue no plano 006).

## Tarefas

### 1. Localizar o leitor único da fase 16 e parar se ele não existir

Antes de qualquer outra coisa, localizar o leitor único do log de aprovações entregue pela fase 16, sob o
requisito PROVA-04. Ele é a função que localiza os campos por conteúdo e não por posição: escopo pelo
número da fase em qualquer notação, veredito pela palavra de veredito e evidência pelo prefixo do campo,
funcionando com ou sem a coluna do agente, descartando apenas a linha que não carrega veredito nenhum.

Procurar nos planos e resumos da fase 16, dentro do diretório de fases, e no diretório de bibliotecas da
CLI, pelo nome real com que ele foi entregue.

Se o leitor não existir, este plano PARA aqui. Registrar o bloqueio, escalar ao dono e não seguir para a
tarefa 2. É proibido escrever uma segunda implementação de leitura de linha do log, ainda que pareça
barato: duas leituras divergentes do mesmo arquivo é exatamente o defeito que a fase 16 existe para
consertar, e recriá-lo aqui anularia as duas fases.

Se o leitor existir mas não expuser, por entrada, o que permite distinguir o eixo, estender o leitor da
fase 16 para expor esse dado. Estender o leitor único continua sendo um leitor único; parsear o log de
novo, não.

### 2. Escrever os testes do gate por eixo e vê-los falhar

Estender `up/bin/lib/revisao.test.cjs` com os casos do gate, montados sobre arquivos de log de teste.

Fixture A, o caso que o dono nomeou: log com linha de conformidade reprovando e linha de qualidade
aprovando, ambas da mesma fase. A leitura por eixo devolve os dois vereditos distintos. A decisão do gate
é não aprovar. A lista de eixos a reexecutar contém apenas a conformidade.

Fixture B: as duas linhas aprovando. A decisão é aprovar.

Fixture C, compatibilidade com o histórico: log contendo exatamente as duas linhas reais deste
repositório, com o vocabulário divergente e sem a coluna do agente, mais o fragmento não estruturado do
topo. A leitura devolve, para cada uma dessas fases, veredito válido para os dois eixos, e a decisão é
aprovar. O fragmento do topo é ignorado sem quebrar a leitura.

Fixture D: linha antiga de veredito único seguida, mais adiante no mesmo arquivo, de uma linha nova de um
eixo reprovando. A linha mais recente daquele eixo vence, e a decisão é não aprovar. Isso prova que a
compatibilidade não vira imunidade: linha antiga vale enquanto ninguém escreveu depois dela.

Fixture E: eixo de conformidade sem linha nenhuma, porque foi pulado por ausência de spec, e qualidade
aprovando. A decisão não é aprovar sozinha: é escalar, com a marca de eixo não avaliado.

Fixture F: mesma fase com duas rodadas, a primeira com a conformidade reprovando e a segunda com ela
aprovando. Vale a última por eixo, e a decisão é aprovar sem que a qualidade tenha sido reexecutada.

Rodar e registrar a saída vermelha.

### 3. Implementar a leitura por eixo e a decisão conjuntiva

Estender `up/bin/lib/revisao.cjs` com duas funções, ambas construídas sobre o leitor da tarefa 1.

A leitura por eixo recebe o diretório e o número da fase, pede as entradas ao leitor único, e classifica
cada uma: entrada que carrega o campo de eixo pertence àquele eixo; entrada sem o campo é herança e vale
para os dois eixos. Para cada eixo, vence a entrada mais recente. Devolve o veredito de cada eixo, a
origem de cada um, entre entrada própria e herança, e a lista de eixos sem veredito.

A decisão conjuntiva recebe esse resultado e devolve aprovar, não aprovar ou escalar, mais a lista de
eixos a reexecutar. Aprovar exige veredito de aprovação nos dois eixos. Qualquer eixo reprovado devolve
não aprovar, com aquele eixo na lista de reexecução e o outro fora dela. Eixo sem veredito devolve
escalar, com a marca de não avaliado.

Nenhuma das duas funções lê linha de log por conta própria.

### 4. Estender o contrato do log e escrever a regra conjuntiva na governança

Em `up/workflows/governance.md`, estender o contrato da linha do log de forma aditiva: as seis colunas
documentadas continuam iguais, e a linha ganha um campo final que declara o eixo. Uma linha por eixo, por
rodada. O campo de evidência continua presente nas duas linhas, com o mesmo valor, porque a evidência é
da fase e não do eixo, e assim a checagem de evidência que já existe continua valendo qualquer que seja a
linha encontrada.

Escrever a regra conjuntiva com o motivo: a fase só aprova com os dois eixos aprovados, e o eixo já
aprovado fica registrado e não é reexecutado na rodada de correção. Escrever também a regra de herança:
linha antiga sem campo de eixo vale como veredito dos dois eixos, e não é reescrita.

O cap de rework de uma rodada continua existindo e passa a ser por eixo, com o contador de rework
nomeado por fase e eixo. A aprovação forçada por esgotamento do cap continua registrando débito técnico e
passa a nomear o eixo em que ela ocorreu, senão o débito vira anônimo.

Substituir o trecho de gate em shell que hoje procura a entrada por nome de agente e lê a coluna por
posição pela chamada da decisão conjuntiva. Deixar escrito no arquivo por que aquele trecho saiu, citando
os três pontos de quebra registrados no mapa do sistema, para ninguém reintroduzi-lo achando que
simplifica.

### 5. Ligar o gate por eixo no despachante e no workflow de construção

Em `up/bin/up-tools.cjs`, acrescentar ao caso de revisão dois subcomandos: o de vereditos por eixo de uma
fase e o de decisão do gate, este último saindo com código diferente de zero quando a decisão não é
aprovar, para o workflow ramificar em shell. Editar por âncora, nunca reescrever o arquivo.

Em `up/workflows/build.md`, no gate de fase, substituir o bloco atual pela chamada do gate por eixo, e
reescrever o processamento do veredito com três saídas. Aprovar segue para o fechamento da fase, como
hoje. Não aprovar entra no rework apenas dos eixos listados, disparando só os executores apontados no
relatório daquele eixo e, depois, apenas aquele eixo na revisão, com o cap por eixo. Escalar fala com o
dono no formato da fase 13: a recomendação é registrar a ausência de spec e fechar a fase com o eixo que
rodou, com o motivo de que não há régua para medir conformidade e inventar uma seria fabricar a prova; a
alternativa é escrever os requisitos da fase agora e rodar o eixo que faltou. Em modo automático, seguir
a recomendação e registrar débito técnico, que é o mesmo desfecho que a aprovação forçada já tem hoje.

Escrever, no ponto em que a rodada de correção é montada, que reexecutar o eixo já aprovado é proibido, e
por quê: além de custar uma janela à toa, reexecutar convida a um veredito diferente do que já está
registrado, e o registro é o que torna o estado auditável.

### 6. Ver os testes do gate passarem

Rodar o arquivo de teste e registrar a saída verde, com o número de casos. As saídas vermelha e verde
entram no resumo do plano: são a prova do requisito de gate por eixo e a demonstração do cenário que o
dono nomeou.

### 7. Regressão dos sete comandos e dos quatro runtimes

Regra dura antes de qualquer comando: nunca instalar no diretório de configuração real durante esta fase.
Toda instalação de teste vai para diretório temporário, apontado pelas variáveis de ambiente que o
instalador já respeita para cada um dos quatro runtimes. Instalar por cima da configuração real trocaria
os agentes vivos no meio da própria execução da fase.

Instalar os quatro runtimes, um por vez, cada um em seu diretório temporário, e conferir por runtime: que
os sete comandos foram emitidos na forma daquele runtime; que os agentes foram emitidos, agora em número
treze, com os dois de eixo presentes e o revisor único ausente; que as quatro skills de doutrina
continuam presentes; que o bloco de doutrina foi injetado no arquivo de instruções dos runtimes que não
têm gancho; e que, no runtime nativo, os ganchos de barra de status, de monitor de contexto e de início
de sessão foram registrados na configuração.

Conferir que os sete arquivos de comando continuam apontando para o workflow correspondente, resolvendo
cada referência para um arquivo que existe no pacote instalado.

Registrar no resumo, por runtime, a contagem de comandos, agentes e skills emitidos.

### 8. Regressão de projeto com planejamento anterior ao ciclo

Rodar o leitor por eixo contra o log de aprovações deste repositório, que contém as duas linhas
divergentes reais e o fragmento não estruturado do topo, e conferir que ele devolve veredito válido para
as fases 11 e 12 sem quebrar e sem reescrever o arquivo.

Rodar o índice de planos e a inicialização de execução de fase contra as fases 3 e 11 deste repositório,
que estão gravadas em convenções de nome diferentes, e registrar o resultado. Onde a leitura falhar por
causa da convenção de nome, registrar como pertencente à fase 17, que é dona daquele requisito, e não
consertar aqui.

Rodar os subcomandos novos desta fase num projeto sem nenhuma das chaves e arquivos novos e conferir que
todos degradam: limiar ausente cai no padrão, marcador de janela ausente devolve indeterminado, registro
de higiene ausente devolve contagem zero, e nada disso derruba comando nenhum.

Conferir ao fim que a árvore de trabalho está limpa e que nenhum arquivo temporário de teste foi
commitado.

## Arquivos tocados com contrato

| Arquivo | Contrato |
|---------|----------|
| `up/bin/lib/revisao.cjs` | Estendido. Leitura de veredito por eixo construída sobre o leitor único da fase 16, e decisão conjuntiva com lista de eixos a reexecutar. Nenhuma leitura própria de linha de log |
| `up/bin/lib/revisao.test.cjs` | Estendido. Seis fixtures de gate, incluindo as duas linhas reais deste repositório e o fragmento do topo |
| `up/bin/up-tools.cjs` | Editado por âncora. Dois subcomandos novos no caso de revisão, com código de saída utilizável em shell |
| `up/workflows/governance.md` | Editado. Campo de eixo aditivo no contrato da linha, regra conjuntiva, regra de herança, cap de rework por eixo e substituição do trecho de gate que lia por posição |
| `up/workflows/build.md` | Editado no gate de fase e no processamento do veredito. Três saídas: aprovar, rework apenas do eixo reprovado, e escalar quando um eixo não foi avaliado |

## Critério de aceite

A rodada em que a conformidade reprova e a qualidade aprova produz dois vereditos distintos no log, a
fase não aprova, e a lista de reexecução contém apenas a conformidade. Na rodada de correção, o eixo de
qualidade não é disparado, e o veredito dele permanece registrado.

O log deste repositório, com as duas linhas divergentes e o fragmento não estruturado, é lido sem quebra,
devolvendo veredito válido para os dois eixos das fases 11 e 12, e o arquivo não é reescrito. Linha nova
de um eixo, gravada depois de uma linha antiga de veredito único, vence para aquele eixo.

Eixo sem veredito escala ao dono com recomendação e motivo, e em modo automático segue a recomendação
registrando débito técnico. O cap de rework passa a ser por eixo e a aprovação forçada nomeia o eixo.

Nenhuma segunda implementação de leitura de linha do log existe no repositório: a busca por leitura do
log de aprovações encontra apenas o leitor da fase 16 e os consumidores dele.

Os quatro runtimes instalam em diretório temporário, emitindo sete comandos, treze agentes e quatro
skills de doutrina, com os dois agentes de eixo presentes e o revisor único ausente. Os sete comandos
resolvem seus workflows. Projeto sem as chaves novas degrada em todos os pontos novos.

Os testes rodam verdes e foram vistos vermelhos antes.

## Tipo de prova

Lógica, vermelho e verde, para a leitura por eixo e a decisão conjuntiva, com as seis fixtures. Smoke
para a regressão dos sete comandos, dos quatro runtimes e do projeto com planejamento antigo.

## FORA DE ESCOPO

Implementar ou duplicar o leitor único do log de aprovações. Ele vem da fase 16. Sem ele, este plano para
na tarefa 1.

Reescrever linhas antigas do log para o formato novo. A compatibilidade é de leitura, e migração
retroativa está declarada como fora de escopo da fase.

Consertar a leitura das duas convenções de nome de plano e de resumo. É requisito da fase 17. Aqui ela é
apenas registrada quando aparecer.

Mudar o escritor oficial das linhas do log além de acrescentar o campo de eixo. O formato de seis colunas
documentado permanece.

Revisão em dois eixos no escopo de planejamento e no de entrega global, e mudança na evidência exigida
por tipo de tarefa.

Marcar requisitos como completos e atualizar o roadmap. Isso é do fechamento de fase do workflow de
construção, que já faz, e duplicar aqui criaria dois escritores para o mesmo artefato.
