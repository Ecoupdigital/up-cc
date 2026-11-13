/**
 * build.test.cjs: testes do build.cjs (build open / build close, fase 23).
 * Roda: node up/bin/lib/build.test.cjs
 * Sem framework. Repos git temporarios, sem remote (fail-open: merge local).
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const build = require('./build.cjs');

process.env.GIT_TERMINAL_PROMPT = '0';

function sh(cmd, cwd) { return execSync(cmd, { cwd, stdio: 'pipe' }).toString(); }

const PLAN = `---
phase: 01-demo
plan: 01-01
type: backend
wave: 1
---

# Fase 1 Plano 01: Demo

**Objetivo:** demo.

## Entregas

### 1. Coisa
Onde: src/x.js
Prova: teste.

## Critério de pronto

- feito.
`;

const ROADMAP = `# Roadmap

- [ ] **Fase 1: Demo** - demo

### Fase 1: Demo
**Objetivo**: Entregar a demo.

## Tabela de Progresso

| Fase | Planos | Status | Data |
|------|--------|--------|------|
| 1. Demo | 0/1 | Planejada | - |
`;

const STATE = `# Estado

**Status**: Fase 1 planejada
`;

/** Repo com .plano/ de uma fase de 1 plano. pkg = scripts do package.json (opcional). */
function mkProject({ config = {}, pkg = null } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-build-'));
  sh('git init -q', dir);
  sh('git config user.email t@t.co', dir);
  sh('git config user.name t', dir);
  sh('git config commit.gpgsign false', dir);
  fs.mkdirSync(path.join(dir, '.plano', 'fases', '01-demo'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.gitignore'), '.plano/runtime/\n.plano/git-map.json\n');
  fs.writeFileSync(path.join(dir, '.plano', 'ROADMAP.md'), ROADMAP);
  fs.writeFileSync(path.join(dir, '.plano', 'STATE.md'), STATE);
  fs.writeFileSync(path.join(dir, '.plano', 'config.json'), JSON.stringify(config));
  fs.writeFileSync(path.join(dir, '.plano', 'fases', '01-demo', '01-01-PLAN.md'), PLAN);
  if (pkg) fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'demo', scripts: pkg }));
  sh('git add -A', dir);
  sh('git commit -qm init', dir);
  sh('git branch -M main', dir);
  return dir;
}

function writeSummary(root, withProva = true) {
  const body = withProva ? '# S\n\n## Prova\n\n| 1 | teste | `x` | ok |\n' : '# S\n\nsem prova\n';
  fs.writeFileSync(path.join(root, '.plano', 'fases', '01-demo', '01-01-SUMMARY.md'), body);
  sh('git add -A', root);
  sh('git commit -qm "docs: summary"', root);
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  -', name); pass++; }
  catch (e) { console.error('  FAIL -', name, '\n     ', e.message); fail++; }
}

// --- open ---

t('open --local: ondas, build_model default e lock', () => {
  const dir = mkProject();
  const r = build.openPhase({ cwd: dir, phase: '1', local: true });
  assert.strictEqual(r.mode, 'local');
  assert.strictEqual(r.worktree, null);
  assert.strictEqual(r.build_model, 'inherit');
  assert.strictEqual(r.goal, 'Entregar a demo.');
  assert.deepStrictEqual(r.pending_plans, ['01-01']);
  assert.strictEqual(r.waves.length, 1);
  assert.strictEqual(r.waves[0].plans[0].plan, '.plano/fases/01-demo/01-01-PLAN.md');
  assert.ok(fs.existsSync(path.join(dir, '.plano', 'runtime', 'build.lock.json')), 'lock nao escrito');
});

t('open: plano pouco concreto abre igual, com aviso', () => {
  const dir = mkProject(); // fixture: "Prova: teste." sem comando
  const r = build.openPhase({ cwd: dir, phase: '1', local: true });
  assert.deepStrictEqual(r.pending_plans, ['01-01']);
  assert.ok(r.warnings.some(w => /01-01 pouco concreto/.test(w)), r.warnings.join(' | '));
});

t('open: build_model vem do config', () => {
  const dir = mkProject({ config: { build_model: 'sonnet' } });
  const r = build.openPhase({ cwd: dir, phase: '1', local: true });
  assert.strictEqual(r.build_model, 'sonnet');
});

t('open github-nativo sem remote: worktree com os planos', () => {
  const dir = mkProject();
  const r = build.openPhase({ cwd: dir, phase: '1' });
  assert.ok(r.worktree && fs.existsSync(r.worktree), 'worktree deve existir');
  assert.strictEqual(r.root, r.worktree);
  assert.ok(fs.existsSync(path.join(r.worktree, r.waves[0].plans[0].plan)), 'plano nao existe na worktree');
});

t('open de novo na mesma fase: retoma o lock', () => {
  const dir = mkProject();
  const a = build.openPhase({ cwd: dir, phase: '1' });
  const b = build.openPhase({ cwd: dir, phase: '1' });
  assert.strictEqual(b.resumed, true);
  assert.strictEqual(b.worktree, a.worktree);
});

// --- close ---

t('close sem SUMMARY: erro de summary, sem merge', () => {
  const dir = mkProject();
  build.openPhase({ cwd: dir, phase: '1', local: true });
  const r = build.closePhase({ cwd: dir, phase: '1', land: 'local' });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.stage, 'summary');
  assert.deepStrictEqual(r.missing_summary, ['01-01']);
});

t('close com SUMMARY sem ## Prova: erro', () => {
  const dir = mkProject();
  build.openPhase({ cwd: dir, phase: '1', local: true });
  writeSummary(dir, false);
  const r = build.closePhase({ cwd: dir, phase: '1', land: 'local' });
  assert.strictEqual(r.ok, false);
  assert.deepStrictEqual(r.missing_prova, ['01-01']);
});

t('close com verify-static falhando: nao mergeia', () => {
  const dir = mkProject({ pkg: { test: 'exit 1' } });
  const o = build.openPhase({ cwd: dir, phase: '1' });
  writeSummary(o.worktree);
  const r = build.closePhase({ cwd: dir, phase: '1', land: 'merge' });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.stage, 'verify');
  assert.ok(fs.existsSync(o.worktree), 'worktree nao pode sumir quando a prova falha');
  assert.ok(!fs.readFileSync(path.join(dir, '.plano', 'ROADMAP.md'), 'utf8').includes('[x]'), 'main nao pode receber a fase');
});

t('close --land local: STATE e ROADMAP marcados, lock limpo', () => {
  const dir = mkProject({ pkg: { test: 'exit 0' } });
  build.openPhase({ cwd: dir, phase: '1', local: true });
  writeSummary(dir);
  const r = build.closePhase({ cwd: dir, phase: '1', land: 'local' });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(r.verify, 'pass');
  const roadmap = fs.readFileSync(path.join(dir, '.plano', 'ROADMAP.md'), 'utf8');
  assert.ok(/- \[x\] \*\*Fase 1: Demo\*\*/.test(roadmap), 'checkbox nao marcado');
  assert.ok(/\| 1\. Demo \| 1\/1 \| Completa \|/.test(roadmap), 'tabela de progresso nao atualizada');
  assert.ok(/\*\*Status\*\*: Fase 1 completa/.test(fs.readFileSync(path.join(dir, '.plano', 'STATE.md'), 'utf8')));
  assert.ok(!fs.existsSync(path.join(dir, '.plano', 'runtime', 'build.lock.json')), 'lock nao limpo');
  assert.strictEqual(sh('git status --porcelain -- .plano/ROADMAP.md .plano/STATE.md', dir).trim(), '', 'STATE/ROADMAP nao commitados');
});

t('close --land merge sem remote: merge local na main e worktree removida', () => {
  const dir = mkProject();
  const o = build.openPhase({ cwd: dir, phase: '1' });
  writeSummary(o.worktree);
  const r = build.closePhase({ cwd: dir, phase: '1', land: 'merge' });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(r.action, 'merged');
  assert.ok(!fs.existsSync(o.worktree), 'worktree deveria ter sido removida');
  const roadmap = fs.readFileSync(path.join(dir, '.plano', 'ROADMAP.md'), 'utf8');
  assert.ok(/- \[x\] \*\*Fase 1/.test(roadmap), 'main nao recebeu a fase completa');
  assert.ok(fs.existsSync(path.join(dir, '.plano', 'fases', '01-demo', '01-01-SUMMARY.md')), 'SUMMARY nao chegou na main');
});

t('close --land discard: remove worktree sem exigir prova', () => {
  const dir = mkProject();
  const o = build.openPhase({ cwd: dir, phase: '1' });
  const r = build.closePhase({ cwd: dir, phase: '1', land: 'discard' });
  assert.strictEqual(r.ok, true);
  assert.ok(!fs.existsSync(o.worktree), 'worktree deveria ter sido removida');
});

t('close --land invalido: lanca erro', () => {
  const dir = mkProject();
  assert.throws(() => build.closePhase({ cwd: dir, phase: '1', land: 'xyz' }), /--land invalido/);
});

// --- verify-static ---

t('verify-static: sem lockfile o audit e pulado, nao falha', () => {
  const dir = mkProject({ pkg: {} });
  const v = build.runVerifyStatic(dir);
  const audit = v.checks.find(c => c.name === 'audit');
  assert.strictEqual(audit.status, 'skip');
  assert.notStrictEqual(v.overall, 'fail');
});

console.log(`\nbuild.test: ${pass} ok, ${fail} falhas`);
process.exit(fail === 0 ? 0 : 1);
