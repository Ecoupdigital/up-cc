'use strict';
/**
 * plan.cjs: o lado deterministico do /up:plan (v4).
 *
 *   deliveryWarnings(content)  avisos de plano concreto: entrega sem `Onde:` ou sem
 *                              comando em `Prova:`. Plano antigo continua executavel:
 *                              e so aviso, nunca erro.
 *   closePlan({cwd, ...})      gera .plano/PLAN-READY.md a partir dos PLAN.md pendentes
 *                              no disco (sem SUMMARY), confere que existem e commita.
 *
 * CLI: up-tools plan close [--runtime R] [--execution-runtime R] [--no-commit]
 */

const fs = require('fs');
const path = require('path');
const { execGit } = require('./core.cjs');

// ---------------------------------------------------------------------
// Plano concreto
// ---------------------------------------------------------------------

/** Separa as entregas `### N. titulo` do plano de uma pagina. */
function splitDeliveries(content) {
  const out = [];
  const re = /^###\s+(\d+)[.:)]\s*(.+)$/gm;
  const marks = [];
  let m;
  while ((m = re.exec(content)) !== null) marks.push({ idx: m.index, n: m[1], title: m[2].trim() });
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].idx : content.length;
    let body = content.slice(marks[i].idx, end);
    const nextH2 = body.search(/^##\s/m);
    if (nextH2 > 0) body = body.slice(0, nextH2);
    out.push({ n: marks[i].n, title: marks[i].title, body });
  }
  return out;
}

/** Prova com comando: trecho em crase, ou captura de tela de uma rota. */
function provaTemComando(linha) {
  return /`[^`]+`/.test(linha) || /\b(captura|screenshot)\b/i.test(linha);
}

/**
 * Avisos de plano concreto. Retorna [{delivery, missing: ['onde'|'prova_comando']}].
 * Plano sem entregas `### N.` (formato --profundo) nao gera aviso.
 */
function deliveryWarnings(content) {
  const warnings = [];
  for (const d of splitDeliveries(content)) {
    const missing = [];
    if (!/^Onde:\s*\S/m.test(d.body)) missing.push('onde');
    const prova = d.body.match(/^Prova:\s*(.*)$/m);
    if (!prova || !provaTemComando(prova[1])) missing.push('prova_comando');
    if (missing.length) warnings.push({ delivery: `${d.n}. ${d.title}`, missing });
  }
  return warnings;
}

// ---------------------------------------------------------------------
// plan close
// ---------------------------------------------------------------------

function readVersion() {
  const candidates = [
    path.join(__dirname, '..', '..', 'VERSION'),
    path.join(__dirname, '..', '..', 'package.json'),
  ];
  for (const f of candidates) {
    try {
      const txt = fs.readFileSync(f, 'utf-8');
      if (f.endsWith('.json')) return JSON.parse(txt).version || null;
      return txt.trim() || null;
    } catch { /* tenta o proximo */ }
  }
  return null;
}

function frontmatterValue(content, key) {
  const fm = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(new RegExp('^' + key + ':\\s*(.*)$', 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
}

function phaseNames(planoDir) {
  const names = {};
  try {
    const roadmap = fs.readFileSync(path.join(planoDir, 'ROADMAP.md'), 'utf-8');
    const re = /^###\s+Fase\s+(\d+(?:\.\d+)?[a-z]?):\s*(.+)$/gm;
    let m;
    while ((m = re.exec(roadmap)) !== null) names[String(parseFloat(m[1]))] = m[2].trim();
  } catch { /* sem ROADMAP: usa o slug */ }
  return names;
}

function projectName(planoDir) {
  try {
    const st = fs.readFileSync(path.join(planoDir, 'STATE.md'), 'utf-8');
    const m = st.match(/^\*\*Projeto\*\*:\s*(.+)$/m);
    if (m) return m[1].trim();
  } catch { /* segue */ }
  return path.basename(path.dirname(planoDir));
}

/** Planos pendentes: *-PLAN.md sem o *-SUMMARY.md correspondente. */
function pendingPlans(planoDir) {
  const fasesDir = path.join(planoDir, 'fases');
  if (!fs.existsSync(fasesDir)) return [];
  const out = [];
  for (const dir of fs.readdirSync(fasesDir).sort()) {
    const full = path.join(fasesDir, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full).sort()) {
      const m = f.match(/^(\d+(?:\.\d+)?[a-z]?-\d+)-PLAN\.md$/);
      if (!m) continue;
      if (fs.existsSync(path.join(full, `${m[1]}-SUMMARY.md`))) continue;
      const content = fs.readFileSync(path.join(full, f), 'utf-8');
      out.push({
        id: m[1],
        phase: String(parseFloat(m[1].split('-')[0])),
        phase_dir: dir,
        path: `fases/${dir}/${f}`,
        wave: parseInt(frontmatterValue(content, 'wave') || '1', 10) || 1,
        warnings: deliveryWarnings(content),
      });
    }
  }
  return out;
}

function closePlan({ cwd, runtime, executionRuntime = 'same', commit = true, profundo = false } = {}) {
  const planoDir = path.join(cwd, '.plano');
  const plans = pendingPlans(planoDir);
  if (!plans.length) return { ok: false, reason: 'no_pending_plans', plans: [] };

  const missing = plans.filter(p => !fs.existsSync(path.join(planoDir, p.path))).map(p => p.path);
  if (missing.length) return { ok: false, reason: 'missing_plans', missing };

  const names = phaseNames(planoDir);
  const phases = [...new Set(plans.map(p => p.phase))];
  const today = new Date().toISOString().slice(0, 10);
  const rt = runtime || (fs.existsSync(path.join(process.env.HOME || '', '.claude')) ? 'claude-code' : 'any');
  const mode = fs.existsSync(path.join(planoDir, 'codebase')) || fs.existsSync(path.join(cwd, 'package.json'))
    ? 'brownfield' : 'greenfield';

  const rows = plans.map(p =>
    `| ${p.phase}. ${names[p.phase] || p.phase_dir} | ${p.path} | ${p.wave} |`).join('\n');
  const escopo = phases.length === 1 ? `a fase ${phases[0]}` : `as fases ${phases.join(', ')}`;

  const content = [
    '---',
    `version: "${readVersion() || ''}"`,
    `planned_at: "${today}"`,
    'planned_by:',
    `  runtime: "${rt}"`,
    'intended_execution:',
    `  runtime: "${executionRuntime}"`,
    `project_name: "${projectName(planoDir)}"`,
    `mode: "${mode}"`,
    `profundo: ${profundo ? 'true' : 'false'}`,
    `total_phases: ${phases.length}`,
    `total_plans: ${plans.length}`,
    'status: ready_for_execution',
    '---',
    '',
    `# Pronto para execução: ${phases.length === 1 ? 'fase ' + phases[0] : 'fases ' + phases.join(', ')}`,
    '',
    `Gerado por \`up-tools plan close\` a partir dos PLAN.md pendentes. Escopo: ${escopo}.`,
    '',
    '| Fase | Plano | Onda |',
    '|------|-------|------|',
    rows,
    '',
    '## Como executar',
    '',
    '```',
    '/up:build',
    '```',
    '',
    'Pode rodar neste runtime ou em outro: o estado está todo em `.plano/`.',
    '',
  ].join('\n');

  const readyPath = path.join(planoDir, 'PLAN-READY.md');
  fs.writeFileSync(readyPath, content);

  let committed = false;
  let hash = null;
  if (commit) {
    const files = ['.plano/PLAN-READY.md', ...plans.map(p => '.plano/' + p.path)];
    for (const extra of ['.plano/ROADMAP.md', '.plano/STATE.md']) {
      if (fs.existsSync(path.join(cwd, extra))) files.push(extra);
    }
    execGit(cwd, ['add', '--', ...files]);
    const msg = `plan(${phases.join(',')}): pronto para execução`;
    const c = execGit(cwd, ['commit', '-m', msg]);
    committed = c.exitCode === 0;
    if (committed) hash = execGit(cwd, ['rev-parse', '--short', 'HEAD']).stdout.trim();
  }

  return {
    ok: true,
    path: '.plano/PLAN-READY.md',
    phases,
    plans: plans.map(p => ({ id: p.id, path: p.path, wave: p.wave, warnings: p.warnings })),
    committed,
    hash,
  };
}

function run(cwd, args) {
  const sub = args[0];
  const flag = (name) => {
    const i = args.indexOf(name);
    return i !== -1 ? args[i + 1] : undefined;
  };
  if (sub !== 'close') {
    process.stderr.write('Uso: up-tools plan close [--runtime R] [--execution-runtime R] [--profundo] [--no-commit]\n');
    process.exit(1);
  }
  const res = closePlan({
    cwd,
    runtime: flag('--runtime'),
    executionRuntime: flag('--execution-runtime') || 'same',
    commit: !args.includes('--no-commit'),
    profundo: args.includes('--profundo'),
  });
  process.stdout.write(JSON.stringify(res, null, 2) + '\n');
  if (!res.ok) process.exit(1);
}

module.exports = { deliveryWarnings, splitDeliveries, pendingPlans, closePlan, run };
