#!/usr/bin/env node

/**
 * UP Tools — CLI utility for UP workflow operations
 *
 * UP Tools — Single file CLI (+ core.cjs).
 *
 * Usage: node up-tools.cjs <command> [args] [--raw] [--cwd <path>]
 *
 * Commands:
 *   init planejar-fase|executar-fase|novo-projeto|rapido|retomar
 *   state load|get|update|advance-plan|update-progress|add-decision|record-session
 *   roadmap get-phase|analyze|update-plan-progress
 *   phase add|remove|find|complete
 *   config get|set
 *   requirements mark-complete
 *   commit <msg> --files
 *   progress [json|table|bar]
 *   timestamp [full|date|filename]
 *   slug <text>
 */

const fs = require('fs');
const path = require('path');
const {
  output, error, loadConfig, isGitIgnored, execGit,
  escapeRegex, normalizePhaseName, comparePhaseNum,
  findPhaseInternal, getRoadmapPhaseInternal,
  pathExistsInternal, generateSlugInternal, toPosixPath,
} = require('./lib/core.cjs');

// --- State helpers ---

function stateExtractField(content, fieldName) {
  const escaped = escapeRegex(fieldName);
  const boldPattern = new RegExp(`\\*\\*${escaped}:\\*\\*\\s*(.+)`, 'i');
  const boldMatch = content.match(boldPattern);
  if (boldMatch) return boldMatch[1].trim();
  const plainPattern = new RegExp(`^${escaped}:\\s*(.+)`, 'im');
  const plainMatch = content.match(plainPattern);
  return plainMatch ? plainMatch[1].trim() : null;
}

function stateReplaceField(content, fieldName, newValue) {
  const escaped = escapeRegex(fieldName);
  const boldPattern = new RegExp(`(\\*\\*${escaped}:\\*\\*\\s*)(.*)`, 'i');
  if (boldPattern.test(content)) {
    return content.replace(boldPattern, (_match, prefix) => `${prefix}${newValue}`);
  }
  const plainPattern = new RegExp(`(^${escaped}:\\s*)(.*)`, 'im');
  if (plainPattern.test(content)) {
    return content.replace(plainPattern, (_match, prefix) => `${prefix}${newValue}`);
  }
  return null;
}

// --- CLI Router ---

function main() {
  const args = process.argv.slice(2);

  // Optional cwd override
  let cwd = process.cwd();
  const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) error('Missing value for --cwd');
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  } else if (cwdIdx !== -1) {
    const value = args[cwdIdx + 1];
    if (!value || value.startsWith('--')) error('Missing value for --cwd');
    args.splice(cwdIdx, 2);
    cwd = path.resolve(value);
  }

  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    error(`Invalid --cwd: ${cwd}`);
  }

  const rawIndex = args.indexOf('--raw');
  const raw = rawIndex !== -1;
  if (rawIndex !== -1) args.splice(rawIndex, 1);

  const command = args[0];

  if (!command) {
    error('Usage: up-tools <command> [args] [--raw] [--cwd <path>]\nCommands: init, state, roadmap, phase, config, requirements, commit, progress, timestamp, slug');
  }

  switch (command) {
    // ==================== INIT ====================
    case 'init': {
      const workflow = args[1];
      switch (workflow) {
        case 'planejar-fase':
          cmdInitPlanejarFase(cwd, args[2], raw);
          break;
        case 'executar-fase':
          cmdInitExecutarFase(cwd, args[2], raw);
          break;
        case 'novo-projeto':
          cmdInitNovoProjeto(cwd, raw);
          break;
        case 'rapido':
          cmdInitRapido(cwd, args.slice(2).join(' '), raw);
          break;
        case 'retomar':
          cmdInitRetomar(cwd, raw);
          break;
        default:
          error(`Unknown init workflow: ${workflow}\nAvailable: planejar-fase, executar-fase, novo-projeto, rapido, retomar`);
      }
      break;
    }

    // ==================== STATE ====================
    case 'state': {
      const sub = args[1];
      if (sub === 'load') {
        cmdStateLoad(cwd, raw);
      } else if (sub === 'get') {
        cmdStateGet(cwd, args[2], raw);
      } else if (sub === 'update') {
        cmdStateUpdate(cwd, args[2], args[3], raw);
      } else if (sub === 'advance-plan') {
        cmdStateAdvancePlan(cwd, raw);
      } else if (sub === 'update-progress') {
        cmdStateUpdateProgress(cwd, raw);
      } else if (sub === 'add-decision') {
        const summaryIdx = args.indexOf('--summary');
        const phaseIdx = args.indexOf('--phase');
        cmdStateAddDecision(cwd, {
          summary: summaryIdx !== -1 ? args[summaryIdx + 1] : null,
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
        }, raw);
      } else if (sub === 'record-session') {
        const stoppedIdx = args.indexOf('--stopped-at');
        cmdStateRecordSession(cwd, {
          stopped_at: stoppedIdx !== -1 ? args[stoppedIdx + 1] : null,
        }, raw);
      } else {
        error('Unknown state subcommand. Available: load, get, update, advance-plan, update-progress, add-decision, record-session');
      }
      break;
    }

    // ==================== ROADMAP ====================
    case 'roadmap': {
      const sub = args[1];
      if (sub === 'get-phase') {
        cmdRoadmapGetPhase(cwd, args[2], raw);
      } else if (sub === 'analyze') {
        cmdRoadmapAnalyze(cwd, raw);
      } else if (sub === 'update-plan-progress') {
        cmdRoadmapUpdatePlanProgress(cwd, args[2], raw);
      } else {
        error('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress');
      }
      break;
    }

    // ==================== PHASE ====================
    case 'phase': {
      const sub = args[1];
      if (sub === 'find') {
        cmdPhaseFind(cwd, args[2], raw);
      } else if (sub === 'add') {
        cmdPhaseAdd(cwd, args.slice(2).join(' '), raw);
      } else if (sub === 'remove') {
        const forceFlag = args.includes('--force');
        cmdPhaseRemove(cwd, args[2], { force: forceFlag }, raw);
      } else if (sub === 'complete') {
        cmdPhaseComplete(cwd, args[2], raw);
      } else {
        error('Unknown phase subcommand. Available: find, add, remove, complete');
      }
      break;
    }

    // ==================== CONFIG ====================
    case 'config': {
      const sub = args[1];
      if (sub === 'get') {
        cmdConfigGet(cwd, args[2], raw);
      } else if (sub === 'set') {
        cmdConfigSet(cwd, args[2], args[3], raw);
      } else {
        error('Unknown config subcommand. Available: get, set');
      }
      break;
    }

    // ==================== REQUIREMENTS ====================
    case 'requirements': {
      const sub = args[1];
      if (sub === 'mark-complete') {
        cmdRequirementsMarkComplete(cwd, args.slice(2), raw);
      } else {
        error('Unknown requirements subcommand. Available: mark-complete');
      }
      break;
    }

    // ==================== COMMIT ====================
    case 'commit': {
      const filesIndex = args.indexOf('--files');
      const endIndex = filesIndex !== -1 ? filesIndex : args.length;
      const messageArgs = args.slice(1, endIndex).filter(a => !a.startsWith('--'));
      const message = messageArgs.join(' ') || undefined;
      const files = filesIndex !== -1 ? args.slice(filesIndex + 1).filter(a => !a.startsWith('--')) : [];
      cmdCommit(cwd, message, files, raw);
      break;
    }

    // ==================== PROGRESS ====================
    case 'progress': {
      cmdProgress(cwd, args[1] || 'json', raw);
      break;
    }

    // ==================== TIMESTAMP ====================
    case 'timestamp': {
      cmdTimestamp(args[1] || 'full', raw);
      break;
    }

    // ==================== SLUG ====================
    case 'slug': {
      cmdSlug(args[1], raw);
      break;
    }

    default:
      error(`Unknown command: ${command}`);
  }
}

// =====================================================================
// INIT COMMANDS
// =====================================================================

function cmdInitPlanejarFase(cwd, phase, raw) {
  if (!phase) error('phase required for init planejar-fase');

  const config = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);

  const result = {
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,
    padded_phase: phaseInfo?.phase_number?.padStart(2, '0') || null,

    has_research: phaseInfo?.has_research || false,
    has_context: phaseInfo?.has_context || false,
    has_plans: (phaseInfo?.plans?.length || 0) > 0,
    plan_count: phaseInfo?.plans?.length || 0,

    commit_docs: config.commit_docs,

    state_path: '.plano/STATE.md',
    roadmap_path: '.plano/ROADMAP.md',
    requirements_path: '.plano/REQUIREMENTS.md',
  };

  // Find context and research files in phase directory
  if (phaseInfo?.directory) {
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
      if (contextFile) {
        result.context_path = toPosixPath(path.join(phaseInfo.directory, contextFile));
      }
      const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
      if (researchFile) {
        result.research_path = toPosixPath(path.join(phaseInfo.directory, researchFile));
      }
    } catch {}
  }

  output(result, raw);
}

function cmdInitExecutarFase(cwd, phase, raw) {
  if (!phase) error('phase required for init executar-fase');

  const config = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);

  const result = {
    commit_docs: config.commit_docs,
    paralelizacao: config.paralelizacao,

    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,

    plans: phaseInfo?.plans || [],
    incomplete_plans: phaseInfo?.incomplete_plans || [],
    plan_count: phaseInfo?.plans?.length || 0,
    incomplete_count: phaseInfo?.incomplete_plans?.length || 0,

    state_exists: pathExistsInternal(cwd, '.plano/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.plano/ROADMAP.md'),
  };

  output(result, raw);
}

function cmdInitNovoProjeto(cwd, raw) {
  const config = loadConfig(cwd);
  const { execSync } = require('child_process');

  let hasCode = false;
  try {
    const files = execSync('find . -maxdepth 3 \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.java" \\) 2>/dev/null | grep -v node_modules | grep -v .git | head -5', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    hasCode = files.trim().length > 0;
  } catch {}

  const result = {
    commit_docs: config.commit_docs,
    project_exists: pathExistsInternal(cwd, '.plano/PROJECT.md'),
    planning_exists: pathExistsInternal(cwd, '.plano'),
    has_existing_code: hasCode,
    has_git: pathExistsInternal(cwd, '.git'),
    project_path: '.plano/PROJECT.md',
  };

  output(result, raw);
}

function cmdInitRapido(cwd, description, raw) {
  const config = loadConfig(cwd);
  const now = new Date();
  const slug = description ? generateSlugInternal(description)?.substring(0, 40) : null;

  const quickDir = path.join(cwd, '.plano', 'rapido');
  let nextNum = 1;
  try {
    const existing = fs.readdirSync(quickDir)
      .filter(f => /^\d+-/.test(f))
      .map(f => parseInt(f.split('-')[0], 10))
      .filter(n => !isNaN(n));
    if (existing.length > 0) {
      nextNum = Math.max(...existing) + 1;
    }
  } catch {}

  const result = {
    commit_docs: config.commit_docs,
    next_num: nextNum,
    slug,
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),
    quick_dir: '.plano/rapido',
    task_dir: slug ? `.plano/rapido/${nextNum}-${slug}` : null,
    roadmap_exists: pathExistsInternal(cwd, '.plano/ROADMAP.md'),
    planning_exists: pathExistsInternal(cwd, '.plano'),
  };

  output(result, raw);
}

function cmdInitRetomar(cwd, raw) {
  const config = loadConfig(cwd);

  const result = {
    state_exists: pathExistsInternal(cwd, '.plano/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.plano/ROADMAP.md'),
    project_exists: pathExistsInternal(cwd, '.plano/PROJECT.md'),
    planning_exists: pathExistsInternal(cwd, '.plano'),
    commit_docs: config.commit_docs,
  };

  output(result, raw);
}

// =====================================================================
// STATE COMMANDS
// =====================================================================

function cmdStateLoad(cwd, raw) {
  const config = loadConfig(cwd);
  const planoDir = path.join(cwd, '.plano');

  let stateRaw = '';
  try {
    stateRaw = fs.readFileSync(path.join(planoDir, 'STATE.md'), 'utf-8');
  } catch {}

  const result = {
    config,
    state_raw: stateRaw,
    state_exists: stateRaw.length > 0,
    roadmap_exists: fs.existsSync(path.join(planoDir, 'ROADMAP.md')),
    config_exists: fs.existsSync(path.join(planoDir, 'config.json')),
  };

  output(result, raw);
}

function cmdStateGet(cwd, section, raw) {
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  try {
    const content = fs.readFileSync(statePath, 'utf-8');

    if (!section) {
      output({ content }, raw, content);
      return;
    }

    const fieldEscaped = escapeRegex(section);

    // Check **field:** value (bold format)
    const boldPattern = new RegExp(`\\*\\*${fieldEscaped}:\\*\\*\\s*(.*)`, 'i');
    const boldMatch = content.match(boldPattern);
    if (boldMatch) {
      output({ [section]: boldMatch[1].trim() }, raw, boldMatch[1].trim());
      return;
    }

    // Check field: value (plain format)
    const plainPattern = new RegExp(`^${fieldEscaped}:\\s*(.*)`, 'im');
    const plainMatch = content.match(plainPattern);
    if (plainMatch) {
      output({ [section]: plainMatch[1].trim() }, raw, plainMatch[1].trim());
      return;
    }

    // Check ## Section
    const sectionPattern = new RegExp(`##\\s*${fieldEscaped}\\s*\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
    const sectionMatch = content.match(sectionPattern);
    if (sectionMatch) {
      output({ [section]: sectionMatch[1].trim() }, raw, sectionMatch[1].trim());
      return;
    }

    output({ error: `Section or field "${section}" not found` }, raw, '');
  } catch {
    error('STATE.md not found');
  }
}

function cmdStateUpdate(cwd, field, value, raw) {
  if (!field || value === undefined) {
    error('field and value required for state update');
  }

  const statePath = path.join(cwd, '.plano', 'STATE.md');
  try {
    let content = fs.readFileSync(statePath, 'utf-8');
    const result = stateReplaceField(content, field, value);
    if (result) {
      fs.writeFileSync(statePath, result, 'utf-8');
      output({ updated: true }, raw);
    } else {
      output({ updated: false, reason: `Field "${field}" not found in STATE.md` }, raw);
    }
  } catch {
    output({ updated: false, reason: 'STATE.md not found' }, raw);
  }
}

function cmdStateAdvancePlan(cwd, raw) {
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  if (!fs.existsSync(statePath)) { output({ error: 'STATE.md not found' }, raw); return; }

  let content = fs.readFileSync(statePath, 'utf-8');
  const currentPlan = parseInt(stateExtractField(content, 'Current Plan'), 10);
  const totalPlans = parseInt(stateExtractField(content, 'Total Plans in Phase'), 10);
  const today = new Date().toISOString().split('T')[0];

  if (isNaN(currentPlan) || isNaN(totalPlans)) {
    output({ error: 'Cannot parse Current Plan or Total Plans in Phase from STATE.md' }, raw);
    return;
  }

  if (currentPlan >= totalPlans) {
    content = stateReplaceField(content, 'Status', 'Phase complete') || content;
    content = stateReplaceField(content, 'Last Activity', today) || content;
    fs.writeFileSync(statePath, content, 'utf-8');
    output({ advanced: false, reason: 'last_plan', current_plan: currentPlan, total_plans: totalPlans }, raw, 'false');
  } else {
    const newPlan = currentPlan + 1;
    content = stateReplaceField(content, 'Current Plan', String(newPlan)) || content;
    content = stateReplaceField(content, 'Status', 'Ready to execute') || content;
    content = stateReplaceField(content, 'Last Activity', today) || content;
    fs.writeFileSync(statePath, content, 'utf-8');
    output({ advanced: true, previous_plan: currentPlan, current_plan: newPlan, total_plans: totalPlans }, raw, 'true');
  }
}

function cmdStateUpdateProgress(cwd, raw) {
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  if (!fs.existsSync(statePath)) { output({ error: 'STATE.md not found' }, raw); return; }

  let content = fs.readFileSync(statePath, 'utf-8');

  const phasesDir = path.join(cwd, '.plano', 'fases');
  let totalPlans = 0;
  let totalSummaries = 0;

  if (fs.existsSync(phasesDir)) {
    const phaseDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => e.name);
    for (const dir of phaseDirs) {
      const files = fs.readdirSync(path.join(phasesDir, dir));
      totalPlans += files.filter(f => f.match(/-PLAN\.md$/i)).length;
      totalSummaries += files.filter(f => f.match(/-SUMMARY\.md$/i)).length;
    }
  }

  const percent = totalPlans > 0 ? Math.min(100, Math.round(totalSummaries / totalPlans * 100)) : 0;
  const barWidth = 10;
  const filled = Math.round(percent / 100 * barWidth);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
  const progressStr = `[${bar}] ${percent}%`;

  const boldProgressPattern = /(\*\*Progress:\*\*\s*).*/i;
  const plainProgressPattern = /^(Progress:\s*).*/im;
  if (boldProgressPattern.test(content)) {
    content = content.replace(boldProgressPattern, (_match, prefix) => `${prefix}${progressStr}`);
    fs.writeFileSync(statePath, content, 'utf-8');
    output({ updated: true, percent, completed: totalSummaries, total: totalPlans, bar: progressStr }, raw, progressStr);
  } else if (plainProgressPattern.test(content)) {
    content = content.replace(plainProgressPattern, (_match, prefix) => `${prefix}${progressStr}`);
    fs.writeFileSync(statePath, content, 'utf-8');
    output({ updated: true, percent, completed: totalSummaries, total: totalPlans, bar: progressStr }, raw, progressStr);
  } else {
    output({ updated: false, reason: 'Progress field not found in STATE.md' }, raw, 'false');
  }
}

function cmdStateAddDecision(cwd, options, raw) {
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  if (!fs.existsSync(statePath)) { output({ error: 'STATE.md not found' }, raw); return; }

  const { phase, summary } = options;
  if (!summary) { output({ error: 'summary required' }, raw); return; }

  let content = fs.readFileSync(statePath, 'utf-8');
  const entry = `- [Phase ${phase || '?'}]: ${summary}`;

  const sectionPattern = /(###?\s*(?:Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
  const match = content.match(sectionPattern);

  if (match) {
    let sectionBody = match[2];
    sectionBody = sectionBody.replace(/None yet\.?\s*\n?/gi, '').replace(/No decisions yet\.?\s*\n?/gi, '');
    sectionBody = sectionBody.trimEnd() + '\n' + entry + '\n';
    content = content.replace(sectionPattern, (_match, header) => `${header}${sectionBody}`);
    fs.writeFileSync(statePath, content, 'utf-8');
    output({ added: true, decision: entry }, raw, 'true');
  } else {
    output({ added: false, reason: 'Decisions section not found in STATE.md' }, raw, 'false');
  }
}

function cmdStateRecordSession(cwd, options, raw) {
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  if (!fs.existsSync(statePath)) { output({ error: 'STATE.md not found' }, raw); return; }

  let content = fs.readFileSync(statePath, 'utf-8');
  const now = new Date().toISOString();
  const updated = [];

  let result = stateReplaceField(content, 'Last session', now);
  if (result) { content = result; updated.push('Last session'); }
  result = stateReplaceField(content, 'Last Date', now);
  if (result) { content = result; updated.push('Last Date'); }

  if (options.stopped_at) {
    result = stateReplaceField(content, 'Stopped At', options.stopped_at);
    if (!result) result = stateReplaceField(content, 'Stopped at', options.stopped_at);
    if (result) { content = result; updated.push('Stopped At'); }
  }

  if (updated.length > 0) {
    fs.writeFileSync(statePath, content, 'utf-8');
    output({ recorded: true, updated }, raw, 'true');
  } else {
    output({ recorded: false, reason: 'No session fields found in STATE.md' }, raw, 'false');
  }
}

// =====================================================================
// ROADMAP COMMANDS
// =====================================================================

function cmdRoadmapGetPhase(cwd, phaseNum, raw) {
  const roadmapPath = path.join(cwd, '.plano', 'ROADMAP.md');

  if (!fs.existsSync(roadmapPath)) {
    output({ found: false, error: 'ROADMAP.md not found' }, raw, '');
    return;
  }

  try {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    const escapedPhase = escapeRegex(phaseNum);

    const phasePattern = new RegExp(`#{2,4}\\s*Phase\\s+${escapedPhase}:\\s*([^\\n]+)`, 'i');
    const headerMatch = content.match(phasePattern);

    if (!headerMatch) {
      output({ found: false, phase_number: phaseNum }, raw, '');
      return;
    }

    const phaseName = headerMatch[1].trim();
    const headerIndex = headerMatch.index;
    const restOfContent = content.slice(headerIndex);
    const nextHeaderMatch = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
    const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index : content.length;
    const section = content.slice(headerIndex, sectionEnd).trim();

    const goalMatch = section.match(/\*\*Goal:\*\*\s*([^\n]+)/i);
    const goal = goalMatch ? goalMatch[1].trim() : null;

    output({ found: true, phase_number: phaseNum, phase_name: phaseName, goal, section }, raw, section);
  } catch (e) {
    error('Failed to read ROADMAP.md: ' + e.message);
  }
}

function cmdRoadmapAnalyze(cwd, raw) {
  const roadmapPath = path.join(cwd, '.plano', 'ROADMAP.md');

  if (!fs.existsSync(roadmapPath)) {
    output({ error: 'ROADMAP.md not found', phases: [], current_phase: null }, raw);
    return;
  }

  const content = fs.readFileSync(roadmapPath, 'utf-8');
  const phasesDir = path.join(cwd, '.plano', 'fases');

  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
  const phases = [];
  let match;

  while ((match = phasePattern.exec(content)) !== null) {
    const phaseNum = match[1];
    const phaseName = match[2].replace(/\(INSERTED\)/i, '').trim();

    const sectionStart = match.index;
    const restOfContent = content.slice(sectionStart);
    const nextHeader = restOfContent.match(/\n#{2,4}\s+Phase\s+\d/i);
    const sectionEnd = nextHeader ? sectionStart + nextHeader.index : content.length;
    const section = content.slice(sectionStart, sectionEnd);

    const goalMatch = section.match(/\*\*Goal:\*\*\s*([^\n]+)/i);
    const goal = goalMatch ? goalMatch[1].trim() : null;

    const normalized = normalizePhaseName(phaseNum);
    let diskStatus = 'no_directory';
    let planCount = 0;
    let summaryCount = 0;

    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
      const dirMatch = dirs.find(d => d.startsWith(normalized + '-') || d === normalized);

      if (dirMatch) {
        const phaseFiles = fs.readdirSync(path.join(phasesDir, dirMatch));
        planCount = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
        summaryCount = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;

        if (summaryCount >= planCount && planCount > 0) diskStatus = 'complete';
        else if (summaryCount > 0) diskStatus = 'partial';
        else if (planCount > 0) diskStatus = 'planned';
        else diskStatus = 'empty';
      }
    } catch {}

    const checkboxPattern = new RegExp(`-\\s*\\[(x| )\\]\\s*.*Phase\\s+${escapeRegex(phaseNum)}`, 'i');
    const checkboxMatch = content.match(checkboxPattern);
    const roadmapComplete = checkboxMatch ? checkboxMatch[1] === 'x' : false;

    phases.push({
      number: phaseNum,
      name: phaseName,
      goal,
      plan_count: planCount,
      summary_count: summaryCount,
      disk_status: diskStatus,
      roadmap_complete: roadmapComplete,
    });
  }

  const currentPhase = phases.find(p => p.disk_status === 'planned' || p.disk_status === 'partial') || null;
  const nextPhase = phases.find(p => p.disk_status === 'empty' || p.disk_status === 'no_directory') || null;

  const totalPlans = phases.reduce((sum, p) => sum + p.plan_count, 0);
  const totalSummaries = phases.reduce((sum, p) => sum + p.summary_count, 0);
  const completedPhases = phases.filter(p => p.disk_status === 'complete').length;

  output({
    phases,
    phase_count: phases.length,
    completed_phases: completedPhases,
    total_plans: totalPlans,
    total_summaries: totalSummaries,
    progress_percent: totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0,
    current_phase: currentPhase ? currentPhase.number : null,
    next_phase: nextPhase ? nextPhase.number : null,
  }, raw);
}

function cmdRoadmapUpdatePlanProgress(cwd, phaseNum, raw) {
  if (!phaseNum) error('phase number required for roadmap update-plan-progress');

  const roadmapPath = path.join(cwd, '.plano', 'ROADMAP.md');
  const phaseInfo = findPhaseInternal(cwd, phaseNum);
  if (!phaseInfo) error(`Phase ${phaseNum} not found`);

  const planCount = phaseInfo.plans.length;
  const summaryCount = phaseInfo.summaries.length;

  if (planCount === 0) {
    output({ updated: false, reason: 'No plans found', plan_count: 0, summary_count: 0 }, raw, 'no plans');
    return;
  }

  const isComplete = summaryCount >= planCount;
  const status = isComplete ? 'Complete' : summaryCount > 0 ? 'In Progress' : 'Planned';
  const today = new Date().toISOString().split('T')[0];

  if (!fs.existsSync(roadmapPath)) {
    output({ updated: false, reason: 'ROADMAP.md not found' }, raw, 'no roadmap');
    return;
  }

  let roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
  const phaseEscaped = escapeRegex(phaseNum);

  // Progress table row
  const tablePattern = new RegExp(
    `(\\|\\s*${phaseEscaped}\\.?\\s[^|]*\\|)[^|]*(\\|)\\s*[^|]*(\\|)\\s*[^|]*(\\|)`,
    'i'
  );
  const dateField = isComplete ? ` ${today} ` : '  ';
  roadmapContent = roadmapContent.replace(
    tablePattern,
    `$1 ${summaryCount}/${planCount} $2 ${status.padEnd(11)}$3${dateField}$4`
  );

  // Update plan count in phase detail section
  const planCountPattern = new RegExp(
    `(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`,
    'i'
  );
  const planCountText = isComplete
    ? `${summaryCount}/${planCount} plans complete`
    : `${summaryCount}/${planCount} plans executed`;
  roadmapContent = roadmapContent.replace(planCountPattern, `$1${planCountText}`);

  if (isComplete) {
    const checkboxPattern = new RegExp(
      `(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${phaseEscaped}[:\\s][^\\n]*)`,
      'i'
    );
    roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);
  }

  fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

  output({
    updated: true,
    phase: phaseNum,
    plan_count: planCount,
    summary_count: summaryCount,
    status,
    complete: isComplete,
  }, raw, `${summaryCount}/${planCount} ${status}`);
}

// =====================================================================
// PHASE COMMANDS
// =====================================================================

function cmdPhaseFind(cwd, phase, raw) {
  if (!phase) error('phase identifier required');

  const phasesDir = path.join(cwd, '.plano', 'fases');
  const normalized = normalizePhaseName(phase);
  const notFound = { found: false, directory: null, phase_number: null, phase_name: null, plans: [], summaries: [] };

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
    const match = dirs.find(d => d.startsWith(normalized));
    if (!match) { output(notFound, raw, ''); return; }

    const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)*)-?(.*)/i);
    const phaseNumber = dirMatch ? dirMatch[1] : normalized;
    const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;

    const phaseDir = path.join(phasesDir, match);
    const phaseFiles = fs.readdirSync(phaseDir);
    const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
    const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').sort();

    output({
      found: true,
      directory: toPosixPath(path.join('.plano', 'fases', match)),
      phase_number: phaseNumber,
      phase_name: phaseName,
      plans,
      summaries,
    }, raw, toPosixPath(path.join('.plano', 'fases', match)));
  } catch {
    output(notFound, raw, '');
  }
}

function cmdPhaseAdd(cwd, description, raw) {
  if (!description) error('description required for phase add');

  const roadmapPath = path.join(cwd, '.plano', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) error('ROADMAP.md not found');

  const content = fs.readFileSync(roadmapPath, 'utf-8');
  const slug = generateSlugInternal(description);

  const phasePattern = /#{2,4}\s*Phase\s+(\d+)[A-Z]?(?:\.\d+)*:/gi;
  let maxPhase = 0;
  let m;
  while ((m = phasePattern.exec(content)) !== null) {
    const num = parseInt(m[1], 10);
    if (num > maxPhase) maxPhase = num;
  }

  const newPhaseNum = maxPhase + 1;
  const paddedNum = String(newPhaseNum).padStart(2, '0');
  const dirName = `${paddedNum}-${slug}`;
  const dirPath = path.join(cwd, '.plano', 'fases', dirName);

  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');

  const phaseEntry = `\n### Phase ${newPhaseNum}: ${description}\n\n**Goal:** [To be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${maxPhase}\n**Plans:** 0 plans\n`;

  let updatedContent;
  const lastSeparator = content.lastIndexOf('\n---');
  if (lastSeparator > 0) {
    updatedContent = content.slice(0, lastSeparator) + phaseEntry + content.slice(lastSeparator);
  } else {
    updatedContent = content + phaseEntry;
  }

  fs.writeFileSync(roadmapPath, updatedContent, 'utf-8');

  output({
    phase_number: newPhaseNum,
    padded: paddedNum,
    name: description,
    slug,
    directory: `.plano/fases/${dirName}`,
  }, raw, paddedNum);
}

function cmdPhaseRemove(cwd, targetPhase, options, raw) {
  if (!targetPhase) error('phase number required for phase remove');

  const roadmapPath = path.join(cwd, '.plano', 'ROADMAP.md');
  const phasesDir = path.join(cwd, '.plano', 'fases');
  const force = options.force || false;

  if (!fs.existsSync(roadmapPath)) error('ROADMAP.md not found');

  const normalized = normalizePhaseName(targetPhase);
  const isDecimal = targetPhase.includes('.');

  let targetDir = null;
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
    targetDir = dirs.find(d => d.startsWith(normalized + '-') || d === normalized);
  } catch {}

  // Check for executed work
  if (targetDir && !force) {
    const targetPath = path.join(phasesDir, targetDir);
    const files = fs.readdirSync(targetPath);
    const summaries = files.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
    if (summaries.length > 0) {
      error(`Phase ${targetPhase} has ${summaries.length} executed plan(s). Use --force to remove anyway.`);
    }
  }

  // Delete target directory
  if (targetDir) {
    fs.rmSync(path.join(phasesDir, targetDir), { recursive: true, force: true });
  }

  // Renumber subsequent phases
  const renamedDirs = [];

  if (!isDecimal) {
    const removedInt = parseInt(normalized, 10);
    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));

      const toRename = [];
      for (const dir of dirs) {
        const dm = dir.match(/^(\d+)([A-Z])?(?:\.(\d+))?-(.+)$/i);
        if (!dm) continue;
        const dirInt = parseInt(dm[1], 10);
        if (dirInt > removedInt) {
          toRename.push({ dir, oldInt: dirInt, letter: dm[2] ? dm[2].toUpperCase() : '', decimal: dm[3] ? parseInt(dm[3], 10) : null, slug: dm[4] });
        }
      }

      toRename.sort((a, b) => {
        if (a.oldInt !== b.oldInt) return b.oldInt - a.oldInt;
        return (b.decimal || 0) - (a.decimal || 0);
      });

      for (const item of toRename) {
        const newInt = item.oldInt - 1;
        const newPadded = String(newInt).padStart(2, '0');
        const letterSuffix = item.letter || '';
        const decimalSuffix = item.decimal !== null ? `.${item.decimal}` : '';
        const newPrefix = `${newPadded}${letterSuffix}${decimalSuffix}`;
        const newDirName = `${newPrefix}-${item.slug}`;

        fs.renameSync(path.join(phasesDir, item.dir), path.join(phasesDir, newDirName));
        renamedDirs.push({ from: item.dir, to: newDirName });
      }
    } catch {}
  }

  // Update ROADMAP.md
  let roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

  const targetEscaped = escapeRegex(targetPhase);
  const sectionPattern = new RegExp(
    `\\n?#{2,4}\\s*Phase\\s+${targetEscaped}\\s*:[\\s\\S]*?(?=\\n#{2,4}\\s+Phase\\s+\\d|$)`,
    'i'
  );
  roadmapContent = roadmapContent.replace(sectionPattern, '');

  const checkboxPattern = new RegExp(`\\n?-\\s*\\[[ x]\\]\\s*.*Phase\\s+${targetEscaped}[:\\s][^\\n]*`, 'gi');
  roadmapContent = roadmapContent.replace(checkboxPattern, '');

  if (!isDecimal) {
    const removedInt = parseInt(normalized, 10);
    for (let oldNum = 99; oldNum > removedInt; oldNum--) {
      const newNum = oldNum - 1;
      const oldStr = String(oldNum);
      const newStr = String(newNum);

      roadmapContent = roadmapContent.replace(
        new RegExp(`(#{2,4}\\s*Phase\\s+)${oldStr}(\\s*:)`, 'gi'),
        `$1${newStr}$2`
      );
      roadmapContent = roadmapContent.replace(
        new RegExp(`(Phase\\s+)${oldStr}([:\\s])`, 'g'),
        `$1${newStr}$2`
      );
    }
  }

  fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

  // Update STATE.md phase count
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  if (fs.existsSync(statePath)) {
    let stateContent = fs.readFileSync(statePath, 'utf-8');
    const totalPattern = /(\*\*Total Phases:\*\*\s*)(\d+)/;
    const totalMatch = stateContent.match(totalPattern);
    if (totalMatch) {
      const oldTotal = parseInt(totalMatch[2], 10);
      stateContent = stateContent.replace(totalPattern, `$1${oldTotal - 1}`);
      fs.writeFileSync(statePath, stateContent, 'utf-8');
    }
  }

  output({
    removed: targetPhase,
    directory_deleted: targetDir || null,
    renamed_directories: renamedDirs,
    roadmap_updated: true,
  }, raw);
}

function cmdPhaseComplete(cwd, phaseNum, raw) {
  if (!phaseNum) error('phase number required for phase complete');

  const roadmapPath = path.join(cwd, '.plano', 'ROADMAP.md');
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  const phasesDir = path.join(cwd, '.plano', 'fases');
  const today = new Date().toISOString().split('T')[0];

  const phaseInfo = findPhaseInternal(cwd, phaseNum);
  if (!phaseInfo) error(`Phase ${phaseNum} not found`);

  const planCount = phaseInfo.plans.length;
  const summaryCount = phaseInfo.summaries.length;

  // Update ROADMAP.md
  if (fs.existsSync(roadmapPath)) {
    let roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
    const phaseEscaped = escapeRegex(phaseNum);

    const checkboxPattern = new RegExp(
      `(-\\s*\\[)[ ](\\]\\s*.*Phase\\s+${phaseEscaped}[:\\s][^\\n]*)`,
      'i'
    );
    roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);

    const planCountPattern = new RegExp(
      `(#{2,4}\\s*Phase\\s+${phaseEscaped}[\\s\\S]*?\\*\\*Plans:\\*\\*\\s*)[^\\n]+`,
      'i'
    );
    roadmapContent = roadmapContent.replace(planCountPattern, `$1${summaryCount}/${planCount} plans complete`);

    fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

    // Update REQUIREMENTS.md
    const reqPath = path.join(cwd, '.plano', 'REQUIREMENTS.md');
    if (fs.existsSync(reqPath)) {
      const reqMatch = roadmapContent.match(
        new RegExp(`Phase\\s+${escapeRegex(phaseNum)}[\\s\\S]*?\\*\\*Requirements:\\*\\*\\s*([^\\n]+)`, 'i')
      );
      if (reqMatch) {
        const reqIds = reqMatch[1].replace(/[\[\]]/g, '').split(/[,\s]+/).map(r => r.trim()).filter(Boolean);
        let reqContent = fs.readFileSync(reqPath, 'utf-8');
        for (const reqId of reqIds) {
          const reqEscaped = escapeRegex(reqId);
          reqContent = reqContent.replace(
            new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqEscaped}\\*\\*)`, 'gi'),
            '$1x$2'
          );
        }
        fs.writeFileSync(reqPath, reqContent, 'utf-8');
      }
    }
  }

  // Find next phase
  let nextPhaseNum = null;
  let nextPhaseName = null;
  let isLastPhase = true;

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name)
      .sort((a, b) => comparePhaseNum(a, b));

    for (const dir of dirs) {
      const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)*)-?(.*)/i);
      if (dm && comparePhaseNum(dm[1], phaseNum) > 0) {
        nextPhaseNum = dm[1];
        nextPhaseName = dm[2] || null;
        isLastPhase = false;
        break;
      }
    }
  } catch {}

  // Fallback to ROADMAP.md for next phase
  if (isLastPhase && fs.existsSync(roadmapPath)) {
    try {
      const roadmapForPhases = fs.readFileSync(roadmapPath, 'utf-8');
      const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
      let pm;
      while ((pm = phasePattern.exec(roadmapForPhases)) !== null) {
        if (comparePhaseNum(pm[1], phaseNum) > 0) {
          nextPhaseNum = pm[1];
          nextPhaseName = pm[2].replace(/\(INSERTED\)/i, '').trim();
          isLastPhase = false;
          break;
        }
      }
    } catch {}
  }

  // Update STATE.md
  if (fs.existsSync(statePath)) {
    let stateContent = fs.readFileSync(statePath, 'utf-8');

    stateContent = stateContent.replace(/(\*\*Current Phase:\*\*\s*).*/, `$1${nextPhaseNum || phaseNum}`);
    if (nextPhaseName) {
      stateContent = stateContent.replace(/(\*\*Current Phase Name:\*\*\s*).*/, `$1${nextPhaseName.replace(/-/g, ' ')}`);
    }
    stateContent = stateContent.replace(/(\*\*Status:\*\*\s*).*/, `$1${isLastPhase ? 'Project complete' : 'Ready to plan'}`);
    stateContent = stateContent.replace(/(\*\*Current Plan:\*\*\s*).*/, '$1Not started');
    stateContent = stateContent.replace(/(\*\*Last Activity:\*\*\s*).*/, `$1${today}`);

    fs.writeFileSync(statePath, stateContent, 'utf-8');
  }

  output({
    completed_phase: phaseNum,
    phase_name: phaseInfo.phase_name,
    plans_executed: `${summaryCount}/${planCount}`,
    next_phase: nextPhaseNum,
    next_phase_name: nextPhaseName,
    is_last_phase: isLastPhase,
    date: today,
    roadmap_updated: fs.existsSync(roadmapPath),
    state_updated: fs.existsSync(statePath),
  }, raw);
}

// =====================================================================
// CONFIG COMMANDS
// =====================================================================

function cmdConfigGet(cwd, keyPath, raw) {
  const configPath = path.join(cwd, '.plano', 'config.json');

  if (!keyPath) error('Usage: config get <key.path>');

  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } else {
      error('No config.json found at ' + configPath);
    }
  } catch (err) {
    if (err.message.startsWith('No config.json')) throw err;
    error('Failed to read config.json: ' + err.message);
  }

  const keys = keyPath.split('.');
  let current = config;
  for (const key of keys) {
    if (current === undefined || current === null || typeof current !== 'object') {
      error(`Key not found: ${keyPath}`);
    }
    current = current[key];
  }

  if (current === undefined) error(`Key not found: ${keyPath}`);

  output(current, raw, String(current));
}

function cmdConfigSet(cwd, keyPath, value, raw) {
  const configPath = path.join(cwd, '.plano', 'config.json');

  if (!keyPath) error('Usage: config set <key.path> <value>');

  let parsedValue = value;
  if (value === 'true') parsedValue = true;
  else if (value === 'false') parsedValue = false;
  else if (!isNaN(value) && value !== '') parsedValue = Number(value);

  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (err) {
    error('Failed to read config.json: ' + err.message);
  }

  const keys = keyPath.split('.');
  let current = config;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = parsedValue;

  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    output({ updated: true, key: keyPath, value: parsedValue }, raw, `${keyPath}=${parsedValue}`);
  } catch (err) {
    error('Failed to write config.json: ' + err.message);
  }
}

// =====================================================================
// REQUIREMENTS COMMANDS
// =====================================================================

function cmdRequirementsMarkComplete(cwd, idsArgs, raw) {
  const reqPath = path.join(cwd, '.plano', 'REQUIREMENTS.md');
  if (!fs.existsSync(reqPath)) error('REQUIREMENTS.md not found');

  // Parse IDs from various formats: REQ-01,REQ-02 or REQ-01 REQ-02 or [REQ-01, REQ-02]
  const idsStr = idsArgs.join(' ').replace(/[\[\]]/g, '');
  const ids = idsStr.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);

  if (ids.length === 0) error('No requirement IDs provided');

  let content = fs.readFileSync(reqPath, 'utf-8');
  const updated = [];

  for (const id of ids) {
    const idEscaped = escapeRegex(id);
    const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${idEscaped}\\*\\*)`, 'gi');
    if (checkboxPattern.test(content)) {
      content = content.replace(checkboxPattern, '$1x$2');
      updated.push(id);
    }
    // Also update traceability table
    const tablePattern = new RegExp(`(\\|\\s*${idEscaped}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi');
    content = content.replace(tablePattern, '$1 Complete $2');
  }

  fs.writeFileSync(reqPath, content, 'utf-8');

  output({ marked: updated, count: updated.length }, raw);
}

// =====================================================================
// COMMIT COMMAND
// =====================================================================

function cmdCommit(cwd, message, files, raw) {
  if (!message) error('commit message required');

  const config = loadConfig(cwd);

  if (!config.commit_docs) {
    output({ committed: false, hash: null, reason: 'skipped_commit_docs_false' }, raw, 'skipped');
    return;
  }

  if (isGitIgnored(cwd, '.plano')) {
    output({ committed: false, hash: null, reason: 'skipped_gitignored' }, raw, 'skipped');
    return;
  }

  const filesToStage = files && files.length > 0 ? files : ['.plano/'];
  for (const file of filesToStage) {
    execGit(cwd, ['add', file]);
  }

  const commitResult = execGit(cwd, ['commit', '-m', message]);
  if (commitResult.exitCode !== 0) {
    if (commitResult.stdout.includes('nothing to commit') || commitResult.stderr.includes('nothing to commit')) {
      output({ committed: false, hash: null, reason: 'nothing_to_commit' }, raw, 'nothing');
      return;
    }
    output({ committed: false, hash: null, reason: 'commit_failed', error: commitResult.stderr }, raw, 'failed');
    return;
  }

  const hashResult = execGit(cwd, ['rev-parse', '--short', 'HEAD']);
  const hash = hashResult.exitCode === 0 ? hashResult.stdout : null;
  output({ committed: true, hash, reason: 'committed' }, raw, hash || 'committed');
}

// =====================================================================
// PROGRESS COMMAND
// =====================================================================

function cmdProgress(cwd, format, raw) {
  const phasesDir = path.join(cwd, '.plano', 'fases');
  const phases = [];
  let totalPlans = 0;
  let totalSummaries = 0;

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));

    for (const dir of dirs) {
      const dm = dir.match(/^(\d+(?:\.\d+)*)-?(.*)/);
      const phaseNum = dm ? dm[1] : dir;
      const phaseName = dm && dm[2] ? dm[2].replace(/-/g, ' ') : '';
      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').length;
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').length;

      totalPlans += plans;
      totalSummaries += summaries;

      let status;
      if (plans === 0) status = 'Pending';
      else if (summaries >= plans) status = 'Complete';
      else if (summaries > 0) status = 'In Progress';
      else status = 'Planned';

      phases.push({ number: phaseNum, name: phaseName, plans, summaries, status });
    }
  } catch {}

  const percent = totalPlans > 0 ? Math.min(100, Math.round((totalSummaries / totalPlans) * 100)) : 0;

  if (format === 'table') {
    const barWidth = 10;
    const filled = Math.round((percent / 100) * barWidth);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
    let out = `**Progress:** [${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)\n\n`;
    out += `| Phase | Name | Plans | Status |\n`;
    out += `|-------|------|-------|--------|\n`;
    for (const p of phases) {
      out += `| ${p.number} | ${p.name} | ${p.summaries}/${p.plans} | ${p.status} |\n`;
    }
    output({ rendered: out }, raw, out);
  } else if (format === 'bar') {
    const barWidth = 20;
    const filled = Math.round((percent / 100) * barWidth);
    const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
    const text = `[${bar}] ${totalSummaries}/${totalPlans} plans (${percent}%)`;
    output({ bar: text, percent, completed: totalSummaries, total: totalPlans }, raw, text);
  } else {
    output({ phases, total_plans: totalPlans, total_summaries: totalSummaries, percent }, raw);
  }
}

// =====================================================================
// TIMESTAMP COMMAND
// =====================================================================

function cmdTimestamp(format, raw) {
  const now = new Date();
  let result;

  switch (format) {
    case 'date':
      result = now.toISOString().split('T')[0];
      break;
    case 'filename':
      result = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
      break;
    case 'full':
    default:
      result = now.toISOString();
      break;
  }

  output({ timestamp: result }, raw, result);
}

// =====================================================================
// SLUG COMMAND
// =====================================================================

function cmdSlug(text, raw) {
  if (!text) error('text required for slug generation');

  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  output({ slug }, raw, slug);
}

// --- Run ---
main();
