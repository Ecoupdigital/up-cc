---
phase: 15-modo-grill
plan: "007-REWORK-CRITICO"
subsystem: rework de revisao (resposta a REQUEST_CHANGES)
tags: [grill, brainstorm, rework, revisao, classify-task, honestidade-da-prova, bugfix]
dependency-graph:
  requires:
    - "up/skills/up-brainstorm/grill.md (plano 001, motor)"
    - "up/skills/up-brainstorm/SKILL.md (plano 002, porta)"
    - "up/workflows/up.md e up/commands/up.md (plano 003, propagacao)"
    - "up/tests/grill-probe.cjs e up/tests/piso-grill.test.cjs (plano 004, prova)"
    - "006-AMOSTRA-SUMMARY.md e EVIDENCIA.md (planos 004/006, prova anterior)"
  provides:
    - "Entrada automatica do grill funcional para descricao em prosa (heuristica embutida no motor, sem depender de classify-task)"
    - "Cinco ponteiros do motor apontando para arquivos que embarcam na instalacao"
    - "Sonda de comportamento sem vazamento de desenho entre braco de teste e braco de controle"
    - "Regra de palavra de parada por intencao, nao por substring"
    - "Ponto em aberto cobrindo todo ramo pendente, inclusive parada antes da primeira pergunta"
    - "Gatilhos manuais alinhados entre motor e porta"
  affects:
    - "Toda invocacao de /up com descricao em prosa (o caminho que estava completamente quebrado antes deste rework)"
    - "Leitura da comparacao nova-vs-antiga do plano 006 (retratada, nao mais valida como veredito)"
tech-stack:
  added: []
  patterns:
    - "Heuristica de prosa aplicada direto pelo agente, reservando classify-task da CLI pra arquivo de plano ja escrito"
    - "Prova por execucao real da CLI (RED determinístico) em vez de so roleplay de modelo, quando o defeito e mecanico"
    - "Enquadramento neutro na sonda de comportamento pra nao contaminar o braco de controle com vocabulario da doutrina sob teste"
key-files:
  created:
    - ".plano/fases/15-modo-grill/007-REWORK-CRITICO-SUMMARY.md"
  modified:
    - up/skills/up-brainstorm/grill.md
    - up/skills/up-brainstorm/SKILL.md
    - up/skills/usando-up/SKILL.md
    - up/workflows/up.md
    - up/commands/up.md
    - up/README.md
    - docs/GUIA-DE-USO.md
    - up/tests/grill-probe.cjs
    - .plano/fases/15-modo-grill/006-AMOSTRA-SUMMARY.md
    - .plano/fases/15-modo-grill/EVIDENCIA.md
    - .plano/fases/15-modo-grill/003-SUMMARY.md
decisions:
  - "RV-001 resolvido pela opcao mais barata recomendada pela revisao (parar de classificar prosa pela CLI), nao pela alternativa de ensinar classify-task a pontuar portugues: a heuristica ja existia em prosa no SKILL.md, so precisava virar o metodo primario em vez de fallback"
  - "RV-002 resolvido trocando os 5 ponteiros por alvos que ja embarcam (up/references/questioning.md e SKILL.md), em vez de distribuir CONTRATOS-HERDADOS.md (que e artefato de planejamento da fase, nao doutrina de produto)"
  - "RV-006 nao refez as 20 execucoes da amostra: registrou a invalidacao do metodo (vazamento de desenho) sem produzir conclusao nova, conforme instrucao explicita"
  - "RV-005 alinhado subindo a porta pros 6 gatilhos do motor (em vez de remover os 2 gatilhos extras do motor), preservando a funcionalidade ja documentada"
metrics:
  duration: "~90 minutos (leitura, correcao, prova por execucao real em cada item, 7 commits atomicos)"
  completed: "2026-07-26"
---

# Fase 15, rework 007: resposta critica a REQUEST_CHANGES da revisao

Sete correcoes, cada uma com commit atomico e prova por execucao. As duas criticas (RV-001, RV-002)
derrubavam o objetivo da fase; as demais (RV-003, RV-004, RV-005, RV-006, RV-009) sao importantes ou
menores mas foram atacadas no mesmo passe, como a revisao recomendou. RV-007 e RV-008 NAO foram
tocados: foram encaminhados para a fase 16 (honestidade da prova), por instrucao explicita.

## RV-001 (CRITICA): a entrada automatica do grill nunca disparava

**Achado da revisao**: `classify-task` mede ARQUIVO DE PLANO (frontmatter de lista fechada, contagem
de tarefas, tamanho em bytes, regex em ingles como `refactor`/`auth`/`payment`). Descricao de
brainstorm em prosa portuguesa sempre pontuava `simple | score=0` nele, inclusive descricoes de
arquitetura inteira com schema, API e autenticacao. Como `simple` no workflow e "ZERO perguntas,
anuncia e segue", a feature central da fase (grill entrando automaticamente em Pequena/Media/Grande)
nunca acionava de verdade fora de invocacao manual (`--grill`).

**Correcao**: `up/skills/up-brainstorm/grill.md` (secao "Quando o grill entra"), `up/skills/
up-brainstorm/SKILL.md` (secao "Profundidade escalada por tamanho" e red flag correspondente),
`up/workflows/up.md` (`core_principle` e passo 2.3) e `up/commands/up.md` (bloco de brainstorm
escalado) pararam de rodar `classify-task` sobre a descricao. Passaram a aplicar uma HEURISTICA DE
PROSA direto no texto do dono: toca mais de um arquivo/subsistema, palavra de arquitetura, toca
schema/API/auth. `classify-task` continua correto para o que ele mede (arquivo de plano, depois que
`/up:plan` roda) e nao foi alterado. `up/README.md` e `docs/GUIA-DE-USO.md` (duas das sete
superficies vivas) atualizados para consistencia, trocando "classify-task: TIER" por "heuristica de
prosa: TIER" nos tres caminhos de exemplo.

**Prova por execucao**:

1. **RED com a CLI real** (reproduz o defeito relatado, sem depender de roleplay de modelo):
   ```
   node up/bin/up-tools.cjs classify-task <descricao de refatoracao de pagamentos: schema+API+auth>
   -> simple | haiku | score=0 | reasons=
   node up/bin/up-tools.cjs classify-task <descricao de troca de texto em 1 arquivo>
   -> simple | haiku | score=0 | reasons=
   ```
   As duas descricoes, uma clara candidata a grill e outra clara candidata a trivial, devolvem
   EXATAMENTE o mesmo resultado (`simple`, score 0, zero razoes). Confirma o achado da revisao: a CLI
   nao discrimina prosa, de jeito nenhum.

2. **GREEN com a doutrina corrigida** (`up/tests/grill-probe.cjs`, dois casos novos):
   - `classifica-grill` (descricao de refatoracao de pagamentos com schema+API+auth, sem gatilho
     manual): **2/2** - entra em grill (`[Q1]`/`Depende de:`), sem anuncio de execucao direta.
   - `classifica-trivial` (troca de texto em 1 arquivo, sem decisao de arquitetura): **2/2** - fica em
     zero pergunta, anuncia e executa em uma linha.

3. **Instalacao real**: `up/references/questioning.md`, `SKILL.md` e `grill.md` confirmados presentes
   nos quatro runtimes (`.claude`, `.gemini`, `.config/opencode`, `.codex`) apos `install.js --all
   --global` em `HOME` redirecionado.

4. `piso-grill.test.cjs`: 8/8 verdes, sem regressao.

**Commit**: `8f90e2b`.

## RV-002 (CRITICA): o motor apontava 5 vezes pra um arquivo nao distribuido

**Achado da revisao**: `grill.md` (linhas 34, 37, 142, 146, 158) mandava "ver CONTRATOS-HERDADOS.md",
arquivo que mora em `.plano/fases/15-modo-grill/` e que o instalador nao copia (so `up/` e
distribuido). Instalacao real devolveria zero ocorrencias do arquivo nos quatro runtimes: o ponteiro
morre em producao.

**Correcao**: os cinco ponteiros trocados por alvos que embarcam:
- Formato de pergunta e regra de fato contra decisao -> `up/references/questioning.md`, secoes
  "## 1. Nenhuma pergunta crua" e "## 2. Fato contra decisao".
- Formato do verbete do glossario e do registro de decisao -> `SKILL.md` (mesma pasta), secao
  "Memoria gravada no instante".
- Base de rejeicoes -> `SKILL.md` (mesma pasta), secao "Consulta a memoria antes de explorar".

**Prova por execucao**:
1. `grep -c "CONTRATOS-HERDADOS" up/skills/up-brainstorm/grill.md` -> `0` (era 5 antes da correcao).
2. Instalacao real (`install.js --all --global`, `HOME` redirecionado) confirma `questioning.md`,
   `SKILL.md` e `grill.md` presentes nos quatro runtimes; `grep` no `grill.md` instalado por
   `CONTRATOS-HERDADOS` devolve zero ocorrencias nos quatro.
3. `piso-grill.test.cjs`: 8/8 verdes.

**Commit**: `b205906`.

## RV-006 (importante, metodologia): a sonda contaminava o proprio grupo de controle

**Achado da revisao**: `montarPrompt()` em `grill-probe.cjs` montava a MESMA linha de enquadramento
pros dois bracos da comparacao ("modo grill (perguntas ilimitadas, uma por vez, ate uma das tres
portas de saida)"), injetando o conceito central da doutrina NOVA no braco que deveria ser controle
(a doutrina anterior). A transcricao fabricada do caso `parada` ja usava `[Q1]`, `Depende de:` e
`Recomendo:`, assinatura formal da doutrina nova, funcionando como few-shot mesmo testando o texto
antigo.

**Correcao**: enquadramento neutro ("Voce e o agente do UP. Continue a conversa como o agente do
UP..."), sem citar "modo grill" nem as tres portas. Transcricao do caso `parada` reescrita em
linguagem natural, sem `[Qn]`/`Depende de:`/`Pergunta:`/`Opcoes:` literais. Reescrita a secao
"Interpretacao honesta" de `006-AMOSTRA-SUMMARY.md` e o veredito da "Prova 5" de `EVIDENCIA.md`, com
nota de invalidacao explicita no topo de cada: a comparacao anterior nao isola o efeito do texto da
doutrina, entao a taxa bruta (100% vs 70%) e a leitura de causa (modelo vs doutrina) foram retiradas
como veredito. O achado de ruido de vocabulario em duas assercoes (`sem abrir o checkpoint`,
`destila as decisoes ja fixadas`) continua valendo, por nao depender do vazamento de enquadramento.

**NAO refeitas as 20 execucoes da amostra**, conforme instrucao explicita: o ponto e registrar que o
dado nao sustenta a conclusao original, nao produzir conclusao nova a partir de reexecucao.

**Prova por execucao**: rodei os tres casos originais (`parada`, `entrada`, `precedencia`) contra a
doutrina entregue com o codigo corrigido: **6/6**, **4/4**, **2/2** continuam verdes, confirmando que
a correcao do vazamento nao quebrou o comportamento ja provado nos planos 001-004.
`piso-grill.test.cjs`: 8/8 verdes.

**Commit**: `05ee4ee`.

## RV-003 (importante): palavra de parada disparava por substring, nao por intencao

**Achado da revisao**: `para` e `basta` sao palavra comum do portugues. "Opcao b, para nao
complicar" carrega o gatilho por substring mesmo sendo resposta normal escolhendo uma opcao, nao
pedido de encerrar. A regra "na duvida, PARE" empurrava a favor do falso positivo.

**Correcao**: `grill.md` (Porta 1) agora declara explicitamente que o sinal e a INTENCAO da mensagem
inteira, nunca a palavra isolada dentro de uma resposta que responde outra coisa, com exemplo dos
dois lados (o que E parada: `chega, ja decidi tudo` ou `para` como mensagem inteira; o que NAO e:
`opcao b, para nao complicar` ou `letra c, que ja basta`) e a duvida real (sobre intencao ambigua)
separada explicitamente da presenca de substring numa resposta clara.

**Prova por execucao**: novo caso `falso-positivo-para` em `grill-probe.cjs`, simulando o dono
respondendo "opcao b, para nao complicar" no meio do grill. **3/3** contra a doutrina corrigida
(continua perguntando, nao destila, nao declara ponto em aberto). Nota de honestidade registrada no
commit: a doutrina anterior a este commit tambem passou 3/3 no mesmo caso pontual (o modelo ja
generalizava por bom senso), o que nao prova ausencia do defeito em todo modelo/prompt (LLM e
probabilistico); o que fica garantido de fato e a regra textual explicita, que agora cobre o caso
por escrito. `piso-grill.test.cjs`: 8/8 verdes.

**Commit**: `fb22e0e`.

## RV-004 (importante): parada com fila aberta nao era declarada

**Achado da revisao**: a regra de "ponto em aberto" so cobria a pergunta em voo, mas a arvore de
decisao e montada ANTES da primeira pergunta, entao ha ramos pendentes conhecidos fora da regra. Pior
no caso que o proprio motor autoriza: parada ANTES da primeira pergunta, sem pergunta em voo, onde a
destilacao inventaria o design inteiro sem declarar nada.

**Correcao**: uma frase (como a revisao pediu): "ponto em aberto" passa a cobrir TODO ramo pendente
capaz de mudar o design, nao so a pergunta em voo, incluindo explicitamente o caso limite da parada
antes da primeira pergunta.

**Prova por execucao**: novo caso `parada-antes-da-primeira` em `grill-probe.cjs` (descricao de
cupom de desconto com regra por cliente/produto e acumulacao, parada na mesma mensagem, antes de
qualquer pergunta). Doutrina corrigida: **3/3**, declarou 5 pontos em aberto distintos (tipo de
desconto, limite por cliente, escopo por produto, acumulacao, origem do CRUD). Mesma nota de
honestidade do RV-003: a doutrina anterior tambem passou 3/3 nesse caso pontual (o modelo ja
generalizava o padrao de "aviso + risco assumido" do resto do texto); a garantia de fato vem da regra
textual explicita, nao de uma execucao unica. `piso-grill.test.cjs`: 8/8 verdes.

**Commit**: `c37e334`.

## RV-005 (importante): gatilhos manuais divergentes entre motor e porta

**Achado da revisao**: o motor (`grill.md`) listava seis gatilhos manuais (`--grill`, "me grelha",
"vai fundo", "pergunta mais", "me pergunta", "quero pensar junto"); a porta que decide de verdade a
entrada (`up-brainstorm/SKILL.md`, lida antes do motor) so listava quatro. "me pergunta" e "quero
pensar junto" eram letra morta.

**Correcao**: alinhadas as tres superficies que citam a lista - `grill.md` (ja tinha os 6),
`up-brainstorm/SKILL.md` (frontmatter `description` usado pro skill-matching + tabela de override) e
`usando-up/SKILL.md` (bootstrap condensado) - pros mesmos seis gatilhos. Escolhida a opcao de ativar
os dois gatilhos que estavam mortos, em vez de remover funcionalidade ja documentada no motor.

**Prova por execucao**: `grep` confirma as tres superficies com a lista identica de seis gatilhos,
caractere por caractere. `usando-up/SKILL.md` manteve as mesmas 35 linhas (edicao inline, zero
crescimento). `piso-grill.test.cjs`: 8/8 verdes.

**Commit**: `64cf4d0`.

## RV-009 (menor): travessoes em 003-SUMMARY.md

**Achado da revisao**: sete ocorrencias de travessao (caractere U+2014, logo apos `**Tarefa N**`) em
`003-SUMMARY.md`, contra a regra de zero travessao/meia-risca do repositorio.

**Correcao**: as sete trocadas por hifen normal (logo apos `**Tarefa N**`).

**Prova por execucao**: `grep -c` pela expressao regular que casa travessao (U+2014) ou meia-risca
(U+2013) contra `.plano/fases/15-modo-grill/003-SUMMARY.md` devolve `0` (era 7 antes).
`piso-grill.test.cjs`: 8/8 verdes.

**Commit**: `c92e938`.

## RV-007 e RV-008: NAO atacados

Por instrucao explicita, cobertura da rede estatica e forca do invariante (RV-007, RV-008) foram
encaminhados para a fase 16 (honestidade da prova) e nao foram tocados neste rework.

## Varredura final consolidada

Todas as sete sondas de `grill-probe.cjs` rodadas em sequencia contra a doutrina final (apos os sete
commits), no mesmo runtime economico (`claude -p --model fable`):

| Caso | Assercoes | Resultado |
|------|-----------|-----------|
| `parada` | 6/6 | PASSOU |
| `entrada` | 4/4 | PASSOU |
| `precedencia` | 2/2 | PASSOU |
| `classifica-grill` | 2/2 | PASSOU |
| `classifica-trivial` | 2/2 | PASSOU |
| `falso-positivo-para` | 3/3 | PASSOU |
| `parada-antes-da-primeira` | 3/3 | PASSOU |

Total: **22/22 assercoes passaram**. `up/tests/piso-grill.test.cjs`: **8/8 verdes** apos cada um dos
sete commits (rodado repetidamente ao longo do rework, nao so no final).

## Nota de honestidade sobre o metodo de prova

Duas classes de defeito precisaram de prova diferente, e isso ficou registrado explicitamente em
cada item:

1. **Defeito mecanico/deterministico** (RV-001): provado por execucao REAL da CLI (`classify-task`),
   nao por roleplay de modelo. Uma tentativa inicial de reproduzir o bug via `grill-probe.cjs`
   (pedindo ao modelo pra simular ter rodado `classify-task`) NAO reproduziu o defeito, porque o
   modelo raciocina por conta propria em vez de invocar a ferramenta de verdade dentro do
   roleplay. Isso esta documentado no proprio processo: a prova valida so veio ao rodar a CLI real.
2. **Ambiguidade textual de doutrina** (RV-003, RV-004): a natureza probabilistica de LLM significa
   que uma unica execucao passando NAO prova ausencia do defeito (o modelo pode acertar por bom senso
   mesmo com texto ambiguo). Registrado explicitamente em cada commit: a garantia de fato vem da regra
   textual explicita que a correcao acrescentou, verificavel por inspecao determinística
   (`piso-grill.test.cjs`), nao da execucao unica que passou.

## Self-Check: PASSOU

- Sete commits confirmados em `git log --oneline`: `8f90e2b`, `b205906`, `05ee4ee`, `fb22e0e`,
  `c37e334`, `64cf4d0`, `c92e938`.
- `up/tests/piso-grill.test.cjs`: 8/8 verdes na arvore final (rodado apos o ultimo commit).
- `up/tests/grill-probe.cjs`: 22/22 assercoes passaram na varredura final consolidada (7 casos).
- `grep -c "CONTRATOS-HERDADOS" up/skills/up-brainstorm/grill.md` -> `0`.
- Contagem de travessao/meia-risca em `.plano/fases/15-modo-grill/003-SUMMARY.md` -> `0`.
- Instalacao real (`install.js --all --global`, HOME redirecionado, variaveis de runtime
  neutralizadas) confirmou `questioning.md` presente nos quatro runtimes, sem afetar a configuracao
  real do dono.
- `git status --short`: limpo apos o ultimo commit (conferido antes de escrever este SUMMARY).

## Criterios de aceite do rework

- [x] RV-001: prova por execucao que descricao com schema+API+auth entra em modo grill
  (`classifica-grill`, 2/2) e que tarefa de 1 arquivo sem decisao de arquitetura continua em zero
  pergunta (`classifica-trivial`, 2/2), mais o RED da CLI real confirmando o defeito relatado.
- [x] RV-002: os cinco ponteiros trocados, confirmados presentes nos quatro runtimes instalados.
- [x] RV-006: enquadramento neutro e transcricao sem marcadores da doutrina nova; secoes de
  interpretacao reescritas com nota de invalidacao explicita; 20 execucoes NAO refeitas.
- [x] RV-003: regra de intencao (nao substring) escrita no motor, com exemplo dos dois lados.
- [x] RV-004: ponto em aberto cobrindo todo ramo pendente, incluindo parada antes da primeira
  pergunta.
- [x] RV-005: gatilhos manuais alinhados entre motor e porta (6 em ambos).
- [x] RV-009: zero travessao em `003-SUMMARY.md`.
- [x] RV-007 e RV-008: intencionalmente nao tocados (fase 16).
- [x] Commits atomicos, um por item (sete commits, um por RV).
- [x] Zero em-dash/en-dash introduzido pelo rework (conferido em todos os arquivos tocados).
- [x] Sem TBD em nenhum arquivo editado.
