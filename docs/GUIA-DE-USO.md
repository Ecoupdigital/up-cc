# UP v2 - Guia de Uso

Como usar o UP no dia a dia. Para você que vibe-coda com Claude Code, OpenCode, Gemini ou Codex.

Versão: `up-cc` 2.0.0.

---

## 1. TL;DR

O UP é um sistema de desenvolvimento orientado a especificação que vive dentro do seu CLI de IA. Ele força brainstorm antes de codar, planeja em fases, executa com agentes em paralelo e (por padrão) trabalha GitHub-nativo: cada fase abre worktree, issue e PR.

A porta única é `/up`:

- `/up "uma ideia"` -> brainstorma, pesquisa, planeja e prepara a execução.
- `/up:plan` -> planeja (gera `.plano/PLAN-READY.md`), não toca em código.
- `/up:build` -> executa o que foi planejado, fase por fase.
- `/up` (sem argumento) -> continua de onde você parou (lê `.plano/STATE.md`).

Ciclo curto: descreva -> brainstorm -> `/up:plan` -> `/up:build` -> (no fim de cada fase de UI) testa na tela -> merge.

---

## 2. Setup

Instalação por runtime (do diretório do repo up-cc, ou via npm `up-cc`):

```bash
node up/bin/install.js --claude --global     # Claude Code
node up/bin/install.js --gemini --global     # Gemini CLI
node up/bin/install.js --opencode --global   # OpenCode
node up/bin/install.js --codex --global       # OpenAI Codex CLI
node up/bin/install.js --all --global         # todos de uma vez
```

Via npm (publicado como `up-cc`):

```bash
npx up-cc --claude --global
```

Depois de instalar no **Claude Code**, rode `/clear` para ativar. O install configura um hook `SessionStart` que injeta o bootstrap `usando-up` e habilita as 4 skills (que ativam por contexto), a statusLine e o `up-context-monitor`. Sem o `/clear`, a sessão atual não enxerga o que acabou de ser instalado.

Invocação por runtime (mesmo comando, prefixo diferente):

| Runtime | Invocação | Ativação da doutrina |
|---|---|---|
| Claude Code | `/up:plan` | hook SessionStart + 4 skills nativas |
| Gemini CLI | `/up:plan` | bootstrap injetado no `GEMINI.md` |
| OpenCode | `/up-plan` | bootstrap injetado no `AGENTS.md` |
| Codex | `$up-plan` | bootstrap injetado no `AGENTS.md` |

---

## 3. Projeto NOVO (greenfield)

Exemplo real: um app de controle de gastos pessoais.

### 3.1 Criar a pasta e abrir o CLI

```bash
mkdir ~/projetos/grana && cd ~/projetos/grana
git init
claude
```

### 3.2 Disparar a porta única com a ideia

```
/up "app web de controle de gastos: lança despesa, categoriza, mostra gráfico mensal. Next.js + Supabase"
```

O UP roda `classify-task` para medir o tamanho e escala o brainstorm:

- **Tarefa trivial** (1 arquivo): 0 perguntas, anuncia em 1 linha e segue.
- **Pequena** (1 subsistema, 1 escolha de design): 1 pergunta e design em 3 frases.
- **Média/grande** (schema + API + auth): brainstorm completo, com aprovação por seção.

Como a pasta está vazia e sem código, o UP detecta **GREENFIELD** automaticamente. Na tela aparece algo assim:

```
Detectado: GREENFIELD (pasta vazia, sem código)
Tamanho: média (multi-subsistema: schema + UI + gráfico)
Iniciando brainstorm. Vou confirmar intenção, requisitos e design antes de planejar.

[1/4] Quem usa e o que precisa resolver no primeiro uso?
...
```

> Primeira vez no runtime: se `~/.claude/up/owner-profile.md` ainda não existe, o UP roda o onboarding do dono antes do brainstorm (senão o brainstorm sai genérico).

O brainstorm gera um `BRIEFING.md`. Em greenfield, o pipeline ainda roda pesquisa e síntese antes de planejar.

### 3.3 Planejar

O UP encadeia para o `/up:plan` (ou você roda explícito):

```
/up:plan
```

Saída: `.plano/PLAN-READY.md` mais a estrutura de planejamento. Nada de código ainda. O `.plano/` fica assim:

```
.plano/
  STATE.md          # onde você está agora
  ROADMAP.md        # todas as fases
  PROJECT.md
  REQUIREMENTS.md
  config.json
  PLAN-READY.md     # o selo de "pode buildar"
  fase-01-schema/   # CONTEXT, PLAN-001, etc.
  fase-02-ui/
  governance/approvals.log
```

### 3.4 Buildar

```
/up:build
```

Por padrão (config `github_native: true`), para CADA fase o build:

1. Abre uma worktree + branch `up/fase-NN-slug` + uma issue no GitHub.
2. Roda os planos da fase (executor -> verificador -> gate determinístico -> revisor).
3. Se a fase tem UI, sobe o dev server DENTRO da worktree e pede aprovação visual antes do merge.
4. Apresenta o menu de fim de fase.

Na tela:

```
Modo git: GitHub-nativo (worktree + issue + PR/menu por fase)

Fase 02 (UI): abrindo worktree...
  branch: up/fase-02-ui
  issue:  #14 "Fase 02 - UI de lançamento e gráfico"
  worktree: ../grana-fase-02-ui

[executor] implementando lançamento de despesa...
[verificador] VERIFICATION.md emitido (evidência fresca)
[gate] approvals.log: APROVADO
[revisor] spec-compliance OK / code-quality OK

Subi o dev server em http://localhost:3000 com o código desta fase.
Testar primeiro ou pode mergear?
  > Testar primeiro
    Pode mergear
```

Se você escolher **Testar primeiro**, o server fica no ar, você abre a URL e testa. Depois:

```
Aprovado, pode mergear
Achei problema, quero ajustar
```

"Achei problema" re-spawna o `up-executor` para corrigir, re-roda o gate, re-testa. Loop até você aprovar.

Quando aprova, mata o dev server e cai no menu de fim de fase:

```
Fase 02 concluída. O que fazer com a branch?
  1) Merge local (squash na base)        <- default sugerido
  2) Abrir PR
  3) Deixa a branch (in_review)
  4) Descarta (sem merge)
```

Escolhida a opção, o build avança para a próxima fase sozinho. Do início do build em diante, **zero interação** fora alertas críticos e os menus de fim de fase.

---

## 4. Projeto REAL existente (brownfield)

Exemplo: adicionar "exportar relatório em PDF" num app Next.js já deployado (Local -> GitHub -> Coolify).

### 4.1 Abrir o CLI dentro do repo

```bash
cd ~/projetos/gestor-lfpro
claude
```

### 4.2 Descrever a feature

```
/up "adicionar exportação de relatório mensal em PDF no dashboard, botão no header, gera server-side"
```

Como há `package.json` e `src/`, o UP detecta **BROWNFIELD**: ele mapeia o codebase antes de planejar (o `up-mapeador-codigo` entende a estrutura atual) e só então brainstorma o encaixe da feature.

```
Detectado: BROWNFIELD (Next.js, src/ presente)
Mapeando codebase para encaixar a feature...
  rotas: /dashboard, /api/*
  stack: Next.js 14 + Supabase
Brainstorm: onde mora o botão, lib de PDF, server action vs route handler...
```

### 4.3 Planejar e buildar

```
/up:plan
/up:build
```

O fluxo GitHub-nativo encaixa direto no seu pipeline:

- Branch `up/fase-01-pdf-export` + issue + PR contra `main`.
- Teste visual antes do merge: o dev server sobe na worktree, você confere o botão e o PDF na tela antes de qualquer merge. Projeto em produção **não mergeia sem o dono ver**.
- Ao escolher "Abrir PR" no menu, o PR vai com `Closes #N` no body. Você revisa no GitHub, mergeia, e o Coolify faz o deploy a partir da `main` como já faz hoje.

Para uma feature pequena num app em produção, a recomendação é usar o menu (PR), não `--solo`, para manter rastro e revisão.

---

## 5. Tarefa rápida (escape hatch)

Quando é um ajuste pontual e você NÃO quer roadmap nem cerimônia GitHub:

```
/up:rapido "corrige o typo no título da home e ajusta o padding do header"
```

O `/up:rapido` faz um commit atômico na branch ATUAL, com rastro mínimo em `STATE.md`. Zero worktree, zero issue, zero PR, zero fase. É o escape hatch nomeado para pular o `/up:build`.

Use quando:
- O fix cabe num commit e você já sabe exatamente o que fazer.
- Não vale abrir fase/PR (typo, cor, copy, config trivial).

Não use quando: a mudança toca arquitetura, precisa de revisão, ou vira mais de um passo. Aí é `/up:plan` + `/up:build`.

---

## 6. Multiagente e waves

Quem decide se vai paralelizar é o `/up:plan`, não você.

- **Fase pequena** = 1 plano = 1 agente `up-executor`. Sem paralelismo.
- **Fase grande** = o `/up:plan` quebra em vários planos por domínio (ex: schema, API, UI), e agrupa em **waves**.

No `/up:build`, a regra é:

- Planos da **mesma wave** rodam **em paralelo** (vários `up-executor` numa única leva). É seguro porque a wave só junta planos independentes, com arquivos disjuntos.
- **Waves rodam em sequência**: a wave 2 só começa quando a wave 1 inteira termina (a wave posterior é onde mora a dependência).

Na tela de uma fase grande:

```
Fase 03: 4 planos em 2 waves
  Wave 1 (paralelo): [001-schema] [002-api-base]
  Wave 2 (paralelo): [003-ui-form] [004-ui-grafico]   (dependem da wave 1)

[wave 1] spawnando 2 executores em paralelo...
[gate A] 2/2 SUMMARYs presentes. OK.
[wave 2] spawnando 2 executores em paralelo...
[gate A] 4/4 SUMMARYs (todas as waves). OK.
```

Cada wave tem um gate (GATE A) que confere que todo plano não-pulado gerou seu SUMMARY antes de seguir. Se um plano falha, o build re-spawna só o executor daquele plano. Para desligar o paralelismo, ver `paralelizacao` na seção 14.

---

## 7. Teste visual antes do merge

Este é o gate de produção. Config: `require_visual_test` (default `true`).

Quando uma fase tem UI, no fim dela o build:

1. Sobe o dev server **dentro da worktree** (você testa o código REAL daquela fase, isolado).
2. Pergunta:

```
Subi o dev server em http://localhost:3000 com o código desta fase.
Testar primeiro ou pode mergear?
```

3. Se "Testar primeiro": mantém o server no ar, repete a URL e espera você testar. Quando você volta:

```
Aprovado, pode mergear
Achei problema, quero ajustar
```

- **Achei problema, quero ajustar**: você descreve o problema, o `up-executor` corrige, re-roda o gate e re-testa com o dev server. Loop até você aprovar. (É o "quando eu disser não, ajusta; quando eu disser sim, mergeia".)
- **Aprovado, pode mergear**: mata o dev server e segue para o merge.

Fase SEM UI (schema, backend puro, infra) pula o passo do dev server, mas ainda apresenta o menu de 4 opções.

Para projeto em produção: deixe o default (`true`). Para protótipo descartável, você pode usar `--auto` com `require_visual_test=false` para não parar.

---

## 8. GitHub-nativo

É o DEFAULT do `/up:build` (config `github_native: true`). Por fase: worktree -> branch `up/fase-NN-slug` -> issue -> commits -> (no fim) menu merge/PR/deixa/descarta.

Menu de fim de fase (4 opções):

1. **Merge local** (squash na base) - default sugerido.
2. **Abrir PR** (vai com `Closes #N` no body) -> merge squash -> cleanup da worktree+branch.
3. **Deixa a branch** (status `in_review`, worktree e branch vivos).
4. **Descarta** (remove worktree+branch sem merge).

### Flags

| Flag | O que faz |
|---|---|
| (nenhuma) | GitHub-nativo: worktree + issue + menu por fase. É o caminho quente. |
| `--solo` | **Escape hatch**: commit atômico na branch ATUAL. Zero worktree/issue/PR/board. |
| `--auto` | Pula o menu de fim de fase (merge se verde). Teste visual ainda roda se `require_visual_test=true`. |
| `--board` | Espelha o progresso no Multica (opt-in, batched no fim da onda/fase). |

> Atenção: `--solo` NÃO é o default. O default é GitHub-nativo. `--solo` é a saída para quando você quer correr sem cerimônia.

### Fail-open

Se não houver `gh` instalado ou remote configurado, o build degrada graciosamente para git local (worktree local + merge local; issue/PR = null) com um aviso, e **nunca crasha**.

### Calibrar por projeto

Edite `.plano/config.json` (ver seção 14). Ex: para um projeto que você prefere sempre solo:

```json
{ "github_native": false }
```

---

## 9. TDD por tipo

O gate de teste é por TIPO de código (registrado em `.plano/governance/approvals.log` com `evidence=<tipo>:<resultado>`). A prova exigida varia:

| Tipo de código | Prova exigida |
|---|---|
| Lógica / parser / bugfix | Teste **red-green** (falha antes, passa depois). |
| UI / CSS | **Prova visual** antes/depois (captura). |
| Glue / integração | **Smoke-test** (sobe e responde). |

A skill `up-tdd` ativa por contexto e cobra a prova certa antes de você escrever a implementação. Você não escolhe o tipo na unha: o agente detecta e exige a evidência adequada. Sem evidência no `approvals.log`, o gate determinístico não aprova a fase.

---

## 10. Multica (--board)

Espelho de status do board Multica. **Opt-in** (só com `--board`) e **fail-open** (erro avisa e o build segue).

```
/up:build --board
```

O que acontece:

- No início, garante o projeto no Multica (cria se não existe) e uma issue por fase.
- No FIM da onda/fase, faz **um único sync batched** com o status final (não por microtransição).
- Mapa de status UP -> Multica: opção 1/2 (merge/PR) -> `done`; opção 3 (deixa branch) -> `in_review`; opção 4 (descarta) -> `cancelled`.
- A KEY do Multica vai no body do PR (`Closes MUL-X`), então o merge auto-avança a issue para `done`.

Detecção de ambiente: em Mac (`uname -s` = Darwin) o `multica` é prefixado com `ssh server-ecoup '...'`; em Linux/VPS roda direto. Se o board estiver indisponível, você vê um aviso e o build não para:

```
AVISO: Multica indisponível (sync done fase 02). Seguindo.
```

Sem `--board`, nenhuma chamada ao Multica acontece.

---

## 11. Auditar, depurar, testar

### `/up:testar` - loop DCRV único

Detectar -> corrigir -> reverificar num passe. Por padrão roda tudo: visual, interação, API, UX, mobile, E2E.

```
/up:testar http://localhost:3000
/up:testar 3000 --mobile          # foca mobile
/up:testar --ux                   # foca UX
/up:testar --e2e --no-fix         # E2E sem corrigir automaticamente
```

Absorve os antigos ux-tester, mobile-first, adicionar-testes e verificar-trabalho num comando só.

### `/up:auditar` - auditoria de um passe

UX, performance e modernidade priorizados.

```
/up:auditar
/up:auditar --features    # adiciona pesquisa de mercado e sugere features novas
```

Absorve melhorias e ideias.

### `/up:depurar` - debug sistemático

Estado persistente entre `/clear`. Hipótese -> instrumentação -> análise.

```
/up:depurar "o gráfico mensal não atualiza quando lanço uma despesa nova"
```

O estado do debug sobrevive a resets de contexto, então você pode dar `/clear` no meio de uma caçada longa sem perder o fio.

---

## 12. Persistência e retomada

Todo o estado vive em `.plano/` e sobrevive a `/clear`:

```
.plano/
  STATE.md                  # posição atual, decisões, bloqueios
  ROADMAP.md                # fases e status
  PROJECT.md, REQUIREMENTS.md
  config.json
  fase-NN-slug/             # CONTEXT, RESEARCH, PLAN-NNN, SUMMARY-NNN, VERIFICATION
  governance/approvals.log  # gate determinístico
  git-map.json              # worktree/branch/issue/PR por fase
```

Para retomar, sem argumento:

```
/up
```

O UP lê `STATE.md`, calcula o progresso e roteia para a próxima ação recomendada (planejar, executar, testar). Se o `.plano/` não existe e não há código, ele te mostra como começar.

Subverbos de estado e config:

```
/up estado     # status, integridade do .plano/, pausar, retomar, reset
/up config     # opções do workflow, onboarding do dono, atualizar o up-cc
```

O hook `up-context-monitor` avisa na statusLine quando o contexto está enchendo, sinal de que vale dar `/clear` (o estado está salvo, você não perde nada).

---

## 13. Multi-runtime

A jogada: **planejar no Claude** (modelo forte) e **executar barato** em OpenCode, Gemini ou Codex. O `PLAN-READY.md` é portável.

```bash
# No Claude Code (planejamento):
/up:plan "minha feature"
/up:plan "minha feature" --execution-runtime=opencode   # marca o runtime alvo

# Depois, no OpenCode (execução barata), no mesmo repo:
/up-build
```

O `/up:build` confia no `PLAN-READY.md` e não re-roda o planejamento inteiro. Se durante a execução o plano se mostrar inviável, o `up-planejador` LOCAL refaz a fase (máximo 1 round, registrado em `.plano/governance/replans.log`), sem voltar pro runtime que planejou.

Diferenças por runtime:

- **Claude Code**: completo. Hook SessionStart + 4 skills nativas + statusLine + context-monitor.
- **Gemini / OpenCode / Codex**: comandos e agentes convertidos; sem hook nem skills nativas, mas a doutrina (brainstorm-first) carrega sempre via bootstrap injetado no arquivo de instruções (`GEMINI.md` / `AGENTS.md`).

Invocação: `/up:X` (Claude, Gemini), `/up-X` (OpenCode), `$up-X` (Codex).

---

## 14. Config (`.plano/config.json`)

Ler e setar pela CLI:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" config get github_native
node "$HOME/.claude/up/bin/up-tools.cjs" config set require_visual_test false
node "$HOME/.claude/up/bin/up-tools.cjs" config list-presets
```

Chaves e defaults reais:

| Chave | Default | O que faz |
|---|---|---|
| `github_native` | `true` | Worktree + issue + PR/menu por fase. `false` = sempre commit local. |
| `merge_strategy` | `"squash"` | Estratégia de merge: `squash`, `merge` ou `rebase`. |
| `require_visual_test` | `true` | Fase de UI sobe dev server e exige aprovação antes do merge. |
| `paralelizacao` | `true` | Roda planos da mesma wave em paralelo. `false` = sequencial. |
| `auto_advance` | `false` | Avança fase sem confirmar. |
| `commit_docs` | `true` | Commita os artefatos de `.plano/`. |
| `modo` | `"solo"` | Modo interno de operação. |
| `budget_ceiling` | `null` | Teto de orçamento (opcional). |
| `modelos` | `null` | Preset de modelos por papel (ver presets abaixo). |

Presets de modelo (`modelos.preset`):

| Preset | Planejamento | Execução | Governança | Review |
|---|---|---|---|---|
| `opus-completo` | opus | opus | opus | opus |
| `hibrido` | opus | sonnet | opus | opus |
| `sonnet-completo` | sonnet | sonnet | sonnet | sonnet |
| `economico` | sonnet | sonnet | haiku | sonnet |
| `custom` | manual por papel | | | |
| (runtime) | o runtime decide o modelo | | | |

Exemplo de `.plano/config.json` calibrado (projeto em produção, custo-benefício):

```json
{
  "github_native": true,
  "merge_strategy": "squash",
  "require_visual_test": true,
  "paralelizacao": true,
  "modelos": { "preset": "hibrido" }
}
```

---

## 15. Troubleshooting / FAQ

**Instalei mas `/up` não aparece no Claude Code.**
Rode `/clear`. O hook SessionStart só injeta o bootstrap numa sessão nova.

**`/up:build` reclama que falta PLAN-READY.md.**
Você pulou o planejamento. Rode `/up:plan` antes, ou `/up "<descrição>"` para brainstorm + plan + build de uma vez.

**Não tenho `gh` nem remote. O build crasha?**
Não. O GitHub-nativo é fail-open: degrada para worktree e merge local (issue/PR = null) com aviso.

**O build não para na tela para eu testar a UI.**
Cheque `require_visual_test` no `.plano/config.json` (default `true`). Se estiver `false` ou se você passou `--auto` com ele `false`, o teste visual é pulado. Fase sem UI também pula o dev server (mas mantém o menu).

**Quero só commitar um ajuste rápido, sem fase nem PR.**
`/up:rapido "<descrição>"`. Commit atômico na branch atual.

**Planejei no Claude, quero rodar barato. Como?**
`/up:plan --execution-runtime=opencode` no Claude, depois `/up-build` no OpenCode no mesmo repo. O `PLAN-READY.md` é portável.

**Como mando pro board do Multica?**
`/up:build --board`. Opt-in e fail-open. Sem a flag, nada vai pro Multica.

**Dei `/clear` no meio de um projeto. Perdi tudo?**
Não. O estado vive em `.plano/` e sobrevive a `/clear`. Rode `/up` (sem argumento) para retomar de onde parou.

**Como desligo o paralelismo de waves?**
`config set paralelizacao false`. Os executores rodam um por vez.
