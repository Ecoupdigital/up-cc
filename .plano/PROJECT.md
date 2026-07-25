# UP (up-cc)

## O que é isso

`up-cc` é um sistema de meta-prompting em português, publicado no npm, que se instala dentro do diretório de configuração de uma CLI de IA e passa a governar como aquela CLI conduz trabalho de software. A versão 2 reduziu a frota antiga a 7 comandos, 12 agentes, 4 skills e 12 workflows, tornou o sistema orientado a brainstorm (nenhum trabalho criativo antes de explorar a intenção) e nativo de GitHub por padrão (cada fase roda em worktree, branch e issue próprios e pergunta como aterrissar).

O ciclo de trabalho atual (fases 13 a 20) implanta as disciplinas levantadas na varredura das 22 skills do Matt Pocock, cruzadas com o inventário factual do UP v2. A tese é curta: o UP não vira o sistema dele. O que ele tem e o UP não tem são disciplinas, e disciplina é exatamente o que falta num pipeline autônomo. O que se importa aqui são mecanismos, não arquitetura.

Briefing de origem: `.plano/BRIEFING-tier-ab-grill.md`. Mapa do sistema e ponto de contato de cada item: `.plano/SYSTEM-DESIGN.md`.

## Valor central

Um pipeline autônomo só é confiável se ele perguntar o suficiente antes de agir, lembrar do que já foi decidido e recusado, e provar o que afirma. As três disciplinas do ciclo são: **perguntar melhor** (recomendação em toda pergunta, fato resolvido sozinho, grill como piso), **lembrar** (glossário, registro de decisão com alternativas rejeitadas, base de rejeições) e **provar de verdade** (fronteira de teste acordada antes, regra anti-tautologia, revisão em dois eixos que não se escondem um atrás do outro).

## Requisitos

### Validados

Já funcionam em produção e não são reabertos por este ciclo.

- [x] Sistema UP v2 publicado no npm com 7 comandos, 12 agentes, 4 skills e 12 workflows
- [x] Instalador para 4 runtimes (Claude Code, Gemini CLI, OpenCode, Codex CLI) com conversão de formato por runtime
- [x] Execução por fase com worktree, branch, issue e PR, com falha aberta quando não há integração de repositório
- [x] Ondas paralelas dentro da fase e ondas em sequência entre si
- [x] Gate determinístico de fase por log de aprovações, com evidência por tipo (lógica, visual, integração)
- [x] Teste visual antes do merge quando a fase tem interface
- [x] Persistência em `.plano/` que sobrevive à limpeza de contexto, com reinjeção do estado no início de sessão
- [x] Comandos do UP descobríveis como skills em runtime que lê a configuração nativa do Claude Code (fase 11)
- [x] Encerramento de fase em modo solo com repositório ativo aterrissa a fase de verdade (fase 12)
- [x] Ciclo 1 completo: auditoria por dimensão, ideação com pesquisa de mercado e integração com roadmap (fases 3 a 10)

### Ativos

Ciclo 2, treze itens em sete blocos. Detalhe por identificador em `.plano/REQUIREMENTS.md`.

- [ ] Bloco 1: toda pergunta com resposta recomendada e regra de fato contra decisão (fase 13)
- [ ] Bloco 2: glossário com sinônimos banidos, registro de decisão com gate de três condições e base de rejeições por conceito (fase 14)
- [ ] Bloco 1 (segunda metade): modo grill como piso automático, com palavra de parada, checkpoint a cada três perguntas e auto-convergência declarada (fase 15)
- [ ] Bloco 3: fronteiras de teste pré-acordadas no gate e regra anti-tautologia com heurística mecânica (fase 16)
- [ ] Bloco 4: grafo de bloqueio com fronteira derivada, tamanho medido em janela de contexto e durabilidade do plano (fase 17)
- [ ] Bloco 5: higiene de contexto prescrita com primitiva de handoff, e revisão em dois eixos paralelos que não se fundem (fase 18)
- [ ] Bloco 6: auditoria escopada por concentração de mudança, com relatório HTML e gate duro entre diagnosticar e projetar (fase 19)
- [ ] Bloco 7: auto-aborto do planejamento, seção de ainda não especificado e seção de fora de escopo no roadmap (fase 20)

### Fora do escopo

- Doutrina de desabilitar invocação por modelo. O sistema de origem precisa disso porque não tem orquestrador; o UP aposta no oposto, e copiar quebraria a premissa.
- Migração de armazenamento para issue tracker. O diretório de planejamento sobrevive à limpeza de contexto, funciona sem a linha de comando do GitHub e atravessa os quatro runtimes.
- Port de skill inteira do sistema de origem, e comando novo de protótipo.
- Corte de sedimento (template órfão, poda de instrução morta nos workflows, conversão de negações em positivo). É trabalho real e necessário, mas é passe de refatoração com briefing próprio.
- Auditoria do custo de carga de contexto das quatro skills. Passe separado.
- Mudança no instalador e nos quatro runtimes além do que os artefatos novos exigirem.

## Contexto

**Stack**: Node.js CommonJS, zero dependência de produção, Markdown com frontmatter YAML como linguagem de definição, testes com `node:test` e `node:assert`.

**Modo**: brownfield puro. Nenhuma tecnologia nova entra neste ciclo, então não houve pesquisa de ecossistema: a pesquisa foi do próprio repositório, com inventário verificado dos 7 comandos, 12 agentes, 4 skills, 12 workflows, 19 references, 19 templates, da CLI de ferramentas (3981 linhas mais quatro bibliotecas) e dos três hooks.

**Fatos do repositório que condicionaram o desenho** (verificados nesta passagem):

- Glossário, memória de rejeição, fronteira de teste, checagem de teste honesto, handoff e grafo de dependência entre planos não existem hoje em nenhuma camada.
- A skill de brainstorm tem tabela de tiers, override do usuário e checkpoint de fechamento de duas opções, mas nenhum modo de questionamento profundo.
- A reference de questionamento traz filosofia e anti-padrões, mas não proíbe perguntar o que o agente poderia descobrir sozinho, nem exige recomendação junto da pergunta.
- O revisor roda dois estágios em sequência travada: qualidade e segurança só rodam depois de conformidade passar, o que faz problema de segurança nunca aparecer na rodada em que o spec falha.
- O primeiro estágio do revisor é deliberadamente cego ao código, o que é força do UP e é preservado.
- O log de aprovações tem três formas em uso: a gramática documentada no workflow de governança, a que as fases 11 e 12 realmente gravaram (que o filtro fechado do gate não reconhece em nenhum dos dois campos) e um fragmento não estruturado nas primeiras linhas do arquivo. O gate de hoje reprovaria o próprio histórico, então compatibilidade aqui não se obtém por inação.
- O índice de planos da fase só reconhece plano com nome terminando em `-PLAN.md`, e a fase 11 gravou o plano como `PLAN-001.md`. Verificado por execução: o índice devolve lista de planos vazia para a fase 11, e marca a fase 3 como sem resumo apesar de o arquivo de resumo existir em disco.
- A onda é hoje dado primário lido do frontmatter do plano, e não derivada de dependência.

## Restrições

- Português brasileiro com acentuação correta em toda interface e em todo artefato novo.
- Zero travessão longo e zero travessão curto em qualquer arquivo. Ponto final, vírgula, dois-pontos, parênteses ou hífen normal.
- Zero placeholder, TBD ou TODO em artefato novo.
- Commits atômicos, um por mudança lógica.
- Nenhuma dependência de produção nova.
- Projeto com diretório de planejamento anterior a este ciclo não pode quebrar.
- Os sete comandos e os quatro runtimes continuam funcionando ao fim de cada fase.

## Decisões do dono neste ciclo

Tomadas no brainstorm que gerou o briefing, mais a decisão D7, tomada na rodada de validação dos requisitos. Fonte de verdade, não reabertas.

| # | Decisão | Alternativas rejeitadas |
|---|---------|-------------------------|
| D1 | Escopo aprovado: Tier A (itens 1 a 5), Tier B (itens 6 a 12) e modo grill | Fatiar em ondas menores ao longo de semanas |
| D2 | Grill vira o piso automático em pequena, média e grande; trivial fica em zero pergunta | Grill só sob comando (exige lembrar de pedir, e o problema declarado é justamente perguntar de menos); grill só em média e grande (deixaria pequena rasa) |
| D3 | Glossário e registro de decisão moram dentro do diretório de planejamento | Convenção do sistema de origem, com arquivo na raiz e pasta de decisões separada (espalha artefato em dois lugares e suja a raiz do projeto do cliente); híbrido (regra com exceção é mais difícil de obedecer) |
| D4 | Não copiar a doutrina de desabilitar invocação por modelo | Copiar quebra a premissa: o sistema dele não tem orquestrador, o UP aposta no oposto |
| D5 | Não copiar issue tracker como armazenamento substituindo o diretório de planejamento | O diretório sobrevive à limpeza de contexto, funciona sem a linha de comando do GitHub e atravessa os quatro runtimes |
| D6 | Do wayfinder entram só três mecanismos, como bloco 7 | Portar a skill inteira sobrepõe o brainstorm e o planejamento, e é inchaço |
| D7 | O gate é conjuntivo: a fase só aprova com os dois eixos aprovados. O eixo já aprovado fica registrado e não é reexecutado na rodada de correção, que roda apenas o eixo reprovado | Gate disjuntivo, em que um eixo aprovado libera a fase, apagaria o motivo de separar os eixos; e reexecutar os dois eixos a cada correção pagaria de novo por um veredito que já existe |

## Decisões do arquiteto nesta estruturação

Tomadas nesta passagem, em modo autônomo, sem consultar o dono. Cada uma com o motivo.

| # | Decisão | Motivo |
|---|---------|--------|
| A1 | Fatiamento sugerido pelo dono mantido integralmente: fases 13 a 20, uma por bloco, com o bloco 1 partido em formato de pergunta (13) e modo grill (15) | O próprio briefing manda decompor por bloco (risco 6). O bloco 1 se parte porque o grill depende do bloco 2, e essa é uma aresta, não uma preferência. Nenhum outro corte melhora a ordenação |
| A2 | Fases pesadas (17, 18, 19) não foram divididas em mais fases | O UP já tem a unidade certa para volume: vários planos por fase, agrupados em ondas. Fase é unidade de tema, PR e gate; plano é unidade de trabalho. Multiplicar fases só multiplicaria cerimônia para um dono declaradamente impaciente com processo |
| A3 | Regressão zero (critério 12 do briefing) virou critério de saída de cada fase, e não fase própria no fim | Uma fase de regressão no fim violaria a ordem declarada pelo dono (o bloco 7 fecha o roadmap) e deixaria oito fases acumularem regressão antes da primeira detecção |
| A4 | A heurística anti-tautologia sinaliza e não bloqueia o gate | Risco 5 do briefing, com a recomendação do próprio dono. Falso positivo bloqueante em cima de teste honesto custa mais caro que uma tautologia passando e sendo pega pelo revisor |
| A5 | O grafo de bloqueio entra como campo opcional, com degradação para a onda numerada existente, sem migração | Risco 3 do briefing. Projeto com planejamento antigo não pode quebrar, e migração destrutiva de artefato de cliente é irreversível |
| A6 | O gate passa a representar veredito por eixo, e o desfecho desse estado é a decisão D7 do dono | Risco 4 do briefing. Hoje esse estado não é representável, e sem representá-lo os dois eixos voltam a se fundir na hora de gravar. Escolher entre gate conjuntivo e disjuntivo não é fato do briefing, então subiu ao dono e voltou como D7 |
| A7 | Caminho de arquivo é permitido no documento de design do sistema e proibido em requisitos, roadmap e planos | Risco 7 do briefing. O design é fotografia verificada do repositório e precisa de endereço; requisito e plano são escritos num momento e lidos noutro, com o código já mexido |
| A8 | Nenhum arquivo de tokens de design foi criado | A única superfície visual nova é o relatório de auditoria em HTML autocontido, gerado em diretório temporário. Ele herda o vocabulário da reference de marca existente. Tokens servem a aplicação web com muitas telas, que não é o caso |
| A9 | O bloco histórico (fases 1 a 10 no roadmap e categorias do ciclo 1 nos requisitos) foi preservado literalmente, inclusive na grafia sem acentuação e no "TBD" da fase 10 | A regra de preservação do histórico é explícita e vale mais que a regra de escrita para aquele bloco. O número real de planos da fase 10 já está na tabela de progresso (2/2). Todo texto novo segue a regra de escrita |
| A10 | O título dos dois documentos passou a ser de escopo de repositório, e não do ciclo 1 | Com fases de três ciclos diferentes no mesmo arquivo, manter o título do primeiro ciclo tornaria o documento mentiroso. Nenhum requisito foi renumerado ou removido |
| A11 | Fases 11 e 12 registradas como concluídas a partir do log de aprovações, das issues, dos PRs e dos commits | Elas foram executadas fora do roadmap. Sem o registro, a numeração nova colidiria com branches e issues já existentes, e a rastreabilidade ficaria com buraco |
| A12 | A numeração do registro de decisão é resolvida por operação determinística, não por contagem feita pelo modelo | Contagem por modelo colide e regride. O UP já resolve identidade e ordem por ferramenta determinística, e essa é a convenção da casa |
| A13 | O grafo de bloqueio do ciclo foi desenhado no próprio roadmap, antes de o item 7 existir | Risco 2 do briefing pede que a ordem apareça como aresta e não como sequência arbitrária. Escrever o grafo agora é o primeiro teste de utilidade do mecanismo que a fase 17 vai automatizar |
| A14 | Requisito novo PLANO-13: a leitura de planos e de resumos reconhece as duas convenções de nome em uso | Verificado por execução, o índice devolve lista vazia para a fase 11 e resumo não pareado para a fase 3. Sem o requisito, a fronteira derivada da fase 17 nasceria cega justamente para o ciclo que acabou de rodar, e a decisão registrada no design não chegaria ao executor |
| A15 | A compatibilidade do log de aprovações passou a ser descrita por operação, e não por promessa | O gate filtra por vocabulário fechado que nenhuma das linhas gravadas satisfaz, e ainda há fragmento não estruturado no topo do arquivo. Compatibilidade por inação seria falsa: ou o leitor amplia o conjunto aceito e tolera o que não reconhece, ou o gate reprova o próprio histórico |
| A16 | A exigência de fronteiras confirmadas ganhou cláusula de validade a partir deste ciclo | Sem a cláusula, PROVA-03 contradiria REG-03: todo projeto planejado antes do ciclo reprovaria no primeiro build por falta de um campo que não existia quando o plano foi escrito |
| A18 | O leitor do log de aprovações localiza campo por conteúdo, e é um só para o gate de fronteiras e para a revisão em dois eixos | O gate quebra em três pontos contra as linhas reais, em ordem: seletor por nome de agente, leitura de veredito por posição de coluna e vocabulário fechado. Fechar só o vocabulário deixaria o seletor barrando tudo antes. E dois leitores do mesmo arquivo produziriam instruções opostas para a mesma linha: um ignora, o outro promete ler |
| A19 | A janela do verbete de onda fecha por critério de saída na fase 17, sem inverter o grafo | As fases 14 e 17 são irmãs independentes, então a 14 pode publicar o glossário nos quatro runtimes antes de a 17 entregar a derivação. Criar aresta entre elas serializaria o ciclo por uma frase; conferir o verbete publicado contra o comportamento entregue custa uma linha |
| A20 | O grafo do ciclo ganhou duas camadas: aresta 16 antes de 18 (dependência lógica) e serialização declarada por posse de arquivo entre 14, 16, 17 e 18 | A auditoria de planejamento achou 19 arquivos disputados entre fases que o grafo mandava paralelizar: o despachante da CLI é escrito por sete das oito fases e o motor de execução por onze planos de seis fases. Rejeitada a alternativa de virar cadeia única, transformando a disputa em aresta: aresta significa "preciso do que você entrega", e usá-la para representar disputa de recurso faria o grafo mentir sobre o motivo da ordem, justamente no ciclo que constrói o mecanismo de fronteira derivada. Dependência lógica é aresta, disputa de arquivo é exclusão mútua, e as duas ficam em campos separados |
| A21 | O mapa do sistema passa a descrever 12 agentes hoje e 13 ao fim do ciclo, com o revisor único dando lugar a dois agentes de eixo | A divisão é forçada por REV-01 mais REV-04: neste sistema o conjunto de ferramentas é declarado no arquivo do agente, então a cegueira do eixo de conformidade só é estrutural se vier de um arquivo com ferramentas assimétricas. Um agente único com sinalizador de modo carregaria as ferramentas de leitura nos dois modos e a cegueira voltaria a ser promessa. O mapa descrever só o estado de hoje deixaria o documento mentindo depois da fase 18 |
| A17 | A inconsistência do ciclo 1 foi registrada e não corrigida | A fase 7 aparece com um de dois planos, e a fase 10 aparece desmarcada na lista e concluída na tabela de progresso. Qualquer correção exigiria editar o bloco das fases 1 a 10, que precisa continuar idêntico byte a byte. Fica aqui como dívida conhecida do histórico, e não como erro silencioso |

## Decisões do ciclo 1 (preservadas)

Coluna de resultado preservada como foi gravada em março. As fases 3 a 10 fecharam depois; o resultado efetivo está na tabela de progresso do roadmap.

| Decisao | Justificativa | Resultado |
|---------|---------------|-----------|
| Dois comandos separados (/up:melhorias e /up:ideias) | Melhorias analisa o existente, ideias sugere o novo -- escopos distintos | Pendente |
| Agentes paralelos + sintetizador (hibrido) | Cobertura completa por dimensao + cruzamento de insights | Pendente |
| Standalone (sem /up:novo-projeto) | Baixa barreira de entrada, cria .plano/ se nao existir | Pendente |
| Analise estatica sem browser | CSS/HTML/componentes dao contexto suficiente de UX | Pendente |
| Mapa de cobertura obrigatorio | Garantir que nenhum arquivo relevante foi ignorado | Pendente |
| Formato estruturado por sugestao | Arquivo, linha, problema, sugestao, esforco, impacto -- acionavel | Pendente |
| Matriz esforco x impacto | Priorizacao objetiva em quadrantes | Pendente |
| /up:ideias pesquisa web + codigo | Concorrentes e tendencias alem do que ja existe no codigo | Pendente |

---
*Última atualização: 2026-07-25, ao estruturar o ciclo 2 (fases 13 a 20)*
