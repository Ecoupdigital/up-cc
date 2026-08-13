<purpose>
Workflow `/up:plan` — Planejamento completo de projeto OU de fase.

Conduz Arquitetura + Planejamento exaustivo de TODAS as fases + Planning Review + PLAN-READY.

NAO executa nada. Para apos gerar PLAN-READY.md. Resultado: projeto completamente planejado, pronto
para `/up:build` no mesmo runtime ou outro.

Absorveu discutir-fase.md e planejar-fase.md: detecta automaticamente se o pedido e o PROJETO inteiro
ou uma FASE especifica (`/up:plan` vs `/up:plan N`).
</purpose>

> Vocabulário UP: fase, plano, onda, gate, evidência, worktree, escape hatch, verificação e laço DCRV têm definição única em `$HOME/.claude/up/references/glossario-up.md`. Use o termo, não redefina.

<core_principle>
Pipeline final (caminho quente):

```
up-arquiteto (pesquisa inline + roadmap + auto-checagem de REQUIREMENTS)
  -> up-planejador por fase -> PLAN-READY.md
```

`--review` devolve o `up-revisor` de planejamento. Sem a flag, o orquestrador gera PLAN-READY
depois do self-check do planejador. `up-pesquisador`, `up-roteirista` e `up-sintetizador` nao
entram como processo. O arquiteto absorve pesquisa, roteiro e validacao.

O intake/brainstorm NAO acontece aqui — ja rodou no `/up` (workflows/up.md, inline, sem CEO) e produziu
`.plano/BRIEFING.md`. `/up:plan` consome o BRIEFING. Se for chamado direto sem BRIEFING, faz um intake
minimo inline (sem CEO).

**Model routing configuravel (v0.9.0+):**
```bash
MODEL=$(node "$HOME/.claude/up/bin/up-tools.cjs" config resolve-model {agent-name} --raw)
```
Default fixo: Opus planeja, Sonnet executa. `default` -> nao passar model=.

**Planos sao contrato.** Objetivo, fora de escopo, entregas e prova. Sem receita de codigo.

**SEPARACAO RIGIDA DE AGENTES:** cada passo e um `Agent()` SEPARADO. O enforcement e o GATE
deterministico do `approvals.log` (ver `@~/.claude/up/workflows/governance.md`), nao supervisores.

**Contrato de pergunta (obrigatório):** antes da primeira pergunta, carregue
`Read $HOME/.claude/up/references/questioning.md` e aplique o bloco `<contrato_de_pergunta>`. Nenhuma pergunta
sai crua. **O que este workflow resolve sozinho e nunca pergunta:** modo projeto ou fase (vem do argumento),
modo greenfield ou brownfield (detecção de arquivos), stack e convenções (mapa do codebase ou manifesto),
runtime de planejamento (diretório de configuração), requisitos e fases já registrados (leitura dos
artefatos). Fato descoberto vira anúncio de uma linha.
</core_principle>

<process>

## Estagio 0: GATES OBRIGATORIOS

### 0.1 Owner Profile

```bash
if [ ! -f ~/.claude/up/owner-profile.md ]; then
  echo "Owner profile nao existe. Rodando onboarding..."
  # Delegar pro workflow @~/.claude/up/workflows/onboarding.md
fi
```

### 0.2 Crash Recovery

```bash
ls .plano/LOCK.md 2>/dev/null
```
Se LOCK.md existe e `stage: planning`: retomar de onde parou.

### 0.3 Deteccao projeto vs fase (absorve discutir-fase + planejar-fase)

Se `$ARGUMENTS` contem um numero de fase (ex: `/up:plan 3`), entrar em **MODO FASE** (planejar SO aquela
fase, com research/context inline e self-check). Senao, **MODO PROJETO** (planejar todas as fases).

## Estagio 1: INTAKE (inline, sem CEO)

Entrada esperada = `.plano/BRIEFING.md` (gerado pelo `/up`).

```bash
[ -f .plano/BRIEFING.md ] && cat .plano/BRIEFING.md
```

**Se BRIEFING.md NÃO existe** (plan chamado direto): antes de perguntar qualquer coisa, rode o protocolo de
resolução prévia sobre projeto, requisitos, roadmap, estado, mapa do codebase e manifesto. Só o que sobrar
vira pergunta, uma por vez:

<pergunta id="plan.intake-minimo">
Pergunta: {o único dado que falta para planejar}
Recomendo: {o valor inferido dos artefatos existentes, ou o padrão do perfil do dono}
Porque: {o arquivo, a decisão registrada ou o padrão que sustenta o valor}
Opções: {recomendado} | outro (descreva)
</pergunta>

Se o protocolo resolveu tudo, não pergunte nada: anuncie em uma linha o que foi lido e siga direto para o
Estágio 2.

## Estagio 2: ARQUITETURA

### 2.0 Gate: Inicializar .plano/

```bash
mkdir -p .plano .plano/captures .plano/fases .plano/issues-carryover .plano/governance
git init 2>/dev/null
```

### 2.1 Detectar Modo

```bash
if ls package.json src/ app/ pages/ components/ 2>/dev/null; then MODE=brownfield; else MODE=greenfield; fi
```

### 2.2 Pesquisa OU Mapeamento (paralelo)

**Greenfield:** se `.plano/pesquisa/SUMMARY.md` nao existe, o `up-arquiteto` faz a pesquisa
inline (web search, um passe) e escreve o SUMMARY. Nao spawnar `up-pesquisador` nem
`up-sintetizador`.

**Brownfield:** se `.plano/codebase/` nao existe, sugerir `/up:mapear-codigo`
(`@~/.claude/up/workflows/mapear-codigo.md`); senao reutilizar o mapa.

### 2.3 Pipeline de Arquitetura (Agents SEPARADOS + GATE)

**Inicializar governance:**
```bash
touch .plano/governance/approvals.log
[ -s .plano/governance/approvals.log ] || \
  echo "# Governance initialized at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .plano/governance/approvals.log
```

```python
# PASSO 1: Arquiteto (absorve system-designer + a analise de produto)
# Faz o design upfront: modulos, roles, schema, rotas, permissoes, blueprints de producao,
# E deriva PROJECT.md + ROADMAP.md + REQUIREMENTS.md + SYSTEM-DESIGN.md.
Agent(subagent_type="up-arquiteto", prompt="""
  Projetar a arquitetura e a estrutura do projeto a partir do BRIEFING.

  <files_to_read>
  - .plano/BRIEFING.md
  - .plano/pesquisa/SUMMARY.md (se existir)
  - .plano/codebase/ARCHITECTURE.md, STACK.md, CONVENTIONS.md (se brownfield)
  - ~/.claude/up/owner-profile.md (stack preferida)
  Sob demanda: $HOME/.claude/up/references/production-requirements.md
  </files_to_read>

  Pesquisa, roteiro e auto-checagem sao SEUS. Nao espere pesquisador, roteirista ou sintetizador.
  Se .plano/pesquisa/SUMMARY.md nao existe (greenfield), faca um passe de WebSearch e escreva-o.

  Produzir:
  - .plano/SYSTEM-DESIGN.md (modulos, roles, data model/schema, rotas, permissoes, blueprints de prod)
  - .plano/PROJECT.md (visao do produto, requisitos, decisoes-chave)
  - .plano/ROADMAP.md (fases derivadas dos requisitos, com criterios de sucesso)
  - .plano/REQUIREMENTS.md (REQ-IDs por categoria, rastreabilidade fase<->requisito)
  - Auto-checagem: cada REQ especifico, testavel, mapeado a uma fase
""")
```

```bash
# GATE: artefatos de arquitetura existem?
[ -f .plano/SYSTEM-DESIGN.md ] && [ -f .plano/PROJECT.md ] && [ -f .plano/ROADMAP.md ] && [ -f .plano/REQUIREMENTS.md ] \
  && echo "OK" || { echo "FALHOU: re-spawnar up-arquiteto"; exit 1; }
```

**Multica: criar 1 issue-filha por fase (so se `--board`, BATCHED, MODO PROJETO).**
Agora que o ROADMAP existe com todas as fases, `multica init` garante o project + a issue-pai e cria 1
issue-filha por fase (`--parent <pai> --status backlog`, `metadata up_project=<repo> up_phase=N`) numa
chamada batched (uma por fase, nao por microtransicao). Idempotente: reconcilia via
`multica issue list --metadata up_project=<repo> --metadata up_phase=N` (nao duplica em re-plans).
FAIL-OPEN: se `multica` indisponivel ou erro, avisa e segue o planejamento sem board. Deteccao `uname -s`
fica dentro de `multica.cjs`. So roda no MODO PROJETO (no MODO FASE nao recria o board).

```bash
if [ "$BOARD" = "true" ] && [ "$MODE_FASE" != "true" ]; then
  node "$HOME/.claude/up/bin/up-tools.cjs" multica init --from-roadmap --raw 2>/dev/null \
    || echo "AVISO: Multica indisponivel (init/issues por fase). Seguindo o plano sem board."
fi
```

O arquiteto ja escreveu e auto-checou os REQUIREMENTS no passo 1. Nao spawnar `up-sintetizador`.
Se o orquestrador achar buraco obvio (REQ sem fase, fase sem criterio), devolve ao arquiteto
na mesma rodada. Sem agente extra.

## Estagio 2.5: PLANEJAMENTO EXAUSTIVO

**Para CADA fase do ROADMAP (MODO PROJETO) ou para a fase pedida (MODO FASE), planejar AGORA.**

```bash
PHASES=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap list-phases)
```

### Esboco de fronteiras de teste (ANTES de qualquer spawn de planejador)

Carregar `@$HOME/.claude/up/references/seams.md`. Esbocar as fronteiras candidatas aplicando as
tres regras (existente vence nova, mais alta vence mais baixa, numero ideal UM). Apresentar ao dono
no formato do ciclo (pergunta, resposta recomendada e motivo):

```
Fronteira de teste desta fase (onde o teste vai encostar):

  Recomendado: {contrato publico}  ({tipo}, {existente|nova})
  Motivo: {por que esta e a mais alta disponivel e por que uma so basta}

  [1] Confirmar a recomendada
  [2] Ajustar (descreva a fronteira que voce prefere)
```

Regras duras:
- Mais de uma fronteira so entra com justificativa escrita na propria entrada, e essa justificativa
  vai para o campo `justificativa` do plano pronto.
- Fato contra decisao: se a fronteira ja existe no codigo, o agente descobre isso sozinho (busca no
  codigo e mapa do codebase) e nao pergunta se existe. So sobe ao dono a ESCOLHA entre candidatas.

Apos a confirmacao, gravar a entrada no log no formato documentado de seis colunas:

```bash
mkdir -p .plano/governance
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | phase-${PHASE_NUMBER} | up-planejador | CONFIRMED | fronteiras acordadas com o dono: ${SEAM_RESUMO} | evidence=seams:confirmed" \
  >> .plano/governance/approvals.log
```

Nota: `CONFIRMED` nao e veredito de fase. Ele soma evidencia e nunca substitui a evidencia do tipo
da fase, que continua exigida.

Para cada fase — `up-planejador` faz self-check (sem camada de revisao intermediaria):

```python
Agent(
  subagent_type="up-planejador",
  prompt=f"""
    Planejar Fase {phase_number}: {phase_name}.

    Modo: builder (autonomo, sem AskUserQuestion no MODO PROJETO; no MODO FASE pode coletar contexto).
    Plano = contrato: o que fica verdadeiro, o que fica de fora, a prova. Sem import, SQL ou caminho de arquivo.

    <files_to_read>
    TIER 1: .plano/STATE.md, .plano/fases/{phase_number}/PHASE.md,
            .plano/fases/{phase_number}/REQUIREMENTS-SLICE.md
    TIER 2 (brownfield): .plano/codebase/CONVENTIONS.md, CONCERNS.md, ARCHITECTURE.md
    TIER 3 (sob demanda): .plano/SYSTEM-DESIGN.md, .plano/PROJECT.md, .plano/ROADMAP.md, .plano/REQUIREMENTS.md
    FALLBACK: se as slices nao existem, carregar ROADMAP.md e REQUIREMENTS.md completos.
    </files_to_read>

    REQs da fase: {phase_req_ids}
    Gerar o menor numero de planos que separe o que e independente. Fase pequena = 1 plano.
    Cada plano: 2-5 entregas de resultado, sem receita de implementacao.

    SELF-CHECK obrigatorio antes de retornar: confirme que cada tarefa e implementavel, que os REQs da
    fase estao 100% cobertos, e que dependencias/waves estao corretas. Corrija o que falhar.
  """
)
```

```bash
# GATE: planos da fase existem?
PLAN_COUNT=$(ls .plano/fases/${PHASE_DIR}/*-PLAN.md 2>/dev/null | wc -l)
[ "$PLAN_COUNT" -eq 0 ] && echo "GATE FALHOU: nenhum PLAN.md para fase ${phase_number}. Re-spawnar planejador." && exit 1
echo "OK: ${PLAN_COUNT} planos para fase ${phase_number}"
```

**Repetir para cada fase (MODO PROJETO).**

## Estagio E: DECISOES ESCALADAS

Os subagentes não falam com o dono. Quando esbarram numa decisão de arquitetura ou num trade-off, eles seguem
aplicando a própria recomendação e devolvem o bloco `## DECISOES ESCALADAS` no retorno. Aqui esse bloco vira
pergunta.

1. Recolher os blocos `## DECISOES ESCALADAS` de todos os retornos desta rodada (arquiteto e planejadores).
2. Descartar as linhas `Nenhuma.`. Se sobrou zero decisão, declarar em uma linha
   ("Nenhuma decisão foi escalada nesta rodada") e seguir para o Estágio P sem perguntar nada.
3. Ordenar as decisões restantes por custo de reverter, da maior para a menor.
4. Perguntar uma por vez, no formato do contrato:

<pergunta id="plan.decisoes-escaladas">
Pergunta: {Decisao do bloco escalado}. Confirma a recomendação ou corrige?
Recomendo: {Recomendo do bloco escalado}
Porque: {Porque do bloco escalado}
Opções: {Recomendo} | {cada item de Alternativas} | outro (descreva)
</pergunta>

5. Registrar cada resposta em `.plano/BRIEFING.md`, na seção `## Decisões confirmadas no planejamento`
   (criar a seção se não existir), com uma linha por decisão: a escolha, quem escolheu (dono) e a data.
6. Resposta que **confirma** a recomendação: nada é refeito, porque o agente já trabalhou sob ela.
   Resposta que **diverge**: re-executar apenas o agente cujo trabalho dependia daquela decisão, passando a
   escolha do dono como decisão travada, e só depois seguir para o Estágio P.

Este estágio roda no MODO PROJETO e no MODO FASE. No MODO FASE, os blocos vêm apenas dos planejadores.

## Estagio P: PLANNING REVIEW, somente com `--review`

Default: PULAR. `--no-audit` continua existindo como alias de pular (agora e o comportamento
padrao). `--review` spawna `up-revisor` para a revisao consolidada do planejamento.

Sem `--review`, o orquestrador gera um AUDIT-PLAN.md minimo (confidence inferida do self-check
dos planejadores, sem nota inventada alta) e grava no log:

```bash
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | planning | up-planejador | APPROVE | self-check dos planos | confidence=skip" \
  >> .plano/governance/approvals.log
```

Depois segue para o Estagio PR.

Se `--review`, spawnar `up-revisor`:

```python
Agent(
  subagent_type="up-revisor",
  prompt="""
    Revisar o planejamento completo (escopo: planning). Two-stage adaptado ao planejamento:

    STAGE 1 — spec-compliance cetico: os planos cobrem 100% dos REQUIREMENTS? Ha plano "rapido demais"
    que pula um REQ? Calcular Planning Confidence Score (0-100).
    STAGE 2 — qualidade: coerencia cross-fase, dependencias/waves corretas, plano como contrato
    (objetivo e prova, sem receita de codigo), sem contradicao entre SYSTEM-DESIGN e planos.

    <files_to_read>
    - .plano/PROJECT.md, .plano/ROADMAP.md, .plano/REQUIREMENTS.md, .plano/SYSTEM-DESIGN.md
    - .plano/REQUIREMENTS-VALIDATION.md (se existir)
    - .plano/fases/*/*.md
    - $HOME/.claude/up/templates/audit-plan.md
    </files_to_read>

    Gerar .plano/AUDIT-PLAN.md (usando o template) com o Planning Confidence Score.
    Decisao: APPROVE (READY_FOR_BUILD) | REQUEST_CHANGES (NEEDS_REWORK) | BLOCK.

    **OUTPUT OBRIGATORIO (ANTES de retornar):**
    ```bash
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | planning | up-revisor | {DECISAO} | confidence=NN" >> .plano/governance/approvals.log
    ```
  """
)
```

### GATE de planejamento (deterministico)

```bash
echo "=== GATE: planning ==="
[ -f .plano/AUDIT-PLAN.md ] || { echo "FALHA: sem AUDIT-PLAN.md"; exit 1; }
DECISION=$(node "$HOME/.claude/up/bin/up-tools.cjs" gate verdict --scope planning --field decision)
[ -z "$DECISION" ] && echo "FALHA: up-revisor NAO logou planning" && exit 1
```

**Processar:**
- `APPROVE`: prosseguir pro Estagio PR.
- `REQUEST_CHANGES`: cap de rework 1 round (governance.md). Re-spawn planejador/arquiteto com o review;
  apos 1 round, forced approval com debito tecnico.
- `BLOCK`: perguntar com este conteúdo:

<pergunta id="plan.revisor-bloqueou">
Pergunta: A revisão do planejamento bloqueou. O que fazer?
Recomendo: Corrigir o item bloqueante e re-revisar
Porque: {o motivo registrado pela revisão}, e é correção dirigida a um item do planejamento, não replanejamento inteiro.
Opções: Corrigir e re-revisar | Aceitar como dívida e seguir para o plano pronto | Parar o planejamento
</pergunta>

## Estagio PR: PLAN READY

### PR.1 Gerar PLAN-READY.md

Usar template `$HOME/.claude/up/templates/plan-ready.md`. Preencher: planned_at, planned_by.runtime
(detectar), intended_execution.runtime (flag --execution-runtime ou "same"), project_name, mode,
total_phases/plans/requirements, planning_confidence (do AUDIT-PLAN.md), lista completa de planos,
`plan_schema: 2`, o bloco `seams:` (com as fronteiras confirmadas no esboco) e o campo
`fora_de_escopo`.

```bash
if [ -d ~/.claude ]; then RUNTIME="claude-code"
elif [ -d ~/.config/opencode ]; then RUNTIME="opencode"
elif [ -d ~/.gemini ]; then RUNTIME="gemini-cli"; fi
```

Validar antes de commitar:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" gate plan-ready --raw
```

Plano pronto reprovado e corrigido antes do commit, nunca commitado como esta.

### PR.2 Commit Final

```bash
git add .plano/
node "$HOME/.claude/up/bin/up-tools.cjs" commit "plan: project ready for execution" --files .plano/PLAN-READY.md .plano/AUDIT-PLAN.md
```

### PR.3 Apresentar (orquestrador, sem CEO)

Output direto, le owner-profile pra tom:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > /up:plan COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Projeto planejado. Confidence: {N}/100. Fases: {N}. Planos: {M}.
Pendencias: {de PENDING.md}.

Proximo passo:
  /up:build              ← executar neste runtime
Ou em outro runtime:
  cd <projeto> && /up:build  (OpenCode / Gemini CLI — plano viaja no .plano/)

Estado completo em .plano/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

</process>

<flags>

### --execution-runtime=<runtime>
Informa ao planejador qual runtime sera usado pra executar.
Valores: `same` | `claude-code` | `opencode` | `gemini-cli` | `any`. Default: `same`.
Marca em PLAN-READY.md; o build valida compatibilidade.

```bash
/up:plan "CRM" --execution-runtime=opencode
```

### --no-audit
Alias de pular o Planning Review (estagio P). Agora e o default. Mantido para nao quebrar invocacoes antigas.

### --review
Opt-in. Roda o Planning Review com `up-revisor` (estagio P). Sem esta flag, o orquestrador segue
depois do self-check do planejador.

### --board
Espelha o plano no Multica (OPT-IN). Ao gerar o ROADMAP (MODO PROJETO), cria 1 issue-filha por fase
(batched, `--status backlog`, `metadata up_project up_phase`) sob a issue-pai do projeto. Idempotente
(reconcilia via metadata, nao duplica). FAIL-OPEN: `multica` indisponivel -> avisa e planeja sem board.
Sem stream ao vivo: o board reflete so status. O `/up:build --board` continua a sincronizacao na execucao.

</flags>

<success_criteria>
- [ ] Owner profile validado
- [ ] Intake consumido de BRIEFING.md (ou intake minimo inline, sem CEO)
- [ ] Deteccao projeto vs fase (absorve discutir-fase/planejar-fase)
- [ ] up-arquiteto gerou SYSTEM-DESIGN + PROJECT + ROADMAP + REQUIREMENTS (pesquisa, roteiro e validacao inline; sem pesquisador/roteirista/sintetizador)
- [ ] TODAS as fases planejadas com PLAN.md (self-check do planejador)
- [ ] Revisao de planejamento somente com `--review`. Default: orquestrador grava APPROVE de self-check
- [ ] GATE de planejamento deterministico passou via leitor unico (`gate verdict --scope planning`): APPROVE ou forced approval
- [ ] AUDIT-PLAN.md gerado (minimo no default; completo com `--review`)
- [ ] Fronteiras esbocadas e confirmadas com o dono antes do planejamento (entrada evidence=seams:confirmed)
- [ ] PLAN-READY.md gerado com plan_schema 2 e seams, aprovado por `gate plan-ready`, e committado
- [ ] `--board` (se passado, MODO PROJETO): 1 issue-filha Multica por fase criada batched (via `multica init --from-roadmap`), idempotente e fail-open
- [ ] Apresentacao = output do orquestrador (sem CEO)
- [ ] Nenhuma referencia a CEO, chiefs, camadas de revisao intermediaria ou aos agentes de planejamento deletados
</success_criteria>
</output>
