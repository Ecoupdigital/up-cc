<p align="center">
  <pre align="center">
  ██╗   ██╗██████╗
  ██║   ██║██╔══██╗
  ██║   ██║██████╔╝
  ██║   ██║██╔═══╝
  ╚██████╔╝██║
   ╚═════╝ ╚═╝</pre>
</p>

<h3 align="center">Desenvolvimento orientado a especificacao para Claude Code, Gemini CLI, OpenCode e Codex</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/up-cc"><img src="https://img.shields.io/npm/v/up-cc.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/up-cc"><img src="https://img.shields.io/npm/dm/up-cc.svg" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/up-cc.svg" alt="license"></a>
</p>

---

**UP** e um sistema de meta-prompting que transforma seu assistente de IA em um desenvolvedor estruturado. Em vez de pedir "faz X", voce descreve o que quer e o UP cuida do brainstorm, planejamento, execucao, verificacao e rastreamento, tudo via slash commands.

Funciona com **Claude Code**, **Gemini CLI**, **OpenCode** e **Codex**. A invocacao varia por runtime: `/up:X` (Claude, Gemini), `/up-X` (OpenCode), `$up-X` (Codex).

> **v2.0 e um redesign completo (breaking change).** Sao 7 comandos no lugar de 31, 12 agentes no lugar de 52, e o `/up:build` agora e GitHub-nativo por padrao (worktree, issue, PR e merge por fase, com teste visual antes do merge). Veja a [tabela de migracao no CHANGELOG](CHANGELOG.md). Detalhes completos no [Guia de Uso](../docs/GUIA-DE-USO.md).

## Por que UP?

Sem UP, voce pede algo ao assistente e torce pra dar certo. Com UP:

- **Brainstorm-first** com profundidade escalada: tarefa trivial nao faz pergunta nenhuma, tarefa grande passa por brainstorm completo com aprovacao por secao
- **Projetos sao divididos em fases** com roadmap, planos executaveis e criterios de aceite
- **Estado persiste entre sessoes** via arquivos em `.plano/`, sobrevive a `/clear` e troca de contexto
- **Commits atomicos** rastreiam cada mudanca com mensagens descritivas
- **TDD por tipo de codigo**: logica pede teste red-green, UI pede prova visual, glue pede smoke-test. Nunca "Pronto!" sem evidencia fresca
- **GitHub-nativo por padrao**: cada fase abre worktree, issue e branch `up/fase-NN-slug`, executa, e no fim oferece um menu (merge local, abrir PR, deixar a branch ou descartar). `--solo` e o escape hatch para commit direto na branch atual
- **Teste visual antes do merge**: se a fase tem UI, o build sobe o dev server dentro da worktree e pergunta se voce quer ver na tela antes de mergear. Producao nao mergeia sem o dono aprovar
- **Detecta projetos existentes** e adapta o fluxo automaticamente (brownfield)

## Instalacao

```bash
npx up-cc@latest --claude --global    # Claude Code
npx up-cc@latest --gemini --global    # Gemini CLI
npx up-cc@latest --opencode --global  # OpenCode
npx up-cc@latest --codex --global     # Codex
npx up-cc@latest --all --global       # Todos
```

Para instalar localmente no projeto (em vez de global):

```bash
npx up-cc@latest --claude --local
```

Desinstalar:

```bash
npx up-cc@latest --uninstall
```

Apos instalar, reinicie o CLI e digite `/up` para comecar de onde parou (ou descreva o que quer construir).

---

## Os 7 comandos

| Comando | O que faz |
|---------|-----------|
| **`/up`** | Porta unica. Sem argumento, continua de onde parou (le `STATE.md` e roteia). Com descricao, dispara o brainstorm escalado e roteia greenfield/brownfield/clone. Tambem e a casa de `estado` e `config` (subverbos). |
| **`/up:plan`** | Planeja projeto ou fase (deteccao automatica). Research inline + self-check. Quebra fase grande em varios planos por dominio organizados em waves. Gera `PLAN-READY.md` executavel, inclusive em outro runtime. |
| **`/up:build`** | Executa o que foi planejado. **GitHub-nativo por padrao**: por fase abre worktree + issue + branch, executa, testa o visual e oferece menu de fim de fase (merge local, PR, deixa a branch, descarta). Flags: `--solo` (escape hatch, commit na branch atual sem cerimonia), `--auto` (pula o menu), `--board` (espelha no Multica). |
| **`/up:testar`** | Loop DCRV unico (detectar, corrigir, reverificar) num passe. Default roda tudo: visual, interacao, API, UX, mobile, E2E. Flags `--ux`/`--mobile`/`--e2e` focam. |
| **`/up:depurar`** | Depuracao sistematica (causa raiz, hipotese, fix com teste de regressao) com estado persistente entre `/clear`. |
| **`/up:auditar`** | Auditoria priorizada num passe (UX, performance, modernidade). Flag `--features` ativa pesquisa de mercado para sugerir features novas. |
| **`/up:rapido`** | Tarefa pontual com garantias UP minimas (commit atomico, rastreamento em `STATE.md`), pulando o roadmap inteiro. O escape hatch nomeado. |

Regra de design: **nenhum comando tem mais de 3 subverbos.** A superficie cognitiva real e ~12 entradas, nao ~50.

---

## Fluxo

O UP escala o esforco pelo tamanho da tarefa, sem voce pedir.

### Caminho rapido (tarefa pontual, sem roadmap)

```
/up "ajusta o titulo do botao pra X"
  -> classify-task: TRIVIAL -> 0 perguntas, anuncia e executa
  -> up-executor muda + prova fresca por tipo (UI -> captura visual antes/depois)
  -> commit atomico na branch ATUAL
  -> STATE.md atualizado. FIM.
```

Zero worktree, zero issue, zero PR, zero rede. `/up:rapido` (ou `--solo` no build) e o escape hatch nomeado para esse modo, pulando ate o roadmap.

### Caminho medio (feature de 1 subsistema)

```
/up "adiciona filtro por data no dashboard"
  -> classify-task: PEQUENA -> 1 pergunta-chave + design em 3 frases
  -> BRIEFING.md curto, commitado
  -> /up:plan gera PLAN-READY.md (1 plano = 1 agente)
  -> /up:build (GitHub-nativo): worktree + issue, TDD por tipo, teste visual se tem UI
  -> menu de fim de fase (merge local / abrir PR / deixa a branch / descarta)
```

### Caminho completo (projeto grande, repo colaborativo)

```
/up "redesign do gestor com novo modulo de cohorts"
  -> classify-task: GRANDE -> brainstorm full com aprovacao por secao
  -> BRIEFING.md completo -> /up:plan gera ROADMAP.md + varios PLAN-READY.md em waves
  -> /up:build --board   (GitHub-nativo por padrao, Multica ligado via --board)
     por fase: worktree -> issue -> waves de agentes em paralelo -> teste visual -> menu de fim de fase
  -> .plano/ consolida na main no merge; git-map.json atualizado
```

---

## TDD por tipo de codigo

A Iron Law do UP nao e "TDD unit universal", e **evidencia fresca antes de afirmar pronto**. O gate cobra a prova certa para cada tipo, decidida pelo `classify-task`:

| Tipo de codigo | Prova exigida |
|---|---|
| Logica, parser, calculo, API propria, bugfix | Teste red-green (TDD unit) |
| UI, CSS, layout | Prova visual antes/depois (via `up-tester`) |
| Glue, integracao, config | Smoke-test |

O sistema sabe que CSS pede prova visual. Voce nao precisa pedir licenca, e o agente nao diz "Pronto!" sem mostrar a evidencia.

---

## GitHub-nativo (o default do `/up:build`)

Por padrao (`github_native=true`), cada fase do build abre worktree + branch + issue, executa, testa, e no fim **pergunta** o que fazer:

```
/up:build           # GitHub-nativo: worktree -> issue -> teste visual -> menu de fim de fase
/up:build --auto    # mesmo fluxo, mas pula o menu de fim de fase
/up:build --solo    # ESCAPE HATCH: commit na branch atual, zero cerimonia GitHub
```

- Usa a tool nativa `EnterWorktree` do harness quando disponivel (fallback: `git worktree add`)
- 1 issue por fase, branch `up/fase-NN-slug`, `Closes #N` no corpo do PR
- No fim da fase, **menu de fim de fase** (merge local / abrir PR / deixa a branch / descarta), nunca PR-automatico
- Mapa de identidade em `.plano/git-map.json` (issue/pr por fase)
- Fail-open: se algo do GitHub falhar, o build segue

### Teste visual antes do merge (`require_visual_test=true`)

Se a fase tem UI, antes do merge o build sobe o dev server **dentro da worktree** e pergunta "testar primeiro ou pode mergear?". Se voce escolhe testar, o server fica no ar e depois vem "aprovado ou ajustar?". Ajustar manda o `up-executor` corrigir e re-passar pelo gate (loop). Projeto em producao nao mergeia sem o dono ver na tela.

### Waves paralelas

Quando `/up:plan` quebra uma fase em varios planos por dominio, o `/up:build` roda os planos da mesma wave **em paralelo** (varios `up-executor` de uma vez) e as waves em sequencia (por dependencia), depois fecha a fase. Fase pequena = 1 plano = 1 agente.

## Multica `--board` (opt-in)

Espelha o progresso das fases no board do [Multica](https://multica.ai) (issue tracker para times humano + agente). Opt-in via `--board`:

```
/up:build --board
```

- Status batched no fim de cada onda (todo, in_progress, in_review, done, blocked), nao por microtransicao
- 1 issue-pai por projeto + 1 issue-filha por fase, com identidade idempotente via metadata (`up_project`, `up_phase`, `gh_issue`, `branch`, `pr`)
- **Fail-open**: se o Multica estiver indisponivel, o UP avisa e segue sem board, nunca derruba o build
- Subcomando `up-tools.cjs multica` (`init`/`sync`/`board`), com `--dry-run` de preview

> O board mostra **status** (nao stream ao vivo de cada tool). O stream so existe quando o proprio Multica dispara o agente.

---

## Os 12 agentes

O UP usa 12 agentes especializados que rodam como subprocessos. Os antigos specialists (frontend/backend/database) fundiram no `up-executor`, que roteia dominio por contexto.

| Agente | Funcao |
|--------|--------|
| **up-arquiteto** | Design upfront a partir do brainstorm |
| **up-planejador** | Planeja fases com research inline e self-check |
| **up-executor** | Executa planos com commits atomicos; roteia frontend/backend/database por contexto |
| **up-verificador** | Verificacao goal-backward com evidencia fresca por tipo |
| **up-mapeador-codigo** | Analisa codebases existentes (e extrai design/features no modo clone) |
| **up-depurador** | Investigacao de bugs com metodo cientifico |
| **up-pesquisador** | Pesquisa de dominio, tecnologia e mercado |
| **up-revisor** | Review two-stage: spec-compliance cetico + qualidade de codigo |
| **up-tester** | Roda o app via Playwright num spawn multi-pass: visual + exhaustive + API |
| **up-auditor** | Auditoria de UX + performance + modernidade num passe |
| **up-sintetizador** | Sintetiza research, melhorias, ideias e requisitos |
| **up-roteirista** | Conteudo (roadmap, carrosseis, aulas) |

## Hooks

Instalados automaticamente:

- **up-statusline**: barra de status mostrando modelo, diretorio e uso de contexto
- **up-context-monitor**: avisa quando o contexto enche, sugerindo `/clear` + `/up`
- **up-session-start**: injeta a skill `usando-up` no inicio da sessao (e apos `/clear`/`/compact`), ligando a auto-ativacao das skills por contexto. Aditivo: se falhar, a sessao segue normal.

---

## Estrutura do `.plano/`

```
.plano/
├── PROJECT.md         # O que e o projeto, requisitos, decisoes
├── ROADMAP.md         # Todas as fases com status
├── STATE.md           # Posicao atual, progresso, continuidade
├── config.json        # Configuracoes do workflow
├── git-map.json       # Identidade GitHub/Multica por fase (issue/pr/multica_issue)
├── approvals.log      # Gate deterministico de aprovacao de fase/plano
├── codebase/          # Mapeamento do codebase (brownfield)
├── fases/
│   └── 01-slug/
│       ├── BRIEFING.md       # Resultado do brainstorm
│       ├── CONTEXT.md        # Contexto coletado
│       ├── PLAN-READY.md     # Plano executavel
│       ├── SUMMARY-001.md    # Resultado da execucao
│       └── VERIFICATION.md   # Resultado da verificacao
├── rapido/            # Tarefas rapidas
└── debug/             # Sessoes de debug (sobrevivem a /clear)
```

Todos os arquivos sao texto puro (Markdown/JSON) e podem ser commitados.

## Persistencia entre sessoes

O UP sobrevive a `/clear` e reinicializacoes do CLI. Todo estado fica em disco no `.plano/`. Apos um `/clear`, basta `/up` para restaurar o contexto e continuar de onde parou.

## Compatibilidade

| Runtime | Invocacao | Formato |
|---------|-----------|---------|
| Claude Code | `/up:X` | Nativo (Markdown + YAML). Hook SessionStart, 4 skills por contexto, statusLine e context-monitor |
| Gemini CLI | `/up:X` | Convertido (TOML commands). Brainstorm-first via bootstrap injetado no `GEMINI.md` |
| OpenCode | `/up-X` | Convertido (`command/up-*.md`, object tools). Bootstrap injetado no `AGENTS.md` |
| Codex | `$up-X` | Convertido (skills + `config.toml [agents]`). Bootstrap injetado no `AGENTS.md` |

Os 12 agentes sao convertidos para todos os runtimes. Fora do Claude nao ha hook nem skills nativas, mas a doutrina brainstorm-first carrega sempre via arquivo de instrucoes.

Requisitos: Node.js >= 16.7.0

## Atualizacao

```
/up                                  # subverbo de atualizacao via npm
npx up-cc@latest --claude --global   # Ou via terminal
```

## Licenca

MIT
</content>
