# Estado do Projeto

## Referencia do Projeto

**Projeto**: UP (up-cc)
**Valor Central**: Pipeline autônomo confiável exige perguntar o suficiente antes de agir, lembrar do que já foi decidido e recusado, e provar o que afirma
**Foco Atual**: Ciclo 2 estruturado (fases 13 a 20). Fase 14 (memória do projeto) completa: os 6 planos das 3 ondas fecharam, com prova ponta a ponta e regressão zero. Próxima fase: 15 (modo grill)

## Posicao Atual

**Fase**: 15 de 20 (próxima; fase 14 completa)
**Plano**: fase 14 fechada com os 6 planos das 3 ondas: 001 (glossário interno do UP), 002 (registro de decisão determinístico), 003 (base de rejeições por conceito de domínio), 004 (definição única e citação nas superfícies), 005 (glossário do projeto e doutrina de memória), 006 (prova ponta a ponta e regressão zero)
**Status**: Fase 14 completa e commitada. Plano 006 escreveu `up/bin/lib/memoria-e2e.test.cjs` (16 casos, duas jornadas encadeadas exercitando o binário real de ferramentas: critério 3 do briefing, criação preguiçosa e gate; critério 4, reproposta de conceito recusado), provou regressão real nos quatro runtimes, num projeto no formato anterior ao ciclo e na bateria completa de 114 casos + guarda da fase 13. Corrigiu, no caminho, um bug real em `requirements mark-complete` (regex nunca casava o formato sem negrito usado neste v2; era no-op silencioso). MEM-01 a MEM-12 marcados completos em REQUIREMENTS.md via linha de comando, já corrigida. REG-01 a REG-03 seguem pendentes (transversais, reverificados a cada fase 13-20)
**Progresso**:
```
Ciclo 1: fases 1 a 10               [████████████████████] Concluido (detalhe no ROADMAP.md)
Fase 11: Suporte a Grok Build       [████████████████████] Completa
Fase 12: Encerramento solo          [████████████████████] Completa
Fase 13: Formato de pergunta        [████████████████████] Completa (5/5 planos)
Fase 14: Memoria do projeto         [████████████████████] Completa (6/6 planos)
Fase 15: Modo grill                 [░░░░░░░░░░░░░░░░░░░░] Pendente
Fase 16: Honestidade da prova       [░░░░░░░░░░░░░░░░░░░░] Pendente
Fase 17: Planejamento por grafo     [░░░░░░░░░░░░░░░░░░░░] Pendente
Fase 18: Contexto e revisao         [░░░░░░░░░░░░░░░░░░░░] Pendente
Fase 19: Auditoria escopada         [░░░░░░░░░░░░░░░░░░░░] Pendente
Fase 20: Nevoa e fronteira          [░░░░░░░░░░░░░░░░░░░░] Pendente
```

## Metricas de Performance

| Metrica | Valor |
|---------|-------|
| Fases completas | 14 de 20 |
| Requisitos do ciclo 1 cobertos | 19/19 |
| Requisitos do ciclo 2 | 23 completos (fases 11, 12, 13 e 14: DIST/CICLO/PERG-01 a PERG-06/MEM-01 a MEM-12), 72 pendentes (REG-01 a REG-03 seguem transversais e pendentes; fases 15 a 20) |
| Planos executados | 31 |

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

**Ultima sessao**: 2026-07-26 -- Executou o plano 006 da fase 14 (onda 3, último plano, fecha a fase): escreveu `up/bin/lib/memoria-e2e.test.cjs` (16 casos em duas jornadas encadeadas, exercitando o binário real de ferramentas contra um projeto temporário: critério 3 do briefing, criação preguiçosa e gate das três condições; critério 4, reproposta de conceito recusado). Provou regressão real dos sete comandos e quatro runtimes (instalação real em diretório temporário), de um projeto no formato de planejamento anterior a este ciclo (sem migração, sem artefato novo por baixo do pano) e da bateria completa de 114 casos (6 arquivos de teste) mais o guarda da fase 13, todos verdes. Corrigiu, no caminho, um bug real e bloqueante em `requirements mark-complete` (regex nunca casava o formato sem negrito usado neste v2; era no-op silencioso mesmo com código de saída zero), verificado vermelho-antes/verde-depois contra cópia isolada antes de tocar o arquivo real. Marcou MEM-01 a MEM-12 completos em REQUIREMENTS.md via linha de comando (já corrigida), com tabela de rastreabilidade no resumo. Commits `c3ab4c4`, `51f37ea`, `9aab079`, `625ff4c`, `60f9a92`.
**Proxima acao**: iniciar a fase 15 (modo grill: questionamento profundo como piso automático, com três portas de saída). Bug `init up` (fase 13) e os quatro comandos `state *` restantes (fase 13/14) continuam registrados como dívida pré-existente, fora do ciclo de fases.
**Comando sugerido**: `/up:build fase 15`
