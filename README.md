<p align="center">
  <pre align="center">
  ██╗   ██╗██████╗
  ██║   ██║██╔══██╗
  ██║   ██║██████╔╝
  ██║   ██║██╔═══╝
  ╚██████╔╝██║
   ╚═════╝ ╚═╝</pre>
</p>

<h3 align="center">Desenvolvimento orientado a especificacao para Claude Code, Gemini CLI e OpenCode</h3>

<p align="center">
  <a href="https://www.npmjs.com/package/up-cc"><img src="https://img.shields.io/npm/v/up-cc.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/up-cc"><img src="https://img.shields.io/npm/dm/up-cc.svg" alt="npm downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/up-cc.svg" alt="license"></a>
</p>

---

**UP** e um sistema de meta-prompting que transforma seu assistente de IA em um desenvolvedor estruturado. Em vez de pedir "faz X", voce descreve o projeto e o UP cuida do planejamento, execucao, verificacao e rastreamento — tudo via slash commands.

Funciona com **Claude Code**, **Gemini CLI** e **OpenCode**.

## Por que UP?

Sem UP, voce pede algo ao assistente e torce pra dar certo. Com UP:

- **Projetos sao divididos em fases** com roadmap, planos executaveis e criterios de aceite
- **Cada fase passa por um pipeline**: discutir → planejar → executar → verificar
- **Estado persiste entre sessoes** via arquivos em `.plano/` — sobrevive a `/clear` e troca de contexto
- **Commits atomicos** rastreiam cada mudanca com mensagens descritivas
- **Agentes especializados** rodam em paralelo para pesquisa, planejamento, execucao e verificacao
- **Tarefas rapidas** tem o mesmo rigor sem a cerimonia completa

## Instalacao

```bash
npx up-cc@latest --claude --global    # Claude Code
npx up-cc@latest --gemini --global    # Gemini CLI
npx up-cc@latest --opencode --global  # OpenCode
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

Apos instalar, reinicie o Claude Code e digite `/up:ajuda` para ver todos os comandos.

## Inicio Rapido

### Novo projeto (do zero)

```
/up:novo-projeto          # Coleta contexto, cria PROJECT.md e ROADMAP.md
/up:discutir-fase 1       # Discute requisitos da fase 1
/up:planejar-fase 1       # Cria planos executaveis
/up:executar-fase 1       # Executa com commits atomicos
/up:verificar-trabalho 1  # UAT conversacional
```

### Projeto existente (brownfield)

```
/up:mapear-codigo         # Analisa codebase com agentes paralelos
/up:novo-projeto          # Cria PROJECT.md baseado no mapeamento
/up:discutir-fase 1       # Continua normalmente
```

### Continuar trabalho

```
/up:retomar               # Restaura contexto da sessao anterior
/up:progresso             # Status e proxima acao recomendada
```

### Tarefa rapida

```
/up:rapido "Corrigir bug no login"   # Executa com garantias UP
```

## Comandos

### Inicializacao

| Comando | Descricao |
|---------|-----------|
| `/up:novo-projeto` | Inicializar projeto com coleta de contexto interativa |
| `/up:mapear-codigo` | Analisar codebase existente com agentes paralelos |
| `/up:retomar` | Restaurar contexto da sessao anterior |

### Pipeline de Fase

| Comando | Descricao |
|---------|-----------|
| `/up:discutir-fase N` | Coletar contexto por questionamento estruturado |
| `/up:planejar-fase N` | Criar planos executaveis com pesquisa e self-check |
| `/up:executar-fase N` | Executar planos com paralelizacao por ondas |
| `/up:verificar-trabalho N` | Validar features via UAT conversacional |

### Gerenciamento

| Comando | Descricao |
|---------|-----------|
| `/up:progresso` | Dashboard de status e proxima acao |
| `/up:pausar` | Criar arquivo de handoff `.continue-aqui.md` |
| `/up:adicionar-fase "desc"` | Adicionar fase ao final do roadmap |
| `/up:remover-fase N` | Remover fase futura e renumerar |
| `/up:adicionar-testes N` | Gerar testes para fase completa |

### Utilitarios

| Comando | Descricao |
|---------|-----------|
| `/up:rapido "tarefa"` | Tarefa rapida com commits atomicos |
| `/up:depurar` | Depuracao sistematica com metodo cientifico |
| `/up:configurar` | Configurar opcoes do workflow |
| `/up:atualizar` | Verificar e instalar atualizacoes |
| `/up:saude` | Diagnosticar integridade do `.plano/` |
| `/up:ajuda` | Referencia completa de comandos |

### Flags

```
# planejar-fase
--pesquisar       Forcar re-pesquisa mesmo com RESEARCH.md existente
--sem-pesquisa    Pular pesquisa, ir direto ao planejamento
--auto            Auto-detectar proxima fase nao planejada
--gaps            Modo fechamento de gaps (le VERIFICATION.md)

# executar-fase
--gaps-only       Executar apenas planos de fechamento de gaps
```

## Pipeline de Desenvolvimento

```
                    ┌──────────────────────────────────────────┐
                    │              /up:novo-projeto             │
                    │    Coleta contexto → PROJECT.md + ROADMAP │
                    └────────────────┬─────────────────────────┘
                                     │
                    ┌────────────────▼─────────────────────────┐
                    │            /up:discutir-fase N            │
                    │     Questionamento → CONTEXT.md           │
                    └────────────────┬─────────────────────────┘
                                     │
                    ┌────────────────▼─────────────────────────┐
                    │           /up:planejar-fase N             │
                    │   Pesquisa + Planejamento → PLAN-NNN.md   │
                    └────────────────┬─────────────────────────┘
                                     │
                    ┌────────────────▼─────────────────────────┐
                    │           /up:executar-fase N             │
                    │   Execucao paralela → Commits atomicos    │
                    └────────────────┬─────────────────────────┘
                                     │
                    ┌────────────────▼─────────────────────────┐
                    │        /up:verificar-trabalho N           │
                    │     UAT conversacional → VERIFICATION.md  │
                    └────────────────┬─────────────────────────┘
                                     │
                              Gaps encontrados?
                              ├── Sim → /up:planejar-fase N --gaps
                              └── Nao → Proxima fase
```

## Estrutura do `.plano/`

O UP cria e mantém um diretorio `.plano/` na raiz do projeto:

```
.plano/
├── PROJECT.md              # O que e o projeto, requisitos, decisoes
├── ROADMAP.md              # Todas as fases com status
├── STATE.md                # Posicao atual, progresso, continuidade
├── config.json             # Configuracoes do workflow
├── fases/
│   ├── 01-autenticacao/
│   │   ├── CONTEXT.md      # Contexto coletado na discussao
│   │   ├── RESEARCH.md     # Pesquisa de dominio/tecnologia
│   │   ├── PLAN-001.md     # Plano executavel
│   │   ├── PLAN-002.md     # Outro plano (se necessario)
│   │   ├── SUMMARY-001.md  # Resultado da execucao
│   │   └── VERIFICATION.md # Resultado do UAT
│   ├── 02-dashboard/
│   │   └── ...
│   └── ...
├── rapido/
│   ├── TASK-001.md         # Tarefa rapida executada
│   └── ...
└── debug/
    ├── bug-login.md        # Sessao de debug ativa
    └── resolved/           # Sessoes resolvidas
```

Todos esses arquivos sao texto puro (Markdown/JSON) e podem ser commitados no repositorio.

## Agentes

O UP usa 8 agentes especializados que rodam como subprocessos:

| Agente | Funcao |
|--------|--------|
| **up-pesquisador-projeto** | Pesquisa de dominio e tecnologia para novos projetos |
| **up-roteirista** | Cria ROADMAP.md com fases e criterios de sucesso |
| **up-planejador** | Planeja fases com pesquisa inline e self-check |
| **up-executor** | Executa planos com commits atomicos |
| **up-verificador** | Verificacao goal-backward de trabalho completado |
| **up-mapeador-codigo** | Analisa codebases existentes em paralelo |
| **up-depurador** | Investigacao de bugs com metodo cientifico |
| **up-sintetizador** | Sintetiza pesquisa em documentos estruturados |

## Hooks

Dois hooks sao instalados automaticamente:

- **up-statusline** — Barra de status abaixo do input mostrando modelo, diretorio e uso de contexto
- **up-context-monitor** — Avisa quando o contexto esta ficando cheio (35% warning, 25% critico), sugerindo `/clear` + `/up:retomar`

## Persistencia entre Sessoes

O UP sobrevive a `/clear` e reinicializacoes do CLI:

1. **Estado em disco** — `.plano/STATE.md` rastreia posicao, decisoes, bloqueios
2. **Handoff** — `/up:pausar` cria `.continue-aqui.md` com contexto para retomada
3. **Retomada** — `/up:retomar` le os arquivos de estado e restaura o contexto completo
4. **Debug persistente** — Sessoes de debug em `.plano/debug/` sobrevivem entre conversas

## Configuracao

```
/up:configurar
```

Opcoes disponiveis:

| Opcao | Default | Descricao |
|-------|---------|-----------|
| Modo | solo | `solo` (commits diretos) ou `time` (branches por fase) |
| Paralelizacao | sim | Agentes rodam em paralelo quando independentes |
| Commit Docs | sim | Commitar documentos de planejamento automaticamente |
| Auto-Advance | nao | Encadear estagios automaticamente |

## Compatibilidade

| Runtime | Status | Formato |
|---------|--------|---------|
| Claude Code | Completo | Nativo (Markdown + YAML frontmatter) |
| Gemini CLI | Completo | Convertido (TOML commands, YAML arrays) |
| OpenCode | Completo | Convertido (object tools, hex colors) |

Requisitos: Node.js >= 16.7.0

## Atualizacao

```
/up:atualizar             # Verifica e instala de dentro do CLI
npx up-cc@latest --claude --global  # Ou via terminal
```

## Licenca

MIT
