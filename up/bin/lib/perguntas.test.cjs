/**
 * perguntas.test.cjs: verificador do contrato de pergunta (up/references/questioning.md).
 * Roda: node up/bin/lib/perguntas.test.cjs [raiz]
 * Sem framework. Le o inventario da referencia, le as superficies de uma lista FECHADA
 * (ARQUIVOS_SUPERFICIE, nao derivada do inventario) e compara nas duas direcoes, com piso de
 * contagem em pontos e em superficies distintas. A cada execucao direta (nao via require), roda
 * o proprio caso vermelho contra uma fixture com quatro defeitos injetados antes de checar o
 * repositorio real (verde).
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REFERENCIA = 'up/references/questioning.md';
const ROTULOS_OBRIGATORIOS = ['Pergunta:', 'Recomendo:', 'Porque:'];
const PLACEHOLDERS = ['TBD', 'TODO', 'FIXME'];
const REGEX_INVENTARIO = /^\|\s*([a-z]+\.[a-z0-9-]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
const REGEX_TAG = /<pergunta id="([^"]+)">([\s\S]*?)<\/pergunta>/g;

// Lista fechada dos arquivos de superficie. NAO deriva do inventario: se o inventario perder todas as
// linhas de um arquivo, este arquivo continua sendo lido e as tags dele continuam entrando nas duas
// direcoes de comparacao. Atualizar esta lista e um ato deliberado, nao um efeito colateral de editar a
// tabela do inventario.
const ARQUIVOS_SUPERFICIE = [
  'up/workflows/up.md',
  'up/workflows/plan.md',
  'up/workflows/build.md',
  'up/workflows/auditar.md',
  'up/skills/up-brainstorm/SKILL.md',
];

// Piso de contagem: protege contra inventario que perde linhas, ou uma superficie inteira, sem que o
// texto correspondente pare de existir no produto. Sobe junto com o inventario real quando pontos
// legitimos forem adicionados; nunca desce sozinho.
const PONTOS_MINIMOS = 20;
const SUPERFICIES_MINIMAS = 7;

// Dois niveis acima de up/bin/lib (up/bin -> up -> raiz do repo).
const DEFAULT_RAIZ = path.resolve(__dirname, '..', '..', '..');

/**
 * Le o inventario de `<raiz>/up/references/questioning.md` e devolve
 * [{ id, superficie, arquivo }], na ordem em que aparecem na tabela.
 */
function lerInventario(raiz) {
  const texto = fs.readFileSync(path.join(raiz, REFERENCIA), 'utf-8');
  const linhas = [...texto.matchAll(REGEX_INVENTARIO)];
  return linhas.map(([, id, superficie, arquivo]) => ({
    id: id.trim(),
    superficie: superficie.trim(),
    arquivo: arquivo.trim(),
  }));
}

/** Le as tags <pergunta id="..."> de um arquivo. Devolve [{ id, corpo, fullMatch }]. */
function lerTags(caminho) {
  const texto = fs.readFileSync(caminho, 'utf-8');
  const tags = [...texto.matchAll(REGEX_TAG)].map((m) => ({
    id: m[1],
    corpo: m[2],
    fullMatch: m[0],
  }));
  return { texto, tags };
}

/**
 * Verifica o contrato de pergunta contra uma raiz. Devolve { ok, erros, pontos }.
 * Nao depende de nada alem do sistema de arquivos.
 */
function verificar(raiz) {
  const erros = [];
  const inventario = lerInventario(raiz);

  if (inventario.length < 1) {
    erros.push({ tipo: 'inventario_vazio', id: null, arquivo: REFERENCIA });
    return { ok: false, erros, pontos: 0 };
  }

  const idsVistos = new Set();
  for (const linha of inventario) {
    if (idsVistos.has(linha.id)) {
      erros.push({ tipo: 'id_duplicado', id: linha.id, arquivo: REFERENCIA });
    }
    idsVistos.add(linha.id);
  }

  // A varredura usa a lista FECHADA acima, nao o que sobrou no inventario. Isto e o que fecha o ponto
  // cego: um arquivo desta lista e sempre lido, mesmo que o inventario perca a ultima linha que apontava
  // pra ele.
  const tagsPorArquivo = {};

  for (const linha of inventario) {
    if (linha.arquivo === REFERENCIA) {
      erros.push({ tipo: 'inventario_aponta_para_si', id: linha.id, arquivo: REFERENCIA });
    } else if (!ARQUIVOS_SUPERFICIE.includes(linha.arquivo)) {
      erros.push({ tipo: 'arquivo_fora_da_lista_fechada', id: linha.id, arquivo: linha.arquivo });
    }
  }

  for (const arquivo of ARQUIVOS_SUPERFICIE) {
    const caminho = path.join(raiz, arquivo);
    let texto;
    let tags;
    try {
      ({ texto, tags } = lerTags(caminho));
    } catch (e) {
      erros.push({ tipo: 'arquivo_ausente', id: null, arquivo });
      continue;
    }

    if (!texto.includes(REFERENCIA)) {
      erros.push({ tipo: 'contrato_nao_carregado', id: null, arquivo });
    }

    tagsPorArquivo[arquivo] = tags;
  }

  // Direcao 1: identificador declarado no inventario, ausente no arquivo.
  for (const linha of inventario) {
    if (linha.arquivo === REFERENCIA) continue;
    if (!ARQUIVOS_SUPERFICIE.includes(linha.arquivo)) continue; // ja reportado como arquivo_fora_da_lista_fechada
    const tags = tagsPorArquivo[linha.arquivo] || [];
    const achou = tags.some((tag) => tag.id === linha.id);
    if (!achou) {
      erros.push({ tipo: 'id_declarado_sem_tag', id: linha.id, arquivo: linha.arquivo });
    }
  }

  // Direcao 2: tag no arquivo, ausente do inventario.
  const idsInventario = new Set(inventario.map((linha) => linha.id));
  for (const arquivo of Object.keys(tagsPorArquivo)) {
    for (const tag of tagsPorArquivo[arquivo]) {
      if (!idsInventario.has(tag.id)) {
        erros.push({ tipo: 'tag_sem_declaracao', id: tag.id, arquivo });
      }
    }
  }

  // Rotulos obrigatorios e placeholder, tag a tag.
  for (const arquivo of Object.keys(tagsPorArquivo)) {
    for (const tag of tagsPorArquivo[arquivo]) {
      for (const rotulo of ROTULOS_OBRIGATORIOS) {
        const regexRotulo = new RegExp('^' + rotulo.replace(':', '\\:') + '[ \\t]*(.*)$', 'm');
        const encontrado = tag.corpo.match(regexRotulo);
        const conteudo = encontrado ? encontrado[1].trim() : '';
        if (conteudo.length < 3) {
          erros.push({ tipo: 'rotulo_vazio', id: tag.id, arquivo, rotulo });
        }
      }
      for (const placeholder of PLACEHOLDERS) {
        if (tag.corpo.includes(placeholder)) {
          erros.push({ tipo: 'placeholder', id: tag.id, arquivo, termo: placeholder });
        }
      }
    }
  }

  // Piso de contagem: pontos e superficies sao COMPARADOS com o esperado, nao so reportados. Isto e o que
  // pega uma superficie inteira desaparecendo do inventario mesmo quando a superficie nao tem mais
  // nenhuma linha (e por isso nenhuma tag orfa direta): o total cai abaixo do piso e reprova sozinho.
  if (inventario.length < PONTOS_MINIMOS) {
    erros.push({
      tipo: 'pontos_abaixo_do_piso',
      id: null,
      arquivo: REFERENCIA,
      esperado: PONTOS_MINIMOS,
      encontrado: inventario.length,
    });
  }

  const superficiesDistintas = new Set(inventario.map((linha) => linha.superficie));
  if (superficiesDistintas.size < SUPERFICIES_MINIMAS) {
    erros.push({
      tipo: 'superficies_abaixo_do_piso',
      id: null,
      arquivo: REFERENCIA,
      esperado: SUPERFICIES_MINIMAS,
      encontrado: superficiesDistintas.size,
    });
  }

  return { ok: erros.length === 0, erros, pontos: inventario.length };
}

/** Copia um arquivo relativo preservando a estrutura de diretorios. */
function copiarArquivo(origemRaiz, destRaiz, relativo) {
  const origem = path.join(origemRaiz, relativo);
  const destino = path.join(destRaiz, relativo);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
}

/**
 * Monta uma fixture em diretorio temporario copiando a referencia e TODOS os arquivos da lista fechada
 * (ARQUIVOS_SUPERFICIE, nao o que sobrou no inventario) a partir de `raizReal`, e injeta quatro defeitos:
 * tag de abertura apagada, linha Recomendo esvaziada, tag extra nao declarada, e uma superficie inteira
 * apagada do inventario com as tags dela intactas no arquivo (o ponto cego que a fase 13 deixou passar).
 * Devolve { fixtureDir, defeitosEsperados, idsSuperficieRemovida }.
 */
function construirFixtureComDefeitos(raizReal) {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perguntas-fixture-'));
  const inventario = lerInventario(raizReal);

  copiarArquivo(raizReal, fixtureDir, REFERENCIA);
  for (const arquivo of ARQUIVOS_SUPERFICIE) {
    copiarArquivo(raizReal, fixtureDir, arquivo);
  }

  const arquivosDistintos = ARQUIVOS_SUPERFICIE;
  assert.ok(
    arquivosDistintos.length >= 3,
    'fixture precisa de pelo menos 3 arquivos de superficie para injetar os defeitos 1 a 3'
  );

  const defeitosEsperados = [];

  // Defeito 1: apagar a tag de abertura do primeiro ponto do primeiro arquivo.
  const arquivo1 = arquivosDistintos[0];
  const caminho1 = path.join(fixtureDir, arquivo1);
  const lido1 = lerTags(caminho1);
  const alvo1 = lido1.tags[0];
  const abertura1 = '<pergunta id="' + alvo1.id + '">';
  fs.writeFileSync(caminho1, lido1.texto.replace(abertura1, ''));
  defeitosEsperados.push('id_declarado_sem_tag');

  // Defeito 2: esvaziar a linha Recomendo do primeiro ponto do segundo arquivo.
  const arquivo2 = arquivosDistintos[1];
  const caminho2 = path.join(fixtureDir, arquivo2);
  const lido2 = lerTags(caminho2);
  const alvo2 = lido2.tags[0];
  const corpoNovo2 = alvo2.corpo.replace(/^Recomendo:.*$/m, 'Recomendo:');
  const tagNova2 = '<pergunta id="' + alvo2.id + '">' + corpoNovo2 + '</pergunta>';
  fs.writeFileSync(caminho2, lido2.texto.replace(alvo2.fullMatch, tagNova2));
  defeitosEsperados.push('rotulo_vazio');

  // Defeito 3: acrescentar uma tag extra, nao declarada no inventario, no terceiro arquivo.
  const arquivo3 = arquivosDistintos[2];
  const caminho3 = path.join(fixtureDir, arquivo3);
  const tagExtra =
    '\n<pergunta id="teste.extra">\n' +
    'Pergunta: Isto e um defeito injetado pela prova vermelha do verificador.\n' +
    'Recomendo: Ignorar este ponto, ele nao existe no inventario real.\n' +
    'Porque: Fixture da fase 13, plano 005, tarefa 2.\n' +
    '</pergunta>\n';
  fs.appendFileSync(caminho3, tagExtra);
  defeitosEsperados.push('tag_sem_declaracao');

  // Defeito 4: apagar do inventario TODAS as linhas de uma superficie inteira (up/workflows/auditar.md),
  // mantendo as tags do arquivo intocadas. Este e o ponto cego reproduzido na verificacao da fase 13:
  // superficie inteira some do inventario, e a comparacao antiga nunca chegava a ler as tags dela porque
  // a lista de arquivos a varrer vinha do proprio inventario. Com ARQUIVOS_SUPERFICIE fixo, o arquivo
  // continua sendo lido e as tags orfas viram erro (alem do piso de pontos/superficies cair).
  const arquivoAlvo4 = 'up/workflows/auditar.md';
  const linhasAlvo4 = inventario.filter((linha) => linha.arquivo === arquivoAlvo4);
  assert.ok(
    linhasAlvo4.length > 0,
    'fixture precisa de ao menos 1 linha de inventario para "' + arquivoAlvo4 + '" para injetar o defeito 4'
  );
  const caminhoReferenciaFixture = path.join(fixtureDir, REFERENCIA);
  const textoReferenciaAntes = fs.readFileSync(caminhoReferenciaFixture, 'utf-8');
  let textoReferenciaDepois = textoReferenciaAntes;
  for (const linha of linhasAlvo4) {
    const idEscapado = linha.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexLinha = new RegExp('^\\|[^\\n]*\\b' + idEscapado + '\\b[^\\n]*\\n?', 'm');
    textoReferenciaDepois = textoReferenciaDepois.replace(regexLinha, '');
  }
  assert.notStrictEqual(
    textoReferenciaDepois,
    textoReferenciaAntes,
    'defeito 4: a remocao das linhas de "' + arquivoAlvo4 + '" nao alterou o inventario da fixture'
  );
  fs.writeFileSync(caminhoReferenciaFixture, textoReferenciaDepois);
  defeitosEsperados.push('tag_sem_declaracao');
  defeitosEsperados.push('pontos_abaixo_do_piso');
  defeitosEsperados.push('superficies_abaixo_do_piso');

  const idsSuperficieRemovida = linhasAlvo4.map((linha) => linha.id);

  return { fixtureDir, defeitosEsperados, idsSuperficieRemovida };
}

function main() {
  const raizReal = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_RAIZ;
  let fixtureDir = null;

  try {
    const construido = construirFixtureComDefeitos(raizReal);
    fixtureDir = construido.fixtureDir;

    const resultadoVermelho = verificar(fixtureDir);
    assert.strictEqual(
      resultadoVermelho.ok,
      false,
      'vermelho: o verificador deveria reprovar a fixture com defeito injetado'
    );
    const tiposEncontrados = new Set(resultadoVermelho.erros.map((erro) => erro.tipo));
    for (const tipoEsperado of construido.defeitosEsperados) {
      assert.ok(
        tiposEncontrados.has(tipoEsperado),
        'vermelho: esperava o erro "' +
          tipoEsperado +
          '", erros encontrados: ' +
          JSON.stringify(resultadoVermelho.erros)
      );
    }

    // Defeito 4 nao pode passar so pelo tipo bater por coincidencia com o defeito 3: confirma que os IDS
    // especificos da superficie inteira removida do inventario aparecem como tag_sem_declaracao.
    const idsComTagSemDeclaracao = new Set(
      resultadoVermelho.erros.filter((erro) => erro.tipo === 'tag_sem_declaracao').map((erro) => erro.id)
    );
    for (const idRemovido of construido.idsSuperficieRemovida) {
      assert.ok(
        idsComTagSemDeclaracao.has(idRemovido),
        'vermelho: defeito 4 (superficie inteira removida do inventario) deveria reprovar o id "' +
          idRemovido +
          '", erros encontrados: ' +
          JSON.stringify(resultadoVermelho.erros)
      );
    }

    console.log(
      'vermelho: ' +
        resultadoVermelho.erros.length +
        ' erro(s) detectado(s) -> ' +
        [...tiposEncontrados].join(', ')
    );

    const resultadoVerde = verificar(raizReal);
    if (!resultadoVerde.ok) {
      console.error('verde FALHOU. Erros encontrados no repositorio real:');
      for (const erro of resultadoVerde.erros) {
        console.error('  ' + JSON.stringify(erro));
      }
      process.exitCode = 1;
      return;
    }

    console.log(
      'perguntas: vermelho OK (4 defeitos detectados), verde OK (' +
        resultadoVerde.pontos +
        ' pontos verificados)'
    );
  } catch (erro) {
    console.error('FALHOU: ' + erro.message);
    process.exitCode = 1;
  } finally {
    if (fixtureDir) {
      fs.rmSync(fixtureDir, { recursive: true, force: true });
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { verificar, lerInventario, DEFAULT_RAIZ };
