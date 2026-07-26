/**
 * memoria-termo.test.cjs: testes red-green do glossario do projeto do dono.
 * Roda: node up/bin/lib/memoria-termo.test.cjs
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
const { spawnSync, spawn } = require('child_process');
const termo = require('./memoria-termo.cjs');

const UP_TOOLS = path.join(__dirname, '..', 'up-tools.cjs');
const CAMINHO_TEMPLATE = path.join(__dirname, '..', '..', 'templates', 'glossary.md');

function mkProjeto() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-mem-termo-'));
  fs.mkdirSync(path.join(dir, '.plano'), { recursive: true });
  return dir;
}

function arquivoGlossario(dir) {
  return path.join(dir, '.plano', 'GLOSSARY.md');
}

function runCli(argsArr, cwd) {
  return spawnSync(process.execPath, [UP_TOOLS, ...argsArr, '--cwd', cwd], { encoding: 'utf-8' });
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  -', name); pass++; }
  catch (e) { console.error('  FAIL -', name, '\n     ', e.message); fail++; }
}

/** Versao assincrona de t(), so para o teste de corrida entre processos (RV-003). */
async function tAsync(name, fn) {
  try { await fn(); console.log('  ok  -', name); pass++; }
  catch (e) { console.error('  FAIL -', name, '\n     ', e.message); fail++; }
}

/** Dispara o binario real sem esperar (spawn, nunca spawnSync): concorrencia real entre
 * processos do SO so acontece assim. */
function spawnCliAsync(argsArr, cwd) {
  return new Promise((resolve) => {
    const filho = spawn(process.execPath, [UP_TOOLS, ...argsArr, '--cwd', cwd]);
    let stdout = '';
    let stderr = '';
    filho.stdout.on('data', (d) => { stdout += d; });
    filho.stderr.on('data', (d) => { stderr += d; });
    filho.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

// =====================================================================
// Criacao preguicosa (tarefas 2 e 3)
// =====================================================================

t('listar: arquivo ausente devolve lista vazia e nao cria nada', () => {
  const dir = mkProjeto();
  const r = termo.listar(dir);
  assert.deepStrictEqual(r.termos, []);
  assert.strictEqual(r.arquivo_existe, false);
  assert.ok(!fs.existsSync(arquivoGlossario(dir)), 'arquivo nao deveria existir');
});

t('regras: arquivo ausente devolve o texto do template, sem criar nada', () => {
  const dir = mkProjeto();
  const r = termo.regras(dir);
  assert.strictEqual(r.fonte, 'template');
  assert.ok(r.admissao.startsWith('Regra de admiss'), 'deveria trazer a regra de admissao');
  assert.ok(r.higiene.startsWith('Regra de higiene'), 'deveria trazer a regra de higiene');
  assert.ok(!fs.existsSync(arquivoGlossario(dir)), 'arquivo nao deveria existir');
});

t('registrar: primeira gravacao cria o arquivo com o cabecalho completo', () => {
  const dir = mkProjeto();
  assert.ok(!fs.existsSync(arquivoGlossario(dir)), 'arquivo nao deveria existir antes');
  const r = termo.registrar(dir, {
    termo: 'ondulacao de cardapio',
    definicao: 'variacao sazonal do cardapio do restaurante conforme o clima.',
  });
  assert.strictEqual(r.criado_agora, true);
  assert.strictEqual(r.total_termos, 1);
  assert.ok(fs.existsSync(arquivoGlossario(dir)), 'arquivo deveria existir agora');

  const conteudo = fs.readFileSync(arquivoGlossario(dir), 'utf-8');
  assert.ok(conteudo.includes('Regra de admiss'), 'cabecalho deveria conter a regra de admissao');
  assert.ok(conteudo.includes('Regra de higiene'), 'cabecalho deveria conter a regra de higiene');
});

t('nenhuma gravacao recusada cria o arquivo (higiene, admissao e duplicidade)', () => {
  const dir = mkProjeto();
  assert.throws(() => termo.registrar(dir, { termo: 'x', definicao: 'ver up/bin/lib/memoria.cjs para detalhe' }));
  assert.throws(() => termo.registrar(dir, { termo: 'api', definicao: 'definicao qualquer' }));
  assert.ok(!fs.existsSync(arquivoGlossario(dir)), 'nenhuma recusa deveria ter criado o arquivo');
});

// =====================================================================
// Guarda de higiene (tarefa 2)
// =====================================================================

t('higiene: definicao com caminho de arquivo falha', () => {
  const dir = mkProjeto();
  assert.throws(
    () => termo.registrar(dir, { termo: 'zebra fiscal', definicao: 'implementado em up/bin/lib/memoria-termo.cjs' }),
    /caminho de arquivo/
  );
  assert.ok(!fs.existsSync(arquivoGlossario(dir)));
});

t('higiene: definicao com bloco de codigo falha', () => {
  const dir = mkProjeto();
  assert.throws(
    () => termo.registrar(dir, { termo: 'zebra fiscal', definicao: 'funciona assim: ```const x = 1;```' }),
    /bloco de codigo/
  );
  assert.ok(!fs.existsSync(arquivoGlossario(dir)));
});

t('higiene: definicao limpa passa', () => {
  const dir = mkProjeto();
  const r = termo.registrar(dir, {
    termo: 'zebra fiscal',
    definicao: 'nome interno do modulo de conferencia fiscal deste projeto.',
  });
  assert.strictEqual(r.criado_agora, true);
});

// =====================================================================
// Guarda de admissao (tarefa 2)
// =====================================================================

t('admissao: termo da lista fechada falha sem --forcar', () => {
  const dir = mkProjeto();
  assert.throws(
    () => termo.registrar(dir, { termo: 'webhook', definicao: 'definicao qualquer de exemplo aqui' }),
    /lista fechada de conceitos gerais/
  );
  assert.ok(!fs.existsSync(arquivoGlossario(dir)));
});

t('admissao: termo da lista fechada com --forcar sem --justificativa falha', () => {
  const dir = mkProjeto();
  assert.throws(
    () => termo.registrar(dir, { termo: 'webhook', definicao: 'definicao qualquer de exemplo aqui', forcar: true }),
    /justificativa/
  );
});

t('admissao: termo da lista fechada com --forcar e --justificativa passa e grava a justificativa', () => {
  const dir = mkProjeto();
  const r = termo.registrar(dir, {
    termo: 'webhook',
    definicao: 'termo de dominio especifico deste projeto de integracao.',
    forcar: true,
    justificativa: 'neste projeto webhook e o nome do proprio produto vendido',
  });
  assert.strictEqual(r.criado_agora, true);
  assert.strictEqual(r.justificativa_forcada, 'neste projeto webhook e o nome do proprio produto vendido');
  const conteudo = fs.readFileSync(arquivoGlossario(dir), 'utf-8');
  assert.ok(conteudo.includes('neste projeto webhook e o nome do proprio produto vendido'));
});

// =====================================================================
// Conteudo do verbete (tarefa 4)
// =====================================================================

t('conteudo: verbete tem a linha de definicao', () => {
  const dir = mkProjeto();
  termo.registrar(dir, { termo: 'zebra fiscal', definicao: 'nome interno do modulo de conferencia fiscal.' });
  const conteudo = fs.readFileSync(arquivoGlossario(dir), 'utf-8');
  assert.ok(conteudo.includes('**Definição:** nome interno do modulo de conferencia fiscal.'));
});

t('conteudo: linha de evitar so aparece quando a flag foi passada', () => {
  const dir = mkProjeto();
  termo.registrar(dir, { termo: 'zebra fiscal', definicao: 'nome interno do modulo de conferencia fiscal.' });
  const semEvitar = fs.readFileSync(arquivoGlossario(dir), 'utf-8');
  assert.ok(!semEvitar.includes('**Evitar:**'));

  termo.registrar(dir, {
    termo: 'ativacao de cardapio',
    definicao: 'primeiro dia em que um prato entra ativo no sistema de pedidos.',
    evitar: 'lancamento, go-live',
  });
  const comEvitar = fs.readFileSync(arquivoGlossario(dir), 'utf-8');
  assert.ok(comEvitar.includes('**Evitar:** lancamento, go-live'));
});

// =====================================================================
// Ordem alfabetica e atualizacao (tarefa 2)
// =====================================================================

t('ordem: tres termos gravados fora de ordem ficam em ordem alfabetica', () => {
  const dir = mkProjeto();
  termo.registrar(dir, { termo: 'zebra fiscal', definicao: 'nome interno do modulo de conferencia fiscal.' });
  termo.registrar(dir, { termo: 'ativacao de cardapio', definicao: 'primeiro dia em que um prato entra ativo.' });
  termo.registrar(dir, { termo: 'ondulacao de estoque', definicao: 'variacao periodica do estoque de bebidas.' });

  const r = termo.listar(dir);
  assert.deepStrictEqual(r.termos.map((v) => v.termo), ['ativacao de cardapio', 'ondulacao de estoque', 'zebra fiscal']);
});

t('atualizacao: termo repetido sem --atualizar falha citando a definicao atual', () => {
  const dir = mkProjeto();
  termo.registrar(dir, { termo: 'zebra fiscal', definicao: 'primeira definicao registrada.' });
  assert.throws(
    () => termo.registrar(dir, { termo: 'zebra fiscal', definicao: 'segunda definicao, tentando sobrescrever.' }),
    /primeira definicao registrada/
  );
});

t('atualizacao: termo repetido com --atualizar substitui a definicao e preserva os demais verbetes', () => {
  const dir = mkProjeto();
  termo.registrar(dir, { termo: 'ativacao de cardapio', definicao: 'primeira definicao do primeiro termo.' });
  termo.registrar(dir, { termo: 'zebra fiscal', definicao: 'primeira definicao do segundo termo.' });
  termo.registrar(dir, { termo: 'zebra fiscal', definicao: 'definicao substituida do segundo termo.', atualizar: true });

  const r = termo.listar(dir);
  assert.strictEqual(r.termos.length, 2);
  const primeiro = r.termos.find((v) => v.termo === 'ativacao de cardapio');
  const segundo = r.termos.find((v) => v.termo === 'zebra fiscal');
  assert.strictEqual(primeiro.definicao, 'primeira definicao do primeiro termo.');
  assert.strictEqual(segundo.definicao, 'definicao substituida do segundo termo.');
});

// =====================================================================
// Template ausente (tarefa 2)
// =====================================================================

t('template ausente: gravacao continua funcionando com cabecalho embutido e aviso no retorno', () => {
  const dir = mkProjeto();
  const backup = fs.readFileSync(CAMINHO_TEMPLATE, 'utf-8');
  const renomeado = `${CAMINHO_TEMPLATE}.bak-teste`;
  fs.renameSync(CAMINHO_TEMPLATE, renomeado);
  try {
    const r = termo.registrar(dir, {
      termo: 'zebra fiscal',
      definicao: 'nome interno do modulo de conferencia fiscal deste projeto.',
    });
    assert.strictEqual(r.criado_agora, true);
    assert.ok(r.aviso, 'deveria trazer um aviso de template ausente');
    const conteudo = fs.readFileSync(arquivoGlossario(dir), 'utf-8');
    assert.ok(conteudo.includes('Regra de admiss'), 'cabecalho embutido deveria trazer a regra de admissao');
    assert.ok(conteudo.includes('Regra de higiene'), 'cabecalho embutido deveria trazer a regra de higiene');
  } finally {
    fs.renameSync(renomeado, CAMINHO_TEMPLATE);
    assert.strictEqual(fs.readFileSync(CAMINHO_TEMPLATE, 'utf-8'), backup, 'template deveria voltar identico');
  }
});

// =====================================================================
// Roteamento do espaco memoria (submodulo termo ja instalado)
// =====================================================================

t('roteamento: memoria termo listar via binario real devolve lista vazia com codigo 0', () => {
  const dir = mkProjeto();
  const r = runCli(['memoria', 'termo', 'listar'], dir);
  assert.strictEqual(r.status, 0);
  const parsed = JSON.parse(r.stdout);
  assert.deepStrictEqual(parsed.termos, []);
});

// =====================================================================
// Linha de comando real (tarefa 4)
// =====================================================================

t('linha de comando: registrar recusado (higiene) sai com codigo 1 e nao cria arquivo', () => {
  const dir = mkProjeto();
  const r = runCli([
    'memoria', 'termo', 'registrar',
    '--termo', 'zebra fiscal',
    '--definicao', 'implementado em up/bin/lib/memoria-termo.cjs',
  ], dir);
  assert.strictEqual(r.status, 1);
  assert.ok(!fs.existsSync(arquivoGlossario(dir)), 'nao deveria ter criado o arquivo');
});

t('linha de comando: registrar aprovado sai com codigo 0 e grava o arquivo', () => {
  const dir = mkProjeto();
  const r = runCli([
    'memoria', 'termo', 'registrar',
    '--termo', 'zebra fiscal',
    '--definicao', 'nome interno do modulo de conferencia fiscal deste projeto.',
  ], dir);
  assert.strictEqual(r.status, 0);
  const parsed = JSON.parse(r.stdout);
  assert.strictEqual(parsed.termo, 'zebra fiscal');
  assert.ok(fs.existsSync(arquivoGlossario(dir)));
});

// =====================================================================
// Corrida entre processos concorrentes (RV-003, rework critico)
// =====================================================================

async function testeCorridaTermosDistintos() {
  const dir = mkProjeto();
  const N = 10;
  const promessas = [];
  for (let i = 0; i < N; i++) {
    promessas.push(spawnCliAsync([
      'memoria', 'termo', 'registrar',
      '--termo', `termo concorrente ${i}`,
      '--definicao', `definicao de teste para o termo concorrente numero ${i}, usada so no teste de corrida.`,
    ], dir));
  }
  const resultados = await Promise.all(promessas);

  const aceitos = resultados.filter((r) => r.status === 0);
  assert.strictEqual(aceitos.length, N, `todos os ${N} deveriam ter sido aceitos, saidas: ${JSON.stringify(resultados.map((r) => r.status))}`);

  const listaFinal = JSON.parse(runCli(['memoria', 'termo', 'listar'], dir).stdout);
  assert.strictEqual(listaFinal.termos.length, N, `deveriam existir ${N} termos no glossario ao final, existem ${listaFinal.termos.length}`);

  const conteudo = fs.readFileSync(arquivoGlossario(dir), 'utf-8');
  assert.ok(conteudo.includes('Regra de admiss'), 'cabecalho do glossario (regra de admissao) nao pode ser apagado por uma corrida');
  assert.ok(conteudo.includes('Regra de higiene'), 'cabecalho do glossario (regra de higiene) nao pode ser apagado por uma corrida');
}

async function main() {
  await tAsync(`corrida: ${10} registros de termo concorrentes de nome distinto produzem ${10} verbetes, cabecalho intacto`, testeCorridaTermosDistintos);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main();
