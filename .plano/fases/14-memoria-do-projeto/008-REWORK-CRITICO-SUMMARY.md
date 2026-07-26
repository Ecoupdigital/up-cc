---
phase: 14-memoria-do-projeto
plan: 008-REWORK-CRITICO
tipo: rework critico pos-revisao (REQUEST_CHANGES)
commits:
  - 2e6c141 fix(14-008): RV-001 fecha path traversal via --slug em memoria decisao
  - 57f61ce fix(14-008): RV-003 fecha corrida de escrita concorrente na memoria
  - 5c0729f fix(14-008): RV-002 fecha injecao no frontmatter via --titulo e --alias
  - 9c7e7f8 docs(14-008): RV-005 adiciona os tres comandos executaveis que faltavam na skill
  - f7e561c fix(14-008): RV-004 forma 4 da regua de redefinicao passa a pular linhas em branco
  - 6aba3a9 fix(14-008): fecha flexao natural nas listas lexicas de rejeicao
testes:
  antes_do_rework: 106 casos (25 decisao, 27 rejeicoes, 19 termo, 19 glossario, 16 e2e)
  depois_do_rework: 124 casos (33 decisao, 36 rejeicoes, 20 termo, 19 glossario, 16 e2e)
  regressao: zero em todas as seis rodadas
---

# Fase 14, Rework Critico (008): correcao item a item das cinco falhas apontadas na revisao

A revisao reprovou com REQUEST_CHANGES: duas falhas criticas (path traversal e corrida de
escrita concorrente) e tres importantes (injecao de frontmatter, comando executavel ausente na
skill, forma 4 da regua cega). Corrigido na ordem exigida: RV-001, RV-003, RV-002, RV-005,
RV-004, listas lexicas. Um commit por item, todos com vermelho real antes e verde real depois.

## RV-001 (CRITICA): path traversal via `--slug`. CORRIGIDO

**Onde:** `up/bin/lib/memoria-decisao.cjs`, `criar()`.

**O que estava errado:** `--slug` era aceito cru, so com `slice(0,48)` e trim de hifen, nunca
passando por `generateSlugInternal`. `path.join` normalizava `..` pra fora de
`.plano/decisoes` na escrita.

**Prova que eu reproduzi, antes da correcao** (execucao direta contra o codigo desta worktree,
antes de qualquer mudanca minha):

```
$ node -e "... decisao.criar(dir, { slug: '../../../ROADMAP', ...campos validos... })"
{"criado":true,"numero":"0001","caminho":".plano/decisoes/0001-onda-....md", ...}
```

E no teste dedicado (`up/bin/lib/memoria-decisao.test.cjs`, caso "slug com travessia de
diretorio nao escreve fora de .plano/decisoes"), rodado ANTES da correcao:

```
FAIL - slug com travessia de diretorio nao escreve fora de .plano/decisoes
    'conteudo original do roadmap, 28 bytes.'
  != (roadmap sobrescrito com conteudo de decisao)
```

**Correcao:** o slug SEMPRE passa por `generateSlugInternal(flags.slug || titulo)`, nunca
aceita o valor cru. Mais um portao final, `resolverCaminhoContido(dir, nomeArquivo)` em
`memoria.cjs`, que assert que o caminho resolvido continua dentro do diretorio esperado antes
de qualquer escrita (`path.resolve(caminho).startsWith(path.resolve(dir) + path.sep)`).
Replicado como defesa em profundidade em `memoria-rejeicoes.cjs` (dois pontos de escrita,
`registrar` e `adicionarAlias`) e em `arquivoGlossarioProjeto` (usado por
`memoria-termo.cjs`), confirmando que os dois ja eram seguros hoje (conceito ja vinha de
`generateSlugInternal`; nome de arquivo do glossario e fixo, nunca vem de flag).

**Prova depois:** o mesmo teste, verde: roadmap intocado, registro nasce dentro de
`.plano/decisoes` com slug `roadmap`. Rodado 3x, estavel.

## RV-003 (CRITICA): corrida de escrita concorrente destroi arquivo e apaga cabecalho. CORRIGIDO

**Onde:** `up/bin/lib/memoria-decisao.cjs` (`criar`) e `up/bin/lib/memoria-termo.cjs`
(`registrar`).

**O que estava errado:** leitura-modificacao-escrita sem lock nem flag exclusiva. `decisao
criar` varria o numero mais alto do disco e escrevia sem exclusividade; `termo registrar` lia
o arquivo inteiro, montava a lista final e reescrevia o arquivo inteiro, tambem sem
exclusividade.

**Prova que eu reproduzi, antes da correcao** (testes de corrida com `child_process.spawn` +
`Promise.all`, concorrencia real entre processos do SO, nao `spawnSync` serializado):

```
== memoria-decisao.test.cjs, 3 rodadas ==
FAIL - corrida: 10 decisoes concorrentes do MESMO titulo produzem 10 numeros unicos, nenhum arquivo destruido
    deveria haver 10 numeros UNICOS mesmo com titulo repetido, veio 9: [...duplicados...]
    deveria haver 10 numeros UNICOS mesmo com titulo repetido, veio 8: [...duplicados...]
    deveria haver 10 numeros UNICOS mesmo com titulo repetido, veio 7: [...duplicados...]

== memoria-termo.test.cjs, rodada 2 de 2 ==
FAIL - corrida: 10 registros de termo concorrentes de nome distinto produzem 10 verbetes, cabecalho intacto
    deveriam existir 10 termos no glossario ao final, existem 8
```

Confirma exatamente o que a revisao reportou: numero duplicado, arquivo destruido com o mesmo
titulo, verbete perdido na corrida entre termos. O caso de decisoes de titulo DISTINTO passou
por sorte numa rodada e falhou nas outras duas (a corrida e probabilistica, nao determinista);
o teste roda em loop de rodadas justamente por isso.

**Correcao:** `comLockDiretorio(caminhoLock, fn)` em `memoria.cjs`: mutex entre processos via
`fs.mkdirSync` (atomico no SO, so um processo cria o mesmo nome de diretorio), com espera
ocupada curta (`Atomics.wait` sobre `SharedArrayBuffer`, confirmado funcional na thread
principal do Node 22) e liberacao garantida no `finally`. `memoria decisao criar()` serializa
a secao inteira "varre o numero, escreve o arquivo" dentro do lock, com escrita exclusiva
(`flag: 'wx'`) e retry no `EEXIST` como segunda camada de defesa. `memoria termo registrar()`
serializa "le o estado atual, monta a lista final, escreve o arquivo inteiro" dentro do lock
proprio (`.memoria-termo.lock`, nome distinto do lock de decisoes, sem interferencia entre os
dois espacos).

**Prova depois:** os dois testes de corrida, verdes e estaveis em 3 rodadas consecutivas cada.

## RV-002 (importante): injecao no frontmatter via `--titulo`. CORRIGIDO

**Onde:** `up/bin/lib/memoria-decisao.cjs` (titulo, fase) e `up/bin/lib/memoria-rejeicoes.cjs`
(titulo, cada alias).

**O que estava errado:** interpolacao crua de texto livre numa linha de frontmatter YAML.

**Prova que eu reproduzi, antes da correcao** (execucao direta):

```
titulo: 'Titulo qualquer\n---\nstatus: null\nforjado: sim'
->
---
numero: "0001"
slug: titulo-qualquer-status-null-forjado-sim
titulo: Titulo qualquer
---
status: null
forjado: sim
status: aceita
...
listar() -> {"status": null}
```

O titulo truncou em "Titulo qualquer", os campos "status: null" e "forjado: sim" ficaram como
texto solto (o parser de frontmatter fechou no `\n---` injetado), e `memoria decisao listar`
devolveu `status: null` pro registro, exatamente como a revisao descreveu.

**Correcao:** `serializarValorFrontmatter(valor, nomeCampo)` em `memoria.cjs`: rejeita quebra
de linha (`/[\r\n]/`) antes de qualquer coisa, depois serializa com `JSON.stringify`
(aspas e escape). Aplicado a titulo e fase em `memoria-decisao.cjs`, e a titulo e cada alias
em `memoria-rejeicoes.cjs` (`registrar` e `adicionarAlias`), validando cedo, antes de tocar
disco. Lado de leitura, `parseValorFrontmatterSimples`, reconhece string entre aspas como JSON
(retrocompativel: valor sem aspas, de frontmatter gravado antes desta correcao, volta como
texto puro).

**Prova depois:**
- O mesmo payload malicioso agora lanca `Error: Campo "titulo" nao pode conter quebra de
  linha.` sem tocar disco (testado em `memoria-decisao.cjs` e `memoria-rejeicoes.cjs`).
- Titulo trivial com dois-pontos (`"Fila: Redis vs RabbitMQ"`) grava
  `titulo: "Fila: Redis vs RabbitMQ"` e volta identico via `listar()`.
- Alias com dois-pontos (`"aviso: por email"`) tem o mesmo tratamento e volta identico.
- Teste pre-existente que verificava `fase: 14` sem aspas foi atualizado para
  `fase: "14"` (mudanca de formato esperada), com verificacao adicional de que o titulo
  volta identico na leitura.

## RV-005 (importante): consulta a memoria sem linha executavel na skill. CORRIGIDO

**Onde:** `up/skills/up-brainstorm/SKILL.md`, secao "Memoria gravada no instante".

**O que estava errado:** a unica invocacao executavel de `memoria` na skill inteira era
`fora-de-escopo buscar` (linha 59). A secao que manda gravar termo, decisao e rejeicao ficava
so em prosa, sem bloco `bash`, com flags nao adivinhaveis.

**Correcao:** tres blocos `bash` executaveis acrescentados, um em cada paragrafo onde a
escrita deve acontecer: `memoria termo registrar` (logo apos o paragrafo de termo), `memoria
decisao criar` (logo apos o paragrafo do gate das tres condicoes) e `memoria fora-de-escopo
registrar` (logo apos o paragrafo de recusa), no mesmo formato da linha 59 ja existente.

**Prova de que sao exemplos reais, nao esqueleto:** executei os tres comandos, exatamente como
escritos na skill, contra um projeto temporario:

```
=== termo registrar ===
{"termo":"ondulação de cardápio","criado_agora":true,"atualizado":false,"posicao_insercao":1,"total_termos":1}
=== decisao criar ===
{"criado":true,"numero":"0001","caminho":".plano/decisoes/0001-...md","status":"aceita","alternativas_count":1}
=== fora-de-escopo registrar ===
{"conceito":"painel-de-controle-do-usu-rio","caminho":".plano/fora-de-escopo/....md","aliases_count":1,"base_criada_agora":true}
```

Os tres saem com sucesso (`criado`/`criado_agora`/`base_criada_agora` true).

Sem teste automatizado dedicado (SKILL.md e prosa/doutrina, nao codigo coberto por bateria);
a prova e a execucao real acima. Rodei `perguntas.test.cjs` (o unico teste do repo que le este
arquivo) depois da mudanca: continua verde, sem qualquer efeito colateral no contrato de
pergunta.

## RV-004 (importante): forma 4 da regua quase nunca dispara. CORRIGIDO

**Onde:** `up/bin/lib/memoria-glossario.cjs`, `primeiroParagrafoAposHeader`.

**O que estava errado:** a funcao parava na PRIMEIRA linha em branco a partir do cabecalho, em
vez de pular as brancas iniciais. Markdown normal poe linha em branco logo apos todo
cabecalho, entao a forma 4 nunca colhia a prosa real; so a fixture de teste (que colava a
prosa direto sob o cabecalho, sem linha em branco) disparava.

**Prova que eu reproduzi, antes da correcao** (fixture corrigida para markdown realista,
`## alfa` seguido de linha em branco e so entao a prosa):

```
FAIL - check: fixture com uma linha em cada uma das quatro formas conta quatro achados nomeados
    [forma-1, forma-2, forma-3 presentes; forma-4 ausente]
    3 !== 4
```

**Correcao:** pular as linhas em branco antes de montar o paragrafo (`while (... trim() ===
'') i++;` antes do loop de coleta).

**Prova depois:** o mesmo teste, verde, 4 achados (as quatro formas). E, confirmando o que a
revisao previu, o aceite zero contra o repositorio real continua verdadeiro depois do fix:

```
$ node up/bin/up-tools.cjs memoria glossario check --estrito
{"termos_count":9,"arquivos_count":84,"achados":[],"total":0,"aprovado":true}
```

A correcao so para a regua de ser cega a um quarto das formas que ela mesma declara contar; o
resultado sobre o codigo real nao muda.

## Listas lexicas: flexao natural da familia ja coberta. CORRIGIDO

**Onde:** `up/bin/lib/memoria-rejeicoes.cjs`, `MARCAS_IMPLEMENTADO` e `MARCAS_ADIAMENTO`.

**O que estava errado:** a lista ja tinha "ja implementado" e "ja esta pronto" (prova de que a
flexao estava no radar), mas deixava passar flexao natural adjacente: "ja esta implementado"
(a redacao literal do proprio requisito MEM-05), "ja foi implementado", "ja entregamos", "nao
e prioridade" e "postergar".

**Prova que eu reproduzi, antes da correcao** (as cinco frases do laudo, uma por caso de
teste):

```
FAIL - registrar: "ja esta implementado" (flexao de "ja implementado") falha como item ja implementado
FAIL - registrar: "ja foi implementado" falha como item ja implementado
FAIL - registrar: "ja entregamos" falha como item ja implementado
FAIL - registrar: "nao e prioridade" falha como adiamento
FAIL - registrar: "postergar" falha como adiamento
    (Missing expected exception, as cinco)
```

**Correcao:** cinco entradas acrescentadas as duas listas fechadas (`ja esta implementado`,
`ja foi implementado`, `ja entregamos` em `MARCAS_IMPLEMENTADO`; `nao e prioridade`,
`postergar` em `MARCAS_ADIAMENTO`).

**Prova depois:** as cinco, verdes. A limitacao de parafrase continua declarada e correta no
comentario do modulo; isto fecha a familia de flexao adjacente, sem virar caca a sinonimo.

## Regressao

Bateria completa rodada apos cada um dos seis itens, sempre com zero falha nova:

| Rodada | decisao | rejeicoes | termo | glossario | e2e | total |
|--------|---------|-----------|-------|-----------|-----|-------|
| Antes de qualquer mudanca | 25 | 27 | 19 | 19 | 16 | 106 |
| Apos RV-001 | 27 | 27 | 19 | 19 | 16 | 108 |
| Apos RV-003 | 29 | 27 | 20 | 19 | 16 | 111 |
| Apos RV-002 | 33 | 31 | 20 | 19 | 16 | 119 |
| Apos RV-005 (sem teste novo) | 33 | 31 | 20 | 19 | 16 | 119 |
| Apos RV-004 | 33 | 31 | 20 | 19 | 16 | 119 |
| Apos listas lexicas | 33 | 36 | 20 | 19 | 16 | 124 |

`perguntas.test.cjs` (unico outro teste que referencia `up-brainstorm/SKILL.md`) rodado apos
RV-005: continua verde.

## O que ficou fora, por instrucao explicita

- Nao adicionei `scripts` ao `package.json`.
- Nao criei gate automatico da regua de redefinicao em nenhum workflow (DEB-14-04 do laudo
  anterior continua em aberto, por decisao).
- Nao mecanizei o corte de "ate tres frases" do MEM-06 (DEB-14-03 continua em aberto).
- Nao toquei `init up` / `init auditar` no despachante (bug pre-existente, fora do escopo
  desta fase).
- Nao corrigi travessao pre-existente fora do que eu mesmo escrevi nesta rodada.

## Confirmacoes de escopo que fiz e nao mexi

- `memoria-rejeicoes.cjs`, `registrar()`: o padrao `existsSync` seguido de `writeFileSync` sem
  lock (checagem de duplicata de conceito) permanece como estava. Confirmado que o caminho de
  escrita e por conceito com nome de arquivo deterministico (um arquivo por conceito), o que a
  revisao ja havia apontado como imune ao mesmo padrao de destruicao de RV-003; nao apliquei
  lock aqui por instrucao explicita ("confirme e nao mexa").
- `memoria-termo.cjs`, acoes `listar` e `regras`: continuam somente leitura, nunca criam
  arquivo nem diretorio, inclusive dentro do novo lock (o lock so protege o caminho de
  escrita de `registrar`).
