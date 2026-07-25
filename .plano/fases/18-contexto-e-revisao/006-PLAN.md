---
phase: 18-contexto-e-revisao
plan: "006"
type: glue
autonomous: true
wave: 3
depends_on: ["002", "004"]
requirements: [REV-02, REV-03, REV-06]
objective: "Fan-out paralelo dos dois eixos com falha rapida antes e relatorio lado a lado depois, sem fusao"
prova: "glue:smoke"
files_modified:
  - up/bin/lib/revisao.cjs
  - up/bin/lib/revisao.test.cjs
  - up/bin/up-tools.cjs
  - up/workflows/build.md
  - .plano/fases/18-contexto-e-revisao/evidencia/006-red.txt
  - .plano/fases/18-contexto-e-revisao/evidencia/006-green.txt
  - .plano/fases/18-contexto-e-revisao/evidencia/006-smoke.txt
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

<objective>
Fazer os dois eixos rodarem de fato em paralelo e chegarem ao dono lado a lado, sob cabeçalhos separados, com falha rápida antes do fan-out e montagem mecânica depois, de modo que fundir ou reordenar achados entre eixos deixe de ser possível.
</objective>

**Onda:** 3. **Depende de:** plano 004, que cria os dois agentes, e plano 002, que tocou o workflow de construção na onda anterior.
**Tipo de prova:** smoke para a rodada completa, incluindo o cenário do critério 10 do briefing. Lógica, vermelho e verde, para as quatro funções determinísticas.

## O risco central

A fusão. Se em algum ponto os achados dos dois eixos entrarem numa lista só e forem ordenados por
severidade, a separação inteira vira decoração: o problema de segurança volta a ser escondido, agora por
ordenação em vez de por sequência travada. Por isso a montagem é determinística e mecânica, e não
trabalho de modelo.

## Contexto

@.plano/fases/18-contexto-e-revisao/CONTEXT.md - decisão P3, sobre eixo pulado
@up/workflows/build.md - estágio de revisão da fase e estágio de qualidade global
@up/agents/up-revisor-conformidade.md - formato de achado, rótulo de âncora e campos de frontmatter do relatório
@up/agents/up-revisor-qualidade.md - o mesmo, do outro lado
@up/bin/lib/core.cjs - função de execução de git, que devolve código, saída e erro em vez de lançar
@up/bin/lib/test-helpers.cjs - helper de teste entregue pela fase 16

Regra dura de edição do despachante: nunca reescrever o arquivo inteiro, apenas edição por âncora,
relendo imediatamente antes.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/revisao.test.cjs (novo), .plano/fases/18-contexto-e-revisao/evidencia/006-red.txt (novo)</files>
<action>
Escrever o teste ANTES da implementação e VER FALHAR. Sobre repositórios git temporários, como o teste de integração com repositório já faz hoje.

Pré-checagem: referência inexistente devolve falha com motivo de referência inválida; referência válida com diff vazio devolve falha com motivo de diff vazio; referência válida com um arquivo alterado devolve sucesso, a referência resolvida e a lista de arquivos.

Disponibilidade de spec: projeto com arquivo de requisitos contendo identificadores devolve disponível, com fonte e quantidade; projeto sem arquivo devolve indisponível; projeto com arquivo mas sem nenhum identificador devolve indisponível, porque arquivo vazio não é spec.

Âncora no eixo de conformidade: achado cujo rótulo de âncora cita identificador presente no bloco de requisitos é mantido; identificador ausente é descartado; achado sem rótulo de âncora é descartado; a contagem de descartados aparece no resultado.

Âncora no eixo de qualidade: achado cujo caminho e linha caem dentro de um trecho alterado do diff é mantido; caminho não tocado é descartado; caminho tocado com linha fora dos trechos alterados é descartado.

Teto: corpo com trezentas e noventa e nove palavras passa intacto e sem aviso; com quatrocentas e uma, é cortado, o aviso aparece e a contagem de omitidas está correta; o frontmatter não entra na contagem.

Montagem, que são os casos mais importantes: dados dois relatórios de eixo, a saída tem exatamente dois cabeçalhos de eixo, na ordem fixa, e todo achado aparece sob o cabeçalho do eixo que o produziu. Um achado de severidade crítica no eixo de qualidade e um de severidade média no eixo de conformidade produzem um resumo com duas linhas, uma por eixo, e nenhuma linha que eleja um vencedor entre eixos. A ordem dos achados dentro de cada eixo é a mesma que veio do eixo. Com um eixo pulado, a saída ainda tem os dois cabeçalhos, e o pulado traz a razão em vez de achados.

Rodar, confirmar que falha e gravar a saída em `evidencia/006-red.txt`.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && node up/bin/lib/revisao.test.cjs > .plano/fases/18-contexto-e-revisao/evidencia/006-red.txt 2>&1; grep -qiE "FAIL|failed|Cannot find module" .plano/fases/18-contexto-e-revisao/evidencia/006-red.txt && echo "RED confirmado"</automated></verify>
<done>O arquivo de teste cobre pré-checagem, disponibilidade de spec, âncora nos dois eixos, teto e montagem, falha por ausência da biblioteca, e a saída vermelha está gravada.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/revisao.cjs (novo)</files>
<action>
Implementar a biblioteca de revisão. CommonJS, sem dependência externa, exportação por objeto literal.

`preChecagem(cwd, ref)` resolve a referência com git, coleta arquivos alterados e intervalos de linha alterados, e devolve sucesso ou falha com motivo. Nunca lança: usa a função de execução de git que já devolve estrutura.

`specDisponivel(cwd, fase)` procura primeiro o recorte de requisitos da fase e depois o arquivo global, conta identificadores no formato de sigla e número, e devolve disponibilidade, fonte e quantidade.

`validarAncoras(corpo, eixo, contexto)` recebe o corpo do relatório, o eixo e o contexto do eixo, que é a lista de identificadores de requisito na conformidade e o mapa de arquivo para intervalos alterados na qualidade. Devolve o corpo já sem os achados descartados, mais as contagens de mantidos e descartados e o motivo de cada descarte.

`aplicarTeto(corpo, max)` conta as palavras ignorando o frontmatter, corta pelo fim ao ultrapassar, acrescenta a linha de aviso com o número de palavras omitidas, e devolve corpo, contagem original e marca de truncamento.

`montarRelatorio(conformidade, qualidade)` recebe os dois relatórios já validados e já limitados e devolve o relatório único. É mecânica por design: concatena na ordem fixa, sob os dois cabeçalhos de eixo, sem ordenar, sem deduplicar e sem mover nada entre eixos. Em seguida escreve o resumo, com exatamente uma linha por eixo, cada uma nomeando o pior achado daquele eixo, lido do frontmatter do relatório do eixo. Não existe caminho de código que compare severidades de eixos diferentes, e isso fica escrito em comentário no ponto exato onde a tentação apareceria.
</action>
<verify><automated>node -e "const r=require('./up/bin/lib/revisao.cjs'); const t=r.aplicarTeto(Array(500).fill('palavra').join(' '), 400); if(!t.truncado||t.palavras<500) throw new Error('teto errado'); console.log('revisao ok');"</automated></verify>
<done>As quatro funções existem, nunca lançam, e a montagem concatena sem ordenar nem mover achado entre eixos, com o comentário de proibição no ponto da tentação.</done>
</task>

<task id="3" type="auto">
<files>up/bin/up-tools.cjs (editar: caso novo de revisão com quatro subverbos, mais o manifesto de referências por agente)</files>
<action>
Ligar os casos de revisão no despachante, um por função pública da biblioteca: pré-checagem, validação de âncora, aplicação de teto e montagem do relatório. Todos aceitam diretório e saída crua.

A pré-checagem sai com código diferente de zero quando falha, para o workflow abortar em shell sem parsear JSON, e escreve o motivo. Este é o ponto de falha rápida: custa uma chamada de git e nenhum subagente.

Aproveitar a mesma edição para limpar a entrada órfã do manifesto de referências por agente, que ainda cita o revisor único removido no plano 004, e acrescentar as entradas dos dois agentes de eixo. O eixo de qualidade recebe as mesmas referências que o revisor antigo recebia. O eixo de conformidade não recebe nenhuma, porque ele não lê referência de código.

Atualizar a lista de subcomandos no cabeçalho do arquivo. Edição por âncora, nunca reescrita do arquivo inteiro.
</action>
<verify><automated>node up/bin/up-tools.cjs revisao pre-checagem --fase 18 --ref HEAD~1..HEAD --raw >/dev/null 2>&1; test $? -le 1 && ! grep -q "'up-revisor':" up/bin/up-tools.cjs && grep -q "up-revisor-qualidade" up/bin/up-tools.cjs && echo "despachante ok"</automated></verify>
<done>Os quatro subverbos respondem, a pré-checagem sai com código diferente de zero quando falha, e o manifesto de referências não cita mais o agente removido e cita os dois novos.</done>
</task>

<task id="4" type="auto">
<files>up/workflows/build.md (editar: estágio de revisão da fase, reescrito por inteiro; estágio de qualidade global, apenas o nome do agente)</files>
<action>
Reescrever o estágio de revisão da fase, nesta ordem.

Primeiro, a falha rápida. Resolver a referência da fase, isto é, o intervalo entre a base e a cabeça da branch da fase, e rodar a pré-checagem. Falhou, parar o estágio, informar o motivo ao dono e não disparar subagente nenhum. Deixar escrito por que a ordem é essa: referência ruim ou diff vazio falhando dentro de dois subagentes custa duas janelas e devolve dois relatórios vazios.

Segundo, a disponibilidade de spec. Indisponível significa que o eixo de conformidade não é disparado, e o relatório dele é gerado direto com veredito de eixo pulado e a razão. Não é o agente que decide pular: ele nem nasce.

Terceiro, subir a aplicação quando a fase tem interface, guardar o endereço base e passá-lo no prompt do eixo de conformidade, que não tem como subir nada por não ter execução de comando. Derrubar a aplicação ao fim do estágio, no mesmo ponto onde a limpeza já acontece hoje.

Quarto, o fan-out. Disparar os dois agentes numa única mensagem do orquestrador, que é o que torna a execução paralela de fato. O prompt do eixo de conformidade carrega o bloco de requisitos inlinado, o endereço base e o caminho do relatório que ele deve escrever. O prompt do eixo de qualidade carrega a referência resolvida, a lista de arquivos alterados e o caminho do relatório dele. Nenhum dos dois recebe o relatório do outro, nem a ordem de esperar pelo outro.

Quinto, o pós-processamento determinístico, por eixo: validar âncoras e aplicar teto, nesta ordem, porque cortar antes de validar poderia deixar o corte em cima de um achado que seria descartado de qualquer jeito.

Sexto, a montagem do relatório único da fase, com os dois cabeçalhos e o resumo por eixo, no arquivo de revisão da fase que o gate já conhece. No ponto da montagem, deixar escrito que é proibido fundir ou reordenar achados entre eixos, e por quê.

No estágio de qualidade global, trocar o nome do revisor único pelo eixo de qualidade, sem mudar o que aquele estágio faz. O escopo de entrega continua com um eixo, e isso está declarado como fora de escopo no contexto da fase.

Não tocar no gate nem no loop de ondas: o primeiro é do plano 007, o segundo foi editado pelo plano 002.
</action>
<verify><automated>grep -q "revisao pre-checagem" up/workflows/build.md && grep -q "up-revisor-conformidade" up/workflows/build.md && grep -q "up-revisor-qualidade" up/workflows/build.md && ! grep -q "up-revisor\b" up/workflows/build.md && grep -qi "proibido fundir" up/workflows/build.md && echo "estagio ok"</automated></verify>
<done>O estágio roda falha rápida, decide a disponibilidade de spec antes do fan-out, sobe e derruba a aplicação, dispara os dois agentes numa única mensagem, pós-processa por eixo e monta o relatório lado a lado, com a proibição de fundir escrita ao lado da montagem. O nome do agente removido não aparece mais no arquivo.</done>
</task>

<task id="5" type="auto">
<files>.plano/fases/18-contexto-e-revisao/evidencia/006-green.txt (novo)</files>
<action>
Fechar o verde. Rodar o arquivo de teste até passar inteiro e gravar a saída em `evidencia/006-green.txt`. Rodar em seguida o corredor do UP e a suíte legada, para confirmar que a edição do despachante não regrediu nada.
</action>
<verify><automated>node up/bin/lib/revisao.test.cjs > .plano/fases/18-contexto-e-revisao/evidencia/006-green.txt 2>&1; grep -q "0 failed" .plano/fases/18-contexto-e-revisao/evidencia/006-green.txt && npm run test:up && npm test</automated></verify>
<done>O teste passa com zero falhas, o corredor do UP sai com código zero e a suíte legada continua verde.</done>
</task>

<task id="6" type="auto">
<files>.plano/fases/18-contexto-e-revisao/evidencia/006-smoke.txt (novo)</files>
<action>
Smoke da rodada, com a saída gravada como prova. Este é o critério 10 do briefing, que é a prova exigida da fase.

Smoke da falha rápida: chamar a pré-checagem com uma referência inexistente e conferir código diferente de zero e motivo, sem nenhum subagente disparado. Repetir com diff vazio.

Smoke da fusão proibida: montar dois relatórios de eixo de teste, um com achado crítico de segurança e outro com achado médio de conformidade, rodar a montagem e conferir na saída que existem dois cabeçalhos, que cada achado está sob o cabeçalho do próprio eixo, que o resumo tem duas linhas e que nenhuma linha do resumo compara os dois eixos entre si.

Smoke do eixo pulado: montar a rodada com spec indisponível e conferir que o relatório sai com os dois cabeçalhos, que o de conformidade traz a razão do pulo, e que nenhum requisito foi inventado.

Gravar as três saídas em `evidencia/006-smoke.txt`.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && node up/bin/up-tools.cjs revisao pre-checagem --fase 18 --ref refs/inexistente..HEAD --raw >> .plano/fases/18-contexto-e-revisao/evidencia/006-smoke.txt 2>&1; test -s .plano/fases/18-contexto-e-revisao/evidencia/006-smoke.txt && echo "smoke gravado"</automated></verify>
<done>A falha rápida barra referência inválida e diff vazio sem gastar subagente. A montagem produz dois cabeçalhos com cada achado sob o seu, e um resumo de duas linhas sem vencedor único. O eixo pulado aparece com a razão e sem requisito inventado.</done>
</task>

## Critérios de Sucesso

- [ ] Referência inválida e diff vazio param a rodada antes do fan-out, com motivo e sem subagente
- [ ] Sem spec disponível, o eixo de conformidade não é disparado e o relatório registra a ausência
- [ ] Os dois agentes são disparados numa única mensagem do orquestrador
- [ ] O relatório tem exatamente dois cabeçalhos de eixo, com cada achado sob o do eixo que o produziu e na ordem que veio
- [ ] O resumo tem uma linha por eixo, e nenhuma linha elege vencedor entre eixos
- [ ] Achado sem âncora válida não aparece, e a contagem de descartados aparece
- [ ] Corpo acima do teto é cortado com aviso e contagem de omitidas
- [ ] Par vermelho e verde gravado em `evidencia/006-red.txt` e `evidencia/006-green.txt`

## FORA DE ESCOPO

- **Não mexer no gate.** Ler veredito, escrever no log de aprovações, aplicar a regra conjuntiva e decidir o que reexecutar na rodada de correção é o plano 007. Este plano produz os dois relatórios e para aí.
- **Não reescrever os agentes de eixo.** O contrato de formato de achado foi fixado no plano 004. Se um formato não bater com o validador, corrigir o validador ou escalar.
- **Não estender a revisão em dois eixos** para os escopos de planejamento e de entrega global.
- **Não mudar a evidência exigida por tipo de tarefa**, a derivação do tipo agregado da fase nem o cap de rework. São contrato existente e pertencem ao gate.
- **Não tocar no laço de detectar, corrigir e reverificar**, que roda antes deste estágio e produz parte da evidência que o gate confere.
- **Não tocar no loop de ondas**, editado pelo plano 002 na onda anterior.
