---
phase: 17-planejamento-por-grafo
plan: 17-005
type: chore
autonomous: true
plan_format: 2
wave: 2
depends_on: [002, 004]
requirements: [REG-01, REG-02, REG-03]
must_haves:
  truths:
    - "O verbete de onda do glossário interno confere com o comportamento entregue nesta fase, ou a divergência está registrada e fechada"
    - "Os sete comandos continuam funcionando ao fim da fase"
    - "Os quatro runtimes suportados continuam instalando e operando ao fim da fase"
    - "Projeto com planejamento anterior a este ciclo continua funcionando, sem migração"
    - "A suíte de testes desta fase roda inteira e verde numa única passada"
  artifacts:
    - surface: "Registro de fechamento da fase (resumo do plano, entrada no log de aprovações, roadmap e documento de estado)"
      provides: "Evidência do tipo exigido pela fase e posição atualizada do projeto"
    - surface: "Conferência do verbete de onda do glossário interno"
      provides: "Fechamento da janela entre a publicação do glossário e a derivação da fronteira"
  key_links:
    - from: "Comportamento de fronteira derivada entregue nesta fase"
      to: "Verbete de onda do glossário interno"
      via: "Conferência declarada, com degradação quando o glossário ainda não existe"
    - from: "Instalação nos quatro runtimes"
      to: "Sete comandos do produto"
      via: "Smoke de instalação real seguido de inspeção do que foi emitido"
---

# Fase 17 Plano 005: Fechamento, verbete de onda e regressão zero

**Objetivo:** fechar a fase com prova de que nada regrediu e com a janela entre esta fase e a fase irmã de memória do projeto fechada. A fase 14 escreve o verbete de onda na forma derivada, e esta fase confirma que o comportamento entregue é aquele.

**Onda:** 2 (visão de leitura). **Arestas de bloqueio:** planos 002 e 004 desta fase. Motivo real: a conferência do verbete depende do comportamento de fronteira entregue no 002, e a conferência dos planos contra a própria regra depende da checagem entregue no 004. O plano 003 não precisa ser citado aqui, porque ele bloqueia o 004 e já entra por transitividade.

**Estimativa de janela:** plano 3 mil tokens, contexto pré-inlinado 12 mil, leitura dirigida de código 10 mil, escrita e saída 8 mil. Total estimado 33 mil tokens, contra orçamento de 100 mil por plano.

**Requisitos cobertos:** REG-01, REG-02, REG-03. Fecha também os critérios de saída 9 e 10 da fase.

## Superfícies tocadas (contrato, sem caminho)

1. **Glossário interno do produto**, quando existir: apenas o verbete de onda, e apenas se divergir do comportamento entregue.
2. **Instalador multi runtime**: nenhuma alteração. É alvo de execução, e não de edição.
3. **Roadmap, documento de estado e log de aprovações**: registro do fechamento da fase.
4. **Resumo deste plano**: guarda a evidência de cada conferência, com a saída real.

## Contexto necessário

Resumos dos planos 001 a 004 desta fase, roadmap (bloco da fase 17 e o grafo de bloqueio do ciclo), requisitos do projeto (categoria de planejamento por grafo e categoria de regressão zero), desenho do sistema (seção de riscos de contrato).

## Tarefas

### 1. Conferência do verbete de onda

**O que muda:** conferência declarada entre o verbete de onda do glossário interno e o comportamento de fronteira entregue no plano 002.

Contrato, com as três saídas possíveis:

1. **Glossário existe e o verbete confere.** Registrar a conferência no resumo, citando a frase do verbete e o comportamento correspondente. Nada é editado.
2. **Glossário existe e o verbete diverge.** Corrigir apenas o verbete de onda, no máximo duas frases, para descrever a onda como visão derivada da dependência declarada. Nenhum outro verbete é tocado. A correção é registrada como fechamento da janela entre as duas fases.
3. **Glossário ainda não existe**, porque a fase irmã que o publica ainda não fechou. Registrar a pendência explícita no resumo e no documento de estado, com a frase que o verbete precisa conter, e não criar o glossário aqui. Criar o artefato de outra fase quebraria a matriz de escrita por artefato, que existe justamente para impedir dois donos escrevendo o mesmo arquivo com semânticas diferentes.

**Aceite:** uma das três saídas está registrada no resumo, com evidência. A saída 3 não bloqueia o fechamento da fase, porque as duas fases são irmãs independentes no grafo do ciclo.

**Prova:** conferência documental registrada.

### 2. Regressão dos sete comandos

**O que muda:** nada. É conferência.

Contrato: cada um dos sete comandos do produto é conferido quanto a duas coisas: a definição continua íntegra, com área de metadados válida e referência ao fluxo correspondente resolvível, e nenhum dos fluxos alterados nesta fase perdeu passo que existia antes. Os fluxos alterados nesta fase são o de planejamento e o de execução de fase.

**Aceite:** os sete comandos passam. Qualquer referência quebrada é corrigida dentro desta fase, porque referência quebrada por alteração desta fase é regressão desta fase.

**Prova:** smoke, com a saída registrada no resumo.

### 3. Regressão dos quatro runtimes

**O que muda:** nada. É execução real de instalação.

Contrato:

1. Rodar a instalação para cada um dos quatro runtimes suportados, em diretório de configuração temporário, sem tocar a configuração real da máquina.
2. Conferir, por runtime, que os sete comandos foram emitidos no formato daquele runtime, que as quatro skills de doutrina continuam presentes, e que o bloco de arranque continua sendo injetado onde o runtime não tem gancho nativo.
3. Conferir que a instalação para o runtime nativo continua emitindo também os comandos como skills invocáveis, que foi o que a fase 11 entregou.
4. Nenhuma bandeira nova e nenhum alvo novo de instalação aparecem.

**Aceite:** os quatro runtimes instalam, e as três conferências por runtime passam.

**Prova:** smoke, com a saída registrada no resumo.

### 4. Projeto anterior a este ciclo

**O que muda:** nada. É conferência sobre estado já gravado.

Contrato:

1. Sobre as fases já gravadas neste repositório, o inventário, o índice, o progresso e o status devolvem resposta coerente com o disco, e a ordem de execução derivada é a mesma de antes desta fase.
2. Sobre um diretório de planejamento sintético, gravado no formato anterior ao ciclo, sem dependência declarada, sem seção de fora de escopo, sem estimativa de janela e com caminho de arquivo no corpo do plano: a leitura funciona, a ordem sai pela onda numerada, e as três ausências produzem aviso e nenhuma reprovação.
3. Nenhuma migração é executada, e nenhum arquivo de projeto antigo é reescrito.

**Aceite:** as três conferências passam, e a lista de avisos do caso sintético traz exatamente as três ausências esperadas.

**Prova:** smoke, com a saída registrada no resumo.

### 5. Suíte da fase inteira

**O que muda:** nada de código. É execução consolidada.

Contrato: os arquivos de teste criados nesta fase, o da biblioteca de planos e o do módulo de checagem, mais o teste já existente da biblioteca de integração com repositório, rodam numa única passada e saem verdes. Nenhum deles depende de rede, e cada um cria e apaga o próprio estado temporário.

**Aceite:** a passada completa sai com código de saída zero, e a contagem total de casos aparece no resumo.

**Prova:** lógica, com a saída registrada no resumo.

### 6. Autoaplicação final e conferência de escrita

**O que muda:** nada de código.

Contrato:

1. A operação de validação de plano roda sobre os cinco planos desta fase e sobre os resumos gerados, e todos passam nas regras entregues nos planos 003 e 004.
2. Os artefatos escritos nesta fase respeitam as regras de escrita do projeto: português acentuado, e nenhuma ocorrência de travessão longo nem de travessão médio.

**Aceite:** as duas conferências passam, e qualquer ocorrência encontrada é corrigida antes do fechamento.

**Prova:** execução registrada no resumo.

### 7. Registro do fechamento

**O que muda:** o estado do projeto passa a refletir a fase entregue.

Contrato:

1. Entrada no log de aprovações, no formato documentado de seis colunas emitido pelo escritor oficial, com o escopo da fase e a evidência do tipo exigido pela fase, que é lógica com vermelho e verde.
2. Roadmap atualizado: a fase 17 marcada como concluída, com a contagem de planos e a data, e a linha da tabela de progresso correspondente.
3. Documento de estado atualizado com a posição nova, as decisões registradas nos planos desta fase e o próximo comando sugerido.
4. As pendências que saem desta fase ficam registradas em uma linha cada: a conferência do verbete quando ela caiu na saída 3 da tarefa 1, e o passe de corte de sedimento nos templates.

**Aceite:** as quatro escritas estão feitas, e o log de aprovações tem a entrada da fase legível pelo leitor do gate.

**Prova:** conferência documental registrada.

## Critério de aceite do plano

1. O verbete de onda está conferido, corrigido ou registrado como pendência, conforme a saída aplicável.
2. Os sete comandos passam na conferência de integridade.
3. Os quatro runtimes instalam e emitem o que devem emitir.
4. Projeto anterior a este ciclo continua funcionando, e as ausências de campo novo produzem aviso e não reprovação.
5. A suíte completa da fase sai verde numa única passada.
6. Os cinco planos desta fase passam nas próprias regras.
7. Nenhum artefato desta fase contém travessão longo ou médio.
8. O fechamento está registrado no log de aprovações, no roadmap e no documento de estado.

## Tipo de prova

Smoke para regressão de comandos, runtimes e projeto antigo. Lógica para a passada consolidada dos testes. Conferência documental para o verbete e para o registro de fechamento.

## Fora de escopo

1. Escrever o glossário interno. Ele é artefato da fase irmã de memória do projeto, e criar aqui daria dois donos ao mesmo arquivo.
2. Corrigir verbete diferente do de onda, mesmo que pareça errado. A janela declarada entre as duas fases é a de onda, e alargar a conferência inventaria escopo que não foi acordado.
3. Passe de corte de sedimento nos templates. Tem briefing próprio.
4. Publicar versão nova do pacote. A publicação acontece no fechamento do ciclo, e não por fase.
5. Alterar instalador ou runtime além do que os artefatos desta fase exigirem. A fronteira do ciclo declara isso.

## Colisões conhecidas

As fases irmãs de memória do projeto, de honestidade da prova e de contexto e revisão rodam em paralelo com esta no grafo do ciclo. A conferência de regressão desta fase cobre apenas o que esta fase alterou. Achado que venha de fase irmã é registrado e devolvido para ela, e não corrigido aqui, porque corrigir trabalho de fase irmã em paralelo produz conflito no merge e apaga a autoria do defeito.

## Decisões registradas

**Decisão 1. Ausência do glossário não bloqueia o fechamento desta fase.** Alternativa rejeitada: fazer esta fase depender da fase irmã que publica o glossário. Rejeitada porque inverteria o grafo do ciclo, que declara as duas como irmãs independentes, e serializaria duas fases que não precisam ser serializadas. A janela entre elas é fechada por conferência, e não por dependência.

**Decisão 2. A correção admitida aqui é apenas no verbete de onda.** Alternativa rejeitada: corrigir o glossário inteiro quando ele existir. Rejeitada porque a matriz de escrita por artefato dá um dono por artefato, e o custo de dois donos é maior que o de uma pendência registrada.
