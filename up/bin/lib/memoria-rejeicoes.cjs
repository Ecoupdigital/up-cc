/**
 * memoria-rejeicoes.cjs: base de rejeicoes por conceito de dominio (Fase 14, submodulo
 * `fora-de-escopo` do espaco de comando `memoria`).
 *
 * Um arquivo por conceito em `.plano/fora-de-escopo/<conceito>.md`. O casamento de busca e
 * por conceito de dominio, nunca por palavra-chave solta: uma chave (slug, titulo ou apelido)
 * so casa quando todos os seus tokens significativos aparecem no pedido e ela tem duas ou mais
 * tokens significativas, ou quando a forma normalizada contigua da chave aparece inteira dentro
 * do pedido normalizado. Uma unica palavra compartilhada nunca casa sozinha.
 *
 * Duas guardas fecham a porta de entrada, antes de qualquer escrita: item ja implementado e
 * motivo temporario nao entram na base, porque envenenariam a consulta com falsa rejeicao ou
 * confundiriam adiamento com recusa. Criacao preguicosa: nenhum diretorio nasce antes da
 * primeira rejeicao estrutural passar nas duas guardas.
 *
 * Acoes: listar, registrar, alias, buscar.
 */

const fs = require('fs');
const path = require('path');
const { toPosixPath, escapeRegex } = require('./core.cjs');
const { dirForaDeEscopo } = require('./memoria.cjs');

const PALAVRAS_VAZIAS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'um', 'uma', 'o', 'a', 'os', 'as',
  'em', 'no', 'na', 'nos', 'nas', 'para', 'pra', 'por', 'com', 'sem', 'que',
  'se', 'ao', 'aos', 'ser', 'ter', 'mais', 'menos', 'muito', 'novo', 'nova',
]);

const REGEX_MARCAS_DIACRITICAS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');

// =====================================================================
// Normalizacao (determinismo exigido: base de toda comparacao do modulo)
// =====================================================================

/** Minusculas, remocao de acento por decomposicao, troca do que nao e letra ou digito por
 * espaco, colapso de espacos. Deterministica: mesma entrada sempre devolve a mesma saida. */
function normalizar(texto) {
  if (!texto) return '';
  const minuscula = String(texto).toLowerCase();
  const semAcento = minuscula.normalize('NFD').replace(REGEX_MARCAS_DIACRITICAS, '');
  const apenasLetraDigito = semAcento.replace(/[^a-z0-9]+/g, ' ');
  return apenasLetraDigito.trim().replace(/\s+/g, ' ');
}

/** Normaliza, quebra por espaco, descarta palavra vazia e token com menos de quatro
 * caracteres. Devolve lista sem repeticao, na ordem de primeira aparicao. */
function tokensSignificativos(texto) {
  const normalizado = normalizar(texto);
  if (!normalizado) return [];
  const vistos = new Set();
  const significativos = [];
  for (const token of normalizado.split(' ')) {
    if (!token) continue;
    if (PALAVRAS_VAZIAS.has(token)) continue;
    if (token.length < 4) continue;
    if (vistos.has(token)) continue;
    vistos.add(token);
    significativos.push(token);
  }
  return significativos;
}

// =====================================================================
// Leitura de arquivo de rejeicao (nenhuma destas funcoes escreve nada)
// =====================================================================

/** Frontmatter simples no formato que este modulo escreve: chave: valor, com uma excecao de
 * lista (aliases), gravada como "aliases:" seguido de linhas "  - item". */
function extrairFrontmatter(conteudo) {
  const match = conteudo.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, corpo: conteudo };

  const bloco = match[1];
  const corpo = match[2];
  const campos = {};
  const aliases = [];
  let lendoAliases = false;

  for (const linha of bloco.split('\n')) {
    if (lendoAliases) {
      const itemMatch = linha.match(/^\s*-\s*(.+)$/);
      if (itemMatch) {
        aliases.push(itemMatch[1].trim());
        continue;
      }
      lendoAliases = false;
    }
    if (/^aliases:\s*$/.test(linha)) {
      lendoAliases = true;
      continue;
    }
    const chaveMatch = linha.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (chaveMatch) {
      campos[chaveMatch[1]] = chaveMatch[2].trim();
    }
  }

  campos.aliases = aliases;
  return { frontmatter: campos, corpo };
}

/** Extrai o texto de uma secao "## <cabecalho>" do corpo, ate o proximo "## " ou o fim. */
function extrairSecao(corpo, cabecalho) {
  const regex = new RegExp(`##\\s*${escapeRegex(cabecalho)}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
  const encontrado = corpo.match(regex);
  return encontrado ? encontrado[1].trim() : null;
}

const NENHUM_GATILHO_DECLARADO = 'Nenhum gatilho de reabertura foi declarado.';

function extrairGatilho(corpo) {
  const secao = extrairSecao(corpo, 'O que faria isso voltar a mesa');
  if (!secao) return null;
  if (secao === NENHUM_GATILHO_DECLARADO) return null;
  return secao;
}

/** Le o diretorio de rejeicoes; ausente devolve lista vazia. So considera arquivo .md.
 * Devolve lista ordenada por conceito. Nunca cria o diretorio. */
function listarRejeicoes(cwd) {
  const dir = dirForaDeEscopo(cwd);
  if (!fs.existsSync(dir)) return [];

  const rejeicoes = fs.readdirSync(dir)
    .filter((arquivo) => arquivo.endsWith('.md'))
    .map((arquivo) => {
      const caminhoAbsoluto = path.join(dir, arquivo);
      const conteudo = fs.readFileSync(caminhoAbsoluto, 'utf-8');
      const { frontmatter, corpo } = extrairFrontmatter(conteudo);

      return {
        conceito: frontmatter.conceito || path.basename(arquivo, '.md'),
        titulo: frontmatter.titulo || '',
        aliases: frontmatter.aliases || [],
        registrado_em: frontmatter.registrado_em || null,
        tipo_motivo: frontmatter.tipo_motivo || null,
        motivo: extrairSecao(corpo, 'Motivo da recusa') || '',
        reabre_se: extrairGatilho(corpo),
        caminho: toPosixPath(path.relative(cwd, caminhoAbsoluto)),
      };
    });

  rejeicoes.sort((a, b) => a.conceito.localeCompare(b.conceito));
  return rejeicoes;
}

// =====================================================================
// Dispatcher (cresce a cada tarefa; por ora so a acao listar)
// =====================================================================

function run(cwd, args) {
  const acao = args[0];

  if (acao === 'listar') {
    const existe = fs.existsSync(dirForaDeEscopo(cwd));
    const rejeicoes = listarRejeicoes(cwd).map((r) => ({
      conceito: r.conceito,
      titulo: r.titulo,
      registrado_em: r.registrado_em,
      tipo_motivo: r.tipo_motivo,
    }));
    return {
      result: { rejeicoes, base_existe: existe },
      resumo: `${rejeicoes.length} rejeicao(oes) na base.`,
    };
  }

  throw new Error(`Acao desconhecida para memoria fora-de-escopo: "${acao || ''}". Disponiveis: listar.`);
}

module.exports = {
  PALAVRAS_VAZIAS,
  normalizar,
  tokensSignificativos,
  listarRejeicoes,
  run,
};
