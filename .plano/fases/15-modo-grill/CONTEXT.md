# Contexto da Fase 15: Modo grill

**Objetivo da fase**: perguntar de menos deixa de ser o default. Tarefa pequena, média e grande
entram em questionamento profundo automaticamente, com saída barata a qualquer momento.

**Requisitos**: GRILL-01 a GRILL-10, mais os transversais REG-01, REG-02 e REG-03.

**Prova exigida pelo roadmap**: smoke (critério 1 do briefing).

## Decisões do dono que valem como travadas

Vieram do brainstorm registrado em `.plano/BRIEFING-tier-ab-grill.md` (item 13) e da decisão 2 da
tabela do dono. Não são negociáveis dentro desta fase.

1. **O grill é modo dentro da skill de brainstorm, nunca skill nova.** Padrão wrapper e núcleo: um
   motor de perguntas, várias portas de entrada.
2. **O piso sobe.** Trivial continua em zero pergunta. Pequena, Média e Grande passam a entrar em
   grill automaticamente. A tabela antiga (Pequena igual a uma pergunta) morre.
3. **Pedido manual vence a classificação automática**, inclusive para subir o nível de uma tarefa
   classificada como trivial.
4. **Três portas de saída independentes**: palavra de parada, checkpoint a cada três perguntas e
   auto-convergência declarada.
5. **A palavra de parada encerra na primeira tentativa, sem checkpoint e sem confirmação.** É o
   ponto mais sensível da fase: se exigir confirmação, a feature falhou e a aposta do dono se
   inverte (risco 1 do briefing).
6. **Escrita inline**: glossário e registro de decisão são gravados no instante em que caem, nunca
   em lote no fim.
7. **O gate continua**: parar de responder encerra as perguntas, não a aprovação do design.

## Dependências herdadas (arestas de bloqueio)

| Fase | O que ela entrega e esta fase consome |
|------|----------------------------------------|
| 13, formato de pergunta | Toda pergunta do grill chega com resposta recomendada e motivo, e aplica a regra de fato contra decisão. O grill NÃO redefine esse formato: aponta para ele |
| 14, memória do projeto | O grill grava glossário e registro de decisão inline. Precisa do formato do verbete, do formato do registro e da operação determinística de numeração já entregues |

Consequência prática: a primeira tarefa do plano 001 é um gate de pré-requisito. Se os artefatos das
fases 13 e 14 não existirem no momento da execução, a fase para e escala, em vez de inventar um
segundo formato de pergunta ou um segundo formato de registro.

**Esta fase bloqueia**: fase 20 (o auto-aborto do planejamento decide a partir do resultado do grill).

## Estado verificado do repositório em 2026-07-25

Fotografia colhida no planejamento. Vale como evidência do ponto de partida, não como permissão para
copiar caminho de arquivo dentro de plano futuro.

- A skill de brainstorm tem 110 linhas e já carrega: HARD-GATE, tabela de red flags, tabela de
  profundidade por tier, tabela de override do usuário, checkpoint de fechamento de duas opções,
  modo exploração, trilha não-código, brainstorm full e regra de estado terminal.
- A pasta da skill já usa o padrão de arquivo companheiro (`visual-companion.md`), carregado sob
  demanda e citado pelo `SKILL.md`. O motor do grill segue esse mesmo padrão.
- O instalador copia a pasta `up/` inteira para os quatro runtimes, então um arquivo novo dentro da
  pasta da skill chega aos quatro. A camada `<config>/skills/` é só do Claude, e a doutrina nos
  outros três chega por bloco injetado no arquivo de instruções global.
- **O piso antigo está duplicado em seis superfícies vivas**: skill de brainstorm, skill de
  bootstrap, workflow da porta única (dois pontos, mais um item de checklist), comando da porta
  única, bloco de bootstrap dentro do instalador e README do pacote. Mudar só a skill deixaria três
  dos quatro runtimes ensinando o piso antigo. O changelog também cita o piso antigo e não é tocado,
  porque é registro histórico.
- O comando da porta única documenta a classificação com uma chamada que passa a descrição direto no
  lugar do caminho do arquivo, enquanto o workflow grava a descrição num arquivo temporário antes de
  classificar. A forma do comando não roda. Corrigir isso entra nesta fase porque é o mecanismo de
  entrada automática do grill.
- A classificação devolve três níveis (`simple`, `standard`, `complex`) e o vocabulário de tier da
  skill tem quatro nomes. O mapeamento em uso hoje é `simple` igual a Trivial, `standard` igual a
  Pequena, `complex` igual a Média ou Grande.

## Fora de escopo da fase inteira

Cada plano repete o que é fora de escopo dele. Estes valem para os quatro.

- Criar skill nova. O grill é modo, por decisão do dono.
- Mudar a pontuação ou as heurísticas da classificação de tarefa. Só o mapeamento de profundidade
  muda, e ele mora na doutrina.
- Criar subcomando novo na CLI para detectar palavra de parada. Reconhecer "chega" é doutrina, não
  precisa de código; o que falha hoje é o reflexo de pedir confirmação, e reflexo se corrige com
  regra escrita e prova.
- Mexer no comando e no workflow de tarefa avulsa.
- Mexer nos agentes de arquitetura e de planejamento. Formato de pergunta fora da skill é fase 13.
- Criar os artefatos de memória (glossário, registro de decisão, base de rejeições). Eles vêm da
  fase 14; aqui só se escreve neles.
- Limpar o sedimento de travessão que já existe no workflow da porta única, no comando da porta
  única e no instalador. Passe de refatoração com briefing próprio. As linhas novas desta fase
  nascem sem travessão.
- Publicar versão nova no npm.

## Ordem interna

Onda 1 escreve o motor, que é a fonte única. Onda 2 tem dois planos em paralelo, sem arquivo em
comum: um alinha a skill de brainstorm e outro propaga o piso novo para as outras cinco superfícies.
Onda 3 prova, com teste determinístico de invariante mais sonda de comportamento, e fecha a
regressão dos sete comandos e dos quatro runtimes.

A numeração de onda começa em 1 de propósito: o índice de planos trata onda zero como ausência de
valor e a colapsaria na onda 1, o que juntaria o motor com quem depende dele.
