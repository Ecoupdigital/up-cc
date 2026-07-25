---
phase: 18-contexto-e-revisao
plan: 002
type: glue
autonomous: true
wave: 2
depends_on: ["001"]
requirements: [CTX-01, CTX-02]
objective: "Higiene de contexto prescrita: janela ininterrupta do brainstorm ao plano pronto e limpeza obrigatoria entre execucoes de plano"
prova: smoke
files_modified:
  - up/hooks/up-session-start.js
  - up/skills/up-brainstorm/SKILL.md
  - up/workflows/up.md
  - up/workflows/plan.md
  - up/workflows/build.md
must_haves:
  truths:
    - "Retomar um brainstorm sem plano pronto gravado faz o planejamento detectar o corte, avisar o dono e reabrir o trecho"
    - "A proibicao de compactar ou limpar antes do plano pronto existir esta escrita na doutrina, uma unica vez"
    - "A sessao que orquestra declara no registro da fase a limpeza de contexto entre execucoes de plano"
  artifacts:
    - path: "up/workflows/plan.md"
      provides: "Deteccao do corte antes do intake e reabertura do trecho"
    - path: "up/workflows/build.md"
      provides: "Fronteira de limpeza entre ondas com registro deterministico"
  key_links:
    - from: "up/workflows/plan.md"
      to: "up/bin/lib/janela.cjs"
      via: "subcomando de comparacao de janela na CLI de ferramentas"
    - from: "up/hooks/up-session-start.js"
      to: "up/bin/lib/janela.cjs"
      via: "registro de reinicio de contexto no evento de inicio de sessao"
---

# Fase 18 Plano 002: Higiene de contexto prescrita

**Onda**: 2 (depende do plano 001, que entrega o contador de janela e o registro de higiene)

## Objetivo

Parar de tratar higiene de contexto como conselho e passar a prescrever onde cortar. São duas prescrições
opostas, no mesmo plano porque as duas dependem do mesmo mecanismo entregue no plano 001.

Do brainstorm até o plano pronto é proibido cortar. É o trecho onde a intenção ainda mora na conversa e
não em disco, então compactar ou limpar ali perde a parte que não foi escrita. Quando o corte acontece
mesmo assim, o planejamento tem de perceber, avisar o dono e reabrir o trecho, em vez de seguir com
metade do contexto fingindo que está inteiro.

Entre execuções de plano o corte é obrigatório. Ali o contexto acumulado do orquestrador é lastro: o
próximo plano nasce do disco. E a fase registra que a fronteira aconteceu, senão a regra é inauditável.

## Contexto

Ler antes de começar: `.plano/fases/18-contexto-e-revisao/CONTEXT.md` (decisão P4),
`up/hooks/up-session-start.js` (já distingue os eventos que reiniciam contexto e já falha aberto),
`up/workflows/plan.md` (estágios 0 e 1), `up/workflows/build.md` (loop de ondas),
`up/workflows/up.md` (passo que grava o briefing) e `up/skills/up-brainstorm/SKILL.md` (estado terminal
do brainstorm).

O plano 001 entrega os subcomandos de janela e de registro de higiene. Se ele ainda não estiver concluído
no momento da execução, parar e escalar; não reimplementar mecanismo nenhum aqui. Este plano só chama.

O formato de toda pergunta ao dono é o da fase 13: resposta recomendada mais o motivo dela. Ler a
referência de questionamento antes de redigir qualquer texto de pergunta.

## Tarefas

### 1. Incrementar o contador de janela no reinício de contexto

Em `up/hooks/up-session-start.js`, o gancho já recebe a origem do evento e já filtra os eventos que
reiniciam contexto. Acrescentar, depois desse filtro e antes de emitir o bloco injetado, a chamada de
registro de reinício para o diretório do projeto recebido no payload, importando a biblioteca de janela
por caminho relativo ao próprio gancho, com as duas resoluções de caminho que o gancho já usa para achar
a skill de bootstrap (layout de repositório e layout instalado).

Regras que não podem ser quebradas: o gancho continua saindo em silêncio e com código zero em qualquer
erro; a chamada de registro fica dentro de um bloco de proteção próprio, para que falha de escrita no
diretório temporário não impeça a injeção do bootstrap; o gancho não ganha dependência de rede nem de
processo externo; e o gancho não passa a depender da existência da biblioteca, porque ele é instalado em
runtimes onde o layout pode variar. Ausência da biblioteca equivale a não contar, em silêncio.

Retomada de sessão que preserva contexto continua fora dos eventos que incrementam, porque ali não houve
corte.

### 2. Declarar a janela ininterrupta na doutrina e carimbar o briefing

Em `up/skills/up-brainstorm/SKILL.md`, no ponto em que a skill manda escrever o briefing e entregar o
handoff para o planejamento, acrescentar duas coisas.

A regra, enunciada uma única vez e nesta skill: o trecho que vai do brainstorm até o plano pronto
acontece em janela ininterrupta, e compactar ou limpar antes de o plano pronto existir é proibido. Se o
corte acontecer, o trecho é reaberto, e não continuado.

O carimbo: depois de escrever o briefing, rodar o subcomando de marcação de janela sobre ele.

### 3. Carimbar o briefing também na porta única

Em `up/workflows/up.md`, no passo que grava o briefing e entrega o handoff para o planejamento, incluir a
mesma chamada de marcação, porque esse workflow também escreve briefing sem passar pela skill. Apontar
para a regra escrita na skill em vez de repetir o texto dela. Uma regra, um lugar.

### 4. Detectar o corte no planejamento e reabrir o trecho

Em `up/workflows/plan.md`, acrescentar um passo novo no estágio zero, antes do intake, chamado detecção
de corte de janela. Ele só roda quando existe briefing e não existe plano pronto gravado, que é a
condição de trecho aberto. Nesse caso, roda a comparação de janela.

Resultado intacta: seguir normalmente, sem dizer nada ao dono. Silêncio quando está tudo bem é parte do
contrato: aviso que aparece sempre deixa de ser lido.

Resultado cortou, ou indeterminada: parar antes do intake e falar com o dono no formato da fase 13. O
texto declara o que aconteceu, isto é, que o trecho entre o brainstorm e o plano pronto foi cortado e que
parte do que foi decidido pode não ter sido escrita, e oferece duas saídas. A recomendada é reabrir o
trecho, com o motivo de que seguir com contexto parcial produz plano que não reflete a decisão. A outra é
seguir assim mesmo, assumindo a perda.

Reabrir o trecho significa: reler o briefing com o dono, listar o que ficou marcado como pendente ou
aberto nele, e retomar a conversa desses pontos antes de planejar. Não significa recomeçar o brainstorm
do zero, e o texto do workflow tem de dizer isso, senão a regra vira punição.

Quando o dono escolhe seguir, a escolha entra no resumo do planejamento como ressalva, para o veredito
não aparecer depois sem explicação.

### 5. Fronteira de limpeza entre execuções de plano

Em `up/workflows/build.md`, no loop de ondas, acrescentar a fronteira de limpeza no fim de cada onda,
depois do portão de artefatos da onda e antes de começar a próxima. A fronteira tem três partes.

Largar o contexto inline da onda que acabou: o orquestrador não carrega para a onda seguinte o conteúdo
dos planos, dos resumos nem das saídas dos executores da onda anterior. O que ele precisa saber vem de
disco, pelo índice de planos e pelo documento de estado.

Registrar a fronteira, com o subcomando de registro de limpeza entregue no plano 001, informando a onda
que fechou e o identificador do primeiro plano da onda seguinte.

Consultar o limiar de zona segura. Se ele já foi cruzado neste ponto, oferecer handoff em vez de emendar
a onda seguinte. A leitura do limiar e o texto da oferta são do plano 005; aqui fica o ponto de chamada,
com degradação silenciosa enquanto o plano 005 não entregou, isto é, ausência da chave de configuração
equivale a não oferecer.

Deixar escrito no workflow que a regra é sobre a sessão do orquestrador, e não sobre o subagente de
execução, que já nasce com contexto fresco. Sem essa frase, a instrução vira ritual aplicado no lugar
errado.

### 6. Conferência da higiene no fim do loop de ondas

Ainda em `up/workflows/build.md`, no fim do loop, conferir com a consulta de higiene que o número de
fronteiras registradas é maior ou igual ao número de ondas executadas menos um.

Quando falta registro, o build não para: registra a falta como ressalva no relatório da fase. Bloquear a
entrega por causa de um registro de higiene seria trocar o remédio pelo veneno, e essa justificativa fica
escrita ao lado da conferência, para ninguém endurecer isso depois sem saber por que era frouxo.

### 7. Smoke das duas superfícies

Smoke do corte: num projeto de teste com briefing gravado e marcado e sem plano pronto, chamar o registro
de reinício três vezes, rodar a comparação e conferir que devolve corte. Percorrer o texto do workflow de
planejamento e conferir que o passo novo manda parar e perguntar nesse caso. Repetir sem reinício e
conferir que a comparação devolve intacta e que o workflow segue calado. Repetir com briefing sem marca e
conferir que devolve indeterminada e cai no mesmo aviso, nunca em seguir calado.

Smoke do gancho: rodar `up/hooks/up-session-start.js` com um payload de teste de início de sessão e
conferir que a saída injetada continua completa, com bootstrap e trecho de estado. Repetir com o
diretório temporário sem permissão de escrita e conferir que a saída continua completa e o código de
saída continua zero, o que prova a falha aberta.

Smoke da limpeza: percorrer o loop de ondas de uma fase de teste com duas ondas e conferir que a consulta
de higiene devolve pelo menos uma linha, com onda e plano seguinte preenchidos.

## Arquivos tocados com contrato

| Arquivo | Contrato |
|---------|----------|
| `up/hooks/up-session-start.js` | Editado. Incrementa o contador de janela nos eventos que reiniciam contexto. Continua falhando aberto, em silêncio, e continua injetando bootstrap e estado mesmo quando o registro falha |
| `up/skills/up-brainstorm/SKILL.md` | Editado. Regra da janela ininterrupta enunciada uma única vez, mais o carimbo do briefing |
| `up/workflows/up.md` | Editado. Carimbo do briefing no passo que o grava, apontando para a regra da skill |
| `up/workflows/plan.md` | Editado. Passo de detecção de corte no estágio zero, com pergunta no formato da fase 13 e reabertura do trecho. Nenhum outro estágio é tocado |
| `up/workflows/build.md` | Editado. Fronteira de limpeza no fim de cada onda, ponto de chamada da oferta de handoff e conferência de higiene no fim do loop. Nenhum outro estágio é tocado |

## Critério de aceite

Com briefing gravado e sem plano pronto, um reinício de contexto entre o brainstorm e o planejamento faz
a comparação devolver corte, e o workflow de planejamento para, avisa e oferece reabrir com recomendação
e motivo. Sem reinício, a comparação devolve intacta e o planejamento segue calado. Briefing sem marca
devolve indeterminada e cai no aviso.

O gancho de início de sessão continua injetando o bootstrap e o trecho de estado mesmo quando a escrita
do marcador falha, e continua saindo com código zero.

Uma fase com duas ondas termina com pelo menos uma fronteira de limpeza registrada, com onda e plano
seguinte preenchidos. O texto do build declara que a regra é sobre a sessão do orquestrador, e a
conferência de higiene registra ressalva sem bloquear.

A regra da janela ininterrupta aparece escrita em um único lugar, e as outras superfícies apontam para
ele.

## Tipo de prova

Smoke, conforme a tarefa 7. A prova de lógica do mecanismo já foi dada no plano 001; repeti-la aqui seria
provar duas vezes a mesma coisa.

## FORA DE ESCOPO

Qualquer implementação de mecanismo. Contador de janela, marcação de briefing, comparação e registro de
higiene vêm prontos do plano 001. Este plano chama.

O limiar numérico de zona segura, a leitura dele e o texto da oferta de handoff. São do plano 005. Aqui
existe apenas o ponto de chamada, que degrada em silêncio.

Fazer o orquestrador limpar a própria janela por conta própria. Ele não consegue: a fronteira é largar o
contexto inline, re-hidratar do disco e registrar, conforme a decisão P4 do contexto da fase.

Mudança no gancho de barra de status e no gancho de monitor de contexto. O primeiro não entra nesta fase;
o segundo é do plano 005.

Os estágios do workflow de construção que tratam de revisão, de gate e de fechamento de fase. São dos
planos 006 e 007, em ondas posteriores.
