# 05 — UP: Estado git/GitHub atual + GAP para GitHub-nativo + Persistência de estado

Alvo: `/home/projects/up-cc/up/`. Documento de pesquisa para virar UP "GitHub-nativo por padrão": cada execução → worktree → issue → PR → merge. Persistência de estado (`.plano/`) documentada para ser MANTIDA.

---

## 1. ESTADO ATUAL git/GitHub do UP

### 1.1 O que existe hoje (resumo brutal)

| Capacidade | Existe? | Onde |
|---|---|---|
| `git init` automático | SIM | `novo-projeto.md:36`, `builder.md:450/3046` (`git init`), `git-integration.md:31` |
| Commits atômicos por tarefa | SIM | `executar-plano.md:473-504` (`<task_commit>`), `git-integration.md` formato `{tipo}({fase}-{plano})` |
| Commit de metadados por plano | SIM | `executar-plano.md:614-619`, helper `commit` do CLI |
| Commit de estado fora de comando | SIM | `up-tools.cjs` `state save-session` → `docs(state): ...` (linha ~1302) |
| Helper de commit central | SIM | `cmdCommit()` em `up-tools.cjs:2464` |
| Primitiva `execGit` | SIM | `core.cjs:216` |
| Detecção de gitignore | SIM | `core.cjs:204` `isGitIgnored` + check em `cmdCommit` |
| **Branch / `checkout -b`** | **NÃO** | nenhuma ocorrência em todo `up/` |
| **Worktree** | **NÃO** | zero ocorrências de `worktree` |
| **`git push` / remote** | **NÃO** | zero ocorrências |
| **`gh` CLI (issue/pr/merge)** | **NÃO** | as 2 únicas ocorrências de "gh"/"PR" são incidentais: `up-devops-agent.md` (gera GitHub **Actions**, não usa gh) e `up-quality-supervisor.md` (texto "high" casou no grep) |
| **Issue tracking GitHub** | **NÃO** | "issues" no UP = `.plano/issues-carryover/`, arquivos locais, não GitHub Issues |

### 1.2 Como o UP commita HOJE (fluxo real)

Tudo acontece **na branch atual** (tipicamente `main`), **sem branch dedicada, sem worktree, sem remote, sem PR**. Modelo "trunk-based local".

**Primitiva única — `cmdCommit(cwd, message, files, raw)` (`up-tools.cjs:2464`):**
```
1. Se config.commit_docs=false → skip (não commita)
2. Se .plano gitignored → skip
3. files vazio → default ['.plano/']
4. para cada file: execGit(['add', file])   ← staging seletivo, nunca git add -A
5. execGit(['commit', '-m', message])
6. trata "nothing to commit"; retorna hash curto via rev-parse --short HEAD
```
Chamado por workflows como `node up-tools.cjs commit "msg" --files a b c`.

**Commit por TAREFA** (`executar-plano.md:473`, dentro do `up-executor`): o agente roda `git add <arquivos específicos>` + `git commit -m "{tipo}({fase}-{plano}): desc"` **diretamente** (não via helper), captura `TASK_COMMIT=$(git rev-parse --short HEAD)`. Regra dura: NUNCA `git add .`/`-A`.

**Commit por PLANO** (metadata): `commit "docs({fase}-{plano}): completar plano" --files SUMMARY STATE ROADMAP REQUIREMENTS`.

**Commit por FASE**: `phase complete` atualiza arquivos + `commit "docs(fase-X): completar execução"`.

**Filosofia** (`git-integration.md`): "Commit outcomes, not process." PLAN.md/RESEARCH.md NÃO são commitados isoladamente; código é commitado por tarefa; metadados por plano/fase. Log fica bisectável e legível como changelog.

### 1.3 Primitivas git existentes em `core.cjs`
- `execGit(cwd, args[])` — wrapper `execSync('git ...')` com escaping de args, retorna `{exitCode, stdout, stderr}`. **Esta é a base sobre a qual TUDO de novo deve ser construído.**
- `isGitIgnored(cwd, targetPath)` — via `git check-ignore`.
- Sem helpers para branch, worktree, remote, push ou `gh`.

**Conclusão:** UP é hoje "git-aware" (commita disciplinadamente) mas **NÃO é "GitHub-aware"**: não conhece branches, worktrees, remotes, issues nem PRs. Toda a inteligência GitHub-nativa é greenfield.

---

## 2. GAP para GitHub-nativo (worktree → issue → PR → merge)

Fluxo-alvo por unidade de execução: **criar worktree → criar issue → trabalhar/commitar → abrir PR → merge → limpar worktree**.

### 2.1 Primitivas que FALTAM (a implementar em `core.cjs` + comandos novos em `up-tools.cjs`)

**Camada git (worktree/branch) — sobre `execGit`:**
- `gitHasRemote(cwd)` → `git remote get-url origin` (decidir local-only vs GitHub).
- `ghAvailable()` / `ghAuthed()` → `gh auth status` (fail-open se ausente: degrada para fluxo só-commit atual).
- `createWorktree(cwd, branch, dir, baseRef)` → `git worktree add -b <branch> <dir> <baseRef>`.
- `removeWorktree(cwd, dir)` → `git worktree remove <dir>` (+ `--force` fallback).
- `listWorktrees(cwd)` → `git worktree list --porcelain` (recovery/saúde).
- `pushBranch(cwd, branch)` → `git push -u origin <branch>`.
- `branchName(fase, plano, slug)` → naming helper (ver §3.2).

**Camada GitHub (`gh` CLI) — novo módulo, ex. `lib/github.cjs`:**
- `ghIssueCreate(title, body, labels)` → `gh issue create --json` → retorna `{number, url}`.
- `ghIssueClose(number)` (ou fechar via PR "Closes #N").
- `ghPrCreate(base, head, title, body)` → `gh pr create --json` → `{number, url}`.
- `ghPrMerge(number, strategy)` → `gh pr merge --squash|--merge|--rebase [--delete-branch]`.
- `ghPrStatus(number)` → checar CI/mergeable (`gh pr view --json mergeStateStatus,statusCheckRollup`).
- `ghRepoEnsure()` → `gh repo create` se não houver remote (opcional, com confirmação).

**Camada de vínculo `.plano` ↔ git/GitHub (estado novo, ver §3.4):**
- Persistir mapping `fase/plano ↔ branch ↔ issue# ↔ PR# ↔ worktree path`. Hoje **não existe** nenhum lugar para isso.

### 2.2 Pontos de injeção nos workflows (onde plugar)
- `novo-projeto.md` / `builder.md` (gates 4) — após `git init`: detectar remote + gh, perguntar/decidir modo GitHub-nativo, gravar em `config.json`.
- `executar-fase.md` (`<step initialize>`/`<step execute_waves>`) — antes de spawnar `up-executor`: criar worktree + issue da fase; após `update_roadmap`: abrir PR + merge.
- `executar-plano.md` (`<task_commit>`, `<step git_commit_metadata>`) — commits passam a acontecer DENTRO da worktree; metadata commit antes do push.
- `rapido.md` (passo 3 e 7) — worktree+issue+PR por tarefa rápida.
- `config.json` (`core.cjs:loadConfig` defaults, ~linha 146) — adicionar flags `github_native`, `worktree_granularity`, `merge_strategy`, `auto_merge`, `issue_per`.

---

## 3. DESENHO TÉCNICO PROPOSTO

### 3.1 Granularidade da worktree — **por FASE (default), com fallback por TAREFA-RÁPIDA**
Razões:
- A unidade natural de entrega do UP é a **fase** (objetivo verificável, tem `VERIFICATION.md`, `goal` no ROADMAP, fecha com `phase complete`). 1 fase = 1 PR review-ável = 1 issue de feature. Mapeia limpo para "1 PR por entrega".
- **Por plano** é granular demais: planos da mesma fase têm dependências entre waves e compartilham contexto → N PRs interdependentes viram inferno de merge. Manter planos como *commits dentro* da branch da fase.
- **Por tarefa** explode em micro-PRs; tarefa já é 1 commit atômico — granularidade certa para *commit*, errada para *PR/worktree*.
- **`/up:rapido`**: worktree própria curta por tarefa rápida (já é unidade isolada e autocontida, sem deps de fase).
- Builder autônomo (`builder.md`): worktree por fase, encadeando — fase N só começa após merge de N-1 (deps respeitadas) OU worktrees paralelas para fases independentes (avançado, ver atrito §4).

Tornar configurável: `config.worktree_granularity ∈ {fase, plano, rapido-only, off}`, default `fase`.

### 3.2 Nomenclatura de branches
- Fase: `up/fase-NN-<slug>` (ex.: `up/fase-03-dashboard`). NN vem de `normalizePhaseName` (já existe em `core.cjs:243`), slug de `phase_slug`/`generateSlugInternal` (já existe).
- Rápido: `up/rapido-NNN-<slug>`.
- Fases decimais (inserções urgentes 2.1): `up/fase-02.1-<slug>` (o regex de fase já suporta decimal).

### 3.3 Localização da worktree
- `../.up-worktrees/<repo>/fase-NN-<slug>/` (IRMÃ do repo, fora da árvore principal) — evita que a worktree apareça dentro do próprio repo e seja indexada/commitada por engano.
- `.gitignore` da raiz deve ignorar qualquer `*.up-worktrees*` defensivamente.

### 3.4 Ligação issue ↔ fase ↔ PR (estado novo persistido)
Criar **`.plano/git-map.json`** (vive no `.plano/` da branch principal, é a fonte de verdade do mapeamento — NÃO viaja com a worktree para evitar divergência por branch):
```json
{
  "github_native": true,
  "remote": "git@github.com:user/repo.git",
  "fases": {
    "03": {
      "branch": "up/fase-03-dashboard",
      "worktree": "../.up-worktrees/repo/fase-03-dashboard",
      "issue": 42,
      "pr": 57,
      "status": "merged",
      "merged_sha": "abc1234"
    }
  }
}
```
Espelhar referências leves no ROADMAP/STATE (linha "Fase 03 → #42 / PR #57") para leitura humana, mas o JSON é canônico (parse confiável). Issue body inclui `goal` + `Success Criteria` do ROADMAP; PR body inclui `Closes #42` (auto-fecha issue no merge) + resumo dos SUMMARYs da fase.

### 3.5 Como `.plano` viaja com a worktree — **REGRA CRÍTICA**
Problema: `git worktree add` faz checkout do tree → a worktree tem a versão de `.plano/` do `baseRef`. Os commits de doc (`STATE.md`, `SUMMARY`, `ROADMAP`) feitos DENTRO da worktree vivem na branch da fase, não na main.

Decisão proposta (**modelo "estado na worktree, consolida no merge"**):
- Durante a fase: TODO trabalho (código + docs `.plano/fases/NN/*`) acontece e commita **na worktree/branch da fase**. `STATE.md` é atualizado lá.
- No merge do PR (squash/merge para main): `.plano/` da fase volta para a main junto com o código → STATE/ROADMAP/SUMMARY consolidados de uma vez. `git-map.json` é atualizado **na main** após o merge (operação pós-merge na árvore principal).
- `save-session`/persistência fora-de-comando: roda na worktree ativa enquanto a fase está aberta; volta a rodar na main após merge. O hook deve detectar `git rev-parse --show-toplevel` para achar o `.plano` certo.

Alternativa rejeitada: `.plano/` symlinkado/compartilhado entre worktrees → quebra isolamento e gera corrida de escrita em `STATE.md` (ver §4).

### 3.6 Estratégia de merge
- Default **`--squash`** (`gh pr merge --squash --delete-branch`): 1 fase = 1 commit limpo na main, log permanece changelog-like (alinhado com filosofia "commit outcomes"). Os commits atômicos por tarefa ficam preservados no histórico do PR.
- Configurável `merge_strategy ∈ {squash, merge, rebase}`.
- `auto_merge`: em `builder_mode`/yolo → merge automático se CI verde + verificação UP passou. Em modo interativo → abrir PR e PARAR (checkpoint humano "revisar e mergear"), reusando o padrão de checkpoint já existente (`executar-plano.md:506`).
- Pós-merge: `git worktree remove`, `git fetch` na main, atualizar `git-map.json`, avançar STATE para próxima fase (já existe via `phase complete`).

### 3.7 Convivência com a persistência existente
- `commit_docs` permanece o master-switch; novo `github_native` é camada ADITIVA por cima. `github_native=false` → comportamento atual idêntico (zero regressão).
- `cmdCommit` continua igual; só muda o `cwd` (passa a ser o path da worktree). Como `cmdCommit`/`execGit` já recebem `cwd` explícito, **basta os workflows passarem `--cwd <worktree>`** — a infra do CLI já suporta isso.
- `state save-session` continua funcionando; ganha consciência de worktree via `git rev-parse --show-toplevel`.
- Fail-open universal: sem `gh`, sem remote, ou `gh` não-autenticado → degrada para o fluxo de commit local atual, com aviso. UP nunca deve travar por falta de GitHub.

---

## 4. PONTOS DE ATRITO (o que pode quebrar)

1. **`STATE.md` por branch / divergência de estado.** STATE.md vira "estado da branch da fase". Duas fases abertas em paralelo = dois STATE.md divergentes; ao mergear, conflito em `STATE.md`/`ROADMAP.md` (linhas de progresso). Mitigação: `git-map.json` canônico fica só na main; STATE.md tratado como derivável/regenerável; merge de fase consolida via `phase complete` rodando na main, não dependendo de merge textual de STATE.

2. **Múltiplas worktrees + `.plano` compartilhado.** Se `.plano/` for compartilhado (symlink/path único), execuções paralelas corrompem `STATE.md` por escrita concorrente. Mitigação: isolar `.plano/` por worktree (cada uma tem o seu, do checkout) — escolhido em §3.5.

3. **Paralelização de fases vs dependências.** ROADMAP tem `Depends on`. Worktrees paralelas só são seguras para fases independentes; o builder hoje assume sequencial. Mitigação inicial: worktree por fase **sequencial** (fase N+1 após merge de N). Paralelo só como opt-in avançado lendo `Depends on`.

4. **Commits por tarefa do `up-executor` ignoram `cwd`.** O executor roda `git add/commit` direto no shell (`executar-plano.md:480`), assumindo cwd = repo. Em worktree, o `cwd` do agente precisa ser a worktree. Risco: agente commitar na branch errada. Mitigação: o orquestrador deve dar `cd <worktree>` no contexto do executor OU migrar esses commits diretos para `up-tools commit --cwd`.

5. **`gh` não instalado / não autenticado / repo sem remote.** Comum em greenfield local. Mitigação: detecção + fallback local-only (§3.7). Oferecer `gh repo create` opcional.

6. **Conflitos de merge reais (código).** Fases sequenciais minimizam; mas hotfix/rapido concorrente pode conflitar. Mitigação: rebase da branch da fase sobre main antes do PR; squash reduz superfície.

7. **`git worktree` + caminhos relativos.** Workflows usam paths relativos `.plano/...`. Em worktree o cwd muda; relativos quebram se o orquestrador não fixar o cwd. Auditar todos os `node up-tools.cjs ... .plano/...` para passar `--cwd`.

8. **Hooks de instrumentação/statusline** (`up-context-monitor.js`, `up-statusline.js`) leem `.plano/` por cwd — em worktree apontam para o `.plano` errado se cwd não for ajustado.

9. **Limpeza órfã.** Crash no meio → worktree órfã + branch + issue aberta. Precisa de comando de saúde (`/up:saude` estendido) que roda `git worktree prune` e reconcilia `git-map.json` com `gh issue/pr list`.

---

## 5. PERSISTÊNCIA DE ESTADO (a MANTER — documentada)

### 5.1 Estrutura `.plano/` completa (sobrevive a `/clear`)
Raiz criada nos projetos do usuário (não confundir com `up/` do framework). Arquivos canônicos e o que persiste:

```
.plano/
├── PROJECT.md          # contexto vivo: What/Core Value/Requirements/Decisions (template project.md)
├── STATE.md            # MEMÓRIA CURTA — posição atual, decisões recentes, bloqueios, continuidade (template state.md, <150 linhas)
├── ROADMAP.md          # todas as fases, checkboxes [x], tabela de progresso (template roadmap.md)
├── REQUIREMENTS.md     # REQ-IDs + rastreabilidade fase↔requisito
├── config.json         # modo, paralelizacao, commit_docs, auto_advance, modelos, budget_ceiling, builder_mode
├── OWNER.md            # perfil do dono (modo builder/CEO)
├── DELIVERY.md         # relatório de entrega (modo builder)
├── LOCK.md / LOCK      # lock de execução concorrente
├── fases/
│   └── NN-<slug>/      # CONTEXT.md, RESEARCH.md, NN-MM-PLAN.md, NN-MM-SUMMARY.md, *-VERIFICATION.md, .continue-aqui.md
├── rapido/
│   └── NNN-<slug>/     # NNN-PLAN.md, NNN-SUMMARY.md (tarefas rápidas, fora de fases)
├── codebase/           # ARCHITECTURE/STACK/STRUCTURE/CONVENTIONS/... (brownfield mapping)
├── governance/         # aborts.log, approvals.log, replans.log, technical-debt.log
├── issues-carryover/   # issues locais que passam de fase a fase (NÃO é GitHub Issues)
├── dcrv/ melhorias/ ideias/ e2e/ mobile-review/ clone/ captures/   # saídas de workflows específicos
```
(Lista derivada de grep em workflows/templates — ver §1 do raw scan.)

### 5.2 Mecânica de save/load no `up-tools.cjs` (a preservar)
- **`state load|get`** — lê STATE.md cru / campos individuais (`stateExtractField`).
- **`state-snapshot`** (`cmdStateSnapshot:1173`) — parseia STATE.md → JSON estruturado: `current_phase`, `current_phase_name`, `total_phases`, `current_plan`, `status`, `progress_percent`, `decisions[]` (da tabela "Decisions Made"), `blockers[]`, `session{last_date,stopped_at,resume_file}`. É o "carregar contexto após /clear".
- **`state save-session`** (`cmdStateSaveSession:1242`) — comando de persistência fora-de-comando descrito em `state-persistence.md`. Atualiza timestamp + `Stopped At`/`Last activity`, adiciona `--decision` na seção Decisions com `[Phase N]`, e **auto-commita** `docs(state): <summary>` (a menos de `--no-commit`). É o que CLAUDE.md global manda rodar ao fim de trabalho significativo.
- **`state advance-plan` / `update-progress` / `add-decision` / `record-session` / `record-metric` / `update`** — mutações granulares de STATE.md, escrita atômica via `stateReplaceField`.
- **`phase complete`** — marca fase `[x]`, atualiza progresso, avança STATE para próxima fase, atualiza REQUIREMENTS.
- **Continuidade pós-`/clear`:** STATE.md + ROADMAP.md + `.continue-aqui.md` (template `continue-here.md`) + `state-snapshot` reconstroem o contexto. `/up:retomar` consome isso.

### 5.3 Regra de ouro a preservar no redesign GitHub-nativo
`state save-session` e `state-snapshot` são o coração da persistência. O GitHub-nativo deve **somar** (mapear fase→issue/PR), nunca substituir esse mecanismo. STATE.md permanece a fonte humana de "onde estou"; `git-map.json` é o índice máquina de "onde está cada fase no GitHub".
