/**
 * multica.cjs — Espelho OPT-IN do board Multica para o UP (Fase 5).
 *
 * Multica = espelho de board, NAO orquestrador, NAO stream ao vivo. So roda
 * quando o build esta com --board ligado. Status batched no fim da onda/fase.
 *
 * Construido sobre child_process (CLI `multica`, Go-based, instalado global na
 * VPS Dev). FAIL-OPEN em TUDO: se o `multica` faltar/nao autenticar/der erro,
 * a funcao avisa via { ok:false, warning } e segue — NUNCA crasha o build.
 *
 * Deteccao de ambiente via `uname -s`:
 *   - Darwin (Mac do Jonathan): prefixa `ssh server-ecoup 'multica ...'`
 *     (os binarios `multica` e o daemon vivem na VPS Dev, nao no Mac).
 *   - Linux / VPS Dev: roda `multica ...` direto.
 *
 * Todas as funcoes aceitam { dryRun }: quando true, NAO executam nada —
 * retornam { dryRun:true, command:"<comando que rodaria>" }. Isso garante
 * que nenhum project/issue de teste seja criado no board de PRODUCAO.
 *
 * Mapeamento de identidade (metadata KV por issue, reconciliacao idempotente):
 *   up_project=<repo>, up_phase=N, gh_issue=<n>, branch=<up/fase-NN>, pr=<n>
 *
 * Status UP -> Multica (statuses validos do schema:
 *   backlog/todo/in_progress/in_review/done/blocked/cancelled):
 *   in_progress->in_progress, in_review->in_review, done->done,
 *   blocked->blocked, todo->todo.
 *
 * Exporta: ensureProject, ensurePhaseIssue, syncStatus, boardUrl.
 */

const { execFileSync } = require('child_process');
const path = require('path');

// =====================================================================
// Deteccao de ambiente (uname) + montagem de comando
// =====================================================================

/** `uname -s`. Em erro, assume Linux (VPS). */
function unameSync() {
  try {
    return execFileSync('uname', ['-s'], { encoding: 'utf-8' }).trim();
  } catch {
    return 'Linux';
  }
}

/** true quando rodando no Mac do Jonathan (precisa de ssh server-ecoup). */
function isMac() {
  return unameSync() === 'Darwin';
}

// Status UP -> Multica (1:1 nos casos que importam; os demais sao passthrough
// quando ja sao statuses validos do schema).
const STATUS_MAP = {
  in_progress: 'in_progress',
  in_review: 'in_review',
  done: 'done',
  blocked: 'blocked',
  todo: 'todo',
  backlog: 'backlog',
  cancelled: 'cancelled',
};

const VALID_STATUSES = new Set(Object.keys(STATUS_MAP));

function mapStatus(status) {
  return STATUS_MAP[status] || null;
}

/**
 * Escapa um argumento para exibicao/uso dentro de uma string de shell single-quoted.
 * Usado tanto para montar o comando ssh quanto para o preview do dry-run.
 */
function shellQuote(arg) {
  const s = String(arg);
  if (/^[a-zA-Z0-9._\-/=:@,]+$/.test(s)) return s;
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

/**
 * Monta a representacao do comando que seria executado (para dry-run e ssh).
 * Em Mac: `ssh server-ecoup 'multica <args>'` (multica + args viram um unico
 * payload single-quoted pro shell remoto). Em Linux: `multica <args>`.
 */
function buildCommandString(args) {
  const inner = ['multica', ...args].map(shellQuote).join(' ');
  if (isMac()) {
    return 'ssh server-ecoup ' + shellQuote(inner);
  }
  return inner;
}

/**
 * Executa `multica <args>` (ou via ssh em Mac). FAIL-OPEN: nunca lanca.
 * Retorna { exitCode, stdout, stderr }.
 *
 * @param {string} cwd  diretorio de execucao (so afeta o processo local; em
 *                      Mac o `cwd` real do multica e o da VPS, mas o CLI usa
 *                      o workspace default do profile, entao isso e benigno).
 */
function runMultica(cwd, args) {
  try {
    let bin, fullArgs;
    if (isMac()) {
      // ssh server-ecoup 'multica <args...>' — empacota tudo num payload remoto.
      const remote = ['multica', ...args].map(shellQuote).join(' ');
      bin = 'ssh';
      fullArgs = ['server-ecoup', remote];
    } else {
      bin = 'multica';
      fullArgs = args;
    }
    const stdout = execFileSync(bin, fullArgs, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
    });
    return { exitCode: 0, stdout: (stdout || '').trim(), stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: (err.stdout ?? '').toString().trim(),
      stderr: (err.stderr ?? err.message ?? '').toString().trim(),
    };
  }
}

/** Parse JSON best-effort. Em erro, null. */
function tryParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // alguns comandos imprimem linhas extras antes/depois do JSON
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Nome do repo (= up_project). Usa basename do toplevel/cwd. */
function repoName(cwd) {
  return path.basename(cwd);
}

// =====================================================================
// ensureProject — garante 1 project Multica por repo (idempotente)
// =====================================================================

/**
 * ensureProject({ cwd, name, dryRun })
 *  - Procura um project existente pelo titulo (== name). Se achar, retorna o id.
 *  - Se nao achar, cria via `multica project create --title <name> --output json`.
 *  - dryRun: retorna o comando de create que rodaria, sem executar.
 * FAIL-OPEN: erro -> { ok:false, warning }.
 *
 * Retorno: { ok, project_id?, identifier?, created?, dryRun?, command?, warning? }
 */
function ensureProject({ cwd, name, dryRun = false }) {
  const title = name || repoName(cwd);
  const createArgs = ['project', 'create', '--title', title, '--output', 'json'];

  if (dryRun) {
    return { ok: true, dryRun: true, command: buildCommandString(createArgs), title };
  }

  // 1) Procura project existente pelo titulo (idempotencia).
  const listRes = runMultica(cwd, ['project', 'list', '--output', 'json']);
  if (listRes.exitCode === 0) {
    const parsed = tryParseJson(listRes.stdout);
    const projects = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.projects) ? parsed.projects : []);
    const found = projects.find(p => p && (p.title === title || p.name === title));
    if (found && found.id) {
      return { ok: true, project_id: found.id, identifier: found.identifier || null, created: false };
    }
  } else {
    return {
      ok: false,
      warning: `multica project list falhou: ${listRes.stderr || listRes.stdout || 'erro desconhecido'} (board ignorado, build segue)`,
    };
  }

  // 2) Cria.
  const createRes = runMultica(cwd, createArgs);
  if (createRes.exitCode !== 0) {
    return {
      ok: false,
      warning: `multica project create falhou: ${createRes.stderr || createRes.stdout || 'erro desconhecido'} (board ignorado, build segue)`,
    };
  }
  const created = tryParseJson(createRes.stdout);
  if (!created || !created.id) {
    return { ok: false, warning: 'multica project create nao retornou id (board ignorado, build segue)' };
  }
  return { ok: true, project_id: created.id, identifier: created.identifier || null, created: true };
}

// =====================================================================
// ensurePhaseIssue — garante 1 issue por fase (idempotente via metadata)
// =====================================================================

/**
 * ensurePhaseIssue({ cwd, phase, title, parent, project, dryRun })
 *  - Reconciliacao idempotente: procura issue ja existente filtrando por
 *    metadata up_project=<repo> AND up_phase=<phase>. Se achar, retorna o id
 *    (nao duplica).
 *  - Se nao achar, cria a issue (--status backlog, sem assignee — respeita o
 *    "empilha por padrao"/sem disparo automatico) com --parent quando dado, e
 *    grava metadata up_project + up_phase.
 *  - dryRun: retorna os comandos (create + metadata) que rodariam, sem executar.
 * FAIL-OPEN.
 *
 * Retorno: { ok, issue_id?, identifier?, created?, dryRun?, command?, warning? }
 */
function ensurePhaseIssue({ cwd, phase, title, parent, project, dryRun = false }) {
  const proj = repoName(cwd);
  const issueTitle = title || `Fase ${phase}`;

  const createArgs = ['issue', 'create', '--title', issueTitle, '--status', 'backlog', '--output', 'json'];
  if (project) createArgs.push('--project', String(project));
  if (parent) createArgs.push('--parent', String(parent));

  // comandos de metadata (rodados apos create, com o issue id real)
  const metaPreview = [
    ['issue', 'metadata', 'set', '<issue-id>', '--key', 'up_project', '--value', proj, '--type', 'string'],
    ['issue', 'metadata', 'set', '<issue-id>', '--key', 'up_phase', '--value', String(phase), '--type', 'number'],
  ];

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      command: buildCommandString(createArgs),
      metadata_commands: metaPreview.map(buildCommandString),
      title: issueTitle,
    };
  }

  // 1) Reconciliacao: issue ja existe pra (up_project, up_phase)?
  const existing = findPhaseIssue({ cwd, phase, project: proj });
  if (existing.ok && existing.issue_id) {
    return { ok: true, issue_id: existing.issue_id, identifier: existing.identifier || null, created: false };
  }

  // 2) Cria a issue.
  const createRes = runMultica(cwd, createArgs);
  if (createRes.exitCode !== 0) {
    return {
      ok: false,
      warning: `multica issue create falhou: ${createRes.stderr || createRes.stdout || 'erro desconhecido'} (board ignorado, build segue)`,
    };
  }
  const created = tryParseJson(createRes.stdout);
  if (!created || !created.id) {
    return { ok: false, warning: 'multica issue create nao retornou id (board ignorado, build segue)' };
  }
  const issueId = created.id;

  // 3) Grava metadata de identidade (best-effort: warning agrega, nao quebra).
  const warnings = [];
  const m1 = runMultica(cwd, ['issue', 'metadata', 'set', issueId, '--key', 'up_project', '--value', proj, '--type', 'string']);
  if (m1.exitCode !== 0) warnings.push('metadata up_project: ' + (m1.stderr || m1.stdout));
  const m2 = runMultica(cwd, ['issue', 'metadata', 'set', issueId, '--key', 'up_phase', '--value', String(phase), '--type', 'number']);
  if (m2.exitCode !== 0) warnings.push('metadata up_phase: ' + (m2.stderr || m2.stdout));

  return {
    ok: true,
    issue_id: issueId,
    identifier: created.identifier || null,
    created: true,
    warning: warnings.length ? warnings.join('; ') : undefined,
  };
}

/**
 * findPhaseIssue({ cwd, phase, project }) — reconciliacao idempotente.
 * `multica issue list --metadata up_project=<repo> --metadata up_phase=N --output json`.
 * Retorna { ok, issue_id?, identifier? } (ok=false em erro — fail-open no caller).
 */
function findPhaseIssue({ cwd, phase, project }) {
  const proj = project || repoName(cwd);
  const args = [
    'issue', 'list',
    '--metadata', `up_project=${proj}`,
    '--metadata', `up_phase=${phase}`,
    '--output', 'json',
  ];
  const res = runMultica(cwd, args);
  if (res.exitCode !== 0) {
    return { ok: false, warning: res.stderr || res.stdout || 'issue list falhou' };
  }
  const parsed = tryParseJson(res.stdout);
  const issues = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.issues) ? parsed.issues : []);
  if (issues.length && issues[0] && issues[0].id) {
    return { ok: true, issue_id: issues[0].id, identifier: issues[0].identifier || null };
  }
  return { ok: true, issue_id: null };
}

// =====================================================================
// syncStatus — espelha status UP -> Multica (batched) + metadata
// =====================================================================

/**
 * syncStatus({ cwd, phase, status, metadata, dryRun, issueId })
 *  - Mapeia o status UP -> Multica e aplica via `multica issue status <id> <status>`.
 *  - Resolve o issue id por reconciliacao (metadata up_project + up_phase) se
 *    nao vier explicitamente (issueId).
 *  - metadata (objeto, ex { gh_issue, branch, pr }) -> `issue metadata set` por chave.
 *  - dryRun: imprime os comandos que rodariam (status + metadata), sem executar
 *    e sem precisar resolver o id real (usa placeholder <issue-id>).
 * FAIL-OPEN: status invalido ou issue inexistente -> { ok:false, warning }.
 *
 * Retorno: { ok, issue_id?, status?, dryRun?, command?, metadata_commands?, warning? }
 */
function syncStatus({ cwd, phase, status, metadata = {}, dryRun = false, issueId = null }) {
  const mapped = mapStatus(status);
  const metaEntries = Object.entries(metadata || {}).filter(([, v]) => v !== null && v !== undefined && v !== '');

  if (!mapped) {
    return {
      ok: false,
      warning: `status UP "${status}" nao mapeia para Multica (validos: ${[...VALID_STATUSES].join('/')}); board ignorado, build segue`,
    };
  }

  // dry-run: monta comandos com placeholder, sem tocar no board.
  if (dryRun) {
    const idForPreview = issueId || '<issue-id>';
    const statusCmd = buildCommandString(['issue', 'status', idForPreview, mapped, '--output', 'json']);
    const metaCmds = metaEntries.map(([k, v]) =>
      buildCommandString(['issue', 'metadata', 'set', idForPreview, '--key', k, '--value', String(v)])
    );
    const lookupCmd = issueId
      ? null
      : buildCommandString([
          'issue', 'list',
          '--metadata', `up_project=${repoName(cwd)}`,
          '--metadata', `up_phase=${phase}`,
          '--output', 'json',
        ]);
    return {
      ok: true,
      dryRun: true,
      phase: phase ?? null,
      status: mapped,
      lookup_command: lookupCmd,
      command: statusCmd,
      metadata_commands: metaCmds,
    };
  }

  // resolve issue id (reconciliacao por metadata) se nao foi passado.
  let id = issueId;
  if (!id) {
    const found = findPhaseIssue({ cwd, phase });
    if (!found.ok) {
      return { ok: false, warning: `multica issue list falhou: ${found.warning} (board ignorado, build segue)` };
    }
    id = found.issue_id;
    if (!id) {
      return { ok: false, warning: `nenhuma issue Multica para up_phase=${phase} (rode ensurePhaseIssue antes); board ignorado, build segue` };
    }
  }

  const warnings = [];

  // aplica status.
  const statusRes = runMultica(cwd, ['issue', 'status', id, mapped, '--output', 'json']);
  if (statusRes.exitCode !== 0) {
    warnings.push('status: ' + (statusRes.stderr || statusRes.stdout));
  }

  // aplica metadata (gh_issue, branch, pr, ...).
  for (const [k, v] of metaEntries) {
    const mRes = runMultica(cwd, ['issue', 'metadata', 'set', id, '--key', k, '--value', String(v)]);
    if (mRes.exitCode !== 0) warnings.push(`metadata ${k}: ` + (mRes.stderr || mRes.stdout));
  }

  if (warnings.length) {
    return { ok: false, issue_id: id, status: mapped, warning: warnings.join('; ') + ' (board parcial, build segue)' };
  }
  return { ok: true, issue_id: id, status: mapped };
}

// =====================================================================
// boardUrl — imprime a URL do board (workspace/project)
// =====================================================================

/**
 * boardUrl({ cwd, project }) — retorna a URL do board Multica.
 * Best-effort: usa a base conhecida da instancia EcoUp self-hosted.
 * NUNCA crasha. Nao depende de chamada de rede.
 *
 * Retorno: { ok, url, project? }
 */
function boardUrl({ cwd, project = null } = {}) {
  const base = 'https://multica.ecoup.digital';
  if (project) {
    return { ok: true, url: `${base}/projects/${project}`, project };
  }
  return { ok: true, url: base };
}

module.exports = {
  ensureProject,
  ensurePhaseIssue,
  syncStatus,
  boardUrl,
  // helpers expostos para reuso/teste
  findPhaseIssue,
  mapStatus,
  isMac,
  buildCommandString,
  STATUS_MAP,
};
