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
const { generateSlugInternal, toPosixPath, escapeRegex } = require('./core.cjs');
const { dirForaDeEscopo, garantirDir, lerFlag, lerFlags } = require('./memoria.cjs');

const PALAVRAS_VAZIAS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'um', 'uma', 'o', 'a', 'os', 'as',
  'em', 'no', 'na', 'nos', 'nas', 'para', 'pra', 'por', 'com', 'sem', 'que',
  'se', 'ao', 'aos', 'ser', 'ter', 'mais', 'menos', 'muito', 'novo', 'nova',
]);

// Listas fechadas de marca. Ampliar exige decisao registrada, nao palpite do executor.
const MARCAS_IMPLEMENTADO = [
  'ja implementado',
  'ja existe',
  'ja foi feito',
  'ja esta pronto',
  'ja temos',
  'ja tem',
  'duplicata do que existe',
];

const MARCAS_ADIAMENTO = [
  'por enquanto',
  'por ora',
  'agora nao',
  'falta de tempo',
  'falta tempo',
  'sem tempo',
  'nao da tempo',
  'mais tarde',
  'no futuro',
  'quando sobrar',
  'fica para depois',
  'fica pra depois',
  'deixar para depois',
  'adiado',
  'adiar',
  'proxima versao',
  'versao 2',
];

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
// Escrita: registrar (tarefa 2)
// =====================================================================

function verificarGuardaImplementado(motivo) {
  const normalizado = normalizar(motivo);
  const marca = MARCAS_IMPLEMENTADO.find((m) => normalizado.includes(m));
  if (marca) {
    throw new Error(
      `Rejeicao nao registrada: o motivo indica item ja implementado (marca "${marca}"). ` +
      'Isso nao entra na base porque envenenaria a consulta com falsa rejeicao para pedidos futuros parecidos. ' +
      'O lugar certo desse registro e o documento de estado do projeto.'
    );
  }
}

function verificarGuardaAdiamento(motivo) {
  const normalizado = normalizar(motivo);
  const marca = MARCAS_ADIAMENTO.find((m) => normalizado.includes(m));
  if (marca) {
    throw new Error(
      `Rejeicao nao registrada: o motivo indica adiamento (marca "${marca}"), e adiamento nao e rejeicao. ` +
      'O lugar certo desse registro e a secao de pendencias do documento de estado do projeto.'
    );
  }
}

function registrar(cwd, flags) {
  const conceitoBruto = flags.conceito;
  const titulo = flags.titulo;
  const motivo = flags.motivo;
  const aliases = (flags.alias || []).map((a) => a.trim()).filter(Boolean);
  const reabreSe = flags['reabre-se'] ? flags['reabre-se'].trim() : null;

  // 1. Campos obrigatorios, coletados todos antes de falhar.
  const faltando = [];
  if (!conceitoBruto) faltando.push('conceito');
  if (!titulo) faltando.push('titulo');
  if (!motivo) faltando.push('motivo');
  if (faltando.length > 0) {
    throw new Error(`Rejeicao nao registrada: campo obrigatorio ausente: ${faltando.join(', ')}.`);
  }

  // 2. As duas guardas de admissao, antes de qualquer escrita.
  verificarGuardaImplementado(motivo);
  verificarGuardaAdiamento(motivo);

  // 3. Conceito normalizado para slug, e checagem de duplicata.
  const conceito = generateSlugInternal(conceitoBruto);
  if (!conceito) {
    throw new Error('Rejeicao nao registrada: nao foi possivel gerar um slug valido a partir do conceito informado.');
  }

  const dir = dirForaDeEscopo(cwd);
  const baseExistiaAntes = fs.existsSync(dir);
  const caminhoArquivo = path.join(dir, `${conceito}.md`);

  if (fs.existsSync(caminhoArquivo)) {
    throw new Error(
      `Rejeicao nao registrada: o conceito "${conceito}" ja existe em ${toPosixPath(path.relative(cwd, caminhoArquivo))}. ` +
      'Para ampliar o vocabulario dele use a acao alias, sem reescrever o motivo.'
    );
  }

  // 4. Escrita: so aqui, e so depois de toda regra ter passado.
  garantirDir(dir);

  const data = new Date().toISOString().split('T')[0];
  const gatilhoTexto = reabreSe || NENHUM_GATILHO_DECLARADO;

  const frontmatter = [
    '---',
    `conceito: ${conceito}`,
    `titulo: ${titulo.trim()}`,
    'aliases:',
    ...aliases.map((a) => `  - ${a}`),
    `registrado_em: ${data}`,
    'tipo_motivo: estrutural',
    '---',
    '',
  ];

  const corpo = [
    `# ${titulo.trim()}`,
    '',
    '## Motivo da recusa',
    motivo.trim(),
    '',
    '## O que faria isso voltar a mesa',
    gatilhoTexto,
    '',
  ].join('\n');

  fs.writeFileSync(caminhoArquivo, frontmatter.join('\n') + '\n' + corpo, 'utf-8');

  return {
    conceito,
    caminho: toPosixPath(path.relative(cwd, caminhoArquivo)),
    aliases_count: aliases.length,
    base_criada_agora: !baseExistiaAntes,
  };
}

// =====================================================================
// Dispatcher (cresce a cada tarefa; por ora listar e registrar)
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

  if (acao === 'registrar') {
    const resultado = registrar(cwd, {
      conceito: lerFlag(args, 'conceito'),
      titulo: lerFlag(args, 'titulo'),
      motivo: lerFlag(args, 'motivo'),
      alias: lerFlags(args, 'alias'),
      'reabre-se': lerFlag(args, 'reabre-se'),
    });
    return {
      result: resultado,
      resumo: `Rejeicao "${resultado.conceito}" registrada em ${resultado.caminho}.`,
    };
  }

  throw new Error(`Acao desconhecida para memoria fora-de-escopo: "${acao || ''}". Disponiveis: listar, registrar.`);
}

module.exports = {
  PALAVRAS_VAZIAS,
  MARCAS_IMPLEMENTADO,
  MARCAS_ADIAMENTO,
  normalizar,
  tokensSignificativos,
  listarRejeicoes,
  registrar,
  run,
};
