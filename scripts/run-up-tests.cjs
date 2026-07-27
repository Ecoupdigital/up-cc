#!/usr/bin/env node
'use strict';

/**
 * Corredor de testes do lado UP.
 * Varre up/ por arquivos *.test.cjs (sem node_modules), ordena por caminho
 * e executa cada um em subprocesso. Sem glob de shell (compatibilidade Windows).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const UP_DIR = path.join(ROOT, 'up');

function walkTestFiles(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.name === 'node_modules') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkTestFiles(full, out);
    } else if (ent.isFile() && ent.name.endsWith('.test.cjs')) {
      out.push(full);
    }
  }
}

const files = [];
walkTestFiles(UP_DIR, files);
files.sort();

let failed = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  process.stdout.write(`\n>>> ${rel}\n`);
  try {
    execFileSync(process.execPath, [file], {
      stdio: 'inherit',
      cwd: ROOT,
    });
  } catch {
    failed += 1;
  }
}

const total = files.length;
console.log(`\nup tests: ${total} arquivos, ${failed} falharam`);
process.exit(failed ? 1 : 0);
