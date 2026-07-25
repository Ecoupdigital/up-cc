---
phase: 17-planejamento-por-grafo
plan: "002"
type: feature
wave: 2
depends_on: ["001", "003"]
autonomous: true
plan_schema: 2
requirements: [PLANO-01, PLANO-02, PLANO-03, PLANO-04, PLANO-05, PLANO-06]
files_modified:
  - up/bin/lib/plans.cjs
  - up/bin/lib/plans.test.cjs
  - up/bin/up-tools.cjs
  - up/workflows/build.md
  - up/agents/up-planejador.md
  - .plano/fases/17-planejamento-por-grafo/evidencia/002-red.txt
  - .plano/fases/17-planejamento-por-grafo/evidencia/002-green.txt
prova: "logic:test_pass (vermelho e verde, visto falhar antes de passar)"
must_haves:
  truths:
    - "A ordem de execução dos planos de uma fase sai da dependência declarada, recalculada a cada rodada"
    - "Fase sem dependência declarada continua executando pela onda numerada, sem migração"
    - "Plano que falha sai da fronteira, mantém bloqueado quem depende dele, e não impede os demais"
    - "Cadeia totalmente sequencial degrada sozinha, sem caso especial no motor"
    - "A onda numerada continua sendo devolvida como visão de leitura, ao lado da onda derivada, e onda zero declarada deixa de virar onda um"
  artifacts:
    - path: "up/bin/lib/plans.cjs"
      provides: "Normalização de aresta e derivação pura da fronteira, com onda derivada, bloqueados, ciclo e arestas pendentes"
    - path: "up/bin/up-tools.cjs"
      provides: "Fronteira, modo de ordenação e estado por plano no índice, em campos aditivos, com parâmetro de planos falhos"
    - path: "up/workflows/build.md"
      provides: "Laço de fronteira no lugar do laço de ondas fixas"
  key_links:
    - from: "up/workflows/build.md"
      to: "up/bin/up-tools.cjs"
      via: "phase-plan-index chamado a cada rodada, informando os planos já falhos"
    - from: "up/bin/lib/plans.cjs"
      to: "up/bin/lib/plan-checks.cjs"
      via: "contador de tarefas único, exportado pelo plano 003 e consumido pelo índice"
---

# Fase 17 Plano 002: Grafo de bloqueio e fronteira derivada

<objective>
Trocar a onda numerada por dependência declarada como verdade da ordem de execução. A fronteira, que é o conjunto de planos cujos bloqueadores estão todos prontos, passa a ser recalculada durante a execução. A onda continua existindo como visão de leitura.
</objective>

**Onda:** 2. **Depende de:** planos 001 e 003 desta fase. O 001 porque a fronteira é derivada do inventário da fase, e o inventário só enxerga todos os planos depois da correção dele: derivar fronteira sobre inventário cego produz fronteira cega. O 003 porque a contagem de tarefas que este plano corrige no índice passa a ser a mesma função exportada pelo módulo de checagem criado lá, e escrever uma segunda contagem repetiria o defeito que o 001 acabou de eliminar.
**Tipo de prova:** lógica, vermelho e verde.

**Nota sobre a regra que esta fase entrega:** a proibição de caminho de arquivo em plano é o que a fase 17 constrói, e não o que ela já obedece. Os caminhos aparecem nos campos `<files>` porque o executor depende deles como trava de escopo.

## Dois defeitos verificados por execução que este plano corrige

1. **Onda zero vira onda um.** `const wave = parseInt(fm.wave, 10) || 1` trata zero como ausência de valor. Como onda zero é a convenção de infraestrutura do produto, hoje a onda zero e a onda um viram a mesma onda, e planos escritos para rodar em sequência rodam em paralelo. O efeito é silencioso: nada falha, a ordem é que está errada.
2. **Contagem de tarefas cega a português.** O índice conta por `<task` e por `##\s*Task\s*\d+`, então plano com título de tarefa em português é reportado com zero tarefa.

## Contexto

@up/bin/lib/plans.cjs - biblioteca criada no plano 001, que este plano estende
@up/bin/up-tools.cjs - `cmdPhasePlanIndex`, leitura de `wave` e contagem de tarefas
@up/workflows/build.md - passo 3.1 (descoberta) e 3.2 mais 3.3 (laço de ondas e GATE A)
@up/agents/up-planejador.md - doutrina de onda e de dependência
@.plano/SYSTEM-DESIGN.md - seção 5.2, contrato do índice de planos da fase

## Tarefas

<task id="1" type="auto">
<files>up/bin/lib/plans.test.cjs (editar), .plano/fases/17-planejamento-por-grafo/evidencia/002-red.txt (novo)</files>
<action>
Escrever os casos de fronteira ANTES da implementação e VER FALHAR. Bloco novo no arquivo de teste criado no plano 001, mesmo harness, mesma saída.

Casos obrigatórios:

1. **Cadeia linear.** Três planos, cada um bloqueado pelo anterior: a fronteira traz um plano por vez, nas três rodadas, na ordem da cadeia.
2. **Leque.** Três planos com dependência declarada vazia: fronteira com os três.
3. **Plano que falha.** Quatro planos, um bloqueia dois e o quarto é independente. Com o primeiro na lista de falhos: a fronteira traz o independente, os dois dependentes aparecem em bloqueados com o motivo apontando o falho, e a fase não é declarada esgotada.
4. **Retomada.** Cadeia do caso 1 com o primeiro plano já com resumo: a fronteira começa no segundo.
5. **Sem aresta declarada.** Fase gravada como as antigas, só com onda: modo onda, fronteira igual aos pendentes da menor onda com pendência, onda derivada igual à declarada.
6. **Modo misto.** Dois planos declaram aresta e um não declara e está em onda posterior: o que não declara só entra na fronteira depois que os de onda anterior ficam prontos.
7. **Ciclo.** Dois planos que se bloqueiam mutuamente: fronteira vazia, ciclo reportado com os dois, fase não esgotada.
8. **Aresta pendente.** Dependência de identificador inexistente: não bloqueia, o plano entra na fronteira, e a aresta aparece na coleção de pendentes.
9. **Aresta em forma composta.** Dependência declarada com o número da fase junto do identificador resolve contra o plano correspondente.
10. **Autoaresta.** Plano que declara dependência de si mesmo: descartada e reportada como pendente, sem travar.
11. **Fase esgotada.** Todos com resumo: fronteira vazia, esgotada verdadeira, ciclo vazio.
12. **Onda zero preservada.** Dois planos declarando onda zero e um declarando onda um, nenhum com aresta: a primeira fronteira traz os dois de onda zero, e não os três. Este caso falha antes da correção, porque hoje os três caem na mesma onda.

Rodar e gravar a saída em `evidencia/002-red.txt`.
</action>
<verify><automated>node up/bin/lib/plans.test.cjs > .plano/fases/17-planejamento-por-grafo/evidencia/002-red.txt 2>&1; grep -qE "FAIL|failed" .plano/fases/17-planejamento-por-grafo/evidencia/002-red.txt && echo "RED confirmado"</automated></verify>
<done>Os 12 casos existem, foram executados e falharam por ausência da derivação de fronteira, com a saída vermelha gravada.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/plans.cjs (editar)</files>
<action>
Normalizar a aresta declarada. O campo `depends_on`, que já existe no frontmatter do plano e que hoje nenhum consumidor lê, passa a ser o dado primário da ordem. Nenhum campo novo de aresta é criado.

`normalizeEdges(planEntry, inventory, phaseNumber)` devolve `{ edges, dangling }`. Regras:

1. Valor ausente e lista vazia significam a mesma coisa: nenhuma aresta declarada. A distinção entre "não declarou" e "declarou vazio" é preservada num sinalizador próprio, porque ela decide o modo de ordenação.
2. Cada item passa pela canonicalização do plano 001 antes de resolver, o que faz a forma composta com o número da fase, já gravada em plano antigo deste repositório, casar com o identificador simples do inventário.
3. Item que não resolve para nenhum plano da mesma fase não bloqueia, e entra em `dangling` com o texto original. Bloquear por nome irresolúvel travaria projeto já gravado, que é o oposto da compatibilidade prometida.
4. Aresta de um plano para ele mesmo é descartada e entra em `dangling`.
</action>
<verify><automated>node -e "const p=require('./up/bin/lib/plans.cjs'); if(typeof p.normalizeEdges!=='function') throw new Error('normalizeEdges ausente'); console.log('edges ok');"</automated></verify>
<done>A aresta declarada resolve nas duas formas de identificador, e aresta irresolúvel e autoaresta são reportadas sem bloquear.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/plans.cjs (editar), .plano/fases/17-planejamento-por-grafo/evidencia/002-green.txt (novo)</files>
<action>
Implementar a derivação da fronteira e fechar o verde.

`deriveFrontier({ plans, pairing, failed })` é função pura e devolve `{ frontier, blocked, dangling_edges, cycle, exhausted, ordering_mode, derived_waves }`.

Estado de cada plano, calculado antes da derivação: `pronto` quando tem resumo pareado; `falho` quando o identificador consta na lista de falhos recebida por parâmetro; `pendente` no restante. Não existe estado falho persistido em disco.

Regras, nesta ordem:

1. **Modo de ordenação.** Nenhum plano declara aresta: modo `onda`. Todos declaram: modo `aresta`. Uns sim e outros não: modo `misto`.
2. **Modo aresta.** A fronteira é o conjunto de pendentes cujos bloqueadores resolvidos estão todos prontos.
3. **Modo onda.** A fronteira é o conjunto de pendentes da menor onda declarada que ainda tenha pendência. Reproduz exatamente a ordem executada hoje, e é a degradação exigida para projeto anterior ao ciclo.
4. **Modo misto.** Plano que declara aresta usa a regra 2. Plano que não declara herda como bloqueadores todos os planos de onda declarada estritamente menor que a dele, sem inventar dependência entre irmãos da mesma onda.
5. **Falha.** Plano falho nunca entra na fronteira, e quem depende dele, direta ou transitivamente, entra em `blocked` com o motivo apontando o falho. Os demais pendentes com bloqueadores prontos seguem na fronteira.
6. **Ciclo.** Restam pendentes, nenhum falho os bloqueia e a fronteira sai vazia: `cycle` traz os planos envolvidos e a fronteira fica vazia. Nunca há laço infinito nem desempate arbitrário.
7. **Onda derivada.** Comprimento do caminho de bloqueio mais longo que chega ao plano, em número de arestas, começando em zero. No modo onda, é igual à onda declarada, para que a visão não mude em projeto antigo.
8. **Fase esgotada.** Sem pendente e sem falho, fronteira vazia e `exhausted` verdadeiro. Fronteira vazia por conclusão e por ciclo são distinguíveis por campos diferentes.

Rodar o teste até ficar verde e gravar em `evidencia/002-green.txt`. Nenhum caso pode ser afrouxado para chegar ao verde.
</action>
<verify><automated>node up/bin/lib/plans.test.cjs > .plano/fases/17-planejamento-por-grafo/evidencia/002-green.txt 2>&1; grep -q "0 failed" .plano/fases/17-planejamento-por-grafo/evidencia/002-green.txt && echo "GREEN confirmado"</automated></verify>
<done>Os 22 casos do arquivo (10 do plano 001 e 12 deste) passam, e as saídas vermelha e verde estão gravadas lado a lado.</done>
</task>

<task id="4" type="auto">
<files>up/bin/up-tools.cjs (editar)</files>
<action>
Publicar a fronteira no índice e corrigir os dois defeitos de leitura.

1. Campos existentes preservados em nome e significado, inclusive `waves` e `incomplete`. Consumidor antigo continua funcionando sem alteração.
2. Campos acrescentados no topo: `frontier`, `blocked` com motivo, `dangling_edges`, `cycle`, `ordering_mode` e `exhausted`.
3. Campos acrescentados por plano: `edges`, `derived_wave` e `state`.
4. Parâmetro novo e opcional `--failed <ids separados por vírgula>`, que alimenta a lista de falhos. Sem ele, nenhum plano é falho.
5. **Onda zero preservada.** A leitura de `wave` deixa de usar coerção que trata zero como ausência: ausência de campo assume um, e zero declarado vale zero.
6. **Contagem de tarefas única.** `task_count` passa a usar a função exportada pelo módulo de checagem do plano 003, que reconhece título de tarefa em português e em inglês. Não escrever uma segunda contagem aqui.
7. Nomes de campo em minúsculas com sublinhado, em inglês, como os que já existem.
</action>
<verify><automated>node up/bin/up-tools.cjs phase-plan-index 17 | grep -q '"ordering_mode"' && node up/bin/up-tools.cjs phase-plan-index 17 | grep -q '"frontier"' && test $(node -e "const o=JSON.parse(require('child_process').execSync('node up/bin/up-tools.cjs phase-plan-index 17').toString()); console.log(Object.keys(o.waves).length)") -eq 3 && echo "indice ok"</automated></verify>
<done>O índice devolve fronteira, modo de ordenação e estado, as três ondas da fase 17 aparecem separadas, e a contagem de tarefas dos planos em português deixa de ser zero.</done>
</task>

<task id="5" type="auto">
<files>up/workflows/build.md (editar)</files>
<action>
Trocar o laço de ondas pelo laço de fronteira, no passo 3.2 mais 3.3.

Contrato da rodada:

1. Pedir a fronteira ao índice, informando os planos já falhos nesta execução.
2. Fronteira vazia com ciclo declarado: parar a fase e escalar ao dono, sem desempatar sozinho.
3. Fronteira vazia com fase esgotada: sair do laço.
4. Executar em paralelo os planos da fronteira quando a paralelização está ligada, e um por vez quando está desligada. A barreira continua valendo: a rodada só termina quando todos os planos dela terminam.
5. Ao fim da rodada, plano sem resumo entra na lista de falhos da execução, depois da política de reexecução que já existe. A lista vive na execução, e não em disco.
6. Recomeçar em 1. Um plano que ficou pronto libera quem dependia dele; um que falhou não trava quem não dependia dele.
7. A guarda de um resumo por plano continua existindo, agora por rodada.

Atualizar o parágrafo que hoje explica por que paralelizar dentro da onda é seguro: a garantia passa a vir da aresta declarada, e a onda vira visão de leitura. Nenhum gate é removido.
</action>
<verify><automated>grep -q "frontier" up/workflows/build.md && grep -q "\-\-failed" up/workflows/build.md && grep -q "cycle" up/workflows/build.md && echo "motor ok"</automated></verify>
<done>O motor pede a fronteira a cada rodada, trata ciclo e fase esgotada, e não itera mais onda numerada fixa.</done>
</task>

<task id="6" type="auto">
<files>up/agents/up-planejador.md (editar)</files>
<action>
Inverter a doutrina de ordem: a dependência declarada passa a ser a verdade, e a onda numerada passa a ser visão de leitura derivada dela.

Duas frases obrigatórias: uma define onda como visão derivada da dependência declarada, outra define dependência declarada como o dado primário. O planejador continua escrevendo a onda, porque ela é a visão publicada, e passa a declarar dependência sempre que houver.

Acrescentar a regra de numeração de onda: a menor onda publicada é um. Onda zero não é usada enquanto a leitura antiga do índice existir em projeto instalado, para que plano novo não dependa da correção deste plano já estar distribuída.

As duas frases não podem contradizer o verbete de onda do glossário interno publicado pela fase 14. A conferência entre os dois é feita no plano 005 desta fase.
</action>
<verify><automated>grep -qi "visão derivada" up/agents/up-planejador.md && grep -qi "depends_on" up/agents/up-planejador.md && echo "doutrina ok"</automated></verify>
<done>A doutrina não trata mais a onda como ordem primária, instrui a declaração de dependência, e fixa a menor onda publicada em um.</done>
</task>

<task id="7" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/002-retrocompat.txt (novo)</files>
<action>
Conferir que nenhuma fase já gravada mudou de comportamento.

Para cada fase gravada no diretório de planejamento deste repositório, registrar modo de ordenação, fronteira inicial, ondas e onda derivada, e comparar com o mapa de onda anterior a esta fase. Toda fase anterior ao ciclo tem que aparecer em modo onda, com a mesma ordem de execução de antes.
</action>
<verify><automated>for p in 3 4 5 6 7 8 9 10 11; do node up/bin/up-tools.cjs phase-plan-index $p; echo; done > .plano/fases/17-planejamento-por-grafo/evidencia/002-retrocompat.txt 2>&1; test $(grep -c '"ordering_mode": "onda"' .plano/fases/17-planejamento-por-grafo/evidencia/002-retrocompat.txt) -eq 9 && echo "retrocompat ok"</automated></verify>
<done>As nove fases anteriores ao ciclo aparecem em modo onda, com a mesma ordem de antes, e a evidência está gravada.</done>
</task>

<task id="8" type="auto">
<files>.plano/fases/17-planejamento-por-grafo/evidencia/002-regressao.txt (novo)</files>
<action>
Conferir que o motor e o fluxo continuam íntegros depois da troca.

1. Os sete comandos continuam com frontmatter válido e referência de workflow resolvível.
2. Nenhum gate do fluxo de execução sumiu: a guarda de artefatos por rodada, a verificação da fase, a revisão, o gate visual antes do merge e o menu de fechamento continuam presentes.
3. A suíte do lado UP roda verde.
</action>
<verify><automated>{ ls up/commands/*.md | wc -l; grep -l "workflows/" up/commands/*.md | wc -l; grep -c "GATE" up/workflows/build.md; node up/bin/lib/plans.test.cjs; node up/bin/lib/github.test.cjs; } > .plano/fases/17-planejamento-por-grafo/evidencia/002-regressao.txt 2>&1; grep -q "0 failed" .plano/fases/17-planejamento-por-grafo/evidencia/002-regressao.txt && echo "regressao ok"</automated></verify>
<done>Os sete comandos e todos os gates do fluxo continuam presentes, a suíte roda verde, e a evidência está gravada.</done>
</task>

## Critério de aceite do plano

- [ ] A fronteira é recalculada a cada rodada a partir da dependência declarada, e o motor não itera mais onda fixa
- [ ] Cadeia linear degrada para sequencial sem caso especial no motor
- [ ] Plano falho não trava plano independente, e quem depende dele fica bloqueado com motivo
- [ ] Fase sem aresta declarada executa pela onda numerada, com a mesma ordem de antes
- [ ] Onda zero declarada deixa de ser reportada como onda um
- [ ] A contagem de tarefas passa a enxergar título em português, usando a função única do plano 003
- [ ] Ciclo é reportado, e a execução para e escala em vez de desempatar sozinha
- [ ] Os 12 casos passam, e o vermelho está gravado

## Fora de escopo

1. Campo novo em `git-map.json` para guardar estado de fronteira. A decisão é não persistir estado de fronteira: o único consumidor é o laço da própria execução, e persistir criaria uma segunda fonte de verdade ao lado dos resumos em disco.
2. Aresta entre planos de fases diferentes. A dependência entre fases mora no roadmap, e misturar os dois níveis criaria duas gramáticas para a mesma palavra.
3. Reescrever plano já gravado para acrescentar aresta. A degradação existe para dispensar migração.
4. Publicar plano com onda zero enquanto a correção não estiver distribuída. Ficou de fora por decisão, e a doutrina passa a fixar a menor onda em um.
5. Sedimento de papéis removidos no template do plano pronto. Passe próprio, com briefing próprio.

## Colisões conhecidas

Os planos 001 e 003 desta fase fecham antes deste por aresta declarada, então não há escrita concorrente. O 001 escreve na biblioteca de planos, que este plano estende. Do 003, este plano apenas lê a função de contagem de tarefas. O 004 escreve no módulo de checagem, depois do 003, e não toca a biblioteca de planos.

## Decisões registradas

**Decisão 1. Reusar `depends_on`, em vez de criar campo novo de aresta.** Alternativas rejeitadas: (a) campo com nome novo, rejeitada porque criaria dois nomes para um conceito só, que é o que o glossário interno da fase 14 proíbe, e obrigaria migração de plano que já declara dependência; (b) derivar aresta da sobreposição de arquivos modificados, rejeitada porque transforma coincidência em contrato e falha em plano que só lê.

**Decisão 2. Estado falho vive na execução, e não em disco.** Alternativa rejeitada: gravar em `git-map.json`. Rejeitada porque criaria estado persistido sem dono de limpeza, que envelhece entre execuções e passa a mentir.

**Decisão 3. Aresta irresolúvel não bloqueia.** Alternativa rejeitada: tratar como bloqueio permanente. Rejeitada porque travaria projeto já gravado por causa de um nome antigo, transformando compatibilidade em regressão.

**Decisão 4. Estender o índice existente em vez de criar subcomando novo de fronteira.** Alternativa rejeitada: subcomando próprio. Rejeitada porque a fronteira precisa exatamente dos dados que o índice já carrega, e duas portas para o mesmo inventário voltariam a divergir, que é a origem do defeito consertado no plano 001.

**Decisão 5. A menor onda publicada passa a ser um, e não zero.** Alternativa rejeitada: manter onda zero e confiar na correção deste plano. Rejeitada porque o plano que declara onda zero depende de a correção já estar distribuída no runtime que o executa, e plano não pode depender do conserto que ele mesmo entrega.
