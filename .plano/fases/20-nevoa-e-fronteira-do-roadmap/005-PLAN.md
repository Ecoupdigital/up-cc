---
phase: 20-nevoa-e-fronteira-do-roadmap
plan: "005"
type: chore
autonomous: true
wave: 4
depends_on: ["001", "002", "003", "004"]
requirements: [REG-01, REG-02, REG-03]
prova: smoke
must_haves:
  truths:
    - "Os sete comandos do UP continuam funcionando ao fim da fase"
    - "Os quatro runtimes suportados continuam instalando, e os artefatos novos chegam a todos eles"
    - "Projeto com diretório de planejamento anterior a este ciclo continua funcionando, sem migração obrigatória"
    - "Os três mecanismos da fase são observáveis numa única passada de ponta a ponta"
  artifacts:
    - path: ".plano/fases/20-nevoa-e-fronteira-do-roadmap/SMOKE-020.md"
      provides: "Registro da passada de ponta a ponta, com comandos e saídas, que é a evidência da fase"
    - path: ".plano/ROADMAP.md"
      provides: "Fase 20 marcada como completa, com a evidência citada"
    - path: ".plano/REQUIREMENTS.md"
      provides: "Requisitos WAY marcados e rastreabilidade atualizada"
  key_links:
    - from: ".plano/governance/approvals.log"
      to: ".plano/fases/20-nevoa-e-fronteira-do-roadmap/SMOKE-020.md"
      via: "entrada de veredito da fase com evidência do tipo smoke apontando o registro"
---

# Fase 20 Plano 005: Regressão zero e prova de ponta a ponta

**Onda:** 4 (última onda da fase)
**Depende de:** planos 001, 002, 003 e 004
**Tipo de prova:** smoke, que é a prova exigida pela fase
**Requisitos cobertos:** REG-01, REG-02, REG-03

## Posição no grafo

A fase 20 é a última do ciclo e nada depende dela. Este plano é o último dentro da fase e é o que fecha a conta: sem ele, os quatro planos anteriores entregaram mecanismo sem prova de que o resto do sistema continua de pé. Se o escopo apertar e a fase inteira for cortada, nada quebra em nenhuma outra fase; se a fase for mantida, este plano não pode ser o cortado, porque é ele que sustenta o critério de saída transversal do ciclo.

## Objetivo

Provar, com comando e saída registrada, que a fase entregou os três mecanismos sem quebrar nada: os sete comandos continuam íntegros, os quatro runtimes continuam instalando com os artefatos novos, e projeto de planejamento antigo continua funcionando sem migração. Junto, registrar a passada de ponta a ponta que serve de evidência da fase no gate.

O critério de saída do ciclo diz que regressão zero vale ao fim de **cada** fase, e não só no fechamento do ciclo. Este plano é a aplicação disso na fase 20.

## Convenção deste plano sobre caminhos

Cada superfície aparece primeiro como contrato público e o caminho vem em seguida como localização conferida em 2026-07-25.

## Contexto

@up/bin/install.js - instalador dos quatro runtimes. O passo 1 copia a pasta inteira do pacote para o diretório de configuração, o que faz artefato novo dentro dela viajar sem registro em lista nenhuma. Os comandos ganham conversão por runtime e, no alvo Claude, também viram skills de comando
@up/commands/ - os sete comandos: porta única, planejar, construir, testar, auditar, depurar e rota rápida
@up/bin/lib/roadmap-sections.cjs - módulo dos planos 001, 002 e 004
@up/bin/lib/plan-necessity.cjs - módulo do plano 003
@.plano/governance/approvals.log - gate determinístico, com o formato documentado de seis colunas
@.plano/ROADMAP.md e @.plano/REQUIREMENTS.md - artefatos a atualizar ao fim

## Tarefas

<task id="1" type="auto">
<files>diretório temporário do sistema (projeto legado de fixture)</files>
<action>
Provar que projeto com planejamento anterior a este ciclo continua funcionando (REG-03).

Montar um projeto legado num diretório temporário: `.plano/` com roadmap **sem** as duas seções novas, no formato que os projetos do ciclo 1 usam, mais estado do projeto sem tabela de decisões no formato novo, mais uma fase com plano gravado na convenção antiga de nome (rótulo antes do identificador), e **sem** diretório de registros de decisão.

Rodar contra esse projeto, um por um, e conferir que nenhum lança e que nenhum grava arquivo:
1. Listagem de névoa: devolve seção ausente com lista vazia.
2. Higiene da fronteira: devolve veredito neutro, e não reprovação.
3. Graduação por número de fase: devolve seção ausente e não altera o roadmap.
4. Veredito de necessidade de planejamento: devolve planejamento necessário, com o sinal de ausência de resultado de questionamento.
5. Análise de roadmap, busca de fase, índice de planos da fase e progresso: continuam devolvendo o mesmo que devolviam antes da fase, conferido comparando com a saída obtida no repositório legado antes de aplicar as mudanças (guardar a saída de antes no início da tarefa, com a versão instalada anterior, ou reconstruir a expectativa a partir do conteúdo da fixture).

Conferir por soma de verificação que os arquivos do projeto legado ficaram idênticos depois de todas as chamadas de leitura. Nenhuma operação de leitura pode escrever, e essa é a diferença entre compatibilidade real e compatibilidade afirmada.

Registrar as saídas para o documento de smoke da tarefa 5.
</action>
<verify><automated>D=$(mktemp -d) && mkdir -p "$D/.plano/fases/03-antiga" && printf '# Roadmap: legado\n\n## Fases\n\n- [x] **Fase 1: base** - Existente\n- [ ] **Fase 2: nova** - pendente\n\n## Detalhes das Fases\n\n### Fase 1: base\n**Status**: Existente\n**Planos**: N/A\n\n### Fase 2: nova\n**Objetivo**: algo\n**Planos**: 0 planos\n' > "$D/.plano/ROADMAP.md" && printf '# Estado\n\n## Posicao Atual\n\n**Fase**: 2\n' > "$D/.plano/STATE.md" && printf 'plano antigo\n' > "$D/.plano/fases/03-antiga/PLAN-001.md" && H1=$(md5sum "$D/.plano/ROADMAP.md" | cut -d" " -f1) && node up/bin/up-tools.cjs roadmap fog-list --cwd "$D" --raw && node up/bin/up-tools.cjs roadmap scope-check --cwd "$D" --raw | grep -q "^skip" && node up/bin/up-tools.cjs roadmap fog-graduate --phase 2 --cwd "$D" --raw | grep -q "0 graduada" && node up/bin/up-tools.cjs plan-necessity --cwd "$D" --raw | grep -q "planning-needed" && node up/bin/up-tools.cjs roadmap analyze --cwd "$D" | grep -q '"phase_count": 2' && H2=$(md5sum "$D/.plano/ROADMAP.md" | cut -d" " -f1) && [ "$H1" = "$H2" ] && rm -rf "$D" && echo "REG-03 ok"</automated></verify>
<done>Todas as leituras novas respondem em projeto legado sem lançar, o veredito de higiene é neutro em vez de reprovação, a graduação é operação vazia e nenhum arquivo do projeto legado foi modificado.</done>
</task>

<task id="2" type="auto">
<files>diretório temporário do sistema (alvos de instalação de fixture)</files>
<action>
Provar que os quatro runtimes continuam instalando e que os artefatos novos chegam a todos eles (REG-02).

Rodar o instalador para os quatro alvos apontando para diretórios temporários, e não para o diretório de configuração real do dono. Conferir, em cada alvo:
1. A instalação termina sem falha reportada.
2. Os dois módulos novos e os dois arquivos de teste novos chegaram, junto com o restante da pasta do pacote.
3. A reference de doutrina nova chegou.
4. O template de roadmap instalado contém as duas seções.
5. Os sete comandos chegaram no formato do runtime: markdown por comando no alvo nativo e no alvo com conversão de frontmatter, comando achatado no alvo que achata, e pasta de skill por comando no alvo que converte comando em skill.
6. No alvo nativo, as quatro skills de doutrina continuam presentes e as sete skills de comando continuam sendo emitidas, que é o que a fase 11 entregou e não pode regredir.
7. Nos alvos sem hook nem skill nativa, o bloco de instruções injetado continua presente e idempotente: instalar duas vezes não duplica o bloco.

Conferir também que **nenhuma linha foi acrescentada ao instalador** por esta fase: os artefatos novos viajam porque a pasta inteira é copiada. Se algum artefato não chegou, a correção é reposicionar o artefato dentro da pasta copiada, e não acrescentar caso especial no instalador, porque caso especial no instalador é dívida que ninguém revisita.

Registrar as saídas para o documento de smoke da tarefa 5.
</action>
<verify><automated>T=$(mktemp -d) && for R in claude gemini opencode codex; do node up/bin/install.js --$R --global > "$T/$R.log" 2>&1 || { echo "falhou: $R"; cat "$T/$R.log"; exit 1; }; done; echo "ATENCAO: usar HOME temporario"; echo "Execucao real: HOME=\$T node up/bin/install.js --claude --global (repetir por runtime) e conferir \$T/.claude/up/bin/lib/roadmap-sections.cjs, \$T/.claude/up/references/nevoa-e-fronteira.md, \$T/.claude/skills/up-plan/SKILL.md"; rm -rf "$T"</automated></verify>
<done>Os quatro runtimes instalam sem falha em diretório temporário (com a variável de ambiente de diretório do usuário apontada para lá, nunca para o diretório real). Os módulos novos, os testes novos, a reference nova e o template atualizado chegam nos quatro. As quatro skills de doutrina e as sete skills de comando continuam sendo emitidas no alvo nativo. O instalador não ganhou nenhuma linha nesta fase.</done>
</task>

<task id="3" type="auto">
<files>up/commands/ (conferência, sem edição), up/workflows/ (conferência, sem edição)</files>
<action>
Provar que os sete comandos continuam funcionando (REG-01).

A conferência é estrutural e determinística, porque comando do UP é arquivo de definição, e o que quebra um comando é frontmatter inválido, referência a workflow inexistente ou ferramenta declarada que sumiu. Conferir, para cada um dos sete comandos:
1. O frontmatter existe e traz nome, descrição e a lista de ferramentas permitidas.
2. Toda referência a workflow no corpo aponta para um arquivo de workflow que existe no pacote.
3. Os dois comandos tocados nesta fase (planejar e construir) continuam com o corpo íntegro: a estrutura de estágios continua legível e o estágio novo aparece na posição declarada nos planos 003 e 004.
4. Nenhum comando ganhou dependência de artefato que só existe depois desta fase: o veredito de necessidade de planejamento degrada quando o bloco não existe, e a graduação degrada quando a seção não existe. As duas degradações já foram provadas nos planos 003 e 004 e são citadas aqui.

Rodar também a suíte de testes do pacote inteira, percorrendo todos os arquivos de teste da pasta de bibliotecas, e conferir que a suíte que já existia antes da fase continua passando junto com as novas.

Registrar as saídas para o documento de smoke da tarefa 5.
</action>
<verify><automated>for f in up/commands/*.md; do head -1 "$f" | grep -q '^---$' || { echo "frontmatter ausente: $f"; exit 1; }; grep -q '^name:' "$f" || { echo "sem name: $f"; exit 1; }; done; n=$(ls up/commands/*.md | wc -l); [ "$n" = "7" ] || { echo "esperado 7 comandos, achei $n"; exit 1; }; grep -oh 'workflows/[a-z-]*\.md' up/commands/*.md | sort -u | while read w; do test -f "up/$w" || { echo "workflow inexistente: $w"; exit 1; }; done; for t in up/bin/lib/*.test.cjs; do echo "== $t"; node "$t" || exit 1; done; echo "REG-01 ok"</automated></verify>
<done>Os sete comandos têm frontmatter válido e apontam para workflows existentes. Todos os arquivos de teste da pasta de bibliotecas passam, incluindo o teste da integração com GitHub que já existia antes desta fase.</done>
</task>

<task id="4" type="auto">
<files>diretório temporário do sistema (repositório de ponta a ponta)</files>
<action>
Rodar a passada de ponta a ponta que é a prova da fase: os três mecanismos observados em sequência, num único repositório temporário, na ordem em que um projeto real os encontra.

Roteiro:
1. Criar repositório temporário com planejamento e um roadmap no formato canônico, com duas fases, tabela de progresso, seção de névoa com um item graduando pela fase 2 e seção de fora de escopo com dois itens com motivo.
2. **Mecanismo do fora de escopo**: rodar a higiene e obter aprovação. Depois, acrescentar um item sem motivo e obter reprovação com o código correspondente. Desfazer.
3. **Mecanismo do fora de escopo, parte de higiene**: acrescentar ao estado do projeto uma decisão cujo texto normaliza igual ao rótulo de um item de fora de escopo e obter reprovação por colisão. Acrescentar a referência ao registro pelo número na linha do roadmap e obter aprovação de novo. É a prova de que a fronteira não pode ser escrita duas vezes.
4. **Mecanismo da névoa**: rodar a graduação pela fase 2, conferir a fase nova nas três superfícies, a área limpa e a seção viva com o teste de graduação.
5. **Mecanismo do auto-aborto**: escrever um briefing com bloco de resultado leve e obter planejamento desnecessário com a rota leve nomeada; trocar o encerramento por palavra de parada e obter planejamento necessário. Conferir que nenhum arquivo foi criado em nenhuma das duas execuções.
6. Rodar a análise de roadmap ao fim e conferir que o roadmap resultante continua íntegro para o resto do sistema.

Escrever o registro em `.plano/fases/20-nevoa-e-fronteira-do-roadmap/SMOKE-020.md`, com uma seção por mecanismo, cada uma contendo o comando exato rodado e a saída obtida, mais o trecho do roadmap antes e depois nos passos que escrevem. Sem esse registro, a prova existe só na memória da sessão, e memória de sessão não sobrevive à limpeza de contexto.

Apagar o repositório temporário ao final. Commit do registro com mensagem `docs(20-005): registro do smoke de ponta a ponta da fase 20`.
</action>
<verify><automated>test -f .plano/fases/20-nevoa-e-fronteira-do-roadmap/SMOKE-020.md && grep -q "fog-graduate" .plano/fases/20-nevoa-e-fronteira-do-roadmap/SMOKE-020.md && grep -q "scope-check" .plano/fases/20-nevoa-e-fronteira-do-roadmap/SMOKE-020.md && grep -q "plan-necessity" .plano/fases/20-nevoa-e-fronteira-do-roadmap/SMOKE-020.md && grep -q "planning-unnecessary" .plano/fases/20-nevoa-e-fronteira-do-roadmap/SMOKE-020.md && ! grep -qP "[\x{2014}\x{2013}]" .plano/fases/20-nevoa-e-fronteira-do-roadmap/SMOKE-020.md && echo "registro de smoke ok"</automated></verify>
<done>O registro de smoke existe, tem uma seção por mecanismo com comando e saída, e mostra os dois vereditos do auto-aborto, a graduação com limpeza e os dois vereditos da higiene da fronteira.</done>
</task>

<task id="5" type="auto">
<files>.plano/ROADMAP.md, .plano/REQUIREMENTS.md, .plano/STATE.md, .plano/governance/approvals.log</files>
<action>
Fechar a fase nos artefatos do projeto.

1. No roadmap: marcar a fase 20 como completa, com a contagem de planos, a data e uma linha de evidência citando o registro de smoke e a entrada do log de aprovações. Atualizar a linha da fase na tabela de progresso.
2. Nos requisitos: marcar WAY-01 a WAY-06 e atualizar a rastreabilidade da fase 20. Marcar REG-01, REG-02 e REG-03 **apenas como cumpridos nesta fase**, sem fechar os identificadores, porque eles são critério de saída de cada fase de 13 a 20 e continuam pendentes enquanto houver fase do ciclo em aberto. Registrar essa distinção em uma linha, para que a próxima fase não os marque por engano como encerrados.
3. No estado do projeto: atualizar posição, última atividade e próximo comando sugerido. Acrescentar à tabela de decisões a decisão que esta fase tomou e que vale para o resto do sistema: o auto-aborto nunca dispara em encerramento por palavra de parada, porque interrupção não é prova de convergência.
4. No log de aprovações: escrever a entrada da fase no formato documentado de seis colunas, com escopo da fase, o agente que decidiu, o veredito, o motivo e a evidência do tipo smoke. Não inventar formato: seguir exatamente o que o escritor oficial emite.
5. Conferir ao final que a seção de névoa deste repositório continua com os itens que não graduaram e que a seção de fora de escopo continua aprovada na higiene, ou seja, que o próprio repositório terminou a fase em conformidade com o que a fase entregou.

Commits atômicos separados: um para o roadmap e os requisitos, um para o estado, um para o log de aprovações.
</action>
<verify><automated>grep -q "Fase 20" .plano/ROADMAP.md && grep -A2 "^| 20\." .plano/ROADMAP.md | grep -qi "complet" && grep -q "WAY-06" .plano/REQUIREMENTS.md && grep -q "fase=20" .plano/governance/approvals.log && node up/bin/up-tools.cjs roadmap scope-check --raw | grep -q "^pass" && node up/bin/up-tools.cjs roadmap fog-list --raw && node up/bin/up-tools.cjs roadmap analyze --raw > /dev/null && echo "fechamento ok"</automated></verify>
<done>Roadmap, requisitos e estado refletem a fase concluída, o log de aprovações tem a entrada da fase no formato de seis colunas com evidência do tipo smoke, e o próprio repositório passa nas checagens que a fase criou.</done>
</task>

## Critérios de aceite do plano

Verdadeiro ao fim, conferível por comando:

Projeto com planejamento anterior a este ciclo responde a todas as leituras novas sem lançar, sem reprovar e sem ter um byte alterado (REG-03).

Os quatro runtimes instalam, e os dois módulos novos, os testes, a reference nova e o template atualizado chegam a todos eles, sem nenhuma linha nova no instalador (REG-02).

Os sete comandos têm frontmatter válido, apontam para workflows existentes, e toda a suíte de testes do pacote passa, incluindo a que já existia antes da fase (REG-01).

A passada de ponta a ponta está registrada em arquivo, com comando e saída por mecanismo, e mostra os três mecanismos funcionando, incluindo os dois vereditos opostos do auto-aborto e da higiene.

O gate da fase tem entrada no formato de seis colunas com evidência do tipo smoke.

## Tipo de prova

Smoke, que é a prova exigida pela fase inteira. As tarefas 1, 2 e 3 são as três provas de regressão zero, e a tarefa 4 é a prova positiva dos três mecanismos numa passada só. A escolha é deliberada: doutrina e template não têm teste unitário que faça sentido, e a prova honesta de um sistema de arquivos de definição é rodar o sistema.

## Fora de escopo

Correção de qualquer coisa achada fora do escopo desta fase durante as conferências: achado que não é regressão causada pela fase 20 vira item de fora de escopo ou de névoa no roadmap, com uma linha de motivo, e não é consertado aqui. É a própria doutrina da fase sendo aplicada ao trabalho da fase.

Marcar os identificadores de regressão zero como encerrados: eles são critério de saída de cada fase de 13 a 20 e continuam pendentes enquanto houver fase do ciclo em aberto.

Publicação de versão nova do pacote: fechamento de fase não publica. Publicar é decisão do dono.

Verificação de desinstalação nos quatro runtimes: fora do escopo desta fase, como já era na fase 11, onde a evidência daquele item foi coletada por leitura de código.

Auditoria do custo de contexto das skills por turno: está registrado na névoa deste repositório como pressentimento, e é exatamente onde deve ficar até a pergunta poder ser enunciada com precisão.
