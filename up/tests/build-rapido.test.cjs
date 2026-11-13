/**
 * build-rapido.test.cjs: invariantes da fase 23 (v4, build rapido com modelo menor).
 * Roda: node up/tests/build-rapido.test.cjs
 *
 * Trava o que deixou o /up:build rapido: pouca instrucao no caminho padrao, cerimonia em
 * `up-tools build open/close`, executor de uma pagina, SUMMARY curto e build_model no config.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const ler = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bytes = (rel) => fs.statSync(path.join(ROOT, rel)).size;

const CMD = 'up/commands/build.md';
const WF = 'up/workflows/build.md';
const OPTINS = 'up/workflows/build-optins.md';
const EXECUTOR = 'up/agents/up-executor.md';
const SUMMARY = 'up/templates/summary.md';
const REGEX_TRAVESSAO = /[–—]/;

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  -', name); pass++; }
  catch (e) { console.error('  FAIL -', name, '\n     ', e.message); fail++; }
}

t('caminho padrao do build carrega no maximo ~10 KB', () => {
  const total = bytes(CMD) + bytes(WF);
  assert.ok(total <= 10 * 1024, `comando + workflow somam ${total} bytes (alvo <= 10240)`);
});

t('caminho padrao faz so 2 chamadas de cerimonia (build open e build close)', () => {
  const wf = ler(WF);
  const chamadas = wf.match(/up-tools\.cjs"?\s+[a-z-]+/g) || [];
  assert.deepStrictEqual(
    chamadas.map((c) => c.replace(/.*up-tools\.cjs"?\s+/, '')),
    ['build', 'build'],
    'build.md chama o up-tools alem de build open/close: ' + chamadas.join(', ')
  );
  assert.ok(/build open --phase/.test(wf), 'build.md nao usa build open');
  assert.ok(/build close --phase/.test(wf), 'build.md nao usa build close');
});

t('execucao inline nao recarrega executor nem o padrao inteiro', () => {
  const wf = ler(WF);
  assert.ok(!/agents\/up-executor\.md/.test(wf), 'build.md ainda manda ler up-executor.md');
  assert.ok(!/product-engineering\.md/.test(wf), 'build.md ainda manda ler product-engineering.md');
  assert.ok(!/reassessment/i.test(wf), 'reassessment do roadmap voltou ao caminho padrao');
});

t('opt-ins vivem em arquivo proprio, carregado so com a flag', () => {
  const wf = ler(WF);
  const optins = ler(OPTINS);
  assert.ok(/build-optins\.md/.test(wf), 'build.md nao aponta para build-optins.md');
  assert.ok(!/subagent_type="up-verificador"/.test(wf), 'verificador ainda no build.md');
  assert.ok(!/subagent_type="up-revisor"/.test(wf), 'revisor ainda no build.md');
  assert.ok(/subagent_type="up-verificador"/.test(optins) && /subagent_type="up-revisor"/.test(optins), 'build-optins.md perdeu --review');
  assert.ok(/dcrv\.md/.test(optins), 'build-optins.md perdeu --testar');
});

t('build_model: default inherit e o build passa o modelo ao executor', () => {
  const core = ler('up/bin/lib/core.cjs');
  assert.ok(/build_model:\s*'inherit'/.test(core), 'core.cjs sem default build_model inherit');
  assert.ok(/"build_model":\s*"inherit"/.test(ler('up/templates/config.json')), 'template de config sem build_model');
  const wf = ler(WF);
  assert.ok(/build_model/.test(wf) && /model=build_model/.test(wf), 'build.md nao repassa build_model ao executor');
  assert.ok(/build_model/.test(ler(CMD)), 'comando nao documenta build_model');
});

t('executor de uma pagina, com Prova e decisao escalada', () => {
  const ex = ler(EXECUTOR);
  const linhas = ex.split('\n').length;
  assert.ok(linhas <= 70, `up-executor.md tem ${linhas} linhas (alvo ~60)`);
  assert.ok(/## Prova/.test(ex), 'executor nao exige ## Prova');
  assert.ok(/DECISOES ESCALADAS/.test(ex), 'executor perdeu a escalada de decisao');
  assert.ok(/^model: inherit$/m.test(ex), 'executor deve herdar o modelo (build_model decide)');
});

t('SUMMARY curto: Prova obrigatoria, sem checklist longo', () => {
  const s = ler(SUMMARY);
  assert.ok(bytes(SUMMARY) <= 2 * 1024, `template de summary com ${bytes(SUMMARY)} bytes (alvo <= 2 KB)`);
  assert.ok(/## Prova/.test(s), 'template sem ## Prova');
  assert.ok(!/Checklist de completude/.test(s), 'checklist longo voltou ao SUMMARY');
});

t('sem travessao nos arquivos da fase', () => {
  for (const rel of [CMD, WF, OPTINS, EXECUTOR, SUMMARY, 'up/bin/lib/build.cjs', 'up/bin/lib/build.test.cjs']) {
    assert.ok(!REGEX_TRAVESSAO.test(ler(rel)), `"${rel}" contem travessao ou meia-risca`);
  }
});

console.log('');
console.log(fail === 0 ? `PASS ${pass}/${pass}` : `FAIL ${fail}  pass ${pass}`);
process.exit(fail === 0 ? 0 : 1);
