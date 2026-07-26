---
phase: 14-memoria-do-projeto
plano: 009-debitos
titulo: "Correcao final: os tres debitos da revisao (93/100) fechados antes do merge"
tags: [concorrencia, lock, guarda-lexica, escape-hatch]
dependency-graph:
  requires:
    - up/bin/lib/memoria.cjs (comLockDiretorio, RV-003)
    - up/bin/lib/memoria-termo.cjs (precedente --forcar/--justificativa)
  provides:
    - up/bin/lib/memoria-rejeicoes.cjs (alias com lock; registrar com escape hatch)
    - up/bin/lib/memoria.cjs (lock com deteccao de orfandade)
  affects:
    - up/bin/lib/memoria-decisao.cjs (nenhuma mudanca de codigo; testes de corrida re-executados como regressao)
    - up/bin/lib/memoria-termo.cjs (nenhuma mudanca de codigo; testes de corrida re-executados como regressao)
tech-stack:
  added: []
  patterns:
    - "lock de diretorio por conceito (fs.mkdirSync atomico) para leitura-modificacao-escrita de arquivo compartilhado"
    - "roubo de lock orfao por idade de mtime, com continue imediato no loop de retentativa"
    - "escape hatch --forcar mais --justificativa para guarda lexica de admissao, com marca e justificativa gravadas no artefato"
key-files:
  created:
    - up/bin/lib/memoria.test.cjs
  modified:
    - up/bin/lib/memoria-rejeicoes.cjs
    - up/bin/lib/memoria-rejeicoes.test.cjs
    - up/bin/lib/memoria.cjs
decisions:
  - "Fixei o escopo do DEB-3 exatamente na acao alias (linha ~389, apontada pela revisao), sem estender o lock para a acao registrar (criacao de conceito novo), que nao fazia parte do debito nomeado e cuja janela de corrida (criar o MESMO conceito duas vezes ao mesmo tempo) e um cenario distinto, ja coberto pela checagem de duplicata existente."
  - "Limiar de orfandade do lock fixado em 5000ms por padrao (config avel via opts.limiarOrfaoMs, usado pelos testes com valores menores para rodar rapido): folga generosa acima do tempo real de secao critica deste modulo (leitura/escrita de arquivo pequeno, poucos milissegundos), para nunca roubar um lock vivo sob contencao legitima."
metrics:
  duration: "~1 sessao"
  tasks: 3
  files: 4
  completed: 2026-07-26
---

# Fase 14 Plano 009: Correcao dos tres debitos da revisao final

Os tres debitos da revisao (score 93/100) fechados antes do merge da fase: corrida de escrita
perdida na acao `alias` da base de rejeicoes, lock orfao que travava escrita para sempre, e
guarda lexica sem valvula de escape para motivo estrutural legitimo.

## O que foi feito

### DEB-3 (mais serio): `fora-de-escopo alias` fora do lock entre processos

A acao `alias` de `up/bin/lib/memoria-rejeicoes.cjs` fazia leitura-modificacao-escrita do
frontmatter inteiro (bloco de `aliases`) sem lock nem escrita exclusiva. Mesma classe do RV-003
ja fechado em `memoria-decisao.cjs` e `memoria-termo.cjs`, mas nunca fechada neste submodulo
irmao.

**Correcao:** a secao inteira "le o conteudo atual do conceito, monta a lista final de
apelidos, escreve o arquivo" de `adicionarAlias` passou a rodar dentro de `comLockDiretorio`
(mesmo mecanismo do RV-003), com um lock por conceito (`.{conceito}.alias.lock`). A checagem de
"conceito nao encontrado" continua **fora** do lock, de proposito: evita que o lock crie o
diretorio `.plano/fora-de-escopo/` como efeito colateral de uma chamada que ja vai falhar
(criacao preguicosa preservada).

**Teste de concorrencia:** `up/bin/lib/memoria-rejeicoes.test.cjs`, caso `corrida: 10 apelidos
concorrentes no MESMO conceito produzem 10 apelidos gravados, nenhum perdido`. Dispara 10
processos reais (`child_process.spawn`, nao `spawnSync`) chamando `memoria fora-de-escopo alias`
concorrentemente no mesmo conceito ja registrado, e confere que os 10 apelidos sobrevivem no
disco.

**Vermelho (3 rodadas, antes da correcao):**
```
FAIL - corrida: 10 apelidos concorrentes no MESMO conceito produzem 10 apelidos gravados, nenhum perdido
    deveriam existir 10 apelidos gravados ao final, existem 9: ["apelido concorrente 0","apelido concorrente 5","apelido concorrente 7","apelido concorrente 2","apelido concorrente 1","apelido concorrente 4","apelido concorrente 9","apelido concorrente 3","apelido concorrente 6"]

FAIL - corrida: 10 apelidos concorrentes no MESMO conceito produzem 10 apelidos gravados, nenhum perdido
    deveriam existir 10 apelidos gravados ao final, existem 9: ["apelido concorrente 2","apelido concorrente 4","apelido concorrente 0","apelido concorrente 5","apelido concorrente 3","apelido concorrente 9","apelido concorrente 1","apelido concorrente 7","apelido concorrente 8"]

FAIL - corrida: 10 apelidos concorrentes no MESMO conceito produzem 10 apelidos gravados, nenhum perdido
    deveriam existir 10 apelidos gravados ao final, existem 8: ["apelido concorrente 0","apelido concorrente 7","apelido concorrente 5","apelido concorrente 1","apelido concorrente 3","apelido concorrente 8","apelido concorrente 4","apelido concorrente 9"]
```
(numa das dez rodadas de reproducao anteriores a este trecho, um processo ate saiu com codigo 1
em vez de perder em silencio: `saidas: [0,0,0,0,1,0,0,0,0,0]`, confirmando a leitura de arquivo
em estado inconsistente sob corrida real.)

**Verde (5 rodadas, depois da correcao):**
```
ok  - corrida: 10 apelidos concorrentes no MESMO conceito produzem 10 apelidos gravados, nenhum perdido
37 passed, 0 failed
```
(repetido identico em 5 rodadas consecutivas.)

### DEB-2: lock orfao nunca vencia

`comLockDiretorio` em `up/bin/lib/memoria.cjs` esperava ate 400 tentativas e desistia, sem
nunca considerar que o dono do lock pudesse ter morrido no meio da secao critica. Um processo
morto segurando o lock deixava toda escrita seguinte em qualquer submodulo de memoria (decisao,
termo, fora-de-escopo) falhando para sempre.

**Correcao:** a cada `EEXIST` na tentativa de `mkdirSync`, o loop agora compara o `mtime` do
diretorio de lock contra um limiar de orfandade (`LOCK_ORFAO_LIMIAR_MS_PADRAO = 5000`,
configuravel via `opts.limiarOrfaoMs`). Mais velho que o limiar: o lock e removido
(`roubarLockOrfao`), o roubo e registrado em `stderr` com caminho e idade, e a tentativa
seguinte volta a competir pelo lock normalmente (sem esperar o `esperaMs` de novo, porque o
lock acabou de abrir). Mais novo que o limiar (inclusive um lock vivo sob contencao legitima o
tempo inteiro do teste): continua respeitado exatamente como antes.

**Teste:** novo arquivo `up/bin/lib/memoria.test.cjs`, testando `comLockDiretorio` diretamente
(sem passar pelos submodulos, que nao expunham a opcao de limiar): lock orfao criado a mao
(`fs.mkdirSync` mais `fs.utimesSync` para forcar `mtime` antigo) e lock vivo criado a mao (sem
forcar `mtime`, ou seja, recente).

**Vermelho (antes da correcao):**
```
FAIL - comLockDiretorio: lock orfao (mtime mais velho que o limiar) e roubado e o trabalho conclui
    Nao foi possivel obter o lock de escrita em "/tmp/up-mem-lock-QsO4Hn/.orfao.lock" apos 20 tentativas (concorrencia excessiva ou lock orfao).
ok  - comLockDiretorio: lock vivo (mtime recente) continua respeitado, nunca e roubado
ok  - comLockDiretorio: excecao dentro de fn() ainda libera o lock (comportamento pre-existente preservado)
FAIL - comLockDiretorio: dois lock orfaos em sequencia (dois donos mortos) sao roubados um apos o outro
    Nao foi possivel obter o lock de escrita em "/tmp/up-mem-lock-thO6Av/.orfao-duas-vezes.lock" apos 20 tentativas (concorrencia excessiva ou lock orfao).
ok  - resolverCaminhoContido: caminho que escaparia do diretorio lanca excecao

3 passed, 2 failed
```
Reproduz exatamente a falha permanente descrita pela revisao (lock criado a mao trava a escrita
para sempre).

**Verde (3 rodadas, depois da correcao):**
```
[memoria] lock orfao roubado: "/tmp/up-mem-lock-.../.orfao.lock" estava parado ha 10000ms, mais velho que o limite de orfandade. O dono original provavelmente morreu no meio da escrita.
ok  - comLockDiretorio: lock orfao (mtime mais velho que o limiar) e roubado e o trabalho conclui
ok  - comLockDiretorio: lock vivo (mtime recente) continua respeitado, nunca e roubado
ok  - comLockDiretorio: excecao dentro de fn() ainda libera o lock (comportamento pre-existente preservado)
[memoria] lock orfao roubado: ".../orfao-duas-vezes.lock" estava parado ha 10000ms, ...
[memoria] lock orfao roubado: ".../orfao-duas-vezes.lock" estava parado ha 10000ms, ...
ok  - comLockDiretorio: dois lock orfaos em sequencia (dois donos mortos) sao roubados um apos o outro
ok  - resolverCaminhoContido: caminho que escaparia do diretorio lanca excecao

5 passed, 0 failed
```
(identico em 3 rodadas.) As baterias de corrida ja existentes de `memoria-decisao.cjs` e
`memoria-termo.cjs` (contencao legitima real entre processos) foram re-executadas 2 vezes cada
apos a mudanca e continuam verdes sem alteracao de comportamento, confirmando que o limiar de
5s nao interfere com contencao normal.

### DEB-1: guarda lexica sem valvula de escape

As duas guardas (item ja implementado, adiamento) de `memoria-rejeicoes.cjs` barravam motivo
estrutural legitimo que so por coincidencia de linguagem continha uma marca da lista fechada.
Cinco frases medidas pela revisao, todas recusadas sem saida:

1. "O produto ja tem um caminho melhor pela integracao nativa" (marca `ja tem`, lista original)
2. "Ja temos um principio de arquitetura que proibe estado global" (marca `ja temos`, lista original)
3. "A empresa ja existe ha seis anos sem esse recurso" (marca `ja existe`, lista original)
4. "Nao e prioridade da empresa e nunca vai ser, porque muda o publico-alvo" (marca `nao e
   prioridade`, entrou no alargamento)
5. "Ja entregamos valor suficiente pelo caminho atual" (marca `ja entregamos`, entrou no
   alargamento)

**Correcao:** replica o precedente ja existente em `memoria termo registrar` (`--forcar` mais
`--justificativa`). `verificarGuardaImplementado` e `verificarGuardaAdiamento` passaram a
receber `flags` e devolver a marca encontrada (ou `null`): sem `--forcar`, continuam lancando
exatamente como antes; com `--forcar` mas sem `--justificativa`, lancam pedindo a justificativa
(o escape nao vira bypass silencioso so por passar a flag); com as duas, a escrita passa. A
marca forcada e a justificativa ficam gravadas no proprio arquivo (comentario HTML logo apos o
titulo, antes de "Motivo da recusa") e no resultado JSON (`guarda_forcada`,
`justificativa_forcada`). A guarda continua ligada por padrao.

**Vermelho (as cinco frases recusadas mesmo com `--forcar` e `--justificativa`, porque as flags
ainda nao existiam no codigo):**
```
ok  - escape hatch 1/5: "Caminho pela integracao nativa" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
FAIL - escape hatch 1/5: "Caminho pela integracao nativa" com --forcar e --justificativa e aceito e grava a justificativa
    Rejeicao nao registrada: o motivo indica item ja implementado (marca "ja tem"). ...
ok  - escape hatch 2/5: "Estado global proibido por arquitetura" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
FAIL - escape hatch 2/5: "Estado global proibido por arquitetura" com --forcar e --justificativa e aceito e grava a justificativa
    Rejeicao nao registrada: o motivo indica item ja implementado (marca "ja temos"). ...
ok  - escape hatch 3/5: "Seis anos sem o recurso" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
FAIL - escape hatch 3/5: "Seis anos sem o recurso" com --forcar e --justificativa e aceito e grava a justificativa
    Rejeicao nao registrada: o motivo indica item ja implementado (marca "ja existe"). ...
ok  - escape hatch 4/5: "Muda o publico alvo da empresa" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
FAIL - escape hatch 4/5: "Muda o publico alvo da empresa" com --forcar e --justificativa e aceito e grava a justificativa
    Rejeicao nao registrada: o motivo indica adiamento (marca "nao e prioridade"), ...
ok  - escape hatch 5/5: "Valor suficiente pelo caminho atual" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
FAIL - escape hatch 5/5: "Valor suficiente pelo caminho atual" com --forcar e --justificativa e aceito e grava a justificativa
    Rejeicao nao registrada: o motivo indica item ja implementado (marca "ja entregamos"). ...
FAIL - escape hatch: --forcar sem --justificativa continua falhando (nao vira bypass silencioso)
    The input did not match the regular expression /justificativa/. ...
ok  - escape hatch: --forcar em motivo sem nenhuma marca nao exige --justificativa (nao muda o caminho feliz)
...
FAIL - linha de comando: registrar com marca por coincidencia mais --forcar e --justificativa sai com codigo 0
    Expected values to be strictly equal: 1 !== 0

44 passed, 7 failed
```

**Verde (depois da correcao):**
```
ok  - escape hatch 1/5: "Caminho pela integracao nativa" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
ok  - escape hatch 1/5: "Caminho pela integracao nativa" com --forcar e --justificativa e aceito e grava a justificativa
ok  - escape hatch 2/5: "Estado global proibido por arquitetura" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
ok  - escape hatch 2/5: "Estado global proibido por arquitetura" com --forcar e --justificativa e aceito e grava a justificativa
ok  - escape hatch 3/5: "Seis anos sem o recurso" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
ok  - escape hatch 3/5: "Seis anos sem o recurso" com --forcar e --justificativa e aceito e grava a justificativa
ok  - escape hatch 4/5: "Muda o publico alvo da empresa" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
ok  - escape hatch 4/5: "Muda o publico alvo da empresa" com --forcar e --justificativa e aceito e grava a justificativa
ok  - escape hatch 5/5: "Valor suficiente pelo caminho atual" e barrado sem --forcar (motivo estrutural, marca por coincidencia)
ok  - escape hatch 5/5: "Valor suficiente pelo caminho atual" com --forcar e --justificativa e aceito e grava a justificativa
ok  - escape hatch: --forcar sem --justificativa continua falhando (nao vira bypass silencioso)
ok  - escape hatch: --forcar em motivo sem nenhuma marca nao exige --justificativa (nao muda o caminho feliz)
...
ok  - linha de comando: registrar com marca por coincidencia mais --forcar e --justificativa sai com codigo 0
ok  - linha de comando: registrar com marca por coincidencia mais --forcar sem --justificativa sai com codigo 1

51 passed, 0 failed
```

## Bateria final (3 rodadas, os 6 arquivos de teste de memoria)

| Arquivo | Rodada 1 | Rodada 2 | Rodada 3 |
|---|---|---|---|
| `memoria.test.cjs` (novo) | 5 passed, 0 failed | 5 passed, 0 failed | 5 passed, 0 failed |
| `memoria-rejeicoes.test.cjs` | 51 passed, 0 failed | 51 passed, 0 failed | 51 passed, 0 failed |
| `memoria-decisao.test.cjs` | 33 passed, 0 failed | 33 passed, 0 failed | 33 passed, 0 failed |
| `memoria-termo.test.cjs` | 20 passed, 0 failed | 20 passed, 0 failed | 20 passed, 0 failed |
| `memoria-glossario.test.cjs` | 19 passed, 0 failed | 19 passed, 0 failed | 19 passed, 0 failed |
| `memoria-e2e.test.cjs` | 16 passed, 0 failed | 16 passed, 0 failed | 16 passed, 0 failed |

**Total: 144 casos, 0 falhas, estavel em 3 rodadas consecutivas** (as baterias de corrida
de `memoria-decisao.cjs` e `memoria-termo.cjs`, ja existentes antes desta correcao, foram
re-executadas como regressao e continuam verdes sem alteracao de comportamento sob a nova
logica de orfandade).

## Desvios do plano

Nenhum. As tres correcoes ficaram estritamente dentro do escopo pedido: nenhum `scripts` em
`package.json`, nenhum gate de regua, nenhuma mecanizacao do corte de tres frases, nenhum
`init up`/`init auditar`, zero travessao introduzido (verificado por `grep` no diff final),
e nada tocado em `core.cjs` alem do que ja existia (o slug que come acento nao foi tocado).

## Self-Check

Arquivos:
```
ENCONTRADO: up/bin/lib/memoria.cjs
ENCONTRADO: up/bin/lib/memoria.test.cjs
ENCONTRADO: up/bin/lib/memoria-rejeicoes.cjs
ENCONTRADO: up/bin/lib/memoria-rejeicoes.test.cjs
```

Commits:
```
ENCONTRADO: a0e8a68 fix(14-009): fecha corrida de escrita concorrente em fora-de-escopo alias
ENCONTRADO: 83309c7 fix(14-009): lock orfao de comLockDiretorio agora pode ser roubado
ENCONTRADO: f253b04 fix(14-009): fora-de-escopo registrar aceita --forcar mais --justificativa
```

## Self-Check: PASSOU
