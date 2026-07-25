# Roadmap: UP (up-cc)

> Roadmap acumulativo do repositório. As fases 1 a 10 são o ciclo "Agentes de Auditoria e Ideias",
> concluído, e estão preservadas exatamente como foram gravadas (inclusive na grafia sem acentuação da
> época). As fases 11 e 12 foram executadas fora do roadmap e estão registradas aqui a partir da
> evidência no log de aprovações e nos commits. As fases 13 a 20 são o ciclo novo, descrito em
> `.plano/BRIEFING-tier-ab-grill.md`.

## Fases

- [x] **Fase 1: Sistema UP base** - Existente
- [x] **Fase 2: Agentes paralelos e mapeamento** - Existente
- [x] **Fase 3: Templates e formatos padrao** - Formatos estruturados compartilhados entre comandos
- [x] **Fase 4: References de auditoria** - Documentos de referencia para cada dimensao de analise
- [x] **Fase 5: Agentes auditores de dimensao** - Agentes especializados em UX, performance e modernidade
- [x] **Fase 6: Sintetizador de melhorias** - Cruzamento cross-dimensao e relatorio consolidado
- [ ] **Fase 7: Comando /up:melhorias** - Command e workflow standalone para auditoria completa (1/2 planos)
- [x] **Fase 8: Agente idealizador** - Agente que sugere features novas por analise de codigo e mercado
- [x] **Fase 9: Comando /up:ideias** - Command e workflow standalone para sugestao de features
- [ ] **Fase 10: Integracao com roadmap** - Geracao de fases e apresentacao interativa de resultados
- [x] **Fase 11: Suporte a Grok Build** - Comandos UP emitidos como skills invocáveis no runtime nativo do Claude Code
- [x] **Fase 12: Correção do encerramento solo** - Modo solo com repositório ativo passa a aterrissar a fase de verdade
- [ ] **Fase 13: Formato de pergunta** - Resposta recomendada em toda pergunta e regra de fato contra decisão
- [ ] **Fase 14: Memória do projeto** - Glossário, registro de decisão com alternativas rejeitadas e base de rejeições
- [ ] **Fase 15: Modo grill** - Questionamento profundo como piso automático, com três portas de saída
- [ ] **Fase 16: Honestidade da prova** - Fronteiras de teste pré-acordadas e regra anti-tautologia
- [ ] **Fase 17: Planejamento por grafo** - Arestas de bloqueio, fronteira derivada, tamanho por janela e durabilidade do plano
- [ ] **Fase 18: Contexto e revisão** - Higiene de contexto prescrita, handoff e revisão em dois eixos paralelos
- [ ] **Fase 19: Auditoria visual e escopada** - Escopo por concentração de mudança e relatório HTML com gate de handoff
- [ ] **Fase 20: Névoa e fronteira do roadmap** - Auto-aborto do planejamento, seção de não especificado e fora de escopo

## Detalhes das Fases

### Fase 1: Sistema UP base
**Status**: Existente
**Funcionalidades**: 19 comandos slash, CLI tools (up-tools.cjs + core.cjs), installer multi-runtime, hooks (statusline + context monitor), suporte brownfield com deteccao automatica
**Planos**: N/A (pre-existente)

### Fase 2: Agentes paralelos e mapeamento
**Status**: Existente
**Funcionalidades**: 8 agentes especializados (executor, planejador, roteirista, verificador, pesquisador-projeto, sintetizador, depurador, mapeador-codigo), padrao de spawn paralelo via Task, padrao command-workflow-agent estabelecido
**Planos**: N/A (pre-existente)

### Fase 3: Templates e formatos padrao
**Objetivo**: Usuario e agentes produzem sugestoes em formato identico e acionavel, permitindo agregacao e priorizacao consistente
**Depende de**: Fase 2 (agentes existentes como referencia de padrao)
**Requisitos**: INFRA-01, INFRA-02
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Toda sugestao gerada por qualquer agente contem obrigatoriamente: arquivo, linha, problema, sugestao concreta, esforco (P/M/G) e impacto (P/M/G)
  2. O relatorio final apresenta sugestoes organizadas em matriz 2x2 de esforco x impacto com quadrantes nomeados (quick wins, projetos estrategicos, preenchimentos, evitar)
  3. Templates sao arquivos markdown em up/templates/ que agentes carregam e preenchem
**Planos**: 1/1 completo
**Completado**: 2026-03-09

### Fase 4: References de auditoria
**Objetivo**: Agentes auditores tem catalogos de padroes documentados para cada dimensao, garantindo analise sistematica e nao ad-hoc
**Depende de**: Fase 2 (convencoes de references existentes)
**Requisitos**: INFRA-05
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Reference de performance contem catalogo de anti-padroes organizados por categoria (re-renders, bundle, queries, assets, CSS, rede, configs, deps) com exemplos de codigo e solucoes
  2. Reference de modernidade contem catalogo de padroes obsoletos com alternativas modernas e nivel de urgencia
  3. Reference de UX contem heuristicas de avaliacao traduzidas para sinais detectaveis em codigo (CSS, componentes, fluxos)
  4. Cada reference inclui instrucoes de deteccao de framework/stack para ajustar heuristicas (React vs Vue vs vanilla, Tailwind vs CSS puro)
**Planos**: 3/3 completo
**Completado**: 2026-03-09

### Fase 5: Agentes auditores de dimensao
**Objetivo**: Cada dimensao de analise (UX, performance, modernidade) tem um agente especializado que analisa o codebase completo e produz sugestoes estruturadas
**Depende de**: Fase 3 (templates de sugestao), Fase 4 (references de padroes)
**Requisitos**: MELH-02, MELH-03, MELH-04, INFRA-03
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Agente de UX analisa CSS/SCSS, componentes e fluxos de navegacao, produzindo sugestoes com sinais de problemas de usabilidade (inconsistencia visual, ausencia de feedback, fluxos confusos)
  2. Agente de performance identifica anti-padroes de performance no codigo (re-renders, deps pesadas, ausencia de lazy loading, queries ineficientes) com estimativa de impacto
  3. Agente de modernidade detecta dependencias desatualizadas, padroes obsoletos e sugere alternativas modernas com nivel de urgencia
  4. Cada agente produz mapa de cobertura listando todo arquivo analisado, e o total de cobertura e visivel no relatorio
  5. Cada agente usa o template de sugestao padrao (arquivo, linha, problema, sugestao, esforco, impacto)
**Planos**: 3/3 completo
**Completado**: 2026-03-10

### Fase 6: Sintetizador de melhorias
**Objetivo**: Insights de todas as dimensoes sao cruzados, deduplicados e consolidados em um relatorio unico com priorizacao clara
**Depende de**: Fase 5 (agentes de dimensao produzem sugestoes)
**Requisitos**: MELH-05, MELH-06
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Sugestoes duplicadas entre dimensoes sao detectadas e mescladas (ex: jQuery reportado como problema de modernidade E performance aparece uma vez com ambas as dimensoes citadas)
  2. Conflitos entre dimensoes sao sinalizados (ex: "remover animacao" por performance vs "manter animacao" por UX)
  3. Relatorio consolidado em .plano/melhorias/ contem todas as sugestoes priorizadas na matriz esforco x impacto com totais por dimensao
**Planos**: 1/1 completo
**Completado**: 2026-03-10

### Fase 7: Comando /up:melhorias
**Objetivo**: Usuario pode invocar /up:melhorias em qualquer projeto e receber auditoria completa do codebase sem pre-requisitos
**Depende de**: Fase 5 (agentes), Fase 6 (sintetizador), Fase 3 (templates)
**Requisitos**: MELH-01, INFRA-04
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Usuario invoca /up:melhorias em projeto sem .plano/ e o comando cria a estrutura necessaria automaticamente (standalone)
  2. O comando detecta a stack do projeto (React/Vue/Next/Tailwind/etc.) e ajusta a analise
  3. Tres agentes rodam em paralelo (UX, performance, modernidade), seguidos pelo sintetizador
  4. Usuario recebe relatorio final com sugestoes priorizadas por quadrante de esforco x impacto
**Planos**: 1/2 completo

### Fase 8: Agente idealizador
**Objetivo**: Projeto recebe sugestoes de features novas baseadas em analise de codigo existente, pesquisa de mercado e perspectiva do usuario final
**Depende de**: Fase 3 (formatos de sugestao), Fase 2 (padrao de agentes paralelos)
**Requisitos**: IDEIA-02, IDEIA-03, IDEIA-04, IDEIA-05
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Agente analista de codigo mapeia features existentes e identifica gaps funcionais (o que o projeto faz vs o que poderia fazer)
  2. Agente pesquisador de mercado busca concorrentes e tendencias relevantes via web search e apresenta comparativo
  3. Cada sugestao de feature tem score ICE (Impact x Confidence x Ease, escala 1-10) para priorizacao objetiva
  4. Para cada 3 sugestoes positivas, pelo menos 1 anti-feature e apresentada (feature que NAO deve ser implementada, com justificativa)
**Planos**: 2/2 completo
**Completado**: 2026-03-10

### Fase 9: Comando /up:ideias
**Objetivo**: Usuario pode invocar /up:ideias em qualquer projeto e receber sugestoes de features novas com pesquisa de mercado
**Depende de**: Fase 8 (agente idealizador), Fase 3 (templates)
**Requisitos**: IDEIA-01, IDEIA-06, INFRA-04
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Usuario invoca /up:ideias em projeto sem .plano/ e o comando cria a estrutura necessaria automaticamente (standalone)
  2. Agentes paralelos analisam codigo e pesquisam mercado/concorrentes, seguidos por consolidacao
  3. Relatorio em .plano/ideias/ contem sugestoes limitadas (max 15-20) com score ICE e categorizacao (must-have, performance, delighter)
  4. Secao de anti-features esta presente e e proporcional as sugestoes positivas
**Planos**: 2/2 completo
**Completado**: 2026-03-10

### Fase 10: Integracao com roadmap
**Objetivo**: Sugestoes aprovadas pelo usuario sao convertidas automaticamente em fases executaveis no ROADMAP.md
**Depende de**: Fase 7 (melhorias funciona), Fase 9 (ideias funciona)
**Requisitos**: INTEG-01, INTEG-02
**Criterios de Sucesso** (o que deve ser VERDADE):
  1. Apos auditoria ou ideacao, usuario pode aprovar/rejeitar sugestoes individualmente via interacao no terminal
  2. Sugestoes aprovadas sao agrupadas em fases coerentes e adicionadas ao ROADMAP.md automaticamente
  3. Fases geradas sao executaveis via /up:executar-fase existente sem adaptacoes
**Planos**: TBD

### Fase 11: Suporte a Grok Build
**Objetivo**: Runtime que lê a configuração nativa do Claude Code descobre e invoca os comandos do UP, fechando o furo de comandos digitáveis
**Depende de**: Fase 1 (instalador multi-runtime)
**Bloqueia**: Nada
**Requisitos**: DIST-01, DIST-02, DIST-03
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. A instalação para o alvo Claude emite os sete comandos do UP como skills invocáveis, além dos slash commands
  2. O runtime externo lista as sete skills de comando, o que prova a descoberta
  3. As quatro skills de doutrina continuam intactas e os slash commands não regridem
  4. Não foi criado alvo de instalação novo nem flag nova
  5. A desinstalação remove as skills de comando junto das skills de doutrina
**Prova exigida**: smoke (instalação real seguida de inspeção do runtime)
**Planos**: 1/1 completo
**Evidência**: log de aprovações `fase=11 plano=001 APPROVED evidence=smoke:pass`; issue 5; PR 6; commit 0132c67. O critério 5 foi conferido por leitura do código no resumo do plano, sem execução de desinstalação
**Completado**: 2026-07-09

### Fase 12: Correção do encerramento solo
**Objetivo**: Encerrar fase em modo solo com integração de repositório ativa deixa de ser operação vazia e passa a aterrissar a fase
**Depende de**: Fase 11 (mesma superfície de integração)
**Bloqueia**: Nada
**Requisitos**: CICLO-01, CICLO-02
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. Encerramento em modo solo com repositório ativo executa o mesmo desfecho do modo automático, com a ação registrada como concluída
  2. Encerramento em modo solo sem repositório continua sem executar cerimônia, preservando o escape hatch
  3. O comportamento foi visto falhar antes da correção e passar depois
**Prova exigida**: lógica, vermelho e verde
**Planos**: 1/1 completo
**Evidência**: log de aprovações `fase=12 plano=001 APPROVED evidence=test:red-green`; issue 7; PR 8; commit e7f4b4f
**Completado**: 2026-07-09

### Fase 13: Formato de pergunta
**Objetivo**: Nenhuma pergunta do UP chega crua ao dono, e o agente para de perguntar o que ele mesmo poderia descobrir
**Depende de**: Nada dentro do ciclo novo
**Bloqueia**: Fases 14, 15, 16, 17, 18, 19 e 20 (muda o formato de toda pergunta do sistema)
**Requisitos**: PERG-01, PERG-02, PERG-03, PERG-04, PERG-05, PERG-06, REG-01, REG-02, REG-03
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. Numa rodada de brainstorm de tarefa pequena, toda pergunta apresentada traz a recomendação e o motivo dela, sem exceção
  2. Num repositório com planejamento populado, o brainstorm não pergunta nada que já esteja no estado do projeto, nos requisitos ou no mapa do codebase
  3. O roteamento da porta única, o planejamento, a confirmação de início da execução, o menu de fechamento de fase e o gate visual antes do merge apresentam a opção recomendada com o motivo
  4. Uma escolha de arquitetura aparece ao dono como pergunta com recomendação, e não é decidida pelo agente
  5. Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior a este ciclo continua funcionando sem migração
**Prova exigida**: smoke (critérios 1 e 2 do briefing)
**Planos**: 0/5 (001 doutrina, onda 1; 002 entrada, 003 execução e 004 planejamento e auditoria, onda 2; 005 prova e regressão, onda 3)

### Fase 14: Memória do projeto
**Objetivo**: O projeto passa a lembrar do vocabulário que fixou, das decisões difíceis que tomou e do que já recusou
**Depende de**: Fase 13 (a base de rejeições faz pergunta ao dono e precisa do formato novo)
**Bloqueia**: Fase 15 (o grill escreve nesses artefatos no instante em que os termos caem), Fase 19 (rejeição de auditoria vira registro de decisão)
**Requisitos**: MEM-01 a MEM-12, REG-01, REG-02, REG-03
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. Nenhum arquivo de glossário, de decisão ou de rejeição existe antes de haver conteúdo real para escrever nele
  2. Uma decisão que falha qualquer uma das três condições não gera registro; uma que passa gera registro numerado com as alternativas rejeitadas e o motivo de cada uma
  3. Dois registros criados em sequência recebem números distintos e crescentes, calculados por varredura do que já existe
  4. Propor de novo um conceito já recusado faz o sistema trazer a rejeição anterior à tona antes de explorar a intenção
  5. Um item já implementado e um adiamento por falta de tempo não entram na base de rejeições
  6. O glossário interno existe com no mínimo os nove termos do próprio sistema, cada verbete lista os sinônimos proibidos, e o verbete de onda já vem escrito como visão derivada da dependência declarada
  7. O glossário do projeto declara no próprio arquivo a regra de admissão e a regra de higiene
  8. Um registro de decisão exibe status opcional entre proposta, aceita e substituída
  9. A contagem de redefinições dos termos do glossário nas superfícies do produto é zero, sem tocar em redação fora desses termos
  10. O glossário interno chega aos quatro runtimes suportados na instalação
  11. Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior a este ciclo continua funcionando sem migração
**Prova exigida**: smoke (critérios 3 e 4 do briefing)
**Planos**: 0/6 (planejados em 2026-07-25; ondas 1, 2 e 3)
**Ondas**: onda 1 = glossário interno e registro de decisão; onda 2 = base de rejeições, citação nas superfícies e glossário do projeto; onda 3 = prova ponta a ponta e regressão zero

### Fase 15: Modo grill
**Objetivo**: Perguntar de menos deixa de ser o default: tarefa pequena, média e grande entram em questionamento profundo, com saída barata a qualquer momento
**Depende de**: Fase 13 (toda pergunta do grill precisa de recomendação e da regra de fato contra decisão), Fase 14 (o grill grava glossário e decisão inline)
**Bloqueia**: Fase 20 (o auto-aborto do planejamento lê o resultado do grill)
**Requisitos**: GRILL-01 a GRILL-10, REG-01, REG-02, REG-03
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. Brainstorm de tarefa pequena entra em grill automaticamente, e tarefa trivial continua em zero pergunta
  2. Cada pergunta do grill chega com recomendação e uma pergunta por vez
  3. A palavra de parada encerra na primeira tentativa, sem checkpoint e sem confirmação, e o agente segue direto para a destilação
  4. A cada três perguntas aparece o checkpoint de duas opções
  5. Quando não resta pergunta capaz de mudar o design, o agente declara isso em voz alta e propõe fechar
  6. Termo de domínio e decisão que caem no meio do grill aparecem gravados antes do fim da conversa, não em lote no final
  7. Encerradas as perguntas, a aprovação do design continua sendo exigida
  8. Gatilho manual em linguagem natural e por flag entra em grill mesmo em tarefa classificada como trivial, porque o pedido do dono tem precedência sobre a classificação automática
  9. Toda pergunta que depende de resposta anterior declara de qual depende, e a ordem fica verificável na transcrição da rodada
  10. Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior a este ciclo continua funcionando sem migração
**Prova exigida**: smoke (critério 1 do briefing)
**Planos**: 0/4 (planejados em 2026-07-25: motor na onda 1; porta da skill e propagação em paralelo na onda 2; prova na onda 3)

### Fase 16: Honestidade da prova
**Objetivo**: O gate de evidência para de aceitar teatro: o teste tem lugar acordado antes e valor esperado de fonte independente
**Depende de**: Fase 13 (a confirmação das fronteiras com o dono é pergunta com recomendação)
**Bloqueia**: Nada
**Requisitos**: PROVA-01 a PROVA-08, REG-01, REG-02, REG-03
**Fora de escopo**: o template do plano pronto carrega sedimento da versão anterior (aprovações de CEO, chiefs e supervisores). Esta fase acrescenta o campo de fronteiras confirmadas e não remove o sedimento, que tem briefing próprio
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. Plano pronto gerado a partir deste ciclo sem o campo de fronteiras confirmadas não passa no gate, e plano pronto anterior ao ciclo passa registrando a ausência como aviso
  2. Cada fronteira do esboço é nomeada como contrato público (módulo exportado, interface, comando ou rota) e nunca como caminho de arquivo, declara se já existe e em que nível está, e mais de uma fronteira vem com justificativa na própria linha
  3. A entrada de fronteiras confirmadas aparece no log de aprovações da fase, e o leitor do gate devolve o veredito correto para as duas linhas já gravadas: encontra a entrada mesmo sem a coluna do agente, não confunde evidência com veredito ao ler uma linha de cinco colunas, e aceita o vocabulário divergente, ignorando apenas o fragmento não estruturado do topo
  4. A execução recusa criar fronteira de teste não prevista e escala em vez de inventar
  5. Existe teste sobre a heurística anti-tautologia com par de fixtures (um teste tautológico e um teste honesto), visto falhar antes de passar
  6. A heurística sinaliza o achado sem bloquear o gate, e o revisor confirma ou descarta
  7. A doutrina de TDD mostra o par bom e ruim lado a lado, no mesmo cenário
  8. Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior a este ciclo continua funcionando sem migração
**Prova exigida**: smoke para fronteiras (critério 6 do briefing) e lógica vermelho e verde para anti-tautologia (critério 5)
**Ordem interna**: as fronteiras vêm antes da anti-tautologia, porque a regra anti-tautologia só vale no gate depois que existe lugar acordado para o teste
**Fronteira de teste acordada**: uma só, a superfície pública de subcomandos da CLI de ferramentas do UP (contrato do tipo comando, já existente), invocada como subprocesso com JSON em stdout. É a fronteira mais alta que um teste consegue executar neste sistema, e tanto o leitor do log quanto a heurística de tautologia são alcançáveis por ela
**Planos**: 0/5 (ondas 1 a 5, sequenciais: leitor único, religar os gates, doutrina e validação das fronteiras, fronteiras no fluxo e no log, anti-tautologia)

### Fase 17: Planejamento por grafo
**Objetivo**: A ordem de execução passa a ser derivada de dependência declarada, e o plano passa a ser durável o bastante para ser executado depois, noutro runtime
**Depende de**: Fase 13 (as decisões de quebra de fase sobem como pergunta com recomendação)
**Bloqueia**: Nada
**Requisitos**: PLANO-01 a PLANO-13, REG-01, REG-02, REG-03
**Fora de escopo**: os templates de plano e o template do plano pronto carregam sedimento da versão anterior. Esta fase acrescenta o campo de fora de escopo e o exemplo ruim anotado, e não remove o sedimento, que tem briefing próprio
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. Existe teste sobre a derivação da fronteira, cobrindo cadeia linear e o caso de um plano que falha, visto falhar antes de passar
  2. Projeto planejado sem arestas declaradas continua executando pela visão de onda numerada
  3. Existe teste vermelho e verde sobre uma fase gravada em cada convenção de nome: a fronteira enxerga os planos das duas, e o resumo pareia com o plano nas duas
  4. A decisão de quebrar uma fase em vários planos cita cem mil tokens de janela e registra a estimativa usada
  5. A verificação estática recusa regra de tamanho enunciada apenas por adjetivo, contra a lista fechada declarada na doutrina
  6. Existe teste que rejeita plano contendo caminho de arquivo ou bloco de código fora da exceção de protótipo
  7. Todo plano gerado traz o campo de fora de escopo preenchido
  8. Os templates de plano trazem exemplo ruim anotado ao lado do exemplo bom
  9. O verbete de onda do glossário interno confere com o comportamento entregue nesta fase, fechando a janela aberta entre a publicação do glossário na fase 14 e a derivação da fronteira aqui
  10. Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior a este ciclo continua funcionando sem migração
**Prova exigida**: lógica, vermelho e verde (critérios 7 e 8 do briefing)
**Planos**: 0/5 (ondas 0 e 1 em diamante: 001 leitura nas duas convenções e 003 tamanho por janela sem bloqueador; 002 grafo e fronteira derivada e 004 durabilidade na sequência; 005 fechamento e verbete de onda)

### Fase 18: Contexto e revisão
**Objetivo**: O sistema para de empurrar trabalho com contexto degradado e para de esconder problema de qualidade atrás de falha de conformidade
**Depende de**: Fase 13 (a oferta de handoff e o relatório dos dois eixos falam com o dono no formato novo)
**Bloqueia**: Nada
**Requisitos**: CTX-01 a CTX-12, REV-01 a REV-09, REG-01, REG-02, REG-03
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. O handoff gera documento em diretório temporário do sistema, com seção de comandos sugeridos, sem duplicar conteúdo que já está nos artefatos do projeto, e com segredo redigido
  2. Ao cruzar o limiar numérico, o monitor de contexto oferece a ação de handoff em vez de apenas avisar
  3. O documento de estado traz próximo comando sugerido e aponta para o detalhe em vez de copiá-lo
  4. Uma rodada em que a conformidade reprova e a qualidade aprova produz os dois relatórios lado a lado, sem fusão e sem vencedor único, a fase não aprova (o gate é conjuntivo), e o eixo já aprovado fica registrado e não é reexecutado na rodada de correção. A leitura de linha antiga usa o leitor único definido na fase 16, sem segunda implementação
  5. Referência inválida ou diff vazio falha antes do fan-out, sem gastar dois subagentes
  6. Achado sem âncora não aparece no relatório
  7. Sem spec disponível, o eixo de conformidade reporta a ausência em vez de inventar requisito
  8. O eixo de conformidade roda sem acesso de leitura ao código-fonte, e a cegueira vem do conjunto de ferramentas concedido ao subagente, não de instrução em texto
  9. A saída de cada eixo cabe em quatrocentas palavras, com aviso quando trunca
  10. Retomar um brainstorm sem plano pronto gravado faz o planejamento detectar o corte, avisar o dono e reabrir o trecho
  11. A sessão que orquestra declara no registro da fase a limpeza de contexto entre execuções de plano
  12. A doutrina traz em uma linha a distinção entre handoff e compactação
  13. Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior a este ciclo continua funcionando sem migração
**Prova exigida**: smoke (critérios 9 e 10 do briefing)
**Decisão a fechar no planejamento**: o valor padrão do limiar de zona segura, em percentual de janela ocupada, entra como pergunta com recomendação e sai desta fase com número
**Ordem interna**: os dois blocos são independentes entre si e podem correr em paralelo; o eixo de revisão é o que altera a semântica do gate, então fecha por último
**Planos**: 0/7 (ondas 1 a 4: 001 ferramentas de higiene e 004 os dois eixos isolados em paralelo; 002 higiene prescrita, 003 fio vivo do estado e 005 limiar de zona segura; 006 orquestração paralela; 007 gate conjuntivo e regressão)

### Fase 19: Auditoria visual e escopada
**Objetivo**: A auditoria deixa de despejar lista genérica e passa a chegar escopada, visual e com compromisso de prioridade
**Depende de**: Fase 13 (a pergunta única de handoff usa o formato novo), Fase 14 (a rejeição estrutural vira registro de decisão)
**Bloqueia**: Nada
**Requisitos**: AUD-01 a AUD-11, REG-01, REG-02, REG-03
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. O relatório HTML autocontido é gerado em diretório temporário, abre no navegador, e o caminho absoluto é informado, com captura visual como prova
  2. Cada card traz arquivos, problema em uma frase, solução em uma frase, ganhos em bullets curtos e o badge ternário de força
  3. A seção de recomendação principal existe e nomeia o que atacar primeiro, com o motivo
  4. O auditor para depois de apresentar os candidatos, com uma única pergunta de handoff que chega com recomendação e motivo, sem emendar diagnóstico com design
  5. O escopo da varredura sai da concentração de mudança recente; sem concentração, a rede alarga e isso é declarado
  6. Cada card publicado declara o resultado do teste falsificador, e o relatório informa quantos achados foram descartados por ele
  7. Rejeição com motivo estrutural vira registro de decisão, e motivo efêmero não gera registro
  8. A árvore de trabalho e o diff continuam limpos depois da auditoria
  9. Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior a este ciclo continua funcionando sem migração
**Prova exigida**: visual (critério 11 do briefing)
**Decisão a fechar no planejamento**: FECHADA no planejamento. A janela padrão de concentração de mudança é de 50 commits, ajustável por flag. Medido neste repositório: com 20 commits só 2 arquivos passam do limiar de quente (o sinal morre), com 100 a janela arrasta arqueologia de ciclo encerrado, com 50 há separação limpa entre topo e cauda
**Planos**: 0/6 em 5 ondas (onda 1: 001 pontos quentes e contrato de achado; onda 2, em paralelo: 002 renderizador HTML e 003 agente escopado; onda 3: 004 pipeline e gate duro; onda 4: 005 rejeição vira memória; onda 5: 006 prova visual e regressão)

### Fase 20: Névoa e fronteira do roadmap
**Objetivo**: A ferramenta pesada se recusa a rodar quando o problema é leve, e a incerteza passa a ter lugar formal para ser escrita
**Depende de**: Fase 13 (o auto-aborto fala com o dono no formato novo), Fase 15 (o auto-aborto decide a partir do resultado do grill)
**Bloqueia**: Nada. É o corte mais barato do ciclo, por isso fecha o roadmap
**Requisitos**: WAY-01 a WAY-06, REG-01, REG-02, REG-03
**Critérios de Sucesso** (o que deve ser VERDADE):
  1. Diante de um problema leve, sem pergunta aberta relevante, o planejamento se declara desnecessário e aponta a rota leve, sem gerar fases
  2. O roadmap tem seção formal para o que se pressente mas ainda não dá para especificar, com o teste de graduação declarado no próprio arquivo
  3. Fechar uma fase gradua a névoa correspondente em fase nova e limpa a área graduada
  4. A seção de fora de escopo está separada do que foi feito e do que está por fazer, com uma linha de motivo por item, e não polui o histórico de decisões
  5. Os sete comandos e os quatro runtimes continuam funcionando, e projeto com planejamento anterior a este ciclo continua funcionando sem migração
**Prova exigida**: smoke
**Planos**: 0/5 (ondas 1 a 4: 001 seção de névoa; 002 fora de escopo e 003 gate de auto-aborto em paralelo; 004 graduação no fechamento; 005 regressão e prova de ponta a ponta)

## Grafo de bloqueio do ciclo 2

Declarado como aresta, e não como ordem arbitrária. É o item 7 do briefing sendo aplicado ao próprio roadmap antes de existir.

```
13 (formato de pergunta)
 ├──> 14 (memória do projeto) ──> 15 (modo grill) ──> 20 (névoa e fronteira)
 │                            └──> 19 (auditoria)
 ├──> 16 (honestidade da prova)
 ├──> 17 (planejamento por grafo)
 └──> 18 (contexto e revisão)
```

Fronteira inicial: fase 13, sozinha. Depois dela, 16, 17 e 18 ficam liberadas em paralelo com 14. A fase 20 é a última porque nada depende dela, o que a torna o corte mais barato se o escopo apertar.

## Tabela de Progresso

| Fase | Planos Completos | Status | Completado |
|------|-----------------|--------|------------|
| 1. Sistema UP base | N/A | Existente | Pre-existente |
| 2. Agentes paralelos e mapeamento | N/A | Existente | Pre-existente |
| 3. Templates e formatos padrao | 1/1 | Completa | 2026-03-09 |
| 4. References de auditoria | 3/3 | Completa | 2026-03-09 |
| 5. Agentes auditores de dimensao | 3/3 | Completa | 2026-03-10 |
| 6. Sintetizador de melhorias | 1/1 | Completa | 2026-03-10 |
| 7. Comando /up:melhorias | 1/2 | Em progresso | - |
| 8. Agente idealizador | 2/2 | Completa | 2026-03-10 |
| 9. Comando /up:ideias | 2/2 | Completa | 2026-03-10 |
| 10. Integracao com roadmap | 2/2 | Complete   | 2026-03-10 |
| 11. Suporte a Grok Build | 1/1 | Completa | 2026-07-09 |
| 12. Correção do encerramento solo | 1/1 | Completa | 2026-07-09 |
| 13. Formato de pergunta | 0/5 | Planejada | - |
| 14. Memória do projeto | 0/6 | Planejada | - |
| 15. Modo grill | 0/4 | Planejada | - |
| 16. Honestidade da prova | 0/5 | Planejada | - |
| 17. Planejamento por grafo | 0/5 | Pendente | - |
| 18. Contexto e revisão | 0/7 | Pendente | - |
| 19. Auditoria visual e escopada | 0/6 | Planejada | - |
| 20. Névoa e fronteira do roadmap | 0/5 | Pendente | - |
