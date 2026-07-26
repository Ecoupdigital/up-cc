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
 * Limitacao conhecida e aceita: as duas guardas sao listas lexicas fechadas. Colapsam a
 * contracao "pra"/"para" (normalizarGuarda), mas nao entendem parafrase. "esse recurso ja foi
 * entregue" e "nao temos tempo neste trimestre" dizem a mesma coisa que "ja existe" e "por
 * enquanto", e passam. Ampliar a lista para perseguir cada parafrase possivel e jogo de gato e
 * rato que a lista sempre perde: cada frase nova bloqueada abre espaco pra outra reformulacao
 * nao prevista. A guarda existe pra pegar o caso descuidado (marca literal, com ou sem acento
 * ou caixa), nao a tentativa deliberada de driblar a redacao. Fechar o caso adversarial exigiria
 * classificacao semantica (um modelo, nao uma lista), o que e uma decisao de arquitetura fora
 * do escopo deste modulo.
 *
 * Acoes: listar, registrar, alias, buscar.
 */

const fs = require('fs');
const path = require('path');
const { generateSlugInternal, toPosixPath, escapeRegex } = require('./core.cjs');
const {
  dirForaDeEscopo, garantirDir, resolverCaminhoContido,
  rejeitarQuebraDeLinha, serializarValorFrontmatter, parseValorFrontmatterSimples,
  lerFlag, lerFlags,
} = require('./memoria.cjs');

const PALAVRAS_VAZIAS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'um', 'uma', 'o', 'a', 'os', 'as',
  'em', 'no', 'na', 'nos', 'nas', 'para', 'pra', 'por', 'com', 'sem', 'que',
  'se', 'ao', 'aos', 'ser', 'ter', 'mais', 'menos', 'muito', 'novo', 'nova',
]);

// Listas fechadas de marca. Ampliar exige decisao registrada, nao palpite do executor.
const MARCAS_IMPLEMENTADO = [
  'ja implementado',
  'ja esta implementado',
  'ja foi implementado',
  'ja existe',
  'ja foi feito',
  'ja esta pronto',
  'ja temos',
  'ja tem',
  'ja entregamos',
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
  'nao e prioridade',
  'postergar',
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

/** Normaliza e, so para o proposito das guardas de admissao, colapsa a contracao "pra" na
 * forma "para" (palavra inteira, nao prefixo de outra palavra). Sem isso "deixar pra depois"
 * escapava da marca "deixar para depois" por diferenca lexical pura, mesma intencao. Escopo
 * restrito as duas guardas abaixo: normalizar() em si fica intocada, porque busca, alias e slug
 * dependem da forma neutra sem esse colapso. */
function normalizarGuarda(texto) {
  return normalizar(texto).replace(/\bpra\b/g, 'para');
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
        aliases.push(parseValorFrontmatterSimples(itemMatch[1]));
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
      campos[chaveMatch[1]] = parseValorFrontmatterSimples(chaveMatch[2]);
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
  const normalizado = normalizarGuarda(motivo);
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
  const normalizado = normalizarGuarda(motivo);
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

  // 1b. Serializacao segura do titulo e de cada apelido (RV-002): falha cedo, antes de tocar
  // disco, se algum tiver quebra de linha. Sem isso, quebra de linha crua no titulo injeta
  // campo forjado no frontmatter ou fecha o bloco cedo se a linha seguinte comecar com "---".
  const tituloSerializado = serializarValorFrontmatter(titulo.trim(), 'titulo');
  for (const alias of aliases) rejeitarQuebraDeLinha(alias, 'alias');
  const aliasesSerializados = aliases.map((a) => serializarValorFrontmatter(a, 'alias'));

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
  // conceito ja vem de generateSlugInternal, mas resolverCaminhoContido e o mesmo portao
  // final usado no resto do espaco de memoria, como defesa em profundidade (RV-001).
  const caminhoArquivo = resolverCaminhoContido(dir, `${conceito}.md`);

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
    `titulo: ${tituloSerializado}`,
    'aliases:',
    ...aliasesSerializados.map((a) => `  - ${a}`),
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
// Escrita: alias (tarefa 3)
// =====================================================================

/** Reescreve so o bloco de aliases do frontmatter, preservando o resto do arquivo (incluindo
 * o corpo inteiro) byte a byte. */
function reescreverAliasesFrontmatter(conteudo, aliasesFinal) {
  const match = conteudo.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Arquivo de rejeicao sem frontmatter valido: nao foi possivel atualizar os apelidos.');
  }
  const corpo = match[2];
  const linhasNovas = [];
  let dentroDeAliases = false;

  for (const linha of match[1].split('\n')) {
    if (dentroDeAliases) {
      if (/^\s*-\s*.+$/.test(linha)) continue;
      dentroDeAliases = false;
    }
    if (/^aliases:\s*$/.test(linha)) {
      linhasNovas.push('aliases:');
      for (const alias of aliasesFinal) {
        linhasNovas.push(`  - ${serializarValorFrontmatter(alias, 'alias')}`);
      }
      dentroDeAliases = true;
      continue;
    }
    linhasNovas.push(linha);
  }

  return `---\n${linhasNovas.join('\n')}\n---\n${corpo}`;
}

function adicionarAlias(cwd, { conceito: conceitoBruto, aliases: novosAliases }) {
  if (!conceitoBruto) {
    throw new Error('Apelido nao registrado: e preciso informar --conceito.');
  }
  const novos = (novosAliases || []).map((a) => a.trim()).filter(Boolean);
  if (novos.length === 0) {
    throw new Error('Apelido nao registrado: e preciso pelo menos um --alias.');
  }
  // Falha cedo, antes de ler ou escrever qualquer arquivo, se algum apelido novo tiver
  // quebra de linha (RV-002).
  for (const alias of novos) rejeitarQuebraDeLinha(alias, 'alias');

  const conceito = generateSlugInternal(conceitoBruto);
  const caminhoArquivo = resolverCaminhoContido(dirForaDeEscopo(cwd), `${conceito}.md`);

  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Apelido nao registrado: o conceito "${conceito}" nao foi encontrado na base de rejeicoes.`);
  }

  const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
  const { frontmatter } = extrairFrontmatter(conteudo);
  const aliasesAtuais = frontmatter.aliases || [];
  const normalizadosAtuais = new Set(aliasesAtuais.map((a) => normalizar(a)));

  const aliasesFinal = [...aliasesAtuais];
  let acrescentados = 0;
  for (const alias of novos) {
    const normalizado = normalizar(alias);
    if (normalizadosAtuais.has(normalizado)) continue;
    normalizadosAtuais.add(normalizado);
    aliasesFinal.push(alias);
    acrescentados++;
  }

  if (acrescentados > 0) {
    const novoConteudo = reescreverAliasesFrontmatter(conteudo, aliasesFinal);
    fs.writeFileSync(caminhoArquivo, novoConteudo, 'utf-8');
  }

  return {
    conceito,
    aliases: aliasesFinal,
    aliases_acrescentados: acrescentados,
  };
}

// =====================================================================
// Leitura: buscar (tarefa 4) e pergunta sugerida (tarefa 5)
// =====================================================================

/** Primeira frase de um texto (ate o primeiro ponto final, exclamacao ou interrogacao). */
function primeiraFrase(texto) {
  if (!texto) return '';
  const limpo = texto.trim();
  const idx = limpo.search(/[.!?]/);
  return idx === -1 ? limpo : limpo.slice(0, idx + 1).trim();
}

/** Monta a pergunta pronta para o dono a partir de um achado, em tres partes emendadas:
 * semelhanca citada, motivo original e recomendacao com o porque, seguida da pergunta ao
 * dono sobre manter ou revisar a recusa. */
function montarPergunta(rejeicao) {
  const dataTexto = rejeicao.registrado_em || 'data nao registrada';
  const parteSemelhanca = `O pedido novo parece com o conceito ja recusado "${rejeicao.titulo}" (recusado em ${dataTexto}).`;
  const parteMotivo = `O motivo original foi: ${primeiraFrase(rejeicao.motivo)}`;

  let parteRecomendacao = 'Recomendo manter a recusa, porque o motivo original e estrutural e o pedido novo nao trouxe fato que o contradiga.';
  if (rejeicao.reabre_se) {
    parteRecomendacao += ` O gatilho declarado para essa recusa voltar a mesa foi: "${rejeicao.reabre_se}". Confira se ele ja aconteceu.`;
  }
  parteRecomendacao += ' Mantemos a recusa ou revisamos ela agora?';

  return `${parteSemelhanca} ${parteMotivo} ${parteRecomendacao}`;
}

/** Avalia se uma chave (slug, titulo ou apelido) casa com o pedido normalizado. Casa quando
 * todos os tokens significativos da chave aparecem no pedido e a chave tem duas ou mais
 * tokens significativas, ou quando a forma normalizada contigua da chave aparece inteira
 * dentro do pedido normalizado. Uma unica palavra compartilhada nunca casa sozinha. */
function avaliarChave(chaveTexto, pedidoNormalizado, tokensDoPedido) {
  const tokensChave = tokensSignificativos(chaveTexto);
  const contigua = normalizar(chaveTexto);

  const casaPorTokens = tokensChave.length >= 2 && tokensChave.every((token) => tokensDoPedido.has(token));
  const casaPorContigua = contigua.length > 0 && pedidoNormalizado.includes(contigua);

  if (!casaPorTokens && !casaPorContigua) return { casou: false, pontuacao: 0 };
  return { casou: true, pontuacao: tokensChave.length };
}

function buscar(cwd, { pedido, limite }) {
  const dir = dirForaDeEscopo(cwd);
  if (!fs.existsSync(dir)) {
    return { achados: [], base_existe: false };
  }

  const pedidoNormalizado = normalizar(pedido);
  const tokensDoPedido = new Set(tokensSignificativos(pedido));

  const achados = [];
  for (const rejeicao of listarRejeicoes(cwd)) {
    const chaves = [rejeicao.conceito, rejeicao.titulo, ...rejeicao.aliases].filter(Boolean);
    let melhor = null;
    for (const chaveTexto of chaves) {
      const avaliacao = avaliarChave(chaveTexto, pedidoNormalizado, tokensDoPedido);
      if (!avaliacao.casou) continue;
      if (!melhor || avaliacao.pontuacao > melhor.pontuacao) {
        melhor = { chave: chaveTexto, pontuacao: avaliacao.pontuacao };
      }
    }
    if (melhor) {
      achados.push({
        conceito: rejeicao.conceito,
        titulo: rejeicao.titulo,
        motivo: rejeicao.motivo,
        registrado_em: rejeicao.registrado_em,
        caminho: rejeicao.caminho,
        chave_casada: melhor.chave,
        pontuacao: melhor.pontuacao,
        pergunta: montarPergunta(rejeicao),
      });
    }
  }

  achados.sort((a, b) => (b.pontuacao - a.pontuacao) || a.conceito.localeCompare(b.conceito));

  return { achados: achados.slice(0, limite), base_existe: true };
}

// =====================================================================
// Dispatcher
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

  if (acao === 'alias') {
    const resultado = adicionarAlias(cwd, {
      conceito: lerFlag(args, 'conceito'),
      aliases: lerFlags(args, 'alias'),
    });
    return {
      result: resultado,
      resumo: `Conceito "${resultado.conceito}": ${resultado.aliases_acrescentados} apelido(s) acrescentado(s).`,
    };
  }

  if (acao === 'buscar') {
    const pedido = lerFlag(args, 'pedido');
    if (!pedido) {
      throw new Error('Busca nao executada: e preciso informar --pedido.');
    }
    const limiteBruto = lerFlag(args, 'limite');
    const limiteNum = limiteBruto ? parseInt(limiteBruto, 10) : NaN;
    const limite = Number.isFinite(limiteNum) && limiteNum > 0 ? limiteNum : 3;
    const resultado = buscar(cwd, { pedido, limite });
    return {
      result: resultado,
      resumo: resultado.base_existe
        ? `${resultado.achados.length} achado(s) para o pedido.`
        : 'Base de rejeicoes ainda nao existe.',
    };
  }

  throw new Error(`Acao desconhecida para memoria fora-de-escopo: "${acao || ''}". Disponiveis: listar, registrar, alias, buscar.`);
}

module.exports = {
  PALAVRAS_VAZIAS,
  MARCAS_IMPLEMENTADO,
  MARCAS_ADIAMENTO,
  normalizar,
  tokensSignificativos,
  listarRejeicoes,
  registrar,
  adicionarAlias,
  buscar,
  montarPergunta,
  avaliarChave,
  run,
};
