/**
 * perguntas.test.cjs: verificador do contrato de pergunta (up/references/questioning.md).
 * Roda: node up/bin/lib/perguntas.test.cjs [raiz]
 * Sem framework. Le o inventario da referencia, le as superficies declaradas e compara
 * nas duas direcoes. A cada execucao direta (nao via require), roda o proprio caso vermelho
 * contra uma fixture com defeito injetado antes de checar o repositorio real (verde).
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

  const arquivosDistintos = [...new Set(inventario.map((linha) => linha.arquivo))];
  const tagsPorArquivo = {};

  for (const arquivo of arquivosDistintos) {
    if (arquivo === REFERENCIA) {
      for (const linha of inventario.filter((l) => l.arquivo === arquivo)) {
        erros.push({ tipo: 'inventario_aponta_para_si', id: linha.id, arquivo });
      }
      continue;
    }

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
 * Monta uma fixture em diretorio temporario copiando a referencia e todos os arquivos do
 * inventario a partir de `raizReal`, e injeta tres defeitos, cada um num arquivo diferente:
 * tag de abertura apagada, linha Recomendo esvaziada, tag extra nao declarada.
 * Devolve { fixtureDir, defeitosEsperados }.
 */
function construirFixtureComDefeitos(raizReal) {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perguntas-fixture-'));
  const inventario = lerInventario(raizReal);
  const arquivosDistintos = [...new Set(inventario.map((linha) => linha.arquivo))].filter(
    (arquivo) => arquivo !== REFERENCIA
  );

  copiarArquivo(raizReal, fixtureDir, REFERENCIA);
  for (const arquivo of arquivosDistintos) {
    copiarArquivo(raizReal, fixtureDir, arquivo);
  }

  assert.ok(
    arquivosDistintos.length >= 3,
    'fixture precisa de pelo menos 3 arquivos de superficie para injetar 3 defeitos distintos'
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

  return { fixtureDir, defeitosEsperados };
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
      'perguntas: vermelho OK (3 defeitos detectados), verde OK (' +
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
