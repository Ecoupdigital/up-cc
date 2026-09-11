<purpose>
Workflow `/up:build`: execucao de projeto previamente planejado.

Requer `.plano/PLAN-READY.md` (gerado por `/up:plan`). Conduz o loop por fase e a entrega. Pode
executar um projeto planejado em outro runtime: confia no PLAN-READY.md.

Este e o motor unico de execucao do UP. Na v3 ele ficou leve: o modelo e capaz, o UP guia em vez
de policiar. Uma prova por plano, escrita por quem executou, no SUMMARY. Sem log de aprovacoes, sem
gate deterministico, sem verificador nem revisor no caminho quente (continuam como opt-in).
</purpose>

> Vocabulário UP: fase, plano, onda, evidência, worktree, escape hatch, verificação e laço DCRV têm definição única em `$HOME/.claude/up/references/glossario-up.md`. Use o termo, não redefina.

<core_principle>
Pipeline por fase (caminho quente):

```
abrir fase (worktree + branch + issue)
  -> ondas de up-executor (paralelo dentro da onda, ondas em sequencia)
  -> conferir SUMMARY de cada plano (com secao Prova)
  -> verify-static (so se o projeto tiver lint/typecheck/teste)
  -> decisoes escaladas (se houver)
  -> teste visual pre-merge (se a fase tem UI)
  -> menu de fechamento -> merge
```

`--review` acrescenta `up-verificador` + `up-revisor` depois das ondas. `--testar` acrescenta o laco
DCRV (`up-tester`). Sem essas flags, nenhum dos dois entra.

**Modelo dos agentes:** antes de spawnar, resolver `MODEL=$(node "$HOME/.claude/up/bin/up-tools.cjs" config resolve-model {agent} --raw)`.
Se `default`, nao passar `model=`.

**Re-plan local (max 2 por projeto):** se um plano se revelar inviavel durante a execucao, o orquestrador
re-planeja SO aquele plano via `up-planejador`. Nunca volta pro runtime que planejou.

**Um agente por passo.** Executor executa; quem confere e o orquestrador lendo o SUMMARY e o diff. Nao
peca ao executor que se auto-aprove nem crie agente de aprovacao.

**GitHub-nativo e o default. GitHub e interacao humana sao eixos separados:**

- **Eixo GitHub:** ligado sempre que ha remote e (`gh` autenticado ou MCP do GitHub). Worktree e branch sao
  git local e sempre acontecem. Issue e PR usam o transporte (`gh` ou `mcp`). Desliga so com `--local` ou
  `config.github_native=false`.
- `--local`: escape hatch sem GitHub. Commit atomico na branch atual, zero worktree/issue/PR.
- `--solo`: autonomo total. Mantem GitHub (branch/worktree/issue/PR + auto-merge), sem menu e sem gate visual.
- `--auto`: pula o menu de fechamento (auto-merge). O gate visual ainda roda se `require_visual_test=true`.
- **Teste visual pre-merge** (`require_visual_test`, default true): fase com UI sobe o dev server e o dono
  aprova na tela antes do merge. `--solo` pula sempre; `--auto` so pula com `require_visual_test=false`.
- `--board`: espelha status no Multica (opt-in, batched, fail-open).
- `--review`: opt-in. `up-verificador` + `up-revisor` depois das ondas.
- `--testar`: opt-in. Laco DCRV depois das ondas.

| Flag | GitHub | Menu fim | Gate visual | Merge | Revisor / DCRV |
|------|:---:|:---:|:---:|---|---|
| (nenhum) | SIM | SIM | SIM | conforme menu | NAO |
| `--auto` | SIM | NAO | SIM (salvo require_visual_test=false) | auto squash | NAO |
| `--solo` | SIM | NAO | NAO | auto squash | NAO |
| `--local` | NAO | NAO | NAO | commit na branch atual | NAO |
| `--review` | (herda) | (herda) | (herda) | (herda) | verificador + revisor |
| `--testar` | (herda) | (herda) | (herda) | (herda) | DCRV |

**Contrato de pergunta:** antes da primeira pergunta, carregue `Read $HOME/.claude/up/references/questioning.md`
e aplique `<contrato_de_pergunta>`. Toda pergunta leva recomendacao e motivo, recomendada em primeiro.

**O que este workflow resolve sozinho e nunca pergunta:** runtime atual, modo de repositorio e autonomia
(flags e config), estrategia de merge (config), se a fase tem interface (tipo dos planos e scripts do
manifesto), contagem de planos, resumos e ondas (leitura de arquivo), estado de worktree, branch, issue e PR
(mapa git). Tudo isso e anunciado em uma linha.

**Fail-open:** `start-phase` e `finish-phase` detectam remote e transporte. Sem remote, degradam para git
local com aviso. Nunca crasham.

**Onde o estado vive:** `git-map.json` e canonico no working dir principal. O `.plano/` da fase viaja na branch
da fase e volta pra main no merge. STATE.md e a fonte humana de "onde estou".
</core_principle>

<process>

## Estagio 0: Pre-requisitos

### 0.1 Owner profile

```bash
[ -f ~/.claude/up/owner-profile.md ] || echo "Owner profile ausente neste runtime. Rodar onboarding (@~/.claude/up/workflows/onboarding.md)."
```

### 0.2 PLAN-READY.md

```bash
[ -f .plano/PLAN-READY.md ] || { echo "ERRO: projeto nao planejado. Use /up:plan primeiro."; exit 1; }
```

### 0.3 Crash recovery

```bash
ls .plano/LOCK.md 2>/dev/null
```

Se existe com `stage: build`: retomar da fase e plano certos (pular o que ja tem SUMMARY). Se
`status: completed`: apagar e iniciar normalmente.

## Estagio V: Validacao light

Confiar no PLAN-READY.md, conferindo so a estrutura.

```bash
INTENDED_RUNTIME=$(grep -A1 "intended_execution:" .plano/PLAN-READY.md | tail -1 | awk '{print $2}')
TOTAL_PHASES=$(grep "total_phases:" .plano/PLAN-READY.md | awk '{print $2}')
CURRENT_RUNTIME="claude-code"
[ -d ~/.config/opencode ] && CURRENT_RUNTIME="opencode"
[ -d ~/.gemini ] && CURRENT_RUNTIME="gemini-cli"

FAIL=0
for f in PROJECT.md ROADMAP.md REQUIREMENTS.md; do [ -f ".plano/$f" ] || { echo "FALTANDO: $f"; FAIL=1; }; done
for plan in $(grep -oE "fases/[0-9]+-[a-z-]+/[0-9]+-[0-9]+-PLAN.md" .plano/PLAN-READY.md); do
  [ -f ".plano/$plan" ] || { echo "FALTANDO: $plan"; FAIL=1; }
done
```

Se `$INTENDED_RUNTIME` nao for `same`, `any` nem `$CURRENT_RUNTIME`:

<pergunta id="build.runtime-divergente">
Pergunta: O plano foi feito para {INTENDED_RUNTIME} e você está em {CURRENT_RUNTIME}. Sigo assim?
Recomendo: Seguir neste runtime
Porque: o plano pronto viaja inteiro no diretório de planejamento e não depende de recurso exclusivo do runtime planejado.
Opções: Seguir neste runtime | Abortar e executar no runtime planejado
</pergunta>

Se `FAIL=1`:

<pergunta id="build.plano-incompleto">
Pergunta: Falta {lista dos artefatos ausentes} para executar. O que fazer?
Recomendo: Re-planejar localmente
Porque: {o que está faltando} não é recuperável na execução, e o re-planejamento local reaproveita o que já existe.
Opções: Re-planejar localmente | Abortar
</pergunta>

## Estagio C: Confirmacao do dono

Resolver o modo antes do banner:

```bash
if [ "$LOCAL" = "true" ]; then GITHUB_NATIVE=false
else
  GITHUB_NATIVE=$(node "$HOME/.claude/up/bin/up-tools.cjs" config get github_native --raw 2>/dev/null)
  [ -z "$GITHUB_NATIVE" ] && GITHUB_NATIVE=true
fi
AUTONOMO=false; { [ "$SOLO" = "true" ] || [ "$AUTO" = "true" ]; } && AUTONOMO=true
if [ "$GITHUB_NATIVE" = "true" ]; then
  GITHUB_MODE="GitHub-nativo (worktree + issue + PR/menu por fase)"
  [ "$AUTO" = "true" ] && GITHUB_MODE="GitHub-nativo --auto (PR + merge squash; gate visual ainda roda)"
  [ "$SOLO" = "true" ] && GITHUB_MODE="GitHub-nativo --solo (autonomo total, sem gate visual)"
else
  GITHUB_MODE="--local (commit atomico na branch atual)"
fi
BOARD=false; [ "$BOARD_FLAG" = "true" ] && BOARD=true
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Resumo: {N} fases, {M} planos. Pendencias: {de PENDING.md}.
Modo git: {GITHUB_MODE}
```

<pergunta id="build.iniciar-execucao">
Pergunta: Inicio a execução agora?
Recomendo: Iniciar
Porque: o plano pronto passou na validação, o modo de repositório resolvido é {GITHUB_MODE} e as pendências conhecidas não bloqueiam a primeira onda.
Opções: Iniciar | Mudar o modo antes de iniciar | Não iniciar agora
</pergunta>

Pendencia bloqueante em `.plano/PENDING.md` inverte a recomendacao para "Não iniciar agora" e a nomeia.
Em `--solo` ou `--auto`, nao perguntar: anunciar o modo e iniciar.

**Board (so `--board`, uma vez):**

```bash
[ "$BOARD" = "true" ] && { node "$HOME/.claude/up/bin/up-tools.cjs" multica init --raw 2>/dev/null || echo "AVISO: Multica indisponivel. Seguindo sem board."; }
```

## Estagio 3: Loop por fase

Para cada fase do ROADMAP.md, em ordem:

### 3.0 Abrir a fase

```bash
PHASE_SLUG=$(node "$HOME/.claude/up/bin/up-tools.cjs" slug "{phase_name}" --raw)
if [ "$GITHUB_NATIVE" = "true" ]; then
  START=$(node "$HOME/.claude/up/bin/up-tools.cjs" github start-phase --phase {phase_number} --slug "$PHASE_SLUG" --raw)
  if [[ "$START" == @file:* ]]; then START=$(cat "${START#@file:}"); fi
  WORKTREE=$(echo "$START"  | grep -oE '"worktree"[^,}]*'  | sed 's/.*: *"//;s/"//')
  BRANCH=$(echo "$START"    | grep -oE '"branch"[^,}]*'    | sed 's/.*: *"//;s/"//')
  ISSUE=$(echo "$START"     | grep -oE '"issue"[^,}]*'     | sed 's/.*: *//')
  TRANSPORT=$(echo "$START" | grep -oE '"transport"[^,}]*' | sed 's/.*: *"//;s/"//')
  echo "Fase {phase_number}: branch=$BRANCH worktree=$WORKTREE issue=${ISSUE:-null} transport=$TRANSPORT"
else
  WORKTREE="$(pwd)"; BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"; ISSUE=""; TRANSPORT=none
fi
```

**Issue via MCP (`transport=mcp`):** `start-phase` devolveu `pending.issue {title, body}`. Se voce tem as tools
`mcp__...github__*`, crie a issue e grave: `github record-issue --phase {phase_number} --issue <num> --url <url>`.
Sem MCP: siga sem issue.

**Entrar na worktree (so GitHub-nativo):** preferir **EnterWorktree** apontando para `$WORKTREE`. Sem a
tool, usar `--cwd "$WORKTREE"` nos comandos e `cd "$WORKTREE"` antes de commitar. Ao fechar a fase, sair
(**ExitWorktree** ou `cd` de volta) antes de tocar `git-map.json`.

```bash
[ "$BOARD" = "true" ] && node "$HOME/.claude/up/bin/up-tools.cjs" multica sync --phase {phase_number} --status in_progress --gh-issue "${ISSUE:-}" --branch "${BRANCH:-}" --raw 2>/dev/null
```

### 3.1 Descobrir planos e ondas

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init executar-fase {phase_number} --cwd "$WORKTREE" --raw)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
PHASE_DIR="$WORKTREE/$(echo "$INIT" | grep -oE '"phase_dir"[^,}]*' | sed 's/.*: *"//;s/"//')"
PARALLELIZATION=$(echo "$INIT" | grep -oE '"paralelizacao"[^,}]*' | grep -oE '(true|false)'); [ -z "$PARALLELIZATION" ] && PARALLELIZATION=true
PLAN_COUNT=$(echo "$INIT" | grep -oE '"plan_count"[^,}]*' | grep -oE '[0-9]+')
[ "$PLAN_COUNT" = "0" ] && echo "Sem planos na Fase {phase_number}. Rode /up:plan {phase_number}." && exit 1

PLAN_INDEX=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase-plan-index {phase_number} --cwd "$WORKTREE" --raw)
if [[ "$PLAN_INDEX" == @file:* ]]; then PLAN_INDEX=$(cat "${PLAN_INDEX#@file:}"); fi
```

`phase-plan-index` devolve `plans[]` (id, wave, has_summary) e `waves` (mapa onda -> ids). Ondas em
ordem crescente. Arquivo de um plano: `$PHASE_DIR/${id}-PLAN.md`.

Planos da mesma onda sao independentes (arquivos disjuntos). Por isso rodam em paralelo. A onda N+1 so
comeca quando a onda N inteira termina.

### 3.2 Executar as ondas

Para cada onda:

1. Selecionar os planos sem SUMMARY (`has_summary: false`). Onda ja concluida: anunciar e pular.
2. Por plano, montar contexto e resolver o modelo:

```bash
PLAN_TYPE=$(grep -oE '^type:[[:space:]]*[a-z-]+' "$PLAN" | head -1 | sed 's/type:[[:space:]]*//')
CTX=$(node "$HOME/.claude/up/bin/up-tools.cjs" context --plan "$PLAN" --state --config --requirements "{phase_number}" --manifest up-executor --cwd "$WORKTREE" --raw)
MODEL=$(node "$HOME/.claude/up/bin/up-tools.cjs" resolve-model-for-plan "$PLAN" up-executor --cwd "$WORKTREE" --raw)
```

3. Spawnar os executores da onda. `PARALLELIZATION=true`: todos numa unica mensagem (um `Agent()` por
   plano). `false`: um por vez.

```python
Agent(
  subagent_type="up-executor",
  prompt=f"""
    Executar o plano {PLAN} (Fase {phase_number}, onda {wave}).

    Dominio do plano: {PLAN_TYPE} (frontend | backend | database | misto). Adapte-se a ele.
    Escopo: SOMENTE este plano. Outros planos da mesma onda rodam em paralelo em arquivos disjuntos;
    nao toque em arquivos fora das areas deste plano.

    <prompt_context>
    {CTX}
    </prompt_context>

    Ler do disco apenas: ./CLAUDE.md, .plano/fases/{phase_number}/PHASE.md e .plano/DESIGN-TOKENS.md
    (se existirem) e o codigo que vai editar. O resto ja esta inline.

    O plano e contrato (o que fica verdadeiro e a prova). O como e seu.
    Implemente todas as entregas, commite atomicamente, rode a prova de cada entrega e escreva o
    SUMMARY.md deste plano com a secao ## Prova (comando, resultado, tipo).
    Decisao de arquitetura que aparecer no caminho: aplique sua recomendacao, siga, e devolva no bloco
    ## DECISOES ESCALADAS do SUMMARY.
  """
)
```

4. Esperar todos os executores da onda terminarem.
5. Conferir os resumos da onda:

```bash
MISSING=0
for PLAN_ID in $WAVE_PLAN_IDS; do
  [ -f "${PHASE_DIR}/${PLAN_ID}-SUMMARY.md" ] || { echo "Sem SUMMARY: ${PLAN_ID}"; MISSING=$((MISSING+1)); }
done
```

   Faltou SUMMARY em um plano: re-spawnar so aquele executor uma vez. Onda inteira falhou:

<pergunta id="build.onda-falhou">
Pergunta: A onda {wave} falhou inteira ({MISSING} planos sem resumo). Como sigo?
Recomendo: Re-executar a onda uma vez
Porque: {o que foi encontrado}, e falha de todos os planos ao mesmo tempo aponta para causa de execução (ambiente, limite, interrupção), não para plano errado.
Opções: Re-executar a onda | Re-planejar a fase | Parar aqui
</pergunta>

   Se a saida dos executores apontar causa de plano (contrato inexistente, dependencia assumida que nao
   existe), a recomendacao vira "Re-planejar a fase".

6. Proxima onda.

### 3.3 Conferir a fase

Ao sair do loop, todos os planos tem SUMMARY. Ler cada um e conferir duas coisas:

- **Secao `## Prova`** presente, com comando e resultado. SUMMARY sem prova: pedir ao executor daquele
  plano que rode a prova e complete o SUMMARY (um re-spawn curto, nao re-execucao).
- **Diff confere com o relato.** `git log --oneline` e `git diff --stat` da fase batem com o que os
  SUMMARYs dizem. Diferenca grande e sinal de relato otimista: inspecionar antes de seguir.

```bash
grep -L "## Prova" ${PHASE_DIR}/*-SUMMARY.md 2>/dev/null
git -C "$WORKTREE" log --oneline "$(git -C "$WORKTREE" merge-base HEAD main 2>/dev/null || echo HEAD~20)..HEAD"
```

### 3.4 Prova estatica (so se o projeto tiver)

```bash
STATIC=$(node "$HOME/.claude/up/bin/up-tools.cjs" verify-static --cwd "$WORKTREE" --raw)
STATIC_OVERALL=$(echo "$STATIC" | grep -oE 'overall.{1,20}' | head -1 | grep -oE '"(pass|fail|skip)"' | tr -d '"')
```

`pass` ou `skip`: seguir. `fail`: re-spawnar o executor do plano que tocou o que quebrou, com o log
(`.plano/runtime/verify-static-*.log`) como contexto, e rodar de novo. Uma rodada. Se ainda falhar, o
dono decide:

<pergunta id="build.estatica-falhou">
Pergunta: A prova estática ainda falha depois da correção ({resumo do log}). Como sigo?
Recomendo: Corrigir comigo agora
Porque: {o check que falha} bloqueia a base e uma segunda rodada automática tende a repetir o mesmo erro.
Opções: Corrigir comigo agora | Seguir e registrar como dívida | Parar aqui
</pergunta>

### 3.5 Decisoes escaladas

Recolher `## DECISOES ESCALADAS` de todos os SUMMARYs da fase. Sem bloco ou so `Nenhuma.`: seguir em
silencio. Com decisoes: ordenar por custo de reverter e perguntar uma por vez:

<pergunta id="build.decisoes-escaladas">
Pergunta: {Decisao do bloco escalado}. Confirma a recomendação (já aplicada como hipótese) ou corrige?
Recomendo: {Recomendo do bloco}
Porque: {Porque do bloco}
Opções: {Recomendo} | {cada Alternativa} | outro (descreva)
</pergunta>

Registrar cada resposta: `node "$HOME/.claude/up/bin/up-tools.cjs" state add-decision --phase {phase_number} --summary "{decisao}: {resposta}"`.
Resposta que diverge: re-executar so o plano que dependia dela, com a escolha travada.

### 3.6 Re-plan local (so se um plano for inviavel)

```bash
REPLAN_COUNT=$(cat .plano/governance/replans.log 2>/dev/null | wc -l)
```

Se `REPLAN_COUNT` menor que 2: spawnar `up-planejador` com o plano e o motivo, mover o plano antigo para
`*-PLAN-v1.md`, registrar em `.plano/governance/replans.log`, voltar para 3.2 so com esse plano.

```python
Agent(subagent_type="up-planejador", prompt=f"""
  RE-PLAN da Fase {phase_number}. Plano original: {PLAN}. Razao: {motivo descoberto na execucao}.
  Refaca o plano corrigindo o problema. Confirme viabilidade antes de retornar.
""")
```

Limite atingido:

<pergunta id="build.replan-esgotado">
Pergunta: O limite de 2 re-planejamentos locais acabou. O que fazer?
Recomendo: Parar e revisar o plano da fase com você
Porque: dois re-planejamentos automáticos já falharam no mesmo ponto, então o problema está no plano e não na execução.
Opções: Parar e revisar comigo | Forçar mais um re-planejamento | Seguir com o plano atual e registrar dívida
</pergunta>

### 3.7 Opt-ins: `--review` e `--testar`

Sem flag: pular esta secao inteira.

**`--review`:** spawnar `up-verificador` (fase inteira, VERIFICATION.md) e depois `up-revisor` (two-stage,
REVIEW.md). Veredito `NEEDS_REWORK`: re-spawnar o executor do plano apontado com o REVIEW.md como
contexto, uma rodada, e re-revisar. `BLOCKED`:

<pergunta id="build.revisor-bloqueou">
Pergunta: A revisão bloqueou a fase {phase_number}. O que fazer?
Recomendo: Corrigir o item bloqueante e re-revisar
Porque: {o motivo do REVIEW.md}, e é correção dirigida a um item, não retrabalho da fase.
Opções: Corrigir e re-revisar | Aceitar como dívida técnica e seguir | Parar aqui
</pergunta>

```python
Agent(subagent_type="up-verificador", prompt=f"""
  Verificar a Fase {phase_number} inteira: objetivo da fase contra o codebase real, REQUIREMENTS da fase
  contra o que os SUMMARYs ({PHASE_DIR}/*-SUMMARY.md) entregaram. Gerar um VERIFICATION.md da fase.
""")
Agent(subagent_type="up-revisor", prompt=f"""
  Revisar a Fase {phase_number} consolidada (two-stage). Stage 1: spec-compliance cetico, navegando o
  resultado real. Stage 2: qualidade e OWASP. Ler {PHASE_DIR}/*-PLAN.md, *-SUMMARY.md, *-VERIFICATION.md
  e o git diff. Escrever REVIEW.md com o veredito.
""")
```

**`--testar`:** delegar ao laco DCRV (`@~/.claude/up/workflows/dcrv.md`) com
`SCOPE=phase, PHASE_DIR={PHASE_DIR}, PHASE_NUMBER={phase_number}, AUTO_FIX=true, MAX_CYCLES=3`.
Pular se a fase nao tem UI nem API.

### 3.8 Fechar a fase

**`--local`:** nada a fazer aqui. Tudo ja foi committado na branch atual. Ir para 3.9.

#### 3.8.0 Teste visual pre-merge

```bash
REQUIRE_VISUAL=$(node "$HOME/.claude/up/bin/up-tools.cjs" config get require_visual_test --raw 2>/dev/null); [ -z "$REQUIRE_VISUAL" ] && REQUIRE_VISUAL=true
HAS_DEV=$(node -e "try{const s=require('./package.json').scripts||{};process.stdout.write((s.dev||s.start||s.serve)?'1':'')}catch(e){}" 2>/dev/null)
```

Aplica quando (fase toca UI ou HAS_DEV) e nao `--solo` e nao (`--auto` com REQUIRE_VISUAL=false).

1. Subir o dev server dentro da worktree:

```bash
PORT=${PORT:-3000}
curl -s "http://localhost:${PORT}" >/dev/null 2>&1 || { ( npm run dev > /tmp/up-build-dev-{phase_number}.log 2>&1 & ) || ( npm start > /tmp/up-build-dev-{phase_number}.log 2>&1 & ); for i in $(seq 1 40); do curl -s "http://localhost:${PORT}" >/dev/null 2>&1 && break; sleep 1; done; }
```

2. Perguntar:

<pergunta id="build.testar-antes-do-merge">
Pergunta: Subi o servidor em http://localhost:{PORT} com o código desta fase. Testa antes ou já aterrisso?
Recomendo: Testar primeiro (deixo o servidor no ar)
Porque: a fase mexeu em interface e este projeto exige aprovação visual antes do merge; a prova automática não cobre julgamento de tela.
Opções: Testar primeiro (deixo o servidor no ar) | Pode mergear | Deixa a branch | Descarta a fase
</pergunta>

3. "Testar primeiro": manter o servidor, repetir a URL, esperar. Quando o dono voltar:

<pergunta id="build.aprovou-ou-ajusta">
Pergunta: Testou. Posso fechar a fase {phase_number}?
Recomendo: Aprovado, pode mergear
Porque: a prova automática passou; o que ela não cobre é o julgamento da tela, que é seu.
Opções: Aprovado, pode mergear | Achei problema, quero ajustar
</pergunta>

   "Achei problema": pedir a descricao, re-spawnar `up-executor` na worktree para corrigir, re-rodar 3.4 e
   voltar a 3.8.0. Loop ate aprovar.

4. Matar o dev server antes de sair da worktree: `pkill -f "npm run dev" 2>/dev/null; pkill -f "npm start" 2>/dev/null`.

**Fase sem UI, `--solo`, ou `--auto` com `require_visual_test=false`:** pular o dev server. Interativo ainda
apresenta o menu:

<pergunta id="build.fechamento-fase">
Pergunta: Como aterrisso a fase {phase_number}?
Recomendo: {Abrir PR e mergear, quando há remote e transporte; Merge local, quando não há remote}
Porque: {o transporte resolvido}, e a estratégia configurada é {merge_strategy}.
Opções: {recomendada} | {a outra forma de mergear} | Deixa a branch | Descarta a fase
</pergunta>

Autonomo (`--solo`/`--auto`): `ESCOLHA=mergear` sem menu.

#### 3.8.1 Merge

Sair da worktree (**ExitWorktree** ou `cd` de volta) para `finish-phase` atualizar `git-map.json` na main.

```bash
[ "$AUTONOMO" = "true" ] && [ -z "$ESCOLHA" ] && ESCOLHA=mergear
case "$ESCOLHA" in
  mergear|aprovado) FIN=$(node "$HOME/.claude/up/bin/up-tools.cjs" github finish-phase --phase {phase_number} --mode auto --strategy squash --raw) ;;
  deixa)            FIN=$(node "$HOME/.claude/up/bin/up-tools.cjs" github finish-phase --phase {phase_number} --mode menu --raw) ;;
  descarta)         echo "Descartando fase {phase_number}: remover worktree + branch (sem merge)."; FIN="" ;;
esac
```

**PR via MCP (`FIN` traz `"action":"needs-mcp-pr"`):** `finish-phase` ja deu push e devolveu `pr_payload`.
Com MCP: `create_pull_request` (base/head/title/body), `merge_pull_request` (squash), depois
`github record-pr --phase {phase_number} --pr <num> --url <url> --merged`. Sem MCP: `finish-phase --mode local`
e avisar o dono para mergear no GitHub.

`finish-phase --mode auto` com `gh`: PR (body com `Closes #<issue>`), merge squash, cleanup da worktree
e branch, `git-map.json` atualizado. Sem remote: merge local e cleanup.

```bash
if [ "$BOARD" = "true" ]; then
  case "$ESCOLHA" in mergear|aprovado) MB=done ;; deixa) MB=in_review ;; descarta) MB=cancelled ;; *) MB=done ;; esac
  MB_PR=$(node "$HOME/.claude/up/bin/up-tools.cjs" github status --phase {phase_number} --raw 2>/dev/null | grep -oE '"pr"[^,}]*' | sed 's/.*: *//;s/"//g')
  node "$HOME/.claude/up/bin/up-tools.cjs" multica sync --phase {phase_number} --status "$MB" --gh-issue "${ISSUE:-}" --branch "${BRANCH:-}" --pr "${MB_PR:-}" --raw 2>/dev/null || echo "AVISO: Multica indisponivel. Seguindo."
fi
```

### 3.9 Reassessment do roadmap (inline, curto)

Ler ROADMAP.md (fases futuras) e os SUMMARYs da fase recem-fechada. Tres perguntas:

- Fase futura virou redundante? Marcar `Removida (coberta pela Fase {X})`.
- Decisao desta fase muda o escopo de fase futura? Ajustar objetivo e criterios.
- Surgiu necessidade nova que bloqueia fase futura (`.plano/captures/`)? Vira fase nova; melhoria vai pro polish.

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: reassessment apos fase {X}" --files .plano/ROADMAP.md
```

Uma linha de log: `Reassessment: [sem mudancas | X ajustadas | Y removidas | Z adicionadas]`.

## Estagio 4: Opt-ins globais

**`--testar`:** DCRV em escopo global depois de todas as fases (`SCOPE=global, AUTO_FIX=true, MAX_CYCLES=5`).

**`--review`:** `up-revisor` em escopo global (Confidence Score do projeto inteiro em `.plano/REVIEW-DELIVERY.md`).

Sem flag: pular.

## Estagio 5: Entrega

```bash
mv .plano/PLAN-READY.md .plano/PROJECT-COMPLETE.md
if [ "$BOARD" = "true" ]; then
  node "$HOME/.claude/up/bin/up-tools.cjs" multica sync --status done --raw 2>/dev/null
  node "$HOME/.claude/up/bin/up-tools.cjs" multica board --raw 2>/dev/null
fi
```

Frontmatter de PROJECT-COMPLETE.md: `status: complete`, `completed_at`, `completed_by.runtime`.

Apresentacao direta do orquestrador (tom do owner-profile): o que foi entregue por fase, onde esta cada
PR, pendencias de PENDING.md, dividas registradas.

</process>

<success_criteria>
- [ ] Owner profile e PLAN-READY.md validados; artefatos e planos existem
- [ ] Dono confirmou a execucao (ou modo autonomo anunciado)
- [ ] Cada fase: worktree + branch + issue via `github start-phase` (salvo `--local`)
- [ ] Planos da mesma onda em paralelo, ondas em sequencia; um `up-executor` por plano
- [ ] Todo plano com SUMMARY e secao `## Prova`; diff conferido contra o relato
- [ ] `verify-static` rodado quando o projeto tem suite; falha corrigida em uma rodada ou decidida pelo dono
- [ ] Decisoes escaladas perguntadas ao dono no formato do contrato, nunca decididas em silencio
- [ ] Re-plans locais registrados (max 2)
- [ ] `--review` e `--testar` so com a flag; sem flag, nenhum verificador, revisor ou DCRV
- [ ] Teste visual pre-merge em fase de UI (salvo `--solo` ou `--auto` com require_visual_test=false)
- [ ] Fechamento por menu (interativo), auto-merge (`--solo`/`--auto`) ou commit na branch (`--local`)
- [ ] `--board`: init no inicio, sync na entrada e no fim da fase, board URL na entrega; tudo fail-open
- [ ] Reassessment do roadmap depois de cada fase
- [ ] PLAN-READY.md virou PROJECT-COMPLETE.md
- [ ] Nenhuma referencia a log de aprovacoes, gate deterministico, VERIFICATION.md obrigatorio, campo de evidencia, fronteiras de teste ou heuristica de teste que se prova sozinho
</success_criteria>
