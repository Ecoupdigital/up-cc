---
phase: 14-memoria-do-projeto
plan: 006
subsystem: prova-e-regressao
tags: [memoria, prova-ponta-a-ponta, regressao-zero, runtimes, requirements, tdd]
dependency_graph:
  requires:
    - "14-memoria-do-projeto/001 a 005: os quatro submodulos do espaco `memoria` e o glossario interno"
  provides:
    - "up/bin/lib/memoria-e2e.test.cjs: prova ponta a ponta dos criterios 3 e 4 do briefing, contra o binario real de ferramentas"
    - ".plano/REQUIREMENTS.md: MEM-01 a MEM-12 marcados completos, com tabela de rastreabilidade neste resumo"
  affects:
    - "fechamento da fase 14 (esta era a ultima dependencia da onda 3)"
tech_stack:
  added: []
  patterns:
    - "Teste ponta a ponta que executa o binario de verdade via child_process (spawnSync), nunca require direto do submodulo, para provar o caminho que o dono percorre"
key_files:
  created:
    - up/bin/lib/memoria-e2e.test.cjs
  modified:
    - up/bin/up-tools.cjs
    - .plano/REQUIREMENTS.md
decisions:
  - "[Regra 1 + Regra 3] `requirements mark-complete` corrigido: o regex exigia identificador em negrito (`**MEM-01**`), formato que nao existe em nenhum REQUIREMENTS.md deste v2 (todos usam `- [ ] ID: texto`, sem negrito). Sem a correcao, a tarefa 6 nao tinha como cumprir o proprio contrato (marcar via linha de comando, nao por edicao manual). Corrigido para aceitar negrito opcional, com corte negativo contra prefixo de identificador mais longo. Escopo estritamente o necessario para a tarefa 6; os cinco comandos `state *` (mesma familia de bug, apontada no aviso recebido) nao foram tocados, por nao serem exigidos por nenhuma tarefa deste plano."
metrics:
  tasks_completed: 6
  files_changed: 3
  commits: 4
  completed_date: "2026-07-26"
---

# Fase 14 Plano 006: Prova ponta a ponta e regressão zero Summary

Um único caso de teste, encadeado em duas jornadas, exercitando o binário real de ferramentas contra um projeto temporário do zero (nunca `require` de submódulo): a jornada do critério 3 do briefing prova criação preguiçosa e o gate das três condições, a jornada do critério 4 prova que repropor conceito recusado traz a rejeição anterior à tona e que palavra solta não casa. Regressão medida, não presumida, nos quatro runtimes, num projeto com formato de planejamento anterior a este ciclo e na bateria completa dos seis testes do lado UP. Um bug real foi encontrado e corrigido no caminho: `requirements mark-complete` rodava com código de saída zero sem gravar nada, porque o regex nunca casava com o formato de checkbox realmente usado neste v2.

## Tarefas executadas

### Tarefa 1 e 2: `up/bin/lib/memoria-e2e.test.cjs` (jornadas dos critérios 3 e 4)

Escrito em dois commits, um por jornada, no mesmo projeto temporário (a segunda jornada depende do estado que a primeira deixa, de propósito, exatamente como uma sessão real do dono).

**Saída real da execução completa (16 casos, um único arquivo):**
```
$ node up/bin/lib/memoria-e2e.test.cjs

=== Jornada 1 (criterio 3 do briefing): criacao preguicosa, gate e numeracao ===

  ok  - estado inicial: glossario do projeto, decisoes e fora-de-escopo nao existem
  ok  - consulta em base vazia: buscar rejeicao devolve vazio e nao cria nada
  ok  - consulta em base vazia: listar termos devolve vazio e nao cria nada
  ok  - decisao recusada: falta a justificativa de trade-off, nao cria o diretorio
  ok  - decisao recusada: falta a condicao de dificil-reverter, nao cria o diretorio
  ok  - decisao recusada: sem alternativa nenhuma, nao cria o diretorio
  ok  - decisao aceita: criacao completa nasce com numero inicial e as duas alternativas
  ok  - segunda decisao: numero seguinte, distinto e crescente
  ok  - termo do projeto: glossario nasce agora, com a regra de admissao e a regra de higiene
  ok  - aceite da jornada 1: exatamente duas decisoes e um termo no glossario do projeto

=== Jornada 2 (criterio 4 do briefing): reproposta de conceito recusado ===

  ok  - registro da recusa: base de rejeicoes nasce agora
  ok  - reproposta: pedido com as palavras do conceito traz o achado, motivo, data e pergunta pronta
  ok  - pedido diferente: uma unica palavra compartilhada com o conceito nao casa
  ok  - porta fechada: motivo de item ja implementado e recusado e nao cria arquivo
  ok  - porta fechada: motivo de adiamento e recusado e nao cria arquivo
  ok  - aceite da jornada 2: a base de rejeicoes continua com exatamente um arquivo

16 passed, 0 failed
```

**Commits:** `c3ab4c4` (test, jornada 1) e `51f37ea` (test, jornada 2).

**O que cada ponto de recusa provou de verdade** (checagem de existência antes e depois de cada tentativa, não só o código de saída):
- Estado inicial: `.plano/GLOSSARY.md`, `.plano/decisoes/` e `.plano/fora-de-escopo/` ausentes.
- Ler em base vazia (`fora-de-escopo buscar`, `termo listar`) nunca cria o diretório correspondente.
- Faltar trade-off, faltar difícil-de-reverter ou faltar alternativa: as três tentativas saem com código 1, mensagem cita a condição específica que faltou, e `.plano/decisoes/` continua ausente nas três.
- Decisão aceita: nasce com número `0001`, o diretório nasce junto (não antes), e o arquivo grava as duas alternativas com o motivo de cada uma.
- Segunda decisão: número `0002`, distinto e maior que o primeiro.
- Termo do projeto: `GLOSSARY.md` nasce agora (não antes), com a regra de admissão e a regra de higiene no cabeçalho.
- Registrar rejeição: base nasce agora. Repropor com as palavras do conceito traz o achado com título, motivo original, data e a pergunta pronta terminando em interrogação. Pedido que compartilha uma única palavra solta (`"painel"`, entre `"painel de controle do usuário"` e `"painel de métricas em tempo real"`) não produz achado nenhum. As duas portas fechadas (motivo "já está pronto", motivo "por enquanto... fica para depois") recusam com código 1 sem criar arquivo novo.

**Honestidade da prova, conforme o Contexto do plano:** este teste cobre a metade mecânica dos critérios 3 e 4 (arquivo não nasce, gate recusa, numeração cresce, consulta devolve a rejeição anterior). A metade de doutrina (o agente consultar a base antes de explorar a intenção, escrever no instante em vez de acumular) não é testável por execução de binário: está escrita em `up/skills/up-brainstorm/SKILL.md`, seções "Consulta à memória antes de explorar" e "Memória gravada no instante", entregues e verificadas pelo plano 005 (ver 005-SUMMARY.md, provas das tarefas 5 e 6). Este plano não finge cobrir essa metade com o teste automatizado.

### Tarefa 3: regressão dos quatro runtimes

Instalação real (`node up/bin/install.js --all --local`) em diretório temporário, removido ao final. Nenhuma configuração real do dono foi tocada (modo local, dentro do diretório temporário).

**Saída da instalação:**
```
  Installing for Claude Code to ./.claude

  ✓ Installed up/ (112 files)
  ✓ Installed 7 commands
  ✓ Installed 12 agents
  ✓ Installed 3 hooks
  ✓ Configured statusLine, context monitor and session-start hook
  ✓ Installed 4 skills
  ✓ Installed 7 command-skills (Grok Build)
  ✓ Wrote VERSION (2.2.0)
  ✓ Wrote package.json (CommonJS mode)

  Installing for Gemini to ./.gemini

  ✓ Installed up/ (112 files)
  ✓ Installed 7 commands
  ✓ Installed 12 agents
  ✓ Brainstorm-first em GEMINI.md (bootstrap UP)
  ✓ Wrote VERSION (2.2.0)
  ✓ Wrote package.json (CommonJS mode)

  Installing for OpenCode to ./.opencode

  ✓ Installed up/ (112 files)
  ✓ Installed 7 commands to command/
  ✓ Installed 12 agents
  ✓ Brainstorm-first em AGENTS.md (bootstrap UP)
  ✓ Wrote VERSION (2.2.0)

  Installing for Codex CLI to ./.codex

  ✓ Installed up/ (112 files)
  ✓ Installed 7 skills (commands)
  ✓ Installed 12 agents
  ✓ Configured config.toml ([agents] max_depth=4, max_threads=8)
  ✓ Brainstorm-first em AGENTS.md (bootstrap UP)
  ✓ Wrote VERSION (2.2.0)
```

**Contagens conferidas por runtime (não apenas a mensagem do instalador, listagem real do disco):**

| Runtime | Comandos | Agentes | Skills / pastas de skill de comando | Bootstrap | References |
|---|---|---|---|---|---|
| Claude | 7 arquivos em `commands/up/` | 12 | 4 doutrina + 7 comando = 11 dirs em `skills/` | 3 hooks configurados em `settings.json` (statusLine, PostToolUse, SessionStart) | 20, incluindo `glossario-up.md` |
| Gemini | 7 `.toml` em `commands/up/` | 12 convertidos | - | `GEMINI.md` cita `glossario-up.md` | 20, incluindo `glossario-up.md` |
| OpenCode | 7 `.md` achatados com prefixo `up-` em `command/` | 12 convertidos em `agents/` | - | `AGENTS.md` cita `glossario-up.md` | 20, incluindo `glossario-up.md` |
| Codex | 7 pastas em `skills/up-*`, cada uma com `SKILL.md` + `agents/openai.yaml` | 12 convertidos | - | `AGENTS.md` cita `glossario-up.md` | 20, incluindo `glossario-up.md` |

Todas as quatro instalações completaram sem falha. Diretório temporário removido ao final (`rm -rf`); nenhum arquivo do plano foi alterado (tarefa de prova, conforme contrato).

### Tarefa 4: regressão de projeto anterior a este ciclo

Montado um projeto temporário com `.plano/STATE.md`, `.plano/ROADMAP.md`, `.plano/REQUIREMENTS.md` e `.plano/fases/01-fundacao/` no formato anterior a este ciclo (sem `config.json`, sem `GLOSSARY.md`, sem `decisoes/`, sem `fora-de-escopo/`).

**As seis operações de leitura, todas com código de saída zero, nenhuma reclamando de artefato ausente:**
```
state load       -> config_exists: false (informativo, nao erro), state_exists: true, roadmap_exists: true
roadmap analyze  -> 2 fases lidas, progress_percent: 100 (fase 1 completa), sem campo "error"
phase-plan-index 1 -> 1 plano encontrado (01-01), has_summary: true
memoria decisao listar        -> { "registros": [], "diretorio_existe": false }
memoria fora-de-escopo listar -> { "rejeicoes": [], "base_existe": false }
memoria termo listar          -> { "termos": [], "arquivo_existe": false }
```

**Listagem do diretório de planejamento antes e depois (`find | sort`): idêntica, `diff` vazio.**

Repetidas as três consultas de memória no próprio repositório do UP (que tem `.plano/` deste mesmo ciclo, incluindo fases já fechadas), com o mesmo resultado (`diretorio_existe`/`base_existe`/`arquivo_existe`: `false`, listas vazias, código zero):
```
$ git status --short          # antes: vazio
$ node up/bin/up-tools.cjs memoria decisao listar          # {"registros":[],"diretorio_existe":false}
$ node up/bin/up-tools.cjs memoria fora-de-escopo listar    # {"rejeicoes":[],"base_existe":false}
$ node up/bin/up-tools.cjs memoria termo listar             # {"termos":[],"arquivo_existe":false}
$ git status --short          # depois: vazio
```
Nenhum diretório novo apareceu no estado do repositório. Nenhum arquivo alterado (tarefa de prova, conforme contrato).

### Tarefa 5: bateria completa dos testes do lado UP

**Os seis arquivos de teste, em sequência, cada um com código de saída real capturado (não inferido da última linha impressa):**
```
github.test.cjs:            exit=0   10 passed, 0 failed
memoria-decisao.test.cjs:   exit=0   25 passed, 0 failed
memoria-rejeicoes.test.cjs: exit=0   25 passed, 0 failed
memoria-glossario.test.cjs: exit=0   19 passed, 0 failed
memoria-termo.test.cjs:     exit=0   19 passed, 0 failed
memoria-e2e.test.cjs:       exit=0   16 passed, 0 failed
```
Total: 114 casos, 0 falhas. O teste que já existia antes desta fase (`github.test.cjs`) não foi alterado e continua passando.

**Contagem de redefinição sobre as seis pastas padrão, sem recorte, modo estrito:**
```
$ node up/bin/up-tools.cjs memoria glossario check --estrito
{
  "termos_count": 9,
  "arquivos_count": 84,
  "achados": [],
  "total": 0,
  "aprovado": true
}
exit=0
```

**Cobertura de citação, modo estrito:**
```
$ node up/bin/up-tools.cjs memoria glossario citacao --estrito
{
  "com_citacao": 24,
  "sem_citacao": 0,
  "faltando": [],
  "aprovado": true
}
exit=0
```
Nenhum achado pendente para resolver (o plano 004 já havia confirmado zero achados na pasta de skills; esta prova confirma zero achados nas seis pastas inteiras, incluindo commands e templates, que o plano 004 não tinha coberto).

**Guarda da fase 13 (regressão adicional, verificada por conta própria, não pedida explicitamente pela tarefa 5 mas parte do critério de regressão zero do ciclo):**
```
$ node up/bin/lib/perguntas.test.cjs
vermelho: 9 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio, id_esperado_ausente, pontos_abaixo_do_piso, superficies_abaixo_do_piso
perguntas: vermelho OK (4 defeitos detectados), verde OK (21 pontos verificados)
exit=0
```
Sem regressão: vermelho continua detectando os 4 defeitos, verde continua verificando os 21 pontos, exatamente como antes desta fase.

### Tarefa 6: fechamento de rastreabilidade em `.plano/REQUIREMENTS.md`

**Achado no caminho, antes de conseguir marcar qualquer coisa:** rodar `requirements mark-complete` como o comando existia até este ponto devolveu código de saída zero e `{"marked": [], "count": 0}`, com `git diff` vazio no arquivo real. Ou seja, a operação nunca gravou nada, para nenhum requisito, desde que foi escrita: o regex do checkbox exigia `- [ ] **ID**` (identificador em negrito), formato que não existe em nenhuma linha de nenhum `REQUIREMENTS.md` deste v2 (todos usam `- [ ] ID: texto`, sem negrito ao redor do identificador). Isso confirma, ao vivo, o aviso recebido sobre este comando ser um no-op silencioso.

Como a tarefa exige marcar via linha de comando e não por edição manual, e esse é o único caminho declarado pelo contrato da tarefa, corrigi o regex (Regra 1: bug real de correspondência; Regra 3: bloqueava a tarefa atual). Escopo estrito: só a linha do checkbox, dentro da mesma função, aceitando negrito opcional em vez de exigi-lo, com um corte negativo para não casar um identificador como prefixo de outro mais longo.

**Vermelho (antes da correção, contra o arquivo real do repositório):**
```
$ node up/bin/up-tools.cjs requirements mark-complete MEM-01,...,MEM-12
{ "marked": [], "count": 0 }
$ git diff --stat .plano/REQUIREMENTS.md
(vazio)
```

**Verde (depois da correção, primeiro testado contra uma cópia isolada em diretório temporário, só então aplicado ao arquivo real):**
```
$ node up/bin/up-tools.cjs requirements mark-complete MEM-01,...,MEM-12
{ "marked": ["MEM-01", ..., "MEM-12"], "count": 12 }
$ git diff --stat .plano/REQUIREMENTS.md
 .plano/REQUIREMENTS.md | 24 ++++++++++++------------
 1 file changed, 12 insertions(+), 12 deletions(-)
```
O diff mostra exatamente as doze linhas `- [ ]` -> `- [x]` de `MEM-01` a `MEM-12`, nada mais: nenhuma outra linha do arquivo foi tocada (nem a tabela de rastreabilidade do ciclo 2, que continua com a linha agregada "MEM-01 a MEM-12 | Fase 14 | Pendente", porque o contrato da tarefa pede diff mostrando apenas as doze marcações).

Suite completa (114 casos + guarda da fase 13) reexecutada depois da correção: todos os seis arquivos de teste e `perguntas.test.cjs` continuam em `exit=0`, sem nenhuma regressão introduzida pela mudança.

**Commits:** `9aab079` (fix, correção do regex) e `625ff4c` (docs, as doze marcações).

**Escopo da correção, declarado:** só `requirements mark-complete` foi corrigido, porque só ele bloqueava esta tarefa. Os cinco comandos `state *` mencionados no mesmo aviso (mesma família de bug: rodam sem erro, não escrevem no formato real) não foram tocados aqui, por não serem exigidos por nenhuma tarefa deste plano, e continuam registrados como dívida pré-existente (ver `deferred-items.md` da fase 13, itens 4 e 5).

## Tabela de rastreabilidade (requisitos MEM-01 a MEM-12)

| Requisito | Plano que entregou | Evidência |
|---|---|---|
| MEM-01 | 001 | `up/references/glossario-up.md` com os nove verbetes; distribuição confirmada nos quatro runtimes (prova do plano 001, tarefa 5; reconfirmada na tarefa 3 deste plano) |
| MEM-02 | 004 | `memoria-glossario.test.cjs` (19 casos); `memoria glossario check --estrito` = 0 achados nas seis pastas padrão sem recorte (tarefa 5 deste plano) |
| MEM-03 | 002, 003, 005 | criação preguiçosa dos três artefatos (`decisoes/`, `fora-de-escopo/`, `GLOSSARY.md`), provada nos testes de cada plano e reconfirmada nas jornadas 1 e 2 deste plano (estado inicial e consultas em base vazia) |
| MEM-04 | 005 | `up/templates/glossary.md` (regra de admissão + regra de higiene); `memoria-termo.test.cjs`; reconfirmado na jornada 1 (cabeçalho do `GLOSSARY.md` recém-criado) |
| MEM-05 | 002 | gate das três condições em `memoria-decisao.cjs`; `memoria-decisao.test.cjs` (25 casos); reconfirmado na jornada 1 (três recusas + aceite) |
| MEM-06 | 002 | formato do registro (título, contexto, decisão, motivo, alternativas com motivo); reconfirmado na jornada 1 (conteúdo do arquivo lido e conferido) |
| MEM-07 | 002 | numeração por varredura de diretório; reconfirmado na jornada 1 (`0001` -> `0002`, distinto e crescente) |
| MEM-08 | 002 | ação `status` (proposta / aceita / substituída), `memoria-decisao.test.cjs` |
| MEM-09 | 003, 005 | casamento por conceito de domínio (`memoria-rejeicoes.test.cjs`, 25 casos) e doutrina de consulta antes de explorar (`up-brainstorm/SKILL.md`); reconfirmado na jornada 2 (registro e busca) |
| MEM-10 | 003, 005 | `montarPergunta` (semelhança, motivo, recomendação) e doutrina de reproposta; reconfirmado na jornada 2 (achado com motivo original, data e pergunta terminando em interrogação) |
| MEM-11 | 003 | guarda de item já implementado, `memoria-rejeicoes.test.cjs`; reconfirmado na jornada 2 (porta fechada 1) |
| MEM-12 | 003 | guarda de motivo de adiamento, `memoria-rejeicoes.test.cjs`; reconfirmado na jornada 2 (porta fechada 2) |

REG-01, REG-02 e REG-03 não foram marcados: são transversais e fecham apenas no fim do ciclo 2 (fases 13 a 20), conforme o próprio `REQUIREMENTS.md` declara. A evidência coletada nas tarefas 3, 4 e 5 deste plano é o cumprimento do critério de regressão zero **desta fase**, não o fechamento definitivo do requisito.

## Desvios do Plano

### Issues Auto-corrigidos

**1. [Regra 1 - Bug / Regra 3 - Bloqueante] `requirements mark-complete` nunca gravava nada**
- **Encontrado durante:** tarefa 6, ao rodar o comando pela primeira vez contra o `REQUIREMENTS.md` real deste repositório.
- **Issue:** o regex de `cmdRequirementsMarkComplete` (`up/bin/up-tools.cjs`) exigia `- [ ] **ID**` (identificador em negrito); nenhum `REQUIREMENTS.md` deste v2 usa esse formato (todos usam `- [ ] ID: texto`). O comando sempre saía com código zero e `count: 0`, um no-op silencioso.
- **Correção:** negrito tornado opcional no regex, com corte negativo contra prefixo de identificador mais longo. Mudança de uma linha, escopo estrito à função que a tarefa 6 precisa usar.
- **Verificação:** testado primeiro contra uma cópia isolada em diretório temporário (12/12 marcados, nenhuma outra linha tocada), só então aplicado ao arquivo real. Suite completa (114 casos + guarda da fase 13) reexecutada depois, sem regressão.
- **Arquivos modificados:** `up/bin/up-tools.cjs`
- **Commit:** `9aab079`

Nenhum outro desvio. As tarefas 1 a 5 foram executadas exatamente como escritas: mesma estrutura de jornada encadeada, mesmas ferramentas de prova (instalação real, projeto temporário no formato antigo, bateria de testes), sem necessidade de correção automática adicional.

## Issues Adiados (não corrigidos, fora de escopo desta tarefa)

- Os cinco comandos `state advance-plan / update-progress / add-decision / record-session / record-metric` continuam com o mesmo defeito de família (rodam sem erro, não escrevem no formato real de `STATE.md` desta v2). Não corrigidos porque nenhuma tarefa deste plano depende deles; ver `deferred-items.md` da fase 13 para o registro original.
- `init up` e `init auditar` continuam ausentes do despachante de `init` (dívida pré-existente de outra fase, confirmada anteriormente na fase 13). Não verificados nem tocados neste plano, conforme instrução recebida.

## DECISOES ESCALADAS

Nenhuma. A única correção fora do escopo estritamente declarado no frontmatter (`up/bin/up-tools.cjs`) foi tratada como Regra 3 (issue bloqueante da tarefa atual), auto-corrigida sem necessidade de decisão arquitetural: mudança de uma linha de regex, sem alterar contrato, formato de arquivo ou comportamento de nenhum outro comando.

## Self-Check

Arquivos:
- ENCONTRADO: `up/bin/lib/memoria-e2e.test.cjs`
- ENCONTRADO: `up/bin/up-tools.cjs` (diff de 4 linhas, só a correção do regex)
- ENCONTRADO: `.plano/REQUIREMENTS.md` (diff de 12 linhas, só as marcações MEM)

Commits (`git log --oneline` na branch `up/fase-14-memoria-do-projeto`):
- ENCONTRADO: `c3ab4c4` (test, jornada 1)
- ENCONTRADO: `51f37ea` (test, jornada 2)
- ENCONTRADO: `9aab079` (fix, requirements mark-complete)
- ENCONTRADO: `625ff4c` (docs, marcação MEM-01 a MEM-12)

Verificações adicionais:
- `grep -nP '[\x{2013}\x{2014}]'` em `memoria-e2e.test.cjs` e no diff de `up-tools.cjs`: vazio nos dois. Não verifiquei ausência de travessão no repositório inteiro (339 ocorrências pré-existentes em 43 arquivos, fora do escopo desta fase, conforme aviso recebido).
- Nenhum `TBD` introduzido nos arquivos tocados.
- `.plano/STATE.md` e `.plano/ROADMAP.md` não foram tocados por este plano (atualização de estado acontece depois deste resumo, conforme o fluxo de execução).
- Suite completa (114 casos) e guarda da fase 13 (`perguntas.test.cjs`, 4 defeitos no vermelho + 21 pontos no verde) rodados após a correção da tarefa 6: todos em `exit=0`.

## Self-Check: PASSOU

## Critérios de Sucesso do Plano

- [x] Nenhum arquivo de glossário, de decisão ou de rejeição existe antes de haver conteúdo real
- [x] Decisão que falha uma condição não gera registro, e a que passa gera registro numerado com alternativas rejeitadas
- [x] Dois registros em sequência recebem números distintos e crescentes
- [x] Repropor um conceito recusado devolve a rejeição anterior, e compartilhar uma palavra solta não devolve nada
- [x] Item já implementado e adiamento não entram na base
- [x] Os sete comandos e os quatro runtimes continuam funcionando, provado por instalação real
- [x] Projeto com planejamento anterior ao ciclo continua funcionando sem migração e sem ganhar artefato por baixo do pano
- [x] A bateria completa de testes do lado UP termina verde, incluindo o teste que já existia

## FORA DE ESCOPO (conforme o plano, não feito, e não deveria ter sido)

- Corrigido apenas o achado necessário para destravar a própria tarefa 6 (`requirements mark-complete`); nenhuma outra redefinição ou achado precisou de correção, porque a contagem de redefinição (tarefa 5) devolveu zero achados nas seis pastas sem recorte.
- Nenhuma entrada de changelog nem mudança de versão do pacote.
- REG-01, REG-02, REG-03 não marcados como completos: fecham no fim do ciclo, não nesta fase.
- Nenhum glossário, decisão ou rejeição real foi populado neste repositório: os artefatos de prova viveram em diretório temporário e foram removidos ao final (exceto o projeto do formato antigo, também temporário e removido).
- Nenhum arquivo de código dos planos 001 a 005 foi tocado.
- Nenhuma verificação de comportamento de fases futuras (questionamento profundo, fronteiras de teste, grafo de dependência, handoff, auditoria).

---
*Phase: 14-memoria-do-projeto*
*Completed: 2026-07-26*
