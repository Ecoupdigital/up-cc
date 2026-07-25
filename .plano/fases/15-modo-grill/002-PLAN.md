---
phase: 15-modo-grill
plan: "002"
type: doutrina
objective: "Trocar o piso de profundidade dentro da skill de brainstorm e apontar para o motor"
wave: 2
depends_on: ["001"]
autonomous: true
requirements: [GRILL-01, GRILL-02, GRILL-03, GRILL-07, GRILL-10]
files_modified:
  - up/skills/up-brainstorm/SKILL.md
must_haves:
  truths:
    - "A tabela de profundidade da skill declara o piso novo: trivial em zero pergunta, pequena, média e grande em grill"
    - "A skill aponta para o motor e não repete as regras dele"
    - "A precedência do pedido manual está declarada na própria skill, incluindo a entrada em grill de tarefa trivial"
    - "O gate duro e a regra de estado terminal continuam intactos"
  artifacts:
    - path: "up/skills/up-brainstorm/SKILL.md"
      provides: "Porta de entrada do grill: piso, precedência, ponteiro para o motor e cadência do checkpoint"
  key_links:
    - from: "SKILL.md"
      to: "up/skills/up-brainstorm/grill.md"
      via: "citação pelo nome na tabela de profundidade, no checkpoint, no brainstorm completo e no modo exploração"
---

# Fase 15 Plano 002: A porta da skill

**Onda**: 2 (depende do plano 001, que cria o motor. Roda em paralelo com o plano 003, que toca as
outras cinco superfícies: não há arquivo em comum entre os dois)
**Domínio**: doutrina (um único arquivo, a skill de brainstorm)
**Tipo de tarefa**: doutrina, prova por inspeção determinística neste plano e por smoke no plano 004
**Objetivo**: trocar o piso de profundidade dentro da skill de brainstorm e alinhar todos os trechos
dela que ainda falam o vocabulário antigo. A skill é a porta e o motor é o núcleo: aqui entra quem
entra e quem manda, e nada mais.

## Contexto obrigatório antes de começar

Leia `.plano/fases/15-modo-grill/CONTEXT.md`, o motor `up/skills/up-brainstorm/grill.md` entregue
pelo plano 001, e a skill inteira antes de editar.

**Regra de ancoragem**: as fases 13 e 14 rodaram antes e podem ter renomeado seções desta skill.
Ancore por título de seção vigente, nunca por número de linha. Se um título esperado sumiu, procure o
conteúdo equivalente; se não achar, pare e escale em vez de recriar seção.

**Regra de não duplicação**: nenhuma regra do laço, das portas, da destilação ou da escrita inline é
copiada para cá. A skill recebe piso, precedência e ponteiro. Duplicar cria a segunda definição que
a doutrina de memória do projeto proíbe.

**Fronteira**: arquivo único. Não toque no companheiro visual, no motor, nem em qualquer arquivo
fora da pasta da skill.

## Tarefas

<task id="1" type="auto">
<files>
up/skills/up-brainstorm/SKILL.md (editar): seção de profundidade escalada por tamanho e seção de override de profundidade. Contrato de comportamento: quem lê só a skill já sabe que o piso subiu, quem tem precedência e onde está o motor.
</files>
<action>
Substitua a tabela de profundidade pelo piso novo. Ela passa a ter DUAS linhas, não quatro:

| Tier | Profundidade |
|------|--------------|
| **Trivial** (1 arquivo, sem decisão de arquitetura) | 0 perguntas. Anuncia em 1 linha o que vai fazer e onde. Executa |
| **Pequena, Média e Grande** | **Modo grill**: perguntas ilimitadas, uma por vez, com resposta recomendada, até uma das três portas de saída. O tier muda o que a destilação produz, não quantas perguntas cabem. Motor em `grill.md` (mesma pasta) |

Logo abaixo, uma linha dizendo que o que separa Pequena de Média e Grande agora é só a destilação
(design em três frases contra design por seção), e que a contagem de perguntas deixou de ser o eixo.

Preserve a frase que já existe dizendo que a classificação define o piso e que só o dono rebaixa.

Na seção de override de profundidade, ajuste as três linhas da tabela:

- A linha de subir passa a incluir a flag `--grill` e as palavras "me grelha", "vai fundo",
  "pergunta mais". O efeito passa a ser: entra em grill, inclusive em tarefa classificada como
  Trivial, porque o pedido do dono vence a classificação automática.
- A linha de descer continua existindo, e ganha a nota de que, quando a tarefa está classificada como
  Média ou Grande, o agente anuncia o desencontro e o risco em uma linha antes de seguir, sem
  perguntar.
- A linha de nada declarado passa a dizer: usa o piso automático, e o piso é grill fora de Trivial.

Acrescente ao fim da seção uma frase única sobre empate: quando o mesmo pedido carrega sinal de subir
e de descer, sobe, porque subir é reversível por uma palavra de parada.
</action>
<verify type="inspecao">
<automated>grep -q "grill.md" up/skills/up-brainstorm/SKILL.md && grep -qi "Pequena, Média e Grande" up/skills/up-brainstorm/SKILL.md && ! grep -Eqi "pequena[^\n]{0,60}1 pergunta" up/skills/up-brainstorm/SKILL.md && grep -q -- "--grill" up/skills/up-brainstorm/SKILL.md && grep -qi "grelha" up/skills/up-brainstorm/SKILL.md && ! grep -qP '\x{2014}|\x{2013}' up/skills/up-brainstorm/SKILL.md && echo PISO_OK</automated>
</verify>
<done>A tabela de profundidade tem duas linhas, cita o modo grill e aponta para o motor pelo nome. A tabela de override cita a flag e os gatilhos em linguagem natural, declara a precedência do pedido manual, o caso do desencontro e a regra de empate. Nenhuma linha da skill ainda ensina uma pergunta para tarefa pequena.</done>
</task>

<task id="2" type="auto">
<files>
up/skills/up-brainstorm/SKILL.md (editar): descrição de ativação, tabela de red flags, checkpoint de fechamento, brainstorm completo, modo exploração e trilha não-código. Contrato de comportamento: nenhum trecho remanescente da skill contradiz o piso novo, e a skill ativa também pelos gatilhos manuais.
</files>
<action>
Passe o arquivo inteiro e alinhe os trechos que ficaram falando o vocabulário antigo. Edições
pontuais, sem reescrever o que não conflita.

1. **Frontmatter, campo de descrição**: acrescente ao fim do texto existente, sem remover nada:
   `Cobre tambem o modo grill (--grill, "me grelha", "vai fundo", "pergunta mais").` O campo é o
   gatilho de ativação da skill: sem os termos ali, o pedido manual pode não acordar a skill.
2. **Tabela de red flags**: a linha que hoje diz que em tarefa pequena basta perguntar a
   decisão-chave passa a dizer que pequena entra em grill. A linha sobre decidir o tier continua
   válida e ganha a lembrança de que o piso automático é grill fora de trivial. Não remova nenhuma
   linha existente.
3. **Seção do checkpoint de fechamento**: hoje ela diz que toda rodada de perguntas termina com o
   controle de duas opções. Ajuste para: em modo grill, o checkpoint aparece a cada três perguntas,
   conforme a porta 2 do motor; fora do grill (tier Trivial) ele não aparece. Mantenha o texto das
   duas opções e a regra de não adicionar opção de resposta livre.
4. **Brainstorm completo**: o passo de perguntas passa a dizer que as perguntas rodam em modo grill,
   apontando para o motor, em vez de descrever cadência própria. Preserve os demais passos
   (companion visual, propor abordagens, design por seção, escrever o briefing, self-review, gate de
   revisão humana).
5. **Modo exploração**: o passo de perguntas passa a apontar para o motor como cadência, preservando
   o que é específico da exploração (não pular para solução, abrir alternativas radicais, provocar
   com "e se"). A destilação da exploração continua sendo a ideia em um parágrafo.
6. **Trilha não-código**: acrescente meia linha dizendo que o grill vale igual nessa trilha, e que o
   que muda é o que vem depois da aprovação.

Não toque no bloco do gate duro nem na seção de estado terminal: eles são a garantia de que encerrar
perguntas não libera implementação, e o plano 004 vai conferir que continuam de pé.
</action>
<verify type="inspecao">
<automated>grep -qi "grelha" up/skills/up-brainstorm/SKILL.md && [ $(grep -ci "grill" up/skills/up-brainstorm/SKILL.md) -ge 5 ] && grep -q "HARD-GATE" up/skills/up-brainstorm/SKILL.md && grep -qi "estado terminal" up/skills/up-brainstorm/SKILL.md && ! grep -qP '\x{2014}|\x{2013}' up/skills/up-brainstorm/SKILL.md && echo COERENCIA_OK</automated>
</verify>
<done>A descrição do frontmatter cita os gatilhos manuais, os seis trechos listados estão alinhados ao piso novo, o gate duro e a seção de estado terminal continuam intactos, e a skill cita o grill em pelo menos cinco pontos.</done>
</task>

<task id="3" type="auto">
<files>
up/skills/up-brainstorm/SKILL.md (verificação, correção pontual se necessário): fechamento de consistência da pasta da skill.
</files>
<action>
Feche o plano.

1. Busca de piso antigo dentro da pasta da skill:
   `grep -Eni "pequena[^\n]{0,60}1 pergunta|1 pergunta[^\n]{0,60}pequena" up/skills/up-brainstorm/`
   Deve voltar vazio.
2. Confira que a skill não copiou regra do motor: a lista de palavras de parada, a tabela de frases
   proibidas e a tabela de destilação NÃO podem estar duplicadas aqui. A skill pode citar a palavra
   de parada em uma frase curta, mas a lista literal mora no motor.
3. Confira que o tamanho da skill não cresceu mais de quinze linhas em relação ao estado anterior
   (`git diff --stat`). Se cresceu, é sinal de que conteúdo do motor vazou para cá: corte.
4. Leia a skill inteira uma vez e confirme que ela não contradiz o motor em nenhum ponto. Onde
   houver conflito, a skill cede: o motor é a fonte.
5. Commit atômico, no padrão de mensagem do repositório.
</action>
<verify type="inspecao">
<automated>! grep -Eqni "pequena[^\n]{0,60}1 pergunta|1 pergunta[^\n]{0,60}pequena" up/skills/up-brainstorm/SKILL.md && ! grep -q "Posso fechar então" up/skills/up-brainstorm/SKILL.md && git diff --stat up/skills/up-brainstorm/SKILL.md && git status --porcelain up/skills/up-brainstorm/SKILL.md | wc -l && echo PORTA_FECHADA_OK</automated>
</verify>
<done>A busca de piso antigo volta vazia, nenhuma tabela do motor foi duplicada na skill, o crescimento do arquivo cabe em quinze linhas, a leitura corrida não achou contradição com o motor e o commit está feito.</done>
</task>

## Critérios de sucesso do plano

- [ ] A tabela de profundidade tem duas linhas e o piso novo
- [ ] A precedência do pedido manual está na skill, com a entrada de tarefa trivial em grill e a regra de empate
- [ ] O checkpoint aparece a cada três perguntas em modo grill, reusando o controle de duas opções que já existia
- [ ] A skill aponta para o motor em pelo menos cinco pontos e não duplica nenhuma regra dele
- [ ] O gate duro e a regra de estado terminal continuam intactos

## Fora de escopo deste plano

- Escrever ou alterar o motor. É o plano 001.
- Tocar qualquer arquivo fora da pasta da skill de brainstorm. As outras cinco superfícies são o plano 003, que roda em paralelo com este.
- Editar o companheiro visual da skill.
- Escrever teste, sonda de comportamento ou changelog. É o plano 004.
- Remover ou enfraquecer o gate duro e a regra de estado terminal, mesmo que pareça coerente com "encerrar as perguntas".
