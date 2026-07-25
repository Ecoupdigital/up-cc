---
phase: 20-nevoa-e-fronteira-do-roadmap
plan: "004"
type: feature
autonomous: true
wave: 3
depends_on: ["001", "002"]
requirements: [WAY-04]
prova: smoke
must_haves:
  truths:
    - "Fechar uma fase gradua a névoa correspondente em fase nova"
    - "A área graduada fica limpa: o item some da névoa e a seção continua existindo com o teste de graduação"
    - "O item graduado aparece exatamente uma vez como fase: um checkbox, uma seção de detalhe e uma linha de progresso"
    - "Rodar a graduação de novo para a mesma fase não gradua nada e deixa o roadmap idêntico"
    - "Fase sem névoa correspondente fecha sem efeito colateral nenhum"
  artifacts:
    - path: "up/bin/lib/roadmap-sections.cjs"
      provides: "Operação de graduação: seleção por fase, escrita da fase nova e limpeza do bloco graduado"
    - path: "up/workflows/build.md"
      provides: "Chamada da graduação no fechamento de fase, antes da reavaliação do roadmap"
    - path: "up/bin/lib/roadmap-sections.test.cjs"
      provides: "Prova vermelho e verde da graduação, incluindo limpeza, não duplicação e idempotência"
  key_links:
    - from: "up/workflows/build.md (fechamento de fase)"
      to: "up/bin/lib/roadmap-sections.cjs"
      via: "subcomando fog-graduate da linha de comando de ferramentas, com o número da fase fechada"
    - from: "up/bin/lib/roadmap-sections.cjs"
      to: ".plano/fases/"
      via: "criação do diretório da fase graduada, no padrão de numeração já usado pelo sistema"
---

# Fase 20 Plano 004: Graduação da névoa no fechamento de fase

**Onda:** 3 (roda depois das ondas 1 e 2, sozinho)
**Depende de:** planos 001 e 002 (usa o recorte de seção, a gramática da névoa e o intervalo de linhas de cada item)
**Tipo de prova:** smoke (fechamento de fase simulado em repositório temporário) somada a teste vermelho e verde sobre a graduação
**Requisitos cobertos:** WAY-04

## Posição no grafo

A fase 20 é a última do ciclo e nada depende dela, o que a torna o corte mais barato se o escopo apertar. Este plano é o mais tardio dentro da fase porque escreve no roadmap, e escrever exige que a leitura das duas seções já esteja provada. Ele fica sozinho na onda 3 de propósito: é o único da fase que altera o roadmap de forma automática, e alteração automática de roadmap não divide turno com ninguém.

## Objetivo

Fechar o ciclo da névoa. Sem graduação, a seção de não especificado vira depósito: entra item e nunca sai, e em três meses ela é um cemitério que ninguém lê. Com graduação, fechar uma fase promove o que amadureceu e limpa o que promoveu, de modo que a seção sempre mostra só o que continua nublado.

A limpeza é a metade que costuma ser esquecida, e é ela que impede o pior desfecho: o mesmo trabalho existindo duas vezes, uma como fase e outra como névoa, divergindo com o tempo.

## Convenção deste plano sobre caminhos

Cada superfície aparece primeiro como contrato público (nome de subcomando, nome de função exportada, nome de passo do workflow) e o caminho vem em seguida como localização conferida em 2026-07-25.

## Contexto

@up/bin/lib/roadmap-sections.cjs - módulo dos planos 001 e 002, com `findSection`, `parseFog` devolvendo `line_start` e `line_end` por item, `sectionPurity` e `normalizeLabel`
@up/bin/up-tools.cjs - a operação de acrescentar fase (por volta da linha 1606) mostra o padrão já usado: varre o maior número de fase, calcula o próximo, cria diretório com dois dígitos e slug, e insere a seção de detalhe antes do último separador. A operação de gerar fases a partir de relatório (por volta da linha 1904) mostra o padrão completo: detecção de idioma, inserção antes da tabela de progresso, checkbox na lista de fases e linha na tabela de progresso
@up/workflows/build.md - o passo 3.9 é a reavaliação de roadmap pós-fase e já commita o roadmap; é a vizinhança exata onde a graduação entra
@up/templates/roadmap.md - gramática canônica da névoa, escrita no plano 001

## Regra de não colisão

Este plano roda sozinho na onda 3. Ainda assim vale a regra do arquivo de despacho: substituição cirúrgica de trecho único, jamais reescrita do arquivo inteiro, com checagem de sintaxe antes de commitar.

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/roadmap-sections.cjs (operação de graduação)</files>
<action>
Implementar `graduateFog(cwd, options)` no módulo, com `options` em `{ phase, dryRun }`.

Passos, nesta ordem:

1. Ler o roadmap. Sem roadmap, devolver `{ section_present: false, graduated: [], count: 0, reason: 'roadmap_ausente' }` sem escrever nada.
2. `parseFog` sobre o conteúdo. Seção ausente devolve `{ section_present: false, graduated: [], count: 0, reason: 'secao_ausente' }`. **Isso é sucesso, não erro**: projeto que não usa névoa fecha fase normalmente.
3. Selecionar os itens cujo `graduates_with` normaliza igual ao número da fase recebida. Comparação por string aparada, aceitando `15`, `15.1` e sufixo de letra, no mesmo formato que o resto do sistema usa para número de fase. Nenhum item selecionado devolve `{ graduated: [], count: 0, reason: 'sem_item_para_esta_fase' }` e **não escreve nada**, o que dá a idempotência de graça: rodar de novo não acha nada porque a área já foi limpa.
4. Detectar o idioma do roadmap pela presença de `### Fase` seguido de dígito, igual ao resto da linha de comando.
5. Calcular o maior número de fase existente varrendo os cabeçalhos de fase, e numerar as fases novas a partir do próximo, incrementando a cada item quando houver mais de um.
6. Para cada item selecionado, na ordem em que aparece na seção, produzir quatro escritas e uma remoção:
   - **Checkbox** ao fim da lista da seção de fases, no formato usado hoje pelo roadmap, com o rótulo do item como nome da fase e o pressentimento encurtado como descrição de uma linha.
   - **Seção de detalhe**, inserida imediatamente antes do cabeçalho da tabela de progresso (mesmo ponto de inserção já usado pela geração de fases a partir de relatório), com este conteúdo em português:
     - objetivo igual ao pressentimento do item;
     - dependência apontando a fase que estava sendo fechada;
     - uma linha declarando a origem: graduada da névoa, com o identificador do item e a fase em cujo fechamento a graduação aconteceu;
     - requisitos e critérios de sucesso marcados como a definir no planejamento desta fase, porque graduar significa que a pergunta já pode ser enunciada, e não que ela já foi respondida;
     - contagem de planos zerada.
   - **Linha na tabela de progresso**, no formato das linhas existentes, com status não iniciado.
   - **Diretório da fase** em `.plano/fases/`, com dois dígitos e slug derivado do rótulo, contendo um arquivo vazio de marcação, igual ao que a operação de acrescentar fase já faz.
   - **Remoção do bloco do item** da seção de névoa, usando exatamente `line_start` e `line_end` devolvidos por `parseFog`, sem tocar no item vizinho.
7. Se a seção de névoa ficar sem nenhum item, manter o cabeçalho e o bloco do teste de graduação e acrescentar uma linha dizendo que não há item em névoa no momento. Se essa linha já existir, não duplicar. **Nunca remover a seção**: o lugar é formal e continua existindo mesmo vazio, senão a próxima incerteza volta a não ter onde ser escrita.
8. Com `dryRun` verdadeiro, calcular tudo e devolver o resultado **sem escrever no roadmap e sem criar diretório**.

Retorno:
```javascript
{
  section_present: true,
  phase: '15',
  graduated: [ { id: 'NEV-01', label: '...', new_phase: 21, directory: '.plano/fases/21-slug/' } ],
  count: 1,
  cleaned_ids: ['NEV-01'],
  remaining_fog: 1,
  section_empty_now: false,
  roadmap_updated: true,
  dry_run: false
}
```

Acrescentar `graduateFog` ao objeto de exports.

Regra de segurança da escrita: a atualização do roadmap é feita uma vez, ao final, com o conteúdo inteiro já montado em memória. Nada de reler o arquivo entre uma escrita e outra dentro da mesma execução, porque isso é como se produz roadmap pela metade quando um passo falha.
</action>
<verify><automated>node --check up/bin/lib/roadmap-sections.cjs && node -e "const m=require('./up/bin/lib/roadmap-sections.cjs'); if(typeof m.graduateFog!=='function') throw new Error('faltou export graduateFog'); const r=m.graduateFog(process.cwd(), { phase: '99', dryRun: true }); if(r.count!==0) throw new Error('fase sem névoa deveria graduar zero'); console.log('graduateFog ok', JSON.stringify(r.reason||''));"</automated></verify>
<done>A operação existe, aceita execução seca, devolve zero graduações para fase sem item correspondente e não escreve nada nesse caso.</done>
</task>

<task id="2" type="auto">
<files>up/bin/up-tools.cjs (apenas o `case 'roadmap'` e a seção ROADMAP COMMANDS)</files>
<action>
Abrir o subcomando de graduação.

Dentro do `case 'roadmap'`, acrescentar o ramo depois de `scope-check` e atualizar a mensagem de erro para listar os seis subcomandos:

```javascript
} else if (sub === 'fog-graduate') {
  const phaseIdx = args.indexOf('--phase');
  cmdRoadmapFogGraduate(cwd, {
    phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
    dryRun: args.indexOf('--dry-run') !== -1,
  }, raw);
} else {
  error('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress, fog-list, scope-check, fog-graduate');
}
```

Implementar `cmdRoadmapFogGraduate(cwd, options, raw)` na seção ROADMAP COMMANDS. Sem `--phase`, encerrar com a mensagem de uso, seguindo o padrão das outras operações que exigem número de fase. Com fase, devolver o objeto de `graduateFog` e terminar em `output(result, raw, rawValue)`. Saída crua: `"<count> graduada(s): <lista de identificadores ou 'nenhuma'>"`.
</action>
<verify><automated>node --check up/bin/up-tools.cjs && node up/bin/up-tools.cjs roadmap fog-graduate --phase 99 --dry-run --raw && node up/bin/up-tools.cjs roadmap fog-list --raw > /dev/null && node up/bin/up-tools.cjs roadmap scope-check --raw > /dev/null && node up/bin/up-tools.cjs roadmap analyze --raw > /dev/null && echo "despacho intacto"</automated></verify>
<done>`roadmap fog-graduate --phase N` responde, aceita execução seca e não altera o roadmap deste repositório quando não há item para a fase pedida. Os cinco subcomandos anteriores continuam respondendo.</done>
</task>

<task id="3" type="auto">
<files>up/workflows/build.md (passo 3.9, reavaliação de roadmap pós-fase)</files>
<action>
Ligar a graduação ao fechamento de fase.

Acrescentar um passo 3.9.0, no início do passo 3.9 e **antes** das três checagens de reavaliação que já existem, com este conteúdo:

1. Chamada, com o número da fase que acabou de fechar:
```bash
GRAD=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap fog-graduate --phase {phase_number} --raw)
```
2. Zero graduações: seguir em silêncio para as checagens de reavaliação. É o caso comum e não merece ruído.
3. Uma ou mais graduações: imprimir uma linha por fase criada, dizendo qual item de névoa graduou, em qual fase virou e que a área foi limpa. A ordem importa: a graduação roda **antes** das três checagens porque a reavaliação precisa enxergar as fases recém-criadas, senão ela avalia um roadmap desatualizado no mesmo turno.
4. Acrescentar os arquivos novos ao commit que o passo 3.9 já faz do roadmap, incluindo o diretório da fase graduada. Mensagem no padrão existente, citando a graduação.
5. Declarar em uma linha, no próprio workflow, por que a área é limpa: o item graduado passa a existir como fase, e mantê-lo também na névoa criaria dois registros do mesmo trabalho, que divergem com o tempo.
6. Falha aberta: erro na chamada avisa e segue. Fechamento de fase não pode ser bloqueado por graduação, porque graduação é ganho, e não pré-requisito.

Acrescentar o passo à lista de critérios de sucesso do workflow, se houver menção ao passo 3.9 lá.
</action>
<verify><automated>grep -q "fog-graduate" up/workflows/build.md && grep -n "3.9.0" up/workflows/build.md && awk '/### 3.9 /{f=1} f&&/fog-graduate/{print "graduacao dentro do 3.9"; exit}' up/workflows/build.md | grep -q "graduacao dentro do 3.9" && ! grep -qP "[\x{2014}\x{2013}]" up/workflows/build.md && echo "hook ok"</automated></verify>
<done>O workflow chama a graduação no início do passo 3.9, antes das três checagens de reavaliação, reporta as fases criadas, inclui os arquivos novos no commit já existente e falha aberto.</done>
</task>

<task id="4" type="auto">
<files>up/bin/lib/roadmap-sections.test.cjs (estender o teste dos planos 001 e 002)</files>
<action>
Acrescentar os casos de graduação, no mesmo estilo, com repositório temporário criado por `fs.mkdtempSync` e `.plano/fases/` dentro. **Ver o vermelho antes do verde** e registrar as duas saídas no resumo do plano.

Fixture: `ROADMAP_PARA_GRADUAR`, com três fases, tabela de progresso, e seção de névoa com o bloco do teste de graduação e três itens: `NEV-01` com `Gradua com: fase 2`, `NEV-02` com `Gradua com: fase 3` e `NEV-03` sem linha de graduação.

Casos, cada um provando um comportamento:
1. **Gradua o certo**: graduar pela fase 2 devolve uma graduação, e ela é `NEV-01`.
2. **Não duplica**: no roadmap resultante, o rótulo de `NEV-01` aparece exatamente uma vez como checkbox de fase, exatamente uma vez como cabeçalho de detalhe de fase e exatamente uma vez como linha da tabela de progresso. Contar as três ocorrências por expressão regular e afirmar igualdade a um. É o caso que prova a metade "não duplicada" do requisito.
3. **Limpa a área**: no roadmap resultante, `NEV-01` não aparece mais dentro da seção de névoa, e `parseFog` devolve dois itens restantes, ambos íntegros. O vizinho `NEV-02` continua com pressentimento e linha de graduação intactos, o que prova que o recorte por linha não comeu o bloco de baixo.
4. **A seção sobrevive**: o cabeçalho da seção e o bloco do teste de graduação continuam presentes depois da graduação, e `graduationTestPresent` continua verdadeiro.
5. **Idempotência**: graduar de novo pela fase 2 devolve zero graduações e o conteúdo do roadmap fica byte a byte igual ao de antes da segunda chamada. Comparar as duas strings inteiras.
6. **Fase sem névoa**: graduar pela fase 9 devolve zero graduações e não altera o arquivo.
7. **Item sem linha de graduação nunca gradua**: nenhuma chamada por número de fase seleciona `NEV-03`, e ele continua na seção depois de graduar 2 e 3.
8. **Diretório criado**: a graduação cria o diretório da fase nova em `.plano/fases/`, com dois dígitos e slug, contendo o arquivo de marcação.
9. **Numeração sequencial**: com dois itens graduando pela mesma fase, saem duas fases com números consecutivos, e as duas aparecem uma vez cada nas três superfícies do caso 2.
10. **Esvaziar não apaga**: graduando todos os itens que têm linha de graduação e removendo o restante da fixture, a seção fica com o cabeçalho, o teste de graduação e a linha dizendo que não há item em névoa, e `parseFog` devolve `section_present` verdadeiro com zero itens.
11. **Execução seca**: com execução seca, o resultado lista a graduação prevista mas o arquivo em disco continua idêntico e nenhum diretório é criado.
12. **Roadmap sem seção**: a chamada devolve seção ausente e não altera o arquivo, que é o caso de projeto anterior a este ciclo.
</action>
<verify><automated>node up/bin/lib/roadmap-sections.test.cjs</automated></verify>
<done>Os casos dos planos 001 e 002 continuam passando e os doze casos novos passam, com o vermelho de pelo menos um registrado antes do verde. Os casos 2, 3 e 5 são os que provam, respectivamente, ausência de duplicação, limpeza da área graduada e idempotência.</done>
</task>

<task id="5" type="auto">
<files>diretório temporário do sistema (repositório de smoke), .plano/fases/20-nevoa-e-fronteira-do-roadmap/ (registro da evidência no resumo do plano)</files>
<action>
Rodar a prova smoke da graduação, que é o tipo de prova exigido pela fase, num repositório temporário fora deste.

Preparação: criar diretório temporário com repositório git iniciado e `.plano/` contendo um roadmap escrito no formato canônico, com duas fases, tabela de progresso e seção de névoa com um item graduando pela fase 2.

Execução, na ordem em que o fechamento de fase acontece de verdade:
1. Rodar a graduação pela fase 2 pelo subcomando, exatamente como o workflow de build a chama.
2. Conferir na saída: uma graduação, com identificador, rótulo e número da fase nova.
3. Conferir no arquivo: a fase nova existe com checkbox, seção de detalhe e linha de progresso, uma vez cada; a névoa não tem mais o item; o cabeçalho da seção e o teste de graduação continuam lá.
4. Conferir no disco: o diretório da fase nova existe em `.plano/fases/`.
5. Rodar a análise de roadmap do próprio sistema e conferir que ela enxerga a fase nova, o que prova que a fase graduada não é um texto solto e sim uma fase de verdade para o resto do sistema.
6. Rodar a graduação de novo pela fase 2 e conferir zero graduações com arquivo inalterado.

Registrar no resumo do plano as saídas dos passos 2, 5 e 6, e o trecho do roadmap antes e depois da graduação. Apagar o diretório temporário ao final.
</action>
<verify><automated>D=$(mktemp -d) && mkdir -p "$D/.plano/fases" && printf '# Roadmap: teste\n\n## Fases\n\n- [x] **Fase 1: base** - pronta\n- [ ] **Fase 2: alvo** - em curso\n\n## Detalhes das Fases\n\n### Fase 1: base\n**Objetivo**: base\n**Planos**: 1/1\n\n### Fase 2: alvo\n**Objetivo**: alvo\n**Planos**: 0/1\n\n## Tabela de Progresso\n\n| Fase | Planos Completos | Status | Completado |\n|------|-----------------|--------|------------|\n| 1. base | 1/1 | Completa | 2026-01-01 |\n| 2. alvo | 0/1 | Em progresso | - |\n\n## Ainda não especificado\n\n> Teste de graduação: um item vira fase quando a pergunta pode ser ENUNCIADA com precisão agora, e não quando ela pode ser RESPONDIDA agora.\n\n- **NEV-01: notificacao ao usuario**\n  - Pressentimento: em algum momento o usuario precisa saber que algo mudou sem abrir o app\n  - Gradua com: fase 2\n' > "$D/.plano/ROADMAP.md" && node up/bin/up-tools.cjs roadmap fog-graduate --phase 2 --cwd "$D" --raw | grep -q "1 graduada" && node up/bin/up-tools.cjs roadmap fog-list --cwd "$D" --raw | grep -q "0 item" && node up/bin/up-tools.cjs roadmap analyze --cwd "$D" | grep -q '"phase_count": 3' && A=$(md5sum "$D/.plano/ROADMAP.md" | cut -d" " -f1) && node up/bin/up-tools.cjs roadmap fog-graduate --phase 2 --cwd "$D" --raw | grep -q "0 graduada" && B=$(md5sum "$D/.plano/ROADMAP.md" | cut -d" " -f1) && [ "$A" = "$B" ] && rm -rf "$D" && echo "smoke de graduacao ok"</automated></verify>
<done>Num repositório limpo, fechar a fase 2 gradua o item de névoa em fase 3, a área graduada fica vazia mas a seção sobrevive com o teste de graduação, a análise de roadmap passa a enxergar três fases, e a segunda chamada não muda um byte do arquivo.</done>
</task>

## Critérios de aceite do plano

Verdadeiro ao fim, conferível por comando:

Fechar uma fase gradua os itens de névoa que apontam para ela, criando fase nova com checkbox, seção de detalhe, linha de progresso e diretório (WAY-04, primeira metade).

A área graduada fica limpa: o item some da névoa, o vizinho permanece íntegro, e a seção continua existindo com o teste de graduação escrito, inclusive quando fica vazia (WAY-04, segunda metade).

O item graduado aparece exatamente uma vez em cada uma das três superfícies do roadmap, o que é afirmado por contagem no teste e não por leitura visual.

Segunda chamada para a mesma fase gradua zero e deixa o arquivo byte a byte igual.

Fase sem névoa correspondente e roadmap sem a seção fecham sem efeito colateral, o que preserva projeto anterior a este ciclo.

## Tipo de prova

Smoke como prova principal, exercida na tarefa 5 sobre um repositório temporário com roadmap real, incluindo a conferência de que a análise de roadmap do próprio sistema passa a enxergar a fase graduada. Somada a ela, prova de lógica vermelho e verde na tarefa 4, com casos dedicados a não duplicação, limpeza e idempotência, que são exatamente as três coisas que costumam quebrar em escrita automática de documento.

Registro esperado no log de aprovações, no formato de seis colunas, com escopo `fase=20 plano=004` e evidência `smoke:pass`.

## Fora de escopo

Escrita de item novo na névoa durante o questionamento: o questionamento é da fase 15, e a gramática já está publicada nos planos 001 e 002. Aqui só se gradua o que já está escrito.

Planejamento automático da fase graduada: a graduação cria a fase com requisitos e critérios a definir, e para. Planejar é decisão do dono, e graduar significa que a pergunta pode ser enunciada, não que ela já foi respondida.

Renumeração de fases existentes: a fase graduada entra ao fim da numeração, como toda fase acrescentada. Nada é renumerado.

Remoção da seção de névoa quando ela esvazia: proibida, e provada por caso de teste.

Migração de roadmap de projeto existente para o formato novo: projeto sem a seção segue igual.
