/**
 * up-session-start.test.cjs - testa a injecao de estado no SessionStart.
 * Roda: node up/hooks/up-session-start.test.cjs
 * Invoca o hook como subprocesso (stdin JSON -> stdout JSON), igual o harness faz.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HOOK = path.resolve(__dirname, 'up-session-start.js');

/** Roda o hook com um payload e devolve {additionalContext} ou null. */
function runHook(payload) {
  const out = execFileSync('node', [HOOK], {
    input: JSON.stringify(payload),
    encoding: 'utf-8',
    timeout: 8000,
  });
  if (!out || !out.trim()) return null;
  const parsed = JSON.parse(out);
  return parsed.hookSpecificOutput ? parsed.hookSpecificOutput.additionalContext : null;
}

function mkProjectWithState(stateBody) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-ss-'));
  fs.mkdirSync(path.join(dir, '.plano'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.plano', 'STATE.md'), stateBody, 'utf-8');
  return dir;
}
function mkProjectNoPlano() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'up-ss-noplano-'));
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  -', name); pass++; }
  catch (e) { console.error('  FAIL -', name, '\n     ', e.message); fail++; }
}

const SAMPLE_STATE = `# Estado do Projeto

## Posicao Atual

Fase: 7 de 10 (Comando /up:melhorias)
Status: In progress
Ultima atividade: 2026-06-19 -- T3 do plano 02 concluido

## Continuidade de Sessao

Parou em: implementando o gate de aprovacao visual
`;

// 1. clear + .plano/STATE.md presente -> injeta bootstrap E o estado
t('clear com .plano: injeta bootstrap + estado', () => {
  const dir = mkProjectWithState(SAMPLE_STATE);
  const ctx = runHook({ source: 'clear', cwd: dir, hook_event_name: 'SessionStart' });
  assert.ok(ctx, 'deve haver additionalContext');
  assert.ok(/Voce tem o UP/.test(ctx), 'deve conter a doutrina (bootstrap)');
  assert.ok(/Fase: 7 de 10/.test(ctx), 'deve conter a posicao do STATE.md');
  assert.ok(/Parou em: implementando o gate/.test(ctx), 'deve conter onde parou');
});

// 2. clear SEM .plano -> so bootstrap, sem bloco de estado
t('clear sem .plano: so bootstrap', () => {
  const dir = mkProjectNoPlano();
  const ctx = runHook({ source: 'clear', cwd: dir, hook_event_name: 'SessionStart' });
  assert.ok(ctx, 'deve haver additionalContext');
  assert.ok(/Voce tem o UP/.test(ctx), 'deve conter a doutrina');
  assert.ok(!/UP-ESTADO-ATUAL/.test(ctx), 'NAO deve ter bloco de estado sem .plano');
});

// 3. startup tambem injeta estado (retomar projeto ao abrir)
t('startup com .plano: injeta estado', () => {
  const dir = mkProjectWithState(SAMPLE_STATE);
  const ctx = runHook({ source: 'startup', cwd: dir, hook_event_name: 'SessionStart' });
  assert.ok(/Fase: 7 de 10/.test(ctx), 'startup tambem deve trazer o estado');
});

// 4. source fora dos triggers (resume) -> nada
t('resume: nenhum output', () => {
  const dir = mkProjectWithState(SAMPLE_STATE);
  const ctx = runHook({ source: 'resume', cwd: dir, hook_event_name: 'SessionStart' });
  assert.strictEqual(ctx, null, 'resume nao deve injetar nada');
});

// 5. STATE.md gigante -> capado (bloco de estado nao explode o contexto)
t('STATE.md gigante: capado', () => {
  const huge = SAMPLE_STATE + '\n' + 'x'.repeat(20000);
  const dir = mkProjectWithState(huge);
  const ctx = runHook({ source: 'clear', cwd: dir, hook_event_name: 'SessionStart' });
  // o bloco de estado deve estar truncado bem abaixo do tamanho do STATE gigante
  assert.ok(ctx.length < 8000, 'contexto total deve ficar capado (<8000 chars), veio ' + ctx.length);
  assert.ok(/Fase: 7 de 10/.test(ctx), 'mesmo capado, a posicao do topo deve aparecer');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
