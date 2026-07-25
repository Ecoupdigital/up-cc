---
phase: 18-contexto-e-revisao
plan: "004"
type: glue
autonomous: true
wave: 1
depends_on: []
requirements: [REV-01, REV-04, REV-05, REV-07, REV-08]
objective: "Dois agentes de revisao isolados, um por eixo, com cegueira ao codigo vinda do conjunto de ferramentas"
prova: "glue:smoke"
files_modified:
  - up/agents/up-revisor-conformidade.md
  - up/agents/up-revisor-qualidade.md
  - up/agents/up-revisor.md
  - up/bin/lib/core.cjs
  - up/bin/install.js
  - up/commands/plan.md
  - up/commands/build.md
  - up/skills/up-tdd/SKILL.md
  - up/skills/up-verificar-antes-de-concluir/SKILL.md
  - up/workflows/plan.md
  - up/README.md
  - CLAUDE.md
  - .plano/SYSTEM-DESIGN.md
  - .plano/fases/18-contexto-e-revisao/evidencia/004-inventario.txt
  - .plano/fases/18-contexto-e-revisao/evidencia/004-smoke.txt
must_haves:
  truths:
    - "Existem dois agentes de revisao isolados, um por eixo, com conjuntos de ferramentas diferentes"
    - "O eixo de conformidade nao tem nenhuma ferramenta capaz de ler codigo-fonte"
    - "Cada eixo declara teto de saida em quatrocentas palavras e avisa quando trunca"
    - "Achado sem ancora nao entra no relatorio de nenhum dos dois eixos"
    - "Sem spec disponivel, o eixo de conformidade reporta a ausencia em vez de inventar requisito"
    - "Nenhuma instrucao escrita no revisor unico pelas fases 14 e 16 se perde na divisao"
  artifacts:
    - path: "up/agents/up-revisor-conformidade.md"
      provides: "Eixo de conformidade, cego ao codigo pelo conjunto de ferramentas concedido"
    - path: "up/agents/up-revisor-qualidade.md"
      provides: "Eixo de qualidade e seguranca, ancorado no trecho alterado"
  key_links:
    - from: "up/bin/lib/core.cjs"
      to: "os dois agentes novos"
      via: "mapa de papel por agente, usado pelo roteamento de modelo"
    - from: "up/bin/install.js"
      to: "os dois agentes novos"
      via: "lista de agentes com permissao de escrita no runtime de sandbox"
---

# Fase 18 Plano 004: Os dois eixos como subagentes isolados

<objective>
Quebrar o revisor único em dois agentes de eixo isolados, para que conformidade e qualidade possam rodar ao mesmo tempo, com a cegueira do eixo de conformidade vindo do conjunto de ferramentas concedido e não de instrução em texto, preservando integralmente o que as fases 14 e 16 escreveram no agente que sai.
</objective>

**Onda:** 1. **Depende de:** nada dentro da fase. A fase inteira roda depois das fases 14 e 16 (ver CONTEXT.md, aresta e serialização declaradas).
**Tipo de prova:** smoke. A prova de REV-04 é a lista de ferramentas concedidas, lida do frontmatter e registrada em `evidencia/`.

## Por que quebrar

Hoje o revisor único roda conformidade e qualidade em sequência travada: o segundo estágio só começa se o
primeiro passar, com a regra escrita de que a ordem é inviolável. Quando a conformidade reprova, os
problemas de segurança nunca são descobertos naquela rodada. O sistema esconde problema de qualidade
atrás de falha de conformidade.

A separação não é cosmética: é o que permite dois vereditos ao mesmo tempo, e é pré-requisito do gate
conjuntivo do plano 007.

## Contexto

@.plano/fases/18-contexto-e-revisao/CONTEXT.md - decisões P2 e P3, e a ordem entre fases
@up/agents/up-revisor.md - agente que será aposentado, e de onde sai todo o conteúdo dos dois novos
@.plano/codebase/CONVENTIONS.md - formato de frontmatter de agente, com ferramentas como string
@.plano/SYSTEM-DESIGN.md - seções 2, 6 e 8, que contam agentes e declaram a matriz de escrita

Este plano cria contratos. Quem orquestra é o plano 006, quem muda o gate é o plano 007. Nada aqui
dispara subagente nem toca no log de aprovações.

## Tarefas

<task id="1" type="auto">
<files>.plano/fases/18-contexto-e-revisao/evidencia/004-inventario.txt (novo)</files>
<action>
Inventariar o revisor único ANTES de dividi-lo. Esta tarefa existe porque duas fases irmãs escrevem neste mesmo arquivo antes desta fase rodar, e a divisão não pode perder o que elas escreveram.

Ler `up/agents/up-revisor.md` inteiro e produzir o inventário em `evidencia/004-inventario.txt`, com uma linha por bloco, no formato: título do bloco, estágio de origem (conformidade ou qualidade), eixo de destino, e marcador textual único que permita conferir a migração por busca depois.

Dois blocos são de origem conhecida e precisam aparecer nomeados no inventário:

Confirmação de achado de tautologia, escrita pela fase 16 na etapa de qualidade. Destino: eixo de qualidade, porque confirmar tautologia exige ler o código do teste. Marcador de conferência: a palavra tautologia.

Ponteiros de glossário, escritos pela fase 14 em todos os agentes. Destino: os dois eixos, porque cada um herda os trechos em que os termos aparecem. Marcador de conferência: o caminho do verbete apontado.

Se qualquer um dos dois blocos NÃO estiver presente no arquivo, é sinal de que a fase correspondente ainda não rodou. Nesse caso, PARAR e escalar, em vez de dividir um arquivo que ainda vai receber escrita de outra fase. A ordem entre fases está declarada no contexto da fase, e violá-la faz a instrução da outra fase sumir do produto sem que gate nenhum perceba.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && grep -qi "tautologia" up/agents/up-revisor.md && test -s .plano/fases/18-contexto-e-revisao/evidencia/004-inventario.txt && echo "inventario ok"</automated></verify>
<done>O inventário lista todos os blocos do revisor único com origem, eixo de destino e marcador de conferência, e nomeia explicitamente o bloco de tautologia da fase 16 e os ponteiros de glossário da fase 14. A ausência de qualquer um deles parou o plano.</done>
</task>

<task id="2" type="auto">
<files>up/agents/up-revisor-conformidade.md (novo)</files>
<action>
Criar o agente do eixo de conformidade, com frontmatter no padrão do repositório.

A decisão central está no campo de ferramentas: o agente recebe apenas a ferramenta de escrita e o conjunto do servidor de navegação. Sem leitura de arquivo, sem busca por conteúdo, sem busca por nome, sem execução de comando. Com esse conjunto ele não consegue ler código-fonte, resumo do executor, plano nem relatório de verificação, ainda que queira. É isso que REV-04 exige: a cegueira vem do que foi concedido, e não de um parágrafo pedindo para não olhar.

Consequência que o corpo absorve: os requisitos chegam inlinados no prompt, porque ele não pode lê-los do disco. O corpo declara que a única fonte de verdade sobre o que deveria existir é o bloco de requisitos recebido, e que ele navega apenas para o endereço de aplicação informado, nunca para endereço de arquivo local.

O corpo herda do agente antigo o primeiro estágio inteiro, conforme o inventário da tarefa 1: a premissa cética de que o implementador terminou rápido demais; a busca por requisito faltante, trabalho além do combinado e mal-entendido; a tabela de testabilidade por tipo de requisito; o roteiro de teste por navegação; e o cálculo de confiança. Mais os ponteiros de glossário que couberem no texto herdado.

O agente não sobe aplicação, porque sem execução de comando ele não consegue. O endereço base chega pronto no prompt, e a subida é do orquestrador, no plano 006. Se o endereço não responder, o agente reporta impedimento, e não reprovação de requisito: aplicação fora do ar não é prova de que o requisito falhou.

Saída: um relatório próprio no diretório da fase, com nome que identifica o eixo, e nada mais. Não escreve no relatório do outro eixo e não escreve no log de aprovações, conforme a matriz de escrita.
</action>
<verify><automated>head -8 up/agents/up-revisor-conformidade.md | grep -E "^tools:" | grep -vE "Read|Grep|Glob|Bash|Edit" | grep -q "Write" && echo "cegueira estrutural confirmada"</automated></verify>
<done>O agente existe, e a linha de ferramentas do frontmatter contém escrita e navegação e não contém nenhuma ferramenta capaz de ler arquivo, buscar conteúdo, buscar nome ou executar comando.</done>
</task>

<task id="3" type="auto">
<files>up/agents/up-revisor-qualidade.md (novo)</files>
<action>
Criar o agente do eixo de qualidade e segurança, com frontmatter no padrão do repositório.

Ferramentas: leitura de arquivo, busca por conteúdo, busca por nome, execução de comando e escrita. Sem o conjunto de navegação. A assimetria é deliberada e vale nos dois sentidos: o eixo que lê código não dirige o navegador, e o eixo que dirige o navegador não lê código. Sem isso, o eixo de qualidade poderia produzir prova de nível de usuário e a separação viraria decoração.

O corpo herda do agente antigo o segundo estágio inteiro, conforme o inventário: critérios de qualidade de código, lista de requisitos de produção, seis categorias de segurança com a varredura automatizada que as inicia, e escala de severidade. Herda também, obrigatoriamente, o bloco de confirmação de achado de tautologia escrito pela fase 16, com o mesmo texto e a mesma semântica de dois vereditos, confirmado ou descartado com motivo em uma linha. Perder esse bloco deixaria PROVA-08 meio entregue sem que nenhum gate percebesse.

Mantém intacta a proibição de ler ou citar conteúdo de arquivo de credencial. Saída commitada com segredo dentro é incidente, e agora são dois relatórios em vez de um.

Este agente também assume os escopos que o revisor único atendia fora do gate de fase: a revisão de planejamento e a revisão de entrega consolidada. Os dois são revisões que leem artefato, que é exatamente o conjunto de ferramentas dele. O corpo declara os três escopos e o que muda em cada um.
</action>
<verify><automated>head -8 up/agents/up-revisor-qualidade.md | grep -E "^tools:" | grep -q "Read" && head -8 up/agents/up-revisor-qualidade.md | grep -E "^tools:" | grep -vq "playwright" && grep -qi "tautologia" up/agents/up-revisor-qualidade.md && echo "eixo de qualidade ok"</automated></verify>
<done>O agente existe, lê e executa mas não navega, e o bloco de confirmação de tautologia da fase 16 está presente no corpo dele.</done>
</task>

<task id="4" type="auto">
<files>up/agents/up-revisor-conformidade.md (editar), up/agents/up-revisor-qualidade.md (editar)</files>
<action>
Escrever nos dois agentes as três regras novas: âncora, teto de saída e, no eixo de conformidade, ausência de spec.

Âncora. Achado sem âncora não entra no relatório. A regra é a mesma nos dois eixos e a âncora é diferente em cada um, porque a fonte de verdade de cada um é diferente. No eixo de conformidade, a âncora é o identificador do requisito mais a linha dele dentro do bloco recebido: sem identificador, o achado não é conformidade, é opinião. No eixo de qualidade, a âncora é o trecho alterado, citado por arquivo e linha, e a linha tem de cair dentro do que o diff daquela fase mudou: achado sobre código que a fase não tocou não entra, porque revisão de fase não é auditoria de repositório, e é essa distinção que impede o relatório de virar lista genérica.

Formato fixo, porque o plano 006 valida a âncora de forma determinística e formato livre não é validável. Cada achado é um título de terceiro nível com identificador e resumo em uma linha. A linha imediatamente seguinte começa pelo rótulo de âncora, o mesmo nos dois eixos, e traz, na conformidade, o identificador do requisito e o número da linha dentro do bloco recebido, e, na qualidade, o caminho e o número da linha dentro do trecho alterado. Depois vêm severidade, problema e correção sugerida.

Os dois declaram o que fazer com o achado descartado: contar. O relatório informa quantos foram descartados por falta de âncora, para que o descarte seja visível e não vire censura silenciosa.

Frontmatter do relatório de cada eixo, que é dado estruturado consumido pelo orquestrador, com estes campos: eixo, veredito do eixo, contagem de achados publicados, contagem de descartados por falta de âncora, contagem de palavras do corpo e identificador do pior achado do eixo. Sem eles o plano 006 não monta o relatório lado a lado nem o resumo por eixo.

Teto de saída. Quatrocentas palavras no corpo do relatório de cada eixo, declarado em número escrito. O teto força priorização: com espaço infinito, o modelo lista tudo e não decide nada. Cada agente conta as palavras do próprio corpo antes de devolver e, ao ultrapassar, corta pelo fim e acrescenta a linha de aviso dizendo que a saída foi truncada no teto e quantas palavras ficaram de fora. A ordem de corte é declarada: o pior problema do eixo vem primeiro, então o que cai é sempre o menos grave. O teto não conta o frontmatter.

Ausência de spec, apenas no eixo de conformidade. Quando o bloco de requisitos recebido está vazio ou não contém nenhum identificador, o agente não avalia nada: escreve o relatório com veredito de eixo pulado e a razão explícita, e não produz achado nenhum. O corpo declara por que, isto é, que inventar requisito a partir do que o produto parece fazer é fabricar a régua depois de medir, e declara a consequência no gate: eixo pulado não aprova nem reprova, e escala, conforme a decisão P3.
</action>
<verify><automated>for a in conformidade qualidade; do grep -qi "quatrocentas palavras" up/agents/up-revisor-$a.md || { echo "teto faltando em $a"; exit 1; }; grep -qi "ncora" up/agents/up-revisor-$a.md || { echo "ancora faltando em $a"; exit 1; }; done; grep -qi "pulado" up/agents/up-revisor-conformidade.md && echo "regras ok"</automated></verify>
<done>Os dois agentes declaram teto de quatrocentas palavras com aviso de truncamento, regra de âncora do próprio eixo com formato fixo e contagem de descartados, e campos de frontmatter do relatório. O eixo de conformidade declara o pulo por ausência de spec com a razão.</done>
</task>

<task id="5" type="auto">
<files>up/agents/up-revisor.md (remover), up/bin/lib/core.cjs (editar: mapa de papel por agente), up/bin/install.js (editar: lista de agentes com escrita no sandbox e comentário de contagem)</files>
<action>
Aposentar o revisor único e atualizar os registros de código.

Remover `up/agents/up-revisor.md`. Todo o conteúdo dele já migrou, conforme o inventário da tarefa 1. Deixá-lo no lugar criaria duas doutrinas de revisão convivendo, que é a forma mais cara de dívida neste sistema.

Em `up/bin/lib/core.cjs`, no mapa de papel por agente, remover a entrada do revisor único e acrescentar as duas novas, ambas no papel de revisão. Sem isso o roteamento de modelo perde a referência e cai no padrão sem avisar.

Em `up/bin/install.js`, na lista de agentes que recebem permissão de escrita no runtime de sandbox, remover a entrada antiga e acrescentar as duas novas: os dois escrevem relatório, então os dois precisam de escrita. Atualizar o comentário que declara a contagem de agentes.

O manifesto de referências por agente, que vive no despachante da CLI, ainda cita o revisor único. Não é tocado aqui, porque naquele arquivo trabalha outro plano desta mesma onda. A entrada órfã é inofensiva enquanto ninguém spawna o agente removido, e a limpeza dela é tarefa declarada do plano 006.
</action>
<verify><automated>test ! -f up/agents/up-revisor.md && node -e "const c=require('./up/bin/lib/core.cjs');" && grep -q "up-revisor-conformidade" up/bin/lib/core.cjs && grep -q "up-revisor-qualidade" up/bin/install.js && ! grep -q "'up-revisor'" up/bin/lib/core.cjs && echo "registros ok"</automated></verify>
<done>O arquivo do revisor único não existe mais, o mapa de papel e a lista de sandbox apontam para os dois agentes novos, e nenhum dos dois registros ainda cita o agente removido.</done>
</task>

<task id="6" type="auto">
<files>up/commands/plan.md (editar), up/commands/build.md (editar), up/skills/up-tdd/SKILL.md (editar), up/skills/up-verificar-antes-de-concluir/SKILL.md (editar), up/workflows/plan.md (editar: apenas o estágio de revisão de planejamento), up/README.md (editar: contagem e lista de agentes), CLAUDE.md (editar: contagem e lista de agentes), .plano/SYSTEM-DESIGN.md (editar: seções 2, 6 e 8)</files>
<action>
Atualizar as superfícies que nomeiam o revisor, sem mudar o que elas dizem.

Nos dois arquivos de comando e no estágio de revisão de planejamento do workflow de planejamento, trocar o nome do agente pelo eixo de qualidade. Nenhum outro estágio do workflow é tocado: o estágio zero pertence ao plano 002, em outra onda.

Nas duas skills, a frase que hoje diz que o gate só passa com a linha do revisor carregando o campo de evidência passa a dizer que o gate só passa com as linhas dos eixos. O detalhe do gate conjuntivo não entra aqui, porque é do plano 007: a frase apenas deixa de mentir sobre o número de linhas.

Em `up/README.md` e em `CLAUDE.md`, atualizar a contagem e a lista de agentes de doze para treze, com a frase que explica a troca: o revisor único foi substituído por dois agentes de eixo isolados, porque a sequência travada escondia problema de segurança atrás de falha de conformidade.

Em `.plano/SYSTEM-DESIGN.md`, atualizar a seção de camadas, que conta e lista os agentes; a matriz de escrita por artefato, cuja linha de relatório de revisão passa a nomear os dois eixos e a proibir que um escreva no relatório do outro; e a tabela de onde cada item do briefing encosta, cuja linha do item 11 passa a nomear os dois agentes. O mapa do sistema não pode continuar dizendo doze enquanto o produto diz treze.

Não tocar no workflow de construção nem no de governança: os dois pertencem a planos de ondas seguintes.
</action>
<verify><automated>! grep -rn "up-revisor\b" up/commands/ up/skills/ up/README.md CLAUDE.md | grep -v "up-revisor-" && grep -q "treze\|13 agentes" .plano/SYSTEM-DESIGN.md && ! grep -n "12 agentes\|doze agentes" .plano/SYSTEM-DESIGN.md && echo "superficies ok"</automated></verify>
<done>Nenhuma superfície de comando, skill ou documentação ainda cita o agente removido, o workflow de planejamento nomeia o eixo de qualidade apenas no estágio de revisão, e as três seções do mapa do sistema dizem treze agentes.</done>
</task>

<task id="7" type="auto">
<files>.plano/fases/18-contexto-e-revisao/evidencia/004-smoke.txt (novo)</files>
<action>
Smoke dos contratos, com a saída gravada como prova.

Registrar as duas listas de ferramentas, lidas do frontmatter dos dois agentes: elas são a prova de REV-04 e entram no resumo do plano.

Rodar o roteamento de modelo para os dois nomes novos e conferir que devolve o modelo do papel de revisão, e não o padrão de fallback. Rodar a resolução do modo de sandbox do instalador para os dois nomes e conferir que devolve permissão de escrita.

Conferir a migração por busca, usando os marcadores gravados no inventário da tarefa 1: cada marcador tem de aparecer no agente de destino declarado. Um marcador que não aparecer em lugar nenhum significa conteúdo perdido na divisão, e é falha de tarefa, não observação.

Buscar no pacote inteiro pelo nome do agente removido e registrar as ocorrências restantes. Só podem sobrar as declaradas como fora de escopo deste plano: o manifesto de referências no despachante e os dois workflows dos planos seguintes. Registrar a lista no arquivo de evidência, para o plano 006 e o plano 007 saberem exatamente o que herdaram.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && { grep -h "^tools:" up/agents/up-revisor-conformidade.md up/agents/up-revisor-qualidade.md; node up/bin/up-tools.cjs config resolve-model up-revisor-qualidade --raw; grep -rn "up-revisor\b" up/ | grep -v "up-revisor-"; } > .plano/fases/18-contexto-e-revisao/evidencia/004-smoke.txt 2>&1; grep -c . .plano/fases/18-contexto-e-revisao/evidencia/004-smoke.txt && grep -qi "tautologia" up/agents/up-revisor-qualidade.md && echo "smoke ok"</automated></verify>
<done>As duas listas de ferramentas estão registradas, o roteamento de modelo e a resolução de sandbox respondem para os dois nomes, todos os marcadores do inventário aparecem no agente de destino, e as ocorrências restantes do nome antigo são exatamente as três declaradas como fora de escopo.</done>
</task>

## Critérios de Sucesso

- [ ] Dois arquivos de agente, um por eixo, com conjuntos de ferramentas assimétricos
- [ ] O eixo de conformidade não tem ferramenta capaz de ler código; o de qualidade não tem navegação
- [ ] Os dois declaram teto de quatrocentas palavras, com aviso de truncamento e ordem de corte
- [ ] Os dois declaram a regra de âncora do próprio eixo, com formato fixo e contagem de descartados
- [ ] O eixo de conformidade declara o pulo por ausência de spec, com a razão
- [ ] O bloco de confirmação de tautologia da fase 16 está no eixo de qualidade
- [ ] O arquivo do revisor único não existe mais, e os dois registros de código apontam para os novos
- [ ] Contagem de agentes diz treze no README, no CLAUDE.md e nas três seções do mapa do sistema
- [ ] Nenhuma linha do workflow de construção e do de governança foi tocada

## FORA DE ESCOPO

- **Não disparar os eixos.** Fan-out, montagem do relatório lado a lado, teto aplicado por máquina e falha rápida antes do fan-out são o plano 006.
- **Não mudar o gate**, o formato da linha do log nem a semântica de aprovação da fase. É o plano 007.
- **Não limpar a entrada órfã do manifesto de referências** por agente. É do plano 006, que trabalha naquele arquivo na onda seguinte.
- **Não estender a revisão em dois eixos** para o escopo de planejamento e o de entrega global. Continuam com um eixo, agora nomeado como eixo de qualidade.
- **Não cortar sedimento** nos textos herdados. O conteúdo migra como está, mais as regras novas.
- **Não mudar o servidor de navegação nem a forma como a aplicação sobe.** A subida passa a ser do orquestrador, e isso é implementado no plano 006.
