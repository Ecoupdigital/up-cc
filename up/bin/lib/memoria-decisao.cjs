/**
 * memoria-decisao.cjs — Registro de decisao deterministico (Fase 14, submodulo `decisao`
 * do espaco de comando `memoria`).
 *
 * So grava decisao que passa o gate das tres condicoes em E logico: dificil de reverter,
 * surpreendente sem contexto e resultado de trade-off real (com alternativas genuinas
 * rejeitadas e o motivo de cada uma). Faltou uma condicao, nao escreve nada — nem o
 * diretorio de decisoes e criado (criacao preguicosa).
 *
 * Numeracao deterministica: sempre a maior existente mais um, calculada por varredura do
 * diretorio a cada chamada (nunca um contador guardado em arquivo). Buraco na sequencia
 * (numero apagado ou nunca usado) nao e preenchido.
 *
 * Acoes: proximo-numero, listar. (criar e status chegam nas tarefas 3 e 4.)
 */

const fs = require('fs');
const path = require('path');
const { dirDecisoes } = require('./memoria.cjs');

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
// Dispatcher
// =====================================================================

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

  throw new Error(`Acao desconhecida para memoria decisao: "${acao || ''}". Disponiveis: proximo-numero, listar, criar, status.`);
}

module.exports = {
  listarRegistros,
  proximoNumero,
  formatarNumero,
  extrairFrontmatterSimples,
  run,
};
