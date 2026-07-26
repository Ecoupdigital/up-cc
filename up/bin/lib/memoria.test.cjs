/**
 * memoria.test.cjs: testes red-green do roteador do espaco de memoria e, principalmente, do
 * lock de diretorio entre processos (comLockDiretorio).
 * Roda: node up/bin/lib/memoria.test.cjs
 * Sem framework. Cada caso monta um diretorio temporario proprio (diretorio temp do sistema);
 * o SO limpa o /tmp, nao ha estado compartilhado entre casos.
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const memoria = require('./memoria.cjs');

function mkDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'up-mem-lock-'));
}

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log('  ok  -', name); pass++; }
  catch (e) { console.error('  FAIL -', name, '\n     ', e.message); fail++; }
}

// =====================================================================
// Lock orfao (DEB-2, correcao final): comLockDiretorio esperava 400 tentativas e desistia,
// sem nunca considerar que o dono do lock pudesse ter morrido no meio da secao critica. Se um
// processo morre segurando o lock, toda escrita seguinte falhava para sempre, ate alguem
// apagar o diretorio de lock a mao.
// =====================================================================

t('comLockDiretorio: lock orfao (mtime mais velho que o limiar) e roubado e o trabalho conclui', () => {
  const dir = mkDir();
  const caminhoLock = path.join(dir, '.orfao.lock');
  fs.mkdirSync(caminhoLock); // simula um processo morto que segurava o lock
  const dataAntiga = new Date(Date.now() - 10_000); // 10s atras, bem alem do limiar de teste
  fs.utimesSync(caminhoLock, dataAntiga, dataAntiga);

  const resultado = memoria.comLockDiretorio(
    caminhoLock,
    () => 'trabalho concluido',
    { limiarOrfaoMs: 200, tentativas: 20, esperaMs: 10 }
  );

  assert.strictEqual(resultado, 'trabalho concluido', 'o trabalho deveria ter rodado apos o roubo do lock orfao');
  assert.ok(!fs.existsSync(caminhoLock), 'o lock deveria estar liberado (nao apenas roubado, mas tambem devolvido no finally)');
});

t('comLockDiretorio: lock vivo (mtime recente) continua respeitado, nunca e roubado', () => {
  const dir = mkDir();
  const caminhoLock = path.join(dir, '.vivo.lock');
  fs.mkdirSync(caminhoLock); // mtime = agora, dono "vivo" (nunca libera neste teste)

  assert.throws(
    () => memoria.comLockDiretorio(
      caminhoLock,
      () => 'nunca deveria rodar',
      { limiarOrfaoMs: 5000, tentativas: 5, esperaMs: 10 }
    ),
    /Nao foi possivel obter o lock/
  );
  assert.ok(fs.existsSync(caminhoLock), 'o lock vivo nao deveria ter sido removido nem roubado');
});

t('comLockDiretorio: excecao dentro de fn() ainda libera o lock (comportamento pre-existente preservado)', () => {
  const dir = mkDir();
  const caminhoLock = path.join(dir, '.excecao.lock');
  assert.throws(
    () => memoria.comLockDiretorio(caminhoLock, () => { throw new Error('falha de negocio qualquer'); }),
    /falha de negocio qualquer/
  );
  assert.ok(!fs.existsSync(caminhoLock), 'o lock deveria ter sido liberado mesmo com fn() lancando');
});

t('comLockDiretorio: dois lock orfaos em sequencia (dois donos mortos) sao roubados um apos o outro', () => {
  const dir = mkDir();
  const caminhoLock = path.join(dir, '.orfao-duas-vezes.lock');

  fs.mkdirSync(caminhoLock);
  const antiga1 = new Date(Date.now() - 10_000);
  fs.utimesSync(caminhoLock, antiga1, antiga1);

  const r1 = memoria.comLockDiretorio(caminhoLock, () => {
    // Nao libera sozinho: simula um SEGUNDO processo morrendo dentro da secao critica, sem
    // deixar o finally do wrapper externo liberar (o teste recria o lock a mao logo abaixo).
    return 'primeiro roubo ok';
  }, { limiarOrfaoMs: 200, tentativas: 20, esperaMs: 10 });
  assert.strictEqual(r1, 'primeiro roubo ok');
  assert.ok(!fs.existsSync(caminhoLock), 'liberado normalmente pelo finally apos o primeiro roubo');

  // Segundo dono morre segurando o lock de novo.
  fs.mkdirSync(caminhoLock);
  const antiga2 = new Date(Date.now() - 10_000);
  fs.utimesSync(caminhoLock, antiga2, antiga2);

  const r2 = memoria.comLockDiretorio(caminhoLock, () => 'segundo roubo ok', { limiarOrfaoMs: 200, tentativas: 20, esperaMs: 10 });
  assert.strictEqual(r2, 'segundo roubo ok');
  assert.ok(!fs.existsSync(caminhoLock));
});

// =====================================================================
// Roteamento (existente, cobertura minima para este arquivo novo)
// =====================================================================

t('resolverCaminhoContido: caminho que escaparia do diretorio lanca excecao', () => {
  const dir = mkDir();
  assert.throws(() => memoria.resolverCaminhoContido(dir, '../fora.md'), /fora do diretorio esperado/);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
