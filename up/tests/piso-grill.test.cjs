/**
 * piso-grill.test.cjs: invariante de piso e de propagacao do modo grill (fase 15 + heranca fase 16).
 * Roda: node up/tests/piso-grill.test.cjs
 * Sem framework, sem rede. Resolve a raiz do repositorio a partir de __dirname (up/tests -> up ->
 * raiz), porque este arquivo tambem roda copiado para uma arvore de trabalho temporaria na
 * contraprova vermelha, e precisa medir a arvore onde esta, nao o diretorio corrente.
 *
 * Contrato: falha quando qualquer superficie viva volta a ensinar o piso antigo ("pequena = 1
 * pergunta" ou forma por extenso "Pequena: uma pergunta"), quando o motor perde uma das tres
 * portas de saida, quando a tabela de sinais de prosa some, quando GRILL-04/GRILL-05 deixam de
 * estar escritos no motor, quando uma superficie deixa de apontar para o motor, ou quando
 * travessao/meia-risca aparece nos arquivos que nasceram limpos nesta fase.
 *
 * Codigos de saida:
 *   0 = todos os casos de conteudo passaram
 *   1 = pelo menos um caso de conteudo falhou (FAIL)
 *   2 = erro de execucao: arquivo critico ausente (ENOENT). Nao se confunde com FAIL de conteudo.
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// up/tests -> up -> raiz do repo (dois niveis acima de __dirname).
const ROOT = path.resolve(__dirname, '..', '..');

const MOTOR = 'up/skills/up-brainstorm/grill.md';
const SKILL_BRAINSTORM = 'up/skills/up-brainstorm/SKILL.md';
const SKILL_BOOTSTRAP = 'up/skills/usando-up/SKILL.md';
const WORKFLOW_UP = 'up/workflows/up.md';
const COMMAND_UP = 'up/commands/up.md';
const INSTALLER = 'up/bin/install.js';
const README = 'up/README.md';
const GUIA_DE_USO = 'docs/GUIA-DE-USO.md';

// Sete superficies vivas que ensinavam o piso antigo (pequena = 1 pergunta). O 004-PLAN.md nomeia
// seis (skill de brainstorm, skill de bootstrap, workflow da porta unica, comando da porta unica,
// instalador, README). A setima entra aqui por decisao deste plano (004), documentada no SUMMARY
// como desvio Regra 2: o plano 003 (varredura de fechamento, tarefa 7) achou docs/GUIA-DE-USO.md
// fora do inventario original do CONTEXT.md desta fase, citado diretamente por up/README.md como
// "detalhes completos" e por isso uma superficie tao viva quanto as outras seis. Excluir essa
// superficie do invariante deixaria um ponto cego: ela poderia voltar a ensinar o piso antigo sem
// que este teste percebesse. O changelog fica de fora por ser registro historico (mesmo criterio
// que os planos 003 e 004 ja aplicaram).
const SUPERFICIES_VIVAS = [
  SKILL_BRAINSTORM,
  SKILL_BOOTSTRAP,
  WORKFLOW_UP,
  COMMAND_UP,
  INSTALLER,
  README,
  GUIA_DE_USO,
];

// Destes, so quatro nasceram limpos de travessao nesta fase. Os outros tres (workflow, comando,
// instalador) ja tinham sedimento de travessao antes da fase, e limpa-lo esta fora de escopo
// (ver CONTEXT.md, "Fora de escopo da fase inteira").
const ARQUIVOS_LIMPOS = [MOTOR, SKILL_BRAINSTORM, SKILL_BOOTSTRAP, README];

// Arquivos criticos: ausencia e erro de execucao (exit 2), nao FAIL de conteudo.
const ARQUIVOS_CRITICOS = [...new Set([MOTOR, ...SUPERFICIES_VIVAS])];

// Item herdado B (revisao fase 15): forma por extenso e exit 2
// Formas numericas E por extenso do piso antigo. A forma numerica sozinha deixava passar
// "Pequena: uma pergunta" (item herdado B da revisao da fase 15).
const REGEX_PISO_ANTIGO = new RegExp(
  [
    // numerico: "1 pergunta" perto de "pequena"
    'pequena.{0,80}1\\s*pergunta',
    '1\\s*pergunta.{0,80}pequena',
    // por extenso: "uma pergunta" / "uma so pergunta" perto de "pequena"
    'pequena.{0,80}uma\\s+(s[oó]\\s+)?pergunta',
    'uma\\s+(s[oó]\\s+)?pergunta.{0,80}pequena',
  ].join('|'),
  'i'
);
const REGEX_TRAVESSAO = /[—–]/;

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

function ler(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// --- Preflight: ausencia de arquivo e erro de execucao distinto (exit 2) ---
// Item herdado B: nao misturar ENOENT com FAIL de deteccao de conteudo.
const ausentes = [];
for (const rel of ARQUIVOS_CRITICOS) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    ausentes.push(rel);
  }
}
if (ausentes.length > 0) {
  console.error('ERRO DE EXECUCAO: arquivo critico ausente (nao e FAIL de conteudo):');
  for (const a of ausentes) console.error('  -', a);
  console.error('Codigo de saida 2 = ambiente incompleto, nao regressao de doutrina.');
  process.exit(2);
}

// Caso 1: o motor existe e casa com os tres titulos de porta.
t('motor existe e tem as tres portas de saida', () => {
  const conteudo = ler(MOTOR);
  const minusculo = conteudo.toLowerCase();
  for (const porta of ['palavra de parada', 'checkpoint', 'auto-convergência']) {
    assert.ok(
      minusculo.includes(porta.toLowerCase()),
      `"${MOTOR}" nao contem a porta "${porta}"`
    );
  }
});

// Caso 2: as cinco palavras de parada literais do dono aparecem no motor.
t('palavras de parada literais aparecem no motor', () => {
  const conteudo = ler(MOTOR).toLowerCase();
  for (const palavra of ['chega', 'para', 'fecha', 'basta', 'suficiente']) {
    assert.ok(
      conteudo.includes(palavra),
      `"${MOTOR}" nao contem a palavra de parada "${palavra}"`
    );
  }
});

// Caso 3: a tabela de frases proibidas esta declarada, detectada por pelo menos duas frases literais.
t('frases proibidas declaradas no motor', () => {
  const conteudo = ler(MOTOR);
  const candidatas = [
    'Tem certeza',
    'Posso fechar',
    'Quer que eu resuma',
    'Só mais uma pergunta',
  ];
  const achadas = candidatas.filter((frase) => conteudo.includes(frase));
  assert.ok(
    achadas.length >= 2,
    `"${MOTOR}" precisa conter pelo menos 2 das frases proibidas ${JSON.stringify(candidatas)}, achou ${JSON.stringify(achadas)}`
  );
});

// Caso 4: a skill de brainstorm cita o nome do arquivo do motor.
t('skill de brainstorm aponta para o motor', () => {
  const conteudo = ler(SKILL_BRAINSTORM);
  assert.ok(
    conteudo.includes('grill.md'),
    `"${SKILL_BRAINSTORM}" nao cita "grill.md" pelo nome`
  );
});

// Caso 5: piso antigo extinto nas sete superficies vivas (varredura global da fase).
t('piso antigo extinto em todas as superficies vivas', () => {
  for (const arquivo of SUPERFICIES_VIVAS) {
    const conteudo = ler(arquivo);
    const achado = conteudo.match(REGEX_PISO_ANTIGO);
    assert.ok(
      !achado,
      `"${arquivo}" ainda ensina o piso antigo: encontrado "${achado ? achado[0] : ''}"`
    );
  }
});

// Caso 6: as mesmas sete superficies citam o grill ao menos uma vez.
t('propagacao: todas as superficies citam o grill', () => {
  for (const arquivo of SUPERFICIES_VIVAS) {
    const conteudo = ler(arquivo);
    assert.ok(
      /grill/i.test(conteudo),
      `"${arquivo}" nao cita "grill" em lugar nenhum`
    );
  }
});

// Caso 7: o gate duro e o estado terminal continuam de pe, e o motor cita que o gate continua.
t('gate preservado na skill e citado pelo motor', () => {
  const skill = ler(SKILL_BRAINSTORM);
  assert.ok(skill.includes('<HARD-GATE>'), `"${SKILL_BRAINSTORM}" perdeu a tag <HARD-GATE>`);
  assert.ok(
    /estado terminal/i.test(skill),
    `"${SKILL_BRAINSTORM}" perdeu a secao de estado terminal`
  );
  const motor = ler(MOTOR);
  assert.ok(
    /gate continua/i.test(motor),
    `"${MOTOR}" nao declara que o gate continua`
  );
});

// Caso 8: sem travessao nem meia-risca nos arquivos que nasceram limpos nesta fase.
t('sem travessao nos arquivos que nasceram limpos', () => {
  for (const arquivo of ARQUIVOS_LIMPOS) {
    const conteudo = ler(arquivo);
    assert.ok(
      !REGEX_TRAVESSAO.test(conteudo),
      `"${arquivo}" contem travessao ou meia-risca (arquivo deveria ter nascido limpo nesta fase)`
    );
  }
});

// Caso 9 (item herdado A / GRILL-02 via tabela): tabela de sinais de prosa presente e nao vazia.
// Apagar essa tabela mantinha a suite inteira verde antes desta assercao.
t('tabela de sinais de prosa presente e nao vazia', () => {
  const conteudo = ler(MOTOR);
  assert.ok(
    /Sinal presente na descri/i.test(conteudo),
    `"${MOTOR}" perdeu o cabecalho da tabela de sinais de prosa`
  );
  assert.ok(
    /Resultado da heur/i.test(conteudo),
    `"${MOTOR}" perdeu a tabela de resultado da heuristica`
  );
  // Pelo menos tres linhas de sinal (conteudo da tabela, nao so o cabecalho)
  const linhasSinal = conteudo
    .split('\n')
    .filter((l) => /^\|/.test(l.trim()) && /Sobe pra grill|Fica em Trivial|Grill entra/i.test(l));
  assert.ok(
    linhasSinal.length >= 3,
    `"${MOTOR}" tem tabela de sinais esvaziada: so ${linhasSinal.length} linhas de efeito; precisa >= 3`
  );
});

// Caso 10 (item herdado A / GRILL-04): recomendacao e fato contra decisao no motor.
t('GRILL-04: recomendacao e fato contra decisao no motor', () => {
  const conteudo = ler(MOTOR);
  assert.ok(
    /Recomendo:/.test(conteudo),
    `"${MOTOR}" nao declara o rotulo Recomendo: (GRILL-04)`
  );
  assert.ok(
    /fato contra decis/i.test(conteudo),
    `"${MOTOR}" nao cita a regra de fato contra decisao (GRILL-04)`
  );
  assert.ok(
    /Pergunta:/.test(conteudo),
    `"${MOTOR}" nao declara o rotulo Pergunta: (GRILL-04)`
  );
});

// Caso 11 (item herdado A / GRILL-05): ordem por dependencia e linha Depende de.
t('GRILL-05: ordem por dependencia e linha Depende de', () => {
  const conteudo = ler(MOTOR);
  assert.ok(
    /Ordem por depend/i.test(conteudo) || /rvore de decis/i.test(conteudo),
    `"${MOTOR}" perdeu a secao de ordem por dependencia (GRILL-05)`
  );
  assert.ok(
    /Depende de:/.test(conteudo),
    `"${MOTOR}" nao declara o formato "Depende de:" (GRILL-05)`
  );
  assert.ok(
    /\[Q\d\]/.test(conteudo) || /Q\d/.test(conteudo),
    `"${MOTOR}" nao numera perguntas (GRILL-05, verificavel na transcricacao)`
  );
});

// Caso 12 (item herdado B): a deteccao de piso antigo casa formas por extenso.
// Fixture embutida: se o regex regredir para so "1 pergunta", este caso fica vermelho.
t('deteccao de piso antigo cobre forma por extenso', () => {
  const fixtureExtenso = 'Pequena: uma pergunta basta para fechar o tier';
  const fixtureNumerico = 'pequena = 1 pergunta e pronto';
  assert.ok(
    REGEX_PISO_ANTIGO.test(fixtureExtenso),
    'REGEX_PISO_ANTIGO deveria casar "Pequena: uma pergunta" (forma por extenso)'
  );
  assert.ok(
    REGEX_PISO_ANTIGO.test(fixtureNumerico),
    'REGEX_PISO_ANTIGO deveria continuar casando a forma numerica'
  );
  // Controle negativo: prosa legítima do motor nao deve casar
  assert.ok(
    !REGEX_PISO_ANTIGO.test('Pequena entra em grill automaticamente'),
    'falso positivo: "Pequena entra em grill" nao e piso antigo'
  );
});

console.log(`\npiso-grill: ${pass} passou, ${fail} falhou`);
if (fail > 0) {
  process.exitCode = 1;
}
