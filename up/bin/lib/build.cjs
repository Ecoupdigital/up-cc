/**
 * build.cjs: a cerimonia do /up:build em dois verbos (fase 23, v4).
 *
 *   build open  --phase N [--local] [--solo]
 *   build close --phase N [--land merge|keep|discard|local] [--board] [--skip-verify]
 *
 * O modelo so programa. Abrir a fase (modo, lock, worktree, ondas, contexto) e fechar
 * (verify-static, SUMMARYs, STATE/ROADMAP, merge) sao deterministas e vivem aqui.
 * Fail-open no GitHub como o github.cjs. Saida sempre JSON.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');
const {
  loadConfig, execGit, normalizePhaseName, comparePhaseNum, escapeRegex,
  getRoadmapPhaseInternal,
} = require('./core.cjs');
const github = require('./github.cjs');

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------

function today() {
  return new Date().toISOString().split('T')[0];
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function lockPath(cwd) {
  return path.join(cwd, '.plano', 'runtime', 'build.lock.json');
}

function readLock(cwd) {
  try { return JSON.parse(fs.readFileSync(lockPath(cwd), 'utf-8')); } catch { return null; }
}

function writeLock(cwd, data) {
  const p = lockPath(cwd);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

function clearLock(cwd) {
  try { fs.unlinkSync(lockPath(cwd)); } catch {}
}

function findPhaseDir(root, phase) {
  const fasesDir = path.join(root, '.plano', 'fases');
  const normalized = normalizePhaseName(phase);
  try {
    const dirs = fs.readdirSync(fasesDir, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => e.name)
      .sort((a, b) => comparePhaseNum(a, b));
    const match = dirs.find(d => d === normalized || d.startsWith(normalized + '-'));
    return match ? path.join(fasesDir, match) : null;
  } catch {
    return null;
  }
}

function frontmatterField(content, field) {
  const fm = content.match(/^---\n([\s\S]+?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(new RegExp('^' + escapeRegex(field) + ':\\s*(.+)$', 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
}

/** Planos da fase em ondas, a partir do disco. */
function planIndex(root, phase) {
  const dir = findPhaseDir(root, phase);
  if (!dir) return { phase_dir: null, plans: [], waves: {} };
  const files = fs.readdirSync(dir);
  const plans = [];
  const waves = {};
  for (const f of files.filter(x => x.endsWith('-PLAN.md')).sort()) {
    const id = f.replace(/-PLAN\.md$/, '');
    const content = fs.readFileSync(path.join(dir, f), 'utf-8');
    const wave = parseInt(frontmatterField(content, 'wave'), 10) || 1;
    const summary = path.join(dir, `${id}-SUMMARY.md`);
    plans.push({
      id,
      wave,
      type: frontmatterField(content, 'type') || 'misto',
      plan: path.relative(root, path.join(dir, f)),
      summary: path.relative(root, summary),
      done: fs.existsSync(summary),
    });
    (waves[wave] = waves[wave] || []).push(id);
  }
  return { phase_dir: path.relative(root, dir), plans, waves };
}

// ---------------------------------------------------------------------
// verify-static (puro; o cmdVerifyStatic do up-tools usa esta funcao)
// ---------------------------------------------------------------------

function runVerifyStatic(cwd, opts = {}) {
  const flags = {
    lint: !!opts.lint, typecheck: !!opts.typecheck, test: !!opts.test, audit: !!opts.audit,
    all: !!opts.all, skipMissing: !!opts.skipMissing,
  };
  if (!flags.lint && !flags.typecheck && !flags.test && !flags.audit && !flags.all) {
    flags.all = true;
    flags.skipMissing = true;
  }
  const runtimeDir = path.join(cwd, '.plano', 'runtime');
  try { fs.mkdirSync(runtimeDir, { recursive: true }); } catch {}

  let pkg = {};
  try { pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8')); } catch {}
  const scripts = pkg.scripts || {};
  const checks = [];
  const start = Date.now();

  function run(name, cmd) {
    const logPath = path.join(runtimeDir, `verify-static-${name}.log`);
    try {
      const out = execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 300000 });
      fs.writeFileSync(logPath, out);
      return { name, status: 'pass', exit_code: 0, summary: `${name} passed`, output_path: path.relative(cwd, logPath) };
    } catch (err) {
      const out = (err.stdout || '') + (err.stderr || '');
      fs.writeFileSync(logPath, out);
      const tail = out.split('\n').filter(l => l.trim()).slice(-5).join(' | ').slice(0, 300);
      return { name, status: 'fail', exit_code: err.status || 1, summary: tail || err.message, output_path: path.relative(cwd, logPath) };
    }
  }
  function skip(name) {
    if (flags.skipMissing) checks.push({ name, status: 'skip', exit_code: null, summary: 'script not found in package.json', output_path: null });
  }

  if (flags.all || flags.lint) {
    if (scripts.lint) checks.push(run('lint', 'npm run lint --silent')); else skip('lint');
  }
  if (flags.all || flags.typecheck) {
    const cmd = scripts.typecheck ? 'npm run typecheck --silent'
      : scripts['type-check'] ? 'npm run type-check --silent'
      : fs.existsSync(path.join(cwd, 'tsconfig.json')) ? 'npx tsc --noEmit' : null;
    if (cmd) checks.push(run('typecheck', cmd)); else skip('typecheck');
  }
  if (flags.all || flags.test) {
    if (scripts.test) {
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      let cmd = deps.vitest ? 'npm test --silent -- --run' : 'npm test --silent';
      if (process.env.UP_VERIFY_TEST_CMD) cmd = process.env.UP_VERIFY_TEST_CMD;
      checks.push(run('test', cmd));
    } else skip('test');
  }
  if (flags.all || flags.audit) {
    // npm audit sem lockfile sempre falha (ENOLOCK): sem lock nao ha o que auditar, pula.
    const hasLock = ['package-lock.json', 'npm-shrinkwrap.json'].some(f => fs.existsSync(path.join(cwd, f)));
    if (hasLock) checks.push(run('audit', 'npm audit --audit-level=high --silent'));
    else skip('audit');
  }

  const failed = checks.filter(c => c.status === 'fail');
  const passed = checks.filter(c => c.status === 'pass');
  const skipped = checks.filter(c => c.status === 'skip');
  return {
    overall: failed.length ? 'fail' : passed.length ? 'pass' : 'skip',
    checks,
    duration_secs: Math.round((Date.now() - start) / 1000),
    counts: { passed: passed.length, failed: failed.length, skipped: skipped.length },
  };
}

// ---------------------------------------------------------------------
// STATE / ROADMAP
// ---------------------------------------------------------------------

/** Marca a fase como completa no ROADMAP e no STATE. Idempotente. */
function markPhaseComplete(root, phase, planCount) {
  const n = String(parseInt(phase, 10));
  const date = today();
  const done = [];

  const roadmapPath = path.join(root, '.plano', 'ROADMAP.md');
  if (fs.existsSync(roadmapPath)) {
    let s = fs.readFileSync(roadmapPath, 'utf-8');
    const before = s;
    // checkbox da lista de fases
    s = s.replace(
      new RegExp(`^(-\\s*\\[) (\\]\\s*\\*\\*(?:Fase|Phase)\\s+${escapeRegex(n)}:[^\\n]*)$`, 'mi'),
      `$1x$2 (completed ${date})`
    );
    // linha da tabela de progresso: | 23. Nome | 0/1 | Planejada | - |
    s = s.replace(
      new RegExp(`^(\\|\\s*${escapeRegex(n)}\\.[^|\\n]*\\|)[^|\\n]*\\|[^|\\n]*\\|[^|\\n]*\\|$`, 'm'),
      `$1 ${planCount}/${planCount} | Completa | ${date} |`
    );
    if (s !== before) { fs.writeFileSync(roadmapPath, s); done.push('ROADMAP.md'); }
  }

  const statePath = path.join(root, '.plano', 'STATE.md');
  if (fs.existsSync(statePath)) {
    let s = fs.readFileSync(statePath, 'utf-8');
    const before = s;
    const status = `**Status**: Fase ${n} completa em ${date} (build close)`;
    if (/^\*\*Status\*\*:.*$/m.test(s)) s = s.replace(/^\*\*Status\*\*:.*$/m, status);
    else if (/^\*\*Status:\*\*.*$/m.test(s)) s = s.replace(/^\*\*Status:\*\*.*$/m, `**Status:** Fase ${n} completa em ${date}`);
    if (s !== before) { fs.writeFileSync(statePath, s); done.push('STATE.md'); }
  }
  return done;
}

// ---------------------------------------------------------------------
// open
// ---------------------------------------------------------------------

function openPhase({ cwd, phase, local = false, solo = false }) {
  const warnings = [];
  if (!phase) throw new Error('phase required');
  const config = loadConfig(cwd);
  const githubNative = !local && config.github_native !== false;

  const roadmap = getRoadmapPhaseInternal(cwd, String(parseInt(phase, 10)));
  const phaseDirMain = findPhaseDir(cwd, phase);
  const slug = phaseDirMain
    ? path.basename(phaseDirMain).replace(/^\d+[A-Z]?(?:\.\d+)*-?/i, '')
    : slugify(roadmap ? roadmap.phase_name : '');

  const lock = readLock(cwd);
  const resume = !!(lock && String(lock.phase) === String(phase));
  if (lock && !resume) warnings.push(`lock de outra fase (${lock.phase}) substituido`);

  let start;
  if (resume && lock.worktree && fs.existsSync(lock.worktree)) {
    start = { branch: lock.branch, worktree: lock.worktree, issue: lock.issue, mode: lock.mode, transport: lock.transport, warnings: [] };
  } else {
    start = github.startPhase({ cwd, phase, slug, local: !githubNative, solo });
  }
  warnings.push(...(start.warnings || []));

  const root = start.worktree || cwd;
  const idx = planIndex(root, phase);
  if (!idx.plans.length) warnings.push('fase sem PLAN.md: rode /up:plan ' + phase);

  const pending = idx.plans.filter(p => !p.done);
  // Plano antigo (sem `Onde:` ou sem comando de prova) executa igual, com aviso: o executor
  // vai precisar achar o lugar sozinho, o que pesa mais num build_model menor.
  const { deliveryWarnings } = require('./plan.cjs');
  for (const p of pending) {
    const w = deliveryWarnings(fs.readFileSync(path.join(root, p.plan), 'utf-8'));
    if (w.length) warnings.push(`plano ${p.id} pouco concreto: ${w.length} entrega(s) sem Onde ou sem comando de prova`);
  }
  const waveKeys = Object.keys(idx.waves).map(Number).sort((a, b) => a - b);
  const waves = waveKeys.map(w => ({
    wave: w,
    plans: idx.plans.filter(p => p.wave === w).map(p => ({ id: p.id, type: p.type, plan: p.plan, done: p.done })),
  }));

  const result = {
    phase: String(phase),
    name: roadmap ? roadmap.phase_name : slug,
    goal: roadmap ? (roadmap.goal || ((roadmap.section.match(/\*\*(?:Objetivo|Goal)\*\*:\s*([^\n]+)/i) || [])[1] || null)) : null,
    mode: start.mode || (githubNative ? 'github' : 'local'),
    root,
    branch: start.branch || null,
    worktree: start.worktree || null,
    issue: start.issue || null,
    transport: start.transport || 'none',
    pending_issue: start.pending ? start.pending.issue || null : null,
    resumed: resume,
    build_model: config.build_model || 'inherit',
    paralelizacao: config.paralelizacao !== false,
    require_visual_test: config.require_visual_test !== false,
    phase_dir: idx.phase_dir,
    waves,
    pending_plans: pending.map(p => p.id),
    warnings,
  };

  writeLock(cwd, {
    stage: 'build', phase: String(phase), opened_at: new Date().toISOString(),
    branch: result.branch, worktree: result.worktree, issue: result.issue, mode: result.mode, transport: result.transport,
  });
  return result;
}

// ---------------------------------------------------------------------
// close
// ---------------------------------------------------------------------

function boardSync(cwd, phase, status, warnings) {
  try {
    execFileSync(process.execPath, [path.join(__dirname, '..', 'up-tools.cjs'), 'multica', 'sync', '--phase', String(phase), '--status', status, '--raw'], { cwd, stdio: 'pipe', timeout: 60000 });
  } catch (e) {
    warnings.push('multica indisponivel: ' + (e.message || '').split('\n')[0]);
  }
}

function closePhase({ cwd, phase, land = 'merge', board = false, skipVerify = false }) {
  const warnings = [];
  if (!phase) throw new Error('phase required');
  const lands = ['merge', 'keep', 'discard', 'local'];
  if (!lands.includes(land)) throw new Error(`--land invalido: ${land} (use ${lands.join('|')})`);

  const map = github.readGitMap(cwd);
  const key = Object.keys(map.phases || {}).find(k => parseInt(k, 10) === parseInt(phase, 10));
  const entry = key ? map.phases[key] : {};
  const worktree = entry.worktree && fs.existsSync(entry.worktree) ? entry.worktree : null;
  const root = worktree || cwd;

  // descartar nao exige prova
  if (land === 'discard') {
    if (worktree) github.cleanupWorktreeBranch(cwd, worktree, entry.branch, warnings);
    if (key) { entry.status = 'discarded'; entry.worktree = null; map.phases[key] = entry; github.writeGitMap(cwd, map); }
    if (board) boardSync(cwd, phase, 'cancelled', warnings);
    clearLock(cwd);
    return { ok: true, phase: String(phase), land, action: 'discarded', warnings };
  }

  // 1. SUMMARY de cada plano, com ## Prova
  const idx = planIndex(root, phase);
  const missing = [];
  const noProof = [];
  for (const p of idx.plans) {
    const s = path.join(root, p.summary);
    if (!fs.existsSync(s)) missing.push(p.id);
    else if (!/^## Prova/m.test(fs.readFileSync(s, 'utf-8'))) noProof.push(p.id);
  }
  if (!idx.plans.length || missing.length || noProof.length) {
    return {
      ok: false, stage: 'summary', phase: String(phase),
      error: !idx.plans.length ? 'fase sem planos' : 'plano sem SUMMARY ou sem ## Prova',
      missing_summary: missing, missing_prova: noProof, warnings,
    };
  }

  // 2. verify-static trava o merge
  let verify = { overall: 'skip', checks: [] };
  if (!skipVerify) {
    verify = runVerifyStatic(root);
    if (verify.overall === 'fail') {
      return {
        ok: false, stage: 'verify', phase: String(phase),
        error: 'verify-static falhou: corrija e rode build close de novo',
        failed: verify.checks.filter(c => c.status === 'fail'), warnings,
      };
    }
  } else {
    warnings.push('verify-static pulado (--skip-verify)');
  }

  // 3. STATE/ROADMAP na raiz da fase (worktree entra no merge)
  const updated = markPhaseComplete(root, phase, idx.plans.length);
  if (updated.length) {
    const files = updated.map(f => path.join('.plano', f));
    const add = execGit(root, ['add', ...files]);
    const c = add.exitCode === 0 ? execGit(root, ['commit', '-m', `docs(fase-${normalizePhaseName(phase)}): fase completa`]) : add;
    if (c.exitCode !== 0 && !/nothing to commit/.test(c.stdout + c.stderr)) warnings.push('commit_state_failed: ' + (c.stderr || c.stdout));
  }

  // 4. aterrissar
  let fin;
  if (land === 'keep') {
    fin = { action: 'kept', branch: entry.branch || null };
  } else if (land === 'local' || !worktree) {
    fin = github.finishPhase({ cwd, phase, mode: 'local' });
  } else {
    fin = github.finishPhase({ cwd, phase, mode: 'auto' });
  }
  warnings.push(...(fin.warnings || []));

  if (board) boardSync(cwd, phase, land === 'keep' ? 'in_review' : 'done', warnings);
  if (land !== 'keep' && fin.action !== 'needs-mcp-pr') clearLock(cwd);

  return {
    ok: true,
    phase: String(phase),
    land,
    verify: verify.overall,
    updated,
    action: fin.action,
    pr: fin.pr || null,
    pr_url: fin.pr_url || null,
    pr_payload: fin.pr_payload || null,
    branch: fin.branch || entry.branch || null,
    warnings,
  };
}

// ---------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------

function run(cwd, args) {
  const sub = args[0];
  const get = (name) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null; };
  const has = (name) => args.includes(name);
  const phase = get('--phase');
  let result;
  try {
    if (sub === 'open') {
      result = openPhase({ cwd, phase, local: has('--local'), solo: has('--solo') });
    } else if (sub === 'close') {
      result = closePhase({ cwd, phase, land: get('--land') || 'merge', board: has('--board'), skipVerify: has('--skip-verify') });
    } else {
      process.stderr.write('Usage: build open --phase N [--local] [--solo] | build close --phase N [--land merge|keep|discard|local] [--board] [--skip-verify]\n');
      process.exit(1);
    }
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, error: e.message }));
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(result, null, 2));
  process.exit(result && result.ok === false ? 1 : 0);
}

module.exports = { openPhase, closePhase, planIndex, runVerifyStatic, markPhaseComplete, run };
