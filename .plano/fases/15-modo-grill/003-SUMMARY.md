---
phase: 15-modo-grill
plan: "003"
subsystem: doutrina distribuida (bootstrap de sessao, workflow, comando, instalador, README, guia, reference)
tags: [grill, brainstorm, doutrina, propagacao, bugfix]
dependency-graph:
  requires:
    - "up/skills/up-brainstorm/grill.md (plano 001, motor unico do modo grill)"
  provides:
    - "As cinco superficies fora da skill de brainstorm ensinando o piso novo (trivial=0, resto=grill)"
    - "Invocacao de classify-task documentada no comando up.md corrigida pra rodar de verdade"
  affects:
    - "Bootstrap Claude (usando-up/SKILL.md), roteador up.md, comando up.md, instalador (Gemini/OpenCode/Codex), README publico, guia de uso, reference de questionamento"
tech-stack:
  added: []
  patterns:
    - "Wrapper e nucleo: cada superficie cita `up/skills/up-brainstorm/grill.md` pelo nome, nenhuma copia as regras do laco, das portas ou da escrita inline"
key-files:
  created: []
  modified:
    - up/skills/usando-up/SKILL.md
    - up/workflows/up.md
    - up/commands/up.md
    - up/bin/install.js
    - up/README.md
    - up/references/questioning.md
    - docs/GUIA-DE-USO.md
decisions: []
metrics:
  duration: "~10 minutos (commits entre 15:24 e 15:32 UTC de 2026-07-26)"
  completed: "2026-07-26"
---

# Fase 15 Plano 003: Propagacao do piso novo Summary

Cinco superficies doutrinarias fora da skill de brainstorm (bootstrap de sessao, workflow da porta
unica, comando da porta unica, instalador dos tres runtimes sem hook e README publico) paravam de
ensinar "pequena = 1 pergunta" e passaram a citar o modo grill pelo nome do arquivo do motor, mais a
correcao de um bug real: o comando `up.md` documentava `classify-task "<descricao>"` (texto direto),
que falha, porque o subcomando le caminho de arquivo.

## O que foi feito

**Tarefa 1** - `up/skills/usando-up/SKILL.md` (bootstrap injetado no inicio de toda sessao Claude):
o parenteses do passo zero trocou a escala antiga por "trivial fica em zero pergunta, pequena/media/
grande entram em modo grill"; o paragrafo de profundidade sob controle do usuario ganhou o gatilho
`--grill`/"me grelha"/"vai fundo"/"pergunta mais" (precedencia do pedido manual mesmo em trivial), a
palavra de parada sem confirmacao, e o ponteiro pro motor. Arquivo manteve as mesmas 35 linhas (zero
crescimento, dentro do limite de cinco).

**Tarefa 2** - `up/workflows/up.md`: o principio central foi de tres tiers (0/1/full) pra dois
(`simple`=0, `standard`+`complex`=grill); o passo de profundidade do intake fundiu `standard` e
`complex` no grill, preservando integralmente os cinco blocos do intake antigo (briefing, design
system, credenciais, referencias, restricoes) como conteudo das perguntas do grill em vez de cadencia
propria; o checklist de sucesso passou a cobrar "0 em trivial, grill nos demais" mais a precedencia do
pedido manual. O trecho de bash que grava a descricao em arquivo temporario ficou intocado.

**Tarefa 3** - `up/commands/up.md`: a tabela de tres linhas virou duas (trivial=0, resto=grill com
ponteiro pro motor) e a invocacao da classificacao foi corrigida pra gravar a descricao num arquivo
temporario com frontmatter minimo antes de chamar `classify-task`, copiando a forma que o workflow ja
usa. Essa segunda correcao nao e desvio: e a entrada automatica do grill, e a forma antiga documentada
nunca rodou de verdade.

**Tarefa 4** - `up/bin/install.js` (bloco de bootstrap injetado em GEMINI.md/AGENTS.md pros runtimes
sem hook): a linha de escala do item 1 (BRAINSTORM-FIRST) foi trocada pela formulacao do piso novo
(trivial=0; pequena/media/grande=grill com resposta recomendada; saida por palavra de parada sem
confirmacao, checkpoint a cada 3, ou auto-convergencia; gate do design continua), mantendo a
referencia a SKILL.md e acrescentando a referencia a grill.md com a mesma variavel de prefixo de
caminho. Instalacao real em diretorio temporario confirmou o texto novo em GEMINI.md e idempotencia
(reinstalar nao duplica o bloco).

**Tarefa 5** - `up/README.md`: caminho medio passou a anunciar modo grill (perguntas ilimitadas, uma
por vez, resposta recomendada, ate parada/checkpoint/auto-convergencia); caminho completo cita que o
brainstorm full tambem roda em modo grill; prosa nova explica a troca (perguntar de menos custa mais
caro, saida e barata) e aponta pro motor pelo nome.

**Tarefa 6** - `up/references/questioning.md`: bloco indice "Modo grill" (7 linhas, dentro do limite
de oito) inserido logo abaixo da secao "## 1. Nenhuma pergunta crua" (fase 13), citando-a
explicitamente e apontando pro motor, sem copiar regra do laco, frases proibidas ou tabela de
destilacao.

**Tarefa 7** - varredura final: busca por "pequena...1 pergunta" nas seis superficies do plano voltou
vazia; as cinco superficies deste plano citam `grill` e apontam pro motor pelo nome do arquivo
(`grep -q "grill.md"` passou nas cinco); nenhuma copia frase proibida ou tabela de destilacao; contagem
de travessao/meia-risca nao subiu em nenhum arquivo tocado (conferido via `git diff` linha a linha
contra o SHA anterior a este plano).

## Desvios do Plano

### Issues Auto-corrigidos

**1. [Regra 2 - Funcionalidade critica faltante] Setima superficie viva ensinando o piso antigo, fora
da lista de seis do CONTEXT.md**
- **Encontrado durante:** Tarefa 7 (varredura final, instruida a cobrir o repositorio inteiro, nao so
  as seis superficies nomeadas no CONTEXT.md da fase)
- **Issue:** `docs/GUIA-DE-USO.md` e citado diretamente por `up/README.md` como "detalhes completos"
  e ensinava "Pequena (1 subsistema, 1 escolha de design): 1 pergunta e design em 3 frases" na secao
  de exemplo de projeto novo. Nao estava no `files_modified` do plano nem no inventario do CONTEXT.md,
  mas e uma superficie publica viva (nao historica): deixa-la ensinando o piso antigo mina o proprio
  objetivo da fase.
- **Correcao:** substituida pela formulacao do piso novo (pequena/media/grande entram em modo grill,
  com as tres portas de saida citadas em uma linha cada) e ponteiro pro motor, no mesmo padrao das
  outras seis superficies.
- **Verificado sem colisao:** `docs/GUIA-DE-USO.md` nao aparece no `files_modified` dos planos 002 nem
  004 desta onda/fase.
- **Arquivos modificados:** `docs/GUIA-DE-USO.md`
- **Commit:** d6b440e

Nenhum outro desvio. `docs/redesign/CRITIQUE.md`, `docs/redesign/UP-V2-FINAL.md` e `up/CHANGELOG.md`
tambem citam o piso antigo, mas sao registro historico (design pre-lancamento e changelog),
explicitamente fora de escopo desta fase (o changelog e responsabilidade do plano 004). Registros de
planejamento em `.plano/` (PLAN/SUMMARY de fases 13, 15-002, 15-004, e tarefas rapidas) tambem citam o
piso antigo como parte do proprio texto do plano/prova ou como fotografia do estado anterior; nao sao
superficies vivas de doutrina e nao foram tocados.

## DECISOES ESCALADAS

- Nenhuma.

## Verificacao (automatizada, por tarefa)

| Tarefa | Verificacao | Resultado |
|--------|-------------|-----------|
| 1 | grep grill/chega, ausencia do piso antigo, ausencia de travessao, contagem de linhas | PASSOU (35 linhas, 0 crescimento) |
| 2 | grep grill, ausencia do piso antigo, presenca do mecanismo de arquivo temporario, travessao <= 8 | PASSOU |
| 3 | grep grill, ausencia do piso antigo, ausencia da invocacao quebrada, travessao <= 2 | PASSOU |
| 4 | fonte sem piso antigo + smoke de instalacao real (Gemini) com grill/chega + idempotencia | PASSOU |
| 5 | grep grill, ausencia do piso antigo, ausencia de travessao | PASSOU |
| 6 | grep grill, contagem <= 12, ausencia de travessao | PASSOU |
| 7 | varredura de piso antigo vazia nas cinco superficies + citacao do grill em todas | PASSOU |

## Self-Check: PASSOU

Todos os 7 arquivos tocados confirmados em disco (`up/skills/usando-up/SKILL.md`, `up/workflows/up.md`,
`up/commands/up.md`, `up/bin/install.js`, `up/README.md`, `up/references/questioning.md`,
`docs/GUIA-DE-USO.md`). Todos os 8 commits desta tarefa confirmados em `git log`
(131356c, 07fa7cc, af689ca, d1af082, 66a0e3a, 6e17196, 7283e12, d6b440e). Nenhum item faltando.

## Criterios de sucesso do plano

- [x] As cinco superficies deste plano ensinam o mesmo piso: trivial em zero pergunta, o resto em grill
- [x] O bloco de bootstrap dos runtimes sem hook carrega o piso novo e a palavra de parada, e reinstalar nao duplica o bloco
- [x] A invocacao de classificacao documentada no comando da porta unica roda de verdade
- [x] Nenhuma superficie duplica as regras do motor: todas apontam
- [x] Nenhum arquivo ganhou travessao novo

## Nota de fronteira

`up/skills/up-brainstorm/SKILL.md` nao foi lido nem editado por este plano (territorio exclusivo do
plano 002, que rodou em paralelo na mesma branch/worktree). A conferencia das seis superficies juntas
fica pro plano 004.
