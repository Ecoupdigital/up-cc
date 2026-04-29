/**
 * Core — Shared utilities, constants, and internal helpers for UP CLI
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Path helpers ---

/** Normalize a relative path to always use forward slashes (cross-platform). */
function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

// --- Output helpers ---

function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    if (json.length > 200000) {
      const tmpPath = path.join(require('os').tmpdir(), `up-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}

function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}

// --- File & Config utilities ---

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// --- Model presets ---

const MODEL_PRESETS = {
  'opus-completo': {
    descricao: 'Opus em tudo (maximo qualidade, maximo custo)',
    planning: 'opus',
    execution: 'opus',
    governance: 'opus',
    review: 'opus',
  },
  'hibrido': {
    descricao: 'Opus planeja e governa, Sonnet executa (melhor custo-beneficio)',
    planning: 'opus',
    execution: 'sonnet',
    governance: 'opus',
    review: 'opus',
  },
  'sonnet-completo': {
    descricao: 'Sonnet em tudo (rapido e economico)',
    planning: 'sonnet',
    execution: 'sonnet',
    governance: 'sonnet',
    review: 'sonnet',
  },
  'economico': {
    descricao: 'Sonnet planeja e executa, Haiku governa (maximo economia)',
    planning: 'sonnet',
    execution: 'sonnet',
    governance: 'haiku',
    review: 'sonnet',
  },
  'custom': {
    descricao: 'Configuracao manual por papel',
    planning: null,
    execution: null,
    governance: null,
    review: null,
  },
};

// Map agent names to their model role
const AGENT_ROLE_MAP = {
  // Planning
  'up-planejador': 'planning',
  'up-arquiteto': 'planning',
  'up-product-analyst': 'planning',
  'up-system-designer': 'planning',
  'up-roteirista': 'planning',
  'up-pesquisador-projeto': 'planning',
  'up-sintetizador': 'planning',
  'up-mapeador-codigo': 'planning',
  'up-requirements-validator': 'planning',
  // Execution
  'up-executor': 'execution',
  'up-frontend-specialist': 'execution',
  'up-backend-specialist': 'execution',
  'up-database-specialist': 'execution',
  'up-devops-agent': 'execution',
  'up-technical-writer': 'execution',
  'up-depurador': 'execution',
  // Governance (supervisors + chiefs + CEO)
  'up-execution-supervisor': 'governance',
  'up-verification-supervisor': 'governance',
  'up-planning-supervisor': 'governance',
  'up-quality-supervisor': 'governance',
  'up-audit-supervisor': 'governance',
  'up-product-supervisor': 'governance',
  'up-architecture-supervisor': 'governance',
  'up-operations-supervisor': 'governance',
  'up-chief-engineer': 'governance',
  'up-chief-architect': 'governance',
  'up-chief-quality': 'governance',
  'up-chief-operations': 'governance',
  'up-chief-product': 'governance',
  'up-project-ceo': 'governance',
  'up-delivery-auditor': 'governance',
  'up-planning-auditor': 'governance',
  // Review & Testing
  'up-verificador': 'review',
  'up-blind-validator': 'review',
  'up-code-reviewer': 'review',
  'up-security-reviewer': 'review',
  'up-visual-critic': 'review',
  'up-exhaustive-tester': 'review',
  'up-api-tester': 'review',
  'up-qa-agent': 'review',
  'up-auditor-ux': 'review',
  'up-auditor-performance': 'review',
  'up-auditor-modernidade': 'review',
  'up-sintetizador-melhorias': 'review',
  'up-analista-codigo': 'review',
  'up-pesquisador-mercado': 'review',
  'up-consolidador-ideias': 'review',
};

function loadConfig(cwd) {
  const configPath = path.join(cwd, '.plano', 'config.json');
  const defaults = {
    modo: 'solo',
    paralelizacao: true,
    commit_docs: true,
    auto_advance: false,
    instrumentation: { enabled: true },
    budget_ceiling: null,
  };

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);

    return {
      modo: parsed.modo ?? defaults.modo,
      paralelizacao: parsed.paralelizacao ?? defaults.paralelizacao,
      commit_docs: parsed.commit_docs ?? defaults.commit_docs,
      auto_advance: parsed.auto_advance ?? defaults.auto_advance,
      modelos: parsed.modelos ?? null,
      instrumentation: parsed.instrumentation ?? defaults.instrumentation,
      budget_ceiling: parsed.budget_ceiling ?? defaults.budget_ceiling,
    };
  } catch {
    return defaults;
  }
}

/**
 * Resolve the model for a given agent based on config.
 * Returns model string (opus/sonnet/haiku) or null (use runtime default).
 */
function resolveAgentModel(cwd, agentName) {
  const config = loadConfig(cwd);
  const modelConfig = config.modelos;

  // No model config = runtime decides (v0.6.0 default behavior)
  if (!modelConfig) return null;

  const preset = modelConfig.preset;
  if (!preset || preset === 'runtime') return null;

  // Custom: check per-role overrides
  const role = AGENT_ROLE_MAP[agentName];
  if (!role) return null;

  if (preset === 'custom') {
    return modelConfig[role] || null;
  }

  // Named preset
  const presetConfig = MODEL_PRESETS[preset];
  if (!presetConfig) return null;

  return presetConfig[role] || null;
}

// --- Git utilities ---

function isGitIgnored(cwd, targetPath) {
  try {
    execSync('git check-ignore -q --no-index -- ' + targetPath.replace(/[^a-zA-Z0-9._\-/]/g, ''), {
      cwd,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function execGit(cwd, args) {
  try {
    const escaped = args.map(a => {
      if (/^[a-zA-Z0-9._\-/=:@]+$/.test(a)) return a;
      return "'" + a.replace(/'/g, "'\\''") + "'";
    });
    const stdout = execSync('git ' + escaped.join(' '), {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return { exitCode: 0, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: (err.stdout ?? '').toString().trim(),
      stderr: (err.stderr ?? '').toString().trim(),
    };
  }
}

// --- Phase utilities ---

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePhaseName(phase) {
  const match = String(phase).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  if (!match) return phase;
  const padded = match[1].padStart(2, '0');
  const letter = match[2] ? match[2].toUpperCase() : '';
  const decimal = match[3] || '';
  return padded + letter + decimal;
}

function comparePhaseNum(a, b) {
  const pa = String(a).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  const pb = String(b).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  if (!pa || !pb) return String(a).localeCompare(String(b));
  const intDiff = parseInt(pa[1], 10) - parseInt(pb[1], 10);
  if (intDiff !== 0) return intDiff;
  const la = (pa[2] || '').toUpperCase();
  const lb = (pb[2] || '').toUpperCase();
  if (la !== lb) {
    if (!la) return -1;
    if (!lb) return 1;
    return la < lb ? -1 : 1;
  }
  const aDecParts = pa[3] ? pa[3].slice(1).split('.').map(p => parseInt(p, 10)) : [];
  const bDecParts = pb[3] ? pb[3].slice(1).split('.').map(p => parseInt(p, 10)) : [];
  const maxLen = Math.max(aDecParts.length, bDecParts.length);
  if (aDecParts.length === 0 && bDecParts.length > 0) return -1;
  if (bDecParts.length === 0 && aDecParts.length > 0) return 1;
  for (let i = 0; i < maxLen; i++) {
    const av = Number.isFinite(aDecParts[i]) ? aDecParts[i] : 0;
    const bv = Number.isFinite(bDecParts[i]) ? bDecParts[i] : 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function searchPhaseInDir(baseDir, relBase, normalized) {
  try {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort((a, b) => comparePhaseNum(a, b));
    const match = dirs.find(d => d.startsWith(normalized));
    if (!match) return null;

    const dirMatch = match.match(/^(\d+[A-Z]?(?:\.\d+)*)-?(.*)/i);
    const phaseNumber = dirMatch ? dirMatch[1] : normalized;
    const phaseName = dirMatch && dirMatch[2] ? dirMatch[2] : null;
    const phaseDir = path.join(baseDir, match);
    const phaseFiles = fs.readdirSync(phaseDir);

    const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md').sort();
    const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md').sort();
    const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
    const hasContext = phaseFiles.some(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');

    const completedPlanIds = new Set(
      summaries.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', ''))
    );
    const incompletePlans = plans.filter(p => {
      const planId = p.replace('-PLAN.md', '').replace('PLAN.md', '');
      return !completedPlanIds.has(planId);
    });

    return {
      found: true,
      directory: toPosixPath(path.join(relBase, match)),
      phase_number: phaseNumber,
      phase_name: phaseName,
      phase_slug: phaseName ? phaseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null,
      plans,
      summaries,
      incomplete_plans: incompletePlans,
      has_research: hasResearch,
      has_context: hasContext,
    };
  } catch {
    return null;
  }
}

function findPhaseInternal(cwd, phase) {
  if (!phase) return null;

  const phasesDir = path.join(cwd, '.plano', 'fases');
  const normalized = normalizePhaseName(phase);

  return searchPhaseInDir(phasesDir, '.plano/fases', normalized);
}

// --- Roadmap utilities ---

function getRoadmapPhaseInternal(cwd, phaseNum) {
  if (!phaseNum) return null;
  const roadmapPath = path.join(cwd, '.plano', 'ROADMAP.md');
  if (!fs.existsSync(roadmapPath)) return null;

  try {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    const escapedPhase = escapeRegex(phaseNum.toString());
    const phasePattern = new RegExp(`#{2,4}\\s*(?:Phase|Fase)\\s+${escapedPhase}:\\s*([^\\n]+)`, 'i');
    const headerMatch = content.match(phasePattern);
    if (!headerMatch) return null;

    const phaseName = headerMatch[1].trim();
    const headerIndex = headerMatch.index;
    const restOfContent = content.slice(headerIndex);
    const nextHeaderMatch = restOfContent.match(/\n#{2,4}\s+(?:Phase|Fase)\s+\d/i);
    const sectionEnd = nextHeaderMatch ? headerIndex + nextHeaderMatch.index : content.length;
    const section = content.slice(headerIndex, sectionEnd).trim();

    const goalMatch = section.match(/\*\*(?:Goal|Objetivo):\*\*\s*([^\n]+)/i);
    const goal = goalMatch ? goalMatch[1].trim() : null;

    return {
      found: true,
      phase_number: phaseNum.toString(),
      phase_name: phaseName,
      goal,
      section,
    };
  } catch {
    return null;
  }
}

// --- Misc utilities ---

function pathExistsInternal(cwd, targetPath) {
  const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(cwd, targetPath);
  try {
    fs.statSync(fullPath);
    return true;
  } catch {
    return false;
  }
}

function generateSlugInternal(text) {
  if (!text) return null;
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

module.exports = {
  output,
  error,
  safeReadFile,
  loadConfig,
  resolveAgentModel,
  MODEL_PRESETS,
  AGENT_ROLE_MAP,
  isGitIgnored,
  execGit,
  escapeRegex,
  normalizePhaseName,
  comparePhaseNum,
  searchPhaseInDir,
  findPhaseInternal,
  getRoadmapPhaseInternal,
  pathExistsInternal,
  generateSlugInternal,
  toPosixPath,
};
