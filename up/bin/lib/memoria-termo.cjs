/**
 * memoria-termo.cjs: glossario do projeto do dono (Fase 14, submodulo `termo` do
 * espaco de comando `memoria`).
 *
 * Camada distinta do glossario interno do UP (up/references/glossario-up.md, que
 * resolve o vocabulario do proprio produto): este modulo resolve o vocabulario do
 * dominio do projeto que o dono esta construindo. Arquivo unico em .plano/GLOSSARY.md.
 *
 * Criacao preguicosa: o arquivo so nasce na primeira gravacao bem sucedida, nunca como
 * scaffold vazio. O cabecalho (as duas regras) vem da leitura de up/templates/glossary.md;
 * template ausente usa um cabecalho embutido equivalente e avisa no retorno, para o
 * comando nunca falhar por falta de template.
 *
 * Duas guardas rodam antes de qualquer escrita:
 *   - higiene, na definicao: recusa caminho de arquivo ou bloco de codigo cercado por
 *     crase tripla, porque detalhe de implementacao vai para o plano ou para o codigo.
 *   - admissao, no termo: recusa conceito geral de programacao da lista fechada abaixo,
 *     a menos que --forcar venha com --justificativa (um termo generico pode ser termo
 *     de dominio em um projeto especifico).
 *
 * Insercao: verbete entra em ordem alfabetica pelo termo, nunca no fim do arquivo. Termo
 * ja existente recusa citando a definicao atual, a menos que --atualizar venha junto.
 *
 * Acoes: registrar, listar, regras. As duas ultimas so leem; nunca criam arquivo nem
 * diretorio, nem quando o glossario do projeto ainda nao existe.
 */

const fs = require('fs');
const path = require('path');
const { arquivoGlossarioProjeto, comLockDiretorio, lerFlag } = require('./memoria.cjs');

const CAMINHO_TEMPLATE = path.join(__dirname, '..', '..', 'templates', 'glossary.md');

// Lista fechada de conceitos gerais de programacao. Comparada ja normalizada (minusculo,
// sem acento), entao "teste unitario" casa com "teste unitário" digitado com acento.
const CONCEITOS_GERAIS = [
  'api', 'endpoint', 'cache', 'callback', 'componente', 'commit', 'branch', 'deploy',
  'middleware', 'migration', 'promise', 'refactor', 'teste unitario', 'token', 'webhook',
];

// Sequencia com barra e extensao de arquivo, tipo "up/bin/lib/memoria.cjs".
const REGEX_CAMINHO_ARQUIVO = /\b[\w.-]+\/[\w./-]*\.[a-zA-Z0-9]{1,6}\b/;

const CABECALHO_EMBUTIDO = [
  '# Glossário do projeto',
  '',
  'Regra de admissão: só entra conceito específico do domínio deste projeto. Conceito geral de',
  'programação (api, endpoint, cache, componente, deploy e o resto do vocabulário comum a qualquer',
  'projeto de software) fica de fora.',
  '',
  'Regra de higiene: isto é glossário e nada mais. Zero detalhe de implementação: sem caminho de',
  'arquivo, sem nome de função e sem trecho de código. Quem precisa desse detalhe vai ao plano ou ao',
  'código, não a este arquivo.',
  '',
  '## Termos',
  '',
].join('\n');

// =====================================================================
// Normalizacao e guardas (nenhuma destas funcoes toca o disco)
// =====================================================================

function normalizar(txto) {
  return String(txto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function eConceitoGeral(termo) {
  return CONCEITOS_GERAIS.includes(normalizar(termo));
}

function detectarDetalheImplementacao(definicao) {
  const texto = String(definicao || '');
  if (texto.includes('```')) return 'bloco de codigo';
  if (REGEX_CAMINHO_ARQUIVO.test(texto)) return 'caminho de arquivo';
  return null;
}

function temFlag(args, nome) {
  return args.includes(`--${nome}`);
}

// =====================================================================
// Leitura do cabecalho (template do pacote, com fallback embutido)
// =====================================================================

function lerCabecalhoTemplate() {
  let conteudo;
  try {
    conteudo = fs.readFileSync(CAMINHO_TEMPLATE, 'utf-8');
  } catch (e) {
    return { cabecalho: CABECALHO_EMBUTIDO, templateAusente: true };
  }
  const marcador = '## Termos';
  const idx = conteudo.indexOf(marcador);
  if (idx === -1) return { cabecalho: CABECALHO_EMBUTIDO, templateAusente: true };
  const fimLinha = conteudo.indexOf('\n', idx);
  const corte = fimLinha === -1 ? conteudo.length : fimLinha + 1;
  return { cabecalho: conteudo.slice(0, corte).trimEnd() + '\n', templateAusente: false };
}

function extrairRegra(cabecalho, prefixo) {
  const paragrafos = cabecalho.split(/\n\s*\n/);
  const alvo = paragrafos.find((p) => p.trim().startsWith(prefixo));
  if (!alvo) return '';
  return alvo.split('\n').map((l) => l.trim()).filter(Boolean).join(' ').trim();
}

// =====================================================================
// Parse do arquivo do projeto (leitura pura, nenhuma escrita)
// =====================================================================

function extrairSecaoTermos(conteudo) {
  const marcador = '## Termos';
  const idx = conteudo.indexOf(marcador);
  if (idx === -1) return { cabecalho: conteudo.trimEnd() + '\n', textoVerbetes: '' };
  const fimLinha = conteudo.indexOf('\n', idx);
  const corte = fimLinha === -1 ? conteudo.length : fimLinha + 1;
  return { cabecalho: conteudo.slice(0, corte), textoVerbetes: conteudo.slice(corte) };
}

function parseVerbetes(textoVerbetes) {
  return textoVerbetes
    .split(/\n(?=### )/)
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => {
      const m = bloco.match(/^### (.+)$/m);
      return { termo: m ? m[1].trim() : '', bloco };
    });
}

function extrairDefinicaoAtual(bloco) {
  const m = bloco.match(/\*\*Definição:\*\* ?(.+)/);
  return m ? m[1].trim() : '';
}

function extrairEvitarAtual(bloco) {
  const m = bloco.match(/\*\*Evitar:\*\* ?(.+)/);
  return m ? m[1].trim() : null;
}

// =====================================================================
// Montagem do verbete e do arquivo (nenhuma escrita ainda; so string)
// =====================================================================

function montarBlocoVerbete({ termo, definicao, evitar, justificativaForcada }) {
  const linhas = [`### ${termo}`];
  if (justificativaForcada) {
    linhas.push(`<!-- termo generico admitido a forca: ${justificativaForcada} -->`);
  }
  linhas.push(`**Definição:** ${definicao}`);
  if (evitar) linhas.push(`**Evitar:** ${evitar}`);
  return linhas.join('\n');
}

function inserirOrdenado(verbetes, novo) {
  const chaveNovo = normalizar(novo.termo);
  let posicao = verbetes.length;
  for (let i = 0; i < verbetes.length; i++) {
    if (normalizar(verbetes[i].termo) > chaveNovo) {
      posicao = i;
      break;
    }
  }
  const lista = verbetes.slice();
  lista.splice(posicao, 0, novo);
  return { lista, posicao };
}

function montarConteudoArquivo(cabecalho, listaVerbetes) {
  const corpo = listaVerbetes.map((v) => v.bloco.trim()).join('\n\n');
  return cabecalho.trimEnd() + '\n\n' + corpo + '\n';
}

// =====================================================================
// Escrita: registrar
// =====================================================================

function registrar(cwd, flags) {
  const termo = flags.termo;
  const definicao = flags.definicao;

  if (!termo) throw new Error('Termo nao registrado: --termo obrigatorio.');
  if (!definicao) throw new Error('Termo nao registrado: --definicao obrigatoria.');

  // 1. Guarda de higiene, aplicada a definicao, antes de qualquer escrita.
  const detalhe = detectarDetalheImplementacao(definicao);
  if (detalhe) {
    throw new Error(
      `Termo nao registrado: a definicao contem ${detalhe}. A regra de higiene do glossario do ` +
      'projeto proibe detalhe de implementacao; caminho de arquivo, nome de funcao e trecho de ' +
      'codigo vao para o plano ou para o codigo, nao para o glossario.'
    );
  }

  // 2. Guarda de admissao, aplicada ao termo. Reversivel com --forcar e --justificativa.
  let justificativaForcada = null;
  if (eConceitoGeral(termo)) {
    if (!flags.forcar) {
      throw new Error(
        `Termo nao registrado: "${termo}" esta na lista fechada de conceitos gerais de ` +
        'programacao, e a regra de admissao do glossario do projeto deixa esse vocabulario de ' +
        'fora. Se for termo de dominio neste projeto, use --forcar junto com --justificativa.'
      );
    }
    if (!flags.justificativa) {
      throw new Error(
        'Termo nao registrado: --forcar exige --justificativa explicando por que este conceito ' +
        'geral e termo de dominio neste projeto.'
      );
    }
    justificativaForcada = flags.justificativa;
  }

  // 3. So agora, com as duas guardas passadas, o arquivo pode nascer ou ser lido. Do
  // reconhecimento do estado atual (existe ou nao, quais verbetes ja tem) ate a escrita
  // final, tudo roda dentro de um lock de diretorio (RV-003). Sem isso, dois processos
  // registrando termo ao mesmo tempo leem o MESMO conteudo atual, cada um monta a lista
  // final por cima dele e o ultimo a escrever apaga o verbete (e ate o cabecalho com as
  // duas regras) que o outro tinha acabado de gravar: leitura-modificacao-escrita
  // concorrente sem lock perde escrita em silencio, e o UP roda planos da mesma onda em
  // paralelo por design, entao isto nao e hipotetico.
  const caminhoArquivo = arquivoGlossarioProjeto(cwd);
  const caminhoLock = path.join(path.dirname(caminhoArquivo), '.memoria-termo.lock');

  return comLockDiretorio(caminhoLock, () => {
    const existiaAntes = fs.existsSync(caminhoArquivo);

    let cabecalho;
    let avisoTemplate = null;
    let verbetesExistentes = [];

    if (existiaAntes) {
      const conteudoAtual = fs.readFileSync(caminhoArquivo, 'utf-8');
      const secao = extrairSecaoTermos(conteudoAtual);
      cabecalho = secao.cabecalho;
      verbetesExistentes = parseVerbetes(secao.textoVerbetes);
    } else {
      const lido = lerCabecalhoTemplate();
      cabecalho = lido.cabecalho;
      if (lido.templateAusente) {
        avisoTemplate = 'template de glossario ausente no pacote; cabecalho embutido usado no lugar.';
      }
    }

    const chaveTermo = normalizar(termo);
    const indiceExistente = verbetesExistentes.findIndex((v) => normalizar(v.termo) === chaveTermo);

    let listaFinal;
    let posicaoInsercao;
    let atualizado = false;

    if (indiceExistente !== -1) {
      if (!flags.atualizar) {
        const definicaoAtual = extrairDefinicaoAtual(verbetesExistentes[indiceExistente].bloco);
        throw new Error(
          `Termo nao registrado: "${termo}" ja existe no glossario do projeto, com a definicao: ` +
          `"${definicaoAtual}". Use --atualizar para substituir.`
        );
      }
      const novoBloco = montarBlocoVerbete({ termo, definicao, evitar: flags.evitar, justificativaForcada });
      listaFinal = verbetesExistentes.slice();
      listaFinal[indiceExistente] = { termo, bloco: novoBloco };
      posicaoInsercao = indiceExistente + 1;
      atualizado = true;
    } else {
      const novoVerbete = { termo, bloco: montarBlocoVerbete({ termo, definicao, evitar: flags.evitar, justificativaForcada }) };
      const { lista, posicao } = inserirOrdenado(verbetesExistentes, novoVerbete);
      listaFinal = lista;
      posicaoInsercao = posicao + 1;
    }

    // 4. Escrita. Diretorio garantido aqui, so depois de tudo ter passado.
    fs.mkdirSync(path.dirname(caminhoArquivo), { recursive: true });
    fs.writeFileSync(caminhoArquivo, montarConteudoArquivo(cabecalho, listaFinal), 'utf-8');

    const resultado = {
      termo,
      criado_agora: !existiaAntes,
      atualizado,
      posicao_insercao: posicaoInsercao,
      total_termos: listaFinal.length,
    };
    if (avisoTemplate) resultado.aviso = avisoTemplate;
    if (justificativaForcada) resultado.justificativa_forcada = justificativaForcada;
    return resultado;
  });
}

// =====================================================================
// Leitura: listar, regras (nunca criam arquivo nem diretorio)
// =====================================================================

function listar(cwd) {
  const caminhoArquivo = arquivoGlossarioProjeto(cwd);
  if (!fs.existsSync(caminhoArquivo)) {
    return { termos: [], arquivo_existe: false };
  }
  const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
  const verbetes = parseVerbetes(extrairSecaoTermos(conteudo).textoVerbetes);
  const termos = verbetes.map((v) => ({
    termo: v.termo,
    definicao: extrairDefinicaoAtual(v.bloco),
    evitar: extrairEvitarAtual(v.bloco),
  }));
  return { termos, arquivo_existe: true };
}

function regras(cwd) {
  const caminhoArquivo = arquivoGlossarioProjeto(cwd);
  let cabecalho;
  let fonte;

  if (fs.existsSync(caminhoArquivo)) {
    cabecalho = extrairSecaoTermos(fs.readFileSync(caminhoArquivo, 'utf-8')).cabecalho;
    fonte = 'projeto';
  } else {
    const lido = lerCabecalhoTemplate();
    cabecalho = lido.cabecalho;
    fonte = lido.templateAusente ? 'embutido' : 'template';
  }

  return {
    admissao: extrairRegra(cabecalho, 'Regra de admiss'),
    higiene: extrairRegra(cabecalho, 'Regra de higiene'),
    fonte,
  };
}

// =====================================================================
// Dispatcher
// =====================================================================

function extrairFlagsRegistrar(args) {
  return {
    termo: lerFlag(args, 'termo'),
    definicao: lerFlag(args, 'definicao'),
    evitar: lerFlag(args, 'evitar'),
    atualizar: temFlag(args, 'atualizar'),
    forcar: temFlag(args, 'forcar'),
    justificativa: lerFlag(args, 'justificativa'),
  };
}

function run(cwd, args) {
  const acao = args[0];

  if (acao === 'registrar') {
    const resultado = registrar(cwd, extrairFlagsRegistrar(args));
    const verbo = resultado.atualizado ? 'atualizado' : 'registrado';
    return {
      result: resultado,
      resumo: `Termo "${resultado.termo}" ${verbo} no glossario do projeto (${resultado.total_termos} termo(s) no total).`,
    };
  }

  if (acao === 'listar') {
    const resultado = listar(cwd);
    return {
      result: resultado,
      resumo: `${resultado.termos.length} termo(s) no glossario do projeto.`,
    };
  }

  if (acao === 'regras') {
    const resultado = regras(cwd);
    return {
      result: resultado,
      resumo: `Regras do glossario do projeto lidas (fonte: ${resultado.fonte}).`,
    };
  }

  throw new Error(`Acao desconhecida para memoria termo: "${acao || ''}". Disponiveis: registrar, listar, regras.`);
}

module.exports = {
  CONCEITOS_GERAIS,
  normalizar,
  eConceitoGeral,
  detectarDetalheImplementacao,
  lerCabecalhoTemplate,
  extrairRegra,
  extrairSecaoTermos,
  parseVerbetes,
  extrairDefinicaoAtual,
  extrairEvitarAtual,
  montarBlocoVerbete,
  inserirOrdenado,
  registrar,
  listar,
  regras,
  run,
};
