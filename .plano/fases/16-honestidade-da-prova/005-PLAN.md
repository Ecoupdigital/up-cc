---
phase: 16-honestidade-da-prova
plan: "005"
type: chore
wave: 5
depends_on: ["004"]
autonomous: true
requirements: [PROVA-06, PROVA-07, PROVA-08, REG-01, REG-02, REG-03]
files_modified:
  - up/skills/up-tdd/SKILL.md
  - up/references/tdd-evidence-types.md
  - up/bin/lib/tautologia.test.cjs
  - up/bin/lib/tautologia.cjs
  - up/bin/up-tools.cjs
  - up/agents/up-revisor.md
  - up/workflows/build.md
  - .plano/ROADMAP.md
  - .plano/REQUIREMENTS.md
seams:
  - contrato: "subcomando da CLI de ferramentas do UP, invocado como subprocesso com JSON em stdout"
    tipo: comando
    estado: existente
    nivel: "superfície pública mais alta do sistema que um teste consegue executar"
    justificativa: ""
prova: "logic:test_pass (vermelho e verde sobre a heurística, com par de fixtures no mesmo cenário)"
must_haves:
  truths:
    - "A doutrina de TDD mostra o par bom e ruim lado a lado, no mesmo cenário"
    - "A verificação estática sinaliza teste tautológico por heurística"
    - "O teste honesto do par não gera achado nenhum"
    - "A heurística sinaliza e não bloqueia: o resultado geral da verificação não vira falha por causa dela"
    - "O revisor recebe os achados e confirma ou descarta cada um"
  artifacts:
    - path: "up/bin/lib/tautologia.cjs"
      provides: "Heurística mecânica de detecção de teste tautológico, com dois sinais fechados"
    - path: "up/bin/lib/tautologia.test.cjs"
      provides: "Par de fixtures no mesmo cenário, visto falhar antes de passar"
  key_links:
    - from: "subcomando verify-static"
      to: "up-revisor"
      via: "achados gravados em .plano/runtime/verify-static-tautologia.log e lidos no prompt da revisão"
---

# Fase 16 Plano 005: Regra anti-tautologia

<objective>
Impedir que teste que recomputa o resultado do jeito que o código computa continue registrando evidência válida, com regra dura na doutrina de TDD e heurística mecânica na verificação estática que sinaliza sem bloquear.
</objective>

**Onda:** 5. **Depende de:** plano 004. A ordem interna da fase é deliberada: a regra anti-tautologia só vale no gate depois que existe lugar acordado para o teste. Sem fronteira acordada, saber que o valor esperado veio de fonte independente ajuda pouco, porque o teste continuaria encostado em qualquer lugar.
**Tipo de prova:** lógica, vermelho e verde, com par de fixtures.

## Por que este plano existe

O valor esperado de um teste tem que vir de fonte independente: literal conhecido bom, exemplo trabalhado à mão, ou o próprio requisito. Nunca recomputado do mesmo jeito que o código computa.

Teste que recomputa passa por construção e nunca discorda do código. É o falso positivo número um de modelo de linguagem escrevendo teste, e hoje uma entrada `evidence=logic:test_pass` no log pode estar registrando exatamente isso. O gate valida que o teste rodou, não que ele podia falhar.

**Decisão já registrada pelo dono, e ela não se reabre aqui:** a heurística SINALIZA, não bloqueia o gate. Falso positivo bloqueante em cima de teste honesto é pior do que tautologia passando. Quem confirma ou descarta o achado é o revisor.

## Contexto

@up/skills/up-tdd/SKILL.md - doutrina de TDD por tipo, onde a regra dura entra
@up/references/tdd-evidence-types.md - reference irmã, que ganha o ponteiro curto
@up/bin/up-tools.cjs - função `cmdVerifyStatic` por volta da linha 3449, com a lista de checagens e o cálculo de `overall`
@up/agents/up-revisor.md - agente que confirma ou descarta o achado
@up/bin/lib/test-helpers.cjs - helper criado no plano 001

## Tarefas

<task id="1" type="auto">
<files>up/skills/up-tdd/SKILL.md (editar), up/references/tdd-evidence-types.md (editar)</files>
<action>
Escrever a regra dura na doutrina, com o par bom e ruim lado a lado, no MESMO cenário nos dois lados. Cenário diferente nos dois lados não ensina nada, porque o leitor atribui a diferença ao cenário.

**Em `up/skills/up-tdd/SKILL.md`,** acrescentar uma seção logo depois do bloco de lógica e parser, com o título "Regra anti-tautologia: o valor esperado vem de fonte independente":

1. **A regra em duas frases.** O valor esperado vem de fonte independente: literal conhecido bom, exemplo trabalhado à mão, ou o próprio requisito. Nunca recomputado do mesmo jeito que o código computa.
2. **O porquê em uma frase.** Teste que recomputa passa por construção, nunca discorda do código, e por isso não é prova de nada.
3. **O par, no mesmo cenário.** Cenário único: uma função que transforma título em identificador legível (remove acento, baixa a caixa e troca espaço por hífen). Dois blocos em sequência, com rótulo:
   - **RUIM (tautológico):** a asserção compara a saída da função com uma expressão que refaz, dentro do teste, a mesma cadeia de operações da implementação. Anotar em uma linha: se a implementação errar a ordem das operações, o teste erra junto e continua verde.
   - **BOM (honesto):** a asserção compara a saída da função com o literal `'ola-mundo'`, escrito à mão a partir do requisito. Anotar em uma linha: se a implementação mudar de comportamento, este teste fica vermelho, que é a única coisa que um teste precisa saber fazer.
4. **As três fontes independentes aceitas**, uma linha cada: literal conhecido bom, exemplo trabalhado (entrada e saída escritas à mão antes do código) e o requisito citado por identificador.
5. **Racionalização que mata o atalho**, no mesmo tom das que já existem: "escrever o esperado à mão é duplicar lógica" responde "duplicar de propósito é o ponto: é a segunda opinião".
6. **Onde isto é verificado**, em uma linha: a verificação estática sinaliza o achado por heurística e o revisor confirma ou descarta, sem bloquear o gate sozinha.

**Em `up/references/tdd-evidence-types.md`,** na seção do tipo `logic`, depois da frase que diz que teste que passa de primeira não prova nada, acrescentar três linhas: a regra em uma frase; onde está o par bom e ruim (na skill de TDD); e que a verificação estática sinaliza por heurística, o revisor confirma ou descarta, e ela não bloqueia o gate sozinha. Não duplicar o par de exemplos aqui.

Português acentuado, zero travessão no texto novo.
</action>
<verify><automated>grep -qi "anti-tautologia" up/skills/up-tdd/SKILL.md && grep -q "ola-mundo" up/skills/up-tdd/SKILL.md && grep -qi "RUIM" up/skills/up-tdd/SKILL.md && grep -qi "fonte independente" up/references/tdd-evidence-types.md && echo "doutrina ok"</automated></verify>
<done>A skill traz a regra, o par bom e ruim no mesmo cenário com anotação em cada lado, as três fontes aceitas e a linha sobre sinalizar sem bloquear. A reference aponta em três linhas, sem duplicar o par. Imprime `doutrina ok`.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/tautologia.test.cjs (novo), .plano/fases/16-honestidade-da-prova/evidencia/005-red.txt (novo)</files>
<action>
Escrever o teste ANTES da implementação e VER FALHAR. Passo vermelho obrigatório.

Fronteira: a mesma já acordada. Tudo pela CLI como subprocesso, via `runUpToolsJson` de `test-helpers.cjs`. Não importar `tautologia.cjs` diretamente neste arquivo.

**Par de fixtures, no mesmo cenário** (a função que transforma título em identificador legível). O teste escreve os arquivos num projeto temporário, dentro de `testes/`:

- `testes/slug-tautologico.test.cjs`: importa `slugify` do módulo de produção e afirma que a saída da função é igual a uma expressão que refaz a cadeia de operações da implementação dentro do próprio teste (baixar caixa, normalizar, remover diacrítico, trocar espaço por hífen).
- `testes/slug-honesto.test.cjs`: importa `slugify` do mesmo módulo e afirma que a saída para a entrada `'Ola Mundo'` é o literal `'ola-mundo'`.
- `testes/slug-repetido.test.cjs`: no mesmo cenário, afirma que a saída da função é igual à saída da mesma função com a mesma entrada.

Casos, todos por `verify-static --tautologia --paths <caminhos separados por vírgula>`:

1. `tautológico é sinalizado` - contra a fixture tautológica, `tautologia.findings.length >= 1` e o primeiro achado tem `signal` igual a `esperado_computado_no_teste`, com `file` e `line` preenchidos.
2. `honesto não gera achado` - contra a fixture honesta, `tautologia.findings.length` é zero e o status da checagem é `pass`.
3. `asserção que repete a implementação é sinalizada` - contra a fixture repetida, achado com `signal` igual a `assercao_repete_implementacao`.
4. **`heurística não bloqueia`** - contra a fixture tautológica, o campo `overall` do resultado NÃO é `fail`, e o status da checagem de tautologia é `warn`. Asserção explícita com `assert.notStrictEqual(r.overall, 'fail')` e mensagem citando PROVA-08. Este é o caso que trava a decisão do dono no código.
5. `sem arquivo de teste, a checagem é pulada` - projeto temporário vazio: status `skip`, sem achado e sem falha.
6. `achado citável` - cada achado traz `file`, `line`, `snippet` (no máximo 200 caracteres) e `why` (uma frase em português), para o revisor confirmar sem reabrir o arquivo.
7. `log de achados gravado` - depois da execução existe `.plano/runtime/verify-static-tautologia.log` no projeto temporário, com os achados legíveis.

Rodar, confirmar RED e gravar em `evidencia/005-red.txt`.
</action>
<verify><automated>node up/bin/lib/tautologia.test.cjs > .plano/fases/16-honestidade-da-prova/evidencia/005-red.txt 2>&1; grep -qE "FAIL|failed" .plano/fases/16-honestidade-da-prova/evidencia/005-red.txt && echo "RED confirmado"</automated></verify>
<done>Os 7 casos existem com o par de fixtures no mesmo cenário, foram executados e falharam porque a checagem ainda não existe. Saída vermelha gravada.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/tautologia.cjs (novo)</files>
<action>
Implementar a heurística. Ela é mecânica e declaradamente imperfeita: gera falso positivo, e por isso sinaliza em vez de bloquear.

Constantes no topo, cada uma com comentário dizendo que é lista fechada.

`ASSERT_PATTERNS`, formas de asserção reconhecidas, com a posição do operando esperado:
- `assert.strictEqual(atual, esperado)`, `assert.deepStrictEqual`, `assert.equal`, `assert.deepEqual`: o esperado é o segundo argumento.
- `expect(atual).toBe(esperado)`, `.toEqual(esperado)`, `.toStrictEqual(esperado)`: o esperado é o argumento do método.
- `assert.ok(...)` NÃO entra: não tem operando esperado separado, e inferir gera ruído.

`SIGNALS`, os dois sinais fechados:
- `esperado_computado_no_teste`: o operando esperado contém chamada de função (casa `/[A-Za-z_$][\w$]*\s*\(/`) ou encadeamento de método sobre variável (casa `/\.\s*[A-Za-z_$][\w$]*\s*\(/`), em vez de literal. Motivo para o campo `why`: "o valor esperado é computado dentro do próprio teste, então o teste concorda com o código por construção".
- `assercao_repete_implementacao`: o identificador chamado no operando esperado também aparece no operando atual, OU pertence ao conjunto de identificadores importados por `require(...)` de módulo que não é de teste. Motivo: "a asserção repete a mesma operação da implementação".

Funções exportadas:

1. `extrairImports(source)`: devolve o conjunto de identificadores vindos de `require('...')`, cobrindo `const { a, b } = require('x')` e `const m = require('x')`. Ignora `require` de caminho que contenha `test`, `assert` ou prefixo `node:`.
2. `scanTestSource(source, opts)`, com `opts` trazendo `{ file }`. Percorre linha a linha, casa `ASSERT_PATTERNS`, extrai o operando esperado com um separador de argumentos que respeite parênteses e aspas (contador de profundidade, nunca `split(',')` cru), aplica os dois sinais e devolve `{ file, findings: [{ signal, line, snippet, why }] }`. Um mesmo trecho pode disparar os dois sinais, e nesse caso emite os dois achados, porque o revisor confirma achado por achado.
   - Literal não gera achado: texto entre aspas, número, `true`, `false`, `null`, `undefined`, array ou objeto literal sem chamada dentro.
   - Limitar `snippet` a 200 caracteres.
3. `scanFiles(paths, opts)`: para cada caminho, se for diretório, varre recursivamente procurando arquivo terminado em `.test.cjs`, `.test.js`, `.test.ts`, `.test.tsx`, `.spec.js` ou `.spec.ts`, ignorando `node_modules`; se for arquivo, usa direto. Teto declarado de 300 arquivos e 400 kB por arquivo. Devolve `{ files_scanned, findings, truncated }`.

Estilo: CommonJS, `'use strict'`, 2 espaços, aspas simples, `module.exports = { ... }` por objeto literal no fim. Zero dependência externa e zero analisador sintático: é heurística por texto, e o cabeçalho do arquivo diz isso em uma frase, junto da frase "sinaliza, nao bloqueia".
</action>
<verify><automated>node -e "const t=require('./up/bin/lib/tautologia.cjs'); const ruim=\"const { slugify } = require('../src/slug.cjs');\nassert.strictEqual(slugify(e), e.toLowerCase().replace(/ /g,'-'));\"; const bom=\"const { slugify } = require('../src/slug.cjs');\nassert.strictEqual(slugify('Ola Mundo'), 'ola-mundo');\"; const a=t.scanTestSource(ruim,{file:'x'}); const b=t.scanTestSource(bom,{file:'y'}); if(a.findings.length<1) throw new Error('tautologico nao sinalizado'); if(b.findings.length!==0) throw new Error('honesto sinalizado: '+JSON.stringify(b.findings)); console.log('heuristica ok');"</automated></verify>
<done>O módulo sinaliza o teste tautológico e não sinaliza o honesto no mesmo cenário, com achados carregando sinal, linha, trecho e motivo. Imprime `heuristica ok`.</done>
</task>

<task id="4" type="auto">
<files>up/bin/up-tools.cjs (editar), .plano/fases/16-honestidade-da-prova/evidencia/005-green.txt (novo)</files>
<action>
Ligar a heurística na verificação estática, na fronteira já acordada, sem que ela ganhe poder de bloquear.

Em `cmdVerifyStatic` (por volta da linha 3449):

1. Acrescentar `const tautologia = require('./lib/tautologia.cjs');` junto dos outros requires do topo do arquivo.
2. Acrescentar a flag `--tautologia` ao analisador de flags e incluir a checagem no caminho de `--all`. Acrescentar também `--paths <lista separada por vírgula>` para restringir a varredura (usada pelo teste da tarefa 2).
3. Implementar a checagem:
   - Descobrir os arquivos: `--paths` quando dado; senão varredura a partir de `cwd` pelas extensões de teste, ignorando `node_modules`.
   - Sem arquivo de teste: entrada `{ name: 'tautologia', status: 'skip', exit_code: null, summary: 'nenhum arquivo de teste encontrado', output_path: null }`.
   - Com achados: `status` igual a `warn`, `summary` no formato `N sinais de tautologia em M arquivos (sinaliza, nao bloqueia)`, e o array `findings` na própria entrada da checagem (no máximo 20 no JSON, com `findings_total` cheio).
   - Sem achados: `status` igual a `pass`.
   - Gravar sempre o relatório completo em `.plano/runtime/verify-static-tautologia.log`, uma linha por achado no formato `arquivo:linha | sinal | trecho | motivo`, e apontar `output_path` para ele.
4. **Não contaminar o resultado geral.** Ajustar o cálculo final para que `warn` seja categoria própria: `const warned = checks.filter(c => c.status === 'warn');`, `overall` continua sendo `fail` apenas quando há checagem com status `fail`, e `warn` nunca vira `fail`. Acrescentar `warned: warned.length` em `counts` e incluir a contagem na string de resumo. Comentário obrigatório no código citando PROVA-08: a heurística sinaliza para confirmação do revisor e não bloqueia o gate por conta própria.
5. Atualizar o bloco de comentário de uso da função com as flags novas.

Rodar o teste da tarefa 2 até ficar verde e gravar em `evidencia/005-green.txt`.
</action>
<verify><automated>node up/bin/lib/tautologia.test.cjs > .plano/fases/16-honestidade-da-prova/evidencia/005-green.txt 2>&1; grep -q "0 failed" .plano/fases/16-honestidade-da-prova/evidencia/005-green.txt && node up/bin/up-tools.cjs verify-static --tautologia --raw</automated></verify>
<done>Os 7 casos passam pela CLI real, incluindo o que prova que `overall` não vira `fail` por causa da heurística. Par vermelho e verde gravado. A checagem roda contra este próprio repositório sem quebrar.</done>
</task>

<task id="5" type="auto">
<files>up/agents/up-revisor.md (editar), up/workflows/build.md (editar)</files>
<action>
Fechar o laço: o achado precisa chegar a alguém que confirme ou descarte, senão sinalizar não serve para nada.

**`up/agents/up-revisor.md`**: acrescentar um bloco curto na etapa de qualidade, com:
- A instrução: quando o prompt trouxer achados de tautologia, tratar cada um individualmente. Para cada achado, ler o trecho citado e emitir um de dois vereditos: `confirmado` (o valor esperado realmente vem da mesma computação do código, e o teste não prova nada) ou `descartado` (falso positivo, com o motivo em uma linha).
- A regra dura: a heurística NÃO bloqueia o gate por conta própria. O que pode mudar o veredito da fase é a confirmação do revisor, nunca o achado cru.
- O que fazer com achado confirmado: entra no relatório de revisão como problema com localização exata e correção sugerida (trocar o esperado por fonte independente), e pesa no veredito como qualquer outro problema de qualidade.
- Ponteiro de uma linha para a regra na skill de TDD, sem reexplicar a doutrina.

**`up/workflows/build.md`**: na seção 3.7 (revisão da fase), antes do spawn do revisor, acrescentar:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" verify-static --tautologia --raw
TAUT_LOG=".plano/runtime/verify-static-tautologia.log"
[ -s "$TAUT_LOG" ] && echo "Achados de tautologia para o revisor confirmar: $(wc -l < "$TAUT_LOG")"
```

e acrescentar `.plano/runtime/verify-static-tautologia.log` (se existir) na lista `<files_to_read>` do prompt do revisor, com a instrução de uma linha: confirmar ou descartar cada achado, sem tratar achado cru como veredito.

Atualizar os `success_criteria` do build com o item: achados de tautologia apresentados ao revisor, confirmados ou descartados, e nenhum deles bloqueando o gate por conta própria.
</action>
<verify><automated>grep -qi "tautologia" up/agents/up-revisor.md && grep -q "verify-static-tautologia.log" up/workflows/build.md && echo "laco fechado"</automated></verify>
<done>O revisor recebe os achados, confirma ou descarta cada um e registra os confirmados no relatório. O build produz e entrega os achados. Nem o agente nem o workflow dão poder de bloqueio à heurística. Imprime `laco fechado`.</done>
</task>

<task id="6" type="auto">
<files>.plano/fases/16-honestidade-da-prova/evidencia/005-regressao.txt (novo), .plano/ROADMAP.md (editar), .plano/REQUIREMENTS.md (editar)</files>
<action>
Fechar a fase: regressão zero e o registro das evidências que a fase inteira exige.

1. Rodar e gravar em `.plano/fases/16-honestidade-da-prova/evidencia/005-regressao.txt`:
   - `node scripts/run-up-tests.cjs` (os três arquivos de teste do UP verdes: github, gate e tautologia).
   - `npm test` (suíte do GSD intacta).
   - `node up/bin/up-tools.cjs verify-static --all --raw` (a verificação estática inteira roda, e o `overall` não vira `fail` por causa da heurística).
   - `HOME=$(mktemp -d) node up/bin/install.js --all --global` (os 4 runtimes instalam).
   - `node up/bin/up-tools.cjs gate verdict --phase 11 --field decision` e `--phase 12 --field decision`, que precisam continuar devolvendo `APPROVE`.

2. **Evidência da fase em mais de um tipo.** A fase 16 tem prova de dois tipos, e a reference de evidência por tipo já manda registrar uma linha por tipo. Registrar no resumo de execução, e no prompt do revisor quando a fase fechar, que o log da fase 16 precisa carregar no mínimo:
   - `... | phase-16 | up-revisor | APPROVE | {motivo} | evidence=logic:test_pass` (par vermelho e verde do leitor único, da validação de fronteiras e da heurística)
   - `... | phase-16 | up-revisor | APPROVE | {motivo} | evidence=glue:smoke` (prova de fumaça das fronteiras, do plano 004)
   mais a entrada `evidence=seams:confirmed` já gravada pelo plano 004.
   Conferir com `node up/bin/up-tools.cjs gate verdict --phase 16` que `evidence_types` contém `logic`, `glue` e `seams`.

3. Atualizar `.plano/ROADMAP.md` (marcar a fase 16, com a linha de evidência citando as entradas do log) e `.plano/REQUIREMENTS.md` (marcar PROVA-01 a PROVA-08 e a rastreabilidade da fase 16). Usar os subcomandos da CLI (`roadmap`, `requirements mark-complete`) sempre que eles derem conta, em vez de edição manual.
</action>
<verify><automated>node scripts/run-up-tests.cjs && npm test && node up/bin/up-tools.cjs gate verdict --phase 11 --field decision | grep -q APPROVE && node up/bin/up-tools.cjs gate verdict --phase 12 --field decision | grep -q APPROVE && echo "REG ok"</automated></verify>
<done>Testes do UP e do GSD verdes, verificação estática sem falha causada pela heurística, instalação nos 4 runtimes rodando, leitura do histórico das fases 11 e 12 intacta, e o log da fase 16 com as três gramáticas de evidência. Roadmap e requisitos atualizados.</done>
</task>

## Critérios de Sucesso

- [ ] A skill de TDD mostra o par bom e ruim lado a lado, no mesmo cenário, com anotação em cada lado
- [ ] Existe teste sobre a heurística com par de fixtures (um tautológico e um honesto), visto falhar antes de passar
- [ ] O teste tautológico é sinalizado com sinal, arquivo, linha, trecho e motivo
- [ ] O teste honesto não gera achado nenhum
- [ ] A heurística sinaliza sem bloquear: `overall` da verificação estática não vira `fail` por causa dela
- [ ] O revisor recebe os achados e confirma ou descarta cada um, e só a confirmação pesa no veredito
- [ ] O log da fase 16 carrega evidência de lógica, de fumaça e de fronteiras confirmadas
- [ ] `npm test`, `npm run test:up` e a instalação nos 4 runtimes continuam passando

## FORA DE ESCOPO

- **Não transformar a heurística em bloqueio.** A decisão do dono já está registrada: sinaliza, não bloqueia. Aumentar o poder dela é mudança de decisão e sobe como pergunta.
- **Não escrever analisador sintático.** A detecção é heurística por texto, com dois sinais fechados. Analisar árvore sintática seria trabalho de outra ordem, e falso positivo continuaria existindo do mesmo jeito.
- **Não varrer teste de terceiro.** `node_modules` fica fora, e há teto declarado de arquivos e de tamanho.
- **Não corrigir os testes tautológicos que a heurística encontrar neste repositório.** Encontrar e sinalizar é o escopo. Corrigir teste existente é trabalho próprio, com prova própria.
- **Não tocar o sedimento dos templates nem `governance-rules.md`.** Vale a mesma fronteira dos planos anteriores.
- **Não acrescentar dimensão nova à verificação estática** além da checagem de tautologia (nada de complexidade, cobertura ou duplicação).
