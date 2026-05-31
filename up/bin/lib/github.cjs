/**
 * github.cjs — GitHub-native execution layer for UP (worktree -> issue -> PR -> merge)
 *
 * Construido sobre execGit (core.cjs). FAIL-OPEN em tudo: se faltar `gh` ou
 * remote, degrada para git local (branch + merge local, issue/pr=null) com aviso,
 * nunca crasha. git worktree e sempre local (funciona offline).
 *
 * Modelo de estado: .plano/git-map.json (canonico no working dir principal).
 *   { github_native, merge_strategy, phases: { N: {branch, worktree, issue, issue_url, pr, pr_url, status} } }
 *
 * Branch:   up/fase-NN-slug   (NN zero-pad)
 * Worktree: <repoParent>/.up-worktrees/<repoName>/fase-NN-slug  (FORA do repo)
 *
 * Exporta: startPhase, finishPhase, status.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { execGit, loadConfig } = require('./core.cjs');

// =====================================================================
// Detecção de ambiente (gh + remote) — FAIL-OPEN
// =====================================================================

/** Existe remote `origin`? Decide local-only vs GitHub. */
function gitHasRemote(cwd) {
  const res = execGit(cwd, ['remote', 'get-url', 'origin']);
  return res.exitCode === 0 && res.stdout.trim().length > 0;
}

function getRemoteUrl(cwd) {
  const res = execGit(cwd, ['remote', 'get-url', 'origin']);
  return res.exitCode === 0 ? res.stdout.trim() : null;
}

/** `gh` instalado E autenticado? */
function ghAvailable(cwd) {
  try {
    execSync('gh auth status', { cwd, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Executa `gh <args>` no cwd. Retorna {exitCode, stdout, stderr}.
 * Nunca lança: erro de gh ausente/falha vira exitCode != 0.
 */
function execGh(cwd, args) {
  try {
    const escaped = args.map(a => {
      if (/^[a-zA-Z0-9._\-/=:@,]+$/.test(a)) return a;
      return "'" + String(a).replace(/'/g, "'\\''") + "'";
    });
    const stdout = execSync('gh ' + escaped.join(' '), {
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

/** github-native ativo? (config.github_native default true) AND gh+remote disponiveis. */
function githubMode(cwd, solo) {
  if (solo) return false;
  const config = loadConfig(cwd);
  if (config.github_native === false) return false;
  return ghAvailable(cwd) && gitHasRemote(cwd);
}

// =====================================================================
// Helpers de fase / branch / worktree
// =====================================================================

/** Zero-pad o número da fase para 2 dígitos, preservando letra/decimal. */
function padPhase(phase) {
  const m = String(phase).match(/^(\d+)([A-Z])?((?:\.\d+)*)/i);
  if (!m) return String(phase);
  const padded = m[1].padStart(2, '0');
  const letter = m[2] ? m[2].toUpperCase() : '';
  const decimal = m[3] || '';
  return padded + letter + decimal;
}

function slugify(text) {
  if (!text) return '';
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** up/fase-NN-slug */
function branchName(phase, slug) {
  const nn = padPhase(phase);
  const s = slugify(slug);
  return s ? `up/fase-${nn}-${s}` : `up/fase-${nn}`;
}

/** Caminho do toplevel do repo principal (resolve worktrees aninhadas). */
function repoToplevel(cwd) {
  const res = execGit(cwd, ['rev-parse', '--show-toplevel']);
  return res.exitCode === 0 && res.stdout ? res.stdout.trim() : cwd;
}

/**
 * Worktree FORA do repo: <repoParent>/.up-worktrees/<repoName>/fase-NN-slug
 * Espelha a estrutura do nome de branch, mas com `/` -> `-` (1 nivel de pasta).
 */
function worktreePath(cwd, phase, slug) {
  const top = repoToplevel(cwd);
  const repoName = path.basename(top);
  const repoParent = path.dirname(top);
  const nn = padPhase(phase);
  const s = slugify(slug);
  const dirName = s ? `fase-${nn}-${s}` : `fase-${nn}`;
  return path.join(repoParent, '.up-worktrees', repoName, dirName);
}

/** Garante que .up-worktrees nao polua git status do repo principal (exclude local + gitignore best-effort). */
function shieldWorktreeDir(cwd) {
  const top = repoToplevel(cwd);
  // 1) .git/info/exclude (nao versionado, sempre seguro)
  try {
    const excludePath = path.join(top, '.git', 'info', 'exclude');
    let content = fs.existsSync(excludePath) ? fs.readFileSync(excludePath, 'utf-8') : '';
    if (!content.split('\n').some(l => l.trim() === '.up-worktrees/' || l.trim() === '.up-worktrees')) {
      if (content.length && !content.endsWith('\n')) content += '\n';
      content += '.up-worktrees/\n';
      fs.writeFileSync(excludePath, content, 'utf-8');
    }
  } catch {
    // best-effort, ignora
  }
}

// =====================================================================
// git-map.json — leitura/escrita (canonico no working dir principal)
// =====================================================================

function gitMapPath(cwd) {
  return path.join(repoToplevel(cwd), '.plano', 'git-map.json');
}

function readGitMap(cwd) {
  const config = loadConfig(cwd);
  const defaults = {
    github_native: config.github_native !== false,
    merge_strategy: config.merge_strategy || 'squash',
    phases: {},
  };
  try {
    const p = gitMapPath(cwd);
    if (!fs.existsSync(p)) return defaults;
    const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return {
      github_native: parsed.github_native ?? defaults.github_native,
      merge_strategy: parsed.merge_strategy ?? defaults.merge_strategy,
      phases: parsed.phases ?? {},
    };
  } catch {
    return defaults;
  }
}

function writeGitMap(cwd, map) {
  const p = gitMapPath(cwd);
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(map, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

function phaseKey(phase) {
  return padPhase(phase).replace(/^0+(\d)/, '$1'); // "03" -> "3", "02.1" -> "2.1"
}

// =====================================================================
// startPhase — worktree + branch + (opcional) issue
// =====================================================================

/**
 * startPhase({cwd, phase, slug, solo})
 * - Cria branch up/fase-NN-slug e worktree FORA do repo.
 * - Se github_native e gh+remote disponiveis: cria gh issue.
 * - Com --solo: degrada (sem worktree, sem issue) — trabalha na branch atual.
 * - Sem gh/remote: cria worktree+branch local, issue=null (fail-open, nunca crasha).
 * - Escreve .plano/git-map.json. Retorna {branch, worktree, issue, issue_url, mode, warnings}.
 */
function startPhase({ cwd, phase, slug, solo = false }) {
  const warnings = [];
  const key = phaseKey(phase);
  const branch = branchName(phase, slug);
  const ghOn = githubMode(cwd, solo);

  const map = readGitMap(cwd);
  if (solo) map.github_native = false;

  // --- modo SOLO: nada de worktree/issue, trabalha na branch atual ---
  if (solo) {
    const cur = execGit(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
    const currentBranch = cur.exitCode === 0 ? cur.stdout.trim() : null;
    map.phases[key] = {
      ...(map.phases[key] || {}),
      branch: currentBranch,
      worktree: null,
      issue: null,
      issue_url: null,
      pr: null,
      pr_url: null,
      status: 'in_progress',
    };
    writeGitMap(cwd, map);
    return {
      branch: currentBranch,
      worktree: null,
      issue: null,
      issue_url: null,
      mode: 'solo',
      warnings,
    };
  }

  // --- modo GitHub-native ou git-local: criar worktree+branch ---
  const wt = worktreePath(cwd, phase, slug);
  shieldWorktreeDir(cwd);

  // Worktree e branch existem? (idempotente / recovery)
  const existing = (map.phases[key] && map.phases[key].worktree) || null;
  let worktreeCreated = false;

  if (!fs.existsSync(wt)) {
    fs.mkdirSync(path.dirname(wt), { recursive: true });
    // Branch ja existe? Anexa sem -b. Senao cria com -b.
    const branchExists = execGit(cwd, ['rev-parse', '--verify', '--quiet', branch]).exitCode === 0;
    const wtArgs = branchExists
      ? ['worktree', 'add', wt, branch]
      : ['worktree', 'add', '-b', branch, wt];
    const wtRes = execGit(cwd, wtArgs);
    if (wtRes.exitCode !== 0) {
      warnings.push('worktree_failed: ' + (wtRes.stderr || wtRes.stdout));
      // FAIL-OPEN: cai pra branch local sem worktree
      const co = execGit(cwd, branchExists ? ['checkout', branch] : ['checkout', '-b', branch]);
      if (co.exitCode !== 0) warnings.push('branch_checkout_failed: ' + (co.stderr || co.stdout));
    } else {
      worktreeCreated = true;
    }
  } else {
    worktreeCreated = true; // ja existia
  }
  const worktree = worktreeCreated || existing ? wt : null;

  // --- issue (so em github-native) ---
  let issue = null;
  let issueUrl = null;
  if (ghOn) {
    const title = `[fase ${padPhase(phase)}] ${slug || branch}`;
    const body = buildIssueBody(cwd, phase, slug);
    const res = execGh(cwd, ['issue', 'create', '--title', title, '--body', body]);
    if (res.exitCode === 0) {
      issueUrl = res.stdout.trim().split('\n').pop().trim() || null;
      const m = issueUrl && issueUrl.match(/\/issues\/(\d+)/);
      issue = m ? parseInt(m[1], 10) : null;
    } else {
      warnings.push('issue_create_failed: ' + (res.stderr || res.stdout));
    }
  } else if (!solo) {
    if (!ghAvailable(cwd)) warnings.push('gh indisponivel ou nao autenticado: degradando para git local (sem issue/PR)');
    else if (!gitHasRemote(cwd)) warnings.push('sem remote origin: degradando para git local (sem issue/PR)');
  }

  map.phases[key] = {
    ...(map.phases[key] || {}),
    branch,
    worktree,
    issue,
    issue_url: issueUrl,
    pr: (map.phases[key] && map.phases[key].pr) || null,
    pr_url: (map.phases[key] && map.phases[key].pr_url) || null,
    status: 'in_progress',
  };
  writeGitMap(cwd, map);

  return {
    branch,
    worktree,
    issue,
    issue_url: issueUrl,
    mode: ghOn ? 'github' : 'git-local',
    warnings,
  };
}

/** Body da issue: goal + criterios do ROADMAP, se disponiveis. */
function buildIssueBody(cwd, phase, slug) {
  let body = `Fase ${padPhase(phase)}` + (slug ? ` — ${slug}` : '') + '\n\nGerado por UP (github-native).';
  try {
    const { getRoadmapPhaseInternal } = require('./core.cjs');
    const rp = getRoadmapPhaseInternal(repoToplevel(cwd), phase);
    if (rp && rp.goal) body = `**Objetivo:** ${rp.goal}\n\n${body}`;
  } catch {
    // best-effort
  }
  return body;
}

// =====================================================================
// finishPhase — solo | menu | auto/pr
// =====================================================================

/**
 * finishPhase({cwd, phase, mode, strategy})
 * - solo: nao faz nada (ja committado na branch atual). Marca status=done.
 * - menu: imprime as 4 opcoes pro orquestrador perguntar (nao age).
 * - auto (a.k.a. pr): gh pr create (body "Closes #<issue>") -> merge (squash default)
 *   -> cleanup worktree+branch. Sem remote: merge LOCAL da branch na base, cleanup.
 * Atualiza git-map.json. Retorna estado da operacao.
 */
function finishPhase({ cwd, phase, mode = 'menu', strategy }) {
  const warnings = [];
  const key = phaseKey(phase);
  const map = readGitMap(cwd);
  const entry = map.phases[key] || {};
  const mergeStrategy = strategy || map.merge_strategy || loadConfig(cwd).merge_strategy || 'squash';

  // --- SOLO: nada a fazer, ja committado ---
  if (mode === 'solo') {
    entry.status = 'done';
    map.phases[key] = entry;
    writeGitMap(cwd, map);
    return { mode: 'solo', action: 'none', status: 'done', warnings };
  }

  // --- MENU: imprime as 4 opcoes, nao age ---
  if (mode === 'menu') {
    return {
      mode: 'menu',
      action: 'prompt',
      options: [
        { id: 1, label: 'merge local', detail: 'Mescla a branch na base localmente (sem PR).' },
        { id: 2, label: 'abrir PR', detail: 'Cria PR no GitHub (Closes #issue) e para pra revisao.' },
        { id: 3, label: 'deixa a branch', detail: 'Mantem a branch/worktree como esta.' },
        { id: 4, label: 'descarta', detail: 'Remove worktree e branch sem mesclar.' },
      ],
      branch: entry.branch || null,
      issue: entry.issue || null,
      warnings,
    };
  }

  // --- AUTO / PR ---
  if (mode === 'auto' || mode === 'pr') {
    const branch = entry.branch || branchName(phase, '');
    const worktree = entry.worktree || null;
    const ghOn = ghAvailable(cwd) && gitHasRemote(cwd) && map.github_native !== false;

    // Base de merge (default: branch ativa na main do repo)
    const baseRes = execGit(cwd, ['symbolic-ref', '--short', 'HEAD']);
    const base = baseRes.exitCode === 0 ? baseRes.stdout.trim() : 'main';

    let pr = entry.pr || null;
    let prUrl = entry.pr_url || null;

    if (ghOn) {
      // push da branch (necessario pro PR). Worktree ja tem a branch checada.
      const pushCwd = worktree && fs.existsSync(worktree) ? worktree : cwd;
      const push = execGit(pushCwd, ['push', '-u', 'origin', branch]);
      if (push.exitCode !== 0) warnings.push('push_failed: ' + (push.stderr || push.stdout));

      // gh pr create (Closes #issue no body)
      const issueRef = entry.issue ? `\n\nCloses #${entry.issue}` : '';
      const prTitle = `Fase ${padPhase(phase)}` + (entry.branch ? `: ${entry.branch.replace(/^up\/fase-\d+-?/, '')}` : '');
      const prBody = `Entrega da fase ${padPhase(phase)} (UP github-native).${issueRef}`;
      const create = execGh(cwd, ['pr', 'create', '--base', base, '--head', branch, '--title', prTitle, '--body', prBody]);
      if (create.exitCode === 0) {
        prUrl = create.stdout.trim().split('\n').pop().trim() || null;
        const m = prUrl && prUrl.match(/\/pull\/(\d+)/);
        pr = m ? parseInt(m[1], 10) : null;
      } else {
        warnings.push('pr_create_failed: ' + (create.stderr || create.stdout));
      }

      // merge via gh
      const stratFlag = mergeStrategy === 'merge' ? '--merge' : mergeStrategy === 'rebase' ? '--rebase' : '--squash';
      const mergeTarget = pr ? String(pr) : branch;
      const merge = execGh(cwd, ['pr', 'merge', mergeTarget, stratFlag, '--delete-branch']);
      if (merge.exitCode !== 0) {
        warnings.push('pr_merge_failed: ' + (merge.stderr || merge.stdout));
      } else {
        entry.status = 'merged';
      }
    } else {
      // FAIL-OPEN: merge LOCAL (sem remote/gh)
      warnings.push('sem gh/remote: merge local da branch ' + branch + ' em ' + base);
      // Garante base checada no repo principal
      const co = execGit(cwd, ['checkout', base]);
      if (co.exitCode !== 0) warnings.push('checkout_base_failed: ' + (co.stderr || co.stdout));
      const stratArgs = mergeStrategy === 'squash'
        ? ['merge', '--squash', branch]
        : ['merge', '--no-ff', branch];
      const merge = execGit(cwd, stratArgs);
      if (merge.exitCode !== 0) {
        warnings.push('local_merge_failed: ' + (merge.stderr || merge.stdout));
      } else {
        if (mergeStrategy === 'squash') {
          const c = execGit(cwd, ['commit', '-m', `feat(fase-${padPhase(phase)}): merge da fase`]);
          if (c.exitCode !== 0 && !/nothing to commit/.test(c.stderr + c.stdout)) {
            warnings.push('local_squash_commit_failed: ' + (c.stderr || c.stdout));
          }
        }
        entry.status = 'merged';
      }
    }

    // cleanup: remove worktree e branch local
    if (worktree && fs.existsSync(worktree)) {
      const rm = execGit(cwd, ['worktree', 'remove', worktree]);
      if (rm.exitCode !== 0) {
        const rmF = execGit(cwd, ['worktree', 'remove', '--force', worktree]);
        if (rmF.exitCode !== 0) warnings.push('worktree_remove_failed: ' + (rmF.stderr || rmF.stdout));
      }
      // best-effort: remove a casca vazia que git deixa, e o dir-pai .up-worktrees/<repo> se vazio
      try { if (fs.existsSync(worktree)) fs.rmdirSync(worktree); } catch (e) { /* nao-vazio: ignora */ }
      try {
        const parent = path.dirname(worktree);
        if (fs.existsSync(parent) && fs.readdirSync(parent).length === 0) fs.rmdirSync(parent);
      } catch (e) { /* ignora */ }
    }
    // remove branch local (se ainda existir e nao for a branch ativa)
    const delBranch = execGit(cwd, ['branch', '-D', branch]);
    if (delBranch.exitCode !== 0 && !/not found|não encontrad/i.test(delBranch.stderr)) {
      // silencioso: gh --delete-branch ja pode ter removido
    }

    entry.pr = pr;
    entry.pr_url = prUrl;
    if (!entry.status || entry.status === 'in_progress') entry.status = ghOn ? 'merged' : entry.status;
    map.phases[key] = entry;
    writeGitMap(cwd, map);

    return {
      mode: mode,
      action: 'merged',
      pr,
      pr_url: prUrl,
      branch,
      strategy: mergeStrategy,
      status: entry.status,
      warnings,
    };
  }

  warnings.push('modo desconhecido: ' + mode + ' (use solo|menu|auto)');
  return { mode, action: 'noop', warnings };
}

// =====================================================================
// status — mostra git-map.json
// =====================================================================

/** status({cwd}) — retorna o git-map.json atual (ou defaults se nao existir). Nunca crasha. */
function status({ cwd }) {
  const map = readGitMap(cwd);
  return {
    github_native: map.github_native,
    merge_strategy: map.merge_strategy,
    gh_available: ghAvailable(cwd),
    has_remote: gitHasRemote(cwd),
    remote: getRemoteUrl(cwd),
    phases: map.phases,
  };
}

module.exports = {
  startPhase,
  finishPhase,
  status,
  // helpers expostos para teste/reuso
  branchName,
  worktreePath,
  gitHasRemote,
  ghAvailable,
  githubMode,
  readGitMap,
  writeGitMap,
};
