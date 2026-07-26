/**
 * memoria-e2e.test.cjs: prova ponta a ponta do espaco de memoria (Fase 14, plano 006).
 * Roda: node up/bin/lib/memoria-e2e.test.cjs
 *
 * Diferenca deliberada dos outros testes desta fase: nao chama nenhum submodulo por
 * dentro (nunca faz require de memoria-decisao.cjs, memoria-rejeicoes.cjs etc). Executa
 * o binario de ferramentas de verdade (up-tools.cjs) via child_process, contra um unico
 * projeto temporario com diretorio de planejamento vazio, na ordem em que o dono
 * percorre o fluxo.
 *
 * Tarefa 1: jornada do criterio 3 do briefing, em um unico caso encadeado (criacao
 * preguicosa, gate das tres condicoes, numeracao crescente). Tarefa 2 (esta):
 * jornada do criterio 4 (reproposta de conceito recusado), no mesmo projeto
 * temporario que a tarefa 1 deixou, sem recriar nada: a segunda jornada depende
 * do estado que a primeira deixou (duas decisoes e um termo ja existem quando ela
 * comeca), exatamente como aconteceria numa sessao real do dono.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const UP_TOOLS = path.join(__dirname, '..', 'up-tools.cjs');

function runCli(argsArr, cwd) {
  return spawnSync(process.execPath, [UP_TOOLS, ...argsArr, '--cwd', cwd], { encoding: 'utf-8' });
}

function jsonOut(resultado) {
  assert.ok(resultado.stdout, 'stdout vazio, nada para parsear como JSON: ' + resultado.stderr);
  return JSON.parse(resultado.stdout);
}

function arquivosMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((a) => a.endsWith('.md')).sort();
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  -', name); pass++; }
  catch (e) { console.error('  FAIL -', name, '\n     ', e.message); fail++; }
}

// =====================================================================
// Projeto temporario unico, compartilhado pelas duas jornadas
// =====================================================================

const PROJETO = fs.mkdtempSync(path.join(os.tmpdir(), 'up-memoria-e2e-'));
fs.mkdirSync(path.join(PROJETO, '.plano'), { recursive: true });

const GLOSSARIO_PROJETO = path.join(PROJETO, '.plano', 'GLOSSARY.md');
const DIR_DECISOES = path.join(PROJETO, '.plano', 'decisoes');
const DIR_FORA_DE_ESCOPO = path.join(PROJETO, '.plano', 'fora-de-escopo');

console.log('\n=== Jornada 1 (criterio 3 do briefing): criacao preguicosa, gate e numeracao ===\n');

// ---------------------------------------------------------------------
// Estado inicial: nenhum dos tres artefatos existe
// ---------------------------------------------------------------------

t('estado inicial: glossario do projeto, decisoes e fora-de-escopo nao existem', () => {
  assert.strictEqual(fs.existsSync(GLOSSARIO_PROJETO), false, 'GLOSSARY.md nao deveria existir ainda');
  assert.strictEqual(fs.existsSync(DIR_DECISOES), false, '.plano/decisoes nao deveria existir ainda');
  assert.strictEqual(fs.existsSync(DIR_FORA_DE_ESCOPO), false, '.plano/fora-de-escopo nao deveria existir ainda');
});

// ---------------------------------------------------------------------
// Consulta em base vazia: leitura nunca cria
// ---------------------------------------------------------------------

t('consulta em base vazia: buscar rejeicao devolve vazio e nao cria nada', () => {
  const r = runCli(['memoria', 'fora-de-escopo', 'buscar', '--pedido', 'qualquer coisa que ninguem pediu ainda'], PROJETO);
  assert.strictEqual(r.status, 0, 'codigo de saida deveria ser zero: ' + r.stderr);
  const saida = jsonOut(r);
  assert.deepStrictEqual(saida.achados, []);
  assert.strictEqual(saida.base_existe, false);
  assert.strictEqual(fs.existsSync(DIR_FORA_DE_ESCOPO), false, 'leitura nunca cria o diretorio');
});

t('consulta em base vazia: listar termos devolve vazio e nao cria nada', () => {
  const r = runCli(['memoria', 'termo', 'listar'], PROJETO);
  assert.strictEqual(r.status, 0, 'codigo de saida deveria ser zero: ' + r.stderr);
  const saida = jsonOut(r);
  assert.deepStrictEqual(saida.termos, []);
  assert.strictEqual(saida.arquivo_existe, false);
  assert.strictEqual(fs.existsSync(GLOSSARIO_PROJETO), false, 'leitura nunca cria o arquivo');
});

// ---------------------------------------------------------------------
// Decisao recusada: as tres formas de faltar uma condicao do gate
// ---------------------------------------------------------------------

const CAMPOS_DECISAO_BASE = [
  '--titulo', 'Adotar SQLite embarcado no modo standalone',
  '--contexto', 'O modo standalone do produto precisa gravar dados localmente, sem exigir instalacao de banco externo pelo usuario final.',
  '--decisao', 'Usar SQLite embarcado como banco padrao do modo standalone.',
  '--motivo', 'Reduz a friccao de instalacao e mantem paridade com o resto do produto, que ja roda tudo local.',
];

const DIFICIL_REVERTER = 'Trocar de banco depois exige migrar os dados de todos os usuarios que ja instalaram o produto.';
const SURPREENDENTE = 'Ninguem no time esperava abandonar o Postgres para o modo standalone.';
const TRADE_OFF = 'Ganha simplicidade de instalacao mas perde recursos avancados de consulta do Postgres.';
const ALTERNATIVA_1 = 'Manter Postgres embarcado :: Exige gerenciar um processo de banco separado no computador do usuario final, o que aumenta o custo de suporte.';
const ALTERNATIVA_2 = 'Usar um arquivo texto simples :: Nao aguenta consulta nem concorrencia quando o restaurante tem mais de um caixa aberto ao mesmo tempo.';

t('decisao recusada: falta a justificativa de trade-off, nao cria o diretorio', () => {
  const args = [
    'memoria', 'decisao', 'criar', ...CAMPOS_DECISAO_BASE,
    '--dificil-reverter', DIFICIL_REVERTER,
    '--surpreendente', SURPREENDENTE,
    '--alternativa', ALTERNATIVA_1,
  ];
  const r = runCli(args, PROJETO);
  assert.strictEqual(r.status, 1, 'deveria falhar com codigo 1');
  assert.ok(r.stderr.includes('trade-off real'), 'mensagem deveria citar a condicao de trade-off: ' + r.stderr);
  assert.strictEqual(fs.existsSync(DIR_DECISOES), false, 'diretorio de decisoes nao pode nascer de uma recusa');
});

t('decisao recusada: falta a condicao de dificil-reverter, nao cria o diretorio', () => {
  const args = [
    'memoria', 'decisao', 'criar', ...CAMPOS_DECISAO_BASE,
    '--surpreendente', SURPREENDENTE,
    '--trade-off', TRADE_OFF,
    '--alternativa', ALTERNATIVA_1,
  ];
  const r = runCli(args, PROJETO);
  assert.strictEqual(r.status, 1, 'deveria falhar com codigo 1');
  assert.ok(r.stderr.includes('dificil de reverter'), 'mensagem deveria citar a condicao de dificil de reverter: ' + r.stderr);
  assert.strictEqual(fs.existsSync(DIR_DECISOES), false, 'diretorio de decisoes nao pode nascer de uma recusa');
});

t('decisao recusada: sem alternativa nenhuma, nao cria o diretorio', () => {
  const args = [
    'memoria', 'decisao', 'criar', ...CAMPOS_DECISAO_BASE,
    '--dificil-reverter', DIFICIL_REVERTER,
    '--surpreendente', SURPREENDENTE,
    '--trade-off', TRADE_OFF,
  ];
  const r = runCli(args, PROJETO);
  assert.strictEqual(r.status, 1, 'deveria falhar com codigo 1');
  assert.ok(r.stderr.includes('alternativa rejeitada'), 'mensagem deveria citar a exigencia de alternativa: ' + r.stderr);
  assert.strictEqual(fs.existsSync(DIR_DECISOES), false, 'diretorio de decisoes nao pode nascer de uma recusa');
});

// ---------------------------------------------------------------------
// Decisao aceita: primeiro registro, numero inicial, diretorio nasce agora
// ---------------------------------------------------------------------

let numeroPrimeiraDecisao = null;

t('decisao aceita: criacao completa nasce com numero inicial e as duas alternativas', () => {
  assert.strictEqual(fs.existsSync(DIR_DECISOES), false, 'diretorio ainda nao deveria existir antes desta chamada');
  const args = [
    'memoria', 'decisao', 'criar', ...CAMPOS_DECISAO_BASE,
    '--dificil-reverter', DIFICIL_REVERTER,
    '--surpreendente', SURPREENDENTE,
    '--trade-off', TRADE_OFF,
    '--alternativa', ALTERNATIVA_1,
    '--alternativa', ALTERNATIVA_2,
  ];
  const r = runCli(args, PROJETO);
  assert.strictEqual(r.status, 0, 'deveria ser aceita: ' + r.stderr);
  const saida = jsonOut(r);
  assert.strictEqual(saida.criado, true);
  assert.strictEqual(saida.numero, '0001');
  assert.strictEqual(saida.alternativas_count, 2);
  numeroPrimeiraDecisao = saida.numero;
  assert.strictEqual(fs.existsSync(DIR_DECISOES), true, 'o diretorio deveria nascer agora, com a primeira decisao aceita');

  const conteudo = fs.readFileSync(path.join(DIR_DECISOES, saida.caminho.split('/').pop()), 'utf-8');
  assert.ok(conteudo.includes('Manter Postgres embarcado'), 'arquivo deveria conter a primeira alternativa');
  assert.ok(conteudo.includes('Usar um arquivo texto simples'), 'arquivo deveria conter a segunda alternativa');
  assert.ok(conteudo.includes('Exige gerenciar um processo de banco separado'), 'arquivo deveria conter o motivo da primeira alternativa');
  assert.ok(conteudo.includes('Nao aguenta consulta nem concorrencia'), 'arquivo deveria conter o motivo da segunda alternativa');
});

// ---------------------------------------------------------------------
// Segunda decisao: numero seguinte, distinto e crescente
// ---------------------------------------------------------------------

t('segunda decisao: numero seguinte, distinto e crescente', () => {
  const args = [
    'memoria', 'decisao', 'criar',
    '--titulo', 'Adotar fila de mensagens para o pedido do salao',
    '--contexto', 'O pedido feito no salao precisa chegar na cozinha sem travar a tela do garcom enquanto a impressora esta ocupada.',
    '--decisao', 'Colocar uma fila de mensagens entre o app do garcom e a impressora da cozinha.',
    '--motivo', 'Desacopla a interface do garcom da disponibilidade fisica da impressora, que trava com frequencia no horario de pico.',
    '--dificil-reverter', 'Depois que a cozinha se acostuma com o fluxo assincrono, voltar ao sincrono quebra o habito formado.',
    '--surpreendente', 'Ninguem no time esperava introduzir infraestrutura de fila so para uma impressora.',
    '--trade-off', 'Ganha resiliencia mas perde a certeza imediata de que o pedido chegou na cozinha.',
    '--alternativa', 'Repetir o envio ate a impressora responder :: Trava a tela do garcom durante a tentativa, o que e pior que o problema original.',
  ];
  const r = runCli(args, PROJETO);
  assert.strictEqual(r.status, 0, 'deveria ser aceita: ' + r.stderr);
  const saida = jsonOut(r);
  assert.strictEqual(saida.criado, true);
  assert.strictEqual(saida.numero, '0002');
  assert.notStrictEqual(saida.numero, numeroPrimeiraDecisao, 'o segundo numero deve ser distinto do primeiro');
  assert.ok(parseInt(saida.numero, 10) > parseInt(numeroPrimeiraDecisao, 10), 'o segundo numero deve ser crescente');
});

// ---------------------------------------------------------------------
// Termo do projeto: glossario nasce agora, com as duas regras no cabecalho
// ---------------------------------------------------------------------

t('termo do projeto: glossario nasce agora, com a regra de admissao e a regra de higiene', () => {
  assert.strictEqual(fs.existsSync(GLOSSARIO_PROJETO), false, 'o glossario ainda nao deveria existir antes desta chamada');
  const r = runCli([
    'memoria', 'termo', 'registrar',
    '--termo', 'Ticket fiscal',
    '--definicao', 'Documento que registra a venda no caixa do restaurante para fins fiscais.',
  ], PROJETO);
  assert.strictEqual(r.status, 0, 'deveria ser aceito: ' + r.stderr);
  const saida = jsonOut(r);
  assert.strictEqual(saida.criado_agora, true);
  assert.strictEqual(saida.total_termos, 1);
  assert.strictEqual(fs.existsSync(GLOSSARIO_PROJETO), true, 'o glossario deveria nascer agora');

  const conteudo = fs.readFileSync(GLOSSARIO_PROJETO, 'utf-8');
  assert.ok(/Regra de admiss/.test(conteudo), 'cabecalho deveria trazer a regra de admissao');
  assert.ok(/Regra de higiene/.test(conteudo), 'cabecalho deveria trazer a regra de higiene');
  assert.ok(conteudo.includes('Ticket fiscal'), 'verbete deveria estar presente');
});

// ---------------------------------------------------------------------
// Aceite da tarefa 1: exatamente dois registros de decisao e um termo
// ---------------------------------------------------------------------

t('aceite da jornada 1: exatamente duas decisoes e um termo no glossario do projeto', () => {
  assert.strictEqual(arquivosMd(DIR_DECISOES).length, 2, 'deveriam existir exatamente dois registros de decisao');
  const listaTermos = jsonOut(runCli(['memoria', 'termo', 'listar'], PROJETO));
  assert.strictEqual(listaTermos.termos.length, 1, 'deveria existir exatamente um termo no glossario do projeto');
});

console.log('\n=== Jornada 2 (criterio 4 do briefing): reproposta de conceito recusado ===\n');

// ---------------------------------------------------------------------
// Registro da recusa: base de rejeicoes nasce agora, no mesmo projeto
// ---------------------------------------------------------------------

const TITULO_REJEICAO = 'Painel de controle do usuário';
const MOTIVO_REJEICAO = 'O escopo do MVP nao inclui um painel administrativo separado; a gestao acontece direto na tela principal do operador.';

t('registro da recusa: base de rejeicoes nasce agora', () => {
  assert.strictEqual(fs.existsSync(DIR_FORA_DE_ESCOPO), false, 'a base de rejeicoes ainda nao deveria existir');
  const r = runCli([
    'memoria', 'fora-de-escopo', 'registrar',
    '--conceito', 'painel de controle do usuario',
    '--titulo', TITULO_REJEICAO,
    '--motivo', MOTIVO_REJEICAO,
    '--alias', 'painel admin',
    '--alias', 'tela de controle',
  ], PROJETO);
  assert.strictEqual(r.status, 0, 'deveria ser aceito: ' + r.stderr);
  const saida = jsonOut(r);
  assert.strictEqual(saida.base_criada_agora, true);
  assert.strictEqual(saida.aliases_count, 2);
  assert.strictEqual(fs.existsSync(DIR_FORA_DE_ESCOPO), true, 'a base deveria nascer agora');
  assert.strictEqual(arquivosMd(DIR_FORA_DE_ESCOPO).length, 1, 'deveria existir exatamente um arquivo de rejeicao');
});

// ---------------------------------------------------------------------
// Reproposta: pedido com as palavras do conceito traz a rejeicao anterior
// ---------------------------------------------------------------------

t('reproposta: pedido com as palavras do conceito traz o achado, motivo, data e pergunta pronta', () => {
  const r = runCli([
    'memoria', 'fora-de-escopo', 'buscar',
    '--pedido', 'Queremos adicionar um painel de controle para o usuario gerenciar tudo',
  ], PROJETO);
  assert.strictEqual(r.status, 0, 'a busca nao deveria falhar: ' + r.stderr);
  const saida = jsonOut(r);
  assert.strictEqual(saida.achados.length, 1, 'deveria haver exatamente um achado');
  const achado = saida.achados[0];
  assert.strictEqual(achado.titulo, TITULO_REJEICAO);
  assert.strictEqual(achado.motivo, MOTIVO_REJEICAO);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(achado.registrado_em), 'a data registrada deveria estar no formato ano-mes-dia: ' + achado.registrado_em);
  assert.ok(achado.pergunta.includes(TITULO_REJEICAO), 'a pergunta deveria citar a semelhanca com o conceito recusado');
  assert.ok(achado.pergunta.includes('Recomendo'), 'a pergunta deveria trazer a recomendacao');
  assert.ok(achado.pergunta.trim().endsWith('?'), 'a pergunta deveria terminar perguntando ao dono');
});

// ---------------------------------------------------------------------
// Pedido diferente: uma unica palavra compartilhada nunca casa sozinha
// ---------------------------------------------------------------------

t('pedido diferente: uma unica palavra compartilhada com o conceito nao casa', () => {
  const r = runCli([
    'memoria', 'fora-de-escopo', 'buscar',
    '--pedido', 'Precisamos de um painel de metricas em tempo real para o financeiro',
  ], PROJETO);
  assert.strictEqual(r.status, 0, 'a busca nao deveria falhar: ' + r.stderr);
  const saida = jsonOut(r);
  assert.deepStrictEqual(saida.achados, [], 'palavra solta compartilhada nao pode produzir achado');
});

// ---------------------------------------------------------------------
// Portas fechadas: item ja implementado e motivo de adiamento nao entram
// ---------------------------------------------------------------------

t('porta fechada: motivo de item ja implementado e recusado e nao cria arquivo', () => {
  const antes = arquivosMd(DIR_FORA_DE_ESCOPO);
  const r = runCli([
    'memoria', 'fora-de-escopo', 'registrar',
    '--conceito', 'modulo de estoque separado',
    '--titulo', 'Modulo de estoque separado',
    '--motivo', 'Isso ja esta pronto no sistema atual, nao precisa duplicar.',
  ], PROJETO);
  assert.strictEqual(r.status, 1, 'deveria falhar com codigo 1');
  assert.ok(r.stderr.includes('ja implementado'), 'mensagem deveria apontar item ja implementado: ' + r.stderr);
  assert.deepStrictEqual(arquivosMd(DIR_FORA_DE_ESCOPO), antes, 'a recusa nao pode criar arquivo novo');
});

t('porta fechada: motivo de adiamento e recusado e nao cria arquivo', () => {
  const antes = arquivosMd(DIR_FORA_DE_ESCOPO);
  const r = runCli([
    'memoria', 'fora-de-escopo', 'registrar',
    '--conceito', 'modulo de estoque separado',
    '--titulo', 'Modulo de estoque separado',
    '--motivo', 'Por enquanto nao vamos fazer isso; fica para depois.',
  ], PROJETO);
  assert.strictEqual(r.status, 1, 'deveria falhar com codigo 1');
  assert.ok(r.stderr.includes('adiamento'), 'mensagem deveria apontar adiamento: ' + r.stderr);
  assert.deepStrictEqual(arquivosMd(DIR_FORA_DE_ESCOPO), antes, 'a recusa nao pode criar arquivo novo');
});

t('aceite da jornada 2: a base de rejeicoes continua com exatamente um arquivo', () => {
  assert.strictEqual(arquivosMd(DIR_FORA_DE_ESCOPO).length, 1, 'nenhuma das duas portas fechadas deveria ter criado arquivo');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
