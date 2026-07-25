# Fase 13 (formato de pergunta): relatório de prova

Prova coletada pelo plano 005 (onda 3), depois que os planos 001 a 004 entregaram o contrato e as
sete superfícies. Cinco seções: o verificador determinístico (vermelho e verde), o smoke da regra
de fato, o smoke das sete superfícies, a regressão zero e os limites do que esta prova cobre.

## Verificador (vermelho e verde)

Arquivo: `up/bin/lib/perguntas.test.cjs`. Exporta `verificar(raiz)`, que lê
`up/references/questioning.md`, extrai o inventário de 20 identificadores, lê cada arquivo de
superfície declarado e compara nas duas direções (identificador sem tag / tag sem identificador),
além de exigir os três rótulos obrigatórios preenchidos e checar placeholder.

### Bug encontrado e corrigido durante a escrita do próprio verificador (não no produto)

Ao escrever o caso vermelho da tarefa 2, a primeira versão do checador de rótulo usava `\s*` entre o
rótulo e o conteúdo capturado. `\s` inclui quebra de linha, então quando a linha `Recomendo:` ficava
vazia, o `\s*` engolia o `\n` e o grupo de captura pegava emprestado o conteúdo da linha seguinte
(`Porque: ...`), mascarando o defeito. Rodei o vermelho antes do conserto e vi ele falhar do jeito
errado (não reprovava por `rotulo_vazio`):

```
$ node up/bin/lib/perguntas.test.cjs
FALHOU: vermelho: esperava o erro "rotulo_vazio", erros encontrados: [{"tipo":"id_declarado_sem_tag","id":"up.proxima-acao","arquivo":"up/workflows/up.md"},{"tipo":"tag_sem_declaracao","id":"teste.extra","arquivo":"up/workflows/plan.md"}]
EXIT_CODE=1
```

Troquei `\s*` por `[ \t]*` (só espaço e tab, nunca quebra de linha) na regex de rótulo. Depois do
conserto, rodei de novo e o vermelho passou a reprovar pelos três tipos esperados:

```
$ node up/bin/lib/perguntas.test.cjs
vermelho: 3 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio
perguntas: vermelho OK (3 defeitos detectados), verde OK (20 pontos verificados)
$ echo "EXIT_CODE=$?"
EXIT_CODE=0
```

Rodado três vezes seguidas para confirmar determinismo, sem diretório temporário deixado para trás:

```
$ for i in 1 2 3; do node up/bin/lib/perguntas.test.cjs; echo "run $i exit=$?"; done
vermelho: 3 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio
perguntas: vermelho OK (3 defeitos detectados), verde OK (20 pontos verificados)
run 1 exit=0
vermelho: 3 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio
perguntas: vermelho OK (3 defeitos detectados), verde OK (20 pontos verificados)
run 2 exit=0
vermelho: 3 erro(s) detectado(s) -> id_declarado_sem_tag, tag_sem_declaracao, rotulo_vazio
perguntas: vermelho OK (3 defeitos detectados), verde OK (20 pontos verificados)
run 3 exit=0
$ ls /tmp | grep perguntas-fixture || echo "nenhum diretorio temporario deixado para tras"
nenhum diretorio temporario deixado para tras
```

Tarefa 1 (assinatura exportada), verificada isoladamente:

```
$ node -e "const m=require('./up/bin/lib/perguntas.test.cjs');if(typeof m.verificar!=='function')process.exit(1);console.log('task1 verify: OK, verificar is a function')"
task1 verify: OK, verificar is a function
```

O vermelho constrói a fixture copiando a referência e os cinco arquivos de superfície do repositório
real para um diretório temporário, e injeta três defeitos, um por arquivo: apaga a tag de abertura do
primeiro ponto de `up/workflows/up.md` (produz `id_declarado_sem_tag`), esvazia a linha `Recomendo:`
do primeiro ponto de `up/skills/up-brainstorm/SKILL.md` (produz `rotulo_vazio`), e acrescenta uma tag
`teste.extra` não declarada em `up/workflows/plan.md` (produz `tag_sem_declaracao`). O verde roda a
mesma função contra a raiz real do repositório e confirma `ok: true` com 20 pontos.

## Regra de fato

Tarefa fixa usada como teste: **acrescentar uma seção nova ao documento de estado do projeto**. Este
próprio repositório tem planejamento populado (estado, requisitos, roadmap, projeto, mapa do
codebase). Rodei o protocolo de resolução prévia do contrato (seção 2) contra as seis perguntas
candidatas obrigatórias. As seis resolveram por leitura; nenhuma foi emitida como pergunta ao dono.

| # | Pergunta candidata | Destino | Fonte exata |
|---|---------------------|---------|-------------|
| 1 | Qual é a convenção de idioma do texto de interface? | fato resolvido | `CLAUDE.md` (raiz do repo), linha 110: "All UP user-facing text is in Brazilian Portuguese with correct accentuation." Confirmado também no `CLAUDE.md` global do dono: "Idioma padrão: português brasileiro com acentuação correta sempre". |
| 2 | Em que fase o projeto está e o que vem depois? | fato resolvido | `.plano/STATE.md`, seção "Posicao Atual": "Fase: 13 de 20 (em execucao)... proximos 002, 003 e 004 (onda 2)... 005 fecha a fase (onda 3, prova e regressao)" (citação literal, o próprio `STATE.md` está escrito sem acentuação nessa parte). A tabela de progresso do `STATE.md` marcava só o plano 001 como feito; cruzei com `git log --oneline` (fonte 5 do protocolo, histórico do repositório) e confirmei que 002, 003 e 004 já fecharam (commits `74f479b`, `12d7c1a`, `4e4517b`, `64f23c8`, `cd2cc21`, `931fa0d`, mais os três commits de resumo `87c3a61`, `1b46c9b`, `93a4d3c`), e que este plano 005 é o que resta. Duas fontes concordam depois de cruzadas; não virou pergunta. |
| 3 | Existe teste automatizado neste repositório e como se roda? | fato resolvido | `CLAUDE.md`, linha 32: "There is no unified test runner for UP yet... Run a single test file with `node tests/<file>.test.cjs`." Para o lado UP especificamente, o próprio `005-PLAN.md` desta fase documenta a convenção (linhas 57-59): "teste é arquivo `.cjs` com `assert` nativo, sem framework, executado por `node <arquivo>`", com `up/bin/lib/github.test.cjs` como exemplo já existente no repositório. |
| 4 | Qual é a convenção de nome de arquivo e de função? | fato resolvido | `CLAUDE.md`, linha 90: `fases/fase-NN-slug/` com `PLAN-NNN.md`/`SUMMARY-NNN.md` documentados; a leitura direta de `.plano/fases/13-formato-de-pergunta/` mostrou que a convenção realmente praticada hoje é `NNN-PLAN.md`/`NNN-SUMMARY.md` (`001-PLAN.md`, `001-SUMMARY.md`, ...), uma divergência já registrada como observação conhecida (ver seção "Regressão zero" abaixo e `deferred-items.md`, item 3). Nome de função em `.cjs`: `camelCase` com prefixo por domínio (`cmdInitIniciar`, `cmdInitExecutarFase`), confirmado lendo `up/bin/up-tools.cjs`. |
| 5 | Quais decisões já foram travadas pelo dono neste ciclo? | fato resolvido | `.plano/STATE.md`, seção "Decisoes" (bloco de itens após a tabela numerada, marcados por fase): "[Ciclo 2, decisao do dono D7]: o gate e CONJUNTIVO...", "[Ciclo 2, pos-auditoria de planejamento]: grafo do ciclo passa a ter DUAS camadas...", "[Phase 13]: Escalacao de decisao de subagente e em banda...", "[Phase 13]: Grafo em duas camadas: dependencia logica vira aresta, disputa de arquivo vira serializacao por posse." entre outras (citações literais do arquivo, que também está sem acentuação nesses itens). Sete decisões distintas registradas para o ciclo 2, todas lidas direto do arquivo. |
| 6 | Qual é o formato do documento de estado hoje? | fato resolvido | O próprio `.plano/STATE.md` (leitura direta): `# Estado do Projeto` com as seções `## Referencia do Projeto`, `## Posicao Atual` (com barra de progresso ASCII por fase), `## Metricas de Performance` (tabela), `## Contexto Acumulado` (`### Decisoes`, `### TODOs`, `### Bloqueios`, `### Tarefas Rapidas Completadas`) e `## Continuidade de Sessao` (nomes de seção citados literalmente como aparecem no arquivo). |

**Contagem:** 6 de 6 candidatas viraram fato resolvido. 0 subiram como decisão. O aceite da tarefa
(zero perguntas emitidas para as seis) foi cumprido.

## Sete superfícies

Saída real do extrator prescrito na tarefa 4, rodado contra o repositório (comando colado
integralmente, sem edição):

```
$ node -e "
const fs=require('fs');
const t=fs.readFileSync('up/references/questioning.md','utf-8');
const linhas=[...t.matchAll(/^\|\s*([a-z]+\.[a-z0-9-]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm)];
const porSuperficie={};
for(const [,id,sup,arq] of linhas){
  const corpo=(fs.readFileSync(arq,'utf-8').split('<pergunta id=\"'+id+'\">')[1]||'').split('</pergunta>')[0].trim();
  (porSuperficie[sup]=porSuperficie[sup]||[]).push('### '+id+'\n'+corpo);
}
for(const s of Object.keys(porSuperficie)){
  console.log('## '+s+' ('+porSuperficie[s].length+' pontos)');
  console.log(porSuperficie[s].join('\n\n'));
}
"
```

```
## Roteamento da porta única (4 pontos)
### up.proxima-acao
Pergunta: Qual o próximo passo agora?
Recomendo: {acao_primaria}
Porque: {a contagem que produziu a rota, por exemplo "faltam 2 planos sem resumo na fase 5" ou "a fase 5 não tem plano nenhum"}
Opções: {acao_primaria} | {acao_alternativa} | Parar por aqui

### up.decisao-chave
Pergunta: {a decisão de design que muda o resultado desta tarefa}
Recomendo: {a opção que o agente escolheria}
Porque: {a evidência: convenção encontrada no codebase, decisão já registrada no estado, ou o trade-off que decide}
Opções: {recomendada} | {alternativa} | {alternativa}

### up.clone-intake
Pergunta: Com que stack eu recrio este app?
Recomendo: {stack declarada no perfil do dono}
Porque: é a stack que o perfil do dono declara, e nada no app original obriga outra.
Opções: {stack do perfil} | a mesma stack detectada no app original | outra (descreva)

### up.config-editar
Pergunta: Qual configuração você quer mudar?
Recomendo: manter como está
Porque: os valores atuais vieram do perfil do dono e nenhuma execução falhou por causa deles.
Opções: manter como está | modo | granularidade | paralelização

## Brainstorm (2 pontos)
### brainstorm.decisao-chave
Pergunta: {a única decisão de design que muda o resultado desta tarefa}
Recomendo: {a opção que você escolheria}
Porque: {a evidência: convenção do codebase, decisão já registrada, ou o trade-off que decide}
Opções: {recomendada} | {alternativa} | {alternativa}

### brainstorm.checkpoint
Pergunta: Fecho a rodada e sigo, ou faço mais perguntas?
Recomendo: {Fechar e seguir | Mais perguntas}
Porque: {quando fecha: "as decisões que mudam o design já foram respondidas, o que resta é detalhe que o plano resolve". Quando abre: nomear a pergunta em aberto que ainda pode mudar o design}
Opções: {recomendada primeiro} | {a outra}

## Planejamento (3 pontos)
### plan.intake-minimo
Pergunta: {o único dado que falta para planejar}
Recomendo: {o valor inferido dos artefatos existentes, ou o padrão do perfil do dono}
Porque: {o arquivo, a decisão registrada ou o padrão que sustenta o valor}
Opções: {recomendado} | outro (descreva)

### plan.decisoes-escaladas
Pergunta: {Decisao do bloco escalado}. Confirma a recomendação ou corrige?
Recomendo: {Recomendo do bloco escalado}
Porque: {Porque do bloco escalado}
Opções: {Recomendo} | {cada item de Alternativas} | outro (descreva)

### plan.revisor-bloqueou
Pergunta: A revisão do planejamento bloqueou. O que fazer?
Recomendo: Corrigir o item bloqueante e re-revisar
Porque: {o motivo registrado pela revisão}, e é correção dirigida a um item do planejamento, não replanejamento inteiro.
Opções: Corrigir e re-revisar | Aceitar como dívida e seguir para o plano pronto | Parar o planejamento

## Confirmação de início (5 pontos)
### build.runtime-divergente
Pergunta: O plano foi feito para {INTENDED_RUNTIME} e você está em {CURRENT_RUNTIME}. Sigo assim?
Recomendo: Seguir neste runtime
Porque: o plano pronto viaja inteiro no diretório de planejamento e não depende de recurso exclusivo do runtime planejado.
Opções: Seguir neste runtime | Abortar e executar no runtime planejado

### build.plano-incompleto
Pergunta: Falta {lista dos artefatos ausentes} para executar. O que fazer?
Recomendo: Re-planejar localmente
Porque: {o que está faltando} não é recuperável na execução, e o re-planejamento local reaproveita o que já existe em vez de refazer a fase.
Opções: Re-planejar localmente | Abortar

### build.iniciar-execucao
Pergunta: Inicio a execução agora?
Recomendo: Iniciar
Porque: o plano pronto passou na validação, o modo de repositório resolvido é {GITHUB_MODE} e as pendências conhecidas não bloqueiam a primeira onda.
Opções: Iniciar | Mudar o modo antes de iniciar | Não iniciar agora

### build.onda-falhou
Pergunta: A onda {wave} falhou inteira ({WAVE_MISSING} planos sem resumo). Como sigo?
Recomendo: Re-executar a onda uma vez
Porque: {o que o gate encontrou}, e falha de todos os planos ao mesmo tempo aponta para causa de execução (ambiente, limite, interrupção), não para plano errado.
Opções: Re-executar a onda | Re-planejar a fase | Parar aqui

### build.replan-esgotado
Pergunta: O limite de {REPLAN_COUNT} re-planejamentos locais acabou. O que fazer?
Recomendo: Parar e revisar o plano da fase com você
Porque: dois re-planejamentos automáticos já falharam no mesmo ponto, então o problema está no plano e não na execução.
Opções: Parar e revisar comigo | Forçar mais um re-planejamento | Seguir com o plano atual e registrar dívida

## Gate visual pré-merge (2 pontos)
### build.testar-antes-do-merge
Pergunta: Subi o servidor em http://localhost:{PORT} com o código desta fase. Testa antes ou já aterrisso?
Recomendo: Testar primeiro (deixo o servidor no ar)
Porque: a fase mexeu em interface e este projeto exige aprovação visual antes do merge; a verificação automática não cobre julgamento de tela.
Opções: Testar primeiro (deixo o servidor no ar) | Pode mergear | Deixa a branch | Descarta a fase

### build.aprovou-ou-ajusta
Pergunta: Testou. Posso fechar a fase {phase_number}?
Recomendo: Aprovado, pode mergear
Porque: a verificação automática passou e o gate registrou o veredito; o que a automação não cobre é o julgamento da tela, que é seu.
Opções: Aprovado, pode mergear | Achei problema, quero ajustar

## Fechamento de fase (2 pontos)
### build.fechamento-fase
Pergunta: Como aterrisso a fase {phase_number}?
Recomendo: {Abrir PR e mergear, quando há remote e transporte disponível; Merge local, quando não há remote}
Porque: {o transporte resolvido: "há remote e a linha de comando do GitHub está autenticada" ou "não há remote, então o merge local é o único desfecho que fecha a fase"}, e a estratégia configurada é {merge_strategy}.
Opções: {recomendada} | {a outra forma de mergear} | Deixa a branch | Descarta a fase

### build.revisor-bloqueou
Pergunta: A revisão bloqueou a fase {phase_number}. O que fazer?
Recomendo: Corrigir o item bloqueante e re-revisar
Porque: {o motivo registrado pela revisão no log de aprovações}, e é correção dirigida a um item, não retrabalho da fase.
Opções: Corrigir e re-revisar | Aceitar como dívida técnica e seguir | Parar aqui

## Auditoria (2 pontos)
### auditar.relatorio-existente
Pergunta: Já existe relatório de auditoria de {data do relatório}. Sobrescrevo?
Recomendo: {Sobrescrever quando COMMITS_DESDE for maior que zero; Manter o anterior e cancelar quando for zero}
Porque: {"o repositório teve {COMMITS_DESDE} commits desde aquela auditoria, então o relatório antigo já não descreve o código atual" ou "nenhum commit entrou desde aquela auditoria, então rodar de novo gasta e devolve o mesmo"}
Opções: {recomendada} | {a outra}

### auditar.converter-em-fases
Pergunta: Converto os achados aprovados em fases do roadmap?
Recomendo: {Converter os N do quadrante de ganho rápido}
Porque: {o sumário opinativo do relatório aponta esses como maior impacto por menor esforço}.
Opções: Converter os {N} do ganho rápido | Escolher item a item | Não converter agora
```

**Conferência:** sete superfícies distintas (Roteamento da porta única, Brainstorm, Planejamento,
Confirmação de início, Gate visual pré-merge, Fechamento de fase, Auditoria), 4+2+3+5+2+2+2 = 20
pontos no total. Todo bloco tem `Recomendo:` e `Porque:` preenchidos com texto real (parte dele
calculado em runtime via placeholder entre chaves, nunca vazio e nunca reticências).

## Regressão zero

### Sete comandos, quatro runtimes

Instalação em diretório temporário, sem tocar na configuração real do dono (`CLAUDE_CONFIG_DIR`,
`GEMINI_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, `CODEX_HOME` todos redirecionados para um `mktemp -d`):

```
$ TMPUP=$(mktemp -d); CLAUDE_CONFIG_DIR=$TMPUP/claude GEMINI_CONFIG_DIR=$TMPUP/gemini OPENCODE_CONFIG_DIR=$TMPUP/opencode CODEX_HOME=$TMPUP/codex node up/bin/install.js --all --global >/dev/null && test "$(ls $TMPUP/claude/commands/up/*.md | wc -l)" = "7" && test "$(ls $TMPUP/gemini/commands/up/*.toml | wc -l)" = "7" && test "$(ls $TMPUP/opencode/command/up-*.md | wc -l)" = "7" && test "$(ls -d $TMPUP/codex/skills/up-*/SKILL.md | wc -l)" = "7" && test "$(ls -d $TMPUP/claude/skills/*/ | wc -l)" = "11" && for r in claude gemini opencode codex; do grep -q contrato_de_pergunta $TMPUP/$r/up/references/questioning.md || exit 1; done; RESULT=$?; rm -rf $TMPUP; echo "VERIFY_EXIT=$RESULT"
VERIFY_EXIT=0
```

Saída detalhada da mesma instalação (rodada separadamente, mesmos parâmetros):

```
claude comandos:   7
gemini comandos:   7
opencode comandos: 7
codex comandos:    7
claude skills:     11
contrato em claude:    4
contrato em gemini:    4
contrato em opencode:    4
contrato em codex:    4
/tmp/tmp.XXXXXXXXXX/claude/skills/up-brainstorm
/tmp/tmp.XXXXXXXXXX/claude/skills/up-tdd
/tmp/tmp.XXXXXXXXXX/claude/skills/up-verificar-antes-de-concluir
/tmp/tmp.XXXXXXXXXX/claude/skills/usando-up
```

Os quatro runtimes instalam sete comandos cada, o alvo Claude tem as 11 pastas de skill (4 de
doutrina + 7 de comando), e a contagem de `contrato_de_pergunta` bate maior que zero nos quatro
(a mesma referência `up/references/questioning.md` viaja para todos, sem edição por runtime). As
quatro skills de doutrina existem pelo nome no alvo Claude.

### Diferença em `up/bin` e comandos determinísticos

```
$ git diff --name-only $(git merge-base HEAD main)..HEAD -- up/bin | grep -v perguntas.test.cjs
(vazio)
```

`up/bin/lib/perguntas.test.cjs` é o único arquivo novo em `up/bin` nesta fase (ainda não commitado no
momento desta checagem); nenhum executável existente foi tocado.

Comandos determinísticos, rodados um a um:

```
$ for c in "init up" "roadmap analyze" "state-snapshot" "progress bar --raw" "phase-plan-index 3"; do
    node up/bin/up-tools.cjs $c > /dev/null 2>&1 && echo "ok: $c" || echo "FALHOU: $c"
  done
FALHOU: init up
ok: roadmap analyze
ok: state-snapshot
ok: progress bar --raw
ok: phase-plan-index 3
```

**`init up` falha, e não é regressão desta fase.** `node up/bin/up-tools.cjs init up` devolve
`Error: Unknown init workflow: up` porque o despachante de `init` em `up/bin/up-tools.cjs` nunca teve
um caso `up` (só `planejar-fase, executar-fase, novo-projeto, rapido, retomar, operacao-fase,
progresso, verificar-trabalho, melhorias, ideias, iniciar`), apesar de `up/workflows/up.md` chamar
exatamente esse comando no Passo 0. Confirmado pré-existente, anterior a qualquer commit desta fase:

```
$ git show 8d06348c625cc541e9fb9dcd608149bb5035ad43:up/workflows/up.md | grep -n 'up-tools.cjs" init'
35:INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init up)
$ git show 8d06348c625cc541e9fb9dcd608149bb5035ad43:up/bin/up-tools.cjs | grep -n "Unknown init workflow"
218:          error(`Unknown init workflow: ${workflow}\n...`)
$ git diff --name-only 8d06348c625cc541e9fb9dcd608149bb5035ad43..HEAD -- up/bin/up-tools.cjs
(vazio: up-tools.cjs não foi tocado por nenhum plano desta fase)
```

`8d06348` é o commit em que o planejamento do ciclo 2 fechou, o ponto exato de onde a branch desta
fase saiu (`git merge-base HEAD main` devolve o mesmo hash). O bug é mais grave do que os dois já
conhecidos (índice de plano da fase 11, pareamento de resumo da fase 3): ele quebra `/up:up` sem
argumento nenhum, ou seja, a porta única do produto. Não foi corrigido aqui porque corrigir exige
editar `up/bin/up-tools.cjs`, o que violaria o próprio critério de aceite desta tarefa ("a diferença em
`up/bin` fora do verificador é vazia") e o escopo desta fase (contrato de pergunta, não mecânica do
roteador). Registrado com detalhe e recomendação de conserto em `deferred-items.md`, item 1.

**Correção documentada da lista de comandos**, para não afrouxar a asserção escondendo a falha: a
lista oficial de cinco comandos da tarefa 6 inclui `init up`, que falha por um motivo pré-existente e
fora de escopo (acima). Reportei a falha em vez de omiti-la, e separei uma segunda rodada só com os
quatro comandos que são de fato responsabilidade desta fase testar (excluindo `init up` do veredito
de aceite, e não do relatório):

```
$ test -z "$(git diff --name-only $(git merge-base HEAD main)..HEAD -- up/bin | grep -v perguntas.test.cjs)" \
    && for c in "roadmap analyze" "state-snapshot" "progress bar --raw" "phase-plan-index 3"; do
         node up/bin/up-tools.cjs $c >/dev/null || exit 1
       done
$ echo "EXIT_CORRIGIDO=$?"
EXIT_CORRIGIDO=0
```

Duas outras observações conhecidas, já citadas no próprio texto da tarefa 6 e não corrigidas aqui
(requisito PLANO-13, fase 17): o índice de planos não enxerga a convenção de nome usada na fase 11
(não reproduzível nesta worktree, ver `deferred-items.md` item 2) e o pareamento de resumo falha na
fase 3 (reproduzido nesta worktree, ver `deferred-items.md` item 3).

## Limites da prova

O que esta prova demonstra: a instrução do contrato de pergunta existe em fonte única
(`up/references/questioning.md`), é a única versão carregada pelas sete superfícies (nenhuma
reescreve o contrato com as próprias palavras), cobre os vinte pontos de pergunta declarados no
inventário com os três rótulos obrigatórios preenchidos, e sobrevive à instalação nos quatro
runtimes sem alteração. O verificador prova isso de forma determinística e se prova capaz de
reprovar (vermelho) antes de aprovar (verde) na mesma execução, toda vez que roda.

O que esta prova **não** demonstra, porque não é provável por execução de código: que o modelo, numa
conversa real, aplica a doutrina em 100% dos casos. Doutrina é instrução, não código executável; não
existe um `assert` capaz de garantir que um agente, numa sessão futura qualquer, vai carregar a
referência, resolver o protocolo de seis fontes corretamente e nunca emitir pergunta crua. O que se
prova aqui é o alicerce necessário para isso ser possível: a instrução existe, está em um único
lugar, e as superfícies certas carregam ela antes da primeira pergunta. Se um agente real ainda assim
perguntar cru, é falha de obediência à instrução, não falta de instrução, e está fora do que um
verificador estático consegue detectar.

Também fora do que esta prova cobre: comportamento das superfícies fora do inventário fechado
(tarefa avulsa, testes, depuração, reset, onboarding, governança); a fase 16 é responsável pela
honestidade da prova em geral, esta fase só prova o formato de pergunta. E a regressão zero desta
fase foi rodada dentro desta worktree específica (`up/fase-13-formato-de-pergunta`), que tem `main`
local parado em `8d06348` (antes das fases 11 e 12 serem mescladas em `origin/main` por branches
irmãs); a checagem de diferença em `up/bin` e o achado do bug `init up` valem para essa base, não
para o estado mais recente de `origin/main`.
