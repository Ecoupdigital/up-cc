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

// --- Arestas e fronteira ---

/**
 * Normaliza depends_on de um plano contra o inventario da fase.
 * @returns {{ edges: string[], dangling: string[], declared: boolean }}
 * declared=false quando o campo depends_on esta ausente (nao quando lista vazia).
 */
function normalizeEdges(planEntry, inventory, phaseNumber) {
  const hasField = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'depends_on');
  const raw = hasField ? planEntry.depends_on : undefined;
  const declared = hasField; // ausente vs lista vazia
  if (raw == null) {
    return { edges: [], dangling: [], declared: false };
  }
  const list = Array.isArray(raw) ? raw : [raw];
  const known = new Set((inventory.plans || []).map((p) => p.id));
  const selfId = planEntry.id;
  const edges = [];
  const dangling = [];
  for (const item of list) {
    if (item == null || item === '') continue;
    const text = String(item).trim();
    // Canonicaliza como se fosse o resto de um nome PLAN
    const id = canonicalizeId(text, phaseNumber);
    if (id === selfId) {
      dangling.push(text);
      continue;
    }
    if (!known.has(id)) {
      dangling.push(text);
      continue;
    }
    if (!edges.includes(id)) edges.push(id);
  }
  return { edges, dangling, declared };
}

/**
 * Deriva a fronteira de execucao a partir das arestas e do estado (resumo/falho).
 * Funcao pura.
 *
 * @param {{ plans: Array, pairing: {plans}, failed: string[] }}
 */
function deriveFrontier({ plans: planList, pairing, failed }) {
  const failedSet = new Set((failed || []).map(String));
  const pairingById = new Map((pairing.plans || []).map((p) => [p.id, p]));

  // Estado por plano
  const byId = new Map();
  for (const p of planList || []) {
    const paired = pairingById.get(p.id);
    let state = 'pendente';
    if (failedSet.has(p.id)) state = 'falho';
    else if (paired && paired.has_summary) state = 'pronto';
    byId.set(p.id, {
      id: p.id,
      wave: p.wave !== undefined && p.wave !== null && p.wave !== '' ? Number(p.wave) : 1,
      edges: Array.isArray(p.edges) ? p.edges.slice() : [],
      dangling: Array.isArray(p.dangling) ? p.dangling.slice() : [],
      declared: !!p.declared,
      state,
    });
  }

  const all = [...byId.values()];
  const declaredCount = all.filter((p) => p.declared).length;
  let ordering_mode = 'onda';
  if (declaredCount === 0) ordering_mode = 'onda';
  else if (declaredCount === all.length) ordering_mode = 'aresta';
  else ordering_mode = 'misto';

  // Em modo misto: planos sem aresta herdam bloqueadores de onda estritamente menor
  if (ordering_mode === 'misto') {
    for (const p of all) {
      if (p.declared) continue;
      const blockers = all
        .filter((o) => o.id !== p.id && Number(o.wave) < Number(p.wave))
        .map((o) => o.id);
      p.edges = blockers;
    }
  }

  // Em modo onda: fronteira = pendentes da menor wave com pendencia
  // Em modo aresta/misto: pendentes cujos blockers resolvidos estao todos prontos

  function blockersReady(p) {
    for (const b of p.edges) {
      const bp = byId.get(b);
      if (!bp) continue; // dangling ja filtrado
      if (bp.state === 'falho') return { ok: false, reason: 'falho', blocker: b };
      if (bp.state !== 'pronto') return { ok: false, reason: 'pendente', blocker: b };
    }
    return { ok: true };
  }

  // Transitivo: quem depende (direta ou indiretamente) de falho
  function dependsOnFailed(id, seen = new Set()) {
    if (seen.has(id)) return false;
    seen.add(id);
    const p = byId.get(id);
    if (!p) return false;
    for (const b of p.edges) {
      if (failedSet.has(b)) return true;
      if (dependsOnFailed(b, seen)) return true;
    }
    return false;
  }

  const frontier = [];
  const blocked = [];
  const dangling_edges = [];

  for (const p of all) {
    for (const d of p.dangling) {
      dangling_edges.push({ from: p.id, to: d });
    }
  }

  const pending = all.filter((p) => p.state === 'pendente');

  if (ordering_mode === 'onda') {
    const pendingWaves = pending.map((p) => Number(p.wave));
    if (pendingWaves.length > 0) {
      const minWave = Math.min(...pendingWaves);
      for (const p of pending) {
        if (Number(p.wave) === minWave) frontier.push({ id: p.id });
      }
    }
  } else {
    for (const p of pending) {
      if (dependsOnFailed(p.id)) {
        const failBlocker = p.edges.find((b) => failedSet.has(b) || dependsOnFailed(b));
        blocked.push({ id: p.id, reason: 'depends_on_failed', blocker: failBlocker || null });
        continue;
      }
      const br = blockersReady(p);
      if (br.ok) frontier.push({ id: p.id });
      else if (br.reason === 'falho') {
        blocked.push({ id: p.id, reason: 'depends_on_failed', blocker: br.blocker });
      }
    }
  }

  // Ciclo: restam pendentes, nenhum falho os bloqueia, fronteira vazia
  let cycle = [];
  const stillPending = pending.filter((p) => !frontier.some((f) => f.id === p.id) && !blocked.some((b) => b.id === p.id));
  if (frontier.length === 0 && stillPending.length > 0) {
    // Heuristica: todos os stillPending que se referenciam formam ciclo
    cycle = stillPending.map((p) => p.id);
  }

  // Onda derivada: comprimento do caminho de bloqueio mais longo ate o plano
  const derived_waves = {};
  function longestPath(id, stack = new Set()) {
    if (stack.has(id)) return 0;
    const p = byId.get(id);
    if (!p || p.edges.length === 0) return 0;
    stack.add(id);
    let max = 0;
    for (const b of p.edges) {
      if (!byId.has(b)) continue;
      max = Math.max(max, 1 + longestPath(b, stack));
    }
    stack.delete(id);
    return max;
  }
  for (const p of all) {
    if (ordering_mode === 'onda') {
      derived_waves[p.id] = Number(p.wave);
    } else {
      derived_waves[p.id] = longestPath(p.id);
    }
  }

  const hasFailed = all.some((p) => p.state === 'falho');
  const hasPending = pending.length > 0;
  const exhausted = !hasPending && !hasFailed;

  // Ordenar fronteira por id
  frontier.sort((a, b) => String(a.id).localeCompare(String(b.id), 'en', { numeric: true }));

  return {
    frontier,
    blocked,
    dangling_edges,
    cycle,
    exhausted,
    ordering_mode,
    derived_waves,
  };
}

module.exports = {
  classifyPlanFile,
  inventoryPhase,
  pairSummaries,
  normalizeEdges,
  deriveFrontier,
  // helpers exportados para testes e consumidores futuros
  canonicalizeId,
  stripPhasePrefix,
};
