# Requisitos: UP (up-cc)

> Arquivo acumulativo do repositório. O bloco do ciclo 1 (categorias INFRA, MELH, IDEIA e INTEG) está
> preservado exatamente como foi gravado, inclusive na grafia sem acentuação da época. Nenhum requisito
> foi renumerado ou removido. Os ciclos seguintes apenas acrescentam categorias e identificadores.

---

## Ciclo 1: Agentes de Auditoria e Ideias (concluído, fases 3 a 10)

## Requisitos v1

### Infraestrutura (INFRA)

- [x] INFRA-01: Template de sugestao estruturado com formato obrigatorio (arquivo, linha, problema, sugestao concreta, esforco, impacto)
- [x] INFRA-02: Matriz esforco x impacto com 4 quadrantes (quick wins, projetos estrategicos, preenchimentos, evitar)
- [x] INFRA-03: Mapa de cobertura obrigatorio (lista todo arquivo analisado + % de cobertura)
- [x] INFRA-04: Standalone -- cria .plano/ se nao existir, detecta stack automaticamente sem /up:novo-projeto
- [x] INFRA-05: Deteccao de framework/stack antes da analise (React/Vue/Next/Tailwind/etc.) para ajustar heuristicas

### Melhorias (MELH)

- [x] MELH-01: Comando /up:melhorias com workflow e command standalone
- [x] MELH-02: Agente de auditoria UX/navegabilidade (CSS, componentes, fluxos, formularios, hierarquia visual)
- [x] MELH-03: Agente de auditoria de performance (bundle, re-renders, queries, deps, lazy loading, caching)
- [x] MELH-04: Agente de auditoria de modernidade (libs desatualizadas, padroes obsoletos, alternativas modernas)
- [x] MELH-05: Sintetizador cross-dimensao (cruza insights, deduplica, valida conflitos entre dimensoes)
- [x] MELH-06: Relatorio consolidado em .plano/melhorias/ com todas as sugestoes priorizadas

### Ideias (IDEIA)

- [x] IDEIA-01: Comando /up:ideias com workflow e command standalone
- [x] IDEIA-02: Agente analista de codigo (mapear features existentes para identificar gaps)
- [x] IDEIA-03: Agente pesquisador de mercado (concorrentes, tendencias via web search)
- [x] IDEIA-04: Sugestoes com priorizacao ICE (Impact x Confidence x Ease, escala 1-10)
- [x] IDEIA-05: Anti-features obrigatorias (1 anti-feature para cada 3 sugestoes positivas)
- [x] IDEIA-06: Relatorio consolidado em .plano/ideias/

### Integracao (INTEG)

- [x] INTEG-01: Geracao automatica de fases no ROADMAP.md a partir de sugestoes/ideias aprovadas
- [x] INTEG-02: Apresentacao interativa de sugestoes com aprovacao/rejeicao por item

## Requisitos v2 (Adiados)

- Acessibilidade (ARIA, screen readers, keyboard nav) -- dimensao extra para /up:melhorias
- Navegacao via browser com Playwright -- complementa analise estatica com UX real
- Score de modernidade quantificavel (0-100) -- requer calibracao com projetos reais
- Monorepo support (multiplos package.json) -- complexidade alta, baixa demanda v1
- Integracao com CI/CD (relatorio automatico em PRs)

## Fora do Escopo

- Execucao automatica das melhorias -- gera roadmap, execucao e via /up:executar-fase
- Testes automatizados das sugestoes -- agente sugere, humano decide
- Analytics de uso real (Mixpanel, PostHog) -- requer telemetria, fora do escopo de analise estatica
- Benchmarking de performance (Lighthouse, profiling) -- requer app rodando

## Rastreabilidade

| Requisito | Fase | Status |
|-----------|------|--------|
| INFRA-01 | Fase 3 | Completo |
| INFRA-02 | Fase 3 | Completo |
| INFRA-03 | Fase 5 | Completo |
| INFRA-04 | Fase 7, 9 | Completo |
| INFRA-05 | Fase 4 | Completo |
| MELH-01 | Fase 7 | Completo |
| MELH-02 | Fase 5 | Completo |
| MELH-03 | Fase 5 | Completo |
| MELH-04 | Fase 5 | Completo |
| MELH-05 | Fase 6 | Completo |
| MELH-06 | Fase 6 | Completo |
| IDEIA-01 | Fase 9 | Completo |
| IDEIA-02 | Fase 8 | Completo |
| IDEIA-03 | Fase 8 | Completo |
| IDEIA-04 | Fase 8 | Completo |
| IDEIA-05 | Fase 8 | Completo |
| IDEIA-06 | Fase 9 | Completo |
| INTEG-01 | Fase 10 | Completo |
| INTEG-02 | Fase 10 | Completo |

---

## Requisitos avulsos (fases 11 e 12, concluídas)

Registrados após a execução, a partir da evidência no log de aprovações e nos commits das fases.

### Distribuição em runtime (DIST)

- [x] DIST-01: Os sete comandos do UP são descobríveis e invocáveis como skills em runtime que lê a configuração nativa do Claude Code, sem alvo de instalação novo e sem flag nova
- [x] DIST-02: A desinstalação remove as skills de comando junto das skills de doutrina. Evidência coletada por leitura do código no resumo do plano, não por execução de desinstalação
- [x] DIST-03: A emissão das skills de comando não regride os slash commands nem as quatro skills de doutrina

### Ciclo de fase (CICLO)

- [x] CICLO-01: Encerrar uma fase em modo solo com integração de repositório ativa produz o mesmo desfecho do modo automático, em vez de não executar ação nenhuma
- [x] CICLO-02: Encerrar uma fase em modo solo sem integração de repositório continua sem cerimônia, preservando o escape hatch

---

## Ciclo 2: Disciplinas do aihero (Tier A + B) mais modo grill (fases 13 a 20)

Origem: `.plano/BRIEFING-tier-ab-grill.md`. Treze itens em sete blocos. Cada requisito abaixo é
comportamento observável, sem citar caminho de arquivo: o mapa de superfícies vive em
`.plano/SYSTEM-DESIGN.md`.

### Formato de pergunta (PERG)

- [x] PERG-01: Toda pergunta feita ao dono chega acompanhada de resposta recomendada e do motivo da recomendação, para o dono confirmar ou corrigir em vez de redigir
- [x] PERG-02: Nenhuma das sete superfícies interativas emite pergunta crua: brainstorm, planejamento, confirmação de início da execução, fechamento de fase, gate visual antes do merge, roteamento da porta única e handoff da auditoria
- [x] PERG-03: Antes de perguntar, o agente tenta resolver por conta própria usando leitura de arquivo, busca no código, histórico do repositório, estado do projeto, requisitos e mapa do codebase
- [x] PERG-04: Fato descobrível pelo agente nunca vira pergunta ao dono
- [x] PERG-05: Escolha de arquitetura ou trade-off nunca é resolvida pelo agente sozinho: sobe ao dono como pergunta com recomendação
- [x] PERG-06: A regra vale também para os agentes de arquitetura e de planejamento, não apenas para a skill de brainstorm

### Memória do projeto (MEM)

- [x] MEM-01: Existe glossário interno com os termos do próprio UP, cobrindo no mínimo os nove termos do sistema listados no briefing (fase, onda, plano, gate, evidência, worktree, escape hatch, verificação e o laço de detectar, corrigir e reverificar), cada verbete com definição de uma a duas frases e lista explícita de sinônimos proibidos. O verbete de onda já nasce na forma final, como visão derivada da dependência declarada, e não como ordem primária de execução. O glossário é distribuído nos quatro runtimes suportados, porque sem distribuição ele não é fonte única
- [x] MEM-02: Cada termo do glossário interno tem no máximo uma definição no produto: as superfícies que usam o termo apontam para o verbete. A verificação conta as redefinições remanescentes dos termos do glossário e o aceite é zero. Redação fora dos termos do glossário não é tocada, porque poda de texto é passe separado
- [x] MEM-03: O glossário do projeto, o diretório de registros de decisão e a base de rejeições são criados apenas quando o primeiro conteúdo real existe, nunca como scaffold vazio
- [x] MEM-04: O glossário do projeto declara no próprio arquivo a regra de admissão (só conceito específico do domínio) e a regra de higiene (nenhum detalhe de implementação)
- [x] MEM-05: Um registro de decisão só é criado quando as três condições valem ao mesmo tempo: difícil de reverter, surpreendente sem contexto, e resultado de trade-off real com alternativas genuínas
- [x] MEM-06: O registro de decisão contém título curto, contexto, decisão e motivo em até três frases, e a lista de alternativas rejeitadas com o porquê de cada rejeição
- [x] MEM-07: A numeração dos registros de decisão é determinística: varre os registros existentes, toma o maior número e incrementa
- [x] MEM-08: O registro de decisão aceita status opcional entre proposta, aceita e substituída por outro registro
- [x] MEM-09: A base de rejeições é indexada por conceito de domínio, não por palavra-chave, e é consultada antes de explorar a intenção de um pedido novo
- [x] MEM-10: Ao detectar semelhança com rejeição anterior, o sistema traz o motivo original à tona e pergunta se o dono ainda pensa assim
- [x] MEM-11: Item já implementado não entra na base de rejeições
- [x] MEM-12: Motivo temporário, do tipo falta de tempo agora, não entra na base de rejeições

### Modo grill (GRILL)

- [ ] GRILL-01: O grill é um modo dentro da skill de brainstorm, não uma skill nova, e faz perguntas ilimitadas, uma por vez
- [ ] GRILL-02: Tarefa trivial continua em zero pergunta; tarefas pequena, média e grande entram em grill automaticamente
- [ ] GRILL-03: O grill também entra por pedido manual, por flag e por gatilho em linguagem natural, e o pedido manual tem precedência sobre a classificação automática: tarefa classificada como trivial entra em grill quando o dono pede
- [ ] GRILL-04: Cada pergunta do grill traz resposta recomendada e aplica a regra de fato contra decisão
- [ ] GRILL-05: As perguntas seguem a ordem de dependência da árvore de decisão, e toda pergunta que depende de resposta anterior declara de qual depende, de modo que a ordem fique verificável na transcrição da rodada
- [ ] GRILL-06: Palavra de parada encerra as perguntas na primeira tentativa, sem checkpoint e sem pedido de confirmação, seguindo direto para a destilação
- [ ] GRILL-07: A cada três perguntas aparece o checkpoint de duas opções (fechar e seguir, ou mais perguntas)
- [ ] GRILL-08: Quando não resta pergunta capaz de mudar o design, o agente declara isso explicitamente e propõe fechar, em vez de simplesmente parar
- [ ] GRILL-09: Termo de domínio e decisão que surgem durante o grill são gravados no instante em que caem, nunca acumulados para gravação em lote no fim
- [ ] GRILL-10: O fim das perguntas não substitui a aprovação do design: o gate de aprovação continua exigido

### Honestidade da prova (PROVA)

- [ ] PROVA-01: Antes de planejar, as fronteiras públicas onde o teste vai encostar são esboçadas e confirmadas com o dono
- [ ] PROVA-02: O esboço declara, por fronteira, se ela já existe ou é nova e em que nível está, prefere a existente e a mais alta, e o alvo é uma fronteira: qualquer número maior que um vem com uma linha de justificativa no próprio campo
- [ ] PROVA-03: O artefato de plano pronto gerado a partir deste ciclo tem campo obrigatório de fronteiras confirmadas e não passa no gate sem ele. A fronteira é nomeada como contrato público (módulo exportado, interface, comando ou rota), nunca como caminho de arquivo. Plano pronto anterior a este ciclo passa no gate e registra a ausência do campo como aviso, sem bloquear
- [ ] PROVA-04: O log de aprovações passa a aceitar a entrada de fronteiras confirmadas sob o rótulo de seams confirmados, somando ao vocabulário fechado do gate em vez de substituí-lo, e o conjunto aceito é ampliado para reconhecer as gramáticas de evidência já gravadas em disco. A entrada é aditiva: a fase continua exigindo a evidência do tipo dela. O leitor do gate localiza os campos por conteúdo e não por posição fixa: o escopo pelo número da fase em qualquer das notações em uso, o veredito pela palavra de veredito e a evidência pelo prefixo do campo, funcionando com ou sem a coluna do agente. Só é ignorada a linha que não carrega veredito nenhum, como o fragmento não estruturado do topo do arquivo. O alvo é a leitura do histórico: o escritor oficial já emite o formato documentado de seis colunas e não muda
- [ ] PROVA-05: A execução fica proibida de criar fronteira de teste não prevista no plano: ao precisar de uma, escala em vez de inventar
- [ ] PROVA-06: A doutrina de TDD contém a regra anti-tautologia, com par de exemplos bom e ruim lado a lado, no mesmo cenário
- [ ] PROVA-07: A verificação estática detecta teste tautológico por heurística: bloco de asserção que repete a mesma operação da implementação, ou valor esperado computado dentro do próprio teste
- [ ] PROVA-08: A heurística de tautologia sinaliza o achado para confirmação do revisor e não bloqueia o gate por conta própria

**Fora de escopo da fase 16**: o template do plano pronto ainda descreve aprovações de papéis removidos na versão 2 (CEO, chiefs e supervisores). Esta fase edita esse template apenas para acrescentar o campo de fronteiras confirmadas. Remover o sedimento restante é passe separado, com briefing próprio.

### Planejamento por grafo (PLANO)

- [ ] PLANO-01: Cada plano de fase declara explicitamente de quais planos ele depende
- [ ] PLANO-02: A fronteira de execução (planos cujos bloqueadores estão todos prontos) é recalculada em tempo de execução a partir das arestas declaradas
- [ ] PLANO-03: A onda numerada continua existindo como visão de leitura e deixa de ser a verdade que define a ordem de execução
- [ ] PLANO-04: Quando um plano falha ou atrasa, a fronteira é recalculada e a ordem restante se reorganiza sem intervenção manual
- [ ] PLANO-05: Cadeia totalmente sequencial degrada naturalmente, sem caso especial
- [ ] PLANO-06: Projeto planejado antes das arestas continua executando pela visão de onda numerada, sem migração obrigatória
- [ ] PLANO-07: Cada plano cabe em cem mil tokens de janela fresca, e a decisão de quebrar uma fase em vários planos registra a estimativa usada
- [ ] PLANO-08: Regras de tamanho e de quantidade são expressas em número. A verificação estática recusa regra de tamanho enunciada apenas por adjetivo, contra a lista fechada de adjetivos declarada na própria doutrina
- [ ] PLANO-09: Plano fica proibido de conter caminho de arquivo e trecho de código
- [ ] PLANO-10: A única exceção é trecho vindo de protótipo que codifica uma decisão com mais precisão que a prosa, inlinado apenas nas partes ricas em decisão e marcado como origem protótipo
- [ ] PLANO-11: Todo plano tem campo obrigatório de fora de escopo
- [ ] PLANO-12: Os templates de plano trazem exemplo ruim anotado ao lado do exemplo bom, com o motivo de cada linha ruim ser ruim
- [ ] PLANO-13: A leitura de planos e de resumos de uma fase reconhece as duas convenções de nome em uso no repositório (identificador antes do rótulo e rótulo antes do identificador, com ou sem prefixo de número da fase), e a derivação da fronteira enxerga todos os planos gravados por qualquer uma delas. O mesmo vale para o pareamento entre resumo e plano, hoje falso-negativo em fase já concluída

**Fora de escopo da fase 17**: o template do plano pronto e os templates de plano carregam sedimento da versão anterior (aprovações de CEO, chiefs e supervisores). Esta fase edita esses templates apenas para acrescentar o campo de fora de escopo e o exemplo ruim anotado. Remover o sedimento restante é passe separado, com briefing próprio.

### Contexto e handoff (CTX)

- [ ] CTX-01: O trecho que vai do brainstorm até o plano pronto acontece em janela ininterrupta. Ao retomar um brainstorm sem plano pronto gravado, o planejamento detecta o corte, avisa o dono e reabre o trecho em vez de seguir com contexto parcial
- [ ] CTX-02: A sessão que orquestra limpa o contexto entre execuções de plano e declara essa limpeza no registro da fase. A regra é sobre a sessão do orquestrador, não sobre o subagente de execução, que já nasce com contexto fresco
- [ ] CTX-03: Existe limiar numérico de zona segura de contexto, declarado em percentual de janela ocupada, com valor padrão no arquivo de configuração do projeto, e com instrução explícita de não empurrar trabalho degradado e fazer handoff. O valor padrão é fechado no planejamento desta fase, como pergunta com recomendação, e não fica em aberto
- [ ] CTX-04: Existe primitiva de handoff que comprime a conversa num documento enxuto com o que está em voo, o porquê e o próximo passo, legível por uma sessão nova
- [ ] CTX-05: O documento de handoff é gravado em diretório temporário do sistema operacional e nunca é versionado
- [ ] CTX-06: O documento de handoff tem seção obrigatória de comandos sugeridos para a sessão seguinte
- [ ] CTX-07: O handoff referencia em vez de copiar: nada que já esteja nos artefatos do projeto é reproduzido, apenas apontado por caminho relativo
- [ ] CTX-08: Segredos (chave de API, senha, dado pessoal) são redigidos antes da escrita do handoff
- [ ] CTX-09: A distinção entre handoff e compactação está documentada em uma linha na doutrina: handoff bifurca, compactação continua
- [ ] CTX-10: O monitor de contexto deixa de apenas avisar e passa a oferecer a ação de handoff ao cruzar o limiar
- [ ] CTX-11: O documento de estado do projeto carrega o fio vivo e ponteiros, com o detalhe fechado morando no artefato da fase
- [ ] CTX-12: O documento de estado tem seção obrigatória de próximo comando sugerido

### Revisão em dois eixos (REV)

- [ ] REV-01: Os dois eixos de revisão (conformidade com o spec, e qualidade com segurança) rodam em paralelo, em subagentes isolados
- [ ] REV-02: Os achados dos dois eixos são reportados lado a lado, sob cabeçalhos separados, e é proibido fundir ou reordenar achados entre eixos
- [ ] REV-03: O resumo final apresenta o pior problema dentro de cada eixo e nunca elege um vencedor único entre eixos
- [ ] REV-04: O eixo de conformidade continua cego ao código, testando como usuário final, e a cegueira é garantida pelo conjunto de ferramentas concedido ao subagente, não apenas por instrução em texto
- [ ] REV-05: Cada eixo tem teto de saída de quatrocentas palavras, contado na saída do subagente, com truncamento avisado no excesso
- [ ] REV-06: Referência inválida e diff vazio falham antes do fan-out, sem gastar dois subagentes
- [ ] REV-07: Achado sem âncora não entra no relatório: o eixo de conformidade cita a linha do requisito, o eixo de qualidade cita o trecho alterado
- [ ] REV-08: Sem spec disponível, o eixo de conformidade pula e reporta a ausência, em vez de inventar requisito
- [ ] REV-09: O gate representa veredito por eixo, de modo que conformidade reprovada com qualidade aprovada seja registrável. O gate é conjuntivo: a fase só aprova com os dois eixos aprovados. O eixo já aprovado fica registrado e não é reexecutado na rodada de correção, que roda apenas o eixo reprovado. Linha antiga com veredito único continua sendo lida como veredito válido dos dois eixos, sem reescrita retroativa. A leitura da linha antiga é a mesma descrita em PROVA-04, e não uma segunda implementação

### Auditoria visual e escopada (AUD)

- [ ] AUD-01: Existe operação determinística que lista os arquivos mais tocados nos últimos commits, com número padrão de commits declarado e ajustável, e a auditoria usa essa lista para escolher onde aprofundar. O valor padrão é fechado no planejamento desta fase, como pergunta com recomendação, e não fica em aberto
- [ ] AUD-02: Quando não há concentração de mudança, a auditoria alarga a rede e declara que está fazendo isso
- [ ] AUD-03: A saída da auditoria é um arquivo HTML autocontido gravado em diretório temporário do sistema operacional, fora do repositório
- [ ] AUD-04: O relatório é aberto no navegador e o caminho absoluto é informado ao dono
- [ ] AUD-05: A auditoria não altera a árvore de trabalho nem o diff do repositório
- [ ] AUD-06: Cada achado é apresentado em card de formato fixo: arquivos, problema em uma frase, solução em uma frase, ganhos em bullets curtos, badge de força entre forte, vale explorar e especulativo, e o resultado do teste falsificador
- [ ] AUD-07: O relatório tem seção obrigatória de recomendação principal, dizendo qual achado atacar primeiro e por quê
- [ ] AUD-08: Existe gate duro entre diagnosticar e projetar: o auditor apresenta os candidatos, para, e faz uma única pergunta de handoff
- [ ] AUD-09: Cada achado publicado declara no card o resultado do teste falsificador (se removê-lo não concentra complexidade nem move métrica, ele não entra), e o relatório informa quantos achados foram descartados por esse teste
- [ ] AUD-10: Rejeição do dono com motivo estrutural vira registro de decisão, para impedir que auditorias futuras sugiram a mesma coisa
- [ ] AUD-11: Motivo efêmero ou auto-evidente não gera registro

### Névoa e fronteira do roadmap (WAY)

- [ ] WAY-01: Quando o questionamento não revelou pergunta aberta relevante, o planejamento se declara desnecessário e aponta a rota leve, em vez de gerar fases
- [ ] WAY-02: O roadmap tem seção formal para o que se pressente mas ainda não dá para especificar
- [ ] WAY-03: O teste de graduação dessa seção é declarado no próprio roadmap: a pergunta pode ser enunciada com precisão agora, e não se ela pode ser respondida agora
- [ ] WAY-04: Fechar uma fase gradua a névoa correspondente em fase nova e limpa a área graduada
- [ ] WAY-05: O roadmap tem seção de fora de escopo, separada do que foi feito e do que está por fazer, com uma linha de motivo por item
- [ ] WAY-06: A seção de fora de escopo fica fora do histórico de decisões, que registra apenas a rota efetivamente andada

### Regressão zero (REG)

Transversal: vale como critério de saída de cada uma das fases 13 a 20, não como fase própria.

- [ ] REG-01: Os sete comandos do UP continuam funcionando ao fim de cada fase entregue
- [ ] REG-02: Os quatro runtimes suportados continuam instalando e operando ao fim de cada fase entregue
- [ ] REG-03: Projeto com diretório de planejamento anterior a este ciclo continua funcionando, sem migração obrigatória. Verificado ao fim de cada uma das fases 13 a 20, e não apenas no fechamento do ciclo

## Fora do escopo do ciclo 2

Fronteira declarada pelo dono no briefing. Registrada aqui para não voltar como sugestão.

- Doutrina de desabilitar invocação por modelo. O sistema de origem precisa disso porque não tem orquestrador; o UP aposta no oposto.
- Auditoria do eixo de invocação das quatro skills (custo de carga de contexto por turno). Fica para um passe separado.
- Migração de armazenamento para issue tracker. O diretório de planejamento continua sendo a fonte.
- Port de skill inteira do sistema de origem (wayfinder, teach, ask-matt) e comando novo de protótipo.
- Corte de sedimento: template órfão, poda de instrução morta nos workflows, conversão de negações em positivo. É passe de refatoração com briefing próprio. As fases 16 e 17 tocam os templates apenas para acrescentar campo novo, conforme as linhas de fora de escopo registradas em PROVA e PLANO.
- Mudança no instalador e nos quatro runtimes além do que os artefatos novos exigirem. A distribuição do glossário interno (MEM-01) cai dentro dessa exceção declarada, porque é artefato novo que só é fonte única se chegar aos quatro runtimes.

## Rastreabilidade do ciclo 2

| Requisito | Fase | Status |
|-----------|------|--------|
| DIST-01, DIST-02, DIST-03 | Fase 11 | Completo |
| CICLO-01, CICLO-02 | Fase 12 | Completo |
| PERG-01 a PERG-06 | Fase 13 | Completo |
| MEM-01 a MEM-12 | Fase 14 | Pendente |
| GRILL-01 a GRILL-10 | Fase 15 | Pendente |
| PROVA-01 a PROVA-08 | Fase 16 | Pendente |
| PLANO-01 a PLANO-13 | Fase 17 | Pendente |
| CTX-01 a CTX-12 | Fase 18 | Pendente |
| REV-01 a REV-09 | Fase 18 | Pendente |
| AUD-01 a AUD-11 | Fase 19 | Pendente |
| WAY-01 a WAY-06 | Fase 20 | Pendente |
| REG-01, REG-02, REG-03 | Fases 13 a 20 | Pendente |

### Detalhamento por fase

| Fase | Requisitos | Total |
|------|-----------|-------|
| 11 | DIST-01, DIST-02, DIST-03 | 3 |
| 12 | CICLO-01, CICLO-02 | 2 |
| 13 | PERG-01, PERG-02, PERG-03, PERG-04, PERG-05, PERG-06, REG-01, REG-02, REG-03 | 9 |
| 14 | MEM-01 a MEM-12, REG-01, REG-02, REG-03 | 15 |
| 15 | GRILL-01 a GRILL-10, REG-01, REG-02, REG-03 | 13 |
| 16 | PROVA-01 a PROVA-08, REG-01, REG-02, REG-03 | 11 |
| 17 | PLANO-01 a PLANO-13, REG-01, REG-02, REG-03 | 16 |
| 18 | CTX-01 a CTX-12, REV-01 a REV-09, REG-01, REG-02, REG-03 | 24 |
| 19 | AUD-01 a AUD-11, REG-01, REG-02, REG-03 | 14 |
| 20 | WAY-01 a WAY-06, REG-01, REG-02, REG-03 | 9 |
