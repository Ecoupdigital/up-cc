/**
 * memoria-glossario.cjs: leitor do glossario interno e regua de redefinicao (Fase 14,
 * submodulo `glossario` do espaco de comando `memoria`).
 *
 * Leitura pura. Nenhuma funcao deste modulo escreve arquivo nem cria diretorio: o glossario
 * interno (`up/references/glossario-up.md`) e mantido pelo plano 001, este modulo so le e conta.
 *
 * Duas acoes (implementadas nas proximas tarefas deste plano):
 *
 *   check    -> conta redefinicao concorrente dos termos do glossario nas superficies do
 *               produto, pelas quatro formas estruturais fechadas declaradas no proprio
 *               glossario, com os tres cortes (tamanho, bloco de codigo, citacao).
 *   citacao  -> mede a cobertura da linha de citacao do glossario nos agentes e workflows.
 */

const fs = require('fs');
const path = require('path');
const { toPosixPath } = require('./core.cjs');

const NOME_ARQUIVO_GLOSSARIO = 'glossario-up.md';
const PASTAS_PADRAO = ['agents', 'workflows', 'skills', 'commands', 'references', 'templates'];

// =====================================================================
// Resolucao de caminhos (nenhuma escrita acontece aqui)
// =====================================================================

/** Sobe a partir de dirInicial procurando relPath. Devolve o caminho absoluto ou nulo. */
function resolverSubindo(dirInicial, relPath) {
  let dir = dirInicial;
  for (let i = 0; i < 8; i++) {
    const candidato = path.join(dir, relPath);
    if (fs.existsSync(candidato)) return candidato;
    const pai = path.dirname(dir);
    if (pai === dir) break;
    dir = pai;
  }
  return null;
}

/** Caminho do glossario interno real, subindo do diretorio do modulo ate a raiz do pacote. */
function caminhoGlossario(override) {
  if (override) return override;
  const encontrado = resolverSubindo(__dirname, path.join('references', NOME_ARQUIVO_GLOSSARIO));
  if (!encontrado) {
    throw new Error(`Glossario interno nao encontrado subindo a partir de ${__dirname}.`);
  }
  return encontrado;
}

/** Raiz do pacote (o diretorio que contem references/glossario-up.md). */
function raizPacote(override) {
  if (override) return override;
  return path.dirname(path.dirname(caminhoGlossario()));
}

// =====================================================================
// Leitura do glossario
// =====================================================================

/**
 * Le a secao `## Termos` do glossario e devolve, por verbete: termo canonico (cabecalho de
 * nivel 3), lista de formas e lista de sinonimos proibidos (Evitar). Verbete sem as tres
 * linhas obrigatorias (Definicao, Formas, Evitar) lanca excecao citando o termo incompleto.
 */
function lerTermos(caminho) {
  const conteudo = fs.readFileSync(caminho, 'utf-8');
  const marcador = '## Termos';
  const indiceMarcador = conteudo.indexOf(marcador);
  const secao = indiceMarcador === -1 ? conteudo : conteudo.slice(indiceMarcador + marcador.length);

  const blocos = secao.split(/\n(?=###\s)/).filter((bloco) => /^###\s/.test(bloco.trim()));

  const termos = [];
  for (const bloco of blocos) {
    const cabecalhoMatch = bloco.match(/^###\s+(.+?)\s*$/m);
    const termo = cabecalhoMatch ? cabecalhoMatch[1].trim() : null;

    const temDefinicao = /^\*\*Defini[cç][aã]o:\*\*\s*\S/m.test(bloco);
    const formasMatch = bloco.match(/^\*\*Formas:\*\*\s*(.+)$/m);
    const evitarMatch = bloco.match(/^\*\*Evitar:\*\*\s*(.+)$/m);

    if (!termo || !temDefinicao || !formasMatch || !evitarMatch) {
      throw new Error(
        `Glossario invalido: verbete "${termo || '(sem cabecalho)'}" esta sem uma das tres linhas obrigatorias (Definicao, Formas, Evitar).`
      );
    }

    const formas = formasMatch[1].split(',').map((f) => f.trim()).filter(Boolean);
    const evitar = evitarMatch[1].split(',').map((e) => e.trim()).filter(Boolean);

    if (formas.length === 0 || evitar.length === 0) {
      throw new Error(`Glossario invalido: verbete "${termo}" tem linha Formas ou Evitar vazia.`);
    }

    termos.push({ termo, formas, evitar });
  }

  return termos;
}

// =====================================================================
// Varredura de arquivos (nenhuma escrita acontece aqui)
// =====================================================================

function listarMarkdownRecursivo(dir) {
  let resultados = [];
  let entradas;
  try {
    entradas = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return resultados;
  }
  const ordenadas = entradas.slice().sort((a, b) => a.name.localeCompare(b.name));
  for (const entrada of ordenadas) {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      resultados = resultados.concat(listarMarkdownRecursivo(caminho));
    } else if (entrada.isFile() && entrada.name.endsWith('.md')) {
      resultados.push(caminho);
    }
  }
  return resultados;
}

/**
 * Lista os arquivos de markdown das pastas varridas, a partir da raiz do pacote, excluindo o
 * proprio glossario (identificado pelo nome de arquivo, nao pelo caminho, para funcionar
 * tambem contra uma arvore de fixtures).
 */
function arquivosVarridos(raizOverride, pastasOverride) {
  const raiz = raizPacote(raizOverride);
  const pastas = pastasOverride && pastasOverride.length ? pastasOverride : PASTAS_PADRAO;
  let arquivos = [];
  for (const pasta of pastas) {
    arquivos = arquivos.concat(listarMarkdownRecursivo(path.join(raiz, pasta)));
  }
  return arquivos.filter((a) => path.basename(a) !== NOME_ARQUIVO_GLOSSARIO).sort();
}

// =====================================================================
// Linhas uteis: marca o que esta dentro de bloco de codigo cercado por crase tripla
// =====================================================================

function linhasUteis(conteudo) {
  const brutas = conteudo.split('\n');
  let dentroBloco = false;
  return brutas.map((texto, indice) => {
    const ehFence = /^\s*```/.test(texto);
    const marcada = dentroBloco;
    if (ehFence) dentroBloco = !dentroBloco;
    return { numero: indice + 1, texto, dentroBloco: marcada };
  });
}

module.exports = {
  NOME_ARQUIVO_GLOSSARIO,
  PASTAS_PADRAO,
  caminhoGlossario,
  raizPacote,
  lerTermos,
  arquivosVarridos,
  linhasUteis,
  toPosixPath,
};
