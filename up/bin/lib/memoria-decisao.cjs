/**
 * memoria-decisao.cjs: registro de decisao deterministico (Fase 14, submodulo `decisao`
 * do espaco de comando `memoria`).
 *
 * So grava decisao que passa o gate das tres condicoes em E logico: dificil de reverter,
 * surpreendente sem contexto e resultado de trade-off real (com alternativas genuinas
 * rejeitadas e o motivo de cada uma). Faltou uma condicao, nao escreve nada. Nem o
 * diretorio de decisoes e criado (criacao preguicosa).
 *
 * Numeracao deterministica: sempre a maior existente mais um, calculada por varredura do
 * diretorio a cada chamada (nunca um contador guardado em arquivo). Buraco na sequencia
 * (numero apagado ou nunca usado) nao e preenchido.
 *
 * Acoes: proximo-numero, listar, criar, status.
 */

const fs = require('fs');
const path = require('path');
const { generateSlugInternal, toPosixPath } = require('./core.cjs');
const { dirDecisoes, garantirDir, resolverCaminhoContido, comLockDiretorio, lerFlag, lerFlags, contarPalavras } = require('./memoria.cjs');

// Tentativas maximas de recalcular o numero em caso de EEXIST dentro do lock (RV-003). O
// lock ja deveria impedir a corrida sozinho; isto e so uma segunda camada de defesa.
const MAX_TENTATIVAS_NUMERO = 30;

const REGEX_ARQUIVO_REGISTRO = /^(\d{4})-([a-z0-9-]+)\.md$/;

// =====================================================================
// Leitura (nenhuma acao de escrita acontece aqui)
// =====================================================================

function listarRegistros(cwd) {
  const dir = dirDecisoes(cwd);
  if (!fs.existsSync(dir)) return [];
  const registros = [];
  for (const arquivo of fs.readdirSync(dir)) {
    const m = arquivo.match(REGEX_ARQUIVO_REGISTRO);
    if (!m) continue;
    registros.push({ numero: parseInt(m[1], 10), slug: m[2], arquivo });
  }
  registros.sort((a, b) => a.numero - b.numero);
  return registros;
}

function proximoNumero(cwd) {
  const registros = listarRegistros(cwd);
  if (registros.length === 0) return 1;
  return registros.reduce((maior, r) => Math.max(maior, r.numero), 0) + 1;
}

function formatarNumero(n) {
  return String(n).padStart(4, '0');
}

function encontrarRegistro(cwd, numeroFormatado) {
  const dir = dirDecisoes(cwd);
  if (!fs.existsSync(dir)) return null;
  const alvo = fs.readdirSync(dir).find(
    (f) => f.startsWith(`${numeroFormatado}-`) && f.endsWith('.md')
  );
  if (!alvo) return null;
  return { arquivo: alvo, caminho: path.join(dir, alvo) };
}

function extrairFrontmatterSimples(conteudo) {
  const match = conteudo.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const campos = {};
  for (const linha of match[1].split('\n')) {
    const m = linha.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    let valor = m[2].trim().replace(/^"(.*)"$/, '$1');
    campos[m[1]] = valor === 'null' ? null : valor;
  }
  return campos;
}

// =====================================================================
// Escrita: criar
// =====================================================================

// [chave-da-flag, rotulo-em-portugues-para-mensagem-de-erro]
const CONDICOES_GATE = [
  ['dificil-reverter', 'dificil de reverter'],
  ['surpreendente', 'surpreendente sem contexto'],
  ['trade-off', 'trade-off real'],
];

function criar(cwd, flags) {
  const titulo = flags.titulo;
  const contexto = flags.contexto;
  const decisaoTexto = flags.decisao;
  const motivo = flags.motivo;
  const alternativasRaw = flags.alternativa || [];

  // 1. Campos de conteudo obrigatorios (texto livre, o modulo nao corta nem reescreve).
  const camposFaltando = [];
  if (!titulo) camposFaltando.push('titulo');
  if (!contexto) camposFaltando.push('contexto');
  if (!decisaoTexto) camposFaltando.push('decisao');
  if (!motivo) camposFaltando.push('motivo');
  if (camposFaltando.length > 0) {
    throw new Error(`Decisao nao registrada: campo obrigatorio ausente: ${camposFaltando.join(', ')}.`);
  }

  // 2. Gate das tres condicoes, conjuntivo. Coleta todas as faltas antes de falhar.
  const faltandoGate = CONDICOES_GATE
    .filter(([chave]) => contarPalavras(flags[chave]) < 3)
    .map(([, rotulo]) => rotulo);
  if (faltandoGate.length > 0) {
    throw new Error(
      `Decisao nao registrada: o gate exige as tres condicoes justificadas com pelo menos tres palavras cada. Faltou: ${faltandoGate.join(', ')}.`
    );
  }

  // 3. Alternativas rejeitadas: pelo menos uma, no formato "nome :: motivo".
  if (alternativasRaw.length === 0) {
    throw new Error('Decisao nao registrada: e preciso pelo menos uma alternativa rejeitada (--alternativa "nome :: motivo").');
  }
  const alternativas = alternativasRaw.map((ocorrencia) => {
    const idx = ocorrencia.indexOf('::');
    const nome = idx === -1 ? '' : ocorrencia.slice(0, idx).trim();
    const motivoAlt = idx === -1 ? '' : ocorrencia.slice(idx + 2).trim();
    if (!nome || !motivoAlt) {
      throw new Error(`Alternativa em formato invalido: "${ocorrencia}". Use "nome :: motivo".`);
    }
    return { nome, motivo: motivoAlt };
  });

  // 4. Status: uma decisao nasce proposta ou aceita. Substituida so acontece depois.
  const status = flags.status || 'aceita';
  if (status !== 'proposta' && status !== 'aceita') {
    throw new Error(`Status invalido para criacao: "${status}". Uma decisao nasce como "proposta" ou "aceita"; "substituida" so acontece depois, pela acao status.`);
  }

  // 5. Slug: SEMPRE passa pela slugificacao real, nunca aceita o valor cru de --slug
  // (RV-001): sem isso, um `--slug "../../../ROADMAP"` sobrevive ao corte de 48 caracteres e
  // ao trim de hifen, e o `path.join` normaliza o `..` pra fora do diretorio de decisoes na
  // escrita, sobrescrevendo arquivo alheio em silencio.
  let slug = generateSlugInternal(flags.slug || titulo) || 'decisao';
  slug = slug.slice(0, 48).replace(/^-+|-+$/g, '') || 'decisao';

  const linhasAlternativas = alternativas.map((a) => `- ${a.nome}: ${a.motivo}`).join('\n');
  const data = new Date().toISOString().split('T')[0];
  const dir = garantirDir(dirDecisoes(cwd));

  // 6. Numero + escrita: dentro de um lock de diretorio (RV-003). O UP roda planos da mesma
  // onda em paralelo por design, entao dois processos podem chegar aqui ao mesmo tempo; sem
  // serializar a secao "varre o numero mais alto, escreve o arquivo", dois processos podem
  // varrer o MESMO numero antes de qualquer um escrever (a varredura le o disco, nao um
  // contador), produzindo numero duplicado (com slug diferente, nao ha colisao de nome de
  // arquivo pra acusar) ou, com o mesmo titulo, a MESMA combinacao numero+slug, destruindo o
  // registro do outro processo em silencio. O lock serializa entre processos; a escrita
  // exclusiva (`wx`) mais o retry no EEXIST sao a segunda camada de defesa, caso o lock em
  // si tenha ficado orfao por um processo morto no meio da secao critica.
  return comLockDiretorio(path.join(dir, '.lock'), () => {
    for (let tentativa = 0; tentativa < MAX_TENTATIVAS_NUMERO; tentativa++) {
      const numeroFormatado = formatarNumero(proximoNumero(cwd));
      const nomeArquivo = `${numeroFormatado}-${slug}.md`;
      const caminhoAbsoluto = resolverCaminhoContido(dir, nomeArquivo);

      const frontmatter = [
        '---',
        `numero: "${numeroFormatado}"`,
        `slug: ${slug}`,
        `titulo: ${titulo.trim()}`,
        `status: ${status}`,
        'substituida_por: null',
        `data: ${data}`,
      ];
      if (flags.fase) frontmatter.push(`fase: ${flags.fase.trim()}`);
      frontmatter.push('---', '');

      const corpo = [
        `# ${numeroFormatado}. ${titulo.trim()}`,
        '',
        '## Contexto',
        contexto.trim(),
        '',
        '## Decisão',
        decisaoTexto.trim(),
        '',
        '## Motivo',
        motivo.trim(),
        '',
        '## Condições do gate',
        `- Difícil de reverter: ${flags['dificil-reverter'].trim()}`,
        `- Surpreendente sem contexto: ${flags.surpreendente.trim()}`,
        `- Trade-off real: ${flags['trade-off'].trim()}`,
        '',
        '## Alternativas rejeitadas',
        linhasAlternativas,
        '',
      ].join('\n');

      try {
        fs.writeFileSync(caminhoAbsoluto, frontmatter.join('\n') + '\n' + corpo, { encoding: 'utf-8', flag: 'wx' });
      } catch (e) {
        if (e.code === 'EEXIST') continue; // outro processo levou este numero+slug primeiro
        throw e;
      }

      return {
        criado: true,
        numero: numeroFormatado,
        caminho: toPosixPath(path.relative(cwd, caminhoAbsoluto)),
        status,
        alternativas_count: alternativas.length,
      };
    }

    throw new Error(`Decisao nao registrada: nao foi possivel obter um numero livre apos ${MAX_TENTATIVAS_NUMERO} tentativas (concorrencia excessiva).`);
  });
}

// =====================================================================
// Escrita: status
// =====================================================================

function mudarStatus(cwd, { numero, status, substituidaPor }) {
  if (!numero) throw new Error('Mudanca de status exige --numero.');
  const numInt = parseInt(numero, 10);
  if (!Number.isFinite(numInt)) throw new Error(`Numero invalido: "${numero}".`);
  const numeroFormatado = formatarNumero(numInt);

  const registro = encontrarRegistro(cwd, numeroFormatado);
  if (!registro) {
    throw new Error(`Registro de decisao numero ${numeroFormatado} nao encontrado.`);
  }

  const statusValidos = ['proposta', 'aceita', 'substituida'];
  if (!statusValidos.includes(status)) {
    throw new Error(`Status invalido: "${status}". Valores aceitos: proposta, aceita, substituida.`);
  }

  let substituidaPorFormatado = null;
  if (status === 'substituida') {
    if (!substituidaPor) {
      throw new Error('Status "substituida" exige --substituida-por com o numero do registro substituto.');
    }
    const substNum = parseInt(substituidaPor, 10);
    if (!Number.isFinite(substNum)) throw new Error(`Numero substituidor invalido: "${substituidaPor}".`);
    substituidaPorFormatado = formatarNumero(substNum);
    if (!encontrarRegistro(cwd, substituidaPorFormatado)) {
      throw new Error(`Registro substituidor numero ${substituidaPorFormatado} nao encontrado.`);
    }
  } else if (substituidaPor) {
    throw new Error(`Status "${status}" nao aceita --substituida-por.`);
  }

  // Altera so as linhas de status e substituida_por dentro do frontmatter; o resto do
  // arquivo (incluindo o corpo inteiro) fica byte a byte identico.
  const conteudo = fs.readFileSync(registro.caminho, 'utf-8');
  const statusAnteriorMatch = conteudo.match(/^status:\s*(.*)$/m);
  const statusAnterior = statusAnteriorMatch ? statusAnteriorMatch[1].trim() : null;

  let novoConteudo = conteudo.replace(/^status:\s*.*$/m, `status: ${status}`);
  const substValorFrontmatter = substituidaPorFormatado === null ? 'null' : substituidaPorFormatado;
  novoConteudo = novoConteudo.replace(/^substituida_por:\s*.*$/m, `substituida_por: ${substValorFrontmatter}`);

  fs.writeFileSync(registro.caminho, novoConteudo, 'utf-8');

  return {
    numero: numeroFormatado,
    status_anterior: statusAnterior,
    status_novo: status,
    substituida_por: substituidaPorFormatado,
  };
}

// =====================================================================
// Dispatcher
// =====================================================================

function extrairFlagsCriar(args) {
  return {
    titulo: lerFlag(args, 'titulo'),
    contexto: lerFlag(args, 'contexto'),
    decisao: lerFlag(args, 'decisao'),
    motivo: lerFlag(args, 'motivo'),
    'dificil-reverter': lerFlag(args, 'dificil-reverter'),
    surpreendente: lerFlag(args, 'surpreendente'),
    'trade-off': lerFlag(args, 'trade-off'),
    alternativa: lerFlags(args, 'alternativa'),
    status: lerFlag(args, 'status'),
    fase: lerFlag(args, 'fase'),
    slug: lerFlag(args, 'slug'),
  };
}

function run(cwd, args) {
  const acao = args[0];

  if (acao === 'proximo-numero') {
    const existe = fs.existsSync(dirDecisoes(cwd));
    const registros = listarRegistros(cwd);
    const proximo = formatarNumero(proximoNumero(cwd));
    return {
      result: { proximo, existentes: registros.map((r) => r.numero), diretorio_existe: existe },
      resumo: `Proximo numero de decisao: ${proximo}.`,
    };
  }

  if (acao === 'listar') {
    const dir = dirDecisoes(cwd);
    const existe = fs.existsSync(dir);
    const registros = listarRegistros(cwd).map((r) => {
      const fm = extrairFrontmatterSimples(fs.readFileSync(path.join(dir, r.arquivo), 'utf-8'));
      return { numero: formatarNumero(r.numero), slug: r.slug, titulo: fm.titulo || null, status: fm.status || null };
    });
    return {
      result: { registros, diretorio_existe: existe },
      resumo: `${registros.length} decisao(oes) registrada(s).`,
    };
  }

  if (acao === 'criar') {
    const resultado = criar(cwd, extrairFlagsCriar(args));
    return { result: resultado, resumo: `Decisao ${resultado.numero} registrada em ${resultado.caminho}.` };
  }

  if (acao === 'status') {
    const resultado = mudarStatus(cwd, {
      numero: lerFlag(args, 'numero'),
      status: lerFlag(args, 'status'),
      substituidaPor: lerFlag(args, 'substituida-por'),
    });
    return {
      result: resultado,
      resumo: `Decisao ${resultado.numero}: status ${resultado.status_anterior || '?'} -> ${resultado.status_novo}.`,
    };
  }

  throw new Error(`Acao desconhecida para memoria decisao: "${acao || ''}". Disponiveis: proximo-numero, listar, criar, status.`);
}

module.exports = {
  listarRegistros,
  proximoNumero,
  formatarNumero,
  encontrarRegistro,
  extrairFrontmatterSimples,
  criar,
  mudarStatus,
  run,
};
