<purpose>
Workflow `/up:plan` — Planejamento completo de projeto OU de fase.

Conduz Arquitetura + Planejamento exaustivo de TODAS as fases + Planning Review + PLAN-READY.

NAO executa nada. Para apos gerar PLAN-READY.md. Resultado: projeto completamente planejado, pronto
para `/up:build` no mesmo runtime ou outro.

Absorveu discutir-fase.md e planejar-fase.md: detecta automaticamente se o pedido e o PROJETO inteiro
ou uma FASE especifica (`/up:plan` vs `/up:plan N`).
</purpose>

> Vocabulário UP: fase, plano, onda, evidência, worktree, escape hatch, verificação e laço DCRV têm definição única em `$HOME/.claude/up/references/glossario-up.md`. Use o termo, não redefina.

<core_principle>
Pipeline final (caminho quente, sem `--profundo`):

```
up-arquiteto (pesquisa inline + roadmap com limite de fase + slices SO da proxima fase)
  -> a propria sessao escreve o PLAN.md da proxima fase (template de uma pagina) -> PLAN-READY.md
```

`up-planejador` nao entra nesse caminho: quem escreve o plano e a sessao que acabou de rodar o
arquiteto (ou o brainstorm, em MODO FASE de projeto ja iniciado), sem overhead de agente frio.
`--profundo` restaura o pipeline anterior inteiro (ver `<flags>`): `up-planejador` por fase, todas
as fases de uma vez, self-check e loop de `validate-plan`.

`--review` devolve o `up-revisor` de planejamento (funciona nos dois caminhos). `up-pesquisador`,
`up-roteirista` e `up-sintetizador` nao entram como processo em nenhum dos dois. O arquiteto absorve
pesquisa, roteiro e validacao.

O intake/brainstorm NAO acontece aqui — ja rodou no `/up` (workflows/up.md, inline, sem CEO) e produziu
`.plano/BRIEFING.md`. `/up:plan` consome o BRIEFING. Se for chamado direto sem BRIEFING, faz um intake
minimo inline (sem CEO).

**Model routing configuravel (v0.9.0+):**
```bash
MODEL=$(node "$HOME/.claude/up/bin/up-tools.cjs" config resolve-model {agent-name} --raw)
```
Default fixo: Opus planeja, Sonnet executa. `default` -> nao passar model=.

**Planos sao contrato.** Objetivo, fora de escopo, entregas e prova. Sem receita de codigo.

**Um agente por passo.** Arquiteto projeta, planejador planeja. Quem confere e o orquestrador lendo os
artefatos. Sem supervisores.

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
fase). Senao, **MODO PROJETO** (arquitetura completa; plano em si e so da proxima fase, salvo `--profundo`).

**`--profundo` presente:** planejar TODAS as fases (MODO PROJETO) ou a fase pedida com o pipeline
pesado (MODO FASE), como na v3.0. **Sem a flag (default):** MODO PROJETO gera arquitetura completa mas
so escreve PLAN.md da PROXIMA fase; MODO FASE escreve so o PLAN.md da fase pedida. Nos dois casos sem
flag, quem escreve o PLAN.md e a propria sessao (ver Estagio 2.5), nao um `up-planejador` novo.

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
mkdir -p .plano .plano/captures .plano/fases .plano/issues-carryover
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

### 2.3 Pipeline de Arquitetura

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
  Sob demanda: $HOME/.claude/up/references/product-engineering.md
  </files_to_read>

  Pesquisa, roteiro e auto-checagem sao SEUS. Nao espere pesquisador, roteirista ou sintetizador.
  Se .plano/pesquisa/SUMMARY.md nao existe (greenfield), faca um passe de WebSearch e escreva-o.

  Limite de fase (default, sem --profundo): cada fase cabe em ate ~5 entregas pedidas
  (implicitos nao contam), 1 plano por padrao. Requisito demais para uma fase so: quebre em mais
  fases no ROADMAP. Gere PHASE.md e REQUIREMENTS-SLICE.md SO da proxima fase ainda nao planejada
  (as demais ficam so no ROADMAP, sem slice, ate a vez delas). Com --profundo: gere slice de todas.

  Produzir:
  - .plano/SYSTEM-DESIGN.md (modulos, roles, data model/schema, rotas, permissoes, blueprints de prod)
  - .plano/PROJECT.md (visao do produto, requisitos, decisoes-chave)
  - .plano/ROADMAP.md (TODAS as fases derivadas dos requisitos, com criterios de sucesso, respeitando o limite)
  - .plano/REQUIREMENTS.md (REQ-IDs por categoria, rastreabilidade fase<->requisito)
  - .plano/fases/{NN}/PHASE.md + REQUIREMENTS-SLICE.md (so da proxima fase, salvo --profundo: todas)
  - Auto-checagem: cada REQ especifico, testavel, mapeado a uma fase
""")
```

```bash
# Artefatos de arquitetura existem?
[ -f .plano/SYSTEM-DESIGN.md ] && [ -f .plano/PROJECT.md ] && [ -f .plano/ROADMAP.md ] && [ -f .plano/REQUIREMENTS.md ] \
  && echo "OK" || { echo "FALTOU artefato: re-spawnar up-arquiteto"; exit 1; }
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

## Estagio 2.5: PLANEJAMENTO

**Sem `--profundo` (default): so a proxima fase ganha PLAN.md**, escrito pela PROPRIA SESSAO, sem
spawnar `up-planejador`. MODO PROJETO: a proxima fase e a primeira do ROADMAP. MODO FASE: e a fase
pedida no argumento.

Proxima fase sem argumento: a primeira fase `- [ ]` do ROADMAP.md que ainda nao tem `*-PLAN.md` em
`.plano/fases/` (`roadmap list-phases` e `phase-plan-index N` confirmam).

### 2.5.a Escrever o PLAN.md na sessao (default)

A sessao ja leu (ou acabou de gerar) `.plano/fases/{NN}/PHASE.md` e `REQUIREMENTS-SLICE.md`. Sem
reabrir agente novo, escreva agora `.plano/fases/{NN}/{NN}-01-PLAN.md` (ou `-02`, `-03` so se a fase
tiver areas disjuntas de verdade) usando `$HOME/.claude/up/templates/plan.md`:

1. Objetivo em 1-3 frases (do PHASE.md).
2. Fora de escopo: o que essa fase deliberadamente nao cobre.
3. Ate ~5 entregas pedidas (`### N. titulo`), cada uma com `Implicitos:` (uma linha, so o que do
   padrao de Product Engineer se aplica) e `Prova:` (uma linha, o tipo).
4. Critério de pronto: 2-4 frases observaveis.
5. Sem import, SQL, tipo, assinatura de funcao ou caminho de arquivo como receita.

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" validate-plan .plano/fases/{NN}/{NN}-01-PLAN.md --raw
```

`validate-plan` so avisa (nunca bloqueia nem forca reescrever): leia `suggestions` e ajuste o plano so
se a sugestao for obviamente correta (ex.: plano virou receita, tarefas demais). Commitar:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "plan(${PHASE}): ${PLAN_NAME}" --files .plano/fases/${PHASE_DIR}/${PHASE}-01-PLAN.md
```

### 2.5.b `--profundo`: pipeline anterior, todas as fases

```bash
PHASES=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap list-phases)
```

Para cada fase, `up-planejador` faz self-check (sem camada de revisao intermediaria):

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
PLAN_COUNT=$(ls .plano/fases/${PHASE_DIR}/*-PLAN.md 2>/dev/null | wc -l)
[ "$PLAN_COUNT" -eq 0 ] && echo "Nenhum PLAN.md para fase ${phase_number}. Re-spawnar planejador." && exit 1
echo "OK: ${PLAN_COUNT} planos para fase ${phase_number}"
```

**Repetir para cada fase (MODO PROJETO com `--profundo`).**

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
padrao). Sem `--review`, o self-check do planejador basta e o orquestrador segue direto para o
Estagio PR.

Se `--review`, spawnar `up-revisor`:

```python
Agent(
  subagent_type="up-revisor",
  prompt="""
    Revisar o planejamento completo (escopo: planning). Two-stage adaptado ao planejamento:

    STAGE 1: spec-compliance cetico: os planos cobrem 100% dos REQUIREMENTS? Ha plano "rapido demais"
    que pula um REQ? Calcular Planning Confidence Score (0-100).
    STAGE 2: qualidade: coerencia cross-fase, dependencias/ondas corretas, plano como contrato
    (objetivo e prova, sem receita de codigo), sem contradicao entre SYSTEM-DESIGN e planos.

    <files_to_read>
    - .plano/PROJECT.md, .plano/ROADMAP.md, .plano/REQUIREMENTS.md, .plano/SYSTEM-DESIGN.md
    - .plano/fases/*/*.md
    - $HOME/.claude/up/templates/audit-plan.md
    </files_to_read>

    Gerar .plano/AUDIT-PLAN.md (usando o template) com o Planning Confidence Score e o veredito:
    APPROVE (READY_FOR_BUILD) | REQUEST_CHANGES (NEEDS_REWORK) | BLOCK.
  """
)
```

**Processar o veredito do AUDIT-PLAN.md:**
- `APPROVE`: prosseguir pro Estagio PR.
- `REQUEST_CHANGES`: re-spawnar planejador/arquiteto com o review como contexto, uma rodada. Depois seguir
  (o que sobrar vira ressalva no PLAN-READY).
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
`profundo` (true so com a flag), total_phases (do ROADMAP, sempre completo)/total_plans (so os que
tem PLAN.md agora: 1 fase sem `--profundo`, todas com `--profundo`), lista completa de planos com
PLAN.md e o campo `fora_de_escopo`. Sem `planning_confidence` fora de `--review` (o AUDIT-PLAN.md
so existe com a flag; sem revisao, o self-check basta e nao produz score).

```bash
if [ -d ~/.claude ]; then RUNTIME="claude-code"
elif [ -d ~/.config/opencode ]; then RUNTIME="opencode"
elif [ -d ~/.gemini ]; then RUNTIME="gemini-cli"; fi
```

Conferir antes de commitar que todo plano listado existe no disco:

```bash
for plan in $(grep -oE "fases/[0-9]+-[a-z-]+/[0-9]+-[0-9]+-PLAN.md" .plano/PLAN-READY.md); do
  [ -f ".plano/$plan" ] || echo "FALTANDO: $plan"
done
```

### PR.2 Commit Final

```bash
git add .plano/
node "$HOME/.claude/up/bin/up-tools.cjs" commit "plan: project ready for execution" --files .plano/PLAN-READY.md
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

### --profundo
Restaura o pipeline pesado da v3.0: `up-planejador` (subagente) planeja TODAS as fases de uma vez
(MODO PROJETO) ou a fase pedida com pesquisa/self-check completo (MODO FASE), com o loop de
`validate-plan` (refaz se `pass=false`) e o formato antigo de plano (must_haves goal-backward).
Use para projeto grande, ou para planejar num runtime e executar em outro. Sem a flag (default), a
propria sessao escreve o plano de uma pagina, sem spawnar planejador, e so a proxima fase e planejada.

```bash
/up:plan "CRM" --profundo
/up:plan 7 --profundo
```

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
- [ ] up-arquiteto gerou SYSTEM-DESIGN + PROJECT + ROADMAP + REQUIREMENTS (pesquisa, roteiro e validacao inline; sem pesquisador/roteirista/sintetizador), respeitando o limite de ~5 entregas por fase
- [ ] Sem `--profundo`: so a proxima fase ganha PLAN.md, escrito pela sessao (sem `up-planejador`). Com `--profundo`: TODAS as fases planejadas com PLAN.md via `up-planejador` (self-check)
- [ ] Revisao de planejamento somente com `--review` (gera AUDIT-PLAN.md). Default: self-check (do planejador com `--profundo`; da propria sessao sem a flag)
- [ ] PLAN-READY.md gerado, todo plano listado existe no disco, committado
- [ ] `--board` (se passado, MODO PROJETO): 1 issue-filha Multica por fase criada batched (via `multica init --from-roadmap`), idempotente e fail-open
- [ ] Apresentacao = output do orquestrador (sem CEO)
- [ ] Nenhuma referencia a CEO, chiefs, camadas de revisao intermediaria ou aos agentes de planejamento deletados
</success_criteria>
</output>
