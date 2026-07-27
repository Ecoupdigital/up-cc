/**
 * gate.test.cjs - testes do leitor unico do log de aprovacoes (PROVA-04).
 *
 * Fronteira: subcomando `gate` da CLI (subprocesso via runUpToolsJson).
 * Nao importa gate.cjs diretamente.
 *
 * Cobre os tres pontos de quebra do gate antigo:
 * 1. seletor (fase=N sem coluna de agente)
 * 2. posicao (veredito nao e evidencia)
 * 3. vocabulario (smoke:pass, test:red-green)
 *
 * Roda: node up/bin/lib/gate.test.cjs
 */
'use strict';

const assert = require('assert');
const path = require('path');
const {
  runUpTools,
  runUpToolsJson,
  mkTempProject,
  cleanup,
  runner,
} = require('./test-helpers.cjs');

const FIXTURE_LOG = `{
  "timestamp": "2026-07-09T03:16:35.697Z"
2026-07-09T03:16:43Z | fase=11 plano=001 | APPROVED | evidence=smoke:pass | grok inspect lista 7 up-* [claude]; doutrina+slash intactos
2026-07-09T03:22:33Z | fase=12 plano=001 | APPROVED | evidence=test:red-green | finishPhase solo: RED action=none -> GREEN action=merged; local segue no-op
2026-05-30T14:00:00Z | phase-3 | up-revisor | APPROVE | filtro ok | evidence=logic:test_pass
2026-05-30T14:10:00Z | planning | up-revisor | APPROVE | confidence=88
`;

const { t, done } = runner();

function withLog(extraLines) {
  const content = extraLines ? FIXTURE_LOG + extraLines : FIXTURE_LOG;
  return mkTempProject({ '.plano/governance/approvals.log': content });
}

// 1. Seletor: acha a fase 11 sem coluna de agente
t('seletor: acha a fase 11 sem coluna de agente', () => {
  const dir = withLog();
  try {
    const r = runUpToolsJson(['gate', 'verdict', '--phase', '11'], dir);
    assert.strictEqual(r.__parse_error, undefined, 'parse: ' + (r.stdout || r.stderr || ''));
    assert.strictEqual(r.found, true, 'found deve ser true; saida=' + JSON.stringify(r));
  } finally {
    cleanup(dir);
  }
});

// 2. Posicao: veredito nao e evidencia
t('posicao: veredito nao e evidencia', () => {
  const dir = withLog();
  try {
    const r = runUpToolsJson(['gate', 'verdict', '--phase', '11'], dir);
    assert.strictEqual(r.decision, 'APPROVE', 'decision deve ser APPROVE; got=' + r.decision);
    assert.notStrictEqual(
      r.decision,
      'evidence=smoke:pass',
      'ponto 2: awk por posicao pegaria a evidencia como veredito'
    );
  } finally {
    cleanup(dir);
  }
});

// 3. Vocabulario: smoke:pass normaliza para glue
t('vocabulario: smoke:pass normaliza para glue', () => {
  const dir = withLog();
  try {
    const r = runUpToolsJson(['gate', 'verdict', '--phase', '11'], dir);
    assert.ok(Array.isArray(r.evidence_types), 'evidence_types deve ser array');
    assert.ok(r.evidence_types.includes('glue'), 'evidence_types deve conter glue; got=' + JSON.stringify(r.evidence_types));
    assert.ok(Array.isArray(r.evidence) && r.evidence.length >= 1, 'evidence deve ter itens');
    assert.strictEqual(r.evidence[0].result, 'pass', 'result deve ser pass');
  } finally {
    cleanup(dir);
  }
});

// 4. Vocabulario: test:red-green normaliza para logic
t('vocabulario: test:red-green normaliza para logic', () => {
  const dir = withLog();
  try {
    const r = runUpToolsJson(['gate', 'verdict', '--phase', '12'], dir);
    assert.ok(r.evidence_types && r.evidence_types.includes('logic'),
      'evidence_types deve conter logic; got=' + JSON.stringify(r.evidence_types));
  } finally {
    cleanup(dir);
  }
});

// 5. Forma canonica de seis colunas continua lida
t('forma canonica de seis colunas continua lida', () => {
  const dir = withLog();
  try {
    const r = runUpToolsJson(['gate', 'verdict', '--phase', '3'], dir);
    assert.strictEqual(r.decision, 'APPROVE');
    assert.strictEqual(r.agent, 'up-revisor');
    assert.ok(r.evidence_types && r.evidence_types.includes('logic'));
  } finally {
    cleanup(dir);
  }
});

// 6. Fragmento sem veredito e ignorado
t('fragmento sem veredito e ignorado', () => {
  const dir = withLog();
  try {
    const r = runUpToolsJson(['gate', 'entries'], dir);
    assert.ok(Array.isArray(r.ignored), 'ignored deve ser array');
    assert.ok(r.ignored.length >= 2, 'ignored.length >= 2; got=' + r.ignored.length);
    // Nenhuma ENTRADA aceita (entries) deve ser o fragmento de JSON
    for (const e of r.entries || []) {
      assert.ok(!(e.raw || '').trimStart().startsWith('{'),
        'nenhuma entrada cujo raw comece com {; got=' + e.raw);
    }
  } finally {
    cleanup(dir);
  }
});

// 7. Fase inexistente nao explode
t('fase inexistente nao explode', () => {
  const dir = withLog();
  try {
    const raw = runUpTools(['gate', 'verdict', '--phase', '99'], dir);
    assert.strictEqual(raw.exitCode, 0, 'exit code deve ser 0 (fail-open); got=' + raw.exitCode + ' stderr=' + raw.stderr);
    const r = runUpToolsJson(['gate', 'verdict', '--phase', '99'], dir);
    assert.strictEqual(r.found, false);
    assert.strictEqual(r.pass, false);
    assert.ok(Array.isArray(r.reasons) && r.reasons.includes('no_entry'),
      'reasons deve conter no_entry; got=' + JSON.stringify(r.reasons));
  } finally {
    cleanup(dir);
  }
});

// 8. Escopo nao numerico
t('escopo nao numerico', () => {
  const dir = withLog();
  try {
    const r = runUpToolsJson(['gate', 'verdict', '--scope', 'planning'], dir);
    assert.strictEqual(r.found, true);
    assert.strictEqual(r.decision, 'APPROVE');
  } finally {
    cleanup(dir);
  }
});

// 9. Campo escalar
t('campo escalar', () => {
  const dir = withLog();
  try {
    const r = runUpTools(['gate', 'verdict', '--phase', '11', '--field', 'decision'], dir);
    assert.strictEqual(r.success, true, 'deve sair 0; stderr=' + r.stderr);
    assert.strictEqual(r.stdout.trim(), 'APPROVE', 'deve imprimir APPROVE sem JSON; got=' + JSON.stringify(r.stdout));
    assert.ok(!r.stdout.includes('{'), 'nao deve ter chaves de JSON');
  } finally {
    cleanup(dir);
  }
});

// 10. Evidencia esperada casa e nao casa
t('evidencia esperada casa e nao casa', () => {
  const dir = withLog();
  try {
    const ok = runUpTools(
      ['gate', 'verdict', '--phase', '12', '--expect-evidence', 'logic', '--field', 'pass'],
      dir
    );
    assert.strictEqual(ok.stdout.trim(), 'true', 'logic deve passar; got=' + ok.stdout);
    const no = runUpTools(
      ['gate', 'verdict', '--phase', '12', '--expect-evidence', 'ui', '--field', 'pass'],
      dir
    );
    assert.strictEqual(no.stdout.trim(), 'false', 'ui deve falhar; got=' + no.stdout);
  } finally {
    cleanup(dir);
  }
});

// 11. Log inexistente nao explode
t('log inexistente nao explode', () => {
  const dir = mkTempProject({});
  try {
    const raw = runUpTools(['gate', 'verdict', '--phase', '1'], dir);
    assert.strictEqual(raw.exitCode, 0, 'exit 0; stderr=' + raw.stderr);
    const r = runUpToolsJson(['gate', 'verdict', '--phase', '1'], dir);
    assert.strictEqual(r.found, false);
  } finally {
    cleanup(dir);
  }
});

// 12. Ultima decisao vence
t('ultima decisao vence', () => {
  const extra =
    '2026-06-01T10:00:00Z | phase-5 | up-revisor | APPROVE | ok | evidence=logic:test_pass\n' +
    '2026-06-01T11:00:00Z | phase-5 | up-revisor | REQUEST_CHANGES | revisao | evidence=logic:test_pass\n';
  const dir = withLog(extra);
  try {
    const r = runUpToolsJson(['gate', 'verdict', '--phase', '5'], dir);
    assert.strictEqual(r.decision, 'REQUEST_CHANGES',
      'ultima entrada deve vencer; got=' + r.decision);
  } finally {
    cleanup(dir);
  }
});

// ---------------------------------------------------------------------------
// gate plan-ready (PROVA-02, PROVA-03) - fronteiras no plano pronto
// ---------------------------------------------------------------------------

function fm(body) {
  return '---\n' + body + '\n---\n\n# PLAN-READY\n';
}

function withPlan(content) {
  return mkTempProject({ '.plano/PLAN-READY.md': content });
}

const SEAM_OK = `  - contrato: "subcomando da CLI de ferramentas do UP"
    tipo: comando
    estado: existente
    nivel: "superficie publica mais alta"
    justificativa: ""`;

t('legado passa e avisa', () => {
  const dir = withPlan('# PLAN-READY\n\nSem frontmatter.\n');
  try {
    const r = runUpToolsJson(['gate', 'plan-ready'], dir);
    assert.strictEqual(r.pass, true, 'legado deve passar; got=' + JSON.stringify(r));
    assert.strictEqual(r.legacy, true);
    assert.ok(Array.isArray(r.warnings) && r.warnings.some((w) => String(w).includes('seams_field_missing_legacy')),
      'warnings deve ter seams_field_missing_legacy; got=' + JSON.stringify(r.warnings));
    assert.ok(Array.isArray(r.errors) && r.errors.length === 0, 'errors vazio; got=' + JSON.stringify(r.errors));
  } finally {
    cleanup(dir);
  }
});

t('esquema 2 sem fronteira bloqueia', () => {
  const dir = withPlan(fm('plan_schema: 2\nproject_name: x\n'));
  try {
    const r = runUpToolsJson(['gate', 'plan-ready'], dir);
    assert.strictEqual(r.pass, false);
    assert.ok(r.errors && r.errors.some((e) => String(e).includes('seams_field_missing')),
      'errors deve ter seams_field_missing; got=' + JSON.stringify(r.errors));
  } finally {
    cleanup(dir);
  }
});

t('esquema 2 com uma fronteira passa', () => {
  const dir = withPlan(fm('plan_schema: 2\nseams:\n' + SEAM_OK + '\n'));
  try {
    const r = runUpToolsJson(['gate', 'plan-ready'], dir);
    assert.strictEqual(r.pass, true, 'deve passar; got=' + JSON.stringify(r));
    assert.strictEqual(r.seam_count, 1);
    assert.ok(Array.isArray(r.errors) && r.errors.length === 0);
  } finally {
    cleanup(dir);
  }
});

t('contrato que parece caminho de arquivo bloqueia', () => {
  const dir = withPlan(fm(
    'plan_schema: 2\nseams:\n' +
    '  - contrato: "up/bin/lib/gate.cjs"\n' +
    '    tipo: modulo\n' +
    '    estado: existente\n' +
    '    nivel: "arquivo"\n' +
    '    justificativa: ""\n'
  ));
  try {
    const r = runUpToolsJson(['gate', 'plan-ready'], dir);
    assert.strictEqual(r.pass, false);
    assert.ok(r.errors && r.errors.some((e) => String(e).includes('seam_parece_caminho')),
      'errors deve ter seam_parece_caminho; got=' + JSON.stringify(r.errors));
  } finally {
    cleanup(dir);
  }
});

t('rota nao e confundida com caminho', () => {
  const dir = withPlan(fm(
    'plan_schema: 2\nseams:\n' +
    '  - contrato: "POST /api/auth/login"\n' +
    '    tipo: rota\n' +
    '    estado: existente\n' +
    '    nivel: "rota de rede"\n' +
    '    justificativa: ""\n'
  ));
  try {
    const r = runUpToolsJson(['gate', 'plan-ready'], dir);
    assert.strictEqual(r.pass, true, 'rota deve passar; got=' + JSON.stringify(r));
    assert.ok(Array.isArray(r.errors) && r.errors.length === 0);
  } finally {
    cleanup(dir);
  }
});

t('duas fronteiras sem justificativa bloqueiam', () => {
  const dir = withPlan(fm(
    'plan_schema: 2\nseams:\n' +
    SEAM_OK + '\n' +
    '  - contrato: "outra fronteira publica"\n' +
    '    tipo: interface\n' +
    '    estado: nova\n' +
    '    nivel: "contrato de tipo"\n' +
    '    justificativa: ""\n'
  ));
  try {
    const r = runUpToolsJson(['gate', 'plan-ready'], dir);
    assert.strictEqual(r.pass, false);
    assert.ok(r.errors && r.errors.some((e) => String(e).includes('seam_sem_justificativa')),
      'errors deve ter seam_sem_justificativa; got=' + JSON.stringify(r.errors));
  } finally {
    cleanup(dir);
  }
});

t('tipo fora da lista fechada bloqueia', () => {
  const dir = withPlan(fm(
    'plan_schema: 2\nseams:\n' +
    '  - contrato: "algo"\n' +
    '    tipo: arquivo\n' +
    '    estado: existente\n' +
    '    nivel: "x"\n' +
    '    justificativa: ""\n'
  ));
  try {
    const r = runUpToolsJson(['gate', 'plan-ready'], dir);
    assert.strictEqual(r.pass, false);
    assert.ok(r.errors && r.errors.some((e) => String(e).includes('seam_tipo_invalido')),
      'errors deve ter seam_tipo_invalido; got=' + JSON.stringify(r.errors));
  } finally {
    cleanup(dir);
  }
});

t('campo escalar plan-ready', () => {
  const dir = withPlan('# PLAN-READY\n');
  try {
    const r = runUpTools(['gate', 'plan-ready', '--field', 'pass'], dir);
    assert.ok(r.stdout.trim() === 'true' || r.stdout.trim() === 'false',
      'deve imprimir true/false; got=' + JSON.stringify(r.stdout));
    assert.ok(!r.stdout.includes('{'), 'sem JSON');
  } finally {
    cleanup(dir);
  }
});

t('arquivo ausente nao explode', () => {
  const dir = mkTempProject({});
  try {
    const raw = runUpTools(['gate', 'plan-ready'], dir);
    assert.strictEqual(raw.exitCode, 0, 'exit 0; stderr=' + raw.stderr);
    const r = runUpToolsJson(['gate', 'plan-ready'], dir);
    assert.strictEqual(r.exists, false);
    assert.strictEqual(r.pass, false);
    assert.ok(r.errors && r.errors.some((e) => String(e).includes('plan_ready_missing')),
      'errors deve ter plan_ready_missing; got=' + JSON.stringify(r.errors));
  } finally {
    cleanup(dir);
  }
});

done();
