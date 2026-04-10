#!/usr/bin/env node

/**
 * UP Installer — installs UP system into CLI tool config directories
 *
 * Supports: Claude Code, Gemini CLI, OpenCode, Codex
 *
 * Usage:
 *   node install.js                    # Interactive install
 *   node install.js --claude --global  # Install for Claude Code globally
 *   node install.js --gemini --global  # Install for Gemini globally
 *   node install.js --all --global     # Install for all runtimes
 *   node install.js --uninstall        # Remove UP files
 *
 * What gets installed:
 *   up/          → <config>/up/          (CLI, workflows, templates, references)
 *   agents/up-*  → <config>/agents/      (UP agents)
 *   commands/up/ → <config>/commands/up/  (UP slash commands)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const dim = '\x1b[2m';
const bold = '\x1b[1m';
const reset = '\x1b[0m';

// Version from package.json
const pkg = require('../package.json');
const VERSION = pkg.version;

// Parse args
const args = process.argv.slice(2);
const hasGlobal = args.includes('--global') || args.includes('-g');
const hasLocal = args.includes('--local') || args.includes('-l');
const hasClaude = args.includes('--claude');
const hasGemini = args.includes('--gemini');
const hasOpencode = args.includes('--opencode');
const hasAll = args.includes('--all');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');
const hasHelp = args.includes('--help') || args.includes('-h');

// Runtime selection
let selectedRuntimes = [];
if (hasAll) {
  selectedRuntimes = ['claude', 'gemini', 'opencode'];
} else {
  if (hasClaude) selectedRuntimes.push('claude');
  if (hasGemini) selectedRuntimes.push('gemini');
  if (hasOpencode) selectedRuntimes.push('opencode');
}

const banner = '\n' +
  cyan + '  ██╗   ██╗██████╗\n' +
  '  ██║   ██║██╔══██╗\n' +
  '  ██║   ██║██████╔╝\n' +
  '  ██║   ██║██╔═══╝\n' +
  '  ╚██████╔╝██║\n' +
  '   ╚═════╝ ╚═╝' + reset + '\n\n' +
  '  UP ' + dim + 'v' + VERSION + reset + '\n' +
  '  Simplified spec-driven development for Claude Code, Gemini and OpenCode.\n';

console.log(banner);

if (hasHelp) {
  console.log(`  ${yellow}Usage:${reset} node install.js [options]\n`);
  console.log(`  ${yellow}Options:${reset}`);
  console.log(`    ${cyan}-g, --global${reset}      Install globally (to config directory)`);
  console.log(`    ${cyan}-l, --local${reset}       Install locally (to current directory)`);
  console.log(`    ${cyan}--claude${reset}           Install for Claude Code`);
  console.log(`    ${cyan}--gemini${reset}           Install for Gemini CLI`);
  console.log(`    ${cyan}--opencode${reset}         Install for OpenCode`);
  console.log(`    ${cyan}--all${reset}              Install for all runtimes`);
  console.log(`    ${cyan}-u, --uninstall${reset}   Remove all UP files`);
  console.log(`    ${cyan}-h, --help${reset}        Show this help\n`);
  console.log(`  ${yellow}Examples:${reset}`);
  console.log(`    ${dim}# Interactive install${reset}`);
  console.log(`    node install.js\n`);
  console.log(`    ${dim}# Install for Claude Code globally${reset}`);
  console.log(`    node install.js --claude --global\n`);
  console.log(`    ${dim}# Install for Gemini globally${reset}`);
  console.log(`    node install.js --gemini --global\n`);
  console.log(`    ${dim}# Install for all runtimes${reset}`);
  console.log(`    node install.js --all --global\n`);
  process.exit(0);
}

// Determine source directory (package root = one level up from bin/)
const scriptDir = __dirname;
const packageRoot = path.resolve(scriptDir, '..');

// ── Runtime Helpers ──

function getDirName(runtime) {
  if (runtime === 'opencode') return '.opencode';
  if (runtime === 'gemini') return '.gemini';
  return '.claude';
}

function getRuntimeLabel(runtime) {
  if (runtime === 'opencode') return 'OpenCode';
  if (runtime === 'gemini') return 'Gemini';
  return 'Claude Code';
}

function getGlobalDir(runtime) {
  if (runtime === 'opencode') {
    if (process.env.OPENCODE_CONFIG_DIR) return process.env.OPENCODE_CONFIG_DIR;
    if (process.env.XDG_CONFIG_HOME) return path.join(process.env.XDG_CONFIG_HOME, 'opencode');
    return path.join(os.homedir(), '.config', 'opencode');
  }
  if (runtime === 'gemini') {
    if (process.env.GEMINI_CONFIG_DIR) return process.env.GEMINI_CONFIG_DIR;
    return path.join(os.homedir(), '.gemini');
  }
  // Claude Code
  if (process.env.CLAUDE_CONFIG_DIR) return process.env.CLAUDE_CONFIG_DIR;
  return path.join(os.homedir(), '.claude');
}

function getTargetDir(runtime, isGlobal) {
  if (isGlobal) return getGlobalDir(runtime);
  return path.join(process.cwd(), getDirName(runtime));
}

/**
 * Convert absolute path to $HOME-relative form for portable path replacement
 */
function toHomePrefix(pathPrefix) {
  const home = os.homedir().replace(/\\/g, '/');
  const normalized = pathPrefix.replace(/\\/g, '/');
  if (normalized.startsWith(home)) {
    return '$HOME' + normalized.slice(home.length);
  }
  return normalized;
}

// ── Tool Name Conversion ──

// Claude Code → Gemini CLI tool name mapping
const claudeToGeminiTools = {
  Read: 'read_file',
  Write: 'write_file',
  Edit: 'replace',
  Bash: 'run_shell_command',
  Glob: 'glob',
  Grep: 'search_file_content',
  WebSearch: 'google_web_search',
  WebFetch: 'web_fetch',
  TodoWrite: 'write_todos',
  AskUserQuestion: 'ask_user',
};

// Claude Code → OpenCode tool name mapping
const claudeToOpencodeTools = {
  AskUserQuestion: 'question',
  SlashCommand: 'skill',
  TodoWrite: 'todowrite',
  WebFetch: 'webfetch',
  WebSearch: 'websearch',
};

function convertGeminiToolName(claudeTool) {
  if (claudeTool.startsWith('mcp__')) return null; // Auto-discovered in Gemini
  if (claudeToGeminiTools[claudeTool]) return claudeToGeminiTools[claudeTool];
  return claudeTool.toLowerCase();
}

function convertOpencodeToolName(claudeTool) {
  if (claudeToOpencodeTools[claudeTool]) return claudeToOpencodeTools[claudeTool];
  if (claudeTool.startsWith('mcp__')) return claudeTool;
  return claudeTool.toLowerCase();
}

// ── Frontmatter Conversion ──

function extractFrontmatterAndBody(content) {
  if (!content.startsWith('---')) return { frontmatter: null, body: content };
  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) return { frontmatter: null, body: content };
  return {
    frontmatter: content.substring(3, endIndex).trim(),
    body: content.substring(endIndex + 3),
  };
}

function extractFrontmatterField(frontmatter, fieldName) {
  const regex = new RegExp(`^${fieldName}:\\s*(.+)$`, 'm');
  const match = frontmatter.match(regex);
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Convert Claude Code agent .md to Gemini CLI format
 * - tools: must be a YAML array with Gemini tool names
 * - color: must be removed (causes validation error)
 * - ${VAR} patterns escaped to $VAR (Gemini template engine conflict)
 */
function convertAgentToGemini(content) {
  const { frontmatter, body } = extractFrontmatterAndBody(content);
  if (!frontmatter) return content;

  const lines = frontmatter.split('\n');
  const newLines = [];
  const tools = [];
  let inTools = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('tools:')) {
      const toolsValue = trimmed.substring(6).trim();
      if (toolsValue) {
        const parsed = toolsValue.split(',').map(t => t.trim()).filter(t => t);
        for (const t of parsed) {
          const mapped = convertGeminiToolName(t);
          if (mapped) tools.push(mapped);
        }
      } else {
        inTools = true;
      }
      continue;
    }

    if (trimmed.startsWith('color:')) continue; // Not supported by Gemini

    if (inTools) {
      if (trimmed.startsWith('- ')) {
        const mapped = convertGeminiToolName(trimmed.substring(2).trim());
        if (mapped) tools.push(mapped);
        continue;
      } else if (trimmed && !trimmed.startsWith('-')) {
        inTools = false;
      }
    }

    if (!inTools) newLines.push(line);
  }

  if (tools.length > 0) {
    newLines.push('tools:');
    for (const tool of tools) {
      newLines.push(`  - ${tool}`);
    }
  }

  // Escape ${VAR} to $VAR (Gemini templateString() conflicts)
  const escapedBody = body.replace(/\$\{(\w+)\}/g, '$$$1');
  // Strip <sub> tags (terminals can't render subscript)
  const cleanBody = escapedBody.replace(/<sub>(.*?)<\/sub>/g, '*($1)*');

  return `---\n${newLines.join('\n').trim()}\n---${cleanBody}`;
}

/**
 * Convert Claude Code agent .md to OpenCode format
 * - tools: must be object with tool: true pairs
 * - color: must be hex
 * - name: removed (OpenCode uses filename)
 */
const colorNameToHex = {
  cyan: '#00FFFF', red: '#FF0000', green: '#00FF00', blue: '#0000FF',
  yellow: '#FFFF00', magenta: '#FF00FF', orange: '#FFA500', purple: '#800080',
  gold: '#FFD700', pink: '#FFC0CB', brown: '#8B4513',
};

function convertAgentToOpencode(content) {
  // Replace tool references in content
  let converted = content;
  converted = converted.replace(/\bAskUserQuestion\b/g, 'question');
  converted = converted.replace(/\bSlashCommand\b/g, 'skill');
  converted = converted.replace(/\bTodoWrite\b/g, 'todowrite');
  converted = converted.replace(/\/up:/g, '/up-'); // OpenCode flat command structure

  const { frontmatter, body } = extractFrontmatterAndBody(converted);
  if (!frontmatter) return converted;

  const lines = frontmatter.split('\n');
  const newLines = [];
  const tools = [];
  let inTools = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('name:')) continue; // OpenCode uses filename
    if (trimmed.startsWith('tools:')) {
      const toolsValue = trimmed.substring(6).trim();
      if (toolsValue) {
        tools.push(...toolsValue.split(',').map(t => t.trim()).filter(t => t));
      } else {
        inTools = true;
      }
      continue;
    }
    if (trimmed.startsWith('color:')) {
      const colorValue = trimmed.substring(6).trim().toLowerCase();
      const hex = colorNameToHex[colorValue];
      if (hex) newLines.push(`color: "${hex}"`);
      continue;
    }
    if (inTools) {
      if (trimmed.startsWith('- ')) {
        tools.push(trimmed.substring(2).trim());
        continue;
      } else if (trimmed && !trimmed.startsWith('-')) {
        inTools = false;
      }
    }
    if (!inTools) newLines.push(line);
  }

  if (tools.length > 0) {
    newLines.push('tools:');
    for (const tool of tools) {
      newLines.push(`  ${convertOpencodeToolName(tool)}: true`);
    }
  }

  return `---\n${newLines.join('\n').trim()}\n---${body}`;
}

/**
 * Convert Claude Code command .md to Gemini TOML format
 */
function convertCommandToGeminiToml(content) {
  const { frontmatter, body } = extractFrontmatterAndBody(content);
  let description = '';
  if (frontmatter) {
    description = extractFrontmatterField(frontmatter, 'description') || '';
  }
  let toml = '';
  if (description) toml += `description = ${JSON.stringify(description)}\n`;
  toml += `prompt = ${JSON.stringify(body.trim())}\n`;
  return toml;
}

// ── File Copy ──

/**
 * Build path prefix string for $HOME-relative replacement
 */
function buildPathPrefix(targetDir, isGlobal, runtime) {
  if (isGlobal) return `${targetDir.replace(/\\/g, '/')}/`;
  return `./${getDirName(runtime)}/`;
}

/**
 * Replace path references in content for target runtime
 */
function replacePaths(content, pathPrefix, runtime) {
  const homePrefix = toHomePrefix(pathPrefix);
  content = content.replace(/\$HOME\/\.claude\//g, homePrefix);
  content = content.replace(/~\/\.claude\//g, homePrefix);

  if (runtime === 'opencode') {
    content = content.replace(/\/up:/g, '/up-');
    content = content.replace(/subagent_type="general-purpose"/g, 'subagent_type="general"');
  }

  return content;
}

/**
 * Recursively copy directory with path replacement and optional runtime conversion
 */
function copyDirWithReplace(src, dest, pathPrefix, runtime, isCommand = false) {
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirWithReplace(srcPath, destPath, pathPrefix, runtime, isCommand);
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.cjs') || entry.name.endsWith('.js') || entry.name.endsWith('.json')) {
      let content = fs.readFileSync(srcPath, 'utf8');
      content = replacePaths(content, pathPrefix, runtime);

      // Convert commands to TOML for Gemini
      if (runtime === 'gemini' && isCommand && entry.name.endsWith('.md')) {
        const toml = convertCommandToGeminiToml(content);
        fs.writeFileSync(destPath.replace(/\.md$/, '.toml'), toml);
      } else {
        fs.writeFileSync(destPath, content);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy commands flattened for OpenCode (commands/up/help.md → command/up-help.md)
 */
function copyFlattenedCommands(srcDir, destDir, prefix, pathPrefix, runtime) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  // Remove old up-*.md files
  if (fs.existsSync(destDir)) {
    for (const file of fs.readdirSync(destDir)) {
      if (file.startsWith(`${prefix}-`) && file.endsWith('.md')) {
        fs.unlinkSync(path.join(destDir, file));
      }
    }
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      copyFlattenedCommands(srcPath, destDir, `${prefix}-${entry.name}`, pathPrefix, runtime);
    } else if (entry.name.endsWith('.md')) {
      const baseName = entry.name.replace('.md', '');
      const destPath = path.join(destDir, `${prefix}-${baseName}.md`);
      let content = fs.readFileSync(srcPath, 'utf8');
      content = replacePaths(content, pathPrefix, runtime);
      content = convertAgentToOpencode(content);
      fs.writeFileSync(destPath, content);
    }
  }
}

// ── Utility ──

function rmDir(dirPath) {
  if (fs.existsSync(dirPath)) fs.rmSync(dirPath, { recursive: true, force: true });
}

function countFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    count += entry.isDirectory() ? countFiles(path.join(dirPath, entry.name)) : 1;
  }
  return count;
}

// ── UNINSTALL ──

function uninstall(targetDir, runtime) {
  const label = getRuntimeLabel(runtime);
  console.log(`  ${yellow}Uninstalling UP from ${label} at ${targetDir}${reset}\n`);

  if (!fs.existsSync(targetDir)) {
    console.log(`  ${dim}Directory does not exist. Nothing to uninstall.${reset}\n`);
    return;
  }

  let removed = 0;

  // Remove up/ directory
  const upDir = path.join(targetDir, 'up');
  if (fs.existsSync(upDir)) {
    const count = countFiles(upDir);
    rmDir(upDir);
    console.log(`  ${green}✓${reset} Removed up/ (${count} files)`);
    removed += count;
  }

  // Remove UP agents
  const agentsDir = path.join(targetDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    for (const file of fs.readdirSync(agentsDir)) {
      if (file.startsWith('up-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(agentsDir, file));
        removed++;
      }
    }
    if (removed > 0) console.log(`  ${green}✓${reset} Removed UP agents`);
  }

  // Remove UP commands (runtime-specific structure)
  if (runtime === 'opencode') {
    const commandDir = path.join(targetDir, 'command');
    if (fs.existsSync(commandDir)) {
      let cmdCount = 0;
      for (const file of fs.readdirSync(commandDir)) {
        if (file.startsWith('up-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(commandDir, file));
          cmdCount++;
        }
      }
      if (cmdCount > 0) {
        console.log(`  ${green}✓${reset} Removed ${cmdCount} commands from command/`);
        removed += cmdCount;
      }
    }
  } else {
    // Claude & Gemini: nested commands/up/ or commands/up/*.toml
    const commandsDir = path.join(targetDir, 'commands', 'up');
    if (fs.existsSync(commandsDir)) {
      const count = countFiles(commandsDir);
      rmDir(commandsDir);
      console.log(`  ${green}✓${reset} Removed commands/up/ (${count} files)`);
      removed += count;
    }
  }

  // Remove UP hooks
  const hooksDir = path.join(targetDir, 'hooks');
  if (fs.existsSync(hooksDir)) {
    for (const file of fs.readdirSync(hooksDir)) {
      if (file.startsWith('up-') && file.endsWith('.js')) {
        fs.unlinkSync(path.join(hooksDir, file));
        removed++;
      }
    }
    console.log(`  ${green}✓${reset} Removed UP hooks`);
  }

  // Clean settings.json references
  if (runtime === 'claude') {
    const settingsPath = path.join(targetDir, 'settings.json');
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        let changed = false;

        if (settings.statusLine && settings.statusLine.command && settings.statusLine.command.includes('up-statusline')) {
          delete settings.statusLine;
          changed = true;
        }

        if (settings.hooks && settings.hooks.PostToolUse) {
          settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(entry => {
            const hooks = entry.hooks || [];
            return !hooks.some(h => h.command && h.command.includes('up-context-monitor'));
          });
          if (settings.hooks.PostToolUse.length === 0) delete settings.hooks.PostToolUse;
          if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
          changed = true;
        }

        if (changed) {
          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
          console.log(`  ${green}✓${reset} Cleaned settings.json`);
        }
      } catch (e) {}
    }
  }

  if (removed === 0) {
    console.log(`  ${dim}Nothing to remove — UP is not installed here.${reset}`);
  } else {
    console.log(`\n  ${green}Done!${reset} Removed ${removed} files from ${label}.\n`);
  }
}

// ── INSTALL ──

function install(isGlobal, runtime) {
  const targetDir = getTargetDir(runtime, isGlobal);
  const pathPrefix = buildPathPrefix(targetDir, isGlobal, runtime);
  const label = getRuntimeLabel(runtime);
  const locationLabel = isGlobal ? targetDir.replace(os.homedir(), '~') : targetDir.replace(process.cwd(), '.');
  const failures = [];

  console.log(`  Installing for ${cyan}${label}${reset} to ${cyan}${locationLabel}${reset}\n`);

  // 1. Copy up/ (the entire package becomes config/up/)
  const upSrc = packageRoot;
  const upDest = path.join(targetDir, 'up');
  copyDirWithReplace(upSrc, upDest, pathPrefix, runtime);
  const upCount = countFiles(upDest);
  if (upCount > 0) {
    console.log(`  ${green}✓${reset} Installed up/ (${upCount} files)`);
  } else {
    failures.push('up/');
  }

  // 2. Copy commands (runtime-specific structure)
  const cmdsSrc = path.join(packageRoot, 'commands');
  if (fs.existsSync(cmdsSrc)) {
    if (runtime === 'opencode') {
      // OpenCode: flat command/up-*.md
      const commandDir = path.join(targetDir, 'command');
      fs.mkdirSync(commandDir, { recursive: true });
      copyFlattenedCommands(cmdsSrc, commandDir, 'up', pathPrefix, runtime);
      const count = fs.readdirSync(commandDir).filter(f => f.startsWith('up-')).length;
      if (count > 0) {
        console.log(`  ${green}✓${reset} Installed ${count} commands to command/`);
      } else {
        failures.push('commands');
      }
    } else {
      // Claude & Gemini: nested commands/up/
      const cmdsDest = path.join(targetDir, 'commands', 'up');
      copyDirWithReplace(cmdsSrc, cmdsDest, pathPrefix, runtime, true);
      const cmdCount = countFiles(cmdsDest);
      if (cmdCount > 0) {
        console.log(`  ${green}✓${reset} Installed ${cmdCount} commands`);
      } else {
        failures.push('commands');
      }
    }
  }

  // 3. Copy agents (with runtime conversion)
  const agentsSrc = path.join(packageRoot, 'agents');
  if (fs.existsSync(agentsSrc)) {
    const agentsDest = path.join(targetDir, 'agents');
    fs.mkdirSync(agentsDest, { recursive: true });

    // Remove old UP agents
    for (const file of fs.readdirSync(agentsDest)) {
      if (file.startsWith('up-') && file.endsWith('.md')) {
        fs.unlinkSync(path.join(agentsDest, file));
      }
    }

    // Copy UP agents with runtime conversion
    let agentCount = 0;
    for (const file of fs.readdirSync(agentsSrc)) {
      if (file.endsWith('.md')) {
        let content = fs.readFileSync(path.join(agentsSrc, file), 'utf8');
        content = replacePaths(content, pathPrefix, runtime);

        if (runtime === 'gemini') {
          content = convertAgentToGemini(content);
        } else if (runtime === 'opencode') {
          content = convertAgentToOpencode(content);
        }

        fs.writeFileSync(path.join(agentsDest, file), content);
        agentCount++;
      }
    }
    if (agentCount > 0) {
      console.log(`  ${green}✓${reset} Installed ${agentCount} agents`);
    } else {
      failures.push('agents');
    }
  }

  // 4. Install hooks (Claude Code only)
  if (runtime === 'claude') {
    const hooksSrc = path.join(packageRoot, 'hooks');
    if (fs.existsSync(hooksSrc)) {
      const hooksDest = path.join(targetDir, 'hooks');
      fs.mkdirSync(hooksDest, { recursive: true });

      // Remove old UP hooks
      if (fs.existsSync(hooksDest)) {
        for (const file of fs.readdirSync(hooksDest)) {
          if (file.startsWith('up-') && file.endsWith('.js')) {
            fs.unlinkSync(path.join(hooksDest, file));
          }
        }
      }

      // Copy new UP hooks
      let hookCount = 0;
      for (const file of fs.readdirSync(hooksSrc)) {
        if (file.endsWith('.js')) {
          fs.copyFileSync(path.join(hooksSrc, file), path.join(hooksDest, file));
          hookCount++;
        }
      }

      if (hookCount > 0) {
        console.log(`  ${green}✓${reset} Installed ${hookCount} hooks`);
      }

      // Configure statusLine and hooks in settings.json
      const settingsPath = path.join(targetDir, 'settings.json');
      let settings = {};
      if (fs.existsSync(settingsPath)) {
        try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch (e) {}
      }

      const statuslineCmd = `node "${path.join(hooksDest, 'up-statusline.js')}"`;
      const contextMonitorCmd = `node "${path.join(hooksDest, 'up-context-monitor.js')}"`;

      // Set statusLine
      settings.statusLine = { type: 'command', command: statuslineCmd };

      // Set PostToolUse hook for context monitor
      if (!settings.hooks) settings.hooks = {};
      const postToolHooks = settings.hooks.PostToolUse || [];
      // Remove old GSD/UP context monitor entries
      const filtered = postToolHooks.filter(entry => {
        const hooks = entry.hooks || [];
        return !hooks.some(h => h.command && (h.command.includes('gsd-context-monitor') || h.command.includes('up-context-monitor')));
      });
      filtered.push({ hooks: [{ type: 'command', command: contextMonitorCmd }] });
      settings.hooks.PostToolUse = filtered;

      // Remove old GSD SessionStart hook if present
      if (settings.hooks.SessionStart) {
        settings.hooks.SessionStart = settings.hooks.SessionStart.filter(entry => {
          const hooks = entry.hooks || [];
          return !hooks.some(h => h.command && h.command.includes('gsd-'));
        });
        if (settings.hooks.SessionStart.length === 0) delete settings.hooks.SessionStart;
      }

      // Clean old GSD statusLine reference
      if (settings.statusLine && settings.statusLine.command && settings.statusLine.command.includes('gsd-statusline')) {
        settings.statusLine = { type: 'command', command: statuslineCmd };
      }

      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
      console.log(`  ${green}✓${reset} Configured statusLine and context monitor`);
    }
  }

  // 5. Write VERSION file
  const versionDest = path.join(upDest, 'VERSION');
  fs.writeFileSync(versionDest, VERSION);
  console.log(`  ${green}✓${reset} Wrote VERSION (${VERSION})`);

  // 6. Write package.json for CommonJS mode (prevents ESM conflicts)
  if (runtime !== 'opencode') {
    const pkgDest = path.join(targetDir, 'package.json');
    if (!fs.existsSync(pkgDest)) {
      fs.writeFileSync(pkgDest, '{"type":"commonjs"}\n');
      console.log(`  ${green}✓${reset} Wrote package.json (CommonJS mode)`);
    }
  }

  // Summary
  if (failures.length > 0) {
    console.log(`\n  ${red}Failed:${reset} ${failures.join(', ')}`);
    process.exit(1);
  }

  const command = runtime === 'opencode' ? '/up-ajuda' : '/up:ajuda';
  console.log(`\n  ${green}Done!${reset} Run ${cyan}${command}${reset} in ${label} to get started.\n`);
}

// ── INTERACTIVE MODE ──

function promptRuntime(callback) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let answered = false;
  rl.on('close', () => {
    if (!answered) { answered = true; process.exit(0); }
  });

  console.log(`  ${yellow}Which runtime(s)?${reset}\n`);
  console.log(`  ${cyan}1${reset}) Claude Code ${dim}(~/.claude)${reset}`);
  console.log(`  ${cyan}2${reset}) Gemini      ${dim}(~/.gemini)${reset}`);
  console.log(`  ${cyan}3${reset}) OpenCode    ${dim}(~/.config/opencode)${reset}`);
  console.log(`  ${cyan}4${reset}) All\n`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const choice = answer.trim() || '1';
    if (choice === '4') callback(['claude', 'gemini', 'opencode']);
    else if (choice === '3') callback(['opencode']);
    else if (choice === '2') callback(['gemini']);
    else callback(['claude']);
  });
}

function promptLocation(runtimes) {
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal, defaulting to global install${reset}\n`);
    for (const r of runtimes) install(true, r);
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let answered = false;
  rl.on('close', () => {
    if (!answered) { answered = true; process.exit(0); }
  });

  const globalPaths = runtimes.map(r => getGlobalDir(r).replace(os.homedir(), '~')).join(', ');
  const localPaths = runtimes.map(r => `./${getDirName(r)}`).join(', ');

  console.log(`  ${yellow}Where to install?${reset}\n`);
  console.log(`  ${cyan}1${reset}) Global ${dim}(${globalPaths})${reset}`);
  console.log(`  ${cyan}2${reset}) Local  ${dim}(${localPaths})${reset}\n`);

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const isGlobal = answer.trim() !== '2';
    for (const r of runtimes) install(isGlobal, r);
  });
}

// ── MAIN ──

if (hasGlobal && hasLocal) {
  console.error(`  ${yellow}Cannot specify both --global and --local${reset}`);
  process.exit(1);
} else if (hasUninstall) {
  if (!hasGlobal && !hasLocal) {
    console.error(`  ${yellow}--uninstall requires --global or --local${reset}`);
    process.exit(1);
  }
  const runtimes = selectedRuntimes.length > 0 ? selectedRuntimes : ['claude'];
  for (const r of runtimes) uninstall(getTargetDir(r, hasGlobal), r);
} else if (selectedRuntimes.length > 0) {
  if (!hasGlobal && !hasLocal) {
    promptLocation(selectedRuntimes);
  } else {
    for (const r of selectedRuntimes) install(hasGlobal, r);
  }
} else if (hasGlobal || hasLocal) {
  install(hasGlobal, 'claude');
} else {
  // Fully interactive
  if (!process.stdin.isTTY) {
    console.log(`  ${yellow}Non-interactive terminal, defaulting to Claude Code global${reset}\n`);
    install(true, 'claude');
  } else {
    promptRuntime((runtimes) => promptLocation(runtimes));
  }
}
