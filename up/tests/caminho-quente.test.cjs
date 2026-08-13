/**
 * caminho-quente.test.cjs: invariante do recorte de velocidade (grill e GitHub nativo
 * ficam; hard-gate so em projeto/fase nova; rapido e build sem cadeia extra de agentes).
 *
 * Roda: node up/tests/caminho-quente.test.cjs
 * Sem framework, sem rede. Resolve a raiz do repositorio a partir de __dirname.
 *
 * Contrato: falha quando o hard-gate volta a bloquear ajuste/bug, quando /up:rapido
 * volta a spawnar planejador ou DCRV, quando o build default volta a exigir
 * verificador + DCRV + revisor, ou quando o plan default volta a spawnar
 * pesquisador/roteirista/sintetizador como processo obrigatorio.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const SKILL_BRAINSTORM = 'up/skills/up-brainstorm/SKILL.md';
const SKILL_BOOTSTRAP = 'up/skills/usando-up/SKILL.md';
const MOTOR = 'up/skills/up-brainstorm/grill.md';
const RAPIDO = 'up/workflows/rapido.md';
const BUILD = 'up/workflows/build.md';
const PLAN = 'up/workflows/plan.md';
const UP = 'up/workflows/up.md';
const CMD_BUILD = 'up/commands/build.md';
const CMD_RAPIDO = 'up/commands/rapido.md';
const CMD_PLAN = 'up/commands/plan.md';
const GOVERNANCE = 'up/workflows/governance.md';

const ARQUIVOS = [
  SKILL_BRAINSTORM,
  SKILL_BOOTSTRAP,
  MOTOR,
  RAPIDO,
  BUILD,
  PLAN,
  UP,
  CMD_BUILD,
  CMD_RAPIDO,
  CMD_PLAN,
  GOVERNANCE,
];

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

t('hard-gate existe e libera ajuste/bug', () => {
  const skill = ler(SKILL_BRAINSTORM);
  assert.ok(skill.includes('<HARD-GATE>'), 'perdeu a tag <HARD-GATE>');
  assert.ok(/estado terminal/i.test(skill), 'perdeu a secao de estado terminal');
  const gate = skill.slice(skill.indexOf('<HARD-GATE>'), skill.indexOf('</HARD-GATE>'));
  assert.ok(/ajuste/i.test(gate) && /bug/i.test(gate), 'HARD-GATE nao nomeia ajuste/bug');
  assert.ok(
    /implement/i.test(gate),
    'HARD-GATE de ajuste/bug precisa autorizar implementacao'
  );
});

t('bootstrap nao manda ajuste/bug para /up:plan', () => {
  const boot = ler(SKILL_BOOTSTRAP);
  assert.ok(/ajuste/i.test(boot) || /bug/i.test(boot), 'bootstrap nao cita ajuste/bug');
  assert.ok(
    /projeto|fase nova/i.test(boot),
    'bootstrap precisa restringir o plan/build a projeto ou fase nova'
  );
});

t('grill continua como piso e o gate continua', () => {
  const motor = ler(MOTOR);
  assert.ok(/gate continua/i.test(motor), 'motor perdeu "gate continua"');
  const skill = ler(SKILL_BRAINSTORM);
  assert.ok(/grill\.md/.test(skill), 'skill de brainstorm nao aponta para o motor');
  assert.ok(/piso automatico/i.test(skill), 'skill perdeu o piso automatico do grill');
});

t('rapido nao spawna planejador nem DCRV', () => {
  const wf = ler(RAPIDO);
  const cmd = ler(CMD_RAPIDO);
  assert.ok(
    !/subagent_type="up-planejador"/.test(wf),
    'rapido.md ainda spawna up-planejador'
  );
  assert.ok(!/dcrv\.md/i.test(wf), 'rapido.md ainda referencia dcrv.md');
  assert.ok(!/DCRV Light/i.test(wf), 'rapido.md ainda roda DCRV Light');
  assert.ok(
    /Lei de Ferro|prova fresca|verificar-antes/i.test(wf + '\n' + cmd),
    'rapido perdeu a Lei de Ferro'
  );
});

t('build default nao exige DCRV nem revisor two-stage', () => {
  const wf = ler(BUILD);
  const cmd = ler(CMD_BUILD);
  assert.ok(/--review/.test(wf) && /--testar/.test(wf), 'build.md perdeu --review/--testar');
  assert.ok(/--review/.test(cmd) && /--testar/.test(cmd), 'build command perdeu as flags');
  assert.ok(
    /so com --testar|somente com --testar|opt-in|--testar/i.test(wf),
    'build.md nao declara DCRV como opt-in'
  );
  const defaultBlock = wf.match(/Pipeline final por fase[\s\S]{0,400}/);
  assert.ok(defaultBlock, 'build.md perdeu o diagrama do pipeline');
  assert.ok(
    !/up-verificador/.test(defaultBlock[0]) || /--review/.test(defaultBlock[0]),
    'diagrama default ainda coloca up-verificador no caminho quente'
  );
});

t('plan default nao spawna pesquisador, roteirista nem sintetizador', () => {
  const wf = ler(PLAN);
  const cmd = ler(CMD_PLAN);
  assert.ok(
    !/4x `up-pesquisador`|4 `up-pesquisador`|4x up-pesquisador/.test(wf),
    'plan.md ainda manda spawnar 4 pesquisadores'
  );
  assert.ok(
    !/subagent_type="up-sintetizador"/.test(wf),
    'plan.md ainda spawna up-sintetizador'
  );
  assert.ok(
    !/subagent_type="up-roteirista"/.test(wf),
    'plan.md ainda spawna up-roteirista'
  );
  assert.ok(
    /up-arquiteto/.test(wf),
    'plan.md precisa continuar spawnando o arquiteto'
  );
  assert.ok(
    /--review/.test(wf) || /--review/.test(cmd),
    'plan perdeu --review como opt-in da revisao'
  );
});

t('porta unica nao spawna 4 pesquisadores em paralelo', () => {
  const wf = ler(UP);
  assert.ok(
    !/4 `up-pesquisador`|4x `up-pesquisador`/.test(wf),
    'up.md ainda spawna 4 pesquisadores'
  );
});

t('gate aceita prova barata sem exigir up-revisor', () => {
  const gov = ler(GOVERNANCE);
  assert.ok(
    /orquestrador|up-executor/i.test(gov),
    'governance.md precisa aceitar escritor alem do up-revisor'
  );
});

console.log('');
console.log(fail === 0 ? `PASS ${pass}/${pass}` : `FAIL ${fail}  pass ${pass}`);
process.exit(fail === 0 ? 0 : 1);
