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

/**
 * `gh` instalado E autenticado?
 * Seam de teste: UP_FORCE_NO_GH=1 forca indisponivel; UP_FORCE_GH=1 forca disponivel.
 */
function ghAvailable(cwd) {
  if (process.env.UP_FORCE_NO_GH === '1') return false;
  if (process.env.UP_FORCE_GH === '1') return true;
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

/**
 * EIXO A — queremos artefatos GitHub (worktree/branch sempre; issue/PR se remote)?
 * Ligado a menos que: `--local`, config.github_native=false, ou sem remote origin.
 * NAO depende de `gh`: gh-vs-MCP e o transporte (eixo separado), nao o liga/desliga.
 */
function gitWantsRemote(cwd, local) {
  if (local) return false;
  const config = loadConfig(cwd);
  if (config.github_native === false) return false;
  return gitHasRemote(cwd);
}

/**
 * Transporte pra criar issue/PR remoto: 'gh' | 'mcp' | 'none'.
 * - 'gh':  gh CLI disponivel -> github.cjs cria direto (deterministico).
 * - 'mcp': remote existe mas sem gh -> o WORKFLOW (LLM) cria via MCP do GitHub,
 *          porque um subprocesso Node nao chama tools MCP. github.cjs sinaliza e
 *          grava de volta via recordIssue/recordPr.
 * - 'none': sem remote (ou --local / config off) -> git local puro, sem issue/PR.
 */
function issueTransport(cwd, local) {
  if (!gitWantsRemote(cwd, local)) return 'none';
  return ghAvailable(cwd) ? 'gh' : 'mcp';
}

/** Compat: github-native "classico" = transporte gh disponivel. */
function githubMode(cwd, local) {
  return issueTransport(cwd, local) === 'gh';
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
 * startPhase({cwd, phase, slug, local, solo})
 * EIXO A (GitHub) e EIXO B (interacao) sao SEPARADOS:
 * - `local=true` (flag --local / config off / /up:rapido): SEM worktree/issue, commit
 *   na branch atual. E o unico jeito de desligar o GitHub aqui.
 * - `solo` NAO desliga o GitHub: solo so afeta o gate visual e o merge (no build.md).
 *   Por isso `solo` e aceito mas ignorado neste passo (compat).
 * - Caso contrario: cria worktree+branch SEMPRE (git local, offline-ok). Issue conforme
 *   o transporte: 'gh' cria direto; 'mcp' deixa pro workflow criar via MCP (retorna
 *   `pending.issue` e mode 'github-mcp'); 'none' (sem remote) so git local.
 * - Escreve .plano/git-map.json. Retorna {branch, worktree, issue, issue_url, mode, transport, warnings, pending?}.
 */
function startPhase({ cwd, phase, slug, local = false, solo = false }) {
  void solo; // solo nao desliga GitHub (eixo de interacao, tratado no build.md)
  const warnings = [];
  const key = phaseKey(phase);
  const branch = branchName(phase, slug);

  const map = readGitMap(cwd);

  // --- LOCAL: nada de worktree/issue, trabalha na branch atual ---
  if (local) {
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
      mode: 'local',
      transport: 'none',
      warnings,
    };
  }

  // --- worktree+branch SEMPRE (git local, independe de gh/MCP) ---
  const wt = worktreePath(cwd, phase, slug);
  shieldWorktreeDir(cwd);

  const existing = (map.phases[key] && map.phases[key].worktree) || null;
  let worktreeCreated = false;

  if (!fs.existsSync(wt)) {
    fs.mkdirSync(path.dirname(wt), { recursive: true });
    const branchExists = execGit(cwd, ['rev-parse', '--verify', '--quiet', branch]).exitCode === 0;
    const wtArgs = branchExists
      ? ['worktree', 'add', wt, branch]
      : ['worktree', 'add', '-b', branch, wt];
    const wtRes = execGit(cwd, wtArgs);
    if (wtRes.exitCode !== 0) {
      warnings.push('worktree_failed: ' + (wtRes.stderr || wtRes.stdout));
      const co = execGit(cwd, branchExists ? ['checkout', branch] : ['checkout', '-b', branch]);
      if (co.exitCode !== 0) warnings.push('branch_checkout_failed: ' + (co.stderr || co.stdout));
    } else {
      worktreeCreated = true;
    }
  } else {
    worktreeCreated = true; // ja existia
  }
  const worktree = worktreeCreated || existing ? wt : null;

  // --- issue: depende do transporte (gh | mcp | none) ---
  const transport = issueTransport(cwd, local);
  let issue = null;
  let issueUrl = null;
  let pending = null;
  const issueTitle = `[fase ${padPhase(phase)}] ${slug || branch}`;
  const issueBody = buildIssueBody(cwd, phase, slug);

  if (transport === 'gh') {
    const res = execGh(cwd, ['issue', 'create', '--title', issueTitle, '--body', issueBody]);
    if (res.exitCode === 0) {
      issueUrl = res.stdout.trim().split('\n').pop().trim() || null;
      const m = issueUrl && issueUrl.match(/\/issues\/(\d+)/);
      issue = m ? parseInt(m[1], 10) : null;
    } else {
      warnings.push('issue_create_failed: ' + (res.stderr || res.stdout));
    }
  } else if (transport === 'mcp') {
    // Node nao chama MCP: o workflow cria a issue via mcp__...github__issue_write
    // e grava de volta com `up-tools github record-issue`. Worktree/branch ja existem.
    pending = { issue: { title: issueTitle, body: issueBody } };
    warnings.push('gh indisponivel: criar issue via MCP (github-mcp) e gravar com record-issue. worktree/branch ja prontos.');
  } else {
    warnings.push('sem remote origin: git local (sem issue/PR).');
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

  const mode = transport === 'gh' ? 'github' : transport === 'mcp' ? 'github-mcp' : 'git-local';
  const ret = { branch, worktree, issue, issue_url: issueUrl, mode, transport, warnings };
  if (pending) ret.pending = pending;
  return ret;
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

/** Remove worktree + branch local (best-effort). Usado por finishPhase e recordPr. */
function cleanupWorktreeBranch(cwd, worktree, branch, warnings) {
  if (worktree && fs.existsSync(worktree)) {
    const rm = execGit(cwd, ['worktree', 'remove', worktree]);
    if (rm.exitCode !== 0) {
      const rmF = execGit(cwd, ['worktree', 'remove', '--force', worktree]);
      if (rmF.exitCode !== 0) warnings.push('worktree_remove_failed: ' + (rmF.stderr || rmF.stdout));
    }
    try { if (fs.existsSync(worktree)) fs.rmdirSync(worktree); } catch (e) { /* nao-vazio: ignora */ }
    try {
      const parent = path.dirname(worktree);
      if (fs.existsSync(parent) && fs.readdirSync(parent).length === 0) fs.rmdirSync(parent);
    } catch (e) { /* ignora */ }
  }
  if (branch) {
    execGit(cwd, ['branch', '-D', branch]); // silencioso: gh/merge ja pode ter removido
  }
}

/**
 * finishPhase({cwd, phase, mode, strategy})
 * - local (alias 'solo'): nao faz nada (ja committado na branch atual). status=done.
 * - menu: imprime as 4 opcoes pro orquestrador perguntar (nao age).
 * - auto (a.k.a. pr): conforme o transporte ('gh' | 'mcp' | 'none'):
 *     'gh'   -> push + gh pr create (Closes #issue) + merge + cleanup.
 *     'mcp'  -> push e PARA: retorna action 'needs-mcp-pr' + pr_payload pro workflow
 *               criar/mergear o PR via MCP e fechar com `record-pr --merged` (que limpa).
 *     'none' -> merge LOCAL fail-open + cleanup.
 * Atualiza git-map.json. Retorna estado da operacao.
 */
function finishPhase({ cwd, phase, mode = 'menu', strategy }) {
  const warnings = [];
  const key = phaseKey(phase);
  const map = readGitMap(cwd);
  const entry = map.phases[key] || {};
  const mergeStrategy = strategy || map.merge_strategy || loadConfig(cwd).merge_strategy || 'squash';

  // --- LOCAL / SOLO: nada a fazer, ja committado ---
  if (mode === 'local' || mode === 'solo') {
    entry.status = 'done';
    map.phases[key] = entry;
    writeGitMap(cwd, map);
    return { mode, action: 'none', status: 'done', warnings };
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
    // mode 'auto' ja significa "quero GitHub": consulta o config (intencao do projeto),
    // nao o flag global do git-map (que uma fase --local anterior poderia ter mexido).
    const wants = gitHasRemote(cwd) && loadConfig(cwd).github_native !== false;
    const transport = wants ? (ghAvailable(cwd) ? 'gh' : 'mcp') : 'none';

    // Base de merge (default: branch ativa na main do repo)
    const baseRes = execGit(cwd, ['symbolic-ref', '--short', 'HEAD']);
    const base = baseRes.exitCode === 0 ? baseRes.stdout.trim() : 'main';

    let pr = entry.pr || null;
    let prUrl = entry.pr_url || null;

    const issueRef = entry.issue ? `\n\nCloses #${entry.issue}` : '';
    const prTitle = `Fase ${padPhase(phase)}` + (entry.branch ? `: ${entry.branch.replace(/^up\/fase-\d+-?/, '')}` : '');
    const prBody = `Entrega da fase ${padPhase(phase)} (UP github-native).${issueRef}`;

    // push da branch (necessario pro PR, gh OU MCP). Worktree tem a branch checada.
    if (transport === 'gh' || transport === 'mcp') {
      const pushCwd = worktree && fs.existsSync(worktree) ? worktree : cwd;
      const push = execGit(pushCwd, ['push', '-u', 'origin', branch]);
      if (push.exitCode !== 0) warnings.push('push_failed: ' + (push.stderr || push.stdout));
    }

    // --- transporte MCP: push feito, PR fica pro workflow (LLM) via MCP ---
    if (transport === 'mcp') {
      map.phases[key] = entry; // status segue in_progress ate record-pr
      writeGitMap(cwd, map);
      return {
        mode,
        action: 'needs-mcp-pr',
        transport: 'mcp',
        pr_payload: {
          base,
          head: branch,
          title: prTitle,
          body: prBody,
          issue: entry.issue || null,
          strategy: mergeStrategy,
          worktree,
        },
        branch,
        status: entry.status || 'in_progress',
        warnings,
      };
    }

    if (transport === 'gh') {
      const create = execGh(cwd, ['pr', 'create', '--base', base, '--head', branch, '--title', prTitle, '--body', prBody]);
      if (create.exitCode === 0) {
        prUrl = create.stdout.trim().split('\n').pop().trim() || null;
        const m = prUrl && prUrl.match(/\/pull\/(\d+)/);
        pr = m ? parseInt(m[1], 10) : null;
      } else {
        warnings.push('pr_create_failed: ' + (create.stderr || create.stdout));
      }

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

    cleanupWorktreeBranch(cwd, worktree, branch, warnings);

    entry.pr = pr;
    entry.pr_url = prUrl;
    entry.worktree = null;
    if (!entry.status || entry.status === 'in_progress') entry.status = transport === 'gh' ? 'merged' : entry.status;
    map.phases[key] = entry;
    writeGitMap(cwd, map);

    return {
      mode,
      action: 'merged',
      transport,
      pr,
      pr_url: prUrl,
      branch,
      strategy: mergeStrategy,
      status: entry.status,
      warnings,
    };
  }

  warnings.push('modo desconhecido: ' + mode + ' (use local|menu|auto)');
  return { mode, action: 'noop', warnings };
}

// =====================================================================
// recordIssue / recordPr — gravam artefatos criados FORA (via MCP no workflow)
// =====================================================================

/** Grava no git-map a issue criada externamente (ex: via MCP). */
function recordIssue({ cwd, phase, issue, url }) {
  const key = phaseKey(phase);
  const map = readGitMap(cwd);
  const entry = map.phases[key] || {};
  if (issue != null && issue !== '') entry.issue = parseInt(issue, 10);
  if (url) entry.issue_url = url;
  map.phases[key] = entry;
  writeGitMap(cwd, map);
  return { recorded: true, phase: key, issue: entry.issue ?? null, issue_url: entry.issue_url || null };
}

/**
 * Grava no git-map o PR criado externamente (ex: via MCP).
 * Com `merged=true`: marca status=merged e limpa worktree+branch local.
 */
function recordPr({ cwd, phase, pr, url, merged = false }) {
  const warnings = [];
  const key = phaseKey(phase);
  const map = readGitMap(cwd);
  const entry = map.phases[key] || {};
  if (pr != null && pr !== '') entry.pr = parseInt(pr, 10);
  if (url) entry.pr_url = url;
  if (merged) {
    entry.status = 'merged';
    cleanupWorktreeBranch(cwd, entry.worktree, entry.branch, warnings);
    entry.worktree = null;
  }
  map.phases[key] = entry;
  writeGitMap(cwd, map);
  return { recorded: true, phase: key, pr: entry.pr ?? null, pr_url: entry.pr_url || null, status: entry.status || null, merged: !!merged, warnings };
}

// =====================================================================
// status — mostra git-map.json
// =====================================================================

/** status({cwd}) — retorna o git-map.json atual (ou defaults se nao existir). Nunca crasha. */
function status({ cwd }) {
  const map = readGitMap(cwd);
  const hasRemote = gitHasRemote(cwd);
  const ghOk = ghAvailable(cwd);
  return {
    github_native: map.github_native,
    merge_strategy: map.merge_strategy,
    gh_available: ghOk,
    has_remote: hasRemote,
    remote: getRemoteUrl(cwd),
    // transporte efetivo pra issue/PR: 'gh' | 'mcp' | 'none' (assumindo nao-local)
    transport: hasRemote && map.github_native !== false ? (ghOk ? 'gh' : 'mcp') : 'none',
    phases: map.phases,
  };
}

module.exports = {
  startPhase,
  finishPhase,
  recordIssue,
  recordPr,
  status,
  // helpers expostos para teste/reuso
  branchName,
  worktreePath,
  gitHasRemote,
  ghAvailable,
  gitWantsRemote,
  issueTransport,
  githubMode,
  cleanupWorktreeBranch,
  readGitMap,
  writeGitMap,
};
