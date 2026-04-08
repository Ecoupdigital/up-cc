#!/usr/bin/env node

/**
 * UP Tools — CLI utility for UP workflow operations
 *
 * UP Tools — Single file CLI (+ core.cjs).
 *
 * Usage: node up-tools.cjs <command> [args] [--raw] [--cwd <path>]
 *
 * Commands:
 *   init planejar-fase|executar-fase|novo-projeto|rapido|retomar|operacao-fase|progresso|verificar-trabalho|melhorias|ideias|iniciar
 *   state load|get|update|advance-plan|update-progress|add-decision|record-session|record-metric|snapshot|save-session
 *   roadmap get-phase|analyze|update-plan-progress
 *   phase add|remove|find|complete|generate-from-report
 *   config get|set
 *   requirements mark-complete
 *   commit <msg> --files
 *   progress [json|table|bar]
 *   timestamp [full|date|filename]
 *   slug <text>
 *   phase-plan-index <phase>
 *   state-snapshot
 *   summary-extract <path> [--fields field1,field2]
 */

const fs = require('fs');
const path = require('path');
const {
  output, error, loadConfig, isGitIgnored, execGit,
  escapeRegex, normalizePhaseName, comparePhaseNum,
  findPhaseInternal, getRoadmapPhaseInternal,
  pathExistsInternal, generateSlugInternal, toPosixPath,
} = require('./lib/core.cjs');

// --- Frontmatter helpers ---

function extractFrontmatter(content) {
  const frontmatter = {};
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return frontmatter;

  const yaml = match[1];
  const lines = yaml.split('\n');
  let stack = [{ obj: frontmatter, key: null, indent: -1 }];

  for (const line of lines) {
    if (line.trim() === '') continue;
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const current = stack[stack.length - 1];
    const keyMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+):\s*(.*)/);
    if (keyMatch) {
      const key = keyMatch[2];
      const value = keyMatch[3].trim();
      if (value === '' || value === '[') {
        current.obj[key] = value === '[' ? [] : {};
        current.key = null;
        stack.push({ obj: current.obj[key], key: null, indent });
      } else if (value.startsWith('[') && value.endsWith(']')) {
        current.obj[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        current.key = null;
      } else {
        current.obj[key] = value.replace(/^["']|["']$/g, '');
        current.key = null;
      }
    } else if (line.trim().startsWith('- ')) {
      const itemValue = line.trim().slice(2).replace(/^["']|["']$/g, '');
      if (typeof current.obj === 'object' && !Array.isArray(current.obj) && Object.keys(current.obj).length === 0) {
        const parent = stack.length > 1 ? stack[stack.length - 2] : null;
        if (parent) {
          for (const k of Object.keys(parent.obj)) {
            if (parent.obj[k] === current.obj) {
              parent.obj[k] = [itemValue];
              current.obj = parent.obj[k];
              break;
            }
          }
        }
      } else if (Array.isArray(current.obj)) {
        current.obj.push(itemValue);
      }
    }
  }
  return frontmatter;
}

function extractObjective(content) {
  const m = content.match(/<objective>\s*\n?\s*(.+)/);
  return m ? m[1].trim() : null;
}

function getMilestoneInfo(cwd) {
  try {
    const roadmap = fs.readFileSync(path.join(cwd, '.plano', 'ROADMAP.md'), 'utf-8');
    const inProgressMatch = roadmap.match(/🚧\s*\*\*v(\d+\.\d+)\s+([^*]+)\*\*/);
    if (inProgressMatch) {
      return { version: 'v' + inProgressMatch[1], name: inProgressMatch[2].trim() };
    }
    const cleaned = roadmap.replace(/<details>[\s\S]*?<\/details>/gi, '');
    const headingMatch = cleaned.match(/## .*v(\d+\.\d+)[:\s]+([^\n(]+)/);
    if (headingMatch) {
      return { version: 'v' + headingMatch[1], name: headingMatch[2].trim() };
    }
    const versionMatch = cleaned.match(/v(\d+\.\d+)/);
    return { version: versionMatch ? 'v' + versionMatch[1] : 'v0.1', name: 'MVP' };
  } catch {
    return { version: 'v0.1', name: 'MVP' };
  }
}

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
        case 'operacao-fase':
          cmdInitOperacaoFase(cwd, args[2], raw);
          break;
        case 'progresso':
          cmdInitProgresso(cwd, raw);
          break;
        case 'verificar-trabalho':
          cmdInitVerificarTrabalho(cwd, args[2], raw);
          break;
        case 'melhorias':
          cmdInitMelhorias(cwd, raw);
          break;
        case 'ideias':
          cmdInitIdeias(cwd, raw);
          break;
        case 'iniciar':
          cmdInitIniciar(cwd, raw);
          break;
        default:
          error(`Unknown init workflow: ${workflow}\nAvailable: planejar-fase, executar-fase, novo-projeto, rapido, retomar, operacao-fase, progresso, verificar-trabalho, melhorias, ideias, iniciar`);
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
      } else if (sub === 'record-metric') {
        const phaseIdx = args.indexOf('--phase');
        const planIdx = args.indexOf('--plan');
        const durationIdx = args.indexOf('--duration');
        const tasksIdx = args.indexOf('--tasks');
        const filesIdx = args.indexOf('--files');
        cmdStateRecordMetric(cwd, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
          plan: planIdx !== -1 ? args[planIdx + 1] : null,
          duration: durationIdx !== -1 ? args[durationIdx + 1] : null,
          tasks: tasksIdx !== -1 ? args[tasksIdx + 1] : null,
          files: filesIdx !== -1 ? args[filesIdx + 1] : null,
        }, raw);
      } else if (sub === 'snapshot') {
        cmdStateSnapshot(cwd, raw);
      } else if (sub === 'save-session') {
        const summaryIdx = args.indexOf('--summary');
        const decisionIdx = args.indexOf('--decision');
        const phaseIdx = args.indexOf('--phase');
        const noCommitIdx = args.indexOf('--no-commit');
        cmdStateSaveSession(cwd, {
          summary: summaryIdx !== -1 ? args[summaryIdx + 1] : null,
          decision: decisionIdx !== -1 ? args[decisionIdx + 1] : null,
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
          no_commit: noCommitIdx !== -1,
        }, raw);
      } else {
        error('Unknown state subcommand. Available: load, get, update, advance-plan, update-progress, add-decision, record-session, record-metric, snapshot, save-session');
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
      } else if (sub === 'generate-from-report') {
        cmdPhaseGenerateFromReport(cwd, args.slice(2), raw);
      } else {
        error('Unknown phase subcommand. Available: find, add, remove, complete, generate-from-report');
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

    // ==================== PHASE-PLAN-INDEX ====================
    case 'phase-plan-index': {
      cmdPhasePlanIndex(cwd, args[1], raw);
      break;
    }

    // ==================== STATE-SNAPSHOT ====================
    case 'state-snapshot': {
      cmdStateSnapshot(cwd, raw);
      break;
    }

    // ==================== SUMMARY-EXTRACT ====================
    case 'summary-extract': {
      const fieldsIdx = args.indexOf('--fields');
      const fields = fieldsIdx !== -1 ? args[fieldsIdx + 1].split(',') : [];
      cmdSummaryExtract(cwd, args[1], fields, raw);
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

  // Check if codebase mapping exists
  const hasCodebaseMap = pathExistsInternal(cwd, '.plano/codebase');
  let codebaseFiles = [];
  if (hasCodebaseMap) {
    try {
      const fs = require('fs');
      codebaseFiles = fs.readdirSync(path.join(cwd, '.plano/codebase'))
        .filter(f => f.endsWith('.md'))
        .map(f => `.plano/codebase/${f}`);
    } catch {}
  }

  const result = {
    commit_docs: config.commit_docs,
    project_exists: pathExistsInternal(cwd, '.plano/PROJECT.md'),
    planning_exists: pathExistsInternal(cwd, '.plano'),
    has_existing_code: hasCode,
    has_codebase_map: hasCodebaseMap,
    codebase_files: codebaseFiles,
    has_git: pathExistsInternal(cwd, '.git'),
    project_path: '.plano/PROJECT.md',
  };

  output(result, raw);
}

function cmdInitIniciar(cwd, raw) {
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

  const hasCodebaseMap = pathExistsInternal(cwd, '.plano/codebase');
  let codebaseFiles = [];
  if (hasCodebaseMap) {
    try {
      codebaseFiles = fs.readdirSync(path.join(cwd, '.plano/codebase'))
        .filter(f => f.endsWith('.md'))
        .map(f => `.plano/codebase/${f}`);
    } catch {}
  }

  // Stack hints from package.json
  const pkgPath = path.join(cwd, 'package.json');
  let stackHints = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    stackHints = {
      has_react: !!allDeps.react,
      has_next: !!allDeps.next,
      has_vue: !!allDeps.vue,
      has_nuxt: !!allDeps.nuxt,
      has_svelte: !!allDeps.svelte,
      has_tailwind: !!allDeps.tailwindcss,
      has_prisma: !!(allDeps['@prisma/client'] || allDeps.prisma),
      has_typescript: !!(allDeps.typescript || pathExistsInternal(cwd, 'tsconfig.json')),
      type_module: pkg.type === 'module',
    };
  } catch {}

  const result = {
    commit_docs: config.commit_docs,
    project_exists: pathExistsInternal(cwd, '.plano/PROJECT.md'),
    planning_exists: pathExistsInternal(cwd, '.plano'),
    has_existing_code: hasCode,
    has_codebase_map: hasCodebaseMap,
    codebase_files: codebaseFiles,
    has_git: pathExistsInternal(cwd, '.git'),
    has_package_json: pathExistsInternal(cwd, 'package.json'),
    has_readme: pathExistsInternal(cwd, 'README.md') || pathExistsInternal(cwd, 'readme.md'),
    stack_hints: stackHints,
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

function cmdInitOperacaoFase(cwd, phase, raw) {
  const config = loadConfig(cwd);
  let phaseInfo = findPhaseInternal(cwd, phase);

  if (!phaseInfo) {
    const roadmapPhase = getRoadmapPhaseInternal(cwd, phase);
    if (roadmapPhase?.found) {
      const phaseName = roadmapPhase.phase_name;
      phaseInfo = {
        found: true,
        directory: null,
        phase_number: roadmapPhase.phase_number,
        phase_name: phaseName,
        phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
        plans: [],
        summaries: [],
        incomplete_plans: [],
        has_research: false,
        has_context: false,
        has_verification: false,
      };
    }
  }

  const result = {
    commit_docs: config.commit_docs,
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,
    padded_phase: phaseInfo?.phase_number?.padStart(2, '0') || null,
    has_research: phaseInfo?.has_research || false,
    has_context: phaseInfo?.has_context || false,
    has_plans: (phaseInfo?.plans?.length || 0) > 0,
    has_verification: false,
    plan_count: phaseInfo?.plans?.length || 0,
    roadmap_exists: pathExistsInternal(cwd, '.plano/ROADMAP.md'),
    plano_exists: pathExistsInternal(cwd, '.plano'),
    state_path: '.plano/STATE.md',
    roadmap_path: '.plano/ROADMAP.md',
  };

  if (phaseInfo?.directory) {
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
      if (contextFile) result.context_path = toPosixPath(path.join(phaseInfo.directory, contextFile));
      const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
      if (researchFile) result.research_path = toPosixPath(path.join(phaseInfo.directory, researchFile));
      const verificationFile = files.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
      if (verificationFile) {
        result.verification_path = toPosixPath(path.join(phaseInfo.directory, verificationFile));
        result.has_verification = true;
      }
    } catch {}
  }

  output(result, raw);
}

function cmdInitProgresso(cwd, raw) {
  const config = loadConfig(cwd);
  const milestone = getMilestoneInfo(cwd);

  const fasesDir = path.join(cwd, '.plano', 'fases');
  const phases = [];
  let currentPhase = null;
  let nextPhase = null;

  try {
    const entries = fs.readdirSync(fasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dir of dirs) {
      const match = dir.match(/^(\d+(?:\.\d+)*)-?(.*)/);
      const phaseNumber = match ? match[1] : dir;
      const phaseName = match && match[2] ? match[2] : null;

      const phasePath = path.join(fasesDir, dir);
      const phaseFiles = fs.readdirSync(phasePath);

      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
      const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');

      const status = summaries.length >= plans.length && plans.length > 0 ? 'complete' :
                     plans.length > 0 ? 'in_progress' :
                     hasResearch ? 'researched' : 'pending';

      const phaseInfo = {
        number: phaseNumber,
        name: phaseName,
        directory: '.plano/fases/' + dir,
        status,
        plan_count: plans.length,
        summary_count: summaries.length,
        has_research: hasResearch,
      };

      phases.push(phaseInfo);

      if (!currentPhase && (status === 'in_progress' || status === 'researched')) {
        currentPhase = phaseInfo;
      }
      if (!nextPhase && status === 'pending') {
        nextPhase = phaseInfo;
      }
    }
  } catch {}

  let pausedAt = null;
  try {
    const state = fs.readFileSync(path.join(cwd, '.plano', 'STATE.md'), 'utf-8');
    const pauseMatch = state.match(/\*\*Paused At:\*\*\s*(.+)/);
    if (pauseMatch) pausedAt = pauseMatch[1].trim();
  } catch {}

  const result = {
    commit_docs: config.commit_docs,
    milestone_version: milestone.version,
    milestone_name: milestone.name,
    phases,
    phase_count: phases.length,
    completed_count: phases.filter(p => p.status === 'complete').length,
    in_progress_count: phases.filter(p => p.status === 'in_progress').length,
    current_phase: currentPhase,
    next_phase: nextPhase,
    paused_at: pausedAt,
    has_work_in_progress: !!currentPhase,
    state_exists: pathExistsInternal(cwd, '.plano/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.plano/ROADMAP.md'),
    project_exists: pathExistsInternal(cwd, '.plano/PROJECT.md'),
    state_path: '.plano/STATE.md',
    roadmap_path: '.plano/ROADMAP.md',
    project_path: '.plano/PROJECT.md',
  };

  output(result, raw);
}

function cmdInitVerificarTrabalho(cwd, phase, raw) {
  if (!phase) error('phase required for init verificar-trabalho');

  const config = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);

  let hasVerification = false;
  if (phaseInfo?.directory) {
    try {
      const files = fs.readdirSync(path.join(cwd, phaseInfo.directory));
      hasVerification = files.some(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
    } catch {}
  }

  const result = {
    commit_docs: config.commit_docs,
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    has_verification: hasVerification,
  };

  output(result, raw);
}

function cmdInitMelhorias(cwd, raw) {
  const config = loadConfig(cwd);
  const now = new Date();

  // Detectar stack hints do projeto para ajustar auditoria
  const pkgPath = path.join(cwd, 'package.json');
  let stackHints = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    stackHints = {
      has_react: !!allDeps.react,
      has_next: !!allDeps.next,
      has_vue: !!allDeps.vue,
      has_nuxt: !!allDeps.nuxt,
      has_svelte: !!allDeps.svelte,
      has_tailwind: !!allDeps.tailwindcss,
      has_prisma: !!(allDeps['@prisma/client'] || allDeps.prisma),
      has_typescript: !!(allDeps.typescript || pathExistsInternal(cwd, 'tsconfig.json')),
      type_module: pkg.type === 'module',
    };
  } catch {}

  const result = {
    planning_exists: pathExistsInternal(cwd, '.plano'),
    melhorias_dir: '.plano/melhorias',
    melhorias_exists: pathExistsInternal(cwd, '.plano/melhorias'),
    has_claude_md: pathExistsInternal(cwd, 'CLAUDE.md'),
    has_package_json: pathExistsInternal(cwd, 'package.json'),
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),
    commit_docs: config.commit_docs,
    stack_hints: stackHints,
  };

  output(result, raw);
}

function cmdInitIdeias(cwd, raw) {
  const config = loadConfig(cwd);
  const now = new Date();

  // Detectar stack hints do projeto para contextualizar analise
  const pkgPath = path.join(cwd, 'package.json');
  let stackHints = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    stackHints = {
      has_react: !!allDeps.react,
      has_next: !!allDeps.next,
      has_vue: !!allDeps.vue,
      has_nuxt: !!allDeps.nuxt,
      has_svelte: !!allDeps.svelte,
      has_tailwind: !!allDeps.tailwindcss,
      has_prisma: !!(allDeps['@prisma/client'] || allDeps.prisma),
      has_typescript: !!(allDeps.typescript || pathExistsInternal(cwd, 'tsconfig.json')),
      type_module: pkg.type === 'module',
    };
  } catch {}

  const result = {
    planning_exists: pathExistsInternal(cwd, '.plano'),
    ideias_dir: '.plano/ideias',
    ideias_exists: pathExistsInternal(cwd, '.plano/ideias'),
    has_claude_md: pathExistsInternal(cwd, 'CLAUDE.md'),
    has_package_json: pathExistsInternal(cwd, 'package.json'),
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),
    commit_docs: config.commit_docs,
    stack_hints: stackHints,
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

function cmdStateRecordMetric(cwd, options, raw) {
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  if (!fs.existsSync(statePath)) { output({ error: 'STATE.md not found' }, raw); return; }

  let content = fs.readFileSync(statePath, 'utf-8');
  const { phase, plan, duration, tasks, files } = options;

  if (!phase || !plan || !duration) {
    output({ error: 'phase, plan, and duration required' }, raw);
    return;
  }

  const metricsPattern = /(##\s*Performance Metrics[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n)([\s\S]*?)(?=\n##|\n$|$)/i;
  const metricsMatch = content.match(metricsPattern);

  if (metricsMatch) {
    let tableBody = metricsMatch[2].trimEnd();
    const newRow = `| Phase ${phase} P${plan} | ${duration} | ${tasks || '-'} tasks | ${files || '-'} files |`;

    if (tableBody.trim() === '' || tableBody.includes('None yet')) {
      tableBody = newRow;
    } else {
      tableBody = tableBody + '\n' + newRow;
    }

    content = content.replace(metricsPattern, (_match, header) => `${header}${tableBody}\n`);
    fs.writeFileSync(statePath, content, 'utf-8');
    output({ recorded: true, phase, plan, duration }, raw, 'true');
  } else {
    output({ recorded: false, reason: 'Performance Metrics section not found in STATE.md' }, raw, 'false');
  }
}

function cmdStateSnapshot(cwd, raw) {
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  if (!fs.existsSync(statePath)) { output({ error: 'STATE.md not found' }, raw); return; }

  const content = fs.readFileSync(statePath, 'utf-8');

  const currentPhase = stateExtractField(content, 'Current Phase');
  const currentPhaseName = stateExtractField(content, 'Current Phase Name');
  const totalPhasesRaw = stateExtractField(content, 'Total Phases');
  const currentPlan = stateExtractField(content, 'Current Plan');
  const totalPlansRaw = stateExtractField(content, 'Total Plans in Phase');
  const status = stateExtractField(content, 'Status');
  const progressRaw = stateExtractField(content, 'Progress');
  const lastActivity = stateExtractField(content, 'Last Activity');
  const pausedAt = stateExtractField(content, 'Paused At');

  const totalPhases = totalPhasesRaw ? parseInt(totalPhasesRaw, 10) : null;
  const totalPlansInPhase = totalPlansRaw ? parseInt(totalPlansRaw, 10) : null;
  const progressPercent = progressRaw ? parseInt(progressRaw.replace('%', ''), 10) : null;

  const decisions = [];
  const decisionsMatch = content.match(/##\s*Decisions Made[\s\S]*?\n\|[^\n]+\n\|[-|\s]+\n([\s\S]*?)(?=\n##|\n$|$)/i);
  if (decisionsMatch) {
    const rows = decisionsMatch[1].trim().split('\n').filter(r => r.includes('|'));
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        decisions.push({ phase: cells[0], summary: cells[1], rationale: cells[2] });
      }
    }
  }

  const blockers = [];
  const blockersMatch = content.match(/##\s*Blockers\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (blockersMatch) {
    const items = blockersMatch[1].match(/^-\s+(.+)$/gm) || [];
    for (const item of items) {
      blockers.push(item.replace(/^-\s+/, '').trim());
    }
  }

  const session = { last_date: null, stopped_at: null, resume_file: null };
  const sessionMatch = content.match(/##\s*Session\s*\n([\s\S]*?)(?=\n##|$)/i);
  if (sessionMatch) {
    const s = sessionMatch[1];
    const ld = s.match(/\*\*Last Date:\*\*\s*(.+)/i) || s.match(/^Last Date:\s*(.+)/im);
    const sa = s.match(/\*\*Stopped At:\*\*\s*(.+)/i) || s.match(/^Stopped At:\s*(.+)/im);
    const rf = s.match(/\*\*Resume File:\*\*\s*(.+)/i) || s.match(/^Resume File:\s*(.+)/im);
    if (ld) session.last_date = ld[1].trim();
    if (sa) session.stopped_at = sa[1].trim();
    if (rf) session.resume_file = rf[1].trim();
  }

  output({
    current_phase: currentPhase,
    current_phase_name: currentPhaseName,
    total_phases: totalPhases,
    current_plan: currentPlan,
    total_plans_in_phase: totalPlansInPhase,
    status,
    progress_percent: progressPercent,
    last_activity: lastActivity,
    decisions,
    blockers,
    paused_at: pausedAt,
    session,
  }, raw);
}

function cmdStateSaveSession(cwd, options, raw) {
  const statePath = path.join(cwd, '.plano', 'STATE.md');
  if (!fs.existsSync(statePath)) { output({ error: 'STATE.md not found — project not initialized with UP' }, raw); return; }

  const { summary, decision, phase, no_commit } = options;
  if (!summary) { output({ error: '--summary required: describe what was done in this session' }, raw); return; }

  let content = fs.readFileSync(statePath, 'utf-8');
  const now = new Date().toISOString();
  const actions = [];

  // 1. Update session timestamp (try both PT and EN field names)
  const sessionFields = ['Ultima sessao', 'Last session', 'Last Date'];
  for (const field of sessionFields) {
    let result = stateReplaceField(content, field, now);
    if (result) { content = result; if (!actions.includes('timestamp')) actions.push('timestamp'); }
  }

  // 2. Update stopped-at with summary (try both PT and EN)
  const stoppedFields = ['Parou em', 'Stopped At', 'Stopped at'];
  for (const field of stoppedFields) {
    let result = stateReplaceField(content, field, summary);
    if (result) { content = result; if (!actions.includes('stopped_at')) actions.push('stopped_at'); break; }
  }

  // 3. Update last activity (try both PT and EN)
  const shortDate = now.split('T')[0];
  const shortSummary = summary.length > 80 ? summary.substring(0, 77) + '...' : summary;
  const activityFields = ['Ultima atividade', 'Last activity'];
  for (const field of activityFields) {
    let result = stateReplaceField(content, field, `${shortDate} -- ${shortSummary}`);
    if (result) { content = result; if (!actions.includes('last_activity')) actions.push('last_activity'); break; }
  }

  // 4. Add decision if provided
  if (decision) {
    const phaseLabel = phase || '?';
    const entry = `- [Phase ${phaseLabel}]: ${decision}`;
    const sectionPattern = /(###?\s*(?:Decisoes|Decisions|Decisions Made|Accumulated.*Decisions)\s*\n)([\s\S]*?)(?=\n###?|\n##[^#]|$)/i;
    const match = content.match(sectionPattern);
    if (match) {
      let sectionBody = match[2];
      sectionBody = sectionBody.replace(/None yet\.?\s*\n?/gi, '').replace(/No decisions yet\.?\s*\n?/gi, '').replace(/Nenhuma ainda\.?\s*\n?/gi, '');
      sectionBody = sectionBody.trimEnd() + '\n' + entry + '\n';
      content = content.replace(sectionPattern, (_match, header) => `${header}${sectionBody}`);
      actions.push('decision');
    }
  }

  // 5. Write STATE.md
  fs.writeFileSync(statePath, content, 'utf-8');

  // 6. Auto-commit unless --no-commit
  let committed = false;
  if (!no_commit) {
    try {
      execGit(cwd, ['add', statePath]);
      const diffResult = execGit(cwd, ['diff', '--cached', '--name-only']);
      const hasChanges = (diffResult.stdout || '').trim();
      if (hasChanges) {
        execGit(cwd, ['commit', '-m', `docs(state): ${shortSummary}`]);
        committed = true;
      }
    } catch (e) {
      // commit failed — not critical, state was still saved to disk
    }
  }

  output({ saved: true, actions, committed, summary: shortSummary }, raw, 'true');
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

    const phasePattern = new RegExp(`#{2,4}\\s*(?:Phase|Fase)\\s+${escapedPhase}:\\s*([^\\n]+)`, 'i');
    const headerMatch = content.match(phasePattern);

    if (!headerMatch) {
      output({ found: false, phase_number: phaseNum }, raw, '');
      return;
    }

    const phaseName = headerMatch[1].trim();
    const headerIndex = headerMatch.index;
    const restOfContent = content.slice(headerIndex);
    const nextHeaderMatch = restOfContent.match(/\n#{2,4}\s+(?:Phase|Fase)\s+\d/i);
    const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index : content.length;
    const section = content.slice(headerIndex, sectionEnd).trim();

    const goalMatch = section.match(/\*\*(?:Goal|Objetivo):\*\*\s*([^\n]+)/i);
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

  const phasePattern = /#{2,4}\s*(?:Phase|Fase)\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
  const phases = [];
  let match;

  while ((match = phasePattern.exec(content)) !== null) {
    const phaseNum = match[1];
    const phaseName = match[2].replace(/\(INSERTED\)/i, '').trim();

    const sectionStart = match.index;
    const restOfContent = content.slice(sectionStart);
    const nextHeader = restOfContent.match(/\n#{2,4}\s+(?:Phase|Fase)\s+\d/i);
    const sectionEnd = nextHeader ? sectionStart + nextHeader.index : content.length;
    const section = content.slice(sectionStart, sectionEnd);

    const goalMatch = section.match(/\*\*(?:Goal|Objetivo):\*\*\s*([^\n]+)/i);
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

    const checkboxPattern = new RegExp(`-\\s*\\[(x| )\\]\\s*.*(?:Phase|Fase)\\s+${escapeRegex(phaseNum)}`, 'i');
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
    `(#{2,4}\\s*(?:Phase|Fase)\\s+${phaseEscaped}[\\s\\S]*?\\*\\*(?:Plans|Planos):\\*\\*\\s*)[^\\n]+`,
    'i'
  );
  const planCountText = isComplete
    ? `${summaryCount}/${planCount} plans complete`
    : `${summaryCount}/${planCount} plans executed`;
  roadmapContent = roadmapContent.replace(planCountPattern, `$1${planCountText}`);

  if (isComplete) {
    const checkboxPattern = new RegExp(
      `(-\\s*\\[)[ ](\\]\\s*.*(?:Phase|Fase)\\s+${phaseEscaped}[:\\s][^\\n]*)`,
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

  const phasePattern = /#{2,4}\s*(?:Phase|Fase)\s+(\d+)[A-Z]?(?:\.\d+)*:/gi;
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

  // Detect ROADMAP language: if it contains '### Fase ' use Portuguese, otherwise English
  const usePt = /###\s*Fase\s+\d/.test(content);
  const phaseEntry = usePt
    ? `\n### Fase ${newPhaseNum}: ${description}\n\n**Objetivo:** [A ser planejado]\n**Requisitos**: TBD\n**Depende de:** Fase ${maxPhase}\n**Planos:** 0 planos\n`
    : `\n### Phase ${newPhaseNum}: ${description}\n\n**Goal:** [To be planned]\n**Requirements**: TBD\n**Depends on:** Phase ${maxPhase}\n**Plans:** 0 plans\n`;

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
    `\\n?#{2,4}\\s*(?:Phase|Fase)\\s+${targetEscaped}\\s*:[\\s\\S]*?(?=\\n#{2,4}\\s+(?:Phase|Fase)\\s+\\d|$)`,
    'i'
  );
  roadmapContent = roadmapContent.replace(sectionPattern, '');

  const checkboxPattern = new RegExp(`\\n?-\\s*\\[[ x]\\]\\s*.*(?:Phase|Fase)\\s+${targetEscaped}[:\\s][^\\n]*`, 'gi');
  roadmapContent = roadmapContent.replace(checkboxPattern, '');

  if (!isDecimal) {
    const removedInt = parseInt(normalized, 10);
    for (let oldNum = 99; oldNum > removedInt; oldNum--) {
      const newNum = oldNum - 1;
      const oldStr = String(oldNum);
      const newStr = String(newNum);

      roadmapContent = roadmapContent.replace(
        new RegExp(`(#{2,4}\\s*(?:Phase|Fase)\\s+)${oldStr}(\\s*:)`, 'gi'),
        `$1${newStr}$2`
      );
      roadmapContent = roadmapContent.replace(
        new RegExp(`((?:Phase|Fase)\\s+)${oldStr}([:\\s])`, 'g'),
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
      `(-\\s*\\[)[ ](\\]\\s*.*(?:Phase|Fase)\\s+${phaseEscaped}[:\\s][^\\n]*)`,
      'i'
    );
    roadmapContent = roadmapContent.replace(checkboxPattern, `$1x$2 (completed ${today})`);

    const planCountPattern = new RegExp(
      `(#{2,4}\\s*(?:Phase|Fase)\\s+${phaseEscaped}[\\s\\S]*?\\*\\*(?:Plans|Planos):\\*\\*\\s*)[^\\n]+`,
      'i'
    );
    roadmapContent = roadmapContent.replace(planCountPattern, `$1${summaryCount}/${planCount} plans complete`);

    fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

    // Update REQUIREMENTS.md
    const reqPath = path.join(cwd, '.plano', 'REQUIREMENTS.md');
    if (fs.existsSync(reqPath)) {
      const reqMatch = roadmapContent.match(
        new RegExp(`(?:Phase|Fase)\\s+${escapeRegex(phaseNum)}[\\s\\S]*?\\*\\*(?:Requirements|Requisitos):\\*\\*\\s*([^\\n]+)`, 'i')
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
      const phasePattern = /#{2,4}\s*(?:Phase|Fase)\s+(\d+[A-Z]?(?:\.\d+)*)\s*:\s*([^\n]+)/gi;
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

// --- Phase Generate From Report ---

function cmdPhaseGenerateFromReport(cwd, args, raw) {
  // Parse input: try stdin JSON first, fall back to args
  let source = null;
  let reportPath = null;
  let approvedIds = [];
  let grouping = 'auto';

  let stdinData = null;
  try {
    const stdinRaw = fs.readFileSync('/dev/stdin', 'utf-8').trim();
    if (stdinRaw) {
      stdinData = JSON.parse(stdinRaw);
    }
  } catch {
    // stdin not available or not JSON -- use args
  }

  if (stdinData) {
    source = stdinData.source || null;
    reportPath = stdinData.report_path || null;
    approvedIds = stdinData.approved_ids || [];
    grouping = stdinData.grouping || 'auto';
  } else {
    source = args[0] || null;
    reportPath = args[1] || null;
    const idsArg = args.slice(2).join(',');
    approvedIds = idsArg ? idsArg.split(',').map(s => s.trim()).filter(Boolean) : [];
    // Check for --grouping flag
    const groupIdx = args.indexOf('--grouping');
    if (groupIdx !== -1 && args[groupIdx + 1]) {
      grouping = args[groupIdx + 1];
    }
  }

  if (!source) error('source required (melhorias or ideias)');
  if (!reportPath) error('report_path required');
  if (approvedIds.length === 0) error('approved_ids required (at least one ID)');

  // Read the report file
  const fullReportPath = path.join(cwd, reportPath);
  if (!fs.existsSync(fullReportPath)) {
    error(`Report file not found: ${reportPath}`);
  }
  const reportContent = fs.readFileSync(fullReportPath, 'utf-8');

  // Parse suggestions from report
  const suggestions = parseSuggestionsFromReport(reportContent, approvedIds);

  if (suggestions.length === 0) {
    error(`No approved suggestions found in report. IDs requested: ${approvedIds.join(', ')}`);
  }

  // Group suggestions into phases
  const groups = grouping === 'single'
    ? [{ name: buildGroupName(source, suggestions), suggestions }]
    : groupSuggestionsByDimension(suggestions, source);

  // Read ROADMAP to detect language and max phase
  const roadmapPath = path.join(cwd, '.plano', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) error('ROADMAP.md not found');
  let roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

  const usePt = /###\s*Fase\s+\d/.test(roadmapContent);

  // Find max phase number
  const phaseNumPattern = /#{2,4}\s*(?:Phase|Fase)\s+(\d+)[A-Z]?(?:\.\d+)*:/gi;
  let maxPhase = 0;
  let pm;
  while ((pm = phaseNumPattern.exec(roadmapContent)) !== null) {
    const num = parseInt(pm[1], 10);
    if (num > maxPhase) maxPhase = num;
  }

  const phasesCreated = [];

  for (const group of groups) {
    const newPhaseNum = maxPhase + 1;
    maxPhase = newPhaseNum;
    const paddedNum = String(newPhaseNum).padStart(2, '0');
    const slug = generateSlugInternal(group.name).substring(0, 50);
    const dirName = `${paddedNum}-${slug}`;
    const dirPath = path.join(cwd, '.plano', 'fases', dirName);

    // Create phase directory
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');

    // Build criteria
    const criteria = buildCriteria(group.suggestions, source, usePt);

    // Build suggestion list
    const suggestionList = group.suggestions.map(s => {
      const effortLabel = usePt ? 'Esforco' : 'Effort';
      const impactLabel = usePt ? 'Impacto' : 'Impact';
      return `- ${s.id}: ${s.title} (${effortLabel}: ${s.effort}, ${impactLabel}: ${s.impact})`;
    }).join('\n');

    // Build the phase entry
    let phaseEntry;
    if (usePt) {
      const criteriaText = criteria.map((c, i) => `  ${i + 1}. ${c}`).join('\n');
      phaseEntry = `\n### Fase ${newPhaseNum}: ${group.name}\n` +
        `**Objetivo**: Implementar ${group.suggestions.length} ${source === 'ideias' ? 'ideias' : 'melhorias'} de ${group.dimension || 'multiplas dimensoes'} identificadas pela auditoria\n` +
        `**Depende de**: Fase ${newPhaseNum - 1}\n` +
        `**Criterios de Sucesso** (o que deve ser VERDADE):\n${criteriaText}\n` +
        `**Planos**: TBD\n\n` +
        `Sugestoes incluidas:\n${suggestionList}\n`;
    } else {
      const criteriaText = criteria.map((c, i) => `  ${i + 1}. ${c}`).join('\n');
      phaseEntry = `\n### Phase ${newPhaseNum}: ${group.name}\n` +
        `**Goal**: Implement ${group.suggestions.length} ${source === 'ideias' ? 'ideas' : 'improvements'} for ${group.dimension || 'multiple dimensions'} identified by audit\n` +
        `**Depends on**: Phase ${newPhaseNum - 1}\n` +
        `**Success Criteria** (what must be TRUE):\n${criteriaText}\n` +
        `**Plans**: TBD\n\n` +
        `Included suggestions:\n${suggestionList}\n`;
    }

    // Insert phase entry before progress table or at end
    const tableHeaderPattern = /\n##\s*(?:Tabela de Progresso|Progress Table)/i;
    const tableMatch = roadmapContent.match(tableHeaderPattern);
    if (tableMatch) {
      roadmapContent = roadmapContent.slice(0, tableMatch.index) + phaseEntry + roadmapContent.slice(tableMatch.index);
    } else {
      roadmapContent += phaseEntry;
    }

    // Add checkbox in Fases/Phases section
    const checkboxSectionPattern = /\n(##\s*(?:Fases|Phases)\s*\n)/i;
    const checkboxSection = roadmapContent.match(checkboxSectionPattern);
    if (checkboxSection) {
      // Find the last checkbox line in the section
      const sectionStart = checkboxSection.index + checkboxSection[0].length;
      const sectionRest = roadmapContent.slice(sectionStart);
      const lastCheckboxEnd = findLastCheckboxEnd(sectionRest);
      const insertPos = sectionStart + lastCheckboxEnd;
      const label = usePt ? 'Fase' : 'Phase';
      const shortDesc = group.suggestions.length + (usePt ? ' sugestoes de ' : ' suggestions for ') + (group.dimension || source);
      const checkboxLine = `\n- [ ] **${label} ${newPhaseNum}: ${group.name}** - ${shortDesc}`;
      roadmapContent = roadmapContent.slice(0, insertPos) + checkboxLine + roadmapContent.slice(insertPos);
    }

    // Add row in progress table
    const progressTablePattern = /(\|\s*(?:Fase|Phase)\s*\|[^\n]*\n\|[-|\s]+\n)([\s\S]*?)(?=\n##|\n$|$)/i;
    const progressMatch = roadmapContent.match(progressTablePattern);
    if (progressMatch) {
      const tableBody = progressMatch[2].trimEnd();
      const statusLabel = usePt ? 'Nao iniciado' : 'Not started';
      const newRow = `| ${newPhaseNum}. ${group.name} | 0/? | ${statusLabel} | - |`;
      const newTableBody = tableBody + '\n' + newRow;
      roadmapContent = roadmapContent.replace(progressTablePattern,
        (_match, header) => `${header}${newTableBody}\n`
      );
    }

    phasesCreated.push({
      phase_number: newPhaseNum,
      name: group.name,
      suggestion_count: group.suggestions.length,
      suggestion_ids: group.suggestions.map(s => s.id),
      directory: `.plano/fases/${dirName}/`,
    });
  }

  // Write updated ROADMAP
  fs.writeFileSync(roadmapPath, roadmapContent, 'utf-8');

  output({
    phases_created: phasesCreated,
    total_phases: phasesCreated.length,
    total_suggestions: suggestions.length,
    roadmap_updated: true,
  }, raw);
}

// --- Helper: Parse suggestions from RELATORIO.md ---

function parseSuggestionsFromReport(content, approvedIds) {
  const suggestions = [];
  const idSet = new Set(approvedIds.map(id => id.toUpperCase()));

  // Match suggestion blocks: ### ID: title
  const suggestionPattern = /###\s+([\w-]+):\s*([^\n]+)/g;
  let match;

  while ((match = suggestionPattern.exec(content)) !== null) {
    const id = match[1].trim().toUpperCase();
    if (!idSet.has(id)) continue;

    const title = match[2].trim();
    const blockStart = match.index;

    // Find the end of this suggestion block (next ### or end)
    const restContent = content.slice(blockStart + match[0].length);
    const nextSuggestion = restContent.match(/\n###\s+[\w-]+:/);
    const blockEnd = nextSuggestion
      ? blockStart + match[0].length + nextSuggestion.index
      : content.length;
    const block = content.slice(blockStart, blockEnd);

    // Parse table fields
    const arquivo = extractTableField(block, 'Arquivo');
    const dimensao = extractTableField(block, 'Dimensao') || extractTableField(block, 'Dimension');
    const esforco = extractTableField(block, 'Esforco') || extractTableField(block, 'Effort');
    const impacto = extractTableField(block, 'Impacto') || extractTableField(block, 'Impact');

    // Parse Problema/Sugestao
    const problemaMatch = block.match(/\*\*(?:Problema|Problem):\*\*\s*([\s\S]*?)(?=\*\*(?:Sugestao|Suggestion|Referencia|Reference):\*\*|$)/i);
    const sugestaoMatch = block.match(/\*\*(?:Sugestao|Suggestion):\*\*\s*([\s\S]*?)(?=\*\*(?:Referencia|Reference):\*\*|$)/i);

    suggestions.push({
      id: match[1].trim(), // preserve original case
      title,
      file: arquivo ? arquivo.replace(/`/g, '') : null,
      dimension: dimensao ? dimensao.split(/\s*\(/)[0].trim() : null,
      effort: esforco || '?',
      impact: impacto || '?',
      problem: problemaMatch ? problemaMatch[1].trim() : null,
      suggestion: sugestaoMatch ? sugestaoMatch[1].trim() : null,
    });
  }

  return suggestions;
}

function extractTableField(block, fieldName) {
  const pattern = new RegExp(`\\|\\s*${fieldName}\\s*\\|\\s*([^|]+)\\|`, 'i');
  const match = block.match(pattern);
  return match ? match[1].trim() : null;
}

// --- Helper: Group suggestions by dimension ---

function groupSuggestionsByDimension(suggestions, source) {
  // Group by primary dimension
  const dimensionMap = {};
  for (const s of suggestions) {
    const dim = s.dimension || 'Geral';
    if (!dimensionMap[dim]) dimensionMap[dim] = [];
    dimensionMap[dim].push(s);
  }

  const groups = [];

  for (const [dim, items] of Object.entries(dimensionMap)) {
    // If 5+ suggestions in a dimension, try to subdivide by directory
    if (items.length >= 5) {
      const dirMap = {};
      for (const item of items) {
        const dir = item.file ? path.dirname(item.file) : '_root';
        if (!dirMap[dir]) dirMap[dir] = [];
        dirMap[dir].push(item);
      }

      const dirKeys = Object.keys(dirMap);
      if (dirKeys.length > 1) {
        for (const [dir, dirItems] of Object.entries(dirMap)) {
          const dirLabel = dir === '_root' ? 'raiz' : dir.replace(/\//g, '/');
          groups.push({
            name: `${dim}: ${buildSubgroupName(dirItems, source)} (${dirLabel})`,
            dimension: dim,
            suggestions: dirItems,
          });
        }
        continue;
      }
    }

    groups.push({
      name: `${dim}: ${buildSubgroupName(items, source)}`,
      dimension: dim,
      suggestions: items,
    });
  }

  // Merge small groups: if a group has only 1 suggestion with small effort, try to merge
  const mergedGroups = [];
  const pendingMerge = [];

  for (const group of groups) {
    if (group.suggestions.length === 1 && group.suggestions[0].effort === 'P') {
      pendingMerge.push(group);
    } else {
      mergedGroups.push(group);
    }
  }

  // Try to merge pending into adjacent groups of same dimension
  for (const pending of pendingMerge) {
    const target = mergedGroups.find(g => g.dimension === pending.dimension);
    if (target) {
      target.suggestions.push(...pending.suggestions);
      // Update name if needed
      target.name = `${target.dimension}: ${buildSubgroupName(target.suggestions, source)}`;
    } else {
      mergedGroups.push(pending);
    }
  }

  return mergedGroups;
}

function buildSubgroupName(suggestions, source) {
  if (suggestions.length === 1) {
    return suggestions[0].title;
  }
  // Synthesize a short name from titles
  const uniqueWords = new Set();
  for (const s of suggestions) {
    const words = s.title.split(/\s+/).slice(0, 3);
    for (const w of words) {
      if (w.length > 3) uniqueWords.add(w.toLowerCase());
    }
  }
  const wordList = [...uniqueWords].slice(0, 4).join(', ');
  const prefix = source === 'ideias' ? 'Ideias sobre' : 'Melhorias em';
  return `${prefix} ${wordList}`;
}

function buildGroupName(source, suggestions) {
  const prefix = source === 'ideias' ? 'Ideias' : 'Melhorias';
  return `${prefix}: ${suggestions.length} sugestoes aprovadas`;
}

// --- Helper: Build success criteria ---

function buildCriteria(suggestions, source, usePt) {
  if (suggestions.length <= 5) {
    return suggestions.map(s => {
      if (usePt) {
        const prefix = source === 'ideias' ? 'Feature' : 'Sugestao';
        return `${prefix} ${s.id} implementada: ${s.title}`;
      } else {
        const prefix = source === 'ideias' ? 'Feature' : 'Suggestion';
        return `${prefix} ${s.id} implemented: ${s.title}`;
      }
    });
  }

  // More than 5 suggestions: summarize
  const dimCounts = {};
  for (const s of suggestions) {
    const dim = s.dimension || 'Geral';
    dimCounts[dim] = (dimCounts[dim] || 0) + 1;
  }

  const criteria = [];
  for (const [dim, count] of Object.entries(dimCounts)) {
    if (usePt) {
      criteria.push(`${count} sugestoes de ${dim} implementadas conforme RELATORIO.md`);
    } else {
      criteria.push(`${count} ${dim} suggestions implemented per RELATORIO.md`);
    }
  }

  if (criteria.length > 5) {
    if (usePt) {
      return [`${suggestions.length} sugestoes implementadas conforme RELATORIO.md`];
    } else {
      return [`${suggestions.length} suggestions implemented per RELATORIO.md`];
    }
  }

  return criteria;
}

// --- Helper: Find end of last checkbox line ---

function findLastCheckboxEnd(text) {
  let lastEnd = 0;
  const checkboxRegex = /^-\s*\[[ x]\]\s*\*\*.*\n/gm;
  let m;
  while ((m = checkboxRegex.exec(text)) !== null) {
    lastEnd = m.index + m[0].length;
  }
  return lastEnd;
}

function cmdPhasePlanIndex(cwd, phase, raw) {
  if (!phase) error('phase required for phase-plan-index');

  const fasesDir = path.join(cwd, '.plano', 'fases');
  const normalized = normalizePhaseName(phase);

  let phaseDir = null;
  try {
    const entries = fs.readdirSync(fasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
    const match = dirs.find(d => d.startsWith(normalized));
    if (match) phaseDir = path.join(fasesDir, match);
  } catch {}

  if (!phaseDir) {
    output({ phase: normalized, error: 'Phase not found', plans: [], waves: {}, incomplete: [], has_checkpoints: false }, raw);
    return;
  }

  const phaseFiles = fs.readdirSync(phaseDir);
  const planFiles = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
  const summaryFiles = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');

  const completedPlanIds = new Set(
    summaryFiles.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', ''))
  );

  const plans = [];
  const waves = {};
  const incomplete = [];
  let hasCheckpoints = false;

  for (const planFile of planFiles) {
    const planId = planFile.replace('-PLAN.md', '').replace('PLAN.md', '');
    const planPath = path.join(phaseDir, planFile);
    const content = fs.readFileSync(planPath, 'utf-8');
    const fm = extractFrontmatter(content);

    const xmlTasks = content.match(/<task[\s>]/gi) || [];
    const mdTasks = content.match(/##\s*Task\s*\d+/gi) || [];
    const taskCount = xmlTasks.length || mdTasks.length;

    const wave = parseInt(fm.wave, 10) || 1;

    let autonomous = true;
    if (fm.autonomous !== undefined) {
      autonomous = fm.autonomous === 'true' || fm.autonomous === true;
    }
    if (!autonomous) hasCheckpoints = true;

    let filesModified = [];
    const fmFiles = fm['files_modified'] || fm['files-modified'];
    if (fmFiles) {
      filesModified = Array.isArray(fmFiles) ? fmFiles : [fmFiles];
    }

    const hasSummary = completedPlanIds.has(planId);
    if (!hasSummary) incomplete.push(planId);

    plans.push({
      id: planId,
      wave,
      autonomous,
      objective: extractObjective(content) || fm.objective || null,
      files_modified: filesModified,
      task_count: taskCount,
      has_summary: hasSummary,
    });

    const waveKey = String(wave);
    if (!waves[waveKey]) waves[waveKey] = [];
    waves[waveKey].push(planId);
  }

  output({ phase: normalized, plans, waves, incomplete, has_checkpoints: hasCheckpoints }, raw);
}

function cmdSummaryExtract(cwd, summaryPath, fields, raw) {
  if (!summaryPath) error('summary-path required for summary-extract');

  const fullPath = path.join(cwd, summaryPath);
  if (!fs.existsSync(fullPath)) {
    output({ error: 'File not found', path: summaryPath }, raw);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const fm = extractFrontmatter(content);

  const parseDecisions = (decisionsList) => {
    if (!decisionsList || !Array.isArray(decisionsList)) return [];
    return decisionsList.map(d => {
      const colonIdx = d.indexOf(':');
      if (colonIdx > 0) {
        return { summary: d.substring(0, colonIdx).trim(), rationale: d.substring(colonIdx + 1).trim() };
      }
      return { summary: d, rationale: null };
    });
  };

  const fullResult = {
    path: summaryPath,
    one_liner: fm['one-liner'] || null,
    key_files: fm['key-files'] || [],
    tech_added: (fm['tech-stack'] && fm['tech-stack'].added) || [],
    patterns: fm['patterns-established'] || [],
    decisions: parseDecisions(fm['key-decisions']),
    requirements_completed: fm['requirements-completed'] || [],
  };

  if (fields && fields.length > 0) {
    const filtered = { path: summaryPath };
    for (const field of fields) {
      if (fullResult[field] !== undefined) filtered[field] = fullResult[field];
    }
    output(filtered, raw);
    return;
  }

  output(fullResult, raw);
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
