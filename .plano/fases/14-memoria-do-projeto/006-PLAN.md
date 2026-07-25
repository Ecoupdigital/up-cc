---
phase: 14-memoria-do-projeto
plan: 006
type: chore
autonomous: true
wave: 3
depends_on: ["001", "002", "003", "004", "005"]
requirements: [REG-01, REG-02, REG-03]
files_modified:
  - up/bin/lib/memoria-e2e.test.cjs
  - .plano/REQUIREMENTS.md
must_haves:
  truths:
    - "Nenhum dos três artefatos de memória do projeto existe antes de haver conteúdo real para escrever nele"
    - "Uma decisão que falha uma condição não gera registro, e uma que passa gera registro numerado com alternativas rejeitadas"
    - "Propor de novo um conceito já recusado devolve a rejeição anterior antes de explorar a intenção"
    - "Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior ao ciclo continua funcionando sem migração"
  artifacts:
    - path: "up/bin/lib/memoria-e2e.test.cjs"
      provides: "Prova ponta a ponta dos critérios 3 e 4 do briefing, em projeto temporário"
  key_links:
    - from: "up/bin/lib/memoria-e2e.test.cjs"
      to: "todos os submódulos do espaço memoria"
      via: "execução real do binário de ferramentas contra um projeto temporário, na ordem em que o dono usaria"
---

# Fase 14 Plano 006: Prova ponta a ponta e regressão zero

<objective>
Provar a fase inteira do jeito que ela vai ser usada: um projeto temporário sem memória nenhuma, um fluxo de decisão e de rejeição do começo ao fim, e a confirmação de que os sete comandos, os quatro runtimes e um projeto planejado antes deste ciclo continuam funcionando sem migração.
</objective>

**Onda:** 3. Depende dos cinco planos anteriores, porque a prova é sobre o conjunto e não sobre as peças.

**Bloqueia:** o fechamento da fase.

## Contexto

Cada plano anterior prova a sua peça. Esta prova é outra: ela roda o caminho que o dono percorre, na ordem em que ele percorre, e é a única que pode mostrar que a criação preguiçosa continua preguiçosa depois de tudo instalado. A regressão zero é critério de saída de toda fase deste ciclo, então ela é medida aqui e não presumida.

O ponto de honestidade deste plano: a metade mecânica dos critérios 3 e 4 do briefing é testável (arquivo não nasce, gate recusa, numeração cresce, consulta devolve a rejeição anterior). A metade de doutrina (o agente consultar antes de explorar) é verificada por leitura da seção entregue pelo plano 005, e o resumo declara essa separação em vez de fingir que o teste cobre as duas.

@up/bin/lib/github.test.cjs - único teste do lado UP antes desta fase
@.plano/BRIEFING-tier-ab-grill.md - critérios de sucesso 3, 4 e 12, que este plano prova

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/memoria-e2e.test.cjs (novo)</files>
<contrato>Teste ponta a ponta, no mesmo padrão dos demais testes do lado UP. Não chama módulo por dentro: executa o binário de ferramentas de verdade, contra um projeto temporário com diretório de planejamento vazio, na ordem de uso real.</contrato>
<action>
Escrever a jornada do critério 3 do briefing, em um único caso encadeado.

Estado inicial: projeto temporário com o diretório de planejamento criado e nada dentro. Conferir que o glossário do projeto, o diretório de decisões e o diretório de rejeições não existem.

Consulta em base vazia: rodar a busca de rejeição e a listagem de termos, conferir saída vazia, código de saída zero e, principalmente, que nenhum arquivo nasceu. Este é o coração da criação preguiçosa: leitura nunca cria.

Decisão recusada: rodar a criação de decisão faltando a justificativa de trade-off, conferir código de saída 1 e que o diretório de decisões continua inexistente. Repetir faltando a de reversão. Repetir sem alternativa nenhuma.

Decisão aceita: rodar a criação completa, com duas alternativas rejeitadas, conferir que o arquivo nasceu com o número inicial, que ele contém as alternativas com o motivo de cada uma e que o diretório nasceu agora.

Segunda decisão: rodar outra criação completa e conferir que o número é o seguinte, distinto e crescente.

Termo do projeto: rodar o registro de um termo de domínio, conferir que o glossário do projeto nasceu agora e que o cabeçalho traz a regra de admissão e a regra de higiene.
</action>
<aceite>O caso encadeado passa inteiro. Em cada ponto de recusa, a checagem de existência confirma que nada foi criado. Ao final, existem exatamente dois registros de decisão e um glossário de projeto com um termo.</aceite>
<prova>smoke: execução do teste com a saída colada no resumo do plano, correspondendo ao critério 3 do briefing.</prova>
</task>

<task id="2" type="auto">
<files>up/bin/lib/memoria-e2e.test.cjs</files>
<contrato>Jornada do critério 4 do briefing: propor de novo algo já recusado traz a rejeição anterior à tona antes de explorar.</contrato>
<action>
Escrever a segunda jornada, também encadeada, no mesmo projeto temporário.

Registro da recusa: gravar uma rejeição estrutural com título de conceito e ao menos um apelido, conferir que a base nasceu agora.

Reproposta: rodar a busca com um pedido escrito com as palavras do conceito, conferir que o achado volta com o motivo original, a data e a pergunta pronta, e que a pergunta traz a semelhança, o motivo e a recomendação com o porquê.

Pedido diferente: rodar a busca com um pedido que compartilha uma única palavra com o conceito recusado e conferir que não há achado. Este caso é o que separa memória útil de aviso que o dono aprende a ignorar.

Portas fechadas: tentar registrar uma rejeição com motivo de item já implementado e conferir a recusa; tentar com motivo de adiamento e conferir a recusa; conferir que nenhuma das duas criou arquivo novo.
</action>
<aceite>A reproposta pelo conceito casa, o pedido com palavra solta não casa, e as duas portas fechadas recusam com código de saída 1 sem criar arquivo.</aceite>
<prova>smoke: execução do teste com a saída colada no resumo, correspondendo ao critério 4 do briefing.</prova>
</task>

<task id="3" type="auto">
<files>nenhum arquivo alterado (tarefa de prova)</files>
<contrato>Regressão dos quatro runtimes. Instalação real em diretório temporário, com o modo local, para nunca tocar a configuração do dono.</contrato>
<action>
Instalar o pacote em diretório temporário para todos os runtimes, com o modo local. Conferir, por runtime, a superfície completa.

No alvo do Claude: sete comandos em forma de arquivo de comando, doze agentes, as quatro skills de doutrina e as sete skills de comando, o glossário presente entre as references e os hooks configurados.

No alvo do Gemini: sete comandos convertidos para o formato de configuração daquele runtime, doze agentes convertidos e o bloco de bootstrap presente no arquivo de instruções global, agora citando o glossário.

No alvo do OpenCode: sete comandos achatados com prefixo, doze agentes convertidos e o bloco de bootstrap no arquivo de instruções.

No alvo do Codex: sete pastas de skill de comando, cada uma com o arquivo de skill e o arquivo de configuração do agente, doze agentes convertidos e o bloco de bootstrap no arquivo de instruções.

Em todos os quatro: vinte references, incluindo o glossário. Remover o diretório temporário ao final e colar as contagens no resumo.
</action>
<aceite>As quatro instalações completam sem falha, e todas as contagens acima batem. Nenhuma configuração real do dono foi tocada, o que é garantido pelo modo local dentro do diretório temporário.</aceite>
<prova>smoke: saída da instalação e das listagens por runtime, colada no resumo. Cobre os requisitos de regressão de comandos e de runtimes.</prova>
</task>

<task id="4" type="auto">
<files>nenhum arquivo alterado (tarefa de prova)</files>
<contrato>Regressão de projeto anterior a este ciclo: diretório de planejamento antigo continua funcionando, sem migração e sem criação de artefato novo por baixo do pano.</contrato>
<action>
Montar um projeto temporário com um diretório de planejamento no formato anterior a este ciclo: documento de estado, roadmap e requisitos, sem glossário de projeto, sem diretório de decisões e sem base de rejeições.

Rodar as operações de leitura que o sistema faz sozinho: carga de estado, análise de roadmap, índice de planos de uma fase e as três consultas de memória. Conferir que todas devolvem código de saída zero, que nenhuma reclama de artefato ausente e que nenhuma criou arquivo ou diretório.

Repetir as três consultas de memória no próprio repositório do UP, que tem diretório de planejamento do ciclo anterior, e conferir o mesmo resultado, com atenção especial a nenhum diretório novo aparecer no estado do repositório.
</action>
<aceite>Todas as operações respondem com código zero, e a listagem do diretório de planejamento antes e depois é idêntica nos dois projetos. A árvore de trabalho do repositório continua limpa depois da checagem.</aceite>
<prova>smoke: comparação da listagem antes e depois, mais o estado do repositório, colados no resumo. Cobre o requisito de regressão de projeto anterior ao ciclo.</prova>
</task>

<task id="5" type="auto">
<files>nenhum arquivo alterado (tarefa de prova)</files>
<contrato>Bateria completa dos testes do lado UP, incluindo o teste que existia antes desta fase, para provar que nada regrediu no que já estava verde.</contrato>
<action>
Rodar, em sequência, os cinco testes do lado UP: o de integração com repositório, que já existia, e os quatro criados nesta fase (decisão, rejeições, glossário e termo), mais o teste ponta a ponta deste plano.

Rodar também a contagem de redefinição sobre as seis pastas, agora sem recorte, e a cobertura de citação, as duas em modo estrito, conferindo código de saída zero nas duas. Se o plano 004 tiver encaminhado algum achado em skill de outro dono, ele é resolvido aqui, porque nesta onda não há mais escrita concorrente no arquivo.

Colar no resumo a linha final de cada execução, com a contagem de aprovados e reprovados.
</action>
<aceite>Todas as execuções terminam com código de saída zero. O teste que existia antes da fase continua passando, sem alteração no arquivo dele.</aceite>
<prova>smoke: saída consolidada das execuções, colada no resumo.</prova>
</task>

<task id="6" type="auto">
<files>.plano/REQUIREMENTS.md</files>
<contrato>Fechamento de rastreabilidade. Só marca o que tem evidência coletada nas tarefas anteriores desta fase e nos resumos dos planos 001 a 005.</contrato>
<action>
Marcar como completos os requisitos de memória do projeto, do primeiro ao décimo segundo, usando a operação de marcação de requisitos da linha de comando de ferramentas, e não edição manual do arquivo.

Antes de marcar, montar no resumo do plano a tabela de rastreabilidade, uma linha por requisito, apontando o plano que o entregou e a evidência que o prova. Requisito sem evidência não é marcado, e a ausência é declarada no resumo em vez de escondida.

Os três requisitos de regressão zero não são marcados como completos aqui, porque valem como critério de saída de cada uma das fases 13 a 20 e só fecham no fim do ciclo. A evidência coletada nas tarefas 3, 4 e 5 é registrada no resumo como cumprimento do critério desta fase.
</action>
<aceite>Os doze requisitos de memória aparecem marcados no arquivo de requisitos. Os três de regressão continuam pendentes. A tabela de rastreabilidade do resumo tem uma linha por requisito, com plano e evidência.</aceite>
<prova>smoke: diff do arquivo de requisitos mostrando apenas as doze marcações, mais a tabela do resumo.</prova>
</task>

## Critérios de Sucesso

- [ ] Nenhum arquivo de glossário, de decisão ou de rejeição existe antes de haver conteúdo real
- [ ] Decisão que falha uma condição não gera registro, e a que passa gera registro numerado com alternativas rejeitadas
- [ ] Dois registros em sequência recebem números distintos e crescentes
- [ ] Repropor um conceito recusado devolve a rejeição anterior, e compartilhar uma palavra solta não devolve nada
- [ ] Item já implementado e adiamento não entram na base
- [ ] Os sete comandos e os quatro runtimes continuam funcionando, provado por instalação real
- [ ] Projeto com planejamento anterior ao ciclo continua funcionando sem migração e sem ganhar artefato por baixo do pano
- [ ] A bateria completa de testes do lado UP termina verde, incluindo o teste que já existia

## FORA DE ESCOPO

Este plano não faz, e o executor não deve fazer:

- Corrigir achado sem registrar. Nesta onda não há escrita concorrente, então corrigir uma redefinição remanescente é permitido, desde que o resumo diga qual arquivo, qual linha e por quê. O que não é permitido é remendo silencioso, nem reescrita de redação que não seja definição de termo do glossário.
- Entrada de changelog ou mudança de versão do pacote. Release é ato separado de fase.
- Marcar os requisitos de regressão zero como completos. Eles fecham no fim do ciclo, não aqui.
- Popular glossário, decisões ou base de rejeições deste repositório com conteúdo real. Os artefatos temporários da prova vivem em diretório temporário do sistema e são removidos ao final.
- Tocar qualquer arquivo de código dos planos anteriores. Este plano só acrescenta o teste ponta a ponta e fecha a rastreabilidade.
- Verificar comportamento de fases futuras (questionamento profundo, fronteiras de teste, grafo de dependência, handoff, auditoria). Nada disso existe ainda, e cobrar aqui produziria falha falsa.
