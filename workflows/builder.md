<purpose>
Modo Builder: construir projeto completo de forma autonoma. Funciona em dois modos:

**Greenfield:** Projeto do zero. Usuario descreve o que quer, sistema cria tudo.
**Brownfield:** Projeto existente. Usuario descreve a feature/mudanca, sistema mapeia o codigo, planeja e implementa.

**Dois niveis:**
- **Full (padrao):** 5 estagios completos — Intake → Arquitetura → Build → Polish → Entrega
- **Light (`--light`):** Pipeline enxuto — Intake rapido → Mini-scan → Build + E2E → Fim

A partir do Estagio 2, ZERO interacao com usuario. Todas as decisoes sao tomadas autonomamente.

**IMPORTANTE: Verificar flag `--light` no $ARGUMENTS antes de iniciar.**
Se `--light` presente LITERALMENTE nos argumentos: pular direto para `<light_process>`.
Se ausente: seguir o `<process>` normal (full).

**GUARD CONTRA ATIVACAO ACIDENTAL DO LIGHT:**
- O modo light so e ativado se o usuario escreveu `--light` explicitamente.
- NAO inferir light baseado no tamanho do briefing ou complexidade.
- NAO ativar light porque "parece uma feature simples".
- Briefing curto = modo FULL com poucas fases, NAO modo light.
- Se em duvida: FULL. Sempre FULL como default.

**LOG OBRIGATORIO no inicio (EXECUTAR SEMPRE):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > MODO BUILDER — {FULL | LIGHT}
 Versao: $(cat $HOME/.claude/up/VERSION 2>/dev/null || echo "dev")
 Argumentos: $ARGUMENTS
 Flag --light: {SIM | NAO}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</purpose>

<core_principle>
Este workflow REUTILIZA os processos existentes do UP. Nao reinventa — apenas orquestra os comandos existentes em sequencia sem parar para perguntar.

Onde o UP normal para e pergunta, o modo builder decide sozinho.
Onde o UP normal espera /clear entre fases, o modo builder continua automaticamente.

**Deteccao automatica de modo:**
- Codigo existente detectado (package.json, src/, app/, etc.) → BROWNFIELD
- Sem codigo → GREENFIELD
- `.plano/` existente com ROADMAP.md → BROWNFIELD (adiciona fases ao roadmap existente)

**Modo Clone (builder_type: "clone" no config.json):**
Quando o builder e invocado pelo clone-builder, config.json tem `builder_type: "clone"`.
Neste modo, TODOS os agentes devem:
1. **Ler .plano/clone/DESIGN-SYSTEM.md** e seguir cores, fontes, espacamento
2. **Ler .plano/clone/FEATURE-MAP.md** e garantir que TODAS features CLONE-* sao implementadas
3. **Ler .plano/clone/screenshots/** como referencia visual
4. **Product Analyst:** Se clone_mode=exact: NAO sugerir mudancas. Se improve: sugerir apenas adicoes.
5. **Frontend Specialist:** Replicar layout e design das screenshots.
6. **Code Reviewer:** Verificar fidelidade visual alem de production-requirements.
7. **Quality Gate:** Incluir clone-verifier como dimensao "Fidelidade" (20% do score).
</core_principle>

<model_routing>
## Roteamento de Modelos por Papel

**REGRA OBRIGATORIA:** Ao spawnar QUALQUER agente via Task() ou Agent(), incluir o parametro `model` baseado nesta tabela. Usar os valores de $MODEL_* extraidos do builder-defaults.md (Estagio 1.1).

| Papel | Variavel | Agentes | Default |
|-------|----------|---------|---------|
| **Planning** | $MODEL_PLANNING | up-arquiteto, up-product-analyst, up-system-designer, up-planejador, up-roteirista | opus |
| **Execution** | $MODEL_EXECUTION | up-executor, up-frontend-specialist, up-backend-specialist, up-database-specialist | sonnet |
| **Verification** | $MODEL_VERIFICATION | up-verificador, up-code-reviewer, up-blind-validator, up-requirements-validator | opus |
| **Detection** | $MODEL_DETECTION | up-visual-critic, up-exhaustive-tester, up-api-tester | sonnet |
| **Research** | $MODEL_RESEARCH | up-pesquisador-projeto, up-pesquisador-mercado, up-mapeador-codigo, up-sintetizador | sonnet |
| **Quality** | $MODEL_QUALITY | up-qa-agent, up-security-reviewer, up-auditor-ux, up-auditor-performance, up-auditor-modernidade, up-sintetizador-melhorias, up-consolidador-ideias, up-devops-agent, up-technical-writer | opus |

**Exemplo de aplicacao:**
```python
# ANTES (sem model routing):
Task(subagent_type="up-executor", prompt="...")

# DEPOIS (com model routing):
Task(subagent_type="up-executor", model="$MODEL_EXECUTION", prompt="...")

# Equivale a (com defaults):
Task(subagent_type="up-executor", model="sonnet", prompt="...")
```

**Ao spawnar qualquer agente, SEMPRE:**
1. Identificar o papel do agente na tabela acima
2. Usar a variavel $MODEL_* correspondente como parametro model
3. Se a variavel nao foi definida (sem builder-defaults), usar o default da tabela
</model_routing>

<governance>
## Camada de Governanca (v0.5.0+)

**O builder usa hierarquia corporativa de agentes:**

```
CEO (up-project-ceo) — conduz intake, aprova delivery, canal com dono
  ↓
CHIEFS (5) — revisam consolidado de cada area
  ↓
SUPERVISORS (8) — revisam cada agente operacional
  ↓
OPERATIONAL AGENTS (36) — fazem o trabalho
```

**Referencia obrigatoria:** `@~/.claude/up/workflows/governance.md`

**Regras gerais:**
1. Todo output de agente operacional passa por supervisor
2. Toda area tem chief que consolida
3. CEO aprova delivery final
4. Max 3 ciclos de rework (operacional ← supervisor)
5. Max 2 ciclos (supervisor ← chief)
6. Max 1 ciclo (chief ← CEO)

**Pre-requisito:**
```bash
# Verificar owner-profile
if [ ! -f ~/.claude/up/owner-profile.md ]; then
  echo "Owner profile nao existe. Rodando /up:onboard primeiro..."
  # Delegar pro onboarding workflow
  # Referencia: @~/.claude/up/workflows/onboarding.md
fi
```

**Sem owner-profile, o CEO nao sabe quem e o dono — impossivel conduzir intake.**
</governance>

<process>

## Estagio 1: INTAKE (Interativo)

Este e o UNICO estagio com interacao.

### 1.0 Verificar Crash Recovery (LOCK.md)

**PRIMEIRO PASSO OBRIGATORIO — antes de qualquer outra coisa:**

```bash
ls .plano/LOCK.md 2>/dev/null
```

**Se LOCK.md existe e `status: running`:**

Ler frontmatter do LOCK.md para extrair: `stage`, `phase`, `step`, `total_phases`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILDER — SESSAO ANTERIOR DETECTADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sessao anterior crashou ou foi interrompida.

Estagio: {stage}
Fase: {phase}/{total_phases}
Ultimo passo: {step}

Retomando de onde parou...
```

**Retomar baseado no estado do LOCK:**

| stage | step | Retomar de |
|-------|------|-----------|
| `build` | `planning` | Estagio 3: re-planejar fase {phase} |
| `build` | `executing` | Estagio 3: re-executar fase {phase} (pula planos com SUMMARY) |
| `build` | `verifying` | Estagio 3: re-verificar fase {phase} |
| `build` | `e2e-testing` | Estagio 3: re-testar E2E fase {phase} |
| `build` | `reassessing` | Estagio 3: pular reassessment, avancar para fase {phase+1} |
| `build` | `completed` | Estagio 3: avancar para fase {phase+1} |
| `polish` | qualquer | Estagio 4: re-executar polish |
| `delivery` | qualquer | Estagio 5: re-gerar DELIVERY.md |

**Pular direto para o estagio/fase correto.** NAO re-executar estagios ja completos.
NAO fazer intake novamente. Ler BRIEFING.md e PROJECT.md para contexto.

**Se LOCK.md existe e `status: completed`:**
Deletar LOCK.md e iniciar normalmente (sessao anterior terminou com sucesso).

**Se LOCK.md NAO existe:**
Continuar normalmente para 1.05.

### 1.05 Verificar Owner Profile (GATE OBRIGATORIO)

```bash
if [ ! -f ~/.claude/up/owner-profile.md ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  UP > PRIMEIRO USO DETECTADO"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  Voce nunca usou o UP antes. Antes de comecar o builder,"
  echo "  preciso te conhecer."
  echo ""
  echo "  Rodando /up:onboard primeiro..."
  echo ""
fi
```

Se owner-profile nao existe:
1. Delegar para o workflow de onboarding (`@~/.claude/up/workflows/onboarding.md`)
2. Apos completar onboarding, voltar para o builder

### 1.1 Carregar Defaults e Detectar Modo

```bash
DEFAULTS_PATH="$HOME/.claude/up/builder-defaults.md"
```

Ler `$DEFAULTS_PATH` se existir. Se nao existir, informar: "Sem builder-defaults.md. Usando inferencia inteligente para decisoes nao especificadas. Crie ~/.claude/up/builder-defaults.md para personalizar."

**Extrair configuracao de modelos:**

Se builder-defaults.md existe, procurar secao "## Modelos por Papel" e extrair mapeamento:
```
$MODEL_PLANNING = modelo para planning (default: opus)
$MODEL_EXECUTION = modelo para execution (default: sonnet)
$MODEL_VERIFICATION = modelo para verification (default: opus)
$MODEL_DETECTION = modelo para detection (default: sonnet)
$MODEL_RESEARCH = modelo para research (default: sonnet)
$MODEL_QUALITY = modelo para quality (default: opus)
```

Se secao nao existe: usar defaults acima (opus planeja, sonnet executa, opus verifica).

**IMPORTANTE — Sonnet-ready planning:**
Se `$MODEL_EXECUTION = sonnet`, setar flag `$SONNET_EXECUTION = true`.
Isso ativa nivel extra de detalhe nos planos (ver planejador Sonnet-ready mode).

**Detectar modo automaticamente:**

```bash
# Verificar se ha codigo existente
ls package.json go.mod Cargo.toml requirements.txt pyproject.toml pom.xml build.gradle composer.json Gemfile 2>/dev/null
ls -d src/ app/ lib/ cmd/ internal/ pages/ components/ 2>/dev/null | head -10
ls .plano/ROADMAP.md .plano/PROJECT.md 2>/dev/null
```

| Resultado | Modo |
|-----------|------|
| Sem manifesto de pacote e sem src/ | **GREENFIELD** |
| Manifesto ou diretorios de codigo existem | **BROWNFIELD** |
| `.plano/ROADMAP.md` existe | **BROWNFIELD** (projeto UP existente) |

Definir `$MODE` = `greenfield` ou `brownfield`.

### 1.2 Delegar Intake ao CEO

**NOVO (v0.5.0):** O intake agora e conduzido pelo CEO (up-project-ceo).

Spawnar CEO com contexto:

```python
Agent(
  subagent_type="up-project-ceo",
  model="opus",
  prompt=f"""
    Conduza intake para novo projeto UP.
    
    Modo detectado: {MODE}
    Briefing inicial: {ARGUMENTS ou "vazio, pedir ao dono"}
    
    <files_to_read>
    - ~/.claude/up/owner-profile.md (OBRIGATORIO — seu perfil do dono)
    - $HOME/.claude/up/workflows/ceo-intake.md (seu workflow de intake)
    - $HOME/.claude/up/workflows/onboarding.md (caso owner-profile nao exista)
    </files_to_read>
    
    Executar workflow de intake ate completar:
    1. Conduzir 5 blocos de intake (briefing, design, credenciais, referencias, restricoes)
    2. Gerar .plano/BRIEFING.md, .plano/OWNER.md, .plano/PENDING.md, .plano/DESIGN-TOKENS.md
    3. Apresentar resumo ao dono antes de iniciar
    
    Retornar apos intake com: briefing consolidado, modo confirmado, credenciais coletadas, pendencias.
  """
)
```

**Receber retorno do CEO:**
- BRIEFING completo
- OWNER.md criado
- PENDING.md criado
- DESIGN-TOKENS.md criado (custom ou defaults)

**Se CEO rejeitou briefing:** usuario ja foi alertado, retornar e esperar nova tentativa.

**Se CEO aprovou:** continuar para 1.3.

### 1.3 Analisar e Classificar Gaps

Analisar o briefing e classificar informacoes faltantes:

**CRITICO (deve perguntar):**
- Integrações externas que precisam de credenciais (Supabase, Stripe, etc.)
- Tokens/chaves de API necessarias
- Ambiguidades de negocio que afetam arquitetura fundamentalmente
  - Ex: "sistema multiusuario" → precisa de roles? multi-tenant?
  - Ex: "pagamentos" → qual gateway? quais metodos?

**BROWNFIELD EXTRA — CRITICO:**
- Se a feature pode impactar funcionalidades existentes de forma ambigua
  - Ex: "refatorar auth" → manter backward compatibility? migrar usuarios?
- Se ha integrações existentes que podem ser afetadas

**DECIDIR SOZINHO (nao perguntar):**
- Stack (usar defaults ou inferir; em brownfield: usar stack EXISTENTE)
- Design visual, cores, fontes (em brownfield: seguir design system existente)
- Estrutura de pastas, padroes de codigo (em brownfield: seguir convencoes existentes)
- Nomes de tabelas, modelos, rotas, componentes
- Arquitetura de API (em brownfield: seguir padrao existente)
- Quantidade e granularidade de fases
- Tudo que nao e ambiguo

### 1.4 Fazer Perguntas Criticas

Se ha gaps criticos, fazer UMA UNICA rodada de perguntas usando AskUserQuestion:

```
AskUserQuestion(
  header: "Informacoes Necessarias",
  question: "[Listar todos os gaps criticos em uma unica pergunta]

  1. [Pergunta critica 1]
  2. [Pergunta critica 2]
  ...

  Responda todas de uma vez.",
  followUp: null
)
```

**Se NAO ha gaps criticos:** Pular direto para 1.5.

### 1.5 Confirmar e Iniciar

**GREENFIELD:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > MODO BUILDER (GREENFIELD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Entendi o projeto. A partir de agora, vou construir tudo autonomamente.

**Briefing:** [resumo em 2-3 frases]
**Stack:** [stack que sera usada]
**Estimativa:** [N] fases

Decisoes nao especificadas serao tomadas automaticamente.

Iniciando...
```

**BROWNFIELD:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > MODO BUILDER (BROWNFIELD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Entendi a feature. Vou mapear o codigo existente e implementar autonomamente.

**Feature:** [resumo em 2-3 frases]
**Stack detectada:** [stack existente]
**Estimativa:** [N] fases

Convencoes e padroes existentes serao respeitados.

Iniciando mapeamento do codebase...
```

**NAO pedir confirmacao.** Iniciar direto.

═══════════════════════════════════════════════════════
 FIM DA INTERACAO COM USUARIO
═══════════════════════════════════════════════════════

---

## Estagio 2: ARQUITETURA (Autonomo)

### 2.0 GATE OBRIGATORIO — Inicializar .plano/

**ESTE PASSO E OBRIGATORIO E NAO PODE SER PULADO.**
**EXECUTAR ESTES COMANDOS LITERALMENTE — NAO APENAS LER.**

```bash
# GATE 1: Criar .plano/ se nao existe
mkdir -p .plano .plano/captures .plano/fases .plano/issues-carryover

# GATE 2: Verificar que foi criado
ls -d .plano/ || { echo "ERRO CRITICO: .plano/ nao foi criado"; exit 1; }

# GATE 3: Registrar inicio do builder
echo "builder_started: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > .plano/LOCK.md
echo "mode: ${MODE}" >> .plano/LOCK.md
echo "stage: architecture" >> .plano/LOCK.md
echo "status: running" >> .plano/LOCK.md

# GATE 4: Init git se necessario
git init 2>/dev/null
```

**VERIFICACAO — EXECUTAR OBRIGATORIAMENTE:**
```bash
[ -d ".plano" ] && echo "GATE OK: .plano/ existe" || echo "GATE FALHOU: .plano/ nao existe — PARAR"
```

**Se GATE FALHOU:** NAO continuar. Algo esta errado com permissoes ou disco. Informar usuario.

### 2.1 Inicializar Projeto (Continuacao)

**Iniciar Dashboard automaticamente:**
```bash
node "$HOME/.claude/up/dashboard/server.js" 4040 "$(pwd)/.plano" &
DASH_PID=$!
echo "Dashboard: http://localhost:4040 (PID: $DASH_PID)"
```

Informar ao usuario:
```
Dashboard: http://localhost:4040 — acompanhe o progresso em tempo real
```

### 2.2 Pipeline de Arquitetura (3 Agentes em Sequencia)

**Pipeline:** Product Analyst → System Designer → Architect
Cada agente produz um documento que alimenta o proximo.

**O que acontece ANTES do pipeline depende do modo:**

#### MODO GREENFIELD — Pesquisa de Ecossistema

Spawnar 4 pesquisadores em paralelo (mesmo processo do novo-projeto):

```bash
mkdir -p .plano/pesquisa
```

```
Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Stack para [dominio].
</research_type>

<question>
Qual e a stack padrao de 2025 para [dominio]? Confirme versoes e compatibilidade de: [frameworks do briefing/defaults].
</question>

<briefing>
[Briefing completo do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/STACK.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa Stack")

Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Features para [dominio].
</research_type>

<question>
Quais features produtos de [dominio] tem? O que e obrigatorio vs diferenciador?
</question>

<briefing>
[Briefing completo do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/FEATURES.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa Features")

Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Arquitetura para [dominio].
</research_type>

<question>
Como sistemas de [dominio] sao tipicamente estruturados? Componentes principais e padroes?
</question>

<briefing>
[Briefing completo do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/ARCHITECTURE.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa Arquitetura")

Task(prompt="<research_type>
Pesquisa de Projeto -- Dimensao Armadilhas para [dominio].
</research_type>

<question>
O que projetos de [dominio] comumente erram? Erros criticos a evitar?
</question>

<briefing>
[Briefing completo do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/PITFALLS.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisa Armadilhas")
```

**IMPORTANTE:** Os 4 Task DEVEM ser spawnados na MESMA mensagem para execucao paralela.

Apos os 4 retornarem, spawnar sintetizador:

```
Task(prompt="
<task>
Sintetizar outputs de pesquisa em SUMMARY.md.
</task>

<files_to_read>
- .plano/pesquisa/STACK.md
- .plano/pesquisa/FEATURES.md
- .plano/pesquisa/ARCHITECTURE.md
- .plano/pesquisa/PITFALLS.md
</files_to_read>

<output>
Write to: .plano/pesquisa/SUMMARY.md
Commit apos escrever.
</output>
", subagent_type="up-sintetizador", description="Sintetizar pesquisa")
```

#### MODO BROWNFIELD — Mapeamento do Codebase + Pesquisa Focada

**Passo 1: Mapear codebase existente (4 agentes paralelos)**

Verificar se `.plano/codebase/` ja existe:
- Se existe e tem menos de 7 dias: reutilizar (pular mapeamento)
- Se nao existe ou esta desatualizado: mapear

```bash
mkdir -p .plano/codebase
```

```
Task(subagent_type="up-mapeador-codigo", prompt="
<focus>tech</focus>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
Mapear stack de tecnologia e integracoes externas.
Escrever .plano/codebase/STACK.md e .plano/codebase/INTEGRATIONS.md
", description="Mapear stack e integracoes")

Task(subagent_type="up-mapeador-codigo", prompt="
<focus>arch</focus>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
Mapear arquitetura e estrutura de arquivos.
Escrever .plano/codebase/ARCHITECTURE.md e .plano/codebase/STRUCTURE.md
", description="Mapear arquitetura e estrutura")

Task(subagent_type="up-mapeador-codigo", prompt="
<focus>quality</focus>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
Mapear convencoes de codigo e padroes de teste.
Escrever .plano/codebase/CONVENTIONS.md e .plano/codebase/TESTING.md
", description="Mapear convencoes e testes")

Task(subagent_type="up-mapeador-codigo", prompt="
<focus>concerns</focus>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
Identificar divida tecnica e problemas.
Escrever .plano/codebase/CONCERNS.md
", description="Mapear preocupacoes e divida tecnica")
```

**IMPORTANTE:** Os 4 Task DEVEM ser spawnados na MESMA mensagem para execucao paralela.

Verificar que os 7 documentos foram criados:
```bash
ls -la .plano/codebase/*.md | wc -l
```

Commitar mapeamento:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: mapear codebase existente" --files .plano/codebase/
```

**Passo 2: Pesquisa focada (apenas tecnologias NOVAS)**

Se o briefing menciona tecnologias/APIs que NAO existem no codebase atual:

```bash
mkdir -p .plano/pesquisa
```

Spawnar pesquisadores APENAS para tecnologias novas (ex: usuario quer adicionar Stripe mas o projeto nao tem):

```
Task(prompt="<research_type>
Pesquisa de Projeto -- Tecnologia nova para projeto existente.
</research_type>

<question>
[Perguntas focadas APENAS nas tecnologias/padroes NOVOS que serao adicionados]
Stack existente: [de .plano/codebase/STACK.md]
Novo: [tecnologia/API do briefing]
Como integrar o novo com o existente?
</question>

<briefing>
[Briefing do usuario]
</briefing>

<output>
Write to: .plano/pesquisa/NOVAS-TECNOLOGIAS.md
</output>
", subagent_type="up-pesquisador-projeto", description="Pesquisar tecnologias novas")
```

Se NAO ha tecnologias novas: pular pesquisa.

### 2.3 Salvar Briefing

Use a ferramenta Write para criar `.plano/BRIEFING.md` com:
- Modo (greenfield/brownfield)
- Briefing completo do usuario
- Respostas das perguntas criticas (se houve)
- Credenciais/APIs fornecidas
- **BROWNFIELD extra:** resumo do codebase (de .plano/codebase/), o que NAO mudar

### 2.4 Agente 1: Product Analyst

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > ANALISANDO PRODUTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pesquisando concorrentes e features do mercado...
```

```
Task(prompt="
<objective>
Analisar o mercado e produto: pesquisar concorrentes, definir personas, listar features obrigatorias e esperadas, mapear modulos do sistema.
Modo autonomo — NAO pergunte nada.
</objective>

<files_to_read>
- .plano/BRIEFING.md (Briefing do usuario)
- .plano/pesquisa/SUMMARY.md (Pesquisa de ecossistema, se existir)
</files_to_read>

<output>
Escrever .plano/PRODUCT-ANALYSIS.md
Commit apos escrever.
Retornar: ## PRODUCT ANALYSIS COMPLETE
</output>
", subagent_type="up-product-analyst", model="$MODEL_PLANNING", description="Analisar produto e mercado")
```

Verificar retorno `## PRODUCT ANALYSIS COMPLETE`. Se falhou: registrar e continuar (System Designer usara blueprints como fallback).

```
Produto: [N] concorrentes | [X] features obrigatorias | [Y] personas | [Z] modulos
```

### 2.5 Agente 2: System Designer

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > PROJETANDO SISTEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Definindo modulos, roles, schema, rotas e requisitos de producao...
```

```
Task(prompt="
<objective>
Projetar o sistema tecnico completo: modulos, roles, permissoes, schema de banco, rotas, integracoes.
Aplicar blueprints de producao e requisitos universais. Compilar requisitos das 5 camadas.
Modo autonomo — NAO pergunte nada.
</objective>

<mode>{greenfield|brownfield}</mode>

<files_to_read>
- .plano/BRIEFING.md (Briefing e stack)
- .plano/PRODUCT-ANALYSIS.md (Analise de produto — features, personas, modulos)
- .plano/pesquisa/SUMMARY.md (Pesquisa, se existir)
- $HOME/.claude/up/references/production-requirements.md (Requisitos universais)
- $HOME/.claude/up/references/blueprints/ (Blueprints — ler os relevantes ao dominio)
{BROWNFIELD EXTRA:}
- .plano/codebase/STACK.md (Stack existente)
- .plano/codebase/ARCHITECTURE.md (Arquitetura existente)
- .plano/codebase/CONVENTIONS.md (Convencoes a seguir)
- .plano/codebase/STRUCTURE.md (Estrutura existente)
- .plano/codebase/CONCERNS.md (Divida tecnica)
- .plano/codebase/INTEGRATIONS.md (Integracoes existentes)
</files_to_read>

<output>
Escrever .plano/SYSTEM-DESIGN.md
Commit apos escrever.
Retornar: ## SYSTEM DESIGN COMPLETE
</output>
", subagent_type="up-system-designer", model="$MODEL_PLANNING", description="Projetar sistema completo")
```

```
Sistema: [N] modulos | [X] roles | [Y] tabelas | [Z] requisitos compilados (5 camadas)
```

### 2.6 Agente 3: Architect

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > ESTRUTURANDO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gerando PROJECT.md, REQUIREMENTS.md, ROADMAP.md...
```

```
Task(prompt="
<objective>
Transformar analise de produto e design de sistema em documentos executaveis do UP:
PROJECT.md, REQUIREMENTS.md (com TODOS os requisitos das 5 camadas), ROADMAP.md, STATE.md, config.json.
Modo autonomo — NAO pergunte nada.
</objective>

<mode>{greenfield|brownfield}</mode>

<files_to_read>
- .plano/BRIEFING.md (Briefing original)
- .plano/PRODUCT-ANALYSIS.md (Analise de produto — features, personas)
- .plano/SYSTEM-DESIGN.md (Design tecnico — modulos, roles, schema, requisitos compilados)
- $HOME/.claude/up/builder-defaults.md (Defaults do usuario, se existir)
- $HOME/.claude/up/templates/project.md (Template PROJECT.md)
{BROWNFIELD EXTRA:}
- .plano/PROJECT.md (Existente — ATUALIZAR)
- .plano/ROADMAP.md (Existente — ADICIONAR fases)
- .plano/REQUIREMENTS.md (Existente — ADICIONAR requisitos)
- .plano/codebase/CONVENTIONS.md (Convencoes)
- ./CLAUDE.md (Instrucoes do projeto)
</files_to_read>

<critical>
O SYSTEM-DESIGN.md contem requisitos COMPILADOS das 5 camadas (explicitos + blueprints + universais + stack + mercado).
TODOS esses requisitos devem aparecer no REQUIREMENTS.md com REQ-IDs.
TODAS as features devem ter fases no ROADMAP.md.
O resultado deve ser um sistema COMPLETO pronto para producao, nao um MVP basico.
</critical>

<brownfield_rules>
Se brownfield:
1. RESPEITAR stack existente
2. SEGUIR convencoes existentes
3. ATUALIZAR documentos existentes (nao criar do zero)
4. ADICIONAR fases apos as existentes
5. ADICIONAR requisitos continuando numeracao
</brownfield_rules>

<constraints>
- builder_mode=true no config.json
- mode=yolo
- parallelization=true
- Commit todos arquivos ao final
</constraints>
", subagent_type="up-arquiteto", model="$MODEL_PLANNING", description="Estruturar projeto executavel")
```

### 2.7 Validar Requisitos (Quality Gate de Planejamento)

**ANTES de iniciar o build, validar que os requisitos sao completos e testaveis.**

```
Validando requisitos (13 checks)...
```

```
Task(
  subagent_type="up-requirements-validator",
  model="$MODEL_VERIFICATION",
  prompt="
    <objective>
    Validar REQUIREMENTS.md com 13 checks automaticos.
    Calcular score e determinar se esta pronto para build.
    </objective>

    <files_to_read>
    - .plano/REQUIREMENTS.md
    - .plano/PROJECT.md
    </files_to_read>
  ",
  description="Validar requisitos (13 checks)"
)
```

Ler resultado:

**Se score >= 75% (ACCEPTABLE ou melhor):** Prosseguir.
```
Requisitos: {score}% — {GRADE} ({passed}/13 checks)
```

**Se score < 75% (NEEDS_WORK):** Re-spawnar arquiteto com feedback.

```
Requisitos insuficientes ({score}%). Refinando...
```

```
Task(
  subagent_type="up-arquiteto",
  prompt="
    <objective>
    Refinar REQUIREMENTS.md. A validacao encontrou problemas.
    Ler REQUIREMENTS-VALIDATION.md para saber o que falta.
    Adicionar requisitos que faltam SEM remover os existentes.
    </objective>

    <files_to_read>
    - .plano/REQUIREMENTS-VALIDATION.md (feedback do validador)
    - .plano/REQUIREMENTS.md (requisitos atuais)
    - .plano/PROJECT.md
    - .plano/SYSTEM-DESIGN.md
    </files_to_read>
  ",
  description="Refinar requisitos apos validacao"
)
```

Re-validar (max 2 ciclos). Se apos 2 ciclos ainda < 75%: prosseguir com advertencia.

### 2.8 Reportar Arquitetura

Ler ROADMAP.md e exibir resumo:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > ARQUITETURA DEFINIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Nome do Projeto]**

[N] fases | [X] requisitos (5 camadas) | [Y] modulos | [Z] roles
Stack: [resumo]

Pipeline: Product Analyst → System Designer → Architect

| # | Fase | Objetivo |
|---|------|----------|
| 1 | [Nome] | [Objetivo] |
| 2 | [Nome] | [Objetivo] |
...

Iniciando build...
```

---

### 2.9 Injetar persistência no CLAUDE.md do projeto

Verificar se `./CLAUDE.md` existe. Se existir, verificar se já contém "UP: Persistência de Estado". Se não contém, adicionar ao final:

```markdown

## UP: Persistência de Estado

Este projeto usa o sistema UP. Se `.plano/STATE.md` existir:
- Ao final de trabalho significativo, salvar estado: `node "$HOME/.claude/up/bin/up-tools.cjs" state save-session --summary "o que foi feito"`
- Se houve decisão importante, adicionar: `--decision "decisão" --phase N`
- Isso garante continuidade entre sessões mesmo sem usar comandos /up:
```

Se `./CLAUDE.md` não existe, criar com o conteúdo acima.

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: adicionar persistência de estado ao CLAUDE.md" --files CLAUDE.md
```

---

## Estagio 3: BUILD (Autonomo — Loop de Fases)

### GATE OBRIGATORIO — Verificar Artefatos do Estagio 2

**ANTES de iniciar o build, verificar que a arquitetura produziu os artefatos obrigatorios.**
**EXECUTAR ESTES COMANDOS LITERALMENTE.**

```bash
echo "=== GATE: Verificando artefatos do Estagio 2 ==="
[ -f ".plano/PROJECT.md" ] && echo "OK: PROJECT.md" || echo "FALTANDO: PROJECT.md"
[ -f ".plano/ROADMAP.md" ] && echo "OK: ROADMAP.md" || echo "FALTANDO: ROADMAP.md"
[ -f ".plano/REQUIREMENTS.md" ] && echo "OK: REQUIREMENTS.md" || echo "FALTANDO: REQUIREMENTS.md"
[ -f ".plano/BRIEFING.md" ] && echo "OK: BRIEFING.md" || echo "FALTANDO: BRIEFING.md"
[ -f ".plano/SYSTEM-DESIGN.md" ] && echo "OK: SYSTEM-DESIGN.md" || echo "FALTANDO: SYSTEM-DESIGN.md"
```

**Se QUALQUER arquivo FALTANDO:**
- NAO continuar para o build
- Identificar qual agente falhou (Product Analyst? System Designer? Architect?)
- Re-executar o agente que falhou
- Repetir gate ate todos existirem

**Se todos OK:** Continuar para 3.0.

### 3.0 Carregar Roadmap e Inicializar Lock

```bash
ROADMAP=$(node "$HOME/.claude/up/bin/up-tools.cjs" roadmap analyze)
```

Extrair lista de fases e total.

**Criar/atualizar LOCK.md (crash recovery):**

Use a ferramenta Write para criar `.plano/LOCK.md`:
```markdown
---
status: running
stage: build
phase: 1
step: planning
total_phases: [N]
started: [timestamp ISO]
updated: [timestamp ISO]
pid: [process info]
---

# Builder Lock

Builder em execucao. Se a sessao morreu, use `/up:modo-builder` novamente para retomar.
O builder detectara este LOCK e continuara de onde parou.
```

**O LOCK.md e atualizado a cada transicao:**
- Antes de planejar: `step: planning, phase: X`
- Antes de executar: `step: executing, phase: X`
- Antes de verificar: `step: verifying, phase: X`
- Antes de E2E: `step: e2e-testing, phase: X`
- Antes de reassessment: `step: reassessing, phase: X`
- Ao completar fase: `step: completed, phase: X`
- Ao entrar no Polish: `stage: polish`
- Ao entrar na Entrega: `stage: delivery`
- Ao finalizar: `status: completed` (e depois deletar o LOCK.md)

**Formato de atualizacao rapida:**
```bash
# Atualizar LOCK via sed (rapido, sem reescrever arquivo inteiro)
sed -i "s/^step: .*/step: executing/" .plano/LOCK.md
sed -i "s/^phase: .*/phase: ${PHASE_NUMBER}/" .plano/LOCK.md
sed -i "s/^updated: .*/updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)/" .plano/LOCK.md
```

### 3.1 Loop Principal

Para cada fase no ROADMAP (da primeira a ultima):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > FASE {X}/{TOTAL}: {Nome}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 3.1.1 Planejar Fase

Spawnar up-planejador com flag de modo builder e modelo de planning:

```
Task(prompt="
<planning_context>
**Fase:** {phase_number}
**Modo:** builder (autonomo -- NAO use AskUserQuestion)
<sonnet_execution>{$SONNET_EXECUTION}</sonnet_execution>

<files_to_read>
- .plano/STATE.md (Estado do Projeto)
- .plano/ROADMAP.md (Roteiro)
- .plano/REQUIREMENTS.md (Requisitos)
- .plano/pesquisa/SUMMARY.md (Pesquisa - se existir)
- .plano/codebase/CONVENTIONS.md (Convencoes - se existir, BROWNFIELD)
- .plano/codebase/CONCERNS.md (Divida tecnica - se existir, BROWNFIELD)
- .plano/codebase/ARCHITECTURE.md (Arquitetura - se existir, BROWNFIELD)
- .plano/codebase/STRUCTURE.md (Estrutura - se existir, BROWNFIELD)
- ./CLAUDE.md (Instrucoes do projeto, se existir)
</files_to_read>

**IDs de requisitos da fase:** {phase_req_ids}
**Instrucoes do projeto:** Ler ./CLAUDE.md se existir

<builder_mode>
Voce esta no modo builder. Regras especiais:
1. NAO use AskUserQuestion em hipotese alguma
2. Se falta CONTEXT.md, planeje usando pesquisa + requisitos
3. Se ha ambiguidade, tome a decisao mais razoavel e documente no plano
4. Se precisa de informacao que normalmente perguntaria, infira e registre como decisao
5. Pesquisa inline: SEMPRE faca (nivel 2+) para garantir implementacoes corretas
6. CAPTURES: Se durante o planejamento voce descobrir algo importante (incompatibilidade, risco, oportunidade, decisao critica), registre em .plano/captures/ como arquivo markdown curto
</builder_mode>

<self_check>
Apos criar os planos, auto-verificar:
- [ ] Cada requisito da fase mapeado a um plano
- [ ] Frontmatter valido (wave, depends_on, files_modified, autonomous)
- [ ] Tarefas sao especificas e acionaveis
- [ ] Dependencias corretamente identificadas
- [ ] Waves atribuidas para execucao paralela
- [ ] must_haves derivados do objetivo da fase
Se algo falhar, corrija antes de retornar.
</self_check>

<output>
Escrever PLAN.md em: .plano/fases/{phase_dir}/
Retornar: ## PLANNING COMPLETE com resumo dos planos
</output>
", subagent_type="up-planejador", model="$MODEL_PLANNING", description="Planejar Fase {phase_number}")
```

Verificar retorno:
- `## PLANNING COMPLETE` → prosseguir para quality gate do plano
- `## PLANNING INCONCLUSIVE` → tentar novamente com mais contexto (max 2 tentativas)

**Quality Gate do Plano (se $SONNET_EXECUTION = true):**

Antes de passar pro executor, verificar qualidade do plano rapidamente:
```bash
# Contar tarefas com detalhamento insuficiente
for plan in .plano/fases/{phase_dir}/*-PLAN.md; do
  # Checar se tem imports/schemas/endpoints explicitados
  DETAIL_SCORE=0
  grep -c "import \|from '" "$plan" > /dev/null && DETAIL_SCORE=$((DETAIL_SCORE+1))
  grep -c "interface \|type \|schema\|z\.\|zod" "$plan" > /dev/null && DETAIL_SCORE=$((DETAIL_SCORE+1))
  grep -c "POST \|GET \|PUT \|DELETE \|endpoint\|route" "$plan" > /dev/null && DETAIL_SCORE=$((DETAIL_SCORE+1))
  grep -c "CREATE TABLE\|migration\|ALTER" "$plan" > /dev/null && DETAIL_SCORE=$((DETAIL_SCORE+1))
  echo "$plan: detail_score=$DETAIL_SCORE"
done
```

Se algum plano tem detail_score < 2 e a fase tem mais de 3 tarefas:
- Re-spawnar planejador com instrucao extra: "Plano insuficientemente detalhado para executor Sonnet. Reescrever com imports, tipos, schemas e endpoints explicitos. Ver self-check Sonnet-ready."
- Max 1 re-tentativa de enriquecimento

```
Fase {X}: Planejada — {N} planos em {M} waves [Sonnet-ready: {score}]
```

#### 3.1.2 Executar Fase (com Specialist Routing)

Usar o mesmo processo do workflow executar-fase.md:

```bash
INIT=$(node "$HOME/.claude/up/bin/up-tools.cjs" init executar-fase "${PHASE_NUMBER}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON para obter: `phase_dir`, `plan_count`, `incomplete_count`, `parallelization`.

```bash
PLAN_INDEX=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase-plan-index "${PHASE_NUMBER}")
```

Parse para obter waves e planos.

**Specialist Routing — escolher o agente certo por plano:**

Para cada plano, ler o frontmatter e detectar o dominio:

| Se o plano envolve... | Usar agente |
|----------------------|-------------|
| Componentes React, paginas, UI, CSS, Tailwind | `up-frontend-specialist` |
| API routes, endpoints, middleware, validacao | `up-backend-specialist` |
| Schema, migrations, seeds, RLS, queries | `up-database-specialist` |
| Misto ou infra | `up-executor` (generico) |

**Deteccao:** Ler campo `type` do frontmatter do PLAN.md. Se nao existir, inferir dos `<files>` das tasks:
- Arquivos em `app/`, `components/`, `*.tsx` com JSX → frontend
- Arquivos em `api/`, `server/`, `middleware/`, `route.ts` → backend
- Arquivos `.sql`, `migrations/`, `schema/`, `seed` → database
- Misto → usar executor generico

**Executar waves:**

Para cada wave, spawnar agentes especializados em paralelo (se parallelization=true):

```
Task(
  subagent_type="{up-frontend-specialist | up-backend-specialist | up-database-specialist | up-executor}",
  model="$MODEL_EXECUTION",
  prompt="
    <objective>
    Executar plano {plan_number} da fase {phase_number}-{phase_name}.
    Commitar cada tarefa atomicamente. Criar SUMMARY.md. Atualizar STATE.md e ROADMAP.md.
    </objective>

    <execution_context>
    @~/.claude/up/workflows/executar-plano.md
    @~/.claude/up/references/checkpoints.md
    </execution_context>

    <builder_mode>
    Modo builder ativo. Regras especiais:
    1. NAO use AskUserQuestion
    2. Checkpoints tipo checkpoint:human-verify → auto-aprovar e registrar
    3. Checkpoints tipo checkpoint:decision → tomar a decisao mais razoavel
    4. Checkpoints tipo checkpoint:human-action → se possivel automatizar, faca; se nao, registrar como pendente
    5. Deviation Rule 4 (architectural changes) → decidir autonomamente e registrar no SUMMARY
    6. CAPTURES: Se durante a execucao voce descobrir algo importante (padrao no codigo, problema potencial, oportunidade de melhoria, decisao arquitetural nao-obvia), registre em .plano/captures/ como arquivo markdown curto. Formato: `capture-{timestamp}-{slug}.md` com frontmatter: type (pattern|problem|opportunity|decision), severity (info|warning|critical), phase (numero). Corpo: 2-5 frases descrevendo o insight.
    </builder_mode>

    <files_to_read>
    Ler estes arquivos no inicio da execucao usando a ferramenta Read:
    - {phase_dir}/{plan_file} (Plano)
    - .plano/STATE.md (Estado)
    - .plano/config.json (Config)
    - ./CLAUDE.md (Instrucoes do projeto, se existir)
    </files_to_read>

    <success_criteria>
    - [ ] Todas tarefas executadas
    - [ ] Cada tarefa committed individualmente
    - [ ] SUMMARY.md criado no diretorio do plano
    - [ ] STATE.md atualizado
    - [ ] ROADMAP.md atualizado com progresso
    </success_criteria>
  "
)
```

**Spot-check apos cada wave:**
- Verificar que SUMMARYs existem
- Verificar que commits existem via `git log --oneline --grep`
- Se falha: tentar re-executar o plano falho (max 1 retry)

```
Wave {N}: {count} planos executados
```

#### 3.1.3 Reflect (Code Review)

**O passo "Reflect" do ciclo RARV — revisa codigo ANTES da verificacao formal.**

```
Fase {X}: Revisando codigo...
```

Spawnar code reviewer:

```
Task(
  subagent_type="up-code-reviewer",
  model="$MODEL_VERIFICATION",
  prompt="
    <objective>
    Revisar codigo da fase {phase_number} contra production-requirements e padroes de qualidade.
    Identificar problemas com localizacao exata e sugestao de fix.
    </objective>

    <files_to_read>
    - {phase_dir}/*-SUMMARY.md (O que foi implementado)
    - $HOME/.claude/up/references/production-requirements.md (Checklist de producao)
    - ./CLAUDE.md (Convencoes do projeto, se existir)
    </files_to_read>

    <constraints>
    - Revisar TODOS os arquivos modificados na fase (via git log --grep)
    - Verificar 6 dimensoes: production requirements, code quality, security, performance, edge cases, consistency
    - Gerar CODE-REVIEW.md com issues priorizadas e fixes sugeridos
    </constraints>
  ",
  description="Code Review da Fase {phase_number}"
)
```

Ler resultado do code review:

**Se ha issues CRITICAS (score < 7):**
- Spawnar executor para corrigir issues criticas
- Re-rodar code review (max 2 ciclos de correcao)

**Se score >= 7:**
- Registrar score e prosseguir

```
Reflect: score {N}/10 | {criticas} criticas | {importantes} importantes | {menores} menores
```

#### 3.1.4 Verificar Fase

Spawnar verificador autonomo:

```
Task(
  prompt="Verificar atingimento do objetivo da fase {phase_number}.
Diretorio da fase: {phase_dir}
Objetivo da fase: {goal do ROADMAP.md}
IDs de requisitos da fase: {phase_req_ids}

<builder_mode>
Modo builder. NAO use AskUserQuestion.
- Verificar must_haves contra codebase real
- Cross-referenciar requisitos do frontmatter contra REQUIREMENTS.md
- Rodar testes automatizados se existirem
- Se human_needed: considerar como PASSED (sera verificado no final)
- Criar VERIFICATION.md
</builder_mode>
",
  subagent_type="up-verificador",
  model="$MODEL_VERIFICATION"
)
```

Ler status da verificacao:

```bash
grep "^status:" "$PHASE_DIR"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

| Status | Acao no Builder |
|--------|----------------|
| `passed` | Marcar fase completa, avancar |
| `gaps_found` | Tentar corrigir (planejar gaps + executar, max 1 ciclo) |
| `human_needed` | Registrar para revisao final, avancar |

#### 3.1.5 Teste E2E da Fase (Playwright)

**Executar APENAS se a fase tem UI/rotas** (pular para fases de infra, schema, config).

Detecao: Se PLANs da fase criam/modificam arquivos em `app/`, `pages/`, `src/components/`, `src/features/` ou arquivos `page.tsx`/`route.ts` → tem UI, testar.

**Referencia:** `@~/.claude/up/workflows/builder-e2e.md` — Passo 3 (Teste por Fase)

1. Subir dev server (se ainda nao esta rodando):
```bash
# Detectar e subir — ver builder-e2e.md Passo 1
# Manter rodando entre fases (nao matar apos cada fase)
```

2. Extrair must_haves da fase e traduzir em testes E2E

3. Para cada teste:
   - Navegar para rota relevante
   - `browser_snapshot()` para obter refs dos elementos
   - Verificar que elementos esperados existem
   - Interagir (clicar, preencher, submeter) se necessario
   - `browser_snapshot()` para verificar resultado
   - `browser_take_screenshot()` como evidencia em `.plano/fases/[fase]/screenshots/`
   - `browser_console_messages(level: "error")` — checar erros JS
   - `browser_network_requests()` — checar falhas de API

4. Se bugs encontrados:
   - Para cada bug: loop de correcao (max 5 tentativas)
     - Analisar (screenshot + console + network + codigo)
     - Se tentativa > 1: analisar por que correcao anterior falhou
     - Corrigir inline
     - Commit: `fix(fase-{X}): [descricao] (tentativa N)`
     - Re-testar o teste que falhou
     - Se passou: proximo bug. Se falhou: proxima tentativa
   - Apos 5 tentativas sem sucesso: registrar como nao corrigido

5. Criar `.plano/fases/[fase]/E2E-RESULTS.md` com resultados

```
Fase {X}: E2E — {passed}/{total} testes passaram [{bugs} bugs, {fixed} corrigidos]
```

**Se nao tem UI:** Pular silenciosamente.
**Se dev server falha:** Registrar e pular E2E (nao bloqueia).

#### 3.1.5.1 Loop DCRV — Detectar, Classificar, Resolver, Verificar (Por Fase)

**Apos o E2E da fase**, rodar o workflow DCRV completo.

**Referencia:** `@~/.claude/up/workflows/dcrv.md`

Executar com parametros:
```
SCOPE=phase
PHASE_DIR={phase_dir}
PHASE_NUMBER={phase_number}
PORT={porta do dev server}
MAX_CYCLES=3
MAX_ISSUES_PER_CYCLE=15
AUTO_FIX=true
REGRESSION=false (smoke test e separado no passo 3.1.5.2)
```

O workflow DCRV cuida de:
1. Detectar modo (UI, API, ambos, nenhum)
2. Rodar detectores na ordem (Visual → API → Exhaustive)
3. Consolidar issue board
4. Dispatcher diagnostica e roteia para especialistas
5. Especialistas corrigem com commits atomicos
6. Re-verificacao das issues corrigidas
7. Loop ate resolver ou max ciclos

Issues pendentes sao salvas em `.plano/issues-carryover/` para o Quality Gate (Estagio 4).

```
Fase {X}: DCRV — {resolved}/{total} issues resolvidas [{pending} pendentes → Quality Gate]
```

#### 3.1.5.2 Smoke Test de Regressao (A partir da Fase 3)

**A partir da terceira fase**, fazer smoke test rapido das paginas de fases ANTERIORES.
Objetivo: detectar regressoes causadas por mudancas em componentes compartilhados.

**NAO e exaustivo** — apenas:
1. Navegar cada rota de fases anteriores
2. Verificar que renderiza (nao tela branca, nao 404)
3. Screenshot rapido
4. Checar console por erros novos

```
Para cada fase anterior com UI:
  Para cada rota da fase:
    browser_navigate(url)
    browser_console_messages(level: "error")
    Se erro novo detectado → registrar como regressao
```

Se regressao encontrada:
- Severidade: HIGH (algo que funcionava quebrou)
- Corrigir imediatamente (nao carregar para Quality Gate)
- Commit: `fix(fase-{X}): regressao em [pagina] causada por fase {Y}`

```
Smoke test regressao: {N} rotas anteriores | {OK} ok | {REGRESS} regressoes [{FIXED} corrigidas]
```

#### 3.1.6 Marcar Fase Completa

```bash
COMPLETION=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase complete "${PHASE_NUMBER}")
```

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(fase-{X}): completar execucao" --files .plano/ROADMAP.md .plano/STATE.md .plano/REQUIREMENTS.md
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > FASE {X}/{TOTAL} COMPLETA ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 3.1.7 Reassessment (Re-avaliacao do Roadmap)

Apos cada fase completa, verificar se o roadmap ainda faz sentido ANTES de planejar a proxima.

**Quando fazer reassessment:**
- SEMPRE apos completar uma fase (rapido, ~30 segundos)
- NAO requer agente separado — o orquestrador faz inline

**Processo:**

1. Ler ROADMAP.md (fases futuras) e SUMMARYs da fase recem-completa
2. Verificar 3 coisas:

   **a) Fases futuras ainda sao necessarias?**
   - A fase recem-completa pode ter resolvido algo que uma fase futura faria
   - Ex: Fase 3 (auth) pode ter adicionado RBAC que Fase 6 (permissoes) planejava
   - Se sim: marcar fase futura como "Removida (coberta pela Fase X)" no ROADMAP

   **b) Fases futuras precisam de ajuste?**
   - Decisoes arquiteturais da fase atual podem mudar o escopo de fases futuras
   - Ex: Escolheu tRPC ao inves de REST — fases de API precisam refletir isso
   - Se sim: atualizar objetivo/criterios da fase futura no ROADMAP

   **c) Surgiram necessidades novas?**
   - Ler `.plano/captures/` para insights capturados durante a fase
   - Se algum insight e CRITICO (bloqueia fases futuras): adicionar nova fase
   - Se e melhoria: ignorar (sera coberto pelo estagio Polish)

3. Se houve mudancas no roadmap:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: reassessment apos fase {X}" --files .plano/ROADMAP.md
```

```
Reassessment: [sem mudancas | X fases ajustadas | Y fases removidas | Z fases adicionadas]
```

**Se NAO houve mudancas:** Seguir silenciosamente (1 linha de log apenas).

#### 3.1.8 Avancar para Proxima Fase

Voltar para 3.1.1 com a proxima fase. Sem /clear — continuar no mesmo contexto.

**Gestao de contexto:** Se o contexto estiver acima de ~60%, fazer um checkpoint:
- Salvar estado atual em STATE.md
- Registrar fase atual e status
- Continuar (com 1M de contexto, a maioria dos projetos cabe)

---

## Estagio 4: QUALITY GATE LOOP (Autonomo)

Executado APOS todas as fases do build completarem.
Ciclo de avaliacao → correcao → re-avaliacao ate atingir score >= 9.0/10.

**Score Composto (9 dimensoes):**

| Dimensao | Peso | Como mede |
|----------|------|-----------|
| Funcionalidade | 15% | Requisitos atendidos / total (REQUIREMENTS.md) |
| Blind Validation | 15% | Score do BLIND-VALIDATION.md |
| Visual Quality | 12% | Score do up-visual-critic (VISUAL-REPORT.md) |
| Exhaustive | 10% | Pass rate do up-exhaustive-tester (EXHAUSTIVE-REPORT.md) |
| API Robustez | 8% | Pass rate do up-api-tester (API-REPORT.md) |
| E2E | 10% | Testes passando / total (Playwright) |
| UX | 10% | Score do UX tester (6 sub-dimensoes) |
| Responsividade | 10% | Score do mobile-first |
| Codigo | 10% | Score do code reviewer + melhorias |

**Nota:** Se projeto nao tem UI, redistribuir pesos de Visual/Exhaustive/UX/Responsividade para API/Funcionalidade/Codigo.
**Nota:** Se projeto nao tem API, redistribuir peso de API para outros.

**Limites de seguranca:**
- Max 5 ciclos de refinamento
- Se ciclo melhorou < 0.3 pontos: parar (diminishing returns)
- Nunca entregar abaixo de 7.0 (se ta abaixo, tem bug grave)
- Meta: score >= 9.0

### 4.0 Iniciar Quality Gate

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > QUALITY GATE — CICLO 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Definir `$CYCLE = 1`, `$PREVIOUS_SCORE = 0`.

### 4.1 Rodar Avaliadores (Todos em Paralelo)

**4.1a Melhorias de Codigo** (3 auditores paralelos → sintetizador)

Mesmo processo existente: spawnar up-auditor-ux, up-auditor-performance, up-auditor-modernidade em paralelo, depois up-sintetizador-melhorias.

### 4.1 Rodar Melhorias

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > POLIMENTO — AUDITORIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```bash
mkdir -p .plano/melhorias
```

Spawnar 3 auditores em paralelo (mesmo processo do melhorias.md):

```
Task(subagent_type="up-auditor-ux", prompt="
<objective>
Executar auditoria completa de UX/usabilidade do codebase deste projeto.
Salvar resultado em .plano/melhorias/ux-sugestoes.md
</objective>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
<constraints>
- Carregar reference: $HOME/.claude/up/references/audit-ux.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Salvar resultado em .plano/melhorias/ux-sugestoes.md
- Retornar resumo: ## AUDITORIA UX COMPLETA
</constraints>
", description="Auditoria UX")

Task(subagent_type="up-auditor-performance", prompt="
<objective>
Executar auditoria completa de performance do codebase deste projeto.
Salvar resultado em .plano/melhorias/performance-sugestoes.md
</objective>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
<constraints>
- Carregar reference: $HOME/.claude/up/references/audit-performance.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Salvar resultado em .plano/melhorias/performance-sugestoes.md
- Retornar resumo: ## AUDITORIA PERFORMANCE COMPLETA
</constraints>
", description="Auditoria Performance")

Task(subagent_type="up-auditor-modernidade", prompt="
<objective>
Executar auditoria completa de modernidade do codebase deste projeto.
Salvar resultado em .plano/melhorias/modernidade-sugestoes.md
</objective>
<files_to_read>
- ./CLAUDE.md (se existir)
</files_to_read>
<constraints>
- Carregar reference: $HOME/.claude/up/references/audit-modernidade.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Salvar resultado em .plano/melhorias/modernidade-sugestoes.md
- Retornar resumo: ## AUDITORIA MODERNIDADE COMPLETA
</constraints>
", description="Auditoria Modernidade")
```

Apos os 3 retornarem, spawnar sintetizador:

```
Task(subagent_type="up-sintetizador-melhorias", prompt="
<objective>
Sintetizar sugestoes dos 3 auditores em relatorio consolidado.
Salvar em .plano/melhorias/RELATORIO.md
</objective>
<files_to_read>
- .plano/melhorias/ux-sugestoes.md
- .plano/melhorias/performance-sugestoes.md
- .plano/melhorias/modernidade-sugestoes.md
- ./CLAUDE.md (se existir)
</files_to_read>
<constraints>
- Carregar template: $HOME/.claude/up/templates/report.md
- Carregar template: $HOME/.claude/up/templates/suggestion.md
- Deduplicar, detectar conflitos, classificar em 4 quadrantes
- Retornar resumo: ## SINTESE DE MELHORIAS COMPLETA
</constraints>
", description="Sintetizar melhorias")
```

### 4.2 Aplicar Quick Wins

Ler `.plano/melhorias/RELATORIO.md` e extrair sugestoes do quadrante "Quick Wins" (alto impacto, baixo esforco).

**Filtro:** Aplicar apenas Quick Wins com impacto >= "Grande" ou "Medio".

Se ha Quick Wins para aplicar:

1. Gerar fases a partir do relatorio:
```bash
echo '{"source":"melhorias","report_path":".plano/melhorias/RELATORIO.md","approved_ids":["MELH-001","MELH-003"],"grouping":"auto"}' | node "$HOME/.claude/up/bin/up-tools.cjs" phase generate-from-report
```

2. Para cada fase gerada de melhoria:
   - Planejar (up-planejador com builder_mode)
   - Executar (up-executor com builder_mode)
   - Verificar rapidamente

3. Commitar melhorias:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "polish: aplicar quick wins de melhorias" --files .plano/ROADMAP.md .plano/STATE.md
```

```
Melhorias: [N] quick wins aplicadas
```

Se nao ha Quick Wins ou todas tem impacto baixo:
```
Melhorias: auditoria completa, sem quick wins para aplicar automaticamente
Relatorio completo em .plano/melhorias/RELATORIO.md
```

### 4.3 UX Tester (Navegar como Usuario Real)

**Executar APENAS se o projeto tem UI web.** Pular para CLIs, APIs puras, bibliotecas.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > POLIMENTO — UX REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Referencia:** `@~/.claude/up/workflows/ux-tester.md`

Executar o workflow completo do UX Tester:

1. Subir dev server (se nao esta rodando do E2E)
2. Descobrir fluxos (de PROJECT.md/REQUIREMENTS.md)
3. Definir 2-3 personas
4. Navegar cada fluxo como cada persona, avaliando 6 dimensoes:
   - Clareza, Eficiencia, Feedback, Consistencia, Acessibilidade, Performance
5. Gerar `.plano/ux-review/UX-REPORT.md` com issues e scores
6. **Implementar TODAS as melhorias seguras automaticamente:**
   - Textos/copy confusos → reescrever
   - Feedback ausente → adicionar loading, toasts, hover states
   - Acessibilidade → alt, labels, aria, focus visible
   - Espacamento/layout → padding, margin, fontes
   - Consistencia → unificar estilos, terminologia
   - Performance simples → lazy loading, debounce, memo
7. Commit atomico por melhoria: `ux({area}): {descricao}`
8. Screenshots antes/depois para cada melhoria
9. Re-navegar para confirmar

```
UX Review: score [N]/10 | [X] issues | [Y] implementadas (incluindo componentes novos e ajustes de fluxo) | [Z] tentativas falhas
```

**Se nao tem UI:** Pular silenciosamente.
**Se dev server falha:** Registrar e pular.

### 4.4 Mobile First (Responsividade)

**Executar APENAS se o projeto tem UI web.** Pular para CLIs, APIs puras, bibliotecas.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > POLIMENTO — RESPONSIVIDADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Referencia:** `@~/.claude/up/workflows/mobile-first.md`

Executar o workflow completo do Mobile First:

1. Detectar stack CSS (Tailwind, CSS Modules, etc.)
2. Scan: capturar todas as paginas em mobile (390px), tablet (768px), desktop (1920px)
3. Detectar problemas: overflow, texto pequeno, alvos de toque, grid quebrado
4. Para cada problema:
   - Capturar referencia desktop
   - Corrigir com classes responsivas / media queries
   - Verificar mobile melhorou
   - Verificar desktop INTACTO (se mudou: reverter, tentar outra abordagem)
   - Commit atomico
5. Gerar `.plano/mobile-review/MOBILE-REPORT.md`

```
Mobile First: score [N]/10 | [X] problemas | [Y] corrigidos | desktop intacto
```

**Se nao tem UI:** Pular silenciosamente.
**Se dev server falha:** Registrar e pular.

### 4.5 Rodar Ideias

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > POLIMENTO — IDEIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```bash
mkdir -p .plano/ideias
```

Spawnar 2 agentes em paralelo:

```
Task(subagent_type="up-analista-codigo", prompt="
<objective>
Analisar codebase para identificar gaps funcionais e oportunidades de features novas.
Salvar em .plano/ideias/codigo-sugestoes.md
</objective>
<files_to_read>
- ./CLAUDE.md (se existir)
- .plano/PROJECT.md
</files_to_read>
", description="Analise de codigo para ideias")

Task(subagent_type="up-pesquisador-mercado", prompt="
<objective>
Pesquisar concorrentes e tendencias de mercado para sugerir features novas.
Salvar em .plano/ideias/mercado-sugestoes.md
</objective>
<files_to_read>
- .plano/PROJECT.md
</files_to_read>
", description="Pesquisa de mercado para ideias")
```

Apos os 2 retornarem, spawnar consolidador:

```
Task(subagent_type="up-consolidador-ideias", prompt="
<objective>
Consolidar sugestoes de features. Aplicar ICE scoring, gerar anti-features.
Salvar em .plano/ideias/RELATORIO.md
</objective>
<files_to_read>
- .plano/ideias/codigo-sugestoes.md
- .plano/ideias/mercado-sugestoes.md
- .plano/PROJECT.md
</files_to_read>
", description="Consolidar ideias com ICE scoring")
```

**NAO implementar ideias.** Apenas salvar o relatorio.

```
Ideias: [N] sugestoes geradas com ICE scoring
Relatorio em .plano/ideias/RELATORIO.md
```

### 4.6 Blind Validation (Testar como Usuario Final)

**Validar requisitos SEM ler codigo — apenas navegando o app.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QUALITY GATE — BLIND VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
Task(
  subagent_type="up-blind-validator",
  model="$MODEL_VERIFICATION",
  prompt="
    <objective>
    Validar requisitos SEM ler codigo. Apenas navegar o app via Playwright e curl.
    Testar cada requisito como usuario final: renderiza? funciona? feedback existe?
    </objective>

    <files_to_read>
    - .plano/REQUIREMENTS.md (UNICO doc de especificacao)
    - .plano/PROJECT.md (contexto do produto)
    </files_to_read>

    <constraints>
    - NAO ler arquivos de codigo (.ts, .tsx, .py, .css)
    - NAO ler SUMMARYs, PLANs, ARCHITECTURE
    - APENAS navegar o app e testar como usuario
    - Gerar BLIND-VALIDATION.md com screenshots
    </constraints>
  ",
  description="Blind Validation — testar como usuario final"
)
```

```
Blind Validation: {score}% | {passed} PASS | {failed} FAIL | {partial} PARTIAL
```

### 4.7 Calcular Score Composto

Agregar scores de todos os avaliadores:

```
Funcionalidade (15%): requisitos [x] / total no REQUIREMENTS.md → 0-10
Blind Valid. (15%):   score do BLIND-VALIDATION.md → 0-10
Visual (12%):         score do VISUAL-REPORT.md → 0-10
Exhaustive (10%):     pass rate do EXHAUSTIVE-REPORT.md → 0-10
API (8%):             pass rate do API-REPORT.md → 0-10
E2E (10%):            testes passaram / total no E2E mais recente → 0-10
UX (10%):             score do UX-REPORT.md → 0-10
Responsividade (10%): score do MOBILE-REPORT.md → 0-10
Codigo (10%):         score do CODE-REVIEW + melhorias → 0-10

**Modo normal:**
Score = (func × 0.15) + (blind × 0.15) + (visual × 0.12) + (exhaustive × 0.10) + (api × 0.08) + (e2e × 0.10) + (ux × 0.10) + (resp × 0.10) + (cod × 0.10)

**Modo clone (builder_type: "clone"):**
Score = (func × 0.10) + (fidelidade × 0.15) + (blind × 0.10) + (visual × 0.15) + (exhaustive × 0.10) + (api × 0.05) + (e2e × 0.10) + (ux × 0.05) + (resp × 0.10) + (cod × 0.10)

A dimensao "Fidelidade" usa o up-clone-verifier: compara features (funcional) + visual contra original.
```

**Se algum avaliador nao rodou** (ex: sem UI, sem E2E, sem API): redistribuir peso proporcionalmente entre os que rodaram.

**Issues Carryover das Fases:**

Antes de iniciar o Quality Gate, carregar issues pendentes do loop DCRV por fase:
```bash
ls .plano/issues-carryover/*.json 2>/dev/null
```
Estas issues ja foram detectadas e tentadas — se ainda existem, sao as mais dificeis.
Incluir no board de issues do Quality Gate com flag `carryover: true`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QUALITY GATE — CICLO {CYCLE} — SCORE: {SCORE}/10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Dimensao | Score | Peso | Contribuicao |
|----------|-------|------|-------------|
| Funcionalidade | [N]/10 | 15% | [X] |
| Blind Validation | [N]/10 | 15% | [X] |
| Visual Quality | [N]/10 | 12% | [X] |
| Exhaustive | [N]/10 | 10% | [X] |
| API Robustez | [N]/10 | 8% | [X] |
| E2E | [N]/10 | 10% | [X] |
| UX | [N]/10 | 10% | [X] |
| Responsividade | [N]/10 | 10% | [X] |
| Codigo | [N]/10 | 10% | [X] |
| **TOTAL** | **[SCORE]/10** | | |
```

### 4.8 Decidir: Continuar ou Entregar

**Se score >= 9.0:** Ir para Estagio 5 (Entrega). Sistema pronto.

**Se score < 9.0 E cycle < 5 E (score - previous_score) >= 0.3:**

```
Score {SCORE} < 9.0 — identificando gaps para correcao...
```

Identificar top gaps (dimensoes com menor score):
1. Ordenar dimensoes por score (menor primeiro)
2. Para cada dimensao abaixo de 9.0:
   - Ler relatorio correspondente
   - Extrair issues nao corrigidas / requisitos pendentes
   - Priorizar por impacto no score

**Rodar 3 detectores no projeto INTEIRO (nao apenas por fase):**

Ordem: Visual Critic → API Tester → Exhaustive Tester

Cada detector roda em TODAS as paginas/rotas, detectando:
- Issues novas (nao encontradas no DCRV por fase)
- Regressoes cross-fase (inconsistencia entre paginas de fases diferentes)
- Issues carryover (pendentes das fases) — re-verificar se ainda existem

**Implementar correcoes via Dispatcher (mesmo protocolo do DCRV por fase):**
- Issues visuais (VIS-*): diagnosticar → up-frontend-specialist
- Issues de interacao (INT-*): diagnosticar → up-frontend-specialist ou up-backend-specialist
- Issues de API (API-*): diagnosticar → up-backend-specialist ou up-database-specialist
- Issues de codigo: planejar mini-fase → executar → commit
- Issues de UX: aplicar fixes (mesmo processo do UX tester)
- Issues de responsividade: aplicar fixes (mesmo processo do mobile-first)
- Requisitos pendentes: planejar mini-fase → executar
- Issues de E2E: corrigir bugs (max 5 tentativas)

**Cap de issues por ciclo: max 20** (mais generoso que o DCRV por fase).
Prioridade: critical > high > medium. Low nunca entra.

Apos implementar:

```
$PREVIOUS_SCORE = $SCORE
$CYCLE += 1
```

**Voltar para 4.1** (re-rodar avaliadores no proximo ciclo).

**Se cycle >= 5:** Entregar com score atual.
```
Quality Gate: max ciclos atingido. Entregando com score {SCORE}/10.
```

**Se (score - previous_score) < 0.3:** Diminishing returns. Entregar.
```
Quality Gate: melhoria < 0.3 pontos. Entregando com score {SCORE}/10.
```

### 4.9 DevOps — Artefatos de Producao

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > PRODUCTION ARTIFACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawnar devops agent:

```
Task(
  subagent_type="up-devops-agent",
  model="$MODEL_QUALITY",
  prompt="
    <objective>
    Gerar artefatos de producao para o projeto: Dockerfile, docker-compose, CI/CD, .env.example, seed data, scripts.
    </objective>

    <files_to_read>
    - .plano/PROJECT.md
    - .plano/SYSTEM-DESIGN.md (schema, integracoes)
    - ./package.json
    - ./CLAUDE.md (se existir)
    </files_to_read>

    <builder_mode>
    Modo builder. NAO pergunte nada. Gere tudo autonomamente.
    Adapte ao stack real do projeto.
    </builder_mode>
  ",
  description="Gerar artefatos de producao"
)
```

```
DevOps: Dockerfile + docker-compose + CI/CD + .env.example + seed data
```

### 4.10 Technical Writer — Documentacao

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > DOCUMENTACAO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawnar technical writer:

```
Task(
  subagent_type="up-technical-writer",
  model="$MODEL_QUALITY",
  prompt="
    <objective>
    Gerar documentacao completa: README.md, API docs, CHANGELOG.md, setup guide.
    Documentacao com conteudo REAL do projeto (nao placeholders).
    </objective>

    <files_to_read>
    - .plano/PROJECT.md
    - .plano/REQUIREMENTS.md
    - .plano/SYSTEM-DESIGN.md
    - .plano/PRODUCT-ANALYSIS.md
    - ./package.json
    - ./CLAUDE.md (se existir)
    </files_to_read>

    <builder_mode>
    Modo builder. NAO pergunte nada. Gere documentacao autonomamente.
    README deve ter instrucoes de setup que FUNCIONAM.
    </builder_mode>
  ",
  description="Gerar documentacao completa"
)
```

```
Docs: README.md + CHANGELOG.md + API docs
```

### 4.11 Security Review

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > SECURITY AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawnar security reviewer:

```
Task(
  subagent_type="up-security-reviewer",
  model="$MODEL_QUALITY",
  prompt="
    <objective>
    Auditar codigo para vulnerabilidades de seguranca (OWASP Top 10, auth, injection, data exposure).
    </objective>

    <files_to_read>
    - ./CLAUDE.md (se existir)
    - .plano/SYSTEM-DESIGN.md (roles, auth design)
    </files_to_read>

    <builder_mode>
    Modo builder. Gere SECURITY-REVIEW.md com vulnerabilidades encontradas.
    </builder_mode>
  ",
  description="Auditoria de seguranca"
)
```

Se ha vulnerabilidades CRITICAS: corrigir automaticamente (spawnar executor com fix sugerido).

```
Security: score {N}/10 | {criticas} criticas | {altas} altas
```

### 4.12 QA — Testes Automatizados

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > QA — TESTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Spawnar QA agent:

```
Task(
  subagent_type="up-qa-agent",
  model="$MODEL_QUALITY",
  prompt="
    <objective>
    Identificar gaps de cobertura de testes, escrever testes que faltam, executar todos.
    </objective>

    <files_to_read>
    - .plano/PROJECT.md
    - ./package.json
    - ./CLAUDE.md (se existir)
    </files_to_read>

    <builder_mode>
    Modo builder. Escreva testes e rode autonomamente.
    Foco: API routes (90%+), logica de negocio (80%+), componentes com logica (70%+).
    </builder_mode>
  ",
  description="QA — escrever e rodar testes"
)
```

```
QA: {N} testes escritos | {X} passando | cobertura estimada {%}
```

### 4.13 Rodar Ideias (Uma Vez, Apos Quality Gate)

**Rodar ideias apenas UMA VEZ, apos o loop de qualidade terminar (nao a cada ciclo).**

Mesmo processo de ideias existente (2 agentes paralelos + consolidador).
NAO implementar ideias — apenas salvar relatorio para proximos passos.

---

## Estagio 4.5: DELIVERY AUDIT (NOVO v0.5.0)

Antes do Delivery, o `up-delivery-auditor` valida que o processo inteiro foi completo e consistente.

### 4.5.1 Rodar Delivery Auditor

```python
Agent(
  subagent_type="up-delivery-auditor",
  model="opus",
  prompt="""
    Auditar processo de entrega do projeto.
    
    <files_to_read>
    - .plano/CHECKLIST.md
    - .plano/BRIEFING.md
    - .plano/PENDING.md
    - .plano/governance/approvals.log (se existe)
    - Todos os reviews (supervisores + chiefs)
    - Todos os relatorios (VERIFICATION, DCRV, E2E, etc.)
    - $HOME/.claude/up/templates/audit-report.md (template)
    </files_to_read>
    
    Calcular Confidence Score (0-100).
    Detectar inconsistencias cross-report.
    Validar aprovacoes.
    Comparar delivery com briefing original.
    
    Gerar .plano/AUDIT-REPORT.md com recomendacao.
    
    Retornar: READY_FOR_DELIVERY | APPROVED_WITH_WARNINGS | NEEDS_REWORK | BLOCKED
  """
)
```

### 4.5.2 Processar Resultado do Auditor

**Se READY_FOR_DELIVERY (confidence >= 95%):**
- Prosseguir direto pro Estagio 5

**Se APPROVED_WITH_WARNINGS (confidence 85-94%):**
- Delegar pro CEO decidir
- CEO pode perguntar ao dono se aceita entregar com warnings

**Se NEEDS_REWORK (confidence 70-84%):**
- Executar rework plan do auditor
- Re-rodar estagios problematicos
- Voltar pro auditor (max 3 ciclos)

**Se BLOCKED (confidence < 70% ou problema critico):**
- Escalar pro CEO
- CEO alerta dono obrigatoriamente
- Projeto nao pode ser entregue sem decisao do dono

### 4.5.3 Loop de Rework (se necessario)

```
Ciclo 1: rodar auditor
  Se NEEDS_REWORK:
    Executar rework plan
    Ciclo 2: rodar auditor
      Se NEEDS_REWORK:
        Executar rework plan
        Ciclo 3: rodar auditor
          Se NEEDS_REWORK:
            Forca APPROVED_WITH_WARNINGS
            CEO decide o que fazer
```

Max 3 ciclos. Depois: forcar aprovacao ou escalar CEO.

---

## Estagio 5: ENTREGA (Autonomo)

### 5.1 Teste E2E Final Completo (Playwright)

**Referencia:** `@~/.claude/up/workflows/builder-e2e.md` — Passo 4 (Teste Final)

**Executar APENAS se o projeto tem UI web.** Pular para CLIs, APIs puras, bibliotecas.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 BUILDER > TESTE E2E FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

1. Subir dev server (se nao esta rodando)
2. Criar diretorios:
```bash
mkdir -p .plano/e2e/smoke .plano/e2e/responsive .plano/e2e/flows
```

3. **Smoke test de rotas:**
   - Descobrir todas as rotas do projeto (de arquivos page.tsx/route.ts)
   - Visitar cada rota
   - Screenshot de cada uma
   - Checar console errors
   - Registrar rotas OK vs quebradas

4. **Fluxos E2E principais (3-5 fluxos):**
   - Derivar de REQUIREMENTS.md os fluxos criticos
   - Para cada fluxo: navegar → interagir → verificar → screenshot
   - Se auth necessario: criar usuario de teste ou usar seed data

5. **Teste de responsividade:**
   - Desktop (1920x1080), Tablet (768x1024), Mobile (375x812)
   - Screenshot da pagina principal em cada viewport
   - Verificar se layout adapta (nao overflow, nao cortado)

6. **Correcao de bugs encontrados:**
   - Para cada bug: loop de correcao (max 5 tentativas por bug)
     - Analisar → corrigir → commit → re-testar
     - Se tentativa > 1: analisar por que tentativa anterior falhou
   - Apos 5 tentativas: registrar como nao corrigido e seguir

7. Gerar `.plano/e2e/E2E-REPORT.md` com resultados completos

8. Matar dev server e fechar browser:
```bash
kill $DEV_PID 2>/dev/null
```
`browser_close()`

```
Teste E2E: {routes_ok}/{routes_total} rotas | {flows_passed}/{flows_total} fluxos | {bugs} bugs [{fixed} corrigidos]
```

**Se nao tem UI:** Pular silenciosamente.
**Se dev server falha:** Registrar e pular (nao bloqueia entrega).

### 5.2 Verificacao de Requisitos

Ler REQUIREMENTS.md e verificar cobertura:

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" progress json
```

Contar requisitos completos vs total.

Se ha requisitos pendentes: listar com motivo (fase falhou, verificacao pendente, etc.).

### 5.3 Triagem de Captures (Insights)

Ler todos os arquivos em `.plano/captures/`:

```bash
ls .plano/captures/*.md 2>/dev/null | wc -l
```

Se ha captures:

1. Ler cada arquivo e classificar:

| type | Acao |
|------|------|
| `critical` + `problem` | Listar no DELIVERY.md como "Problemas Criticos Detectados" |
| `warning` + `problem` | Listar no DELIVERY.md como "Alertas" |
| `opportunity` | Listar no DELIVERY.md como "Oportunidades Detectadas" |
| `pattern` | Listar no DELIVERY.md como "Padroes Identificados" |
| `decision` | Ja registrado no PROJECT.md — ignorar |
| `info` | Ignorar (informativo apenas) |

2. Gerar `.plano/captures/TRIAGE.md`:

```markdown
# Triagem de Insights

**Total capturado:** [N] insights durante o build

## Criticos
[insights criticos que precisam de atencao]

## Alertas
[problemas potenciais detectados]

## Oportunidades
[melhorias e features descobertas durante o build]

## Padroes
[padroes identificados no codebase]

## Estatisticas
| Tipo | Quantidade |
|------|-----------|
| critical | [N] |
| warning | [N] |
| opportunity | [N] |
| pattern | [N] |
| decision | [N] |
| info | [N] |
```

Se NAO ha captures: pular silenciosamente.

### 5.4 Gerar DELIVERY.md (incluindo resultados E2E)

Carregar template de `$HOME/.claude/up/templates/delivery.md`.

Preencher com dados de:
- PROJECT.md (nome, stack, core value)
- ROADMAP.md (fases completadas)
- REQUIREMENTS.md (cobertura)
- SUMMARYs de cada fase (o que foi construido)
- .plano/e2e/E2E-REPORT.md (resultados do teste E2E final, se existir)
- E2E-RESULTS.md de cada fase (resultados por fase, se existirem)
- .plano/captures/TRIAGE.md (insights capturados durante o build, se existir)
- .plano/melhorias/RELATORIO.md (melhorias aplicadas, se existir)
- .plano/ideias/RELATORIO.md (top 5 ideias por ICE, se existir)
- package.json (como rodar)
- .env.example ou env vars usados (credenciais necessarias)

Contar commits:
```bash
git rev-list --count HEAD
```

Escrever `.plano/DELIVERY.md`.

### 5.5 Commit Final e Cleanup

```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: relatorio de entrega (modo builder)" --files .plano/DELIVERY.md
```

**Remover LOCK.md (sessao concluida com sucesso):**
```bash
rm -f .plano/LOCK.md
```

**Fechar Dashboard:**
```bash
kill $DASH_PID 2>/dev/null
```

### 5.6 CEO Apresenta Resultado (NOVO v0.5.0)

Delegar apresentacao final ao CEO:

```python
Agent(
  subagent_type="up-project-ceo",
  model="opus",
  prompt="""
    Apresentar resultado final do projeto ao dono.
    
    <files_to_read>
    - ~/.claude/up/owner-profile.md (seu perfil do dono)
    - .plano/OWNER.md (contexto do projeto)
    - .plano/DELIVERY.md (relatorio de entrega)
    - .plano/AUDIT-REPORT.md (auditoria)
    - .plano/PENDING.md (pendencias)
    </files_to_read>
    
    Apresentar no tom e estilo definidos no owner-profile.
    Incluir: resumo, scores, pendencias agrupadas por severidade.
    Perguntar se dono quer resolver alguma pendencia agora.
  """
)
```

**Template antigo (fallback se CEO nao disponivel):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILDER — PROJETO ENTREGUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[Nome do Projeto]**

[Resumo em 2-3 frases do que foi construido]

## O que foi Entregue

| Fase | O que Construiu | Status |
|------|----------------|--------|
| 1 | [resumo] | Completo |
| 2 | [resumo] | Completo |
| ... | ... | ... |

## Metricas

| Metrica | Valor |
|---------|-------|
| Fases | [N] completadas |
| Requisitos | [X]/[Y] atendidos |
| Commits | [N] |
| Melhorias aplicadas | [N] |
| Ideias geradas | [N] |

## Itens para Revisao Humana

[Lista de itens marcados como human_needed durante verificacao]
[Se nenhum: "Nenhum — todas verificacoes automaticas passaram"]

## Proximos Passos (Top 5 Ideias)

1. [Ideia 1] — ICE: [score]
2. [Ideia 2] — ICE: [score]
3. [Ideia 3] — ICE: [score]
4. [Ideia 4] — ICE: [score]
5. [Ideia 5] — ICE: [score]

───────────────────────────────────────────────────────────────

Relatorio completo: .plano/DELIVERY.md

Como rodar:
[Instrucoes de setup do DELIVERY.md]

───────────────────────────────────────────────────────────────
```

</process>

<light_process>
## MODO LIGHT — Pipeline Enxuto

**Ativado quando `--light` esta nos $ARGUMENTS.**
Extrair `--light` dos argumentos. O restante e o briefing.

### L1. Intake Rapido

#### L1.1 Detectar Modo

Mesmo processo do full: verificar codigo existente para determinar greenfield/brownfield.

```bash
ls package.json go.mod Cargo.toml requirements.txt pyproject.toml 2>/dev/null
ls -d src/ app/ lib/ pages/ components/ 2>/dev/null | head -10
```

#### L1.2 Receber Briefing

Se briefing veio nos $ARGUMENTS: usar direto.
Se vazio: pedir freeform (mesma logica do full).

#### L1.3 Perguntas Criticas

Mesma logica do full — perguntar APENAS o essencial (credenciais, APIs, ambiguidades criticas).

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILDER LIGHT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** [resumo em 1-2 frases]
**Modo:** [greenfield/brownfield]
**Stack:** [detectada ou inferida]

Pipeline enxuto: planejar → executar → testar.
Iniciando...
```

═══════════════════════════════════════════════════════
 FIM DA INTERACAO COM USUARIO
═══════════════════════════════════════════════════════

---

### L2. Estrutura Inline (Sem Agente Separado)

**NAO spawnar up-arquiteto.** Fazer tudo inline para economizar tokens.

#### L2.1 Entender o Codebase (Brownfield)

**Se `.plano/codebase/` existe e recente (< 7 dias):** Ler STACK.md e CONVENTIONS.md apenas. Pular mapeamento.

**Se nao existe:** Mini-scan inline:
```bash
# Stack
cat package.json 2>/dev/null | head -50
ls tsconfig.json next.config.* vite.config.* 2>/dev/null

# Estrutura
find . -type d -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.plano/*' -maxdepth 3 | head -30

# Arquivos principais
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | head -30
```

**Greenfield:** Pular. Inferir stack do briefing ou defaults.

#### L2.2 Criar/Atualizar Documentos

```bash
mkdir -p .plano
git init 2>/dev/null
```

**PROJECT.md** — Criar ou atualizar inline (sem template elaborado):
```markdown
# [Nome do Projeto/Feature]

## O que e
[Briefing do usuario em 2-3 frases]

## Stack
[Stack detectada ou inferida]

## Requisitos
- [ ] [REQ-01]: [requisito 1]
- [ ] [REQ-02]: [requisito 2]
...
```

**ROADMAP.md** — Criar ou atualizar com 1-3 fases:
- Se feature simples: 1 fase
- Se feature media: 2-3 fases
- Cada fase com objetivo e criterios de sucesso

**STATE.md** — Inicializar ou atualizar.

**config.json:**
```json
{
  "mode": "yolo",
  "granularity": "coarse",
  "parallelization": true,
  "commit_docs": true,
  "builder_mode": true,
  "builder_type": "light"
}
```

Commit:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: estruturar feature (builder light)" --files .plano/PROJECT.md .plano/ROADMAP.md .plano/STATE.md .plano/config.json
```

Se REQUIREMENTS.md foi criado/atualizado:
```bash
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs: requisitos (builder light)" --files .plano/REQUIREMENTS.md
```

---

### L3. Build + E2E

Mesmo loop do full (3.1.1 → 3.1.5), mas:
- **Sem LOCK.md** (sessao curta)
- **Sem reassessment** (poucas fases)
- **Sem captures** (sessao curta)
- **COM E2E Playwright** (se tem UI)

Para cada fase no ROADMAP:

#### L3.1 Planejar Fase

Spawnar up-planejador (mesmo do full):

```
Task(prompt="
<planning_context>
**Fase:** {phase_number}
**Modo:** builder light (autonomo -- NAO use AskUserQuestion)

<files_to_read>
- .plano/STATE.md
- .plano/ROADMAP.md
- .plano/REQUIREMENTS.md (se existir)
- ./CLAUDE.md (se existir)
</files_to_read>

**IDs de requisitos da fase:** {phase_req_ids}

<builder_mode>
Modo builder light. Regras:
1. NAO use AskUserQuestion
2. Se ha ambiguidade, tome a decisao mais razoavel
3. Pesquisa inline: nivel 1 apenas (verificacao rapida, nao pesquisa profunda)
4. Planos devem ser CONCISOS — minimo de tarefas necessarias
</builder_mode>

<output>
Escrever PLAN.md em: .plano/fases/{phase_dir}/
Retornar: ## PLANNING COMPLETE
</output>
", subagent_type="up-planejador", description="Planejar Fase {phase_number} (light)")
```

#### L3.2 Executar Fase

Mesmo processo do full — spawnar up-executor por wave.

#### L3.3 Verificar Fase

Spawnar up-verificador (mesmo do full — verificacao real, nao shortcut):

```
Task(
  subagent_type="up-verificador",
  model="$MODEL_VERIFICATION",
  prompt="Verificar fase {phase_number}. Diretorio: {phase_dir}. Objetivo: {goal}."
)
```

| Status | Acao |
|--------|------|
| `passed` | → L3.4 |
| `gaps_found` | Tentar gap closure (1 ciclo max) |
| `human_needed` | Registrar, avancar |

#### L3.4 Teste E2E (Playwright)

**Referencia:** `@~/.claude/up/workflows/builder-e2e.md` — Passo 3 (Teste por Fase)

**EXECUTAR OBRIGATORIAMENTE se a fase tem UI.** Nao pular.

1. Subir dev server (se nao esta rodando)
2. Traduzir must_haves em testes E2E
3. Navegar, interagir, verificar, screenshot
4. Bugs: corrigir (max 5 tentativas por bug)
5. Criar E2E-RESULTS.md

**Se dev server falha:** Registrar e continuar (nao bloqueia).

#### L3.4.1 DCRV Light (1 ciclo)

**Apos E2E**, rodar DCRV em modo light (1 ciclo, sem loop):

**Referencia:** `@~/.claude/up/workflows/dcrv.md`

```
SCOPE=light
PHASE_DIR={phase_dir}
PHASE_NUMBER={phase_number}
MAX_CYCLES=1
MAX_ISSUES_PER_CYCLE=10
AUTO_FIX=true
```

Isso roda os 3 detectores (visual, API, exhaustive), corrige o que puder em 1 ciclo, e segue.

```
Fase {X} (light): DCRV — {resolved}/{total} issues corrigidas
```

#### L3.5 Marcar Fase Completa

```bash
COMPLETION=$(node "$HOME/.claude/up/bin/up-tools.cjs" phase complete "${PHASE_NUMBER}")
node "$HOME/.claude/up/bin/up-tools.cjs" commit "docs(fase-{X}): completar (light)" --files .plano/ROADMAP.md .plano/STATE.md
```

Avancar para proxima fase. Sem reassessment.

---

### L4. Resumo Final

Apos todas as fases:

```bash
# Matar dev server se rodando
kill $DEV_PID 2>/dev/null
```

`browser_close()` (se Playwright aberto)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 UP > BUILDER LIGHT — COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Feature:** [resumo do briefing]

## O que foi Feito

| Fase | O que Construiu | Status |
|------|----------------|--------|
| [N] | [resumo] | Completo |
| [N+1] | [resumo] | Completo |

## Metricas

| Metrica | Valor |
|---------|-------|
| Fases | [N] |
| Commits | [N] |
| E2E testes | [X] passaram de [Y] |
| Bugs corrigidos | [N] |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quer polir? /up:ux-tester ou /up:melhorias
Quer mais? /up:modo-builder "proxima feature"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**NAO gerar DELIVERY.md. NAO rodar polish completo. NAO rodar ideias.**

**Light mode success criteria:**
- [ ] .plano/ criado com PROJECT.md, ROADMAP.md, REQUIREMENTS.md
- [ ] Todas fases executadas com commits atomicos
- [ ] Verificador rodou em cada fase (NAO quick check)
- [ ] E2E Playwright rodou em fases com UI
- [ ] DCRV light (1 ciclo) rodou em cada fase com UI/API
- [ ] Resumo final exibido com metricas

</light_process>

<failure_handling>

## Tratamento de Falhas

### Planejamento falha (PLANNING INCONCLUSIVE)
- Retry 1: Adicionar mais contexto da pesquisa ao prompt
- Retry 2: Simplificar escopo da fase (dividir em 2)
- Se ainda falha: Pular fase, registrar em DELIVERY.md como "Nao implementada"

### Execucao falha (agente nao retorna SUMMARY)
- Retry 1: Re-spawnar executor para o plano falho
- Se ainda falha: Registrar plano como incompleto, continuar com proxima wave/fase

### Verificacao encontra gaps
- Ciclo 1: Planejar gaps + executar gap closure
- Se gaps persistem: Registrar como pendente, avancar (sera listado no DELIVERY.md)

### Melhorias/Ideias falham
- Estas etapas sao opcionais no builder
- Se algum agente falha: Continuar com os que completaram
- Se todos falham: Pular estagio, registrar no DELIVERY.md

**Principio:** O builder NUNCA para. Falhas sao registradas e contornadas. O usuario recebe o maximo possivel.

</failure_handling>

<context_management>

## Gestao de Contexto (1M tokens)

Com 1M de contexto, a maioria dos projetos cabe sem /clear. Mas monitore:

**Orquestrador fica enxuto:**
- NAO leia conteudo de SUMMARYs inteiros — apenas verifique existencia
- NAO leia PLANs apos planejamento — apenas passe caminhos ao executor
- NAO leia codigo fonte — apenas verifique via git log/ls

**Subagentes recebem contexto limpo:**
- Cada Task() spawna com contexto fresco
- Passe apenas caminhos de arquivos, nao conteudo

**Se contexto atingir ~70%:**
- Reduzir output de status (1 linha por fase ao inves de tabelas)
- Pular estagio Polish (melhorias + ideias) se necessario
- Priorizar completar build sobre polimento

</context_management>

<success_criteria>

## Criterios de Sucesso do Builder

- [ ] Estagio 1: Briefing coletado, perguntas criticas respondidas
- [ ] Estagio 2: Product Analyst executado (concorrentes, features, personas)
- [ ] Estagio 2: System Designer executado (modulos, roles, schema, blueprints, 5 camadas)
- [ ] Estagio 2: Architect executou (PROJECT.md, REQUIREMENTS.md, ROADMAP.md criados)
- [ ] Estagio 2: Requisitos completos (50-100 requisitos, 5 camadas)
- [ ] Estagio 3: Todas as fases planejadas
- [ ] Estagio 3: Todas as fases executadas (com specialist routing)
- [ ] Estagio 3: Reflect (code review) apos cada fase
- [ ] Estagio 3: Todas as fases verificadas
- [ ] Estagio 3: Fases com UI testadas via Playwright (E2E-RESULTS.md)
- [ ] Estagio 3: Bugs E2E corrigidos (quando possivel)
- [ ] Estagio 3: DCRV por fase executado (Visual Critic + Exhaustive Tester + API Tester)
- [ ] Estagio 3: Issues DCRV corrigidas via dispatcher (max 3 ciclos por fase)
- [ ] Estagio 3: Smoke test de regressao em fases anteriores (a partir da fase 3)
- [ ] Estagio 3: Reassessment apos cada fase (roadmap re-avaliado)
- [ ] Estagio 3: Commits atomicos por tarefa
- [ ] Estagio 3: LOCK.md atualizado a cada transicao de estado
- [ ] Estagio 3: Insights capturados em .plano/captures/ (se descobertos)
- [ ] Estagio 4: Auditoria de melhorias executada (3 dimensoes)
- [ ] Estagio 4: Quick wins aplicadas
- [ ] Estagio 4: UX Review executado (navegar como usuario, 6 dimensoes)
- [ ] Estagio 4: Melhorias UX implementadas automaticamente
- [ ] Estagio 4: UX-REPORT.md gerado com scores e screenshots
- [ ] Estagio 4: Mobile First executado (responsividade verificada em 3 viewports)
- [ ] Estagio 4: MOBILE-REPORT.md gerado com score e screenshots comparativos
- [ ] Estagio 4: Visual Critic global executado (VISUAL-REPORT.md)
- [ ] Estagio 4: Exhaustive Tester global executado (EXHAUSTIVE-REPORT.md)
- [ ] Estagio 4: API Tester global executado (API-REPORT.md)
- [ ] Estagio 4: Issues carryover das fases processadas
- [ ] Estagio 4: Score composto calculado (9 dimensoes)
- [ ] Estagio 4: Quality gate loop executado (ate score >= 9.0 ou max 5 ciclos)
- [ ] Estagio 4: DevOps artifacts gerados (Dockerfile, CI/CD, .env.example, seed)
- [ ] Estagio 4: Documentacao gerada (README, CHANGELOG, API docs)
- [ ] Estagio 4: Security review executado
- [ ] Estagio 4: QA — testes escritos e rodados
- [ ] Estagio 4: Ideias geradas com ICE scoring (apos quality gate)
- [ ] Estagio 5: Teste E2E final (smoke + fluxos + responsividade)
- [ ] Estagio 5: E2E-REPORT.md gerado com screenshots
- [ ] Estagio 5: Captures triados em TRIAGE.md
- [ ] Estagio 5: DELIVERY.md gerado (incluindo E2E + captures + reassessments)
- [ ] Estagio 5: LOCK.md removido (sessao concluida)
- [ ] Estagio 5: Resumo apresentado ao usuario

**Minimo viavel:** Estagios 1-3 + Estagio 5. Estagios 4 (Polish) e E2E sao bonus.

</success_criteria>
