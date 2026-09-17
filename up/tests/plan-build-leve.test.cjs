/**
 * plan-build-leve.test.cjs: invariante da fase 22 (plan e build leves, v3.1.0).
 *
 * Roda: node up/tests/plan-build-leve.test.cjs
 * Sem framework, sem rede. Resolve a raiz do repositorio a partir de __dirname.
 *
 * Contrato: falha quando `/up:plan` sem flag volta a spawnar `up-planejador` fora de
 * `--profundo`; quando `--profundo` some da documentacao; quando o template de plano de uma
 * pagina cresce demais ou perde a forma esperada; quando `product-engineering.md` desaparece
 * ou sai do manifesto do executor; quando alguma superficie viva volta a citar
 * `production-requirements`; quando o build volta a spawnar `up-executor` numa onda de 1
 * plano; ou quando `validate-plan`/`phase-plan-index` param de reconhecer o plano de uma
 * pagina real desta fase.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');

const WF_PLAN = 'up/workflows/plan.md';
const CMD_PLAN = 'up/commands/plan.md';
const WF_BUILD = 'up/workflows/build.md';
const CMD_BUILD = 'up/commands/build.md';
const TPL_PLAN = 'up/templates/plan.md';
const TPL_SUMMARY = 'up/templates/summary.md';
const EXECUTOR = 'up/agents/up-executor.md';
const ARQUITETO = 'up/agents/up-arquiteto.md';
const PLANEJADOR = 'up/agents/up-planejador.md';
const PRODUCT_ENG = 'up/references/product-engineering.md';
const UP_TOOLS = 'up/bin/up-tools.cjs';
const INSTALL_JS = 'up/bin/install.js';
const PLAN_22_01 = '.plano/fases/22-plan-build-leve/22-01-PLAN.md';

const SUPERFICIES = ['up/skills', 'up/workflows', 'up/agents', 'up/commands', 'up/templates', 'up/hooks', 'up/references'];
const ARQUIVOS_EXTRA = [UP_TOOLS, INSTALL_JS];

const ARQUIVOS = [WF_PLAN, CMD_PLAN, WF_BUILD, CMD_BUILD, TPL_PLAN, TPL_SUMMARY, EXECUTOR, ARQUITETO, PLANEJADOR, PRODUCT_ENG, UP_TOOLS];

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

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.(md|js|cjs|json)$/.test(ent.name)) out.push(full);
  }
  return out;
}

function rodarTools(args) {
  return execFileSync(process.execPath, [path.join(ROOT, UP_TOOLS), ...args, '--cwd', ROOT], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

const ausentes = ARQUIVOS.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
if (ausentes.length > 0) {
  console.error('ERRO DE EXECUCAO: arquivo critico ausente:');
  for (const a of ausentes) console.error('  -', a);
  process.exit(2);
}

t('plan.md sem flag nao spawna up-planejador (so dentro do bloco --profundo)', () => {
  const wf = ler(WF_PLAN);
  const idxProfundo = wf.indexOf('2.5.b');
  assert.ok(idxProfundo > 0, 'plan.md perdeu o bloco 2.5.b (--profundo)');
  const antesDoProfundo = wf.slice(0, idxProfundo);
  assert.ok(
    !/subagent_type="up-planejador"/.test(antesDoProfundo),
    'plan.md spawna up-planejador fora do bloco --profundo'
  );
  const depoisDoProfundo = wf.slice(idxProfundo);
  assert.ok(
    /subagent_type="up-planejador"/.test(depoisDoProfundo),
    'plan.md nao spawna up-planejador nem dentro do bloco --profundo'
  );
});

t('--profundo existe e documentado no workflow e no comando', () => {
  const wf = ler(WF_PLAN);
  const cmd = ler(CMD_PLAN);
  assert.ok(/--profundo/.test(wf), 'workflow de plan nao documenta --profundo');
  assert.ok(/--profundo/.test(cmd), 'comando de plan nao documenta --profundo');
  assert.ok(/argument-hint:.*--profundo/.test(cmd), 'argument-hint do comando nao lista --profundo');
});

t('template de plano de uma pagina existe, tem a forma esperada e fica pequeno', () => {
  const txt = ler(TPL_PLAN);
  const bytes = Buffer.byteLength(txt, 'utf8');
  assert.ok(bytes <= 8 * 1024, `template de plano ficou grande demais (${bytes} bytes, alvo ~3KB)`);
  for (const marcador of ['phase:', 'plan:', 'wave:', 'depends_on:', 'autonomous:', '## Fora de escopo', '## Entregas', 'Implícitos:', 'Prova:', '## Critério de pronto']) {
    assert.ok(txt.includes(marcador), `template de plano nao contem "${marcador}"`);
  }
  // O corpo do <template> (o que de fato viraria um PLAN.md) nao pode ter o formato pesado antigo.
  // A secao de guidelines pode CITAR o nome do campo antigo pra explicar o que saiu.
  const bloco = txt.slice(txt.indexOf('<template>'), txt.indexOf('</template>'));
  for (const proibido of ['must_haves', 'truths:', 'key_links:', '<task', 'Sonnet-ready']) {
    assert.ok(!bloco.includes(proibido), `corpo do template ainda contem elemento pesado "${proibido}"`);
  }
});

t('product-engineering.md existe, cobre a analise e o DoD, e esta no manifesto do executor', () => {
  const txt = ler(PRODUCT_ENG);
  for (const marcador of ['Antes de codificar', 'Definition of Done', 'Regra de autonomia']) {
    assert.ok(txt.includes(marcador), `product-engineering.md nao contem "${marcador}"`);
  }
  const tools = ler(UP_TOOLS);
  const m = tools.match(/'up-executor':\s*\[([^\]]*)\]/);
  assert.ok(m, 'manifesto do up-executor nao encontrado em up-tools.cjs');
  assert.ok(/product-engineering/.test(m[1]), 'manifesto do up-executor nao lista product-engineering');
  for (const agente of ['up-arquiteto', 'up-sintetizador', 'up-verificador', 'up-revisor', 'up-tester']) {
    const mm = tools.match(new RegExp(`'${agente}':\\s*\\[([^\\]]*)\\]`));
    assert.ok(mm, `manifesto de ${agente} nao encontrado`);
    assert.ok(/product-engineering/.test(mm[1]), `manifesto de ${agente} nao lista product-engineering`);
  }
});

t('executor carrega o padrao completo, honra Implicitos e fecha com checklist de completude', () => {
  const executor = ler(EXECUTOR);
  assert.ok(/product-engineering\.md/.test(executor), 'executor nao referencia product-engineering.md');
  assert.ok(/Implicitos/i.test(executor), 'executor nao honra a linha Implicitos do plano');
  assert.ok(/Checklist de completude/.test(executor), 'executor nao fecha o SUMMARY com checklist de completude');
  const summary = ler(TPL_SUMMARY);
  assert.ok(/Checklist de completude/.test(summary), 'template de summary nao ganhou a secao de checklist');
});

t('nenhuma superficie viva cita production-requirements', () => {
  const arquivos = [];
  for (const rel of SUPERFICIES) walk(path.join(ROOT, rel), arquivos);
  for (const rel of ARQUIVOS_EXTRA) arquivos.push(path.join(ROOT, rel));
  const achados = arquivos.filter((full) => /production-requirements/.test(fs.readFileSync(full, 'utf8')));
  assert.strictEqual(
    achados.length,
    0,
    'referencias a production-requirements ainda vivas:\n       ' + achados.map((f) => path.relative(ROOT, f)).join('\n       ')
  );
  assert.ok(
    !fs.existsSync(path.join(ROOT, 'up/references/production-requirements.md')),
    'production-requirements.md ainda existe'
  );
  assert.ok(
    !fs.existsSync(path.join(ROOT, 'up/references/production-requirements-compressed.md')),
    'production-requirements-compressed.md ainda existe'
  );
});

t('build.md executa onda de 1 plano na sessao, sem spawnar up-executor', () => {
  const wf = ler(WF_BUILD);
  assert.ok(/execucao_inline/.test(wf), 'build.md nao tem o bloco de execucao inline');
  const bloco = wf.slice(wf.indexOf('<execucao_inline>'), wf.indexOf('</execucao_inline>'));
  assert.ok(/sem spawnar|sem overhead de subagente/i.test(bloco), 'bloco de execucao inline nao explica a ausencia de spawn');
  assert.ok(/## Prova/.test(bloco), 'execucao inline nao menciona a secao Prova do SUMMARY');
  // onda de 2+ planos continua spawnando up-executor (nao removemos o caminho paralelo)
  assert.ok(/subagent_type="up-executor"/.test(wf), 'build.md perdeu o spawn de up-executor para onda de 2+ planos');
});

t('validate-plan reconhece o plano de uma pagina real desta fase (22-01)', () => {
  assert.ok(fs.existsSync(path.join(ROOT, PLAN_22_01)), 'plano 22-01 nao existe no disco');
  const out = JSON.parse(rodarTools(['validate-plan', PLAN_22_01]));
  assert.ok(out.has_verification, 'validate-plan nao reconheceu Critério de pronto/Prova como verificacao');
  assert.ok(!out.issues.includes('no_verification_criteria'), 'validate-plan ainda acusa no_verification_criteria no plano 22-01');
  assert.ok(out.tasks > 0, 'validate-plan nao contou nenhuma entrega no plano 22-01');
});

t('phase-plan-index le objetivo e entregas do plano de uma pagina (22-01)', () => {
  const out = JSON.parse(rodarTools(['phase-plan-index', '22-plan-build-leve']));
  const plano = (out.plans || []).find((p) => p.id === '22-01');
  assert.ok(plano, 'phase-plan-index nao encontrou o plano 22-01');
  assert.ok(plano.objective && plano.objective.length > 0, 'phase-plan-index devolveu objetivo nulo para 22-01');
  assert.ok(plano.task_count > 0, 'phase-plan-index devolveu 0 entregas para 22-01');
});

t('limite de fase: regua de contexto sai de plan.md, up-arquiteto.md e up-planejador.md', () => {
  for (const rel of [WF_PLAN, ARQUITETO, PLANEJADOR]) {
    const txt = ler(rel);
    assert.ok(!/completar dentro de ~?70% do contexto/i.test(txt), `${rel} ainda mede fase por 70% do contexto`);
  }
  const arquiteto = ler(ARQUITETO);
  assert.ok(/~5 entregas/.test(arquiteto), 'up-arquiteto.md nao declara o limite de ~5 entregas por fase');
});

console.log('');
console.log(fail === 0 ? `PASS ${pass}/${pass}` : `FAIL ${fail}  pass ${pass}`);
process.exit(fail === 0 ? 0 : 1);
