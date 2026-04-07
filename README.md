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
- **Detecta projetos existentes** e adapta o fluxo automaticamente (brownfield)
- **Modo builder** constroi projetos inteiros autonomamente (briefing → sistema pronto + testado)
- **UX tester** navega o sistema como usuario real e implementa melhorias automaticamente

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

---

## Manual de Uso

### 1. Inicializando um projeto

O UP funciona tanto para projetos novos (greenfield) quanto para codebases existentes (brownfield). A deteccao e automatica.

#### Projeto novo (do zero)

```
/up:novo-projeto
```

O UP vai:
1. Perguntar "O que voce quer construir?"
2. Fazer perguntas de acompanhamento para entender o projeto
3. Opcionalmente pesquisar o ecossistema do dominio (stack, features, armadilhas)
4. Definir requisitos interativamente, agrupados por categoria
5. Gerar ROADMAP.md com fases, criterios de sucesso e rastreabilidade
6. Criar PROJECT.md, STATE.md e config.json

Ao final voce tera um `.plano/` completo pronto para o pipeline de fases.

#### Projeto existente (brownfield)

```
/up:mapear-codigo         # Opcional, mas recomendado
/up:novo-projeto          # Detecta brownfield automaticamente
```

Se voce tem codigo no diretorio, o UP detecta e adapta:
- Carrega o mapeamento do codebase (se `/up:mapear-codigo` ja rodou)
- Pergunta "O que voce quer **fazer** com esse codigo?" em vez de "O que voce quer construir?"
- Infere requisitos **validados** do codebase existente (features que ja funcionam)
- Separa seus novos objetivos como requisitos **ativos**
- Pesquisa foca em tecnologias **novas**, nao nas que voce ja usa
- Todo o pipeline downstream (discutir, planejar, executar) recebe contexto do codebase

O `/up:mapear-codigo` produz 7 documentos em `.plano/codebase/`:

| Documento | Conteudo |
|-----------|----------|
| STACK.md | Tecnologias, frameworks, dependencias |
| ARCHITECTURE.md | Design do sistema, fluxo de dados, padroes |
| STRUCTURE.md | Organizacao de diretorios e arquivos |
| CONVENTIONS.md | Estilo de codigo, nomeacao, padroes de erro |
| INTEGRATIONS.md | APIs externas, banco de dados, autenticacao |
| TESTING.md | Infraestrutura de testes, cobertura |
| CONCERNS.md | Divida tecnica, areas frageis, seguranca |

Esses documentos alimentam automaticamente o restante do pipeline.

#### Reinicializando um projeto

Se voce ja tem um `.plano/PROJECT.md` e roda `/up:novo-projeto` novamente, o UP oferece:
- **Revisar e atualizar** — Atualizar com novos objetivos
- **Recomecar do zero** — Recriar tudo
- **Cancelar** — Manter como esta

### 2. O pipeline de fases

Cada fase do roadmap passa por um pipeline de 4 etapas. Voce controla o ritmo — cada etapa e um comando separado.

#### Etapa 1: Discutir (`/up:discutir-fase N`)

```
/up:discutir-fase 1
```

O UP analisa a fase e identifica **areas cinzentas** — ambiguidades que mudariam a implementacao. Voce escolhe quais discutir.

- Perguntas sao adaptadas ao que ja foi decidido em fases anteriores
- Se o projeto e brownfield, carrega ARCHITECTURE.md e CONVENTIONS.md para perguntas informadas
- Ideias fora do escopo sao anotadas como "adiadas", nao perdidas
- Resultado: `CONTEXT.md` com decisoes capturadas

**Quando pular:** Se a fase e infraestrutura pura ou a implementacao e obvia, voce pode ir direto para planejar.

#### Etapa 2: Planejar (`/up:planejar-fase N`)

```
/up:planejar-fase 1
```

Spawna o agente **up-planejador** que:
- Le CONTEXT.md, ROADMAP.md, REQUIREMENTS.md e codebase docs
- Faz pesquisa inline se necessario (busca docs, verifica APIs)
- Cria PLAN-001.md, PLAN-002.md, etc. com tarefas especificas
- Auto-verifica: cobertura de requisitos, dependencias, waves de execucao
- Resultado: Planos executaveis prontos

Flags uteis:
- `--pesquisar` — Forcar pesquisa profunda antes de planejar
- `--sem-pesquisa` — Pular pesquisa, ir direto
- `--gaps` — Replanejar a partir de lacunas do verificar-trabalho

#### Etapa 3: Executar (`/up:executar-fase N`)

```
/up:executar-fase 1
```

Spawna agentes **up-executor** que:
- Executam planos organizados em **waves** (planos independentes rodam em paralelo)
- Cada plano produz commits atomicos com mensagens descritivas
- Resultado: Codigo implementado e commitado, SUMMARY.md criado

#### Etapa 4: Verificar (`/up:verificar-trabalho N`)

```
/up:verificar-trabalho 1
```

Verificacao goal-backward (parte do resultado desejado e volta):
- Testa se os criterios de sucesso da fase foram atingidos
- Se encontra gaps: gera VERIFICATION.md com detalhes
- Resultado: Fase aprovada ou lista de gaps para corrigir

#### Ciclo de correcao de gaps

Se a verificacao encontrou problemas:

```
/up:planejar-fase 1 --gaps     # Cria planos de correcao baseados no VERIFICATION.md
/up:executar-fase 1 --gaps-only # Executa apenas os planos de correcao
/up:verificar-trabalho 1        # Re-verifica
```

### 3. Gerenciamento do projeto

#### Ver progresso

```
/up:progresso
```

Mostra dashboard com: fase atual, porcentagem de conclusao, bloqueios, e sugere o proximo comando a rodar.

#### Pausar e retomar

```
/up:pausar          # Cria .continue-aqui.md com contexto completo
```

Na proxima sessao (ou apos `/clear`):

```
/up:retomar          # Le .continue-aqui.md e STATE.md, restaura tudo
```

O UP foi desenhado para sobreviver a `/clear`. Todo estado fica em disco no `.plano/`.

#### Adicionar e remover fases

```
/up:adicionar-fase "Implementar sistema de notificacoes"   # Adiciona ao final
/up:remover-fase 5                                          # Remove e renumera
```

Apenas fases futuras (nao iniciadas) podem ser removidas.

### 4. Tarefas rapidas

Para tarefas pequenas que nao justificam uma fase inteira:

```
/up:rapido "Corrigir bug no formulario de login"
/up:rapido "Adicionar favicon"
/up:rapido "Atualizar dependencias"
```

O `/up:rapido` faz o mesmo pipeline simplificado:
- Planeja e executa em um unico fluxo
- Commits atomicos com rastreamento
- Tarefas ficam em `.plano/rapido/TASK-NNN.md`
- Nao afeta ROADMAP.md — e separado das fases

### 5. Depuracao

Para bugs complexos que precisam de investigacao sistematica:

```
/up:depurar "Botao de salvar nao funciona na pagina de perfil"
```

O depurador:
- Coleta sintomas (comportamento esperado, real, erros, reproducao)
- Spawna agente **up-depurador** que investiga com metodo cientifico
- Forma hipoteses falsificaveis, testa uma de cada vez
- Mantém sessao persistente em `.plano/debug/` (sobrevive a `/clear`)
- Ao encontrar a causa raiz, oferece corrigir automaticamente

Sessoes ativas podem ser retomadas:

```
/up:depurar                    # Sem argumento: lista sessoes ativas
```

### 6. Testes

Apos completar uma fase, gerar testes automaticamente:

```
/up:adicionar-testes 1
```

O UP:
- Analisa todos os arquivos modificados pela fase
- Classifica cada um: unitario (TDD), E2E (browser) ou pular
- Apresenta classificacao para aprovacao
- Gera testes seguindo convencoes do projeto
- Reporta: passando, falhando, gaps de cobertura, bugs descobertos

### 7. Configuracao

```
/up:configurar
```

| Opcao | Default | Descricao |
|-------|---------|-----------|
| Modo | solo | `solo` (commits diretos) ou `time` (branches por fase) |
| Paralelizacao | sim | Agentes rodam em paralelo quando independentes |
| Commit Docs | sim | Commitar documentos de planejamento automaticamente |
| Auto-Advance | nao | Encadear estagios automaticamente |

### 8. Modo Builder

Construa um projeto inteiro autonomamente. Voce da o briefing, responde perguntas criticas, e o UP faz tudo sozinho.

```
/up:modo-builder "Sistema financeiro pessoal com Supabase, auth, dashboard de gastos e metas"
/up:modo-builder --light "Adicionar factory de usuarios com roles"
```

**Dois niveis:**
- **Full (padrao):** Pipeline completo — pesquisa, polish, UX review, delivery
- **Light (`--light`):** Pipeline enxuto — planeja, constroi, testa. ~50% menos tokens.

O builder full passa por **5 estagios** automaticamente:

1. **Intake** — Analisa briefing, pergunta so o critico (credenciais, APIs). Dashboard inicia em http://localhost:4040.
2. **Arquitetura** — Pipeline de 3 agentes especializados + validacao:
   - **Product Analyst** — Pesquisa concorrentes reais, define personas, lista features obrigatorias do mercado
   - **System Designer** — Define modulos, roles, permissoes, schema de banco, rotas. Aplica 10 blueprints de producao + requisitos universais (70+ checks)
   - **Architect** — Gera PROJECT.md, REQUIREMENTS.md (50-100 requisitos, 5 camadas), ROADMAP.md
   - **Requirements Validator** — 13 checks automaticos. Se score < 75%: arquiteto refaz antes do build
3. **Build** — Para cada fase com ciclo RARV (Reason → Act → Reflect → Verify):
   - **Planejar** (Reason) — planejador cria planos executaveis
   - **Executar** (Act) — executores especialistas (frontend/backend/database) com verificacao funcional por task (curl endpoints, Playwright em paginas). Cria dados de teste automaticamente.
   - **Reflect** — Code Reviewer revisa contra production-requirements ANTES da verificacao
   - **Verificar** (Verify) — verificador + teste E2E com Playwright
   - **Regra 5** — Auto-corrige desalinhamento frontend↔backend (URL, payload, response shape)
4. **Quality Gate Loop** — Score composto de 7 dimensoes (funcionalidade, blind validation, E2E, UX, responsividade, codigo, completude). Inclui:
   - **Blind Validator** — testa como usuario final SEM ler codigo (20% do score)
   - Melhorias de codigo (3 auditores)
   - UX Tester (navegacao real, 6 dimensoes)
   - Mobile First (responsividade sem quebrar desktop)
   - Security Review (OWASP Top 10)
   - QA Agent (testes automatizados)
   - DevOps (Dockerfile, CI/CD, .env.example, seed data)
   - Technical Writer (README, API docs, CHANGELOG)
   - Corrige e re-avalia ate score >= 9.0/10 (max 5 ciclos)
5. **Entrega** — DELIVERY.md com quality score, metricas, screenshots, testes pendentes de credenciais

**Funciona em dois modos (deteccao automatica):**
- **Greenfield** (sem codigo): cria tudo do zero
- **Brownfield** (codigo existente): mapeia codebase, adiciona fases ao roadmap existente

**Features do builder:**
- **28 agentes especializados** trabalhando em pipeline
- **Verificacao funcional por task** — cada task e testada em runtime (curl/Playwright) antes de commitar
- **Crash recovery** — LOCK.md permite retomar de onde parou
- **Reassessment** — re-avalia roadmap apos cada fase
- **Capture de insights** — agentes salvam descobertas para triagem no final
- **Dados de teste automaticos** — cria usuarios e seed data no banco
- **Dashboard** — acompanhe em tempo real em http://localhost:4040

**Modo Light (`--light`):**
- Pula pesquisa, polish, UX tester, ideias, delivery, reassessment, captures
- Mantém: planejar, executar, verificar, teste E2E com Playwright
- Mini-scan do codebase (inline, sem agentes mapeadores)
- Estrutura inline (sem agente arquiteto)
- Ideal para features medias em projetos existentes

**Defaults personalizaveis:**

Crie `~/.claude/up/builder-defaults.md` com suas preferencias de stack, design e padroes. O builder usa como base para decisoes nao especificadas no briefing.

### 9. UX Tester

Navega o sistema como usuario real, avalia a experiencia e implementa melhorias automaticamente.

```
/up:ux-tester               # Navegar, avaliar e implementar melhorias
/up:ux-tester --no-fix      # Apenas relatorio, sem implementar
/up:ux-tester 3000          # Especificar porta
```

O UX tester abre o browser via Playwright e:
1. Define **3 personas** (usuario novo, frequente, apressado/mobile)
2. Navega cada fluxo como cada persona
3. Avalia **6 dimensoes**: clareza, eficiencia, feedback, consistencia, acessibilidade, performance
4. Gera relatorio com score por dimensao e issues priorizadas
5. **Implementa melhorias automaticamente** — desde ajustes de texto ate componentes novos e reestruturacao de fluxo
6. Verifica cada mudanca via Playwright e reverte se quebrar

**Funciona standalone** em qualquer projeto, sem precisar de `/up:novo-projeto`. Tambem roda automaticamente dentro do modo builder.

### 10. Mobile First

Detecta o que quebra no mobile/tablet e corrige automaticamente sem mexer no desktop.

```
/up:mobile-first                          # Escanear e corrigir tudo
/up:mobile-first --no-fix                 # Apenas relatorio
/up:mobile-first --page /dashboard        # Apenas uma pagina
```

O agente:
1. Abre cada pagina em **7 viewports** (de iPhone SE a monitor full HD)
2. Detecta problemas: overflow, texto ilegivel, alvos de toque pequenos, grid quebrado, imagens distorcidas, navegacao que nao cabe
3. Corrige com classes Tailwind responsivas, media queries ou componentes novos (hamburger, drawer)
4. **Verifica desktop apos cada correcao** — se desktop mudou, reverte e tenta outra abordagem
5. Gera relatorio com score de responsividade e screenshots comparativos

**Funciona standalone** em qualquer projeto. Tambem roda automaticamente dentro do modo builder (Estagio 4).

### 11. Clone Builder

Clonar um app existente via Playwright — analisa, extrai PRD e recria com sua stack.

```
/up:clone-builder https://app.exemplo.com               # Clonar exatamente
/up:clone-builder https://app.exemplo.com --improve      # Clonar e melhorar
/up:clone-builder https://app.exemplo.com --inspiration  # Usar como referencia
```

O clone-builder:
1. **Crawl** — Playwright navega todas paginas, screenshots, intercepta APIs, extrai forms
2. **Design Extractor** — extrai cores, fontes, espacamento, componentes, layout
3. **Feature Mapper** — mapeia modulos, features, roles, data model, fluxos
4. **PRD Writer** — sintetiza em PRD completo e detalhado
5. **Modo Builder** — recria com sua stack (o builder sabe que e clone e segue design/features do original)
6. **Clone Verifier** — verifica fidelidade funcional + visual contra o original

**3 modos:**
- `--exact`: reproduzir o mais fiel possivel (default)
- `--improve`: reproduzir + aplicar blueprints + melhorias
- `--inspiration`: usar como referencia, builder tem liberdade

### 12. Dashboard

Monitorar o builder em tempo real no browser:

```
/up:dashboard           # Abre em http://localhost:4040
/up:dashboard 8080      # Porta customizada
```

Mostra: progresso, fases, status atual, commits, reports gerados. Atualiza a cada 3 segundos. Servidor leve (Node.js puro, zero deps).

### 12. Manutencao

```
/up:saude              # Diagnostica integridade do .plano/
/up:saude --reparar    # Corrige problemas automaticamente
/up:atualizar          # Verifica e instala atualizacoes do UP
```

---

## Referencia Rapida

### Comandos

| Comando | Descricao |
|---------|-----------|
| `/up:modo-builder` | Construir projeto completo autonomamente (greenfield ou brownfield) |
| `/up:ux-tester` | Navegar sistema como usuario real, avaliar UX e implementar melhorias |
| `/up:mobile-first` | Tornar sistema responsivo para mobile/tablet sem quebrar desktop |
| `/up:clone-builder` | Clonar app existente via Playwright e recriar com sua stack |
| `/up:dashboard` | Dashboard visual de monitoramento do builder em tempo real |
| `/up:novo-projeto` | Inicializar projeto (detecta greenfield/brownfield) |
| `/up:mapear-codigo` | Analisar codebase existente com agentes paralelos |
| `/up:retomar` | Restaurar contexto da sessao anterior |
| `/up:discutir-fase N` | Coletar contexto por questionamento estruturado |
| `/up:planejar-fase N` | Criar planos executaveis com pesquisa e self-check |
| `/up:executar-fase N` | Executar planos com paralelizacao por ondas |
| `/up:verificar-trabalho N` | Validar features via UAT conversacional |
| `/up:progresso` | Dashboard de status e proxima acao |
| `/up:pausar` | Criar arquivo de handoff `.continue-aqui.md` |
| `/up:adicionar-fase "desc"` | Adicionar fase ao final do roadmap |
| `/up:remover-fase N` | Remover fase futura e renumerar |
| `/up:adicionar-testes N` | Gerar testes para fase completa |
| `/up:rapido "tarefa"` | Tarefa rapida com commits atomicos |
| `/up:depurar` | Depuracao sistematica com metodo cientifico |
| `/up:configurar` | Configurar opcoes do workflow |
| `/up:atualizar` | Verificar e instalar atualizacoes |
| `/up:saude` | Diagnosticar integridade do `.plano/` |
| `/up:ajuda` | Referencia completa de comandos |

### Flags

```
# modo-builder
--light           Pipeline enxuto (~50% menos tokens). Planeja, constroi, testa.

# planejar-fase
--pesquisar       Forcar re-pesquisa mesmo com RESEARCH.md existente
--sem-pesquisa    Pular pesquisa, ir direto ao planejamento
--auto            Auto-detectar proxima fase nao planejada
--gaps            Modo fechamento de gaps (le VERIFICATION.md)

# executar-fase
--gaps-only       Executar apenas planos de fechamento de gaps

# ux-tester
--no-fix          Apenas relatorio, nao implementar melhorias

# mobile-first
--no-fix          Apenas relatorio, nao corrigir
--page /rota      Testar apenas uma pagina especifica
```

### Pipelines

**Manual (fase a fase):**
```
/up:novo-projeto → /up:discutir-fase N → /up:planejar-fase N → /up:executar-fase N → /up:verificar-trabalho N
                                                                                              │
                                                                                       Gaps? ─┤
                                                                                       Sim  → /up:planejar-fase N --gaps
                                                                                       Nao  → Proxima fase
```

**Modo Builder (totalmente autonomo):**
```
/up:modo-builder "briefing" → Perguntas criticas → Pesquisa/Mapeamento → Arquitetura
    → [Loop: Planejar → Executar → Verificar → E2E → Reassessment] por fase
    → Melhorias (codigo) → UX Tester (navegacao) → Ideias → DELIVERY.md
```

## Estrutura do `.plano/`

```
.plano/
├── PROJECT.md              # O que e o projeto, requisitos, decisoes
├── ROADMAP.md              # Todas as fases com status
├── STATE.md                # Posicao atual, progresso, continuidade
├── config.json             # Configuracoes do workflow
├── codebase/               # Mapeamento do codebase (brownfield)
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── CONCERNS.md
│   └── ...
├── fases/
│   ├── 01-autenticacao/
│   │   ├── CONTEXT.md      # Contexto coletado na discussao
│   │   ├── RESEARCH.md     # Pesquisa de dominio/tecnologia
│   │   ├── PLAN-001.md     # Plano executavel
│   │   ├── SUMMARY-001.md  # Resultado da execucao
│   │   └── VERIFICATION.md # Resultado do UAT
│   └── ...
├── rapido/
│   └── TASK-001.md         # Tarefa rapida executada
├── debug/
│   ├── bug-login.md        # Sessao de debug ativa
│   └── resolved/           # Sessoes resolvidas
├── melhorias/              # Auditoria de codigo (UX, performance, modernidade)
│   └── RELATORIO.md
├── ideias/                 # Sugestoes de features com ICE scoring
│   └── RELATORIO.md
├── ux-review/              # UX tester (navegacao real via Playwright)
│   ├── UX-REPORT.md
│   └── screenshots/
├── e2e/                    # Testes E2E finais (modo builder)
│   ├── E2E-REPORT.md
│   ├── smoke/
│   └── responsive/
├── captures/               # Insights capturados durante build
│   └── TRIAGE.md
├── LOCK.md                 # Crash recovery (modo builder)
├── BRIEFING.md             # Briefing do usuario (modo builder)
└── DELIVERY.md             # Relatorio de entrega (modo builder)
```

Todos esses arquivos sao texto puro (Markdown/JSON) e podem ser commitados no repositorio.

## Agentes

O UP usa 28 agentes especializados organizados por funcao:

**Arquitetura (planejamento):**

| Agente | Funcao |
|--------|--------|
| **up-product-analyst** | Pesquisa concorrentes, define personas, lista features do mercado |
| **up-system-designer** | Define modulos, roles, schema, permissoes, aplica 10 blueprints |
| **up-arquiteto** | Transforma analise + design em documentos executaveis |
| **up-requirements-validator** | 13 checks automaticos nos requisitos antes do build |

**Execucao (build):**

| Agente | Funcao |
|--------|--------|
| **up-frontend-specialist** | Componentes com todos estados de UI, responsivo, a11y |
| **up-backend-specialist** | API design, validacao, auth, rate limiting, paginacao |
| **up-database-specialist** | Schema, migrations, RLS, indices, seed data, soft delete |
| **up-executor** | Executor generico (quando plano e misto) |
| **up-planejador** | Cria planos executaveis com pesquisa inline |

**Qualidade (review + test):**

| Agente | Funcao |
|--------|--------|
| **up-code-reviewer** | Reflect step: revisa contra production-requirements |
| **up-blind-validator** | Testa como usuario final SEM ler codigo |
| **up-security-reviewer** | OWASP Top 10, auth bypass, injection, secrets |
| **up-qa-agent** | Escreve e roda testes, identifica gaps de cobertura |
| **up-verificador** | Verificacao goal-backward de trabalho completado |

**Producao (finalizacao):**

| Agente | Funcao |
|--------|--------|
| **up-devops-agent** | Dockerfile, CI/CD, .env.example, seed data |
| **up-technical-writer** | README, API docs, CHANGELOG, setup guide |

**Pipeline e suporte:**

| Agente | Funcao |
|--------|--------|
| **up-pesquisador-projeto** | Pesquisa de dominio e tecnologia |
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
