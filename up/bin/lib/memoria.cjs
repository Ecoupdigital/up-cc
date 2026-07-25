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
  return path.join(dirPlano(cwd), 'GLOSSARY.md');
}

/** Unica funcao do modulo autorizada a criar diretorio. So chamada apos a regra de admissao passar. */
function garantirDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
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
  lerFlag,
  lerFlags,
  contarPalavras,
  run,
};
