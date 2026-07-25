---
phase: 17-planejamento-por-grafo
plan: "001"
type: fix
wave: 1
depends_on: []
autonomous: true
plan_schema: 2
requirements: [PLANO-13]
files_modified:
  - up/bin/lib/plans.cjs
  - up/bin/lib/plans.test.cjs
  - up/bin/up-tools.cjs
  - up/workflows/build.md
  - up/workflows/plan.md
  - .plano/fases/17-planejamento-por-grafo/evidencia/001-red.txt
  - .plano/fases/17-planejamento-por-grafo/evidencia/001-green.txt
prova: "logic:test_pass (vermelho e verde, visto falhar antes de passar)"
must_haves:
  truths:
    - "A leitura de planos de uma fase enxerga plano gravado com o rótulo antes do identificador e plano gravado com o identificador antes do rótulo"
    - "O pareamento entre resumo e plano acerta nas duas convenções de resumo, com e sem prefixo do número da fase"
    - "Um único ponto do sistema decide o que é nome de plano e o que é nome de resumo, e todos os inventários consomem esse ponto"
    - "Identificador canônico duplicado na mesma fase é reportado como conflito, e não silenciosamente fundido"
  artifacts:
    - path: "up/bin/lib/plans.cjs"
      provides: "Canonicalização de identificador, inventário da fase e pareamento entre resumo e plano"
    - path: "up/bin/lib/plans.test.cjs"
      provides: "Teste vermelho e verde sobre as convenções de nome gravadas no repositório"
  key_links:
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/plans.cjs"
      via: "subcomando phase-plan-index e demais inventários, que deixam de filtrar nome por sufixo literal"
    - from: "up/workflows/build.md"
      to: "up/bin/up-tools.cjs"
      via: "uso do nome de arquivo devolvido pelo índice, em vez de reconstrução do nome a partir do identificador"
---

# Fase 17 Plano 001: Leitura de plano e de resumo nas duas convenções

<objective>
Fazer o inventário de uma fase enxergar todo plano e todo resumo gravado em disco, qualquer que seja a convenção de nome em uso no repositório, e concentrar essa decisão num único lugar. Sem isso, a fronteira derivada do plano 002 nasce cega justamente para a fase mais recente do repositório.
</objective>

**Onda:** 1. **Depende de:** nada dentro da fase (a fase inteira depende da fase 13).
**Tipo de prova:** lógica, vermelho e verde. O teste precisa ser visto falhar antes de passar, e as duas saídas ficam gravadas como evidência.

**Nota sobre a regra que esta fase entrega:** a proibição de caminho de arquivo em plano é o que a fase 17 constrói, e não o que ela já obedece. Os caminhos aparecem nos campos `<files>` porque o executor depende deles como trava de escopo. O corpo das tarefas descreve contrato de comportamento.

## Fato verificado que motiva este plano

Executado neste repositório antes de planejar, e reproduzível:

| Fase gravada | Forma do nome em disco | Resultado do índice hoje |
|---|---|---|
| Fase 11 | `PLAN-001.md` e `SUMMARY-001.md`, rótulo antes do identificador | `plans: []`, com o arquivo presente em disco |
| Fase 3 | `001-PLAN.md` e `03-001-SUMMARY.md` | plano listado, `has_summary: false` |
| Fase 9 | `001-SUMMARY.md` e `09-002-SUMMARY.md` na mesma fase | um plano pareia, o outro não |
| Fase 10 | `001-PLAN.md` e `001-SUMMARY.md` | correto |

A causa é o filtro `f.endsWith('-PLAN.md') || f === 'PLAN.md'`, repetido em seis pontos do despachante para plano e seis para resumo. Ele reconhece o rótulo apenas no fim do nome, e o pareamento compara o texto restante sem descontar o prefixo do número da fase. Existe ainda uma terceira forma documentada, `XX-YY-PLAN.md`, citada no mapa de arquitetura e no fluxo de execução.

## Contexto

@up/bin/up-tools.cjs - despachante, função `extractFrontmatter`, `cmdPhasePlanIndex` e os demais inventários
@up/bin/lib/github.test.cjs - único teste do lado UP hoje, e o padrão de harness a seguir
@up/bin/lib/core.cjs - convenção de exportação por objeto literal no fim do arquivo
@.plano/codebase/CONVENTIONS.md - nomeação, estilo, tratamento de erro e formato de saída da CLI

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/plans.test.cjs (novo), .plano/fases/17-planejamento-por-grafo/evidencia/001-red.txt (novo)</files>
<action>
Escrever o teste ANTES da implementação e VER FALHAR. Este é o passo vermelho e ele não pode ser pulado.

Harness local no mesmo formato de saída de `github.test.cjs`: função `t(nome, fn)` que imprime `  ok  -` ou `  FAIL -`, contagem final `N passed, M failed` e `process.exit(fail ? 1 : 0)`, para que qualquer corredor de testes leia o código de saída. Cada caso monta a lista de nomes de arquivo em memória, sem tocar disco, porque as funções sob teste recebem lista de nomes e número da fase, e não caminho.

Casos obrigatórios:

1. Rótulo antes do identificador, plano e resumo, na fase 11: o plano aparece e pareia.
2. Identificador antes do rótulo, plano e resumo sem prefixo, na fase 10: o plano aparece e pareia.
3. Identificador antes do rótulo com resumo prefixado pelo número da fase, na fase 3: o plano aparece e pareia. Este é o falso negativo real.
4. Fase mista, um plano em cada convenção: os dois aparecem, cada um com o seu resumo.
5. Forma com prefixo do número da fase no plano, na fase 10: canoniza para o mesmo identificador do plano sem prefixo.
6. Plano sem numeração, só o rótulo: aparece com o primeiro identificador.
7. Conflito de identificador: reportado na coleção própria, com as duas entradas preservadas.
8. Arquivos de verificação, contexto e pesquisa: nenhum entra no inventário.
9. Resumo sem plano correspondente: entra na coleção própria e não vira plano.
10. Segmento numérico inicial diferente do número da fase não é removido.

Rodar `node up/bin/lib/plans.test.cjs`, confirmar que FALHA (o módulo ainda não existe, então o require quebra) e gravar a saída em `evidencia/001-red.txt`.
</action>
<verify><automated>mkdir -p .plano/fases/17-planejamento-por-grafo/evidencia; node up/bin/lib/plans.test.cjs > .plano/fases/17-planejamento-por-grafo/evidencia/001-red.txt 2>&1; test -s .plano/fases/17-planejamento-por-grafo/evidencia/001-red.txt && echo "RED confirmado"</automated></verify>
<done>Os 10 casos existem, o teste foi executado, falhou, e a saída vermelha está gravada. Nenhuma linha de implementação foi escrita ainda.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/plans.cjs (novo)</files>
<action>
Implementar a canonicalização de identificador e o inventário da fase. Módulo CommonJS sem dependência externa, exportação por objeto literal no fim do arquivo, comentários de seção no formato `// --- Nome ---`.

`classifyPlanFile(fileName, phaseNumber)` devolve `{ label, id, file }`, com `label` em `plan`, `summary` ou `none`. Regras, nesta ordem:

1. Nome que não termina em extensão markdown devolve `label: 'none'`.
2. O rótulo é reconhecido em duas posições: no fim do nome precedido de hífen, e no começo do nome seguido de hífen. Nome que é só o rótulo também é reconhecido.
3. Rótulo diferente de plano e de resumo (verificação, contexto, revisão, pesquisa, e qualquer outro) devolve `label: 'none'`, e o arquivo fica fora do inventário.
4. Do restante, remover o segmento inicial igual ao número da fase, com ou sem zero à esquerda, e apenas quando ele for igual ao número da fase do diretório. Segmento numérico diferente do número da fase não é removido, porque removê-lo colapsaria identificadores legitimamente distintos.
5. Restante numérico normaliza para três dígitos com zeros à esquerda. Restante vazio canoniza para `001`.
6. Restante não numérico é preservado em minúsculas e continua servindo de identificador.

`inventoryPhase(fileNames, phaseNumber)` devolve `{ plans, summaries, id_conflicts }`. Cada entrada carrega `{ id, file }`. Conflito é o caso de dois arquivos do mesmo rótulo caindo no mesmo identificador, e a entrada de conflito lista `{ id, label, files }`, com as duas entradas preservadas nas coleções. Planos e resumos saem ordenados por identificador crescente, para que a ordem não dependa da ordem do sistema de arquivos.

Nomes de função e variável em inglês camelCase, chaves de saída em minúsculas com sublinhado, mensagens ao dono em português. Zero travessão.
</action>
<verify><automated>node -e "const p=require('./up/bin/lib/plans.cjs'); const a=p.classifyPlanFile('PLAN-001.md',11), b=p.classifyPlanFile('001-PLAN.md',10), c=p.classifyPlanFile('03-001-SUMMARY.md',3), d=p.classifyPlanFile('17-VERIFICATION.md',17); if(a.label!=='plan'||a.id!=='001') throw new Error('a='+JSON.stringify(a)); if(b.id!=='001') throw new Error('b'); if(c.label!=='summary'||c.id!=='001') throw new Error('c='+JSON.stringify(c)); if(d.label!=='none') throw new Error('d'); console.log('classify ok');"</automated></verify>
<done>As três convenções de nome canonizam para o mesmo identificador quando o número é o mesmo, rótulo desconhecido fica fora, e o inventário reporta conflito em vez de fundir. Imprime `classify ok`.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/plans.cjs (editar), .plano/fases/17-planejamento-por-grafo/evidencia/001-green.txt (novo)</files>
<action>
Implementar o pareamento e fechar o verde.

`pairSummaries(inventory)` devolve, por plano, `{ id, file, has_summary, summary_file }`, casando pelo identificador canônico. Resumo sem plano correspondente entra em `orphan_summaries`, com identificador e nome de arquivo, em vez de ser descartado: resumo órfão é sinal de plano perdido, e esconder isso é o defeito que este plano existe para consertar.

Rodar o teste da tarefa 1 até ficar todo verde e gravar a saída em `evidencia/001-green.txt`. Nenhum caso pode ser removido ou afrouxado para chegar ao verde.
</action>
<verify><automated>node up/bin/lib/plans.test.cjs > .plano/fases/17-planejamento-por-grafo/evidencia/001-green.txt 2>&1; grep -q "0 failed" .plano/fases/17-planejamento-por-grafo/evidencia/001-green.txt && echo "GREEN confirmado"</automated></verify>
<done>Os 10 casos passam, a saída verde está gravada, e o vermelho anterior continua no arquivo de evidência para comparação.</done>
</task>

<task id="4" type="auto">
<files>up/bin/up-tools.cjs (editar)</files>
<action>
Ligar o subcomando de índice de planos da fase à biblioteca.

`cmdPhasePlanIndex` deixa de filtrar nome por conta própria e passa a chamar `inventoryPhase` e `pairSummaries`. Contrato da resposta:

1. Todos os campos existentes continuam existindo com o mesmo nome e o mesmo significado: `phase`, `plans[]` (com `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`), `waves`, `incomplete` e `has_checkpoints`. Consumidor antigo não muda.
2. Campos acrescentados, todos aditivos: por plano, `file` e `summary_file`; no topo, `id_conflicts` e `orphan_summaries`.
3. Plano sem frontmatter continua sendo listado, com `wave` assumindo o valor um e `autonomous` assumindo verdadeiro. A fase 11 está gravada assim, e tirá-la do índice trocaria um defeito por outro.

Acrescentar `const plans = require('./lib/plans.cjs');` junto dos outros requires de lib.
</action>
<verify><automated>node up/bin/up-tools.cjs phase-plan-index 11 | grep -q '"id"' && node up/bin/up-tools.cjs phase-plan-index 3 | grep -q '"has_summary": true' && node up/bin/up-tools.cjs phase-plan-index 10 | grep -q '"has_summary": true' && echo "indice ok"</automated></verify>
<done>A fase 11 passa a listar um plano com resumo pareado, a fase 3 passa a reportar resumo presente, e a fase 10 continua igual nos campos que já existiam.</done>
</task>

<task id="5" type="auto">
<files>up/bin/up-tools.cjs (editar)</files>
<action>
Trocar os demais pontos de filtro pela biblioteca. São seis para plano e seis para resumo, e todos ficam sem decisão própria sobre nome.

Os pontos servem: o inventário de fase da abertura da execução (`init executar-fase`), a listagem de fase por número (`phase find`), o cálculo de progresso do roadmap, o agregador de status, o resumo de progresso e a guarda de remoção de fase, que hoje conta resumo para decidir se a fase já foi executada.

Cada ponto passa a receber a lista de nomes do diretório e o número da fase, e a usar as coleções devolvidas pela biblioteca. Nenhum ponto do despachante volta a escrever comparação por sufixo literal.
</action>
<verify><automated>test $(grep -c "endsWith('-PLAN.md')" up/bin/up-tools.cjs) -eq 0 && test $(grep -c "endsWith('-SUMMARY.md')" up/bin/up-tools.cjs) -eq 0 && node up/bin/up-tools.cjs progress --format table --raw | grep -q "11" && echo "inventarios ok"</automated></verify>
<done>Nenhuma ocorrência do filtro literal sobrou no despachante, e a contagem de planos e resumos de cada fase gravada bate com o disco, inclusive na fase 11.</done>
</task>

<task id="6" type="auto">
<files>up/workflows/build.md (editar), up/workflows/plan.md (editar)</files>
<action>
Tirar dos fluxos a reconstrução de nome de arquivo.

Em `build.md`, no passo que descobre planos e ondas: o arquivo de cada plano passa a vir do campo `file` devolvido pelo índice, e não da montagem do nome a partir do identificador com fallback para o rótulo sozinho. A guarda que confere um resumo por plano ao fim da rodada passa a usar `has_summary` do índice, e não a existência de um nome de resumo montado à mão. A contagem consolidada de resumos passa a vir do índice, e não de listagem com curinga.

Em `plan.md`, no gate que confere se a fase tem plano: a contagem passa a vir do índice, e não de listagem com curinga de sufixo, que enxerga só uma das convenções.

**Quarto consumidor, emenda RV-013.** No estágio de validação do plano pronto, o passo que valida os planos listados extrai a lista com um padrão que exige dois grupos numéricos no nome do arquivo. Verificado por execução: contra o plano pronto real deste repositório o padrão captura lista vazia, o laço não itera, a variável de falha nunca é marcada, e o estágio conclui aprovado. É pior do que travar, porque parece que passou. A lista de planos passa a ser resolvida pela biblioteca de planos, com a mesma canonicalização das demais tarefas deste plano, e lista vazia com plano pronto presente vira falha explícita, com mensagem dizendo que nenhum plano foi resolvido, em vez de sucesso silencioso. Plano listado que não existe em disco continua sendo falha, como já é hoje.

Nenhum passo é removido dos dois fluxos: a mudança é de origem do dado, não de processo.
</action>
<verify><automated>grep -q "phase-plan-index" up/workflows/plan.md && test $(grep -c 'PLAN_COUNT=$(ls' up/workflows/plan.md) -eq 0 && test $(grep -c '{id}-PLAN.md' up/workflows/build.md) -eq 0 && test $(grep -c '0-9]+-\[0-9]+-PLAN' up/workflows/build.md) -eq 0 && grep -qi "nenhum plano resolvido" up/workflows/build.md && echo "fluxos ok"</automated></verify>
<done>Os dois fluxos consomem o nome de arquivo e a presença de resumo do índice, nenhum deles monta nome de plano a partir do identificador, e o estágio de validação do plano pronto trata lista vazia como falha explícita.</done>
</task>

<task id="7" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/001-fases-reais.txt (novo)</files>
<action>
Conferir em fase real e registrar o antes e o depois.

Rodar o índice sobre as fases 3, 9, 10, 11 e 17 e gravar a saída. Conferir, contra o disco:

1. Fase 11: um plano listado, com resumo pareado. Antes: lista vazia.
2. Fase 3: um plano, resumo presente. Antes: resumo ausente.
3. Fase 9: dois planos, os dois com resumo, apesar de os resumos estarem em convenções diferentes. Antes: um pareava.
4. Fase 10: resposta idêntica à de antes nos campos que já existiam.
5. Fase 17: cinco planos listados.

Conferir também o quarto consumidor, da emenda RV-013: rodar o estágio de validação do plano pronto contra o plano pronto real deste repositório e confirmar que ele passa a resolver os planos listados nas três convenções de nome. Rodar ainda contra um plano pronto sintético que não lista plano nenhum, e confirmar que o estágio agora falha com mensagem explícita, em vez de aprovar em silêncio como fazia antes.

Confirmar ainda que nenhum projeto com planejamento anterior a este ciclo precisou de migração: nenhum arquivo em `.plano/fases/` foi renomeado, movido ou reescrito por esta tarefa.
</action>
<verify><automated>for p in 3 9 10 11 17; do node up/bin/up-tools.cjs phase-plan-index $p; echo; done > .plano/fases/17-planejamento-por-grafo/evidencia/001-fases-reais.txt 2>&1; test $(grep -c '"has_summary": false' .plano/fases/17-planejamento-por-grafo/evidencia/001-fases-reais.txt) -eq 5 && test -z "$(git status --porcelain .plano/fases/03-templates-formatos-padrao .plano/fases/11-suporte-grok-build)" && echo "fases reais ok"</automated></verify>
<done>As cinco fases foram conferidas, o antes e o depois estão gravados, os únicos planos sem resumo são os cinco da própria fase 17, e nenhum arquivo de fase antiga foi tocado.</done>
</task>

## Critério de aceite do plano

- [ ] O índice da fase 11 lista o plano dela, e o resumo pareia
- [ ] O índice da fase 3 reporta resumo presente
- [ ] O índice da fase 10 continua respondendo igual nos campos que já existiam
- [ ] O teste foi visto falhar antes da correção e passa depois, com os 10 casos, e as duas saídas estão gravadas
- [ ] Nenhum ponto do despachante e nenhum dos dois fluxos decide sozinho o que é nome de plano ou de resumo
- [ ] Nenhum arquivo de fase anterior a este ciclo foi renomeado ou reescrito
- [ ] O estágio de validação do plano pronto resolve os planos pela biblioteca e trata lista vazia como falha explícita, em vez de aprovar em silêncio

## Fora de escopo

1. Padronizar as convenções de nome em disco, ou renomear arquivo de fase já gravada. A decisão desta fase é ler as três formas, e não eleger uma. Renomear quebraria histórico de commit e referência cruzada em resumo antigo.
2. Corrigir a extração de objetivo do plano, que devolve texto truncado na fase 10. É defeito real, de outra superfície, e não afeta a leitura de nome.
3. Corrigir a contagem de tarefas e a leitura da onda no índice. São do plano 002 desta fase, que declara aresta para este.
4. Acrescentar aresta de bloqueio ou fronteira. É o plano 002 desta fase.
5. Sedimento de papéis removidos no template do plano pronto. Passe próprio, com briefing próprio.

## Decisões registradas

**Decisão 1. Um só lugar decide o que é nome de plano.** Alternativa rejeitada: corrigir o filtro em cada um dos doze pontos onde ele aparece. Rejeitada porque a duplicação é a causa do defeito, e corrigir doze cópias garante que a décima terceira nasça errada. A décima terceira já existia: é o padrão do estágio de validação do plano pronto, achado pela revisão, e ele falhava em silêncio desde sempre.

**Decisão 2. Prefixo do número da fase só é removido quando confere com a fase do diretório.** Alternativa rejeitada: remover qualquer segmento numérico inicial. Rejeitada porque colapsaria identificadores legitimamente distintos numa fase que use identificador composto.

**Decisão 3. Conflito de identificador e resumo órfão são reportados, não resolvidos.** Alternativa rejeitada: fundir silenciosamente. Rejeitada porque fundir esconde a perda de um plano, que é exatamente o defeito que este plano conserta.
