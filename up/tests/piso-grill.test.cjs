/**
 * piso-grill.test.cjs: invariante de piso e de propagacao do modo grill (fase 15).
 * Roda: node up/tests/piso-grill.test.cjs
 * Sem framework, sem rede. Resolve a raiz do repositorio a partir de __dirname (up/tests -> up ->
 * raiz), porque este arquivo tambem roda copiado para uma arvore de trabalho temporaria na
 * contraprova vermelha (ver 004-PLAN.md, tarefa 1), e precisa medir a arvore onde esta, nao o
 * diretorio corrente.
 *
 * Contrato: falha quando qualquer superficie viva volta a ensinar o piso antigo ("pequena = 1
 * pergunta"), quando o motor perde uma das tres portas de saida, quando uma superficie deixa de
 * apontar para o motor, ou quando travessao/meia-risca aparece nos arquivos que nasceram limpos
 * nesta fase.
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

// Duas ordens da mesma frase, sem diferenciar maiusculas. '.' nao cruza quebra de linha em JS sem
// a flag 's', igual ao comportamento padrao do grep usado nos planos 002 e 003 desta fase.
const REGEX_PISO_ANTIGO = /pequena.{0,60}1 pergunta|1 pergunta.{0,60}pequena/i;
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

// Caso 1: o motor existe e casa com os tres titulos de porta.
t('motor existe e tem as tres portas de saida', () => {
  let conteudo;
  try {
    conteudo = ler(MOTOR);
  } catch (e) {
    throw new Error(`motor ausente em "${MOTOR}": ${e.message}`);
  }
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

console.log(`\npiso-grill: ${pass} passou, ${fail} falhou`);
if (fail > 0) {
  process.exitCode = 1;
}
