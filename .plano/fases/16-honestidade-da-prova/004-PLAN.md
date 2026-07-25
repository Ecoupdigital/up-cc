---
phase: 16-honestidade-da-prova
plan: "004"
type: chore
wave: 4
depends_on: ["003"]
autonomous: true
requirements: [PROVA-01, PROVA-03, PROVA-04, PROVA-05, REG-01, REG-02, REG-03]
files_modified:
  - up/workflows/plan.md
  - up/workflows/build.md
  - up/bin/lib/gate.test.cjs
  - .plano/governance/approvals.log
seams:
  - contrato: "subcomando da CLI de ferramentas do UP, invocado como subprocesso com JSON em stdout"
    tipo: comando
    estado: existente
    nivel: "superfície pública mais alta do sistema que um teste consegue executar"
    justificativa: ""
prova: "glue:smoke (execução real da CLI contra o log e o plano pronto reais deste repositório)"
must_haves:
  truths:
    - "As fronteiras são esboçadas e confirmadas com o dono antes de planejar"
    - "A entrada de fronteiras confirmadas aparece no log de aprovações da fase e é lida pelo leitor único"
    - "A entrada é aditiva: a fase continua exigindo a evidência do tipo dela"
    - "O build recusa plano pronto reprovado e apenas avisa no caso anterior ao ciclo"
  artifacts:
    - path: "up/workflows/plan.md"
      provides: "Passo de esboço e confirmação das fronteiras, com escrita da entrada no log"
    - path: "up/workflows/build.md"
      provides: "Gate de entrada do plano pronto e exigência condicional da entrada de fronteiras"
  key_links:
    - from: "up/workflows/plan.md"
      to: "log de aprovações"
      via: "escrita da entrada evidence=seams:confirmed no formato documentado de seis colunas"
---

# Fase 16 Plano 004: Fronteiras no fluxo, no gate e no log

<objective>
Ligar as fronteiras confirmadas ao fluxo real: esboço e confirmação antes de planejar, entrada própria no log de aprovações, gate de entrada no build e proibição de inventar fronteira em tempo de execução.
</objective>

**Onda:** 4. **Depende de:** plano 003 (doutrina, campo no template e validação já existem).
**Tipo de prova:** smoke. A prova é a execução real da CLI contra o log e o plano pronto deste repositório, mais um caso automatizado que trava a leitura da entrada nova.

## Por que este plano existe

Campo validado que ninguém preenche não muda nada. Este plano fecha o circuito: quem esboça (o planejamento), quem confirma (o dono), onde fica registrado (o log) e quem recusa quando falta (o build). E trava a regra que impede o gate de virar teatro pelo outro lado: a entrada de fronteiras SOMA, nunca substitui a evidência do tipo da fase.

## Contexto

@up/workflows/plan.md - estágio de planejamento e estágio PR.1, onde o plano pronto é gerado
@up/workflows/build.md - passo V.1 (parse do plano pronto) e o GATE de fase já religado no plano 002
@up/references/seams.md - doutrina criada no plano 003
@up/bin/lib/gate.cjs - leitor único e validação do plano pronto
@.plano/governance/approvals.log - log real, alvo da prova de fumaça

## Tarefas

<task id="1" type="auto">
<files>up/workflows/plan.md (editar)</files>
<action>
Fazer o esboço de fronteiras acontecer ANTES do planejamento.

1. Criar um passo novo, como primeiro passo do estágio de planejamento (antes de qualquer spawn de planejador), chamado "Esboço de fronteiras de teste":
   - Carregar `@$HOME/.claude/up/references/seams.md`.
   - Esboçar as fronteiras candidatas aplicando as três regras (existente vence nova, mais alta vence mais baixa, número ideal UM).
   - Apresentar ao dono no formato do ciclo (pergunta, resposta recomendada e motivo). Modelo literal a incluir no workflow:

```
Fronteira de teste desta fase (onde o teste vai encostar):

  Recomendado: {contrato publico}  ({tipo}, {existente|nova})
  Motivo: {por que esta e a mais alta disponivel e por que uma so basta}

  [1] Confirmar a recomendada
  [2] Ajustar (descreva a fronteira que voce prefere)
```

   - Regra dura no texto: mais de uma fronteira só entra com justificativa escrita na própria entrada, e essa justificativa vai para o campo `justificativa` do plano pronto.
   - Regra de fato contra decisão: se a fronteira já existe no código, o agente descobre isso sozinho (busca no código e mapa do codebase) e não pergunta se existe. Só sobe ao dono a ESCOLHA entre candidatas.

2. Após a confirmação, gravar a entrada no log, no formato documentado de seis colunas:

```bash
mkdir -p .plano/governance
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-${PHASE_NUMBER} | up-planejador | CONFIRMED | fronteiras acordadas com o dono: ${SEAM_RESUMO} | evidence=seams:confirmed" \
  >> .plano/governance/approvals.log
```

   Nota obrigatória no texto: `CONFIRMED` não é veredito de fase. Ele soma evidência e nunca substitui a evidência do tipo da fase, que continua exigida.

3. No estágio PR.1, acrescentar a instrução de preencher `plan_schema: 2`, o bloco `seams:` (com as fronteiras confirmadas) e o campo `fora_de_escopo` no plano pronto gerado, e de validar antes de commitar com `node "$HOME/.claude/up/bin/up-tools.cjs" gate plan-ready --raw`. Plano pronto reprovado é corrigido antes do commit, nunca commitado como está.

4. Atualizar os `success_criteria` com dois itens: fronteiras esboçadas e confirmadas antes do planejamento, e plano pronto aprovado por `gate plan-ready`.
</action>
<verify><automated>grep -q "seams.md" up/workflows/plan.md && grep -q "evidence=seams:confirmed" up/workflows/plan.md && grep -q "gate plan-ready" up/workflows/plan.md && grep -q "plan_schema: 2" up/workflows/plan.md && echo "plan.md ok"</automated></verify>
<done>O planejamento esboça as fronteiras antes de planejar, pergunta no formato com recomendação e motivo, grava a entrada no formato documentado e valida o plano pronto antes do commit. Imprime `plan.md ok`.</done>
</task>

<task id="2" type="auto">
<files>up/workflows/build.md (editar)</files>
<action>
Fazer o build recusar plano pronto reprovado e exigir a entrada de fronteiras apenas quando ela é devida.

1. No passo V.1 (parsear o plano pronto), depois das linhas que já extraem runtime e contagens, acrescentar:

```bash
PR_PASS=$(node "$HOME/.claude/up/bin/up-tools.cjs" gate plan-ready --field pass)
PR_SCHEMA=$(node "$HOME/.claude/up/bin/up-tools.cjs" gate plan-ready --field schema)
PR_WARN=$(node "$HOME/.claude/up/bin/up-tools.cjs" gate plan-ready --field warnings)

if [ "$PR_PASS" != "true" ]; then
  echo "BLOQUEADO: plano pronto sem fronteiras confirmadas. Rode /up:plan para esbocar e confirmar as fronteiras."
  exit 1
fi
[ -n "$PR_WARN" ] && echo "AVISO: ${PR_WARN} (plano anterior a este ciclo; seguindo sem bloquear)"
```

   Nota em prosa abaixo: plano pronto anterior a este ciclo não tem marcador de esquema, então a ausência do campo sai como aviso e a execução segue. Plano gerado a partir deste ciclo tem `plan_schema` 2 ou maior e a ausência bloqueia.

2. No bloco do GATE de fase (o mesmo que o plano 002 religou), tornar a exigência da entrada de fronteiras condicional ao esquema:

```bash
SEAMS_FLAG=""
if [ -n "$PR_SCHEMA" ] && [ "$PR_SCHEMA" -ge 2 ] 2>/dev/null; then SEAMS_FLAG="--require-seams"; fi
GATE_PASS=$(node "$HOME/.claude/up/bin/up-tools.cjs" gate verdict --phase "${PHASE_NUMBER}" --expect-evidence "${EVIDENCE_TYPE}" $SEAMS_FLAG --field pass)
```

   Nota obrigatória: a entrada de fronteiras é ADITIVA. A fase continua exigindo a evidência do tipo dela, e a entrada de fronteiras não substitui nenhuma evidência.

3. Na seção que monta o prompt do executor, acrescentar a regra de execução: é proibido criar fronteira de teste não prevista no plano. Ao precisar de uma, o executor PARA e escala com pergunta no formato do ciclo (pergunta, recomendação, motivo), e a decisão volta como ajuste do plano. Citar `@$HOME/.claude/up/references/seams.md`.

4. Atualizar os `success_criteria` com: plano pronto validado antes da execução, e nenhuma fronteira criada em tempo de execução.
</action>
<verify><automated>grep -q "gate plan-ready" up/workflows/build.md && grep -q "require-seams" up/workflows/build.md && grep -q "seams.md" up/workflows/build.md && echo "build.md ok"</automated></verify>
<done>O build valida o plano pronto na entrada, exige a entrada de fronteiras apenas quando o esquema é 2 ou maior, avisa sem bloquear no caso legado e proíbe o executor de inventar fronteira. Imprime `build.md ok`.</done>
</task>

<task id="3" type="auto">
<files>up/bin/lib/gate.test.cjs (editar)</files>
<action>
Travar por teste a semântica da entrada nova, porque ela é a parte mais fácil de quebrar sem perceber.

Acrescentar dois casos ao arquivo de teste, com fixture de log num projeto temporário:

Fixture:
```
2026-07-20T10:00:00Z | phase-16 | up-planejador | CONFIRMED | fronteira acordada | evidence=seams:confirmed
2026-07-20T12:00:00Z | phase-16 | up-revisor | APPROVE | tudo certo | evidence=logic:test_pass
```

1. `entrada de fronteiras soma, e nao rouba o veredito` - `gate verdict --phase 16` devolve `decision === 'APPROVE'` (e não `CONFIRMED`), `seams_confirmed === true` e `evidence_types` contendo `logic` e `seams`. Com `--require-seams --expect-evidence logic --field pass`, imprime `true`.
2. `sem a linha de fronteiras, a exigencia falha` - mesma fixture sem a primeira linha: `--require-seams --expect-evidence logic --field pass` imprime `false` e `reasons` contém `seams_missing`, enquanto `decision` continua `APPROVE`. Prova que a exigência é separável e aditiva.

Rodar todos os testes do UP e confirmar verde.
</action>
<verify><automated>node scripts/run-up-tests.cjs</automated></verify>
<done>Os dois casos passam. A entrada `CONFIRMED` não vira veredito de fase, a evidência dela soma às demais e a exigência de fronteiras é independente da exigência de evidência por tipo.</done>
</task>

<task id="4" type="auto">
<files>.plano/governance/approvals.log (editar), .plano/fases/16-honestidade-da-prova/evidencia/004-smoke.txt (novo)</files>
<action>
Registrar a entrada de fronteiras da própria fase 16 (dogfooding do requisito) e fechar a prova de fumaça contra artefatos reais.

1. Acrescentar ao log deste repositório, no formato documentado de seis colunas:

```bash
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-16 | up-planejador | CONFIRMED | fronteira unica acordada: subcomando da CLI de ferramentas do UP (comando, existente). Confirmacao do dono nesta fase = aprovacao do proprio plano, em modo autonomo | evidence=seams:confirmed" \
  >> .plano/governance/approvals.log
```

2. Rodar a prova de fumaça e gravar tudo em `.plano/fases/16-honestidade-da-prova/evidencia/004-smoke.txt`:
   - `node up/bin/up-tools.cjs gate plan-ready` contra o `.plano/PLAN-READY.md` real (sem frontmatter): sai `pass=true` com aviso de legado.
   - `node up/bin/up-tools.cjs gate verdict --phase 16`: acha a entrada `CONFIRMED`, devolve `seams_confirmed=true` e `decision` nulo (porque `CONFIRMED` não carrega veredito).
   - `node up/bin/up-tools.cjs gate entries --phase 16`: lista a entrada nova.
   - `node up/bin/up-tools.cjs gate verdict --phase 11 --field decision` e `--phase 12 --field decision`: continuam devolvendo `APPROVE`, provando que a entrada nova não regrediu a leitura do histórico.
</action>
<verify><automated>grep -q "evidence=seams:confirmed" .plano/governance/approvals.log && node up/bin/up-tools.cjs gate verdict --phase 16 --field seams_confirmed | grep -q true && node up/bin/up-tools.cjs gate verdict --phase 11 --field decision | grep -q APPROVE && echo "smoke ok"</automated></verify>
<done>A entrada de fronteiras confirmadas da fase 16 está no log, o leitor único a enxerga, as duas linhas históricas continuam devolvendo `APPROVE` e a prova de fumaça está gravada em `evidencia/004-smoke.txt`.</done>
</task>

<task id="5" type="auto">
<files>.plano/fases/16-honestidade-da-prova/evidencia/004-regressao.txt (novo)</files>
<action>
Fechar a regressão zero do bloco de fronteiras, com tudo gravado em `.plano/fases/16-honestidade-da-prova/evidencia/004-regressao.txt`:

1. `node scripts/run-up-tests.cjs` (testes do UP verdes).
2. `npm test` (suíte do GSD intacta).
3. `HOME=$(mktemp -d) node up/bin/install.js --all --global` (REG-02: os 4 runtimes instalam, e a reference nova de fronteiras é distribuída junto das demais).
4. Conferir que a reference nova chegou ao destino em pelo menos um runtime, listando o diretório de references dentro do HOME temporário e procurando `seams.md`. Se algum runtime não copiar references por design, declarar isso na saída em vez de inventar correção no instalador.
5. REG-03 contra artefato real: `node up/bin/up-tools.cjs gate plan-ready` no `.plano/` deste repositório continua devolvendo `pass=true` com aviso, sem exigir migração.
</action>
<verify><automated>node scripts/run-up-tests.cjs && npm test && node up/bin/up-tools.cjs gate plan-ready --field pass | grep -q true && echo "REG ok"</automated></verify>
<done>Testes do UP e do GSD passam, os 4 runtimes instalam com a reference nova, e o plano pronto legado deste repositório continua passando com aviso. Saída gravada em `evidencia/004-regressao.txt`.</done>
</task>

## Critérios de Sucesso

- [ ] O planejamento esboça as fronteiras antes de planejar e pergunta com recomendação e motivo
- [ ] A entrada `evidence=seams:confirmed` aparece no log da fase e é lida pelo leitor único
- [ ] A entrada é aditiva: a fase continua exigindo a evidência do tipo dela, e `CONFIRMED` não vira veredito
- [ ] O build bloqueia plano pronto reprovado e apenas avisa no caso anterior ao ciclo
- [ ] A execução escala ao precisar de fronteira não prevista, em vez de inventar
- [ ] Contra o log real, as fases 11 e 12 continuam devolvendo `APPROVE`
- [ ] `npm test`, `npm run test:up` e a instalação nos 4 runtimes continuam passando

## FORA DE ESCOPO

- **Não mexer no escritor do gate de fase.** A seção 3.7 do build continua emitindo as seis colunas documentadas. A entrada nova é escrita pelo planejamento, no mesmo formato.
- **Não tornar a exigência retroativa.** Plano pronto sem marcador de esquema não é migrado nem reescrito.
- **Não remover o sedimento do template.** Continua valendo a fronteira declarada no plano 003.
- **Não implementar a heurística anti-tautologia.** É o plano 005.
- **Não mudar o instalador** além do que a reference nova exigir por já estar no diretório de references.
