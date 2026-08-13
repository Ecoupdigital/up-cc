# Estado do Projeto

## Referencia do Projeto

**Projeto**: UP (up-cc)
**Valor Central**: Pipeline autônomo confiável exige perguntar o suficiente antes de agir, lembrar do que já foi decidido e recusado, e provar o que afirma
**Foco Atual**: Ciclo 2 estruturado (fases 13 a 20). Fase 15 (modo grill) completa: os 4 planos das 3 ondas fecharam, com invariante determinístico, sonda de comportamento e regressão zero. Próxima fase: 16 (honestidade da prova)

## Posicao Atual

**Fase**: 16 de 20 (próxima; fase 15 completa)
**Plano**: fase 15 fechada com os 4 planos das 3 ondas (mais 1 correção de regressão fora de onda): 001 (motor único do grill), 002 (porta na skill de brainstorm), 003 (propagação do piso novo nas outras superfícies, em paralelo com o 002), 005-regressao (correção do guarda de perguntas da fase 13, que ficou vermelho porque os planos 002 e 003 removeram duas tags em paralelo sem atualizar o inventário), 004 (prova: invariante de piso, sonda de comportamento e regressão)
**Status**: Fase 15 completa e commitada. Plano 004 escreveu `up/tests/piso-grill.test.cjs` (invariante de piso e propagação, 8 casos, verde na árvore atual e vermelho na árvore do ponto de partida) e `up/tests/grill-probe.cjs` (sonda de comportamento com julgamento 100% determinístico, sem juiz-modelo), rodou os três casos exigidos (parada 6/6, entrada 4/4, precedência 2/2) contra a doutrina entregue, e a contraprova contra a doutrina anterior à fase: **inconsistente entre duas execuções** (uma reprovou por diferença de vocabulário, a outra passou 6/6, inclusive na asserção do checkpoint que era o eixo esperado de diferença), registrado como "sonda não discriminou" em vez de forçar uma leitura mais forte do que os dados sustentam. Provou regressão real dos sete comandos e quatro runtimes (instalação em diretório temporário) e das duas leituras de projeto com planejamento anterior ao ciclo (`phase-plan-index`, `roadmap get-phase`); achou de novo o bug conhecido `init up` (já registrado desde a fase 13, item 1 de `.plano/fases/13-formato-de-pergunta/deferred-items.md`), confirmado idêntico no SHA_BASE desta fase, portanto não é regressão do grill. GRILL-01 a GRILL-10 marcados completos em REQUIREMENTS.md. REG-01 a REG-03 seguem pendentes (transversais, reverificados a cada fase 13-20)
**Progresso**:
```
Ciclo 1: fases 1 a 10               [████████████████████] Concluido (detalhe no ROADMAP.md)
Fase 11: Suporte a Grok Build       [████████████████████] Completa
Fase 12: Encerramento solo          [████████████████████] Completa
Fase 13: Formato de pergunta        [████████████████████] Completa (5/5 planos)
Fase 14: Memoria do projeto         [████████████████████] Completa (6/6 planos)
Fase 15: Modo grill                 [████████████████████] Completa (4/4 planos)
Fase 16: Honestidade da prova       [░░░░░░░░░░░░░░░░░░░░] Pendente
Fase 17: Planejamento por grafo     [░░░░░░░░░░░░░░░░░░░░] Pendente
Fase 18: Contexto e revisao         [░░░░░░░░░░░░░░░░░░░░] Pendente
Fase 19: Auditoria escopada         [░░░░░░░░░░░░░░░░░░░░] Pendente
Fase 20: Nevoa e fronteira          [░░░░░░░░░░░░░░░░░░░░] Pendente
```

## Metricas de Performance

| Metrica | Valor |
|---------|-------|
| Fases completas | 15 de 20 |
| Requisitos do ciclo 1 cobertos | 19/19 |
| Requisitos do ciclo 2 | 33 completos (fases 11, 12, 13, 14 e 15: DIST/CICLO/PERG-01 a PERG-06/MEM-01 a MEM-12/GRILL-01 a GRILL-10), 62 pendentes (REG-01 a REG-03 seguem transversais e pendentes; fases 16 a 20) |
| Planos executados | 36 |

## Contexto Acumulado

### Decisoes

| # | Decisao | Justificativa | Fase |
|---|---------|---------------|------|
| 1 | Templates antes de agentes | Agentes precisam de formato padrao para produzir output compativel | 3 |
| 2 | References antes de agentes | Catalogos de padroes garantem analise sistematica, nao ad-hoc | 4 |
| 3 | /up:melhorias antes de /up:ideias | Ecossistema mais maduro, menor risco, serve de referencia para segundo comando | 5-7 |
| 4 | INFRA-04 (standalone) compartilhado entre Fases 7 e 9 | Logica de standalone e identica para ambos comandos, implementada no workflow | 7,9 |
| 5 | Fases existentes agrupadas em 2 macro-blocos | Sistema UP base + agentes paralelos cobrem todo o brownfield relevante | 1,2 |
| 6 | P/M/G mapeado binario para matriz 2x2 | P=baixo, M/G=alto -- simplicidade sobre granularidade para priorizacao | 3 |
| 7 | Empate M/M classifica como Projetos Estrategicos | Abordagem conservadora -- assume custo alto quando ambiguo | 3 |
| 8 | Dimensao primaria = finding mais completo | Na mesclagem cross-dimensao, o finding com mais caracteres em Problema+Sugestao define a dimensao primaria | 6 |
| 9 | 2 agentes de ideias + 1 consolidador | ICE scoring e anti-features requerem cruzar analise de codigo com pesquisa de mercado; espelha padrao provado de melhorias (3 auditores -> 1 sintetizador) | 8 |
| 10 | Confidence base varia por fonte no ICE scoring | Codigo puro=5, concorrente confirmado=8, tendencia=4, ambas fontes=9 -- reflete nivel de evidencia de cada tipo de fonte | 8 |
| 11 | Deteccao de idioma ROADMAP por regex simples | Testar '### Fase ' no conteudo e suficiente para diferenciar PT/EN sem config adicional | 10 |
- [Phase ?]: Grok Build herda do install Claude; nada de target --grok/~/.grok. Comandos viram skills reusando convertCommandToCodexSkill.
- [Phase 11]: finishPhase solo e no-op no github.cjs (assume commit na branch atual); landing autonomo com GitHub usa --mode auto (PR+merge). Registrado pra proximas execucoes solo com worktree.
- [Phase 12]: solo e alias de auto no finish (PR+merge sem menu); local segue no-op (escape hatch sem GitHub). github.cjs:419.
- [Phase ?]: Nao implementar nada nesta sessao: usuario pediu diagnostico. Correcao prioritaria seria indice auto-servido em blueprints/README.md + preview de escopo no /up:rapido + passo de completude no planejador de fase.
- [Phase ?]: Grill vira piso automatico em Pequena/Media/Grande (Trivial fica 0); saida por palavra de parada a qualquer momento, checkpoint a cada 3 perguntas e auto-convergencia declarada. Glossario e registro de decisao moram em .plano/ (rejeitada a convencao CONTEXT.md raiz + docs/adr do Matt). Nao copiar disable-model-invocation como doutrina nem issue-tracker-como-storage.
- [Ciclo 2, estruturacao]: fatiamento por bloco mantido (fases 13 a 20); regressao zero vira criterio de saida de cada fase e nao fase propria; heuristica anti-tautologia sinaliza e nao bloqueia; grafo de bloqueio entra como campo opcional com degradacao para onda numerada; gate passa a representar veredito por eixo. Detalhe e motivo de cada uma na tabela do arquiteto em PROJECT.md.
- [Ciclo 2, decisao do dono D7]: o gate e CONJUNTIVO. A fase so aprova com os dois eixos aprovados; o eixo ja aprovado fica registrado e nao e reexecutado na rodada de correcao, que roda so o eixo reprovado.
- [Ciclo 2, pos-auditoria de planejamento]: grafo do ciclo passa a ter DUAS camadas. Aresta nova 16 antes de 18 (a 18 consome o leitor unico do log entregue pela 16). Serializacao declarada por posse de arquivo entre 14, 16, 17 e 18 (19 arquivos disputados; up-tools.cjs escrito por 7 das 8 fases, build.md por 11 planos de 6 fases). Rejeitada a alternativa de virar cadeia unica: aresta e dependencia logica, disputa de arquivo e exclusao mutua, campos separados. Regra de execucao escrita antes do build: fronteira liberada NAO autoriza paralelismo quando dois trabalhos escrevem no mesmo arquivo.
- [Ciclo 2, agentes]: SYSTEM-DESIGN passa a descrever 12 agentes hoje e 13 ao fim do ciclo (revisor unico da lugar a dois agentes de eixo com ferramentas assimetricas, forcado por REV-01 + REV-04). Risco de ordem registrado: fases 14 e 16 editam o agente que a 18 remove, e a instrucao de tautologia da 16 (que fecha PROVA-08) sumiria sem gate perceber.
- [Ciclo 2, pos-revalidacao R1]: o gate quebra em TRES pontos contra as linhas reais do log (seletor por nome de agente, veredito lido por posicao de coluna, vocabulario fechado). Leitor unico que localiza campo por CONTEUDO fecha os tres; PROVA-04 define o leitor e REV-09 aponta pra ele. Alvo e leitura de historico: o escritor oficial ja emite o formato de seis colunas e nao muda. Janela do verbete de onda fechada por criterio de saida na fase 17.
- [Ciclo 2, pos-validacao]: PLANO-13 criado (leitura das duas convencoes de nome de plano e de resumo, verificado por execucao: indice vazio na fase 11, resumo nao pareado na fase 3); PROVA-04 e REV-09 passaram a dizer COMO a compatibilidade do log de aprovacoes e obtida, porque o gate de hoje reprova o proprio historico; PROVA-03 ganhou clausula de validade a partir deste ciclo.
- [Phase 13]: Escalacao de decisao de subagente e em banda (bloco DECISOES ESCALADAS no retorno), sem criar arquivo, para nao colidir com os registros de decisao da fase 14
- [Phase 13]: Grafo em duas camadas: dependencia logica vira aresta, disputa de arquivo vira serializacao por posse. Motivo: a fase 17 deriva a fronteira a partir das arestas, entao grafo poluido por contencao de recurso seria herdado pelo mecanismo.
- [Phase 13, plano 005]: bug pré-existente crítico descoberto no fechamento da fase (`init up` não existe no despachante de `init` de `up-tools.cjs`, mas `up/workflows/up.md` chama exatamente esse comando no Passo 0; toda invocação de `/up:up` sem argumento provavelmente falha ali). Confirmado anterior ao primeiro commit da fase 13 (existia no commit 8d06348, merge-base desta branch com main). Não corrigido por estar fora do escopo do plano de prova (corrigir exigiria tocar up/bin/up-tools.cjs, violando o próprio critério de aceite da tarefa 6 sobre diferença vazia em up/bin). Registrado com prioridade alta em `.plano/fases/13-formato-de-pergunta/deferred-items.md`, item 1, para tratamento fora deste ciclo de fase.
- [Phase 13, plano 005]: mais quatro gaps de ferramentas descobertos durante o fechamento (`requirements mark-complete` e os cinco comandos `state advance-plan/update-progress/add-decision/record-metric/record-session` não casam com o formato real de `REQUIREMENTS.md`/`STATE.md` desta v2, apenas com um template legado). Contornado com edição manual dos dois arquivos nesta sessão; `roadmap update-plan-progress` funciona e foi usado normalmente. Detalhe nos itens 4 e 5 de `deferred-items.md`.
- [Phase 14, plano 006]: `requirements mark-complete` corrigido (Regra 1 + Regra 3): o regex exigia identificador em negrito (`**ID**`), formato que não existe em nenhum `REQUIREMENTS.md` deste v2; aceita agora negrito opcional. Único dos cinco comandos da família corrigido, porque só ele bloqueava a tarefa 6 do plano; os quatro comandos `state *` continuam com o mesmo defeito, não tocados (fora do escopo desta fase). `roadmap update-plan-progress` seguiu funcionando normalmente e foi usado para fechar a fase 14 neste STATE.md e no ROADMAP.md.
- [Phase 15, plano 004, DECISAO ESCALADA]: a contraprova da palavra de parada (sonda `grill-probe.cjs --caso parada` contra a doutrina anterior à fase) foi rodada duas vezes contra o mesmo modelo econômico e deu resultados diferentes: uma reprovou (por troca de palavra, "baixa direto" no lugar de "download"), a outra passou 6/6, inclusive na asserção do checkpoint que era o eixo estrutural esperado de diferença entre a doutrina antiga e a nova. Registrado como "a sonda não discriminou nesta rodada" em vez de forçar uma conclusão mais forte do que os dados sustentam (regra de honestidade da prova). Isso não invalida a doutrina nova (as sondas contra ela passaram de forma consistente, 6/6, 4/4 e 2/2), mas significa que a garantia de "a palavra de parada encerra sem confirmação" depende também do alinhamento geral do modelo usado, não só do texto da doutrina. Fica para o dono decidir se vale a pena um teste de comportamento com mais amostras (ex.: N execuções e maioria) antes de tratar essa garantia como couraçada, ou se a garantia estrutural (ausência do texto do checkpoint na doutrina nova, presença dele na antiga) já é suficiente. Detalhe completo em `.plano/fases/15-modo-grill/EVIDENCIA.md`, Prova 5.
- [Phase 15, plano 004]: achado o mesmo bug pré-existente já registrado na fase 13 (`init up` não reconhecido pelo dispatcher de `init` em `up-tools.cjs`, idêntico desde o `SHA_BASE`); confirmado de novo que também afeta `init auditar`. Não corrigido (fora do escopo do modo grill); detalhe em `.plano/fases/15-modo-grill/deferred-items.md`.
- [Phase 16]: Grill continua como piso. GitHub-nativo continua default. Itens 2-6 da analise de velocidade executados; itens 1 e 7 recusados pelo dono.

### TODOs

- [x] Definir regra de "dimensao primaria" quando finding pertence a multiplas dimensoes (Fase 6) -- Implementado: finding com descricao mais completa (mais caracteres em Problema+Sugestao) define dimensao primaria
- [x] Avaliar se 2 agentes de ideias sao suficientes vs 3 (custo de contexto) (Fase 8) -- Decisao: 2 agentes + 1 consolidador (plano 002). ICE scoring e anti-features requerem cruzar dados de ambos agentes, melhor feito no consolidador
- [x] Definir heuristica de deteccao de CSS frameworks (Tailwind, Bootstrap) para ajustar auditoria UX (Fase 5) -- Implementado em audit-ux.md stack_detection

### Bloqueios

Nenhum bloqueio ativo.

### Tarefas Rapidas Completadas

| # | Descricao | Data | Commit | Diretorio |
|---|-----------|------|--------|-----------|
| 1 | Adicionar checkpoint de fechamento no brainstorm (seguir ou mais perguntas) | 2026-07-01 | 8ee4fba | [1-adicionar-checkpoint-de-fechamento-no-br](./rapido/1-adicionar-checkpoint-de-fechamento-no-br/) |

## Continuidade de Sessao

**Ultima sessao**: 2026-07-26 -- Executou o plano 004 da fase 15 (onda 3, último plano, fecha a fase): escreveu `up/tests/piso-grill.test.cjs` (invariante determinístico de piso e propagação, 8 casos, verde na árvore atual e vermelho na árvore do `SHA_BASE`) e `up/tests/grill-probe.cjs` (sonda de comportamento contra o runtime real do Claude, julgamento por regra escrita, sem juiz-modelo). Rodou os três casos de comportamento contra a doutrina entregue (parada 6/6, entrada 4/4, precedência 2/2, todos PASSOU) e a contraprova contra a doutrina anterior à fase, que saiu inconsistente entre duas execuções e foi registrada como "não discriminou" em vez de forçada a uma leitura mais forte (ver DECISAO ESCALADA acima). Provou regressão real dos sete comandos, das quatro skills de doutrina, das sete skills de comando e do motor do grill nos quatro runtimes (instalação em `HOME` temporário, nunca na config real), idempotência da instalação, e as leituras de projeto com planejamento anterior ao ciclo (`phase-plan-index`, `roadmap get-phase`, ambas OK; `init up` falhou, mas idêntico ao `SHA_BASE`, bug pré-existente já registrado desde a fase 13, não regressão desta). Escreveu `.plano/fases/15-modo-grill/EVIDENCIA.md` com todas as saídas brutas e o veredito consolidado das dez linhas GRILL, e a seção "Nao lancado" do changelog. Marcou GRILL-01 a GRILL-10 completos em REQUIREMENTS.md. Commits `8eb7bd2`, `20043fa`, `1261ead`, `d8ec240`, `d733232`, `dbefe3d`, `483d0e1`.
**Proxima acao**: iniciar a fase 16 (honestidade da prova: fronteiras de teste pré-acordadas e regra anti-tautologia). Bug `init up`/`init auditar` (fase 13, reconfirmado na fase 15) e os quatro comandos `state *` restantes continuam registrados como dívida pré-existente, fora do ciclo de fases.
**Comando sugerido**: `/up:build fase 16`
