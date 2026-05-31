# Pesquisa: Multica (multica-ai/multica)

> Pesquisa de produto/arquitetura para desenhar a integração UP -> Multica.
> Fontes: GitHub `multica-ai/multica` (ref `c9c2696`, release v0.3.x), repo local `/home/projects/multica` (clone v0.3.10, commit be32e5af, 2026-05-27), gestão local `/home/projects/multica-admin`, CLI `multica 0.3.10` instalado em `/usr/local/bin/multica`, e website multica.ai.

---

## 1. O que é Multica (1 parágrafo)

Multica é uma **plataforma open-source de "managed agents"** (categoria: project management / issue tracker estilo Linear, mas para times híbridos humano + agente de IA). O pitch: "Your next 10 hires won't be human." Você cria issues num board, atribui pra um **agente** (Claude Code, Codex, Copilot CLI, OpenClaw, OpenCode, Gemini, Cursor Agent, etc) exatamente como atribuiria pra um colega humano, e o agente pega a task sozinho, executa no seu runtime (uma máquina rodando o daemon), escreve código, reporta progresso em comentários, levanta blockers, atualiza status e abre PR. Agentes são cidadãos de primeira classe: têm perfil, avatar, aparecem no board, comentam, criam issues. O nome vem de "Multiplexed Information and Computing Agent" (homenagem ao Multics) — a tese é trazer time-sharing de volta, agora multiplexando humanos E agentes autônomos sobre o mesmo sistema. Licença open-source, self-hostável (a EcoUp roda em `https://multica.ecoup.digital`).

---

## 2. Stack técnica

Monorepo pnpm + turbo. Arquitetura de 3 peças: **server (painel/API)** + **daemon (executa os agents)** + **AI coding CLI** (Claude Code etc).

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Next.js    │────>│  Go Backend  │────>│   PostgreSQL     │
│   Frontend   │<────│  (Chi + WS)  │<────│   (pgvector)     │
└──────────────┘     └──────┬───────┘     └──────────────────┘
                            │
                     ┌──────┴───────┐
                     │ Agent Daemon │  roda na sua máquina (VPS dev EcoUp)
                     └──────────────┘
```

| Camada | Stack |
|---|---|
| Frontend | **Next.js 16** (App Router, React, TypeScript) em `apps/web` |
| Backend | **Go** — Chi router, `sqlc` (queries tipadas), `gorilla/websocket`. Go 1.26 |
| DB | **PostgreSQL 17 + pgvector** (busca semântica de comentários/skills) |
| Realtime | WebSocket (gorilla) + **Redis relay** (`redis_relay.go`, sharded stream) para fan-out multi-nó |
| Agent runtime | **Daemon Go** que faz spawn do CLI do agente (claude/codex/...) numa workdir isolada |
| Apps extras | `apps/desktop`, `apps/mobile` (iOS), `apps/web`, `apps/docs` |
| Infra self-host | Docker Compose (`docker-compose.selfhost.yml`), imagens GHCR, Caddy reverse proxy, systemd p/ daemon |

Outros agentes suportados pelo daemon (auto-detect no PATH): `claude`, `codex`, `copilot`, `opencode`, `openclaw`, `hermes`, `gemini`, `pi`, `cursor-agent`, `kimi`, `kiro-cli`. Precisa de pelo menos um.

**Instância EcoUp (prod):** painel `https://multica.ecoup.digital`, backend `127.0.0.1:8090`, frontend `127.0.0.1:3001`, Postgres interno, daemon systemd `multica-daemon.service` 24/7. Workspace EcoUp ID `f4920de2-353d-475a-8cfb-f6739ed3074d`, Runtime Claude `545b87ff-b5cb-43aa-9ceb-8a03c02d7a4c`. O daemon roda Claude Code com `HOME=/root` -> herda `~/.claude` (skills, agents, MCPs, CLAUDE.md global do Jonathan).

---

## 3. Modelo de dados (tabelas reais, de `migrations/001_init.up.sql` + posteriores)

Hierarquia: **workspace** -> **project** (opcional) -> **issue** -> sub-issue / comment / task (execução).

### Tabelas centrais

- **`workspace`** — `id`, `name`, `slug` (único), `description`, `settings` JSONB. Isolamento total (cada workspace tem seus agents/issues/settings).
- **`user`** + **`member`** (user <-> workspace, `role` IN owner/admin/member).
- **`agent`** — o teammate de IA. Colunas-chave:
  - `id`, `workspace_id`, `name`, `avatar_url`
  - `runtime_mode` IN (`local`, `cloud`)
  - `runtime_config` JSONB (qual provider/CLI, model, args)
  - `status` IN (`idle`, `working`, `blocked`, `error`, `offline`) <- **isso é o que pinta o "agente trabalhando" no board**
  - `max_concurrent_tasks`, `visibility` (workspace/private), `owner_id`
- **`issue`** — a unidade de trabalho (tarefa). Colunas:
  - `id`, `workspace_id`, `title`, `description`
  - `status` IN (`backlog`, `todo`, `in_progress`, `in_review`, `done`, `blocked`, `cancelled`)
  - `priority` IN (`urgent`, `high`, `medium`, `low`, `none`)
  - `assignee_type` IN (`member`, `agent`) + `assignee_id` (polimórfico) — **squad também pode ser assignee** (resolve pro líder)
  - `creator_type`/`creator_id`
  - `parent_issue_id` (sub-issues/árvore)
  - `acceptance_criteria` JSONB (array), `context_refs` JSONB (array)
  - `position` FLOAT (ordenação no board), `due_date`
  - `issue_number` -> gera a **KEY routável tipo `MUL-123`** (prefixo por workspace, configurável)
  - metadados (KV) em tabela/coluna separada (ver `issue_metadata`)
- **`issue_label`** + **`issue_to_label`** (labels coloridas), **`issue_dependency`** (`blocks`/`blocked_by`/`related`).
- **`comment`** — timeline da issue. `author_type` (member/agent), `content`, `type` IN (`comment`, `status_change`, `progress_update`, `system`), `parent_id` (threads). **É AQUI que o agente "fala" — resultado final, blockers, progresso.**
- **`project`** — agrupa issues (sprint/epic/workstream). `status` IN (`planned`, `in_progress`, `paused`, `completed`, `cancelled`), `lead` (member ou agent), `icon`.
- **`project_resource`** (migration 065) — **ponteiro tipado do projeto pra recurso externo. CRÍTICO PRA INTEGRAÇÃO.**
  - `resource_type` TEXT (free string), `resource_ref` JSONB polimórfico, `label`, `position`
  - Tipos validados hoje: **`github_repo`** (`resource_ref` = `{ "url": "...", "default_branch_hint": "..." }`) e **`local_directory`** (`{ "local_path": "...", "daemon_id": "...", "label": "..." }`)
  - `github_repo` = clone fresco por task, paralelo, branch nova (bom pra PR). `local_directory` = roda na pasta real, serial, vê estado atual (bom pra iterar / vault).

### Tabelas de execução (o "agente trabalhando")

- **`agent_task_queue`** (a "task"/"run") — uma execução de um agent numa issue:
  - `agent_id`, `issue_id`, `status` IN (`queued`, `dispatched`, `running`, `completed`, `failed`, `cancelled`)
  - `priority`, `dispatched_at`, `started_at`, `completed_at`, `result` JSONB, `error`
  - lease + retry (migration 055), `waiting_local_directory` state (migration 109)
- **`daemon_connection`** — daemon <-> agent. `daemon_id`, `status` (connected/disconnected), `last_heartbeat_at`, `runtime_info` JSONB.
- **`activity_log`** — feed de auditoria. `actor_type` (member/agent/system), `action`, `details` JSONB.
- **`inbox_item`** — notificações por destinatário (member/agent), `severity` (action_required/attention/info).

### Tabelas GitHub (migration 079 — pilar da integração de PR)

- **`github_installation`** — GitHub App conectado por workspace (`installation_id`, `account_login`, `account_type`).
- **`github_pull_request`** — espelho do estado do PR: `repo_owner`, `repo_name`, `pr_number`, `title`, `state` IN (`open`,`closed`,`merged`,`draft`), `html_url`, `branch`, `author_login`, `merged_at`, etc.
- **`issue_pull_request`** — tabela de junção issue <-> PR (`linked_by_type`/`linked_by_id`, `linked_at`).

### Outras
`autopilot` (+ triggers cron/webhook/api), `squad` (+ membros), `personal_access_token`, `skill` (+ files, importável de clawhub.ai/skills.sh/github), `task_usage_*` (rollup de tokens/custo), `chat_session` (chat direto com agente).

---

## 4. Camada VISUAL + realtime ("ver o agente trabalhando ao vivo")

### Como o board funciona
Board estilo Linear: colunas por `status` (backlog/todo/in_progress/in_review/done/blocked/cancelled), cards = issues, ordenados por `position`. Assignee picker mostra members E agents E squads. Cada agent tem avatar + `status` badge (idle/working/blocked/error/offline). Há views: board, lista, timeline, activity feed, dashboard (`/api/dashboard`: agent-activity-30d, agent-run-counts, agent-task-snapshot, usage by-agent/by-hour). Frontend Next.js 16 em `apps/web`.

### Transporte realtime
WebSocket no endpoint **`GET /ws`** (Hub em `internal/realtime/hub.go`). Multi-nó via **Redis relay**. O cliente assina "scopes" mandando um frame JSON:

```json
{ "type": "subscribe", "payload": { "scope": "workspace", "id": "<workspace-uuid>" } }
{ "type": "subscribe", "payload": { "scope": "task",      "id": "<task-uuid>" } }
```

Scopes (de `broadcaster.go`): **`workspace`** (board inteiro), **`user`**, **`task`** (alta frequência — stream de uma execução), **`chat`**, **`daemon_runtime`** (interno). `ping` -> `pong` p/ keepalive. Erros voltam como `subscribe_error`.

### Vocabulário completo de eventos realtime (`pkg/protocol/events.go`) — formato `dominio:acao`

| Grupo | Eventos |
|---|---|
| Issue | `issue:created`, `issue:updated`, `issue:deleted`, `issue_metadata:changed` |
| Comment | `comment:created/updated/deleted/resolved/unresolved`, `reaction:added/removed` |
| **Agent** | **`agent:status`** (idle/working/blocked/...), `agent:created/archived/restored` |
| **Task (execução, é o "ao vivo")** | `task:queued`, `task:dispatch`, `task:running`, `task:waiting_local_directory`, **`task:progress`**, **`task:message`**, `task:completed`, `task:failed`, `task:cancelled` |
| Project | `project:created/updated/deleted`, `project_resource:created/updated/deleted` |
| GitHub | `github_installation:created/deleted`, **`pull_request:linked`**, **`pull_request:updated`** |
| Squad/Label/Pin/Inbox/Member/Autopilot/Skill/Daemon | idem padrão `dominio:acao` |

### O stream "agente digitando/trabalhando" (o detalhe de ouro)
Enquanto o agente roda, o **daemon faz POST de CADA mensagem do agente** para `POST /api/daemon/tasks/{taskId}/messages` (`daemon/client.go:204`). O server rebroadcasta como evento **`task:message`** no scope `task:{id}`. Payload (`protocol.TaskMessagePayload`):

```go
TaskID, IssueID, Seq int,
Type    string  // "text" | "tool_use" | "tool_result" | "error"
Tool    string  // nome da ferramenta (Bash, Edit, Read...)
Content string  // texto
Input   map[string]any // input da tool (tool_use)
Output  string  // output da tool (tool_result)
```

Ou seja: a UI mostra ao vivo cada chamada de tool, texto e resultado do Claude Code — exatamente o "vendo o agente trabalhar". Além disso, progresso resumido vem de `task:progress` (`TaskProgressPayload{ TaskID, Summary, Step, Total }`), emitido via `POST /api/daemon/tasks/{taskId}/progress` -> `TaskService.ReportProgress`.

### Histórico (não-realtime)
`multica issue runs <issue>` (lista execuções) e `multica issue run-messages <task-id>` (log completo de uma run, com `--since <seq>` p/ polling incremental). Endpoints: `GET /api/tasks/{taskId}/messages`, `GET /api/tasks/{taskId}/status`.

---

## 5. API / CLI — endpoints e comandos concretos

### CLI (`multica`, instalado e autenticado nesta VPS)
Top-level: `agent, autopilot, issue, label, project, repo, skill, squad, workspace, daemon, runtime, attachment, auth, config, login, setup, update, user, version`.

**Issues** (`multica issue <cmd>`): `create, get, list, update, assign, status, search, comment, metadata, label, subscriber, runs, run-messages, rerun, cancel-task`.

Criar issue (flags reais de `issue create --help`):
```bash
multica issue create \
  --title "..." (obrigatório) \
  --description "..."  | --description-stdin | --description-file <f> \
  --priority urgent|high|medium|low \
  --status backlog|todo|in_progress|... \
  --assignee "<nome fuzzy>" | --assignee-id <uuid>   # member, agent OU squad \
  --project <project-id> \
  --parent <issue-id> \
  --due-date <RFC3339> --start-date <RFC3339> \
  --attachment /caminho/img.png  (repetível, só path local) \
  --allow-duplicate \
  --output json   # default já é json no create
```
Saída JSON traz `identifier` (a KEY, ex `MUL-123`) e `id` (uuid). **Atribuir a um SQUAD** = passar o `id` do squad como `--assignee-id` (líder roteia).

Outros essenciais:
```bash
multica issue status <id> in_progress        # backlog|todo|in_progress|in_review|done|blocked|cancelled
multica issue assign <id> --to-id <uuid>
multica issue comment add <id> --content "..." [--parent <comment-id>] [--content-file f | --content-stdin]
multica issue comment list <id> --output json [--thread <c> --tail N | --recent N | --since <ts>]
multica issue metadata set <id> --key pr_number --value 482     # KV, max 50 keys, 8KB, regex ^[a-zA-Z_][...]
multica issue list --status in_progress --assignee-id <uuid> --project <id> --metadata pr_number=482 --output json
multica issue runs <id> --output json
multica issue run-messages <task-id> --since 42 --output json
multica issue rerun <id>                      # re-enfileira a atribuição atual como task nova
multica issue cancel-task <id>                # interrompe agent em voo
```

**Projects + resources** (a cola pra GitHub/worktree):
```bash
multica project create --title "..." --icon "🏃" --lead "<agent>"
multica project resource add <project-id> --type github_repo --url https://github.com/Ecoupdigital/gestor-lfpro [--default-branch-hint main]
multica project resource add <project-id> --type local_directory --local-path /home/vault --daemon-id <daemon-id>
multica project resource list <project-id>
# --ref '<json>' permite payload resource_ref bruto, sobrepondo os atalhos
```

**Outros:** `multica agent list --output json`, `multica squad list/create/member/activity`, `multica workspace list/switch/member list`, `multica runtime list`, `multica daemon start|stop|status|logs`, `multica autopilot create/trigger/trigger-add (cron)`, `multica skill import <url>`.

### API REST (rotas Go em `cmd/server/router.go`) — prefixos `/api/...`
Grupos montados: `/api/issues`, `/api/projects`, `/api/squads`, `/api/agents`, `/api/labels`, `/api/autopilots`, `/api/comments/{id}`, `/api/workspaces`, `/api/runtimes`, `/api/dashboard`, `/api/inbox`, `/api/skills`, `/api/agent-templates`, `/api/tokens` (PAT), `/api/daemon/*` (canal do daemon).

Rotas-chave por área:
- **Issues:** `POST /api/issues`, `GET /api/issues/{id}`, `PATCH /api/issues/{id}`, `POST /api/issues/{id}/quick-create`, `GET .../children`, `.../comments`, `.../runs`, `.../timeline`, `.../subscribers`, `.../metadata` (GET/PUT/DELETE `/metadata/{key}`), `.../pull-requests`, `POST /api/issues/{id}/squad-evaluated`, `POST .../rerun`, `POST .../cancel-tasks`.
- **Daemon (canal de execução):** `POST /api/daemon/register`, `POST .../heartbeat`, `POST /api/daemon/runtimes/{id}/tasks/claim`, e por task: `POST .../tasks/{taskId}/start`, `.../progress`, `.../messages`, `.../complete`, `.../fail`, `.../cancel`, `.../usage`, `.../session`, `.../wait-local-directory`.
- **GitHub:** `GET /api/github/setup`, `GET .../github/connect`, `GET .../github/installations`, **`POST /api/webhooks/github`** (recebe eventos PR do GitHub), `GET /workspaces/{id}/repos`.
- **Realtime:** `GET /ws`. **Auth/health:** `POST /auth/send-code|verify-code|google|logout`, `GET /health|/healthz|/readyz|/health/realtime`, `POST /api/cli-token`.
- **Webhooks autopilot:** `POST /api/webhooks/autopilots/{token}`.

Auth da API: header `X-User-ID` (sessão) ou token de agente via `X-Actor-Source: task_token` + `X-Agent-ID` + `X-Task-ID`. CLI usa **PAT** (`mul_...`, 90 dias) — login `multica login --token "$MULTICA_PAT"`; config persistida em `/root/.multica/config.json`.

---

## 6. PONTOS DE INTEGRAÇÃO — como o UP manda tarefa e aparece no board ao vivo

O caminho mais limpo e suportado é **CLI-first** (o `multica` já está instalado e autenticado nesta VPS; é o que o agente `tarefa`/skill já usa). O daemon do Multica já roda Claude Code com `HOME=/root`, então herda todo o ecossistema UP (skills, agents `~/.claude/agents/`, MCPs).

### Fluxo A — UP cria issue e deixa o Multica executar (recomendado)
1. **UP cria a issue** (em vez de/além do `.plano/`):
   ```bash
   multica issue create --title "<fase/feature>" --description "<contexto + acceptance criteria>" \
     --project <project-id-do-cliente> --assignee-id <agent-ou-squad-uuid> --priority high --output json
   ```
   Captura `identifier` (KEY) e `id` do JSON.
2. **Atribuição dispara a execução automaticamente.** O daemon claima a task (`task:queued`->`dispatch`->`running`), cria workdir isolada e injeta um `CLAUDE.md` runtime (`execenv.InjectRuntimeConfig`) com o lifecycle: rodar `multica issue get`, `metadata list`, `comment list` (obrigatório), `status in_progress`, fazer o trabalho via Skills, **postar resultado final via `comment add`** (mandatório — terminal não conta), pinar PR/deploy URL em metadata se relevante, e `status in_review` (ou `blocked` + comentário se travar).
3. **No board ao vivo:** `agent:status` vira `working`, e cada passo do Claude vira `task:message` (text/tool_use/tool_result) + `task:progress`. Quem assistir o scope `task:{id}` ou `workspace:{id}` vê tudo.

### Fluxo B — vincular worktree/PR do GitHub (auto-link nativo)
O Multica **NÃO** cria worktrees por conta própria por padrão para tasks `local_directory` (roda na pasta real, serial); para `github_repo` ele faz clone fresco + branch por task. O vínculo issue<->PR é **automático por convenção de KEY**:
1. Anexar o repo ao project: `multica project resource add <project> --type github_repo --url <repo>`.
2. Conectar o GitHub App ao workspace (`/api/github/setup`) + webhook `POST /api/webhooks/github`.
3. **O agente (ou o UP) coloca a KEY da issue no PR** — no título, body ou branch (regex `identifierRe` extrai `MUL-1510`, case-insensitive; branch tipo `mul-1510/fix-login` casa). O handler `github.go` faz:
   - **auto-link** do PR à issue (cria linha em `issue_pull_request`, emite `pull_request:linked`), e
   - se o PR tem `Closes/Fixes/Resolves MUL-X`, **ao dar merge a issue avança pra `done`** automaticamente.
4. Card da issue passa a mostrar o PR (estado open/draft/merged espelhado em `github_pull_request`, atualizado via webhook -> `pull_request:updated`).
   -> **Para o UP:** basta nomear a branch da worktree com a KEY (`<key-lower>/<slug>`) e/ou escrever `Closes <KEY>` no corpo do PR. O resto é nativo.

### Fluxo C — API REST direta (se quiser desacoplar do CLI)
`POST /api/issues` com PAT no header, assina `GET /ws` com `{type:subscribe, payload:{scope:workspace,id}}` pra refletir no próprio dashboard do UP, e lê `GET /api/issues/{id}/runs` + `GET /api/tasks/{taskId}/messages?since=<seq>` pra espelhar o stream. Mas o CLI já encapsula tudo isso e está autenticado — usar CLI é menos trabalho.

### Mapeamento conceitual UP <-> Multica
| UP | Multica |
|---|---|
| Projeto / `.plano/` | `project` (+ `project_resource` github_repo/local_directory) |
| Fase / PLAN-NNN | `issue` (com `acceptance_criteria` JSONB) |
| Sub-tarefa de fase | sub-`issue` (`--parent`) com `--status todo` (start now) ou `backlog` (espera) |
| Onda de execução paralela | N issues filhas `--status todo` no mesmo parent |
| Agente UP (planejador, up-*, etc) | rodam dentro do agent Multica via Task; o agent Multica (ex "Maestro Dev") é o orquestrador que delega |
| STATE.md / progresso | `comment` (resultado) + `task:progress` + `issue metadata` (pr_number, deploy_url) |
| Commit/PR atômico | branch `<KEY>/slug` + `Closes <KEY>` -> auto-link + auto-done |

Os IDs reais já mapeados no `multica-admin/CLAUDE.md`: workspace EcoUp, agents orquestradores (Maestro Dev `3c0f426d...` delega pra `planejador, up-*, revisor-de-codigo, depurador`; QA `f482cc54...` delega pra `qa-*`, `up-*-tester`), squad Produto & Dev `c2dc1bb6...`, e 1 project por cliente. O project "EcoUp · Infra & MCPs" (`2b9fb870-21b8-4880-8f43-0cf4d485bf35`) já lista `up-cc` como resource.

---

## 7. Limitações / gaps relevantes pra integração

- **`local_directory` é serial e roda na pasta real** (vê estado atual, não isola). Bom pra iterar/vault, ruim pra paralelismo. `github_repo` é paralelo mas clona fresco (perde estado não-commitado). UP precisa escolher por fase.
- **Sem worktree nativo gerenciado pelo Multica** para o caso "pasta local + branch isolada": o auto-link de PR depende de convenção de KEY na branch/PR, não de o Multica criar a worktree. O UP teria que criar a worktree e nomear a branch com a KEY.
- **Autopilot `--mode` só expõe `create_issue`** via CLI; `run_only` existe no data model mas o daemon ainda não resolve workspace pra runs sem issue. Triggers: só `schedule` (cron) exposto no CLI; `webhook`/`api` existem no schema mas sem endpoint que dispare (exceto o webhook de autopilot por token).
- **Iterar numa issue = comentar e @-mencionar o agent NO PAINEL** (isso re-dispara a sessão via `comment-triggered task`). Não há um "continue run" puro de CLI além de `rerun` (re-enfileira do zero) e `cancel-task`.
- **Comment list tem cap de 2000 linhas** server-side; em issues longas usar `--recent`/`--thread --tail`/`--since`.
- **Metadata KV** tem bar alto de escrita (max 50 keys, 8KB, só primitivos) — não é pra log de runtime, só fatos importantes re-lidos (pr_url, deploy_url).
- **GC do daemon** apaga workdir de issues `done`/`cancelled` após TTL (24h) e artefatos (`node_modules`, `.next`, `.turbo`) de issues abertas após 12h. UP não deve depender de estado persistente na workdir entre runs.
- **Auth por allowlist** (`ALLOW_SIGNUP=false`, domínio `ecoupdigital.com.br` + email do Jonathan). Convite de membro só pelo painel (sem CLI).
- **Versão jovem (v0.3.x):** API/schema podem mudar; vários RFCs (`MUL-2414`, `MUL-2538`) ainda em evolução no código.

---

## 8. Arquivos/fontes consultados (caminhos absolutos)

- `/home/projects/multica/README.md`, `/home/projects/multica/CLI_AND_DAEMON.md` (referência completa de CLI)
- `/home/projects/multica/server/migrations/001_init.up.sql` (schema base), `065_project_resources.up.sql`, `079_github_integration.up.sql`
- `/home/projects/multica/server/pkg/protocol/events.go` (eventos realtime), `messages.go` (payloads)
- `/home/projects/multica/server/cmd/server/router.go` (rotas HTTP)
- `/home/projects/multica/server/internal/realtime/{hub.go,broadcaster.go}` (WebSocket)
- `/home/projects/multica/server/internal/handler/{daemon.go,github.go,project_resource.go}` (lifecycle de task, auto-link PR, resources)
- `/home/projects/multica/server/internal/daemon/{prompt.go,client.go}` + `daemon/execenv/runtime_config.go` (prompt injetado + contrato de reporte do agente)
- `/home/projects/multica-admin/CLAUDE.md` (IDs reais da instância EcoUp: workspace, agents, squads, projects)
- CLI ao vivo: `multica --help`, `multica issue/project/repo/skill/squad --help` (v0.3.10 instalado)
- Web: github.com/multica-ai/multica, multica.ai
