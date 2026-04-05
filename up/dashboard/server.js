#!/usr/bin/env node
// UP Builder Dashboard — Server
// Serves a real-time dashboard showing .plano/ state
// Usage: node server.js [port] [plano-dir]

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2]) || 4040;
const PLANO_DIR = process.argv[3] || path.join(process.cwd(), '.plano');

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function parseFrontmatter(content) {
  if (!content) return {};
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  match[1].split('\n').forEach(line => {
    const [key, ...val] = line.split(':');
    if (key && val.length) fm[key.trim()] = val.join(':').trim();
  });
  return fm;
}

function getState() {
  const state = {
    exists: fs.existsSync(PLANO_DIR),
    project: null,
    roadmap: null,
    lock: null,
    config: null,
    phases: [],
    score: null,
    progress: { total: 0, completed: 0, pct: 0 },
    commits: 0,
    reports: {}
  };

  if (!state.exists) return state;

  // PROJECT.md
  const project = readFile(path.join(PLANO_DIR, 'PROJECT.md'));
  if (project) {
    const nameMatch = project.match(/^# (.+)/m);
    const coreMatch = project.match(/## Core Value\n+(.+)/m);
    state.project = {
      name: nameMatch ? nameMatch[1] : 'Unknown',
      coreValue: coreMatch ? coreMatch[1] : ''
    };
  }

  // LOCK.md
  const lock = readFile(path.join(PLANO_DIR, 'LOCK.md'));
  if (lock) {
    state.lock = parseFrontmatter(lock);
  }

  // config.json
  try {
    state.config = JSON.parse(readFile(path.join(PLANO_DIR, 'config.json')) || '{}');
  } catch {}

  // ROADMAP.md — parse phases
  const roadmap = readFile(path.join(PLANO_DIR, 'ROADMAP.md'));
  if (roadmap) {
    const phaseRegex = /- \[([ x])\] \*\*Fase (\d+): (.+?)\*\*\s*[-—]\s*(.+)/g;
    let m;
    while ((m = phaseRegex.exec(roadmap)) !== null) {
      state.phases.push({
        number: parseInt(m[2]),
        name: m[3],
        description: m[4].trim(),
        completed: m[1] === 'x'
      });
    }
    state.progress.total = state.phases.length;
    state.progress.completed = state.phases.filter(p => p.completed).length;
    state.progress.pct = state.progress.total > 0
      ? Math.round((state.progress.completed / state.progress.total) * 100) : 0;
  }

  // STATE.md — extract current phase
  const stateFile = readFile(path.join(PLANO_DIR, 'STATE.md'));
  if (stateFile) {
    const phaseMatch = stateFile.match(/\*\*Fase:\*\* (\d+)/);
    const statusMatch = stateFile.match(/\*\*Status:\*\* (.+)/);
    state.currentPhase = phaseMatch ? parseInt(phaseMatch[1]) : null;
    state.currentStatus = statusMatch ? statusMatch[1] : null;
  }

  // Count commits
  try {
    const { execSync } = require('child_process');
    const count = execSync('git rev-list --count HEAD 2>/dev/null', { cwd: path.dirname(PLANO_DIR) });
    state.commits = parseInt(count.toString().trim()) || 0;
  } catch {}

  // Reports
  const reports = ['DELIVERY.md', 'SECURITY-REVIEW.md', 'QA-REPORT.md'];
  reports.forEach(r => {
    const content = readFile(path.join(PLANO_DIR, r));
    if (content) state.reports[r] = true;
  });

  // Melhorias report
  const melhorias = readFile(path.join(PLANO_DIR, 'melhorias', 'RELATORIO.md'));
  if (melhorias) state.reports['melhorias/RELATORIO.md'] = true;

  // UX report
  const ux = readFile(path.join(PLANO_DIR, 'ux-review', 'UX-REPORT.md'));
  if (ux) {
    state.reports['ux-review/UX-REPORT.md'] = true;
    const scoreMatch = ux.match(/Score Geral:\*\* (\d+)/);
    if (scoreMatch) state.uxScore = parseInt(scoreMatch[1]);
  }

  // Mobile report
  const mobile = readFile(path.join(PLANO_DIR, 'mobile-review', 'MOBILE-REPORT.md'));
  if (mobile) {
    state.reports['mobile-review/MOBILE-REPORT.md'] = true;
    const scoreMatch = mobile.match(/Score de Responsividade:\*\* (\d+)/);
    if (scoreMatch) state.mobileScore = parseInt(scoreMatch[1]);
  }

  // E2E report
  const e2e = readFile(path.join(PLANO_DIR, 'e2e', 'E2E-REPORT.md'));
  if (e2e) state.reports['e2e/E2E-REPORT.md'] = true;

  // Captures count
  const capturesDir = path.join(PLANO_DIR, 'captures');
  if (fs.existsSync(capturesDir)) {
    state.capturesCount = fs.readdirSync(capturesDir).filter(f => f.endsWith('.md') && f !== 'TRIAGE.md').length;
  }

  return state;
}

// HTML template
function renderHTML(state) {
  const phases = state.phases.map((p, i) => {
    const isCurrent = p.number === state.currentPhase && !p.completed;
    const icon = p.completed ? '&#10003;' : isCurrent ? '&#9673;' : '&#9675;';
    const cls = p.completed ? 'completed' : isCurrent ? 'current' : 'pending';
    return `<div class="phase ${cls}"><span class="icon">${icon}</span><span class="num">Fase ${p.number}</span><span class="name">${p.name}</span></div>`;
  }).join('');

  const bar = Math.min(state.progress.pct, 100);
  const barColor = bar < 33 ? '#ef4444' : bar < 66 ? '#f59e0b' : '#22c55e';
  const lockStatus = state.lock ? `<div class="lock"><strong>Builder ativo:</strong> ${state.lock.stage || '?'} — fase ${state.lock.phase || '?'} — ${state.lock.step || '?'}</div>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UP Builder Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; min-height: 100vh; }
  .container { max-width: 900px; margin: 0 auto; padding: 24px; }
  .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
  .header h1 { font-size: 24px; font-weight: 700; }
  .header .badge { background: #7c3aed; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .card { background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 20px; }
  .card h3 { font-size: 12px; text-transform: uppercase; color: #737373; margin-bottom: 8px; letter-spacing: 1px; }
  .card .value { font-size: 32px; font-weight: 700; }
  .card .sub { font-size: 13px; color: #737373; margin-top: 4px; }
  .progress-bar { background: #262626; border-radius: 8px; height: 12px; overflow: hidden; margin-bottom: 24px; }
  .progress-fill { height: 100%; border-radius: 8px; transition: width 0.5s ease; background: ${barColor}; width: ${bar}%; }
  .phases { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .phase { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #171717; border: 1px solid #262626; border-radius: 8px; }
  .phase.completed { border-color: #22c55e33; }
  .phase.current { border-color: #7c3aed; background: #7c3aed11; }
  .phase .icon { font-size: 18px; width: 24px; text-align: center; }
  .phase.completed .icon { color: #22c55e; }
  .phase.current .icon { color: #7c3aed; }
  .phase .num { font-size: 12px; color: #737373; width: 60px; }
  .phase .name { font-weight: 500; }
  .lock { background: #7c3aed22; border: 1px solid #7c3aed44; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 14px; }
  .reports { display: flex; flex-wrap: wrap; gap: 8px; }
  .report { background: #22c55e22; border: 1px solid #22c55e44; border-radius: 6px; padding: 4px 12px; font-size: 12px; color: #22c55e; }
  .footer { text-align: center; color: #525252; font-size: 12px; margin-top: 32px; }
  .no-project { text-align: center; padding: 80px 20px; }
  .no-project h2 { font-size: 20px; margin-bottom: 12px; }
  .no-project p { color: #737373; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>UP Builder</h1>
    <span class="badge">Dashboard</span>
  </div>

  ${!state.exists ? '<div class="no-project"><h2>Sem .plano/ detectado</h2><p>Execute /up:modo-builder para iniciar um projeto</p></div>' : `

  ${lockStatus}

  <div class="grid">
    <div class="card">
      <h3>Projeto</h3>
      <div class="value" style="font-size:20px">${state.project?.name || 'Carregando...'}</div>
      <div class="sub">${state.project?.coreValue || ''}</div>
    </div>
    <div class="card">
      <h3>Progresso</h3>
      <div class="value">${state.progress.pct}%</div>
      <div class="sub">${state.progress.completed}/${state.progress.total} fases</div>
    </div>
    <div class="card">
      <h3>Commits</h3>
      <div class="value">${state.commits}</div>
    </div>
    <div class="card">
      <h3>Status</h3>
      <div class="value" style="font-size:16px">${state.currentStatus || 'Aguardando'}</div>
      <div class="sub">Fase ${state.currentPhase || '?'}</div>
    </div>
  </div>

  <div class="progress-bar"><div class="progress-fill"></div></div>

  <h3 style="margin-bottom:12px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:1px">Fases</h3>
  <div class="phases">${phases}</div>

  ${Object.keys(state.reports).length > 0 ? `
  <h3 style="margin-bottom:12px;color:#737373;font-size:12px;text-transform:uppercase;letter-spacing:1px">Relatorios</h3>
  <div class="reports">${Object.keys(state.reports).map(r => `<span class="report">${r}</span>`).join('')}</div>
  ` : ''}

  `}

  <div class="footer">UP Builder Dashboard — atualiza a cada 3s</div>
</div>
<script>setTimeout(() => location.reload(), 3000);</script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(getState()));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderHTML(getState()));
  }
});

server.listen(PORT, () => {
  console.log(`\x1b[36mUP Builder Dashboard\x1b[0m running at http://localhost:${PORT}`);
  console.log(`Monitoring: ${PLANO_DIR}`);
  console.log('Press Ctrl+C to stop');
});
