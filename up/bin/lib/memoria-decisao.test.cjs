/**
 * memoria-decisao.test.cjs: testes red-green do registro de decisao deterministico.
 * Roda: node up/bin/lib/memoria-decisao.test.cjs
 * Sem framework. Cada caso monta um projeto temporario proprio (diretorio temp do
 * sistema, com .plano/) e o deixa no disco (o SO limpa o /tmp; nao ha estado
 * compartilhado entre casos). Casos de roteamento e de linha de comando invocam o
 * binario real (up-tools.cjs) via child_process, porque testam codigo de saida do
 * processo: chamar essas falhas em processo, via require direto, mataria o proprio
 * runner de teste (error() do core.cjs chama process.exit).
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const decisao = require('./memoria-decisao.cjs');

const UP_TOOLS = path.join(__dirname, '..', 'up-tools.cjs');

function mkProjeto() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-mem-decisao-'));
  fs.mkdirSync(path.join(dir, '.plano'), { recursive: true });
  return dir;
}

function dirDecisoes(dir) {
  return path.join(dir, '.plano', 'decisoes');
}

function criarArquivosFake(dir, numeros) {
  const alvo = dirDecisoes(dir);
  fs.mkdirSync(alvo, { recursive: true });
  for (const n of numeros) {
    fs.writeFileSync(path.join(alvo, `${String(n).padStart(4, '0')}-fake.md`), '---\nnumero: "x"\n---\n# x\n');
  }
}

function flagsValidas(overrides) {
  return Object.assign({
    titulo: 'Onda passa a ser visao derivada',
    contexto: 'A onda hoje e um numero solto sem explicacao nenhuma no historico do projeto',
    decisao: 'A onda passa a ser calculada a partir do plano em vez de armazenada em campo solto',
    motivo: 'Evita numero de onda desalinhado do que os planos realmente declaram nos arquivos',
    'dificil-reverter': 'reverter exige migrar todo historico existente de fases ja rodadas',
    surpreendente: 'ninguem esperaria que a onda fosse derivada e nao um campo solto qualquer',
    'trade-off': 'ganha consistencia mas perde a liberdade de forcar uma onda manual as vezes',
    alternativa: ['Campo manual :: mais simples mas propenso a erro humano'],
    status: null,
    fase: null,
    slug: null,
  }, overrides || {});
}

function corpoSemFrontmatter(conteudo) {
  const m = conteudo.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return m ? m[1] : conteudo;
}

function runCli(argsArr, cwd) {
  return spawnSync(process.execPath, [UP_TOOLS, ...argsArr, '--cwd', cwd], { encoding: 'utf-8' });
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  -', name); pass++; }
  catch (e) { console.error('  FAIL -', name, '\n     ', e.message); fail++; }
}

// =====================================================================
// Numeracao (tarefa 2)
// =====================================================================

t('proximo-numero: diretorio ausente devolve 1 e nao cria nada', () => {
  const dir = mkProjeto();
  const r = decisao.run(dir, ['proximo-numero']);
  assert.strictEqual(r.result.proximo, '0001');
  assert.strictEqual(r.result.diretorio_existe, false);
  assert.ok(!fs.existsSync(dirDecisoes(dir)), 'diretorio de decisoes nao deveria existir');
});

t('proximo-numero: sequencia 1, 2 e 7 devolve 8 (buraco nao preenchido)', () => {
  const dir = mkProjeto();
  criarArquivosFake(dir, [1, 2, 7]);
  const r = decisao.run(dir, ['proximo-numero']);
  assert.strictEqual(r.result.proximo, '0008');
  assert.deepStrictEqual(r.result.existentes, [1, 2, 7]);
});

t('dois registros criados em sequencia recebem numeros distintos e crescentes', () => {
  const dir = mkProjeto();
  const r1 = decisao.criar(dir, flagsValidas());
  const r2 = decisao.criar(dir, flagsValidas({ titulo: 'Segunda decisao de teste' }));
  assert.strictEqual(r1.numero, '0001');
  assert.strictEqual(r2.numero, '0002');
});

t('listar: diretorio ausente devolve lista vazia', () => {
  const dir = mkProjeto();
  const r = decisao.run(dir, ['listar']);
  assert.deepStrictEqual(r.result.registros, []);
  assert.strictEqual(r.result.diretorio_existe, false);
});

// =====================================================================
// Gate das tres condicoes (tarefa 3)
// =====================================================================

t('gate: falta dificil-reverter falha e nao cria diretorio', () => {
  const dir = mkProjeto();
  assert.throws(() => decisao.criar(dir, flagsValidas({ 'dificil-reverter': null })), /dificil de reverter/);
  assert.ok(!fs.existsSync(dirDecisoes(dir)));
});

t('gate: falta surpreendente falha e nao cria diretorio', () => {
  const dir = mkProjeto();
  assert.throws(() => decisao.criar(dir, flagsValidas({ surpreendente: null })), /surpreendente sem contexto/);
  assert.ok(!fs.existsSync(dirDecisoes(dir)));
});

t('gate: falta trade-off falha e nao cria diretorio', () => {
  const dir = mkProjeto();
  assert.throws(() => decisao.criar(dir, flagsValidas({ 'trade-off': null })), /trade-off real/);
  assert.ok(!fs.existsSync(dirDecisoes(dir)));
});

t('gate: justificativa com menos de tres palavras falha', () => {
  const dir = mkProjeto();
  assert.throws(() => decisao.criar(dir, flagsValidas({ surpreendente: 'muito pouco' })), /surpreendente sem contexto/);
});

t('gate: mensagem nomeia as duas condicoes quando faltam duas de uma vez', () => {
  const dir = mkProjeto();
  try {
    decisao.criar(dir, flagsValidas({ 'dificil-reverter': null, 'trade-off': null }));
    assert.fail('deveria ter lancado excecao');
  } catch (e) {
    assert.ok(e.message.includes('dificil de reverter'), 'deveria citar dificil de reverter');
    assert.ok(e.message.includes('trade-off real'), 'deveria citar trade-off real');
  }
});

t('alternativas: sem nenhuma alternativa falha', () => {
  const dir = mkProjeto();
  assert.throws(() => decisao.criar(dir, flagsValidas({ alternativa: [] })), /alternativa/i);
  assert.ok(!fs.existsSync(dirDecisoes(dir)));
});

t('alternativas: ocorrencia fora do formato falha citando a ocorrencia', () => {
  const dir = mkProjeto();
  assert.throws(() => decisao.criar(dir, flagsValidas({ alternativa: ['sem separador nenhum'] })), /formato invalido.*sem separador nenhum/);
});

t('status invalido na criacao (substituida) falha', () => {
  const dir = mkProjeto();
  assert.throws(() => decisao.criar(dir, flagsValidas({ status: 'substituida' })), /substituida/);
});

t('criar: chamada completa cria arquivo com as cinco secoes e uma linha por alternativa', () => {
  const dir = mkProjeto();
  const r = decisao.criar(dir, flagsValidas({
    alternativa: [
      'Campo manual :: mais simples mas propenso a erro humano',
      'Contador persistido :: divergia do que os planos realmente declaravam',
    ],
  }));
  assert.strictEqual(r.criado, true);
  assert.strictEqual(r.numero, '0001');
  assert.strictEqual(r.alternativas_count, 2);

  const caminho = path.join(dir, r.caminho);
  assert.ok(fs.existsSync(caminho), 'arquivo deveria existir');
  const conteudo = fs.readFileSync(caminho, 'utf-8');

  for (const secao of ['## Contexto', '## Decisão', '## Motivo', '## Condições do gate', '## Alternativas rejeitadas']) {
    assert.ok(conteudo.includes(secao), `deveria conter a secao ${secao}`);
  }
  assert.ok(conteudo.includes('- Campo manual: mais simples mas propenso a erro humano'));
  assert.ok(conteudo.includes('- Contador persistido: divergia do que os planos realmente declaravam'));

  assert.match(conteudo, /numero: "0001"/);
  assert.match(conteudo, /^slug: /m);
  assert.match(conteudo, /^status: aceita$/m);
  assert.match(conteudo, /^substituida_por: null$/m);
  assert.match(conteudo, /^data: \d{4}-\d{2}-\d{2}$/m);
});

t('criar: campo de fase so aparece no frontmatter quando a flag foi passada', () => {
  const dir = mkProjeto();
  const semFase = decisao.criar(dir, flagsValidas());
  const conteudoSemFase = fs.readFileSync(path.join(dir, semFase.caminho), 'utf-8');
  assert.ok(!/^fase:/m.test(conteudoSemFase), 'nao deveria ter campo fase');

  const comFase = decisao.criar(dir, flagsValidas({ titulo: 'Outra decisao com fase', fase: '14' }));
  const conteudoComFase = fs.readFileSync(path.join(dir, comFase.caminho), 'utf-8');
  assert.match(conteudoComFase, /^fase: 14$/m);
});

// =====================================================================
// Status (tarefa 4)
// =====================================================================

t('status: muda para proposta e depois para aceita', () => {
  const dir = mkProjeto();
  decisao.criar(dir, flagsValidas());
  const p = decisao.mudarStatus(dir, { numero: '1', status: 'proposta' });
  assert.strictEqual(p.status_anterior, 'aceita');
  assert.strictEqual(p.status_novo, 'proposta');
  const a = decisao.mudarStatus(dir, { numero: '1', status: 'aceita' });
  assert.strictEqual(a.status_anterior, 'proposta');
  assert.strictEqual(a.status_novo, 'aceita');
});

t('status: substituida sem substituidor falha', () => {
  const dir = mkProjeto();
  decisao.criar(dir, flagsValidas());
  assert.throws(() => decisao.mudarStatus(dir, { numero: '1', status: 'substituida' }), /substituida-por/);
});

t('status: substituidor inexistente falha', () => {
  const dir = mkProjeto();
  decisao.criar(dir, flagsValidas());
  assert.throws(() => decisao.mudarStatus(dir, { numero: '1', status: 'substituida', substituidaPor: '9' }), /nao encontrado/);
});

t('status: substituidor valido grava status e substituida_por, preservando o corpo', () => {
  const dir = mkProjeto();
  const r1 = decisao.criar(dir, flagsValidas());
  decisao.criar(dir, flagsValidas({ titulo: 'Segunda decisao de teste' }));

  const registro = decisao.encontrarRegistro(dir, '0001');
  const conteudoAntes = fs.readFileSync(registro.caminho, 'utf-8');
  const corpoAntes = corpoSemFrontmatter(conteudoAntes);

  const r = decisao.mudarStatus(dir, { numero: '1', status: 'substituida', substituidaPor: '2' });
  assert.strictEqual(r.status_novo, 'substituida');
  assert.strictEqual(r.substituida_por, '0002');

  const conteudoDepois = fs.readFileSync(registro.caminho, 'utf-8');
  const corpoDepois = corpoSemFrontmatter(conteudoDepois);
  assert.strictEqual(corpoAntes, corpoDepois, 'corpo deveria ficar identico');
  assert.match(conteudoDepois, /^status: substituida$/m);
  assert.match(conteudoDepois, /^substituida_por: 0002$/m);
});

t('status: registro inexistente falha citando o numero procurado', () => {
  const dir = mkProjeto();
  assert.throws(() => decisao.mudarStatus(dir, { numero: '42', status: 'aceita' }), /0042/);
});

// =====================================================================
// Roteamento do espaco memoria (tarefa 1), via binario real
// =====================================================================

t('roteamento: submodulo desconhecido falha com codigo de saida 1', () => {
  const dir = mkProjeto();
  const r = runCli(['memoria', 'desconhecido', 'proximo-numero'], dir);
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr, /decisao, fora-de-escopo, glossario, termo/);
});

t('roteamento: submodulo declarado mas ainda nao instalado falha com mensagem legivel', () => {
  const dir = mkProjeto();
  const r = runCli(['memoria', 'glossario', 'listar'], dir);
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr, /nao esta instalado/);
  assert.ok(!/\.js:\d+/.test(r.stderr), 'nao deveria trazer rastro de pilha');
});

t('roteamento: memoria sem submodulo falha listando os quatro nomes', () => {
  const dir = mkProjeto();
  const r = runCli(['memoria'], dir);
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr, /decisao/);
  assert.match(r.stderr, /fora-de-escopo/);
  assert.match(r.stderr, /glossario/);
  assert.match(r.stderr, /termo/);
});

// =====================================================================
// Linha de comando real (tarefa 6)
// =====================================================================

t('linha de comando: proximo-numero aprovado sai com codigo 0', () => {
  const dir = mkProjeto();
  const r = runCli(['memoria', 'decisao', 'proximo-numero'], dir);
  assert.strictEqual(r.status, 0);
  const parsed = JSON.parse(r.stdout);
  assert.strictEqual(parsed.proximo, '0001');
});

t('linha de comando: criar reprovado (sem gate) sai com codigo 1', () => {
  const dir = mkProjeto();
  const r = runCli(['memoria', 'decisao', 'criar', '--titulo', 'X', '--contexto', 'algum contexto minimo aqui', '--decisao', 'a decisao tomada aqui', '--motivo', 'o motivo dela aqui'], dir);
  assert.strictEqual(r.status, 1);
  assert.ok(!fs.existsSync(dirDecisoes(dir)), 'nao deveria ter criado o diretorio');
});

t('linha de comando: criar aprovado sai com codigo 0 e grava o arquivo', () => {
  const dir = mkProjeto();
  const r = runCli([
    'memoria', 'decisao', 'criar',
    '--titulo', 'Decisao via linha de comando',
    '--contexto', 'contexto minimo com mais de tres palavras aqui',
    '--decisao', 'decisao tomada com mais de tres palavras aqui',
    '--motivo', 'motivo real com mais de tres palavras aqui',
    '--dificil-reverter', 'dificil reverter isso depois',
    '--surpreendente', 'ninguem esperaria essa escolha',
    '--trade-off', 'ganha um lado perde outro',
    '--alternativa', 'Outra opcao :: motivo de ter sido rejeitada',
  ], dir);
  assert.strictEqual(r.status, 0);
  const parsed = JSON.parse(r.stdout);
  assert.strictEqual(parsed.numero, '0001');
  assert.ok(fs.existsSync(path.join(dir, parsed.caminho)));
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
