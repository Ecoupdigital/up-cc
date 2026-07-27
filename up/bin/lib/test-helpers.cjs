'use strict';

/**
 * Helpers compartilhados dos testes do UP.
 * Fronteira de teste: CLI real como subprocesso (up-tools.cjs).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const UP_TOOLS = path.join(__dirname, '..', 'up-tools.cjs');

/**
 * Executa up-tools.cjs como subprocesso. Nunca lanca.
 * @param {string[]} args
 * @param {string} cwd
 * @returns {{ success: boolean, stdout: string, stderr?: string, exitCode: number }}
 */
function runUpTools(args, cwd) {
  try {
    const stdout = execFileSync(
      process.execPath,
      [UP_TOOLS, ...args, '--cwd', cwd],
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return { success: true, stdout: stdout || '', exitCode: 0 };
  } catch (err) {
    return {
      success: false,
      stdout: (err.stdout || '').toString(),
      stderr: (err.stderr || '').toString(),
      exitCode: err.status ?? 1,
    };
  }
}

/**
 * Como runUpTools, mas faz JSON.parse do stdout.
 * Se o parse falhar, devolve { __parse_error: true, stdout, stderr }.
 */
function runUpToolsJson(args, cwd) {
  const r = runUpTools(args, cwd);
  try {
    const parsed = JSON.parse(r.stdout);
    return Object.assign({ success: r.success, exitCode: r.exitCode, stderr: r.stderr }, parsed);
  } catch {
    return {
      __parse_error: true,
      success: r.success,
      exitCode: r.exitCode,
      stdout: r.stdout,
      stderr: r.stderr,
    };
  }
}

/**
 * Cria projeto temporario com .plano/governance e .plano/fases.
 * @param {Record<string, string>} files caminhos relativos -> conteudo
 * @returns {string} caminho do diretorio
 */
function mkTempProject(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-test-'));
  fs.mkdirSync(path.join(dir, '.plano', 'governance'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.plano', 'fases'), { recursive: true });
  if (files && typeof files === 'object') {
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(dir, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content, 'utf-8');
    }
  }
  return dir;
}

/** Remove diretorio temporario em silencio. */
function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // silencioso
  }
}

/**
 * Mini runner no formato de github.test.cjs.
 * @returns {{ t: Function, done: Function }}
 */
function runner() {
  let pass = 0;
  let fail = 0;
  function t(nome, fn) {
    try {
      fn();
      console.log('  ok  -', nome);
      pass += 1;
    } catch (e) {
      console.error('  FAIL -', nome, '\n     ', e.message);
      fail += 1;
    }
  }
  function done() {
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
  return { t, done };
}

module.exports = {
  runUpTools,
  runUpToolsJson,
  mkTempProject,
  cleanup,
  runner,
};
