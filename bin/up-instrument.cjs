#!/usr/bin/env node

/**
 * UP Instrumentation — measures token usage per UP agent
 *
 * Reads Claude Code session.jsonl + subagent jsonls and produces a token cost
 * report grouped by agent. Used to identify the heaviest agents (so we know
 * where to apply tiered context optimizations) and to give users visibility
 * into the cost of a build.
 *
 * Usage:
 *   node up-instrument.cjs report                # current project, current session
 *   node up-instrument.cjs report --all-sessions # current project, all sessions
 *   node up-instrument.cjs report --json         # JSON output
 *   node up-instrument.cjs watch                 # write .plano/INSTRUMENTATION.md continuously
 *
 * Opt-in via /up:configurar (instrumentation.enabled = true).
 * Default: off.
 *
 * NOTE: Only works with Claude Code runtime (reads ~/.claude/projects).
 *       OpenCode and Gemini CLI use different log formats — falls back gracefully.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const CLAUDE_PROJECTS = path.join(HOME, '.claude', 'projects');

// Convert /home/projects/up-cc → -home-projects-up-cc
function projectKey(cwd) {
  return cwd.replace(/^\//, '').replace(/\//g, '-').replace(/^/, '-');
}

function listSessions(projectDir) {
  if (!fs.existsSync(projectDir)) return [];
  return fs
    .readdirSync(projectDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(projectDir, d.name));
}

function listJsonls(sessionDir) {
  const files = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.jsonl')) files.push(full);
    }
  };
  walk(sessionDir);
  return files;
}

function parseJsonl(file) {
  const events = [];
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return events;
  }
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      // skip malformed
    }
  }
  return events;
}

// Build canonical list of UP agent names from agents/ directory.
// This gives us ground truth and avoids false matches like "up-hover" or "up-load".
function loadUpAgentNames() {
  const candidates = [
    path.join(__dirname, '..', 'agents'),
    path.join(__dirname, '..', 'up', 'agents'),
    path.join(HOME, '.claude', 'up', 'agents'),
    path.join(HOME, '.claude', 'agents'),
  ];
  const names = new Set();
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith('up-') && f.endsWith('.md')) {
        names.add(f.replace(/\.md$/, ''));
      }
    }
  }
  return names;
}

const KNOWN_UP_AGENTS = loadUpAgentNames();

// Extract agent name from a subagent jsonl path or first event.
// Subagent files live in <session>/subagents/agent-<id>.jsonl.
function detectAgentName(events, file) {
  // Strategy 1: scan events for known UP agent names in content
  for (const ev of events.slice(0, 5)) {
    const c = ev?.message?.content;
    let text = '';
    if (typeof c === 'string') text = c;
    else if (Array.isArray(c)) {
      text = c
        .map((item) => (typeof item === 'string' ? item : item?.text || ''))
        .join(' ');
    }
    if (!text) continue;

    // Match against canonical UP agent names
    for (const name of KNOWN_UP_AGENTS) {
      if (text.includes(name)) return name;
    }

    // Match "Voce e o {something}" pattern from UP role definitions
    const roleMatch = text.match(/Voce e o ([A-Z][a-zA-Z ]+?)( UP|\.|,|\n)/);
    if (roleMatch) {
      const role = roleMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
      const candidate = `up-${role}`;
      if (KNOWN_UP_AGENTS.has(candidate)) return candidate;
    }
  }

  // Strategy 2: top-level fields
  for (const ev of events.slice(0, 3)) {
    if (ev?.subagent_type && ev.subagent_type.startsWith('up-')) {
      return ev.subagent_type;
    }
    if (ev?.slug && ev.slug.startsWith('up-') && KNOWN_UP_AGENTS.has(ev.slug)) {
      return ev.slug;
    }
  }

  // Strategy 3: file id fallback (grouped under "non-up" so we don't pollute UP stats)
  const m = file.match(/agent-([a-z0-9]+)\.jsonl$/);
  return m ? `non-up-agent` : 'unknown';
}

function aggregateUsage(events) {
  let input = 0;
  let cacheCreation = 0;
  let cacheRead = 0;
  let output = 0;
  let calls = 0;
  for (const ev of events) {
    const u = ev?.message?.usage || ev?.usage;
    if (!u) continue;
    input += u.input_tokens || 0;
    cacheCreation += u.cache_creation_input_tokens || 0;
    cacheRead += u.cache_read_input_tokens || 0;
    output += u.output_tokens || 0;
    calls += 1;
  }
  return { input, cacheCreation, cacheRead, output, calls };
}

// Opus 4.6 1M pricing (rough): input $15/M, output $75/M, cache write $18.75/M, cache read $1.50/M
function estimateCost(usage) {
  const PRICE = {
    input: 15 / 1_000_000,
    cacheCreation: 18.75 / 1_000_000,
    cacheRead: 1.5 / 1_000_000,
    output: 75 / 1_000_000,
  };
  return (
    usage.input * PRICE.input +
    usage.cacheCreation * PRICE.cacheCreation +
    usage.cacheRead * PRICE.cacheRead +
    usage.output * PRICE.output
  );
}

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function buildReport(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const projectDir = path.join(CLAUDE_PROJECTS, projectKey(cwd));
  const sessions = listSessions(projectDir);
  if (sessions.length === 0) {
    return { error: 'no_sessions', message: `No Claude Code sessions found for ${cwd}. Are you running in Claude Code runtime?` };
  }

  const targetSessions = opts.allSessions ? sessions : [sessions[sessions.length - 1]];
  const byAgent = new Map();
  const filesScanned = [];

  for (const sessionDir of targetSessions) {
    const subagentDir = path.join(sessionDir, 'subagents');
    const files = listJsonls(subagentDir);
    for (const file of files) {
      filesScanned.push(file);
      const events = parseJsonl(file);
      const name = detectAgentName(events, file);
      const usage = aggregateUsage(events);
      const prev = byAgent.get(name) || { input: 0, cacheCreation: 0, cacheRead: 0, output: 0, calls: 0, invocations: 0 };
      prev.input += usage.input;
      prev.cacheCreation += usage.cacheCreation;
      prev.cacheRead += usage.cacheRead;
      prev.output += usage.output;
      prev.calls += usage.calls;
      prev.invocations += 1;
      byAgent.set(name, prev);
    }
  }

  const rows = [];
  let totalCost = 0;
  let totalInput = 0;
  let totalOutput = 0;
  for (const [agent, u] of byAgent.entries()) {
    const cost = estimateCost(u);
    totalCost += cost;
    totalInput += u.input + u.cacheCreation + u.cacheRead;
    totalOutput += u.output;
    rows.push({
      agent,
      invocations: u.invocations,
      input: u.input + u.cacheCreation + u.cacheRead,
      output: u.output,
      cost,
      avgPerInvoc: u.invocations > 0 ? (u.input + u.cacheCreation + u.cacheRead) / u.invocations : 0,
    });
  }
  rows.sort((a, b) => b.cost - a.cost);

  return {
    cwd,
    sessions: targetSessions.length,
    files_scanned: filesScanned.length,
    total_input_tokens: totalInput,
    total_output_tokens: totalOutput,
    total_cost_usd: totalCost,
    agents: rows,
  };
}

function renderMarkdown(report) {
  if (report.error) return `# Instrumentation\n\n${report.message}\n`;
  const lines = [];
  lines.push('# Token Instrumentation');
  lines.push('');
  lines.push(`Project: \`${report.cwd}\``);
  lines.push(`Sessions analyzed: ${report.sessions}`);
  lines.push(`Subagent files scanned: ${report.files_scanned}`);
  lines.push('');
  lines.push('## Totals');
  lines.push(`- Input tokens: **${formatNumber(report.total_input_tokens)}**`);
  lines.push(`- Output tokens: **${formatNumber(report.total_output_tokens)}**`);
  lines.push(`- Estimated cost (Opus 4.6 pricing): **$${report.total_cost_usd.toFixed(2)}**`);
  lines.push('');
  lines.push('## Top agents by cost');
  lines.push('');
  lines.push('| Agent | Invocations | Input | Avg/invoc | Output | Cost |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const row of report.agents.slice(0, 20)) {
    lines.push(
      `| ${row.agent} | ${row.invocations} | ${formatNumber(row.input)} | ${formatNumber(row.avgPerInvoc)} | ${formatNumber(row.output)} | $${row.cost.toFixed(2)} |`
    );
  }
  lines.push('');
  lines.push(`> Generated by \`up-instrument\` at ${new Date().toISOString()}`);
  lines.push('> Pricing assumes Claude Opus 4.6 1M context. Real cost may vary.');
  return lines.join('\n') + '\n';
}

function renderTable(report) {
  if (report.error) return report.message;
  const lines = [];
  lines.push(`Project: ${report.cwd}`);
  lines.push(`Sessions: ${report.sessions}  Files: ${report.files_scanned}`);
  lines.push(`Total: ${formatNumber(report.total_input_tokens)} in / ${formatNumber(report.total_output_tokens)} out / $${report.total_cost_usd.toFixed(2)}`);
  lines.push('');
  lines.push('Top agents:');
  for (const row of report.agents.slice(0, 15)) {
    const pad = (s, n) => String(s).padEnd(n);
    lines.push(`  ${pad(row.agent, 30)} ${pad(row.invocations + 'x', 6)} ${pad(formatNumber(row.input), 8)} avg ${pad(formatNumber(row.avgPerInvoc), 8)} $${row.cost.toFixed(2)}`);
  }
  return lines.join('\n');
}

// CLI
const args = process.argv.slice(2);
const cmd = args[0] || 'report';
const opts = {
  allSessions: args.includes('--all-sessions'),
  json: args.includes('--json'),
  cwd: process.cwd(),
};

if (cmd === 'report') {
  const report = buildReport(opts);
  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderTable(report));
  }
} else if (cmd === 'write') {
  const report = buildReport(opts);
  const planoDir = path.join(opts.cwd, '.plano');
  if (!fs.existsSync(planoDir)) {
    console.error('No .plano directory found in current cwd. Run from a UP project root.');
    process.exit(1);
  }
  const outFile = path.join(planoDir, 'INSTRUMENTATION.md');
  fs.writeFileSync(outFile, renderMarkdown(report));
  console.log(`Wrote ${outFile}`);
} else if (cmd === '--help' || cmd === 'help') {
  console.log(`up-instrument — token usage measurement for UP agents

Commands:
  report                Print top agents by cost (default, current session)
  report --all-sessions Same but across all sessions for current project
  report --json         JSON output
  write                 Write .plano/INSTRUMENTATION.md (current session)
  write --all-sessions  Write report across all sessions

Notes:
  - Only works with Claude Code (reads ~/.claude/projects/<key>/subagents/*.jsonl)
  - OpenCode and Gemini CLI use different log formats and are not supported yet
  - Pricing assumes Claude Opus 4.6 1M context — real cost may vary`);
} else {
  console.error(`Unknown command: ${cmd}. Try 'help'.`);
  process.exit(1);
}
