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

// Teto do trecho de STATE.md injetado. As secoes uteis (Posicao Atual,
// Contexto Acumulado, Continuidade de Sessao) vivem no topo do arquivo, entao
// um head capado retoma a posicao sem estourar o contexto.
const MAX_STATE_CHARS = 2800;

/**
 * Le um resumo do estado do projeto em <cwd>/.plano/STATE.md, se existir.
 * Retorna o trecho capado (string) ou null. PUSH deterministico da posicao:
 * o agente sempre volta sabendo onde parou, sem depender de escolher ler.
 * Independe do formato exato (PT/EN) -- e um head bruto, nunca quebra.
 */
function readState(cwd) {
  if (!cwd || typeof cwd !== 'string') return null;
  try {
    const statePath = path.join(cwd, '.plano', 'STATE.md');
    if (!fs.existsSync(statePath)) return null;
    let content = fs.readFileSync(statePath, 'utf8');
    if (!content || !content.trim()) return null;
    content = content.trim();
    if (content.length > MAX_STATE_CHARS) {
      content = content.slice(0, MAX_STATE_CHARS).trimEnd() +
        '\n\n[...truncado -- leia .plano/STATE.md para o resto]';
    }
    return content;
  } catch (e) {
    return null;
  }
}

function buildContext(bootstrap, state) {
  let ctx = '<EXTREMELY_IMPORTANT>\n' +
    'Voce tem o UP.\n\n' +
    'Abaixo esta o conteudo completo da sua skill \'usando-up\' -- sua introducao a usar ' +
    'as skills do UP. Para todas as outras skills, use a tool Skill:\n\n' +
    bootstrap.trim() + '\n' +
    '</EXTREMELY_IMPORTANT>';

  if (state) {
    ctx += '\n\n<UP-ESTADO-ATUAL>\n' +
      'Voce esta retomando um projeto UP em andamento (inicio de sessao ou apos /clear). ' +
      'NAO comece do zero nem assuma contexto perdido: esta e a posicao atual, lida de ' +
      '.plano/STATE.md. Continue daqui. Para rotear o proximo passo, use /up sem argumento.\n\n' +
      state + '\n' +
      '</UP-ESTADO-ATUAL>';
  }
  return ctx;
}

function emit(bootstrap, state) {
  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: buildContext(bootstrap, state || null),
    },
  };
  process.stdout.write(JSON.stringify(output));
}

let input = '';
const stdinTimeout = setTimeout(() => {
  // No stdin within 3s (Windows/Git Bash guard): inject the bootstrap.
  // Sem payload nao ha cwd, entao sem bloco de estado (so a doutrina).
  try { emit(readBootstrap(), null); } catch (e) {}
  process.exit(0);
}, 3000);

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    let source = null;
    let cwd = null;
    try {
      const data = JSON.parse(input);
      // SessionStart payload carries the trigger in `source` (startup|clear|compact|resume)
      // e o diretorio do projeto em `cwd`.
      source = data && (data.source || data.hook_event_source || null);
      cwd = (data && data.cwd) || null;
    } catch (e) {
      // No/invalid payload: with no matcher available, inject anyway.
      source = null;
    }

    // If a source is present and it is NOT one of our triggers, skip silently.
    if (source && !TRIGGER_SOURCES.includes(source)) {
      process.exit(0);
    }

    // Sem cwd no payload, cai pro diretorio do processo (o harness roda o hook no cwd da sessao).
    const projectCwd = cwd || process.cwd();
    emit(readBootstrap(), readState(projectCwd));
  } catch (e) {
    // Fail-open: never block the session.
  }
  process.exit(0);
});
