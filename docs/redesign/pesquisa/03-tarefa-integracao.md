# Pesquisa 03 — Skill `/tarefa` (Despachante Jarvis) e integração UP ↔ Multica

Fonte primária: `/root/.claude/skills/tarefa/SKILL.md` (9.355 bytes, arquivo único — não há scripts/refs/templates irmãos na pasta).
Fonte de mapa: `/home/projects/multica-admin/CLAUDE.md`.
Interface real confirmada rodando `multica --help` + subcomandos na VPS Dev (Linux/ServerProjetosDev, acesso direto).

---

## 1. O que a skill é

`/tarefa` é uma **skill de instrução pura** (só um SKILL.md, sem código). Define uma persona ("Jarvis, chefe de gabinete") que transforma fala em linguagem natural do Jonathan em **issues estruturadas no Multica**, roteando pro projeto e agent/squad certo. Não há binário próprio: a skill inteira opera **chamando o CLI `multica`** (Go-based, instalado global na VPS Dev). Não usa API HTTP direta nem MCP — é 100% via `multica issue ...` por shell. Em Mac prefixa `ssh server-ecoup '...'`; na VPS roda direto.

O Multica (descrito em multica-admin/CLAUDE.md) é uma plataforma open-source de "managed agents" estilo Linear: board de issues onde cada issue atribuída dispara um coding agent (Claude Code) que executa sozinho na VPS, comenta progresso e abre PR. Server + daemon rodam na VPS Dev (91.98.164.71), painel em `https://multica.ecoup.digital`.

## 2. Fluxo passo a passo da skill

1. **Detecta ambiente** (`uname -s`) → Mac usa SSH, VPS roda direto.
2. **Carrega o mapa**: lê `/home/projects/multica-admin/CLAUDE.md` para IDs atuais de projetos/agents/squads (fonte da verdade, muda com o tempo). Se faltar, recarrega via `multica project list --output json`.
3. **Intake NL**: interpreta a fala (pode vir por voz com erros de transcrição → cruza nomes com o mapa de projetos/clientes).
4. **Identifica domínio/tipo** da tarefa (dev, QA, copy, tráfego, dados, marca, design, story, oferta, comunidade, estratégia, documento).
5. **Roteia por TIPO → agent/squad** (tabela na seção 4 abaixo) e **por PROJETO** (cruza assunto com `Cliente · X` / `EcoUp · X`).
6. **Enriquece contexto ANTES de criar** (passo-chave): se a tarefa é vaga, dá uma olhada rápida e proporcional no repo (`git -C /home/projects/<repo> log --oneline -5`, grep, leitura de arquivo, MCP de dados, nota no vault). NÃO resolve — só levanta pistas pro executor.
7. **Pergunta se ambíguo** (AskUserQuestion) — projeto ou responsável incertos → pergunta antes de errar destino.
8. **Cria a issue PARADA** (empilha): `multica issue create` com `--status backlog`, SEM `--assignee` (assignee = execução imediata). O agent sugerido vai escrito **na descrição** (`(sugerido: <Agent/Squad>)`), não como assignee real.
9. **Confirma em 1 linha** pro Jonathan: "Criei parada em [Projeto]: '[título]'. Sugerido: [agent]. Falar 'executa' quando quiser."
10. **Execução só sob comando** ("executa", "manda", "pode rodar") → ver seção 6.

## 3. Estrutura de uma issue no Multica (campos reais, confirmados via JSON)

Campos retornados por `multica issue get/list --output json`:
- `id` (UUID), `identifier` (ex: `ECO-35`), `number`
- `title` — formato OBRIGATÓRIO da skill: `[Cliente/Projeto] Título humano` (PT-BR, sem jargão, orientado a resultado)
- `description` — markdown estruturado: `**O que é:**` + `**Resultado esperado:**` (pro Jonathan, sem jargão) + separador `---` + `**Pistas pro agent:**` (técnico, pode ter caminho/commit/função)
- `status` ∈ `backlog | todo | in_progress | in_review | done | blocked | cancelled`
- `priority` ∈ `none | low | medium | high | urgent`
- `project_id` (UUID — exige ID, NÃO aceita nome)
- `assignee_id` + `assignee_type` (`member | agent | squad`)
- `creator_id` + `creator_type`
- `labels` (array; gerenciável via `multica label` e `multica issue label`)
- `parent_issue_id` — **issues têm hierarquia (sub-issues)**. Exemplo real: ECO-35 é "Fase 2" filha de um pai. Isso é diretamente mapeável pra fases/waves do UP.
- `metadata` — **KV arbitrário por issue** (`multica issue metadata set/get/list/delete`). No mundo real já guarda `pipeline_status`, `pr_url`, `pr_number`. Valor é JSON-parseado (bool/number/string). `issue list --metadata key=value` FILTRA por metadata (AND repetível). **Este é o gancho mais forte pra integração UP.**
- `due_date`, `start_date` (RFC3339), `position`, `created_at`, `updated_at`, `workspace_id`

## 4. Roteamento tipo → agent/squad (mapa do multica-admin)

Agents orquestradores (runtime Claude `545b87ff-...`), cada um delega a subagents `~/.claude/agents/` via Task:
- Bug/feature/sistema/código → **Maestro Dev** (`3c0f426d-...`) delega `planejador, up-*, revisor-de-codigo, depurador`
- Testar/QA/acessibilidade → **QA** (`f482cc54-...`) delega `qa-*, up-*-tester`
- Copy/anúncio/email → **Copy Chief** · Campanha/tráfego → **Traffic Chief** · Métricas/relatório → **Data Chief** · Marca → **Brand Chief** · Design → **Design Chief** · Roteiro → **Story Chief** · Oferta/preço → **Hormozi Advisor** · Comunidade → **Movement Chief** · Estratégia → **Board** · Multi-área → **Vision**

Squads (líder roteia, pra tarefa grande/multi-etapa): Marketing `b9fded13-...`, Produto & Dev `c2dc1bb6-...`, Negócio `7c8402d4-...`.

**Mapeamento Multica agent/squad ↔ agentes do UP:** já existe ponte direta. O agent **Maestro Dev** do Multica delega justamente para os agentes `up-*` (`planejador`, `up-*`, `revisor-de-codigo`, `depurador`) e o **QA** para `up-*-tester`. Ou seja: uma issue Multica atribuída ao Maestro Dev já cai dentro do ecossistema UP. O daemon roda Claude Code com `HOME=/root`, herdando `~/.claude` (skills, agents, MCPs, CLAUDE.md global) — o mesmo UP instalado.

## 5. "Empilha por padrão, executa sob comando"

- **Empilhar** = `multica issue create --status backlog` **sem** assignee. Issue nasce parada, sem responsável. O agent sugerido fica só como texto na descrição (`(sugerido: X)`).
- Regra dura: issue em `backlog` NÃO roda automaticamente, mesmo se atribuída. `backlog` = parada/empilhada; `todo` = pronta pra executar.
- Nunca passar `--assignee` na criação (atribuir = disparar agent na hora).

## 6. Fluxo de execução (sob comando) — comandos exatos

```bash
multica issue status <id> todo                       # SEMPRE mover de backlog -> todo primeiro
multica issue assign "<id>" --to-id "<UUID agent/squad>"   # atribuir = dispara o agent
```
- Atribuir só dispara se status for executável (por isso o `todo` antes é obrigatório).
- **Lote:** mover todas pra `todo` + atribuir várias (rodam em paralelo até o limite do agent).
- **Série:** `multica agent update <id> --max-concurrent-tasks 1` antes do lote, ou uma por vez.
- **Iterar tarefa feita:** comentar com `@<agent>` o ajuste (continua a sessão) via `multica issue comment add`; refazer do zero = `multica issue rerun <id>`.
- Acompanhar execução: `multica issue runs <issue-id>` (histórico) e `multica issue run-messages`.

## 7. Comandos/endpoints Multica que a skill invoca (interface real confirmada)

| Ação | Comando | Flags-chave |
|---|---|---|
| Criar (empilhar) | `multica issue create` | `--title` (req), `--project <UUID>`, `--status backlog`, `--description` (decodifica `\n`; ou `--description-stdin`/`--description-file`), `--priority`, `--attachment`, `--parent <id>`, `--assignee`/`--assignee-id` (NÃO usar na criação empilhada) |
| Mover status | `multica issue status <id> <status>` | status válidos acima |
| Atribuir/disparar | `multica issue assign <id> --to-id <UUID>` | `--to` (fuzzy nome), `--unassign` |
| Listar | `multica issue list` | `--project`, `--status`, `--priority`, `--assignee-id`, `--metadata key=value`, `--limit`, `--offset`, `--output json` |
| Detalhe | `multica issue get <id> --output json` | |
| Comentar/iterar | `multica issue comment add <id> --content "..."` | `--content-stdin`, `--attachment` |
| Metadata KV | `multica issue metadata set/get/list/delete <id> --key --value` | valor JSON-parseado, `--type` força tipo |
| Re-rodar | `multica issue rerun <id>` | |
| Labels | `multica label create/list` + `multica issue label` | |
| Mapa | `multica project list / agent list / squad list --output json` | |
| Automação | `multica autopilot create/trigger-add` | `--mode create_issue\|run_only`, `--cron`, `--kind webhook`, `--issue-title-template "{{date}}"` |

IDs fixos úteis: Workspace Ecoup `f4920de2-353d-475a-8cfb-f6739ed3074d`; Runtime Claude `545b87ff-b5cb-43aa-9ceb-8a03c02d7a4c`. Projeto do próprio UP: **EcoUp · Infra & MCPs** `2b9fb870-21b8-4880-8f43-0cf4d485bf35` (resource `up-cc`).

## 8. OPORTUNIDADE DE INTEGRAÇÃO UP ↔ Multica (a "cola")

O Multica já tem TODAS as primitivas pra ser o board visual do UP. Não precisa novo backend — só uma camada fina que traduz `.plano/` ↔ issues. Quatro vetores:

**A. Brainstorm/planejamento do UP → issues no Multica.**
Quando `/up:plan` ou `/up:modo-builder` gera o ROADMAP (fases) e os PLAN-NNN (tarefas por onda), cada item vira issue:
- 1 issue-pai por **fase** (`multica issue create --status backlog --project <id>`), título `[Projeto] Fase NN — slug`.
- 1 sub-issue por **tarefa/onda** com `--parent <id-da-fase>`. A hierarquia `parent_issue_id` reproduz fielmente fase → ondas → tarefas do UP.
- Roteia automático: dev → Maestro Dev, testes → QA (que já delegam pros agentes `up-*`). Continua empilhado (backlog), respeitando o "executa sob comando".

**B. Cada fase/wave/tarefa do UP aparece no board com status atualizando.**
O `up-tools.cjs` (comandos `state`, `roadmap`, `phase`) já é o ponto único onde o UP muda estado. Basta adicionar um hook/comando que espelhe transições:
- UP "fase em andamento" → `multica issue status <id> in_progress`
- UP "fase concluída" → `multica issue status <id> done`
- UP "bloqueada" → `blocked`. Mapa de status é quase 1:1 entre os dois sistemas.

**C. `metadata` KV = a ponte de identidade (chave do design).**
Gravar em cada issue Multica a referência UP via `multica issue metadata set <id> --key up_phase --value 3` (+ `up_project`, `up_wave`, `up_plan_file`, `up_state_path`). Depois `multica issue list --metadata up_project=up-cc --metadata up_phase=3` recupera exatamente as issues de uma fase. Isso dá reconciliação idempotente (não duplica) e permite o UP saber quais issues já criou. Espelha o padrão já usado em produção (`pipeline_status`, `pr_url`, `pr_number`).

**D. Sincronização reversa via autopilot/webhook.**
`multica autopilot trigger-add <id> --kind webhook` gera URL que dispara em eventos. Quando o agent do Multica termina (PR aberto, status `done`), um webhook pode chamar o `up-tools.cjs` pra marcar a tarefa concluída no `.plano/STATE.md`. Fecha o loop bidirecional: UP empurra plano → Multica executa → status volta pro UP.

**Resumo da arquitetura proposta:** UP continua dono do plano (`.plano/`), Multica vira a camada de execução/board visível. Cola = um adaptador no `up-tools.cjs` (ex: subcomando `up-tools.cjs multica sync`) que (1) cria issues-pai/filha por fase/onda, (2) grava `metadata` `up_*` pra identidade, (3) espelha status nas duas direções. Roteamento dev/QA já encaixa nos agentes `up-*` via Maestro Dev/QA. Zero infra nova: tudo já existe no CLI `multica`.
