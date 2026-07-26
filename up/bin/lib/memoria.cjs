/**
 * memoria.cjs: roteador do espaco de memoria do projeto (Fase 14).
 *
 * Comando de primeiro nivel `memoria`, com quatro submodulos declarados de uma vez
 * (reserva de nome, ainda que so o de decisao exista neste plano):
 *
 *   memoria decisao <acao>          -> ./memoria-decisao.cjs   (plano 002, este)
 *   memoria fora-de-escopo <acao>   -> ./memoria-rejeicoes.cjs (plano 003)
 *   memoria glossario <acao>        -> ./memoria-glossario.cjs (plano 004)
 *   memoria termo <acao>            -> ./memoria-termo.cjs     (plano 005)
 *
 * Todo submodulo exporta run(cwd, args) e devolve { result, resumo }; quem imprime
 * e este roteador. Falha de regra do submodulo e uma excecao com mensagem em
 * portugues; este roteador a converte em erro fatal (saida 1), sem rastro de pilha.
 */

const fs = require('fs');
const path = require('path');
const { output, error } = require('./core.cjs');

const SUBMODULOS = {
  'decisao': './memoria-decisao.cjs',
  'fora-de-escopo': './memoria-rejeicoes.cjs',
  'glossario': './memoria-glossario.cjs',
  'termo': './memoria-termo.cjs',
};

const NOMES_VALIDOS = Object.keys(SUBMODULOS);

// --- Caminhos (nenhuma destas funcoes cria nada) ---

function dirPlano(cwd) {
  return path.join(cwd, '.plano');
}

function dirDecisoes(cwd) {
  return path.join(dirPlano(cwd), 'decisoes');
}

function dirForaDeEscopo(cwd) {
  return path.join(dirPlano(cwd), 'fora-de-escopo');
}

function arquivoGlossarioProjeto(cwd) {
  // Nome de arquivo fixo (nunca vem de flag do usuario), mas passa pelo mesmo portao de
  // contencao dos demais caminhos do espaco de memoria, como defesa em profundidade (RV-001).
  return resolverCaminhoContido(dirPlano(cwd), 'GLOSSARY.md');
}

/** Unica funcao do modulo autorizada a criar diretorio. So chamada apos a regra de admissao passar. */
function garantirDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Resolve nomeArquivo dentro de dir e garante que o caminho final continua dentro do
 * diretorio esperado. Ultimo portao antes de qualquer escrita em disco (RV-001): mesmo que o
 * nome do arquivo ja tenha passado por slugificacao rio acima, esta funcao lanca excecao se o
 * caminho resolvido escapar do diretorio, em vez de deixar `path.join` normalizar um `..` pra
 * fora e sobrescrever arquivo alheio em silencio.
 */
function resolverCaminhoContido(dir, nomeArquivo) {
  const dirResolvido = path.resolve(dir);
  const caminho = path.resolve(dirResolvido, nomeArquivo);
  const prefixo = dirResolvido.endsWith(path.sep) ? dirResolvido : dirResolvido + path.sep;
  if (caminho !== dirResolvido && !caminho.startsWith(prefixo)) {
    throw new Error(`Caminho resolvido fora do diretorio esperado: "${nomeArquivo}" escaparia de "${dirResolvido}".`);
  }
  return caminho;
}

// =====================================================================
// Lock de diretorio (RV-003): serializa leitura-modificacao-escrita entre processos
// =====================================================================
//
// O UP roda planos da mesma onda em paralelo por design: varios executores podem chamar
// `memoria decisao criar` ou `memoria termo registrar` ao mesmo tempo, cada um num processo
// Node separado. fs.mkdirSync e atomico no sistema operacional (so um processo consegue
// criar um diretorio de um dado nome; os demais recebem EEXIST), o que da um mutex real
// entre processos sem dependencia externa.

const LOCK_TENTATIVAS_PADRAO = 400;
const LOCK_ESPERA_MS_PADRAO = 15;

/** Pausa sincrona real (bloqueia a thread por ms milissegundos) via Atomics.wait sobre um
 * SharedArrayBuffer descartavel. Usada so para o espera-ocupada do lock: sem uma pausa
 * sincrona verdadeira, o loop de tentativas giraria sem ceder CPU nenhuma. */
function esperarSincrono(ms) {
  const ia = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(ia, 0, 0, ms);
}

/**
 * Executa fn() com um lock exclusivo no caminho caminhoLock, obtido por fs.mkdirSync (que
 * falha com EEXIST se o diretorio ja existe, atomicamente no SO). Espera ocupada com pausa
 * curta entre tentativas ate obter o lock ou esgotar as tentativas. Libera o lock no
 * finally, mesmo se fn() lancar, para uma excecao de regra de negocio no meio da secao
 * critica nao deixar o proximo processo travado pra sempre.
 */
function comLockDiretorio(caminhoLock, fn, opts) {
  const tentativas = (opts && opts.tentativas) || LOCK_TENTATIVAS_PADRAO;
  const esperaMs = (opts && opts.esperaMs) || LOCK_ESPERA_MS_PADRAO;

  fs.mkdirSync(path.dirname(caminhoLock), { recursive: true });

  let obtido = false;
  for (let tentativa = 0; tentativa < tentativas && !obtido; tentativa++) {
    try {
      fs.mkdirSync(caminhoLock);
      obtido = true;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      esperarSincrono(esperaMs);
    }
  }
  if (!obtido) {
    throw new Error(`Nao foi possivel obter o lock de escrita em "${caminhoLock}" apos ${tentativas} tentativas (concorrencia excessiva ou lock orfao).`);
  }

  try {
    return fn();
  } finally {
    fs.rmdirSync(caminhoLock);
  }
}

// --- Flags ---

/** Le --nome valor ou --nome=valor. Espacos das pontas removidos. Nulo se ausente ou vazio. */
function lerFlag(args, nome) {
  const prefixoIgual = `--${nome}=`;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === `--${nome}`) {
      const valor = args[i + 1];
      if (valor === undefined || valor.startsWith('--')) return null;
      const limpo = valor.trim();
      return limpo === '' ? null : limpo;
    }
    if (args[i].startsWith(prefixoIgual)) {
      const limpo = args[i].slice(prefixoIgual.length).trim();
      return limpo === '' ? null : limpo;
    }
  }
  return null;
}

/** Mesma leitura de lerFlag, para flag repetivel. Devolve lista na ordem de aparicao. */
function lerFlags(args, nome) {
  const prefixoIgual = `--${nome}=`;
  const valores = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === `--${nome}`) {
      const valor = args[i + 1];
      if (valor !== undefined && !valor.startsWith('--')) {
        const limpo = valor.trim();
        if (limpo !== '') valores.push(limpo);
      }
    } else if (args[i].startsWith(prefixoIgual)) {
      const limpo = args[i].slice(prefixoIgual.length).trim();
      if (limpo !== '') valores.push(limpo);
    }
  }
  return valores;
}

/** Conta sequencias separadas por espaco em branco. Zero para nulo ou vazio. */
function contarPalavras(texto) {
  if (!texto) return 0;
  return String(texto).trim().split(/\s+/).filter(Boolean).length;
}

// --- Roteamento ---

function run(cwd, args, raw) {
  const nome = args[0];

  if (!nome || !SUBMODULOS[nome]) {
    error(`Submodulo de memoria desconhecido: "${nome || ''}". Disponiveis: ${NOMES_VALIDOS.join(', ')}.`);
    return;
  }

  let submodulo;
  try {
    submodulo = require(SUBMODULOS[nome]);
  } catch (e) {
    error(`O submodulo "${nome}" ainda nao esta instalado neste pacote.`);
    return;
  }

  let saida;
  try {
    saida = submodulo.run(cwd, args.slice(1));
  } catch (e) {
    error(e.message);
    return;
  }

  output(saida.result, raw, saida.resumo);
}

module.exports = {
  SUBMODULOS,
  dirPlano,
  dirDecisoes,
  dirForaDeEscopo,
  arquivoGlossarioProjeto,
  garantirDir,
  resolverCaminhoContido,
  comLockDiretorio,
  lerFlag,
  lerFlags,
  contarPalavras,
  run,
};
