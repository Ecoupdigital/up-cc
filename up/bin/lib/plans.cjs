/**
 * plans.cjs - canonicalizacao de nomes de plano/resumo e inventario de fase.
 * Um unico ponto decide o que e nome de plano e o que e nome de resumo.
 * Consumido por phase-plan-index e pelos demais inventarios do despachante.
 */
'use strict';

// --- Helpers de nome ---

/**
 * Remove o segmento inicial se ele for o numero da fase (com ou sem zeros a esquerda).
 * Segmento numerico diferente da fase nao e removido.
 */
function stripPhasePrefix(rest, phaseNumber) {
  if (!rest) return '';
  const phaseNum = parseInt(String(phaseNumber), 10);
  if (Number.isNaN(phaseNum)) return rest;
  const segs = rest.split('-');
  if (segs.length === 0) return rest;
  const first = segs[0];
  if (!/^\d+$/.test(first)) return rest;
  const firstNum = parseInt(first, 10);
  if (firstNum === phaseNum) {
    segs.shift();
    return segs.join('-');
  }
  return rest;
}

/**
 * Normaliza o resto apos o rotulo: numerico vira tres digitos; vazio vira 001;
 * nao numerico fica em minusculas.
 */
function canonicalizeId(rest, phaseNumber) {
  let r = stripPhasePrefix(rest || '', phaseNumber);
  if (r === '' || r == null) return '001';
  if (/^\d+$/.test(r)) return r.padStart(3, '0');
  return r.toLowerCase();
}

/**
 * Classifica um nome de arquivo da pasta da fase.
 * @param {string} fileName
 * @param {number|string} phaseNumber
 * @returns {{ label: 'plan'|'summary'|'none', id: string|null, file: string }}
 */
function classifyPlanFile(fileName, phaseNumber) {
  if (typeof fileName !== 'string' || !fileName.toLowerCase().endsWith('.md')) {
    return { label: 'none', id: null, file: fileName };
  }

  const base = fileName.slice(0, -3); // sem .md
  let label = null;
  let rest = null;

  // Ordem: nome so o rotulo; rotulo no comeco; rotulo no fim.
  if (base === 'PLAN') {
    label = 'plan';
    rest = '';
  } else if (base === 'SUMMARY') {
    label = 'summary';
    rest = '';
  } else if (base.startsWith('PLAN-')) {
    label = 'plan';
    rest = base.slice(5);
  } else if (base.startsWith('SUMMARY-')) {
    label = 'summary';
    rest = base.slice(8);
  } else if (base.endsWith('-PLAN')) {
    label = 'plan';
    rest = base.slice(0, -5);
  } else if (base.endsWith('-SUMMARY')) {
    label = 'summary';
    rest = base.slice(0, -8);
  } else {
    return { label: 'none', id: null, file: fileName };
  }

  const id = canonicalizeId(rest, phaseNumber);
  return { label, id, file: fileName };
}

// --- Inventario ---

/**
 * Inventaria planos e resumos a partir da lista de nomes do diretorio.
 * @param {string[]} fileNames
 * @param {number|string} phaseNumber
 * @returns {{ plans: Array<{id,file}>, summaries: Array<{id,file}>, id_conflicts: Array<{id,label,files}> }}
 */
function inventoryPhase(fileNames, phaseNumber) {
  const plans = [];
  const summaries = [];
  const seen = { plan: new Map(), summary: new Map() };
  const id_conflicts = [];

  const names = Array.isArray(fileNames) ? fileNames : [];
  for (const file of names) {
    const c = classifyPlanFile(file, phaseNumber);
    if (c.label === 'none') continue;
    const entry = { id: c.id, file: c.file };
    const coll = c.label === 'plan' ? plans : summaries;
    const map = seen[c.label];
    if (map.has(c.id)) {
      const prev = map.get(c.id);
      const existing = id_conflicts.find(
        (x) => x.id === c.id && x.label === c.label
      );
      if (existing) {
        if (!existing.files.includes(c.file)) existing.files.push(c.file);
      } else {
        id_conflicts.push({
          id: c.id,
          label: c.label,
          files: [prev.file, c.file],
        });
      }
    } else {
      map.set(c.id, entry);
    }
    coll.push(entry);
  }

  const byId = (a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true });
  plans.sort(byId);
  summaries.sort(byId);

  return { plans, summaries, id_conflicts };
}

/**
 * Pareia resumos com planos pelo identificador canonico.
 * @param {{ plans: Array, summaries: Array }} inventory
 * @returns {{ plans: Array<{id,file,has_summary,summary_file}>, orphan_summaries: Array<{id,file}> }}
 */
function pairSummaries(inventory) {
  const summaryById = new Map();
  for (const s of inventory.summaries || []) {
    if (!summaryById.has(s.id)) summaryById.set(s.id, s.file);
  }
  const planIds = new Set((inventory.plans || []).map((p) => p.id));
  const pairedPlans = (inventory.plans || []).map((p) => ({
    id: p.id,
    file: p.file,
    has_summary: summaryById.has(p.id),
    summary_file: summaryById.get(p.id) || null,
  }));
  const orphan_summaries = (inventory.summaries || [])
    .filter((s) => !planIds.has(s.id))
    .map((s) => ({ id: s.id, file: s.file }));

  return { plans: pairedPlans, orphan_summaries };
}

module.exports = {
  classifyPlanFile,
  inventoryPhase,
  pairSummaries,
  // helpers exportados para testes e consumidores futuros
  canonicalizeId,
  stripPhasePrefix,
};
