'use strict';
// Invariantes da fase 24 (v4): plano concreto, /up:plan enxuto, /up:auto e corte.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const UP = path.join(__dirname, '..');
const ROOT = path.join(UP, '..');
const ler = (rel) => fs.readFileSync(path.join(UP, rel), 'utf-8');
const bytes = (rel) => Buffer.byteLength(ler(rel), 'utf-8');

let pass = 0;
let fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok  - ' + name); }
  catch (e) { fail++; console.log('  FAIL - ' + name + '\n        ' + e.message); }
}

console.log('plano-concreto.test.cjs');

t('/up:plan padrao carrega <= 12 KB (comando + workflow + template de plano)', () => {
  const total = bytes('commands/plan.md') + bytes('workflows/plan.md') + bytes('templates/plan.md');
  assert.ok(total <= 12 * 1024, `carrega ${total} bytes`);
});

t('comando de plan so referencia o workflow padrao (onboarding e audit-plan sob demanda)', () => {
  const ctx = ler('commands/plan.md').match(/<execution_context>([\s\S]*?)<\/execution_context>/)[1];
  const refs = ctx.match(/@\S+/g) || [];
  assert.deepStrictEqual(refs, ['@~/.claude/up/workflows/plan.md']);
});

t('workflow padrao fecha com plan close e nao escreve PLAN-READY a mao', () => {
  const wf = ler('workflows/plan.md');
  assert.ok(/up-tools\.cjs" plan close/.test(wf));
  assert.ok(!/templates\/plan-ready\.md/.test(wf), 'workflow ainda manda preencher o template de PLAN-READY');
  assert.ok(!/resolve-model/.test(wf), 'resolve-model voltou ao plan');
});

t('template de plano exige Onde e Prova com comando', () => {
  const tpl = ler('templates/plan.md');
  assert.ok(/^Onde: /m.test(tpl));
  assert.ok(/^Prova: \[comando exato/m.test(tpl));
});

t('/up:auto existe, encadeia plan e build --solo e para em verify-static', () => {
  const cmd = ler('commands/auto.md');
  const wf = ler('workflows/auto.md');
  assert.ok(/name: up:auto/.test(cmd));
  assert.ok(/workflows\/plan\.md/.test(wf) && /build\.md/.test(wf));
  assert.ok(/--solo/.test(wf));
  assert.ok(/verify-static|stage.*verify/.test(wf));
});

t('instalador conhece /up:auto nos quatro runtimes', () => {
  const inst = ler('bin/install.js');
  assert.ok(/UP_COMMAND_SKILLS = \[[^\]]*'up-auto'/.test(inst), 'falta up-auto em UP_COMMAND_SKILLS');
  assert.ok(/cmd \+ 'auto, '/.test(inst), 'bootstrap dos runtimes nao cita o auto');
});

t('agentes cortados nao existem nem sao citados', () => {
  const cortados = ['up-pesquisador', 'up-sintetizador', 'up-roteirista'];
  for (const a of cortados) assert.ok(!fs.existsSync(path.join(UP, 'agents', a + '.md')), a + ' ainda existe');
  const alvos = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) { if (f.name !== 'node_modules') walk(full); }
      else if (/\.(md|cjs|js|json)$/.test(f.name) && f.name !== 'CHANGELOG.md' && full !== __filename) alvos.push(full);
    }
  };
  walk(UP);
  for (const extra of ['CLAUDE.md', 'README.md']) if (fs.existsSync(path.join(ROOT, extra))) alvos.push(path.join(ROOT, extra));
  const sobras = [];
  for (const f of alvos) {
    const txt = fs.readFileSync(f, 'utf-8');
    for (const a of cortados) if (txt.includes(a)) sobras.push(path.relative(ROOT, f) + ': ' + a);
  }
  assert.deepStrictEqual(sobras, []);
});

t('verbos legados sairam do up-tools', () => {
  const tools = ler('bin/up-tools.cjs');
  for (const v of ['executar-fase', 'novo-projeto', 'retomar', 'progresso', 'verificar-trabalho', 'melhorias', 'ideias', 'iniciar']) {
    assert.ok(!new RegExp(`case '${v}'`).test(tools), `init ${v} ainda existe`);
  }
  for (const v of ['budget', 'resolve-model-for-plan', 'routing-log', 'analyze-routing']) {
    assert.ok(!new RegExp(`case '${v}'`).test(tools), `${v} ainda existe`);
  }
});

t('sem travessao nos arquivos desta fase', () => {
  const arquivos = ['workflows/plan.md', 'workflows/plan-profundo.md', 'commands/plan.md', 'templates/plan.md',
    'commands/auto.md', 'workflows/auto.md', 'bin/lib/plan.cjs'];
  for (const a of arquivos) assert.ok(!/[\u2013\u2014]/.test(ler(a)), a + ' tem travessao');
});

console.log(`\nPASS ${pass}/${pass + fail}`);
if (fail) process.exit(1);
