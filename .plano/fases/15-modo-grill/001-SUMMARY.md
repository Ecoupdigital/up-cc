---
phase: 15-modo-grill
plan: "001"
subsystem: doutrina
tags: [brainstorm, grill, questionamento, memoria, skills]
dependency-graph:
  requires: ["formato de pergunta (fase 13, up/references/questioning.md)", "memoria do projeto (fase 14, memoria termo/decisao/fora-de-escopo)"]
  provides: ["motor único do modo grill (up/skills/up-brainstorm/grill.md)"]
  affects: ["plano 002 (porta na skill de brainstorm)", "plano 003 (propagação do piso novo nas outras cinco superfícies)", "plano 004 (prova)"]
tech-stack:
  added: []
  patterns: ["arquivo companheiro sem frontmatter, carregado sob demanda (mesmo padrão de visual-companion.md)"]
key-files:
  created:
    - "up/skills/up-brainstorm/grill.md"
    - ".plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md"
  modified: []
decisions: []
metrics:
  duration: "1 sessão"
  completed: "2026-07-26"
---

# Fase 15 Plano 001: Motor do grill Summary

Motor único de questionamento profundo do UP escrito como arquivo companheiro da skill de
brainstorm, com entrada automática por classificação, laço de perguntas ilimitadas por ordem de
dependência, as três portas de saída independentes (palavra de parada sem confirmação, checkpoint
a cada três perguntas, auto-convergência declarada) e escrita inline de termo/decisão apontando
para os artefatos de memória da fase 14, sem redefinir nenhum contrato herdado.

## O que foi construído

**`.plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md`** (criado, tarefa 1): tabela de cinco linhas
com o nome literal, o arquivo e o título de seção de origem de cada contrato consumido das fases
13 e 14 (formato de pergunta, regra de fato contra decisão, formato do verbete do glossário,
formato do registro de decisão com a operação determinística de numeração `memoria decisao
proximo-numero`, e a base de rejeições). Nenhum item saiu `AUSENTE`, então o gate de pré-requisito
passou e a fase seguiu. Traz também a linha `SHA_BASE: 89541fcc92613cc9624cc09d8dc34efb17fb0b3b`,
colhida antes de qualquer edição desta fase, para a contraprova do plano 004.

**`up/skills/up-brainstorm/grill.md`** (criado, tarefas 2 a 5, 181 linhas): arquivo companheiro sem
frontmatter, no mesmo padrão de `visual-companion.md`, com as seções:

- `## Quando o grill entra`: tabela de quatro sinais (classificação `simple`/`standard`/`complex`,
  flags e frases manuais de subir e descer) e a regra de precedência do pedido manual sobre a
  classificação automática, nas duas direções, com a regra de empate (sinal de subir e de descer
  juntos sobem, porque subir é reversível e descer não é).
- `## O laço`: sete regras (perguntas ilimitadas, uma por mensagem, formato herdado da fase 13,
  fato contra decisão, teste de "muda o design", numeração visível `[Q1]`/`[Q2]`, múltipla
  escolha).
- `## Ordem por dependência`: árvore de decisão antes da primeira pergunta, formato literal
  `Depende de: Q2 (...)` e `Depende de: nada`, e a regra de pergunta morta quando uma resposta
  anterior invalida uma pergunta na fila.
- `## As três portas de saída`, com as três subseções:
  - Porta 1 (palavra de parada): dez gatilhos literais, efeito sem checkpoint/confirmação, tabela
    de seis frases proibidas, e a regra do ponto em aberto (a recomendação de `[Qn]` é adotada e
    declarada na destilação quando a palavra de parada chega no lugar da resposta).
  - Porta 2 (checkpoint a cada três perguntas): reaproveita o controle de duas opções já existente
    na skill, contando perguntas feitas (não respondidas).
  - Porta 3 (auto-convergência): declaração obrigatória com frase modelo, em vez de apenas parar.
- `## A destilação`: tabela dos quatro pontos de entrada (tier Pequena, tier Média/Grande, modo
  exploração, trilha não código) e o que cada um produz.
- `## Escrita inline`: termo e decisão gravados no mesmo turno, marcadores literais `[gravado:
  glossário -> <termo>]` e `[gravado: decisão <número> -> <título>]`, consulta à base de rejeições
  antes da primeira pergunta, tudo apontando para `CONTRATOS-HERDADOS.md` sem redefinir formato.
- `## O gate continua`: encerrar perguntas não aprova design; estado terminal inalterado.
- `## Red flags do grill`: tabela de sete linhas no mesmo estilo da skill.

## Verificação

Cada tarefa rodou seu `<verify><automated>` e todas passaram: `GATE_OK` (tarefa 1), `SECOES_1_A_3_OK`
(tarefa 2), `PORTAS_OK` (tarefa 3), verificação de escrita inline/red flags com 181 linhas (tarefa
4), `MOTOR_FECHADO_OK` (tarefa 5).

Leitura crítica de fechamento (tarefa 5), item por item:

1. O motor não copia o que é da skill: não há segunda cópia do `HARD-GATE` (confirmado por grep,
   zero ocorrências da string), não há a tabela de tiers completa (o motor cita "Tier Pequena",
   "Tier Média ou Grande" só como rótulos de linha da tabela de destilação, sem repetir a
   descrição de profundidade de cada tier), e não há o texto do modo exploração (só uma linha na
   tabela de destilação).
2. As três redefinições proibidas foram checadas: formato de pergunta, verbete de glossário e
   registro de decisão têm citação nominal a `CONTRATOS-HERDADOS.md` nos três pontos do arquivo
   (`## O laço` item 3, `## Escrita inline` parágrafos 1 e 2), nenhuma definição nova.
3. Zero travessão e zero meia risca (`grep -P '\x{2014}|\x{2013}'` vazio). 181 linhas, dentro do
   teto de 220 e da faixa alvo 150-200.
4. Leitura de ponta a ponta, do lugar de quem nunca viu o UP: as quatro perguntas de fechamento têm
   resposta direta no texto, sem inferência (quando o grill entra sozinho: tabela de `## Quando o
   grill entra`, linha 2; quem vence quando o dono pede o contrário da classificação: parágrafo
   "Regra de precedência"; o que acontece na mensagem seguinte a "chega": parágrafo "Efeito" mais
   a tabela de frases proibidas da Porta 1; onde e quando o termo de domínio é gravado: primeiro
   parágrafo de `## Escrita inline`, "NO MESMO TURNO em que cai, antes da próxima pergunta").

## Desvios do Plano

Nenhum. Plano executado exatamente como escrito. Nenhuma condição de parada da tarefa 1 disparou
(nenhum item saiu `AUSENTE`), então não houve escalação.

**Nota de processo, não desvio**: a tarefa 5 pedia "commit atômico do motor mais o registro de
contratos herdados". Em vez de um commit único ao final, cada tarefa foi commitada
individualmente (protocolo padrão de commit atômico por tarefa: tarefa 1 no commit `f4a316a`,
tarefas 2, 3 e 4 nos commits `cee322d`, `7199034` e `5c6772f`). Ao chegar na tarefa 5, a leitura
crítica não exigiu nenhuma correção pontual, então não houve mudança adicional para commitar. O
resultado final (motor mais registro de contratos, tudo commitado, `git status --porcelain`
limpo) é o mesmo que o plano pedia.

## DECISOES ESCALADAS

Nenhuma.

## Self-Check: PASSOU

- `up/skills/up-brainstorm/grill.md`: ENCONTRADO
- `.plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md`: ENCONTRADO
- commit `f4a316a`: ENCONTRADO
- commit `cee322d`: ENCONTRADO
- commit `7199034`: ENCONTRADO
- commit `5c6772f`: ENCONTRADO

## Para os próximos planos da onda 2

- Plano 002 (porta na skill de brainstorm): a skill passa a citar `grill.md` e a chamar o grill
  automaticamente para Pequena/Média/Grande, delegando o laço, as portas e a destilação a este
  arquivo, sem duplicar nenhuma regra aqui escrita.
- Plano 003 (propagação do piso novo): as seis superfícies vivas que hoje duplicam o piso antigo
  (skill de bootstrap, workflow da porta única em dois pontos mais um item de checklist, comando
  da porta única, bloco de bootstrap do instalador e README) devem apontar para o mapeamento de
  vocabulário e para a tabela `## Quando o grill entra` deste arquivo, em vez de repetir a regra.
- Plano 004 (prova): o `SHA_BASE` em `CONTRATOS-HERDADOS.md` é o ponto de partida para a
  contraprova contra a doutrina anterior ao piso novo.
