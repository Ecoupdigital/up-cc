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
