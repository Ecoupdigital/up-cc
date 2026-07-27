'use strict';

/**
 * Leitor unico do historico do log de aprovacoes.
 * Localiza campo por CONTEUDO, nunca por posicao fixa de coluna.
 * Alvo: leitura de historico (linhas de 5 e 6 colunas, notacoes fase=N e phase-N).
 */

const fs = require('fs');
const path = require('path');

// --- Listas fechadas ---

// Lista fechada: palavras de veredito e seus canonicos.
const DECISION_WORDS = {
  APPROVE: { canonical: 'APPROVE', verdict_bearing: true, forced: false },
  APPROVED: { canonical: 'APPROVE', verdict_bearing: true, forced: false },
  APPROVE_DELIVERY: { canonical: 'APPROVE', verdict_bearing: true, forced: false },
  REQUEST_CHANGES: { canonical: 'REQUEST_CHANGES', verdict_bearing: true, forced: false },
  BLOCK: { canonical: 'BLOCK', verdict_bearing: true, forced: false },
  BLOCKED: { canonical: 'BLOCK', verdict_bearing: true, forced: false },
  FORCED_APPROVAL: { canonical: 'APPROVE', verdict_bearing: true, forced: true },
  CONFIRMED: { canonical: 'CONFIRMED', verdict_bearing: false, forced: false },
};

// Lista fechada: aliases de tipo de evidencia (documentados + gravados em disco).
const EVIDENCE_TYPE_ALIASES = {
  logic: 'logic',
  test: 'logic',
  tests: 'logic',
  ui: 'ui',
  visual: 'ui',
  glue: 'glue',
  smoke: 'glue',
  integration: 'glue',
  seams: 'seams',
};

// Lista fechada: resultados que contam como pass.
const PASS_RESULTS = new Set([
  'pass',
  'passed',
  'ok',
  'test_pass',
  'smoke',
  'visual',
  'red-green',
  'redgreen',
  'confirmed',
  'exempted',
]);

// --- parseApprovalLine ---

/**
 * Parseia uma linha do log. Devolve null quando nao carrega palavra de veredito.
 */
function parseApprovalLine(line, lineNumber) {
  if (line == null) return null;
  const raw = String(line);
  const fields = raw.split('|').map((s) => s.trim());

  let decision = null;
  let decision_raw = null;
  let verdict_bearing = false;
  let forced = false;

  for (const field of fields) {
    const whole = field.toUpperCase();
    if (DECISION_WORDS[whole]) {
      const info = DECISION_WORDS[whole];
      decision = info.canonical;
      decision_raw = field;
      verdict_bearing = info.verdict_bearing;
      forced = info.forced;
      break;
    }
    const firstToken = field
      .split(/\s+/)[0]
      .replace(/[.,;:!?]+$/, '')
      .toUpperCase();
    if (DECISION_WORDS[firstToken]) {
      const info = DECISION_WORDS[firstToken];
      decision = info.canonical;
      decision_raw = firstToken;
      verdict_bearing = info.verdict_bearing;
      forced = info.forced;
      break;
    }
  }

  // Unica razao de descarte: sem palavra de veredito.
  if (decision == null) return null;

  let phase = null;
  let notation = null;
  const phaseRe = /(?:^|[^a-z])(?:phase|fase)\s*[-=:\s]\s*0*(\d{1,3})(?![0-9])/i;
  for (const field of fields) {
    const m = field.match(phaseRe);
    if (m) {
      phase = Number(m[1]);
      // Trecho exato que casou
      const exact = field.match(/((?:phase|fase)\s*[-=:\s]\s*0*\d{1,3})/i);
      notation = exact ? exact[1].trim() : m[0].trim();
      break;
    }
  }
  // Tambem procura na linha inteira (caso phase-N sem espaco extra)
  if (phase == null) {
    const m = raw.match(phaseRe);
    if (m) {
      phase = Number(m[1]);
      const exact = raw.match(/((?:phase|fase)\s*[-=:\s]\s*0*\d{1,3})/i);
      notation = exact ? exact[1].trim() : m[0].trim();
    }
  }

  let plan = null;
  const planRe = /(?:plan|plano)\s*[-=:\s]\s*0*(\d{1,3})(?![0-9])/i;
  const planM = raw.match(planRe);
  if (planM) plan = Number(planM[1]);

  let scope_kind = null;
  for (const field of fields) {
    const low = field.toLowerCase();
    if (low === 'planning' || low === 'architecture' || low === 'delivery') {
      scope_kind = low;
      break;
    }
  }
  if (scope_kind == null && phase != null) scope_kind = 'phase';

  let agent = null;
  for (const field of fields) {
    if (/^up-[a-z-]+$/.test(field)) {
      agent = field;
      break;
    }
  }

  const evidence = [];
  const evRe = /evidence=([A-Za-z_]+):([A-Za-z0-9_.-]+)/g;
  let em;
  while ((em = evRe.exec(raw)) !== null) {
    const type_raw = em[1];
    const result = em[2];
    const type = EVIDENCE_TYPE_ALIASES[type_raw.toLowerCase()] || type_raw;
    evidence.push({
      raw: em[0],
      type,
      type_raw,
      result,
      is_pass: PASS_RESULTS.has(result.toLowerCase()),
    });
  }

  let timestamp = null;
  for (const field of fields) {
    if (/^\d{4}-\d{2}-\d{2}T/.test(field)) {
      timestamp = field;
      break;
    }
  }

  return {
    raw,
    line_number: lineNumber,
    fields,
    decision,
    decision_raw,
    verdict_bearing,
    forced,
    phase,
    notation,
    plan,
    scope_kind,
    agent,
    evidence,
    timestamp,
  };
}

// --- readApprovals ---

/**
 * Le o log de aprovacoes. Fail-open: arquivo ausente devolve exists:false.
 */
function readApprovals({ cwd, logPath } = {}) {
  const root = cwd || process.cwd();
  const rel = logPath || path.join('.plano', 'governance', 'approvals.log');
  const full = path.isAbsolute(rel) ? rel : path.join(root, rel);
  const result = {
    log_path: full,
    exists: false,
    lines_total: 0,
    entries: [],
    ignored: [],
  };

  let text;
  try {
    text = fs.readFileSync(full, 'utf-8');
  } catch {
    return result;
  }

  result.exists = true;
  const lines = text.split(/\r?\n/);
  result.lines_total = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    const entry = parseApprovalLine(line, i + 1);
    if (entry == null) {
      result.ignored.push({
        line_number: i + 1,
        raw: line,
        reason: 'no_verdict_word',
      });
    } else {
      result.entries.push(entry);
    }
  }

  return result;
}

// --- verdictForPhase ---

/**
 * Seleciona entradas por phase numerica ou por scope_kind.
 * Ultima entrada com verdict_bearing decide o veredito.
 */
function verdictForPhase(read, selector) {
  const byPhase = selector && selector.phase != null;
  const byScope = selector && selector.scope != null;

  const matched = (read.entries || []).filter((e) => {
    if (byPhase) return e.phase === Number(selector.phase);
    if (byScope) return e.scope_kind === selector.scope;
    return false;
  });

  const verdictBearing = matched.filter((e) => e.verdict_bearing === true);
  const last = verdictBearing.length
    ? verdictBearing[verdictBearing.length - 1]
    : null;

  const evidenceMap = new Map();
  for (const e of matched) {
    for (const ev of e.evidence || []) {
      if (!evidenceMap.has(ev.raw)) evidenceMap.set(ev.raw, ev);
    }
  }
  const evidence = Array.from(evidenceMap.values());
  const evidence_types = [];
  for (const ev of evidence) {
    if (!evidence_types.includes(ev.type)) evidence_types.push(ev.type);
  }

  const seams_confirmed = evidence.some(
    (ev) => ev.type === 'seams' && ev.is_pass === true
  );

  return {
    found: matched.length > 0,
    phase: byPhase ? Number(selector.phase) : null,
    scope: byScope ? selector.scope : null,
    entries_matched: matched.length,
    decision: last ? last.decision : null,
    forced: last ? last.forced : false,
    decision_line: last ? last.raw : null,
    decision_line_number: last ? last.line_number : null,
    notation: last ? last.notation : (matched[0] ? matched[0].notation : null),
    agent: last ? last.agent : (matched[0] ? matched[0].agent : null),
    evidence,
    evidence_types,
    seams_confirmed,
  };
}

// --- evaluateGate ---

/**
 * Avalia se o veredito passa nos checks pedidos.
 * @returns {{ pass: boolean, reasons: string[] }}
 */
function evaluateGate(verdict, { expectEvidence, requireSeams } = {}) {
  const reasons = [];

  if (!verdict || !verdict.found) {
    reasons.push('no_entry');
  } else {
    if (verdict.decision == null) {
      reasons.push('no_decision');
    } else if (verdict.decision !== 'APPROVE') {
      reasons.push('decision_not_approve');
    }

    if (expectEvidence) {
      const want = EVIDENCE_TYPE_ALIASES[String(expectEvidence).toLowerCase()]
        || String(expectEvidence).toLowerCase();
      const types = (verdict.evidence_types || []).map((t) =>
        EVIDENCE_TYPE_ALIASES[String(t).toLowerCase()] || String(t).toLowerCase()
      );
      if (types.length === 0) {
        reasons.push('evidence_missing');
      } else if (!types.includes(want)) {
        reasons.push('evidence_type_mismatch');
      }
    }

    if (requireSeams && verdict.seams_confirmed !== true) {
      reasons.push('seams_missing');
    }
  }

  return { pass: reasons.length === 0, reasons };
}

// --- Fronteiras de teste (plan-ready / PROVA-02, PROVA-03) ---

// Lista fechada: tipos de fronteira aceitos.
const SEAM_TIPOS = ['modulo', 'interface', 'comando', 'rota'];

/**
 * Heuristica fechada: o texto parece caminho de arquivo?
 * Rota como POST /api/auth/login NAO casa nenhuma das tres, e isso e intencional.
 */
function pareceCaminho(texto) {
  const s = String(texto || '');
  // (a) prefixo de sistema de arquivos, relativo ou absoluto
  if (/(^|\s)(\.{1,2}\/|\/(home|usr|etc|var|opt|tmp)\/)/.test(s)) return true;
  // (b) caminho com extensao de arquivo fonte
  if (/[\w-]+\/[\w./-]*\.(md|js|cjs|mjs|ts|tsx|jsx|py|json|ya?ml|toml|sh|css|html)\b/.test(s)) {
    return true;
  }
  // (c) prefixos de diretorio de projeto
  if (/^(src|lib|app|up|bin|tests|scripts|components|pages)\//.test(s)) return true;
  return false;
}

/**
 * Analisador dedicado do bloco seams: no frontmatter.
 * O analisador generico do up-tools nao entende lista de mapeamentos.
 * @returns {Array|null} null quando seams: ausente; array (possivelmente vazio) quando presente
 */
function parseSeamsBlock(frontmatterText) {
  if (frontmatterText == null) return null;
  const lines = String(frontmatterText).split(/\r?\n/);
  let start = -1;
  let baseIndent = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === 'seams:') {
      start = i;
      const m = lines[i].match(/^(\s*)/);
      baseIndent = m ? m[1].length : 0;
      break;
    }
  }
  if (start < 0) return null;

  const items = [];
  let current = null;

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    if (indent <= baseIndent) break;

    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      current = {};
      items.push(current);
      const rest = trimmed.slice(2);
      const km = rest.match(/^([a-z_]+):\s*(.*)$/);
      if (km) {
        let val = km[2].trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        current[km[1]] = val;
      }
      continue;
    }

    const km = trimmed.match(/^([a-z_]+):\s*(.*)$/);
    if (km && current) {
      let val = km[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      current[km[1]] = val;
    }
  }

  return items;
}

/**
 * Valida o campo de fronteiras no PLAN-READY.md.
 * Legado (sem plan_schema ou schema < 2): achados viram warnings com sufixo _legacy, pass=true.
 * plan_ready_missing e erro nos dois casos.
 */
function checkPlanReadySeams({ cwd, planPath } = {}) {
  const root = cwd || process.cwd();
  const rel = planPath || path.join('.plano', 'PLAN-READY.md');
  const full = path.isAbsolute(rel) ? rel : path.join(root, rel);

  const base = {
    path: full,
    exists: false,
    pass: false,
    errors: [],
    warnings: [],
    seams: [],
    seam_count: 0,
    schema: null,
    legacy: true,
  };

  let text;
  try {
    text = fs.readFileSync(full, 'utf-8');
  } catch {
    base.errors = ['plan_ready_missing'];
    return base;
  }

  base.exists = true;

  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fmText = fmMatch ? fmMatch[1] : '';

  let schema = null;
  const schemaM = fmText.match(/^plan_schema:\s*(\d+)/m);
  if (schemaM) schema = Number(schemaM[1]);
  base.schema = schema;
  base.legacy = schema === null || schema < 2;

  const findings = [];
  const seams = parseSeamsBlock(fmText);
  if (seams === null) {
    findings.push('seams_field_missing');
  } else if (seams.length === 0) {
    findings.push('seams_field_empty');
  } else {
    base.seams = seams;
    base.seam_count = seams.length;
    for (const s of seams) {
      if (!s.contrato || !String(s.contrato).trim()) {
        findings.push('seam_sem_contrato');
      } else if (pareceCaminho(s.contrato)) {
        findings.push('seam_parece_caminho:' + s.contrato);
      }
      if (s.tipo && !SEAM_TIPOS.includes(String(s.tipo).toLowerCase())) {
        findings.push('seam_tipo_invalido');
      } else if (!s.tipo || !String(s.tipo).trim()) {
        findings.push('seam_tipo_invalido');
      }
      const est = s.estado ? String(s.estado).toLowerCase() : '';
      if (est !== 'existente' && est !== 'nova') {
        findings.push('seam_estado_invalido');
      }
      if (!s.nivel || !String(s.nivel).trim()) {
        findings.push('seam_sem_nivel');
      }
    }
    if (seams.length > 1) {
      const semJust = seams.some(
        (s) => !s.justificativa || !String(s.justificativa).trim()
      );
      if (semJust) findings.push('seam_sem_justificativa');
    }
  }

  if (base.legacy) {
    base.errors = [];
    base.warnings = findings.map((f) => {
      if (f.startsWith('seam_parece_caminho:')) {
        return 'seam_parece_caminho_legacy';
      }
      return f.endsWith('_legacy') ? f : f + '_legacy';
    });
    // Dedupe simple codes for test matching: keep original codes too in string
    base.pass = true;
  } else {
    base.errors = findings;
    base.warnings = [];
    base.pass = findings.length === 0;
  }

  return base;
}

module.exports = {
  DECISION_WORDS,
  EVIDENCE_TYPE_ALIASES,
  PASS_RESULTS,
  SEAM_TIPOS,
  parseApprovalLine,
  readApprovals,
  verdictForPhase,
  evaluateGate,
  pareceCaminho,
  parseSeamsBlock,
  checkPlanReadySeams,
};
