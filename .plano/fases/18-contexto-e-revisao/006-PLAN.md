---
phase: 18-contexto-e-revisao
plan: 006
type: glue
autonomous: true
wave: 3
depends_on: ["002", "004"]
requirements: [REV-02, REV-03, REV-06]
objective: "Fan-out paralelo dos dois eixos com falha rapida antes e relatorio lado a lado depois, sem fusao"
prova: smoke mais logica (vermelho e verde) nas funcoes deterministicas
files_modified:
  - up/bin/lib/revisao.cjs
  - up/bin/lib/revisao.test.cjs
  - up/bin/up-tools.cjs
  - up/workflows/build.md
must_haves:
  truths:
    - "Referencia invalida e diff vazio falham antes do fan-out, sem gastar dois subagentes"
    - "Os dois eixos rodam em paralelo e sao reportados lado a lado, sob cabecalhos separados"
    - "Nenhum achado migra de eixo e nenhuma ordem entre eixos e alterada"
    - "O resumo final apresenta o pior problema dentro de cada eixo, e nunca elege um vencedor unico"
  artifacts:
    - path: "up/bin/lib/revisao.cjs"
      provides: "Pre-checagem, validacao de ancora, teto de saida e montagem do relatorio lado a lado"
    - path: "up/workflows/build.md"
      provides: "Estagio de revisao com falha rapida, fan-out paralelo e pos-processamento deterministico"
  key_links:
    - from: "up/workflows/build.md"
      to: "up/agents/up-revisor-conformidade.md e up/agents/up-revisor-qualidade.md"
      via: "dois disparos de subagente numa unica mensagem do orquestrador"
---

# Fase 18 Plano 006: Orquestração paralela e relatório lado a lado

**Onda**: 3 (depende do plano 004, que cria os dois agentes, e do plano 002, que já tocou o workflow de
construção na onda anterior)

## Objetivo

Fazer os dois eixos rodarem de verdade em paralelo e chegarem ao dono lado a lado, sem fusão e sem
vencedor único. E, antes de gastar dois subagentes, falhar barato quando a rodada nem deveria começar.

A fusão é o risco central deste plano. Se em algum ponto os achados dos dois eixos entrarem numa lista só
e forem ordenados por severidade, a separação inteira vira decoração: o problema de segurança volta a ser
escondido, agora por ordenação em vez de por sequência travada. Por isso a montagem do relatório é
determinística e mecânica, e não trabalho de modelo.

## Contexto

Ler antes de começar: `.plano/fases/18-contexto-e-revisao/CONTEXT.md` (decisão P3),
`up/workflows/build.md` no estágio de revisão da fase e no estágio de qualidade global,
`up/agents/up-revisor-conformidade.md` e `up/agents/up-revisor-qualidade.md` (formato de achado, rótulo de
âncora e campos de frontmatter do relatório, fixados no plano 004), e a função de execução de git em
`up/bin/lib/core.cjs`, que já devolve código, saída e erro em vez de lançar.

Regra dura de edição do despachante: nunca reescrever `up/bin/up-tools.cjs` inteiro. Somente edição por
âncora, relendo o arquivo imediatamente antes.

## Tarefas

### 1. Escrever os testes das funções determinísticas e vê-los falhar

Criar `up/bin/lib/revisao.test.cjs`, no formato sem framework do repositório, sobre repositórios git
temporários, como o teste de integração com repositório já faz hoje.

Casos de pré-checagem: referência inexistente devolve falha com motivo de referência inválida, e nenhum
subagente é sugerido. Referência válida com diff vazio devolve falha com motivo de diff vazio. Referência
válida com um arquivo alterado devolve sucesso, a referência resolvida e a lista de arquivos.

Casos de disponibilidade de spec: projeto com arquivo de requisitos contendo identificadores devolve
disponível, com a fonte e a quantidade. Projeto sem arquivo devolve indisponível. Projeto com arquivo mas
sem nenhum identificador devolve indisponível, porque arquivo vazio não é spec.

Casos de âncora, eixo de conformidade: achado com rótulo de âncora citando identificador que existe no
bloco de requisitos é mantido. Achado com identificador que não existe é descartado. Achado sem rótulo de
âncora é descartado. A contagem de descartados aparece no resultado.

Casos de âncora, eixo de qualidade: achado cujo caminho e linha caem dentro de um trecho alterado do diff
é mantido. Achado cujo caminho não foi tocado é descartado. Achado cujo caminho foi tocado mas a linha
está fora dos trechos alterados é descartado.

Casos de teto: corpo com trezentas e noventa e nove palavras passa intacto e sem aviso. Com quatrocentas
e uma, é cortado, o aviso de truncamento aparece e a contagem de omitidas está correta. O frontmatter não
entra na contagem.

Casos de montagem, que são os mais importantes: dados dois relatórios de eixo, a saída tem exatamente dois
cabeçalhos de eixo, na ordem fixa, e todo achado aparece sob o cabeçalho do eixo que o produziu. Um achado
de severidade crítica no eixo de qualidade e um de severidade média no eixo de conformidade produzem um
resumo com duas linhas, uma por eixo, e nenhuma linha que eleja um vencedor entre eixos. A ordem dos
achados dentro de cada eixo é a mesma que veio do eixo. Com um eixo pulado, a saída ainda tem os dois
cabeçalhos, e o pulado traz a razão em vez de achados.

Rodar e registrar a saída vermelha.

### 2. Implementar a biblioteca de revisão

Criar `up/bin/lib/revisao.cjs`, CommonJS, sem dependência externa, exportando por objeto literal.

A pré-checagem recebe o diretório e a referência, resolve a referência com git, coleta os arquivos
alterados e os intervalos de linha alterados, e devolve sucesso ou falha com motivo. Ela nunca lança:
usa a função de execução de git que já devolve estrutura.

A disponibilidade de spec procura primeiro o recorte de requisitos da fase e depois o arquivo global,
conta identificadores no formato de sigla e número, e devolve disponibilidade, fonte e quantidade.

A validação de âncora recebe o corpo do relatório, o eixo e o contexto do eixo, que é a lista de
identificadores de requisito no caso da conformidade e o mapa de arquivo para intervalos alterados no
caso da qualidade. Devolve o corpo já sem os achados descartados, mais as contagens de mantidos e
descartados e o motivo de cada descarte.

A aplicação de teto conta as palavras do corpo, ignorando o frontmatter, corta pelo fim ao ultrapassar,
acrescenta a linha de aviso com o número de palavras omitidas e devolve o corpo, a contagem original e a
marca de truncamento.

A montagem recebe os dois relatórios de eixo já validados e já limitados e devolve o relatório único.
Ela é mecânica por design: concatena na ordem fixa, sob os dois cabeçalhos de eixo, sem ordenar, sem
deduplicar e sem mover nada entre eixos. Em seguida escreve o resumo, com exatamente uma linha por eixo,
cada uma nomeando o pior achado daquele eixo, lido do frontmatter do relatório do eixo. Não existe caminho
de código que compare severidades de eixos diferentes, e isso fica escrito em comentário no ponto onde a
tentação apareceria.

### 3. Ligar os casos de revisão no despachante

Em `up/bin/up-tools.cjs`, acrescentar o caso de revisão com quatro subcomandos, um por função pública da
biblioteca: pré-checagem, validação de âncora, aplicação de teto e montagem do relatório. Todos aceitam
diretório e saída crua.

A pré-checagem sai com código diferente de zero quando falha, para o workflow poder abortar em shell sem
parsear JSON, e escreve o motivo. Este é o ponto de falha rápida: ele custa uma chamada de git e nenhum
subagente.

Aproveitar a mesma edição para limpar a entrada órfã do manifesto de referências por agente, que ainda
cita o revisor único removido no plano 004, e acrescentar as entradas dos dois agentes de eixo. O eixo de
qualidade recebe as mesmas referências que o revisor antigo recebia; o eixo de conformidade não recebe
nenhuma, porque ele não lê referência de código.

Atualizar a lista de subcomandos no cabeçalho do arquivo.

### 4. Reescrever o estágio de revisão da fase no workflow de construção

Em `up/workflows/build.md`, reescrever o estágio que hoje dispara o revisor único, na seguinte ordem.

Primeiro, a falha rápida. Resolver a referência da fase, isto é, o intervalo entre a base e a cabeça da
branch da fase, e rodar a pré-checagem. Se falhar, parar o estágio, informar o motivo ao dono e não
disparar subagente nenhum. Deixar escrito no workflow por que a ordem é essa: referência ruim ou diff
vazio falhando dentro de dois subagentes custa duas janelas e devolve dois relatórios vazios.

Segundo, a disponibilidade de spec. Rodar a checagem. Indisponível significa que o eixo de conformidade
não é disparado, e o relatório dele é gerado direto com veredito de eixo pulado e a razão. Não é o agente
que decide pular: ele nem nasce.

Terceiro, subir a aplicação quando a fase tem interface, guardar o endereço base e passá-lo no prompt do
eixo de conformidade, que não tem como subir nada por não ter execução de comando. Derrubar a aplicação
ao fim do estágio, no mesmo ponto onde a limpeza já acontece hoje.

Quarto, o fan-out. Disparar os dois agentes numa única mensagem do orquestrador, que é o que torna a
execução paralela de fato. O prompt do eixo de conformidade carrega o bloco de requisitos inlinado, o
endereço base e o caminho do relatório que ele deve escrever. O prompt do eixo de qualidade carrega a
referência resolvida, a lista de arquivos alterados e o caminho do relatório dele. Nenhum dos dois recebe
o relatório do outro, nem a ordem de esperar pelo outro.

Quinto, o pós-processamento determinístico, por eixo: validar âncoras e aplicar teto, nesta ordem, porque
cortar antes de validar poderia deixar o corte em cima de um achado que seria descartado de qualquer jeito.

Sexto, a montagem do relatório único da fase, com os dois cabeçalhos e o resumo por eixo, no arquivo de
revisão da fase que o gate já conhece.

Deixar escrito, no ponto da montagem, que é proibido fundir ou reordenar achados entre eixos, e por quê.

### 5. Renomear o revisor no estágio de qualidade global

Ainda em `up/workflows/build.md`, no estágio final de qualidade global, trocar o nome do revisor único
pelo eixo de qualidade, sem mudar o que aquele estágio faz. O escopo de entrega continua com um eixo, e
isso está declarado como fora de escopo no contexto da fase.

### 6. Ver os testes passarem e rodar o smoke da rodada

Rodar o arquivo de teste e registrar a saída verde.

Smoke da falha rápida: chamar a pré-checagem com uma referência inexistente e conferir que sai com código
diferente de zero e motivo, e que nenhum subagente foi disparado. Repetir com diff vazio.

Smoke da rodada com fusão proibida: montar dois relatórios de eixo de teste, um com achado crítico de
segurança e outro com achado médio de conformidade, rodar a montagem e conferir na saída que existem dois
cabeçalhos, que cada achado está sob o cabeçalho do próprio eixo, que o resumo tem duas linhas e que
nenhuma linha do resumo compara os dois eixos entre si. Este é o critério 10 do briefing, que é a prova
exigida da fase, e a saída dele entra no resumo do plano.

Smoke do eixo pulado: montar a rodada com spec indisponível e conferir que o relatório sai com os dois
cabeçalhos, que o de conformidade traz a razão do pulo e que nenhum requisito foi inventado.

## Arquivos tocados com contrato

| Arquivo | Contrato |
|---------|----------|
| `up/bin/lib/revisao.cjs` | Novo. Pré-checagem de referência e diff, disponibilidade de spec, validação de âncora por eixo, aplicação de teto e montagem mecânica do relatório. Nunca lança, nunca ordena entre eixos |
| `up/bin/lib/revisao.test.cjs` | Novo. Testes sem framework, sobre repositórios git temporários, das regras de pré-checagem, âncora, teto e montagem |
| `up/bin/up-tools.cjs` | Editado por âncora, nunca reescrito. Caso de revisão com quatro subcomandos, mais a correção do manifesto de referências por agente |
| `up/workflows/build.md` | Editado no estágio de revisão da fase, que é reescrito na ordem falha rápida, disponibilidade de spec, subida da aplicação, fan-out paralelo, pós-processamento e montagem, e no estágio de qualidade global, apenas para renomear o revisor. O gate não é tocado aqui |

## Critério de aceite

Referência inválida e diff vazio fazem a rodada parar antes do fan-out, com motivo, sem disparar
subagente. Sem spec disponível, o eixo de conformidade não é disparado e o relatório dele registra a
ausência com a razão.

Os dois agentes são disparados numa única mensagem do orquestrador. O relatório da fase tem exatamente
dois cabeçalhos de eixo, na ordem fixa, com cada achado sob o cabeçalho do eixo que o produziu e na ordem
em que veio. O resumo tem uma linha por eixo, cada uma nomeando o pior achado daquele eixo, e nenhuma
linha que eleja um vencedor entre eixos.

Achado sem âncora válida não aparece no relatório, e a contagem de descartados aparece. Corpo acima do
teto é cortado com aviso e contagem de omitidas.

Os testes rodam verdes e foram vistos vermelhos antes.

## Tipo de prova

Smoke para a rodada completa, conforme a tarefa 6, incluindo o cenário do critério 10 do briefing.
Lógica, vermelho e verde, para as quatro funções determinísticas da biblioteca.

## FORA DE ESCOPO

O gate. Quem lê o veredito, escreve no log de aprovações, aplica a regra conjuntiva e decide o que
reexecutar na rodada de correção é o plano 007. Este plano produz os dois relatórios e para aí.

O conteúdo dos agentes de eixo. Vem pronto do plano 004. Se um formato de achado não bater com o
validador, corrigir o validador ou escalar, nunca reescrever o agente por conta própria, porque o
contrato foi fixado lá.

Revisão em dois eixos no escopo de planejamento e no de entrega global. Continuam com um eixo.

Mudar a evidência exigida por tipo de tarefa, a derivação do tipo agregado da fase ou o cap de rework.
São contrato existente e pertencem ao gate.

Qualquer mudança no laço de detectar, corrigir e reverificar, que roda antes deste estágio e produz parte
da evidência que o gate confere.
