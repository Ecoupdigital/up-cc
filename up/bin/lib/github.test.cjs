/**
 * github.test.cjs — testes red-green do github.cjs (eixo GitHub vs interacao).
 * Roda: node up/bin/lib/github.test.cjs
 * Sem framework. Cria repos git temporarios. Usa remote bare local (push sem rede)
 * e o seam UP_FORCE_NO_GH=1 pra simular "sem gh CLI, so MCP".
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const gh = require('./github.cjs');

process.env.GIT_TERMINAL_PROMPT = '0';

function sh(cmd, cwd) { execSync(cmd, { cwd, stdio: 'pipe' }); }

/** Cria repo git temp. withRemote=true adiciona origin = bare repo local. */
function mkRepo(withRemote) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-gh-'));
  sh('git init -q', dir);
  sh('git config user.email t@t.co', dir);
  sh('git config user.name t', dir);
  sh('git config commit.gpgsign false', dir);
  fs.writeFileSync(path.join(dir, 'README.md'), '# t\n');
  sh('git add -A', dir);
  sh('git commit -qm init', dir);
  sh('git branch -M main', dir);
  fs.mkdirSync(path.join(dir, '.plano'), { recursive: true });
  let bare = null;
  if (withRemote) {
    bare = fs.mkdtempSync(path.join(os.tmpdir(), 'up-gh-bare-'));
    sh('git init -q --bare', bare);
    sh(`git remote add origin ${bare}`, dir);
  }
  return { dir, bare };
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  -', name); pass++; }
  catch (e) { console.error('  FAIL -', name, '\n     ', e.message); fail++; }
}

// 1. local=true -> sem worktree/issue, branch atual, mode local
t('local: sem worktree/issue, branch atual', () => {
  const { dir } = mkRepo(false);
  const r = gh.startPhase({ cwd: dir, phase: 1, slug: 'x', local: true });
  assert.strictEqual(r.worktree, null);
  assert.strictEqual(r.issue, null);
  assert.strictEqual(r.mode, 'local');
  assert.strictEqual(r.transport, 'none');
  assert.strictEqual(r.branch, 'main');
});

// 2. sem remote, nao-local -> worktree criado, git-local, sem issue
t('sem remote: worktree criado, git-local', () => {
  const { dir } = mkRepo(false);
  const r = gh.startPhase({ cwd: dir, phase: 2, slug: 'feat' });
  assert.ok(r.worktree && fs.existsSync(r.worktree), 'worktree deve existir');
  assert.strictEqual(r.mode, 'git-local');
  assert.strictEqual(r.transport, 'none');
  assert.strictEqual(r.issue, null);
  assert.strictEqual(r.branch, 'up/fase-02-feat');
});

// 3. remote + sem gh -> github-mcp, worktree criado, pending.issue, transport mcp
t('remote sem gh: github-mcp pendente', () => {
  const { dir } = mkRepo(true);
  process.env.UP_FORCE_NO_GH = '1';
  try {
    const r = gh.startPhase({ cwd: dir, phase: 3, slug: 'mcp' });
    assert.strictEqual(r.transport, 'mcp');
    assert.strictEqual(r.mode, 'github-mcp');
    assert.ok(r.worktree && fs.existsSync(r.worktree), 'worktree deve existir mesmo sem gh');
    assert.strictEqual(r.issue, null);
    assert.ok(r.pending && r.pending.issue && r.pending.issue.title, 'deve trazer pending.issue.title');
  } finally { delete process.env.UP_FORCE_NO_GH; }
});

// 4. REGRESSAO do bug: solo NAO desliga github
t('solo nao desliga github (vira github-mcp, nao local)', () => {
  const { dir } = mkRepo(true);
  process.env.UP_FORCE_NO_GH = '1';
  try {
    const r = gh.startPhase({ cwd: dir, phase: 4, slug: 's', solo: true });
    assert.notStrictEqual(r.mode, 'local');
    assert.ok(r.worktree && fs.existsSync(r.worktree), 'solo deve criar worktree');
    assert.strictEqual(r.transport, 'mcp');
  } finally { delete process.env.UP_FORCE_NO_GH; }
});

// 5. recordIssue grava no git-map
t('recordIssue grava issue no git-map', () => {
  const { dir } = mkRepo(true);
  process.env.UP_FORCE_NO_GH = '1';
  try {
    gh.startPhase({ cwd: dir, phase: 5, slug: 'r' });
    const r = gh.recordIssue({ cwd: dir, phase: 5, issue: 42, url: 'https://github.com/x/y/issues/42' });
    assert.strictEqual(r.issue, 42);
    const map = gh.readGitMap(dir);
    assert.strictEqual(map.phases['5'].issue, 42);
    assert.strictEqual(map.phases['5'].issue_url, 'https://github.com/x/y/issues/42');
  } finally { delete process.env.UP_FORCE_NO_GH; }
});

// 6. issueTransport puro
t('issueTransport: local->none; sem remote->none', () => {
  const { dir } = mkRepo(false);
  assert.strictEqual(gh.issueTransport(dir, true), 'none');
  assert.strictEqual(gh.issueTransport(dir, false), 'none');
});

// 7. finish mode local -> noop, done
t('finish local: noop status done', () => {
  const { dir } = mkRepo(false);
  gh.startPhase({ cwd: dir, phase: 7, slug: 'l', local: true });
  const r = gh.finishPhase({ cwd: dir, phase: 7, mode: 'local' });
  assert.strictEqual(r.status, 'done');
});

// 8. finish auto sem remote -> merge local fail-open
t('finish auto sem remote: merge local', () => {
  const { dir } = mkRepo(false);
  const s = gh.startPhase({ cwd: dir, phase: 8, slug: 'm' });
  fs.writeFileSync(path.join(s.worktree, 'f.txt'), 'x');
  sh('git add -A', s.worktree);
  sh('git commit -qm w', s.worktree);
  const r = gh.finishPhase({ cwd: dir, phase: 8, mode: 'auto' });
  assert.strictEqual(r.status, 'merged');
});

// 9. finish auto, remote sem gh -> needs-mcp-pr + payload (push pro bare local funciona)
t('finish auto remote sem gh: sinaliza needs-mcp-pr', () => {
  const { dir } = mkRepo(true);
  const s = gh.startPhase({ cwd: dir, phase: 9, slug: 'p' });
  fs.writeFileSync(path.join(s.worktree, 'f.txt'), 'x');
  sh('git add -A', s.worktree);
  sh('git commit -qm w', s.worktree);
  process.env.UP_FORCE_NO_GH = '1';
  try {
    const r = gh.finishPhase({ cwd: dir, phase: 9, mode: 'auto' });
    assert.strictEqual(r.action, 'needs-mcp-pr');
    assert.ok(r.pr_payload && r.pr_payload.head, 'deve trazer pr_payload.head');
    assert.strictEqual(r.pr_payload.head, 'up/fase-09-p');
  } finally { delete process.env.UP_FORCE_NO_GH; }
});

// 10. recordPr --merged grava pr e limpa worktree
t('recordPr merged: grava pr, status merged, limpa worktree', () => {
  const { dir } = mkRepo(true);
  const s = gh.startPhase({ cwd: dir, phase: 10, slug: 'pr' });
  const wt = s.worktree;
  const r = gh.recordPr({ cwd: dir, phase: 10, pr: 7, url: 'https://github.com/x/y/pull/7', merged: true });
  assert.strictEqual(r.pr, 7);
  assert.strictEqual(r.status, 'merged');
  assert.ok(!fs.existsSync(wt), 'worktree deve ter sido removida');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
