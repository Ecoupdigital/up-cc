'use strict';
// Regressao: gh pr merge devolve erro (nao consegue apagar a branch local presa na
// worktree) mesmo com o PR mergeado. finishPhase tem que tratar como merge, limpar a
// worktree e apagar a branch remota sozinho.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

let pass = 0;
let fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ok  - ' + name); }
  catch (e) { fail++; console.log('  FAIL - ' + name + '\n        ' + e.message); }
}

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();

function setup(mergeExit) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'up-ghmerge-'));
  const remote = path.join(tmp, 'remote.git');
  const repo = path.join(tmp, 'repo');
  const bin = path.join(tmp, 'bin');
  git(tmp, 'init', '-q', '--bare', '-b', 'main', remote);
  fs.mkdirSync(repo);
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'config', 'user.email', 't@t');
  git(repo, 'config', 'user.name', 't');
  fs.writeFileSync(path.join(repo, 'a.txt'), 'a\n');
  git(repo, 'add', '.');
  git(repo, 'commit', '-q', '-m', 'init');
  git(repo, 'remote', 'add', 'origin', remote);
  git(repo, 'push', '-q', '-u', 'origin', 'main');

  // gh falso: issue/pr create devolvem URL; pr merge sai com mergeExit; pr view diz MERGED.
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'gh'), [
    '#!/bin/sh',
    'case "$1 $2" in',
    '  "issue create") echo https://github.com/x/y/issues/5 ;;',
    '  "pr create") echo https://github.com/x/y/pull/7 ;;',
    `  "pr merge") [ -n "$UP_TEST_SQUASH" ] && sh "$UP_TEST_SQUASH"; echo "failed to delete local branch" >&2; exit ${mergeExit} ;;`,
    '  "pr view") echo MERGED ;;',
    '  *) exit 0 ;;',
    'esac',
  ].join('\n'), { mode: 0o755 });
  return { tmp, remote, repo, bin };
}

function run(mergeExit, opts = {}) {
  const ctx = setup(mergeExit);
  if (opts.localCommit) {
    // commit so na main local (ex.: PLAN.md do /up:plan), herdado pela branch da fase
    fs.writeFileSync(path.join(ctx.repo, 'plan.md'), 'plano\n');
    git(ctx.repo, 'add', '.');
    git(ctx.repo, 'commit', '-q', '-m', 'docs: plano');
  }
  if (opts.squash) {
    // simula o squash do GitHub: um commit novo na main remota com o conteudo da branch
    const clone = path.join(ctx.tmp, 'squash');
    const script = path.join(ctx.tmp, 'squash.sh');
    fs.writeFileSync(script, [
      'set -e',
      `git clone -q "${ctx.remote}" "${clone}"`,
      `cd "${clone}"`,
      'git -c user.email=t@t -c user.name=t merge -q --squash origin/up/fase-03-teste',
      'git -c user.email=t@t -c user.name=t commit -q -m "Fase 03 (#7)"',
      'git push -q origin main',
    ].join('\n'));
    process.env.UP_TEST_SQUASH = script;
  }
  const oldPath = process.env.PATH;
  process.env.PATH = ctx.bin + path.delimiter + oldPath;
  process.env.UP_FORCE_GH = '1';
  try {
    delete require.cache[require.resolve('./github.cjs')];
    const gh = require('./github.cjs');
    const start = gh.startPhase({ cwd: ctx.repo, phase: 3, slug: 'teste' });
    assert.ok(start.worktree && fs.existsSync(start.worktree), 'worktree criada');
    fs.writeFileSync(path.join(start.worktree, 'b.txt'), 'b\n');
    git(start.worktree, 'add', '.');
    git(start.worktree, 'commit', '-q', '-m', 'feat: b');
    const res = gh.finishPhase({ cwd: ctx.repo, phase: 3, mode: 'auto' });
    return { ctx, start, res };
  } finally {
    process.env.PATH = oldPath;
    delete process.env.UP_FORCE_GH;
    delete process.env.UP_TEST_SQUASH;
  }
}

console.log('github-merge.test.cjs');

test('merge com erro do gh mas PR MERGED conta como merge e apaga a branch remota', () => {
  const { ctx, start, res } = run(1);
  assert.strictEqual(res.status, 'merged', JSON.stringify(res));
  assert.ok(!res.warnings.some(w => w.startsWith('pr_merge_failed')), 'sem warning falso: ' + res.warnings.join(' | '));
  assert.ok(!fs.existsSync(start.worktree), 'worktree removida');
  const remoteBranches = git(ctx.remote, 'branch', '--list');
  assert.ok(!remoteBranches.includes(start.branch), 'branch remota apagada: ' + remoteBranches);
  const localBranches = git(ctx.repo, 'branch', '--list');
  assert.ok(!localBranches.includes(start.branch), 'branch local apagada');
});

test('merge limpo tambem apaga a branch remota', () => {
  const { ctx, start, res } = run(0);
  assert.strictEqual(res.status, 'merged');
  assert.ok(!git(ctx.remote, 'branch', '--list').includes(start.branch));
});

test('apos o squash, main local com commit so-local se alinha ao remoto', () => {
  const { ctx, start, res } = run(0, { localCommit: true, squash: true });
  assert.strictEqual(res.status, 'merged');
  assert.ok(!res.warnings.some(w => w.startsWith('base_ff_failed')), res.warnings.join(' | '));
  assert.strictEqual(git(ctx.repo, 'rev-parse', 'main'), git(ctx.remote, 'rev-parse', 'main'), 'main local = remota');
  assert.ok(fs.existsSync(path.join(ctx.repo, 'b.txt')), 'conteudo da fase na main local');
  assert.ok(!git(ctx.remote, 'branch', '--list').includes(start.branch));
});

console.log(`\nPASS ${pass}/${pass + fail}`);
if (fail) process.exit(1);
