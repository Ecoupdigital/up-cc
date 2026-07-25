---
phase: 18-contexto-e-revisao
plan: "002"
type: glue
autonomous: true
wave: 2
depends_on: ["001"]
requirements: [CTX-01, CTX-02]
objective: "Higiene de contexto prescrita: janela ininterrupta do brainstorm ao plano pronto e limpeza obrigatoria entre execucoes de plano"
prova: "glue:smoke"
files_modified:
  - up/hooks/up-session-start.js
  - up/skills/up-brainstorm/SKILL.md
  - up/workflows/up.md
  - up/workflows/plan.md
  - up/workflows/build.md
  - .plano/fases/18-contexto-e-revisao/evidencia/002-smoke.txt
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

<objective>
Prescrever onde cortar contexto e onde é proibido cortar: janela ininterrupta do brainstorm até o plano pronto, com detecção e reabertura quando o corte acontece mesmo assim, e limpeza obrigatória entre execuções de plano, declarada no registro da fase.
</objective>

**Onda:** 2. **Depende de:** plano 001, que entrega o contador de janela e o registro de higiene.
**Tipo de prova:** smoke. A prova de lógica do mecanismo já foi dada no plano 001; repeti-la aqui seria provar duas vezes a mesma coisa.

## As duas prescrições, e por que são opostas

Do brainstorm até o plano pronto é proibido cortar. É o trecho onde a intenção ainda mora na conversa e
não em disco, então compactar ou limpar ali perde a parte que não foi escrita.

Entre execuções de plano o corte é obrigatório. Ali o contexto acumulado do orquestrador é lastro: o
próximo plano nasce do disco. E a fase registra que a fronteira aconteceu, senão a regra é inauditável.

## Contexto

@.plano/fases/18-contexto-e-revisao/CONTEXT.md - decisão P4, sobre o que o orquestrador consegue de fato fazer numa fronteira
@up/hooks/up-session-start.js - já distingue os eventos que reiniciam contexto e já falha aberto
@up/workflows/plan.md - estágios 0 e 1, onde a detecção entra
@up/workflows/build.md - loop de ondas, onde a fronteira entra
@up/workflows/up.md - passo que grava o briefing
@up/skills/up-brainstorm/SKILL.md - estado terminal do brainstorm
@up/references/questioning.md - formato de pergunta com recomendação, entregue pela fase 13

Este plano só chama mecanismo. Se os subcomandos de janela e de higiene do plano 001 não existirem,
parar e escalar.

## Tarefas

<task id="1" type="auto">
<files>up/hooks/up-session-start.js (editar: bloco após o filtro de origem, antes da emissão)</files>
<action>
Incrementar o contador de janela a cada reinício de contexto.

O gancho já recebe a origem do evento e já filtra os eventos que reiniciam contexto. Acrescentar, depois desse filtro e antes de emitir o bloco injetado, a chamada de registro de reinício para o diretório do projeto recebido no payload, importando `janela.cjs` com as duas candidaturas de caminho que o gancho já usa para achar a skill de bootstrap: a do layout de repositório e a do layout instalado.

Regras que não podem ser quebradas. O gancho continua saindo em silêncio e com código zero em qualquer erro. A chamada de registro fica dentro de um bloco de proteção próprio, para que falha de escrita no diretório temporário não impeça a injeção do bootstrap nem do trecho de estado. O gancho não ganha dependência de rede nem de processo externo. Ausência da biblioteca equivale a não contar, em silêncio, porque o gancho é instalado em runtimes onde o layout pode variar.

Retomada de sessão que preserva contexto continua fora dos eventos que incrementam, porque ali não houve corte.
</action>
<verify><automated>echo '{"source":"clear","cwd":"'$(pwd)'"}' | node up/hooks/up-session-start.js | grep -q "EXTREMELY_IMPORTANT" && echo '{"source":"clear","cwd":"/inexistente/xyz"}' | node up/hooks/up-session-start.js >/dev/null && echo "gancho ok"</automated></verify>
<done>O gancho incrementa o contador nos eventos de reinício, continua injetando bootstrap e estado, e sai com código zero mesmo com diretório inexistente ou biblioteca ausente.</done>
</task>

<task id="2" type="auto">
<files>up/skills/up-brainstorm/SKILL.md (editar: passo que escreve o briefing e entrega o handoff)</files>
<action>
Enunciar a regra da janela ininterrupta e carimbar o briefing.

A regra, escrita uma única vez e nesta skill: o trecho que vai do brainstorm até o plano pronto acontece em janela ininterrupta, e compactar ou limpar antes de o plano pronto existir é proibido. Se o corte acontecer, o trecho é reaberto, e não continuado.

O carimbo: depois de escrever o briefing, rodar o subcomando de marcação de janela sobre ele, com a linha de comando pronta.

Nenhuma outra superfície redefine a regra. Quem precisar dela aponta para aqui.
</action>
<verify><automated>grep -q "janela ininterrupta" up/skills/up-brainstorm/SKILL.md && grep -q "janela marcar" up/skills/up-brainstorm/SKILL.md && echo "doutrina ok"</automated></verify>
<done>A skill declara a proibição de compactar ou limpar antes do plano pronto existir e manda carimbar o briefing com o comando pronto.</done>
</task>

<task id="3" type="auto">
<files>up/workflows/up.md (editar: passo que grava o briefing e entrega o handoff para o planejamento)</files>
<action>
Carimbar o briefing também na porta única, porque este workflow escreve briefing sem passar pela skill.

Incluir a mesma chamada de marcação logo após o commit do briefing. Apontar para a regra escrita na skill em vez de repetir o texto dela: uma regra, um lugar.
</action>
<verify><automated>grep -q "janela marcar" up/workflows/up.md && test $(grep -c "janela ininterrupta" up/workflows/up.md) -eq 0 && echo "porta unica ok"</automated></verify>
<done>A porta única carimba o briefing e aponta para a regra da skill, sem reescrevê-la.</done>
</task>

<task id="4" type="auto">
<files>up/workflows/plan.md (editar: estágio 0, passo novo antes do intake)</files>
<action>
Detectar o corte no planejamento e reabrir o trecho.

Acrescentar no estágio zero, antes do intake, um passo de detecção de corte de janela. Ele só roda quando existe briefing e não existe plano pronto gravado, que é a condição de trecho aberto. Nesse caso, roda a comparação de janela.

Resultado `intacta`: seguir normalmente, sem dizer nada ao dono. Silêncio quando está tudo bem é parte do contrato: aviso que aparece sempre deixa de ser lido.

Resultado `cortou` ou `indeterminada`: parar antes do intake e falar com o dono no formato de pergunta da fase 13. O texto declara o que aconteceu, isto é, que o trecho entre o brainstorm e o plano pronto foi cortado e que parte do que foi decidido pode não ter sido escrita. Oferece duas saídas. A recomendada é reabrir o trecho, com o motivo de que seguir com contexto parcial produz plano que não reflete a decisão. A outra é seguir assim mesmo, assumindo a perda.

Reabrir o trecho significa reler o briefing com o dono, listar o que ficou marcado como pendente ou aberto nele, e retomar a conversa desses pontos antes de planejar. Não significa recomeçar o brainstorm do zero, e o texto do workflow tem de dizer isso, senão a regra vira punição.

Quando o dono escolhe seguir, a escolha entra no resumo do planejamento como ressalva, para o veredito não aparecer depois sem explicação.

Nenhum outro estágio do workflow é tocado.
</action>
<verify><automated>grep -q "janela comparar" up/workflows/plan.md && grep -qi "reabrir" up/workflows/plan.md && echo "deteccao ok"</automated></verify>
<done>O planejamento roda a comparação apenas quando há briefing e não há plano pronto, segue calado em `intacta`, e nos outros dois resultados para, avisa e oferece reabrir com recomendação e motivo.</done>
</task>

<task id="5" type="auto">
<files>up/workflows/build.md (editar: fim do loop de ondas, mais a conferência no fim do loop)</files>
<action>
Fronteira de limpeza entre execuções de plano, e conferência da higiene.

Acrescentar a fronteira no fim de cada onda, depois do portão de artefatos da onda e antes de começar a próxima. A fronteira tem três partes.

Largar o contexto inline da onda que acabou: o orquestrador não carrega para a onda seguinte o conteúdo dos planos, dos resumos nem das saídas dos executores da onda anterior. O que ele precisa saber vem de disco, pelo índice de planos e pelo documento de estado.

Registrar a fronteira, com o subcomando de registro de limpeza do plano 001, informando a onda que fechou e o identificador do primeiro plano da onda seguinte.

Consultar o limiar de zona segura. Se ele já foi cruzado neste ponto, oferecer handoff em vez de emendar a onda seguinte. A leitura do limiar e o texto da oferta são do plano 005; aqui fica o ponto de chamada, com degradação silenciosa enquanto o plano 005 não entregou, isto é, ausência da chave de configuração equivale a não oferecer.

Deixar escrito que a regra é sobre a sessão do orquestrador, e não sobre o subagente de execução, que já nasce com contexto fresco. Sem essa frase, a instrução vira ritual aplicado no lugar errado.

No fim do loop, conferir com a consulta de higiene que o número de fronteiras registradas é maior ou igual ao número de ondas executadas menos um. Quando falta registro, o build não para: registra a falta como ressalva no relatório da fase. Bloquear a entrega por causa de um registro de higiene seria trocar o remédio pelo veneno, e essa justificativa fica escrita ao lado da conferência, para ninguém endurecer isso depois sem saber por que era frouxo.

Nenhum outro estágio do workflow é tocado. O estágio de revisão e o gate pertencem aos planos 006 e 007.
</action>
<verify><automated>grep -q "phase registrar-limpeza" up/workflows/build.md && grep -q "phase higiene" up/workflows/build.md && grep -qi "sessao do orquestrador\|sessão do orquestrador" up/workflows/build.md && echo "fronteira ok"</automated></verify>
<done>O loop de ondas registra a fronteira de limpeza, re-hidrata do disco, chama a oferta de handoff com degradação silenciosa, e a conferência de higiene no fim do loop registra ressalva sem bloquear.</done>
</task>

<task id="6" type="auto">
<files>.plano/fases/18-contexto-e-revisao/evidencia/002-smoke.txt (novo)</files>
<action>
Smoke das três superfícies, com a saída gravada como prova.

Smoke do corte: num projeto de teste com briefing gravado e marcado e sem plano pronto, chamar o registro de reinício três vezes, rodar a comparação e conferir que devolve `cortou`. Repetir sem reinício e conferir `intacta`. Repetir com briefing sem marca e conferir `indeterminada`.

Smoke do gancho: rodar o gancho de início de sessão com um payload de teste e conferir que a saída injetada continua completa. Repetir com o diretório temporário sem permissão de escrita e conferir que a saída continua completa e o código de saída continua zero, o que prova a falha aberta.

Smoke da limpeza: rodar o registro de fronteira duas vezes numa fase de teste e conferir que a consulta devolve duas linhas com onda e plano seguinte preenchidos.

Gravar as saídas dos três em `evidencia/002-smoke.txt`.
</action>
<verify><automated>mkdir -p .plano/fases/18-contexto-e-revisao/evidencia && node up/bin/up-tools.cjs janela estado --raw >> .plano/fases/18-contexto-e-revisao/evidencia/002-smoke.txt 2>&1; echo '{"source":"clear","cwd":"'$(pwd)'"}' | node up/hooks/up-session-start.js >> .plano/fases/18-contexto-e-revisao/evidencia/002-smoke.txt 2>&1; test -s .plano/fases/18-contexto-e-revisao/evidencia/002-smoke.txt && echo "smoke gravado"</automated></verify>
<done>Os três resultados de comparação foram exercitados e registrados, o gancho segue completo e com código zero mesmo sem permissão de escrita, e o registro de limpeza acumula duas linhas. A saída está em `evidencia/002-smoke.txt`.</done>
</task>

## Critérios de Sucesso

- [ ] Com briefing marcado e um reinício no meio, a comparação devolve `cortou` e o planejamento para, avisa e oferece reabrir com recomendação e motivo
- [ ] Sem reinício, a comparação devolve `intacta` e o planejamento segue calado
- [ ] Briefing sem marca devolve `indeterminada` e cai no mesmo aviso, nunca em seguir calado
- [ ] O gancho de início de sessão continua injetando bootstrap e estado mesmo quando a escrita do marcador falha
- [ ] Uma fase com duas ondas termina com pelo menos uma fronteira de limpeza registrada, com onda e plano seguinte
- [ ] O texto do build declara que a regra é sobre a sessão do orquestrador
- [ ] A regra da janela ininterrupta aparece escrita em um único lugar, e as outras superfícies apontam para ele

## FORA DE ESCOPO

- **Não implementar mecanismo.** Contador, marcação, comparação e registro vêm prontos do plano 001. Este plano chama.
- **Não fechar o limiar nem redigir a oferta de handoff.** São do plano 005. Aqui existe apenas o ponto de chamada, que degrada em silêncio.
- **Não fazer o orquestrador limpar a própria janela.** Ele não consegue: a fronteira é largar o contexto inline, re-hidratar do disco e registrar.
- **Não tocar no gancho de barra de status nem no de monitor de contexto.** O primeiro não entra nesta fase; o segundo é do plano 005.
- **Não tocar nos estágios de revisão, gate e fechamento de fase** do workflow de construção. São dos planos 006 e 007, em ondas posteriores.
