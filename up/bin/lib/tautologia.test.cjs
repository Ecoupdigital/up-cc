/**
 * tautologia.test.cjs - heuristica anti-tautologia (PROVA-06, PROVA-07, PROVA-08).
 *
 * Fronteira: subcomando verify-static --tautologia da CLI (subprocesso).
 * Nao importa tautologia.cjs diretamente.
 *
 * Roda: node up/bin/lib/tautologia.test.cjs
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  runUpTools,
  runUpToolsJson,
  mkTempProject,
  cleanup,
  runner,
} = require('./test-helpers.cjs');

const { t, done } = runner();

const FIX_TAUT = `'use strict';
const assert = require('assert');
const { slugify } = require('../src/slug.cjs');
const entrada = 'Ola Mundo';
assert.strictEqual(
  slugify(entrada),
  entrada.toLowerCase().normalize('NFD').replace(/\\p{M}/gu, '').replace(/\\s+/g, '-')
);
`;

const FIX_HONESTO = `'use strict';
const assert = require('assert');
const { slugify } = require('../src/slug.cjs');
assert.strictEqual(slugify('Ola Mundo'), 'ola-mundo');
`;

const FIX_REPETIDO = `'use strict';
const assert = require('assert');
const { slugify } = require('../src/slug.cjs');
assert.strictEqual(slugify('Ola Mundo'), slugify('Ola Mundo'));
`;

function projectWithTests(map) {
  const files = {};
  for (const [rel, content] of Object.entries(map)) {
    files[rel] = content;
  }
  return mkTempProject(files);
}

function verifyTaut(dir, pathsCsv) {
  const args = ['verify-static', '--tautologia'];
  if (pathsCsv) {
    args.push('--paths', pathsCsv);
  }
  return runUpToolsJson(args, dir);
}

t('tautologico e sinalizado', () => {
  const dir = projectWithTests({
    'testes/slug-tautologico.test.cjs': FIX_TAUT,
  });
  try {
    const r = verifyTaut(dir, 'testes/slug-tautologico.test.cjs');
    assert.ok(!r.__parse_error, 'parse: ' + (r.stdout || r.stderr || ''));
    const check = (r.checks || []).find((c) => c.name === 'tautologia');
    assert.ok(check, 'checagem tautologia deve existir');
    const findings = (check.findings || r.tautologia && r.tautologia.findings) || [];
    // Prefer structured findings on check or top-level tautologia
    const taut = r.tautologia || check;
    const list = taut.findings || findings;
    assert.ok(list.length >= 1, 'findings >= 1; got=' + JSON.stringify(taut));
    assert.strictEqual(list[0].signal, 'esperado_computado_no_teste');
    assert.ok(list[0].file, 'file preenchido');
    assert.ok(list[0].line, 'line preenchido');
  } finally {
    cleanup(dir);
  }
});

t('honesto nao gera achado', () => {
  const dir = projectWithTests({
    'testes/slug-honesto.test.cjs': FIX_HONESTO,
  });
  try {
    const r = verifyTaut(dir, 'testes/slug-honesto.test.cjs');
    const check = (r.checks || []).find((c) => c.name === 'tautologia');
    assert.ok(check, 'checagem existe');
    const list = check.findings || [];
    assert.strictEqual(list.length, 0, 'honesto sem achado; got=' + JSON.stringify(list));
    assert.strictEqual(check.status, 'pass');
  } finally {
    cleanup(dir);
  }
});

t('asserção que repete a implementacao e sinalizada', () => {
  const dir = projectWithTests({
    'testes/slug-repetido.test.cjs': FIX_REPETIDO,
  });
  try {
    const r = verifyTaut(dir, 'testes/slug-repetido.test.cjs');
    const check = (r.checks || []).find((c) => c.name === 'tautologia');
    const list = check.findings || [];
    assert.ok(list.some((f) => f.signal === 'assercao_repete_implementacao'),
      'deve ter assercao_repete_implementacao; got=' + JSON.stringify(list));
  } finally {
    cleanup(dir);
  }
});

t('heuristica nao bloqueia', () => {
  const dir = projectWithTests({
    'testes/slug-tautologico.test.cjs': FIX_TAUT,
  });
  try {
    const r = verifyTaut(dir, 'testes/slug-tautologico.test.cjs');
    assert.notStrictEqual(
      r.overall,
      'fail',
      'PROVA-08: overall nao vira fail por causa da heuristica; got=' + r.overall
    );
    const check = (r.checks || []).find((c) => c.name === 'tautologia');
    assert.strictEqual(check.status, 'warn');
  } finally {
    cleanup(dir);
  }
});

t('sem arquivo de teste, a checagem e pulada', () => {
  const dir = mkTempProject({});
  try {
    const r = verifyTaut(dir, null);
    const check = (r.checks || []).find((c) => c.name === 'tautologia');
    assert.ok(check, 'checagem existe');
    assert.strictEqual(check.status, 'skip');
    assert.ok(!(check.findings && check.findings.length), 'sem achado');
    assert.notStrictEqual(r.overall, 'fail');
  } finally {
    cleanup(dir);
  }
});

t('achado citavel', () => {
  const dir = projectWithTests({
    'testes/slug-tautologico.test.cjs': FIX_TAUT,
  });
  try {
    const r = verifyTaut(dir, 'testes/slug-tautologico.test.cjs');
    const check = (r.checks || []).find((c) => c.name === 'tautologia');
    for (const f of check.findings || []) {
      assert.ok(f.file, 'file');
      assert.ok(f.line, 'line');
      assert.ok(typeof f.snippet === 'string' && f.snippet.length <= 200, 'snippet <= 200');
      assert.ok(typeof f.why === 'string' && f.why.length > 0, 'why em portugues');
    }
  } finally {
    cleanup(dir);
  }
});

t('log de achados gravado', () => {
  const dir = projectWithTests({
    'testes/slug-tautologico.test.cjs': FIX_TAUT,
  });
  try {
    verifyTaut(dir, 'testes/slug-tautologico.test.cjs');
    const logPath = path.join(dir, '.plano', 'runtime', 'verify-static-tautologia.log');
    assert.ok(fs.existsSync(logPath), 'log deve existir em ' + logPath);
    const body = fs.readFileSync(logPath, 'utf-8');
    assert.ok(body.trim().length > 0, 'log nao vazio');
  } finally {
    cleanup(dir);
  }
});

// RG-003: summary conta arquivos COM achado, nao arquivos varridos.
// Tres arquivos varridos, achados so no tautologico: "em 1 arquivo", nunca "em 3 arquivos".
t('summary conta arquivos com achado, nao varridos', () => {
  const dir = projectWithTests({
    'testes/slug-tautologico.test.cjs': FIX_TAUT,
    'testes/slug-honesto.test.cjs': FIX_HONESTO,
    'testes/outro-honesto.test.cjs': FIX_HONESTO,
  });
  try {
    const paths =
      'testes/slug-tautologico.test.cjs,testes/slug-honesto.test.cjs,testes/outro-honesto.test.cjs';
    const r = verifyTaut(dir, paths);
    const check = (r.checks || []).find((c) => c.name === 'tautologia');
    assert.ok(check, 'checagem existe');
    assert.strictEqual(check.status, 'warn');
    assert.ok(
      (check.findings || []).length >= 1,
      'precisa ter achados; got=' + JSON.stringify(check.findings)
    );
    // Campo explicito se existir
    if (check.files_with_findings != null) {
      assert.strictEqual(
        check.files_with_findings,
        1,
        'files_with_findings deve ser 1; got=' + check.files_with_findings
      );
    }
    // A frase ao revisor nao pode sugerir tres arquivos contaminados
    assert.ok(
      /em 1 arquivo\b/.test(check.summary),
      'summary deve dizer "em 1 arquivo"; got=' + JSON.stringify(check.summary)
    );
    assert.ok(
      !/em 3 arquivos/.test(check.summary),
      'summary nao deve contar varridos como contaminados; got=' + JSON.stringify(check.summary)
    );
    assert.ok(
      !/em 1 arquivos\b/.test(check.summary),
      'singular: "1 arquivo", nao "1 arquivos"; got=' + JSON.stringify(check.summary)
    );
  } finally {
    cleanup(dir);
  }
});

done();
