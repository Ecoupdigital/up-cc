---
phase: 18-contexto-e-revisao
plan: "007"
type: logic
autonomous: true
wave: 4
depends_on: ["003", "005", "006"]
requirements: [REV-09, REG-01, REG-02, REG-03]
objective: "Gate conjuntivo por eixo sobre o leitor unico da fase 16, mais a regressao zero da fase"
prova: "logic:test_pass (vermelho e verde sobre seis fixtures de gate) mais smoke de regressao"
files_modified:
  - up/bin/lib/revisao.cjs
  - up/bin/lib/revisao.test.cjs
  - up/bin/up-tools.cjs
  - up/workflows/governance.md
  - up/workflows/build.md
  - .plano/fases/18-contexto-e-revisao/evidencia/007-red.txt
  - .plano/fases/18-contexto-e-revisao/evidencia/007-green.txt
  - .plano/fases/18-contexto-e-revisao/evidencia/007-regressao.txt
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
      to: "up/bin/lib/gate.cjs"
      via: "consumo do leitor unico entregue pela fase 16, sem reimplementar leitura de linha"
---

# Fase 18 Plano 007: Gate conjuntivo por eixo e regressão zero

<objective>
Fazer o gate representar veredito por eixo e aplicar a regra conjuntiva do dono, construindo sobre o leitor único da fase 16 e sobre o bloco de gate que ela já religou, e fechar a fase provando que os sete comandos, os quatro runtimes e o projeto com planejamento antigo continuam funcionando.
</objective>

**Onda:** 4. **Depende de:** planos 003, 005 e 006 desta fase, e da fase 16, que entrega o leitor único e o bloco de gate religado.
**Tipo de prova:** lógica, vermelho e verde, sobre seis fixtures de gate. Smoke para a regressão dos sete comandos, dos quatro runtimes e do projeto antigo.

## O estado que hoje não é representável

A fase tem um veredito só. Quando a conformidade reprova e a qualidade aprova, ou o log mente ou a
informação se perde. A regra é a decisão travada do dono: o gate é conjuntivo, a fase só aprova com os
dois eixos aprovados, e o eixo que já aprovou fica registrado e não é reexecutado na rodada de correção.

## De onde este plano parte

A fase 16 fecha antes desta, por aresta declarada no roadmap e no contexto da fase. Quando este plano
roda, o bloco de gate do workflow de construção e o do workflow de governança já foram religados por ela
e chamam o subcomando de veredito do leitor único, com campo escalar. O ponto de partida deste plano é
esse bloco, e não o bloco de hoje com busca por nome de agente e leitura de coluna por posição. Partir do
bloco antigo reverteria a entrega da fase 16 sem que a verificação dela percebesse.

## Contexto

@.plano/fases/18-contexto-e-revisao/CONTEXT.md - decisões D1, D2 e P3, e a aresta com a fase 16
@.plano/SYSTEM-DESIGN.md - seção 5.1, com as três formas reais do log e os três pontos de quebra
@up/bin/lib/gate.cjs - leitor único entregue pela fase 16
@up/workflows/governance.md - contrato do log e gate já religado ao leitor
@up/workflows/build.md - gate de fase e processamento do veredito, já religados ao leitor
@up/bin/lib/revisao.cjs - biblioteca entregue no plano 006, que este plano estende

## Tarefas

<task id="1" type="auto">
<files>nenhum arquivo escrito (verificação de pré-condição; escala e para quando falha)</files>
<action>
Localizar o leitor único da fase 16 e PARAR se ele não existir.

O leitor é a função que localiza os campos por conteúdo e não por posição: escopo pelo número da fase em qualquer notação, veredito pela palavra de veredito e evidência pelo prefixo do campo, funcionando com ou sem a coluna do agente, descartando apenas a linha que não carrega veredito nenhum. A fase 16 o entrega como biblioteca de domínio com quatro funções exportadas, e o expõe na CLI com dois subverbos, um de veredito e um de entradas.

Conferir três coisas: que a biblioteca existe e exporta as quatro funções; que o subcomando responde contra o log real deste repositório devolvendo aprovação para as fases 11 e 12; e que os blocos de gate do workflow de construção e do de governança já chamam o subcomando, o que confirma que a fase 16 fechou.

Se qualquer uma das três falhar, este plano PARA aqui. Registrar o bloqueio, escalar ao dono e não seguir para a tarefa 2. É proibido escrever uma segunda implementação de leitura de linha do log, ainda que pareça barato: duas leituras divergentes do mesmo arquivo é o defeito que a fase 16 existe para consertar, e recriá-lo aqui anularia as duas fases.

Se o leitor existir mas não expuser, por entrada, o dado que permite distinguir o eixo, estender o leitor da fase 16 para expor esse dado. Estender o leitor único continua sendo um leitor único; parsear o log de novo, não.
</action>
<verify><automated>test -f up/bin/lib/gate.cjs && node -e "const g=require('./up/bin/lib/gate.cjs'); for (const f of ['parseApprovalLine','readApprovals','verdictForPhase','evaluateGate']) if(typeof g[f]!=='function') throw new Error('faltando '+f);" && node up/bin/up-tools.cjs gate verdict --phase 11 --field decision | grep -q APPROVE && grep -q "gate verdict" up/workflows/build.md && grep -q "gate verdict" up/workflows/governance.md && echo "pre-condicao ok"</automated></verify>
<done>A biblioteca do leitor existe com as quatro funções, o subcomando devolve aprovação para as fases 11 e 12 contra o log real, e os dois workflows já chamam o leitor. Qualquer falha parou o plano com bloqueio registrado.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/revisao.test.cjs (editar: acrescentar o bloco de casos do gate), .plano/fases/18-contexto-e-revisao/evidencia/007-red.txt (novo)</files>
<action>
Escrever as fixtures do gate ANTES da implementação e VER FALHAR.

Fixture A, o caso que o dono nomeou: log com linha de conformidade reprovando e linha de qualidade aprovando, ambas da mesma fase. A leitura por eixo devolve os dois vereditos distintos. A decisão é não aprovar. A lista de eixos a reexecutar contém apenas a conformidade.

Fixture B: as duas linhas aprovando. A decisão é aprovar.

Fixture C, compatibilidade com o histórico: log contendo exatamente as duas linhas reais deste repositório, com o vocabulário divergente e sem a coluna do agente, mais o fragmento não estruturado do topo. A leitura devolve, para cada uma dessas fases, veredito válido para os dois eixos, com a origem marcada como herança, e a decisão é aprovar. O fragmento do topo é ignorado sem quebrar a leitura.

Fixture D: linha antiga de veredito único seguida, mais adiante no mesmo arquivo, de uma linha nova de um eixo reprovando. A linha mais recente daquele eixo vence e a decisão é não aprovar. Prova que a compatibilidade não vira imunidade: linha antiga vale enquanto ninguém escreveu depois dela.

Fixture E: eixo de conformidade sem linha nenhuma, porque foi pulado por ausência de spec, e qualidade aprovando. A decisão não é aprovar sozinha: é escalar, com a marca de eixo não avaliado.

Fixture F: mesma fase com duas rodadas, a primeira com a conformidade reprovando e a segunda com ela aprovando. Vale a última por eixo, e a decisão é aprovar sem que a qualidade tenha sido reexecutada.

Rodar, confirmar que falha e gravar a saída em `evidencia/007-red.txt`.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && node up/bin/lib/revisao.test.cjs > .plano/fases/18-contexto-e-revisao/evidencia/007-red.txt 2>&1; grep -qiE "FAIL|failed" .plano/fases/18-contexto-e-revisao/evidencia/007-red.txt && echo "RED confirmado"</automated></verify>
<done>As seis fixtures existem no arquivo de teste, cobrem o caso nomeado pelo dono e as duas linhas reais deste repositório, falham por ausência das funções de gate por eixo, e a saída vermelha está gravada.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/revisao.cjs (editar: duas funções novas construídas sobre o leitor da fase 16)</files>
<action>
Implementar a leitura por eixo e a decisão conjuntiva, ambas sobre o leitor da tarefa 1.

A leitura por eixo recebe o diretório e o número da fase, pede as entradas ao leitor único, e classifica cada uma: entrada que carrega o campo de eixo pertence àquele eixo; entrada sem o campo é herança e vale para os dois eixos. Para cada eixo, vence a entrada mais recente. Devolve o veredito de cada eixo, a origem de cada um, entre entrada própria e herança, e a lista de eixos sem veredito.

A decisão conjuntiva recebe esse resultado e devolve aprovar, não aprovar ou escalar, mais a lista de eixos a reexecutar. Aprovar exige veredito de aprovação nos dois eixos. Qualquer eixo reprovado devolve não aprovar, com aquele eixo na lista de reexecução e o outro fora dela. Eixo sem veredito devolve escalar, com a marca de não avaliado.

Nenhuma das duas funções lê linha de log por conta própria: as duas chamam o leitor.
</action>
<verify><automated>node -e "const r=require('./up/bin/lib/revisao.cjs'); if(typeof r.vereditosPorEixo!=='function'||typeof r.decisaoConjuntiva!=='function') throw new Error('faltando funcao'); const s=require('fs').readFileSync('./up/bin/lib/revisao.cjs','utf-8'); if(/split\(.\|./.test(s)||/readFileSync\([^)]*approvals/.test(s)) throw new Error('leitura propria do log detectada'); console.log('gate por eixo ok');"</automated></verify>
<done>As duas funções existem, a leitura por eixo distingue entrada própria de herança e toma a mais recente por eixo, a decisão devolve os três desfechos com a lista de reexecução, e nenhuma delas parseia o log por conta própria.</done>
</task>

<task id="4" type="auto">
<files>up/bin/up-tools.cjs (editar: dois subverbos novos no caso de revisão)</files>
<action>
Expor o gate por eixo na CLI, que é a fronteira onde o workflow encosta.

Acrescentar ao caso de revisão dois subverbos: o de vereditos por eixo de uma fase e o de decisão do gate. O segundo sai com código diferente de zero quando a decisão não é aprovar, para o workflow ramificar em shell. Os dois aceitam campo escalar, no mesmo padrão que o subcomando de veredito da fase 16 já usa, para que o workflow não precise parsear JSON.

Edição por âncora, nunca reescrita do arquivo inteiro. Atualizar a lista de subcomandos no cabeçalho.
</action>
<verify><automated>node up/bin/up-tools.cjs revisao eixos --fase 11 --raw >/dev/null && node up/bin/up-tools.cjs revisao gate --fase 11 --field decisao >/dev/null; test $? -le 1 && echo "cli do gate ok"</automated></verify>
<done>Os dois subverbos respondem, aceitam campo escalar e o de decisão sai com código diferente de zero quando a decisão não é aprovar.</done>
</task>

<task id="5" type="auto">
<files>up/workflows/governance.md (editar: contrato da linha, regra conjuntiva, cap de rework por eixo)</files>
<action>
Estender o contrato do log e escrever a regra conjuntiva na governança, partindo do texto que a fase 16 deixou.

Contrato da linha, de forma aditiva: as seis colunas documentadas continuam iguais, e a linha ganha um campo final que declara o eixo. Uma linha por eixo, por rodada. O campo de evidência continua presente nas duas linhas, com o mesmo valor, porque a evidência é da fase e não do eixo, e assim a checagem de evidência que o leitor já faz continua valendo qualquer que seja a linha encontrada.

Regra conjuntiva, com o motivo: a fase só aprova com os dois eixos aprovados, e o eixo já aprovado fica registrado e não é reexecutado na rodada de correção. Regra de herança: linha antiga sem campo de eixo vale como veredito dos dois eixos, e não é reescrita.

O cap de rework de uma rodada continua existindo e passa a ser por eixo, com o contador nomeado por fase e eixo. A aprovação forçada por esgotamento do cap continua registrando débito técnico e passa a nomear o eixo em que ocorreu, senão o débito vira anônimo.

Substituir a chamada de veredito único pela chamada da decisão conjuntiva, mantendo a chamada de veredito do leitor onde ela ainda faz sentido. Deixar escrito que o gate lê por eixo e que a leitura de linha continua sendo a do leitor único, para ninguém reintroduzir busca por nome de agente achando que simplifica.
</action>
<verify><automated>grep -qi "conjuntivo" up/workflows/governance.md && grep -q "eixo=" up/workflows/governance.md && ! grep -q "REVISOR_ENTRY" up/workflows/governance.md && ! grep -q "awk -F" up/workflows/governance.md && echo "governanca ok"</automated></verify>
<done>O contrato traz o campo de eixo como sétimo campo aditivo, a regra conjuntiva e a de herança estão escritas com motivo, o cap de rework é por eixo e a aprovação forçada nomeia o eixo. A busca por nome de agente e a leitura por posição não voltaram.</done>
</task>

<task id="6" type="auto">
<files>up/workflows/build.md (editar: gate de fase e processamento do veredito)</files>
<action>
Ligar o gate por eixo no workflow de construção, partindo do bloco religado pela fase 16.

Substituir a chamada de veredito único pela chamada da decisão conjuntiva, preservando o campo escalar e a forma de ramificar em shell que a fase 16 deixou.

Reescrever o processamento do veredito com três saídas. Aprovar segue para o fechamento da fase, como hoje. Não aprovar entra no rework apenas dos eixos listados, disparando só os executores apontados no relatório daquele eixo e, depois, apenas aquele eixo na revisão, com o cap por eixo. Escalar fala com o dono no formato da fase 13: a recomendação é registrar a ausência de spec e fechar a fase com o eixo que rodou, com o motivo de que não há régua para medir conformidade e inventar uma seria fabricar a prova; a alternativa é escrever os requisitos da fase agora e rodar o eixo que faltou. Em modo automático, seguir a recomendação e registrar débito técnico, que é o mesmo desfecho que a aprovação forçada já tem hoje.

Escrever, no ponto em que a rodada de correção é montada, que reexecutar o eixo já aprovado é proibido, e por quê: além de custar uma janela à toa, reexecutar convida a um veredito diferente do que já está registrado, e o registro é o que torna o estado auditável.

Não tocar no estágio de revisão nem no loop de ondas: pertencem aos planos 006 e 002.
</action>
<verify><automated>grep -q "revisao gate" up/workflows/build.md && grep -qi "apenas o eixo reprovado\|so o eixo reprovado" up/workflows/build.md && grep -qi "escalar" up/workflows/build.md && echo "build ok"</automated></verify>
<done>O gate de fase chama a decisão conjuntiva, o processamento tem as três saídas, a rodada de correção roda apenas os eixos listados, e a proibição de reexecutar o eixo aprovado está escrita com o motivo.</done>
</task>

<task id="7" type="auto">
<files>.plano/fases/18-contexto-e-revisao/evidencia/007-green.txt (novo)</files>
<action>
Fechar o verde. Rodar o arquivo de teste até as seis fixtures passarem e gravar a saída em `evidencia/007-green.txt`. As saídas vermelha e verde são a prova do requisito de gate por eixo e a demonstração do cenário que o dono nomeou.

Rodar em seguida o corredor do UP e a suíte legada.
</action>
<verify><automated>node up/bin/lib/revisao.test.cjs > .plano/fases/18-contexto-e-revisao/evidencia/007-green.txt 2>&1; grep -q "0 failed" .plano/fases/18-contexto-e-revisao/evidencia/007-green.txt && npm run test:up && npm test</automated></verify>
<done>As seis fixtures passam, a saída verde está gravada, o corredor do UP sai com código zero e a suíte legada continua verde.</done>
</task>

<task id="8" type="auto">
<files>.plano/fases/18-contexto-e-revisao/evidencia/007-regressao.txt (novo)</files>
<action>
Regressão zero: sete comandos, quatro runtimes e projeto com planejamento anterior ao ciclo.

Regra dura antes de qualquer comando: nunca instalar no diretório de configuração real durante esta fase. Toda instalação de teste vai para diretório temporário, apontado pelas variáveis de ambiente que o instalador já respeita para cada um dos quatro runtimes. Instalar por cima da configuração real trocaria os agentes vivos no meio da própria execução da fase.

Instalar os quatro runtimes, um por vez, cada um em seu diretório temporário, e conferir por runtime: que os sete comandos foram emitidos na forma daquele runtime; que os agentes foram emitidos, agora em número treze, com os dois de eixo presentes e o revisor único ausente; que as quatro skills de doutrina continuam presentes; que o bloco de doutrina foi injetado no arquivo de instruções dos runtimes que não têm gancho; e que, no runtime nativo, os três ganchos foram registrados na configuração.

Conferir que os sete arquivos de comando continuam apontando para o workflow correspondente, resolvendo cada referência para um arquivo que existe no pacote instalado.

Projeto antigo: rodar a leitura por eixo contra o log de aprovações deste repositório, que tem as duas linhas divergentes reais e o fragmento não estruturado, e conferir que devolve veredito válido para as fases 11 e 12 sem quebrar e sem reescrever o arquivo. Rodar o índice de planos e a inicialização de execução de fase contra as fases 3 e 11, gravadas em convenções de nome diferentes, e registrar o resultado; onde a leitura falhar por causa da convenção de nome, registrar como pertencente à fase 17, e não consertar aqui.

Degradação: rodar os subcomandos novos desta fase num projeto sem nenhuma das chaves e arquivos novos e conferir que todos degradam, isto é, limiar ausente cai no padrão, marcador de janela ausente devolve indeterminado, registro de higiene ausente devolve contagem zero, e nada disso derruba comando nenhum.

Gravar tudo em `evidencia/007-regressao.txt`, com a contagem por runtime de comandos, agentes e skills.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && D=$(mktemp -d) && CLAUDE_CONFIG_DIR=$D node up/bin/install.js --claude --global > .plano/fases/18-contexto-e-revisao/evidencia/007-regressao.txt 2>&1 && ls $D/commands/up/*.md | wc -l | grep -q 7 && ls $D/agents/up-*.md | wc -l | grep -q 13 && test ! -f $D/agents/up-revisor.md && node up/bin/up-tools.cjs revisao eixos --fase 11 --raw >> .plano/fases/18-contexto-e-revisao/evidencia/007-regressao.txt 2>&1 && echo "regressao ok"</automated></verify>
<done>Os quatro runtimes instalam em diretório temporário emitindo sete comandos, treze agentes e quatro skills de doutrina, sem o revisor único. Os sete comandos resolvem seus workflows. O log real deste repositório é lido por eixo sem quebra e sem reescrita. Projeto sem as chaves novas degrada em todos os pontos novos. A configuração real não foi tocada.</done>
</task>

## Critérios de Sucesso

- [ ] Conformidade reprovando e qualidade aprovando produz dois vereditos distintos, a fase não aprova, e só a conformidade entra na lista de reexecução
- [ ] Na rodada de correção o eixo de qualidade não é disparado, e o veredito dele permanece registrado
- [ ] O log real deste repositório é lido sem quebra, com veredito válido para os dois eixos das fases 11 e 12, e sem reescrita
- [ ] Linha nova de um eixo vence a linha antiga de veredito único para aquele eixo
- [ ] Eixo sem veredito escala com recomendação e motivo, e em modo automático segue a recomendação registrando débito técnico
- [ ] O cap de rework é por eixo e a aprovação forçada nomeia o eixo
- [ ] Nenhuma segunda implementação de leitura do log existe: a busca encontra apenas o leitor da fase 16 e os consumidores dele
- [ ] Quatro runtimes instalam em diretório temporário com sete comandos, treze agentes e quatro skills
- [ ] Par vermelho e verde gravado em `evidencia/007-red.txt` e `evidencia/007-green.txt`

## FORA DE ESCOPO

- **Não implementar nem duplicar o leitor único** do log de aprovações. Vem da fase 16. Sem ele, o plano para na tarefa 1.
- **Não partir do bloco de gate antigo.** O ponto de partida é o bloco já religado pela fase 16. Partir do antigo reverteria a entrega dela.
- **Não reescrever linhas antigas do log.** A compatibilidade é de leitura, e migração retroativa está declarada como fora de escopo da fase.
- **Não consertar a leitura das duas convenções de nome** de plano e de resumo. É requisito da fase 17. Aqui ela é apenas registrada quando aparecer.
- **Não mudar o escritor oficial** das linhas do log além de acrescentar o campo de eixo.
- **Não estender a revisão em dois eixos** para os escopos de planejamento e de entrega global, nem mudar a evidência exigida por tipo de tarefa.
- **Não marcar requisitos como completos nem atualizar o roadmap.** É do fechamento de fase do workflow de construção, e duplicar aqui criaria dois escritores para o mesmo artefato.
- **Não instalar no diretório de configuração real** em nenhum momento.
