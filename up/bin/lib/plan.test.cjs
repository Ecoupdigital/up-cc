'use strict';
// plan.cjs: avisos de plano concreto (Onde: / comando em Prova:) e `plan close`.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const plan = require('./plan.cjs');

let pass = 0;
let fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ok  - ' + name); }
  catch (e) { fail++; console.log('  FAIL - ' + name + '\n        ' + e.message); }
}

const TOOLS = path.join(__dirname, '..', 'up-tools.cjs');
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();

const CONCRETO = `---
phase: 01-auth
plan: 01-01
type: backend
wave: 1
---

# Fase 1 Plano 01: Login

**Objetivo:** login funciona.

## Entregas

### 1. Login por e-mail

Usuario entra com e-mail e senha.
Onde: \`src/auth/\`, \`src/routes/login.ts\`
Implícitos: erro claro em senha errada.
Prova: \`npm test -- auth\`

### 2. Tela de login

Formulario com os 4 estados.
Onde: \`src/app/login/page.tsx\`
Prova: captura de /login

## Critério de pronto

- login funciona
`;

const ANTIGO = CONCRETO
  .replace(/^Onde:.*\n/gm, '')
  .replace('Prova: `npm test -- auth`', 'Prova: teste automatizado do login');

console.log('plan.test.cjs');

test('plano concreto nao gera aviso', () => {
  assert.deepStrictEqual(plan.deliveryWarnings(CONCRETO), []);
});

test('entrega sem Onde e sem comando de prova gera os dois avisos', () => {
  const w = plan.deliveryWarnings(ANTIGO);
  assert.strictEqual(w.length, 2);
  assert.deepStrictEqual(w[0].missing, ['onde', 'prova_comando']);
  assert.deepStrictEqual(w[1].missing, ['onde'], 'captura de rota conta como prova concreta');
});

test('plano sem entregas ### N. (formato --profundo) nao gera aviso', () => {
  assert.deepStrictEqual(plan.deliveryWarnings('---\ntype: x\n---\n<task>a</task>\n<verification>v</verification>'), []);
});

function projeto() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-plan-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.email', 't@t');
  git(dir, 'config', 'user.name', 't');
  fs.mkdirSync(path.join(dir, '.plano', 'fases', '01-auth'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.plano', 'fases', '02-perfil'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.plano', 'ROADMAP.md'), '### Fase 1: Autenticação\n\n### Fase 2: Perfil\n');
  fs.writeFileSync(path.join(dir, '.plano', 'STATE.md'), '**Projeto**: App Teste\n');
  fs.writeFileSync(path.join(dir, '.plano', 'fases', '01-auth', '01-01-PLAN.md'), CONCRETO);
  fs.writeFileSync(path.join(dir, '.plano', 'fases', '01-auth', '01-01-SUMMARY.md'), 'feito\n');
  fs.writeFileSync(path.join(dir, '.plano', 'fases', '02-perfil', '02-01-PLAN.md'), ANTIGO.replace('wave: 1', 'wave: 2'));
  return dir;
}

test('plan close lista so o plano pendente, com nome da fase e onda, e commita', () => {
  const dir = projeto();
  const out = execFileSync('node', [TOOLS, 'plan', 'close', '--runtime', 'claude-code'], { cwd: dir, encoding: 'utf-8' });
  const res = JSON.parse(out);
  assert.strictEqual(res.ok, true);
  assert.deepStrictEqual(res.phases, ['2']);
  assert.strictEqual(res.plans.length, 1);
  assert.strictEqual(res.plans[0].wave, 2);
  assert.strictEqual(res.plans[0].warnings.length, 2, 'avisos de plano concreto viajam no retorno');
  assert.strictEqual(res.committed, true);
  const ready = fs.readFileSync(path.join(dir, '.plano', 'PLAN-READY.md'), 'utf-8');
  assert.ok(ready.includes('| 2. Perfil | fases/02-perfil/02-01-PLAN.md | 2 |'), ready);
  assert.ok(ready.includes('project_name: "App Teste"'));
  assert.ok(ready.includes('status: ready_for_execution'));
  assert.ok(!ready.includes('01-01-PLAN'), 'plano com SUMMARY fica fora');
  assert.ok(git(dir, 'log', '--oneline', '-1').includes('plan(2)'));
  assert.strictEqual(git(dir, 'status', '--porcelain', '.plano/PLAN-READY.md'), '');
});

test('plan close sem plano pendente sai com erro', () => {
  const dir = projeto();
  fs.writeFileSync(path.join(dir, '.plano', 'fases', '02-perfil', '02-01-SUMMARY.md'), 'feito\n');
  let code = 0;
  let out = '';
  try { execFileSync('node', [TOOLS, 'plan', 'close', '--no-commit'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe' }); }
  catch (e) { code = e.status; out = e.stdout; }
  assert.strictEqual(code, 1);
  assert.strictEqual(JSON.parse(out).reason, 'no_pending_plans');
});

test('validate-plan avisa entrega sem Onde sem reprovar o plano', () => {
  const dir = projeto();
  const out = execFileSync('node', [TOOLS, 'validate-plan', '.plano/fases/02-perfil/02-01-PLAN.md'], { cwd: dir, encoding: 'utf-8' });
  const res = JSON.parse(out);
  assert.strictEqual(res.pass, true, 'plano antigo continua passando');
  assert.strictEqual(res.delivery_warnings.length, 2);
  assert.ok(res.suggestions.some(s => s.includes('`Onde:`')));
  assert.ok(res.suggestions.some(s => s.includes('comando em `Prova:`')));
});

console.log(`\nPASS ${pass}/${pass + fail}`);
if (fail) process.exit(1);
