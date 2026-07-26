# Modo grill (motor de perguntas do UP)

Este é o motor único de questionamento profundo do UP. A skill de brainstorm é a porta: ela decide
quando chamar o grill, e este arquivo decide como o grill roda por dentro. Carregado sob demanda,
no turno em que o grill entra.

## Quando o grill entra

| Sinal | Efeito |
|-------|--------|
| Classificação automática devolve `simple` (Trivial) | Zero pergunta. Anuncia em uma linha e segue. O grill NÃO entra |
| Classificação automática devolve `standard` (Pequena) ou `complex` (Média ou Grande) | Grill entra automaticamente |
| Flag `--grill` ou palavras "me grelha", "vai fundo", "pergunta mais", "me pergunta", "quero pensar junto" | Grill entra, mesmo em tarefa classificada como Trivial |
| Palavras "rápido", "simples", "só faz", "sem perguntas", flag `--quick`, ou o comando de tarefa avulsa | Desce para zero pergunta, mesmo em tarefa classificada como Média ou Grande |

**Regra de precedência**: o pedido do dono vence a classificação automática nas duas direções,
porque a classificação é piso e não teto. Quando o mesmo pedido carrega sinal de subir e sinal de
descer ao mesmo tempo, sobe: subir é reversível com uma palavra e descer não é. Quando o dono manda
descer numa tarefa classificada como `complex`, anuncie em UMA linha o desencontro e o risco
assumido, e siga sem perguntar. Isso é aviso, não pergunta.

A classificação vem da operação de classificação de tarefa da CLI, que lê um arquivo. Durante o
brainstorm ainda não existe plano em disco, então a descrição do dono é gravada num arquivo
temporário antes de classificar. Mapeamento de vocabulário: `simple` igual a Trivial, `standard`
igual a Pequena, `complex` igual a Média ou Grande.

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
