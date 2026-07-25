---
phase: 16-honestidade-da-prova
plan: "001"
type: chore
wave: 1
depends_on: []
autonomous: true
requirements: [PROVA-04]
files_modified:
  - scripts/run-up-tests.cjs
  - package.json
  - up/bin/lib/test-helpers.cjs
  - up/bin/lib/gate.test.cjs
  - up/bin/lib/gate.cjs
  - up/bin/up-tools.cjs
seams:
  - contrato: "subcomando da CLI de ferramentas do UP, invocado como subprocesso com JSON em stdout"
    tipo: comando
    estado: existente
    nivel: "superfície pública mais alta do sistema que um teste consegue executar"
    justificativa: ""
prova: "logic:test_pass (vermelho e verde, visto falhar antes de passar)"
must_haves:
  truths:
    - "O leitor devolve APPROVE para a linha de cinco colunas da fase 11, que não tem coluna de agente"
    - "O leitor não confunde o campo de evidência com o campo de veredito"
    - "O leitor aceita as gramáticas de evidência já gravadas em disco, além da documentada"
    - "O leitor ignora apenas a linha que não carrega palavra de veredito nenhuma"
  artifacts:
    - path: "up/bin/lib/gate.cjs"
      provides: "Leitor de histórico do log de aprovações, localizando campo por conteúdo"
    - path: "up/bin/lib/gate.test.cjs"
      provides: "Teste vermelho e verde sobre os três pontos de quebra"
  key_links:
    - from: "up/bin/up-tools.cjs"
      to: "up/bin/lib/gate.cjs"
      via: "subcomando gate, que é a fronteira pública onde o teste encosta"
---

# Fase 16 Plano 001: Leitor único do log de aprovações

<objective>
Criar o leitor único do histórico do log de aprovações, que localiza campo por conteúdo e não por posição fixa, e expô-lo como subcomando da CLI, com par vermelho e verde sobre os três pontos de quebra conhecidos.
</objective>

**Onda:** 1. **Depende de:** nada dentro da fase (a fase inteira depende da fase 13).
**Tipo de prova:** lógica, vermelho e verde. O teste precisa ser visto falhar antes de passar, e as duas saídas ficam gravadas como evidência.

## Os três pontos de quebra (verificados por execução)

O log deste repositório tem hoje três formas: um fragmento de JSON truncado nas duas primeiras linhas, sem veredito nenhum; e duas linhas de cinco colunas escritas à mão, `fase=11 plano=001 | APPROVED | evidence=smoke:pass | ...` e `fase=12 plano=001 | APPROVED | evidence=test:red-green | ...`.

O gate de hoje quebra em três pontos, nesta ordem de execução:

1. **Seletor.** `grep "phase-${PHASE_NUMBER}.*up-revisor"` não casa: as linhas dizem `fase=11` e não têm coluna de agente. A busca volta vazia e o gate para em "veredito não encontrado". **Este falha primeiro, e por isso os outros dois nunca chegam a ser exercidos.**
2. **Posição.** `awk -F'|' '{print $4}'` assume seis colunas. As linhas reais têm cinco, então a quarta coluna é a evidência e não o veredito.
3. **Vocabulário.** `grep -oE 'evidence=(logic|ui|glue):(test_pass|visual|smoke)'` não reconhece `evidence=smoke:pass` nem `evidence=test:red-green`, que são as duas entradas reais.

**Precisão de alvo:** as duas linhas divergentes foram escritas à mão, fora do workflow, porque as fases 11 e 12 rodaram fora do roadmap. O escritor oficial já emite o formato documentado de seis colunas e não muda. O alvo é a leitura de histórico. Religar os gates ao leitor é o plano 002.

## Contexto

@.plano/governance/approvals.log - as três formas reais, base da fixture
@up/references/tdd-evidence-types.md - contrato documentado da linha e do campo de evidência
@up/bin/lib/github.test.cjs - único teste do lado UP hoje, e o padrão a seguir
@up/bin/up-tools.cjs - despachante de subcomandos, funções `output` e `error`, flag `--cwd`

## Tarefas

<task id="1" type="auto">
<files>scripts/run-up-tests.cjs (novo), package.json (editar)</files>
<action>
Criar o corredor de testes do lado UP. Hoje `npm test` roda apenas os testes do GSD, e o único teste do UP só roda invocado à mão.

`scripts/run-up-tests.cjs`, CommonJS, com `'use strict'` e shebang `#!/usr/bin/env node`:
- Varre recursivamente `up/` procurando arquivos terminados em `.test.cjs`, ignorando `node_modules`.
- Ordena por caminho, para saída determinística.
- Executa cada arquivo em subprocesso com `execFileSync(process.execPath, [arquivo], { stdio: 'inherit' })`, dentro de try/catch, contando quantos falharam.
- Imprime `up tests: N arquivos, M falharam` e faz `process.exit(M ? 1 : 0)`.
- Sem glob de shell (compatibilidade Windows), como `scripts/run-tests.cjs` já faz.

Em `package.json`, acrescentar em `scripts` a entrada `"test:up": "node scripts/run-up-tests.cjs"`. Não alterar `"test"`, que continua sendo o corredor do GSD. Não acrescentar dependência nenhuma.
</action>
<verify><automated>node scripts/run-up-tests.cjs && npm run test:up</automated></verify>
<done>`npm run test:up` descobre e executa `up/bin/lib/github.test.cjs` e sai com código 0. `npm test` mantém o comportamento anterior.</done>
</task>

<task id="2" type="auto">
<files>up/bin/lib/test-helpers.cjs (novo)</files>
<action>
Criar o helper compartilhado dos testes do UP, para que os arquivos de teste desta fase toquem a fronteira acordada (a CLI como subprocesso) sem duplicar infraestrutura. Exportar por objeto literal no fim do arquivo, conforme a convenção de `core.cjs`:

- `runUpTools(args, cwd)`: recebe `args` como array, executa `execFileSync(process.execPath, [caminhoDoUpTools, ...args, '--cwd', cwd], { encoding: 'utf-8', stdio: ['pipe','pipe','pipe'] })` e devolve `{ success: true, stdout, exitCode: 0 }`. Em erro devolve `{ success: false, stdout: (err.stdout||'').toString(), stderr: (err.stderr||'').toString(), exitCode: err.status ?? 1 }`. Nunca lança. Caminho do up-tools por `path.join(__dirname, '..', 'up-tools.cjs')`.
- `runUpToolsJson(args, cwd)`: chama `runUpTools` e devolve `JSON.parse(stdout)`; se o parse falhar, devolve `{ __parse_error: true, stdout, stderr }` em vez de lançar, para a asserção conseguir mostrar a saída real.
- `mkTempProject(files)`: cria diretório com `fs.mkdtempSync(path.join(os.tmpdir(), 'up-test-'))`, cria `.plano/governance/` e `.plano/fases/`, e para cada chave de `files` (caminho relativo) escreve o conteúdo criando os diretórios intermediários. Devolve o caminho.
- `cleanup(dir)`: `fs.rmSync(dir, { recursive: true, force: true })` em try/catch silencioso.
- `runner()`: devolve `{ t, done }`. `t(nome, fn)` executa capturando exceção, imprime `  ok  - nome` ou `  FAIL - nome` com a mensagem, e conta. `done()` imprime `\nN passed, M failed` e faz `process.exit(M ? 1 : 0)`. Mesmo formato de saída de `github.test.cjs`, para o corredor da tarefa 1 ler o código de saída.

Nomes de função e variável em inglês camelCase, mensagens ao dono em português. Zero travessão.
</action>
<verify><automated>node -e "const h=require('./up/bin/lib/test-helpers.cjs'); const d=h.mkTempProject({'.plano/governance/approvals.log':'x\n'}); const r=h.runUpTools(['timestamp'], d); if(!r.success) throw new Error('runUpTools falhou: '+r.stderr); h.cleanup(d); console.log('helpers ok');"</automated></verify>
<done>O helper cria projeto temporário, executa a CLI real como subprocesso e devolve saída estruturada sem lançar. Imprime `helpers ok`.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/gate.test.cjs (novo), .plano/fases/16-honestidade-da-prova/evidencia/001-red.txt (novo)</files>
<action>
Escrever o teste ANTES da implementação e VER FALHAR. Este é o passo vermelho e ele não pode ser pulado.

O teste toca a fronteira acordada: `node up/bin/up-tools.cjs gate ...` como subprocesso, via `runUpToolsJson`. Não importar `gate.cjs` diretamente em lugar nenhum deste arquivo. Cabeçalho JSDoc no topo declarando escopo e o requisito coberto (PROVA-04).

Fixture única, escrita pelo teste num projeto temporário em `.plano/governance/approvals.log`, com exatamente este conteúdo (as três formas reais mais a forma canônica de seis colunas):

```
{
  "timestamp": "2026-07-09T03:16:35.697Z"
2026-07-09T03:16:43Z | fase=11 plano=001 | APPROVED | evidence=smoke:pass | grok inspect lista 7 up-* [claude]; doutrina+slash intactos
2026-07-09T03:22:33Z | fase=12 plano=001 | APPROVED | evidence=test:red-green | finishPhase solo: RED action=none -> GREEN action=merged; local segue no-op
2026-05-30T14:00:00Z | phase-3 | up-revisor | APPROVE | filtro ok | evidence=logic:test_pass
2026-05-30T14:10:00Z | planning | up-revisor | APPROVE | confidence=88
```

Casos, um por ponto de quebra e um por regra nova:

1. `seletor: acha a fase 11 sem coluna de agente` - `gate verdict --phase 11` devolve `found === true`. É o caso que o seletor antigo perdia.
2. `posição: veredito não é evidência` - `gate verdict --phase 11` devolve `decision === 'APPROVE'`, com asserção explícita `assert.notStrictEqual(r.decision, 'evidence=smoke:pass')` citando o ponto 2.
3. `vocabulário: smoke:pass normaliza para glue` - `gate verdict --phase 11` devolve `evidence_types` contendo `glue` e `evidence[0].result === 'pass'`.
4. `vocabulário: test:red-green normaliza para logic` - `gate verdict --phase 12` devolve `evidence_types` contendo `logic`.
5. `forma canônica de seis colunas continua lida` - `gate verdict --phase 3` devolve `decision === 'APPROVE'`, `agent === 'up-revisor'` e `evidence_types` contendo `logic`.
6. `fragmento sem veredito é ignorado` - `gate entries` devolve `ignored.length >= 2` e nenhuma entrada cujo `raw` comece com `{`.
7. `fase inexistente não explode` - `gate verdict --phase 99` devolve `found === false`, `pass === false`, `reasons` contendo `no_entry`, e o subprocesso sai com código 0.
8. `escopo não numérico` - `gate verdict --scope planning` devolve `found === true` e `decision === 'APPROVE'`.
9. `campo escalar` - `gate verdict --phase 11 --field decision` imprime exatamente `APPROVE`, sem chaves de JSON.
10. `evidência esperada casa e não casa` - `--expect-evidence logic --field pass` na fase 12 imprime `true`; `--expect-evidence ui --field pass` imprime `false`.
11. `log inexistente não explode` - projeto sem `.plano/governance/approvals.log`: `found === false` e código de saída 0.
12. `última decisão vence` - log com `APPROVE` para a fase 5 seguido de `REQUEST_CHANGES` para a mesma fase: `decision === 'REQUEST_CHANGES'`, preservando a semântica de última entrada que o `tail -1` antigo tinha.

Rodar `node up/bin/lib/gate.test.cjs`, confirmar que FALHA (o subcomando `gate` ainda não existe, então a CLI responde `Unknown command: gate` com código 1) e gravar a saída em `evidencia/001-red.txt`.
</action>
<verify><automated>node up/bin/lib/gate.test.cjs > .plano/fases/16-honestidade-da-prova/evidencia/001-red.txt 2>&1; test -s .plano/fases/16-honestidade-da-prova/evidencia/001-red.txt && grep -qE "FAIL|failed" .plano/fases/16-honestidade-da-prova/evidencia/001-red.txt && echo "RED confirmado"</automated></verify>
<done>Os 12 casos existem, o teste foi executado, falhou, e a saída vermelha está gravada. Nenhuma linha de implementação foi escrita ainda.</done>
</task>

<task id="4" type="auto">
<files>up/bin/lib/gate.cjs (novo)</files>
<action>
Implementar o leitor único. Regra central: localizar campo por CONTEÚDO, nunca por posição fixa de coluna.

Constantes no topo, cada uma com comentário dizendo que é lista fechada.

`DECISION_WORDS`, mapa de palavra crua para `{ canonical, verdict_bearing, forced }`:
`APPROVE`, `APPROVED` e `APPROVE_DELIVERY` para `{ canonical: 'APPROVE', verdict_bearing: true, forced: false }`; `REQUEST_CHANGES` para `{ canonical: 'REQUEST_CHANGES', verdict_bearing: true, forced: false }`; `BLOCK` e `BLOCKED` para `{ canonical: 'BLOCK', verdict_bearing: true, forced: false }`; `FORCED_APPROVAL` para `{ canonical: 'APPROVE', verdict_bearing: true, forced: true }`; `CONFIRMED` para `{ canonical: 'CONFIRMED', verdict_bearing: false, forced: false }`.

`EVIDENCE_TYPE_ALIASES`, que normaliza a gramática documentada E a gravada em disco: `logic`, `test` e `tests` para `logic`; `ui` e `visual` para `ui`; `glue`, `smoke` e `integration` para `glue`; `seams` para `seams`. Tipo desconhecido é preservado em `type_raw` e `type` recebe o valor cru: a leitura não descarta o que não conhece.

`PASS_RESULTS`, conjunto: `pass`, `passed`, `ok`, `test_pass`, `smoke`, `visual`, `red-green`, `redgreen`, `confirmed`, `exempted`.

Funções exportadas:

1. `parseApprovalLine(line, lineNumber)`. Devolve `null` quando a linha não carrega palavra de veredito nenhuma (única razão de descarte). Caso contrário devolve objeto com:
   - `raw`, `line_number`, `fields` (`line.split('|').map(s => s.trim())`).
   - `decision`: canônico do primeiro campo cujo conteúdo inteiro, em maiúscula, casa com `DECISION_WORDS`; se nenhum campo inteiro casar, testar o primeiro token do campo (`campo.split(/\s+/)[0]` sem pontuação final). Guardar também `decision_raw`, `verdict_bearing` e `forced`.
   - `phase`: primeiro número achado em qualquer campo por `/(?:^|[^a-z])(?:phase|fase)\s*[-=:\s]\s*0*(\d{1,3})(?![0-9])/i`, convertido para `Number`; `null` quando não há.
   - `notation`: o trecho exato que casou (`fase=11`, `phase-3`), para o teste provar que as duas notações foram aceitas.
   - `plan`: por `/(?:plan|plano)\s*[-=:\s]\s*0*(\d{1,3})(?![0-9])/i`; `null` quando não há.
   - `scope_kind`: `planning`, `architecture` ou `delivery` quando algum campo inteiro em minúscula é uma dessas palavras; senão `phase` quando há `phase`; senão `null`.
   - `agent`: campo que casa `/^up-[a-z-]+$/`; `null` quando ausente. A ausência NÃO invalida a linha.
   - `evidence`: array de todos os casamentos de `/evidence=([A-Za-z_]+):([A-Za-z0-9_.-]+)/g` na linha inteira, cada item `{ raw, type, type_raw, result, is_pass }`.
   - `timestamp`: primeiro campo que casa `/^\d{4}-\d{2}-\d{2}T/`; `null` quando ausente.

2. `readApprovals({ cwd, logPath })`. Caminho padrão `.plano/governance/approvals.log` relativo a `cwd`. Leitura em try/catch silencioso; arquivo ausente devolve `{ log_path, exists: false, lines_total: 0, entries: [], ignored: [] }` e nunca lança. Ignora linha vazia. Linha que devolve `null` entra em `ignored` como `{ line_number, raw, reason: 'no_verdict_word' }`.

3. `verdictForPhase(read, selector)`, com `selector` sendo `{ phase }` ou `{ scope }`. Casa por `phase` numérica ou por `scope_kind` igual a `selector.scope`. Devolve `found`, `phase` ou `scope`, `entries_matched`, `decision` e `forced` (vindos da ÚLTIMA entrada casada com `verdict_bearing === true`; sem nenhuma, `decision: null`), `decision_line`, `decision_line_number`, `notation`, `agent`, `evidence` (união das evidências de TODAS as entradas casadas, deduplicada por `raw`), `evidence_types` (array único dos `type` normalizados) e `seams_confirmed` (verdadeiro quando alguma evidência tem `type === 'seams'` e `is_pass === true`).

4. `evaluateGate(verdict, { expectEvidence, requireSeams })`. Devolve `{ pass, reasons }`, e cada falha acrescenta um motivo: `no_entry`, `no_decision`, `decision_not_approve`, `evidence_missing`, `evidence_type_mismatch` (quando `expectEvidence` foi passado e `evidence_types` não o contém, comparando pelo alias normalizado) e `seams_missing` (quando `requireSeams` e `seams_confirmed === false`). `pass` é verdadeiro apenas com `reasons` vazio.

Estilo: 2 espaços, ponto e vírgula, aspas simples, `module.exports = { ... }` por objeto literal no fim, zero dependência externa, comentários de seção no formato `// --- Nome ---`.
</action>
<verify><automated>node -e "const g=require('./up/bin/lib/gate.cjs'); const e=g.parseApprovalLine('2026-07-09T03:16:43Z | fase=11 plano=001 | APPROVED | evidence=smoke:pass | motivo',3); if(e.decision!=='APPROVE') throw new Error('decision='+e.decision); if(e.phase!==11) throw new Error('phase='+e.phase); if(e.evidence[0].type!=='glue') throw new Error('type='+e.evidence[0].type); if(g.parseApprovalLine('  \"timestamp\": \"x\"',1)!==null) throw new Error('fragmento deveria ser ignorado'); console.log('gate.cjs ok');"</automated></verify>
<done>O módulo localiza veredito, fase e evidência por conteúdo na linha real de cinco colunas, normaliza `smoke:pass` para `glue` e devolve `null` para o fragmento de JSON. Imprime `gate.cjs ok`.</done>
</task>

<task id="5" type="auto">
<files>up/bin/up-tools.cjs (editar), .plano/fases/16-honestidade-da-prova/evidencia/001-green.txt (novo)</files>
<action>
Expor o leitor na fronteira acordada e fechar o verde.

1. No topo do arquivo, junto dos outros requires de lib, acrescentar `const gate = require('./lib/gate.cjs');`.
2. No bloco de comentário de uso, acrescentar `gate verdict --phase N | --scope planning [--expect-evidence <tipo>] [--require-seams] [--field <campo>]` e `gate entries [--phase N]`.
3. No `switch (command)` do `main()`, antes do `default`, acrescentar `case 'gate': { cmdGate(cwd, args.slice(1), raw); break; }`.
4. Implementar `cmdGate(cwd, args, raw)` em seção própria, com banner `// ==================== GATE ====================`:
   - Subverbo em `args[0]`: `verdict` ou `entries`. Ausente ou desconhecido chama `error('Usage: gate verdict --phase N | gate entries')`.
   - Flags: `--phase <N>`, `--scope <s>`, `--log <caminho>`, `--expect-evidence <tipo>`, `--require-seams`, `--field <campo>`.
   - `entries`: devolve `{ log_path, exists, lines_total, entries, ignored }` de `readApprovals`, filtrando por fase quando `--phase` foi passado.
   - `verdict`: monta `readApprovals`, chama `verdictForPhase` e `evaluateGate`, e devolve o objeto achatado `{ found, phase, scope, decision, forced, agent, notation, evidence, evidence_types, seams_confirmed, entries_matched, line, line_number, ignored_lines, log_path, pass, reasons, checks: { expect_evidence, require_seams } }`.
   - `--field <campo>`: imprime o valor escalar via `output(result, true, valorComoString)`, com array virando lista separada por vírgula e booleano virando `true`/`false`. Campo desconhecido chama `error`.
   - Sem `--field`: `output(result, raw, resumo)`, com resumo `gate: fase=N decision=APPROVE evidence=glue seams=false pass=true`.
   - **Fail-open obrigatório:** log ausente, fase ausente ou zero entradas NÃO são erro de processo. Saem com código 0 e `found: false`, `pass: false`. `error()` fica reservado a uso incorreto da CLI.
5. Rodar o teste da tarefa 3 até ficar todo verde e gravar a saída em `evidencia/001-green.txt`.
6. Rodar `node scripts/run-up-tests.cjs` e `npm test` para confirmar que nada regrediu.
</action>
<verify><automated>node up/bin/lib/gate.test.cjs > .plano/fases/16-honestidade-da-prova/evidencia/001-green.txt 2>&1; grep -q "0 failed" .plano/fases/16-honestidade-da-prova/evidencia/001-green.txt && node scripts/run-up-tests.cjs && npm test</automated></verify>
<done>Os 12 casos passam pela CLI real, `evidencia/001-green.txt` mostra `0 failed`, o corredor do UP sai com código 0 e a suíte do GSD continua verde. O par vermelho e verde está gravado em disco.</done>
</task>

## Critérios de Sucesso

- [ ] `gate verdict --phase 11` acha a entrada, apesar de a linha não ter coluna de agente (ponto de quebra 1)
- [ ] `gate verdict --phase 11` devolve `APPROVE` como veredito, e não a evidência (ponto de quebra 2)
- [ ] `evidence=smoke:pass` e `evidence=test:red-green` são reconhecidas e normalizadas (ponto de quebra 3)
- [ ] O fragmento de JSON do topo é a única coisa descartada, e por falta de palavra de veredito
- [ ] A leitura é fail-open: log ou fase ausente devolve não encontrado com código de saída 0
- [ ] Par vermelho e verde gravado em `evidencia/001-red.txt` e `evidencia/001-green.txt`
- [ ] `npm test` e `npm run test:up` passam

## FORA DE ESCOPO

- **Não mexer no escritor.** O build continua emitindo as seis colunas documentadas. O alvo é a leitura de histórico.
- **Não religar os gates aqui.** Substituir o grep e o awk nos três workflows é o plano 002.
- **Não reescrever linha histórica.** Nada de migração, normalização em disco ou reescrita retroativa do log.
- **Não implementar a validação de fronteiras.** Este plano só reconhece o rótulo `seams` no vocabulário de leitura. Quem valida é o plano 003.
- **Não implementar a heurística anti-tautologia.** É o plano 005.
- **Não criar diretório `up/tests/`.** O teste fica colado ao código, seguindo o precedente único que já existe.
- **Não alterar o script `test` do package.json.** Apenas acrescentar `test:up`.
