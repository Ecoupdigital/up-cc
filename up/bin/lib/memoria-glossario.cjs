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
const { toPosixPath, escapeRegex } = require('./core.cjs');
const { lerFlag, contarPalavras } = require('./memoria.cjs');

const NOME_ARQUIVO_GLOSSARIO = 'glossario-up.md';
const PASTAS_PADRAO = ['agents', 'workflows', 'skills', 'commands', 'references', 'templates'];
const PASTAS_CITACAO = ['agents', 'workflows'];

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

// =====================================================================
// Helpers de tabela (usados pela Forma 3)
// =====================================================================

function ehLinhaTabela(texto) {
  return /^\s*\|.+\|\s*$/.test(texto);
}

function ehLinhaSeparadorTabela(texto) {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(texto) && /-/.test(texto);
}

function celulasDaLinha(texto) {
  let t = texto.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|').map((c) => c.trim());
}

// =====================================================================
// Os tres cortes (aplicados sobre as quatro formas)
// =====================================================================

function passaCorteTamanho(prosa) {
  return contarPalavras(prosa) >= 8;
}

function passaCorteCitacao(...textos) {
  return !textos.some((t) => t && t.includes(NOME_ARQUIVO_GLOSSARIO));
}

// =====================================================================
// As quatro formas estruturais fechadas declaradas no glossario
// =====================================================================

/** Forma 1: rotulo em negrito com o termo (dois pontos dentro ou fora do fechamento), + prosa. */
function casarForma1(texto, variante) {
  const escapada = escapeRegex(variante);
  const dentro = new RegExp(`^\\s*\\*\\*\\s*${escapada}\\s*:\\s*\\*\\*\\s*(.*)$`, 'i');
  const fora = new RegExp(`^\\s*\\*\\*\\s*${escapada}\\s*\\*\\*\\s*:\\s*(.*)$`, 'i');
  const m = texto.match(dentro) || texto.match(fora);
  return m ? { prosa: m[1] } : null;
}

/** Forma 2: item de lista cujo rotulo (sem negrito) e o termo, seguido de dois pontos e prosa. */
function casarForma2(texto, variante) {
  const escapada = escapeRegex(variante);
  const re = new RegExp(`^\\s*[-*]\\s+${escapada}\\s*:\\s*(.*)$`, 'i');
  const m = texto.match(re);
  return m ? { prosa: m[1] } : null;
}

/** Forma 3: linha de tabela cuja primeira celula e exatamente o termo (sem negrito, sem espaco). */
function casarForma3(texto, variante) {
  if (!ehLinhaTabela(texto)) return null;
  const celulas = celulasDaLinha(texto);
  if (celulas.length === 0) return null;
  if (celulas[0].toLowerCase() !== variante.toLowerCase()) return null;
  return { prosa: celulas.slice(1).join(' ') };
}

/** Forma 4: cabecalho cujo texto e exatamente o termo, ou exatamente "O que e <termo>". */
function extrairTituloCabecalho(texto) {
  const m = texto.match(/^#{1,6}\s+(.+?)\s*$/);
  return m ? m[1].trim() : null;
}

function casarForma4(titulo, variante) {
  if (titulo.toLowerCase() === variante.toLowerCase()) return true;
  const perguntaRe = new RegExp(`^o que [ée]\\s+${escapeRegex(variante)}$`, 'i');
  return perguntaRe.test(titulo);
}

function primeiroParagrafoAposHeader(linhasBrutas, indiceHeader) {
  // Markdown normal poe linha em branco logo depois de todo cabecalho (RV-004): pula as
  // linhas em branco iniciais antes de comecar a colher o paragrafo, senao a forma 4 nunca
  // dispara contra markdown real, so contra a fixture artificial que colava a prosa direto
  // sob o cabecalho.
  let i = indiceHeader + 1;
  while (i < linhasBrutas.length && linhasBrutas[i].trim() === '') i++;

  const paragrafo = [];
  for (; i < linhasBrutas.length; i++) {
    const t = linhasBrutas[i];
    if (t.trim() === '') break;
    if (/^#{1,6}\s+/.test(t)) break;
    paragrafo.push(t);
  }
  return paragrafo.join(' ');
}

function cortarTrecho(texto) {
  const limpo = (texto || '').trim();
  return limpo.length > 120 ? limpo.slice(0, 120) : limpo;
}

// =====================================================================
// Varredura de um arquivo contra todos os termos
// =====================================================================

function verificarArquivo(caminhoAbsoluto, raiz, termos) {
  const conteudo = fs.readFileSync(caminhoAbsoluto, 'utf-8');
  const linhasBrutas = conteudo.split('\n');
  const info = linhasUteis(conteudo);
  const relativo = toPosixPath(path.relative(raiz, caminhoAbsoluto));
  const achados = [];

  const cabecalhosDeTabela = new Set();
  for (let i = 0; i < linhasBrutas.length - 1; i++) {
    if (!info[i].dentroBloco && ehLinhaTabela(linhasBrutas[i]) && ehLinhaSeparadorTabela(linhasBrutas[i + 1])) {
      cabecalhosDeTabela.add(i);
    }
  }

  for (const termoInfo of termos) {
    for (const variante of termoInfo.formas) {
      for (let i = 0; i < linhasBrutas.length; i++) {
        if (info[i].dentroBloco) continue;
        const texto = linhasBrutas[i];

        const m1 = casarForma1(texto, variante);
        if (m1 && passaCorteTamanho(m1.prosa) && passaCorteCitacao(texto)) {
          achados.push({ caminho: relativo, linha: i + 1, termo: termoInfo.termo, forma: 'forma-1-rotulo-negrito', trecho: cortarTrecho(texto) });
          continue;
        }

        const m2 = casarForma2(texto, variante);
        if (m2 && passaCorteTamanho(m2.prosa) && passaCorteCitacao(texto)) {
          achados.push({ caminho: relativo, linha: i + 1, termo: termoInfo.termo, forma: 'forma-2-item-lista', trecho: cortarTrecho(texto) });
          continue;
        }

        if (!cabecalhosDeTabela.has(i)) {
          const m3 = casarForma3(texto, variante);
          if (m3 && passaCorteTamanho(m3.prosa) && passaCorteCitacao(texto)) {
            achados.push({ caminho: relativo, linha: i + 1, termo: termoInfo.termo, forma: 'forma-3-linha-tabela', trecho: cortarTrecho(texto) });
            continue;
          }
        }

        const titulo = extrairTituloCabecalho(texto);
        if (titulo !== null && casarForma4(titulo, variante)) {
          const paragrafo = primeiroParagrafoAposHeader(linhasBrutas, i);
          if (passaCorteTamanho(paragrafo) && passaCorteCitacao(texto, paragrafo)) {
            achados.push({ caminho: relativo, linha: i + 1, termo: termoInfo.termo, forma: 'forma-4-cabecalho', trecho: cortarTrecho(paragrafo) });
          }
        }
      }
    }
  }

  return achados;
}

// =====================================================================
// Acao: check
// =====================================================================

function check(cwd, flags) {
  const termos = lerTermos(caminhoGlossario(flags.glossario));
  const raiz = raizPacote(flags.raiz);
  const arquivos = arquivosVarridos(raiz, flags.pastas);

  let achados = [];
  for (const arquivo of arquivos) {
    achados = achados.concat(verificarArquivo(arquivo, raiz, termos));
  }
  achados.sort((a, b) => a.caminho.localeCompare(b.caminho) || a.linha - b.linha);

  const resultado = {
    termos_count: termos.length,
    arquivos_count: arquivos.length,
    achados,
    total: achados.length,
    aprovado: achados.length === 0,
  };

  if (flags.estrito && !resultado.aprovado) {
    const listagem = achados
      .map((a) => `${a.caminho}:${a.linha} [${a.termo} / ${a.forma}] "${a.trecho}"`)
      .join('\n');
    throw new Error(`Redefinicao encontrada (${resultado.total}) em modo estrito:\n${listagem}`);
  }

  return resultado;
}

// =====================================================================
// Acao: citacao
// =====================================================================

/**
 * Mede a cobertura da linha de citacao do glossario nos agentes e workflows (a outra metade
 * de fonte unica: sem citacao, a regua de redefinicao da tarefa 2 passa por vazio). Nao
 * considera comandos nem templates, porque o alvo declarado sao agentes e workflows.
 */
function citacao(cwd, flags) {
  const raiz = raizPacote(flags.raiz);
  const arquivos = arquivosVarridos(raiz, PASTAS_CITACAO);

  const comCitacao = [];
  const semCitacao = [];
  for (const arquivo of arquivos) {
    const conteudo = fs.readFileSync(arquivo, 'utf-8');
    const relativo = toPosixPath(path.relative(raiz, arquivo));
    if (conteudo.includes(NOME_ARQUIVO_GLOSSARIO)) {
      comCitacao.push(relativo);
    } else {
      semCitacao.push(relativo);
    }
  }
  semCitacao.sort();

  const resultado = {
    com_citacao: comCitacao.length,
    sem_citacao: semCitacao.length,
    faltando: semCitacao,
    aprovado: semCitacao.length === 0,
  };

  if (flags.estrito && !resultado.aprovado) {
    throw new Error(`Cobertura de citacao incompleta: faltam ${resultado.sem_citacao} arquivo(s):\n${resultado.faltando.join('\n')}`);
  }

  return resultado;
}

// =====================================================================
// Dispatcher
// =====================================================================

function extrairFlagsComuns(args) {
  const pastasRaw = lerFlag(args, 'pastas');
  return {
    estrito: args.includes('--estrito'),
    pastas: pastasRaw ? pastasRaw.split(',').map((p) => p.trim()).filter(Boolean) : null,
    raiz: lerFlag(args, 'raiz'),
    glossario: lerFlag(args, 'glossario'),
  };
}

function run(cwd, args) {
  const acao = args[0];
  const flags = extrairFlagsComuns(args);

  if (acao === 'check') {
    const resultado = check(cwd, flags);
    return {
      result: resultado,
      resumo: `Redefinicoes encontradas: ${resultado.total} (termos=${resultado.termos_count}, arquivos=${resultado.arquivos_count}).`,
    };
  }

  if (acao === 'citacao') {
    const resultado = citacao(cwd, flags);
    return {
      result: resultado,
      resumo: `Citacao do glossario: ${resultado.com_citacao} com, ${resultado.sem_citacao} sem.`,
    };
  }

  throw new Error(`Acao desconhecida para memoria glossario: "${acao || ''}". Disponiveis: check, citacao.`);
}

module.exports = {
  NOME_ARQUIVO_GLOSSARIO,
  PASTAS_PADRAO,
  caminhoGlossario,
  raizPacote,
  lerTermos,
  arquivosVarridos,
  linhasUteis,
  check,
  citacao,
  run,
  toPosixPath,
};
