---
phase: 20-nevoa-e-fronteira-do-roadmap
plan: "003"
type: feature
autonomous: true
wave: 2
depends_on: []
requirements: [WAY-01]
prova: smoke
must_haves:
  truths:
    - "Diante de um problema leve, sem pergunta aberta relevante, o planejamento se declara desnecessário e aponta a rota leve, sem gerar fase nenhuma"
    - "O critério de leve é contado a partir de sinais numéricos declarados, e não de julgamento do agente"
    - "Encerramento por palavra de parada do dono nunca dispara o auto-aborto, porque interrupção não é prova de convergência"
    - "Sem o bloco de resultado do questionamento, o planejamento roda normalmente, o que preserva projeto e runtime anteriores a este ciclo"
    - "O dono pode mandar planejar mesmo assim, e a escolha chega a ele como pergunta com recomendação e motivo"
  artifacts:
    - path: "up/bin/lib/plan-necessity.cjs"
      provides: "Leitura do bloco de resultado do questionamento e veredito determinístico de necessidade de planejamento"
    - path: "up/workflows/plan.md"
      provides: "Estágio de auto-aborto antes de qualquer escrita de arquitetura, com parada sem gerar fases"
    - path: "up/skills/up-brainstorm/SKILL.md"
      provides: "Obrigação de gravar o bloco de resultado ao fechar a rodada de perguntas"
    - path: "up/bin/lib/plan-necessity.test.cjs"
      provides: "Prova vermelho e verde do veredito, com fixture por sinal bloqueador"
  key_links:
    - from: "up/workflows/plan.md"
      to: "up/bin/lib/plan-necessity.cjs"
      via: "subcomando plan-necessity da linha de comando de ferramentas, lido antes do estágio de arquitetura"
    - from: "up/skills/up-brainstorm/SKILL.md"
      to: ".plano/BRIEFING.md"
      via: "bloco Resultado do questionamento com seis campos de valor fechado"
---

# Fase 20 Plano 003: Gate de auto-aborto do planejamento

**Onda:** 2 (roda depois da onda 1, em paralelo com o plano 002)
**Depende de:** nenhum plano desta fase. Fora da fase, depende do formato de pergunta da fase 13 e do comportamento do grill da fase 15
**Tipo de prova:** smoke (duas rodadas de planejamento com briefing de fixture) somada a teste vermelho e verde sobre o veredito
**Requisitos cobertos:** WAY-01

## Posição no grafo

A fase 20 é a última do ciclo e nada depende dela, o que a torna o corte mais barato se o escopo apertar. Este plano é o único da fase que depende de fase anterior: a 13 dá o formato de pergunta com recomendação, e a 15 dá o questionamento cujo resultado o gate lê. A dependência é de contrato, não de acoplamento: o gate lê um bloco declarado e, sem o bloco, deixa o planejamento rodar. Ele pode ser entregue antes de 15 existir e passa a morder sozinho quando ela chegar.

## Objetivo

Fazer a ferramenta pesada se recusar a rodar quando o problema é leve. Hoje qualquer pedido que chega ao planejamento vira arquitetura, roadmap, requisitos e fases, mesmo quando o questionamento não revelou pergunta aberta relevante. Isso produz cerimônia sobre trabalho de dez minutos e ensina o dono a fugir do sistema. O gate inverte: quando os sinais dizem que não sobrou pergunta capaz de mudar o design, o planejamento se declara desnecessário e aponta a rota leve, em vez de gerar fases.

O critério não pode ser julgamento vago do agente, porque agente pediu para julgar sempre julga a favor de trabalhar. Ele é contado.

## Convenção deste plano sobre caminhos

Cada superfície aparece primeiro como contrato público (subcomando, função exportada, bloco) e o caminho vem depois, como localização conferida em 2026-07-25.

## Contexto

@up/skills/up-brainstorm/SKILL.md - skill de 111 linhas: tabela de tiers, override do dono, checkpoint de fechamento de duas opções e a regra de estado terminal
@up/workflows/plan.md - workflow de planejamento: estágio 0 de gates, estágio 1 de intake que lê o briefing, estágio 2 de arquitetura que já escreve os quatro artefatos
@up/commands/plan.md - comando, com a lista de flags e a descrição que aparece ao dono
@up/workflows/rapido.md - a rota leve: commit atômico na branch atual, sem worktree, issue, PR nem roadmap
@up/bin/up-tools.cjs - despacho; `classify-task` fica por volta da linha 456 e é a vizinhança onde este plano abre o `case` novo
@up/bin/lib/core.cjs - leitura de configuração do projeto com valores padrão e try/catch devolvendo o padrão

## Regra de não colisão

Este plano roda em paralelo com o plano 002. Os dois editam o arquivo de despacho da linha de comando, em pontos distintos e declarados: **este plano abre um `case` novo na vizinhança de `classify-task` e não entra no `case 'roadmap'`**; o plano 002 só mexe no `case 'roadmap'`. Regra dura: substituição cirúrgica de trecho único, jamais reescrita do arquivo inteiro. Rodar a checagem de sintaxe antes de commitar.

## Tarefas

<task id="1" type="auto">
<files>up/skills/up-brainstorm/SKILL.md</files>
<action>
Declarar o contrato de saída do questionamento, que é o insumo do gate. Sem isso, o gate não tem o que ler e o auto-aborto vira adivinhação.

Acrescentar uma seção nova à skill, depois do checkpoint de fechamento, chamada "Resultado do questionamento (obrigatório ao fechar a rodada)". Conteúdo:

Ao encerrar a rodada de perguntas, por qualquer das portas de saída, escrever no briefing do projeto o bloco abaixo, com estes seis campos, nesta ordem, com estes nomes:

```markdown
## Resultado do questionamento

- Encerramento: convergencia
- Perguntas feitas: 7
- Perguntas em aberto: 0
- Decisões com alternativas reais: 0
- Superfícies tocadas: 1
- Requisitos derivados: 2
```

Regras de preenchimento, escritas na própria skill:
- `Encerramento` aceita exatamente quatro valores: `convergencia` (o agente declarou que não resta pergunta capaz de mudar o design), `palavra-de-parada` (o dono mandou parar), `checkpoint` (o dono escolheu fechar no controle de duas opções) e `trivial` (a tarefa foi classificada como trivial e não houve perguntas).
- `Perguntas em aberto` conta pergunta que o agente considera relevante e ficou sem resposta. Pergunta que o próprio agente respondeu sozinho por leitura de arquivo, busca no código, histórico do repositório ou estado do projeto **não** entra, porque fato descoberto não é pergunta aberta.
- `Decisões com alternativas reais` conta escolha de arquitetura ou trade-off em que havia mais de um caminho genuíno. Preferência de redação não conta.
- `Superfícies tocadas` conta fronteiras públicas distintas que o trabalho encosta (módulo exportado, interface, comando ou rota), nunca arquivos.
- `Requisitos derivados` conta os requisitos que saíram da rodada.
- O bloco é escrito **uma vez, ao fechar**, e é o único lugar onde esses números moram.

Acrescentar também a linha de doutrina que fecha a armadilha: **encerramento por palavra de parada nunca é evidência de convergência.** O dono mandar parar significa que ele não quer mais perguntas, e não que as perguntas acabaram. Quem lê esse resultado tem que tratar as duas coisas de formas diferentes.
</action>
<verify><automated>grep -q "Resultado do questionamento" up/skills/up-brainstorm/SKILL.md && grep -q "palavra-de-parada" up/skills/up-brainstorm/SKILL.md && grep -q "Superfícies tocadas" up/skills/up-brainstorm/SKILL.md && ! grep -qP "[\x{2014}\x{2013}]" up/skills/up-brainstorm/SKILL.md && echo "contrato declarado"</automated></verify>
<done>A skill declara o bloco com os seis campos, os quatro valores fechados de encerramento, a regra de contagem de cada campo e a linha que separa palavra de parada de convergência. O restante da skill, incluindo o gate duro e a tabela de tiers, permanece intacto.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/plan-necessity.cjs (arquivo novo)</files>
<action>
Criar o módulo do veredito. CommonJS, `'use strict'`, `require('fs')` e `require('path')` apenas, exports por objeto literal no fim.

Constantes no topo, exportadas, porque o limite tem que ser lido pelo teste e mostrado ao dono:

```javascript
// Cabeçalho do bloco escrito pelo questionamento.
const BLOCK_HEADING = /^##\s+(?:Resultado do questionamento|Questioning outcome)\s*$/im;

// Encerramentos que autorizam o auto-aborto. Parada pedida pelo dono e fechamento
// por checkpoint ficam de fora: interrupção não é prova de convergência.
const CLOSURES_THAT_ALLOW_ABORT = ['convergencia', 'trivial'];

// Limites do problema leve. Número, nunca adjetivo.
const LIMITS = { open_questions: 0, decisions_with_alternatives: 0, surfaces: 1, requirements: 2 };
```

Campos, cada um com regex tolerante a acento e ao inglês:
```javascript
const FIELDS = {
  closure: /^-\s*(?:Encerramento|Closure):\s*(converg[êe]ncia|convergencia|palavra-de-parada|checkpoint|trivial)\s*$/im,
  questions_asked: /^-\s*(?:Perguntas feitas|Questions asked):\s*(\d+)\s*$/im,
  open_questions: /^-\s*(?:Perguntas em aberto|Open questions):\s*(\d+)\s*$/im,
  decisions_with_alternatives: /^-\s*(?:Decis[õo]es com alternativas reais|Decisions with real alternatives):\s*(\d+)\s*$/im,
  surfaces: /^-\s*(?:Superf[íi]cies tocadas|Surfaces touched):\s*(\d+)\s*$/im,
  requirements: /^-\s*(?:Requisitos derivados|Requirements derived):\s*(\d+)\s*$/im,
};
```

`parseOutcome(content)` recorta do cabeçalho do bloco até a próxima linha `/^##\s+/` ou o fim, aplica os campos e devolve `{ source, signals, missing }`:
- `source: 'bloco'` quando o cabeçalho existe e os seis campos casam. `signals.closure` normalizado sem acento (`convergencia`), os outros cinco como número inteiro.
- `source: 'incompleto'` quando o cabeçalho existe mas falta campo ou o valor não é numérico. `missing` lista os nomes dos campos com problema.
- `source: 'ausente'` quando o cabeçalho não existe. `signals` vem vazio.

`decide(outcome, options)` devolve o veredito:
```javascript
{
  verdict: 'planning-unnecessary' | 'planning-needed',
  source: 'bloco',
  signals: { closure: 'convergencia', questions_asked: 7, open_questions: 0, decisions_with_alternatives: 0, surfaces: 1, requirements: 2 },
  limits: { open_questions: 0, decisions_with_alternatives: 0, surfaces: 1, requirements: 2 },
  blocking_signals: [],
  light_route: '/up:rapido',
  reason: 'texto em português explicando o veredito e citando os números',
  recommendation: 'texto da recomendação que o workflow apresenta ao dono'
}
```
Regra do veredito, cinco condições que precisam valer ao mesmo tempo para declarar o planejamento desnecessário:
1. `CLOSURES_THAT_ALLOW_ABORT` contém `signals.closure`.
2. `signals.open_questions === LIMITS.open_questions`.
3. `signals.decisions_with_alternatives === LIMITS.decisions_with_alternatives`.
4. `signals.surfaces <= LIMITS.surfaces`.
5. `signals.requirements <= LIMITS.requirements`.

Qualquer condição falha acrescenta um código a `blocking_signals` (`encerramento=palavra-de-parada`, `perguntas_em_aberto=2`, `decisoes_com_alternativas=1`, `superficies=3`, `requisitos=6`) e o veredito é `planning-needed`.

Fail-safe declarado: `source` diferente de `'bloco'` devolve sempre `planning-needed`, com `blocking_signals` contendo `sem_resultado_de_questionamento` ou `resultado_incompleto`. Sem evidência de convergência, a ferramenta pesada roda. É o comportamento que preserva projeto antigo, runtime sem grill e briefing escrito à mão.

`check(cwd, options)` junta tudo: lê o briefing (`.plano/BRIEFING.md` por padrão, ou o caminho passado em `options.briefing`), lê a chave `auto_abort` de `.plano/config.json` (padrão `true`; ausente, inválido ou arquivo inexistente também dá `true`), e devolve o veredito. Com `auto_abort` falso, devolve `planning-needed` com `blocking_signals: ['auto_abort_desligado_na_config']`, o que dá ao dono uma chave de desligar permanente sem editar código.

`reason` e `recommendation` saem em português, citam os números e nomeiam a rota leve. Exemplo do teor de `recommendation` quando o veredito é desnecessário: recomendar a rota leve porque o questionamento fechou por convergência, sem pergunta em aberto, sem decisão com alternativa real, tocando uma fronteira e derivando dois requisitos, e lembrar que planejar mesmo assim continua disponível.
</action>
<verify><automated>node --check up/bin/lib/plan-necessity.cjs && node -e "const m=require('./up/bin/lib/plan-necessity.cjs'); const leve='## Resultado do questionamento\n\n- Encerramento: convergencia\n- Perguntas feitas: 5\n- Perguntas em aberto: 0\n- Decisões com alternativas reais: 0\n- Superfícies tocadas: 1\n- Requisitos derivados: 2\n'; const d=m.decide(m.parseOutcome(leve)); if(d.verdict!=='planning-unnecessary') throw new Error('esperado desnecessário, veio '+d.verdict+' '+JSON.stringify(d.blocking_signals)); const d2=m.decide(m.parseOutcome(leve.replace('convergencia','palavra-de-parada'))); if(d2.verdict!=='planning-needed') throw new Error('palavra de parada não pode auto-abortar'); const d3=m.decide(m.parseOutcome('sem bloco')); if(d3.verdict!=='planning-needed') throw new Error('sem bloco deve rodar o planejamento'); console.log('veredito ok');"</automated></verify>
<done>O módulo devolve `planning-unnecessary` só quando as cinco condições valem, devolve `planning-needed` para palavra de parada mesmo com todos os números zerados, e devolve `planning-needed` quando o bloco não existe.</done>
</task>

<task id="3" type="auto">
<files>up/bin/up-tools.cjs (require no topo e um `case` novo na vizinhança de `classify-task`, por volta da linha 456)</files>
<action>
Abrir o subcomando `plan-necessity` na linha de comando de ferramentas.

No topo, junto dos outros `require` de biblioteca, acrescentar `const planNecessity = require('./lib/plan-necessity.cjs');`.

Acrescentar um `case` novo logo depois do `case 'classify-task'`, seguindo o padrão de banner de comentário usado no arquivo:

```javascript
// ==================== PLAN-NECESSITY (Fase 20: auto-aborto) ====================
case 'plan-necessity': {
  cmdPlanNecessity(cwd, args.slice(1), raw);
  break;
}
```

Implementar `cmdPlanNecessity(cwd, args, raw)` junto das funções de comando, aceitando `--briefing <caminho>` (padrão: o briefing do projeto). Devolve o objeto de `check` e termina em `output(result, raw, rawValue)`, **saindo sempre com código 0**. Saída crua: `"<verdict> | <blocking_signals separados por vírgula ou 'nenhum'>"`.

Atualizar o comentário de cabeçalho do arquivo (a lista de comandos no topo) para incluir `plan-necessity`, do mesmo jeito que os outros aparecem.

Não tocar no `case 'roadmap'`: o plano 002 está editando aquele ponto em paralelo.
</action>
<verify><automated>node --check up/bin/up-tools.cjs && node up/bin/up-tools.cjs plan-necessity --raw && node up/bin/up-tools.cjs classify-task up/bin/lib/plan-necessity.cjs --raw > /dev/null && node up/bin/up-tools.cjs roadmap analyze --raw > /dev/null && echo "despacho intacto"</automated></verify>
<done>`plan-necessity` responde com JSON válido e saída crua legível, inclusive neste repositório, onde não há bloco de resultado e o veredito é `planning-needed`. `classify-task` e os subcomandos de roadmap continuam respondendo.</done>
</task>

<task id="4" type="auto">
<files>up/workflows/plan.md, up/commands/plan.md</files>
<action>
Ligar o gate ao planejamento, no ponto onde ele ainda não custou nada.

**Parte A, workflow.** Acrescentar um estágio novo, numerado 0.4, imediatamente depois da detecção de projeto contra fase e **antes** do estágio 1 de intake, com estas regras:

1. O gate só roda no modo projeto e só quando existe briefing em disco. Modo fase não aborta nunca: o roadmap já se comprometeu com aquela fase, e desistir dela é decisão de roadmap, não de gate.
2. Chamada:
```bash
NEC=$(node "$HOME/.claude/up/bin/up-tools.cjs" plan-necessity --raw)
```
3. Veredito `planning-needed`: seguir para o estágio 1 sem imprimir nada. Silêncio é a resposta certa quando a ferramenta é necessária.
4. Veredito `planning-unnecessary`: **parar antes de qualquer escrita**. Nesse ponto do workflow nada foi gerado ainda: sem arquitetura, sem roadmap, sem requisitos, sem fase, sem diretório de fase. Imprimir o bloco de auto-aborto e perguntar ao dono.

Texto do bloco de auto-aborto, no padrão de banner do sistema, em português: a declaração de que o planejamento se considera desnecessário; os cinco sinais contados com os números; a rota leve nomeada com o comando exato; e a lembrança de que planejar mesmo assim continua disponível.

5. A pergunta ao dono segue o formato da fase 13: pergunta, recomendação e motivo, com duas opções.
   - Opção recomendada: seguir pela rota leve. Motivo: os cinco sinais contados.
   - Opção alternativa: planejar mesmo assim.
6. Escolhida a rota leve: encerrar imprimindo o comando pronto, **sem criar nenhum arquivo** e sem tocar no roadmap. Registrar uma linha no estado do projeto pela operação de sessão já existente, dizendo que o planejamento foi declarado desnecessário e qual rota foi apontada. Sem esse rastro, o aborto some da memória do projeto e a mesma discussão volta na sessão seguinte.
7. Escolhida a alternativa: seguir para o estágio 1 e **não perguntar de novo na mesma execução**. Guardar o override em variável da execução e citá-lo no relatório final, para ficar visível que o gate disparou e foi vencido pelo dono.
8. Declarar em uma linha, no próprio workflow, por que palavra de parada não autoriza o aborto: o dono mandar parar significa que ele não quer mais perguntas, e não que as perguntas acabaram.

Acrescentar o estágio à lista de critérios de sucesso do workflow.

**Parte B, comando.** Acrescentar a flag `--sem-aborto` às flags do comando e do workflow, com o efeito de pular o estágio 0.4 inteiro (planeja direto, sem consultar o veredito), descrita em uma linha: planejar por decisão explícita do dono, sem passar pelo gate. Acrescentar também, na descrição do comando, a frase que torna o comportamento visível antes do uso: o planejamento pode se declarar desnecessário e apontar a rota leve.
</action>
<verify><automated>grep -q "plan-necessity" up/workflows/plan.md && grep -q "sem-aborto" up/workflows/plan.md && grep -q "sem-aborto" up/commands/plan.md && grep -q "rapido" up/workflows/plan.md && ! grep -qP "[\x{2014}\x{2013}]" up/workflows/plan.md up/commands/plan.md && echo "gate ligado"</automated></verify>
<done>O workflow tem o estágio 0.4 antes de qualquer escrita, com as duas rotas de saída, a pergunta no formato com recomendação e motivo, o registro do aborto no estado e a linha que explica por que palavra de parada não autoriza o aborto. O comando expõe a flag de escape.</done>
</task>

<task id="5" type="auto">
<files>up/bin/lib/plan-necessity.test.cjs (arquivo novo)</files>
<action>
Escrever a prova vermelho e verde do veredito, no estilo do repositório: sem framework, `assert`, helper `t(nome, fn)`, saída com código 1 quando há falha. **Ver o vermelho antes do verde** e registrar as duas saídas no resumo do plano.

Fixture base: uma função `bloco(overrides)` que monta o texto do bloco a partir de um objeto, para cada caso mudar um campo só. É o desenho que faz o teste provar o sinal isolado, e não a soma deles.

Casos:
1. Caso leve completo: encerramento por convergência, zero pergunta em aberto, zero decisão com alternativa, uma superfície, dois requisitos. Veredito `planning-unnecessary`, `blocking_signals` vazio.
2. Encerramento trivial com os mesmos números: `planning-unnecessary`.
3. Encerramento por palavra de parada, todos os outros sinais no limite: `planning-needed` com `encerramento=palavra-de-parada`. É o caso que impede o desfecho perverso de o dono dizer "chega" e o sistema concluir que não há o que planejar.
4. Encerramento por checkpoint, todos os outros no limite: `planning-needed`.
5. Uma pergunta em aberto: `planning-needed` com `perguntas_em_aberto=1`.
6. Uma decisão com alternativas reais: `planning-needed`.
7. Três superfícies: `planning-needed` com `superficies=3`.
8. Seis requisitos: `planning-needed` com `requisitos=6`.
9. Bloco ausente: `source: 'ausente'` e `planning-needed` com `sem_resultado_de_questionamento`.
10. Bloco incompleto (falta o campo de superfícies): `source: 'incompleto'`, `missing` cita o campo e o veredito é `planning-needed`.
11. Bloco com valor não numérico em perguntas em aberto: tratado como incompleto, nunca como zero. Errar aqui para o lado do zero é sumir com o planejamento por causa de um erro de digitação.
12. Bloco em inglês com os nomes de campo em inglês: reconhecido, veredito igual ao do caso 1.
13. `check` com `auto_abort: false` na configuração do projeto: `planning-needed` com `auto_abort_desligado_na_config`, mesmo com o bloco leve.
14. `check` em diretório sem planejamento: não lança e devolve `planning-needed`.

Os casos que precisam de disco usam repositório temporário criado com `fs.mkdtempSync` e removem a árvore ao final.
</action>
<verify><automated>node up/bin/lib/plan-necessity.test.cjs</automated></verify>
<done>Os catorze casos passam, com o vermelho de pelo menos um registrado antes do verde. Cada sinal bloqueador é provado isoladamente, e o caso da palavra de parada está entre eles.</done>
</task>

<task id="6" type="auto">
<files>diretório temporário do sistema (fixtures de smoke), .plano/fases/20-nevoa-e-fronteira-do-roadmap/ (registro da evidência no resumo do plano)</files>
<action>
Rodar a prova smoke do gate, que é o tipo de prova exigido pela fase, em dois cenários, num repositório temporário fora deste, para não sujar a árvore de trabalho.

Preparação: dois diretórios temporários, cada um com `.plano/` e um briefing.
- Leve: trocar um valor padrão de configuração, com o bloco no formato do caso 1 do teste.
- Pesado: um subsistema novo, com o bloco declarando duas perguntas em aberto, três superfícies e sete requisitos.

Execução e conferência, com o comando rodado a partir de cada diretório:
1. No cenário leve, o veredito é `planning-unnecessary`, os sinais aparecem contados na saída e a rota leve nomeada é a do escape hatch.
2. No cenário pesado, o veredito é `planning-needed` e os sinais bloqueadores citam pergunta em aberto, superfícies e requisitos.
3. Em ambos, depois de rodar o veredito, **nenhum arquivo novo foi criado** em `.plano/`: sem roadmap, sem requisitos, sem diretório de fase. É a metade que prova o "sem gerar fases" do requisito, e vale mais que o texto do banner.

Registrar no resumo do plano as saídas cruas dos dois cenários e a listagem do diretório de planejamento antes e depois, que é a evidência do item 3. Apagar os temporários ao final.
</action>
<verify><automated>D=$(mktemp -d) && mkdir -p "$D/.plano" && printf '# Briefing\n\nTrocar o valor padrão de um limiar.\n\n## Resultado do questionamento\n\n- Encerramento: convergencia\n- Perguntas feitas: 3\n- Perguntas em aberto: 0\n- Decisões com alternativas reais: 0\n- Superfícies tocadas: 1\n- Requisitos derivados: 1\n' > "$D/.plano/BRIEFING.md" && ANTES=$(ls "$D/.plano" | wc -l) && node up/bin/up-tools.cjs plan-necessity --cwd "$D" --raw | grep -q "planning-unnecessary" && DEPOIS=$(ls "$D/.plano" | wc -l) && [ "$ANTES" = "$DEPOIS" ] && rm -rf "$D" && echo "smoke leve ok e nenhum arquivo criado"</automated></verify>
<done>O cenário leve devolve planejamento desnecessário com a rota leve nomeada, o cenário pesado devolve planejamento necessário com os sinais bloqueadores citados, e em nenhum dos dois o diretório de planejamento ganhou arquivo.</done>
</task>

## Critérios de aceite do plano

Verdadeiro ao fim, conferível por comando:

Briefing leve, com bloco indicando convergência e sinais dentro dos limites: o planejamento se declara desnecessário, aponta a rota leve e não cria arquivo nenhum (WAY-01).

O critério de leve é observável: cinco condições numéricas declaradas no módulo, ecoadas na saída com os valores contados e provadas uma a uma.

Encerramento por palavra de parada nunca dispara o aborto, o que está provado por caso dedicado.

Sem bloco, com bloco incompleto ou com a chave de configuração desligada, o planejamento roda normalmente, o que preserva projeto anterior ao ciclo.

O dono pode planejar mesmo assim, pela opção da pergunta ou pela flag de escape, e o override fica visível no relatório final.

## Tipo de prova

Smoke como prova principal, na tarefa 6, com dois briefings de fixture e a conferência de que nada foi escrito. Somada a ela, prova de lógica vermelho e verde na tarefa 5, com um caso por sinal bloqueador, porque o veredito decide se o sistema trabalha ou não.

Registro esperado no log de aprovações, no formato de seis colunas, com escopo `fase=20 plano=003` e evidência `smoke:pass`.

## Fora de escopo

Mudar a classificação de tarefa: o gate lê o resultado do questionamento e não reimplementa a classificação.

Executar a rota leve automaticamente: o gate aponta e para. Disparar o trabalho é escolha do dono.

Aborto no modo fase: fase que já está no roadmap não é abortada por gate. Retirar fase é decisão de roadmap, não de gate.

Escrita do bloco de resultado pelo próprio gate: quem escreve é o questionamento. O gate só lê, e cada artefato continua com um dono só.

Monitor de contexto, gate de evidência e revisor: nada deste plano encosta neles.
