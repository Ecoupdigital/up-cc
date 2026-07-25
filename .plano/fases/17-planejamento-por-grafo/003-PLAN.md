---
phase: 17-planejamento-por-grafo
plan: "003"
type: feature
wave: 1
depends_on: []
autonomous: true
plan_schema: 2
requirements: [PLANO-07, PLANO-08]
files_modified:
  - up/bin/lib/plan-checks.cjs
  - up/bin/lib/plan-checks.test.cjs
  - up/bin/up-tools.cjs
  - up/agents/up-planejador.md
  - up/workflows/plan.md
  - .plano/fases/17-planejamento-por-grafo/evidencia/003-red.txt
  - .plano/fases/17-planejamento-por-grafo/evidencia/003-green.txt
prova: "logic:test_pass (vermelho e verde, visto falhar antes de passar)"
must_haves:
  truths:
    - "A decisão de quebrar uma fase em vários planos usa cem mil tokens de janela como número declarado, e cada plano registra a estimativa que usou"
    - "Existe operação determinística que estima a janela de um plano e devolve o percentual do orçamento"
    - "A verificação estática recusa regra de tamanho enunciada apenas por adjetivo, contra a lista fechada declarada na doutrina"
    - "A lista fechada de adjetivos mora na doutrina e é lida de lá pela verificação, sem cópia no código"
  artifacts:
    - path: "up/agents/up-planejador.md"
      provides: "Orçamento de janela em número, método de estimativa e lista fechada de adjetivos proibidos em regra de tamanho"
    - path: "up/bin/lib/plan-checks.cjs"
      provides: "Harness de checagem sobre um alvo, regra de adjetivo e contador único de tarefas"
    - path: "up/bin/up-tools.cjs"
      provides: "Estimativa de janela e percentual do orçamento na validação de plano, e a checagem no relatório de verificação estática"
  key_links:
    - from: "up/bin/lib/plan-checks.cjs"
      to: "up/agents/up-planejador.md"
      via: "leitura da lista fechada de adjetivos declarada na doutrina, em vez de lista duplicada no código"
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/plan-checks.cjs"
      via: "subcomando validate-plan e verify-static, que passam a aplicar a checagem e a estimativa"
---

# Fase 17 Plano 003: Tamanho medido em janela e regra escrita em número

<objective>
Trocar adjetivo por número na decisão de quebrar uma fase em vários planos, e dar à verificação estática o poder de recusar regra de tamanho enunciada só por adjetivo. O modelo cumpre número e negocia adjetivo.
</objective>

**Onda:** 1. **Depende de:** nada dentro da fase. Roda em paralelo com o plano 001.
**Tipo de prova:** lógica, vermelho e verde.

**Nota sobre a regra que esta fase entrega:** a proibição de caminho de arquivo em plano é o que a fase 17 constrói, e não o que ela já obedece. Os caminhos aparecem nos campos `<files>` porque o executor depende deles como trava de escopo.

## Números que esta fase fecha

Escritos aqui porque a fase não pode sair com adjetivo no lugar deles.

| Grandeza | Valor | Onde vale |
|---|---|---|
| Orçamento de janela por plano | 100 mil tokens | Decisão de quebrar uma fase em vários planos |
| Divisor de estimativa | 4 caracteres por token | Conversão de bytes em tokens |
| Reserva para leitura de código e saída do executor | 30 mil tokens | Subtraída do orçamento |
| Teto do contexto pré-inlinado de um plano | 70 mil tokens | Gatilho de quebra da fase em mais planos |
| Tamanho máximo do arquivo de plano | 25 kB | Limite já existente, preservado |
| Número máximo de tarefas por plano | 12 | Limite já existente, preservado |

## Contexto

@up/agents/up-planejador.md - doutrina de tamanho, hoje escrita por faixa e por adjetivo
@up/workflows/plan.md - instrução de quantos planos gerar por fase
@up/bin/up-tools.cjs - `cmdValidatePlan` (bytes, tarefas, limites), `cmdContext` (bytes do contexto pré-inlinado), `cmdVerifyStatic`
@up/bin/lib/core.cjs - convenção de exportação e de tratamento de erro

## Tarefas

<task id="1" type="auto">
<files>up/agents/up-planejador.md (editar)</files>
<action>
Acrescentar à doutrina a seção de tamanho em número, com os seis valores da tabela do plano e o método de estimativa em quatro parcelas: tamanho do próprio plano, contexto pré-inlinado que o executor recebe, leitura dirigida de código e escrita de saída. As três primeiras são bytes divididos pelo divisor declarado. A quarta é a reserva declarada.

Regra de quebra: quando a estimativa passa do teto do contexto pré-inlinado, a fase é quebrada em mais planos, e a decisão registra o número estimado.

Acrescentar também a linha de estimativa como campo obrigatório do plano gerado a partir deste ciclo: as quatro parcelas e o total, todas em número. Plano anterior ao ciclo não tem a linha, e a ausência vira aviso, nunca reprovação.
</action>
<verify><automated>grep -q "100 mil tokens" up/agents/up-planejador.md && grep -q "70 mil" up/agents/up-planejador.md && grep -q "4 caracteres por token" up/agents/up-planejador.md && echo "doutrina ok"</automated></verify>
<done>A doutrina cita orçamento, divisor, reserva e teto em número, e exige a linha de estimativa em todo plano novo.</done>
</task>

<task id="2" type="auto">
<files>up/agents/up-planejador.md (editar)</files>
<action>
Declarar na doutrina a lista fechada de adjetivos que não podem sozinhos enunciar tamanho ou quantidade, num bloco de lista com marcador estável, para que a verificação leia a lista de lá em vez de duplicá-la.

Lista, com no mínimo estes itens: pequeno, grande, enorme, curto, longo, breve, extenso, razoável, adequado, suficiente, conciso, moderado, mínimo, máximo, alguns, poucos, vários, muitos, rápido, leve, pesado.

Regra declarada junto, numa frase: enunciado de tamanho ou de quantidade que use um item da lista sem número na mesma frase é proibido. Uso do mesmo adjetivo fora de enunciado de tamanho continua permitido, porque a regra é sobre medir, e não sobre vocabulário.
</action>
<verify><automated>grep -q "razoável" up/agents/up-planejador.md && grep -qi "lista fechada" up/agents/up-planejador.md && echo "lista ok"</automated></verify>
<done>A lista está na doutrina com marcador legível por programa, e a regra que a acompanha está escrita numa frase.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/plan-checks.test.cjs (novo), .plano/fases/17-planejamento-por-grafo/evidencia/003-red.txt (novo)</files>
<action>
Escrever o teste ANTES da implementação e VER FALHAR. Harness local no mesmo formato de saída de `github.test.cjs`.

Casos obrigatórios:

1. Par de fixtures no mesmo cenário: um texto que enuncia limite de tarefas por plano só com adjetivo, e outro que enuncia o mesmo limite com número. O primeiro tem ocorrência, o segundo não.
2. Adjetivo da lista fora de enunciado de medida: sem ocorrência.
3. Adjetivo com número na mesma frase: sem ocorrência.
4. Adjetivo dentro de trecho marcado como exemplo ruim: sem ocorrência.
5. Lista lida da doutrina: acrescentar um item à lista no texto de doutrina de fixture faz aparecer ocorrência nova, sem tocar o código.
6. Doutrina ausente: a regra devolve indisponível, e o veredito não é aprovação. Lista vazia aprovaria tudo em silêncio.
7. Severidade: o mesmo texto violando, com e sem `plan_schema: 2`, produz reprovação no primeiro caso e aviso no segundo.
8. Ocorrência dentro do frontmatter também é detectada.
9. Contagem de tarefas: um alvo com sete títulos de tarefa em português conta sete; com sete blocos `<task` conta sete; com as duas formas não conta quatorze.
10. Estimativa: alvo com contexto pré-inlinado acima do teto declara estouro, e abaixo não declara.

Rodar e gravar a saída em `evidencia/003-red.txt`.
</action>
<verify><automated>mkdir -p .plano/fases/17-planejamento-por-grafo/evidencia; node up/bin/lib/plan-checks.test.cjs > .plano/fases/17-planejamento-por-grafo/evidencia/003-red.txt 2>&1; test -s .plano/fases/17-planejamento-por-grafo/evidencia/003-red.txt && echo "RED confirmado"</automated></verify>
<done>Os 10 casos existem, foram executados e falharam por ausência do módulo, com a saída vermelha gravada.</done>
</task>

<task id="4" type="auto">
<files>up/bin/lib/plan-checks.cjs (novo), .plano/fases/17-planejamento-por-grafo/evidencia/003-green.txt (novo)</files>
<action>
Implementar o harness de checagem, a regra de adjetivo e o contador único de tarefas. Módulo CommonJS sem dependência externa, exportação por objeto literal no fim.

`runChecks({ text, name, rules, doctrineText })` devolve `{ verdict, counts, occurrences }`. Contrato:

1. Cada regra devolve ocorrências, e cada ocorrência traz `line`, `excerpt` e `rule`.
2. Severidade: alvo que declara `plan_schema` igual ou maior que 2 tem ocorrência tratada como reprovação; alvo sem o marcador tem ocorrência tratada como aviso. É a mesma política que a fase 16 aplica ao campo de fronteiras confirmadas, e o marcador é o mesmo, criado por ela. Não criar um segundo nome de marcador.
3. O frontmatter também é varrido. Esconder violação nos metadados não pode ser saída.
4. O módulo não lê disco e não escreve nada: quem chama entrega o texto do alvo e o texto da doutrina.

`checkAdjectives(text, doctrineText)`, primeira regra:

1. A lista de adjetivos vem do texto de doutrina recebido. Doutrina ausente devolve `{ unavailable: true }`, e nunca lista vazia.
2. Ocorrência é frase que contém um item da lista e também um termo de medida, entre eles: tamanho, quantidade, número, limite, máximo de, mínimo de, até, por plano, por tarefa, por fase.
3. Frase que também contém número, em algarismo ou por extenso, não é ocorrência.
4. Trecho dentro de exemplo marcado como exemplo ruim não é ocorrência, porque o exemplo ruim existe para mostrar o erro. O marcador é o declarado pelo plano 004 desta fase.

`countTasks(text)` é a contagem única do produto: reconhece bloco `<task`, título numerado com ou sem palavra antes do número, em português e em inglês, e devolve o maior entre as formas, nunca a soma. O plano 002 desta fase consome esta função no índice, em vez de manter a segunda contagem que existe lá.

Rodar o teste até ficar verde e gravar em `evidencia/003-green.txt`.
</action>
<verify><automated>node up/bin/lib/plan-checks.test.cjs > .plano/fases/17-planejamento-por-grafo/evidencia/003-green.txt 2>&1; grep -q "0 failed" .plano/fases/17-planejamento-por-grafo/evidencia/003-green.txt && echo "GREEN confirmado"</automated></verify>
<done>Os 10 casos passam, a regra lê a lista da doutrina, doutrina ausente devolve indisponível, e o contador único reconhece as duas grafias de título.</done>
</task>

<task id="5" type="auto">
<files>up/bin/up-tools.cjs (editar)</files>
<action>
Acrescentar a estimativa de janela e a checagem à operação de validação de plano.

1. A parcela do próprio plano vem dos bytes do arquivo, já medidos hoje.
2. A parcela de contexto pré-inlinado vem do construtor de contexto que já existe e que já devolve o total de bytes do bloco montado para o executor, com plano, estado, configuração, requisitos da fase e manifesto de doutrina.
3. As duas viram tokens pelo divisor declarado; leitura de código e saída entram pela reserva declarada.
4. A resposta acrescenta `window_estimate_tokens`, `window_budget_tokens`, `window_percent` e `window_over_ceiling`, sem alterar nenhum campo existente.
5. `tasks` passa a vir de `countTasks`, e a validação passa a aplicar a regra de adjetivo, com ocorrência de severidade aviso indo para uma coleção separada que não derruba o veredito.
6. Nenhum limite existente muda de valor. A operação continua reprovando pelos mesmos critérios de hoje, mais os novos.
</action>
<verify><automated>node up/bin/up-tools.cjs validate-plan .plano/fases/17-planejamento-por-grafo/003-PLAN.md | grep -q "window_estimate_tokens" && node up/bin/up-tools.cjs validate-plan .plano/fases/17-planejamento-por-grafo/003-PLAN.md | grep -q '"tasks": 8' && echo "validate ok"</automated></verify>
<done>A validação devolve estimativa, orçamento, percentual e indicador de estouro, conta as tarefas em português, e não perdeu nenhum campo.</done>
</task>

<task id="6" type="auto">
<files>up/bin/up-tools.cjs (editar)</files>
<action>
Ligar a checagem ao relatório de verificação estática, para que a regressão apareça sozinha na próxima vez.

`cmdVerifyStatic` ganha uma conferência a mais, no mesmo formato das que já existem (nome, status, resumo, caminho do log): roda a checagem sobre os planos da fase corrente e sobre os documentos de doutrina que enunciam regra de tamanho, e reporta `pass`, `fail` ou `skip`. Vale a mesma política de pular em silêncio quando não há alvo, como as demais conferências fazem quando o script não existe.
</action>
<verify><automated>node up/bin/up-tools.cjs verify-static --raw | grep -qi "plan" && echo "verify-static ok"</automated></verify>
<done>A verificação estática lista a checagem de plano entre as conferências que executa, com log próprio, sem quebrar o formato da resposta.</done>
</task>

<task id="7" type="auto">
<files>up/workflows/plan.md (editar)</files>
<action>
Trocar no fluxo de planejamento a instrução de quantidade por critério de janela.

A instrução que hoje manda gerar uma faixa de planos por fase passa a mandar quebrar a fase até que cada plano caiba no teto declarado, citando o número, e a registrar a estimativa usada em cada plano. O gate que confere planos da fase não muda de lugar nem de função.
</action>
<verify><automated>grep -q "100 mil tokens" up/workflows/plan.md && grep -qi "estimativa" up/workflows/plan.md && echo "fluxo ok"</automated></verify>
<done>O fluxo decide a quebra por número de janela, e a estimativa passa a ser registrada por plano.</done>
</task>

<task id="8" type="auto">
<files>up/agents/up-planejador.md (editar), up/workflows/plan.md (editar), .plano/fases/17-planejamento-por-grafo/evidencia/003-adjetivos.txt (novo)</files>
<action>
Varrer a doutrina do planejador e o fluxo de planejamento com a regra da tarefa 4, e trocar por número todo enunciado de tamanho que hoje vive só por adjetivo. Gravar a saída da varredura antes e depois.

Conferir também que a troca não alterou instrução fora de enunciado de tamanho: poda de texto é passe separado, com briefing próprio.
</action>
<verify><automated>node -e "const c=require('./up/bin/lib/plan-checks.cjs');const fs=require('fs');const d=fs.readFileSync('up/agents/up-planejador.md','utf-8');for(const f of ['up/agents/up-planejador.md','up/workflows/plan.md']){const r=c.runChecks({text:fs.readFileSync(f,'utf-8'),name:f,rules:['adjectives'],doctrineText:d});console.log(f,JSON.stringify(r.counts));if(r.occurrences.length)throw new Error('ocorrencia em '+f);}console.log('adjetivos ok');" > .plano/fases/17-planejamento-por-grafo/evidencia/003-adjetivos.txt 2>&1; grep -q "adjetivos ok" .plano/fases/17-planejamento-por-grafo/evidencia/003-adjetivos.txt && echo ok</automated></verify>
<done>A checagem sobre a doutrina e sobre o fluxo sai sem ocorrência, e a evidência da varredura está gravada.</done>
</task>

## Critério de aceite do plano

- [ ] O orçamento de janela está escrito em número, com divisor, reserva e teto declarados
- [ ] Todo plano gerado a partir deste ciclo registra a estimativa usada
- [ ] A validação de plano devolve estimativa e percentual, sem perder o que já devolvia
- [ ] A lista fechada de adjetivos mora na doutrina e é lida de lá
- [ ] Doutrina ausente devolve indisponível, e nunca aprovação silenciosa
- [ ] Plano anterior a este ciclo recebe aviso e não reprovação
- [ ] A contagem de tarefas é única no produto e reconhece título em português
- [ ] Os 10 casos passam, e o vermelho está gravado

## Fora de escopo

1. Contagem exata de tokens por modelo. A estimativa é determinística por divisor declarado, e não pretende ser medição. Medir por modelo exigiria dependência externa, e este produto não tem dependência de produção.
2. Podar redação fora dos enunciados de tamanho. A regra é sobre medir, e poda de texto é passe de refatoração com briefing próprio.
3. Regra de durabilidade, campo de fora de escopo e exemplo ruim anotado. São o plano 004 desta fase, que declara aresta para este.
4. Alterar os limites de 25 kB e de 12 tarefas que já existem. Eles ficam como estão, e apenas ganham companhia.
5. Criar marcador próprio de esquema de plano. O marcador é o da fase 16, e criar um segundo seria sinônimo proibido.

## Colisões conhecidas

1. O plano 004 desta fase escreve no mesmo módulo de checagem, e por isso declara aresta para este. Não há escrita concorrente.
2. O plano 002 desta fase declara aresta para este e consome o contador de tarefas, sem escrever no módulo.
3. A fase 16 toca a operação de validação de plano e cria o marcador `plan_schema`. A alteração aqui é aditiva, reusa o marcador dela e não reescreve a operação inteira.

## Decisões registradas

**Decisão 1. A lista de adjetivos mora na doutrina e o código lê de lá.** Alternativa rejeitada: lista embutida no código. Rejeitada porque o requisito pede a lista declarada na própria doutrina, e duas cópias divergem na primeira vez que alguém acrescenta um item.

**Decisão 2. A estimativa reusa o construtor de contexto pré-inlinado.** Alternativa rejeitada: somar o tamanho dos arquivos citados pelo plano. Rejeitada porque o plano fica proibido de citar caminho no plano 004 desta fase, então essa soma deixaria de existir por construção.

**Decisão 3. Ocorrência de adjetivo reprova, e não apenas sinaliza.** Alternativa rejeitada: apenas sinalizar, como faz a heurística de tautologia da fase 16. Rejeitada porque a regra de adjetivo é sintática e verificável, e não heurística sobre intenção, e a saída barata continua sendo escrever o número.

**Decisão 4. Reusar o marcador de esquema criado pela fase 16.** Alternativa rejeitada: marcador próprio desta fase. Rejeitada porque dois nomes para o mesmo conceito é exatamente o que o glossário interno proíbe, e a política de severidade das duas fases é a mesma por decisão, e não por coincidência.
