---
phase: 15-modo-grill
plan: "006"
subsystem: prova (amostra estatística da sonda de comportamento)
tags: [grill, brainstorm, prova, teste, amostra, honestidade-da-prova]
dependency-graph:
  requires:
    - "up/tests/grill-probe.cjs (plano 004, sonda de comportamento com julgamento determinístico)"
    - "up/skills/up-brainstorm/grill.md (plano 001, doutrina nova sob teste)"
    - "SHA_BASE 89541fcc92613cc9624cc09d8dc34efb17fb0b3b (doutrina anterior à fase, extraída de up/skills/up-brainstorm/SKILL.md)"
  provides:
    - "amostra de 20 execuções reais do runtime (10 doutrina nova, 10 doutrina anterior) tabulada por asserção individual"
    - "achado sobre ruído de vocabulário em duas das seis asserções da sonda"
  affects:
    - "leitura da 'DECISÃO ESCALADA 1' do 004-SUMMARY.md (contraprova da palavra de parada), agora respondida com amostra maior"
tech-stack:
  added: []
  patterns:
    - "amostra em vez de execução única: 10 repetições por doutrina, mesmo prompt e mesmo modelo, para decidir se a sonda discrimina de forma confiável"
    - "leitura da resposta bruta por trás do veredito da sonda, para separar falha estrutural de ruído de vocabulário no juiz determinístico"
key-files:
  created:
    - ".plano/fases/15-modo-grill/006-AMOSTRA-SUMMARY.md"
  modified: []
decisions:
  - "Taxa bruta (100% nova vs 70% antiga) não foi aceita como veredito final sem inspecionar a causa de cada reprovação, porque a regra de honestidade da prova exige separar diferença estrutural de ruído de regex"
  - "Recomendação final: manter a sonda como informativa, não como gate duro, para as duas asserções que mostraram ruído; as outras quatro asserções continuam registradas como estáveis (sem falha nas 20 execuções), mas também não discriminam nesta amostra"
metrics:
  duration: "~35 minutos (predominantemente espera de runtime sob carga alta da máquina)"
  completed: "2026-07-26"
---

# Fase 15, medição 006: amostra de 20 execuções da sonda `parada`

Uma amostra decide o que duas execuções não decidiram. Rodei `up/tests/grill-probe.cjs --caso parada`
dez vezes contra a doutrina nova (`up/skills/up-brainstorm/grill.md`) e dez vezes contra a doutrina
anterior à fase (`up/skills/up-brainstorm/SKILL.md` no SHA `89541fcc92613cc9624cc09d8dc34efb17fb0b3b`,
extraída via `git show` para um arquivo temporário, exatamente como o plano 004 já havia feito). Mesmo
modelo econômico (`claude -p --model fable`), mesmo prompt, mesma transcrição fabricada em todas as 20
chamadas. Nenhuma execução precisou ser descartada: as 20 rodaram até o fim, nenhuma bateu timeout de
180s, nenhuma saiu com código 2 (sonda não executável).

## Resultado agregado

| Doutrina | Execuções válidas | Passaram 6/6 | Taxa |
|----------|--------------------|--------------|------|
| Nova (`grill.md`) | 10 | 10 | 100% |
| Anterior (`SKILL.md` no SHA_BASE) | 10 | 7 | 70% |

Descartadas por falha de infraestrutura: 0 em cada grupo.

## Tabela por asserção individual (10 execuções válidas em cada doutrina)

| Asserção | Falhas doutrina nova | Falhas doutrina anterior |
|----------|------------------------|---------------------------|
| Sem frase de confirmação | 0/10 | 0/10 |
| Sem pergunta nova de grill (`[Q4]`/`Depende de:`) | 0/10 | 0/10 |
| Sem abrir o checkpoint | 0/10 | 2/10 |
| Destila as decisões já fixadas (servidor, download) | 0/10 | 1/10 |
| Pede aprovação do design | 0/10 | 0/10 |
| Declara o ponto em aberto | 0/10 | 0/10 |

Todas as três reprovações da doutrina anterior (`antiga-4`, `antiga-8`, `antiga-9`) falharam em exatamente
uma asserção cada, nunca em mais de uma na mesma execução.

## O que cada reprovação realmente contém (leitura da resposta bruta, não só do veredito)

A regra de honestidade da prova exige olhar a causa, não só o placar. Li as 20 respostas brutas, não só
os vereditos `ok`/`FALHA` que a sonda imprime.

**As duas reprovações em "sem abrir o checkpoint" (`antiga-4`, `antiga-8`) não abriram o controle real de
checkpoint.** A asserção reprova quando encontra a string `mais perguntas` OU `fechar e seguir` em
qualquer lugar da resposta. Nas duas execuções, a frase encontrada foi linguagem natural ("Sem mais
perguntas", "Paro as perguntas aqui" seguido de "Sem mais perguntas.") anunciando que a rodada
encerrou, não o controle de duas opções que a doutrina anterior manda literalmente apresentar
(`Fechar e seguir` | `Mais perguntas` como rótulos de opção). Busquei essa string exata, como rótulo de
opção, nas 20 respostas brutas (as 10 da doutrina nova e as 10 da doutrina anterior): **zero
ocorrências em qualquer uma das 20.** Nenhuma das dez execuções contra a doutrina anterior, que manda
"toda rodada de perguntas termina com um AskUserQuestion de controle com exatamente 2 opções", de fato
abriu esse controle depois da palavra de parada. Na métrica que interessa (o checkpoint real abriu ou
não), doutrina nova e doutrina anterior empatam: 0/10 e 0/10.

**A reprovação em "destila as decisões já fixadas" (`antiga-9`) é troca de sinônimo, não ausência da
decisão.** A asserção exige as strings literais `servidor` e `download`. Em `antiga-9` o modelo escreveu
"o painel ganha um botão de exportar que baixa o arquivo direto no navegador": a decisão (entrega direta
ao navegador, sem e-mail nem fila) está presente, só que com a palavra "baixa" no lugar de "download".
Duas execuções da doutrina nova (`nova-1`, `nova-2`) e uma da doutrina anterior (`antiga-5`) também usaram
a palavra "baixa" na mesma frase, mas por acaso mantiveram "download" em outro trecho da resposta e por
isso passaram. É a mesma reprovação por vocabulário, não por diferença estrutural, já registrada na
Prova 5 do `004-SUMMARY.md` (execução 1, "baixa direto" em vez de "download").

**Achado adicional, fora do pedido original mas relevante para não inflar a leitura**: em `antiga-9` a
asserção "pede aprovação do design" foi contada como `ok`, mas por um motivo frágil: a resposta diz
"Aprovando esse design, o próximo passo é `/up:plan`", que é uma afirmação (o modelo já está assumindo
aprovação), não um pedido de aprovação ao dono. A regex da asserção (`aprova|posso seguir|segue assim|de
acordo`) casa a substring "aprova" dentro de "Aprovando" e conta como passou, mesmo essa execução
específica não tendo de fato perguntado. Não achei ocorrência do mesmo padrão nas outras 19 execuções.
Não alterei o placar desta asserção (ela está registrada como passou, porque foi o que a regra escrita
decidiu), mas registro o caso porque a regra de honestidade da prova pede isso: uma asserção pode marcar
"ok" por coincidência de substring numa direção que mascara uma falha real, não só reprovar por engano
numa direção que penaliza sem motivo.

## Interpretação honesta

A taxa bruta (100% contra 70%) sozinha sugeriria que a doutrina nova cria uma garantia comportamental que
a antiga não tem. Mas ao abrir cada uma das três reprovações da doutrina anterior, nenhuma é uma diferença
estrutural real no eixo que a fase 15 quis provar (o checkpoint de duas opções abrindo ou não depois da
palavra de parada). As três são ruído: duas por correspondência de linguagem natural ("mais perguntas"
como frase comum, não como rótulo de opção) e uma por sinônimo ("baixa" em vez de "download"). Na métrica
que de fato importa (o controle de checkpoint abriu?), a resposta é a mesma para as duas doutrinas: não
abriu em nenhuma das 20 execuções, incluindo as 10 rodadas contra o texto que manda abri-lo.

Isso aponta para o cenário do meio descrito no pedido desta tarefa: **as duas doutrinas convergem, numa
taxa alta, no comportamento estrutural relevante** (respeitar "chega" sem confirmar e sem abrir
checkpoint), uma vez que se descontam os falsos positivos de vocabulário da sonda. A leitura mais honesta
não é "a doutrina nova criou o comportamento" (as 10 execuções contra o texto antigo já mostram o mesmo
comportamento estrutural 10 de 10 vezes), e também não é "as duas são idênticas" (a taxa bruta real é
100% contra 70%, e ignorar isso seria inflar a doutrina anterior além do que os dados sustentam). É:
**o modelo econômico usado nesta sonda já tende a obedecer "chega" sem o controle de checkpoint,
independentemente do texto da doutrina que está lendo; o valor da doutrina nova não é criar esse
comportamento do zero, é declará-lo como regra explícita (em vez de depender do alinhamento incidental
do modelo) e impedir que uma futura edição da doutrina volte a exigir confirmação.** A doutrina anterior
mandava literalmente o checkpoint e mesmo assim o modelo não abriu em nenhuma das 10 tentativas: é
evidência de que a garantia observada vem mais do modelo do que do texto, pelo menos para este caso e
este modelo.

Ao mesmo tempo, duas das seis asserções da sonda (`sem abrir o checkpoint` e `destila as decisões já
fixadas`) mostraram ruído real nesta amostra: 3 reprovações em 20 execuções (15%) que não correspondem a
diferença estrutural nenhuma quando a resposta bruta é lida. As outras quatro asserções (`sem frase de
confirmação`, `sem pergunta nova de grill`, `pede aprovação do design`, `declara o ponto em aberto`)
não reprovaram nenhuma vez nas 20 execuções, o que as torna estáveis nesta amostra, mas também significa
que elas não discriminaram entre as duas doutrinas (as duas doutrinas passam 100% nelas), então não
posso afirmar que são sensíveis a uma regressão futura só com este dado.

## Recomendação sobre como tratar a sonda

**Não usar `up/tests/grill-probe.cjs` como gate binário duro** que bloqueia merge ou fase com base na
taxa agregada de passagem, pelo menos enquanto as asserções `sem abrir o checkpoint` e `destila as
decisões já fixadas` continuarem usando correspondência literal de string. O número que sustenta isso:
3 reprovações em 20 execuções (15%) causadas por variação de vocabulário do modelo, não por regressão de
doutrina, é alto demais para confiar num gate automático que trava sem revisão humana. A recomendação é
tratar a sonda como **informativa**: útil para observar tendência ao longo de várias execuções e para
levantar uma resposta bruta que um humano lê antes de decidir, mas não para reprovar uma fase sozinha com
uma única execução (como quase aconteceu na Prova 5 do plano 004, onde uma única reprovação por
vocabulário quase foi lida como falha estrutural).

A garantia comportamental real ("checkpoint não abre depois da palavra de parada", "vocabulário-chave da
destilação aparece") deve continuar se apoiando na estrutura da doutrina, verificável por inspeção e já
coberta pelo invariante determinístico `up/tests/piso-grill.test.cjs` (que testa a presença do texto da
doutrina em disco, não o comportamento do modelo em runtime, e por isso não sofre do mesmo ruído de
vocabulário). A sonda de comportamento complementa essa garantia estrutural mostrando que o modelo, na
prática, tende a segui-la, mas não deve ser o único fiador de uma regressão futura.

## Self-Check: PASSOU

- 20 arquivos de saída bruta gerados (10 `nova-N.txt`, 10 `antiga-N.txt`), todos com resposta completa do
  modelo e código de saída registrado: ENCONTRADOS em
  `/tmp/claude-0/-home-projects-up-cc/b49aec08-3a69-411a-a58c-0048d6fd5587/scratchpad/grill-amostra/saidas/`
  (diretório de trabalho temporário desta medição, fora do repositório).
- Script de tabulação (`analisar.cjs`) conferido linha a linha contra os arquivos brutos: a tabela por
  asserção deste documento bate com a saída do script.
- Nenhuma execução descartada por timeout ou erro de infraestrutura: as 20 saíram com código 0 ou 1
  (nunca 2), confirmado por leitura de cada arquivo.
- `git status --short` na worktree: limpo antes deste commit (a medição não tocou nenhum arquivo do
  repositório além deste SUMMARY).

## Critérios de sucesso desta medição

- [x] Sonda rodada 10 vezes contra a doutrina nova e 10 vezes contra a doutrina anterior, caso `parada`
- [x] Registro por asserção individual, não só agregado, com as razões de cada reprovação
- [x] Identificação de asserção(ões) que discriminam de forma consistente ou que são ruído: as duas que
  reprovaram mostraram ser ruído de vocabulário, não diferença estrutural; as quatro restantes não
  reprovaram em nenhuma das 20 execuções
- [x] Interpretação honesta sem inflar diferença que os números não sustentam: a taxa bruta (100% vs
  70%) é real, mas a causa não é a diferença estrutural que a fase queria provar
- [x] Recomendação de tratamento da sonda (informativa, não gate duro) com o número que a sustenta (15%
  de reprovação por ruído em 20 execuções)
- [x] Nenhuma execução com falha de infraestrutura foi contada como passou ou reprovou
