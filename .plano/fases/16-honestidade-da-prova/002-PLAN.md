---
phase: 16-honestidade-da-prova
plan: "002"
type: chore
wave: 2
depends_on: ["001"]
autonomous: true
requirements: [PROVA-04, REG-01, REG-02, REG-03]
files_modified:
  - up/workflows/build.md
  - up/workflows/governance.md
  - up/workflows/plan.md
  - up/references/tdd-evidence-types.md
seams:
  - contrato: "subcomando da CLI de ferramentas do UP, invocado como subprocesso com JSON em stdout"
    tipo: comando
    estado: existente
    nivel: "superfície pública mais alta do sistema que um teste consegue executar"
    justificativa: ""
prova: "logic:test_pass (o par vermelho e verde do plano 001 continua verde) mais inspeção determinística de que nenhuma segunda leitura sobrou"
must_haves:
  truths:
    - "Os três gates do sistema leem o log pelo mesmo subcomando"
    - "Nenhum grep por nome de agente e nenhum awk por posição de coluna sobra nos workflows"
    - "O contrato de leitura está documentado ao lado do contrato de escrita, que não mudou"
    - "Projeto com planejamento anterior a este ciclo continua funcionando"
  artifacts:
    - path: "up/workflows/build.md"
      provides: "GATE de fase lendo pelo leitor único"
    - path: "up/references/tdd-evidence-types.md"
      provides: "Contrato de leitura documentado, com a tabela de gramáticas aceitas"
  key_links:
    - from: "up/workflows/governance.md"
      to: "subcomando gate verdict"
      via: "chamada bash no passo do gate, substituindo grep mais awk"
---

# Fase 16 Plano 002: Religar os gates ao leitor único

<objective>
Substituir as três cópias da leitura quebrada do log de aprovações por chamadas ao leitor único, documentar o contrato de leitura e provar que nenhuma segunda implementação sobrou no repositório.
</objective>

**Onda:** 2. **Depende de:** plano 001 (o subcomando precisa existir).
**Tipo de prova:** lógica. O par vermelho e verde do plano 001 continua verde, e a ausência de segunda leitura é verificada por inspeção determinística do texto dos workflows.

## Por que este plano existe

Hoje a mesma leitura está escrita três vezes, em três arquivos, com o mesmo defeito nos três. Corrigir o módulo sem religar os chamadores deixaria o defeito em pé. E a fase 18 (revisão em dois eixos) promete apontar para este mesmo leitor em vez de implicar um segundo: se sobrar uma cópia, a promessa quebra na hora.

## Contexto

@up/workflows/build.md - bloco "GATE de fase" por volta da linha 629, com o grep e o awk quebrados
@up/workflows/governance.md - passo 3, com a mesma leitura duplicada
@up/workflows/plan.md - "GATE de planejamento" por volta da linha 248, terceira cópia
@up/references/tdd-evidence-types.md - contrato documentado da linha, a estender com a parte de leitura
@up/bin/lib/gate.cjs - leitor criado no plano 001

## Tarefas

<task id="1" type="auto">
<files>up/workflows/build.md (editar)</files>
<action>
No bloco "GATE de fase" (linhas 629 a 658), apagar `REVISOR_ENTRY=$(grep "phase-${PHASE_NUMBER}.*up-revisor" ...)`, o bloco `EVIDENCE_FIELD=$(echo ... grep -oE 'evidence=(logic|ui|glue):(test_pass|visual|smoke)')` com o `if/elif` que o acompanha, e `DECISION=$(echo "$REVISOR_ENTRY" | awk -F'|' ...)`. No lugar:

```bash
echo "=== GATE: Fase ${PHASE_NUMBER} ==="
SUMMARY_OK=$(ls ${PHASE_DIR}/*-SUMMARY.md 2>/dev/null | wc -l)
VERIF_OK=$(ls ${PHASE_DIR}/*-VERIFICATION.md 2>/dev/null | wc -l)

GATE_PASS=$(node "$HOME/.claude/up/bin/up-tools.cjs" gate verdict --phase "${PHASE_NUMBER}" --expect-evidence "${EVIDENCE_TYPE}" --field pass)
DECISION=$(node "$HOME/.claude/up/bin/up-tools.cjs" gate verdict --phase "${PHASE_NUMBER}" --field decision)
GATE_REASONS=$(node "$HOME/.claude/up/bin/up-tools.cjs" gate verdict --phase "${PHASE_NUMBER}" --expect-evidence "${EVIDENCE_TYPE}" --field reasons)

PASS=true
[ "$SUMMARY_OK" -eq 0 ] && echo "FALHA: sem SUMMARY.md" && PASS=false
[ "$VERIF_OK" -eq 0 ] && echo "FALHA: sem VERIFICATION.md" && PASS=false
[ "$GATE_PASS" != "true" ] && echo "FALHA no veredito: ${GATE_REASONS}" && PASS=false
```

O processamento do veredito abaixo (APPROVE, REQUEST_CHANGES, BLOCK) continua igual, lendo `$DECISION`.

Acrescentar, em prosa, logo abaixo do bloco: o leitor localiza fase, veredito e evidência por conteúdo, funciona com ou sem a coluna do agente, aceita as notações `phase-N` e `fase=N`, aceita as gramáticas de evidência já gravadas em disco e ignora apenas linha sem palavra de veredito. E a frase que trava o alvo: o escritor da seção 3.7 não muda, continua emitindo as seis colunas documentadas.

Atualizar o item correspondente nos `success_criteria` do arquivo para citar o leitor único. Zero travessão no texto novo.
</action>
<verify><automated>grep -q "gate verdict --phase" up/workflows/build.md && ! grep -q "REVISOR_ENTRY" up/workflows/build.md && echo "build ok"</automated></verify>
<done>O GATE de fase do build lê pelo subcomando, o seletor por nome de agente e a leitura por posição de coluna sumiram, e a nota do alvo está no arquivo. Imprime `build ok`.</done>
</task>

<task id="2" type="auto">
<files>up/workflows/governance.md (editar)</files>
<action>
No passo 3 ("O GATE de fase"), aplicar exatamente a mesma substituição da tarefa 1: fora `REVISOR_ENTRY` com `grep`, fora o `grep -oE` de vocabulário fechado, fora o `awk -F'|'`, dentro as três chamadas a `gate verdict` com `--field`.

No passo 2 ("Contrato do approvals.log"), acrescentar um parágrafo curto com o título "Leitura do histórico":
- O escritor continua emitindo as seis colunas documentadas.
- A leitura de histórico é feita por um único subcomando, que localiza campo por conteúdo.
- Regra dura: ninguém lê este arquivo com `grep` mais `awk` fora dele. Segunda implementação é proibida, porque foi exatamente isso que produziu os três pontos de quebra.

Atualizar os `success_criteria` do arquivo trocando o item que descreve a verificação por grep pelo item "o gate lê o veredito pelo leitor único, que localiza campo por conteúdo".
</action>
<verify><automated>grep -q "gate verdict" up/workflows/governance.md && ! grep -q "REVISOR_ENTRY" up/workflows/governance.md && grep -qi "Leitura do hist" up/workflows/governance.md && echo "governance ok"</automated></verify>
<done>O workflow de governança usa o leitor único, declara a proibição de segunda implementação e não contém mais a leitura por posição. Imprime `governance ok`.</done>
</task>

<task id="3" type="auto">
<files>up/workflows/plan.md (editar)</files>
<action>
No "GATE de planejamento" (por volta da linha 248), trocar o bloco por:

```bash
echo "=== GATE: planning ==="
[ -f .plano/AUDIT-PLAN.md ] || { echo "FALHA: sem AUDIT-PLAN.md"; exit 1; }
DECISION=$(node "$HOME/.claude/up/bin/up-tools.cjs" gate verdict --scope planning --field decision)
[ -z "$DECISION" ] && echo "FALHA: up-revisor NAO logou planning" && exit 1
```

O processamento do veredito abaixo continua igual. Atualizar o item correspondente nos `success_criteria`.

Este escopo não é numérico (é `planning`), e por isso serve de prova de que o leitor único cobre os dois modos de seleção com uma implementação só.
</action>
<verify><automated>grep -q "gate verdict --scope planning" up/workflows/plan.md && echo "plan ok"</automated></verify>
<done>O gate de planejamento lê pelo mesmo subcomando, com seleção por escopo em vez de número de fase. Imprime `plan ok`.</done>
</task>

<task id="4" type="auto">
<files>up/references/tdd-evidence-types.md (editar)</files>
<action>
Documentar o contrato de LEITURA ao lado do contrato de escrita, que não muda.

Na seção "Formato no approvals.log", depois do bloco que descreve a linha de seis colunas, acrescentar a subseção "Leitura do histórico (leitor único)" com:

- Uma frase dizendo que o escritor continua emitindo as seis colunas documentadas, e que a leitura de histórico é tolerante por necessidade, porque há linha antiga gravada à mão com cinco colunas.
- Como o leitor acha cada campo: escopo pelo número da fase em qualquer das notações em uso (`phase-N` e `fase=N`), veredito pela palavra de veredito, evidência pelo prefixo `evidence=`, coluna de agente opcional.
- Tabela de aliases aceitos na leitura, em três colunas (gravado em disco, tipo normalizado, exemplo): `logic` e `test` para `logic` (exemplo `evidence=test:red-green`); `ui` e `visual` para `ui`; `glue` e `smoke` para `glue` (exemplo `evidence=smoke:pass`); `seams` para `seams` (exemplo `evidence=seams:confirmed`, acrescentado na fase 16 e detalhado no plano 003).
- A regra de descarte: só é ignorada a linha que não carrega palavra de veredito nenhuma, como o fragmento de JSON no topo do arquivo. Ignorar por não reconhecer apagaria veredito histórico, que a revisão em dois eixos promete continuar lendo.
- A linha de invocação do subcomando, para quem precisar ler o log fora de um workflow.

Não mexer no restante do arquivo. Não tocar `up/references/governance-rules.md`, que carrega sedimento de CEO e chiefs e tem passe próprio.
</action>
<verify><automated>grep -q "Leitura do hist" up/references/tdd-evidence-types.md && grep -q "evidence=seams:confirmed" up/references/tdd-evidence-types.md && grep -q "gate verdict" up/references/tdd-evidence-types.md && echo "doc ok"</automated></verify>
<done>A reference descreve a leitura por conteúdo, a tabela de aliases, a regra única de descarte e a invocação do subcomando, sem alterar o formato de escrita. Imprime `doc ok`.</done>
</task>

<task id="5" type="auto">
<files>.plano/fases/16-honestidade-da-prova/evidencia/002-regressao.txt (novo)</files>
<action>
Provar que sobrou UM leitor e que nada regrediu.

1. Varredura determinística de segunda implementação, com a saída gravada:
   - `grep -rn "up-revisor" up/workflows/ | grep -E "grep |awk "` deve voltar vazio.
   - `grep -rn "awk -F" up/workflows/` deve voltar vazio (a leitura por posição sumiu dos três arquivos).
   - `grep -rc "gate verdict" up/workflows/build.md up/workflows/governance.md up/workflows/plan.md` deve devolver contagem maior que zero nos três.

2. Regressão, com tudo gravado em `.plano/fases/16-honestidade-da-prova/evidencia/002-regressao.txt`:
   - `node scripts/run-up-tests.cjs` (o par vermelho e verde do plano 001 continua verde).
   - `npm test` (suíte do GSD intacta).
   - `HOME=$(mktemp -d) node up/bin/install.js --all --global` (REG-02: os 4 runtimes continuam instalando, e os 7 comandos aparecem).
   - `node up/bin/up-tools.cjs gate verdict --phase 11 --field decision` e `--phase 12 --field decision` contra o log real deste repositório, que precisam devolver `APPROVE` nos dois casos. É a prova de REG-03 contra artefato real, e não contra fixture.
</action>
<verify><automated>! grep -rn "awk -F" up/workflows/ && node scripts/run-up-tests.cjs && npm test && node up/bin/up-tools.cjs gate verdict --phase 11 --field decision | grep -q APPROVE && node up/bin/up-tools.cjs gate verdict --phase 12 --field decision | grep -q APPROVE && echo "REG ok"</automated></verify>
<done>Nenhuma leitura por posição sobrou nos workflows, os três chamam o leitor único, testes do UP e do GSD passam, os 4 runtimes instalam e o log real das fases 11 e 12 devolve `APPROVE`. Saída gravada em `evidencia/002-regressao.txt`.</done>
</task>

## Critérios de Sucesso

- [ ] Os três gates (build, governance, plan) chamam `gate verdict`, e nenhum lê o log por conta própria
- [ ] Nenhum `grep` por nome de agente e nenhum `awk -F` sobra nos workflows
- [ ] A reference documenta a leitura por conteúdo, a tabela de gramáticas aceitas e a regra única de descarte
- [ ] O contrato de escrita continua idêntico: seis colunas, sem alteração
- [ ] Contra o log real, as fases 11 e 12 devolvem `APPROVE` (REG-03 provado em artefato real)
- [ ] `npm test`, `npm run test:up` e a instalação nos 4 runtimes continuam passando

## FORA DE ESCOPO

- **Não mexer no escritor.** A seção 3.7 do build continua emitindo as seis colunas documentadas.
- **Não tocar `up/references/governance-rules.md`.** Carrega sedimento de CEO, chiefs e supervisores. Corte de sedimento é passe separado com briefing próprio.
- **Não mudar a semântica do gate.** Este plano troca a leitura, não a regra: continua exigindo artefatos, veredito e evidência do tipo da fase. Veredito por eixo é a fase 18.
- **Não implementar a exigência de fronteiras confirmadas.** É o plano 003 e o plano 004.
- **Não implementar a heurística anti-tautologia.** É o plano 005.
- **Não reescrever linha histórica do log.**
