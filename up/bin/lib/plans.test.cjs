/**
 * plans.test.cjs - testes red-green de canonicalizacao e inventario de planos.
 * Roda: node up/bin/lib/plans.test.cjs
 * Sem framework. Funcoes sob teste recebem lista de nomes em memoria.
 */
'use strict';

const assert = require('assert');

let plans;
try {
  plans = require('./plans.cjs');
} catch (e) {
  console.error('  FAIL - require plans.cjs\n     ', e.message);
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

// --- Casos do plano 001: inventário e pareamento ---

t('1. rotulo antes do id (fase 11): plano e resumo pareiam', () => {
  const inv = plans.inventoryPhase(['PLAN-001.md', 'SUMMARY-001.md', 'CONTEXT.md'], 11);
  assert.strictEqual(inv.plans.length, 1, 'deve listar 1 plano');
  assert.strictEqual(inv.plans[0].id, '001');
  assert.strictEqual(inv.plans[0].file, 'PLAN-001.md');
  const paired = plans.pairSummaries(inv);
  assert.strictEqual(paired.plans[0].has_summary, true);
  assert.strictEqual(paired.plans[0].summary_file, 'SUMMARY-001.md');
});

t('2. id antes do rotulo sem prefixo (fase 10): plano e resumo pareiam', () => {
  const inv = plans.inventoryPhase(['001-PLAN.md', '001-SUMMARY.md'], 10);
  assert.strictEqual(inv.plans.length, 1);
  assert.strictEqual(inv.plans[0].id, '001');
  const paired = plans.pairSummaries(inv);
  assert.strictEqual(paired.plans[0].has_summary, true);
  assert.strictEqual(paired.plans[0].summary_file, '001-SUMMARY.md');
});

t('3. resumo prefixado pelo numero da fase (fase 3): falso negativo real', () => {
  const inv = plans.inventoryPhase(['001-PLAN.md', '03-001-SUMMARY.md', '03-VERIFICATION.md'], 3);
  assert.strictEqual(inv.plans.length, 1);
  assert.strictEqual(inv.plans[0].id, '001');
  assert.strictEqual(inv.summaries.length, 1);
  assert.strictEqual(inv.summaries[0].id, '001');
  const paired = plans.pairSummaries(inv);
  assert.strictEqual(paired.plans[0].has_summary, true, 'deve parear 03-001-SUMMARY com 001-PLAN');
  assert.strictEqual(paired.plans[0].summary_file, '03-001-SUMMARY.md');
});

t('4. fase mista: um plano em cada convencao, cada um com seu resumo', () => {
  const inv = plans.inventoryPhase([
    '001-PLAN.md',
    '001-SUMMARY.md',
    'PLAN-002.md',
    'SUMMARY-002.md',
  ], 9);
  assert.strictEqual(inv.plans.length, 2);
  const ids = inv.plans.map((p) => p.id).sort();
  assert.deepStrictEqual(ids, ['001', '002']);
  const paired = plans.pairSummaries(inv);
  const byId = Object.fromEntries(paired.plans.map((p) => [p.id, p]));
  assert.strictEqual(byId['001'].has_summary, true);
  assert.strictEqual(byId['002'].has_summary, true);
  assert.strictEqual(byId['001'].summary_file, '001-SUMMARY.md');
  assert.strictEqual(byId['002'].summary_file, 'SUMMARY-002.md');
});

t('5. plano com prefixo do numero da fase (fase 10): canoniza igual ao sem prefixo', () => {
  const a = plans.classifyPlanFile('10-001-PLAN.md', 10);
  const b = plans.classifyPlanFile('001-PLAN.md', 10);
  assert.strictEqual(a.label, 'plan');
  assert.strictEqual(b.label, 'plan');
  assert.strictEqual(a.id, b.id);
  assert.strictEqual(a.id, '001');
});

t('6. plano sem numeracao, so o rotulo: id 001', () => {
  const c = plans.classifyPlanFile('PLAN.md', 5);
  assert.strictEqual(c.label, 'plan');
  assert.strictEqual(c.id, '001');
  const inv = plans.inventoryPhase(['PLAN.md'], 5);
  assert.strictEqual(inv.plans.length, 1);
  assert.strictEqual(inv.plans[0].id, '001');
});

t('7. conflito de identificador: reportado, entradas preservadas', () => {
  const inv = plans.inventoryPhase(['001-PLAN.md', 'PLAN-001.md'], 10);
  assert.strictEqual(inv.plans.length, 2, 'ambos os planos preservados');
  assert.ok(inv.id_conflicts.length >= 1, 'deve reportar conflito');
  const conf = inv.id_conflicts.find((c) => c.id === '001' && c.label === 'plan');
  assert.ok(conf, 'conflito de plan/001');
  assert.strictEqual(conf.files.length, 2);
  assert.ok(conf.files.includes('001-PLAN.md'));
  assert.ok(conf.files.includes('PLAN-001.md'));
});

t('8. verificacao, contexto e pesquisa: fora do inventario', () => {
  const inv = plans.inventoryPhase([
    '001-PLAN.md',
    '17-VERIFICATION.md',
    'CONTEXT.md',
    'RESEARCH.md',
    '10-VERIFICATION.md',
    'REVIEW.md',
  ], 17);
  assert.strictEqual(inv.plans.length, 1);
  assert.strictEqual(inv.summaries.length, 0);
  for (const f of ['17-VERIFICATION.md', 'CONTEXT.md', 'RESEARCH.md', '10-VERIFICATION.md', 'REVIEW.md']) {
    const c = plans.classifyPlanFile(f, 17);
    assert.strictEqual(c.label, 'none', f + ' deve ser none');
  }
});

t('9. resumo sem plano correspondente: orphan_summaries', () => {
  const inv = plans.inventoryPhase(['001-PLAN.md', '002-SUMMARY.md'], 10);
  const paired = plans.pairSummaries(inv);
  assert.strictEqual(paired.plans.length, 1);
  assert.strictEqual(paired.plans[0].has_summary, false);
  assert.ok(Array.isArray(paired.orphan_summaries));
  assert.strictEqual(paired.orphan_summaries.length, 1);
  assert.strictEqual(paired.orphan_summaries[0].id, '002');
  assert.strictEqual(paired.orphan_summaries[0].file, '002-SUMMARY.md');
});

t('10. segmento numerico inicial diferente da fase nao e removido', () => {
  // Em fase 3, "09-002-SUMMARY" nao deve colapsar para 002 so porque comeca com numero
  const c = plans.classifyPlanFile('09-002-SUMMARY.md', 3);
  assert.strictEqual(c.label, 'summary');
  assert.notStrictEqual(c.id, '002', 'nao deve remover 09 quando a fase e 3');
  assert.ok(c.id === '09-002' || c.id.startsWith('09'), 'id preserva o prefixo 09: ' + c.id);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
