---
phase: 15-modo-grill
plan: "005-regressao"
subsystem: doutrina (guarda de perguntas)
tags: [regressao, grill, questionamento, guarda, conjunto-fechado]
dependency-graph:
  requires:
    - "up/skills/up-brainstorm/grill.md (plano 001, motor unico do modo grill)"
    - "up/skills/up-brainstorm/SKILL.md (plano 002, porta do grill)"
    - "up/workflows/up.md (plano 003, propagacao do piso novo)"
  provides: ["guarda de perguntas (perguntas.test.cjs) verde no repositorio real, conjunto fechado coerente com o produto"]
  affects: ["qualquer fase futura que adicione ou remova ponto de pergunta: o padrao desta correcao (remover do inventario E do conjunto fechado na mesma tarefa) e o precedente"]
tech-stack:
  added: []
  patterns: ["conjunto fechado por identificador: remocao de ponto de pergunta e ato deliberado, nunca efeito colateral de outra edicao"]
key-files:
  created: []
  modified:
    - "up/references/questioning.md"
    - "up/bin/lib/perguntas.test.cjs"
decisions: []
metrics:
  duration: "1 sessao"
  completed: "2026-07-26"
---

# Fase 15 Plano 005 (regressao): Guarda de perguntas Summary

Os planos 002 e 003 desta fase rodaram em paralelo e cada um removeu, do arquivo de que era dono,
uma tag `<pergunta id="...">` que descrevia o modelo antigo de pergunta unica do tier Pequena
(substituido pelo modo grill). Nenhum dos dois atualizou o inventario fechado em
`up/references/questioning.md` nem o conjunto fechado `IDENTIFICADORES_ESPERADOS` em
`up/bin/lib/perguntas.test.cjs`, deixando o guarda vermelho no repositorio real com dois erros
`id_declarado_sem_tag`. Correcao: os dois identificadores genuinamente deixaram de existir como
ponto de pergunta (absorvidos pelo laco ilimitado do grill, nao apenas movidos de lugar), por isso
foram removidos do inventario e do conjunto fechado na mesma tarefa, com o piso de contagem ajustado
de 21 para 19.

## Decisao caso a caso, com evidencia

### `up.decisao-chave` ("A decisão-chave da tarefa classificada como pequena", em `up/workflows/up.md`)

**Veredito: DEIXOU DE EXISTIR.**

Evidencia textual, `up/workflows/up.md` linhas 222-238 (secao "Profundidade do intake/brainstorm
conforme COMPLEXITY"):

> - **standard (pequena) e complex (media/grande):** entram em modo grill (motor em
>   `up/skills/up-brainstorm/grill.md`, perguntas ilimitadas, uma por vez, ate uma das tres portas de
>   saida). Este workflow nao redefine a cadencia do grill, so aponta pra ela. O que sobra especifico
>   do intake e o CONTEUDO a cobrir (os 5 blocos do intake antigo), que agora sao assunto das
>   perguntas do grill em vez de uma cadencia propria.

O ponto antigo era literalmente UMA pergunta fixa, a "decisao-chave", feita uma unica vez para
tarefa Pequena. Essa forma nao existe mais em lugar nenhum do arquivo: o plano 003 (tarefa 2, ver
`003-SUMMARY.md` linhas 51-56) fundiu `standard` e `complex` no mesmo tratamento e trocou a cadencia
propria pelo laco do `grill.md`, que faz perguntas ilimitadas sobre os 5 blocos de conteudo (briefing,
design system, credenciais, referencias, restricoes) em vez de uma pergunta fechada e unica. Busquei
por qualquer tag `<pergunta id="up.decisao-chave">` ou equivalente redigida de outra forma no arquivo
inteiro: nao ha. O ponto nao mudou de lugar, foi absorvido pelo laco. Manter a linha no inventario
seria manter tag decorativa apontando para um comportamento que o proprio arquivo revogou.

### `brainstorm.decisao-chave` ("A decisão-chave do tier pequena", em `up/skills/up-brainstorm/SKILL.md`)

**Veredito: DEIXOU DE EXISTIR.**

Evidencia textual, `up/skills/up-brainstorm/SKILL.md` linhas 83-89 (secao "Profundidade escalada por
tamanho"):

> | **Trivial** (1 arquivo, sem decisao de arquitetura) | 0 perguntas. Anuncia em 1 linha o que vai
>   fazer e onde. Executa |
> | **Pequena, Média e Grande** | **Modo grill**: perguntas ilimitadas, uma por vez, com resposta
>   recomendada, até uma das três portas de saída. O tier muda o que a destilação produz, não quantas
>   perguntas cabem. Motor em `grill.md` (mesma pasta) |
>
> O que separa Pequena de Média e Grande agora é só a destilação (design em três frases contra design
> por seção); a contagem de perguntas deixou de ser o eixo.

A tabela de profundidade que antes tinha quatro linhas (Trivial/Pequena/Media/Grande, cada uma com
sua propria contagem de perguntas) virou duas: Trivial (0 perguntas) e "Pequena, Media e Grande"
(grill, sem teto). O plano 002 (`002-SUMMARY.md`, item 3 do "O que foi construido") documenta a
remocao explicita do bloco `<pergunta id="brainstorm.decisao-chave">` com o motivo: "ele descrevia
exatamente o modelo que deixou de existir (uma pergunta fixa em vez de grill ilimitado) e, mantido,
contradiria o motor". Confirmei no arquivo atual: nenhuma tag com esse id, nenhuma pergunta fixa
para Pequena em lugar nenhum do arquivo. O dono continua sendo perguntado sobre a decisao-chave do
projeto pequeno, mas agora dentro do laco do grill (perguntas ilimitadas ate uma das tres portas de
saida), nao num ponto isolado e fechado. Restaurar a tag seria reintroduzir exatamente a contradicao
que o plano 002 eliminou de proposito.

## Por que nao e "so mudou de lugar"

Em nenhum dos dois casos existe, hoje, um ponto de pergunta FECHADO e UNICO equivalente ao antigo
(um bloco `<pergunta id="...">` com uma pergunta, uma recomendacao, um motivo, feita uma vez). O que
existe e um LACO (`grill.md`): numero de perguntas nao fixo, sujeito as tres portas de saida (palavra
de parada, checkpoint a cada tres perguntas, auto-convergencia). Um laco sem teto nao e um "ponto de
pergunta" no sentido que o contrato define em `questioning.md` secao 4 ("todo lugar do produto onde
existe texto literal de pergunta ao dono", marcado por uma tag especifica): e uma classe de
comportamento inteira, ja descrita pelo proprio `grill.md` e citada por nome nos dois arquivos. Por
isso a remocao do inventario e do conjunto fechado, e nao uma tag nova reescrita no lugar.

## Mudanca aplicada

**`up/references/questioning.md`**: removidas as duas linhas da tabela do inventario (`up.decisao-chave`
e `brainstorm.decisao-chave`). As demais 19 linhas ficaram intactas.

**`up/bin/lib/perguntas.test.cjs`**: removidos os dois identificadores de `IDENTIFICADORES_ESPERADOS`
(21 -> 19 identificadores) e `PONTOS_MINIMOS` ajustado de 21 para 19, exatamente como o comentario da
constante instrui ("Fase que acrescentar ponto novo acrescenta o identificador aqui na mesma tarefa",
aplicado aqui ao inverso: fase que confirma que um ponto deixou de existir remove o identificador na
mesma tarefa). `SUPERFICIES_MINIMAS` **nao mudou** (permanece 7): nenhuma das duas superficies
("Roteamento da porta única" e "Brainstorm") desapareceu do inventario, porque cada uma ainda tem
outras linhas (`up.proxima-acao`/`up.clone-intake`/`up.config-editar` e `brainstorm.checkpoint`,
respectivamente).

## Coerencia entre piso de pontos, piso de superficies e conjunto fechado

- Conjunto fechado (`IDENTIFICADORES_ESPERADOS`): 19 identificadores.
- Piso de pontos (`PONTOS_MINIMOS`): 19, igual ao numero de linhas restantes no inventario real.
- Piso de superficies (`SUPERFICIES_MINIMAS`): 7, inalterado porque as 7 superficies distintas
  (Roteamento da porta única, Brainstorm, Planejamento, Confirmação de início, Gate visual
  pré-merge, Fechamento de fase, Auditoria) continuam todas representadas por ao menos uma linha.
- Os tres numeros batem entre si e com o repositorio real: 19 linhas no inventario, 19 identificadores
  no conjunto fechado, 7 superficies distintas, e o verde confirma exatamente isso na saida
  ("verde OK (19 pontos verificados)").

## Evidencia de execucao (guarda)

**Antes** (`node up/bin/lib/perguntas.test.cjs`, no repositorio real, antes da correcao):

```
vermelho: 11 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio, id_esperado_ausente, pontos_abaixo_do_piso, superficies_abaixo_do_piso
verde FALHOU. Erros encontrados no repositorio real:
  {"tipo":"id_declarado_sem_tag","id":"up.decisao-chave","arquivo":"up/workflows/up.md"}
  {"tipo":"id_declarado_sem_tag","id":"brainstorm.decisao-chave","arquivo":"up/skills/up-brainstorm/SKILL.md"}
EXIT=1
```

**Depois** (mesmo comando, depois da correcao):

```
vermelho: 9 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio, id_esperado_ausente, pontos_abaixo_do_piso, superficies_abaixo_do_piso
perguntas: vermelho OK (4 defeitos detectados), verde OK (19 pontos verificados)
EXIT=0
```

O vermelho embutido (a fixture com 4 defeitos injetados, incluindo o caso de superficie inteira
removida do inventario) continua reprovando corretamente antes de checar o repositorio real (a
contagem de tipos de erro caiu de 11 para 9 porque o vermelho tambem le o `IDENTIFICADORES_ESPERADOS`
atualizado: com os dois identificadores fora do conjunto fechado, dois dos erros `id_esperado_ausente`
que apareciam antes por coincidencia com o defeito 4 da fixture deixaram de ser contados junto; a
lista de TIPOS distintos de defeito continua a mesma). O verde passa limpo no repositorio real, com
19 pontos verificados.

## Desvios do Plano

Nenhum. A tarefa era cirurgica por definicao (decidir os dois identificadores e ajustar os dois
arquivos do guarda) e nao exigiu nenhuma correcao adicional de Regra 1-3, nem decisao arquitetural de
Regra 4.

## Arquivos fora de escopo (nao tocados, com justificativa)

Referencias remanescentes aos dois identificadores em `.plano/fases/13-formato-de-pergunta/*.md` e em
`.plano/fases/15-modo-grill/002-SUMMARY.md` sao registro historico de planejamento (PLAN/SUMMARY/PROVA
de fases ja fechadas, fotografia do estado no momento em que foram escritos), nao superficies vivas de
doutrina. Nao fazem parte de `ARQUIVOS_SUPERFICIE` nem do produto que o dono le em tempo de execucao,
e por isso ficam como estao, no mesmo criterio que o plano 003 aplicou a `docs/redesign/CRITIQUE.md`,
`docs/redesign/UP-V2-FINAL.md` e `up/CHANGELOG.md`.

## Self-Check: PASSOU

- `up/references/questioning.md`: ENCONTRADO, com 19 linhas no inventario (confirmado por leitura).
- `up/bin/lib/perguntas.test.cjs`: ENCONTRADO, com 19 identificadores em `IDENTIFICADORES_ESPERADOS`
  e `PONTOS_MINIMOS = 19` (confirmado por leitura).
- commit `e08dc11`: ENCONTRADO em `git log --oneline`.
- `node up/bin/lib/perguntas.test.cjs` retorna codigo de saida 0 no repositorio real: CONFIRMADO.

## Criterios de aceite

- [x] `node up/bin/lib/perguntas.test.cjs` sai com codigo 0.
- [x] O vermelho embutido continua detectando os proprios defeitos injetados.
- [x] O verde passa no repositorio real (19 pontos verificados).
- [x] Piso de contagem (19), conjunto fechado (19 identificadores) e piso de superficies (7) coerentes
      entre si e com o inventario real.
- [x] Decisao de cada identificador tomada caso a caso, com evidencia textual do arquivo de origem e
      do SUMMARY do plano que fez a remocao original.
- [x] Commit atomico, sem tocar `.plano/STATE.md` nem `.plano/ROADMAP.md`.
