# Glossário interno do UP

<purpose>
Este é o vocabulário do próprio sistema UP: a fonte única de definição dos termos internos do produto. Agentes, workflows e skills devem citar o verbete deste arquivo em vez de reexplicar o conceito com redação própria.
</purpose>

## Regra de definição única

Primeira: quem precisa do termo usa o termo e aponta para este arquivo, nunca redefine.

Segunda: quem precisa de detalhe operacional descreve o procedimento, o que não é redefinir o termo.

Terceira: a linha `Evitar` de cada verbete lista sinônimos proibidos, e usar um deles no lugar do termo é erro de vocabulário.

Quarta: este arquivo é o único lugar do produto onde os termos abaixo aparecem definidos.

## Formas de redefinição contadas pela verificação

Lista fechada de quatro formas estruturais que a verificação conta como redefinição concorrente.

Forma 1: linha do tipo `**termo**:` seguida de prosa.

Forma 2: item de lista do tipo `- termo:` seguido de prosa.

Forma 3: linha de tabela cuja primeira célula é exatamente o termo, quando não é a linha de cabeçalho da tabela.

Forma 4: cabeçalho markdown cujo texto é exatamente o termo, ou exatamente `O que é <termo>`.

Três cortes valem sobre as quatro formas acima. Primeiro corte: só conta quando a prosa do lado direito tem oito palavras ou mais. Segundo corte: nunca conta linha dentro de bloco de código. Terceiro corte: nunca conta linha que já aponta para este arquivo.
