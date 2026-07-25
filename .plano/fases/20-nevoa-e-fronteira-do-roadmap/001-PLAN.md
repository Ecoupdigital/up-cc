---
phase: 20-nevoa-e-fronteira-do-roadmap
plan: "001"
type: feature
autonomous: true
wave: 1
depends_on: []
requirements: [WAY-02, WAY-03]
prova: smoke
must_haves:
  truths:
    - "O roadmap tem seção formal para o que se pressente e ainda não dá para especificar"
    - "O teste de graduação está escrito dentro do próprio roadmap, em termos de ENUNCIAR a pergunta e não de RESPONDER a pergunta"
    - "Uma leitura determinística devolve os itens da névoa, com a fase de graduação de cada um, e reprova item malformado"
    - "Roadmap escrito antes deste ciclo, sem a seção, continua sendo lido sem erro"
  artifacts:
    - path: "up/bin/lib/roadmap-sections.cjs"
      provides: "Núcleo de leitura das seções do roadmap: recorte por cabeçalho, pureza de área, normalização e gramática da névoa"
    - path: "up/templates/roadmap.md"
      provides: "Formato canônico da seção de névoa, com o teste de graduação redigido inline"
    - path: "up/bin/lib/roadmap-sections.test.cjs"
      provides: "Prova vermelho e verde do leitor de névoa, com fixtures de roadmap bom, ruim, legado e em inglês"
  key_links:
    - from: "up/bin/up-tools.cjs (case roadmap)"
      to: "up/bin/lib/roadmap-sections.cjs"
      via: "require do módulo e o subcomando novo fog-list"
    - from: "up/templates/roadmap.md"
      to: "up/bin/lib/roadmap-sections.cjs"
      via: "a gramática escrita no template é exatamente a que o leitor reconhece"
---

# Fase 20 Plano 001: Seção de névoa no roadmap e núcleo de leitura

**Onda:** 1 (primeira onda da fase, nada roda antes)
**Depende de:** nenhum plano desta fase
**Tipo de prova:** smoke (leitura do roadmap real deste repositório) somada a teste vermelho e verde sobre o leitor
**Requisitos cobertos:** WAY-02, WAY-03

## Posição no grafo

A fase 20 é a última do ciclo. Ela depende da fase 13 (o auto-aborto fala com o dono no formato de pergunta com recomendação) e da fase 15 (o auto-aborto decide a partir do resultado do grill). **Nada depende da fase 20**, o que a torna o corte mais barato do ciclo se o escopo apertar. Este plano em particular não depende de 13 nem de 15: mexe só no roadmap e na leitura dele, então sobrevive mesmo que o resto do ciclo atrase.

Dentro da fase, este plano é a primeira onda porque cria o módulo de leitura que os planos 002 e 004 estendem. As ondas desta fase são numeradas a partir de 1, porque o índice de planos do próprio sistema trata onda zero como onda um e agruparia este plano com os que dependem dele.

## Objetivo

Dar lugar formal, dentro do roadmap, para a incerteza que ainda não vira fase, e entregar a leitura determinística dessa área. Ataca o primeiro dos dois males do roadmap: fase distante inventada no dia um com detalhe falso. A troca é honesta: em vez de uma fase 7 fictícia, uma linha que diz o que se pressente e qual pergunta ainda não sai inteira da boca.

## Convenção deste plano sobre caminhos

Cada superfície aparece primeiro como contrato público (nome de subcomando, nome de função exportada, nome de seção) e o caminho vem em seguida como localização conferida em 2026-07-25, para o executor não caçar arquivo. Se a regra de durabilidade de plano da fase 17 já estiver valendo na execução, o contrato manda e o caminho é conferência.

## Contexto

@up/bin/lib/core.cjs - convenções de módulo: CommonJS, `module.exports` como objeto literal no fim, leitura de arquivo devolvendo null em vez de lançar, zero dependência externa
@up/bin/up-tools.cjs - despacho de subcomandos (o `case 'roadmap'` fica por volta da linha 281) e a função `output(result, raw, rawValue)`, que serializa JSON e sempre sai com código 0
@up/templates/roadmap.md - template atual, hoje em inglês, com as seções Phases, Phase Details e Progress
@.plano/ROADMAP.md - roadmap real deste repositório, em português, com 20 fases e tabela de progresso
@up/bin/lib/github.test.cjs - estilo de teste do repositório: sem framework, `assert`, helper `t(nome, fn)`, saída com código 1 quando há falha

## Regra de não colisão

Este plano é o único da onda 1. Ele cria o módulo e abre um subcomando dentro do `case 'roadmap'`. Os planos das ondas seguintes editam pontos declarados e distintos do mesmo arquivo de despacho. Portanto: **edite o arquivo de despacho por substituição cirúrgica de trecho único, nunca reescreva o arquivo inteiro.**

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/roadmap-sections.cjs (arquivo novo)</files>
<action>
Criar o núcleo de leitura das seções do roadmap. CommonJS, `'use strict'` no topo, `require('fs')` e `require('path')` apenas, exports por objeto literal no fim do arquivo.

Constantes de gramática no topo, todas exportadas para o teste conseguir exercitá-las:

```javascript
// Cabeçalhos de seção aceitos (nível 2, português e inglês, com e sem acento).
const FOG_HEADING = /^##\s+(?:Ainda n[ãa]o especificado|Not yet specified)\s*$/im;
const SCOPE_HEADING = /^##\s+(?:Fora d[eo] escopo|Out of scope)\s*$/im;

// Gramática de item da névoa.
const FOG_ITEM_HEAD = /^-\s+\*\*((?:NEV|FOG)-\d{2,3}):\s*([^*]+?)\s*\*\*\s*$/;
const FOG_HUNCH = /^\s{2,}-\s+(?:Pressentimento|Hunch):\s*(.+?)\s*$/;
const FOG_GRAD = /^\s{2,}-\s+(?:Gradua com|Graduates with):\s*(?:fase|phase)\s*(\d+(?:\.\d+)?[A-Za-z]?)\s*$/i;

// Limites da área: o que nunca pode aparecer dentro de uma das duas seções.
const PURITY_PHASE_DETAIL = /^###\s+(?:Fase|Phase)\s+\d/i;
const PURITY_CHECKBOX = /^-\s*\[[ xX]\]/;
const PURITY_PROGRESS_ROW = /^\|\s*\d+[.\s]/;
```

Funções deste plano:

`readRoadmap(cwd)` devolve `{ path, content }` ou `null` quando o arquivo não existe. Caminho: `.plano/ROADMAP.md` dentro de `cwd`. Nunca lança: try/catch devolvendo null.

`findSection(content, kind)` com `kind` em `'fog'` ou `'scope'`. Recorta do cabeçalho até a próxima linha que casa `/^##\s+/` ou até o fim do arquivo. Devolve `{ present, heading_line, start_line, end_line, body }`, com `present:false` e `body:''` quando não acha. Índices de linha começam em 1 e são usados pela graduação do plano 004 para recortar blocos.

`sectionPurity(body)` devolve `{ pure, problems }`. Percorre as linhas e acumula os códigos `fase_dentro_da_secao` (casa PURITY_PHASE_DETAIL), `checkbox_dentro_da_secao` (casa PURITY_CHECKBOX) e `linha_de_progresso_dentro_da_secao` (casa PURITY_PROGRESS_ROW). `pure` é `problems.length === 0`. Sem duplicar código repetido: cada código entra uma vez, com a lista de linhas em `problem_lines`.

`normalizeLabel(text)` põe em minúscula, remove diacríticos com `String(text).normalize('NFD').replace(/[̀-ͯ]/g, '')`, troca tudo que não é letra ou dígito por espaço, colapsa espaços e apara. É a chave de comparação usada pelo plano 002.

`parseFog(content)` devolve:
```javascript
{
  section_present: true,
  graduation_test_present: true,
  items: [ { id: 'NEV-01', label: '...', hunch: '...', graduates_with: '15', line_start: 120, line_end: 123 } ],
  count: 1,
  malformed: [ { id: 'NEV-02', reason: 'sem_pressentimento', line: 130 } ],
  purity: { pure: true, problems: [] }
}
```
Regras: um item começa na linha que casa FOG_ITEM_HEAD e termina na linha anterior ao próximo cabeçalho de item ou ao fim da seção. Dentro do bloco, procura FOG_HUNCH e FOG_GRAD. Item sem pressentimento entra em `malformed` com razão `sem_pressentimento` e NÃO entra em `items`. Item sem `Gradua com` é válido, com `graduates_with: null`, e gradua só por pedido manual. Identificador repetido entra em `malformed` com razão `id_duplicado` (a segunda ocorrência).

`graduationTestPresent(body)` devolve booleano: verdadeiro quando o corpo tem pelo menos uma linha começando por `>` que casa `/enunci/i` E pelo menos uma linha começando por `>` que casa `/respond/i` (pode ser a mesma linha). É a checagem mecânica de WAY-03, ou seja, que o teste declarado fala de enunciar contra responder, e não de responder sozinho.

`sectionOrder(content)` devolve `{ phases_heading_line, fog_heading_line, scope_heading_line, fog_after_phases, scope_after_phases }`, localizando `/^##\s+(?:Fases|Phases)\s*$/im` e os dois cabeçalhos de seção. Quando o cabeçalho de fases não existe, os dois campos booleanos são verdadeiros, porque não há o que afirmar.

Exportar: `readRoadmap`, `findSection`, `sectionPurity`, `normalizeLabel`, `parseFog`, `graduationTestPresent`, `sectionOrder` e as constantes de gramática.
</action>
<verify><automated>node --check up/bin/lib/roadmap-sections.cjs && node -e "const m=require('./up/bin/lib/roadmap-sections.cjs'); for (const f of ['readRoadmap','findSection','sectionPurity','normalizeLabel','parseFog','graduationTestPresent','sectionOrder']) if (typeof m[f]!=='function') throw new Error('faltou export: '+f); const v=m.parseFog(''); if (v.section_present!==false) throw new Error('string vazia deveria dar section_present false'); console.log('nucleo ok');"</automated></verify>
<done>O módulo carrega sem erro de sintaxe, exporta as sete funções e as constantes de gramática, e nenhuma função lança quando recebe string vazia.</done>
</task>

<task id="2" type="auto">
<files>up/bin/up-tools.cjs (require no topo, `case 'roadmap'` por volta da linha 281 e seção ROADMAP COMMANDS por volta da linha 1375)</files>
<action>
Abrir o subcomando de leitura da névoa na linha de comando de ferramentas.

No topo do arquivo, junto dos outros `require` de biblioteca (conferir como `github` e `multica` são importados e seguir o mesmo estilo), acrescentar `const roadmapSections = require('./lib/roadmap-sections.cjs');`.

Dentro do `case 'roadmap'`, acrescentar um ramo antes do `else` final e atualizar a mensagem de erro:

```javascript
} else if (sub === 'fog-list') {
  cmdRoadmapFogList(cwd, raw);
} else {
  error('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress, fog-list');
}
```

Na seção `ROADMAP COMMANDS`, depois de `cmdRoadmapUpdatePlanProgress`, acrescentar `cmdRoadmapFogList(cwd, raw)`:
- Sem roadmap em disco, devolve `{ section_present: false, items: [], count: 0, reason: 'roadmap_ausente' }`.
- Com roadmap, devolve o objeto de `parseFog` acrescido de `roadmap_path` (relativo).
- Saída crua (`--raw`): `"<count> item(ns) em névoa; teste de graduação: presente|ausente"`.
- Termina em `output(result, raw, rawValue)` como todas as outras, ou seja, **sai sempre com código 0**. Quem decide o que fazer com o conteúdo é o workflow que chamou. Isso é deliberado e igual ao resto da linha de comando.

Não tocar em nenhum outro ramo do despacho: os planos das ondas seguintes editam pontos vizinhos.
</action>
<verify><automated>node --check up/bin/up-tools.cjs && node up/bin/up-tools.cjs roadmap fog-list --raw && node up/bin/up-tools.cjs roadmap analyze --raw > /dev/null && node up/bin/up-tools.cjs roadmap get-phase 11 --raw > /dev/null && echo "subcomandos antigos intactos"</automated></verify>
<done>`roadmap fog-list` responde com JSON válido e com saída crua legível. `get-phase`, `analyze` e `update-plan-progress` continuam respondendo como antes. Subcomando desconhecido imprime a lista com os quatro nomes.</done>
</task>

<task id="3" type="auto">
<files>up/templates/roadmap.md</files>
<action>
Acrescentar a seção de névoa ao template do roadmap, posicionada **depois** da seção de progresso, para ficar separada do que foi feito (fases marcadas) e do que está por fazer (fases pendentes).

O template hoje está em inglês, mas o roadmap gerado pelo UP sai em português e a detecção de idioma no código testa a presença de `### Fase N`. Por isso o bloco canônico entra em português, que é o que o gerador escreve, e os cabeçalhos aceitos em inglês ficam declarados nas diretrizes.

Bloco a acrescentar dentro do exemplo de markdown do template:

```markdown
## Ainda não especificado

> Teste de graduação: um item sai daqui e vira fase quando a pergunta pode ser ENUNCIADA com
> precisão agora. O teste NÃO é se a pergunta pode ser RESPONDIDA agora. Enquanto a pergunta não
> sai inteira da boca, o item fica aqui, e isso não é dívida: é honestidade. Fechar a fase citada
> em "Gradua com" gradua o item em fase nova e limpa esta área.

- **NEV-01: rótulo curto do pressentimento**
  - Pressentimento: uma frase sobre o que se pressente e ainda não dá para especificar
  - Gradua com: fase 3
```

Acrescentar às `<guidelines>` do template um bloco novo, em texto corrido:
- A seção não nasce vazia por scaffold. Ela aparece quando existe o primeiro item real.
- Cabeçalhos aceitos pela leitura: `## Ainda não especificado` ou `## Not yet specified`.
- Identificador: `NEV-NN` em roadmap português, `FOG-NN` em inglês, sempre dois ou três dígitos, crescente e nunca reaproveitado, nem depois da graduação.
- Item sem a linha `Gradua com` é válido e só gradua por pedido manual.
- Proibido dentro da seção: cabeçalho de detalhe de fase, checkbox de fase e linha da tabela de progresso. A leitura reprova essas três coisas, porque elas apagam a separação que a seção existe para criar.
- Um item de névoa descreve o que se pressente, nunca uma solução. Se o texto já traz solução, ele não é névoa: é fase mal escrita.
</action>
<verify><automated>grep -q "Ainda não especificado" up/templates/roadmap.md && grep -q "ENUNCIADA" up/templates/roadmap.md && grep -q "RESPONDIDA" up/templates/roadmap.md && grep -q "NEV-01" up/templates/roadmap.md && ! grep -qP "[\x{2014}\x{2013}]" up/templates/roadmap.md && echo "template ok, sem travessão"</automated></verify>
<done>O template traz a seção com a gramática exata que o leitor reconhece, o teste de graduação está escrito em termos de enunciar contra responder, e o arquivo não contém travessão nem meia-risca.</done>
</task>

<task id="4" type="auto">
<files>up/bin/lib/roadmap-sections.test.cjs (arquivo novo)</files>
<action>
Escrever a prova vermelho e verde do leitor de névoa, no mesmo estilo do teste que já existe para a integração com GitHub: sem framework, `require('assert')`, helper `t(nome, fn)` contando passes e falhas, `process.exit(fail ? 1 : 0)` no fim. Fixtures são constantes de string no próprio arquivo; onde for preciso disco, usar `fs.mkdtempSync(path.join(os.tmpdir(), 'up-roadmap-'))` com `.plano/` dentro.

**Ordem obrigatória: escrever os casos, rodar e VER o vermelho antes do verde.** Se a implementação das tarefas 1 e 2 já estiver pronta quando este teste for escrito, produzir o vermelho invertendo temporariamente uma fixture (por exemplo, apagar a linha de citação do teste de graduação e confirmar que o caso correspondente reprova), e registrar as duas saídas no resumo do plano. Prova sem vermelho visto não conta.

Fixtures:
- `ROADMAP_BOM`: título, seção de fases com dois checkboxes, dois detalhes de fase, tabela de progresso, seção de névoa com o bloco de citação do teste de graduação e dois itens (`NEV-01` com `Gradua com: fase 2`, `NEV-02` sem a linha de graduação).
- `ROADMAP_RUIM`: seção de névoa sem o bloco de citação, um item sem pressentimento, dois itens com o mesmo identificador, um cabeçalho `### Fase 9` dentro da seção e uma linha de tabela de progresso dentro da seção.
- `ROADMAP_LEGADO`: roadmap sem a seção, no formato de um projeto anterior a este ciclo.
- `ROADMAP_INGLES`: seção com cabeçalho `## Not yet specified`, item `FOG-01` e linha `Graduates with: phase 4`.

Casos, um por comportamento:
1. Roadmap bom: dois itens, `graduates_with` igual a `'2'` no primeiro e null no segundo, `graduation_test_present` verdadeiro, `malformed` vazio, `purity.pure` verdadeiro.
2. Roadmap bom: `line_start` e `line_end` do primeiro item delimitam exatamente o bloco dele, ou seja, a linha do cabeçalho do item e as linhas indentadas seguintes, sem invadir o item seguinte. É o contrato de que a graduação do plano 004 depende para limpar sem estragar o vizinho.
3. Roadmap ruim: `graduation_test_present` falso.
4. Roadmap ruim: `malformed` traz `sem_pressentimento` e `id_duplicado`, e nenhum item malformado aparece em `items`.
5. Roadmap ruim: `purity.problems` contém `fase_dentro_da_secao` e `linha_de_progresso_dentro_da_secao`.
6. Roadmap legado: `parseFog` devolve `section_present:false`, `items` vazio e não lança. É o caso de compatibilidade com projeto anterior ao ciclo.
7. Roadmap em inglês: a seção é encontrada, `FOG-01` é aceito e `graduates_with` é `'4'`.
8. `normalizeLabel` iguala "Migração de Armazenamento" e "migracao de armazenamento", e diferencia de "migracao de storage".
9. `readRoadmap` em diretório sem planejamento devolve null sem lançar.
</action>
<verify><automated>node up/bin/lib/roadmap-sections.test.cjs</automated></verify>
<done>Os nove casos rodam e passam, com o vermelho de pelo menos um registrado antes do verde. O teste não depende de rede e não deixa diretório temporário para trás.</done>
</task>

<task id="5" type="auto">
<files>.plano/ROADMAP.md (roadmap deste repositório, uso real e não fixture)</files>
<action>
Aplicar a seção de névoa ao roadmap deste próprio repositório, com conteúdo real. É a prova smoke do plano: o leitor passa a ler arquivo de produção, não fixture.

Acrescentar, depois da tabela de progresso, a seção com a gramática exata do template. Conteúdo mínimo, todo ele lastreado em algo já escrito nos artefatos do projeto (o executor pode acrescentar item que perceba no estado do projeto, e nunca inventar detalhe que não esteja registrado em lugar nenhum):

- `NEV-01: corte de sedimento`. Pressentimento: template órfão, instrução morta nos workflows e negações acumuladas pedem um passe de poda, e ainda não dá para dizer o que sai e o que fica sem medir o estrago. Gradua com: fase 17.
- `NEV-02: custo de carga das skills por turno`. Pressentimento: as quatro skills de doutrina entram no contexto a cada turno e esse custo nunca foi medido, então não dá para dizer se o problema é de invocação, de tamanho ou inexistente. Gradua com: fase 18.

Depois de escrever, rodar a leitura contra o próprio repositório e conferir dois itens com teste de graduação presente. Conferir também que a análise do roadmap continua enxergando as 20 fases, ou seja, que a seção nova não confunde o leitor de fases nem a tabela de progresso.

Commit atômico separado, mensagem `docs(20-001): seção de névoa no roadmap do repositório`.
</action>
<verify><automated>node up/bin/up-tools.cjs roadmap fog-list --raw | grep -q "2 item" && node up/bin/up-tools.cjs roadmap fog-list | grep -q '"graduation_test_present": true' && node up/bin/up-tools.cjs roadmap analyze --raw | grep -q '"phase_count": 20' && echo "smoke ok"</automated></verify>
<done>O roadmap deste repositório tem a seção de névoa preenchida com dois itens reais e o teste de graduação escrito. A leitura devolve os dois itens com a fase de graduação de cada um. A análise do roadmap continua devolvendo 20 fases.</done>
</task>

## Critérios de aceite do plano

Verdadeiro ao fim, conferível por comando:

O roadmap deste repositório tem a seção de névoa, e ela existe também no template que o UP distribui (WAY-02).

O teste de graduação está escrito dentro do próprio roadmap, em termos de enunciar a pergunta com precisão agora, e a checagem mecânica que confere isso reprova um roadmap que não escreve o teste (WAY-03).

A leitura devolve, por item, o rótulo, o pressentimento, a fase de graduação e o intervalo de linhas do bloco, que é o insumo da graduação do plano 004.

Roadmap sem a seção é lido sem erro e devolve seção ausente, preservando projeto anterior a este ciclo.

Os subcomandos antigos do roadmap continuam respondendo igual.

## Tipo de prova

Smoke como prova principal, exercida na tarefa 5 contra o roadmap real deste repositório: o comando roda, lê arquivo de produção e devolve o esperado. Somada a ela, prova de lógica vermelho e verde na tarefa 4 sobre o leitor, porque gramática é código e código sem teste vira teatro no gate.

Registro esperado no log de aprovações, escrito pelo orquestrador do build no formato de seis colunas, com escopo `fase=20 plano=001` e evidência `smoke:pass`.

## Fora de escopo

Seção de fora de escopo e higiene contra o histórico de decisões: é o plano 002 desta fase.

Graduação de item de névoa em fase nova e limpeza da área graduada: é o plano 004. Este plano entrega leitura, e escrita nenhuma além do próprio roadmap deste repositório.

Gate de auto-aborto do planejamento: é o plano 003. Nada aqui lê resultado de questionamento.

Reescrita retroativa de roadmap de projeto existente: proibida. Projeto sem a seção continua válido.

Poda de sedimento no template do roadmap: o template ganha a seção nova e nada é removido dele, conforme a fronteira já declarada do ciclo.

Mudança no instalador: nenhuma. Os arquivos novos ficam dentro de pastas já copiadas por inteiro, então a distribuição vem de graça e é conferida no plano 005.
