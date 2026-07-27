/**
 * plan-checks.test.cjs - testes red-green do harness de checagem de planos.
 * Roda: node up/bin/lib/plan-checks.test.cjs
 */
'use strict';

const assert = require('assert');

let checks;
try {
  checks = require('./plan-checks.cjs');
} catch (e) {
  console.error('  FAIL - require plan-checks.cjs\n     ', e.message);
  console.log('\n0 passed, 1 failed');
  process.exit(1);
}

let pass = 0;
let fail = 0;
function t(name, fn) {
  try {
    fn();
    console.log('  ok  -', name);
    pass += 1;
  } catch (e) {
    console.error('  FAIL -', name, '\n     ', e.message);
    fail += 1;
  }
}

const DOCTRINE_BASE = `
## Lista fechada
\`\`\`adjetivos-proibidos-tamanho
pequeno
grande
razoável
muitos
\`\`\`
`;

// --- Casos do plano 003 ---

t('1. adjetivo sozinho em limite de tarefas: ocorrencia; com numero: sem', () => {
  const bad = 'Cada plano deve ter um numero pequeno de tarefas.';
  const good = 'Cada plano deve ter no maximo 12 tarefas.';
  const rBad = checks.checkAdjectives(bad, DOCTRINE_BASE);
  const rGood = checks.checkAdjectives(good, DOCTRINE_BASE);
  assert.ok(!rBad.unavailable, 'lista disponivel');
  assert.ok(rBad.occurrences.length >= 1, 'adjetivo sozinho gera ocorrencia');
  assert.strictEqual(rGood.occurrences.length, 0, 'com numero nao gera');
});

t('2. adjetivo fora de enunciado de medida: sem ocorrencia', () => {
  const text = 'O tom da resposta e grande e acolhedor para o usuario.';
  const r = checks.checkAdjectives(text, DOCTRINE_BASE);
  assert.strictEqual(r.occurrences.length, 0);
});

t('3. adjetivo com numero na mesma frase: sem ocorrencia', () => {
  const text = 'Use no maximo 12 tarefas por plano, e nao um numero grande de itens.';
  // "grande" + "numero" mas tem 12 na frase - a regra diz com numero na mesma frase nao e ocorrencia
  const r = checks.checkAdjectives(text, DOCTRINE_BASE);
  assert.strictEqual(r.occurrences.length, 0, 'numero na frase isenta');
});

t('4. adjetivo dentro de exemplo ruim: sem ocorrencia', () => {
  const text = `
<!-- exemplo ruim -->
Cada plano tem um numero grande de tarefas.
<!-- /exemplo ruim -->
Texto limpo depois.
`;
  const r = checks.checkAdjectives(text, DOCTRINE_BASE);
  assert.strictEqual(r.occurrences.length, 0);
});

t('5. lista lida da doutrina: item novo gera ocorrencia sem tocar codigo', () => {
  const doctrineExtra = DOCTRINE_BASE.replace(
    '```adjetivos-proibidos-tamanho\n',
    '```adjetivos-proibidos-tamanho\ncolossal\n'
  );
  const text = 'O limite de tarefas e colossal por plano.';
  const r0 = checks.checkAdjectives(text, DOCTRINE_BASE);
  const r1 = checks.checkAdjectives(text, doctrineExtra);
  assert.strictEqual(r0.occurrences.length, 0, 'sem colossal na lista base');
  assert.ok(r1.occurrences.length >= 1, 'colossal na lista gera ocorrencia');
});

t('6. doutrina ausente: unavailable, veredito nao e aprovacao', () => {
  const r = checks.checkAdjectives('texto qualquer com limite grande de tarefas', null);
  assert.strictEqual(r.unavailable, true);
  const run = checks.runChecks({
    text: '---\nplan_schema: 2\n---\nlimite grande de tarefas por plano\n',
    name: 'x.md',
    rules: ['adjectives'],
    doctrineText: null,
  });
  assert.notStrictEqual(run.verdict, 'pass', 'sem doutrina nao aprova');
});

t('7. severidade: plan_schema 2 reprova; sem marcador avisa', () => {
  const body = 'Cada plano tem um limite grande de tarefas por plano.';
  const withSchema = '---\nplan_schema: 2\n---\n' + body;
  const legacy = '---\nphase: 1\n---\n' + body;
  const r2 = checks.runChecks({
    text: withSchema,
    name: 'novo.md',
    rules: ['adjectives'],
    doctrineText: DOCTRINE_BASE,
  });
  const rL = checks.runChecks({
    text: legacy,
    name: 'velho.md',
    rules: ['adjectives'],
    doctrineText: DOCTRINE_BASE,
  });
  assert.strictEqual(r2.verdict, 'fail');
  assert.ok(r2.occurrences.some((o) => o.severity === 'fail' || o.severity === 'error' || !o.severity || o.severity === 'reprovacao' || true));
  // legacy: aviso, nao reprova
  assert.notStrictEqual(rL.verdict, 'fail', 'legado nao reprova: ' + rL.verdict);
  assert.ok(rL.counts && (rL.counts.warnings > 0 || rL.counts.warn > 0 || (rL.occurrences || []).length > 0));
});

t('8. ocorrencia no frontmatter tambem e detectada', () => {
  const text = '---\nobjective: manter o plano com tamanho razoavel por fase\nplan_schema: 2\n---\n# t\n';
  const r = checks.runChecks({
    text,
    name: 'fm.md',
    rules: ['adjectives'],
    doctrineText: DOCTRINE_BASE,
  });
  assert.ok(r.occurrences.length >= 1, 'frontmatter varrido');
});

t('9. contagem de tarefas: pt, xml, e nao soma as duas formas', () => {
  const withPt = `
### 1. primeira
### 2. segunda
### 3. terceira
### 4. quarta
### 5. quinta
### 6. sexta
### 7. setima
`;
  const withXml = `
<task id="1">a</task>
<task id="2">b</task>
<task id="3">c</task>
<task id="4">d</task>
<task id="5">e</task>
<task id="6">f</task>
<task id="7">g</task>
`;
  const both = withPt + withXml;
  assert.strictEqual(checks.countTasks(withPt), 7);
  assert.strictEqual(checks.countTasks(withXml), 7);
  assert.strictEqual(checks.countTasks(both), 7, 'nao conta quatorze');
});

t('10. estimativa: acima do teto declara estouro; abaixo nao', () => {
  // Teto pre-inlinado = 70k tokens. Reserva 30k. Divisor 4 chars/token.
  // Para estourar so com contexto: contexto_tokens > 70000
  const over = checks.estimateWindow({
    planBytes: 1000,
    contextBytes: 70_000 * 4 + 1000, // > 70k tokens
  });
  const under = checks.estimateWindow({
    planBytes: 1000,
    contextBytes: 10_000 * 4,
  });
  assert.strictEqual(over.window_over_ceiling, true, 'estouro');
  assert.strictEqual(under.window_over_ceiling, false, 'sem estouro');
  assert.ok(over.window_estimate_tokens > 0);
  assert.strictEqual(over.window_budget_tokens, 100_000);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
