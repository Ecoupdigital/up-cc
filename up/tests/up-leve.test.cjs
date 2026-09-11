/**
 * up-leve.test.cjs: invariante do corte v3 (UP leve).
 *
 * Roda: node up/tests/up-leve.test.cjs
 * Sem framework, sem rede. Resolve a raiz do repositorio a partir de __dirname.
 *
 * Contrato: falha quando qualquer superficie viva do UP volta a citar o log de
 * aprovacoes, o gate deterministico, o campo evidence=, fronteiras de teste
 * (seams), a heuristica de tautologia ou as duas skills fundidas em up-prova;
 * quando a camada de skills deixa de ter exatamente tres skills; quando o
 * caminho quente perde a secao Prova do SUMMARY; quando a CLI volta a expor
 * o subcomando gate; ou quando os arquivos que nasceram limpos nesta fase
 * ganham travessao.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');

const SUPERFICIES = ['up/skills', 'up/workflows', 'up/agents', 'up/commands', 'up/templates', 'up/hooks', 'up/references'];
const ARQUIVOS_EXTRA = ['up/bin/install.js', 'up/bin/up-tools.cjs'];
const NASCERAM_LIMPOS = [
  'up/workflows/build.md',
  'up/agents/up-executor.md',
  'up/skills/up-prova/SKILL.md',
  'up/tests/up-leve.test.cjs',
];

const REGEX_PROIBIDO = /approvals\.log|evidence=|seams:|tautolog|gate verdict|gate plan-ready|up-tdd|up-verificar-antes-de-concluir|tdd-evidence-types|governance\.md|governance-rules|rework-limits/;
const REGEX_TRAVESSAO = /[\u2014\u2013]/;

let pass = 0;
let fail = 0;

function t(name, fn) {
  try {
    fn();
    console.log('  ok  -', name);
    pass++;
  } catch (e) {
    console.error('  FAIL -', name, '\n     ', e.message);
    fail++;
  }
}

function ler(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.(md|js|cjs|json)$/.test(ent.name)) out.push(full);
  }
  return out;
}

t('nenhuma superficie viva cita gate, approvals.log, evidence=, seams ou tautologia', () => {
  const arquivos = [];
  for (const rel of SUPERFICIES) walk(path.join(ROOT, rel), arquivos);
  for (const rel of ARQUIVOS_EXTRA) arquivos.push(path.join(ROOT, rel));
  const achados = [];
  for (const full of arquivos) {
    let conteudo = fs.readFileSync(full, 'utf8');
    // O instalador conhece os nomes legados so para apagar as pastas orfas.
    if (full.endsWith('install.js')) {
      conteudo = conteudo.split('\n').filter((l) => !l.includes('UP_LEGACY_SKILLS')).join('\n');
    }
    const m = conteudo.match(REGEX_PROIBIDO);
    if (m) achados.push(`${path.relative(ROOT, full)}: "${m[0]}"`);
  }
  assert.strictEqual(achados.length, 0, 'referencias proibidas:\n       ' + achados.join('\n       '));
});

t('camada de skills tem exatamente tres skills', () => {
  const dirs = fs
    .readdirSync(path.join(ROOT, 'up/skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  assert.deepStrictEqual(dirs, ['up-brainstorm', 'up-prova', 'usando-up']);
  const lista = ler('up/bin/install.js');
  assert.ok(/'up-prova'/.test(lista), 'install.js nao lista up-prova');
});

t('up-prova define a prova por tipo e onde ela fica', () => {
  const skill = ler('up/skills/up-prova/SKILL.md');
  for (const termo of ['Teste automatizado', 'Captura de tela', 'Smoke-test', '## Prova']) {
    assert.ok(skill.includes(termo), `up-prova nao contem "${termo}"`);
  }
});

t('caminho quente exige a secao Prova do SUMMARY', () => {
  const build = ler('up/workflows/build.md');
  assert.ok(build.includes('## Prova'), 'build.md nao confere a secao Prova');
  const executor = ler('up/agents/up-executor.md');
  assert.ok(executor.includes('## Prova'), 'executor nao escreve a secao Prova');
  const tpl = ler('up/templates/summary.md');
  assert.ok(tpl.includes('## Prova'), 'template de summary nao tem a secao Prova');
});

t('build default nao spawna verificador nem revisor fora de --review', () => {
  const build = ler('up/workflows/build.md');
  const antesDoOptIn = build.slice(0, build.indexOf('### 3.7 Opt-ins'));
  assert.ok(antesDoOptIn.length > 0, 'build.md perdeu a secao de opt-ins');
  assert.ok(!/subagent_type="up-verificador"/.test(antesDoOptIn), 'verificador voltou ao caminho quente');
  assert.ok(!/subagent_type="up-revisor"/.test(antesDoOptIn), 'revisor voltou ao caminho quente');
  assert.ok(!/VERIFICATION\.md/.test(antesDoOptIn), 'VERIFICATION.md voltou a ser obrigatorio');
});

t('CLI nao expoe mais o subcomando gate', () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'up/bin/up-tools.cjs'), 'gate', 'verdict', '--phase', '1'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.notStrictEqual(r.status, 0, 'gate verdict ainda responde com sucesso');
  assert.ok(/Unknown command/.test(r.stderr + r.stdout), 'gate nao foi removido do dispatch');
});

t('glossario nao define gate e redefine evidencia como prova no SUMMARY', () => {
  const g = ler('up/references/glossario-up.md');
  assert.ok(!/^### gate$/m.test(g), 'glossario ainda define gate');
  assert.ok(/### evidência/.test(g) && /SUMMARY|resumo do plano/i.test(g), 'evidencia nao aponta para o SUMMARY');
});

t('sem travessao nos arquivos que nasceram limpos nesta fase', () => {
  for (const rel of NASCERAM_LIMPOS) {
    assert.ok(!REGEX_TRAVESSAO.test(ler(rel)), `"${rel}" contem travessao ou meia-risca`);
  }
});

console.log('');
console.log(fail === 0 ? `PASS ${pass}/${pass}` : `FAIL ${fail}  pass ${pass}`);
process.exit(fail === 0 ? 0 : 1);
