---
phase: 19-auditoria-visual-escopada
plan: 19-004
type: feature
autonomous: true
wave: 2
depends_on: [19-002, 19-003]
requirements: [AUD-04, AUD-08]
prova: smoke
must_haves:
  truths:
    - "O comando de auditoria escopa por concentração de mudança antes de analisar, e mostra o escopo ao dono"
    - "O relatório HTML e gerado, aberto no navegador e o caminho absoluto e informado, inclusive quando a abertura falha"
    - "Depois de apresentar os candidatos o agente PARA, com uma única pergunta de handoff que chega com opção recomendada e motivo"
    - "E impossível o passo seguinte rodar sem a escolha do dono registrada, porque o workflow abre com uma guarda que barra"
  artifacts:
    - path: "up/workflows/auditar.md"
      provides: "Pipeline escopado em cinco passos e o gate duro entre diagnosticar e projetar"
    - path: "up/commands/auditar.md"
      provides: "Porta do comando com as flags de janela e de rede alargada, e objetivo reescrito"
    - path: "up/bin/up-tools.cjs"
      provides: "Inicialização do workflow de auditoria por nome próprio no despachante"
  key_links:
    - from: "up/workflows/auditar.md"
      to: "subcomando hotspots da CLI de ferramentas"
      via: "passo de escopo, antes de spawnar o auditor"
    - from: "up/workflows/auditar.md"
      to: "subcomando audit-report render da CLI de ferramentas"
      via: "payload do auditor entregue pela entrada padrão"
---

# Fase 19 Plano 004: Pipeline escopado e gate duro

**Objetivo:** Ligar as peças num pipeline único e, principalmente, colocar a parede: o auditor apresenta os candidatos e PARA, com uma pergunta só. A parede não pode ser promessa em prosa, tem de ser uma guarda que falha quando alguém tenta emendar diagnostico com design.

**Onda:** 2. Depende do plano 002 (renderizador) e do plano 003 (auditor). O tratamento da resposta do dono, a rejeição que vira memória e a higiene da árvore ficam no plano 005, que roda depois deste.

## Duas decisões fechadas aqui, com motivo

**1. A conversão de sugestão em fase sai da auditoria.** Hoje o último passo do workflow oferece transformar sugestão em fase do roadmap, e isso é projetar no mesmo turno do diagnostico, exatamente o que esta fase proibe. Depois do gate, a auditoria aponta a rota e encerra. O subcomando de gerar fase a partir de relatório continua na CLI e não é removido, porque outros caminhos podem usa-lo.

**2. A pesquisa de mercado passa para depois do gate.** A flag de ideação de feature continua existindo e funcionando, mas roda depois da resposta do dono, porque ideação e projeto e não diagnostico. Vindo a flag, o workflow avisa isso na abertura, em uma linha.

## Contexto

@up/workflows/auditar.md - o workflow atual, que este plano reescreve. Hoje ele cria diretório dentro do planejamento, spawna auditor e sintetizador, apresenta relatório em markdown e oferece conversão em fase.
@up/commands/auditar.md - a porta do comando: frontmatter com lista de ferramentas, objetivo e critérios de sucesso.
@up/references/audit-findings-contract.md - contrato do payload, entregue no plano 001.
@.plano/SYSTEM-DESIGN.md - a seção 7 lista a auditoria como superfície interativa e diz textualmente que ela hoje despeja lista e passa a ter gate duro com pergunta única de handoff.

## Contrato herdado de outra fase

O formato de pergunta com opção recomendada e motivo vem da fase 13. Não adivinhar por nome de arquivo: descobrir o contrato real lendo a reference de questionamento instalada e o resumo da fase 13 no diretório de fases. Se a fase 13 ainda não tiver aterrissado, aplicar o comportamento mínimo exigido pelo requisito: opção recomendada em primeiro lugar, com o motivo em uma linha dentro da própria opção.

## Arquivos tocados e contrato de cada um

| Arquivo | Contrato público que ele passa a oferecer |
|---------|-------------------------------------------|
| `up/workflows/auditar.md` (reescrito parcialmente) | Passos 1 a 5 do pipeline: entrada, escopo, diagnostico, relatório e gate duro |
| `up/commands/auditar.md` (editado) | Porta com as flags `--commits N`, `--amplo` e a flag de ideação já existente, e objetivo reescrito |
| `up/bin/up-tools.cjs` (editado, uma linha) | A inicialização do workflow de auditoria passa a existir por nome próprio no despachante |

## Tarefas

<task id="1" type="auto">
<files>up/bin/up-tools.cjs</files>
<files>up/workflows/auditar.md</files>
<action>
**Defeito pré-existente a consertar antes de tudo (verificado em 2026-07-25).** O workflow de auditoria de hoje chama a inicialização pelo nome `auditar`, e esse nome não existe no despachante: a CLI responde `Unknown init workflow: auditar` e lista os onze nomes aceitos. Ou seja, o passo 1 da auditoria falha hoje, silenciosamente para quem não le a saída. Conserto de uma linha, no bloco de inicialização do despachante, reaproveitando o carregador que já serve a auditoria:

```javascript
        case 'auditar':
        case 'melhorias':
          cmdInitMelhorias(cwd, raw);
          break;
```

Acrescentar `auditar` também a lista de nomes na mensagem de erro. Não renomear nem remover `melhorias` e `ideias`, porque projeto antigo pode chamar por esses nomes.

Depois disso, reescrever o bloco `<purpose>` e os passos 1 a 3 do workflow.

`<purpose>`: auditoria escopada por concentração de mudança, saída em relatório HTML autocontido no diretório temporário, gate duro entre diagnosticar e projetar. Standalone: não exige projeto UP inicializado. Não commita, não mexe no arquivo de estado, não escreve dentro do repositório.

**Passo 1, entrada e flags.** Rodar a inicialização do workflow de auditoria pela CLI, agora pelo nome `auditar`. Parsear as flags do argumento:
- `--commits N`: janela da concentração de mudança. Padrão 50.
- `--amplo`: pula o escopo e varre largo de proposito, com `rede_alargada` verdadeiro e motivo `alargamento pedido pelo dono`.
- a flag de ideação de feature que já existe: aceita, e apenas anuncia na abertura que a pesquisa de mercado roda depois do gate.

Banner de abertura no vocabulário visual do UP, com o título `UP > AUDITORIA ESCOPADA`.

**Passo 2, escopo.** Com `--amplo`, pular direto para o auditor com rede alargada. Sem `--amplo`:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" hotspots --commits ${COMMITS:-50} --limite 20
```
Exibir ao dono, antes de qualquer análise, três linhas: a janela usada, se há concentração, e os cinco arquivos do topo com o número de toques. Quando `concentracao` for falsa, exibir a frase de alargamento com o motivo devolvido pela operação. Esta exibição é obrigatória: o dono precisa saber onde a auditoria vai olhar antes de ela olhar.

**Passo 3, spawn do auditor.** Um único `Task` com o agente auditor, passando no prompt: o objetivo, o resultado bruto da operação de pontos quentes, a janela usada, a instrução de carregar a reference do contrato de achado e as três references de dimensao sob demanda, e a exigência de devolver o caminho absoluto do payload. Remover do prompt toda menção a escrever arquivo dentro do diretório de planejamento.

Apagar do workflow o passo que criava diretório dentro do planejamento e o passo que perguntava se sobrescreve auditoria anterior. Sem arquivo no repositório, não há o que sobrescrever.
</action>
<verify><automated>node up/bin/up-tools.cjs init auditar > /dev/null && node -e "const t=require('fs').readFileSync('up/workflows/auditar.md','utf-8');if(t.includes('.plano/auditar')||t.includes('.plano/auditoria')){console.error('workflow ainda escreve no repositorio');process.exit(1)}const req=['hotspots','--commits','--amplo','AUDITORIA ESCOPADA'];const f=req.filter(s=>!t.includes(s));if(f.length){console.error('faltando:',f);process.exit(1)}console.log('passos 1 a 3 OK')"</automated></verify>
<done>`init auditar` responde com JSON em vez de erro, o workflow abre com o escopo, exibe a janela e os pontos quentes antes de analisar, spawna o auditor uma vez e não cria mais nenhum diretório dentro do repositório.</done>
</task>

<task id="2" type="auto">
<files>up/workflows/auditar.md</files>
<action>
Escrever o passo 4, geração e abertura do relatório.

1. Receber do auditor o caminho absoluto do payload. Conferir que o arquivo existe. Se não existir, reportar qual passo falhou e encerrar sem inventar relatório.
2. Renderizar:
```bash
cat "$PAYLOAD" | node "$HOME/.claude/up/bin/up-tools.cjs" audit-report render
```
   Sem `--sem-abrir`, porque em uso real o relatório abre no navegador. A saída traz `arquivo`, `abriu`, `cards` e `descartados_por_falsificador`.
3. Se o comando recusar o payload (saída por erro com a lista de problemas), devolver a lista ao auditor pelo mesmo `Task` e pedir reemissao, no máximo duas vezes. Na terceira recusa, mostrar os erros ao dono e encerrar. Nunca contornar o validador, nunca renderizar a mao, nunca publicar card fora do contrato.
4. Informar ao dono, em bloco próprio e legível, o **caminho absoluto** do relatório, e dizer se ele abriu sozinho. Quando `abriu` for falso, a mensagem tem de dizer que basta abrir o caminho no navegador. O caminho absoluto é obrigatório nos dois casos.
5. Gravar, no mesmo diretório do relatório, um arquivo de sessão `sessao.json` com:
```json
{ "gate": "aguardando-escolha", "apresentado_em": "<ISO>", "relatorio": "<caminho absoluto>", "payload": "<caminho absoluto>", "candidatos": ["AC-001", "AC-002"], "escolha": null, "motivo_recusa": null }
```
   Este arquivo mora fora do repositório, junto do relatório, e existe por um motivo único: tornar o gate verificável por terceiro em vez de verificável por confianca.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/workflows/auditar.md','utf-8');const req=['audit-report render','caminho absoluto','sessao.json','aguardando-escolha'];const f=req.filter(s=>!t.includes(s));if(f.length){console.error('faltando no passo 4:',f);process.exit(1)}console.log('passo 4 OK')"</automated></verify>
<done>O passo 4 renderiza pelo subcomando, trata a recusa do validador com no máximo duas reemissoes, informa o caminho absoluto nos dois casos de abertura e grava o marcador de sessão fora do repositório.</done>
</task>

<task id="3" type="auto">
<files>up/workflows/auditar.md</files>
<action>
Escrever o passo 5, que é o gate duro. Este é o passo mais importante da fase, e ele tem de estar escrito de forma que não caiba interpretação.

**5.1 Apresentação curta.** Exibir no terminal, no máximo: a linha de escopo, a recomendação principal com o motivo, uma linha por candidato no formato `AC-NNN [badge] titulo`, a contagem de descartados e o caminho absoluto do relatório. Nada além disso: o detalhe está no HTML, e repetir o HTML no terminal gasta contexto e atenção à toa.

**5.2 A pergunta única de handoff.** Uma pergunta só, no formato entregue pela fase 13 (opção recomendada primeiro, com o motivo dela na própria opção). Texto:

```
Qual destes você quer explorar?
```

Opções: um item por candidato publicado, mais o item `nenhum destes`. A opção recomendada e o achado apontado por `recomendacao_principal`, e o motivo exibido e o campo `motivo` do payload, literalmente, sem reescrita.

**5.3 PARADA DURA.** Escrever no workflow, em bloco próprio e com o título em caixa alta, as proibições do turno da apresentação:

- Proibido, no mesmo turno: escrever plano, tarefa, passo a passo, patch, trecho de código, estimativa ou próxima ação de implementação.
- Proibido perguntar mais de uma coisa. Uma pergunta, e o turno acaba nela.
- Proibido antecipar a resposta ("provavelmente você vai querer o primeiro, então já adianto que...").
- Proibido começar a projetar enquanto espera.

**Critério observável de que o agente realmente parou**, escrito no próprio workflow como checagem, com três condições conjuntivas:
1. `sessao.json` está com `gate: "aguardando-escolha"` e `escolha: null`.
2. A última coisa emitida no turno e a pergunta. Não há texto depois dela.
3. O passo seguinte começa com esta guarda, e ela e literal:
```bash
GATE=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf-8')).escolha)" "$SESSAO")
if [ "$GATE" = "null" ] || [ -z "$GATE" ]; then
  echo "GATE FECHADO: o passo de projetar não roda sem escolha registrada."
  exit 0
fi
```
   Ou seja: não é promessa em prosa, é uma guarda que falha. Se alguém tentar emendar diagnostico com design, a guarda barra.

Escrever a guarda já no fim deste passo, com a nota de que o passo 6 (entregue no plano 005) abre por ela. Assim o gate existe mesmo que o plano 005 atrase.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/workflows/auditar.md','utf-8');const req=['Qual destes você quer explorar','PARADA DURA','GATE FECHADO','nenhum destes'];const f=req.filter(s=>!t.includes(s));if(f.length){console.error('faltando no gate:',f);process.exit(1)}const i=t.indexOf('PARADA DURA'),j=t.indexOf('GATE FECHADO');if(!(i<j)){console.error('a guarda precisa vir depois da parada');process.exit(1)}console.log('gate OK')"</automated></verify>
<done>O passo 5 apresenta em blocos curtos, faz uma única pergunta com opção recomendada e motivo literal do payload, lista as quatro proibições do turno, e termina com a guarda que barra a execução sem escolha registrada.</done>
</task>

<task id="4" type="auto">
<files>up/commands/auditar.md</files>
<action>
Atualizar a porta do comando para casar com o workflow novo, sem inventar comando nem alvo de instalação.

1. `description` do frontmatter: auditoria escopada por concentração de mudança, relatório HTML autocontido, e gate duro entre diagnosticar e projetar.
2. `argument-hint`: `"[--commits N] [--amplo] [--features]"`.
3. `allowed-tools`: manter a lista atual. A ferramenta de pergunta ao dono continua necessária, porque a pergunta de handoff e uma superfície interativa.
4. Bloco `<objective>`: reescrever em quatro parágrafos curtos: o que a auditoria faz, o que ela deliberadamente não faz (não projeta, não gera fase, não escreve no repositório), onde a saída mora (diretório temporário, caminho absoluto informado), e qual o gate.
5. Bloco `<context>`: documentar as três flags, uma linha cada, com o padrão de 50 commits declarado por escrito.
6. Bloco `<process>`: os passos do workflow em uma linha cada.
7. Bloco `<success_criteria>`: espelhar os critérios do workflow, sem duplicar texto longo.
8. Apagar do arquivo toda menção a criar diretório dentro do planejamento, ao relatório markdown e a conversão de sugestão em fase.
</action>
<verify><automated>node -e "const t=require('fs').readFileSync('up/commands/auditar.md','utf-8');if(t.includes('.plano/auditoria')||t.includes('.plano/auditar')||t.includes('RELATORIO.md')||t.includes('generate-from-report')){console.error('comando ainda cita o pipeline antigo');process.exit(1)}const req=['--commits','--amplo','diretório temporário'];const f=req.filter(s=>!t.includes(s));if(f.length){console.error('faltando:',f);process.exit(1)}if(/\u2014|\u2013/.test(t)){console.error('travessao encontrado');process.exit(1)}console.log('comando OK')"</automated></verify>
<done>O comando anuncia as três flags com o padrão de janela declarado, descreve o gate, aponta o diretório temporário como destino da saída e não cita mais nenhuma peça do pipeline antigo.</done>
</task>

<task id="5" type="auto">
<files>up/workflows/auditar.md</files>
<files>up/commands/auditar.md</files>
<action>
Smoke de integração seca, sem depender de execução de agente.

1. Encadear as duas operações determinísticas com um payload de exemplo (o da reference do contrato serve), provando que os contratos casam ponta a ponta:
```bash
node up/bin/up-tools.cjs hotspots --commits 50 --limite 5
printf '%s' "$PAYLOAD_EXEMPLO" | node up/bin/up-tools.cjs audit-report render --sem-abrir
```
   Conferir que o segundo comando devolve caminho absoluto sob o diretório temporário e que o HTML existe.
2. Testar a guarda do gate nos dois estados: criar `sessao.json` com `escolha: null` e conferir que a guarda imprime `GATE FECHADO` e não segue; trocar para `escolha: "AC-001"` e conferir que passa. Este e o teste do gate, e ele e determinístico: não depende de o modelo ter obedecido a prosa.
3. Conferir que `git status --porcelain` continua mostrando apenas os arquivos deste plano, e que nenhum artefato de auditoria vazou para o repositório.
4. Registrar no SUMMARY as duas saídas da guarda, fechada e aberta, porque elas são a evidência de que o gate é verificável.

Commitar de forma atômica: um commit para o conserto do despachante, um para o workflow, um para o comando.
</action>
<verify><automated>D=$(mktemp -d); printf '%s' '{"gate":"aguardando-escolha","escolha":null}' > "$D/sessao.json"; OUT=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf-8')).escolha)" "$D/sessao.json"); test "$OUT" = "null" || exit 1; printf '%s' '{"gate":"escolhido","escolha":"AC-001"}' > "$D/sessao.json"; OUT2=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf-8')).escolha)" "$D/sessao.json"); test "$OUT2" = "AC-001" || exit 1; test -z "$(git status --porcelain | grep -v '.plano/fases/19')" || exit 1; echo "GUARDA DO GATE VERIFICADA (fechada e aberta), ARVORE LIMPA"</automated></verify>
<done>A guarda do gate foi vista barrando com escolha nula e liberando com escolha registrada. As duas operações determinísticas encadeiam, o HTML e gerado fora do repositório, e a árvore de trabalho segue limpa.</done>
</task>

## Critério de aceite do plano

- [ ] `init auditar` deixou de responder com erro de nome desconhecido
- [ ] O escopo e exibido ao dono antes de qualquer análise, com janela, veredito de concentração e topo do ranking
- [ ] O caminho absoluto do relatório e informado tanto quando o navegador abre quanto quando não abre (AUD-04)
- [ ] Depois da apresentação existe uma única pergunta, com opção recomendada e o motivo literal do payload (AUD-08)
- [ ] A guarda barra a execução quando a escolha não está registrada, e isso foi visto acontecer (critério observável do gate)
- [ ] O comando anuncia as três flags e não cita mais nenhuma peça do pipeline antigo

## Tipo de prova

**Smoke.** Este plano entrega orquestração, é a prova e a execução seca dos contratos encadeados mais a verificação determinística da guarda do gate, vista fechada e vista aberta. A prova de que o gate funciona não é o texto do workflow prometendo parar, e sim a guarda que barra. A prova visual do relatório aberto fica para o plano 006.

## Fora de escopo

- Não escrever o tratamento da resposta do dono, a classificação de recusa nem o registro de decisão. São do plano 005.
- Não escrever o passo de higiene da árvore nem a limpeza final do sedimento do workflow antigo. São do plano 005.
- Não remover o subcomando de gerar fase a partir de relatório da CLI. A auditoria deixa de chama-lo, e ele continua disponível.
- Não alterar o agente auditor. Ele e do plano 003.
- Não alterar a reference de questionamento nem o formato geral de pergunta do sistema. E da fase 13.
- Não criar comando novo, não criar flag de instalação, não tocar no instalador.
- Não gravar nada no arquivo de estado do projeto. A auditoria é standalone e continua sendo.
</content>
