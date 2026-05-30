#!/usr/bin/env node
// UP Session Start - SessionStart hook
// Injects the `usando-up` skill bootstrap as additionalContext at the start of
// each session (and after /clear or /compact), so the agent always boots with
// the UP discipline loaded -- no explicit command needed.
//
// Mirrors the auto-activation mechanism: the bootstrap teaches the agent to
// check skills by context. The full SKILL.md is read at runtime from the
// installed skills layer; a short embedded fallback is used if it's missing.
//
// Additive and fail-open: any error exits 0 without blocking the session.

const fs = require('fs');
const path = require('path');

// Events that should (re)inject the bootstrap. After clear/compact the context
// is wiped, so we re-prime the agent.
const TRIGGER_SOURCES = ['startup', 'clear', 'compact'];

// Short embedded fallback used only if the installed SKILL.md is unavailable.
const FALLBACK_BOOTSTRAP =
  'Voce tem o UP instalado: um sistema de desenvolvimento orientado a especificacao, ' +
  'em portugues, composto por skills que ativam por contexto.\n\n' +
  'REGRA: se ha mais de 1% de chance de uma skill se aplicar ao que voce vai fazer, ' +
  'voce DEVE invoca-la com a tool Skill ANTES de qualquer resposta ou acao. ' +
  'Isso vale ate para perguntas simples e antes de fazer perguntas de esclarecimento. ' +
  'Skills de processo (brainstorm, depuracao, verificacao) vem antes das de implementacao.\n\n' +
  'Antes de qualquer trabalho criativo (criar feature, componente, comportamento novo), ' +
  'use a skill up-brainstorm. Antes de afirmar que algo esta pronto, corrigido ou passando, ' +
  'use a skill up-verificar-antes-de-concluir: nunca afirme sucesso sem rodar a verificacao ' +
  'e ler a saida nesta mensagem. Para a porta unica do fluxo, use o comando /up.';

function readBootstrap() {
  // Resolve the installed SKILL.md relative to this hook:
  //   <config>/hooks/up-session-start.js  ->  <config>/up/skills/usando-up/SKILL.md
  // In the repo source layout the hook lives at up/hooks/, so the skill is at
  //   up/hooks/../skills/usando-up/SKILL.md  ==  up/skills/usando-up/SKILL.md
  // Both resolve via ../skills/usando-up/SKILL.md from the hook directory.
  const candidates = [
    path.resolve(__dirname, '..', 'skills', 'usando-up', 'SKILL.md'),
    path.resolve(__dirname, '..', 'up', 'skills', 'usando-up', 'SKILL.md'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, 'utf8');
        if (content && content.trim()) return content;
      }
    } catch (e) { /* try next */ }
  }

  return FALLBACK_BOOTSTRAP;
}

function buildContext(bootstrap) {
  return '<EXTREMELY_IMPORTANT>\n' +
    'Voce tem o UP.\n\n' +
    'Abaixo esta o conteudo completo da sua skill \'usando-up\' -- sua introducao a usar ' +
    'as skills do UP. Para todas as outras skills, use a tool Skill:\n\n' +
    bootstrap.trim() + '\n' +
    '</EXTREMELY_IMPORTANT>';
}

function emit(bootstrap) {
  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: buildContext(bootstrap),
    },
  };
  process.stdout.write(JSON.stringify(output));
}

let input = '';
const stdinTimeout = setTimeout(() => {
  // No stdin within 3s (Windows/Git Bash guard): still inject the bootstrap.
  try { emit(readBootstrap()); } catch (e) {}
  process.exit(0);
}, 3000);

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    let source = null;
    try {
      const data = JSON.parse(input);
      // SessionStart payload carries the trigger in `source` (startup|clear|compact|resume).
      source = data && (data.source || data.hook_event_source || null);
    } catch (e) {
      // No/invalid payload: with no matcher available, inject anyway.
      source = null;
    }

    // If a source is present and it is NOT one of our triggers, skip silently.
    if (source && !TRIGGER_SOURCES.includes(source)) {
      process.exit(0);
    }

    emit(readBootstrap());
  } catch (e) {
    // Fail-open: never block the session.
  }
  process.exit(0);
});
