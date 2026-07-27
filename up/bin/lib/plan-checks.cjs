/**
 * plan-checks.cjs - harness de checagem de planos (adjetivos, contagem, estimativa).
 * Nao le disco e nao escreve: quem chama entrega o texto do alvo e o da doutrina.
 */
'use strict';

// --- Constantes de janela (espelham a doutrina) ---

const WINDOW_BUDGET_TOKENS = 100_000;
const CHARS_PER_TOKEN = 4;
const RESERVE_TOKENS = 30_000;
const CONTEXT_CEILING_TOKENS = 70_000;

// Termos de medida: frase so vira ocorrencia se tiver adjetivo E um destes.
const MEASURE_TERMS = [
  'tamanho',
  'quantidade',
  'número',
  'numero',
  'limite',
  'máximo de',
  'maximo de',
  'mínimo de',
  'minimo de',
  'até',
  'ate',
  'por plano',
  'por tarefa',
  'por fase',
];

// --- Helpers ---

function stripAccents(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extrai a lista fechada de adjetivos do bloco da doutrina.
 * @returns {string[]|null} null se doutrina ausente; [] se bloco vazio
 */
function parseAdjectiveList(doctrineText) {
  if (doctrineText == null || doctrineText === '') return null;
  const m = doctrineText.match(/```adjetivos-proibidos-tamanho\s*\n([\s\S]*?)```/i);
  if (!m) {
    // fallback: se o marcador nao existir, tentar lista com bullets apos "lista fechada"
    return null;
  }
  return m[1]
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('//'));
}

/**
 * Remove blocos marcados como exemplo ruim (varias grafias aceitas).
 */
function maskBadExamples(text) {
  let t = text;
  // HTML-ish comments
  t = t.replace(/<!--\s*exemplo ruim[\s\S]*?<!--\s*\/exemplo ruim\s*-->/gi, (m) => ' '.repeat(m.length));
  t = t.replace(/<!--\s*exemplo ruim[\s\S]*?-->/gi, (m) => ' '.repeat(m.length));
  // Secoes markdown
  t = t.replace(
    /(?:^|\n)#{1,4}\s*exemplo ruim[\s\S]*?(?=(?:\n#{1,4}\s)|\n## |\n# |$)/gi,
    (m) => '\n' + ' '.repeat(Math.max(0, m.length - 1))
  );
  // Marcador inline da doutrina futura
  t = t.replace(
    /(?:^|\n)\s*(?:\*\*)?exemplo ruim(?:\*\*)?:[\s\S]*?(?=(?:\n\s*(?:\*\*)?exemplo bom)|\n## |\n# |$)/gi,
    (m) => '\n' + ' '.repeat(Math.max(0, m.length - 1))
  );
  return t;
}

/**
 * Divide texto em frases aproximadas (pontuacao forte ou quebra de linha dupla).
 */
function splitSentences(text) {
  const parts = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '.' || ch === '!' || ch === '?' || ch === '\n') {
      // quebra em newline simples tambem (linhas de frontmatter / bullets)
      if (ch === '\n' || i + 1 === text.length || /[\s\n]/.test(text[i + 1] || ' ')) {
        const slice = text.slice(start, i + 1);
        if (slice.trim()) parts.push({ text: slice, start });
        start = i + 1;
      }
    }
  }
  if (start < text.length) {
    const slice = text.slice(start);
    if (slice.trim()) parts.push({ text: slice, start });
  }
  return parts;
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

function hasNumber(sentence) {
  // Digitos arabicos contam. "um/uma" nao contam (sao artigo com muita frequencia).
  if (/\d/.test(sentence)) return true;
  const words = [
    'zero', 'dois', 'duas', 'tres', 'três', 'quatro', 'cinco',
    'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quinze',
    'vinte', 'trinta', 'cem', 'mil',
  ];
  const lower = stripAccents(sentence.toLowerCase());
  return words.some((w) => new RegExp(`\\b${stripAccents(w)}\\b`, 'i').test(lower));
}

function hasMeasureTerm(sentence) {
  const lower = stripAccents(sentence.toLowerCase());
  return MEASURE_TERMS.some((term) => lower.includes(stripAccents(term.toLowerCase())));
}

// --- Regras ---

/**
 * @returns {{ unavailable?: boolean, occurrences: Array<{line,excerpt,rule,adjective?}> }}
 */
function checkAdjectives(text, doctrineText) {
  const list = parseAdjectiveList(doctrineText);
  if (list == null) {
    return { unavailable: true, occurrences: [] };
  }
  if (list.length === 0) {
    // lista vazia nao e "ausente", mas aprovaria tudo; tratamos como unavailable
    return { unavailable: true, occurrences: [] };
  }

  const masked = maskBadExamples(text || '');
  const sentences = splitSentences(masked);
  const occurrences = [];
  const listNorm = list.map((a) => ({ raw: a, norm: stripAccents(a.toLowerCase()) }));

  for (const sent of sentences) {
    if (!hasMeasureTerm(sent.text)) continue;
    if (hasNumber(sent.text)) continue;
    const sentNorm = stripAccents(sent.text.toLowerCase());
    for (const adj of listNorm) {
      const re = new RegExp(`\\b${adj.norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (re.test(sentNorm)) {
        occurrences.push({
          line: lineNumberAt(text, sent.start),
          excerpt: sent.text.trim().slice(0, 160),
          rule: 'adjectives',
          adjective: adj.raw,
        });
        break; // uma ocorrencia por frase basta
      }
    }
  }
  return { unavailable: false, occurrences };
}

/**
 * Contagem unica de tarefas: maior entre formas, nunca a soma.
 */
function countTasks(text) {
  const t = text || '';
  // Tags XML reais no inicio da linha (mencoes em prosa com <task nao contam)
  const xml = (t.match(/^\s*<task[\s>]/gim) || []).length;
  // Titulos numerados: ### 1. / ## Task 1 / ### Tarefa 1
  const numberedHeadings = (t.match(/^#{1,4}\s+(?:Task|Tarefa)?\s*\d+[.:)]?\s/gim) || []).length;
  const numberedBare = (t.match(/^#{1,4}\s+\d+[.:)]\s/gm) || []).length;
  const taskWord = (t.match(/^#{1,4}\s+(?:Task|Tarefa)\s+\d+/gim) || []).length;
  const bullets = (t.match(/^[-*]\s+\d+[.:)]\s/gm) || []).length;
  return Math.max(xml, numberedHeadings, numberedBare, taskWord, bullets);
}

/**
 * Estimativa deterministica de janela.
 * @param {{ planBytes: number, contextBytes: number }}
 */
function estimateWindow({ planBytes, contextBytes }) {
  const planTokens = Math.ceil((planBytes || 0) / CHARS_PER_TOKEN);
  const contextTokens = Math.ceil((contextBytes || 0) / CHARS_PER_TOKEN);
  const total = planTokens + contextTokens + RESERVE_TOKENS;
  return {
    window_estimate_tokens: total,
    window_budget_tokens: WINDOW_BUDGET_TOKENS,
    window_percent: Math.round((total / WINDOW_BUDGET_TOKENS) * 1000) / 10,
    window_over_ceiling: contextTokens > CONTEXT_CEILING_TOKENS || total > WINDOW_BUDGET_TOKENS,
    plan_tokens: planTokens,
    context_tokens: contextTokens,
    reserve_tokens: RESERVE_TOKENS,
    context_ceiling_tokens: CONTEXT_CEILING_TOKENS,
  };
}

/**
 * Detecta plan_schema no frontmatter.
 */
function schemaVersion(text) {
  const m = (text || '').match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return 0;
  const sm = m[1].match(/^\s*plan_schema\s*:\s*(\d+)/m);
  return sm ? parseInt(sm[1], 10) : 0;
}

/**
 * Campos isentos da varredura de caminho (trava de escopo do executor).
 * Linhas que casam estes padroes nao geram ocorrencia de caminho.
 */
const EXEMPT_PATH_LINE = [
  /^\s*files_modified\s*:/i,
  /^\s*-\s*["']?[\w./-]+\.(cjs|js|md|ts|tsx|json)/i, // item de lista de files no frontmatter
  /<files>/i,
  /<\/files>/i,
  /^\s*-\s+path:\s+/i,
  /^\s*surface:\s+/i,
];

/**
 * Detecta caminhos de arquivo e blocos de codigo.
 * @returns {{ occurrences: Array }}
 */
function checkDurability(text, doctrineText) {
  const occurrences = [];
  const original = text || '';
  // Mascarar exemplos ruins e campos isentos antes de varrer caminhos/blocos
  let masked = maskBadExamples(original);

  // Frontmatter inteiro isento (preserva newlines para nao deslocar linhas)
  const blankKeepNl = (m) => m.replace(/[^\n]/g, ' ');
  masked = masked.replace(/^---\s*\n[\s\S]*?\n---/, blankKeepNl);
  // Secoes <files>...</files> isentas
  masked = masked.replace(/<files>[\s\S]*?<\/files>/gi, blankKeepNl);
  // Referencias @caminho em contexto
  masked = masked.replace(/@[\w./-]+/g, (m) => ' '.repeat(m.length));

  const lines = masked.split('\n');
  const origLines = original.split('\n');

  // 1) Blocos cercados
  let inFence = false;
  let fenceStart = -1;
  let fenceHasPrototype = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      if (!inFence) {
        inFence = true;
        fenceStart = i;
        // linha imediatamente anterior
        const prev = i > 0 ? origLines[i - 1] : '';
        fenceHasPrototype = /origem\s+prot[oó]tipo/i.test(prev);
      } else {
        inFence = false;
        if (!fenceHasPrototype) {
          occurrences.push({
            line: fenceStart + 1,
            excerpt: (origLines[fenceStart] || '').trim().slice(0, 120),
            rule: 'durability_codeblock',
            kind: 'codeblock',
          });
        } else {
          // mesmo com prototipo, caminhos dentro do bloco contam
          for (let j = fenceStart; j <= i; j++) {
            const pathHits = findPaths(origLines[j] || '');
            for (const hit of pathHits) {
              occurrences.push({
                line: j + 1,
                excerpt: hit.slice(0, 120),
                rule: 'durability_path',
                kind: 'path',
              });
            }
          }
        }
        fenceStart = -1;
        fenceHasPrototype = false;
      }
      continue;
    }
  }

  // 2) Caminhos fora de fence (e fora de exemplos mascarados)
  inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    // linha mascarada (so espacos) = isenta
    if (!line.replace(/\s/g, '').length && (origLines[i] || '').length) continue;
    if (EXEMPT_PATH_LINE.some((re) => re.test(origLines[i] || ''))) continue;
    // skip lines that were fully masked
    if (line.trim() === '' && (origLines[i] || '').trim() !== '') continue;
    const pathHits = findPaths(line);
    for (const hit of pathHits) {
      // URL com esquema nao conta
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(hit)) continue;
      occurrences.push({
        line: i + 1,
        excerpt: hit.slice(0, 120),
        rule: 'durability_path',
        kind: 'path',
      });
    }
  }

  return { occurrences };
}

/**
 * Encontra candidatos a caminho de arquivo em uma linha.
 */
function findPaths(line) {
  if (!line) return [];
  // Ignorar URLs: remover trechos com esquema
  const noUrl = line.replace(/[a-z][a-z0-9+.-]*:\/\/\S+/gi, ' ');
  const hits = [];
  // ./path, ../path, /abs, ~/path, path/with.ext
  const re = /(?:\.\.?\/|~\/|\/)?(?:[\w.-]+\/)+[\w.-]+\.[\w]+|(?:\.\.?\/|~\/)[\w./-]+/g;
  let m;
  while ((m = re.exec(noUrl)) !== null) {
    hits.push(m[0]);
  }
  // tambem segment simples tipo up/bin/x.cjs sem ./ 
  const re2 = /\b[\w.-]+(?:\/[\w.-]+)+\.[\w]+\b/g;
  while ((m = re2.exec(noUrl)) !== null) {
    if (!hits.includes(m[0])) hits.push(m[0]);
  }
  return hits;
}

/**
 * Secao obrigatoria de fora de escopo: existe, unica, com pelo menos um item.
 */
function checkRequiredSections(text) {
  const occurrences = [];
  const t = text || '';
  const re = /^#{1,3}\s*Fora de escopo\s*$/gim;
  const matches = [];
  let m;
  while ((m = re.exec(t)) !== null) {
    matches.push({ index: m.index, line: lineNumberAt(t, m.index) });
  }
  if (matches.length === 0) {
    occurrences.push({
      line: 1,
      excerpt: 'secao "Fora de escopo" ausente',
      rule: 'required_sections',
    });
    return { occurrences };
  }
  if (matches.length > 1) {
    occurrences.push({
      line: matches[1].line,
      excerpt: 'secao "Fora de escopo" duplicada',
      rule: 'required_sections',
    });
  }
  // Conteudo ate a proxima secao ##
  const start = matches[0].index;
  const after = t.slice(start);
  const next = after.search(/\n#{1,3}\s+\S/);
  const body = next === -1 ? after : after.slice(0, next);
  // Item: bullet (-/*) ou lista numerada (1. texto)
  const items = body.split('\n').filter((l) =>
    /^\s*[-*]\s+\S+/.test(l) || /^\s*\d+[.)]\s+\S+/.test(l)
  );
  if (items.length === 0) {
    occurrences.push({
      line: matches[0].line,
      excerpt: 'secao "Fora de escopo" vazia (sem itens)',
      rule: 'required_sections',
    });
  }
  return { occurrences };
}

/**
 * @param {{ text, name, rules: string[], doctrineText }}
 * @returns {{ verdict: 'pass'|'fail'|'unavailable', counts, occurrences }}
 */
function runChecks({ text, name, rules, doctrineText }) {
  const schema = schemaVersion(text);
  const strict = schema >= 2;
  const occurrences = [];
  let unavailable = false;

  const ruleList = Array.isArray(rules) ? rules : ['adjectives'];
  for (const rule of ruleList) {
    if (rule === 'adjectives') {
      const r = checkAdjectives(text, doctrineText);
      if (r.unavailable) {
        unavailable = true;
      } else {
        for (const o of r.occurrences) {
          occurrences.push({
            ...o,
            rule: 'adjectives',
            severity: strict ? 'fail' : 'warn',
            file: name || null,
          });
        }
      }
    } else if (rule === 'durability') {
      const r = checkDurability(text, doctrineText);
      for (const o of r.occurrences) {
        occurrences.push({
          ...o,
          severity: strict ? 'fail' : 'warn',
          file: name || null,
        });
      }
    } else if (rule === 'required_sections') {
      const r = checkRequiredSections(text);
      for (const o of r.occurrences) {
        occurrences.push({
          ...o,
          severity: strict ? 'fail' : 'warn',
          file: name || null,
        });
      }
    }
  }

  const failCount = occurrences.filter((o) => o.severity === 'fail').length;
  const warnCount = occurrences.filter((o) => o.severity === 'warn').length;

  let verdict = 'pass';
  if (unavailable) verdict = 'unavailable';
  else if (failCount > 0) verdict = 'fail';

  return {
    verdict,
    counts: {
      total: occurrences.length,
      fail: failCount,
      warnings: warnCount,
      warn: warnCount,
    },
    occurrences,
  };
}

module.exports = {
  runChecks,
  checkAdjectives,
  checkDurability,
  checkRequiredSections,
  countTasks,
  estimateWindow,
  parseAdjectiveList,
  maskBadExamples,
  WINDOW_BUDGET_TOKENS,
  CHARS_PER_TOKEN,
  RESERVE_TOKENS,
  CONTEXT_CEILING_TOKENS,
};
