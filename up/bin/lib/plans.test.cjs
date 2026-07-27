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

// --- Casos do plano 002: fronteira e grafo ---

function mkPlan(id, opts = {}) {
  return {
    id,
    file: `${id}-PLAN.md`,
    wave: opts.wave !== undefined ? opts.wave : 1,
    depends_on: opts.depends_on,
    declared_edges: opts.declared_edges,
  };
}

function runFrontier(planDefs, summaryIds, failed) {
  assert.ok(typeof plans.deriveFrontier === 'function', 'deriveFrontier deve existir');
  const inv = {
    plans: planDefs.map((p) => ({ id: p.id, file: p.file })),
    summaries: (summaryIds || []).map((id) => ({ id, file: `${id}-SUMMARY.md` })),
    id_conflicts: [],
  };
  const pairing = plans.pairSummaries(inv);
  // Anexar edges normalizadas
  const phaseNumber = 17;
  const plansWithEdges = planDefs.map((p) => {
    const n = plans.normalizeEdges(p, inv, phaseNumber);
    return {
      ...p,
      edges: n.edges,
      dangling: n.dangling,
      declared: n.declared,
    };
  });
  return plans.deriveFrontier({
    plans: plansWithEdges,
    pairing,
    failed: failed || [],
  });
}

t('F1. cadeia linear: um por vez na ordem', () => {
  const defs = [
    mkPlan('001', { depends_on: [] }),
    mkPlan('002', { depends_on: ['001'] }),
    mkPlan('003', { depends_on: ['002'] }),
  ];
  const r1 = runFrontier(defs, [], []);
  assert.deepStrictEqual(r1.frontier.map((x) => x.id || x), ['001']);
  const r2 = runFrontier(defs, ['001'], []);
  assert.deepStrictEqual(r2.frontier.map((x) => x.id || x), ['002']);
  const r3 = runFrontier(defs, ['001', '002'], []);
  assert.deepStrictEqual(r3.frontier.map((x) => x.id || x), ['003']);
});

t('F2. leque: tres com dependencia vazia na fronteira', () => {
  const defs = [
    mkPlan('001', { depends_on: [] }),
    mkPlan('002', { depends_on: [] }),
    mkPlan('003', { depends_on: [] }),
  ];
  const r = runFrontier(defs, [], []);
  assert.strictEqual(r.ordering_mode, 'aresta');
  assert.strictEqual(r.frontier.length, 3);
});

t('F3. plano que falha: independente segue; dependentes bloqueados', () => {
  const defs = [
    mkPlan('001', { depends_on: [] }),
    mkPlan('002', { depends_on: ['001'] }),
    mkPlan('003', { depends_on: ['001'] }),
    mkPlan('004', { depends_on: [] }),
  ];
  const r = runFrontier(defs, [], ['001']);
  const fIds = r.frontier.map((x) => x.id || x).sort();
  assert.deepStrictEqual(fIds, ['004']);
  assert.ok(r.blocked.some((b) => (b.id || b) === '002' || (b.id === '002')));
  assert.ok(r.blocked.some((b) => (b.id || b) === '003' || (b.id === '003')));
  assert.strictEqual(r.exhausted, false);
});

t('F4. retomada: com resumo do primeiro, fronteira no segundo', () => {
  const defs = [
    mkPlan('001', { depends_on: [] }),
    mkPlan('002', { depends_on: ['001'] }),
    mkPlan('003', { depends_on: ['002'] }),
  ];
  const r = runFrontier(defs, ['001'], []);
  assert.deepStrictEqual(r.frontier.map((x) => x.id || x), ['002']);
});

t('F5. sem aresta: modo onda, menor onda com pendencia', () => {
  const defs = [
    mkPlan('001', { wave: 1 }),
    mkPlan('002', { wave: 1 }),
    mkPlan('003', { wave: 2 }),
  ];
  // depends_on ausente (undefined) = sem aresta declarada
  const r = runFrontier(defs, [], []);
  assert.strictEqual(r.ordering_mode, 'onda');
  assert.strictEqual(r.frontier.length, 2);
  const ids = r.frontier.map((x) => x.id || x).sort();
  assert.deepStrictEqual(ids, ['001', '002']);
  // derived_wave igual a declarada no modo onda
  assert.ok(r.derived_waves);
});

t('F6. modo misto: sem aresta em onda posterior so entra depois', () => {
  const defs = [
    mkPlan('001', { depends_on: [], wave: 1 }),
    mkPlan('002', { depends_on: ['001'], wave: 1 }),
    mkPlan('003', { wave: 2 }), // sem depends_on
  ];
  const r = runFrontier(defs, [], []);
  assert.strictEqual(r.ordering_mode, 'misto');
  const fIds = r.frontier.map((x) => x.id || x).sort();
  assert.ok(fIds.includes('001'));
  assert.ok(!fIds.includes('003'), '003 so depois das ondas anteriores');
  const r2 = runFrontier(defs, ['001', '002'], []);
  assert.ok(r2.frontier.map((x) => x.id || x).includes('003'));
});

t('F7. ciclo: fronteira vazia, ciclo reportado, nao esgotada', () => {
  const defs = [
    mkPlan('001', { depends_on: ['002'] }),
    mkPlan('002', { depends_on: ['001'] }),
  ];
  const r = runFrontier(defs, [], []);
  assert.strictEqual(r.frontier.length, 0);
  assert.ok(r.cycle && r.cycle.length >= 2);
  assert.strictEqual(r.exhausted, false);
});

t('F8. aresta pendente: nao bloqueia, entra em dangling', () => {
  const defs = [
    mkPlan('001', { depends_on: ['999'] }),
  ];
  const r = runFrontier(defs, [], []);
  assert.ok(r.frontier.map((x) => x.id || x).includes('001'));
  assert.ok((r.dangling_edges || []).length >= 1);
});

t('F9. aresta composta com numero da fase resolve', () => {
  const defs = [
    mkPlan('001', { depends_on: [] }),
    mkPlan('002', { depends_on: ['17-001'] }),
  ];
  const r = runFrontier(defs, [], []);
  // 002 bloqueado por 001
  assert.deepStrictEqual(r.frontier.map((x) => x.id || x), ['001']);
  const r2 = runFrontier(defs, ['001'], []);
  assert.deepStrictEqual(r2.frontier.map((x) => x.id || x), ['002']);
});

t('F10. autoaresta: descartada como pendente, nao trava', () => {
  const defs = [
    mkPlan('001', { depends_on: ['001'] }),
  ];
  const r = runFrontier(defs, [], []);
  assert.ok(r.frontier.map((x) => x.id || x).includes('001'));
  assert.ok((r.dangling_edges || []).length >= 1);
});

t('F11. fase esgotada: todos com resumo', () => {
  const defs = [
    mkPlan('001', { depends_on: [] }),
    mkPlan('002', { depends_on: ['001'] }),
  ];
  const r = runFrontier(defs, ['001', '002'], []);
  assert.strictEqual(r.frontier.length, 0);
  assert.strictEqual(r.exhausted, true);
  assert.ok(!r.cycle || r.cycle.length === 0);
});

t('F12. onda zero preservada: so os de wave 0 na primeira fronteira', () => {
  const defs = [
    mkPlan('001', { wave: 0 }),
    mkPlan('002', { wave: 0 }),
    mkPlan('003', { wave: 1 }),
  ];
  const r = runFrontier(defs, [], []);
  assert.strictEqual(r.ordering_mode, 'onda');
  const ids = r.frontier.map((x) => x.id || x).sort();
  assert.deepStrictEqual(ids, ['001', '002']);
  assert.ok(!ids.includes('003'));
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
