# Modo grill (motor de perguntas do UP)

Este é o motor único de questionamento profundo do UP. A skill de brainstorm é a porta: ela decide
quando chamar o grill, e este arquivo decide como o grill roda por dentro. Carregado sob demanda,
no turno em que o grill entra.

## Quando o grill entra

A classificação vem de HEURÍSTICA DE PROSA, aplicada direto na descrição do dono, sem rodar comando
nenhum. O `classify-task` da CLI (`up-tools.cjs classify-task <arquivo>`) mede um ARQUIVO DE PLANO já
escrito (frontmatter de lista fechada, contagem de tarefas, tamanho em bytes, regex em inglês como
`refactor`/`auth`/`payment`): não serve pra prosa em português no momento do brainstorm, porque uma
descrição livre não carrega nenhum desses sinais e sempre pontua perto de zero, mesmo pedindo uma
reescrita inteira de arquitetura. `classify-task` continua correto pra o que ele mede: um plano já
escrito em disco, depois que `/up:plan` roda.

Aplique estes quatro sinais direto na descrição do dono:

| Sinal presente na descrição | Efeito |
|------------------------------|--------|
| Toca mais de um arquivo/subsistema provável | Sobe pra grill |
| Palavra de arquitetura (refatorar, redesenhar, reescrever, migrar, "arquitetura inteira", trocar framework/biblioteca) | Sobe pra grill |
| Toca schema/dado persistido, API/endpoint novo, ou autenticação/autorização | Sobe pra grill |
| Nenhum dos sinais acima: muda um arquivo conhecido, sem decisão de design | Fica em Trivial |

| Resultado da heurística | Efeito |
|--------------------------|--------|
| Nenhum sinal de grill encontrado (Trivial) | Zero pergunta. Anuncia em uma linha e segue. O grill NÃO entra |
| Um ou mais sinais de grill encontrados (Pequena, Média ou Grande) | Grill entra automaticamente |
| Flag `--grill` ou palavras "me grelha", "vai fundo", "pergunta mais", "me pergunta", "quero pensar junto" | Grill entra, mesmo sem nenhum sinal de grill na descrição |
| Palavras "rápido", "simples", "só faz", "sem perguntas", flag `--quick`, ou o comando de tarefa avulsa | Desce para zero pergunta, mesmo com sinal de grill na descrição |

**Regra de precedência**: o pedido do dono vence a heurística nas duas direções, porque a heurística
é piso e não teto. Quando o mesmo pedido carrega sinal de subir e sinal de descer ao mesmo tempo,
sobe: subir é reversível com uma palavra e descer não é. Quando o dono manda descer numa descrição
com sinal de grill, anuncie em UMA linha o desencontro e o risco assumido, e siga sem perguntar.
Isso é aviso, não pergunta.

## O laço

1. Perguntas ilimitadas. Não existe número máximo. Quem encerra são as três portas de saída.
2. Uma pergunta por mensagem. Duas perguntas na mesma mensagem é violação, mesmo que pareçam do
   mesmo assunto.
3. Toda pergunta chega no formato entregue pela fase 13: rótulos `Pergunta:`, `Recomendo:`,
   `Porque:` e, quando a lista de respostas é fechada, `Opções:` (ver
   `CONTRATOS-HERDADOS.md`, item "Formato de pergunta com resposta recomendada"). NÃO redefina o
   formato aqui.
4. Antes de cada pergunta, aplique a regra de fato contra decisão, também da fase 13 (ver
   `CONTRATOS-HERDADOS.md`, item "Regra de fato contra decisão"). Fato que você descobre lendo o
   repositório nunca vira pergunta.
5. Uma pergunta só entra na árvore se pelo menos duas respostas plausíveis produzirem designs
   diferentes. Se todas as respostas levam ao mesmo design, a pergunta é decorativa: descarte.
6. Cada pergunta é numerada de forma visível na conversa, no formato `[Q1]`, `[Q2]`, `[Q3]`, para
   que a ordem fique verificável na transcrição da rodada.
7. Múltipla escolha é preferida, e a opção recomendada vem marcada como recomendada.

## Ordem por dependência

Antes da primeira pergunta, monte a árvore de decisão do assunto: o que depende do quê.

Nunca pergunte B enquanto A, de quem B depende, estiver em aberto. Perguntar fora de ordem obriga
o dono a responder duas vezes quando a resposta de A invalida a pergunta B.

Toda pergunta traz uma linha de dependência, imediatamente abaixo do enunciado, neste formato:
`Depende de: Q2 (geração no servidor)` para pergunta dependente, e `Depende de: nada` para
pergunta de raiz. O que vai entre parênteses é a decisão já fixada de que esta pergunta depende.

Quando a resposta de uma pergunta anterior mata uma pergunta que estava na fila, diga isso em uma
linha (`Q5 caiu: sua resposta em Q2 já fecha isso`) e siga. Pergunta morta não é feita.

## As três portas de saída

As três portas são independentes entre si. A primeira que disparar encerra as perguntas, não
importa qual seja.

### Porta 1: palavra de parada

Esta é a parte mais sensível da fase inteira.

Vale a QUALQUER momento, inclusive no lugar da resposta de uma pergunta e inclusive antes da
primeira pergunta.

Lista literal dos gatilhos: `chega`, `para`, `parou`, `fecha`, `fechou`, `basta`, `suficiente`,
`chega de pergunta`, `sem mais perguntas`, `toca o barco`. Vale qualquer variação inequívoca de
mandar parar de perguntar. Na dúvida entre parar e continuar, PARE: continuar perguntando contra a
vontade do dono custa mais caro que fechar cedo, porque o dono reabre com uma palavra.

Efeito, numa frase que não admite leitura dupla: a próxima mensagem sua é a destilação. Sem
checkpoint, sem confirmação, sem resumo do que foi perguntado, sem "tem certeza".

Tabela de frases proibidas na mensagem seguinte a uma palavra de parada:

| Frase proibida | Em vez disso |
|----------------|--------------|
| "Tem certeza que quer fechar?" | Feche. Ele já disse |
| "Posso fechar então?" | Feche. Pedir permissão para obedecer é desobedecer |
| "Quer que eu resuma o que discutimos?" | Entregue a destilação direto, sem oferecer |
| "Só mais uma pergunta antes de fechar" | Não existe mais uma. A porta fechou |
| Checkpoint de duas opções | O checkpoint é a porta 2 e ela não é acionada aqui |
| Nova pergunta de qualquer tipo | A próxima mensagem é a destilação |

**Pergunta em aberto**: se a palavra de parada chegou no lugar da resposta de `[Qn]`, a decisão de
`[Qn]` é adotada pela sua própria recomendação, e a destilação declara isso em uma linha, no
formato `Ponto em aberto: <assunto> adotado pela recomendação, não confirmado pelo dono`. Você não
pergunta de novo e não deixa o ponto invisível.

### Porta 2: checkpoint a cada três perguntas

Conte as perguntas feitas desde o último checkpoint. Na terceira, apresente o checkpoint de duas
opções que a skill já define (Fechar e seguir, Mais perguntas). Não crie controle novo.

A contagem é de perguntas FEITAS, não de perguntas respondidas.

"Mais perguntas" zera o contador e abre mais três. "Fechar e seguir" leva à destilação.

O checkpoint não é apresentado quando outra porta já disparou.

Em runtime sem a ferramenta de pergunta estruturada, apresente as mesmas duas opções em texto, com
a recomendada marcada. O controle é o mesmo, muda só o meio.

### Porta 3: auto-convergência

Dispara quando não resta pergunta capaz de mudar o design, pelo teste da regra 5 do laço.

É obrigatório DECLARAR, não apenas parar de perguntar. Frase modelo, para adaptar ao assunto:
`Não tenho mais pergunta capaz de mudar o design. O que sobrou é detalhe de implementação, que eu
resolvo. Proponho fechar.`

Depois da declaração, siga para a destilação. A declaração não é pergunta e não precisa de
resposta, mas o dono pode reabrir dizendo "pergunta mais".

Anti-padrão nomeado: parar de perguntar em silêncio e emendar o design. O dono não consegue
distinguir "acabou" de "desistiu" quando você não fala.

## A destilação

O motor é um só e as portas são várias. A destilação produz o mesmo tipo de saída de sempre,
conforme o ponto de entrada:

| De onde veio | O que a destilação produz |
|--------------|---------------------------|
| Tier Pequena | Design em três frases, e aprovação |
| Tier Média ou Grande | Design por seção, com aprovação após cada seção |
| Modo exploração | A ideia destilada em um parágrafo (o que é, para quem, por quê, o diferencial), e confirmação |
| Trilha não código | Escopo do artefato em três frases, e aprovação |

A destilação é exatamente o passo seguinte do tier, o mesmo que o checkpoint alcançaria com
"Fechar e seguir". Nenhuma porta cria caminho novo.

## Escrita inline

Termo de domínio que o dono fixa durante o grill vai para o glossário do projeto NO MESMO TURNO em
que cai, antes da próxima pergunta. Use o formato de verbete e o caminho registrados em
`CONTRATOS-HERDADOS.md`, item "Formato do verbete do glossário do projeto", sem redefinir nada.

Decisão que passa nas três condições do registro de decisão (difícil de reverter, surpreendente
sem contexto, resultado de trade-off real) vira registro no mesmo turno, usando a operação
determinística de numeração registrada em `CONTRATOS-HERDADOS.md`, item "Formato do registro de
decisão e a operação determinística de numeração". Decisão que falha qualquer uma das três
condições não gera registro, e isso não é omissão.

Acumular para gravar no fim é proibido. Motivo: a conversa pode ser cortada por limite de
contexto, e o que não foi gravado no instante morre.

A gravação é anunciada em UMA linha curta, no fim da mensagem, nestes formatos literais:
`[gravado: glossário -> <termo>]` e `[gravado: decisão <número> -> <título>]`. O anúncio existe
para o dono saber e para a gravação ser verificável na transcrição.

Antes da primeira pergunta, a base de rejeições é consultada, conforme a fase 14 (ver
`CONTRATOS-HERDADOS.md`, item "Base de rejeições"). Se o pedido parece com algo já recusado, isso
vem à tona antes de explorar a intenção. Não redefina a regra aqui: aponte.

## O gate continua

Encerrar as perguntas não é aprovar o design. O gate duro da skill continua valendo integralmente.

A palavra de parada encerra as PERGUNTAS. A aprovação do design continua sendo exigida, e a
destilação termina pedindo essa aprovação.

O estado terminal também não muda: projeto ou feature aprovado vai para o planejamento, nunca
direto para código.

## Red flags do grill

| Você pensa | Realidade |
|------------|-----------|
| "Junto essas três perguntas numa mensagem só para poupar o dono" | Uma por vez. Bloco de perguntas é interrogatório e ele responde mal |
| "Anoto os termos e gravo tudo no fim" | O que não é gravado no instante morre no corte de contexto |
| "Ele disse chega, mas melhor confirmar" | Confirmar é a falha número um desta feature. Feche |
| "Acabaram minhas perguntas, vou implementar" | Perguntas acabaram, aprovação não. O gate continua |
| "Essa é pequena, uma pergunta basta" | O piso mudou. Pequena entra em grill |
| "Pergunto B agora e volto em A depois" | Fora de ordem faz o dono responder duas vezes. Siga a dependência |
| "Ele não declarou nada, então sigo no automático" | No automático, Pequena, Média e Grande entram em grill. Só Trivial escapa |
