---
phase: 13-formato-de-pergunta
plan: 002
subsystem: superficies-de-entrada
tags: [contrato-de-pergunta, up-router, up-brainstorm, questioning]
dependency_graph:
  requires:
    - up/references/questioning.md (contrato entregue pelo plano 001, bloco <contrato_de_pergunta>)
  provides:
    - "up/workflows/up.md carregando o contrato e emitindo 4 pontos de pergunta marcados"
    - "up/skills/up-brainstorm/SKILL.md carregando o contrato e emitindo 2 pontos de pergunta marcados"
    - "up/skills/usando-up/SKILL.md anunciando a regra no bootstrap de sessao"
  affects:
    - "up/commands/up.md (texto de documentacao dos tiers, sem mudanca de comportamento)"
tech_stack:
  added: []
  patterns:
    - "Tag <pergunta id=\"...\"> ... </pergunta> como marcador grep-avel de ponto de pergunta, inline no markdown, sem fence adicional"
key_files:
  created: []
  modified:
    - up/workflows/up.md
    - up/skills/up-brainstorm/SKILL.md
    - up/skills/usando-up/SKILL.md
    - up/commands/up.md
decisions:
  - "O bloco antigo de 'Proximo' no Passo 1 (que era so template de texto plano dentro de um fence) foi convertido para a tag <pergunta id=\"up.proxima-acao\">, removendo o fence: a tag agora e a representacao formal, consistente com os outros 3 pontos de pergunta do arquivo, nenhum dos quais estava fenced."
  - "Na tarefa 5, a linha do tier Media/Grande em up/commands/up.md manteve a grafia sem acento ja usada no arquivo (aprovacao, secao, recomendacao) para nao introduzir inconsistencia dentro da mesma frase, seguindo o texto literal fornecido pelo plano."
metrics:
  duration_minutes: null
  tasks_completed: 6
  files_touched: 4
  completed_at: "2026-07-25"
---

# Fase 13 Plano 002: Superficies de entrada (roteamento da porta unica e brainstorm) Summary

Roteamento da porta unica (`up/workflows/up.md`) e a skill de brainstorm (`up/skills/up-brainstorm/SKILL.md`)
agora carregam `up/references/questioning.md` antes de perguntar, rodam o protocolo de resolucao previa
(fato descobrivel vira anuncio, nao pergunta) e emitem os seus seis pontos de pergunta no formato do contrato
(`Pergunta:` / `Recomendo:` / `Porque:` / `Opcoes:`), com identificador estavel herdado do inventario do
plano 001. O bootstrap de sessao (`up/skills/usando-up/SKILL.md`) anuncia a regra em uma linha, e o texto do
comando (`up/commands/up.md`) parou de descrever pergunta sem recomendacao.

## Tarefas executadas

### Tarefa 1: Contrato carregado + protocolo de resolucao previa em `up/workflows/up.md`

- Acrescentado ao `<core_principle>` o paragrafo que manda carregar `Read $HOME/.claude/up/references/questioning.md`
  e aplicar o `<contrato_de_pergunta>` antes da primeira pergunta de qualquer rota.
- Criado o passo `### 2.3.0 Protocolo de resolucao previa`, imediatamente antes de `### 2.3 Classificar a
  tarefa`, com as seis fontes na ordem do contrato (perfil do dono; artefatos de planejamento; mapa do
  codebase; leitura/busca no codigo; historico do repositorio; configuracao e manifesto) e a proibicao
  explicita de perguntar o que o planejamento ja responde.

**Verificacao (rodada e confirmada):**
```
$ grep -q "references/questioning.md" up/workflows/up.md && grep -q "2.3.0" up/workflows/up.md
(sem output = ambos os greps casaram; exit 0)
```

### Tarefa 2: Quatro pontos de pergunta marcados em `up/workflows/up.md`

- Passo 1 (`up.proxima-acao`): o bloco de texto plano fenced que listava `/up:build`/`/up:plan` virou a tag
  `<pergunta id="up.proxima-acao">`, com `Porque:` citando a contagem (nao o nome da regra), seguida da
  explicacao de que a tabela de roteamento continua calculando `{acao_primaria}` e que o atalho de retomada
  rapida continua pulando a apresentacao.
- Passo 2.3, tier standard/pequena (`up.decisao-chave`): a linha unica virou a tag com a decisao-chave da
  tarefa classificada como pequena.
- Passo 4.1, intake do clone (`up.clone-intake`): a stack do clone virou pergunta explicita com recomendacao
  vinda do perfil do dono; credenciais deixaram de ser perguntadas de saida (so apos esbarrar na parede de
  autenticacao).
- Passo 6, subverbo config (`up.config-editar`): a tag foi inserida logo apos a tabela de operacoes do config.

**Verificacao (rodada e confirmada):**
```
$ test "$(grep -c '<pergunta id=' up/workflows/up.md)" = "4"
(exit 0)
$ grep -n '<pergunta id=' up/workflows/up.md
139:<pergunta id="up.proxima-acao">
226:<pergunta id="up.decisao-chave">
388:<pergunta id="up.clone-intake">
468:<pergunta id="up.config-editar">
```

### Tarefa 3: Contrato carregado e regras declaradas em `up/skills/up-brainstorm/SKILL.md`

- Inserida a secao `## Antes de perguntar (contrato de pergunta)` logo apos o `<HARD-GATE>` e o paragrafo de
  anti-padrao, com a chamada `Read $HOME/.claude/up/references/questioning.md` e as duas regras numeradas
  (nenhuma pergunta crua; fato contra decisao), aplicaveis tambem ao brainstorm full e ao modo exploracao
  (que nao tem texto literal de pergunta nesta skill).

**Verificacao (rodada e confirmada):**
```
$ grep -q "references/questioning.md" up/skills/up-brainstorm/SKILL.md && test "$(wc -l < up/skills/up-brainstorm/SKILL.md)" -lt 160
(exit 0; arquivo com 126 linhas apos a tarefa 3, 142 apos a tarefa 4 -- ainda abaixo de 160)
```

### Tarefa 4: Dois pontos de pergunta marcados em `up/skills/up-brainstorm/SKILL.md`

- Tabela de profundidade, tier Pequena: celula reescrita apontando para `brainstorm.decisao-chave`; logo apos
  a tabela entrou a tag `<pergunta id="brainstorm.decisao-chave">`.
- Secao `## Checkpoint de fechamento`: as duas opcoes (Fechar e seguir / Mais perguntas), antes descritas como
  bullets fixos, viraram a tag `<pergunta id="brainstorm.checkpoint">` com `Recomendo:`/`Porque:` calculados
  (nao fixos): se ainda existe pergunta capaz de mudar o design, recomenda "Mais perguntas" e nomeia qual;
  senao, recomenda "Fechar e seguir". As duas opcoes originais continuam existindo na linha `Opcoes:`.

**Verificacao (rodada e confirmada):**
```
$ test "$(grep -c '<pergunta id=' up/skills/up-brainstorm/SKILL.md)" = "2"
(exit 0)
$ grep -n '<pergunta id=' up/skills/up-brainstorm/SKILL.md
57:<pergunta id="brainstorm.decisao-chave">
87:<pergunta id="brainstorm.checkpoint">
```

### Tarefa 5: Coerencia no bootstrap de sessao e no texto do comando

- `up/skills/usando-up/SKILL.md`: acrescentada uma unica linha logo apos o paragrafo do "Passo ZERO de todo
  trabalho", anunciando que nenhuma pergunta ao dono sai crua, que fato descobrivel se descobre (nao se
  pergunta) e que escolha de arquitetura/trade-off sempre sobe com recomendacao.
- `up/commands/up.md`: as duas linhas de tier na lista de profundidade do brainstorm passaram a mencionar
  recomendacao e motivo (tier Pequena: "1 pergunta com recomendacao e motivo"; tier Media/Grande: "brainstorm
  full com aprovacao por secao, toda pergunta com recomendacao e motivo"). Nenhum outro trecho dos dois
  arquivos foi tocado.

**Verificacao (rodada e confirmada):**
```
$ grep -qi "recomenda" up/skills/usando-up/SKILL.md && grep -qi "recomenda" up/commands/up.md
(exit 0)
$ git diff --stat -- up/skills/usando-up/SKILL.md up/commands/up.md
 up/commands/up.md            | 4 ++--
 up/skills/usando-up/SKILL.md | 2 ++
 2 files changed, 4 insertions(+), 2 deletions(-)
```

### Tarefa 6: Conferencia deterministica e commit

Rodado da raiz do repositorio (identico ao script do plano):

```
$ node -e "... (script de conferencia dos 6 identificadores e dos 3 rotulos) ..."
brainstorm.checkpoint,brainstorm.decisao-chave,up.clone-intake,up.config-editar,up.decisao-chave,up.proxima-acao
```

Sem nenhuma linha `FALTA`, e a lista bate exatamente com a esperada pelo plano.

Comando de verificacao automatizada da tarefa (`process.exit(f?1:0)`):
```
$ node -e "..."; echo "exit=$?"
exit=0
```

Dois commits atomicos:

```
74f479b feat(pergunta): roteamento da porta unica com recomendacao e regra de fato
  up/commands/up.md  |  4 +--
  up/workflows/up.md | 77 +++++++++++++++++++++++++++++++++++++++--------------
  2 files changed, 60 insertions(+), 21 deletions(-)

12d7c1a feat(pergunta): brainstorm com recomendacao e regra de fato
  up/skills/up-brainstorm/SKILL.md | 46 ++++++++++++++++++++++++++++++++++------
  up/skills/usando-up/SKILL.md     |  2 ++
  2 files changed, 41 insertions(+), 7 deletions(-)
```

## Verificacao de aceite do plano (bloco `<verification>`)

```
$ grep -c "<pergunta id=" up/workflows/up.md                            # esperado: 4
4
$ grep -c "<pergunta id=" up/skills/up-brainstorm/SKILL.md              # esperado: 2
2
$ grep -c "references/questioning.md" up/workflows/up.md                # esperado: maior que 0
1
$ grep -c "references/questioning.md" up/skills/up-brainstorm/SKILL.md  # esperado: maior que 0
1
$ grep -c "recomenda" up/skills/usando-up/SKILL.md                      # esperado: maior que 0
1
```

Todas as saidas batem com o esperado.

## Desvios do Plano

Nenhum desvio de Regra 1/2/3 (nenhum bug, funcionalidade critica faltante ou bloqueio encontrado durante a
execucao). Duas decisoes de redacao registradas (nao sao desvios de escopo, so escolhas de como aplicar o
texto literal do plano dentro do arquivo existente):

1. **Remocao do fence no Passo 1 do roteamento.** O bloco antigo de "Proximo" estava dentro de um code fence
   (```...```) porque era um template de texto plano pronto pra impressao. A tag `<pergunta id="up.proxima-acao">`
   substituiu esse bloco sem manter o fence, porque a tag em si e a nova representacao formal e grep-avel, e
   nenhum dos outros 3 pontos de pergunta do arquivo estava fenced (consistencia com o padrao ja estabelecido
   pelos pontos `up.decisao-chave`, `up.clone-intake` e `up.config-editar`, todos inline no texto do workflow).
2. **Grafia sem acento na segunda linha de tier em `up/commands/up.md`.** O texto literal fornecido pelo plano
   para o tier Media/Grande usa "aprovacao", "secao" e "recomendacao" sem acento, e foi copiado exatamente
   como dado (o arquivo `up/commands/up.md`, assim como `up/workflows/up.md` e as duas skills tocadas, e
   escrito nesta base de codigo inteiramente em ASCII sem acentuacao -- verificado antes de editar, 0
   ocorrencias de caracteres acentuados nos 4 arquivos antes desta mudanca). O texto novo inserido nos blocos
   `<pergunta>` (fornecido acentuado pelo proprio contrato do plano 001) foi mantido acentuado, exatamente como
   escrito no plano; nenhuma reacentuacao retroativa do texto pre-existente desses arquivos foi feita, por
   estar fora do escopo das tarefas 1-5 (nenhuma delas pede varredura geral de acentuacao, e o plano nao lista
   isso como `files_modified` alem das linhas especificas indicadas).

## Auth gates

Nenhum.

## Fora de escopo (nao tocado, conforme o plano)

- Modo grill, perguntas ilimitadas, palavra de parada e auto-convergencia (fase 15).
- Glossario ou registro de decisao durante a conversa (fase 14, artefatos inexistentes).
- Traducao, poda ou reorganizacao geral da skill de brainstorm alem das duas secoes descritas.
- Superficies fora do inventario desta wave (tarefa avulsa, testes, depuracao, reset, onboarding).
- Instalador e os 4 runtimes (a referencia ja viaja com o pacote).
- Formato novo de aresta de dependencia entre planos (fase 17).
- Planos 003 e 004 desta mesma wave (arquivos disjuntos, rodando em paralelo).
- A prova narrada de uma rodada de brainstorm real (parte (b) do "Tipo de prova exigida") e coletada pelo
  plano 005, que consolida a prova da fase; nao e responsabilidade deste plano.

## Self-Check: PASSOU

Arquivos modificados existem e foram commitados:
```
$ [ -f up/workflows/up.md ] && echo ENCONTRADO || echo FALTANDO
ENCONTRADO
$ [ -f up/skills/up-brainstorm/SKILL.md ] && echo ENCONTRADO || echo FALTANDO
ENCONTRADO
$ [ -f up/skills/usando-up/SKILL.md ] && echo ENCONTRADO || echo FALTANDO
ENCONTRADO
$ [ -f up/commands/up.md ] && echo ENCONTRADO || echo FALTANDO
ENCONTRADO
```

Commits existem no historico da branch:
```
$ git log --oneline --all | grep -q "74f479b" && echo ENCONTRADO || echo FALTANDO
ENCONTRADO
$ git log --oneline --all | grep -q "12d7c1a" && echo ENCONTRADO || echo FALTANDO
ENCONTRADO
```

Nenhum item faltando.

## Nota de coordenacao da wave

Por instrucao explicita de execucao desta wave, **este plano NAO editou `.plano/STATE.md` nem
`.plano/ROADMAP.md`** (os tres executores da onda 2 escreveriam no mesmo arquivo). Esse bookkeeping fica a
cargo do orquestrador apos a wave inteira terminar. So foram commitados os arquivos deste plano
(`up/workflows/up.md`, `up/commands/up.md`, `up/skills/up-brainstorm/SKILL.md`,
`up/skills/usando-up/SKILL.md`) mais este `002-SUMMARY.md`.
