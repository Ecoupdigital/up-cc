---
phase: 14-memoria-do-projeto
plan: 005
subsystem: cli-tools
tags: [memoria, glossario-do-projeto, criacao-preguicosa, doutrina, brainstorm, tdd]
dependency_graph:
  requires:
    - "14-memoria-do-projeto/002-PLAN.md (roteador `memoria.cjs`, entrada `termo` reservada, helpers `arquivoGlossarioProjeto`/`lerFlag`)"
  provides:
    - "up/templates/glossary.md: fonte unica do texto da regra de admissao e da regra de higiene do glossario do projeto"
    - "up/bin/lib/memoria-termo.cjs: acoes `registrar`, `listar`, `regras` do glossario de dominio do projeto do dono, com criacao preguicosa e as duas guardas"
    - "secao 'Consulta a memoria antes de explorar' e secao 'Memoria gravada no instante' em up/skills/up-brainstorm/SKILL.md, mais duas linhas na tabela de sinais proibidos"
  affects:
    - "14-memoria-do-projeto/006-PLAN.md (prova ponta a ponta dos criterios 3 e 4 do briefing, consome os tres submodulos entregues nas fases 002 a 005)"
tech_stack:
  added: []
  patterns:
    - "Cabecalho lido de um template do pacote, com fallback embutido textualmente equivalente e aviso no retorno quando o template falta (mesma logica de 'nunca falhar por falta de arquivo auxiliar')"
    - "Guarda de higiene por regex (caminho de arquivo, bloco de codigo cercado por crase tripla) e guarda de admissao por lista fechada normalizada (sem acento, minusculo), ambas rodando antes de qualquer escrita"
    - "Insercao ordenada por parse e remontagem de blocos markdown (`### termo` ate o proximo `### `), preservando o restante do arquivo byte a byte"
key_files:
  created:
    - "up/templates/glossary.md"
    - "up/bin/lib/memoria-termo.cjs"
    - "up/bin/lib/memoria-termo.test.cjs"
  modified:
    - "up/skills/up-brainstorm/SKILL.md"
decisions:
  - "Guarda de higiene roda antes da guarda de admissao (ordem do proprio texto do plano), para a definicao ruim nunca chegar a ser avaliada contra a lista fechada de termos genericos."
  - "`--forcar` e `--atualizar` sao flags booleanas sem valor (presenca detectada por `args.includes`), diferente de `--termo`/`--definicao`/`--evitar`/`--justificativa` que usam `lerFlag` (com valor); nao ha precedente de flag booleana em `memoria.cjs`, entao a convencao foi criada aqui e documentada no proprio codigo."
  - "A justificativa de admissao forcada e gravada como comentario markdown (`<!-- termo generico admitido a forca: ... -->`) logo abaixo do cabecalho `### termo`, nao como uma linha visivel do verbete: preserva a regra de higiene (o verbete continua so com Definicao/Evitar) e ainda deixa rastro auditavel para quem abrir o arquivo."
requirements-completed: [MEM-03, MEM-04, MEM-10]
metrics:
  duration: "~45min"
  completed: "2026-07-26"
---

# Fase 14 Plano 005: Glossário do projeto e doutrina de memória Summary

**Glossário de domínio do projeto (`.plano/GLOSSARY.md`) que nasce preguiçosamente na primeira gravação já com a regra de admissão e a regra de higiene dentro do próprio arquivo, com guardas mecânicas contra detalhe de implementação e contra conceito genérico de programação; skill de brainstorm agora consulta a base de rejeições antes de explorar a intenção e grava termo/decisão no instante em que caem, nunca em lote no fim.**

## Performance

- **Tarefas:** 6/6 completas
- **Commits:** 6 (1 por tarefa, nenhuma correção pós-hoc necessária)
- **Arquivos:** 3 criados, 1 modificado (~430 inserções no total)

## Realizações

- `up/templates/glossary.md` é a fonte única do texto das duas regras: título, regra de admissão, regra de higiene, seção de termos vazia e um verbete de exemplo comentado (nunca lido como termo real).
- `memoria-termo.cjs registrar` só grava depois de duas guardas passarem: higiene (recusa definição com caminho de arquivo tipo `up/bin/lib/x.cjs` ou bloco cercado por crase tripla) e admissão (recusa termo da lista fechada `api, endpoint, cache, callback, componente, commit, branch, deploy, middleware, migration, promise, refactor, teste unitario, token, webhook`, normalizada sem acento). Admissão é reversível com `--forcar --justificativa`, que grava a justificativa como comentário markdown no verbete.
- Criação preguiçosa real: nenhuma gravação recusada cria `.plano/GLOSSARY.md`; a primeira aprovada cria o arquivo lendo o cabeçalho do template (ou do cabeçalho embutido, com aviso no retorno, se o template estiver ausente do pacote).
- Inserção sempre em ordem alfabética pelo termo (nunca no fim do arquivo); termo repetido recusa citando a definição atual, a menos que `--atualizar` acompanhe, e nesse caso só aquele verbete muda, o resto do arquivo fica intacto.
- `listar` e `regras` são leitura pura: nunca criam arquivo nem diretório, mesmo quando o glossário do projeto ainda não existe (`regras` cai para o texto do template nesse caso).
- Skill `up-brainstorm` ganhou duas seções novas (consulta à memória antes de explorar a intenção; escrita inline de termo/decisão/recusa, nunca em lote) e duas linhas na tabela de sinais proibidos, sem remover nem reordenar nada que já existia.
- 19 casos de teste sem framework, com prova vermelha (módulo ausente, `MODULE_NOT_FOUND`) e verde (19 passed, 0 failed) documentadas abaixo.

## Task Commits

Cada tarefa foi commitada atomicamente na branch `up/fase-14-memoria-do-projeto`:

1. **Tarefa 1: template do glossário do projeto** - `89a21e2` (feat)
2. **Tarefa 2: ação `registrar` com as duas guardas** - `ebb05f0` (feat)
3. **Tarefa 3: ações `listar` e `regras`** - `783273d` (feat)
4. **Tarefa 4: teste vermelho-verde** - `24d16d7` (test)
5. **Tarefa 5: seção "Consulta à memória antes de explorar"** - `01cb596` (docs)
6. **Tarefa 6: seção "Memória gravada no instante" + tabela de sinais proibidos** - `379d5df` (docs)

## Files Created/Modified

- `up/templates/glossary.md` - cabeçalho único (regra de admissão + regra de higiene) e verbete de exemplo comentado.
- `up/bin/lib/memoria-termo.cjs` - `registrar`, `listar`, `regras`, `run`, mais os helpers internos (`normalizar`, `eConceitoGeral`, `detectarDetalheImplementacao`, `lerCabecalhoTemplate`, `extrairRegra`, `extrairSecaoTermos`, `parseVerbetes`, `extrairDefinicaoAtual`, `extrairEvitarAtual`, `montarBlocoVerbete`, `inserirOrdenado`), todos exportados para o teste.
- `up/bin/lib/memoria-termo.test.cjs` - 19 casos sem framework, cobrindo criação preguiçosa, as duas guardas, formato do verbete, ordem alfabética, atualização, template ausente, roteamento e linha de comando real.
- `up/skills/up-brainstorm/SKILL.md` - duas seções novas (`## Consulta à memória antes de explorar`, antes de `## Profundidade escalada por tamanho`; `## Memória gravada no instante`, depois de `## Checkpoint de fechamento`) e duas linhas na tabela de sinais proibidos. Nenhuma seção existente foi removida, reordenada ou reescrita.

## Decisions Made

Ver `decisions` no frontmatter. Resumo: (1) higiene roda antes de admissão; (2) `--forcar`/`--atualizar` são flags booleanas por presença, distintas das flags com valor já existentes no espaço `memoria`; (3) justificativa de admissão forçada vira comentário markdown no verbete, não linha visível, para não violar a própria regra de higiene que o arquivo declara.

## Desvios do Plano

### Issues Auto-corrigidos

**1. [Regra 1 - Bug] Regex de extração do termo do verbete não casava por falta da flag multiline**
- **Encontrado durante:** smoke test manual da tarefa 3, antes de escrever o teste da tarefa 4 (`listar` devolvia `termo: ""` para todo verbete).
- **Issue:** `bloco.match(/^### (.+)$/)` sem a flag `m` faz `$` exigir o fim de toda a string, não o fim da primeira linha; como todo bloco de verbete tem mais de uma linha, o match sempre falhava e o campo `termo` caía no fallback vazio.
- **Correção:** adicionada a flag `m` (`/^### (.+)$/m`), então `$` passa a casar fim de linha.
- **Verificação:** smoke manual refeito, `termo` passou a vir preenchido corretamente; depois confirmado pelos 19 casos do teste da tarefa 4, incluindo o de ordem alfabética que depende do parse do termo.
- **Arquivos modificados:** `up/bin/lib/memoria-termo.cjs`
- **Commit:** dentro de `783273d` (a correção aconteceu antes do commit da tarefa 3, não gerou commit separado).

Nenhum outro desvio. O plano foi executado exatamente como escrito em todo o resto: mesmos nomes de ação, mesmas flags, mesmo formato de arquivo, mesma posição das seções na skill.

## Provas rodadas (automated + vermelho/verde)

### Tarefa 1: `<prova>` smoke

```
$ grep -c "Regra de admiss\|Regra de higiene" up/templates/glossary.md
2
```

### Tarefa 5: smoke da seção nova (três desfechos citados)

```
## Consulta à memória antes de explorar

Primeiro passo de toda rodada, inclusive no tier Trivial que não faz pergunta: consultar a base
de rejeições do projeto (espaço de comando `memoria`, submódulo `fora-de-escopo`) com o texto do
pedido do dono, antes de explorar a intenção. Base inexistente devolve vazio e o fluxo segue
normalmente, sem criar nada: a própria consulta nunca cria arquivo.

Sem achado, nada é dito ao dono. Essa é a regra de silêncio: [...]
Achado, apresente a pergunta pronta que a busca devolve [...]
A resposta do dono decide o desfecho. Manter a recusa encerra o assunto ali [...] Mudar de ideia
segue o fluxo normal da rodada [...]
```

Os três desfechos presentes: sem achado (silêncio), achado com recusa mantida, achado com recusa revista.

### Tarefa 6: smoke da seção nova e da tabela

```
## Memória gravada no instante

Termo de domínio que o dono fixa durante a conversa é gravado na hora, com a ação de registro de
termo [...] Nunca acumular para gravar em lote no fim [...]

A regra de admissão, em uma linha [...] A regra de higiene, em uma linha [...]

Decisão que aparece durante a conversa passa pelo gate das três condições, em E lógico [...]
Faltou uma condição, não se escreve nada. [...]

Recusa do dono com motivo estrutural vira registro na base de rejeições, também na hora. Duas
coisas nunca entram nessa base: item já implementado [...] e motivo temporário [...]

Nenhum dos três artefatos [...] nasce vazio, em nenhuma hipótese. Sem conteúdo real, não existe
arquivo.
```

Duas linhas novas na tabela de sinais proibidos (anotar tudo no fim; escolha "obviamente" importante sem checar o gate).

### Tarefas 2, 3 e 4: vermelho antes do verde

**Vermelho** (`up/bin/lib/memoria-termo.cjs` temporariamente removido do disco):

```
$ node up/bin/lib/memoria-termo.test.cjs
node:internal/modules/cjs/loader:1386
  throw err;
  ^
Error: Cannot find module './memoria-termo.cjs'
Require stack:
- .../up/bin/lib/memoria-termo.test.cjs
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    ...
  code: 'MODULE_NOT_FOUND'
```

**Verde** (arquivo restaurado, implementação completa das tarefas 2 e 3):

```
$ node up/bin/lib/memoria-termo.test.cjs
  ok  - listar: arquivo ausente devolve lista vazia e nao cria nada
  ok  - regras: arquivo ausente devolve o texto do template, sem criar nada
  ok  - registrar: primeira gravacao cria o arquivo com o cabecalho completo
  ok  - nenhuma gravacao recusada cria o arquivo (higiene, admissao e duplicidade)
  ok  - higiene: definicao com caminho de arquivo falha
  ok  - higiene: definicao com bloco de codigo falha
  ok  - higiene: definicao limpa passa
  ok  - admissao: termo da lista fechada falha sem --forcar
  ok  - admissao: termo da lista fechada com --forcar sem --justificativa falha
  ok  - admissao: termo da lista fechada com --forcar e --justificativa passa e grava a justificativa
  ok  - conteudo: verbete tem a linha de definicao
  ok  - conteudo: linha de evitar so aparece quando a flag foi passada
  ok  - ordem: tres termos gravados fora de ordem ficam em ordem alfabetica
  ok  - atualizacao: termo repetido sem --atualizar falha citando a definicao atual
  ok  - atualizacao: termo repetido com --atualizar substitui a definicao e preserva os demais verbetes
  ok  - template ausente: gravacao continua funcionando com cabecalho embutido e aviso no retorno
  ok  - roteamento: memoria termo listar via binario real devolve lista vazia com codigo 0
  ok  - linha de comando: registrar recusado (higiene) sai com codigo 1 e nao cria arquivo
  ok  - linha de comando: registrar aprovado sai com codigo 0 e grava o arquivo

19 passed, 0 failed
EXIT=0
```

Aceite da tarefa 2 verificado individualmente por caso de teste:
- higiene recusa definição com caminho de arquivo: `EXIT` != 0 na CLI, arquivo continua ausente.
- admissão recusa termo genérico, admissão forçada com justificativa passa: dois casos separados, ambos verdes.
- segundo termo entra em ordem alfabética: caso "ordem" acima, verde.

## Self-Check

- `up/templates/glossary.md`, `up/bin/lib/memoria-termo.cjs`, `up/bin/lib/memoria-termo.test.cjs`,
  `up/skills/up-brainstorm/SKILL.md` existem: CONFIRMADO.
- Commits `89a21e2`, `ebb05f0`, `783273d`, `24d16d7`, `01cb596`, `379d5df` existem no histórico da branch
  `up/fase-14-memoria-do-projeto`: CONFIRMADO (`git log --oneline --all | grep 14-005`).
- Suite de teste: `node up/bin/lib/memoria-termo.test.cjs` → `19 passed, 0 failed`, código de saída 0:
  CONFIRMADO.
- Nenhum em-dash/en-dash nos arquivos escritos por este plano: CONFIRMADO
  (`grep -n "—\|–" up/templates/glossary.md up/bin/lib/memoria-termo.cjs up/bin/lib/memoria-termo.test.cjs up/skills/up-brainstorm/SKILL.md`
  → vazio).
- Nenhum `TBD` nos arquivos escritos: CONFIRMADO.
- `.plano/STATE.md` e `.plano/ROADMAP.md` não foram tocados por este plano: CONFIRMADO.
- `up/bin/lib/memoria.cjs`, `up/bin/lib/memoria-decisao.cjs`, `up/bin/lib/memoria-rejeicoes.cjs` e
  `up/bin/lib/memoria-glossario.cjs` não foram tocados nem staged por nenhum dos meus commits: CONFIRMADO
  (todos os `git add` deste plano usaram caminho explícito, nunca `git add .`).

## Self-Check: PASSOU

## Critérios de Sucesso do Plano

- [x] O glossário do projeto nasce só na primeira gravação e já traz a regra de admissão e a regra de higiene dentro do arquivo
- [x] As duas regras têm um único texto, que mora no template e é lido pelo módulo
- [x] Definição com detalhe de implementação é recusada mecanicamente
- [x] O brainstorm consulta a base de rejeições antes de explorar a intenção, e cala quando não há achado
- [x] Termo e decisão são gravados no instante em que caem, e a skill proíbe o lote no fim
- [x] O gate das três condições está escrito na skill como conjuntivo, com o faltou uma não escreve
- [x] O teste foi visto falhar antes de passar

## FORA DE ESCOPO (herdado do plano, não feito, e não deveria ter sido)

- Modo de questionamento profundo, gatilho de entrada, palavra de parada, auto-convergência: fase 15, nada aqui assume que existe.
- Tiers de profundidade, checkpoint de duas opções, gate de aprovação de design da skill de brainstorm: não tocados.
- `up/bin/lib/memoria.cjs`, `memoria-decisao.cjs`, `memoria-rejeicoes.cjs`, `memoria-glossario.cjs`: nenhum editado.
- `.plano/GLOSSARY.md` deste próprio repositório não foi populado com termos reais: a fase entrega o mecanismo, não os dados.
- Nenhum registro automático de termo por detecção de repetição de palavra: a entrada é sempre decisão do agente com o dono.
- Reference de questionamento e qualquer superfície de pergunta fora da skill de brainstorm: não tocadas.

## DECISOES ESCALADAS

Nenhuma.

## Next Phase Readiness

`memoria termo registrar|listar|regras` está pronto para uso imediato via
`node up/bin/up-tools.cjs memoria termo <acao> [flags]`. A doutrina na skill `up-brainstorm` já referencia
as ações concretas (`memoria fora-de-escopo`, `memoria termo`) pelo nome do espaço de comando e do
submódulo, sem depender de um nome de ação específico ainda não fechado pelo plano 003 em paralelo. O
plano 006 (prova ponta a ponta) pode consumir os três submódulos das fases 002 a 005 sem bloqueio
identificado.

---
*Phase: 14-memoria-do-projeto*
*Completed: 2026-07-26*
