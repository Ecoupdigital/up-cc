---
phase: 15-modo-grill
plan: "001"
type: doutrina
objective: "Escrever o motor unico do modo grill como arquivo companheiro da skill de brainstorm"
wave: 1
depends_on: []
autonomous: true
requirements: [GRILL-01, GRILL-02, GRILL-03, GRILL-04, GRILL-05, GRILL-06, GRILL-07, GRILL-08, GRILL-09, GRILL-10]
files_modified:
  - up/skills/up-brainstorm/grill.md
  - .plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md
must_haves:
  truths:
    - "O motor do grill existe como arquivo companheiro da skill de brainstorm, com o laço, a ordem de dependência e as três portas de saída escritas"
    - "A palavra de parada tem lista literal, tabela de frases proibidas e a instrução de seguir direto para a destilação"
    - "Termo de domínio e decisão têm regra de gravação no instante, com marcador visível na transcrição"
    - "O motor aponta para o formato de pergunta da fase 13 e para os artefatos de memória da fase 14, sem redefinir nenhum"
  artifacts:
    - path: "up/skills/up-brainstorm/grill.md"
      provides: "Motor único de questionamento profundo: entrada, laço, ordem de dependência, três portas, destilação, escrita inline, gate"
    - path: ".plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md"
      provides: "Nomes literais dos contratos herdados das fases 13 e 14, mais o ponto de partida do repositório"
  key_links:
    - from: "grill.md"
      to: "contratos das fases 13 e 14"
      via: "citação nominal colhida na tarefa 1, sem redefinição"
---

# Fase 15 Plano 001: Motor do grill

**Onda**: 1 (nenhuma dependência dentro da fase; bloqueia os planos 002, 003 e 004)
**Domínio**: doutrina (Markdown da camada de skills)
**Tipo de tarefa**: doutrina, prova por inspeção determinística neste plano e por smoke no plano 004
**Objetivo**: escrever o motor único de questionamento profundo do UP, como arquivo companheiro da
skill de brainstorm. Ao fim deste plano existe a fonte da verdade do grill. A porta da skill (plano
002), as outras superfícies (plano 003) e a prova (plano 004) vêm depois e todas apontam para cá.

## Contexto obrigatório antes de começar

Leia, nesta ordem: `.plano/fases/15-modo-grill/CONTEXT.md`, `up/skills/up-brainstorm/SKILL.md`
inteiro (para saber o que já existe e não duplicar), `up/skills/up-brainstorm/visual-companion.md`
(só para copiar o padrão de arquivo companheiro) e a seção do modo grill em `.plano/REQUIREMENTS.md`.

**Regra de ancoragem**: as fases 13 e 14 rodaram antes desta e podem ter reescrito trechos da skill.
Nunca leia nem edite por número de linha: ancore por título de seção.

**Fronteira deste plano**: você cria um arquivo novo e o registro de contratos. Não edite a skill de
brainstorm aqui: ela é território do plano 002 e editar nos dois lugares gera conflito.

## Tarefas

<task id="1" type="auto">
<files>
.plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md (criar): registro dos contratos que as fases 13 e 14 entregaram, com nome literal e origem, mais o ponto de partida do repositório. Contrato de comportamento: nenhuma tarefa desta fase pode citar formato de pergunta ou artefato de memória que não esteja listado aqui.
</files>
<action>
Gate de pré-requisito. Colete, por leitura, os contratos que esta fase consome. Não escreva nada em
`up/` nesta tarefa.

Colete e registre, cada item com o arquivo e o título de seção onde foi encontrado:

1. **Formato de pergunta com resposta recomendada** (fase 13): onde está escrito e como se chama a
   seção. Procure em `up/references/questioning.md`, `up/skills/up-brainstorm/SKILL.md` e
   `.plano/fases/13-*/`. Registre o nome literal dos campos que compõem uma pergunta (por exemplo:
   pergunta, recomendação, motivo).
2. **Regra de fato contra decisão** (fase 13): onde está e como se chama.
3. **Formato do verbete do glossário do projeto** (fase 14): onde está descrito, qual o caminho do
   artefato e qual a regra de admissão.
4. **Formato do registro de decisão e a operação determinística de numeração** (fase 14): o nome
   exato do subcomando da CLI, se houver. Descubra por `grep -n "decis" up/bin/up-tools.cjs` e pela
   leitura do resumo da fase 14 em `.plano/fases/14-*/`. Proibido inventar nome de subcomando.
5. **Base de rejeições** (fase 14): caminho e quando é consultada.

Escreva o arquivo com uma tabela de cinco linhas: item, nome literal, arquivo de origem, título da
seção de origem. Onde não achar, escreva `AUSENTE` na linha.

Acrescente, abaixo da tabela, a linha `SHA_BASE: <sha>`, com a saída de `git rev-parse HEAD` colhida
AGORA, antes de qualquer edição desta fase. O plano 004 precisa desse ponto de partida para rodar a
contraprova contra a doutrina anterior. Colher depois das edições inutiliza a contraprova.

**Condição de parada**: se os itens 1 ou 4 saírem `AUSENTE`, pare o plano inteiro, grave o motivo no
arquivo e escale. O grill não pode nascer com um segundo formato de pergunta nem com uma segunda
convenção de numeração de decisão: isso violaria a regra de definição única do produto.
</action>
<verify type="inspecao">
<automated>test -f .plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md && ! grep -q "AUSENTE" .plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md && grep -qE "^SHA_BASE: [0-9a-f]{7,40}$" .plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md && git cat-file -e $(grep "^SHA_BASE:" .plano/fases/15-modo-grill/CONTRATOS-HERDADOS.md | cut -d' ' -f2) && echo GATE_OK</automated>
</verify>
<done>O arquivo existe, tem as cinco linhas preenchidas com nome literal e origem, a linha do ponto de partida traz um sha que existe no repositório, e nenhuma linha crítica está marcada como ausente. Se houver ausência crítica, o plano está parado e escalado, e isso conta como conclusão correta desta tarefa.</done>
</task>

<task id="2" type="auto">
<files>
up/skills/up-brainstorm/grill.md (criar): arquivo companheiro da skill, carregado sob demanda quando o grill entra. Contrato de comportamento: quem lê este arquivo sabe quando o grill entra, quem tem precedência e como o laço de perguntas roda, sem precisar abrir outro arquivo.
</files>
<action>
Crie o arquivo com título `# Modo grill (motor de perguntas do UP)` e uma linha de abertura dizendo
que este é o motor único e que a skill é a porta. Sem frontmatter: é companheiro, não é skill.

Escreva as três primeiras seções.

**Seção `## Quando o grill entra`.** Tabela de duas colunas (sinal, efeito), com estas quatro linhas:

| Sinal | Efeito |
|-------|--------|
| Classificação automática devolve `simple` (Trivial) | Zero pergunta. Anuncia em uma linha e segue. O grill NÃO entra |
| Classificação automática devolve `standard` (Pequena) ou `complex` (Média ou Grande) | Grill entra automaticamente |
| Flag `--grill` ou palavras "me grelha", "vai fundo", "pergunta mais", "me pergunta", "quero pensar junto" | Grill entra, mesmo em tarefa classificada como Trivial |
| Palavras "rápido", "simples", "só faz", "sem perguntas", flag `--quick`, ou o comando de tarefa avulsa | Desce para zero pergunta, mesmo em tarefa classificada como Média ou Grande |

Abaixo da tabela, a **regra de precedência** em texto curto: o pedido do dono vence a classificação
automática nas duas direções, porque a classificação é piso e não teto. Quando o mesmo pedido carrega
sinal de subir e sinal de descer, sobe: subir é reversível com uma palavra e descer não é. Quando o
dono manda descer numa tarefa classificada como `complex`, anuncie em UMA linha o desencontro e o
risco assumido, e siga sem perguntar (é aviso, não pergunta).

Registre também que a classificação vem da operação de classificação de tarefa da CLI, que ela lê um
arquivo, e que durante o brainstorm ainda não existe plano em disco, então a descrição do dono é
gravada num arquivo temporário antes de classificar. O mapeamento de vocabulário é `simple` igual a
Trivial, `standard` igual a Pequena, `complex` igual a Média ou Grande.

**Seção `## O laço`.** Sete regras numeradas, cada uma em uma ou duas frases:

1. Perguntas ilimitadas. Não existe número máximo. Quem encerra são as três portas de saída.
2. Uma pergunta por mensagem. Duas perguntas na mesma mensagem é violação, mesmo que pareçam do
   mesmo assunto.
3. Toda pergunta chega no formato entregue pela fase 13 (resposta recomendada mais motivo). Cite o
   nome literal colhido no registro de contratos herdados e NÃO redefina o formato aqui.
4. Antes de cada pergunta, aplique a regra de fato contra decisão, também da fase 13. Fato que você
   descobre lendo o repositório nunca vira pergunta.
5. Uma pergunta só entra na árvore se pelo menos duas respostas plausíveis produzirem designs
   diferentes. Se todas as respostas levam ao mesmo design, a pergunta é decorativa: descarte.
6. Cada pergunta é numerada de forma visível na conversa, no formato `[Q1]`, `[Q2]`, `[Q3]`, para
   que a ordem fique verificável na transcrição da rodada.
7. Múltipla escolha é preferida, e a opção recomendada vem marcada como recomendada.

**Seção `## Ordem por dependência`.** A regra e o formato literal:

- Antes da primeira pergunta, monte a árvore de decisão do assunto: o que depende do quê.
- Nunca pergunte B enquanto A, de quem B depende, estiver em aberto. Perguntar fora de ordem obriga
  o dono a responder duas vezes quando a resposta de A invalida a pergunta B.
- Toda pergunta traz uma linha de dependência, imediatamente abaixo do enunciado, neste formato:
  `Depende de: Q2 (geração no servidor)` para pergunta dependente, e `Depende de: nada` para
  pergunta de raiz. O que vai entre parênteses é a decisão já fixada de que esta pergunta depende.
- Quando a resposta de uma pergunta anterior mata uma pergunta que estava na fila, diga isso em uma
  linha (`Q5 caiu: sua resposta em Q2 já fecha isso`) e siga. Pergunta morta não é feita.

Alvo de tamanho do arquivo ao fim das tarefas 2, 3 e 4: entre 150 e 200 linhas, teto de 220. É
arquivo carregado sob demanda dentro de uma conversa viva, então cada linha paga contexto.
</action>
<verify type="inspecao">
<automated>test -f up/skills/up-brainstorm/grill.md && grep -q "Quando o grill entra" up/skills/up-brainstorm/grill.md && grep -q "Depende de: nada" up/skills/up-brainstorm/grill.md && grep -q '\[Q1\]' up/skills/up-brainstorm/grill.md && ! grep -qP '\x{2014}|\x{2013}' up/skills/up-brainstorm/grill.md && echo SECOES_1_A_3_OK</automated>
</verify>
<done>O arquivo existe com as três seções, a tabela de entrada tem as quatro linhas, a regra de precedência está escrita nas duas direções e com a regra de empate, o formato literal da linha de dependência aparece nas duas variantes, e não há travessão nem meia risca no arquivo.</done>
</task>

<task id="3" type="auto">
<files>
up/skills/up-brainstorm/grill.md (editar, acrescentar): as três portas de saída e a destilação. Contrato de comportamento: um agente que leu esta seção encerra as perguntas na primeira tentativa quando o dono manda parar, e nunca pede confirmação para isso.
</files>
<action>
Acrescente a seção `## As três portas de saída`, com uma linha de abertura declarando que as portas
são independentes e que a primeira que disparar encerra as perguntas. Depois, três subseções.

**`### Porta 1: palavra de parada`.** Esta é a parte mais sensível da fase inteira. Escreva:

- Vale a QUALQUER momento, inclusive no lugar da resposta de uma pergunta e inclusive antes da
  primeira pergunta.
- Lista literal dos gatilhos: `chega`, `para`, `parou`, `fecha`, `fechou`, `basta`, `suficiente`,
  `chega de pergunta`, `sem mais perguntas`, `toca o barco`. Vale qualquer variação inequívoca de
  mandar parar de perguntar. Na dúvida entre parar e continuar, PARE: continuar perguntando contra a
  vontade do dono custa mais caro que fechar cedo, porque o dono reabre com uma palavra.
- Efeito, em uma frase que não admite leitura dupla: a próxima mensagem sua é a destilação. Sem
  checkpoint, sem confirmação, sem resumo do que foi perguntado, sem "tem certeza".
- Tabela de frases proibidas na mensagem seguinte a uma palavra de parada, com duas colunas (frase
  proibida, o que fazer em vez disso). Inclua ao menos estas linhas:

| Frase proibida | Em vez disso |
|----------------|--------------|
| "Tem certeza que quer fechar?" | Feche. Ele já disse |
| "Posso fechar então?" | Feche. Pedir permissão para obedecer é desobedecer |
| "Quer que eu resuma o que discutimos?" | Entregue a destilação direto, sem oferecer |
| "Só mais uma pergunta antes de fechar" | Não existe mais uma. A porta fechou |
| Checkpoint de duas opções | O checkpoint é a porta 2 e ela não é acionada aqui |
| Nova pergunta de qualquer tipo | A próxima mensagem é a destilação |

- **Pergunta em aberto**: se a palavra de parada chegou no lugar da resposta de `[Qn]`, a decisão de
  `[Qn]` é adotada pela sua própria recomendação e a destilação declara isso em uma linha, no
  formato `Ponto em aberto: <assunto> adotado pela recomendação, não confirmado pelo dono`. Você não
  pergunta de novo e não deixa o ponto invisível.

**`### Porta 2: checkpoint a cada três perguntas`.** Escreva:

- Conte as perguntas feitas desde o último checkpoint. Na terceira, apresente o checkpoint de duas
  opções que a skill já define (Fechar e seguir, Mais perguntas). Não crie controle novo.
- A contagem é de perguntas FEITAS, não de perguntas respondidas.
- "Mais perguntas" zera o contador e abre mais três. "Fechar e seguir" leva à destilação.
- O checkpoint não é apresentado quando outra porta já disparou.
- Em runtime sem a ferramenta de pergunta estruturada, apresente as mesmas duas opções em texto, com
  a recomendada marcada. O controle é o mesmo, muda só o meio.

**`### Porta 3: auto-convergência`.** Escreva:

- Dispara quando não resta pergunta capaz de mudar o design, pelo teste da regra 5 do laço.
- É obrigatório DECLARAR, não apenas parar de perguntar. Frase modelo, para adaptar ao assunto:
  `Não tenho mais pergunta capaz de mudar o design. O que sobrou é detalhe de implementação, que eu
  resolvo. Proponho fechar.`
- Depois da declaração, siga para a destilação. A declaração não é pergunta e não precisa de
  resposta, mas o dono pode reabrir dizendo "pergunta mais".
- Anti-padrão nomeado: parar de perguntar em silêncio e emendar o design. O dono não consegue
  distinguir "acabou" de "desistiu" quando você não fala.

**Seção `## A destilação`.** Tabela dizendo o que a destilação produz em cada porta de entrada,
porque o motor é um e as portas são várias:

| De onde veio | O que a destilação produz |
|--------------|---------------------------|
| Tier Pequena | Design em três frases, e aprovação |
| Tier Média ou Grande | Design por seção, com aprovação após cada seção |
| Modo exploração | A ideia destilada em um parágrafo (o que é, para quem, por quê, o diferencial), e confirmação |
| Trilha não-código | Escopo do artefato em três frases, e aprovação |

Fecha com uma linha: a destilação é exatamente o passo seguinte do tier, o mesmo que o checkpoint
alcançaria com "Fechar e seguir". Nenhuma porta cria caminho novo.
</action>
<verify type="inspecao">
<automated>grep -q "Porta 1: palavra de parada" up/skills/up-brainstorm/grill.md && grep -q "Porta 2: checkpoint" up/skills/up-brainstorm/grill.md && grep -q "Porta 3: auto-convergência" up/skills/up-brainstorm/grill.md && for w in chega para fecha basta suficiente; do grep -q "\`$w\`" up/skills/up-brainstorm/grill.md || exit 1; done && grep -q "Ponto em aberto" up/skills/up-brainstorm/grill.md && grep -qi "sem confirma" up/skills/up-brainstorm/grill.md && echo PORTAS_OK</automated>
</verify>
<done>As três subseções existem, as cinco palavras de parada do dono aparecem na lista literal, a tabela de frases proibidas tem no mínimo seis linhas, a regra do ponto em aberto está escrita, a frase modelo da auto-convergência está escrita e a tabela da destilação cobre os quatro pontos de entrada.</done>
</task>

<task id="4" type="auto">
<files>
up/skills/up-brainstorm/grill.md (editar, acrescentar): escrita inline, gate preservado e anti-padrões. Contrato de comportamento: termo e decisão são gravados durante a conversa e a gravação é visível na transcrição; o fim das perguntas não libera implementação.
</files>
<action>
Acrescente três seções finais.

**`## Escrita inline`.** Regras:

- Termo de domínio que o dono fixa durante o grill vai para o glossário do projeto NO MESMO TURNO em
  que cai, antes da próxima pergunta. Use o formato de verbete e o caminho registrados no arquivo de
  contratos herdados, sem redefinir nada.
- Decisão que passa nas três condições do registro de decisão (difícil de reverter, surpreendente
  sem contexto, resultado de trade-off real) vira registro no mesmo turno, usando a operação
  determinística de numeração registrada no arquivo de contratos herdados. Decisão que falha
  qualquer uma das três condições não gera registro, e isso não é omissão.
- Acumular para gravar no fim é proibido. Motivo declarado no arquivo: a conversa pode ser cortada
  por limite de contexto, e o que não foi gravado no instante morre.
- A gravação é anunciada em UMA linha curta, no fim da mensagem, nestes formatos literais:
  `[gravado: glossário -> <termo>]` e `[gravado: decisão <número> -> <título>]`. O anúncio existe
  para o dono saber e para a gravação ser verificável na transcrição.
- Antes da primeira pergunta, a base de rejeições é consultada, conforme a fase 14. Se o pedido
  parece com algo já recusado, isso vem à tona antes de explorar a intenção. Não redefina a regra
  aqui: aponte.

**`## O gate continua`.** Três frases:

- Encerrar as perguntas não é aprovar o design. O gate duro da skill continua valendo integralmente.
- A palavra de parada encerra as PERGUNTAS. A aprovação do design continua sendo exigida, e a
  destilação termina pedindo essa aprovação.
- O estado terminal também não muda: projeto ou feature aprovado vai para o planejamento, nunca
  direto para código.

**`## Red flags do grill`.** Tabela de duas colunas (você pensa, realidade), no mesmo estilo da que
já existe na skill, com no mínimo estas linhas:

| Você pensa | Realidade |
|------------|-----------|
| "Junto essas três perguntas numa mensagem só para poupar o dono" | Uma por vez. Bloco de perguntas é interrogatório e ele responde mal |
| "Anoto os termos e gravo tudo no fim" | O que não é gravado no instante morre no corte de contexto |
| "Ele disse chega, mas melhor confirmar" | Confirmar é a falha número um desta feature. Feche |
| "Acabaram minhas perguntas, vou implementar" | Perguntas acabaram, aprovação não. O gate continua |
| "Essa é pequena, uma pergunta basta" | O piso mudou. Pequena entra em grill |
| "Pergunto B agora e volto em A depois" | Fora de ordem faz o dono responder duas vezes. Siga a dependência |
| "Ele não declarou nada, então sigo no automático" | No automático, Pequena, Média e Grande entram em grill. Só Trivial escapa |
</action>
<verify type="inspecao">
<automated>grep -q "Escrita inline" up/skills/up-brainstorm/grill.md && grep -q "\[gravado: glossário" up/skills/up-brainstorm/grill.md && grep -q "\[gravado: decisão" up/skills/up-brainstorm/grill.md && grep -q "Red flags do grill" up/skills/up-brainstorm/grill.md && ! grep -qP '\x{2014}|\x{2013}' up/skills/up-brainstorm/grill.md && wc -l up/skills/up-brainstorm/grill.md</automated>
</verify>
<done>As três seções existem, os dois marcadores literais de gravação aparecem, a tabela de red flags tem no mínimo sete linhas, o arquivo continua sem travessão e tem no máximo 220 linhas.</done>
</task>

<task id="5" type="auto">
<files>
up/skills/up-brainstorm/grill.md (verificação, correção pontual se necessário): fechamento de consistência do motor.
</files>
<action>
Feche o plano com a leitura crítica e o commit.

1. Confira que o motor NÃO copia o que é da skill: ele não contém uma segunda cópia do gate duro,
   nem a tabela de tiers completa, nem o texto do modo exploração. Ele referencia. Se copiou, corte.
2. Confira que o motor não redefine formato de pergunta, verbete de glossário ou registro de
   decisão: em cada um desses três pontos tem que haver citação ao contrato herdado, não definição
   nova.
3. Zero travessão e zero meia risca. Máximo de 220 linhas.
4. Leia o arquivo de ponta a ponta uma vez, do lugar de quem nunca viu o UP, e confirme que estas
   quatro perguntas têm resposta no texto, sem inferência: quando o grill entra sozinho; quem vence
   quando o dono pede o contrário da classificação; o que acontece exatamente na mensagem seguinte a
   "chega"; onde o termo de domínio é gravado e quando.
5. Commit atômico do motor mais o registro de contratos herdados, no padrão de mensagem do
   repositório.
</action>
<verify type="inspecao">
<automated>! grep -qP '\x{2014}|\x{2013}' up/skills/up-brainstorm/grill.md && [ $(wc -l < up/skills/up-brainstorm/grill.md) -le 220 ] && ! grep -q "HARD-GATE" up/skills/up-brainstorm/grill.md && git status --porcelain up/skills/up-brainstorm/grill.md | wc -l && echo MOTOR_FECHADO_OK</automated>
</verify>
<done>O motor não duplica conteúdo da skill nem redefine contrato herdado, está sem travessão, cabe no teto de linhas, respondeu às quatro perguntas na leitura corrida, e o commit está feito.</done>
</task>

## Critérios de sucesso do plano

- [ ] O motor existe com entrada, laço, ordem de dependência, três portas, destilação, escrita inline, gate e red flags
- [ ] A precedência do pedido manual está escrita nas duas direções, com a regra de empate
- [ ] A palavra de parada tem lista literal com as cinco palavras do dono e tabela de frases proibidas com no mínimo seis linhas
- [ ] A auto-convergência tem frase modelo de declaração, e não apenas a instrução de parar
- [ ] A escrita inline tem marcador visível na transcrição, o que a torna verificável
- [ ] O motor aponta para os contratos das fases 13 e 14 e não redefine nenhum

## Fora de escopo deste plano

- Editar a skill de brainstorm. É o plano 002, que roda na onda seguinte em paralelo com o 003.
- Propagar o piso novo para bootstrap, workflow, comando, instalador e README. É o plano 003.
- Escrever teste, sonda de comportamento ou changelog. É o plano 004.
- Criar skill nova, subcomando novo de CLI ou artefato de memória. Decidido fora desta fase.
- Alterar a pontuação da classificação de tarefa. Só o mapeamento de profundidade muda, e ele é doutrina.
- Corrigir o sedimento de travessão que já existe fora da pasta da skill.
