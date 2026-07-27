'use strict';

/**
 * Heuristica mecanica de deteccao de teste tautologico.
 * Sinaliza, nao bloqueia. Analise por texto, sem parser sintatico.
 * Dois sinais fechados: esperado_computado_no_teste e assercao_repete_implementacao.
 */

const fs = require('fs');
const path = require('path');

// Lista fechada: formas de assercao reconhecidas e posicao do esperado.
// kind: 'arg2' = segundo argumento; 'method' = argumento do metodo encadeado.
const ASSERT_PATTERNS = [
  { re: /assert\.strictEqual\s*\(/, kind: 'arg2' },
  { re: /assert\.deepStrictEqual\s*\(/, kind: 'arg2' },
  { re: /assert\.equal\s*\(/, kind: 'arg2' },
  { re: /assert\.deepEqual\s*\(/, kind: 'arg2' },
  { re: /expect\s*\(([\s\S]*?)\)\s*\.\s*toBe\s*\(/, kind: 'method', method: 'toBe' },
  { re: /expect\s*\(([\s\S]*?)\)\s*\.\s*toEqual\s*\(/, kind: 'method', method: 'toEqual' },
  { re: /expect\s*\(([\s\S]*?)\)\s*\.\s*toStrictEqual\s*\(/, kind: 'method', method: 'toStrictEqual' },
];

// Lista fechada: os dois sinais.
const SIGNALS = {
  esperado_computado_no_teste:
    'o valor esperado e computado dentro do proprio teste, entao o teste concorda com o codigo por construcao',
  assercao_repete_implementacao:
    'a assercao repete a mesma operacao da implementacao',
};

/**
 * Extrai operandos de uma chamada, respeitando parenteses e aspas.
 * Devolve array de strings (argumentos no nivel 1).
 */
function splitArgs(callInner) {
  const args = [];
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escape = false;
  let start = 0;
  for (let i = 0; i < callInner.length; i++) {
    const ch = callInner[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && (inSingle || inDouble || inTemplate)) {
      escape = true;
      continue;
    }
    if (!inDouble && !inTemplate && ch === "'") {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && !inTemplate && ch === '"') {
      inDouble = !inDouble;
      continue;
    }
    if (!inSingle && !inDouble && ch === '`') {
      inTemplate = !inTemplate;
      continue;
    }
    if (inSingle || inDouble || inTemplate) continue;
    if (ch === '(' || ch === '[' || ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      depth -= 1;
      continue;
    }
    if (ch === ',' && depth === 0) {
      args.push(callInner.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = callInner.slice(start).trim();
  if (last) args.push(last);
  return args;
}

/**
 * Acha o fecho do parentese que abre em openIdx (posicao do '(').
 */
function matchingParen(source, openIdx) {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escape = false;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && (inSingle || inDouble || inTemplate)) {
      escape = true;
      continue;
    }
    if (!inDouble && !inTemplate && ch === "'") {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && !inTemplate && ch === '"') {
      inDouble = !inDouble;
      continue;
    }
    if (!inSingle && !inDouble && ch === '`') {
      inTemplate = !inTemplate;
      continue;
    }
    if (inSingle || inDouble || inTemplate) continue;
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function isLiteral(expr) {
  const s = expr.trim();
  if (!s) return false;
  if (/^(['"`]).*\1$/.test(s) && !/[A-Za-z_$]\w*\s*\(/.test(s.slice(1, -1))) return true;
  if (/^-?\d+(\.\d+)?$/.test(s)) return true;
  if (/^(true|false|null|undefined)$/.test(s)) return true;
  // array/object literal sem chamada
  if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
    if (!/[A-Za-z_$][\w$]*\s*\(/.test(s)) return true;
  }
  return false;
}

function hasCall(expr) {
  return /[A-Za-z_$][\w$]*\s*\(/.test(expr) || /\.\s*[A-Za-z_$][\w$]*\s*\(/.test(expr);
}

function firstCallee(expr) {
  const m = expr.match(/([A-Za-z_$][\w$]*)\s*\(/);
  return m ? m[1] : null;
}

function calleesIn(expr) {
  const out = [];
  const re = /([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = re.exec(expr)) !== null) {
    out.push(m[1]);
  }
  return out;
}

/**
 * Extrai identificadores importados via require (ignora test/assert/node:).
 */
function extrairImports(source) {
  const ids = new Set();
  const re = /(?:const|let|var)\s+(?:(\{[^}]+\})|([A-Za-z_$][\w$]*))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const mod = m[3];
    if (/test|assert|^node:/.test(mod)) continue;
    if (m[1]) {
      const inner = m[1].replace(/[{}]/g, '');
      for (const part of inner.split(',')) {
        const name = part.trim().split(/\s+as\s+/).pop().trim();
        if (name) ids.add(name);
      }
    } else if (m[2]) {
      ids.add(m[2]);
    }
  }
  return ids;
}

/**
 * Percorre o fonte e devolve achados.
 */
function scanTestSource(source, opts) {
  const file = (opts && opts.file) || 'unknown';
  const findings = [];
  const imports = extrairImports(source);
  const lines = source.split(/\r?\n/);

  // Scan line by line; also handle multi-line by joining for matching
  // Strategy: find assert/expect starts and extract full call via matchingParen
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of ASSERT_PATTERNS) {
      if (pat.kind === 'arg2') {
        const idxInLine = line.search(pat.re);
        if (idxInLine < 0) continue;
        // Find open paren position in full source
        let offset = 0;
        for (let k = 0; k < i; k++) offset += lines[k].length + 1;
        const openInLine = line.indexOf('(', idxInLine);
        const openAbs = offset + openInLine;
        const closeAbs = matchingParen(source, openAbs);
        if (closeAbs < 0) continue;
        const inner = source.slice(openAbs + 1, closeAbs);
        const args = splitArgs(inner);
        if (args.length < 2) continue;
        const atual = args[0];
        const esperado = args[1];
        emitSignals(atual, esperado, imports, findings, file, i + 1, line.trim());
      } else if (pat.kind === 'method') {
        // expect(atual).toBe(esperado)
        const m = line.match(new RegExp(
          'expect\\s*\\(([^)]*)\\)\\s*\\.\\s*' + pat.method + '\\s*\\('
        ));
        if (!m) continue;
        let offset = 0;
        for (let k = 0; k < i; k++) offset += lines[k].length + 1;
        const methodStart = line.indexOf('.' + pat.method);
        const openInLine = line.indexOf('(', methodStart);
        const openAbs = offset + openInLine;
        const closeAbs = matchingParen(source, openAbs);
        if (closeAbs < 0) continue;
        const esperado = source.slice(openAbs + 1, closeAbs).trim();
        const atual = m[1].trim();
        emitSignals(atual, esperado, imports, findings, file, i + 1, line.trim());
      }
    }
  }

  return { file, findings };
}

function emitSignals(atual, esperado, imports, findings, file, line, snippetRaw) {
  const snippet = String(snippetRaw || '').slice(0, 200);
  if (isLiteral(esperado)) return;

  if (hasCall(esperado)) {
    findings.push({
      signal: 'esperado_computado_no_teste',
      line,
      snippet,
      why: SIGNALS.esperado_computado_no_teste,
      file,
    });
  }

  const expectedCallees = calleesIn(esperado);
  const atualCallees = new Set(calleesIn(atual));
  for (const c of expectedCallees) {
    if (atualCallees.has(c) || imports.has(c)) {
      findings.push({
        signal: 'assercao_repete_implementacao',
        line,
        snippet,
        why: SIGNALS.assercao_repete_implementacao,
        file,
      });
      break;
    }
  }
}

const TEST_EXTS = ['.test.cjs', '.test.js', '.test.ts', '.test.tsx', '.spec.js', '.spec.ts'];
const MAX_FILES = 300;
const MAX_BYTES = 400 * 1024;

function isTestFile(name) {
  return TEST_EXTS.some((ext) => name.endsWith(ext));
}

function walkTests(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.name === 'node_modules') continue;
    if (out.length >= MAX_FILES) return;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkTests(full, out);
    else if (ent.isFile() && isTestFile(ent.name)) out.push(full);
  }
}

/**
 * @param {string[]} paths
 * @param {{ cwd?: string }} opts
 */
function scanFiles(paths, opts) {
  const cwd = (opts && opts.cwd) || process.cwd();
  const files = [];
  let truncated = false;

  for (const p of paths || []) {
    const full = path.isAbsolute(p) ? p : path.join(cwd, p);
    let st;
    try {
      st = fs.statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkTests(full, files);
    } else if (st.isFile()) {
      files.push(full);
    }
    if (files.length >= MAX_FILES) {
      truncated = true;
      break;
    }
  }

  const findings = [];
  let scanned = 0;
  for (const f of files) {
    if (scanned >= MAX_FILES) {
      truncated = true;
      break;
    }
    let text;
    try {
      const st = fs.statSync(f);
      if (st.size > MAX_BYTES) continue;
      text = fs.readFileSync(f, 'utf-8');
    } catch {
      continue;
    }
    scanned += 1;
    const rel = path.relative(cwd, f) || f;
    const r = scanTestSource(text, { file: rel });
    for (const finding of r.findings) {
      findings.push(finding);
    }
  }

  return { files_scanned: scanned, findings, truncated };
}

module.exports = {
  ASSERT_PATTERNS,
  SIGNALS,
  extrairImports,
  scanTestSource,
  scanFiles,
};
