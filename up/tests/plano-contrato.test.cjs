/**
 * plano-contrato.test.cjs: o planejador escreve contrato, nao implementacao.
 *
 * Roda: node up/tests/plano-contrato.test.cjs
 * Sem framework, sem rede.
 *
 * Contrato: falha quando o planejador, o workflow de plan, o comando ou os
 * templates voltam a exigir receita (imports, SQL, tipos, Sonnet-ready,
 * "implementar sem pensar") em vez de objetivo, entregas e prova.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const PLANEJADOR = 'up/agents/up-planejador.md';
const EXECUTOR = 'up/agents/up-executor.md';
const WF_PLAN = 'up/workflows/plan.md';
const CMD_PLAN = 'up/commands/plan.md';
const TPL_READY = 'up/templates/plan-ready.md';
const TPL_AUDIT = 'up/templates/audit-plan.md';
const TPL_DEFAULTS = 'up/templates/builder-defaults.md';

const ARQUIVOS = [PLANEJADOR, EXECUTOR, WF_PLAN, CMD_PLAN, TPL_READY, TPL_AUDIT, TPL_DEFAULTS];

let pass = 0;
let fail = 0;

function t(name, fn) {
  try {
    fn();
    console.log('  ok  -', name);
    pass++;
  } catch (e) {
    console.error('  FAIL -', name, '\n     ', e.message);
    fail++;
  }
}

function ler(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

const ausentes = ARQUIVOS.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
if (ausentes.length > 0) {
  console.error('ERRO DE EXECUCAO: arquivo critico ausente:');
  for (const a of ausentes) console.error('  -', a);
  process.exit(2);
}

const REGEX_RECEITA = /MODO ULTRA-DETALHADO|imports exatos|implementar SEM pensar|SQL\/migrations literais|Score medio Sonnet-ready|nivel maximo de detalhe/i;

t('planejador nao exige receita de implementacao', () => {
  const txt = ler(PLANEJADOR);
  const achado = txt.match(REGEX_RECEITA);
  assert.ok(!achado, `planejador ainda exige receita: "${achado ? achado[0] : ''}"`);
  assert.ok(
    !/import \{ z \} from 'zod'/.test(txt),
    'planejador ainda ensina import literal como exemplo obrigatorio'
  );
});

t('planejador descreve contrato (objetivo, entrega, prova, fora de escopo)', () => {
  const txt = ler(PLANEJADOR);
  assert.ok(/contrato/i.test(txt), 'planejador nao fala em contrato');
  assert.ok(/fora de escopo/i.test(txt), 'planejador nao pede fora de escopo');
  assert.ok(/prova|verdade observ/i.test(txt), 'planejador nao pede prova ou verdade observavel');
  assert.ok(
    /nao escrever a implementacao|nao e receita|o executor (le|decide)|o como e do executor/i.test(txt),
    'planejador nao declara que o como e do executor'
  );
});

t('workflow e comando de plan nao exigem Sonnet-ready nem detalhe maximo', () => {
  for (const rel of [WF_PLAN, CMD_PLAN]) {
    const txt = ler(rel);
    assert.ok(!/Sonnet-ready/i.test(txt), `${rel} ainda cita Sonnet-ready`);
    assert.ok(
      !/nivel maximo de detalhe/i.test(txt),
      `${rel} ainda exige nivel maximo de detalhe`
    );
  }
});

t('templates nao pontuam plano por import, tipo ou SQL', () => {
  const ready = ler(TPL_READY);
  const audit = ler(TPL_AUDIT);
  const defaults = ler(TPL_DEFAULTS);
  assert.ok(!/Sonnet-ready/i.test(ready), 'plan-ready ainda fala Sonnet-ready');
  assert.ok(!/Sonnet-ready/i.test(defaults), 'builder-defaults ainda fala Sonnet-ready');
  assert.ok(!/Score medio Sonnet-ready/i.test(audit), 'audit-plan ainda tem score Sonnet-ready');
  assert.ok(
    !/^\| Plan \| Imports \| Tipos \| Endpoints \| SQL/m.test(audit),
    'audit-plan ainda tem tabela de imports/tipos/SQL'
  );
});

t('executor trata o plano como contrato, nao como receita', () => {
  const txt = ler(EXECUTOR);
  assert.ok(
    /contrato/i.test(txt) && /como e seu|implementacao e sua|nao e receita/i.test(txt),
    'executor nao declara que o plano e contrato e o como e dele'
  );
});

console.log('');
console.log(fail === 0 ? `PASS ${pass}/${pass}` : `FAIL ${fail}  pass ${pass}`);
process.exit(fail === 0 ? 0 : 1);
