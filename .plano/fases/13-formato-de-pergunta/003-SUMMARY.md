---
phase: 13-formato-de-pergunta
plan: 003
subsystem: workflow-build
tags: [pergunta, questioning, build, gate-visual, fechamento-de-fase]
dependency_graph:
  requires:
    - "up/references/questioning.md (contrato canonico, entregue no plano 001)"
  provides:
    - "up/workflows/build.md com as 9 perguntas do motor de execucao marcadas por <pergunta id=...>"
  affects:
    - "up/workflows/build.md"
tech_stack:
  added: []
  patterns:
    - "Tag <pergunta id=\"...\"> com rotulos Pergunta:/Recomendo:/Porque:/Opcoes:, sem substituir a chamada da ferramenta de pergunta do runtime"
key_files:
  created: []
  modified:
    - "up/workflows/build.md"
decisions:
  - "Bloco do contrato de pergunta (Read + regra de fato) inserido logo apos a tabela 'Resumo das flags', que fecha o paragrafo que descreve os dois eixos de GitHub/interacao, e antes do paragrafo FAIL-OPEN universal."
  - "Em V.2 (runtime divergente), a condicao bash de deteccao ficou isolada num bloco proprio; a decisao de perguntar virou prosa + <pergunta>, preservando a mesma condicao logica (INTENDED_RUNTIME != same/any/CURRENT_RUNTIME)."
metrics:
  duration: "~25min"
  completed: "2026-07-25"
---

# Fase 13 Plano 003: Superfícies da execução (confirmação de início, gate visual e fechamento de fase) Summary

Nove pontos de pergunta do motor único de execução (`up/workflows/build.md`) passaram a carregar
`up/references/questioning.md`, declarar em uma linha tudo que resolvem sozinhos (runtime, modo de
repositório, estratégia de merge, presença de interface, veredito do gate) e apresentar cada pergunta com
`Pergunta:`/`Recomendo:`/`Porque:`/`Opções:`, mantendo intocada a mecânica de onda, gate, worktree e merge.

## O que foi feito, por tarefa

**Tarefa 1 (contrato + regra de fato).** Inserido, dentro de `<core_principle>`, logo após a tabela "Resumo
das flags" (fim do bloco que descreve os dois eixos GitHub/interação) e antes do parágrafo "FAIL-OPEN
universal", o bloco `**Contrato de pergunta (obrigatório):**` com a chamada `Read
$HOME/.claude/up/references/questioning.md` e o parágrafo `**O que este workflow resolve sozinho e NUNCA
pergunta:**` cobrindo runtime, modo de repositório, estratégia de merge, presença de interface, contagem de
planos, resumos, ondas, veredito do gate e estado do worktree/branch/issue/PR.
Verificação: `grep -q "references/questioning.md" up/workflows/build.md` → passou.

**Tarefa 2 (confirmação de início, 3 pontos).**
- V.2: a condição bash (`INTENDED_RUNTIME != same/any/CURRENT_RUNTIME`) foi isolada num bloco `bash` só com
  a detecção de `CURRENT_RUNTIME`; o comentário `# AskUserQuestion sim/nao` e o `echo` de aviso viraram
  prosa ("Se `$INTENDED_RUNTIME` for diferente de...") + `<pergunta id="build.runtime-divergente">`.
- V.5: `**Falta algo:** alertar o dono (AskUserQuestion)...` virou `<pergunta id="build.plano-incompleto">`.
- Estágio C: `Confirmar via AskUserQuestion ("Iniciar execucao?")` virou `<pergunta
  id="build.iniciar-execucao">` com a nota de que a recomendação inverte diante de pendência em
  `.plano/PENDING.md`.
Verificação: `grep -q "build.runtime-divergente" ... && grep -q "build.plano-incompleto" ... && grep -q
"build.iniciar-execucao" ...` → passou.

**Tarefa 3 (paradas do laço de execução, 2 pontos).**
- Item 5 do 3.3 (falha sistêmica da onda): `Falha real e sistemica (toda a wave falhou) -> parar e alertar o
  dono (AskUserQuestion)` virou `<pergunta id="build.onda-falhou">` com a nota de que a recomendação
  inverte para "Re-planejar a fase" quando a causa aponta para o plano.
- 3.4 (limite de re-planejamento): o `echo` do bloco bash virou `echo "Max re-plans atingido. Perguntar ao
  dono (build.replan-esgotado)."` e, logo após o bloco bash, foi acrescentado `<pergunta
  id="build.replan-esgotado">`.
Verificação: `grep -q "build.onda-falhou" ... && grep -q "build.replan-esgotado" ...` → passou.

**Tarefa 4 (gate visual pré-merge, 2 pontos, estágio 3.8.0).**
- Passo 2 (`header:`/`question:`/`options:` com 4 opções) virou `<pergunta
  id="build.testar-antes-do-merge">`, mesmas 4 opções na mesma ordem, recomendada primeiro.
- Passo 3 (`header:`/`question:` com 2 opções) virou `<pergunta id="build.aprovou-ou-ajusta">`, mesmas 2
  opções na mesma ordem.
- O texto do laço de ajuste ("Achei problema, quero ajustar": re-spawn do executor, re-rodar verificação e
  gate, voltar pro 3.8.0) permanece intocado logo depois do bloco.
Verificação: `grep -q "build.testar-antes-do-merge" ... && grep -q "build.aprovou-ou-ajusta" ...` → passou.
Conferência adicional: `grep -n "quando eu disser nao, ajusta" up/workflows/build.md` ainda devolve linha
(laço de ajuste intacto).

**Tarefa 5 (fechamento de fase, 2 pontos).**
- Após o parágrafo "Fase SEM UI... GitHub-nativo interativo ainda apresenta o mesmo AskUserQuestion de 4
  opções...", foi acrescentado `<pergunta id="build.fechamento-fase">` com recomendação calculada a partir
  do mapa git e do transporte disponível, seguida da nota "A recomendação é calculada... O mapeamento da
  escolha para a operação de fechamento (3.8.1) não muda."
- Em 3.7 (processamento do veredito), `BLOCK: interromper e alertar o dono (AskUserQuestion)` virou
  `<pergunta id="build.revisor-bloqueou">`.
Verificação: `grep -q "build.fechamento-fase" ... && grep -q "build.revisor-bloqueou" ...` → passou.

**Tarefa 6 (conferência determinística + commit).**
Rodado o script `node -e "..."` da tarefa: saída `9`, seguida dos nove identificadores em ordem alfabética,
sem nenhuma linha `FALTA`:

```
9
build.aprovou-ou-ajusta
build.fechamento-fase
build.iniciar-execucao
build.onda-falhou
build.plano-incompleto
build.replan-esgotado
build.revisor-bloqueou
build.runtime-divergente
build.testar-antes-do-merge
```

`git diff --stat up/workflows/build.md`: `1 file changed, 93 insertions(+), 31 deletions(-)`.

`grep -c "finish-phase\|worktree\|approvals.log" up/workflows/build.md`: **56** depois da edição (commit
`4e4517b`), contra **55** antes (commit-pai `af03c4b`, `git show af03c4b:up/workflows/build.md | grep -c
"finish-phase\|worktree\|approvals.log"` → `55`; `build.md` só foi tocado por `4e4517b` nesta fase, os
demais commits da branch compartilhada são de arquivos disjuntos dos planos 002/004). A diferença de 1 é
esperada e não é mudança de mecânica: vem de uma única linha nova, mandada literalmente pela Tarefa 1 do
próprio plano ("estado do **worktree**, da branch, da issue e do PR (mapa git)"), que descreve em prosa o
que o workflow já resolve sozinho sem perguntar. Conferido via `git diff af03c4b 4e4517b -- up/workflows/build.md
| grep -E "^[+-].*\b(finish-phase|worktree|approvals\.log)\b"`: só essa linha aparece como adição; nenhuma
linha de mecânica (chamada a `finish-phase`, criação/uso de worktree, escrita em `approvals.log`) foi
tocada, removida ou duplicada.

Commit: `4e4517b` `feat(pergunta): superficies do build com recomendacao e regra de fato` (arquivo único:
`up/workflows/build.md`).

## Desvios do Plano

Nenhum desvio de implementação. Um ponto fora de escopo foi identificado e **não corrigido** (fora do
escopo desta tarefa, ver `<deviation_rules>` "LIMITE DE ESCOPO"):

- O arquivo `up/workflows/build.md` já continha, antes deste plano, 6 ocorrências de em-dash/en-dash
  (`—`/`–`) pré-existentes (linhas de propósito/cabeçalho e comentários de código Python), por exemplo
  `Workflow /up:build — Execucao de projeto previamente planejado.`. Nenhuma dessas ocorrências foi tocada
  ou introduzida por este plano (`git diff up/workflows/build.md | grep -E "^\+" | grep -c "—\|–"` → `0`).
  Corrigi-las exigiria reescrever partes do arquivo fora dos nove pontos e dois parágrafos mandados por este
  plano, o que o próprio plano proíbe em "Fora de escopo: Traduzir ou podar o workflow."

## Self-Check

- `up/workflows/build.md` existe e contém as 9 tags `<pergunta id=...>` com os identificadores exatos do
  inventário do contrato: CONFIRMADO (`grep -c '<pergunta id=' up/workflows/build.md` → `9`).
- Commit `4e4517b` existe no histórico da branch `up/fase-13-formato-de-pergunta`: CONFIRMADO
  (`git log --oneline -1 -- up/workflows/build.md` → `4e4517b feat(pergunta): superficies do build com
  recomendacao e regra de fato`).
- Nenhum em-dash/en-dash introduzido pelas minhas edições: CONFIRMADO (`git diff up/workflows/build.md |
  grep -E "^\+" | grep -c "—\|–"` → `0`).
- Nenhum `TBD` no arquivo: CONFIRMADO (`grep -n "TBD" up/workflows/build.md` → vazio).

## Self-Check: PASSOU

## Critérios de aceite do plano

- [x] O workflow carrega a referência do contrato antes da primeira pergunta.
- [x] A lista do que é resolvido sozinho e nunca perguntado está declarada e cobre runtime, modo de
      repositório, estratégia de merge, presença de interface e veredito do gate.
- [x] Os nove pontos de pergunta declarados no inventário existem, com os três rótulos preenchidos.
- [x] As opções de cada pergunta são as mesmas de hoje, com a recomendada em primeiro lugar.
- [x] Quatro perguntas declaram recomendação calculada (início, onda falhou, fechamento e gate visual quando
      não há interface) — verificado em `build.iniciar-execucao`, `build.onda-falhou`,
      `build.fechamento-fase` (o quarto, gate visual quando não há interface, herda a recomendação calculada
      de `build.fechamento-fase`, que é o mesmo AskUserQuestion de 4 opções reaproveitado nesse caso).
- [x] Nenhuma mecânica de onda, gate, worktree, merge ou log de aprovações foi alterada (ver nota da Tarefa
      6 sobre a diferença de contagem 55→56, que é vocabulário, não mecânica).
- [x] Commit atômico de um único arquivo (`4e4517b`, só `up/workflows/build.md`).

## Fora de escopo (herdado do plano)

Mecânica de execução, revisão em dois eixos (fase 18), fronteiras de teste confirmadas (fase 16), ordem de
execução por aresta declarada (fase 17), higiene de contexto/handoff (fase 18), perguntas de outros
workflows (governança, tarefa avulsa, testes, depuração), tradução/poda do workflow.
