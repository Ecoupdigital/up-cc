---
phase: 15-modo-grill
plan: "004"
subsystem: prova (invariante determinístico + sonda de comportamento)
tags: [grill, brainstorm, prova, teste, regressao, contraprova]
dependency-graph:
  requires:
    - "up/skills/up-brainstorm/grill.md (plano 001, motor único do modo grill)"
    - "up/skills/up-brainstorm/SKILL.md (plano 002, porta do grill)"
    - "sete superfícies propagadas (plano 003) e guarda de perguntas corrigido (plano 005-regressao)"
  provides:
    - "up/tests/piso-grill.test.cjs (invariante de piso e propagação, executável sem rede)"
    - "up/tests/grill-probe.cjs (sonda de comportamento com julgamento determinístico)"
    - ".plano/fases/15-modo-grill/EVIDENCIA.md (prova bruta e veredito consolidado dos 10 requisitos GRILL)"
  affects:
    - "fase 20 (o auto-aborto do planejamento lê o resultado do grill, que esta prova valida)"
tech-stack:
  added: []
  patterns:
    - "sonda de comportamento com juiz determinístico (regex/includes escritos no arquivo, nunca segundo modelo como juiz)"
    - "contraprova via git worktree + SHA_BASE para provar que o invariante discrimina, não só passa"
key-files:
  created:
    - "up/tests/piso-grill.test.cjs"
    - "up/tests/grill-probe.cjs"
    - ".plano/fases/15-modo-grill/EVIDENCIA.md"
    - ".plano/fases/15-modo-grill/deferred-items.md"
  modified:
    - "up/CHANGELOG.md"
    - ".plano/REQUIREMENTS.md"
    - ".plano/ROADMAP.md"
    - ".plano/STATE.md"
decisions:
  - "Sétima superfície viva incluída no invariante de piso (docs/GUIA-DE-USO.md), além das seis nomeadas pelo 004-PLAN.md, porque o plano 003 já a identificou como superfície viva fora do inventário original"
  - "Prompt da sonda entregue por stdin, não como argumento posicional, porque doutrina com front matter YAML (começando com '---') é lida como opção pelo parser do runtime"
  - "Contraprova contra a doutrina anterior registrada como 'não discriminou' em vez de forçar um veredito de reprovação, porque duas execuções deram resultados diferentes"
metrics:
  duration: "~25 minutos"
  completed: "2026-07-26"
---

# Fase 15 Plano 004: Prova do grill Summary

Duas provas reais em vez de duas afirmações: um invariante determinístico (`piso-grill.test.cjs`)
que falha na árvore antiga e passa na atual, e uma sonda de comportamento (`grill-probe.cjs`) que
chama o runtime real do Claude com uma transcrição fabricada e julga a resposta por regra escrita,
sem juiz-modelo, confirmando que a palavra de parada encerra na primeira tentativa sem confirmação.
Regressão dos sete comandos, das onze pastas de skill e dos quatro runtimes conferida com instalação
em `HOME` temporário, nunca na configuração real do dono.

## O que foi construído

**`up/tests/piso-grill.test.cjs`** (tarefa 1, 182 linhas): 8 casos sem framework, sem rede. Confirma
que o motor existe com as três portas, que as cinco palavras de parada e pelo menos duas frases
proibidas estão declaradas, que a skill aponta pro motor, que o piso antigo foi extinto e que o
grill é citado nas **sete** superfícies vivas (a sexta e sétima são a novidade desta prova: o
004-PLAN.md nomeia seis, mas `docs/GUIA-DE-USO.md`, corrigido pelo plano 003 como sétima superfície
fora do inventário original do CONTEXT.md, foi incluído para não deixar essa superfície sem guarda
de regressão), que o gate duro e o estado terminal continuam de pé, e que motor/skill
brainstorm/skill bootstrap/README não ganharam travessão. Rodei o teste na árvore atual (8/8 verde,
saída completa na EVIDENCIA.md) e, sem alterar o repositório de trabalho, copiei o mesmo arquivo
para uma árvore de trabalho temporária no `SHA_BASE` (`89541fcc92613cc9624cc09d8dc34efb17fb0b3b`,
ponto de partida da fase): 8/8 falhou lá, discriminando com clareza. A árvore temporária foi
removida logo em seguida.

**`up/tests/grill-probe.cjs`** (tarefa 2, ~280 linhas): sonda que monta um prompt na ordem definida
pelo plano (doutrina integral, linha de enquadramento, transcrição fabricada do caso, instrução
final pedindo só a próxima mensagem), chama `claude -p --model fable` por execução de arquivo com
lista de argumentos (nunca shell), e julga a resposta por regex/includes escritos no próprio
arquivo. Três casos: `parada` (seis asserções: sem confirmação, sem pergunta nova, sem checkpoint,
destila decisões, pede aprovação, declara ponto em aberto), `entrada` (quatro asserções sobre uma
pergunta automática de tier Pequena) e `precedencia` (duas asserções sobre grill entrando em tarefa
trivial por pedido manual). Código de saída 0/1/2 (passou/reprovou/não executável), nunca lendo "não
rodou" como aprovação.

**`.plano/fases/15-modo-grill/EVIDENCIA.md`** (tarefas 3, 4 e 5): seis provas documentadas com
comando exato, saída bruta e veredito, mais a tabela final com as dez linhas GRILL-01 a GRILL-10.

**`up/CHANGELOG.md`** (tarefa 5): seção `## Nao lancado` nova, com o piso automático, as três
portas de saída e a escrita inline, mais a nota de que o gate de aprovação continua exigido.

## Resultado de cada prova

| Prova | Comando | Veredito |
|-------|---------|----------|
| 1. Invariante de piso | `node up/tests/piso-grill.test.cjs` | PASSOU (8/8 na árvore atual, 8/8 falhou no SHA_BASE) |
| 2. Sonda `parada` (doutrina entregue) | `node up/tests/grill-probe.cjs --caso parada` | PASSOU (6/6) |
| 3. Sonda `entrada` | `node up/tests/grill-probe.cjs --caso entrada` | PASSOU (4/4) |
| 4. Sonda `precedencia` | `node up/tests/grill-probe.cjs --caso precedencia` | PASSOU (2/2) |
| 5. Contraprova (doutrina anterior, caso `parada`) | mesmo comando, `--doutrina <SHA_BASE>` | **NAO DISCRIMINOU** (uma execução reprovou por vocabulário, a outra passou 6/6) |
| 6. Regressão (7 comandos, 4 runtimes, projeto anterior ao ciclo) | instalação em `HOME` temporário + `phase-plan-index`/`roadmap get-phase` | PASSOU (com nota sobre `init up`, ver abaixo) |

Detalhe completo, com saída bruta de cada execução, em `EVIDENCIA.md`.

## Desvios do Plano

### Issues Auto-corrigidos

**1. [Regra 2 - Funcionalidade crítica faltante] Sétima superfície viva incluída no invariante de piso**
- **Encontrado durante:** escrita da tarefa 1.
- **Issue:** o 004-PLAN.md nomeia seis superfícies para os casos 5 e 6, mas o plano 003 já havia
  identificado e corrigido uma sétima (`docs/GUIA-DE-USO.md`, citada por `up/README.md` como
  "detalhes completos") como superfície viva fora do inventário original do CONTEXT.md desta fase.
  Testar só as seis deixaria essa sétima sem guarda de regressão, contradizendo o próprio objetivo
  do invariante ("qualquer superfície viva que volte a ensinar o piso antigo").
- **Correção:** `SUPERFICIES_VIVAS` em `piso-grill.test.cjs` tem sete arquivos, com comentário
  explicando a origem da sétima. `ARQUIVOS_LIMPOS` (caso 8, travessão) manteve os quatro do plano,
  sem incluir `docs/GUIA-DE-USO.md` (que não nasceu limpo nesta fase, apenas teve a frase do piso
  antigo trocada).
- **Arquivos modificados:** `up/tests/piso-grill.test.cjs`.
- **Commit:** `8eb7bd2`.

**2. [Regra 3 - Bloqueante] Prompt da sonda passado por stdin em vez de argumento posicional**
- **Encontrado durante:** tarefa 3, ao rodar a contraprova contra a doutrina anterior à fase.
- **Issue:** a doutrina anterior (`SKILL.md` com front matter YAML) começa com `---`. O parser de
  linha de comando do runtime lê um argumento que começa com hífen como opção, mesmo dentro de uma
  lista de argumentos sem shell, e a chamada falhava com `error: unknown option '---...'`.
- **Correção:** o prompt passou a ser entregue por stdin (`spawnSync(..., { input: prompt })`), sem
  alterar uma letra da doutrina sob teste. Os três casos foram reconfirmados contra a doutrina
  entregue depois da troca (parada 6/6, entrada 4/4, precedência 2/2).
- **Arquivos modificados:** `up/tests/grill-probe.cjs`.
- **Commit:** `1261ead`.

Nenhum outro desvio de Regra 1 a 3. Nenhuma asserção foi afrouxada para fazer caso passar: a
contraprova (prova 5) que não deu o resultado esperado foi registrada como "não discriminou", não
como sucesso nem como reprovação forçada.

### Fora de escopo (registrado, não corrigido)

`node up/bin/up-tools.cjs init up` (e também `init auditar`) falha com "Unknown init workflow",
apesar de `up/workflows/up.md` e `up/workflows/auditar.md` chamarem exatamente esses comandos.
Confirmado idêntico na árvore do `SHA_BASE`: bug pré-existente, já registrado desde a fase 13
(`.plano/fases/13-formato-de-pergunta/deferred-items.md`, item 1), não causado nem agravado por esta
fase. Corrigi-lo exigiria editar `up/bin/up-tools.cjs`, arquivo que nenhum plano desta fase toca e
que não tem relação com o modo grill. Registrado de novo, com o achado adicional sobre `init
auditar`, em `.plano/fases/15-modo-grill/deferred-items.md`.

## DECISOES ESCALADAS

**1. A contraprova da palavra de parada não discriminou de forma confiável.** Rodei a sonda `parada`
duas vezes contra a doutrina anterior à fase, com o mesmo modelo econômico: uma execução reprovou
(por troca de palavra, "baixa direto" em vez de "download", não por diferença estrutural), a outra
passou nas 6 asserções, inclusive na do checkpoint que era o eixo esperado de diferença entre a
doutrina antiga (manda fechar toda rodada com o controle de duas opções) e a nova (palavra de parada
sem checkpoint). Isso não invalida a doutrina nova, cujas sondas passaram de forma consistente
contra ela (6/6, 4/4, 2/2), mas significa que a garantia "a palavra de parada encerra sem
confirmação" depende também do alinhamento geral do modelo usado na sonda, não só do texto da
doutrina. Registrado como "não discriminou" em vez de forçar uma leitura mais forte do que os dados
sustentam, conforme a regra de honestidade da prova. Decisão para o dono: se vale rodar a sonda em
múltiplas amostras (ex.: N execuções e maioria) antes de tratar essa garantia como couraçada, ou se
a garantia estrutural (o texto do checkpoint existe na doutrina antiga e não existe na nova) já é
suficiente. Detalhe completo em `EVIDENCIA.md`, Prova 5.

## Self-Check: PASSOU

- `up/tests/piso-grill.test.cjs`: ENCONTRADO, sintaxe válida, roda 8/8 verde na árvore atual.
- `up/tests/grill-probe.cjs`: ENCONTRADO, sintaxe válida, três casos rodam contra a doutrina entregue.
- `.plano/fases/15-modo-grill/EVIDENCIA.md`: ENCONTRADO, com as 6 provas e a tabela de 10 linhas GRILL.
- `.plano/fases/15-modo-grill/deferred-items.md`: ENCONTRADO.
- `up/CHANGELOG.md`: seção "Nao lancado" presente, cita grill, zero travessão.
- Commits `8eb7bd2`, `20043fa`, `1261ead`, `d8ec240`, `d733232`, `dbefe3d`, `483d0e1`: todos ENCONTRADOS em `git log --oneline`.
- `git status --porcelain`: limpo antes deste commit final.

## Critérios de sucesso do plano

- [x] O invariante de piso passa na árvore atual e falha na árvore do ponto de partida
- [x] A sonda da palavra de parada passa nas seis asserções, e a contraprova contra a doutrina anterior está registrada como veio (registrada como "não discriminou", não como reprovação nem sucesso forçado)
- [x] A sonda de entrada automática mostra uma pergunta por vez, com recomendação e linha de dependência
- [x] A sonda de precedência mostra tarefa trivial entrando em grill sob pedido manual
- [x] Os sete comandos, as onze pastas de skill do alvo Claude e o motor nos quatro runtimes estão conferidos
- [x] As leituras de planejamento anterior ao ciclo continuam devolvendo JSON sem erro, com a exceção documentada de `init up`/`init auditar` (bug pré-existente ao SHA_BASE desta fase, não regressão introduzida por ela; registrado em deferred-items.md e já conhecido desde a fase 13)
- [x] A evidência distingue passou, reprovou e não executada, e nenhuma prova ausente foi registrada como aprovada

## Fechamento da fase 15

Com este plano, a fase 15 (modo grill) está completa: motor único (plano 001), porta na skill de
brainstorm (plano 002), propagação nas demais superfícies (plano 003), correção do guarda de
perguntas da fase 13 (plano 005-regressao, achado de regressão cruzada entre os planos 002 e 003) e
esta prova (plano 004). GRILL-01 a GRILL-10 marcados completos em `REQUIREMENTS.md`. REG-01 a REG-03
seguem transversais e pendentes, a serem reverificados em cada fase até a 20. Próxima fase: 16
(honestidade da prova).
