/**
 * memoria-glossario.test.cjs: testes red-green da regua de redefinicao e da cobertura de
 * citacao do glossario interno.
 * Roda: node up/bin/lib/memoria-glossario.test.cjs
 * Sem framework. Cada caso monta a propria arvore de fixtures em diretorio temporario do
 * sistema (glossario de fixture e arquivos de superficie de fixture), nunca o repositorio
 * real. O caso de linha de comando invoca o binario real (up-tools.cjs) via child_process,
 * porque testa codigo de saida do processo.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const glossario = require('./memoria-glossario.cjs');

const UP_TOOLS = path.join(__dirname, '..', 'up-tools.cjs');

function mkTmpDir(prefixo) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
}

function escreverArquivo(caminhoAbsoluto, conteudo) {
  fs.mkdirSync(path.dirname(caminhoAbsoluto), { recursive: true });
  fs.writeFileSync(caminhoAbsoluto, conteudo, 'utf-8');
}

function mkRaizFixture() {
  const raiz = mkTmpDir('up-mem-gloss-raiz-');
  for (const pasta of ['agents', 'workflows', 'skills', 'commands', 'references', 'templates']) {
    fs.mkdirSync(path.join(raiz, pasta), { recursive: true });
  }
  return raiz;
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
// Fixtures de glossario
// =====================================================================

function glossarioNoveVerbetes() {
  const blocos = [];
  for (let i = 1; i <= 9; i++) {
    blocos.push([
      `### termo${i}`,
      '**Definição:** conceito de fixture usado so para provar que a leitura conta nove verbetes.',
      `**Formas:** termo${i}, termos${i}`,
      `**Evitar:** sinonimo${i}`,
      '',
    ].join('\n'));
  }
  return ['# Glossario de fixture', '', '## Termos', '', blocos.join('\n')].join('\n');
}

function glossarioVerbeteIncompleto() {
  return [
    '# Glossario de fixture',
    '',
    '## Termos',
    '',
    '### termo-quebrado',
    '**Definição:** existe definicao, mas falta a linha de formas abaixo.',
    '**Evitar:** sinonimo-quebrado',
    '',
  ].join('\n');
}

function glossarioAlfaBeta() {
  return [
    '# Glossario de fixture',
    '',
    '## Termos',
    '',
    '### alfa',
    '**Definição:** termo de fixture alfa, usado para provar as quatro formas de redefinicao.',
    '**Formas:** alfa, alfas',
    '**Evitar:** zeta',
    '',
    '### beta',
    '**Definição:** segundo termo de fixture, sem nenhuma ocorrencia nos arquivos de superficie.',
    '**Formas:** beta',
    '**Evitar:** gama',
    '',
  ].join('\n');
}

// =====================================================================
// Tarefa 1: leitura do glossario
// =====================================================================

t('lerTermos: fixture completa com nove verbetes devolve nove entradas com formas e evitar', () => {
  const arqGlossario = path.join(mkTmpDir('up-mem-gloss-nove-'), 'glossario-up.md');
  fs.writeFileSync(arqGlossario, glossarioNoveVerbetes(), 'utf-8');
  const termos = glossario.lerTermos(arqGlossario);
  assert.strictEqual(termos.length, 9);
  for (const termo of termos) {
    assert.ok(termo.formas.length > 0, `formas nao deveria ser vazio para ${termo.termo}`);
    assert.ok(termo.evitar.length > 0, `evitar nao deveria ser vazio para ${termo.termo}`);
  }
  assert.strictEqual(termos[0].termo, 'termo1');
});

t('lerTermos: verbete sem a linha de formas lanca excecao citando o termo', () => {
  const arqGlossario = path.join(mkTmpDir('up-mem-gloss-quebrado-'), 'glossario-up.md');
  fs.writeFileSync(arqGlossario, glossarioVerbeteIncompleto(), 'utf-8');
  assert.throws(() => glossario.lerTermos(arqGlossario), /termo-quebrado/);
});

t('lerTermos: glossario interno real devolve nove verbetes com formas e evitar nao vazios', () => {
  const termos = glossario.lerTermos(glossario.caminhoGlossario());
  assert.strictEqual(termos.length, 9);
  for (const termo of termos) {
    assert.ok(termo.formas.length > 0);
    assert.ok(termo.evitar.length > 0);
  }
});

t('arquivosVarridos: raiz real devolve arquivos de markdown das seis pastas, sem o glossario', () => {
  const arquivos = glossario.arquivosVarridos();
  assert.ok(arquivos.length > 0);
  assert.ok(!arquivos.some((a) => path.basename(a) === 'glossario-up.md'));
  assert.ok(arquivos.some((a) => a.includes(`${path.sep}agents${path.sep}`)));
  assert.ok(arquivos.some((a) => a.includes(`${path.sep}workflows${path.sep}`)));
});

// =====================================================================
// Tarefa 2: contagem de redefinicao (check), quatro formas e tres cortes
// =====================================================================

function arquivoComQuatroFormas() {
  return [
    '# Exemplo',
    '',
    '**Alfa:** prosa longa que passa facilmente o corte de oito palavras aqui mesmo',
    '- alfa: outra prosa longa que tambem passa o corte de oito palavras tranquilamente',
    '',
    '| Nome | Descricao |',
    '|------|-----------|',
    '| alfa | prosa de tabela com bastante mais que oito palavras nesta celula aqui |',
    '',
    '## alfa',
    '',
    'Paragrafo abaixo do cabecalho, com uma linha em branco no meio (markdown normal poe linha',
    'em branco depois de todo cabecalho), com mais de oito palavras para passar o corte tambem.',
    '',
  ].join('\n');
}

function arquivoComQuatroFormasCitandoGlossario() {
  return [
    '# Exemplo',
    '',
    '**Alfa:** prosa longa que passa facilmente o corte de oito palavras, ver glossario-up.md',
    '- alfa: outra prosa longa que tambem passa o corte de oito palavras, ver glossario-up.md',
    '',
    '| Nome | Descricao |',
    '|------|-----------|',
    '| alfa | prosa de tabela com bastante mais que oito palavras aqui, ver glossario-up.md |',
    '',
    '## alfa',
    '',
    'Paragrafo abaixo do cabecalho, com linha em branco no meio, ver glossario-up.md.',
    '',
  ].join('\n');
}

t('check: fixture com uma linha em cada uma das quatro formas conta quatro achados nomeados', () => {
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), arquivoComQuatroFormas());

  const r = glossario.check(process.cwd(), { raiz, glossario: arqGlossario });
  assert.strictEqual(r.total, 4, JSON.stringify(r.achados));
  const formas = r.achados.map((a) => a.forma).sort();
  assert.deepStrictEqual(formas, [
    'forma-1-rotulo-negrito',
    'forma-2-item-lista',
    'forma-3-linha-tabela',
    'forma-4-cabecalho',
  ]);
  assert.ok(r.achados.every((a) => a.termo === 'alfa'));
});

t('check: mesma fixture citando o nome do glossario na linha conta zero', () => {
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), arquivoComQuatroFormasCitandoGlossario());

  const r = glossario.check(process.cwd(), { raiz, glossario: arqGlossario });
  assert.strictEqual(r.total, 0, JSON.stringify(r.achados));
  assert.strictEqual(r.aprovado, true);
});

t('check: rotulo de campo com prosa curta (menos de oito palavras) nao conta', () => {
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), '**Alfa:** curto demais\n');

  const r = glossario.check(process.cwd(), { raiz, glossario: arqGlossario });
  assert.strictEqual(r.total, 0, JSON.stringify(r.achados));
});

t('check: linha dentro de bloco de codigo nao conta, mesmo com as quatro formas presentes', () => {
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  const conteudo = '```markdown\n' + arquivoComQuatroFormas() + '```\n';
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), conteudo);

  const r = glossario.check(process.cwd(), { raiz, glossario: arqGlossario });
  assert.strictEqual(r.total, 0, JSON.stringify(r.achados));
});

t('check: linha de tabela que e o cabecalho da tabela nao conta, mesmo casando o termo', () => {
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  const conteudo = [
    '| alfa | Descricao |',
    '|------|-----------|',
    '| 1 | linha comum, nao e o termo na primeira celula |',
    '',
  ].join('\n');
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), conteudo);

  const r = glossario.check(process.cwd(), { raiz, glossario: arqGlossario });
  assert.strictEqual(r.total, 0, JSON.stringify(r.achados));
});

t('check: modo estrito com achado lanca excecao listando o achado', () => {
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), arquivoComQuatroFormas());

  assert.throws(
    () => glossario.check(process.cwd(), { raiz, glossario: arqGlossario, estrito: true }),
    /Redefinicao encontrada/
  );
});

t('check: modo estrito sem achado nao lanca', () => {
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), '# Nada aqui casa com os termos de fixture.\n');

  const r = glossario.check(process.cwd(), { raiz, glossario: arqGlossario, estrito: true });
  assert.strictEqual(r.total, 0);
});

t('check: --pastas restringe a varredura, ignorando arquivo de outra pasta', () => {
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), arquivoComQuatroFormas());

  const r = glossario.check(process.cwd(), { raiz, glossario: arqGlossario, pastas: ['workflows'] });
  assert.strictEqual(r.total, 0);
  assert.strictEqual(r.arquivos_count, 0);
});

// =====================================================================
// Tarefa 3: cobertura de citacao
// =====================================================================

t('citacao: agente sem citar e agente citando devolve um faltando', () => {
  const raiz = mkRaizFixture();
  escreverArquivo(path.join(raiz, 'agents', 'com-citacao.md'), 'Este agente cita o arquivo glossario-up.md.\n');
  escreverArquivo(path.join(raiz, 'agents', 'sem-citacao.md'), 'Este agente nao cita nada.\n');

  const r = glossario.citacao(process.cwd(), { raiz });
  assert.strictEqual(r.com_citacao, 1);
  assert.strictEqual(r.sem_citacao, 1);
  assert.deepStrictEqual(r.faltando, ['agents/sem-citacao.md']);
  assert.strictEqual(r.aprovado, false);
});

t('citacao: os dois arquivos citando aprova com zero faltando', () => {
  const raiz = mkRaizFixture();
  escreverArquivo(path.join(raiz, 'agents', 'um.md'), 'Cita glossario-up.md.\n');
  escreverArquivo(path.join(raiz, 'workflows', 'dois.md'), 'Tambem cita glossario-up.md.\n');

  const r = glossario.citacao(process.cwd(), { raiz });
  assert.strictEqual(r.sem_citacao, 0);
  assert.strictEqual(r.aprovado, true);
});

t('citacao: modo estrito com arquivo faltando lanca excecao', () => {
  const raiz = mkRaizFixture();
  escreverArquivo(path.join(raiz, 'agents', 'sem-citacao.md'), 'Nada aqui.\n');

  assert.throws(() => glossario.citacao(process.cwd(), { raiz, estrito: true }), /Cobertura de citacao/);
});

t('citacao: nao considera arquivo de comandos ou templates', () => {
  const raiz = mkRaizFixture();
  escreverArquivo(path.join(raiz, 'commands', 'algum.md'), 'Sem citacao nenhuma.\n');
  escreverArquivo(path.join(raiz, 'templates', 'outro.md'), 'Sem citacao nenhuma.\n');

  const r = glossario.citacao(process.cwd(), { raiz });
  assert.strictEqual(r.com_citacao, 0);
  assert.strictEqual(r.sem_citacao, 0);
  assert.strictEqual(r.aprovado, true);
});

// =====================================================================
// Roteamento (via binario real): submodulo glossario ja instalado
// =====================================================================

t('roteamento: memoria glossario com acao desconhecida falha com mensagem legivel', () => {
  const dir = mkTmpDir('up-mem-gloss-cli-');
  fs.mkdirSync(path.join(dir, '.plano'), { recursive: true });
  const r = runCli(['memoria', 'glossario', 'acao-inexistente'], dir);
  assert.strictEqual(r.status, 1);
  assert.match(r.stderr, /Acao desconhecida para memoria glossario/);
});

// =====================================================================
// Tarefa 4: linha de comando real, contra a arvore de fixtures, nos dois modos
// =====================================================================

t('linha de comando: check estrito contra fixture com achado sai com codigo diferente de zero', () => {
  const dir = mkTmpDir('up-mem-gloss-cli-red-');
  fs.mkdirSync(path.join(dir, '.plano'), { recursive: true });
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), arquivoComQuatroFormas());

  const r = runCli(['memoria', 'glossario', 'check', '--raiz', raiz, '--glossario', arqGlossario, '--estrito'], dir);
  assert.notStrictEqual(r.status, 0);
});

t('linha de comando: check estrito contra fixture sem achado sai com codigo zero e imprime o total', () => {
  const dir = mkTmpDir('up-mem-gloss-cli-green-');
  fs.mkdirSync(path.join(dir, '.plano'), { recursive: true });
  const raiz = mkRaizFixture();
  const arqGlossario = path.join(raiz, 'glossario-fixture.md');
  fs.writeFileSync(arqGlossario, glossarioAlfaBeta(), 'utf-8');
  escreverArquivo(path.join(raiz, 'agents', 'exemplo.md'), '# Nada aqui casa com os termos de fixture.\n');

  const r = runCli(['memoria', 'glossario', 'check', '--raiz', raiz, '--glossario', arqGlossario, '--estrito'], dir);
  assert.strictEqual(r.status, 0);
  const parsed = JSON.parse(r.stdout);
  assert.strictEqual(parsed.total, 0);
  assert.strictEqual(parsed.aprovado, true);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
