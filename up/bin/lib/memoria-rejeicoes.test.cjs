/**
 * memoria-rejeicoes.test.cjs: testes red-green da base de rejeicoes por conceito de dominio.
 * Roda: node up/bin/lib/memoria-rejeicoes.test.cjs
 * Sem framework. Cada caso monta um projeto temporario proprio (diretorio temp do sistema,
 * com .plano/). Casos de roteamento e de linha de comando invocam o binario real
 * (up-tools.cjs) via child_process, porque testam codigo de saida do processo: chamar essas
 * falhas em processo, via require direto, mataria o proprio runner de teste (error() do
 * core.cjs chama process.exit).
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const rejeicoes = require('./memoria-rejeicoes.cjs');

const UP_TOOLS = path.join(__dirname, '..', 'up-tools.cjs');

function mkProjeto() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'up-mem-rejeicoes-'));
  fs.mkdirSync(path.join(dir, '.plano'), { recursive: true });
  return dir;
}

function dirForaDeEscopo(dir) {
  return path.join(dir, '.plano', 'fora-de-escopo');
}

/** Escreve um arquivo de rejeicao a mao, no formato do contrato, sem passar pelo modulo. */
function escreverRejeicaoAMao(dir, { conceito, titulo, aliases, registradoEm, motivo, gatilho }) {
  const alvo = dirForaDeEscopo(dir);
  fs.mkdirSync(alvo, { recursive: true });
  const linhasAliases = (aliases || []).map((a) => `  - ${a}`).join('\n');
  const conteudo = [
    '---',
    `conceito: ${conceito}`,
    `titulo: ${titulo}`,
    'aliases:',
    linhasAliases,
    `registrado_em: ${registradoEm}`,
    'tipo_motivo: estrutural',
    '---',
    '',
    `# ${titulo}`,
    '',
    '## Motivo da recusa',
    motivo,
    '',
    '## O que faria isso voltar a mesa',
    gatilho || 'Nenhum gatilho de reabertura foi declarado.',
    '',
  ].filter((l) => l !== '').join('\n') + '\n';
  fs.writeFileSync(path.join(alvo, `${conceito}.md`), conteudo, 'utf-8');
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
// Normalizacao e tokens (base deterministica do modulo)
// =====================================================================

t('normalizar: minusculas, sem acento, so letra/digito, espacos colapsados', () => {
  assert.strictEqual(rejeicoes.normalizar('  Painel   de MÉTRICAS!! em-Tempo, Real?? '), 'painel de metricas em tempo real');
});

t('tokensSignificativos: descarta palavra vazia e token curto, sem repeticao', () => {
  assert.deepStrictEqual(
    rejeicoes.tokensSignificativos('painel de metricas em tempo real e o painel de novo'),
    ['painel', 'metricas', 'tempo', 'real']
  );
});

// =====================================================================
// Criacao preguicosa (tarefa 1 e 4): base ausente nao cria nada
// =====================================================================

t('listarRejeicoes: base ausente devolve lista vazia e nao cria diretorio', () => {
  const dir = mkProjeto();
  const r = rejeicoes.listarRejeicoes(dir);
  assert.deepStrictEqual(r, []);
  assert.ok(!fs.existsSync(dirForaDeEscopo(dir)));
});

t('acao listar: base ausente devolve lista vazia, booleano falso, sem criar diretorio', () => {
  const dir = mkProjeto();
  const r = rejeicoes.run(dir, ['listar']);
  assert.deepStrictEqual(r.result.rejeicoes, []);
  assert.strictEqual(r.result.base_existe, false);
  assert.ok(!fs.existsSync(dirForaDeEscopo(dir)));
});

t('acao buscar: base ausente devolve lista vazia sem erro e sem criar diretorio', () => {
  const dir = mkProjeto();
  const r = rejeicoes.run(dir, ['buscar', '--pedido', 'qualquer coisa aqui']);
  assert.deepStrictEqual(r.result.achados, []);
  assert.strictEqual(r.result.base_existe, false);
  assert.ok(!fs.existsSync(dirForaDeEscopo(dir)));
});

t('listarRejeicoes: dois arquivos gravados a mao voltam com conceito, titulo, apelidos e motivo', () => {
  const dir = mkProjeto();
  escreverRejeicaoAMao(dir, {
    conceito: 'painel-de-metricas-em-tempo-real',
    titulo: 'Painel de metricas em tempo real',
    aliases: ['dashboard ao vivo', 'metricas em tempo real'],
    registradoEm: '2026-07-25',
    motivo: 'O produto ja tem um painel de acompanhamento e outro painel duplicaria esforco de manutencao.',
  });
  escreverRejeicaoAMao(dir, {
    conceito: 'exportar-para-excel',
    titulo: 'Exportar relatorio para Excel',
    aliases: ['exportar planilha'],
    registradoEm: '2026-07-20',
    motivo: 'O publico do produto usa apenas visualizacao web e planilha fugiria do escopo combinado.',
  });

  const r = rejeicoes.listarRejeicoes(dir);
  assert.strictEqual(r.length, 2);
  assert.strictEqual(r[0].conceito, 'exportar-para-excel');
  assert.strictEqual(r[1].conceito, 'painel-de-metricas-em-tempo-real');
  assert.strictEqual(r[1].titulo, 'Painel de metricas em tempo real');
  assert.deepStrictEqual(r[1].aliases, ['dashboard ao vivo', 'metricas em tempo real']);
  assert.match(r[1].motivo, /painel de acompanhamento/);
  assert.strictEqual(r[1].registrado_em, '2026-07-25');
});

// =====================================================================
// Guardas de admissao (tarefa 2)
// =====================================================================

t('registrar: motivo com marca de implementado falha e nao cria a base', () => {
  const dir = mkProjeto();
  assert.throws(
    () => rejeicoes.registrar(dir, { conceito: 'painel novo', titulo: 'Painel novo', motivo: 'Isso ja esta pronto no modulo de relatorios.' }),
    /ja implementado/
  );
  assert.ok(!fs.existsSync(dirForaDeEscopo(dir)));
});

t('registrar: motivo com marca de adiamento falha e nao cria a base', () => {
  const dir = mkProjeto();
  assert.throws(
    () => rejeicoes.registrar(dir, { conceito: 'exportacao pdf', titulo: 'Exportacao em PDF', motivo: 'Por enquanto nao entra, focamos em outra coisa agora.' }),
    /adiamento/
  );
  assert.ok(!fs.existsSync(dirForaDeEscopo(dir)));
});

t('registrar: contracao "pra" da marca "deixar pra depois" falha igual a "deixar para depois"', () => {
  const dir = mkProjeto();
  assert.throws(
    () => rejeicoes.registrar(dir, { conceito: 'busca por voz', titulo: 'Busca por voz', motivo: 'Isso a gente pode deixar pra depois, sem problema.' }),
    /adiamento/
  );
  assert.ok(!fs.existsSync(dirForaDeEscopo(dir)));
});

t('registrar: forma "deixar para depois" continua barrada apos a normalizacao de contracao', () => {
  const dir = mkProjeto();
  assert.throws(
    () => rejeicoes.registrar(dir, { conceito: 'busca por voz dois', titulo: 'Busca por voz dois', motivo: 'Isso a gente pode deixar para depois, sem problema.' }),
    /adiamento/
  );
  assert.ok(!fs.existsSync(dirForaDeEscopo(dir)));
});

t('registrar: palavra solta "depois" em prosa legitima nao produz recusa falsa', () => {
  const dir = mkProjeto();
  const r = rejeicoes.registrar(dir, {
    conceito: 'notificacao push',
    titulo: 'Notificacao push nativa',
    motivo: 'Depois de conversar com o time de suporte, ficou claro que o publico do produto so usa o navegador e nunca instala aplicativo nativo.',
  });
  assert.strictEqual(r.conceito, 'notificacao-push');
  assert.ok(fs.existsSync(path.join(dir, r.caminho)));
});

t('registrar: motivo estrutural cria a base e o arquivo', () => {
  const dir = mkProjeto();
  assert.ok(!fs.existsSync(dirForaDeEscopo(dir)));
  const r = rejeicoes.registrar(dir, {
    conceito: 'chat ao vivo com humano',
    titulo: 'Chat ao vivo com atendente humano',
    motivo: 'O produto e self-service por decisao de custo operacional e atendimento humano ao vivo inverteria esse modelo.',
  });
  assert.strictEqual(r.base_criada_agora, true);
  assert.ok(fs.existsSync(dirForaDeEscopo(dir)));
  assert.ok(fs.existsSync(path.join(dir, r.caminho)));
});

t('registrar: mesmo conceito duas vezes falha na segunda', () => {
  const dir = mkProjeto();
  rejeicoes.registrar(dir, { conceito: 'tema escuro', titulo: 'Tema escuro', motivo: 'O publico alvo do produto e majoritariamente corporativo e pediu consistencia visual unica.' });
  assert.throws(
    () => rejeicoes.registrar(dir, { conceito: 'tema escuro', titulo: 'Tema escuro de novo', motivo: 'Outro motivo qualquer para o mesmo conceito repetido aqui.' }),
    /ja existe/
  );
});

t('registrar: campos obrigatorios ausentes falham citando os campos', () => {
  const dir = mkProjeto();
  assert.throws(() => rejeicoes.registrar(dir, { titulo: 'X', motivo: 'Y estrutural qualquer' }), /conceito/);
});

// =====================================================================
// Apelido (tarefa 3)
// =====================================================================

t('alias: acrescentar dois apelidos grava os dois e preserva o corpo', () => {
  const dir = mkProjeto();
  const r0 = rejeicoes.registrar(dir, {
    conceito: 'relatorio financeiro consolidado',
    titulo: 'Relatorio financeiro consolidado',
    motivo: 'O produto delega relatorio financeiro para a ferramenta contabil ja usada pelo cliente.',
  });
  const caminho = path.join(dir, r0.caminho);
  const conteudoAntes = fs.readFileSync(caminho, 'utf-8');
  const corpoAntes = conteudoAntes.split(/^---\n[\s\S]*?\n---\n/m)[1];

  const r = rejeicoes.adicionarAlias(dir, { conceito: 'relatorio financeiro consolidado', aliases: ['relatorio contabil', 'balanco geral'] });
  assert.strictEqual(r.aliases_acrescentados, 2);
  assert.deepStrictEqual(r.aliases, ['relatorio contabil', 'balanco geral']);

  const conteudoDepois = fs.readFileSync(caminho, 'utf-8');
  const corpoDepois = conteudoDepois.split(/^---\n[\s\S]*?\n---\n/m)[1];
  assert.strictEqual(corpoAntes, corpoDepois, 'corpo deveria ficar identico');
});

t('alias: apelido repetido devolve zero acrescentados, sem erro', () => {
  const dir = mkProjeto();
  rejeicoes.registrar(dir, { conceito: 'login social', titulo: 'Login social com terceiros', motivo: 'O produto exige autenticacao unica e federada por regra de seguranca do cliente.' });
  rejeicoes.adicionarAlias(dir, { conceito: 'login social', aliases: ['entrar com google'] });
  const r = rejeicoes.adicionarAlias(dir, { conceito: 'login social', aliases: ['entrar com google'] });
  assert.strictEqual(r.aliases_acrescentados, 0);
  assert.deepStrictEqual(r.aliases, ['entrar com google']);
});

t('alias: conceito inexistente falha citando o conceito procurado', () => {
  const dir = mkProjeto();
  assert.throws(() => rejeicoes.adicionarAlias(dir, { conceito: 'conceito fantasma', aliases: ['x'] }), /conceito-fantasma/);
});

// =====================================================================
// Casamento por conceito de dominio (tarefa 4) - o coracao do plano
// =====================================================================

t('buscar: pedido que compartilha uma unica palavra com o conceito NAO casa', () => {
  const dir = mkProjeto();
  escreverRejeicaoAMao(dir, {
    conceito: 'painel-de-metricas-em-tempo-real',
    titulo: 'Painel de metricas em tempo real',
    aliases: ['dashboard ao vivo'],
    registradoEm: '2026-07-25',
    motivo: 'A equipe ja usa uma ferramenta de observabilidade externa para isso.',
  });
  const r = rejeicoes.run(dir, ['buscar', '--pedido', 'painel de controle do usuario']);
  assert.strictEqual(r.result.achados.length, 0);
});

t('buscar: pedido que contem todos os tokens significativos do titulo casa', () => {
  const dir = mkProjeto();
  escreverRejeicaoAMao(dir, {
    conceito: 'painel-de-metricas-em-tempo-real',
    titulo: 'Painel de metricas em tempo real',
    aliases: ['dashboard ao vivo'],
    registradoEm: '2026-07-25',
    motivo: 'A equipe ja usa uma ferramenta de observabilidade externa para isso.',
  });
  const r = rejeicoes.run(dir, ['buscar', '--pedido', 'quero ver o painel de metricas em tempo real de novo']);
  assert.strictEqual(r.result.achados.length, 1);
  assert.strictEqual(r.result.achados[0].conceito, 'painel-de-metricas-em-tempo-real');
  assert.strictEqual(r.result.achados[0].pontuacao, 4);
});

t('buscar: apelido de duas palavras casa em ordem trocada', () => {
  const dir = mkProjeto();
  escreverRejeicaoAMao(dir, {
    conceito: 'painel-de-metricas-em-tempo-real',
    titulo: 'Painel de metricas em tempo real',
    aliases: ['dashboard ao vivo'],
    registradoEm: '2026-07-25',
    motivo: 'A equipe ja usa uma ferramenta de observabilidade externa para isso.',
  });
  const r = rejeicoes.buscar(dir, { pedido: 'quero um vivo dashboard para acompanhar tudo', limite: 3 });
  assert.strictEqual(r.achados.length, 1);
  assert.strictEqual(r.achados[0].chave_casada, 'dashboard ao vivo');
});

t('buscar: forma contigua de apelido de uma palavra casa', () => {
  const dir = mkProjeto();
  escreverRejeicaoAMao(dir, {
    conceito: 'painel-de-metricas-em-tempo-real',
    titulo: 'Painel de metricas em tempo real',
    aliases: ['metricas'],
    registradoEm: '2026-07-25',
    motivo: 'A equipe ja usa uma ferramenta de observabilidade externa para isso.',
  });
  const r = rejeicoes.buscar(dir, { pedido: 'as metricas de hoje ja chegaram', limite: 3 });
  assert.strictEqual(r.achados.length, 1);
  assert.strictEqual(r.achados[0].chave_casada, 'metricas');
});

t('buscar: resultado ordenado por pontuacao decrescente e cortado no limite', () => {
  const dir = mkProjeto();
  escreverRejeicaoAMao(dir, {
    conceito: 'painel-de-metricas-em-tempo-real',
    titulo: 'Painel de metricas em tempo real',
    aliases: [],
    registradoEm: '2026-07-25',
    motivo: 'Motivo qualquer aqui.',
  });
  escreverRejeicaoAMao(dir, {
    conceito: 'painel-de-controle-do-usuario',
    titulo: 'Painel de controle do usuario',
    aliases: [],
    registradoEm: '2026-07-24',
    motivo: 'Outro motivo qualquer aqui.',
  });
  const r = rejeicoes.buscar(dir, {
    pedido: 'quero o painel de controle do usuario e tambem o painel de metricas em tempo real',
    limite: 1,
  });
  assert.strictEqual(r.achados.length, 1);
});

// =====================================================================
// Pergunta sugerida (tarefa 5)
// =====================================================================

t('pergunta: traz as tres partes, semelhanca, motivo original e recomendacao com pergunta', () => {
  const dir = mkProjeto();
  escreverRejeicaoAMao(dir, {
    conceito: 'chat-ao-vivo-com-humano',
    titulo: 'Chat ao vivo com atendente humano',
    aliases: [],
    registradoEm: '2026-07-10',
    motivo: 'O produto e self-service por decisao de custo operacional.',
  });
  const r = rejeicoes.buscar(dir, { pedido: 'quero um chat ao vivo com atendente humano', limite: 3 });
  assert.strictEqual(r.achados.length, 1);
  const pergunta = r.achados[0].pergunta;
  assert.match(pergunta, /Chat ao vivo com atendente humano/);
  assert.match(pergunta, /2026-07-10/);
  assert.match(pergunta, /self-service por decisao de custo operacional/);
  assert.match(pergunta, /Recomendo manter a recusa/);
  assert.match(pergunta, /Mantemos a recusa ou revisamos/);
});

t('pergunta: achado com gatilho de reabertura declarado traz o gatilho no texto', () => {
  const dir = mkProjeto();
  escreverRejeicaoAMao(dir, {
    conceito: 'exportar-para-excel',
    titulo: 'Exportar relatorio para Excel',
    aliases: [],
    registradoEm: '2026-06-01',
    motivo: 'O publico do produto usa apenas visualizacao web.',
    gatilho: 'Se o cliente enterprise pedir integracao contabil formalmente, revisitar.',
  });
  const r = rejeicoes.buscar(dir, { pedido: 'quero exportar para excel', limite: 3 });
  assert.strictEqual(r.achados.length, 1);
  assert.match(r.achados[0].pergunta, /integracao contabil formalmente/);
});

// =====================================================================
// Roteamento do espaco memoria (via binario real)
// =====================================================================

t('roteamento: memoria fora-de-escopo listar (base ausente) via CLI sai com codigo 0', () => {
  const dir = mkProjeto();
  const r = runCli(['memoria', 'fora-de-escopo', 'listar'], dir);
  assert.strictEqual(r.status, 0);
  const parsed = JSON.parse(r.stdout);
  assert.strictEqual(parsed.base_existe, false);
});

// =====================================================================
// Linha de comando real (tarefa 6)
// =====================================================================

t('linha de comando: registrar recusado (marca de implementado) sai com codigo 1', () => {
  const dir = mkProjeto();
  const r = runCli([
    'memoria', 'fora-de-escopo', 'registrar',
    '--conceito', 'busca global',
    '--titulo', 'Busca global no topo',
    '--motivo', 'Isso ja existe na barra lateral do produto.',
  ], dir);
  assert.strictEqual(r.status, 1);
  assert.ok(!fs.existsSync(dirForaDeEscopo(dir)));
});

t('linha de comando: registrar aprovado sai com codigo 0 e grava o arquivo', () => {
  const dir = mkProjeto();
  const r = runCli([
    'memoria', 'fora-de-escopo', 'registrar',
    '--conceito', 'modo offline',
    '--titulo', 'Modo offline completo',
    '--motivo', 'O produto depende de sincronizacao em tempo real com o servidor central por contrato de dados.',
    '--alias', 'funcionar sem internet',
  ], dir);
  assert.strictEqual(r.status, 0);
  const parsed = JSON.parse(r.stdout);
  assert.strictEqual(parsed.conceito, 'modo-offline');
  assert.ok(fs.existsSync(path.join(dir, parsed.caminho)));
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
